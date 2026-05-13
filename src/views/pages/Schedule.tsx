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
  milestoneDates?: Record<string, Record<string, string>>
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

function toInputDate(mdy: string): string {
  const m = mdy.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return ""
  return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`
}

function fromInputDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return ""
  return `${+m[2]}/${+m[3]}/${m[1]}`
}

function fmtDate(d: string): string {
  const iso = d.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) return `${+iso[2]}/${+iso[3]}/${iso[1]}`
  return d
}

const milestoneBadge = (status: string): string => {
  switch (status) {
    case "done": return "badge badge-success"
    case "scheduled": return "badge badge-info"
    case "overdue": return "badge badge-danger"
    case "cancelled": return "badge badge-secondary"
    default: return "badge badge-secondary"
  }
}

const MS_SCRIPT = `
function msCls(s){return s==='done'?'badge badge-success':s==='scheduled'?'badge badge-info':s==='overdue'?'badge badge-danger':'badge badge-secondary'}
function msDate(iso){var m=iso.match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);return m?(+m[2])+'/'+(+m[3])+'/'+m[1]:''}
function msUpdate(p,status,date){
  var tog=p.querySelector('.ms-dd-toggle');
  if(!tog)return;
  tog.className=msCls(status)+' ms-dd-toggle';
  var cn=tog.childNodes;
  for(var i=0;i<cn.length;i++){if(cn[i].nodeType===3&&cn[i].textContent.trim()){cn[i].textContent=date;break}}
  var ss=tog.querySelector('span[style]');if(ss)ss.textContent=status;
  p.querySelector('[name="status"]').value=status;
  p.querySelector('.ms-dd').classList.remove('show');
}
function msPost(p,status){
  var raw=p.querySelector('.ms-dd-date').value;
  var date=msDate(raw);
  var op=p.querySelector('[name="opName"]').value;
  var mk=p.querySelector('[name="milestone"]').value;
  fetch('/schedule/set-status/'+encodeURIComponent(op)+'/'+encodeURIComponent(mk),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'status='+encodeURIComponent(status)+'&date='+encodeURIComponent(date)}).then(function(r){if(r.ok)msUpdate(p,status,date)});
}
document.addEventListener('click',function(e){
  var dd=e.target.closest('.ms-dd-toggle');
  if(dd){e.stopPropagation();var p=dd.closest('[data-milestone-cell]');if(p){p.querySelector('.ms-dd').classList.toggle('show')}return}
  var opt=e.target.closest('.ms-dd-opt');
  if(opt){e.stopPropagation();var p=opt.closest('[data-milestone-cell]');if(p)msPost(p,opt.dataset.status)}
  var sv=e.target.closest('.ms-dd-save');
  if(sv){e.stopPropagation();var p=sv.closest('[data-milestone-cell]');if(p){var a=p.querySelector('.ms-dd-opt.active');msPost(p,a?a.dataset.status:'scheduled')}}
  if(!e.target.closest('.ms-dd')&&!e.target.closest('.ms-dd-toggle')){document.querySelectorAll('.ms-dd.show').forEach(function(d){d.classList.remove('show')})}
});
`

const STYLE = `
.ms-dd { display:none; position:absolute; top:100%; left:50%; transform:translateX(-50%); z-index:100; min-width:220px; background:var(--card-bg); border:1px solid var(--border); border-radius:8px; padding:12px; box-shadow:0 8px 24px rgba(0,0,0,0.15); margin-top:4px }
.ms-dd.show { display:block }
.ms-dd-body { display:flex; flex-direction:column; gap:8px }
.ms-dd-date { width:100%; padding:6px 8px; border:1px solid var(--border); border-radius:6px; font-size:0.8rem; background:var(--body-bg); color:var(--text) }
.ms-dd-options { display:flex; flex-direction:column; gap:4px }
.ms-dd-opt { display:flex; align-items:center; gap:8px; padding:6px 8px; border:none; border-radius:6px; cursor:pointer; font-size:0.8rem; background:transparent; color:var(--text); text-align:left; width:100% }
.ms-dd-opt:hover { background:var(--accent-light) }
.ms-dd-opt.active { background:var(--accent-light); font-weight:600 }
.ms-dd-dot { display:inline-block; width:10px; height:10px; border-radius:50%; flex-shrink:0 }
.ms-dd-save { width:100%; padding:6px; border:none; border-radius:6px; cursor:pointer; font-size:0.8rem; background:var(--accent); color:#fff; font-weight:500 }
.ms-dd-save:hover { opacity:0.9 }
`

export const SchedulePage: FC<Props> = ({ schedule, milestoneFlags, milestoneGreen, milestoneDates, filter }) => {
  return (
    <Layout title="Check-in Schedule" activeNav="schedule">
      <style>{STYLE}</style>
      <script dangerouslySetInnerHTML={{ __html: MS_SCRIPT }} />
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
                const dates = milestoneDates?.[s.opName] || {}
                return (
                  <tr>
                    <td><strong style="white-space:nowrap">{s.opName || "—"}</strong></td>
                    <td>{s.clientName || "—"}</td>
                    <td class="text-sm">{s.clientSEmail || "—"}</td>
                    <td class="text-sm">{s.role || "—"}</td>
                    <td><span class={statusBadge(s.status)}>{s.status || "—"}</span></td>
                    <td class="text-sm">{s.startDate || "—"}</td>
                    {MILESTONES.map(m => {
                      const origVal = (s as any)[m.col]
                      const customVal = dates[m.key]
                      const val = customVal || origVal
                      const happened = flags[m.key] || 0
                      const wasGreen = milestoneGreen?.[s.opName]?.[m.key] ?? 0
                      const status = val ? classifyMilestone(val, happened === 1, wasGreen === 1) : "cancelled"
                      const displayDate = fmtDate(customVal || origVal || "")
                      return (
                        <td key={m.key} data-milestone-cell style="position:relative;text-align:center">
                          {origVal || customVal ? (
                            <>
                              <span class={`${milestoneBadge(status)} ms-dd-toggle`} style="cursor:pointer">
                                {displayDate}<br/><span style="font-size:0.65rem;opacity:0.7">{status}</span>
                              </span>
                              <div class="ms-dd">
                                <div class="ms-dd-body">
                                  <input type="hidden" name="opName" value={s.opName} />
                                  <input type="hidden" name="milestone" value={m.key} />
                                  <input type="hidden" name="status" value={status} />
                                  <input type="date" class="ms-dd-date" name="date" value={toInputDate(displayDate)} />
                                  <div class="ms-dd-options">
                                    <button type="button" class={`ms-dd-opt${status === "done" ? " active" : ""}`} data-status="done">
                                      <span class="ms-dd-dot" style="background:var(--success)"></span> Done
                                    </button>
                                    <button type="button" class={`ms-dd-opt${status === "scheduled" ? " active" : ""}`} data-status="scheduled">
                                      <span class="ms-dd-dot" style="background:#3b82f6"></span> Scheduled
                                    </button>
                                    <button type="button" class={`ms-dd-opt${status === "cancelled" ? " active" : ""}`} data-status="canceled">
                                      <span class="ms-dd-dot" style="background:#6b7280"></span> Canceled
                                    </button>
                                  </div>
                                  <button type="button" class="ms-dd-save">Save</button>
                                </div>
                              </div>
                            </>
                          ) : "—"}
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
