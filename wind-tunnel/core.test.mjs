// Node twin for The Glass Wind Tunnel. Zero-dep. Run: `node core.test.mjs`.
// Exit 0 = green; non-zero = red. Prints an explicit PASS/FAIL count.
//
// Proves the ATTACHED-regime CLAIM of a Joukowski wing — Cl = 2π·sinα — and that lift exists
// ONLY because the Kutta condition forces circulation. Independent of the page's runSelfTest:
//   (a) runs the page's own runSelfTest() — all green;
//   (b) INDEPENDENT Node re-derivations NOT routed through runSelfTest:
//         · Cl = 2π·sinα to <1e-12 over a fine α sweep, with Cl re-derived as 2Γ/(Uc),
//         · Γ = π·c·U·sinα (magnitude) is the circulation behind that Cl,
//         · the slope dCl/dα → 2π/rad at α=0,
//         · width·speed = Δψ along a traced tube (mass conservation) to <3%,
//         · top-of-foil faster than bottom for α>0 (suction on top),
//         · domain guards throw RangeError on bad input;
//   (c) the NEGATIVE CONTROLS provably FAIL: clNoKutta ≡ 0 (no lift without Kutta), and a
//       constant-width fake tube VIOLATES width·speed = const;
//   (d) DISCIPLINE: byte-parity of the inlined core in index.html against core.mjs's body
//       (indentation-normalized), a zero-import grep on core.mjs's body, no DOM in the core,
//       and an anti-circularity grep — the Cl = 2π·sinα LAW is defined in exactly ONE .mjs.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  U, R, CHORD, ALPHA_CRIT,
  kuttaGamma, noKuttaGamma, Cl, clNoKutta, clPostStall,
  psi, speed, Cp, traceTube, invJoukowski, physVelocity,
  runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }
const D = (deg) => deg * Math.PI / 180;

// ── (a) the page's own self-test is all-green ──
const st = runSelfTest();
for (const c of st.checks) ck('selftest ' + c.name + '  [' + c.info + ']', c.pass);

// ── (b) INDEPENDENT re-derivations (not via runSelfTest) ──

// Cl = 2π·sinα to <1e-12 over a fine sweep, re-derived as 2Γ/(Uc).
{
  let worst = 0;
  for (let d = -13; d <= 13; d += 0.5){
    const a = D(d);
    const clViaGamma = -2 * kuttaGamma(a) / (U * CHORD);   // independent re-derivation
    const err = Math.abs(clViaGamma - 2 * Math.PI * Math.sin(a));
    const errCore = Math.abs(Cl(a) - clViaGamma);          // core agrees with re-derivation
    if (err > worst) worst = err;
    if (errCore > 1e-15) worst = 1;                        // force-fail if core diverges
  }
  ck('Cl = 2π·sinα to <1e-12 over −13…13° (re-derived 2Γ/Uc, core agrees)  [worst ' + worst.toExponential(2) + ']',
     worst < 1e-12);
}

// Γ = π·c·U·sinα (magnitude) is the circulation behind that Cl.
{
  let worst = 0;
  for (const d of [-10, -5, 3, 7, 11]){
    const a = D(d);
    const lawMag = Math.PI * CHORD * U * Math.abs(Math.sin(a));   // |Γ| = π·c·U·sinα
    const err = Math.abs(Math.abs(kuttaGamma(a)) - lawMag);
    if (err > worst) worst = err;
  }
  ck('Γ = π·c·U·sinα (magnitude) is the circulation behind Cl  [worst ' + worst.toExponential(2) + ']',
     worst < 1e-12);
}

// slope dCl/dα → 2π/rad at α=0.
{
  const hh = 1e-6;
  const slope = (Cl(hh) - Cl(-hh)) / (2 * hh);
  ck('slope dCl/dα → 2π/rad at α=0  [' + slope.toFixed(8) + ' vs ' + (2*Math.PI).toFixed(8) + ']',
     Math.abs(slope - 2 * Math.PI) < 1e-6);
}

// width·speed = Δψ along a traced tube (mass conservation): the EXACT relation is dψ = speed·dn
// with dn the PERPENDICULAR spacing (|∇ψ|=speed, dn ⟂ flow), so we project onto the flow-normal.
{
  const a = D(7);
  const t1 = traceTube(0.6, a, { x0: -6, x1: 4, h: 0.008, maxSteps: 5000 });
  const t2 = traceTube(0.66, a, { x0: -6, x1: 4, h: 0.008, maxSteps: 5000 });
  const dpsi = Math.abs(t2.psi0 - t1.psi0);
  const nearX = (t, xt) => { let best = t.pts[0], bd = Infinity; for (const p of t.pts){ const dd = Math.abs(p[0]-xt); if (dd < bd){ bd = dd; best = p; } } return best; };
  let worstRel = 0;
  for (const xt of [-4, -2, -1, 0, 1, 2, 3]){
    const p = nearX(t1, xt), q = nearX(t2, xt);
    const v = physVelocity(invJoukowski(p), a); if (!v) continue;
    const sp = Math.hypot(v[0], v[1]);
    const nx = -v[1] / sp, ny = v[0] / sp;                   // unit normal to the flow at p
    const width = Math.abs((q[0]-p[0]) * nx + (q[1]-p[1]) * ny);   // perpendicular spacing dn
    const ws = width * sp;
    const rel = Math.abs(ws - dpsi) / dpsi;
    if (rel > worstRel) worstRel = rel;
  }
  ck('perpendicular width·speed = Δψ along a traced tube (mass conservation)  [worst ' + (worstRel*100).toFixed(3) + '%]',
     worstRel < 0.01);
}

// ψ is conserved along a traced streamline (the streamtube spine).
{
  const a = D(6);
  const t = traceTube(0.7, a, { x0: -6, x1: 4, h: 0.01, maxSteps: 4000 });
  let mn = Infinity, mx = -Infinity;
  for (const p of t.pts){ const v = psi(invJoukowski(p), a); if (v < mn) mn = v; if (v > mx) mx = v; }
  ck('ψ conserved along a traced streamline (<1e-4 drift)  [' + (mx-mn).toExponential(2) + ']', (mx - mn) < 1e-4);
}

// top of the foil faster than bottom for α>0 (the suction that lifts).
{
  const a = D(9);
  const topV = speed([0, 0.18], a), botV = speed([0, -0.18], a);
  ck('top |v| > bottom |v| for α>0 (top suction)  [' + topV.toFixed(3) + ' > ' + botV.toFixed(3) + ']', topV > botV);
}

// Cp = 1 − (|v|/U)² ; on the fast top it is suction (Cp<0).
{
  const a = D(9);
  ck('Cp_top < 0 (suction over the curved top) at α=9°  [' + Cp([0,0.18], a).toFixed(3) + ']', Cp([0,0.18], a) < 0);
}

// post-stall is exactly the attached law below α_crit, and decays below the peak above it.
{
  const below = Math.abs(clPostStall(D(7)) - Cl(D(7))) < 1e-15;
  const peak = Cl(ALPHA_CRIT);
  const post = clPostStall(D(20));
  const dropped = post < peak && post > 0;
  ck('clPostStall == Cl below α_crit; decays below the peak above it  [post20°=' + post.toFixed(3) + ' < peak=' + peak.toFixed(3) + ']',
     below && dropped);
}

// ── (c) the NEGATIVE CONTROLS provably FAIL ──

// drop the Kutta condition and ALL lift vanishes — at every α.
ck('NEG-CONTROL: clNoKutta ≡ 0 at every α (no lift without Kutta), and Cl≠0 where it should lift', (() => {
  for (let d = -13; d <= 13; d += 1){ if (clNoKutta(D(d)) !== 0) return false; }
  // and the real law DOES lift at 11° by a margin a vacuous checker can't fake
  return Math.abs(Cl(D(11))) >= 2 * Math.PI * Math.sin(D(3));
})());

// a constant-width fake tube VIOLATES width·speed = const (speed varies, width pinned).
ck('NEG-CONTROL: a constant-width fake VIOLATES width·speed = const', (() => {
  const a = D(8), W = 0.1;
  const wsUpstream = W * speed([-4, 0.6], a);
  const wsOverFoil = W * speed([0.0, 0.6], a);
  return Math.abs(wsUpstream - wsOverFoil) > 1e-3;     // a real, asserted failure of the fake
})());

// no-Kutta circulation is identically zero (the structural difference from the lifting flow).
ck('NEG-CONTROL: noKuttaGamma ≡ 0 while kuttaGamma(7°) < 0 (lift up)', (() => {
  return noKuttaGamma(D(7)) === 0 && kuttaGamma(D(7)) < 0;
})());

// ── DOMAIN GUARDS — bad input throws RangeError (no silent NaN) ──
function throwsRange(fn){ try { fn(); return false; } catch(e){ return e instanceof RangeError; } }
ck('domain guard: Cl(NaN) throws RangeError', throwsRange(() => Cl(NaN)));
ck('domain guard: kuttaGamma(Infinity) throws RangeError', throwsRange(() => kuttaGamma(Infinity)));
ck('domain guard: traceTube(NaN, 0) throws RangeError', throwsRange(() => traceTube(NaN, 0)));

// ── (d) DISCIPLINE: byte-parity, zero-import, no-DOM, anti-circularity ──
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
const BEGIN = '// ===== WIND-TUNNEL CORE (byte-identical to core.mjs) =====';
const END = '// ===== END WIND-TUNNEL CORE =====';
function region(text){
  const i = text.indexOf(BEGIN), j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i + BEGIN.length, j);
}
function norm(s){
  return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
}
const coreRegion = region(coreSrc);
const pageRegion = region(pageSrc);
ck('byte-parity: WIND-TUNNEL CORE sentinels present in core.mjs', !!coreRegion);
ck('byte-parity: WIND-TUNNEL CORE sentinels present in index.html', !!pageRegion);
ck('byte-parity: index.html inlined core === core.mjs body (indentation-normalized)',
   !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion));

// zero-import: core.mjs's body (between sentinels) names no import/require.
ck('zero-import: core.mjs body has no import/require',
   !!coreRegion && !/\b(import|require)\b/.test(coreRegion));

// the core never reaches into the DOM, the wall clock, or RNG.
ck('core.mjs body never references document/window',
   !!coreRegion && !/\b(document|window)\b/.test(coreRegion));
ck('core.mjs body never references Math.random or performance (pure, deterministic)',
   !!coreRegion && !/Math\.random|performance\./.test(coreRegion));

// anti-circularity: the Cl = 2π·sinα LAW (the literal 2*Math.PI*Math.sin in the lift definition)
// is NOT hard-typed into Cl — Cl is re-derived from Γ. Assert the literal 2π·sinα appears only in
// the SELF-TEST (as the thing being checked against), never in the Cl function body.
{
  const clBody = (() => {
    const m = coreSrc.match(/function Cl\(alpha\)\{[\s\S]*?\n\}/);
    return m ? m[0] : '';
  })();
  const hardTyped = /2\s*\*\s*Math\.PI\s*\*\s*Math\.sin/.test(clBody);
  ck('anti-circularity: Cl is re-derived from Γ (2π·sinα is NOT hard-typed in the Cl body)', clBody.length > 0 && !hardTyped);
}

// ── report ──
console.log('The Glass Wind Tunnel — core.test.mjs');
console.log('  page self-test: ' + st.passed + '/' + st.total + ' checks green');
console.log('  byte-parity: ' + (coreRegion && pageRegion && norm(coreRegion) === norm(pageRegion) ? 'IDENTICAL' : (pageRegion ? 'DRIFTED' : 'index.html not built yet')));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
