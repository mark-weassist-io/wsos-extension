import { google } from "googleapis"
import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { Database } from "bun:sqlite"

const CREDENTIALS_PATH = join(import.meta.dir, "..", "..", "weassist", "secrets", "credentials.json")
const TOKEN_PATH = join(import.meta.dir, "..", "..", "weassist", "secrets", "token.json")
const SCHEDULE_SHEET_ID = "1s2efOurG2Zh20uQ45CXCItcHqlcgQ1QjxQUy-PGnlJs"
const SCHEDULE_TAB = "Client Check-in Schedule"
const MILESTONE_COLS: [number, string][] = [[6, "3mo"], [7, "4mo"], [8, "5mo"], [9, "6mo"], [10, "9mo"], [11, "1yr"]]

async function main() {
  const creds = JSON.parse(readFileSync(CREDENTIALS_PATH, "utf-8"))
  const oAuth2Client = new google.auth.OAuth2(creds.installed.client_id, creds.installed.client_secret, creds.installed.redirect_uris[0])
  if (existsSync(TOKEN_PATH)) oAuth2Client.setCredentials(JSON.parse(readFileSync(TOKEN_PATH, "utf-8")))
  else { console.error("No token.json"); process.exit(1) }

  const sheets = google.sheets({ version: "v4", auth: oAuth2Client })
  const valuesRes = await sheets.spreadsheets.values.get({ spreadsheetId: SCHEDULE_SHEET_ID, range: SCHEDULE_TAB, valueRenderOption: "FORMATTED_VALUE", dateTimeRenderOption: "FORMATTED_STRING" })
  const rows = valuesRes.data.values || []
  const gridRes = await sheets.spreadsheets.get({ spreadsheetId: SCHEDULE_SHEET_ID, ranges: [SCHEDULE_TAB], includeGridData: true, fields: "sheets.data.rowData.values.effectiveFormat.backgroundColor" })
  const gridRows = gridRes.data.sheets?.[0]?.data?.[0]?.rowData || []

  const db = new Database(join(import.meta.dir, "..", "data", "wsos-extension.db"))
  const update = db.prepare("UPDATE checkin_milestones SET happened = 1 WHERE op_name = ? AND milestone = ?")
  let greenCount = 0

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]; const opName = (row[0] || "").toString().trim()
    if (!opName) continue
    for (const [col, milestone] of MILESTONE_COLS) {
      const cellColor = gridRows[r]?.values?.[col]?.effectiveFormat?.backgroundColor
      if (!cellColor) continue
      const g = cellColor.green ?? 0; const red = cellColor.red ?? 0; const b = cellColor.blue ?? 0
      if (g > red && g > b && (g - red) > 0.05 && (g - b) > 0.05) {
        const result = update.run(opName, milestone)
        if (result.changes > 0) greenCount++
      }
    }
  }
  console.log(`Updated ${greenCount} milestones as happened`)
  db.close()
}
main().catch(console.error)
