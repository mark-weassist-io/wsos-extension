import type { FC } from "hono/jsx"
import type { OnboardingSummary, OnboardingStep } from "../../types"
import { Layout, statusBadge, toTitleCase } from "../layout"

interface DetailProps {
  opName: string
  steps: OnboardingStep[]
  recordId: number
  startDate?: string | null
  startTime?: string | null
  rate?: string | null
}

interface Props {
  summaries: OnboardingSummary[]
  detail?: DetailProps
  person?: string
}

export const StepRow: FC<{ step: OnboardingStep; recordId: number; index?: number }> = ({ step, recordId, index }) => {
  const sid = step.step_id ?? step.id
  const st = step.step_status ?? (step as any).status ?? "Not Done"
  return (
    <tr id={`step-${sid}`}>
      <td style="text-align:center;color:var(--text-secondary);font-size:0.75rem">{index ?? ""}</td>
      <td>{toTitleCase(step.step_name || step.name) || "—"}</td>
      <td>
        <button
          hx-post={`/onboarding/${recordId}/toggle/${sid}`}
          hx-target={`#step-${sid}`}
          hx-swap="outerHTML"
          class={`btn-status ${st.toLowerCase().replace(/\s+/g, "-")}`}
          style="cursor:pointer;border:none;padding:4px 12px;border-radius:12px;font-size:0.75rem;font-weight:500"
        >
          {st}
        </button>
      </td>
      <td class="text-sm">{step.owner || "—"}</td>
    </tr>
  )
}

const StepStatusBtn: FC<{ status: string | null }> = ({ status }) => {
  const s = status || "Not Done"
  return (
    <span class={statusBadge(s)} style="cursor:pointer">{s}</span>
  )
}

export const OnboardingPage: FC<Props> = ({ summaries, detail, person }) => {
  if (detail) {
    return (
      <Layout title={`Onboarding — ${detail.opName}`} activeNav="onboarding">
        <a href="/onboarding" style="color:var(--accent);text-decoration:none;font-size:0.875rem;display:inline-block;margin-bottom:16px">← Back to Onboarding</a>
        <h3 style="font-size:1rem;font-weight:600;margin-bottom:12px">{detail.opName} — Onboarding</h3>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;font-size:0.85rem">
          {detail.startDate ? <span><strong>Start Date:</strong> {detail.startDate}</span> : null}
          {detail.startTime ? <span><strong>Start Time:</strong> {detail.startTime}</span> : null}
          {detail.rate ? <span><strong>Rate:</strong> {detail.rate}</span> : null}
        </div>
        <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:12px">Click a status to toggle: Not Done → Done → NA → Not Done</p>
        <div class="card" style="padding:0">
          <div class="table-container">
            <table>
              <thead>
                <tr><th>#</th><th>Step</th><th>Status</th><th>Owner</th></tr>
              </thead>
              <tbody>
                {detail.steps.map((s, i) => (
                  <StepRow step={s} recordId={detail.recordId} index={i + 1} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Layout>
    )
  }

  const filtered = person
    ? summaries.filter(s => s.source_person?.toLowerCase() === person.toLowerCase())
    : summaries

  return (
    <Layout title="Onboarding" activeNav="onboarding">
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <a href="/onboarding" class={`badge ${!person ? "badge-info" : "badge-secondary"}`} style="text-decoration:none;cursor:pointer">All</a>
        <a href="/onboarding?person=Michelle" class={`badge ${person === "Michelle" ? "badge-info" : "badge-secondary"}`} style="text-decoration:none;cursor:pointer">Michelle</a>
        <a href="/onboarding?person=Dennis" class={`badge ${person === "Dennis" ? "badge-info" : "badge-secondary"}`} style="text-decoration:none;cursor:pointer">Dennis</a>
      </div>
      <div class="card" style="padding:0">
        <div class="table-container">
          <table>
            <thead>
              <tr><th>OP</th><th>Client</th><th>Owner</th><th>Steps</th><th>Completed</th><th>Progress</th><th>Last Stage</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const pct = s.step_count > 0 ? Math.round((s.completed_steps / s.step_count) * 100) : 0
                return (
                  <tr>
                    <td><a href={`/onboarding/${s.id}`} style="color:var(--accent);text-decoration:none;font-weight:500">{s.op_name}</a></td>
                    <td class="text-sm">{s.client_name || "—"}</td>
                    <td class="text-sm">{s.source_person || "—"}</td>
                    <td>{s.step_count}</td>
                    <td>{s.completed_steps}</td>
                    <td>
                      <div style="background:var(--bg);border-radius:4px;height:6px;width:100px;overflow:hidden">
                        <div style={`width:${pct}%;height:100%;background:${pct > 80 ? "var(--success)" : pct > 40 ? "var(--warning)" : "var(--accent)"};border-radius:4px;transition:width 0.3s`} />
                      </div>
                      <span class="text-sm text-secondary">{pct}%</span>
                    </td>
                    <td class="text-sm">{toTitleCase(s.last_stage) || "—"}</td>
                    <td><span class={statusBadge(s.overall_status)}>{toTitleCase(s.overall_status) || "In Progress"}</span></td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-secondary)">No onboarding records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
