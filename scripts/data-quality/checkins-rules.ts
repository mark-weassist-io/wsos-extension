import type { EntityQualityRules } from "./types"

export const CHECKINS_RULES: EntityQualityRules = {
  schema: {
    ddl: `CREATE TABLE wsos_ninety_day_checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  op_name TEXT NOT NULL,
  status TEXT,
  notes TEXT,
  assigned_cs TEXT,
  created_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (op_name) REFERENCES wsos_ops(full_name)
)`,
    indexes: [
      "CREATE INDEX idx_checkins_op ON wsos_ninety_day_checkins(op_name)",
    ],
  },
  data: {
    required: ["op_name"],
    unique: [],
    fields: {
      op_name: { type: "string", minLength: 1, required: true },
      status: { type: "string" },
    },
    fk: {
      op_name: { ref: "wsos_ops", field: "full_name" },
    },
    source_priority: {
      Reporting: ["op_name", "status", "assigned_cs", "notes"],
    },
    completeness_target: {
      op_name: 1.0,
      status: 0.70,
    },
    merge_strategy: {
      identity_key: ["op_name"],
      intra_source_dedup: true,
      conflict_resolution: {},
    },
  },
  normalization: {
    canonical: ["notes"],
    derived: [
      { field: "client_name", source_table: "wsos_op_client_assignments", source_field: "client_name" },
    ],
  },
}

export const SCHEDULE_RULES: EntityQualityRules = {
  schema: {
    ddl: `CREATE TABLE wa_post_90day_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  op_name TEXT NOT NULL,
  after_1_year TEXT, after_1_year_3_months TEXT,
  after_3_mon TEXT, after_4_mon TEXT, after_5_mon TEXT,
  after_6_mon TEXT, after_9_mon TEXT,
  client_name TEXT, client_s_email TEXT,
  role TEXT, start_date TEXT, status TEXT,
  assigned_cs TEXT,
  FOREIGN KEY (op_name) REFERENCES wsos_ops(full_name)
)`,
    indexes: [
      "CREATE INDEX idx_schedule_op ON wa_post_90day_schedule(op_name)",
    ],
  },
  data: {
    required: ["op_name"],
    fields: {
      op_name: { type: "string", minLength: 1, required: true },
    },
    fk: {
      op_name: { ref: "wsos_ops", field: "full_name" },
    },
    source_priority: {},
    completeness_target: {
      op_name: 1.0,
    },
    merge_strategy: {
      identity_key: "op_name",
      intra_source_dedup: true,
      conflict_resolution: {},
    },
  },
}
