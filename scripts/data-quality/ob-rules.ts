import type { EntityQualityRules } from "./types"

// 30 checklist steps from the sheet, in order
// Ownership derived from header colors: #A4C2F4 = Michelle, #EAD1DC = Dennis, #93C47D = Shared, etc.
export const STEP_DEFS = [
  { id: 1,  name: "CLIENT CONFIRM START DATE AND TIME", category: "Start", owner: "Michelle" },
  { id: 2,  name: "RELAYED RATE TO CLIENT", category: "Rate", owner: "Michelle" },
  { id: 3,  name: "RATE CLIENT CONFIRMATION", category: "Rate", owner: "Michelle" },
  { id: 4,  name: "OP CONTRACT SIGNATORY", category: "Contract", owner: "Michelle" },
  { id: 5,  name: "ONBOARDED BY JANE BRIONES + CS", category: "Onboarding", owner: "Jane" },
  { id: 6,  name: "OP SLACK CREATION", category: "Slack", owner: "Michelle" },
  { id: 7,  name: "SLACK WELCOME MESSAGE TO OP", category: "Slack", owner: "Michelle" },
  { id: 8,  name: "SCHEDULE HAND-OFF CALL W/ CLIENT?", category: "Hand-off", owner: "Michelle" },
  { id: 9,  name: "HAND-OFF CALL SCHEDULE CONFIRMED", category: "Hand-off", owner: "Michelle" },
  { id: 10, name: "2ND HAND-OFF CALL SCHEDULE CONFIRMED", category: "Hand-off", owner: "Michelle" },
  { id: 11, name: "SEND SLACK MESSAGE TO CLIENT FOR NEXT STEPS", category: "Hand-off", owner: "Michelle" },
  { id: 12, name: "ADDED HAND-OFF CALL NOTES?", category: "Hand-off", owner: "Michelle" },
  { id: 13, name: "ADDED OP TO HAND-OFF CALL WITH CLIENT?", category: "Hand-off", owner: "Michelle" },
  { id: 14, name: "WE'RE READY TO GET STARTED EMAIL", category: "Email", owner: "Dennis" },
  { id: 15, name: "WARM INTRO EMAIL", category: "Email", owner: "Dennis" },
  { id: 16, name: "DONE WITH HAND OFF CALL?", category: "Hand-off", owner: "Michelle" },
  { id: 17, name: "OP ADDED TO WEEKLY GATHERING?", category: "Community", owner: "Michelle" },
  { id: 18, name: "WHATSAPP GC FOR CLIENT X OP CREATED?", category: "Community", owner: "Michelle" },
  { id: 19, name: "SCHEDULE WEEKLY CHECK-INS?", category: "Check-ins", owner: "Michelle" },
  { id: 20, name: "WEEKLY CHECK-INS CONFIRMED?", category: "Check-ins", owner: "Michelle" },
  { id: 21, name: "ADDED BELINDA+ERIC TO 1ST & 2ND CLIENT CHECK-IN?", category: "Check-ins", owner: "Michelle" },
  { id: 22, name: "ADD REEF TO GRADUATION CALL", category: "Check-ins", owner: "Michelle" },
  { id: 23, name: "PTO POLICY SENT?", category: "PTO", owner: "Michelle" },
  { id: 24, name: "LAST CHECK-IN CALL", category: "Check-ins", owner: "Michelle" },
  { id: 25, name: "SCHEDULE NEXT CHECK-IN (AFTER 1 MONTH)", category: "Next Steps", owner: "Michelle" },
  { id: 26, name: "SCHEDULE NEXT CHECK-IN (QUARTERLY)", category: "Next Steps", owner: "Michelle" },
]

export const OB_STEPS_RULES: EntityQualityRules = {
  schema: {
    ddl: `CREATE TABLE wa_ob_step_defs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  step_order INTEGER NOT NULL,
  category TEXT,
  owner TEXT NOT NULL
)`,
    indexes: ["CREATE INDEX idx_ob_steps_order ON wa_ob_step_defs(step_order)"],
  },
  data: {
    required: ["name", "step_order", "owner"],
    unique: ["name"],
    fields: {
      name: { type: "string", minLength: 1, required: true },
      step_order: { type: "number", required: true },
      owner: { type: "string", required: true },
    },
    source_priority: {},
    completeness_target: { name: 1.0, step_order: 1.0, owner: 1.0 },
    merge_strategy: { identity_key: "name", intra_source_dedup: true, conflict_resolution: {} },
  },
}

export const OB_RECORDS_RULES: EntityQualityRules = {
  schema: {
    ddl: `CREATE TABLE wa_ob_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  op_name TEXT NOT NULL,
  client_name TEXT,
  company_name TEXT,
  role TEXT,
  rate TEXT,
  start_date TEXT,
  start_time TEXT,
  contact_number TEXT,
  email TEXT,
  notes TEXT,
  last_stage_completed TEXT,
  status TEXT,
  source_person TEXT,
  FOREIGN KEY (op_name) REFERENCES wsos_ops(full_name)
)`,
    indexes: [
      "CREATE INDEX idx_ob_records_op ON wa_ob_records(op_name)",
      "CREATE INDEX idx_ob_records_status ON wa_ob_records(status)",
    ],
  },
  data: {
    required: ["op_name"],
    unique: [],
    fields: {
      op_name: { type: "string", minLength: 1, required: true },
    },
    fk: { op_name: { ref: "wsos_ops", field: "full_name" } },
    source_priority: {},
    completeness_target: { op_name: 1.0 },
    merge_strategy: { identity_key: "op_name", intra_source_dedup: true, conflict_resolution: {} },
  },
}

export const OB_STATUSES_RULES: EntityQualityRules = {
  schema: {
    ddl: `CREATE TABLE wa_ob_statuses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id INTEGER NOT NULL,
  step_def_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('Done','Not Done','NA')),
  FOREIGN KEY (record_id) REFERENCES wa_ob_records(id),
  FOREIGN KEY (step_def_id) REFERENCES wa_ob_step_defs(id),
  UNIQUE(record_id, step_def_id)
)`,
    indexes: [
      "CREATE INDEX idx_ob_statuses_record ON wa_ob_statuses(record_id)",
      "CREATE INDEX idx_ob_statuses_step ON wa_ob_statuses(step_def_id)",
    ],
  },
  data: {
    required: ["record_id", "step_def_id", "status"],
    unique: [["record_id", "step_def_id"]],
    fields: {
      record_id: { type: "number", required: true },
      step_def_id: { type: "number", required: true },
      status: { type: "string", required: true },
    },
    domain: { status: ["Done", "Not Done", "NA"] },
    fk: {
      record_id: { ref: "wa_ob_records", field: "id" },
      step_def_id: { ref: "wa_ob_step_defs", field: "id" },
    },
    source_priority: {},
    completeness_target: { record_id: 1.0, step_def_id: 1.0, status: 1.0 },
    merge_strategy: { identity_key: ["record_id", "step_def_id"], intra_source_dedup: true, conflict_resolution: {} },
  },
}
