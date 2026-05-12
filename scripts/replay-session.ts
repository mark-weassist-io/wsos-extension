import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";

const SESSION_FILE = resolve(import.meta.dir, "..", "session-ses_1e78.md");
const OLD_PREFIX = "D:\\dev-wrapper\\repositories\\weassist\\apps\\wsos-extension";
const NEW_PREFIX = "D:\\dev-wrapper\\repositories\\weassist\\apps\\nexus";

interface EditOp { type: "edit"; filePath: string; newString: string; oldString: string }
interface WriteOp { type: "write"; filePath: string; content: string }
type FileOp = EditOp | WriteOp;

function normalize(text: string): string {
  return text.replace(/\u2014|\u2013/g, "-").replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, "\"").replace(/\u00a0/g, " ").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function extractOps(markdown: string): FileOp[] {
  const ops: FileOp[] = [];
  const sections = markdown.split(/\r?\n---+[\r\n]+/);
  for (const section of sections) {
    if (!section.includes("**Tool: edit**") && !section.includes("**Tool: write**")) continue;
    const jsonMatch = section.match(/```json\r?\n([\s\S]*?)```/);
    if (!jsonMatch) continue;
    try {
      const raw = jsonMatch[1].trim().replace(/\r/g, "");
      const parsed = JSON.parse(raw);
      const fp: string = parsed.filePath;
      if (!fp || !fp.includes("wsos-extension")) continue;
      if (section.includes("**Tool: edit**") && parsed.oldString && parsed.newString !== undefined)
        ops.push({ type: "edit", filePath: fp, oldString: parsed.oldString, newString: parsed.newString });
      else if (section.includes("**Tool: write**") && parsed.content)
        ops.push({ type: "write", filePath: fp, content: parsed.content });
    } catch (_) {}
  }
  return ops;
}

function remapPath(fp: string) { return fp.replace(OLD_PREFIX, NEW_PREFIX); }

function main() {
  const markdown = readFileSync(SESSION_FILE, "utf-8");
  const ops = extractOps(markdown);
  console.log(`Extracted ${ops.length} operations\n`);

  // Group by file
  const byFile = new Map<string, FileOp[]>();
  for (const op of ops) {
    const key = remapPath(op.filePath);
    if (!byFile.has(key)) byFile.set(key, []);
    byFile.get(key)!.push(op);
  }

  let applied = 0, skipped = 0;

  for (const [filePath, fileOps] of byFile) {
    console.log(`────────────────────────────────────────`);
    console.log(`FILE: ${filePath}`);
    console.log(`────────────────────────────────────────`);

    if (fileOps.length === 1 && fileOps[0].type === "write") {
      const op = fileOps[0] as WriteOp;
      const target = remapPath(op.filePath);
      const parent = dirname(target);
      if (!existsSync(parent)) mkdirSync(parent, { recursive: true });
      writeFileSync(target, op.content, "utf-8");
      console.log(`  ✓ WRITE applied (${op.content.length} bytes)`);
      applied++;
      continue;
    }

    if (filePath.includes("package.json")) {
      const current = readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(current);
      if (parsed.name === "nexus") {
        console.log(`  ~ Rename already applied (name: "${parsed.name}")`);
        skipped++;
        continue;
      }
    }

    if (filePath.includes("build-db.ts")) {
      const op = fileOps[0] as EditOp;
      const normalizedOld = normalize(op.oldString);
      const currentNorm = normalize(readFileSync(filePath, "utf-8"));
      if (currentNorm.includes(normalizedOld)) {
        const content = readFileSync(filePath, "utf-8");
        const eol = content.includes("\r\n") ? "\r\n" : "\n";
        const result = content.replace(normalize(content).indexOf(normalizedOld), normalize(op.oldString).length);
        // Can't use string position - reconstruct manually
        console.log(`  ~ CAN APPLY: oldString found after normalization`);
        console.log(`  ~ Manual step: add milestone import code after data quality gate`);
        console.log(`  ~ See "session-edits-reference.json" for the newString content`);
        skipped++;
      } else {
        console.log(`  ✗ CAN'T MATCH: expected oldString not found in file`);
        skipped++;
      }
      continue;
    }

    if (filePath.includes("layout.tsx")) {
      console.log(`  ✗ ${fileOps.length} edits - all SKIPPED (base file doesn't have Bootstrap/theme-toggle code)`);
      console.log(`  Extracted edit newStrings available in reference file for manual porting`);
      skipped += fileOps.length;
      continue;
    }

    console.log(`  ? Unhandled file`);
    skipped += fileOps.length;
  }

  console.log(`\n═════════════════════════════════════`);
  console.log(`SUMMARY: ${applied} applied, ${skipped} skipped of ${ops.length} total`);

  // Write reference JSON with all edit payloads
  const ref = ops.map(op => {
    if (op.type === "write")
      return { type: "write", filePath: remapPath(op.filePath), content: op.content };
    return { type: "edit", filePath: remapPath(op.filePath), oldString: op.oldString, newString: op.newString };
  });
  const refPath = resolve(import.meta.dir, "..", "session-edits-reference.json");
  writeFileSync(refPath, JSON.stringify(ref, null, 2), "utf-8");
  console.log(`Reference: ${refPath}`);
}

main();
