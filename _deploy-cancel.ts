import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { spawnSync } from "bun"
import { parseCSV, decryptFile } from "D:\\repositories\\dev-infra\\agents\\scripts\\credentials\\crypto"

const KEY = join(process.env.TEMP!, "_nx_cn")
const csv = parseCSV(decryptFile())
const m = csv.find(r => r.category === "ssh" && r.name === "key-00")
if (!m?.secret) process.exit(1)
writeFileSync(KEY, m.secret + "\n", { mode: 0o600 })
process.on("exit", () => { try { unlinkSync(KEY) } catch {} })

const HOST = "root@178.105.97.246"
const scp = (a: string[]) => spawnSync(["scp", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", ...a], { stdio: ["inherit", "inherit", "inherit"] })
const ssh = (a: string) => spawnSync(["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=accept-new", HOST, a], { stdio: ["inherit", "inherit", "inherit"] })

scp(["nx-cancel.tar.gz", `${HOST}:/tmp/nx-cancel.tar.gz`])

const deploy = (svc: string, dir: string) => {
  ssh(`systemctl stop ${svc}`)
  ssh(`rm -rf ${dir}/src`)
  ssh(`mkdir -p ${dir}/src`)
  ssh(`tar -xzf /tmp/nx-cancel.tar.gz -C ${dir}/src`)
  ssh(`systemctl start ${svc}`)
  ssh("sleep 2")
  console.log(svc + ": " + ssh(`systemctl is-active ${svc}`).stdout.toString().trim())
}

deploy("nexus-dev", "/opt/nexus-dev")
deploy("nexus", "/opt/services/nexus")
ssh("rm /tmp/nx-cancel.tar.gz")
