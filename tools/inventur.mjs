// Inventur der enriched Codes:
// - Wie viele Codes haben "Same as" in description.en?
// - Wie viele haben NUR Wal33D in sources?
// - Wie viele haben Wikipedia, wie viele andere Quellen?

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const dir = "C:/Claude/_projekte/obdex/data/generic";
const files = readdirSync(dir).filter(f => f.endsWith("_enriched.yaml"));

let total = 0;
let sameAs = 0;
let onlyWal33D = 0;
let hasWikipedia = 0;
let noSources = 0;
const sameAsCodes = [];
const onlyWal33DCodes = [];

for (const file of files) {
  const codes = parse(readFileSync(join(dir, file), "utf8")) || [];
  for (const c of codes) {
    total++;
    const desc = c.description?.en || "";
    if (/^Same (as|fault as|behaviour as|behavior as) [PBCU]/i.test(desc.trim())) {
      sameAs++;
      sameAsCodes.push(c.code);
    }
    const sources = c.sources || [];
    if (sources.length === 0) noSources++;
    const hasWiki = sources.some(s => s.includes("wikipedia.org"));
    const hasWal33D = sources.some(s => s.includes("Wal33D"));
    if (hasWiki) hasWikipedia++;
    if (sources.length === 1 && hasWal33D) {
      onlyWal33D++;
      onlyWal33DCodes.push(c.code);
    }
  }
}

console.log(`Total enriched codes:          ${total}`);
console.log(`With "Same as Xxxx" in desc:   ${sameAs}`);
console.log(`Sources contain Wikipedia:     ${hasWikipedia}`);
console.log(`Sources only contain Wal33D:   ${onlyWal33D}`);
console.log(`No sources at all:             ${noSources}`);
console.log();
console.log(`First 15 "Same as" codes:      ${sameAsCodes.slice(0, 15).join(", ")}`);
console.log();
console.log(`First 15 only-Wal33D codes:    ${onlyWal33DCodes.slice(0, 15).join(", ")}`);
