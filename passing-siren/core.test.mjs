// Node twin for The Passing Siren (Doppler & the Mach cone). Zero-dep. Run: `node core.test.mjs`.
// Exit 0 = green; non-zero = red. Prints an explicit PASS/FAIL count.
//
// Proves the claims TWO ways and verifies the stationary negative control:
//   (a) runs the page's own runSelfTest() — all green;
//   (b) INDEPENDENT re-derivations NOT routed through the bundled self-test:
//         · head-on approach factor === c/(c−v) and dead-on recession === c/(c+v),
//         · AT closest approach (velocity ⟂ source→ear, cosθ=0) f_obs === f_src EXACTLY,
//         · the heard factor matches f_src·c/(c−v·cosθ) at sampled θ across approach/pass/recede,
//         · sin μ · v = c at several supersonic speeds (and machAngle is NaN at/below c),
//         · the cone half-angle TIGHTENS monotonically as v grows past c;
//   (c) the STATIONARY NEGATIVE CONTROL: zero velocity ⇒ Δf = 0 at every angle (no pitch shift),
//       AND the arrival-rate is 1 everywhere (rings do not bunch — concentric, evenly spaced);
//   (d) BYTE-PARITY: the inlined core between the sentinels in index.html is byte-identical
//       (indentation-normalized) to core.mjs's body.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { C, dopplerFactor, arrivalTime, arrivalRate, machAngle, runSelfTest } from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }

// ── (a) the page's own self-test is all-green ──
const st = runSelfTest();
for (const c of st.checks) ck('selftest ' + c.name + '  [' + c.info + ']', c.pass);

// ── (b) INDEPENDENT re-derivations (not via runSelfTest) ──

// HEAD-ON: a source moving straight AT the ear (θ=0, cosθ=1) ⇒ factor = c/(c−v), exactly.
// DEAD-ON RECEDE: moving straight AWAY (θ=π, cosθ=−1) ⇒ factor = c/(c+v), exactly.
ck('head-on factor === c/(c−v); dead-on recede === c/(c+v)', (() => {
  let ok = true;
  for (const v of [0.2, 0.5, 0.9, 0.99]){
    // ear at the origin; source at (−2,0) moving +x toward it: source→ear = (+2,0), v=(+v,0)
    const approach = dopplerFactor(v, 0, -2, 0, 0, 0);
    if (Math.abs(approach - C/(C - v)) > 1e-12) ok = false;
    // source at (−2,0) moving −x AWAY from the ear: source→ear = (+2,0), v=(−v,0)
    const recede = dopplerFactor(-v, 0, -2, 0, 0, 0);
    if (Math.abs(recede - C/(C + v)) > 1e-12) ok = false;
  }
  return ok;
})());

// AT CLOSEST APPROACH the velocity is perpendicular to the source→ear line (cosθ=0), so the heard
// pitch is f_src EXACTLY — the instant the siren is level with you, not before. Put the ear directly
// abeam (ear at (0, d), source at the origin moving +x): source→ear = (0,d) ⟂ v=(v,0).
ck('at closest approach (v ⟂ line, cosθ=0): f_obs === f_src exactly', (() => {
  for (const v of [0.3, 0.7, 1.5]){
    for (const d of [0.5, 1.0, 2.5]){
      const f = dopplerFactor(v, 0, 0, 0, 0, d);
      if (Math.abs(f - 1) > 1e-15) return false;     // strictly 1: numerator dot-product is 0
    }
  }
  return true;
})());

// The heard factor matches the closed form f_src·c/(c−v·cosθ) at sampled emission angles across a
// pass — re-derived here straight from cosθ (an angle, not the page's velocity-projection path).
ck('factor === c/(c − v·cosθ) at sampled θ (approach · abeam · recede)', (() => {
  const v = 0.6;
  // ear off-axis; source flies +x past it; sample several emission positions
  const lx = 0, ly = 0.8;
  for (let sx = -3; sx <= 3; sx += 0.5){
    const sy = 0;
    const dx = lx - sx, dy = ly - sy, dist = Math.hypot(dx, dy);
    const cosTheta = (v*dx + 0*dy) / (v*dist);        // angle between v=(v,0) and source→ear
    const fromAngle = C / (C - v*cosTheta);
    const fromCore  = dopplerFactor(v, 0, sx, sy, lx, ly);
    if (Math.abs(fromAngle - fromCore) > 1e-12) return false;
  }
  return true;
})());

// sin μ · v = c at several supersonic speeds (the Mach relation), and NaN at/below c.
ck('sin μ · v === c across supersonic speeds; NaN at/below c', (() => {
  for (const v of [1.1, 1.4, 2.0, 2.4, 3.0, 5.0]){
    const mu = machAngle(v);
    if (!isFinite(mu)) return false;
    if (Math.abs(Math.sin(mu)*v - C) > 1e-12) return false;
  }
  // no cone at or below the wave speed
  if (!Number.isNaN(machAngle(1.0))) return false;
  if (!Number.isNaN(machAngle(0.5))) return false;
  return true;
})());

// the cone TIGHTENS as v grows past c: μ strictly decreasing (the visual "cone snaps shut").
ck('Mach cone half-angle strictly tightens as v increases past c', (() => {
  const speeds = [1.05, 1.2, 1.5, 2.0, 2.4, 3.0, 4.0];
  let prev = Infinity;
  for (const v of speeds){
    const mu = machAngle(v);
    if (!(mu < prev)) return false;
    prev = mu;
  }
  return true;
})());

// ── (c) the STATIONARY NEGATIVE CONTROL — the shift is the motion's, not round-off ──
ck('NEGATIVE CONTROL: stationary source ⇒ Δf = 0 at every angle (no pitch shift)', (() => {
  let maxDev = 0;
  for (let ang = 0; ang < 6.283; ang += 0.137){
    const lx = 3*Math.cos(ang), ly = 3*Math.sin(ang);
    const f = dopplerFactor(0, 0, 0, 0, lx, ly);     // zero velocity
    maxDev = Math.max(maxDev, Math.abs(f - 1));
  }
  return maxDev < 1e-12;
})());
ck('NEGATIVE CONTROL: stationary source ⇒ arrival-rate ≡ 1 (rings do not bunch)', (() => {
  // a fixed source at the origin, ear off to the side; the rate d t_arrive/d te must be 1 for ALL
  // emission times (the rings stay concentric and evenly spaced — no compression anywhere).
  let maxDev = 0;
  for (let te = -5; te <= 5; te += 0.25){
    const rate = arrivalRate(te, 0, 0, 0, 0, 1.3, -0.7);  // vx=vy=0 ⇒ X(te) constant
    maxDev = Math.max(maxDev, Math.abs(rate - 1));
  }
  return maxDev < 1e-9;
})());

// arrivalTime is internally consistent: the ring fired at te reaches the ear exactly when its
// radius equals the (constant-velocity) source→ear distance at te (sanity on the exact map).
ck('arrivalTime: radius c·(t_arr − te) === |L − X(te)| (exact ring geometry)', (() => {
  const x0 = -2, y0 = 0.3, vx = 0.7, vy = -0.1, lx = 1.1, ly = 0.9;
  for (let te = -3; te <= 3; te += 0.4){
    const tArr = arrivalTime(te, x0, y0, vx, vy, lx, ly);
    const sx = x0 + vx*te, sy = y0 + vy*te;
    const lhs = C*(tArr - te);
    const rhs = Math.hypot(lx - sx, ly - sy);
    if (Math.abs(lhs - rhs) > 1e-12) return false;
  }
  return true;
})());

// ── (d) BYTE-PARITY: index.html's inlined core === core.mjs body (indentation-normalized) ──
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
const BEGIN = '// ===== PASSING-SIREN CORE (byte-identical to core.mjs) =====';
const END = '// ===== END PASSING-SIREN CORE =====';
function region(text){
  const i = text.indexOf(BEGIN), j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i + BEGIN.length, j);
}
// indentation-normalized comparison: strip leading/trailing whitespace per line and drop blank
// lines, so a page that indents the inlined core inside a closure still matches the module body.
function norm(s){
  return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
}
const coreRegion = region(coreSrc);
const pageRegion = region(pageSrc);
ck('byte-parity: PASSING-SIREN CORE sentinels present in core.mjs', !!coreRegion);
ck('byte-parity: PASSING-SIREN CORE sentinels present in index.html', !!pageRegion);
ck('byte-parity: index.html inlined core === core.mjs body (indentation-normalized)',
   !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion));

// ── report ──
console.log('The Passing Siren — core.test.mjs');
console.log('  page self-test: ' + st.passed + '/' + st.total + ' checks green');
console.log('  byte-parity: ' + (coreRegion && pageRegion && norm(coreRegion) === norm(pageRegion) ? 'IDENTICAL' : 'DRIFTED'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
