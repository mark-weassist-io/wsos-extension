import { Database } from "bun:sqlite"
import { verifyDatabase, printReport } from "./data-quality/index"

import { join } from "path"
const DB_PATH = join(import.meta.dir, "..", "data", "wsos-extension.db")
const db = new Database(DB_PATH)
db.run("PRAGMA foreign_keys=ON")

const report = verifyDatabase(db)
printReport(report)

db.close()

if (!report.passed) {
  process.exit(1)
}
