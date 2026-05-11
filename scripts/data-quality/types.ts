// Shared types for quality rules

export interface EntityQualityRules {
  schema: {
    ddl: string
    indexes: string[]
  }
  data: QualityRules
  // Canonical source and aliases for normalization checks
  normalization?: {
    // fields where this table is the canonical source (single source of truth)
    canonical: string[]
    // fields that should be derived via JOIN from another table
    derived?: { field: string; source_table: string; source_field: string }[]
  }
}

export interface FieldRule {
  type: "string" | "number" | "date" | "boolean"
  required?: boolean
  minLength?: number
  pattern?: RegExp
  min?: number
  max?: number
}

export interface QualityRules {
  // Fields that must always be non-null
  required: string[]

  // Single-field or composite unique constraints
  unique: (string | string[])[]

  // Field-level type and format rules
  fields: Record<string, FieldRule>

  // Domain constraints (allowed enum values)
  domain?: Record<string, string[]>

  // Foreign key references (name-based or id-based)
  fk?: Record<string, { ref: string; field: string }>

  // When multiple sources describe the same entity
  source_priority: Record<string, string[]>

  // Minimum completeness threshold per field (0.0 - 1.0)
  completeness_target: Record<string, number>

  // How to handle the merge
  merge_strategy: {
    identity_key: string | string[]
    intra_source_dedup: boolean
    conflict_resolution: Record<string, string>
    collapse?: {
      enabled: boolean
      group_by: string[]
      merge: Record<string, string>
    }
  }
}

export type ViolationType = "missing_required" | "duplicate" | "domain" | "fk_missing" | "completeness_below_target" | "type_mismatch" | "pattern_mismatch" | "denormalized" | "canonical_violation"

export interface VerificationViolation {
  type: ViolationType
  entity: string
  row_id?: number
  key?: string
  field?: string
  value?: string
  expected: string
  actual: string
}

export interface VerificationReport {
  passed: boolean
  timestamp: string
  entities: Record<string, {
    total_rows: number
    passed: boolean
    violations: VerificationViolation[]
    completeness: Record<string, number>
  }>
  summary: {
    total_violations: number
    entities_checked: number
    entities_passed: number
  }
}

// Canonical field registry — the single source of truth for each semantic field
// Each entry maps a semantic field name to its canonical table and column.
// All other occurrences should be derived via JOIN or FK.
export const CANONICAL_FIELDS: Record<string, { table: string; field: string; description: string }> = {
  op_name: { table: "wsos_ops", field: "full_name", description: "OP full name" },
  client_name: { table: "wsos_clients", field: "name", description: "Client name" },
  email: { table: "wsos_ops", field: "email", description: "Email address" },
  role: { table: "wsos_op_client_assignments", field: "role", description: "OP role on assignment" },
  rate: { table: "wsos_op_client_assignments", field: "rate", description: "OP billing rate" },
  start_date: { table: "wsos_op_client_assignments", field: "start_date", description: "Assignment start date" },
  assigned_cs: { table: "wsos_op_client_assignments", field: "assigned_cs", description: "Assigned CS staff" },
  cs_name: { table: "wa_cs_staff", field: "name", description: "CS staff name" },
  status: { table: "wa_assignment_statuses", field: "name", description: "Status value" },
  name: { table: "wa_cs_staff", field: "name", description: "Generic name (context-dependent)" },
  full_name: { table: "wsos_ops", field: "full_name", description: "OP full name" },
  phone: { table: "wsos_ops", field: "phone", description: "Phone number" },
  notes: { table: "wsos_ninety_day_checkins", field: "notes", description: "Freeform notes" },
}

// Known aliases — different column names that represent the same semantic field
export const FIELD_ALIASES: Record<string, string[]> = {
  op_name: ["op_name", "op", "full_name"],
  client_name: ["client_name", "client", "name"],
  assigned_cs: ["assigned_cs", "cs", "cs_name", "cs_staff"],
  email: ["email", "email_address"],
  phone: ["phone", "phone_number", "contact_number"],
  role: ["role", "position", "title"],
  rate: ["rate", "billing_rate", "pay_rate", "salary"],
  start_date: ["start_date", "started_date", "date_started"],
  status: ["status", "assessment", "current_status"],
  notes: ["notes", "remarks", "comments", "additional_notes"],
  name: ["name", "full_name", "staff_name", "cs_name"],
}

export interface FieldRule {
  type: "string" | "number" | "date" | "boolean"
  required?: boolean
  minLength?: number
  pattern?: RegExp
  min?: number
  max?: number
}

export interface QualityRules {
  // Fields that must always be non-null
  required: string[]

  // Single-field or composite unique constraints
  // e.g. ["full_name"] or [["op_name", "client_name"]]
  unique: (string | string[])[]

  // Field-level type and format rules
  fields: Record<string, FieldRule>

  // Domain constraints (allowed enum values)
  domain?: Record<string, string[]>

  // Foreign key references (name-based or id-based)
  fk?: Record<string, { ref: string; field: string }>

  // When multiple sources describe the same entity
  source_priority: Record<string, string[]>

  // Minimum completeness threshold per field (0.0 - 1.0)
  completeness_target: Record<string, number>

  // How to handle the merge
  merge_strategy: {
    identity_key: string | string[]
    intra_source_dedup: boolean
    conflict_resolution: Record<string, string> // field -> strategy
    collapse?: {
      enabled: boolean
      group_by: string[]
      merge: Record<string, string>
    }
  }
}

export interface VerificationViolation {
  type: "missing_required" | "duplicate" | "domain" | "fk_missing" | "completeness_below_target" | "type_mismatch" | "pattern_mismatch"
  entity: string
  row_id?: number
  key?: string
  field?: string
  value?: string
  expected: string
  actual: string
}

export interface VerificationReport {
  passed: boolean
  timestamp: string
  entities: Record<string, {
    total_rows: number
    passed: boolean
    violations: VerificationViolation[]
    completeness: Record<string, number>
  }>
  summary: {
    total_violations: number
    entities_checked: number
    entities_passed: number
  }
}
