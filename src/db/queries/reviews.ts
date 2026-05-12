import { getDrizzle, schema, getDb } from ".."
import { eq, sql } from "drizzle-orm"

const d = () => getDrizzle()

export interface ReviewRow {
  opName: string
  startDate: string | null
  role: string | null
  clientName: string | null
  csStaffName: string | null
  periods: Record<string, { redFlag: string | null }>
}

export function getReviews(): ReviewRow[] {
  const ops = d().select({
    opName: schema.opCheckinReviews.opName,
    csStaffName: schema.opCheckinReviews.csStaffName,
  }).from(schema.opCheckinReviews)
    .groupBy(schema.opCheckinReviews.opName)
    .all() as any[]

  const all = d().select({
    opName: schema.opCheckinReviews.opName,
    period: schema.opCheckinReviews.period,
    redFlag: schema.opCheckinReviews.redFlag,
    csStaffName: schema.opCheckinReviews.csStaffName,
  }).from(schema.opCheckinReviews).all() as any[]

  const periodsByOp: Record<string, Record<string, { redFlag: string | null }>> = {}
  for (const r of all) {
    if (!periodsByOp[r.opName]) periodsByOp[r.opName] = {}
    periodsByOp[r.opName][r.period] = { redFlag: r.redFlag }
  }

  return ops.map(o => ({
    opName: o.opName,
    startDate: null,
    role: null,
    clientName: null,
    csStaffName: o.csStaffName || null,
    periods: periodsByOp[o.opName] || {},
  }))
}

export function setReview(opName: string, period: string, redFlag: string | null): void {
  const existing = d().select().from(schema.opCheckinReviews)
    .where(sql`${schema.opCheckinReviews.opName} = ${opName} AND ${schema.opCheckinReviews.period} = ${period}`)
    .get()
  if (existing) {
    getDb().prepare("UPDATE op_checkin_reviews SET red_flag = ? WHERE op_name = ? AND period = ?").run(redFlag, opName, period)
  } else {
    getDb().prepare("INSERT INTO op_checkin_reviews (op_name, period, red_flag) VALUES (?, ?, ?)").run(opName, period, redFlag)
  }
}

export function getRedFlagNames(): { name: string; color: string }[] {
  const rows = getDb().prepare("SELECT flag_name, color FROM wa_red_flags WHERE deleted_at IS NULL AND color IS NOT NULL ORDER BY flag_name").all() as any[]
  return rows.map(r => ({ name: r.flag_name, color: r.color || "#ccc" }))
}

export function getReviews(): ReviewRow[] {
  // Get all unique op names with their CS staff from reviews
  const ops = d().select({
    opName: schema.opCheckinReviews.opName,
    csStaffName: schema.opCheckinReviews.csStaffName,
  }).from(schema.opCheckinReviews)
    .groupBy(schema.opCheckinReviews.opName)
    .all() as any[]

  // Get all review rows
  const all = d().select({
    opName: schema.opCheckinReviews.opName,
    period: schema.opCheckinReviews.period,
    redFlag: schema.opCheckinReviews.redFlag,
    csStaffName: schema.opCheckinReviews.csStaffName,
  }).from(schema.opCheckinReviews).all() as any[]

  // Group by op_name
  const periodsByOp: Record<string, Record<string, { redFlag: string | null }>> = {}
  for (const r of all) {
    if (!periodsByOp[r.opName]) periodsByOp[r.opName] = {}
    periodsByOp[r.opName][r.period] = { redFlag: r.redFlag }
  }

  return ops.map(o => ({
    opName: o.opName,
    startDate: null,
    role: null,
    clientName: null,
    csStaffName: o.csStaffName || null,
    periods: periodsByOp[o.opName] || {},
  }))
}
