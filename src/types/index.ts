// ============================================================
// Core Domain Types — shared across the entire application
// ============================================================

// --- WSOS-Owned Entities (maps to WSOS platform tables) ---

export interface Op {
  id: number
  full_name: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  dob: string | null
  birth_place: string | null
  address: string | null
  zip_code: string | null
  gender: string | null
  nickname: string | null
  source_tab: string | null
  created_at: string | null
}

export interface Client {
  id: number
  name: string
  email: string | null
  timezone: string | null
  holiday_schedule: string | null
  source_tab: string | null
  created_at: string | null
}

export interface OpClientAssignment {
  id: number
  op_name: string | null
  client_name: string | null
  role: string | null
  status: string | null
  type: string | null
  start_date: string | null
  end_date: string | null
  working_days: string | null
  working_hours: string | null
  rate: string | null
  assigned_cs: string | null
  department: string | null
  source_tab: string | null
  created_at: string | null
}

export interface PtoPolicy {
  id: number
  client_name: string | null
  policy_name: string | null
  policy_value: string | null
  source_tab: string | null
  created_at: string | null
}

export interface NinetyDayCheckin {
  id: number
  op_name: string | null
  client_name: string | null
  checkin_type: string | null
  checkin_date: string | null
  status: string | null
  assigned_cs: string | null
  notes: string | null
  source_tab: string | null
  created_at: string | null
}

export interface SlackSupportTicket {
  id: number
  op_name: string | null
  ticket: string | null
  status: string | null
  notes: string | null
  source_tab: string | null
  created_at: string | null
}

// --- WeAssist-Exclusive Entities (no WSOS overlap) ---

export interface CsStaff {
  id: number
  name: string
  full_name: string | null
  created_at: string | null
}

export interface OnboardingStep {
  id: number
  step_id?: number
  owner?: string | null
  op_name: string | null
  client_name: string | null
  company_name: string | null
  role: string | null
  assigned_cs: string | null
  source_person: string | null
  step_name: string | null
  step_status: string | null
  notes: string | null
  last_stage_completed: string | null
  overall_status: string | null
  source_tab: string | null
  created_at: string | null
}

export interface Post90DayCheckinSchedule {
  id: number
  op_name: string
  after_1_year: string | null
  after_1_year_3_months: string | null
  after_3_mon: string | null
  after_4_mon: string | null
  after_5_mon: string | null
  after_6_mon: string | null
  after_9_mon: string | null
  client_name: string | null
  client_s_email: string | null
  role: string | null
  start_date: string | null
  status: string | null
  assigned_cs: string | null
  created_at: string | null
}

export interface ClientRequest {
  id: number
  op_name: string | null
  client_name: string | null
  request: string | null
  date: string | null
  status: string | null
  source_tab: string | null
  created_at: string | null
}

export interface RedFlag {
  id: number
  flag_name: string | null
  definition: string | null
  source_tab: string | null
  created_at: string | null
}

export interface ExistingAccount {
  id: number
  client_name: string | null
  update_note: string | null
  checkin_frequency: string | null
  source_tab: string | null
  created_at: string | null
}

export interface CellFormatting {
  id: number
  sheet_name: string
  tab_name: string
  row_index: number
  col_index: number
  hex_color: string
  created_at: string | null
}

// --- View/Composite Types ---

export interface OpWithAssignment extends Op {
  client_name: string | null
  role: string | null
  assignment_status: string | null
  type: string | null
  start_date: string | null
  assigned_cs: string | null
}

export interface DashboardMetrics {
  total_ops: number
  active_ops: number
  onboarding_in_progress: number
  post_onboarding_active: number
  separated_ops: number
  overdue_checkins: number
  pending_handoff_calls: number
}

export interface OnboardingSummary {
  id: number
  op_name: string
  client_name: string
  source_person: string
  step_count: number
  completed_steps: number
  last_stage: string | null
  overall_status: string | null
}

export type SortDirection = "asc" | "desc"

export interface PageQuery {
  offset: number
  limit: number
  search?: string
  sort_by?: string
  sort_dir?: SortDirection
}
