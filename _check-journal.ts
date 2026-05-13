import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { spawnSync } from "bun"
import { parseCSV, decryptFile } from "D:\\repositories\\dev-infra\\agents\\scripts\\credentials\\crypto"

const KEY = join(process.env.TEMP!, "_nx_j")
const csv = parseCSV(decryptFile())
const m = csv.find(r => r.category === "ssh" && r.name === "key-00")
writeFileSync(KEY, m!.secret + "\n", { mode: 0o600 })
process.on("exit", () => { try { unlinkSync(KEY) } catch {} })

const HOST = "root@178.105.97.246"
spawnSync(["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", HOST, "journalctl -u nexus-dev --no-pager -n 20 | grep -i 'set-status\\|error\\|POST'"], { stdio: ["inherit", "inherit", "inherit"] })
