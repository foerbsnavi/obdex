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

const seen = new Map();
const errors = [];

for (const file of walk(join(root, "data/generic"))) {
  for (const item of loadArray(file)) {
    if (!item.code) continue;
    if (seen.has(item.code)) {
      errors.push(`Duplicate ${item.code}: ${seen.get(item.code)} and ${file}`);
    } else {
      seen.set(item.code, file);
    }
  }
}

if (errors.length) {
  for (const e of errors) console.error(e);
  process.exit(1);
}

console.log(`OK: ${seen.size} unique codes`);
