import { getDb } from ".."

export interface NexusUser {
  id: number
  email: string
  password_hash: string
  display_name: string
  role: string
  department: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface SafeUser {
  id: number
  email: string
  display_name: string
  role: string
  department: string
}

export function getUserByEmail(email: string): NexusUser | undefined {
  return getDb().prepare("SELECT * FROM nexus_users WHERE email = ? AND deleted_at IS NULL").get(email) as NexusUser | undefined
}

export function getUserById(id: number): SafeUser | undefined {
  const u = getDb().prepare("SELECT id, email, display_name, role, department FROM nexus_users WHERE id = ? AND deleted_at IS NULL").get(id) as SafeUser | undefined
  return u
}

export function createUser(email: string, passwordHash: string, displayName: string, role: string = "staff", department: string = ""): number {
  const r = getDb().prepare("INSERT INTO nexus_users (email, password_hash, display_name, role, department) VALUES (?, ?, ?, ?, ?)").run(email, passwordHash, displayName, role, department)
  return r.lastInsertRowid as number
}

export function hasAnyUser(): boolean {
  const r = getDb().prepare("SELECT COUNT(*) as c FROM nexus_users").get() as { c: number }
  return r.c > 0
}

export interface StaffUser extends SafeUser {
  deleted_at: string | null
}

export function getAllUsers(includeDeleted: boolean = false): StaffUser[] {
  const q = includeDeleted
    ? "SELECT id, email, display_name, role, department, deleted_at FROM nexus_users ORDER BY display_name"
    : "SELECT id, email, display_name, role, department, deleted_at FROM nexus_users WHERE deleted_at IS NULL ORDER BY display_name"
  return getDb().prepare(q).all() as StaffUser[]
}

export function updateUser(id: number, data: { email?: string; displayName?: string; role?: string; department?: string; passwordHash?: string }): void {
  const sets: string[] = []; const vals: any[] = []
  if (data.email !== undefined) { sets.push("email = ?"); vals.push(data.email) }
  if (data.displayName !== undefined) { sets.push("display_name = ?"); vals.push(data.displayName) }
  if (data.role !== undefined) { sets.push("role = ?"); vals.push(data.role) }
  if (data.department !== undefined) { sets.push("department = ?"); vals.push(data.department) }
  if (data.passwordHash !== undefined) { sets.push("password_hash = ?"); vals.push(data.passwordHash) }
  if (sets.length === 0) return
  sets.push("updated_at = datetime('now')")
  vals.push(id)
  getDb().prepare("UPDATE nexus_users SET " + sets.join(", ") + " WHERE id = ?").run(...vals)
}

export function softDeleteUser(id: number): void {
  getDb().prepare("UPDATE nexus_users SET deleted_at = datetime('now') WHERE id = ?").run(id)
}

export function restoreUser(id: number): void {
  getDb().prepare("UPDATE nexus_users SET deleted_at = NULL WHERE id = ?").run(id)
}
