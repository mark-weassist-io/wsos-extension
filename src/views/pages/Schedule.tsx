import type { FC } from "hono/jsx"
import { Layout, statusBadge } from "../layout"
import { classifyMilestone } from "../../db/queries/checkins"

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
  milestoneFlags: Record<string, Record<string, number>>
  milestoneGreen?: Record<string, Record<string, number>>
  filter?: string
}

const MILESTONES = [
  { key: "3mo", label: "3 Mo", col: "after3Mon" },
  { key: "4mo", label: "4 Mo", col: "after4Mon" },
  { key: "5mo", label: "5 Mo", col: "after5Mon" },
  { key: "6mo", label: "6 Mo", col: "after6Mon" },
  { key: "9mo", label: "9 Mo", col: "after9Mon" },
  { key: "1yr", label: "1 Yr", col: "after1Year" },
  { key: "1yr3mo", label: "15 Mo", col: "after1Year3Months" },
]

const milestoneBadge = (status: string): string => {
  switch (status) {
    case "done": return "badge badge-success"
    case "scheduled": return "badge badge-info"
    case "overdue": return "badge badge-danger"
    case "cancelled": return "badge badge-secondary"
    default: return "badge badge-secondary"
  }
}

export const SchedulePage: FC<Props> = ({ schedule, milestoneFlags, milestoneGreen, filter }) => {
  return (
    <Layout title="Check-in Schedule" activeNav="schedule">
      <script dangerouslySetInnerHTML={{ __html: `
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('[data-bs-toggle="popover"]').forEach(function(el) {
    new bootstrap.Popover(el, { html: true, sanitize: false, trigger: 'focus' })
  });
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('ms-option')) {
      var td = e.target.closest('[data-milestone-cell]');
      if (td) { var form = td.querySelector('form'); if (form) { form.querySelector('[name="status"]').value = e.target.dataset.status || ''; form.dispatchEvent(new Event('submit', { bubbles: true })); } }
    }
  });
});
` }} />
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
                {MILESTONES.map(m => <th key={m.key}>{m.label}</th>)}
                <th>CS</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map(s => {
                const flags = milestoneFlags[s.opName] || {}
                return (
                  <tr>
                    <td><strong style="white-space:nowrap">{s.opName || "—"}</strong></td>
                    <td>{s.clientName || "—"}</td>
                    <td class="text-sm">{s.clientSEmail || "—"}</td>
                    <td class="text-sm">{s.role || "—"}</td>
                    <td><span class={statusBadge(s.status)}>{s.status || "—"}</span></td>
                    <td class="text-sm">{s.startDate || "—"}</td>
                    {MILESTONES.map(m => {
                      const val = (s as any)[m.col]
                      const happened = flags[m.key] || 0
                      const wasGreen = milestoneGreen?.[s.opName]?.[m.key] ?? 0
                      const status = val ? classifyMilestone(val, happened === 1, wasGreen === 1) : "cancelled"
                      return (
                        <td key={m.key}
                          data-milestone={m.key}
                          data-happened={happened}
                          style="cursor:pointer;text-align:center"
                          onclick={`fetch('/schedule/toggle/${encodeURIComponent(s.opName)}/${m.key}',{method:'POST'}).then(r=>{if(r.ok){location.reload()}})`}>
                          {val ? <span class={milestoneBadge(status)}>{val}<br/><span style="font-size:0.65rem;opacity:0.7">{status}</span></span> : "—"}
                        </td>
                      )
                    })}
                    <td class="text-sm">{s.assignedCs || "—"}</td>
                  </tr>
                )
              })}
              {schedule.length === 0 && (
                <tr><td colspan="16" style="text-align:center;padding:40px;color:var(--text-secondary)">No schedule items found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
