import type { FC } from "hono/jsx"
import { Layout, inputField } from "../layout"
import type { ExistingAccountRow } from "../../db/queries/existing-accounts"

interface Props {
  accounts: ExistingAccountRow[]
  editing?: boolean
  editId?: number
  errors?: Record<string, string>
  formData?: Record<string, string>
  search?: string
  showTrashed?: boolean
}

export const ExistingAccountsPage: FC<Props> = ({ accounts, editing, editId, errors, formData, search, showTrashed }) => {
  const title = editing ? (editId ? "Edit Account" : "New Account") : "Existing Accounts"

  return (
    <Layout title={title} activeNav="existing-accounts">
      {editing ? (
        <div style="max-width:600px">
          <a href="/existing-accounts" style="color:var(--accent);text-decoration:none;font-size:0.875rem;display:inline-block;margin-bottom:16px">← Back</a>
          <h3 style="font-size:1rem;font-weight:600;margin-bottom:16px">{editId ? "Edit Account" : "New Account"}</h3>
          <form action={editId ? `/existing-accounts/${editId}` : "/existing-accounts"} method="POST" class="card" style="padding:20px">
            {inputField("Client Name*", "clientName", formData?.clientName || "", errors?.clientName, true)}
            {inputField("Update Note", "updateNote", formData?.updateNote || "", errors?.updateNote, false, "textarea")}
            {inputField("Check-in Frequency", "checkinFrequency", formData?.checkinFrequency || "", errors?.checkinFrequency)}
            <div style="display:flex;gap:8px;margin-top:16px">
              <button type="submit" class="btn btn-primary btn-sm">{editId ? "Update" : "Create"}</button>
              <a href="/existing-accounts" class="btn btn-outline-secondary btn-sm">Cancel</a>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
            <div style="display:flex;align-items:center;gap:12px">
              <span class="text-secondary">{accounts.length} accounts</span>
              <a href="/existing-accounts" class={`badge ${!showTrashed ? "badge-info" : "badge-secondary"}`} style="text-decoration:none">Active</a>
              <a href="/existing-accounts?trashed=1" class={`badge ${showTrashed ? "badge-info" : "badge-secondary"}`} style="text-decoration:none">Trashed</a>
            </div>
            <div style="display:flex;gap:8px">
              <form action="/existing-accounts" method="get" class="search-bar" style="margin-bottom:0">
                <input type="text" name="search" placeholder="Search..." value={search || ""} />
                <button type="submit" class="btn btn-primary btn-sm">Search</button>
              </form>
              <a href="/existing-accounts/new" class="btn btn-primary btn-sm" style="text-decoration:none;display:inline-flex;align-items:center">+ New Account</a>
            </div>
          </div>
          <div class="card" style="padding:0">
            <div class="table-container">
              <table>
                <thead>
                  <tr><th>Client</th><th>Update Note</th><th>Check-in Frequency</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {accounts.map(a => (
                    <tr style={a.deleted_at ? "opacity:0.5" : ""}>
                      <td><strong>{a.client_name || "—"}</strong>{a.deleted_at && <span class="badge badge-danger" style="margin-left:6px">Deleted</span>}</td>
                      <td class="text-sm">{a.update_note || "—"}</td>
                      <td class="text-sm">{a.checkin_frequency || "—"}</td>
                      <td>
                        {a.deleted_at ? (
                          <form action={`/existing-accounts/${a.id}/restore`} method="POST" style="display:inline">
                            <button type="submit" class="badge badge-success" style="cursor:pointer;border:none;font-size:0.75rem">Restore</button>
                          </form>
                        ) : (
                          <div style="display:flex;gap:4px">
                            <a href={`/existing-accounts/${a.id}/edit`} class="badge badge-info" style="text-decoration:none">Edit</a>
                            <form action={`/existing-accounts/${a.id}/delete`} method="POST" style="display:inline" onsubmit="return confirm('Soft delete this account?')">
                              <button type="submit" class="badge badge-danger" style="cursor:pointer;border:none;font-size:0.75rem">Delete</button>
                            </form>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {accounts.length === 0 && (
                    <tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text-secondary)">No accounts found</td></tr>
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
