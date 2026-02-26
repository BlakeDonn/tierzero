# Tier Zero — TBC Pre-Raid BiS Tool

## Architecture
Single-file app: `index.html` (~2100 lines) with inline CSS + JS. No build tools, no frameworks.
Uses Wowhead tooltips (`iconizeLinks`, `colorLinks`) for item display.

## Item Data Structure
Items live in the `SPECS` object, keyed by spec slug (e.g. `"fire-mage"`).
Each item: `{name:"Item Name", id:WOWHEAD_ID, q:Q.epic, src:"Source", stats:{...}}`

Priority order per spec: `PRIORITY_ORDER["fire-mage"]` — array of 10 strings like `"Item — Source hint"`.

## Adding New Specs/Classes

### Step 1: Build the item data
Each spec needs:
- Entry in `SPECS` with `class`, `spec`, `classColor`, `icon`, `notes`, `statWeights`, `hitCap`, `slots`
- Each slot key (head, neck, shoulders, back, chest, wrists, hands, waist, legs, feet, ring1, ring2, trinket1, trinket2, mainhand, offhand, plus class-specific like wand/libram/totem/idol) contains an array of items ranked best-to-worst
- Entry in `PRIORITY_ORDER` with 10 priority upgrade strings

### Step 2: Verify ALL item IDs against Wowhead
This is critical — almost half the original IDs were wrong.

**Verification process:**
1. Extract all `{name:"...",id:NNNNN}` pairs from the file
2. For each item, hit `https://nether.wowhead.com/tooltip/item/{ID}?dataEnv=5&locale=0`
3. Compare the returned `name` field against our item name
4. If mismatch: look up correct ID via web search `"wowhead TBC {item name} site:wowhead.com"`
5. The correct ID is in the URL: `wowhead.com/tbc/item=XXXXX/item-slug`

**Batch verification script pattern:**
```js
// node verify-ids.js
const https = require('https');
function fetchTooltipName(itemId) {
  return new Promise((resolve) => {
    const url = `https://nether.wowhead.com/tooltip/item/${itemId}?dataEnv=5&locale=0`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data).name || null); } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}
// Extract items with regex: /\{name:"([^"]+)",id:(\d+)/g
// Verify each, collect mismatches, then fix via web search
```

**For fixing mismatched IDs:** Wowhead's search APIs don't work for TBC items via scripting. Use web search (e.g. `WebSearch` tool) in parallel batches of ~23 items per agent. Then apply fixes with a simple regex replace script.

**Apply script pattern:**
```js
// For each fix: {name: correctId}
const pattern = new RegExp(`(\\{name:"${escapedName}",id:)(\\d+)`, 'g');
html = html.replace(pattern, `$1${correctId}`);
```

### Step 3: Add to spec picker
The spec picker in `buildSpecPicker()` auto-reads from `SPECS` keys, so new specs appear automatically.

## Key localStorage Keys
- `prebis-spec` — selected spec slug
- `prebis-tracker-{spec}` — JSON object of slot → value (index or `c:ID:NAME` for custom)
- `prebis-professions` — JSON array of enabled profession names

## Wowhead Live Search in Tracker
The typeahead has live Wowhead search for any TBC item (not just BiS):
- BiS items show instantly as user types
- After 400ms debounce + 3 char minimum, searches Wowhead via `api.allorigins.win` CORS proxy
- Fetches `https://www.wowhead.com/tbc/items/name:{query}` and parses `listviewitems` JSON from HTML
- Filters to equippable gear (armor + weapons), capped at 15 results
- Results cached in memory per query to avoid duplicate fetches
- On select: saves as `c:ID:NAME` in tracker localStorage with correct Wowhead ID
- Shows "(custom)" label, works with My Gear view, Wowhead tooltips work automatically
- Custom items have no stats (skipped in stat calculations)

### CORS Proxy Dependency
Uses `api.allorigins.win` as CORS proxy since Wowhead's main site doesn't send CORS headers.
The `nether.wowhead.com` tooltip API has `Access-Control-Allow-Origin: *` but only supports lookup by ID, not search.
