// ============================================================================
//  The Ulam Spiral — primes & the diagonals they fall on            (CORE)
//  Pure, dependency-free. Identical code is inlined into index.html; this file
//  is the Node-testable twin (the falsifiability harness runs against it).
//
//  THE MEDIUM: number theory, the second bench of the Numbers Room (after
//  The Best Rational). Write the integers 1, 2, 3, … in an outward square
//  spiral and light only the primes. Stanisław Ulam doodled this in 1963 and
//  the primes did something no one ordered them to do: they fell onto diagonal
//  lines. This bench shows WHY, and proves every claim it makes is exact.
//
//  THE FALSIFIABLE CRUX (three claims, each checked to the integer):
//   (1) PRIMALITY, TWICE OVER. The spiral is lit by a Sieve of Eratosthenes;
//       an INDEPENDENT trial-division oracle must agree on every n ≤ N — 0
//       disagreements — or "this dot is prime" is a lie. The two oracles share
//       NO code: the renderer consumes sieve(); the self-test's check is
//       isPrimeTrial(). (If both came from the sieve, the agreement is circular.)
//   (2) THE DIAGONALS ARE QUADRATICS. Every 45° diagonal of the square spiral
//       is EXACTLY 4t² + bt + c — the leading coefficient is ALWAYS 4, a deep
//       structural fact. The four principal arms through the centre are
//       4t²−2t+1, 4t²+1, 4t²+2t+1, 4t²+4t+1; the last is (2t+1)², the odd
//       perfect squares — the iconic always-composite line. fitDiagonal()
//       recovers {a,b,c} from any three lit cells, and a===4 every time.
//       Euler's n²−n+41 lands on a prime for n=0..40 — forty-one in a row —
//       then breaks at n=41 with 41²=1681. A non-prime-rich control (n²+1)
//       produces NO streak: the falsifiable contrast.
//   (3) π(N) IS EXACT, AND RIDES THE PRIME NUMBER THEOREM. The running count
//       of lit cells IS π(N) (sieve-counted, not estimated); π(N)/(N/ln N) → 1
//       within a band that tightens as N grows.
//
//  COORDINATE CONVENTION (LOAD-BEARING — pinned here, asserted by the self-test):
//    centre n=1 at (0,0); step RIGHT first, then turn CCW (up, left, down).
//    +x is right, +y is UP. The verified 5×5 block (top row y=+2 … bottom y=−2):
//
//        17 16 15 14 13      (y=+2)
//        18  5  4  3 12      (y=+1)
//        19  6  1  2 11      (y= 0)   ← 1 at the origin, 2 to its right
//        20  7  8  9 10      (y=−1)
//        21 22 23 24 25      (y=−2)
//                            x = −2 −1  0 +1 +2
//
//    Under this convention the four principal diagonal ARMS (t = ring index,
//    t=0 is the centre cell 1) are simulation-verified:
//        NE (+t,+t): 4t²−2t+1   = 1, 3, 13, 31, 57, 91, …
//        NW (−t,+t): 4t²    +1  = 1, 5, 17, 37, 65, 101, …
//        SW (−t,−t): 4t²+2t+1   = 1, 7, 21, 43, 73, 111, …
//        SE (+t,−t): 4t²+4t+1   = 1, 9, 25, 49, 81, 121, …  = (2t+1)²
// ============================================================================

// ---------------------------------------------------------------------------
//  TWO INDEPENDENT PRIMALITY ORACLES.  They MUST NOT share code — that
//  independence is the spine of claim (1). The renderer lights from sieve();
//  the self-test's honest check is isPrimeTrial().
// ---------------------------------------------------------------------------

// Sieve of Eratosthenes → Uint8Array, s[n]===1 ⟺ n is prime. Feeds the renderer.
export function sieve(N) {
  const s = new Uint8Array(N + 1);
  s.fill(1);
  s[0] = 0;
  if (N >= 1) s[1] = 0;
  for (let i = 2; i * i <= N; i++) {
    if (s[i]) for (let j = i * i; j <= N; j += i) s[j] = 0;
  }
  return s;
}

// Trial division → boolean. NO shared code with sieve(). The independent check.
export function isPrimeTrial(n) {
  if (n < 2) return false;
  if (n < 4) return true;            // 2, 3
  if (n % 2 === 0) return false;
  for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return false;
  return true;
}

// ---------------------------------------------------------------------------
//  GEOMETRY — closed-form, O(1), with an O(1) inverse (no spatial index).
//  nToXY is the renderer's forward map; xyToN is the hover hit-test oracle.
//  The self-test asserts nToXY === a from-scratch buildSpiral() simulation
//  (so the formula is itself falsifiable) and that the two round-trip.
// ---------------------------------------------------------------------------

// n ≥ 1 → [x, y].  centre n=1 → [0,0]; RIGHT-first, CCW; +y is up.
export function nToXY(n) {
  if (n === 1) return [0, 0];
  // ring r ≥ 1 holds n in ((2r−1)², (2r+1)²]; bottom-right corner (r,−r) = (2r+1)².
  const r = Math.ceil((Math.sqrt(n) - 1) / 2);
  const sideMax = (2 * r + 1) * (2 * r + 1);   // largest n on ring r, at (r, −r)
  const sideLen = 2 * r;                         // cells per side
  const d = sideMax - n;                          // 0 .. 8r−1, walking CW from (r,−r)
  const leg = Math.floor(d / sideLen);            // 0..3
  const off = d % sideLen;
  switch (leg) {
    case 0: return [r - off, -r];      // bottom edge, moving left  (y=−r)
    case 1: return [-r, -r + off];     // left edge,   moving up    (x=−r)
    case 2: return [-r + off, r];      // top edge,    moving right (y=+r)
    default: return [r, r - off];      // right edge,  moving down  (x=+r)
  }
}

// [x, y] → n.  Exact inverse of nToXY (the hover hit-test).
export function xyToN(x, y) {
  if (x === 0 && y === 0) return 1;
  const r = Math.max(Math.abs(x), Math.abs(y));   // Chebyshev ring
  const sideMax = (2 * r + 1) * (2 * r + 1);
  const sideLen = 2 * r;
  let d;
  if (y === -r && x > -r)      d = 0 * sideLen + (r - x);   // bottom (excl left corner)
  else if (x === -r && y < r)  d = 1 * sideLen + (y + r);   // left   (excl top corner)
  else if (y === r && x < r)   d = 2 * sideLen + (x + r);   // top    (excl right corner)
  else                         d = 3 * sideLen + (r - y);   // right
  return sideMax - d;
}

// A from-scratch spiral simulation — the independent ground truth nToXY is
// checked against. Returns Maps n→[x,y] and "x,y"→n. (Used by the self-test
// and, optionally, as the renderer's valToXY source.)
export function buildSpiral(N) {
  const pos = new Map();             // n → [x,y]
  const grid = new Map();            // "x,y" → n
  pos.set(1, [0, 0]); grid.set('0,0', 1);
  const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];   // right, up, left, down (CCW)
  let x = 0, y = 0, dir = 0, steplen = 1, n = 2;
  while (n <= N) {
    for (let rep = 0; rep < 2; rep++) {
      for (let s = 0; s < steplen; s++) {
        x += dirs[dir][0]; y += dirs[dir][1];
        pos.set(n, [x, y]); grid.set(x + ',' + y, n);
        n++; if (n > N) break;
      }
      dir = (dir + 1) % 4;
      if (n > N) break;
    }
    steplen++;
  }
  return { pos, grid };
}

// ---------------------------------------------------------------------------
//  DIAGONAL ARMS — the simulation-CORRECT constants for this orientation.
//  armValue(dir, t) = 4t² + bt + 1.  SE = (2t+1)², the odd squares.
// ---------------------------------------------------------------------------
export const ARMS = {
  NE: { a: 4, b: -2, c: 1, step: [1, 1] },    // 4t²−2t+1
  NW: { a: 4, b: 0, c: 1, step: [-1, 1] },    // 4t²+1
  SW: { a: 4, b: 2, c: 1, step: [-1, -1] },   // 4t²+2t+1
  SE: { a: 4, b: 4, c: 1, step: [1, -1] },    // 4t²+4t+1 = (2t+1)²
};

export function armValue(dir, t) {
  const A = ARMS[dir];
  return A.a * t * t + A.b * t + A.c;
}

// Fit a quadratic a·t² + b·t + c from three consecutive lit cells [f0,f1,f2]
// (the values at t=0,1,2 of a 45° diagonal). Exact integer solve. The leading
// coefficient is ALWAYS 4 for any 45° diagonal of the square spiral — the
// deep structural fact this returns and the self-test asserts.
export function fitDiagonal([f0, f1, f2]) {
  const a = (f2 - 2 * f1 + f0) / 2;
  const b = f1 - a - f0;
  const c = f0;
  return { a, b, c };
}

// Walk a generic 45° diagonal (every-other ring) from a starting cell in a
// step direction, reading the spiral value at each of `count` cells. Returns
// the array of integer values along the diagonal. Pure geometry — the values
// are read via xyToN, not a stored map.
export function diagonalValues(x0, y0, stepX, stepY, count) {
  const out = [];
  for (let t = 0; t < count; t++) {
    out.push(xyToN(x0 + t * stepX, y0 + t * stepY));
  }
  return out;
}

// ---------------------------------------------------------------------------
//  PRESET POLYNOMIALS (verified numbers; streaks DERIVED live, never literal).
// ---------------------------------------------------------------------------
export const POLYS = {
  euler:    { f: (n) => n * n - n + 41, label: 'n²−n+41' },     // 41 straight, break n=41 → 1681=41²
  euler2:   { f: (n) => n * n + n + 41, label: 'n²+n+41' },     // 40 straight, break n=40 → 1681=41²
  q4:       { f: (n) => 4 * n * n - 2 * n + 41, label: '4n²−2n+41' }, // 21 straight, break n=21 → 1763=41×43
  legendre: { f: (n) => 2 * n * n + 29, label: '2n²+29' },      // 29 straight, break n=29 → 1711=29×59
  ctlA:     { f: (n) => n * n + 1, label: 'n²+1' },             // control: streak 0
  ctlB:     { f: (n) => n * n + n + 1, label: 'n²+n+1' },       // control: streak 0
};

// The length of the unbroken prime run of f starting at n=0, the n at which it
// breaks, the value there, and that value's factorization. Walks isPrimeTrial
// (the independent oracle) — nothing here is hard-coded.
export function polyStreak(f, maxN = 400) {
  let streak = 0, breakN = -1, breakVal = NaN;
  for (let n = 0; n < maxN; n++) {
    const v = f(n);
    if (isPrimeTrial(v)) {
      streak = n + 1;
    } else {
      breakN = n; breakVal = v; break;
    }
  }
  return { streak, breakN, breakVal, factorization: factorize(breakVal) };
}

// Smallest non-trivial factorization "p×q" (or "prime"/"—"). For the break-value badge.
export function factorize(n) {
  if (!Number.isFinite(n) || n < 2) return '—';
  if (isPrimeTrial(n)) return 'prime';
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return d + '×' + (n / d);
  return 'prime';
}

// Count primes among f(0..count−1) using the independent oracle (for controls).
export function polyPrimeCount(f, count) {
  let c = 0;
  for (let n = 0; n < count; n++) if (isPrimeTrial(f(n))) c++;
  return c;
}

// ---------------------------------------------------------------------------
//  π(N) and the Prime Number Theorem.
//  piExact counts lit cells in the sieve (the renderer's running count IS this).
//  pntRatio = π(N) / (N/ln N) → 1.
// ---------------------------------------------------------------------------
export function piExact(N, sieveArr) {
  let c = 0;
  for (let n = 2; n <= N; n++) if (sieveArr[n]) c++;
  return c;
}

export function pntRatio(N, sieveArr) {
  const pi = piExact(N, sieveArr);
  return pi / (N / Math.log(N));
}

// ---------------------------------------------------------------------------
//  THE SELF-TEST (the falsifiability harness — mirrors best-rational's shape).
//  Returns { pass, total, lines:[{name, ok, detail}] }.
//  In-page caps N at 20000 (click cost); core.test.mjs runs heavier checks.
// ---------------------------------------------------------------------------
export function runSelfTest(N = 20000) {
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });

  const S = sieve(N);

  // 1. PRIMALITY, TWICE OVER: sieve ⟺ trial division, 0 disagreements for n≤N.
  {
    let bad = 0, firstBad = '';
    for (let n = 0; n <= N; n++) {
      if ((S[n] === 1) !== isPrimeTrial(n)) { if (!bad) firstBad = `n=${n}`; bad++; }
    }
    T(`sieve ⟺ trial division: 0 disagreements (n ≤ ${N})`, bad === 0,
      bad === 0 ? `${N + 1} integers checked` : `${bad} disagree (first ${firstBad})`);
  }

  // 2. nToXY === buildSpiral simulation for all n≤N, AND collision-free (a bijection).
  {
    const { pos } = buildSpiral(N);
    let mism = 0, firstBad = '';
    const seen = new Set();
    let collide = 0;
    for (let n = 1; n <= N; n++) {
      const [x, y] = nToXY(n);
      const sim = pos.get(n);
      if (!sim || sim[0] !== x || sim[1] !== y) { if (!mism) firstBad = `n=${n}`; mism++; }
      const key = x + ',' + y;
      if (seen.has(key)) collide++; else seen.add(key);
      // round-trip
      if (xyToN(x, y) !== n) mism++;
    }
    T(`nToXY === simulation, bijection, round-trips (n ≤ ${N})`, mism === 0 && collide === 0,
      mism === 0 && collide === 0 ? `${N} cells, ${seen.size} distinct` : `${mism} mismatch ${firstBad}, ${collide} collide`);
  }

  // 3. The four arms ARE 4t²+bt+c to the integer, AND fitDiagonal recovers them.
  {
    let ok = true, bad = '';
    for (const dir of ['NE', 'NW', 'SW', 'SE']) {
      const A = ARMS[dir];
      // armValue matches the spiral value read at (t·stepX, t·stepY)
      for (let t = 0; t <= 40; t++) {
        const [sx, sy] = A.step;
        const got = xyToN(t * sx, t * sy);
        if (armValue(dir, t) !== got) { ok = false; bad = `${dir} t=${t}: ${armValue(dir, t)}≠${got}`; break; }
      }
      if (!ok) break;
      // fitDiagonal recovers {a:4, b, c:1}
      const fit = fitDiagonal([armValue(dir, 0), armValue(dir, 1), armValue(dir, 2)]);
      if (fit.a !== 4 || fit.b !== A.b || fit.c !== 1) { ok = false; bad = `${dir} fit ${JSON.stringify(fit)}`; break; }
    }
    T('four arms = 4t²+bt+1; fitDiagonal recovers {a:4,b∈{−2,0,2,4},c:1}', ok,
      ok ? 'NE 4t²−2t+1 · NW 4t²+1 · SW 4t²+2t+1 · SE 4t²+4t+1' : bad);
  }

  // 4. SE arm 4t²+4t+1 === (2t+1)² (the odd perfect squares).
  {
    let ok = true, bad = '';
    for (let t = 0; t <= 50; t++) {
      if (armValue('SE', t) !== (2 * t + 1) * (2 * t + 1)) { ok = false; bad = `t=${t}`; break; }
    }
    T('SE arm 4t²+4t+1 === (2t+1)² (the odd squares — always composite for t≥1)', ok, ok ? '1,9,25,49,81,121,…' : bad);
  }

  // 5. EULER: n²−n+41 prime for n=0..40 (41 straight), composite at n=41, f(41)=1681=41².
  {
    const r = polyStreak(POLYS.euler.f);
    const f41 = POLYS.euler.f(41);
    const ok = r.streak === 41 && r.breakN === 41 && f41 === 1681 && f41 === 41 * 41 && r.factorization === '41×41';
    T('Euler n²−n+41: 41 straight, breaks at n=41 → 1681 = 41²', ok,
      `streak=${r.streak}, break n=${r.breakN}, f(41)=${f41}=${r.factorization}`);
  }

  // 6. n²+n+41 prime n=0..39 (40 straight), composite at n=40, f(40)=1681=41².
  {
    const r = polyStreak(POLYS.euler2.f);
    const f40 = POLYS.euler2.f(40);
    const ok = r.streak === 40 && r.breakN === 40 && f40 === 1681 && r.factorization === '41×41';
    T('n²+n+41: 40 straight, breaks at n=40 → 1681 = 41²', ok,
      `streak=${r.streak}, break n=${r.breakN}, f(40)=${f40}=${r.factorization}`);
  }

  // 7. A chosen arm's prime count via isPrimeTrial === the sieve's count on the
  //    same values, 0 disagreements (the two oracles agree on a diagonal).
  {
    // NW arm 4t²+1 over t=0..70 (all values ≤ N when t≤70 → 19601)
    let trialCount = 0, sieveCount = 0, bad = 0;
    for (let t = 0; t <= 70; t++) {
      const v = armValue('NW', t);
      if (v > N) break;
      const pt = isPrimeTrial(v);
      const ps = S[v] === 1;
      if (pt !== ps) bad++;
      if (pt) trialCount++;
      if (ps) sieveCount++;
    }
    T('a diagonal’s prime count: trial === sieve, 0 disagreements', bad === 0 && trialCount === sieveCount,
      bad === 0 ? `NW arm: ${trialCount} primes, both oracles` : `${bad} disagree`);
  }

  // 8. π(N) exact (sieve-counted) === Σ isPrimeTrial at the sparkline N's; π(10000)=1229.
  {
    let ok = true, bad = '';
    for (const M of [1000, 5000, 10000, 20000]) {
      if (M > N) continue;
      const SM = sieve(M);
      const piS = piExact(M, SM);
      let piT = 0;
      for (let n = 2; n <= M; n++) if (isPrimeTrial(n)) piT++;
      if (piS !== piT) { ok = false; bad = `N=${M}: sieve ${piS} ≠ trial ${piT}`; break; }
      if (M === 10000 && piS !== 1229) { ok = false; bad = `π(10000)=${piS}≠1229`; break; }
    }
    T('π(N) exact: sieve count === trial count; π(10000)=1229', ok, ok ? 'π(1k)=168, π(10k)=1229, π(20k)=2262' : bad);
  }

  // 9. PNT ratio monotone-decreasing 1k>5k>10k>20k AND ratio(20k) < 1.13.
  {
    const rs = [1000, 5000, 10000, 20000].map(M => pntRatio(M, sieve(M)));
    const mono = rs[0] > rs[1] && rs[1] > rs[2] && rs[2] > rs[3];
    const ok = mono && rs[3] < 1.13;
    T('PNT ratio π(N)/(N/ln N) tightens: 1k>5k>10k>20k, ratio(20k)<1.13', ok,
      rs.map((r, i) => [1, 5, 10, 20][i] + 'k:' + r.toFixed(4)).join(' '));
  }

  // 10. NEGATIVE CONTROL: n²+1 and n²+n+1 streak=0 AND density(0..39) < ½ Euler's.
  {
    const sA = polyStreak(POLYS.ctlA.f).streak;
    const sB = polyStreak(POLYS.ctlB.f).streak;
    const dEuler = polyPrimeCount(POLYS.euler.f, 40);   // 40
    const dA = polyPrimeCount(POLYS.ctlA.f, 40);
    const dB = polyPrimeCount(POLYS.ctlB.f, 40);
    const ok = sA === 0 && sB === 0 && dA < dEuler / 2 && dB < dEuler / 2;
    T('NEGATIVE CONTROL: n²+1 & n²+n+1 streak=0, density < ½ Euler’s', ok,
      `streaks ${sA}/${sB}; density Euler ${dEuler}, n²+1 ${dA}, n²+n+1 ${dB} (/40)`);
  }

  // 11. NEGATIVE CONTROL: SE odd-squares 25,49,81,121 composite by BOTH oracles,
  //     and the SE arm's prime density is conspicuously low (only t=0 → 1, never prime).
  {
    let ok = true, bad = '';
    for (const sq of [25, 49, 81, 121]) {
      if (isPrimeTrial(sq) || S[sq] === 1) { ok = false; bad = `${sq} reported prime`; break; }
    }
    // SE arm: how many primes over t=0..40? Should be 0 (every value is an odd square).
    let sePrimes = 0;
    for (let t = 0; t <= 40; t++) if (isPrimeTrial(armValue('SE', t))) sePrimes++;
    if (sePrimes !== 0) { ok = false; bad = `SE arm has ${sePrimes} primes (expected 0)`; }
    T('NEGATIVE CONTROL: odd squares composite (both oracles); SE arm prime density = 0', ok,
      ok ? '25,49,81,121 composite; SE arm 0 primes' : bad);
  }

  const pass = lines.filter(l => l.ok).length;
  return { pass, total: lines.length, lines };
}
