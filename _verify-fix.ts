import { getDb } from "./src/db"

const r = getDb()

const colToDate = (col: string) =>
  `date(substr(${col},-4)||'-'||substr('0'||substr(${col},1,instr(${col},'/')-1),-2)||'-'||substr('0'||substr(substr(${col},instr(${col},'/')+1),1,instr(substr(${col},instr(${col},'/')+1),'/')-1),-2))`

// 1. Post-Onboarding
const postOnboarding = (r.prepare(`
  SELECT COUNT(*) as c FROM wa_assignments a
  WHERE a.status = 'Active'
  AND a.op_name NOT IN (
    SELECT r.op_name FROM wa_ob_records r
    WHERE (r.status IS NULL OR r.status NOT IN ('Completed', 'Cancelled', 'Graduated'))
  )
`).get() as any)?.c ?? 0
console.log("Post-Onboarding:", postOnboarding)

// 2. Pending HO Calls
const pendingHandoff = (r.prepare(`
  SELECT COUNT(*) as c FROM wa_ob_statuses s
  JOIN wa_ob_step_defs d ON d.id = s.step_def_id
  WHERE d.name LIKE '%Hand-Off Call W/ Client?'
  AND s.status != 'Done'
`).get() as any)?.c ?? 0
console.log("Pending HO Calls:", pendingHandoff)

// 3. Overdue Check-ins
const overdue = (r.prepare(`
  SELECT COUNT(*) as c FROM wa_post_90day_schedule
  WHERE (after_3_mon IS NOT NULL AND after_3_mon != '' AND ${colToDate('after_3_mon')} < date('now'))
     OR (after_4_mon IS NOT NULL AND after_4_mon != '' AND ${colToDate('after_4_mon')} < date('now'))
     OR (after_5_mon IS NOT NULL AND after_5_mon != '' AND ${colToDate('after_5_mon')} < date('now'))
     OR (after_6_mon IS NOT NULL AND after_6_mon != '' AND ${colToDate('after_6_mon')} < date('now'))
     OR (after_9_mon IS NOT NULL AND after_9_mon != '' AND ${colToDate('after_9_mon')} < date('now'))
     OR (after_1_year IS NOT NULL AND after_1_year != '' AND ${colToDate('after_1_year')} < date('now'))
     OR (after_1_year_3_months IS NOT NULL AND after_1_year_3_months != '' AND ${colToDate('after_1_year_3_months')} < date('now'))
`).get() as any)?.c ?? 0
console.log("Overdue Check-ins:", overdue)

// Verify date conversion works
const sample = r.prepare(`
  SELECT after_3_mon, ${colToDate('after_3_mon')} as converted FROM wa_post_90day_schedule WHERE after_3_mon IS NOT NULL LIMIT 3
`).all() as any[]
console.log("Date conversion samples:", sample)

// Check what the attention items look like now
const michelleItems = r.prepare(`
  SELECT COUNT(*) as c FROM wa_ob_statuses s
  JOIN wa_ob_step_defs d ON d.id = s.step_def_id
  WHERE d.name LIKE '%Hand-Off Call W/ Client?'
  AND s.status != 'Done'
  AND (s.status IS NULL OR s.status NOT IN ('Completed', 'Cancelled', 'Graduated'))
`).all() as any[]
console.log("Michelle attention items:", michelleItems)
