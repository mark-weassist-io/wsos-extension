import { getDrizzle, getDb, schema } from ".."
import { count, eq, and, or, sql, desc } from "drizzle-orm"
import { getAllClassifiedMilestones } from "./checkins"

const d = () => getDrizzle()

export interface DashboardMetrics {
  total_ops: number
  active_ops: number
  onboarding_in_progress: number
  post_onboarding_active: number
  separated_ops: number
  overdue_checkins: number
  pending_handoff_calls: number
  scheduled_checkins: number
  done_checkins: number
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

  const r = getDb()
  const postOnboarding = (r.prepare(`
    SELECT COUNT(DISTINCT a.op_name) as c FROM wsos_op_client_assignments a
    WHERE a.status = 'Active'
    AND a.op_name NOT IN (
      SELECT r.op_name FROM wa_ob_records r
      WHERE (r.status IS NULL OR r.status NOT IN ('Completed', 'Cancelled', 'Graduated'))
    )
  `).get() as { c: number })?.c ?? 0

  const pendingHandoff = (r.prepare(`
    SELECT COUNT(*) as c FROM wa_ob_statuses s
    JOIN wa_ob_step_defs d ON d.id = s.step_def_id
    WHERE d.name LIKE '%Hand-Off Call W/ Client?'
    AND s.status != 'Done'
  `).get() as { c: number })?.c ?? 0

  const counts = getAllClassifiedMilestones()
  let done = 0, scheduled = 0, overdue = 0
  for (const m of counts) {
    if (m.status === "done") done++
    else if (m.status === "scheduled") scheduled++
    else if (m.status === "overdue") overdue++
  }

  return {
    total_ops: total,
    active_ops: active,
    onboarding_in_progress: onboardingCount,
    post_onboarding_active: postOnboarding,
    separated_ops: separated,
    overdue_checkins: overdue,
    pending_handoff_calls: pendingHandoff,
    scheduled_checkins: scheduled,
    done_checkins: done,
  }
}

export function getPipelineStages(): PipelineStage[] {
  const active = d().select({ c: count() }).from(schema.assignments).where(eq(schema.assignments.status, "Active")).get()?.c ?? 0
  const separated = d().select({ c: count() }).from(schema.assignments).where(eq(schema.assignments.status, "Separated")).get()?.c ?? 0
  const probation = d().select({ c: count() }).from(schema.assignments).where(eq(schema.assignments.status, "Probation")).get()?.c ?? 0
  const onboarding = d().select({ c: count() }).from(schema.obRecords)
    .where(sql`${schema.obRecords.status} IS NULL OR (${schema.obRecords.status} != 'Completed' AND ${schema.obRecords.status} != 'Cancelled' AND ${schema.obRecords.status} != 'Graduated')`)
    .get()?.c ?? 0

  const counts = getAllClassifiedMilestones()
  let done = 0, scheduled = 0, overdue = 0
  for (const m of counts) {
    if (m.status === "done") done++
    else if (m.status === "scheduled") scheduled++
    else if (m.status === "overdue") overdue++
  }

  return [
    { stage: "Onboarding (Michelle)", count: onboarding, detail: "New OPs being onboarded" },
    { stage: "Probation", count: probation, detail: "OPs in probation period" },
    { stage: "Active", count: active, detail: "Fully onboarded and active" },
    { stage: "Check-ins Done", count: done, detail: "Completed check-in milestones" },
    { stage: "Check-ins Scheduled", count: scheduled, detail: "Upcoming scheduled check-ins" },
    { stage: "Overdue Check-ins", count: overdue, detail: "Check-ins past due date" },
    { stage: "Separated", count: separated, detail: "No longer assigned" },
  ]
}

export function getAttentionItems(): { michelle: AttentionItem[]; bel: AttentionItem[] } {
  const r = getDb()

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

  const allMilestones = getAllClassifiedMilestones()
  const overdueMap = new Map<string, { opName: string; clientName: string; tasks: string[] }>()
  for (const m of allMilestones) {
    if (m.status !== "overdue") continue
    if (!overdueMap.has(m.opName)) {
      const row = r.prepare("SELECT client_name FROM wa_post_90day_schedule WHERE op_name = ? LIMIT 1").get(m.opName) as any
      overdueMap.set(m.opName, { opName: m.opName, clientName: row?.client_name ?? null, tasks: [] })
    }
    overdueMap.get(m.opName)!.tasks.push(m.milestone)
  }
  const belItems: AttentionItem[] = Array.from(overdueMap.values())
    .sort((a, b) => a.opName.localeCompare(b.opName))
    .slice(0, 10)
    .map(item => ({
      op_name: item.opName,
      client_name: item.clientName,
      task: `Overdue: ${item.tasks.join(", ")}`,
      owner: "Bel",
      days_overdue: 0,
    }))

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
