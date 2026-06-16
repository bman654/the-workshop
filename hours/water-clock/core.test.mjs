/* ============================================================================
   core.test.mjs — the Node twin of the Water-Clock bench's in-page self-test.

   Run:  node hours/water-clock/core.test.mjs

   Proves, for the Torricelli outflow ODE the page inlines byte-identical, the
   claims the bench makes — and ONLY claims that are honest:
     • the shaped (A∝√h) bore drops the level LINEARLY in time to machine-ε, and
       drains in exactly T_DRAIN; its hour-marks are EVEN.
     • the straight cylinder, under the SAME law / SAME orifice / SAME finish-time,
       drops as a falling parabola — its hour-marks CROWD (the negative control;
       the SHAPING is what's load-bearing, not a rigged constant).
     • the cylinder's hidden invariant: Δ(√h) is the constant, not Δh.
     • one law everywhere: the shaped bore's dh/dt = −C for all heads.
     • the 4th-root signature of the bore radius.
     • volume conservation: the water that leaves the hole equals the water that started.
   PLUS a byte-identical re-extraction parity test (page inline core === core.mjs).
   Exits non-zero on any failure so CI / a human sees RED.
   ============================================================================ */

import {
  G, H0, T_DRAIN, C, A_ORIFICE, K_BORE, N_MARKS, A_CYL,
  shapedArea, cylinderArea, dhdt, shapedHeight, shapedEmpty,
  cylinderEmpty, cylinderHeight, heightAt, emptyTime,
  shapedRadius, cylinderRadius, radiusAt, hourMarks, sqrtMarks, rk4Drain
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

console.log('\n— THE HOURS · WATER-CLOCK · core.test.mjs —\n');

// ── (1) the shaped bore drops the level LINEARLY in time, to machine-ε ──
console.log('the shaped bore — a constant-rate clock:');
{
  const rk = rk4Drain(shapedArea, { dt: 1e-3 });
  let worst = 0, worstT = 0;
  for(const s of rk.samples){
    const e = Math.abs(s.h - Math.max(H0 - C * s.t, 0));
    if(e > worst){ worst = e; worstT = s.t; }
  }
  ok('RK4 level tracks h0−C·t to machine-ε over the whole drain (≤1e-9, worst=' +
     worst.toExponential(2) + ' at t=' + worstT.toFixed(2) + 's)', worst <= 1e-9, 'worst=' + worst.toExponential(2));
}

// ── (2) the shaped bore drains in exactly T_DRAIN, and RK4 agrees with the closed form ──
{
  ok('shapedEmpty() = T_DRAIN = ' + T_DRAIN + '.000 s exactly (≤1e-12)', Math.abs(shapedEmpty() - T_DRAIN) <= 1e-12,
     'shapedEmpty=' + shapedEmpty());
  const rk = rk4Drain(shapedArea, { dt: 1e-3 });
  ok('RK4 shaped tEmpty ≈ analytic T_DRAIN (≤1e-3, diff=' + Math.abs(rk.tEmpty - T_DRAIN).toExponential(2) + ')',
     Math.abs(rk.tEmpty - T_DRAIN) <= 1e-3);
}

// ── (3) the shaped bore's hour-marks are EVEN in height ──
console.log('\nthe payoff — even hours on the bore, crowding hours on the cylinder:');
{
  const m = hourMarks('shaped');
  let worst = 0;
  for(let i = 1; i <= N_MARKS; i++){
    const gap = m[i - 1].h - m[i].h;
    worst = Math.max(worst, Math.abs(gap - H0 / N_MARKS));
  }
  ok('shaped marks are EVEN: max|gap − H0/N| ≤ 1e-12 (worst=' + worst.toExponential(2) + ')', worst <= 1e-12);
}

// ── (4) NEGATIVE CONTROL — the straight cylinder, SAME law / SAME hole / SAME 15 s,
//        crowds its hour-marks. Defeats "you just rigged the constants." ──
{
  ok('cylinderEmpty() is tuned to T_DRAIN too (same finish, ≤1e-9, =' + cylinderEmpty().toFixed(9) + ')',
     Math.abs(cylinderEmpty() - T_DRAIN) <= 1e-9);
  const m = hourMarks('cylinder');
  const gaps = [];
  for(let i = 1; i <= N_MARKS; i++) gaps.push(m[i - 1].h - m[i].h);
  const ratio = Math.max(...gaps) / Math.min(...gaps);
  ok('cylinder marks CROWD: max(gap)/min(gap) ≥ 10 (=' + ratio.toFixed(3) + ' — shape is load-bearing)', ratio >= 10,
     'ratio=' + ratio.toFixed(3));
}

// ── (5) the hidden invariant — for the cylinder Δ(√h) is uniform, Δh is not ──
console.log('\nthe cylinder\'s hidden invariant — Δ(√h) is the constant, not Δh:');
{
  const sm = sqrtMarks('cylinder');
  const dsq = [];
  for(let i = 1; i <= N_MARKS; i++) dsq.push(sm[i - 1].sqrtH - sm[i].sqrtH);
  const spread = Math.max(...dsq) - Math.min(...dsq);
  ok('cylinder Δ(√h) is uniform across all marks (max−min ≤ 1e-12, =' + spread.toExponential(2) + ')', spread <= 1e-12);
}

// ── (6) one law: the shaped bore's dh/dt = −C for every head h ──
console.log('\none law everywhere — the bore holds dh/dt = −C at all heads:');
{
  let worst = 0;
  for(let h = H0; h > 1e-6; h -= H0 / 1000){
    worst = Math.max(worst, Math.abs(dhdt(h, shapedArea) + C));
  }
  ok('shaped dh/dt = −C ∀ h∈(0,H0] (≤1e-12, worst=' + worst.toExponential(2) + ')', worst <= 1e-12);
}

// ── (7) the 4th-root signature of the bore radius: r ∝ h^(1/4) ──
console.log('\nthe fourth-root signature — r(h) ∝ h^(1/4):');
{
  const ratio = shapedRadius(H0) / shapedRadius(H0 / 4);
  ok('shapedRadius(H0)/shapedRadius(H0/4) = √2 (4th root of 4 = √2, ≤1e-12, =' + ratio.toFixed(12) + ')',
     Math.abs(ratio - Math.SQRT2) <= 1e-12);
}

// ── (8) VOLUME CONSERVATION — the water that leaves the hole equals what started ──
console.log('\nvolume conservation — what leaves the hole equals what started:');
{
  const rk = rk4Drain(shapedArea, { dt: 1e-3 });
  const startVol = K_BORE * (2 / 3) * Math.pow(H0, 1.5);   // ∫₀^H0 A(h) dh = K·(2/3)·H0^1.5
  let outVol = 0;
  for(let i = 1; i < rk.samples.length; i++){
    const dt = rk.samples[i].t - rk.samples[i - 1].t;
    const hm = Math.max((rk.samples[i].h + rk.samples[i - 1].h) / 2, 0);
    outVol += A_ORIFICE * Math.sqrt(2 * G * hm) * dt;       // ∫ a·v dt
  }
  const rel = Math.abs(outVol - startVol) / startVol;
  ok('|∫ a·√(2gh) dt − start volume| / start volume ≤ 1e-6 (=' + rel.toExponential(2) + ')', rel <= 1e-6);
}

// ── (9) RE-EXTRACTION PARITY (the integration crux) ──
// Read core.mjs off disk, slice the inline core out of index.html between the SAME
// sentinels the in-page badge uses, strip each leading `export `, and assert the
// two are BYTE-IDENTICAL. The page's pill can NEVER silently drift from this twin.
console.log('\nre-extraction parity (page inline core === core.mjs, byte-for-byte):');
{
  const START = '// ===== WATER-CLOCK-CORE (byte-identical to core.mjs) =====';
  const END   = '// ===== END WATER-CLOCK-CORE =====';
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
