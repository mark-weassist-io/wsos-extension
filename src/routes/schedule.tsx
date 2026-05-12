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
  const opName = c.req.param("opName")
  const milestone = c.req.param("milestone")
  const next = toggleMilestone(decodeURIComponent(opName), decodeURIComponent(milestone))
  return c.html(`<td data-milestone="${milestone}" data-happened="${next}" style="cursor:pointer;text-align:center;background:${next ? '#22c55e' : 'transparent'};border-radius:4px" onclick="fetch('/schedule/toggle/${encodeURIComponent(opName)}/${milestone}',{method:'POST'}).then(r=>r.text()).then(h=>this.outerHTML=h)">${next ? '✓' : '○'}</td>`)
})

export { router as scheduleRouter }
