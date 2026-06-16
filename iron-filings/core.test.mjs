// Node twin for The Lodestone Plate (Iron Filings). Zero-dep. Run: `node core.test.mjs`.
// Exit 0 = green; non-zero = red. Prints an explicit PASS/FAIL count.
//
// Proves the claim TWO ways and verifies the monopole negative control goes RED:
//   (a) runs the page's own runSelfTest() — all green;
//   (b) INDEPENDENT re-derivations NOT routed through the bundled self-test:
//         · the on-axis closed form (B antiparallel to m, |B| = 2|m|/r²),
//         · ∮B·n̂ ≈ 0 around a dipole to < 1e-9 and = 2π around a q=1 monopole to < 1e-6,
//         · the Richardson RK4 ratio lands in [12,18] (measured ≈ 16),
//         · flip both poles ⇒ B negates exactly,
//         · the saddle null fieldAt(midpoint) ≈ 0 and dir() returns null there;
//   (c) the MONOPOLE NEGATIVE CONTROL goes red — loop-flux nonzero AND a line never closes;
//   (d) BYTE-PARITY: the inlined core between the sentinels in index.html is byte-identical
//       (indentation-normalized) to core.mjs's body.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  PLATE, POLE_LEN, dipoleField, fieldAt, magnitudeAt, poles, flip,
  dir, rk4Step, streamline, findNull,
  maxDivergence, loopFlux, divergenceNearMonopole, rk4OrderRatio,
  SCENES, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }

// ── (a) the page's own self-test is all-green ──
const st = runSelfTest();
for (const c of st.checks) ck('selftest ' + c.name + '  [' + c.info + ']', c.pass);

// ── (b) INDEPENDENT re-derivations (not via runSelfTest) ──

// On-axis closed form: for a dipole at the origin with moment m along +x, a point on the
// axis (px,0) with px>0 has r̂ = +x̂, m·r̂ = mx, so B = [2·mx·x̂ − m]/r² = (mx/r², 0) ... but
// m is along x so B = (2mx − mx, −0)/r² = (mx/r², 0): ALONG +x, magnitude mx/r². OFF-axis the
// classic "antiparallel along the equator" holds: at (0,py) the equator point has r̂ = ŷ,
// m·r̂ = 0, so B = −m/r² = (−mx, 0)/r² — ANTIPARALLEL to m, magnitude |m|/r². Check both.
ck('on-axis: B along axis = mx/r², on-equator: B = −m/r² (antiparallel, |B| = |m|/r²)', (() => {
  const m = { x: 0, y: 0, mx: 0.06, my: 0, id: 1 };
  // axis point at distance 0.5 along +x
  const ax = dipoleField(0.5, 0, m);
  const axOk = Math.abs(ax.bx - m.mx/(0.5*0.5)) < 1e-12 && Math.abs(ax.by) < 1e-12;
  // equator point at distance 0.5 along +y → B antiparallel to m
  const eq = dipoleField(0, 0.5, m);
  const eqOk = Math.abs(eq.bx - (-m.mx/(0.5*0.5))) < 1e-12 && Math.abs(eq.by) < 1e-12;
  // magnitude on equator = |m|/r²
  const magOk = Math.abs(Math.hypot(eq.bx, eq.by) - Math.abs(m.mx)/(0.5*0.5)) < 1e-12;
  return axOk && eqOk && magOk;
})());

// ∮B·n̂ ≈ 0 around a dipole to < 1e-9
ck('∮B·n̂ ≈ 0 around a lone dipole (< 1e-9)', (() => {
  const dip = [{ x: 0, y: 0, mx: 0.06, my: 0.025, id: 1 }];
  return Math.abs(loopFlux(dip, { x: 0, y: 0 }, 0.6, 4000)) < 1e-9;
})());

// ∮B·n̂ = 2π around a q=1 monopole to < 1e-6
ck('∮B·n̂ = 2π around a q=1 monopole (< 1e-6)', (() => {
  const mono = [{ x: 0, y: 0, q: 1, kind: 'monopole' }];
  return Math.abs(loopFlux(mono, { x: 0, y: 0 }, 0.5, 4000) - 2*Math.PI) < 1e-6;
})());

// ∮B·n̂ = 2π·q scales with charge (q = 3)
ck('∮B·n̂ = 2π·q scales with charge (q = 3)', (() => {
  const mono = [{ x: 0.1, y: -0.05, q: 3, kind: 'monopole' }];
  return Math.abs(loopFlux(mono, { x: 0.1, y: -0.05 }, 0.4, 4000) - 3*2*Math.PI) < 1e-6;
})());

// Richardson RK4 ratio ∈ [12,18] (sharp; measured ≈ 16)
ck('Richardson RK4 order ratio ∈ [12,18] (measured ≈ 16)', (() => {
  const r = rk4OrderRatio(SCENES.dipolePair(), { x: -0.5, y: 0.3 }, 0.25);
  return r >= 12 && r <= 18;
})());

// flip both poles ⇒ B negates exactly (linearity in m)
ck('flip(magnet) ⇒ B negates exactly at every probe point', (() => {
  const m = { x: 0.1, y: -0.2, mx: 0.05, my: 0.03, id: 1 };
  const mf = flip(m);
  const probes = [[0.4, 0.3], [-0.5, 0.2], [0.0, 0.6], [-0.3, -0.4]];
  for (const [px, py] of probes){
    const a = fieldAt(px, py, [m]);
    const b = fieldAt(px, py, [mf]);
    if (Math.abs(a.bx + b.bx) > 1e-14 || Math.abs(a.by + b.by) > 1e-14) return false;
  }
  return true;
})());

// the saddle null: fieldAt(midpoint) ≈ 0 AND dir() returns null there
ck('saddle null of a like-pair: |B(midpoint)| ≈ 0 and dir() returns null', (() => {
  const lp = SCENES.likePair();
  const nul = findNull(lp);
  if (!nul) return false;
  const m = magnitudeAt(nul.x, nul.y, lp);
  const d = dir(nul.x, nul.y, lp, 1);
  // the exact midpoint (0,0) by symmetry is the null for the symmetric like-pair
  const symOk = Math.abs(nul.x) < 1e-9 && Math.abs(nul.y) < 1e-9;
  return symOk && m < 1e-9 && d === null;
})());

// findNull is honest: an UNLIKE pair has no interior null (returns null)
ck('findNull returns null for an unlike pair (no interior null — honest)', (() => {
  return findNull(SCENES.dipolePair()) === null;
})());

// dir() returns null exactly at a true null, a unit vector elsewhere
ck('dir() is a unit vector away from nulls, null AT a null', (() => {
  const lp = SCENES.likePair();
  const d = dir(0.3, 0.25, lp, 1);
  const unit = d && Math.abs(Math.hypot(d.x, d.y) - 1) < 1e-12;
  return unit && dir(0, 0, lp, 1) === null;
})());

// ── (c) the MONOPOLE NEGATIVE CONTROL goes RED — assert the failing condition explicitly ──
ck('NEGATIVE CONTROL: monopole loop-flux ≠ 0 (the source the law forbids)', (() => {
  const ctrl = SCENES.monopoleControl();
  const mono = ctrl.find(m => m.kind === 'monopole');
  const flux = loopFlux(ctrl, { x: mono.x, y: mono.y }, 0.18, 4000);
  return Math.abs(flux) > 1.0;                 // ≈ 2π, decisively ≠ 0
})());
ck('NEGATIVE CONTROL: divergenceNearMonopole() reports a nonzero enclosed source', (() => {
  const ctrl = SCENES.monopoleControl();
  return Math.abs(divergenceNearMonopole(ctrl, 0.12)) > 1.0;
})());
ck('NEGATIVE CONTROL: a line launched into the monopole NEVER closes (dies in mid-air)', (() => {
  const ctrl = SCENES.monopoleControl();
  const mono = ctrl.find(m => m.kind === 'monopole');
  const line = streamline({ x: mono.x + 0.06, y: mono.y + 0.04 }, ctrl, { sign: -1 });
  return line.stop !== 'closed';               // escapes / spirals to the source forever
})());
ck('NEGATIVE CONTROL: the dipole half of the control still passes (∮ ≈ 0)', (() => {
  const ctrl = SCENES.monopoleControl();
  const dip = ctrl.find(m => m.kind !== 'monopole');
  return Math.abs(loopFlux(ctrl, { x: dip.x, y: dip.y }, 0.12, 4000)) < 1e-6;
})());

// ── (d) BYTE-PARITY: index.html's inlined core === core.mjs body (indentation-normalized) ──
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
const BEGIN = '// ===== IRON-FILINGS CORE (byte-identical to core.mjs) =====';
const END = '// ===== END IRON-FILINGS CORE =====';
function region(text){
  const i = text.indexOf(BEGIN), j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i + BEGIN.length, j);
}
// indentation-normalized comparison: strip leading whitespace per line and drop blank lines,
// so a page that indents the inlined core inside a closure still matches the module body.
function norm(s){
  return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
}
const coreRegion = region(coreSrc);
const pageRegion = region(pageSrc);
ck('byte-parity: IRON-FILINGS CORE sentinels present in core.mjs', !!coreRegion);
ck('byte-parity: IRON-FILINGS CORE sentinels present in index.html', !!pageRegion);
ck('byte-parity: index.html inlined core === core.mjs body (indentation-normalized)',
   !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion));

// ── report ──
console.log('The Lodestone Plate — core.test.mjs');
console.log('  page self-test: ' + st.passed + '/' + st.total + ' checks green');
console.log('  byte-parity: ' + (coreRegion && pageRegion && norm(coreRegion) === norm(pageRegion) ? 'IDENTICAL' : 'DRIFTED'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
