import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { spawnSync } from "bun"
import { parseCSV, decryptFile } from "D:\\repositories\\dev-infra\\agents\\scripts\\credentials\\crypto"

const KEY = join(process.env.TEMP!, "_nx_q")
const csv = parseCSV(decryptFile())
const m = csv.find(r => r.category === "ssh" && r.name === "key-00")
if (!m?.secret) process.exit(1)
writeFileSync(KEY, m.secret + "\n", { mode: 0o600 })
process.on("exit", () => { try { unlinkSync(KEY) } catch {} })

const HOST = "root@178.105.97.246"
const run = (a: string[]) => spawnSync(a, { stdio: ["inherit", "inherit", "inherit"] })

run(["scp", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", "nx-fix2.tar.gz", `${HOST}:/tmp/nx-fix2.tar.gz`])
run(["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", HOST, "systemctl stop nexus-dev && rm -rf /opt/nexus-dev/src && mkdir -p /opt/nexus-dev/src && tar -xzf /tmp/nx-fix2.tar.gz -C /opt/nexus-dev/src && rm /tmp/nx-fix2.tar.gz && systemctl start nexus-dev && sleep 3 && systemctl is-active nexus-dev"])
