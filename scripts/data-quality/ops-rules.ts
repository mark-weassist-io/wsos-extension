import type { EntityQualityRules } from "./types"

export const OPS_RULES: EntityQualityRules = {
  schema: {
    ddl: `CREATE TABLE wsos_ops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  dob DATE,
  birth_place TEXT,
  address TEXT,
  zip_code TEXT,
  gender TEXT CHECK(gender IN ('Male','Female')),
  nickname TEXT,
  rate TEXT,
  deleted_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT (datetime('now')),
  UNIQUE(full_name)
)`,

    indexes: [
      "CREATE INDEX idx_ops_full_name ON wsos_ops(full_name)",
    ],
  },
  data: {
    required: ["full_name"],
    unique: ["full_name"],
    fields: {
      full_name: { type: "string", minLength: 2, required: true },
      email: { type: "string", pattern: /^.+@.+$/ },
      phone: { type: "string" },
      zip_code: { type: "string", pattern: /^\d{4}$/ },
    },
    domain: {
      gender: ["Male", "Female", "M", "F"],
    },
    source_priority: {
      DON_T_EDIT: ["full_name", "first_name", "last_name", "phone", "address", "gender", "nickname", "zip_code"],
      FORM_RESPONSES: ["email", "dob"],
    },
    completeness_target: {
      full_name: 1.0,
      email: 0.50,
      phone: 0.90,
      zip_code: 0.80,
    },
    merge_strategy: {
      identity_key: "full_name",
      intra_source_dedup: true,
      conflict_resolution: {
        full_name: "canonical_wins",
        email: "supplemental_wins",
        phone: "canonical_wins",
        address: "canonical_wins",
        gender: "canonical_wins",
        zip_code: "canonical_wins",
        nickname: "canonical_wins",
        dob: "supplemental_wins",
      },
    },
  },
}
