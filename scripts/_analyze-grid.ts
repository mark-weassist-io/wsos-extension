import { Database } from "bun:sqlite"
import { join } from "path"

const db = new Database(join(import.meta.dir, "..", "data", "wsos-extension.db"))

// Decode what each color means in the onboarding checklist
console.log("=== ONBOARDING CHECKLIST COLOR SEMANTICS ===\n")

// Michelle tab - header ownership
const headerOwnership = db.prepare(`
  SELECT cf.col_index, cf.hex_color
  FROM wa_cell_formatting cf
  WHERE cf.sheet_name LIKE '%Onboarding%' AND cf.tab_name LIKE '%Mich%' AND cf.row_index = 0
  AND cf.col_index BETWEEN 6 AND 34
  ORDER BY cf.col_index
`).all() as any[]

// Group by color to find Dennis's steps
const dennisColors = new Set(["#EAD1DC", "#CC0000", "#E06666", "#FF0000"])
const michelleColors = new Set(["#A4C2F4", "#B6D7A8", "#FFF2CC", "#C9DAF8", "#93C47D", "#D9D2E9", "#FF9900", "#00FFFF", "#FFFF00"])

console.log("Header ownership by color:\n")
for (const c of headerOwnership) {
  let owner = "Michelle"
  if (dennisColors.has(c.hex_color.toUpperCase())) owner = "DENNIS"
  if (c.hex_color === "#FFFF00") owner = "Jane/Shared"
  if (c.hex_color === "#FF9900" || c.hex_color === "#00FFFF") owner = "Info"
  console.log(`  col ${c.col_index}: #${c.hex_color.replace('#','')} → ${owner}`)
}

// Row color analysis: gray = cancelled/void, green = complete, yellow = pending
console.log("\nRow 1 (Cancelled, row=1): all cells gray #666666")
console.log("Row 2 (Active, row=2): let's check colors...\n")

const row2Colors = db.prepare(`
  SELECT cf.col_index, cf.hex_color
  FROM wa_cell_formatting cf
  WHERE cf.sheet_name LIKE '%Onboarding%' AND cf.tab_name LIKE '%Mich%' AND cf.row_index = 1
  AND cf.col_index BETWEEN 6 AND 34
  AND cf.hex_color != '#ffffff'
  ORDER BY cf.col_index
`).all() as any[]
console.log(`Row 2 (index=1) non-white cells: ${row2Colors.length}`)
if (row2Colors.length > 0) {
  const sample = row2Colors.slice(0, 5)
  for (const s of sample) console.log(`  col ${s.col_index}: ${s.hex_color}`)
}

// Find green cells (completed steps)
const greenCells = db.prepare(`
  SELECT cf.row_index, cf.col_index, count(*) as c
  FROM wa_cell_formatting cf
  WHERE cf.sheet_name LIKE '%Onboarding%' AND cf.tab_name LIKE '%Mich%'
  AND cf.hex_color IN ('#93C47D', '#B6D7A8', '#D9EAD3', '#B7E1CD')
  GROUP BY cf.row_index
  ORDER BY cf.row_index
  LIMIT 10
`).all() as any[]
console.log(`\nGreen cells (completed) per row (sample):`)
for (const g of greenCells) console.log(`  row ${g.row_index}: ${g.c} green cells`)

// Find orange cells (check-in scheduling)
const orangeCells = db.prepare(`
  SELECT cf.row_index, count(*) as c
  FROM wa_cell_formatting cf
  WHERE cf.sheet_name LIKE '%Onboarding%' AND cf.tab_name LIKE '%Mich%'
  AND cf.hex_color = '#FF9900'
  GROUP BY cf.row_index
  ORDER BY c DESC
  LIMIT 5
`).all() as any[]
console.log(`\nOrange cells (check-in scheduling): top 5 rows`)
for (const o of orangeCells) console.log(`  row ${o.row_index}: ${o.c} orange cells`)

db.close()
