// ── THE SWING-SHIP — physics authority for a PARAMETRIC pendulum: PUMP THE LENGTH.
//    This block is the SOLE AUTHORITY; a Node twin (core.test.mjs) re-extracts it
//    byte-for-byte between sentinels and the in-page chip calls the SAME runSelfTest().
//    The renderer swings a real variable-length pendulum FROM this authority — the arc
//    you make by pumping IS the readout, never a plotted curve. ──────────────────────
//
// THE LAW. A planar pendulum whose LENGTH the rider changes. A child on a swing (or a
// pirate-ship ride) climbs not because anything pushes sideways, but because the rider
// raises and lowers their own center of mass — pumping the pendulum's LENGTH. For a
// point mass on a massless rod of length L(t), conservation of angular momentum about
// the pivot gives the equation of motion (no external torque but gravity):
//   d/dt( L² θ̇ ) = −g L sinθ.
// Expanding the derivative:
//   L² θ̈ + 2 L L̇ θ̇ = −g L sinθ        ⇒        θ̈ = −(2 L̇/L) θ̇ − (g/L) sinθ.
// The −(2L̇/L)θ̇ term is the whole story: shortening the rod (L̇<0) at the right moment
// FEEDS the swing; lengthening it (L̇>0) bleeds it. There is no sideways drive at all.
//
// THE NATURAL FREQUENCY. Held at fixed length L the small-angle motion is simple-harmonic
// with ω₀ = √(g/L). The rider PUMPS by modulating the length at the modulation rate ωₘ:
//   L(t) = L₀ ( 1 + ε cos(ωₘ t + φ) ),   ε the pump depth, φ the phase.
//
// THE 2:1 RESONANCE (the Mathieu instability tongue). Crouch (lengthen) at the BOTTOM of
// the arc, stand (shorten) at the TOP — twice per full swing — so the length is pumped at
// ωₘ = 2ω₀, TWICE the swing's own frequency. Linearize (sinθ→θ): the result is Mathieu's
// equation, and ωₘ=2ω₀ lands in its PRINCIPAL instability tongue, where the amplitude
// grows EXPONENTIALLY with NO external drive. Pump at ωₘ=ω₀ (once per swing) or off that
// 2:1 ratio and you sit OUTSIDE the tongue: the amplitude stays bounded no matter how hard
// you pump. Parametric resonance — the deep sibling of ordinary driven resonance.
//
// HOW WE PROVE IT EXACT (Floquet theory — the honest, machine-precision claim). The
// linearized small-angle system is LINEAR and TIME-PERIODIC with period Tₘ = 2π/ωₘ. Its
// MONODROMY matrix M maps [θ, θ̇](0) → [θ, θ̇](Tₘ). The eigenvalues λ of M are the Floquet
// multipliers:  |λ|>1 ⇒ UNSTABLE (grows like λⁿ, rate σ = ln|λ|/Tₘ > 0) — IN the tongue;
// |λ|=1 ⇒ marginally stable (BOUNDED, no secular growth) — OUT of the tongue. Because L is
// periodic, ∫₀^Tₘ trace dt = ∫ −(2L̇/L) dt = −2[lnL]₀^Tₘ = 0, so det(M) = e⁰ = 1 EXACTLY:
// a self-checking invariant the suite asserts to <1e-9. Pump@2ω₀ ⇒ |λ|>1 (σ>0); pump@1ω₀
// ⇒ |λ|=1 (bounded). Seed the integrator in M's dominant eigenvector and ln(amplitude) is
// LINEAR in time with slope = σ to integrator precision (residual <1e-9) — exponential
// growth, proven. The NEG-CONTROL is the FREQUENCY, not effort: the same pump depth ε at
// ωₘ=ω₀ does mean work ≈0 per cycle and never grows. Same effort, opposite outcome —
// resonance is born of the 2:1 TIMING, not of the pumping.
//
// HONESTY. Idealized: a point mass on a massless inextensible-but-length-programmable rod,
// no air drag, no pivot friction. The integrator is classic RK4. The visible swing runs
// the FULL nonlinear EOM (sinθ); the Floquet/Mathieu proof linearizes (sinθ→θ) because the
// instability tongue is a small-amplitude statement — exactly where a swing starts to climb.

export const G = 9.81;          // gravity (m/s²)
export const L0 = 2.0;          // nominal pendulum length (m)
export const EPS = 0.08;        // default pump depth (fractional length change)

// ── ω₀ = √(g/L): the small-angle natural frequency at length L. ────────────────────
export function omega0(L = L0){ return Math.sqrt(G / L); }

// ── THE LENGTH PROGRAM. L(t) = L₀(1 + ε cos(ωₘ t + φ)) and its exact derivative L̇(t). ─
export function lengthAt(t, wm, eps = EPS, phi = 0, l0 = L0){
  const a = wm * t + phi;
  return { L: l0 * (1 + eps * Math.cos(a)), Ldot: -l0 * eps * wm * Math.sin(a) };
}

// ── THE NONLINEAR EOM (the visible swing). State y=[θ, θ̇]; returns [θ̇, θ̈]. ─────────
// θ̈ = −(2L̇/L)θ̇ − (g/L)sinθ.  This is what the renderer integrates — the real arc.
export function deriv(t, y, wm, eps = EPS, phi = 0, l0 = L0){
  const { L, Ldot } = lengthAt(t, wm, eps, phi, l0);
  return [ y[1], -(2 * Ldot / L) * y[1] - (G / L) * Math.sin(y[0]) ];
}

// ── ONE RK4 STEP of the nonlinear EOM. ─────────────────────────────────────────────
export function rk4Step(y, t, dt, wm, eps = EPS, phi = 0, l0 = L0){
  const k1 = deriv(t, y, wm, eps, phi, l0);
  const k2 = deriv(t + 0.5 * dt, [y[0] + 0.5 * dt * k1[0], y[1] + 0.5 * dt * k1[1]], wm, eps, phi, l0);
  const k3 = deriv(t + 0.5 * dt, [y[0] + 0.5 * dt * k2[0], y[1] + 0.5 * dt * k2[1]], wm, eps, phi, l0);
  const k4 = deriv(t + dt, [y[0] + dt * k3[0], y[1] + dt * k3[1]], wm, eps, phi, l0);
  return [ y[0] + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
           y[1] + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) ];
}

// ── ENERGY of the swing (mass=1): E = ½L²θ̇² + gL(1−cosθ). The pump changes L, so it ──
//    does WORK on the swing; ΔE over a modulation cycle is that work. ────────────────
export function energy(t, y, wm, eps = EPS, phi = 0, l0 = L0){
  const { L } = lengthAt(t, wm, eps, phi, l0);
  return 0.5 * L * L * y[1] * y[1] + G * L * (1 - Math.cos(y[0]));
}

// ── THE LINEARIZED EOM (small angle, sinθ→θ): the Mathieu system Floquet acts on. ───
function derivLin(t, y, wm, eps, phi, l0){
  const { L, Ldot } = lengthAt(t, wm, eps, phi, l0);
  return [ y[1], -(2 * Ldot / L) * y[1] - (G / L) * y[0] ];
}
function rk4Lin(y, t, dt, wm, eps, phi, l0){
  const k1 = derivLin(t, y, wm, eps, phi, l0);
  const k2 = derivLin(t + 0.5 * dt, [y[0] + 0.5 * dt * k1[0], y[1] + 0.5 * dt * k1[1]], wm, eps, phi, l0);
  const k3 = derivLin(t + 0.5 * dt, [y[0] + 0.5 * dt * k2[0], y[1] + 0.5 * dt * k2[1]], wm, eps, phi, l0);
  const k4 = derivLin(t + dt, [y[0] + dt * k3[0], y[1] + dt * k3[1]], wm, eps, phi, l0);
  return [ y[0] + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
           y[1] + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) ];
}

// ── THE MONODROMY MATRIX M over one modulation period Tₘ = 2π/ωₘ. ──────────────────
// Integrate the linear system from basis e₁=[1,0] and e₂=[0,1]; the propagated columns
// ARE M. Returns [[a,b],[c,d]] = [[θ from e₁, θ from e₂],[θ̇ from e₁, θ̇ from e₂]].
export function monodromy(wm, eps = EPS, phi = 0, l0 = L0, steps = 8000){
  const Tm = 2 * Math.PI / wm, dt = Tm / steps;
  let c1 = [1, 0], c2 = [0, 1], t = 0;
  for (let i = 0; i < steps; i++){
    c1 = rk4Lin(c1, t, dt, wm, eps, phi, l0);
    c2 = rk4Lin(c2, t, dt, wm, eps, phi, l0);
    t += dt;
  }
  return [[c1[0], c2[0]], [c1[1], c2[1]]];
}

// ── FLOQUET ANALYSIS of M: the Mathieu-tongue verdict. ─────────────────────────────
// Returns {det, trace, lambdaMax (largest |eigenvalue|), growth (σ=ln|λ|/Tₘ), unstable,
// realEigs}. det≈1 EXACTLY (the periodic-L invariant). lambdaMax>1 ⇔ in the tongue.
export function floquet(wm, eps = EPS, phi = 0, l0 = L0, steps = 8000){
  const M = monodromy(wm, eps, phi, l0, steps);
  const a = M[0][0], b = M[0][1], c = M[1][0], d = M[1][1];
  const tr = a + d, det = a * d - b * c;
  const disc = tr * tr - 4 * det;
  let lambdaMax, realEigs;
  if (disc >= 0){
    const s = Math.sqrt(disc);
    const l1 = (tr + s) / 2, l2 = (tr - s) / 2;
    lambdaMax = Math.max(Math.abs(l1), Math.abs(l2));
    realEigs = true;
  } else {
    lambdaMax = Math.sqrt(det);          // |λ| = √det for a complex-conjugate pair
    realEigs = false;
  }
  const Tm = 2 * Math.PI / wm;
  return {
    det, trace: tr, lambdaMax, realEigs,
    growth: Math.log(lambdaMax) / Tm,    // σ: the exponential growth rate (per second)
    unstable: lambdaMax > 1 + 1e-7,
    M,
  };
}

// ── THE DOMINANT EIGENVECTOR of M (the growing mode). For the |λ|max eigenvalue λ, ───
//    v solves (M−λI)v=0 ⇒ v=[b, λ−a] (from row 1). Normalized to a small seed angle. ─
export function dominantEigenvector(wm, eps = EPS, phi = 0, l0 = L0, seed = 0.01, steps = 8000){
  const M = monodromy(wm, eps, phi, l0, steps);
  const a = M[0][0], b = M[0][1], c = M[1][0], d = M[1][1];
  const tr = a + d, det = a * d - b * c, disc = tr * tr - 4 * det;
  if (disc < 0) return [seed, 0];                       // no real growing mode: plain seed
  const s = Math.sqrt(disc);
  const l1 = (tr + s) / 2, l2 = (tr - s) / 2;
  const lam = Math.abs(l1) >= Math.abs(l2) ? l1 : l2;
  let v = [b, lam - a];
  const n = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / n * seed, v[1] / n * seed];
}

// ── THE LN-AMPLITUDE FIT (the exponential-growth proof, made literal). ─────────────
// Seed the LINEAR integrator in the dominant eigenvector, sample amplitude once per
// modulation period (so the periodic ripple cancels), fit a line to ln(amplitude) vs t.
// Amplitude in mode coords: A = √(θ² + (θ̇/ω₀)²). Returns {slope, maxResid, n, sigma}.
export function lnAmpFit(wm, eps = EPS, phi = 0, l0 = L0, periods = 12, steps = 8000){
  const Tm = 2 * Math.PI / wm, dt = Tm / steps, w0 = omega0(l0);
  let y = dominantEigenvector(wm, eps, phi, l0, 0.01, steps), t = 0;
  const pts = [];
  for (let k = 0; k <= periods; k++){
    const A = Math.hypot(y[0], y[1] / w0);
    pts.push({ t, lnA: Math.log(A) });
    for (let i = 0; i < steps; i++){ y = rk4Lin(y, t, dt, wm, eps, phi, l0); t += dt; }
  }
  const n = pts.length;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const p of pts){ sx += p.t; sy += p.lnA; sxx += p.t * p.t; sxy += p.t * p.lnA; }
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const icpt = (sy - slope * sx) / n;
  let maxResid = 0;
  for (const p of pts){ maxResid = Math.max(maxResid, Math.abs(p.lnA - (slope * p.t + icpt))); }
  return { slope, maxResid, n, sigma: floquet(wm, eps, phi, l0, steps).growth };
}

// ── MEAN WORK PER MODULATION CYCLE (the "same effort, opposite outcome" claim). ────
// Run the NONLINEAR swing from a small start; average ΔE over `cycles` modulation
// periods. At 2ω₀-resonant this is strictly >0 (secular gain); at 1ω₀ it is ≈0.
export function meanWorkPerCycle(wm, eps = EPS, phi = 0, l0 = L0, th0 = 0.05, cycles = 16, steps = 3000){
  const Tm = 2 * Math.PI / wm, dt = Tm / steps;
  let y = [th0, 0], t = 0;
  let Eprev = energy(t, y, wm, eps, phi, l0), sum = 0;
  for (let k = 0; k < cycles; k++){
    for (let i = 0; i < steps; i++){ y = rk4Step(y, t, dt, wm, eps, phi, l0); t += dt; }
    const E = energy(t, y, wm, eps, phi, l0);
    sum += (E - Eprev); Eprev = E;
  }
  return sum / cycles;
}

// ── THE SELF-TEST. The Node twin and the in-page chip call THIS. ──────────────────
export function runSelfTest(){
  const checks = [];
  const ck = (name, ok) => checks.push({ name, ok: !!ok });
  const w0 = omega0(L0);

  // (1) ω₀ = √(g/L) EXACT to <1e-9, at the nominal and across a band of lengths.
  {
    let worst = 0;
    for (const L of [0.5, 1, 2, 3.5, 5, 8]){ worst = Math.max(worst, Math.abs(omega0(L) - Math.sqrt(G / L))); }
    ck('(1) ω₀ = √(g/L) EXACT (<1e-9) at the nominal length AND across L∈[0.5,8]',
       Math.abs(omega0(L0) - Math.sqrt(G / L0)) < 1e-9 && worst < 1e-9);
  }

  // (2) det(M)=1 EXACTLY — the periodic-L Floquet invariant (a self-check on the integrator).
  {
    let worst = 0;
    for (const r of [1, 2, 1.5]) for (const e of [0.05, 0.08, 0.12]){
      worst = Math.max(worst, Math.abs(floquet(r * w0, e, 0).det - 1));
    }
    ck('(2) det(monodromy)=1 EXACT (<1e-9) for every (ratio,ε) — the periodic-L invariant', worst < 1e-9);
  }

  // (3) HEADLINE: pump@2ω₀ sits IN the principal tongue → |λ|>1 and σ>0 (exponential growth).
  {
    const f = floquet(2 * w0, EPS, 0);
    ck('(3) HEADLINE: pump@2ω₀ → Floquet |λ|>1 (in the principal Mathieu tongue) AND growth σ>0',
       f.unstable && f.lambdaMax > 1.0 && f.growth > 0.01);
  }

  // (4) LINEAR ln-amplitude: seeded in the growing mode, ln(A) is LINEAR with slope=σ to
  // tiny residual — exponential growth proven, AND the fit slope matches Floquet σ.
  {
    const fit = lnAmpFit(2 * w0, EPS, 0, L0, 12);
    ck('(4) ln(amplitude) LINEAR in time: slope>0, residual <1e-9, AND slope == Floquet σ (<1e-6)',
       fit.slope > 0 && fit.maxResid < 1e-9 && Math.abs(fit.slope - fit.sigma) < 1e-6);
  }

  // (5) NEG-CONTROL — FREQUENCY, not effort: pump@1ω₀ (SAME ε) → |λ|=1 (bounded, no tongue)
  // and mean work/cycle ≈0. Same pump depth, opposite outcome. (Off-resonant 1.5ω₀ too.)
  {
    const f1 = floquet(1 * w0, EPS, 0);
    const off = floquet(1.5 * w0, EPS, 0);
    const boundedLam = Math.abs(f1.lambdaMax - 1) < 1e-6 && !f1.unstable
                    && Math.abs(off.lambdaMax - 1) < 1e-6 && !off.unstable;
    // mean work ≈0 at 1ω₀ averaged over phases (vs strictly >0 at 2ω₀)
    let acc = 0, n = 0;
    for (let k = 0; k < 8; k++){ acc += meanWorkPerCycle(1 * w0, EPS, (k / 8) * 2 * Math.PI); n++; }
    const w1 = acc / n;
    const w2 = meanWorkPerCycle(2 * w0, EPS, 0);
    ck('(5) NEG-CONTROL the teeth bite: pump@1ω₀ (SAME ε) → |λ|=1 bounded AND mean work/cycle ≈0',
       boundedLam && Math.abs(w1) < 1e-4);
    ck('(5) same effort, OPPOSITE outcome: work@2ω₀ ≫ 0 while work@1ω₀ ≈ 0 (resonance is the 2:1 timing)',
       w2 > 0.05 && Math.abs(w1) < 1e-4 && w2 > 100 * Math.abs(w1));
  }

  // (6) ANTI-VACUITY: at the SAME 2ω₀, ε→0 (no pump) → no growth (|λ|=1). The growth needs
  // a real pump; the suite cannot pass on the frequency alone.
  {
    const f0 = floquet(2 * w0, 0, 0);
    ck('(6) anti-vacuity: pump@2ω₀ but ε=0 (no pump) → |λ|=1, no growth (the tongue needs a real pump)',
       Math.abs(f0.lambdaMax - 1) < 1e-6 && !f0.unstable);
  }

  const pass = checks.filter(c => c.ok).length;
  return { pass, total: checks.length, checks };
}

// ── direct-run main guard: `node core.mjs` prints the self-test and exits non-zero on
//    any failure (so "node core.mjs green" is literal). Inert when imported. ──────────
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  const r = runSelfTest();
  for (const c of r.checks) console.log((c.ok ? '  ✓ ' : '  ✗ ') + c.name);
  console.log(`\n${r.pass}/${r.total} ${r.pass === r.total ? '✓ ALL GREEN' : '✗ FAILURES'}`);
  process.exit(r.pass === r.total ? 0 : 1);
}
