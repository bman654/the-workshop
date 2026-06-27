// The Ball-and-Disk Integrator — logic core (the organ that INTEGRATES one rotation).
//
// THE WHOLE POINT: a flat disc spins through angle u (the input variable). A friction
// wheel of radius r rides on the disc at radius x from the centre. As the disc turns du,
// the disc surface under the wheel sweeps a tangential ARC of length x·du; rolling WITHOUT
// SLIPPING, the wheel turns dθ = (x·du)/r. The output dial therefore winds the INTEGRAL
//        θ_out(u) = (1/r) ∫₀^u x(s) ds.
// Drag the carriage to set x, spin the disc to advance u, and the dial reads the running
// integral — no arithmetic anywhere. It is the second organ of a differential analyzer:
// the Differential Gear ADDS, this INTEGRATES.
//
// WHY IT'S TRUE: arc length under a point at radius x as the disc turns du is exactly x·du
// (radius × angle); pure rolling carries that arc onto the wheel rim, so dθ = x·du / r. The
// half is forced by nothing — it is the definition of the integral, accumulated mechanically.
//
// IDEALIZATION, STATED HONESTLY: point contact, pure rolling, zero slip / creep. The pinned
// claim is the GOVERNING LAW θ_out = (1/r)∫x du measured against closed-form integrals — NOT
// a friction model. A real ball slips a little; slip scales θ_out by a constant but does not
// change the law's FORM. We assert the law, not the tribology.
//
// The slab between the INTEGRATOR-CORE sentinels is the SOLE authority. It is inlined
// byte-for-byte into index.html (so the dial the visitor winds is provably the same code as
// the proof) and re-anchored by core.test.mjs's byte-parity check. runSelfTest() is the SOLE
// oracle — the in-page pill and the Node twin both call exactly it.

// === INTEGRATOR-CORE BEGIN ===
// THE LOCAL LAW — one disc micro-turn winds the wheel by arc / radius. Exact algebra; the
// page's free-drag animation and the neg-control both step THIS. At x=0 it returns 0 for ANY
// du: parked at the centre, the dial never moves however long the disc spins. RADIUS, not
// spin, is what integrates.
function dTheta(x, du, r) { return (x * du) / r; }

// THE MACHINE INTEGRATOR — accumulate the local law as the disc turns 0→u. This is the
// ROLLING MACHINE: it only ever SAMPLES the radius program x(s) and sums wheel rotation; it
// never sees a closed form. The accumulator is a composite Boole rule (degree-5 Newton–Cotes,
// truncation error O(h⁶)) — a high-order stand-in for the continuum integral the real disc
// performs. Consequence: BIT-EXACT (to a few ULPs, relative) for any POLYNOMIAL radius program
// up to quintic, and <1e-12 for the transcendental sine program at N≥512.
function rollOut(xOf, u, r, N = 1024) {
  N = Math.max(4, Math.round(N / 4) * 4);          // Boole groups panels in fours
  const h = u / N;
  let s = 7 * (xOf(0) + xOf(u));
  for (let k = 1; k < N; k++) {
    const w = (k % 4 === 0) ? 14 : (k % 2 === 0 ? 12 : 32);
    s += w * xOf(k * h);
  }
  return (2 * h / 45) * s / r;
}

// A 2-STAGE CHAIN — stage 1's output dial drives stage 2's carriage radius, both discs on the
// SAME input shaft u. Nesting the integrator reproduces the exact DOUBLE integral
//        θ₂(u) = (1/(r₁r₂)) ∫₀^u ∫₀^s x₁(t) dt ds.
function chainOut(x1Of, u, r1, r2, N = 1024) {
  return rollOut(s => rollOut(x1Of, s, r1, N), u, r2, N);
}

// THE CANONICAL PROGRAMS — single source of truth shared by the page's loaded buttons AND the
// proof. Each carries the radius law x(u) AND its closed-form antiderivative θ(u,r); the page
// shows machine-dial vs closed-form live, and runSelfTest pins them to <1e-12. 'exact' = the
// integrator is bit-exact on it (polynomial cargo); 'convergent' = transcendental, <1e-12.
const PROGRAMS = [
  { id: 'const',  desc: 'hold x constant → the dial ramps LINEARLY',
    x: (u) => 0.42,          closed: (u, r) => 0.42 * u / r,          kind: 'exact' },
  { id: 'linear', desc: 'let x grow with the disc → a u²/2 PARABOLA',
    x: (u) => 0.3 * u,       closed: (u, r) => 0.3 * u * u / 2 / r,   kind: 'exact' },
  { id: 'sine',   desc: 'x = sin u → the dial traces 1 − cos u',
    x: (u) => Math.sin(u),   closed: (u, r) => (1 - Math.cos(u)) / r, kind: 'convergent' },
  { id: 'zero',   desc: 'park the carriage at the CENTRE (x = 0) → the dial never moves',
    x: (u) => 0,             closed: (u, r) => 0,                     kind: 'exact' },
];
// canonical machine radii (wheel radii). R drives the single stage; R1,R2 the chained stages.
const R = 0.7, R1 = 0.9, R2 = 1.3;

// THE SOLE ORACLE. Six checks; the in-page pill and the Node twin both call THIS. Each check
// is { name, pass, info }; returns { checks, passed, total, ok }.
function runSelfTest() {
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });
  const EPS = 1e-12, TAU = Math.PI * 2;
  const us = [];                                   // a dense generic-u sweep (no period luck)
  for (let i = 1; i <= 240; i++) us.push(i / 240 * 4 * Math.PI);

  // (1) THE THREE CANONICAL PROGRAMS match their closed-form integral to <1e-12 (absolute;
  //     their output stays O(1) over the disc's natural range).
  {
    let mx = 0;
    for (const p of PROGRAMS) if (p.id !== 'zero')
      for (const u of us) mx = Math.max(mx, Math.abs(rollOut(p.x, u, R) - p.closed(u, R)));
    log('1 · const→linear · linear→u²/2 · sin→1−cos all match closed form',
      mx < EPS, 'max|Δ|=' + mx.toExponential(2) + ' over ' + (us.length * 3) + ' pts');
  }

  // (2) POLYNOMIAL-EXACTNESS — the integrator is BIT-EXACT (not merely convergent) for every
  //     polynomial radius program up to quintic: ∫u^n = u^{n+1}/(n+1). Relative tolerance,
  //     because the output magnitude ranges over many orders (differential-gear's lesson).
  {
    let mx = 0;
    for (let n = 0; n <= 5; n++)
      for (const u of us) {
        const want = u ** (n + 1) / (n + 1) / R;
        mx = Math.max(mx, Math.abs(rollOut((s) => s ** n, u, R) - want) / (Math.abs(want) + 1e-300));
      }
    log('2 · BIT-EXACT for every polynomial radius program x=u^0..u^5 (∫u^n=u^{n+1}/(n+1))',
      mx < EPS, 'max rel|Δ|=' + mx.toExponential(2) + ' (only the transcendental sine is convergent)');
  }

  // (3) THE 2-STAGE CHAIN reproduces the exact DOUBLE integral. const→u² (∫∫1 = u²/2) and
  //     sine→(u − sin u) (∫∫sin), both to <1e-12. The chain nests the integrator (O(N²)), so
  //     the in-page pill samples a small smooth u-set; the Node twin sweeps it densely.
  {
    const a = 0.5;
    const usChain = [0.7, 1.6, Math.PI, 4.0, 2 * Math.PI, 8.0, 3 * Math.PI, 4 * Math.PI];
    let mx = 0;
    for (const u of usChain) {
      mx = Math.max(mx, Math.abs(chainOut((s) => a, u, R1, R2) - a * u * u / (2 * R1 * R2)));
      mx = Math.max(mx, Math.abs(chainOut(Math.sin, u, R1, R2) - (u - Math.sin(u)) / (R1 * R2)));
    }
    log('3 · the 2-stage chain reproduces the exact ∫∫: const→u²/2 · sin→u−sin u',
      mx < EPS, 'max|Δ|=' + mx.toExponential(2) + ' over ' + (usChain.length * 2) + ' pts');
  }

  // (4) NEG-CONTROL — park at the centre (x=0) and the dial NEVER moves, however long the disc
  //     spins. dTheta(0,·)=0 for any micro-turn, AND rollOut(0,·) = exactly 0 over a MILLION
  //     turns. Radius, not spin, is what integrates.
  {
    let stepZero = true;
    for (const du of [0.1, 1, 1e6, -3, TAU * 1e6]) if (dTheta(0, du, R) !== 0) stepZero = false;
    const spun = rollOut((u) => 0, TAU * 1e6, R, 4096);
    log('4 · NEG-CONTROL: x=0 → dial frozen (dθ≡0; ∫ over 1e6 turns is exactly 0)',
      stepZero && spun === 0, 'million-turn dial = ' + spun + ' (exactly 0) · step-zero ' + stepZero);
  }

  // (5) FTC BRIDGE — the dial's RATE equals the local law: d/du θ_out(u) = x(u)/r. Ties the
  //     integral the machine winds back to the local arc/radius law (fundamental theorem).
  {
    let mx = 0; const d = 1e-6;
    for (const p of [PROGRAMS[1], PROGRAMS[2]])
      for (let i = 1; i <= 60; i++) {
        const u = 0.2 + i / 60 * 5;
        const rate = (rollOut(p.x, u + d, R) - rollOut(p.x, u - d, R)) / (2 * d);
        mx = Math.max(mx, Math.abs(rate - p.x(u) / R));
      }
    log('5 · FTC: the dial-rate dθ/du equals the local law x/r (∫ and the arc-law agree)',
      mx < 1e-5, 'max|Δ|=' + mx.toExponential(2));
  }

  // (6) TAMPER — the common MISCONCEPTION is "the dial measures how far the disc SPUN" (θ ∝ u,
  //     ignoring x). Feed the linear program through that wrong law and it gives a STRAIGHT
  //     LINE where the true law gives a PARABOLA — they diverge by O(1). The radius-weighted
  //     law is the only one that fits; the law is specific.
  {
    const wrong = (u, r) => u / r;                 // arc ∝ disc angle only — x forgotten
    let mx = 0;
    for (const u of us) mx = Math.max(mx, Math.abs(rollOut(PROGRAMS[1].x, u, R) - wrong(u, R)));
    log('6 · TAMPER: the "spin-not-radius" misconception (θ∝u) diverges from the parabola',
      mx > 1e-3, 'max|Δ|=' + mx.toExponential(2) + ' (only the radius-weighted ∫ fits)');
  }

  const passed = checks.filter((c) => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// === INTEGRATOR-CORE END ===

export { dTheta, rollOut, chainOut, PROGRAMS, R, R1, R2, runSelfTest };
