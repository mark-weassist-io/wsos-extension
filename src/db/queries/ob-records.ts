import { getDrizzle, getDb, schema } from ".."
import { count, eq, and, or, like, sql, desc, isNull } from "drizzle-orm"

const d = () => getDrizzle()

export interface ObRecordWithProgress {
  id: number
  op_name: string
  client_name: string | null
  company_name: string | null
  role: string | null
  start_date: string | null
  status: string | null
  source_person: string | null
  total_steps: number
  done_steps: number
  last_stage: string | null
}

export interface ObStepWithStatus {
  step_id: number
  step_name: string
  step_order: number
  category: string | null
  owner: string
  status: string | null
}

export function getObRecords(search?: string, owner?: string): ObRecordWithProgress[] {
  let sql = `SELECT r.id, r.op_name, r.client_name, r.company_name, r.role,
    r.start_date, r.status, r.source_person, r.last_stage_completed,
    (SELECT COUNT(*) FROM wa_ob_statuses s WHERE s.record_id = r.id) as total_steps,
    (SELECT COUNT(*) FROM wa_ob_statuses s WHERE s.record_id = r.id AND s.status = 'Done') as done_steps
    FROM wa_ob_records r`
  const conditions: string[] = []
  const params: any[] = []
  if (search) { conditions.push(`(r.op_name LIKE ? OR r.client_name LIKE ?)`); params.push(`%${search}%`, `%${search}%`) }
  if (owner) { conditions.push(`r.source_person = ?`); params.push(owner) }
  if (conditions.length) sql += ` WHERE ${conditions.join(" AND ")}`
  sql += ` ORDER BY r.id DESC`

  return getDb().prepare(sql).all(...params).map((r: any) => ({
    id: r.id,
    op_name: r.op_name,
    client_name: r.client_name,
    company_name: r.company_name,
    role: r.role,
    start_date: r.start_date,
    status: r.status,
    source_person: r.source_person,
    total_steps: r.total_steps,
    done_steps: r.done_steps,
    last_stage: r.last_stage_completed,
  }))
}

export function getObStepsWithStatus(recordId: number): ObStepWithStatus[] {
  return d().select({
    step_id: schema.obStepDefs.id,
    step_name: schema.obStepDefs.name,
    step_order: schema.obStepDefs.stepOrder,
    category: schema.obStepDefs.category,
    owner: schema.obStepDefs.owner,
    status: schema.obStatuses.status,
  }).from(schema.obStepDefs)
    .leftJoin(schema.obStatuses, and(
      eq(schema.obStatuses.stepDefId, schema.obStepDefs.id),
      eq(schema.obStatuses.recordId, recordId),
    ))
    .orderBy(schema.obStepDefs.stepOrder)
    .all()
    .map(r => ({ ...r, status: r.status || "Not Done" }))
}

export function getObRecordById(id: number) {
  return d().select().from(schema.obRecords).where(eq(schema.obRecords.id, id)).get()
}

export function getObRecordsCount(): number {
  return d().select({ c: count() }).from(schema.obRecords).where(isNull(schema.obRecords.deletedAt)).get()?.c ?? 0
}

export function getObInProgressCount(): number {
  return d().select({ c: count() }).from(schema.obRecords)
    .where(and(
      isNull(schema.obRecords.deletedAt),
      sql`${schema.obRecords.status} IS NULL`,
      sql`${schema.obRecords.status} != 'Completed'`,
      sql`${schema.obRecords.status} != 'Cancelled'`,
      sql`${schema.obRecords.status} != 'Graduated'`,
    ))
    .get()?.c ?? 0
}

const NEXT_STATUS: Record<string, string> = { "Not Done": "Done", "Done": "Not Done" }

export function toggleStepStatus(recordId: number, stepDefId: number): string {
  const current = d().select({ status: schema.obStatuses.status })
    .from(schema.obStatuses)
    .where(and(
      eq(schema.obStatuses.recordId, recordId),
      eq(schema.obStatuses.stepDefId, stepDefId),
    ))
    .get()

  const next = NEXT_STATUS[current?.status || "Not Done"]

  if (current) {
    d().update(schema.obStatuses)
      .set({ status: next })
      .where(and(
        eq(schema.obStatuses.recordId, recordId),
        eq(schema.obStatuses.stepDefId, stepDefId),
      ))
      .run()
  } else {
    d().insert(schema.obStatuses)
      .values({ recordId, stepDefId, status: next })
      .run()
  }

  return next
}

export function createObRecord(data: { opName: string; clientName?: string; companyName?: string; role?: string; startDate?: string; startTime?: string; contactNumber?: string; email?: string; notes?: string; sourcePerson?: string }) {
  const r = getDb().prepare(`
    INSERT INTO wa_ob_records (op_name, client_name, company_name, role, start_date, start_time, contact_number, email, notes, source_person)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(data.opName, data.clientName || null, data.companyName || null, data.role || null, data.startDate || null, data.startTime || null, data.contactNumber || null, data.email || null, data.notes || null, data.sourcePerson || null)

  // Auto-create 26 step statuses as "Not Done"
  const recordId = r.lastInsertRowid as number
  const steps = getDb().prepare("SELECT id FROM wa_ob_step_defs ORDER BY step_order").all() as { id: number }[]
  const ins = getDb().prepare("INSERT OR IGNORE INTO wa_ob_statuses (record_id, step_def_id, status) VALUES (?, ?, 'Not Done')")
  for (const s of steps) ins.run(recordId, s.id)
  return recordId
}

export function updateObRecord(id: number, data: { opName?: string; clientName?: string; companyName?: string; role?: string; startDate?: string; startTime?: string; contactNumber?: string; email?: string; notes?: string; sourcePerson?: string }) {
  const sets: string[] = []; const vals: any[] = []
  if (data.opName !== undefined) { sets.push("op_name = ?"); vals.push(data.opName) }
  if (data.clientName !== undefined) { sets.push("client_name = ?"); vals.push(data.clientName) }
  if (data.companyName !== undefined) { sets.push("company_name = ?"); vals.push(data.companyName) }
  if (data.role !== undefined) { sets.push("role = ?"); vals.push(data.role) }
  if (data.startDate !== undefined) { sets.push("start_date = ?"); vals.push(data.startDate) }
  if (data.startTime !== undefined) { sets.push("start_time = ?"); vals.push(data.startTime) }
  if (data.email !== undefined) { sets.push("email = ?"); vals.push(data.email) }
  if (data.notes !== undefined) { sets.push("notes = ?"); vals.push(data.notes) }
  if (data.sourcePerson !== undefined) { sets.push("source_person = ?"); vals.push(data.sourcePerson) }
  if (sets.length === 0) return
  vals.push(id)
  getDb().prepare("UPDATE wa_ob_records SET " + sets.join(", ") + " WHERE id = ?").run(...vals)
}

export function softDeleteObRecord(id: number) {
  d().update(schema.obRecords).set({ deletedAt: sql`datetime('now')` }).where(eq(schema.obRecords.id, id)).run()
}

export function restoreObRecord(id: number) {
  d().update(schema.obRecords).set({ deletedAt: null }).where(eq(schema.obRecords.id, id)).run()
}
