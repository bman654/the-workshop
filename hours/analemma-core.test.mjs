/* ============================================================================
   analemma-core.test.mjs — the Node twin of the Analemma bench's in-page self-test.

   Run:  node hours/analemma-core.test.mjs

   Proves, for the parameterized solar core the page inlines byte-identical, the
   claims the bench makes — and ONLY honest ones:
     • DIAL PARITY (the keystone): the new core, at the canonical detent eR=1,
       ε=EPS0, reproduces the Gnomon dial's proven equationOfTimeMin / solarDec
       BIT-FOR-BIT over all 365 days. The page can NEVER disagree with The Honest
       Sundial about the sun, because this IS that sun, only parameterized.
     • DECOMPOSITION EXACT: eccTermMin + oblTermMin === eotMin every day. The loop
       is the SUM of the two clocks, provably, not by hand-waving.
     • REAL EXTREMA on the calendar: +16.45 @ ~Nov 3, −14.20 @ ~Feb 11, exactly 4
       zero-crossings; declination spans ±23.44°.
     • ECC-ONLY (ε=0): a flat oval (no vertical extent), drift ±7.66 min.
       OBL-ONLY (eR=0): a SYMMETRIC 8 (||max|−|min|| ≈ 0), dec ±23.44°.
     • NEGATIVE CONTROL (eR=0, ε=0): EoT≡0, dec≡0 → analemmaXY returns ONE point →
       no loop. (Defeats "you just drew a figure-8": kill both causes, it vanishes.)
   PLUS:
     • DIAL CROSS-CHECK against tools/dial/dial.js loaded directly (require), so the
       parity claim is checked against the REAL dial, not a copied number.
     • a byte-identical RE-EXTRACTION PARITY test (page inline core === core.mjs).
   Exits non-zero on any failure so CI / a human sees RED.
   ============================================================================ */

import {
  D2R, R2D, E0, EPS0, YEAR,
  jdOfDay, meanLonDeg, lamDeg, eotMin, solarDecDeg,
  eccTermMin, oblTermMin, analemmaXY, analemmaYear, zeroCrossings
} from './analemma-core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const __dir = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const Dial = require('../tools/dial/dial.js');   // the REAL proven dial core

let pass = 0, fail = 0;
function ok(name, cond, info){
  if(cond){ pass++; console.log('  \x1b[32m✓\x1b[0m ' + name); }
  else { fail++; console.log('  \x1b[31m✗\x1b[0m ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\n— THE HOURS · ANALEMMA · analemma-core.test.mjs —\n');

// ── (1) DIAL PARITY — the keystone. The new core IS the proven dial's sun, only
//        parameterized. At eR=1, ε=EPS0 it reproduces it bit-for-bit, every day. ──
console.log('the keystone — the new core reduces to the proven dial, bit-for-bit:');
{
  let eotWorst = 0, eotDay = 0, decWorst = 0, decDay = 0;
  for(let d = 0; d < 365; d++){
    const jd = jdOfDay(d);
    const eMine = eotMin(jd, 1, EPS0), eDial = Dial.equationOfTimeMin(jd);
    if(Math.abs(eMine - eDial) > eotWorst){ eotWorst = Math.abs(eMine - eDial); eotDay = d; }
    const decMine = solarDecDeg(jd, 1, EPS0);
    const decDial = Dial.solarDec(Dial.sunEclipticLonDeg(jd) * D2R) * R2D;
    if(Math.abs(decMine - decDial) > decWorst){ decWorst = Math.abs(decMine - decDial); decDay = d; }
  }
  ok('eotMin(eR=1,EPS0) === Dial.equationOfTimeMin, all 365 days (|Δ| < 1e-9 min, worst=' +
     eotWorst.toExponential(2) + ' @day' + eotDay + ')', eotWorst < 1e-9, 'worst=' + eotWorst.toExponential(2));
  ok('solarDecDeg(eR=1,EPS0) === Dial.solarDec, all 365 days (|Δ| < 1e-9 deg, worst=' +
     decWorst.toExponential(2) + ' @day' + decDay + ')', decWorst < 1e-9, 'worst=' + decWorst.toExponential(2));
}

// ── (2) DECOMPOSITION EXACT — eccTerm + oblTerm === eotMin (over the shared λ) ──
console.log('\nthe decomposition — the loop is the SUM of the two clocks, exactly:');
{
  let worst = 0, worstDay = 0;
  for(let d = 0; d < 365; d++){
    const jd = jdOfDay(d);
    const sum = eccTermMin(jd, 1) + oblTermMin(jd, 1, EPS0);
    const e = Math.abs(sum - eotMin(jd, 1, EPS0));
    if(e > worst){ worst = e; worstDay = d; }
  }
  ok('eccTermMin + oblTermMin === eotMin, all days (|Δ| ≤ 1e-9 min, worst=' +
     worst.toExponential(2) + ' @day' + worstDay + ')', worst <= 1e-9, 'worst=' + worst.toExponential(2));
}

// ── (3) REAL EXTREMA on the calendar (canonical eR=1, EPS0) ──
console.log('\nthe loop lands on the real calendar — extrema, dates, crossings:');
{
  let mx = -99, mn = 99, mxd = 0, mnd = 0;
  let decmx = -99, decmn = 99;
  for(let d = 0; d < 365; d++){
    const e = eotMin(jdOfDay(d), 1, EPS0);
    if(e > mx){ mx = e; mxd = d; } if(e < mn){ mn = e; mnd = d; }
    const dd = solarDecDeg(jdOfDay(d), 1, EPS0);
    decmx = Math.max(decmx, dd); decmn = Math.min(decmn, dd);
  }
  ok('EoT max ≈ +16.45 min near Nov 3 (day 306) (=' + mx.toFixed(2) + ' @day' + mxd + ')',
     Math.abs(mx - 16.45) <= 0.3 && Math.abs(mxd - 306) <= 3);
  ok('EoT min ≈ −14.20 min near Feb 11 (day 41) (=' + mn.toFixed(2) + ' @day' + mnd + ')',
     Math.abs(mn - (-14.20)) <= 0.3 && Math.abs(mnd - 41) <= 3);
  ok('exactly 4 zero-crossings (the 4 days the sundial & clock agree) (=' + zeroCrossings(1, EPS0) + ')',
     zeroCrossings(1, EPS0) === 4);
  ok('declination spans ±23.44° (the 47° N–S swing) (+' + decmx.toFixed(2) + '/' + decmn.toFixed(2) + ')',
     Math.abs(decmx - 23.44) <= 0.3 && Math.abs(decmn - (-23.44)) <= 0.3);
}

// ── (4) ECC-ONLY (ε=0) → a flat oval;  OBL-ONLY (eR=0) → a symmetric 8 ──
console.log('\npull the loop apart — orbit-only oval, tilt-only symmetric 8:');
{
  // ECC-ONLY: knob says orbit stretched (eR=1) but axis straight (ε=0) → no dec, no vertical
  let emx = -99, emn = 99, edspan = 0, edmx = -99, edmn = 99;
  for(let d = 0; d < 365; d++){
    const xy = analemmaXY(jdOfDay(d), 1, 0);
    emx = Math.max(emx, xy.x); emn = Math.min(emn, xy.x);
    edmx = Math.max(edmx, xy.y); edmn = Math.min(edmn, xy.y);
  }
  edspan = edmx - edmn;
  ok('ECC-ONLY (ε=0): EoT swings ±7.66 min (+' + emx.toFixed(2) + '/' + emn.toFixed(2) + ')',
     Math.abs(emx - 7.66) <= 0.3 && Math.abs(emn - (-7.66)) <= 0.3);
  ok('ECC-ONLY (ε=0): declination is FLAT → an oval, not an 8 (dec span ≤ 1e-9, =' +
     edspan.toExponential(2) + ')', edspan <= 1e-9);

  // OBL-ONLY: axis tilted (ε=EPS0) but orbit round (eR=0) → a symmetric 8
  let omx = -99, omn = 99, odmx = -99, odmn = 99;
  for(let d = 0; d < 365; d++){
    const xy = analemmaXY(jdOfDay(d), 0, EPS0);
    omx = Math.max(omx, xy.x); omn = Math.min(omn, xy.x);
    odmx = Math.max(odmx, xy.y); odmn = Math.min(odmn, xy.y);
  }
  ok('OBL-ONLY (eR=0): EoT swings ±9.87 min (+' + omx.toFixed(2) + '/' + omn.toFixed(2) + ')',
     Math.abs(omx - 9.87) <= 0.3 && Math.abs(omn - (-9.87)) <= 0.3);
  ok('OBL-ONLY (eR=0): the 8 is SYMMETRIC: ||max|−|min|| < 0.05 (=' +
     Math.abs(Math.abs(omx) - Math.abs(omn)).toExponential(2) + ')',
     Math.abs(Math.abs(omx) - Math.abs(omn)) < 0.05);
  ok('OBL-ONLY (eR=0): declination still spans ±23.44° (+' + odmx.toFixed(2) + '/' + odmn.toFixed(2) + ')',
     Math.abs(odmx - 23.44) <= 0.3 && Math.abs(odmn - (-23.44)) <= 0.3);
}

// ── (5) NEGATIVE CONTROL (eR=0, ε=0) → one fixed point, no loop ──
console.log('\nthe negative control — kill both causes and the loop vanishes:');
{
  let nmax = 0, ndmax = 0;
  for(let d = 0; d < 365; d++){
    const xy = analemmaXY(jdOfDay(d), 0, 0);
    nmax = Math.max(nmax, Math.abs(xy.x)); ndmax = Math.max(ndmax, Math.abs(xy.y));
  }
  ok('eR=0 AND ε=0: max|EoT| < 1e-9 min (=' + nmax.toExponential(2) + ')', nmax < 1e-9, 'max=' + nmax.toExponential(2));
  ok('eR=0 AND ε=0: max|dec| = 0 deg (=' + ndmax.toExponential(2) + ')', ndmax === 0, 'max=' + ndmax.toExponential(2));
  // the year of points collapses to a single point: its bounding box is sub-nanominute.
  // (The dial's own low-precision series leaves ~1e-13 dust, so "one point" is a
  //  tolerance claim, not literal bit-equality — the box has no measurable extent.)
  const yr = analemmaYear(0, 0);
  let bx = 0, by = 0;
  for(let i = 1; i < yr.length; i++){ bx = Math.max(bx, Math.abs(yr[i].x - yr[0].x)); by = Math.max(by, Math.abs(yr[i].y - yr[0].y)); }
  ok('analemmaYear(0,0) collapses to ONE point — bounding box < 1e-9 (no loop) (box=' +
     bx.toExponential(2) + '×' + by.toExponential(2) + ' min×deg)', bx < 1e-9 && by < 1e-9);
}

// ── (PARITY) RE-EXTRACTION — the inline core IS analemma-core.mjs, byte-for-byte ──
console.log('\nre-extraction parity (page inline core === analemma-core.mjs, byte-for-byte):');
{
  const START = '// ===== ANALEMMA-CORE (byte-identical to analemma-core.mjs) =====';
  const END   = '// ===== END ANALEMMA-CORE =====';
  let parityOk = false, info = '';
  try{
    const coreSrc = readFileSync(join(__dir, 'analemma-core.mjs'), 'utf8');
    const pageSrc = readFileSync(join(__dir, 'analemma.html'), 'utf8');
    const si = pageSrc.indexOf(START), ei = pageSrc.indexOf(END);
    ok('inline-core sentinels present in analemma.html', si >= 0 && ei > si,
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
  ok('(parity)★ analemma.html inline core IS analemma-core.mjs, byte-for-byte (export-stripped)', parityOk, info);
}

const total = pass + fail;
console.log('\n' + (fail === 0 ? '\x1b[32m' : '\x1b[31m') + pass + '/' + total + (fail === 0 ? ' GREEN' : ' — ' + fail + ' FAILED') + '\x1b[0m\n');
process.exit(fail === 0 ? 0 : 1);
