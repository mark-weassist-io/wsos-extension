import { Hono } from "hono"
import { z } from "zod"
import { OpsListPage } from "../views/pages/OpsList"
import { getOpsWithAssignments, getOpById, getOpsCount, createOp, updateOp, softDeleteOp, restoreOp, getOpPhones } from "../db/queries/ops"
import { getCsStaff } from "../db/queries/cs-staff"

const router = new Hono()

const CreateOpSchema = z.object({
  fullName: z.string().min(1, "Name is required").max(200),
  firstName: z.string().max(100).optional().default(""),
  lastName: z.string().max(100).optional().default(""),
  email: z.string().max(200).optional().default(""),
  phone: z.string().max(50).optional().default(""),
  gender: z.string().max(20).optional().default(""),
  nickname: z.string().max(100).optional().default(""),
})

router.get("/", (c) => {
  const search = c.req.query("search")
  const trashed = c.req.query("trashed") === "1"
  const ops = getOpsWithAssignments(search, trashed)
  const total = getOpsCount()
  return c.html(<OpsListPage ops={ops} search={search} total={total} showTrashed={trashed} />)
})

router.get("/new", (c) => {
  return c.html(<OpsListPage ops={[]} search="" total={0} showTrashed={false} editing={true} />)
})

router.post("/", async (c) => {
  const form = await c.req.parseBody()
  const parsed = CreateOpSchema.safeParse(form)
  if (!parsed.success) {
    return c.html(<OpsListPage ops={[]} search="" total={0} showTrashed={false} editing={true} errors={parsed.error.flatten().fieldErrors as Record<string, string>} formData={form as Record<string, string>} />)
  }
  const { fullName, firstName, lastName, email, phone, gender, nickname } = parsed.data
  createOp({ fullName, firstName: firstName || undefined, lastName: lastName || undefined, email: email || undefined, phone: phone || undefined, gender: gender || undefined, nickname: nickname || undefined })
  return c.redirect("/ops")
})

router.get("/:id/edit", (c) => {
  const id = parseInt(c.req.param("id"))
  const op = getOpById(id, true)
  if (!op) return c.redirect("/ops")
  const ops = getOpsWithAssignments()
  return c.html(<OpsListPage ops={ops} search="" total={0} showTrashed={false} editing={true} editId={id} formData={op as unknown as Record<string, string>} />)
})

router.post("/:id", async (c) => {
  const id = parseInt(c.req.param("id"))
  const form = await c.req.parseBody()
  const parsed = CreateOpSchema.partial().safeParse(form)
  if (!parsed.success) return c.redirect(`/ops/${id}/edit`)
  updateOp(id, parsed.data as any)
  return c.redirect("/ops")
})

router.post("/:id/delete", (c) => {
  softDeleteOp(parseInt(c.req.param("id")))
  return c.redirect("/ops")
})

router.post("/:id/restore", (c) => {
  restoreOp(parseInt(c.req.param("id")))
  return c.redirect("/ops?trashed=1")
})

export { router as opsRouter }
