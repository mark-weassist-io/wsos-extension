import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { spawnSync } from "bun"
import { parseCSV, decryptFile } from "D:\\repositories\\dev-infra\\agents\\scripts\\credentials\\crypto"

const KEY = join(process.env.TEMP!, "_nx_src_deploy")
const csv = parseCSV(decryptFile())
const match = csv.find(r => r.category === "ssh" && r.name === "key-00")
if (!match?.secret) { console.error("key-00 not found"); process.exit(1) }
writeFileSync(KEY, match.secret + "\n", { mode: 0o600 })
process.on("exit", () => { try { unlinkSync(KEY) } catch {} })

const HOST = "root@178.105.97.246"
const ssh = (args: string[], ttl = 30000) => spawnSync(["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=15", ...args], { stdio: ["inherit", "inherit", "inherit"], timeout: ttl })
const scp = (src: string, dst: string) => spawnSync(["scp", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=15", "-r", src, dst], { stdio: ["inherit", "inherit", "inherit"], timeout: 120000 })

const ADMIN_PW = "NexusAdmin2025!"
const STAFF_PW = "NexusStaff2025!"
const JWT_SECRET = "nx-jwt-secret-9f8a7b6c5d4e3f2a1b0c"

// 1. Copy source to VPS
console.log("=== Copying source ===")
ssh([HOST, "mkdir", "-p", "/opt/services/nexus/src"])
scp("src/", `${HOST}:/opt/services/nexus/src/`)
scp("package.json", `${HOST}:/opt/services/nexus/package.json`)
scp("tsconfig.json", `${HOST}:/opt/services/nexus/tsconfig.json`)

// 2. Install deps
console.log("=== Installing deps ===")
ssh([HOST, "cd", "/opt/services/nexus", "&&", "/root/.bun/bin/bun", "install", "--production"])

// 3. Create .env
console.log("=== Creating .env ===")
ssh([HOST, "bash", "-c", `cat > /opt/services/nexus/.env << ENVEOF
ADMIN_SEED_PASSWORD=${ADMIN_PW}
STAFF_SEED_PASSWORD=${STAFF_PW}
DEFAULT_STAFF_PASSWORD=${STAFF_PW}
JWT_SECRET=${JWT_SECRET}
ENVEOF
chmod 600 /opt/services/nexus/.env`])

// 4. Write systemd service
console.log("=== Writing systemd service ===")
const serviceUnit = `[Unit]
Description=Nexus Operations Dashboard (Production)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/services/nexus
EnvironmentFile=/opt/services/nexus/.env
ExecStart=/root/.bun/bin/bun run src/index.ts
Restart=always
RestartSec=5
MemoryHigh=400M
MemoryMax=500M

[Install]
WantedBy=multi-user.target`

ssh([HOST, "bash", "-c", `cat > /etc/systemd/system/nexus.service << 'SERVICEOF'
${serviceUnit}
SERVICEOF`])

// 5. Restart
console.log("=== Restarting ===")
ssh([HOST, "systemctl", "daemon-reload"])
ssh([HOST, "systemctl", "restart", "nexus"], 10000)
ssh([HOST, "sleep", "3"])

// 6. Verify
console.log("=== Status ===")
ssh([HOST, "systemctl", "status", "nexus", "--no-pager", "-l"])
