import type { FC, Child } from "hono/jsx"
import { ThemeToggle, THEME_SCRIPT } from "./components/ThemeToggle"

interface LayoutProps {
  title: string
  activeNav: string
  children: Child
}

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/", icon: "bi-speedometer2" },
  { id: "ops", label: "OP Directory", href: "/ops", icon: "bi-people" },
  { id: "clients", label: "Clients", href: "/clients", icon: "bi-building" },
  { id: "assignments", label: "Assignments", href: "/assignments", icon: "bi-link" },
  { id: "onboarding", label: "Onboarding", href: "/onboarding", icon: "bi-clipboard-data" },
  { id: "schedule", label: "Check-in Schedule", href: "/schedule", icon: "bi-calendar" },
  { id: "cs-staff", label: "Users", href: "/cs-staff", icon: "bi-person-badge" },
  { id: "red-flags", label: "Red Flags", href: "/red-flags", icon: "bi-exclamation-triangle" },
  { id: "reviews", label: "Reviews", href: "/reviews", icon: "bi-clipboard-check" },
  { id: "settings", label: "Settings", href: "/settings", icon: "bi-gear" },
]

export const Layout: FC<LayoutProps> = ({ title, activeNav, children }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title} — Nexus</title>
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234f7cff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='3'/%3E%3Cpath d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'/%3E%3C/svg%3E" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet" />
        <script src="https://unpkg.com/htmx.org@2.0.4" />
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />

        <style>{css}</style>
      </head>
      <body>
        <div class="app-shell">
          <aside class="sidebar">
            <div class="sidebar-header">
              <h1 class="logo">Nexus</h1>
              <span class="subtitle">WeAssist Operations</span>
            </div>
            <nav class="nav">
              {NAV_ITEMS.map(item => (
                <a href={item.href}
                  class="d-flex align-items-center gap-2 px-2 py-2 rounded text-decoration-none mb-1 nav-item"
                  style={{
                    color: activeNav === item.id ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
                    background: activeNav === item.id ? 'var(--sidebar-active)' : 'transparent',
                  }}>
                  <i class={item.icon} style="font-size:1rem"></i>
                  <span style="font-size:0.875rem">{item.label}</span>
                </a>
              ))}
            </nav>
            <div class="sidebar-footer">
              <span class="version">v0.1.0</span>
              <ThemeToggle className="sidebar-btn" />
            </div>
          </aside>
          <main class="main-content">
            <header class="page-header">
              <h2 class="page-title">{title}</h2>
            </header>
            <div class="content-body">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  )
}

export const css = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --sidebar-w: 220px;
  --bg: #f5f6fa;
  --body-bg: #f5f6fa;
  --sidebar-bg: #ffffff;
  --sidebar-text: #1a1d29;
  --sidebar-hover: #f0f2f5;
  --sidebar-active: #4f7cff;
  --sidebar-active-text: #ffffff;
  --sidebar-border: #e2e4e8;
  --sidebar-logo: #1a1d29;
  --sidebar-version: #9aa0b0;
  --sidebar-btn-border: #d0d2d8;
  --accent: #4f7cff;
  --accent-light: #e8edff;
  --border: #e2e4e8;
  --text: #1a1d29;
  --text-secondary: #6b6f80;
  --card-bg: #ffffff;
  --header-bg: #ffffff;
  --header-border: #dee2e6;
  --table-header-bg: #f5f6fa;
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
  --radius: 8px;
  --shadow: 0 1px 3px rgba(0,0,0,0.08);
}
html { font-size: 14px; }
body {
  font-family: -apple-system, BlinkMacSystemFont, Segoe\ UI, Roboto, sans-serif;
  background: var(--body-bg);
  color: var(--text);
  line-height: 1.5;
}
.app-shell { display: flex; min-height: 100vh; }
.sidebar {
  width: var(--sidebar-w);
  background: var(--sidebar-bg);
  color: var(--sidebar-text);
  display: flex; flex-direction: column;
  position: fixed; top: 0; left: 0; bottom: 0;
  z-index: 100;
}
.sidebar-header { padding: 20px 16px 16px; border-bottom: 1px solid var(--sidebar-border); }
.logo { font-size: 1.25rem; font-weight: 700; color: var(--sidebar-logo); letter-spacing: -0.02em; }
.subtitle { font-size: 0.75rem; color: var(--sidebar-text); display: block; margin-top: 2px; }
.nav { flex: 1; padding: 8px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; border-radius: 6px;
  color: var(--sidebar-text); text-decoration: none;
  font-size: 0.875rem; transition: all 0.15s;
}
.sidebar a:hover { background: var(--sidebar-hover) !important; color: inherit; }
.nav-item:hover { background: var(--sidebar-hover) !important; color: inherit; }
.nav-item.active { background: var(--sidebar-active); color: var(--sidebar-active-text); }
.sidebar-footer { padding: 12px 16px; border-top: 1px solid var(--sidebar-border); display: flex; align-items: center; justify-content: space-between; }
.sidebar-footer .version { font-size: 0.7rem; color: var(--sidebar-version); }
.sidebar-btn {
  background: none; border: 1px solid var(--sidebar-btn-border); border-radius: 6px;
  color: var(--sidebar-text); cursor: pointer; padding: 4px 8px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.sidebar-btn:hover { background: var(--sidebar-hover); }

.main-content { margin-left: var(--sidebar-w); flex: 1; min-height: 100vh; }
.page-header {
  padding: 20px 24px; background: var(--card-bg);
  border-bottom: 1px solid var(--border);
  position: sticky; top: 0; z-index: 50;
}
.page-title { font-size: 1.25rem; font-weight: 600; }
.content-body { padding: 24px; }

/* Cards */
.card {
  background: var(--card-bg); border-radius: var(--radius);
  border: 1px solid var(--border); padding: 20px;
  box-shadow: var(--shadow);
}

/* Stats Grid */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
.stat-card {
  background: var(--card-bg); border-radius: var(--radius);
  border: 1px solid var(--border); padding: 16px 20px;
  box-shadow: var(--shadow);
}
.stat-value { font-size: 1.75rem; font-weight: 700; }
.stat-label { font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px; }

/* Tables */
.table-container { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--border); }
th { background: var(--bg); font-weight: 600; color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.03em; }
tr:hover td { background: var(--accent-light); }
tr:last-child td { border-bottom: none; }

/* Badges */
.badge {
  display: inline-block; padding: 2px 8px; border-radius: 12px;
  font-size: 0.75rem; font-weight: 500;
}
.badge-success { background: #dcfce7; color: #166534; }
.badge-warning { background: #fef3c7; color: #92400e; }
.badge-danger { background: #fee2e2; color: #991b1b; }
.badge-info { background: #dbeafe; color: #1e40af; }
.badge-secondary { background: #f1f5f9; color: #475569; }

/* Search */
.search-bar {
  display: flex; gap: 8px; margin-bottom: 16px;
  max-width: 400px;
}
.search-bar input {
  flex: 1; padding: 8px 12px; border: 1px solid var(--border);
  border-radius: var(--radius); font-size: 0.875rem;
  outline: none;
}
.search-bar input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-light); }

/* Grid layout helpers */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }

/* ── Forms (Bootstrap overrides for dark theme) ────────────── */
.form-label { font-size: 0.8rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 6px; }
.form-label .required { color: var(--danger); margin-left: 2px; }
.form-control, .form-select {
  background: var(--bg); color: var(--text); border-color: var(--border);
  font-size: 0.875rem; border-radius: 6px;
}
.form-control:focus, .form-select:focus {
  border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-light);
  background: var(--bg); color: var(--text);
}
.form-control::placeholder { color: var(--text-secondary); opacity: 0.6; }
.form-control:disabled, .form-select:disabled { opacity: 0.5; }
select.form-select { cursor: pointer; }

/* Card form section */
.form-section { max-width: 640px; }

/* Alerts */
.alert-success { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
.alert-danger { background: #fee2e2; color: #991b1b; border-color: #fecaca; }

/* Misc */
.mb-4 { margin-bottom: 16px; }
.mt-4 { margin-top: 16px; }
.text-secondary { color: var(--text-secondary); }
.text-sm { font-size: 0.8rem; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`

export const statusBadge = (status: string | null): string => {
  switch (status?.toLowerCase()) {
    case "active": return "badge badge-success"
    case "probation": return "badge badge-info"
    case "inactive": case "separated": return "badge badge-danger"
    case "graduated": return "badge badge-success"
    case "completed": return "badge badge-success"
    case "done": return "badge badge-success"
    case "not done": return "badge badge-secondary"
    case "na": return "badge badge-info"
    default: return "badge badge-secondary"
  }
}

export function toTitleCase(s: string | null | undefined): string {
  if (!s) return ""
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

export const inputField = (label: string, name: string, value: string | undefined, error?: string, required?: boolean, type?: string) => (
  <div class="mb-3">
    <label class="form-label" style="font-size:0.8rem;font-weight:500;color:var(--text-secondary)">
      {label}{required ? " *" : ""}
    </label>
    {type === "textarea" ? (
      <textarea
        name={name}
        required={required}
        class={`form-control form-control-sm${error ? " is-invalid" : ""}`}
        style="min-height:80px"
      >{(value || "")}</textarea>
    ) : (
      <input
        type={type || "text"}
        name={name}
        value={value || ""}
        required={required}
        class={`form-control form-control-sm${error ? " is-invalid" : ""}`}
      />
    )}
    {error && <div class="invalid-feedback d-block" style="font-size:0.75rem">{error}</div>}
  </div>
)

export const selectField = (label: string, name: string, value: string | undefined, options: string[], error?: string) => (
  <div class="mb-3">
    <label class="form-label" style="font-size:0.8rem;font-weight:500;color:var(--text-secondary)">{label}</label>
    <select
      name={name}
      class={`form-select form-select-sm${error ? " is-invalid" : ""}`}
    >
      {options.map(o => <option value={o} selected={value === o}>{o || "—"}</option>)}
    </select>
    {error && <div class="invalid-feedback d-block" style="font-size:0.75rem">{error}</div>}
  </div>
)
