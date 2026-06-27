#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
   core.test.mjs — the Node twin for THE KEYSTONE ARCH.

   Imports the SAME core.mjs the page inlines and runs the SAME runSelfTest(), then
   re-probes each headline claim directly + a third-ring sanity check. Exits 0 iff
   every assertion passes (CI-true).

   The claims under proof:
     (1) THE SEATED ARCH STANDS — a line of thrust exists INSIDE the ring (|e| ≤ t/2
         at every joint), every joint in COMPRESSION (N_k > 0), and the most-centred
         such line sits in the MIDDLE THIRD (|e| < t/6, no tension), equioscillating
         at three joints to machine ε.
     (2) THE THRUST WINDOW — a RANGE of horizontal thrusts each admit a contained
         line (statical indeterminacy + Heyman's safe theorem): Hmin < Hc < Hmax.
     (3) THE NEG-CONTROL — remove the keystone and NO contained line exists: H=0 is
         forced, the thrust line flies outside the ring at EVERY joint (worst |e| =
         0.879859 ≫ t/2), the half-arch's gravity moment about its springer is
         −2.489530 ≠ 0, standsUp === false.
     (4) THE PINNED NUMBERS reproduce the /tmp-validated headline values.

   Run:  node the-keystone-arch/core.test.mjs
   ════════════════════════════════════════════════════════════════════════════ */
import {
  buildArch, thrustLine, admissibleLine, thrustWindow, keystoneRemoved,
  annularSector, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const ok = (c, m) => {
  if (c) { pass++; console.log('  \x1b[32m✓\x1b[0m ' + m); }
  else { fail++; console.log('  \x1b[31m✗ ' + m + '\x1b[0m'); }
};

console.log('\nTHE KEYSTONE ARCH — core.test.mjs\n');

// ── the in-page self-test, run here verbatim (the SAME runSelfTest the pill calls) ──
console.log('runSelfTest() — the exact suite the in-page pill runs:');
const r = runSelfTest();
r.log.forEach(l => console.log('    ' + l));
ok(r.fail === 0, `runSelfTest() reports ${r.pass} pass / ${r.fail} fail`);

const arch = buildArch();
const { t, Rmid } = arch;

// ── CLAIM (1): the seated arch stands — contained, compressive, middle-third.
console.log('\nclaim (1) — the seated arch has a contained, compressive line of thrust:');
{
  const adm = admissibleLine(arch);
  ok(adm.contained === true, `max|e| = ${adm.maxAbsE.toFixed(8)} ≤ t/2 = 0.5 — the line threads the stone`);
  ok(adm.allCompressive === true, `every joint normal force N_k > 0 (compression, no pull)`);
  ok(adm.maxAbsE < t / 6, `max|e| = ${adm.maxAbsE.toFixed(6)} < t/6 = ${(t / 6).toFixed(6)} — inside the middle third (no tension)`);
  ok(adm.equioscillates && adm.dominates, `the centred line equioscillates at 3 joints at |e| = ${adm.E.toFixed(8)} and no joint exceeds it`);
  // every joint individually
  let worst = 0; for (const e of adm.allE) worst = Math.max(worst, Math.abs(e));
  ok(Math.abs(worst - adm.maxAbsE) < 1e-12, `the reported max|e| is the true worst joint (${worst.toFixed(8)})`);
}

// ── CLAIM (2): the thrust window — a range of thrusts works.
console.log('\nclaim (2) — a whole window of horizontal thrusts admits a contained line:');
{
  const w = thrustWindow(arch);
  ok(w.Hmin > 0, `Hmin = ${w.Hmin.toFixed(5)} > 0`);
  ok(w.Hmax > w.Hmin, `Hmax = ${w.Hmax.toFixed(5)} > Hmin`);
  ok(w.Hcentred > w.Hmin && w.Hcentred < w.Hmax, `the centred thrust ${w.Hcentred.toFixed(5)} lies strictly inside the window`);
  // a thrust at the centre is admissible; one well outside is not
  ok(thrustLine(w.Hcentred, Rmid + 0.13342, arch).contained, `the centred thrust gives a contained line`);
  ok(!thrustLine(w.Hmin * 0.4, Rmid, arch).contained, `a thrust far below Hmin does NOT (the line escapes the ring)`);
}

// ── CLAIM (3): the neg-control — remove the keystone, nothing holds.
console.log('\nclaim (3) — remove the keystone and NO contained line exists (it falls):');
{
  const neg = keystoneRemoved(arch);
  ok(neg.H === 0, `the crown is now free ⇒ horizontal thrust H = 0 is forced`);
  ok(neg.contained === false && neg.standsUp === false, `no contained thrust line · standsUp === false`);
  ok(neg.allOutsideRing === true, `the H=0 thrust line is OUTSIDE the ring at every joint`);
  ok(neg.worstAbsE > t / 2, `worst |e| = ${neg.worstAbsE.toFixed(6)} ≫ t/2 = 0.5`);
  ok(Math.abs(neg.gravityMomentAboutSpring) > 1e-6, `gravity moment about the springer = ${neg.gravityMomentAboutSpring.toFixed(6)} ≠ 0 (unbalanced)`);
  // a direct contrast: same arch, with vs without the keystone
  const adm = admissibleLine(arch);
  ok(adm.contained && !neg.contained, `same arch: WITH the keystone it stands, WITHOUT it cannot`);
}

// ── CLAIM (4): the pinned /tmp-validated numbers, reproduced.
console.log('\nclaim (4) — the headline numbers reproduce the validated values:');
{
  const adm = admissibleLine(arch), neg = keystoneRemoved(arch);
  ok(Math.abs(neg.worstAbsE - 0.879859) < 5e-6, `neg worst|e| = 0.879859 (got ${neg.worstAbsE.toFixed(6)})`);
  ok(Math.abs(neg.gravityMomentAboutSpring + 2.489530) < 5e-6, `neg gravity moment = −2.489530 (got ${neg.gravityMomentAboutSpring.toFixed(6)})`);
  ok(Math.abs(adm.maxAbsE - 0.13342142) < 1e-6, `centred max|e| = 0.13342142 (got ${adm.maxAbsE.toFixed(8)})`);
  ok(Math.abs(arch.totalWeight - 2.5 * Math.PI) < 1e-9, `total weight = 2.5π = ${(2.5 * Math.PI).toFixed(6)} (got ${arch.totalWeight.toFixed(6)})`);
}

// ── SANITY: a third-ring check — the annular-sector centroid radius is between Ri
//    and Ro and the keystone centroid sits exactly on the y-axis (x = 0).
console.log('\nsanity — geometry of the stones:');
{
  const s = annularSector(0, Math.PI / 9, 2, 3, 1);
  ok(s.rc > 2 && s.rc < 3, `a voussoir centroid radius ${s.rc.toFixed(5)} lies between Ri=2 and Ro=3`);
  ok(Math.abs(arch.voussoirs[4].centroid.x) < 1e-12, `the keystone centroid sits on the crown axis (x = ${arch.voussoirs[4].centroid.x.toExponential(2)})`);
  // the right and left springer thrust points of the centred line mirror in x
  const adm = admissibleLine(arch);
  const rs = adm.points[0], ls = adm.points[adm.points.length - 1];
  ok(Math.abs(rs.x + ls.x) < 1e-9 && Math.abs(rs.y - ls.y) < 1e-9, `the centred line is left-right symmetric at the springers`);
  // every voussoir polygon is a closed ring of points inside [Ri,Ro]
  let allIn = true;
  for (const v of arch.voussoirs) for (const p of v.polygon) { const rad = Math.hypot(p.x, p.y); if (rad < 2 - 1e-9 || rad > 3 + 1e-9) allIn = false; }
  ok(allIn, `every voussoir polygon point lies on the ring between Ri and Ro`);
}

console.log(`\n${fail === 0 ? '\x1b[32m' : '\x1b[31m'}${pass} passed, ${fail} failed\x1b[0m\n`);
process.exit(fail === 0 ? 0 : 1);
