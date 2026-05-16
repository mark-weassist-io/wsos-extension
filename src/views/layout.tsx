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
  { id: "existing-accounts", label: "Accounts", href: "/existing-accounts", icon: "bi-journal-check" },
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
  --sidebar-w: 240px;
  --bg: #f8f9fb;
  --body-bg: #f3f4f6;
  --sidebar-bg: #ffffff;
  --sidebar-text: #1e2130;
  --sidebar-hover: #f0f2f5;
  --sidebar-active: #5b6cf0;
  --sidebar-active-text: #ffffff;
  --sidebar-border: #e9ebf0;
  --sidebar-logo: #1e2130;
  --sidebar-version: #9ca3af;
  --sidebar-btn-border: #d1d5db;
  --accent: #5b6cf0;
  --accent-light: #eef0ff;
  --accent-hover: #4a5ad4;
  --border: #e5e7eb;
  --text: #1a1d2e;
  --text-secondary: #6b7280;
  --card-bg: #ffffff;
  --header-bg: #ffffff;
  --header-border: #eef0f4;
  --table-header-bg: #f8f9fb;
  --table-stripe: #fafbfc;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --info: #5b6cf0;
  --radius: 10px;
  --radius-sm: 8px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
  --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04);
  --transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
html { font-size: 14px; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background: var(--body-bg);
  color: var(--text);
  line-height: 1.6;
}
.app-shell { display: flex; min-height: 100vh; }
.sidebar {
  width: var(--sidebar-w);
  background: var(--sidebar-bg);
  color: var(--sidebar-text);
  display: flex; flex-direction: column;
  position: fixed; top: 0; left: 0; bottom: 0;
  z-index: 100;
  border-right: 1px solid var(--sidebar-border);
}
.sidebar-header { padding: 24px 20px 20px; border-bottom: 1px solid var(--sidebar-border); }
.logo { font-size: 1.35rem; font-weight: 800; color: var(--sidebar-logo); letter-spacing: -0.03em; }
.subtitle { font-size: 0.72rem; color: var(--sidebar-version); display: block; margin-top: 4px; font-weight: 500; }
.nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
.nav-section-label {
  font-size: 0.65rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--sidebar-version);
  padding: 16px 12px 6px; margin-top: 4px;
}
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px; border-radius: var(--radius-sm);
  color: var(--sidebar-text); text-decoration: none;
  font-size: 0.875rem; font-weight: 500;
  transition: all var(--transition);
}
.sidebar a:hover { background: var(--sidebar-hover); color: inherit; }
.nav-item:hover { background: var(--sidebar-hover); color: inherit; }
.nav-item.active {
  background: linear-gradient(135deg, var(--sidebar-active), #7c6ef0);
  color: var(--sidebar-active-text);
  box-shadow: 0 2px 8px rgba(91, 108, 240, 0.3);
}
.sidebar-footer { padding: 14px 16px; border-top: 1px solid var(--sidebar-border); display: flex; align-items: center; justify-content: space-between; }
.sidebar-footer .version { font-size: 0.68rem; color: var(--sidebar-version); font-weight: 500; }
.sidebar-btn {
  background: none; border: 1px solid var(--sidebar-btn-border); border-radius: var(--radius-sm);
  color: var(--sidebar-text); cursor: pointer; padding: 6px 10px;
  display: flex; align-items: center; justify-content: center;
  transition: all var(--transition);
}
.sidebar-btn:hover { background: var(--sidebar-hover); border-color: var(--accent); }

.main-content { margin-left: var(--sidebar-w); flex: 1; min-height: 100vh; }
.page-header {
  padding: 22px 28px; background: var(--header-bg);
  border-bottom: 1px solid var(--header-border);
  position: sticky; top: 0; z-index: 50;
}
.page-title { font-size: 1.35rem; font-weight: 700; letter-spacing: -0.02em; }
.content-body { padding: 28px; }

/* Cards */
.card {
  background: var(--card-bg); border-radius: var(--radius);
  border: 1px solid var(--border); padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition);
}
.card:hover { box-shadow: var(--shadow); }

/* Stats Grid */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
.stat-card {
  background: var(--card-bg); border-radius: var(--radius);
  border: 1px solid var(--border); padding: 20px 24px;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition);
  cursor: default;
}
.stat-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
.stat-value { font-size: 2rem; font-weight: 800; letter-spacing: -0.03em; }
.stat-label { font-size: 0.78rem; color: var(--text-secondary); margin-top: 4px; font-weight: 500; }

/* Tables */
.table-container { overflow-x: auto; border-radius: var(--radius); }
table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border); }
th {
  background: var(--table-header-bg); font-weight: 600;
  color: var(--text-secondary); font-size: 0.75rem;
  text-transform: uppercase; letter-spacing: 0.06em;
  position: sticky; top: 0;
}
tbody tr { transition: background var(--transition); }
tbody tr:nth-child(even) { background: var(--table-stripe); }
tbody tr:hover td { background: var(--accent-light); }
tbody tr:last-child td { border-bottom: none; }

/* Badges */
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: 20px;
  font-size: 0.72rem; font-weight: 600; letter-spacing: 0.01em;
  line-height: 1.4;
}
.badge-success { background: #d1fae5; color: #065f46; }
.badge-warning { background: #fef3c7; color: #92400e; }
.badge-danger { background: #fee2e2; color: #991b1b; }
.badge-info { background: #e0e7ff; color: #3730a3; }
.badge-secondary { background: #f3f4f6; color: #4b5563; }

/* Buttons */
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 18px; border-radius: var(--radius-sm);
  font-size: 0.85rem; font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer; transition: all var(--transition);
  text-decoration: none; line-height: 1.4;
}
.btn-primary {
  background: var(--accent); color: #ffffff; border-color: var(--accent);
  box-shadow: 0 1px 2px rgba(91, 108, 240, 0.2);
}
.btn-primary:hover { background: var(--accent-hover); border-color: var(--accent-hover); box-shadow: 0 2px 6px rgba(91, 108, 240, 0.3); transform: translateY(-1px); }
.btn-outline-secondary {
  background: transparent; color: var(--text-secondary); border-color: var(--border);
}
.btn-outline-secondary:hover { background: var(--bg); border-color: var(--accent); color: var(--accent); }
.btn-sm { padding: 6px 14px; font-size: 0.8rem; }

/* Search */
.search-bar {
  display: flex; gap: 8px;
}
.search-bar input {
  flex: 1; padding: 8px 14px; border: 1px solid var(--border);
  border-radius: var(--radius-sm); font-size: 0.875rem;
  outline: none; background: var(--bg);
  transition: all var(--transition); min-width: 200px;
}
.search-bar input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light); background: var(--card-bg); }

/* Grid layout helpers */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }

/* Forms */
.form-label { font-size: 0.78rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; display: block; }
.form-label .required { color: var(--danger); margin-left: 2px; }
.form-control, .form-select {
  background: var(--bg); color: var(--text); border: 1px solid var(--border);
  font-size: 0.875rem; border-radius: var(--radius-sm); padding: 9px 12px;
  transition: all var(--transition); width: 100%;
}
.form-control:focus, .form-select:focus {
  border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light);
  background: var(--card-bg); color: var(--text); outline: none;
}
.form-control::placeholder { color: var(--text-secondary); opacity: 0.5; }
.form-control:disabled, .form-select:disabled { opacity: 0.5; background: var(--border); }
select.form-select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; }
.form-control.is-invalid, .form-select.is-invalid { border-color: var(--danger); }
.invalid-feedback { color: var(--danger); font-size: 0.72rem; margin-top: 4px; font-weight: 500; }

/* Card form section */
.form-section { max-width: 640px; }

/* Alerts */
.alert-success { background: #d1fae5; color: #065f46; border-color: #a7f3d0; }
.alert-danger { background: #fee2e2; color: #991b1b; border-color: #fecaca; }

/* Empty state */
.empty-state {
  text-align: center; padding: 48px 24px; color: var(--text-secondary);
}
.empty-state p { font-size: 0.9rem; margin-top: 8px; }

/* Misc */
.mb-3 { margin-bottom: 16px; }
.mb-4 { margin-bottom: 20px; }
.mt-4 { margin-top: 20px; }
.text-secondary { color: var(--text-secondary); }
.text-sm { font-size: 0.8rem; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Responsive */
@media (max-width: 768px) {
  .sidebar { width: 60px; }
  .sidebar .nav-item span, .sidebar .subtitle, .sidebar .version, .sidebar .logo { display: none; }
  .sidebar-header { padding: 16px 10px; }
  .nav-item { justify-content: center; padding: 10px; }
  .main-content { margin-left: 60px; }
  .grid-2 { grid-template-columns: 1fr; }
  .grid-3 { grid-template-columns: 1fr 1fr; }
  .content-body { padding: 16px; }
  .page-header { padding: 16px 20px; }
}
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
