const fs = require('fs');
const html = fs.readFileSync('data/specs.js','utf8');
const re = /\{name:"([^"]+)",id:(\d+),q:Q\.\w+,src:"([^"]+)"/g;
const items = {};
let m;
while ((m = re.exec(html)) !== null) {
  const name = m[1], id = m[2], src = m[3];
  if (!items[id]) items[id] = {name, sources: new Set()};
  items[id].sources.add(src);
}
const ids = Object.keys(items);
let conflicted = 0;
for (const id of ids) {
  if (items[id].sources.size > 1) {
    conflicted++;
    console.log('CONFLICT: ' + items[id].name + ' ('+id+'): ' + [...items[id].sources].join(' | '));
  }
}
console.log('\nTotal unique items: ' + ids.length);
console.log('Items with conflicting sources: ' + conflicted);
