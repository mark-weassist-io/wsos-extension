import { Hono } from "hono"
import { ReviewsPage } from "../views/pages/Reviews"
import { getReviews, setReview, getRedFlagNames } from "../db/queries/reviews"

const router = new Hono()

router.get("/", (c) => {
  const reviews = getReviews()
  const flags = getRedFlagNames()
  return c.html(<ReviewsPage rows={reviews} redFlags={flags} />)
})

router.post("/set", async (c) => {
  const form = await c.req.parseBody()
  const opName = (form.opName as string) || ""
  const period = (form.period as string) || ""
  const redFlag = (form.redFlag as string) || null
  if (!opName || !period) return c.text("Missing params", 400)
  setReview(opName, period, redFlag || null)
  const allFlags = getRedFlagNames()
  const meta = redFlag ? allFlags.find(f => f.name === redFlag) : null
  const color = meta?.color || "#22c55e"
  return c.html(
    <td class="text-center" style="white-space:nowrap" data-flag-cell>
      <form method="POST" action="/reviews/set" style="display:inline"
        hx-post="/reviews/set" hx-trigger="submit" hx-swap="outerHTML" hx-target="closest td">
        <input type="hidden" name="opName" value={opName} />
        <input type="hidden" name="period" value={period} />
        <input type="hidden" name="redFlag" value={redFlag || ""} />
        <button type="button" class="btn btn-sm p-0 border-0 bg-transparent"
          data-bs-toggle="popover" data-bs-placement="bottom"
          data-bs-content={[
            `<div style="display:flex;flex-direction:column;gap:4px;padding:4px">`,
            `<span class="flag-dot" data-flag="" style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:2px 4px;border-radius:4px"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#22c55e"></span> None</span>`,
            ...allFlags.map(f => `<span class="flag-dot" data-flag="${f.name}" style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:2px 4px;border-radius:4px"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${f.color}"></span> ${f.name}</span>`),
            `</div>`,
          ].join("")}>
          <span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${color};border:1px solid rgba(0,0,0,0.1);cursor:pointer"></span>
        </button>
      </form>
    </td>
  )
})

export { router as reviewsRouter }
