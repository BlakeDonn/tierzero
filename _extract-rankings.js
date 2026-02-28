#!/usr/bin/env node
'use strict';

/*  _extract-rankings.js
 *  Extracts Wowhead BiS ranking labels (BiS, Option, etc.) from guide pages
 *  and writes/merges them into data/rankings.js.
 *
 *  Usage:  node _extract-rankings.js <spec-slug>
 *          node _extract-rankings.js --all           # Run all specs
 *          node _extract-rankings.js --all --refresh  # Re-fetch all
 *  Output: data/rankings.js (merged)
 */

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

// ============================================================
//  Guide URLs — one per spec
// ============================================================

const GUIDE_URLS = {
  'arcane-mage':  'https://www.wowhead.com/tbc/guide/classes/mage/arcane/dps-bis-gear-pve-pre-raid',
  'fire-mage':    'https://www.wowhead.com/tbc/guide/classes/mage/fire/dps-bis-gear-pve-pre-raid',
  'frost-mage':   'https://www.wowhead.com/tbc/guide/classes/mage/frost/dps-bis-gear-pve-pre-raid',
  'holy-paladin': 'https://www.wowhead.com/tbc/guide/classes/paladin/holy/healer-bis-gear-pve-pre-raid',
  'prot-paladin': 'https://www.wowhead.com/tbc/guide/classes/paladin/tank-bis-gear-pve-pre-raid',
  'ret-paladin':  'https://www.wowhead.com/tbc/guide/classes/paladin/retribution/dps-bis-gear-pve-pre-raid',
  'fury-warrior': 'https://www.wowhead.com/tbc/guide/classes/warrior/dps-bis-gear-pve-pre-raid',
  'arms-warrior': 'https://www.wowhead.com/tbc/guide/classes/warrior/dps-bis-gear-pve-pre-raid',
  'prot-warrior': 'https://www.wowhead.com/tbc/guide/classes/warrior/protection/tank-bis-gear-pve-pre-raid',
  'bm-hunter':    'https://www.wowhead.com/tbc/guide/classes/hunter/beast-mastery/dps-bis-gear-pve-pre-raid',
  'mm-hunter':    'https://www.wowhead.com/tbc/guide/classes/hunter/marksmanship/dps-bis-gear-pve-pre-raid',
  'survival-hunter':'https://www.wowhead.com/tbc/guide/classes/hunter/survival/dps-bis-gear-pve-pre-raid',
  'combat-rogue':       'https://www.wowhead.com/tbc/guide/classes/rogue/dps-bis-gear-pve-pre-raid',
  'assassination-rogue':'https://www.wowhead.com/tbc/guide/classes/rogue/dps-bis-gear-pve-pre-raid',
  'subtlety-rogue':     'https://www.wowhead.com/tbc/guide/classes/rogue/dps-bis-gear-pve-pre-raid',
  'shadow-priest':      'https://www.wowhead.com/tbc/guide/classes/priest/shadow/dps-bis-gear-pve-pre-raid',
  'holy-priest':        'https://www.wowhead.com/tbc/guide/classes/priest/healer-bis-gear-pve-pre-raid',
  'discipline-priest':  'https://www.wowhead.com/tbc/guide/classes/priest/healer-bis-gear-pve-pre-raid',
  'elemental-shaman':   'https://www.wowhead.com/tbc/guide/classes/shaman/elemental/dps-bis-gear-pve-pre-raid',
  'enhancement-shaman': 'https://www.wowhead.com/tbc/guide/classes/shaman/enhancement/dps-bis-gear-pve-pre-raid',
  'resto-shaman':       'https://www.wowhead.com/tbc/guide/classes/shaman/healer-bis-gear-pve-pre-raid',
  'affliction-warlock':  'https://www.wowhead.com/tbc/guide/classes/warlock/affliction/dps-bis-gear-pve-pre-raid',
  'destruction-warlock': 'https://www.wowhead.com/tbc/guide/classes/warlock/destruction/dps-bis-gear-pve-pre-raid',
  'demonology-warlock':  'https://www.wowhead.com/tbc/guide/classes/warlock/demonology/dps-bis-gear-pve-pre-raid',
  'balance-druid':      'https://www.wowhead.com/tbc/guide/classes/druid/balance/dps-bis-gear-pve-pre-raid',
  'feral-cat-druid':    'https://www.wowhead.com/tbc/guide/classes/druid/feral/dps-bis-gear-pve-pre-raid',
  'feral-bear-druid':   'https://www.wowhead.com/tbc/guide/classes/druid/feral/tank-bis-gear-pve-pre-raid',
  'resto-druid':        'https://www.wowhead.com/tbc/guide/classes/druid/healer-bis-gear-pve-pre-raid',
};

const RANKINGS_FILE = path.join(__dirname, 'data', 'rankings.js');
const GUIDE_CACHE_DIR = path.join(__dirname, '_data', 'guide-cache');
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// Non-gear item IDs to skip (e.g. currency, tokens)
const SKIP_IDS = new Set([29434]); // Badge of Justice

// Header-like labels to skip (after BBCode stripping)
const HEADER_PATTERNS = new Set(['rank', 'item', 'source', 'slot', 'gear', 'name']);

// Slot name in toc= headings -> our slot keys
const TOC_SLOT_MAP = {
  'Head': ['head'], 'Neck': ['neck'], 'Shoulder': ['shoulders'], 'Shoulders': ['shoulders'],
  'Back': ['back'], 'Cloak': ['back'], 'Cape': ['back'],
  'Chest': ['chest'], 'Wrist': ['wrists'], 'Wrists': ['wrists'], 'Bracer': ['wrists'],
  'Hands': ['hands'], 'Gloves': ['hands'],
  'Waist': ['waist'], 'Belt': ['waist'],
  'Legs': ['legs'], 'Feet': ['feet'], 'Boots': ['feet'],
  'Ring': ['ring1', 'ring2'], 'Rings': ['ring1', 'ring2'], 'Finger': ['ring1', 'ring2'],
  'Trinket': ['trinket1', 'trinket2'], 'Trinkets': ['trinket1', 'trinket2'],
  'Main Hand': ['mainhand'], 'Main-Hand': ['mainhand'], 'Mainhand': ['mainhand'],
  'Off Hand': ['offhand'], 'Off-Hand': ['offhand'], 'Offhand': ['offhand'],
  'One-Hand': ['mainhand'],
  'Two-Hand': ['twohand'], 'Two-Handed': ['twohand'], 'Twohand': ['twohand'],
  'Wand': ['wand'], 'Ranged': ['wand'],
  'Relic': ['libram'], 'Libram': ['libram'], 'Totem': ['libram'], 'Idol': ['libram'],
  'Weapon': ['mainhand'], 'Weapons': ['mainhand'],
};

// ============================================================
//  CLI argument parsing
// ============================================================

const args = process.argv.slice(2);
const flagAll     = args.includes('--all');
const flagRefresh = args.includes('--refresh');
const specSlug    = args.find(a => !a.startsWith('--'));

if (!flagAll && !specSlug) {
  console.error('Usage: node _extract-rankings.js <spec-slug>');
  console.error('       node _extract-rankings.js --all [--refresh]');
  console.error('Example: node _extract-rankings.js arcane-mage');
  process.exit(1);
}

// ============================================================
//  HTTP helper (same as _sync-spec.js)
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
//  Guide page cache (24h expiry, _data/guide-cache/)
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
    console.log('  Cache invalid (missing guide content), will re-fetch');
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
  // Check cache first
  const cached = readCachedGuide(slug);
  if (cached) return { html: cached, fetched: false };

  // Fetch via proxy
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  try {
    process.stdout.write('  Trying allorigins proxy... ');
    const res = await httpGet(proxyUrl);
    if (res.status === 200 && isValidGuideHtml(res.body)) {
      console.log(`OK (${(res.body.length/1024).toFixed(0)} KB)`);
      writeCachedGuide(slug, res.body);
      return { html: res.body, fetched: true };
    }
    const reason = res.status !== 200 ? `status=${res.status}` : res.body.length < 20000 ? `too small (${res.body.length})` : 'missing guide content (404 or error page)';
    console.log(`bad response (${reason})`);
  } catch (e) {
    console.log(`failed: ${e.message}`);
  }

  // Fetch direct
  try {
    process.stdout.write('  Trying direct fetch... ');
    const res = await httpGet(url);
    if (res.status === 200 && isValidGuideHtml(res.body)) {
      console.log(`OK (${(res.body.length/1024).toFixed(0)} KB)`);
      writeCachedGuide(slug, res.body);
      return { html: res.body, fetched: true };
    }
    const reason = res.status !== 200 ? `status=${res.status}` : res.body.length < 20000 ? `too small (${res.body.length})` : 'missing guide content (404 or error page)';
    console.log(`bad response (${reason})`);
  } catch (e) {
    console.log(`failed: ${e.message}`);
  }

  return { html: null, fetched: true };
}

// ============================================================
//  Parsing: extract BBCode from guide page, then slot rankings
// ============================================================

function extractBBCode(html) {
  // Wowhead guide content is inside WH.markup.printHtml("...", "guide-body"...)
  // The BBCode is a JSON-escaped string with \r\n, \", \/ etc.
  const m = html.match(/WH\.markup\.printHtml\("([\s\S]*?)"\s*,\s*"guide-body/);
  if (!m) return null;
  let bbcode = m[1];
  bbcode = bbcode.replace(/\\r\\n/g, '\n');
  bbcode = bbcode.replace(/\\n/g, '\n');
  bbcode = bbcode.replace(/\\"/g, '"');
  bbcode = bbcode.replace(/\\\//g, '/');
  return bbcode;
}

function extractRankings(html) {
  const bbcode = extractBBCode(html);
  if (!bbcode) {
    console.log('  Warning: Could not extract BBCode from guide page');
    return {};
  }
  console.log(`  Extracted BBCode: ${bbcode.length} chars`);

  const rankings = {};

  // Find [h3 toc="SlotName"] headings (escaped quotes already resolved)
  const tocRe = /\[h[23]\s+toc="([^"]+)"/g;
  const headings = [];
  let m;
  while ((m = tocRe.exec(bbcode))) {
    headings.push({ name: m[1], pos: m.index });
  }

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const slotKeys = resolveSlotKeys(heading.name);
    if (!slotKeys) continue;

    // Section text: from this heading to the next heading (or end)
    const sectionEnd = (i + 1 < headings.length) ? headings[i + 1].pos : bbcode.length;
    const section = bbcode.substring(heading.pos, sectionEnd);

    // Extract rank + item pairs from table rows
    const items = parseRankItems(section);
    if (items.length === 0) continue;

    for (const slotKey of slotKeys) {
      rankings[slotKey] = items;
    }
  }

  return rankings;
}

function resolveSlotKeys(tocName) {
  if (TOC_SLOT_MAP[tocName]) return TOC_SLOT_MAP[tocName];

  const firstWord = tocName.split(/\s/)[0];
  if (TOC_SLOT_MAP[firstWord]) return TOC_SLOT_MAP[firstWord];

  const lower = tocName.toLowerCase();
  for (const [key, val] of Object.entries(TOC_SLOT_MAP)) {
    if (key.toLowerCase() === lower || lower.startsWith(key.toLowerCase())) return val;
  }

  return null;
}

function parseRankItems(sectionBBCode) {
  const items = [];
  const seen = new Set();

  // BBCode format: [tr][td]BiS[/td]\n[td][item=32089][/td]\n[td]...[/td][/tr]
  // Rows may span multiple lines. Match [tr]...[/tr] blocks.
  const rowRe = /\[tr\]([\s\S]*?)\[\/tr\]/gi;
  let rm;
  while ((rm = rowRe.exec(sectionBBCode))) {
    const rowContent = rm[1];

    // Extract [td]...[/td] cells
    const cells = [];
    const cellRe = /\[td[^\]]*\]([\s\S]*?)\[\/td\]/gi;
    let cm;
    while ((cm = cellRe.exec(rowContent))) {
      cells.push(cm[1].trim());
    }

    if (cells.length < 2) continue;

    // First cell: rank label (strip BBCode tags like [b]Rank[/b])
    const rankRaw = cells[0].replace(/\[[^\]]*\]/g, '').trim();
    if (!rankRaw) continue;

    // Skip header rows and header-like labels
    const rankLower = rankRaw.toLowerCase().trim();
    if (HEADER_PATTERNS.has(rankLower)) continue;

    const rank = normalizeRank(rankRaw);
    if (!rank) continue;

    // Find [item=ID] in the 2nd cell only (item column, not source column)
    if (cells.length >= 2) {
      const itemRe = /\[item=(\d+)\]/g;
      let im;
      while ((im = itemRe.exec(cells[1]))) {
        const id = parseInt(im[1]);
        if (id >= 1000 && !seen.has(id) && !SKIP_IDS.has(id)) {
          seen.add(id);
          items.push({ id, rank });
        }
      }
    }
  }

  return items;
}

function normalizeRank(raw) {
  // Strip newlines and normalize whitespace first
  const cleaned = raw.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  const lower = cleaned.toLowerCase().replace(/[^a-z\s-]/g, '').trim();
  if (!lower) return null;

  // Map common variants
  if (lower === 'bis' || lower.startsWith('bis')) return 'BiS';
  if (lower === 'best') return 'BiS';
  if (lower === 'great') return 'Option';
  if (lower === 'good') return 'Option';
  if (lower === 'okay') return 'Optional';
  if (lower === 'viable') return 'Optional';
  if (lower === 'option' || lower === 'optional') return 'Option';
  if (lower.includes('easy to obtain') || lower.includes('easy')) return 'Easy to Obtain';
  if (lower.includes('alternative')) return 'Option';
  if (lower.includes('pvp')) return 'PvP';

  // Return cleaned version if it looks like a valid rank
  if (lower.length > 1 && lower.length < 30) {
    return cleaned;
  }

  return null;
}

// ============================================================
//  File I/O: load existing, merge, write
// ============================================================

function loadExistingRankings() {
  if (!fs.existsSync(RANKINGS_FILE)) return {};
  const content = fs.readFileSync(RANKINGS_FILE, 'utf8');
  // Parse: var RANKINGS = {...};
  const match = content.match(/var RANKINGS\s*=\s*(\{[\s\S]*\});/);
  if (!match) return {};
  try {
    return JSON.parse(match[1]);
  } catch (e) {
    console.log('  Warning: Could not parse existing rankings.js, starting fresh');
    return {};
  }
}

function writeRankings(data) {
  const json = JSON.stringify(data, null, 2);
  const content = `// Generated by _extract-rankings.js — do not edit manually\nvar RANKINGS = ${json};\n`;
  fs.writeFileSync(RANKINGS_FILE, content, 'utf8');
}

// ============================================================
//  Single-spec extraction
// ============================================================

async function extractSpec(slug, guideUrl) {
  console.log(`Fetching guide: ${guideUrl}`);
  const { html: guideHtml, fetched } = await fetchGuidePage(guideUrl, slug);
  if (!guideHtml) {
    console.error('  Failed to fetch guide page!');
    return { success: false, fetched, slotCount: 0, itemCount: 0 };
  }

  // Extract rankings from HTML
  console.log('  Parsing rankings...');
  const slotRankings = extractRankings(guideHtml);

  const slotCount = Object.keys(slotRankings).length;
  let itemCount = 0;
  for (const slot of Object.keys(slotRankings)) {
    itemCount += slotRankings[slot].length;
  }

  if (slotCount === 0) {
    console.error('  No rankings found! The page format may have changed.');
    console.log('  Debug: writing guide HTML to _data/debug-guide.html');
    fs.mkdirSync(path.join(__dirname, '_data'), { recursive: true });
    fs.writeFileSync(path.join(__dirname, '_data', 'debug-guide.html'), guideHtml, 'utf8');
    return { success: false, fetched, slotCount: 0, itemCount: 0 };
  }

  console.log(`  Found ${itemCount} ranked items across ${slotCount} slots`);
  for (const [slot, items] of Object.entries(slotRankings)) {
    const ranks = items.map(i => i.rank);
    const unique = [...new Set(ranks)];
    console.log(`    ${slot.padEnd(12)} ${items.length} items (${unique.join(', ')})`);
  }

  return { success: true, fetched, slotCount, itemCount, rankings: slotRankings };
}

// ============================================================
//  Sleep helper
// ============================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
//  Main
// ============================================================

async function main() {
  if (flagAll) {
    // ---- Batch mode: all specs ----
    const allSlugs = Object.keys(GUIDE_URLS);
    console.log(`=== Extract Rankings: ALL ${allSlugs.length} specs ===\n`);

    const existing = loadExistingRankings();
    if (!existing.wowhead) existing.wowhead = {};

    const results = [];
    let totalItems = 0;
    let totalSlots = 0;

    for (let i = 0; i < allSlugs.length; i++) {
      const slug = allSlugs[i];
      const guideUrl = GUIDE_URLS[slug];
      console.log(`\n[${i + 1}/${allSlugs.length}] ${slug}`);

      try {
        const result = await extractSpec(slug, guideUrl);
        results.push({ slug, ...result });

        if (result.success) {
          existing.wowhead[slug] = result.rankings;
          totalItems += result.itemCount;
          totalSlots += result.slotCount;
        }

        // 500ms delay between network fetches (not between cached reads)
        if (result.fetched && i < allSlugs.length - 1) {
          await sleep(500);
        }
      } catch (err) {
        console.error(`  Error: ${err.message}`);
        results.push({ slug, success: false, fetched: false, slotCount: 0, itemCount: 0 });
      }
    }

    // Write merged results
    writeRankings(existing);
    console.log(`\n  Wrote ${RANKINGS_FILE}`);

    // Print summary
    const successes = results.filter(r => r.success);
    const failures  = results.filter(r => !r.success);

    console.log('\n=== SUMMARY ===');
    console.log(`Total: ${successes.length}/${allSlugs.length} specs succeeded`);
    console.log(`Items: ${totalItems} across ${totalSlots} slots`);

    if (failures.length > 0) {
      console.log(`\nFailed specs (${failures.length}):`);
      for (const f of failures) {
        console.log(`  - ${f.slug}`);
      }
    }

    console.log('\nPer-spec breakdown:');
    for (const r of results) {
      const status = r.success ? 'OK' : 'FAIL';
      const cached = r.fetched ? '' : ' (cached)';
      console.log(`  ${status.padEnd(5)} ${r.slug.padEnd(24)} ${r.itemCount || 0} items / ${r.slotCount || 0} slots${cached}`);
    }

    console.log('\nDone!');

  } else {
    // ---- Single-spec mode ----
    const guideUrl = GUIDE_URLS[specSlug];
    if (!guideUrl) {
      console.error(`Unknown spec slug: "${specSlug}"`);
      console.error('Available:', Object.keys(GUIDE_URLS).join(', '));
      process.exit(1);
    }

    console.log(`=== Extract Rankings: ${specSlug} ===\n`);

    const result = await extractSpec(specSlug, guideUrl);
    if (!result.success) {
      process.exit(1);
    }

    // Merge with existing rankings
    console.log('\nMerging with existing rankings...');
    const existing = loadExistingRankings();
    if (!existing.wowhead) existing.wowhead = {};
    existing.wowhead[specSlug] = result.rankings;

    // Write output
    writeRankings(existing);
    console.log(`  Wrote ${RANKINGS_FILE}`);

    console.log('\nDone!');
  }
}

main().catch(err => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
