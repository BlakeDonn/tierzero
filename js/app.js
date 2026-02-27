
// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let currentSpec = localStorage.getItem("prebis-spec") || "";
let currentView = "sheet"; // "sheet" | "routes" | "tracker"
let sheetMode = "bis"; // "bis" | "mygear"

// ---------------------------------------------------------------------------
// Profession Filters
// ---------------------------------------------------------------------------
const ALL_PROFESSIONS = ["Tailoring","Blacksmithing","Leatherworking","Jewelcrafting","Alchemy","Engineering"];

function loadProfessions() {
  try {
    var raw = localStorage.getItem("prebis-professions");
    return raw ? JSON.parse(raw) : ALL_PROFESSIONS.slice(); // all enabled by default
  } catch(e) { return ALL_PROFESSIONS.slice(); }
}

function saveProfessions(profs) {
  localStorage.setItem("prebis-professions", JSON.stringify(profs));
}

function toggleProfession(prof) {
  var profs = loadProfessions();
  var idx = profs.indexOf(prof);
  if (idx === -1) profs.push(prof);
  else profs.splice(idx, 1);
  saveProfessions(profs);
  renderCurrentView();
}

function isItemFilteredByProfession(item) {
  var profs = loadProfessions();
  var s = item.src.toLowerCase();
  for (var i = 0; i < ALL_PROFESSIONS.length; i++) {
    var p = ALL_PROFESSIONS[i].toLowerCase();
    if (s.includes(p) && profs.indexOf(ALL_PROFESSIONS[i]) === -1) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Comprehensive Item Filter (Faction + Aldor/Scryer + Professions)
// ---------------------------------------------------------------------------
// Faction-specific reputation names
var ALLIANCE_FACTIONS = ["honor hold", "kurenai"];
var HORDE_FACTIONS = ["thrallmar", "the mag'har", "mag'har"];

function loadFaction() {
  return localStorage.getItem("prebis-faction") || "";  // "" = show all
}
function saveFaction(val) {
  localStorage.setItem("prebis-faction", val);
}
function loadAldorScryer() {
  return localStorage.getItem("prebis-aldor-scryer") || "";  // "" = show all
}
function saveAldorScryer(val) {
  localStorage.setItem("prebis-aldor-scryer", val);
}

function isItemFiltered(item) {
  // Profession filter
  if (isItemFilteredByProfession(item)) return true;

  var src = item.src.toLowerCase();

  // Faction filter
  var faction = loadFaction();
  if (faction === "alliance") {
    for (var i = 0; i < HORDE_FACTIONS.length; i++) {
      if (src.includes(HORDE_FACTIONS[i])) return true;
    }
  } else if (faction === "horde") {
    for (var i = 0; i < ALLIANCE_FACTIONS.length; i++) {
      if (src.includes(ALLIANCE_FACTIONS[i])) return true;
    }
  }

  // Aldor/Scryer filter
  var as = loadAldorScryer();
  if (as === "aldor") {
    if (src.includes("scryer")) return true;
  } else if (as === "scryer") {
    if (src.includes("aldor") && !src.includes("scryer")) return true;
  }

  return false;
}

function filtersConfigured() {
  return localStorage.getItem("prebis-faction") !== null ||
         localStorage.getItem("prebis-aldor-scryer") !== null;
}

function showFilterModal() {
  var faction = loadFaction();
  var as = loadAldorScryer();
  var profs = loadProfessions();

  var html = '<div class="import-overlay" id="filterOverlay" onclick="if(event.target===this)closeFilterModal()">';
  html += '<div class="import-panel" style="width:440px;">';
  html += '<h3>&#9881; Filters</h3>';

  // Faction
  html += '<div class="filter-section">';
  html += '<div class="filter-label">Faction</div>';
  html += '<div class="filter-btns">';
  html += '<button class="filter-btn' + (faction === "" ? " active" : "") + '" onclick="setFilter(\'faction\',\'\')">Both</button>';
  html += '<button class="filter-btn' + (faction === "alliance" ? " active" : "") + '" onclick="setFilter(\'faction\',\'alliance\')">Alliance</button>';
  html += '<button class="filter-btn' + (faction === "horde" ? " active" : "") + '" onclick="setFilter(\'faction\',\'horde\')">Horde</button>';
  html += '</div></div>';

  // Aldor / Scryer
  html += '<div class="filter-section">';
  html += '<div class="filter-label">Reputation</div>';
  html += '<div class="filter-btns">';
  html += '<button class="filter-btn' + (as === "" ? " active" : "") + '" onclick="setFilter(\'as\',\'\')">Both</button>';
  html += '<button class="filter-btn' + (as === "aldor" ? " active" : "") + '" onclick="setFilter(\'as\',\'aldor\')">Aldor</button>';
  html += '<button class="filter-btn' + (as === "scryer" ? " active" : "") + '" onclick="setFilter(\'as\',\'scryer\')">Scryer</button>';
  html += '</div></div>';

  // Professions
  html += '<div class="filter-section">';
  html += '<div class="filter-label">Professions</div>';
  html += '<div class="filter-btns">';
  for (var p = 0; p < ALL_PROFESSIONS.length; p++) {
    var prof = ALL_PROFESSIONS[p];
    var isActive = profs.indexOf(prof) !== -1;
    html += '<button class="filter-btn' + (isActive ? " active" : "") + '" onclick="toggleFilterProf(\'' + prof + '\')">' + prof + '</button>';
  }
  html += '</div></div>';

  html += '<div class="import-btn-row" style="margin-top:16px;">';
  html += '<button class="import-primary" onclick="closeFilterModal()">Done</button>';
  html += '</div>';
  html += '</div></div>';

  var existing = document.getElementById("filterOverlay");
  if (existing) existing.remove();
  document.body.insertAdjacentHTML("beforeend", html);
}

function setFilter(type, val) {
  if (type === "faction") saveFaction(val);
  else if (type === "as") saveAldorScryer(val);
  showFilterModal(); // refresh modal
  renderCurrentView();
}

function toggleFilterProf(prof) {
  toggleProfession(prof);
  showFilterModal(); // refresh modal
}

function closeFilterModal() {
  var el = document.getElementById("filterOverlay");
  if (el) el.remove();
}

function isItemOwnedInTracker(slotKey, itemId) {
  var tracked = loadTracker();
  var spec = specData();
  if (tracked[slotKey] === undefined || tracked[slotKey] === "") return false;
  var val = String(tracked[slotKey]);
  if (val.indexOf("c:") === 0) return false; // custom items don't match BiS items
  var idx = parseInt(val, 10);
  var items = spec.slots[slotKey];
  if (!items || !items[idx]) return false;
  return items[idx].id === itemId;
}

// Parse a custom tracker value "c:ITEMID:NAME" → {id, name} or null
function parseCustomItem(val) {
  if (!val || String(val).indexOf("c:") !== 0) return null;
  var rest = String(val).substring(2);
  var colonIdx = rest.indexOf(":");
  if (colonIdx === -1) return {id: 0, name: rest};
  var id = parseInt(rest.substring(0, colonIdx), 10) || 0;
  var name = rest.substring(colonIdx + 1);
  return {id: id, name: name};
}

// ---------------------------------------------------------------------------
// Custom Item Stats Cache (fetched from Wowhead tooltip API)
// ---------------------------------------------------------------------------
var _customStatsCache = {};
var CUSTOM_CACHE_VERSION = 2; // Bump to invalidate stale cached stats (v2: fixed rtg18 spell hit)
(function() {
  try {
    var raw = JSON.parse(localStorage.getItem("prebis-custom-stats") || "{}");
    if (raw._v === CUSTOM_CACHE_VERSION) {
      _customStatsCache = raw;
    } else {
      _customStatsCache = { _v: CUSTOM_CACHE_VERSION };
      localStorage.setItem("prebis-custom-stats", JSON.stringify(_customStatsCache));
    }
  } catch(e) { _customStatsCache = { _v: CUSTOM_CACHE_VERSION }; }
})();
function saveCustomStatsCache() {
  _customStatsCache._v = CUSTOM_CACHE_VERSION;
  try { localStorage.setItem("prebis-custom-stats", JSON.stringify(_customStatsCache)); } catch(e) {}
}
function getCustomItemData(itemId) {
  var cached = _customStatsCache[itemId];
  if (!cached) return null;
  // Support old cache format (plain stats object) and new format ({stats, sockets, ...})
  if (cached.stats !== undefined) return cached;
  // Old format: cached is the stats object itself
  return { stats: cached, sockets: null, socketBonus: null, quality: 3, name: null };
}
function getCustomItemStats(itemId) {
  var data = getCustomItemData(itemId);
  return data ? data.stats : null;
}

// Wowhead stat/rtg ID → our stat key
var WH_STAT_MAP = {
  3:'agi', 4:'str', 5:'int', 6:'spi', 7:'stam'
};
var WH_RTG_MAP = {
  12:'def', 13:'dodge', 14:'parry', 15:'block',
  16:'hit', 17:'hit', 18:'hit', 31:'hit',
  19:'crit', 20:'crit', 21:'crit', 32:'crit',
  28:'haste', 29:'haste', 30:'haste', 36:'haste',
  35:'res', 37:'expertise'
};

function parseWowheadStats(tooltipHtml) {
  var stats = {};
  // Base stats: <!--stat5-->+17
  var statRe = /<!--stat(\d+)-->\+?(\d+)/g;
  var m;
  while ((m = statRe.exec(tooltipHtml)) !== null) {
    var key = WH_STAT_MAP[m[1]];
    if (key) stats[key] = (stats[key] || 0) + parseInt(m[2]);
  }
  // Rating stats: <!--rtg21-->28
  var rtgRe = /<!--rtg(\d+)-->(\d+)/g;
  while ((m = rtgRe.exec(tooltipHtml)) !== null) {
    var key = WH_RTG_MAP[m[1]];
    if (key) stats[key] = (stats[key] || 0) + parseInt(m[2]);
  }
  // Spell power: "damage and healing done by magical spells and effects by up to X"
  var spMatch = tooltipHtml.match(/damage and healing[^<]*?by up to (\d+)/i);
  if (spMatch) stats.sp = (stats.sp || 0) + parseInt(spMatch[1]);
  // School-specific spell damage (Fire, Arcane, Shadow, Frost, Nature, Holy)
  var schoolMap = {fire:"fireDmg",arcane:"arcaneDmg",shadow:"shadowDmg",frost:"frostDmg",nature:"natureDmg",holy:"holyDmg"};
  var schoolRe = /damage done by (\w+)[^<]*?by up to (\d+)/gi;
  var sm;
  while ((sm = schoolRe.exec(tooltipHtml)) !== null) {
    var sKey = schoolMap[sm[1].toLowerCase()];
    if (sKey) stats[sKey] = (stats[sKey] || 0) + parseInt(sm[2]);
  }
  // Healing power: "healing done by spells and effects by up to X"
  var healMatch = tooltipHtml.match(/healing done by spells[^<]*?by up to (\d+)/i);
  if (healMatch) stats.hp = (stats.hp || 0) + parseInt(healMatch[1]);
  // MP5: "Restores X mana per 5 sec"
  var mp5Match = tooltipHtml.match(/Restores (\d+) mana per 5 sec/i);
  if (mp5Match) stats.mp5 = (stats.mp5 || 0) + parseInt(mp5Match[1]);
  return Object.keys(stats).length > 0 ? stats : null;
}

function parseWowheadSockets(tooltipHtml) {
  if (!tooltipHtml) return { sockets: null, socketBonus: null };
  var sockets = [];
  var socketRe = /class="socket-(red|yellow|blue|meta)[^"]*"/gi;
  var m;
  while ((m = socketRe.exec(tooltipHtml)) !== null) {
    sockets.push(m[1].toLowerCase());
  }
  var socketBonus = null;
  var bonusRe = /Socket Bonus:(?:\s*<[^>]*>)*\s*\+(\d+)\s+([\w\s]+?)(?:<|$)/i;
  var bm = tooltipHtml.match(bonusRe);
  if (bm) {
    var val = parseInt(bm[1]);
    var rawStat = bm[2].trim().toLowerCase();
    var bonusMap = {
      'stamina':'stam','intellect':'int','strength':'str','agility':'agi','spirit':'spi',
      'spell critical strike rating':'crit','critical strike rating':'crit',
      'hit rating':'hit','spell hit rating':'hit',
      'resilience rating':'res','resilience':'res',
      'healing':'heal','dodge rating':'dodge','defense rating':'def',
      'block rating':'block','block value':'blockValue',
      'spell power':'sp','spell damage':'sp','spell damage and healing':'sp',
      'attack power':'ap','mana every 5 seconds':'mp5','mana per 5 sec':'mp5','mp5':'mp5',
      'haste rating':'haste'
    };
    var key = bonusMap[rawStat] || bonusMap[rawStat.replace(/ and .*/, '')] || rawStat.substring(0, 3);
    socketBonus = {};
    socketBonus[key] = val;
  }
  return {
    sockets: sockets.length > 0 ? sockets : null,
    socketBonus: sockets.length > 0 ? socketBonus : null
  };
}

var QUALITY_MAP = {0:'poor',1:'common',2:Q.uncommon,3:Q.rare,4:Q.epic,5:Q.legendary};

function fetchCustomItemStats(itemId, callback) {
  if (!itemId) { if (callback) callback(null); return; }
  if (_customStatsCache[itemId] && _customStatsCache[itemId].stats !== undefined) {
    if (callback) callback(_customStatsCache[itemId]);
    return;
  }
  fetch('https://nether.wowhead.com/tooltip/item/' + itemId + '?dataEnv=5&locale=0')
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var tooltip = data.tooltip || '';
      var stats = parseWowheadStats(tooltip);
      var socketData = parseWowheadSockets(tooltip);
      var itemData = {
        stats: stats,
        sockets: socketData.sockets,
        socketBonus: socketData.socketBonus,
        quality: data.quality || 3,
        name: data.name || null
      };
      _customStatsCache[itemId] = itemData;
      saveCustomStatsCache();
      if (callback) callback(itemData);
    })
    .catch(function() { if (callback) callback(null); });
}

// Get display info for a tracked slot — returns full item shape or null
// Works for both BiS items and custom (Wowhead-fetched) items
function getTrackedItem(slotKey) {
  var tracked = loadTracker();
  var spec = specData();
  var val = tracked[slotKey];
  if (val === undefined || val === "") return null;
  var str = String(val);
  if (str.indexOf("c:") === 0) {
    var custom = parseCustomItem(str);
    if (!custom) return null;
    var data = getCustomItemData(custom.id);
    var q = Q.rare;
    if (data && data.quality) q = QUALITY_MAP[data.quality] || Q.rare;
    return {
      name: custom.name,
      id: custom.id,
      src: "Custom",
      q: q,
      stats: data ? data.stats : null,
      sockets: data ? data.sockets : null,
      socketBonus: data ? data.socketBonus : null,
      isCustom: true
    };
  }
  var idx = parseInt(str, 10);
  var items = spec.slots[slotKey];
  if (!items || !items[idx]) return null;
  var item = items[idx];
  return {name: item.name, id: item.id, src: item.src, q: item.q, stats: item.stats, sockets: item.sockets, socketBonus: item.socketBonus, isCustom: false};
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sourceTag(src) {
  const s = src.toLowerCase();
  if (s.includes("heroic"))                                                           return '<span class="tag tag-heroic">Heroic</span>';
  if (s.includes("badge") || s.includes("g'eras"))                                    return '<span class="tag tag-badge">Badges</span>';
  if (s.includes("honor") || s.includes("pvp") || s.includes("arena") || s.includes("gladiator")) return '<span class="tag tag-pvp">PvP</span>';
  if (s.includes("tailoring") || s.includes("blacksmithing") || s.includes("leatherworking") ||
      s.includes("jewelcrafting") || s.includes("engineering") || s.includes("alchemy") || s.includes("craft")) return '<span class="tag tag-craft">Crafted</span>';
  if (s.includes("quest"))                                                            return '<span class="tag tag-quest">Quest</span>';
  if (s.includes("exalted") || s.includes("revered") || s.includes("honored") || s.includes("faction") || s.includes("reputation")) return '<span class="tag tag-rep">Rep</span>';
  if (s.includes("world drop") || s.includes("boe"))                                 return '<span class="tag tag-world">World</span>';
  if (s.includes("classic") || s.includes("naxx") || s.includes("aq") || s.includes("bwl") || s.includes("molten")) return '<span class="tag tag-classic">Classic</span>';
  return '<span class="tag tag-dungeon">Dungeon</span>';
}

function itemLink(item) {
  return '<a href="https://www.wowhead.com/tbc/item=' + item.id + '" onclick="if(!event.ctrlKey&&!event.metaKey&&event.button===0){event.preventDefault();}">' + item.name + '</a>';
}

function refreshWowheadLinks() {
  setTimeout(function () {
    if (typeof $WowheadPower !== 'undefined') {
      $WowheadPower.refreshLinks();
    }
  }, 100);
}

// ---------------------------------------------------------------------------
// Quality helper — maps Q enum to CSS class suffix
// ---------------------------------------------------------------------------
function qualityClass(q) {
  if (q === Q.legendary) return "legendary";
  if (q === Q.epic)      return "epic";
  if (q === Q.rare)      return "rare";
  if (q === Q.uncommon)  return "uncommon";
  return "rare"; // fallback
}

// ---------------------------------------------------------------------------
// Tab / Navigation — Spec Picker
// ---------------------------------------------------------------------------
var WOW_ICON = "https://wow.zamimg.com/images/wow/icons/medium/";
var ALL_CLASSES = [
  {name:"Warrior",icon:"classicon_warrior"},
  {name:"Paladin",icon:"classicon_paladin"},
  {name:"Hunter",icon:"classicon_hunter"},
  {name:"Rogue",icon:"classicon_rogue"},
  {name:"Priest",icon:"classicon_priest"},
  {name:"Shaman",icon:"classicon_shaman"},
  {name:"Mage",icon:"classicon_mage"},
  {name:"Warlock",icon:"classicon_warlock"},
  {name:"Druid",icon:"classicon_druid"}
];
var SPEC_ICONS = {
  "Warrior":{"Arms":"ability_rogue_eviscerate","Fury":"ability_warrior_innerrage","Protection":"ability_warrior_defensivestance"},
  "Paladin":{"Holy":"spell_holy_holybolt","Protection":"spell_holy_devotionaura","Retribution":"spell_holy_auraoflight"},
  "Hunter":{"Beast Mastery":"ability_hunter_beasttaming","Marksmanship":"ability_marksmanship","Survival":"ability_hunter_swiftstrike"},
  "Rogue":{"Assassination":"ability_rogue_eviscerate","Combat":"ability_backstab","Subtlety":"ability_stealth"},
  "Priest":{"Discipline":"spell_holy_wordfortitude","Holy":"spell_holy_guardianspirit","Shadow":"spell_shadow_shadowwordpain"},
  "Shaman":{"Elemental":"spell_nature_lightning","Enhancement":"spell_nature_lightningshield","Restoration":"spell_nature_magicimmunity"},
  "Mage":{"Arcane":"spell_holy_magicalsentry","Fire":"spell_fire_firebolt02","Frost":"spell_frost_frostbolt02"},
  "Warlock":{"Affliction":"spell_shadow_deathcoil","Demonology":"spell_shadow_metamorphosis","Destruction":"spell_shadow_rainoffire"},
  "Druid":{"Balance":"spell_nature_starfall","Feral Cat":"ability_druid_catform","Feral Bear":"ability_racial_bearform","Restoration":"spell_nature_healingtouch"}
};

var ALL_SPECS_MAP = {
  "Warrior":["Arms","Fury","Protection"],
  "Paladin":["Holy","Protection","Retribution"],
  "Hunter":["Beast Mastery","Marksmanship","Survival"],
  "Rogue":["Assassination","Combat","Subtlety"],
  "Priest":["Discipline","Holy","Shadow"],
  "Shaman":["Elemental","Enhancement","Restoration"],
  "Mage":["Arcane","Fire","Frost"],
  "Warlock":["Affliction","Demonology","Destruction"],
  "Druid":["Balance","Feral Cat","Feral Bear","Restoration"]
};

function toggleClassNode(el) {
  var wasOpen = el.classList.contains('open');
  // Close all others
  document.querySelectorAll('.class-node.open').forEach(function(n) { n.classList.remove('open'); });
  if (!wasOpen) el.classList.add('open');
}

function buildSpecPicker() {
  var specsByClass = {};
  var keys = Object.keys(SPECS);
  for (var i = 0; i < keys.length; i++) {
    var cls = SPECS[keys[i]].class;
    if (!specsByClass[cls]) specsByClass[cls] = [];
    specsByClass[cls].push(keys[i]);
  }

  var ring = document.getElementById("specPickerRing");
  // Remove old nodes but keep center content
  ring.querySelectorAll('.class-node').forEach(function(n) { n.remove(); });

  // Scale the whole ring to fit viewport while preserving the zero shape
  var vh = window.innerHeight;
  var vw = window.innerWidth;
  var scale = Math.min((vh - 20) / 620, (vw - 20) / 640, 1);
  ring.style.transform = scale < 1 ? 'scale(' + scale.toFixed(3) + ')' : '';
  ring.style.transformOrigin = 'top center';
  ring.style.width = '640px';
  ring.style.height = '620px';
  ring.style.marginBottom = scale < 1 ? Math.round((620 * scale) - 620) + 'px' : '';

  var count = ALL_CLASSES.length; // 9
  var rx = 255; // horizontal radius
  var ry = 270; // vertical radius
  var cx = 320; // center x
  var cy = 310; // center y
  var startAngle = -Math.PI / 2; // start at top

  for (var i = 0; i < count; i++) {
    var cls = ALL_CLASSES[i];
    var angle = startAngle + (2 * Math.PI * i / count);
    var x = cx + rx * Math.cos(angle) - 30;
    var y = cy + ry * Math.sin(angle) - 35;

    var node = document.createElement("div");
    // Drop directions: 0=Warrior(top,down), 1=Paladin(right,right), 2=Hunter(right,left),
    // 3=Rogue(bottom-right,up), 4=Priest(bottom,up), 5=Shaman(bottom-left,up),
    // 6=Mage(left,right), 7=Warlock(left,right), 8=Druid(top-left,left)
    var dropDirs = ["","drop-right","drop-right","drop-right","drop-right","drop-left","drop-left","drop-left","drop-left"];
    var dropClass = dropDirs[i] ? " " + dropDirs[i] : "";
    node.className = "class-node" + dropClass;
    node.setAttribute("data-class", cls.name.toLowerCase());
    node.style.left = x + "px";
    node.style.top = y + "px";

    var html = '<img class="class-icon" src="' + WOW_ICON + cls.icon + '.jpg" alt="' + cls.name + '" onclick="toggleClassNode(this.parentElement)">';
    html += '<div class="class-name">' + cls.name + '</div>';

    html += '<div class="class-card-specs">';
    var possibleSpecs = ALL_SPECS_MAP[cls.name] || [];
    var specIcons = SPEC_ICONS[cls.name] || {};
    for (var s = 0; s < possibleSpecs.length; s++) {
      var specName = possibleSpecs[s];
      var specIcon = specIcons[specName] || "";
      var iconImg = specIcon ? '<img class="spec-icon" src="' + WOW_ICON + specIcon + '.jpg" alt="' + specName + '">' : '';
      var matchKey = null;
      var available = specsByClass[cls.name] || [];
      for (var a = 0; a < available.length; a++) {
        if (SPECS[available[a]].spec === specName) { matchKey = available[a]; break; }
      }
      if (matchKey) {
        html += '<div class="spec-option" onclick="event.stopPropagation();pickSpec(\'' + matchKey + '\')">' + iconImg + specName + '</div>';
      } else {
        html += '<div class="spec-option disabled">' + iconImg + specName + ' <span style="font-size:0.65rem;">(soon)</span></div>';
      }
    }
    html += '</div>';

    node.innerHTML = html;
    ring.appendChild(node);
  }
}

function pickSpec(spec) {
  currentSpec = spec;
  localStorage.setItem("prebis-spec", spec);
  document.getElementById("specPickerOverlay").style.display = "none";
  showMainUI();
  renderCurrentView();
}

function showSpecPicker() {
  document.getElementById("specPickerOverlay").style.display = "";
  document.getElementById("headerSpec").innerHTML = "";
  document.getElementById("viewTabs").style.display = "none";
  document.querySelectorAll(".view").forEach(function(v) { v.classList.remove("active"); });
}

function showMainUI() {
  var spec = SPECS[currentSpec];
  if (!spec) return;
  var classColorMap = {"Mage":"var(--mage-color)","Paladin":"var(--paladin-color)","Warrior":"var(--warrior-color)","Rogue":"var(--rogue-color)","Hunter":"var(--hunter-color)","Warlock":"var(--warlock-color)","Priest":"var(--priest-color)","Shaman":"var(--shaman-color)","Druid":"var(--druid-color)"};
  var classColor = classColorMap[spec.class] || spec.classColor;
  var hSpec = document.getElementById("headerSpec");
  hSpec.innerHTML = '<span class="spec-name" style="color:' + classColor + '">' + spec.icon + ' ' + spec.spec + ' ' + spec.class + '</span>' +
    '<button class="change-spec-btn" onclick="showSpecPicker()">Change Spec</button>';
  document.getElementById("viewTabs").style.display = "";
  // Re-activate current view
  document.getElementById("sheetView").classList.toggle("active", currentView === "sheet");
  document.getElementById("routesView").classList.toggle("active", currentView === "routes");
  document.getElementById("trackerView").classList.toggle("active", currentView === "tracker");
  document.getElementById("raidView").classList.toggle("active", currentView === "raid");
}

function setSpec(spec) {
  pickSpec(spec);
}

function setView(view) {
  currentView = view;
  // Toggle active class on view buttons
  document.querySelectorAll(".view-btn").forEach(function (btn) {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
  // Toggle active class on view containers
  document.getElementById("sheetView").classList.toggle("active", view === "sheet");
  document.getElementById("routesView").classList.toggle("active", view === "routes");
  document.getElementById("trackerView").classList.toggle("active", view === "tracker");
  document.getElementById("raidView").classList.toggle("active", view === "raid");
  renderCurrentView();
}

function renderCurrentView() {
  switch (currentView) {
    case "sheet":   renderSheet();   break;
    case "routes":  renderRoutes();  break;
    case "tracker": renderTracker(); break;
    case "raid":    renderRaidSetup(); break;
  }
}

// ---------------------------------------------------------------------------
// Helpers for spec data access
// ---------------------------------------------------------------------------
function specData() {
  return SPECS[currentSpec];
}

function specSlots() {
  return specData().slots;
}

function bisItem(slotKey) {
  var items = specSlots()[slotKey];
  return items && items.length ? items[0] : null; // rank 1
}

// ---------------------------------------------------------------------------
// Character Sheet (Paperdoll) View
// ---------------------------------------------------------------------------
function toggleSlot(el) {
  var wasOpen = el.classList.contains('open');
  el.classList.toggle('open');
  refreshWowheadLinks();
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      var rect = el.getBoundingClientRect();
      if (!wasOpen && rect.bottom > window.innerHeight) {
        var overflow = rect.bottom - window.innerHeight;
        var nudge = Math.min(overflow + 20, 150);
        window.scrollTo({ top: window.scrollY + nudge, behavior: 'smooth' });
      } else if (wasOpen && rect.top < 0) {
        var nudge = Math.min(Math.abs(rect.top) + 20, 150);
        window.scrollTo({ top: window.scrollY - nudge, behavior: 'smooth' });
      }
    });
  });
}

function loadMoreAlts(btn) {
  var alts = btn.parentElement;
  var hidden = alts.querySelectorAll('[data-alt-hidden]');
  for (var i = 0; i < hidden.length; i++) {
    hidden[i].style.display = '';
    hidden[i].removeAttribute('data-alt-hidden');
  }
  btn.remove();
  refreshWowheadLinks();
}

function gemTooltipText(gem) {
  if (!gem) return '';
  var parts = [];
  var sks = Object.keys(gem.stats);
  for (var k = 0; k < sks.length; k++) parts.push('+' + gem.stats[sks[k]] + ' ' + (STAT_NAMES[sks[k]] || sks[k]));
  if (gem.effect) parts.push(gem.effect);
  return gem.name + (parts.length ? '\n' + parts.join(', ') : '');
}

function enchantTooltipText(ench) {
  if (!ench) return '';
  var parts = [];
  var ekeys = Object.keys(ench.stats);
  for (var e = 0; e < ekeys.length; e++) {
    parts.push('+' + ench.stats[ekeys[e]] + ' ' + (STAT_NAMES[ekeys[e]] || ekeys[e]));
  }
  if (ench.note) parts.push(ench.note);
  var tip = ench.name;
  if (parts.length) tip += '\n' + parts.join(', ');
  if (ench.src) tip += '\n' + ench.src;
  return tip;
}

function renderBisGemsEnchants(slotKey, item) {
  var specSlug = localStorage.getItem("prebis-spec");
  var bisGems = BIS_GEMS[specSlug];
  var bisEnchants = BIS_ENCHANTS[specSlug];
  var hasGems = item.sockets && item.sockets.length && bisGems;
  var ench = null;
  if (bisEnchants && bisEnchants[slotKey]) ench = findEnchantById(slotKey, bisEnchants[slotKey]);
  if (!hasGems && !ench) return '';

  var html = '<div class="ge-row">';

  // Gem dots
  if (hasGems) {
    html += '<span class="ge-gems">';
    var matched = allSocketsMatched(item, bisGems);
    for (var s = 0; s < item.sockets.length; s++) {
      var sc = item.sockets[s];
      var gemId = bisGems[sc];
      var gem = gemId ? GEMS[gemId] : null;
      var gemColor = gem ? gem.color : sc;
      var tip = gemTooltipText(gem);
      html += '<span class="gem-socket ' + gemColor + ' filled" title="' + tip.replace(/"/g, '&quot;') + '"></span>';
    }
    if (item.socketBonus) {
      var bonusParts = [];
      var bkeys = Object.keys(item.socketBonus);
      for (var b = 0; b < bkeys.length; b++) {
        var sn = STAT_NAMES[bkeys[b]] || bkeys[b];
        bonusParts.push('+' + item.socketBonus[bkeys[b]] + ' ' + sn);
      }
      html += '<span class="socket-bonus' + (matched ? ' active' : '') + '">' + bonusParts.join(', ') + '</span>';
    }
    html += '</span>';
  }

  // Separator + enchant name
  if (ench) {
    if (hasGems) html += '<span class="ge-sep">|</span>';
    var tip2 = enchantTooltipText(ench);
    html += '<span class="ge-enchant" title="' + tip2.replace(/"/g, '&quot;') + '">' + ench.name + '</span>';
  }

  html += '</div>';

  return html;
}

function renderGearSlot(slotKey) {
  var allItems = specSlots()[slotKey];
  if (!allItems || !allItems.length) return "";
  // Filter items but always keep the #1 BiS
  var items = [allItems[0]];
  for (var f = 1; f < allItems.length; f++) {
    if (!isItemFiltered(allItems[f])) items.push(allItems[f]);
  }
  var top = items[0];
  var label = SLOT_LABELS[slotKey] || slotKey;
  var qc = qualityClass(top.q);
  var count = items.length;

  var html = '<div class="gear-slot quality-' + qc + '" onclick="toggleSlot(this)">';
  html += '<div class="slot-header">';
  html += '<div class="slot-bis">';
  html += '<div class="slot-label">' + label + '</div>';
  html += '<div class="item-link">' + itemLink(top) + '</div>';
  html += '<div class="item-src">' + top.src + ' ' + sourceTag(top.src) + '</div>';
  html += renderBisGemsEnchants(slotKey, top);
  html += '</div>';
  if (count > 1) html += '<div class="slot-expand">' + count + ' &#9660;</div>';
  html += '</div>';

  if (count > 1) {
    var maxVisible = 5;
    html += '<div class="slot-alts">';
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var rc = i === 0 ? 'r1' : i === 1 ? 'r2' : i === 2 ? 'r3' : '';
      var hidden = i >= maxVisible ? ' style="display:none" data-alt-hidden' : '';
      html += '<div class="alt-item"' + hidden + '>';
      html += '<div class="alt-rank ' + rc + '">' + (i+1) + '</div>';
      html += '<div class="alt-info">';
      html += '<div class="alt-name">' + itemLink(it) + '</div>';
      html += '<div class="alt-src">' + it.src + ' ' + sourceTag(it.src) + '</div>';
      html += '</div></div>';
    }
    if (items.length > maxVisible) {
      html += '<button class="load-more-btn" onclick="event.stopPropagation();loadMoreAlts(this)">Show ' + (items.length - maxVisible) + ' more</button>';
    }
    html += '</div>';
  }
  html += '</div>';
  return html;
}

function addStats(target, source) {
  if (!source) return;
  var keys = Object.keys(source);
  for (var i = 0; i < keys.length; i++) {
    target[keys[i]] = (target[keys[i]] || 0) + source[keys[i]];
  }
}

function allSocketsMatched(item, bisGems) {
  if (!item.sockets) return false;
  for (var i = 0; i < item.sockets.length; i++) {
    var socketColor = item.sockets[i];
    var gemId = bisGems[socketColor];
    var gem = gemId ? GEMS[gemId] : null;
    if (!gem || !gemFits(gem.color, socketColor)) return false;
  }
  return true;
}

function findEnchantById(slot, enchId) {
  var list = ENCHANTS[slot];
  if (typeof list === "string") list = ENCHANTS[list];
  if (!list) return null;
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === enchId) return list[i];
  }
  return null;
}

function computeBisStats() {
  var spec = specData();
  var stats = {};
  var slotKeys = Object.keys(spec.slots);
  var specSlug = localStorage.getItem("prebis-spec");
  // Avoid double-counting weapons: prefer mainhand+offhand over twohand
  var hasMainhand = !!spec.slots["mainhand"];
  var hasTwohand = !!spec.slots["twohand"];
  for (var i = 0; i < slotKeys.length; i++) {
    var sk = slotKeys[i];
    if (sk === "twohand" && hasMainhand) continue;
    if ((sk === "mainhand" || sk === "offhand") && hasTwohand && !hasMainhand) continue;
    var item = bisItem(sk);
    if (!item || !item.stats) continue;
    addStats(stats, item.stats);

    // Add BiS gem stats for this item
    var bisGems = BIS_GEMS[specSlug];
    if (bisGems && item.sockets) {
      for (var s = 0; s < item.sockets.length; s++) {
        var socketColor = item.sockets[s];
        var gemId = bisGems[socketColor];
        var gem = gemId ? GEMS[gemId] : null;
        if (gem && gem.stats) addStats(stats, gem.stats);
      }
      // Add socket bonus if all sockets matched
      if (item.socketBonus && allSocketsMatched(item, bisGems)) {
        addStats(stats, item.socketBonus);
      }
    }
  }

  // Add BiS enchant stats
  var bisEnchants = BIS_ENCHANTS[specSlug];
  if (bisEnchants) {
    var enchSlots = Object.keys(bisEnchants);
    for (var i = 0; i < enchSlots.length; i++) {
      var eSlot = enchSlots[i];
      // Skip weapon enchants using same logic as items
      if (eSlot === "twohand" && hasMainhand) continue;
      if ((eSlot === "mainhand" || eSlot === "offhand") && hasTwohand && !hasMainhand) continue;
      var ench = findEnchantById(eSlot, bisEnchants[eSlot]);
      if (ench && ench.stats) addStats(stats, ench.stats);
    }
  }

  return stats;
}

function getRelevantKeys(spec) {
  var reverseNames = {};
  var snKeys = Object.keys(STAT_NAMES);
  for (var r = 0; r < snKeys.length; r++) reverseNames[STAT_NAMES[snKeys[r]].toLowerCase()] = snKeys[r];
  reverseNames["resilience"] = "res";
  reverseNames["armor"] = "armor";
  var relevantKeys = {};
  if (spec.statWeights) {
    for (var w = 0; w < spec.statWeights.length; w++) {
      var wk = reverseNames[spec.statWeights[w].toLowerCase()];
      if (wk) relevantKeys[wk] = true;
    }
  }
  if (spec.hitCap) relevantKeys.hit = true;
  if (spec.defCap) relevantKeys.def = true;
  return relevantKeys;
}

function ratingToPct(key, val) {
  // TBC level 70 conversion rates
  if (key === 'crit') return (val / 22.08).toFixed(1) + '%';
  if (key === 'hit') return (val / 12.62).toFixed(1) + '%';
  if (key === 'haste') return (val / 15.77).toFixed(1) + '%';
  if (key === 'expertise') return (val / 3.94).toFixed(1);
  return null;
}

function renderStatSummary(stats) {
  var spec = specData();
  var relevantKeys = getRelevantKeys(spec);
  var allKeys = Object.keys(stats).filter(function(k) { return stats[k] > 0; });
  if (!allKeys.length) return '<div class="stat-summary"><div style="font-size:0.8rem;color:var(--text-dim)">No stat data</div></div>';

  var relevant = [], minor = [];
  for (var i = 0; i < allKeys.length; i++) {
    if (stats[allKeys[i]] >= 15) relevant.push(allKeys[i]);
    else minor.push(allKeys[i]);
  }
  relevant.sort(function(a, b) {
    if (a === "hit" || a === "def") return 1;
    if (b === "hit" || b === "def") return -1;
    return (stats[b] || 0) - (stats[a] || 0);
  });
  minor.sort(function(a, b) { return (stats[b] || 0) - (stats[a] || 0); });

  var schoolDmgKeys = {arcaneDmg:1,fireDmg:1,shadowDmg:1,frostDmg:1,natureDmg:1,holyDmg:1};
  var maxVal = 0;
  for (var k = 0; k < relevant.length; k++) {
    if (relevant[k] !== "hit" && relevant[k] !== "def") maxVal = Math.max(maxVal, stats[relevant[k]]);
  }

  var twoCol = relevant.length > 6;
  var html = '<div class="stat-summary' + (twoCol ? ' two-col' : '') + '">';

  for (var j = 0; j < relevant.length; j++) {
    var key = relevant[j];
    var val = stats[key];
    var pct;
    var niceName = STAT_NAMES[key] || key;
    var tip = niceName + ': ' + val;

    if (key === "hit" && spec.hitCap) {
      pct = Math.min(100, Math.round((val / spec.hitCap) * 100));
      tip += ' / ' + spec.hitCap + ' cap';
    } else if (key === "def" && spec.defCap) {
      pct = Math.min(100, Math.round((val / spec.defCap) * 100));
      tip += ' / ' + spec.defCap + ' cap';
    } else {
      pct = maxVal > 0 ? Math.round((val / maxVal) * 100) : 0;
    }
    if (schoolDmgKeys[key] && (stats.sp || 0) > 0) tip += ' (Effective: ' + (stats.sp + val) + ')';

    var fillClass = 'stat-fill';
    if ((key === 'hit' || key === 'def') && pct >= 100) fillClass += ' cap-full';
    else if ((key === 'hit' || key === 'def') && pct >= 70) fillClass += ' cap-hit';

    var isCap = (key === 'hit' && spec.hitCap) || (key === 'def' && spec.defCap);
    var capVal = key === 'hit' ? spec.hitCap : spec.defCap;
    var pctStr = ratingToPct(key, val);
    html += '<div class="stat-row" title="' + tip.replace(/"/g,'&quot;') + '">' +
      '<div class="stat-name">' + niceName + '</div>' +
      '<div class="stat-bar-wrap"><div class="stat-bar"><div class="' + fillClass + '" style="width:' + pct + '%"></div></div></div>' +
      '<div class="stat-val">' + val + (isCap ? '<span class="cap-label' + (val >= capVal ? ' capped' : '') + '">/' + capVal + '</span>' : '') + (pctStr ? '<span class="stat-pct-inline">' + pctStr + '</span>' : '') + '</div>' +
    '</div>';
  }

  if (minor.length) {
    var minorParts = [];
    for (var m = 0; m < minor.length; m++) {
      minorParts.push((STAT_NAMES[minor[m]] || minor[m]) + ' ' + stats[minor[m]]);
    }
    html += '<div class="stat-minor" style="grid-column:1/-1;">' + minorParts.join(' · ') + '</div>';
  }

  html += '</div>';
  return html;
}

function renderStatSummaryVsBis(myStats, bisStats) {
  var spec = specData();
  var relevantKeys = getRelevantKeys(spec);

  var allKeys = {};
  Object.keys(myStats).forEach(function(k) { if (myStats[k] > 0) allKeys[k] = true; });
  Object.keys(bisStats).forEach(function(k) { if (bisStats[k] > 0) allKeys[k] = true; });

  var relevant = [], minor = [];
  var statKeys = Object.keys(allKeys);
  for (var i = 0; i < statKeys.length; i++) {
    var maxOfBoth = Math.max(myStats[statKeys[i]] || 0, bisStats[statKeys[i]] || 0);
    if (maxOfBoth >= 15) relevant.push(statKeys[i]);
    else minor.push(statKeys[i]);
  }
  relevant.sort(function(a, b) {
    if (a === "hit" || a === "def") return 1;
    if (b === "hit" || b === "def") return -1;
    return (bisStats[b] || 0) - (bisStats[a] || 0);
  });
  minor.sort(function(a, b) { return (myStats[b] || 0) - (myStats[a] || 0); });

  var schoolDmgKeys = {arcaneDmg:1,fireDmg:1,shadowDmg:1,frostDmg:1,natureDmg:1,holyDmg:1};
  var twoCol = relevant.length > 6;
  var html = '<div class="stat-summary' + (twoCol ? ' two-col' : '') + '">';

  for (var j = 0; j < relevant.length; j++) {
    var key = relevant[j];
    var mv = myStats[key] || 0;
    var bv = bisStats[key] || 0;
    var diff = mv - bv;
    var diffStr = diff > 0 ? '+' + diff : diff < 0 ? '' + diff : '';
    var cls = diff > 0 ? 'over' : diff < 0 ? 'under' : 'exact';
    var niceName = STAT_NAMES[key] || key;

    var pct;
    var tip = niceName + ': ' + mv;
    if (key === 'hit' && spec.hitCap) {
      pct = Math.min(100, Math.round((mv / spec.hitCap) * 100));
      tip += ' / ' + spec.hitCap + ' cap';
    } else if (key === 'def' && spec.defCap) {
      pct = Math.min(100, Math.round((mv / spec.defCap) * 100));
      tip += ' / ' + spec.defCap + ' cap';
    } else {
      pct = bv > 0 ? Math.min(105, Math.round((mv / bv) * 100)) : (mv > 0 ? 100 : 0);
    }
    if (bv > 0) tip += ' (BiS: ' + bv + ', ' + (diff >= 0 ? '+' : '') + diff + ')';
    if (schoolDmgKeys[key] && (myStats.sp || 0) > 0) tip += ' | Effective: ' + (myStats.sp + mv);

    var fillClass = 'stat-fill';
    if ((key === 'hit' || key === 'def') && pct >= 100) fillClass += ' cap-full';
    else if ((key === 'hit' || key === 'def') && pct >= 70) fillClass += ' cap-hit';
    else if (cls === 'over') fillClass = 'stat-fill cap-full';
    else if (cls === 'under') fillClass = 'stat-fill under';

    var isCap = (key === 'hit' && spec.hitCap) || (key === 'def' && spec.defCap);
    var capVal = key === 'hit' ? spec.hitCap : spec.defCap;
    var pctStr = ratingToPct(key, mv);
    html += '<div class="stat-row" title="' + tip.replace(/"/g,'&quot;') + '">' +
      '<div class="stat-name">' + niceName + '</div>' +
      '<div class="stat-bar-wrap"><div class="stat-bar"><div class="' + fillClass + '" style="width:' + pct + '%"></div></div></div>' +
      '<div class="stat-val">' + mv + (isCap ? '<span class="cap-label' + (mv >= capVal ? ' capped' : '') + '">/' + capVal + '</span>' : '') + (pctStr ? '<span class="stat-pct-inline">' + pctStr + '</span>' : '') + '</div>' +
      (bv > 0 ? '<div class="stat-diff ' + cls + '">' + diffStr + '</div>' : '<div class="stat-diff"></div>') +
    '</div>';
  }

  if (minor.length) {
    var minorParts = [];
    for (var m = 0; m < minor.length; m++) {
      var mk = minor[m];
      minorParts.push((STAT_NAMES[mk] || mk) + ' ' + (myStats[mk] || 0));
    }
    html += '<div class="stat-minor" style="grid-column:1/-1;">' + minorParts.join(' · ') + '</div>';
  }

  html += '</div>';
  return html;
}

function setSheetMode(mode) {
  sheetMode = mode;
  renderSheet();
}

function gemOptionText(gem) {
  var statParts = [];
  var sks = Object.keys(gem.stats);
  for (var k = 0; k < sks.length; k++) statParts.push('+' + gem.stats[sks[k]] + ' ' + (STAT_NAMES[sks[k]] || sks[k]));
  if (gem.effect) statParts.push(gem.effect);
  return gem.name + (statParts.length ? ' (' + statParts.join(', ') + ')' : '');
}

function toggleGeEdit(slotKey) {
  var disp = document.getElementById('ge-display-' + slotKey);
  var edit = document.getElementById('ge-edit-' + slotKey);
  if (!disp || !edit) return;
  var showing = edit.style.display !== 'none';
  disp.style.display = showing ? 'contents' : 'none';
  edit.style.display = showing ? 'none' : '';
}

function renderTrackerGemsEnchants(slotKey, item) {
  var html = '';
  var trackedEnchants = loadTrackerEnchants();
  var trackedGems = loadTrackerGems();
  var hasGems = item && item.sockets && item.sockets.length;
  var enchSlot = slotKey;
  var enchList = ENCHANTS[enchSlot];
  if (typeof enchList === "string") enchList = ENCHANTS[enchList];
  var hasEnchantOptions = (enchList && enchList.length) || trackedEnchants[slotKey];

  if (!hasGems && !hasEnchantOptions) return '';

  var slotGems = trackedGems[slotKey] || [];
  var curEnch = trackedEnchants[slotKey] || '';

  // --- Display mode (BiS-style, single row) ---
  html += '<div class="tracker-ge-display" id="ge-display-' + slotKey + '">';
  html += '<div class="ge-row">';

  if (hasGems) {
    html += '<span class="ge-gems">';
    for (var s = 0; s < item.sockets.length; s++) {
      var sc = item.sockets[s];
      var gId = slotGems[s] || '';
      var gem = gId ? GEMS[gId] : null;
      var gemColor = gem ? gem.color : sc;
      var filled = gId ? ' filled' : '';
      var tip = gem ? gemTooltipText(gem) : (gId ? 'Unknown Gem (ID: ' + gId + ')' : sc.charAt(0).toUpperCase() + sc.slice(1) + ' socket (empty)');
      html += '<span class="gem-socket ' + gemColor + filled + '" title="' + tip.replace(/"/g, '&quot;') + '"></span>';
    }
    if (item.socketBonus) {
      var matched = true;
      for (var s2 = 0; s2 < item.sockets.length; s2++) {
        var gId2 = slotGems[s2];
        var gem2 = gId2 ? GEMS[gId2] : null;
        if (!gem2 || !gemFits(gem2.color, item.sockets[s2])) { matched = false; break; }
      }
      var bonusParts = [];
      var bkeys = Object.keys(item.socketBonus);
      for (var b = 0; b < bkeys.length; b++) bonusParts.push('+' + item.socketBonus[bkeys[b]] + ' ' + (STAT_NAMES[bkeys[b]] || bkeys[b]));
      html += '<span class="socket-bonus' + (matched ? ' active' : '') + '">' + bonusParts.join(', ') + '</span>';
    }
    html += '</span>';
  }

  if (curEnch) {
    var ench = findEnchantById(slotKey, curEnch);
    if (hasGems) html += '<span class="ge-sep">|</span>';
    if (ench) {
      var tip2 = enchantTooltipText(ench);
      html += '<span class="ge-enchant" title="' + tip2.replace(/"/g, '&quot;') + '">' + ench.name + '</span>';
    } else {
      html += '<span class="ge-enchant">Unknown Enchant (ID: ' + curEnch + ')</span>';
    }
  }

  html += '</div>';
  html += '</div>';

  // --- Edit mode (dropdowns, hidden by default) ---
  html += '<div class="tracker-ge-edit" id="ge-edit-' + slotKey + '" style="display:none" onclick="event.stopPropagation()">';

  if (hasGems) {
    html += '<div class="tracker-gems">';
    for (var s3 = 0; s3 < item.sockets.length; s3++) {
      var sc3 = item.sockets[s3];
      var curGem = slotGems[s3] || '';
      var curGemRendered = false;
      html += '<select class="gem-select" onchange="setTrackerGem(\'' + slotKey + '\',' + s3 + ',this.value)">';
      html += '<option value="">' + sc3.charAt(0).toUpperCase() + sc3.slice(1) + ' socket</option>';
      if (curGem && GEMS[curGem] && !gemFits(GEMS[curGem].color, sc3)) {
        html += '<option value="' + curGem + '" selected>' + gemOptionText(GEMS[curGem]) + ' [off-color]</option>';
        curGemRendered = true;
      }
      var gemIds = Object.keys(GEMS);
      for (var g = 0; g < gemIds.length; g++) {
        var gid = parseInt(gemIds[g], 10);
        var gem3 = GEMS[gid];
        if (gemFits(gem3.color, sc3)) {
          var sel = (!curGemRendered && curGem == gid) ? ' selected' : '';
          html += '<option value="' + gid + '"' + sel + '>' + gemOptionText(gem3) + '</option>';
        }
      }
      if (curGem && !GEMS[curGem] && !curGemRendered) {
        html += '<option value="' + curGem + '" selected>Unknown Gem (ID: ' + curGem + ')</option>';
      }
      html += '</select>';
    }
    html += '</div>';
  }

  if (enchList && enchList.length) {
    var curEnchRendered = false;
    html += '<div class="tracker-enchant">';
    html += '<select class="enchant-select" onchange="setTrackerEnchant(\'' + slotKey + '\',this.value)">';
    html += '<option value="">No enchant</option>';
    for (var e = 0; e < enchList.length; e++) {
      var en = enchList[e];
      var sel2 = (curEnch == en.id) ? ' selected' : '';
      if (sel2) curEnchRendered = true;
      var statParts = [];
      var ekeys = Object.keys(en.stats);
      for (var k = 0; k < ekeys.length; k++) statParts.push('+' + en.stats[ekeys[k]] + ' ' + (STAT_NAMES[ekeys[k]] || ekeys[k]));
      if (en.note) statParts.push(en.note);
      html += '<option value="' + en.id + '"' + sel2 + '>' + en.name + (statParts.length ? ' (' + statParts.join(', ') + ')' : '') + '</option>';
    }
    if (curEnch && !curEnchRendered) {
      html += '<option value="' + curEnch + '" selected>Unknown Enchant (ID: ' + curEnch + ')</option>';
    }
    html += '</select></div>';
  } else if (trackedEnchants[slotKey]) {
    html += '<div class="tracker-enchant">';
    html += '<select class="enchant-select" onchange="setTrackerEnchant(\'' + slotKey + '\',this.value)">';
    html += '<option value="">No enchant</option>';
    html += '<option value="' + curEnch + '" selected>Unknown Enchant (ID: ' + curEnch + ')</option>';
    html += '</select></div>';
  }

  html += '<span class="ge-done-btn" onclick="event.stopPropagation();toggleGeEdit(\'' + slotKey + '\')">Done</span>';
  html += '</div>';

  return html;
}

function renderMyGearSlot(slotKey) {
  var spec = specData();
  var allItems = spec.slots[slotKey];
  if (!allItems || !allItems.length) return "";
  var items = allItems.filter(function(it) { return !isItemFiltered(it); });
  if (!items.length) items = [allItems[0]];
  var label = SLOT_LABELS[slotKey] || slotKey;
  var trackedItem = getTrackedItem(slotKey);
  var hasItem = !!trackedItem;
  var qc = hasItem ? qualityClass(trackedItem.q) : "none";

  // Check if this slot has gem/enchant options for edit button
  var hasGeData = false;
  if (hasItem) {
    var enchSlotCheck = slotKey;
    var enchListCheck = ENCHANTS[enchSlotCheck];
    if (typeof enchListCheck === "string") enchListCheck = ENCHANTS[enchListCheck];
    hasGeData = (trackedItem.sockets && trackedItem.sockets.length) || (enchListCheck && enchListCheck.length) || loadTrackerEnchants()[slotKey];
  }

  var html = '<div class="gear-slot mygear-slot quality-' + qc + '" onclick="toggleSlot(this)">';
  html += '<div class="slot-header">';
  html += '<div class="slot-bis">';
  html += '<div class="slot-label">' + label;
  if (hasItem && hasGeData) {
    html += ' <span class="ge-edit-btn" onclick="event.stopPropagation();toggleGeEdit(\'' + slotKey + '\')" title="Edit gems &amp; enchants">&#9998; Edit</span>';
  }
  html += '</div>';
  if (hasItem) {
    if (trackedItem.id) {
      html += '<div class="item-link">' + itemLink(trackedItem) + '</div>';
    } else {
      html += '<div class="item-link">' + trackedItem.name + '</div>';
    }
    html += '<div class="item-src">' + trackedItem.src + (trackedItem.isCustom ? '' : ' ' + sourceTag(trackedItem.src)) + '</div>';
    html += renderTrackerGemsEnchants(slotKey, trackedItem);
  } else {
    html += '<div class="mygear-empty"><span class="needed-badge">Empty — Needed</span></div>';
  }
  html += '</div>';

  // For custom items, all BiS items are upgrades. For BiS items, items ranked higher are upgrades.
  var upgradeCount = items.length; // default: all items are upgrades
  if (hasItem && !trackedItem.isCustom) {
    var tracked = loadTracker();
    var curIdx = parseInt(tracked[slotKey], 10);
    upgradeCount = curIdx; // items before current index are upgrades
  }
  if (upgradeCount > 0) html += '<div class="slot-expand">' + upgradeCount + ' &#9660;</div>';
  html += '</div>';

  // Show upgrade options in dropdown
  if (upgradeCount > 0) {
    var maxVisible = 5;
    html += '<div class="slot-alts">';
    var limit = (hasItem && !trackedItem.isCustom) ? parseInt(loadTracker()[slotKey], 10) : items.length;
    for (var i = 0; i < limit; i++) {
      var it = items[i];
      var rc = i === 0 ? 'r1' : i === 1 ? 'r2' : i === 2 ? 'r3' : '';
      var hidden = i >= maxVisible ? ' style="display:none" data-alt-hidden' : '';
      html += '<div class="alt-item"' + hidden + '>';
      html += '<div class="alt-rank ' + rc + '">' + (i+1) + '</div>';
      html += '<div class="alt-info">';
      html += '<div class="alt-name">' + itemLink(it) + '</div>';
      html += '<div class="alt-src">' + it.src + ' ' + sourceTag(it.src) + '</div>';
      html += '</div></div>';
    }
    if (limit > maxVisible) {
      html += '<button class="load-more-btn" onclick="event.stopPropagation();loadMoreAlts(this)">Show ' + (limit - maxVisible) + ' more</button>';
    }
    html += '</div>';
  }
  html += '</div>';
  return html;
}

function renderSheet() {
  var spec = specData();
  var bis = spec.slots;
  var classColorMap = {"Mage":"var(--mage-color)","Paladin":"var(--paladin-color)","Warrior":"var(--warrior-color)","Rogue":"var(--rogue-color)","Hunter":"var(--hunter-color)","Warlock":"var(--warlock-color)","Priest":"var(--priest-color)","Shaman":"var(--shaman-color)","Druid":"var(--druid-color)"};
  var classColor = classColorMap[spec.class] || spec.classColor;

  // Toggle switch
  var toggleHtml = '<div class="sheet-toggle">';
  toggleHtml += '<button class="sheet-toggle-btn' + (sheetMode === "bis" ? " active" : "") + '" onclick="setSheetMode(\'bis\')">BiS List</button>';
  toggleHtml += '<button class="sheet-toggle-btn' + (sheetMode === "mygear" ? " active" : "") + '" onclick="setSheetMode(\'mygear\')">My Gear</button>';
  toggleHtml += '</div>';
  toggleHtml += '<div style="display:flex;gap:6px;justify-content:center;margin-top:6px;">';
  toggleHtml += '<button class="import-icon-btn" onclick="showFilterModal()" title="Filter items">&#9881; Filters</button>';
  if (sheetMode === "mygear") {
    toggleHtml += '<button class="import-icon-btn" onclick="showImportModal()" title="Import from Addon">&#8681; Import</button>';
  }
  toggleHtml += '</div>';

  // Determine which left/right/weapon slots exist for this spec
  var leftSlots = LEFT_SLOTS.filter(function (s) { return !!bis[s]; });
  var rightSlots = RIGHT_SLOTS.filter(function (s) { return !!bis[s]; });
  var weaponBottom = WEAPON_SLOTS_BOTTOM.filter(function (s) { return !!bis[s]; });
  var mhWithoutLibram = ["mainhand","offhand","wand"].filter(function (s) { return !!bis[s]; });
  var libramGoesBottom = weaponBottom.length > 0 && mhWithoutLibram.length === 0 && !!bis.libram;
  var weaponMH = WEAPON_SLOTS_MH.filter(function (s) {
    if (s === 'libram' && libramGoesBottom) return false;
    return !!bis[s];
  });

  var renderSlotFn = sheetMode === "mygear" ? renderMyGearSlot : renderGearSlot;

  // Build columns
  var leftHtml = '<div class="slot-column">';
  for (var i = 0; i < leftSlots.length; i++) leftHtml += renderSlotFn(leftSlots[i]);
  leftHtml += '</div>';

  var rightHtml = '<div class="slot-column">';
  for (var i = 0; i < rightSlots.length; i++) rightHtml += renderSlotFn(rightSlots[i]);
  rightHtml += '</div>';

  // Center panel: toggle + stats + weapons in middle
  var bisStats = computeBisStats();
  var centerHtml = '<div class="center-column">';
  centerHtml += toggleHtml;

  if (sheetMode === "mygear") {
    var myStats = getTrackerStats();
    centerHtml += '<div class="character-model compact">' +
      '<div class="spec-title" style="color:' + classColor + ';margin-bottom:6px;font-size:0.85rem;">' + spec.icon + ' ' + spec.spec + ' ' + spec.class + '</div>' +
      '<div class="stat-subtitle">compared to bis</div>' +
      renderStatSummaryVsBis(myStats, bisStats) +
      '</div>';
  } else {
    centerHtml += '<div class="character-model compact">' +
      '<div class="spec-title" style="color:' + classColor + ';margin-bottom:6px;font-size:0.85rem;">' + spec.icon + ' ' + spec.spec + ' ' + spec.class + '</div>' +
      (spec.notes ? '<div class="spec-notes">' + spec.notes + '</div>' : '') +
      '<div style="font-size:0.65rem;color:var(--text-dim);margin-bottom:4px;opacity:0.7;">Stats include gems &amp; enchants</div>' +
      renderStatSummary(bisStats) +
      '</div>';
  }

  // Weapons in center column — MH/OH side by side
  if (weaponMH.length) {
    centerHtml += '<div class="weapon-mid">';
    for (var i = 0; i < weaponMH.length; i++) centerHtml += renderSlotFn(weaponMH[i]);
    centerHtml += '</div>';
  }

  // 2H below weapons — merge with libram on same row if no MH row
  if (weaponBottom.length) {
    var soloTwohand = !libramGoesBottom && weaponBottom.length === 1;
    centerHtml += '<div class="weapon-bottom' + (libramGoesBottom ? ' weapon-bottom-pair' : '') + (soloTwohand ? ' weapon-bottom-solo' : '') + '">';
    for (var i = 0; i < weaponBottom.length; i++) centerHtml += renderSlotFn(weaponBottom[i]);
    if (libramGoesBottom) centerHtml += renderSlotFn('libram');
    centerHtml += '</div>';
  }

  centerHtml += '</div>';

  document.getElementById("sheetView").innerHTML =
    '<div class="paperdoll-container">' + leftHtml + centerHtml + rightHtml + '</div>';

  // Equalize card heights across left + right columns
  var headers = document.querySelectorAll('.slot-column .slot-header');
  var maxH = 0;
  for (var h = 0; h < headers.length; h++) {
    headers[h].style.minHeight = '';
    var hh = headers[h].offsetHeight;
    if (hh > maxH) maxH = hh;
  }
  if (maxH > 0) {
    for (var h2 = 0; h2 < headers.length; h2++) headers[h2].style.minHeight = maxH + 'px';
  }

  refreshWowheadLinks();
}

// ---------------------------------------------------------------------------
// Gearing Routes View
// ---------------------------------------------------------------------------
function parseDungeonGroup(src) {
  var s = src.toLowerCase();

  // Crafted
  var professions = ["tailoring", "blacksmithing", "leatherworking", "jewelcrafting", "engineering", "alchemy"];
  for (var i = 0; i < professions.length; i++) {
    if (s.includes(professions[i])) return professions[i].charAt(0).toUpperCase() + professions[i].slice(1);
  }
  if (s.includes("craft")) return "Crafted";

  // Badges
  if (s.includes("badge") || s.includes("g'eras")) return "Badges of Justice";

  // PvP
  if (s.includes("honor") || s.includes("pvp") || s.includes("arena") || s.includes("gladiator")) return "PvP Rewards";

  // Quest
  if (s.includes("quest")) return "Quest Rewards";

  // Reputation
  if (s.includes("exalted") || s.includes("revered") || s.includes("honored") || s.includes("faction") || s.includes("reputation")) {
    // Try to extract faction name
    // Format is often "Revered - Faction Name" or "Faction (Exalted)"
    var dashIdx = src.indexOf(" - ");
    if (dashIdx !== -1) return src.substring(dashIdx + 3).trim();
    var parenIdx = src.indexOf("(");
    if (parenIdx !== -1) return src.substring(0, parenIdx).trim();
    return src; // return as-is
  }

  // World
  if (s.includes("world drop") || s.includes("boe")) return "World Drops / BoE";

  // Classic
  if (s.includes("classic") || s.includes("naxx") || s.includes("aq") || s.includes("bwl") || s.includes("molten")) return "Classic Raids";

  // Default: use source as dungeon name (clean up a bit)
  // Strip boss names after " - " to group by dungeon
  var dash = src.indexOf(" - ");
  if (dash !== -1) return src.substring(0, dash).trim();
  return src.trim() || "Unknown";
}

function sourceTypeKey(src) {
  var s = src.toLowerCase();
  if (s.includes("heroic")) return "heroic";
  if (s.includes("badge") || s.includes("g'eras")) return "badge";
  if (s.includes("honor") || s.includes("pvp") || s.includes("arena")) return "pvp";
  if (s.includes("tailoring") || s.includes("blacksmithing") || s.includes("leatherworking") ||
      s.includes("jewelcrafting") || s.includes("engineering") || s.includes("alchemy") || s.includes("craft")) return "craft";
  if (s.includes("quest")) return "quest";
  if (s.includes("exalted") || s.includes("revered") || s.includes("honored")) return "rep";
  if (s.includes("world drop") || s.includes("boe")) return "world";
  if (s.includes("classic") || s.includes("naxx") || s.includes("aq") || s.includes("bwl") || s.includes("molten")) return "classic";
  return "dungeon";
}

function sourceEmoji(type) {
  switch(type) {
    case "heroic": return "\u2694\uFE0F";
    case "badge": return "\uD83E\uDE99";
    case "craft": return "\uD83D\uDD28";
    case "rep": return "\uD83D\uDCDC";
    case "classic": return "\uD83D\uDC80";
    case "quest": return "\u2757";
    case "pvp": return "\uD83C\uDFF4";
    case "world": return "\uD83C\uDF0D";
    default: return "\uD83D\uDDE1\uFE0F";
  }
}

// Source category definitions
var SOURCE_CATEGORIES = [
  {key:'dungeon', label:'Dungeons', icon:'\uD83D\uDDE1\uFE0F'},
  {key:'heroic',  label:'Heroic Dungeons', icon:'\u2694\uFE0F'},
  {key:'craft',   label:'Crafting', icon:'\uD83D\uDD28'},
  {key:'rep',     label:'Reputation', icon:'\uD83D\uDCDC'},
  {key:'_other',  label:'Other', icon:'\u2B50'}
];
// Keys that get lumped into "Other"
var OTHER_KEYS = ['badge','classic','quest','world','pvp'];

// Find the first matching item from spec data for a priority text string
function findPrioItemId(prioText, spec) {
  var slotKeys = Object.keys(spec.slots);
  // Exact name match first
  for (var i = 0; i < slotKeys.length; i++) {
    var items = spec.slots[slotKeys[i]];
    for (var j = 0; j < items.length; j++) {
      if (prioText.includes(items[j].name)) return items[j].id;
    }
  }
  // Fuzzy: check if item name's first two words (e.g. "Spellfire Robe") match
  // where the set name appears (e.g. "Spellfire Set")
  var prioLower = prioText.toLowerCase();
  for (var i = 0; i < slotKeys.length; i++) {
    var items = spec.slots[slotKeys[i]];
    for (var j = 0; j < items.length; j++) {
      var words = items[j].name.split(" ");
      if (words.length >= 2 && prioLower.includes(words[0].toLowerCase()) && items[j].q >= 3) {
        return items[j].id;
      }
    }
  }
  return 0;
}

// Wowhead medium icon URL by item ID (loaded via their CDN)
function wowheadIconUrl(itemId) {
  return 'https://wow.zamimg.com/images/wow/icons/medium/' + itemId + '.jpg';
}

// Routes: cached groups for detail panel rendering
var _routeGroups = {};
var _routeGroupNames = [];
var _activeSource = null;

function toggleCategory(el) {
  el.closest('.source-category').classList.toggle('cat-open');
}

function selectSource(name) {
  _activeSource = name;
  document.querySelectorAll('.source-row').forEach(function(r) {
    r.classList.toggle('source-active', r.getAttribute('data-source-name') === name);
  });
  // Also expand the parent category
  var activeRow = document.querySelector('.source-row.source-active');
  if (activeRow) {
    var cat = activeRow.closest('.source-category');
    if (cat && !cat.classList.contains('cat-open')) cat.classList.add('cat-open');
  }
  renderDetailPanel();
}

function renderDetailPanel() {
  var panel = document.getElementById('route-detail-panel');
  if (!panel) return;
  if (!_activeSource || !_routeGroups[_activeSource]) {
    panel.innerHTML = '<div class="detail-panel-empty">Select a source to see its items</div>';
    return;
  }
  var grp = _routeGroups[_activeSource];
  var type = grp.type;
  var ownedPct = grp.total > 0 ? Math.round(((grp.total - grp.remaining) / grp.total) * 100) : 0;
  var barColors = {heroic:'#8844cc',badge:'#c8aa6e',craft:'#cc7722',rep:'#33aa33',classic:'#8b6633',dungeon:'#2266bb',quest:'#aaaa33',pvp:'#cc3333',world:'#7744aa'};
  var barColor = barColors[type] || '#555';

  var html = '<div class="detail-panel-header">';
  html += '<div class="detail-title"><span>' + sourceEmoji(type) + '</span> ' + _activeSource + '</div>';
  html += '<div class="detail-count">' + (grp.remaining === 0 ? '<strong>\u2713 All owned</strong>' : '<strong>' + (grp.total - grp.remaining) + '</strong> / ' + grp.total + ' owned \u2014 ' + grp.remaining + ' remaining') + '</div>';
  html += '<div class="detail-bar"><div class="detail-bar-fill" style="width:' + ownedPct + '%;background:' + barColor + ';"></div></div>';
  html += '</div>';

  html += '<div class="detail-panel-body">';
  html += '<ul class="item-list">';
  for (var e = 0; e < grp.entries.length; e++) {
    var entry = grp.entries[e];
    var label = SLOT_LABELS[entry.slotKey] || entry.slotKey;
    var owned = isItemOwnedInTracker(entry.slotKey, entry.item.id);
    html += '<li' + (owned ? ' class="owned-strike"' : '') + '>';
    html += '<span class="slot-tag">' + label + '</span>';
    html += itemLink(entry.item);
    html += '<span class="owned-indicator ' + (owned ? 'is-owned' : 'is-needed') + '">' + (owned ? '\u2713 Owned' : 'Need') + '</span>';
    html += '</li>';
  }
  html += '</ul></div>';

  panel.innerHTML = html;
  refreshWowheadLinks();
}

function filterRouteSources() {
  var input = document.getElementById('routes-search');
  if (!input) return;
  var q = input.value.toLowerCase().trim();
  var firstVisible = null;

  document.querySelectorAll('.source-category').forEach(function(cat) {
    var rows = cat.querySelectorAll('.source-row');
    var anyVisible = false;
    rows.forEach(function(row) {
      var name = row.getAttribute('data-source-name') || '';
      var items = row.getAttribute('data-item-names') || '';
      var match = !q || name.toLowerCase().includes(q) || items.toLowerCase().includes(q);
      row.style.display = match ? '' : 'none';
      if (match) { anyVisible = true; if (!firstVisible) firstVisible = name; }
    });
    // Hide entire category if no children match; expand if searching
    cat.style.display = anyVisible ? '' : 'none';
    if (q && anyVisible) cat.classList.add('cat-open');
    else if (!q) cat.classList.remove('cat-open');
  });
  if (q && firstVisible) selectSource(firstVisible);
}

function renderRoutes() {
  var spec = specData();
  var tracked = loadTracker();
  var html = '<div class="routes-container">';

  html += '<div class="routes-two-col">';

  // ====== LEFT COLUMN: Priority Upgrades ======
  html += '<div class="priority-sidebar">';
  var prio = PRIORITY_ORDER[currentSpec];
  if (prio && prio.length) {
    var ownedCount = 0;
    var prioItems = [];
    for (var i = 0; i < prio.length; i++) {
      var owned = false;
      var slotKeys = Object.keys(spec.slots);
      for (var sk = 0; sk < slotKeys.length; sk++) {
        var tval = tracked[slotKeys[sk]];
        if (tval === undefined || tval === "") continue;
        var tStr = String(tval);
        if (tStr.indexOf("c:") === 0) {
          var custom = parseCustomItem(tStr);
          if (custom && prio[i].includes(custom.name)) { owned = true; break; }
        } else {
          var idx = parseInt(tStr, 10);
          var items = spec.slots[slotKeys[sk]];
          if (items && items[idx] && prio[i].includes(items[idx].name)) { owned = true; break; }
        }
      }
      if (owned) ownedCount++;
      prioItems.push({text: prio[i], owned: owned});
    }

    html += '<div class="routes-section-title">Priority Upgrades</div>';
    html += '<div class="prio-ring-wrap">';
    html += '<div class="prio-ring">';

    // SVG background ring track + progress arc
    var total = prio.length;
    var pctDone = total > 0 ? (ownedCount / total) : 0;
    var radius = 126;
    var cx = 150, cy = 150;
    var circumference = 2 * Math.PI * radius;
    var dashOffset = circumference * (1 - pctDone);
    html += '<svg viewBox="0 0 300 300">';
    html += '<circle cx="' + cx + '" cy="' + cy + '" r="' + radius + '" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="3"/>';
    html += '<circle cx="' + cx + '" cy="' + cy + '" r="' + radius + '" fill="none" stroke="var(--uncommon)" stroke-width="3" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + dashOffset + '" stroke-linecap="round" transform="rotate(-90 ' + cx + ' ' + cy + ')" opacity="0.4"/>';
    html += '</svg>';

    // Center label
    html += '<div class="prio-ring-center">';
    html += '<div class="ring-count">' + ownedCount + '/' + total + '</div>';
    html += '<div class="ring-label">acquired</div>';
    html += '</div>';

    // Position chips in a circle with item icons
    for (var i = 0; i < prioItems.length; i++) {
      var pi = prioItems[i];
      var parts = pi.text.split(" \u2014 ");
      var itemName = parts[0] || pi.text;
      var itemMeta = parts[1] || "";
      var itemId = findPrioItemId(pi.text, spec);
      var angle = ((i / total) * 360) - 90; // start from top
      var rad = angle * (Math.PI / 180);
      var chipX = cx + radius * Math.cos(rad);
      var chipY = cy + radius * Math.sin(rad);
      html += '<div class="prio-chip' + (pi.owned ? ' prio-owned' : '') + '" style="left:' + chipX + 'px;top:' + chipY + 'px;transform:translate(-50%,-50%)">';
      if (itemId) {
        html += '<a href="https://www.wowhead.com/tbc/item=' + itemId + '" class="prio-icon-link" data-wh-icon-size="large">' + itemName + '</a>';
      }
      html += '<div class="prio-num">' + (i + 1) + '</div>';
      html += '<div class="prio-tooltip">';
      html += '<div>' + itemName + (pi.owned ? ' \u2713' : '') + '</div>';
      if (itemMeta) html += '<div class="tt-meta">' + itemMeta + '</div>';
      html += '</div>';
      html += '</div>';
    }

    html += '</div>'; // end prio-ring

    // Legend list below ring
    html += '<ol class="prio-legend">';
    for (var i = 0; i < prioItems.length; i++) {
      var pi = prioItems[i];
      var parts = pi.text.split(" \u2014 ");
      var itemName = parts[0] || pi.text;
      var itemMeta = parts[1] || "";
      html += '<li class="prio-legend-item' + (pi.owned ? ' prio-legend-owned' : '') + '">';
      html += '<span class="prio-legend-name">' + itemName + '</span>';
      if (itemMeta) html += '<span class="prio-legend-meta"> — ' + itemMeta + '</span>';
      if (pi.owned) html += '<span class="prio-legend-check"> \u2713</span>';
      html += '</li>';
    }
    html += '</ol>';

    html += '</div>'; // end prio-ring-wrap
  }
  html += '</div>'; // end priority-sidebar

  // ====== RIGHT COLUMN: Source list + Detail panel ======
  html += '<div>';
  html += '<div class="routes-section-title">Items By Source</div>';
  html += '<input type="text" class="routes-search" id="routes-search" placeholder="Search sources or items..." oninput="filterRouteSources()">';

  // Build groups
  _routeGroups = {};
  var slotKeys = Object.keys(spec.slots);
  for (var i = 0; i < slotKeys.length; i++) {
    var items = spec.slots[slotKeys[i]];
    for (var j = 0; j < items.length; j++) {
      var item = items[j];
      if (isItemFiltered(item)) continue;
      var group = parseDungeonGroup(item.src);
      if (!_routeGroups[group]) _routeGroups[group] = { entries:[], type: sourceTypeKey(item.src) };
      _routeGroups[group].entries.push({ item: item, slotKey: slotKeys[i] });
    }
  }

  _routeGroupNames = Object.keys(_routeGroups);
  for (var g = 0; g < _routeGroupNames.length; g++) {
    var grp = _routeGroups[_routeGroupNames[g]];
    grp.remaining = 0;
    grp.total = grp.entries.length;
    for (var e = 0; e < grp.entries.length; e++) {
      if (!isItemOwnedInTracker(grp.entries[e].slotKey, grp.entries[e].item.id)) grp.remaining++;
    }
  }
  _routeGroupNames.sort(function(a, b) { return _routeGroups[b].remaining - _routeGroups[a].remaining; });

  html += '<div class="source-list-detail">';

  // Source list (left) — grouped by category
  html += '<div class="source-list-col">';

  // Build category → sources mapping
  var catGroups = {}; // catKey → [{name, grp}]
  for (var g = 0; g < _routeGroupNames.length; g++) {
    var name = _routeGroupNames[g];
    var grp = _routeGroups[name];
    var catKey = OTHER_KEYS.indexOf(grp.type) !== -1 ? '_other' : grp.type;
    if (!catGroups[catKey]) catGroups[catKey] = [];
    catGroups[catKey].push({name: name, grp: grp});
  }

  // Sort sources within each category by remaining (most needed first)
  for (var ck in catGroups) {
    catGroups[ck].sort(function(a, b) { return b.grp.remaining - a.grp.remaining; });
  }

  var firstSource = null;
  for (var c = 0; c < SOURCE_CATEGORIES.length; c++) {
    var cat = SOURCE_CATEGORIES[c];
    var sources = catGroups[cat.key];
    if (!sources || !sources.length) continue;

    // Aggregate category totals
    var catTotal = 0, catOwned = 0;
    for (var s = 0; s < sources.length; s++) {
      catTotal += sources[s].grp.total;
      catOwned += sources[s].grp.total - sources[s].grp.remaining;
    }
    var catPct = catTotal > 0 ? Math.round((catOwned / catTotal) * 100) : 0;

    html += '<div class="source-category cat-' + cat.key + '">';
    html += '<div class="source-cat-header" onclick="toggleCategory(this)">';
    html += '<span class="cat-icon">' + cat.icon + '</span>';
    html += '<span class="cat-label">' + cat.label + '</span>';
    html += '<span class="cat-count"><strong>' + catOwned + '</strong>/' + catTotal + '</span>';
    html += '<div class="cat-bar"><div class="cat-bar-fill" style="width:' + catPct + '%"></div></div>';
    html += '<span class="cat-arrow">&#9660;</span>';
    html += '</div>';
    html += '<div class="source-cat-children">';
    for (var s = 0; s < sources.length; s++) {
      var src = sources[s];
      var isComplete = src.grp.remaining === 0;
      var itemNames = src.grp.entries.map(function(e) { return e.item.name; }).join(',');
      if (!firstSource) firstSource = src.name;
      html += '<div class="source-row' + (isComplete ? ' source-complete' : '') + '" data-source-name="' + src.name.replace(/"/g,'&quot;') + '" data-item-names="' + itemNames.replace(/"/g,'&quot;') + '" onclick="selectSource(\'' + src.name.replace(/'/g,"\\'") + '\')">';
      html += '<span class="source-name">' + src.name + '</span>';
      html += '<span class="source-count">' + (isComplete ? '\u2713' : '<strong>' + (src.grp.total - src.grp.remaining) + '</strong>/' + src.grp.total) + '</span>';
      html += '</div>';
    }
    html += '</div></div>'; // end children + category
  }

  html += '</div>'; // end source-list-col

  // Detail panel (right, sticky)
  html += '<div class="detail-panel" id="route-detail-panel"></div>';

  html += '</div>'; // end source-list-detail
  html += '</div>'; // end right column
  html += '</div>'; // end routes-two-col
  html += '</div>'; // end routes-container
  document.getElementById("routesView").innerHTML = html;

  // All collapsed, nothing selected by default
  _activeSource = null;
  renderDetailPanel();
  refreshWowheadLinks();
}

// ---------------------------------------------------------------------------
// Gear Tracker View
// ---------------------------------------------------------------------------
function trackerKey() {
  return "prebis-tracker-" + currentSpec;
}

function loadTracker() {
  try {
    var raw = localStorage.getItem(trackerKey());
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveTracker(data) {
  localStorage.setItem(trackerKey(), JSON.stringify(data));
}

function trackItem(slot, index) {
  var data = loadTracker();
  if (index === "" || index === null || index === undefined) {
    delete data[slot];
  } else {
    data[slot] = index;
  }
  saveTracker(data);
  renderTracker();
  // Cross-tab: if routes or sheet are visible, they'll pick up changes on next render
  // Dispatch a custom event for any listeners
  window.dispatchEvent(new CustomEvent('tracker-changed'));
}

function resetTracker() {
  if (confirm("Reset all tracked gear for this spec?")) {
    localStorage.removeItem(trackerKey());
    localStorage.removeItem(trackerEnchantsKey());
    localStorage.removeItem(trackerGemsKey());
    renderTracker();
  }
}

function trackerEnchantsKey() {
  return "prebis-tracker-enchants-" + currentSpec;
}
function trackerGemsKey() {
  return "prebis-tracker-gems-" + currentSpec;
}
function loadTrackerEnchants() {
  try { var r = localStorage.getItem(trackerEnchantsKey()); return r ? JSON.parse(r) : {}; } catch(e) { return {}; }
}
function saveTrackerEnchants(data) {
  localStorage.setItem(trackerEnchantsKey(), JSON.stringify(data));
}
function loadTrackerGems() {
  try { var r = localStorage.getItem(trackerGemsKey()); return r ? JSON.parse(r) : {}; } catch(e) { return {}; }
}
function saveTrackerGems(data) {
  localStorage.setItem(trackerGemsKey(), JSON.stringify(data));
}
function setTrackerEnchant(slot, enchId) {
  var data = loadTrackerEnchants();
  if (enchId === "" || enchId === null || enchId === undefined) {
    delete data[slot];
  } else {
    data[slot] = parseInt(enchId, 10);
  }
  saveTrackerEnchants(data);
  renderSheet();
}
function setTrackerGem(slot, socketIdx, gemId) {
  var data = loadTrackerGems();
  if (!data[slot]) data[slot] = [];
  if (gemId === "" || gemId === null || gemId === undefined) {
    data[slot][socketIdx] = null;
  } else {
    data[slot][socketIdx] = parseInt(gemId, 10);
  }
  saveTrackerGems(data);
  renderSheet();
}

function getTrackerStats() {
  var spec = specData();
  var tracked = loadTracker();
  var trackedEnchants = loadTrackerEnchants();
  var trackedGems = loadTrackerGems();
  var stats = {};
  var _log = [];
  // Determine which weapon setup is active to avoid double-counting
  var hasTrackedMainhand = tracked["mainhand"] !== undefined && tracked["mainhand"] !== "";
  var hasTrackedTwohand = tracked["twohand"] !== undefined && tracked["twohand"] !== "";
  var allSlots = Object.keys(spec.slots);
  for (var i = 0; i < allSlots.length; i++) {
    var slot = allSlots[i];
    // Skip twohand if mainhand is tracked (prefer MH+OH)
    if (slot === "twohand" && hasTrackedMainhand) continue;
    // Skip mainhand/offhand if twohand is tracked but mainhand is not
    if ((slot === "mainhand" || slot === "offhand") && hasTrackedTwohand && !hasTrackedMainhand) continue;

    var item = getTrackedItem(slot);
    if (!item) { _log.push(slot + ': (empty)'); continue; }
    var slotLog = slot + ': ' + item.name + (item.isCustom ? ' [CUSTOM]' : ' [BiS]');
    if (item.stats) {
      addStats(stats, item.stats);
      slotLog += ' stats=' + JSON.stringify(item.stats);
    } else {
      slotLog += ' stats=NULL';
    }

    // Add tracked gem stats
    if (item.sockets && trackedGems[slot]) {
      var slotGems = trackedGems[slot];
      var gemParts = [];
      for (var s = 0; s < item.sockets.length; s++) {
        var gId = slotGems[s];
        if (gId) {
          var gem = GEMS[gId];
          if (gem && gem.stats) {
            addStats(stats, gem.stats);
            gemParts.push(gem.name + '(' + JSON.stringify(gem.stats) + ')');
          } else {
            gemParts.push('id:' + gId + '(UNKNOWN)');
          }
        } else {
          gemParts.push('empty');
        }
      }
      slotLog += ' gems=[' + gemParts.join(', ') + ']';
      // Socket bonus check
      if (item.socketBonus) {
        var allMatched = true;
        for (var s = 0; s < item.sockets.length; s++) {
          var gId = slotGems[s];
          var gem = gId ? GEMS[gId] : null;
          if (!gem || !gemFits(gem.color, item.sockets[s])) { allMatched = false; break; }
        }
        if (allMatched) {
          addStats(stats, item.socketBonus);
          slotLog += ' bonus=' + JSON.stringify(item.socketBonus);
        } else {
          slotLog += ' bonus=UNMATCHED(' + JSON.stringify(item.socketBonus) + ' sockets=' + JSON.stringify(item.sockets) + ')';
        }
      }
    } else if (item.sockets && !trackedGems[slot]) {
      slotLog += ' sockets=' + JSON.stringify(item.sockets) + ' (no gems tracked)';
    } else if (!item.sockets) {
      slotLog += ' (no sockets)';
    }

    // Add tracked enchant stats
    if (trackedEnchants[slot]) {
      var ench = findEnchantById(slot, trackedEnchants[slot]);
      if (ench && ench.stats) {
        addStats(stats, ench.stats);
        slotLog += ' ench=' + ench.name + '(' + JSON.stringify(ench.stats) + ')';
      } else {
        slotLog += ' ench=id:' + trackedEnchants[slot] + '(NOT FOUND)';
      }
    }
    _log.push(slotLog);
  }
  console.group('[TZ Stats] Tracker stat computation');
  for (var l = 0; l < _log.length; l++) console.log(_log[l]);
  console.log('[TZ Stats] TOTAL:', JSON.stringify(stats));
  console.groupEnd();
  return stats;
}

function renderTrackerStats(stats) {
  var keys = Object.keys(stats);
  if (!keys.length) return '<div style="font-size:0.85rem;color:var(--text-dim);text-align:center;padding:8px 0;">No items selected yet.</div>';
  var html = '<div style="display:flex;flex-wrap:wrap;gap:8px 16px;justify-content:center;padding:8px 0;">';
  for (var i = 0; i < keys.length; i++) {
    var niceName = STAT_NAMES[keys[i]] || keys[i].charAt(0).toUpperCase() + keys[i].slice(1).replace(/([A-Z])/g, ' $1');
    html += '<span style="font-size:0.82rem;color:var(--text-dim);">' + niceName + ': <strong style="color:var(--text-gold);">' + stats[keys[i]] + '</strong></span>';
  }
  html += '</div>';
  return html;
}

// Typeahead state
var activeTypeahead = null; // {slot, highlightIdx}

function openTypeahead(slot) {
  // Close any other open typeaheads first
  document.querySelectorAll('.typeahead-dropdown.open').forEach(function(d) { d.classList.remove('open'); });
  var input = document.getElementById('ta-input-' + slot);
  if (input) input.select(); // Select all text so user can immediately type over
  var dd = document.getElementById('ta-dd-' + slot);
  if (dd) { dd.classList.add('open'); filterTypeahead(slot); }
  activeTypeahead = { slot: slot, highlightIdx: -1 };
}

function closeTypeahead(slot) {
  var dd = document.getElementById('ta-dd-' + slot);
  if (dd) dd.classList.remove('open');
  // Restore display name if user didn't select anything
  var input = document.getElementById('ta-input-' + slot);
  if (input) {
    var item = getTrackedItem(slot);
    input.value = item ? item.name : '';
  }
  activeTypeahead = null;
}

var _whSearchTimer = null;
var _whSearchCache = {};
var _whSearchSlot = null;

function filterTypeahead(slot) {
  var input = document.getElementById('ta-input-' + slot);
  var dd = document.getElementById('ta-dd-' + slot);
  if (!input || !dd) return;
  var query = input.value.toLowerCase().trim();

  // Render BiS items immediately
  renderTypeaheadOptions(slot, query, []);

  // Debounced Wowhead search for non-BiS items
  if (_whSearchTimer) clearTimeout(_whSearchTimer);
  _whSearchSlot = slot;
  if (query.length >= 4) {
    _whSearchTimer = setTimeout(function() { searchWowhead(slot, query); }, 600);
  }
}

function renderTypeaheadOptions(slot, query, whResults) {
  var dd = document.getElementById('ta-dd-' + slot);
  if (!dd) return;
  var spec = specData();
  var items = spec.slots[slot] || [];
  var html = '';
  var bisIds = {};

  // Always show "Not obtained" option
  html += '<div class="typeahead-option" data-idx="" data-type="clear" onmousedown="selectTypeahead(\'' + slot + '\', \'\', \'clear\')"><em style="color:var(--text-dim);">&mdash; Not obtained &mdash;</em></div>';

  // BiS items
  for (var j = 0; j < items.length; j++) {
    if (isItemFiltered(items[j])) continue;
    if (query && !items[j].name.toLowerCase().includes(query) && !items[j].src.toLowerCase().includes(query)) continue;
    bisIds[items[j].id] = true;
    html += '<div class="typeahead-option" data-idx="' + j + '" data-type="bis" onmousedown="selectTypeahead(\'' + slot + '\', \'' + j + '\', \'bis\')">';
    html += '<div>' + items[j].name + '</div>';
    html += '<div class="ta-src">' + items[j].src + '</div>';
    html += '</div>';
  }

  // Wowhead search results (exclude items already in BiS list)
  if (whResults.length > 0) {
    html += '<div style="border-top:2px solid var(--border-dim);padding:4px 10px;font-size:0.65rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.5px;">Wowhead Results</div>';
    for (var k = 0; k < whResults.length; k++) {
      var wh = whResults[k];
      if (bisIds[wh.id]) continue;
      html += '<div class="typeahead-option" data-type="wowhead" data-wh-id="' + wh.id + '" data-wh-name="' + wh.name.replace(/"/g, '&quot;') + '" onmousedown="selectWowheadItem(\'' + slot + '\',' + wh.id + ',\'' + wh.name.replace(/'/g, "\\'") + '\')">';
      html += '<div>' + wh.name + '</div>';
      var qualColors = {4:'var(--epic)',3:'var(--rare)',2:'var(--uncommon)',1:'#9d9d9d'};
      var qCol = qualColors[wh.quality] || 'var(--text-dim)';
      html += '<div class="ta-src" style="color:' + qCol + '">iLvl ' + wh.level + (wh.source || '') + '</div>';
      html += '</div>';
    }
  } else if (query.length >= 3 && _whSearchTimer) {
    html += '<div style="border-top:2px solid var(--border-dim);padding:6px 10px;font-size:0.7rem;color:var(--text-dim);font-style:italic;">Searching Wowhead...</div>';
  }

  dd.innerHTML = html;
  if (activeTypeahead) activeTypeahead.highlightIdx = -1;
}

function searchWowhead(slot, query) {
  var cacheKey = slot + ':' + query;
  if (_whSearchCache[cacheKey]) {
    renderTypeaheadOptions(slot, query, _whSearchCache[cacheKey]);
    return;
  }
  var cleanQuery = query.replace(/['']/g, '').replace(/[^\w\s-]/g, ' ').trim();
  if (!cleanQuery) { renderTypeaheadOptions(slot, query, []); return; }
  var whUrl = 'https://www.wowhead.com/tbc/items/name:' + encodeURIComponent(cleanQuery) + '/min-req-level:60';
  var url = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(whUrl);
  fetch(url).then(function(res) { return res.text(); }).then(function(html) {
    var match = html.match(/listviewitems\s*=\s*(\[.*?\]);/);
    if (!match) { renderTypeaheadOptions(slot, query, []); return; }
    try {
      // Wowhead JSON has unquoted keys - fix common patterns
      var jsonStr = match[1].replace(/,\s*firstseenpatch\s*:\s*\d+/g, '').replace(/,\s*popularity\s*:\s*\d+/g, '');
      var items = JSON.parse(jsonStr);
      // Filter to equippable gear only (classs 2=weapon, 4=armor, slot>0)
      var results = [];
      for (var i = 0; i < items.length && results.length < 15; i++) {
        if ((items[i].classs === 4 || items[i].classs === 2) && items[i].slot > 0 && (items[i].quality || 0) >= 2) {
          results.push({
            id: items[i].id,
            name: items[i].name,
            quality: items[i].quality || 1,
            level: items[i].level || 0,
            slot: items[i].slot
          });
        }
      }
      results.sort(function(a, b) { return b.quality - a.quality || b.level - a.level; });
      _whSearchCache[cacheKey] = results;
      // Only render if this slot is still active
      if (_whSearchSlot === slot) {
        var input = document.getElementById('ta-input-' + slot);
        renderTypeaheadOptions(slot, input ? input.value.toLowerCase().trim() : query, results);
      }
    } catch(e) {
      renderTypeaheadOptions(slot, query, []);
    }
  }).catch(function() {
    renderTypeaheadOptions(slot, query, []);
  });
}

function selectWowheadItem(slot, id, name) {
  trackItem(slot, 'c:' + id + ':' + name);
  closeTypeahead(slot);
  // Fetch stats from Wowhead and re-render when available
  fetchCustomItemStats(id, function() {
    renderCurrentView();
  });
}

function selectTypeahead(slot, idx, type) {
  if (type === 'clear') {
    trackItem(slot, '');
  } else {
    trackItem(slot, idx);
  }
  closeTypeahead(slot);
}

function saveCustomItem(slot) {
  var input = document.getElementById('ta-input-' + slot);
  if (!input || !input.value.trim()) return;
  var name = input.value.trim();
  trackItem(slot, 'c:0:' + name);
  closeTypeahead(slot);
}

function typeaheadKeydown(e, slot) {
  var dd = document.getElementById('ta-dd-' + slot);
  if (!dd || !dd.classList.contains('open')) {
    if (e.key === 'ArrowDown' || e.key === 'Enter') { openTypeahead(slot); e.preventDefault(); }
    return;
  }
  var opts = dd.querySelectorAll('.typeahead-option');
  if (!opts.length) return;
  var idx = activeTypeahead ? activeTypeahead.highlightIdx : -1;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    idx = Math.min(idx + 1, opts.length - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    idx = Math.max(idx - 1, 0);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (idx >= 0 && idx < opts.length) {
      var opt = opts[idx];
      if (opt.getAttribute('data-type') === 'custom') {
        saveCustomItem(slot);
      } else if (opt.getAttribute('data-type') === 'wowhead') {
        var whId = parseInt(opt.getAttribute('data-wh-id'));
        var whName = opt.getAttribute('data-wh-name');
        selectWowheadItem(slot, whId, whName);
      } else {
        selectTypeahead(slot, opt.getAttribute('data-idx'), opt.getAttribute('data-type'));
      }
    }
    return;
  } else if (e.key === 'Escape') {
    closeTypeahead(slot);
    return;
  } else {
    return;
  }

  // Update highlight
  opts.forEach(function(o) { o.classList.remove('highlighted'); });
  if (idx >= 0 && idx < opts.length) {
    opts[idx].classList.add('highlighted');
    opts[idx].scrollIntoView({block:'nearest'});
  }
  if (activeTypeahead) activeTypeahead.highlightIdx = idx;
}

function clearTypeahead(slot) {
  trackItem(slot, '');
}

function renderTracker() {
  var spec = specData();
  var tracked = loadTracker();
  var slotKeys = Object.keys(spec.slots);
  var totalSlots = slotKeys.length;
  var filledSlots = 0;

  for (var i = 0; i < slotKeys.length; i++) {
    if (tracked[slotKeys[i]] !== undefined && tracked[slotKeys[i]] !== "") filledSlots++;
  }

  var pct = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

  var html = '<div class="tracker-container">';

  // Profession filter buttons
  var profs = loadProfessions();
  html += '<div class="profession-filters">';
  for (var p = 0; p < ALL_PROFESSIONS.length; p++) {
    var prof = ALL_PROFESSIONS[p];
    var isActive = profs.indexOf(prof) !== -1;
    html += '<button class="prof-btn' + (isActive ? ' active' : '') + '" onclick="toggleProfession(\'' + prof + '\')">' + prof + '</button>';
  }
  html += '</div>';

  // Import button
  html += '<div style="text-align:center;padding:4px 0 8px;">';
  html += '<button class="import-addon-btn" onclick="showImportModal()">';
  html += '<span style="font-size:1rem;">&#8681;</span> Import from Addon';
  html += '</button>';
  html += '</div>';

  // Progress bar
  html += '<div class="tracker-progress">';
  html += '<div class="progress-label">Gear Progress: ' + filledSlots + ' / ' + totalSlots + ' slots filled</div>';
  html += '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>';
  html += '<div class="progress-text">Type to search items below</div>';
  html += '</div>';

  // Stat summary
  var trackerStats = getTrackerStats();
  html += renderTrackerStats(trackerStats);

  // Slot typeahead inputs
  html += '<div class="tracker-slots">';
  for (var i = 0; i < slotKeys.length; i++) {
    var slot = slotKeys[i];
    var items = spec.slots[slot];
    var label = SLOT_LABELS[slot] || slot;
    var trackedItem = getTrackedItem(slot);
    var isOwned = !!trackedItem;
    var displayName = isOwned ? trackedItem.name : '';

    html += '<div class="tracker-slot">';
    html += '<div class="tracker-slot-label">' + label + '</div>';
    html += '<div class="typeahead-wrap">';
    html += '<input type="text" class="typeahead-input" id="ta-input-' + slot + '" placeholder="Search or type any item..." value="' + displayName.replace(/"/g, '&quot;') + '"';
    html += ' onfocus="openTypeahead(\'' + slot + '\')"';
    html += ' oninput="filterTypeahead(\'' + slot + '\')"';
    html += ' onkeydown="typeaheadKeydown(event, \'' + slot + '\')"';
    html += ' onblur="setTimeout(function(){closeTypeahead(\'' + slot + '\')},200)"';
    html += '>';
    if (isOwned) html += '<button class="typeahead-clear" onclick="clearTypeahead(\'' + slot + '\')" title="Clear">&times;</button>';
    html += '<div class="typeahead-dropdown" id="ta-dd-' + slot + '"></div>';
    html += '</div>';
    if (isOwned) {
      html += '<span class="owned-badge">&#10003; Owned</span>';
      if (trackedItem.isCustom) html += '<span style="font-size:0.6rem;color:var(--text-dim);margin-left:2px;">(custom)</span>';
    } else {
      html += '<span class="needed-badge">Needed</span>';
    }
    html += '</div>';
  }
  html += '</div>';

  // Actions
  html += '<div class="tracker-actions">';
  html += '<button class="reset-btn" onclick="resetTracker()">Reset All</button>';
  html += '</div>';

  html += '</div>';
  document.getElementById("trackerView").innerHTML = html;
  refreshWowheadLinks();
}

// ---------------------------------------------------------------------------
// Addon Import
// ---------------------------------------------------------------------------
function parseAddonExport(text) {
  if (!text || typeof text !== 'string') return null;
  var lines = text.trim().split('\n');
  if (!lines.length) return null;
  var header = lines[0].trim();
  var version = 0;
  if (header === 'TIERZERO:1') version = 1;
  else if (header === 'TIERZERO:2') version = 2;
  else return null;

  var result = { equipped: {}, bags: [], bank: [], charName: '', version: version };
  for (var i = 1; i < lines.length; i++) {
    var line = lines[i].trim();
    if (line === 'END') break;
    var parts = line.split(':');
    var type = parts[0];

    if (type === 'CHAR' && parts.length >= 2) {
      result.charName = parts.slice(1).join(':');
    } else if (type === 'EQ' && parts.length >= 6) {
      var slot = parts[1];
      // Find gems field by looking for comma-separated values (unique to gems field)
      var gemsIdx = -1;
      for (var gi = parts.length - 1; gi >= 5; gi--) {
        if (parts[gi].indexOf(',') !== -1) { gemsIdx = gi; break; }
      }
      if (version >= 2 && gemsIdx > 0) {
        // v2: EQ:slot:itemId:name:quality:ilvl:enchantId:gem1,gem2,gem3[:enchantTooltip]
        var enchantTooltip = gemsIdx < parts.length - 1 ? parts.slice(gemsIdx + 1).join(':') : '';
        var gemStr = parts[gemsIdx];
        var enchantId = parseInt(parts[gemsIdx - 1], 10) || 0;
        var ilvl = parseInt(parts[gemsIdx - 2], 10);
        var quality = parseInt(parts[gemsIdx - 3], 10);
        var name = parts.slice(3, gemsIdx - 3).join(':');
        var gemIds = gemStr.split(',').map(function(g) { return parseInt(g, 10) || 0; });
        result.equipped[slot] = {
          id: parseInt(parts[2], 10),
          name: name,
          quality: quality,
          ilvl: ilvl,
          enchant: enchantId,
          enchantName: enchantTooltip,
          gems: gemIds
        };
      } else {
        // v1: EQ:slot:itemId:name:quality:ilvl
        result.equipped[slot] = {
          id: parseInt(parts[2], 10),
          name: parts.slice(3, parts.length - 2).join(':'),
          quality: parseInt(parts[parts.length - 2], 10),
          ilvl: parseInt(parts[parts.length - 1], 10)
        };
      }
    } else if ((type === 'BAG' || type === 'BANK') && parts.length >= 5) {
      var item = {
        id: parseInt(parts[1], 10),
        name: parts.slice(2, parts.length - 2).join(':'),
        quality: parseInt(parts[parts.length - 2], 10),
        ilvl: parseInt(parts[parts.length - 1], 10)
      };
      if (type === 'BAG') result.bags.push(item);
      else result.bank.push(item);
    }
  }
  return result;
}

// Parse enchant tooltip text like "+35 Healing +12 Spell Damage and 7 Mana Per 5 sec."
// into stat values, then match against our ENCHANTS database
var TOOLTIP_STAT_PATTERNS = [
  {re:/(\d+)\s*spell\s*(?:damage|power)/i, stat:'sp'},
  {re:/(\d+)\s*healing/i, stat:'heal'},
  {re:/(\d+)\s*mana\s*per\s*5/i, stat:'mp5'},
  {re:/(\d+)\s*spell\s*hit/i, stat:'hit'},
  {re:/(\d+)\s*spell\s*crit/i, stat:'crit'},
  {re:/(\d+)\s*attack\s*power/i, stat:'ap'},
  {re:/(\d+)\s*agility/i, stat:'agi'},
  {re:/(\d+)\s*strength/i, stat:'str'},
  {re:/(\d+)\s*stamina/i, stat:'stam'},
  {re:/(\d+)\s*intellect/i, stat:'int'},
  {re:/(\d+)\s*spirit/i, stat:'spi'},
  {re:/(\d+)\s*defense/i, stat:'def'},
  {re:/(\d+)\s*dodge/i, stat:'dodge'},
  {re:/(\d+)\s*resilience/i, stat:'res'},
  {re:/(\d+)\s*(?:spell\s*)?hit\s*rating/i, stat:'hit'},
  {re:/(\d+)\s*(?:spell\s*)?crit(?:ical)?\s*(?:strike\s*)?rating/i, stat:'crit'},
  {re:/(\d+)\s*haste/i, stat:'haste'},
  {re:/(\d+)\s*armor/i, stat:'armor'},
  {re:/(\d+)\s*all\s*stats/i, stat:'allstats'},
];

function parseTooltipStats(text) {
  if (!text) return null;
  var stats = {};
  var found = false;
  for (var i = 0; i < TOOLTIP_STAT_PATTERNS.length; i++) {
    var m = text.match(TOOLTIP_STAT_PATTERNS[i].re);
    if (m) {
      var key = TOOLTIP_STAT_PATTERNS[i].stat;
      var val = parseInt(m[1], 10);
      if (key === 'allstats') {
        stats.str = val; stats.agi = val; stats.int = val; stats.stam = val; stats.spi = val;
      } else {
        stats[key] = val;
      }
      found = true;
    }
  }
  return found ? stats : null;
}

function matchEnchantByTooltip(tooltipText, slot) {
  var parsed = parseTooltipStats(tooltipText);
  if (!parsed) return null;
  var enchSlot = slot;
  var enchList = ENCHANTS[enchSlot];
  if (typeof enchList === "string") enchList = ENCHANTS[enchList];
  if (!enchList) return null;

  var bestMatch = null;
  var bestScore = 0;
  for (var e = 0; e < enchList.length; e++) {
    var ench = enchList[e];
    if (!ench.stats) continue;
    var score = 0;
    var misses = 0;
    var enchKeys = Object.keys(ench.stats);
    for (var k = 0; k < enchKeys.length; k++) {
      var key = enchKeys[k];
      if (parsed[key] && parsed[key] === ench.stats[key]) {
        score += 2; // exact stat+value match
      } else if (parsed[key]) {
        score += 1; // stat present but different value
        misses++;
      } else {
        misses++;
      }
    }
    if (score > bestScore && score > misses) {
      bestScore = score;
      bestMatch = ench;
    }
  }
  return bestMatch;
}

function importEquippedGear(parsed) {
  if (!parsed || !parsed.equipped) return { total: 0, bis: 0, custom: 0 };
  var spec = specData();
  var bisCount = 0, customCount = 0, total = 0;
  var importedEnchants = {};
  var importedGems = {};

  console.group('[TZ Import] Starting gear import');
  console.log('Spec:', spec.spec, '(' + spec.class + ')');

  var slots = Object.keys(parsed.equipped);
  for (var i = 0; i < slots.length; i++) {
    var slot = slots[i];
    if (!spec.slots[slot]) {
      console.warn('[TZ Import] Slot "' + slot + '" not in spec — skipped');
      continue;
    }
    var importedItem = parsed.equipped[slot];
    total++;

    // Check if this item matches any BiS item in this slot
    var bisIdx = -1;
    var slotItems = spec.slots[slot];
    for (var j = 0; j < slotItems.length; j++) {
      if (slotItems[j].id === importedItem.id) {
        bisIdx = j;
        break;
      }
    }

    if (bisIdx >= 0) {
      trackItem(slot, bisIdx);
      bisCount++;
      console.log('[TZ Import] %c' + slot + '%c: BiS #' + bisIdx + ' — ' + importedItem.name + ' (id:' + importedItem.id + ') stats:', 'color:#1eff00;font-weight:bold', 'color:inherit', slotItems[bisIdx].stats);
    } else {
      trackItem(slot, 'c:' + importedItem.id + ':' + importedItem.name);
      console.log('[TZ Import] %c' + slot + '%c: CUSTOM — ' + importedItem.name + ' (id:' + importedItem.id + ') — will fetch from Wowhead', 'color:#ff8000;font-weight:bold', 'color:inherit');
      // Fetch stats for custom item
      (function(s, id, name) {
        fetchCustomItemStats(id, function(data) {
          if (data) {
            console.log('[TZ Import] Fetched ' + name + ' (id:' + id + '):', 'stats:', data.stats, 'sockets:', data.sockets, 'socketBonus:', data.socketBonus);
          } else {
            console.error('[TZ Import] FAILED to fetch stats for ' + name + ' (id:' + id + ')');
          }
          renderTracker();
        });
      })(slot, importedItem.id, importedItem.name);
      customCount++;
    }

    // Import enchant if present (v2+)
    if (importedItem.enchant && importedItem.enchant > 0) {
      var matched = false;
      // Try stat-based matching from tooltip text (most reliable)
      if (importedItem.enchantName) {
        var matchedEnch = matchEnchantByTooltip(importedItem.enchantName, slot);
        if (matchedEnch) {
          importedEnchants[slot] = matchedEnch.id;
          matched = true;
          console.log('[TZ Import]   enchant (' + slot + '): tooltip match — ' + matchedEnch.name + ' (id:' + matchedEnch.id + ')', matchedEnch.stats);
        }
      }
      // Fall back to ID mapping
      if (!matched) {
        var spellId = ENCHANT_LINK_MAP[importedItem.enchant];
        if (spellId) {
          importedEnchants[slot] = spellId;
          console.log('[TZ Import]   enchant (' + slot + '): ID map ' + importedItem.enchant + ' → ' + spellId);
        } else {
          // Store raw ID so it's not lost
          importedEnchants[slot] = importedItem.enchant;
          console.warn('[TZ Import]   enchant (' + slot + '): NO MATCH for linkId=' + importedItem.enchant + ' tooltip="' + (importedItem.enchantName || '') + '" — stored raw');
        }
      }
    }

    // Import gems if present (v2+)
    if (importedItem.gems) {
      var validGems = [];
      var hasAny = false;
      var gemLog = [];
      for (var g = 0; g < importedItem.gems.length; g++) {
        var gId = importedItem.gems[g];
        if (gId > 0) {
          validGems.push(gId);
          hasAny = true;
          var gemInfo = GEMS[gId];
          gemLog.push(gId + (gemInfo ? ' (' + gemInfo.name + ' ' + JSON.stringify(gemInfo.stats) + ')' : ' (UNKNOWN)'));
        } else {
          validGems.push(null);
          gemLog.push('empty');
        }
      }
      if (hasAny) {
        importedGems[slot] = validGems;
        console.log('[TZ Import]   gems (' + slot + '): [' + gemLog.join(', ') + ']');
      }
    }
  }

  // Save imported enchants and gems to tracker storage
  if (Object.keys(importedEnchants).length) {
    var existingEnch = loadTrackerEnchants();
    for (var s in importedEnchants) existingEnch[s] = importedEnchants[s];
    saveTrackerEnchants(existingEnch);
  }
  if (Object.keys(importedGems).length) {
    var existingGems = loadTrackerGems();
    for (var s in importedGems) existingGems[s] = importedGems[s];
    saveTrackerGems(existingGems);
  }

  console.log('[TZ Import] Done: ' + total + ' items (' + bisCount + ' BiS, ' + customCount + ' custom)');
  console.log('[TZ Import] Enchants saved:', importedEnchants);
  console.log('[TZ Import] Gems saved:', importedGems);
  console.groupEnd();
  return { total: total, bis: bisCount, custom: customCount };
}

function findBagSuggestions(parsed) {
  if (!parsed) return [];
  var spec = specData();
  var tracked = loadTracker();
  var suggestions = [];
  var allItems = (parsed.bags || []).concat(parsed.bank || []);

  for (var i = 0; i < allItems.length; i++) {
    var bagItem = allItems[i];
    var source = i < parsed.bags.length ? 'bag' : 'bank';

    // Check every slot for a BiS match
    var slotKeys = Object.keys(spec.slots);
    for (var s = 0; s < slotKeys.length; s++) {
      var slot = slotKeys[s];
      var slotItems = spec.slots[slot];

      for (var j = 0; j < slotItems.length; j++) {
        if (slotItems[j].id === bagItem.id) {
          // Found a BiS match — check if it's better than current
          var currentVal = tracked[slot];
          var currentRank = -1;
          if (currentVal !== undefined && currentVal !== '') {
            var cv = String(currentVal);
            if (cv.indexOf('c:') === 0) {
              currentRank = 999; // custom items rank below all BiS
            } else {
              currentRank = parseInt(cv, 10);
            }
          }
          // Lower index = higher rank. If no item equipped or bag item is better ranked:
          if (currentVal === undefined || currentVal === '' || j < currentRank) {
            var currentName = 'empty';
            var trackedItem = getTrackedItem(slot);
            if (trackedItem) currentName = trackedItem.name;

            suggestions.push({
              item: bagItem,
              bisIdx: j,
              slot: slot,
              currentName: currentName,
              source: source
            });
          }
          break;
        }
      }
    }
  }

  // Sort by BiS rank (best upgrades first)
  suggestions.sort(function(a, b) { return a.bisIdx - b.bisIdx; });
  return suggestions;
}

function renderBagSuggestions(parsed, container) {
  var suggestions = findBagSuggestions(parsed);
  if (!suggestions.length) {
    container.innerHTML = '<div style="font-size:0.82rem;color:var(--text-dim);padding:8px 0;">No upgrades found in bags/bank.</div>';
    return;
  }

  var html = '<h4>Upgrades in Your Bags/Bank</h4>';
  for (var i = 0; i < suggestions.length; i++) {
    var sug = suggestions[i];
    var label = SLOT_LABELS[sug.slot] || sug.slot;
    html += '<div class="bag-sug-item">';
    html += '<div class="bag-sug-info">';
    html += '<a href="https://www.wowhead.com/tbc/item=' + sug.item.id + '">' + sug.item.name + '</a>';
    html += ' <span style="font-size:0.68rem;color:var(--text-dim);">(ilvl ' + sug.item.ilvl + ')</span>';
    html += '<div class="bag-sug-slot">' + label + ' — currently: ' + sug.currentName + ' <span style="opacity:0.6;">(' + sug.source + ')</span></div>';
    html += '</div>';
    html += '<button class="bag-sug-equip" onclick="equipSuggestion(\'' + sug.slot + '\',' + sug.bisIdx + ')">Equip</button>';
    html += '</div>';
  }
  container.innerHTML = html;
  refreshWowheadLinks();
}

function equipSuggestion(slot, bisIdx) {
  trackItem(slot, bisIdx);
  // Re-render suggestions if modal is still open
  var sugContainer = document.getElementById('import-suggestions');
  if (sugContainer && sugContainer._parsedData) {
    renderBagSuggestions(sugContainer._parsedData, sugContainer);
  }
}

function showImportModal() {
  // Remove existing if any
  hideImportModal();

  var overlay = document.createElement('div');
  overlay.className = 'import-overlay';
  overlay.id = 'import-overlay';
  overlay.onclick = function(e) { if (e.target === overlay) hideImportModal(); };

  var panel = document.createElement('div');
  panel.className = 'import-panel';
  panel.innerHTML =
    '<h3>Paste Addon Export</h3>' +
    '<div class="import-instructions">In WoW, type <strong>/tz</strong> then <strong>Ctrl+C</strong>. Paste here.</div>' +
    '<textarea id="import-textarea" rows="8" placeholder="TIERZERO:1\nCHAR:...\nEQ:head:12345:...\n..."></textarea>' +
    '<div class="import-btn-row">' +
      '<button class="import-primary" onclick="doImport()">Import Equipped Gear</button>' +
      '<button class="import-cancel" onclick="hideImportModal()">Cancel</button>' +
    '</div>' +
    '<div id="import-msg"></div>' +
    '<div id="import-suggestions" class="bag-suggestions"></div>';

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  // Focus textarea
  setTimeout(function() {
    var ta = document.getElementById('import-textarea');
    if (ta) ta.focus();
  }, 50);
}

function hideImportModal() {
  var overlay = document.getElementById('import-overlay');
  if (overlay) overlay.remove();
}

function doImport() {
  var ta = document.getElementById('import-textarea');
  var msgEl = document.getElementById('import-msg');
  var sugEl = document.getElementById('import-suggestions');
  if (!ta) return;

  var parsed = parseAddonExport(ta.value);
  if (!parsed) {
    msgEl.className = 'import-msg error';
    msgEl.textContent = 'Invalid export string. Make sure it starts with TIERZERO:1 or TIERZERO:2';
    return;
  }

  var result = importEquippedGear(parsed);
  msgEl.className = 'import-msg success';
  msgEl.textContent = 'Imported ' + result.total + ' items. ' + result.bis + ' matched BiS list, ' + result.custom + ' added as custom.';
  if (parsed.charName) {
    msgEl.textContent += ' (Character: ' + parsed.charName + ')';
  }

  // Save bag/bank data for future reference
  if (parsed.bags.length || parsed.bank.length) {
    try {
      localStorage.setItem('prebis-inventory-' + currentSpec, JSON.stringify({ bags: parsed.bags, bank: parsed.bank }));
    } catch(e) {}
  }

  // Show bag/bank suggestions
  sugEl._parsedData = parsed;
  renderBagSuggestions(parsed, sugEl);

  renderTracker();
}

// ---------------------------------------------------------------------------
// Raid Setup View
// ---------------------------------------------------------------------------
function loadInventory() {
  try {
    var raw = localStorage.getItem('prebis-inventory-' + currentSpec);
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

function findBestInventoryItem(slotKey, inventory) {
  var spec = specData();
  var slotItems = spec.slots[slotKey];
  if (!slotItems) return null;
  var allInv = (inventory.bags || []).concat(inventory.bank || []);

  // Also include currently equipped items from tracker
  var tracked = loadTracker();
  var trackedItem = getTrackedItem(slotKey);

  // For each BiS item (ranked best to worst), check if player has it
  for (var i = 0; i < slotItems.length; i++) {
    var bisItem = slotItems[i];
    // Check inventory
    for (var j = 0; j < allInv.length; j++) {
      if (allInv[j].id === bisItem.id) {
        return { bisItem: bisItem, rank: i, source: 'inventory' };
      }
    }
    // Check if currently tracked (equipped)
    if (trackedItem && trackedItem.id === bisItem.id) {
      return { bisItem: bisItem, rank: i, source: 'equipped' };
    }
  }
  return null;
}

function computeRaidStats(recommendations) {
  var spec = specData();
  var stats = {};
  var specSlug = localStorage.getItem("prebis-spec");
  var hasMainhand = !!spec.slots["mainhand"];
  var hasTwohand = !!spec.slots["twohand"];

  var slotKeys = Object.keys(recommendations);
  for (var i = 0; i < slotKeys.length; i++) {
    var sk = slotKeys[i];
    if (sk === "twohand" && hasMainhand && recommendations["mainhand"]) continue;
    if ((sk === "mainhand" || sk === "offhand") && hasTwohand && !hasMainhand && recommendations["twohand"]) continue;
    var rec = recommendations[sk];
    if (rec && rec.bisItem && rec.bisItem.stats) {
      addStats(stats, rec.bisItem.stats);
    }
  }
  return stats;
}

function renderRaidSetup() {
  var container = document.getElementById("raidView");
  if (!container) return;
  var spec = specData();
  if (!spec) { container.innerHTML = ''; return; }

  var inventory = loadInventory();

  // Empty state — no inventory data
  if (!inventory) {
    container.innerHTML =
      '<div class="raid-empty">' +
      '<div class="raid-empty-icon">&#128230;</div>' +
      '<h3>No Inventory Data</h3>' +
      '<p>Import your gear from the addon to see personalized raid recommendations.</p>' +
      '<button class="import-addon-btn" onclick="showImportModal()" style="margin-top:12px;">' +
      '<span style="font-size:1rem;">&#8681;</span> Import from Addon</button>' +
      '</div>';
    return;
  }

  var slotKeys = Object.keys(spec.slots);
  var recommendations = {};
  var filledCount = 0;

  for (var i = 0; i < slotKeys.length; i++) {
    var sk = slotKeys[i];
    var best = findBestInventoryItem(sk, inventory);
    recommendations[sk] = best;
    if (best) filledCount++;
  }

  // Hit/Def cap
  var raidStats = computeRaidStats(recommendations);
  var capKey = spec.hitCap ? 'hit' : (spec.defCap ? 'def' : null);
  var capVal = spec.hitCap || spec.defCap || 0;
  var currentCap = capKey ? (raidStats[capKey] || 0) : 0;
  var capPct = capVal > 0 ? Math.min(100, Math.round(currentCap / capVal * 100)) : 0;
  var isCapped = currentCap >= capVal;

  var html = '<div class="raid-container">';

  // Header stats
  html += '<div class="raid-summary">';
  html += '<div class="raid-summary-stat"><span class="raid-summary-val">' + filledCount + '</span><span class="raid-summary-label">/' + slotKeys.length + ' Slots Filled</span></div>';
  if (capKey) {
    html += '<div class="raid-cap-bar">';
    html += '<div class="raid-cap-label">' + (capKey === 'hit' ? 'Hit' : 'Defense') + ' Cap: ' + currentCap + '/' + capVal;
    if (isCapped) html += ' <span style="color:#5cdc78;">&#10003; Capped</span>';
    html += '</div>';
    html += '<div class="progress-bar"><div class="progress-fill" style="width:' + capPct + '%;background:' + (isCapped ? 'linear-gradient(90deg,#5cdc78,#2aff2a)' : 'linear-gradient(90deg,#c8aa6e,#f0d890)') + '"></div></div>';
    html += '</div>';
  }
  html += '</div>';

  // Gem suggestions
  var bisGems = BIS_GEMS[currentSpec];
  if (bisGems) {
    var gemSuggestions = [];
    for (var i = 0; i < slotKeys.length; i++) {
      var sk = slotKeys[i];
      var rec = recommendations[sk];
      if (!rec || !rec.bisItem || !rec.bisItem.sockets) continue;
      var trackerGems = loadTrackerGems();
      var currentGems = trackerGems[sk] || [];
      for (var s = 0; s < rec.bisItem.sockets.length; s++) {
        var socketColor = rec.bisItem.sockets[s];
        var recGemId = bisGems[socketColor];
        var curGemId = currentGems[s] || 0;
        if (recGemId && curGemId !== recGemId) {
          var gem = GEMS[recGemId];
          if (gem) {
            gemSuggestions.push({ slot: sk, socketIdx: s, gem: gem, socketColor: socketColor });
          }
        }
      }
    }
    if (gemSuggestions.length > 0 && gemSuggestions.length <= 30) {
      html += '<div class="raid-section">';
      html += '<div class="raid-section-title">Gem Suggestions (' + gemSuggestions.length + ')</div>';
      html += '<div class="raid-gem-list">';
      for (var g = 0; g < Math.min(gemSuggestions.length, 10); g++) {
        var gs = gemSuggestions[g];
        var label = SLOT_LABELS[gs.slot] || gs.slot;
        html += '<div class="raid-gem-item">';
        html += '<span class="gem-socket ' + gs.gem.color + ' filled" style="width:12px;height:12px;"></span> ';
        html += '<span style="color:var(--text-gold);">' + gs.gem.name + '</span>';
        html += ' <span style="font-size:0.68rem;color:var(--text-dim);">— ' + label + '</span>';
        html += '</div>';
      }
      if (gemSuggestions.length > 10) {
        html += '<div style="font-size:0.72rem;color:var(--text-dim);padding:4px 0;">...and ' + (gemSuggestions.length - 10) + ' more</div>';
      }
      html += '</div></div>';
    }
  }

  // Per-slot recommendations
  html += '<div class="raid-section">';
  html += '<div class="raid-section-title">Best Available per Slot</div>';
  html += '<div class="raid-slots">';

  for (var i = 0; i < slotKeys.length; i++) {
    var sk = slotKeys[i];
    var rec = recommendations[sk];
    var label = SLOT_LABELS[sk] || sk;
    var slotItems = spec.slots[sk];
    var bisTop = slotItems && slotItems[0] ? slotItems[0] : null;

    html += '<div class="raid-slot-card">';
    html += '<div class="raid-slot-label">' + label + '</div>';

    if (rec) {
      var isBis = rec.rank === 0;
      html += '<div class="raid-slot-item">';
      html += '<span class="raid-slot-rank' + (isBis ? ' is-bis' : '') + '">#' + (rec.rank + 1) + '</span>';
      html += '<div class="raid-slot-info">';
      html += '<div class="item-link">' + itemLink(rec.bisItem) + '</div>';
      html += '<div class="item-src">' + rec.bisItem.src + '</div>';
      html += '</div>';
      if (isBis) {
        html += '<span class="owned-badge">BiS</span>';
      } else {
        html += '<span class="raid-slot-source">' + rec.source + '</span>';
      }
      html += '</div>';

      // Show what BiS #1 is if not already BiS
      if (!isBis && bisTop) {
        html += '<div class="raid-slot-upgrade">Upgrade: ' + itemLink(bisTop) + ' <span style="font-size:0.65rem;color:var(--text-dim);">— ' + bisTop.src + '</span></div>';
      }
    } else {
      html += '<div class="raid-slot-empty">No matching items found</div>';
      if (bisTop) {
        html += '<div class="raid-slot-upgrade">Need: ' + itemLink(bisTop) + ' <span style="font-size:0.65rem;color:var(--text-dim);">— ' + bisTop.src + '</span></div>';
      }
    }
    html += '</div>';
  }

  html += '</div></div>';

  // Apply All button
  html += '<div class="raid-actions">';
  html += '<button class="import-primary" onclick="applyRaidRecommendations()" style="padding:10px 24px;font-size:0.88rem;">Apply All to Tracker</button>';
  html += '</div>';

  html += '</div>';
  container.innerHTML = html;
  refreshWowheadLinks();
}

function applyRaidRecommendations() {
  var spec = specData();
  if (!spec) return;
  var inventory = loadInventory();
  if (!inventory) return;

  var slotKeys = Object.keys(spec.slots);
  var count = 0;
  for (var i = 0; i < slotKeys.length; i++) {
    var sk = slotKeys[i];
    var best = findBestInventoryItem(sk, inventory);
    if (best) {
      trackItem(sk, best.rank);
      count++;
    }
  }
  renderRaidSetup();
  renderCurrentView();
  window.dispatchEvent(new CustomEvent('tracker-changed'));
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
var resizeTimer;
window.addEventListener('resize', function() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function() {
    if (document.getElementById('specPickerOverlay').style.display !== 'none') buildSpecPicker();
  }, 150);
});

function init() {
  buildSpecPicker();

  // Set up view tab click handlers
  document.querySelectorAll('.view-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { setView(btn.dataset.view); });
  });

  // Cross-tab: re-render visible view when tracker changes
  window.addEventListener('tracker-changed', function() {
    if (currentView === 'routes') renderRoutes();
    else if (currentView === 'sheet' && sheetMode === 'mygear') renderSheet();
  });

  // Close typeahead on outside click
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.typeahead-wrap')) {
      document.querySelectorAll('.typeahead-dropdown.open').forEach(function(d) { d.classList.remove('open'); });
    }
  });

  // If spec already chosen (from localStorage), go straight to main UI
  if (currentSpec && SPECS[currentSpec]) {
    showMainUI();
    renderCurrentView();
    // Auto-show filter modal on first visit
    if (!filtersConfigured()) {
      setTimeout(showFilterModal, 300);
    }
  } else {
    showSpecPicker();
  }
}

init();

