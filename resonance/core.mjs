/* ════════════════════════════════════════════════════════════════════════════
   THE SINGING GLASS — core.mjs · the physics authority (pure, DOM-free).

   A wine glass driven by a pure tone is the textbook driven, damped harmonic
   oscillator — one rim flexural mode (the "mode-2" standing wave: the rim
   breathes into an ellipse, R(θ) = R₀(1 + a·cos2θ)). Push it near its natural
   frequency ω₀ and the amplitude RUNS AWAY until the rim cracks. This module is
   the sole authority for that physics: the page inlines it byte-faithfully via
   `forge:include core.mjs` (forge strips the `export` keywords for an in-page
   <script>), and the Node twin core.test.mjs imports the SAME functions and runs
   runSelfTest() verbatim.

   THE PHYSICS — a driven, damped harmonic oscillator (one rim mode):
        ẍ + γ ẋ + ω₀² x = (F₀/m) cos ωt
   Its steady state is   x(t) = A(ω) cos(ωt − δ(ω))   with
        A(ω) = (F₀/m) / √( (ω₀² − ω²)² + (γω)² )
        δ(ω) = atan2( γω , ω₀² − ω² )        ∈ (0, π)
   Below ω₀: δ≈0 (rim moves IN STEP). At ω=ω₀: δ=90° EXACTLY. Above ω₀: δ→180°.
   The amplitude peak sits NOT at ω₀ but at ω_peak = √(ω₀² − γ²/2) (damped pull-down).
   Half-power bandwidth (the two ω with A² = A²_max/2) → γ in the high-Q limit, so
   the sharpness is Q = ω₀/γ. Off-resonance the response collapses toward F₀/(m ω₀²)
   (a quiet, flat quasi-static nudge). The self-test pins every one of these.
   ════════════════════════════════════════════════════════════════════════════ */

// Closed-form steady-state amplitude. p = { w0, gamma, Fm }  (Fm = F₀/m).
export function ampClosed(w, p) {
  const { w0, gamma, Fm } = p;
  const denom = Math.sqrt((w0*w0 - w*w)**2 + (gamma*w)**2);
  return Fm / denom;
}
// Closed-form phase lag δ(ω) ∈ (0, π): the rim TRAILS the drive by this much.
export function phaseClosed(w, p) {
  const { w0, gamma } = p;
  return Math.atan2(gamma * w, w0*w0 - w*w);   // 0 below, π/2 at w0, →π above
}
// The amplitude-peak frequency (damped): ω_peak = √(ω₀² − γ²/2), real iff γ²<2ω₀².
export function peakFreq(p) {
  const { w0, gamma } = p;
  const r = w0*w0 - gamma*gamma/2;
  return r > 0 ? Math.sqrt(r) : 0;
}
// Quality factor Q = ω₀ / γ.
export function qFactor(p) { return p.w0 / p.gamma; }
// The quasi-static (ω→0) response — the flat floor the curve collapses toward.
export function staticResponse(p) { return p.Fm / (p.w0 * p.w0); }

// ── The ODE field for the FULL transient integration (steady-state is the attractor).
// state s = [x, v]; the drive enters explicitly through time t.  Returns [ẋ, v̇].
export function deriv(s, t, p) {
  const [x, v] = s;
  const { w0, gamma, Fm, w } = p;
  return [v, -gamma * v - w0*w0 * x + Fm * Math.cos(w * t)];
}
// One RK4 step of size h at time t (the drive is time-explicit, so we sample it at
// the stage substeps t, t+h/2, t+h). RK4 has tiny bounded error on this smooth field.
export function rk4Step(s, t, h, p) {
  const k1 = deriv(s, t, p);
  const k2 = deriv([s[0]+h/2*k1[0], s[1]+h/2*k1[1]], t+h/2, p);
  const k3 = deriv([s[0]+h/2*k2[0], s[1]+h/2*k2[1]], t+h/2, p);
  const k4 = deriv([s[0]+h*k3[0],  s[1]+h*k3[1]],  t+h,   p);
  return [ s[0] + h/6*(k1[0]+2*k2[0]+2*k3[0]+k4[0]),
           s[1] + h/6*(k1[1]+2*k2[1]+2*k3[1]+k4[1]) ];
}
// Integrate from rest for `cycles` drive-periods, then measure the STEADY-STATE
// amplitude and phase lag over a final whole number of periods (after transients die).
// Returns { ampNum, phaseNum } — the EMERGENT response, to compare against the closed form.
export function measureSteady(p, cycles = 240, perCycle = 240) {
  const period = 2 * Math.PI / p.w;
  const h = period / perCycle;
  let s = [0, 0], t = 0;
  const settle = Math.floor(cycles * 0.7);     // let transients decay first
  for (let c = 0; c < settle; c++)
    for (let i = 0; i < perCycle; i++) { s = rk4Step(s, t, h, p); t += h; }
  // measure over the remaining whole periods: track max|x|, and fit the lag by
  // correlating x(t) against cos(ωt) and sin(ωt) (a one-bin DFT at the drive freq).
  let amp = 0, I = 0, Q = 0, n = 0;
  const measCycles = cycles - settle;
  for (let c = 0; c < measCycles; c++)
    for (let i = 0; i < perCycle; i++) {
      s = rk4Step(s, t, h, p); t += h;
      amp = Math.max(amp, Math.abs(s[0]));
      I += s[0] * Math.cos(p.w * t);            // in-phase component
      Q += s[0] * Math.sin(p.w * t);            // quadrature component
      n++;
    }
  // x(t) = A cos(ωt − δ) = A cosδ cos(ωt) + A sinδ sin(ωt) ⇒ I∝cosδ, Q∝sinδ.
  const phaseNum = Math.atan2(Q, I);            // = δ, in (0, π) for this drive
  return { ampNum: amp, phaseNum };
}

/* ════════════════════════════════════════════════════════════════════════════
   THE SELF-TEST — proves the claims. The Node twin runs this verbatim; the pill calls it.
   ════════════════════════════════════════════════════════════════════════════ */
export function runSelfTest() {
  const log = [];
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; log.push('✗ ' + m); } };
  const near = (a, b, tol) => Math.abs(a - b) < tol;

  const w0 = 1.0;
  const base = { w0, gamma: 0.06, Fm: 1.0 };    // high-Q glass (Q ≈ 16.7)

  // (1) The full ODE, integrated to steady state, MATCHES the closed-form A(ω) and δ(ω)
  //     across a sweep of ω — the emergent response equals the formula (tight tol).
  let worstA = 0, worstP = 0;
  for (const w of [0.4, 0.7, 0.9, 1.0, 1.1, 1.4, 2.0]) {
    const p = { ...base, w };
    const { ampNum, phaseNum } = measureSteady(p);
    const aRel = Math.abs(ampNum - ampClosed(w, p)) / ampClosed(w, p);
    const pErr = Math.abs(phaseNum - phaseClosed(w, p));
    worstA = Math.max(worstA, aRel); worstP = Math.max(worstP, pErr);
  }
  ok(worstA < 0.02, `numerical A(ω) matches closed form across the sweep (worst rel ${worstA.toExponential(2)})`);
  ok(worstP < 0.03, `numerical δ(ω) matches closed form across the sweep (worst |Δδ| ${worstP.toFixed(4)} rad)`);

  // (2) δ(ω₀) = 90° EXACTLY (the signature of resonance), and the amplitude peak sits
  //     at ω_peak = √(ω₀² − γ²/2) — pulled BELOW ω₀ by damping, not at ω₀.
  ok(near(phaseClosed(w0, base), Math.PI/2, 1e-12), `δ(ω₀) = 90° exactly (got ${(phaseClosed(w0,base)*180/Math.PI).toFixed(6)}°)`);
  const wpk = peakFreq(base);
  ok(near(wpk, Math.sqrt(w0*w0 - base.gamma*base.gamma/2), 1e-12), `ω_peak = √(ω₀²−γ²/2) (got ${wpk.toFixed(6)})`);
  ok(wpk < w0, `the amplitude peak sits BELOW ω₀ (damped pull-down): ${wpk.toFixed(5)} < ${w0}`);
  // and the closed-form A is genuinely maximal at ω_peak (vs neighbours)
  ok(ampClosed(wpk, base) > ampClosed(wpk - 0.01, base) &&
     ampClosed(wpk, base) > ampClosed(wpk + 0.01, base), `A(ω) is locally maximal at ω_peak`);

  // (3) NEG CONTROL — half-power bandwidth (the two ω with A² = A²_max/2) equals γ in the
  //     high-Q limit, giving Q = ω₀/γ; AND a quiet drive far from ω₀ collapses to ~flat.
  const Amax = ampClosed(wpk, base);
  const half = Amax / Math.SQRT2;               // A at half-POWER (A² halved)
  // find the two ω where A crosses `half` by bisection on each side of the peak
  const crossBelow = bisectAmp(base, half, 0.3, wpk);
  const crossAbove = bisectAmp(base, half, wpk, 2.0);
  const bandwidth = crossAbove - crossBelow;
  ok(near(bandwidth, base.gamma, base.gamma * 0.03), `half-power bandwidth ≈ γ (FWHM ${bandwidth.toFixed(5)} vs γ ${base.gamma}) ⇒ Q=ω₀/γ=${qFactor(base).toFixed(1)}`);
  // detuning collapse: far below ω₀, A → static floor F/(mω₀²); far below it is essentially flat.
  const far = ampClosed(0.2, base), floor = staticResponse(base);
  ok(Math.abs(far - floor)/floor < 0.05, `far-detuned drive collapses to the quasi-static floor F/(mω₀²) (A ${far.toFixed(3)} ≈ ${floor.toFixed(3)})`);
  ok(far < Amax / 8, `the far-detuned response is tiny next to the peak (${far.toFixed(3)} vs ${Amax.toFixed(3)}) — resonance is a sharp, dangerous spike`);

  // (4) Q SCALES with 1/γ: halving γ doubles Q and roughly doubles the peak height.
  const sharp = { w0, gamma: 0.03, Fm: 1.0 };
  ok(near(qFactor(sharp), 2 * qFactor(base), 1e-9), `halving γ doubles Q (${qFactor(base).toFixed(1)} → ${qFactor(sharp).toFixed(1)})`);
  ok(ampClosed(peakFreq(sharp), sharp) > 1.8 * Amax, `…and roughly doubles the peak amplitude (sharper, taller, more dangerous)`);

  // (5) PHASE monotonicity & limits: δ runs 0 → π/2 → π as ω goes below→at→above ω₀.
  ok(phaseClosed(0.5, base) < Math.PI/2 && phaseClosed(1.5, base) > Math.PI/2,
     `phase lag: <90° below ω₀, >90° above (in step vs out of step)`);
  ok(phaseClosed(3.0, base) > Math.PI * 0.8, `well above ω₀ the lag → ~180° (push as it comes back at you): ${(phaseClosed(3.0,base)*180/Math.PI).toFixed(0)}°`);

  return { pass, fail, log };
}
// bisection helper: find ω in [lo,hi] where ampClosed crosses `target` (monotone there).
export function bisectAmp(p, target, lo, hi) {
  const f = w => ampClosed(w, p) - target;
  let a = lo, b = hi;
  for (let i = 0; i < 80; i++) {
    const m = (a + b) / 2;
    if (Math.sign(f(m)) === Math.sign(f(a))) a = m; else b = m;
  }
  return (a + b) / 2;
}
