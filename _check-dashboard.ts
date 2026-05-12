import { getDb, getDrizzle, schema } from "./src/db"
import { eq, sql } from "drizzle-orm"

const d = getDrizzle()
const r = getDb()

console.log("=== 1. Post-Onboarding ===")
const active = d.select({ c: sql<number>`count(*)` }).from(schema.assignments).where(eq(schema.assignments.status, "Active")).get()?.c ?? 0
const onboarding = d.select({ c: sql<number>`count(*)` }).from(schema.obRecords)
  .where(sql`status IS NULL OR (status != 'Completed' AND status != 'Cancelled' AND status != 'Graduated')`).get()?.c ?? 0
console.log("Active assignments:", active)
console.log("In onboarding (non-completed records):", onboarding)
console.log("Post-onboarding:", Math.max(0, active - onboarding))

console.log("\n=== 2. Pending HO Calls ===")
const pending = (r.prepare(`SELECT COUNT(*) as c FROM wa_ob_statuses s JOIN wa_ob_step_defs d ON d.id = s.step_def_id WHERE d.name = 'SCHEDULE HAND-OFF CALL W/ CLIENT?' AND s.status != 'Done'`).get() as any)?.c ?? 0
console.log("Pending HO calls:", pending)
const totalHO = (r.prepare(`SELECT COUNT(*) as c FROM wa_ob_statuses s JOIN wa_ob_step_defs d ON d.id = s.step_def_id WHERE d.name = 'SCHEDULE HAND-OFF CALL W/ CLIENT?'`).get() as any)?.c ?? 0
console.log("Total HO steps:", totalHO)

const names = r.prepare("SELECT DISTINCT name FROM wa_ob_step_defs WHERE name LIKE '%HAND-OFF%'").all() as any[]
console.log("Hand-off step names:", names.map((n: any) => n.name))

console.log("\n=== 3. Overdue Check-ins ===")
const sampleDates = r.prepare("SELECT after_3_mon, after_4_mon, after_5_mon FROM wa_post_90day_schedule WHERE after_3_mon IS NOT NULL LIMIT 5").all() as any[]
console.log("Sample schedule dates:", JSON.stringify(sampleDates, null, 2))

const today = new Date().toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" }).split("/").map((n: string) => n.padStart(2, "0")).join("/")
console.log("Today's formatted date:", today)

const s = schema.checkinSchedule
const overdue = d.select({ c: sql<number>`count(*)` }).from(s)
  .where(sql`(after_3_mon IS NOT NULL AND after_3_mon != '' AND after_3_mon < ${today})`)
  .get()?.c ?? 0
console.log("Overdue check-ins (first column only):", overdue)

console.log("\n=== 4. ob_records status distribution ===")
const statuses = r.prepare("SELECT status, COUNT(*) as c FROM wa_ob_records GROUP BY status").all() as any[]
console.log("OB record statuses:", JSON.stringify(statuses, null, 2))

console.log("\n=== 5. Check-in schedule total rows ===")
const totalSched = (r.prepare("SELECT COUNT(*) as c FROM wa_post_90day_schedule").get() as any)?.c ?? 0
console.log("Total check-in schedule rows:", totalSched)
const withDates = (r.prepare("SELECT COUNT(*) as c FROM wa_post_90day_schedule WHERE after_3_mon IS NOT NULL AND after_3_mon != ''").get() as any)?.c ?? 0
console.log("Rows with after_3_mon set:", withDates)
