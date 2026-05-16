import type { FC } from "hono/jsx"
import { raw } from "hono/html"
import { ThemeToggle, THEME_SCRIPT } from "../components/ThemeToggle"

interface Props {
  error?: string
  redirect?: string
}

export const LoginPage: FC<Props> = ({ error, redirect }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Login — Nexus</title>
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234f7cff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='3'/%3E%3Cpath d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'/%3E%3C/svg%3E" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: system-ui, -apple-system, sans-serif;
            background: var(--body-bg, #0f1119);
            color: var(--text, #e4e6eb);
            display: flex; align-items: center; justify-content: center;
            min-height: 100vh; position: relative;
          }
          .login-card {
            background: var(--card-bg, #1a1d29); border-radius: 16px;
            padding: 40px; width: 380px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          }
          .login-card h1 { font-size: 1.5rem; margin-bottom: 4px; }
          .login-card p.sub { color: var(--text-secondary, #b0b4c0); font-size: 0.875rem; margin-bottom: 24px; }
          .form-label { font-size: 0.8rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 6px; }
          .form-control {
            background: #0f1119; border-color: #2a2d3a; color: #e4e6eb; border-radius: 6px;
          }
          .form-control:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-light); }
          .btn-primary { background: var(--accent); border-color: var(--accent); }
          .theme-btn {
            position: absolute; top: 16px; right: 16px;
            background: var(--card-bg); border: 1px solid var(--border);
            border-radius: 8px; width: 36px; height: 36px; cursor: pointer;
            color: var(--text); display: flex; align-items: center; justify-content: center;
          }
          .theme-btn:hover { opacity: 0.8; }
          .theme-btn svg { width: 16px; height: 16px; }
        `}</style>
      </head>
      <body>
        <ThemeToggle />
        <div class="login-card">
          <div style="font-size:1.8rem;margin-bottom:8px">&#x2699;</div>
          <h1>Nexus</h1>
          <p class="sub">WeAssist Operations Dashboard</p>
          {error && <div class="alert alert-danger py-2" style="font-size:0.85rem">{error}</div>}
          <form method="POST" action="/login">
            <input type="hidden" name="redirect" value={redirect || "/"} />
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input type="email" name="email" required autocomplete="email" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label">Password</label>
              <input type="password" name="password" required autocomplete="current-password" class="form-control" />
            </div>
            <button type="submit" class="btn btn-primary w-100">Sign In</button>
          </form>
        </div>
        <script>{raw(THEME_SCRIPT)}</script>
      </body>
    </html>
  )
}
