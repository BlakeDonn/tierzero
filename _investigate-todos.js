// Look at tooltip data for Unknown TODO items to find source clues
const fs = require('fs');
const path = require('path');
const cache = JSON.parse(fs.readFileSync('_data/tooltip-cache.json','utf8'));
const OUTPUT_DIR = '_spec-output';
const seen = new Set();
const unknowns = [];

for (const file of fs.readdirSync(OUTPUT_DIR).filter(f=>f.endsWith('.js'))) {
  const content = fs.readFileSync(path.join(OUTPUT_DIR, file),'utf8');
  const re = /name:"([^"]+)",id:(\d+),[^}]*src:"TODO"/g;
  let m;
  while ((m = re.exec(content))) {
    const id = parseInt(m[2]);
    if (!seen.has(id)) {
      seen.add(id);
      const tt = cache[String(id)];
      if (!tt || !tt.tooltip) { unknowns.push({id, name:m[1], hint:'NO_TOOLTIP'}); continue; }
      const tip = tt.tooltip;

      // Already categorized ones - skip
      if (/Naxxramas|Kel.Thuzad|Sapphiron|Thaddius|Loatheb|Patchwerk|Gothik|Noth|Gluth|Maexxna|Razuvious|Heigan|Anub.Rekhan|Faerlina|Grobbulus|Instructor/.test(tip)) continue;
      if (/Ahn.Qiraj|C.Thun|Vek.lor|Vek.nilash|Huhuran|Fankriss|Ouro|Viscidus|Sartura/.test(tip)) continue;
      if (/Blackwing Lair|Nefarian|Chromaggus|Broodlord|Vaelastrasz|Razorgore|Firemaw|Flamegor|Ebonroc/.test(tip)) continue;
      if (/Molten Core|Ragnaros|Majordomo|Garr|Geddon|Shazzrah|Lucifron|Magmadar|Sulfuron|Gehennas/.test(tip)) continue;
      if (/Zul.Gurub|Hakkar|Mandokir|Zandalar/.test(tip)) continue;
      if (/<!--si\d+-->/.test(tip)) continue; // Sets
      if (/Darkmoon/.test(tip) || /Darkmoon/.test(m[1])) continue;

      // Look for any source clues
      let clues = [];

      // Binds when...
      if (/Binds when picked up/.test(tip)) clues.push('BoP');
      if (/Binds when equipped/.test(tip)) clues.push('BoE');

      // Quest
      if (/Quest Item/.test(tip)) clues.push('Quest Item');

      // Profession
      const prof = tip.match(/Requires\s+(Leatherworking|Blacksmithing|Tailoring|Jewelcrafting|Alchemy|Enchanting|Engineering)/);
      if (prof) clues.push(prof[1]);

      // Check for dungeon/zone hints
      const zoneMatch = tip.match(/Requires\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*-\s*(Honored|Revered|Exalted|Friendly)/);
      if (zoneMatch) clues.push(`Rep: ${zoneMatch[1]} ${zoneMatch[2]}`);

      // Arena
      if (/Arena/.test(tip)) clues.push('Arena');

      // Unique-Equipped
      if (/Unique/.test(tip)) clues.push('Unique');

      // Item level
      const ilvlMatch = tip.match(/Item Level (\d+)/);
      const ilvl = ilvlMatch ? parseInt(ilvlMatch[1]) : 0;

      unknowns.push({id, name:m[1], ilvl, clues: clues.join(', ')});
    }
  }
}

// Sort by clue type then name
unknowns.sort((a,b) => {
  if (a.clues !== b.clues) return a.clues.localeCompare(b.clues);
  return a.name.localeCompare(b.name);
});

console.log(`${unknowns.length} Unknown TODO items:\n`);
for (const u of unknowns) {
  console.log(`  ${u.id}: ${u.name} (ilvl ${u.ilvl}) [${u.clues}]`);
}
