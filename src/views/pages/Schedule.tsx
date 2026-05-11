import type { FC } from "hono/jsx"
import { Layout, statusBadge } from "../layout"

interface ScheduleRow {
  opName: string
  clientName: string | null
  clientSEmail: string | null
  role: string | null
  status: string | null
  startDate: string | null
  after3Mon: string | null
  after4Mon: string | null
  after5Mon: string | null
  after6Mon: string | null
  after9Mon: string | null
  after1Year: string | null
  after1Year3Months: string | null
  assignedCs: string | null
}

interface Props {
  schedule: ScheduleRow[]
  filter?: string
}

export const SchedulePage: FC<Props> = ({ schedule, filter }) => {
  return (
    <Layout title="Check-in Schedule" activeNav="schedule">
      <div style="display:flex;gap:8px;margin-bottom:16px;align-items:center">
        <a href="/schedule" class={`badge ${!filter ? "badge-info" : "badge-secondary"}`} style="text-decoration:none;cursor:pointer">All</a>
        <a href="/schedule?filter=upcoming" class={`badge ${filter === "upcoming" ? "badge-info" : "badge-secondary"}`} style="text-decoration:none;cursor:pointer">Upcoming</a>
        <a href="/schedule?filter=overdue" class={`badge ${filter === "overdue" ? "badge-info" : "badge-secondary"}`} style="text-decoration:none;cursor:pointer" hx-boost="false">Overdue</a>
        <span class="text-sm text-secondary" style="margin-left:auto">{schedule.length} items</span>
      </div>
      <div class="card" style="padding:0;overflow-x:auto">
        <div class="table-container">
          <table style="font-size:0.8rem">
            <thead>
              <tr>
                <th>OP</th><th>Client</th><th>Email</th><th>Role</th>
                <th>Status</th><th>Start</th>
                <th>3 Mo</th><th>4 Mo</th><th>5 Mo</th><th>6 Mo</th>
                <th>9 Mo</th><th>1 Yr</th><th>15 Mo</th>
                <th>CS</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map(s => (
                <tr>
                  <td><strong style="white-space:nowrap">{s.opName || "—"}</strong></td>
                  <td>{s.clientName || "—"}</td>
                  <td class="text-sm">{s.clientSEmail || "—"}</td>
                  <td class="text-sm">{s.role || "—"}</td>
                  <td><span class={statusBadge(s.status)}>{s.status || "—"}</span></td>
                  <td class="text-sm">{s.startDate || "—"}</td>
                  <td class="text-sm">{s.after3Mon || "—"}</td>
                  <td class="text-sm">{s.after4Mon || "—"}</td>
                  <td class="text-sm">{s.after5Mon || "—"}</td>
                  <td class="text-sm">{s.after6Mon || "—"}</td>
                  <td class="text-sm">{s.after9Mon || "—"}</td>
                  <td class="text-sm">{s.after1Year || "—"}</td>
                  <td class="text-sm">{s.after1Year3Months || "—"}</td>
                  <td class="text-sm">{s.assignedCs || "—"}</td>
                </tr>
              ))}
              {schedule.length === 0 && (
                <tr><td colspan="14" style="text-align:center;padding:40px;color:var(--text-secondary)">No schedule items found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
