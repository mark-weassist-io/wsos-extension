import { serve } from "bun"
import { app } from "./app"
import { config } from "./config"
import { getRedFlags, createRedFlag, updateRedFlag, softDeleteRedFlag, restoreRedFlag, getRedFlagById } from "./db/queries/red-flags"
import { getCsStaff, createCsStaff, updateCsStaff, softDeleteCsStaff, restoreCsStaff, getCsStaffById } from "./db/queries/cs-staff"
import { getNinetyDayCheckins, createCheckin, updateCheckin, softDeleteCheckin, restoreCheckin, getCheckinById } from "./db/queries/checkins"

const NAV = [
  { id: "dashboard", label: "Dashboard", href: "/", icon: "▦" },
  { id: "ops", label: "OP Directory", href: "/ops", icon: "👤" },
  { id: "clients", label: "Clients", href: "/clients", icon: "🏢" },
  { id: "assignments", label: "Assignments", href: "/assignments", icon: "🔗" },
  { id: "onboarding", label: "Onboarding", href: "/onboarding", icon: "📋" },
  { id: "checkins", label: "Check-ins", href: "/checkins", icon: "📊" },
  { id: "schedule", label: "Check-in Schedule", href: "/schedule", icon: "📅" },
  { id: "cs-staff", label: "CS Staff", href: "/cs-staff", icon: "👥" },
  { id: "red-flags", label: "Red Flags", href: "/red-flags", icon: "⚠" },
]

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root {
  --sidebar-w:220px; --bg:#f5f6fa; --body-bg:#f5f6fa;
  --sidebar-bg:#ffffff; --sidebar-text:#1a1d29; --sidebar-hover:#f0f2f5;
  --sidebar-active:#4f7cff; --sidebar-active-text:#ffffff;
  --sidebar-border:#e2e4e8; --sidebar-logo:#1a1d29; --sidebar-version:#9aa0b0;
  --sidebar-btn-border:#d0d2d8;
  --accent:#4f7cff; --accent-light:#e8edff; --border:#e2e4e8;
  --text:#1a1d29; --text-secondary:#6b6f80;
  --card-bg:#fff; --header-bg:#fff; --header-border:#dee2e6; --table-header-bg:#f5f6fa;
  --success:#22c55e; --warning:#f59e0b; --danger:#ef4444;
  --radius:8px; --shadow:0 1px 3px rgba(0,0,0,0.08);
}
html{font-size:14px}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:var(--body-bg);color:var(--text);line-height:1.5}
.app-shell{display:flex;min-height:100vh}
.sidebar{width:var(--sidebar-w);background:var(--sidebar-bg);color:var(--sidebar-text);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:100}
.sidebar-header{padding:20px 16px 16px;border-bottom:1px solid var(--sidebar-border)}
.logo{font-size:1.25rem;font-weight:700;color:var(--sidebar-logo);letter-spacing:-0.02em}
.subtitle{font-size:.75rem;color:var(--sidebar-text);display:block;margin-top:2px}
.nav{flex:1;padding:8px;display:flex;flex-direction:column;gap:2px;overflow-y:auto}
.nav-item{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:6px;color:var(--sidebar-text);text-decoration:none;font-size:.875rem;transition:all .15s}
.nav-item:hover{background:var(--sidebar-hover);color:inherit}
.nav-item.active{background:var(--sidebar-active);color:var(--sidebar-active-text)}
.sidebar-footer{padding:12px 16px;border-top:1px solid var(--sidebar-border);display:flex;align-items:center;justify-content:space-between}
.version{font-size:.7rem;color:var(--sidebar-version)}
.main-content{margin-left:var(--sidebar-w);flex:1;min-height:100vh}
.page-header{padding:20px 24px;background:var(--card-bg);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:50}
.page-title{font-size:1.25rem;font-weight:600}
.content-body{padding:24px}
.card{background:var(--card-bg);border-radius:var(--radius);border:1px solid var(--border);padding:20px;box-shadow:var(--shadow)}
table{width:100%;border-collapse:collapse;font-size:.875rem}
th,td{padding:10px 12px;text-align:left;border-bottom:1px solid var(--border)}
th{background:var(--bg);font-weight:600;color:var(--text-secondary);font-size:.8rem;text-transform:uppercase;letter-spacing:.03em}
tr:hover td{background:var(--accent-light)}
.badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:.75rem;font-weight:500}
.badge-success{background:#dcfce7;color:#166534}
.badge-warning{background:#fef3c7;color:#92400e}
.badge-danger{background:#fee2e2;color:#991b1b}
.badge-info{background:#dbeafe;color:#1e40af}
.badge-secondary{background:#f1f5f9;color:#475569}
.search-bar{display:flex;gap:8px;margin-bottom:16px;max-width:400px}
.search-bar input{flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);font-size:.875rem;outline:none}
.search-bar input:focus{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-light)}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px}
.stat-card{background:var(--card-bg);border-radius:var(--radius);border:1px solid var(--border);padding:16px 20px;box-shadow:var(--shadow)}
.stat-value{font-size:1.75rem;font-weight:700}
.stat-label{font-size:.8rem;color:var(--text-secondary);margin-top:2px}
.mb-4{margin-bottom:16px}.mt-4{margin-top:16px}
.text-sm{font-size:.8rem}.text-secondary{color:var(--text-secondary)}
`

function pageHTML(title: string, active: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title} — WSOS Extension</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet" />
<script src="https://unpkg.com/htmx.org@2.0.4"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<style>${CSS}</style></head>
<body><div class="app-shell"><aside class="sidebar">
<div class="sidebar-header"><h1 class="logo">WSOS Ext</h1><span class="subtitle">WeAssist Operations</span></div>
<nav class="nav">${NAV.map(n => `<a href="${n.href}" class="d-flex align-items-center gap-2 px-2 py-2 rounded text-decoration-none mb-1 nav-item${active === n.id ? " active" : ""}" style="${active === n.id ? "color:var(--sidebar-active-text);background:var(--sidebar-active)" : "color:var(--sidebar-text);background:transparent"}"><i class="${n.icon}" style="font-size:1rem"></i><span style="font-size:0.875rem">${n.label}</span></a>`).join("")}</nav>
<div class="sidebar-footer"><span class="version">v0.1.0</span>
<button onclick="toggleTheme()" class="sidebar-btn" title="Toggle theme"><svg id="theme-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg></button>
</div>
</aside><main class="main-content">
<header class="page-header"><h2 class="page-title">${title}</h2></header>
<div class="content-body">${body}</div>
</main></div></body></html>`
}

function esc(s: string | null | undefined): string {
  if (!s) return ""
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

// Pure string-template routes — no Hono, no JSX
// Handle POST bodies
async function bodyParams(req: Request): Promise<Record<string, string>> {
  const text = await req.text()
  const params: Record<string, string> = {}
  for (const part of text.split("&")) {
    const [k, v] = part.split("=")
    if (k) params[decodeURIComponent(k)] = v ? decodeURIComponent(v.replace(/\+/g, " ")) : ""
  }
  return params
}

const staticRoutes: Record<string, (url: URL, req: Request) => Response | Promise<Response>> = {
  "/red-flags": (url, req) => {
    const trashed = url.searchParams.get("trashed") === "1"
    const flags = getRedFlags(url.searchParams.get("search") || undefined, trashed)
    const rows = flags.map(f => {
      const d = f.deleted_at
      const ad = d
        ? `<form action="/red-flags/${f.id}/restore" method="POST" style="display:inline"><button class="badge badge-success" style="cursor:pointer;border:none">Restore</button></form>`
        : `<a href="/red-flags/${f.id}/edit" class="badge badge-info" style="text-decoration:none">Edit</a>
<form action="/red-flags/${f.id}/delete" method="POST" style="display:inline"><button class="badge badge-danger" style="cursor:pointer;border:none">Delete</button></form>`
      return `<tr${d ? ' style="opacity:0.5"' : ""}><td><strong>${esc(f.flag_name)}</strong>${d ? ' <span class="badge badge-danger">Deleted</span>' : ""}</td><td>${esc(f.definition)}</td><td>${ad}</td></tr>`
    }).join("") || '<tr><td colspan="3" style="padding:40px;text-align:center;color:var(--text-secondary)">No flags found</td></tr>'

    return new Response(pageHTML("Red Flags", "red-flags", `
      <div style="display:flex;gap:8px;margin-bottom:16px;align-items:center">
        <a href="/red-flags" class="badge ${!trashed ? "badge-info" : "badge-secondary"}" style="text-decoration:none">Active</a>
        <a href="/red-flags?trashed=1" class="badge ${trashed ? "badge-info" : "badge-secondary"}" style="text-decoration:none">Trashed</a>
      </div>
      <div class="card" style="padding:0">
        <table><thead><tr><th>Flag</th><th>Definition</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table>
      </div>
    `), { headers: { "Content-Type": "text/html" } })
  },
  "/red-flags/new": (url) => new Response(pageHTML("New Red Flag", "red-flags", `
    <a href="/red-flags" style="color:var(--accent);text-decoration:none;font-size:.875rem;display:inline-block;margin-bottom:16px">← Back</a>
    <h3 style="font-size:1rem;font-weight:600;margin-bottom:12px">New Red Flag</h3>
    <form action="/red-flags" method="POST" class="card" style="padding:20px;max-width:500px">
      <div style="margin-bottom:12px"><label style="display:block;font-size:.8rem;font-weight:500;margin-bottom:4px;color:var(--text-secondary)">Flag Name *</label><input type="text" name="flagName" required style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);font-size:.875rem;box-sizing:border-box"></div>
      <div style="margin-bottom:12px"><label style="display:block;font-size:.8rem;font-weight:500;margin-bottom:4px;color:var(--text-secondary)">Definition</label><textarea name="definition" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);font-size:.875rem;box-sizing:border-box;min-height:80px"></textarea></div>
      <button type="submit" style="padding:8px 20px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius);cursor:pointer;font-weight:500">Create</button>
    </form>
  `), { headers: { "Content-Type": "text/html" } }),
  "/cs-staff": (url, req) => {
    const includeTrashed = url.searchParams.get("trashed") === "1"
    const staff = getCsStaff(url.searchParams.get("search") || undefined, includeTrashed)
    const rows = staff.map(s => {
      const actions = s.deleted_at
        ? `<form action="/cs-staff/${s.id}/restore" method="POST" style="display:inline"><button class="badge badge-success" style="cursor:pointer;border:none">Restore</button></form>`
        : `<a href="/cs-staff/${s.id}/edit" class="badge badge-info" style="text-decoration:none">Edit</a>
<form action="/cs-staff/${s.id}/delete" method="POST" style="display:inline"><button class="badge badge-danger" style="cursor:pointer;border:none">Delete</button></form>`
      return `<tr${s.deleted_at ? ' style="opacity:0.5"' : ""}><td><strong>${esc(s.name)}</strong>${s.deleted_at ? ' <span class="badge badge-danger">Deleted</span>' : ""}</td><td>${esc(s.full_name)}</td><td>${actions}</td></tr>`
    }).join("") || '<tr><td colspan="3" style="padding:40px;text-align:center;color:var(--text-secondary)">No staff found</td></tr>'

    return new Response(pageHTML("CS Staff", "cs-staff", `
      <div style="display:flex;gap:8px;margin-bottom:16px;align-items:center">
        <a href="/cs-staff" class="badge ${!includeTrashed ? "badge-info" : "badge-secondary"}" style="text-decoration:none">Active</a>
        <a href="/cs-staff?trashed=1" class="badge ${includeTrashed ? "badge-info" : "badge-secondary"}" style="text-decoration:none">Trashed</a>
        <a href="/cs-staff/new" style="margin-left:auto;padding:8px 16px;background:var(--accent);color:#fff;border-radius:var(--radius);text-decoration:none;font-size:.875rem">+ New</a>
      </div>
      <div class="card" style="padding:0">
        <table><thead><tr><th>Name</th><th>Full Name</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table>
      </div>
    `), { headers: { "Content-Type": "text/html" } })
  },
  "/cs-staff/new": (url) => new Response(pageHTML("New Staff", "cs-staff", `
    <a href="/cs-staff" style="color:var(--accent);text-decoration:none;font-size:.875rem;display:inline-block;margin-bottom:16px">← Back</a>
    <h3 style="font-size:1rem;font-weight:600;margin-bottom:12px">New Staff</h3>
    <form action="/cs-staff" method="POST" class="card" style="padding:20px;max-width:500px">
      <div style="margin-bottom:12px"><label style="display:block;font-size:.8rem;font-weight:500;margin-bottom:4px;color:var(--text-secondary)">Name *</label><input type="text" name="name" required style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);font-size:.875rem;box-sizing:border-box"></div>
      <div style="margin-bottom:12px"><label style="display:block;font-size:.8rem;font-weight:500;margin-bottom:4px;color:var(--text-secondary)">Full Name</label><input type="text" name="fullName" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);font-size:.875rem;box-sizing:border-box"></div>
      <button type="submit" style="padding:8px 20px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius);cursor:pointer;font-weight:500">Create</button>
    </form>
  `), { headers: { "Content-Type": "text/html" } }),
}

serve({
  async fetch(req) {
    const url = new URL(req.url)
    const path = url.pathname

    // CS Staff CRUD
    if (path === "/cs-staff" && req.method === "POST") { const b = await bodyParams(req); if (b.name) createCsStaff({ name: b.name, fullName: b.fullName }); return Response.redirect("/cs-staff") }
    const csMatchDel = path.match(/^\/cs-staff\/(\d+)\/delete$/)
    if (csMatchDel && req.method === "POST") { softDeleteCsStaff(parseInt(csMatchDel[1]!)); return Response.redirect("/cs-staff") }
    const csMatchRes = path.match(/^\/cs-staff\/(\d+)\/restore$/)
    if (csMatchRes && req.method === "POST") { restoreCsStaff(parseInt(csMatchRes[1]!)); return Response.redirect("/cs-staff?trashed=1") }
    const csMatchEdit = path.match(/^\/cs-staff\/(\d+)\/edit$/)
    if (csMatchEdit) {
      const s = getCsStaffById(parseInt(csMatchEdit[1]!)) as any
      if (!s) return Response.redirect("/cs-staff")
      return new Response(pageHTML("Edit Staff", "cs-staff", `
        <a href="/cs-staff" style="color:var(--accent);text-decoration:none;font-size:.875rem;display:inline-block;margin-bottom:16px">← Back</a>
        <h3 style="font-size:1rem;font-weight:600;margin-bottom:12px">Edit Staff</h3>
        <form action="/cs-staff/${s.id}" method="POST" class="card" style="padding:20px;max-width:500px">
          <div style="margin-bottom:12px"><label style="display:block;font-size:.8rem;font-weight:500;margin-bottom:4px;color:var(--text-secondary)">Name *</label><input type="text" name="name" value="${esc(s.name)}" required style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);font-size:.875rem;box-sizing:border-box"></div>
          <div style="margin-bottom:12px"><label style="display:block;font-size:.8rem;font-weight:500;margin-bottom:4px;color:var(--text-secondary)">Full Name</label><input type="text" name="fullName" value="${esc(s.fullName)}" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);font-size:.875rem;box-sizing:border-box"></div>
          <button type="submit" style="padding:8px 20px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius);cursor:pointer;font-weight:500">Update</button>
        </form>
      `), { headers: { "Content-Type": "text/html" } })
    }
    const csMatchUpdate = path.match(/^\/cs-staff\/(\d+)$/)
    if (csMatchUpdate && req.method === "POST") { const b = await bodyParams(req); updateCsStaff(parseInt(csMatchUpdate[1]!), { name: b.name, fullName: b.fullName }); return Response.redirect("/cs-staff") }

    // Check-in CRUD
    if (path === "/checkins" && req.method === "POST") { const b = await bodyParams(req); if (b.opName) createCheckin({ opName: b.opName, checkinType: b.checkinType, checkinDate: b.checkinDate, status: b.status, notes: b.notes }); return Response.redirect("/checkins") }
    const ciEdit = path.match(/^\/checkins\/(\d+)\/edit$/)
    if (ciEdit) { const c = getCheckinById(parseInt(ciEdit[1]!)); if (!c) return Response.redirect("/checkins"); return new Response(pageHTML("Edit Check-in", "checkins", `
      <a href="/checkins" style="color:var(--accent);text-decoration:none;font-size:.875rem;display:inline-block;margin-bottom:16px">← Back</a>
      <h3 style="font-size:1rem;font-weight:600;margin-bottom:12px">Edit Check-in</h3>
      <form action="/checkins/${c.id}" method="POST" class="card" style="padding:20px;max-width:500px">
        <div style="margin-bottom:12px"><label style="display:block;font-size:.8rem;font-weight:500;margin-bottom:4px;color:var(--text-secondary)">OP *</label><input type="text" name="opName" value="${esc(c.op_name)}" required style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);font-size:.875rem;box-sizing:border-box"></div>
        <div style="margin-bottom:12px"><label style="display:block;font-size:.8rem;font-weight:500;margin-bottom:4px;color:var(--text-secondary)">Type</label><input type="text" name="checkinType" value="${esc(c.checkin_type)}" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);font-size:.875rem;box-sizing:border-box"></div>
        <div style="margin-bottom:12px"><label style="display:block;font-size:.8rem;font-weight:500;margin-bottom:4px;color:var(--text-secondary)">Date</label><input type="date" name="checkinDate" value="${esc(c.checkin_date)}" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);font-size:.875rem;box-sizing:border-box"></div>
        <div style="margin-bottom:12px"><label style="display:block;font-size:.8rem;font-weight:500;margin-bottom:4px;color:var(--text-secondary)">Status</label>
          <select name="status" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);font-size:.875rem;box-sizing:border-box;background:#fff">
            <option value="">—</option><option value="GRADUATED"${c.status === "GRADUATED" ? " selected" : ""}>GRADUATED</option>
            <option value="RESIGNED"${c.status === "RESIGNED" ? " selected" : ""}>RESIGNED</option>
            <option value="TERMINATED"${c.status === "TERMINATED" ? " selected" : ""}>TERMINATED</option>
            <option value="TRANSITIONED"${c.status === "TRANSITIONED" ? " selected" : ""}>TRANSITIONED</option>
          </select></div>
        <div style="margin-bottom:12px"><label style="display:block;font-size:.8rem;font-weight:500;margin-bottom:4px;color:var(--text-secondary)">Notes</label><textarea name="notes" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);font-size:.875rem;box-sizing:border-box;min-height:80px">${esc(c.notes)}</textarea></div>
        <button type="submit" style="padding:8px 20px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius);cursor:pointer;font-weight:500">Update</button>
      </form>
    `), { headers: { "Content-Type": "text/html" } }) }
    const ciDel = path.match(/^\/checkins\/(\d+)\/delete$/)
    if (ciDel && req.method === "POST") { softDeleteCheckin(parseInt(ciDel[1]!)); return Response.redirect("/checkins") }
    const ciRes = path.match(/^\/checkins\/(\d+)\/restore$/)
    if (ciRes && req.method === "POST") { restoreCheckin(parseInt(ciRes[1]!)); return Response.redirect("/checkins?trashed=1") }
    const ciUpdate = path.match(/^\/checkins\/(\d+)$/)
    if (ciUpdate && req.method === "POST") { const b = await bodyParams(req); updateCheckin(parseInt(ciUpdate[1]!), b as any); return Response.redirect("/checkins") }

    // Red-flags CRUD
    if (path === "/red-flags" && req.method === "POST") { const b = await bodyParams(req); if (b.flagName) createRedFlag({ flagName: b.flagName, definition: b.definition }); return Response.redirect("/red-flags") }
    const matchDelete = path.match(/^\/red-flags\/(\d+)\/delete$/)
    if (matchDelete && req.method === "POST") { softDeleteRedFlag(parseInt(matchDelete[1]!)); return Response.redirect("/red-flags") }
    const matchRestore = path.match(/^\/red-flags\/(\d+)\/restore$/)
    if (matchRestore && req.method === "POST") { restoreRedFlag(parseInt(matchRestore[1]!)); return Response.redirect("/red-flags?trashed=1") }
    const matchUpdate = path.match(/^\/red-flags\/(\d+)$/)
    if (matchUpdate && req.method === "POST") { const b = await bodyParams(req); updateRedFlag(parseInt(matchUpdate[1]!), b as any); return Response.redirect("/red-flags") }

    const handler = staticRoutes[path]
    if (handler) return handler(url, req)
    return app.fetch(req)
  },
  port: config.port,
  hostname: config.host,
})

console.log(`WSOS Extension running at http://${config.host}:${config.port}`)
