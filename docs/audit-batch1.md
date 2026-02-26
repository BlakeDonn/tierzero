# Spec Audit — Batch 1

## fire-mage
- Slots: OK — All 14 standard slots populated with 2+ items. Weapons: mainhand(4), offhand(3), twohand(2), wand(3) all present.
- BIS_GEMS: OK — meta, red, yellow, blue all present.
- BIS_ENCHANTS: OK — head, shoulders, back, chest, wrists, hands, legs, feet, mainhand, twohand, ring1, ring2 all present.
- hitCap: currently 164, should be 164 (Elemental Precision 3% = 13% needed = 164 rating) — OK
- Issues: None found.

## arcane-mage
- Slots: OK — All 14 standard slots populated with 2+ items. Weapons: mainhand(4), offhand(3), twohand(2), wand(3) all present.
- BIS_GEMS: OK — meta, red, yellow, blue all present.
- BIS_ENCHANTS: OK — head, shoulders, back, chest, wrists, hands, legs, feet, mainhand, twohand, ring1, ring2 all present.
- hitCap: currently 164, should be 76 (Arcane Focus 10% = 6% needed = 76 rating) — WRONG
- Issues: **hitCap is incorrect.** Arcane Focus talent gives 10% spell hit, reducing hit cap to 76 rating (6% from gear). The notes field says "Arcane needs mana sustain + hit cap" but does not mention the reduced cap. Line 720 in index.html has `hitCap:164` but should be `hitCap:76`.

## frost-mage
- Slots: ISSUES — Most slots have 2+ items, but:
  - ring2: only 1 item (Seer's Signet) — duplicate of ring1 entry (same id:29126)
  - trinket2: only 1 item (Quagmirran's Eye) — duplicate of trinket1 entry (same id:27683)
  - back: only 2 items (minimum met)
  - No twohand slot defined (OK — frost uses mainhand+offhand)
- BIS_GEMS: OK — meta, red, yellow, blue all present.
- BIS_ENCHANTS: OK — head, shoulders, back, chest, wrists, hands, legs, feet, mainhand, ring1, ring2. No twohand enchant (correct, no twohand slot).
- hitCap: currently 164, should be 164 (Elemental Precision 3% = 13% from gear = 164 rating) — OK
- Issues:
  1. **ring2 has only 1 item** and it duplicates ring1's Seer's Signet (id:29126). Should add a unique alternative.
  2. **trinket2 has only 1 item** and it duplicates trinket1's Quagmirran's Eye (id:27683). Should add a unique alternative.
  3. **Icon of the Silver Crescent (trinket1, id:29370) has stats:{sp:198}** — 198 sp is the on-use proc value, not the passive equip bonus. The passive is sp:43. This inflates stat totals. (Same issue in other specs using this trinket.)
  4. **Offhand Orb of the Soul-Eater (id:29272) has stats:{stam:18} only** — appears to be missing spell power. The actual item gives +23 spell damage. Likely incomplete stats.

## shadow-priest
- Slots: ISSUES — Most slots have 2+ items, but:
  - ring2: only 1 item (Seal of the Exorcist) — duplicate of ring1 entry (same id:28555)
  - trinket2: 2 items but Scryer's Bloodgem has stats:{sp:0} (essentially empty)
  - offhand: only 1 item (Orb of the Soul-Eater)
  - back: only 2 items, and Illidari Cloak (id:31201) has **empty stats `stats:{}`**
- BIS_GEMS: OK — meta, red, yellow, blue all present.
- BIS_ENCHANTS: OK — head, shoulders, back, chest, wrists, hands, legs, feet, mainhand, ring1, ring2. No twohand (correct, no twohand slot).
- hitCap: currently 76, should be 76 (Shadow Focus 10% = 6% from gear = 76 rating) — OK
- Issues:
  1. **Illidari Cloak (back, id:31201) has stats:{}** — completely empty stats object. This item should have spell power/stamina stats, or be removed if data is unavailable. Line 1939.
  2. **Scryer's Bloodgem (trinket2, id:29132) has stats:{sp:0}** — sp:0 is meaningless. This is an on-use trinket (spell power proc) with no passive stats, but sp:0 is misleading. Should either list actual on-use value or use empty stats.
  3. **ring2 has only 1 item** (Seal of the Exorcist id:28555), which duplicates ring1. Should add a unique alternative.
  4. **offhand has only 1 item** (Orb of the Soul-Eater). Should add at least one alternative.
  5. **Icon of the Silver Crescent (trinket1, id:29370) has stats:{sp:198}** — same issue as frost-mage; 198 is the on-use value, passive is sp:43.
  6. **Orb of the Soul-Eater (offhand, id:29272) has stats:{stam:18} only** — likely missing spell power stat.

## holy-priest
- Slots: ISSUES — Most slots have 2+ items, but:
  - ring2: only 1 item (Ring of Fabled Hope)
  - trinket2: only 1 item (Scarab of the Infinite Cycle)
  - wand: only 1 item (Soul-Wand of the Aldor)
- BIS_GEMS: OK — meta, red, yellow, blue all present.
- BIS_ENCHANTS: OK — head, shoulders, back, chest, wrists, hands, legs, feet, mainhand, ring1, ring2 all present.
- hitCap: not defined — OK for a healer spec (no hit cap needed).
- Issues:
  1. **ring2 has only 1 item.** Should add at least one alternative.
  2. **trinket2 has only 1 item.** Should add at least one alternative.
  3. **wand has only 1 item.** Should add at least one alternative.
  4. **Darkmoon Card: Blue Dragon (trinket1, id:19288) has stats:{}** — empty stats. This is a proc-only trinket with no passive stats. Technically correct but displays oddly. Consider adding a comment or using a different representation.

## discipline-priest
- Slots: ISSUES — Multiple slots below 2-item minimum:
  - shoulders: only 1 item (Primal Mooncloth Shoulders)
  - chest: only 1 item (Primal Mooncloth Robe)
  - hands: only 1 item (Hallowed Handwraps)
  - waist: only 1 item (Primal Mooncloth Belt)
  - ring2: only 1 item (Ring of Convalescence) — duplicate of ring1 entry (same id:29169)
  - trinket2: only 1 item (Scarab of the Infinite Cycle) — duplicate of trinket1 entry (same id:28190)
  - wand: only 1 item (Soul-Wand of the Aldor)
  - All other slots have 2+ items.
- BIS_GEMS: OK — meta, red, yellow, blue all present.
- BIS_ENCHANTS: OK — head, shoulders, back, chest, wrists, hands, legs, feet, mainhand, ring1, ring2 all present.
- hitCap: not defined — OK for a healer spec.
- Issues:
  1. **7 slots have only 1 item each** (shoulders, chest, hands, waist, ring2, trinket2, wand). This is the most sparse spec in this batch. Holy priest has the same items available — consider copying alternatives from holy-priest where appropriate.
  2. **ring2 duplicates ring1** (Ring of Convalescence id:29169 in both).
  3. **trinket2 duplicates trinket1** (Scarab of the Infinite Cycle id:28190 in both).

## elemental-shaman
- Slots: ISSUES — Most slots have 2+ items, but:
  - back: only 1 item (Shawl of Shifting Probabilities)
  - ring2: only 1 item (Ring of Cryptic Dreams) — duplicate of ring1 entry (same id:29367)
  - trinket2: only 1 item (Quagmirran's Eye) — duplicate of trinket1 entry (same id:27683)
  - libram (totem): only 1 item (Totem of the Void) with empty stats
  - No wand slot — correct, shamans do not use wands.
- BIS_GEMS: OK — meta, red, yellow, blue all present.
- BIS_ENCHANTS: OK — head, shoulders, back, chest, wrists, hands, legs, feet, mainhand all present. No ring enchants (optional).
- hitCap: currently 164, should be 164 (Elemental Precision 3% = 13% from gear = 164 rating) — OK
- Issues:
  1. **back has only 1 item.** Should add at least one alternative.
  2. **ring2 has only 1 item** and duplicates ring1 (Ring of Cryptic Dreams id:29367).
  3. **trinket2 has only 1 item** and duplicates trinket1 (Quagmirran's Eye id:27683).
  4. **Totem of the Void (libram, id:28248) has stats:{}** — empty stats. This totem reduces the mana cost of Lightning Bolt, which is a proc effect not representable as flat stats. Acceptable but worth noting.
  5. **Icon of the Silver Crescent (trinket1, id:29370) has stats:{sp:198}** — same on-use inflation issue as frost-mage and shadow-priest. Passive should be sp:43.

---

## Summary of Cross-Cutting Issues

| Issue | Affected Specs |
|-------|---------------|
| hitCap wrong | arcane-mage (164 should be 76) |
| Slots with only 1 item | frost-mage (2), shadow-priest (2), holy-priest (3), discipline-priest (7), elemental-shaman (4) |
| Duplicate items across ring1/ring2 or trinket1/trinket2 | frost-mage, shadow-priest, discipline-priest, elemental-shaman |
| Icon of the Silver Crescent sp:198 (should be sp:43) | frost-mage, shadow-priest, elemental-shaman |
| Items with empty stats {} | shadow-priest (Illidari Cloak), holy-priest (Blue Dragon), elemental-shaman (Totem of the Void) |
| Orb of the Soul-Eater missing sp stat | frost-mage, shadow-priest |
| Scryer's Bloodgem sp:0 | shadow-priest |

**Specs fully passing: 1/7** (fire-mage only)
