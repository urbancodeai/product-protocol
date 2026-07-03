#!/usr/bin/env node
/**
 * lint-schemas.mjs — sanity-check every JSON Schema in schemas/.
 *
 * Loads every schemas/**\/*.schema.json, verifies it is valid JSON,
 * registers all of them in a single Ajv 2020-12 instance (so relative
 * $refs resolve against each schema's $id), then compiles each one to
 * catch syntax errors, bad $refs, and invalid keywords.
 *
 * Usage:
 *   npm install --no-save ajv@8 ajv-formats@3 js-yaml@4
 *   node scripts/lint-schemas.mjs
 *
 * Exits non-zero on any error. Dependencies: ajv, ajv-formats.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import Ajv2020Import from 'ajv/dist/2020.js';
import addFormatsImport from 'ajv-formats';

const Ajv2020 = Ajv2020Import.default ?? Ajv2020Import;
const addFormats = addFormatsImport.default ?? addFormatsImport;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCHEMAS_DIR = path.join(ROOT, 'schemas');
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

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

let errors = 0;
const loaded = []; // { rel, id }

// Pass 1: parse and register every schema by $id.
for (const file of walk(SCHEMAS_DIR)) {
  if (!file.endsWith('.schema.json')) continue;
  const rel = toPosix(path.relative(ROOT, file));

  let schema;
  try {
    schema = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    console.error(`FAIL ${rel}: invalid JSON: ${err.message}`);
    errors += 1;
    continue;
  }

  if (!schema.$id) {
    console.error(
      `FAIL ${rel}: missing $id (expected ${ID_BASE + rel}, see schemas/README.md)`
    );
    errors += 1;
    continue;
  }
  if (schema.$id !== ID_BASE + rel) {
    console.error(
      `FAIL ${rel}: $id "${schema.$id}" does not match path (expected ${ID_BASE + rel})`
    );
    errors += 1;
    // Still register it so dependents can compile.
  }

  try {
    ajv.addSchema(schema, schema.$id);
    loaded.push({ rel, id: schema.$id });
  } catch (err) {
    console.error(`FAIL ${rel}: could not register: ${err.message}`);
    errors += 1;
  }
}

// Pass 2: compile each registered schema (resolves $refs, checks keywords).
for (const { rel, id } of loaded) {
  try {
    const validate = ajv.getSchema(id);
    if (typeof validate !== 'function') {
      throw new Error('compilation returned no validator');
    }
    console.log(`OK   ${rel}`);
  } catch (err) {
    console.error(`FAIL ${rel}: does not compile: ${err.message}`);
    errors += 1;
  }
}

console.log(`\n${loaded.length} schema(s) checked, ${errors} error(s).`);
process.exit(errors > 0 ? 1 : 0);
