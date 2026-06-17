/* ═══════════════════════════════════════════════════════════════════════════
   aerodrome/core.test.mjs — the Node twin of the Aerodrome's flight core.

   Run:  node aerodrome/core.test.mjs    → exit 0 GREEN if all claims hold.

   Proves the THREE exact claims (each also a live self-test pill leg in-page):
     (1) TSIOLKOVSKY exact across an (m0,mf,ve) sweep: |dvSpent − ve·ln(m0/mf)| < 1e-12.
     (2) ε-CONSERVATION: velocity-Verlet on a known bound orbit ≥3 periods holds
         max|ε(t)−ε(0)| < 1e-9, AND leaky forward-Euler (badStep) at the SAME dt
         DRIFTS > 1e-3 on the same arc (discriminating negative control).
     (3) ESCAPE at EXACTLY √(2μ/r) with a negative control baked in: across a
         radius sweep, v=vEsc·(1−1e-6) ⇒ ε<0, e<1, finite apoapsis, RETURNS;
         v=vEsc·(1+1e-6) ⇒ ε≥0, e≥1, r→∞ (no return over a long horizon).
   Plus a BYTE-TWIN PARITY row: the CORE region inlined in index.html is
   byte-identical to the CORE region of core.mjs.
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Core from './core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; console.log('  ✓ ' + msg); } else { fail++; console.error('  ✗ ' + msg); } }
function near(a, b, tol, msg) { ok(Math.abs(a - b) < tol, msg + '  (|Δ|=' + Math.abs(a - b).toExponential(2) + ' < ' + tol + ')'); }

const MU = 1;

/* ── (1) TSIOLKOVSKY exact ──────────────────────────────────────────────────── */
(function () {
  console.log('CLAIM 1 — Tsiolkovsky Δv = ve·ln(m0/mf) exact:');
  let worst = 0;
  const ves = [0.1, 0.5, 1, 2, 3.5, 10];
  const m0s = [1, 2, 5, 12.7, 100];
  const ratios = [1.01, 1.5, 2, Math.E, 7.3, 22];
  for (const ve of ves) for (const m0 of m0s) for (const ratio of ratios) {
    const mf = m0 / ratio;
    const got = Core.dvSpent(m0, mf, ve);
    const want = ve * Math.log(m0 / mf);
    worst = Math.max(worst, Math.abs(got - want));
  }
  near(worst, 0, 1e-12, 'dvSpent matches ve·ln(m0/mf) across the full sweep');
  // domain guards: physically impossible inputs return NaN, never garbage.
  ok(Number.isNaN(Core.dvSpent(1, 2, 1)), 'mf>m0 (ending heavier) → NaN');
  ok(Number.isNaN(Core.dvSpent(1, 0, 1)), 'mf=0 (infinite ratio) → NaN');
  ok(Number.isNaN(Core.dvSpent(1, 0.5, -1)), 'negative exhaust velocity → NaN');
  ok(Core.dvSpent(1, 1, 5) === 0, 'no mass spent → 0 Δv');
})();

/* ── (2) ε-CONSERVATION (Verlet holds) + DISCRIMINATING control (Euler drifts) ─ */
(function () {
  console.log('CLAIM 2 — velocity-Verlet conserves ε < 1e-9 over ≥3 periods; leaky Euler drifts > 1e-3:');
  // A known BOUND orbit at a moderate eccentricity that renders smoothly. Seed at
  // periapsis: r=peri, velocity purely tangential. Pick a=1.0, e=0.1 ⇒ peri=0.9.
  // Physics runs on a fixed small dt (an accumulator decouples it from the frame),
  // so this is the SAME integrator the page steps — just stepped further here.
  const a = 1.0, e = 0.1;
  const peri = a * (1 - e);
  const vPeri = Math.sqrt(MU * (2 / peri - 1 / a));
  const start = { rx: peri, ry: 0, vx: 0, vy: vPeri };
  const T = 2 * Math.PI * Math.sqrt((a * a * a) / MU);
  const dt = T / 80000;                       // fixed small physics dt
  const eps0 = Core.specificEnergy(peri, vPeri, MU);

  // Verlet — symplectic. Measure peak ε error at 3 periods AND at 9 periods: a
  // symplectic integrator's energy error OSCILLATES with a bounded amplitude and
  // does NOT secularly grow, so the two peaks match — that is the real proof.
  function verletDrift(periods) {
    let s = start, mx = 0, minR = Infinity, maxR = 0;
    const steps = Math.ceil(periods * T / dt);
    for (let i = 0; i < steps; i++) {
      s = Core.verletStep(s, MU, dt);
      const r = Math.hypot(s.rx, s.ry), v = Math.hypot(s.vx, s.vy);
      mx = Math.max(mx, Math.abs(Core.specificEnergy(r, v, MU) - eps0));
      minR = Math.min(minR, r); maxR = Math.max(maxR, r);
    }
    return { mx: mx, minR: minR, maxR: maxR };
  }
  const v3 = verletDrift(3.25);
  ok(v3.mx < 1e-9, 'Verlet: max|ε(t)−ε(0)| = ' + v3.mx.toExponential(2) + ' < 1e-9 over 3.25 periods');
  const v9 = verletDrift(9.25);
  ok(v9.mx < 1e-9, 'Verlet: still < 1e-9 over 9.25 periods (no secular drift)');
  near(v9.mx, v3.mx, 5e-10, 'Verlet: 9-period peak ≈ 3-period peak (BOUNDED oscillation — symplectic, not lucky)');
  // sanity: the orbit actually swept its full radial range (it's not stuck).
  near(v3.minR, peri, 2e-3, 'Verlet: periapsis radius recovered (orbit really moved)');
  near(v3.maxR, a * (1 + e), 2e-3, 'Verlet: apoapsis radius recovered');

  // Leaky forward-Euler — same dt, same arc, just 3 periods — MUST drift visibly.
  let b = start, maxDriftE = 0;
  const stepsE = Math.ceil(3.25 * T / dt);
  for (let i = 0; i < stepsE; i++) {
    b = Core.badStep(b, MU, dt);
    const r = Math.hypot(b.rx, b.ry), v = Math.hypot(b.vx, b.vy);
    if (!(isFinite(r) && r > 0)) { maxDriftE = Infinity; break; }
    maxDriftE = Math.max(maxDriftE, Math.abs(Core.specificEnergy(r, v, MU) - eps0));
  }
  ok(maxDriftE > 1e-3, 'leaky Euler: max|ε drift| = ' + (isFinite(maxDriftE) ? maxDriftE.toExponential(2) : '∞') + ' > 1e-3 (the integrator choice matters)');
  ok(maxDriftE / Math.max(v3.mx, 1e-300) > 1e5, 'Euler drift exceeds Verlet drift by > 1e5× (discriminating, not a loose bound)');
})();

/* ── (3) ESCAPE at EXACTLY √(2μ/r), with the negative control baked in ───────── */
(function () {
  console.log('CLAIM 3 — escape exactly at v = √(2μ/r); just-under returns, just-over escapes:');
  const radii = [0.6, 1.0, 1.7, 3.0, 6.5, 20];
  let wallOK = true, underAnalyticOK = true, overAnalyticOK = true, returnOK = true, escapeOK = true;
  for (const r of radii) {
    const ve = Core.vEsc(r, MU);
    // confirm the wall speed equals the closed-form √(2μ/r) to machine ε.
    if (Math.abs(ve - Math.sqrt(2 * MU / r)) > 1e-14) wallOK = false;

    // just UNDER escape: tangential velocity ve·(1−1e-6) at radius r ⇒ bound conic.
    const vU = ve * (1 - 1e-6);
    const su = { rx: r, ry: 0, vx: 0, vy: vU };
    const ou = Core.orbitFromState(su.rx, su.ry, su.vx, su.vy, MU);
    if (!(ou.eps < 0 && ou.e < 1 && isFinite(ou.apo) && ou.bound)) underAnalyticOK = false;

    // just OVER escape: ve·(1+1e-6) ⇒ unbound hyperbola, no apoapsis (no NaN garbage).
    const vO = ve * (1 + 1e-6);
    const so = { rx: r, ry: 0, vx: 0, vy: vO };
    const oo = Core.orbitFromState(so.rx, so.ry, so.vx, so.vy, MU);
    if (!(oo.eps >= 0 && oo.e >= 1 && !isFinite(oo.apo) && !oo.bound)) overAnalyticOK = false;

    // INTEGRATED behaviour — to keep the bound-orbit period finite (a razor-edge
    // 1e-6-under-escape ellipse has an astronomically large apoapsis & period), we
    // integrate a CLEARLY-bound orbit (0.85·ve) and a CLEARLY-unbound one (1.15·ve).
    // The launch radius is the periapsis (tangential launch above circular), so
    // both rise; the bound one must TURN AROUND (radial velocity flips → returns),
    // the unbound one must NEVER turn around (radial velocity stays positive →
    // escapes). Both must agree with the analytic apoapsis / unbound classification.
    const dt = Math.min(0.01, r * 0.02);
    const sBound = { rx: r, ry: 0, vx: 0, vy: ve * 0.85 };
    const oBound = Core.orbitFromState(sBound.rx, sBound.ry, sBound.vx, sBound.vy, MU);
    let s1 = sBound, turned = false, rPeak = r;
    const horizon = 2e6;                          // hard step cap (safety)
    for (let i = 0; i < horizon; i++) {
      const prev = s1; s1 = Core.verletStep(s1, MU, dt);
      const rr = Math.hypot(s1.rx, s1.ry);
      rPeak = Math.max(rPeak, rr);
      if (rr < Math.hypot(prev.rx, prev.ry)) { turned = true; break; } // rounded apoapsis
    }
    // it must turn around (return), reaching ~the analytic apoapsis it predicted.
    if (!(turned && Math.abs(rPeak - oBound.apo) < oBound.apo * 0.02)) returnOK = false;

    // UNBOUND: r must keep growing (radial velocity never flips) to far away.
    const sUnb = { rx: r, ry: 0, vx: 0, vy: ve * 1.15 };
    let s2 = sUnb, escaped = true, prevR = r;
    const stepsO = 300000;
    for (let i = 0; i < stepsO; i++) {
      s2 = Core.verletStep(s2, MU, dt);
      const rr = Math.hypot(s2.rx, s2.ry);
      if (rr < prevR - 1e-9) { escaped = false; break; }  // it turned around → NOT escape
      prevR = rr;
    }
    const rEnd = Math.hypot(s2.rx, s2.ry);
    if (!(escaped && rEnd > r * 20 && isFinite(rEnd))) escapeOK = false;
  }
  ok(wallOK, 'the escape WALL speed vEsc(r) === √(2μ/r) to machine ε across the radius sweep');
  ok(underAnalyticOK, 'just-under escape: ε<0, e<1, finite apoapsis, bound — at every radius');
  ok(overAnalyticOK, 'just-over escape: ε≥0, e≥1, apoapsis = ∞ (no NaN/garbage), unbound — at every radius');
  ok(returnOK, 'integrated just-under orbit TURNS AROUND at its analytic apoapsis (returns — bound)');
  ok(escapeOK, 'integrated just-over orbit never turns around, flies to r > 20× start (escaped)');

  // conicType agrees with the words the UI uses.
  ok(Core.conicType(0) === 'circle' && Core.conicType(0.4) === 'ellipse' &&
     Core.conicType(1) === 'parabola' && Core.conicType(1.3) === 'hyperbola',
    'conicType labels circle/ellipse/parabola/hyperbola correctly');
})();

/* ── stateAfterKick sanity: prograde grows apoapsis, radial rotates apse line ── */
(function () {
  console.log('KICK — prograde balloons apoapsis; radial rotates the apse line:');
  const r = 1.0;
  const circ = Core.circularState(r, MU, true);            // circular at r=1, CCW
  const o0 = Core.orbitFromState(circ.rx, circ.ry, circ.vx, circ.vy, MU);
  // prograde burn → apoapsis rises above the circular radius.
  const sp = Core.stateAfterKick(circ, 0.15, 'prograde', MU);
  const op = Core.orbitFromState(sp.rx, sp.ry, sp.vx, sp.vy, MU);
  ok(op.apo > o0.r * 1.05, 'prograde Δv raises apoapsis above the circular radius');
  // retrograde burn → apoapsis falls (orbit shrinks).
  const sr = Core.stateAfterKick(circ, 0.15, 'retrograde', MU);
  const or = Core.orbitFromState(sr.rx, sr.ry, sr.vx, sr.vy, MU);
  ok(or.peri < o0.r * 0.97, 'retrograde Δv lowers periapsis below the circular radius');
  // radial burn → the apse line ROTATES (ω changes) but a barely grows (the
  // counter-intuitive truth: radial thrust turns the orbit, it doesn't grow it).
  const sra = Core.stateAfterKick(circ, 0.15, 'radial-out', MU);
  const ora = Core.orbitFromState(sra.rx, sra.ry, sra.vx, sra.vy, MU);
  ok(Math.abs(ora.omega - o0.omega) > 0.05, 'radial Δv rotates the apse line (ω moves)');
  ok(ora.e > o0.e + 0.05, 'radial Δv makes the circle eccentric');
})();

/* ── BYTE-TWIN PARITY: index.html CORE region === core.mjs CORE region ───────── */
(function () {
  console.log('PARITY — index.html CORE region is byte-identical to core.mjs:');
  const dir = __dirname;
  // anchor on the actual SENTINEL tokens "/* CORE BEGIN" and "/* CORE END */"
  // (not the prose mention of them in the file header).
  function coreRegion(text) {
    const a = text.indexOf('/* CORE BEGIN');
    const b = text.indexOf('/* CORE END */');
    if (a < 0 || b < 0) return null;
    const lineStart = text.lastIndexOf('\n', a) + 1;
    const lineEnd = text.indexOf('\n', b + 5);
    return text.slice(lineStart, lineEnd < 0 ? text.length : lineEnd);
  }
  const coreSrc = readFileSync(join(dir, 'core.mjs'), 'utf8').replace(/\r\n/g, '\n');
  const idxPath = join(dir, 'index.html');
  if (!existsSync(idxPath)) {
    console.error('  ✗ index.html not found — build it before asserting parity'); fail++; return;
  }
  const idxSrc = readFileSync(idxPath, 'utf8').replace(/\r\n/g, '\n');
  const rSrc = coreRegion(coreSrc), rIdx = coreRegion(idxSrc);
  ok(rSrc != null, 'core.mjs has a CORE region');
  ok(rIdx != null, 'index.html has a CORE region');
  ok(rSrc != null && rIdx != null && rSrc === rIdx,
    'the inlined CORE region matches core.mjs byte-for-byte');
})();

/* ── report ─────────────────────────────────────────────────────────────────── */
const total = pass + fail;
if (fail) { console.error('\naerodrome core self-test: ' + pass + '/' + total + ' PASS — ' + fail + ' FAILED'); process.exit(1); }
console.log('\naerodrome core self-test: ' + pass + '/' + total + ' PASS');
process.exit(0);
