// ---------------------------------------------------------------------------
// Stat Weights — numeric values per spec for gear scoring
// Primary throughput stat normalized to 1.00. Hit/def use 0.00 sentinel
// (scored dynamically via capAwareWeight in app.js).
// Sources: Wowhead TBC guides, SimCraft TBC, WCL community consensus.
// ---------------------------------------------------------------------------
var STAT_WEIGHTS = {

  // ======= MAGE =======
  "fire-mage": {
    sp:1.00, fireDmg:1.00, arcaneDmg:0.00, hit:0.00,
    crit:0.72, haste:0.50, int:0.30, stam:0.01, spi:0.01
  },
  "arcane-mage": {
    sp:1.00, arcaneDmg:1.00, fireDmg:0.00, hit:0.00,
    crit:0.65, haste:0.53, int:0.34, stam:0.01, spi:0.01
  },
  "frost-mage": {
    sp:1.00, frostDmg:1.00, shadowDmg:0.00, hit:0.00,
    crit:0.58, haste:0.48, int:0.32, stam:0.01, spi:0.01
  },

  // ======= PALADIN =======
  "ret-paladin": {
    ap:0.40, str:0.80, hit:0.00, expertise:0.95,
    crit:0.55, haste:0.42, stam:0.01, int:0.05, sp:0.30
  },
  "prot-paladin": {
    def:0.00, stam:0.80, dodge:0.75, parry:0.60,
    block:0.55, blockValue:0.25, sp:0.20, int:0.10, hit:0.00, expertise:0.30
  },
  "holy-paladin": {
    heal:1.00, int:0.70, mp5:0.80, crit:0.55, stam:0.05, spi:0.10, haste:0.40
  },

  // ======= WARRIOR =======
  "fury-warrior": {
    ap:0.40, str:0.80, hit:0.00, expertise:0.95,
    crit:0.65, haste:0.45, agi:0.30, stam:0.01
  },
  "arms-warrior": {
    ap:0.40, str:0.80, hit:0.00, expertise:0.95,
    crit:0.60, haste:0.40, agi:0.25, stam:0.01
  },
  "prot-warrior": {
    def:0.00, stam:0.80, dodge:0.70, parry:0.65,
    block:0.55, blockValue:0.30, agi:0.35, str:0.15, hit:0.00, expertise:0.50
  },

  // ======= ROGUE =======
  "combat-rogue": {
    ap:0.40, agi:0.65, str:0.40, hit:0.00, expertise:0.95,
    haste:0.70, crit:0.55, stam:0.01
  },
  "assassination-rogue": {
    ap:0.40, agi:0.80, str:0.40, hit:0.00, expertise:0.95,
    crit:0.60, haste:0.50, stam:0.01
  },

  // ======= HUNTER =======
  "bm-hunter": {
    ap:0.40, agi:0.80, hit:0.00,
    crit:0.55, haste:0.50, int:0.10, stam:0.01, str:0.05
  },
  "mm-hunter": {
    ap:0.40, agi:0.75, hit:0.00,
    crit:0.55, haste:0.45, int:0.12, stam:0.01, str:0.05
  },
  "survival-hunter": {
    ap:0.40, agi:0.90, hit:0.00,
    crit:0.55, haste:0.45, int:0.10, stam:0.01, str:0.05
  },

  // ======= WARLOCK =======
  "affliction-warlock": {
    sp:1.00, shadowDmg:1.00, frostDmg:0.00, hit:0.00,
    haste:0.60, crit:0.40, int:0.20, stam:0.05, spi:0.05
  },
  "destruction-warlock": {
    sp:1.00, shadowDmg:1.00, fireDmg:1.00, arcaneDmg:0.00, frostDmg:0.00, hit:0.00,
    crit:0.62, haste:0.55, int:0.20, stam:0.05
  },
  "demonology-warlock": {
    sp:1.00, shadowDmg:1.00, frostDmg:0.00, hit:0.00,
    crit:0.52, haste:0.55, stam:0.25, int:0.18
  },

  // ======= PRIEST =======
  "shadow-priest": {
    sp:1.00, shadowDmg:1.00, hit:0.00,
    haste:0.55, spi:0.30, int:0.25, crit:0.15, stam:0.01
  },
  "holy-priest": {
    heal:1.00, mp5:0.80, spi:0.65, int:0.55, crit:0.45, stam:0.05, haste:0.35
  },
  "disc-priest": {
    heal:1.00, int:0.65, spi:0.55, mp5:0.75, crit:0.50, stam:0.05, haste:0.35
  },

  // ======= SHAMAN =======
  "elemental-shaman": {
    sp:1.00, hit:0.00,
    crit:0.65, int:0.35, haste:0.50, stam:0.01, mp5:0.20
  },
  "enhancement-shaman": {
    ap:0.40, agi:0.60, str:0.50, hit:0.00, expertise:0.90,
    crit:0.55, haste:0.40, int:0.08, stam:0.01
  },
  "resto-shaman": {
    heal:1.00, mp5:0.85, int:0.60, crit:0.50, stam:0.05, haste:0.35
  },

  // ======= DRUID =======
  "balance-druid": {
    sp:1.00, arcaneDmg:1.00, fireDmg:0.00, hit:0.00,
    crit:0.60, int:0.35, haste:0.50, stam:0.01, spi:0.10
  },
  "feral-cat-druid": {
    ap:0.40, agi:0.80, str:0.70, hit:0.00, expertise:0.90,
    crit:0.55, haste:0.30, stam:0.01
  },
  "feral-bear-druid": {
    armor:0.02, stam:0.80, agi:0.70, def:0.00,
    dodge:0.65, str:0.10, hit:0.00, expertise:0.50
  },
  "resto-druid": {
    heal:1.00, spi:0.70, int:0.55, mp5:0.65, haste:0.40, crit:0.30, stam:0.05
  }
};
