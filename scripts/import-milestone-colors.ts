import { google } from "googleapis"
import { readFileSync, existsSync, appendFileSync } from "fs"
import { join } from "path"
import { Database } from "bun:sqlite"

const CREDENTIALS_PATH = join(import.meta.dir, "..", "..", "weassist", "secrets", "credentials.json")
const TOKEN_PATH = join(import.meta.dir, "..", "..", "weassist", "secrets", "token.json")
const SCHEDULE_SHEET_ID = "1s2efOurG2Zh20uQ45CXCItcHqlcgQ1QjxQUy-PGnlJs"
const SCHEDULE_TAB = "Client Check-in Schedule"
const DB_PATH = join(import.meta.dir, "..", "data", "wsos-extension.db")
const LOG_PATH = join(import.meta.dir, "..", "logs", "import-milestone-colors.log")

// Sheet columns (0-indexed): 6=3mo, 7=4mo, 8=5mo, 9=6mo, 10=9mo, 11=1yr, 12=15mo
const MILESTONE_COLS: [number, string][] = [[6, "3mo"], [7, "4mo"], [8, "5mo"], [9, "6mo"], [10, "9mo"], [11, "1yr"], [12, "1yr3mo"]]

function isGreen(cellColor: { red?: number; green?: number; blue?: number } | undefined): boolean {
  if (!cellColor) return false
  const g = cellColor.green ?? 0
  const red = cellColor.red ?? 0
  const b = cellColor.blue ?? 0
  return g > red && g > b && (g - red) > 0.05 && (g - b) > 0.05
}

function log(msg: string) {
  const ts = new Date().toISOString()
  const line = `[${ts}] ${msg}`
  console.log(line)
  try { appendFileSync(LOG_PATH, line + "\n") } catch {}
}

async function main() {
  log("Starting milestone import...")

  // 1. Auth
  if (!existsSync(CREDENTIALS_PATH)) { log("FATAL: credentials.json not found"); process.exit(1) }
  if (!existsSync(TOKEN_PATH)) { log("FATAL: token.json not found — run OAuth first"); process.exit(1) }
  const creds = JSON.parse(readFileSync(CREDENTIALS_PATH, "utf-8"))
  const auth = new google.auth.OAuth2(creds.installed.client_id, creds.installed.client_secret, creds.installed.redirect_uris[0])
  auth.setCredentials(JSON.parse(readFileSync(TOKEN_PATH, "utf-8")))

  // 2. Fetch sheet values + cell colors
  const sheets = google.sheets({ version: "v4", auth })
  const [valuesRes, gridRes] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId: SCHEDULE_SHEET_ID, range: SCHEDULE_TAB, valueRenderOption: "FORMATTED_VALUE", dateTimeRenderOption: "FORMATTED_STRING" }),
    sheets.spreadsheets.get({ spreadsheetId: SCHEDULE_SHEET_ID, ranges: [SCHEDULE_TAB], includeGridData: true, fields: "sheets.data.rowData.values.effectiveFormat.backgroundColor" }),
  ])
  const rows = valuesRes.data.values || []
  const gridRows = gridRes.data.sheets?.[0]?.data?.[0]?.rowData || []
  log(`Fetched ${rows.length} rows from sheet`)

  // 3. Connect DB
  if (!existsSync(DB_PATH)) { log(`FATAL: DB not found at ${DB_PATH}`); process.exit(1) }
  const db = new Database(DB_PATH)
  db.run("PRAGMA journal_mode=WAL")

  // 4. Upsert milestones with was_green flag + milestone_date
  const upsertGreen = db.prepare(`
    INSERT INTO checkin_milestones (op_name, milestone, happened, was_green, milestone_date)
    VALUES (?, ?, 1, 1, ?)
    ON CONFLICT(op_name, milestone) DO UPDATE SET happened = 1, was_green = 1, milestone_date = ?
  `)
  const upsertNonGreen = db.prepare(`
    INSERT INTO checkin_milestones (op_name, milestone, happened, was_green, milestone_date)
    VALUES (?, ?, 0, 0, ?)
    ON CONFLICT(op_name, milestone) DO UPDATE SET happened = 0, was_green = 0, milestone_date = ?
  `)

  let greenCount = 0, nonGreenCount = 0, errors = 0

  const tx = db.transaction(() => {
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r]
      const opName = (row[0] || "").toString().trim()
      if (!opName) continue
      try {
        for (const [col, milestone] of MILESTONE_COLS) {
          const dateVal = (row[col] || "").toString().trim()
          if (!dateVal) continue
          const cellColor = gridRows[r]?.values?.[col]?.effectiveFormat?.backgroundColor
          if (isGreen(cellColor)) {
            upsertGreen.run(opName, milestone, dateVal, dateVal)
            greenCount++
          } else {
            upsertNonGreen.run(opName, milestone, dateVal, dateVal)
            nonGreenCount++
          }
        }
      } catch (e) {
        log(`ERROR row ${r} (${opName}): ${e}`)
        errors++
      }
    }
  })

  try {
    tx()
    log(`Done: ${greenCount} green, ${nonGreenCount} non-green, ${errors} errors`)
  } catch (e) {
    log(`FATAL transaction failed: ${e}`)
  }

  // 5. Mark overdue as cancelled — any milestone where happened=0 and date has past
  //    gets was_green=0 so it shows as "cancelled" instead of "overdue"
  log("Marking overdue milestones as cancelled...")
  const markCancelled = db.prepare(`
    UPDATE checkin_milestones
    SET was_green = 0
    WHERE happened = 0
      AND was_green = 1
      AND milestone_date IS NOT NULL
      AND milestone_date != ''
  `)
  // Parse milestone_date (M/D/YYYY) and compare to today
  const today = new Date()
  const dateStr = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`
  let cancelled = 0
  const overdueRows = db.prepare("SELECT op_name, milestone, milestone_date FROM checkin_milestones WHERE happened = 0 AND was_green = 1 AND milestone_date IS NOT NULL AND milestone_date != ''").all() as { op_name: string; milestone: string; milestone_date: string }[]
  for (const row of overdueRows) {
    try {
      const parts = row.milestone_date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
      if (!parts) continue
      const msDate = new Date(+parts[3], +parts[1] - 1, +parts[2])
      if (msDate < today) {
        db.prepare("UPDATE checkin_milestones SET was_green = 0 WHERE op_name = ? AND milestone = ?").run(row.op_name, row.milestone)
        cancelled++
      }
    } catch {}
  }
  log(`Marked ${cancelled} overdue milestones as cancelled`)

  db.close()
}

main()
