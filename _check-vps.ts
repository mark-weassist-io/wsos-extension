import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { spawnSync } from "bun"
import { parseCSV, decryptFile } from "D:\\repositories\\dev-infra\\agents\\scripts\\credentials\\crypto"

const KEY = join(process.env.TEMP!, "_nx_vps_check")
const csv = parseCSV(decryptFile())
const match = csv.find(r => r.category === "ssh" && r.name === "key-00")
if (!match?.secret) { console.error("key-00 not found"); process.exit(1) }
writeFileSync(KEY, match.secret + "\n", { mode: 0o600 })
process.on("exit", () => { try { unlinkSync(KEY) } catch {} })

const HOST = "root@178.105.97.246"
const ssh = (args: string[]) => spawnSync(["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=15", ...args], { stdio: ["inherit", "inherit", "inherit"] })

// Check for any GitHub-related auto-build or webhook listeners
console.log("=== Webhooks / listeners ===")
ssh([HOST, "systemctl", "list-units", "--type=service", "--all", "|", "grep", "-iE", "webhook|action|runner|github|gitea|drone|ci"])

console.log("\n=== Crontab for root ===")
ssh([HOST, "crontab", "-l", "2>/dev/null", "||", "echo", "no crontab"])

console.log("\n=== Docker containers ===")
ssh([HOST, "docker", "ps", "--no-trunc", "2>/dev/null", "||", "echo", "no docker"])

console.log("\n=== Processes with webhook/github ===")
ssh([HOST, "ps", "aux", "|", "grep", "-iE", "webhook|action|runner|github|deploy"])

console.log("\n=== Listening ports ===")
ssh([HOST, "ss", "-tlnp"])
