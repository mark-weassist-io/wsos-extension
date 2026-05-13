import { writeFileSync, unlinkSync } from "fs"
import { spawnSync } from "bun"
import { parseCSV, decryptFile } from "D:\\repositories\\dev-infra\\agents\\scripts\\credentials\\crypto"

const KEY = require("path").join(process.env.TEMP, "_nx_vfy")
const m = parseCSV(decryptFile()).find(r => r.category === "ssh" && r.name === "key-00")
writeFileSync(KEY, m!.secret + "\n", { mode: 0o600 })
process.on("exit", () => { try { unlinkSync(KEY) } catch {} })

const r = spawnSync(["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", "root@178.105.97.246",
  "curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "http://localhost:3000/schedule"
], { stdio: ["pipe", "pipe", "pipe"] })
console.log("HTTP:", r.stdout.toString().trim())
