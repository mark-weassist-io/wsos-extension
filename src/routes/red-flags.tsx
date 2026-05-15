import { Hono } from "hono"
import { z } from "zod"
import { RedFlagsPage } from "../views/pages/RedFlags"
import { getRedFlags, getRedFlagById, createRedFlag, updateRedFlag, softDeleteRedFlag, restoreRedFlag } from "../db/queries/red-flags"

const router = new Hono()
const RedFlagSchema = z.object({
  flagName: z.string().min(1, "Flag name required").max(200),
  definition: z.string().max(500).optional().default(""),
  color: z.string().max(20).optional().default("#ef4444"),
})

router.get("/", (c) => {
  const search = c.req.query("search")
  const trashed = c.req.query("trashed") === "1"
  const flags = getRedFlags(search, trashed)
  return c.html(<RedFlagsPage flags={flags} search={search} />)
})

router.get("/new", (c) => {
  return c.html(<RedFlagsPage flags={getRedFlags()} editing={true} />)
})

router.post("/", async (c) => {
  const form = await c.req.parseBody()
  const parsed = RedFlagSchema.safeParse(form)
  if (!parsed.success) {
    return c.html(<RedFlagsPage flags={getRedFlags()} editing={true} errors={parsed.error.flatten().fieldErrors as any} formData={form as any} />)
  }
  createRedFlag(parsed.data)
  return c.redirect("/red-flags")
})

router.get("/:id/edit", (c) => {
  const item = getRedFlagById(parseInt(c.req.param("id")))
  if (!item) return c.redirect("/red-flags")
  const f = item as any
  return c.html(<RedFlagsPage flags={getRedFlags()} editing={true} editId={f.id} formData={{ flagName: f.flagName || f.flag_name || "", definition: f.definition || "", color: f.color || "#ef4444" }} />)
})

router.post("/:id", async (c) => {
  const id = parseInt(c.req.param("id"))
  const form = await c.req.parseBody()
  const parsed = RedFlagSchema.safeParse(form)
  if (!parsed.success) return c.redirect(`/red-flags/${id}/edit`)
  updateRedFlag(id, parsed.data)
  return c.redirect("/red-flags")
})

router.post("/:id/delete", (c) => { softDeleteRedFlag(parseInt(c.req.param("id"))); return c.redirect("/red-flags") })
router.post("/:id/restore", (c) => { restoreRedFlag(parseInt(c.req.param("id"))); return c.redirect("/red-flags?trashed=1") })

export { router as redFlagsRouter }
