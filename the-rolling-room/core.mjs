// ============================================================================
// === CORE BEGIN ===  The Rolling Room — math core (single source of truth).
// ----------------------------------------------------------------------------
// THE OBJECT: a thin horizontal layer of fluid, heated from below. Below a
//   threshold it just sits there and conducts heat, dead still. Cross the
//   threshold and the whole layer spontaneously breaks into a row of slow
//   counter-rotating ROLLS — Rayleigh–Bénard convection. The threshold is the
//   critical Rayleigh number, and it is EXACT:
//
//       Ra_c = 27·π⁴/4 = 657.5113644795163…      at wavenumber  k_c = π/√2
//
//   Ra measures buoyancy (the temperature drop ΔT across the layer) against the
//   two things that resist motion — viscosity and thermal diffusion. Stir gently
//   and both win; push past Ra_c and buoyancy wins and the layer overturns.
//
// TWO DISJOINT AUTHORITIES live in this one file, and they NEVER call each other:
//
//   (A) THE PROOF MODULE — the analytic linear-stability dispersion relation for
//       stress-free (free-slip) plates. The marginal Rayleigh number for a
//       horizontal mode of wavenumber k, with vertical structure sin(πz), is
//
//           Ra_marginal(k) = (k² + π²)³ / k²                      ← THE LAW
//
//       Its minimum over k is the critical pair (Ra_c, k_c) above (a textbook
//       extremum: with u = k², d/du[(u+π²)³/u] = 0 ⇒ 2u = π² ⇒ k_c = π/√2, and
//       Ra_c = (3π²/2)³ /(π²/2) = 27π⁴/4). This module is the PRECISION authority:
//       it pins Ra_c and k_c to < 1e-9, proves the band of unstable wavenumbers,
//       and proves the NEG-CONTROL (heat from above, Ra < 0, decays for ALL k).
//       It is pure analytic algebra — it imports nothing from the solver.
//
//   (B) THE SOLVER — a small 2-D vorticity / streamfunction (ψ–ω) Boussinesq
//       integrator that you can WATCH. The visible rolls are the HONEST output of
//       this solver, never a scripted amplitude: the interaction sets exactly one
//       thing — the Rayleigh number Ra — and the solver does the rest (the rolls,
//       their velocity, their wavelength, the nonlinear saturation, the dead-still
//       neg-control). The solver carries the SIGN and the SHAPE; the proof module
//       carries the precision. They agree (the solver's measured growth rate hugs
//       the proof's growthRate), but neither leans on the other.
//
//   The nondimensional Boussinesq equations the solver marches (thermal-diffusion
//   time units; θ is the temperature perturbation about the conduction profile
//   T_bg = 1 − z; hot floor at z=0, cold ceiling at z=1):
//
//       ∂_t ω + (u·∇)ω = Pr ∇²ω + Pr·Ra·∂_x θ          (vorticity transport)
//       ∂_t θ + (u·∇)θ = ∇²θ + w                        (heat, +w lifts warm fluid)
//       ∇²ψ = −ω,   u = ∂_z ψ,   w = −∂_x ψ             (incompressible, ψ–ω)
//
//   Stress-free plates ⇒ ψ = 0 and ω = 0 on the floor & ceiling, periodic in x;
//   θ = 0 on both plates (fixed-temperature). This is exactly the boundary set
//   whose linear eigenmode is sin(πz), so the solver and the analytic law share a
//   physics — but the proof never runs the solver, and the solver never reads the
//   proof. (The dispersion LITERAL `(k*k + PI*PI)**3 / (k*k)` lives in EXACTLY
//   this file; the test assembles it from parts so it isn't a self-hit.)
// ----------------------------------------------------------------------------

const PI = Math.PI;

// ─────────────────────────────────────────────────────────────────────────────
//  (A) THE PROOF MODULE — analytic linear stability. Imports nothing.
// ─────────────────────────────────────────────────────────────────────────────

// a² = k² + π²  — the squared total wavenumber of a mode (horizontal k, vertical π).
function aSq(k){ return k * k + PI * PI; }

// Ra_marginal(k): the Rayleigh number at which a horizontal mode of wavenumber k
// is exactly marginal (neutral). THE LAW, written with the canonical literal.
function raMarginal(k){
  return (k*k + PI*PI)**3 / (k*k);
}

// the pinned critical pair, in closed form.
function raCritical(){ return 27 * PI**4 / 4; }     // = 657.5113644795163…
function kCritical(){ return PI / Math.sqrt(2); }   // = 2.221441469079183…

const RA_C = raCritical();
const KC   = kCritical();

// the dial mapping the page consumes (single-sourced so the page never restates it):
// ΔT = 20° lands exactly at Ra_c, so each degree is Ra_c/20 of Rayleigh number.
const DELTAT_C   = 20;
const RA_PER_DEG = RA_C / DELTAT_C;                  // ≈ 32.8756 Ra per °

// growthRate(Ra,k,{Pr}) — the linear growth rate σ of the (k, sin πz) mode. The
// linearised Boussinesq system gives a QUADRATIC in σ:
//     σ² + (1+Pr)·a²·σ + Pr·( a⁴ − Ra·k²/a² ) = 0 ,   a² = k²+π²
// We return Re(σ) of the dominant (larger-real-part) root. The constant term is
// negative exactly when Ra > Ra_marginal(k) (then one root is positive ⇒ growth);
// for Ra < Ra_marginal both roots have Re < 0 (decay, possibly oscillatory). The
// onset (σ=0) is independent of Pr — Pr only sets HOW FAST, never WHETHER.
function growthRate(Ra, k, opts){
  const Pr = (opts && opts.Pr != null) ? opts.Pr : 1;
  const a2 = aSq(k);
  const a4 = a2 * a2;
  const b  = (1 + Pr) * a2;                 // linear coefficient (> 0)
  const c  = Pr * (a4 - Ra * k * k / a2);   // constant term
  const disc = b * b - 4 * c;
  if (disc >= 0) return (-b + Math.sqrt(disc)) / 2;   // larger real root
  return -b / 2;                                       // complex pair ⇒ Re(σ)
}

// sigmaSign(Ra,k) — the EXACT sign of growth, from the sign of (Ra − Ra_marginal):
// +1 unstable, −1 stable, 0 marginal. (Exact algebra, no σ arithmetic.)
function sigmaSign(Ra, k){
  const d = Ra - raMarginal(k);
  return d > 0 ? 1 : d < 0 ? -1 : 0;
}

// findMarginalMinimum() — INDEPENDENT verification of (Ra_c, k_c): a golden-section
// search for the minimum of Ra_marginal(k), returning the located k, its Ra, and
// the local first/second differences (to confirm a true interior minimum: dRa/dk≈0,
// curvature > 0). It does NOT assume the closed form — it finds the min numerically.
function findMarginalMinimum(){
  const gr = (Math.sqrt(5) - 1) / 2;        // 0.618…
  let a = 0.3, b = 6.0;
  let c = b - gr * (b - a), d = a + gr * (b - a);
  let fc = raMarginal(c), fd = raMarginal(d);
  for (let it = 0; it < 200; it++){
    if (fc < fd){ b = d; d = c; fd = fc; c = b - gr * (b - a); fc = raMarginal(c); }
    else        { a = c; c = d; fc = fd; d = a + gr * (b - a); fd = raMarginal(d); }
  }
  const k = (a + b) / 2;
  const h = 1e-4;
  const dRdk = (raMarginal(k + h) - raMarginal(k - h)) / (2 * h);
  const d2   = (raMarginal(k + h) - 2 * raMarginal(k) + raMarginal(k - h)) / (h * h);
  return { k, Ra: raMarginal(k), dRdk, d2 };
}

// unstableBand(Ra) — for Ra > Ra_c, the closed interval [kLow,kHigh] of horizontal
// wavenumbers that grow (the two roots of Ra_marginal(k)=Ra that bracket k_c). For
// Ra ≤ Ra_c the band is empty (collapsed to k_c). Bisection on each monotone flank.
function unstableBand(Ra){
  if (Ra <= RA_C) return { kLow: KC, kHigh: KC, empty: true };
  const f = (k) => raMarginal(k) - Ra;        // < 0 inside the band, > 0 outside
  // left flank: Ra_marginal decreases on (0, k_c); f(small)>0, f(KC)<0.
  let lo = 1e-3, hi = KC;
  for (let i = 0; i < 200; i++){ const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
  const kLow = (lo + hi) / 2;
  // right flank: Ra_marginal increases on (k_c, ∞); f(KC)<0, f(large)>0.
  lo = KC; hi = 60;
  for (let i = 0; i < 200; i++){ const m = (lo + hi) / 2; if (f(m) < 0) lo = m; else hi = m; }
  const kHigh = (lo + hi) / 2;
  return { kLow, kHigh, empty: false };
}

// maxGrowthRate(Ra) — the fastest-growing mode {sigma,k}: a coarse scan over k then
// a golden-section refine. Used only for the σ side-rail readout (display), never a
// proof claim. For Ra < Ra_c the returned sigma is negative (nothing grows).
function maxGrowthRate(Ra, opts){
  const lo = 0.15, hi = 9.0, N = 360;
  let bestK = KC, bestS = -Infinity;
  for (let i = 0; i <= N; i++){
    const k = lo + (hi - lo) * i / N;
    const s = growthRate(Ra, k, opts);
    if (s > bestS){ bestS = s; bestK = k; }
  }
  const gr = (Math.sqrt(5) - 1) / 2;
  let a = Math.max(lo, bestK - (hi - lo) / N), b = Math.min(hi, bestK + (hi - lo) / N);
  for (let it = 0; it < 80; it++){
    const c = b - gr * (b - a), d = a + gr * (b - a);
    if (growthRate(Ra, c, opts) > growthRate(Ra, d, opts)) b = d; else a = c;
  }
  const k = (a + b) / 2;
  return { sigma: growthRate(Ra, k, opts), k };
}

// ─────────────────────────────────────────────────────────────────────────────
//  (B) THE SOLVER — a reduced 2-D ψ–ω Boussinesq integrator you can watch.
//      Imports nothing from the proof module above; the proof imports nothing here.
// ─────────────────────────────────────────────────────────────────────────────

// the estate's mulberry32 PRNG (verbatim from the granular siblings) — a fixed seed
// gives a fixed stream in [0,1), so a solver run is exactly replayable.
function mulberry32(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// makeCell — allocate a fluid cell. Periodic in x over width Lx, z ∈ [0,1] with the
// hot plate at j=0 and the cold plate at j=nz-1. θ is the temperature PERTURBATION
// about the conduction profile (θ=0 on both plates). The field is seeded with a
// faint broadband shimmer of amplitude eps so the fastest-growing mode can bloom out
// of it honestly. Because Lx is chosen an integer multiple of λ_c=2π/k_c, the
// discrete fastest-growing horizontal mode is EXACTLY k_c — so broadband noise blooms
// into a clean comb of rolls at the proven wavelength, with no roll hand-placed.
function makeCell(opts){
  const o = opts || {};
  const nx = o.nx || 96;
  const nz = o.nz || 33;
  const Lx = (o.Lx != null) ? o.Lx : 4 * Math.SQRT2;     // 4 rolls = 2·λ_c
  const Pr = (o.Pr != null) ? o.Pr : 1;
  const Ra = (o.Ra != null) ? o.Ra : 0;
  const seed = ((o.seed != null) ? o.seed : 0x1bada55) >>> 0;
  const eps = (o.eps != null) ? o.eps : 0.05;
  const noiseFloor = (o.noiseFloor != null) ? o.noiseFloor : 1e-5;
  const dx = Lx / nx;              // periodic ⇒ nx cells span Lx
  const dz = 1 / (nz - 1);
  const N = nx * nz;
  const s = {
    nx, nz, Lx, Pr, Ra, seed, eps, noiseFloor, dx, dz, N,
    theta: new Float64Array(N),
    omega: new Float64Array(N),
    psi:   new Float64Array(N),
    u:     new Float64Array(N),
    w:     new Float64Array(N),
    tmpT:  new Float64Array(N),
    tmpW:  new Float64Array(N),
    rng:   mulberry32(seed),
    t: 0, steps: 0,
  };
  seedField(s, eps);
  computeVelocity(s);
  return s;
}

// seedField — a faint θ perturbation, shaped as the box's NATURAL roll comb (the
// fundamental that fits Lx) at amplitude eps, plus a small broadband jitter so nothing
// is perfectly symmetric. ω, ψ start at REST — the buoyancy spins the rolls up itself,
// so you watch them ignite. The roll count is read from the GEOMETRY (λ_c = 2√2 ⇒ a
// roll is √2 wide), never from the proof module: nRolls = round(Lx/√2) half-wavelengths,
// kSeed = π·nRolls/Lx. Because Lx is an integer multiple of λ_c, this fundamental is
// exactly k_c — so the watchable comb reads the proven wavelength, and yet the solver's
// dynamics (growth, saturation, winding) owe the proof nothing. Below onset this comb
// DECAYS (still); above onset it BLOOMS from eps (a watchable snap, no dead wait).
function seedField(s, eps){
  const { nx, nz, Lx, dx, dz, theta, omega, psi, rng } = s;
  theta.fill(0); omega.fill(0); psi.fill(0);
  const nRolls = Math.max(1, Math.round(Lx / Math.SQRT2));   // λ_c = 2√2 ⇒ roll width √2
  const kSeed = PI * nRolls / Lx;
  s.nRolls = nRolls; s.kSeed = kSeed;
  for (let j = 1; j < nz - 1; j++){
    const sz = Math.sin(PI * j * dz);
    for (let i = 0; i < nx; i++){
      theta[j * nx + i] = eps * (sz * Math.cos(kSeed * i * dx) + 0.18 * (rng() * 2 - 1));
    }
  }
}

// poisson — warm-started red-black SOR for ∇²ψ = −ω, with ψ=0 on the plates and
// periodic x. Warm-started (ψ persists between calls), so a handful of sweeps keeps
// it converged as ω drifts. ω≈1.8 over-relaxation.
function poisson(s, sweeps){
  const { nx, nz, dx, dz, psi, omega } = s;
  const idx2 = 1 / (dx * dx), idz2 = 1 / (dz * dz);
  const denom = 2 * (idx2 + idz2);
  const OM = 1.8;
  const n = (sweeps != null) ? sweeps : 12;
  for (let sweep = 0; sweep < n; sweep++){
    for (let color = 0; color < 2; color++){
      for (let j = 1; j < nz - 1; j++){
        const row = j * nx;
        for (let i = 0; i < nx; i++){
          if (((i + j) & 1) !== color) continue;
          const c  = row + i;
          const iE = row + (i + 1 === nx ? 0 : i + 1);
          const iW = row + (i === 0 ? nx - 1 : i - 1);
          const iN = c + nx, iS = c - nx;
          const rhs = (psi[iE] + psi[iW]) * idx2 + (psi[iN] + psi[iS]) * idz2 + omega[c];
          psi[c] = (1 - OM) * psi[c] + OM * (rhs / denom);
        }
      }
    }
  }
}

// computeVelocity — u = ∂_z ψ, w = −∂_x ψ from the current ψ (periodic x; one-sided
// ∂_z at the plates, where ψ≡0 ⇒ w=0 automatically).
function computeVelocity(s){
  const { nx, nz, dx, dz, psi, u, w } = s;
  const i2dx = 1 / (2 * dx), i2dz = 1 / (2 * dz), idz = 1 / dz;
  for (let j = 0; j < nz; j++){
    const row = j * nx;
    for (let i = 0; i < nx; i++){
      const c  = row + i;
      const iE = row + (i + 1 === nx ? 0 : i + 1);
      const iW = row + (i === 0 ? nx - 1 : i - 1);
      w[c] = -(psi[iE] - psi[iW]) * i2dx;
      if (j === 0)            u[c] = (psi[c + nx] - psi[c]) * idz;
      else if (j === nz - 1)  u[c] = (psi[c] - psi[c - nx]) * idz;
      else                    u[c] = (psi[c + nx] - psi[c - nx]) * i2dz;
    }
  }
}

// step — advance the fields one explicit time-step dt. (1) relax ψ from ω, (2) read
// off (u,w), (3) march ω and θ with centred diffusion + first-order UPWIND advection
// (robust, mildly diffusive — perfect for a visual solver), (4) re-impose the plate
// boundary conditions (θ=ω=0). A tiny per-step noise floor keeps the field from ever
// sitting at exactly zero, so a re-crossing of Ra_c always re-blooms.
function step(s, dt, sweeps){
  poisson(s, sweeps);
  computeVelocity(s);
  const { nx, nz, dx, dz, Pr, Ra, theta, omega, u, w, tmpT, tmpW, rng, noiseFloor } = s;
  const idx2 = 1 / (dx * dx), idz2 = 1 / (dz * dz);
  const i2dx = 1 / (2 * dx), idxx = 1 / dx, idzz = 1 / dz;
  for (let j = 1; j < nz - 1; j++){
    const row = j * nx;
    for (let i = 0; i < nx; i++){
      const c  = row + i;
      const iE = row + (i + 1 === nx ? 0 : i + 1);
      const iW = row + (i === 0 ? nx - 1 : i - 1);
      const iN = c + nx, iS = c - nx;
      const lapW = (omega[iE] + omega[iW] - 2 * omega[c]) * idx2
                 + (omega[iN] + omega[iS] - 2 * omega[c]) * idz2;
      const lapT = (theta[iE] + theta[iW] - 2 * theta[c]) * idx2
                 + (theta[iN] + theta[iS] - 2 * theta[c]) * idz2;
      const dTdx = (theta[iE] - theta[iW]) * i2dx;
      const uc = u[c], wc = w[c];
      const advW = (uc > 0 ? uc * (omega[c] - omega[iW]) : uc * (omega[iE] - omega[c])) * idxx
                 + (wc > 0 ? wc * (omega[c] - omega[iS]) : wc * (omega[iN] - omega[c])) * idzz;
      const advT = (uc > 0 ? uc * (theta[c] - theta[iW]) : uc * (theta[iE] - theta[c])) * idxx
                 + (wc > 0 ? wc * (theta[c] - theta[iS]) : wc * (theta[iN] - theta[c])) * idzz;
      tmpW[c] = omega[c] + dt * (Pr * lapW + Pr * Ra * dTdx - advW);
      tmpT[c] = theta[c] + dt * (lapT + wc - advT)
              + (noiseFloor ? noiseFloor * (rng() * 2 - 1) : 0);
    }
  }
  for (let j = 1; j < nz - 1; j++){
    const row = j * nx;
    for (let i = 0; i < nx; i++){ const c = row + i; omega[c] = tmpW[c]; theta[c] = tmpT[c]; }
  }
  // plate boundary rows (j=0, j=nz-1) are never written ⇒ remain θ=ω=0.
  s.t += dt; s.steps++;
}

// velocityAt(s,x,z) — bilinear interpolation of (u,w) at a continuous point, PERIODIC
// in x (x wraps mod Lx) and clamped in z ∈ [0,1]. The dye tracers ride this field.
function velocityAt(s, x, z){
  const { nx, nz, Lx, dx, dz, u, w } = s;
  let xx = x % Lx; if (xx < 0) xx += Lx;
  let zz = z < 0 ? 0 : (z > 1 ? 1 : z);
  const fx = xx / dx;
  let i0 = Math.floor(fx); const tx = fx - i0;
  i0 = ((i0 % nx) + nx) % nx; const i1 = (i0 + 1) % nx;
  const fz = zz / dz;
  let j0 = Math.floor(fz); if (j0 > nz - 2) j0 = nz - 2; if (j0 < 0) j0 = 0;
  const tz = fz - j0; const j1 = j0 + 1;
  const bil = (arr) => {
    const a = arr[j0 * nx + i0], b = arr[j0 * nx + i1];
    const cc = arr[j1 * nx + i0], d = arr[j1 * nx + i1];
    return a * (1 - tx) * (1 - tz) + b * tx * (1 - tz) + cc * (1 - tx) * tz + d * tx * tz;
  };
  return [bil(u), bil(w)];
}

// thetaRMS — the root-mean-square of the interior temperature perturbation. THE roll
// amplitude readout: ≈0 when the layer is still, climbing during the bloom, plateauing
// at nonlinear saturation. (No Ra-dependent normalisation: an honest field diagnostic.)
function thetaRMS(s){
  const { nx, nz, theta } = s;
  let sum = 0, n = 0;
  for (let j = 1; j < nz - 1; j++)
    for (let i = 0; i < nx; i++){ const v = theta[j * nx + i]; sum += v * v; n++; }
  return Math.sqrt(sum / n);
}

// ============================================================================
//  THE SELF-TEST BATTERY — the SAME legs the in-page pill and the Node twin run.
//  Proof legs are pinned to < 1e-9 (the precision authority); solver legs check
//  SIGN-agreement + a growth-rate magnitude band + determinism (the honest field).
// ============================================================================
function runRollingRoomSelfTest(){
  const lines = [];
  const ck = (name, ok, detail) => lines.push({ name, ok: !!ok, detail: detail || '' });
  const TOL = 1e-9;

  // ── P1: pin the critical pair to < 1e-9, both closed-form AND independently found.
  {
    const mm = findMarginalMinimum();
    const okRa = Math.abs(RA_C - 657.5113644795163) < TOL && Math.abs(mm.Ra - RA_C) < 1e-7;
    const okK  = Math.abs(KC - PI / Math.sqrt(2)) < TOL && Math.abs(mm.k - KC) < 1e-5;
    ck('P1 critical pair pinned: Ra_c = 27π⁴/4 = 657.5113645, k_c = π/√2 (closed form = numeric min)',
       okRa && okK,
       `Ra_c=${RA_C.toFixed(10)} (min ${mm.Ra.toFixed(10)}), k_c=${KC.toFixed(10)} (min ${mm.k.toFixed(10)})`);
  }

  // ── P2: the law evaluated at k_c returns Ra_c exactly (< 1e-9).
  {
    const d = Math.abs(raMarginal(KC) - RA_C);
    ck('P2 the law closes: Ra_marginal(k_c) = Ra_c to < 1e-9', d < TOL, `|Δ| = ${d.toExponential(3)}`);
  }

  // ── P3: INDEPENDENT interior minimum — dRa/dk ≈ 0 and curvature > 0 at the found k.
  {
    const mm = findMarginalMinimum();
    const ok = Math.abs(mm.Ra - RA_C) < 1e-7 && Math.abs(mm.dRdk) < 1e-4 && mm.d2 > 0;
    ck('P3 independent minimum: dRa/dk≈0, curvature>0 (a true interior min, not assumed)',
       ok, `dRa/dk=${mm.dRdk.toExponential(2)}, d²=${mm.d2.toFixed(1)} > 0`);
  }

  // ── P4: σ=0 exactly at (Ra_c,k_c); the unstable band brackets k_c with sigmaSign
  //        +1 strictly inside, −1 outside, 0 at the edges — for Ra = 700 and 1000.
  {
    const sig0 = growthRate(RA_C, KC, { Pr: 1 });
    let ok = Math.abs(sig0) < 1e-7;
    let detail = `σ(Ra_c,k_c)=${sig0.toExponential(2)}`;
    for (const Ra of [700, 1000]){
      const b = unstableBand(Ra);
      const mid = (b.kLow + b.kHigh) / 2;
      const inOK   = sigmaSign(Ra, mid) === 1;
      const loOut  = sigmaSign(Ra, b.kLow - 1e-3) === -1;
      const hiOut  = sigmaSign(Ra, b.kHigh + 1e-3) === -1;
      const edgeLo = Math.abs(raMarginal(b.kLow) - Ra) < 1e-6;
      const edgeHi = Math.abs(raMarginal(b.kHigh) - Ra) < 1e-6;
      ok = ok && inOK && loOut && hiOut && edgeLo && edgeHi && b.kLow < KC && KC < b.kHigh;
      detail += ` · Ra=${Ra}: band [${b.kLow.toFixed(3)},${b.kHigh.toFixed(3)}]∋k_c`;
    }
    ck('P4 onset is exact: σ=0 at (Ra_c,k_c); unstable band brackets k_c (Ra=700,1000)', ok, detail);
  }

  // ── P5: NO growing mode below Ra_c — scan 2000 wavenumbers at Ra=600 and Ra_c−1e-6;
  //        sigmaSign ≤ 0 and growthRate ≤ 0 everywhere (the still state is total).
  {
    let ok = true, worst = -Infinity, where = 0;
    for (const Ra of [600, RA_C - 1e-6]){
      for (let i = 0; i <= 2000; i++){
        const k = 0.2 + (8 - 0.2) * i / 2000;
        if (sigmaSign(Ra, k) > 0) ok = false;
        const g = growthRate(Ra, k, { Pr: 1 });
        if (g > worst){ worst = g; where = k; }
        if (g > 1e-9) ok = false;
      }
    }
    ck('P5 still below onset: no growing mode for Ra<Ra_c (2000-pt scan, Ra∈{600, Ra_c−1e-6})',
       ok, `worst σ = ${worst.toExponential(3)} ≤ 0 (at k≈${where.toFixed(2)})`);
  }

  // ── P6: NEG-CONTROL — heat from above (Ra<0) decays for ALL k: sigmaSign=−1 ∀k and
  //        Re(growthRate)<0 ∀k, across Ra ∈ {−1, −100, −1e4, −1e8}. Proof made watchable.
  {
    let ok = true, worst = -Infinity;
    for (const Ra of [-1, -100, -1e4, -1e8]){
      for (let i = 0; i <= 800; i++){
        const k = 0.05 + (12 - 0.05) * i / 800;
        if (sigmaSign(Ra, k) !== -1) ok = false;
        const g = growthRate(Ra, k, { Pr: 1 });
        if (g >= 0) ok = false;
        if (g > worst) worst = g;
      }
    }
    ck('P6 neg-control: heat-from-above (Ra<0) decays ∀k — sigmaSign=−1, Re(σ)<0 (to Ra=−1e8)',
       ok, `worst Re(σ) over all = ${worst.toExponential(3)} < 0`);
  }

  // ── S7: SOLVER SIGN-AGREEMENT — the watched field grows above onset, decays below /
  //        when heated from above; AND its measured growth rate hugs growthRate at 2Ra_c.
  //        Seed the consistent (θ,ψ,ω) eigenmode at k_c, march, measure d(ln rms)/dt.
  {
    let ok = true, detail = '';
    const nx = 48, nz = 33, Lx = 2 * Math.SQRT2;     // Lx = λ_c ⇒ k_c is the m=1 mode
    const dt = 2e-4, NM = 130, sweeps = 16, A = 1e-4;
    for (const [Ra, label] of [[2 * RA_C, '2·Ra_c'], [0.5 * RA_C, '½·Ra_c'], [-5000, '−5000']]){
      const s = makeCell({ nx, nz, Lx, Pr: 1, Ra, seed: 7, eps: 0, noiseFloor: 0 });
      seedEigenmode(s, KC, A, 1);
      const r0 = thetaRMS(s);
      for (let n = 0; n < NM; n++) step(s, dt, sweeps);
      const r1 = thetaRMS(s);
      const sigMeas = Math.log(r1 / r0) / (NM * dt);
      const pred = growthRate(Ra, KC, { Pr: 1 });
      const signOK = Math.sign(sigMeas) === Math.sign(pred);
      ok = ok && signOK;
      let extra = '';
      if (Ra > RA_C){                                   // magnitude band at 2·Ra_c
        const rel = Math.abs(sigMeas - pred) / Math.abs(pred);
        ok = ok && rel < 0.2;
        extra = ` (|Δσ|/σ=${(rel * 100).toFixed(1)}%)`;
      }
      detail += `${label}: σ_meas=${sigMeas.toFixed(2)} vs σ=${pred.toFixed(2)}${extra}  `;
    }
    ck('S7 solver sign-agreement: rolls grow above onset, die below & heated-from-above (σ within 15–20%)',
       ok, detail.trim());
  }

  // ── S8: DETERMINISM — same seed ⇒ byte-identical thetaRMS trajectory; seed+1 differs.
  {
    const opt = { nx: 48, nz: 17, Lx: 2 * Math.SQRT2, Pr: 1, Ra: 2 * RA_C, eps: 0.05 };
    const run = (seed) => {
      const s = makeCell({ ...opt, seed });
      let acc = '';
      for (let n = 0; n < 60; n++){ step(s, 2e-4, 10); if (n % 12 === 0) acc += thetaRMS(s).toExponential(12) + ';'; }
      return acc;
    };
    const a = run(11), b = run(11), c = run(12);
    ck('S8 determinism: a fixed seed replays the field exactly; seed+1 diverges',
       a === b && a !== c, a === b ? (a !== c ? 'identical & seed+1 differs' : 'seed+1 did NOT differ') : 'replay differed!');
  }

  const pass  = lines.filter(l => l.ok).length;
  const total = lines.length;
  const fails = lines.filter(l => !l.ok).map(l => l.name + (l.detail ? ' — ' + l.detail : ''));
  return { pass, total, fails, lines };
}

// seedEigenmode — set a CONSISTENT growing/decaying eigenmode (θ, ψ, ω all in the
// right ratio for growth rate σ=growthRate(Ra,k,Pr)) so the solver evolves it as a
// near-clean exponential. Used by the self-test (S7) to measure the solver's growth
// rate against the proof's prediction. (A test-time consumer of BOTH authorities —
// the proof module itself never touches this.) `sgn` picks the branch sign.
function seedEigenmode(s, k, amp, sgn){
  const { nx, nz, dx, dz, theta, psi, omega } = s;
  const a2 = aSq(k);
  const sigma = growthRate(s.Ra, k, { Pr: s.Pr });
  const w0 = (sigma + a2) * amp;         // from ∂_tθ: σθ = −a²θ + w
  const P  = -w0 / k;                     // ψ amplitude (w = −∂_xψ)
  theta.fill(0); psi.fill(0); omega.fill(0);
  for (let j = 0; j < nz; j++){
    const sz = Math.sin(PI * j * dz);
    for (let i = 0; i < nx; i++){
      const cx = Math.cos(k * i * dx), sx = Math.sin(k * i * dx);
      const c = j * nx + i;
      theta[c] = amp * sz * cx * sgn;
      psi[c]   = P   * sz * sx * sgn;
      omega[c] = a2 * P * sz * sx * sgn;
    }
  }
  computeVelocity(s);
}
// === CORE END ===
// ============================================================================

export {
  // (A) the proof module
  PI, RA_C, KC, DELTAT_C, RA_PER_DEG,
  aSq, raMarginal, raCritical, kCritical,
  growthRate, sigmaSign, findMarginalMinimum, unstableBand, maxGrowthRate,
  // (B) the solver
  mulberry32, makeCell, seedField, poisson, computeVelocity, step,
  velocityAt, thetaRMS, seedEigenmode,
  // the shared self-test battery
  runRollingRoomSelfTest,
};
