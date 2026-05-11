import type { FC } from "hono/jsx"
import { Layout, statusBadge } from "../layout"
import type {
  DashboardMetrics, PipelineStage, AttentionItem, CsWorkload, RecentActivity
} from "../../db/queries/dashboard"

interface Props {
  metrics: DashboardMetrics
  pipeline: PipelineStage[]
  attention: { michelle: AttentionItem[]; bel: AttentionItem[] }
  workload: CsWorkload[]
  activity: RecentActivity[]
  statusDist: { status: string; count: number }[]
}

const stageColor = (stage: string): string => {
  if (stage.includes("Onboarding")) return "var(--accent)"
  if (stage.includes("Probation")) return "var(--warning)"
  if (stage === "Active") return "var(--success)"
  if (stage.includes("Overdue")) return "var(--danger)"
  if (stage.includes("Separated")) return "var(--text-secondary)"
  return "var(--text)"
}

export const DashboardPage: FC<Props> = ({ metrics, pipeline, attention, workload, activity, statusDist }) => {
  return (
    <Layout title="Dashboard" activeNav="dashboard">
      {/* === TOP STATS ROW === */}
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{metrics.total_ops}</div>
          <div class="stat-label">Total OPs</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--success)">{metrics.active_ops}</div>
          <div class="stat-label">Active OPs</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--accent)">{metrics.onboarding_in_progress}</div>
          <div class="stat-label">In Onboarding</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{metrics.post_onboarding_active}</div>
          <div class="stat-label">Post-Onboarding</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--warning)">{metrics.pending_handoff_calls}</div>
          <div class="stat-label">Pending HO Calls</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--danger)">{metrics.overdue_checkins}</div>
          <div class="stat-label">Overdue Check-ins</div>
        </div>
      </div>

      {/* === PIPELINE === */}
      <div class="card mb-4">
        <h3 style="font-size:1rem;font-weight:600;margin-bottom:12px">Pipeline</h3>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          {pipeline.map(p => {
            const max = Math.max(...pipeline.map(x => x.count), 1)
            const pct = (p.count / max) * 100
            return (
              <div style="flex:1;min-width:120px">
                <div style="font-size:1.5rem;font-weight:700;color:stageColor(p.stage)">{p.count}</div>
                <div style="font-size:0.8rem;font-weight:500;margin-bottom:4px">{p.stage}</div>
                <div style="height:6px;background:var(--bg);border-radius:3px;overflow:hidden">
                  <div style={`width:${pct}%;height:100%;background:${stageColor(p.stage)};border-radius:3px;transition:width 0.3s`} />
                </div>
                <div style="font-size:0.7rem;color:var(--text-secondary);margin-top:2px">{p.detail}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* === ATTENTION REQUIRED + CS WORKLOAD === */}
      <div class="grid-2 mb-4">
        {/* Michelle's attention */}
        <div class="card" style="padding:16px">
          <h3 style="font-size:0.9rem;font-weight:600;margin-bottom:8px;color:var(--accent)">Michelle — Needs Attention</h3>
          {attention.michelle.length === 0 ? (
            <div style="font-size:0.8rem;color:var(--text-secondary);padding:8px 0">All caught up!</div>
          ) : (
            <div style="display:flex;flex-direction:column;gap:6px">
              {attention.michelle.map(a => (
                <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;background:var(--bg);border-radius:6px;font-size:0.8rem">
                  <div>
                    <span style="font-weight:500">{a.op_name}</span>
                    {a.client_name && <span style="color:var(--text-secondary)"> — {a.client_name}</span>}
                  </div>
                  <span class="badge badge-warning">{a.task}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bel's attention */}
        <div class="card" style="padding:16px">
          <h3 style="font-size:0.9rem;font-weight:600;margin-bottom:8px;color:var(--success)">Bel — Needs Attention</h3>
          {attention.bel.length === 0 ? (
            <div style="font-size:0.8rem;color:var(--text-secondary);padding:8px 0">All caught up!</div>
          ) : (
            <div style="display:flex;flex-direction:column;gap:6px">
              {attention.bel.map(a => (
                <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;background:var(--bg);border-radius:6px;font-size:0.8rem">
                  <div>
                    <span style="font-weight:500">{a.op_name}</span>
                    {a.client_name && <span style="color:var(--text-secondary)"> — {a.client_name}</span>}
                  </div>
                  <span class="badge badge-danger">{a.task}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* === BOTTOM ROW: Status + CS Workload + Recent === */}
      <div class="grid-2 mb-4">
        <div class="card" style="padding:16px">
          <h3 style="font-size:0.9rem;font-weight:600;margin-bottom:8px">Status Distribution</h3>
          <table>
            <thead>
              <tr><th>Status</th><th>Count</th></tr>
            </thead>
            <tbody>
              {statusDist.map(s => (
                <tr>
                  <td><span class={statusBadge(s.status)}>{s.status}</span></td>
                  <td><strong>{s.count}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div class="card" style="padding:16px">
          <h3 style="font-size:0.9rem;font-weight:600;margin-bottom:8px">CS Workload</h3>
          <table>
            <thead>
              <tr><th>CS Staff</th><th>Active OPs</th></tr>
            </thead>
            <tbody>
              {workload.map(cs => {
                const maxWl = Math.max(...workload.map(w => w.active_ops), 1)
                const pct = (cs.active_ops / maxWl) * 100
                return (
                  <tr>
                    <td>{cs.cs_name}</td>
                    <td>
                      <div style="display:flex;align-items:center;gap:8px">
                        <strong>{cs.active_ops}</strong>
                        <div style="flex:1;height:6px;background:var(--bg);border-radius:3px;overflow:hidden;max-width:120px">
                          <div style={`width:${pct}%;height:100%;background:var(--accent);border-radius:3px`} />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div class="card" style="padding:16px">
        <h3 style="font-size:0.9rem;font-weight:600;margin-bottom:8px">Recent Onboarding Activity</h3>
        <div class="table-container">
          <table>
            <thead>
              <tr><th>OP</th><th>Client</th><th>Person</th><th>Last Stage</th><th>Status</th></tr>
            </thead>
            <tbody>
              {activity.map(a => (
                <tr>
                  <td><strong>{a.op_name}</strong></td>
                  <td>{a.client_name || "—"}</td>
                  <td>{a.source_person || "—"}</td>
                  <td>{a.last_stage || "—"}</td>
                  <td><span class="badge badge-secondary">In Progress</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
