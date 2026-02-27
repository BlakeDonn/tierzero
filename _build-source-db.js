#!/usr/bin/env node
'use strict';

/*  _build-source-db.js
 *  Downloads AtlasLoot Lua files from GitHub, parses them line-by-line,
 *  and builds _data/source-db.json mapping item IDs to their sources.
 *
 *  Usage:  node _build-source-db.js
 *  Output: _data/source-db.json
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ============================================================
//  Configuration
// ============================================================

const DATA_DIR      = path.join(__dirname, '_data');
const ATLASLOOT_DIR = path.join(DATA_DIR, 'atlasloot');
const OUTPUT_FILE   = path.join(DATA_DIR, 'source-db.json');

const GITHUB_BASE = 'https://raw.githubusercontent.com/Hoizame/AtlasLootClassic/master';

const LUA_FILES = {
  'data-tbc-dungeons.lua':    `${GITHUB_BASE}/AtlasLootClassic_DungeonsAndRaids/data-tbc.lua`,
  'data-tbc-factions.lua':    `${GITHUB_BASE}/AtlasLootClassic_Factions/data-tbc.lua`,
  'data-tbc-collections.lua': `${GITHUB_BASE}/AtlasLootClassic_Collections/data-tbc.lua`,
  'data-tbc-pvp.lua':         `${GITHUB_BASE}/AtlasLootClassic_PvP/data-tbc.lua`,
};

// Dungeon key → display name
const DUNGEON_NAMES = {
  'HellfireRamparts': 'Hellfire Ramparts',
  'TheBloodFurnace': 'Blood Furnace',
  'TheShatteredHalls': 'Shattered Halls',
  'TheSlavePens': 'Slave Pens',
  'TheUnderbog': 'Underbog',
  'TheSteamvault': 'Steamvault',
  'ManaTombs': 'Mana-Tombs',
  'AuchenaiCrypts': 'Auchenai Crypts',
  'SethekkHalls': 'Sethekk Halls',
  'ShadowLabyrinth': 'Shadow Labyrinth',
  'OldHillsbradFoothills': 'Old Hillsbrad Foothills',
  'TheBlackMorass': 'Black Morass',
  'TheMechanar': 'Mechanar',
  'TheBotanica': 'Botanica',
  'TheArcatraz': 'Arcatraz',
  'MagistersTerrace': "Magisters' Terrace",
  // Raids (we still parse them in case pre-raid items drop from trash etc.)
  'Karazhan': 'Karazhan',
  'GruulsLair': "Gruul's Lair",
  'MagtheridonsLair': "Magtheridon's Lair",
  'SerpentshrineCavern': 'Serpentshrine Cavern',
  'TempestKeepTheEye': 'Tempest Keep',
  'MountHyjal': 'Mount Hyjal',
  'BlackTemple': 'Black Temple',
  'SunwellPlateau': 'Sunwell Plateau',
  'ZulAman': "Zul'Aman",
};

// Faction key → display name
const FACTION_NAMES = {
  'TheAldor': 'The Aldor',
  'TheScryers': 'The Scryers',
  'TheShatar': "The Sha'tar",
  'LowerCity': 'Lower City',
  'KeepersOfTime': 'Keepers of Time',
  'CenarionExpedition': 'Cenarion Expedition',
  'TheConsortium': 'The Consortium',
  'Thrallmar': 'Thrallmar',
  'HonorHold': 'Honor Hold',
  'TheMaghar': "The Mag'har",
  'Kurenai': 'Kurenai',
  'TheVioletEye': 'The Violet Eye',
  'Sporeggar': 'Sporeggar',
  'OgriLa': "Ogri'la",
  'AshtongueDeathsworn': 'Ashtongue Deathsworn',
  'NetherwingBC': 'Netherwing',
  'ShatteredSunOffensive': 'Shattered Sun Offensive',
  'ShaTari': "The Sha'tar",
  'ShatariSkyguard': "Sha'tari Skyguard",
  'ScaleOfTheSands': 'Scale of the Sands',
};

// Rep tier strings from Lua
const REP_TIERS = {
  'Exalted': 'Exalted',
  'Revered': 'Revered',
  'Honored': 'Honored',
  'Friendly': 'Friendly',
};

// Boss name shortening (AtlasLoot full name → our short name)
// Matches existing source strings in index.html
const BOSS_SHORT = {
  'Watchkeeper Gargolmar': 'Watchkeeper Gargolmar',
  'Omor the Unscarred': 'Omor the Unscarred',
  'Nazan & Vazruden': 'Nazan & Vazruden',
  'The Maker': 'The Maker',
  'Broggok': 'Broggok',
  "Keli'dan the Breaker": "Keli'dan the Breaker",
  'Grand Warlock Nethekurse': 'Nethekurse',
  'Blood Guard Porung': 'Porung',
  'Warchief Kargath Bladefist': 'Warchief Kargath',
  'Mennu the Betrayer': 'Mennu',
  'Rokmar the Crackler': 'Rokmar',
  'Quagmirran': 'Quagmirran',
  'Hungarfen': 'Hungarfen',
  "Ghaz'an": "Ghaz'an",
  "Swamplord Musel'ek": "Swamplord Musel'ek",
  'The Black Stalker': 'The Black Stalker',
  'Hydromancer Thespia': 'Hydromancer Thespia',
  'Mekgineer Steamrigger': 'Mekgineer Steamrigger',
  'Warlord Kalithresh': 'Warlord Kalithresh',
  'Pandemonius': 'Pandemonius',
  'Tavarok': 'Tavarok',
  'Nexus-Prince Shaffar': 'Shaffar',
  'Shirrak the Dead Watcher': 'Shirrak',
  'Exarch Maladaar': 'Exarch Maladaar',
  'Avatar of the Martyred': 'Avatar of the Martyred',
  'Darkweaver Syth': 'Darkweaver Syth',
  'Talon King Ikiss': 'Ikiss',
  'Ambassador Hellmaw': 'Hellmaw',
  'Blackheart the Inciter': 'Blackheart',
  'Grandmaster Vorpil': 'Grandmaster Vorpil',
  'Murmur': 'Murmur',
  'Lieutenant Drake': 'Lt. Drake',
  'Captain Skarloc': 'Captain Skarloc',
  'Epoch Hunter': 'Epoch Hunter',
  'Chrono Lord Deja': 'Chrono Lord Deja',
  'Temporus': 'Temporus',
  'Aeonus': 'Aeonus',
  'Mechano-Lord Capacitus': 'Capacitus',
  'Nethermancer Sepethrea': 'Sepethrea',
  'Pathaleon the Calculator': 'Pathaleon the Calculator',
  'Commander Sarannis': 'Sarannis',
  'High Botanist Freywinn': 'Freywinn',
  'Thorngrin the Tender': 'Thorngrin',
  'Laj': 'Laj',
  'Warp Splinter': 'Warp Splinter',
  'Zereketh the Unbound': 'Zereketh',
  'Dalliah the Doomsayer': 'Dalliah',
  'Wrath-Scryer Soccothrates': 'Soccothrates',
  'Harbinger Skyriss': 'Harbinger Skyriss',
  'Selin Fireheart': 'Selin Fireheart',
  'Vexallus': 'Vexallus',
  'Priestess Delrissa': 'Priestess Delrissa',
  "Kael'thas Sunstrider": "Kael'thas Sunstrider",
};

function shortenBoss(name) {
  return BOSS_SHORT[name] || name;
}

// Known non-gear items to skip
const SKIP_IDS = new Set([
  29434, // Badge of Justice
]);

// ============================================================
//  HTTP helper
// ============================================================

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'TierZero-Pipeline/1.0' },
      timeout: 30000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpsGet(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ============================================================
//  Download Lua files
// ============================================================

async function downloadLuaFiles() {
  fs.mkdirSync(ATLASLOOT_DIR, { recursive: true });

  for (const [filename, url] of Object.entries(LUA_FILES)) {
    const dest = path.join(ATLASLOOT_DIR, filename);
    if (fs.existsSync(dest)) {
      const stat = fs.statSync(dest);
      const age = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);
      if (age < 24) {
        console.log(`  [cached] ${filename} (${(stat.size/1024).toFixed(0)} KB, ${age.toFixed(1)}h old)`);
        continue;
      }
    }
    process.stdout.write(`  Downloading ${filename}... `);
    const body = await httpsGet(url);
    fs.writeFileSync(dest, body, 'utf8');
    console.log(`OK (${(body.length/1024).toFixed(0)} KB)`);
  }
}

// ============================================================
//  Lua parsers
// ============================================================

/**
 * Parse dungeon/raid Lua file.
 * Returns { "itemId": { source, type } }
 */
function parseDungeons(luaText) {
  const db = {};
  const lines = luaText.split('\n');

  let currentDungeon = null;
  let currentBoss    = null;
  let currentDiff    = null; // 'normal' | 'heroic'
  let insideIgnore   = false;
  let depth          = 0;
  let ignoreDepth    = 0;
  let inItems        = false; // inside items = { ... }
  let inTrash        = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Track data["DungeonKey"] blocks
    const dungeonMatch = trimmed.match(/^data\["(\w+)"\]\s*=\s*\{/);
    if (dungeonMatch) {
      const key = dungeonMatch[1];
      currentDungeon = DUNGEON_NAMES[key] || null;
      currentBoss = null;
      currentDiff = null;
      insideIgnore = false;
      inItems = false;
      inTrash = false;
      depth = 1;
      continue;
    }

    if (!currentDungeon) continue;

    // Track IgnoreAsSource
    if (trimmed.includes('IgnoreAsSource = true')) {
      insideIgnore = true;
      ignoreDepth = depth;
    }

    // Track items = { block
    if (trimmed.match(/^items\s*=\s*\{/)) {
      inItems = true;
      continue;
    }

    // Boss name: name = AL["Boss Name"] or name = ALIL["Boss Name"]
    const bossMatch = trimmed.match(/^name\s*=\s*(?:AL|ALIL)\["([^"]+)"\]/);
    if (bossMatch && inItems) {
      currentBoss = bossMatch[1];
      currentDiff = null;
      inTrash = false;
      // Check if this is a trash mob section
      if (/trash/i.test(currentBoss)) {
        inTrash = true;
      }
    }

    // Boss name format: name = format(..., AL["Boss Name"])
    const bossFormatMatch = trimmed.match(/^name\s*=\s*format\([^,]+,\s*(?:AL|ALIL)\["([^"]+)"\]/);
    if (bossFormatMatch && inItems) {
      currentBoss = bossFormatMatch[1];
      currentDiff = null;
      inTrash = false;
      if (/trash/i.test(currentBoss)) inTrash = true;
    }

    // Difficulty markers
    if (trimmed.match(/^\[NORMAL_DIFF\]\s*=\s*\{/)) {
      currentDiff = 'normal';
    } else if (trimmed.match(/^\[HEROIC_DIFF\]\s*=\s*\{/)) {
      currentDiff = 'heroic';
    } else if (trimmed.match(/^\[RAID10_DIFF\]\s*=\s*\{/) || trimmed.match(/^\[RAID25_DIFF\]\s*=\s*\{/)) {
      currentDiff = 'raid';
    }

    // Item entries: { N, ITEMID } or { N, ITEMID, ... }
    const itemMatch = trimmed.match(/^\{\s*\d+\s*,\s*(\d+)\s*[,}]/);
    if (itemMatch && currentDiff && currentBoss && !insideIgnore) {
      const itemId = parseInt(itemMatch[1]);
      if (itemId >= 1000 && !SKIP_IDS.has(itemId)) {
        let bossName = inTrash ? 'Trash' : shortenBoss(currentBoss);
        let dungeonPrefix = currentDungeon;
        let type = 'dungeon';

        if (currentDiff === 'heroic') {
          dungeonPrefix = 'Heroic ' + currentDungeon;
          type = 'heroic';
        } else if (currentDiff === 'raid') {
          type = 'raid';
        }

        const source = `${dungeonPrefix} - ${bossName}`;

        // Only record if we don't already have a more specific source
        if (!db[itemId] || shouldReplace(db[itemId].type, type)) {
          db[itemId] = { source, type };
        }
      }
    }

    // Track brace depth for ignoreAsSource blocks
    const opens  = (trimmed.match(/\{/g) || []).length;
    const closes = (trimmed.match(/\}/g) || []).length;
    depth += opens - closes;

    if (insideIgnore && depth <= ignoreDepth) {
      insideIgnore = false;
    }

    // Reset dungeon when depth returns to 0
    if (depth <= 0) {
      currentDungeon = null;
      currentBoss = null;
      currentDiff = null;
      insideIgnore = false;
      inItems = false;
      depth = 0;
    }
  }

  return db;
}

/**
 * Parse factions Lua file.
 * Returns { "itemId": { source, type } }
 */
function parseFactions(luaText) {
  const db = {};
  const lines = luaText.split('\n');

  let currentFaction = null;
  let currentTier    = null;
  let depth          = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Track data["FactionKey"] blocks
    const factionMatch = trimmed.match(/^data\["(\w+)"\]\s*=\s*\{/);
    if (factionMatch) {
      const key = factionMatch[1];
      currentFaction = FACTION_NAMES[key] || key;
      currentTier = null;
      depth = 1;
      continue;
    }

    if (!currentFaction) continue;

    // Rep tier: name = ALIL["Exalted"]
    const tierMatch = trimmed.match(/^name\s*=\s*(?:AL|ALIL)\["(Exalted|Revered|Honored|Friendly)"\]/);
    if (tierMatch) {
      currentTier = tierMatch[1];
    }

    // Item entries (skip faction bar entries like "f932rep8")
    const itemMatch = trimmed.match(/^\{\s*\d+\s*,\s*(\d+)\s*[,}]/);
    if (itemMatch && currentTier && currentFaction) {
      const itemId = parseInt(itemMatch[1]);
      if (itemId >= 1000 && !SKIP_IDS.has(itemId)) {
        const source = `${currentFaction} - ${currentTier}`;
        if (!db[itemId]) {
          db[itemId] = { source, type: 'faction' };
        }
      }
    }

    // Track depth
    const opens  = (trimmed.match(/\{/g) || []).length;
    const closes = (trimmed.match(/\}/g) || []).length;
    depth += opens - closes;

    if (depth <= 0) {
      currentFaction = null;
      currentTier = null;
      depth = 0;
    }
  }

  return db;
}

/**
 * Parse collections Lua file (badge vendors).
 * Returns { "itemId": { source, type } }
 */
function parseCollections(luaText) {
  const db = {};
  const lines = luaText.split('\n');

  let inBadgeSection = false;
  let depth = 0;
  let badgeDepth = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Badge vendor sections
    const dataMatch = trimmed.match(/^data\["(BadgeofJustice\w*)"\]\s*=\s*\{/);
    if (dataMatch) {
      inBadgeSection = true;
      depth = 1;
      badgeDepth = 1;
      continue;
    }

    // Any other data section exits badge mode
    const otherData = trimmed.match(/^data\["(\w+)"\]\s*=\s*\{/);
    if (otherData && !otherData[1].startsWith('BadgeofJustice')) {
      inBadgeSection = false;
      depth = 1;
      continue;
    }

    if (!inBadgeSection) {
      // Track depth outside badge sections
      const opens  = (trimmed.match(/\{/g) || []).length;
      const closes = (trimmed.match(/\}/g) || []).length;
      depth += opens - closes;
      if (depth <= 0) depth = 0;
      continue;
    }

    // Item entries inside badge sections
    const itemMatch = trimmed.match(/^\{\s*\d+\s*,\s*(\d+)\s*[,}]/);
    if (itemMatch) {
      const itemId = parseInt(itemMatch[1]);
      if (itemId >= 1000 && !SKIP_IDS.has(itemId)) {
        if (!db[itemId]) {
          db[itemId] = { source: 'Badges of Justice', type: 'badge' };
        }
      }
    }

    // Track depth
    const opens  = (trimmed.match(/\{/g) || []).length;
    const closes = (trimmed.match(/\}/g) || []).length;
    depth += opens - closes;

    if (depth <= 0) {
      inBadgeSection = false;
      depth = 0;
    }
  }

  return db;
}

/**
 * Parse PvP Lua file.
 * Returns { "itemId": { source, type } }
 */
function parsePvP(luaText) {
  const db = {};
  const lines = luaText.split('\n');

  let inDataBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.match(/^data\["/)) {
      inDataBlock = true;
    }

    if (!inDataBlock) continue;

    const itemMatch = trimmed.match(/^\{\s*\d+\s*,\s*(\d+)\s*[,}]/);
    if (itemMatch) {
      const itemId = parseInt(itemMatch[1]);
      if (itemId >= 1000 && !SKIP_IDS.has(itemId)) {
        if (!db[itemId]) {
          db[itemId] = { source: 'PvP', type: 'pvp' };
        }
      }
    }
  }

  return db;
}

// Source priority: dungeon > heroic > faction > badge > pvp > raid
const TYPE_PRIORITY = { dungeon: 1, heroic: 2, faction: 3, badge: 4, pvp: 5, raid: 6 };

function shouldReplace(existingType, newType) {
  const existPri = TYPE_PRIORITY[existingType] || 99;
  const newPri   = TYPE_PRIORITY[newType] || 99;
  return newPri < existPri;
}

// ============================================================
//  Main
// ============================================================

async function main() {
  console.log('=== Build Source DB ===\n');

  // 1. Download Lua files
  console.log('Downloading AtlasLoot Lua files...');
  await downloadLuaFiles();

  // 2. Parse each file
  console.log('\nParsing Lua files...');

  const dungeonLua = fs.readFileSync(path.join(ATLASLOOT_DIR, 'data-tbc-dungeons.lua'), 'utf8');
  const factionLua = fs.readFileSync(path.join(ATLASLOOT_DIR, 'data-tbc-factions.lua'), 'utf8');
  const collectLua = fs.readFileSync(path.join(ATLASLOOT_DIR, 'data-tbc-collections.lua'), 'utf8');
  const pvpLua     = fs.readFileSync(path.join(ATLASLOOT_DIR, 'data-tbc-pvp.lua'), 'utf8');

  const dungeonDb  = parseDungeons(dungeonLua);
  const factionDb  = parseFactions(factionLua);
  const badgeDb    = parseCollections(collectLua);
  const pvpDb      = parsePvP(pvpLua);

  console.log(`  Dungeons/Raids: ${Object.keys(dungeonDb).length} items`);
  console.log(`  Factions:       ${Object.keys(factionDb).length} items`);
  console.log(`  Badges:         ${Object.keys(badgeDb).length} items`);
  console.log(`  PvP:            ${Object.keys(pvpDb).length} items`);

  // 3. Merge with priority: dungeon > heroic > faction > badge > pvp
  const merged = {};

  // Start with lowest priority (pvp), overwrite with higher
  for (const [id, entry] of Object.entries(pvpDb)) {
    merged[id] = entry;
  }
  for (const [id, entry] of Object.entries(badgeDb)) {
    if (!merged[id] || shouldReplace(merged[id].type, entry.type)) {
      merged[id] = entry;
    }
  }
  for (const [id, entry] of Object.entries(factionDb)) {
    if (!merged[id] || shouldReplace(merged[id].type, entry.type)) {
      merged[id] = entry;
    }
  }
  for (const [id, entry] of Object.entries(dungeonDb)) {
    if (!merged[id] || shouldReplace(merged[id].type, entry.type)) {
      merged[id] = entry;
    }
  }

  console.log(`\n  Merged total: ${Object.keys(merged).length} unique items`);

  // 4. Write output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(merged, null, 2), 'utf8');
  console.log(`  Wrote ${OUTPUT_FILE}`);

  // 5. Print some sample entries
  console.log('\nSample entries:');
  const samples = Object.entries(merged).slice(0, 10);
  for (const [id, entry] of samples) {
    console.log(`  ${id}: ${entry.source} (${entry.type})`);
  }

  console.log('\nDone!');
}

main().catch(err => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
