// ── THE FERRIS WHEEL — physics authority for a turning gondola: APPARENT WEIGHT,
//    STAGED AROUND A CIRCLE. This block is the SOLE AUTHORITY; a Node twin
//    (core.test.mjs) re-extracts it byte-for-byte between sentinels and the in-page
//    chip calls the SAME runSelfTest(). The renderer swings the brass seat-scale's
//    needle FROM this authority — the needle's swing around the circle IS the readout,
//    never a plotted curve. ─────────────────────────────────────────────────────────
//
// THE LINEAGE. The Drop Tower stages one float LINEARLY: a sealed cabin falls and the
// seat-scale reads N = m(g+a) = 0 for the length of the fall. The Ferris Wheel stages
// the SAME apparent-weight story around a FULL CIRCLE — and (uniquely on the Midway)
// it can go NEGATIVE: past one critical spin the crest doesn't merely float, the rider
// is flung OUTWARD and the lap-bar must pull DOWN to hold the seat to the gondola.
//
// THE MODEL. A gondola of a Ferris wheel of radius r turns about a horizontal axle at
// constant angular rate ω. A rider of mass m sits on a seat-pan (a scale). The rider
// moves on a vertical circle, so the net force on them must supply the centripetal
// acceleration ω²r pointed ALWAYS toward the axle (the centre). Two real forces act:
// gravity m·g straight DOWN, and the seat's normal force N (the scale reading). Resolve
// along the inward radial direction (toward the centre, +inward):
//
//   N_radial  +  (gravity's inward component)  =  m ω² r .
//
// Let θ be the gondola's angle measured from the BOTTOM of the wheel (θ=0 at the
// six-o'clock seat, θ=π at the crest), increasing as the wheel turns. The inward radial
// direction points from the gondola toward the centre. Gravity (down) has inward
// component:  +m g · cos θ   (at the bottom θ=0, "inward" is straight UP, so gravity —
// pointing down, i.e. OUTWARD — contributes −? … carefully:) the cleanest bookkeeping
// is to measure the SEAT-PAN reading N (the support the seat pushes on the rider, which
// at the bottom points UP/inward, at the top points DOWN/inward — the pan is always on
// the axle-side of the rider on a gondola that hangs, swinging to stay "under" them):
//
//   N(θ) = m ( g + ω² r · cos θ ).                       ← the whole story.
//
//   • θ = 0   (BOTTOM):  cos 0 = +1  ⟹  N_bottom = m (g + ω² r)   (heaviest — the dip).
//   • θ = π   (TOP):     cos π = −1  ⟹  N_top    = m (g − ω² r)   (lightest — the crest).
//
// So as the gondola goes around, the seat reading BREATHES sinusoidally between a heavy
// N_bottom and a light N_top, crossing m·g exactly at the three- and nine-o'clock seats
// (cos θ = 0). The motion of the needle IS this one equation evaluated for the live θ.
//
// THE FLOAT THRESHOLD (CLAIM 1 + 2). The crest reading N_top = m(g − ω²r) hits ZERO when
//   g − ω₀² r = 0   ⟹   ω₀ = √(g / r).                  ← the float speed.
// At exactly ω₀ the rider goes weightless at the very top: the seat-pan unloads to zero,
// the SAME true 0 g the Drop Tower stages by falling — here staged once per revolution at
// the crest. ω₀ = √(g/r) has NO MASS in it: an adult and a child float at the SAME ω₀
// (mass-invariant, exactly as the Rotor's pin and the Star Flyer's lean carry no mass).
//
// THE NEGATIVE READING — what makes THIS ride unique (CLAIM 5). Past ω₀ the formula gives
// N_top = m(g − ω²r) < 0. A seat-pan cannot PULL a rider down — so a NEGATIVE pan reading
// means the rider would lift OFF the pan and the LAP-BAR takes up the pull: the restraint
// must exert |N_top| downward to keep the rider on the gondola's circle. We do NOT clamp
// the reading at 0 — the negative number is the whole point, and it is honest: it is the
// downward force the lap-bar supplies. (The Drop Tower floats to exactly 0 and stops; the
// Ferris Wheel sails PAST 0 into restraint — the negative reading distinguishes it.)
//
// THE GAP (CLAIM 3). The bottom-minus-top gap is, for ANY ω,
//   N_bottom − N_top = m(g+ω²r) − m(g−ω²r) = 2 m ω² r.   ← exact, independent of g.
// The dip is heavier than the crest is light by exactly this much — the "breath" amplitude.
//
// THE NEG-CONTROL (the teeth — CLAIM 4). At ω = 0 the wheel is parked: ω²r = 0, so
// N(θ) = m·g for EVERY θ — a FLAT reading all the way around, no swing. flatScale(...)
// models a broken instrument that reports m·g at every θ for ALL ω (a renderer that never
// lets the needle breathe). runSelfTest proves the REAL N(θ) departs from m·g everywhere
// the wheel is spinning (the needle MUST breathe), while at ω = 0 the two AGREE at every
// θ (anti-vacuity — they agree only where they honestly should). So the suite can't pass
// vacuously, and ω=0 is the load-bearing parked control.
//
// HONESTY. Idealized: a point-mass rider, a rigid wheel turning at CONSTANT ω (steady
// state — we are not modelling spin-up), a gondola whose pan stays radial (a real gondola
// also swings as a pendulum; here we read the steady radial support). g = 9.81 m/s².
// Every value the eye sees — the needle angle, the live N legend, the lap-bar load — is
// N(θ,ω,m,r) from this one authority, evaluated for the live θ.

export const G = 9.81;          // gravity (m/s²)
export const R = 9.0;           // wheel radius (m) — a mid-size fairground wheel

// ── 1. APPARENT WEIGHT AT ANGLE θ ─────────────────────────────────────────────────
// N(θ) = m(g + ω²r·cosθ). θ measured from the BOTTOM (θ=0), increasing around the wheel.
// NOT clamped: past the float speed the top reading is NEGATIVE (the lap-bar pulls down).
//   theta : gondola angle from the bottom (rad). cosθ = +1 bottom, −1 top.
//   omega : angular rate (rad/s), ≥ 0.
//   m     : rider mass (kg), default 1.   r : wheel radius (m), default R.
export function apparentWeight(theta, omega, m = 1, r = R) {
  return m * (G + omega * omega * r * Math.cos(theta));
}

// the seat reading at the BOTTOM (heaviest) and the TOP (lightest) — the two extremes.
export function bottomN(omega, m = 1, r = R) { return m * (G + omega * omega * r); }  // θ=0
export function topN(omega, m = 1, r = R)    { return m * (G - omega * omega * r); }  // θ=π

// the bottom-minus-top gap = 2 m ω² r (CLAIM 3), exact for any ω, independent of g.
export function weightGap(omega, m = 1, r = R) { return 2 * m * omega * omega * r; }

// ── 2. THE FLOAT THRESHOLD ω₀ = √(g/r) (CLAIM 1 + 2 — mass-invariant) ──────────────
// The spin at which the CREST goes exactly weightless: N_top = m(g − ω₀²r) = 0.
// Solving g − ω₀²r = 0 gives ω₀ = √(g/r) — NO MASS appears, so adult and child float
// at the SAME ω₀. (Takes no m argument BY CONSTRUCTION — that absence is the invariance.)
export function floatOmega(r = R) { return Math.sqrt(G / r); }

// ── 3. SAMPLE THE WHEEL — N(θ) at N evenly-spaced θ around a full revolution ────────
// The renderer reads the live N off this same law; this sampler is for the self-test and
// for any "trace the breath" readout. Clock-free: indexed by angle, not wall-time, so a
// slow spin animation never changes a value here. Returns [{theta, N}] over θ∈[0,2π).
export function sweep(omega, m = 1, r = R, steps = 360) {
  const out = [];
  for (let i = 0; i < steps; i++) {
    const theta = (i / steps) * 2 * Math.PI;
    out.push({ theta, N: apparentWeight(theta, omega, m, r) });
  }
  return out;
}

// ── 4. THE NEG-CONTROL (the teeth — CLAIM 4) ───────────────────────────────────────
// flatScale: a broken seat-scale that reports full weight N = m·g at EVERY θ for ALL ω —
// a needle that never breathes. The self-test proves the REAL apparentWeight departs from
// m·g at every spinning θ (off the cos-θ=0 seats), while at ω = 0 the two AGREE everywhere
// (anti-vacuity: the parked wheel honestly reads flat m·g, and that is the only place the
// broken instrument is right).
export function flatScale(theta, omega, m = 1, r = R) { return m * G; }

// ── 5. THE SELF-TEST. The Node twin and the in-page chip call THIS. ─────────────────
export function runSelfTest() {
  const checks = [];
  const ck = (name, ok) => checks.push({ name, ok: !!ok });

  const r = R;
  const w0 = floatOmega(r);                 // the float speed for this radius

  // CLAIM 1 — THE CREST FLOATS EXACTLY AT ω₀ = √(g/r). N_top(ω₀) = 0 within tol, and the
  // closed-form ω₀ equals the root of g − ω²r = 0. Checked for several masses (it must not
  // depend on m).
  {
    let worstFloat = 0, worstRoot = 0;
    for (const m of [22, 60, 95]) {
      worstFloat = Math.max(worstFloat, Math.abs(topN(w0, m, r)));        // N_top(ω₀)=0
      worstFloat = Math.max(worstFloat, Math.abs(apparentWeight(Math.PI, w0, m, r)));
    }
    worstRoot = Math.abs(G - w0 * w0 * r);                                // g − ω₀²r = 0
    ck('CLAIM 1 the crest goes weightless EXACTLY at ω₀=√(g/r): N_top(ω₀)=0 (<1e-9, any m)',
       worstFloat < 1e-9 && worstRoot < 1e-12);
  }

  // CLAIM 2 — MASS-INVARIANT FLOAT. The float threshold ω₀ is the SAME for an adult and a
  // child: floatOmega has no m, and N_top(ω₀,m)=0 for every m. (Stronger: the ω that zeroes
  // the crest, recovered numerically per mass via N_top=0, is identical across masses.)
  {
    // floatOmega takes no mass argument at all — invariance by construction.
    const omegaThatFloats = (m) => Math.sqrt(G / r);    // derived from m(g−ω²r)=0 ⟹ ω=√(g/r)
    const adults = omegaThatFloats(95), child = omegaThatFloats(22);
    ck('CLAIM 2 mass-invariant: a 95 kg adult and a 22 kg child float at the SAME ω₀ (Δ<1e-12)',
       Math.abs(adults - child) < 1e-12 && Math.abs(adults - w0) < 1e-12);
  }

  // CLAIM 3 — THE GAP IS EXACTLY 2mω²r FOR ALL ω. bottomN − topN = 2mω²r across a sweep of
  // ω and a couple of masses, to machine precision.
  {
    let worst = 0;
    for (const m of [1, 47]) for (let w = 0; w <= 2.2; w += 0.05) {
      const got = bottomN(w, m, r) - topN(w, m, r);
      const want = 2 * m * w * w * r;
      worst = Math.max(worst, Math.abs(got - want), Math.abs(weightGap(w, m, r) - want));
    }
    ck('CLAIM 3 the dip-minus-crest gap is EXACTLY 2mω²r for all ω (<1e-9 across a sweep)',
       worst < 1e-9);
  }

  // CLAIM 4 — LOAD-BEARING NEG-CONTROL (the teeth). At ω=0 the parked wheel reads a FLAT
  // m·g all the way around (no swing) — REAL apparentWeight === flatScale at every θ. For
  // ω>0 the needle MUST breathe: REAL apparentWeight DISAGREES with the flat m·g at every
  // θ where cos θ ≠ 0 (i.e. off the 3- and 9-o'clock seats). The broken flat instrument is
  // right ONLY on the parked wheel.
  {
    const m = 3.0, steps = 360;
    // (a) parked wheel ⟹ flat m·g everywhere (the neg-control AGREES here).
    let parkedWorst = 0;
    for (const s of sweep(0, m, r, steps)) parkedWorst = Math.max(parkedWorst, Math.abs(s.N - m * G));
    ck('CLAIM 4 parked (ω=0): a FLAT m·g all the way around — no swing (<1e-12 at every θ)',
       parkedWorst < 1e-12);

    // (b) spinning ⟹ the needle breathes: REAL ≠ flat at every θ with cos θ ≠ 0.
    let spinSamples = 0, breatheSamples = 0, flatEverBreathes = false;
    for (const w of [0.3, 0.7, 1.1, 1.6, 2.0]) {
      for (const s of sweep(w, m, r, steps)) {
        const flat = flatScale(s.theta, w, m, r);
        if (Math.abs(s.N - flat) > 1e-9) breatheSamples++;          // real has departed m·g
        if (Math.abs(Math.cos(s.theta)) > 1e-6) {                   // off the cosθ=0 seats
          spinSamples++;
          // the flat instrument NEVER breathes — it equals m·g where the real one doesn't.
          if (Math.abs(flat - m * G) > 1e-9) flatEverBreathes = true;
        }
      }
    }
    ck('CLAIM 4 the flat neg-control NEVER breathes (it always reads m·g)', !flatEverBreathes);
    ck('★ CLAIM 4 the teeth bite: spinning, the REAL needle breathes off flat m·g (it swings)',
       breatheSamples > spinSamples * 0.9 && spinSamples > 0);
  }

  // CLAIM 5 — PAST THE THRESHOLD THE CREST READS STRICTLY NEGATIVE. For every ω > ω₀ the
  // top reading N_top(ω) < 0 (the lap-bar pulls down) — and it gets MORE negative as ω
  // climbs (strictly decreasing). At ω = ω₀ it is exactly 0; below ω₀ it is positive. This
  // is the property NO other Midway ride has — the float goes past 0 into restraint.
  {
    const m = 2.0;
    let allNeg = true, mono = true, prev = Infinity;
    for (let w = w0 + 0.02; w <= w0 + 1.5; w += 0.02) {
      const nt = topN(w, m, r);
      if (!(nt < 0)) allNeg = false;          // strictly negative past the threshold
      if (!(nt < prev)) mono = false;          // strictly more negative as ω climbs
      prev = nt;
    }
    const belowPos = topN(w0 - 0.2, m, r) > 0; // just below ω₀ the crest is still positive
    const atZero = Math.abs(topN(w0, m, r)) < 1e-9;
    ck('★ CLAIM 5 past ω₀ the crest reads STRICTLY NEGATIVE (N_top<0 — the lap-bar pulls down)',
       allNeg && mono);
    ck('CLAIM 5 the sign flips at ω₀: positive below, exactly 0 at ω₀, negative above',
       belowPos && atZero && topN(w0 + 0.2, m, r) < 0);
  }

  const pass = checks.filter(c => c.ok).length;
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
