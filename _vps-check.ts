import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { spawnSync } from "bun"
import { parseCSV, decryptFile } from "D:\\repositories\\dev-infra\\agents\\scripts\\credentials\\crypto"

const KEY = join(process.env.TEMP!, "_nx_vpc")
const csv = parseCSV(decryptFile())
const m = csv.find(r => r.category === "ssh" && r.name === "key-00")
if (!m?.secret) process.exit(1)
writeFileSync(KEY, m.secret + "\n", { mode: 0o600 })
process.on("exit", () => { try { unlinkSync(KEY) } catch {} })

const HOST = "root@178.105.97.246"
const ssh = (a: string) => spawnSync(["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", HOST, a], { stdio: ["inherit", "inherit", "inherit"] })

console.log("=== Services ===")
ssh("systemctl list-units --type=service --all | grep -i nexus")
console.log("\n=== /opt/services/ ===")
ssh("ls -la /opt/services/")
console.log("\n=== Caddy config ===")
ssh("cat /etc/caddy/Caddyfile 2>/dev/null || cat /etc/caddy/Caddyfile.json 2>/dev/null || echo no caddy config found")
console.log("\n=== Ports ===")
ssh("ss -tlnp | grep -E '3000|3001'")
console.log("\n=== /opt/nexus/ legacy ===")
ssh("ls -la /opt/nexus/ 2>/dev/null && cat /opt/nexus/src/db/index.ts 2>/dev/null | head -15 || echo no legacy")
