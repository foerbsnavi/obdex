import { readFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import Ajv from "ajv/dist/2020.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const codeSchema = JSON.parse(readFileSync(join(root, "schema/code.schema.json"), "utf8"));
const pidSchema = JSON.parse(readFileSync(join(root, "schema/pid.schema.json"), "utf8"));

const ajv = new Ajv.default({ allErrors: true, strict: false });
const validateCode = ajv.compile(codeSchema);
const validatePid = ajv.compile(pidSchema);

const errors = [];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.name.endsWith(".yaml")) out.push(p);
  }
  return out;
}

function validateFile(file, validator) {
  const raw = readFileSync(file, "utf8");
  const parsed = parse(raw);
  if (parsed === null || (Array.isArray(parsed) && parsed.length === 0)) return 0;
  if (!Array.isArray(parsed)) {
    errors.push(`${file}: expected an array, got ${typeof parsed}`);
    return 0;
  }
  let count = 0;
  for (const item of parsed) {
    if (!validator(item)) {
      const id = item.code || item.pid || JSON.stringify(item).slice(0, 60);
      errors.push(`${file} [${id}]: ${ajv.errorsText(validator.errors)}`);
    }
    count++;
  }
  return count;
}

const codeFiles = [
  ...walk(join(root, "data/generic")),
  ...walk(join(root, "data/manufacturers")).filter(f => !basename(f).startsWith("_"))
];
const pidFiles = walk(join(root, "data/pids"));

let codes = 0, pids = 0;
for (const f of codeFiles) codes += validateFile(f, validateCode);
for (const f of pidFiles) pids += validateFile(f, validatePid);

if (errors.length) {
  for (const e of errors) console.error(e);
  console.error(`\n${errors.length} error(s)`);
  process.exit(1);
}

console.log(`OK: ${codes} codes, ${pids} pids validated`);
