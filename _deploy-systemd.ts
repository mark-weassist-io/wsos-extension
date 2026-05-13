import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { spawnSync } from "bun"
import { parseCSV, decryptFile } from "D:\\repositories\\dev-infra\\agents\\scripts\\credentials\\crypto"

const KEY = join(process.env.TEMP!, "_nx_deploy_final")
const csv = parseCSV(decryptFile())
const match = csv.find(r => r.category === "ssh" && r.name === "key-00")
if (!match?.secret) { console.error("key-00 not found"); process.exit(1) }
writeFileSync(KEY, match.secret + "\n", { mode: 0o600 })
process.on("exit", () => { try { unlinkSync(KEY) } catch {} })

const ssh = (args: string[], timeout = 15000) => {
  const s = spawnSync(["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=15", ...args], { stdio: ["inherit", "inherit", "inherit"], timeout })
  return s.exitCode ?? 1
}

const HOST = "root@178.105.97.246"
const SVC = `
[Unit]
Description=Nexus Operations Dashboard (Production)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/nexus
ExecStart=/root/.bun/bin/bun run src/index.ts
Restart=always
RestartSec=5
MemoryHigh=400M
MemoryMax=500M

[Install]
WantedBy=multi-user.target
`.trim()

// Write service file using Python (available everywhere)
const writePy = `
python3 -c "
f = open('/etc/systemd/system/nexus.service', 'w')
f.write('''${SVC.replace(/\n/g, '\\n').replace(/'/g, "\\'")}\\n''')
f.close()
"
`
console.log("Writing service file...")
ssh([HOST, "bash", "-c", writePy], 10000)

console.log("Reloading systemd...")
ssh([HOST, "systemctl", "daemon-reload"], 10000)

console.log("Enabling nexus...")
ssh([HOST, "systemctl", "enable", "nexus"], 10000)

console.log("Starting nexus...")
ssh([HOST, "systemctl", "start", "nexus"], 10000)

console.log("Waiting...")
ssh([HOST, "sleep", "3"], 5000)

console.log("Status:")
ssh([HOST, "systemctl", "status", "nexus", "--no-pager"], 10000)
