import { Hono } from "hono"
import { z } from "zod"
import { CheckinsPage } from "../views/pages/Checkins"
import { getNinetyDayCheckins, getCheckinById, createCheckin, updateCheckin, softDeleteCheckin, restoreCheckin } from "../db/queries/checkins"
import { getOps } from "../db/queries/ops"
import { getCsStaffNames } from "../db/queries/ops"

const router = new Hono()
const STATUSES = ["Active", "Probation", "Inactive", "Separated", "Resigned", "Graduated"]

const CheckinSchema = z.object({
  opName: z.string().min(1, "OP is required").max(200),
  status: z.string().max(50).optional().default(""),
  notes: z.string().max(1000).optional().default(""),
  assignedCs: z.string().max(100).optional().default(""),
})

router.get("/", (c) => {
  const search = c.req.query("search")
  const trashed = c.req.query("trashed") === "1"
  const checkins = getNinetyDayCheckins(search, trashed)
  return c.html(<CheckinsPage checkins={checkins} search={search} showTrashed={trashed} />)
})

router.get("/new", (c) => {
  const ops = getOps().map(o => o.full_name)
  const csStaff = getCsStaffNames()
  return c.html(<CheckinsPage checkins={[]} editing={true} ops={ops} csStaff={csStaff} statuses={STATUSES} />)
})

router.post("/", async (c) => {
  const form = await c.req.parseBody()
  const parsed = CheckinSchema.safeParse(form)
  if (!parsed.success) {
    const ops = getOps().map(o => o.full_name)
    const csStaff = getCsStaffNames()
    return c.html(<CheckinsPage checkins={[]} editing={true} errors={parsed.error.flatten().fieldErrors as any} formData={form as any} ops={ops} csStaff={csStaff} statuses={STATUSES} />)
  }
  createCheckin(parsed.data)
  return c.redirect("/checkins")
})

router.get("/:id/edit", (c) => {
  const id = parseInt(c.req.param("id"))
  const item = getCheckinById(id)
  if (!item) return c.redirect("/checkins")
  const ops = getOps().map(o => o.full_name)
  const csStaff = getCsStaffNames()
  const f = item as any
  return c.html(<CheckinsPage checkins={[]} editing={true} editId={id}
    formData={{ opName: f.opName || f.op_name || "", status: f.status || "", notes: f.notes || "", assignedCs: f.assignedCs || f.assigned_cs || "" }}
    ops={ops} csStaff={csStaff} statuses={STATUSES} />)
})

router.post("/:id", async (c) => {
  const id = parseInt(c.req.param("id"))
  const form = await c.req.parseBody()
  const parsed = CheckinSchema.safeParse(form)
  if (!parsed.success) return c.redirect(`/checkins/${id}/edit`)
  updateCheckin(id, parsed.data)
  return c.redirect("/checkins")
})

router.post("/:id/delete", (c) => {
  softDeleteCheckin(parseInt(c.req.param("id")))
  return c.redirect("/checkins")
})

router.post("/:id/restore", (c) => {
  restoreCheckin(parseInt(c.req.param("id")))
  return c.redirect("/checkins?trashed=1")
})

export { router as checkinsRouter }
