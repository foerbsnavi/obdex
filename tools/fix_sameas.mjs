// Phase 1 — löst "Same as Pxxxx"-Querverweise auf, indem die Anker-Description
// kopiert und systematisch adaptiert wird (Bank 1 → Bank 2, Sensor X → Sensor Y,
// Cylinder N → Cylinder M, A → B/C/...).
//
// Schreibt die enriched-YAMLs in-place neu. Erhält die übrige Formatierung.
//
// Erweiterungen (2026-05-04):
// - Bindestrich-Komposita unterstützt: "Zylinder-1-X" → "Zylinder N-X"
// - Genitiv-Formen: "Zündsignals A", "Profilstellers A", "Sensors A"
//
// NICHT rekursiv: cascading "Same as" wird übersprungen, weil häufig
// Antonym-Modifier ("but stuck low") oder Bank-Twist die Adaption verfälschen.
// Cascading-Codes müssen manuell ausgeschrieben werden.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const root = fileURLToPath(new URL("..", import.meta.url));
const dir = join(root, "data/generic");
const files = readdirSync(dir).filter(f => f.endsWith("_enriched.yaml"));

// Schritt 1: alle Codes (Anker-Material) sammeln
function buildCodeMap() {
  const map = {};
  for (const file of files) {
    const codes = parse(readFileSync(join(dir, file), "utf8")) || [];
    for (const c of codes) {
      map[c.code] = {
        title: c.title || {},
        descEn: c.description?.en || "",
        descDe: c.description?.de || "",
        sources: c.sources || []
      };
    }
  }
  return map;
}

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
  // Erweitert: auch Bindestrich-Komposita "Zylinder-N-X" und "Zylinder-N-Injektor" etc.
  const cylPattern = /(?:[Cc]ylinder|[Zz]ylinder)[-\s](\d{1,2})/;
  const ankerCyl = ankerTitle.match(cylPattern)?.[1];
  const currentCyl = currentTitle.match(cylPattern)?.[1];
  if (ankerCyl && currentCyl && ankerCyl !== currentCyl) {
    // EN: Leerzeichen-Form "cylinder N"
    out = out.replace(/cylinder \d{1,2}/gi, m => m[0] === "C" ? `Cylinder ${currentCyl}` : `cylinder ${currentCyl}`);
    // DE: Leerzeichen-Form "Zylinder N"
    out = out.replace(/Zylinder \d{1,2}/g, `Zylinder ${currentCyl}`);
    // DE: Bindestrich-Form "Zylinder-N-..." (alte Schreibweise vor Welle 25)
    out = out.replace(/Zylinder-\d{1,2}-/g, `Zylinder ${currentCyl} `);
  }

  // Single-Letter-Variation für Module/Sensor/Bus/Aktuator (EN+DE separat).
  // Extrahiert aus EN-Title und DE-Title jeweils einen Letter und ersetzt im
  // entsprechenden Text. Dadurch funktioniert es für beliebige Komposita
  // (z. B. "Schnittstellen-Modul A" → "Schnittstellen-Modul F").
  const letterMatchers = [
    { word: "Sensor",   re: /Sensor ([A-Z])(?=\b|$)/ },
    { word: "Module",   re: /Module ([A-Z])(?=\b|$)/ },
    { word: "Bus",      re: /Bus ([A-Z])(?=\b|$)/ },
    { word: "Actuator", re: /Actuator ([A-Z])(?=\b|$)/ },
    { word: "Ignition", re: /Ignition ([A-Z])(?=\b|$)/ },
    { word: "Camshaft", re: /Camshaft ([A-Z])(?=\b|$)/ }
  ];
  const deWordMatchers = [
    // Inkl. Genitiv-Form: Sensors, Moduls, Bus(ses), Aktuators, Profilstellers, Zündsignals
    { word: "Sensor",         genitiv: "Sensors",        re: /[Ss]ensor[s]? ([A-Z])(?=\b|$)/ },
    { word: "Modul",          genitiv: "Moduls",         re: /[Mm]odul[s]? ([A-Z])(?=\b|$)/ },
    { word: "Bus",            genitiv: "Busses",         re: /[Bb]us(?:ses)? ([A-Z])(?=\b|$)/ },
    { word: "Aktuator",       genitiv: "Aktuators",      re: /[Aa]ktuator[s]? ([A-Z])(?=\b|$)/ },
    { word: "Profilsteller",  genitiv: "Profilstellers", re: /[Pp]rofilsteller[s]? ([A-Z])(?=\b|$)/ },
    { word: "Zündsignal",     genitiv: "Zündsignals",    re: /[Zz]ündsignal[s]? ([A-Z])(?=\b|$)/ },
    { word: "Zündung",        genitiv: null,             re: /[Zz]ündung ([A-Z])(?=\b|$)/ },
    { word: "Nockenwelle",    genitiv: null,             re: /[Nn]ockenwelle ([A-Z])(?=\b|$)/ }
  ];

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
  for (const { word, genitiv, re } of deWordMatchers) {
    const ankerLetter = ankerTitle.match(re)?.[1];
    const currentLetter = currentTitle.match(re)?.[1];
    if (ankerLetter && currentLetter && ankerLetter !== currentLetter) {
      // Nominativ (Wort + Letter)
      const re1 = new RegExp(`\\b${word} ${ankerLetter}\\b`, "g");
      out = out.replace(re1, `${word} ${currentLetter}`);
      // Klein-Variante (z. B. "des sensors A" — selten, aber möglich)
      const re2 = new RegExp(`${word.toLowerCase()} ${ankerLetter}\\b`, "g");
      out = out.replace(re2, `${word.toLowerCase()} ${currentLetter}`);
      // Genitiv-Form (z. B. "Zündsignals A")
      if (genitiv) {
        const re3 = new RegExp(`\\b${genitiv} ${ankerLetter}\\b`, "g");
        out = out.replace(re3, `${genitiv} ${currentLetter}`);
      }
    }
  }

  return out;
}

// Schritt 3: pro Datei die "Same as"-Codes finden und ersetzen.
// Bewusst nicht rekursiv — Anker, der selbst "Same as" ist, wird übersprungen.
const codeMap = buildCodeMap();
console.log(`Loaded ${Object.keys(codeMap).length} codes total`);

let totalReplaced = 0;
const errors = [];
const cascadingSkipped = [];

for (const file of files) {
  let text = readFileSync(join(dir, file), "utf8");
  const codes = parse(text) || [];

  for (const c of codes) {
    const en = c.description?.en?.trim() || "";
    const de = c.description?.de?.trim() || "";
    const m = en.match(/^Same (?:as|fault as|behaviour as|behavior as) ([PBCU][0-9A-F]{4})\b(.*)/is);
    if (!m) continue;

    const anker = m[1];
    const tail = (m[2] || "").trim();
    const ankerData = codeMap[anker];
    if (!ankerData) {
      errors.push(`${c.code}: anchor ${anker} not found`);
      continue;
    }

    // Antonym-Skip: "Same as Pxxxx but ..." oder "...with the X at upper/lower" sind
    // semantische Verschiebungen (Stuck High vs Low, Too High vs Low) und können nicht
    // automatisch aus dem Anker adaptiert werden — manuell ausschreiben.
    if (/^(?:but|with|though|however)\b/i.test(tail) || /\b(?:jedoch|aber)\b/i.test(de)) {
      cascadingSkipped.push(`${c.code} -> ${anker} (antonym/twist modifier — write manually)`);
      continue;
    }

    // Cascading-Schutz: Wenn Anker selbst ein "Same as" ist, überspringen.
    // Solche Codes brauchen manuelle Auflösung weil sie meist Antonym-Modifier
    // ("but stuck low") oder Sensor-Verschiebungen tragen, die die Adaption nicht
    // automatisch korrekt hinbekommt.
    if (/^Same (?:as|fault as|behaviour as|behavior as) [PBCU]/i.test(ankerData.descEn.trim())) {
      cascadingSkipped.push(`${c.code} -> ${anker} (anchor itself is Same-as)`);
      continue;
    }

    const newEn = adaptText(ankerData.descEn, ankerData.title.en || "", c.title?.en || "");
    const newDe = adaptText(ankerData.descDe, ankerData.title.de || "", c.title?.de || "");

    if (!newEn || !newDe) {
      errors.push(`${c.code}: empty adapted text from anchor ${anker}`);
      continue;
    }

    const blockStart = text.indexOf(`- code: ${c.code}\n`);
    if (blockStart < 0) { errors.push(`${c.code}: block not found`); continue; }
    const blockEnd = text.indexOf("\n- code:", blockStart + 1);
    const blockText = blockEnd > 0 ? text.slice(blockStart, blockEnd) : text.slice(blockStart);

    const enLineMatch = blockText.match(/(\n    en: )(.+)/);
    if (!enLineMatch) { errors.push(`${c.code}: no description.en line`); continue; }

    const escEn = newEn.replace(/'/g, "''");
    const escDe = newDe.replace(/'/g, "''");

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
if (cascadingSkipped.length) {
  console.log(`\nCascading Same-as skipped (${cascadingSkipped.length}) — write manually:`);
  for (const s of cascadingSkipped.slice(0, 10)) console.log(`  ${s}`);
  if (cascadingSkipped.length > 10) console.log(`  ... and ${cascadingSkipped.length - 10} more`);
}
if (errors.length) {
  console.log(`\nErrors (${errors.length}):`);
  for (const e of errors.slice(0, 30)) console.log(`  ${e}`);
}
