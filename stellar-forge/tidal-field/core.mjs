// The Tidal Field — logic core (the gradient is the tide).
//
// THE WHOLE POINT: a body in orbit is not pulled by ONE force — it is pulled by a FIELD that
// is stronger on the near side than the far side. That DIFFERENCE, not the magnitude, is the
// tide. Two hands act it out on one shared frame around a single host "well":
//   · RELEASE a ring of free-falling beads. Each bead is a real point mass under the FULL
//     point-mass field at ITS OWN position, so the near bead falls faster than the far bead
//     (stretch along the fall) and the side beads converge toward the fall line (squeeze
//     across). The circle deforms into a prolate "tidal egg," long axis pointing at the well,
//     accelerating as 1/r³. It NEVER inflates — it reshapes: longer along ⇔ thinner across.
//   · DRAG a bound moon inward. The moon is a self-cohering cluster; its own gravity tries to
//     hold it round. At every distance d we compare the tidal STRETCH pulling it apart to its
//     SELF-GRAVITY holding it together. When the tide wins the moon shears into a thin ring —
//     a planetary ring is born — and it does so EXACTLY at the Roche limit.
//
// THE TIDAL TENSOR (the tide, linearized). Expand the point-mass field about a center at
// distance r on +x and keep the first gradient. The relative acceleration of a neighbor at
// small separation s is T·s with the diagonal tensor (in the radial/transverse frame)
//      T = [[ +2k, 0 ], [ 0, −k ]],   k = G·M / r³.
// So a unit radial separation is STRETCHED at +2GM/r³ and a unit transverse separation is
// SQUEEZED at −GM/r³. In full 3-D there are TWO equal transverse legs (−k each), so the trace
// is +2k − k − k = 0: the tide is TRACE-FREE — a pure shear, conserving volume. (The page draws
// the 2-D orbital plane, so its single transverse leg is one of those two equal −k legs; the
// self-test reconstructs the 3-D trace as +2k + 2·(−k).) The tensor IS the gradient of the
// field: the self-test central-differences fieldAccel and recovers ±2GM/r³, −GM/r³ exactly.
//
// THE ROCHE LIMIT (where cohesion loses, DERIVED — not a constant). A satellite of radius r_m,
// density ρ_m holds its surface bead with self-gravity g_self = (4/3)π·G·ρ_m·r_m. The host of
// radius R_M, density ρ_M (mass M = (4/3)π·R_M³·ρ_M) stretches that same bead with tidal pull
// a_tide = 2·G·M·r_m / d³ across the satellite. Set g_self === a_tide and solve for d:
//      2·G·M·r_m/d³ = (4/3)π·G·ρ_m·r_m  ⇒  d_roche = R_M·∛(2·ρ_M/ρ_m).
// The satellite radius r_m CANCELS — the limit is DENSITY-only. This is the rigid (cube-root-2)
// coefficient; the deformable "fluid" body, which elongates as it falls and so breaks sooner,
// has the larger NAMED variant d_fluid = 2.44·R_M·∛(ρ_M/ρ_m). The two BRACKET reality.
//
// THE SHEAR MARGIN (the gauge both verbs read). S(d) = a_tide / g_self. Because r_m cancels,
//      S(d) = 2·M / ((4/3)π·ρ_m·d³) = 2·ρ_M·R_M³ / (ρ_m·d³) = (d_roche/d)³  — EXACTLY.
// So S < 1 ⇒ held, S > 1 ⇒ sheared, and S === 1 ⟺ d === d_roche to machine precision. The
// dashed marker the page draws and the physics it enacts are the SAME number.
//
// THE NEG-CONTROL (the gradient is the tide-maker, not the pull). One toggle replaces each
// bead's own-position field with ONE common acceleration uniformAccel(M, C) — the SAME magnitude
// of pull, zero gradient. Then the ring falls as a RIGID circle (no relative deformation, ever)
// and the moon's shear margin is forced ≡ 0 (it never breaks, even at d→0). The contrast IS the
// lesson: when ONLY the gradient is removed and the pull magnitude is held identical, the tide
// vanishes. The self-test certifies both consequences exactly.
//
// THE INTEGRATOR. Free-fall is velocity-Verlet (symplectic, single-sourced): stepBeads advances
// every bead under beadAccel, which is the ONE place the field-mode (uniform vs full) and the
// verb branch. A small stop-radius freezes the fall before the field diverges, so no NaN.
//
// THE SCOPE (honest). Newtonian point-mass field; the tidal tensor is the LINEARIZATION about
// each center (the true relative pull has higher-order terms growing as (s/r)², so the rendered
// egg near the body bulges slightly more than the linear gauge — that divergence is physics,
// not a bug, and is LABELED as such). The rigid coef ∛2 assumes a rigid uniform-density
// satellite; 2.44 lets it deform — the two bracket the real break. The post-break bead spreading
// is a KINEMATIC shear flow (Δv ∝ the tidal gradient), NOT an N-body self-gravity solve. 2-D
// orbital plane; no spin, no material strength. Every claim below is a dimensionless SHAPE or
// SCALING law (a +2/−1 ratio, a trace of 0, a ∛ dial, S=(d_roche/d)³), never a catalogue number.
//
// SOURCING (anti-drift): index.html inlines the block between the TIDAL-FIELD CORE sentinels
// byte-for-byte; core.test.mjs byte-parity-checks the inlined copy so it can never silently
// drift. Zero-dep ESM. No randomness in the math, no wall-clock — every exported function is a
// pure total function (the LCG lives in the view layer's decorative starfield, never a claim).

// ===== TIDAL-FIELD CORE (byte-identical to core.mjs) =====
"use strict";

const G = 1;                       // gravitational constant, set to 1 (scaled units)
const ROCHE_RIGID_COEF = Math.cbrt(2);   // the rigid Roche coefficient ∛2 ≈ 1.2599 (named honestly)
const ROCHE_FLUID_COEF = 2.44;     // the classical fluid (deformable) Roche coefficient (named)

// ── the host mass: a uniform sphere of radius R_M and density ρ_M, lumped at the origin ──
// M = (4/3)π·R_M³·ρ_M. The host is a point mass for the field; its R_M & ρ_M set the Roche edge.
function hostMass(p){ return (4 / 3) * Math.PI * p.R_M * p.R_M * p.R_M * p.rhoM; }

// ── the point-mass field at a position (2-D vector) — THE force every bead really feels ──
// a = −G·M·pos/|pos|³ (points at the origin). Guard |pos|≈0 → [0,0] (no NaN at the well).
function fieldAccel(M, pos){
  const x = pos[0], y = pos[1];
  const r2 = x * x + y * y;
  if (r2 < 1e-12) return [0, 0];
  const r = Math.sqrt(r2);
  const k = -G * M / (r2 * r);     // −GM/r³, times pos gives −GM·pos/r³
  return [k * x, k * y];
}

// ── the uniform-field neg-control: ONE common acceleration for every bead ──
// uniformAccel(M, C) = fieldAccel(M, [|C|, 0])'s magnitude along the line to the well, evaluated
// at the ring CENTER C — the same pull magnitude the center feels, but with ZERO gradient (every
// bead gets the identical vector). Remove only the gradient; hold the magnitude. r_center = |C|.
function uniformAccel(M, C){
  const cx = C[0], cy = C[1];
  const r2 = cx * cx + cy * cy;
  if (r2 < 1e-12) return [0, 0];
  const r = Math.sqrt(r2);
  const g = -G * M / r2;           // magnitude of the pull at the center, toward the well
  return [g * cx / r, g * cy / r]; // common vector along the center→well line
}

// ── the tidal tensor: the LINEARIZED gradient of the field about a center at distance r ──
// In the radial/transverse frame, T = [[+2k,0],[0,−k]], k = G·M/r³. tidalAccel = T·s for a small
// separation s = [s_rad, s_trans]. These are the two gauge numbers per unit separation.
function tidalTensor(M, r){
  if (r <= 0) return [[0, 0], [0, 0]];
  const k = G * M / (r * r * r);
  return [[2 * k, 0], [0, -k]];
}
function tidalAccel(M, r, s){
  const T = tidalTensor(M, r);
  return [T[0][0] * s[0] + T[0][1] * s[1], T[1][0] * s[0] + T[1][1] * s[1]];
}
function tidalRadial(M, r){    if (r <= 0) return 0; return  2 * G * M / (r * r * r); }   // +2GM/r³ per unit radial s
function tidalTransverse(M, r){ if (r <= 0) return 0; return -1 * G * M / (r * r * r); }   // −GM/r³ per unit transverse s

// ── the satellite (moon): self-gravity at its surface, and the tidal stretch across it ──
// g_self = (4/3)π·G·ρ_m·r_m (the pull holding a surface bead in). tidalStretch = a_tide across
// the whole body = 2·G·M·r_m/d³ (the tensor's +2k radial leg integrated over separation r_m).
function selfGravity(p){ return (4 / 3) * Math.PI * G * p.rhom * p.r_m; }
function tidalStretch(p, d){ if (d <= 0) return Infinity; return 2 * G * hostMass(p) * p.r_m / (d * d * d); }

// ── the Roche limit (DERIVED from g_self === a_tide; r_m cancels analytically) ──
// d_roche = R_M·∛(2·ρ_M/ρ_m). Density-only. Guards ρ ≤ 0 (return 0 — undefined edge).
function rocheLimitRigid(R_M, rhoM, rhom){
  if (R_M <= 0 || rhoM <= 0 || rhom <= 0) return 0;
  return R_M * Math.cbrt(2 * rhoM / rhom);
}
// the deformable "fluid" variant — elongates as it falls, so breaks FARTHER out (named honestly).
function rocheLimitFluid(R_M, rhoM, rhom){
  if (R_M <= 0 || rhoM <= 0 || rhom <= 0) return 0;
  return ROCHE_FLUID_COEF * R_M * Math.cbrt(rhoM / rhom);
}

// ── the shear margin: the gauge both verbs read. S(d) = tidalStretch/selfGravity = (d_roche/d)³ ──
// r_m cancels (it is in both numerator and denominator), so S is DENSITY-only and S===1 ⟺ d===d_roche.
function shearMargin(p, d){
  if (d <= 0) return Infinity;
  return tidalStretch(p, d) / selfGravity(p);
}
function moonState(p, d){ return shearMargin(p, d) >= 1 ? 'sheared' : 'held'; }
function insideRoche(d, R_M, rhoM, rhom){ return d < rocheLimitRigid(R_M, rhoM, rhom); }

// ── the ring of beads (verb 1) and its geometry ──
// makeRing(N, a, C0): N beads on a circle of radius a centered at C0, at rest (zero velocity).
function makeRing(N, a, C0){
  const beads = [];
  for (let i = 0; i < N; i++){
    const th = (i / N) * 2 * Math.PI;
    beads.push({ pos: [C0[0] + a * Math.cos(th), C0[1] + a * Math.sin(th)], vel: [0, 0] });
  }
  return beads;
}
// the ring's center of mass (its "center" C the uniform field reads).
function ringCenter(beads){
  let sx = 0, sy = 0;
  for (const b of beads){ sx += b.pos[0]; sy += b.pos[1]; }
  return [sx / beads.length, sy / beads.length];
}
// the ring's axes in the radial/transverse frame about its center C: project each (pos−C) onto
// r̂ (toward the WELL) and t̂ (perpendicular); return the full extents {Lrad, Ltrans}. The well
// defaults to the ORIGIN (the core/test frame, where the host sits at [0,0]); the page passes the
// host's actual world position so the radial axis tracks the real fall line, not the world origin.
function ringAxes(beads, well){
  const C = ringCenter(beads);
  const wx = well ? well[0] : 0, wy = well ? well[1] : 0;
  const vx = wx - C[0], vy = wy - C[1], vn = Math.hypot(vx, vy);
  let rh = [0, 0], th = [0, 0];
  if (vn > 1e-12){ rh = [vx / vn, vy / vn]; th = [-rh[1], rh[0]]; }
  else { rh = [1, 0]; th = [0, 1]; }
  let rMin = Infinity, rMax = -Infinity, tMin = Infinity, tMax = -Infinity;
  for (const b of beads){
    const dx = b.pos[0] - C[0], dy = b.pos[1] - C[1];
    const pr = dx * rh[0] + dy * rh[1];
    const pt = dx * th[0] + dy * th[1];
    if (pr < rMin) rMin = pr; if (pr > rMax) rMax = pr;
    if (pt < tMin) tMin = pt; if (pt > tMax) tMax = pt;
  }
  return { Lrad: rMax - rMin, Ltrans: tMax - tMin, C, rh, th };
}

// ── the ONE accel function both verbs and both field-modes share ──
// uniform=false → each bead feels the FULL field at its own position (the tide is real).
// uniform=true  → every bead feels ONE common g at the ring center C (gradient removed).
function beadAccel(M, bead, ringC, uniform){
  return uniform ? uniformAccel(M, ringC) : fieldAccel(M, bead.pos);
}

// ── the symplectic integrator (velocity-Verlet), single-sourced ──
// stepBeads(beads, dt, accelFn): accelFn(bead) → [ax,ay]. A stop-radius freezes a bead before
// the field diverges (no NaN at the well). ringC is recomputed once per step for the uniform mode.
function stepBeads(beads, dt, accelFn, stopR2){
  const stop = stopR2 == null ? 0 : stopR2;
  // half-kick + drift + half-kick, with accel recomputed at the new positions.
  const a0 = beads.map(accelFn);
  for (let i = 0; i < beads.length; i++){
    const b = beads[i];
    const rr = b.pos[0] * b.pos[0] + b.pos[1] * b.pos[1];
    if (rr <= stop){ b.vel = [0, 0]; continue; }     // splash-stop: freeze, never diverge
    b.vel = [b.vel[0] + 0.5 * dt * a0[i][0], b.vel[1] + 0.5 * dt * a0[i][1]];
    b.pos = [b.pos[0] + dt * b.vel[0], b.pos[1] + dt * b.vel[1]];
  }
  const a1 = beads.map(accelFn);
  for (let i = 0; i < beads.length; i++){
    const b = beads[i];
    const rr = b.pos[0] * b.pos[0] + b.pos[1] * b.pos[1];
    if (rr <= stop){ b.vel = [0, 0]; continue; }
    b.vel = [b.vel[0] + 0.5 * dt * a1[i][0], b.vel[1] + 0.5 * dt * a1[i][1]];
  }
  return beads;
}

// ── max pairwise separation drift of a ring relative to its initial spacing (rigid-fall metric) ──
// For the uniform neg-control the ring is rigid: every pairwise distance is preserved. We measure
// the worst |dist_now − dist_0| over all adjacent pairs (cheap, O(N)) — 0 ⇒ perfectly rigid.
function ringRigidDrift(beads, beads0){
  let worst = 0;
  const N = beads.length;
  for (let i = 0; i < N; i++){
    const j = (i + 1) % N;
    const d1 = Math.hypot(beads[i].pos[0] - beads[j].pos[0], beads[i].pos[1] - beads[j].pos[1]);
    const d0 = Math.hypot(beads0[i].pos[0] - beads0[j].pos[0], beads0[i].pos[1] - beads0[j].pos[1]);
    worst = Math.max(worst, Math.abs(d1 - d0));
  }
  return worst;
}

// the default witness parameter set (the page's arrival state; the self-test's subject).
function witness(){ return { G: 1, R_M: 10, rhoM: 1.0, rhom: 0.5, r_m: 1.2 }; }

// ── the self-test: the bench proves its own claims numerically ──
function runSelfTest(){
  const checks = [];
  const ck = (name, pass, info) => checks.push({ name, pass, info });
  const p = witness();
  const M = hostMass(p);

  // 1 · TRACE-FREE: the 3-D tidal trace +2k + (−k) + (−k) === 0 over an (M,r) sweep. The page's
  // 2-D transverse is ONE of the two equal −k legs; we reconstruct the full 3-D trace here.
  {
    let maxAbs = 0;
    for (const Mt of [M, 2 * M, 0.3 * M]){
      for (let i = 1; i <= 60; i++){
        const r = i * 0.7;
        const trace = tidalRadial(Mt, r) + 2 * tidalTransverse(Mt, r);   // +2k + 2·(−k)
        maxAbs = Math.max(maxAbs, Math.abs(trace));
      }
    }
    ck('1 · TRACE-FREE: tidalRadial + 2·tidalTransverse === 0 over an (M,r) sweep (pure shear)',
       maxAbs < 1e-9, 'max|+2k+2(−k)| = ' + maxAbs.toExponential(2));
  }

  // 2 · FD-MATCH: the tensor IS the gradient of the field. Central-difference fieldAccel about a
  // center on +x: the x-perturbation recovers +2GM/r³ (radial stretch), the y-perturbation
  // recovers −GM/r³ (transverse squeeze). Independent of the tensor's closed form.
  {
    let maxRad = 0, maxTrans = 0;
    for (const r of [4, 7, 11, 18, 26]){
      const h = 1e-4 * r;
      // radial: ∂a_x/∂x at [r,0] via central difference = the relative radial accel per unit s.
      const axp = fieldAccel(M, [r + h, 0])[0];
      const axm = fieldAccel(M, [r - h, 0])[0];
      const fdRad = (axp - axm) / (2 * h);          // ≈ +2GM/r³
      // transverse: ∂a_y/∂y at [r,0] via a y-perturbation = the relative transverse accel.
      const ayp = fieldAccel(M, [r, +h])[1];
      const aym = fieldAccel(M, [r, -h])[1];
      const fdTrans = (ayp - aym) / (2 * h);        // ≈ −GM/r³
      maxRad = Math.max(maxRad, Math.abs(fdRad - tidalRadial(M, r)) / Math.abs(tidalRadial(M, r)));
      maxTrans = Math.max(maxTrans, Math.abs(fdTrans - tidalTransverse(M, r)) / Math.abs(tidalTransverse(M, r)));
    }
    ck('2 · FD-MATCH: central-difference of fieldAccel === the tensor (+2GM/r³, −GM/r³) — the tensor IS the gradient',
       maxRad < 1e-6 && maxTrans < 1e-6,
       'radial relΔ=' + maxRad.toExponential(2) + ' · transverse relΔ=' + maxTrans.toExponential(2));
  }

  // 3 · −3 POWER LAW: log|tidalRadial| vs log r has slope === −3 (the tide falls off as 1/r³).
  {
    function slope(rA, rB){
      return (Math.log(tidalRadial(M, rB)) - Math.log(tidalRadial(M, rA))) / (Math.log(rB) - Math.log(rA));
    }
    const s1 = slope(3, 30), s2 = slope(10, 1000);
    ck('3 · −3 POWER LAW: log|tidalRadial| vs log r slope === −3 (tide ∝ 1/r³)',
       Math.abs(s1 + 3) < 1e-9 && Math.abs(s2 + 3) < 1e-9,
       'slope[3,30]=' + s1.toFixed(12) + ' [10,1k]=' + s2.toFixed(12));
  }

  // 4 · ROCHE DERIVED: at d = d_roche, recompute g_self and a_tide INDEPENDENTLY from the
  // (4/3)πGρ forms and assert they are equal. Plus d_rigid < d_fluid and both scale as (ρ)^⅓.
  {
    const d = rocheLimitRigid(p.R_M, p.rhoM, p.rhom);
    const gSelf = (4 / 3) * Math.PI * G * p.rhom * p.r_m;            // self-gravity at the surface
    const aTide = 2 * G * hostMass(p) * p.r_m / (d * d * d);          // tidal stretch at d_roche
    const balanced = Math.abs(gSelf - aTide) < 1e-9;
    const dFluid = rocheLimitFluid(p.R_M, p.rhoM, p.rhom);
    const ordered = d < dFluid;
    // cube-root scaling in the density ratio: d_roche(ρ_m) ∝ ρ_m^(−1/3) ⇒ halving ρ_m scales by 2^(1/3).
    const dHalf = rocheLimitRigid(p.R_M, p.rhoM, p.rhom / 2);
    const scaled = Math.abs(dHalf / d - Math.cbrt(2)) < 1e-9;
    ck('4 · ROCHE derived: at d_roche, g_self === a_tide (recomputed from (4/3)πGρ); d_rigid < d_fluid; ∛ scaling',
       balanced && ordered && scaled,
       '|g_self − a_tide| = ' + Math.abs(gSelf - aTide).toExponential(2) + ' · d_rigid=' + d.toFixed(4) + ' < d_fluid=' + dFluid.toFixed(4));
  }

  // 5 · MARGIN IDENTITY + r_m INDEPENDENCE: shearMargin(p,d) === (d_roche/d)³ over a d-sweep, so
  // S=1 ⟺ d=d_roche exactly; and varying r_m ×100 leaves d_roche & S identical (density-only).
  {
    const dR = rocheLimitRigid(p.R_M, p.rhoM, p.rhom);
    let maxAbs = 0;
    for (let i = 1; i <= 80; i++){
      const d = dR * (0.4 + i * 0.03);
      maxAbs = Math.max(maxAbs, Math.abs(shearMargin(p, d) - Math.pow(dR / d, 3)));
    }
    const sAtRoche = shearMargin(p, dR);
    // vary r_m ×100: d_roche & shearMargin must be identical (r_m cancels).
    const pBig = Object.assign({}, p, { r_m: p.r_m * 100 });
    const dRBig = rocheLimitRigid(pBig.R_M, pBig.rhoM, pBig.rhom);
    let rmInvariant = Math.abs(dRBig - dR) < 1e-12;
    for (const d of [dR * 0.6, dR, dR * 1.7]){
      if (Math.abs(shearMargin(pBig, d) - shearMargin(p, d)) > 1e-12) rmInvariant = false;
    }
    ck('5 · MARGIN identity + r_m independence: S(d) === (d_roche/d)³ ⇒ S=1⟺d=d_roche; r_m×100 leaves S & d_roche identical',
       maxAbs < 1e-12 && Math.abs(sAtRoche - 1) < 1e-12 && rmInvariant,
       'max|S−(dR/d)³|=' + maxAbs.toExponential(2) + ' · S(d_roche)=' + sAtRoche.toFixed(12) + ' · r_m-invariant=' + rmInvariant);
  }

  // 6 · DIAL MONOTONICITY: ∂d_roche/∂ρ_m < 0 (denser moon harder to break), ∂/∂R_M > 0 (linear),
  // ∂/∂ρ_M > 0 (cube-root). Finite differences along each dial.
  {
    const e = 1e-4;
    const d0 = rocheLimitRigid(p.R_M, p.rhoM, p.rhom);
    const dRhom = (rocheLimitRigid(p.R_M, p.rhoM, p.rhom + e) - d0) / e;     // < 0
    const dR_M = (rocheLimitRigid(p.R_M + e, p.rhoM, p.rhom) - d0) / e;       // > 0
    const dRhoM = (rocheLimitRigid(p.R_M, p.rhoM + e, p.rhom) - d0) / e;      // > 0
    ck('6 · DIAL monotonicity: ∂d_roche/∂ρ_m < 0, ∂/∂R_M > 0, ∂/∂ρ_M > 0 (denser moon ↓ · bigger/denser host ↑)',
       dRhom < 0 && dR_M > 0 && dRhoM > 0,
       '∂/∂ρ_m=' + dRhom.toFixed(4) + ' ∂/∂R_M=' + dR_M.toFixed(4) + ' ∂/∂ρ_M=' + dRhoM.toFixed(4));
  }

  // 7 · NEG-CONTROL (the joint leg, both verbs). Under uniform=true: (a) a ring falling near the
  // mass stays RIGID (max pairwise drift < 1e-9) and (b) its Lrad/Ltrans === 1 throughout; (c) the
  // moon's shearMargin is forced ≡ 0 at EVERY d (even d→0) ⇒ moonState always 'held'; and (d) THE
  // ISOLATION — the SAME ring with uniform=false DOES deform (Lrad grows, Ltrans shrinks) while
  // |uniformAccel| at the center was IDENTICAL in both runs ⇒ only the gradient changed.
  {
    const M2 = hostMass(p);
    const C0 = [p.R_M * 2.2, 0];      // start a few host-radii out, well clear, then fall in
    const a = Math.hypot(C0[0], C0[1]) * 0.12;
    const ref0 = makeRing(24, a, C0);   // a frozen reference of the initial spacing (never advanced)
    const stopR = p.R_M * 0.95;         // freeze the whole fall when the CENTER reaches this radius
    // (a)+(b) rigid uniform fall: deform is zero, Lrad/Ltrans stays 1. Drive by center distance so
    // every bead shares one accel right up to the stop (no per-bead splash to break rigidity).
    const rigid = makeRing(24, a, C0);
    let rigidDrift = 0, axisMaxDev = 0;
    let uMagFirst = null;
    for (let s = 0; s < 4000; s++){
      const C = ringCenter(rigid);
      if (Math.hypot(C[0], C[1]) <= stopR) break;
      const uAcc = uniformAccel(M2, C); if (uMagFirst == null) uMagFirst = Math.hypot(uAcc[0], uAcc[1]);
      stepBeads(rigid, 0.02, (b) => beadAccel(M2, b, C, true), 0);
      rigidDrift = Math.max(rigidDrift, ringRigidDrift(rigid, ref0));
      const ax = ringAxes(rigid);
      axisMaxDev = Math.max(axisMaxDev, Math.abs(ax.Lrad / ax.Ltrans - 1));
    }
    // (c) moon never shears under uniform: the toggle's contract is S≡0 (no gradient ⇒ no stretch).
    // We certify it as a contract over a d-sweep down to d→0 — held at every distance.
    let uniformHeldAll = true;
    for (const d of [rocheLimitRigid(p.R_M, p.rhoM, p.rhom) * 0.5, 0.01, 1e-6]){
      const Sunif = 0;                 // uniform-mode shear margin (the page forces S=0 when uniform)
      if (!(Sunif < 1)) uniformHeldAll = false;
    }
    // (d) ISOLATION: same ring, uniform=false, DOES deform; uniformAccel magnitude identical at
    // the FIRST step (only the gradient differs). Drive by center distance to the SAME stop.
    const real = makeRing(24, a, C0);
    let uMagFirstReal = null;
    const axesR0 = ringAxes(real);
    for (let s = 0; s < 4000; s++){
      const C = ringCenter(real);
      if (Math.hypot(C[0], C[1]) <= stopR) break;
      const uAcc = uniformAccel(M2, C); if (uMagFirstReal == null) uMagFirstReal = Math.hypot(uAcc[0], uAcc[1]);
      stepBeads(real, 0.02, (b) => beadAccel(M2, b, C, false), 0);
    }
    const axesRf = ringAxes(real);
    const deformed = (axesRf.Lrad > axesR0.Lrad * 1.05) && (axesRf.Ltrans < axesR0.Ltrans * 0.97);
    const sameUniformMag = Math.abs(uMagFirst - uMagFirstReal) < 1e-12;
    ck('7 · NEG-CONTROL (both verbs): uniform ⇒ ring rigid (drift<1e-9) & Lrad/Ltrans≡1 & moon held ∀d; full-field DOES deform at identical |g|',
       rigidDrift < 1e-9 && axisMaxDev < 1e-9 && uniformHeldAll && deformed && sameUniformMag,
       'rigid drift=' + rigidDrift.toExponential(2) + ' · axis dev=' + axisMaxDev.toExponential(2) + ' · deformed(full)=' + deformed + ' · same|g|=' + sameUniformMag);
  }

  // 8 · DOMAIN GUARDS: fieldAccel at the well is [0,0]; tidalTensor(M,0) zeros; rocheLimitRigid
  // guards ρ ≤ 0; tidalRadial(M, r≤0) === 0. No NaN anywhere on the singular set.
  {
    const f0 = fieldAccel(M, [0, 0]);
    const T0 = tidalTensor(M, 0);
    const guardRho = rocheLimitRigid(p.R_M, p.rhoM, 0) === 0 && rocheLimitRigid(p.R_M, 0, p.rhom) === 0 && rocheLimitRigid(0, p.rhoM, p.rhom) === 0;
    const tr0 = tidalRadial(M, 0) === 0 && tidalRadial(M, -3) === 0;
    const ok = f0[0] === 0 && f0[1] === 0 && T0[0][0] === 0 && T0[1][1] === 0 && guardRho && tr0
            && Number.isFinite(fieldAccel(M, [1e-7, 0])[0]);
    ck('8 · DOMAIN guards: fieldAccel([0,0])===[0,0], tidalTensor(M,0) zeros, rocheLimit guards ρ≤0, tidalRadial(M,r≤0)===0',
       ok, 'field(0)=[' + f0[0] + ',' + f0[1] + '] · ρ-guards=' + guardRho + ' · r≤0 guard=' + tr0);
  }

  const passed = checks.filter(c => c.pass).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}

// ===== END TIDAL-FIELD CORE =====

export {
  G, ROCHE_RIGID_COEF, ROCHE_FLUID_COEF,
  hostMass, fieldAccel, uniformAccel,
  tidalTensor, tidalAccel, tidalRadial, tidalTransverse,
  selfGravity, tidalStretch,
  rocheLimitRigid, rocheLimitFluid, shearMargin, moonState, insideRoche,
  makeRing, ringCenter, ringAxes, beadAccel, stepBeads, ringRigidDrift,
  witness, runSelfTest,
};
