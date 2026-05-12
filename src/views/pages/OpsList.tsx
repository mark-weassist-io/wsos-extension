import type { FC } from "hono/jsx"
import { Layout, statusBadge, inputField, selectField } from "../layout"
import type { OpWithAssignment } from "../../db/queries/ops"

interface Props {
  ops: OpWithAssignment[]
  search?: string
  total: number
  showTrashed?: boolean
  editing?: boolean
  editId?: number
  errors?: Record<string, string>
  formData?: Record<string, string>
}

export const OpsListPage: FC<Props> = ({ ops, search, total, showTrashed, editing, editId, errors, formData }) => {
  const title = editing ? (editId ? "Edit OP" : "New OP") : "OP Directory"

  return (
    <Layout title={title} activeNav="ops">
      {editing ? (
        <div style="max-width:600px">
          <a href="/ops" style="color:var(--accent);text-decoration:none;font-size:0.875rem;display:inline-block;margin-bottom:16px">← Back to OPs</a>
          <h3 style="font-size:1rem;font-weight:600;margin-bottom:16px">{editId ? "Edit OP" : "New OP"}</h3>
          <form action={editId ? `/ops/${editId}` : "/ops"} method="POST" class="card" style="padding:20px">
            {inputField("Full Name", "fullName", formData?.fullName || "", errors?.fullName, true)}
            {inputField("First Name", "firstName", formData?.firstName || "", errors?.firstName)}
            {inputField("Last Name", "lastName", formData?.lastName || "", errors?.lastName)}
            {inputField("Email", "email", formData?.email || "", errors?.email, false, "email")}
            {inputField("Phone", "phone", formData?.phone || "", errors?.phone, false, "tel")}
            {inputField("Nickname", "nickname", formData?.nickname || "", errors?.nickname)}
            {selectField("Gender", "gender", formData?.gender || "", ["", "Male", "Female", "Other"], errors?.gender)}
            <div style="display:flex;gap:8px;margin-top:16px">
              <button type="submit" class="btn btn-primary btn-sm">{editId ? "Update" : "Create"}</button>
              <a href="/ops" class="btn btn-outline-secondary btn-sm">Cancel</a>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
            <div style="display:flex;align-items:center;gap:12px">
              <span class="text-secondary">{total} OPs</span>
              <a href="/ops" class={`badge ${!showTrashed ? "badge-info" : "badge-secondary"}`} style="text-decoration:none">Active</a>
              <a href="/ops?trashed=1" class={`badge ${showTrashed ? "badge-info" : "badge-secondary"}`} style="text-decoration:none">Trashed</a>
            </div>
            <div style="display:flex;gap:8px">
              <form action="/ops" method="get" class="search-bar" style="margin-bottom:0">
                <input type="text" name="search" placeholder="Search OPs..." value={search || ""} />
                <button type="submit" class="btn btn-primary btn-sm">Search</button>
              </form>
              <a href="/ops/new" class="btn btn-primary btn-sm" style="text-decoration:none;display:inline-flex;align-items:center">+ New OP</a>
            </div>
          </div>

          <div class="card" style="padding:0">
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th><th>Email</th><th>Client</th><th>Role</th><th>Status</th><th>Check-in</th><th>Assigned CS</th><th>Phone</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ops.map(op => (
                    <tr style={op.deleted_at ? "opacity:0.5" : ""}>
                      <td><strong>{op.full_name}</strong>{op.deleted_at && <span class="badge badge-danger" style="margin-left:6px">Deleted</span>}</td>
                      <td class="text-sm text-secondary">{op.email || "—"}</td>
                      <td>{op.client_name || "—"}</td>
                      <td class="text-sm">{op.role || "—"}</td>
                      <td><span class={statusBadge(op.status)}>{op.status || "—"}</span></td>
                      <td class="text-sm">{op.checkin_status || "—"}</td>
                      <td class="text-sm">{op.assigned_cs || "—"}</td>
                      <td class="text-sm text-secondary">{(op as any).phones?.length ? (op as any).phones.join(", ") : op.phone || "—"}</td>
                      <td>
                        {op.deleted_at ? (
                          <form action={`/ops/${op.id}/restore`} method="POST" style="display:inline">
                            <button type="submit" class="badge badge-success" style="cursor:pointer;border:none;font-size:0.75rem">Restore</button>
                          </form>
                        ) : (
                          <div style="display:flex;gap:4px">
                            <a href={`/ops/${op.id}/edit`} class="badge badge-info" style="text-decoration:none">Edit</a>
                            <form action={`/ops/${op.id}/delete`} method="POST" style="display:inline" onsubmit="return confirm('Soft delete this OP?')">
                              <button type="submit" class="badge badge-danger" style="cursor:pointer;border:none;font-size:0.75rem">Delete</button>
                            </form>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {ops.length === 0 && (
                    <tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-secondary)">No OPs found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}
