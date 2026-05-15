import type { FC } from "hono/jsx"
import { Layout, selectField } from "../layout"
import type { StaffUser } from "../../db/queries/auth"

interface Props {
  staff: StaffUser[]
  showAdd?: boolean
  currentUserId?: number
  userRole?: string
}

const ROLES = ["staff", "admin"]

export const CsStaffPage: FC<Props> = ({ staff, showAdd, currentUserId, userRole }) => {
  const active = staff.filter(s => !s.deleted_at)
  const trashed = staff.filter(s => s.deleted_at)
  return (
    <Layout title="Users" activeNav="cs-staff">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
        <span class="text-secondary">{active.length} users</span>
        <div style="display:flex;gap:8px">
          <a href="/cs-staff" class={`badge ${!trashed.length ? "badge-info" : "badge-secondary"}`} style="text-decoration:none">Active ({active.length})</a>
          <a href="/cs-staff?trashed=1" class={`badge ${trashed.length ? "badge-info" : "badge-secondary"}`} style="text-decoration:none">Trashed ({trashed.length})</a>
        </div>
      </div>

      {userRole === "admin" && showAdd && (
        <div class="card form-section" style="margin-bottom:20px">
          <h3 style="font-size:0.9rem;font-weight:600;margin-bottom:16px">Add User</h3>
          <form action="/cs-staff" method="POST">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label" for="displayName">Name <span class="required">*</span></label>
                <input type="text" id="displayName" name="displayName" required class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label" for="email">Email <span class="required">*</span></label>
                <input type="email" id="email" name="email" required class="form-control" />
              </div>
              <div class="col-12">
                <label class="form-label" for="department">Department</label>
                <select id="department" name="department" class="form-select">
                  <option value="customer_success">Customer Success</option>
                  <option value="sales">Sales</option>
                  <option value="development">Development</option>
                  <option value="operations">Operations</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div class="col-md-6">
                {selectField("Role", "role", "staff", ROLES)}
              </div>
              <div class="col-12 d-flex gap-2">
                <button type="submit" class="btn btn-primary">Create User</button>
                <a href="/cs-staff" class="btn btn-outline-secondary">Cancel</a>
              </div>
            </div>
          </form>
        </div>
      )}

      <div class="card" style="padding:0">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Department</th><th>Role</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {staff.map(s => (
              <tr style={s.deleted_at ? "opacity:0.5" : ""}>
                <td><strong>{s.display_name}</strong>{s.deleted_at && <span class="badge badge-danger" style="margin-left:6px">Deleted</span>}</td>
                <td class="text-sm">{s.email || "—"}</td>
                <td><span class="badge badge-info">{s.department || "—"}</span></td>
                <td><span class="badge badge-secondary">{s.role}</span></td>
                <td>
                  {currentUserId === s.id ? (
                    <a href="/settings" class="badge badge-info" style="text-decoration:none">Edit</a>
                  ) : userRole === "admin" ? (
                    s.deleted_at ? (
                      <form action={`/cs-staff/${s.id}/restore`} method="POST" style="display:inline">
                        <button class="badge badge-success" style="cursor:pointer;border:none;font-size:0.75rem">Restore</button>
                      </form>
                    ) : (
                      <form action={`/cs-staff/${s.id}/delete`} method="POST" style="display:inline" onsubmit="return confirm('Soft delete this user?')">
                        <button class="badge badge-danger" style="cursor:pointer;border:none;font-size:0.75rem">Delete</button>
                      </form>
                    )
                  ) : (
                    <span class="text-sm text-secondary">—</span>
                  )}
                </td>
              </tr>
            ))}
            {staff.length === 0 && <tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-secondary)">No users found</td></tr>}
          </tbody>
        </table>
      </div>

      {userRole === "admin" && !showAdd && (
        <a href="/cs-staff/new" class="btn btn-primary btn-sm" style="margin-top:12px;text-decoration:none">+ Add User</a>
      )}
    </Layout>
  )
}
