// Phase 1: Normalize source string formatting across all items
// Fixes naming inconsistencies without changing which dungeon/boss is referenced
const fs = require('fs');

let html = fs.readFileSync('data/specs.js', 'utf8');
let changeCount = 0;

function replace(oldSrc, newSrc) {
  if (oldSrc === newSrc) return;
  const oldPattern = 'src:"' + oldSrc + '"';
  const newPattern = 'src:"' + newSrc + '"';
  const escaped = oldPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const count = (html.match(new RegExp(escaped, 'g')) || []).length;
  if (count > 0) {
    html = html.split(oldPattern).join(newPattern);
    console.log('  ' + oldSrc + ' -> ' + newSrc + ' (' + count + 'x)');
    changeCount += count;
  }
}

// === DUNGEON NAME STANDARDIZATION ===
console.log('\n--- Dungeon names ---');
replace("Shadow Lab - Vorpil", "Shadow Labyrinth - Grandmaster Vorpil");
replace("Shadow Lab - Murmur", "Shadow Labyrinth - Murmur");
replace("Shadow Lab - Blackheart", "Shadow Labyrinth - Blackheart the Inciter");
replace("Heroic Shadow Lab - Murmur", "Heroic Shadow Labyrinth - Murmur");
replace("Heroic Ramparts - Vazruden", "Heroic Hellfire Ramparts - Vazruden");
replace("Heroic Ramparts - Omor the Unscarred", "Heroic Hellfire Ramparts - Omor the Unscarred");
replace("Heroic Ramparts - Omor", "Heroic Hellfire Ramparts - Omor the Unscarred");
replace("Heroic Ramparts - Lt. Drake", "Heroic Hellfire Ramparts - Lt. Drake");
replace("Heroic Ramparts", "Heroic Hellfire Ramparts");
replace("Heroic Auchenai - Shirrak", "Heroic Auchenai Crypts - Shirrak");
replace("Heroic Auchenai - Maladaar", "Heroic Auchenai Crypts - Exarch Maladaar");

// Boss name standardization (use full names)
replace("Shattered Halls - Kargath", "Shattered Halls - Warchief Kargath");
replace("Heroic Shattered Halls - Kargath", "Heroic Shattered Halls - Warchief Kargath");
replace("Sethekk Halls - Talon King Ikiss", "Sethekk Halls - Ikiss");
replace("Steamvault - Kalithresh", "Steamvault - Warlord Kalithresh");
replace("Heroic Steamvault - Kalithresh", "Heroic Steamvault - Warlord Kalithresh");
replace("Auchenai Crypts - Maladaar", "Auchenai Crypts - Exarch Maladaar");
replace("Auchenai Crypts - Avatar", "Auchenai Crypts - Avatar of the Martyred");
replace("Blood Furnace - Kelidan", "Blood Furnace - Keli'dan the Breaker");
replace("Blood Furnace - Keli'dan", "Blood Furnace - Keli'dan the Breaker");
replace("Heroic Blood Furnace - Keli'dan", "Heroic Blood Furnace - Keli'dan the Breaker");
replace("Mechanar - Pathaleon", "Mechanar - Pathaleon the Calculator");
replace("Heroic Mechanar - Pathaleon", "Heroic Mechanar - Pathaleon the Calculator");
replace("Arcatraz - Skyriss", "Arcatraz - Harbinger Skyriss");
replace("Heroic Arcatraz - Skyriss", "Heroic Arcatraz - Harbinger Skyriss");
replace("Heroic Underbog - Black Stalker", "Heroic Underbog - The Black Stalker");
replace("Old Hillsbrad - Epoch Hunter", "Old Hillsbrad Foothills - Epoch Hunter");
replace("Heroic Old Hillsbrad - Epoch Hunter", "Heroic Old Hillsbrad Foothills - Epoch Hunter");
replace("Heroic Old Hillsbrad", "Heroic Old Hillsbrad Foothills");
replace("Heroic Mana Tombs", "Heroic Mana-Tombs");

// === FACTION/REP STANDARDIZATION (use "The" prefix) ===
console.log("\n--- Reputation names ---");
replace("Sha'tar - Exalted", "The Sha'tar - Exalted");
replace("Sha'tar - Revered", "The Sha'tar - Revered");
replace("Sha'tar - Honored", "The Sha'tar - Honored");
replace("Consortium - Exalted", "The Consortium - Exalted");
replace("Consortium - Revered", "The Consortium - Revered");
replace("Aldor - Exalted", "The Aldor - Exalted");
replace("Aldor - Revered", "The Aldor - Revered");
replace("Aldor - Honored", "The Aldor - Honored");
replace("Scryers - Exalted", "The Scryers - Exalted");
replace("Scryers - Revered", "The Scryers - Revered");

// === CRAFTING STANDARDIZATION ===
console.log("\n--- Crafting ---");
replace("Mooncloth Tailoring (BoP)", "Tailoring - Mooncloth (BoP)");
replace("BS - Master Swordsmithing (BoP)", "Blacksmithing - Swordsmithing (BoP)");
replace("Blacksmithing - Swordsmithing", "Blacksmithing - Swordsmithing (BoP)");
replace("Tribal LW (BoP)", "Leatherworking - Tribal (BoP)");
replace("Elemental LW (BoP)", "Leatherworking - Elemental (BoP)");
// Bare profession names without (BoE)/(BoP) -> add suffix
replace("Blacksmithing", "Blacksmithing (BoE)");
replace("Jewelcrafting", "Jewelcrafting (BoE)");
replace("Leatherworking", "Leatherworking (BoP)");

// === WORLD DROP STANDARDIZATION ===
console.log("\n--- World drops ---");
replace("BoE World Drop", "World Drop (BoE)");
replace("World Drop / AH", "World Drop (BoE)");

// === BADGE STANDARDIZATION ===
console.log("\n--- Badges ---");
// Only replace bare "Badges of Justice" not already prefixed with a number
const badgeRegex = /src:"Badges of Justice"/g;
let badgeCount = 0;
html = html.replace(badgeRegex, function() {
  badgeCount++;
  return 'src:"25 Badges of Justice"';
});
if (badgeCount > 0) {
  console.log("  Badges of Justice -> 25 Badges of Justice (" + badgeCount + "x)");
  changeCount += badgeCount;
}

// === QUEST STANDARDIZATION (use "Quest: Name" format) ===
console.log("\n--- Quest format ---");
// Convert "Quest - X" to "Quest: X"
const questDashRegex = /src:"Quest - ([^"]+)"/g;
let questDashCount = 0;
html = html.replace(questDashRegex, function(match, name) {
  questDashCount++;
  return 'src:"Quest: ' + name + '"';
});
if (questDashCount > 0) {
  console.log("  Quest - X -> Quest: X (" + questDashCount + "x)");
  changeCount += questDashCount;
}

fs.writeFileSync('data/specs.js', html);
console.log("\nTotal replacements: " + changeCount);
