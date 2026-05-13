import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { spawnSync } from "bun"
import { parseCSV, decryptFile } from "D:\\repositories\\dev-infra\\agents\\scripts\\credentials\\crypto"

const KEY = join(process.env.TEMP!, "_nx_survey")
const csv = parseCSV(decryptFile())
const match = csv.find(r => r.category === "ssh" && r.name === "key-00")
if (!match?.secret) { console.error("key-00 not found"); process.exit(1) }
writeFileSync(KEY, match.secret + "\n", { mode: 0o600 })
process.on("exit", () => { try { unlinkSync(KEY) } catch {} })

const HOST = "root@46.224.121.96"
const ssh = (a: string) => spawnSync(["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=10", HOST, a], { stdio: ["inherit", "inherit", "inherit"] })

console.log("=== Elunari VPS Resources ===")
ssh("free -h && echo --- && df -h / && echo --- && nproc && echo --- && ls /opt/services/")
