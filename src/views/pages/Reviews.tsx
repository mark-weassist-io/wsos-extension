import type { FC } from "hono/jsx"
import { Layout } from "../layout"

interface ReviewRow { opName: string; csStaffName: string | null; periods: Record<string, { redFlag: string | null }> }

const PERIODS = [
  "First Check-In (End of Week 1)", "Weekly Review (Week 2 Update)", "Bi-Weekly Review (Week 3 Update)",
  "Monthly Review (1st Month Update)", "Mid-Probation Review (Week 6 Update)", "Monthly Review (2nd Month Update)",
  "Weekly Review (Week 10 Update)", "Final Review (3rd Month Update)",
]
const SHORT = { "First Check-In (End of Week 1)": "Wk 1", "Weekly Review (Week 2 Update)": "Wk 2", "Bi-Weekly Review (Week 3 Update)": "Wk 3", "Monthly Review (1st Month Update)": "Mo 1", "Mid-Probation Review (Week 6 Update)": "Wk 6", "Monthly Review (2nd Month Update)": "Mo 2", "Weekly Review (Week 10 Update)": "Wk 10", "Final Review (3rd Month Update)": "Final" }

export const ReviewsPage: FC<{ rows: ReviewRow[]; redFlags: { name: string; color: string }[] }> = ({ rows, redFlags }) => (
  <Layout title="90-Day Reviews" activeNav="reviews">
    <script dangerouslySetInnerHTML={{ __html: `
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('[data-bs-toggle="popover"]').forEach(el => new bootstrap.Popover(el, { html: true, sanitize: false, trigger: 'focus' }));
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('flag-dot')) {
      var td = e.target.closest('[data-flag-cell]');
      if (td) { var form = td.querySelector('form'); if (form) { form.querySelector('[name=\"redFlag\"]').value = e.target.dataset.flag || ''; form.dispatchEvent(new Event('submit', { bubbles: true })); } }
    }
  });
});
` }} />
    <div class="d-flex gap-3 flex-wrap mb-3 align-items-center">
      <span class="small text-secondary">{rows.length} OPs</span>
      <span class="fw-medium small">Legend:</span>
      <span class="d-flex align-items-center gap-1 small"><span style={{ display: "inline-block", width: "12px", height: "12px", borderRadius: "50%", background: "#22c55e" }}></span> None</span>
      {redFlags.map(f => (
        <span class="d-flex align-items-center gap-1 small"><span style={{ display: "inline-block", width: "12px", height: "12px", borderRadius: "50%", background: f.color }}></span> {f.name}</span>
      ))}
    </div>
    <div class="card">
      <div class="table-responsive">
        <table class="table table-hover table-sm mb-0">
          <thead><tr>
            <th>OP</th><th>CS</th>
            {PERIODS.map(p => <th style="white-space:nowrap;font-size:0.7rem">{SHORT[p]}</th>)}
          </tr></thead>
          <tbody>
            {rows.map(r => (
              <tr>
                <td class="fw-medium text-nowrap">{r.opName}</td>
                <td class="small">{r.csStaffName || "—"}</td>
                {PERIODS.map(p => {
                  const flag = r.periods[p]?.redFlag
                  const meta = flag ? redFlags.find(f => f.name === flag) : null
                  const color = meta?.color || "#22c55e"
                  return (
                    <td class="text-center" style="white-space:nowrap" data-flag-cell>
                      <form method="POST" action="/reviews/set" style="display:inline"
                        hx-post="/reviews/set" hx-trigger="submit" hx-swap="outerHTML" hx-target="closest td">
                        <input type="hidden" name="opName" value={r.opName} />
                        <input type="hidden" name="period" value={p} />
                        <input type="hidden" name="redFlag" value={flag || ""} />
                        <button type="button" class="btn btn-sm p-0 border-0 bg-transparent"
                          data-bs-toggle="popover" data-bs-placement="bottom"
                          data-bs-content={[
                            `<div style="display:flex;flex-direction:column;gap:4px;padding:4px">`,
                            `<span class="flag-dot" data-flag="" style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:2px 4px;border-radius:4px"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#22c55e"></span> None</span>`,
                            ...redFlags.map(f => `<span class="flag-dot" data-flag="${f.name}" style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:2px 4px;border-radius:4px"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${f.color}"></span> ${f.name}</span>`),
                            `</div>`,
                          ].join("")}>
                          <span style={{ display: "inline-block", width: "14px", height: "14px", borderRadius: "50%", background: color, border: "1px solid rgba(0,0,0,0.1)", cursor: "pointer" }}></span>
                        </button>
                      </form>
                    </td>
                  )
                })}
              </tr>
            ))}
            {rows.length === 0 && <tr><td colspan="10" class="text-center text-secondary py-5">No data</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  </Layout>
)
