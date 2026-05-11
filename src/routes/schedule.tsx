import { Hono } from "hono"
import { SchedulePage } from "../views/pages/Schedule"
import { getPost90DaySchedule, getUpcomingCheckins, getOverdueCheckins } from "../db/queries/checkins"

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
  return c.html(<SchedulePage schedule={schedule} filter={filter || undefined} />)
})

export { router as scheduleRouter }
