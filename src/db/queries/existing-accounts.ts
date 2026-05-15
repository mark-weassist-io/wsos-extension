import { getDrizzle, schema } from ".."
import { eq, and, like, or, isNull, sql } from "drizzle-orm"

const d = () => getDrizzle()

export interface ExistingAccountRow {
  id: number
  client_name: string | null
  update_note: string | null
  checkin_frequency: string | null
  deleted_at: string | null
}

export function getExistingAccounts(search?: string, includeTrashed?: boolean): ExistingAccountRow[] {
  const cond: any[] = []
  if (includeTrashed) cond.push(sql`${schema.existingAccounts.deletedAt} IS NOT NULL`)
  else cond.push(isNull(schema.existingAccounts.deletedAt))
  if (search) cond.push(or(
    like(schema.existingAccounts.clientName, `%${search}%`),
    like(schema.existingAccounts.updateNote, `%${search}%`),
  ))
  return d().select({
    id: schema.existingAccounts.id,
    client_name: schema.existingAccounts.clientName,
    update_note: schema.existingAccounts.updateNote,
    checkin_frequency: schema.existingAccounts.checkinFrequency,
    deleted_at: schema.existingAccounts.deletedAt,
  }).from(schema.existingAccounts)
    .where(cond.length > 0 ? and(...cond) : undefined)
    .orderBy(schema.existingAccounts.clientName)
    .all()
}

export function getExistingAccountById(id: number) {
  return d().select().from(schema.existingAccounts)
    .where(eq(schema.existingAccounts.id, id))
    .get()
}

export function createExistingAccount(data: { clientName: string; updateNote?: string; checkinFrequency?: string }) {
  return d().insert(schema.existingAccounts).values(data).run()
}

export function updateExistingAccount(id: number, data: { clientName?: string; updateNote?: string; checkinFrequency?: string }) {
  return d().update(schema.existingAccounts).set(data)
    .where(eq(schema.existingAccounts.id, id)).run()
}

export function softDeleteExistingAccount(id: number) {
  return d().update(schema.existingAccounts)
    .set({ deletedAt: sql`datetime('now')` })
    .where(eq(schema.existingAccounts.id, id)).run()
}

export function restoreExistingAccount(id: number) {
  return d().update(schema.existingAccounts)
    .set({ deletedAt: null })
    .where(eq(schema.existingAccounts.id, id)).run()
}
