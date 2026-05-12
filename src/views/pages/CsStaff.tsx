import type { FC } from "hono/jsx"
import { Layout, inputField } from "../layout"
import type { CsStaffRow } from "../../db/queries/cs-staff"

interface Props {
  staff: CsStaffRow[]
  editId?: number
  formData?: Record<string, string>
}

export const CsStaffPage: FC<Props> = ({ staff, editId, formData }) => {
  const editing = editId !== undefined
  const showTrashed = staff.length > 0 && staff[0]?.deleted_at ? true : false
  return (
    <Layout title="CS Staff" activeNav="cs-staff">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <span class="text-secondary">{staff.filter(s => !s.deleted_at).length} active staff</span>
        <div style="display:flex;gap:8px">
          <a href="/cs-staff?trashed=1" class={`badge ${showTrashed ? "badge-info" : "badge-secondary"}`} style="text-decoration:none">Trashed</a>
          <a href="/cs-staff" class={`badge ${!showTrashed ? "badge-info" : "badge-secondary"}`} style="text-decoration:none">Active</a>
        </div>
      </div>

      {editing && (
        <div class="card mb-4" style="max-width:500px">
          <h3 style="font-size:0.9rem;font-weight:600;margin-bottom:12px">{editId ? "Edit Staff" : "Add Staff"}</h3>
          <form action={editId ? `/cs-staff/${editId}` : "/cs-staff"} method="POST">
            {inputField("Name", "name", formData?.name || "", undefined, true)}
            {inputField("Full Name", "fullName", formData?.fullName || "")}
            <button type="submit" style="padding:8px 20px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius);cursor:pointer;font-weight:500">Save</button>
          </form>
        </div>
      )}

      <div class="card" style="padding:0">
        <table>
          <thead>
            <tr><th>Name</th><th>Full Name</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {staff.map(s => (
              <tr style={s.deleted_at ? "opacity:0.5" : ""}>
                <td><strong>{s.name}</strong>{s.deleted_at && <span class="badge badge-danger" style="margin-left:6px">Deleted</span>}</td>
                <td class="text-sm text-secondary">{s.full_name || "—"}</td>
                <td>
                  {s.deleted_at ? (
                    <form action={`/cs-staff/${s.id}/restore`} method="POST" style="display:inline"><button class="badge badge-success" style="cursor:pointer;border:none">Restore</button></form>
                  ) : (
                    <div style="display:flex;gap:4px">
                      <a href={`/cs-staff/${s.id}/edit`} class="badge badge-info" style="text-decoration:none">Edit</a>
                      <form action={`/cs-staff/${s.id}/delete`} method="POST" style="display:inline"><button class="badge badge-danger" style="cursor:pointer;border:none">Delete</button></form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!editing && staff.length === 0 && <tr><td colspan="3" style="text-align:center;padding:40px;color:var(--text-secondary)">No staff found</td></tr>}
          </tbody>
        </table>
      </div>
      {!editing && <a href="/cs-staff/0/edit" style="display:inline-block;margin-top:12px;padding:8px 16px;background:var(--accent);color:#fff;border-radius:var(--radius);text-decoration:none;font-size:0.875rem">+ Add Staff</a>}
    </Layout>
  )
}
