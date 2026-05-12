# Nexus — Architecture & Stack Decisions

## What This Is

An internal operations tool for WeAssist. Tracks OPs (outsourced professionals),
clients, assignments, onboarding steps, check-in schedules, and CS staff workload.
~200 active OPs across multiple clients. Used daily by Bel, Michelle, Adrian,
Dennis, and others.

## The Stack

| Layer | Choice | Why Not Something Else |
|-------|--------|-----------------------|
| Server | **Hono** (TypeScript) | Lightest TS web framework. Runs on Bun, Node, Deno, Workers. Zero config. |
| Rendering | **Hono JSX** | Server-rendered HTML. No client JS framework. No hydration. No bundle. |
| Interactivity | **HTMX** | Server-driven UI. No build step. No virtual DOM. No state management. |
| Database | **SQLite** via `bun:sqlite` | Zero infrastructure. File-based. Fast enough for 200 OPs. Portable. |
| ORM | **Drizzle** | Type-safe SQL. No migration hell. Can swap to Postgres with an import change. |
| Styling | **CSS Custom Properties** | Zero runtime. Zero build step. Theme-swappable. No CSS-in-JS overhead. |

## The Philosophy

### 1. Server-rendered HTML first

The page renders fully formed on the server. JS is not required to display data.
HTMX adds interactivity (toggles, pagination, search) without writing JS.
The entire JS budget is **HTMX itself: ~14KB gzipped**. Zero React, zero Svelte,
zero Vue, zero build step.

Compare to a typical React dashboard: 200-400KB gzipped before a single line
of app code runs, plus a build step, plus hydration mismatches.

**Why this matters for an internal tool:** Page load time is the #1 UX metric.
Internal tools are used all day, every day. Every millisecond of JS parsing
time is wasted time. There is no consumer-facing SEO or code-splitting
requirement. The simplest stack that renders HTML is the best stack.

### 2. SQLite is enough

~200 OPs, ~1000 milestones, ~10000 status entries. SQLite handles this with
zero tuning. No Postgres server to maintain. No connection pooling. No backup
scripts. The database is a single file that can be backed up by copying it.

**When it won't be enough:** When concurrent writes exceed ~50/second, or the
dataset exceeds ~100GB. At that point the business likely has dedicated
infrastructure budget. Until then, SQLite is the most reliable database in
existence with the lowest operational cost.

### 3. CSS custom properties, not a framework

The `:root` block defines ~40 tokens. Every pixel of the app references
`var(--*)`. Changing the brand to a different blue means changing ONE line.

A CSS framework (Tailwind, Bootstrap) would add a build step and lock us into
utility classes. A component library (shadcn, MUI) would require React.

Our own component library (Button, InputField, SelectField, pills) is ~50 lines
of CSS + ~50 lines of Hono JSX. Zero dependencies. Zero build step.

## The Temptations to Resist

### "Let's use React"

You'll hear this when someone wants to add a date picker, a modal, or "reusable
components." The trap: React requires a client-side JS bundle, hydration, state
management, and a build step. Every new feature becomes "install another
package." The app becomes heavier and slower for every feature added.

**HTMX alternative:** HTMX handles modals (`hx-target` + `hx-swap`), date
pickers (input `type="date"`), toggles, search, pagination, infinite scroll,
inline editing — all with server-rendered HTML. No JS required.

### "Let's use shadcn"

shadcn is beautiful. It's also React-only. Adopting it means rewriting the
entire app in React. Every component becomes a React component with client-side
state. An internal tool with 10 pages and 30 tables becomes a "React app" with
all the complexity that entails.

**What we lose:** 14KB JS budget → 300KB+. Instant page loads → hydration
delays. Write HTML → write JSX + React hooks. No build step → Vite/Next.js.
File-based routing → router configuration.

**What we gain:** Pre-built buttons. It's not worth it.

### "Let's use Tailwind"

Tailwind is excellent for prototyping. For a maintained app, it creates
unreadable templates and couples styling to utility classes. CSS custom
properties are more maintainable and themeable without a build step.

### "Let's move to Postgres"

Useful when SQLite becomes a bottleneck. The migration path is smooth:
Drizzle ORM abstracts the database. Swap the import, change the connection
string, run the migration. Everything else stays the same.

**Don't do this preemptively.** SQLite handles this dataset fine.

### "Let's add authentication middleware"

The app is on a local VPN. Adding OAuth, session management, and login pages
adds complexity with zero security benefit for a local-only tool. If the app
goes public, add auth then.

## The Real Risks

These are the things that will actually cause problems:

1. **No tests.** The app has zero automated tests. A refactor breaks things.
2. **Hardcoded values.** The Google Sheets credentials, sheet IDs, and file
   paths should be configurable, not hardcoded in build-db.ts.
3. **Import pipeline fragility.** The build-db.ts script assumes a specific
   sheet structure. If the sheet changes, the import breaks silently.
4. **Duplicate records.** The ob_records table has duplicates per OP/client
   (one per CS staff). This is a data model issue that causes confusing UI.

These are worth fixing. Rewriting in React is not.

## When to Re-Evaluate

- **When SQLite starts struggling** (>50 concurrent writes, >100GB data)
- **When the team grows** and needs a component library with documentation
- **When the app needs to be public** and auth/add-tenancy is required
- **When HTMX stops being maintained** (unlikely — it's more active than ever)

Until then, the stack is the right stack. Simple, fast, zero-dependency,
maintainable by one person.
