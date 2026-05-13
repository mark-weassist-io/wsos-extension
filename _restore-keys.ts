import { readFileSync, writeFileSync } from "fs"
import { join } from "path"

const cryptoPath = "C:\\Users\\MKB\\.config\\opencode\\skills\\credential-manager\\scripts\\crypto.ts"
const { decryptFile, encryptFile } = await import(cryptoPath)

const creds = JSON.parse(decryptFile())

// Read all 20 keys from the archive
const keysDir = "C:\\Users\\MKB\\Downloads\\ssh-keys"
if (!creds.vps.sshKeysContent) creds.vps.sshKeysContent = {}
if (!creds.vps.sshKeys) creds.vps.sshKeys = {}

const fs = await import("fs")
for (let i = 0; i <= 19; i++) {
  const name = `key-${i.toString().padStart(2, "0")}`
  const privPath = join(keysDir, name)
  const pubPath = join(keysDir, `${name}.pub`)
  if (!fs.existsSync(privPath)) continue
  const privContent = readFileSync(privPath, "utf-8")
  const b64 = Buffer.from(privContent, "utf-8").toString("base64")
  creds.vps.sshKeysContent[name] = b64
  if (fs.existsSync(pubPath)) {
    const pubContent = readFileSync(pubPath, "utf-8").trim()
    creds.vps.sshKeys[name] = { publicKey: pubContent, status: "unassigned" }
  }
}
creds.vps.sshKeyPool = "key-00 through key-19 (ed25519, all pre-authorized on VPS)"
creds.vps.sshActiveKey = "key-00"
creds.vps.sshNote = "Both laptops share this pool. Pick any key, copy private file to ~/.ssh/id_ed25519"

const tmpPath = join(process.env.TEMP!, "creds-final.json")
writeFileSync(tmpPath, JSON.stringify(creds, null, 2), "utf-8")
console.log(`Written to ${tmpPath}`)
console.log(`sshKeysContent: ${Object.keys(creds.vps.sshKeysContent).length} keys`)

// Encrypt via the CLI tool
