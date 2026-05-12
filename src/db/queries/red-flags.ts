import { getDb } from ".."

export interface RedFlagRow {
  id: number
  flag_name: string | null
  definition: string | null
  color: string | null
  deleted_at: string | null
}

export function getRedFlags(search?: string, includeTrashed?: boolean): RedFlagRow[] {
  let sql = "SELECT id, flag_name, definition, color, deleted_at FROM wa_red_flags"
  const params: any[] = []
  const cond: string[] = []
  if (includeTrashed) { cond.push("deleted_at IS NOT NULL") } else { cond.push("deleted_at IS NULL") }
  if (search) { cond.push("flag_name LIKE ?"); params.push(`%${search}%`) }
  if (cond.length > 0) sql += " WHERE " + cond.join(" AND ")
  sql += " ORDER BY flag_name"
  return getDb().prepare(sql).all(...params) as RedFlagRow[]
}

export function getRedFlagById(id: number) {
  return d().select().from(schema.redFlags).where(eq(schema.redFlags.id, id)).get()
}

export function createRedFlag(data: { flagName: string; definition?: string }) {
  return d().insert(schema.redFlags).values(data).run()
}

export function updateRedFlag(id: number, data: { flagName?: string; definition?: string }) {
  return d().update(schema.redFlags).set(data).where(eq(schema.redFlags.id, id)).run()
}

export function softDeleteRedFlag(id: number) {
  return d().update(schema.redFlags).set({ deletedAt: sql`datetime('now')` }).where(eq(schema.redFlags.id, id)).run()
}

export function restoreRedFlag(id: number) {
  return d().update(schema.redFlags).set({ deletedAt: null }).where(eq(schema.redFlags.id, id)).run()
}
