var STAT_NAMES = {sp:"Spell Power",hit:"Hit Rating",crit:"Crit Rating",int:"Intellect",stam:"Stamina",haste:"Haste",str:"Strength",ap:"Attack Power",agi:"Agility",exp:"Expertise",def:"Defense",dodge:"Dodge",block:"Block Rating",bv:"Block Value",heal:"+Healing",mp5:"MP5",spi:"Spirit",parry:"Parry",arcaneDmg:"Arcane Damage",fireDmg:"Fire Damage",shadowDmg:"Shadow Damage",frostDmg:"Frost Damage",natureDmg:"Nature Damage",holyDmg:"Holy Damage"};

// ---------------------------------------------------------------------------
// Gems Database
// ---------------------------------------------------------------------------
var GEMS = {
  // Meta
  34220:{name:"Chaotic Skyfire Diamond",color:"meta",stats:{crit:12},effect:"+3% crit damage"},
  25893:{name:"Insightful Earthstorm Diamond",color:"meta",stats:{int:12},effect:"Chance to restore mana"},
  25901:{name:"Brutal Earthstorm Diamond",color:"meta",stats:{ap:12},effect:"+3 melee damage"},
  32410:{name:"Thundering Skyfire Diamond",color:"meta",stats:{},effect:"+40 haste proc on hit"},
  // Rare Red
  24030:{name:"Runed Living Ruby",color:"red",stats:{sp:9}},
  24027:{name:"Bold Living Ruby",color:"red",stats:{str:8}},
  24028:{name:"Delicate Living Ruby",color:"red",stats:{agi:8}},
  24036:{name:"Teardrop Living Ruby",color:"red",stats:{heal:18}},
  // Uncommon Red (Blood Garnet)
  23096:{name:"Runed Blood Garnet",color:"red",stats:{sp:7}},
  23095:{name:"Bold Blood Garnet",color:"red",stats:{str:6}},
  23097:{name:"Delicate Blood Garnet",color:"red",stats:{agi:6}},
  23094:{name:"Teardrop Blood Garnet",color:"red",stats:{heal:13}},
  // Rare Orange
  24059:{name:"Potent Noble Topaz",color:"orange",stats:{sp:5,crit:4}},
  24058:{name:"Reckless Noble Topaz",color:"orange",stats:{sp:5,haste:4}},
  24061:{name:"Inscribed Noble Topaz",color:"orange",stats:{str:4,crit:4}},
  31867:{name:"Veiled Noble Topaz",color:"orange",stats:{sp:5,hit:4}},
  31868:{name:"Wicked Noble Topaz",color:"orange",stats:{ap:8,crit:4}},
  // Uncommon Orange (Flame Spessarite)
  23101:{name:"Potent Flame Spessarite",color:"orange",stats:{sp:4,crit:3}},
  23098:{name:"Inscribed Flame Spessarite",color:"orange",stats:{str:3,crit:3}},
  // Rare Yellow
  24048:{name:"Smooth Dawnstone",color:"yellow",stats:{crit:8}},
  24053:{name:"Rigid Dawnstone",color:"yellow",stats:{hit:8}},
  31861:{name:"Great Dawnstone",color:"yellow",stats:{hit:8}},
  24047:{name:"Brilliant Dawnstone",color:"yellow",stats:{int:8}},
  // Uncommon Yellow (Golden Draenite)
  23114:{name:"Gleaming Golden Draenite",color:"yellow",stats:{crit:6}},
  23113:{name:"Brilliant Golden Draenite",color:"yellow",stats:{int:6}},
  23115:{name:"Thick Golden Draenite",color:"yellow",stats:{def:6}},
  // Rare Purple
  24056:{name:"Glowing Nightseye",color:"purple",stats:{sp:5,stam:6}},
  24054:{name:"Sovereign Nightseye",color:"purple",stats:{str:4,stam:6}},
  24055:{name:"Shifting Nightseye",color:"purple",stats:{agi:4,stam:6}},
  31116:{name:"Infused Nightseye",color:"purple",stats:{sp:5,int:4}},
  // Uncommon Purple (Shadow Draenite)
  23108:{name:"Glowing Shadow Draenite",color:"purple",stats:{sp:4,stam:4}},
  23109:{name:"Sovereign Shadow Draenite",color:"purple",stats:{str:3,stam:4}},
  23110:{name:"Shifting Shadow Draenite",color:"purple",stats:{agi:3,stam:4}},
  // Rare Blue
  24033:{name:"Solid Star of Elune",color:"blue",stats:{stam:12}},
  24039:{name:"Lustrous Star of Elune",color:"blue",stats:{mp5:4}},
  // Uncommon Blue (Azure Moonstone)
  23118:{name:"Solid Azure Moonstone",color:"blue",stats:{stam:9}},
  23119:{name:"Lustrous Azure Moonstone",color:"blue",stats:{mp5:3}},
  // Rare Green
  24066:{name:"Dazzling Talasite",color:"green",stats:{int:4,mp5:2}},
  24065:{name:"Enduring Talasite",color:"green",stats:{def:4,stam:6}},
  30608:{name:"Forceful Talasite",color:"green",stats:{haste:4,stam:6}},
  33782:{name:"Steady Talasite",color:"green",stats:{res:4,stam:6}},
  // Uncommon Green (Deep Peridot)
  23104:{name:"Jagged Deep Peridot",color:"green",stats:{crit:3,stam:4}},
  23105:{name:"Enduring Deep Peridot",color:"green",stats:{def:3,stam:4}}
};

var GEM_FITS = {
  red:["red","orange","purple"],
  yellow:["yellow","orange","green"],
  blue:["blue","purple","green"],
  meta:["meta"]
};
function gemFits(gemColor, socketColor) {
  return (GEM_FITS[socketColor] || []).indexOf(gemColor) !== -1;
}

// Item-link enchant ID → our ENCHANTS spell ID mapping
// Item links use SpellItemEnchantment IDs which differ from spell IDs
var ENCHANT_LINK_MAP = {
  // Head (Glyphs)
  3001:29189, // Glyph of Renewal
  3002:29192, // Glyph of Ferocity
  2997:29186, // Glyph of the Defender
  3003:29191, // Glyph of Power
  // Shoulders (Inscriptions — Greater = Exalted, Lesser = Honored)
  2982:28886, // Greater Inscription of Discipline (Aldor Exalted)
  2986:28909, // Greater Inscription of the Oracle (Aldor Exalted)
  2983:28888, // Greater Inscription of the Blade (Aldor Exalted)
  2984:28889, // Greater Inscription of the Knight (Aldor Exalted)
  2995:23545, // Greater Inscription of Vengeance (Scryer Exalted)
  2996:23547, // Greater Inscription of the Orb (Scryer Exalted)
  2981:28881, // Inscription of Discipline (Aldor Honored)
  2978:28885, // Inscription of Vengeance (Aldor Honored)
  2979:28882, // Inscription of Warding (Aldor Honored)
  2990:28903, // Inscription of the Orb (Scryer Honored)
  2991:28907, // Inscription of the Blade (Scryer Honored)
  2989:28904, // Inscription of the Oracle (Scryer Honored)
  // Back
  2621:25084, // Subtlety
  2938:34004, // Spell Penetration
  2622:34003, // Greater Agility
  // Chest
  2661:27960, // Exceptional Stats
  2659:33990, // Major Spirit
  3233:46594, // Defense
  // Wrists
  2650:27917, // Spellpower
  2654:34001, // Major Intellect
  2647:27914, // Fortitude
  2648:34002, // Assault
  // Hands
  2937:33997, // Major Spellpower
  2564:33995, // Major Strength
  2614:25080, // Superior Agility
  2613:33996, // Assault
  // Legs
  2748:31372, // Runic Spellthread
  2745:29535, // Nethercobra Leg Armor
  2746:29536, // Nethercleft Leg Armor
  2747:31373, // Mystic Spellthread
  // Feet
  2940:34007, // Cat's Swiftness
  2657:34008, // Boar's Speed
  2649:27951, // Dexterity
  2656:27954, // Vitality
  // Weapon
  2669:27975, // Major Spellpower
  2673:27984, // Mongoose
  1900:20034, // Crusader
  2670:46538, // Greater Agility (1H)
  2667:27967, // Major Striking
  // 2H Weapon
  2671:27977, // Major Agility (2H) -- actually Sunfire, needs verify
  // Rings
  2928:27927, // Spellpower
  2929:27926, // Healing Power
  2930:27924, // Stats
};

// ---------------------------------------------------------------------------
// Enchants Database
// ---------------------------------------------------------------------------
var ENCHANTS = {
  head:[
    {id:29191,name:"Glyph of Power",stats:{sp:22,hit:14},src:"Sha'tar - Revered"},
    {id:29192,name:"Glyph of Ferocity",stats:{ap:34,hit:16},src:"Cenarion Expedition - Revered"},
    {id:29186,name:"Glyph of the Defender",stats:{def:16,dodge:17},src:"Keepers of Time - Revered"},
    {id:29189,name:"Glyph of Renewal",stats:{heal:35,sp:12,mp5:7},src:"Honor Hold/Thrallmar - Revered"}
  ],
  shoulders:[
    {id:28886,name:"Greater Inscription of Discipline",stats:{sp:18,crit:10},src:"Aldor - Exalted"},
    {id:28909,name:"Greater Inscription of the Oracle",stats:{heal:33,mp5:4},src:"Aldor - Exalted"},
    {id:28888,name:"Greater Inscription of the Blade",stats:{ap:20,crit:15},src:"Aldor - Exalted"},
    {id:28889,name:"Greater Inscription of the Knight",stats:{def:15,dodge:10},src:"Aldor - Exalted"},
    {id:23545,name:"Greater Inscription of Vengeance",stats:{ap:30,crit:10},src:"Scryer - Exalted"},
    {id:23547,name:"Greater Inscription of the Orb",stats:{sp:12,crit:15},src:"Scryer - Exalted"},
    {id:28881,name:"Inscription of Discipline",stats:{sp:15},src:"Aldor - Honored"},
    {id:28885,name:"Inscription of Vengeance",stats:{ap:26},src:"Aldor - Honored"},
    {id:28882,name:"Inscription of Warding",stats:{dodge:13},src:"Aldor - Honored"},
    {id:28903,name:"Inscription of the Orb",stats:{crit:13},src:"Scryer - Honored"},
    {id:28907,name:"Inscription of the Blade",stats:{crit:13},src:"Scryer - Honored"},
    {id:28904,name:"Inscription of the Oracle",stats:{mp5:5},src:"Scryer - Honored"}
  ],
  back:[
    {id:25084,name:"Enchant Cloak - Subtlety",stats:{},src:"Enchanting",note:"-2% threat"},
    {id:34004,name:"Enchant Cloak - Spell Penetration",stats:{},src:"Enchanting"},
    {id:34003,name:"Enchant Cloak - Greater Agility",stats:{agi:12},src:"Enchanting"}
  ],
  chest:[
    {id:27960,name:"Exceptional Stats",stats:{str:6,agi:6,int:6,stam:6,spi:6},src:"Enchanting"},
    {id:33990,name:"Major Spirit",stats:{spi:15},src:"Enchanting"},
    {id:46594,name:"Defense",stats:{def:15},src:"Enchanting"}
  ],
  wrists:[
    {id:27917,name:"Enchant Bracer - Spellpower",stats:{sp:15},src:"Enchanting"},
    {id:34001,name:"Enchant Bracer - Major Intellect",stats:{int:12},src:"Enchanting"},
    {id:27914,name:"Enchant Bracer - Fortitude",stats:{stam:12},src:"Enchanting"},
    {id:34002,name:"Enchant Bracer - Assault",stats:{ap:24},src:"Enchanting"}
  ],
  hands:[
    {id:33997,name:"Major Spellpower",stats:{sp:20},src:"Enchanting"},
    {id:33995,name:"Major Strength",stats:{str:15},src:"Enchanting"},
    {id:25080,name:"Superior Agility",stats:{agi:15},src:"Enchanting"},
    {id:33996,name:"Assault",stats:{ap:26},src:"Enchanting"}
  ],
  waist:[],
  legs:[
    {id:31372,name:"Runic Spellthread",stats:{sp:35,stam:20},src:"Scryer/Aldor - Exalted"},
    {id:29535,name:"Nethercobra Leg Armor",stats:{ap:50,crit:12},src:"Leatherworking"},
    {id:29536,name:"Nethercleft Leg Armor",stats:{stam:40,agi:12},src:"Leatherworking"},
    {id:31373,name:"Mystic Spellthread",stats:{sp:25,stam:15},src:"Tailoring"}
  ],
  feet:[
    {id:34007,name:"Cat's Swiftness",stats:{agi:6},src:"Enchanting",note:"+8% run speed"},
    {id:34008,name:"Boar's Speed",stats:{stam:9},src:"Enchanting",note:"+8% run speed"},
    {id:27951,name:"Dexterity",stats:{agi:12},src:"Enchanting"},
    {id:27954,name:"Vitality",stats:{},src:"Enchanting",note:"+4 hp/mp5"}
  ],
  mainhand:[
    {id:27975,name:"Major Spellpower",stats:{sp:40},src:"Enchanting"},
    {id:27984,name:"Mongoose",stats:{},src:"Enchanting",note:"Agi+haste proc"},
    {id:20034,name:"Crusader",stats:{},src:"Enchanting",note:"+100 str proc"},
    {id:46538,name:"Greater Agility",stats:{agi:20},src:"Enchanting"},
    {id:27967,name:"Major Striking",stats:{},src:"Enchanting",note:"+7 weapon damage"}
  ],
  twohand:[
    {id:27977,name:"Major Agility",stats:{agi:35},src:"Enchanting"},
    {id:27975,name:"Major Spellpower",stats:{sp:40},src:"Enchanting"},
    {id:20036,name:"Major Intellect",stats:{int:30},src:"Enchanting"}
  ],
  offhand:[],
  ring1:[
    {id:27927,name:"Spellpower",stats:{sp:12},src:"Enchanting (360+)"},
    {id:27926,name:"Healing Power",stats:{heal:20},src:"Enchanting (360+)"},
    {id:27924,name:"Stats",stats:{str:4,agi:4,int:4,stam:4,spi:4},src:"Enchanting (360+)"}
  ],
  ring2:"ring1"
};

// ---------------------------------------------------------------------------
// BiS Gem Recommendations (per spec)
// ---------------------------------------------------------------------------
var BIS_GEMS = {
  "fire-mage":{meta:34220,red:24030,yellow:31867,blue:24056},
  "arcane-mage":{meta:34220,red:24030,yellow:31867,blue:24056},
  "frost-mage":{meta:34220,red:24030,yellow:31867,blue:24056},
  "shadow-priest":{meta:34220,red:24030,yellow:31867,blue:24056},
  "holy-priest":{meta:25893,red:24036,yellow:24066,blue:24039},
  "discipline-priest":{meta:25893,red:24036,yellow:24066,blue:24039},
  "affliction-warlock":{meta:34220,red:24030,yellow:31867,blue:24056},
  "destruction-warlock":{meta:34220,red:24030,yellow:31867,blue:24056},
  "demonology-warlock":{meta:34220,red:24030,yellow:31867,blue:24056},
  "elemental-shaman":{meta:34220,red:24030,yellow:31867,blue:24056},
  "enhancement-shaman":{meta:25901,red:24028,yellow:31868,blue:24055},
  "resto-shaman":{meta:25893,red:24036,yellow:24066,blue:24039},
  "balance-druid":{meta:34220,red:24030,yellow:31867,blue:24056},
  "resto-druid":{meta:25893,red:24036,yellow:24066,blue:24039},
  "feral-cat-druid":{meta:25901,red:24028,yellow:31868,blue:24055},
  "feral-bear-druid":{meta:25901,red:24028,yellow:24065,blue:24033},
  "fury-warrior":{meta:25901,red:24027,yellow:31868,blue:24054},
  "arms-warrior":{meta:25901,red:24027,yellow:31868,blue:24054},
  "prot-warrior":{meta:25901,red:24028,yellow:24065,blue:24033},
  "ret-paladin":{meta:25901,red:24027,yellow:31868,blue:24054},
  "prot-paladin":{meta:25893,red:24028,yellow:24065,blue:24033},
  "holy-paladin":{meta:25893,red:24036,yellow:24066,blue:24039},
  "combat-rogue":{meta:25901,red:24028,yellow:31868,blue:24055},
  "assassination-rogue":{meta:25901,red:24028,yellow:31868,blue:24055},
  "bm-hunter":{meta:25901,red:24028,yellow:31868,blue:24055},
  "mm-hunter":{meta:25901,red:24028,yellow:31868,blue:24055},
  "survival-hunter":{meta:25901,red:24028,yellow:31868,blue:24055}
};

// ---------------------------------------------------------------------------
// BiS Enchant Recommendations (per spec)
// ---------------------------------------------------------------------------
var BIS_ENCHANTS = {
  "fire-mage":{head:29191,shoulders:28886,back:25084,chest:27960,wrists:27917,hands:33997,legs:31372,feet:34007,mainhand:27975,twohand:27975,ring1:27927,ring2:27927},
  "arcane-mage":{head:29191,shoulders:28886,back:25084,chest:27960,wrists:27917,hands:33997,legs:31372,feet:34007,mainhand:27975,twohand:27975,ring1:27927,ring2:27927},
  "frost-mage":{head:29191,shoulders:28886,back:25084,chest:27960,wrists:27917,hands:33997,legs:31372,feet:34007,mainhand:27975,ring1:27927,ring2:27927},
  "shadow-priest":{head:29191,shoulders:28886,back:25084,chest:27960,wrists:27917,hands:33997,legs:31372,feet:34007,mainhand:27975,ring1:27927,ring2:27927},
  "holy-priest":{head:29189,shoulders:28909,back:25084,chest:27960,wrists:27917,hands:33997,legs:31372,feet:34007,mainhand:27975,ring1:27926,ring2:27926},
  "discipline-priest":{head:29189,shoulders:28909,back:25084,chest:27960,wrists:27917,hands:33997,legs:31372,feet:34007,mainhand:27975,ring1:27926,ring2:27926},
  "affliction-warlock":{head:29191,shoulders:28886,back:25084,chest:27960,wrists:27917,hands:33997,legs:31372,feet:34007,mainhand:27975,ring1:27927,ring2:27927},
  "destruction-warlock":{head:29191,shoulders:28886,back:25084,chest:27960,wrists:27917,hands:33997,legs:31372,feet:34007,mainhand:27975,ring1:27927,ring2:27927},
  "demonology-warlock":{head:29191,shoulders:28886,back:25084,chest:27960,wrists:27917,hands:33997,legs:31372,feet:34007,mainhand:27975,ring1:27927,ring2:27927},
  "elemental-shaman":{head:29191,shoulders:28886,back:25084,chest:27960,wrists:27917,hands:33997,legs:31372,feet:34007,mainhand:27975},
  "enhancement-shaman":{head:29192,shoulders:28888,back:34003,chest:27960,wrists:34002,hands:33996,legs:29535,feet:34007,mainhand:27984,offhand:27984},
  "resto-shaman":{head:29189,shoulders:28909,back:25084,chest:27960,wrists:27917,hands:33997,legs:31372,feet:34007,mainhand:27975},
  "balance-druid":{head:29191,shoulders:28886,back:25084,chest:27960,wrists:27917,hands:33997,legs:31372,feet:34007,mainhand:27975,twohand:27975,ring1:27927,ring2:27927},
  "resto-druid":{head:29189,shoulders:28909,back:25084,chest:27960,wrists:27917,hands:33997,legs:31372,feet:34007,mainhand:27975,ring1:27926,ring2:27926},
  "feral-cat-druid":{head:29192,shoulders:28888,back:34003,chest:27960,wrists:34002,hands:25080,legs:29535,feet:34007,twohand:27984},
  "feral-bear-druid":{head:29186,shoulders:28889,back:34003,chest:46594,wrists:27914,hands:25080,legs:29536,feet:34008,twohand:27984},
  "fury-warrior":{head:29192,shoulders:28888,back:34003,chest:27960,wrists:34002,hands:33995,legs:29535,feet:34007,mainhand:27984,offhand:27984},
  "arms-warrior":{head:29192,shoulders:28888,back:34003,chest:27960,wrists:34002,hands:33995,legs:29535,feet:34007,twohand:27977},
  "prot-warrior":{head:29186,shoulders:28889,back:34003,chest:46594,wrists:27914,hands:25080,legs:29536,feet:34008,mainhand:27984},
  "ret-paladin":{head:29192,shoulders:28888,back:34003,chest:27960,wrists:34002,hands:33995,legs:29535,feet:34007,twohand:27977},
  "prot-paladin":{head:29186,shoulders:28889,back:34003,chest:46594,wrists:27914,hands:33997,legs:29536,feet:34008,mainhand:27975},
  "holy-paladin":{head:29189,shoulders:28909,back:25084,chest:27960,wrists:27917,hands:33997,legs:31372,feet:34007,mainhand:27975,ring1:27926,ring2:27926},
  "combat-rogue":{head:29192,shoulders:23545,back:34003,chest:27960,wrists:34002,hands:25080,legs:29535,feet:34007,mainhand:27984,offhand:27984},
  "assassination-rogue":{head:29192,shoulders:23545,back:34003,chest:27960,wrists:34002,hands:25080,legs:29535,feet:34007,mainhand:27984,offhand:27984},
  "bm-hunter":{head:29192,shoulders:23545,back:34003,chest:27960,wrists:34002,hands:25080,legs:29535,feet:34007,twohand:27977},
  "mm-hunter":{head:29192,shoulders:23545,back:34003,chest:27960,wrists:34002,hands:25080,legs:29535,feet:34007,twohand:27977},
  "survival-hunter":{head:29192,shoulders:23545,back:34003,chest:27960,wrists:34002,hands:25080,legs:29535,feet:34007,twohand:27977}
};
