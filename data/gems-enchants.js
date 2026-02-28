var STAT_NAMES = {sp:"Spell Power",hit:"Hit Rating",crit:"Crit Rating",int:"Intellect",stam:"Stamina",haste:"Haste",str:"Strength",ap:"Attack Power",agi:"Agility",exp:"Expertise",def:"Defense",dodge:"Dodge",block:"Block Rating",bv:"Block Value",heal:"+Healing",mp5:"MP5",spi:"Spirit",parry:"Parry",arcaneDmg:"Arcane Damage",fireDmg:"Fire Damage",shadowDmg:"Shadow Damage",frostDmg:"Frost Damage",natureDmg:"Nature Damage",holyDmg:"Holy Damage"};

// ---------------------------------------------------------------------------
// Gems Database
// ---------------------------------------------------------------------------
var GEMS = {
  // ===== META GEMS =====
  34220:{name:"Chaotic Skyfire Diamond",color:"meta",stats:{crit:12},effect:"+3% crit damage"},
  25901:{name:"Insightful Earthstorm Diamond",color:"meta",stats:{int:12},effect:"Chance to restore mana on spellcast"},
  25899:{name:"Brutal Earthstorm Diamond",color:"meta",stats:{},effect:"+3 melee damage, chance to stun"},
  32410:{name:"Thundering Skyfire Diamond",color:"meta",stats:{},effect:"+240 haste proc on melee/ranged hit"},
  25890:{name:"Destructive Skyfire Diamond",color:"meta",stats:{crit:14},effect:"1% spell reflect"},
  25893:{name:"Mystical Skyfire Diamond",color:"meta",stats:{},effect:"Chance to increase spell cast speed"},
  25894:{name:"Swift Skyfire Diamond",color:"meta",stats:{ap:24},effect:"Minor run speed increase"},
  25895:{name:"Enigmatic Skyfire Diamond",color:"meta",stats:{crit:12},effect:"5% snare/root resist"},
  25896:{name:"Powerful Earthstorm Diamond",color:"meta",stats:{stam:18},effect:"5% stun resist"},
  25897:{name:"Bracing Earthstorm Diamond",color:"meta",stats:{heal:26,sp:9},effect:"2% reduced threat"},
  25898:{name:"Tenacious Earthstorm Diamond",color:"meta",stats:{def:12},effect:"Chance to restore health on hit"},
  32409:{name:"Relentless Earthstorm Diamond",color:"meta",stats:{agi:12},effect:"+3% crit damage"},
  35501:{name:"Eternal Earthstorm Diamond",color:"meta",stats:{def:12},effect:"+10% shield block value"},
  35503:{name:"Ember Skyfire Diamond",color:"meta",stats:{sp:14},effect:"+2% intellect"},
  // ===== RARE RED (Living Ruby) =====
  24030:{name:"Runed Living Ruby",color:"red",stats:{sp:9}},
  24027:{name:"Bold Living Ruby",color:"red",stats:{str:8}},
  24028:{name:"Delicate Living Ruby",color:"red",stats:{agi:8}},
  24029:{name:"Teardrop Living Ruby",color:"red",stats:{heal:18}},
  24031:{name:"Bright Living Ruby",color:"red",stats:{ap:16}},
  24032:{name:"Subtle Living Ruby",color:"red",stats:{dodge:8}},
  24036:{name:"Flashing Living Ruby",color:"red",stats:{parry:8}},
  // ===== UNCOMMON RED (Blood Garnet) =====
  23096:{name:"Runed Blood Garnet",color:"red",stats:{sp:7}},
  23095:{name:"Bold Blood Garnet",color:"red",stats:{str:6}},
  23097:{name:"Delicate Blood Garnet",color:"red",stats:{agi:6}},
  23094:{name:"Teardrop Blood Garnet",color:"red",stats:{heal:13}},
  28595:{name:"Bright Blood Garnet",color:"red",stats:{ap:12}},
  // ===== RARE ORANGE (Noble Topaz) =====
  24059:{name:"Potent Noble Topaz",color:"orange",stats:{sp:5,crit:4}},
  24058:{name:"Inscribed Noble Topaz",color:"orange",stats:{str:4,crit:4}},
  24061:{name:"Glinting Noble Topaz",color:"orange",stats:{agi:4,hit:4}},
  24060:{name:"Luminous Noble Topaz",color:"orange",stats:{heal:9,sp:3,int:4}},
  31867:{name:"Veiled Noble Topaz",color:"orange",stats:{sp:5,hit:4}},
  31868:{name:"Wicked Noble Topaz",color:"orange",stats:{ap:8,crit:4}},
  35316:{name:"Reckless Noble Topaz",color:"orange",stats:{sp:5,haste:4}},
  // ===== UNCOMMON ORANGE (Flame Spessarite) =====
  23101:{name:"Potent Flame Spessarite",color:"orange",stats:{sp:4,crit:3}},
  23098:{name:"Inscribed Flame Spessarite",color:"orange",stats:{str:3,crit:3}},
  23100:{name:"Glinting Flame Spessarite",color:"orange",stats:{agi:3,hit:3}},
  23099:{name:"Luminous Flame Spessarite",color:"orange",stats:{heal:7,sp:3,int:3}},
  31866:{name:"Veiled Flame Spessarite",color:"orange",stats:{sp:4,hit:3}},
  31869:{name:"Wicked Flame Spessarite",color:"orange",stats:{ap:6,crit:3}},
  // ===== RARE YELLOW (Dawnstone) =====
  24048:{name:"Smooth Dawnstone",color:"yellow",stats:{crit:8}},
  24051:{name:"Rigid Dawnstone",color:"yellow",stats:{hit:8}},
  31861:{name:"Great Dawnstone",color:"yellow",stats:{hit:8}},
  24047:{name:"Brilliant Dawnstone",color:"yellow",stats:{int:8}},
  24050:{name:"Gleaming Dawnstone",color:"yellow",stats:{crit:8}},
  24052:{name:"Thick Dawnstone",color:"yellow",stats:{def:8}},
  24053:{name:"Mystic Dawnstone",color:"yellow",stats:{res:8}},
  35315:{name:"Quick Dawnstone",color:"yellow",stats:{haste:8}},
  // ===== UNCOMMON YELLOW (Golden Draenite) =====
  23114:{name:"Gleaming Golden Draenite",color:"yellow",stats:{crit:6}},
  23113:{name:"Brilliant Golden Draenite",color:"yellow",stats:{int:6}},
  23115:{name:"Thick Golden Draenite",color:"yellow",stats:{def:6}},
  23116:{name:"Rigid Golden Draenite",color:"yellow",stats:{hit:6}},
  28290:{name:"Smooth Golden Draenite",color:"yellow",stats:{crit:6}},
  31860:{name:"Great Golden Draenite",color:"yellow",stats:{hit:6}},
  // ===== RARE BLUE (Star of Elune) =====
  24033:{name:"Solid Star of Elune",color:"blue",stats:{stam:12}},
  24037:{name:"Lustrous Star of Elune",color:"blue",stats:{mp5:3}},
  24035:{name:"Sparkling Star of Elune",color:"blue",stats:{spi:8}},
  24039:{name:"Stormy Star of Elune",color:"blue",stats:{}},
  // ===== UNCOMMON BLUE (Azure Moonstone) =====
  23118:{name:"Solid Azure Moonstone",color:"blue",stats:{stam:9}},
  23121:{name:"Lustrous Azure Moonstone",color:"blue",stats:{mp5:2}},
  23119:{name:"Sparkling Azure Moonstone",color:"blue",stats:{spi:6}},
  23120:{name:"Stormy Azure Moonstone",color:"blue",stats:{}},
  // ===== RARE PURPLE (Nightseye) =====
  24056:{name:"Glowing Nightseye",color:"purple",stats:{sp:5,stam:6}},
  24054:{name:"Sovereign Nightseye",color:"purple",stats:{str:4,stam:6}},
  24055:{name:"Shifting Nightseye",color:"purple",stats:{agi:4,stam:6}},
  24057:{name:"Royal Nightseye",color:"purple",stats:{heal:9,sp:3,mp5:2}},
  31863:{name:"Balanced Nightseye",color:"purple",stats:{ap:8,stam:6}},
  31865:{name:"Infused Nightseye",color:"purple",stats:{ap:8,mp5:2}},
  35707:{name:"Regal Nightseye",color:"purple",stats:{dodge:4,stam:6}},
  // ===== UNCOMMON PURPLE (Shadow Draenite) =====
  23108:{name:"Glowing Shadow Draenite",color:"purple",stats:{sp:4,stam:4}},
  23111:{name:"Sovereign Shadow Draenite",color:"purple",stats:{str:3,stam:4}},
  23110:{name:"Shifting Shadow Draenite",color:"purple",stats:{agi:3,stam:4}},
  23109:{name:"Royal Shadow Draenite",color:"purple",stats:{heal:7,sp:3,mp5:1}},
  31862:{name:"Balanced Shadow Draenite",color:"purple",stats:{ap:6,stam:4}},
  31864:{name:"Infused Shadow Draenite",color:"purple",stats:{ap:6,mp5:1}},
  // ===== RARE GREEN (Talasite) =====
  24065:{name:"Dazzling Talasite",color:"green",stats:{int:4,mp5:2}},
  24062:{name:"Enduring Talasite",color:"green",stats:{def:4,stam:6}},
  35318:{name:"Forceful Talasite",color:"green",stats:{haste:4,stam:6}},
  33782:{name:"Steady Talasite",color:"green",stats:{res:4,stam:6}},
  24066:{name:"Radiant Talasite",color:"green",stats:{crit:4}},
  24067:{name:"Jagged Talasite",color:"green",stats:{crit:4,stam:6}},
  // ===== UNCOMMON GREEN (Deep Peridot) =====
  23104:{name:"Jagged Deep Peridot",color:"green",stats:{crit:3,stam:4}},
  23105:{name:"Enduring Deep Peridot",color:"green",stats:{def:3,stam:4}},
  23106:{name:"Dazzling Deep Peridot",color:"green",stats:{int:3,mp5:1}},
  23103:{name:"Radiant Deep Peridot",color:"green",stats:{crit:3}}
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
    {id:33996,name:"Assault",stats:{ap:26},src:"Enchanting"},
    {id:33993,name:"Blasting",stats:{crit:10},src:"Enchanting"},
    {id:33994,name:"Spell Strike",stats:{hit:15},src:"Enchanting"}
  ],
  waist:[],
  legs:[
    {id:31372,name:"Runic Spellthread",stats:{sp:35,stam:20},src:"Scryer/Aldor - Exalted"},
    {id:29535,name:"Nethercobra Leg Armor",stats:{ap:50,crit:12},src:"Leatherworking"},
    {id:29536,name:"Nethercleft Leg Armor",stats:{stam:40,agi:12},src:"Leatherworking"},
    {id:31373,name:"Mystic Spellthread",stats:{sp:25,stam:15},src:"Tailoring"},
    {id:29533,name:"Cobrahide Leg Armor",stats:{ap:40,crit:10},src:"Leatherworking"},
    {id:29534,name:"Clefthide Leg Armor",stats:{stam:30,agi:10},src:"Leatherworking"}
  ],
  feet:[
    {id:34007,name:"Cat's Swiftness",stats:{agi:6},src:"Enchanting",note:"+8% run speed"},
    {id:34008,name:"Boar's Speed",stats:{stam:9},src:"Enchanting",note:"+8% run speed"},
    {id:27951,name:"Dexterity",stats:{agi:12},src:"Enchanting"},
    {id:27948,name:"Vitality",stats:{mp5:4},src:"Enchanting",note:"+4 hp5 too"},
    {id:27954,name:"Surefooted",stats:{hit:10},src:"Enchanting",note:"+5% root/snare resist"}
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
  "holy-priest":{meta:25901,red:24029,yellow:24065,blue:24037},
  "discipline-priest":{meta:25901,red:24029,yellow:24065,blue:24037},
  "affliction-warlock":{meta:34220,red:24030,yellow:31867,blue:24056},
  "destruction-warlock":{meta:34220,red:24030,yellow:31867,blue:24056},
  "demonology-warlock":{meta:34220,red:24030,yellow:31867,blue:24056},
  "elemental-shaman":{meta:34220,red:24030,yellow:31867,blue:24056},
  "enhancement-shaman":{meta:32409,red:24028,yellow:31868,blue:24055},
  "resto-shaman":{meta:25901,red:24029,yellow:24065,blue:24037},
  "balance-druid":{meta:34220,red:24030,yellow:31867,blue:24056},
  "resto-druid":{meta:25901,red:24029,yellow:24065,blue:24037},
  "feral-cat-druid":{meta:32409,red:24028,yellow:31868,blue:24055},
  "feral-bear-druid":{meta:25896,red:24028,yellow:24062,blue:24033},
  "fury-warrior":{meta:32409,red:24027,yellow:31868,blue:24054},
  "arms-warrior":{meta:32409,red:24027,yellow:31868,blue:24054},
  "prot-warrior":{meta:25896,red:24028,yellow:24062,blue:24033},
  "ret-paladin":{meta:32409,red:24027,yellow:31868,blue:24054},
  "prot-paladin":{meta:25901,red:24028,yellow:24062,blue:24033},
  "holy-paladin":{meta:25901,red:24029,yellow:24065,blue:24037},
  "combat-rogue":{meta:32409,red:24028,yellow:31868,blue:24055},
  "assassination-rogue":{meta:32409,red:24028,yellow:31868,blue:24055},
  "bm-hunter":{meta:32409,red:24028,yellow:31868,blue:24055},
  "mm-hunter":{meta:32409,red:24028,yellow:31868,blue:24055},
  "survival-hunter":{meta:32409,red:24028,yellow:31868,blue:24055}
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

// ---------------------------------------------------------------------------
// Budget Mode Maps — Rare → Uncommon gems, Exalted → Honored enchants
// ---------------------------------------------------------------------------
var BUDGET_GEM_MAP = {
  // Red: Living Ruby → Blood Garnet
  24030: 23096,  // Runed: sp:9 → sp:7
  24027: 23095,  // Bold: str:8 → str:6
  24028: 23097,  // Delicate: agi:8 → agi:6
  24029: 23094,  // Teardrop: heal:18 → heal:13
  // Orange: Noble Topaz → Flame Spessarite
  24059: 23101,  // Potent: sp:5,crit:4 → sp:4,crit:3
  24058: 23098,  // Inscribed: str:4,crit:4 → str:3,crit:3
  // Yellow: Dawnstone → Golden Draenite
  24048: 23114,  // Smooth: crit:8 → crit:6
  24047: 23113,  // Brilliant: int:8 → int:6
  // Blue: Star of Elune → Azure Moonstone
  24033: 23118,  // Solid: stam:12 → stam:9
  24037: 23121,  // Lustrous: mp5:3 → mp5:2
  // Purple: Nightseye → Shadow Draenite
  24056: 23108,  // Glowing: sp:5,stam:6 → sp:4,stam:4
  24054: 23111,  // Sovereign: str:4,stam:6 → str:3,stam:4
  24055: 23110,  // Shifting: agi:4,stam:6 → agi:3,stam:4
  // Green: Talasite → Deep Peridot
  24062: 23105   // Enduring: def:4,stam:6 → def:3,stam:4
};

var BUDGET_ENCHANT_MAP = {
  // Shoulders: Exalted → Honored (same stat type)
  28886: 28881,  // Greater Insc. of Discipline → Insc. of Discipline
  28909: 28881,  // Greater Insc. of the Oracle → Insc. of Discipline
  28888: 28885,  // Greater Insc. of the Blade → Insc. of Vengeance
  28889: 28882,  // Greater Insc. of the Knight → Insc. of Warding
  23545: 28885,  // Greater Insc. of Vengeance → Insc. of Vengeance
  23547: 28903,  // Greater Insc. of the Orb → Insc. of the Orb
  // Legs: expensive → budget
  31372: 31373,  // Runic Spellthread → Mystic Spellthread
  29535: 29533,  // Nethercobra Leg Armor → Cobrahide Leg Armor
  29536: 29534,  // Nethercleft Leg Armor → Clefthide Leg Armor
  // Feet: handled by price-based system (spec-aware via stat weights)
  // Weapon: expensive → cheaper
  27984: 46538,  // Mongoose (proc) → Greater Agility (agi:20)
  // Rings: skip entirely (require 360 Enchanting)
  27927: null,   // Spellpower → skip
  27926: null,   // Healing Power → skip
  27924: null    // Stats → skip
};

// ---------------------------------------------------------------------------
// Enchant Cost Data — vendor gold, tradeable items, or crafting materials
// Material IDs: 22445=Arcane Dust, 22446=Greater Planar Essence,
//   22447=Lesser Planar Essence, 22448=Small Prismatic Shard,
//   22449=Large Prismatic Shard, 22450=Void Crystal,
//   22451=Primal Air, 22452=Primal Earth, 22456=Primal Shadow,
//   22457=Primal Mana, 21884=Primal Fire, 21885=Primal Water
// Verified against Wowhead spell tooltips (Feb 2026)
// ---------------------------------------------------------------------------
var ENCHANT_COSTS = {
  // --- VENDOR: Head Glyphs (rep vendors, fixed gold) ---
  29191: {type:"vendor",gold:100},  // Glyph of Power
  29192: {type:"vendor",gold:100},  // Glyph of Ferocity
  29186: {type:"vendor",gold:100},  // Glyph of the Defender
  29189: {type:"vendor",gold:100},  // Glyph of Renewal

  // --- VENDOR: Shoulder Inscriptions ---
  28886: {type:"vendor",gold:100},  // Greater Insc. of Discipline (Aldor Exalted)
  28909: {type:"vendor",gold:100},  // Greater Insc. of the Oracle
  28888: {type:"vendor",gold:100},  // Greater Insc. of the Blade
  28889: {type:"vendor",gold:100},  // Greater Insc. of the Knight
  23545: {type:"vendor",gold:100},  // Greater Insc. of Vengeance (Scryer Exalted)
  23547: {type:"vendor",gold:100},  // Greater Insc. of the Orb
  28881: {type:"vendor",gold:20},   // Insc. of Discipline (Honored)
  28885: {type:"vendor",gold:20},   // Insc. of Vengeance (Honored)
  28882: {type:"vendor",gold:20},   // Insc. of Warding (Honored)
  28903: {type:"vendor",gold:20},   // Insc. of the Orb (Honored)
  28907: {type:"vendor",gold:20},   // Insc. of the Blade (Honored)
  28904: {type:"vendor",gold:20},   // Insc. of the Oracle (Honored)

  // --- ITEM: Leg Armors/Spellthreads (tradeable on AH) ---
  31372: {type:"item",itemId:24274}, // Runic Spellthread
  31373: {type:"item",itemId:24273}, // Mystic Spellthread
  29535: {type:"item",itemId:29535}, // Nethercobra Leg Armor
  29536: {type:"item",itemId:29536}, // Nethercleft Leg Armor
  29533: {type:"item",itemId:29533}, // Cobrahide Leg Armor
  29534: {type:"item",itemId:29534}, // Clefthide Leg Armor

  // --- MATS: Enchanting recipes ---
  // Back
  25084: {type:"mats",mats:[[22448,4],[22446,2],[22456,8]]},     // Subtlety
  34004: {type:"mats",mats:[[22446,2],[22445,6],[22457,2]]},     // Spell Penetration
  34003: {type:"mats",mats:[[22446,1],[22445,4],[22451,1]]},     // Greater Agility
  // Chest
  27960: {type:"mats",mats:[[22449,4],[22446,4],[22445,4]]},     // Exceptional Stats
  33990: {type:"mats",mats:[[22446,2]]},                         // Major Spirit
  46594: {type:"mats",mats:[[22446,4],[22445,8]]},               // Defense
  // Wrists
  27917: {type:"mats",mats:[[22449,6],[21884,6],[21885,6]]},     // Spellpower
  34001: {type:"mats",mats:[[22447,3]]},                         // Major Intellect
  27914: {type:"mats",mats:[[22449,1],[22446,10],[22445,20]]},   // Fortitude
  34002: {type:"mats",mats:[[22445,6]]},                         // Assault
  // Hands
  33997: {type:"mats",mats:[[22446,6],[22449,6],[22457,6]]},     // Major Spellpower
  33995: {type:"mats",mats:[[22445,12],[22446,1]]},              // Major Strength
  25080: {type:"mats",mats:[[22448,3],[22446,3],[22451,2]]},     // Superior Agility
  33996: {type:"mats",mats:[[22445,8]]},                         // Assault (hands)
  33993: {type:"mats",mats:[[22447,1],[22445,4]]},               // Blasting (hands)
  33994: {type:"mats",mats:[[22446,8],[22445,2],[22449,2]]},     // Spell Strike (hands)
  // Feet
  34007: {type:"mats",mats:[[22449,8],[22451,8]]},               // Cat's Swiftness
  34008: {type:"mats",mats:[[22449,8],[22452,8]]},               // Boar's Speed
  27951: {type:"mats",mats:[[22446,8],[22445,8]]},               // Dexterity
  27948: {type:"mats",mats:[[22445,6]]},                         // Vitality (+ 4 potions, ~vendor cost)
  27954: {type:"mats",mats:[[22450,2],[22449,4],[23572,1]]},     // Surefooted
  // Mainhand weapon
  27975: {type:"mats",mats:[[22449,8],[22446,8]]},               // Major Spellpower
  27984: {type:"mats",mats:[[22450,6],[22449,10],[22446,8],[22445,40]]}, // Mongoose
  46538: {type:"mats",mats:[[22445,8],[22446,4],[22449,6],[22451,2]]},   // Greater Agility (1H)
  27967: {type:"mats",mats:[[22449,2],[22446,6],[22445,6]]},     // Major Striking
  // Twohand weapon
  27977: {type:"mats",mats:[[22449,8],[22446,6],[22445,20]]},    // Major Agility (2H)
  // Rings (require 360+ Enchanting)
  27927: {type:"mats",mats:[[22449,2],[22446,2]]},               // Spellpower (ring)
  27926: {type:"mats",mats:[[22449,2],[22446,3],[22445,5]]},     // Healing Power (ring)
  27924: {type:"mats",mats:[[22450,2],[22449,2]]}                // Stats (ring)
};
