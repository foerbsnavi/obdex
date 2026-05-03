// Entfernt Codes (Liste aus stdin oder ARG) aus einer YAML-Datendatei.
// Nutzung: node remove_enriched.mjs <yaml-pfad> <enriched-yaml-pfad>
// Liest Codes aus enriched-yaml und entfernt entsprechende Blöcke aus yaml-pfad.

import { readFileSync, writeFileSync } from "node:fs";

const [, , target, source] = process.argv;
if (!target || !source) {
  console.error("Usage: node remove_enriched.mjs <target> <source-with-codes>");
  process.exit(1);
}

const sourceText = readFileSync(source, "utf8");
const codes = new Set();
for (const m of sourceText.matchAll(/^- code:\s*([A-Z][0-9A-F]{4})/gm)) {
  codes.add(m[1]);
}
console.log(`Codes to remove: ${codes.size}`);

const lines = readFileSync(target, "utf8").split(/\r?\n/);
const out = [];
let skipping = false;
let removed = 0;

for (const line of lines) {
  const m = line.match(/^- code:\s*([A-Z][0-9A-F]{4})/);
  if (m) {
    if (codes.has(m[1])) {
      skipping = true;
      removed++;
      continue;
    } else {
      skipping = false;
    }
  } else if (skipping && line.startsWith("- ")) {
    // neuer Block (eigentlich nicht möglich da nur "- code:" passt)
    skipping = false;
  } else if (skipping && line === "") {
    // Leerzeile zwischen Blöcken — nimmt diesen Block mit raus
    continue;
  }
  if (!skipping) out.push(line);
}

writeFileSync(target, out.join("\n"), "utf8");
console.log(`Removed ${removed} entries from ${target}`);
