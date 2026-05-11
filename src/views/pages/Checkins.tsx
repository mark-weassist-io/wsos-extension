import type { FC } from "hono/jsx"
import { Layout, statusBadge } from "../layout"
import type { NinetyDayCheckinRow as CheckinRow } from "../../db/queries/checkins"

interface Props {
  checkins: CheckinRow[]
  search?: string
}

export const CheckinsPage: FC<Props> = ({ checkins, search }) => {
  return (
    <Layout title="90-Day Check-ins" activeNav="checkins">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <p class="text-secondary">{checkins.length} check-in records</p>
        <form action="/checkins" method="get" class="search-bar" style="margin-bottom:0">
          <input type="text" name="search" placeholder="Search..." value={search || ""} />
          <button type="submit">Search</button>
        </form>
      </div>
      <div class="card" style="padding:0">
        <div class="table-container">
          <table>
            <thead>
              <tr><th>OP</th><th>Client</th><th>Type</th><th>Date</th><th>Status</th><th>CS</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {checkins.map(c => (
                <tr>
                  <td><strong>{c.opName || "—"}</strong></td>
                  <td>{c.clientName || "—"}</td>
                  <td class="text-sm">{c.checkinType || "—"}</td>
                  <td class="text-sm">{c.checkinDate || "—"}</td>
                  <td><span class={statusBadge(c.status)}>{c.status || "—"}</span></td>
                  <td class="text-sm">{c.assignedCs || "—"}</td>
                  <td class="text-sm text-secondary">{c.notes || "—"}</td>
                </tr>
              ))}
              {checkins.length === 0 && (
                <tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-secondary)">No check-in records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p class="text-secondary" style="margin-top:8px;font-size:0.8rem">
        Shows 90-day milestone check-in results recorded during onboarding and post-onboarding follow-ups.
        For scheduled future check-ins, see <a href="/schedule" style="color:var(--accent)">Check-in Schedule</a>.
      </p>
    </Layout>
  )
}
