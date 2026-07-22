/* ============================================================================
 *  Node twin for THE WEIGHT & THE THREAD dynamics core (Verlet + PBD + collide1D).
 *  Zero-dep.  Run:  node tools/dynamics/core.test.mjs   (exit 0 = green; non-0 = red)
 *
 *  Proves the core's TWO claims, not merely that the code runs — each with a
 *  DISCRIMINATING negative control that MUST go red, so a passing "0" cannot be a
 *  dead integrator or a fitted constant:
 *
 *   [shared] runs the SAME runSelfTest() a page pill runs and mirrors its verdict
 *            here, so twin and pill can never diverge.
 *
 *   A · ENERGY (free pendulum). pin+bob+one rod, dt=1e-3, K=1, θ0=0.3, drag=0,
 *       1e4 steps: max |dE|/|E0| < eps_E=1e-2 (E = ½m v² − m g·r from core-reported
 *       velocity). HONEST FRAMING: this is a CHARACTERIZED BOUND over a FIXED
 *       horizon — position-Verlet PBD carries a small secular drift; it is not
 *       eternal conservation. CONTROLS (both MUST breach eps_E): drag=−2e-4
 *       (anti-damped, energy pumped up ≈0.27) and drag=+2e-4 (over-damped ≈0.041).
 *       If a dead/frozen integrator reported v≈0 forever, |dE| would read ~0 for
 *       ALL of these — the controls prove the ledger actually tracks the dynamics.
 *
 *   B · MOMENTUM (collide1D — the SAME operator the Cradle runs per contact). 5000
 *       seeded random (e,m1,m2,u1,u2): |Δp| < eps_P=1e-9 (measured ~1e-14).
 *       CONTROL: a 1.3×-teeth unequal-impulse collide breaks momentum hugely
 *       (|Δp| ≈ 7) — momentum here is an algebraic identity, not a fitted number.
 *
 *   [dt-sweep] the drift shrinks as dt shrinks over the same wall time (earned eps).
 *   [byte-twin] IF a rider page inlines the DYNAMICS CORE slab, it must be byte-
 *       identical (indentation-normalised) to verlet.mjs. Skipped-green until a
 *       page exists (this core ships before its rider rooms are re-founded).
 * ============================================================================ */

import {
  collide1D, World,
  freePendulumDrift, momentumConservationTest, _mulberry32,
  runSelfTest,
} from './verlet.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const EPS_E = 1e-2, EPS_P = 1e-9;
let pass = 0, fail = 0; const fails = [];
function check(name, ok, detail){
  if (ok) pass++; else { fail++; fails.push(name + (detail ? '  [' + detail + ']' : '')); }
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (detail ? '  ' + detail : ''));
}

/* ── [shared] mirror the page pill's runSelfTest() verdict ───────────────────── */
{
  const r = runSelfTest();
  for (const c of r.checks) check('[shared] ' + c.name, c.pass, c.info);
  check('[shared] runSelfTest() overall green', r.ok, r.passed + '/' + r.total);
}

/* ── A · ENERGY: free pendulum bounded drift + BOTH drag controls breach ─────── */
{
  const a = freePendulumDrift();
  check('(A) free-pendulum energy: max |dE|/|E0| < 1e-2 over 1e4 steps (bounded, not eternal)',
    a.maxRel < EPS_E, 'drift ' + a.maxRel.toExponential(2) + ' (E0 ' + a.E0.toFixed(3) + ')');

  const aNeg = freePendulumDrift({ drag: -2e-4 });
  const aPos = freePendulumDrift({ drag: +2e-4 });
  check('(A-ctrl) anti-damped drag=−2e-4 BREACHES eps (energy pumped up — ledger is live)',
    aNeg.maxRel > EPS_E, 'drift ' + aNeg.maxRel.toExponential(2));
  check('(A-ctrl) over-damped drag=+2e-4 BREACHES eps (energy bled — ledger is live)',
    aPos.maxRel > EPS_E, 'drift ' + aPos.maxRel.toExponential(2));

  /* the energy number is real: at rest the bob's E is pure potential −m g y0, and
   * a hand-computed E matches the core's energy() to machine-ε (no hidden fudge). */
  const w = new World({ gravity: [0, 9.81], dt: 1e-3 });
  const pin = w.add(0, 0, { pinned: true });
  const L = 1, theta0 = 0.3;
  const bob = w.add(L*Math.sin(theta0), L*Math.cos(theta0), { mass: 1 });
  w.link(pin, bob, L);
  const hand = -1 * 9.81 * (L*Math.cos(theta0));     // ½m v² = 0 at rest
  check('(A2) energy() == ½m v² − m g y assembled by hand at rest (no hard-coded E)',
    Math.abs(w.energy(bob, 1) - hand) < 1e-12,
    '|Δ| ' + Math.abs(w.energy(bob, 1) - hand).toExponential(2));
}

/* ── B · MOMENTUM: collide1D exact + the 1.3×-teeth control breaks it hugely ──── */
{
  const worst = momentumConservationTest(5000);
  check('(B) collide1D momentum exact: max |Δp| < 1e-9 over 5000 seeded collisions',
    worst < EPS_P, 'worst |Δp| ' + worst.toExponential(2));

  /* the discriminator: a collide that over-drives one outgoing speed by 1.3× — a
   * plausible-looking bug that violates momentum. It MUST fail by a mile. */
  function collideBad(m1, m2, u1, u2, e){
    const s = m1 + m2;
    const v1 = ((m1 - e*m2)*u1 + (1 + e)*m2*u2) / s;
    const v2 = 1.3 * (((m2 - e*m1)*u2 + (1 + e)*m1*u1) / s);
    return [v1, v2];
  }
  const rnd = _mulberry32(0x1234abcd);
  let badWorst = 0;
  for (let i = 0; i < 5000; i++){
    const e = rnd();
    const m1 = 0.1 + rnd()*5, m2 = 0.1 + rnd()*5;
    const u1 = (rnd() - 0.5)*10, u2 = (rnd() - 0.5)*10;
    const [v1, v2] = collideBad(m1, m2, u1, u2, e);
    badWorst = Math.max(badWorst, Math.abs(m1*v1 + m2*v2 - (m1*u1 + m2*u2)));
  }
  check('(B-ctrl) 1.3×-teeth collide BREAKS momentum hugely (|Δp| ≫ eps — identity, not fit)',
    badWorst > 1.0, 'worst |Δp| ' + badWorst.toExponential(2));

  /* at e=1 KE is conserved too (the harder invariant); at e<1 KE strictly falls
   * while momentum still holds — the physics the restitution slider maps onto. */
  const [ve1, ve2] = collide1D(2, 3, 4, -1, 1);
  const keIn = 0.5*2*16 + 0.5*3*1, keOut = 0.5*2*ve1*ve1 + 0.5*3*ve2*ve2;
  const [vh1, vh2] = collide1D(2, 3, 4, -1, 0.5);
  const keHalf = 0.5*2*vh1*vh1 + 0.5*3*vh2*vh2;
  check('(B2) e=1 conserves KE (elastic) and e<1 strictly bleeds it (p held either way)',
    Math.abs(keOut - keIn) < 1e-12 && keHalf < keIn - 1e-9 &&
    Math.abs((2*vh1+3*vh2) - (2*4+3*-1)) < 1e-12,
    'dKE(e=1) ' + Math.abs(keOut - keIn).toExponential(2) + ' · KE(e=.5) ' + keHalf.toFixed(3) + ' < ' + keIn.toFixed(3));
}

/* ── [dt-sweep] the drift shrinks as dt shrinks over the same wall time ───────── */
{
  const coarse = freePendulumDrift({ dt: 1e-3, steps: 1e4 });   // 10 s
  const fine   = freePendulumDrift({ dt: 5e-4, steps: 2e4 });   // 10 s, half dt
  check('(dt) drift shrinks as dt shrinks over the same 10 s (eps earned, not asserted)',
    fine.maxRel < coarse.maxRel,
    'dt=1e-3 ' + coarse.maxRel.toExponential(2) + ' → dt=5e-4 ' + fine.maxRel.toExponential(2));
}

/* ── the World's own primitives behave (grab/release carries drag velocity) ──── */
{
  const w = new World({ gravity: [0, 0], dt: 1/60 });   // no gravity: isolate the hand
  const id = w.add(0, 0, { mass: 1 });
  w.grab(id);
  w.moveTo(id, 0.1, 0);          // hand drags +0.1 in one dt
  w.release(id);
  const v = w.velocity(id);
  check('(W) release carries the hand drag velocity (px trails ⇒ v = Δx/dt)',
    Math.abs(v[0] - 0.1/(1/60)) < 1e-9 && Math.abs(v[1]) < 1e-12,
    'vx ' + v[0].toFixed(3) + ' (expect ' + (0.1/(1/60)).toFixed(3) + ')');
  /* a held point is kinematic: constraints do not move it. */
  const w2 = new World({ gravity: [0, 9.81], dt: 1e-3, iterations: 4 });
  const a = w2.add(0, 0, { mass: 1 }); const b = w2.add(0.5, 0, { mass: 1 });
  w2.link(a, b, 0.5); w2.grab(a); w2.step(); w2.step();
  check('(W2) a held point stays put under gravity + constraint pull (kinematic)',
    Math.abs(w2.pos(a)[0]) < 1e-12 && Math.abs(w2.pos(a)[1]) < 1e-12,
    'held pos ' + w2.pos(a).map(n => n.toFixed(4)).join(','));
}

/* ── [byte-twin] any rider page that inlines the core slab must match verlet.mjs ─ */
{
  const here = dirname(fileURLToPath(import.meta.url));
  const BEGIN = '// === DYNAMICS CORE BEGIN ===';
  const END = '// === DYNAMICS CORE END ===';
  const region = (text) => {
    const i = text.indexOf(BEGIN), j = text.indexOf(END);
    if (i < 0 || j < 0 || j < i) return null;
    return text.slice(i + BEGIN.length, j);
  };
  const norm = (s) => s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
  const coreRegion = region(readFileSync(join(here, 'verlet.mjs'), 'utf8'));
  check('[byte-twin] DYNAMICS CORE sentinels present in verlet.mjs', !!coreRegion);

  const riderPages = [
    join(here, '..', '..', 'cavern', 'cradle', 'index.html'),
    join(here, '..', '..', 'cavern', 'pendulum-wave', 'index.html'),
  ];
  let checkedAny = false;
  for (const p of riderPages){
    if (!existsSync(p)) continue;
    const pageRegion = region(readFileSync(p, 'utf8'));
    if (pageRegion == null) continue;   // page exists but hasn't inlined the core yet
    checkedAny = true;
    check('[byte-twin] ' + p.split('/').slice(-2).join('/') + ' inlined core === verlet.mjs',
      norm(pageRegion) === norm(coreRegion),
      'chars ' + norm(pageRegion).length + ' vs ' + norm(coreRegion).length);
  }
  if (!checkedAny) check('[byte-twin] no rider page inlines the core yet — parity check deferred (green)', true, 'ships before its rooms');
}

console.log('\nThe Weight & the Thread — dynamics core.test.mjs');
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
