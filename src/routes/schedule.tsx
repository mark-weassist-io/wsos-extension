import { Hono } from "hono"
import { SchedulePage } from "../views/pages/Schedule"
import { getPost90DaySchedule, getUpcomingCheckins, getOverdueCheckins, getMilestoneHappened, toggleMilestone } from "../db/queries/checkins"
import { getDb } from "../db"

const router = new Hono()

const MILESTONE_FIELDS: [string, string, number][] = [
  ["after3Mon", "3mo", 3], ["after4Mon", "4mo", 4], ["after5Mon", "5mo", 5],
  ["after6Mon", "6mo", 6], ["after9Mon", "9mo", 9], ["after1Year", "1yr", 12],
  ["after1Year3Months", "1yr3mo", 15],
]

function addMonths(dateStr: string, months: number): string {
  const m = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return ""
  const d = new Date(+m[3], +m[1] - 1, +m[2])
  d.setMonth(d.getMonth() + months)
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

router.get("/", (c) => {
  const filter = c.req.query("filter")
  let schedule: any[]
  if (filter === "upcoming") {
    schedule = getUpcomingCheckins() as any
  } else if (filter === "overdue") {
    schedule = getOverdueCheckins() as any
  } else {
    schedule = getPost90DaySchedule() as any
  }
  // Auto-calculate blank milestone dates from start_date
  for (const s of schedule) {
    if (!s.startDate) continue
    for (const [field, , offset] of MILESTONE_FIELDS) {
      if (!(s as any)[field]) {
        (s as any)[field] = addMonths(s.startDate, offset)
      }
    }
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
