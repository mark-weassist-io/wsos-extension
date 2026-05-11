import { getDb } from ".."

export interface ExistingAccountRow {
  id: number
  client_name: string | null
  update_note: string | null
  checkin_frequency: string | null
  source_tab: string | null
  created_at: string | null
}

export function getExistingAccounts(search?: string, includeTrashed?: boolean): ExistingAccountRow[] {
  let sql = "SELECT id, client_name, update_note, checkin_frequency, source_tab, created_at FROM wa_existing_accounts"
  const params: any[] = []
  const cond: string[] = []
  if (!includeTrashed) cond.push("deleted_at IS NULL")
  if (search) { cond.push("(client_name LIKE ? OR update_note LIKE ?)"); params.push(`%${search}%`, `%${search}%`) }
  if (cond.length > 0) sql += " WHERE " + cond.join(" AND ")
  sql += " ORDER BY client_name"
  return getDb().prepare(sql).all(...params) as ExistingAccountRow[]
}

export function getExistingAccountById(id: number) {
  return getDb().prepare("SELECT * FROM wa_existing_accounts WHERE id = ?").get(id) as any | undefined
}

export function createExistingAccount(data: { clientName: string; updateNote?: string; checkinFrequency?: string }) {
  getDb().prepare("INSERT INTO wa_existing_accounts (client_name, update_note, checkin_frequency) VALUES (?, ?, ?)").run(data.clientName, data.updateNote || null, data.checkinFrequency || null)
}

export function updateExistingAccount(id: number, data: { clientName?: string; updateNote?: string; checkinFrequency?: string }) {
  const sets: string[] = []; const vals: any[] = []
  if (data.clientName !== undefined) { sets.push("client_name = ?"); vals.push(data.clientName) }
  if (data.updateNote !== undefined) { sets.push("update_note = ?"); vals.push(data.updateNote) }
  if (data.checkinFrequency !== undefined) { sets.push("checkin_frequency = ?"); vals.push(data.checkinFrequency) }
  if (sets.length === 0) return
  vals.push(id)
  getDb().prepare("UPDATE wa_existing_accounts SET " + sets.join(", ") + " WHERE id = ?").run(...vals)
}

export function softDeleteExistingAccount(id: number) {
  getDb().prepare("UPDATE wa_existing_accounts SET deleted_at = datetime('now') WHERE id = ?").run(id)
}

export function restoreExistingAccount(id: number) {
  getDb().prepare("UPDATE wa_existing_accounts SET deleted_at = NULL WHERE id = ?").run(id)
}
