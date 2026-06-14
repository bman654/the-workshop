// ============================================================================
//  Node-side falsifiability harness for The Shannon Limit.
//  Runs the shared in-page self-test PLUS deeper Node-only assertions
//  (heavier exhaustive optimality checks + the block-coding limit at larger k).
//  Run:  node core.test.mjs
// ============================================================================
import {
  normalize, entropy, maxEntropy, countSymbols,
  huffman, kraftSum, isPrefixCode, avgLength,
  encode, decode, blockHuffmanLk,
  optimalAvgLength, fullBinaryLeafDepths,
  substitute, permuteAlphabet, SOURCES,
  runSelfTest,
} from './core.mjs';

let pass = 0, total = 0;
const ok = (name, cond, detail = '') => {
  total++;
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { console.log(`FAIL  ${name}${detail ? '  — ' + detail : ''}`); }
};
const approx = (a, b, t = 1e-9) => Math.abs(a - b) <= t;
const log2 = (x) => Math.log(x) / Math.LN2;

console.log('The Shannon Limit — core.test.mjs\n');

// --- First, the shared in-page self-test must be fully green. ----------------
const st = runSelfTest();
for (const l of st.lines) ok('[self-test] ' + l.name, l.ok, l.detail);
ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);

// --- Deeper Node-only assertions. -------------------------------------------

// A. EXHAUSTIVE optimality over MANY random sources up to 9 symbols: Huffman's
//    average length must equal the brute-force minimum over all prefix codes,
//    every time. (The page only checks a few canned sources.)
{
  let good = true, bad = '';
  let seed = 7;
  const rnd = () => (seed = (1103515245 * seed + 12345) >>> 0) / 4294967296;
  for (let trial = 0; trial < 400 && good; trial++) {
    const n = 2 + Math.floor(rnd() * 8);            // 2..9 symbols
    const w = {};
    for (let i = 0; i < n; i++) w['s' + i] = 1 + Math.floor(rnd() * 100);
    const D = normalize(w);
    const Lh = huffman(D).L;
    const Lopt = optimalAvgLength(D);
    if (!approx(Lh, Lopt, 1e-9)) { good = false; bad = `n=${n} Huffman ${Lh.toFixed(6)} ≠ optimum ${Lopt.toFixed(6)}`; }
  }
  ok('exhaustive: Huffman == brute-force optimum over 400 random sources (n≤9)', good, bad);
}

// B. The optimality oracle is truly INDEPENDENT and CORRECT — sanity-check the
//    full-binary-tree enumerator counts Catalan-many distinct trees' depth-sets
//    and that the simplest cases are right. (Number of DISTINCT depth multisets
//    is ≤ Catalan(n-1); we just assert the known small depth-sets appear.)
{
  // n=2: only tree is two leaves at depth 1 → [[1,1]].
  const d2 = fullBinaryLeafDepths(2);
  const has11 = d2.length === 1 && d2[0].join(',') === '1,1';
  // n=3: every full binary tree has leaves at depths {1,2,2} (in some order).
  const d3 = fullBinaryLeafDepths(3);
  const all122 = d3.every(d => d.slice().sort((a, b) => a - b).join(',') === '1,2,2');
  // n=4: two shapes — balanced {2,2,2,2} and the comb {1,2,3,3}.
  const d4keys = new Set(fullBinaryLeafDepths(4).map(d => d.slice().sort((a, b) => a - b).join(',')));
  const has4 = d4keys.has('2,2,2,2') && d4keys.has('1,2,3,3');
  ok('full-binary-tree depth enumerator is correct for n=2,3,4', has11 && all122 && has4,
    `n2=${JSON.stringify(d2)} n3all122=${all122} n4=${[...d4keys].join('|')}`);
}

// C. BLOCK CODING: the source-coding bound H ≤ L/k < H + 1/k must hold at every
//    k (it tightens as k grows, FORCING L/k → H). We deliberately do NOT assert
//    monotonicity — Huffman's gap above H can wobble with k (a real fact the
//    in-page self-test #7 originally got wrong and now states honestly). What we
//    DO assert: the bound holds at every k, and the largest k is strictly
//    closer to H than k=1.
{
  let good = true, bad = '';
  for (const key of ['english', 'skewed', 'dyadic']) {
    const D = normalize(SOURCES[key]);
    const H = entropy(D);
    const maxK = key === 'english' ? 2 : 4;          // english alphabet is big
    let gap1 = null, gapMax = null;
    for (let k = 1; k <= maxK; k++) {
      const Lk = blockHuffmanLk(D, k);
      if (!(Lk >= H - 1e-9 && Lk < H + 1 / k + 1e-9)) { good = false; bad = `${key} k=${k}: L/k=${Lk.toFixed(5)} H=${H.toFixed(5)} bound=${(H + 1 / k).toFixed(5)}`; break; }
      if (k === 1) gap1 = Lk - H;
      gapMax = Lk - H;
    }
    if (!good) break;
    if (maxK > 1 && !(gapMax < gap1 + 1e-9)) { good = false; bad = `${key}: gap@k=${maxK} (${gapMax.toFixed(5)}) not ≤ gap@k=1 (${gap1.toFixed(5)})`; break; }
  }
  ok('block coding: H ≤ L/k < H + 1/k at every k; largest k closer to H than k=1', good, bad);
}

// D. For the dyadic source the OPTIMAL code lengths are exactly −log2 p_i (the
//    ideal codeword length) — Huffman hits the entropy with no slack.
{
  const D = normalize(SOURCES.dyadic);
  const h = huffman(D);
  let good = true, bad = '';
  for (const d of D) {
    const ideal = -log2(d.p);
    if (h.lengths[d.sym] !== Math.round(ideal)) { good = false; bad = `${d.sym}: len ${h.lengths[d.sym]} vs ideal ${ideal}`; break; }
  }
  ok('dyadic source: Huffman lengths == −log₂ pᵢ exactly (no slack)', good, bad);
}

// E. SUBSTITUTION-INVARIANCE of entropy over many random permutations and texts
//    — H is unchanged, but the text is genuinely scrambled (cipher ≠ plain).
{
  let good = true, bad = '';
  const plain = 'THEQUICKBROWNFOXJUMPSOVERTHELAZYDOGPACKMYBOXWITHFIVEDOZENLIQUORJUGS';
  const Hp = entropy(countSymbols(plain));
  for (let seed = 1; seed <= 50; seed++) {
    const map = permuteAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ', seed);
    const cipher = substitute(plain, map);
    const Hc = entropy(countSymbols(cipher));
    if (!approx(Hp, Hc, 1e-12)) { good = false; bad = `seed ${seed}: ${Hp} ≠ ${Hc}`; break; }
  }
  ok('entropy invariant under 50 substitution permutations (H_plain==H_cipher)', good, bad);
}

// F. KRAFT is the gate: any length assignment with Σ2^-len ≤ 1 is realizable as
//    a prefix code, and any with Σ>1 is NOT. Confirm Huffman always lands at
//    exactly 1 (a complete code) over the canned sources, and that decode of an
//    encode round-trips for a long random message.
{
  let good = true, bad = '';
  for (const key of Object.keys(SOURCES)) {
    const h = huffman(SOURCES[key]);
    if (!approx(kraftSum(h.lengths), 1, 1e-9)) { good = false; bad = `${key} Kraft=${kraftSum(h.lengths)}`; break; }
  }
  // round-trip a long message
  let seed = 99;
  const rnd = () => (seed = (1103515245 * seed + 12345) >>> 0) / 4294967296;
  const D = normalize(SOURCES.english);
  let msg = '';
  for (let i = 0; i < 5000; i++) {
    // sample by cumulative distribution
    let r = rnd(), acc = 0, pick = D[D.length - 1].sym;
    for (const d of D) { acc += d.p; if (r <= acc) { pick = d.sym; break; } }
    msg += pick;
  }
  const h = huffman(D);
  const back = decode(encode([...msg], h.codes), h.tree).join('');
  if (back !== msg) { good = false; bad = 'round-trip mismatch on 5000-symbol message'; }
  ok('Kraft==1 for all canned sources & 5000-symbol round-trip is exact', good, bad);
}

// G. Entropy of a uniform source over n symbols is exactly log2 n for a range
//    of n — the maximum-entropy fact.
{
  let good = true, bad = '';
  for (let n = 1; n <= 64; n++) {
    const w = {}; for (let i = 0; i < n; i++) w['x' + i] = 1;
    const H = entropy(w);
    if (!approx(H, maxEntropy(n), 1e-12)) { good = false; bad = `n=${n}: H=${H} ≠ log2 n=${maxEntropy(n)}`; break; }
  }
  ok('uniform source: H == log₂ n exactly for n=1..64', good, bad);
}

console.log(`\n${pass}/${total} passed`);
process.exit(pass === total ? 0 : 1);
