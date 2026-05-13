import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { spawnSync } from "bun"
import { parseCSV, decryptFile } from "D:\\repositories\\dev-infra\\agents\\scripts\\credentials\\crypto"

const KEY = join(process.env.TEMP!, "_nx_reload")
const csv = parseCSV(decryptFile())
const match = csv.find(r => r.category === "ssh" && r.name === "key-00")
if (!match?.secret) { console.error("key-00 not found"); process.exit(1) }
writeFileSync(KEY, match.secret + "\n", { mode: 0o600 })
process.on("exit", () => { try { unlinkSync(KEY) } catch {} })

const HOST = "root@178.105.97.246"
const ssh = (args: string[], ttl = 30000) => spawnSync(["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=15", ...args], { stdio: ["inherit", "inherit", "inherit"], timeout: ttl })
const scp = (src: string, dst: string) => spawnSync(["scp", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=15", src, dst], { stdio: ["inherit", "inherit", "inherit"], timeout: 60000 })

const ADMIN_PW = "NexusAdmin2025!"
const STAFF_PW = "NexusStaff2025!"
const JWT = "nx-jwt-secret-9f8a7b6c5d4e3f2a1b0c"

// 1. Copy updated source
console.log("=== Copying source archive ===")
scp("nx-src.tar.gz", `${HOST}:/tmp/nx-src.tar.gz`)

console.log("=== Extracting on VPS ===")
ssh([HOST, "rm", "-rf", "/opt/services/nexus/src"])
ssh([HOST, "mkdir", "-p", "/opt/services/nexus/src"])
ssh([HOST, "tar", "-xzf", "/tmp/nx-src.tar.gz", "-C", "/opt/services/nexus/src"])
ssh([HOST, "rm", "/tmp/nx-src.tar.gz"])

// 2. Write .env with DB_PATH
console.log("=== Writing .env ===")
ssh([HOST, "bash", "-c", `cat > /opt/services/nexus/.env << ENVEOF
ADMIN_SEED_PASSWORD=${ADMIN_PW}
STAFF_SEED_PASSWORD=${STAFF_PW}
DEFAULT_STAFF_PASSWORD=${STAFF_PW}
JWT_SECRET=${JWT}
DB_PATH=/opt/nexus/data/wsos-extension.db
ENVEOF`])

// 3. Restart
console.log("=== Restarting ===")
ssh([HOST, "systemctl", "restart", "nexus"], 10000)
ssh([HOST, "sleep", "4"])

// 4. Verify
console.log("=== Status ===")
ssh([HOST, "systemctl", "status", "nexus", "--no-pager", "-l"])
