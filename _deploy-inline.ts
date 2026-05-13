import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { spawnSync } from "bun"
import { parseCSV, decryptFile } from "D:\\repositories\\dev-infra\\agents\\scripts\\credentials\\crypto"

const KEY = join(process.env.TEMP!, "_nx_inl")
const csv = parseCSV(decryptFile())
const m = csv.find(r => r.category === "ssh" && r.name === "key-00")
if (!m?.secret) process.exit(1)
writeFileSync(KEY, m.secret + "\n", { mode: 0o600 })
process.on("exit", () => { try { unlinkSync(KEY) } catch {} })

const HOST = "root@178.105.97.246"
const ssh = (a: string) => spawnSync(["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", HOST, a], { stdio: ["inherit", "inherit", "inherit"] })
const scp = (s: string, d: string) => spawnSync(["scp", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", s, d], { stdio: ["inherit", "inherit", "inherit"] })

scp("nx-fix.tar.gz", `${HOST}:/tmp/nx-fix.tar.gz`)
ssh("systemctl stop nexus-dev")
ssh("rm -rf /opt/nexus-dev/src")
ssh("mkdir -p /opt/nexus-dev/src")
ssh("tar -xzf /tmp/nx-fix.tar.gz -C /opt/nexus-dev/src")
ssh("rm /tmp/nx-fix.tar.gz")
ssh("systemctl start nexus-dev")
ssh("sleep 3")
ssh("systemctl is-active nexus-dev")
