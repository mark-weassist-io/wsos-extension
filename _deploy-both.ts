import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { spawnSync } from "bun"
import { parseCSV, decryptFile } from "D:\\repositories\\dev-infra\\agents\\scripts\\credentials\\crypto"

const KEY = join(process.env.TEMP!, "_nx_both")
const csv = parseCSV(decryptFile())
const m = csv.find(r => r.category === "ssh" && r.name === "key-00")
if (!m?.secret) process.exit(1)
writeFileSync(KEY, m.secret + "\n", { mode: 0o600 })
process.on("exit", () => { try { unlinkSync(KEY) } catch {} })

const HOST = "root@178.105.97.246"
const run = (a: string[]) => spawnSync(["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", HOST, ...a], { stdio: ["inherit", "inherit", "inherit"] })
const scp = (a: string[]) => spawnSync(["scp", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", ...a], { stdio: ["inherit", "inherit", "inherit"] })

// Deploy to both instances
scp(["nx-trunc.tar.gz", `${HOST}:/tmp/nx-trunc.tar.gz`])

console.log("=== Dev ===")
run(["systemctl", "stop", "nexus-dev"])
run(["rm", "-rf", "/opt/nexus-dev/src"])
run(["mkdir", "-p", "/opt/nexus-dev/src"])
run(["tar", "-xzf", "/tmp/nx-trunc.tar.gz", "-C", "/opt/nexus-dev/src"])
run(["systemctl", "start", "nexus-dev"])
run(["sleep", "2"])
run(["systemctl", "is-active", "nexus-dev"])

run(["rm", "/tmp/nx-trunc.tar.gz"])

console.log("=== Prod SKIPPED — awaiting your phrase ===")
