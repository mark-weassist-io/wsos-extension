import { Hono } from "hono"
import { DashboardPage } from "../views/pages/Dashboard"
import { getMetrics, getPipelineStages, getAttentionItems, getCsWorkload, getRecentActivity, getStatusDistribution } from "../db/queries/dashboard"

const router = new Hono()

router.get("/", (c) => {
  const metrics = getMetrics()
  const pipeline = getPipelineStages()
  const attention = getAttentionItems()
  const workload = getCsWorkload()
  const activity = getRecentActivity()
  const statusDist = getStatusDistribution()
  return c.html(
    <DashboardPage
      metrics={metrics}
      pipeline={pipeline}
      attention={attention}
      workload={workload}
      activity={activity}
      statusDist={statusDist}
    />
  )
})

export { router as dashboardRouter }
