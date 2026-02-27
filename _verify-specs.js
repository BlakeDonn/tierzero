const fs = require('fs');
const html = fs.readFileSync('data/specs.js','utf8');
const specsStart = html.indexOf('const SPECS = {');
console.log('SPECS starts at line', html.substring(0, specsStart).split('\n').length);

// Count braces, handling strings
let depth = 0;
let specsEnd = -1;
let inStr = false;
let strChar = '';
let escape = false;
let started = false;
for (let i = specsStart; i < html.length; i++) {
  const c = html[i];
  if (escape) { escape = false; continue; }
  if (c === '\\') { escape = true; continue; }
  if (inStr) { if (c === strChar) inStr = false; continue; }
  if (c === '"' || c === "'") { inStr = true; strChar = c; continue; }
  if (c === '{') { depth++; started = true; }
  if (c === '}') { depth--; }
  if (started && depth === 0) { specsEnd = i + 1; break; }
}

if (specsEnd === -1) {
  console.log('ERROR: SPECS end not found, max depth search exhausted');
  // Find where depth goes negative or gets stuck
  depth = 0;
  let maxDepth = 0;
  escape = false;
  inStr = false;
  for (let i = specsStart; i < Math.min(specsStart + 500000, html.length); i++) {
    const c = html[i];
    if (escape) { escape = false; continue; }
    if (c === '\\') { escape = true; continue; }
    if (inStr) { if (c === strChar) inStr = false; continue; }
    if (c === '"' || c === "'") { inStr = true; strChar = c; continue; }
    if (c === '{') depth++;
    if (c === '}') depth--;
    if (depth > maxDepth) maxDepth = depth;
    if (depth < 0) {
      console.log('Depth went negative at offset', i - specsStart);
      break;
    }
  }
  console.log('Final depth:', depth, 'Max depth:', maxDepth);
  process.exit(1);
}

const specsBlock = html.substring(specsStart, specsEnd);
const endLine = html.substring(0, specsEnd).split('\n').length;
console.log('SPECS ends at line', endLine);
console.log('Block length:', specsBlock.length, 'chars');

const itemCount = (specsBlock.match(/\{name:"/g) || []).length;
console.log('Total items:', itemCount);

const specEntries = specsBlock.match(/"[a-z-]+":\s*\{/g);
console.log('Spec entries:', specEntries ? specEntries.length : 0);
if (specEntries) {
  for (const entry of specEntries) {
    console.log('  ', entry.replace(/[{:]/g, '').trim());
  }
}
