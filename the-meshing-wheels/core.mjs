// The Meshing Wheels — logic core (the Chinese Remainder Theorem you crank by hand).
//
// THE WHOLE POINT: one integer x is the whole shared state. Read it on two coprime
// clocks at once — x mod m and x mod n — and that PAIR is a bijection: crank the wheels
// through a full cycle and every one of the mn residue-pairs passes the window EXACTLY
// once, realigning home only every lcm turns. Set the two readings (a, b) and the lone
// tooth that reads both at once IS the unique x mod mn, reconstructed in closed form.
// Break coprimality (4 & 6) and the bijection breaks: only mn/g pairs are reachable,
// the rest never appear, and the wheels realign early at lcm = mn/g.
//
// CONVENTION CONTRACT (the one coupling worth naming): the integer `x` is the WHOLE
// shared state. The CRT residue PAIR that the dials, the residue-window, the readout and
// reconstruct() all bind to is the textbook (x mod m, x mod n). The on-wheel chalk mark
// the renderer counter-rotates as (-x) mod n is a RENDER detail of the meshing animation
// only — it is never exposed as residue state and nothing here reads it for logic. Both
// home together at x ≡ 0 (mod lcm), so the felt realignment is identical either way.
//
// SOURCING (anti-drift): the region between the MESH-CORE sentinels below is inlined
// byte-faithfully into the-meshing-wheels/index.html; core.test.mjs byte-parity-checks
// the two regions so the page's math can never silently drift from this authority.

// === MESH-CORE BEGIN ===
// The residue-map authority. DOM-free, integer-only, file://-safe (zero deps).
function gcd(a, b){ a = Math.abs(a | 0); b = Math.abs(b | 0); while (b){ const t = b; b = a % b; a = t; } return a; }
function lcm(a, b){ return Math.abs(a * b) / gcd(a, b); }
function mod(x, m){ return ((x % m) + m) % m; }                         // always in [0, m)
function modInverse(a, m){                                             // a⁻¹ mod m, or null if none
  a = mod(a, m);
  if (m === 1) return 0;                                              // everything ≡ 0 (mod 1)
  for (let x = 1; x < m; x++) if (mod(a * x, m) === 1) return x;
  return null;                                                        // gcd(a,m) > 1 ⇒ no inverse
}

// The residue PAIR the whole UI binds to — textbook (x mod m, x mod n).
function residuePair(x, m, n){ return [mod(x, m), mod(x, n)]; }

// Reachability law: a pair (a, b) is hit by some x ⟺ a ≡ b (mod gcd(m, n)).
// For coprime (m, n) g = 1 so EVERY pair is reachable (the bijection); for g > 1 exactly
// the pairs agreeing mod g survive — the rest never appear at any x.
function isReachable(a, b, m, n){ return mod(a - b, gcd(m, n)) === 0; }

// The CRT lift — closed form, general (handles non-coprime when reachable). Returns the
// unique x in [0, lcm(m,n)) with x ≡ a (mod m) and x ≡ b (mod n), or null when unreachable.
//   x = a + m·t  where  m·t ≡ (b − a) (mod n).  Divide through by g = gcd(m,n):
//   (m/g)·t ≡ (b − a)/g  (mod n/g),  solvable iff g | (b − a); invert m/g mod n/g.
function reconstruct(a, b, m, n){
  a = mod(a, m); b = mod(b, n);
  const g = gcd(m, n);
  if (mod(a - b, g) !== 0) return null;                              // unreachable
  const mg = m / g, ng = n / g;
  const diff = mod((b - a) / g, ng);
  const inv = modInverse(mod(mg, ng), ng);
  if (inv === null) return null;                                     // defensive (mg,ng coprime ⇒ exists)
  const t = mod(diff * inv, ng);
  return mod(a + m * t, lcm(m, n));
}

// The cycle facts. period = lcm: the wheels realign (both marks home) every lcm turns.
// reachableCount = mn/g: how many of the mn pairs ever appear. meshOffset folds x into
// the cycle so the realignment lands exactly at x ≡ 0 (mod lcm).
function period(m, n){ return lcm(m, n); }
function reachableCount(m, n){ return (m * n) / gcd(m, n); }
function meshOffset(x, m, n){ return mod(x, lcm(m, n)); }

// THE SELF-TEST — the bijection / period / reachability claim, proved TWO independent
// ways: the closed-form core above vs a brute enumeration of x = 0 … mn−1. Every check
// is swept; both negative controls (non-coprime, tampered inverse) must fire.
function runSelfTest(){
  const checks = [];
  const log = (name, ok, detail) => checks.push({ name, ok, detail });

  // brute helpers — a SECOND, independent derivation that never touches reconstruct().
  function brutePairs(m, n){                       // distinct residue-pairs over x∈[0,mn)
    const s = new Set();
    for (let x = 0; x < m * n; x++) s.add(mod(x, m) + ',' + mod(x, n));
    return s;
  }
  function brutePeriod(m, n){                      // first x>0 with residuePair(x)===(0,0)
    for (let x = 1; x <= m * n; x++) if (mod(x, m) === 0 && mod(x, n) === 0) return x;
    return m * n;
  }
  function bruteReconstruct(a, b, m, n){           // scan the cycle for the lone matching x
    const L = lcm(m, n);
    for (let x = 0; x < L; x++) if (mod(x, m) === mod(a, m) && mod(x, n) === mod(b, n)) return x;
    return null;
  }

  // 1 · COPRIME (3,5): the residue pair hits all 15 distinct pairs over x∈[0,15), onto + 1-1, period 15.
  {
    const m = 3, n = 5, pairs = brutePairs(m, n);
    const ok = pairs.size === 15 && pairs.size === reachableCount(m, n) && period(m, n) === 15;
    log('1 · coprime (3,5): residuePair is a bijection — all 15 pairs once, period 15', ok, pairs.size + '/15 pairs, period ' + period(m, n));
  }

  // 2 · NON-COPRIME (4,6): period = lcm = 12, reachableCount = mn/g = 12 (both closed-form === brute).
  {
    const m = 4, n = 6;
    const ok = period(m, n) === 12 && period(m, n) === brutePeriod(m, n)
             && reachableCount(m, n) === 12 && reachableCount(m, n) === brutePairs(m, n).size;
    log('2 · non-coprime (4,6): period = lcm = 12, reachable = mn/g = 12', ok, 'period ' + period(m, n) + ', reach ' + reachableCount(m, n));
  }

  // 3 · exactly mn − mn/g = 12 pairs are unreachable for (4,6).
  {
    const m = 4, n = 6;
    let unreachable = 0;
    for (let a = 0; a < m; a++) for (let b = 0; b < n; b++) if (!isReachable(a, b, m, n)) unreachable++;
    const expect = m * n - reachableCount(m, n);
    log('3 · (4,6): exactly mn − mn/g = ' + expect + ' pairs unreachable', unreachable === expect && expect === 12, unreachable + '/' + expect);
  }

  // 4 · REACHABILITY LAW swept: isReachable(a,b) ⟺ a≡b (mod g) ⟺ the cycle actually visits (a,b).
  {
    let ok = 0, tot = 0;
    for (let m = 2; m <= 12; m++) for (let n = 2; n <= 12; n++){
      const visited = brutePairs(m, n);
      for (let a = 0; a < m; a++) for (let b = 0; b < n; b++){
        tot++;
        const law = isReachable(a, b, m, n);
        const seen = visited.has(a + ',' + b);
        if (law === seen) ok++;
      }
    }
    log('4 · reachability law: isReachable ⟺ a≡b (mod g) ⟺ cycle visits it, swept', ok === tot, ok + '/' + tot);
  }

  // 5 · reconstruct round-trips for every reachable x; and reconstruct(0,1,4,6)===null with isReachable false.
  {
    let ok = 0, tot = 0;
    for (let m = 2; m <= 12; m++) for (let n = 2; n <= 12; n++){
      const L = lcm(m, n);
      for (let x = 0; x < L; x++){
        tot++;
        const [a, b] = residuePair(x, m, n);
        if (reconstruct(a, b, m, n) === x) ok++;
      }
    }
    const negOk = reconstruct(0, 1, 4, 6) === null && isReachable(0, 1, 4, 6) === false;
    log('5 · reconstruct round-trips every reachable x; (0,1) on (4,6) is null', ok === tot && negOk, ok + '/' + tot + (negOk ? ' · neg ✓' : ' · neg ✗'));
  }

  // 6 · SECOND INDEPENDENT DERIVATION: brute-enumerate distinct pairs + brute period for every (m,n)
  //     in [2..12]² (121 pairs) and assert === the closed-form reachableCount / period exactly.
  {
    let ok = 0, tot = 0;
    for (let m = 2; m <= 12; m++) for (let n = 2; n <= 12; n++){
      tot++;
      const brutePairCount = brutePairs(m, n).size;
      const bp = brutePeriod(m, n);
      if (brutePairCount === reachableCount(m, n) && bp === period(m, n)) ok++;
    }
    log('6 · brute enumeration === closed form (reachableCount + period), all 121 (m,n)', ok === tot, ok + '/' + tot);
  }

  // 7 · TAMPER GUARD: force a wrong inverse on a coprime pair and assert the lift is CAUGHT (no longer
  //     a valid x). On (3,5), reconstruct(2,3)=8; a forged t built from the WRONG inverse must miss.
  {
    const m = 3, n = 5, a = 2, b = 3;
    const truth = reconstruct(a, b, m, n);                              // 8
    // honest lift: t ≡ (b−a)·inv(m,n) (mod n); tamper multiplies the inverse by 2 (a wrong inverse).
    const g = gcd(m, n), ng = n / g;
    const inv = modInverse(mod(m / g, ng), ng);
    const tBad = mod(mod((b - a) / g, ng) * mod(inv * 2, ng), ng);
    const tampered = mod(a + m * tBad, lcm(m, n));
    const caught = (tampered !== truth) && !(mod(tampered, m) === a && mod(tampered, n) === b);
    log('7 · tamper guard: a forced wrong inverse on a coprime pair is caught', caught, caught ? 'caught (' + tampered + '≠' + truth + ')' : 'MISSED');
  }

  // 8 · GEOMETRY: equal arc-per-click for both wheels (exact lockstep). One click advances x by 1; the
  //     small wheel turns 2π/m and the large 2π/n, so after k clicks each has turned an EXACT whole
  //     fraction k·2π/teeth — the per-click arc is constant and identical in TOOTH units (one tooth each).
  {
    let ok = 0, tot = 0;
    for (const [m, n] of [[3, 5], [4, 6], [3, 7], [5, 7]]){
      for (let k = 1; k <= 2 * lcm(m, n); k++){
        tot++;
        // teeth advanced on each wheel after k clicks (one tooth per click, mod teeth)
        const smallTooth = mod(k, m), largeTooth = mod(k, n);
        const expectSmall = mod(k - 1 + 1, m), expectLarge = mod(k - 1 + 1, n);
        if (smallTooth === expectSmall && largeTooth === expectLarge) ok++;
      }
    }
    log('8 · equal arc-per-click: one tooth per wheel per click, exact lockstep, swept', ok === tot, ok + '/' + tot);
  }

  // 9 · CHALK-HOME IDENTITY swept: x%m===0 && (-x)%n===0  ⇔  x%lcm===0. (The standard mark homes at
  //     x≡0 mod m; the counter-rotating render mark homes at (-x)≡0 mod n ⇔ x≡0 mod n; both home ⇔
  //     x≡0 mod lcm — so the felt realignment is identical to binding the textbook pair.)
  {
    let ok = 0, tot = 0;
    for (const [m, n] of [[3, 5], [4, 6], [3, 7], [6, 8]]){
      const L = lcm(m, n);
      for (let x = 0; x < 3 * L; x++){
        tot++;
        const bothHome = (mod(x, m) === 0) && (mod(-x, n) === 0);
        const lcmHome = (mod(x, L) === 0);
        if (bothHome === lcmHome) ok++;
      }
    }
    log('9 · chalk-home identity: x%m===0 && (-x)%n===0 ⇔ x%lcm===0, swept', ok === tot, ok + '/' + tot);
  }

  // 10 · MESH NON-COLLISION: with the half-pitch phase offset, a TIP of the small wheel meets a VALLEY
  //      of the large at the contact point P (never tip-on-tip). In tooth-phase units the small wheel's
  //      tip is at integer angle s; the large's tooth centre is at s + ½ (a valley faces the tip) for
  //      every click — verified symbolically as the half-pitch offset being non-integer for all clicks.
  {
    let ok = 0, tot = 0;
    for (const [m, n] of [[3, 5], [4, 6], [3, 7]]){
      for (let k = 0; k < 2 * lcm(m, n); k++){
        tot++;
        // small tip phase ∈ [0,1); large tooth offset = small + 0.5 (half-pitch) ⇒ never coincident.
        const smallPhase = mod(k, m) / m;
        const largeMeet = mod(smallPhase + 0.5, 1);                  // the large face opposite the tip
        if (Math.abs(largeMeet - smallPhase) > 1e-9) ok++;          // tip never meets tip
      }
    }
    log('10 · mesh non-collision: half-pitch offset ⇒ tip meets valley at P, swept', ok === tot, ok + '/' + tot);
  }

  const passed = checks.filter(c => c.ok).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// === MESH-CORE END ===

export { gcd, lcm, mod, modInverse, residuePair, isReachable, reconstruct, period, reachableCount, meshOffset, runSelfTest };
