import { getDrizzle, schema } from ".."
import { eq, and, like, or, isNull, sql, count } from "drizzle-orm"

const d = () => getDrizzle()

export interface ClientRow {
  id: number
  name: string
  email: string | null
  deleted_at: string | null
}

export function getClients(search?: string, includeTrashed?: boolean): ClientRow[] {
  const cond: any[] = []
  if (!includeTrashed) cond.push(isNull(schema.clients.deletedAt))
  if (search) cond.push(or(like(schema.clients.name, `%${search}%`), like(schema.clients.email, `%${search}%`)))
  return d().select({
    id: schema.clients.id,
    name: schema.clients.name,
    email: schema.clients.email,
    deleted_at: schema.clients.deletedAt,
  }).from(schema.clients)
    .where(cond.length > 0 ? and(...cond) : undefined)
    .orderBy(schema.clients.name)
    .all()
}

export function createClient(data: { name: string; email?: string }) {
  return d().insert(schema.clients).values(data).run()
}

export function updateClient(id: number, data: { name?: string; email?: string }) {
  return d().update(schema.clients).set(data).where(eq(schema.clients.id, id)).run()
}

export function softDeleteClient(id: number) {
  return d().update(schema.clients).set({ deletedAt: sql`datetime('now')` }).where(eq(schema.clients.id, id)).run()
}

export function restoreClient(id: number) {
  return d().update(schema.clients).set({ deletedAt: null }).where(eq(schema.clients.id, id)).run()
}

export function getClientsCount(): number {
  return d().select({ c: count() }).from(schema.clients).where(isNull(schema.clients.deletedAt)).get()?.c ?? 0
}
