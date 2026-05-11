import { getDrizzle, getDb, schema } from ".."
import { eq, like, or, and, sql } from "drizzle-orm"
import type { Post90DayCheckinSchedule } from "../../types"

const d = () => getDrizzle()

export interface NinetyDayCheckinRow {
  id: number
  opName: string
  clientName: string | null  // from JOIN with assignments
  checkinType: string | null
  checkinDate: string | null
  status: string | null
  assignedCs: string | null  // from JOIN with assignments
  notes: string | null
}

export type Post90DayScheduleRow = Post90DayCheckinSchedule

// --- 90-Day Check-ins ---

export function getNinetyDayCheckins(search?: string): NinetyDayCheckinRow[] {
  return d().select({
    id: schema.ninetyDayCheckins.id,
    opName: schema.ninetyDayCheckins.opName,
    clientName: schema.assignments.clientName,
    checkinType: schema.ninetyDayCheckins.checkinType,
    checkinDate: schema.ninetyDayCheckins.checkinDate,
    status: schema.ninetyDayCheckins.status,
    assignedCs: schema.assignments.assignedCs,
    notes: schema.ninetyDayCheckins.notes,
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

// --- Post-90-Day Check-in Schedule (flat table) ---

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

// --- Ninety-day Check-ins CRUD ---

export function getCheckinById(id: number) {
  return getDb().prepare("SELECT * FROM wsos_ninety_day_checkins WHERE id = ?").get(id) as any | undefined
}

export function createCheckin(data: { opName: string; checkinType?: string; checkinDate?: string; status?: string; notes?: string }) {
  getDb().prepare("INSERT INTO wsos_ninety_day_checkins (op_name, checkin_type, checkin_date, status, notes) VALUES (?, ?, ?, ?, ?)")
    .run(data.opName, data.checkinType || null, data.checkinDate || null, data.status || null, data.notes || null)
}

export function updateCheckin(id: number, data: { opName?: string; checkinType?: string; checkinDate?: string; status?: string; notes?: string }) {
  const sets: string[] = []; const vals: any[] = []
  if (data.opName !== undefined) { sets.push("op_name = ?"); vals.push(data.opName) }
  if (data.checkinType !== undefined) { sets.push("checkin_type = ?"); vals.push(data.checkinType) }
  if (data.checkinDate !== undefined) { sets.push("checkin_date = ?"); vals.push(data.checkinDate) }
  if (data.status !== undefined) { sets.push("status = ?"); vals.push(data.status) }
  if (data.notes !== undefined) { sets.push("notes = ?"); vals.push(data.notes) }
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
