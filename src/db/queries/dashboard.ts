import { getDrizzle, getDb, schema } from ".."
import { count, eq, and, or, sql, desc } from "drizzle-orm"

const d = () => getDrizzle()

export interface DashboardMetrics {
  total_ops: number
  active_ops: number
  onboarding_in_progress: number
  post_onboarding_active: number
  separated_ops: number
  overdue_checkins: number
  pending_handoff_calls: number
}

export interface PipelineStage {
  stage: string
  count: number
  detail: string
}

export interface AttentionItem {
  op_name: string
  client_name: string | null
  task: string
  owner: string
  days_overdue: number
}

export interface CsWorkload {
  cs_name: string
  active_ops: number
  onboarding_ops: number
}

export interface RecentActivity {
  op_name: string
  client_name: string | null
  source_person: string | null
  last_stage: string | null
  updated_at: string | null
}

// Convert M/D/YYYY to YYYY-MM-DD for proper date comparison
const colToDate = (col: string) =>
  `date(substr(${col},-4)||'-'||substr('0'||substr(${col},1,instr(${col},'/')-1),-2)||'-'||substr('0'||substr(substr(${col},instr(${col},'/')+1),1,instr(substr(${col},instr(${col},'/')+1),'/')-1),-2))`

export function getMetrics(): DashboardMetrics {
  const total = d().select({ c: count() }).from(schema.ops).get()?.c ?? 0
  const active = d().select({ c: count() }).from(schema.assignments).where(eq(schema.assignments.status, "Active")).get()?.c ?? 0
  const separated = d().select({ c: count() }).from(schema.assignments).where(eq(schema.assignments.status, "Separated")).get()?.c ?? 0

  const onboardingCount = d().select({ c: count() }).from(schema.obRecords)
    .where(sql`${schema.obRecords.status} IS NULL OR (${schema.obRecords.status} != 'Completed' AND ${schema.obRecords.status} != 'Cancelled' AND ${schema.obRecords.status} != 'Graduated')`)
    .get()?.c ?? 0

  // Post-onboarding: active OPs NOT currently in active onboarding
  const r = getDb()
  const postOnboarding = (r.prepare(`
    SELECT COUNT(DISTINCT a.op_name) as c FROM wsos_op_client_assignments a
    WHERE a.status = 'Active'
    AND a.op_name NOT IN (
      SELECT r.op_name FROM wa_ob_records r
      WHERE (r.status IS NULL OR r.status NOT IN ('Completed', 'Cancelled', 'Graduated'))
    )
  `).get() as { c: number })?.c ?? 0

  // Overdue check-ins: convert M/D/YYYY to YYYY-MM-DD and compare with today
  const colToDate = (col: string) =>
    `date(substr(${col},-4)||'-'||substr('0'||substr(${col},1,instr(${col},'/')-1),-2)||'-'||substr('0'||substr(substr(${col},instr(${col},'/')+1),1,instr(substr(${col},instr(${col},'/')+1),'/')-1),-2))`
  const overdue = (r.prepare(`
    SELECT COUNT(*) as c FROM wa_post_90day_schedule
    WHERE (after_3_mon IS NOT NULL AND after_3_mon != '' AND ${colToDate('after_3_mon')} < date('now'))
       OR (after_4_mon IS NOT NULL AND after_4_mon != '' AND ${colToDate('after_4_mon')} < date('now'))
       OR (after_5_mon IS NOT NULL AND after_5_mon != '' AND ${colToDate('after_5_mon')} < date('now'))
       OR (after_6_mon IS NOT NULL AND after_6_mon != '' AND ${colToDate('after_6_mon')} < date('now'))
       OR (after_9_mon IS NOT NULL AND after_9_mon != '' AND ${colToDate('after_9_mon')} < date('now'))
       OR (after_1_year IS NOT NULL AND after_1_year != '' AND ${colToDate('after_1_year')} < date('now'))
       OR (after_1_year_3_months IS NOT NULL AND after_1_year_3_months != '' AND ${colToDate('after_1_year_3_months')} < date('now'))
  `).get() as { c: number })?.c ?? 0

  // Pending handoff calls: OPs whose HO call step is not yet Done
  const pendingHandoff = (r.prepare(`
    SELECT COUNT(*) as c FROM wa_ob_statuses s
    JOIN wa_ob_step_defs d ON d.id = s.step_def_id
    WHERE d.name LIKE '%Hand-Off Call W/ Client?'
    AND s.status != 'Done'
  `).get() as { c: number })?.c ?? 0

  return {
    total_ops: total,
    active_ops: active,
    onboarding_in_progress: onboardingCount,
    post_onboarding_active: postOnboarding,
    separated_ops: separated,
    overdue_checkins: overdue,
    pending_handoff_calls: pendingHandoff,
  }
}

export function getPipelineStages(): PipelineStage[] {
  const active = d().select({ c: count() }).from(schema.assignments).where(eq(schema.assignments.status, "Active")).get()?.c ?? 0
  const separated = d().select({ c: count() }).from(schema.assignments).where(eq(schema.assignments.status, "Separated")).get()?.c ?? 0
  const probation = d().select({ c: count() }).from(schema.assignments).where(eq(schema.assignments.status, "Probation")).get()?.c ?? 0
  const onboarding = d().select({ c: count() }).from(schema.obRecords)
    .where(sql`${schema.obRecords.status} IS NULL OR (${schema.obRecords.status} != 'Completed' AND ${schema.obRecords.status} != 'Cancelled' AND ${schema.obRecords.status} != 'Graduated')`)
    .get()?.c ?? 0

  const r = getDb()
  const overdue = (r.prepare(`
    SELECT COUNT(*) as c FROM wa_post_90day_schedule
    WHERE (after_3_mon IS NOT NULL AND after_3_mon != '' AND ${colToDate('after_3_mon')} < date('now'))
       OR (after_4_mon IS NOT NULL AND after_4_mon != '' AND ${colToDate('after_4_mon')} < date('now'))
       OR (after_5_mon IS NOT NULL AND after_5_mon != '' AND ${colToDate('after_5_mon')} < date('now'))
       OR (after_6_mon IS NOT NULL AND after_6_mon != '' AND ${colToDate('after_6_mon')} < date('now'))
       OR (after_9_mon IS NOT NULL AND after_9_mon != '' AND ${colToDate('after_9_mon')} < date('now'))
       OR (after_1_year IS NOT NULL AND after_1_year != '' AND ${colToDate('after_1_year')} < date('now'))
       OR (after_1_year_3_months IS NOT NULL AND after_1_year_3_months != '' AND ${colToDate('after_1_year_3_months')} < date('now'))
  `).get() as { c: number })?.c ?? 0

  return [
    { stage: "Onboarding (Michelle)", count: onboarding, detail: "New OPs being onboarded" },
    { stage: "Probation", count: probation, detail: "OPs in probation period" },
    { stage: "Active", count: active, detail: "Fully onboarded and active" },
    { stage: "Overdue Check-ins", count: overdue, detail: "Check-ins past due date" },
    { stage: "Separated", count: separated, detail: "No longer assigned" },
  ]
}

export function getAttentionItems(): { michelle: AttentionItem[]; bel: AttentionItem[] } {
  const r = getDb()
  // Michelle: OPs with pending HO call scheduling
  const michelleItems = (r.prepare(`
    SELECT r.op_name, r.client_name,
      'Schedule Hand-Off Call W/ Client?' as task,
      'Michelle' as owner,
      0 as days_overdue
    FROM wa_ob_statuses s
    JOIN wa_ob_step_defs d ON d.id = s.step_def_id
    JOIN wa_ob_records r ON r.id = s.record_id
    WHERE d.name LIKE '%Hand-Off Call W/ Client?'
    AND s.status != 'Done'
    AND (r.status IS NULL OR r.status NOT IN ('Completed', 'Cancelled', 'Graduated'))
    ORDER BY r.id DESC
    LIMIT 10
  `).all() as AttentionItem[])

  // Bel: OPs with overdue check-in milestones
  const belItems = (r.prepare(`
    SELECT op_name as op_name, client_name as client_name,
      'Check-in overdue' as task,
      'Bel' as owner,
      0 as days_overdue
    FROM wa_post_90day_schedule
    WHERE (after_3_mon IS NOT NULL AND after_3_mon != '' AND ${colToDate('after_3_mon')} < date('now'))
       OR (after_4_mon IS NOT NULL AND after_4_mon != '' AND ${colToDate('after_4_mon')} < date('now'))
       OR (after_5_mon IS NOT NULL AND after_5_mon != '' AND ${colToDate('after_5_mon')} < date('now'))
       OR (after_6_mon IS NOT NULL AND after_6_mon != '' AND ${colToDate('after_6_mon')} < date('now'))
       OR (after_9_mon IS NOT NULL AND after_9_mon != '' AND ${colToDate('after_9_mon')} < date('now'))
       OR (after_1_year IS NOT NULL AND after_1_year != '' AND ${colToDate('after_1_year')} < date('now'))
       OR (after_1_year_3_months IS NOT NULL AND after_1_year_3_months != '' AND ${colToDate('after_1_year_3_months')} < date('now'))
    ORDER BY op_name
    LIMIT 10
  `).all() as AttentionItem[])

  return { michelle: michelleItems, bel: belItems }
}

export function getCsWorkload(): CsWorkload[] {
  return d().select({
    cs_name: sql<string>`COALESCE(${schema.assignments.assignedCs}, 'Unassigned')`,
    active_ops: count(),
    onboarding_ops: sql<number>`0`,
  }).from(schema.assignments)
    .where(eq(schema.assignments.status, "Active"))
    .groupBy(schema.assignments.assignedCs)
    .orderBy(desc(count()))
    .all()
}

export function getRecentActivity(limit: number = 10): RecentActivity[] {
  return d().select({
    op_name: schema.obRecords.opName,
    client_name: schema.obRecords.clientName,
    source_person: schema.obRecords.sourcePerson,
    last_stage: schema.obRecords.lastStageCompleted,
    updated_at: sql<string>`${schema.obRecords.id}`,
  }).from(schema.obRecords)
    .orderBy(desc(schema.obRecords.id))
    .limit(limit)
    .all()
}

export function getStatusDistribution(): { status: string; count: number }[] {
  return d().select({
    status: sql<string>`COALESCE(${schema.assignments.status}, 'Unknown')`,
    count: count(),
  }).from(schema.assignments)
    .groupBy(schema.assignments.status)
    .orderBy(desc(count()))
    .all()
}
