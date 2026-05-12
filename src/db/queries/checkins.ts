import { getDrizzle, getDb, schema } from ".."
import { eq, like, or, and, sql } from "drizzle-orm"
import type { Post90DayCheckinSchedule, MilestoneStatus, ClassifiedMilestone } from "../../types"

const d = () => getDrizzle()

export interface NinetyDayCheckinRow {
  id: number
  opName: string
  clientName: string | null  // from JOIN with assignments
  status: string | null
  assignedCs: string | null  // from JOIN with assignments
}

export type Post90DayScheduleRow = Post90DayCheckinSchedule

// --- 90-Day Check-ins ---

export function getNinetyDayCheckins(search?: string): NinetyDayCheckinRow[] {
  return d().select({
    id: schema.ninetyDayCheckins.id,
    opName: schema.ninetyDayCheckins.opName,
    clientName: schema.assignments.clientName,
    status: schema.ninetyDayCheckins.status,
    assignedCs: schema.assignments.assignedCs,
  }).from(schema.ninetyDayCheckins)
    .leftJoin(schema.assignments, eq(schema.ninetyDayCheckins.opName, schema.assignments.opName))
    .where(search ? or(
      like(schema.ninetyDayCheckins.opName, `%${search}%`),
      like(schema.assignments.clientName, `%${search}%`),
      like(schema.ninetyDayCheckins.status, `%${search}%`),
    ) : undefined)
    .orderBy(schema.ninetyDayCheckins.opName)
    .all()
}

export function getNinetyDayCheckinsByOp(opName: string): NinetyDayCheckin[] {
  return d().select().from(schema.ninetyDayCheckins)
    .where(eq(schema.ninetyDayCheckins.opName, opName))
    .orderBy(schema.ninetyDayCheckins.id)
    .all()
}

// --- Post-90-Day Check-in Schedule (milestone normalized) ---

export function getPost90DaySchedule(search?: string): Post90DayCheckinSchedule[] {
  return d().select({
    id: schema.checkinSchedule.id,
    opName: schema.checkinSchedule.opName,
    after1Year: schema.checkinSchedule.after1Year,
    after1Year3Months: schema.checkinSchedule.after1Year3Months,
    after3Mon: schema.checkinSchedule.after3Mon,
    after4Mon: schema.checkinSchedule.after4Mon,
    after5Mon: schema.checkinSchedule.after5Mon,
    after6Mon: schema.checkinSchedule.after6Mon,
    after9Mon: schema.checkinSchedule.after9Mon,
    clientName: schema.checkinSchedule.clientName,
    clientSEmail: schema.checkinSchedule.clientSEmail,
    role: schema.checkinSchedule.role,
    startDate: schema.checkinSchedule.startDate,
    status: schema.checkinSchedule.status,
    assignedCs: schema.assignments.assignedCs,
    createdAt: schema.checkinSchedule.createdAt,
  }).from(schema.checkinSchedule)
    .leftJoin(schema.assignments, eq(schema.checkinSchedule.opName, schema.assignments.opName))
    .where(search ? or(
      like(schema.checkinSchedule.opName, `%${search}%`),
      like(schema.checkinSchedule.clientName, `%${search}%`),
      like(schema.checkinSchedule.status, `%${search}%`),
    ) : undefined)
    .orderBy(schema.checkinSchedule.opName)
    .all()
}

export function getUpcomingCheckins(days: number = 30): Post90DayCheckinSchedule[] {
  const future = new Date(Date.now() + days * 86400000).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" }).split("/").map(n => n.padStart(2, "0")).join("/")
  const s = schema.checkinSchedule

  return d().select().from(s)
    .where(or(
      and(sql`${s.after3Mon} IS NOT NULL`, sql`${s.after3Mon} != ''`, sql`${s.after3Mon} <= ${future}`),
      and(sql`${s.after4Mon} IS NOT NULL`, sql`${s.after4Mon} != ''`, sql`${s.after4Mon} <= ${future}`),
      and(sql`${s.after5Mon} IS NOT NULL`, sql`${s.after5Mon} != ''`, sql`${s.after5Mon} <= ${future}`),
      and(sql`${s.after6Mon} IS NOT NULL`, sql`${s.after6Mon} != ''`, sql`${s.after6Mon} <= ${future}`),
      and(sql`${s.after9Mon} IS NOT NULL`, sql`${s.after9Mon} != ''`, sql`${s.after9Mon} <= ${future}`),
      and(sql`${s.after1Year} IS NOT NULL`, sql`${s.after1Year} != ''`, sql`${s.after1Year} <= ${future}`),
      and(sql`${s.after1Year3Months} IS NOT NULL`, sql`${s.after1Year3Months} != ''`, sql`${s.after1Year3Months} <= ${future}`),
    ))
    .orderBy(s.opName)
    .all()
}

export function getOverdueCheckins(): Post90DayCheckinSchedule[] {
  return getUpcomingCheckins(0)
}

export function getScheduledCheckinsByOp(opName: string): Post90DayCheckinSchedule[] {
  return d().select().from(schema.checkinSchedule)
    .where(eq(schema.checkinSchedule.opName, opName))
    .all()
}

export function updateCheckinStatus(id: number, status: string): void {
  d().update(schema.checkinSchedule)
    .set({ status })
    .where(eq(schema.checkinSchedule.id, id))
    .run()
}

// --- Milestone toggle ---

export function getMilestoneHappened(opName: string): Record<string, number> {
  const rows = getDb().prepare("SELECT milestone, happened FROM checkin_milestones WHERE op_name = ?").all(opName) as { milestone: string; happened: number }[]
  const map: Record<string, number> = {}
  for (const r of rows) map[r.milestone] = r.happened
  return map
}

export function toggleMilestone(opName: string, milestone: string): number {
  const current = getDb().prepare("SELECT happened FROM checkin_milestones WHERE op_name = ? AND milestone = ?").get(opName, milestone) as { happened: number } | undefined
  const next = current ? (current.happened ? 0 : 1) : 1
  if (current) {
    getDb().prepare("UPDATE checkin_milestones SET happened = ? WHERE op_name = ? AND milestone = ?").run(next, opName, milestone)
  } else {
    getDb().prepare("INSERT INTO checkin_milestones (op_name, milestone, happened) VALUES (?, ?, ?)").run(opName, milestone, next)
  }
  return next
}

// --- Ninety-day Check-ins CRUD ---

export function getCheckinById(id: number) {
  return getDb().prepare("SELECT * FROM wsos_ninety_day_checkins WHERE id = ?").get(id) as any | undefined
}

export function createCheckin(data: { opName: string; status?: string }) {
  getDb().prepare("INSERT INTO wsos_ninety_day_checkins (op_name, status) VALUES (?, ?)")
    .run(data.opName, data.status || null)
}

export function updateCheckin(id: number, data: { opName?: string; status?: string }) {
  const sets: string[] = []; const vals: any[] = []
  if (data.opName !== undefined) { sets.push("op_name = ?"); vals.push(data.opName) }
  if (data.status !== undefined) { sets.push("status = ?"); vals.push(data.status) }
  if (sets.length === 0) return
  vals.push(id)
  getDb().prepare("UPDATE wsos_ninety_day_checkins SET " + sets.join(", ") + " WHERE id = ?").run(...vals)
}

export function softDeleteCheckin(id: number) {
  getDb().prepare("UPDATE wsos_ninety_day_checkins SET deleted_at = datetime('now') WHERE id = ?").run(id)
}

export function restoreCheckin(id: number) {
  getDb().prepare("UPDATE wsos_ninety_day_checkins SET deleted_at = NULL WHERE id = ?").run(id)
}

// ─── Milestone Classification ───────────────────────────────────────────────────

const MILESTONE_COLS: [string, string][] = [
  ["3mo", "after_3_mon"],
  ["4mo", "after_4_mon"],
  ["5mo", "after_5_mon"],
  ["6mo", "after_6_mon"],
  ["9mo", "after_9_mon"],
  ["1yr", "after_1_year"],
  ["1yr3mo", "after_1_year_3_months"],
]

function parseMdY(s: string): Date | null {
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  return new Date(+m[3], +m[1] - 1, +m[2])
}

export function classifyMilestone(dateStr: string | null, happened: boolean): MilestoneStatus {
  if (!dateStr) return "cancelled"
  const d = parseMdY(dateStr)
  if (!d) return "cancelled"
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  if (happened) return "done"
  if (d >= now) return "scheduled"
  return "overdue"
}

export function getAllClassifiedMilestones(): ClassifiedMilestone[] {
  const r = getDb()
  const rows = r.prepare("SELECT * FROM wa_post_90day_schedule").all() as any[]
  const result: ClassifiedMilestone[] = []

  // Batch-fetch all milestone happened flags
  const milestones = r.prepare("SELECT op_name, milestone, happened FROM checkin_milestones").all() as any[]
  const map = new Map<string, Set<string>>()
  const happenedSet = new Map<string, Map<string, number>>()
  for (const m of milestones) {
    if (!happenedSet.has(m.op_name)) happenedSet.set(m.op_name, new Map())
    happenedSet.get(m.op_name)!.set(m.milestone, m.happened)
  }

  for (const row of rows) {
    const flags = happenedSet.get(row.op_name) ?? new Map()
    for (const [key, col] of MILESTONE_COLS) {
      const dateStr = row[col]
      if (!dateStr) continue
      const happened = (flags.get(key) ?? 0) === 1
      result.push({
        opName: row.op_name,
        milestone: key,
        date: dateStr,
        status: classifyMilestone(dateStr, happened),
        happened,
      })
    }
  }
  return result
}

export function getClassifiedMilestoneCounts(): { done: number; scheduled: number; overdue: number } {
  const all = getAllClassifiedMilestones()
  let done = 0, scheduled = 0, overdue = 0
  for (const m of all) {
    if (m.status === "done") done++
    else if (m.status === "scheduled") scheduled++
    else if (m.status === "overdue") overdue++
  }
  return { done, scheduled, overdue }
}
