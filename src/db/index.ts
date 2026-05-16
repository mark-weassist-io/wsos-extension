import { Database } from "bun:sqlite"
import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"
import { join } from "path"
import * as schema from "./schema-drizzle"

let _db: Database | null = null
let _drizzle: BunSQLiteDatabase<typeof schema> | null = null

const DB_PATH = Bun.env.DB_PATH || join(import.meta.dir, "..", "..", "data", "wsos-extension.db")

export function getDb(): Database {
  if (!_db) {
    _db = new Database(DB_PATH)
    _db.run("PRAGMA journal_mode=WAL")
    _db.run("PRAGMA foreign_keys=ON")
  }
  return _db
}

export function getDrizzle(): BunSQLiteDatabase<typeof schema> {
  if (!_drizzle) {
    _drizzle = drizzle(getDb(), { schema })
  }
  return _drizzle
}

export { schema }
