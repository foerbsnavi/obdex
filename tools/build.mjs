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

const totalCodes = generic.length + Object.values(manufacturers).reduce((a, b) => a + b.length, 0);
const totalPids = Object.values(pidsByMode).reduce((a, b) => a + b.length, 0)
  + Object.values(pidsByManufacturer).reduce((a, b) => a + b.length, 0);

const manufacturerLinks = Object.keys(manufacturers).sort()
  .map(id => `      <li><a href="by-manufacturer/${id}.json"><code>by-manufacturer/${id}.json</code></a> <span class="count">${manufacturers[id].length}</span></li>`)
  .join("\n");
const pidLinks = Object.keys(pidsByMode).sort()
  .map(mode => `      <li><a href="pids/${mode}.json"><code>pids/${mode}.json</code></a> <span class="count">${pidsByMode[mode].length}</span></li>`)
  .join("\n");

const indexHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>obdex — OBD-II diagnostic codes &amp; PIDs</title>
  <meta name="description" content="Open, machine-readable database of OBD-II diagnostic trouble codes and PIDs. CC0 data, MIT tooling.">
  <style>
    :root { color-scheme: light dark; --fg: #111; --muted: #666; --bg: #fff; --accent: #0969da; --border: #d0d7de; --code-bg: #f6f8fa; }
    @media (prefers-color-scheme: dark) {
      :root { --fg: #e6edf3; --muted: #8b949e; --bg: #0d1117; --accent: #58a6ff; --border: #30363d; --code-bg: #161b22; }
    }
    * { box-sizing: border-box; }
    body { font: 16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; color: var(--fg); background: var(--bg); margin: 0; padding: 2rem 1.5rem; }
    main { max-width: 760px; margin: 0 auto; }
    h1 { font-size: 2rem; margin: 0 0 .25rem; letter-spacing: -0.02em; }
    h2 { font-size: 1.1rem; margin: 2rem 0 .75rem; padding-bottom: .25rem; border-bottom: 1px solid var(--border); }
    p.tagline { color: var(--muted); margin: 0 0 1.5rem; }
    code { font: 0.92em ui-monospace, "SF Mono", Consolas, monospace; background: var(--code-bg); padding: 0.1em 0.35em; border-radius: 4px; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    ul { list-style: none; padding: 0; margin: 0; }
    li { padding: .35rem 0; display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; border-bottom: 1px solid var(--border); }
    li:last-child { border-bottom: none; }
    .count { color: var(--muted); font: 0.85em ui-monospace, "SF Mono", Consolas, monospace; }
    .stats { display: flex; gap: 2rem; margin: 1rem 0 0; flex-wrap: wrap; }
    .stat { color: var(--muted); }
    .stat strong { color: var(--fg); font-size: 1.4em; font-weight: 600; display: block; line-height: 1.1; }
    footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid var(--border); color: var(--muted); font-size: 0.92em; }
    footer a { color: var(--muted); text-decoration: underline; }
  </style>
</head>
<body>
<main>
  <h1>obdex</h1>
  <p class="tagline">Open, machine-readable database of OBD-II diagnostic trouble codes and PIDs.</p>

  <div class="stats">
    <div class="stat"><strong>${totalCodes}</strong> codes</div>
    <div class="stat"><strong>${totalPids}</strong> PIDs</div>
    <div class="stat"><strong>${Object.keys(manufacturers).length}</strong> manufacturers</div>
  </div>

  <h2>Bundle</h2>
  <ul>
    <li><a href="all.json"><code>all.json</code></a> <span class="count">everything</span></li>
    <li><a href="all.min.json"><code>all.min.json</code></a> <span class="count">minified</span></li>
    <li><a href="meta.json"><code>meta.json</code></a> <span class="count">counts &amp; build time</span></li>
  </ul>

  <h2>By scope</h2>
  <ul>
    <li><a href="generic.json"><code>generic.json</code></a> <span class="count">${generic.length}</span></li>
    <li><a href="manufacturers.json"><code>manufacturers.json</code></a> <span class="count">${Object.keys(manufacturers).length} entries</span></li>
  </ul>

  <h2>By manufacturer</h2>
  <ul>
${manufacturerLinks}
  </ul>

  <h2>PIDs</h2>
  <ul>
${pidLinks}
  </ul>

  <footer>
    Source on <a href="https://github.com/foerbsnavi/obdex">GitHub</a> — data
    <a href="https://github.com/foerbsnavi/obdex/blob/main/LICENSE-DATA">CC0-1.0</a>, code
    <a href="https://github.com/foerbsnavi/obdex/blob/main/LICENSE-CODE">MIT</a>.
    Each endpoint also has a <code>.min.json</code> variant.
  </footer>
</main>
</body>
</html>
`;

writeFileSync(join(dist, "index.html"), indexHtml);

console.log(JSON.stringify(meta.counts, null, 2));
