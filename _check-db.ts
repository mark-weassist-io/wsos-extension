import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { spawnSync } from "bun"
import { parseCSV, decryptFile } from "D:\\repositories\\dev-infra\\agents\\scripts\\credentials\\crypto"

const KEY = join(process.env.TEMP!, "_nx_dbu")
const m = parseCSV(decryptFile()).find(r => r.category === "ssh" && r.name === "key-00")
writeFileSync(KEY, m!.secret + "\n", { mode: 0o600 })
process.on("exit", () => { try { unlinkSync(KEY) } catch {} })

const HOST = "root@178.105.97.246"
const cmd = (a: string) => spawnSync(["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", HOST, a], { stdio: ["inherit", "inherit", "inherit"] })

cmd("sqlite3 /opt/nexus-dev/data/wsos-extension.db 'SELECT id, email, role FROM nexus_users;' 2>/dev/null || echo no table")
