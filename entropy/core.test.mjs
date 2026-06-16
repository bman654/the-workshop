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
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dir = dirname(fileURLToPath(import.meta.url));

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

// H. BYTE-TWIN PARITY — the core inlined into index.html between the sentinels
//    is the SAME core as this module. (i) the entropy() & huffman() function
//    bodies are char-for-char identical (modulo the `export` keyword the page
//    drops); (ii) evaluating the page's inlined slice and running ITS
//    runSelfTest() yields the SAME pass-count and ok-for-ok agreement as the
//    module's. (Mirrors engine-room/demon/core.test.mjs:83-126 in spirit.)
{
  const BEGIN = '// === CORE BEGIN ===';
  const END = '// === CORE END ===';

  // extract `function NAME(...) { ... }` (brace-matched) from a source string.
  const extractFn = (src, name) => {
    const re = new RegExp('function\\s+' + name + '\\s*\\(');
    const m = re.exec(src);
    if (!m) return '';
    let i = src.indexOf('{', m.index);
    if (i < 0) return '';
    let depth = 0, k = i;
    for (; k < src.length; k++) {
      if (src[k] === '{') depth++;
      else if (src[k] === '}') { depth--; if (depth === 0) { k++; break; } }
    }
    return src.slice(m.index, k);
  };
  const norm = s => s.replace(/^export\s+/, '').trim();
  const firstDiff = (a, b) => { const m = Math.min(a.length, b.length); for (let i = 0; i < m; i++) if (a[i] !== b[i]) return i; return m; };

  // slice the module's own core between the sentinels (the source of truth)
  const modSrc = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const mi = modSrc.indexOf(BEGIN), mj = modSrc.indexOf(END);
  ok('core.mjs carries the BEGIN/END sentinels', mi >= 0 && mj > mi,
    mi >= 0 && mj > mi ? `slice ${mj - mi} chars` : 'MISSING');
  const modSlice = mi >= 0 && mj > mi ? modSrc.slice(mi + BEGIN.length, mj) : '';

  // slice the page's inlined core between the matching sentinels
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const hi = html.indexOf(BEGIN), hj = html.indexOf(END);
  ok('index.html carries the BEGIN/END sentinels around the inlined core', hi >= 0 && hj > hi,
    hi >= 0 && hj > hi ? `slice ${hj - hi} chars` : 'MISSING SENTINELS');
  const pageSlice = hi >= 0 && hj > hi ? html.slice(hi + BEGIN.length, hj) : '';

  // (i-a) the WHOLE inlined slice is byte-identical to the module's slice, once
  //       the module's per-line `export ` keyword (which the page drops) is removed.
  const modSliceStripped = modSlice.split('\n').map(l => l.replace(/^export\s+/, '')).join('\n');
  ok('byte-twin: the entire inlined core === core.mjs slice (sans `export`), byte-for-byte',
    modSliceStripped !== '' && modSliceStripped === pageSlice,
    modSliceStripped === pageSlice ? `${pageSlice.length} identical bytes`
      : `DRIFT — first diff at char ${firstDiff(modSliceStripped, pageSlice)}`);

  // (i-b) and, belt-and-suspenders, the load-bearing function bodies match too.
  for (const fn of ['entropy', 'huffman', 'blockHuffmanLk', 'decode', 'runSelfTest']) {
    const a = norm(extractFn(modSlice, fn));
    const b = norm(extractFn(pageSlice, fn));
    ok(`byte-twin: inline ${fn}() body is char-for-char the module's`, a !== '' && a === b,
      a === b ? 'identical bytes' : `DRIFT page:${JSON.stringify(b.slice(0, 60))} mod:${JSON.stringify(a.slice(0, 60))}`);
  }

  // (ii) evaluate the page's inlined slice and run ITS runSelfTest → same pass-count.
  let pageRes = null, evalErr = null;
  try {
    const factory = new Function(pageSlice + '\n;return { runSelfTest, entropy, huffman, encode, decode };');
    const PageCore = factory();
    pageRes = PageCore.runSelfTest();
  } catch (e) { evalErr = e; }
  ok('byte-twin: page-inlined core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');
  if (pageRes) {
    const modRes = runSelfTest();
    let agree = pageRes.pass === modRes.pass && pageRes.total === modRes.total && pageRes.lines.length === modRes.lines.length;
    for (let k = 0; agree && k < pageRes.lines.length; k++) if (pageRes.lines[k].ok !== modRes.lines[k].ok) agree = false;
    ok('byte-twin: page-inlined runSelfTest pass-count & per-line agree with the module',
      agree, `page ${pageRes.pass}/${pageRes.total} · module ${modRes.pass}/${modRes.total}`);
  }
}

// I. THE RIBBON IS THE LITERAL BITSTREAM. The hero ribbon renders, in order, the
//    per-symbol Huffman codeword chunks of an N=120 message sampled from a source.
//    Assert the concatenated chunks === encode(message, codes) EXACTLY, the total
//    bit-count === Σ len(chunk_t), and decode(ribbonBits, tree) === the message —
//    for many random sources. (The in-page self-test asserts the same on the live
//    sample; this is the Node twin of that claim.)
{
  let good = true, bad = '';
  let seed = 4242;
  const rnd = () => (seed = (1103515245 * seed + 12345) >>> 0) / 4294967296;
  for (let trial = 0; trial < 60 && good; trial++) {
    const n = 4 + Math.floor(rnd() * 13);          // 4..16 symbols
    const w = {};
    for (let i = 0; i < n; i++) w[String.fromCharCode(65 + i)] = 0.002 + rnd() * rnd();
    const D = normalize(w);
    const h = huffman(D);
    // sample N symbols by cumulative distribution
    const cum = []; let acc = 0; for (const d of D) { acc += d.p; cum.push({ sym: d.sym, c: acc }); }
    const syms = [];
    for (let t = 0; t < 120; t++) { const r = rnd(); let pick = cum[cum.length - 1].sym; for (const e of cum) { if (r <= e.c) { pick = e.sym; break; } } syms.push(pick); }
    const chunks = syms.map(s => h.codes[s]);
    const ribbonBits = chunks.join('');
    const direct = encode(syms, h.codes);
    const totalLen = chunks.reduce((a, c) => a + c.length, 0);
    const back = decode(ribbonBits, h.tree).join('');
    if (!(ribbonBits === direct && ribbonBits.length === totalLen && back === syms.join(''))) {
      good = false; bad = `n=${n}: ribbon ${ribbonBits.length} vs encode ${direct.length}, round-trip ${back === syms.join('')}`;
    }
  }
  ok('hero ribbon == encode(message).bits exactly & decodes back (60 random sources, N=120)', good, bad);
}

console.log(`\n${pass}/${total} passed`);
process.exit(pass === total ? 0 : 1);
