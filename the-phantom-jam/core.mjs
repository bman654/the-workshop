// ============================================================================
//  THE PHANTOM JAM — the PHANTOM-JAM CORE: the sole authority for the claim
//  "a traffic jam can have no cause." Pure, dependency-free (DOM-free). This
//  module owns the piece's physics:
//
//    • N cars on a one-lane ring road of length L (the Bando Optimal-Velocity
//      Model). State = position xᵢ and speed vᵢ. A car looks ONLY at the gap to
//      the car ahead — its headway hᵢ = wrap(x[i+1] − x[i], L) — and relaxes its
//      speed toward an "optimal velocity" V(h) for that gap. One fixed step:
//          hᵢ  = wrap(x[i+1] − x[i], L)                 (read ALL headways first)
//          vᵢ ← vᵢ + DT·A·( V(hᵢ) − vᵢ )                (then write ALL)
//          xᵢ ← wrap(xᵢ + DT·vᵢ, L)
//      The optimal-velocity curve V(h) = VMAX/2·( tanh((h−HC)/W) + tanh(HC/W) ):
//      crawl when the gap is tight, cruise when it opens. The ONE knob the page
//      turns is DENSITY (N cars at fixed L=50); the ONE disturbance is a single
//      brake TAP on the hero car (index 0).
//
//    • The page SEES this: a top-down brass ring road where a stop-and-go wave
//      blooms from one tap and crawls BACKWARD round the loop, forever, even
//      though every car only ever reacts to the gap ahead. The jam IS the
//      readout — the dark clot of bunched cars and the red smear of brake lights,
//      no graph. Above a critical density the tap blooms; below it (too sparse
//      OR packed too tight) the ring re-heals.
//
//  The page (the-phantom-jam/index.html) inlines a BYTE-TWIN of the PHANTOM-JAM
//  CORE slice between the sentinels below, char-for-char; the Node twin
//  (core.test.mjs) re-extracts that slice and asserts it is identical,
//  re-derives the law at a second seed / different L, and proves the OV-relax
//  update lives in ONE file. The in-page pill and the Node twin both call THIS
//  runPhantomJamSelfTest, so "self-test green" cannot drift between page & source.
//
//  THE ANTI-CIRCULAR SPINE: the stability threshold is DERIVED from the
//  parameters alone — instabilityMargin(N,L) = 2·V'(L/N) − A, positive ⇒ the
//  even-spacing equilibrium is linearly unstable — and the self-test asserts
//  that derived prediction AGREES with the simulation's OBSERVED grow/decay
//  boundary. We never paint "jams above density X" as a hard line: near the
//  band's lower root the linear growth rate → 0, so a finite tap over a finite
//  run may not bloom even where linear theory says unstable. The boundary there
//  is SOFT and run-length-dependent; we claim agreement only in the robust
//  interior + the sharp upper edge. The band is a thing you find on the dial.
// ============================================================================

// ===== PHANTOM-JAM CORE (inlined byte-twin) BEGIN =====
// The estate's mulberry32 PRNG (the same generator murmuration / iron-filings /
// sandpile share). Deterministic: a fixed seed gives a fixed stream of [0,1).
// (Kept for parity with the sibling sims; the ring starts from EXACT even
// spacing — no draws — so the brake tap is the only disturbance.)
function mulberry32(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── The LOCKED Bando OV-model constants. These literals live in EXACTLY this
//    file (the page byte-twins the slice). Independently reproduced — do not
//    change: every measured number in the self-test is keyed to them.
const VMAX = 2;     // top cruising speed (a wide-open gap)
const HC   = 2;     // the comfortable headway the OV curve centres on
const W    = 1;     // how sharply drivers switch from crawl to cruise
const A    = 1;     // the relaxation rate (how hard a car chases its target speed)
const DT   = 0.1;   // the fixed integration step (DT·A = 0.1 ≪ 1 — no overshoot)
const L_DEFAULT = 50;       // the fixed ring length the page holds while density (N) varies
const SEED = 0x9A11;        // the one seed the visible ring + the tests share
const WAVE_REF = -0.58;     // the measured backward wave speed (cells/time) — a CONSTANT, not typed law
// named tolerances — the ONLY literals the self-test compares against (every
// other number it prints is LIVE-measured each run).
const TOL_GROW  = 0.5;      // CRUX-1: a bloomed jam's spacing variance clears this
const TOL_DECAY = 1e-3;     // CRUX-2: a decayed ring's variance falls under this
const TOL_WAVE  = 0.05;     // CRUX-3: measured wave speed sits within this of WAVE_REF
const GUARD     = 0.3;      // CRUX-4: |margin| must exceed this to be classified (the soft fringe is SKIPPED)

const TAU = Math.PI * 2;
function sech(x){ return 1 / Math.cosh(x); }
// wrap a coordinate / a separation into [0, L) — the ring's periodic geometry.
function wrap(x, L){ x = x % L; if (x < 0) x += L; return x; }

// V(h) — the OPTIMAL-VELOCITY curve: the speed a lone driver would settle to for
// a steady gap h. Crawl near 0, rising through HC, saturating at VMAX. The SOLE
// V authority; the render reads target speeds from THIS, never re-typing tanh.
function V(h){ return VMAX / 2 * ( Math.tanh((h - HC) / W) + Math.tanh(HC / W) ); }
// V'(h) — its slope (sech²), the SENSITIVITY of desired speed to the gap. The
// instability margin leans on this: a steep V' means a small gap-change provokes
// a big speed-change, and the chain of cars amplifies it.
function V_prime(h){ return VMAX / (2 * W) * sech((h - HC) / W) ** 2; }

// headway(x, i, N, L) → the gap from car i to the car ahead (i+1, wrapped). The
// SOLE place the "look only at the gap ahead" rule is written; step() and the
// render both read through it.
function headway(x, i, N, L){ return wrap(x[(i + 1) % N] - x[i], L); }

// makeRing(N, L, seed) → the live ring struct, started from EXACT even spacing
// at the equilibrium speed V(L/N): every car xᵢ = i·(L/N), vᵢ = V(L/N). This is
// a fixed point of step() — a perfectly smooth ring stays smooth (spacing
// variance is machine-flat) until something taps it. The byte-twin MUST build
// through makeRing so the page and the tests share the exact same ring.
function makeRing(N, L, seed){
  const rng = mulberry32((seed == null ? SEED : seed) >>> 0);
  const x = new Float64Array(N), v = new Float64Array(N);
  const hStar = L / N, vEq = V(hStar);
  for (let i = 0; i < N; i++){ x[i] = i * hStar; v[i] = vEq; }
  return { N, L, x, v, rng };
}

// ONE fixed Bando OV step → mutates AND returns the same struct. Read ALL
// headways from the OLD positions, THEN write all speeds and positions (like the
// murmuration step's read-all-then-write), so the order of cars in the i-loop
// does not bias the update. For each car i: relax the speed toward V(hᵢ) at rate
// A (semi-implicit/ballistic Euler — DT·A ≪ 1, deterministic, never overshoots),
// then advance the position by DT·vᵢ and wrap onto the ring. This is the SOLE
// integrator; the live RAF page steps this exact step() so the watched ring is
// byte-true to the Node test's fixed step count.
function step(st){
  const { N, L, x, v } = st;
  const h = new Float64Array(N);
  for (let i = 0; i < N; i++) h[i] = wrap(x[(i + 1) % N] - x[i], L);   // read all headways
  for (let i = 0; i < N; i++){
    v[i] += DT * A * (V(h[i]) - v[i]);                                  // relax toward optimal V
    x[i] = wrap(x[i] + DT * v[i], L);                                  // advance + wrap
  }
  return st;
}

// brake(st, idx, frac) → a ONE-SHOT velocity dip on car idx: vᵢ ← max(0,
// vᵢ·(1−frac)). The page's "TAP THE BRAKES" calls brake(st, 0, 0.5). Momentary,
// re-pressable — NEVER a sustained force. Above critical density this one tap is
// enough to seed a jam that grows; below it the ring swallows it.
function brake(st, idx, frac){ st.v[idx] = Math.max(0, st.v[idx] * (1 - frac)); return st; }

// ── DERIVED stability (parameters → prediction, the anti-circular spine; NOT
//    read back from the sim). instabilityMargin(N,L) = 2·V'(L/N) − A: at the
//    even-spacing equilibrium h* = L/N, the long-wave linear stability condition
//    is 2·V'(h*) < A. So margin > 0 ⇒ linearly UNSTABLE (one tap blooms), its
//    magnitude the vigour of the instability; margin < 0 ⇒ STABLE (the ring
//    heals). The render's stable/UNSTABLE word reads THIS — never a re-typed 2V'.
function instabilityMargin(N, L){ return 2 * V_prime(L / N) - A; }
// unstableBand() → the [h⁻, h⁺] window of headways where margin > 0, solved from
// 2·V'(h) = A: sech²((h−HC)/W) = A·W/VMAX ⇒ |h − HC| = W·acosh(√(VMAX/(A·W))).
// Headways inside this band are jam-prone; outside (too sparse OR too tight),
// the slope V' is gentle enough that the chain damps. Two-sided — the surprise.
function unstableBand(){
  const z = W * Math.acosh(Math.sqrt(VMAX / (A * W)));
  return [HC - z, HC + z];
}

// ── MEASUREMENT helpers (self-test ONLY — never the live RAF; they iterate the
//    ring thousands of steps and would stall a frame). Each reads the ring, none
//    hardcode a result.
// spacingVariance(st) → variance of the N headways. 0 ⇒ perfectly even (smooth
// flow); large ⇒ some gaps are clots and some are voids (a jam). The headline
// grow/decay signal.
function spacingVariance(st){
  const { N, L, x } = st;
  let mean = 0; const h = new Float64Array(N);
  for (let i = 0; i < N; i++){ h[i] = wrap(x[(i + 1) % N] - x[i], L); mean += h[i]; }
  mean /= N;
  let s = 0; for (let i = 0; i < N; i++){ const d = h[i] - mean; s += d * d; }
  return s / N;
}
// maxMinGap(st) → (largest headway − smallest headway): the visible amplitude of
// the jam, the spread between the empty road ahead of the clot and the bumper-to-
// bumper crush inside it.
function maxMinGap(st){
  const { N, L, x } = st;
  let mn = Infinity, mx = -Infinity;
  for (let i = 0; i < N; i++){ const h = wrap(x[(i + 1) % N] - x[i], L); if (h < mn) mn = h; if (h > mx) mx = h; }
  return mx - mn;
}
// minHeadwayCell(st) → the index of the car with the SMALLEST gap ahead: the
// nose of the jam (the most bunched car). The render's wave chevron and the wave-
// speed measurement both track THIS one cell so the picture and the proof share
// one tracker and cannot contradict.
function minHeadwayCell(st){
  const { N, L, x } = st;
  let mn = Infinity, mi = 0;
  for (let i = 0; i < N; i++){ const h = wrap(x[(i + 1) % N] - x[i], L); if (h < mn){ mn = h; mi = i; } }
  return mi;
}
// meanVel(st) → average speed (a wholeness check; constant flux ≈ N·v on the ring).
function meanVel(st){ let s = 0; for (let i = 0; i < st.N; i++) s += st.v[i]; return s / st.N; }

// settle(N, L, seed, steps) → a ring stepped `steps` times from even spacing with
// NO tap (it stays a fixed point). Used to show varStart is machine-flat.
function settle(N, L, seed, steps){
  const st = makeRing(N, L, seed);
  for (let t = 0; t < steps; t++) step(st);
  return st;
}
// growDecay(N, L, seed, {settle, run}) → settle the smooth ring, record varStart,
// TAP the brake once on car 0, run, and report whether the spacing variance grew
// (a jam bloomed) or decayed (the ring healed). The grow/decay decider.
function growDecay(N, L, seed, opts){
  const set = opts && opts.settle != null ? opts.settle : 50;
  const run = opts && opts.run != null ? opts.run : 4000;
  const st = makeRing(N, L, seed);
  for (let t = 0; t < set; t++) step(st);
  const varStart = spacingVariance(st);
  brake(st, 0, 0.5);
  for (let t = 0; t < run; t++) step(st);
  return { varStart, varEnd: spacingVariance(st), gap: maxMinGap(st) };
}

// waveSpeed(N, L, seed) → the speed of the jam round the ring, in cells/time.
// Settle (50), tap, MATURE (6000 steps to a clean travelling wave), then track
// the nose cell (minHeadwayCell) UNWRAPPED across the ring seam over an 8000-step
// window (a jump of more than N/2 cells is the index wrapping, not the jam
// teleporting), and least-squares the unwrapped index vs step → cells/step,
// scaled by 1/DT → cells/time. The load-bearing sign is NEGATIVE: the jam crawls
// BACKWARD, against the flow of cars.
function waveSpeed(N, L, seed){
  const st = makeRing(N, L, seed);
  for (let t = 0; t < 50; t++) step(st);
  brake(st, 0, 0.5);
  for (let t = 0; t < 6000; t++) step(st);                 // mature into a travelling wave
  const WINDOW = 8000;
  let prev = minHeadwayCell(st), unwrapped = prev;
  let sumT = 0, sumC = 0, sumTT = 0, sumTC = 0, n = 0;
  for (let t = 0; t < WINDOW; t++){
    step(st);
    const c = minHeadwayCell(st);
    let d = c - prev;
    if (d > N / 2) d -= N; else if (d < -N / 2) d += N;     // unwrap the ring seam
    unwrapped += d; prev = c;
    sumT += t; sumC += unwrapped; sumTT += t * t; sumTC += t * unwrapped; n++;
  }
  const slopePerStep = (n * sumTC - sumT * sumC) / (n * sumTT - sumT * sumT);
  return slopePerStep / DT;                                 // cells/step → cells/time
}

// ── runPhantomJamSelfTest() — the SOLE ORACLE. Same shape as the sibling
//    benches: { pass, total, lines:[{name, ok, detail}] }. The in-page pill and
//    the Node twin both call THIS so they cannot disagree. Every detail carries
//    LIVE measured numbers; only the named tolerances are literals — NEVER a
//    precise critical density (the boundary's lower root is soft).
function runPhantomJamSelfTest(){
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });

  // CRUX-1 — A TAP BLOOMS (instability/growth above critical density). N=22 at
  //   L=50 sits deep in the unstable interior (h*=2.27, margin 0.86). The smooth
  //   ring is machine-flat (varStart < 1e-12); one brake tap blooms a jam whose
  //   spacing variance clears TOL_GROW and whose gap-spread clears 1.0.
  {
    const st = settle(22, L_DEFAULT, SEED, 50);
    const varStart = spacingVariance(st);
    const gd = growDecay(22, L_DEFAULT, SEED, { settle: 50, run: 4000 });
    const ok = varStart < 1e-12 && gd.varEnd > TOL_GROW && gd.gap > 1.0;
    T('CRUX-1 — one tap blooms: at a jam-prone density (N=22, L=50, gap h*=2.27, margin 0.86) the smooth ring is machine-flat (varStart < 1e-12) and a SINGLE brake tap on one car blooms a stop-and-go jam — spacing variance clears TOL_GROW and the gap-spread clears 1.0',
      ok, `varStart ${varStart.toExponential(2)} (tol 1e-12) · varEnd ${gd.varEnd.toFixed(3)} > ${TOL_GROW} · gap ${gd.gap.toFixed(3)} > 1.0`);
  }

  // CRUX-2 — NEG-CONTROL, BOTH sides (the two-sided window). The SAME tap at a
  //   SPARSE density (N=14, h*=3.57, margin −0.68) decays AND at a PACKED density
  //   (N=46, h*=1.087, margin −0.044) ALSO decays — the window is two-sided: pack
  //   too tight and the ring re-heals. Same model, same tap, only density changed.
  {
    const sparse = growDecay(14, L_DEFAULT, SEED, { settle: 50, run: 4000 });
    const packed = growDecay(46, L_DEFAULT, SEED, { settle: 50, run: 4000 });
    const ok = sparse.varEnd < TOL_DECAY && packed.varEnd < TOL_DECAY;
    T('CRUX-2 — neg-control, both sides: the SAME tap decays when the road is too SPARSE (N=14, margin −0.68) AND when it is packed too TIGHT (N=46, margin −0.044) — the jam-prone band is two-sided, the ring re-heals at both ends (varEnd < TOL_DECAY); only the density changed',
      ok, `sparse varEnd ${sparse.varEnd.toExponential(2)} · packed varEnd ${packed.varEnd.toExponential(2)} (both < ${TOL_DECAY})`);
  }

  // CRUX-3 — THE BACKWARD WAVE IS A CONSTANT. Measure the jam's speed at two
  //   jam-prone densities/seeds: both NEGATIVE (the load-bearing backward sign)
  //   and both within TOL_WAVE of WAVE_REF = −0.58 cells/time. The clot crawls
  //   the WRONG way round the loop while every car drives forward.
  {
    const s1 = waveSpeed(22, L_DEFAULT, SEED);
    const s2 = waveSpeed(24, L_DEFAULT, SEED + 1);
    const ok = s1 < 0 && s2 < 0 && Math.abs(s1 - WAVE_REF) < TOL_WAVE && Math.abs(s2 - WAVE_REF) < TOL_WAVE;
    T('CRUX-3 — the jam crawls backward at a fixed speed: at two jam-prone densities the wave speed is NEGATIVE (it moves against the cars) and lands within TOL_WAVE of the constant WAVE_REF = −0.58 cells/time — the cars drive forward, the jam drifts back',
      ok, `s1 ${s1.toFixed(3)} · s2 ${s2.toFixed(3)} · |Δ| < ${TOL_WAVE} of ${WAVE_REF}`);
  }

  // CRUX-4 — THE DERIVED THRESHOLD AGREES WITH THE OBSERVED BOUNDARY (the anti-
  //   circular heart). Scan N=14..48 at L=50. Classify each by instabilityMargin
  //   with GUARD=0.3 (margin > GUARD ⇒ predict UNSTABLE; margin < −GUARD ⇒ predict
  //   STABLE; else SKIP the soft fringe). The OBSERVED label is growDecay's
  //   varEnd > 1e-2 ? GREW : DECAYED at run=8000. Assert (predicted UNSTABLE) ===
  //   (observed GREW) for EVERY classified density — the parameters foretell the
  //   sim. GUARD=0.3/run=8000 excludes the soft lower-root fringe exactly.
  {
    let checked = 0, mismatches = 0, edge = '';
    for (let N = 14; N <= 48; N++){
      const m = instabilityMargin(N, L_DEFAULT);
      let predUnstable;
      if (m > GUARD) predUnstable = true; else if (m < -GUARD) predUnstable = false; else continue;  // skip the soft fringe
      const obsGrew = growDecay(N, L_DEFAULT, SEED, { settle: 50, run: 8000 }).varEnd > 1e-2;
      checked++;
      if (predUnstable !== obsGrew) mismatches++;
    }
    // the sharp UPPER edge: theory's interior begins at N=18; the sim flips
    // decay(N=17) → grow(N=18) exactly there.
    const grew17 = growDecay(17, L_DEFAULT, SEED, { settle: 50, run: 8000 }).varEnd > 1e-2;
    const grew18 = growDecay(18, L_DEFAULT, SEED, { settle: 50, run: 8000 }).varEnd > 1e-2;
    edge = `edge: N=17 ${grew17 ? 'GREW' : 'decayed'} · N=18 ${grew18 ? 'GREW' : 'decayed'}`;
    const ok = checked >= 20 && mismatches === 0 && !grew17 && grew18;
    T('CRUX-4 — the derived threshold foretells the sim: across N=14..48 (22 classified densities, the soft fringe skipped at GUARD=0.3) the parameter-only prediction instabilityMargin = 2·V′(L/N) − A AGREES with the observed grow/decay boundary every time, and the sharp upper edge flips decay→grow exactly where the band predicts (N=17→N=18)',
      ok, `${checked} densities classified, ${mismatches} mismatches · ${edge}`);
  }

  let pass = 0; for (const l of lines) if (l.ok) pass++;
  return { pass, total: lines.length, lines };
}
// ===== PHANTOM-JAM CORE END =====

export {
  mulberry32, makeRing, step, headway, brake, V, V_prime, wrap, sech,
  unstableBand, instabilityMargin, spacingVariance, maxMinGap, minHeadwayCell,
  meanVel, settle, growDecay, waveSpeed, runPhantomJamSelfTest,
  VMAX, HC, W, A, DT, L_DEFAULT, SEED, WAVE_REF, TOL_GROW, TOL_DECAY, TOL_WAVE, GUARD, TAU,
};
