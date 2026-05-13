import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { spawnSync } from "bun"
import { parseCSV, decryptFile } from "D:\\repositories\\dev-infra\\agents\\scripts\\credentials\\crypto"

const KEY = join(process.env.TEMP!, "_nx_pod")
const csv = parseCSV(decryptFile())
const m = csv.find(r => r.category === "ssh" && r.name === "key-00")
if (!m?.secret) process.exit(1)
writeFileSync(KEY, m.secret + "\n", { mode: 0o600 })
process.on("exit", () => { try { unlinkSync(KEY) } catch {} })

const HOST = "root@178.105.97.246"
const run = (a: string[]) => spawnSync(["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", HOST, ...a], { stdio: ["inherit", "inherit", "inherit"] })
const scp = (a: string[]) => spawnSync(["scp", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", ...a], { stdio: ["inherit", "inherit", "inherit"] })

scp(["nx-od-prod.tar.gz", `${HOST}:/tmp/nx-od-prod.tar.gz`])
scp(["nx-od-scripts-prod.tar.gz", `${HOST}:/tmp/nx-od-scripts-prod.tar.gz`])
run(["systemctl", "stop", "nexus"])
run(["rm", "-rf", "/opt/services/nexus/src"])
run(["mkdir", "-p", "/opt/services/nexus/src"])
run(["tar", "-xzf", "/tmp/nx-od-prod.tar.gz", "-C", "/opt/services/nexus/src"])
run(["rm", "-rf", "/opt/services/nexus/scripts"])
run(["mkdir", "-p", "/opt/services/nexus/scripts"])
run(["tar", "-xzf", "/tmp/nx-od-scripts-prod.tar.gz", "-C", "/opt/services/nexus/scripts"])
run(["rm", "/tmp/nx-od-prod.tar.gz", "/tmp/nx-od-scripts-prod.tar.gz"])
run(["systemctl", "start", "nexus"])
run(["sleep", "3"])
run(["systemctl", "is-active", "nexus"])
