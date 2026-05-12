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

  // 4. Upsert milestones — INSERT OR REPLACE so new rows are created
  const upsert = db.prepare(`
    INSERT INTO checkin_milestones (op_name, milestone, happened)
    VALUES (?, ?, 1)
    ON CONFLICT(op_name, milestone) DO UPDATE SET happened = 1
  `)
  const clearOthers = db.prepare(`
    UPDATE checkin_milestones SET happened = 0
    WHERE op_name = ? AND milestone = ? AND happened = 1
  `)

  let inserted = 0, updated = 0, cleared = 0, errors = 0

  const tx = db.transaction(() => {
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r]
      const opName = (row[0] || "").toString().trim()
      if (!opName) continue
      try {
        for (const [col, milestone] of MILESTONE_COLS) {
          const dateVal = (row[col] || "").toString().trim()
          const cellColor = gridRows[r]?.values?.[col]?.effectiveFormat?.backgroundColor
          const green = isGreen(cellColor)
          if (green) {
            upsert.run(opName, milestone)
            inserted++
          } else if (dateVal) {
            // Has a date but not green — clear the happened flag
            const res = clearOthers.run(opName, milestone)
            if (res.changes > 0) cleared++
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
    log(`Done: ${inserted} upserted, ${cleared} cleared, ${errors} errors`)
  } catch (e) {
    log(`FATAL transaction failed: ${e}`)
  }

  db.close()
}

main()
