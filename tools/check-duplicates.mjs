import { readFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
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

const codeFiles = [
  ...walk(join(root, "data/generic")),
  ...walk(join(root, "data/manufacturers")).filter(f => !basename(f).startsWith("_"))
];

for (const file of codeFiles) {
  for (const item of loadArray(file)) {
    if (!item.code) continue;
    const scope = item.scope === "manufacturer" ? `manufacturer:${item.manufacturer}` : "generic";
    const key = `${scope}:${item.code}`;
    if (seen.has(key)) {
      errors.push(`Duplicate ${key}: ${seen.get(key)} and ${file}`);
    } else {
      seen.set(key, file);
    }
  }
}

if (errors.length) {
  for (const e of errors) console.error(e);
  process.exit(1);
}

console.log(`OK: ${seen.size} unique codes`);
