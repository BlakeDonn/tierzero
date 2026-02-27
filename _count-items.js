const fs = require('fs');
const html = fs.readFileSync('data/specs.js','utf8');

// Find all spec slugs
const specRe = /"([a-z]+-[a-z]+(?:-[a-z]+)?)":\s*\{\s*class:"(\w+)",\s*spec:"([^"]+)"/g;
let m;
const specs = [];
while ((m = specRe.exec(html)) !== null) {
  specs.push({slug: m[1], cls: m[2], spec: m[3]});
}

for (const s of specs) {
  // Find the spec's slots section
  const startRe = new RegExp('"' + s.slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '":\\s*\\{');
  const startMatch = startRe.exec(html);
  if (!startMatch) continue;
  const startIdx = startMatch.index;

  // Count items in this spec (up to next spec or 80000 chars)
  const chunk = html.substring(startIdx, startIdx + 80000);
  // Find closing of this spec's object
  let depth = 0;
  let endIdx = 0;
  for (let i = chunk.indexOf('{'); i < chunk.length; i++) {
    if (chunk[i] === '{') depth++;
    if (chunk[i] === '}') {
      depth--;
      if (depth === 0) { endIdx = i; break; }
    }
  }
  const specChunk = chunk.substring(0, endIdx);
  const itemCount = (specChunk.match(/\{name:"/g) || []).length;

  // Also count per slot
  const slotCounts = [];
  const slotRe = /(\w+):\[\s*/g;
  let sm;
  while ((sm = slotRe.exec(specChunk)) !== null) {
    const slotName = sm[1];
    if (['class','spec','classColor','icon','notes','statWeights'].includes(slotName)) continue;
    // Count items in this slot array
    const slotStart = sm.index;
    const bracketStart = specChunk.indexOf('[', slotStart);
    let bd = 0;
    let slotEnd = bracketStart;
    for (let i = bracketStart; i < specChunk.length; i++) {
      if (specChunk[i] === '[') bd++;
      if (specChunk[i] === ']') { bd--; if (bd === 0) { slotEnd = i; break; } }
    }
    const slotChunk = specChunk.substring(bracketStart, slotEnd);
    const cnt = (slotChunk.match(/\{name:"/g) || []).length;
    slotCounts.push(cnt);
  }

  const minSlot = slotCounts.length ? Math.min(...slotCounts) : 0;
  const maxSlot = slotCounts.length ? Math.max(...slotCounts) : 0;
  const avgSlot = slotCounts.length ? (slotCounts.reduce((a,b) => a+b, 0) / slotCounts.length).toFixed(1) : 0;

  console.log(
    (s.cls + ' ' + s.spec).padEnd(28) +
    String(itemCount).padStart(4) + ' items  ' +
    slotCounts.length + ' slots  ' +
    'min=' + minSlot + ' max=' + maxSlot + ' avg=' + avgSlot
  );
}
