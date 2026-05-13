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
  const all = getPost90DaySchedule()
  const cutoff = new Date(Date.now() + days * 86400000)
  const r = getDb()
  const milestones = r.prepare("SELECT op_name, milestone, happened, was_green FROM checkin_milestones").all() as any[]
  const flagMap = new Map<string, Map<string, { happened: number; wasGreen: number }>>()
  for (const m of milestones) {
    if (!flagMap.has(m.op_name)) flagMap.set(m.op_name, new Map())
    flagMap.get(m.op_name)!.set(m.milestone, { happened: m.happened, wasGreen: m.was_green ?? 0 })
  }
  const MILESTONE_MAP: Record<string, string> = { "3mo": "after3Mon", "4mo": "after4Mon", "5mo": "after5Mon", "6mo": "after6Mon", "9mo": "after9Mon", "1yr": "after1Year", "1yr3mo": "after1Year3Months" }
  return all.filter(s => {
    const flags = flagMap.get(s.opName) ?? new Map()
    for (const [key, col] of Object.entries(MILESTONE_MAP)) {
      let val = (s as any)[col]
      if (!val && (s as any).startDate) {
        val = addMonths((s as any).startDate, MILESTONE_OFFSETS[key])
      }
      if (!val) continue
      const d = parseMdY(val)
      const f = flags.get(key)
      if (d && d <= cutoff && (f?.happened ?? 0) !== 1) return true
    }
    return false
  })
}

export function getOverdueCheckins(): Post90DayCheckinSchedule[] {
  const all = getPost90DaySchedule()
  const r = getDb()
  const milestones = r.prepare("SELECT op_name, milestone, happened, was_green FROM checkin_milestones").all() as any[]
  const flagMap = new Map<string, Map<string, { happened: number; wasGreen: number }>>()
  for (const m of milestones) {
    if (!flagMap.has(m.op_name)) flagMap.set(m.op_name, new Map())
    flagMap.get(m.op_name)!.set(m.milestone, { happened: m.happened, wasGreen: m.was_green ?? 0 })
  }
  const MILESTONE_MAP: Record<string, string> = { "3mo": "after3Mon", "4mo": "after4Mon", "5mo": "after5Mon", "6mo": "after6Mon", "9mo": "after9Mon", "1yr": "after1Year", "1yr3mo": "after1Year3Months" }
  return all.filter(s => {
    const flags = flagMap.get(s.opName) ?? new Map()
    for (const [key, col] of Object.entries(MILESTONE_MAP)) {
      let val = (s as any)[col]
      if (!val && (s as any).startDate) {
        val = addMonths((s as any).startDate, MILESTONE_OFFSETS[key])
      }
      if (!val) continue
      const f = flags.get(key)
      if (classifyMilestone(val, (f?.happened ?? 0) === 1, (f?.wasGreen ?? 0) === 1) === "overdue") return true
    }
    return false
  })
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

const MILESTONE_OFFSETS: Record<string, number> = {
  "3mo": 3, "4mo": 4, "5mo": 5, "6mo": 6, "9mo": 9, "1yr": 12, "1yr3mo": 15,
}

function parseMdY(s: string): Date | null {
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  return new Date(+m[3], +m[1] - 1, +m[2])
}

function addMonths(dateStr: string, months: number): string {
  const d = parseMdY(dateStr)
  if (!d) return ""
  d.setMonth(d.getMonth() + months)
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

export function classifyMilestone(dateStr: string | null, happened: boolean, wasGreen: boolean = false): MilestoneStatus {
  if (!dateStr) return "cancelled"
  const d = parseMdY(dateStr)
  if (!d) return "cancelled"
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  if (happened) return "done"
  if (d >= now) return "scheduled"
  if (!wasGreen) return "cancelled"
  return "overdue"
}

export function getAllClassifiedMilestones(): ClassifiedMilestone[] {
  const r = getDb()
  const rows = r.prepare("SELECT * FROM wa_post_90day_schedule").all() as any[]
  const result: ClassifiedMilestone[] = []

  const milestones = r.prepare("SELECT op_name, milestone, happened, was_green FROM checkin_milestones").all() as any[]
  const flagMap = new Map<string, Map<string, { happened: number; wasGreen: number }>>()
  for (const m of milestones) {
    if (!flagMap.has(m.op_name)) flagMap.set(m.op_name, new Map())
    flagMap.get(m.op_name)!.set(m.milestone, { happened: m.happened, wasGreen: m.was_green ?? 0 })
  }

  for (const row of rows) {
    const flags = flagMap.get(row.op_name) ?? new Map()
    for (const [key, col] of MILESTONE_COLS) {
      let dateStr = row[col]
      if (!dateStr && row.start_date) {
        dateStr = addMonths(row.start_date, MILESTONE_OFFSETS[key])
      }
      if (!dateStr) continue
      const f = flags.get(key)
      const happened = (f?.happened ?? 0) === 1
      const wasGreen = (f?.wasGreen ?? 0) === 1
      result.push({
        opName: row.op_name,
        milestone: key,
        date: dateStr,
        status: classifyMilestone(dateStr, happened, wasGreen),
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
