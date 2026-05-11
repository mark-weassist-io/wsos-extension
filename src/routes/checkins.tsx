import { Hono } from "hono"
import { CheckinsPage } from "../views/pages/Checkins"
import { getNinetyDayCheckins } from "../db/queries/checkins"
import type { NinetyDayCheckinRow } from "../db/queries/checkins"

const router = new Hono()

router.get("/", (c) => {
  const search = c.req.query("search")
  const checkins: NinetyDayCheckinRow[] = getNinetyDayCheckins(search)
  return c.html(<CheckinsPage checkins={checkins} search={search} />)
})

export { router as checkinsRouter }
