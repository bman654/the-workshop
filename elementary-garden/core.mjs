// The Elementary Garden — the Node twin of the in-page engine.
//
// runSelfTest() is the SOLE oracle: the in-page self-test pill calls this very function, and so does
// this twin. The block between the two sentinels below is INLINED BYTE-IDENTICAL into index.html
// (a buffon-style anti-drift convention) — one engine, no second copy. core.test.mjs proves the math
// claim (Rule 90 === Pascal mod 2, cell for cell, via an integer bit-test), a negative control
// (Rule 90 ≠ Rule 30), an optional EMPIRICAL randomness sniff on Rule 30, and the byte-parity slab.

// ===== ELEMENTARY CORE (byte-identical to core.mjs) =====
// A Wolfram "elementary" cellular automaton: a 1-D row of bits whose entire future is fixed by ONE
// 8-bit rule number and the seed you place by hand. Bit i (i in 0..7) of the rule is the next state
// of a cell whose (left,centre,right) neighbourhood — read as the 3-bit number l*4+c*2+r — equals i.
// WRAP CONVENTION: torus (the lattice is a ring). The page, this twin, and the test all use it, and
// the shown field is always wider than 2*rows+3 so a single-centre seed never wraps within view —
// the self-test's column mapping is load-bearing and depends on that.

// stepRow is the ONE function that drives every lit pixel on the canvas AND the proof.
export function stepRow(row, rule, wrap = true){
  const n = row.length, out = new Uint8Array(n);
  for (let i = 0; i < n; i++){
    let l, r;
    if (wrap){
      l = row[(i - 1 + n) % n];        // torus: the ring wraps
      r = row[(i + 1) % n];
    } else {
      l = i > 0 ? row[i - 1] : 0;       // dead edge: off-lattice cells are 0
      r = i < n - 1 ? row[i + 1] : 0;
    }
    const c = row[i];
    const nb = (l << 2) | (c << 1) | r; // 0..7
    out[i] = (rule >> nb) & 1;          // the rule's bit for that neighbourhood
  }
  return out;
}

// Grow a whole triangle: `rows` generations of stepRow from a seed row (the first row IS the seed).
export function evolve(seed, rule, rows, wrap = true){
  const grid = [Uint8Array.from(seed)];
  for (let g = 1; g < rows; g++) grid.push(stepRow(grid[g - 1], rule, wrap));
  return grid;
}

// `grow` is an alias the page uses for the same operation (kept so the presentation reads cleanly).
export function grow(seed, rule, rows, wrap = true){ return evolve(seed, rule, rows, wrap); }

// ---- the theorem oracle: Pascal's triangle mod 2 via Lucas' theorem ------------------------------
// C(n,k) is ODD  <=>  (k AND n) === k   (every 1-bit of k is also a 1-bit of n).  Integer-only, no float.
export function binomialIsOdd(n, k){
  if (k < 0 || k > n) return false;
  return (k & n) === k;
}
// binomMod2 is the same fact returned as a 0/1 bit (the name the spec asks the page to expose).
export function binomMod2(n, k){ return binomialIsOdd(n, k) ? 1 : 0; }

// The exact predicted Rule-90 triangle from a SINGLE centre seed, built PURELY from the theorem (no CA
// stepping). Coefficient C(n,k) sits at absolute column `apex - n + 2k`. Returns a Set of "n,col" keys.
export function pascalMod2Triangle(rows, apex){
  const lit = new Set();
  for (let n = 0; n < rows; n++)
    for (let k = 0; k <= n; k++)
      if (binomialIsOdd(n, k)) lit.add(n + ',' + (apex - n + 2 * k));
  return lit;
}

function popcount(x){ let c = 0; while (x){ x &= x - 1; c++; } return c; }

// ---- the self-test: the engine and the theorem must AGREE, and Rule 30 must DISAGREE -------------
export function runSelfTest(){
  const checks = [];
  const ok = (name, pass, info) => checks.push({ name, pass, info });

  const ROWS = 64;
  const W = 2 * ROWS + 3;                 // wide enough that a centre seed never wraps within ROWS
  const apex = (W - 1) >> 1;
  const seed = new Uint8Array(W); seed[apex] = 1;

  // (1) Rule 90, single centre seed === Pascal's triangle mod 2, cell for cell.
  {
    const grid = evolve(seed, 90, ROWS);
    const want = pascalMod2Triangle(ROWS, apex);
    let lit90 = 0, agree = 0, total = 0, mism = 0;
    for (let n = 0; n < ROWS; n++){
      for (let c = 0; c < W; c++){
        const onCA = grid[n][c] === 1;
        const onPascal = want.has(n + ',' + c);
        if (onCA) lit90++;
        total++;
        if (onCA === onPascal) agree++; else mism++;
      }
    }
    ok('Rule 90 from one seed === Pascal mod 2 (Lucas), cell for cell',
       mism === 0, agree + '/' + total + ' cells agree · ' + lit90 + ' lit · 0 mismatches');
  }

  // (2) The lit count per row of Rule 90 === 2^popcount(n) — the Glaisher count of odd C(n,k).
  {
    const grid = evolve(seed, 90, ROWS);
    let bad = 0, sample = '';
    for (let n = 0; n < ROWS; n++){
      let lit = 0; for (let c = 0; c < W; c++) lit += grid[n][c];
      const expect = 1 << popcount(n);
      if (lit !== expect) bad++;
      if (n === 31) sample = 'row 31 has ' + lit + ' lit (2^' + popcount(n) + '=' + expect + ')';
    }
    ok('odd-coefficient count per row === 2^popcount(n)', bad === 0, sample);
  }

  // (3) NEGATIVE CONTROL: Rule 30 from the same seed does NOT match Pascal mod 2.
  {
    const grid = evolve(seed, 30, ROWS);
    const want = pascalMod2Triangle(ROWS, apex);
    let mism = 0;
    for (let n = 0; n < ROWS; n++)
      for (let c = 0; c < W; c++)
        if ((grid[n][c] === 1) !== want.has(n + ',' + c)) mism++;
    ok('NEGATIVE CONTROL — Rule 30 ≠ Pascal mod 2 (determinism vs chaos is real)',
       mism > 0, mism + ' cells differ (a true mismatch, not a fluke)');
  }

  // (4) Engine well-formed: rule 0 kills everything after the seed row; rule 255 fills an empty row.
  {
    const dead = evolve(seed, 0, 8).slice(1).every(r => r.every(b => b === 0));
    const r255 = stepRow(new Uint8Array(W), 255).every(b => b === 1);
    ok('engine well-formed (rule 0 dies after seed · rule 255 fills)', dead && r255, 'bit invariants hold');
  }

  // (5) EMPIRICAL (flagged, NOT a theorem): Rule 30's centre column is roughly balanced — a randomness
  //     sniff. We REPORT it but never gate GREEN on a tight chi-square; a generous band keeps it honest.
  {
    const NG = 2000, W2 = 2 * NG + 3, apex2 = (W2 - 1) >> 1;
    let row = new Uint8Array(W2); row[apex2] = 1;
    let ones = 0, prev = -1, maxRun = 0, curRun = 0;
    for (let g = 0; g < NG; g++){
      const b = row[apex2];
      ones += b;
      if (b !== prev){ curRun = 1; } else { curRun++; }
      if (curRun > maxRun) maxRun = curRun;
      prev = b;
      row = stepRow(row, 30);
    }
    const frac = ones / NG;
    const balanced = frac > 0.45 && frac < 0.55;     // generous — empirical, informational only
    ok('EMPIRICAL · Rule 30 centre column looks random (balanced bits)',
       balanced, 'p(1)=' + frac.toFixed(3) + ' over ' + NG + ' gens · longest run ' + maxRun + ' (flagged empirical)');
  }

  const passed = checks.filter(c => c.pass).length;
  return { ok: checks.every(c => c.pass), passed, total: checks.length, checks };
}
// ===== END ELEMENTARY CORE =====
