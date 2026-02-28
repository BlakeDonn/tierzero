#!/usr/bin/env node
'use strict';

/*  _extract-enchants-gems.js
 *  Extracts Wowhead BiS enchant & gem recommendations from guide pages
 *  and updates BIS_ENCHANTS / BIS_GEMS in data/gems-enchants.js.
 *
 *  Usage:  node _extract-enchants-gems.js <spec-slug>
 *          node _extract-enchants-gems.js --all           # Run all specs
 *          node _extract-enchants-gems.js --all --refresh  # Re-fetch all
 *  Output: Prints extracted data; use --write to update data/gems-enchants.js
 */

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

// ============================================================
//  Enchant Guide URLs — one per unique guide page
//  Many specs share the same guide (e.g. all mages, all rogues)
// ============================================================

const ENCHANT_GUIDE_URLS = {
  // Mage — shared across all 3 specs
  'arcane-mage':  'https://www.wowhead.com/tbc/guide/classes/mage/dps-enchants-gems-pve',
  'fire-mage':    'https://www.wowhead.com/tbc/guide/classes/mage/dps-enchants-gems-pve',
  'frost-mage':   'https://www.wowhead.com/tbc/guide/classes/mage/dps-enchants-gems-pve',
  // Paladin
  'holy-paladin': 'https://www.wowhead.com/tbc/guide/classes/paladin/holy/healer-enchants-gems-pve',
  'prot-paladin': 'https://www.wowhead.com/tbc/guide/classes/paladin/tank-enchants-gems-pve',
  'ret-paladin':  'https://www.wowhead.com/tbc/guide/classes/paladin/retribution/dps-enchants-gems-pve',
  // Warrior — DPS shared for fury/arms
  'fury-warrior': 'https://www.wowhead.com/tbc/guide/classes/warrior/dps-enchants-gems-pve',
  'arms-warrior': 'https://www.wowhead.com/tbc/guide/classes/warrior/dps-enchants-gems-pve',
  'prot-warrior': 'https://www.wowhead.com/tbc/guide/classes/warrior/protection/tank-enchants-gems-pve',
  // Hunter — spec-specific pages return Cata guides; class-level has TBC
  'bm-hunter':       'https://www.wowhead.com/tbc/guide/classes/hunter/dps-enchants-gems-pve',
  'mm-hunter':       'https://www.wowhead.com/tbc/guide/classes/hunter/dps-enchants-gems-pve',
  'survival-hunter': 'https://www.wowhead.com/tbc/guide/classes/hunter/dps-enchants-gems-pve',
  // Rogue — shared
  'combat-rogue':       'https://www.wowhead.com/tbc/guide/classes/rogue/dps-enchants-gems-pve',
  'assassination-rogue':'https://www.wowhead.com/tbc/guide/classes/rogue/dps-enchants-gems-pve',
  'subtlety-rogue':     'https://www.wowhead.com/tbc/guide/classes/rogue/dps-enchants-gems-pve',
  // Priest
  'shadow-priest':      'https://www.wowhead.com/tbc/guide/classes/priest/shadow/dps-enchants-gems-pve',
  'holy-priest':        'https://www.wowhead.com/tbc/guide/classes/priest/healer-enchants-gems-pve',
  'discipline-priest':  'https://www.wowhead.com/tbc/guide/classes/priest/healer-enchants-gems-pve',
  // Shaman
  'elemental-shaman':   'https://www.wowhead.com/tbc/guide/classes/shaman/elemental/dps-enchants-gems-pve',
  'enhancement-shaman': 'https://www.wowhead.com/tbc/guide/classes/shaman/enhancement/dps-enchants-gems-pve',
  'resto-shaman':       'https://www.wowhead.com/tbc/guide/classes/shaman/healer-enchants-gems-pve',
  // Warlock — spec-specific pages return Cata guides; class-level has TBC
  'affliction-warlock':  'https://www.wowhead.com/tbc/guide/classes/warlock/dps-enchants-gems-pve',
  'destruction-warlock': 'https://www.wowhead.com/tbc/guide/classes/warlock/dps-enchants-gems-pve',
  'demonology-warlock':  'https://www.wowhead.com/tbc/guide/classes/warlock/dps-enchants-gems-pve',
  // Druid
  'balance-druid':      'https://www.wowhead.com/tbc/guide/classes/druid/balance/dps-enchants-gems-pve',
  'feral-cat-druid':    'https://www.wowhead.com/tbc/guide/classes/druid/feral/dps-enchants-gems-pve',
  'feral-bear-druid':   'https://www.wowhead.com/tbc/guide/classes/druid/feral/tank-enchants-gems-pve',
  'resto-druid':        'https://www.wowhead.com/tbc/guide/classes/druid/healer-enchants-gems-pve',
};

// Wowhead item IDs for enchants that differ from our spell IDs
const ENCHANT_ITEM_TO_SPELL = {
  // Leg armor items → enchant spell IDs
  24274: 31372,  // Runic Spellthread
  24273: 31373,  // Mystic Spellthread
  24276: 31372,  // Golden Spellthread (healer legs) → map to Runic (our closest)
  29535: 29535,  // Nethercobra Leg Armor
  29536: 29536,  // Nethercleft Leg Armor
  29533: 29533,  // Cobrahide Leg Armor
  29534: 29534,  // Clefthide Leg Armor
  // Head glyphs (item ID = spell ID for most)
  29191: 29191,  // Glyph of Power
  29192: 29192,  // Glyph of Ferocity
  29186: 29186,  // Glyph of the Defender
  29189: 29189,  // Glyph of Renewal
  29190: 29189,  // Glyph of Renewal (item ID off-by-one)
  19782: 29186,  // Presence of Might (Naxx) → use Glyph of the Defender
  // Shoulder inscriptions (item IDs differ from spell IDs)
  28886: 28886,  // Greater Insc. of Discipline (Aldor, item=spell)
  28888: 28888,  // Greater Insc. of the Blade (Aldor, item=spell)
  28887: 28909,  // Greater Insc. of Faith (Aldor healer) → spell 28909
  28911: 28889,  // Greater Insc. of the Knight (Aldor tank) → spell 28889
  28909: 28909,  // Greater Insc. of the Oracle (pass through)
  28889: 28889,  // Greater Insc. of the Knight (pass through)
  23545: 23545,  // Greater Insc. of Vengeance (Scryer)
  23547: 23547,  // Greater Insc. of the Orb (Scryer)
  23548: 23545,  // Might of the Scourge (Naxx) → use Scryer Vengeance
  28881: 28881,  // Insc. of Discipline (Honored)
  28885: 28885,  // Insc. of Vengeance (Honored)
  28882: 28882,  // Insc. of Warding (Honored)
  28903: 28903,  // Insc. of the Orb (Honored)
  28907: 28907,  // Insc. of the Blade (Honored)
  28904: 28904,  // Insc. of the Oracle (Honored)
  // Scopes (item → spell)
  23766: 30260,  // Stabilized Eternium Scope (item → spell)
  23765: 30260,  // Khorium Scope → map to Eternium Scope (our best)
  30260: 30260,  // Stabilized Eternium Scope (spell pass through)
};

// "Item Effect" spell IDs (46xxx) → our primary enchant spell IDs
// Wowhead guides sometimes reference the applied-effect ID instead of recipe ID
const SPELL_ALIASES = {
  46502: 27960,  // Exceptional Stats (chest)
  46504: 33990,  // Major Spirit (chest)
  46498: 27917,  // Spellpower (wrists)
  46500: 27917,  // Superior Healing (wrists) → closest: Spellpower
  46513: 33999,  // Major Healing (hands) → already have as 33999
  46514: 33997,  // Major Spellpower (hands)
  46517: 27926,  // Healing Power (ring)
  46518: 27927,  // Spellpower (ring)
  46529: 46538,  // Greater Agility (weapon)
  46531: 34010,  // Major Healing (weapon)
  46540: 27981,  // Sunfire (weapon, 2H version)
  46470: 34008,  // Boar's Speed (feet)
};

// Slot name in BBCode tables → our slot key(s)
const ENCHANT_SLOT_MAP = {
  'Head': 'head',
  'Shoulders': 'shoulders', 'Shoulder': 'shoulders',
  'Back': 'back', 'Cloak': 'back', 'Cape': 'back',
  'Chest': 'chest',
  'Bracer': 'wrists', 'Bracers': 'wrists', 'Wrist': 'wrists', 'Wrists': 'wrists',
  'Gloves': 'hands', 'Hands': 'hands',
  'Legs': 'legs',
  'Boots': 'feet', 'Feet': 'feet',
  'Weapon': 'weapon',  // special: resolved to mainhand/twohand/offhand per spec
  'Main Hand Weapon': 'mainhand', 'Main Hand': 'mainhand', 'Mainhand': 'mainhand',
  'Off Hand Weapon': 'offhand', 'Off Hand': 'offhand', 'Offhand': 'offhand',
  'Ring': 'ring', 'Rings': 'ring',  // special: expanded to ring1+ring2
  'Ranged': 'wand', 'Wand': 'wand', 'Ranged Weapon': 'wand',
  'Two-Hand': 'twohand', '2H Weapon': 'twohand', 'Two-Hand Weapon': 'twohand',
  'Shield': 'skip',  // we don't track shield enchants
};

// Gem color in BBCode tables → our gem color key
const GEM_COLOR_MAP = {
  'Meta Gem': 'meta', 'Meta': 'meta',
  'Red Gem': 'red', 'Red': 'red',
  'Yellow Gem': 'yellow', 'Yellow': 'yellow',
  'Blue Gem': 'blue', 'Blue': 'blue',
  'Orange Gem': 'orange', 'Orange': 'orange',
  'Purple Gem': 'purple', 'Purple': 'purple',
  'Green Gem': 'green', 'Green': 'green',
};

// Specs that use two-hand weapons (weapon enchant → twohand key)
const TWOHAND_SPECS = new Set([
  'arms-warrior', 'ret-paladin',
  'bm-hunter', 'mm-hunter', 'survival-hunter',
  'balance-druid', 'feral-cat-druid', 'feral-bear-druid',
]);

// Specs that dual-wield (weapon enchant → mainhand + offhand)
const DUALWIELD_SPECS = new Set([
  'fury-warrior', 'enhancement-shaman',
  'combat-rogue', 'assassination-rogue', 'subtlety-rogue',
]);

// Caster specs that can use either 1H+OH or 2H staff (set both mainhand + twohand)
const CASTER_TWOHAND_SPECS = new Set([
  'arcane-mage', 'fire-mage', 'frost-mage',
  'shadow-priest',
  'affliction-warlock', 'destruction-warlock', 'demonology-warlock',
]);

// Remaining specs: caster 1H + offhand (weapon enchant → mainhand only)

const GUIDE_CACHE_DIR = path.join(__dirname, '_data', 'guide-cache-enchants');
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const GEMS_ENCHANTS_FILE = path.join(__dirname, 'data', 'gems-enchants.js');

// ============================================================
//  CLI
// ============================================================

const args = process.argv.slice(2);
const flagAll     = args.includes('--all');
const flagRefresh = args.includes('--refresh');
const flagWrite   = args.includes('--write');
const specSlug    = args.find(a => !a.startsWith('--'));

if (!flagAll && !specSlug) {
  console.error('Usage: node _extract-enchants-gems.js <spec-slug>');
  console.error('       node _extract-enchants-gems.js --all [--refresh] [--write]');
  console.error('Flags:');
  console.error('  --refresh  Re-fetch all guide pages (ignore cache)');
  console.error('  --write    Update data/gems-enchants.js with extracted data');
  console.error('Example: node _extract-enchants-gems.js fire-mage');
  process.exit(1);
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

// ============================================================
//  Guide page cache
// ============================================================

function getCachePath(slug) {
  return path.join(GUIDE_CACHE_DIR, `${slug}.html`);
}

function isValidGuideHtml(html) {
  return html && html.length > 20000 && html.includes('WH.markup.printHtml');
}

function readCachedGuide(slug) {
  if (flagRefresh) return null;
  const cachePath = getCachePath(slug);
  if (!fs.existsSync(cachePath)) return null;
  const stat = fs.statSync(cachePath);
  const ageMs = Date.now() - stat.mtimeMs;
  if (ageMs > CACHE_MAX_AGE_MS) {
    console.log(`  Cache expired (${(ageMs / 3600000).toFixed(1)}h old)`);
    return null;
  }
  const content = fs.readFileSync(cachePath, 'utf8');
  if (!isValidGuideHtml(content)) {
    console.log('  Cache invalid, will re-fetch');
    return null;
  }
  console.log(`  Using cached guide (${(content.length / 1024).toFixed(0)} KB, ${(ageMs / 3600000).toFixed(1)}h old)`);
  return content;
}

function writeCachedGuide(slug, html) {
  fs.mkdirSync(GUIDE_CACHE_DIR, { recursive: true });
  fs.writeFileSync(getCachePath(slug), html, 'utf8');
}

async function fetchGuidePage(url, slug) {
  const cached = readCachedGuide(slug);
  if (cached) return { html: cached, fetched: false };

  // Try proxy
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  try {
    process.stdout.write('  Trying allorigins proxy... ');
    const res = await httpGet(proxyUrl);
    if (res.status === 200 && isValidGuideHtml(res.body)) {
      console.log(`OK (${(res.body.length/1024).toFixed(0)} KB)`);
      writeCachedGuide(slug, res.body);
      return { html: res.body, fetched: true };
    }
    console.log(`bad (status=${res.status}, size=${res.body.length})`);
  } catch (e) {
    console.log(`failed: ${e.message}`);
  }

  // Try direct
  try {
    process.stdout.write('  Trying direct fetch... ');
    const res = await httpGet(url);
    if (res.status === 200 && isValidGuideHtml(res.body)) {
      console.log(`OK (${(res.body.length/1024).toFixed(0)} KB)`);
      writeCachedGuide(slug, res.body);
      return { html: res.body, fetched: true };
    }
    console.log(`bad (status=${res.status}, size=${res.body.length})`);
  } catch (e) {
    console.log(`failed: ${e.message}`);
  }

  return { html: null, fetched: true };
}

// ============================================================
//  BBCode extraction and parsing
// ============================================================

function extractBBCode(html) {
  const m = html.match(/WH\.markup\.printHtml\("([\s\S]*?)"\s*,\s*"guide-body/);
  if (!m) return null;
  let bbcode = m[1];
  bbcode = bbcode.replace(/\\r\\n/g, '\n');
  bbcode = bbcode.replace(/\\n/g, '\n');
  bbcode = bbcode.replace(/\\"/g, '"');
  bbcode = bbcode.replace(/\\\//g, '/');

  // Detect wrong expansion (Cata guides returned for TBC URLs)
  if (bbcode.includes('in Cataclysm') || bbcode.includes('[db=cataclysm]') || bbcode.includes('[db=cata]')) {
    console.log('  WARNING: Page contains Cataclysm content, not TBC!');
    return null;
  }

  return bbcode;
}

function findSummaryTable(bbcode, sectionHeading) {
  // Find [h2 ...] heading containing sectionHeading
  const h2Re = /\[h2[^\]]*\][^[]*?\b/g;
  let sectionStart = -1;

  // Find heading that contains the section keyword
  const headingIdx = bbcode.indexOf(sectionHeading);
  if (headingIdx < 0) return null;

  // Find the [table] after this heading
  const afterHeading = bbcode.substring(headingIdx);
  const tableStart = afterHeading.indexOf('[table');
  if (tableStart < 0) return null;

  const tableEnd = afterHeading.indexOf('[/table]', tableStart);
  if (tableEnd < 0) return null;

  return afterHeading.substring(tableStart, tableEnd + 8);
}

function parseTableRows(tableText) {
  const rows = [];
  const rowRe = /\[tr\]([\s\S]*?)\[\/tr\]/gi;
  let rm;
  while ((rm = rowRe.exec(tableText))) {
    const cells = [];
    const cellRe = /\[td[^\]]*\]([\s\S]*?)\[\/td\]/gi;
    let cm;
    while ((cm = cellRe.exec(rm[1]))) {
      cells.push(cm[1].trim());
    }
    if (cells.length >= 2) {
      // Skip header rows
      const label = cells[0].replace(/\[[^\]]*\]/g, '').trim();
      if (label.toLowerCase() === 'slot' || label.toLowerCase() === 'color/type' ||
          label.toLowerCase() === 'best enchant' || label.toLowerCase() === 'best gem') continue;
      rows.push({ label, content: cells[1] });
    }
  }
  return rows;
}

function extractIds(content) {
  // Extract all [item=ID] and [spell=ID] from cell content
  const ids = [];
  const re = /\[(item|spell)=(\d+)\]/g;
  let m;
  while ((m = re.exec(content))) {
    ids.push({ type: m[1], id: parseInt(m[2]) });
  }
  return ids;
}

function resolveEnchantId(refs) {
  // Given array of {type, id} references, return our spell ID
  // Prefer the first valid reference
  for (const ref of refs) {
    if (ref.type === 'spell') {
      // Check for alias (46xxx "Item Effect" IDs → primary spell IDs)
      if (SPELL_ALIASES[ref.id] !== undefined) return SPELL_ALIASES[ref.id];
      return ref.id;
    }
    if (ref.type === 'item') {
      // Check item→spell mapping
      if (ENCHANT_ITEM_TO_SPELL[ref.id] !== undefined) {
        return ENCHANT_ITEM_TO_SPELL[ref.id];
      }
      // Unknown item - return as-is (will be flagged later)
      return ref.id;
    }
  }
  return null;
}

function resolveGemId(refs) {
  // Gems always use [item=ID]
  for (const ref of refs) {
    if (ref.type === 'item' && ref.id > 0) {
      return ref.id;
    }
  }
  return null;
}

// ============================================================
//  Extract enchants & gems from a guide page
// ============================================================

function extractEnchantsGems(html, specSlug) {
  const bbcode = extractBBCode(html);
  if (!bbcode) {
    console.log('  Warning: Could not extract BBCode');
    return null;
  }
  console.log(`  BBCode: ${bbcode.length} chars`);

  const result = { enchants: {}, gems: {}, warnings: [] };

  // --- Parse Enchant Summary Table ---
  const enchantTable = findSummaryTable(bbcode, 'Best Enchants');
  if (enchantTable) {
    const rows = parseTableRows(enchantTable);
    console.log(`  Enchant table: ${rows.length} rows`);

    for (const row of rows) {
      const slotKey = ENCHANT_SLOT_MAP[row.label];
      if (!slotKey) {
        result.warnings.push(`Unknown enchant slot: "${row.label}"`);
        continue;
      }
      if (slotKey === 'skip') continue;  // Shield, etc.

      const refs = extractIds(row.content);
      if (refs.length === 0) {
        result.warnings.push(`No IDs found for slot "${row.label}"`);
        continue;
      }

      const spellId = resolveEnchantId(refs);
      if (!spellId) {
        result.warnings.push(`Could not resolve enchant for "${row.label}": ${JSON.stringify(refs)}`);
        continue;
      }

      // Map generic "weapon" and "ring" to spec-specific slot keys
      if (slotKey === 'weapon') {
        if (TWOHAND_SPECS.has(specSlug)) {
          result.enchants.twohand = spellId;
        } else if (DUALWIELD_SPECS.has(specSlug)) {
          result.enchants.mainhand = spellId;
          result.enchants.offhand = spellId;
        } else if (CASTER_TWOHAND_SPECS.has(specSlug)) {
          result.enchants.mainhand = spellId;
          result.enchants.twohand = spellId;
        } else {
          result.enchants.mainhand = spellId;
        }
      } else if (slotKey === 'ring') {
        result.enchants.ring1 = spellId;
        result.enchants.ring2 = spellId;
      } else {
        result.enchants[slotKey] = spellId;
      }
    }
  } else {
    result.warnings.push('No enchant summary table found');
  }

  // --- Parse Gem Summary Table ---
  const gemTable = findSummaryTable(bbcode, 'Best Gems');
  if (gemTable) {
    const rows = parseTableRows(gemTable);
    console.log(`  Gem table: ${rows.length} rows`);

    for (const row of rows) {
      const color = GEM_COLOR_MAP[row.label];
      if (!color) {
        result.warnings.push(`Unknown gem color: "${row.label}"`);
        continue;
      }

      const refs = extractIds(row.content);
      if (refs.length === 0) {
        result.warnings.push(`No gem IDs for color "${row.label}"`);
        continue;
      }

      const gemId = resolveGemId(refs);
      if (!gemId) {
        result.warnings.push(`Could not resolve gem for "${row.label}"`);
        continue;
      }

      result.gems[color] = gemId;
    }
  } else {
    result.warnings.push('No gem summary table found');
  }

  // --- Also scan detailed sections for additional info ---
  // Look for [spell=ID] and [item=ID] in the weapon section to catch alternatives
  const weaponSection = findDetailSection(bbcode, 'Weapon Enchant');
  if (weaponSection) {
    const weaponRefs = extractIds(weaponSection);
    if (weaponRefs.length > 0) {
      result.weaponAlts = weaponRefs.map(r => ({ type: r.type, id: r.id }));
    }
  }

  // Look for ranged/scope section for hunters
  const rangedSection = findDetailSection(bbcode, 'Ranged');
  if (!rangedSection) {
    const scopeSection = findDetailSection(bbcode, 'Scope');
    if (scopeSection) {
      const scopeRefs = extractIds(scopeSection);
      if (scopeRefs.length > 0) {
        const scopeId = resolveEnchantId(scopeRefs);
        if (scopeId) result.enchants.wand = scopeId;
      }
    }
  } else {
    const rangedRefs = extractIds(rangedSection);
    if (rangedRefs.length > 0) {
      const rangedId = resolveEnchantId(rangedRefs);
      if (rangedId) result.enchants.wand = rangedId;
    }
  }

  return result;
}

function findDetailSection(bbcode, keyword) {
  // Find [h3 toc="...keyword..."] section
  const re = new RegExp('\\[h3[^\\]]*\\][^\\[]*' + keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?(?=\\[h[23]|$)', 'i');
  const m = bbcode.match(re);
  return m ? m[0] : null;
}

// ============================================================
//  Single-spec extraction
// ============================================================

async function extractSpec(slug, guideUrl) {
  console.log(`Fetching guide: ${guideUrl}`);

  // Use URL-based cache key (multiple specs may share a URL)
  const urlKey = guideUrl.replace(/^.*\/classes\//, '').replace(/\//g, '-').replace(/-enchants-gems-pve$/, '');
  const cacheSlug = `enchants-${urlKey}`;

  const { html, fetched } = await fetchGuidePage(guideUrl, cacheSlug);
  if (!html) {
    console.error('  Failed to fetch guide page!');
    return { success: false, fetched };
  }

  console.log('  Parsing...');
  const result = extractEnchantsGems(html, slug);
  if (!result) {
    return { success: false, fetched };
  }

  const enchantCount = Object.keys(result.enchants).length;
  const gemCount = Object.keys(result.gems).length;

  console.log(`  Enchants: ${enchantCount} slots`);
  for (const [slot, id] of Object.entries(result.enchants)) {
    console.log(`    ${slot.padEnd(12)} → ${id}`);
  }

  console.log(`  Gems: ${gemCount} colors`);
  for (const [color, id] of Object.entries(result.gems)) {
    console.log(`    ${color.padEnd(8)} → ${id}`);
  }

  if (result.warnings.length > 0) {
    console.log(`  Warnings:`);
    for (const w of result.warnings) {
      console.log(`    ⚠ ${w}`);
    }
  }

  if (result.weaponAlts && result.weaponAlts.length > 1) {
    console.log(`  Weapon alternatives: ${result.weaponAlts.map(r => `[${r.type}=${r.id}]`).join(', ')}`);
  }

  return { success: enchantCount > 0 || gemCount > 0, fetched, enchants: result.enchants, gems: result.gems, warnings: result.warnings };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
//  File update: patch BIS_ENCHANTS and BIS_GEMS in gems-enchants.js
// ============================================================

function updateGemsEnchantsFile(allEnchants, allGems) {
  let content = fs.readFileSync(GEMS_ENCHANTS_FILE, 'utf8');

  // --- Update BIS_ENCHANTS ---
  const enchStart = content.indexOf('var BIS_ENCHANTS = {');
  const enchEnd = content.indexOf('};', enchStart) + 2;
  if (enchStart < 0 || enchEnd < 2) {
    console.error('Could not find BIS_ENCHANTS in gems-enchants.js');
    return false;
  }

  // Build new BIS_ENCHANTS object
  let enchLines = ['var BIS_ENCHANTS = {'];
  const specOrder = Object.keys(ENCHANT_GUIDE_URLS);
  for (const slug of specOrder) {
    if (!allEnchants[slug]) continue;
    const enc = allEnchants[slug];
    const slots = Object.entries(enc).map(([k, v]) => `${k}:${v}`).join(',');
    enchLines.push(`  "${slug}":{${slots}},`);
  }
  enchLines.push('};');

  content = content.substring(0, enchStart) + enchLines.join('\n') + content.substring(enchEnd);

  // --- Update BIS_GEMS ---
  const gemStart = content.indexOf('var BIS_GEMS = {');
  const gemEnd = content.indexOf('};', gemStart) + 2;
  if (gemStart < 0 || gemEnd < 2) {
    console.error('Could not find BIS_GEMS in gems-enchants.js');
    return false;
  }

  let gemLines = ['var BIS_GEMS = {'];
  for (const slug of specOrder) {
    if (!allGems[slug]) continue;
    const gems = allGems[slug];
    const colors = Object.entries(gems).map(([k, v]) => `${k}:${v}`).join(',');
    gemLines.push(`  "${slug}":{${colors}},`);
  }
  gemLines.push('};');

  content = content.substring(0, gemStart) + gemLines.join('\n') + content.substring(gemEnd);

  fs.writeFileSync(GEMS_ENCHANTS_FILE, content, 'utf8');
  return true;
}

// ============================================================
//  Main
// ============================================================

async function main() {
  const allEnchants = {};
  const allGems = {};

  if (flagAll) {
    const allSlugs = Object.keys(ENCHANT_GUIDE_URLS);
    // Deduplicate URLs to avoid fetching the same page multiple times
    const urlToSlugs = {};
    for (const slug of allSlugs) {
      const url = ENCHANT_GUIDE_URLS[slug];
      if (!urlToSlugs[url]) urlToSlugs[url] = [];
      urlToSlugs[url].push(slug);
    }

    console.log(`=== Extract Enchants & Gems: ALL ${allSlugs.length} specs (${Object.keys(urlToSlugs).length} unique pages) ===\n`);

    const results = [];
    let pageNum = 0;
    const totalPages = Object.keys(urlToSlugs).length;

    for (const [url, slugs] of Object.entries(urlToSlugs)) {
      pageNum++;
      const primarySlug = slugs[0];
      console.log(`\n[${pageNum}/${totalPages}] ${slugs.join(', ')}`);

      try {
        const result = await extractSpec(primarySlug, url);
        results.push({ slugs, ...result });

        if (result.success) {
          // Apply same result to all specs sharing this URL
          for (const slug of slugs) {
            if (result.enchants) allEnchants[slug] = { ...result.enchants };
            if (result.gems) allGems[slug] = { ...result.gems };
          }
        }

        if (result.fetched && pageNum < totalPages) {
          await sleep(600);
        }
      } catch (err) {
        console.error(`  Error: ${err.message}`);
        results.push({ slugs, success: false });
      }
    }

    // --- Post-processing: spec-specific overrides ---
    // Arms warrior shares DPS warrior guide (DW focused), override to 2H
    if (allEnchants['arms-warrior']) {
      const armsEnc = allEnchants['arms-warrior'];
      if (armsEnc.mainhand && !armsEnc.twohand) {
        armsEnc.twohand = armsEnc.mainhand;
        delete armsEnc.mainhand;
        delete armsEnc.offhand;
        console.log('\n  [override] arms-warrior: mainhand+offhand → twohand');
      }
    }

    // Fury warrior: guide says mainhand+offhand, ensure no wand (ranged slot is thrown/gun)
    // wand slot for warriors = ranged weapon, the scope extraction handles that

    // Feral cat: if meta gem missing, use Relentless Earthstorm (32409)
    if (allGems['feral-cat-druid'] && !allGems['feral-cat-druid'].meta) {
      allGems['feral-cat-druid'].meta = 32409;
      console.log('\n  [override] feral-cat-druid: added meta gem 32409');
    }

    // --- Summary ---
    console.log('\n\n=== SUMMARY ===');
    const successes = results.filter(r => r.success);
    console.log(`Pages: ${successes.length}/${totalPages} succeeded`);
    console.log(`Specs covered: ${Object.keys(allEnchants).length}`);

    // Show per-spec enchant data
    console.log('\nPer-spec enchant summary:');
    for (const slug of allSlugs) {
      const enc = allEnchants[slug];
      if (enc) {
        const slots = Object.keys(enc).join(', ');
        console.log(`  ${slug.padEnd(24)} ${Object.keys(enc).length} slots: ${slots}`);
      } else {
        console.log(`  ${slug.padEnd(24)} MISSING`);
      }
    }

    console.log('\nPer-spec gem summary:');
    for (const slug of allSlugs) {
      const gems = allGems[slug];
      if (gems) {
        const colors = Object.entries(gems).map(([c, id]) => `${c}:${id}`).join(', ');
        console.log(`  ${slug.padEnd(24)} ${colors}`);
      } else {
        console.log(`  ${slug.padEnd(24)} MISSING`);
      }
    }

    // Collect all unique enchant IDs to check if any are missing from our DB
    const allEnchantIds = new Set();
    for (const enc of Object.values(allEnchants)) {
      for (const id of Object.values(enc)) allEnchantIds.add(id);
    }
    console.log('\nAll unique enchant spell IDs:', [...allEnchantIds].sort((a, b) => a - b).join(', '));

    const allGemIds = new Set();
    for (const gems of Object.values(allGems)) {
      for (const id of Object.values(gems)) allGemIds.add(id);
    }
    console.log('All unique gem item IDs:', [...allGemIds].sort((a, b) => a - b).join(', '));

    // Write if --write flag
    if (flagWrite) {
      console.log('\nUpdating data/gems-enchants.js...');
      // Merge with existing data for specs we didn't extract
      const existingContent = fs.readFileSync(GEMS_ENCHANTS_FILE, 'utf8');

      // Parse existing BIS_ENCHANTS
      const existEncMatch = existingContent.match(/var BIS_ENCHANTS\s*=\s*(\{[\s\S]*?\});/);
      if (existEncMatch) {
        try {
          const existEnc = eval('(' + existEncMatch[1] + ')');
          for (const [slug, enc] of Object.entries(existEnc)) {
            if (!allEnchants[slug]) allEnchants[slug] = enc;
          }
        } catch(e) { /* ignore parse errors */ }
      }

      // Parse existing BIS_GEMS
      const existGemMatch = existingContent.match(/var BIS_GEMS\s*=\s*(\{[\s\S]*?\});/);
      if (existGemMatch) {
        try {
          const existGems = eval('(' + existGemMatch[1] + ')');
          for (const [slug, gems] of Object.entries(existGems)) {
            if (!allGems[slug]) allGems[slug] = gems;
          }
        } catch(e) { /* ignore parse errors */ }
      }

      if (updateGemsEnchantsFile(allEnchants, allGems)) {
        console.log('  Updated successfully!');
      } else {
        console.log('  Update failed!');
      }
    } else {
      console.log('\nRun with --write to update data/gems-enchants.js');
    }

  } else {
    // Single spec mode
    const guideUrl = ENCHANT_GUIDE_URLS[specSlug];
    if (!guideUrl) {
      console.error(`Unknown spec slug: "${specSlug}"`);
      console.error('Available:', Object.keys(ENCHANT_GUIDE_URLS).join(', '));
      process.exit(1);
    }

    console.log(`=== Extract Enchants & Gems: ${specSlug} ===\n`);
    const result = await extractSpec(specSlug, guideUrl);
    if (!result.success) {
      process.exit(1);
    }
  }

  console.log('\nDone!');
}

main().catch(err => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
