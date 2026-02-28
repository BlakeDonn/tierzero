# Tier Zero — TBC Pre-Raid BiS Gear Planner

## Architecture
Multi-file app with no build tools, no frameworks. Plain `<script>` tags (globals, not ES modules).
Uses Wowhead tooltips (`wow.zamimg.com` CDN for icons, `nether.wowhead.com` for tooltip data).
Hosted on GitHub Pages: https://blakedonn.github.io/tierzero/

## Repository Structure
```
index.html              — Thin HTML shell (~100 lines): meta, fonts, body skeleton
css/app.css             — All CSS (~580 lines)
data/specs.js           — Q enum, slot constants, SPECS object (~4630 lines)
data/priority.js        — PRIORITY_ORDER (~325 lines)
data/gems-enchants.js   — STAT_NAMES, GEMS, GEM_FITS, ENCHANTS, BIS_GEMS, BIS_ENCHANTS, ENCHANT_COSTS (~440 lines)
data/craft-costs.js     — CRAFT_COSTS: material costs for 66 crafted items (generated)
js/app.js               — All JS logic (~2830 lines)
og-image.png            — Open Graph preview image for Discord/social
addon/TierZeroExporter/ — WoW addon source (.lua + .toc)
TierZeroExporter.zip    — Downloadable addon zip
bis-research.md         — Research notes used to build spec data (reference only)
CLAUDE.md               — This file

_build-source-db.js     — Pipeline: builds item→source DB from AtlasLoot Lua files
_sync-spec.js           — Pipeline: generates complete SPECS slot blocks per spec
_build-craft-costs.js   — Pipeline: generates craft material costs from Wowhead spell tooltips
_data/                  — Pipeline data (gitignored)
  atlasloot/            — Raw Lua files downloaded from GitHub
  source-db.json        — Parsed { itemID: { source, type } } map (2695 items)
  tooltip-cache.json    — Cached Wowhead tooltip responses
_spec-output/           — Generated SPECS slot blocks per spec (for review before pasting)
```

## Coverage
27 specs across all 9 classes:
- **Warrior**: Fury, Arms, Protection
- **Paladin**: Holy, Protection, Retribution
- **Hunter**: Beast Mastery, Marksmanship, Survival
- **Rogue**: Combat, Assassination
- **Priest**: Shadow, Holy, Discipline
- **Shaman**: Elemental, Enhancement, Restoration
- **Mage**: Fire, Arcane, Frost
- **Warlock**: Affliction, Destruction, Demonology
- **Druid**: Balance, Feral Cat, Feral Bear, Restoration

## Item Data Structure
Items live in the `SPECS` object in `data/specs.js`, keyed by spec slug (e.g. `"fire-mage"`, `"feral-cat-druid"`).

Each spec entry:
```js
"spec-slug": {
  class: "ClassName",
  spec: "SpecName",        // Must match ALL_SPECS_MAP values
  classColor: "#hex",
  icon: "\uXXXX",
  notes: "Short description",
  statWeights: ["Stat1", "Stat2", ...],
  hitCap: 164,             // or defCap for tanks, optional
  slots: {
    head: [{name:"Item",id:WOWHEAD_ID,q:Q.epic,src:"Source",stats:{sp:46,crit:24}}, ...],
    // ... all slots
  }
}
```

Priority upgrades: `PRIORITY_ORDER["spec-slug"]` in `data/priority.js` — array of 10 strings like `"Item — Source hint"`.

### Slot Keys
Standard: `head`, `neck`, `shoulders`, `back`, `chest`, `wrists`, `hands`, `waist`, `legs`, `feet`, `ring1`, `ring2`, `trinket1`, `trinket2`
Weapons: `mainhand`, `offhand`, `twohand`, `wand`
Relics: `libram` (used for all class relics — librams, totems, idols)

### Stat Keys
`sp` (spell power), `heal` (+healing), `crit`, `hit`, `haste`, `int`, `stam`, `spi`, `str`, `agi`, `ap`, `mp5`, `def`, `dodge`, `parry`, `block`, `blockValue`, `armor`, `expertise`, `res` (resilience)

## UI Layout

### Spec Picker (Landing Page)
- 9 class icons positioned in an elliptical "zero" shape using trigonometry
- `ALL_CLASSES` array (in js/app.js): class names + icon filenames
- `ALL_SPECS_MAP` (in js/app.js): class → array of spec display names
- `SPEC_ICONS` (in js/app.js): class → spec → icon filename
- Dropdown directions hardcoded per class index in `dropDirs` array
- CSS `transform:scale()` for viewport-responsive sizing
- Center content: branding, addon download link, import button

### Character Sheet (Paperdoll)
- 3-column CSS grid: left slots | center (stats + weapons) | right slots
- `LEFT_SLOTS` (in data/specs.js): head through hands (7 slots)
- `RIGHT_SLOTS` (in data/specs.js): waist through trinket2 (7 slots)
- Weapons centered: `WEAPON_SLOTS_MH` (mainhand/offhand/wand/libram) + `WEAPON_SLOTS_BOTTOM` (twohand)
- BiS mode: single stat panel; My Gear mode: side-by-side BiS vs tracker stats
- Stat double-counting fix: skips twohand if mainhand exists, and vice versa

### Header
3-column grid: view tabs (left) | "Tier Zero" (center) | spec name + change button (right)

### Views
Four views toggled via header tabs:
1. **Character Sheet** — paperdoll with BiS List / My Gear toggle
2. **Gearing Routes** — priority list + source breakdown
3. **My Gear Tracker** — per-slot dropdown with Wowhead live search
4. **Raid Setup** — best available items from inventory, hit/def cap bar, gem suggestions

## Key Functions (in js/app.js)
- `buildSpecPicker()`: Renders the spec picker ring
- `renderSheet()`: Renders the paperdoll character sheet
- `computeBisStats()`: Sums stats from BiS items (handles weapon exclusion)
- `getTrackerStats()`: Sums stats from user's tracked gear
- `renderCurrentView()`: Routes to correct view renderer
- `toggleSlot()`: Expands/collapses gear slot cards with scroll nudging
- `showImportModal()`: Opens addon import dialog
- `renderRaidSetup()`: Renders raid setup view with inventory matching
- `isItemFiltered()`: Comprehensive filter (faction + Aldor/Scryer + professions)
- `showFilterModal()`: Opens filter configuration overlay
- `getAffordableGem(socketColor, specSlug)`: Price-aware gem selection (scores all gems by stat weights, filtered by affordability)
- `loadAhPrices()`: Loads AH pricing data from localStorage
- `getGemPriceCap()`: Returns gem price cap in gold (0 = disabled)
- `isGemAffordable(gemId, priceCap, ahPrices)`: Checks if gem is on AH and under price cap
- `getEnchantCost(enchId, ahPrices)`: Returns enchant cost in copper (vendor gold, AH item price, or sum of mat prices)
- `enchantCostSpan(enchId)`: Returns HTML span with formatted cost for inline display
- `getCraftCost(itemId, ahPrices)`: Sums crafting mat prices from AH data (null if any mat missing)
- `craftCostSpan(item)`: Returns HTML span with craft cost (orange) or AH price (green for BoE) for inline display

## Class Colors (CSS Variables)
```
--mage-color: #69ccf0    --paladin-color: #f58cba   --warrior-color: #c79c6e
--rogue-color: #fff569   --hunter-color: #abd473     --warlock-color: #9482c9
--priest-color: #ffffff   --shaman-color: #0070de    --druid-color: #ff7d0a
```
Dynamic lookup via `classColorMap` in `showMainUI()` and `renderSheet()`.

## Key localStorage Keys
- `prebis-spec` — selected spec slug
- `prebis-tracker-{spec}` — JSON object of slot → value (index or `c:ID:NAME` for custom)
- `prebis-professions` — JSON array of enabled profession names
- `prebis-faction` — "alliance", "horde", or "" (show all)
- `prebis-aldor-scryer` — "aldor", "scryer", or "" (show all)
- `prebis-inventory-{spec}` — JSON object `{ bags: [...], bank: [...] }` from addon import
- `prebis-ah-prices` — JSON object with AH gem pricing data (see below)
- `prebis-gem-price-cap` — integer in gold (0 or absent = disabled)

### AH Pricing Data Structure (`prebis-ah-prices`)
```js
{
  "server": "Dreamscythe Alliance",
  "importTime": 1709049600,     // Unix timestamp of import
  "prices": {
    "24030": { "price": 839990, "age": 2 },  // price in copper, age in days
    "23096": { "price": 30000, "age": 1 }
  }
}
```
Imported from TIERZERO:3 addon export (PRICE lines). Requires Auctionator addon.
Prices include gems AND enchant materials (Arcane Dust, Greater Planar Essence, shards, Void Crystals, primals, leg armors).
When gem price cap is active AND AH data exists, `getActiveBisGems()` uses `getAffordableGem()` to select the highest-scoring gem that fits the socket and is at or under the price cap. Meta gems always use BiS regardless of price cap. Price cap takes priority over budget mode.

### Enchant Cost Data (`ENCHANT_COSTS` in data/gems-enchants.js)
Three cost types: `vendor` (fixed gold), `item` (tradeable on AH, e.g. leg armors), `mats` (enchanting recipe materials).
Vendor enchants (head glyphs, shoulder inscriptions) show costs even without AH data.
Mat-based enchants require AH price data for all materials — returns null if any mat missing.
Costs display inline next to enchant names (green text) and in enchant tooltips.
Budget mode (`BUDGET_ENCHANT_MAP`) covers shoulders→Honored, legs→budget, feet→raw stats, weapon→cheaper, rings→skip.

### Crafted Gear Cost Data (`CRAFT_COSTS` in data/craft-costs.js)
Generated by `_build-craft-costs.js`. Contains material costs for 66 crafted items (32 BoE, 34 BoP).
Structure: `{ itemId: { boe: true/false, mats: [[matId, qty], ...] } }`
- BoE items: show AH buy price (green) if available, mat cost (orange) as fallback
- BoP items: show mat cost only (orange)
- Requires AH price data for ALL materials — returns null if any mat missing
- Costs display inline after the "Crafted" source tag on item cards
- `getCraftCost(itemId, ahPrices)`: sums mat prices from AH data (same pattern as `getEnchantCost`)
- `craftCostSpan(item)`: returns HTML span with formatted cost, injected in `renderGearSlot()` and other views
- 55 unique material IDs tracked: primals, cloth, leather, bars, JC gems, engineering parts

## Wowhead Live Search
The My Gear Tracker has live Wowhead search for any TBC item:
- BiS items show instantly as user types
- After 400ms debounce + 3 char minimum, searches via `api.allorigins.win` CORS proxy
- Fetches `wowhead.com/tbc/items/name:{query}`, parses `listviewitems` JSON from HTML
- Filters to equippable gear, capped at 15 results, cached in memory
- On select: saves as `c:ID:NAME` format in tracker localStorage

## WoW Addon
`addon/TierZeroExporter/` — scans equipped gear, bags, and bank.
- Slash commands: `/tz`, `/tierzero`
- Exports text string (TIERZERO:3 format) for paste into web app import panel
- Optional Auctionator integration: if Auctionator addon is installed, exports PRICE lines with gem, enchant mat, and crafting material prices
- PRICE format: `PRICE:itemId:priceInCopper:ageInDays` for all gems, enchant materials, crafting materials, and BoE crafted items in our database
- SERVER line added for AH price context: `SERVER:RealmName Faction`
- Bank scan requires visiting bank NPC (cached in SavedVariables)
- `.toc` Interface versions: 11508 (Classic), 20505 (TBC)

## Wowhead Item ID Verification
To verify item IDs: `https://nether.wowhead.com/tooltip/item/{ID}?dataEnv=5&locale=0`
Compare returned `name` against our item name. For lookups, web search `"wowhead TBC {item name}"`.
Last full audit: 40 random items, 0 mismatches.

## BiS Data Sync Pipeline

Automated pipeline to generate correct, complete SPECS slot data from authoritative sources.
Fixes three systemic issues: missing stats, missing items, and placeholder sources.

### Usage
```bash
node _build-source-db.js            # Step 1: download AtlasLoot Lua → parse → _data/source-db.json
node _sync-spec.js arcane-mage      # Step 2: generate _spec-output/arcane-mage.js
node _sync-spec.js prot-paladin     # Repeat for each spec
```
Step 1 only needs to run once (caches Lua files for 24h). Step 2 caches tooltips in `_data/tooltip-cache.json`.

### Data Sources & Priority
| Priority | Source | What it provides |
|----------|--------|-----------------|
| 1 | AtlasLoot Lua files (GitHub) | Dungeon+boss, faction+tier, badge vendor, PvP sources |
| 2 | Wowhead tooltip text | Crafting profession + specialization, faction requirements |
| 3 | Existing SPECS data in index.html | Preserves known-good sources (skips "Pre-Raid BiS") |
| 4 | Item name prefix detection | PvP items (Gladiator's, Grand Marshal's, etc.) |
| 5 | Bind type detection | BoE + no other source → "World Drop (BoE)" |
| 6 | `KNOWN_QUEST_SOURCES` map in script | Quest rewards (Wowhead pages are JS-rendered, can't scrape) |

### Script 1: `_build-source-db.js`
- Downloads 4 AtlasLoot Lua files from `Hoizame/AtlasLootClassic` GitHub repo
- Parses line-by-line with regex (not a full Lua parser), tracking state: dungeon → boss → difficulty
- Builds `_data/source-db.json`: `{ "itemID": { source: "Dungeon - Boss", type: "dungeon"|"heroic"|"faction"|"badge"|"pvp" } }`
- Boss names shortened via `BOSS_SHORT` map to match existing source conventions
- Priority: dungeon > heroic > faction > badge > pvp (most specific wins)
- Skips: `IgnoreAsSource = true` blocks (keys, tier sets), items < 1000, string IDs

### Script 2: `_sync-spec.js`
- Fetches Wowhead guide page (allorigins proxy → direct fallback) to get relevant item IDs
- Merges with existing SPECS items (preserves our additions not on guide)
- Fetches Wowhead tooltip API for each item, caches responses
- **Stat parsing**:
  - Primary stats: `<!--stat3-->` (agi), `<!--stat4-->` (str), `<!--stat5-->` (int), `<!--stat6-->` (spi), `<!--stat7-->` (stam)
  - Rating stats: `<!--rtgXX-->` markers (hit, crit, haste, def, dodge, parry, block, res, expertise)
  - Text fallback for Classic-era items: `class="q2">Increases your spell hit rating by N` (avoids set bonuses which use `class="q0"`)
  - Spell power, healing, AP, MP5, block value, school damage via regex
- **Socket parsing**: `class="socket-(red|yellow|blue|meta)[^"]*"` (extra classes like `q0` after color)
- **Socket bonus parsing**: `Socket Bonus:` text, handles link-wrapped bonuses, maps stat names via `bonusMap`
- **Slot detection**: tooltip `>(Head|Neck|Shoulder|...)` → slot key mapping, rings/trinkets duplicated to both slots
- Sorts by quality (epic > rare > uncommon), deduplicates by ID per slot
- Outputs `_spec-output/{spec}.js` with complete `slots:{...}` block

### Known Limitations
- Base armor (`<!--amr-->`) is skipped — our data doesn't track it
- Some items listed under heroic in AtlasLoot also drop on normal — source says "Heroic" which is fine
- Quest reward sources need manual entry in `KNOWN_QUEST_SOURCES` map (Wowhead pages are JS-rendered)
- Brooch of Heightened Potential (28134) and similar items: tooltip API doesn't return sockets that may exist in-game
- `--force` flag on _sync-spec.js re-fetches all tooltips (ignores cache)

### Adding a New Quest Source
When a TODO appears for a quest reward item, add it to `KNOWN_QUEST_SOURCES` in `_sync-spec.js`:
```js
const KNOWN_QUEST_SOURCES = {
  31699: 'Quest: Teleport This!',
  // ... add new entries here
};
```
Find quest names via `https://www.wowhead.com/tbc/item=ITEMID` (check manually).

### Verified: arcane-mage test run
- 172 items across 18 slots, 0 TODO sources
- Missing stats fixed: Spellstrike Hood `hit:16`, Gloves of Oblivion `hit:20`, Sethekk Oracle Cloak `hit:12`
- Incorrect socket bonuses fixed: Mana-Etched Crown was `sp:4`, now correctly `res:4`
- Classic-era items (Naxx, AQ40) get crit/hit via text fallback parser

## Crafted Gear Cost Pipeline

Generates `data/craft-costs.js` with material costs for all crafted items in SPECS.

### Usage
```bash
node _build-craft-costs.js            # Generate/update data/craft-costs.js
node _build-craft-costs.js --force    # Re-fetch all spell tooltips
```

### How It Works
1. Scans `data/specs.js` for items with crafting profession source strings
2. Looks up crafting spell IDs from `CRAFT_SPELL_MAP` (hardcoded) or auto-discovers from Wowhead item pages
3. Fetches spell tooltips from `nether.wowhead.com/tooltip/spell/{ID}` to extract reagent lists
4. Parses `<a href="/tbc/item=ID">Name</a>&nbsp;(QTY)` patterns from spell tooltip HTML
5. Determines BoE/BoP from source string (`boe` in src = BoE)
6. Writes `data/craft-costs.js` with `CRAFT_COSTS` object

### Auto-Discovery
For items not in `CRAFT_SPELL_MAP`, the script fetches the Wowhead item page via allorigins proxy and extracts the spell ID from the `"ti":SPELL_ID` pattern in the page's JavaScript data (`sourcemore` array).

### Coverage
66 crafted items across 6 professions: Tailoring (20), Blacksmithing (17), Leatherworking (17), Jewelcrafting (6), Engineering (4), Alchemy (2). 55 unique material IDs.

### Adding New Crafted Items
When a new crafted item is added to SPECS, re-run the script. If auto-discovery fails, add the item ID → spell ID mapping to `CRAFT_SPELL_MAP` in the script.

## Wowhead Ranking Extraction Pipeline

Extracts Wowhead's BiS ranking labels per slot and writes to `data/rankings.js`.
Used by the UI to offer a "Tier Zero / Wowhead" ranking toggle on the Character Sheet.

### Usage
```bash
node _extract-rankings.js arcane-mage    # Extracts + merges into data/rankings.js
```
Supports all spec slugs in GUIDE_URLS. Output merges into existing `data/rankings.js` (safe to run incrementally).

### How It Works
1. Fetches Wowhead guide page (allorigins proxy → direct fallback)
2. Extracts BBCode from `WH.markup.printHtml("...", "guide-body"...)` JS call
3. Unescapes JSON string (`\\r\\n` → newlines, `\\"` → quotes, `\\/` → slashes)
4. Parses `[h3 toc="SlotName"]` headings to delimit slot sections
5. Within each section, matches `[tr][td]Rank[/td][td][item=ID][/td]...` BBCode rows
6. Only reads item IDs from the 2nd cell (item column), not the 3rd (source column) — prevents currency items like Badge of Justice from leaking in

### Tested Specs
| Spec | Result | Items | Rank Style | Notes |
|------|--------|-------|------------|-------|
| arcane-mage | Success | 140/17 slots | BiS, Option | Clean |
| fire-mage | Success | 156/17 slots | BiS, Option | Clean |
| resto-shaman | Success | 164/17 slots | BiS, Option | Clean |
| prot-paladin | Success | 173/16 slots | Complex (Best, Great, Good, Viable, PvP...) | See known issues |

### Known Issues for Remaining Specs
- **Broken URLs**: `combat-rogue` and `assassination-rogue` 404 — Wowhead uses `/rogue/dps-...` (no spec in path). Same for `feral-cat-druid` and `feral-bear-druid` (Wowhead uses `feral-combat` not our slug). Fix: update GUIDE_URLS in the script.
- **Tank guide rank labels**: Prot-paladin uses highly descriptive labels (`Best - Avoidance`, `Viable - Threat`, etc.) with embedded newlines and profession tags. The `normalizeRank()` function handles the common cases but some labels pass through raw.
- **Gems in gear slots**: Some tank guides include gem recommendations inline in tables — these can leak into gear slot rankings (seen in prot-paladin libram: 20 items including gem colors).
- **Shared guide URLs**: fury/arms warrior share one URL; disc/holy priest share one URL. Rankings will be identical for both specs in each pair.
- **Simple DPS/healer specs** (majority of the 27) use clean BiS/Option labels and "just work."

### UI Integration
- State: `rankingSource` in `js/app.js`, persisted as `prebis-ranking-source` in localStorage
- `getOrderedItems(slotKey)`: reorders items by active ranking source
- `getRankLabel(slotKey, itemId)`: returns Wowhead rank label or "Not ranked"
- Toggle only appears when `sheetMode === "bis"` and ranking data exists for the spec
- Graceful fallback: if `RANKINGS` is undefined or spec has no data, everything works as before

## Open Graph / Social Previews
- `og-image.png`: 1200x630 branded PNG generated with pure Node.js (no deps)
- Meta tags in `<head>` for Discord, Twitter, etc.
- Regenerate: `node gen-og.js` (script not in repo, see git history)
