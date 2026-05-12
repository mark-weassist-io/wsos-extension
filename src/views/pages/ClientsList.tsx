import type { FC } from "hono/jsx"
import { Layout, inputField } from "../layout"
import type { ClientRow } from "../../db/queries/clients"

interface Props {
  clients: ClientRow[]
  editing?: boolean
  editId?: number
  errors?: Record<string, string>
  formData?: Record<string, string>
  search?: string
}

export const ClientsPage: FC<Props> = ({ clients, editing, editId, errors, formData, search }) => {
  const trashed = clients.some(c => c.deleted_at)
  return (
    <Layout title={editing ? (editId ? "Edit Client" : "New Client") : "Clients"} activeNav="clients">
      {editing ? (
        <div style="max-width:600px">
          <a href="/clients" style="color:var(--accent);text-decoration:none;font-size:0.875rem;display:inline-block;margin-bottom:16px">← Back</a>
          <h3 style="font-size:1rem;font-weight:600;margin-bottom:16px">{editId ? "Edit Client" : "New Client"}</h3>
          <form action={editId ? `/clients/${editId}` : "/clients"} method="POST" class="card" style="padding:20px">
            {inputField("Name*", "name", formData?.name || "", errors?.name, true)}
            {inputField("Email", "email", formData?.email || "", errors?.email, false, "email")}
            <button type="submit" style="padding:8px 20px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius);cursor:pointer;font-weight:500">{editId ? "Update" : "Create"}</button>
          </form>
        </div>
      ) : (
        <>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
            <div style="display:flex;gap:8px;align-items:center">
              <a href="/clients" class={`badge ${!trashed ? "badge-info" : "badge-secondary"}`} style="text-decoration:none">Active</a>
              <a href="/clients?trashed=1" class={`badge ${trashed ? "badge-info" : "badge-secondary"}`} style="text-decoration:none">Trashed</a>
            </div>
            <div style="display:flex;gap:8px">
              <form action="/clients" method="get" class="search-bar" style="margin-bottom:0"><input type="text" name="search" placeholder="Search..." value={search || ""} />
              <button type="submit" class="btn btn-primary btn-sm">Search</button></form>
              <a href="/clients/new" class="btn btn-primary btn-sm" style="text-decoration:none">+ New Client</a>
            </div>
          </div>
          <div class="card" style="padding:0">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Actions</th></tr></thead>
              <tbody>
                {clients.map(c => (
                  <tr style={c.deleted_at ? "opacity:0.5" : ""}>
                    <td><strong>{c.name}</strong>{c.deleted_at && <span class="badge badge-danger" style="margin-left:6px">Deleted</span>}</td>
                    <td class="text-sm">{c.email || "—"}</td>
                    <td class="text-sm">{c.timezone || "—"}</td>
                    <td class="text-sm">{c.holiday_schedule || "—"}</td>
                    <td>
                      {c.deleted_at
                        ? <form action={`/clients/${c.id}/restore`} method="POST" style="display:inline"><button class="badge badge-success" style="cursor:pointer;border:none">Restore</button></form>
                        : <div style="display:flex;gap:4px">
                            <a href={`/clients/${c.id}/edit`} class="badge badge-info" style="text-decoration:none">Edit</a>
                            <form action={`/clients/${c.id}/delete`} method="POST" style="display:inline"><button class="badge badge-danger" style="cursor:pointer;border:none">Delete</button></form>
                          </div>
                      }
                    </td>
                  </tr>
                ))}
                {clients.length === 0 && <tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-secondary)">No clients found</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Layout>
  )
}
