// Migration: Add deleted_at to all entity tables
import { Database } from "bun:sqlite"
const db = new Database("D:/dev-wrapper/repositories/weassist/apps/wsos-extension/data/wsos-extension.db")

const tables = ["wsos_ops", "wsos_clients", "wsos_op_client_assignments", "wa_ob_records", "wsos_ninety_day_checkins", "wa_post_90day_schedule", "wa_cs_staff", "wa_red_flags"]

for (const t of tables) {
  try {
    db.run(`ALTER TABLE "${t}" ADD COLUMN deleted_at DATETIME DEFAULT NULL`)
    console.log(`  ${t}: added deleted_at`)
  } catch (e: unknown) {
    console.log(`  ${t}: skipped (${e instanceof Error ? e.message : "already exists"})`)
  }
}

// Verify
for (const t of tables) {
  const cols = db.prepare(`PRAGMA table_info("${t}")`).all() as { name: string }[]
  const hasDeleted = cols.some(c => c.name === "deleted_at")
  console.log(`  ${t}: deleted_at = ${hasDeleted ? "✓" : "✗"}`)
}

db.close()
