import { getDrizzle, schema } from ".."
import { eq, or, and, like, sql, count, desc, isNull } from "drizzle-orm"
import type { Op } from "../../types"

const d = () => getDrizzle()

export interface OpRow {
  id: number
  full_name: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  gender: string | null
  nickname: string | null
  deleted_at: string | null
}

export interface OpWithAssignment extends OpRow {
  client_name: string | null
  role: string | null
  status: string | null
  assigned_cs: string | null
}

function opSelect() {
  return {
    id: schema.ops.id,
    full_name: schema.ops.fullName,
    first_name: schema.ops.firstName,
    last_name: schema.ops.lastName,
    email: schema.ops.email,
    phone: schema.ops.phone,
    gender: schema.ops.gender,
    nickname: schema.ops.nickname,
    rate: schema.ops.rate,
    deleted_at: schema.ops.deletedAt,
  }
}

export function getOps(search?: string, includeTrashed?: boolean): OpRow[] {
  const conditions = []
  if (!includeTrashed) conditions.push(isNull(schema.ops.deletedAt))
  if (search) conditions.push(or(like(schema.ops.fullName, `%${search}%`), like(schema.ops.email, `%${search}%`)))
  return d().select(opSelect()).from(schema.ops)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(schema.ops.fullName)
    .all()
}

export function getOpsWithAssignments(search?: string, includeTrashed?: boolean): OpWithAssignment[] {
  const conditions = []
  if (!includeTrashed) conditions.push(isNull(schema.ops.deletedAt))
  if (search) conditions.push(or(
    like(schema.ops.fullName, `%${search}%`),
    like(schema.assignments.clientName, `%${search}%`),
    like(schema.assignments.status, `%${search}%`),
  ))
  return d().select({
    ...opSelect(),
    client_name: schema.assignments.clientName,
    role: schema.assignments.role,
    status: schema.assignments.status,
    assigned_cs: schema.assignments.assignedCs,
  }).from(schema.ops)
    .leftJoin(schema.assignments, eq(schema.ops.fullName, schema.assignments.opName))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(schema.ops.fullName)
    .all()
}

export function getOpById(id: number, includeTrashed?: boolean) {
  const conditions = [eq(schema.ops.id, id)]
  if (!includeTrashed) conditions.push(isNull(schema.ops.deletedAt))
  return d().select(opSelect()).from(schema.ops).where(and(...conditions)).get()
}

export function getOpByFullName(name: string) {
  return d().select(opSelect()).from(schema.ops).where(eq(schema.ops.fullName, name)).get()
}

export function createOp(data: { fullName: string; firstName?: string; lastName?: string; email?: string; phone?: string; gender?: string; nickname?: string; rate?: string }) {
  return d().insert(schema.ops).values(data).run()
}

export function updateOp(id: number, data: Partial<{ fullName: string; firstName: string; lastName: string; email: string; phone: string; gender: string; nickname: string; rate: string }>) {
  return d().update(schema.ops).set(data).where(eq(schema.ops.id, id)).run()
}

export function softDeleteOp(id: number) {
  return d().update(schema.ops).set({ deletedAt: sql`datetime('now')` }).where(eq(schema.ops.id, id)).run()
}

export function restoreOp(id: number) {
  return d().update(schema.ops).set({ deletedAt: null }).where(eq(schema.ops.id, id)).run()
}

export function getOpsCount(): number {
  return d().select({ c: count() }).from(schema.ops).where(isNull(schema.ops.deletedAt)).get()?.c ?? 0
}

export function getOpPhones(opName: string): string[] {
  return d().select({ phone: schema.opPhones.phone })
    .from(schema.opPhones)
    .where(eq(schema.opPhones.opName, opName))
    .orderBy(schema.opPhones.sortOrder)
    .all()
    .map(r => r.phone)
}

