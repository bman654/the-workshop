/* ============================================================================
   core.test.mjs — the Node twin of the Titration bench's in-page self-test.

   Run:  node alchemy/titration/core.test.mjs

   Proves, for the strong-acid/strong-base charge-balance pH(V) the page inlines
   byte-identical, the claims the bench makes — and ONLY claims that are honest:
     • V_eq = Ca·Va/Cb exactly; pH(V_eq) = 7.000000000.
     • one drop before < 7; one drop after > 9.9 (an honest ~6-unit leap; NOT >10).
     • the half-equivalence identity (strong/strong: NOT a buffer plateau).
     • the EXACT overshoot branch to ~1e-11 (the real machine-class claim) AND,
       separately labeled as a LESSON, the neglect-Kw simplification agreeing only
       to ~1e-7 — proving the textbook shortcut is good-but-not-exact.
     • the machine-exact root residual |h²+d·h−Kw| across the whole curve.
     • the anti-circularity negative control: the phenolphthalein endpoint (pH 8.2
       inversion) is computed independently of V_eq, lands strictly past it, and
       the gap COLLAPSES if the threshold were 7 (perturbation teeth).
     • the dilution lesson is self-test-backed; back-solve recovers Ca to machine ε.
   PLUS a byte-identical re-extraction parity test (page inline core === core.mjs).
   Exits non-zero on any failure so CI / a human sees RED.
   ============================================================================ */

import {
  pH, hPlus, hydroxideExact, Veq, indicatorColor, endpointV, backSolveCa,
  KW, DROP_ML, INDICATOR_PH, LIBRARY, preset
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

console.log('\n— ALCHEMY LAB · TITRATION · core.test.mjs —\n');

const P = preset('M01');                       // 25 mL of 0.1 M HCl, titrated by 0.1 M NaOH
const ve = Veq(P);

// ── (1) V_eq = Ca·Va/Cb = 25.000 mL exactly ──
console.log('equivalence:');
ok('V_eq = Ca·Va/Cb = 25.000 mL exactly (≤1e-12)', Math.abs(ve - 25.0) <= 1e-12, 've=' + ve);

// ── (2) pH(V_eq) = 7.000000000 (≤1e-9) ──
ok('pH(V_eq) = 7.000000000 (≤1e-9)', Math.abs(pH(ve, P) - 7) <= 1e-9, 'pH=' + pH(ve, P).toFixed(12));

// ── (3) one drop before V_eq → pH < 7 ──
console.log('\nthe leap across equivalence:');
{
  const before = pH(ve - DROP_ML, P);
  ok('one DROP_ML before V_eq → pH < 7 (=' + before.toFixed(4) + ')', before < 7);
}
// ── (4) one drop after V_eq → pH > 9.9 (HONEST: ~9.9996, an ~6-unit leap; NOT >10) ──
{
  const after = pH(ve + DROP_ML, P);
  ok('one DROP_ML after V_eq → pH > 9.9 (=' + after.toFixed(4) + ', an honest ~6-unit leap)',
     after > 9.9, 'after=' + after.toFixed(6));
  // explicitly record that >10 would be a LIE at one drop (we do not assert it)
  ok('  …and pH < 10 at one drop after (so we never over-claim >10)', after < 10);
}

// ── (5) half-equivalence identity: pH(V_eq/2) == closed-form diluted-strong-acid pH ──
// at V=V_eq/2 the system is still pure (diluted) strong acid; the closed form is the
// charge-balance pH at that exact d. NOT a buffer plateau — strong/strong has no pKa line.
console.log('\nhalf-equivalence (NOT a buffer — strong/strong has no pKa plateau):');
{
  const Vh = ve / 2;
  const d = (P.Ca * P.Va - P.Cb * Vh) / (P.Va + Vh);
  const closed = -Math.log10((d + Math.sqrt(d * d + 4 * KW)) / 2);
  ok('pH(V_eq/2) == closed-form diluted-strong-acid pH (≤1e-10; both=' + closed.toFixed(6) + ')',
     Math.abs(pH(Vh, P) - closed) <= 1e-10);
}

// ── (6) overshoot EXACT branch — pH(V_eq+ε) == 14 + log10(hydroxideExact(V_eq+ε)),
// the SAME quadratic's OTHER root (h·OH = Kw). At one drop (ε=0.05) the two float
// paths agree to ~1.6e-11 (machine class). At larger ε the log-reconstruction of
// a tiny quantity loses a few digits to cancellation — still ≤1e-7, far tighter
// than the neglect-Kw simplification below, but HONESTLY not 1e-12 there. The true
// 1e-12-class identity is the log-free quadratic residual (test 8), not this. ──
console.log('\novershoot — the EXACT hydroxide branch (same quadratic, other root):');
{
  // the headline machine-class claim is at one drop past equivalence
  const oneDrop = ve + DROP_ML;
  const dDrop = Math.abs(pH(oneDrop, P) - (14 + Math.log10(hydroxideExact(oneDrop, P))));
  ok('one drop past V_eq: pH == 14+log10(OH_exact) to machine class (≤1e-10, diff=' +
     dDrop.toExponential(2) + ')', dDrop <= 1e-10);
}
for(const eps of [0.5, 2.0]){
  const V = ve + eps;
  const exact = 14 + Math.log10(hydroxideExact(V, P));
  const diff = Math.abs(pH(V, P) - exact);
  // larger ε: the exact-root reconstruction holds to ≤1e-7 (float floor of log of a
  // tiny quantity); labeled honestly — the 1e-12 identity is the residual, test 8.
  ok('ε=' + eps + ': pH == 14+log10(OH_exact) within the log float-floor (≤1e-7, diff=' +
     diff.toExponential(2) + ')', diff <= 1e-7);
}

// ── (7) overshoot APPROX — a LESSON, not a lie. The neglect-Kw form agrees only to ~1e-7. ──
console.log('\novershoot — the neglect-Kw SIMPLIFICATION (good-but-not-exact, a lesson):');
for(const eps of [0.05, 0.5, 2.0]){
  const V = ve + eps;
  const approx = 14 + Math.log10(eps * P.Cb / (P.Va + ve + eps));
  const diff = Math.abs(pH(V, P) - approx);
  ok('ε=' + eps + ': neglect-Kw form lands in [1e-9,1e-6] (diff=' + diff.toExponential(2) + ', NOT exact)',
     diff >= 1e-9 && diff <= 1e-6);
}

// ── (8) MACHINE-EXACT root residual: |h²+d·h−Kw| ≤ 5e-18 across the whole curve ──
console.log('\nthe true machine-class identity — the quadratic residual is ~0 everywhere:');
{
  let worst = 0, worstV = 0;
  for(let V = 0; V <= 50; V += 0.1){
    const h = hPlus(V, P);
    const d = (P.Ca * P.Va - P.Cb * V) / (P.Va + V);
    const res = Math.abs(h * h - d * h - KW);
    if(res > worst){ worst = res; worstV = V; }
  }
  ok('|h²−d·h−Kw| ≤ 5e-18 over the whole titration (worst=' + worst.toExponential(2) + ' at V=' + worstV.toFixed(1) + ')',
     worst <= 5e-18);
}

// ── (9) ANTI-CIRCULARITY / negative control + PERTURBATION TEETH ──
// endpointV (pH-8.2 inversion) is computed with no acid/base bookkeeping — only the
// pH curve and the 8.2 threshold. It must land strictly past Veq, AND that gap must
// DEPEND on the threshold ≠ 7: setting the indicator threshold to 7 collapses it.
console.log('\nanti-circularity — the indicator endpoint ≠ the exact equivalence point:');
{
  const endp = endpointV(P);                      // uses INDICATOR_PH = 8.2
  ok('endpointV (pH-8.2 inversion) > V_eq strictly (endpoint=' + endp.toFixed(6) + ' > ' + ve.toFixed(3) + ')',
     endp > ve);
  ok('INDICATOR_PH ≠ 7 (the indicator turns past neutral)', INDICATOR_PH !== 7);
  // PERTURBATION TEETH: if the threshold were 7, the endpoint would BE V_eq (gap→0).
  const endpAt7 = endpointV(P, 7);
  const gap82 = endp - ve, gap7 = Math.abs(endpAt7 - ve);
  ok('setting the threshold to 7 collapses the gap (gap@8.2=' + gap82.toExponential(2) +
     ' ≫ gap@7=' + gap7.toExponential(2) + ')', gap82 > 1e-4 && gap7 < gap82 / 100);
}

// ── (10) HONEST-GAP LESSON — the dilution dial is self-test-backed ──
// at 0.1 M the visible endpoint lands within a fraction of one drop of V_eq
// ((endpointV−Veq)/DROP_ML < 0.1 — sub-drop, can't be faked away). at 0.001 M
// the same gap exceeds one drop (dilution OPENS the visible titration error).
console.log('\nthe dilution lesson — concentration controls the visible endpoint error:');
{
  const sharp = preset('M01'),  flat = preset('M0001');
  const gSharp = (endpointV(sharp) - Veq(sharp)) / DROP_ML;
  const gFlat  = (endpointV(flat)  - Veq(flat))  / DROP_ML;
  ok('0.1 M: (endpointV−V_eq)/DROP_ML < 0.1 (sub-drop, =' + gSharp.toFixed(3) + ' drops)', gSharp < 0.1);
  ok('0.001 M: (endpointV−V_eq)/DROP_ML > 1 (dilution opens the error, =' + gFlat.toFixed(2) + ' drops)', gFlat > 1);
}

// ── (11) SCORING is underwritten: backSolveCa at a TRUE-Veq endpoint recovers Ca to ε ──
console.log('\nthe grade cannot lie — back-solve at a true endpoint recovers Ca exactly:');
{
  const recovered = backSolveCa({ Vend: ve, Cb: P.Cb, Va: P.Va });
  ok('backSolveCa(Vend=V_eq) == Ca to machine precision (≤1e-12, got ' + recovered + ')',
     Math.abs(recovered - P.Ca) <= 1e-12);
  // and a real (past-Veq) endpoint over-estimates Ca by exactly the titration error
  const endp = endpointV(P);
  const overC = backSolveCa({ Vend: endp, Cb: P.Cb, Va: P.Va });
  ok('  …and a real pink endpoint over-estimates Ca (honest bias, Ĉa=' + overC.toFixed(6) + ' > ' + P.Ca + ')',
     overC > P.Ca);
}

// ── (12a) indicatorColor is a separate DISPLAY rule keyed on INDICATOR_PH, not pH=7 ──
console.log('\nthe indicator color is a display rule, computed apart from the pH=7 test:');
{
  ok('indicatorColor(7.0) is colorless (t=0)', indicatorColor(7.0).t === 0);
  ok('indicatorColor(8.0) is the blush threshold (t=0)', indicatorColor(8.0).t === 0);
  ok('indicatorColor(9.5) is magenta (t=1)', indicatorColor(9.5).t === 1);
  ok('indicatorColor ramps monotonically across the turn',
     indicatorColor(8.2).t > 0 && indicatorColor(8.6).t > indicatorColor(8.2).t);
}

// ── (12b) RE-EXTRACTION PARITY (the integration crux) ──
// Read core.mjs off disk, slice the inline core out of index.html between the SAME
// sentinels the in-page badge uses, strip each leading `export `, and assert the
// two are BYTE-IDENTICAL. The page's pill can NEVER silently drift from this Node twin.
console.log('\nre-extraction parity (page inline core === core.mjs, byte-for-byte):');
{
  const START = '// ===== TITRATION-CORE (byte-identical to core.mjs) =====';
  const END   = '// ===== END TITRATION-CORE =====';
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
