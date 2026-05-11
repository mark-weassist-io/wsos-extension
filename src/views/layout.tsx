import type { FC, Child } from "hono/jsx"

interface LayoutProps {
  title: string
  activeNav: string
  children: Child
}

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/", icon: "▦" },
  { id: "ops", label: "OP Directory", href: "/ops", icon: "👤" },
  { id: "clients", label: "Clients", href: "/clients", icon: "🏢" },
  { id: "assignments", label: "Assignments", href: "/assignments", icon: "🔗" },
  { id: "onboarding", label: "Onboarding", href: "/onboarding", icon: "📋" },
  { id: "checkins", label: "Check-ins", href: "/checkins", icon: "📊" },
  { id: "schedule", label: "Check-in Schedule", href: "/schedule", icon: "📅" },
  { id: "cs-staff", label: "CS Staff", href: "/cs-staff", icon: "👥" },
  { id: "red-flags", label: "Red Flags", href: "/red-flags", icon: "⚠" },
  { id: "existing-accounts", label: "Existing Accounts", href: "/existing-accounts", icon: "📁" },
]

export const Layout: FC<LayoutProps> = ({ title, activeNav, children }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title} — WSOS Extension</title>
        <script src="https://unpkg.com/htmx.org@2.0.4" />
        <style>{css}</style>
      </head>
      <body>
        <div class="app-shell">
          <aside class="sidebar">
            <div class="sidebar-header">
              <h1 class="logo">WSOS Ext</h1>
              <span class="subtitle">WeAssist Operations</span>
            </div>
            <nav class="nav">
              {NAV_ITEMS.map(item => (
                <a
                  href={item.href}
                  class={`nav-item ${activeNav === item.id ? "active" : ""}`}
                >
                  <span class="nav-icon">{item.icon}</span>
                  <span class="nav-label">{item.label}</span>
                </a>
              ))}
            </nav>
            <div class="sidebar-footer">
              <span class="version">v0.1.0</span>
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
  --sidebar-bg: #1a1d29;
  --sidebar-text: #a0a4b8;
  --sidebar-active: #ffffff;
  --sidebar-hover: #2a2d3a;
  --accent: #4f7cff;
  --accent-light: #e8edff;
  --border: #e2e4e8;
  --text: #1a1d29;
  --text-secondary: #6b6f80;
  --card-bg: #ffffff;
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
  --radius: 8px;
  --shadow: 0 1px 3px rgba(0,0,0,0.08);
}
html { font-size: 14px; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: var(--bg);
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
.sidebar-header { padding: 20px 16px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.logo { font-size: 1.25rem; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
.subtitle { font-size: 0.75rem; color: var(--sidebar-text); display: block; margin-top: 2px; }
.nav { flex: 1; padding: 8px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; border-radius: 6px;
  color: var(--sidebar-text); text-decoration: none;
  font-size: 0.875rem; transition: all 0.15s;
}
.nav-item:hover { background: var(--sidebar-hover); color: var(--sidebar-active); }
.nav-item.active { background: var(--accent); color: #fff; }
.nav-icon { font-size: 1rem; width: 20px; text-align: center; }
.sidebar-footer { padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.08); }
.version { font-size: 0.7rem; color: rgba(255,255,255,0.3); }

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
    default: return "badge badge-secondary"
  }
}

export const inputField = (label: string, name: string, value: string | undefined, error?: string, required?: boolean, type?: string) => (
  <div style="margin-bottom:12px">
    <label style="display:block;font-size:0.8rem;font-weight:500;margin-bottom:4px;color:var(--text-secondary)">
      {label}{required ? " *" : ""}
    </label>
    {type === "textarea" ? (
      <textarea
        name={name}
        required={required}
        style={`width:100%;padding:8px 12px;border:1px solid ${error ? "var(--danger)" : "var(--border)"};border-radius:var(--radius);font-size:0.875rem;outline:none;box-sizing:border-box;min-height:80px`}
      >{(value || "")}</textarea>
    ) : (
      <input
        type={type || "text"}
        name={name}
        value={value || ""}
        required={required}
        style={`width:100%;padding:8px 12px;border:1px solid ${error ? "var(--danger)" : "var(--border)"};border-radius:var(--radius);font-size:0.875rem;outline:none;box-sizing:border-box`}
      />
    )}
    {error && <div style="font-size:0.75rem;color:var(--danger);margin-top:2px">{error}</div>}
  </div>
)

export const selectField = (label: string, name: string, value: string | undefined, options: string[], error?: string) => (
  <div style="margin-bottom:12px">
    <label style="display:block;font-size:0.8rem;font-weight:500;margin-bottom:4px;color:var(--text-secondary)">{label}</label>
    <select
      name={name}
      style={`width:100%;padding:8px 12px;border:1px solid ${error ? "var(--danger)" : "var(--border)"};border-radius:var(--radius);font-size:0.875rem;outline:none;box-sizing:border-box;background:#fff`}
    >
      {options.map(o => <option value={o} selected={value === o}>{o || "—"}</option>)}
    </select>
    {error && <div style="font-size:0.75rem;color:var(--danger);margin-top:2px">{error}</div>}
  </div>
)
