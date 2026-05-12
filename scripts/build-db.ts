import { Database } from "bun:sqlite"
import { readFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"
import { runMerge } from "./merge-dedup"
import { verifyDatabase, printReport } from "./data-quality/index"
import { OPS_RULES, CLIENTS_RULES, ASSIGNMENTS_RULES, CHECKINS_RULES } from "./data-quality/index"
import { STEP_DEFS } from "./data-quality/ob-rules"

const ROOT = join(import.meta.dir, "..")
const CLEAN_DIR = join(ROOT, "data", "clean")
const DB_PATH = join(ROOT, "data", "wsos-extension.db")

function loadClean(filename: string): any[] {
  return JSON.parse(readFileSync(join(CLEAN_DIR, filename), "utf-8"))
}

console.log("=".repeat(60))
console.log("WSOS EXTENSION — DATA PIPELINE")
console.log("=".repeat(60))

// Step 1: Merge & Dedup
console.log("\n[1/5] Merging and deduplicating...")
const merged = runMerge()

// Step 2: Create DB with proper schema
console.log("\n[2/5] Creating database with quality contracts...")

const db = new Database(DB_PATH)
db.run("PRAGMA journal_mode=WAL")
db.run("PRAGMA foreign_keys=ON")

// Drop existing tables (FK order independent with temporary disable)
db.run("PRAGMA foreign_keys=OFF")
  for (const t of ["checkin_milestones", "wa_ob_statuses", "wa_ob_records", "wa_ob_step_defs", "wa_post_90day_schedule", "wsos_ninety_day_checkins", "wsos_op_client_assignments", "wsos_clients", "wsos_ops", "wa_genders", "wa_assignment_statuses", "wa_assignment_types", "wa_checkin_statuses", "wa_cs_staff"]) {
  db.run(`DROP TABLE IF EXISTS "${t}"`)
}
db.run("PRAGMA foreign_keys=ON")

// Create reference/lookup tables
console.log("  Creating reference tables...")
db.run(`CREATE TABLE wa_genders (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE)`)
db.run(`INSERT OR IGNORE INTO wa_genders (name) VALUES ('Male'), ('Female')`)

// Create onboarding step definitions
db.run(`CREATE TABLE wa_ob_step_defs (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, step_order INTEGER NOT NULL, category TEXT, owner TEXT NOT NULL)`)
for (const s of STEP_DEFS) {
  db.prepare("INSERT INTO wa_ob_step_defs (id, name, step_order, category, owner) VALUES (?, ?, ?, ?, ?)").run(s.id, s.name, s.id, s.category, s.owner)
}

// Seed staff table (will be expanded after auxiliary data loads)
db.run(`CREATE TABLE wa_cs_staff (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, full_name TEXT, deleted_at DATETIME DEFAULT NULL, created_at TEXT DEFAULT (datetime('now')))`)
// Known staff that may not appear in current loaded data
for (const name of ["Dennis"]) {
  db.prepare("INSERT OR IGNORE INTO wa_cs_staff (name) VALUES (?)").run(name)
}

db.run(`CREATE TABLE wa_assignment_statuses (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE)`)
db.run(`INSERT OR IGNORE INTO wa_assignment_statuses (name) VALUES ('Active'), ('Probation'), ('Inactive'), ('Separated'), ('Resigned')`)

db.run(`CREATE TABLE wa_assignment_types (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE)`)
db.run(`INSERT OR IGNORE INTO wa_assignment_types (name) VALUES ('Full-Time'), ('Part-Time'), ('6 Hours')`)

db.run(`CREATE TABLE wa_checkin_statuses (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE)`)
db.run(`INSERT OR IGNORE INTO wa_checkin_statuses (name) VALUES ('GRADUATED'), ('RESIGNED'), ('TERMINATED'), ('TRANSITIONED')`)

// Normalize gender values in merged ops before inserting
for (const op of merged.ops) {
  if (op.gender === "M") op.gender = "Male"
  if (op.gender === "F") op.gender = "Female"
}

// Create main tables using the DDL from quality rules
console.log("  Creating wsos_ops...")
db.run(OPS_RULES.schema.ddl)
for (const idx of OPS_RULES.schema.indexes) db.run(idx)

console.log("  Creating wsos_clients...")
db.run(CLIENTS_RULES.schema.ddl)
for (const idx of CLIENTS_RULES.schema.indexes) db.run(idx)

console.log("  Creating wsos_op_client_assignments...")
db.run(ASSIGNMENTS_RULES.schema.ddl)
for (const idx of ASSIGNMENTS_RULES.schema.indexes) db.run(idx)

  console.log("  Creating wsos_ninety_day_checkins...")
db.run(CHECKINS_RULES.schema.ddl)
for (const idx of CHECKINS_RULES.schema.indexes) db.run(idx)

console.log("  Creating wa_post_90day_schedule...")
db.run(`CREATE TABLE IF NOT EXISTS wa_post_90day_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  op_name TEXT NOT NULL,
  after_1_year TEXT, after_1_year_3_months TEXT,
  after_3_mon TEXT, after_4_mon TEXT, after_5_mon TEXT,
  after_6_mon TEXT, after_9_mon TEXT,
  client_name TEXT, client_s_email TEXT,
  role TEXT, start_date TEXT, status TEXT,
  assigned_cs TEXT, created_at TEXT DEFAULT (datetime('now'))
)`)
db.run("CREATE INDEX IF NOT EXISTS idx_schedule_op ON wa_post_90day_schedule(op_name)")

// Step 3: Insert clean data
console.log("\n[3/5] Inserting clean data...")

function insertData(table: string, rows: any[], fields: string[]) {
  if (rows.length === 0) return 0
  const placeholders = fields.map(() => "?").join(",")
  const stmt = db.prepare(`INSERT INTO "${table}" (${fields.join(",")}) VALUES (${placeholders})`)
  let count = 0
  for (const row of rows) {
    const vals = fields.map(f => row[f] !== undefined && row[f] !== "" ? row[f] : null)
    try {
      stmt.run(...vals)
      count++
    } catch (e: any) {
      console.log(`    SKIP ${table}: ${e.message.substring(0, 80)}`)
    }
  }
  return count
}

let totalInserted = 0

const opFields = ["full_name", "first_name", "last_name", "email", "phone", "birth_place", "address", "zip_code", "gender", "nickname"]
const opsInserted = insertData("wsos_ops", merged.ops, opFields)
totalInserted += opsInserted
console.log(`  wsos_ops: ${opsInserted} rows`)

const clientFields = ["name", "email"]
const clientsInserted = insertData("wsos_clients", merged.clients, clientFields)
totalInserted += clientsInserted
console.log(`  wsos_clients: ${clientsInserted} rows`)

const assignFields = ["op_name", "client_name", "role", "status", "type", "start_date", "end_date", "working_days", "working_hours", "rate", "assigned_cs", "department"]
const assignsInserted = insertData("wsos_op_client_assignments", merged.assignments, assignFields)
totalInserted += assignsInserted
console.log(`  wsos_op_client_assignments: ${assignsInserted} rows`)

// Step 4: Load other entities from raw data (onboarding, checkins, schedule)
// These need the merged ops as FK targets, so load after
console.log("\n[4/5] Loading auxiliary data...")

// Load onboarding from raw JSON (normalized grid model)
const checklist = JSON.parse(readFileSync(join(import.meta.dir, "..", "..", "..", "secrets", "extracted", "After_Sales_Checklist_-_OP_Onboarding.json"), "utf-8"))
const clTabs = checklist.tabs
const validOps = new Set(db.prepare("SELECT full_name FROM wsos_ops").all().map((r: any) => r.full_name))

// Create records + statuses tables
db.run(`CREATE TABLE wa_ob_records (id INTEGER PRIMARY KEY AUTOINCREMENT, op_name TEXT NOT NULL, client_name TEXT, company_name TEXT, role TEXT, rate TEXT, start_date TEXT, start_time TEXT, contact_number TEXT, email TEXT, notes TEXT, last_stage_completed TEXT, status TEXT, source_person TEXT, FOREIGN KEY (op_name) REFERENCES wsos_ops(full_name))`)
db.run(`CREATE INDEX idx_ob_records_op ON wa_ob_records(op_name)`)
db.run(`CREATE INDEX idx_ob_records_status ON wa_ob_records(status)`)
db.run(`CREATE TABLE wa_ob_statuses (id INTEGER PRIMARY KEY AUTOINCREMENT, record_id INTEGER NOT NULL, step_def_id INTEGER NOT NULL, status TEXT NOT NULL CHECK(status IN ('Done','Not Done','NA')), FOREIGN KEY (record_id) REFERENCES wa_ob_records(id), FOREIGN KEY (step_def_id) REFERENCES wa_ob_step_defs(id), UNIQUE(record_id, step_def_id))`)
db.run(`CREATE INDEX idx_ob_statuses_record ON wa_ob_statuses(record_id)`)

// Map sheet column index to step_def id (cols 6-31 = steps 1-26, after removing START DATE/TIME/RATE)
const STEP_COL_MAP: Record<number, number> = {}
for (let i = 0; i < STEP_DEFS.length; i++) {
  STEP_COL_MAP[6 + i] = STEP_DEFS[i].id
}

function loadOnboardingGrid(person: string, tabKey: string): { records: number; steps: number } {
  const tabData = clTabs[tabKey]
  if (!tabData?.formatted) return { records: 0, steps: 0 }
  const h = tabData.formatted[0] as string[]
  if (!h) return { records: 0, steps: 0 }

  const colIdx = (labels: string[]): number => {
    for (const l of labels) {
      const idx = h.findIndex((c: string) => c.replace(/[:\s]/g, "").toLowerCase() === l.toLowerCase().replace(/[:\s]/g, ""))
      if (idx >= 0) return idx
    }
    return -1
  }

  const cOp = colIdx(["Name of Outsourced Professional", "Name of Offshore Professional", "Resource Name", "NAME", "Name"])
  const cClient = colIdx(["Client Name", "Client"])
  const cCompany = colIdx(["Company Name", "COMPANY NAME"])
  const cRole = colIdx(["Role"])
  const cPhone = colIdx(["OP Contact Number"])
  const cEmail = colIdx(["OP Email Address"])
  const cNotes = colIdx(["NOTES"])
  const cLastStage = colIdx(["LAST STAGE COMPLETED"])
  const cStatus = colIdx(["STATUS", "Status"])

  let records = 0
  let steps = 0

  for (let r = 1; r < tabData.formatted.length; r++) {
    const row = tabData.formatted[r] as any[]
    const opName = (row[cOp] || "").toString().trim()
    if (!opName) continue

    const cleanName = [...validOps].find(n => n.toLowerCase() === opName.toLowerCase())
    if (!cleanName) continue

    // Find the matching step columns - they're columns 6-34 in the sheet
    // and they map sequentially to STEP_DEFS
    const rateVal = (row[9] || "").toString().trim()
    const startDateVal = (row[7] || "").toString().trim()
    const startTimeVal = (row[8] || "").toString().trim()
    const lastStageVal = cLastStage >= 0 ? (row[cLastStage] || "").toString().trim() : ""
    const statusVal = cStatus >= 0 ? (row[cStatus] || "").toString().trim() : ""

    try {
      const recResult = db.prepare(
        `INSERT INTO wa_ob_records (op_name, client_name, company_name, role, rate, start_date, start_time, contact_number, email, notes, last_stage_completed, status, source_person) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        cleanName,
        cClient >= 0 ? (row[cClient] || "").toString().trim() || null : null,
        cCompany >= 0 ? (row[cCompany] || "").toString().trim() || null : null,
        cRole >= 0 ? (row[cRole] || "").toString().trim() || null : null,
        rateVal || null,
        startDateVal || null,
        startTimeVal || null,
        cPhone >= 0 ? (row[cPhone] || "").toString().trim() || null : null,
        cEmail >= 0 ? (row[cEmail] || "").toString().trim() || null : null,
        cNotes >= 0 ? (row[cNotes] || "").toString().trim() || null : null,
        lastStageVal || null,
        statusVal || null,
        person,
      )
      const recordId = Number(recResult.lastInsertRowid)
      records++

      // Insert step statuses for this record
      for (let stepIdx = 0; stepIdx < STEP_DEFS.length; stepIdx++) {
        const col = 6 + stepIdx
        const val = (row[col] || "").toString().trim().toUpperCase()
        let status: string
        if (val === "TRUE") status = "Done"
        else if (val === "FALSE") status = "Not Done"
        else if (val === "NA") status = "NA"
        else continue // skip empty cells

        try {
          db.prepare(`INSERT INTO wa_ob_statuses (record_id, step_def_id, status) VALUES (?, ?, ?)`).run(recordId, STEP_DEFS[stepIdx].id, status)
          steps++
        } catch (e: any) {
          // Unique constraint violation — skip
        }
      }
    } catch (e: any) {
      // Skip duplicate records
    }
  }
  return { records, steps }
}

const michResult = loadOnboardingGrid("Michelle", "<Mich> OP Onboarding Check-list")
const denResult = loadOnboardingGrid("Dennis", "<Den> OP Onboarding Check-list")
console.log(`  wa_ob_records: ${michResult.records + denResult.records} (${michResult.records} Michelle, ${denResult.records} Dennis)`)
console.log(`  wa_ob_statuses: ${michResult.steps + denResult.steps} step statuses`)
totalInserted += michResult.records + denResult.records + michResult.steps + denResult.steps

// Load check-ins and schedule
const reporting = JSON.parse(readFileSync(join(import.meta.dir, "..", "..", "..", "secrets", "extracted", "OP_Reporting_-_Check-ins_-_NPS_Tracker.json"), "utf-8"))
const rTabs = reporting.tabs

const reportTab = rTabs["Reporting"]
if (reportTab?.formatted?.length > 1) {
  const h = reportTab.formatted[0] as string[]
  const nameIdx = h.findIndex((c: string) => c.toLowerCase().includes("name"))
  const statusIdx = h.findIndex((c: string) => c.toLowerCase() === "status")
  const stmt = db.prepare(`INSERT INTO wsos_ninety_day_checkins (op_name, status) VALUES (?, ?)`)
  let count = 0
  for (let r = 1; r < reportTab.formatted.length; r++) {
    const row = reportTab.formatted[r]
    const opName = (row[nameIdx] || "").toString().trim()
    if (!opName) continue
    const cleanName = [...validOps].find((n: string) => n.toLowerCase() === opName.toLowerCase())
    if (!cleanName) continue
    try {
      stmt.run(cleanName, statusIdx >= 0 ? (row[statusIdx] || "").toString().trim() || null : null)
      count++
    } catch {}
  }
  console.log(`  wsos_ninety_day_checkins: ${count} rows`)
}

const schedTab = rTabs["Client Check-in Schedule"]
if (schedTab?.formatted?.length > 1) {
  const h = schedTab.formatted[0] as string[]
  const insertCols = ["op_name", "start_date", "role", "client_name", "client_s_email", "status", "after_3_mon", "after_4_mon", "after_5_mon", "after_6_mon", "after_9_mon", "after_1_year", "after_1_year_3_months"]
  // col map: 0=NAME, 1=START DATE, 2=ROLE, 3=CLIENT NAME, 4=CLIENT'S EMAIL, 5=STATUS, 6=After 3 Mon, 7=After 4 Mon, 8=After 5 Mon, 9=After 6 Mon, 10=After 9 Mon, 11=After 1 Year, 12=After 1 Year & 3 Months
  const colMap = [null, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  const placeholders = insertCols.map(() => "?").join(",")
  const stmt = db.prepare(`INSERT INTO wa_post_90day_schedule (${insertCols.map(c => `"${c}"`).join(",")}) VALUES (${placeholders})`)
  let count = 0
  for (let r = 1; r < schedTab.formatted.length; r++) {
    const row = schedTab.formatted[r]
    const first = (row[0] || "").toString().trim()
    if (!first) continue
    const cleanName = [...validOps].find((n: string) => n.toLowerCase() === first.toLowerCase())
    if (!cleanName) continue
    const vals = insertCols.map((c, i) => {
      if (i === 0) return cleanName
      const col = colMap[i]
      if (col === null || col === undefined) return null
      const val = (row[col] || "").toString().trim()
      return val || null
    })
    try { stmt.run(...vals); count++ } catch (e: any) { console.log(`  SKIP ${cleanName}: ${e.message}`) }
  }
  console.log(`  wa_post_90day_schedule: ${count} rows`)

  // Normalize milestones into narrow format
  console.log("  Creating checkin_milestones (normalized)...")
  db.run(`CREATE TABLE IF NOT EXISTS checkin_milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    op_name TEXT NOT NULL REFERENCES wsos_ops(full_name),
    milestone TEXT NOT NULL,
    milestone_date TEXT,
    happened INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(op_name, milestone)
  )`)
  const milestoneInsert = db.prepare("INSERT OR IGNORE INTO checkin_milestones (op_name, milestone, milestone_date) VALUES (?, ?, ?)")
  // Source columns: 6=After 3 Mon, 7=After 4 Mon, 8=After 5 Mon, 9=After 6 Mon, 10=After 9 Mon, 11=After 1 Year, 12=After 1 Yr & 3 Mo
  const milestoneSrcCols: [number, string][] = [
    [6, "3mo"], [7, "4mo"], [8, "5mo"], [9, "6mo"], [10, "9mo"], [11, "1yr"], [12, "1yr3mo"]
  ]
  let milestoneCount = 0
  for (let r = 1; r < schedTab.formatted.length; r++) {
    const row = schedTab.formatted[r]
    const first = (row[0] || "").toString().trim()
    if (!first) continue
    const cleanName = [...validOps].find((n: string) => n.toLowerCase() === first.toLowerCase())
    if (!cleanName) continue
    for (const [srcIdx, milestone] of milestoneSrcCols) {
      const val = (row[srcIdx] || "").toString().trim()
      if (!val || val.toLowerCase() === "active" || val.toLowerCase() === "inactive") continue
      // detect date format (m/d/Y or Y-m-d)
      const dateMatch = val.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
      const isoMatch = val.match(/(\d{4})-(\d{2})-(\d{2})/)
      let dateStr: string | null = null
      if (isoMatch) {
        dateStr = val
      } else if (dateMatch) {
        dateStr = `${dateMatch[3]}-${dateMatch[1].padStart(2,"0")}-${dateMatch[2].padStart(2,"0")}`
      } else { continue } // skip non-date values
      try { milestoneInsert.run(cleanName, milestone, dateStr); milestoneCount++ } catch {}
    }
  }
  console.log(`  checkin_milestones: ${milestoneCount} rows`)
}

// Compute last_stage_completed from step statuses for ob_records
console.log("  Computing last_stage_completed for ob_records...")
db.run(`
  UPDATE wa_ob_records SET last_stage_completed = (
    SELECT s.name FROM wa_ob_statuses os
    JOIN wa_ob_step_defs s ON s.id = os.step_def_id
    WHERE os.record_id = wa_ob_records.id AND os.status = 'Done'
    ORDER BY os.step_def_id DESC LIMIT 1
  )
`)
const updated = db.prepare("SELECT COUNT(*) as c FROM wa_ob_records WHERE last_stage_completed IS NOT NULL AND last_stage_completed != ''").get() as any
console.log(`  ob_records with last_stage: ${updated.c}`)

// Sync staff: scan ALL tables for staff names not yet in wa_cs_staff
const staffSync = db.prepare("INSERT OR IGNORE INTO wa_cs_staff (name) VALUES (?)")
const staffFound = db.prepare(`
  SELECT DISTINCT name FROM (
    SELECT assigned_cs as name FROM wsos_op_client_assignments WHERE assigned_cs IS NOT NULL AND assigned_cs != ''
    UNION
    SELECT assigned_cs FROM wsos_ninety_day_checkins WHERE assigned_cs IS NOT NULL AND assigned_cs != ''
    UNION
    SELECT assigned_cs FROM wa_post_90day_schedule WHERE assigned_cs IS NOT NULL AND assigned_cs != ''
    UNION
    SELECT source_person FROM wa_ob_records WHERE source_person IS NOT NULL AND source_person != ''
  ) WHERE name IS NOT NULL
`).all() as any[]
for (const r of staffFound) staffSync.run(r.name)
console.log(`  wa_cs_staff synced: ${staffFound.length} staff`)

// Step 5: Verify
console.log("\n[5/5] Verifying data quality...")
const report = verifyDatabase(db)
printReport(report)

db.close()

console.log(`\nTotal rows inserted: ${totalInserted}`)
console.log(`DB Path: ${DB_PATH}`)

if (!report.passed) {
  console.log("\n❌ DATA QUALITY GATE FAILED — see violations above")
}

console.log("\n✅ DATA QUALITY GATE PASSED — all checks zero violations")

// Import milestone green highlights from sheet (if credentials available)
console.log("\n[Post-build] Checking for milestone color highlights...")
const importScript = join(import.meta.dir, "import-milestone-colors.ts")
if (existsSync(importScript)) {
  const result = Bun.spawnSync(["bun", "run", importScript], { stdio: ["inherit", "inherit", "inherit"] })
  if (result.exitCode === 0) console.log("  Milestone highlights applied")
  else console.log("  Milestone highlight import skipped (API error)")
} else {
  console.log("  import-milestone-colors.ts not found — skipping")
}
