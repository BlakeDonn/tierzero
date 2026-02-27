#!/usr/bin/env node
'use strict';

/*  _sync-spec.js
 *  Generates a complete SPECS slots block for a given spec by merging:
 *  - Wowhead guide page (item IDs per spec)
 *  - Wowhead tooltip API (stats, sockets, socket bonuses)
 *  - AtlasLoot source DB (dungeon, faction, badge, PvP sources)
 *  - Tooltip text patterns (crafting profession, faction requirements)
 *  - Existing SPECS data (preserve known-good sources as fallback)
 *
 *  Usage:  node _sync-spec.js <spec-slug> [--force]
 *  Output: _spec-output/<spec-slug>.js
 */

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

// ============================================================
//  Configuration
// ============================================================

const DATA_DIR    = path.join(__dirname, '_data');
const OUTPUT_DIR  = path.join(__dirname, '_spec-output');
const CACHE_FILE  = path.join(DATA_DIR, 'tooltip-cache.json');
const SOURCE_DB   = path.join(DATA_DIR, 'source-db.json');
const INDEX_HTML  = path.join(__dirname, 'data', 'specs.js');

const specSlug = process.argv[2];
const forceRefetch = process.argv.includes('--force');

if (!specSlug) {
  console.error('Usage: node _sync-spec.js <spec-slug> [--force]');
  console.error('Example: node _sync-spec.js arcane-mage');
  process.exit(1);
}

// Wowhead TBC pre-raid BiS guide URLs per spec slug
const GUIDE_URLS = {
  'arcane-mage':  'https://www.wowhead.com/tbc/guide/classes/mage/arcane/dps-bis-gear-pve-pre-raid',
  'fire-mage':    'https://www.wowhead.com/tbc/guide/classes/mage/fire/dps-bis-gear-pve-pre-raid',
  'frost-mage':   'https://www.wowhead.com/tbc/guide/classes/mage/frost/dps-bis-gear-pve-pre-raid',
  'holy-paladin': 'https://www.wowhead.com/tbc/guide/classes/paladin/holy/healer-bis-gear-pve-pre-raid',
  'prot-paladin': 'https://www.wowhead.com/tbc/guide/classes/paladin/tank-bis-gear-pve-pre-raid',
  'ret-paladin':  'https://www.wowhead.com/tbc/guide/classes/paladin/retribution/dps-bis-gear-pve-pre-raid',
  'fury-warrior': 'https://www.wowhead.com/tbc/guide/classes/warrior/dps-bis-gear-pve-pre-raid',
  'arms-warrior': 'https://www.wowhead.com/tbc/guide/classes/warrior/dps-bis-gear-pve-pre-raid',
  'prot-warrior': 'https://www.wowhead.com/tbc/guide/classes/warrior/tank-bis-gear-pve-pre-raid',
  'bm-hunter':    'https://www.wowhead.com/tbc/guide/classes/hunter/beast-mastery/dps-bis-gear-pve-pre-raid',
  'mm-hunter':    'https://www.wowhead.com/tbc/guide/classes/hunter/marksmanship/dps-bis-gear-pve-pre-raid',
  'sv-hunter':    'https://www.wowhead.com/tbc/guide/classes/hunter/survival/dps-bis-gear-pve-pre-raid',
  'combat-rogue':       'https://www.wowhead.com/tbc/guide/classes/rogue/combat/dps-bis-gear-pve-pre-raid',
  'assassination-rogue':'https://www.wowhead.com/tbc/guide/classes/rogue/assassination/dps-bis-gear-pve-pre-raid',
  'shadow-priest':      'https://www.wowhead.com/tbc/guide/classes/priest/shadow/dps-bis-gear-pve-pre-raid',
  'holy-priest':        'https://www.wowhead.com/tbc/guide/classes/priest/holy/healer-bis-gear-pve-pre-raid',
  'disc-priest':        'https://www.wowhead.com/tbc/guide/classes/priest/healer-bis-gear-pve-pre-raid',
  'ele-shaman':         'https://www.wowhead.com/tbc/guide/classes/shaman/elemental/dps-bis-gear-pve-pre-raid',
  'enh-shaman':         'https://www.wowhead.com/tbc/guide/classes/shaman/enhancement/dps-bis-gear-pve-pre-raid',
  'resto-shaman':       'https://www.wowhead.com/tbc/guide/classes/shaman/healer-bis-gear-pve-pre-raid',
  'affliction-warlock':  'https://www.wowhead.com/tbc/guide/classes/warlock/affliction/dps-bis-gear-pve-pre-raid',
  'destruction-warlock': 'https://www.wowhead.com/tbc/guide/classes/warlock/destruction/dps-bis-gear-pve-pre-raid',
  'demo-warlock':        'https://www.wowhead.com/tbc/guide/classes/warlock/demonology/dps-bis-gear-pve-pre-raid',
  'balance-druid':      'https://www.wowhead.com/tbc/guide/classes/druid/balance/dps-bis-gear-pve-pre-raid',
  'feral-cat-druid':    'https://www.wowhead.com/tbc/guide/classes/druid/feral-combat/dps-bis-gear-pve-pre-raid',
  'feral-bear-druid':   'https://www.wowhead.com/tbc/guide/classes/druid/feral-combat/tank-bis-gear-pve-pre-raid',
  'resto-druid':        'https://www.wowhead.com/tbc/guide/classes/druid/restoration/healer-bis-gear-pve-pre-raid',
};

// Known non-gear item IDs to skip
const SKIP_IDS = new Set([
  29434, // Badge of Justice
]);

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
//  Tooltip cache
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
//  Source DB
// ============================================================

function loadSourceDB() {
  if (!fs.existsSync(SOURCE_DB)) {
    console.error(`Source DB not found: ${SOURCE_DB}`);
    console.error('Run _build-source-db.js first.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(SOURCE_DB, 'utf8'));
}

// ============================================================
//  Extract existing SPECS data from data/specs.js
// ============================================================

/** Extract items for a specific spec slug */
function extractExistingItems(html, slug) {
  let start = html.indexOf(`"${slug}": {`);
  if (start === -1) start = html.indexOf(`"${slug}":{`);
  if (start === -1) return {};

  const nextSpecRe = /\n  "[a-z][\w-]+":\s*\{/g;
  nextSpecRe.lastIndex = start + slug.length + 6;
  const nextMatch = nextSpecRe.exec(html);
  const end = nextMatch ? nextMatch.index : html.length;
  const specBlock = html.substring(start, end);

  const items = {};
  const re = /\{name:"([^"]+)",id:(\d+),q:Q\.(\w+),src:"([^"]+)"/g;
  let m;
  while ((m = re.exec(specBlock))) {
    items[parseInt(m[2])] = {
      name:    m[1],
      quality: m[3],
      src:     m[4],
    };
  }
  return items;
}

/** Extract a global item ID → source map across ALL specs in data/specs.js */
function extractAllItemSources(html) {
  const globalMap = {};
  const re = /\{name:"([^"]+)",id:(\d+),q:Q\.(\w+),src:"([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    const id = parseInt(m[2]);
    const src = m[4];
    // Keep first non-placeholder source found
    if (!globalMap[id] || globalMap[id] === 'Pre-Raid BiS') {
      if (src !== 'Pre-Raid BiS') {
        globalMap[id] = src;
      }
    }
  }
  return globalMap;
}

// ============================================================
//  Guide page fetching + parsing
// ============================================================

async function fetchGuidePage(url) {
  // Try allorigins proxy first
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  try {
    process.stdout.write('  Trying allorigins proxy... ');
    const res = await httpGet(proxyUrl);
    if (res.status === 200 && res.body.length > 5000) {
      console.log(`OK (${(res.body.length/1024).toFixed(0)} KB)`);
      return res.body;
    }
    console.log(`bad response (status=${res.status}, len=${res.body.length})`);
  } catch (e) {
    console.log(`failed: ${e.message}`);
  }

  // Fallback: direct fetch
  try {
    process.stdout.write('  Trying direct fetch... ');
    const res = await httpGet(url);
    if (res.status === 200 && res.body.length > 5000) {
      console.log(`OK (${(res.body.length/1024).toFixed(0)} KB)`);
      return res.body;
    }
    console.log(`bad response (status=${res.status}, len=${res.body.length})`);
  } catch (e) {
    console.log(`failed: ${e.message}`);
  }

  return null;
}

function extractGuideItemIds(guideHtml) {
  const ids = new Set();

  // Pattern 1: /tbc/item=XXXXX or /tbc/item/XXXXX
  const re1 = /\/tbc\/item[=\/](\d+)/g;
  let m;
  while ((m = re1.exec(guideHtml))) {
    const id = parseInt(m[1]);
    if (id >= 1000 && !SKIP_IDS.has(id)) ids.add(id);
  }

  // Pattern 2: [item=XXXXX] wowhead markup
  const re2 = /\[item=(\d+)\]/g;
  while ((m = re2.exec(guideHtml))) {
    const id = parseInt(m[1]);
    if (id >= 1000 && !SKIP_IDS.has(id)) ids.add(id);
  }

  return [...ids];
}

// ============================================================
//  Tooltip fetching & parsing
// ============================================================

async function fetchTooltip(itemId) {
  // Check cache first
  if (tooltipCache[itemId] && !forceRefetch) {
    return tooltipCache[itemId];
  }

  try {
    const url = `https://nether.wowhead.com/tooltip/item/${itemId}?dataEnv=5&locale=0`;
    const res = await httpGet(url);
    if (res.status !== 200) return null;
    const data = JSON.parse(res.body);
    // Cache it
    tooltipCache[itemId] = { name: data.name, quality: data.quality, tooltip: data.tooltip };
    return tooltipCache[itemId];
  } catch {
    return null;
  }
}

async function fetchTooltipsBatch(itemIds, concurrency = 3) {
  const results = {};
  const toFetch = [];

  // Separate cached vs uncached
  for (const id of itemIds) {
    if (tooltipCache[id] && !forceRefetch) {
      results[id] = tooltipCache[id];
    } else {
      toFetch.push(id);
    }
  }

  if (toFetch.length === 0) {
    console.log(`  All ${itemIds.length} tooltips cached`);
    return results;
  }

  console.log(`  ${results.length !== undefined ? Object.keys(results).length : Object.keys(results).length} cached, ${toFetch.length} to fetch`);

  const queue = [...toFetch];
  let completed = 0;
  const total = queue.length;

  async function worker() {
    while (queue.length > 0) {
      const id = queue.shift();
      const tt = await fetchTooltip(id);
      if (tt) results[id] = tt;
      completed++;
      if (completed % 10 === 0 || completed === total) {
        process.stdout.write(`\r  Fetched ${completed}/${total} tooltips...`);
      }
      await sleep(120); // Rate limit
    }
  }

  const workers = [];
  for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  if (total > 0) console.log('');

  // Save cache periodically
  saveCache();

  return results;
}

// ============================================================
//  Tooltip parsing: slot, stats, sockets
// ============================================================

const EQUIP_SLOTS_RE = />(Head|Neck|Shoulder|Back|Chest|Wrist|Hands|Waist|Legs|Feet|Finger|Trinket|Main Hand|Off Hand|One-Hand|Two-Hand|Held In Off-hand|Ranged|Relic|Thrown)</;

const SLOT_KEY_MAP = {
  'Head':'head','Neck':'neck','Shoulder':'shoulders','Back':'back',
  'Chest':'chest','Wrist':'wrists','Hands':'hands','Waist':'waist',
  'Legs':'legs','Feet':'feet','Finger':'ring','Trinket':'trinket',
  'Main Hand':'mainhand','Off Hand':'offhand','One-Hand':'mainhand',
  'Two-Hand':'twohand','Held In Off-hand':'offhand',
  'Ranged':'wand','Relic':'libram','Thrown':'wand',
};

function parseTooltipSlot(tooltipHtml) {
  if (!tooltipHtml) return null;
  const m = tooltipHtml.match(EQUIP_SLOTS_RE);
  return m ? (SLOT_KEY_MAP[m[1]] || null) : null;
}

function parseTooltipStats(tooltipHtml) {
  if (!tooltipHtml) return {};
  const stats = {};

  // Primary stats via <!--statX-->+YY
  const STAT_MAP = { '3':'agi','4':'str','5':'int','6':'spi','7':'stam' };
  const pRe = /<!--stat(\d+)-->\+(\d+)/g;
  let m;
  while ((m = pRe.exec(tooltipHtml))) {
    const k = STAT_MAP[m[1]];
    if (k) stats[k] = parseInt(m[2]);
  }

  // Rating stats via <!--rtgXX-->YY markers (TBC-era items)
  const RTG_MAP = {
    '12':'def','13':'dodge','14':'parry','15':'block',
    '16':'hit','17':'hit','18':'hit','31':'hit',
    '19':'crit','20':'crit','21':'crit','32':'crit',
    '28':'haste','29':'haste','30':'haste','36':'haste',
    '35':'res','37':'expertise',
  };
  const rRe = /<!--rtg(\d+)-->(\d+)/g;
  while ((m = rRe.exec(tooltipHtml))) {
    const k = RTG_MAP[m[1]];
    if (k) stats[k] = (stats[k] || 0) + parseInt(m[2]);
  }

  // Fallback: text-based rating parsing for Classic-era items that lack <!--rtg--> markers.
  // Only match equip effects (class="q2"), NOT set bonuses (which appear inside set blocks).
  // Pattern: class="q2">Increases your spell hit rating by 8.</a>
  const textRatingRe = /class="q2">Increases your (spell |)(hit|critical strike|haste|defense|dodge|parry|block|resilience|expertise) rating by (\d+)/gi;
  while ((m = textRatingRe.exec(tooltipHtml))) {
    const statType = m[2].toLowerCase();
    const val = parseInt(m[3]);
    const keyMap = {
      'hit':'hit','critical strike':'crit','haste':'haste',
      'defense':'def','dodge':'dodge','parry':'parry',
      'block':'block','resilience':'res','expertise':'expertise',
    };
    const k = keyMap[statType];
    if (k && !stats[k]) { // Only fill if rtg markers didn't already set it
      stats[k] = val;
    }
  }

  // Spell power
  const spMatch = tooltipHtml.match(/damage and healing done by magical spells and effects by up to (\d+)/);
  if (spMatch) stats.sp = parseInt(spMatch[1]);

  // Healing power
  const healMatch = tooltipHtml.match(/Increases healing done by spells and effects by up to (\d+)/);
  if (healMatch) stats.heal = parseInt(healMatch[1]);

  // Separate damage+healing
  const dmgHealMatch = tooltipHtml.match(/Increases damage done by up to (\d+) and healing done by up to (\d+)/);
  if (dmgHealMatch) {
    stats.sp = parseInt(dmgHealMatch[1]);
    stats.heal = parseInt(dmgHealMatch[2]);
  }

  // Attack power
  const apMatch = tooltipHtml.match(/attack power by (\d+)/i);
  if (apMatch) stats.ap = parseInt(apMatch[1]);

  // MP5
  const mp5Match = tooltipHtml.match(/Restores (\d+) mana per 5/i);
  if (mp5Match) stats.mp5 = parseInt(mp5Match[1]);

  // Block value
  const bvMatch = tooltipHtml.match(/block value of your shield by (\d+)/i);
  if (bvMatch) stats.blockValue = parseInt(bvMatch[1]);

  // School-specific spell damage
  const schoolRe = /damage done by (Arcane|Fire|Frost|Nature|Shadow|Holy) spells and effects by up to (\d+)/ig;
  while ((m = schoolRe.exec(tooltipHtml))) {
    const school = m[1].toLowerCase();
    stats[school + 'Dmg'] = parseInt(m[2]);
  }

  // We skip base armor (<!--amr-->) since our data doesn't track it.
  // Bonus armor on non-armor slots (trinkets, rings, etc.) would need
  // special detection but is rare enough to handle manually.

  return stats;
}

function parseTooltipSockets(tooltipHtml) {
  if (!tooltipHtml) return { sockets: null, socketBonus: null };

  // Socket colors (class may include extra classes like "q0")
  const sockets = [];
  const socketRe = /class="socket-(red|yellow|blue|meta)[^"]*"/gi;
  let m;
  while ((m = socketRe.exec(tooltipHtml))) {
    sockets.push(m[1].toLowerCase());
  }

  // Socket bonus — extract from "Socket Bonus: +N StatName" text
  let socketBonus = null;
  // Match both plain text and link-wrapped bonus text
  const bonusRe = /Socket Bonus:(?:\s*<[^>]*>)*\s*\+(\d+)\s+([\w\s]+?)(?:<|$)/i;
  const bm = tooltipHtml.match(bonusRe);
  if (bm) {
    const val = parseInt(bm[1]);
    const rawStat = bm[2].trim().toLowerCase();
    const bonusMap = {
      'stamina':'stam','intellect':'int','strength':'str','agility':'agi',
      'spirit':'spi',
      'spell critical strike rating':'crit','critical strike rating':'crit',
      'hit rating':'hit','spell hit rating':'hit',
      'resilience rating':'res','resilience':'res',
      'healing':'heal',
      'dodge rating':'dodge','defense rating':'def',
      'block rating':'block','block value':'blockValue',
      'spell power':'sp','spell damage':'sp','spell damage and healing':'sp',
      'attack power':'ap',
      'mana every 5 seconds':'mp5','mana per 5 sec':'mp5','mp5':'mp5',
      'haste rating':'haste',
    };
    const key = bonusMap[rawStat] || bonusMap[rawStat.replace(/ and .*/, '')] || rawStat.substring(0, 3);
    socketBonus = {};
    socketBonus[key] = val;
  }

  return {
    sockets: sockets.length > 0 ? sockets : null,
    socketBonus: sockets.length > 0 ? socketBonus : null,
  };
}

// ============================================================
//  Source resolution
// ============================================================

// PvP item name prefixes
const PVP_PREFIXES = [
  "Gladiator's", "Grand Marshal's", "High Warlord's", "Field Marshal's",
  "Marshal's", "General's", "Warlord's", "Lieutenant Commander's",
  "Champion's", "Lieutenant General's", "Commander's",
];

function resolveSource(itemId, itemName, tooltipHtml, sourceDb, existingItems, globalSources) {
  const id = String(itemId);

  // 1. AtlasLoot source DB
  if (sourceDb[id]) {
    return sourceDb[id].source;
  }

  // 2. Tooltip: crafting profession
  if (tooltipHtml) {
    const profMatch = tooltipHtml.match(/Requires\s+(Tailoring|Blacksmithing|Leatherworking|Engineering|Jewelcrafting|Alchemy|Enchanting)/i);
    if (profMatch) {
      const profession = profMatch[1];
      const isBop = /Binds when picked up/i.test(tooltipHtml);
      // Check for specialization
      const specMatch = tooltipHtml.match(/Requires\s+(Spellfire Tailoring|Shadoweave Tailoring|Mooncloth Tailoring|Armorsmithing|Weaponsmithing|Swordsmithing|Hammersmithing|Axesmithing|Dragonscale Leatherworking|Tribal Leatherworking|Elemental Leatherworking|Gnomish Engineer|Goblin Engineer)/i);
      if (specMatch) {
        return `${specMatch[1]} (${isBop ? 'BoP' : 'BoE'})`;
      }
      return `${profession} (${isBop ? 'BoP' : 'BoE'})`;
    }

    // 3. Tooltip: faction requirement
    const factionMatch = tooltipHtml.match(/Requires\s+([\w\s']+?)\s*-\s*(Friendly|Honored|Revered|Exalted)/i);
    if (factionMatch) {
      return `${factionMatch[1].trim()} - ${factionMatch[2]}`;
    }
  }

  // 4. Existing source from our SPECS — current spec first, then ANY spec
  if (existingItems[itemId] && existingItems[itemId].src && existingItems[itemId].src !== 'Pre-Raid BiS') {
    return existingItems[itemId].src;
  }
  if (globalSources[itemId]) {
    return globalSources[itemId];
  }

  // 5. PvP detection by item name prefix
  if (itemName && PVP_PREFIXES.some(p => itemName.startsWith(p))) {
    return 'PvP';
  }

  // 6. World drop detection: BoE + no other source = World Drop
  if (tooltipHtml && /Binds when equipped/i.test(tooltipHtml)) {
    return 'World Drop (BoE)';
  }

  // 7. Fallback
  return 'TODO';
}

// Known item sources that can't be auto-detected.
// Wowhead pages are JS-rendered so static fetch doesn't reliably extract quest data.
// Covers: quest rewards, Classic raid drops, misc sources.
const KNOWN_SOURCES = {
  // === Quest rewards (TBC) ===
  31699: 'Quest: Teleport This!',
  31731: "Quest: Mekeda's Burden",
  31104: 'Quest: Teron Gorefiend, I am...',
  31105: 'Quest: Teron Gorefiend, I am...',
  28169: 'Quest: Nagrand',
  28174: 'Quest: The Soul Devices',
  28175: 'Quest: The Soul Devices',
  28176: 'Quest: Into the Heart of the Labyrinth',
  29317: 'Quest: Return to Andormu',
  29323: 'Quest: Return to Andormu',
  29341: 'Quest: Everything Will Be Alright',
  29780: 'Quest: Destroy Naberius!',
  30377: "Quest: Ar'kelos the Guardian",
  29776: "Quest: Ar'kelos the Guardian",
  31692: 'Quest: The Hound-Master',
  31691: 'Quest: The Hound-Master',
  31694: 'Quest: The Hound-Master',
  29813: 'Quest: Netherstorm',
  29814: 'Quest: Hitting the Motherlode',
  30925: 'Quest: Shadowmoon Valley',
  30924: 'Quest: Shadowmoon Valley',
  30515: 'Quest: Outland',
  25777: 'Quest: Nagrand',
  28182: "Quest: The Warlord's Hideout",
  31717: 'Quest: Drill the Drillmaster',
  30291: 'Quest: Deathblow to the Legion',
  31461: 'Quest: How to Break Into the Arcatraz',
  29349: 'Quest: Underbog',
  30257: 'Quest: Terokkar Forest',
  25685: 'Quest: Nagrand',
  25686: 'Quest: Nagrand',
  // Helmet of Second Sight variants
  31110: 'Quest: Teron Gorefiend, I am...',
  31107: 'Quest: Teron Gorefiend, I am...',
  31106: 'Quest: Teron Gorefiend, I am...',
  31109: 'Quest: Teron Gorefiend, I am...',
  // Natasha's quest chain (Blade's Edge)
  31693: "Quest: The Hound-Master",
  31696: "Quest: The Hound-Master",
  // Shadowmoon Valley quests
  30940: 'Quest: Akama',
  30932: 'Quest: Akama',
  30941: 'Quest: Shadowmoon Valley',
  30933: 'Quest: Shadowmoon Valley',
  30939: 'Quest: Shadowmoon Valley',
  30999: 'Quest: Shadowmoon Valley',
  30951: "Quest: Ar'tor, Son of Oronok",
  30971: 'Quest: Shadowmoon Valley',
  // Netherstorm quests
  30010: 'Quest: Netherstorm',
  30003: 'Quest: Netherstorm',
  31548: 'Quest: Netherstorm',
  30258: 'Quest: Netherstorm',
  29974: 'Quest: Netherstorm',
  30298: 'Quest: Netherstorm',
  30514: 'Quest: Netherstorm',
  29808: 'Quest: Netherstorm',
  // Terokkar Forest quests
  29340: 'Quest: Terokkar Forest',
  29343: "Quest: Haramad's Bargain",
  29345: "Quest: Haramad's Bargain",
  29337: 'Quest: Terokkar Forest',
  29334: 'Quest: Terokkar Forest',
  29335: 'Quest: Terokkar Forest',
  29329: 'Quest: Terokkar Forest',
  29330: 'Quest: Terokkar Forest',
  29316: 'Quest: Terokkar Forest',
  29315: 'Quest: Terokkar Forest',
  29322: 'Quest: Terokkar Forest',
  29327: 'Quest: Terokkar Forest',
  // Nagrand quests
  25759: 'Quest: Nagrand',
  25809: 'Quest: Nagrand',
  25803: 'Quest: Nagrand',
  25819: 'Quest: Nagrand',
  25820: 'Quest: Nagrand',
  25628: 'Quest: Nagrand',
  25619: 'Quest: Nagrand',
  25620: 'Quest: Nagrand',
  25633: 'Quest: Nagrand',
  25562: 'Quest: Nagrand',
  25538: 'Quest: Nagrand',
  25936: 'Quest: Terokkar Forest',
  25788: 'Quest: Nagrand',
  25789: 'Quest: Nagrand',
  25790: 'Quest: Nagrand',
  25791: 'Quest: Nagrand',
  25792: 'Quest: Nagrand',
  25922: 'Quest: Nagrand',
  // Blade's Edge Mountains quests
  31073: "Quest: Blade's Edge Mountains",
  31071: "Quest: Blade's Edge Mountains",
  // Zangarmarsh quests
  29779: 'Quest: Zangarmarsh',
  // Hellfire Peninsula quests
  28168: 'Quest: Nagrand',
  28183: 'Quest: Zangarmarsh',
  28032: 'Quest: Hellfire Peninsula',
  28031: 'Quest: Hellfire Peninsula',
  28064: 'Quest: Hellfire Peninsula',
  // Netherwing quest rewards
  31490: 'Quest: Netherwing',
  31493: 'Quest: Netherwing',
  // Misc TBC quests
  30519: 'Quest: Shadowmoon Valley',
  30535: 'Quest: Zangarmarsh',
  30399: 'Quest: Shadowmoon Valley',
  30400: 'Quest: Netherstorm',
  30401: 'Quest: Netherstorm',
  30375: 'Quest: Shadowmoon Valley',
  30378: 'Quest: Netherstorm',
  30371: 'Quest: Shadowmoon Valley',
  30386: 'Quest: Shadowmoon Valley',
  30364: 'Quest: Shadowmoon Valley',
  30277: 'Quest: Shadowmoon Valley',
  30279: 'Quest: Shadowmoon Valley',
  30225: 'Quest: Netherstorm',
  30330: 'Quest: Netherstorm',
  30299: 'Quest: Netherstorm',
  30334: 'Quest: Netherstorm',
  30741: 'Quest: Shadowmoon Valley',
  29777: 'Quest: Netherstorm',
  29774: 'Quest: Netherstorm',
  29783: 'Quest: Netherstorm',
  31462: 'Quest: How to Break Into the Arcatraz',
  31381: "Quest: Sha'tari Base Camp",
  31532: 'Quest: Terokkar Forest',
  31766: 'Quest: Terokkar Forest',
  31797: 'Quest: Nagrand',
  31919: 'Quest: Netherstorm',
  31924: 'Quest: Terokkar Forest',
  32866: "Quest: Blade's Edge Mountains",
  32871: "Quest: Blade's Edge Mountains",
  31111: 'Quest: Shadowmoon Valley',
  32534: 'Quest: Netherstorm',
  32082: 'Quest: Netherstorm',
  28484: 'Quest: Hellfire Peninsula',
  28435: 'Quest: Hellfire Peninsula',

  // Misc TBC
  31923: 'Quest: Netherstorm', // Band of the Crystalline Void

  // === Classic Naxx drops ===
  // T3 set pieces (all from Naxxramas)
  22416: 'Classic Naxx', 22420: 'Classic Naxx', // Dreadnaught
  22424: 'Classic Naxx', 22425: 'Classic Naxx', 22428: 'Classic Naxx', // Redemption
  22429: 'Classic Naxx', 22430: 'Classic Naxx', 22431: 'Classic Naxx',
  22436: 'Classic Naxx', 22437: 'Classic Naxx', 22438: 'Classic Naxx', // Cryptstalker
  22439: 'Classic Naxx', 22440: 'Classic Naxx', 22441: 'Classic Naxx',
  22442: 'Classic Naxx', 22443: 'Classic Naxx',
  22464: 'Classic Naxx', 22466: 'Classic Naxx', 22467: 'Classic Naxx', // Earthshatter
  22470: 'Classic Naxx', 22471: 'Classic Naxx',
  22494: 'Classic Naxx', 22495: 'Classic Naxx', // Dreamwalker
  22504: 'Classic Naxx', 22507: 'Classic Naxx', 22508: 'Classic Naxx', // Plagueheart
  22512: 'Classic Naxx', 22514: 'Classic Naxx', 22515: 'Classic Naxx', // Faith
  22517: 'Classic Naxx', 22519: 'Classic Naxx',
  23067: 'Classic Naxx', // Ring of the Cryptstalker
  // Naxx boss drops
  22630: 'Classic Naxx', 22631: 'Classic Naxx', 22632: 'Classic Naxx', // Atiesh
  22812: 'Classic Naxx', // Nerubian Slavemaker
  22936: 'Classic Naxx', // Wristguards of Vengeance
  22939: 'Classic Naxx', // Band of Unanswered Prayers
  22960: 'Classic Naxx', // Cloak of Suturing
  22961: 'Classic Naxx', // Band of Reanimation
  23009: 'Classic Naxx', // Wand of the Whispering Dead
  23036: 'Classic Naxx', // Necklace of Necropsy
  23038: 'Classic Naxx', // Band of Unnatural Forces
  23039: 'Classic Naxx', // The Eye of Nerub
  23040: 'Classic Naxx', // Glyph of Deflection
  23043: 'Classic Naxx', // The Face of Death
  23045: 'Classic Naxx', // Shroud of Dominion
  23047: 'Classic Naxx', // Eye of the Dead
  23056: 'Classic Naxx', // Hammer of the Twisting Nether
  23057: 'Classic Naxx', // Gem of Trapped Innocents
  23206: 'Classic Naxx', // Mark of the Champion
  23219: 'Classic Naxx', // Girdle of the Mentor
  23220: 'Classic Naxx', // Crystal Webbed Robe
  23226: 'Classic Naxx', // Ghoul Skin Tunic
  23242: 'Classic Naxx', // Claw of the Frost Wyrm
  23577: 'Classic Naxx', // The Hungering Cold
  23029: 'Classic Naxx', // Noth's Frigid Heart
  23048: 'Classic Naxx', // Sapphiron's Right Eye

  // === Classic BWL drops ===
  19337: 'Classic BWL', // The Black Book
  19343: 'Classic BWL', // Scrolls of Blinding Light
  19377: 'Classic BWL', // Prestor's Talisman of Connivery
  19395: 'Classic BWL', // Rejuvenating Gem
  19406: 'Classic BWL', // Drake Fang Talisman
  19407: 'Classic BWL', // Ebony Flame Gloves
  19309: 'Classic BWL', // Tome of Shadow Force
  19381: 'Classic BWL', // Boots of the Shadow Flame
  19382: 'Classic BWL', // Pure Elementium Band
  19344: 'Classic BWL', // Natural Alignment Crystal

  // === Classic MC drops ===
  18820: 'Classic MC', // Talisman of Ephemeral Power
  18823: 'Classic MC', // Aged Core Leather Gloves
  19147: 'Classic MC', // Ring of Spell Power
  18814: 'Classic MC', // Choker of the Fire Lord

  // === Classic AQ40 drops ===
  21604: 'Classic AQ40', // Bracelets of Royal Redemption
  21617: 'Classic AQ40', // Wasphide Gauntlets
  21625: 'Classic AQ40', // Scarab Brooch
  21670: 'Classic AQ40', // Badge of the Swarmguard
  21673: 'Classic AQ40', // Silithid Claw
  21712: 'Classic AQ40', // Amulet of the Fallen God
  21581: 'Classic AQ40', // Gauntlets of Annihilation
  21582: 'Classic AQ40', // Grasp of the Old God
  21597: 'Classic AQ40', // Royal Scepter of Vek'lor
  21608: 'Classic AQ40', // Amulet of Vek'nilash
  21609: 'Classic AQ40', // Regenerating Belt of Vek'nilash
  21620: 'Classic AQ40', // Ring of the Martyr

  // === Classic AQ20 ===
  21186: 'Classic AQ20', // Rockfury Bracers
  19431: 'Classic AQ20', // Styleen's Impeding Scarab

  // === Classic other raids ===
  19133: 'Classic World Boss', // Fel Infused Leggings (Lord Kazzak)
  19434: 'Classic ZG', // Band of Dark Dominion
  19950: 'Classic ZG', // Zandalarian Hero Charm
  19019: 'Classic MC', // Thunderfury
  12930: 'Classic UBRS', // Briarwood Reed

  // === Crafted / Profession ===
  13503: 'Alchemy (BoP)', // Alchemist's Stone
  22128: 'Enchanting', // Master Firestone (not really... but it's an enchanting wand)
  24126: 'Jewelcrafting (BoP)', // Figurine - Living Ruby Serpent

  // === Darkmoon Faire ===
  31856: 'Darkmoon Faire', // Darkmoon Card: Crusade

  // === Classic dungeon drops ===
  22819: 'Classic Stratholme', // Shield of Condemnation
  22401: 'Classic Naxx', // Libram of Hope (actually Naxx trash)
  22396: 'Classic Naxx', // Totem of Life (Naxx trash)

  // === Event items ===
  35514: 'Midsummer Fire Festival', // Frostscythe of Lord Ahune
  35497: 'Midsummer Fire Festival', // Cloak of the Frigid Winds
  35407: 'Midsummer Fire Festival', // Savage Plate Chestpiece (Lord Ahune)
  35411: 'Midsummer Fire Festival', // Savage Plate Shoulders (Lord Ahune)

  // === Misc TBC items ===
  27825: 'Quest: Zangarmarsh', // Predatory Gloves
  27827: 'Quest: Zangarmarsh', // Lucid Dream Bracers
  27835: 'Quest: Zangarmarsh', // Stillwater Girdle
  27924: 'Quest: Hellfire Peninsula', // Mark of Defiance
  25645: 'Quest: Nagrand', // Totem of the Plains
};

function resolveKnownSource(itemId) {
  return KNOWN_SOURCES[itemId] || null;
}

// ============================================================
//  Quality helpers
// ============================================================

const QUALITY_MAP = { 0:'poor', 1:'common', 2:'uncommon', 3:'rare', 4:'epic', 5:'legendary' };
const QUALITY_SORT = { 5:0, 4:1, 3:2, 2:3, 1:4, 0:5 };

function qualityStr(q) {
  return `Q.${QUALITY_MAP[q] || 'rare'}`;
}

// ============================================================
//  Slot ordering
// ============================================================

const SLOT_ORDER = [
  'head','neck','shoulders','back','chest','wrists','hands','waist','legs','feet',
  'ring1','ring2','trinket1','trinket2',
  'mainhand','offhand','twohand','wand','libram',
];

// Items detected as "ring" get split into ring1/ring2
// Items detected as "trinket" get split into trinket1/trinket2
function normalizeSlot(slot) {
  if (slot === 'ring') return 'ring1';    // Will be duplicated into ring2
  if (slot === 'trinket') return 'trinket1'; // Will be duplicated into trinket2
  return slot;
}

// ============================================================
//  Format output
// ============================================================

function formatItem(item) {
  const parts = [];
  parts.push(`name:"${item.name}"`);
  parts.push(`id:${item.id}`);
  parts.push(`q:${qualityStr(item.quality)}`);
  parts.push(`src:"${item.src}"`);

  // Format stats
  const statPairs = Object.entries(item.stats)
    .filter(([k, v]) => v !== 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`);
  parts.push(`stats:{${statPairs.join(',')}}`);

  // Sockets
  if (item.sockets) {
    parts.push(`sockets:${JSON.stringify(item.sockets)}`);
    if (item.socketBonus) {
      const bonusPairs = Object.entries(item.socketBonus).map(([k,v]) => `${k}:${v}`);
      parts.push(`socketBonus:{${bonusPairs.join(',')}}`);
    }
  }

  return `{${parts.join(',')}}`;
}

// ============================================================
//  Main
// ============================================================

async function main() {
  const guideUrl = GUIDE_URLS[specSlug];
  if (!guideUrl) {
    console.error(`Unknown spec slug: "${specSlug}"`);
    console.error('Available:', Object.keys(GUIDE_URLS).join(', '));
    process.exit(1);
  }

  console.log(`=== Sync Spec: ${specSlug} ===\n`);

  // 1. Load source DB and cache
  console.log('Loading source DB...');
  const sourceDb = loadSourceDB();
  console.log(`  ${Object.keys(sourceDb).length} source entries`);

  loadCache();

  // 2. Load existing SPECS data (current spec + global cross-spec sources)
  console.log('Loading existing SPECS data...');
  let existingItems = {};
  let globalSources = {};
  if (fs.existsSync(INDEX_HTML)) {
    const html = fs.readFileSync(INDEX_HTML, 'utf8');
    existingItems = extractExistingItems(html, specSlug);
    globalSources = extractAllItemSources(html);
    console.log(`  ${Object.keys(existingItems).length} existing items for ${specSlug}, ${Object.keys(globalSources).length} global sources`);
  }

  // 3. Fetch Wowhead guide
  console.log(`\nFetching guide: ${guideUrl}`);
  const guideHtml = await fetchGuidePage(guideUrl);
  if (!guideHtml) {
    console.error('Failed to fetch guide page!');
    process.exit(1);
  }

  const guideItemIds = extractGuideItemIds(guideHtml);
  console.log(`  Found ${guideItemIds.length} item IDs on guide page`);

  // Also include existing item IDs not on guide (preserve our additions)
  const allIds = new Set(guideItemIds);
  for (const id of Object.keys(existingItems)) {
    allIds.add(parseInt(id));
  }
  console.log(`  Total unique IDs (guide + existing): ${allIds.size}`);

  // 4. Fetch all tooltips
  console.log('\nFetching tooltips...');
  const tooltips = await fetchTooltipsBatch([...allIds]);

  // 5. Build items grouped by slot
  console.log('\nProcessing items...');
  const slotItems = {}; // slot -> [items]
  let skippedNonGear = 0;
  let todoCount = 0;

  for (const id of allIds) {
    const tt = tooltips[id];
    if (!tt || !tt.tooltip) {
      console.log(`  Warning: No tooltip for ${id}`);
      continue;
    }

    const rawSlot = parseTooltipSlot(tt.tooltip);
    if (!rawSlot) {
      skippedNonGear++;
      continue;
    }

    const slot = normalizeSlot(rawSlot);
    const stats = parseTooltipStats(tt.tooltip);
    const { sockets, socketBonus } = parseTooltipSockets(tt.tooltip);
    const src = resolveSource(id, tt.name, tt.tooltip, sourceDb, existingItems, globalSources);
    if (src === 'TODO') todoCount++;

    const item = {
      id,
      name: tt.name,
      quality: tt.quality,
      src,
      stats,
      sockets,
      socketBonus,
    };

    // Remove armor stat for non-tank common slots (keep it for rings/trinkets/backs)
    // Actually, keep armor - let the user decide

    if (!slotItems[slot]) slotItems[slot] = [];
    slotItems[slot].push(item);

    // For ring/trinket, also add to ring2/trinket2
    if (rawSlot === 'ring' || rawSlot === 'trinket') {
      const slot2 = rawSlot === 'ring' ? 'ring2' : 'trinket2';
      if (!slotItems[slot2]) slotItems[slot2] = [];
      slotItems[slot2].push({ ...item });
    }
  }

  console.log(`  Skipped ${skippedNonGear} non-gear items`);
  console.log(`  ${todoCount} items with TODO source`);

  // 5b. Known quest sources fallback for remaining TODOs
  if (todoCount > 0) {
    console.log('\nResolving TODO sources via known sources map...');
    for (const slot of Object.keys(slotItems)) {
      for (const item of slotItems[slot]) {
        if (item.src === 'TODO') {
          const knownSrc = resolveKnownSource(item.id);
          if (knownSrc) {
            console.log(`  ${item.name} (${item.id}) → ${knownSrc}`);
            item.src = knownSrc;
            todoCount--;
          }
        }
      }
    }
  }

  // 6. Sort items within each slot: epic > rare > uncommon, then by name
  for (const slot of Object.keys(slotItems)) {
    slotItems[slot].sort((a, b) => {
      const qa = QUALITY_SORT[a.quality] ?? 5;
      const qb = QUALITY_SORT[b.quality] ?? 5;
      if (qa !== qb) return qa - qb;
      return a.name.localeCompare(b.name);
    });

    // Deduplicate by ID within each slot
    const seen = new Set();
    slotItems[slot] = slotItems[slot].filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  // 7. Generate output
  console.log('\nGenerating output...');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const outputPath = path.join(OUTPUT_DIR, `${specSlug}.js`);
  const now = new Date().toISOString().split('T')[0];
  let totalItems = 0;
  const slotCounts = {};

  const lines = [];
  lines.push(`// Generated by _sync-spec.js — do not edit manually`);
  lines.push(`// Source: Wowhead guide + AtlasLoot + tooltip API`);
  lines.push(`// Date: ${now}`);

  lines.push('');
  lines.push('slots:{');

  for (const slot of SLOT_ORDER) {
    const items = slotItems[slot];
    if (!items || items.length === 0) continue;

    slotCounts[slot] = items.length;
    totalItems += items.length;

    lines.push(`  ${slot}:[`);
    for (const item of items) {
      lines.push(`    ${formatItem(item)},`);
    }
    lines.push('  ],');
  }

  lines.push('}');

  // Update header with total count
  lines[3] = `// Items: ${totalItems} across ${Object.keys(slotCounts).length} slots`;

  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
  console.log(`  Wrote ${outputPath}`);

  // 8. Summary
  const SEP = '='.repeat(60);
  console.log(`\n${SEP}`);
  console.log(`  SUMMARY: ${specSlug}`);
  console.log(SEP);
  console.log(`  Total items:     ${totalItems}`);
  console.log(`  Slots:           ${Object.keys(slotCounts).length}`);
  console.log(`  TODO sources:    ${todoCount}`);
  console.log(`  Guide items:     ${guideItemIds.length}`);
  console.log(`  Existing items:  ${Object.keys(existingItems).length}`);
  console.log('');
  console.log('  Per slot:');
  for (const [slot, count] of Object.entries(slotCounts)) {
    console.log(`    ${slot.padEnd(12)} ${count}`);
  }
  console.log('');

  // 9. Show TODO items
  if (todoCount > 0) {
    console.log('  Items needing source resolution (TODO):');
    for (const slot of SLOT_ORDER) {
      const items = slotItems[slot] || [];
      for (const item of items) {
        if (item.src === 'TODO') {
          console.log(`    [${slot}] ${item.name} (${item.id})`);
        }
      }
    }
    console.log('');
  }

  console.log('Done!');
}

main().catch(err => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
