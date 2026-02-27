const fs = require('fs');
const path = require('path');
const cache = JSON.parse(fs.readFileSync('_data/tooltip-cache.json','utf8'));
const OUTPUT_DIR = '_spec-output';
const seen = new Set();
const todos = [];

for (const file of fs.readdirSync(OUTPUT_DIR).filter(f=>f.endsWith('.js'))) {
  const content = fs.readFileSync(path.join(OUTPUT_DIR, file),'utf8');
  const re = /name:"([^"]+)",id:(\d+),[^}]*src:"TODO"/g;
  let m;
  while ((m = re.exec(content))) {
    const id = parseInt(m[2]);
    if (!seen.has(id)) {
      seen.add(id);
      const tt = cache[String(id)];
      let hint = '';
      if (tt && tt.tooltip) {
        if (/Naxxramas|Kel.Thuzad|Sapphiron|Thaddius|Loatheb|Patchwerk|Gothik|Noth|Gluth|Maexxna|Razuvious|Heigan|Anub.Rekhan|Faerlina|Grobbulus|Instructor/.test(tt.tooltip)) hint='Naxx';
        else if (/Ahn.Qiraj|C.Thun|Vek.lor|Vek.nilash|Huhuran|Fankriss|Ouro|Viscidus|Sartura/.test(tt.tooltip)) hint='AQ40';
        else if (/Blackwing Lair|Nefarian|Chromaggus|Broodlord|Vaelastrasz|Razorgore|Firemaw|Flamegor|Ebonroc/.test(tt.tooltip)) hint='BWL';
        else if (/Molten Core|Ragnaros|Majordomo|Garr|Geddon|Shazzrah|Lucifron|Magmadar|Sulfuron|Gehennas/.test(tt.tooltip)) hint='MC';
        else if (/Zul.Gurub|Hakkar|Mandokir|Zandalar/.test(tt.tooltip)) hint='ZG';

        // Check for set
        if (/<!--si\d+-->/.test(tt.tooltip) && !hint) hint='SET';

        // Check for quest
        if (/Quest/.test(tt.tooltip)) hint = (hint ? hint+'+' : '') + 'Quest';
        // Check crafted
        const prof = tt.tooltip.match(/Requires\s+(Leatherworking|Blacksmithing|Tailoring|Jewelcrafting|Alchemy|Enchanting|Engineering)/);
        if (prof) hint = (hint ? hint+'+' : '') + prof[1];
        // Check BoE
        if (/Binds when equipped/.test(tt.tooltip)) hint = (hint ? hint+'+' : '') + 'BoE';
        // Check Darkmoon
        if (/Darkmoon/.test(tt.tooltip) || /Darkmoon/.test(m[1])) hint = (hint ? hint+'+' : '') + 'DMF';
      }
      todos.push({id, name:m[1], hint});
    }
  }
}

// Group by hint
const groups = {};
for (const t of todos) {
  const g = t.hint || 'Unknown';
  if (!groups[g]) groups[g] = [];
  groups[g].push(t);
}
for (const [g, items] of Object.entries(groups).sort()) {
  console.log(`\n${g} (${items.length}):`);
  for (const t of items.sort((a,b)=>a.name.localeCompare(b.name))) {
    console.log(`  ${t.id}: ${t.name}`);
  }
}
console.log(`\nTotal: ${todos.length} unique TODO items`);
