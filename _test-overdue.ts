import { Database } from "bun:sqlite"

const db = new Database(":memory:")
db.run("CREATE TABLE checkin_milestones (op_name TEXT, milestone TEXT, happened INTEGER, was_green INTEGER, milestone_date TEXT)")

// Seed: one future, one past (overdue), one already done
db.prepare("INSERT INTO checkin_milestones VALUES (?, ?, ?, ?, ?)").run("FutureOp", "3mo", 0, 1, "12/31/2027")  // future → stays
db.prepare("INSERT INTO checkin_milestones VALUES (?, ?, ?, ?, ?)").run("PastOp", "3mo", 0, 1, "1/15/2024")    // past overdue → cancelled
db.prepare("INSERT INTO checkin_milestones VALUES (?, ?, ?, ?, ?)").run("DoneOp", "3mo", 1, 1, "1/15/2024")    // done already → stays
db.prepare("INSERT INTO checkin_milestones VALUES (?, ?, ?, ?, ?)").run("NoDateOp", "3mo", 0, 1, "")            // no date → stays

// Run the same overdue-cancellation logic from ensureSchema
const today = new Date()
const overdueMs = db.prepare("SELECT op_name, milestone, milestone_date FROM checkin_milestones WHERE happened = 0 AND was_green = 1 AND milestone_date IS NOT NULL AND milestone_date != ''").all() as any[]
let cancelled = 0
for (const ms of overdueMs) {
  const parts = ms.milestone_date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (parts) {
    const msDate = new Date(+parts[3], +parts[1] - 1, +parts[2])
    if (msDate < today) {
      db.prepare("UPDATE checkin_milestones SET was_green = 0 WHERE op_name = ? AND milestone = ?").run(ms.op_name, ms.milestone)
      cancelled++
    }
  }
}

// Verify
const results = db.prepare("SELECT op_name, happened, was_green, milestone_date FROM checkin_milestones ORDER BY op_name").all() as any[]
console.log("Results:")
for (const r of results) {
  console.log(`  ${r.op_name}: happened=${r.happened} was_green=${r.was_green} date=${r.milestone_date}`)
}

// Assertions
const past = results.find(r => r.op_name === "PastOp")
if (past?.was_green !== 0) { console.error("FAIL: PastOp was not cancelled"); process.exit(1) }
const future = results.find(r => r.op_name === "FutureOp")
if (future?.was_green !== 1) { console.error("FAIL: FutureOp was wrongly cancelled"); process.exit(1) }
const done = results.find(r => r.op_name === "DoneOp")
if (done?.was_green !== 1) { console.error("FAIL: DoneOp was wrongly cancelled"); process.exit(1) }
const noDate = results.find(r => r.op_name === "NoDateOp")
if (noDate?.was_green !== 1) { console.error("FAIL: NoDateOp was wrongly cancelled"); process.exit(1) }
console.log(`\n✓ ${cancelled} overdue cancelled — future & no-date rows preserved`)
