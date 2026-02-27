// Fetch missing paladin item stats from Wowhead tooltip API
const fs = require('fs');
const https = require('https');

// Existing item IDs per spec (extracted from index.html)
const existingRet = new Set([32087,28224,28414,29381,29119,31275,33173,27797,27434,24259,29382,27892,23522,28403,24396,23537,29246,27918,30341,23520,25685,29247,27985,29516,30257,30533,31544,25686,27867,28318,30834,29177,31920,30365,31380,29383,28288,28034,22954,23041,28429,28441,29356,31322,27484,31033]);
const existingProt = new Set([32083,28285,23519,29173,29336,24121,27739,27803,27847,27804,29385,24253,28203,28262,29127,29252,23538,27459,27535,23517,28390,29253,29238,31460,29184,27839,23518,29254,29239,27813,31319,28555,29384,27822,24088,31078,30300,24125,27891,27529,28042,23836,30832,29155,29185,29176,29266,28316,29388,27917]);
const existingHoly = new Set([32084,24264,28413,28192,29374,29123,24121,27775,21874,27433,27539,29354,29375,27946,24254,29522,21875,28230,29341,29523,23539,29183,29249,27457,29506,27536,29524,21873,29250,27548,30543,24261,27875,30256,29251,27411,28221,28259,29169,29126,29172,29376,30841,28370,28590,25634,35750,29175,23556,31342,28257,29274,27714,28412,28187,23006,25644,23201]);

// Items to fetch per spec: [id, slot, source, quality]
const retItems = [
  [28182,"head","Quest: The Warlord's Hideout","rare"],
  [31105,"head","Quest: Teron Gorefiend, I am...","rare"],
  [27771,"shoulders","Heroic Underbog - The Black Stalker","rare"],
  [27776,"shoulders","Sethekk Halls - Ikiss","rare"],
  [27878,"back","Heroic Auchenai Crypts - Avatar of the Martyred","rare"],
  [28249,"back","Mechanar - Capacitus","rare"],
  [28484,"chest","Blacksmithing - Armorsmithing (BoP)","epic"],
  [25697,"wrists","Leatherworking (BoP)","rare"],
  [29517,"wrists","Leatherworking - Dragonscale (BoP)","epic"],
  [29509,"hands","Leatherworking - Dragonscale (BoP)","epic"],
  [27497,"hands","Blood Furnace - Keli'dan the Breaker","rare"],
  [27755,"waist","Heroic Underbog - Ghaz'an","rare"],
  [28176,"feet","Quest: Into the Heart of the Labyrinth","rare"],
  [29349,"neck","Heroic Slave Pens - Quagmirran","epic"],
  [31694,"neck","Quest: The Hound-Master","rare"],
  [29776,"trinket1","Quest: Ar'kelos the Guardian","rare"],
  [31318,"twohand","World Drop (BoE)","epic"],
  [23541,"twohand","Blacksmithing (BoE)","epic"],
  [22401,"libram","Dire Maul East - Isalien","rare"],
  [23203,"libram","World Drop (BoE)","rare"],
];

const protItems = [
  [23536,"head","Blacksmithing (BoE)","rare"],
  [27520,"head","Shattered Halls - Warchief Kargath","rare"],
  [30291,"shoulders","Quest: Deathblow to the Legion","rare"],
  [27988,"back","Black Morass - Chrono Lord Deja","rare"],
  [27550,"back","Heroic Slave Pens - Rokmar","rare"],
  [23507,"chest","Blacksmithing (BoE)","rare"],
  [29463,"wrists","Heroic Steamvault - Mekgineer Steamrigger","rare"],
  [32072,"hands","Heroic Botanica - Warp Splinter","rare"],
  [23532,"hands","Blacksmithing (BoE)","rare"],
  [29134,"hands","The Scryers - Revered","rare"],
  [27672,"waist","Heroic Slave Pens - Quagmirran","rare"],
  [27871,"neck","Auchenai Crypts - Exarch Maladaar","rare"],
  [29386,"neck","25 Badges of Justice","epic"],
  [28407,"ring1","Arcatraz - Harbinger Skyriss","rare"],
  [29323,"ring1","Quest: Return to Andormu","rare"],
  [28265,"ring2","Mechanar - Nethermancer Sepethrea","rare"],
  [29370,"trinket1","25 Badges of Justice","epic"],
  [29387,"trinket2","25 Badges of Justice","epic"],
  [27899,"mainhand","Shadow Labyrinth - Ambassador Hellmaw","rare"],
  [27449,"offhand","Heroic Hellfire Ramparts - Omor the Unscarred","rare"],
  [27887,"offhand","Shadow Labyrinth - Grandmaster Vorpil","rare"],
];

const holyItems = [
  [32086,"head","50 Badges of Justice","epic"],
  [28348,"head","Botanica - Warp Splinter","rare"],
  [29508,"head","Leatherworking - Tribal (BoP)","epic"],
  [27759,"head","Underbog - Swamplord Musel'ek","rare"],
  [27737,"shoulders","Steamvault - Hydromancer Thespia","rare"],
  [27826,"shoulders","Heroic Mana-Tombs - Nexus-Prince Shaffar","rare"],
  [28250,"shoulders","Mechanar - Nethermancer Sepethrea","rare"],
  [32078,"shoulders","Heroic Slave Pens - Quagmirran","epic"],
  [31329,"back","World Drop (BoE)","epic"],
  [27448,"back","Heroic Hellfire Ramparts - Omor the Unscarred","rare"],
  [29519,"chest","Leatherworking - Dragonscale (BoP)","epic"],
  [29129,"chest","The Aldor - Honored","rare"],
  [28202,"chest","Mechanar - Pathaleon the Calculator","rare"],
  [27489,"wrists","Heroic Blood Furnace - Keli'dan the Breaker","rare"],
  [28194,"wrists","Black Morass - Chrono Lord Deja","rare"],
  [27827,"wrists","Heroic Mana-Tombs - Nexus-Prince Shaffar","rare"],
  [28304,"hands","Botanica - Laj","rare"],
  [27806,"hands","Steamvault - Hydromancer Thespia","rare"],
  [28268,"hands","Auchenai Crypts - Shirrak","rare"],
  [31202,"waist","World Drop (BoE)","epic"],
  [29520,"waist","Leatherworking - Dragonscale (BoP)","epic"],
  [29244,"waist","Auchenai Crypts - Exarch Maladaar","rare"],
  [31461,"waist","Quest: How to Break Into the Arcatraz","rare"],
  [30541,"legs","Heroic Underbog - The Black Stalker","epic"],
  [27748,"legs","Heroic Underbog - Hungarfen","rare"],
  [28406,"feet","Arcatraz - Harbinger Skyriss","rare"],
  [27525,"feet","Shattered Halls - Warbringer O'mrogg","rare"],
  [27549,"feet","Heroic Slave Pens - Rokmar","rare"],
  [30377,"neck","Quest: Ar'kelos the Guardian","rare"],
  [31691,"neck","Quest: The Hound-Master","rare"],
  [29373,"ring1","25 Badges of Justice","epic"],
  [29168,"ring1","Honor Hold - Revered","rare"],
  [29367,"ring1","25 Badges of Justice","epic"],
  [29814,"ring2","Quest: Hitting the Motherlode","rare"],
  [27780,"ring2","Heroic Underbog - The Black Stalker","rare"],
  [28190,"trinket1","Black Morass - Temporus","rare"],
  [29267,"offhand","33 Badges of Justice","epic"],
  [27772,"offhand","Heroic Steamvault - Warlord Kalithresh","rare"],
  [28216,"mainhand","Black Morass - Chrono Lord Deja","rare"],
  [27538,"mainhand","Shattered Halls - Warchief Kargath","rare"],
];

function fetchItem(id) {
  return new Promise((resolve, reject) => {
    const url = `https://nether.wowhead.com/tooltip/item/${id}?dataEnv=5&locale=0`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ id, name: json.name, tooltip: json.tooltip, quality: json.quality });
        } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function parseStats(tooltip) {
  const stats = {};
  const map = {
    'Stamina': 'stam', 'Intellect': 'int', 'Strength': 'str', 'Agility': 'agi',
    'Spirit': 'spi', 'Armor': null,
  };
  // Green stats: +XX Stat
  const greenRe = /\+(\d+)\s+(Stamina|Intellect|Strength|Agility|Spirit)/g;
  let m;
  while ((m = greenRe.exec(tooltip)) !== null) {
    const key = map[m[2]];
    if (key) stats[key] = parseInt(m[1]);
  }
  // Equip effects
  const equipMap = [
    [/increases damage and healing done by magical spells and effects by up to (\d+)/i, 'sp'],
    [/increases healing done by up to (\d+)/i, 'heal'],
    [/Improves spell critical strike rating by (\d+)/i, 'crit'],
    [/Improves critical strike rating by (\d+)/i, 'crit'],
    [/Improves hit rating by (\d+)/i, 'hit'],
    [/Improves haste rating by (\d+)/i, 'haste'],
    [/Improves your resilience rating by (\d+)/i, 'res'],
    [/Increases attack power by (\d+)/i, 'ap'],
    [/Restores (\d+) mana per 5 sec/i, 'mp5'],
    [/Improves spell hit rating by (\d+)/i, 'hit'],
    [/Increases defense rating by (\d+)/i, 'def'],
    [/Increases your dodge rating by (\d+)/i, 'dodge'],
    [/Increases your parry rating by (\d+)/i, 'parry'],
    [/Increases your block rating by (\d+)/i, 'block'],
    [/Increases the block value of your shield by (\d+)/i, 'blockValue'],
    [/Increases your expertise rating by (\d+)/i, 'expertise'],
  ];
  for (const [re, key] of equipMap) {
    const em = tooltip.match(re);
    if (em) stats[key] = parseInt(em[1]);
  }
  return stats;
}

function parseSockets(tooltip) {
  const sockets = [];
  const socketRe = /socket-([a-z]+)/gi;
  let m;
  while ((m = socketRe.exec(tooltip)) !== null) {
    const color = m[1].toLowerCase();
    if (['red','yellow','blue','meta'].includes(color)) sockets.push(color);
  }
  // Socket bonus
  let bonus = null;
  const bonusRe = /Socket Bonus:.*?\+(\d+)\s+(\w[\w\s]*)/i;
  const bm = tooltip.match(bonusRe);
  if (bm) {
    const val = parseInt(bm[1]);
    const statName = bm[2].trim().toLowerCase();
    const bonusMap = {
      'stamina':'stam','intellect':'int','strength':'str','agility':'agi',
      'spell critical strike rating':'crit','critical strike rating':'crit',
      'hit rating':'hit','resilience rating':'res','healing':'heal',
      'dodge rating':'dodge','defense rating':'def','block rating':'block',
      'spell power':'sp','attack power':'ap','spirit':'spi','mana every 5 seconds':'mp5',
    };
    const key = bonusMap[statName] || statName.substring(0,3);
    bonus = {};
    bonus[key] = val;
  }
  return { sockets: sockets.length ? sockets : null, socketBonus: bonus };
}

function qualityStr(q) {
  if (q === 4) return 'Q.epic';
  if (q === 3) return 'Q.rare';
  if (q === 2) return 'Q.uncommon';
  if (q === 5) return 'Q.legendary';
  return 'Q.rare';
}

async function processSpec(specName, items, existingIds) {
  const output = [];
  output.push(`=== ${specName} ===`);

  const bySlot = {};
  for (const [id, slot, src, qual] of items) {
    if (existingIds.has(id)) continue;
    if (!bySlot[slot]) bySlot[slot] = [];
    bySlot[slot].push({ id, src, qual });
  }

  for (const slot of Object.keys(bySlot)) {
    output.push(`--- ${slot} ---`);
    for (const item of bySlot[slot]) {
      try {
        const data = await fetchItem(item.id);
        const stats = parseStats(data.tooltip);
        const { sockets, socketBonus } = parseSockets(data.tooltip);
        const q = qualityStr(data.quality);

        let line = `{name:"${data.name}",id:${item.id},q:${q},src:"${item.src}",stats:${JSON.stringify(stats).replace(/"/g, '')}`;
        if (sockets) {
          line += `,sockets:${JSON.stringify(sockets)}`;
          if (socketBonus) line += `,socketBonus:${JSON.stringify(socketBonus).replace(/"/g, '')}`;
        }
        line += '}';
        output.push(line);
        console.log(`  OK: ${data.name} (${item.id})`);
      } catch(e) {
        console.log(`  FAIL: ${item.id} - ${e.message}`);
      }
    }
  }
  return output;
}

async function main() {
  console.log('Processing ret-paladin...');
  const ret = await processSpec('ret-paladin', retItems, existingRet);
  console.log('\nProcessing prot-paladin...');
  const prot = await processSpec('prot-paladin', protItems, existingProt);
  console.log('\nProcessing holy-paladin...');
  const holy = await processSpec('holy-paladin', holyItems, existingHoly);

  const all = [...ret, '', ...prot, '', ...holy].join('\n');
  fs.writeFileSync('_item-additions/paladin.txt', all);
  console.log('\nWrote _item-additions/paladin.txt');
}

main().catch(console.error);
