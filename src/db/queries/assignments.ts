import { getDrizzle, schema } from ".."
import { eq, and, like, or, isNull, sql } from "drizzle-orm"

const d = () => getDrizzle()

export interface AssignmentRow {
  id: number
  op_name: string
  client_name: string
  role: string | null
  status: string | null
  type: string | null
  start_date: string | null
  end_date: string | null
  rate: number | null
  assigned_cs: string | null
  deleted_at: string | null
}

export function getAssignments(search?: string, includeTrashed?: boolean): AssignmentRow[] {
  const cond: any[] = []
  if (includeTrashed) cond.push(sql`${schema.assignments.deletedAt} IS NOT NULL`)
  else cond.push(isNull(schema.assignments.deletedAt))
  if (search) cond.push(or(
    like(schema.assignments.opName, `%${search}%`),
    like(schema.assignments.clientName, `%${search}%`),
    like(schema.assignments.status, `%${search}%`),
  ))
  return d().select({
    id: schema.assignments.id,
    op_name: schema.assignments.opName,
    client_name: schema.assignments.clientName,
    role: schema.assignments.role,
    status: schema.assignments.status,
    type: schema.assignments.type,
    start_date: schema.assignments.startDate,
    end_date: schema.assignments.endDate,
    rate: schema.assignments.rate,
    assigned_cs: schema.assignments.assignedCs,
    deleted_at: schema.assignments.deletedAt,
  }).from(schema.assignments)
    .where(cond.length > 0 ? and(...cond) : undefined)
    .orderBy(schema.assignments.opName)
    .all()
}

export function getAssignmentById(id: number) {
  return d().select().from(schema.assignments).where(eq(schema.assignments.id, id)).get()
}

export function createAssignment(data: { opName: string; clientName: string; role?: string; status?: string; type?: string; startDate?: string; endDate?: string; rate?: number; assignedCs?: string }) {
  return d().insert(schema.assignments).values(data).run()
}

export function updateAssignment(id: number, data: { opName?: string; clientName?: string; role?: string; status?: string; type?: string; startDate?: string; endDate?: string; rate?: number; assignedCs?: string }) {
  return d().update(schema.assignments).set(data).where(eq(schema.assignments.id, id)).run()
}

export function softDeleteAssignment(id: number) {
  return d().update(schema.assignments).set({ deletedAt: sql`datetime('now')` }).where(eq(schema.assignments.id, id)).run()
}

export function restoreAssignment(id: number) {
  return d().update(schema.assignments).set({ deletedAt: null }).where(eq(schema.assignments.id, id)).run()
}
