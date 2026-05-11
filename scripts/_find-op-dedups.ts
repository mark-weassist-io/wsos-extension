import { readFileSync } from "fs"
import { join } from "path"

const dir = join(import.meta.dir, "..", "data", "clean")
const ops: any[] = JSON.parse(readFileSync(join(dir, "ops.json"), "utf-8"))
const names = ops.map(o => o.full_name).sort()

console.log("=== RAW OP NAME COLLISION SCAN ===\n")
console.log("Scanning for names that share the first 2+ words:\n")

const prefixMap = new Map<string, string[]>()
for (const n of names) {
  const words = n.split(" ")
  if (words.length < 2) continue
  const p2 = words.slice(0, 2).join(" ").toLowerCase()
  if (!prefixMap.has(p2)) prefixMap.set(p2, [])
  prefixMap.get(p2)!.push(n)
}

let found = 0
for (const [prefix, group] of prefixMap) {
  if (group.length > 1) {
    // Only flag if names are actually different strings
    const unique = [...new Set(group)]
    if (unique.length > 1) {
      found++
      console.log(`  ${prefix}:`)
      for (const n of unique) console.log(`    "${n}"`)
    }
  }
}

console.log(`\nTotal collision groups: ${found}`)

console.log("\n=== CHECKING SPECIFIC CASES ===")
const checks = ["Race Jay", "Arlyn", "Rowenna", "Marvin", "Ma.", "Angela", "Angelica", "Eugene", "John", "Justine", "Justine Marie", "Kathleen", "Michael", "Richard", "Wendell"]
for (const c of checks) {
  const matching = names.filter(n => n.toLowerCase().startsWith(c.toLowerCase()))
  if (matching.length > 1) {
    console.log(`  "${c}": ${matching.map(n => `"${n}"`).join(", ")}`)
  }
}
