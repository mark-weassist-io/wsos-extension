import { serve } from "bun"
import { app } from "./app"
import { config } from "./config"
import { verify } from "hono/jwt"
import { getJwtSecret } from "./middleware/auth"
import { getUserById, getUserByEmail, createUser, hasAnyUser } from "./db/queries/auth"

function getCookie(req: Request, name: string): string | null {
  const raw = req.headers.get("cookie")
  if (!raw) return null
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=")
    if (k === name) return rest.join("=")
  }
  return null
}

const PUBLIC_PATHS = new Set(["/login", "/health", "/settings"])

async function isAuthenticated(req: Request): Promise<boolean> {
  const token = getCookie(req, "nexus_token")
  if (!token) return false
  try {
    const payload = await verify(token, getJwtSecret()) as { userId: number }
    return !!getUserById(payload.userId)
  } catch { return false }
}

// Seed admin users on first startup
if (!hasAnyUser()) {
  const { adminSeedPassword, staffSeedPassword } = config
  if (adminSeedPassword) {
    const adminHash = await Bun.password.hash(adminSeedPassword)
    createUser("mark@weassist.io", adminHash, "Mark", "admin", "development")
    createUser("eric@weassist.io", adminHash, "Eric", "admin", "development")
  }
  const { getDb } = await import("./db")
  if (staffSeedPassword) {
    const hash = await Bun.password.hash(staffSeedPassword)
    const staff = getDb().prepare("SELECT * FROM wa_cs_staff WHERE deleted_at IS NULL").all() as any[]
    let migrated = 0
    for (const s of staff) {
      const displayName = s.full_name || s.name || ""
      const email = s.email || `${displayName.toLowerCase().replace(/\s+/g, ".")}@weassist.io`
      if (!getUserByEmail(email)) { createUser(email, hash, displayName, "staff", "customer_success"); migrated++ }
    }
  }
  const { getDb: getDbNow } = await import("./db")
  getDbNow().prepare("UPDATE nexus_users SET department = 'development' WHERE email IN ('mark@weassist.io','eric@weassist.io') AND (department IS NULL OR department = '')").run()
  const staffToMigrate = getDbNow().prepare("SELECT * FROM wa_cs_staff WHERE deleted_at IS NULL").all() as any[]
  const staffHash = staffSeedPassword ? await Bun.password.hash(staffSeedPassword) : null
  for (const s of staffToMigrate) {
    const dn = s.full_name || s.name || ""
    const em = s.email || `${dn.toLowerCase().replace(/\s+/g, ".")}@weassist.io`
    if (em && !getUserByEmail(em) && staffHash) { createUser(em, staffHash, dn, "staff", "customer_success") }
  }
}

serve({
  async fetch(req) {
    const url = new URL(req.url)
    const path = url.pathname

    if (!PUBLIC_PATHS.has(path) && !path.startsWith("/login") && path !== "/health") {
      const authed = await isAuthenticated(req)
      if (!authed) {
        if (req.headers.get("hx-request")) return new Response(null, { status: 401 })
        return Response.redirect(`/login?redirect=${encodeURIComponent(path)}`)
      }
    }

    return app.fetch(req)
  },
  port: config.port,
  hostname: config.host,
})

console.log(`Nexus running at http://${config.host}:${config.port}`)
