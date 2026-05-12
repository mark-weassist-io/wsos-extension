import type { EntityQualityRules } from "./types"

export const ASSIGNMENTS_RULES: EntityQualityRules = {
  schema: {
    ddl: `CREATE TABLE wsos_op_client_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  op_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  role TEXT,
  status TEXT NOT NULL DEFAULT 'Probation'
    CHECK(status IN ('Active','Probation','Inactive','Separated','Resigned')),
  type TEXT CHECK(type IN ('Full-Time','Part-Time','6 Hours')),
  start_date DATE,
  end_date DATE,
  working_days TEXT,
  working_hours TEXT,
  rate NUMERIC,
  assigned_cs TEXT,
  department TEXT,
  deleted_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT (datetime('now')),
  UNIQUE(op_name, client_name),
  FOREIGN KEY (op_name) REFERENCES wsos_ops(full_name),
  FOREIGN KEY (client_name) REFERENCES wsos_clients(name)
)`,
    indexes: [
      "CREATE INDEX idx_assignments_op ON wsos_op_client_assignments(op_name)",
      "CREATE INDEX idx_assignments_client ON wsos_op_client_assignments(client_name)",
      "CREATE INDEX idx_assignments_status ON wsos_op_client_assignments(status)",
    ],
  },
  data: {
    required: ["op_name", "client_name"],
    unique: [["op_name", "client_name"]],
    fields: {
      op_name: { type: "string", minLength: 1, required: true },
      client_name: { type: "string", minLength: 1, required: true },
      role: { type: "string" },
      status: { type: "string" },
      rate: { type: "number", min: 0 },
    },
    domain: {
      status: ["Active", "Probation", "Inactive", "Separated", "Resigned"],
      type: ["Full-Time", "Part-Time", "6 Hours"],
    },
    fk: {
      op_name: { ref: "wsos_ops", field: "full_name" },
      client_name: { ref: "wsos_clients", field: "name" },
    },
    source_priority: {
      DON_T_EDIT: ["op_name", "client_name", "role", "status", "type", "start_date", "end_date", "working_days", "working_hours", "assigned_cs", "department"],
      FORM_RESPONSES: ["rate"],
    },
    completeness_target: {
      op_name: 1.0,
      client_name: 1.0,
      status: 0.90,
      role: 0.80,
    },
    merge_strategy: {
      identity_key: ["op_name", "client_name"],
      intra_source_dedup: true,
      conflict_resolution: {
        op_name: "canonical_wins",
        client_name: "canonical_wins",
        role: "canonical_wins",
        status: "canonical_wins",
        type: "canonical_wins",
        rate: "supplemental_wins",
        start_date: "canonical_wins",
        end_date: "canonical_wins",
        working_days: "canonical_wins",
        working_hours: "canonical_wins",
        assigned_cs: "canonical_wins",
        department: "canonical_wins",
      },
    },
  },
}
