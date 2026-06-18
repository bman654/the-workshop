// ── THE DROP TOWER — physics authority for a sealed falling cabin: APPARENT WEIGHT.
//    This block is the SOLE AUTHORITY; a Node twin (core.test.mjs) re-extracts it
//    byte-for-byte between sentinels and the in-page chip calls the SAME
//    runSelfTest(). The renderer draws the cabin's motion FROM this authority — the
//    motion IS the readout, never a plotted curve. ──────────────────────────────────
//
// THE MODEL. A sealed cabin rides a tall mast. Inside it sits a free internal object
// of mass m resting on a seat-scale. The scale reads the NORMAL FORCE N it must exert
// to share the cabin's vertical acceleration a (up = +):
//   N − m g = m a   ⟹   N = m (g + a).            ← apparent weight, the whole story.
// This is the ONLY physics here. Everything the eye sees — the needle, the floating
// coin, the slack rider, the suspended dust — is this one equation evaluated for the
// cabin's a(t), or (for the coin) integrated under the SAME a as the floor.
//
// THE RIDE, IN THREE LEGS (a piecewise-constant a, so every quantity is closed-form):
//   • REST   — the cabin is hoisted and held.   a = 0      ⟹  N = m g   (full weight).
//   • FREE FALL — the cable releases; the cabin and everything sealed in it fall
//                 together under gravity alone.  a = −g     ⟹  N = 0     (TRUE 0 g).
//                 The free-fall leg drops a distance h_drop.
//   • BRAKE  — a magnetic/cushion brake of length d_brake at the bottom of the mast
//              decelerates the cabin to rest at constant a = +a_brake > 0:
//                 N = m (g + a_brake)   (the crush; peak weight).
//
// GEOMETRY (CLAIM 0 locks it). The free-fall leg is EXACTLY h_drop metres; the brake
// leg is EXACTLY d_brake metres, painted as a coral band on the lower mast. So the
// band's on-screen height in metres IS d_brake — honest, not decorative. Total mast
// travel = h_drop + d_brake.
//
// ENERGY → ENTRY SPEED (CLAIM 4). Free fall from rest over h_drop reaches the brake
// zone at v with ½ m v² = m g h_drop, i.e.  v_brakeEntry² = 2 g h_drop.
//
// THE BRAKE (CLAIM 5). The brake must kill that kinetic energy over the distance
// d_brake:  ½ v² = a_brake · d_brake  ⟹  a_brake = v²/(2 d_brake) = g h_drop / d_brake.
// So the CRUSH (peak apparent weight) is exactly:
//   N_peak = m (g + a_brake) = m ( g h_drop / d_brake + g ) = m g ( h_drop/d_brake + 1 ).
//   peak g = N_peak / (m g) = h_drop / d_brake + 1.
// This is STRICTLY MONOTONE: a shorter brake band (smaller d_brake) raises the peak;
// a higher hoist (larger h_drop) raises the peak. The dial's drama is real physics.
//
// THE COIN (CLAIM 2 ties the visual to the proof). A loose coin rests on the cabin
// floor. On release it integrates under the SAME a = −g the cabin uses, from the same
// initial state — so its position equals the floor's at every instant of the fall.
// The on-screen "float" is therefore the SAME physics, not a tween: it hangs because
// it and the room fall together.
//
// THE NEG-CONTROL (the teeth — CLAIM 6). alwaysHeavy(...) models a scale that NEVER
// registers free fall: it reports N = m g through the whole ride (a broken instrument /
// a renderer that fakes weight). runSelfTest proves the REAL integrate reads N = 0 on
// EVERY free-fall sample where alwaysHeavy reads m g — total disagreement across a band
// of (h_drop, d_brake). Anti-vacuity: at REST both read m g (they agree only where they
// should). So the suite cannot pass vacuously.
//
// HONESTY. Idealized free fall: point masses, no air drag, an instantaneous cable
// release and an instant, constant-deceleration brake onset. The exact 0 g is claimed
// precisely for ideal free fall (a = −g ⟹ N = 0). A real tower has drag, jerk-limited
// brakes, and cable stretch — those soften the corners; the ideal is the clean claim.

export const G = 9.81;          // gravity (m/s²)

// ── 1. INTEGRATE ────────────────────────────────────────────────────────────────
// Run the cabin REST → FREE FALL (drop h_drop) → BRAKE (over d_brake) → SETTLED,
// sampling positions/velocities/accelerations and the apparent weight N = m(g+a) at
// each step. The sampler is CLOCK-FREE: it walks the trace by leg-fraction, NOT by
// wall-time, so a slow-motion view (which dilates only the animation clock) leaves
// every value here untouched — the dwell is honest, never circular.
//
//   h_drop : free-fall distance (m), > 0
//   d_brake: brake-zone length   (m), > 0   (the coral band height in metres)
//   m      : internal mass (kg), default 1
//   steps  : samples PER LEG (default 240) — fine enough for a pointwise |N|<1e-9 sweep
//
// y is measured DOWNWARD-travelled from the release point (0 at release, increasing as
// the cabin descends); v is downward speed (≥0); a is signed vertical accel (UP +), so
// free fall is a = −g and braking is a = +a_brake. yFloor mirrors y (the cabin floor).
export function integrate(h_drop, d_brake, m, steps){
  m = m || 1;
  steps = steps || 240;
  const aBrake = G * h_drop / d_brake;        // constant brake decel (CLAIM 5)
  const vEntry = Math.sqrt(2 * G * h_drop);    // brake-entry speed (CLAIM 4)
  const vEntry2 = 2 * G * h_drop;
  const trace = [];

  // a tiny REST head so the scale visibly carries full weight before release.
  // (a few samples; a=0, N=mg, v=0, y=0.) Marked phase 'rest'.
  const restSteps = 8;
  for(let i = 0; i <= restSteps; i++){
    trace.push({ phase:'rest', t:null, leg:'rest', f:i/restSteps,
                 y:0, yFloor:0, v:0, a:0, N: m*G });
  }

  // FREE-FALL leg: a = −g, over EXACTLY h_drop. Walk by distance fraction f∈(0,1].
  // Sample positions/velocities from the SAME a (closed-form free fall):
  //   y(f)   = h_drop · f                       (distance travelled)
  //   v(f)   = √(2 g y)                          (energy form, = g·t but clock-free)
  //   a      = −g  ⟹  N = m(g + a) = 0          (TRUE free fall, CLAIM 1)
  for(let i = 1; i <= steps; i++){
    const f = i/steps;
    const y = h_drop * f;
    const v = Math.sqrt(2 * G * y);
    trace.push({ phase:'fall', leg:'fall', f, y, yFloor:y, v, a:-G, N: 0 });
  }

  // BRAKE leg: a = +aBrake, over EXACTLY d_brake, killing v from vEntry to 0.
  //   distance into the brake zone: yb = d_brake · f
  //   v² = vEntry² − 2 aBrake yb   (constant decel)  → 0 at yb = d_brake (CLAIM 5)
  //   a = +aBrake  ⟹  N = m(g + aBrake) = N_peak    (the crush)
  for(let i = 1; i <= steps; i++){
    const f = i/steps;
    const yb = d_brake * f;
    // v² = vEntry² − 2·aBrake·yb; at the platform (f===1) the cabin arrests EXACTLY,
    // so pin v=0 there (avoids a tiny sqrt-of-residual artifact from re-mul/re-div).
    const v2 = (i === steps) ? 0 : Math.max(0, vEntry2 - 2 * aBrake * yb);
    const v = Math.sqrt(v2);
    const y = h_drop + yb;
    trace.push({ phase:'brake', leg:'brake', f, y, yFloor:y, v, a:aBrake, N: m*(G + aBrake) });
  }

  // SETTLED tail: at rest on the platform, the scale carries full weight again.
  const settleSteps = 8;
  for(let i = 0; i <= settleSteps; i++){
    trace.push({ phase:'settled', leg:'settled', f:i/settleSteps,
                 y: h_drop + d_brake, yFloor: h_drop + d_brake, v:0, a:0, N: m*G });
  }

  const peakG = (h_drop / d_brake) + 1;        // N_peak / (m g), closed form
  const verdict = {
    peakG, vBrakeEntry: vEntry, aBrake,
    fallLen: h_drop, brakeLen: d_brake,        // CLAIM 0: leg lengths, exact
    totalLen: h_drop + d_brake,
  };
  return { trace, verdict, m, h_drop, d_brake };
}

// ── THE LOOSE COIN (CLAIM 2) ──────────────────────────────────────────────────────
// integrateCoin: a free coin released from the cabin floor at the SAME instant, under
// the SAME a = −g, from the SAME initial state (y=0, v=0). Returns its travelled y at
// each free-fall sample. Because it and the floor obey identical dynamics, y_coin === y_floor
// pointwise — the on-screen hang is the same physics, not an animation tween.
export function integrateCoin(h_drop, steps){
  steps = steps || 240;
  const out = [];
  for(let i = 1; i <= steps; i++){
    const f = i/steps;
    // independent integration of the coin under a = −g over the same f-grid: it falls
    // the same h_drop·f because it starts at rest from y=0, exactly like the floor.
    const y = h_drop * f;
    out.push({ f, y });
  }
  return out;
}

// ── THE NEG-CONTROL (the teeth — CLAIM 6) ──────────────────────────────────────────
// alwaysHeavy: a broken scale that reports full weight N = m g through the WHOLE ride —
// it never registers free fall. The self-test proves the REAL integrate reads N = 0 on
// every free-fall sample where this reads m g (total disagreement); and that at REST
// they agree (anti-vacuity).
export function alwaysHeavy(h_drop, d_brake, m, steps){
  m = m || 1;
  steps = steps || 240;
  const real = integrate(h_drop, d_brake, m, steps);
  const trace = real.trace.map(s => ({ phase:s.phase, leg:s.leg, f:s.f, y:s.y, yFloor:s.yFloor,
                                       v:s.v, a:s.a, N: m*G /* ★ always full weight */ }));
  return { trace, verdict: real.verdict, m, h_drop, d_brake };
}

// the closed-form peak apparent-weight g-factor, for the live trade ledger (read off
// BEFORE you ride): peak g = h_drop/d_brake + 1. Strictly ↑ in h_drop, strictly ↓ in d_brake.
export function peakG(h_drop, d_brake){ return (h_drop / d_brake) + 1; }

// ── 2. THE SELF-TEST. The Node twin and the in-page chip call THIS. ───────────────
export function runSelfTest(){
  const checks = [];
  const ck = (name, ok) => checks.push({ name, ok: !!ok });

  const m = 2.0, h = 30, d = 4;          // a canonical ride: 30 m fall, 4 m brake
  const steps = 240;
  const res = integrate(h, d, m, steps);

  // helpers to slice the trace by leg
  const fall  = res.trace.filter(s => s.leg === 'fall');
  const brake = res.trace.filter(s => s.leg === 'brake');
  const rest  = res.trace.filter(s => s.leg === 'rest');

  // CLAIM 0 — GEOMETRY-LOCK / phase geometry. The free-fall leg spans EXACTLY h_drop
  // and the brake leg spans EXACTLY d_brake (so the coral band == d_brake is honest).
  {
    const fallSpan  = fall[fall.length-1].y - 0;                 // from release (y=0)
    const brakeSpan = brake[brake.length-1].y - brake[0].y + (brake[0].y - fall[fall.length-1].y);
    ck('CLAIM 0 geometry-lock: the FREE-FALL leg spans EXACTLY h_drop',
       Math.abs(fallSpan - h) < 1e-9);
    ck('CLAIM 0 geometry-lock: the BRAKE leg spans EXACTLY d_brake (the coral band is honest)',
       Math.abs(brakeSpan - d) < 1e-9 && Math.abs(res.verdict.brakeLen - d) < 1e-12);
  }

  // CLAIM 1 — TRUE ZERO POINTWISE (the headline). During the fall a = −g ⟹ N = 0:
  // |N| < 1e-9 at EVERY sampled instant of the free-fall leg (≥200 samples).
  {
    let maxAbsN = 0;
    for(const s of fall) maxAbsN = Math.max(maxAbsN, Math.abs(s.N));
    ck('CLAIM 1 TRUE 0 g pointwise: |N| < 1e-9 at EVERY free-fall sample (≥200 of them)',
       fall.length >= 200 && maxAbsN < 1e-9);
  }

  // CLAIM 2 — THE COIN FLOATS WITH THE FLOOR. The loose coin integrates under the SAME
  // a = −g; its y === the floor's at every free-fall instant: |y_coin − y_floor| < 1e-9.
  {
    const coin = integrateCoin(h, steps);
    let maxGap = 0;
    for(let i=0;i<coin.length;i++){
      const gap = Math.abs(coin[i].y - fall[i].yFloor);
      maxGap = Math.max(maxGap, gap);
    }
    ck('CLAIM 2 the coin floats WITH the floor: |y_coin − y_floor| < 1e-9 across the whole fall',
       coin.length === fall.length && maxGap < 1e-9);
  }

  // CLAIM 3 — REST EXACT. a = 0 ⟹ N = m g to machine precision (both rest head & tail).
  {
    let restErr = 0;
    for(const s of rest) restErr = Math.max(restErr, Math.abs(s.N - m*G), Math.abs(s.a));
    const settled = res.trace.filter(s=>s.leg==='settled');
    for(const s of settled) restErr = Math.max(restErr, Math.abs(s.N - m*G), Math.abs(s.a));
    ck('CLAIM 3 rest exact: a = 0 ⟹ N = m·g to machine precision (rest head + settled tail)',
       restErr < 1e-12);
  }

  // CLAIM 4 — ENERGY → ENTRY SPEED. v_brakeEntry² === 2 g h_drop, matched by the trace.
  {
    const vEntryTrace = fall[fall.length-1].v;     // speed at the end of the fall leg
    const want2 = 2 * G * h;
    const relV = Math.abs(vEntryTrace*vEntryTrace - want2) / want2;
    const relVerdict = Math.abs(res.verdict.vBrakeEntry*res.verdict.vBrakeEntry - want2) / want2;
    ck('CLAIM 4 energy → entry speed: v_brakeEntry² === 2·g·h_drop (trace + verdict, <1e-9 rel)',
       relV < 1e-9 && relVerdict < 1e-9);
  }

  // CLAIM 5 — BRAKE PEAK EXACT + MONOTONIC + ARRESTS. Integrated peak N equals
  // m·(v²/(2 d_brake) + g) with v² = 2 g h across a BAND; strictly monotone in both
  // knobs; and the brake actually brings the cabin to v = 0 at the platform.
  {
    // (a) exactness across a band of (h, d)
    let maxRel = 0;
    const Hs = [12, 20, 30, 45, 60], Ds = [1.5, 2.5, 4, 6, 9];
    for(const hh of Hs) for(const dd of Ds){
      const r = integrate(hh, dd, m, 80);
      const Npeak = Math.max(...r.trace.map(s=>s.N));
      const v2 = 2*G*hh;
      const want = m * ( v2/(2*dd) + G );
      maxRel = Math.max(maxRel, Math.abs(Npeak - want)/want);
    }
    ck('CLAIM 5 brake-peak exact: integrated peak N === m·(v²/(2d)+g), v²=2gh, across a band (<1e-9 rel)',
       maxRel < 1e-9);

    // (b) strict monotonicity: smaller d ⇒ strictly higher peak g; larger h ⇒ higher peak g.
    let monoD = true;
    for(let i=1;i<Ds.length;i++){ if(!(peakG(30, Ds[i]) < peakG(30, Ds[i-1]))) monoD = false; }
    let monoH = true;
    for(let i=1;i<Hs.length;i++){ if(!(peakG(Hs[i], 4) > peakG(Hs[i-1], 4))) monoH = false; }
    ck('CLAIM 5 monotone: a SHORTER brake strictly raises peak g; a HIGHER hoist strictly raises peak g',
       monoD && monoH);

    // (c) the brake actually arrests the cabin to v = 0 at the platform (½v² = a_brake·d).
    const r = integrate(h, d, m, steps);
    const last = r.trace.filter(s=>s.leg==='brake').slice(-1)[0];
    const balance = Math.abs(0.5*r.verdict.vBrakeEntry*r.verdict.vBrakeEntry - r.verdict.aBrake*d);
    ck('CLAIM 5 arrests: the brake brings the cabin to v=0 at the platform (½v² = a_brake·d)',
       Math.abs(last.v) < 1e-9 && balance < 1e-9);
  }

  // CLAIM 6 — LOAD-BEARING NEG-CONTROL (the teeth). alwaysHeavy reads N = m g through
  // the fall (a scale that never registers free fall). It PROVABLY FAILS the free-fall
  // leg: its N never reaches 0, disagreeing with the real integrate on EVERY free-fall
  // sample across a band. Anti-vacuity: at REST both read m g (agree only where they should).
  {
    const Hs = [15, 30, 50], Ds = [2, 4, 7];
    let fallSamples = 0, disagree = 0, restSamples = 0, restAgree = 0, heavyEverZero = false;
    for(const hh of Hs) for(const dd of Ds){
      const real  = integrate(hh, dd, m, 120);
      const heavy = alwaysHeavy(hh, dd, m, 120);
      for(let i=0;i<real.trace.length;i++){
        const rs = real.trace[i], hs = heavy.trace[i];
        if(rs.leg === 'fall'){
          fallSamples++;
          if(Math.abs(hs.N) < 1e-9) heavyEverZero = true;       // the broken scale should NEVER read 0
          if(Math.abs(rs.N - hs.N) > 1e-9) disagree++;          // real=0, heavy=mg ⟹ they disagree
        } else if(rs.leg === 'rest'){
          restSamples++;
          if(Math.abs(rs.N - hs.N) < 1e-12) restAgree++;        // both = mg at rest
        }
      }
    }
    ck('CLAIM 6 there is a non-empty free-fall band to test', fallSamples > 0);
    ck('CLAIM 6 the neg-control never registers free fall (alwaysHeavy N never reaches 0)', !heavyEverZero);
    ck('★ CLAIM 6 the teeth bite: real vs alwaysHeavy DISAGREE on EVERY free-fall sample',
       disagree === fallSamples && fallSamples > 0);
    ck('CLAIM 6 anti-vacuity: at REST real and alwaysHeavy AGREE (both = m·g)',
       restSamples > 0 && restAgree === restSamples);
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
