#!/usr/bin/env node
'use strict';

/*  _patch-specs.js
 *  Replaces the `slots:{...}` block for each spec in data/specs.js
 *  with the generated output from _spec-output/.
 *
 *  Usage:  node _patch-specs.js [spec-slug ...]
 *  Default: patches all specs that have output files.
 *
 *  Creates a backup at data/specs.js.bak before patching.
 */

const fs   = require('fs');
const path = require('path');

const INDEX_FILE = path.join(__dirname, 'data', 'specs.js');
const OUTPUT_DIR = path.join(__dirname, '_spec-output');

// Get list of specs to patch
let specs = process.argv.slice(2);
if (specs.length === 0) {
  // Default: all specs with output files
  specs = fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.endsWith('.js'))
    .map(f => f.replace('.js', ''));
}

if (specs.length === 0) {
  console.error('No spec output files found in _spec-output/');
  process.exit(1);
}

console.log(`Patching ${specs.length} specs into data/specs.js...\n`);

// Read data/specs.js
let html = fs.readFileSync(INDEX_FILE, 'utf8');

// Backup
const backupFile = INDEX_FILE + '.bak';
fs.writeFileSync(backupFile, html, 'utf8');
console.log(`  Backup: ${backupFile}`);

let patchCount = 0;

for (const spec of specs) {
  const outputFile = path.join(OUTPUT_DIR, `${spec}.js`);
  if (!fs.existsSync(outputFile)) {
    console.log(`  [skip] ${spec} — no output file`);
    continue;
  }

  // Read generated slots block (skip comment header lines)
  const output = fs.readFileSync(outputFile, 'utf8');
  const lines = output.split('\n');
  // Find the "slots:{" line
  const slotsStart = lines.findIndex(l => l.trim().startsWith('slots:{'));
  if (slotsStart === -1) {
    console.log(`  [skip] ${spec} — no slots:{ found in output`);
    continue;
  }
  const newSlots = lines.slice(slotsStart).join('\n');

  // Find the spec block in data/specs.js
  // Pattern: "spec-slug": { ... slots:{ ... } ... }
  let specStart = html.indexOf(`"${spec}": {`);
  if (specStart === -1) specStart = html.indexOf(`"${spec}":{`);
  if (specStart === -1) {
    console.log(`  [skip] ${spec} — not found in data/specs.js`);
    continue;
  }

  // Find the slots:{ start within this spec block
  const slotsIdx = html.indexOf('slots:{', specStart);
  if (slotsIdx === -1 || slotsIdx > specStart + 5000) {
    // 5000 chars should be enough to find slots within the spec metadata
    console.log(`  [skip] ${spec} — slots:{ not found near spec start`);
    continue;
  }

  // Find the end of the slots block: match closing brace at proper depth
  // Start AFTER the opening { of slots:{ (slotsIdx+7) so we find its matching }
  let depth = 0;
  let slotsEnd = -1;
  for (let i = slotsIdx + 7; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}') {
      if (depth === 0) {
        slotsEnd = i + 1; // include the closing }
        break;
      }
      depth--;
    }
  }

  if (slotsEnd === -1) {
    console.log(`  [skip] ${spec} — could not find slots block end`);
    continue;
  }

  // Count items before and after
  const oldBlock = html.substring(slotsIdx, slotsEnd);
  const oldCount = (oldBlock.match(/\{name:"/g) || []).length;
  const newCount = (newSlots.match(/\{name:"/g) || []).length;

  // Indent the new slots to match (4 spaces for slots inside spec block)
  // First line has NO extra indent — whitespace before slotsIdx already provides it
  const indentedSlots = newSlots.split('\n').map((line, i) => {
    if (i === 0) return line; // slots:{ — preceding whitespace already in html.substring(0, slotsIdx)
    if (line.trim() === '}') return '    }'; // closing }
    return '    ' + line; // content lines already have 2-space indent → 4+2=6 total
  }).join('\n');

  // Replace
  html = html.substring(0, slotsIdx) + indentedSlots + html.substring(slotsEnd);

  console.log(`  [OK] ${spec}: ${oldCount} → ${newCount} items`);
  patchCount++;
}

// Write patched file
fs.writeFileSync(INDEX_FILE, html, 'utf8');
console.log(`\nPatched ${patchCount}/${specs.length} specs. Backup at data/specs.js.bak`);
