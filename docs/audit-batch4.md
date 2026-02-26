# Spec Audit — Batch 4

## bm-hunter
- Slots: MISSING weapon slots entirely — no `twohand` (ranged weapon) slot. All 14 standard armor/jewelry slots present. `ring2` has only 1 item, `trinket2` has only 1 item.
- BIS_GEMS: OK (meta, red, yellow, blue all present)
- BIS_ENCHANTS: Has `twohand` enchant (27977) but spec has NO twohand slot — enchant will never apply. Otherwise covers head, shoulders, back, chest, wrists, hands, legs, feet. Missing: ring enchants (optional).
- hitCap: currently 142, should be 142 — OK
- Issues:
  1. **Critical: No weapon slot.** Hunters need a `twohand` slot for their ranged weapon (bow/gun/crossbow). This is a major omission — no ranged weapon recommendations at all.
  2. `ring2` only has 1 item (Ravenclaw Band). Should have 2+ options.
  3. `trinket2` only has 1 item (Abacus of Violent Odds). Should have 2+ options.
  4. BIS_ENCHANTS references `twohand` but the slot doesn't exist in SPECS, so the enchant recommendation is orphaned.

## mm-hunter
- Slots: MISSING weapon slots entirely — no `twohand` (ranged weapon) slot. Many standard slots have only 1 item: `shoulders` (1), `wrists` (1), `hands` (1), `waist` (1), `legs` (1), `ring2` (1), `trinket2` (1). Slots with 2+ items: head, neck, back, chest, feet, ring1, trinket1.
- BIS_GEMS: OK (meta, red, yellow, blue all present)
- BIS_ENCHANTS: Has `twohand` enchant (27977) but spec has NO twohand slot — enchant will never apply. Otherwise covers head, shoulders, back, chest, wrists, hands, legs, feet. Missing: ring enchants (optional).
- hitCap: currently 142, should be 142 — OK
- Issues:
  1. **Critical: No weapon slot.** Same as BM — no ranged weapon recommendations.
  2. **7 slots have only 1 item each** (shoulders, wrists, hands, waist, legs, ring2, trinket2). Most specs should have 2+ options per slot to give players alternatives.
  3. BIS_ENCHANTS references `twohand` but the slot doesn't exist in SPECS.

## survival-hunter
- Slots: MISSING weapon slots entirely — no `twohand` (ranged weapon) slot. Slots with only 1 item: `shoulders` (1), `hands` (1), `ring2` (1), `trinket2` (1). All other standard slots have 2 items.
- BIS_GEMS: OK (meta, red, yellow, blue all present)
- BIS_ENCHANTS: Has `twohand` enchant (27977) but spec has NO twohand slot — enchant will never apply. Otherwise covers head, shoulders, back, chest, wrists, hands, legs, feet. Missing: ring enchants (optional).
- hitCap: currently 142, should be 142 — OK
- Issues:
  1. **Critical: No weapon slot.** Same as other hunters — no ranged weapon recommendations.
  2. `shoulders`, `hands`, `ring2`, `trinket2` each have only 1 item. Should have 2+ options.
  3. BIS_ENCHANTS references `twohand` but the slot doesn't exist in SPECS.

## ret-paladin
- Slots: OK. All 14 standard slots populated with 2-3 items each. Weapon slots: `twohand` (4 items), `libram` (2 items). `ring2` has 2 items, all others have 3.
- BIS_GEMS: OK (meta, red, yellow, blue all present)
- BIS_ENCHANTS: OK. Covers head, shoulders, back, chest, wrists, hands, legs, feet, twohand. Missing: ring enchants (optional).
- hitCap: currently 95, should be 142 (9% at 15.77 per %) — **WRONG**. Ret paladin is a 2H melee spec with no hit-reducing talents, so the cap is 9% = 142 rating.
- Issues:
  1. **hitCap is wrong.** Set to 95 but should be 142 for a 2H melee DPS spec against raid bosses.
  2. Bloodlust Brooch trinket (line 894) shows `ap:72` but the BM hunter version shows `ap:350`. The real item has a passive component and on-use — inconsistent representation across specs.

## prot-paladin
- Slots: OK. All 14 standard slots populated with 3 items each. Weapon slots: `mainhand` (3 items), `offhand` (3 items), `libram` (2 items). Well-populated across the board.
- BIS_GEMS: OK (meta, red, yellow, blue all present)
- BIS_ENCHANTS: OK. Covers head, shoulders, back, chest, wrists, hands, legs, feet, mainhand. Missing: ring enchants (optional).
- defCap: currently 490, should be 490 — OK. No hitCap set (acceptable for tanks).
- Issues:
  1. No significant issues found. Slot coverage and item diversity are both good.

## holy-paladin
- Slots: OK. All 14 standard slots populated with 2-4 items each. Weapon slots: `mainhand` (3 items), `offhand` (3 items), `libram` (2 items). Well-populated.
- BIS_GEMS: OK (meta, red, yellow, blue all present)
- BIS_ENCHANTS: OK. Covers head, shoulders, back, chest, wrists, hands, legs, feet, mainhand, ring1, ring2. Comprehensive.
- hitCap: none set — OK (healers don't need hit cap).
- Issues:
  1. **ring1 contains `Band of the Exorcist` (id:28553)** with stats `{ap:34, crit:16, hit:10, res:11, stam:24}`. This is a physical DPS ring (attack power, hit rating) — not appropriate for a Holy Paladin healer. Should be replaced with a healing-oriented ring.
  2. `Moonglade Cowl` (head, line 1030) and `Moonglade Robe` (chest, line 1053) have stats like `str:24`/`str:25` and `agi` — these look like Druid feral items, not Holy Paladin healing items. Questionable choices for a healer.
  3. `Alchemist's Stone` trinket (id:13503) — this is the vanilla Alchemist's Stone, not the TBC version. The TBC version would be Redeemer's Alchemist Stone (id:35751) or Alchemist's Stone (id:35748). Item 13503 may show incorrect tooltip data in a TBC context.
