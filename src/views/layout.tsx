import type { FC, Child } from "hono/jsx"

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
  { id: "checkins", label: "Check-ins", href: "/checkins", icon: "bi-check-circle" },
  { id: "schedule", label: "Check-in Schedule", href: "/schedule", icon: "bi-calendar" },
  { id: "cs-staff", label: "CS Staff", href: "/cs-staff", icon: "bi-person-badge" },
  { id: "red-flags", label: "Red Flags", href: "/red-flags", icon: "bi-exclamation-triangle" },
  { id: "reviews", label: "Reviews", href: "/reviews", icon: "bi-clipboard-check" },
]

export const Layout: FC<LayoutProps> = ({ title, activeNav, children }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title} — Nexus</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet" />
        <script src="https://unpkg.com/htmx.org@2.0.4" />
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" />
        <script dangerouslySetInnerHTML={{ __html: `
(function() {
  var saveKey = 'nexus-theme';
  function apply(theme) {
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved = theme === 'dark' || (theme === 'system' && prefersDark) ? 'dark' : 'light';
    document.documentElement.setAttribute('data-bs-theme', resolved);
    document.documentElement.setAttribute('data-theme', resolved);
    window.__nexusTheme = theme;
    window.__nexusResolved = resolved;
    var root = document.documentElement;
    if (resolved === 'dark') {
      root.style.setProperty('--body-bg', '#0f1119');
      root.style.setProperty('--card-bg', '#1a1d29');
      root.style.setProperty('--header-bg', '#1a1d29');
      root.style.setProperty('--header-border', '#2a2d3a');
      root.style.setProperty('--table-header-bg', '#1a1d29');
      root.style.setProperty('--sidebar-bg', '#0f1119');
      root.style.setProperty('--sidebar-text', '#a0a4b8');
      root.style.setProperty('--sidebar-hover', '#1a1d29');
      root.style.setProperty('--sidebar-active', '#4f7cff');
      root.style.setProperty('--sidebar-active-text', '#ffffff');
      root.style.setProperty('--sidebar-border', 'rgba(255,255,255,0.06)');
      root.style.setProperty('--sidebar-logo', '#ffffff');
      root.style.setProperty('--sidebar-version', 'rgba(255,255,255,0.3)');
      root.style.setProperty('--sidebar-btn-border', 'rgba(255,255,255,0.15)');
    } else {
      root.style.setProperty('--body-bg', '#f5f6fa');
      root.style.setProperty('--card-bg', '#ffffff');
      root.style.setProperty('--header-bg', '#ffffff');
      root.style.setProperty('--header-border', '#dee2e6');
      root.style.setProperty('--table-header-bg', '#f5f6fa');
      root.style.setProperty('--sidebar-bg', '#ffffff');
      root.style.setProperty('--sidebar-text', '#1a1d29');
      root.style.setProperty('--sidebar-hover', '#f0f2f5');
      root.style.setProperty('--sidebar-active', '#4f7cff');
      root.style.setProperty('--sidebar-active-text', '#ffffff');
      root.style.setProperty('--sidebar-border', '#e2e4e8');
      root.style.setProperty('--sidebar-logo', '#1a1d29');
      root.style.setProperty('--sidebar-version', '#9aa0b0');
      root.style.setProperty('--sidebar-btn-border', '#d0d2d8');
    }
    // Update toggle icon
    var icon = document.getElementById('theme-icon');
    if (icon) {
      if (theme === 'dark') {
        icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
      } else if (theme === 'light') {
        icon.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
      } else {
        icon.innerHTML = '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>';
      }
    }
  }
  var saved = localStorage.getItem(saveKey) || 'system';
  apply(saved);
  window.__nexusApply = apply;
  window.toggleTheme = function() {
    var current = localStorage.getItem(saveKey) || 'system';
    var next = current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system';
    localStorage.setItem(saveKey, next);
    apply(next);
  };
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
    var t = localStorage.getItem(saveKey) || 'system';
    if (t === 'system') apply('system');
  });
})();
` }} />
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
              <button onclick="toggleTheme()" class="sidebar-btn" title="Toggle theme">
                <svg id="theme-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              </button>
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
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
