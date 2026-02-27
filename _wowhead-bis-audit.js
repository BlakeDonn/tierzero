#!/usr/bin/env node
'use strict';

/*  _wowhead-bis-audit.js
 *  Fetches Wowhead pre-raid BiS guides for each spec, extracts ALL items
 *  (including "Other Recommendations" expand panels), and compares against
 *  our SPECS data to produce an audit report.
 *
 *  Usage:  node _wowhead-bis-audit.js [spec-slug ...]
 *  Default: arcane-mage prot-paladin
 */

const https = require('https');
const http  = require('http');
const fs    = require('fs');

// ============================================================
//  Configuration
// ============================================================

const DEFAULT_SPECS = ['arcane-mage', 'prot-paladin'];
const TEST_SPECS = process.argv.slice(2).length > 0
  ? process.argv.slice(2)
  : DEFAULT_SPECS;

// Wowhead TBC pre-raid BiS guide URLs per spec slug
const GUIDE_URLS = {
  // Mage
  'arcane-mage':  'https://www.wowhead.com/tbc/guide/classes/mage/arcane/dps-bis-gear-pve-pre-raid',
  'fire-mage':    'https://www.wowhead.com/tbc/guide/classes/mage/fire/dps-bis-gear-pve-pre-raid',
  'frost-mage':   'https://www.wowhead.com/tbc/guide/classes/mage/frost/dps-bis-gear-pve-pre-raid',
  // Paladin
  'holy-paladin': 'https://www.wowhead.com/tbc/guide/classes/paladin/holy/healer-bis-gear-pve-pre-raid',
  'prot-paladin': 'https://www.wowhead.com/tbc/guide/classes/paladin/tank-bis-gear-pve-pre-raid',
  'ret-paladin':  'https://www.wowhead.com/tbc/guide/classes/paladin/retribution/dps-bis-gear-pve-pre-raid',
  // Warrior
  'fury-warrior': 'https://www.wowhead.com/tbc/guide/classes/warrior/fury/dps-bis-gear-pve-pre-raid',
  'arms-warrior': 'https://www.wowhead.com/tbc/guide/classes/warrior/arms/dps-bis-gear-pve-pre-raid',
  'prot-warrior': 'https://www.wowhead.com/tbc/guide/classes/warrior/tank-bis-gear-pve-pre-raid',
  // Hunter
  'bm-hunter':    'https://www.wowhead.com/tbc/guide/classes/hunter/beast-mastery/dps-bis-gear-pve-pre-raid',
  'mm-hunter':    'https://www.wowhead.com/tbc/guide/classes/hunter/marksmanship/dps-bis-gear-pve-pre-raid',
  'sv-hunter':    'https://www.wowhead.com/tbc/guide/classes/hunter/survival/dps-bis-gear-pve-pre-raid',
  // Rogue
  'combat-rogue':       'https://www.wowhead.com/tbc/guide/classes/rogue/combat/dps-bis-gear-pve-pre-raid',
  'assassination-rogue':'https://www.wowhead.com/tbc/guide/classes/rogue/assassination/dps-bis-gear-pve-pre-raid',
  // Priest
  'shadow-priest':      'https://www.wowhead.com/tbc/guide/classes/priest/shadow/dps-bis-gear-pve-pre-raid',
  'holy-priest':        'https://www.wowhead.com/tbc/guide/classes/priest/holy/healer-bis-gear-pve-pre-raid',
  'disc-priest':        'https://www.wowhead.com/tbc/guide/classes/priest/discipline/healer-bis-gear-pve-pre-raid',
  // Shaman
  'ele-shaman':         'https://www.wowhead.com/tbc/guide/classes/shaman/elemental/dps-bis-gear-pve-pre-raid',
  'enh-shaman':         'https://www.wowhead.com/tbc/guide/classes/shaman/enhancement/dps-bis-gear-pve-pre-raid',
  'resto-shaman':       'https://www.wowhead.com/tbc/guide/classes/shaman/restoration/healer-bis-gear-pve-pre-raid',
  // Warlock
  'affliction-warlock':  'https://www.wowhead.com/tbc/guide/classes/warlock/affliction/dps-bis-gear-pve-pre-raid',
  'destruction-warlock': 'https://www.wowhead.com/tbc/guide/classes/warlock/destruction/dps-bis-gear-pve-pre-raid',
  'demo-warlock':        'https://www.wowhead.com/tbc/guide/classes/warlock/demonology/dps-bis-gear-pve-pre-raid',
  // Druid
  'balance-druid':      'https://www.wowhead.com/tbc/guide/classes/druid/balance/dps-bis-gear-pve-pre-raid',
  'feral-cat-druid':    'https://www.wowhead.com/tbc/guide/classes/druid/feral-combat/dps-bis-gear-pve-pre-raid',
  'feral-bear-druid':   'https://www.wowhead.com/tbc/guide/classes/druid/feral-combat/tank-bis-gear-pve-pre-raid',
  'resto-druid':        'https://www.wowhead.com/tbc/guide/classes/druid/restoration/healer-bis-gear-pve-pre-raid',
};

// Known non-gear item IDs to always skip
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
//  Parse our SPECS items from data/specs.js
// ============================================================

function extractOurItems(html, specSlug) {
  // Find the spec block start
  let start = html.indexOf(`"${specSlug}": {`);
  if (start === -1) start = html.indexOf(`"${specSlug}":{`);
  if (start === -1) {
    console.error(`  ERROR: Spec "${specSlug}" not found in data/specs.js`);
    return [];
  }

  // Find end: next spec definition or EOF
  const nextSpecRe = /\n  "[a-z][\w-]+":\s*\{/g;
  nextSpecRe.lastIndex = start + specSlug.length + 6;
  const nextMatch = nextSpecRe.exec(html);
  const end = nextMatch ? nextMatch.index : html.length;

  const specBlock = html.substring(start, end);
  const items = [];
  let currentSlot = null;

  for (const line of specBlock.split('\n')) {
    const slotMatch = line.match(/^\s{6}(\w+):\s*\[/);
    if (slotMatch) currentSlot = slotMatch[1];

    const itemMatch = line.match(/\{name:"([^"]+)",id:(\d+),q:Q\.(\w+),src:"([^"]+)"/);
    if (itemMatch && currentSlot) {
      items.push({
        slot:    currentSlot,
        name:    itemMatch[1],
        id:      parseInt(itemMatch[2]),
        quality: itemMatch[3],
        src:     itemMatch[4],
      });
    }
  }
  return items;
}

/** Extract full stat object for a specific item ID from raw HTML */
function extractItemStats(html, itemId) {
  const re = new RegExp(
    `\\{name:"[^"]+",id:${itemId},q:Q\\.\\w+,src:"[^"]+",stats:\\{([^}]+)\\}`
  );
  const m = html.match(re);
  if (!m) return null;
  const stats = {};
  const sr = /(\w+):(-?\d+)/g;
  let sm;
  while ((sm = sr.exec(m[1]))) stats[sm[1]] = parseInt(sm[2]);
  return stats;
}

// ============================================================
//  Parse Wowhead guide page
// ============================================================

function extractGuideItemIds(guideHtml) {
  const ids = new Set();

  // Pattern 1: /tbc/item=XXXXX or /tbc/item/XXXXX in hrefs
  const re1 = /\/tbc\/item[=\/](\d+)/g;
  let m;
  while ((m = re1.exec(guideHtml))) {
    const id = parseInt(m[1]);
    if (id >= 1000 && !SKIP_IDS.has(id)) ids.add(id);
  }

  // Pattern 2: [item=XXXXX] wowhead markup (sometimes in script data)
  const re2 = /\[item=(\d+)\]/g;
  while ((m = re2.exec(guideHtml))) {
    const id = parseInt(m[1]);
    if (id >= 1000 && !SKIP_IDS.has(id)) ids.add(id);
  }

  return [...ids];
}

/** Extract item names from WH.Gatherer.addData(3, ...) calls */
function extractGathererNames(guideHtml) {
  const names = {};
  const re = /WH\.Gatherer\.addData\(\s*3\s*,\s*\d+\s*,\s*\{([\s\S]*?)\}\s*\)/g;
  let m;
  while ((m = re.exec(guideHtml))) {
    const itemRe = /"(\d+)":\s*\{[^}]*?"name_enus":\s*"([^"]+)"/g;
    let im;
    while ((im = itemRe.exec(m[1]))) {
      names[parseInt(im[1])] = im[2];
    }
  }
  return names;
}

// ============================================================
//  Tooltip fetching & parsing
// ============================================================

async function fetchTooltip(itemId) {
  try {
    const url = `https://nether.wowhead.com/tooltip/item/${itemId}?dataEnv=5&locale=0`;
    const res = await httpGet(url);
    if (res.status !== 200) return null;
    return JSON.parse(res.body);
  } catch { return null; }
}

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

  // --- Primary stats via <!--statX-->+YY markers ---
  const STAT_MAP = { '3':'agi','4':'str','5':'int','6':'spi','7':'stam' };
  const pRe = /<!--stat(\d+)-->\+(\d+)/g;
  let m;
  while ((m = pRe.exec(tooltipHtml))) {
    const k = STAT_MAP[m[1]];
    if (k) stats[k] = parseInt(m[2]);
  }

  // --- Rating stats via <!--rtgXX-->YY markers ---
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

  // --- Spell power: "damage and healing done by magical spells...up to XX" ---
  const spMatch = tooltipHtml.match(/damage and healing done by magical spells and effects by up to (\d+)/);
  if (spMatch) stats.sp = parseInt(spMatch[1]);

  // --- Healing power ---
  const healMatch = tooltipHtml.match(/Increases healing done by spells and effects by up to (\d+)/);
  if (healMatch) stats.heal = parseInt(healMatch[1]);

  // --- Separate damage+healing (some items list both) ---
  const dmgHealMatch = tooltipHtml.match(/Increases damage done by up to (\d+) and healing done by up to (\d+)/);
  if (dmgHealMatch) {
    stats.sp = parseInt(dmgHealMatch[1]);
    stats.heal = parseInt(dmgHealMatch[2]);
  }

  // --- Attack power ---
  const apMatch = tooltipHtml.match(/attack power by (\d+)/i);
  if (apMatch) stats.ap = parseInt(apMatch[1]);

  // --- MP5 ---
  const mp5Match = tooltipHtml.match(/Restores (\d+) mana per 5/i);
  if (mp5Match) stats.mp5 = parseInt(mp5Match[1]);

  // --- Block value ---
  const bvMatch = tooltipHtml.match(/block value of your shield by (\d+)/i);
  if (bvMatch) stats.blockValue = parseInt(bvMatch[1]);

  // --- School-specific spell damage ---
  const schoolRe = /damage done by (Arcane|Fire|Frost|Nature|Shadow|Holy) spells and effects by up to (\d+)/ig;
  while ((m = schoolRe.exec(tooltipHtml))) {
    const school = m[1].toLowerCase();
    stats[school + 'Dmg'] = parseInt(m[2]);
  }

  // --- Armor (bonus armor, e.g. on rings/trinkets) ---
  const armorMatch = tooltipHtml.match(/<!--amr-->(\d+) Armor/);
  if (armorMatch) {
    // Only record armor if it's a non-armor-type slot (bonus armor)
    // We'll let the caller decide what to do with it
    stats._armor = parseInt(armorMatch[1]);
  }

  return stats;
}

// ============================================================
//  Fetch guide page (allorigins proxy → direct fallback)
// ============================================================

async function fetchGuidePage(url) {
  // Try allorigins proxy first (more reliable for Wowhead)
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

// ============================================================
//  Batch tooltip fetcher with concurrency limit
// ============================================================

async function fetchTooltipsBatch(itemIds, concurrency = 3) {
  const results = {};
  const queue = [...itemIds];
  let completed = 0;
  const total = queue.length;

  async function worker() {
    while (queue.length > 0) {
      const id = queue.shift();
      results[id] = await fetchTooltip(id);
      completed++;
      if (completed % 10 === 0 || completed === total) {
        process.stdout.write(`\r  Fetched ${completed}/${total} tooltips...`);
      }
      await sleep(120); // Rate limit: ~8 req/sec
    }
  }

  const workers = [];
  for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  if (total > 0) console.log(''); // Newline after progress
  return results;
}

// ============================================================
//  Audit a single spec
// ============================================================

async function auditSpec(indexHtml, specSlug) {
  const SEP = '='.repeat(70);
  console.log(`\n${SEP}`);
  console.log(`  AUDITING: ${specSlug}`);
  console.log(SEP);

  // --- 1. Extract our items ---
  const ourItems = extractOurItems(indexHtml, specSlug);
  const ourIdSet = new Set(ourItems.map(i => i.id));
  const slotSet  = new Set(ourItems.map(i => i.slot));
  console.log(`\n  Our data: ${ourItems.length} items across ${slotSet.size} slots`);

  // --- 2. Flag "Pre-Raid BiS" source items ---
  const badSrcItems = ourItems.filter(i => i.src === 'Pre-Raid BiS');
  if (badSrcItems.length > 0) {
    console.log(`\n  ITEMS WITH "Pre-Raid BiS" SOURCE (need real source):`);
    for (const it of badSrcItems) {
      console.log(`    [${it.slot}] ${it.name} (${it.id})`);
    }
  }

  // --- 3. Fetch Wowhead guide ---
  const guideUrl = GUIDE_URLS[specSlug];
  if (!guideUrl) {
    console.log(`\n  No guide URL configured for "${specSlug}" — skipping Wowhead comparison`);
    return { spec: specSlug, ourCount: ourItems.length, skipped: true };
  }

  console.log(`\n  Guide: ${guideUrl}`);
  const guideHtml = await fetchGuidePage(guideUrl);
  if (!guideHtml) {
    console.log('  FAILED to fetch guide page — skipping Wowhead comparison');
    return { spec: specSlug, ourCount: ourItems.length, fetchFailed: true };
  }

  // --- 4. Extract item IDs from guide ---
  const guideIds      = extractGuideItemIds(guideHtml);
  const gathererNames = extractGathererNames(guideHtml);
  console.log(`  Found ${guideIds.length} unique item IDs on guide page`);
  console.log(`  Found ${Object.keys(gathererNames).length} items in WH.Gatherer data`);

  // --- 5. Categorize ---
  const onlyWowhead = guideIds.filter(id => !ourIdSet.has(id));
  const onlyOurs    = ourItems.filter(i => !guideIds.includes(i.id));
  const shared      = ourItems.filter(i => guideIds.includes(i.id));

  console.log(`\n  Shared: ${shared.length} | Only on Wowhead: ${onlyWowhead.length} | Only in ours: ${onlyOurs.length}`);

  // --- 6. Fetch tooltips for Wowhead-only items ---
  console.log(`\n  --- ITEMS ON WOWHEAD BUT NOT IN OUR DATA ---`);
  console.log(`  Fetching tooltips for ${onlyWowhead.length} Wowhead-only items...`);

  const whTooltips = await fetchTooltipsBatch(onlyWowhead);

  const missingGear = [];
  let nonGearCount = 0;

  for (const id of onlyWowhead) {
    const tt = whTooltips[id];
    if (!tt || !tt.tooltip) { continue; }

    const slot = parseTooltipSlot(tt.tooltip);
    if (!slot) { nonGearCount++; continue; }

    const stats = parseTooltipStats(tt.tooltip);
    delete stats._armor; // Don't include raw armor in display
    missingGear.push({ id, name: tt.name, slot, stats, quality: tt.quality });
  }

  console.log(`  Skipped ${nonGearCount} non-gear items (enchants, tokens, etc.)`);

  // Sort by slot then name
  missingGear.sort((a, b) => a.slot.localeCompare(b.slot) || a.name.localeCompare(b.name));

  const QUAL = ['','Poor','Common','Uncommon','Rare','Epic','Legendary'];
  console.log(`\n  MISSING GEAR: ${missingGear.length} equippable items on Wowhead not in our data`);
  for (const it of missingGear) {
    const q = QUAL[it.quality] || '?';
    const st = Object.entries(it.stats).map(([k,v]) => `${k}:${v}`).join(', ');
    console.log(`    [${it.slot}] ${it.name} (${it.id}) — ${q} — {${st}}`);
  }

  // --- 7. Items only in our data ---
  if (onlyOurs.length > 0) {
    console.log(`\n  --- ITEMS ONLY IN OUR DATA (not on Wowhead guide) ---`);
    for (const it of onlyOurs) {
      console.log(`    [${it.slot}] ${it.name} (${it.id}) — src: "${it.src}"`);
    }
  }

  // --- 8. Stat comparison for shared items (deduplicated by ID) ---
  const seenIds = new Set();
  const sharedUnique = shared.filter(i => {
    if (seenIds.has(i.id)) return false;
    seenIds.add(i.id);
    return true;
  });

  console.log(`\n  --- STAT COMPARISON (${sharedUnique.length} unique shared items) ---`);
  console.log(`  Fetching tooltips for shared items...`);

  const sharedIds = sharedUnique.map(i => i.id);
  const sharedTooltips = await fetchTooltipsBatch(sharedIds);

  let statMismatches = 0;
  const mismatchDetails = [];

  // Keys to skip in comparison:
  // - School-specific damage (may be encoded differently in our data vs tooltip)
  // - armor (tooltip shows base armor; our data may have bonus armor as a special stat)
  const skipKeys = new Set([
    'arcaneDmg','fireDmg','frostDmg','natureDmg','shadowDmg','holyDmg','armor'
  ]);

  for (const ourItem of sharedUnique) {
    const tt = sharedTooltips[ourItem.id];
    if (!tt || !tt.tooltip) continue;

    const whStats  = parseTooltipStats(tt.tooltip);
    delete whStats._armor; // Ignore base armor

    const ourStats = extractItemStats(indexHtml, ourItem.id);
    if (!ourStats) continue;

    const allKeys = new Set([...Object.keys(whStats), ...Object.keys(ourStats)]);

    const diffs = [];
    for (const k of allKeys) {
      if (skipKeys.has(k)) continue;
      const ours   = ourStats[k] || 0;
      const theirs = whStats[k]  || 0;
      if (ours !== theirs) {
        diffs.push(`${k}: ours=${ours} wh=${theirs}`);
      }
    }

    if (diffs.length > 0) {
      statMismatches++;
      const detail = `    ${ourItem.name} (${ourItem.id}): ${diffs.join(', ')}`;
      mismatchDetails.push(detail);
      console.log(detail);
    }
  }

  if (statMismatches === 0) {
    console.log('    No stat mismatches found!');
  }
  console.log(`\n  Summary: ${statMismatches} stat mismatches out of ${sharedUnique.length} unique shared items`);

  return {
    spec:           specSlug,
    ourCount:       ourItems.length,
    guideCount:     guideIds.length,
    shared:         shared.length,
    missing:        missingGear.length,
    onlyOurs:       onlyOurs.length,
    badSource:      badSrcItems.length,
    statMismatches: statMismatches,
  };
}

// ============================================================
//  Main
// ============================================================

async function main() {
  console.log('Wowhead BiS Audit Script');
  console.log('Reading data/specs.js...');
  const indexHtml = fs.readFileSync('data/specs.js', 'utf8');
  console.log(`  data/specs.js: ${(indexHtml.length/1024).toFixed(0)} KB`);

  const results = [];
  for (const spec of TEST_SPECS) {
    const r = await auditSpec(indexHtml, spec);
    results.push(r);
    await sleep(1000); // Pause between specs
  }

  // --- Final summary ---
  const SEP = '='.repeat(70);
  console.log(`\n${SEP}`);
  console.log('  AUDIT SUMMARY');
  console.log(SEP);
  console.log('');
  console.log('  Spec                  Ours  Guide  Shared  Missing  OnlyOurs  BadSrc  StatDiff');
  console.log('  ' + '-'.repeat(86));
  for (const r of results) {
    if (r.skipped || r.fetchFailed) {
      console.log(`  ${r.spec.padEnd(22)} ${String(r.ourCount).padStart(4)}  ${r.skipped ? 'NO URL' : 'FETCH FAILED'}`);
    } else {
      console.log(
        `  ${r.spec.padEnd(22)} ${String(r.ourCount).padStart(4)}  ` +
        `${String(r.guideCount).padStart(5)}  ${String(r.shared).padStart(6)}  ` +
        `${String(r.missing).padStart(7)}  ${String(r.onlyOurs).padStart(8)}  ` +
        `${String(r.badSource).padStart(6)}  ${String(r.statMismatches).padStart(8)}`
      );
    }
  }
  console.log('');
}

main().catch(err => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
