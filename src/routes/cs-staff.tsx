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
  role: z.enum(["staff", "admin"]).default("staff"),
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

router.post("/", async (c) => {
  const userRole = c.get("userRole") as string
  if (userRole !== "admin") return c.redirect("/cs-staff")
  const form = await c.req.parseBody()
  const parsed = StaffSchema.safeParse(form)
  if (!parsed.success) return c.redirect("/cs-staff")
  if (!config.defaultStaffPassword) return c.redirect("/cs-staff?error=Default staff password not configured")
  const hash = await Bun.password.hash(config.defaultStaffPassword)
  createUser(parsed.data.email, hash, parsed.data.displayName, parsed.data.role, parsed.data.department)
  return c.redirect("/cs-staff")
})

router.post("/:id/delete", (c) => {
  const userRole = c.get("userRole") as string
  if (userRole !== "admin") return c.redirect("/cs-staff")
  softDeleteUser(parseInt(c.req.param("id")))
  return c.redirect("/cs-staff")
})

router.post("/:id/restore", (c) => {
  const userRole = c.get("userRole") as string
  if (userRole !== "admin") return c.redirect("/cs-staff")
  restoreUser(parseInt(c.req.param("id")))
  return c.redirect("/cs-staff?trashed=1")
})

export { router as csStaffRouter }
