import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { spawnSync } from "bun"
import { parseCSV, decryptFile } from "D:\\repositories\\dev-infra\\agents\\scripts\\credentials\\crypto"

const KEY = join(process.env.TEMP!, "_nx_dev")
const csv = parseCSV(decryptFile())
const m = csv.find(r => r.category === "ssh" && r.name === "key-00")
if (!m?.secret) { console.error("key-00 not found"); process.exit(1) }
writeFileSync(KEY, m.secret + "\n", { mode: 0o600 })
process.on("exit", () => { try { unlinkSync(KEY) } catch {} })

const HOST = "root@178.105.97.246"
const ssh = (a: string, ttl = 30000) => spawnSync(["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=15", HOST, a], { stdio: ["inherit", "inherit", "inherit"], timeout: ttl })
const scp = (src: string, dst: string) => spawnSync(["scp", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=15", src, dst], { stdio: ["inherit", "inherit", "inherit"], timeout: 60000 })

const DEV_DIR = "/opt/nexus-dev"

console.log("=== 1. Creating source archive ===")
const tarResult = spawnSync(["tar", "-czf", "nx-dev.tar.gz", "-C", "src", "."], { stdio: ["inherit", "inherit", "inherit"] })
if (tarResult.exitCode !== 0) { console.error("tar failed"); process.exit(1) }

console.log("=== 2. Copying archive ===")
scp("nx-dev.tar.gz", `${HOST}:/tmp/nx-dev.tar.gz`)

console.log("=== 3. Stopping dev service ===")
ssh("systemctl stop nexus-dev", 10000)

console.log("=== 4. Extracting source ===")
ssh(`rm -rf ${DEV_DIR}/src`)
ssh(`mkdir -p ${DEV_DIR}/src`)
ssh(`tar -xzf /tmp/nx-dev.tar.gz -C ${DEV_DIR}/src`)
ssh(`rm /tmp/nx-dev.tar.gz`)

console.log("=== 5. Writing .env ===")
ssh(`bash -c 'cat > ${DEV_DIR}/.env << ENVEOF
NODE_ENV=development
PORT=3001
HOST=127.0.0.1
ADMIN_SEED_PASSWORD=NexusDevAdmin2025!
STAFF_SEED_PASSWORD=NexusDevStaff2025!
DEFAULT_STAFF_PASSWORD=NexusDevStaff2025!
JWT_SECRET=nx-dev-jwt-abcdef1234567890
ENVEOF
chmod 600 ${DEV_DIR}/.env'`)

console.log("=== 6. Updating systemd service ===")
ssh(`bash -c 'cat > /etc/systemd/system/nexus-dev.service << SERVICEOF
[Unit]
Description=Nexus Operations Dashboard (Testing)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${DEV_DIR}
EnvironmentFile=${DEV_DIR}/.env
ExecStart=/root/.bun/bin/bun run src/index.ts
Restart=always
RestartSec=5
MemoryHigh=400M
MemoryMax=500M

[Install]
WantedBy=multi-user.target
SERVICEOF'`)

console.log("=== 7. Starting dev service ===")
ssh("systemctl daemon-reload")
ssh("systemctl start nexus-dev", 10000)
ssh("sleep 3")

console.log("=== 8. Status ===")
ssh("systemctl status nexus-dev --no-pager -l")
