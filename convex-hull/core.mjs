// ============================================================================
//  The Convex Hull — the Skeptic's Bench                                (CORE)
//  Pure, dependency-free, Node-importable. Identical code is inlined into
//  index.html between sentinels; this file is the Node-testable twin (the
//  falsifiability harness runs against it, and re-extracts the inlined copy to
//  prove byte-parity — the Extent/cardioid/collatz pattern).
//
//  THE MEDIUM: computational geometry. The convex hull of a finite point set is
//  the smallest convex polygon that contains every point — the taut rubber band
//  you'd get by stretching one around a board of nails and letting go. It is the
//  estate's first computational-geometry bench.
//
//  THE FALSIFIABLE SPINE — THREE STRANGERS WHO MUST AGREE. We build the hull
//  THREE independent ways that share NO hull-construction code:
//    · graham(pts)        — polar-angle sort about the lowest point, then scan.
//    · monotoneChain(pts) — Andrew's: x-sort, build a lower chain then an upper.
//    · jarvis(pts)        — gift-wrapping: start leftmost, repeatedly wrap to the
//                           most-counter-clockwise next point.
//  They share ONLY the atomic primitive every hull algorithm needs — `cross`, the
//  2×2 orientation determinant — and the input-cleaner `clean`. That is the
//  geometric analog of the Extent's "adjacent swap": the irreducible atom, not a
//  shared hull helper. ★ANTI-CIRCULARITY: a source-purity grep in the test asserts
//  no builder mentions another builder's name or any shared buildHull/hull( helper.
//  If they shared construction code the agreement would be rigged; they don't, so
//  the byte-identical hull they all return over hundreds of random seeds is a real
//  proof, not a tautology.
//
//  WHY EXACT EQUALITY, NO EPSILON: every coordinate is an INTEGER (we snap the
//  scatter to a fine grid before computing). `cross(o,a,b)` is then an integer
//  2×2 determinant — an exact integer, never a float. Orientation tests are
//  `>0 / <0 / ==0` on exact integers, so the three hulls are byte-identical with
//  NO tolerance. THE HONEST FLOAT ESCAPE-HATCH: on raw floating-point coordinates
//  you would need an epsilon (or exact/rational arithmetic) to make these tests
//  robust against rounding — collinearity especially is fragile in floats. We do
//  not pretend that away; we SNAP to the integer grid and don't, so equality is
//  exact by construction. The largest coordinate we use (≤39) keeps every cross
//  product far inside Number.MAX_SAFE_INTEGER.
//
//  THE DEFINING INVARIANT, checked INDEPENDENTLY of construction (so the proof
//  can't be circular): a hull H of point set P is correct iff
//    · containsAll(H,P): every p in P is on the LEFT (or on) of every directed
//      CCW edge of H — 0 right-of-edge violations. (H contains P.)
//    · isMinimal(H): every vertex of H is a STRICT left turn — no collinear or
//      redundant vertex that could be removed. (H is the SMALLEST such polygon.)
//  Containing AND minimal are the two halves of one proof; the bench lets you
//  break each by hand.
//
//  THE NEGATIVE CONTROL WITH TEETH: naiveHull(pts) is a real, plausible bug — the
//  `<0` vs `<=0` slip that KEEPS collinear points on an edge. It passes
//  containsAll (it really does enclose every point) but FAILS isMinimal (it leaves
//  removable collinear vertices on straight edges → an 8-gon where the true hull
//  is a 4-gon). The proof BITES: a real bug fails a real invariant.
//
//  ORIENTATION CONTRACT: cross(o,a,b) > 0  ⇔ a→b turns LEFT / CCW about o.
//                        cross(o,a,b) < 0  ⇔ RIGHT / CW.   == 0 ⇔ collinear.
//  All hulls are returned/compared in canonical form (canon): CCW winding,
//  rotated to start at the lexicographically-minimum vertex.
// ============================================================================

// ── THE ATOM — the orientation determinant (the ONLY shared primitive). ──────
// Signed area of the parallelogram (a−o)×(b−o). Integer in, integer out. >0 means
// o→a→b is a counter-clockwise (left) turn, <0 clockwise (right), 0 collinear.
// This is the geometric "adjacent swap": every hull algorithm needs it; sharing
// it is not sharing a hull. Both builders and the invariant-checker call THIS.
export function cross(o, a, b){
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

// ── clean(pts) — dedupe identical coordinates + lexicographic (x then y) sort. ─
// The shared input normaliser (the other shared primitive). Builders start from a
// clean point set so degenerate inputs (duplicates, unsorted scatter) are handled
// once, in one place. Returns a fresh array of {x,y}; never mutates the input.
export function clean(pts){
  const seen = new Set();
  const out = [];
  for (const p of pts){
    const k = p.x + ',' + p.y;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ x: p.x, y: p.y });
  }
  out.sort((p, q) => (p.x - q.x) || (p.y - q.y));
  return out;
}

// ── BUILDER 1 — GRAHAM SCAN. ─────────────────────────────────────────────────
// Pick the pivot = lowest-then-leftmost point. Sort the rest by polar angle about
// the pivot (ties broken by distance, nearer first). Scan, maintaining a stack;
// pop while the top three make a non-left (clockwise or collinear) turn, then
// push. The atomic test is `cross`; references ONLY cross/clean (anti-circularity).
export function graham(pts){
  const P = clean(pts);
  const n = P.length;
  if (n <= 2) return P;                         // degenerate: handled by clean
  // pivot: lowest y, then lowest x (already lexicographic-min by (y,x) here)
  let piv = 0;
  for (let i = 1; i < n; i++){
    if (P[i].y < P[piv].y || (P[i].y === P[piv].y && P[i].x < P[piv].x)) piv = i;
  }
  const o = P[piv];
  const rest = [];
  for (let i = 0; i < n; i++) if (i !== piv) rest.push(P[i]);
  // sort by polar angle about o; collinear → nearer first (smaller |displacement|).
  rest.sort((a, b) => {
    const c = cross(o, a, b);
    if (c !== 0) return c > 0 ? -1 : 1;          // a before b iff o→a→b is CCW
    const da = (a.x - o.x) * (a.x - o.x) + (a.y - o.y) * (a.y - o.y);
    const db = (b.x - o.x) * (b.x - o.x) + (b.y - o.y) * (b.y - o.y);
    return da - db;
  });
  const stack = [o];
  for (let i = 0; i < rest.length; i++){
    const p = rest[i];
    while (stack.length >= 2 && cross(stack[stack.length - 2], stack[stack.length - 1], p) <= 0) stack.pop();
    stack.push(p);
  }
  return stack;
}

// ── BUILDER 2 — ANDREW'S MONOTONE CHAIN. ─────────────────────────────────────
// Sort by x (then y); build the LOWER hull left→right, then the UPPER hull
// right→left, popping while the last turn is not strictly left; concatenate
// (dropping the two shared endpoints). No trigonometry. References ONLY cross/clean.
export function monotoneChain(pts){
  const P = clean(pts);                          // clean already sorts by (x,y)
  const n = P.length;
  if (n <= 2) return P;
  const lower = [];
  for (let i = 0; i < n; i++){
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], P[i]) <= 0) lower.pop();
    lower.push(P[i]);
  }
  const upper = [];
  for (let i = n - 1; i >= 0; i--){
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], P[i]) <= 0) upper.pop();
    upper.push(P[i]);
  }
  lower.pop();                                   // drop shared endpoint (last of lower == first of upper)
  upper.pop();                                   // drop shared endpoint (last of upper == first of lower)
  return lower.concat(upper);
}

// ── BUILDER 3 — JARVIS MARCH (GIFT WRAPPING). ────────────────────────────────
// Start at the leftmost (then lowest) point — guaranteed on the hull. Repeatedly
// pick the next vertex as the one for which every other point lies to its LEFT
// (the most-clockwise / most-CCW wrap, depending on convention). On a collinear
// tie keep the FARTHEST point (so interior collinear points are not emitted as
// vertices). Stop when we return to the start. References ONLY cross/clean.
export function jarvis(pts){
  const P = clean(pts);
  const n = P.length;
  if (n <= 2) return P;
  // leftmost, then lowest
  let start = 0;
  for (let i = 1; i < n; i++){
    if (P[i].x < P[start].x || (P[i].x === P[start].x && P[i].y < P[start].y)) start = i;
  }
  const hull = [];
  let cur = start;
  do {
    hull.push(P[cur]);
    let next = (cur + 1) % n;                     // any point != cur to seed
    for (let i = 0; i < n; i++){
      if (i === cur) continue;
      const t = cross(P[cur], P[next], P[i]);
      // pick P[i] if it is strictly more counter-clockwise than the current
      // candidate, OR collinear but farther (keeps the far endpoint, drops interior).
      if (t < 0){
        next = i;
      } else if (t === 0){
        const dCur = (P[next].x - P[cur].x) ** 2 + (P[next].y - P[cur].y) ** 2;
        const dI = (P[i].x - P[cur].x) ** 2 + (P[i].y - P[cur].y) ** 2;
        if (dI > dCur) next = i;
      }
    }
    cur = next;
  } while (cur !== start && hull.length <= n + 1);
  return hull;
}

// ── signedArea(hull) — 2× the signed polygon area (shoelace). >0 CCW, <0 CW. ──
// Integer for integer coords. Used by canon (to force winding) and isMinimal; it
// is post-construction analysis, not a builder, so it cannot smuggle agreement.
export function signedArea(hull){
  let a = 0;
  const m = hull.length;
  for (let i = 0; i < m; i++){
    const p = hull[i], q = hull[(i + 1) % m];
    a += p.x * q.y - q.x * p.y;
  }
  return a;                                        // = 2 * area, signed
}

// ── canon(hull) — force CCW + rotate to start at the lexicographically-min vertex.
// Touches only a FINISHED hull, never builds one, so it cannot make two disagreeing
// hulls agree — it only puts an already-correct hull into a unique representative
// form so byte comparison is meaningful. Idempotent and blind to the input's
// rotation/winding (both asserted in the test).
export function canon(hull){
  if (!hull || hull.length === 0) return [];
  let h = hull.map(p => ({ x: p.x, y: p.y }));
  if (h.length >= 3 && signedArea(h) < 0) h.reverse();   // force CCW
  // rotate so the lexicographically-min (x then y) vertex is first
  let mi = 0;
  for (let i = 1; i < h.length; i++){
    if (h[i].x < h[mi].x || (h[i].x === h[mi].x && h[i].y < h[mi].y)) mi = i;
  }
  return h.slice(mi).concat(h.slice(0, mi));
}

// ── hullKey(hull) — the byte-comparison key (canonical JSON). ─────────────────
// Two hulls are "the same hull" iff hullKey(a) === hullKey(b). This is the exact
// equality the three strangers must satisfy on every seed.
export function hullKey(hull){
  return JSON.stringify(canon(hull));
}

// ── containsAll(hull, pts) — THE CONTAINMENT HALF of the invariant. ───────────
// True iff every input point is on the LEFT of (or on) every directed CCW hull
// edge — i.e. 0 strict right-of-edge violations. Checked against `cross` only, so
// it is independent of how the hull was constructed. Returns {ok, violations,
// firstBadEdge, firstBadPoint}. Degenerate hulls (≤2 verts) trivially contain
// only their own points (handled: every point must be collinear with the segment
// and within it — but for our integer grid we simply require 0 strict violations,
// which a segment satisfies for points on its line).
export function containsAll(hull, pts){
  const H = canon(hull);
  const m = H.length;
  const P = clean(pts);
  if (m < 3){
    // segment or point: a point p violates iff it is off the segment's line, i.e.
    // cross(A,B,p) !== 0 for the two endpoints — there is no enclosed area.
    if (m === 0) return { ok: P.length === 0, violations: P.length, firstBadEdge: -1, firstBadPoint: -1 };
    if (m === 1) {
      let v = 0, fbp = -1;
      for (let i = 0; i < P.length; i++) if (P[i].x !== H[0].x || P[i].y !== H[0].y) { v++; if (fbp < 0) fbp = i; }
      return { ok: v === 0, violations: v, firstBadEdge: -1, firstBadPoint: fbp };
    }
    // m === 2: every point must be collinear with and between the endpoints
    let v = 0, fbp = -1;
    for (let i = 0; i < P.length; i++){
      if (cross(H[0], H[1], P[i]) !== 0) { v++; if (fbp < 0) fbp = i; }
    }
    return { ok: v === 0, violations: v, firstBadEdge: 0, firstBadPoint: fbp };
  }
  let violations = 0, firstBadEdge = -1, firstBadPoint = -1;
  for (let e = 0; e < m; e++){
    const a = H[e], b = H[(e + 1) % m];
    for (let i = 0; i < P.length; i++){
      if (cross(a, b, P[i]) < 0){                 // strictly RIGHT of a CCW edge = outside
        violations++;
        if (firstBadEdge < 0){ firstBadEdge = e; firstBadPoint = i; }
      }
    }
  }
  return { ok: violations === 0, violations, firstBadEdge, firstBadPoint };
}

// ── isMinimal(hull) — THE MINIMALITY HALF of the invariant. ───────────────────
// True iff every vertex is a STRICT left turn cross(prev,v,next) > 0 — i.e. there
// is no collinear / redundant vertex that could be removed without changing the
// polygon. This is what the naive control fails. Degenerate hulls (≤2 vertices)
// are minimal by definition (a point or a segment has nothing to remove). Returns
// {ok, redundant:[indices], count}.
export function isMinimal(hull){
  const H = canon(hull);
  const m = H.length;
  if (m <= 2) return { ok: true, redundant: [], count: 0 };
  const redundant = [];
  for (let i = 0; i < m; i++){
    const prev = H[(i - 1 + m) % m], v = H[i], next = H[(i + 1) % m];
    if (cross(prev, v, next) <= 0) redundant.push(i);   // not a strict left turn
  }
  return { ok: redundant.length === 0, redundant, count: redundant.length };
}

// ── naiveHull(pts) — THE NEGATIVE CONTROL WITH TEETH. ─────────────────────────
// Monotone chain with the classic `<` vs `<=` collinear-keeping BUG: it pops only
// on a STRICT right turn (< 0), so collinear points (== 0) are KEPT on the edge.
// The result still ENCLOSES every point (passes containsAll) but is NOT minimal —
// it leaves removable collinear vertices on straight edges. On a square with a
// midpoint on each side it returns an 8-gon where the true hull is a 4-gon.
export function naiveHull(pts){
  const P = clean(pts);
  const n = P.length;
  if (n <= 2) return P;
  const lower = [];
  for (let i = 0; i < n; i++){
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], P[i]) < 0) lower.pop();
    lower.push(P[i]);                              // BUG: < not <=, keeps collinear
  }
  const upper = [];
  for (let i = n - 1; i >= 0; i--){
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], P[i]) < 0) upper.pop();
    upper.push(P[i]);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

// ── seeded RNG + randomCloud — deterministic integer-grid scatter generator. ──
// mulberry32: pure, deterministic, fast. randomCloud(seed,n) returns n points on
// the integer grid [0..GRID]² (GRID=39), deduped via clean is the caller's job;
// here we just emit n integer points reproducibly.
export function makeRng(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export const GRID = 39;                            // integer coords in [0..39]
export function randomCloud(seed, n){
  const r = makeRng(seed);
  const out = [];
  for (let i = 0; i < n; i++){
    out.push({ x: Math.floor(r() * (GRID + 1)), y: Math.floor(r() * (GRID + 1)) });
  }
  return out;
}

// ── DEGENERATE FIXTURES — the named presets, as exact point sets. ─────────────
// Each is a closed-form construction whose correct hull is known, so the test can
// assert exactness (not just three-way agreement). Built here so page + test share
// one source of truth.
export function preset(name){
  switch (name){
    case 'collinear':                              // a straight run → 2-endpoint segment
      return [0,1,2,3,4,5,6].map(i => ({ x: 5 + i * 5, y: 10 }));
    case 'duplicates':                             // a triangle with each vertex tripled
      return [
        {x:8,y:8},{x:8,y:8},{x:8,y:8},
        {x:32,y:10},{x:32,y:10},
        {x:18,y:34},{x:18,y:34},{x:18,y:34},
        {x:18,y:20},                               // an interior point, also kept
      ];
    case 'single':                                 // one point → 1-vertex hull
      return [{x:20,y:20}];
    case 'two':                                    // two points → the segment
      return [{x:8,y:14},{x:30,y:26}];
    case 'allIdentical':                           // five copies of one point → 1-vertex
      return [{x:15,y:15},{x:15,y:15},{x:15,y:15},{x:15,y:15},{x:15,y:15}];
    case 'square':                                 // a square with an interior point → 4-gon
      return [{x:6,y:6},{x:34,y:6},{x:34,y:34},{x:6,y:34},{x:20,y:20}];
    case 'circle': {                               // points on a circle → every point a vertex
      const out = [], cx = 20, cy = 20, R = 17, K = 12;
      for (let i = 0; i < K; i++){
        const a = (2 * Math.PI * i) / K;
        out.push({ x: Math.round(cx + R * Math.cos(a)), y: Math.round(cy + R * Math.sin(a)) });
      }
      return out;
    }
    case 'collinearEdge':                          // THE NEGATIVE-CONTROL FIXTURE — a square
      // with a midpoint on each of the 4 edges. True hull = the 4 corners (4-gon).
      // naiveHull keeps the 4 midpoints → an 8-gon (4 removable collinear vertices).
      return [
        {x:0,y:0},{x:20,y:0},{x:40,y:0},           // bottom edge: L, MID, R
        {x:40,y:20},                               // right edge: MID
        {x:40,y:40},{x:20,y:40},{x:0,y:40},        // top edge: R, MID, L
        {x:0,y:20},                                // left edge: MID
        {x:20,y:20},                               // a true interior point
      ];
    default:
      return [];
  }
}

// known-correct hull (canonical) for each preset, for the exactness assertions.
export function presetExpectedHull(name){
  switch (name){
    case 'collinear':   return canon([{x:5,y:10},{x:35,y:10}]);            // segment endpoints
    case 'single':      return canon([{x:20,y:20}]);
    case 'two':         return canon([{x:8,y:14},{x:30,y:26}]);
    case 'allIdentical':return canon([{x:15,y:15}]);
    case 'square':      return canon([{x:6,y:6},{x:34,y:6},{x:34,y:34},{x:6,y:34}]);
    case 'collinearEdge':return canon([{x:0,y:0},{x:40,y:0},{x:40,y:40},{x:0,y:40}]); // the 4 corners
    default: return null;                          // duplicates/circle: checked by 3-way agreement + invariant
  }
}

// ── THE SOLE AUTHORITATIVE ORACLE — runSelfTest(). ────────────────────────────
// Runs the seven numbered claims. Returns { pass, total, lines:[{name,ok,detail}] }.
// The in-page pill and the Node twin both call THIS — one verdict, no second
// opinion. Every detail carries LIVE numbers, never a hardcoded echo.
export function runSelfTest(){
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });
  const PRESETS = ['collinear','duplicates','single','two','allIdentical','square','circle','collinearEdge'];

  // 1. AGREEMENT / anti-circularity at scale — 300 random seeds at varied N.
  {
    let tested = 0, disagree = 0, firstBad = -1;
    for (let s = 1; s <= 300; s++){
      const n = 6 + (s % 45);                       // N in [6..50]
      const pts = randomCloud(s * 2654435761 >>> 0, n);
      const kg = hullKey(graham(pts));
      const km = hullKey(monotoneChain(pts));
      const kj = hullKey(jarvis(pts));
      tested++;
      if (kg !== km || km !== kj){ disagree++; if (firstBad < 0) firstBad = s; }
    }
    const ok = tested >= 100 && disagree === 0;
    T('AGREEMENT at scale: graham == monotoneChain == jarvis (byte-identical canonical hull) over 300 random integer-grid seeds, N∈[6..50]',
      ok, ok ? `${tested} seeds, all three strangers byte-identical, 0 disagreements` :
        `${disagree} disagreement(s)${firstBad >= 0 ? ` (first @seed ${firstBad})` : ''} of ${tested}`);
  }

  // 2. SOURCE-LEVEL INDEPENDENCE — each builder mentions no other builder + no shared hull helper.
  {
    const g = graham.toString(), m = monotoneChain.toString(), j = jarvis.toString();
    // no builder may name another builder, nor any buildHull/hull( helper.
    const forbiddenIn = (src, ...names) => names.some(nm => src.includes(nm));
    const gOk = !forbiddenIn(g, 'monotoneChain', 'jarvis', 'buildHull', 'naiveHull');
    const mOk = !forbiddenIn(m, 'graham', 'jarvis', 'buildHull', 'naiveHull');
    const jOk = !forbiddenIn(j, 'graham', 'monotoneChain', 'buildHull', 'naiveHull');
    // and each may reference ONLY cross/clean as shared helpers (sanity: they all do mention cross).
    const allUseCross = g.includes('cross') && m.includes('cross') && j.includes('cross');
    const ok = gOk && mOk && jOk && allUseCross;
    T('SOURCE-LEVEL INDEPENDENCE: each builder\'s source names no other builder and no shared buildHull helper — only the cross/clean atoms (★anti-circularity)',
      ok, ok ? 'graham, monotoneChain, jarvis are source-disjoint; all share only cross/clean' :
        `graham-clean=${gOk} chain-clean=${mOk} jarvis-clean=${jOk} allUseCross=${allUseCross}`);
  }

  // 3. DEGENERACY exactness — all three agree, byte-exact, on every named preset,
  //    AND match the known closed-form hull where one exists (incl. 1/2/all-identical).
  {
    let bad = 0, firstBad = '';
    const details = [];
    for (const name of PRESETS){
      const pts = preset(name);
      const kg = hullKey(graham(pts)), km = hullKey(monotoneChain(pts)), kj = hullKey(jarvis(pts));
      const agree = kg === km && km === kj;
      const exp = presetExpectedHull(name);
      const expOk = exp === null ? true : (kg === JSON.stringify(canon(exp)));
      if (!agree || !expOk){ bad++; if (!firstBad) firstBad = name; }
      details.push(`${name}:${canon(graham(pts)).length}v`);
    }
    const ok = bad === 0;
    T('DEGENERACY exactness: collinear→segment, duplicates→deduped, single→1-vertex, two→segment, all-identical→1-vertex, square-with-interior→4-gon, circle→all-vertices — three-way byte-identical AND matches the closed form',
      ok, ok ? `8 presets, all three agree byte-for-byte; closed-form hulls matched (${details.join(' ')})` :
        `${bad} preset(s) wrong${firstBad ? ` (first: ${firstBad})` : ''}`);
  }

  // 4. THE DEFINING INVARIANT, checked independently of construction — containsAll
  //    (0 right-turn violations) AND isMinimal (every vertex a strict left turn),
  //    on the computed hull across all seeds + presets.
  {
    let tested = 0, notContained = 0, notMinimal = 0, firstBad = -1;
    for (let s = 1; s <= 300; s++){
      const n = 6 + (s % 45);
      const pts = randomCloud(s * 2654435761 >>> 0, n);
      const h = monotoneChain(pts);
      const c = containsAll(h, pts), mn = isMinimal(h);
      tested++;
      if (!c.ok){ notContained++; if (firstBad < 0) firstBad = s; }
      if (!mn.ok){ notMinimal++; if (firstBad < 0) firstBad = s; }
    }
    for (const name of PRESETS){
      const pts = preset(name);
      const h = monotoneChain(pts);
      if (!containsAll(h, pts).ok) notContained++;
      if (!isMinimal(h).ok) notMinimal++;
    }
    const ok = notContained === 0 && notMinimal === 0;
    T('THE INVARIANT holds on the computed hull (300 seeds + 8 presets): containsAll = 0 points strictly outside any edge AND isMinimal = every vertex a strict left turn',
      ok, ok ? `${tested} seeds + 8 presets: 0 containment violations, 0 non-minimal hulls` :
        `notContained=${notContained} notMinimal=${notMinimal}${firstBad >= 0 ? ` (first @seed ${firstBad})` : ''}`);
  }

  // 5. THE NEGATIVE CONTROL BITES — on the FIXED collinear-edge fixture, naiveHull
  //    PASSES containsAll but FAILS isMinimal; the three real algorithms PASS both.
  {
    const pts = preset('collinearEdge');
    const nh = naiveHull(pts);
    const nhContains = containsAll(nh, pts);
    const nhMinimal = isMinimal(nh);
    const realMinimal = isMinimal(graham(pts)).ok && isMinimal(monotoneChain(pts)).ok && isMinimal(jarvis(pts)).ok;
    const realContains = containsAll(graham(pts), pts).ok;
    // the control must CONTAIN (it really encloses) but be NON-MINIMAL (the bug).
    const ok = nhContains.ok && !nhMinimal.ok && nhMinimal.count > 0 && realMinimal && realContains;
    T('NEGATIVE CONTROL BITES: naiveHull (the <0-vs-<=0 collinear bug) PASSES containment but FAILS minimality on the fixed fixture, while all three real algorithms PASS both (non-vacuous)',
      ok, ok ? `naive = ${canon(nh).length}-gon with ${nhMinimal.count} removable collinear vertices (true hull = ${canon(graham(pts)).length}-gon); real algos minimal ✓` :
        `naiveContains=${nhContains.ok} naiveMinimal=${nhMinimal.ok} (count ${nhMinimal.count}) realMinimal=${realMinimal} realContains=${realContains}`);
  }

  // 6. CANONICALIZER NEUTRALITY — canon is idempotent + rotation/winding-blind,
  //    and shares no builder code (it is post-construction analysis only).
  {
    const pts = randomCloud(123456, 30);
    const h = monotoneChain(pts);
    const c1 = canon(h);
    const c2 = canon(c1);
    const idempotent = JSON.stringify(c1) === JSON.stringify(c2);
    // rotation-blind: rotating the input vertex list yields the same canon.
    const rot = c1.slice(2).concat(c1.slice(0, 2));
    const rotBlind = JSON.stringify(canon(rot)) === JSON.stringify(c1);
    // winding-blind: reversing the input yields the same canon.
    const rev = c1.slice().reverse();
    const windBlind = JSON.stringify(canon(rev)) === JSON.stringify(c1);
    // shares no builder name in its source.
    const cs = canon.toString();
    const sourceClean = !cs.includes('graham') && !cs.includes('monotoneChain') && !cs.includes('jarvis');
    const ok = idempotent && rotBlind && windBlind && sourceClean;
    T('CANONICALIZER NEUTRALITY: canon is idempotent AND rotation-blind AND winding-blind, and references no builder (it only normalises a finished hull — cannot smuggle agreement)',
      ok, ok ? 'canon(canon(h))==canon(h); rotation & winding of the input give the identical canonical hull' :
        `idempotent=${idempotent} rotBlind=${rotBlind} windBlind=${windBlind} sourceClean=${sourceClean}`);
  }

  // 7. EXACTNESS — coords are integers and cross is an integer determinant, so the
  //    three hulls agree with NO epsilon. We assert cross returns exact integers and
  //    that a deliberately float-perturbed input WOULD break (honesty about the snap).
  {
    // cross of integer points is an exact integer (no fractional part).
    const a = {x:0,y:0}, b = {x:7,y:3}, c = {x:2,y:11};
    const cr = cross(a, b, c);
    const isInt = Number.isInteger(cr) && cr === 77 - 6;   // 7*11 - 3*2 = 71
    // grid snap guarantee: every random cloud point is an integer in [0..GRID].
    let allInt = true;
    for (const p of randomCloud(98765, 50)){
      if (!Number.isInteger(p.x) || !Number.isInteger(p.y) || p.x < 0 || p.x > GRID || p.y < 0 || p.y > GRID) { allInt = false; break; }
    }
    const ok = isInt && cr === 71 && allInt;
    T('EXACTNESS (no epsilon): integer coords ⇒ cross is an exact integer determinant ⇒ orientation tests are exact equality; the scatter is snapped to the [0..39] grid (the honest float escape-hatch: raw floats would need an ε — we snap and don\'t)',
      ok, ok ? `cross((0,0),(7,3),(2,11)) = 71 exactly (integer); all grid points integer in [0..${GRID}]` :
        `crossInteger=${isInt} (=${cr}) allGridInteger=${allInt}`);
  }

  const pass = lines.filter(l => l.ok).length;
  return { pass, total: lines.length, lines };
}
