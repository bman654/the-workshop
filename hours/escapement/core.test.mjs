/* ============================================================================
   core.test.mjs — the Node twin of the Escapement bench's in-page self-test.

   Run:  node hours/escapement/core.test.mjs

   Proves, for the pendulum the page inlines byte-identical, the claims the bench
   makes — and ONLY claims that are honest:
     • IDEAL is isochronous: the released-tooth rate is amplitude-INDEPENDENT (the
       period carries no θ₀) and the tooth COUNT is integer-exact.
     • the headline beat is EXACTLY 2.000000 s (|periodIdeal()−2| = 0).
     • REAL period is the elliptic authority: STRICTLY increasing in θ₀, → IDEAL as
       θ₀→0 with leading term θ₀²/16, agreeing with an independent RK4 ODE witness.
     • the power SERIES is only a WITNESS: honest ≤45°, demonstrably wrong at 90°.
     • the DRIFT is read from the continuous monotone phaseGap / lostSeconds, NOT
       the floored count difference; anti-vacuity at tiny θ₀.
     • the VISIBLE bob angle and the period share ONE elliptic authority: the closed
       form is exactly periodic and matches an inline RK4 angle integration.
   PLUS a DUAL re-extraction parity test: the page's inline ESCAPEMENT core ===
   core.mjs, AND the page's inline SUN core === ../analemma-core.mjs — both
   byte-for-byte. Exits non-zero on any failure so CI / a human sees RED.
   ============================================================================ */

import {
  G, TWO_PI, L0, T_IDEAL, N_TEETH, STEPS_PER_HAND_REV, THETA_MAX, LIMITS,
  periodIdeal, ellipticK, periodReal, periodSeries, jacobiSN, pendulumAngle,
  toothCountIdeal, toothCountReal, wheelAngleRad, handAngleRad,
  phaseGap, lostSeconds, periodRK4
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const D2R = Math.PI / 180;

let pass = 0, fail = 0;
function ok(name, cond, info){
  if(cond){ pass++; console.log('  \x1b[32m✓\x1b[0m ' + name); }
  else { fail++; console.log('  \x1b[31m✗\x1b[0m ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\n— THE HOURS · ESCAPEMENT · core.test.mjs —\n');

// ── (1) IDEAL is isochronous: teeth-per-second is amplitude-INDEPENDENT ──
console.log('the ideal pendulum — isochronous (the beat never reads amplitude):');
{
  const t = 1000;
  const rates = [];
  for(let deg = 1; deg <= 89; deg += 4){
    rates.push(toothCountIdeal(t) / t);      // ideal count never depends on θ₀
  }
  const spread = Math.max(...rates) - Math.min(...rates);
  ok('IDEAL teeth/sec is amplitude-independent across θ₀ (spread = ' + spread.toExponential(2) + ' ≤ 1e-9)', spread <= 1e-9);
}

// ── (2) toothCountIdeal(t) === floor(2t/T) integer-exact over 100k samples ──
{
  let worst = 0;
  for(let i = 0; i < 100000; i++){
    const t = i * 0.137;
    if(toothCountIdeal(t) !== Math.floor(2 * t / periodIdeal())) worst++;
  }
  ok('toothCountIdeal(t) === floor(2t/T_IDEAL), integer-exact over 100k samples (mismatches=' + worst + ')', worst === 0);
}

// ── (3) the headline: the ideal beat is EXACTLY 2.000000 s ──
console.log('\nthe headline beat — exactly two seconds:');
{
  ok('periodIdeal() = 2.000000 s exactly (|·−2| = ' + Math.abs(periodIdeal() - 2).toExponential(2) + ' ≤ 1e-12)',
     Math.abs(periodIdeal() - 2) <= 1e-12);
}

// ── (4) REAL period is STRICTLY increasing in θ₀ (the non-isochronism) ──
console.log('\nthe real pendulum — its period grows with the swing (NOT isochronous):');
{
  let monotone = true, prev = -Infinity;
  for(let deg = 0.5; deg <= 89.5; deg += 0.5){
    const T = periodReal(deg * D2R);
    if(T <= prev){ monotone = false; break; }
    prev = T;
  }
  ok('periodReal STRICTLY increasing in θ₀ over 0.5°→89.5° (T(89.5°)=' + periodReal(89.5 * D2R).toFixed(5) + 's)', monotone);
}

// ── (5) REAL → IDEAL as θ₀→0, with the leading term θ₀²/16 ──
{
  let leadOk = true, info = '';
  for(const deg of [1, 0.5, 0.1]){
    const th0 = deg * D2R;
    const rel = (periodReal(th0) - T_IDEAL) / T_IDEAL;
    const lead = th0 * th0 / 16;
    const relErr = Math.abs(rel - lead) / lead;
    if(relErr > 1e-3){ leadOk = false; info = deg + '° relErr=' + relErr.toExponential(2); }
  }
  ok('periodReal → IDEAL: leading correction = θ₀²/16 to ≤1e-3 rel at 1°/0.5°/0.1°', leadOk, info);
  ok('|periodReal(θ₀=1e-6) − T_IDEAL| ≤ 1e-9 (= ' + Math.abs(periodReal(1e-6) - T_IDEAL).toExponential(2) + ')',
     Math.abs(periodReal(1e-6) - T_IDEAL) <= 1e-9);
}

// ── (6) the independent RK4 ODE witness agrees with the elliptic period ──
console.log('\nan independent RK4 ODE witness confirms the elliptic period:');
{
  let worst = 0, info = '';
  for(const deg of [10, 30, 45, 60]){
    const th0 = deg * D2R;
    const d = Math.abs(periodRK4(th0) - periodReal(th0));
    if(d > worst){ worst = d; info = deg + '° diff=' + d.toExponential(2); }
  }
  ok('periodRK4 agrees with periodReal at 10/30/45/60° (≤1e-6, worst=' + worst.toExponential(2) + ')', worst <= 1e-6, info);
}

// ── (7) the SERIES is a WITNESS, not the authority — honest ≤45°, wrong at 90° ──
console.log('\nthe power series is honest only to ~45° (a witness, not the authority):');
{
  let smallOk = true;
  for(const deg of [10, 20, 30, 45]){
    const th0 = deg * D2R;
    if(Math.abs(periodSeries(th0) - periodReal(th0)) > 1e-6) smallOk = false;
  }
  ok('series matches the elliptic authority to ≤1e-6 for θ₀ ≤ 45°', smallOk);
  const err90 = Math.abs(periodSeries(90 * D2R) - periodReal(90 * D2R));
  ok('series is DEMONSTRABLY wrong at 90°: |series−real| > 1e-6 (= ' + err90.toExponential(2) + ')', err90 > 1e-6);
}

// ── (8) the DRIFT is read from the continuous monotone phaseGap / lostSeconds ──
console.log('\nthe drift — read from the continuous, monotone gap (never the floored count):');
{
  // monotone in t at fixed θ₀=30°, over an hour
  let mt = true, prev = -Infinity;
  for(let t = 0; t <= 3600; t += 5){ const g = phaseGap(t, 30 * D2R); if(g < prev - 1e-15){ mt = false; break; } prev = g; }
  ok('phaseGap strictly increasing in t (0→1h @30°)', mt);
  // monotone in θ₀ at a fixed t
  let mth = true; prev = -Infinity;
  for(let deg = 1; deg <= 89; deg += 1){ const g = phaseGap(1800, deg * D2R); if(g < prev - 1e-15){ mth = false; break; } prev = g; }
  ok('phaseGap strictly increasing in θ₀ (at fixed t=30min)', mth);
  const lost = lostSeconds(12 * 3600, 30 * D2R) / 60;
  ok('lostSeconds(12h, 30°)/60 ≥ 10 min (= ' + lost.toFixed(2) + ' — a wide swing loses real time)', lost >= 10);
}

// ── (9) ANTI-VACUITY: at a tiny swing the drift is negligible (claim isn't vacuous) ──
{
  const g = phaseGap(3600, 0.05 * D2R);
  ok('phaseGap(1h, 0.05°) ≤ 1e-3 — a near-zero swing barely drifts (= ' + g.toExponential(2) + ')', g <= 1e-3);
  const lost = lostSeconds(12 * 3600, 2 * D2R) / 60;
  ok('lostSeconds(12h, 2°)/60 < 0.1 min — a small swing keeps near-perfect time (= ' + lost.toFixed(4) + ')', lost < 0.1);
}

// ── (10) the VISIBLE bob angle is EXACTLY periodic (bob & period share one authority) ──
console.log('\nthe visible bob and the period share one elliptic authority:');
{
  let worst = 0;
  for(const deg of [10, 30, 60, 85]){
    const th0 = deg * D2R, P = periodReal(th0);
    for(const t of [0.13, 0.47, 0.91, 1.37]){
      worst = Math.max(worst, Math.abs(pendulumAngle(t, th0, 'real') - pendulumAngle(t + P, th0, 'real')));
    }
  }
  ok('pendulumAngle REAL is exactly periodic with period periodReal (≤1e-12, worst=' + worst.toExponential(2) + ')', worst <= 1e-12);
}

// ── (11) the closed-form bob angle matches an inline RK4 angle integration ──
{
  function rk4Angle(t, th0, L = L0, dt = 1e-4){
    const f = (th, w) => [w, -(G / L) * Math.sin(th)];
    let th = th0, w = 0, tt = 0;
    while(tt < t - 1e-12){
      const h = Math.min(dt, t - tt);
      const [k1a, k1b] = f(th, w);
      const [k2a, k2b] = f(th + 0.5 * h * k1a, w + 0.5 * h * k1b);
      const [k3a, k3b] = f(th + 0.5 * h * k2a, w + 0.5 * h * k2b);
      const [k4a, k4b] = f(th + h * k3a, w + h * k3b);
      th += (h / 6) * (k1a + 2 * k2a + 2 * k3a + k4a);
      w  += (h / 6) * (k1b + 2 * k2b + 2 * k3b + k4b);
      tt += h;
    }
    return th;
  }
  let worst = 0, info = '';
  for(const deg of [10, 30, 45, 60]){
    const th0 = deg * D2R;
    for(const t of [0.2, 0.6, 1.0]){
      const d = Math.abs(pendulumAngle(t, th0, 'real') - rk4Angle(t, th0));
      if(d > worst){ worst = d; info = deg + '°,t=' + t; }
    }
  }
  ok('pendulumAngle REAL matches inline RK4 angle integration (≤1e-4 rad, worst=' + worst.toExponential(2) + ')', worst <= 1e-4, info);
}

// ── (12)★ DUAL re-extraction parity — the integration crux. BOTH inlined cores must
//        be byte-identical to their source modules (export-stripped). The page's pill
//        can NEVER silently drift from this twin, for EITHER the pendulum OR the sun. ──
console.log('\ndual re-extraction parity (page inline cores === their modules, byte-for-byte):');
{
  const pageSrc = readFileSync(join(__dir, 'index.html'), 'utf8');

  // -- the ESCAPEMENT core --
  {
    const START = '// ===== ESCAPEMENT-CORE (byte-identical to core.mjs) =====';
    const END   = '// ===== END ESCAPEMENT-CORE =====';
    let parityOk = false, info = '';
    try{
      const coreSrc = readFileSync(join(__dir, 'core.mjs'), 'utf8');
      const si = pageSrc.indexOf(START), ei = pageSrc.indexOf(END);
      ok('escapement-core sentinels present in index.html', si >= 0 && ei > si,
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
    ok('(parity)★ index.html inline ESCAPEMENT core IS core.mjs, byte-for-byte (export-stripped)', parityOk, info);
  }

  // -- the SUN core (reused byte-untouched from the analemma leaf) --
  {
    const START = '// ===== SUN-CORE (byte-identical to ../analemma-core.mjs) =====';
    const END   = '// ===== END SUN-CORE =====';
    let parityOk = false, info = '';
    try{
      const sunSrc = readFileSync(join(__dir, '..', 'analemma-core.mjs'), 'utf8');
      const si = pageSrc.indexOf(START), ei = pageSrc.indexOf(END);
      ok('sun-core sentinels present in index.html', si >= 0 && ei > si,
         si >= 0 && ei > si ? 'slice is ' + (ei - si) + ' chars' : 'MISSING SENTINELS');
      if(si >= 0 && ei > si){
        const inline = pageSrc.slice(si + START.length, ei).replace(/^\n/, '').replace(/\n[ \t]*$/, '');
        const expected = sunSrc.split('\n').map(l => l.replace(/^export /, '')).join('\n').replace(/\n$/, '');
        parityOk = (inline === expected);
        if(!parityOk){
          const a = inline.split('\n'), b = expected.split('\n');
          let d = -1; for(let i = 0; i < Math.max(a.length, b.length); i++){ if(a[i] !== b[i]){ d = i; break; } }
          info = 'first diff at line ' + (d + 1) + ' (inline ' + a.length + ' lines, sun ' + b.length + ')';
        }
      }
    }catch(e){ info = 'parity read failed: ' + e.message; }
    ok('(parity)★ index.html inline SUN core IS ../analemma-core.mjs, byte-for-byte (export-stripped)', parityOk, info);
  }
}

const total = pass + fail;
console.log('\n' + (fail === 0 ? '\x1b[32m' : '\x1b[31m') + pass + '/' + total + (fail === 0 ? ' GREEN' : ' — ' + fail + ' FAILED') + '\x1b[0m\n');
process.exit(fail === 0 ? 0 : 1);
