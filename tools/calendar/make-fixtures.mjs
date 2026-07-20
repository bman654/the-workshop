// ============================================================================
//  MAKE-FIXTURES — the canonical moment manifests (WS4 The Living Calendar).
//  Binding: SCORE.md §8.2 fixture table (F-DNW … F-WEV; NINE fixtures — F-WEV
//  2026-07-07 · 20 is the distantAir/warm-evening fixture, r6). Every manifest is
//  GENERATED from the real cores — `Calendar.momentManifest(y,m,d,hour,Hours)`
//  — never hand-typed (DESIGN.md §6.1: dates re-derived); each asserts its
//  intended musical register via `Score.registerOf` (the §3.2 evaluation at
//  the hour's top, impl r2-m1) BEFORE being written, plus its round-3/4
//  DEFINING property (impl r3-M1 · impl/realist r4-M1): F-NOON solarNoonMin
//  58 · F-STRESS solarNoonMin 1 + annTier 1 · F-ANN annTier 1 · F-DAY
//  annTier 0 (G8's negative control). Node-only; never shipped to pages.
//  Regeneration is byte-identical (the in-process double-derive proves it).
//  Usage: node tools/calendar/make-fixtures.mjs
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { registerOf } from './score.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const Calendar = require('./calendar.js');
const Hours = require(path.join(here, '..', 'hours', 'hours.js'));

// SCORE §8.2 fixture table — id · date · hour · intended register (the
// assert surface) · defining properties (null-checked only where the table
// states them; seasonPhase targets are the table's p≈ values, circular).
const TABLE = [
  { id: 'F-DNW',    y: 2026, m: 12, d: 21, hour:  3, reg: 'deep-night', phase: 0.75 },
  { id: 'F-DAW',    y: 2026, m:  3, d: 20, hour:  6, reg: 'dawn',       phase: 0.00 },
  { id: 'F-DAY',    y: 2026, m:  6, d: 21, hour: 14, reg: 'day',        phase: 0.25, annTier: 0 },
  { id: 'F-NOON',   y: 2026, m:  6, d: 21, hour: 11, reg: 'day',        solarNoonMin: 58 },
  { id: 'F-DSK',    y: 2026, m:  9, d: 22, hour: 18, reg: 'dusk',       phase: 0.50 },
  { id: 'F-EVE',    y: 2026, m: 11, d:  1, hour: 18, reg: 'evening' },
  { id: 'F-ANN',    y: 2027, m:  6, d:  7, hour: 10, reg: 'day',        annTier: 1 },
  { id: 'F-STRESS', y: 2027, m:  6, d:  7, hour: 12, reg: 'day',        annTier: 1, solarNoonMin: 1 },
  { id: 'F-WEV',    y: 2026, m:  7, d:  7, hour: 20, reg: 'evening',    phase: 0.29 }, // the distantAir fixture — r6 (hour 20: alt −6.67° falling ⇒ evening)
];

function fail(msg) { console.error('make-fixtures: FAIL — ' + msg); process.exit(1); }

function derive(row) {
  const mo = Calendar.momentManifest(row.y, row.m, row.d, row.hour, Hours);
  const reg = registerOf(mo); // validates the manifest too (SCORE §2 bounds)
  if (reg !== row.reg)
    fail(row.id + ': registerOf = ' + reg + ', table intends ' + row.reg);
  if (row.annTier !== undefined && mo.annTier !== row.annTier)
    fail(row.id + ': annTier = ' + mo.annTier + ', table intends ' + row.annTier);
  if (row.solarNoonMin !== undefined && mo.solarNoonMin !== row.solarNoonMin)
    fail(row.id + ': solarNoonMin = ' + mo.solarNoonMin + ', table intends ' + row.solarNoonMin);
  if (row.phase !== undefined) {
    const d = Math.abs(mo.seasonPhase - row.phase);
    if (Math.min(d, 1 - d) > 0.02) // circular — F-DAW's 0.9997 ≈ 0.00
      fail(row.id + ': seasonPhase = ' + mo.seasonPhase + ', table intends ≈' + row.phase);
  }
  return { manifest: mo, reg };
}

const outDir = path.join(here, 'fixtures');
fs.mkdirSync(outDir, { recursive: true });

for (const row of TABLE) {
  const a = derive(row);
  const b = derive(row); // in-process double-derive — byte-identical proof
  const ja = JSON.stringify(a.manifest, null, 2) + '\n';
  const jb = JSON.stringify(b.manifest, null, 2) + '\n';
  if (ja !== jb) fail(row.id + ': double-derive not byte-identical');
  const file = path.join(outDir, row.id + '.json');
  fs.writeFileSync(file, ja);
  console.log(row.id.padEnd(9) + ' ' + a.reg.padEnd(10) +
    ' annTier=' + a.manifest.annTier +
    ' solarNoonMin=' + a.manifest.solarNoonMin +
    ' -> ' + path.relative(process.cwd(), file) + ' (' + ja.length + ' B)');
}
console.log('make-fixtures: ' + TABLE.length + ' fixtures written, registers asserted, OK');
