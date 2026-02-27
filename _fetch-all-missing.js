// Comprehensive item expansion script
// Fetches missing items for ALL specs using Wowhead guide data
// Strategy: cross-reference existing items across specs first, then fetch truly new items from tooltip API

const fs = require('fs');
const https = require('https');

const html = fs.readFileSync('data/specs.js', 'utf8');

// ============================================================
// 1. Build master item lookup from ALL existing items in data/specs.js
// ============================================================
const masterItems = {}; // id -> {name, src, q, full_line}
// Use brace-counting to extract full item objects (handles nested braces like stats:{str:10,agi:5})
const itemStartRe = /\{name:"/g;
let m;
while ((m = itemStartRe.exec(html)) !== null) {
  const startIdx = m.index;
  let depth = 0;
  let endIdx = startIdx;
  for (let i = startIdx; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}') {
      depth--;
      if (depth === 0) { endIdx = i; break; }
    }
  }
  const full = html.substring(startIdx, endIdx + 1);
  const idMatch = full.match(/id:(\d+)/);
  const nameMatch = full.match(/name:"([^"]+)"/);
  const srcMatch = full.match(/src:"([^"]*)"/);
  const qMatch = full.match(/q:(Q\.\w+)/);
  if (idMatch && !masterItems[idMatch[1]]) {
    masterItems[idMatch[1]] = {
      name: nameMatch ? nameMatch[1] : '',
      src: srcMatch ? srcMatch[1] : '',
      q: qMatch ? qMatch[1] : 'Q.rare',
      full: full
    };
  }
}
console.log('Master lookup: ' + Object.keys(masterItems).length + ' unique items');

// ============================================================
// 2. Extract current item IDs per spec
// ============================================================
const specRe = /"([a-z]+-[a-z]+(?:-[a-z]+)?)":\s*\{\s*class:"(\w+)",\s*spec:"([^"]+)"/g;
const specs = [];
while ((m = specRe.exec(html)) !== null) {
  specs.push({ slug: m[1], cls: m[2], spec: m[3] });
}

function getSpecItemIds(slug) {
  const ids = new Set();
  const startRe = new RegExp('"' + slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '":\\s*\\{');
  const startMatch = startRe.exec(html);
  if (!startMatch) return ids;
  const startIdx = startMatch.index;
  const chunk = html.substring(startIdx, startIdx + 50000);
  let depth = 0, endIdx = 0;
  for (let i = chunk.indexOf('{'); i < chunk.length; i++) {
    if (chunk[i] === '{') depth++;
    if (chunk[i] === '}') { depth--; if (depth === 0) { endIdx = i; break; } }
  }
  const specChunk = chunk.substring(0, endIdx);
  const idRe = /id:(\d+)/g;
  let im;
  while ((im = idRe.exec(specChunk)) !== null) {
    ids.add(parseInt(im[1]));
  }
  return ids;
}

// ============================================================
// 3. Wowhead guide item IDs per spec per slot
// ============================================================
const GUIDE_DATA = {
  'fury-warrior': {
    head:[32087,28414,28182,31105],
    shoulders:[33173,30705,27434,27797],
    back:[24259,28371,29382,27892,31143,23045],
    chest:[31320,23522,28403,29337,30258],
    wrists:[23537,28996,29246,22936,30940],
    hands:[25685,23520,27497,21581,30341],
    waist:[27985,29247,28995,23219,25789,31462],
    legs:[30538,25687,30533,31544,30257],
    feet:[25686,27867,28176,28997,30401],
    neck:[29349,29119,29381,31695],
    ring1:[29379,31920,23038,30365,27460,27762,29177,30834,31381],
    trinket1:[21670,29383,23041,28288,28034],
    mainhand:[28438,31332,23542,29124,27872,28920,27490,28189,28210,28267,28956],
    twohand:[28429,29356,27769],
  },
  'arms-warrior': {
    head:[32087,28414,28182,31105],
    shoulders:[33173,30705,27434,27797],
    back:[24259,28371,29382,27892,31143,23045],
    chest:[31320,23522,28403,29337,30258],
    wrists:[23537,28996,29246,22936,30940],
    hands:[25685,23520,27497,21581,30341],
    waist:[27985,29247,28995,23219,25789,31462],
    legs:[30538,25687,30533,31544,30257],
    feet:[25686,27867,28176,28997,30401],
    neck:[29349,29119,29381,31695],
    ring1:[29379,31920,23038,30365,27460,27762,29177,30834,31381],
    trinket1:[21670,29383,23041,28288,28034],
    twohand:[28429,29356,27769,28438,31332,23542,29124],
  },
  'prot-warrior': {
    head:[32083,28180,23519,28350,27408,31105,32871],
    shoulders:[32073,28703,28855,35411,27847,27803,29316],
    back:[27804,27988,24253,27878,28256,27892],
    chest:[28205,28699,28851,35407,25819,22416],
    wrists:[28996,29463,27459,28167,30225],
    hands:[27475,32072,23517,29134,30375,30341],
    waist:[28995,29238,27672,27985,31460,25922],
    legs:[29184,23518,30533,27527,28175,29783],
    feet:[28997,29239,28176,30386,22420],
    neck:[29386,28244,30378,29335,27546,31696,31695],
    ring1:[30834,29384,28553,27822,30006,31078],
    trinket1:[29387,27770,29181,27891,19406,23206,22520,30300,28042],
    mainhand:[19019,28438,29348,29362,27980,28189,29156,29165,23577,31071],
    offhand:[29266,29176,32082,28316,27887,31490,28940,28939,23043],
  },
  'combat-rogue': {
    head:[28224,32087,28182],
    neck:[29381,24114,25562,19377],
    shoulders:[27797,25790,29148,29147],
    back:[24259,27878,29382,28032],
    chest:[28264,29525,30933],
    wrists:[29246,29527,28171],
    hands:[25685,27531,30003,27509],
    waist:[29247,29526,30372,31464],
    legs:[27837,25687,31544],
    feet:[25686,30939],
    ring1:[31920,30834,31077,30860,30973,27925],
    trinket1:[23206,29383,28288,23041,22954,28034,21670],
    mainhand:[28438,31332,31331,29124],
    offhand:[28189,29275],
  },
  'assassination-rogue': {
    head:[28224,32087,28182],
    neck:[29381,24114,25562,19377],
    shoulders:[27797,25790,29148,29147],
    back:[24259,27878,29382,28032],
    chest:[28264,29525,30933],
    wrists:[29246,29527,28171],
    hands:[25685,27531,30003,27509],
    waist:[29247,29526,30372,31464],
    legs:[27837,25687,31544],
    feet:[25686,30939],
    ring1:[31920,30834,31077,30860,30973,27925],
    trinket1:[23206,29383,28288,23041,22954,28034,21670],
    mainhand:[28438,31332,31331,29124],
    offhand:[28189,29275],
  },
  'bm-hunter': {
    head:[28275,22438,31109,31106,31281,27414],
    neck:[29381,19377,28343,25562],
    shoulders:[27801,25790,22439,27797,27434],
    back:[24259,29382,31255,27878,27892],
    chest:[28228,29525,29515,30933,22436],
    wrists:[29527,29246,25697,29517,22443],
    hands:[27474,16463,16571,30951,22441,30003],
    waist:[29526,27760,29516,25695,22442],
    legs:[27874,30538,27837,22437],
    feet:[25686,31288,22440,29262,30401],
    ring1:[30860,31077,27925,23038,23067,30973],
    trinket1:[29383,28288,28034,21670,28041],
    twohand:[29351,29151,29152,22812,31323,31303,28435,27903,29356,23039,29329,27846,28315,30277,21673,28263,29372,23242,29121],
  },
  'mm-hunter': {
    head:[28275,22438,31109,31106,31281,27414],
    neck:[29381,19377,28343,25562],
    shoulders:[27801,25790,22439,27797,27434],
    back:[24259,29382,31255,27878,27892],
    chest:[28228,29525,29515,30933,22436],
    wrists:[29527,29246,25697,29517,22443],
    hands:[27474,16463,16571,30951,22441,30003],
    waist:[29526,27760,29516,25695,22442],
    legs:[27874,30538,27837,22437],
    feet:[25686,31288,22440,29262,30401],
    ring1:[30860,31077,27925,23038,23067,30973],
    trinket1:[29383,28288,28034,21670,28041],
    twohand:[29351,29151,29152,22812,31323,31303,28435,27903,29356,23039,29329,27846,28315,30277,21673,28263,29372,23242,29121],
  },
  'survival-hunter': {
    head:[28275,22438,31109,31106,31281,27414],
    neck:[28343,19377,29381,25562],
    shoulders:[27801,25790,22439,27797,27434],
    back:[29382,24259,31255,27878,27892],
    chest:[28228,29525,30933,22436],
    wrists:[25697,29246,29527,22443],
    hands:[27474,30951,16463,16571,22441,30003],
    waist:[27760,29247,29526,25695,22442],
    legs:[27837,27874,28219,27430,22437,30538],
    feet:[29262,31288,22440,25686,30401],
    ring1:[31326,22961,27925,31277,30860,31077,30973,23038],
    trinket1:[29383,28034,28288,21670,28041],
    twohand:[29351,29151,29152,22812,31323,31303,28435,27903,29356,23039,29329,28263,27846,29372,29121,30277,32781,28315,23242],
  },
  'affliction-warlock': {
    head:[24266,31104,28278,28415,28169],
    shoulders:[21869,22507,27796,27994,30925],
    back:[23050,27981,22731,31140],
    chest:[21871,21848,31297,22504,29341,28191,28232],
    wrists:[21186,24250,27462],
    hands:[21847,31149,21585,27465,27537,24450],
    waist:[21846,24256,22730,31461,27795],
    legs:[24262,30531,23070,19133,27948,27907],
    feet:[21870,27821,28406,28179,22508],
    neck:[28134,27758,21608,23057,18814],
    ring1:[29172,28227,29126,28555,23237,21709,23031,23025],
    trinket1:[29370,27683,23207,29132,19379,23046],
    mainhand:[31336,22630,30787,29155,29153,27905],
    offhand:[29270,29273,28412,29272,23049,21597],
    wand:[22128,22821,29350,22820,28386],
  },
  'destruction-warlock': {
    head:[24266,31104,28278,28415,28169],
    shoulders:[21869,22507,27796,27994,30925],
    back:[23050,27981,22731,31140],
    chest:[21871,21848,31297,22504,29341,28191,28232],
    wrists:[21186,24250,27462],
    hands:[21847,31149,21585,27465,27537,24450],
    waist:[21846,24256,22730,31461,27795],
    legs:[24262,30531,23070,19133,27948,27907],
    feet:[21870,27821,28406,28179,22508],
    neck:[28134,27758,21608,23057,18814],
    ring1:[29172,28227,29126,28555,23237,21709,23031,23025],
    trinket1:[29370,27683,23207,29132,19379,23046],
    mainhand:[31336,22630,30787,29155,29153,27905],
    offhand:[29270,29273,28412,29272,23049,21597],
    wand:[22128,22821,29350,22820,28386],
  },
  'demonology-warlock': {
    head:[24266,31104,28278,28415,28169],
    shoulders:[21869,22507,27796,27994,30925],
    back:[23050,27981,22731,31140],
    chest:[21871,21848,31297,22504,29341,28191,28232],
    wrists:[21186,24250,27462],
    hands:[21847,31149,21585,27465,27537,24450],
    waist:[21846,24256,22730,31461,27795],
    legs:[24262,30531,23070,19133,27948,27907],
    feet:[21870,27821,28406,28179,22508],
    neck:[28134,27758,21608,23057,18814],
    ring1:[29172,28227,29126,28555,23237,21709,23031,23025],
    trinket1:[29370,27683,23207,29132,19379,23046],
    mainhand:[31336,22630,30787,29155,29153,27905],
    offhand:[29270,29273,28412,29272,23049,21597],
    wand:[22128,22821,29350,22820,28386],
  },
  'shadow-priest': {
    head:[24266,31104,28415,28193,28183,28169],
    neck:[28245,18814,31693,24121,24116,31692,28134,20966],
    shoulders:[21869,27778,27738,30925],
    back:[24252,22731,30971],
    chest:[21871,28232,31297,29341,28342,29129,24481,28252,23220],
    wrists:[24250,27746,28174,29240,27462],
    hands:[29317,24450,27889,21585,19407,27493,27465,31111,28317],
    waist:[24256,27843,31461,30932,22730,29241,24395],
    legs:[24262,30531,30532,28185,28338,27948],
    feet:[21870,28179,28406,35581,27848,27451],
    ring1:[21709,23031,20076,29352,28555,19434,19147,29126,31290,31075,30366,29172],
    trinket1:[29370,27683,23207,23046,19379,25619,25620,28223,25936,30340,29132,27922,27924],
    mainhand:[30832,23554,28297,32450,27937,27543,27868,27741],
    offhand:[29272,29273,19309,29330],
    wand:[29350,30859,28386,27890],
  },
  'holy-priest': {
    head:[32090,24264,28413,29174,27866,22514,31104],
    shoulders:[21874,27775,27433,28250,22515],
    back:[29354,29375,24254,31329,28373,27789],
    chest:[21875,28230,24397,27506,22512],
    wrists:[29183,29249,21604,24250,28174,22519],
    hands:[27536,24393,28304,29315,22517],
    waist:[21873,29250,21582,27542,27843],
    legs:[24261,30543,31343,28218,24083,27875,28185,30256],
    feet:[29251,27411,28179,27525,25792],
    neck:[30377,29374,28233,31691,23036,21712,27766,28419,29334],
    ring1:[29373,29168,29169,31923,31383,29322,28259,27780,29814],
    trinket1:[29376,21625,19288,23047,19395,28190,30841,25634,28370],
    mainhand:[23556,29353,29175,31342,23056,28257,28216,27538,31304,22631,27791,29133,28033],
    offhand:[29170,29274,23048,23029,27477,27714,28213,31493,28387],
    wand:[27885,23009,29779,30859],
  },
  'discipline-priest': {
    head:[32090,24264,28413,29174,27866,22514,31104],
    shoulders:[21874,27775,27433,28250,22515],
    back:[29354,29375,24254,31329,28373,27789],
    chest:[21875,28230,24397,27506,22512],
    wrists:[29183,29249,21604,24250,28174,22519],
    hands:[27536,24393,28304,29315,22517],
    waist:[21873,29250,21582,27542,27843],
    legs:[24261,30543,31343,28218,24083,27875,28185,30256],
    feet:[29251,27411,28179,27525,25792],
    neck:[30377,29374,28233,31691,23036,21712,27766,28419,29334],
    ring1:[29373,29168,29169,31923,31383,29322,28259,27780,29814],
    trinket1:[29376,21625,19288,23047,19395,28190,30841,25634,28370],
    mainhand:[23556,29353,29175,31342,23056,28257,28216,27538,31304,22631,27791,29133,28033],
    offhand:[29170,29274,23048,23029,27477,27714,28213,31493,28387],
    wand:[27885,23009,29779,30859],
  },
  'elemental-shaman': {
    head:[32086,28415,28278,24266,31330,31107],
    neck:[28134,31692,29333],
    shoulders:[32078,30925,27796],
    back:[29369,31201,27981],
    chest:[29519,29522,28191,31340],
    wrists:[29521,29523,24250],
    hands:[27465,27793,31149,31280,30930],
    waist:[29520,24256,29524,31283],
    legs:[24262,30541,29141,29142,30709],
    feet:[28406,28179],
    ring1:[29126,29367,29352,31290,29172,28227],
    trinket1:[29370,27683,23207,29179,29132,28418,19379],
    mainhand:[32450,23554,30832,27868],
    offhand:[29273,29268,31287,23049,28412],
    libram:[28248,23199,29389],
  },
  'enhancement-shaman': {
    head:[28224,32087,28182,31109],
    neck:[29381,29119,31695,27546,27779],
    shoulders:[27797,27434,29148,29147,25790],
    back:[24259,33122,29382,27878,27892,28249],
    chest:[29525,29515,30933],
    wrists:[29527,29517,25697,29246,28171,30399],
    hands:[25685,30341,27509,27825,29503,28396],
    waist:[29526,29516,29247,27911,31462],
    legs:[31544,25687,30538,30257],
    feet:[25686,27867,31288,29248,30939,30401],
    ring1:[30834,31920,30860,31380,29379,31077,28323,30365,27925],
    trinket1:[29383,23206,28288,29776,28034,25633,25628],
    mainhand:[28313,28308,28438,29348,27872,18828,28392,29371,30364,27846,25538,31139],
    libram:[27815],
  },
  'resto-shaman': {
    head:[24264,31400,32090,28413,28348,27409,29174,29505,27759,25820,22466],
    neck:[31691,30377,29374,21712,23036,28233],
    shoulders:[21874,27775,31407,27433,27737,27417,27826,28250,32078,22467],
    back:[31329,24254,29354,22960,27448,29375,27946],
    chest:[21875,29522,31396,28230,28202,24397,29974,27456,27506,30298,23527,27912,22464],
    wrists:[29523,29183,29249,21604,24250,28174,28194,27827,22471],
    hands:[29506,31397,24393,29327,27806,28268,28304,25791,21617,27536],
    waist:[29524,21873,29250,21582,21609,27835,28398,22470,27542],
    legs:[30543,24261,31343,28218,24083,24391,31406,27458,29345,31335,27875,30256],
    feet:[27411,29251,27525,27549,25792,28251],
    ring1:[27780,29168,29169,29814,31383,29373,19382,22939,21620,31923,28259,32772,24076,29322],
    trinket1:[29376,30841,28190,19395,23047,25634,24390],
    mainhand:[32451,23556,29353,29175,31342,23056,28257,28216,27538,31304,27791,29133,28033],
    offhand:[29267,29274,23048,29170,22819,27772,27477,31292,27714,28387,31493,29268],
    libram:[27544,22396,25645],
  },
  'balance-druid': {
    head:[24266,31110,28169,32089,28137,28278,28415],
    shoulders:[27796,27778,30925,27994,22983,28139,27738,31797],
    back:[27981,31140,23050,22731,29369,24252,25777],
    chest:[21848,29522,31297,29341,31340,28342,28140,29129,28229],
    wrists:[29523,24250,27462,28411,29240,21186,28174,29255],
    hands:[21847,27493,27537,24450,31149,27465,29317,24452],
    waist:[21846,24256,29524,29241,27843,31461,24395],
    legs:[24262,29141,29142,30531,29343,30532,28212,27492,28185],
    feet:[27821,28406,28179,28410,29808,30519,29258,27848,27914,29242],
    neck:[28134,27758,31692,28245,29333,24462],
    ring1:[29172,28227,21709,23031,28555,29352,29367,29126,31075,30366,31290,28394],
    trinket1:[29370,27683,29132,19379,23046,28223,26055,30340,12930,25936,25620,25619],
    mainhand:[23554,30832,27543,28931,27937,27741,27868,24557,29355,27842,29130,28935,28341,31308,28188],
    offhand:[29271,29273,28412,23049,28187,28260,29330],
    libram:[27518,23197,32387],
  },
  'feral-cat-druid': {
    head:[8345],
    neck:[24114,29381,31275,29119,27779,19377,25562],
    shoulders:[27797,25790,28755,27434,27995],
    back:[31255,24259,27878,29382,28031,28032],
    chest:[29525,28204,24396,29340],
    wrists:[29246,28171],
    hands:[28396,29507,25685,27509,27531],
    waist:[29247,30372,27911,31464,27760],
    legs:[31544,30257,27837,25687,30538,30535],
    feet:[25686,31288,29248,30939],
    ring1:[30834,31920,30365,27925,30860,31077],
    trinket1:[23206,29383,28034,23041,28121,19406,29776,28288],
    twohand:[31334,29359,29171,27877,28325,30010,28948,28919],
    libram:[29390,28372,28064],
  },
  'feral-bear-druid': {
    head:[29502,28182,32087,32088,28224],
    shoulders:[27434,27776,32080,27797],
    back:[28256,24258,28377,24379,29382,27878],
    chest:[25689,28204,29525,28264,23226],
    wrists:[30944,28978,28988,29263],
    hands:[30943,30341,29507,29503,27531,28396],
    waist:[30942,29264,29247,28986,28423],
    legs:[25690,31544,30538,30535,30941,30257],
    feet:[28987,28422,25691,28339,29265,29248,31532,19381],
    neck:[29815,28168,29381,28244,27779,27546,29335],
    ring1:[30834,29384,27436,27925,24151,31919,28553],
    trinket1:[23206,29383,28121,23836,23835,19406,28288,23041,28034,27770],
    twohand:[29171,29359,31334,27757,27877,28948,28919,30010,28325],
    libram:[23198,28064,27744],
  },
  'resto-druid': {
    head:[24264,31376,32090,28413,28348,27409,29174,29505],
    neck:[30377,31691,29374,23036,28233,21712],
    shoulders:[21874,27775,31378,27433,27737,27417],
    back:[31329,24254,27946,22960,29354,27448,29375],
    chest:[21875,29522,31379,28230,28202,24397,29974,27456,27506],
    wrists:[29183,29523,29249,21604,24250,31599,28174,27827,22495],
    hands:[29506,31375,24393,29327,28268,28304,25791,21617,27536],
    waist:[21873,29524,29250,31594,22494,21582,21609,27542,28398],
    legs:[24261,30543,31343,28218,24083,24391,31377,29345,31335,27875,30256],
    feet:[27411,29251,25792,31595,28251,27525],
    ring1:[27780,31383,29168,29169,29373,19382,22939,29814,32772,31923,28259,24076,21620,29322],
    trinket1:[29376,30841,19395,23047,28190,25634,24390],
    mainhand:[32451,23556,29353,29175,31342,23056,28257,28216,27538,31304,22632,27791,29133,28033],
    offhand:[29274,29170,23048,23029,27477,27714,28213,31493,28387,27886,25643],
    libram:[27518,23197,28064],
  },
  'ret-paladin': {
    head:[28182,31105,32087,28414],
    shoulders:[27771,27776,33173,27797],
    back:[27878,28249,24259,29382],
    chest:[28484,23522,28403],
    wrists:[25697,29517,23537,29246],
    hands:[29509,27497,25685,23520],
    waist:[27755,27985,29247],
    legs:[30533,31544,30257,25687],
    feet:[28176,25686,27867],
    neck:[29349,31694,29381,29119],
    ring1:[29379,31920,30365,29177,30834],
    trinket1:[29776,29383,28034,23041,28288],
    twohand:[31318,23541,28429,29356],
    libram:[22401,23203,29390],
  },
  'prot-paladin': {
    head:[23536,27520,32083,28285],
    shoulders:[30291,27847,27803],
    back:[27988,27550,27804,24253],
    chest:[23507,28203,28262],
    wrists:[29463,29127,27459],
    hands:[32072,23532,29134,27475],
    waist:[27672,29252,29238],
    legs:[29184,23518,27527],
    feet:[29239,29253,28176],
    neck:[27871,29386,28244,29335],
    ring1:[28407,29323,30834,29384,27822],
    ring2:[28265,31078],
    trinket1:[29370,29387],
    trinket2:[29387,27770,28042],
    mainhand:[27899,29155,28297],
    offhand:[27449,27887,29266,29176,28316],
    libram:[27917,23203],
  },
  'holy-paladin': {
    head:[32086,28348,29508,27759,24264,28413],
    shoulders:[27737,27826,28250,32078,21874,27775],
    back:[31329,27448,24254,29354,29375],
    chest:[29519,29129,28202,21875,28230],
    wrists:[27489,28194,27827,29183,29249],
    hands:[28304,27806,28268,27536,24393],
    waist:[31202,29520,29244,31461,21873,29250],
    legs:[30541,27748,24261,30543],
    feet:[28406,27525,27549,27411,29251],
    neck:[30377,31691,29374,23036,28233],
    ring1:[29373,29168,29367,29169,27780],
    ring2:[29814,27780,31383],
    trinket1:[28190,29376,30841],
    mainhand:[28216,27538,23556,29175],
    offhand:[29267,27772,29274,23048],
    libram:[25644,23201,29383],
  },
};

// Skip mage specs (already at 120+)
const SKIP_SPECS = ['fire-mage', 'arcane-mage', 'frost-mage'];

// ============================================================
// 4. Tooltip API helpers (from _fetch-paladin.js)
// ============================================================
function fetchItem(id) {
  return new Promise((resolve, reject) => {
    const url = `https://nether.wowhead.com/tooltip/item/${id}?dataEnv=5&locale=0`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ id, name: json.name, tooltip: json.tooltip, quality: json.quality });
        } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function parseStats(tooltip) {
  const stats = {};
  const greenRe = /\+(\d+)\s+(Stamina|Intellect|Strength|Agility|Spirit)/g;
  const map = { 'Stamina':'stam','Intellect':'int','Strength':'str','Agility':'agi','Spirit':'spi' };
  let m;
  while ((m = greenRe.exec(tooltip)) !== null) {
    const key = map[m[2]];
    if (key) stats[key] = parseInt(m[1]);
  }
  const equipMap = [
    [/increases damage and healing done by magical spells and effects by up to (\d+)/i, 'sp'],
    [/increases healing done by up to (\d+)/i, 'heal'],
    [/Improves spell critical strike rating by (\d+)/i, 'crit'],
    [/Improves critical strike rating by (\d+)/i, 'crit'],
    [/Improves hit rating by (\d+)/i, 'hit'],
    [/Improves haste rating by (\d+)/i, 'haste'],
    [/Improves your resilience rating by (\d+)/i, 'res'],
    [/Increases attack power by (\d+)/i, 'ap'],
    [/Restores (\d+) mana per 5 sec/i, 'mp5'],
    [/Improves spell hit rating by (\d+)/i, 'hit'],
    [/Increases defense rating by (\d+)/i, 'def'],
    [/Increases your dodge rating by (\d+)/i, 'dodge'],
    [/Increases your parry rating by (\d+)/i, 'parry'],
    [/Increases your block rating by (\d+)/i, 'block'],
    [/Increases the block value of your shield by (\d+)/i, 'blockValue'],
    [/Increases your expertise rating by (\d+)/i, 'expertise'],
    [/Increases your shield block rating by (\d+)/i, 'block'],
  ];
  for (const [re, key] of equipMap) {
    const em = tooltip.match(re);
    if (em) stats[key] = parseInt(em[1]);
  }
  return stats;
}

function parseSockets(tooltip) {
  const sockets = [];
  const socketRe = /socket-([a-z]+)/gi;
  let m;
  while ((m = socketRe.exec(tooltip)) !== null) {
    const color = m[1].toLowerCase();
    if (['red','yellow','blue','meta'].includes(color)) sockets.push(color);
  }
  let bonus = null;
  const bonusRe = /Socket Bonus:.*?\+(\d+)\s+(\w[\w\s]*)/i;
  const bm = tooltip.match(bonusRe);
  if (bm) {
    const val = parseInt(bm[1]);
    const statName = bm[2].trim().toLowerCase();
    const bonusMap = {
      'stamina':'stam','intellect':'int','strength':'str','agility':'agi',
      'spell critical strike rating':'crit','critical strike rating':'crit',
      'hit rating':'hit','resilience rating':'res','healing':'heal',
      'dodge rating':'dodge','defense rating':'def','block rating':'block',
      'spell power':'sp','attack power':'ap','spirit':'spi','mana every 5 seconds':'mp5',
      'spell damage':'sp',
    };
    const key = bonusMap[statName] || statName.substring(0,3);
    bonus = {};
    bonus[key] = val;
  }
  return { sockets: sockets.length ? sockets : null, socketBonus: bonus };
}

function qualityStr(q) {
  if (q === 4) return 'Q.epic';
  if (q === 3) return 'Q.rare';
  if (q === 2) return 'Q.uncommon';
  if (q === 5) return 'Q.legendary';
  return 'Q.rare';
}

function formatItemLine(name, id, q, src, stats, sockets, socketBonus) {
  let line = '{name:"' + name + '",id:' + id + ',q:' + q + ',src:"' + src + '",stats:' + JSON.stringify(stats).replace(/"/g, '') + '';
  if (sockets) {
    line += ',sockets:' + JSON.stringify(sockets);
    if (socketBonus) line += ',socketBonus:' + JSON.stringify(socketBonus).replace(/"/g, '');
  }
  line += '}';
  return line;
}

// ============================================================
// 5. Main processing
// ============================================================
async function main() {
  const allOutput = {}; // className -> lines[]
  const fetchCache = {}; // id -> fetched data
  let totalNew = 0;
  let totalFromMaster = 0;
  let totalFetched = 0;
  let totalSkipped = 0;

  for (const slug of Object.keys(GUIDE_DATA)) {
    if (SKIP_SPECS.includes(slug)) continue;

    const existingIds = getSpecItemIds(slug);
    const guideSlots = GUIDE_DATA[slug];
    const specInfo = specs.find(s => s.slug === slug);
    if (!specInfo) {
      console.log('WARN: spec ' + slug + ' not found in SPECS');
      continue;
    }

    // Determine class name for output file grouping
    const className = specInfo.cls.toLowerCase();
    if (!allOutput[className]) allOutput[className] = [];

    const specLines = [];
    specLines.push('=== ' + slug + ' ===');
    let specNew = 0;

    for (const [slot, ids] of Object.entries(guideSlots)) {
      const slotLines = [];

      for (const id of ids) {
        if (existingIds.has(id)) continue; // Already in this spec

        // Check master lookup first (item exists in another spec)
        if (masterItems[id]) {
          const mi = masterItems[id];
          slotLines.push(mi.full);
          totalFromMaster++;
          specNew++;
          continue;
        }

        // Need to fetch from API
        if (fetchCache[id]) {
          if (fetchCache[id].line) {
            slotLines.push(fetchCache[id].line);
            specNew++;
          }
          continue;
        }

        try {
          const data = await fetchItem(id);
          const stats = parseStats(data.tooltip);
          const { sockets, socketBonus } = parseSockets(data.tooltip);
          const q = qualityStr(data.quality);
          const src = 'Pre-Raid BiS';
          const line = formatItemLine(data.name, id, q, src, stats, sockets, socketBonus);
          fetchCache[id] = { line, name: data.name };
          slotLines.push(line);
          totalFetched++;
          specNew++;
          console.log('  FETCH: ' + data.name + ' (' + id + ')');

          // Rate limit: 100ms between requests
          await new Promise(r => setTimeout(r, 100));
        } catch(e) {
          console.log('  FAIL: ' + id + ' - ' + e.message);
          fetchCache[id] = { line: null };
          totalSkipped++;
        }
      }

      if (slotLines.length > 0) {
        specLines.push('--- ' + slot + ' ---');
        slotLines.forEach(l => specLines.push(l));
      }
    }

    if (specNew > 0) {
      allOutput[className].push(...specLines);
      allOutput[className].push('');
      totalNew += specNew;
      console.log(slug + ': +' + specNew + ' new items');
    } else {
      console.log(slug + ': no new items');
    }
  }

  // Write output files
  if (!fs.existsSync('_item-additions-v2')) {
    fs.mkdirSync('_item-additions-v2');
  }

  for (const [cls, lines] of Object.entries(allOutput)) {
    if (lines.length === 0) continue;
    const outPath = '_item-additions-v2/' + cls + '.txt';
    fs.writeFileSync(outPath, lines.join('\n'));
    console.log('Wrote: ' + outPath);
  }

  console.log('\n=== Summary ===');
  console.log('From master lookup (cross-spec): ' + totalFromMaster);
  console.log('Fetched from API: ' + totalFetched);
  console.log('Skipped (errors): ' + totalSkipped);
  console.log('Total new items: ' + totalNew);
}

main().catch(console.error);
