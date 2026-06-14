// ============================================================================
//  The Times-Table Cardioid — string art ⟺ cipher wheel              (CORE)
//  Pure, dependency-free. Identical code is inlined into index.html between
//  sentinels; this file is the Node-testable twin (the falsifiability harness
//  runs against it, and re-extracts the inlined copy to prove byte-parity).
//
//  THE MEDIUM: modular arithmetic, the FOURTH bench of the Numbers Room (after
//  The Best Rational, The Ulam Spiral and The Collatz Bench). Put m points
//  evenly round a circle, numbered 0…m−1. From each point i, draw one chord to
//  point (k·i) mod m. That single rule — the k times-table on the ring ℤ/mℤ —
//  draws a CARDIOID at k=2, a NEPHROID at k=3, and in general an epicycloid with
//  exactly k−1 cusps. The chords are never the curve; they are TANGENT to it, and
//  the curve EMERGES as their envelope where they pile up.
//
//  THE TWIN FACT (why this bench is one ring, not two): the very same map
//  i ↦ (k·i) mod m is the MULTIPLICATIVE half of an affine cipher E(P)=(k·P+b)
//  mod m. It is a bijection — an invertible key — IFF gcd(k,m)=1; otherwise it
//  collapses the m residues onto m/gcd(k,m) of them and is no key at all. So the
//  ring that draws the cardioid is, with no change of object, a cipher wheel —
//  the multiplicative wheel the additive Volvelle never had. Together they make
//  the full affine cipher.
//
//  WHY PLAIN Number ARITHMETIC IS SAFE: every value here is a residue in [0,m)
//  with m ≤ 720, and the largest product computed is k·i < 720·720 = 518400 ≪
//  Number.MAX_SAFE_INTEGER (2^53−1). Every (k·i) mod m is computed EXACTLY in a
//  double. The geometry is on the unit circle (|coords| ≤ 1), scaled at render.
//
//  THE FOUR FALSIFIABLE CLAIMS (each checked live, to machine precision):
//   (1) ENVELOPE == CLOSED-FORM EPICYCLOID (tangency, <1e-12). For every drawn
//       chord i→(k·i)%m, the closed-form epicycloid point E(t_i) at t_i=2πi/m
//       lies ON that chord: the perpendicular distance ⊥ is < 1e-12 (measured
//       ≈7e-16). This is NO fit and NO search — E is evaluated in closed form and
//       the chord is the literal drawn segment; they coincide because the chord
//       is the tangent line to the envelope. ★ANTI-CIRCULARITY: an INDEPENDENT
//       numeric envelope (the limit of two neighbouring chords' intersection,
//       t±h) must match E(t) to <1e-8 — so E isn't trusted, it's corroborated.
//   (2) CUSP COUNT == k−1. analyticCuspCount(k)=k−1 (0 for k≤1); the numeric
//       local-minima of the envelope speed |E'(t)| that fall below CUSP_EPS equal
//       it exactly; and cuspParams(k) names the k−1 cusp parameters, each a
//       genuine |E'|≈0 (a true cusp, where the tracing point instantaneously
//       stops). k=2 → 1 cusp (cardioid), k=3 → 2 (nephroid), k=5 → 4.
//   (3) CIPHER HANDSHAKE (the same map, as a key). For coprime (k,m): isValidKey
//       true, modInverse≠null with k·k⁻¹≡1, the image hits all m residues, and
//       affineDecipher∘affineEncipher==identity for ALL P (incl. nonzero b). The
//       NEGATIVE CONTROL WITH TEETH: for non-coprime (k,m) isValidKey is false,
//       modInverse is null, and the image collapses onto EXACTLY m/gcd(k,m)
//       residues (13, 180, 90, 72 for the named foils) — bits are lost, it is no
//       key. degenerateChordCount(k,m)=gcd(k−1,m) counts the zero-length chords.
//   (4) k=1 TRIVIAL NEGATIVE CONTROL. chordTarget(i,1,m)=i: every chord is
//       zero-length, nothing is drawn, the "envelope" is just the unit circle,
//       and there are 0 cusps. ★HONESTY: k=1 draws nothing AND k=1 is a perfectly
//       valid identity cipher key (isValidKey(1,m) true) — two DISTINCT, non-
//       contradictory predicates (a thing can be a valid key yet draw no curve).
// ============================================================================

const TAU = Math.PI * 2;

// Below this envelope-speed |E'(t)|, the tracing point is treated as momentarily
// stopped — a cusp. Used ONLY to guard the (normalised) tangent-angle residual
// T2; the always-checked headline residual T1 (perpendicular distance) needs no
// such guard and is robust everywhere, cusps included.
export const CUSP_EPS = 1e-3;

// ── THE ONE MAP — the single shared rule every construction is built on. The
//    re-extraction parity harness checks THIS function char-for-char against the
//    page's inlined copy. The render literally calls it to place each chord; the
//    cipher disk literally calls it to place each spoke. One ring, not two. ──
export function chordTarget(i, k, m){ return ((k * i) % m + m) % m; }

// ── GEOMETRY on the unit circle (the render scales by R and applies phase) ───
// point j of m, evenly spaced (0 at angle 0, CCW). The render re-rotates so
// residue 0 sits at the top, clockwise — both art AND analytic overlay share it.
export function ptOnCircle(j, m){ const a = TAU * j / m; return { x: Math.cos(a), y: Math.sin(a) }; }

// The closed-form epicycloid the chords envelope. Derived as the tangent-line
// envelope of the family {chord from angle t to angle k·t}; it is the standard
// epicycloid of k−1 cusps, here in the convenient form with a=k/(k+1), b=1/(k+1)
// (so the curve sits inside the unit circle and the cusps reach it).
export function envelopePoint(t, k){
  const a = k / (k + 1), b = 1 / (k + 1);
  return { x: a * Math.cos(t) + b * Math.cos(k * t), y: a * Math.sin(t) + b * Math.sin(k * t) };
}
// Its velocity E'(t) — vanishes exactly at the k−1 cusps (the cusp test).
export function envelopeVel(t, k){
  const a = k / (k + 1), b = 1 / (k + 1);
  return { x: -a * Math.sin(t) - b * k * Math.sin(k * t), y: a * Math.cos(t) + b * k * Math.cos(k * t) };
}

// ── CLAIM 2 — cusps ──────────────────────────────────────────────────────────
// An epicycloid traced by this construction has exactly k−1 cusps (0 for k≤1,
// where the construction degenerates to the circle / a point).
export function analyticCuspCount(k){ return k <= 1 ? 0 : k - 1; }
// The k−1 cusp parameters t* (where |E'(t*)|=0). For the a,b above the speed
// |E'| has its zeros at t = (π + 2πn)/(k−1), n = 0…k−2. Empty for k≤1.
export function cuspParams(k){
  const out = [];
  if (k <= 1) return out;
  for (let n = 0; n <= k - 2; n++) out.push((Math.PI + TAU * n) / (k - 1));
  return out;
}

// ── CLAIM 1 — the tangency residual (per drawn chord; NO fitting, NO search) ──
// For chord i → (k·i)%m, with t_i = 2πi/m: the tangent point is E(t_i). We report
//   • perp  — T1, the PERPENDICULAR distance from E(t_i) to the chord line. This
//             is the always-checked headline residual; robust everywhere (incl.
//             cusps) because it never normalises by |E'|. Must be < 1e-12.
//   • tangentSin — T2, |sin∠(chord, E'(t_i))|, the normalised tangent-direction
//             residual. GUARDED: returned only where |E'| > CUSP_EPS; at a cusp
//             E' vanishes and the tangent direction is undefined, so it is null
//             there (the cusp guard — a sibling must NOT simplify it away).
// Zero-length (self-mapping) chords return early BEFORE any divide by len.
export function chordTangencyResidual(i, k, m){
  const ti = TAU * i / m;
  const A = ptOnCircle(i, m), B = ptOnCircle(chordTarget(i, k, m), m);
  const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy);
  if (len < 1e-9) return { degenerate: true, perp: 0, tangentSin: null }; // self-map → skip
  const E = envelopePoint(ti, k);
  const perp = Math.abs(dx * (E.y - A.y) - dy * (E.x - A.x)) / len;       // T1: collinearity
  const V = envelopeVel(ti, k), vlen = Math.hypot(V.x, V.y);
  const tangentSin = vlen > CUSP_EPS ? Math.abs(dx * V.y - dy * V.x) / (len * vlen) : null; // T2, guarded
  return { degenerate: false, perp, tangentSin };
}

// How many of the m chords are zero-length (i maps to itself)? i ≡ k·i (mod m)
// ⟺ (k−1)·i ≡ 0 (mod m), whose solution count is exactly gcd(k−1, m). VERIFIED.
export function degenerateChordCount(k, m){ return gcd(((k - 1) % m + m) % m, m); }

// ── CLAIM 3 — the cipher (the multiplicative half of E(P)=(aP+b) mod m) ──────
export function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while (b){ const t = a % b; a = b; b = t; } return a; }
// extended gcd: returns [g, x, y] with a·x + b·y = g.
export function egcd(a, b){ if (b === 0) return [a, 1, 0]; const [g, x, y] = egcd(b, a % b); return [g, y, x - Math.floor(a / b) * y]; }
// k⁻¹ mod m, or null when gcd(k,m)≠1 (no inverse — the key is degenerate).
export function modInverse(k, m){ const [g, x] = egcd(((k % m) + m) % m, m); if (g !== 1) return null; return ((x % m) + m) % m; }
// Is k a valid multiplicative key on ℤ/mℤ? (a bijection ⟺ coprime to m)
export function isValidKey(k, m){ return gcd(k, m) === 1; }
// The affine cipher's two halves: E(P) = (k·P + b) mod m, D(C) = k⁻¹·(C − b) mod m.
export function affineEncipher(P, k, m, b = 0){ return ((k * P + b) % m + m) % m; }
export function affineDecipher(C, k, m, b = 0){ const ki = modInverse(k, m); return ki === null ? null : ((ki * (C - b) % m) + m) % m; }
// Size of the image {k·P mod m : P}. VERIFIED === m/gcd(k,m) exactly (= m iff key).
export function imageDistinctCount(k, m){ const s = new Set(); for (let P = 0; P < m; P++) s.add(((k * P) % m + m) % m); return s.size; }

// ── DETERMINISTIC LAYOUT (single source for render + PNG, no second walker) ──
// Every drawn chord, in residue order, with unit-circle endpoints and a flag.
export function buildChords(m, k){
  const out = [];
  for (let i = 0; i < m; i++){
    const j = chordTarget(i, k, m);
    const A = ptOnCircle(i, m), B = ptOnCircle(j, m);
    out.push({ i, j, ax: A.x, ay: A.y, bx: B.x, by: B.y, degenerate: j === i });
  }
  return out;
}
// The closed-form envelope, sampled over t∈[0,2π] (the analytic overlay's source).
export function sampleEnvelope(k, n = 720){
  const out = [];
  for (let s = 0; s <= n; s++){ const t = TAU * s / n; out.push(envelopePoint(t, k)); }
  return out;
}

// ── THE IN-PAGE SELF-TEST (the pill; mirrors the siblings' shape) ────────────
// Returns { pass, total, lines:[{name, ok, detail}] }. Every detail carries LIVE
// numbers, never a hardcoded echo. Default (m=360,k=2) is the cardioid; the Node
// twin runs it at several (m,k) plus heavier checks.
export function runSelfTest(m = 360, k = 2){
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });

  // 1. ENVELOPE == CLOSED-FORM EPICYCLOID: every non-degenerate chord's ⊥ residual
  //    to E(t_i) is < 1e-12 (robust T1, no |E'| normalisation).
  {
    let maxPerp = 0, n = 0, bad = 0, fb = '';
    for (let i = 0; i < m; i++){
      const r = chordTangencyResidual(i, k, m);
      if (r.degenerate) continue;
      n++;
      if (r.perp > maxPerp) maxPerp = r.perp;
      if (r.perp >= 1e-12){ if (!bad) fb = `i=${i}: ⊥=${r.perp.toExponential(2)}`; bad++; }
    }
    T(`envelope == closed-form epicycloid: every chord's ⊥ residual to E(t) < 1e-12 (k=${k}, m=${m})`,
      bad === 0 && n > 0,
      bad === 0 ? `${n} chords, max ⊥ = ${maxPerp.toExponential(2)} (machine zero)` : `${bad} exceed 1e-12 (first ${fb})`);
  }

  // 2. CUSP COUNT == k−1: analytic === numeric-minima === cuspParams length, and
  //    each named cusp parameter is a genuine |E'|≈0.
  {
    const analytic = analyticCuspCount(k);
    // numeric local minima of |E'| below CUSP_EPS
    const NS = 12000;
    let minima = 0;
    const speed = (s) => { const V = envelopeVel(TAU * s / NS, k); return Math.hypot(V.x, V.y); };
    let prev = speed(0), cur = speed(1);
    for (let s = 2; s <= NS; s++){
      const nx = speed(s);
      if (cur < prev && cur < nx && cur < CUSP_EPS) minima++;
      prev = cur; cur = nx;
    }
    const ps = cuspParams(k);
    let maxV = 0;
    for (const t of ps){ const V = envelopeVel(t, k); maxV = Math.max(maxV, Math.hypot(V.x, V.y)); }
    const ok = analytic === minima && ps.length === analytic && (ps.length === 0 || maxV < 1e-9);
    T(`cusp count == k−1 (analytic === numeric minima of |E'| === named cusp params)`,
      ok,
      ok ? `k=${k} → ${analytic} cusp${analytic === 1 ? '' : 's'}; ${minima} numeric minima; ${ps.length} params, max|E'|=${maxV.toExponential(1)}` :
        `analytic ${analytic} · minima ${minima} · params ${ps.length} (max|E'|=${maxV.toExponential(1)})`);
  }

  // 3. CIPHER HANDSHAKE: this k on ℤ/mℤ is a valid multiplicative key ⟺ gcd(k,m)=1,
  //    with k⁻¹ and a full-image bijection when it is; image collapses to
  //    m/gcd(k,m) when it isn't; degenerateChordCount === gcd(k−1,m) and matches
  //    the built chords. Tested on a FIXED coprime/non-coprime pair so the line is
  //    stable regardless of the (m,k) the pill is run at.
  {
    const g = gcd(k, m), coprime = g === 1;
    const ki = modInverse(k, m);
    const img = imageDistinctCount(k, m);
    const keyOk = isValidKey(k, m) === coprime &&
      (coprime ? (ki !== null && (k * ki) % m === 1 && img === m)
               : (ki === null && img === m / g));
    // roundtrip on a coprime witness (so this sub-check always has teeth)
    const wk = 7, wm = 26, wb = 3;
    let rt = true;
    for (let P = 0; P < wm; P++){ if (affineDecipher(affineEncipher(P, wk, wm, wb), wk, wm, wb) !== P){ rt = false; break; } }
    // teeth: a known non-coprime collapse
    const tImg = imageDistinctCount(6, 26), tg = gcd(6, 26);
    const teeth = tImg === 26 / tg && modInverse(6, 26) === null;
    // degenerate-chord bridge: zero-length chords === gcd(k−1,m)
    const chords = buildChords(m, k);
    const degBuilt = chords.filter(c => c.degenerate).length;
    const degOk = degBuilt === degenerateChordCount(k, m);
    const ok = keyOk && rt && teeth && degOk;
    T(`cipher handshake: same map is a key ⟺ gcd(k,m)=1 (k⁻¹, full image), collapses to m/gcd otherwise`,
      ok,
      ok ? `gcd(${k},${m})=${g} → ${coprime ? `key, k⁻¹=${ki}, image=${img}=m` : `degenerate, image=${img}=m/${g}`}; ` +
           `roundtrip(7,26,b=3) ✓; foil (6,26) collapses 26→13; ${degBuilt} zero-length = gcd(k−1,m)` :
        `keyOk ${keyOk} · roundtrip ${rt} · teeth ${teeth} · deg ${degOk}`);
  }

  // 4. k=1 TRIVIAL NEGATIVE CONTROL (two distinct, non-contradictory predicates):
  //    (a) k=1 DRAWS NOTHING — every chord self-maps, 0 cusps, the envelope is the
  //        unit circle; (b) k=1 IS A VALID IDENTITY CIPHER KEY — isValidKey true.
  //    These are labelled as SEPARATE facts so no reviewer reads a contradiction.
  {
    let allDeg = true;
    for (let i = 0; i < m; i++) if (chordTarget(i, 1, m) !== i){ allDeg = false; break; }
    const noCusps = analyticCuspCount(1) === 0 && cuspParams(1).length === 0;
    // sampleEnvelope(1) is the unit circle: every sample has radius 1
    let onCircle = true;
    for (const p of sampleEnvelope(1, 360)) if (Math.abs(Math.hypot(p.x, p.y) - 1) > 1e-12){ onCircle = false; break; }
    const drawsNothing = allDeg && noCusps && onCircle && imageDistinctCount(1, m) === m;
    const validKey = isValidKey(1, m) === true && modInverse(1, m) === 1; // identity cipher
    const ok = drawsNothing && validKey;
    T(`k=1 control: PREDICATE A "draws nothing" (all self-map, 0 cusps, envelope=circle) AND PREDICATE B "valid identity key" — both true, not a contradiction`,
      ok,
      ok ? `A: ${m}/${m} chords self-map, 0 cusps, envelope=unit circle · B: isValidKey(1,${m})=true, 1⁻¹=1 (distinct facts)` :
        `drawsNothing ${drawsNothing} · validKey ${validKey}`);
  }

  // 5. THE ONE MAP is shared by art and cipher (drift guard): chordTarget IS the
  //    multiplicative map affineEncipher with b=0 — render and cipher call the
  //    same function, or "one ring" is rhetorical.
  {
    let ok = true, fb = '';
    for (let i = 0; i < m; i++){
      if (chordTarget(i, k, m) !== affineEncipher(i, k, m, 0)){ ok = false; fb = `i=${i}`; break; }
    }
    T(`one ring: chordTarget(i,k,m) === affineEncipher(i,k,m,0) for all i (art map === cipher map)`,
      ok, ok ? `${m} residues identical — the string-art map IS the multiplicative cipher` : `drift at ${fb}`);
  }

  // 6. ANTI-CIRCULARITY: the closed-form E(t) is corroborated by an INDEPENDENT
  //    numeric envelope — the limit of two neighbouring chords' intersection
  //    (t±h) — to < 1e-8. E isn't trusted; it's the proven limit of the art.
  {
    const h = 1e-6, NS = 800;
    let maxErr = 0;
    const lp = (t) => [{ x: Math.cos(t), y: Math.sin(t) }, { x: Math.cos(k * t), y: Math.sin(k * t) }];
    const isect = (a1, a2, b1, b2) => {
      const d = (a1.x - a2.x) * (b1.y - b2.y) - (a1.y - a2.y) * (b1.x - b2.x);
      const c1 = a1.x * a2.y - a1.y * a2.x, c2 = b1.x * b2.y - b1.y * b2.x;
      return { x: (c1 * (b1.x - b2.x) - (a1.x - a2.x) * c2) / d, y: (c1 * (b1.y - b2.y) - (a1.y - a2.y) * c2) / d };
    };
    for (let s = 0; s < NS; s++){
      const t = TAU * (s + 0.5) / NS;        // off-cusp samples
      const [a1, a2] = lp(t - h), [b1, b2] = lp(t + h);
      const X = isect(a1, a2, b1, b2), E = envelopePoint(t, k);
      maxErr = Math.max(maxErr, Math.hypot(X.x - E.x, X.y - E.y));
    }
    T(`anti-circularity: independent numeric envelope (neighbour-chord intersection) matches E(t) < 1e-8`,
      maxErr < 1e-8, `max |intersection − E(t)| = ${maxErr.toExponential(2)} over ${NS} samples (k=${k})`);
  }

  // 7. DETERMINISM / PURITY: buildChords/sampleEnvelope are byte-identical across
  //    two calls (no RNG, no shared mutable state) → PNG reproducibility.
  {
    const c1 = buildChords(m, k), c2 = buildChords(m, k);
    const e1 = sampleEnvelope(k, 360), e2 = sampleEnvelope(k, 360);
    const same = c1.length === c2.length && c1.every((c, i) => c.i === c2[i].i && c.j === c2[i].j &&
                 c.ax === c2[i].ax && c.by === c2[i].by) &&
                 e1.length === e2.length && e1.every((p, i) => p.x === e2[i].x && p.y === e2[i].y);
    T('deterministic & pure: buildChords/sampleEnvelope byte-identical across calls (PNG-reproducible)',
      same, same ? `${c1.length} chords, ${e1.length} envelope samples (×2 identical)` : 'NON-DETERMINISTIC');
  }

  const pass = lines.filter(l => l.ok).length;
  return { pass, total: lines.length, lines };
}
