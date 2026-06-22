/* ============================================================================
   core.test.mjs — the Node twin of The Reaction You Time bench's in-page self-test.

   Run:  node alchemy/reaction-you-time/core.test.mjs

   Proves, for the order-indexed kinetics core the page inlines byte-identical, the
   claims the bench makes — and ONLY claims that are honest:
     (K1) first-order t½ is CONSTANT and A₀-independent (≤ TOL_LAW over a k×A₀×n sweep)
     (K2) DOSE-INDEPENDENCE: spacing identical across A₀ (exactly 0); a fuller flask
          adds exactly one rung at the top (rungCount = ⌊log2(A₀/floor)⌋)
     (K3) the NEGATIVE CONTROL: second-order successive-half-life ratio → 2 exact;
          first-order ratio → 1
     (K4) the law residuals are machine-exact: first-order semigroup; second-order
          linearizing identity 1/[A] − 1/A₀ = kt
     (K5) the HONEST convergence (BOTH orders): the discrete ensemble MEAN → the sim's
          OWN mean-field within KSIG·SE — this REPLACES "mean vs continuous law", which
          fails at 6–10σ
     (K6) the deterministic bridge (no RNG): mean-field → continuous law as dt→0 (bias
          HALVES when dt halves), both orders
     (K7) load-bearing honesty: a single fixed-seed pour lands OUTSIDE the band at ≥1 tick
     (K8) determinism: identical {order,N0,k,dt,seed} ⇒ byte-identical trajectory
   PLUS a byte-identical re-extraction parity test (page inline core === core.mjs).
   Exits non-zero on any failure so CI / a human sees RED.
   ============================================================================ */

import {
  LN2, KSIG, TOL_LAW, PRESET,
  conc, tickTime, tickSpacing, halfLife, tickSpacings, spacingRatios, rungCount,
  makeRng, stepFlask, meanFieldExpectation, runEnsemble, singleRunTrajectory
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));

let pass = 0, fail = 0;
function ok(name, cond, info){
  if(cond){ pass++; console.log('  \x1b[32m✓\x1b[0m ' + name); }
  else { fail++; console.log('  \x1b[31m✗\x1b[0m ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\n— ALCHEMY LAB · THE REACTION YOU TIME · core.test.mjs —\n');

// ── (K1) first-order t½ CONSTANT & A₀-INDEPENDENT ──
console.log('(K1) first-order half-life is constant & dose-blind:');
{
  let worst = 0;
  for(const k of [0.1, 0.35, 1, 3]) for(const A0 of [0.5, 1, 8, 32])
    for(let n = 2; n <= 20; n++) worst = Math.max(worst, Math.abs(tickSpacing(1, n, A0, k) - LN2 / k));
  ok('every successive first-order t½ equals ln2/k (≤TOL_LAW, worst=' + worst.toExponential(2) + ')', worst <= TOL_LAW);
}

// ── (K2) DOSE-INDEPENDENCE: spacing identical across A₀; one extra rung per doubling ──
console.log('\n(K2) dose-independence — fuller flask, SAME pitch, one more rung at the top:');
{
  let worst = 0;
  for(const k of [0.1, 0.35, 1]){ const ref = tickSpacing(1, 5, 1, k);
    for(const A0 of [0.5, 4, 8, 16, 32]) worst = Math.max(worst, Math.abs(tickSpacing(1, 5, A0, k) - ref)); }
  ok('first-order spacing is EXACTLY identical across A₀ (worst=' + worst.toExponential(2) + ', = 0)', worst === 0);
  // pouring 4× fuller adds exactly two rungs (two doublings); generally ⌊log2(A₀/floor)⌋
  const floor = 1;
  ok('rungCount = ⌊log2(A₀/floor)⌋ · 400→6 rungs, 100→6, 4×(100→400)=+2',
     rungCount(100, floor) === Math.floor(Math.log2(100)) && rungCount(400, floor) - rungCount(100, floor) === 2);
}

// ── (K3) NEGATIVE CONTROL: second-order ratio → 2 exact; first-order → 1 ──
console.log('\n(K3) the neg-control — second-order half-lives DOUBLE (ratio→2 exact):');
{
  let worst2 = 0;
  for(const k of [0.1, 1, 3]) for(const A0 of [0.5, 1, 8]){
    const r = spacingRatios(tickSpacings(2, A0, k, 11));
    for(const v of r) worst2 = Math.max(worst2, Math.abs(v - 2));
  }
  ok('second-order successive-half-life ratio → 2 (≤TOL_LAW, worst=' + worst2.toExponential(2) + ')', worst2 <= TOL_LAW);
  let worst1 = 0;
  for(const k of [0.1, 1, 3]) for(const A0 of [0.5, 1, 8]){
    const r = spacingRatios(tickSpacings(1, A0, k, 11));
    for(const v of r) worst1 = Math.max(worst1, Math.abs(v - 1));
  }
  ok('first-order successive-half-life ratio → 1 (the even-pitch contrast, worst=' + worst1.toExponential(2) + ')', worst1 <= TOL_LAW);
}

// ── (K4) law residuals machine-exact ──
console.log('\n(K4) the continuous laws are machine-exact:');
{
  let semi = 0, lin = 0;
  for(const A0 of [0.5, 1, 8]) for(const k of [0.3, 1, 3]) for(let t = 0.1; t <= 5; t += 0.3){
    semi = Math.max(semi, Math.abs(conc(1, A0, k, t) * conc(1, A0, k, -t) - A0 * A0));     // first-order semigroup
    lin = Math.max(lin, Math.abs((1 / conc(2, A0, k, t) - 1 / A0) - k * t));               // second-order linearizing
  }
  ok('first-order semigroup conc(t)·conc(−t) = A₀² (≤1e-12, worst=' + semi.toExponential(2) + ')', semi <= 1e-12);
  ok('second-order 1/[A] − 1/A₀ = k·t (≤1e-12, worst=' + lin.toExponential(2) + ')', lin <= 1e-12);
}

// ── (K5) ENSEMBLE → SIM MEAN-FIELD (the honest convergence, BOTH orders) ──
// |mean − mfExpect| ≤ KSIG·se at every clamp-free tick (alive ≥ 12). This REPLACES
// "mean vs continuous law", which FAILS at 6–10σ. Verified worst 3.73σ < KSIG=4.
console.log('\n(K5) the honest convergence — ensemble mean → the sim\'s OWN mean-field (KSIG·SE):');
{
  const { k, dt, ticks } = PRESET, N0 = 400, V = N0;
  for(const order of [1, 2]){
    let worstSig = 0;
    for(const runs of [600, 2000]) for(const seed of [7, 101, 303, 909, 1234, 5555]){
      const rows = runEnsemble({ order, N0, k, dt, V, ticks, runs, baseSeed: seed });
      for(const row of rows){ if(row.mean < 12) break;
        const sig = row.se > 0 ? Math.abs(row.mean - row.mfExpect) / row.se : 0; worstSig = Math.max(worstSig, sig); }
    }
    ok('order ' + order + ': worst |mean−mfExpect|/SE over 6 seeds × runs∈{600,2000} ≤ KSIG=' + KSIG +
       ' (worst=' + worstSig.toFixed(2) + 'σ)', worstSig <= KSIG);
  }
}

// ── (K6) MEAN-FIELD → CONTINUOUS LAW as dt→0 (deterministic bridge, no RNG) ──
// max|mfExpect − conc(continuous)|/N0 HALVES when dt halves. This is what makes the
// discrete flask honest to e^(−kt)/(1+A₀kt).
console.log('\n(K6) the deterministic bridge — mean-field → continuous law as dt→0:');
{
  const { k } = PRESET, N0 = 400, V = N0;
  // the flask's density coupling (q = k·alive/V, V=N0) gives the second-order
  // recursion an effective rate k/N0, whose continuous limit is N0·conc(order,1,k,t)
  // (first order is scale-free, so this also equals conc(order,N0,k,t) there).
  function biasAtDt(order, dt){
    const tk = Math.round(2.5 / (k * dt)), e = meanFieldExpectation(order, N0, k, dt, V, tk);
    let mb = 0; for(let t = 0; t <= tk; t++) mb = Math.max(mb, Math.abs(e[t] - N0 * conc(order, 1, k, dt * t)) / N0);
    return mb;
  }
  for(const order of [1, 2]){
    const b1 = biasAtDt(order, 0.1), b2 = biasAtDt(order, 0.05), b3 = biasAtDt(order, 0.025);
    const halves = (b1 / b2) > 1.8 && (b1 / b2) < 2.2 && (b2 / b3) > 1.8 && (b2 / b3) < 2.2;
    ok('order ' + order + ': bias halves when dt halves (' + b1.toExponential(1) + '→' + b2.toExponential(1) +
       '→' + b3.toExponential(1) + ', ratios ' + (b1 / b2).toFixed(2) + ',' + (b2 / b3).toFixed(2) + ')', halves);
  }
}

// ── (K7) SINGLE RUN FAILS THE BAND (load-bearing honesty) ──
console.log('\n(K7) one noisy pour cannot prove the law — a single run leaves the band:');
{
  const { k, dt, ticks } = PRESET, N0 = 400, V = N0;
  for(const order of [1, 2]){
    const rows = runEnsemble({ order, N0, k, dt, V, ticks, runs: 2000, baseSeed: 4242 });
    const one = singleRunTrajectory({ order, N0, k, dt, V, ticks, seed: 13 });
    let outside = false;
    for(const row of rows){ if(row.mean < 12) break;
      if(row.se > 0 && Math.abs(one[row.t] - row.mfExpect) > KSIG * row.se){ outside = true; break; } }
    ok('order ' + order + ': a fixed-seed single pour lands OUTSIDE KSIG·SE at ≥1 tick', outside);
  }
}

// ── (K8) DETERMINISM: identical inputs ⇒ byte-identical trajectory ──
console.log('\n(K8) the dice are reproducible — same seed ⇒ same trajectory:');
{
  const { k, dt, ticks } = PRESET, N0 = 400, V = N0;
  const a = singleRunTrajectory({ order: 2, N0, k, dt, V, ticks, seed: 99 });
  const b = singleRunTrajectory({ order: 2, N0, k, dt, V, ticks, seed: 99 });
  ok('identical {order,N0,k,dt,seed} ⇒ byte-identical alive-trajectory', a.length === b.length && a.every((x, i) => x === b[i]));
}

// ── (PARITY) RE-EXTRACTION (the integration crux) ──
// Read core.mjs off disk, slice the inline core out of index.html between the SAME
// KINETICS-CORE sentinels the in-page badge uses, strip each leading `export `, and
// assert the two are BYTE-IDENTICAL. The page's pill can NEVER silently drift.
console.log('\n(PARITY) re-extraction (page inline core === core.mjs, byte-for-byte):');
{
  const START = '// ===== KINETICS-CORE (byte-identical to core.mjs) =====';
  const END   = '// ===== END KINETICS-CORE =====';
  let parityOk = false, info = '';
  try{
    const coreSrc = readFileSync(join(__dir, 'core.mjs'), 'utf8');
    const pageSrc = readFileSync(join(__dir, 'index.html'), 'utf8');
    const si = pageSrc.indexOf(START), ei = pageSrc.indexOf(END);
    ok('inline-core sentinels present in index.html', si >= 0 && ei > si,
       si >= 0 && ei > si ? 'slice is ' + (ei - si) + ' chars' : 'MISSING SENTINELS');
    if(si >= 0 && ei > si){
      const inline = pageSrc.slice(si + START.length, ei).replace(/^\n/, '').replace(/\n[ \t]*$/, '');
      const expected = coreSrc.split('\n').map(l => l.replace(/^export /, '')).join('\n').replace(/\n$/, '');
      parityOk = (inline === expected);
      if(!parityOk){
        const a = inline.split('\n'), b = expected.split('\n');
        let d = -1; for(let i = 0; i < Math.max(a.length, b.length); i++){ if(a[i] !== b[i]){ d = i; break; } }
        info = 'first diff at line ' + (d + 1) + ' (inline ' + a.length + ' lines, core ' + b.length + ')';
      }
    }
  }catch(e){ info = 'parity read failed: ' + e.message; }
  ok('(parity)★ index.html inline core IS core.mjs, byte-for-byte (export-stripped)', parityOk, info);
}

const total = pass + fail;
console.log('\n' + (fail === 0 ? '\x1b[32m' : '\x1b[31m') + pass + '/' + total + (fail === 0 ? ' GREEN' : ' — ' + fail + ' FAILED') + '\x1b[0m\n');
process.exit(fail === 0 ? 0 : 1);
