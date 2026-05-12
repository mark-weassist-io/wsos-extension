import { Hono } from "hono"
import { logger as honoLogger } from "hono/logger"
import { dashboardRouter } from "./routes/dashboard"
import { opsRouter } from "./routes/ops"
import { clientsRouter } from "./routes/clients"
import { onboardingRouter } from "./routes/onboarding"
import { checkinsRouter } from "./routes/checkins"
import { scheduleRouter } from "./routes/schedule"
import { csStaffRouter } from "./routes/cs-staff"
import { assignmentsRouter } from "./routes/assignments"
import { schema } from "./db"
import { getDb } from "./db"
import { ensureSchema } from "./db/schema"
import { config } from "./config"

const app = new Hono()

app.use("*", honoLogger())
app.use("*", async (c, next) => {
  c.res.headers.set("X-Content-Type-Options", "nosniff")
  c.res.headers.set("X-Frame-Options", "DENY")
  c.res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  return next()
})

app.onError((err, c) => {
  console.error(JSON.stringify({
    level: "error", method: c.req.method, path: c.req.url,
    error: err.message, stack: err.stack, timestamp: new Date().toISOString(),
  }))
  return c.html(`<html><body><h1>500 - Internal Server Error</h1><pre>${err.message}</pre></body></html>`, 500)
})

ensureSchema(getDb())

app.get("/health", (c) => {
  try {
    getDb().prepare("SELECT 1").get()
    return c.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(JSON.stringify({ level: "error", msg, timestamp: new Date().toISOString() }))
    return c.json({ status: "degraded", uptime: process.uptime(), timestamp: new Date().toISOString() }, 503)
  }
})

app.route("/", dashboardRouter)
app.route("/ops", opsRouter)
app.route("/clients", clientsRouter)
app.route("/onboarding", onboardingRouter)
app.route("/checkins", checkinsRouter)
app.route("/schedule", scheduleRouter)
app.route("/cs-staff", csStaffRouter)
app.route("/assignments", assignmentsRouter)

app.notFound((c) => c.redirect("/"))

export { app }
