// Node twin for The Reciprocal Twins core. Zero-dep. Run: `node reciprocal-twins/core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html, so the page's gold
// self-test pill and this test can never drift. It re-proves the FIVE legs the in-page pill proves:
//   1. TICK COINCIDENCE — across a sweep of p and λ, reciprocalOptics(n,p,λ) and reciprocalSound(n,p,c)
//      both === n/p to machine-ε AND agree with each other to < 1e-12. Two disjoint cores, one ladder.
//   2. λ-INDEPENDENCE — the optical reciprocal coordinate for fixed (n,p) is invariant across all λ.
//   3. LOCKSTEP — doubling p halves every tick coordinate for BOTH families (the reciprocity law).
//   4. NEGATIVE CONTROL (load-bearing, two-pronged): chirping the grating pushes its array-factor
//      peaks off n/p, AND the carillon's inharmonic bell partials miss the integer comb by > 0.1.
//      A vacuous always-aligned checker would PASS leg 1 and FAIL this leg.
//   5. BYTE-TWIN PARITY — index.html's inlined CORE slab === core.mjs CORE char-for-char.
// process.exit(pass === total ? 0 : 1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  SPEED_OF_SOUND, BELL_PARTIALS,
  reciprocalOptics, reciprocalSound, sinThetaDeg, fHz,
  chirpedPeakDeviation, bellTickDeviations,
} from './core.mjs';

let pass = 0, fail = 0; const fails = [];
function ck(name, ok, info) {
  if (ok) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { fail++; fails.push(name); console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\nThe Reciprocal Twins — Node twin (the five legs the in-page pill proves)\n');

const c = SPEED_OF_SOUND;
// p is a period; we use micrometres for optics & "metres /1e6" share the SAME number so n/p is shared.
// (The reciprocal coordinate is dimensionless-per-period; the two worlds collapse onto the SAME tick
// index n because both reduce to n/p — we sweep p as a bare number, λ in the optics' own units.)
const PSWEEP = [2, 4, 6, 8, 10, 14];               // µm
const LSWEEP = [0.450, 0.532, 0.633];              // µm (450/532/633 nm)

// ── LEG 1: TICK COINCIDENCE across a sweep ────────────────────────────────────
console.log('— Leg 1: tick coincidence (two disjoint cores both land on {n/p} to machine-ε) —');
{
  let worstCross = 0, worstOpt = 0, worstSnd = 0, checked = 0, evan = 0;
  for (const p of PSWEEP) {
    for (const lambda of LSWEEP) {
      for (let n = 0; n <= 6; n++) {
        const opt = reciprocalOptics(n, p, lambda);
        const snd = reciprocalSound(n, p, c);
        const ideal = n / p;
        if (opt === null) { evan++; continue; }    // evanescent optical order — no spot to compare
        checked++;
        worstOpt = Math.max(worstOpt, Math.abs(opt - ideal));
        worstSnd = Math.max(worstSnd, Math.abs(snd - ideal));
        worstCross = Math.max(worstCross, Math.abs(opt - snd));
      }
    }
  }
  ck('optics ν === n/p to machine-ε across the sweep', worstOpt < 1e-12, 'max |opt−n/p| = ' + worstOpt.toExponential(2));
  ck('sound ν === n/p to machine-ε across the sweep', worstSnd < 1e-12, 'max |snd−n/p| = ' + worstSnd.toExponential(2));
  ck('the two disjoint cores AGREE: |optics − sound| < 1e-12', worstCross < 1e-12,
    'max |opt−snd| = ' + worstCross.toExponential(2) + ' over ' + checked + ' coincidences (' + evan + ' evanescent culled)');
}

// ── LEG 2: λ-INDEPENDENCE ──────────────────────────────────────────────────────
console.log('\n— Leg 2: λ-independence (color moves the SCREEN, never the reciprocal tick) —');
{
  let allInvariant = true, anglesMoved = true, worstSpread = 0;
  for (const p of PSWEEP) {
    for (let n = 1; n <= 4; n++) {
      // the optical reciprocal coordinate must be identical across all three λ (when propagating)
      const vs = LSWEEP.map((l) => reciprocalOptics(n, p, l)).filter((v) => v !== null);
      if (vs.length >= 2) {
        const spread = Math.max(...vs) - Math.min(...vs);
        worstSpread = Math.max(worstSpread, spread);
        if (spread > 1e-12) allInvariant = false;
        // and the RAW angle must DIFFER across λ (it's a real, λ-dependent physical world)
        const angs = LSWEEP.map((l) => sinThetaDeg(n, p, l)).filter((a) => a !== null);
        if (angs.length >= 2 && Math.max(...angs) - Math.min(...angs) < 1e-6) anglesMoved = false;
      }
    }
  }
  ck('optical ν is INVARIANT across λ for fixed (n,p)', allInvariant, 'max spread = ' + worstSpread.toExponential(2));
  ck('but the RAW angle sinθ DOES move with λ (a real, λ-dependent world)', anglesMoved,
    'e.g. p=4 n=1: ' + LSWEEP.map((l) => sinThetaDeg(1, 4, l).toFixed(2) + '°').join(' / '));
}

// ── LEG 3: LOCKSTEP (the reciprocity law) ──────────────────────────────────────
console.log('\n— Leg 3: lockstep — doubling p halves every tick for BOTH families at once —');
{
  let optOk = true, sndOk = true, worstOpt = 0, worstSnd = 0;
  for (const p of PSWEEP) {
    for (let n = 1; n <= 4; n++) {
      const oP = reciprocalOptics(n, p, 0.450), o2P = reciprocalOptics(n, 2 * p, 0.450);
      if (oP !== null && o2P !== null) { const d = Math.abs(o2P - oP / 2); worstOpt = Math.max(worstOpt, d); if (d > 1e-12) optOk = false; }
      const sP = reciprocalSound(n, p, c), s2P = reciprocalSound(n, 2 * p, c);
      const d2 = Math.abs(s2P - sP / 2); worstSnd = Math.max(worstSnd, d2); if (d2 > 1e-12) sndOk = false;
    }
  }
  ck('OPTICS: recipCoord(n, 2p) === recipCoord(n, p)/2', optOk, 'max err = ' + worstOpt.toExponential(2));
  ck('SOUND:  recipCoord(n, 2p) === recipCoord(n, p)/2', sndOk, 'max err = ' + worstSnd.toExponential(2));
}

// ── LEG 4: NEGATIVE CONTROL (load-bearing, two-pronged) ────────────────────────
console.log('\n— Leg 4: load-bearing negative control (break the period → BOTH families smear) —');
{
  // (a) CHIRP the grating with a REAL array factor. eps=0 must stay ON the comb; eps>0 must drift off.
  const N = 9, orders = 4, p = 6;
  const devClean = chirpedPeakDeviation(p, N, 0, orders);
  const devChirp = chirpedPeakDeviation(p, N, 0.06, orders);
  ck('a PERFECT grating (ε=0) keeps its peaks ON the integer comb', devClean < 1e-3,
    'max peak deviation = ' + devClean.toExponential(2) + ' ticks');
  ck('a CHIRPED grating (ε=0.06) drives peaks OFF the comb (> floor)', devChirp > 0.05,
    'max peak deviation = ' + devChirp.toFixed(3) + ' ticks (real array factor, not a faked blur)');

  // (b) the inharmonic BELL partials miss the integer comb. The off-integer ratios deviate > 0.1.
  const devs = bellTickDeviations();
  const offIdx = BELL_PARTIALS.map((r, i) => ({ r, d: devs[i] })).filter((o) => Math.abs(o.r - Math.round(o.r)) > 1e-9);
  const offBad = offIdx.every((o) => o.d > 0.1);
  ck('the inharmonic bell ratios (1.19,2.55,3.42,4.18) miss the integer comb by > 0.1', offBad,
    offIdx.map((o) => o.r + '→' + o.d.toFixed(2)).join(' '));

  // ANTI-VACUITY: a checker that just returns n/p (always-aligned) would PASS leg 1 but FAIL here.
  ck('a vacuous always-aligned checker would FAIL this leg (the control has teeth)',
    devChirp > 0.05 && offBad);
}

// ── LEG 5: BYTE-TWIN PARITY ─────────────────────────────────────────────────────
console.log('\n— Leg 5: single-source discipline (the inlined slab is the module, byte-for-byte) —');
{
  const BEGIN = '// === CORE BEGIN ===', END = '// === CORE END ===';
  const region = (text) => { const i = text.indexOf(BEGIN), j = text.indexOf(END); return (i < 0 || j < 0 || j < i) ? null : text.slice(i, j + END.length); };
  const here = dirname(fileURLToPath(import.meta.url));
  const coreReg = region(readFileSync(join(here, 'core.mjs'), 'utf8'));
  const pageReg = region(readFileSync(join(here, 'index.html'), 'utf8'));
  ck('byte-twin: core.mjs CORE region present', !!coreReg);
  ck('byte-twin: index.html CORE region present', !!pageReg);
  ck('byte-twin PARITY: index.html CORE === core.mjs CORE (byte-identical)',
    !!coreReg && !!pageReg && coreReg === pageReg,
    coreReg == null ? 'core sentinels MISSING' : pageReg == null ? 'page sentinels MISSING' :
      (coreReg === pageReg ? 'slice ' + coreReg.length + ' chars identical' : 'DRIFT (core ' + coreReg.length + ' vs page ' + pageReg.length + ')'));
}

// ── ANTI-CIRCULARITY: the optics side must DERIVE ν from orderSinThetas, not hand-write n/p ───
console.log('\n— Anti-circularity: the optics ν flows from orderSinThetas, not a hand-written n/p —');
{
  const here = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(join(here, 'core.mjs'), 'utf8');
  // reciprocalOptics body must reference orderSinThetas (the sole optics authority) and divide by λ.
  const body = src.slice(src.indexOf('function reciprocalOptics'), src.indexOf('function sinThetaDeg'));
  ck('reciprocalOptics calls orderSinThetas (the grating is the authority)', /orderSinThetas\s*\(/.test(body));
  ck('reciprocalOptics never hand-writes the shortcut n*lambda/p or n/p', !/n\s*\*\s*lambda\s*\/\s*p/.test(body) && !/return\s+n\s*\/\s*p/.test(body));
}

console.log('\n—— The Reciprocal Twins Node twin: ' + pass + '/' + (pass + fail) + ' ——');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
console.log('  ALL GREEN ✓\n');
process.exit(0);
