import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { spawnSync } from "bun"
import { parseCSV, decryptFile } from "D:\\repositories\\dev-infra\\agents\\scripts\\credentials\\crypto"

const KEY = join(process.env.TEMP!, "_nx_b2")
const csv = parseCSV(decryptFile())
const m = csv.find(r => r.category === "ssh" && r.name === "key-00")
if (!m?.secret) process.exit(1)
writeFileSync(KEY, m.secret + "\n", { mode: 0o600 })
process.on("exit", () => { try { unlinkSync(KEY) } catch {} })

const HOST = "root@178.105.97.246"
const run = (a: string[]) => spawnSync(["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", HOST, ...a], { stdio: ["inherit", "inherit", "inherit"] })
const scp = (a: string[]) => spawnSync(["scp", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", ...a], { stdio: ["inherit", "inherit", "inherit"] })

scp(["nx-all.tar.gz", `${HOST}:/tmp/nx-all.tar.gz`])

// Deploy to dev
console.log("=== DEV ===")
run(["systemctl", "stop", "nexus-dev"])
run(["rm", "-rf", "/opt/nexus-dev/src"])
run(["mkdir", "-p", "/opt/nexus-dev/src"])
run(["tar", "-xzf", "/tmp/nx-all.tar.gz", "-C", "/opt/nexus-dev/src"])
run(["systemctl", "start", "nexus-dev"])
run(["sleep", "2"])
var d = run(["systemctl", "is-active", "nexus-dev"])

// Deploy to prod
console.log("=== PROD ===")
run(["systemctl", "stop", "nexus"])
run(["rm", "-rf", "/opt/services/nexus/src"])
run(["mkdir", "-p", "/opt/services/nexus/src"])
run(["tar", "-xzf", "/tmp/nx-all.tar.gz", "-C", "/opt/services/nexus/src"])
run(["rm", "/tmp/nx-all.tar.gz"])
run(["systemctl", "start", "nexus"])
run(["sleep", "2"])
var p = run(["systemctl", "is-active", "nexus"])

console.log("\nDev: " + (d.stdout?.toString().trim() || ""))
console.log("Prod: " + (p.stdout?.toString().trim() || ""))
