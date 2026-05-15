import { getDrizzle, schema } from ".."
import { eq, and, like, or, isNull, sql } from "drizzle-orm"

const d = () => getDrizzle()

export interface RedFlagRow {
  id: number
  flag_name: string | null
  definition: string | null
  color: string | null
  deleted_at: string | null
}

export function getRedFlags(search?: string, includeTrashed?: boolean): RedFlagRow[] {
  const cond: any[] = []
  if (includeTrashed) cond.push(sql`${schema.redFlags.deletedAt} IS NOT NULL`)
  else cond.push(isNull(schema.redFlags.deletedAt))
  if (search) cond.push(like(schema.redFlags.flagName, `%${search}%`))
  return d().select({
    id: schema.redFlags.id,
    flag_name: schema.redFlags.flagName,
    definition: schema.redFlags.definition,
    color: schema.redFlags.color,
    deleted_at: schema.redFlags.deletedAt,
  }).from(schema.redFlags)
    .where(cond.length > 0 ? and(...cond) : undefined)
    .orderBy(schema.redFlags.flagName)
    .all()
}

export function getRedFlagById(id: number) {
  return d().select().from(schema.redFlags).where(eq(schema.redFlags.id, id)).get()
}

export function createRedFlag(data: { flagName: string; definition?: string; color?: string }) {
  return d().insert(schema.redFlags).values(data).run()
}

export function updateRedFlag(id: number, data: { flagName?: string; definition?: string; color?: string }) {
  return d().update(schema.redFlags).set(data).where(eq(schema.redFlags.id, id)).run()
}

export function softDeleteRedFlag(id: number) {
  return d().update(schema.redFlags).set({ deletedAt: sql`datetime('now')` }).where(eq(schema.redFlags.id, id)).run()
}

export function restoreRedFlag(id: number) {
  return d().update(schema.redFlags).set({ deletedAt: null }).where(eq(schema.redFlags.id, id)).run()
}
