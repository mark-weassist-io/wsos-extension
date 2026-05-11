# WSOS Extension — Architecture & Agent Guide

## Overview

WSOS Extension is a **container application** that extends the capability of the WSOS platform to accommodate workflows WSOS does not have. It serves as the comprehensive, complete database of all WeAssist company data points and data collection, feeding data bidirectionally with WSOS.

### Guiding Principles

- **Extension, not duplication** — If WSOS already handles a workflow, we don't rebuild it. We augment.
- **Single source of truth** — Every data point lives in exactly one place. References everywhere else.
- **Modular by department** — Each department (After-Sales, Recruiting, etc.) is a self-contained module.
- **Agent-ready** — All routes, queries, and views are discoverable by filename convention.
- **Fix workflows, don't alienate** — Improvements must respect existing team workflows. Change gradually.

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Runtime | **Bun** | Fast, TypeScript-native, single-binary compile for deployment |
| Web Framework | **Hono** | Lightweight, JSX SSR built-in, Bun-first, no heavy dependencies |
| Database | **bun:sqlite** | Zero-infrastructure SQL, single file, fast reads, already used in data pipeline |
| Rendering | **Hono JSX** | Server-side rendered HTML, no separate frontend build, no API design overhead |
| Interactivity | **HTMX 2.x** | Minimal JS, HTML-over-the-wire, progressive enhancement |
| CSS | **Inline `<style>`** | Zero build step, scoped to layout, easy for agents to modify |
| Testing | **bun:test + fetch** | Lightweight smoke tests, no browser needed for API-level checks |

### Why not React/Vite/Supabase (like the existing OP Dashboard)?

The existing `apps/opdashboard-supabase/` serves a different purpose — PTO management for OPs, deployed to Netlify with Supabase. WSOS Extension is an **internal operations platform** for WeAssist staff. SSR + HTMX means:

- No CORS, no API design, no separate frontend deploy
- One codebase, one build, one binary
- Faster iteration — change a query, refresh the page
- Future agents can understand the full stack in one file

---

## Project Structure

```
apps/wsos-extension/
├── src/
│   ├── index.ts              # Entry point — Bun serve
│   ├── app.ts                # Hono app — route mounting, middleware
│   ├── config.ts             # Environment configuration
│   ├── types/
│   │   └── index.ts          # All domain types (Op, Client, OnboardingStep, etc.)
│   ├── db/
│   │   ├── index.ts          # Database singleton (bun:sqlite)
│   │   ├── schema.ts         # DDL for all tables (CREATE IF NOT EXISTS)
│   │   └── queries/
│   │       ├── ops.ts        # OP queries
│   │       ├── clients.ts    # Client queries
│   │       ├── assignments.ts # OP-Client assignment queries
│   │       ├── onboarding.ts # Onboarding checklist queries
│   │       ├── checkins.ts   # 90-day + post-90-day check-in queries
│   │       └── dashboard.ts  # Dashboard aggregation queries
│   ├── routes/               # One file per route group (returns HTML)
│   │   ├── dashboard.tsx
│   │   ├── ops.tsx
│   │   ├── clients.tsx
│   │   ├── onboarding.tsx
│   │   ├── checkins.tsx
│   │   ├── schedule.tsx
│   │   ├── red-flags.tsx
│   │   └── existing-accounts.tsx
│   ├── views/                # Hono JSX components
│   │   ├── layout.tsx        # Shell — sidebar, nav, CSS, base HTML
│   │   └── pages/            # One per route
│   │       ├── Dashboard.tsx
│   │       ├── OpsList.tsx
│   │       ├── ClientsList.tsx
│   │       ├── Onboarding.tsx
│   │       ├── Checkins.tsx
│   │       ├── Schedule.tsx
│   │       ├── RedFlags.tsx
│   │       └── ExistingAccounts.tsx
│   ├── middleware/
│   │   └── auth.ts           # (future) Simple session/passphrase auth
│   └── services/
│       ├── wsos-sync.ts      # (future) Bidirectional sync with WSOS API
│       └── sheets-sync.ts    # (future) Write-back to Google Sheets
├── data/
│   └── wsos-extension.db     # SQLite database (gitignored)
├── scripts/
│   ├── build-db.ts           # Rebuild DB from extracted JSON
│   └── start-server.ps1      # Persistent server launcher
├── tests/
│   └── smoke-test.spec.ts    # Bun test smoke tests
├── docs/
│   └── ARCHITECTURE.md       # This file
├── public/                   # (future) Static assets
├── package.json
└── tsconfig.json
```

---

## Data Model

### Entity Tables (1 fact = 1 row in 1 table)

| Table | Prefix | Type | Description |
|-------|--------|------|-------------|
| `wsos_ops` | WSOS | Core | Outsourced Professional identity — name, email, phone, address, gender, DOB |
| `wsos_clients` | WSOS | Core | Client companies — name, email, timezone, holiday schedule |
| `wsos_op_client_assignments` | WSOS | Core | OP-Client placements — role, status, type, dates, rate, CS assignment |
| `wsos_pto_policies` | WSOS | Core | PTO policy definitions per client (key-value pairs) |
| `wsos_ninety_day_checkins` | WSOS | Core | 90-day milestone check-in results (week 1, month 1, etc.) |
| `wsos_slack_support_tickets` | WSOS | Core | Slack support tracker entries |
| `wa_cs_staff` | WA | Extension | CS team members (Bel, Adrian, etc.) |
| `wa_onboarding_steps` | WA | Extension | Onboarding checklist — 31+ steps per OP, per owner |
| `wa_post_90day_checkin_schedule` | WA | Extension | Long-term check-in schedule (3-month, 6-month, 1-year, etc.) |
| `wa_client_requests` | WA | Extension | Client request report entries |
| `wa_red_flags` | WA | Extension | Red flag lookup library |
| `wa_existing_accounts` | WA | Extension | Existing accounts tracking |
| `wa_cell_formatting` | WA | Cross-cutting | Cell background colors from original sheets (green=scheduled, etc.) |

### Prefix Convention

- **`wsos_`** — Maps to a WSOS platform table (data can be pushed to WSOS API)
- **`wa_`** — WeAssist-exclusive (no WSOS equivalent, purely our extension)

### WSOS Crosswalk

See `after-sales/schema/wsos-crosswalk.md` for the detailed column-by-column mapping between our SQLite tables and WSOS PostgreSQL tables.

**Migration verdict per table:**
- `wsos_ops` → `public.ops` — MAP (structural diff: split name vs full_name)
- `wsos_clients` → `public.clients` — MAP (3 of 22 WSOS columns populated)
- `wsos_op_client_assignments` → `public.engagements` + `client_op_contracts` — SPLIT MAP
- `wsos_pto_policies` → `public.timeoff_policies` — RESTRUCTURE needed
- All `wa_*` tables — PURE GAP (no WSOS equivalent, entirely WA extension)

### TEMP Decisions

12 ambiguous column interpretations are documented in `after-sales/schema/TEMP_DECISIONS.md`. These were provisional best-guesses made on 2026-05-10, pending Bell/Michelle confirmation (expected Tue 2026-05-12).

**To verify all TEMP markers:**
```bash
rg "TEMP:" apps/wsos-extension/   # Find all build-time assumptions
rg "TEMP:" after-sales/            # Find all schema assumptions
```

---

## Data Pipeline

```
Google Sheets API → extract-sheets.ts → JSON files → build-sqlite.ts → wsos-extension.db
                                                                              ↓
                                                                     Hono serves it
```

1. **extract-sheets.ts** — Authenticates via Google OAuth, pulls all 3 source sheets (OP Masterlist, After Sales Checklist, OP Reporting) → saves as JSON in `secrets/extracted/`
2. **build-sqlite.ts** — Reads extracted JSON → creates/updates SQLite tables with normalized schema → `data/wsos-extension.db`
3. **Hono server** — Reads from the SQLite DB on every request (read-only for now)

### Rebuilding the Database

```bash
cd apps/wsos-extension
bun run scripts/build-db.ts   # (future: wraps extract + build)
```

### Encrypted Backup

Sensitive data (credentials, token, extracted JSON, DB) is encrypted to `secrets-enc/` using AES-256-GCM + PBKDF2. Passphrase stored via Windows DPAPI.

- Decrypt: `bun run scripts/decrypt-secret.ts`
- Encrypt: `bun run scripts/encrypt-secret.ts`

---

## Adding a New Department Module

### Step-by-step

1. **Study the workflow** — Watch Loom videos, review OCR extracts in `after-sales/belinda-video/` and `after-sales/michelle-video/` for the pattern
2. **Define types** — Add interfaces to `src/types/index.ts`
3. **Write queries** — Create `src/db/queries/<module>.ts` with all data access functions
4. **Create views** — Write `src/views/pages/<Module>.tsx` with Hono JSX
5. **Create routes** — Write `src/routes/<module>.tsx` with Hono router
6. **Mount in app.ts** — Add route to the Hono app
7. **Add to sidebar** — Add nav item in `src/views/layout.tsx`
8. **Write tests** — Add smoke tests to `tests/smoke-test.spec.ts`
9. **Update this doc** — Add module to the docs

### Conventions

- **File naming**: Kebab-case for directories, PascalCase for components
- **Query functions**: Named exports, each function does one thing
- **Route handlers**: Thin — query data, pass to view, return HTML
- **Views**: Pure rendering — no data access, no business logic
- **Types**: Shared interfaces in `src/types/index.ts`, no type duplication

---

## Deployment

### Local Development

```bash
cd apps/wsos-extension
bun install
bun run dev              # Watch mode — restarts on file change
bun test                 # Run smoke tests
```

### Production (VPS)

```bash
# Build standalone binary
bun run build

# Result: dist/wsos-extension.exe (single file, ~80MB)

# Deploy to VPS
scp dist/wsos-extension.exe user@vps:/opt/services/wsos-extension/
scp data/wsos-extension.db user@vps:/opt/services/wsos-extension/data/

# systemd service
cat > /etc/systemd/system/wsos-extension.service << 'EOF'
[Unit]
Description=WSOS Extension
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/opt/services/wsos-extension
ExecStart=/opt/services/wsos-extension/wsos-extension
Restart=always
RestartSec=5
MemoryHigh=400M
MemoryMax=500M

[Install]
WantedBy=multi-user.target
EOF

# Expose via Cloudflare Tunnel
# cloudflared tunnel route --hostname wsos.weassist.io http://localhost:3000
```

---

## Testing

### Smoke Tests (bun:test)

```bash
# Start the server first (in another terminal)
bun run src/index.ts

# Run tests
bun test
```

### Manual Testing

```bash
# Check all routes respond
curl -I http://localhost:3000/
curl -I http://localhost:3000/ops
curl -I http://localhost:3000/clients
curl -I http://localhost:3000/onboarding
curl -I http://localhost:3000/checkins
curl -I http://localhost:3000/schedule
curl -I http://localhost:3000/red-flags
curl -I http://localhost:3000/existing-accounts
```

---

## Future Roadmap

### Short-term (After-Sales MVP)
- [x] Schema and data model
- [x] All 12 TEMP decisions documented
- [x] Basic CRUD views for all after-sales data
- [ ] Bell/Michelle confirm TEMP decisions (Tue 2026-05-12)
- [ ] Write-back capability (update check-in status, mark steps done)
- [ ] Auth (simple passphrase gate)

### Medium-term
- [ ] WSOS API sync service (bidirectional)
- [ ] n8n integration for automated notifications
- [ ] Email/Slack alerts for overdue check-ins
- [ ] ClickUp recruiting pipeline view (if access granted)

### Long-term
- [ ] Additional department modules (Recruiting, HR, etc.)
- [ ] Role-based access control
- [ ] Audit logging
- [ ] Export/reporting engine
- [ ] Migration to PostgreSQL (if scale requires it)
