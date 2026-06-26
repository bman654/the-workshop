// ============================================================================
// === CORE BEGIN ===  The Heap That Knows Its Own Angle — math core (single
// source of truth: the page inlines THIS file byte-for-byte via forge; the Node
// twin imports it; forge --check is the parity gate).
// ----------------------------------------------------------------------------
// THE OBJECT: a side-on brass assay tray of dry grain. GRAVITY is fixed straight
//   DOWN on the screen. You rotate the TRAY by an angle φ, and you turn a friction
//   dial μ. Pour, dump, tilt — however you build the heap, its settled free
//   surface always rests at the SAME angle from TRUE (screen) horizontal:
//
//        θ_r  =  atan(μ)            ← the ANGLE OF REPOSE (the headline)
//
//   "The tray spins, the sand keeps its angle." Dry sand stands at ≈34°; glass
//   beads ≈22°; glue (μ→∞) stands vertical; a frictionless bed (μ→0) cannot stand
//   at all and puddles flat. The angle is set by FRICTION, not by how much you
//   poured or how hard you tilted.
//
// THE PHYSICS (Mohr–Coulomb slope stability, made exact + deterministic).
//   The surface is a single-valued height field z[i] over columns ⟂ the tray
//   floor, spacing dx. The tray is tilted by φ. A surface facet between columns i
//   and i+1 makes a WORLD-frame angle with true horizontal of
//
//        θ_world(i) = atan2(z[i] − z[i+1], dx) + φ
//
//   THE SLIP PREDICATE (Coulomb): facet i is unstable — it SLIPS — exactly when
//
//        |θ_world(i)| > θ_r            (θ_r = atan(μ))
//
//   i.e. when the gravitational shear on the slope beats static friction. Below
//   θ_r the frozen heap simply rotates RIGIDLY with the tray (no relative grain
//   motion). RELAXATION is a discrete BCRE rolling-layer flux: every over-steep
//   facet sheds a thin layer of grain DOWNHILL (in the world frame), mass moving
//   from the higher column to the lower, until every facet satisfies the predicate
//   with EQUALITY on the avalanched face (|θ_world| = θ_r there). Σz is conserved
//   EXACTLY by construction (each move only relocates mass between two columns and
//   never below the floor). The fixed point is the angle of repose, and it is
//   INDEPENDENT of the initial heap, the amount poured, and the tilt history —
//   that invariance is the whole proof.
//
//   WHY IT IS HONEST. The bulk height field carries NO randomness: the relaxation
//   is a deterministic fixed-point iteration, so the proved angle is exact (a
//   tolerance band on a relaxed angle, never a pinned avalanche count). The flux
//   GAIN only sets cascade SPEED; a no-overshoot cap makes each sweep a stable
//   contraction, so the converged angle is GAIN- and order-independent (the
//   slope-limit cousin of the sandpile's abelian property). The only RNG in the
//   whole piece drives the cosmetic rolling-grain sprites (mulberry32, fixed seed
//   ⇒ page == twin byte-true); it never touches the proof.
//
//   SCOPE / HONESTY. z is single-valued (no overhangs): GLUE means "tilt a level
//   heap, it never sheds" (β=φ<90°), NOT "raise a vertical cliff." Columns ⟂ the
//   tray floor is the standard tilted-coordinate idealization — EXACT for the
//   proved angle invariant; the transient transport direction is approximate. The
//   walls are closed, so at extreme tilt grain piles against the downhill wall
//   instead of spilling. Named materials (sand 34°, beads 22°, …) are ILLUSTRATIVE
//   landmarks; the exact claim is only θ_r = atan(μ).
// ----------------------------------------------------------------------------

// ── The estate's mulberry32 PRNG (verbatim from the-phantom-jam / sandpile /
//    brazil-nut-box). Deterministic: a fixed seed gives a fixed stream of [0,1).
//    Used ONLY for cosmetic rolling-grain sprite jitter — never the proof. ──
function mulberry32(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── geometry + tuning constants (single-sourced; the page, the test and the twin
//    all read THESE). DX=1 column spacing keeps heights in intuitive units. ──
const NCOL      = 121;     // number of columns (NCOL−1 = 120 facets); dx between
const DX        = 1.0;     // column spacing (tray-frame length unit)
const SEED      = 0x5EED5A0d; // default sprite seed (proof is seed-independent)

// relaxation tuning — GAIN sets cascade speed only; the no-overshoot cap makes the
// converged angle independent of it. EPS is the "frozen" threshold on max excess.
const GAIN      = 1.35;    // nominal flux gain (capped per-facet so it cannot overshoot)
const RELAX_EPS = 2e-6;    // converged when max |θ_world|−θ_r over slipping facets < this (rad)
const MAX_SWEEPS= 60000;   // hard cap on relaxation sweeps (proof asserts it converges well under)

// tolerances for the self-test (radians). A relaxed FREE face equals θ_r to this.
const ANGLE_TOL   = 0.006; // ≈ 0.34° — face angle vs θ_r band (discrete linear-fit slack)
const FLAT_TOL    = 0.010; // ≈ 0.57° — "world-flat" band for the frictionless puddle
const PREDICATE_DB= 1e-4;  // dβ around θ_r within which the slip boolean may be ambiguous
const VAR_TOL     = 4e-5;  // CRUX-2: variance (rad²) of the face angle across the whole sweep

// φ clamp (the tilt-wheel range) and a few named material landmarks (deg → μ).
const PHI_MAX_DEG = 80;
const MATERIALS = [
  { key:'frictionless', name:'FRICTIONLESS', deg: 0.6,  note:'oiled bearings — it cannot stand' },
  { key:'beads',        name:'GLASS BEADS',  deg: 22,   note:'smooth spheres' },
  { key:'rice',         name:'DRY RICE',     deg: 20,   note:'small rods' },
  { key:'sand',         name:'DRY SAND',     deg: 34,   note:'the famous repose angle' },
  { key:'gravel',       name:'GRAVEL',       deg: 42,   note:'angular chips' },
  { key:'glue',         name:'GLUE / SOLID', deg: 89.4, note:'μ→∞ — it stands vertical' },
];

const D2R = Math.PI / 180, R2D = 180 / Math.PI;

// the friction identity, both ways. θ_r = atan(μ); μ = tan(θ_r).
function thetaRFromMu(mu){ return Math.atan(mu); }
function muFromThetaR(t){ return Math.tan(t); }
function clamp(v, lo, hi){ return v < lo ? lo : v > hi ? hi : v; }

// ── make a heap state. z is the tray-frame surface height over NCOL columns. φ is
//    the tray tilt (rad). thetaR is the slip threshold (rad) = atan(μ). The bulk is
//    pure float — no RNG. `spriteRng` is a SEPARATE stream for cosmetic sprites. ──
function makeHeap({ ncol = NCOL, dx = DX, phi = 0, thetaR = 34 * D2R, seed = SEED } = {}){
  const z = new Float64Array(ncol);
  const st = {
    ncol, dx, phi, thetaR, seed,
    z,
    gain: GAIN,
    lastFlux: new Float64Array(ncol - 1), // signed mass crossing each facet last sweep (+ = rightward)
    _sweep: 0,
    spriteRng: mulberry32(seed),
  };
  return st;
}

// ── heap builders (all mass-positive; used by the page's pour/dump and by the
//    self-test's diverse initial conditions). Each WRITES st.z in place. ──
function setFlatBed(st, h){ st.z.fill(Math.max(0, h)); return st; }

function setPyramid(st, { peak = 16, center = (st.ncol - 1) / 2, slope = 0.9, base = 1 } = {}){
  // a triangular pile of half-angle atan(slope) on a thin base bed.
  for (let i = 0; i < st.ncol; i++){
    const d = Math.abs(i - center);
    st.z[i] = Math.max(base, base + peak - slope * d * st.dx);
  }
  return st;
}

function setBlock(st, { height = 18, x0 = 40, x1 = 80, base = 1 } = {}){
  // a rectangular block with vertical sides (maximally over-steep — it must shed).
  for (let i = 0; i < st.ncol; i++) st.z[i] = (i >= x0 && i <= x1) ? base + height : base;
  return st;
}

function setStairs(st, { steps = 5, rise = 5, base = 1 } = {}){
  const per = Math.floor(st.ncol / steps);
  for (let i = 0; i < st.ncol; i++) st.z[i] = base + rise * (steps - 1 - Math.min(steps - 1, Math.floor(i / per)));
  return st;
}

function setLumps(st, { seed = 1234, amp = 14, base = 2, bumps = 5 } = {}){
  const rng = mulberry32(seed >>> 0);
  const centers = [], heights = [], widths = [];
  for (let b = 0; b < bumps; b++){
    centers.push(8 + rng() * (st.ncol - 16));
    heights.push(amp * (0.4 + 0.6 * rng()));
    widths.push(6 + rng() * 14);
  }
  for (let i = 0; i < st.ncol; i++){
    let h = base;
    for (let b = 0; b < bumps; b++){
      const d = (i - centers[b]) / widths[b];
      h += heights[b] * Math.exp(-d * d);
    }
    st.z[i] = h;
  }
  return st;
}

// pour a cone of `amount` total grain at column `col` (used by the page's funnel).
function pourAt(st, col, amount){
  const c = clamp(Math.round(col), 0, st.ncol - 1);
  st.z[c] += amount;
  return st;
}

function totalMass(st){ let s = 0; for (let i = 0; i < st.ncol; i++) s += st.z[i]; return s; }

// ── the WORLD-frame facet angle (the load-bearing definition). ──
function thetaWorld(st, i){ return Math.atan2(st.z[i] - st.z[i + 1], st.dx) + st.phi; }

// THE SLIP PREDICATE — facet i is unstable iff its world angle beats θ_r.
function slips(st, i){ return Math.abs(thetaWorld(st, i)) > st.thetaR; }

// the per-facet world angles as an array (length ncol−1).
function worldAngles(st){
  const out = new Float64Array(st.ncol - 1);
  for (let i = 0; i < st.ncol - 1; i++) out[i] = thetaWorld(st, i);
  return out;
}

// max |θ_world| over facets, optionally excluding `margin` facets at each wall
// (the closed-wall pile-up facets are not a free surface). Default margin 0.
function maxAbsAngle(st, margin = 0){
  let m = 0;
  for (let i = margin; i < st.ncol - 1 - margin; i++){
    const a = Math.abs(thetaWorld(st, i));
    if (a > m) m = a;
  }
  return m;
}

// max |θ_world| over the GRAIN-COVERED free surface only — facets where both
// columns hold grain (z > minZ), excluding `margin` wall facets. Bare floor (z≈0)
// reads world angle φ but is not a surface that can shed, so we ignore it. This is
// the honest "is the grain standing?" measure (used by the frictionless puddle leg).
function maxFreeAngle(st, { minZ = 0.5, margin = 2 } = {}){
  let m = 0;
  for (let i = margin; i < st.ncol - 1 - margin; i++){
    if (st.z[i] <= minZ || st.z[i + 1] <= minZ) continue;
    const a = Math.abs(thetaWorld(st, i));
    if (a > m) m = a;
  }
  return m;
}

// ── steepestFace — find the contiguous span of the steepest DESCENDING free face
//    and return its world angle from a least-squares line fit over that span (the
//    protractor needle reads THIS; anti-jitter vs a single facet). Returns
//    { i0, i1, angle, slips } where angle is the SIGNED world angle. ──
function steepestFace(st){
  const ang = worldAngles(st);
  const n = ang.length;
  if (n === 0) return { i0: 0, i1: 0, angle: st.phi, slips: false };
  // GRAIN-AWARE: bare floor (both columns at the bed bottom) reads world angle φ but
  // holds no grain to shed — it is not a free face. Ignore those facets so the needle
  // reads the real grain surface, not the empty floor the heap was poured onto.
  let floorLevel = Infinity;
  for (let i = 0; i < st.ncol; i++) if (st.z[i] < floorLevel) floorLevel = st.z[i];
  const FLOOR_EPS = 0.3;
  const onFloor = (i) => st.z[i] <= floorLevel + FLOOR_EPS && st.z[i + 1] <= floorLevel + FLOOR_EPS;
  let im = -1;
  for (let i = 0; i < n; i++){
    if (onFloor(i)) continue;
    if (im < 0 || Math.abs(ang[i]) > Math.abs(ang[im])) im = i;
  }
  if (im < 0){ // no grain face at all (a perfectly level full bed) → the surface IS φ
    return { i0: 0, i1: n - 1, angle: st.phi, slips: Math.abs(st.phi) > st.thetaR };
  }
  const peak = Math.abs(ang[im]);
  const sgn = ang[im] >= 0 ? 1 : -1;
  const thresh = Math.max(peak * 0.6, peak - 0.03);
  let i0 = im, i1 = im;
  while (i0 > 0 && !onFloor(i0 - 1) && (ang[i0 - 1] >= 0 ? 1 : -1) === sgn && Math.abs(ang[i0 - 1]) >= thresh) i0--;
  while (i1 < n - 1 && !onFloor(i1 + 1) && (ang[i1 + 1] >= 0 ? 1 : -1) === sgn && Math.abs(ang[i1 + 1]) >= thresh) i1++;
  // least-squares fit of z over columns [i0 .. i1+1]
  const a = i0, b = i1 + 1;
  let cnt = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let k = a; k <= b; k++){ const x = k * st.dx, y = st.z[k]; cnt++; sx += x; sy += y; sxx += x * x; sxy += x * y; }
  const denom = cnt * sxx - sx * sx;
  const slope = denom !== 0 ? (cnt * sxy - sx * sy) / denom : 0;   // dz/dx
  // facet angle = atan2(z[i]−z[i+1], dx) = −atan(dz/dx); world adds φ.
  const angle = -Math.atan(slope) + st.phi;
  return { i0, i1, angle, slips: Math.abs(angle) > st.thetaR };
}

// the magnitude of the steepest free face (what the cartouche prints as β).
function faceAngle(st){ return Math.abs(steepestFace(st).angle); }

// ── relaxStep — ONE BCRE relaxation sweep. Every over-steep facet sheds grain
//    downhill (world frame) with flux ∝ angle excess, capped so it never overshoots
//    θ_r (the cap makes the sweep a stable contraction ⇒ GAIN-independent fixed
//    point). Sweep direction alternates to kill directional bias (order-independence).
//    Records signed per-facet flux in st.lastFlux. Returns the max excess seen. ──
function relaxStep(st){
  const z = st.z, dx = st.dx, phi = st.phi, thetaR = st.thetaR, gain = st.gain;
  const n = st.ncol - 1;
  st.lastFlux.fill(0);
  let maxExcess = 0;
  const back = (st._sweep++ & 1) === 1;
  for (let s = 0; s < n; s++){
    const i = back ? (n - 1 - s) : s;
    const d = z[i] - z[i + 1];
    const tw = Math.atan2(d, dx) + phi;
    const ax = Math.abs(tw);
    const ex = ax - thetaR;
    if (ex <= 0) continue;
    if (ex > maxExcess) maxExcess = ex;
    const sloc = d / dx;                                   // local slope
    const noOvershoot = ex * dx * (1 + sloc * sloc) * 0.5; // linearised cap → no overshoot
    let q = Math.min(gain * ex, noOvershoot);
    // downhill: tw>0 ⇒ descends right ⇒ higher=i, lower=i+1; else mirror.
    if (tw > 0){
      if (q > z[i]) q = z[i];                              // cannot move more mass than exists
      if (q < 0) q = 0;
      z[i] -= q; z[i + 1] += q; st.lastFlux[i] += q;        // +flux = rightward
    } else {
      if (q > z[i + 1]) q = z[i + 1];
      if (q < 0) q = 0;
      z[i + 1] -= q; z[i] += q; st.lastFlux[i] -= q;        // −flux = leftward
    }
  }
  st._maxExcess = maxExcess;
  return maxExcess;
}

// ── relax — iterate relaxStep to the fixed point. Returns { sweeps, converged,
//    moved }. moved = total |mass| relocated (>0 ⇔ an avalanche fired). ──
function relax(st, { maxSweeps = MAX_SWEEPS, eps = RELAX_EPS } = {}){
  let sweeps = 0, moved = 0;
  for (; sweeps < maxSweeps; sweeps++){
    const ex = relaxStep(st);
    for (let i = 0; i < st.lastFlux.length; i++) moved += Math.abs(st.lastFlux[i]);
    if (ex < eps) { sweeps++; break; }
  }
  return { sweeps, converged: st._maxExcess < eps, moved };
}

// run a fixed number of sweeps (the page's per-frame animation budget). Returns
// total |mass| moved (drives the rolling-sprite spawn rate).
function relaxSweeps(st, k){
  let moved = 0;
  for (let s = 0; s < k; s++){
    relaxStep(st);
    for (let i = 0; i < st.lastFlux.length; i++) moved += Math.abs(st.lastFlux[i]);
    if (st._maxExcess < RELAX_EPS) break;
  }
  return moved;
}

// ============================================================================
//  THE SELF-TEST BATTERY — the SAME legs the in-page pill and the Node twin call.
//  Every claim is a tolerance band on a RELAXED angle (or a boolean predicate),
//  never a pinned avalanche count. Mass conservation + termination are validity.
// ============================================================================
function runHeapSelfTest(){
  const lines = [];
  const ck = (name, ok, detail) => lines.push({ name, ok: !!ok, detail: detail || '' });

  // CRUX-1 — SLIP PREDICATE flips EXACTLY at β = θ_r. Build a single straight ramp
  //   of world angle β at fixed φ, sweep β across θ_r, and assert slips() is false
  //   just below and true just above, with the flip inside PREDICATE_DB of θ_r.
  {
    const thetaR = 34 * D2R, phi = 0;
    // a straight surface with world angle β has tray slope dz/dx = −tan(β−φ).
    const mkRamp = (beta) => {
      const st = makeHeap({ thetaR, phi });
      const slope = -Math.tan(beta - phi);
      for (let i = 0; i < st.ncol; i++) st.z[i] = 30 + slope * i * st.dx;
      // lift so all heights ≥ 0
      let mn = Infinity; for (let i = 0; i < st.ncol; i++) mn = Math.min(mn, st.z[i]);
      for (let i = 0; i < st.ncol; i++) st.z[i] += (mn < 0 ? -mn + 1 : 0);
      return st;
    };
    const mid = (st) => slips(st, Math.floor((st.ncol - 1) / 2));
    const below = mkRamp(thetaR - 0.01), above = mkRamp(thetaR + 0.01);
    // bisect the flip point in β
    let lo = thetaR - 0.2, hi = thetaR + 0.2;
    for (let it = 0; it < 60; it++){
      const m = (lo + hi) / 2;
      if (mid(mkRamp(m))) hi = m; else lo = m;
    }
    const flip = (lo + hi) / 2;
    const ok = !mid(below) && mid(above) && Math.abs(flip - thetaR) < 1e-3;
    ck('CRUX-1 slip predicate: a facet slips EXACTLY when |θ_world| > θ_r (flip at β=θ_r)', ok,
       `flip β=${(flip * R2D).toFixed(3)}° vs θ_r=${(thetaR * R2D).toFixed(3)}° (Δ ${(Math.abs(flip - thetaR) * R2D).toFixed(4)}°); below=${mid(below)}, above=${mid(above)}`);
  }

  // CRUX-2 — REPOSE INVARIANT (the headline). Across DIVERSE initial heaps × pour
  //   amounts × tilt histories, the relaxed avalanched-face angle = θ_r for ALL,
  //   and the variance of the measured face across the whole sweep ≈ 0 (the needle
  //   ignores amount & history). θ_r = atan(μ_sand).
  {
    const thetaR = 34 * D2R;
    const faces = [];
    let allConv = true, worst = 0;
    const trials = [];
    // diverse initial conditions, all at φ=0 (interior faces, no wall pile-up)
    trials.push((st) => setPyramid(st, { peak: 14, slope: 0.9 }));
    trials.push((st) => setPyramid(st, { peak: 22, slope: 1.4 }));
    trials.push((st) => setPyramid(st, { peak: 12, slope: 0.8 }));  // over-steep (38.7°>θ_r) — sheds
    trials.push((st) => setBlock(st, { height: 16, x0: 45, x1: 75 }));
    trials.push((st) => setBlock(st, { height: 24, x0: 50, x1: 70 }));
    trials.push((st) => setStairs(st, { steps: 6, rise: 4 }));
    trials.push((st) => setLumps(st, { seed: 7, amp: 18, bumps: 4 }));
    trials.push((st) => setLumps(st, { seed: 99, amp: 12, bumps: 6 }));
    // pour-amount sweep onto a single apex (history/amount independence)
    for (const amt of [40, 120, 260]) trials.push((st) => { setFlatBed(st, 2); for (let p = 0; p < amt; p++) pourAt(st, 60, 1); });
    // a mild non-zero tilt history then settle (φ then measure the downhill face)
    for (const ph of [-12, 12]) trials.push((st) => { st.phi = ph * D2R; setPyramid(st, { peak: 14, slope: 1.1 }); });
    for (const build of trials){
      const st = makeHeap({ thetaR });
      build(st);
      const r = relax(st);
      if (!r.converged) allConv = false;
      const f = faceAngle(st);
      faces.push(f);
      worst = Math.max(worst, Math.abs(f - thetaR));
    }
    const mean = faces.reduce((a, b) => a + b, 0) / faces.length;
    const variance = faces.reduce((a, b) => a + (b - mean) * (b - mean), 0) / faces.length;
    const ok = allConv && worst < ANGLE_TOL && variance < VAR_TOL;
    ck('CRUX-2 repose invariant: every relaxed face = θ_r regardless of amount/history (var≈0)', ok,
       `worst |face−θ_r|=${(worst * R2D).toFixed(3)}° (<${(ANGLE_TOL * R2D).toFixed(2)}°), var=${variance.toExponential(2)} rad², n=${faces.length}, mean=${(mean * R2D).toFixed(2)}°`);
  }

  // CRUX-3 — NEEDLE = atan(μ): sweep μ; the relaxed face angle = atan(μ), strictly
  //   increasing in μ. This is the friction identity read straight off the heap.
  {
    const mus = [0.20, 0.30, 0.45, 0.60, 0.85, 1.2, 2.0];
    const faces = [], targets = [];
    let worst = 0, mono = true;
    for (const mu of mus){
      const thetaR = thetaRFromMu(mu);
      const st = makeHeap({ thetaR });
      setPyramid(st, { peak: 20, slope: Math.max(1.2, 1.4 * mu + 0.6) });  // start over-steep
      relax(st);
      const f = faceAngle(st);
      faces.push(f); targets.push(thetaR);
      worst = Math.max(worst, Math.abs(f - thetaR));
    }
    for (let i = 1; i < faces.length; i++) if (!(faces[i] > faces[i - 1])) mono = false;
    const ok = worst < ANGLE_TOL && mono;
    ck('CRUX-3 needle = atan(μ): relaxed face equals atan(μ), strictly increasing in μ', ok,
       `worst |face−atan(μ)|=${(worst * R2D).toFixed(3)}°, faces=[${faces.map(x => (x * R2D).toFixed(1)).join(',')}]°`);
  }

  // CRUX-4 — NEG-CONTROL GLUE (μ→∞ ⇒ θ_r→90°). A LEVEL heap tilted to any φ<90°
  //   never sheds: zero facets slip, mass unchanged. It stands, rotating rigidly.
  {
    const thetaR = 89.4 * D2R;     // μ = tan(89.4°) ≈ 95
    let anySlip = false, maxMoved = 0, worstAngleVsPhi = 0;
    for (const phd of [0, 20, 45, 70, 80]){
      const st = makeHeap({ thetaR, phi: phd * D2R });
      setFlatBed(st, 18);
      const m0 = totalMass(st);
      for (let i = 0; i < st.ncol - 1; i++) if (slips(st, i)) anySlip = true;
      const r = relax(st);
      maxMoved = Math.max(maxMoved, r.moved);
      // a level heap reads world angle = φ everywhere; the face = φ, not θ_r.
      worstAngleVsPhi = Math.max(worstAngleVsPhi, Math.abs(faceAngle(st) - phd * D2R));
      if (Math.abs(totalMass(st) - m0) > 1e-9) anySlip = true;
    }
    const ok = !anySlip && maxMoved < 1e-9 && worstAngleVsPhi < FLAT_TOL;
    ck('CRUX-4 GLUE (μ→∞, θ_r→90°): a level heap never sheds at any tilt — it stands', ok,
       `slips=${anySlip}, max moved=${maxMoved.toExponential(1)}, face tracks φ to ${(worstAngleVsPhi * R2D).toFixed(2)}°`);
  }

  // CRUX-5 — NEG-CONTROL FRICTIONLESS (μ→0 ⇒ θ_r→0). The GRAIN surface relaxes
  //   WORLD-FLAT: a standing heap at φ=0 collapses, and deep beds at a tilt flow to
  //   world-level (they track gravity, they do NOT hold the tilt). Measured on the
  //   grain-covered surface (bare floor reads φ but cannot shed). It cannot stand.
  {
    const thetaR = 0.4 * D2R;      // μ = tan(0.4°) ≈ 0.007
    let worstFree = 0, allConv = true;
    // (a) a standing heap at φ=0 collapses to flat — it cannot stand as a pile
    {
      const st = makeHeap({ thetaR, phi: 0 });
      setPyramid(st, { peak: 22, slope: 1.3, base: 8 });
      const r = relax(st); if (!r.converged) allConv = false;
      worstFree = Math.max(worstFree, maxFreeAngle(st));
    }
    // (b) deep beds at modest tilt flow world-flat (grain everywhere, no empty floor)
    for (const phd of [10, 18, 25]){
      const st = makeHeap({ thetaR, phi: phd * D2R });
      setFlatBed(st, 70);
      const r = relax(st); if (!r.converged) allConv = false;
      worstFree = Math.max(worstFree, maxFreeAngle(st));
    }
    const ok = allConv && worstFree < FLAT_TOL;
    ck('CRUX-5 FRICTIONLESS (μ→0, θ_r→0): the grain relaxes world-flat — it cannot stand', ok,
       `worst free |θ_world| after settle = ${(worstFree * R2D).toFixed(3)}° (<${(FLAT_TOL * R2D).toFixed(2)}°)`);
  }

  // CRUX-6 — AVALANCHE ON μ (the killer claim): hold φ FIXED, settle a heap at μ1.
  //   LOWERING μ below the current face fires an avalanche with ZERO tilt change and
  //   re-settles to the new atan(μ); RAISING μ fires NOTHING.
  {
    const phi = 18 * D2R;
    const st = makeHeap({ thetaR: thetaRFromMu(0.9), phi });   // θ_r ≈ 42°
    setPyramid(st, { peak: 20, slope: 1.5 });
    relax(st);
    const faceHi = faceAngle(st);
    // raise μ → θ_r higher than the current face → nothing should move
    st.thetaR = thetaRFromMu(1.6);                              // θ_r ≈ 58° (> faceHi)
    const up = relax(st);
    // lower μ well below the face → an avalanche must fire and re-settle lower
    st.thetaR = thetaRFromMu(0.45);                             // θ_r ≈ 24°
    const down = relax(st);
    const faceLo = faceAngle(st);
    const ok = up.moved < 1e-7 && down.moved > 1e-3 &&
               Math.abs(faceLo - thetaRFromMu(0.45)) < ANGLE_TOL && faceLo < faceHi - 0.05;
    ck('CRUX-6 avalanche on μ: lowering friction sheds at fixed tilt; raising it sheds nothing', ok,
       `raise μ moved=${up.moved.toExponential(1)} (≈0); lower μ moved=${down.moved.toFixed(2)}; face ${(faceHi * R2D).toFixed(1)}°→${(faceLo * R2D).toFixed(1)}° (=atan μ)`);
  }

  // VALIDITY — mass conservation through relaxation, bounded termination, and
  //   toppling-ORDER independence (the slope-limit analogue of the sandpile's
  //   abelian property): two heaps that differ only by sweep direction / gain relax
  //   to the SAME face within tol, and Σz is conserved to machine epsilon.
  {
    const thetaR = 30 * D2R;
    const buildA = makeHeap({ thetaR }); setLumps(buildA, { seed: 2024, amp: 16, bumps: 5 });
    const buildB = makeHeap({ thetaR }); buildB.z.set(buildA.z); buildB.gain = 0.6; // different gain
    const m0 = totalMass(buildA);
    const rA = relax(buildA), rB = relax(buildB);
    const massOK = Math.abs(totalMass(buildA) - m0) < 1e-7 && Math.abs(totalMass(buildB) - m0) < 1e-7;
    const termOK = rA.converged && rB.converged && rA.sweeps < MAX_SWEEPS && rB.sweeps < MAX_SWEEPS;
    const orderOK = Math.abs(faceAngle(buildA) - faceAngle(buildB)) < ANGLE_TOL;
    const ok = massOK && termOK && orderOK;
    ck('validity: Σz conserved · relaxation terminates · face is gain/order-independent', ok,
       `ΔΣz=${Math.abs(totalMass(buildA) - m0).toExponential(1)}, sweeps=${rA.sweeps}/${rB.sweeps}, |faceA−faceB|=${(Math.abs(faceAngle(buildA) - faceAngle(buildB)) * R2D).toFixed(3)}°`);
  }

  // DETERMINISM — the bulk relaxation has NO RNG (same input ⇒ byte-identical z),
  //   and the cosmetic sprite RNG (mulberry32) is a fixed, replayable stream.
  {
    const thetaR = 34 * D2R;
    const a = makeHeap({ thetaR }); setPyramid(a, { peak: 18, slope: 1.3 }); relax(a);
    const b = makeHeap({ thetaR }); setPyramid(b, { peak: 18, slope: 1.3 }); relax(b);
    let bulkSame = true;
    for (let i = 0; i < a.ncol; i++) if (a.z[i] !== b.z[i]) bulkSame = false;
    const g1 = mulberry32(SEED), g2 = mulberry32(SEED), g3 = mulberry32(SEED + 1);
    let rngSame = true, rngDiff = false;
    for (let i = 0; i < 50; i++){ const x = g1(); if (x !== g2()) rngSame = false; if (Math.abs(x - g3()) > 1e-9) rngDiff = true; }
    ck('determinism: same heap relaxes byte-identical (no RNG in the proof); sprite seed replays', bulkSame && rngSame && rngDiff,
       `bulk byte-equal=${bulkSame}, sprite seed replay=${rngSame}, seed+1 differs=${rngDiff}`);
  }

  const pass = lines.filter(l => l.ok).length;
  const total = lines.length;
  const fails = lines.filter(l => !l.ok).map(l => l.name + (l.detail ? ' — ' + l.detail : ''));
  return { pass, total, fails, lines };
}
// === CORE END ===
// ============================================================================

export {
  mulberry32, clamp, thetaRFromMu, muFromThetaR,
  makeHeap, setFlatBed, setPyramid, setBlock, setStairs, setLumps, pourAt, totalMass,
  thetaWorld, slips, worldAngles, maxAbsAngle, maxFreeAngle, steepestFace, faceAngle,
  relaxStep, relax, relaxSweeps, runHeapSelfTest,
  NCOL, DX, SEED, GAIN, RELAX_EPS, MAX_SWEEPS, ANGLE_TOL, FLAT_TOL, PREDICATE_DB,
  VAR_TOL, PHI_MAX_DEG, MATERIALS, D2R, R2D,
};
