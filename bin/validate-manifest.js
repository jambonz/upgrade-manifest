#!/usr/bin/env node
'use strict';

const {readFileSync} = require('fs');
const {resolve} = require('path');
const {validateManifest} = require('..');

const file = process.argv[2];
if (!file) {
  console.error('Usage: validate-manifest <manifest.json>');
  process.exit(2);
}

let raw;
try {
  raw = readFileSync(resolve(file), 'utf-8');
} catch (err) {
  console.error(`Cannot read ${file}: ${err.message}`);
  process.exit(2);
}

let manifest;
try {
  manifest = JSON.parse(raw);
} catch (err) {
  console.error(`Invalid JSON: ${err.message}`);
  process.exit(1);
}

const {valid, errors} = validateManifest(manifest);
if (valid) {
  console.log('OK');
  process.exit(0);
}

console.error(`Validation failed (${errors.length} error${errors.length === 1 ? '' : 's'}):\n`);
for (const e of errors) {
  const path = e.instancePath || '(root)';
  console.error(`  ${path}: ${e.message}`);
  if (e.params) {
    const details = Object.entries(e.params)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(', ');
    console.error(`    (${details})`);
  }
}
process.exit(1);
