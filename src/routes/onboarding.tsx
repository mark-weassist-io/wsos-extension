import { Hono } from "hono"
import { z } from "zod"
import { OnboardingPage, StepRow } from "../views/pages/Onboarding"
import { getObRecords, getObStepsWithStatus, getObRecordById, toggleStepStatus } from "../db/queries/ob-records"
import { getDb } from "../db"
import { PersonQuery, IdParam, ToggleStepParams } from "../validation/schemas"

const router = new Hono()

router.get("/", (c) => {
  const query = PersonQuery.safeParse(c.req.query())
  const person = query.success ? query.data.person : undefined
  const records = getObRecords(undefined, person)
  const summaries = records.map(r => ({
    id: r.id,
    op_name: r.op_name,
    client_name: r.client_name || "",
    source_person: r.source_person || "",
    step_count: r.total_steps,
    completed_steps: r.done_steps,
    last_stage_completed: r.last_stage,
    overall_status: r.status,
  }))
  return c.html(<OnboardingPage summaries={summaries} person={person || undefined} />)
})

router.get("/:id", (c) => {
  const params = IdParam.safeParse(c.req.param())
  if (!params.success) return c.redirect("/onboarding")
  const { id } = params.data
  const record = getObRecordById(id)
  if (!record) return c.redirect("/onboarding")

  // Fetch rate from ops table
  const op = getDb().prepare("SELECT id, rate FROM wsos_ops WHERE full_name = ?").get(record.opName) as any

  const steps = getObStepsWithStatus(id)
  return c.html(<OnboardingPage summaries={[]} detail={{
    recordId: id,
    opId: op?.id || null,
    opName: record.opName,
    clientName: record.clientName,
    companyName: record.companyName,
    role: record.role,
    startDate: record.startDate,
    startTime: record.startTime,
    rate: op?.rate || record.rate || null,
    contactNumber: record.contactNumber,
    email: record.email,
    steps: steps.map(s => ({
      step_name: s.step_name,
      step_status: s.status,
      source_person: s.owner,
      owner: s.owner,
      notes: null,
      id: s.step_id,
    })),
  }} />)
})

// Update onboarding record (all editable fields)
router.post("/:id", async (c) => {
  const params = IdParam.safeParse(c.req.param())
  if (!params.success) return c.redirect("/onboarding")
  const { id } = params.data
  const form = await c.req.parseBody()
  const fields: string[] = []
  const vals: any[] = []
  const set = (col: string, val: string | null) => { fields.push(`${col} = ?`); vals.push(val) }
  const v = (k: string) => { const s = (form[k] || "").toString().trim(); return s || null }
  set("client_name", v("clientName"))
  set("company_name", v("companyName"))
  set("role", v("role"))
  set("start_date", v("startDate"))
  set("start_time", v("startTime"))
  set("contact_number", v("contactNumber"))
  set("email", v("email"))
  if (v("rate")) {
    getDb().prepare("UPDATE wsos_ops SET rate = ? WHERE full_name = (SELECT op_name FROM wa_ob_records WHERE id = ?)").run(v("rate"), id)
  }
  if (fields.length > 0) {
    vals.push(id)
    getDb().prepare(`UPDATE wa_ob_records SET ${fields.join(", ")} WHERE id = ?`).run(...vals)
  }
  return c.redirect(`/onboarding/${id}`)
})

// Toggle step status via HTMX
router.post("/:id/toggle/:stepDefId", (c) => {
  const params = ToggleStepParams.safeParse(c.req.param())
  if (!params.success) return c.text("Invalid params", 400)
  const { id, stepDefId } = params.data
  toggleStepStatus(id, stepDefId)
  const steps = getObStepsWithStatus(id)
  const idx = steps.findIndex(s => s.step_id === stepDefId)
  const step = steps.find(s => s.step_id === stepDefId)
  if (!step) return c.text("Step not found", 404)
  return c.html(<StepRow step={{ step_name: step.step_name, step_status: step.status || "Not Done", owner: step.owner, step_id: step.step_id, id: step.step_id, notes: null }} recordId={id} index={idx + 1} />)
})

export { router as onboardingRouter }
