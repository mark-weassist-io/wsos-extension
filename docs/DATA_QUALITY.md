# Data Quality Framework

**Problem:** Multiple Google Sheet sources (DON'T EDIT, Form Responses 1, Michelle Onboarding, Dennis Onboarding) describe the same real-world entities (OPs, Clients, Assignments) with overlapping, conflicting, and duplicated data.

**Current state:** 361 OP rows → only 221 unique people. 361 client rows → only 113 unique clients. 239/361 OPs missing email. DON'T EDIT itself has triplicate rows for the same OP.

**Goal:** A self-verifying pipeline that provably guarantees every record is clean, deduplicated, and internally consistent — and catches its own bugs automatically.

---

## Architecture

```
extract-sheets.ts → raw JSON → merge-dedup.ts → clean JSON → build-db.ts → SQLite DB
                                      ↑                            ↓
                              quality-rules.ts              verify-db.ts
                              (defines the contract)        (enforces the contract)
                                                                  ↓
                                                           violations == 0?
                                                           /              \
                                                          yes             no
                                                           |               |
                                                     deploy/push    fix merge-dedup
                                                                          |
                                                                  re-run pipeline
```

### Key Principle: Contract-First

The quality rules ARE the contract. Before any data is merged, every entity has an explicit specification:

1. **Required fields** — must be non-null
2. **Uniqueness constraints** — no duplicates allowed
3. **Domain constraints** — values must be from an allowed set
4. **Cross-entity integrity** — FKs must resolve
5. **Source priority** — which source wins for each field
6. **Completeness threshold** — what % of records must have each field

---

## The Framework (4 Layers)

### Layer 1: Quality Rules (`scripts/data-quality/`)

Every entity has a **rule file** that declares its contract:

#### `ops-rules.ts`
```typescript
export const OP_RULES = {
  required: ["full_name"],
  unique: ["full_name"],           // Every OP must have a distinct name
  fields: {
    full_name: { type: "string", minLength: 1 },
    email: { type: "string", pattern: /.*@.*/, required: false },
    phone: { type: "string", required: false },
    zip_code: { type: "string", pattern: /^\d{4}$/, required: false },
    dob: { type: "date", required: false },
  },
  source_priority: {
    DON_T_EDIT: ["full_name", "phone", "address", "gender", "zip_code"],
    FORM_RESPONSES: ["email", "dob", "nickname"],
  },
  completeness_target: {
    email: 0.85,   // 85% of OPs should have email
    phone: 0.95,   // 95% should have phone
  },
}
```

#### `clients-rules.ts`
```typescript
export const CLIENT_RULES = {
  required: ["name"],
  unique: ["name"],
  source_priority: {
    DON_T_EDIT: ["name", "email"],        // DON'T EDIT is canonical
    FORM_RESPONSES: ["email"],            // Form Responses supplements email
  },
  dedup: {
    // DON'T EDIT has 1 row per OP, so client repeats. Collapse to unique.
    collapse_key: "name",
    merge_fields: ["email"],
  },
  completeness_target: {
    email: 0.60,
  },
}
```

#### `assignments-rules.ts`
```typescript
export const ASSIGNMENT_RULES = {
  required: ["op_name", "client_name"],
  unique: [["op_name", "client_name"]],    // One assignment per OP+Client
  fk: {
    op_name: { ref: "wsos_ops", field: "full_name" },
    client_name: { ref: "wsos_clients", field: "name" },
  },
  domain: {
    type: ["Full-Time", "Part-Time", "6 Hours", "6-hours"],
    status: ["Active", "Probation", "Inactive", "Separated", "Resigned"],
  },
  source_priority: {
    DON_T_EDIT: ["op_name", "client_name", "role", "status", "type",
                 "start_date", "end_date", "working_days", "working_hours",
                 "assigned_cs", "department"],
    FORM_RESPONSES: ["rate"],  // Rate might come from onboarding sheet
  },
}
```

---

### Layer 2: Merge Engine (`scripts/merge-dedup.ts`)

The merge engine takes raw JSON from `extract-sheets.ts` and produces clean, deduplicated JSON.

```typescript
interface MergeEngine {
  // For each entity type:
  mergeOps(raw: RawSheetData[]): CleanOp[]
  mergeClients(raw: RawSheetData[]): CleanClient[]
  mergeAssignments(raw: RawSheetData[]): CleanAssignment[]
  mergeOnboarding(raw: RawSheetData[]): CleanOnboardingStep[]
  
  // Internal:
  groupByKey(rows: Row[], key: string): Map<string, Row[]>
  applySourcePriority(groups: Map, rules: SourcePriorityRules): CleanRow[]
  fillNulls(canonical: Row, supplemental: Row, fields: string[]): Row
  resolveConflicts(a: Row, b: Row, strategy: ConflictStrategy): Row
}
```

**Merge strategy for each entity:**

#### OPs
```
1. Group all rows by full_name
2. For each group:
   a. Find the DON'T EDIT row(s) — this is the canonical base
   b. If multiple DON'T EDIT rows for same OP → merge them (same source, fill gaps)
   c. Find the Form Responses row(s) — this supplements
   d. Apply field-level source priority:
      - full_name, phone, address, gender, zip_code → DON'T EDIT wins
      - email, dob, nickname → Form Responses wins (more complete)
      - If both have a value → DON'T EDIT wins (canonical)
      - If only one has a value → use that value
3. Output: 1 row per unique full_name
```

#### Clients
```
1. Group all rows by name
2. DON'T EDIT has 1 row per OP, so same client has N rows
3. Collapse to 1 row per client name
4. Merge email: prefer DON'T EDIT email, fall back to Form Responses
5. Output: 1 row per unique client name
```

#### Assignments
```
1. Group by (op_name, client_name)
2. DON'T EDIT is canonical for all fields
3. Form Responses fills gaps only
4. Output: 1 row per unique (op_name, client_name)
```

#### Onboarding
```
1. For OPs in BOTH Michelle and Dennis:
   - Union all steps
   - Same step name → merge (keep both statuses if different)
2. For OPs in only one → keep as-is
3. Normalize step names (trim, lowercase comparison)
```

---

### Layer 3: Verification Engine (`scripts/verify-db.ts`)

This is the **self-checking layer**. It runs after every DB build and checks every single row against every rule.

```typescript
interface VerificationReport {
  passed: boolean
  timestamp: string
  entities: {
    [entityName: string]: {
      total_rows: number
      violations: VerificationViolation[]
      completeness: { [field: string]: number }  // % filled
    }
  }
  summary: {
    total_violations: number
    entities_checked: number
    entities_passed: number
    entities_failed: number
  }
}

interface VerificationViolation {
  type: "missing_required" | "duplicate" | "fk_missing" | "domain_out_of_range" | "conflict_unresolved" | "completeness_below_threshold"
  entity: string
  row_id?: number
  key?: string
  field?: string
  expected: string
  actual: string
  severity: "error" | "warning"
}
```

**Verification checks run in order:**

1. **Required field check** — Every row has non-null required fields
2. **Uniqueness check** — No duplicates on unique keys
3. **Domain check** — Every value is in its allowed set
4. **FK integrity check** — Every foreign key resolves to a parent row
5. **Completeness check** — Every field meets its completeness threshold
6. **Cross-source conflict check** — No unresolved conflicts between sources

---

### Layer 4: Pipeline Gate (`scripts/build-db.ts`)

The build script becomes the **gate**:

```typescript
function buildPipeline(): void {
  // Step 1: Extract
  const raw = extractFromSheets()  // or load cached JSON
  
  // Step 2: Merge & Dedup
  const clean = {
    ops: mergeOps(raw.ops),
    clients: mergeClients(raw.clients),
    assignments: mergeAssignments(raw.assignments),
    onboarding: mergeOnboarding(raw.onboarding),
  }
  
  // Step 3: Build DB
  buildDatabase(clean)
  
  // Step 4: Verify — THIS IS THE GATE
  const report = verifyDatabase()
  
  if (report.summary.total_violations > 0) {
    console.error("DATA QUALITY GATE FAILED")
    printViolations(report)
    process.exit(1)  // ← DB is built but pipeline fails
  }
  
  console.log("✅ ALL DATA QUALITY CHECKS PASSED")
  console.log(`   ${report.summary.entities_checked} entities, 0 violations`)
}
```

---

## The Iteration Protocol

When the pipeline fails, here's the exact protocol:

```
1. Run: bun run scripts/build-db.ts
2. Pipeline fails with violations printed
3. Engineer reads violations, identifies pattern
4. Fix the merge logic in merge-dedup.ts (or quality-rules.ts if rule is wrong)
5. Re-run pipeline
6. Repeat until: "bun run scripts/build-db.ts" exits 0 with "ALL CHECKS PASSED"
7. Only then: commit and push
```

### Example Iteration

```
Iteration 1:
  FAIL: op_name "Ma. Shien Esclavia" has 5 duplicates
  Fix: DON'T EDIT has 3 rows for same OP → add intra-source dedup
  Re-run

Iteration 2:
  FAIL: client_name "Ryan McFarland" has 39 duplicates  
  Fix: Collapse clients by name, merge emails
  Re-run

Iteration 3:
  FAIL: op email completeness 33% < target 85%
  Fix: email priority → Form Responses wins (has more emails)
  Re-run

Iteration 4:
  ✅ ALL CHECKS PASSED
  Commit
```

---

## The Data Quality Dashboard

The app itself should expose quality metrics:

```typescript
// GET /api/quality
{
  last_build: "2026-05-10T16:00:00Z",
  checks_passed: true,
  totals: {
    ops: { total: 221, complete: 210, pct: 0.95 },
    clients: { total: 113, complete: 113, pct: 1.0 },
    assignments: { total: 237, complete: 237, pct: 1.0 },
  },
  completeness: {
    ops_email: { filled: 188, total: 221, pct: 0.85 },
    ops_phone: { filled: 210, total: 221, pct: 0.95 },
  }
}
```

This gives Mark and Bell/Michelle visibility into data health without having to dig.

---

## File Structure

```
apps/wsos-extension/
├── scripts/
│   ├── data-quality/
│   │   ├── index.ts          # Rule registry, run all checks
│   │   ├── ops-rules.ts      # OP quality contract
│   │   ├── clients-rules.ts   # Client quality contract
│   │   ├── assignments-rules.ts # Assignment quality contract
│   │   └── onboarding-rules.ts  # Onboarding quality contract
│   ├── merge-dedup.ts        # Merge engine (the brains)
│   ├── verify-db.ts          # Post-build verification
│   └── build-db.ts           # Pipeline gate (orchestrator)
├── docs/
│   └── DATA_QUALITY.md       # This file
```

---

## Implementation Order

| Step | What | Depends On |
|------|------|------------|
| 1 | Write quality rules for all 4 entities (ops, clients, assignments, onboarding) | — |
| 2 | Build merge engine — group, source-priority merge, null fill | Rules |
| 3 | Build verification engine — check every row against every rule | Rules |
| 4 | Wire pipeline gate — build-db.ts runs merge → build → verify → pass/fail | Merge + Verify |
| 5 | Iterate — run pipeline, fix violations, re-run, until 0 violations | All of above |
| 6 | Add quality dashboard endpoint to the app | Pipeline |
| 7 | Commit and push | All of above |
