import { Database } from "bun:sqlite"
const db = new Database("data/wsos-extension.db", { readonly: false })
db.run("PRAGMA wal_checkpoint(TRUNCATE)")
db.run("PRAGMA journal_mode=DELETE")
db.close()
console.log("ok")
