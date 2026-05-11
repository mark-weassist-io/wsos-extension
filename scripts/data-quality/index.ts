import type { EntityQualityRules, VerificationReport } from "./types"
import type { VerificationViolation, ViolationType } from "./types"
import { CANONICAL_FIELDS, FIELD_ALIASES } from "./types"
import { OPS_RULES } from "./ops-rules"
import { CLIENTS_RULES } from "./clients-rules"
import { ASSIGNMENTS_RULES } from "./assignments-rules"
import { ONBOARDING_RULES } from "./onboarding-rules"
import { CHECKINS_RULES, SCHEDULE_RULES } from "./checkins-rules"
import { OB_STEPS_RULES, OB_RECORDS_RULES, OB_STATUSES_RULES } from "./ob-rules"
import { Database } from "bun:sqlite"

export type { EntityQualityRules }
export { OPS_RULES, CLIENTS_RULES, ASSIGNMENTS_RULES, ONBOARDING_RULES, CHECKINS_RULES, SCHEDULE_RULES }

export const ALL_RULES: Record<string, EntityQualityRules> = {
  wsos_ops: OPS_RULES,
  wsos_clients: CLIENTS_RULES,
  wsos_op_client_assignments: ASSIGNMENTS_RULES,
  wa_ob_step_defs: OB_STEPS_RULES,
  wa_ob_records: OB_RECORDS_RULES,
  wa_ob_statuses: OB_STATUSES_RULES,
  // wa_onboarding_steps: ONBOARDING_RULES, -- replaced by ob model
  wsos_ninety_day_checkins: CHECKINS_RULES,
  wa_post_90day_schedule: SCHEDULE_RULES,
}

export function verifyDatabase(db: Database): VerificationReport {
  const report: VerificationReport = {
    passed: true,
    timestamp: new Date().toISOString(),
    entities: {},
    summary: { total_violations: 0, entities_checked: 0, entities_passed: 0 },
  }

  // --- Collect all table columns for normalization checks ---
  const allTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[]
  const tableCols: Record<string, string[]> = {}
  for (const t of allTables) {
    const cols = db.prepare(`PRAGMA table_info("${t.name}")`).all() as { name: string }[]
    tableCols[t.name] = cols.map(c => c.name)
  }

  // Normalization check: find columns that should be derived via FK instead of stored
  // Skip natural key columns used as FKs everywhere
  const skipNorm = new Set(["id", "created_at", "deleted_at", "source_tab", "rowid", "op_name", "status", "full_name", "assigned_cs", "notes", "name"])
  const globalColCounts: Record<string, string[]> = {}
  for (const [t, cols] of Object.entries(tableCols)) {
    for (const col of cols) {
      if (skipNorm.has(col)) continue
      if (!globalColCounts[col]) globalColCounts[col] = []
      globalColCounts[col].push(t)
    }
  }

  // Per-entity normalization violations: check derived fields from rules
  const normViolations: Record<string, VerificationViolation[]> = {}
  for (const [entity, rules] of Object.entries(ALL_RULES)) {
    const derived = rules.normalization?.derived || []
    for (const d of derived) {
      // Check if this table actually has the column (should be removed)
      const hasCol = tableCols[entity]?.includes(d.field)
      if (hasCol) {
        // Before flagging, check if ALL non-null values match the canonical source
        // If they diverge, the column preserves historical data — don't flag as removable
        const sourceTable = d.source_table
        const sourceField = d.source_field
        const mismatches = db.prepare(`
          SELECT COUNT(*) as c FROM "${entity}" e
          JOIN "${sourceTable}" s ON e.op_name = s.${sourceField.includes("op_name") ? "op_name" : "op_name"}
          WHERE e."${d.field}" IS NOT NULL
          AND e."${d.field}" != ''
          AND e."${d.field}" != s."${sourceField}"
          LIMIT 1
        `).get() as any

        const isHistorical = mismatches?.c > 0
        normViolations[entity] = normViolations[entity] || []
        if (isHistorical) {
          normViolations[entity].push({
            type: "canonical_violation", entity, field: d.field,
            expected: `all values match ${sourceTable}.${sourceField}`,
            actual: `some values diverge — column preserves historical data`,
          })
        } else {
          normViolations[entity].push({
            type: "denormalized", entity, field: d.field,
            expected: `derive from ${sourceTable}.${sourceField} via JOIN`,
            actual: `stored directly in ${entity}.${d.field}`,
          })
        }
      }
    }
  }

  for (const [entity, rules] of Object.entries(ALL_RULES)) {
    report.summary.entities_checked++
    const violations: VerificationViolation[] = []

    // Add normalization violations
    if (normViolations[entity]) violations.push(...normViolations[entity])

    const tableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(entity)
    if (!tableExists) {
      violations.push({
        type: "missing_required",
        entity, key: entity,
        expected: `table ${entity} to exist`, actual: "table not found",
      })
      report.entities[entity] = { total_rows: 0, passed: false, violations, completeness: {} }
      report.summary.total_violations += violations.length
      continue
    }

    const rows = db.prepare(`SELECT * FROM "${entity}"`).all() as any[]
    const totalRows = rows.length

    const completeness: Record<string, number> = {}
    // Calculate completeness for fields in the 'fields' rule
    for (const [field] of Object.entries(rules.data.fields)) {
      const filled = rows.filter((r: any) => r[field] !== null && r[field] !== undefined && r[field] !== "").length
      completeness[field] = totalRows > 0 ? filled / totalRows : 0
    }
    // Also calculate for fields in completeness_target that aren't in fields
    for (const [field] of Object.entries(rules.data.completeness_target)) {
      if (completeness[field] === undefined) {
        const filled = rows.filter((r: any) => r[field] !== null && r[field] !== undefined && r[field] !== "").length
        completeness[field] = totalRows > 0 ? filled / totalRows : 0
      }
    }

    for (const field of rules.data.required) {
      for (const row of rows) {
        if (row[field] === null || row[field] === undefined || row[field] === "") {
          violations.push({
            type: "missing_required", entity,
            row_id: row.id, field,
            expected: "non-null", actual: "null",
          })
          report.passed = false
        }
      }
    }

    for (const keyDef of (rules.data.unique || [])) {
      const keys = Array.isArray(keyDef) ? keyDef : [keyDef]
      if (keys.length === 0) continue
      const groupKey = keys.join(" || '|' || ")
      const dupes = db.prepare(`
        SELECT ${groupKey} as k, COUNT(*) as c FROM "${entity}"
        GROUP BY ${groupKey} HAVING c > 1
      `).all() as any[]
      for (const d of dupes) {
        violations.push({
          type: "duplicate", entity, key: String(d.k),
          expected: "unique", actual: `${d.c}x duplicates`,
        })
        report.passed = false
      }
    }

    if (rules.data.domain) {
      for (const [field, allowed] of Object.entries(rules.data.domain)) {
        const placeholders = allowed.map(() => "?").join(",")
        const bad = db.prepare(`
          SELECT DISTINCT "${field}" as val FROM "${entity}"
          WHERE "${field}" IS NOT NULL AND "${field}" NOT IN (${placeholders})
        `).all(...allowed) as any[]
        for (const b of bad) {
          violations.push({
            type: "domain", entity, field,
            value: String(b.val),
            expected: `one of [${allowed.join(", ")}]`, actual: String(b.val),
          })
          report.passed = false
        }
      }
    }

    if (rules.data.fk) {
      for (const [field, ref] of Object.entries(rules.data.fk)) {
        const orphans = db.prepare(`
          SELECT DISTINCT a."${field}" as val FROM "${entity}" a
          LEFT JOIN "${ref.ref}" b ON a."${field}" = b."${ref.field}"
          WHERE a."${field}" IS NOT NULL AND b."${ref.field}" IS NULL
          LIMIT 20
        `).all() as any[]
        for (const o of orphans) {
          violations.push({
            type: "fk_missing", entity, field,
            value: String(o.val),
            expected: `exists in ${ref.ref}.${ref.field}`, actual: "orphan",
          })
          report.passed = false
        }
      }
    }

    for (const [field, target] of Object.entries(rules.data.completeness_target)) {
      const actual = completeness[field] ?? 0
      if (actual < target) {
        violations.push({
          type: "completeness_below_target", entity, field,
          expected: `${(target * 100).toFixed(0)}%`, actual: `${(actual * 100).toFixed(0)}%`,
        })
        report.passed = false
      }
    }

    for (const [field, rule] of Object.entries(rules.data.fields)) {
      if (rule.pattern) {
        const bad = db.prepare(`
          SELECT id, "${field}" as val FROM "${entity}"
          WHERE "${field}" IS NOT NULL AND "${field}" != ''
          LIMIT 10
        `).all() as any[]
        for (const b of bad) {
          if (typeof b.val === "string" && !rule.pattern.test(b.val)) {
            violations.push({
              type: "pattern_mismatch", entity, row_id: b.id, field,
              value: String(b.val),
              expected: `matches pattern`, actual: String(b.val).substring(0, 50),
            })
            report.passed = false
          }
        }
      }
    }

    report.entities[entity] = {
      total_rows: totalRows,
      passed: violations.length === 0,
      violations,
      completeness,
    }
    report.summary.total_violations += violations.length
    if (violations.length === 0) report.summary.entities_passed++
  }

  if (report.summary.total_violations > 0) report.passed = false
  return report
}

export function printReport(report: VerificationReport): void {
  console.log("\n" + "=".repeat(60))
  console.log(`DATA QUALITY VERIFICATION REPORT`)
  console.log(`Timestamp: ${report.timestamp}`)
  console.log(`Overall: ${report.passed ? "PASSED" : "FAILED"}`)
  console.log("=".repeat(60))

  for (const [entity, info] of Object.entries(report.entities)) {
    console.log(`\n-- ${entity} (${info.total_rows} rows) ${info.passed ? "OK" : "FAIL"} --`)

    for (const [field, pct] of Object.entries(info.completeness)) {
      const bar = "#".repeat(Math.round(pct * 20)) + ".".repeat(Math.round((1 - pct) * 20))
      console.log(`  ${field}: [${bar}] ${(pct * 100).toFixed(0)}%`)
    }

    if (info.violations.length > 0) {
      console.log(`\n  Violations (${info.violations.length}):`)
      for (const v of info.violations.slice(0, 15)) {
        const loc = v.row_id ? `[row ${v.row_id}]` : v.key ? `[${v.key}]` : ""
        console.log(`    ${v.type} ${loc}${v.field ? ` ${v.field}` : ""}: want ${v.expected}, got ${v.actual}`)
      }
      if (info.violations.length > 15) {
        console.log(`    ... and ${info.violations.length - 15} more`)
      }
    }
  }

  console.log("\n" + "=".repeat(60))
  console.log(`Total violations: ${report.summary.total_violations}`)
  console.log(`Entities: ${report.summary.entities_passed}/${report.summary.entities_checked} passed`)
}
