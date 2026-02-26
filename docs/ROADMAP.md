# Tier Zero — Feature Roadmap

## Feature Groups

Features are organized into layers — each layer unlocks the next. Lower layers are foundational; higher layers depend on them.

---

### Layer 0: Data Foundation

These don't change UI much but are required by almost everything else.

#### 0.1 — School-Specific Damage Stats ✅ DONE
**What:** Track `arcane`, `fire`, `shadow`, `frost`, `nature`, `holy` damage separately in item stats. Spellfire gear has `+arcane +fire` damage, Frozen Shadoweave has `+shadow +frost`. Currently these are all lumped into `sp`.
**Why first:** Stat totals, gear scoring, and the optimizer all need correct per-school damage to work. If we don't fix this first, every downstream feature shows wrong numbers.
**Scope:** Update stat keys, re-scrape affected items from Wowhead tooltip API, update `computeBisStats()` and `getTrackerStats()` to display school-specific damage where relevant.

#### 0.2 — Gems & Enchants Data Model ✅ DONE
**What:** Add gem sockets and enchant slots to each item. Build a database of pre-raid gems and enchants with their stat contributions.
**Why:** Gems and enchants are a huge part of pre-raid gearing. The optimizer can't work without them. Stat totals are incomplete without them.
**Implemented:** Full `GEMS` database (meta, red, orange, yellow, blue, purple, green — rare + uncommon), `BIS_GEMS` per spec, `BIS_ENCHANTS` per spec, `GEM_FITS` socket matching, `ENCHANT_LINK_MAP`, gem/enchant UI in tracker, stat contributions included in totals.

#### 0.3 — Expand Item Database & Fix BiS Rankings ✅ DONE
**What:** Re-audit and fix item[0] ranking for every spec. Fix hitCap values, stat inflation bugs, missing weapon slots. Re-rank all 27 specs against Wowhead/Icy Veins guides. Add alternatives to single-item slots.
**Completed:**
- Fixed hitCap for 6 specs (arcane-mage 164→76, ret-paladin 95→142, fury/arms-warrior 142→95, combat/assassination-rogue 363→64)
- Fixed Icon of the Silver Crescent sp:198→sp:43 (7 specs)
- Fixed 12+ items with empty/wrong stats (Icon of Unyielding Courage, Dabiri's Enigma, Orb of the Soul-Eater, etc.)
- Replaced bad holy paladin items (Moonglade Cowl/Robe, Band of the Exorcist, vanilla Alchemist's Stone)
- Standardized Bloodlust Brooch ap:350→ap:72 (passive, not on-use)
- Added offhand enchants for 4 dual-wield specs
- Added ranged weapons (twohand slot) for 3 hunter specs
- Added balance-druid mainhand slot
- Re-ranked all 27 specs via 4 parallel research agents (docs/rerank-batch1-4.md)

---

### Layer 1: Character Profile & Filtering

#### 1.1 + 1.2 — Character Profile & Filtering 📋 PLANNED
**What:** Add Horde/Alliance, Aldor/Scryer, and profession filtering. Hide items you can't get across all 3 views.
**Plan:**
- `FACTION_LOCKED_SOURCES` lookup table: Honor Hold↔Alliance, Thrallmar↔Horde, Kurenai↔Alliance, Mag'har↔Horde
- Aldor/Scryer detection via `src` string parsing (same pattern as existing profession filtering)
- Unified `isItemFiltered(item)` function combining profession + faction + Aldor/Scryer + phase checks
- Shared `renderFilterBar()` across all 3 views: `[Horde|Alliance] [Aldor|Scryers] Phase:[All|1-5]` + profession row
- localStorage keys: `prebis-faction`, `prebis-aldor-scryer`, `prebis-phase`
- Items hidden completely (not greyed out). BiS stat panel stays unfiltered as reference.
- No item data changes — all filtering via `src` string parsing
**Est:** ~170 lines

#### 1.3 — Phase Filtering 📋 PLANNED (bundled with 1.1+1.2)
**What:** Tag items by content phase. Let users filter to current phase.
**Plan:**
- `ITEM_PHASE_OVERRIDES` lookup table keyed by item ID. All items default to P1.
- Only ~20-30 entries needed (badge vendor waves, late-phase recipes)
- `getItemPhase(item)` returns override or 1
- Phase selector buttons in shared filter bar

---

### Layer 2: Addon Enhancements

#### 2.1 — Reputation Tracking in Addon 📋 PLANNED
**What:** Export current reputation standings from the addon. Display in web app.
**Plan:**
- Lua: `ScanReputations()` using `GetNumFactions()`/`GetFactionInfo()` API
- Export as `REP:factionName:standingId:currentRep` lines in TIERZERO:3 format
- Parse in `parseAddonExport()`, store in `prebis-reps` localStorage
- Show rep status on vendor items: "Sha'tar — Revered ✓" or "2000 rep away"
- Standing map: `{1:"Hated",...,7:"Revered",8:"Exalted"}`
**Est:** ~80 lines Lua + ~45 lines JS

#### 2.2 — Auctionator Price Data Export 📋 PLANNED
**What:** If user has Auctionator installed, read its scan data and export BoE item prices.
**Why:** Enables gold cost estimates for BoE gear, crafting mats, and total "cost to BiS" calculations.
**Plan:**
- Lua: `ScanAuctionatorPrices()` reads `AUCTIONATOR_PRICE_DATABASE` or `AuctionatorDB.Prices`
- Export `PRICE:itemId:priceInCopper` lines in export string
- Parse in `parseAddonExport()`, store in `prebis-prices` localStorage
- Display gold values on BoE items: "~25g 40s"
- Graceful fallback: silently skip if no Auctionator data, wrap in pcall() for safety
**Risk:** Auctionator's data format may vary by version — test against Classic TBC version.
**Est:** ~65 lines Lua + ~30 lines JS

#### 2.3 — Full Inventory/Bank Persistence 📋 PLANNED
**What:** Ensure all equippable items from addon export are stored and available for the optimizer.
**Plan:**
- Keep quality >= 2 filter (whites/grays aren't useful)
- Store as character-wide `prebis-inventory` localStorage (not per-spec)
- Format: `{ equipped: [...], bags: [...], bank: [...] }`
- Inventory browser: collapsible "My Inventory" section in My Gear Tracker, grouped by slot
- `getInventoryForSlot(slotKey)` API for the Gear Optimizer (4.1) to consume
- Bank staleness indicator: "Bank data from: [date]"
**Est:** ~60 lines JS

---

### Layer 3: Scoring & Comparison

#### 3.1 — Stat Weights & Gear Scoring 📋 PLANNED
**What:** Add numeric stat weights per spec. Calculate and display a gear score on each item.
**Plan:**
- `STAT_WEIGHTS` object: 27 specs, each with numeric weights normalized to primary stat = 1.0
- `itemScore(item, specSlug)`: Weighted sum of item stats
- Hit rating gets high weight up to cap, drops to ~0.05 beyond cap
- Display score badge next to each item in gear slots
- Total gear score at top of stat panel (BiS vs My Gear comparison)
- Research needed: pull weights from Wowhead/SimCraft TBC guides
**Depends on:** 0.1 ✅, 0.2 ✅
**Est:** ~125 lines JS + ~80 lines weight data

#### 3.2 — Side-by-Side Item Comparison 📋 PLANNED
**What:** Click two items to see them compared stat-by-stat with green/red deltas.
**Plan:**
- Compare state: `compareItems = [null, null]` array, compare button on each item row
- First click highlights item with "vs ?" indicator, second click opens comparison modal
- Side-by-side modal: Item A | Stat Diff (green/red +/-) | Item B
- Gear score comparison at top (if 3.1 is implemented)
- Reuses existing modal pattern (import modal overlay)
- Works without 3.1 (raw stat diff), better with 3.1 (score diff too)
**Depends on:** 3.1 (optional, for score diff)
**Est:** ~95 lines JS + ~20 lines CSS

#### 3.3 — User-Editable BiS Rankings 📋 PLANNED
**What:** Let users reorder items within a slot to customize their personal BiS ranking.
**Plan:**
- `prebis-custom-rankings-{spec}` localStorage: slot → [itemIndex permutation array]
- `getOrderedItems(slotKey)` replaces raw `specSlots()[slotKey]` at ~5 callsites
- "Edit Rankings" toggle in Character Sheet header
- Up/down arrow buttons on items (simpler than drag-and-drop, works on mobile)
- "Reset to Default" per slot + "Reset All" per spec
- Custom rankings affect BiS stat panel (your #1 picks determine displayed stats)
**Depends on:** 0.3 ✅
**Est:** ~75 lines JS + ~15 lines CSS

---

### Layer 4: Smart Features

#### 4.1 — Gear Optimizer / Balancer 📋 PLANNED
**What:** "Balance Gear" button that takes your inventory, applies stat weights, and recommends the optimal gear set.
**Why:** The killer feature. "What should I wear right now with what I have?"
**Plan:**
- Greedy algorithm: score each candidate item per slot via `itemScore()`, pick highest-scoring
- Cap-first balancing: check hit/def cap, swap items where score loss is minimized to reach cap
- Gem/enchant recommendations: suggest hit gems if cap isn't met with gear alone
- Results UI: slot-by-slot recommendation with "Apply All" / per-slot accept buttons
- Cap status indicator: "Hit: 142/142 ✓" or "Hit: 98/142 — 44 short"
- Edge cases: unique-equipped items, weapon type restrictions, empty inventory prompt
**Depends on:** 0.1 ✅, 0.2 ✅, 2.3, 3.1
**Est:** ~180 lines JS + ~20 lines CSS

#### 4.2 — Session Planner ("I Have 3 Hours") 📋 PLANNED
**What:** User selects time budget, app generates a prioritized dungeon/activity to-do list based on gear gaps.
**Why:** Turns passive information into actionable gameplay.
**Plan:**
- `analyzeUpgradeGaps()`: compare tracked gear vs BiS, calculate score delta per missing item
- `groupUpgradesByDungeon()`: group items by source dungeon, sort by totalDelta/time (best upgrade-per-hour)
- Time estimates: Heroic ~35min, Normal ~20min. Greedy time-filling algorithm.
- "Create Plan" button in Gearing Routes view with time selector: `[1h] [2h] [3h] [Full Evening] [Weekly]`
- Numbered checklist: "1. Heroic Slave Pens (~35 min) — Quagmirran's Eye, Midnight Legguards"
- Optional rep integration if 2.1 exists (factor in rep gains)
- Plan persisted in `prebis-session-plan-{spec}` localStorage
**Depends on:** 3.1, optionally 2.1
**Est:** ~130 lines JS + ~15 lines CSS

#### 4.3 — Gold Cost Estimates 📋 PLANNED
**What:** Show gold cost for BoE items, crafting materials, and total "cost to BiS" using Auctionator price data.
**Plan:**
- `isGoldPurchasable(item)`: detect BoE/crafted items via `src` string parsing
- Price lookup from `prebis-prices` localStorage (populated by 2.2)
- Gold coin icon + price display below item source in gear slot view
- Total cost to BiS panel: sum of all missing purchasable items, broken down by BoE vs crafted
- Only show prices when Auctionator data exists; crafting cost = finished item AH price (v1)
**Depends on:** 2.2
**Est:** ~60 lines JS

---

### Layer 5: Social & Sharing

#### 5.1 — Shareable URLs 📋 PLANNED
**What:** Encode spec + tracked gear into URL hash so users can share their setup via link.
**Plan:**
- Compact hash format: `#s=fire-mage&g=0.1.0.2.c28193...&e=29191.28886...&m=24030.24048...`
- On load, check `window.location.hash` → parse → show read-only shared view with "Save to My Gear" button
- "Share" button in My Gear Tracker → encode state → copy URL to clipboard
- Shared URLs are read-only snapshots, don't overwrite viewer's localStorage
- Banner: "Viewing shared gear set — [Save to My Gear] [Dismiss]"
**Est:** ~110 lines JS

#### 5.2 — Export Gear Set as Image/Text 📋 PLANNED
**What:** "Share" button that generates a formatted text summary or canvas-based image of your gear set for Discord/guild forums.
**Plan:**
- Text export (primary): monospace-friendly format for Discord code blocks, copy to clipboard
- Canvas image generation (bonus): offscreen canvas (800×600), dark theme, Cinzel headers, download as PNG
- Share modal with "Text" and "Image" tabs + Copy/Download buttons
- Discord-optimized: image sized 1200×630 for embed, text uses Discord markdown
- Include Wowhead links in text export, app URL at bottom
**Depends on:** None (works with current tracker data)
**Est:** ~115 lines JS + ~10 lines CSS

---

## Implementation Order

| Order | Feature | Status | Est. Size |
|-------|---------|--------|-----------|
| ~~1~~ | ~~0.1 School-specific damage~~ | ✅ Done | — |
| ~~2~~ | ~~0.2 Gems & enchants~~ | ✅ Done | — |
| ~~3~~ | ~~0.3 Item database & re-ranking~~ | ✅ Done | — |
| 4 | 1.1+1.2+1.3 Character Profile & Filtering | 📋 Planned | ~170 lines |
| 5 | 5.1 Shareable URLs | 📋 Planned | ~110 lines |
| 6 | 2.1 Addon Rep Tracking | 📋 Planned | ~125 lines |
| 7 | 3.1 Stat Weights & Gear Scoring | 📋 Planned | ~205 lines |
| 8 | 3.3 User-Editable BiS Rankings | 📋 Planned | ~90 lines |
| 9 | 3.2 Item Comparison | 📋 Planned | ~115 lines |
| 10 | 2.3 Full Inventory Persistence | 📋 Planned | ~60 lines |
| 11 | 2.2 Auctionator Integration | 📋 Planned | ~95 lines |
| 12 | 4.1 Gear Optimizer | 📋 Planned | ~200 lines |
| 13 | 4.2 Session Planner | 📋 Planned | ~145 lines |
| 14 | 4.3 Gold Cost Estimates | 📋 Planned | ~60 lines |
| 15 | 5.2 Export as Image/Text | 📋 Planned | ~125 lines |
