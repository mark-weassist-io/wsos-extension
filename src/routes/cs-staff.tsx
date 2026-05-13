import { Hono } from "hono"
import { z } from "zod"
import { CsStaffPage } from "../views/pages/CsStaff"
import { getAllUsers, createUser, softDeleteUser, restoreUser } from "../db/queries/auth"
import { config } from "../config"

const router = new Hono()
const StaffSchema = z.object({
  displayName: z.string().min(1, "Name required").max(200),
  email: z.string().email("Valid email required"),
  department: z.string().default("customer_success"),
})

router.get("/", (c) => {
  const currentUserId = c.get("userId") as number
  const userRole = c.get("userRole") as string
  const trashed = c.req.query("trashed") === "1"
  const staff = getAllUsers(trashed)
  return c.html(<CsStaffPage staff={staff} currentUserId={currentUserId} userRole={userRole} />)
})

router.get("/new", (c) => {
  const currentUserId = c.get("userId") as number
  const userRole = c.get("userRole") as string
  const staff = getAllUsers(false)
  return c.html(<CsStaffPage staff={staff} showAdd={true} currentUserId={currentUserId} userRole={userRole} />)
})

router.get("/new", (c) => {
  const currentUserId = c.get("userId") as number
  const staff = getAllUsers(false)
  return c.html(<CsStaffPage staff={staff} showAdd={true} currentUserId={currentUserId} />)
})

router.post("/", async (c) => {
  const form = await c.req.parseBody()
  const parsed = StaffSchema.safeParse(form)
  if (!parsed.success) return c.redirect("/cs-staff")
  if (!config.defaultStaffPassword) return c.redirect("/cs-staff?error=Default staff password not configured")
  const hash = await Bun.password.hash(config.defaultStaffPassword)
  createUser(parsed.data.email, hash, parsed.data.displayName, "staff", parsed.data.department)
  return c.redirect("/cs-staff")
})

export { router as csStaffRouter }
