import { getDb } from "./src/db"
const r = getDb()
console.log("checkin_milestones:", JSON.stringify(r.prepare("PRAGMA table_info(checkin_milestones)").all(), null, 2))
console.log("wa_post_90day_schedule cols:", JSON.stringify(r.prepare("PRAGMA table_info(wa_post_90day_schedule)").all().map((c:any)=>c.name), null, 2))
const totalMilestones = (r.prepare("SELECT COUNT(*) as c FROM checkin_milestones").get() as any)?.c ?? 0
const greenOnes = (r.prepare("SELECT COUNT(*) as c FROM checkin_milestones WHERE happened = 1").get() as any)?.c ?? 0
const zeroOnes = (r.prepare("SELECT COUNT(*) as c FROM checkin_milestones WHERE happened = 0").get() as any)?.c ?? 0
console.log(`Total milestones: ${totalMilestones}, happened=1: ${greenOnes}, happened=0: ${zeroOnes}`)

// Check 15mo milestone examples
const samples = r.prepare(`SELECT s.op_name, s.after_1_year_3_months, m.happened
  FROM wa_post_90day_schedule s
  LEFT JOIN checkin_milestones m ON m.op_name = s.op_name AND m.milestone = '1yr3mo'
  WHERE s.after_1_year_3_months IS NOT NULL AND s.after_1_year_3_months != ''
  LIMIT 10`).all() as any[]
console.log("15mo samples:", JSON.stringify(samples, null, 2))
