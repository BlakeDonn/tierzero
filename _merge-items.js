// Merge _item-additions/*.txt into data/specs.js
// Usage: node _merge-items.js [--dir=_item-additions-v2] rogue.txt [paladin.txt ...]
// Merges into data/specs.js
const fs = require('fs');
const path = require('path');

let dir = '_item-additions';
const rawArgs = process.argv.slice(2);
const files = rawArgs.filter(a => { if (a.startsWith('--dir=')) { dir = a.slice(6); return false; } return true; });
if (!files.length) {
  console.log('Usage: node _merge-items.js [--dir=DIR] <file1.txt> [file2.txt ...]');
  process.exit(1);
}

let html = fs.readFileSync('data/specs.js', 'utf8');
let lines = html.split('\n');
let totalInserted = 0;
let warnings = [];

for (const file of files) {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) {
    console.log('SKIP: ' + filePath + ' not found');
    continue;
  }
  console.log('\nProcessing: ' + file);
  const content = fs.readFileSync(filePath, 'utf8');
  const fileLines = content.split('\n');

  let currentSpec = null;
  let currentSlot = null;
  let pendingItems = [];

  function flushPending() {
    if (!currentSpec || !currentSlot || !pendingItems.length) {
      pendingItems = [];
      return;
    }

    // Find the spec section and slot in the HTML
    // Look for the spec slug in quotes, then find the slot array
    const specPattern = '"' + currentSpec + '"';
    let specStart = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(specPattern) && lines[i].includes(':')) {
        specStart = i;
        break;
      }
    }
    if (specStart === -1) {
      warnings.push('WARN: spec ' + currentSpec + ' not found');
      pendingItems = [];
      return;
    }

    // Find the slot within this spec (before next spec starts)
    const slotPattern = currentSlot + ':';
    let slotStart = -1;
    let nextSpec = -1;

    // Find the end of this spec's object (next spec or end of SPECS)
    for (let i = specStart + 1; i < lines.length; i++) {
      // Check if we hit the next spec (line matches "spec-slug": {)
      if (lines[i].match(/^\s*"[a-z]+-[a-z]+":\s*\{/) || lines[i].match(/^\s*"[a-z]+-[a-z]+-[a-z]+":\s*\{/)) {
        nextSpec = i;
        break;
      }
      // Also check for end of SPECS object
      if (lines[i].match(/^\s*\};\s*$/) && !lines[i].includes('slots')) {
        nextSpec = i;
        break;
      }
    }
    if (nextSpec === -1) nextSpec = lines.length;

    // Find the slot key within this spec
    for (let i = specStart; i < nextSpec; i++) {
      if (lines[i].includes(slotPattern) && lines[i].includes('[')) {
        slotStart = i;
        break;
      }
    }
    if (slotStart === -1) {
      warnings.push('WARN: slot ' + currentSlot + ' not found in ' + currentSpec);
      pendingItems = [];
      return;
    }

    // Find the closing bracket of this slot array
    let bracketDepth = 0;
    let slotEnd = -1;
    for (let i = slotStart; i < nextSpec; i++) {
      for (let c = 0; c < lines[i].length; c++) {
        if (lines[i][c] === '[') bracketDepth++;
        if (lines[i][c] === ']') {
          bracketDepth--;
          if (bracketDepth === 0) {
            slotEnd = i;
            break;
          }
        }
      }
      if (slotEnd !== -1) break;
    }
    if (slotEnd === -1) {
      warnings.push('WARN: could not find end of slot ' + currentSlot + ' in ' + currentSpec);
      pendingItems = [];
      return;
    }

    // Check for duplicates by item ID
    const existingIds = new Set();
    const idRegex = /id:(\d+)/g;
    for (let i = slotStart; i <= slotEnd; i++) {
      let m;
      while ((m = idRegex.exec(lines[i])) !== null) {
        existingIds.add(m[1]);
      }
    }

    // Filter out items that already exist
    const newItems = pendingItems.filter(function(itemLine) {
      const m = itemLine.match(/id:(\d+)/);
      if (!m) return false;
      if (existingIds.has(m[1])) {
        return false;
      }
      return true;
    });

    if (newItems.length === 0) {
      pendingItems = [];
      return;
    }

    // Insert before the closing bracket of the slot
    // Find the last item line before slotEnd
    let insertAt = slotEnd;
    // Add proper indentation and trailing comma
    const indent = '        ';
    const insertLines = newItems.map(function(item) {
      return indent + item.trim();
    });

    // Make sure the line before insertAt ends with a comma
    for (let i = insertAt - 1; i >= slotStart; i--) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        if (!trimmed.endsWith('},')) {
          lines[i] = lines[i].replace(/\}\s*$/, '},');
        }
        break;
      }
    }

    // Ensure all insert lines end with comma except maybe last
    for (let i = 0; i < insertLines.length; i++) {
      if (!insertLines[i].trim().endsWith(',')) {
        insertLines[i] = insertLines[i].replace(/\}\s*$/, '},');
      }
    }

    lines.splice(insertAt, 0, ...insertLines);
    totalInserted += newItems.length;
    console.log('  ' + currentSpec + '/' + currentSlot + ': +' + newItems.length + ' items');

    pendingItems = [];
  }

  for (const line of fileLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const specMatch = trimmed.match(/^=== (.+) ===$/);
    if (specMatch) {
      flushPending();
      currentSpec = specMatch[1];
      currentSlot = null;
      continue;
    }

    const slotMatch = trimmed.match(/^--- (.+) ---$/);
    if (slotMatch) {
      flushPending();
      currentSlot = slotMatch[1];
      continue;
    }

    if (trimmed.startsWith('{')) {
      pendingItems.push(trimmed);
    }
  }
  flushPending();
}

fs.writeFileSync('data/specs.js', lines.join('\n'));
console.log('\nTotal items inserted: ' + totalInserted);
if (warnings.length) {
  console.log('\nWarnings:');
  warnings.forEach(function(w) { console.log('  ' + w); });
}
