import { getDrizzle, schema } from ".."
import { eq, and, like, or, isNull, sql, count as drizzleCount } from "drizzle-orm"

const d = () => getDrizzle()

export interface CsStaffRow {
  id: number
  name: string
  full_name: string | null
  deleted_at: string | null
}

export function getCsStaff(search?: string, includeTrashed?: boolean): CsStaffRow[] {
  const cond: any[] = []
  if (!includeTrashed) cond.push(isNull(schema.csStaff.deletedAt))
  if (search) cond.push(like(schema.csStaff.name, `%${search}%`))
  return d().select({
    id: schema.csStaff.id,
    name: schema.csStaff.name,
    full_name: schema.csStaff.fullName,
    deleted_at: schema.csStaff.deletedAt,
  }).from(schema.csStaff)
    .where(cond.length > 0 ? and(...cond) : undefined)
    .orderBy(schema.csStaff.name)
    .all()
}

export function getCsStaffById(id: number) {
  return d().select().from(schema.csStaff).where(eq(schema.csStaff.id, id)).get()
}

export function createCsStaff(data: { name: string; fullName?: string }) {
  return d().insert(schema.csStaff).values(data).run()
}

export function updateCsStaff(id: number, data: { name?: string; fullName?: string }) {
  return d().update(schema.csStaff).set(data).where(eq(schema.csStaff.id, id)).run()
}

export function softDeleteCsStaff(id: number) {
  return d().update(schema.csStaff).set({ deletedAt: sql`datetime('now')` }).where(eq(schema.csStaff.id, id)).run()
}

export function restoreCsStaff(id: number) {
  return d().update(schema.csStaff).set({ deletedAt: null }).where(eq(schema.csStaff.id, id)).run()
}

export function getAllCsStaffNames(): string[] {
  return d().select({ name: schema.csStaff.name }).from(schema.csStaff).where(isNull(schema.csStaff.deletedAt)).all().map(r => r.name)
}
