// Phase 1 — löst "Same as Pxxxx"-Querverweise auf, indem die Anker-Description
// kopiert und systematisch adaptiert wird (Bank 1 → Bank 2, Sensor X → Sensor Y,
// Cylinder N → Cylinder M, A → B/C/...).
//
// Schreibt die enriched-YAMLs in-place neu. Erhält die übrige Formatierung.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const dir = "C:/Claude/_projekte/obdex/data/generic";
const files = readdirSync(dir).filter(f => f.endsWith("_enriched.yaml"));

// Schritt 1: alle Codes (Anker-Material) sammeln
const codeMap = {};
for (const file of files) {
  const codes = parse(readFileSync(join(dir, file), "utf8")) || [];
  for (const c of codes) {
    codeMap[c.code] = {
      title: c.title || {},
      descEn: c.description?.en || "",
      descDe: c.description?.de || "",
      sources: c.sources || []
    };
  }
}
console.log(`Loaded ${Object.keys(codeMap).length} codes total`);

// Schritt 2: Adaption-Logik
// Erkennt aus dem Title des Querverweis-Codes vs. Anker-Title welche Variation gilt,
// und ersetzt entsprechend im Anker-Text.
function adaptText(ankerText, ankerTitle, currentTitle) {
  if (!ankerText) return ankerText;
  let out = ankerText;

  // Bank-Variation
  const bankPattern = /Bank (\d)/i;
  const ankerBank = ankerTitle.match(bankPattern)?.[1];
  const currentBank = currentTitle.match(bankPattern)?.[1];
  if (ankerBank && currentBank && ankerBank !== currentBank) {
    out = out.replace(/bank 1/gi, m => m[0] === "B" ? `Bank ${currentBank}` : `bank ${currentBank}`);
  }

  // Sensor-Variation (Sensor 1 → Sensor N) — auch O2-spezifische Pre/Post-Cat Adaption
  const sensorPattern = /Sensor (\d)/i;
  const ankerSensor = ankerTitle.match(sensorPattern)?.[1];
  const currentSensor = currentTitle.match(sensorPattern)?.[1];
  if (ankerSensor && currentSensor && ankerSensor !== currentSensor) {
    out = out.replace(new RegExp(`sensor ${ankerSensor}`, "gi"),
      m => m[0] === "S" ? `Sensor ${currentSensor}` : `sensor ${currentSensor}`);
    // O2-Sensor-Position: Sensor 1 = vor Kat, Sensor 2 = nach Kat
    if (ankerSensor === "1" && currentSensor === "2") {
      out = out.replace(/pre-cat/gi, "post-cat");
      out = out.replace(/Vorkatalysator/g, "Nachkatalysator");
      out = out.replace(/Vor-Kat/g, "Nach-Kat");
    } else if (ankerSensor === "2" && currentSensor === "1") {
      out = out.replace(/post-cat/gi, "pre-cat");
      out = out.replace(/Nachkatalysator/g, "Vorkatalysator");
      out = out.replace(/Nach-Kat/g, "Vor-Kat");
    }
  }

  // Cylinder-Variation (Cylinder 1 → Cylinder N) — Pattern erkennt EN und DE
  const cylPattern = /(?:[Cc]ylinder|[Zz]ylinder) (\d{1,2})/;
  const ankerCyl = ankerTitle.match(cylPattern)?.[1];
  const currentCyl = currentTitle.match(cylPattern)?.[1];
  if (ankerCyl && currentCyl && ankerCyl !== currentCyl) {
    out = out.replace(/cylinder \d{1,2}/gi, m => m[0] === "C" ? `Cylinder ${currentCyl}` : `cylinder ${currentCyl}`);
    out = out.replace(/Zylinder \d{1,2}/g, `Zylinder ${currentCyl}`);
  }

  // Single-Letter-Variation für Module/Sensor/Bus/Aktuator (EN+DE separat).
  // Extrahiert aus EN-Title und DE-Title jeweils einen Letter und ersetzt im
  // entsprechenden Text. Dadurch funktioniert es für beliebige Komposita
  // (z. B. "Schnittstellen-Modul A" → "Schnittstellen-Modul F").
  const letterMatchers = [
    { word: "Sensor",   re: /Sensor ([A-Z])(?=\b|$)/ },
    { word: "Module",   re: /Module ([A-Z])(?=\b|$)/ },
    { word: "Bus",      re: /Bus ([A-Z])(?=\b|$)/ },
    { word: "Actuator", re: /Actuator ([A-Z])(?=\b|$)/ }
  ];
  const deWordMatchers = [
    { word: "Sensor",   re: /[Ss]ensor ([A-Z])(?=\b|$)/ },
    { word: "Modul",    re: /[Mm]odul ([A-Z])(?=\b|$)/ },
    { word: "Bus",      re: /[Bb]us ([A-Z])(?=\b|$)/ },
    { word: "Aktuator", re: /[Aa]ktuator ([A-Z])(?=\b|$)/ }
  ];

  // Wir adaptieren den AKTUELLEN Sprach-Text mit den AKTUELLEN Sprach-Titles
  // — d. h. für EN nutze Anker-EN-Title und current-EN-Title; für DE analog.
  // adaptText() wird zweimal aufgerufen (einmal für EN, einmal für DE) — wir wissen
  // hier aber nicht welche Sprache. Trick: wir erkennen es, indem wir beide
  // Pattern-Sets probieren und nur ersetzen wenn die Words im Text vorkommen.

  // EN-Patterns
  for (const { word, re } of letterMatchers) {
    const ankerLetter = ankerTitle.match(re)?.[1];
    const currentLetter = currentTitle.match(re)?.[1];
    if (ankerLetter && currentLetter && ankerLetter !== currentLetter) {
      const re1 = new RegExp(`\\b${word} ${ankerLetter}\\b`, "g");
      const re2 = new RegExp(`\\b${word.toLowerCase()} ${ankerLetter}\\b`, "g");
      out = out.replace(re1, `${word} ${currentLetter}`);
      out = out.replace(re2, `${word.toLowerCase()} ${currentLetter}`);
    }
  }
  // DE-Patterns (Title-Letters könnten dieselben sein, da Title-Letter ist sprach-unabhängig)
  for (const { word, re } of deWordMatchers) {
    const ankerLetter = ankerTitle.match(re)?.[1];
    const currentLetter = currentTitle.match(re)?.[1];
    if (ankerLetter && currentLetter && ankerLetter !== currentLetter) {
      const re1 = new RegExp(`\\b${word} ${ankerLetter}\\b`, "g");
      out = out.replace(re1, `${word} ${currentLetter}`);
      // Auch in deutschen Komposita ohne Wortgrenze davor (z. B. "Kommunikationsbus K")
      const re2 = new RegExp(`${word.toLowerCase()} ${ankerLetter}\\b`, "g");
      out = out.replace(re2, `${word.toLowerCase()} ${currentLetter}`);
    }
  }

  return out;
}

// Schritt 3: pro Datei die "Same as"-Codes finden und ersetzen
let totalReplaced = 0;
const errors = [];
for (const file of files) {
  let text = readFileSync(join(dir, file), "utf8");
  const codes = parse(text) || [];

  for (const c of codes) {
    const en = c.description?.en?.trim() || "";
    const m = en.match(/^Same (?:as|fault as|behaviour as|behavior as) ([PBCU][0-9A-F]{4})/i);
    if (!m) continue;

    const anker = m[1];
    const ankerData = codeMap[anker];
    if (!ankerData) {
      errors.push(`${c.code}: anchor ${anker} not found`);
      continue;
    }

    const newEn = adaptText(ankerData.descEn, ankerData.title.en || "", c.title?.en || "");
    const newDe = adaptText(ankerData.descDe, ankerData.title.de || "", c.title?.de || "");

    if (!newEn || !newDe) {
      errors.push(`${c.code}: empty adapted text from anchor ${anker}`);
      continue;
    }

    // Text-Replace im rohen YAML
    // Ersetze die description.en-Zeile (eindeutig pro Block durch vorangehenden code-Block)
    const blockStart = text.indexOf(`- code: ${c.code}\n`);
    if (blockStart < 0) { errors.push(`${c.code}: block not found`); continue; }
    const blockEnd = text.indexOf("\n- code:", blockStart + 1);
    const blockText = blockEnd > 0 ? text.slice(blockStart, blockEnd) : text.slice(blockStart);

    const enLineMatch = blockText.match(/(\n    en: )(.+)/);
    if (!enLineMatch) { errors.push(`${c.code}: no description.en line`); continue; }

    // Achtung: Neuer Text könnte Sonderzeichen haben — in YAML als Block-Skalar oder gequotet
    const escEn = newEn.replace(/'/g, "''");
    const escDe = newDe.replace(/'/g, "''");

    // Wir suchen die description-Zeilen im Block: "  description:\n    en: ...\n    de: ..."
    // und ersetzen die en/de-Werte.
    const newBlockText = blockText.replace(
      /(  description:\n    en: )(.+?)(\n    de: )(.+?)(\n  affected_components|\n  common_causes|\n  repair|\n  flags|\n  references|\n  sources)/s,
      (_, p1, _en, p3, _de, p5) => `${p1}'${escEn}'${p3}'${escDe}'${p5}`
    );

    if (newBlockText === blockText) {
      errors.push(`${c.code}: regex did not match — description block format may differ`);
      continue;
    }

    text = blockEnd > 0 ? text.slice(0, blockStart) + newBlockText + text.slice(blockEnd) : text.slice(0, blockStart) + newBlockText;
    totalReplaced++;
  }

  writeFileSync(join(dir, file), text, "utf8");
  console.log(`${file}: processed`);
}

console.log(`\nTotal replaced: ${totalReplaced}`);
if (errors.length) {
  console.log(`\nErrors (${errors.length}):`);
  for (const e of errors.slice(0, 30)) console.log(`  ${e}`);
}
