import { getDrizzle, schema } from ".."
import { eq, count } from "drizzle-orm"
import type { SQLiteColumn } from "drizzle-orm/sqlite-core"

interface FkRef {
  table: string
  column: string
  label: string
  refTable: any
  refColumn: SQLiteColumn
}

const FK_MAP: Record<string, { refs: FkRef[] }> = {
  wsos_ops: {
    refs: [
      { table: "wsos_op_client_assignments", column: "op_name", label: "Assignments", refTable: schema.assignments, refColumn: schema.assignments.opName },
      { table: "wsos_ninety_day_checkins", column: "op_name", label: "90-Day Check-ins", refTable: schema.ninetyDayCheckins, refColumn: schema.ninetyDayCheckins.opName },
      { table: "wsos_slack_support_tickets", column: "op_name", label: "Slack Tickets", refTable: schema.slackSupportTickets, refColumn: schema.slackSupportTickets.opName },
      { table: "wa_onboarding_steps", column: "op_name", label: "Onboarding Steps", refTable: schema.onboardingSteps, refColumn: schema.onboardingSteps.opName },
      { table: "wa_post_90day_schedule", column: "op_name", label: "Check-in Schedule", refTable: schema.checkinSchedule, refColumn: schema.checkinSchedule.opName },
      { table: "wa_ob_records", column: "op_name", label: "Onboarding Records", refTable: schema.obRecords, refColumn: schema.obRecords.opName },
      { table: "wsos_pto_policies", column: "op_name", label: "PTO Policies", refTable: schema.ptoPolicies, refColumn: schema.ptoPolicies.clientName },
    ],
  },
  wsos_clients: {
    refs: [
      { table: "wsos_op_client_assignments", column: "client_name", label: "Assignments", refTable: schema.assignments, refColumn: schema.assignments.clientName },
      { table: "wsos_pto_policies", column: "client_name", label: "PTO Policies", refTable: schema.ptoPolicies, refColumn: schema.ptoPolicies.clientName },
      { table: "wa_onboarding_steps", column: "client_name", label: "Onboarding Steps", refTable: schema.onboardingSteps, refColumn: schema.onboardingSteps.clientName },
      { table: "wa_post_90day_schedule", column: "client_name", label: "Check-in Schedule", refTable: schema.checkinSchedule, refColumn: schema.checkinSchedule.clientName },
      { table: "wa_existing_accounts", column: "client_name", label: "Existing Accounts", refTable: schema.existingAccounts, refColumn: schema.existingAccounts.clientName },
      { table: "wa_ob_records", column: "client_name", label: "Onboarding Records", refTable: schema.obRecords, refColumn: schema.obRecords.clientName },
    ],
  },
  wa_cs_staff: {
    refs: [
      { table: "wsos_op_client_assignments", column: "cs_staff_name", label: "Assignments", refTable: schema.assignments, refColumn: schema.assignments.csStaffName },
      { table: "wa_onboarding_steps", column: "cs_staff_name", label: "Onboarding Steps", refTable: schema.onboardingSteps, refColumn: schema.onboardingSteps.csStaffName },
      { table: "wa_post_90day_schedule", column: "cs_staff_name", label: "Check-in Schedule", refTable: schema.checkinSchedule, refColumn: schema.checkinSchedule.csStaffName },
      { table: "wa_ob_step_defs", column: "cs_staff_name", label: "OB Step Definitions", refTable: schema.obStepDefs, refColumn: schema.obStepDefs.csStaffName },
      { table: "wa_ob_records", column: "cs_staff_name", label: "Onboarding Records", refTable: schema.obRecords, refColumn: schema.obRecords.csStaffName },
    ],
  },
  wa_ob_records: {
    refs: [
      { table: "wa_ob_statuses", column: "record_id", label: "OB Step Statuses", refTable: schema.obStatuses, refColumn: schema.obStatuses.recordId },
    ],
  },
}

export interface BlockerInfo {
  table: string
  column: string
  label: string
  count: number
}

export function getFkBlockers(entity: string, nameValue: string | number): BlockerInfo[] {
  const def = FK_MAP[entity]
  if (!def) return []

  const db = getDrizzle()
  const results: BlockerInfo[] = []

  for (const ref of def.refs) {
    try {
      const row = db.select({ c: count() }).from(ref.refTable)
        .where(eq(ref.refColumn, nameValue as any))
        .get()
      if (row && row.c > 0) {
        results.push({ table: ref.table, column: ref.column, label: ref.label, count: row.c })
      }
    } catch {
      // Table doesn't exist in this database — skip it
    }
  }

  return results
}
