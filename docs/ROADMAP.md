# Tier Zero — Feature Roadmap

## Feature Groups

Features are organized into layers — each layer unlocks the next. Lower layers are foundational; higher layers depend on them.

---

### Layer 0: Data Foundation

These don't change UI much but are required by almost everything else.

#### 0.1 — School-Specific Damage Stats
**What:** Track `arcane`, `fire`, `shadow`, `frost`, `nature`, `holy` damage separately in item stats. Spellfire gear has `+arcane +fire` damage, Frozen Shadoweave has `+shadow +frost`. Currently these are all lumped into `sp`.
**Why first:** Stat totals, gear scoring, and the optimizer all need correct per-school damage to work. If we don't fix this first, every downstream feature shows wrong numbers.
**Scope:** Update stat keys, re-scrape affected items from Wowhead tooltip API, update `computeBisStats()` and `getTrackerStats()` to display school-specific damage where relevant.

#### 0.2 — Gems & Enchants Data Model
**What:** Add gem sockets and enchant slots to each item. Build a database of pre-raid gems and enchants with their stat contributions.
**Why:** Gems and enchants are a huge part of pre-raid gearing. The optimizer can't work without them. Stat totals are incomplete without them.
**Scope:** New data structures for gems/enchants, UI for selecting them per slot, stat contribution included in totals.

#### 0.3 — Expand Item Database (Wowhead "Other Recommendations")
**What:** For each slot, pull in the broader list of strong alternatives from Wowhead (not just top 2-3). Mark which are "BiS" vs "strong alternative". Review item ranking order against Wowhead's own rankings.
**Why:** Current lists are thin (2-3 items per slot). Users need more options, especially when filtered by profession/faction. The gear optimizer also needs a bigger pool to recommend from.
**Scope:** Research + add ~3-5 more items per slot per spec. Add a `tier` field to items (e.g. `tier:1` = BiS, `tier:2` = strong alt). Review and fix ranking order.

---

### Layer 1: Character Profile & Filtering

#### 1.1 — Character Profile System
**What:** Let users set: professions (already partially exists), Aldor vs Scryer, Horde vs Alliance. Stored in localStorage. Shown as a settings panel or part of spec selection.
**Why:** Unlocks all filtering. Aldor/Scryer changes which shoulder enchants and rep rewards are available. Horde/Alliance changes some quest rewards and rep factions (Honor Hold vs Thrallmar, etc.).
**Scope:** UI for profile setup, localStorage persistence, profile data available to all views.

#### 1.2 — Profession / Faction / Alliance Filtering
**What:** Filter BiS lists and gearing routes based on character profile. Hide items you can't get (wrong profession, wrong faction rep, wrong side). Show profession-specific items prominently.
**Why:** Huge QoL. A non-tailor shouldn't see "Spellfire Robe (BoP)" as BiS #1. An Aldor player shouldn't see Scryer rewards.
**Scope:** Tag each item's `src` with metadata (required profession, required faction, Horde/Alliance only). Filter logic in `renderSheet()` and gearing routes. Already have partial profession filtering — extend it.
**Depends on:** 1.1

#### 1.3 — Phase Filtering
**What:** Tag items by content phase (P1, P2, etc.). Let users filter to see only items available in current phase.
**Scope:** Add `phase` field to items. Toggle in UI. Most pre-raid items are P1, but some badge rewards and heroic drops shifted between phases.

---

### Layer 2: Addon Enhancements

#### 2.1 — Reputation Tracking in Addon
**What:** Export current reputation standings for all TBC factions from the addon. Include in the TIERZERO export string.
**Why:** Enables the app to know which rep rewards you can already buy, which you're close to, and feed into the session planner ("you're 2000 rep from Sha'tar Exalted — run Botanica/Mechanar").
**Scope:** Lua `GetFactionInfoByID()` API. Add `REP:factionName:standingLevel:currentRep:maxRep` lines to export format. Parse in web app import.
**Note:** Yes, the WoW API supports this. `GetFactionInfoByID()` or iterating `GetNumFactions()` / `GetFactionInfo(index)` works.

#### 2.2 — Auctionator Price Data Export
**What:** If user has Auctionator installed, read its scan data (`AuctionatorScanData` SavedVariable) and export BoE item prices.
**Why:** Enables gold cost estimates for BoE gear, crafting mats, and total "cost to BiS" calculations.
**Scope:** Lua reads Auctionator's saved variables (cross-addon data access). Export `PRICE:itemId:goldValue` lines. Web app shows gold costs on BoE items.
**Risk:** Depends on Auctionator's data format staying stable. Need fallback for users without it.

#### 2.3 — Full Inventory/Bank Storage
**What:** The addon already exports bags + bank. Ensure all equippable items (not just quality >= 2) are captured and stored in the web app for the optimizer to use.
**Scope:** Already mostly done. May need to lower the quality filter or store more metadata. Web app needs to persist inventory data in localStorage.

---

### Layer 3: Scoring & Comparison

#### 3.1 — Stat Weights & Gear Scoring
**What:** Each spec already has `statWeights` (display order). Convert these to numeric weights. Calculate a single "gear score" per item. Show it in the UI next to each item.
**Why:** Makes it instantly clear which item is better. Powers the optimizer and session planner.
**Scope:** Define numeric weights per spec (e.g. fire mage: `{sp:1.0, crit:0.66, hit:0.9, int:0.4, stam:0.1}`). Compute score = sum of (stat * weight). Display in item cards.
**Depends on:** 0.1 (school-specific damage), 0.2 (gems/enchants contribute to score)

#### 3.2 — Side-by-Side Item Comparison
**What:** Click two items to see them compared stat-by-stat with green/red deltas.
**Scope:** Modal or inline panel showing two items with stat diff highlighted.
**Depends on:** 3.1 (show score diff too)

#### 3.3 — User-Editable BiS Rankings
**What:** Edit mode on BiS list where users can drag-reorder items within a slot, or add/remove items from their personal BiS ranking. Saved to localStorage.
**Why:** Different guilds/players value stats differently. Let them customize.
**Scope:** Drag-and-drop or up/down buttons in edit mode. Custom rankings saved per spec in localStorage. "Reset to default" option.
**Depends on:** 0.3 (need enough items to reorder)

---

### Layer 4: Smart Features

#### 4.1 — Gear Optimizer / Balancer
**What:** "Balance Gear" button that takes your inventory (equipped + bags + bank from addon), applies stat weights, and recommends the optimal gear set. Prioritizes hitting caps (hit cap, defense cap) first, then maximizes primary stat.
**Why:** The killer feature. "What should I wear right now with what I have?"
**Scope:** Algorithm: (1) enumerate all possible items per slot from inventory, (2) ensure hit/def cap is met, (3) maximize weighted stat score. Include gem and enchant recommendations. Account for school-specific damage.
**Depends on:** 0.1, 0.2, 2.3, 3.1

#### 4.2 — Session Planner ("I Have 3 Hours")
**What:** User clicks "Create Plan", selects time budget (1h / 2h / 3h / full evening / weekly). App analyzes current gear vs BiS, identifies biggest upgrade gaps, and generates a prioritized to-do list: "Run Heroic Slave Pens (Quagmirran's Eye + Midnight Legguards), then Heroic Old Hillsbrad (Wastewalker Helm)".
**Why:** Turns passive information into actionable gameplay.
**Scope:** Score each missing upgrade by stat weight delta. Estimate time per dungeon (~30-45 min heroic, ~20 min normal). Group items by dungeon. Prioritize dungeons with multiple upgrades. Factor in rep gains if user is close to a rep reward (needs 2.1). Factor in profession crafting if mats are affordable (needs 2.2).
**Depends on:** 1.2 (filtered items), 2.1 (rep data), 3.1 (scoring), optionally 2.2 (gold costs)

#### 4.3 — Gold Cost Estimates
**What:** Show gold cost for BoE items, crafting material costs, and total "cost to BiS" based on Auctionator data.
**Scope:** Parse price data from addon export. Show gold values on BoE items and crafted items. Sum total cost for remaining upgrades.
**Depends on:** 2.2

---

### Layer 5: Social & Sharing

#### 5.1 — Shareable URLs
**What:** Encode current spec + tracked gear into URL parameters so users can share their setup.
**Scope:** Serialize tracker state to URL hash. On load, parse hash and restore state. Short URL format.

#### 5.2 — Export Gear Set as Image/Text
**What:** "Share" button that generates a summary image or formatted text of your gear for Discord/guild forums.
**Scope:** Canvas-based image generation or formatted text copy.

---

## Suggested Implementation Order

**Phase 1 — Data & Profile Foundation**
- 0.1 School-specific damage stats
- 0.2 Gems & enchants data model
- 1.1 Character profile (professions + Aldor/Scryer + faction)
- 1.2 Filtering based on profile

**Phase 2 — Expanded Content**
- 0.3 More items per slot + Wowhead accuracy pass
- 1.3 Phase filtering
- 2.1 Addon rep tracking
- 3.1 Stat weights & gear scoring

**Phase 3 — Smart Features**
- 3.2 Item comparison
- 3.3 User-editable BiS rankings
- 2.3 Full inventory persistence
- 4.1 Gear optimizer

**Phase 4 — Planning & Economy**
- 2.2 Auctionator integration
- 4.2 Session planner
- 4.3 Gold cost estimates

**Phase 5 — Social**
- 5.1 Shareable URLs
- 5.2 Export as image/text
