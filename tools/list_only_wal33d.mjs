// Listet alle enriched Codes mit nur Wal33D als Quelle.
// Format: code TAB title.en — zum Sortieren/Gruppieren.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const dir = "C:/Claude/_projekte/obdex/data/generic";
const files = readdirSync(dir).filter(f => f.endsWith("_enriched.yaml"));

for (const file of files) {
  const codes = parse(readFileSync(join(dir, file), "utf8")) || [];
  for (const c of codes) {
    const sources = c.sources || [];
    if (sources.length === 1 && sources[0].includes("Wal33D")) {
      console.log(`${c.code}\t${c.title?.en || ""}`);
    }
  }
}
