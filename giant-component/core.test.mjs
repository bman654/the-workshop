// The Giant Component — Node twin (MUST exit 0 GREEN).
// ─────────────────────────────────────────────────────────────────────────────────────────────
// Imports the SAME core.mjs that is inlined byte-identical into index.html, then proves the claim
// at FULL scale (large n / many trials → crisp asymptotics). The in-page chip runs the same checks
// at a light scale via requestIdleCallback; the bands are chosen so BOTH profiles pass. A final
// byte-twin parity check reads both files and asserts the inlined CORE === core.mjs CORE char-for-char.
// ─────────────────────────────────────────────────────────────────────────────────────────────
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  mulberry32, hashSeed,
  edgesForK,
  randomEdges, latticeEdges,
  buildAt, largest, giantFraction,
  predictedS, floodMaxComponent
} from './core.mjs';

let pass = 0, fail = 0; const fails = [];
function ck(name, ok, detail = ''){
  if (ok){ pass++; console.log('  ✓ ' + name + (detail ? '  ·  ' + detail : '')); }
  else { fail++; fails.push(name); console.log('  ✗ ' + name + (detail ? '  ·  ' + detail : '')); }
}

console.log('Giant Component core.test.mjs  (full profile)');

// ── CLAIM 1 — above threshold, the MEASURED random giant fraction tracks the self-consistent root
//   S = 1 − e^(−kS) within a finite-n tolerance band, across a sweep of ⟨k⟩ (n=2000, averaged). ──
{
  const n = 2000;
  const ks = [1.2, 1.5, 2.0, 2.5, 3.0];
  const band = 0.06;
  let allWithin = true; const detail = [];
  for (const k of ks){
    const trials = 8; let acc = 0;
    for (let t = 0; t < trials; t++){
      const edges = randomEdges(n, mulberry32(hashSeed('c1:' + k + ':' + t)));
      acc += giantFraction(edges, edgesForK(k, n), n);
    }
    const measured = acc / trials, pred = predictedS(k);
    if (Math.abs(measured - pred) > band) allWithin = false;
    detail.push(`k=${k}:S≈${measured.toFixed(2)}vs${pred.toFixed(2)}`);
  }
  ck(`CLAIM 1: measured S ≈ root of S=1−e^(−kS), k>1 sweep (±${band})`, allWithin, detail.join(' '));
}

// ── CLAIM 2 — the emergence is SHARP at ⟨k⟩=1: an honest O(log n) → Θ(n) discontinuity, not a
//   gradual climb. Sub-critical ⟨k⟩=0.8 largest comp / n VANISHES (<0.05 and shrinks as n grows —
//   in fact O(log n)); super-critical ⟨k⟩=1.6 holds a FIXED fraction (>0.4 at every size — Θ(n)).
//   A fixed fraction one side of k=1 and a vanishing fraction the other side IS the sharp snap. ──
{
  const Ns = [1000, 2000, 4000, 8000];
  const subFrac = [], supFrac = [], detail = [];
  for (const n of Ns){
    const sub = largest(randomEdges(n, mulberry32(hashSeed('sub:' + n))), edgesForK(0.8, n), n) / n;
    const sup = largest(randomEdges(n, mulberry32(hashSeed('sup:' + n))), edgesForK(1.6, n), n) / n;
    subFrac.push(sub); supFrac.push(sup);
    detail.push(`n=${n}:sub=${(sub*100).toFixed(1)}% sup=${(sup*100).toFixed(0)}%`);
  }
  const supThetaN  = supFrac.every(f => f > 0.4);                 // Θ(n): a fixed fraction
  const subVanish  = subFrac.every(f => f < 0.05);               // o(n): a vanishing fraction
  const subShrinks = subFrac[subFrac.length - 1] < subFrac[0];   // sub/n trends down with n
  ck('CLAIM 2: super-critical giant is Θ(n) — sup/n>0.4 at every size', supThetaN, detail.join(' '));
  ck('CLAIM 2: sub-critical largest is o(n) — sub/n<0.05 and shrinks as n grows', subVanish && subShrinks);
}

// ── CLAIM 3 — NEGATIVE CONTROL: the lattice, fed the SAME edge count, shows NO sharp snap. Across
//   the NEIGHBOURHOOD of the threshold ⟨k⟩∈{1.2,1.4,1.6} the random giant has already swallowed a
//   big fraction while the lattice giant lags far behind (gap > 0.18). The snap is a property of
//   RANDOM long-range wiring, not of merely adding edges. (At much higher ⟨k⟩ the 2-D lattice
//   eventually percolates and the gap closes; the claim is about the threshold region.) ──────────
{
  const n = 2025;            // 45×45 — a true square grid
  const R = 1;
  const ks = [1.2, 1.4, 1.6];
  let gapOK = 0; const detail = [];
  for (const k of ks){
    const m = edgesForK(k, n);
    const sR = giantFraction(randomEdges(n, mulberry32(hashSeed('ctrlR:' + k))), m, n);
    const sL = giantFraction(latticeEdges(n, mulberry32(hashSeed('ctrlL:' + k)), R), m, n);
    if (sR - sL > 0.18) gapOK++;
    detail.push(`k=${k}:rand=${(sR*100).toFixed(0)}% lat=${(sL*100).toFixed(0)}%`);
  }
  ck('CLAIM 3 (control): lattice lags random by >0.18 across ⟨k⟩∈{1.2,1.4,1.6}', gapOK === ks.length, detail.join(' '));
}

// ── ORACLE — the VISIBLE engine (union-find) agrees EXACTLY with an INDEPENDENT BFS flood on the
//   largest component AND the component count, over many random edge prefixes. Two independent
//   algorithms agreeing ⇒ the meter reports truth. (floodMaxComponent shares no code with DSU.) ──
{
  let agree = 0, comps = 0; const trials = 60; const n = 400;
  for (let t = 0; t < trials; t++){
    const rng = mulberry32(hashSeed('oracle:' + t));
    const edges = randomEdges(n, rng);
    const m = (rng() * edges.length) | 0;
    const ufState = buildAt(edges, m, n);
    const flood = floodMaxComponent(edges, m, n);
    if (ufState.giantSize === flood.max) agree++;
    if (ufState.comps === flood.comps) comps++;
  }
  ck('ORACLE: union-find largest == independent BFS flood (60 random prefixes, exact)', agree === trials, `${agree}/${trials}`);
  ck('ORACLE: union-find component count == BFS flood count (60 prefixes, exact)', comps === trials, `${comps}/${trials}`);
}

// ── PREDICT guard — predictedS returns exactly 0 for k ≤ 1 (the only root; subcritical has no
//   giant), and a positive root for k > 1. ──────────────────────────────────────────────────────
{
  const subKs = [0.0, 0.4, 0.8, 1.0];
  let zeros = 0; for (const k of subKs) if (predictedS(k) === 0) zeros++;
  ck('PREDICT: S=0 exactly for all ⟨k⟩ ≤ 1 (subcritical has no giant)', zeros === subKs.length);
  // and S(2) matches the textbook value ≈ 0.7968...
  ck('PREDICT: S(2) ≈ 0.7968 (the textbook super-critical root)', Math.abs(predictedS(2) - 0.79681) < 1e-3, `S(2)=${predictedS(2).toFixed(5)}`);
}

// ── REVERSIBILITY — the knob is a PURE FUNCTION of (ordering, m). buildAt at the same m always
//   yields the same giant size, and scrubbing down then up returns to the identical state. ───────
{
  const n = 600; const edges = randomEdges(n, mulberry32(hashSeed('rev')));
  const mHi = edgesForK(2.4, n), mLo = edgesForK(0.6, n);
  const a = largest(edges, mHi, n);
  const down = largest(edges, mLo, n);   // scrub down — peel edges back out
  const b = largest(edges, mHi, n);      // scrub back up — must land on the same state
  ck('REVERSIBLE: scrub up→down→up returns to the identical giant size (history-free)', a === b && down < a, `up=${a} down=${down}`);
}

// ── BYTE-TWIN PARITY — the CORE region inlined into index.html is byte-identical to core.mjs. ────
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
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass · byte-twin ' + (coreReg === pageReg ? 'IDENTICAL' : 'DRIFTED'));
if (fail){ console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
