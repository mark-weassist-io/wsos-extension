import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { spawnSync } from "bun"
import { parseCSV, decryptFile } from "D:\\repositories\\dev-infra\\agents\\scripts\\credentials\\crypto"

const KEY = join(process.env.TEMP!, "_nx_s2")
const csv = parseCSV(decryptFile())
const m = csv.find(r => r.category === "ssh" && r.name === "key-00")
if (!m?.secret) process.exit(1)
writeFileSync(KEY, m.secret + "\n", { mode: 0o600 })
process.on("exit", () => { try { unlinkSync(KEY) } catch {} })

const HOST = "root@178.105.97.246"
const scp = (a: string[]) => spawnSync(["scp", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", ...a], { stdio: ["inherit", "inherit", "inherit"] })
const ssh = (a: string) => spawnSync(["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", HOST, a], { stdio: ["inherit", "inherit", "inherit"] })

scp(["data/wsos-extension.db", `${HOST}:/tmp/wsos-extension.db`])

ssh("systemctl stop nexus-dev && cp /opt/nexus-dev/data/wsos-extension.db /opt/nexus-dev/data/wsos-extension.db.bak 2>/dev/null; cp /tmp/wsos-extension.db /opt/nexus-dev/data/wsos-extension.db && systemctl start nexus-dev")
ssh("systemctl stop nexus && cp /opt/nexus/data/wsos-extension.db /opt/nexus/data/wsos-extension.db.bak 2>/dev/null; cp /tmp/wsos-extension.db /opt/nexus/data/wsos-extension.db && systemctl start nexus")
ssh("rm /tmp/wsos-extension.db")

console.log("Copied. Waiting for both services...")
ssh("sleep 5")
console.log("Dev: " + ssh("systemctl is-active nexus-dev").stdout.toString().trim())
console.log("Prod: " + ssh("systemctl is-active nexus").stdout.toString().trim())
