import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { spawnSync } from "bun"
import { parseCSV, decryptFile } from "D:\\repositories\\dev-infra\\agents\\scripts\\credentials\\crypto"

const KEY = join(process.env.TEMP!, "_nx_v2")
const csv = parseCSV(decryptFile())
const match = csv.find(r => r.category === "ssh" && r.name === "key-00")
if (!match?.secret) { console.error("key-00 not found"); process.exit(1) }
writeFileSync(KEY, match.secret + "\n", { mode: 0o600 })
process.on("exit", () => { try { unlinkSync(KEY) } catch {} })

const HOST = "root@178.105.97.246"
const ssh = (args: string[], ttl = 30000) => spawnSync(["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=15", ...args], { stdio: ["inherit", "inherit", "inherit"], timeout: ttl })
const scp = (src: string, dst: string) => spawnSync(["scp", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=15", src, dst], { stdio: ["inherit", "inherit", "inherit"], timeout: 60000 })

console.log("=== Copying source archive ===")
scp("nx-src.tar.gz", `${HOST}:/tmp/nx-src.tar.gz`)

console.log("=== Extracting on VPS ===")
ssh([HOST, "rm", "-rf", "/opt/services/nexus/src"])
ssh([HOST, "mkdir", "-p", "/opt/services/nexus/src"])
ssh([HOST, "tar", "-xzf", "/tmp/nx-src.tar.gz", "-C", "/opt/services/nexus/src"])
ssh([HOST, "rm", "/tmp/nx-src.tar.gz"])

console.log("=== Restarting ===")
ssh([HOST, "systemctl", "restart", "nexus"], 10000)
ssh([HOST, "sleep", "4"])

console.log("=== Status ===")
ssh([HOST, "systemctl", "status", "nexus", "--no-pager", "-l"])
