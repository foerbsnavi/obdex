import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { join, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");

mkdirSync(dist, { recursive: true });
mkdirSync(join(dist, "by-manufacturer"), { recursive: true });
mkdirSync(join(dist, "pids"), { recursive: true });

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
  if (parsed === null) return [];
  return Array.isArray(parsed) ? parsed : [];
}

const generic = walk(join(root, "data/generic")).flatMap(loadArray);

const manufacturerDir = join(root, "data/manufacturers");
const manufacturers = {};
const manufacturerMeta = [];
for (const entry of readdirSync(manufacturerDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  manufacturers[entry.name] = walk(join(manufacturerDir, entry.name))
    .filter(f => !basename(f).startsWith("_"))
    .flatMap(loadArray);
  const metaPath = join(manufacturerDir, entry.name, "_meta.yaml");
  try {
    const parsed = parse(readFileSync(metaPath, "utf8"));
    if (parsed?.manufacturer) manufacturerMeta.push(parsed.manufacturer);
  } catch {
    // _meta.yaml is optional; missing file is not an error
  }
}

const pidsRoot = join(root, "data/pids");
const pidsByMode = {};
const pidsByManufacturer = {};
for (const f of walk(pidsRoot)) {
  const rel = relative(pidsRoot, f).replace(/\\/g, "/");
  const key = basename(f, ".yaml");
  if (rel.startsWith("manufacturers/")) {
    pidsByManufacturer[key] = loadArray(f);
  } else {
    pidsByMode[key] = loadArray(f);
  }
}

const all = {
  generic,
  manufacturers,
  pids: { ...pidsByMode, manufacturers: pidsByManufacturer }
};

const meta = {
  generated_at: new Date().toISOString(),
  counts: {
    generic: generic.length,
    manufacturers: Object.fromEntries(Object.entries(manufacturers).map(([k, v]) => [k, v.length])),
    pids: Object.fromEntries(Object.entries(pidsByMode).map(([k, v]) => [k, v.length])),
    pids_manufacturers: Object.fromEntries(Object.entries(pidsByManufacturer).map(([k, v]) => [k, v.length]))
  }
};

function writePair(file, data) {
  writeFileSync(`${file}.json`, JSON.stringify(data, null, 2));
  writeFileSync(`${file}.min.json`, JSON.stringify(data));
}

writePair(join(dist, "all"), all);
writePair(join(dist, "generic"), generic);
writePair(join(dist, "manufacturers"), manufacturerMeta);
writeFileSync(join(dist, "meta.json"), JSON.stringify(meta, null, 2));

for (const [id, codes] of Object.entries(manufacturers)) {
  writePair(join(dist, "by-manufacturer", id), codes);
}

for (const [mode, pids] of Object.entries(pidsByMode)) {
  writePair(join(dist, "pids", mode), pids);
}

if (Object.keys(pidsByManufacturer).length) {
  mkdirSync(join(dist, "pids/manufacturers"), { recursive: true });
  for (const [id, pids] of Object.entries(pidsByManufacturer)) {
    writePair(join(dist, "pids/manufacturers", id), pids);
  }
}

console.log(JSON.stringify(meta.counts, null, 2));
