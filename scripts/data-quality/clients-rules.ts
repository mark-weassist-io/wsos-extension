import type { EntityQualityRules } from "./types"

export const CLIENTS_RULES: EntityQualityRules = {
  schema: {
    ddl: `CREATE TABLE wsos_clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  deleted_at DATETIME DEFAULT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(name)
)`,
    indexes: [
      "CREATE INDEX idx_clients_name ON wsos_clients(name)",
    ],
  },
  data: {
    required: ["name"],
    unique: ["name"],
    fields: {
      name: { type: "string", minLength: 1, required: true },
      email: { type: "string", pattern: /^.+@.+$/ },
    },
    source_priority: {
      DON_T_EDIT: ["name", "email", "timezone", "holiday_schedule"],
      FORM_RESPONSES: ["email"],
    },
    completeness_target: {
      name: 1.0,
      email: 0.50,
    },
    merge_strategy: {
      identity_key: "name",
      intra_source_dedup: true,
      conflict_resolution: {
        name: "canonical_wins",
        email: "take_first_non_null",
      },
      collapse: {
        enabled: true,
        group_by: ["name"],
        merge: {
          email: "take_first_non_null",
        },
      },
    },
  },
}
