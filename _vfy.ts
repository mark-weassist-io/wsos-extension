import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { spawnSync } from "bun"
import { parseCSV, decryptFile } from "D:\\repositories\\dev-infra\\agents\\scripts\\credentials\\crypto"

const KEY = join(process.env.TEMP!, "_nx_vfy2")
const csv = parseCSV(decryptFile())
const match = csv.find(r => r.category === "ssh" && r.name === "key-00")
if (!match?.secret) { process.exit(1) }
writeFileSync(KEY, match.secret + "\n", { mode: 0o600 })
process.on("exit", () => { try { unlinkSync(KEY) } catch {} })

const HOST = "root@178.105.97.246"
const cmd = (a: string) => spawnSync(["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", HOST, a], { stdio: ["inherit", "inherit", "inherit"] })

// Check for new dropdown HTML elements in schedule page
cmd("curl -s http://localhost:3000/schedule | grep -oE 'ms-dd-toggle|ms-dd-opt|ms-dd-save|ms-dd-date' | sort | uniq")
console.log("\n=== Journal ===")
cmd("journalctl -u nexus --no-pager -n 10")
