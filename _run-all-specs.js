#!/usr/bin/env node
'use strict';

// Run _sync-spec.js for all 27 specs sequentially, collecting results.
const { execSync } = require('child_process');
const path = require('path');

const SPECS = [
  'fire-mage','arcane-mage','frost-mage',
  'holy-paladin','prot-paladin','ret-paladin',
  'fury-warrior','arms-warrior','prot-warrior',
  'bm-hunter','mm-hunter','sv-hunter',
  'combat-rogue','assassination-rogue',
  'shadow-priest','holy-priest','disc-priest',
  'ele-shaman','enh-shaman','resto-shaman',
  'affliction-warlock','destruction-warlock','demo-warlock',
  'balance-druid','feral-cat-druid','feral-bear-druid','resto-druid',
];

const results = [];

for (const spec of SPECS) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Running: ${spec}`);
  console.log('='.repeat(60));
  try {
    const output = execSync(`node _sync-spec.js ${spec}`, {
      cwd: __dirname,
      encoding: 'utf8',
      timeout: 300000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    // Extract summary
    const todoMatch = output.match(/TODO sources:\s+(\d+)/);
    const totalMatch = output.match(/Total items:\s+(\d+)/);
    const todos = todoMatch ? parseInt(todoMatch[1]) : '?';
    const total = totalMatch ? parseInt(totalMatch[1]) : '?';

    // Extract TODO item names
    const todoItems = [];
    const todoRe = /\[(\w+)\] (.+?) \((\d+)\)/g;
    const todoSection = output.split('Items needing source resolution')[1] || '';
    let m;
    while ((m = todoRe.exec(todoSection))) {
      todoItems.push({ slot: m[1], name: m[2], id: m[3] });
    }

    results.push({ spec, total, todos, todoItems });
    console.log(`  → ${total} items, ${todos} TODOs`);
  } catch (e) {
    console.log(`  → FAILED: ${e.message.split('\n')[0]}`);
    results.push({ spec, total: 0, todos: -1, todoItems: [] });
  }
}

// Final summary
console.log(`\n${'='.repeat(60)}`);
console.log('  ALL SPECS SUMMARY');
console.log('='.repeat(60));
console.log('');
console.log('  Spec                     Items  TODOs');
console.log('  ' + '-'.repeat(45));
let totalTodos = 0;
for (const r of results) {
  const todoPad = r.todos > 0 ? ` ← ${r.todoItems.map(t => t.name).join(', ')}` : '';
  console.log(`  ${r.spec.padEnd(25)} ${String(r.total).padStart(5)}  ${String(r.todos).padStart(5)}${todoPad}`);
  if (r.todos > 0) totalTodos += r.todos;
}
console.log('');
console.log(`  Total TODOs across all specs: ${totalTodos}`);
