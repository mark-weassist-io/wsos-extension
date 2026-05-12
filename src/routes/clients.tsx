import { Hono } from "hono"
import { z } from "zod"
import { ClientsPage } from "../views/pages/ClientsList"
import { getClients, getClientById, createClient, updateClient, softDeleteClient, restoreClient } from "../db/queries/clients"

const router = new Hono()
const ClientSchema = z.object({
  name: z.string().min(1, "Name required").max(200),
  email: z.string().max(200).optional().default(""),
})

router.get("/", (c) => {
  const clients = getClients(c.req.query("search"), c.req.query("trashed") === "1")
  return c.html(<ClientsPage clients={clients} search={c.req.query("search") || undefined} />)
})

router.get("/new", (c) => {
  return c.html(<ClientsPage clients={[]} editing={true} />)
})

router.post("/", async (c) => {
  const form = await c.req.parseBody()
  const parsed = ClientSchema.safeParse(form)
  if (!parsed.success) return c.html(<ClientsPage clients={[]} editing={true} errors={parsed.error.flatten().fieldErrors as any} formData={form as any} />)
  createClient(parsed.data)
  return c.redirect("/clients")
})

router.get("/:id/edit", (c) => {
  const item = getClientById(parseInt(c.req.param("id")))
  if (!item) return c.redirect("/clients")
  return c.html(<ClientsPage clients={getClients()} editing={true} editId={item.id} formData={{ name: (item as any).name || "", email: (item as any).email || "", timezone: (item as any).timezone || "", holidaySchedule: (item as any).holidaySchedule || "" }} />)
})

router.post("/:id", async (c) => {
  const id = parseInt(c.req.param("id"))
  const form = await c.req.parseBody()
  const parsed = ClientSchema.safeParse(form)
  if (!parsed.success) return c.redirect(`/clients/${id}/edit`)
  updateClient(id, parsed.data)
  return c.redirect("/clients")
})

router.post("/:id/delete", (c) => { softDeleteClient(parseInt(c.req.param("id"))); return c.redirect("/clients") })
router.post("/:id/restore", (c) => { restoreClient(parseInt(c.req.param("id"))); return c.redirect("/clients?trashed=1") })

export { router as clientsRouter }
