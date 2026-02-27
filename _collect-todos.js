// Collect all unique TODO items across all spec outputs and look up their sources
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '_spec-output');
const todos = new Map(); // id → name

for (const file of fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.js'))) {
  const content = fs.readFileSync(path.join(OUTPUT_DIR, file), 'utf8');
  const re = /name:"([^"]+)",id:(\d+),[^}]*src:"TODO"/g;
  let m;
  while ((m = re.exec(content))) {
    todos.set(parseInt(m[2]), m[1]);
  }
}

// Sort by name for readability
const sorted = [...todos.entries()].sort((a, b) => a[1].localeCompare(b[1]));

console.log(`${sorted.length} unique TODO items:\n`);

// Check tooltip cache for clues
const cache = JSON.parse(fs.readFileSync('_data/tooltip-cache.json', 'utf8'));

for (const [id, name] of sorted) {
  const tt = cache[String(id)];
  let hint = '';
  if (tt && tt.tooltip) {
    if (/Naxxramas|Kel'Thuzad|Sapphiron|Thaddius|Loatheb|Patchwerk|Gothik|Noth|Gluth|Maexxna|Razuvious|Heigan|Anub'Rekhan|Faerlina|Grobbulus|Instructor/.test(tt.tooltip))
      hint = 'Classic Naxx';
    else if (/Ahn'Qiraj|C'Thun|Vek'lor|Vek'nilash|Huhuran|Fankriss|Ouro|Viscidus|Sartura/.test(tt.tooltip))
      hint = 'Classic AQ40';
    else if (/Blackwing Lair|Nefarian|Chromaggus|Broodlord|Vaelastrasz|Razorgore|Firemaw|Flamegor|Ebonroc/.test(tt.tooltip))
      hint = 'Classic BWL';
    else if (/Molten Core|Ragnaros|Majordomo|Garr|Geddon|Shazzrah|Lucifron|Magmadar|Sulfuron|Gehennas/.test(tt.tooltip))
      hint = 'Classic MC';
    else if (/Zul'Gurub|Hakkar|Mandokir/.test(tt.tooltip))
      hint = 'Classic ZG';
    else if (/Zandalar/.test(tt.tooltip))
      hint = 'Classic ZG (Zandalar)';

    // Check for set name
    const setMatch = tt.tooltip.match(/<!--si\d+-->/);
    if (setMatch && !hint) hint = '(has set)';
  }
  console.log(`  ${id}: ${name}${hint ? ' → ' + hint : ''}`);
}
