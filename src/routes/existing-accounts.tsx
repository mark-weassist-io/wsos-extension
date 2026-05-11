import { Hono } from "hono"
import { ExistingAccountsPage } from "../views/pages/ExistingAccounts"
import { getDb } from "../db"
import type { ExistingAccount } from "../types"

const router = new Hono()

router.get("/", (c) => {
  const db = getDb()
  const accounts = db.prepare("SELECT * FROM wa_existing_accounts ORDER BY client_name").all() as ExistingAccount[]
  return c.html(<ExistingAccountsPage accounts={accounts} />)
})

export { router as existingAccountsRouter }
