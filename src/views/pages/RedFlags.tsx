import type { FC } from "hono/jsx"
import { Layout, inputField, selectField } from "../layout"
import type { RedFlagRow } from "../../db/queries/red-flags"

interface Props {
  flags: RedFlagRow[]
  editing?: boolean
  editId?: number
  formData?: Record<string, string>
  errors?: Record<string, string>
  search?: string
}

const COLORS = [
  ["#ef4444", "Red"],
  ["#f97316", "Orange"],
  ["#eab308", "Yellow"],
  ["#22c55e", "Green"],
  ["#3b82f6", "Blue"],
  ["#8b5cf6", "Purple"],
  ["#ec4899", "Pink"],
  ["#6b7280", "Gray"],
]

export const RedFlagsPage: FC<Props> = ({ flags = [], editing, editId, formData, errors, search }) => {
  const trashed = flags.some(f => (f as any).deleted_at)
  return (
    <Layout title={editing ? (editId ? "Edit Red Flag" : "New Red Flag") : "Red Flags"} activeNav="red-flags">
      {editing ? (
        <div style="max-width:600px">
          <a href="/red-flags" style="color:var(--accent);text-decoration:none;font-size:0.875rem;display:inline-block;margin-bottom:16px">← Back</a>
          <h3 style="font-size:1rem;font-weight:600;margin-bottom:16px">{editId ? "Edit Red Flag" : "New Red Flag"}</h3>
          <form action={editId ? `/red-flags/${editId}` : "/red-flags"} method="POST" class="card" style="padding:20px">
            {inputField("Flag Name*", "flagName", formData?.flagName || "", errors?.flagName, true)}
            {inputField("Definition", "definition", formData?.definition || "", errors?.definition, false, "textarea")}
            <div class="mb-3">
              <label class="form-label" style="font-size:0.8rem;font-weight:500;color:var(--text-secondary)">Color</label>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                {COLORS.map(([hex, name]) => (
                  <label style={`display:flex;align-items:center;gap:4px;cursor:pointer;padding:4px 8px;border-radius:6px;border:2px solid ${formData?.color === hex ? 'var(--accent)' : 'transparent'};background:var(--bg)`}>
                    <input type="radio" name="color" value={hex} checked={formData?.color === hex || (!formData?.color && hex === "#ef4444")} style="display:none" />
                    <span style={`display:inline-block;width:14px;height:14px;border-radius:50%;background:${hex}`}></span>
                    <span style="font-size:0.75rem">{name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style="display:flex;gap:8px;margin-top:16px">
              <button type="submit" class="btn btn-primary btn-sm">{editId ? "Update" : "Create"}</button>
              <a href="/red-flags" class="btn btn-outline-secondary btn-sm">Cancel</a>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
            <div style="display:flex;gap:8px;align-items:center">
              <span class="text-secondary">{flags.length} flags</span>
              <a href="/red-flags" class={`badge ${!trashed ? "badge-info" : "badge-secondary"}`} style="text-decoration:none">Active</a>
              <a href="/red-flags?trashed=1" class={`badge ${trashed ? "badge-info" : "badge-secondary"}`} style="text-decoration:none">Trashed</a>
            </div>
            <div style="display:flex;gap:8px">
              <form action="/red-flags" method="get" class="search-bar" style="margin-bottom:0">
                <input type="text" name="search" placeholder="Search..." value={search || ""} />
                <button type="submit" class="btn btn-primary btn-sm">Search</button>
              </form>
              <a href="/red-flags/new" class="btn btn-primary btn-sm" style="text-decoration:none;display:inline-flex;align-items:center">+ New Flag</a>
            </div>
          </div>
          <div class="card" style="padding:0">
            <table>
              <thead><tr><th>Flag</th><th>Definition</th><th>Actions</th></tr></thead>
              <tbody>
                {flags.map(f => {
                  const isDeleted = (f as any).deleted_at
                  return (
                    <tr style={isDeleted ? "opacity:0.5" : ""}>
                      <td>
                        <span style={`display:inline-block;width:12px;height:12px;border-radius:50%;background:${(f as any).color || '#ccc'};margin-right:6px;vertical-align:middle`}></span>
                        <strong>{f.flag_name}</strong>
                        {isDeleted && <span class="badge badge-danger" style="margin-left:6px">Deleted</span>}
                      </td>
                      <td class="text-sm">{f.definition || "—"}</td>
                      <td>
                        {isDeleted ? (
                          <form action={`/red-flags/${f.id}/restore`} method="POST" style="display:inline">
                            <button class="badge badge-success" style="cursor:pointer;border:none">Restore</button>
                          </form>
                        ) : (
                          <div style="display:flex;gap:4px">
                            <a href={`/red-flags/${f.id}/edit`} class="badge badge-info" style="text-decoration:none">Edit</a>
                            <form action={`/red-flags/${f.id}/delete`} method="POST" style="display:inline" onsubmit="return confirm('Soft delete this flag?')">
                              <button class="badge badge-danger" style="cursor:pointer;border:none">Delete</button>
                            </form>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {flags.length === 0 && <tr><td colspan="3" style="text-align:center;padding:40px;color:var(--text-secondary)">No red flags found</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Layout>
  )
}
