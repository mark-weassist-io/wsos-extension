import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { spawnSync } from "bun"
import { parseCSV, decryptFile } from "D:\\repositories\\dev-infra\\agents\\scripts\\credentials\\crypto"

const KEY = join(process.env.TEMP!, "_nx_envfix")
const csv = parseCSV(decryptFile())
const match = csv.find(r => r.category === "ssh" && r.name === "key-00")
if (!match?.secret) { console.error("key-00 not found"); process.exit(1) }
writeFileSync(KEY, match.secret + "\n", { mode: 0o600 })
process.on("exit", () => { try { unlinkSync(KEY) } catch {} })

const HOST = "root@178.105.97.246"
const ssh = (args: string[]) => spawnSync(["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=15", ...args], { stdio: ["inherit", "inherit", "inherit"] })

// Check where old DB was
console.log("=== Old DB location ===")
ssh([HOST, "ls", "-la", "/opt/nexus/data/"])

// Update .env with DB_PATH
console.log("\n=== Updating .env ===")
ssh([HOST, "bash", "-c", `cat > /opt/services/nexus/.env << ENVEOF
ADMIN_SEED_PASSWORD=NexusAdmin2025!
STAFF_SEED_PASSWORD=NexusStaff2025!
DEFAULT_STAFF_PASSWORD=NexusStaff2025!
JWT_SECRET=nx-jwt-secret-9f8a7b6c5d4e3f2a1b0c
DB_PATH=/opt/nexus/data/wsos-extension.db
ENVEOF
cat /opt/services/nexus/.env`])

// Restart
console.log("\n=== Restarting ===")
ssh([HOST, "systemctl", "restart", "nexus"])
ssh([HOST, "sleep", "3"])
ssh([HOST, "systemctl", "status", "nexus", "--no-pager", "-l"])
