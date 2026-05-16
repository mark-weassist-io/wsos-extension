import { Hono } from "hono"
import { setCookie, deleteCookie } from "hono/cookie"
import { LoginPage } from "../views/pages/Login"
import { authMiddleware, generateToken } from "../middleware/auth"
import { getUserByEmail, getUserById, createUser } from "../db/queries/auth"
import { Layout } from "../views/layout"
import type { SafeUser } from "../db/queries/auth"

const router = new Hono()

router.get("/login", (c) => {
  const error = c.req.query("error") || undefined
  const redirect = c.req.query("redirect") || undefined
  return c.html(<LoginPage error={error} redirect={redirect} />)
})

router.post("/login", async (c) => {
  const body = await c.req.parseBody()
  const email = (body.email as string || "").trim().toLowerCase()
  const password = body.password as string || ""
  const redirect = (body.redirect as string) || "/"

  if (!email || !password) {
    return c.redirect(`/login?error=${encodeURIComponent("Email and password required")}`)
  }

  const user = getUserByEmail(email)
  if (!user) {
    return c.redirect(`/login?error=${encodeURIComponent("Invalid email or password")}`)
  }

  const valid = await Bun.password.verify(password, user.password_hash)
  if (!valid) {
    return c.redirect(`/login?error=${encodeURIComponent("Invalid email or password")}`)
  }

  const token = await generateToken(user.id, user.role)
  setCookie(c, "nexus_token", token, {
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS
    sameSite: "Lax",
    path: "/",
    maxAge: 86400 * 7,
  })

  return c.redirect(redirect)
})

router.post("/logout", (c) => {
  deleteCookie(c, "nexus_token", { path: "/" })
  return c.redirect("/login")
})

// Profile settings (authenticated)
router.get("/settings", authMiddleware, (c) => {
  const user = c.get("user") as SafeUser
  const success = c.req.query("saved") === "1"
  const error = c.req.query("error") || undefined
  return c.html(
    <Layout title="Settings" activeNav="settings">
      <div class="page-header">
        <h2>Account Settings</h2>
      </div>
      <div class="card form-section" style="margin-top:16px">
        {success && <div class="alert alert-success py-2" style="font-size:0.85rem">Settings saved.</div>}
        {error && <div class="alert alert-danger py-2" style="font-size:0.85rem">{error}</div>}
        <form method="POST" action="/settings">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label" for="email">Email <span class="required">*</span></label>
              <input type="email" id="email" name="email" value={user.email} required class="form-control" />
            </div>
            <div class="col-md-6">
              <label class="form-label" for="display_name">Display Name</label>
              <input type="text" id="display_name" name="display_name" value={user.display_name} class="form-control" />
            </div>
            <div class="col-md-6">
              <label class="form-label" for="department">Department</label>
              <input type="text" id="department" name="department" value={user.department} class="form-control" disabled />
            </div>
            <div class="col-md-6">
              <label class="form-label" for="role">Role</label>
              <input type="text" id="role" name="role" value={user.role} class="form-control" disabled />
            </div>
          </div>
          <hr class="my-3" />
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label" for="current_password">Current Password <span class="required">*</span></label>
              <input type="password" id="current_password" name="current_password" class="form-control" />
            </div>
            <div class="col-md-6">
              <label class="form-label" for="new_password">New Password</label>
              <input type="password" id="new_password" name="new_password" class="form-control" placeholder="Leave blank to keep current" />
            </div>
            <div class="col-md-6">
              <label class="form-label" for="confirm_password">Confirm New Password</label>
              <input type="password" id="confirm_password" name="confirm_password" class="form-control" />
            </div>
          </div>
          <div class="d-flex gap-2 mt-3">
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
        <form method="POST" action="/logout" class="mt-3">
          <button type="submit" class="btn btn-outline-secondary btn-sm">Sign Out</button>
        </form>
      </div>
    </Layout>
  )
})

router.post("/settings", authMiddleware, async (c) => {
  const user = c.get("user") as SafeUser
  const body = await c.req.parseBody()
  const email = (body.email as string || "").trim().toLowerCase()
  const displayName = (body.display_name as string || "").trim()
  const currentPassword = body.current_password as string || ""
  const newPassword = body.new_password as string || ""
  const confirmPassword = body.confirm_password as string || ""

  if (!email) return c.redirect("/settings?error=Email is required")

  // Verify current password
  const fullUser = getUserByEmail(user.email)
  if (!fullUser || !(await Bun.password.verify(currentPassword, fullUser.password_hash))) {
    return c.redirect("/settings?error=Current password is incorrect")
  }

  // Change password if provided
  if (newPassword) {
    if (newPassword !== confirmPassword) {
      return c.redirect("/settings?error=New passwords do not match")
    }
    if (newPassword.length < 6) {
      return c.redirect("/settings?error=Password must be at least 6 characters")
    }
    const hash = await Bun.password.hash(newPassword)
    getDb().prepare("UPDATE nexus_users SET email = ?, display_name = ?, password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(email, displayName, hash, user.id)
  } else {
    getDb().prepare("UPDATE nexus_users SET email = ?, display_name = ?, updated_at = datetime('now') WHERE id = ?").run(email, displayName, user.id)
  }

  // Re-issue token since email could have changed
  const token = await generateToken(user.id, user.role)
  setCookie(c, "nexus_token", token, { httpOnly: true, sameSite: "Lax", path: "/", maxAge: 86400 * 7 })

  return c.redirect("/settings?saved=1")
})

function getDb() {
  const { getDb } = require("../db")
  return getDb()
}

export { router as authRouter }
