// Node twin for the Sandpile math core. Zero-dep. Run: `node core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html, so the page's
// self-test and this test can never drift. Asserts the conditional math claims — the ABELIAN
// theorem (order-independence, exact) and the recurrent IDENTITY e — plus a genuinely
// DISCRIMINATING negative control, an EMPIRICAL-flagged (non-claim) tail sanity check, and a
// byte-twin parity check that the inline really is byte-identical.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  mulberry32, neighborsOf,
  pickFirst, pickLast, pickRandom,
  toppleToStable, toppleSteps, add, combine,
  maximalStable, identity, toppleStateDependentToStable
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }

const key = (g) => Array.from(g).join(',');
const allLE3 = (g) => { for (let i = 0; i < g.length; i++) if (g[i] > 3) return false; return true; };

// Six independent firing orders: row-major, reverse, and four seeded random shuffles.
function orderPolicies(){
  return [
    pickFirst, pickLast,
    pickRandom(mulberry32(0x5A11)), pickRandom(mulberry32(0xB33F)),
    pickRandom(mulberry32(0xC0DE)), pickRandom(mulberry32(0xFEED)),
  ];
}

// Build a random unstable pile on an L×L grid (heights 0..7, well over the threshold 4).
function randomPile(L, rng){
  const g = new Int32Array(L * L);
  for (let i = 0; i < L * L; i++) g[i] = (rng() * 8) | 0;
  return g;
}

// ── CLAIM 1 — ABELIAN (EXACT, the soul) ──────────────────────────────────────────────────────
// Over many random unstable piles, stabilize each in 6 different orders under the CORRECT rule;
// every final grid must be BYTE-IDENTICAL and every cell <= 3. BONUS (Dhar): the total topple
// count is identical across orders too.
const L = 13;                       // a quick test grid (the page ships 33×33; the theorem is size-free)
const PILES = 300;                  // >= 300 random piles
const rng = mulberry32(0xABCDEF);
let byteIdAll = 0, le3All = 0, toppleCountAll = 0;
for (let t = 0; t < PILES; t++){
  const pile = randomPile(L, rng);
  const results = orderPolicies().map(p => toppleToStable(pile, L, p));
  const k0 = key(results[0].grid);
  const sameGrid    = results.every(r => key(r.grid) === k0);
  const stable      = results.every(r => allLE3(r.grid));
  const sameTopples = results.every(r => r.topples === results[0].topples);
  if (sameGrid)    byteIdAll++;
  if (stable)      le3All++;
  if (sameTopples) toppleCountAll++;
}
ck('CLAIM 1: ' + PILES + ' piles × 6 orders → final grid BYTE-IDENTICAL (abelian)', byteIdAll === PILES);
ck('CLAIM 1: every stabilized grid is stable (all cells <= 3)', le3All === PILES);
ck('CLAIM 1 (Dhar): total topple count identical across all 6 orders', toppleCountAll === PILES);

// The ANIMATED path (toppleSteps generator) must land on the SAME heap as toppleToStable for the
// SAME order — proving the page's watched cascade is the theorem, not a re-implementation.
let genMatches = 0;
const grng = mulberry32(0x9001);
for (let t = 0; t < 60; t++){
  const pile = randomPile(L, grng);
  const direct = toppleToStable(pile, L, pickFirst);
  let last = null;
  for (const step of toppleSteps(pile, L, pickFirst)) last = step;
  const genGrid = last ? last.grid : Int32Array.from(pile);
  const genTopples = last ? last.topples : 0;
  if (key(genGrid) === key(direct.grid) && genTopples === direct.topples) genMatches++;
}
ck('animation parity: toppleSteps generator lands byte-identical to toppleToStable (60 piles)', genMatches === 60);

// ── CLAIM 2 — IDENTITY (EXACT) ───────────────────────────────────────────────────────────────
// e = identity(L) is stable; e ⊕ e === e byte-identical; e is a fixed point; and for recurrent x
// (any x already produced by stabilizing something), combine(e, x) === stabilize(x) === x.
for (const EL of [13, 33, 41]){           // odd sizes (true center for the mandala) incl. the shipped 33
  const e = identity(EL);
  const eStable = allLE3(e);
  const ee = combine(e, e, EL);
  const idemp = key(ee) === key(e);
  ck('CLAIM 2 @' + EL + ': identity e is stable (<=3)', eStable);
  ck('CLAIM 2 @' + EL + ': e ⊕ e === e byte-identical (fixed point)', idemp);
}
// e ⊕ x === x for a recurrent x: take x = stabilize(2·max) (recurrent by construction), 33×33.
(() => {
  const EL = 33;
  const e = identity(EL);
  const max = maximalStable(EL);
  const x = toppleToStable(add(max, max), EL, pickFirst).grid;   // recurrent
  const ex = combine(e, x, EL);
  ck('CLAIM 2 @33: e ⊕ x === x for recurrent x (e is the neutral element)', key(ex) === key(x));
})();

// ── NEGATIVE CONTROL (the corrected, DISCRIMINATING one) ─────────────────────────────────────
// The STATE-DEPENDENT broken rule run through the SAME order-independence harness MUST produce
// non-byte-identical grids across orders for AT LEAST ONE pile → the test reds if this control
// ever passes (i.e. if it ever became confluent, the harness would be proving nothing).
// (See core.mjs for WHY fixed-vector controls were rejected: they stay confluent — a false control.)
let controlBroke = 0, controlSurvivedAll = 0;
const crng = mulberry32(0xDEAD);
for (let t = 0; t < 300; t++){
  const pile = randomPile(L, crng);
  const results = orderPolicies().map(p => toppleStateDependentToStable(pile, L, p));
  const k0 = key(results[0].grid);
  const same = results.every(r => key(r.grid) === k0);
  if (!same) controlBroke++; else controlSurvivedAll++;
}
ck('NEGATIVE CONTROL: state-dependent rule FAILS byte-identity (order-dependent) on most piles',
   controlBroke > 250);   // overwhelmingly order-dependent; this is the discrimination proof
ck('NEGATIVE CONTROL: control is genuinely broken (not silently confluent like a fixed-vector rule)',
   controlBroke > 0);

// ── EMPIRICAL (asserted as a NON-claim) ──────────────────────────────────────────────────────
// Drive a single pile to stable one grain at a time from the center of a 33×33; record avalanche
// sizes; sanity-check the distribution is HEAVY-TAILED (max >> median). We do NOT assert a
// power-law exponent — the finite grid truncates the tail (finite-size cutoff). This keeps the
// side-rail honest: it is empirical, not a theorem.
(() => {
  const EL = 33, center = ((EL >> 1) * EL + (EL >> 1));
  const g = identity(EL);                  // start from a recurrent background so avalanches are rich
  const sizes = [];
  const arng = mulberry32(0x7A11);
  for (let drop = 0; drop < 2000; drop++){
    const i = (arng() * EL * EL) | 0;
    g[i] += 1;
    const before = toppleToStable(g, EL, pickFirst);
    sizes.push(before.topples);
    g.set(before.grid);
  }
  const sorted = sizes.slice().sort((a, b) => a - b);
  const median = sorted[sorted.length >> 1];
  const max = sorted[sorted.length - 1];
  const big = sizes.filter(s => s > 50).length;
  // heavy tail: the biggest avalanche dwarfs the median, and rare big ones exist.
  ck('EMPIRICAL (non-claim): avalanche sizes heavy-tailed (max >> median, rare big events present)',
     max >= 10 * Math.max(1, median) && big > 0);
})();
// also assert at center for legibility-anchor
(() => {
  const EL = 33, center = ((EL >> 1) * EL + (EL >> 1));
  const g = new Int32Array(EL * EL);
  for (let k = 0; k < 4; k++) g[center] += 1;   // load center to 4
  const r = toppleToStable(g, EL, pickFirst);
  ck('EMPIRICAL anchor: a single center cell at 4 topples exactly once', r.topples === 1);
})();

// ── HAND ANCHORS ─────────────────────────────────────────────────────────────────────────────
// A single cell seeded to 4 on a 3×3 topples exactly once, leaving its 4 neighbours +1 and itself 0.
ck('anchor: 3×3 center=4 topples once → 4 neighbours +1, center 0', (() => {
  const L3 = 3, c = 4;     // center index of 3×3
  const g = new Int32Array(9); g[c] = 4;
  const r = toppleToStable(g, L3, pickFirst);
  const exp = new Int32Array(9); exp[1] = 1; exp[3] = 1; exp[5] = 1; exp[7] = 1; exp[c] = 0;
  return r.topples === 1 && key(r.grid) === key(exp);
})());
// A corner cell at 4 on a 3×3 has only 2 on-grid neighbours → 2 grains fall off the sink.
ck('anchor: 3×3 corner=4 topples once → only 2 neighbours +1 (2 grains lost to the sink)', (() => {
  const L3 = 3;
  const g = new Int32Array(9); g[0] = 4;
  const r = toppleToStable(g, L3, pickFirst);
  const exp = new Int32Array(9); exp[1] = 1; exp[3] = 1; exp[0] = 0;
  return r.topples === 1 && key(r.grid) === key(exp);
})());
// neighborsOf sanity: an interior cell on a 5×5 has 4 neighbours; a corner has 2; an edge has 3.
ck('anchor: neighborsOf counts (interior 4, corner 2, edge 3) on 5×5', (() => {
  return neighborsOf(5, 12).length === 4 && neighborsOf(5, 0).length === 2 && neighborsOf(5, 2).length === 3;
})());

// ── BYTE-TWIN PARITY ─────────────────────────────────────────────────────────────────────────
// The CORE region inlined into index.html must be byte-identical to the CORE region of core.mjs.
function coreRegion(text){
  const BEGIN = '// === CORE BEGIN ===';
  const END = '// === CORE END ===';
  const i = text.indexOf(BEGIN);
  const j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i, j + END.length);
}
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
const coreReg = coreRegion(coreSrc);
const pageReg = coreRegion(pageSrc);
ck('byte-twin: index.html CORE region present', !!pageReg);
ck('byte-twin: core.mjs CORE region present', !!coreReg);
ck('byte-twin PARITY: index.html CORE === core.mjs CORE (byte-identical)', !!coreReg && !!pageReg && coreReg === pageReg);

// ── report ──
console.log('Sandpile core.test.mjs');
console.log('  abelian: ' + byteIdAll + '/' + PILES + ' piles byte-identical · stable ' + le3All + '/' + PILES +
            ' · Dhar topple-count ' + toppleCountAll + '/' + PILES);
console.log('  negative control: ' + controlBroke + '/300 piles order-DEPENDENT (broke byte-identity, as required)');
console.log('  byte-twin parity: ' + (coreReg === pageReg ? 'IDENTICAL' : 'DRIFTED'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
