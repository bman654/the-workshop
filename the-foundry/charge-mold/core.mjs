// ============================================================================
//  THE FOUNDRY · The Charge Mold — electrostatics on the casting-floor core.
//
//  Zero-dependency, DOM-free ESM. Runs in the browser AND in Node. This module
//  is the SINGLE MATH SOURCE for the Charge Mold bench. It imports the Casting
//  Floor's core UNFORKED — touches ZERO bytes of casting-floor/ — and adds a
//  thin electrostatics layer on top of the SAME relaxer the whole Foundry wing
//  shares. Both index.html (as a real ES module) and core.test.mjs import THIS
//  file, never casting-floor directly, so the page, the in-page self-test pill,
//  and the Node twin all run identical math.
//
//  ── THE CLAIM, made falsifiable ──────────────────────────────────────────────
//  Seat point charges as Poisson sources in a grounded box and relax ∇²φ = −ρ.
//  The settled potential is the true electrostatic field, NOT an SOR artifact:
//    • a LONE +charge gives the 2-D Coulomb LOG potential φ ≈ −(ρ/2π)·ln r —
//      proven by a least-squares LOG-SLOPE that recovers ρ·COULOMB_K to ~0.2%,
//      and isotropy (φ along +x == φ along +y to machine precision);
//    • a +/− DIPOLE gives the antisymmetric cosθ angular law on the near band,
//      with φ ≡ 0 on the perpendicular bisector by symmetry;
//    • CHARGE BALANCE is what buys the far field: a NEUTRAL pair (Σq=0) decays
//      far faster than a same-sign pair (Σq=2ρ) — the monopole tail is the
//      imbalance. (The neg-control the page lets you SEE: drag the − away and a
//      slow log tail blooms back.)
//  The electric field is E = −∇φ (NEVER a gradient DESCENT — that would slide a
//  bead toward the grounded gates, a heat picture, not a field-line picture).
// ============================================================================

import {
  makeGrid, clampRim, setSource, relax, residualInf,
  gradientAt, optimalOmega, sweepRedBlack, applyFixed,
  meanValueDefectAt, FREE, DIRICHLET, runCoreTests,
} from '../casting-floor/core.mjs';

// === CHARGE-MOLD CORE BEGIN ===
// re-export the casting-floor primitives the page + test lean on (unforked)
export {
  gradientAt, relax, optimalOmega, applyFixed, residualInf,
  sweepRedBlack, makeGrid, clampRim, setSource, meanValueDefectAt,
  FREE, DIRICHLET, runCoreTests,
};

// ── the 2-D monopole coefficient. The continuous Green's function of −∇² in the
//    plane is G = −(1/2π)·ln r, so a Poisson source ρ gives φ ≈ −(ρ/2π)·ln r near
//    the charge. COULOMB_K = 1/(2π) is the per-ρ log-slope the test recovers.
//    (VERIFIED: the discrete relaxed slope recovers ρ·COULOMB_K to ~0.2%.)
export const COULOMB_K = 1 / (2 * Math.PI);

// ── per-charge source magnitude. ONE source of truth — the UX, the renderer, and
//    the test all import RHO so a seated charge means the same thing everywhere.
export const RHO = 5;

// ── a grounded box: φ pinned to 0 all around the rim (the iron mold edge). The
//    interior is FREE and relaxes to the field the seated charges + the ground
//    demand.
export function makeCavity(N) {
  const g = makeGrid(N);
  clampRim(g, () => 0);
  return g;
}

// ── seat a list of charges {cx,cy,sign} as Poisson sources of magnitude sign·RHO.
//    Clears any previous sources first, so this is the whole-cavity source state.
export function seatCharges(g, charges) {
  g.source.fill(0);
  for (const c of charges) setSource(g, c.cx | 0, c.cy | 0, c.sign * RHO);
}

// ── the potential at an integer cell (nearest cell, no interpolation).
export function phiAt(g, x, y) {
  return g.field[(y | 0) * g.N + (x | 0)];
}

// ── the ELECTRIC FIELD at a continuous point: E = −∇φ. Field lines RIDE +E,
//    flowing OUT of + charges and INTO − charges. This is the physics picture —
//    deliberately NOT a downhill descent toward the grounded gates.
export function E_at(g, gx, gy) {
  const [dx, dy] = gradientAt(g, gx, gy);
  return [-dx, -dy];
}

// ── is a cell a SINK (a seated − charge)? Field lines terminate here.
export function isSink(g, x, y) {
  return g.source[(y | 0) * g.N + (x | 0)] < -1e-9;
}
// ── is a cell a SOURCE (a seated + charge)? Field lines launch from a ring here.
export function isSource(g, x, y) {
  return g.source[(y | 0) * g.N + (x | 0)] > 1e-9;
}

// ── CENTERED least-squares SLOPE of sampleY vs basis, used identically by the
//    page and the test. This is the slope coefficient of a 2-parameter linear fit
//    (y = a + slope·basis): centering BOTH series kills the additive constant —
//    the box/grounded-rim offset φ carries — so the recovered slope is the clean
//    log-slope, not contaminated by the constant. `basis` and `sampleY` are equal-
//    length arrays already sampled over the radial band [rLo,rHi]; rLo/rHi are
//    carried only for callers that want to label the band.
export function regressSlope(basis, sampleY, rLo, rHi) {
  const n = Math.min(basis.length, sampleY.length);
  if (n < 2) return NaN;
  let bMean = 0, yMean = 0;
  for (let i = 0; i < n; i++) { bMean += basis[i]; yMean += sampleY[i]; }
  bMean /= n; yMean /= n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    const db = basis[i] - bMean;
    num += db * (sampleY[i] - yMean);
    den += db * db;
  }
  return num / den;
}

// ── trace ONE field line by RK4 integration of the UNIT E direction, from a start
//    point, riding +E (out of +, into −). Stops when it enters a sink cell, hits
//    the rim band, the field goes flat (|E|→0, a saddle), or it runs out of steps.
//    Returns {path, end} where end ∈ {'sink','rim','flat','maxsteps'}. The unit-
//    speed step makes arclength ≈ step·(#points), so an arrowhead can be placed at
//    a fixed fraction along the path. This is a FRESH integrator over E_at — it
//    shares no code with the casting-floor's descendGradient (which is BANNED here
//    because it descends −∇φ toward the grounded gates, a heat picture).
export function traceFieldLine(g, sx, sy, opts = {}) {
  const { step = 0.35, maxSteps = 1200, minE = 1e-6, dir = +1 } = opts;
  const N = g.N;
  let x = sx, y = sy;
  const path = [[x, y]];
  let end = 'maxsteps';
  const unitE = (px, py) => {
    const [ex, ey] = E_at(g, px, py);
    const m = Math.hypot(ex, ey);
    if (m < minE) return null;
    return [dir * ex / m, dir * ey / m];
  };
  for (let k = 0; k < maxSteps; k++) {
    const cx = Math.round(x), cy = Math.round(y);
    if (cx <= 1 || cy <= 1 || cx >= N - 2 || cy >= N - 2) { end = 'rim'; break; }
    if (isSink(g, cx, cy)) { end = 'sink'; break; }
    // RK4 on the unit-direction field
    const k1 = unitE(x, y); if (!k1) { end = 'flat'; break; }
    const k2 = unitE(x + 0.5 * step * k1[0], y + 0.5 * step * k1[1]); if (!k2) { end = 'flat'; break; }
    const k3 = unitE(x + 0.5 * step * k2[0], y + 0.5 * step * k2[1]); if (!k3) { end = 'flat'; break; }
    const k4 = unitE(x + step * k3[0], y + step * k3[1]); if (!k4) { end = 'flat'; break; }
    x += (step / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    y += (step / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    path.push([x, y]);
  }
  return { path, end };
}

// ── MARCHING SQUARES on a scalar field `sampleφ(x,y)` over an integer grid of side
//    N, at one iso-level. Returns an array of segments [[x0,y0,x1,y1],…] in grid
//    coordinates. Self-contained (the renderer + the test both call it): for each
//    unit cell it linearly interpolates the crossing points on the edges that the
//    level cuts, using the standard 16-case lookup collapsed to edge interpolation.
//    `sampleφ` lets the test feed a synthetic analytic field and the page feed the
//    relaxed φ. Saddle (cases 5,10) split into two segments via the cell average.
export function marchingSquares(sampleField, N, level, x0 = 1, y0 = 1, x1 = -1, y1 = -1) {
  if (x1 < 0) x1 = N - 2;
  if (y1 < 0) y1 = N - 2;
  const segs = [];
  // edge interpolation: crossing point between corner a (value va) and b (value vb)
  const lerp = (ax, ay, va, bx, by, vb) => {
    const t = (level - va) / (vb - va);
    return [ax + t * (bx - ax), ay + t * (by - ay)];
  };
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const tl = sampleField(x, y),       tr = sampleField(x + 1, y);
      const bl = sampleField(x, y + 1),   br = sampleField(x + 1, y + 1);
      let c = 0;
      if (tl > level) c |= 8;
      if (tr > level) c |= 4;
      if (br > level) c |= 2;
      if (bl > level) c |= 1;
      if (c === 0 || c === 15) continue;
      // the four edge crossing points (top,right,bottom,left), computed lazily
      const T = () => lerp(x, y, tl, x + 1, y, tr);
      const R = () => lerp(x + 1, y, tr, x + 1, y + 1, br);
      const B = () => lerp(x, y + 1, bl, x + 1, y + 1, br);
      const L = () => lerp(x, y, tl, x, y + 1, bl);
      const push = (a, b) => segs.push([a[0], a[1], b[0], b[1]]);
      switch (c) {
        case 1: case 14: push(L(), B()); break;
        case 2: case 13: push(B(), R()); break;
        case 3: case 12: push(L(), R()); break;
        case 4: case 11: push(T(), R()); break;
        case 6: case 9:  push(T(), B()); break;
        case 7: case 8:  push(L(), T()); break;
        case 5: case 10: {
          // saddle: resolve by the cell-centre average
          const center = 0.25 * (tl + tr + bl + br);
          if ((c === 5) === (center > level)) { push(L(), T()); push(B(), R()); }
          else { push(L(), B()); push(T(), R()); }
          break;
        }
      }
    }
  }
  return segs;
}
// === CHARGE-MOLD CORE END ===
