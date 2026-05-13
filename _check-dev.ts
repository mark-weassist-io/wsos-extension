import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { spawnSync } from "bun"
import { parseCSV, decryptFile } from "D:\\repositories\\dev-infra\\agents\\scripts\\credentials\\crypto"

const KEY = join(process.env.TEMP!, "_nx_cd")
const csv = parseCSV(decryptFile())
const m = csv.find(r => r.category === "ssh" && r.name === "key-00")
if (!m?.secret) process.exit(1)
writeFileSync(KEY, m.secret + "\n", { mode: 0o600 })
process.on("exit", () => { try { unlinkSync(KEY) } catch {} })

const HOST = "root@178.105.97.246"
const ssh = (a: string) => spawnSync(["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", HOST, a], { stdio: ["inherit", "inherit", "inherit"] })

console.log("=== Dev service unit ===")
ssh("cat /etc/systemd/system/nexus-dev.service")
console.log("\n=== Dev source location ===")
ssh("ls -la /opt/services/nexus-dev/ 2>/dev/null || echo no /opt/services/nexus-dev")
console.log("\n=== Dev process info ===")
ssh("cat /proc/39255/cwd 2>/dev/null && cat /proc/39255/cmdline 2>/dev/null | tr '\0' ' ' || echo process 39255 gone")
