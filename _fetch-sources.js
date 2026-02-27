// Batch-fetch item sources from Wowhead for all TODO items
const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTPUT_DIR = '_spec-output';
const seen = new Set();
const todoIds = [];

for (const file of fs.readdirSync(OUTPUT_DIR).filter(f=>f.endsWith('.js'))) {
  const content = fs.readFileSync(path.join(OUTPUT_DIR, file),'utf8');
  const re = /name:"([^"]+)",id:(\d+),[^}]*src:"TODO"/g;
  let m;
  while ((m = re.exec(content))) {
    const id = parseInt(m[2]);
    if (!seen.has(id)) {
      seen.add(id);
      todoIds.push({id, name: m[1]});
    }
  }
}

console.log(`Fetching sources for ${todoIds.length} TODO items...\n`);

function fetchItem(id) {
  return new Promise((resolve, reject) => {
    const url = `https://www.wowhead.com/tbc/item=${id}`;
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  const results = {};

  for (let i = 0; i < todoIds.length; i++) {
    const {id, name} = todoIds[i];
    try {
      const html = await fetchItem(id);

      let source = '';

      // Look for "Dropped by:" in the page
      const dropMatch = html.match(/Dropped by:.*?<a[^>]*>([^<]+)<\/a>/);
      if (dropMatch) source = `Drop: ${dropMatch[1]}`;

      // Look for quest reward
      const questMatch = html.match(/Reward from.*?<a[^>]*>([^<]+)<\/a>/);
      if (questMatch) source = `Quest: ${questMatch[1]}`;

      // Look for "Source" in structured data / listview
      // Wowhead puts source info in JavaScript data
      const sourceMatch = html.match(/"sourcemore":\[\{"t":(\d+),"ti":(\d+)(?:,"n":"([^"]*)")?/);
      if (sourceMatch) {
        const type = parseInt(sourceMatch[1]);
        const typeNames = {1:'Crafted', 2:'Drop', 3:'PvP', 4:'Quest', 5:'Vendor', 6:'Trainer', 11:'Event'};
        const typeName = typeNames[type] || `type${type}`;
        source = sourceMatch[3] ? `${typeName}: ${sourceMatch[3]}` : typeName;
      }

      // Look for WH.markup.printHtml in tooltip data for source
      const droppedByMatch = html.match(/new Listview\(\{[^}]*id:\s*'dropped-by'[^}]*data:\s*\[([^\]]*)\]/s);
      if (droppedByMatch) {
        const npcMatch = droppedByMatch[1].match(/"name":"([^"]+)"/);
        if (npcMatch) source = source || `Drop: ${npcMatch[1]}`;
      }

      results[id] = {name, source: source || 'UNKNOWN'};
      process.stdout.write(`  [${i+1}/${todoIds.length}] ${id}: ${name} → ${source || 'UNKNOWN'}\r\n`);

      // Rate limit
      if (i < todoIds.length - 1) await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      results[id] = {name, source: 'ERROR: ' + e.message};
      console.log(`  [${i+1}/${todoIds.length}] ${id}: ${name} → ERROR`);
    }
  }

  // Save results
  fs.writeFileSync('_data/todo-sources.json', JSON.stringify(results, null, 2));
  console.log(`\nSaved to _data/todo-sources.json`);

  // Summary
  const found = Object.values(results).filter(r => r.source !== 'UNKNOWN' && !r.source.startsWith('ERROR'));
  const unknown = Object.values(results).filter(r => r.source === 'UNKNOWN');
  const errors = Object.values(results).filter(r => r.source.startsWith('ERROR'));
  console.log(`Found: ${found.length}, Unknown: ${unknown.length}, Errors: ${errors.length}`);
}

main().catch(console.error);
