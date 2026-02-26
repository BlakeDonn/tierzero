# Spec Audit — Batch 3

## destruction-warlock
- Slots: All 14 standard slots present + mainhand, offhand, wand. Warlocks use mainhand+offhand+wand, correct.
  - Slots with only 1 item: head, wrists, ring2, trinket2 (4 slots below the 2+ recommendation)
- BIS_GEMS: OK (meta:34220, red:24030, yellow:31867, blue:24056)
- BIS_ENCHANTS: OK — covers head, shoulders, back, chest, wrists, hands, legs, feet, mainhand, ring1, ring2
- hitCap: currently 202 — correct. Destruction warlock spell hit cap is 202 rating (16%). Destro has no baseline spell hit talents that apply broadly (Suppression is Affliction-only).
- Issues:
  - 4 slots have only 1 item option (head, wrists, ring2, trinket2). Consider adding alternatives.
  - ring2 only has Seal of the Exorcist (same item as ring1 option) — no second alternative ring.
  - trinket2 only has Quagmirran's Eye (same as trinket1 option) — no second alternative trinket.

## demonology-warlock
- Slots: All 14 standard slots present + mainhand, offhand, wand. Correct weapon layout for warlock.
  - Slots with only 1 item: neck, chest, wrists, hands, ring2, trinket2, wand (7 slots below the 2+ recommendation)
- BIS_GEMS: OK (meta:34220, red:24030, yellow:31867, blue:24056)
- BIS_ENCHANTS: OK — covers head, shoulders, back, chest, wrists, hands, legs, feet, mainhand, ring1, ring2
- hitCap: currently 202 — correct. Demonology warlock spell hit cap is 202 rating (16%). Demo has no relevant spell hit talents.
- Issues:
  - 7 slots have only 1 item option — significantly more sparse than other caster specs.
  - neck only has Brooch of Heightened Potential — missing the Hydra-fang Necklace alternative that destro has.
  - chest only has Frozen Shadoweave Robe — missing Spellfire Robe alternative (though demo focuses shadow, this is still a notable gap).
  - wand only has The Black Stalk — missing Nether Core's Control Rod alternative that destro has.
  - ring2 only has Seal of the Exorcist, trinket2 only has Quagmirran's Eye — same single-option issue as destro.

## combat-rogue
- Slots: All 14 standard slots present + mainhand, offhand. Rogues use mainhand+offhand (no wand/libram), correct.
  - Slots with only 1 item: head, neck, shoulders, chest (missing — wait, chest has 2), wrists (has 2), legs, feet, offhand (8 slots have only 1 item: head, neck, shoulders, legs, feet, offhand)
  - Correction after recount: head(1), neck(1), shoulders(1), back(2), chest(2), wrists(2), hands(2), waist(2), legs(1), feet(1), ring1(2), ring2(2), trinket1(2), trinket2(1), mainhand(2), offhand(1)
  - 7 slots below the 2+ recommendation: head, neck, shoulders, legs, feet, trinket2, offhand
- BIS_GEMS: OK (meta:25901, red:24028, yellow:31868, blue:24055)
- BIS_ENCHANTS: OK — covers head, shoulders, back, chest, wrists, hands, legs, feet, mainhand. No offhand enchant listed (offhand weapon would also benefit from enchant).
- hitCap: currently 363 — NEEDS REVIEW. The raw dual-wield hit cap is 28% = 442 rating. With 5/5 Precision (+5% hit), the rating needed drops to ~363 rating (23% from gear = 363). However, the notes say "Hit cap: ~215 with Precision talent" which contradicts the hitCap value of 363. The 363 value represents the FULL dual-wield cap before talents. With Precision (5%), you need 23% from gear = ~363 rating. This is actually correct for the full white hit cap. For the special/yellow hit cap, it is 9% = 142 rating, minus Precision 5% = ~64 rating. Most guides recommend targeting the yellow hit cap (~64 with Precision) first, then stacking other stats. The 363 value for white cap is technically correct but misleadingly high as a practical target. Recommend changing to 64 (yellow cap with Precision) or at minimum updating the notes.
- Issues:
  - hitCap 363 is the white hit cap with Precision. Practical yellow hit cap is ~64 rating. Notes say "~215" which doesn't match either value. The notes text and hitCap number are inconsistent.
  - Blinkstrike (mainhand option) has empty stats: `stats:{}`. Should have stats listed (the weapon has proc but base stats should be noted, even if minimal).
  - 7 slots have only 1 item — fairly sparse.
  - No offhand enchant in BIS_ENCHANTS (both weapons should ideally have enchant recommendations).

## assassination-rogue
- Slots: All 14 standard slots present + mainhand, offhand. Rogues use mainhand+offhand, correct.
  - Item counts: head(1), neck(1), shoulders(1), back(1), chest(2), wrists(2), hands(2), waist(2), legs(1), feet(1), ring1(2), ring2(1), trinket1(2), trinket2(1), mainhand(1), offhand(2)
  - 8 slots below the 2+ recommendation: head, neck, shoulders, back, legs, feet, ring2, trinket2, mainhand (9 actually)
- BIS_GEMS: OK (meta:25901, red:24028, yellow:31868, blue:24055)
- BIS_ENCHANTS: OK — covers head, shoulders, back, chest, wrists, hands, legs, feet, mainhand. No offhand enchant listed.
- hitCap: currently 363 — same issue as combat rogue. Notes say "~215 with Precision talent" which is inconsistent. Assassination also has 5/5 Precision. Same analysis applies: 363 is white hit cap with Precision, yellow cap is ~64 rating. Notes and hitCap value don't match.
- Issues:
  - hitCap/notes inconsistency (same as combat-rogue).
  - 9 slots have only 1 item — very sparse, the sparsest spec audited so far.
  - ring2 has Shapeshifter's Signet which is the same item already in ring1 — no true second option.
  - back has only Vengeance Wrap — missing alternatives like Auchenai Death Shroud (which combat has).
  - mainhand has only Guile of Khoraazi — could use a second dagger option.
  - No offhand enchant in BIS_ENCHANTS.

## fury-warrior
- Slots: All 14 standard slots present + mainhand, offhand. Fury uses mainhand+offhand (dual wield), correct.
  - Item counts: head(2), neck(2), shoulders(2), back(2), chest(2), wrists(1), hands(3), waist(2), legs(2), feet(2), ring1(2), ring2(1), trinket1(2), trinket2(2), mainhand(2), offhand(2)
  - 2 slots below the 2+ recommendation: wrists, ring2
- BIS_GEMS: OK (meta:25901, red:24027, yellow:31868, blue:24054)
- BIS_ENCHANTS: OK — covers head, shoulders, back, chest, wrists, hands, legs, feet, mainhand. No offhand enchant listed.
- hitCap: currently 142 — WRONG. Notes say "Hit cap: 142 rating (9%)" but 142 is the 2H/special hit cap (9%). Fury is a dual-wield spec. The DW white hit cap is 28% = 442 rating. With 3/3 Precision (+3% hit), white cap from gear = 25% = ~394 rating. The yellow/special hit cap is 9% = 142, minus Precision 3% = ~95 rating. The current value of 142 is the yellow cap WITHOUT Precision. Should be either 95 (yellow cap with Precision) or ~394 (white cap with Precision). Recommend 95 for the practical yellow hit cap.
- Issues:
  - hitCap value of 142 is incorrect for a dual-wield spec — should account for Precision talent (3%) reducing it to ~95 for yellow cap.
  - Icon of Unyielding Courage (trinket2 option) has empty stats: `stats:{}`. This trinket has a stamina on-use effect but the passive stat should be noted or a comment added.
  - No offhand enchant in BIS_ENCHANTS.
  - ring2 has only Ring of Arathi Warlords (same item as ring1 option).

## arms-warrior
- Slots: All 14 standard slots present + twohand. Arms uses twohand (no mainhand/offhand/wand), correct.
  - Item counts: head(2), neck(2), shoulders(1), back(1), chest(2), wrists(1), hands(2), waist(2), legs(2), feet(2), ring1(2), ring2(1), trinket1(2), trinket2(1), twohand(2)
  - 5 slots below the 2+ recommendation: shoulders, back, wrists, ring2, trinket2
- BIS_GEMS: OK (meta:25901, red:24027, yellow:31868, blue:24054)
- BIS_ENCHANTS: OK — covers head, shoulders, back, chest, wrists, hands, legs, feet, twohand
- hitCap: currently 142 — NEEDS REVIEW. Notes say "Hit cap: 142 rating (9%)". Arms is a 2H spec so the base yellow hit cap is 9% = 142 rating. With 3/3 Precision (+3% hit), the effective cap from gear is 6% = ~95 rating. The value of 142 does not account for Precision. Should be ~95 if assuming standard Arms builds take Precision.
- Issues:
  - hitCap should likely be ~95 (accounting for 3/3 Precision talent).
  - 5 slots have only 1 item option.
  - shoulders only has Wastewalker Shoulderpads — could add Doomplate Shoulderguards (which fury has).
  - back only has Vengeance Wrap — could add alternatives.
  - ring2 has only Ring of Arathi Warlords (same item as ring1).
  - trinket2 has only Hourglass of the Unraveller (same item as trinket1).

## prot-warrior
- Slots: All 14 standard slots present + mainhand, offhand. Prot uses mainhand+offhand (sword & board), correct.
  - Item counts: head(3), neck(3), shoulders(2), back(2), chest(2), wrists(2), hands(1), waist(2), legs(2), feet(2), ring1(2), ring2(1), trinket1(2), trinket2(1), mainhand(3), offhand(2)
  - 3 slots below the 2+ recommendation: hands, ring2, trinket2
- BIS_GEMS: OK (meta:25901, red:24028, yellow:24065, blue:24033)
- BIS_ENCHANTS: OK — covers head, shoulders, back, chest, wrists, hands, legs, feet, mainhand
- defCap: currently 490 — CORRECT. Protection warriors need 490 defense skill to become uncrittable (base 350 + 140 from gear, which requires ~156 defense rating at level 70 due to rating conversion). No hitCap is set, which is appropriate since tanks prioritize survivability stats.
- Issues:
  - hands has only Felsteel Gloves — could add an alternative.
  - ring2 has only Wind Trader's Band — only 1 option.
  - trinket2 has only Argussian Compass — only 1 option.
  - Dabiri's Enigma (trinket1 option) has empty stats: `stats:{}`. This trinket has a dodge on-use effect but the listing shows no passive stats. Should either add the on-use note or verify if it has passive stamina.
  - Latro's Shifting Sword listed as mainhand option with agi/AP stats — this is a DPS weapon, somewhat unusual for a tank BiS list. May be intentional for threat sets but worth noting.

---

## Summary of Common Issues Across Batch 3

| Spec | Slots <2 items | hitCap/defCap | Empty stats items | Missing offhand enchant |
|------|---------------|---------------|-------------------|------------------------|
| destruction-warlock | 4 | OK (202) | None | N/A (caster OH) |
| demonology-warlock | 7 | OK (202) | None | N/A (caster OH) |
| combat-rogue | 7 | REVIEW (363) | Blinkstrike | Yes |
| assassination-rogue | 9 | REVIEW (363) | None | Yes |
| fury-warrior | 2 | WRONG (142) | Icon of Unyielding Courage | Yes |
| arms-warrior | 5 | REVIEW (142) | None | N/A (2H) |
| prot-warrior | 3 | OK (490 def) | Dabiri's Enigma | N/A (shield) |

### Key Action Items
1. **Rogue hitCap inconsistency**: Both rogue specs have hitCap:363 but notes say "~215". Neither value is ideal. Recommend setting to the yellow/special hit cap with Precision: ~64 rating.
2. **Warrior hitCap missing Precision**: Fury (142) and Arms (142) don't account for 3/3 Precision (-3% hit needed). Should be ~95 for both.
3. **Empty stats objects**: Blinkstrike (combat-rogue), Icon of Unyielding Courage (fury-warrior), and Dabiri's Enigma (prot-warrior) all have `stats:{}`.
4. **Missing offhand enchants**: Combat-rogue, assassination-rogue, and fury-warrior all dual-wield but BIS_ENCHANTS only covers mainhand.
5. **Sparse slot coverage**: assassination-rogue (9 slots with 1 item) and demonology-warlock (7 slots) are notably sparse.
