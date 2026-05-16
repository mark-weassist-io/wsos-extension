import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { spawnSync } from "bun"
import { parseCSV, decryptFile } from "D:\\repositories\\dev-infra\\agents\\scripts\\credentials\\crypto"

const KEY = join(process.env.TEMP!, "_nx_deploy")
const csv = parseCSV(decryptFile())
const match = csv.find(r => r.category === "ssh" && r.name === "key-00")
if (!match?.secret) { console.error("key-00 not found"); process.exit(1) }
writeFileSync(KEY, match.secret + "\n", { mode: 0o600 })
process.on("exit", () => { try { unlinkSync(KEY) } catch {} })

const SSH = (args: string[]) => spawnSync(["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=15", ...args], { stdio: ["inherit", "inherit", "inherit"] })
const HOST = "root@178.105.97.246"

// Step 1: Move binary and set up systemd
const setup = `
mkdir -p /opt/services/nexus
mv /tmp/nexus /opt/services/nexus/nexus
chmod +x /opt/services/nexus/nexus
`
SSH([HOST, "bash", "-c", setup])
if (SSH([HOST, "test", "-f", "/opt/services/nexus/nexus"]).exitCode !== 0) {
  console.error("Binary not found after mv"); process.exit(1)
}

// Step 2: Write systemd service
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

const writeService = `cat > /etc/systemd/system/nexus.service << 'EOF'
${serviceUnit}
EOF`
SSH([HOST, "bash", "-c", writeService])

// Step 3: Enable and start
SSH([HOST, "systemctl", "daemon-reload"])
SSH([HOST, "systemctl", "enable", "nexus"])
SSH([HOST, "systemctl", "start", "nexus"])

// Step 4: Verify
const status = SSH([HOST, "systemctl", "is-active", "nexus"])
console.log("nexus.service status:", status.stdout?.toString().trim() || "unknown")
