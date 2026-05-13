import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { spawnSync } from "bun"
import { parseCSV, decryptFile } from "D:\\repositories\\dev-infra\\agents\\scripts\\credentials\\crypto"

const KEY = join(process.env.TEMP!, "_nx_full_deploy")
const csv = parseCSV(decryptFile())
const match = csv.find(r => r.category === "ssh" && r.name === "key-00")
if (!match?.secret) { console.error("key-00 not found"); process.exit(1) }
writeFileSync(KEY, match.secret + "\n", { mode: 0o600 })
process.on("exit", () => { try { unlinkSync(KEY) } catch {} })

const HOST = "root@178.105.97.246"
const ssh = (args: string[]) => spawnSync(["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=15", ...args], { stdio: ["inherit", "inherit", "inherit"] })
const scp = (src: string, dst: string) => spawnSync(["scp", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=15", src, dst], { stdio: ["inherit", "inherit", "inherit"] })

// 1. Check existing state
console.log("\n=== Current nexus service ===")
ssh([HOST, "systemctl", "status", "nexus", "--no-pager", "-l"])

console.log("\n=== Current directory ===")
ssh([HOST, "ls", "-la", "/opt/services/nexus/"])

console.log("\n=== Current service file ===")
ssh([HOST, "cat", "/etc/systemd/system/nexus.service"])

// 2. Copy binary
console.log("\n=== Copying binary ===")
const binResult = scp("dist/nexus.exe", `${HOST}:/tmp/nexus`)
if (binResult.exitCode !== 0) { console.error("SCP failed"); process.exit(1) }

// 3. Setup directory and move binary
console.log("\n=== Setting up directory and binary ===")
ssh([HOST, "mkdir", "-p", "/opt/services/nexus"])
ssh([HOST, "mv", "/tmp/nexus", "/opt/services/nexus/nexus"])
ssh([HOST, "chmod", "+x", "/opt/services/nexus/nexus"])

// 4. Create .env (with new passwords)
console.log("\n=== Creating .env ===")
const envContent = `ADMIN_SEED_PASSWORD=NexusAdmin2025!
STAFF_SEED_PASSWORD=NexusStaff2025!
DEFAULT_STAFF_PASSWORD=NexusStaff2025!
JWT_SECRET=nx-jwt-secret-$(date +%s | md5sum | head -c 32)
`
ssh([HOST, "bash", "-c", `cat > /opt/services/nexus/.env << 'ENVEOF'
${envContent}ENVEOF`])

// 5. Write new systemd service with EnvironmentFile
console.log("\n=== Writing systemd service ===")
const serviceUnit = `[Unit]
Description=Nexus Operations Dashboard (Production)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/services/nexus
EnvironmentFile=/opt/services/nexus/.env
ExecStart=/opt/services/nexus/nexus
Restart=always
RestartSec=5
MemoryHigh=400M
MemoryMax=500M

[Install]
WantedBy=multi-user.target`

ssh([HOST, "bash", "-c", `cat > /etc/systemd/system/nexus.service << 'SERVICEOF'
${serviceUnit}
SERVICEOF`])

// 6. Reload and restart
console.log("\n=== Reloading systemd ===")
ssh([HOST, "systemctl", "daemon-reload"])
console.log("\n=== Restarting nexus ===")
ssh([HOST, "systemctl", "restart", "nexus"])
console.log("\n=== Waiting... ===")
ssh([HOST, "sleep", "3"])

// 7. Verify
console.log("\n=== Status ===")
ssh([HOST, "systemctl", "status", "nexus", "--no-pager", "-l"])
console.log("\n=== .env file ===")
ssh([HOST, "cat", "/opt/services/nexus/.env"])
