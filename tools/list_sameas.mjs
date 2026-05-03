// Listet alle Codes mit "Same as Xxxx" in description.en oder .de.
// Zeigt: Code | Title.en | Description.en
// Für die Querverweis-Politur (Phase 1).

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const dir = "C:/Claude/_projekte/obdex/data/generic";
const files = readdirSync(dir).filter(f => f.endsWith("_enriched.yaml"));

const found = [];

for (const file of files) {
  const codes = parse(readFileSync(join(dir, file), "utf8")) || [];
  for (const c of codes) {
    const en = c.description?.en?.trim() || "";
    const de = c.description?.de?.trim() || "";
    if (/^Same (as|fault as|behaviour as|behavior as) [PBCU]/i.test(en) || /^Wie [PBCU]/i.test(de)) {
      found.push({ code: c.code, file, title: c.title?.en, en, de });
    }
  }
}

for (const f of found) {
  console.log(`${f.code}\t${f.title}\t${f.en}`);
}
console.error(`\n${found.length} codes mit Querverweis`);
