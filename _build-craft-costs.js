#!/usr/bin/env node
'use strict';

/*  _build-craft-costs.js
 *  Generates data/craft-costs.js with material costs for all crafted items.
 *
 *  Process:
 *  1. Scans data/specs.js for items with crafting profession sources
 *  2. Auto-discovers crafting spell IDs from Wowhead item pages
 *  3. Fetches spell tooltips from Wowhead to extract reagent lists
 *  4. Writes CRAFT_COSTS object to data/craft-costs.js
 *
 *  Usage:  node _build-craft-costs.js [--force]
 *  --force: re-fetch all tooltips (ignores cache)
 */

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

const DATA_DIR    = path.join(__dirname, '_data');
const CACHE_FILE  = path.join(DATA_DIR, 'tooltip-cache.json');
const SPECS_FILE  = path.join(__dirname, 'data', 'specs.js');
const OUTPUT_FILE = path.join(__dirname, 'data', 'craft-costs.js');

const forceRefetch = process.argv.includes('--force');

// ============================================================
//  Hardcoded fallback map: item ID → crafting spell ID
//  Used when auto-discovery from Wowhead pages fails
// ============================================================
const CRAFT_SPELL_MAP = {
  // Tailoring - Spellfire
  21846: 26752,  // Spellfire Belt
  21847: 26753,  // Spellfire Gloves
  21848: 26754,  // Spellfire Robe
  // Tailoring - Shadoweave
  21869: 26756,  // Frozen Shadoweave Shoulders
  21870: 26757,  // Frozen Shadoweave Boots
  21871: 26758,  // Frozen Shadoweave Robe
  // Tailoring - Mooncloth
  21873: 26760,  // Primal Mooncloth Belt
  21874: 26761,  // Primal Mooncloth Shoulders
  21875: 26762,  // Primal Mooncloth Robe
  // Tailoring - BoE
  24250: 31435,  // Bracers of Havok
  24252: 31438,  // Cloak of the Black Void
  24253: 31440,  // Cloak of Eternity
  24254: 31441,  // White Remedy Cape
  24256: 31443,  // Girdle of Ruination
  24259: 31449,  // Vengeance Wrap
  24261: 31451,  // Whitemend Pants
  24262: 31452,  // Spellstrike Pants
  24264: 31454,  // Whitemend Hood
  24266: 31455,  // Spellstrike Hood
  // Blacksmithing
  23517: 29619,  // Felsteel Gloves
  23518: 29620,  // Felsteel Leggings
  23519: 29621,  // Felsteel Helm
  23520: 29642,  // Ragesteel Gloves
  23521: 29643,  // Ragesteel Helm
  23522: 29645,  // Ragesteel Breastplate
  23531: 29658,  // Felfury Gauntlets
  23535: 29664,  // Helm of the Stalwart Defender
  23537: 29669,  // Black Felsteel Bracers
  23538: 29671,  // Bracers of the Green Fortress
  23539: 29672,  // Blessed Bracers
  23554: 29698,  // Eternium Runed Blade
  23556: 29700,  // Hand of Eternity
  28429: 34540,  // Lionheart Champion
  28432: 34542,  // Black Planar Edge
  28438: 34546,  // Dragonmaw
  28441: 34548,  // Deep Thunder
  33173: 42662,  // Ragesteel Shoulders
  // Leatherworking
  8345:  10621,  // Wolfshead Helm
  25685: 32490,  // Fel Leather Gloves
  25686: 32493,  // Fel Leather Boots
  25687: 32494,  // Fel Leather Leggings
  25689: 32495,  // Heavy Clefthoof Vest
  25690: 32496,  // Heavy Clefthoof Leggings
  25691: 32497,  // Heavy Clefthoof Boots
  25697: 32499,  // Felstalker Bracers
  29502: 35558,  // Cobrascale Hood
  29506: 35562,  // Gloves of the Living Touch
  29507: 35563,  // Windslayer Wraps
  29522: 35585,  // Windhawk Hauberk
  29523: 35588,  // Windhawk Bracers
  29524: 35587,  // Windhawk Belt
  29525: 35589,  // Primalstrike Vest
  29526: 35590,  // Primalstrike Belt
  29527: 35591,  // Primalstrike Bracers
  // Jewelcrafting
  24088: 31060,  // Delicate Eternium Ring
  24114: 31070,  // Braided Eternium Chain
  24116: 31071,  // Eye of the Night
  24121: 31076,  // Chain of the Twilight Owl
  24125: 31080,  // Figurine - Dawnstone Crab
  24126: 31081,  // Figurine - Living Ruby Serpent
  // Engineering
  23836: 30563,  // Goblin Rocket Launcher
  32475: 41316,  // Living Replicator Specs
  32479: 41318,  // Wonderheal XT40 Shades
  32480: 41319,  // Magnified Moon Specs
  // Alchemy
  13503: 17632,  // Alchemist's Stone
  35750: 47049,  // Redeemer's Alchemist Stone
};

// Crafting profession keywords for source matching
const CRAFT_KEYWORDS = [
  'tailoring', 'blacksmithing', 'leatherworking',
  'jewelcrafting', 'engineering', 'alchemy',
  'spellfire', 'shadoweave', 'mooncloth',
  'tribal', 'swordsmith', 'hammersmith', 'armorsmith'
];

function isCraftSource(src) {
  const s = src.toLowerCase();
  return CRAFT_KEYWORDS.some(k => s.includes(k));
}

function isBoeSource(src) {
  return src.toLowerCase().includes('boe');
}

// ============================================================
//  HTTP helper
// ============================================================

function httpGet(url, retries = 2) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/json,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 20000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let loc = res.headers.location;
        if (loc.startsWith('/')) {
          const u = new URL(url);
          loc = u.protocol + '//' + u.host + loc;
        }
        return httpGet(loc, retries).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
      res.on('error', reject);
    });
    req.on('error', err => {
      if (retries > 0) return httpGet(url, retries - 1).then(resolve).catch(reject);
      reject(err);
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
//  Tooltip cache (shared with _sync-spec.js)
// ============================================================

let tooltipCache = {};

function loadCache() {
  if (fs.existsSync(CACHE_FILE)) {
    try {
      tooltipCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      console.log(`  Loaded tooltip cache: ${Object.keys(tooltipCache).length} entries`);
    } catch (e) {
      console.log('  Warning: Could not load tooltip cache, starting fresh');
      tooltipCache = {};
    }
  }
}

function saveCache() {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(tooltipCache, null, 2), 'utf8');
}

// ============================================================
//  Step 1: Scan data/specs.js for crafted items
// ============================================================

function findCraftedItems() {
  const specsRaw = fs.readFileSync(SPECS_FILE, 'utf8');
  // Match items: {name:"...",id:XXXX,...,src:"..."}
  const itemRe = /\{[^}]*?name\s*:\s*"([^"]+)"[^}]*?id\s*:\s*(\d+)[^}]*?src\s*:\s*"([^"]+)"[^}]*?\}/g;
  const items = new Map();
  let m;
  while ((m = itemRe.exec(specsRaw)) !== null) {
    const name = m[1], id = parseInt(m[2], 10), src = m[3];
    if (isCraftSource(src) && !items.has(id)) {
      items.set(id, { id, name, src, boe: isBoeSource(src) });
    }
  }
  return items;
}

// ============================================================
//  Step 2: Discover crafting spell IDs from Wowhead pages
// ============================================================

async function discoverSpellId(itemId) {
  // Check hardcoded map first
  if (CRAFT_SPELL_MAP[itemId]) return CRAFT_SPELL_MAP[itemId];

  // Check cache
  const cacheKey = `craft-spell-${itemId}`;
  if (tooltipCache[cacheKey] && !forceRefetch) {
    return tooltipCache[cacheKey].spellId || null;
  }

  // Fetch Wowhead item page via allorigins
  const url = `https://api.allorigins.win/raw?url=https://www.wowhead.com/tbc/item=${itemId}`;
  console.log(`    Fetching item page for ${itemId}...`);
  try {
    const resp = await httpGet(url);
    if (resp.status !== 200) {
      console.log(`    Warning: HTTP ${resp.status} for item ${itemId}`);
      return null;
    }

    // Pattern 1: "sourcemore":[{"c":11,...,"ti":SPELL_ID}]
    const tiMatch = resp.body.match(/"ti"\s*:\s*(\d+)/);
    if (tiMatch) {
      const spellId = parseInt(tiMatch[1], 10);
      tooltipCache[cacheKey] = { spellId };
      console.log(`    Discovered spell ${spellId} for item ${itemId}`);
      return spellId;
    }

    // Pattern 2: "creates":[ITEM_ID,...],"id":SPELL_ID
    const createsRe = new RegExp(`"creates"\\s*:\\s*\\[${itemId}[^\\]]*\\]\\s*,\\s*"id"\\s*:\\s*(\\d+)`);
    const createsMatch = resp.body.match(createsRe);
    if (createsMatch) {
      const spellId = parseInt(createsMatch[1], 10);
      tooltipCache[cacheKey] = { spellId };
      console.log(`    Discovered spell ${spellId} for item ${itemId} (creates pattern)`);
      return spellId;
    }

    console.log(`    Warning: No spell ID found for item ${itemId}`);
    tooltipCache[cacheKey] = { spellId: null };
    return null;
  } catch (e) {
    console.log(`    Error fetching item ${itemId}: ${e.message}`);
    return null;
  }
}

// ============================================================
//  Step 3: Fetch spell tooltips and parse reagents
// ============================================================

async function fetchSpellTooltip(spellId) {
  const cacheKey = `spell-${spellId}`;
  if (tooltipCache[cacheKey] && !forceRefetch) {
    return tooltipCache[cacheKey];
  }

  const url = `https://nether.wowhead.com/tooltip/spell/${spellId}?dataEnv=5&locale=0`;
  console.log(`    Fetching spell tooltip ${spellId}...`);
  await sleep(200); // Rate limit
  const resp = await httpGet(url);
  if (resp.status !== 200) return null;

  try {
    const data = JSON.parse(resp.body);
    tooltipCache[cacheKey] = data;
    return data;
  } catch (e) {
    console.log(`    Warning: Invalid JSON for spell ${spellId}`);
    return null;
  }
}

function parseReagents(tooltipHtml) {
  // Reagents are in: <a href="/tbc/item=ID/slug">Name</a>&nbsp;(QTY)
  // or just: <a href="/tbc/item=ID/slug">Name</a> (quantity 1)
  const reagents = [];
  const re = /<a href="[^"]*?\/item=(\d+)[^"]*">([^<]+)<\/a>(?:&nbsp;\((\d+)\))?/g;
  let m;

  // Only parse the Reagents section (before the item tooltip section)
  const reagentSection = tooltipHtml.split('Reagents:')[1];
  if (!reagentSection) return reagents;

  // Stop at the item tooltip (starts with the item quality span)
  const sectionEnd = reagentSection.indexOf('</div>');
  const section = sectionEnd > 0 ? reagentSection.substring(0, sectionEnd) : reagentSection;

  while ((m = re.exec(section)) !== null) {
    const matId = parseInt(m[1], 10);
    const qty = m[3] ? parseInt(m[3], 10) : 1;
    reagents.push([matId, qty]);
  }
  return reagents;
}

// ============================================================
//  Step 4: Write output
// ============================================================

function writeOutput(craftCosts) {
  const entries = Object.keys(craftCosts)
    .map(Number)
    .sort((a, b) => a - b);

  let js = '// Generated by _build-craft-costs.js — do not edit manually\n';
  js += '// Material costs for crafted gear items\n';
  js += 'var CRAFT_COSTS = {\n';

  for (const id of entries) {
    const item = craftCosts[id];
    const matsStr = item.mats.map(m => `[${m[0]},${m[1]}]`).join(',');
    const comment = item.name ? `  // ${item.name}` : '';
    js += `  ${id}:{boe:${item.boe},mats:[${matsStr}]},${comment}\n`;
  }

  js += '};\n';

  fs.writeFileSync(OUTPUT_FILE, js, 'utf8');
  console.log(`\nWrote ${entries.length} entries to ${OUTPUT_FILE}`);
}

// ============================================================
//  Main
// ============================================================

async function main() {
  console.log('=== Build Craft Costs ===\n');

  // Ensure data dir exists
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  loadCache();

  // Step 1: Find crafted items
  console.log('\nStep 1: Scanning data/specs.js for crafted items...');
  const craftedItems = findCraftedItems();
  console.log(`  Found ${craftedItems.size} unique crafted items`);

  // Step 2: Discover spell IDs
  console.log('\nStep 2: Discovering crafting spell IDs...');
  const spellMap = new Map();
  const noSpellItems = [];

  for (const [itemId, item] of craftedItems) {
    const spellId = await discoverSpellId(itemId);
    if (spellId) {
      spellMap.set(itemId, spellId);
    } else {
      noSpellItems.push(item);
    }
    // Rate limit for allorigins
    if (!CRAFT_SPELL_MAP[itemId] && !tooltipCache[`craft-spell-${itemId}`]) {
      await sleep(1500);
    }
  }

  if (noSpellItems.length > 0) {
    console.log(`\n  Warning: ${noSpellItems.length} items missing spell IDs:`);
    for (const item of noSpellItems) {
      console.log(`    ${item.id}: ${item.name} — ${item.src}`);
    }
  }

  console.log(`  Resolved ${spellMap.size}/${craftedItems.size} spell IDs`);

  // Step 3: Fetch spell tooltips and parse reagents
  console.log('\nStep 3: Fetching spell tooltips and parsing reagents...');
  const craftCosts = {};
  let errors = 0;

  for (const [itemId, spellId] of spellMap) {
    const item = craftedItems.get(itemId);
    const tooltip = await fetchSpellTooltip(spellId);
    if (!tooltip || !tooltip.tooltip) {
      console.log(`    Error: No tooltip for spell ${spellId} (item ${itemId}: ${item.name})`);
      errors++;
      continue;
    }

    // Verify spell name matches item name
    if (tooltip.name && tooltip.name !== item.name) {
      console.log(`    Warning: Spell ${spellId} name "${tooltip.name}" != item "${item.name}"`);
    }

    const mats = parseReagents(tooltip.tooltip);
    if (mats.length === 0) {
      console.log(`    Warning: No reagents found for spell ${spellId} (item ${itemId}: ${item.name})`);
      errors++;
      continue;
    }

    craftCosts[itemId] = {
      name: item.name,
      boe: item.boe,
      mats: mats
    };

    console.log(`    ${item.name}: ${mats.map(m => `${m[0]}x${m[1]}`).join(', ')}`);
  }

  // Save cache after all fetches
  saveCache();

  // Step 4: Write output
  console.log(`\nStep 4: Writing output (${Object.keys(craftCosts).length} items, ${errors} errors)...`);
  writeOutput(craftCosts);

  // Summary
  console.log('\n=== Summary ===');
  console.log(`  Crafted items found: ${craftedItems.size}`);
  console.log(`  Spell IDs resolved: ${spellMap.size}`);
  console.log(`  Costs generated: ${Object.keys(craftCosts).length}`);
  console.log(`  Errors: ${errors}`);
  if (noSpellItems.length > 0) {
    console.log(`  Missing spell IDs: ${noSpellItems.length}`);
    console.log('  Add missing entries to CRAFT_SPELL_MAP and re-run.');
  }

  // Collect all unique material IDs for addon update
  const allMatIds = new Set();
  for (const cost of Object.values(craftCosts)) {
    for (const [matId] of cost.mats) allMatIds.add(matId);
  }
  console.log(`\n  Unique material IDs (${allMatIds.size}): ${[...allMatIds].sort((a,b) => a-b).join(', ')}`);
}

main().catch(e => { console.error(e); process.exit(1); });
