import { Hono } from "hono"
import { z } from "zod"
import { OpsListPage } from "../views/pages/OpsList"
import { getOpsWithAssignments, getOpById, getOpsCount, createOp, updateOp, softDeleteOp, restoreOp, getOpPhones, getOpAssignment, upsertOpAssignment, getClientsForDropdown, getAssignmentStatuses, getCsStaffNames } from "../db/queries/ops"
import { getDb } from "../db"

const router = new Hono()

const CreateOpSchema = z.object({
  fullName: z.string().min(1, "Name is required").max(200),
  firstName: z.string().max(100).optional().default(""),
  lastName: z.string().max(100).optional().default(""),
  email: z.string().max(200).optional().default(""),
  phone: z.string().max(50).optional().default(""),
  gender: z.string().max(20).optional().default(""),
  nickname: z.string().max(100).optional().default(""),
  rate: z.string().max(100).optional().default(""),
  client: z.string().max(200).optional().default(""),
  role: z.string().max(100).optional().default(""),
  status: z.string().max(50).optional().default(""),
  assignedCs: z.string().max(100).optional().default(""),
})

router.get("/", (c) => {
  const search = c.req.query("search")
  const trashed = c.req.query("trashed") === "1"
  const ops = getOpsWithAssignments(search, trashed)
  const total = getOpsCount()
  // Attach phones from one-to-many table
  const opsWithPhones = ops.map(o => ({ ...o, phones: getOpPhones(o.full_name) }))
  // Attach latest checkin status
  const opsWithCheckin = opsWithPhones.map(o => {
    const checkin = getDb().prepare("SELECT status FROM wsos_ninety_day_checkins WHERE op_name = ? ORDER BY id DESC LIMIT 1").get(o.full_name) as any
    return { ...o, checkin_status: checkin?.status || null }
  })
  return c.html(<OpsListPage ops={opsWithCheckin as any} search={search} total={total} showTrashed={trashed} />)
})

router.get("/new", (c) => {
  return c.html(<OpsListPage ops={[]} search="" total={0} showTrashed={false} editing={true}
    clients={getClientsForDropdown()} statuses={getAssignmentStatuses()} csStaff={getCsStaffNames()} />)
})

router.post("/", async (c) => {
  const form = await c.req.parseBody()
  const parsed = CreateOpSchema.safeParse(form)
  if (!parsed.success) {
    return c.html(<OpsListPage ops={[]} search="" total={0} showTrashed={false} editing={true}
      errors={parsed.error.flatten().fieldErrors as Record<string, string>} formData={form as Record<string, string>}
      clients={getClientsForDropdown()} statuses={getAssignmentStatuses()} csStaff={getCsStaffNames()} />)
  }
  const { fullName, firstName, lastName, email, phone, gender, nickname, rate, client, role, status, assignedCs } = parsed.data
  createOp({ fullName, firstName: firstName || undefined, lastName: lastName || undefined, email: email || undefined, phone: phone || undefined, gender: gender || undefined, nickname: nickname || undefined, rate: rate || undefined })
  if (client) {
    upsertOpAssignment(fullName, { clientName: client, role: role || undefined, status: status || undefined, assignedCs: assignedCs || undefined })
  }
  return c.redirect("/ops")
})

router.get("/:id/edit", (c) => {
  const id = parseInt(c.req.param("id"))
  const op = getOpById(id)
  if (!op) return c.redirect("/ops")
  const ops = getOpsWithAssignments()
  const raw = op as any
  const formData: Record<string, string> = {
    fullName: raw.full_name || raw.fullName || "",
    firstName: raw.first_name || raw.firstName || "",
    lastName: raw.last_name || raw.lastName || "",
    email: raw.email || "",
    phone: raw.phone || "",
    gender: raw.gender || "",
    nickname: raw.nickname || "",
    rate: raw.rate || "",
  }
  const fullName = raw.full_name || raw.fullName || ""
  if (fullName) {
    const assignment = getOpAssignment(fullName)
    if (assignment) {
      formData.client = assignment.clientName || ""
      formData.role = assignment.role || ""
      formData.status = assignment.status || ""
      formData.assignedCs = assignment.assignedCs || ""
    }
  }
  return c.html(<OpsListPage ops={ops} search="" total={0} showTrashed={false} editing={true} editId={id}
    formData={formData} clients={getClientsForDropdown()} statuses={getAssignmentStatuses()} csStaff={getCsStaffNames()} />)
})

router.post("/:id", async (c) => {
  const id = parseInt(c.req.param("id"))
  const form = await c.req.parseBody()
  const parsed = z.object({
    fullName: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    gender: z.string().optional(),
    nickname: z.string().optional(),
    rate: z.string().optional(),
    client: z.string().optional(),
    role: z.string().optional(),
    status: z.string().optional(),
    assignedCs: z.string().optional(),
  }).safeParse(form)
  if (!parsed.success) return c.redirect(`/ops/${id}/edit`)
  updateOp(id, { fullName: parsed.data.fullName, firstName: parsed.data.firstName, lastName: parsed.data.lastName, email: parsed.data.email, phone: parsed.data.phone, gender: parsed.data.gender, nickname: parsed.data.nickname, rate: parsed.data.rate })
  const op = getOpById(id) as any
  const opName = op?.full_name || op?.fullName || parsed.data.fullName
  if (opName) {
    upsertOpAssignment(opName, { clientName: parsed.data.client, role: parsed.data.role, status: parsed.data.status, assignedCs: parsed.data.assignedCs })
  }
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
