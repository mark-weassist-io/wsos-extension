import { Hono } from "hono"
import { z } from "zod"
import { AssignmentsPage } from "../views/pages/Assignments"
import { getAssignments, getAssignmentById, createAssignment, updateAssignment, softDeleteAssignment, restoreAssignment } from "../db/queries/assignments"
import { getOps } from "../db/queries/ops"
import { getClients } from "../db/queries/clients"
import { getAllCsStaffNames } from "../db/queries/cs-staff"

const router = new Hono()
const AssignmentSchema = z.object({
  opName: z.string().min(1, "OP required"),
  clientName: z.string().min(1, "Client required"),
  role: z.string().max(200).optional().default(""),
  status: z.string().max(50).optional().default("Probation"),
  type: z.string().max(50).optional().default(""),
  startDate: z.string().max(20).optional().default(""),
  endDate: z.string().max(20).optional().default(""),
  rate: z.coerce.number().optional().default(0),
  assignedCs: z.string().max(100).optional().default(""),
})

router.get("/", (c) => {
  const assignments = getAssignments(c.req.query("search"), c.req.query("trashed") === "1")
  return c.html(<AssignmentsPage assignments={assignments} />)
})

router.get("/new", (c) => {
  const ops = getOps().map(o => o.full_name)
  const clients = getClients().map(c => c.name)
  const csStaff = getAllCsStaffNames()
  return c.html(<AssignmentsPage assignments={[]} editing={true} ops={ops} clients={clients} csStaff={csStaff} />)
})

router.post("/", async (c) => {
  const form = await c.req.parseBody()
  const parsed = AssignmentSchema.safeParse(form)
  if (!parsed.success) { console.log(parsed.error); return c.redirect("/assignments/new") }
  createAssignment(parsed.data as any)
  return c.redirect("/assignments")
})

router.get("/:id/edit", (c) => {
  const item = getAssignmentById(parseInt(c.req.param("id")))
  if (!item) return c.redirect("/assignments")
  const ops = getOps().map(o => o.full_name)
  const clients = getClients().map(c => c.name)
  const csStaff = getAllCsStaffNames()
  return c.html(<AssignmentsPage assignments={getAssignments()} editing={true} editId={item.id} formData={item as any} ops={ops} clients={clients} csStaff={csStaff} />)
})

router.post("/:id", async (c) => {
  const id = parseInt(c.req.param("id"))
  const form = await c.req.parseBody()
  const parsed = AssignmentSchema.safeParse(form)
  if (!parsed.success) return c.redirect(`/assignments/${id}/edit`)
  updateAssignment(id, parsed.data as any)
  return c.redirect("/assignments")
})

router.post("/:id/delete", (c) => { softDeleteAssignment(parseInt(c.req.param("id"))); return c.redirect("/assignments") })
router.post("/:id/restore", (c) => { restoreAssignment(parseInt(c.req.param("id"))); return c.redirect("/assignments?trashed=1") })

export { router as assignmentsRouter }
