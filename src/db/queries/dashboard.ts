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

export function getMetrics(): DashboardMetrics {
  const total = d().select({ c: count() }).from(schema.ops).get()?.c ?? 0
  const active = d().select({ c: count() }).from(schema.assignments).where(eq(schema.assignments.status, "Active")).get()?.c ?? 0
  const separated = d().select({ c: count() }).from(schema.assignments).where(eq(schema.assignments.status, "Separated")).get()?.c ?? 0

  const onboardingCount = d().select({ c: count() }).from(schema.obRecords)
    .where(sql`${schema.obRecords.status} IS NULL OR (${schema.obRecords.status} != 'Completed' AND ${schema.obRecords.status} != 'Cancelled' AND ${schema.obRecords.status} != 'Graduated')`)
    .get()?.c ?? 0

  // Overdue check-ins: today's date compared to check-in schedule dates
  const today = new Date().toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" }).split("/").map(n => n.padStart(2, "0")).join("/")
  const s = schema.checkinSchedule
  const overdue = d().select({ c: count() }).from(s)
    .where(or(
      and(sql`${s.after3Mon} IS NOT NULL`, sql`${s.after3Mon} != ''`, sql`${s.after3Mon} < ${today}`),
      and(sql`${s.after4Mon} IS NOT NULL`, sql`${s.after4Mon} != ''`, sql`${s.after4Mon} < ${today}`),
      and(sql`${s.after5Mon} IS NOT NULL`, sql`${s.after5Mon} != ''`, sql`${s.after5Mon} < ${today}`),
      and(sql`${s.after6Mon} IS NOT NULL`, sql`${s.after6Mon} != ''`, sql`${s.after6Mon} < ${today}`),
      and(sql`${s.after9Mon} IS NOT NULL`, sql`${s.after9Mon} != ''`, sql`${s.after9Mon} < ${today}`),
      and(sql`${s.after1Year} IS NOT NULL`, sql`${s.after1Year} != ''`, sql`${s.after1Year} < ${today}`),
      and(sql`${s.after1Year3Months} IS NOT NULL`, sql`${s.after1Year3Months} != ''`, sql`${s.after1Year3Months} < ${today}`),
    ))
    .get()?.c ?? 0

  // Pending handoff calls: onboarding records where HAND-OFF CALL steps are not done
  const r = getDb()
  const pendingHandoff = (r.prepare(`
    SELECT COUNT(*) as c FROM wa_ob_statuses s
    JOIN wa_ob_step_defs d ON d.id = s.step_def_id
    WHERE d.name = 'SCHEDULE HAND-OFF CALL W/ CLIENT?'
    AND s.status != 'Done'
  `).get() as { c: number })?.c ?? 0

  return {
    total_ops: total,
    active_ops: active,
    onboarding_in_progress: onboardingCount,
    post_onboarding_active: Math.max(0, active - onboardingCount),
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

  const today = new Date().toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" }).split("/").map(n => n.padStart(2, "0")).join("/")
  const s = schema.checkinSchedule
  const overdue = d().select({ c: count() }).from(s)
    .where(or(
      and(sql`${s.after3Mon} IS NOT NULL`, sql`${s.after3Mon} != ''`, sql`${s.after3Mon} < ${today}`),
      and(sql`${s.after4Mon} IS NOT NULL`, sql`${s.after4Mon} != ''`, sql`${s.after4Mon} < ${today}`),
      and(sql`${s.after5Mon} IS NOT NULL`, sql`${s.after5Mon} != ''`, sql`${s.after5Mon} < ${today}`),
      and(sql`${s.after6Mon} IS NOT NULL`, sql`${s.after6Mon} != ''`, sql`${s.after6Mon} < ${today}`),
      and(sql`${s.after9Mon} IS NOT NULL`, sql`${s.after9Mon} != ''`, sql`${s.after9Mon} < ${today}`),
      and(sql`${s.after1Year} IS NOT NULL`, sql`${s.after1Year} != ''`, sql`${s.after1Year} < ${today}`),
      and(sql`${s.after1Year3Months} IS NOT NULL`, sql`${s.after1Year3Months} != ''`, sql`${s.after1Year3Months} < ${today}`),
    ))
    .get()?.c ?? 0

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
  const today = new Date().toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" }).split("/").map(n => n.padStart(2, "0")).join("/")

  // Michelle: OPs with pending HO call scheduling
  const michelleItems = (r.prepare(`
    SELECT r.op_name, r.client_name,
      'SCHEDULE HAND-OFF CALL W/ CLIENT?' as task,
      'Michelle' as owner,
      0 as days_overdue
    FROM wa_ob_statuses s
    JOIN wa_ob_step_defs d ON d.id = s.step_def_id
    JOIN wa_ob_records r ON r.id = s.record_id
    WHERE d.name = 'SCHEDULE HAND-OFF CALL W/ CLIENT?'
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
    WHERE after_3_mon IS NOT NULL AND after_3_mon != '' AND after_3_mon < ?
       OR after_4_mon IS NOT NULL AND after_4_mon != '' AND after_4_mon < ?
       OR after_5_mon IS NOT NULL AND after_5_mon != '' AND after_5_mon < ?
       OR after_6_mon IS NOT NULL AND after_6_mon != '' AND after_6_mon < ?
       OR after_9_mon IS NOT NULL AND after_9_mon != '' AND after_9_mon < ?
       OR after_1_year IS NOT NULL AND after_1_year != '' AND after_1_year < ?
       OR after_1_year_3_months IS NOT NULL AND after_1_year_3_months != '' AND after_1_year_3_months < ?
    ORDER BY op_name
    LIMIT 10
  `).all(today, today, today, today, today, today, today) as AttentionItem[])

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
