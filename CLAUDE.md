# Tier Zero — TBC Pre-Raid BiS Gear Planner

## Architecture
Single-file app: `index.html` (~4700 lines) with inline CSS + JS. No build tools, no frameworks.
Uses Wowhead tooltips (`wow.zamimg.com` CDN for icons, `nether.wowhead.com` for tooltip data).
Hosted on GitHub Pages: https://blakedonn.github.io/tierzero/

## Repository Structure
```
index.html              — Entire app (HTML + CSS + JS inline)
og-image.png            — Open Graph preview image for Discord/social
addon/TierZeroExporter/ — WoW addon source (.lua + .toc)
TierZeroExporter.zip    — Downloadable addon zip
bis-research.md         — Research notes used to build spec data (reference only)
CLAUDE.md               — This file
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
Items live in the `SPECS` object (~line 501), keyed by spec slug (e.g. `"fire-mage"`, `"feral-cat-druid"`).

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

Priority upgrades: `PRIORITY_ORDER["spec-slug"]` (~line 2656) — array of 10 strings like `"Item — Source hint"`.

### Slot Keys
Standard: `head`, `neck`, `shoulders`, `back`, `chest`, `wrists`, `hands`, `waist`, `legs`, `feet`, `ring1`, `ring2`, `trinket1`, `trinket2`
Weapons: `mainhand`, `offhand`, `twohand`, `wand`
Relics: `libram` (used for all class relics — librams, totems, idols)

### Stat Keys
`sp` (spell power), `heal` (+healing), `crit`, `hit`, `haste`, `int`, `stam`, `spi`, `str`, `agi`, `ap`, `mp5`, `def`, `dodge`, `parry`, `block`, `blockValue`, `armor`, `expertise`, `res` (resilience)

## UI Layout

### Spec Picker (Landing Page)
- 9 class icons positioned in an elliptical "zero" shape using trigonometry
- `ALL_CLASSES` array (~line 3190): class names + icon filenames
- `ALL_SPECS_MAP` (~line 3213): class → array of spec display names
- `SPEC_ICONS` (~line 3201): class → spec → icon filename
- Dropdown directions hardcoded per class index in `dropDirs` array
- CSS `transform:scale()` for viewport-responsive sizing
- Center content: branding, addon download link, import button

### Character Sheet (Paperdoll)
- 3-column CSS grid: left slots | center (stats + weapons) | right slots
- `LEFT_SLOTS` (~line 496): head through hands (7 slots)
- `RIGHT_SLOTS` (~line 497): waist through trinket2 (7 slots)
- Weapons centered: `WEAPON_SLOTS_MH` (mainhand/offhand/wand/libram) + `WEAPON_SLOTS_BOTTOM` (twohand)
- BiS mode: single stat panel; My Gear mode: side-by-side BiS vs tracker stats
- Stat double-counting fix: skips twohand if mainhand exists, and vice versa

### Header
3-column grid: view tabs (left) | "Tier Zero" (center) | spec name + change button (right)

### Views
Three views toggled via header tabs:
1. **Character Sheet** — paperdoll with BiS List / My Gear toggle
2. **Gearing Routes** — priority list + source breakdown
3. **My Gear Tracker** — per-slot dropdown with Wowhead live search

## Key Functions
- `buildSpecPicker()` (~3232): Renders the spec picker ring
- `renderSheet()` (~3593): Renders the paperdoll character sheet
- `computeBisStats()` (~3436): Sums stats from BiS items (handles weapon exclusion)
- `getTrackerStats()` (~4113): Sums stats from user's tracked gear
- `renderCurrentView()` (~3354): Routes to correct view renderer
- `toggleSlot()` (~3381): Expands/collapses gear slot cards with scroll nudging
- `showImportModal()` (~4621): Opens addon import dialog

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
- Exports text string (TIERZERO:1 format) for paste into web app import panel
- Bank scan requires visiting bank NPC (cached in SavedVariables)
- `.toc` Interface versions: 11508 (Classic), 20505 (TBC)

## Wowhead Item ID Verification
To verify item IDs: `https://nether.wowhead.com/tooltip/item/{ID}?dataEnv=5&locale=0`
Compare returned `name` against our item name. For lookups, web search `"wowhead TBC {item name}"`.
Last full audit: 40 random items, 0 mismatches.

## Open Graph / Social Previews
- `og-image.png`: 1200x630 branded PNG generated with pure Node.js (no deps)
- Meta tags in `<head>` for Discord, Twitter, etc.
- Regenerate: `node gen-og.js` (script not in repo, see git history)
