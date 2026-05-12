import { getDb } from "./src/db"

const r = getDb()

// Check HO step def
const hoDef = r.prepare("SELECT id, name FROM wa_ob_step_defs WHERE name LIKE '%HAND-OFF%'").all() as any[]
console.log("HO step defs:", JSON.stringify(hoDef, null, 2))

// Check statuses for those defs
for (const d of hoDef) {
  const cnt = (r.prepare("SELECT COUNT(*) as c FROM wa_ob_statuses WHERE step_def_id = ?").get(d.id) as any)?.c ?? 0
  const sample = r.prepare("SELECT status FROM wa_ob_statuses WHERE step_def_id = ? LIMIT 3").all(d.id) as any[]
  console.log(`Step def ${d.id} '${d.name}': ${cnt} statuses, samples:`, sample.map(s => s.status))
}

// Check with ILIKE
const totalHO = (r.prepare(`SELECT COUNT(*) as c FROM wa_ob_statuses s JOIN wa_ob_step_defs d ON d.id = s.step_def_id WHERE d.name LIKE '%HAND-OFF%'`).get() as any)?.c ?? 0
console.log("\nTotal with LIKE '%HAND-OFF%':", totalHO)

const pendingHO = (r.prepare(`SELECT COUNT(*) as c FROM wa_ob_statuses s JOIN wa_ob_step_defs d ON d.id = s.step_def_id WHERE d.name LIKE '%HAND-OFF%' AND s.status != 'Done'`).get() as any)?.c ?? 0
console.log("Pending (not Done) with LIKE '%HAND-OFF%':", pendingHO)
