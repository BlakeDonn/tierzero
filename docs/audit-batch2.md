# Spec Audit — Batch 2

## resto-shaman
- Slots: All 14 standard slots present + mainhand, offhand, libram. OK — no missing slot keys.
- Slots with only 1 item (ideally 2+): shoulders, chest, wrists, hands, waist, legs, feet, ring2, trinket2, offhand, libram (11 slots have only 1 option)
- BIS_GEMS: OK — has meta, red, yellow, blue
- BIS_ENCHANTS: Has head, shoulders, back, chest, wrists, hands, legs, feet, mainhand. Missing: offhand enchant (minor, shields don't always get enchanted in TBC pre-raid). OK overall.
- hitCap: No hitCap defined — CORRECT for a healer spec.
- Issues:
  - Many slots only have 1 item option — not a data error but limits user choice
  - Totem of Spontaneous Regrowth (libram slot) has empty stats `{}` — acceptable for relics with on-equip effects
  - No duplicate items in the same slot (ring2 and trinket2 reuse items from ring1/trinket1 respectively, which is standard practice)

## enhancement-shaman
- Slots: All 14 standard slots present + mainhand, offhand, libram. OK — no missing slot keys.
- Slots with only 1 item: ring2, trinket2, offhand, libram (4 slots have only 1 option)
- BIS_GEMS: OK — has meta, red, yellow, blue
- BIS_ENCHANTS: Has head, shoulders, back, chest, wrists, hands, legs, feet, mainhand. Missing: offhand enchant — ISSUE, enhancement shaman dual-wields and should have an offhand weapon enchant (e.g., Mongoose or similar).
- hitCap: Currently 142 — this is the 9% melee special attack hit cap. Reasonable as primary gearing target. Notes mention 164 spell hit separately. OK.
- Issues:
  - BIS_ENCHANTS missing offhand weapon enchant (dual-wield spec should have both weapons enchanted)
  - Totem of the Astral Winds has empty stats `{}` — acceptable for relics with proc effects
  - Fist of Reckoning (offhand) is the only offhand option — could use a second choice
  - Bloodlust Brooch trinket1 listed with `{ap:350}` — this is the on-use value, not passive stats. Technically the item has 72 AP passive. Minor data concern.

## balance-druid
- Slots: All 14 standard slots present + twohand, offhand, libram. OK — no missing slot keys.
- Slots with only 1 item: neck, back, chest, hands, legs, ring2, trinket2, twohand, offhand, libram (10 slots have only 1 option)
- Missing mainhand slot — has twohand + offhand but no mainhand. If a player wants MH+OH instead of staff, there is no mainhand option listed. ISSUE.
- BIS_GEMS: OK — has meta, red, yellow, blue
- BIS_ENCHANTS: Has head, shoulders, back, chest, wrists, hands, legs, feet, mainhand, twohand, ring1, ring2. Comprehensive. OK.
- hitCap: Currently 152 — Balance of Power gives 4% hit. 16% - 4% = 12% needed from gear. 12% * 12.62 rating/% = ~151.4, rounds to 152. CORRECT.
- Issues:
  - No mainhand slot defined — cannot do MH+OH weapon setup, only twohand + offhand (offhand alone is odd without mainhand)
  - Many slots have only 1 item option
  - Spellfire set items (chest, hands, waist) show arcaneDmg/fireDmg stats — correct for Spellfire, but Balance druid primarily uses Arcane/Nature damage (Starfire is Arcane, Wrath is Nature). fireDmg stat is wasted. Not a data error, but worth noting.
  - Ivory Idol of the Moongoddess has empty stats `{}` — acceptable for relics

## resto-druid
- Slots: All 14 standard slots present + mainhand, offhand, libram. OK — no missing slot keys.
- Slots with only 1 item: chest, hands, waist, ring2, trinket2, libram (6 slots have only 1 option)
- BIS_GEMS: OK — has meta, red, yellow, blue
- BIS_ENCHANTS: Has head, shoulders, back, chest, wrists, hands, legs, feet, mainhand, ring1, ring2. Comprehensive. OK.
- hitCap: No hitCap defined — CORRECT for a healer spec.
- Issues:
  - Idol of the Emerald Queen has empty stats `{}` — acceptable for relics with proc/equip effects
  - Primal Mooncloth set (shoulders, chest, belt) only has 1 item each — limits alternatives
  - No duplicate items in same slot detected
  - Overall solid data coverage for a healer spec

## feral-cat-druid
- Slots: All 14 standard slots present + twohand, libram. OK — no missing slot keys. No mainhand/offhand (correct — feral uses staff).
- Slots with only 1 item: head, ring2, trinket2 (3 slots have only 1 option)
- BIS_GEMS: OK — has meta, red, yellow, blue
- BIS_ENCHANTS: Has head, shoulders, back, chest, wrists, hands, legs, feet, twohand. OK.
- hitCap: Currently 142 — Feral melee special attack hit cap is 9% = 142 rating. CORRECT.
- Issues:
  - Wolfshead Helm is the only head option (1 item) — intentional, as it is mandatory for powershifting cats
  - Braided Eternium Chain (neck, id:24114) has empty stats `{}` — the item gives +5 all resistances which is not tracked. Minor data gap.
  - trinket2 only lists Hourglass of the Unraveller (same as trinket1 option) — only 1 choice for second trinket slot
  - Everbloom Idol and Idol of Feral Shadows both have empty stats `{}` — acceptable for relics with proc effects
  - Good item variety overall with 3 neck options

## feral-bear-druid
- Slots: All 14 standard slots present + twohand, libram. OK — no missing slot keys. No mainhand/offhand (correct — feral uses staff).
- Slots with only 1 item: back, chest, wrists, ring2, trinket2, twohand (6 slots have only 1 option)
- BIS_GEMS: OK — has meta, red, yellow, blue
- BIS_ENCHANTS: Has head, shoulders, back, chest, wrists, hands, legs, feet, twohand. Uses appropriate tanking enchants. OK.
- hitCap: No hitCap defined. Bears primarily gear for survivability (armor, stamina, dodge). Not having a hitCap is acceptable, though some guides suggest 142 for threat. OK.
- Issues:
  - Badge of Tenacity (trinket1) has `{agi:0}` — should either be empty `{}` or list the actual passive stat. The item has no passive agility; its value is the on-use +308 armor. Minor data quirk.
  - Heavy Clefthoof set (chest, legs, feet) each have only strength+stamina stats listed — these items also have armor bonuses beyond their base armor which are not reflected in stats. Acceptable since armor display is complex.
  - Thoriumweave Cloak (back) is the only cloak option — could use a second choice
  - Earthwarden (twohand) is the only weapon option — intentional as it is definitively BiS for bear tanking
  - Idol of the Raven Goddess and Idol of Brutality both have empty stats `{}` — acceptable for relics
  - Vindicator's Dragonhide Bracers (wrists) — only 1 option for wrist slot

## affliction-warlock
- Slots: All 14 standard slots present + mainhand, offhand, wand. OK — no missing slot keys.
- Slots with only 1 item: wrists, ring2, trinket2 (3 slots have only 1 option)
- BIS_GEMS: OK — has meta, red, yellow, blue
- BIS_ENCHANTS: Has head, shoulders, back, chest, wrists, hands, legs, feet, mainhand, ring1, ring2. Comprehensive. OK.
- hitCap: Currently 202 — this represents 16% spell hit cap (16 * 12.62 = ~202). However, Affliction warlocks with Suppression (3/3) get 10% hit bonus to Affliction spells, making the effective Affliction spell hit cap only 76 rating (6% * 12.62). The 202 value applies to Shadow Bolt (Destruction school, not reduced by Suppression). DEBATABLE — 202 is correct for Shadow Bolt filler, but notes should clarify that Affliction DoTs only need 76. The notes currently say "Hit cap: 202 (16%)" without distinguishing. Consider updating notes to mention both caps.
- Issues:
  - hitCap value of 202 is technically correct for Shadow Bolt but misleading for Affliction spells (which only need 76). The UI hitCap indicator will show 202 as the target, which may cause players to over-stack hit for their DoTs.
  - Bracers of Havok is the only wrist option — could use a second choice
  - Frozen Shadoweave set (shoulders, chest, feet) correctly lists shadowDmg and frostDmg stats — good
  - Mainhand has 3 options (Blade of Wizardry, Illidari-Bane Mageblade, Eternium Runed Blade) — good variety
  - Illidari-Bane Mageblade (id:30787) stats only show `{stam:12,int:11}` — this item should also have spell power or a proc. May be missing spell power stat. POTENTIAL DATA ERROR.
  - No wand enchant in BIS_ENCHANTS — correct, wands cannot be enchanted in TBC

---

## Summary

| Spec | Slots OK? | BIS_GEMS | BIS_ENCHANTS | hitCap | Notable Issues |
|------|-----------|----------|--------------|--------|---------------|
| resto-shaman | All present, 11 slots with 1 item | OK | OK (no OH enchant, minor) | N/A (correct) | Many single-option slots |
| enhancement-shaman | All present, 4 slots with 1 item | OK | Missing offhand enchant | 142 (OK) | Needs OH enchant for dual-wield |
| balance-druid | All present, 10 slots with 1 item | OK | OK | 152 (correct) | No mainhand slot (only twohand+offhand) |
| resto-druid | All present, 6 slots with 1 item | OK | OK | N/A (correct) | Solid coverage |
| feral-cat-druid | All present, 3 slots with 1 item | OK | OK | 142 (correct) | Braided Eternium Chain empty stats |
| feral-bear-druid | All present, 6 slots with 1 item | OK | OK | N/A (acceptable) | Badge of Tenacity agi:0 quirk |
| affliction-warlock | All present, 3 slots with 1 item | OK | OK | 202 (debatable) | hitCap misleading for Affliction spells; Illidari-Bane Mageblade may be missing SP stat |
