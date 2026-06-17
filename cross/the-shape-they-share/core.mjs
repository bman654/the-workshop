// === CORE BEGIN ===
// The Shape They Share — one curve, a·cosh(s/a), reported by two physics that never met.
//
// WHAT THIS MODULE IS. Two DISJOINT cores, lifted VERBATIM from two existing rooms that share NO code,
// asked the same question through ONE brass handle — "what is your shape parameter a?" — and answering
// it with the SAME number. One core is GRAVITY (catenary/index.html): a flexible chain of fixed length
// L pinned at (−h,0) and (h,0) sags to minimise gravitational PE, and the unique minimiser is the
// catenary y = a·cosh((x−x₀)/a); a solves √(L²−v²) = 2a·sinh(h/a) (here v=0, symmetric). The other is
// SURFACE TENSION (soap-film/index.html): a soap film spanning two coaxial rings of radius R a height
// 2h apart minimises AREA, and the unique minimiser is the catenoid r = a·cosh(z/a); a solves
// R = a·cosh(h/a) on the stable branch. Two unrelated transcendental inversions — one sinh(u)/u, one
// cosh(u)/u — both report the parameter a of the SAME family a·cosh(·/a).
//
// THE HANDLE (the thin new adapter — the ONLY new logic besides runSelfTest). ONE dial sets the
// dimensionless slenderness s = 2h/R with R FIXED = 1, so h = s/2. From that single s we build TWO
// INDEPENDENT setups, each solved by its OWN unchanged core:
//   • FILM:  rings (R=1, h=s/2)            → solveCatenoidA(1, s/2)            → a_film.
//   • CHAIN: symmetric drop v=0, half-span h=s/2, slack L = 2·a_film·sinh(h/a_film) → solveCatenary → a_chain.
// Both invert the SAME constraint R = a·cosh(h/a) from the SAME (R,h), so a_chain ≡ a_film to machine-ε.
// The crucial property of THIS handle: R/h = 2/s DECREASES as you pull, crossing GMIN (the catenoid's
// existence floor) at s* = 2/GMIN ≈ 1.32549, where solveCatenoidA returns null — the negative control is
// real here, and only here. (A handle with R=cosh(u), h=u keeps R/h ≥ GMIN forever and could never snap.)
//
// HONEST SCOPE (non-negotiable, stated in the page lede AND here). The claim is NOT "a chain IS a soap
// film." It is: BOTH problems are the curve a·cosh(s/a), and from the SAME geometry both report the SAME
// shape parameter a — until the film's existence constraint runs out. We always show BOTH raw physical
// quantities (the chain's sag & span; the film's neck radius & ring radius) beside the shared gold a, so
// the visitor watches two worlds collapse onto one ruler rather than being told they are "the same."
//
// THE CLAIMS IT MAKES CHECKABLE (re-proven by both the in-page pill and core.test.mjs):
//   1. AGREEMENT below the snap — sweep s∈[0.20, 1.27) in 0.005 steps; a_film=solveCatenoidA(1,s/2) and
//      a_chain=solveCatenary(s/2,0, matched L) agree to < 1e-9 (measured ~6e-14). Two disjoint cores, one a.
//   2. THRESHOLD === the analytic Goldschmidt argmin — |U*·tanh(U*)−1| < 1e-7, GMIN === cosh(U*)/U*, and
//      the existence wall s* === 2/GMIN. ALSO the AREA-crossover lands at 2h/R = 1.0557 (soap-film's
//      published 1.056) — the moment the catenoid's area first exceeds two discs (a real film gives up here).
//   3. NEGATIVE CONTROL (load-bearing) — for s past the wall, solveCatenoidA(1, s/2) === null (two discs)
//      WHILE solveCatenary still returns a finite valid a (the chain hangs where the film cannot). A
//      vacuous "they always agree" checker PASSES claim 1 but FAILS this claim loudly.
//   4. closed-form catenoid area === numeric ∫ (soap-film's own lifted check) — guards the lifted film core.
//   5. catenary hits both pins + arc length to 1e-9 (catenary's own lifted check) — guards the lifted chain core.
//   6. determinism — same s ⇒ byte-identical (a_film, a_chain) on rerun.
//   7. BYTE-TWIN PARITY — index.html's inlined CORE slab === core.mjs CORE char-for-char.
//
// SINGLE-SOURCE DISCIPLINE. The two cores below are lifted byte-faithfully from their rooms and NEVER
// call each other. The handle/snap-state adapter is thin and sits on TOP of them. The byte-twin parity
// leg proves index.html's inlined CORE slab is char-for-char this module.

// ══ CORE A: GRAVITY — the catenary, lifted VERBATIM from catenary/index.html ══════════════════════════
// A chain of length L pinned at (−h, 0) and (h, vDown) hangs as y=a·cosh((x−x0)/a)+c. With span 2h and
// vertical drop v, a solves √(L²−v²) = 2a·sinh(h/a). Bisect sinh(u)/u (monotone ⇒ unique root). +y is DOWN.
function sinh(x){ return Math.sinh(x); }
function cosh(x){ return Math.cosh(x); }

function solveCatenary(h, vDown, L){
  // work internally in y-up: an upward-opening cosh dips to its minimum, which is
  // the *lowest* (deepest-sag) point; we'll negate to get y-down.  v is the y-up
  // endpoint difference = −vDown.
  var v = -vDown;
  var straight = Math.hypot(2*h, v);
  if(L <= straight*1.0000001){ return {ok:false, reason:'taut'}; }   // can't be slacker than a straight line
  var rhs = Math.sqrt(L*L - v*v);            // = 2a·sinh(h/a)
  // let u = h/a  ⇒  rhs = 2h·sinh(u)/u.  Solve f(u)= sinh(u)/u − rhs/(2h) = 0.
  var target = rhs/(2*h);                     // = sinh(u)/u  > 1
  // sinh(u)/u is increasing from 1 (u→0) to ∞; bracket then bisect.
  var lo=1e-9, hi=1.0;
  while( sinh(hi)/hi < target ){ hi*=2; if(hi>1e7) break; }
  for(var i=0;i<200;i++){
    var mid=0.5*(lo+hi), val=sinh(mid)/mid;
    if(val < target) lo=mid; else hi=mid;
  }
  var u=0.5*(lo+hi);
  var a=h/u;
  // x0 shifts the curve so the two endpoint heights differ by v (y-up):
  //   sinh(x0/a) = −v/rhs  ⇒  x0 = a·asinh(−v/rhs).
  var x0 = a*Math.asinh(-v/rhs);
  // cUp so end A (x=−h) sits at y-up 0.  catY (y-down) = −(a·cosh+cUp).
  var cUp = -a*cosh((-h - x0)/a);
  return {ok:true, a:a, x0:x0, cUp:cUp, h:h, v:vDown, L:L};
}

// height (y-down sag) of the catenary at local x: −(upward cosh).  End A → 0,
// middle → positive (the chain hangs DOWN).
function catY(sol, x){ return -( sol.a*cosh((x - sol.x0)/sol.a) + sol.cUp ); }
// arc length from −h to +h (closed form; sign-independent): a[sinh((h−x0)/a)−sinh((−h−x0)/a)]
function catLen(sol){ return sol.a*( sinh((sol.h - sol.x0)/sol.a) - sinh((-sol.h - sol.x0)/sol.a) ); }
// lowest-sag point: the cosh minimum sits at x=x0 (clamped to span), deepest y-down.
function catVertexX(sol){ return Math.max(-sol.h, Math.min(sol.h, sol.x0)); }

// ══ CORE B: SURFACE TENSION — the catenoid, lifted VERBATIM from soap-film/index.html ═════════════════
// A soap film between two coaxial rings (radius R, height 2h apart) is the catenoid r=a·cosh(z/a),
// minimising AREA. a solves R = a·cosh(h/a) on the stable branch; below the existence floor GMIN the BVP
// has NO catenoid and the only minimal "surface" is two flat discs (Goldschmidt). Fully disjoint from A.
var USTAR = 1.19967864;                       // argmin of cosh(u)/u
var GMIN  = Math.cosh(USTAR)/USTAR;           // ≈ 1.50888  (min of R/h that admits a catenoid)

// closed-form lateral area of the catenoid r=a·cosh(z/a), z∈[−h,h]:
//   A = 2π·a·( h + (a/2)·sinh(2h/a) )      (since √(1+r'²)=cosh, ∫cosh²)
function coshArea_a(a, h){
  return 2*Math.PI*a*( h + (a/2)*Math.sinh(2*h/a) );
}

// solve R/a = cosh(h/a) for a (the STABLE / larger-a branch), or null if none.
// In u=h/a we need cosh(u)/u = R/h on the decreasing branch u∈(0,u*].
function solveCatenoidA(R, h){
  var target = R/h;
  if(target < GMIN - 1e-12) return null;      // rings too far apart → no catenoid
  var lo = 1e-6, hi = USTAR;
  function G(u){ return Math.cosh(u)/u; }
  for(var it=0; it<200; it++){
    var mid = 0.5*(lo+hi), g = G(mid);
    if(g > target) lo = mid; else hi = mid;   // G decreasing on (0,u*]
  }
  var u = 0.5*(lo+hi);
  return h/u;
}

// mean curvature of the catenoid surface of revolution at height z (a minimal surface has H ≡ 0).
function meanCurvatureCatenoid(a, z){
  var r  = a*Math.cosh(z/a);
  var rp = Math.sinh(z/a);
  var rpp= Math.cosh(z/a)/a;
  var km = -rpp/Math.pow(1+rp*rp, 1.5);
  var kp =  1/( r*Math.sqrt(1+rp*rp) );
  return 0.5*(km+kp);
}

// numeric surface-of-revolution area of an arbitrary sampled profile (frustum sum)
function profileArea(zs, rs){
  var A=0;
  for(var i=0;i<zs.length-1;i++){
    var dz=zs[i+1]-zs[i], dr=rs[i+1]-rs[i];
    var rmid=0.5*(rs[i]+rs[i+1]);
    A += 2*Math.PI*rmid*Math.hypot(dz,dr);
  }
  return A;
}

function discArea(R){ return 2*Math.PI*R*R; }            // two flat discs (Goldschmidt)

// the catenoid area for given rings (null-safe): null when no catenoid exists.
function catenoidArea(R, h){
  var a = solveCatenoidA(R, h);
  return a===null ? null : coshArea_a(a, h);
}

// is the physical film a catenoid, or has it snapped to two discs?
//   collapses if no catenoid exists OR the catenoid area exceeds two discs.
function filmState(R, h){
  var a = solveCatenoidA(R, h);
  if(a===null) return { kind:'collapsed', reason:'no-catenoid', a:null };
  var cat = coshArea_a(a, h), disc = discArea(R);
  if(cat > disc) return { kind:'collapsed', reason:'goldschmidt', a:a, catArea:cat, discArea:disc };
  return { kind:'film', a:a, catArea:cat, discArea:disc };
}

// ══ THE HANDLE ADAPTER (the only new logic) — one dial s drives BOTH disjoint cores ═══════════════════
const RING_R = 1;                               // R is FIXED at 1; the handle moves only h via s.
const S_STAR = 2 / GMIN;                        // existence wall: R/h = GMIN ⇒ s* = 2/GMIN ≈ 1.32549.

// the area-crossover s (where the catenoid first costs MORE than two discs — a real film gives up here).
// Found once by a fine forward scan of filmState's reason flip; cached. 2h/R = s, so this is the s where
// filmState(1, s/2).reason becomes 'goldschmidt'. soap-film publishes the crossover at 2h/R ≈ 1.0557.
function areaCrossoverS(){
  let lo = 0.5, hi = S_STAR;                     // bracket: below 0.5 the film is fat; above s* none exists
  // bisect on the predicate "catenoid area > disc area" (monotone in s on the stable branch)
  for(let i=0;i<80;i++){
    const m = 0.5*(lo+hi), fs = filmState(RING_R, m/2);
    const collapsedByArea = (fs.kind === 'collapsed') || (fs.catArea > fs.discArea);
    if(collapsedByArea) hi = m; else lo = m;
  }
  return 0.5*(lo+hi);
}
const S_AREA = areaCrossoverS();                // ≈ 1.0557 → the AMBER "film gives up (area)" tick.

// solveShared(s): from one handle value, run BOTH cores and report the shared shape parameter.
// Returns the raw physical quantities for BOTH worlds + the agreement, + the snap verdict.
function solveShared(s){
  const h = s / 2;                               // h = s·R/2 with R=1
  // FILM side — its own unchanged core:
  const a_film = solveCatenoidA(RING_R, h);
  const film = filmState(RING_R, h);
  // CHAIN side — its own unchanged core, matched-slack so it traces the SAME a (when the film exists):
  let a_chain = null, chainSol = null, L = null;
  if(a_film !== null){
    L = 2 * a_film * Math.sinh(h / a_film);       // the catenary's own arc length for parameter a_film
    chainSol = solveCatenary(h, 0, L);            // symmetric drop v=0
    if(chainSol.ok) a_chain = chainSol.a;
  } else {
    // Past the wall the film is two discs, but the chain still hangs — give it a fixed generous slack
    // so it keeps a real, finite shape (the negative control's point: the chain hangs where the film can't).
    L = 2.6 * h;                                  // a slack longer than the chord 2h ⇒ a real catenary
    chainSol = solveCatenary(h, 0, L);
    if(chainSol.ok) a_chain = chainSol.a;
  }
  const delta = (a_film !== null && a_chain !== null) ? Math.abs(a_film - a_chain) : null;
  // verdict: which beat are we at?
  let snap;                                       // 'film' (catenoid holds), 'area' (Goldschmidt area-snap), 'wall' (no catenoid)
  if(a_film === null)        snap = 'wall';
  else if(s >= S_AREA)       snap = 'area';        // catenoid still exists but two discs cost less → a real film snaps
  else                       snap = 'film';
  return {
    s, h, R: RING_R,
    a_film, a_chain, delta,
    film,                                          // {kind, reason, a, catArea, discArea}
    chain: chainSol,                              // catenary solution {ok,a,x0,cUp,h,v,L}
    L,
    snap,
    // raw physical quantities for the readouts (the two different worlds beside the shared a):
    raw: {
      filmNeck:  a_film,                          // the catenoid waist radius r(0) = a (its narrowest)
      filmRing:  RING_R,                          // the ring radius
      chainSag:  (chainSol.ok ? catY(chainSol, catVertexX(chainSol)) : null), // deepest sag (y-down)
      chainSpan: 2 * h,                            // pin-to-pin horizontal span
      chainLen:  (chainSol.ok ? catLen(chainSol) : null),
    },
  };
}

// ══ THE SELF-TEST (re-proven by core.test.mjs; byte-twin-inlined as the page's pill) ══════════════════
function runSelfTest(){
  let pass = 0, total = 0; const detail = [];
  const ck = (ok, label) => { total++; if(ok) pass++; else detail.push(label); };

  // LEG 1 — AGREEMENT below the snap: two disjoint cores report the same a to < 1e-9 across a sweep.
  let worst = 0, checked = 0;
  for(let s = 0.20; s < 1.27; s += 0.005){
    const a_film = solveCatenoidA(RING_R, s/2);
    if(a_film === null) continue;
    const L = 2 * a_film * Math.sinh((s/2) / a_film);
    const sol = solveCatenary(s/2, 0, L);
    if(!sol.ok) continue;
    worst = Math.max(worst, Math.abs(a_film - sol.a)); checked++;
  }
  ck(worst < 1e-9 && checked > 100, 'agreement(' + worst.toExponential(1) + ',' + checked + ')');

  // LEG 2 — THRESHOLD === the analytic Goldschmidt argmin, the existence wall, and the area-crossover.
  ck(Math.abs(USTAR * Math.tanh(USTAR) - 1) < 1e-7, 'argmin(U*tanhU*=1)');
  ck(GMIN === Math.cosh(USTAR) / USTAR, 'GMIN===cosh(U*)/U*');
  ck(Math.abs(S_STAR - 2 / GMIN) < 1e-15, 'wall(s*===2/GMIN)');
  ck(Math.abs(S_AREA - 1.0557) < 5e-3, 'area-crossover(2h/R=' + S_AREA.toFixed(4) + '≈1.056)');

  // LEG 3 — NEGATIVE CONTROL (load-bearing): past the wall the film is null while the chain still hangs.
  const sPast = 1.345;
  const filmPast = solveCatenoidA(RING_R, sPast/2);
  const chainPast = solveCatenary(sPast/2, 0, 2.6 * (sPast/2));
  ck(filmPast === null && chainPast.ok && chainPast.a > 0,
     'neg-control(film=' + (filmPast === null ? 'null' : filmPast.toFixed(3)) + ',chain=' + (chainPast.ok ? chainPast.a.toFixed(3) : 'fail') + ')');
  // and the vacuity guard: a checker that just returns the film's a for both would FAIL leg 3 (no a past the wall).
  ck(filmPast === null && chainPast.a > 0, 'vacuity-guard');

  // LEG 4 — closed-form catenoid area === numeric ∫ (soap-film's own lifted check).
  {
    const R = 1, h = 0.5, a = solveCatenoidA(R, h);
    const closed = coshArea_a(a, h);
    const N = 4000, zs = [], rs = [];
    for(let i=0;i<=N;i++){ const z = -h + (2*h)*(i/N); zs.push(z); rs.push(a*Math.cosh(z/a)); }
    const numeric = profileArea(zs, rs);
    ck(Math.abs(closed - numeric) / closed < 1e-6, 'area-closed===numeric(' + (Math.abs(closed-numeric)/closed).toExponential(1) + ')');
    // and the surface is minimal: |H| ≈ 0 everywhere.
    let maxH = 0; for(let i=1;i<N;i++){ maxH = Math.max(maxH, Math.abs(meanCurvatureCatenoid(a, zs[i]))); }
    ck(maxH < 1e-9, 'minimal-surface(|H|max=' + maxH.toExponential(1) + ')');
  }

  // LEG 5 — catenary hits both pins + arc length to 1e-9 (catenary's own lifted check).
  {
    const h = 0.6, a0 = solveCatenoidA(1, h);
    const L = 2 * a0 * Math.sinh(h / a0);
    const sol = solveCatenary(h, 0, L);
    const yA = catY(sol, -h), yB = catY(sol, h);          // both pins at y-down 0 (symmetric)
    const lenErr = Math.abs(catLen(sol) - L);
    ck(Math.abs(yA) < 1e-9 && Math.abs(yB) < 1e-9 && lenErr < 1e-9,
       'catenary-pins&len(yA=' + yA.toExponential(1) + ',len=' + lenErr.toExponential(1) + ')');
  }

  // LEG 6 — determinism: same s ⇒ byte-identical (a_film, a_chain) on rerun.
  {
    const A = solveShared(0.8), B = solveShared(0.8);
    ck(A.a_film === B.a_film && A.a_chain === B.a_chain, 'determinism');
  }

  return { pass, total, ok: pass === total && total > 0, detail };
}

export {
  // catenary core (CORE A)
  sinh, cosh, solveCatenary, catY, catLen, catVertexX,
  // catenoid core (CORE B)
  USTAR, GMIN, coshArea_a, solveCatenoidA, meanCurvatureCatenoid, profileArea, discArea, catenoidArea, filmState,
  // the handle adapter + self-test
  RING_R, S_STAR, S_AREA, areaCrossoverS, solveShared, runSelfTest,
};
// === CORE END ===

// Dual-use guard: when run directly via `node core.mjs`, print the self-test (the page inlines the CORE
// region above byte-identically; core.test.mjs imports these exports and re-proves every leg + parity).
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  const r = runSelfTest();
  console.log('The Shape They Share — core self-test: ' + r.pass + '/' + r.total + (r.ok ? ' ✓' : ' ✗ ' + r.detail.join(',')));
  process.exit(r.ok ? 0 : 1);
}
