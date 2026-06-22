#!/usr/bin/env node
// The Arctic Circle — Node twin of the in-page self-test. Runs the SAME runSelfTest()
// the page runs (single source of truth), then adds deeper cross-checks the page can't
// afford inline (bigger n, exhaustive enumeration, longer uniformity). Exit non-zero on
// any failure so the publisher / forge can gate.

import {
  makeRng, sampleTiling, validateTiling, dominoesOf, inDiamond, diamondCellCount,
  enumerateTilingCount, tilingCountFormula,
  cornerReport, floodCorner, classifyFrozen, temperateFraction, TEMPERATE_TARGET,
  allHorizontalTiling, canonicalKey, ORI, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail){
  if (cond){ pass++; console.log('  \x1b[32m✓\x1b[0m ' + name); }
  else { fail++; fails.push(name + (detail ? ' — ' + detail : '')); console.log('  \x1b[31m✗\x1b[0m ' + name + (detail ? ' — ' + detail : '')); }
}

console.log('\n  The Arctic Circle — core.test.mjs\n  ' + '─'.repeat(60));

// ── Layer 1: the SAME battery the page renders ──
console.log('\n  layer 1 · the in-page self-test battery (verbatim):');
const r = runSelfTest();
for (const line of r.lines) ok(line.name, line.ok, line.detail);
ok(`battery reports ${r.pass}/${r.total} green (≥7 checks)`, r.fails.length === 0 && r.total >= 7, `${r.pass}/${r.total}`);

// ── Layer 2: deeper node-only cross-checks ──
console.log('\n  layer 2 · node-only deep cross-checks:');

// (A) CRUX-3 EXACT, pushed to n=5: enumerate === 2^(n(n+1)/2). (n=5 is 2^15 = 32768
//     tilings — exhaustive backtracking still finishes; the page stops at n=4.)
{
  let allok = true, ff = '';
  for (let n = 1; n <= 5 && allok; n++){
    const got = enumerateTilingCount(n), want = tilingCountFormula(n);
    if (got !== want){ allok = false; ff = `n=${n}: ${got} ≠ ${want}`; }
  }
  ok('CRUX-3 exhaustive count === 2^(n(n+1)/2) up to n=5 (2^15=32768)', allok, ff);
}

// (B) the diamond cell count is exactly 2n(n+1), always even (dominoes can tile it).
{
  let allok = true, ff = '';
  for (let n = 1; n <= 40 && allok; n++){
    const cells = diamondCellCount(n);
    if (cells !== 2*n*(n+1)){ allok = false; ff = `n=${n}: cells ${cells} ≠ ${2*n*(n+1)}`; }
    if (cells % 2 !== 0){ allok = false; ff = `n=${n}: odd cell count ${cells}`; }
  }
  ok('diamond cell count === 2n(n+1) (even) for n=1..40', allok, ff);
}

// (C) sampler VALIDITY, pushed to n=48 over many seeds — every sample is a perfect
//     tiling (every cell covered once, none outside, partner-consistent).
{
  let allok = true, ff = '';
  for (let n = 1; n <= 48 && allok; n += (n < 8 ? 1 : 8)){
    for (let s = 1; s <= 6 && allok; s++){
      const g = sampleTiling(n, makeRng((n*2654435761 + s*40503 + 13) >>> 0));
      const v = validateTiling(g, n);
      if (!v.ok){ allok = false; ff = `n=${n},seed${s}: ${v.reason} (${v.covered}/${v.cells})`; }
    }
  }
  ok('sampler validity: every sample perfectly tiles the diamond, n=1..48', allok, ff);
}

// (D) CRUX-1 EXACT, pushed to n=20: in EVERY sample, all four flood-filled frozen
//     corners are strictly monochromatic in their forced orientation AND non-empty.
{
  let allok = true, ff = '';
  for (let n = 12; n <= 20 && allok; n += 2){
    for (let s = 1; s <= 10 && allok; s++){
      const g = sampleTiling(n, makeRng((n*99991 + s*131071 + 7) >>> 0));
      const cr = cornerReport(g, n);
      if (!cr.allMono){ allok = false; ff = `n=${n},seed${s}: a corner not mono`; }
      else if (!cr.allNonEmpty){ allok = false; ff = `n=${n},seed${s}: corner empty`; }
    }
  }
  ok('CRUX-1: all four frozen corners mono+non-empty, EVERY sample n=12..20', allok, ff);
}

// (E) CRUX-1 deeper — the flooded frozen corners are pairwise DISJOINT (no cell is in
//     two corners) for every sample (the four brick-walls never touch at large n).
{
  let allok = true, ff = '';
  for (let n = 14; n <= 18 && allok; n += 2){
    for (let s = 1; s <= 6 && allok; s++){
      const g = sampleTiling(n, makeRng((n*1000003 + s*7919) >>> 0));
      const sides = ['top','bottom','left','right'].map(sd => floodCorner(g, n, sd));
      const seen = new Set();
      for (const f of sides){ for (const [rr, cc] of f.cells){ const key = rr*1000+cc; if (seen.has(key)){ allok = false; ff = `n=${n},seed${s}: corner overlap at (${rr},${cc})`; } seen.add(key); } }
    }
  }
  ok('CRUX-1: the four frozen corners are pairwise disjoint, n=14..18', allok, ff);
}

// (F) CRUX-2 MEASURED — the temperate fraction rises monotonically across a longer
//     ladder of n and approaches π/4 from below; the gap shrinks as n grows.
{
  const ns = [8, 16, 32, 56], seeds = 6;
  const fr = ns.map(n => { let a = 0; for (let s = 0; s < seeds; s++) a += temperateFraction(sampleTiling(n, makeRng((0xBEEF01 + s*0x9e3779b9 + n*2246822519) >>> 0)), n).fraction; return a / seeds; });
  let monotone = true; for (let i = 1; i < fr.length; i++) if (!(fr[i] > fr[i-1])) monotone = false;
  const below = fr.every(x => x <= TEMPERATE_TARGET + 1e-9);
  const gapShrinks = (TEMPERATE_TARGET - fr[fr.length-1]) < (TEMPERATE_TARGET - fr[0]);
  ok('CRUX-2: temperate fraction climbs monotonically toward π/4 (n=8<16<32<56, gap shrinks)', monotone && below && gapShrinks, `[${fr.map(x=>x.toFixed(3)).join(', ')}] → ${TEMPERATE_TARGET.toFixed(3)}`);
}

// (G) CRUX-2 NEG-CONTROL — the deterministic all-frozen brick-wall has temperate
//     fraction 0 at every tested n (it is entirely one of the four frozen regions).
{
  let allok = true, ff = '';
  for (let n = 8; n <= 48; n += 8){
    const f = temperateFraction(allHorizontalTiling(n), n).fraction;
    if (f > 0.001){ allok = false; ff = `n=${n}: all-frozen temperate ${f.toFixed(4)} ≠ 0`; }
  }
  ok('CRUX-2 neg-control: all-frozen tiling temperate === 0 for n=8..48', allok, ff);
}

// (H) UNIFORMITY — push the n=2 (8 tilings) histogram to 24000 draws: every tiling
//     appears and the max deviation from uniform tightens well under 15%.
{
  const n = 2, trials = 24000, expected = 8;
  const counts = new Map();
  const rng = makeRng(0xA11CE5);
  for (let i = 0; i < trials; i++){
    const key = canonicalKey(sampleTiling(n, rng), n);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const exp = trials / expected;
  let maxRatio = 0; for (const v of counts.values()) maxRatio = Math.max(maxRatio, Math.abs(v - exp) / exp);
  ok('uniformity: n=2, 24000 draws hit all 8 tilings, maxDev < 15%', counts.size === expected && maxRatio < 0.15, `distinct=${counts.size}/8, maxDev=${(maxRatio*100).toFixed(1)}%`);
}

// (I) UNIFORMITY at n=3 (64 tilings) — every one of the 64 tilings appears over 64000
//     draws (catches a shuffler that can't reach some tilings).
{
  const n = 3, trials = 64000, expected = 64;
  const seen = new Set();
  const rng = makeRng(0x5EED03);
  for (let i = 0; i < trials; i++) seen.add(canonicalKey(sampleTiling(n, rng), n));
  ok('uniformity: n=3, 64000 draws reach all 64 distinct tilings', seen.size === expected, `distinct=${seen.size}/64`);
}

// (J) DETERMINISM — the SAME seed yields the byte-IDENTICAL tiling (the page, the test,
//     and the twin can never silently disagree). Two independent runs at several n.
{
  let allok = true, ff = '';
  for (let n = 1; n <= 24 && allok; n += 5){
    const a = canonicalKey(sampleTiling(n, makeRng(0xD37E)), n);
    const b = canonicalKey(sampleTiling(n, makeRng(0xD37E)), n);
    if (a !== b){ allok = false; ff = `n=${n}: same seed gave different tilings`; }
  }
  ok('determinism: identical seed ⇒ byte-identical tiling, n=1..24', allok, ff);
}

console.log('\n  ' + '─'.repeat(60));
if (fail === 0){
  console.log(`  \x1b[32mALL GREEN — ${pass}/${pass} checks pass (both layers).\x1b[0m\n`);
  process.exit(0);
} else {
  console.log(`  \x1b[31mFAILED — ${pass} pass, ${fail} fail.\x1b[0m`);
  for (const f of fails) console.log('    · ' + f);
  console.log('');
  process.exit(1);
}
