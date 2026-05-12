import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"
import type { QualityRules } from "./data-quality/types"
import { OPS_RULES, CLIENTS_RULES, ASSIGNMENTS_RULES, ONBOARDING_RULES } from "./data-quality/index"

const ROOT = join(import.meta.dir, "..")
const RAW_DIR = join(ROOT, "..", "..", "secrets", "extracted")
const CLEAN_DIR = join(ROOT, "data", "clean")

function ensureCleanDir() {
  if (!existsSync(CLEAN_DIR)) mkdirSync(CLEAN_DIR, { recursive: true })
}

function loadRaw(filename: string): any {
  return JSON.parse(readFileSync(join(RAW_DIR, filename), "utf-8"))
}

// ============================================================
// Generic Merge Engine
// ============================================================

function normalizeStr(s: any): string {
  if (s === null || s === undefined) return ""
  return String(s).trim()
}

function isTruthy(s: any): boolean {
  const v = normalizeStr(s)
  return v !== "" && v !== "FALSE" && v !== "false" && v !== "0" && v !== "NO"
}

// Normalize MM/DD/YYYY or M/D/YYYY to YYYY-MM-DD ISO format
// ============================================================
// CANONICAL NAME MAPPINGS
// ============================================================
// When the same real-world entity appears under multiple name variants
// (e.g. "Ian Blair / Fastlane Drive" vs "Ian Blair / Laundry Sauce"),
// map the variant to the canonical name.
//
// TO ADD A NEW MAPPING: just add a new entry below and re-run the pipeline.
// The merge engine will apply it to ALL tables automatically.
//
// CONFIRMATION RULES:
// - Same person with/without middle name → COLLAPSE
// - Same person with "Jr." in different position → COLLAPSE
// - Same person running different businesses → COLLAPSE to person name
// - Different people sharing a first name → DO NOT collapse
// ============================================================

const OP_CANONICAL_MAP: Record<string, string> = {
  "Race Jay Venus Tubongbanua": "Race Jay Tubongbanua",
  "Arlyn Navalta Lindain": "Arlyn Lindain",
  "Wendell Jr. Cuarenta": "Wendell Cuarenta Jr.",
}

const CLIENT_CANONICAL_MAP: Record<string, string> = {
  // Ian Blair — same person, different service lines
  "Ian Blair / Fastlane Drive": "Ian Blair",
  "Ian Blair / Laundry Sauce": "Ian Blair",
  "Ian Blair / Mortal Munchies": "Ian Blair",
  // Raindrop Agency — same agency
  "Raindrop Agency / Eduardo Correa": "Raindrop Agency",
  // Zach Pappenhausen — name variations
  "Zach Papenhausen (Apollo Bath)": "Zach Papenhausen",
  "Zach Pappenhausen - Apollo Bath": "Zach Papenhausen",
  // Austin Blair / Laundry Sauce — different name order
  "Laundrysauce / Austin Blair": "Austin Blair/ Laundry Sauce",
}

// Field-level value normalization (typos, variations)
const FIELD_NORMALIZATIONS: Record<string, Record<string, string>> = {
  department: {
    "Client Success": "Client Services",
  },
}

function normalizeFieldValues(rows: any[], field: string): void {
  const map = FIELD_NORMALIZATIONS[field]
  if (!map) return
  for (const row of rows) {
    const val = row[field]
    if (val && map[val]) row[field] = map[val]
  }
}

function applyCanonicalNames(rows: any[], nameField: string, map?: Record<string, string>): void {
  const m = map || CLIENT_CANONICAL_MAP
  for (const row of rows) {
    const orig = row[nameField]
    if (orig && m[orig]) {
      row[nameField] = m[orig]
    }
  }
}

function normalizeDate(val: any): string {
  const s = normalizeStr(val)
  if (!s) return ""
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s
  // MM/DD/YYYY or M/D/YYYY
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) {
    const mm = m[1].padStart(2, "0")
    const dd = m[2].padStart(2, "0")
    return `${m[3]}-${mm}-${dd}`
  }
  // Not a recognizable date — return as-is (could be milestone label)
  return s
}

// Merge duplicates WITHIN the same source tab
function intraSourceDedup(rows: any[]): any[] {
  const seen = new Map<string, any>()
  for (const row of rows) {
    const key = normalizeStr(row.name || row.full_name || "")
    if (!key) continue
    if (!seen.has(key)) {
      seen.set(key, { ...row })
    } else {
      // Merge: prefer non-null values
      const existing = seen.get(key)
      for (const k of Object.keys(row)) {
        if ((!existing[k] || existing[k] === "") && row[k]) {
          existing[k] = row[k]
        }
      }
    }
  }
  return [...seen.values()]
}

// Group rows by identity key
function groupByIdentity(rows: any[], keyDef: string | string[]): Map<string, any[]> {
  const groups = new Map<string, any[]>()
  const keys = Array.isArray(keyDef) ? keyDef : [keyDef]
  
  for (const row of rows) {
    const key = keys.map(k => normalizeStr(row[k])).join("|||")
    if (!key || key.replace(/\|\|\|/g, "") === "") continue
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(row)
  }
  return groups
}

// Apply source priority: for each field, canonical source wins if it has a value,
// otherwise supplemental source fills gaps
function applySourcePriority(
  groups: Map<string, any[]>,
  sourcePriority: Record<string, string[]>,
  conflictResolution: Record<string, string>,
): any[] {
  const result: any[] = []

  // Determine source order (first source listed is lowest priority, last is highest)
  const sourceOrder = Object.keys(sourcePriority)
  // Reverse so first source listed has highest priority for its fields
  // Actually: DON_T_EDIT listed first = canonical. We want canonical to win.
  // So we process in reverse: supplemental first, then canonical overwrites

  for (const [key, rows] of groups) {
    const merged: any = {}

    // First pass: supplemental sources fill gaps
    // Second pass: canonical sources overwrite
    for (const pass of ["supplement_first", "canonical_overwrite"]) {
      for (const src of sourceOrder) {
        const fields = sourcePriority[src]
    const srcRow = rows.find(r => {
      const tab = normalizeStr(r.source_tab || r._sourceTab || "").toLowerCase().replace(/ \d+$/, "")
      const srcName = src.replace(/_/g, " ").replace("DON T", "DON'T").toLowerCase()
      return tab === srcName || tab.includes(srcName) || srcName.includes(tab)
    })
        if (!srcRow) continue

        const isCanonical = src === sourceOrder[0] // first listed = canonical

        for (const field of fields) {
          const val = srcRow[field]
          const strategy = conflictResolution[field] || "canonical_wins"

          if (pass === "supplement_first" && !isCanonical) {
            // Supplemental fills gaps only
            if ((merged[field] === undefined || merged[field] === null || merged[field] === "") && val !== null && val !== undefined && val !== "") {
              merged[field] = val
            }
          } else if (pass === "canonical_overwrite" && isCanonical) {
            // Canonical overwrites everything
            if (val !== null && val !== undefined && val !== "") {
              merged[field] = val
            }
          } else if (strategy === "supplemental_wins" && isCanonical === false) {
            // Special: some fields prefer supplemental even when canonical has value
            if (val !== null && val !== undefined && val !== "") {
              merged[field] = val
            }
          }
        }
      }
    }

    // Fill in remaining fields from any source
    for (const row of rows) {
      for (const [k, v] of Object.entries(row)) {
        if (merged[k] === undefined || merged[k] === null) {
          merged[k] = v
        }
      }
    }

    result.push(merged)
  }

  return result
}

// Collapse: group by collapse key, merge fields across rows
function collapseGroup(
  rows: any[],
  collapse: { group_by: string[]; merge: Record<string, string> },
): any[] {
  const groups = new Map<string, any[]>()
  for (const row of rows) {
    const key = collapse.group_by.map(k => normalizeStr(row[k])).join("|||")
    if (!key || key.replace(/\|\|\|/g, "") === "") continue
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(row)
  }

  const result: any[] = []
  for (const [, group] of groups) {
    const merged: any = { ...group[0] }
    for (let i = 1; i < group.length; i++) {
      for (const [field, strategy] of Object.entries(collapse.merge)) {
        const val = group[i][field]
        if (strategy === "take_first_non_null") {
          if ((!merged[field] || merged[field] === "") && val) {
            merged[field] = val
          }
        }
      }
    }
    result.push(merged)
  }
  return result
}

// ============================================================
// Entity-specific extractors
// ============================================================

// Extract ops from DON'T EDIT and Form Responses tabs
function extractOpsRows(masterlist: any): any[] {
  const rows: any[] = []
  const tabNames = ["DON'T EDIT", "Form Responses 1"]

  for (const tabName of tabNames) {
    const tab = masterlist.tabs?.[tabName]
    if (!tab?.formatted) continue
    const h = tab.formatted[0] as string[]
    if (!h) continue

    const col = (label: string) => {
      const idx = h.findIndex((c: string) => c.replace(/[:\s]/g, "").toLowerCase() === label.toLowerCase().replace(/[:\s]/g, ""))
      return idx >= 0 ? idx : h.findIndex((c: string) => c.toLowerCase().includes(label.toLowerCase()))
    }

    for (let r = 1; r < tab.formatted.length; r++) {
      const row = tab.formatted[r]
      const name = normalizeStr(row[col("Resource Name")] || row[0])
      if (!name) continue
      // "Date of Birth" column is actually birth place (stores city names, not dates)
      const birthPlace = normalizeStr(row[col("Date of Birth")])
      // "Emergency Contact" column is actually zip codes
      const zipCode = normalizeStr(row[col("Emergency Contact")])
      rows.push({
        full_name: name,
        first_name: normalizeStr(row[col("First")]),
        last_name: normalizeStr(row[col("Last")]),
        nickname: normalizeStr(row[col("Nickname")]),
        email: normalizeStr(row[col("Email Add")]),
        phone: normalizePhone(row[col("CP#")]),
        birth_place: birthPlace,
        address: normalizeStr(row[col("Address")]),
        zip_code: zipCode,
        gender: normalizeStr(row[col("Gender")]),
        source_tab: tabName,
      })
    }
  }

  return rows
}

// Extract clients from DON'T EDIT and Form Responses
function extractClientRows(masterlist: any): any[] {
  const rows: any[] = []
  const tabNames = ["DON'T EDIT", "Form Responses 1"]

  for (const tabName of tabNames) {
    const tab = masterlist.tabs?.[tabName]
    if (!tab?.formatted) continue
    const h = tab.formatted[0] as string[]
    if (!h) continue

    const col = (label: string) => {
      const idx = h.findIndex((c: string) => c.replace(/[:\s]/g, "").toLowerCase() === label.toLowerCase().replace(/[:\s]/g, ""))
      return idx >= 0 ? idx : h.findIndex((c: string) => c.toLowerCase().includes(label.toLowerCase()))
    }

    for (let r = 1; r < tab.formatted.length; r++) {
      const row = tab.formatted[r]
      const name = normalizeStr(row[col("Client Name")])
      if (!name) continue
      rows.push({
        name,
        email: normalizeStr(row[col("Client Email Add")]),
        source_tab: tabName,
      })
    }
  }

  return rows
}

// Extract assignments from DON'T EDIT and Form Responses
function extractAssignmentRows(masterlist: any): any[] {
  const rows: any[] = []
  const tabNames = ["DON'T EDIT", "Form Responses 1"]

  for (const tabName of tabNames) {
    const tab = masterlist.tabs?.[tabName]
    if (!tab?.formatted) continue
    const h = tab.formatted[0] as string[]
    if (!h) continue

    const col = (label: string) => {
      const idx = h.findIndex((c: string) => c.replace(/[:\s]/g, "").toLowerCase() === label.toLowerCase().replace(/[:\s]/g, ""))
      return idx >= 0 ? idx : h.findIndex((c: string) => c.toLowerCase().includes(label.toLowerCase()))
    }

    for (let r = 1; r < tab.formatted.length; r++) {
      const row = tab.formatted[r]
      const opName = normalizeStr(row[col("Resource Name")])
      if (!opName) continue
      rows.push({
        op_name: opName,
        client_name: normalizeStr(row[col("Client Name")]),
        role: normalizeStr(row[col("Role")]),
        status: normalizeStr(row[col("Status")]),
        type: normalizeStr(row[col("Type")]),
        start_date: normalizeDate(row[col("Date Started With Client")]),
        end_date: normalizeDate(row[col("Date Ended")]),
        working_days: normalizeStr(row[col("Working Days")]),
        working_hours: normalizeStr(row[col("Working Hours")]),
        rate: normalizeStr(row[col("Rate ($)")]),
        assigned_cs: normalizeStr(row[col("Assigned CS")]),
        department: normalizeStr(row[col("Department")]),
        source_tab: tabName,
      })
    }
  }

  return rows
}

// ============================================================
// Main merge pipeline
// ============================================================

export function runMerge(): {
  ops: any[]
  clients: any[]
  assignments: any[]
} {
  ensureCleanDir()
  console.log("Loading raw data...")

  const masterlist = loadRaw("OP_Masterlist_for_CST.json")

  // === OPS ===
  console.log("\n--- Merging Ops ---")
  const rawOps = extractOpsRows(masterlist)
  console.log(`  Raw rows: ${rawOps.length}`)

  const rules = OPS_RULES.data
  const groups = groupByIdentity(rawOps, rules.merge_strategy.identity_key)
  console.log(`  Unique identities: ${groups.size}`)

  const merged = applySourcePriority(groups, rules.source_priority, rules.merge_strategy.conflict_resolution)
  console.log(`  After merge: ${merged.length}`)

  // Apply OP canonical name mapping before writing
  applyCanonicalNames(merged, "full_name", OP_CANONICAL_MAP)
  console.log(`  After canonical mapping: ${merged.length}`)

  writeFileSync(join(CLEAN_DIR, "ops.json"), JSON.stringify(merged, null, 2))
  console.log(`  Written to data/clean/ops.json`)

  // === CLIENTS ===
  console.log("\n--- Merging Clients ---")
  const rawClients = extractClientRows(masterlist)
  applyCanonicalNames(rawClients, "name", CLIENT_CANONICAL_MAP)
  console.log(`  Raw rows: ${rawClients.length}`)

  const clientRules = CLIENTS_RULES.data
  let clientGroups = groupByIdentity(rawClients, clientRules.merge_strategy.identity_key)
  console.log(`  Unique identities: ${clientGroups.size}`)

  let cleanClients: any[] = []
  if (clientRules.merge_strategy.collapse?.enabled) {
    // Collapse: all rows with same name → one row
    const allRows = [...clientGroups.values()].flat()
    cleanClients = collapseGroup(allRows, clientRules.merge_strategy.collapse)
    console.log(`  After collapse: ${cleanClients.length}`)
  } else {
    cleanClients = applySourcePriority(clientGroups, clientRules.source_priority, clientRules.merge_strategy.conflict_resolution)
  }

  writeFileSync(join(CLEAN_DIR, "clients.json"), JSON.stringify(cleanClients, null, 2))
  console.log(`  Written to data/clean/clients.json`)

  // === ASSIGNMENTS ===
  console.log("\n--- Merging Assignments ---")
  const rawAssignments = extractAssignmentRows(masterlist)
  applyCanonicalNames(rawAssignments, "client_name", CLIENT_CANONICAL_MAP)
  applyCanonicalNames(rawAssignments, "op_name", OP_CANONICAL_MAP)
  normalizeFieldValues(rawAssignments, "department")
  console.log(`  Raw rows: ${rawAssignments.length}`)

  const assignRules = ASSIGNMENTS_RULES.data
  const assignGroups = groupByIdentity(rawAssignments, assignRules.merge_strategy.identity_key)
  console.log(`  Unique identities: ${assignGroups.size}`)

  // Normalize type field
  const cleanAssignments = applySourcePriority(assignGroups, assignRules.source_priority, assignRules.merge_strategy.conflict_resolution)
  for (const a of cleanAssignments) {
    if (a.type === "6-hours" || a.type === "6 Hours") a.type = "6 Hours"
  }
  console.log(`  After merge: ${cleanAssignments.length}`)

  writeFileSync(join(CLEAN_DIR, "assignments.json"), JSON.stringify(cleanAssignments, null, 2))
  console.log(`  Written to data/clean/assignments.json`)

  console.log("\n=== Merge complete ===")
  console.log(`  Ops: ${rawOps.length} -> ${merged.length}`)
  console.log(`  Clients: ${rawClients.length} -> ${cleanClients.length}`)
  console.log(`  Assignments: ${rawAssignments.length} -> ${cleanAssignments.length}`)

  return { ops: merged, clients: cleanClients, assignments: cleanAssignments }
}

// Run directly
if (import.meta.main) {
  runMerge()
}
