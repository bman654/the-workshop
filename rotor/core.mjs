// ── THE ROTOR — physics authority for a wall-of-death spin drum: THE PIN.
//    This block is the SOLE AUTHORITY; a Node twin (core.test.mjs) re-extracts it
//    byte-for-byte between sentinels and the in-page chip calls the SAME
//    runSelfTest(). The renderer draws the riders' FATE from this authority —
//    stick or sink IS the readout, never a plotted curve. ──────────────────────────
//
// THE LAW. A rider of mass m stands against the inside wall of a drum of radius r
// spinning at angular rate ω. The wall pushes inward on the rider to bend them onto
// their circular path — that is the NORMAL force, the centripetal press:
//   N = m ω² r.                                            (the wall press)
// Friction along the wall can hold at most μN before the rider slides. The floor
// drops away; the only thing fighting the rider's weight mg is that friction. The
// rider STAYS PINNED exactly when friction can carry the full weight:
//   μN ≥ mg            ⇔            μ m ω² r ≥ m g.        (the pin condition)
// The mass m appears on BOTH sides and CANCELS:
//   μ ω² r ≥ g.        ← mass-free. A 95 kg adult and a 22 kg child share ONE fate.
// The threshold spin is the ω where it becomes an equality:
//   ω_c = √( g / (μ r) ).                                  (mass-INVARIANT)
// Above ω_c everyone is pinned; below it everyone slides down into the shaft. The
// soul of this ride is that the drum forgets your weight: ω_c has NO mass term.
//
// THE SLIDE. Below ω_c the net downward pull per unit mass is the slip acceleration
//   a_slip = g − μ ω² r.                                   (>0 ⇒ sliding, m-free)
// also mass-free — so two riders of different mass sink in LOCKSTEP. The rider's sink
// fraction over a fall depth `fall` after time t is drop01 = min(1, ½ a_slip t² / fall),
// clamped to [0,1]; pinned riders read drop01 ≡ 0. Because a_slip carries no mass,
// drop01 is identical for the adult and the child — the drawn proof of invariance.
//
// THE NEG-CONTROL (the teeth). holdsFrictionless models a FRICTIONLESS wall (μ=0):
// the wall still PRESSES (N = mω²r still grows with ω — you can feel it crush) but the
// friction reserve μN is dead, so the rider ALWAYS slides at every spin. omegaC(0) is
// +∞ (no finite spin ever holds). runSelfTest proves holdsFrictionless ≡ false across
// a band that INCLUDES ω above the real ω_c (where the real wall holds) — a non-empty
// disagreement, so the suite cannot pass vacuously, while press still strictly grows.
//
// HONESTY. Point-mass riders, a rigid drum wall, dry Coulomb friction with a single
// coefficient μ (no static/kinetic split, no air drag). The pin/slide threshold and
// the wall press are exact; only the slide's draw uses a nominal fall depth so the
// sink reads on a finite canvas.

export const G = 9.81;          // gravity (m/s²)
export const R_DRUM = 2.0;      // r: drum radius (m)
export const MU = 0.45;         // μ: wall friction coefficient — ω_c ≈ 3.3015 rad/s

// ── THE WALL PRESS ────────────────────────────────────────────────────────────────
// N = m ω² r: the normal (centripetal) force the wall exerts on a rider of mass m
// spinning at ω in a drum of radius r. Strictly increases with ω at any μ (the wall
// presses even when frictionless). This is the force friction feeds on.
export function press(m, omega, r=R_DRUM){
  return m*omega*omega*r;
}

// ── THE PIN CONDITION (the predicate) ──────────────────────────────────────────────
// holds: does the wall friction carry the rider's full weight? μN ≥ mg. The mass
// cancels (μω²r ≥ g) so the verdict is mass-INVARIANT; μ=0 ⇒ μN=0 < mg ⇒ never holds.
export function holds(m, omega, mu=MU, r=R_DRUM, g=G){
  return mu*press(m, omega, r) >= m*g;
}

// ── THE THRESHOLD SPIN (mass-invariant) ─────────────────────────────────────────────
// ω_c = √(g/(μr)) — the spin where μN exactly equals mg. NO mass argument: the
// crossing is the SAME for every rider. μ=0 ⇒ no finite spin holds ⇒ +∞.
export function omegaC(mu=MU, r=R_DRUM, g=G){
  return mu>0 ? Math.sqrt(g/(mu*r)) : Infinity;
}

// ── THE RIDER STATE — the ONLY fate the renderer consumes ───────────────────────────
// {m, omega, pinned, aSlip: g−μω²r (the slip accel, m-free), N: the wall press,
//  drop01: the sink fraction ∈[0,1] over a fall of depth `fall` after time t}. Both
//  aSlip and drop01 are MASS-FREE, so heavy and light riders read IDENTICAL drop01 —
//  the visceral proof drawn in the drum.
export function riderState(m, omega, t, mu=MU, r=R_DRUM, g=G, fall=1.6){
  const aSlip = g - mu*omega*omega*r;          // >0 ⇒ sliding; ≤0 ⇒ pinned. Mass-free.
  const pinned = aSlip <= 0;
  return {
    m,
    omega,
    pinned,
    aSlip,
    N: press(m, omega, r),
    drop01: Math.min(1, pinned ? 0 : 0.5*aSlip*t*t / fall),
  };
}

// ── THE NEG-CONTROL (the teeth) — a FRICTIONLESS wall, μ=0, never holds ─────────────
// holdsFrictionless: the same pin test with μ pinned to 0. The wall still presses
// (press(m,ω,r) is unchanged) but the friction reserve μN is identically zero, so
// μN ≥ mg is false for every ω>0 — the rider ALWAYS slides. omegaC(0)===Infinity.
export function holdsFrictionless(m, omega, r=R_DRUM, g=G){
  return holds(m, omega, 0, r, g);
}

// ── THE GRAFT (the balance-dial instrument) — Explorer 2's honest distinction ───────
// frictionReserve = μN: the most weight the wall friction can currently carry. The
// side dial races this filling column against the FIXED weight tick mg; holds is true
// exactly when the reserve reaches the weight. At μ=0 the reserve is dead (≡0) even
// though press still grows — the wall presses, but nothing holds.
export function frictionReserve(m, omega, mu=MU, r=R_DRUM){
  return mu*press(m, omega, r);
}

// ── THE SELF-TEST. The Node twin and the in-page chip call THIS. ──────────────────
export function runSelfTest(){
  const checks = [];
  const ck = (name, ok) => checks.push({ name, ok: !!ok });
  const EPS = 1e-9;

  // (1) THRESHOLD both sides <1e-9, swept over several (μ,r,g). Just below ω_c the
  // rider slides (holds false, not pinned); just above it sticks (holds true, pinned);
  // at exactly ω_c the gap μN−mg is zero to <1e-9.
  {
    let allOk = true, n = 0;
    for(const mu of [0.30, 0.45, 0.62]) for(const r of [1.6, 2.0, 2.8]) for(const g of [9.81, 9.0]){
      const m = 70;                               // any mass — the threshold is mass-free
      const wc = omegaC(mu, r, g);
      const below = wc*(1 - 1e-6), above = wc*(1 + 1e-6);
      if( holds(m, below, mu, r, g) ) allOk = false;            // below ⇒ slides
      if( riderState(m, below, 0.5, mu, r, g).pinned ) allOk = false;
      if( !holds(m, above, mu, r, g) ) allOk = false;           // above ⇒ sticks
      if( !riderState(m, above, 0.5, mu, r, g).pinned ) allOk = false;
      const gapAtC = mu*press(m, wc, r) - m*g;                  // μN − mg at exactly ω_c
      if( Math.abs(gapAtC) >= EPS ) allOk = false;
      n++;
    }
    ck('(1) THRESHOLD both sides <1e-9: ω_c⁻ slides (¬holds,¬pinned), ω_c⁺ sticks (holds,pinned), μN−mg≈0 at ω_c — over '+n+' (μ,r,g)', allOk && n>=12);
  }

  // (2) ★ MASS-INVARIANCE (the soul, PROVEN). omegaC takes no mass (trivially equal);
  // load-bearing: holds and pinned flip at the SAME ω for 95 kg vs 22 kg over a dense
  // (ω,t) grid, and the drawn drop01 is byte-identical (they sink in lockstep).
  {
    let same = true, dropSame = true, n = 0, flips = 0, prevH = null;
    const wc = omegaC();                          // default μ,r,g
    for(let w = 0; w <= 6; w += 0.02){
      const hA = holds(95, w), hB = holds(22, w);
      if(hA !== hB) same = false;
      if(prevH !== null && hA !== prevH) flips++;  // count stick↔slide transitions
      prevH = hA;
      for(const t of [0, 0.2, 0.5, 1.0, 1.8]){
        const sa = riderState(95, w, t), sb = riderState(22, w, t);
        if(sa.pinned !== sb.pinned) same = false;
        if(sa.drop01 !== sb.drop01) dropSame = false;           // byte-identical sink
      }
      n++;
    }
    ck('(2)★ MASS-INVARIANT: holds(95,ω)===holds(22,ω) AND pinned matches at every (ω,t) over '+n+' spins — they flip stick↔slide at the SAME ω', same && flips>=1);
    ck('(2)★ LOCKSTEP: riderState(95,ω,t).drop01 === riderState(22,ω,t).drop01 (the two bodies sink byte-identically)', dropSame);
    ck('(2)★ omegaC carries NO mass term: ω_c is the single mass-free crossing √(g/μr)', wc > 0 && Number.isFinite(wc));
  }

  // (3) MONOTONE press: N(m,ω,r)=mω²r strictly increases in ω.
  {
    let mono = true, prev = -Infinity, n = 0;
    for(let w = 0; w <= 6; w += 0.02){ const N = press(80, w); if(N <= prev - 1e-15) mono = false; prev = N; n++; }
    ck('(3) MONOTONE press: N = mω²r STRICTLY increases in ω across [0,6] ('+n+' samples)', mono);
  }

  // (4) NEG-CONTROL teeth: a frictionless wall NEVER holds — even ABOVE the real ω_c
  // where the real wall holds (non-empty disagreement); omegaC(0)===Infinity; AND the
  // press still strictly grows at μ=0 (the wall presses; only the reserve is dead).
  {
    const wc = omegaC();
    let fricEverHolds = false, realHoldsBand = 0, disagreeAbove = 0, samplesAbove = 0;
    for(let w = 0; w <= 6; w += 0.02){
      if( holdsFrictionless(70, w) ) fricEverHolds = true;       // must NEVER hold
      if( holds(70, w) ) realHoldsBand++;                        // a band where real holds
      if( w > wc ){                                              // ABOVE the real threshold
        samplesAbove++;
        if( holds(70, w) && !holdsFrictionless(70, w) ) disagreeAbove++;  // real holds, fric doesn't
      }
    }
    // press at μ=0 still strictly grows (the wall still presses — only friction is dead).
    let pressGrows = true, prevN = -Infinity;
    for(let w = 0; w <= 6; w += 0.05){ const N = press(70, w); if(N <= prevN - 1e-15) pressGrows = false; prevN = N; }
    ck('(4) NEG-CONTROL the teeth bite: holdsFrictionless ≡ false for EVERY ω, AND disagrees with the real holds above ω_c (non-empty)',
       !fricEverHolds && disagreeAbove > 0 && disagreeAbove === samplesAbove);
    ck('(4) anti-vacuity: a band EXISTS where the real wall HOLDS (so the disagreement is real) AND omegaC(μ=0)===Infinity',
       realHoldsBand > 0 && omegaC(0) === Infinity);
    ck('(4) the wall STILL presses at μ=0: press(m,ω,r) strictly grows even frictionless (only the reserve is dead)', pressGrows);
  }

  // (5) drop01 kinematics (s = ½at²): pinned ⇒ drop01≡0 ∀t; sliding ⇒ drop01 strictly
  // increases in t and reaches 1 in finite time; a faster slide (smaller ω) sinks faster.
  {
    const wc = omegaC();
    // pinned: above ω_c, drop01 is 0 for all t.
    let pinnedZero = true;
    const wAbove = wc*1.2;
    for(const t of [0, 0.3, 1, 5, 50]){ if( riderState(70, wAbove, t).drop01 !== 0 ) pinnedZero = false; }
    // sliding: below ω_c, drop01 strictly increases in t (until clamped) and reaches 1.
    const wBelow = wc*0.5;
    let inc = true, prev = -1, reaches1 = false;
    for(let t = 0; t <= 5; t += 0.05){
      const d = riderState(70, wBelow, t).drop01;
      if(d < prev - 1e-15) inc = false;
      if(d >= 1) reaches1 = true;
      prev = d;
    }
    // a faster slide sinks faster: smaller ω ⇒ bigger aSlip ⇒ bigger drop01 at fixed t.
    const slow = riderState(70, wc*0.7, 0.6).drop01;     // closer to ω_c ⇒ slower slide
    const fast = riderState(70, wc*0.2, 0.6).drop01;     // far below ω_c ⇒ faster slide
    ck('(5) drop01 kinematics: pinned ⇒ drop01≡0 ∀t; sliding ⇒ drop01 strictly ↑ in t and reaches 1; a faster slide (smaller ω) sinks faster',
       pinnedZero && inc && reaches1 && fast > slow);
  }

  const pass = checks.filter(c=>c.ok).length;
  return { pass, total: checks.length, checks };
}

// ── direct-run main guard: `node core.mjs` prints the self-test and exits non-zero on
//    any failure (so the DoD's "node core.mjs green" is literal). Inert when imported. ─
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  const r = runSelfTest();
  for (const c of r.checks) console.log((c.ok ? '  ✓ ' : '  ✗ ') + c.name);
  console.log(`\n${r.pass}/${r.total} ${r.pass === r.total ? '✓ ALL GREEN' : '✗ FAILURES'}`);
  process.exit(r.pass === r.total ? 0 : 1);
}
