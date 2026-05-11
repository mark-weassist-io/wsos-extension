import type { EntityQualityRules } from "./types"

export const ONBOARDING_RULES: EntityQualityRules = {
  schema: {
    ddl: `CREATE TABLE wa_onboarding_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  op_name TEXT NOT NULL,
  client_name TEXT,
  company_name TEXT,
  role TEXT,
  assigned_cs TEXT,
  source_person TEXT NOT NULL,
  step_name TEXT NOT NULL,
  step_status TEXT,
  notes TEXT,
  last_stage_completed TEXT,
  overall_status TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (op_name) REFERENCES wsos_ops(full_name)
)`,
    indexes: [
      "CREATE INDEX idx_onboarding_op ON wa_onboarding_steps(op_name)",
      "CREATE INDEX idx_onboarding_person ON wa_onboarding_steps(source_person)",
    ],
  },
  data: {
    required: ["op_name", "source_person", "step_name"],
    unique: [],
    fields: {
      op_name: { type: "string", minLength: 1, required: true },
      source_person: { type: "string", required: true },
      step_name: { type: "string", minLength: 1, required: true },
    },
    fk: {
      op_name: { ref: "wsos_ops", field: "full_name" },
    },
    source_priority: {
      Michelle: ["op_name", "client_name", "step_name", "step_status", "notes", "last_stage_completed", "overall_status"],
      Dennis: ["op_name", "client_name", "step_name", "step_status", "notes", "last_stage_completed", "overall_status"],
    },
    completeness_target: {
      op_name: 1.0,
      source_person: 1.0,
      step_name: 1.0,
    },
    merge_strategy: {
      identity_key: ["op_name", "source_person"],
      intra_source_dedup: false,
      conflict_resolution: {
        step_name: "canonical_wins",
        step_status: "supplemental_wins",
      },
    },
    // For onboarding, Michelle and Dennis have complementary data for the same OP.
    // The merge merges step names/statuses across both sources per OP.
  },
}
