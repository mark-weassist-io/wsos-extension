import { Hono } from "hono"
import { SchedulePage } from "../views/pages/Schedule"
import { getPost90DaySchedule, getUpcomingCheckins, getOverdueCheckins, getMilestoneHappened, toggleMilestone } from "../db/queries/checkins"

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
  // Fetch milestone happened flags for each OP
  const allFlags: Record<string, Record<string, number>> = {}
  for (const s of schedule) {
    allFlags[s.opName] = getMilestoneHappened(s.opName)
  }
  return c.html(<SchedulePage schedule={schedule} milestoneFlags={allFlags} filter={filter || undefined} />)
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
