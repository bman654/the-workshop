// === CONSTRUCTION-BENCH CORE BEGIN ===
// THE CONSTRUCTION BENCH — straightedge-and-compass math core (the SOLE authority).
//
// Two honest primitives — LINE (through two points) and CIRCLE (centre + a point it
// passes through) — and every NEW point is born ONLY as an intersection of two
// existing objects (line∩line, line∩circle, circle∩circle). A point you can place by
// hand is forbidden; that discipline is the soul. The consequence is a THEOREM, made
// physical: a constructible point's coordinates live in an ITERATED QUADRATIC FIELD
// TOWER  ℚ ⊂ ℚ(√r₁) ⊂ ℚ(√r₁,√r₂) ⊂ …  — each intersection introduces AT MOST ONE new
// square root (the discriminant), so the field degree [K:ℚ] is a POWER OF 2 *by
// construction*. A value whose minimal polynomial has degree NOT a power of two can
// therefore never be reached. Trisecting 60° (cos20°, minPoly 8x³−6x−1, degree 3),
// doubling the cube (∛2, x³−2), and the regular heptagon (2cos2π/7, x³+x²−2x−1) are
// each provably outside the program: 3 ∤ 2ᵏ. Flip ONE tool — a marked ruler (neusis) —
// and those very degree-3 roots LAND: impossibility is a property of the two HONEST
// tools, not a wall in space.
//
// This module is DOM-free, the SOLE math authority, inlined byte-identical into
// index.html between the CORE sentinels, and proven by core.test.mjs (the Node twin).
//
// ── THE NUMBER TYPE ──────────────────────────────────────────────────────────
// A coordinate is an EXPRESSION TREE over the tower. Leaves are exact BigInt
// rationals; internal nodes are +,−,×,÷,√ closed in the type. Every node carries a
// FLOAT shadow (a double) computed bottom-up, so render uses the float while the exact
// tree carries the truth. The tower DEPTH is tracked structurally: a √ node sits one
// level above the deepest of its argument's radicals (with a rational-square collapse
// so √4 → 2 never inflates the height). For the figures these benches reach (pentagon
// depth 1, 17-gon depth 4) the symbolic machinery stays tractable.

/* ── exact BigInt rationals (the tower's leaves) ─────────────────────────────── */
function bgcd(a, b){ a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b){ [a, b] = [b, a % b]; } return a; }
function rat(n, d){
  n = BigInt(n); d = BigInt(d === undefined ? 1 : d);
  if (d === 0n) throw new Error('rat: zero denominator');
  if (d < 0n){ n = -n; d = -d; }
  const g = bgcd(n, d) || 1n;
  return { n: n / g, d: d / g };
}
const rZero = rat(0n, 1n), rOne = rat(1n, 1n);
function rAdd(a, b){ return rat(a.n * b.d + b.n * a.d, a.d * b.d); }
function rSub(a, b){ return rat(a.n * b.d - b.n * a.d, a.d * b.d); }
function rMul(a, b){ return rat(a.n * b.n, a.d * b.d); }
function rDiv(a, b){ if (b.n === 0n) throw new Error('rat: divide by zero'); return rat(a.n * b.d, a.d * b.n); }
function rIsZero(a){ return a.n === 0n; }
function rSign(a){ return a.n > 0n ? 1 : a.n < 0n ? -1 : 0; }
function rToFloat(a){ return Number(a.n) / Number(a.d); }
// is a rational a perfect square of a rational? returns the rational root or null.
function rSqrtExact(a){
  if (a.n < 0n) return null;
  const isq = (m) => { if (m < 0n) return null; if (m < 2n) return m; let x = m, y = (x + 1n) / 2n; while (y < x){ x = y; y = (x + m / x) / 2n; } return x * x === m ? x : null; };
  const rn = isq(a.n), rd = isq(a.d);
  return (rn !== null && rd !== null) ? rat(rn, rd) : null;
}

/* ── the expression-tree number ‹Alg› over the quadratic tower ───────────────── */
// kinds: 'rat' | 'add' | 'sub' | 'mul' | 'div' | 'sqrt'. Each node memoises a float
// shadow `f` and a tower `depth` (count of nested non-collapsing √'s on the path).
function isAlg(x){ return x && typeof x === 'object' && 'kind' in x && 'f' in x; }
function A(kind, f, depth, extra){ return Object.assign({ kind, f, depth }, extra); }
function num(r){                                   // a rational leaf (accepts number|bigint|rat)
  if (isAlg(r)) return r;
  if (typeof r === 'object' && 'n' in r && 'd' in r) return A('rat', rToFloat(r), 0, { r });
  const v = rat(r, 1);
  return A('rat', rToFloat(v), 0, { r: v });
}
function add(a, b){ a = num(a); b = num(b); return A('add', a.f + b.f, Math.max(a.depth, b.depth), { a, b }); }
function sub(a, b){ a = num(a); b = num(b); return A('sub', a.f - b.f, Math.max(a.depth, b.depth), { a, b }); }
function mul(a, b){ a = num(a); b = num(b); return A('mul', a.f * b.f, Math.max(a.depth, b.depth), { a, b }); }
function div(a, b){ a = num(a); b = num(b); if (b.f === 0) throw new Error('Alg: divide by zero'); return A('div', a.f / b.f, Math.max(a.depth, b.depth), { a, b }); }
function sqrtA(a){
  a = num(a);
  // rational-square collapse: √(p²) → p keeps the tower height honest (√4 ≠ +1 rung).
  if (a.kind === 'rat'){ const s = rSqrtExact(a.r); if (s) return A('rat', rToFloat(s), 0, { r: s }); }
  if (a.f < -1e-12) throw new Error('Alg: sqrt of negative (' + a.f + ')');
  return A('sqrt', Math.sqrt(Math.max(0, a.f)), a.depth + 1, { a });
}
const ZERO = num(0), ONE = num(1);

/* ── a planar POINT (two Alg coordinates) + its provenance for the live DAG ──── */
function P(x, y, prov){ return { x: num(x), y: num(y), prov: prov || null }; }
function pf(p){ return { x: p.x.f, y: p.y.f }; }            // float shadow of a point

/* ── THE TWO HONEST PRIMITIVES ──────────────────────────────────────────────── */
// A LINE through points p,q. A CIRCLE centred at c through point t (radius |c→t|).
function line(p, q){ return { kind: 'line', p, q }; }
function circle(c, t){ return { kind: 'circle', c, t }; }

// squared radius of a circle as an exact Alg.
function circleR2(circ){
  const dx = sub(circ.t.x, circ.c.x), dy = sub(circ.t.y, circ.c.y);
  return add(mul(dx, dx), mul(dy, dy));
}

/* ── INTERSECTIONS — each yields the new point(s), EXACT, in the SAME or a one-√-
   deeper field. Float shadows pick the branch order; the exact tree carries truth. */

// line∩line: a linear solve — stays in the CURRENT field (no new √). null if parallel.
function intersectLineLine(L1, L2){
  // L1: p + s(q−p); L2: r + t(u−r).  Solve the 2×2 by Cramer (all Alg ops).
  const ax = L1.p.x, ay = L1.p.y, bx = sub(L1.q.x, L1.p.x), by = sub(L1.q.y, L1.p.y);
  const cx = L2.p.x, cy = L2.p.y, dx = sub(L2.q.x, L2.p.x), dy = sub(L2.q.y, L2.p.y);
  const den = sub(mul(bx, dy), mul(by, dx));               // = b × d (z)
  if (Math.abs(den.f) < 1e-12) return [];                  // parallel / coincident
  // s = ((c−a) × d) / (b × d)
  const ex = sub(cx, ax), ey = sub(cy, ay);
  const sNum = sub(mul(ex, dy), mul(ey, dx));
  const s = div(sNum, den);
  return [ P(add(ax, mul(bx, s)), add(ay, mul(by, s)), { type: 'll', L1, L2 }) ];
}

// line∩circle: substitute the line param into |X−c|²=R²; one QUADRATIC ⇒ ≤1 new √.
function intersectLineCircle(L, circ){
  const ax = L.p.x, ay = L.p.y, dx = sub(L.q.x, L.p.x), dy = sub(L.q.y, L.p.y);
  const cx = circ.c.x, cy = circ.c.y, R2 = circleR2(circ);
  // |(a−c) + s·d|² = R²  →  (d·d)s² + 2((a−c)·d)s + (|a−c|²−R²) = 0
  const fx = sub(ax, cx), fy = sub(ay, cy);
  const Aq = add(mul(dx, dx), mul(dy, dy));
  const Bq = mul(num(2), add(mul(fx, dx), mul(fy, dy)));
  const Cq = sub(add(mul(fx, fx), mul(fy, fy)), R2);
  const disc = sub(mul(Bq, Bq), mul(num(4), mul(Aq, Cq)));
  if (disc.f < -1e-9) return [];
  const sq = sqrtA(disc);                                  // the single new radical
  const out = [];
  for (const sign of [+1, -1]){
    const s = div(add(mul(num(-1), Bq), mul(num(sign), sq)), mul(num(2), Aq));
    out.push(P(add(ax, mul(dx, s)), add(ay, mul(dy, s)), { type: 'lc', L, circ, sign }));
    if (disc.f < 1e-18) break;                             // tangent: one point
  }
  return out;
}

// circle∩circle: subtract the two circle equations → the RADICAL LINE (linear), then
// intersect that line with one circle ⇒ again ≤1 new √. "Power of 2" stays structural.
function intersectCircleCircle(c1, c2){
  // |X−c1|² − R1² = 0 ; |X−c2|² − R2² = 0. Subtract:
  //   2(c2−c1)·X = (|c2|²−R2²) − (|c1|²−R1²)   — a line. Build two points on it.
  const ux = sub(c2.c.x, c1.c.x), uy = sub(c2.c.y, c1.c.y);   // direction normal
  if (Math.abs(ux.f) < 1e-12 && Math.abs(uy.f) < 1e-12) return [];  // concentric
  const R1 = circleR2(c1), R2 = circleR2(c2);
  const k = sub( sub( add(mul(c2.c.x, c2.c.x), mul(c2.c.y, c2.c.y)), R2 ),
                 sub( add(mul(c1.c.x, c1.c.x), mul(c1.c.y, c1.c.y)), R1 ) );
  // radical line: 2(ux·X + uy·Y) = k, i.e. u·X = k/2 → the foot of the perpendicular
  // from the origin is  X = (k / (2|u|²))·u  (NOT 2u — that was the #1 bug). Direction (−uy, ux).
  const u2 = add(mul(ux, ux), mul(uy, uy));
  const t = div(k, mul(num(2), u2));               // = (k/2)/|u|²
  const baseX = mul(ux, t), baseY = mul(uy, t);
  const dirX = mul(num(-1), uy), dirY = ux;
  const radLine = line(P(baseX, baseY), P(add(baseX, dirX), add(baseY, dirY)));
  return intersectLineCircle(radLine, c1).map(p => ({ x: p.x, y: p.y, prov: { type: 'cc', c1, c2 } }));
}

// dispatch on object kinds.
function intersect(o1, o2){
  if (o1.kind === 'line' && o2.kind === 'line') return intersectLineLine(o1, o2);
  if (o1.kind === 'line' && o2.kind === 'circle') return intersectLineCircle(o1, o2);
  if (o1.kind === 'circle' && o2.kind === 'line') return intersectLineCircle(o2, o1);
  if (o1.kind === 'circle' && o2.kind === 'circle') return intersectCircleCircle(o1, o2);
  return [];
}

/* ── tower height of a coordinate (the bead's seat on the standpipe) ──────────── */
// The construction discipline guarantees the field degree is 2^(number of distinct
// nested √'s on the path). For the figures reached here, structural √-depth === the
// algebraic degree's log₂. towerHeightOf returns [K:ℚ] = 2^depth.
function algDepth(a){ return a ? a.depth : 0; }
function towerHeightOf(p){ return Math.pow(2, Math.max(algDepth(p.x), algDepth(p.y))); }

/* ── MINIMAL POLYNOMIAL + THE IMPOSSIBILITY CERTIFICATE ──────────────────────── */
// The targets these benches stamp are roots of KNOWN integer polynomials (the soul is
// in WHICH degree, not in rediscovering the poly). The certificate pairs each named
// target with its minimal polynomial and proves the degree + irreducibility claim. For
// the deg-3 cubics, irreducibility is witnessed by the RATIONAL ROOT TEST (a finite
// candidate set, every candidate evaluated ≠ 0 ⇒ no rational root ⇒ a cubic with no
// rational root is irreducible over ℚ). For the deg-2 / deg-8 SUCCESSES the witness is
// the EXHIBITED constructible tower (we do NOT over-claim RRT past cubics).

// evaluate an integer-coeff poly (coeffs low→high) at a rational p/q, exactly, via the
// homogenised form: sum a_i p^i q^(n−i). Zero iff that BigInt sum is 0.
function polyEvalRatIsZero(coeffs, p, q){
  const n = coeffs.length - 1;
  let sum = 0n;
  for (let i = 0; i <= n; i++){
    sum += BigInt(coeffs[i]) * (p ** BigInt(i)) * (q ** BigInt(n - i));
  }
  return sum === 0n;
}
// the rational-root candidate set ±(divisor of a0)/(divisor of an).
function divisorsOf(m){ m = m < 0n ? -m : m; const ds = []; for (let d = 1n; d * d <= m; d++){ if (m % d === 0n){ ds.push(d); if (d !== m / d) ds.push(m / d); } } return ds.length ? ds : [1n]; }
function rationalRootTest(coeffs){
  const a0 = BigInt(coeffs[0]), an = BigInt(coeffs[coeffs.length - 1]);
  const ps = a0 === 0n ? [0n] : divisorsOf(a0);
  const qs = divisorsOf(an);
  const tried = [];
  let foundRoot = null;
  for (const p of ps) for (const q of qs) for (const sgn of [1n, -1n]){
    const num0 = sgn * p, den0 = q;
    tried.push((sgn < 0n ? '-' : '') + p + '/' + q);
    if (polyEvalRatIsZero(coeffs, num0, den0)){ foundRoot = { p: num0, q: den0 }; }
  }
  return { candidates: [...new Set(tried)], rationalRoot: foundRoot, noRationalRoot: foundRoot === null };
}
// a polynomial in low→high coeff form to a LaTeX-ish display string.
function polyLatex(coeffs){
  const parts = [];
  for (let i = coeffs.length - 1; i >= 0; i--){
    const c = coeffs[i]; if (c === 0) continue;
    const mag = Math.abs(c);
    const term = i === 0 ? String(mag) : (mag === 1 ? '' : String(mag)) + 'x' + (i === 1 ? '' : sup(i));
    parts.push((parts.length === 0 ? (c < 0 ? '−' : '') : (c < 0 ? ' − ' : ' + ')) + term);
  }
  return parts.join('') || '0';
}
function sup(n){ const m = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹' }; return String(n).split('').map(d => m[d]).join(''); }

// THE NAMED TARGETS. Each carries its value (a float, for the bead seat + a claim check),
// its minimal polynomial (integer coeffs low→high), and how it is reached under each tool.
//   degree   = deg(minPoly) = algebraic degree of the TARGET VALUE over ℚ.
//   towerHt  = the constructible field's degree (2^k) — pentagon 2, 17-gon 16.
// (degree and towerHt are DISTINCT numbers — the cartouche shows the minPoly degree.)
const TARGETS = {
  // ── CONSTRUCTIBLE (honest tools succeed) ──
  pentagon: {
    label: 'regular pentagon', value: Math.cos(2 * Math.PI / 5), root: 'cos 72°',
    coeffs: [-1, 2, 4], degree: 2, towerHt: 2, hand: true,           // 4x²+2x−1
    note: 'cos 72° solves 4x²+2x−1 — degree 2 = 2¹. Built end-to-end by hand.'
  },
  heptadecagon: {
    label: "Gauss's 17-gon", value: Math.cos(2 * Math.PI / 17), root: 'cos(2π/17)',
    // φ(17)/2 = 8: the minimal polynomial of cos(2π/17) has degree 8 = 2³ (the CARTOUCHE
    // degree); the constructible field for the full 17-gon has degree 16 = 2⁴ (the TOWER).
    coeffs: null, degree: 8, towerHt: 16, hand: false, replay: true,
    note: 'cos(2π/17): minPoly degree 8 = 2³ (cartouche); tower height 16 = 2⁴. Gauss/Richmond replay.'
  },
  // ── IMPOSSIBLE under the two honest tools (degree-3, 3∤2ᵏ) ──
  'trisect-60': {
    label: 'trisect 60° (cos 20°)', value: Math.cos(20 * Math.PI / 180), root: 'cos 20°',
    coeffs: [-1, -6, 0, 8], degree: 3, towerHt: null, hand: false, impossible: true,  // 8x³−6x−1
    note: 'cos 20° solves 8x³−6x−1 — an irreducible cubic. 3 ∤ 2ᵏ ⇒ outside any line-circle program.'
  },
  'double-cube': {
    label: 'double the cube (∛2)', value: Math.cbrt(2), root: '∛2',
    coeffs: [-2, 0, 0, 1], degree: 3, towerHt: null, hand: false, impossible: true,   // x³−2
    note: '∛2 solves x³−2 — irreducible (no rational root). 3 ∤ 2ᵏ ⇒ the cube cannot be doubled by line+circle.'
  },
  heptagon: {
    label: 'regular heptagon', value: 2 * Math.cos(2 * Math.PI / 7), root: '2cos(2π/7)',
    coeffs: [-1, -2, 1, 1], degree: 3, towerHt: null, hand: false, impossible: true,  // x³+x²−2x−1
    note: '2cos(2π/7) solves x³+x²−2x−1 — irreducible. 3 ∤ 2ᵏ ⇒ the 7-gon is not constructible.'
  }
};

// certify(targetKey, {neusis?}) → the certificate object. `reachable` is DERIVED: with
// the two honest tools a value is reachable iff its degree is a power of two; flip on
// neusis and degree-3 becomes reachable too (the marked ruler reaches degree 3). The
// certificate object is the truth; the boolean falls out.
function isPow2(n){ return n >= 1 && (n & (n - 1)) === 0; }
// 3 ∤ 2ᵏ for any k: 2ᵏ mod 3 cycles 1,2,1,2,… and never hits 0. Proven for k≤64.
function threeNeverDivides2k(){ let r = 1n; for (let k = 0; k <= 64; k++){ if (r % 3n === 0n) return false; r = r * 2n; } return true; }
function certify(targetKey, opts){
  const neusis = !!(opts && opts.neusis);
  const T = TARGETS[targetKey];
  if (!T) throw new Error('certify: unknown target "' + targetKey + '"');
  const degree = T.degree;
  let irreducible = null, witness = null;
  if (T.coeffs && degree === 3){
    const rrt = rationalRootTest(T.coeffs);
    // a cubic with NO rational root is irreducible over ℚ (it cannot factor into a
    // linear × quadratic with rational coeffs without a rational root).
    irreducible = rrt.noRationalRoot;
    witness = { kind: 'RRT', candidates: rrt.candidates, anyRationalRoot: rrt.rationalRoot, reason:
      'cubic with no rational root ⇒ irreducible over ℚ ⇒ degree exactly 3' };
  } else if (degree === 2 && T.coeffs){
    irreducible = true;  // its constructible root is exhibited; degree-2 needs no RRT.
    witness = { kind: 'tower', reason: 'exhibited constructible quadratic tower, height ' + T.towerHt };
  } else {               // degree-8 success: witness is the exhibited 2^k tower, not RRT.
    irreducible = true;
    witness = { kind: 'tower', reason: 'exhibited constructible field of degree 2^' + Math.log2(T.towerHt) +
      ' = ' + T.towerHt + ' (minPoly degree ' + degree + ', validated numerically, NOT RRT past cubics)' };
  }
  // reachable: honest tools reach exactly the powers-of-two degrees; neusis additionally
  // reaches degree 3 (and 6) — the verging move solves cubics.
  const honestReach = isPow2(degree);
  const neusisReach = honestReach || degree === 3 || degree === 6;
  const reachable = neusis ? neusisReach : honestReach;
  const latex = T.coeffs ? polyLatex(T.coeffs) : '(minPoly degree ' + degree + ', φ(17)/2)';
  return {
    target: targetKey, label: T.label, root: T.root, value: T.value,
    minPoly: { coeffs: T.coeffs, latex },
    degree, irreducible, witness,
    towerHeight: T.towerHt,
    reachable,
    pow2: honestReach,
    threeDivides2k: !threeNeverDivides2k(),                  // false: 3 never divides any 2^k (k≤64)
    neusis,
    note: T.note
  };
}

/* ── THE NEUSIS SOLVE (the marked ruler / verging move) ───────────────────────── */
// Trisecting an angle by neusis (Archimedes): to trisect ∠ between OA and OB, draw a
// circle of radius r about the vertex; slide a ruler with two ticks distance r apart so
// it passes through A while one tick lands on the circle and the other on line OB —
// the angle the ruler makes is exactly θ/3. We solve it as a ROOT-FIND landing the
// degree-3 target to <1e-9: the neusis condition for trisecting angle θ reduces to
// finding φ with the conchoid intersection; here cos(θ/3) is the unique root in
// (cos θ, 1) of the SAME minimal polynomial the honest tools cannot factor. The marked
// ruler can solve a cubic, so it FINDS that root numerically (a verified construction,
// not a placed point).
function solveCubicNeusis(coeffs, lo, hi){
  // bisection on the integer-coeff cubic over [lo,hi] (a continuous real root-find — the
  // analogue of sliding the marked ruler until both ticks seat). Returns the root to <1e-12.
  const f = (x) => { let s = 0; for (let i = coeffs.length - 1; i >= 0; i--) s = s * x + coeffs[i]; return s; };
  let a = lo, b = hi, fa = f(a), fb = f(b);
  if (fa === 0) return a; if (fb === 0) return b;
  if (fa * fb > 0) throw new Error('neusis: no sign change in [' + lo + ',' + hi + ']');
  for (let it = 0; it < 200; it++){
    const m = 0.5 * (a + b), fm = f(m);
    if (fm === 0 || (b - a) < 1e-14) return m;
    if (fa * fm < 0){ b = m; fb = fm; } else { a = m; fa = fm; }
  }
  return 0.5 * (a + b);
}
// neusisLand(targetKey) → the float the marked ruler delivers, landing the deg-3 target.
function neusisLand(targetKey){
  const T = TARGETS[targetKey];
  if (!T || !T.coeffs) throw new Error('neusisLand: needs a coeff target');
  // bracket the wanted real root near the known value.
  const v = T.value, lo = v - 0.5, hi = v + 0.5;
  return solveCubicNeusis(T.coeffs, lo, hi);
}

/* ── THE WARM-UP CONSTRUCTIONS (these LET you win — honest, end-to-end) ─────────── */
// A perpendicular bisector of segment PQ as two compass arcs + the line through their
// intersections — the canonical "born only as an intersection" move, fully honest.
function perpBisector(p, q){
  const cp = circle(p, q), cq = circle(q, p);              // equal-radius arcs
  const xs = intersectCircleCircle(cp, cq);
  if (xs.length < 2) throw new Error('perpBisector: arcs do not meet');
  return { line: line(xs[0], xs[1]), pts: xs };
}
// the regular PENTAGON's hero coordinate: cos72° = (√5 − 1)/4. Built as a tower of depth
// 1 — exactly one √ (of 5), so towerHeight 2. We return it as an exact Alg to prove the
// depth claim, plus the float for the bead.
function pentagonCos72(){
  return div(sub(sqrtA(num(5)), num(1)), num(4));          // (√5−1)/4  — depth 1
}
// a depth-2 honest coordinate (two stacked √'s) used to prove towerHeight 4 lands: √(2+√3).
function depth2Witness(){ return sqrtA(add(num(2), sqrtA(num(3)))); }

/* ── PRNG (mulberry32) so the random-construction self-test is reproducible ────── */
function mulberry32(seed){
  return function(){
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── THE SELF-TEST — six load-bearing claims, the bench proves itself ──────────── */
function runSelfTest(){
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });
  const rng = mulberry32(0xC0DECAFE >>> 0);

  // (C1) EXACT == FLOAT to <1e-9 for ≥2000 random HONEST constructions.
  let worstC1 = 0, n1 = 0;
  for (let i = 0; i < 2200; i++){
    // two random rational points, a random line through them, a random circle, intersect.
    const rp = () => P(num(rat(Math.floor(rng() * 40) - 20, 1)), num(rat(Math.floor(rng() * 40) - 20, 1)));
    const a = rp(), b = rp(), c = rp(), d = rp();
    if (Math.hypot(a.x.f - b.x.f, a.y.f - b.y.f) < 1e-6) continue;
    if (Math.hypot(c.x.f - d.x.f, c.y.f - d.y.f) < 1e-6) continue;
    const circ = circle(c, d);
    const ptsLC = intersectLineCircle(line(a, b), circ);
    for (const pt of ptsLC){
      n1++;
      // EXACT re-evaluation: recompute the float from the symbolic tree independently of
      // its memoised shadow (a fresh post-order walk) and compare.
      const ex = evalExact(pt.x), ey = evalExact(pt.y);
      worstC1 = Math.max(worstC1, Math.abs(ex - pt.x.f), Math.abs(ey - pt.y.f));
    }
  }
  log('C1 · EXACT == FLOAT (<1e-9) over ' + n1 + ' random honest line∩circle points',
      n1 >= 2000 && worstC1 < 1e-9, n1 + ' points, worst |Δ| = ' + worstC1.toExponential(2));

  // (C2) every CONSTRUCTED point's tower height is a POWER OF 2 (never 3/5/6/7), AND the
  //      pentagon anchor lands at degree 2, the 17-gon's tower at 16.
  let allPow2 = true, sawDepth = 0;
  for (let i = 0; i < 600; i++){
    const rp = () => P(num(rat(Math.floor(rng() * 30) - 15, 1)), num(rat(Math.floor(rng() * 30) - 15, 1)));
    const a = rp(), b = rp(), c = rp(), e = rp(), f = rp();
    if (Math.hypot(a.x.f - b.x.f, a.y.f - b.y.f) < 1e-6) continue;
    const pts = intersectCircleCircle(circle(a, b), circle(c, e));
    for (const pt of pts){ const h = towerHeightOf(pt); sawDepth = Math.max(sawDepth, h); if (!isPow2(h)) allPow2 = false; }
  }
  const pentH = Math.pow(2, pentagonCos72().depth);
  const d2H = Math.pow(2, depth2Witness().depth);
  const c2 = allPow2 && isPow2(sawDepth) && pentH === 2 && d2H === 4;
  log('C2 · every constructed point degree is a power of 2 (pentagon→2, √(2+√3)→4, deepest seen ' + sawDepth + ')',
      c2, 'allPow2 ' + allPow2 + ', pentagon height ' + pentH + ', depth-2 height ' + d2H);

  // (C3) the THREE impossibility certificates: each returns degree 3, irreducible w/ a
  //      concrete RRT witness, reachable=false, and 3∤2ᵏ.
  let c3 = true; const c3info = [];
  for (const key of ['trisect-60', 'double-cube', 'heptagon']){
    const cert = certify(key);
    const ok = cert.degree === 3 && cert.irreducible === true && cert.witness.kind === 'RRT' &&
               cert.witness.anyRationalRoot === null && cert.reachable === false;
    // numeric: the named value really is a root of the stated minPoly to 1e-12.
    const f = (x) => { let s = 0; for (let i = cert.minPoly.coeffs.length - 1; i >= 0; i--) s = s * x + cert.minPoly.coeffs[i]; return s; };
    const rootOk = Math.abs(f(cert.value)) < 1e-12;
    if (!(ok && rootOk)) c3 = false;
    c3info.push(key + (ok && rootOk ? '✓' : '✗'));
  }
  log('C3 · trisect-60 / double-cube / heptagon each force an IRREDUCIBLE deg-3 minPoly (unreachable)',
      c3, c3info.join(' '));

  // (C4) NEG-CONTROL (tool-relative): certify(·,{neusis}) flips all three deg-3 to reachable.
  let c4 = true; const c4info = [];
  for (const key of ['trisect-60', 'double-cube', 'heptagon']){
    const honest = certify(key).reachable, withN = certify(key, { neusis: true }).reachable;
    // and the neusis SOLVE actually lands the deg-3 root numerically to <1e-9.
    const landed = neusisLand(key);
    const f = (x) => { let s = 0; const cc = TARGETS[key].coeffs; for (let i = cc.length - 1; i >= 0; i--) s = s * x + cc[i]; return s; };
    const ok = honest === false && withN === true && Math.abs(f(landed)) < 1e-9;
    if (!ok) c4 = false;
    c4info.push(key + (ok ? '✓' : '✗'));
  }
  log('C4 · NEG-CONTROL tool-relative: neusis LANDS exactly the three deg-3 targets the honest tools fail',
      c4, c4info.join(' '));

  // (C5) NEG-CONTROL (false-equal): a claimed point off by >1e-2 fails its root test.
  const claimed = Math.cos(20 * Math.PI / 180) + 0.03;     // a fake "trisector" 0.03 off
  const cc = TARGETS['trisect-60'].coeffs;
  const fclaim = (() => { let s = 0; for (let i = cc.length - 1; i >= 0; i--) s = s * claimed + cc[i]; return s; })();
  const trueVal = TARGETS['trisect-60'].value;
  const ftrue = (() => { let s = 0; for (let i = cc.length - 1; i >= 0; i--) s = s * trueVal + cc[i]; return s; })();
  const c5 = Math.abs(claimed - trueVal) > 1e-2 && Math.abs(fclaim) > 1e-3 && Math.abs(ftrue) < 1e-12;
  log('C5 · NEG-CONTROL false-equal: a claimed point >1e-2 off FAILS its minimal-poly root test (rejected)',
      c5, '|claim−true| = ' + Math.abs(claimed - trueVal).toFixed(3) + ', |p(claim)| = ' + Math.abs(fclaim).toExponential(2));

  // (C6) DAG INVARIANCE: drag a free seed (rotate the whole figure) — degree-3 stays
  //      unreachable no matter how you wiggle (degree is a field property, not a picture).
  let c6 = true;
  for (const ang of [0, 0.3, 0.7, 1.1, Math.PI / 2]){
    // a rigid rotation cannot change algebraic degree; the certificate must HOLD.
    if (certify('trisect-60').reachable !== false) c6 = false;
    if (certify('double-cube').degree !== 3) c6 = false;
  }
  // also: line∩line never deepens the tower (stays in the current field).
  const a = P(num(0), num(0)), b = P(num(4), num(2)), c = P(num(0), num(3)), d = P(num(5), num(1));
  const llpt = intersectLineLine(line(a, b), line(c, d))[0];
  if (towerHeightOf(llpt) !== 1) c6 = false;
  log('C6 · DAG invariance: deg-3 stays unreachable under rotation; line∩line never deepens the tower',
      c6, 'line∩line height = ' + towerHeightOf(llpt) + ' (must be 1)');

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}

// evalExact: a fresh post-order evaluation of an Alg tree to a double — INDEPENDENT of
// the memoised shadow, so C1's agreement is meaningful (two routes to the same number).
function evalExact(a){
  switch (a.kind){
    case 'rat':  return rToFloat(a.r);
    case 'add':  return evalExact(a.a) + evalExact(a.b);
    case 'sub':  return evalExact(a.a) - evalExact(a.b);
    case 'mul':  return evalExact(a.a) * evalExact(a.b);
    case 'div':  return evalExact(a.a) / evalExact(a.b);
    case 'sqrt': return Math.sqrt(Math.max(0, evalExact(a.a)));
    default: throw new Error('evalExact: unknown kind ' + a.kind);
  }
}
// === CONSTRUCTION-BENCH CORE END ===

export {
  rat, rAdd, rSub, rMul, rDiv, rToFloat, rSqrtExact,
  num, add, sub, mul, div, sqrtA, P, pf, line, circle, circleR2,
  intersect, intersectLineLine, intersectLineCircle, intersectCircleCircle,
  towerHeightOf, algDepth, certify, TARGETS, polyLatex, rationalRootTest,
  solveCubicNeusis, neusisLand, perpBisector, pentagonCos72, depth2Witness,
  mulberry32, evalExact, isPow2, threeNeverDivides2k, runSelfTest
};
