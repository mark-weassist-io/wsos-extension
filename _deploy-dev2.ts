import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { spawnSync } from "bun"
import { parseCSV, decryptFile } from "D:\\repositories\\dev-infra\\agents\\scripts\\credentials\\crypto"

const KEY = join(process.env.TEMP!, "_nx_dv2")
const csv = parseCSV(decryptFile())
const m = csv.find(r => r.category === "ssh" && r.name === "key-00")
if (!m?.secret) process.exit(1)
writeFileSync(KEY, m.secret + "\n", { mode: 0o600 })
process.on("exit", () => { try { unlinkSync(KEY) } catch {} })

const HOST = "root@178.105.97.246"
const DEV = "/opt/nexus-dev"

const ssh = (a: string) => spawnSync(["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", HOST, a], { stdio: ["inherit", "inherit", "inherit"] })

console.log("=== Copying source ===")
spawnSync(["scp", "-i", KEY, "nx-dev2.tar.gz", `${HOST}:/tmp/nx-dev2.tar.gz`], { stdio: ["inherit", "inherit", "inherit"] })

console.log("=== Stopping dev ===")
ssh("systemctl stop nexus-dev")

console.log("=== Extracting ===")
ssh(`rm -rf ${DEV}/src`)
ssh(`mkdir -p ${DEV}/src`)
ssh(`tar -xzf /tmp/nx-dev2.tar.gz -C ${DEV}/src`)
ssh(`rm /tmp/nx-dev2.tar.gz`)

// Fix any buggy YYYY-MM-DD custom_dates stored earlier
console.log("=== Fixing buggy dates ===")
ssh(`sqlite3 ${DEV}/data/wsos-extension.db "UPDATE checkin_milestones SET custom_date = substr(custom_date,6,2)||'/'||substr(custom_date,9,2)||'/'||substr(custom_date,1,4) WHERE custom_date GLOB '????-??-??' AND custom_date NOT GLOB '??/??/????';"`)

console.log("=== Starting dev ===")
ssh("systemctl start nexus-dev")
ssh("sleep 3")
ssh("systemctl status nexus-dev --no-pager -l")
