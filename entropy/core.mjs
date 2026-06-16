// ============================================================================
//  The Shannon Limit — entropy, Huffman codes & the source-coding theorem (CORE)
//  Pure, dependency-free. Identical code is inlined into index.html; this file
//  is the Node-testable twin (the falsifiability harness runs against it).
//
//  THE MEDIUM (new to the estate): information theory. The estate is full of
//  ciphers but had ZERO Shannon entropy anywhere. This bench opens that vein
//  with the cleanest result in the field: how few bits does a message REALLY
//  take, and how do you PROVE a code is the smallest possible?
//
//  THE QUANTITY. A source emits symbols with probabilities p_i. Its SHANNON
//  ENTROPY is
//
//        H = − Σ p_i · log2(p_i)          (bits per symbol)
//
//  — the average information content. H is maximal (= log2 n) when the source is
//  uniform (every symbol equally likely, nothing predictable) and 0 when one
//  symbol is certain (no information at all).
//
//  THE THEOREM (Shannon's source-coding theorem). Encode each symbol as a binary
//  string so that no codeword is a prefix of another (a PREFIX / instantaneous
//  code). Let L = Σ p_i · len_i be the average codeword length. Then
//
//        H ≤ L < H + 1
//
//  — you can NEVER beat the entropy (lower bound), and you can always get within
//  one bit of it (upper bound). Block several symbols together and L/k → H: the
//  entropy is the true, irreducible cost of the source, in bits.
//
//  THE CONSTRUCTION (Huffman, 1952) — and why it is OPTIMAL. Repeatedly merge the
//  two least-probable symbols into a parent whose probability is their sum; the
//  tree built bottom-up gives each leaf a codeword (path of 0/1 bits). Huffman's
//  code is PROVABLY the minimum-L prefix code: no prefix code over the SAME
//  alphabet has a smaller average length. (Proof sketch: an optimal code must be
//  a full binary tree; the two least-likely symbols must be siblings at maximum
//  depth; induction on merging them. We don't re-prove it — we FALSIFY any claim
//  to beat it by exhaustively searching all prefix codes for small alphabets.)
//
//  THE FALSIFIABLE CRUX (several independent witnesses must agree):
//   (1) Kraft's inequality Σ 2^(−len_i) ≤ 1 holds for every Huffman code (= 1,
//       since the tree is full) — the certificate that the lengths ARE
//       realizable as a prefix code.
//   (2) H ≤ L always, with EQUALITY iff every probability is a power of ½
//       (a dyadic source) — checked on both dyadic and non-dyadic sources.
//   (3) L < H + 1 always (the source-coding upper bound).
//   (4) BLOCK CODING: Huffman-coding pairs/triples of i.i.d. symbols drives
//       L/k strictly toward H (the limit theorem made numeric).
//   (5) OPTIMALITY by EXHAUSTION: for small alphabets, enumerate EVERY prefix
//       code (all full-binary-tree leaf-depth assignments) and confirm none has
//       a smaller average length than Huffman's. This is the honest oracle — it
//       shares no code with the Huffman builder.
//   (6) The cipher punchline: a substitution cipher is a permutation of symbols,
//       so it leaves the entropy EXACTLY unchanged — which is precisely why
//       frequency analysis breaks it. (Verified: H(plaintext) == H(ciphertext).)
// ============================================================================

// === CORE BEGIN ===
const log2 = (x) => Math.log(x) / Math.LN2;

// ---------------------------------------------------------------------------
//  Normalize a list of weights/counts into a probability distribution.
//  Drops zero-weight symbols (they carry no probability). Returns
//  [{sym, p}, …] sorted by descending p (ties broken by symbol for stability).
// ---------------------------------------------------------------------------
export function normalize(weights) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  if (total <= 0) return [];
  return entries
    .map(([sym, w]) => ({ sym, p: w / total }))
    .sort((a, b) => b.p - a.p || (a.sym < b.sym ? -1 : 1));
}

// ---------------------------------------------------------------------------
//  Shannon entropy H = −Σ p·log2 p  (bits/symbol). Accepts either a probability
//  array [{p},…] or a raw weights object.
// ---------------------------------------------------------------------------
export function entropy(dist) {
  const ps = Array.isArray(dist) ? dist.map(d => d.p) : normalize(dist).map(d => d.p);
  let H = 0;
  for (const p of ps) if (p > 0) H -= p * log2(p);
  return H;
}

// Maximum possible entropy for n symbols (uniform source) = log2 n.
export function maxEntropy(n) { return n > 0 ? log2(n) : 0; }

// ---------------------------------------------------------------------------
//  Count symbol frequencies in a string (the empirical source model).
// ---------------------------------------------------------------------------
export function countSymbols(text) {
  const w = Object.create(null);
  for (const ch of text) w[ch] = (w[ch] || 0) + 1;
  return w;
}

// ---------------------------------------------------------------------------
//  HUFFMAN. Build the optimal prefix code from a probability distribution.
//  Returns { tree, codes:{sym:bits}, lengths:{sym:len}, L (avg length) }.
//
//  The merge uses a deterministic ordering so the output is reproducible: pop
//  the two lowest-probability nodes; ties broken by tree "age" (insertion
//  order) then by a stable key. A single symbol gets the 1-bit codeword "0"
//  (degenerate but valid; L = 1, while H = 0).
// ---------------------------------------------------------------------------
export function huffman(dist) {
  const D = Array.isArray(dist) ? dist : normalize(dist);
  if (D.length === 0) return { tree: null, codes: {}, lengths: {}, L: 0 };
  if (D.length === 1) {
    const s = D[0].sym;
    return { tree: { leaf: true, sym: s }, codes: { [s]: '0' }, lengths: { [s]: 1 }, L: 1 };
  }
  // Min-priority forest. Each node: {p, leaf?, sym?, l?, r?, order}.
  let order = 0;
  let forest = D.map(d => ({ p: d.p, leaf: true, sym: d.sym, order: order++ }));
  const cmp = (a, b) => a.p - b.p || a.order - b.order;
  while (forest.length > 1) {
    forest.sort(cmp);
    const a = forest.shift();
    const b = forest.shift();
    forest.push({ p: a.p + b.p, leaf: false, l: a, r: b, order: order++ });
  }
  const tree = forest[0];
  const codes = {}, lengths = {};
  (function walk(node, prefix) {
    if (node.leaf) { codes[node.sym] = prefix || '0'; lengths[node.sym] = (prefix || '0').length; return; }
    walk(node.l, prefix + '0');
    walk(node.r, prefix + '1');
  })(tree, '');
  let L = 0;
  for (const d of D) L += d.p * lengths[d.sym];
  return { tree, codes, lengths, L };
}

// ---------------------------------------------------------------------------
//  KRAFT's inequality: Σ 2^(−len_i). For any prefix code this is ≤ 1; for a
//  COMPLETE (full) code — which Huffman always produces — it equals exactly 1.
// ---------------------------------------------------------------------------
export function kraftSum(lengths) {
  let s = 0;
  for (const k in lengths) s += Math.pow(2, -lengths[k]);
  return s;
}

// Is a code a valid prefix code? (no codeword is a prefix of another.)
export function isPrefixCode(codes) {
  const words = Object.values(codes);
  for (let i = 0; i < words.length; i++)
    for (let j = 0; j < words.length; j++)
      if (i !== j && words[j].startsWith(words[i])) return false;
  return true;
}

// Average length of an arbitrary code given a distribution.
export function avgLength(dist, lengths) {
  const D = Array.isArray(dist) ? dist : normalize(dist);
  let L = 0;
  for (const d of D) L += d.p * (lengths[d.sym] ?? 0);
  return L;
}

// ---------------------------------------------------------------------------
//  ENCODE / DECODE round-trip using a Huffman code. decode() must reconstruct
//  the original symbol stream exactly (no ambiguity — that's the prefix
//  property at work).
// ---------------------------------------------------------------------------
export function encode(symbols, codes) {
  let bits = '';
  for (const s of symbols) bits += codes[s];
  return bits;
}
export function decode(bits, tree) {
  if (!tree) return [];
  if (tree.leaf) {                          // single-symbol degenerate tree
    const out = [];
    for (let i = 0; i < bits.length; i++) out.push(tree.sym);
    return out;
  }
  const out = [];
  let node = tree;
  for (const b of bits) {
    node = (b === '0') ? node.l : node.r;
    if (node.leaf) { out.push(node.sym); node = tree; }
  }
  return out;
}

// ---------------------------------------------------------------------------
//  BLOCK CODING. Treat k-tuples of an i.i.d. source as the new alphabet and
//  Huffman-code those. Returns the per-ORIGINAL-symbol average length L/k,
//  which the source-coding theorem says → H as k grows.
//  (We build the product distribution exactly: p(tuple) = Π p(component).)
// ---------------------------------------------------------------------------
export function blockHuffmanLk(dist, k) {
  const D = Array.isArray(dist) ? dist : normalize(dist);
  // Build the k-fold product distribution.
  let prod = [{ sym: '', p: 1 }];
  for (let i = 0; i < k; i++) {
    const next = [];
    for (const a of prod) for (const d of D) next.push({ sym: a.sym + d.sym + '', p: a.p * d.p });
    prod = next;
  }
  const Lk = huffman(prod).L;
  return Lk / k;
}

// ---------------------------------------------------------------------------
//  THE OPTIMALITY ORACLE (independent of huffman()). For a SMALL alphabet,
//  enumerate every valid set of codeword LENGTHS that satisfies Kraft EXACTLY
//  (= 1, complete codes — adding slack only lengthens), assign them to symbols
//  in the length-minimizing way (shortest codes to most-probable symbols, the
//  rearrangement inequality), and return the minimum achievable average length.
//  No prefix code can do better than this number — so Huffman's L must equal it.
//
//  We generate candidate length-multisets by enumerating all FULL binary trees
//  with n leaves (Catalan-many) and reading off their leaf depths. Full binary
//  trees ⟺ complete prefix codes, so this is exhaustive over the optimum class.
// ---------------------------------------------------------------------------
export function optimalAvgLength(dist) {
  const D = Array.isArray(dist) ? dist : normalize(dist);
  const n = D.length;
  if (n === 0) return 0;
  if (n === 1) return 1;
  const probsDesc = D.map(d => d.p).sort((a, b) => b - a);  // most→least likely

  // All full binary trees with n leaves → their sorted leaf-depth multisets.
  const depthSets = fullBinaryLeafDepths(n);
  let best = Infinity;
  for (const depths of depthSets) {
    // Assign SHORTEST codeword to MOST probable symbol (rearrangement
    // inequality minimizes Σ p·len). depths sorted ascending, probs descending.
    const ds = depths.slice().sort((a, b) => a - b);
    let L = 0;
    for (let i = 0; i < n; i++) L += probsDesc[i] * ds[i];
    if (L < best) best = L;
  }
  return best;
}

// Enumerate the sorted leaf-depth multiset of every full binary tree with n
// leaves. Memoized over n; each tree contributes one depth-list (we dedupe
// identical multisets to keep the set small). Returns an array of arrays.
const _fbCache = new Map();
export function fullBinaryLeafDepths(n) {
  if (_fbCache.has(n)) return _fbCache.get(n);
  let result;
  if (n === 1) {
    result = [[0]];
  } else {
    const seen = new Set();
    const out = [];
    for (let left = 1; left < n; left++) {
      const right = n - left;
      for (const ld of fullBinaryLeafDepths(left))
        for (const rd of fullBinaryLeafDepths(right)) {
          // every leaf gains one level of depth under the new root
          const merged = ld.map(d => d + 1).concat(rd.map(d => d + 1)).sort((a, b) => a - b);
          const key = merged.join(',');
          if (!seen.has(key)) { seen.add(key); out.push(merged); }
        }
    }
    result = out;
  }
  _fbCache.set(n, result);
  return result;
}

// ---------------------------------------------------------------------------
//  Apply a substitution cipher (a permutation of the alphabet) to a string.
//  Used to demonstrate that entropy is invariant under substitution.
// ---------------------------------------------------------------------------
export function substitute(text, mapping) {
  let out = '';
  for (const ch of text) out += (mapping[ch] ?? ch);
  return out;
}
// A deterministic permutation of an alphabet from a seed (simple LCG shuffle).
export function permuteAlphabet(alphabet, seed = 1) {
  const a = alphabet.split('');
  let s = (seed >>> 0) || 1;
  const rnd = () => (s = (1664525 * s + 1013904223) >>> 0) / 4294967296;
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  const map = {};
  for (let i = 0; i < alphabet.length; i++) map[alphabet[i]] = a[i];
  return map;
}

// A handful of named sources for the bench + tests.
export const SOURCES = {
  // A dyadic source: every probability a power of ½ → H == L exactly.
  dyadic: { A: 1 / 2, B: 1 / 4, C: 1 / 8, D: 1 / 8 },
  // English letter frequencies (approx., %): the classic non-dyadic source.
  english: {
    E: 12.70, T: 9.06, A: 8.17, O: 7.51, I: 6.97, N: 6.75, S: 6.33, H: 6.09,
    R: 5.99, D: 4.25, L: 4.03, C: 2.78, U: 2.76, M: 2.41, W: 2.36, F: 2.23,
    G: 2.02, Y: 1.97, P: 1.93, B: 1.49, V: 0.98, K: 0.77, J: 0.15, X: 0.15,
    Q: 0.10, Z: 0.07,
  },
  // A near-uniform source: H ≈ log2 n, frequency analysis is useless.
  uniform: { A: 1, B: 1, C: 1, D: 1, E: 1, F: 1, G: 1, H: 1 },
  // A skewed source: one symbol dominates → low entropy, great compression.
  skewed: { A: 70, B: 12, C: 8, D: 5, E: 3, F: 2 },
};

// ---------------------------------------------------------------------------
//  THE SELF-TEST (shared verbatim with the page). Returns {lines, pass, total}.
// ---------------------------------------------------------------------------
export function runSelfTest() {
  const lines = [];
  const approx = (a, b, t = 1e-9) => Math.abs(a - b) <= t;
  const add = (name, ok, detail = '') => lines.push({ name, ok, detail });

  // 1. Entropy bounds: 0 ≤ H ≤ log2 n, with the extremes hit exactly.
  {
    const certain = entropy({ A: 1 });                 // one sure symbol → 0
    const uni = entropy(SOURCES.uniform);              // 8 uniform → log2 8 = 3
    const skew = entropy(SOURCES.skewed);
    const ok = approx(certain, 0) && approx(uni, 3) && skew > 0 && skew < maxEntropy(6);
    add('entropy bounds: H(certain)=0, H(uniform_8)=3=log₂8, 0<H(skewed)<log₂n',
      ok, `certain=${certain.toFixed(4)} uni=${uni.toFixed(4)} skew=${skew.toFixed(4)}`);
  }

  // 2. Kraft equality for Huffman (it builds a COMPLETE code → Σ2^-len = 1).
  {
    let ok = true, bad = '';
    for (const key of ['dyadic', 'english', 'uniform', 'skewed']) {
      const h = huffman(SOURCES[key]);
      const ks = kraftSum(h.lengths);
      if (!approx(ks, 1, 1e-9)) { ok = false; bad = `${key}: Σ2^-len=${ks}`; break; }
      if (!isPrefixCode(h.codes)) { ok = false; bad = `${key}: not a prefix code`; break; }
    }
    add('Kraft = 1 & prefix-free for every Huffman code (complete codes)', ok, bad);
  }

  // 3. The source-coding theorem H ≤ L < H+1, for several sources.
  {
    let ok = true, bad = '';
    for (const key of ['dyadic', 'english', 'uniform', 'skewed']) {
      const D = normalize(SOURCES[key]);
      const H = entropy(D), L = huffman(D).L;
      if (!(L >= H - 1e-9 && L < H + 1 - 1e-12)) { ok = false; bad = `${key}: H=${H.toFixed(4)} L=${L.toFixed(4)}`; break; }
    }
    add('source-coding theorem: H ≤ L < H+1 for every source', ok, bad);
  }

  // 4. EQUALITY iff dyadic: H == L for the dyadic source, H < L for English.
  {
    const Dd = normalize(SOURCES.dyadic), De = normalize(SOURCES.english);
    const Hd = entropy(Dd), Ld = huffman(Dd).L;
    const He = entropy(De), Le = huffman(De).L;
    const ok = approx(Hd, Ld, 1e-9) && (Le > He + 1e-6);
    add('H = L exactly for the dyadic source; H < L (slack) for English', ok,
      `dyadic H=${Hd.toFixed(4)} L=${Ld.toFixed(4)}; english H=${He.toFixed(4)} L=${Le.toFixed(4)}`);
  }

  // 5. OPTIMALITY by exhaustion: Huffman's L equals the brute-force minimum
  //    over ALL prefix codes (the independent oracle), for small alphabets.
  {
    let ok = true, bad = '';
    for (const key of ['dyadic', 'skewed', 'uniform']) {
      const D = normalize(SOURCES[key]);
      const Lh = huffman(D).L;
      const Lopt = optimalAvgLength(D);
      if (!approx(Lh, Lopt, 1e-9)) { ok = false; bad = `${key}: Huffman ${Lh.toFixed(5)} vs optimum ${Lopt.toFixed(5)}`; break; }
    }
    add('Huffman is OPTIMAL: L == brute-force min over all prefix codes', ok, bad);
  }

  // 6. NO code can beat the optimum — a hand-built shorter length-set must
  //    violate Kraft (the negative control).
  {
    // Try to give the skewed source all-length-2 codewords for 6 symbols:
    // Σ 2^-2 = 6·0.25 = 1.5 > 1 → impossible (Kraft forbids it).
    const cheat = {}; for (const d of normalize(SOURCES.skewed)) cheat[d.sym] = 2;
    const ks = kraftSum(cheat);
    add('negative control: a too-short code (6×len-2) violates Kraft (Σ>1)',
      ks > 1 + 1e-9, `Σ2^-len=${ks}`);
  }

  // 7. BLOCK CODING drives L/k → H. The theorem guarantees the BOUND
  //    H ≤ L/k < H + 1/k — which tightens as k grows, FORCING L/k → H. It does
  //    NOT promise monotonicity (Huffman's gap can wobble), and asserting that
  //    would be a false claim — so we test the real guarantee: the bound holds
  //    at every k, single-symbol coding already beats the trivial ⌈log₂n⌉, and
  //    blocking gets strictly closer to H than k=1 does.
  {
    const D = normalize(SOURCES.skewed);
    const H = entropy(D);
    const L1 = huffman(D).L;
    const L2 = blockHuffmanLk(D, 2);
    const L4 = blockHuffmanLk(D, 4);
    const bound = (Lk, k) => Lk >= H - 1e-9 && Lk < H + 1 / k + 1e-9;
    const ok = bound(L1, 1) && bound(L2, 2) && bound(L4, 4) &&
      (L4 - H) < (L1 - H) - 1e-6;      // k=4 strictly closer to H than k=1
    add('block coding: H ≤ L/k < H + 1/k (the bound tightens → L/k → H)', ok,
      `H=${H.toFixed(4)} L₁=${L1.toFixed(4)} L₂=${L2.toFixed(4)} L₄=${L4.toFixed(4)}`);
  }

  // 8. ROUND-TRIP: encode then decode reconstructs the message exactly.
  {
    const text = 'ENTROPYISTHELIMITTTT';
    const D = normalize(countSymbols(text));
    const h = huffman(D);
    const bits = encode([...text], h.codes);
    const back = decode(bits, h.tree).join('');
    add('encode→decode round-trips exactly (prefix code is unambiguous)',
      back === text, back === text ? `${bits.length} bits` : `got "${back}"`);
  }

  // 9. THE CIPHER PUNCHLINE: a substitution cipher leaves entropy UNCHANGED —
  //    which is exactly why frequency analysis can break it.
  {
    const plain = 'THEQUICKBROWNFOXJUMPSOVERTHELAZYDOGTHEQUICKBROWN';
    const map = permuteAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 12345);
    const cipher = substitute(plain, map);
    const Hp = entropy(countSymbols(plain));
    const Hc = entropy(countSymbols(cipher));
    add('substitution cipher preserves entropy exactly (why frequency analysis works)',
      approx(Hp, Hc, 1e-12) && cipher !== plain, `H_plain=${Hp.toFixed(5)} H_cipher=${Hc.toFixed(5)}`);
  }

  const pass = lines.filter(l => l.ok).length;
  return { lines, pass, total: lines.length };
}
// === CORE END ===
