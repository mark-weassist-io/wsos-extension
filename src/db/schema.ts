import type { Database } from "bun:sqlite"

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS wsos_ops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  dob TEXT,
  address TEXT,
  zip_code TEXT,
  gender TEXT,
  nickname TEXT,
  source_tab TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wsos_clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  timezone TEXT,
  holiday_schedule TEXT,
  source_tab TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wsos_op_client_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  op_name TEXT,
  client_name TEXT,
  role TEXT,
  status TEXT,
  type TEXT CHECK(type IN ('Full-Time', 'Part-Time', '6 Hours', '6-hours')),
  start_date TEXT,
  end_date TEXT,
  working_days TEXT,
  working_hours TEXT,
  rate TEXT,
  assigned_cs TEXT,
  department TEXT,
  source_tab TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wsos_pto_policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_name TEXT,
  policy_name TEXT,
  policy_value TEXT,
  source_tab TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wsos_ninety_day_checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  op_name TEXT NOT NULL,
  checkin_type TEXT,
  checkin_date TEXT,
  status TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wsos_slack_support_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  op_name TEXT,
  ticket TEXT,
  status TEXT,
  notes TEXT,
  source_tab TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wa_cs_staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  full_name TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wa_onboarding_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  op_name TEXT,
  client_name TEXT,
  company_name TEXT,
  role TEXT,
  assigned_cs TEXT,
  source_person TEXT,
  step_name TEXT,
  step_status TEXT,
  notes TEXT,
  last_stage_completed TEXT,
  overall_status TEXT,
  source_tab TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wa_post_90day_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  op_name TEXT NOT NULL,
  after_1_year TEXT,
  after_1_year_3_months TEXT,
  after_3_mon TEXT,
  after_4_mon TEXT,
  after_5_mon TEXT,
  after_6_mon TEXT,
  after_9_mon TEXT,
  client_name TEXT,
  client_s_email TEXT,
  role TEXT,
  start_date TEXT,
  status TEXT,
  assigned_cs TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wa_client_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  op_name TEXT,
  client_name TEXT,
  request TEXT,
  date TEXT,
  status TEXT,
  source_tab TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wa_red_flags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flag_name TEXT,
  definition TEXT,
  source_tab TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wa_existing_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_name TEXT,
  update_note TEXT,
  checkin_frequency TEXT,
  source_tab TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  deleted_at DATETIME DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS wa_cell_formatting (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sheet_name TEXT NOT NULL,
  tab_name TEXT NOT NULL,
  row_index INTEGER NOT NULL,
  col_index INTEGER NOT NULL,
  hex_color TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS nexus_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'staff',
  department TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT
);
`

export function ensureSchema(db: Database): void {
  const existing = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]
  if (existing.length === 0) {
    db.run(SCHEMA_SQL)
    return
  }

  // Migrations for renamed/added columns
  const cols = db.prepare("PRAGMA table_info(wsos_op_client_assignments)").all() as { name: string }[]
  const colNames = cols.map(c => c.name)
  if (colNames.includes("cs_staff_name") && !colNames.includes("assigned_cs")) {
    db.run("ALTER TABLE wsos_op_client_assignments RENAME COLUMN cs_staff_name TO assigned_cs")
  } else if (!colNames.includes("assigned_cs") && !colNames.includes("cs_staff_name")) {
    db.run("ALTER TABLE wsos_op_client_assignments ADD COLUMN assigned_cs TEXT")
  }

  // Ensure checkin_milestones has was_green and custom_date columns
  const milestoneTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='checkin_milestones'").get() as { name: string } | undefined
  if (milestoneTable) {
    const milestoneCols = db.prepare("PRAGMA table_info(checkin_milestones)").all() as { name: string }[]
    if (!milestoneCols.find(c => c.name === "was_green")) {
      db.run("ALTER TABLE checkin_milestones ADD COLUMN was_green INTEGER NOT NULL DEFAULT 1")
    }
    if (!milestoneCols.find(c => c.name === "custom_date")) {
      db.run("ALTER TABLE checkin_milestones ADD COLUMN custom_date TEXT")
    }
  }

  // Ensure users table exists (auth)
  db.run(`CREATE TABLE IF NOT EXISTS nexus_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'staff',
    department TEXT NOT NULL DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    deleted_at TEXT
  )`)
  // Add columns to nexus_users for existing DBs
  const userCols = db.prepare("PRAGMA table_info(nexus_users)").all() as { name: string }[]
  const userColNames = userCols.map(c => c.name)
  if (!userColNames.includes("department")) db.run("ALTER TABLE nexus_users ADD COLUMN department TEXT NOT NULL DEFAULT ''")
  if (!userColNames.includes("deleted_at")) db.run("ALTER TABLE nexus_users ADD COLUMN deleted_at TEXT")
}
