import { Database } from "bun:sqlite"
const db = new Database("data/wsos-extension.db")
const users = db.prepare("SELECT email, role, display_name, department FROM nexus_users ORDER BY role, display_name").all() as any[]
for (const u of users) {
  console.log(`${u.role.padEnd(8)} ${u.email.padEnd(40)} ${u.department.padEnd(18)} ${u.display_name}`)
}
db.close()
