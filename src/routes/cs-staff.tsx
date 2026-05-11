import { Hono } from "hono"
import { z } from "zod"
import { CsStaffPage } from "../views/pages/CsStaff"
import { getCsStaff, getCsStaffById, createCsStaff, updateCsStaff, softDeleteCsStaff, restoreCsStaff } from "../db/queries/cs-staff"

const router = new Hono()
const CsStaffSchema = z.object({ name: z.string().min(1, "Name required").max(100), fullName: z.string().max(200).optional().default("") })

router.get("/", (c) => {
  const staff = getCsStaff(c.req.query("search"), c.req.query("trashed") === "1")
  return c.html(<CsStaffPage staff={staff} />)
})

router.post("/", async (c) => {
  const form = await c.req.parseBody()
  const parsed = CsStaffSchema.safeParse(form)
  if (!parsed.success) return c.redirect("/cs-staff")
  createCsStaff({ name: parsed.data.name, fullName: parsed.data.fullName || undefined })
  return c.redirect("/cs-staff")
})

router.get("/:id/edit", (c) => {
  const staff = getCsStaff()
  const item = getCsStaffById(parseInt(c.req.param("id")))
  return c.html(<CsStaffPage staff={staff} editId={item?.id as number} formData={{ name: (item as any)?.name || "", fullName: (item as any)?.fullName || "" }} />)
})

router.post("/:id", async (c) => {
  const id = parseInt(c.req.param("id"))
  const form = await c.req.parseBody()
  const parsed = CsStaffSchema.safeParse(form)
  if (!parsed.success) return c.redirect(`/cs-staff/${id}/edit`)
  updateCsStaff(id, { name: parsed.data.name, fullName: parsed.data.fullName || undefined })
  return c.redirect("/cs-staff")
})

router.post("/:id/delete", (c) => { softDeleteCsStaff(parseInt(c.req.param("id"))); return c.redirect("/cs-staff") })
router.post("/:id/restore", (c) => { restoreCsStaff(parseInt(c.req.param("id"))); return c.redirect("/cs-staff?trashed=1") })

export { router as csStaffRouter }
