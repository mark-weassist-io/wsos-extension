import { Database } from "bun:sqlite"
import { join } from "path"

const db = new Database(join(import.meta.dir, "..", "data", "wsos-extension.db"))

// Check if cell formatting has data
const count = (db.prepare("SELECT COUNT(*) as c FROM wa_cell_formatting").get() as any).c
console.log(`wa_cell_formatting rows: ${count}`)

// Get distinct colors used
const colors = db.prepare("SELECT DISTINCT hex_color FROM wa_cell_formatting ORDER BY hex_color").all() as any[]
console.log(`\nDistinct colors:`)
for (const c of colors) console.log(`  ${c.hex_color}`)

// Get color distribution by sheet/tab
const dist = db.prepare("SELECT sheet_name, tab_name, hex_color, COUNT(*) as c FROM wa_cell_formatting GROUP BY sheet_name, tab_name, hex_color ORDER BY c DESC LIMIT 30").all() as any[]
console.log(`\nColor distribution by tab:`)
for (const d of dist) console.log(`  ${d.sheet_name}/${d.tab_name}: ${d.hex_color} x${d.c}`)

// For the onboarding sheet, show header row colors
const onboardingColors = db.prepare(`
  SELECT cf.col_index, cf.hex_color, count(*) as cell_count
  FROM wa_cell_formatting cf
  WHERE cf.sheet_name LIKE '%Onboarding%' AND cf.tab_name LIKE '%Mich%' AND cf.row_index = 0
  GROUP BY cf.col_index, cf.hex_color
  ORDER BY cf.col_index
`).all() as any[]
console.log(`\nHeader row colors (Michelle tab):`)
for (const c of onboardingColors) console.log(`  col ${c.col_index}: ${c.hex_color} (${c.cell_count} cells)`)

// Also check row 0 for Dennis tab
const dennisColors = db.prepare(`
  SELECT cf.col_index, cf.hex_color, count(*) as cell_count
  FROM wa_cell_formatting cf
  WHERE cf.sheet_name LIKE '%Onboarding%' AND cf.tab_name LIKE '%Den%' AND cf.row_index = 0
  GROUP BY cf.col_index, cf.hex_color
  ORDER BY cf.col_index
`).all() as any[]
console.log(`\nHeader row colors (Dennis tab):`)
for (const c of dennisColors) console.log(`  col ${c.col_index}: ${c.hex_color} (${c.cell_count} cells)`)

// Sample some cell backgrounds from the Michelle tab data rows
const dataColors = db.prepare(`
  SELECT cf.row_index, cf.col_index, cf.hex_color
  FROM wa_cell_formatting cf
  WHERE cf.sheet_name LIKE '%Onboarding%' AND cf.tab_name LIKE '%Mich%'
  AND cf.row_index BETWEEN 1 AND 5
  AND cf.hex_color != '#ffffff'
  ORDER BY cf.row_index, cf.col_index
  LIMIT 30
`).all() as any[]
console.log(`\nSample non-white cell colors (rows 1-5, Michelle tab):`)
for (const c of dataColors) {
  const header = db.prepare("SELECT sql FROM sqlite_master WHERE type='table'").get() as any
  console.log(`  row ${c.row_index}, col ${c.col_index}: ${c.hex_color}`)
}

db.close()
