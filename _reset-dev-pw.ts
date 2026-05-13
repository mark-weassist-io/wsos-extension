import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { spawnSync } from "bun"
import { parseCSV, decryptFile } from "D:\\repositories\\dev-infra\\agents\\scripts\\credentials\\crypto"

const KEY = join(process.env.TEMP!, "_nx_rpw")
const m = parseCSV(decryptFile()).find(r => r.category === "ssh" && r.name === "key-00")
writeFileSync(KEY, m!.secret + "\n", { mode: 0o600 })
process.on("exit", () => { try { unlinkSync(KEY) } catch {} })

const HOST = "root@178.105.97.246"
const cmd = (a: string) => spawnSync(["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", HOST, a], { stdio: ["inherit", "inherit", "inherit"] })

// Generate hash locally like Bun does, then set it on VPS
// Bun uses bcrypt with 10 rounds
const pw = "NexusDevAdmin2025!"
const hash = spawnSync(["bun", "-e", `Bun.password.hash("${pw}").then(h=>console.log(h))`], { stdio: ["pipe", "pipe", "pipe"] })
const hashStr = hash.stdout.toString().trim()
console.log("Hash:", hashStr)

cmd(`sqlite3 /opt/nexus-dev/data/wsos-extension.db "UPDATE nexus_users SET password_hash='${hashStr}' WHERE email='mark@weassist.io';"`)
cmd(`sqlite3 /opt/nexus-dev/data/wsos-extension.db "UPDATE nexus_users SET password_hash='${hashStr}' WHERE email='eric@weassist.io';"`)
cmd(`echo "Updated"`)
