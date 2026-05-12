import { Hono } from "hono"
import { SchedulePage } from "../views/pages/Schedule"
import { getPost90DaySchedule, getUpcomingCheckins, getOverdueCheckins, getMilestoneHappened, toggleMilestone } from "../db/queries/checkins"
import { getDb } from "../db"

const router = new Hono()

router.get("/", (c) => {
  const filter = c.req.query("filter")
  let schedule
  if (filter === "upcoming") {
    schedule = getUpcomingCheckins()
  } else if (filter === "overdue") {
    schedule = getOverdueCheckins()
  } else {
    schedule = getPost90DaySchedule()
  }
  // Fetch milestone happened + was_green flags for each OP
  const allFlags: Record<string, Record<string, number>> = {}
  const allGreen: Record<string, Record<string, number>> = {}
  const milestones = getDb().prepare("SELECT op_name, milestone, happened, was_green FROM checkin_milestones").all() as any[]
  for (const m of milestones) {
    if (!allFlags[m.op_name]) allFlags[m.op_name] = {}
    if (!allGreen[m.op_name]) allGreen[m.op_name] = {}
    allFlags[m.op_name][m.milestone] = m.happened
    allGreen[m.op_name][m.milestone] = m.was_green ?? 0
  }
  return c.html(<SchedulePage schedule={schedule} milestoneFlags={allFlags} milestoneGreen={allGreen} filter={filter || undefined} />)
})

router.post("/toggle/:opName/:milestone", async (c) => {
  const opName = decodeURIComponent(c.req.param("opName"))
  const milestone = decodeURIComponent(c.req.param("milestone"))
  const next = toggleMilestone(opName, milestone)
  // Return just the style change, keeping the original date text
  const bg = next ? '#22c55e' : 'transparent'
  const color = next ? '#fff' : 'inherit'
  // The client sends back the original date via a header or we just update the parent
  return c.body(null, 204)  // No content — client handles style toggle
})

export { router as scheduleRouter }
