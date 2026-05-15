import type { FC } from "hono/jsx"
import { Layout, statusBadge, inputField, selectField } from "../layout"
import type { NinetyDayCheckinRow as CheckinRow } from "../../db/queries/checkins"

interface Props {
  checkins: CheckinRow[]
  search?: string
  showTrashed?: boolean
  editing?: boolean
  editId?: number
  errors?: Record<string, string>
  formData?: Record<string, string>
  ops?: string[]
  csStaff?: string[]
  statuses?: string[]
}

export const CheckinsPage: FC<Props> = ({ checkins, search, showTrashed, editing, editId, errors, formData, ops, csStaff, statuses }) => {
  const title = editing ? (editId ? "Edit Check-in" : "New Check-in") : "90-Day Check-ins"

  return (
    <Layout title={title} activeNav="checkins">
      {editing ? (
        <div style="max-width:600px">
          <a href="/checkins" style="color:var(--accent);text-decoration:none;font-size:0.875rem;display:inline-block;margin-bottom:16px">← Back</a>
          <h3 style="font-size:1rem;font-weight:600;margin-bottom:16px">{editId ? "Edit Check-in" : "New Check-in"}</h3>
          <form action={editId ? `/checkins/${editId}` : "/checkins"} method="POST" class="card" style="padding:20px">
            {selectField("OP", "opName", formData?.opName || "", ops || [], errors?.opName)}
            {selectField("Status", "status", formData?.status || "", statuses || [], errors?.status)}
            {selectField("Assigned CS", "assignedCs", formData?.assignedCs || "", csStaff || [], errors?.assignedCs)}
            {inputField("Notes", "notes", formData?.notes || "", errors?.notes, false, "textarea")}
            <div style="display:flex;gap:8px;margin-top:16px">
              <button type="submit" class="btn btn-primary btn-sm">{editId ? "Update" : "Create"}</button>
              <a href="/checkins" class="btn btn-outline-secondary btn-sm">Cancel</a>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
            <div style="display:flex;align-items:center;gap:12px">
              <span class="text-secondary">{checkins.length} check-in records</span>
              <a href="/checkins" class={`badge ${!showTrashed ? "badge-info" : "badge-secondary"}`} style="text-decoration:none">Active</a>
              <a href="/checkins?trashed=1" class={`badge ${showTrashed ? "badge-info" : "badge-secondary"}`} style="text-decoration:none">Trashed</a>
            </div>
            <div style="display:flex;gap:8px">
              <form action="/checkins" method="get" class="search-bar" style="margin-bottom:0">
                <input type="text" name="search" placeholder="Search..." value={search || ""} />
                <button type="submit" class="btn btn-primary btn-sm">Search</button>
              </form>
              <a href="/checkins/new" class="btn btn-primary btn-sm" style="text-decoration:none;display:inline-flex;align-items:center">+ New Check-in</a>
            </div>
          </div>
          <div class="card" style="padding:0">
            <div class="table-container">
              <table>
                <thead>
                  <tr><th>OP</th><th>Client</th><th>Status</th><th>CS</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {checkins.map(c => (
                    <tr style={c.deletedAt ? "opacity:0.5" : ""}>
                      <td><strong>{c.opName || "—"}</strong>{c.deletedAt && <span class="badge badge-danger" style="margin-left:6px">Deleted</span>}</td>
                      <td>{c.clientName || "—"}</td>
                      <td><span class={statusBadge(c.status)}>{c.status || "—"}</span></td>
                      <td class="text-sm">{c.assignedCs || "—"}</td>
                      <td>
                        {c.deletedAt ? (
                          <form action={`/checkins/${c.id}/restore`} method="POST" style="display:inline">
                            <button type="submit" class="badge badge-success" style="cursor:pointer;border:none;font-size:0.75rem">Restore</button>
                          </form>
                        ) : (
                          <div style="display:flex;gap:4px">
                            <a href={`/checkins/${c.id}/edit`} class="badge badge-info" style="text-decoration:none">Edit</a>
                            <form action={`/checkins/${c.id}/delete`} method="POST" style="display:inline" onsubmit="return confirm('Soft delete this check-in?')">
                              <button type="submit" class="badge badge-danger" style="cursor:pointer;border:none;font-size:0.75rem">Delete</button>
                            </form>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {checkins.length === 0 && (
                    <tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-secondary)">No check-in records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <p class="text-secondary" style="margin-top:8px;font-size:0.8rem">
            Shows 90-day milestone check-in results recorded during onboarding and post-onboarding follow-ups.
            For scheduled future check-ins, see <a href="/schedule" style="color:var(--accent)">Check-in Schedule</a>.
          </p>
        </>
      )}
    </Layout>
  )
}
