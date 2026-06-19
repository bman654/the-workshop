// ── THE TEACUPS — math authority for a two-spin tea-cup ride: THE FLOWER.
//    This block is the SOLE AUTHORITY; a Node twin (core.test.mjs) re-extracts it
//    byte-for-byte between sentinels and the in-page chip calls the SAME
//    runSelfTest(). The renderer draws the seat's PATH and FELT PULL from this
//    authority — the bloom and the lurch ARE the readout, never a plotted curve. ──
//
// THE LAW. The platter spins at rate Ω. Mounted on it at offset R is a cup, and the
// cup spins on its own pin at rate ω relative to the platter. A rider sits at offset
// ρ from the cup's centre. Track the seat as a complex point z(t):
//   z(t) = R·e^{iΩt} + ρ·e^{i(Ω+ω)t}.                       (the seat's world path)
// The first term carries the cup centre around the platter at Ω; the second carries
// the rider around the cup at the cup's WORLD rate Ω+ω (the cup's own spin ω adds to
// the platter's). This is an epicycloid/rose family — a sum of two circular motions.
//
// THE BLOOM (petals = NUMERATOR). Write the spin ratio in lowest terms ω/Ω = p/q
// (p,q coprime). The path closes after the platter has turned q whole times:
//   T = 2π·q / Ω.                                           (the closure period)
// Over that one closed loop the radius |z(t)| rises and falls, tracing PETALS. The
// number of petals is the NUMERATOR p — NOT the denominator. The cup's seat laps the
// platter centre once per relative turn of ω, and over [0,T) the relative angle ω·t
// sweeps ω·T = 2π·p, so EXACTLY p radial lobes form: petals = p. (Verified by both a
// closed-form ω·T/(2π) = p and a wrap-around lobe count, in runSelfTest.) The reduced
// DENOMINATOR q is the CLOSURE PERIOD — "the flower closes after q platter-turns" —
// not the petal count. With R > ρ the radius never reaches 0, so the p lobes are all
// honest outward petals (a clean rose), which is why the default pins R=1 > ρ=0.5.
//
// THE FELT PULL (lurch ↔ float). The rider FEELS acceleration, the second derivative:
//   a(t) = z''(t) = −Ω²R·e^{iΩt} − (Ω+ω)²ρ·e^{i(Ω+ω)t}.     (the felt vector)
// Its magnitude |a| swings between two extremes as the two spins line up or oppose:
//   aMax = R·Ω² + ρ·(Ω+ω)²   (the LURCH — both pulls add, the cusp where you're flung)
//   aMin = |R·Ω² − ρ·(Ω+ω)²| (the FLOAT — the pulls oppose, the crown where you ease).
// Both are attained on the closed loop (the two phasors are co-rotating-at-different-
// rates, so they sweep through perfect alignment and perfect opposition). The dial
// reads |a(t)|; the cusp of the flower coincides with the lurch, the crown with the float.
//
// THE NEG-CONTROL (the teeth). Set ω = 0: the cup does not spin on its pin. Then the
// rider just rides a single circle of radius R+ρ at rate Ω — a PLAIN RING, not a
// flower. The radius is CONSTANT (R+ρ) and the felt pull is CONSTANT (R+ρ)·Ω², so
// aMax = aMin (no lurch, no float — a steady press). petalCount(0,q) = 0. runSelfTest
// proves the ω=0 ring is constant to <1e-9 AND that any ω≠0 band gives aMax−aMin
// strictly positive (a non-empty disagreement, so the suite can't pass vacuously).
//
// CLOSURE IFF RATIONAL. The path closes (returns to its start) for SOME finite T iff
// ω/Ω is rational. Make ω/Ω irrational (e.g. √2/2) and the seat never exactly returns
// — it fills an annulus forever. runSelfTest proves no return within a safe tolerance
// over the first 2000 denominators for √2/2 (the curve genuinely does not close).
//
// HONESTY. A point-mass rider, rigid arms, no friction or drift; angles advance at
// constant rates Ω and Ω+ω. The closure, petal count, and felt extrema are EXACT;
// only the on-canvas scale of the drawing is nominal so it reads on a finite stage.

export const R = 1.0;            // platter-arm length (cup centre offset). R>ρ keeps radius>0.
export const RHO = 0.5;          // ρ: seat offset within the cup
export const OMEGA_BIG = 1.0;    // Ω: platter spin rate (rad/s)
export const OMEGA_SMALL = 0.5;  // ω: cup spin rate relative to platter — default ω/Ω = 1/2

// ── gcd + lowest-terms ratio ────────────────────────────────────────────────────────
// gcd by Euclid; reduceRatio returns {p,q} in lowest terms with p the NUMERATOR (the
// petal count) and q the DENOMINATOR (the closure period in platter-turns).
export function gcd(a, b){
  a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b));
  while(b){ const r = a % b; a = b; b = r; }
  return a;
}
export function reduceRatio(p, q){
  const g = gcd(p, q) || 1;
  return { p: Math.round(p) / g, q: Math.round(q) / g };
}

// ── THE SEAT GEOMETRY — the ONE place the path is computed ────────────────────────────
// seat(R_,rho,Theta,phi) = the world point of a rider at cup-angle phi when the cup
// centre is at platter-angle Theta. Complex z as plain {x,y}. The page feeds LIVE
// angles in (Theta = bigTheta, phi = bigTheta + smallTheta) so the renderer never
// reimplements geometry. path(t,...) is seat evaluated along the constant-rate spins.
export function seat(R_, rho, Theta, phi){
  return { x: R_*Math.cos(Theta) + rho*Math.cos(phi),
           y: R_*Math.sin(Theta) + rho*Math.sin(phi) };
}
export function path(t, R_=R, rho=RHO, Om=OMEGA_BIG, w=OMEGA_SMALL){
  return seat(R_, rho, Om*t, (Om+w)*t);
}

// ── THE FELT VECTOR — the acceleration a rider's body actually feels ──────────────────
// a(t) = z''(t) = −Ω²R·e^{iΩt} − (Ω+ω)²ρ·e^{i(Ω+ω)t}. Returned as the {x,y} vector so
// the sloshing-tea glyph can lean toward it; feltA is its magnitude (the G-needle scalar).
export function accel(t, R_=R, rho=RHO, Om=OMEGA_BIG, w=OMEGA_SMALL){
  return { x: -Om*Om*R_*Math.cos(Om*t) - (Om+w)*(Om+w)*rho*Math.cos((Om+w)*t),
           y: -Om*Om*R_*Math.sin(Om*t) - (Om+w)*(Om+w)*rho*Math.sin((Om+w)*t) };
}
export function accelVec(t, R_=R, rho=RHO, Om=OMEGA_BIG, w=OMEGA_SMALL){
  return accel(t, R_, rho, Om, w);
}
export function feltA(t, R_=R, rho=RHO, Om=OMEGA_BIG, w=OMEGA_SMALL){
  const a = accel(t, R_, rho, Om, w);
  return Math.hypot(a.x, a.y);
}

// ── THE CLOSURE PERIOD — the flower closes after q platter-turns ──────────────────────
// T = 2π·q/Ω, where q is the reduced DENOMINATOR of ω/Ω. (The PETALS are the numerator;
// q is how long the bloom takes to close.)
export function closurePeriod(q, Om=OMEGA_BIG){
  return 2*Math.PI*q / Om;
}

// ── THE FELT EXTREMA (closed form) ────────────────────────────────────────────────────
// feltMax = R·Ω² + ρ·(Ω+ω)²  — the LURCH (both pulls add; the cusp where you're flung).
// feltMin = |R·Ω² − ρ·(Ω+ω)²| — the FLOAT (pulls oppose; the crown where you ease).
export function feltMax(R_=R, rho=RHO, Om=OMEGA_BIG, w=OMEGA_SMALL){
  return R_*Om*Om + rho*(Om+w)*(Om+w);
}
export function feltMin(R_=R, rho=RHO, Om=OMEGA_BIG, w=OMEGA_SMALL){
  return Math.abs(R_*Om*Om - rho*(Om+w)*(Om+w));
}
export function extrema(R_=R, rho=RHO, Om=OMEGA_BIG, w=OMEGA_SMALL){
  return { aMax: feltMax(R_, rho, Om, w), aMin: feltMin(R_, rho, Om, w) };
}

// ── THE PETAL COUNT (= NUMERATOR) ─────────────────────────────────────────────────────
// petalCount(p,q) = reduced numerator of ω/Ω = p/q. ONE petal per numerator. ω=0 ⇒ p=0 ⇒
// a plain ring, no petals. The corrected claim (the brief's "= denominator" is false:
// 1/2→1, 2/3→2, 3/5→3, 5/7→5 petals, all = numerator).
export function petalCount(p, q){
  return reduceRatio(p, q).p;
}

// ── THE SELF-TEST. The Node twin and the in-page chip call THIS. ──────────────────────
export function runSelfTest(){
  const checks = [];
  const ck = (name, ok) => checks.push({ name, ok: !!ok });
  const EPS = 1e-9;

  // (1) CLOSURE at T to <1e-9 across several p/q and (R,ρ,Ω): path(0) === path(T).
  {
    let allOk = true, n = 0, worst = 0;
    const ratios = [[1,2],[1,3],[2,3],[2,5],[3,5],[3,4],[5,7],[4,6]];
    for(const [pp,qq] of ratios) for(const R_ of [1.0, 1.4, 0.8]) for(const rho of [0.5, 0.3]) for(const Om of [1.0, 0.7]){
      const { p, q } = reduceRatio(pp, qq);
      const w = (p/q)*Om;                          // ω/Ω = p/q exactly
      const T = closurePeriod(q, Om);
      const z0 = path(0, R_, rho, Om, w), zT = path(T, R_, rho, Om, w);
      const err = Math.hypot(z0.x - zT.x, z0.y - zT.y);
      worst = Math.max(worst, err);
      if(err >= EPS) allOk = false;
      n++;
    }
    ck('(1) CLOSURE: path(0)===path(closurePeriod(q)) to <1e-9 over '+n+' (p/q,R,ρ,Ω) — the flower closes after q platter-turns', allOk && n>=24);
  }

  // (2) ★ PETALS = NUMERATOR (the corrected claim, PROVEN two ways): analytic
  // ω·T/(2π) === p exactly, AND a wrap-around radial-lobe count over [0,T) equals p.
  {
    let analyticOk = true, lobeOk = true, n = 0;
    const R_ = 1.0, rho = 0.5, Om = 1.0;            // R>ρ ⇒ honest outward lobes
    const ratios = [[1,2],[1,3],[2,3],[2,5],[3,5],[3,4],[5,7]];
    for(const [pp,qq] of ratios){
      const { p, q } = reduceRatio(pp, qq);
      const w = (p/q)*Om;
      const T = closurePeriod(q, Om);
      // analytic: ω·T/(2π) = (p/q·Ω)·(2π·q/Ω)/(2π) = p
      const analytic = (w*T)/(2*Math.PI);
      if(Math.abs(analytic - p) >= EPS) analyticOk = false;
      // wrap-around lobe count: local maxima of |z(t)| over the closed loop
      const N = 36000;
      const rad = (i)=>{ const z = path((i/N)*T, R_, rho, Om, w); return Math.hypot(z.x, z.y); };
      let prev = rad(N-1), cur = rad(0), lobes = 0;   // wrap: sample at -dt is sample N-1
      for(let i=1;i<=N;i++){
        const next = rad(i % N);
        if(cur > prev && cur >= next) lobes++;
        prev = cur; cur = next;
      }
      if(lobes !== p) lobeOk = false;
      n++;
    }
    ck('(2)★ PETALS = NUMERATOR: analytic ω·T/(2π) === p (the numerator) exactly, over '+n+' ratios', analyticOk);
    ck('(2)★ PETALS = NUMERATOR: a wrap-around |z| lobe count over [0,T) === p (NOT the denominator) — 1/2→1, 2/3→2, 3/5→3, 5/7→5', lobeOk);
  }

  // (3) |a| EXTREMA <1e-9: a dense sweep over [0,T) attains feltMax and feltMin, which
  // match the closed form R·Ω²+ρ(Ω+ω)² and |R·Ω²−ρ(Ω+ω)²| (incl. negative ω).
  {
    let allOk = true, n = 0, worst = 0;
    const bands = [[1.0,0.5,1.0,0.5],[1.4,0.3,0.7,1.1],[0.8,0.5,1.0,-0.6],[1.0,0.5,1.0,2.0]];
    for(const [R_,rho,Om,w] of bands){
      const { q } = reduceRatio(Math.round(w*1000), Math.round(Om*1000));
      const T = closurePeriod(q, Om);
      let mn = Infinity, mx = -Infinity;
      const N = 60000;
      for(let i=0;i<=N;i++){ const a = feltA((i/N)*T, R_, rho, Om, w); if(a<mn) mn=a; if(a>mx) mx=a; }
      const eMax = feltMax(R_, rho, Om, w), eMin = feltMin(R_, rho, Om, w);
      worst = Math.max(worst, Math.abs(mx - eMax), Math.abs(mn - eMin));
      if(Math.abs(mx - eMax) >= EPS || Math.abs(mn - eMin) >= EPS) allOk = false;
      n++;
    }
    ck('(3) |a| EXTREMA <1e-9: a dense sweep attains feltMax=R·Ω²+ρ(Ω+ω)² (the LURCH) and feltMin=|R·Ω²−ρ(Ω+ω)²| (the FLOAT) — over '+n+' bands', allOk);
  }

  // (4) ★ NEG-CONTROL ω=0 (lock the cup): the seat rides a plain ring of radius R+ρ at
  // CONSTANT felt pull (R+ρ)Ω², so the swept |a| never moves (no lurch, no float);
  // petals 0. The two phasors co-rotate at the SAME rate when ω=0, so they stay locked
  // in alignment forever — the felt pull is pinned at the LURCH value feltMax=(R+ρ)Ω²
  // and never reaches the generic float feltMin (that opposition requires ω≠0). Plus an
  // anti-vacuity: any ω≠0 band has aMax−aMin strictly >0 (a non-empty disagreement).
  {
    const R_ = 1.0, rho = 0.5, Om = 1.0;
    // (a) radius ≡ R+ρ (a plain ring): sweep |z| with ω=0.
    let radConst = true; const ringR = R_ + rho;
    for(let i=0;i<=2000;i++){ const z = path((i/2000)*20, R_, rho, Om, 0); if(Math.abs(Math.hypot(z.x,z.y) - ringR) >= EPS) radConst = false; }
    // (b) felt pull ≡ (R+ρ)Ω² (constant): the swept max and min coincide to <1e-9, and
    // that constant equals feltMax (the locked-alignment lurch value), so |a| never swings.
    const ringA = ringR*Om*Om;
    let aConst = true; let aMn = Infinity, aMx = -Infinity;
    for(let i=0;i<=2000;i++){ const a = feltA((i/2000)*20, R_, rho, Om, 0); if(Math.abs(a - ringA) >= EPS) aConst = false; if(a<aMn)aMn=a; if(a>aMx)aMx=a; }
    const flat = aConst && (aMx - aMn) < EPS && Math.abs(feltMax(R_, rho, Om, 0) - ringA) < EPS;
    // (c) anti-vacuity: a band with ω≠0 has aMax−aMin strictly positive.
    const exLive = extrema(R_, rho, Om, 0.5);
    const lurchExists = (exLive.aMax - exLive.aMin) > 1e-6;
    ck('(4)★ NEG-CONTROL ω=0: the seat rides a plain ring, |z|≡R+ρ to <1e-9 (no flower)', radConst && petalCount(0,1) === 0);
    ck('(4)★ NEG-CONTROL ω=0: the felt pull is CONSTANT ≡(R+ρ)Ω²=feltMax to <1e-9, so |a| never swings (no lurch, no float)', flat);
    ck('(4)★ anti-vacuity: with ω≠0 the felt pull SWINGS — aMax−aMin strictly > 0 (the disagreement is real)', lurchExists);
  }

  // (5) CLOSURE IFF RATIONAL (the teeth): ω/Ω = √2/2 is irrational ⇒ the seat NEVER
  // returns. Over the first 2000 denominators the min return error stays ABOVE a safe
  // floor (5e-4) — the curve genuinely does not close (verified min ≈ 8e-4).
  {
    const R_ = 1.0, rho = 0.5, Om = 1.0, w = (Math.SQRT2/2)*Om;
    let minErr = Infinity, atq = 0;
    const z0 = path(0, R_, rho, Om, w);
    for(let q=1;q<=2000;q++){
      const T = closurePeriod(q, Om);
      const zT = path(T, R_, rho, Om, w);
      const e = Math.hypot(z0.x - zT.x, z0.y - zT.y);
      if(e < minErr){ minErr = e; atq = q; }
    }
    ck('(5) CLOSURE IFF RATIONAL: with ω/Ω=√2/2 (irrational) NO return within 5e-4 over q=1..2000 (the flower never closes) — min err ≈'+minErr.toExponential(2)+' at q='+atq, minErr > 5e-4);
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
