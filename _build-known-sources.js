// Build a comprehensive KNOWN_SOURCES map for TODO items
// Uses tooltip cache to auto-detect Classic raid items, then adds manual entries
const fs = require('fs');
const path = require('path');
const cache = JSON.parse(fs.readFileSync('_data/tooltip-cache.json','utf8'));

// Collect all TODO item IDs
const OUTPUT_DIR = '_spec-output';
const seen = new Set();
const todoItems = [];

for (const file of fs.readdirSync(OUTPUT_DIR).filter(f=>f.endsWith('.js'))) {
  const content = fs.readFileSync(path.join(OUTPUT_DIR, file),'utf8');
  const re = /name:"([^"]+)",id:(\d+),[^}]*src:"TODO"/g;
  let m;
  while ((m = re.exec(content))) {
    const id = parseInt(m[2]);
    if (!seen.has(id)) {
      seen.add(id);
      todoItems.push({id, name: m[1]});
    }
  }
}

// Auto-detect Classic raid items from tooltips
const autoSources = {};

for (const {id, name} of todoItems) {
  const tt = cache[String(id)];
  if (!tt || !tt.tooltip) continue;
  const tip = tt.tooltip;

  // Naxx T3 sets and drops (IDs 22xxx-23xxx)
  if (/<!--si\d+-->/.test(tip)) {
    // It's a set piece - determine which set/raid from name or set tooltip
    if (/Cryptstalker/.test(name)) { autoSources[id] = 'Classic Naxx'; continue; }
    if (/Dreadnaught/.test(name)) { autoSources[id] = 'Classic Naxx'; continue; }
    if (/Dreamwalker/.test(name)) { autoSources[id] = 'Classic Naxx'; continue; }
    if (/Earthshatter/.test(name)) { autoSources[id] = 'Classic Naxx'; continue; }
    if (/Plagueheart/.test(name)) { autoSources[id] = 'Classic Naxx'; continue; }
    if (/Redemption/.test(name)) { autoSources[id] = 'Classic Naxx'; continue; }
    if (/Faith/.test(name)) { autoSources[id] = 'Classic Naxx'; continue; }
    if (/Ring of the Cryptstalker/.test(name)) { autoSources[id] = 'Classic Naxx'; continue; }
    // Generic set - likely Naxx for these IDs
    if (id >= 22400 && id <= 23100) { autoSources[id] = 'Classic Naxx'; continue; }
  }

  // Naxx boss drops detected from tooltip text
  if (/Naxxramas|Kel.Thuzad|Sapphiron|Thaddius|Loatheb|Patchwerk|Gothik|Noth|Gluth|Maexxna|Razuvious|Heigan|Anub.Rekhan|Faerlina|Grobbulus|Instructor/.test(tip)) {
    autoSources[id] = 'Classic Naxx';
    continue;
  }

  // AQ40
  if (/Ahn.Qiraj|C.Thun|Vek.lor|Vek.nilash|Huhuran|Fankriss|Ouro|Viscidus|Sartura|Temple of Ahn/.test(tip)) {
    autoSources[id] = 'Classic AQ40';
    continue;
  }

  // BWL
  if (/Blackwing Lair|Nefarian|Chromaggus|Broodlord|Vaelastrasz|Razorgore|Firemaw|Flamegor|Ebonroc/.test(tip)) {
    autoSources[id] = 'Classic BWL';
    continue;
  }

  // MC
  if (/Molten Core|Ragnaros|Majordomo|Garr|Geddon|Shazzrah|Lucifron|Magmadar|Sulfuron|Gehennas|Golemagg/.test(tip)) {
    autoSources[id] = 'Classic MC';
    continue;
  }

  // ZG
  if (/Zul.Gurub|Hakkar|Mandokir|Zandalar/.test(tip)) {
    autoSources[id] = 'Classic ZG';
    continue;
  }
}

console.log(`Auto-detected: ${Object.keys(autoSources).length} Classic raid sources`);
for (const [id, src] of Object.entries(autoSources)) {
  const item = todoItems.find(t => t.id === parseInt(id));
  console.log(`  ${id}: ${item.name} → ${src}`);
}

// Items still unresolved
const remaining = todoItems.filter(t => !autoSources[t.id]);
console.log(`\nRemaining: ${remaining.length} items need manual sources`);
for (const t of remaining) {
  console.log(`  ${t.id}: ${t.name}`);
}
