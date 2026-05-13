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
