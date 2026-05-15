# Nexus — Architecture

> All general conventions (FK-in-Form rule, soft delete pattern, validation flow, error handling, layout templates) are defined in the `workflow-for-designing-and-building-software-systems` skill. This document covers only what is specific to Nexus.

## What This Is

Nexus is WeAssist's internal operations platform for after-sales management. Tracks ~200 OPs across ~100 clients with assignments, onboarding, check-in schedules, red flags, and reviews. Built with Bun + Hono JSX + Drizzle + SQLite + HTMX. Zero client JS framework.

**Platform status**: Evolving from Workstack data viewer into a standalone platform. Workstack hosts internal team temporarily; data import into Workstack is manual. Priority is full CRUD coverage across all entities.

## Entity Tables (Nexus-Specific)

| Table | Rows | Purpose |
|-------|------|---------|
| `wsos_ops` | 218 | Outsource Professionals |
| `wsos_clients` | 107 | Client companies |
| `wsos_op_client_assignments` | 237 | OP↔Client relationship |
| `wsos_ninety_day_checkins` | 174 | 90-day check-in results |
| `wa_post_90day_schedule` | 174 | Post-90-day schedule |
| `checkin_milestones` | 1425 | Per-milestone status |
| `wa_ob_records` | 124 | Onboarding records |
| `wa_ob_step_defs` | 26 | Step templates |
| `wa_ob_statuses` | 2850 | Per-step completion |
| `wa_red_flags` | 6 | Red flag catalog |
| `wa_existing_accounts` | 0 | Pre-existing accounts |
| `wa_cs_staff` | 4 | Legacy CS staff |
| `nexus_users` | 7 | Auth users |
| `wsos_op_phones` | 218 | OP phone numbers |
| `wa_assignment_statuses` | 5 | Status reference |
| `wa_assignment_types` | 3 | Type reference |
| `op_checkin_reviews` | 69 | Review flags |

## Relationship Map

```
wsos_ops ──┬── assignments (op_name) ──┬── wsos_clients (client_name)
            │                            ├── wa_cs_staff (assigned_cs)
            │                            └── wa_assignment_statuses (status)
            ├── ninety_day_checkins (op_name) ── assignments (LEFT JOIN for client_name, assigned_cs)
            ├── op_phones (op_name, 1:N)
            ├── ob_records (op_name)
            ├── post_90day_schedule (op_name)
            └── checkin_milestones (op_name via WA)

wsos_clients ──┬── assignments (client_name)
                ├── existing_accounts (client_name)
                └── ob_records (client_name)

ob_records ── ob_statuses (record_id)
ob_statuses ── ob_step_defs (step_def_id)
```

## Route Registration

All entity routes register in `src/app.ts` under `authMiddleware`:

```ts
app.route("/ops", opsRouter)
app.route("/clients", clientsRouter)
app.route("/assignments", assignmentsRouter)
app.route("/checkins", checkinsRouter)
app.route("/onboarding", onboardingRouter)
app.route("/schedule", scheduleRouter)
app.route("/cs-staff", csStaffRouter)
app.route("/red-flags", redFlagsRouter)
app.route("/existing-accounts", existingAccountsRouter)
app.route("/reviews", reviewsRouter)
```

`src/index.ts` handles only: cookie-based auth check, user seeding, and `app.fetch(req)` delegation. No raw-HTML routes remain.

## Per-Entity Compliance

| Entity | FK-in-Form | Soft Delete | Validation Re-render | Route File |
|--------|------------|-------------|---------------------|-----------|
| OPs | ✅ | ✅ | ✅ | `routes/ops.tsx` |
| Clients | ✅ | ✅ | ✅ | `routes/clients.tsx` |
| Assignments | ✅ | ✅ | ✅ (fixed this session) | `routes/assignments.tsx` |
| Checkins | ✅ | ✅ | ✅ | `routes/checkins.tsx` |
| Red Flags | ✅ | ✅ | ✅ | `routes/red-flags.tsx` |
| Users | ✅ | ✅ | ✅ | `routes/cs-staff.tsx` |
| Existing Accounts | ✅ | ✅ | ✅ | `routes/existing-accounts.tsx` |
| OB Records | ✅ (detail) | — | — (HTMX) | `routes/onboarding.tsx` |
| Schedule | ✅ (inline) | — | — (HTMX) | `routes/schedule.tsx` |
| Reviews | ✅ (inline) | — | — (HTMX) | `routes/reviews.tsx` |

## Nexus-Specific Deviations From Skill

1. **Text-based FK joins**: `wsos_ops` and `wsos_clients` use `full_name`/`name` as join keys (legacy from Google Sheets). New tables use numeric IDs.
2. **OP form FK persistence**: Uses `upsertOpAssignment()` to create/update assignment row alongside OP. Assignment fields (client, role, status, cs) live in assignment table, not ops table.
3. **Onboarding detail**: Mixed HTMX step toggles + inline form for metadata fields. No traditional create/edit page pattern.
4. **Schedule & Reviews**: Fully HTMX-driven — no full-page forms. Milestone status toggles and flag picks via inline editors.
5. **Rate field**: Stored as text (e.g., "$4/hour") across ops and assignments. Not a number column — allows mixed format from source data.
6. **Phones 1:N**: `wsos_op_phones` stores multiple phone numbers per OP. Only the primary phone appears in the OP form; additional phones are neither displayed nor editable.
