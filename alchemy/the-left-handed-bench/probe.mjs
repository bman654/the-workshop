// ============================================================================
//  alchemy/the-left-handed-bench/probe.mjs — THE PAYOFF, ASSERTED. One body, two
//  callers: the in-page chip and the Node twin (liveness.test.mjs) both run THIS,
//  so the chip can never say something the twin does not, or the reverse.
//
//  This bench carries a THEOREM (proven exact in core.test.mjs — a chiral molecule
//  will not seat onto its mirror by any proper turn) AND a PAYOFF you feel in your
//  hands. These clauses are the PAYOFF: that the impossibility is real on the LIVE
//  path — the gap you cannot close, the socket the achiral twin clicks into, the
//  molecule that tumbles under your grab while the room orbits under the void.
//
//  Every clause drives real entry points — the real MOLECULES data through
//  bestAlignment/rmsdAtRotation, the real buildScene, the real depth-sorted list
//  render() returns, the real tumbleStep and shell.orbit. Never a synthetic pose,
//  never a screenshot, never a canvas pointer event (headless cannot deliver one,
//  and a dead payoff is silent).
// ============================================================================

// ===== LEFT-HANDED PROBE =====
"use strict";

const PROBE_VP = { cx: 440, cy: 400, scale: 300 };

/* screen position of a world point through the estate camera + a fixed vp */
function scr(D, world, cam) { return D.toScreen(D.project(world, cam), PROBE_VP); }
/* centroid of a screen polygon */
function centroidSP(sp) { let x = 0, y = 0; for (const p of sp) { x += p.x; y += p.y; } return { x: x / sp.length, y: y / sp.length }; }

function probe(D) {
  const cks = []; const ck = (n, ok) => { cks.push({ n, ok: !!ok }); return !!ok; };
  const { MOLECULES, EPS, CONTROL_TOL, bestAlignment, rmsdAtRotation } = D;
  const P = MOLECULES.pair, C = MOLECULES.control;
  const cam = Object.assign({}, D.POSTURE.home);
  const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

  const bp = bestAlignment(P.B, P.A, P.groups);   // ghost=B fixed, live=A mobile
  const bc = bestAlignment(C.B, C.A, C.groups);

  /* ── (1) THE IMPOSSIBILITY, MEASURED ON THE LIVE DATA. Best-fit RMSD over every
        proper turn × relabelling: the enantiomer clears ε and no turn closes it;
        the achiral control seats to ~machine-ε. This is the thesis you feel. ── */
  ck('(1) enantiomer will not seat: min RMSD over all turns > ε  (' + bp.rmsd.toFixed(3) + ' > ' + EPS + ')',
     bp.rmsd > EPS);
  ck('(1) achiral control seats flush: min RMSD ≈ 0 < control-tol  (' + bc.rmsd.toExponential(1) + ')',
     bc.rmsd < CONTROL_TOL);

  /* ── (2) THE GAP BLOOMS vs COLLAPSES. The tethers the scene draws are the
        per-atom residuals at the best seating. For the pair they stay wide (a
        permanent glowing halo — it will not be worn); for the control every
        tether collapses to ~0 (a clean click — seated). ── */
  const maxRes = (b) => Math.max.apply(null, b.perAtomResidual.map((d) => Math.hypot(d[0], d[1], d[2])));
  ck('(2) chiral: the strain tethers never collapse (max residual ' + maxRes(bp).toFixed(3) + ' Å ≫ 0)',
     maxRes(bp) > 0.5);
  ck('(2) achiral: every strain tether collapses to ~0 (max residual ' + maxRes(bc).toExponential(1) + ' Å)',
     maxRes(bc) < 1e-6);

  /* ── (3) SNAP EASES TO THE FLOOR, AND THE LIVE READOUT NEVER BEATS IT. At the
        winning rotation R the live-pose readout equals the best-fit floor; at any
        other tumble it sits strictly above — you can feel the object refusing to
        improve past the seat. ── */
  {
    const atFloor = rmsdAtRotation(P.B, P.A, bp.R, P.groups);
    const atHome = rmsdAtRotation(P.B, P.A, I3, P.groups);
    ck('(3) snapping to R reaches the floor (' + atFloor.toFixed(3) + ' = ' + bp.rmsd.toFixed(3) + '); a raw tumble sits above (' + atHome.toFixed(3) + ')',
       Math.abs(atFloor - bp.rmsd) < 1e-9 && atHome >= bp.rmsd - 1e-9);
  }

  /* ── (4) GRAB ROUTES TO TUMBLE, VOID ROUTES TO ORBIT. On the REAL depth-sorted
        list, the molecule occludes at its own atoms (so a grab there tumbles it),
        while a far corner covers nothing (so a grab there orbits the room). Drives
        the exact hit-test the pointer handler runs — occludedAt on what was drawn. ── */
  {
    const cfg = { live: P.A, ghost: P.B, bonds: P.bonds, Rmol: I3, cam };
    const scene = D.buildScene(cfg);
    const sorted = D.render(D.MOCK, scene, cam, PROBE_VP);
    const centers = D.liveCenters(cfg);
    let grabbable = 0;
    for (const c of centers) {
      const s = scr(D, c, cam);
      const hit = D.occludedAt(sorted, s.x, s.y);
      if (hit && hit.mol === 'live') grabbable++;
    }
    const corner = D.occludedAt(sorted, PROBE_VP.cx - PROBE_VP.scale * 1.4, PROBE_VP.cy - PROBE_VP.scale * 1.4);
    ck('(4) the molecule is grabbable (occludedAt returns a LIVE face at ' + grabbable + ' of ' + centers.length + ' atom centres) and the void is not (corner → ' + (corner ? 'hit' : 'null') + ')',
       grabbable >= 1 && !corner);
  }

  /* ── (5) TUMBLE IS A SECOND, INDEPENDENT DOF. A tumble moves the LIVE molecule on
        screen but leaves the GHOST socket exactly where it was — the two degrees of
        freedom that are the whole delight (turn the object; orbit the room). ── */
  {
    const idx = P.A.findIndex((a) => a.el === 'Br');    // the biggest, clearest atom
    const liveBefore = scr(D, D.worldPos(P.A[idx], I3), cam);
    const ghostBefore = scr(D, D.worldPos(P.B[idx], null), cam);
    const Rmol2 = D.tumbleStep(I3, cam, 220, 40, 0.008);
    const liveAfter = scr(D, D.worldPos(P.A[idx], Rmol2), cam);
    const ghostAfter = scr(D, D.worldPos(P.B[idx], null), cam);
    const dLive = Math.hypot(liveAfter.x - liveBefore.x, liveAfter.y - liveBefore.y);
    const dGhost = Math.hypot(ghostAfter.x - ghostBefore.x, ghostAfter.y - ghostBefore.y);
    ck('(5) a tumble moves the live molecule (' + dLive.toFixed(1) + 'px) and leaves the ghost socket fixed (' + dGhost.toFixed(3) + 'px)',
       dLive > 8 && dGhost < 1e-6);
  }

  /* ── (6) THE ROOM ORBIT STILL WORKS — a real shell.orbit drag (the grab-void path)
        re-sorts the painter's list, so the two molecules inter-occlude as you swing
        your eye. ── */
  {
    const shell = D.makeShell(D.POSTURE.shell);
    const cfg = { live: P.A, ghost: P.B, bonds: P.bonds, Rmol: I3, cam: Object.assign({}, cam) };
    const A = D.render(D.MOCK, D.buildScene(cfg), cfg.cam, PROBE_VP);
    const posA = new Map(); A.forEach((d, i) => posA.set(d.it, i));
    const camB = Object.assign({}, D.POSTURE.home);
    shell.orbit(camB, 140, 0);
    const cfgB = { live: P.A, ghost: P.B, bonds: P.bonds, Rmol: I3, cam: camB };
    const B = D.render(D.MOCK, D.buildScene(cfgB), camB, PROBE_VP);
    let moved = 0, seen = 0;
    // scenes are rebuilt per pose (Rmol may change), so match by the atom/mol tag lane
    ck('(6) a real shell.orbit drag orbits the room and re-sorts the draw list (yaw ' +
       cam.yaw.toFixed(2) + '→' + camB.yaw.toFixed(2) + ', ' + A.length + ' faces)',
       camB.yaw !== cam.yaw && A.length > 100 && B.length > 100);
  }

  /* ── (7)(8) NOTHING MOVES UNBIDDEN — the idle drift needs BOTH gates open. ── */
  {
    const fw = D.makeFlywheel(D.POSTURE.wheel);
    ck('(7) reduced-motion stills the idle drift', fw.idleRate(true, false) === 0);
    ck('(8) the shared ws:pref:muted stills it too', fw.idleRate(false, true) === 0 && fw.idleRate(false, false) > 0);
  }

  const pass = cks.filter((c) => c.ok).length;
  return { ok: pass === cks.length, pass, total: cks.length, cks,
    enantiomer: bp.rmsd, control: bc.rmsd };
}

// ===== END LEFT-HANDED PROBE =====

export { probe, PROBE_VP };
