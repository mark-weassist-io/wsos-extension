import { sqliteTable, text, integer, real, uniqueIndex, index, foreignKey } from "drizzle-orm/sqlite-core"

// ============================================================
// Reference (lookup) tables
// ============================================================

export const genders = sqliteTable("wa_genders", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().unique(),
})

export const assignmentStatuses = sqliteTable("wa_assignment_statuses", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().unique(),
})

export const assignmentTypes = sqliteTable("wa_assignment_types", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().unique(),
})

export const checkinStatuses = sqliteTable("wa_checkin_statuses", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().unique(),
})

export const csStaff = sqliteTable("wa_cs_staff", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().unique(),
  fullName: text("full_name"),
  createdAt: text("created_at").default("datetime('now')"),
  deletedAt: text("deleted_at"),
})

// ============================================================
// Core entity tables
// ============================================================

export const ops = sqliteTable("wsos_ops", {
  id: integer("id").primaryKey(),
  fullName: text("full_name").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  dob: text("dob", { mode: "text" }),
  birthPlace: text("birth_place"),
  address: text("address"),
  zipCode: text("zip_code"),
  gender: text("gender"),
  nickname: text("nickname"),
  createdAt: text("created_at").default("datetime('now')"),
  deletedAt: text("deleted_at"),
}, (table) => [
  uniqueIndex("idx_ops_name").on(table.fullName),
  index("idx_ops_email").on(table.email),
])

export const clients = sqliteTable("wsos_clients", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  timezone: text("timezone"),
  holidaySchedule: text("holiday_schedule"),
  createdAt: text("created_at").default("datetime('now')"),
  deletedAt: text("deleted_at"),
}, (table) => [
  uniqueIndex("idx_clients_name").on(table.name),
])

export const assignments = sqliteTable("wsos_op_client_assignments", {
  id: integer("id").primaryKey(),
  opName: text("op_name").notNull(),
  clientName: text("client_name").notNull(),
  role: text("role"),
  status: text("status").notNull().default("Probation"),
  type: text("type"),
  startDate: text("start_date", { mode: "text" }),
  endDate: text("end_date", { mode: "text" }),
  workingDays: text("working_days"),
  workingHours: text("working_hours"),
  rate: real("rate"),
  assignedCs: text("assigned_cs"),
  department: text("department"),
  createdAt: text("created_at").default("datetime('now')"),
  deletedAt: text("deleted_at"),
}, (table) => [
  uniqueIndex("idx_assignments_unique").on(table.opName, table.clientName),
  index("idx_assignments_op").on(table.opName),
  index("idx_assignments_client").on(table.clientName),
  index("idx_assignments_status").on(table.status),
])

export const onboardingSteps = sqliteTable("wa_onboarding_steps", {
  id: integer("id").primaryKey(),
  opName: text("op_name").notNull(),
  clientName: text("client_name"),
  companyName: text("company_name"),
  role: text("role"),
  assignedCs: text("assigned_cs"),
  sourcePerson: text("source_person").notNull(),
  stepName: text("step_name").notNull(),
  stepStatus: text("step_status"),
  notes: text("notes"),
  lastStageCompleted: text("last_stage_completed"),
  overallStatus: text("overall_status"),
  createdAt: text("created_at").default("datetime('now')"),
}, (table) => [
  index("idx_onboarding_op").on(table.opName),
  index("idx_onboarding_person").on(table.sourcePerson),
])

export const obStepDefs = sqliteTable("wa_ob_step_defs", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().unique(),
  stepOrder: integer("step_order").notNull(),
  category: text("category"),
  owner: text("owner").notNull(),
})

export const obRecords = sqliteTable("wa_ob_records", {
  id: integer("id").primaryKey(),
  opName: text("op_name").notNull(),
  clientName: text("client_name"),
  companyName: text("company_name"),
  role: text("role"),
  rate: text("rate"),
  startDate: text("start_date"),
  startTime: text("start_time"),
  contactNumber: text("contact_number"),
  email: text("email"),
  notes: text("notes"),
  lastStageCompleted: text("last_stage_completed"),
  status: text("status"),
  sourcePerson: text("source_person"),
}, (table) => [
  index("idx_ob_records_op").on(table.opName),
  index("idx_ob_records_status").on(table.status),
])

export const obStatuses = sqliteTable("wa_ob_statuses", {
  id: integer("id").primaryKey(),
  recordId: integer("record_id").notNull(),
  stepDefId: integer("step_def_id").notNull(),
  status: text("status").notNull(),
}, (table) => [
  index("idx_ob_statuses_record").on(table.recordId),
  uniqueIndex("idx_ob_statuses_unique").on(table.recordId, table.stepDefId),
])

export const ninetyDayCheckins = sqliteTable("wsos_ninety_day_checkins", {
  id: integer("id").primaryKey(),
  opName: text("op_name").notNull(),
  status: text("status"),
  notes: text("notes"),
  createdAt: text("created_at").default("datetime('now')"),
}, (table) => [
  index("idx_checkins_op").on(table.opName),
])

export const checkinSchedule = sqliteTable("wa_post_90day_schedule", {
  id: integer("id").primaryKey(),
  opName: text("op_name").notNull(),
  after1Year: text("after_1_year"),
  after1Year3Months: text("after_1_year_3_months"),
  after3Mon: text("after_3_mon"),
  after4Mon: text("after_4_mon"),
  after5Mon: text("after_5_mon"),
  after6Mon: text("after_6_mon"),
  after9Mon: text("after_9_mon"),
  clientName: text("client_name"),
  clientSEmail: text("client_s_email"),
  role: text("role"),
  startDate: text("start_date"),
  status: text("status"),
  assignedCs: text("assigned_cs"),
  createdAt: text("created_at").default("datetime('now')"),
}, (table) => [
  index("idx_schedule_op").on(table.opName),
])

export const redFlags = sqliteTable("wa_red_flags", {
  id: integer("id").primaryKey(),
  flagName: text("flag_name"),
  color: text("color"),
  definition: text("definition"),
  sourceTab: text("source_tab"),
  createdAt: text("created_at").default("datetime('now')"),
})

export const existingAccounts = sqliteTable("wa_existing_accounts", {
  id: integer("id").primaryKey(),
  clientName: text("client_name"),
  updateNote: text("update_note"),
  checkinFrequency: text("checkin_frequency"),
  sourceTab: text("source_tab"),
  createdAt: text("created_at").default("datetime('now')"),
})

export const slackSupportTickets = sqliteTable("wsos_slack_support_tickets", {
  id: integer("id").primaryKey(),
  opName: text("op_name"),
  ticket: text("ticket"),
  status: text("status"),
  notes: text("notes"),
  sourceTab: text("source_tab"),
  createdAt: text("created_at").default("datetime('now')"),
})

export const ptoPolicies = sqliteTable("wsos_pto_policies", {
  id: integer("id").primaryKey(),
  clientName: text("client_name"),
  policyName: text("policy_name"),
  policyValue: text("policy_value"),
  sourceTab: text("source_tab"),
  createdAt: text("created_at").default("datetime('now')"),
})

export const cellFormatting = sqliteTable("wa_cell_formatting", {
  id: integer("id").primaryKey(),
  sheetName: text("sheet_name").notNull(),
  tabName: text("tab_name").notNull(),
  rowIndex: integer("row_index").notNull(),
  colIndex: integer("col_index").notNull(),
  hexColor: text("hex_color").notNull(),
  createdAt: text("created_at").default("datetime('now')"),
})

export const opCheckinReviews = sqliteTable("op_checkin_reviews", {
  id: integer("id").primaryKey(),
  opName: text("op_name").notNull(),
  period: text("period"),
  redFlag: text("red_flag"),
  csStaffName: text("cs_staff_name"),
  sourceTab: text("source_tab"),
  createdAt: text("created_at").default("datetime('now')"),
})
