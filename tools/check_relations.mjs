// Konsistenzprüfung: zeigen alle related_codes-Verweise auf existierende Codes?
// Schema validiert nur das Format ([PBCU][0-3][0-9A-F]{3}), nicht die Existenz.
// Codes können auch auf andere Familien verweisen (z. B. P-Code → U-Code).
//
// Exit 0 = alles ok. Exit 1 = mindestens ein dangling Verweis.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const root = fileURLToPath(new URL("..", import.meta.url));

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.name.endsWith(".yaml")) out.push(p);
  }
  return out;
}

function loadArray(file) {
  const parsed = parse(readFileSync(file, "utf8"));
  return Array.isArray(parsed) ? parsed : [];
}

const allCodes = new Set();
const codesWithRelations = [];

for (const file of walk(join(root, "data/generic"))) {
  for (const item of loadArray(file)) {
    if (!item.code) continue;
    allCodes.add(item.code);
    if (Array.isArray(item.related_codes) && item.related_codes.length) {
      codesWithRelations.push({ code: item.code, related: item.related_codes, file });
    }
  }
}

const dangling = [];
const selfRefs = [];
let totalRelations = 0;

for (const { code, related, file } of codesWithRelations) {
  for (const ref of related) {
    totalRelations++;
    if (ref === code) {
      selfRefs.push({ code, file });
      continue;
    }
    if (!allCodes.has(ref)) {
      dangling.push({ code, ref, file });
    }
  }
}

console.log(`Codes total:                 ${allCodes.size}`);
console.log(`Codes with related_codes:    ${codesWithRelations.length}`);
console.log(`Total related_codes refs:    ${totalRelations}`);
console.log(`Self-references:             ${selfRefs.length}`);
console.log(`Dangling references:         ${dangling.length}`);

if (selfRefs.length) {
  console.log(`\nSelf-references:`);
  for (const { code, file } of selfRefs.slice(0, 20)) {
    console.log(`  ${code} -> ${code}  (${file})`);
  }
  if (selfRefs.length > 20) console.log(`  ... and ${selfRefs.length - 20} more`);
}

if (dangling.length) {
  console.log(`\nDangling references:`);
  for (const { code, ref, file } of dangling.slice(0, 30)) {
    console.log(`  ${code} -> ${ref}  (not found, ${file})`);
  }
  if (dangling.length > 30) console.log(`  ... and ${dangling.length - 30} more`);
  process.exit(1);
}

if (selfRefs.length) process.exit(1);

console.log(`\nOK: all related_codes resolve to existing codes`);
