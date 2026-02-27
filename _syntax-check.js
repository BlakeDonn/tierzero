// Quick syntax check: extract SPECS block and try to evaluate it
const fs = require('fs');
const html = fs.readFileSync('data/specs.js','utf8');

// Need Q enum definition
const Q = { epic:4, rare:3, uncommon:2 };

// Extract SPECS
const start = html.indexOf('const SPECS = {');
// Find end with brace counting (properly)
let depth = 0, end = -1, inStr = false, strChar = '', esc = false;
for (let i = start; i < html.length; i++) {
  const c = html[i];
  if (esc) { esc = false; continue; }
  if (c === '\\') { esc = true; continue; }
  if (inStr) { if (c === strChar) inStr = false; continue; }
  if (c === '"' || c === "'") { inStr = true; strChar = c; continue; }
  if (c === '{') depth++;
  if (c === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
}

const block = html.substring(start, end);
try {
  // Replace const with var so it's evaluable
  const evalBlock = block.replace('const SPECS = ', 'var SPECS = ');
  eval(evalBlock);
  const specKeys = Object.keys(SPECS);
  console.log(`SUCCESS: ${specKeys.length} specs parsed`);

  let totalItems = 0;
  for (const key of specKeys) {
    const spec = SPECS[key];
    let items = 0;
    for (const slot of Object.keys(spec.slots || {})) {
      items += spec.slots[slot].length;
    }
    totalItems += items;
    console.log(`  ${key}: ${items} items, ${Object.keys(spec.slots || {}).length} slots`);
  }
  console.log(`\nTotal: ${totalItems} items`);
} catch (e) {
  console.log('PARSE ERROR:', e.message);
  // Show context around the error
  const lineMatch = e.message.match(/position (\d+)/);
  if (lineMatch) {
    const pos = parseInt(lineMatch[1]);
    console.log('Around error:', JSON.stringify(block.substring(pos - 50, pos + 50)));
  }
}
