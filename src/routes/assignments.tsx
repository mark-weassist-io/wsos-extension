import { Hono } from "hono"
import { z } from "zod"
import { AssignmentsPage } from "../views/pages/Assignments"
import { getAssignments, getAssignmentById, createAssignment, updateAssignment, softDeleteAssignment, restoreAssignment } from "../db/queries/assignments"
import { getOps } from "../db/queries/ops"
import { getClients } from "../db/queries/clients"
import { getAllCsStaffNames } from "../db/queries/cs-staff"
import { getDb } from "../db"

const router = new Hono()
const AssignmentSchema = z.object({
  opName: z.string().min(1, "OP required"),
  clientName: z.string().min(1, "Client required"),
  role: z.string().max(200).optional().default(""),
  status: z.string().max(50).optional().default("Probation"),
  type: z.string().max(50).optional().default(""),
  startDate: z.string().max(20).optional().default(""),
  endDate: z.string().max(20).optional().default(""),
  rate: z.string().max(100).optional().default(""),
  assignedCs: z.string().max(100).optional().default(""),
})

function getStatuses(): string[] {
  const rows = getDb().prepare("SELECT name FROM wa_assignment_statuses ORDER BY name").all() as { name: string }[]
  return rows.map(r => r.name)
}

function dropdowns() {
  return {
    ops: getOps().map(o => o.full_name),
    clients: getClients().map(c => c.name),
    csStaff: getAllCsStaffNames(),
    statuses: getStatuses(),
  }
}

router.get("/", (c) => {
  const search = c.req.query("search")
  const trashed = c.req.query("trashed") === "1"
  const assignments = getAssignments(search, trashed)
  return c.html(<AssignmentsPage assignments={assignments} search={search || undefined} showTrashed={trashed} />)
})

router.get("/new", (c) => {
  return c.html(<AssignmentsPage assignments={[]} editing={true} {...dropdowns()} />)
})

router.post("/", async (c) => {
  const form = await c.req.parseBody()
  const parsed = AssignmentSchema.safeParse(form)
  if (!parsed.success) {
    return c.html(<AssignmentsPage assignments={[]} editing={true} errors={parsed.error.flatten().fieldErrors as any} formData={form as any} {...dropdowns()} />)
  }
  createAssignment(parsed.data as any)
  return c.redirect("/assignments")
})

router.get("/:id/edit", (c) => {
  const item = getAssignmentById(parseInt(c.req.param("id")))
  if (!item) return c.redirect("/assignments")
  return c.html(<AssignmentsPage assignments={getAssignments()} editing={true} editId={item.id} formData={item as any} {...dropdowns()} />)
})

router.post("/:id", async (c) => {
  const id = parseInt(c.req.param("id"))
  const form = await c.req.parseBody()
  const parsed = AssignmentSchema.safeParse(form)
  if (!parsed.success) {
    const item = getAssignmentById(id)
    return c.html(<AssignmentsPage assignments={[]} editing={true} editId={id} errors={parsed.error.flatten().fieldErrors as any} formData={form as any} {...dropdowns()} />)
  }
  updateAssignment(id, parsed.data as any)
  return c.redirect("/assignments")
})

router.post("/:id/delete", (c) => { softDeleteAssignment(parseInt(c.req.param("id"))); return c.redirect("/assignments") })
router.post("/:id/restore", (c) => { restoreAssignment(parseInt(c.req.param("id"))); return c.redirect("/assignments?trashed=1") })

export { router as assignmentsRouter }
