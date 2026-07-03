#!/usr/bin/env node
/**
 * validate-examples.mjs — validate every example object against its schemas.
 *
 * Finds every .yaml/.yml file under examples/<product>/.product/ (and, if
 * present, any files under examples/**\/objects/), parses it as YAML, and
 * validates each document against BOTH the common envelope schema
 * (schemas/common/envelope.schema.json) and the JSON Schema registered for
 * its `kind`. Documents whose kind uses the `x-` extension prefix are
 * skipped with a warning (PP-0002 §8); documents whose kind has no schema
 * mapping are failures.
 *
 * Usage:
 *   npm install --no-save ajv@8 ajv-formats@3 js-yaml@4
 *   node scripts/validate-examples.mjs
 *
 * Exits non-zero on any validation failure, parse error, or unmapped kind.
 * Dependencies: ajv, ajv-formats, js-yaml (nothing else).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import Ajv2020Import from 'ajv/dist/2020.js';
import addFormatsImport from 'ajv-formats';
import yaml from 'js-yaml';

const Ajv2020 = Ajv2020Import.default ?? Ajv2020Import;
const addFormats = addFormatsImport.default ?? addFormatsImport;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCHEMAS_DIR = path.join(ROOT, 'schemas');
const EXAMPLES_DIR = path.join(ROOT, 'examples');
const ENVELOPE_ID =
  'https://productprotocol.org/schemas/common/envelope.schema.json';

/** kind -> schema path relative to the repository root. */
const KIND_TO_SCHEMA = {
  Product: 'schemas/product/product.schema.json',
  Goal: 'schemas/specification/goal.schema.json',
  Capability: 'schemas/specification/capability.schema.json',
  Specification: 'schemas/specification/specification.schema.json',
  Feature: 'schemas/specification/feature.schema.json',
  Story: 'schemas/specification/story.schema.json',
  Constitution: 'schemas/constitution/constitution.schema.json',
  Task: 'schemas/task/task.schema.json',
  Planner: 'schemas/task/planner.schema.json',
  Issue: 'schemas/task/issue.schema.json',
  Worker: 'schemas/worker/worker.schema.json',
  Artifact: 'schemas/worker/artifact.schema.json',
  Evaluator: 'schemas/evaluation/evaluator.schema.json',
  Evaluation: 'schemas/evaluation/evaluation.schema.json',
  GoldenTest: 'schemas/evaluation/golden-test.schema.json',
  QualityGate: 'schemas/evaluation/quality-gate.schema.json',
  Deployment: 'schemas/deployment/deployment.schema.json',
  Observation: 'schemas/deployment/observation.schema.json',
  ProductBrain: 'schemas/knowledge/product-brain.schema.json',
  Knowledge: 'schemas/knowledge/knowledge.schema.json',
  Decision: 'schemas/knowledge/decision.schema.json',
};

/** Schema $id convention (schemas/README.md): base + repo-relative path. */
const ID_BASE = 'https://productprotocol.org/';

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

// ---------------------------------------------------------------------------
// 1. Preload every schema under schemas/ into Ajv, registered by $id.
//    Relative $refs inside a schema (e.g. "../common/common.schema.json")
//    are resolved by Ajv against that schema's $id URL automatically.
// ---------------------------------------------------------------------------
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

let schemaCount = 0;
for (const file of walk(SCHEMAS_DIR)) {
  if (!file.endsWith('.schema.json')) continue;
  const rel = toPosix(path.relative(ROOT, file));
  let schema;
  try {
    schema = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    console.error(`FAIL ${rel}: schema is not valid JSON: ${err.message}`);
    process.exit(1);
  }
  const id = schema.$id ?? ID_BASE + rel;
  try {
    ajv.addSchema(schema, id);
    schemaCount += 1;
  } catch (err) {
    console.error(`FAIL ${rel}: could not register schema: ${err.message}`);
    process.exit(1);
  }
}
console.log(`Loaded ${schemaCount} schema(s) from schemas/`);

if (!ajv.getSchema(ENVELOPE_ID)) {
  console.error(`FAIL: envelope schema not found (${ENVELOPE_ID})`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Collect example object files.
// ---------------------------------------------------------------------------
const exampleFiles = [];
if (fs.existsSync(EXAMPLES_DIR)) {
  for (const file of walk(EXAMPLES_DIR)) {
    if (!/\.ya?ml$/i.test(file)) continue;
    const rel = toPosix(path.relative(ROOT, file));
    if (rel.includes('/.product/') || /(^|\/)objects\//.test(rel)) {
      exampleFiles.push(file);
    }
  }
}
exampleFiles.sort();

if (exampleFiles.length === 0) {
  console.log('No example objects found under examples/ — nothing to validate.');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// 3. Validate each document against the envelope AND its kind schema.
// ---------------------------------------------------------------------------
let failures = 0;
let warnings = 0;
let validated = 0;

function formatErrors(errors) {
  return (errors ?? [])
    .map((e) => `    ${e.instancePath || '/'} ${e.message}`)
    .join('\n');
}

for (const file of exampleFiles) {
  const rel = toPosix(path.relative(ROOT, file));

  let docs;
  try {
    // JSON_SCHEMA keeps timestamps as strings (PP-0002 §1: objects parse to
    // the JSON data model); the default schema would produce Date objects
    // and break format validation.
    docs = yaml.loadAll(fs.readFileSync(file, 'utf8'), null, {
      schema: yaml.JSON_SCHEMA,
    });
  } catch (err) {
    console.error(`FAIL ${rel}: YAML parse error: ${err.message}`);
    failures += 1;
    continue;
  }

  docs = docs.filter((d) => d !== null && d !== undefined);
  if (docs.length === 0) {
    console.error(`FAIL ${rel}: file contains no YAML document`);
    failures += 1;
    continue;
  }

  for (const [index, doc] of docs.entries()) {
    const where = docs.length > 1 ? `${rel} (doc ${index + 1})` : rel;

    if (typeof doc !== 'object' || Array.isArray(doc)) {
      console.error(`FAIL ${where}: document is not a mapping`);
      failures += 1;
      continue;
    }

    const kind = doc.kind;
    if (typeof kind !== 'string' || kind.length === 0) {
      console.error(`FAIL ${where}: missing or invalid \`kind\``);
      failures += 1;
      continue;
    }

    if (kind.startsWith('x-')) {
      console.warn(`WARN ${where}: extension kind ${kind} — skipped (PP-0002 §8)`);
      warnings += 1;
      continue;
    }

    const schemaPath = KIND_TO_SCHEMA[kind];
    if (!schemaPath) {
      console.error(`FAIL ${where}: no schema mapping for kind ${kind}`);
      failures += 1;
      continue;
    }

    const kindSchemaId = ID_BASE + schemaPath;
    const validateKind = ajv.getSchema(kindSchemaId);
    if (!validateKind) {
      console.error(
        `FAIL ${where}: schema for kind ${kind} not loaded (expected ${schemaPath})`
      );
      failures += 1;
      continue;
    }

    const validateEnvelope = ajv.getSchema(ENVELOPE_ID);
    const problems = [];
    if (!validateEnvelope(doc)) {
      problems.push(`  envelope:\n${formatErrors(validateEnvelope.errors)}`);
    }
    if (!validateKind(doc)) {
      problems.push(`  ${kind} schema:\n${formatErrors(validateKind.errors)}`);
    }

    if (problems.length > 0) {
      console.error(`FAIL ${where} (${kind})\n${problems.join('\n')}`);
      failures += 1;
    } else {
      console.log(`OK   ${where} (${kind})`);
      validated += 1;
    }
  }
}

console.log(
  `\n${validated} valid, ${failures} failed, ${warnings} skipped (extension kinds), ` +
    `${exampleFiles.length} file(s) checked.`
);

process.exit(failures > 0 ? 1 : 0);
