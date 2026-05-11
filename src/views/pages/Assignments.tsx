import type { FC } from "hono/jsx"
import { Layout, statusBadge, inputField, selectField } from "../layout"
import type { AssignmentRow } from "../../db/queries/assignments"

interface Props {
  assignments: AssignmentRow[]
  editing?: boolean
  editId?: number
  formData?: Record<string, string>
  errors?: Record<string, string>
  ops?: string[]
  clients?: string[]
  csStaff?: string[]
}

export const AssignmentsPage: FC<Props> = ({ assignments, editing, editId, formData, errors, ops, clients, csStaff }) => {
  const trashed = assignments.some(a => a.deleted_at)
  return (
    <Layout title={editing ? (editId ? "Edit Assignment" : "New Assignment") : "Assignments"} activeNav="assignments">
      {editing ? (
        <div style="max-width:600px">
          <a href="/assignments" style="color:var(--accent);text-decoration:none;font-size:0.875rem;display:inline-block;margin-bottom:16px">← Back</a>
          <h3 style="font-size:1rem;font-weight:600;margin-bottom:16px">{editId ? "Edit Assignment" : "New Assignment"}</h3>
          <form action={editId ? `/assignments/${editId}` : "/assignments"} method="POST" class="card" style="padding:20px">
            {selectField("OP*", "opName", formData?.opName || "", ops || [], errors?.opName)}
            {selectField("Client*", "clientName", formData?.clientName || "", clients || [], errors?.clientName)}
            {inputField("Role", "role", formData?.role || "", errors?.role)}
            {selectField("Status", "status", formData?.status || "Probation", ["Probation", "Active", "Inactive", "Separated", "Resigned"], errors?.status)}
            {selectField("Type", "type", formData?.type || "", ["", "Full-Time", "Part-Time", "6 Hours"], errors?.type)}
            {inputField("Start Date", "startDate", formData?.startDate || "", errors?.startDate, false, "date")}
            {inputField("End Date", "endDate", formData?.endDate || "", errors?.endDate, false, "date")}
            {inputField("Rate", "rate", formData?.rate || "", errors?.rate, false, "number")}
            {csStaff ? selectField("Assigned CS", "assignedCs", formData?.assignedCs || "", csStaff, errors?.assignedCs) : inputField("Assigned CS", "assignedCs", formData?.assignedCs || "", errors?.assignedCs)}
            <button type="submit" style="padding:8px 20px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius);cursor:pointer;font-weight:500">{editId ? "Update" : "Create"}</button>
          </form>
        </div>
      ) : (
        <>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
            <div style="display:flex;gap:8px;align-items:center">
              <a href="/assignments?trashed=1" class={`badge ${trashed ? "badge-info" : "badge-secondary"}`} style="text-decoration:none">Trashed</a>
              {trashed && <a href="/assignments" class="badge badge-secondary" style="text-decoration:none">Active</a>}
            </div>
            <div style="display:flex;gap:8px">
              <form action="/assignments" method="get"><input type="text" name="search" placeholder="Search..." /></form>
              <a href="/assignments/new" style="padding:8px 16px;background:var(--accent);color:#fff;border-radius:var(--radius);text-decoration:none;font-size:0.875rem">+ New Assignment</a>
            </div>
          </div>
          <div class="card" style="padding:0;overflow-x:auto">
            <table style="font-size:0.8rem">
              <thead><tr><th>OP</th><th>Client</th><th>Role</th><th>Status</th><th>Type</th><th>Rate</th><th>CS</th><th>Actions</th></tr></thead>
              <tbody>
                {assignments.map(a => (
                  <tr style={a.deleted_at ? "opacity:0.5" : ""}>
                    <td><strong>{a.op_name}</strong>{a.deleted_at && <span class="badge badge-danger" style="margin-left:6px">Deleted</span>}</td>
                    <td>{a.client_name}</td>
                    <td class="text-sm">{a.role || "—"}</td>
                    <td><span class={statusBadge(a.status)}>{a.status || "—"}</span></td>
                    <td class="text-sm">{a.type || "—"}</td>
                    <td class="text-sm">{a.rate ? `$${a.rate}` : "—"}</td>
                    <td class="text-sm">{a.assigned_cs || "—"}</td>
                    <td>
                      {a.deleted_at
                        ? <form action={`/assignments/${a.id}/restore`} method="POST" style="display:inline"><button class="badge badge-success" style="cursor:pointer;border:none">Restore</button></form>
                        : <div style="display:flex;gap:4px">
                            <a href={`/assignments/${a.id}/edit`} class="badge badge-info" style="text-decoration:none">Edit</a>
                            <form action={`/assignments/${a.id}/delete`} method="POST" style="display:inline"><button class="badge badge-danger" style="cursor:pointer;border:none">Delete</button></form>
                          </div>
                      }
                    </td>
                  </tr>
                ))}
                {assignments.length === 0 && <tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-secondary)">No assignments found</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Layout>
  )
}
