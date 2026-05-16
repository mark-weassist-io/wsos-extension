import { Hono } from "hono"
import { z } from "zod"
import { ExistingAccountsPage } from "../views/pages/ExistingAccounts"
import { getExistingAccounts, getExistingAccountById, createExistingAccount, updateExistingAccount, softDeleteExistingAccount, restoreExistingAccount } from "../db/queries/existing-accounts"

const router = new Hono()
const Schema = z.object({
  clientName: z.string().min(1, "Client name required").max(200),
  updateNote: z.string().max(500).optional().default(""),
  checkinFrequency: z.string().max(200).optional().default(""),
})

router.get("/", (c) => {
  const search = c.req.query("search")
  const trashed = c.req.query("trashed") === "1"
  const accounts = getExistingAccounts(search, trashed)
  return c.html(<ExistingAccountsPage accounts={accounts} search={search} showTrashed={trashed} />)
})

router.get("/new", (c) => {
  return c.html(<ExistingAccountsPage accounts={[]} editing={true} />)
})

router.post("/", async (c) => {
  const form = await c.req.parseBody()
  const parsed = Schema.safeParse(form)
  if (!parsed.success) {
    return c.html(<ExistingAccountsPage accounts={[]} editing={true} errors={parsed.error.flatten().fieldErrors as any} formData={form as any} />)
  }
  createExistingAccount(parsed.data)
  return c.redirect("/existing-accounts")
})

router.get("/:id/edit", (c) => {
  const id = parseInt(c.req.param("id"))
  const item = getExistingAccountById(id)
  if (!item) return c.redirect("/existing-accounts")
  const f = item as any
  return c.html(<ExistingAccountsPage accounts={getExistingAccounts()} editing={true} editId={id}
    formData={{ clientName: f.clientName || f.client_name || "", updateNote: f.updateNote || f.update_note || "", checkinFrequency: f.checkinFrequency || f.checkin_frequency || "" }} />)
})

router.post("/:id", async (c) => {
  const id = parseInt(c.req.param("id"))
  const form = await c.req.parseBody()
  const parsed = Schema.safeParse(form)
  if (!parsed.success) return c.redirect(`/existing-accounts/${id}/edit`)
  updateExistingAccount(id, parsed.data)
  return c.redirect("/existing-accounts")
})

router.post("/:id/delete", (c) => {
  softDeleteExistingAccount(parseInt(c.req.param("id")))
  return c.redirect("/existing-accounts")
})

router.post("/:id/restore", (c) => {
  restoreExistingAccount(parseInt(c.req.param("id")))
  return c.redirect("/existing-accounts?trashed=1")
})

export { router as existingAccountsRouter }
