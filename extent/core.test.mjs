// ============================================================================
//  Node-side falsifiability harness for The Extent.
//  Runs the shared in-page self-test runSelfTest(n) for n=3..7 (all four claims
//  green at every n, 5040-row EXHAUSTIVE sweep at n=7), PLUS deeper Node-only
//  assertions (the ranker's independence, the closure's honesty, the control's
//  teeth), THEN re-extracts the inlined core from index.html between the
//  sentinels and proves it is byte-for-byte the SAME core (parity).
//  Run:  node core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  sjtRows, lehmerRank, inversions, adjSwapBetween,
  makeRng, naiveRows, factorial, rowsEqual,
  runSelfTest,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));

let pass = 0, total = 0;
const ok = (name, cond, detail = '') => {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (detail ? '  ·  ' + detail : '')); }
  else { console.log('  ✗ ' + name + (detail ? '  ·  ' + detail : '')); }
};

console.log('The Extent — core.test.mjs\n');

// ── 1. the shared in-page self-test, exhaustively for n=3..7 ─────────────────
console.log('— shared runSelfTest() (same claims the in-page pill runs), n=3..7 —');
for (const n of [3, 4, 5, 6, 7]){
  const st = runSelfTest(n);
  for (const l of st.lines) ok(`[self-test n=${n}] ` + l.name, l.ok, l.detail);
  ok(`[self-test n=${n}] all in-page checks pass`, st.pass === st.total, `${st.pass}/${st.total}`);
  ok(`[self-test n=${n}] stats.isCycle === true and stats.nFact === ${factorial(n)}`,
     st.stats.isCycle === true && st.stats.nFact === factorial(n), `isCycle=${st.stats.isCycle} nFact=${st.stats.nFact}`);
}

// ── 2. CLAIM 1 — BIJECTION, exhaustive, with an INDEPENDENT ranker ───────────
console.log('\n— CLAIM 1: sjtRows(n) is a bijection onto Sₙ (independent Lehmer ranker) —');
{
  for (const n of [3, 4, 5, 6, 7]){
    const rows = sjtRows(n), nf = factorial(n);
    const seen = new Uint8Array(nf);
    let dupes = 0, oob = 0;
    for (const r of rows){
      const rk = lehmerRank(r);
      if (rk < 0 || rk >= nf){ oob++; continue; }
      if (seen[rk]) dupes++; seen[rk] = 1;
    }
    let missing = 0; for (let i = 0; i < nf; i++) if (!seen[i]) missing++;
    ok(`n=${n}: ${rows.length} rows == ${nf}! · every Lehmer rank hit once (0 dupes, 0 missing, 0 oob)`,
       rows.length === nf && dupes === 0 && missing === 0 && oob === 0,
       `rows=${rows.length} dupes=${dupes} missing=${missing} oob=${oob}`);
  }
  // ★ ANTI-CIRCULARITY: a SECOND, even-more-independent ranker (sort-the-orderings
  // lexicographically and index) must produce the SAME rank for every row as
  // lehmerRank — corroborating the Lehmer address without sharing its code. At
  // n=5 (120 rows) we materialise all permutations lexicographically and check.
  {
    const n = 5, nf = factorial(n);
    // build all permutations of 0..n-1 in lexicographic order (Heap-free, pure)
    const all = [];
    const perm = (arr, cur) => {
      if (!arr.length){ all.push(cur); return; }
      for (let i = 0; i < arr.length; i++){
        const rest = arr.slice(0, i).concat(arr.slice(i + 1));
        perm(rest, cur.concat(arr[i]));
      }
    };
    perm([0, 1, 2, 3, 4], []);
    // `all` is in lexicographic order ⇒ lexIndex(row) is row's position in `all`.
    const key = r => r.join(',');
    const lexIndex = new Map(); all.forEach((r, i) => lexIndex.set(key(r), i));
    let agree = true, fb = '';
    for (const r of sjtRows(n)){
      if (lexIndex.get(key(r)) !== lehmerRank(r)){ agree = false; fb = key(r); break; }
    }
    ok('★ANTI-CIRCULARITY: lehmerRank === lexicographic-index for all 120 rows (a THIRD stranger agrees)',
       agree, agree ? 'Lehmer code === lex index for every permutation (independent corroboration)' : `disagree at ${fb}`);
  }
}

// ── 3. CLAIM 2 — ADJACENCY: every step is one adjacent transposition ─────────
console.log('\n— CLAIM 2: every consecutive pair is one adjacent transposition —');
{
  for (const n of [3, 4, 5, 6, 7]){
    const rows = sjtRows(n);
    let bad = 0, parityOk = true;
    for (let i = 0; i + 1 < rows.length; i++){
      const sw = adjSwapBetween(rows[i], rows[i + 1]);
      if (!sw){ bad++; continue; }
      if (((inversions(rows[i]) ^ inversions(rows[i + 1])) & 1) !== 1) parityOk = false;
    }
    ok(`n=${n}: all ${rows.length - 1} consecutive pairs are single adjacent swaps · inversion-parity alternates`,
       bad === 0 && parityOk, `bad=${bad} parityOk=${parityOk}`);
  }
  // adjSwapBetween rejects non-adjacent, multi-diff, and non-swaps.
  ok('adjSwapBetween rejects a non-adjacent swap', adjSwapBetween([0, 1, 2, 3], [2, 1, 0, 3]) === null);
  ok('adjSwapBetween rejects a 3-difference', adjSwapBetween([0, 1, 2], [1, 2, 0]) === null);
  ok('adjSwapBetween rejects identical rows', adjSwapBetween([0, 1, 2], [0, 1, 2]) === null);
  ok('adjSwapBetween accepts a true adjacent swap @1', JSON.stringify(adjSwapBetween([0, 1, 2], [0, 2, 1])) === '{"pos":1}');
}

// ── 4. CLAIM 3 — NEGATIVE CONTROL WITH TEETH ─────────────────────────────────
console.log('\n— CLAIM 3: the carillon drift (naiveRows) FAILS the bijection —');
{
  for (const n of [3, 4, 5, 6, 7]){
    const nf = factorial(n);
    const nr = naiveRows(n, nf, 1733);
    const seen = new Set();
    let firstDupe = -1;
    for (let i = 0; i < nr.length; i++){
      const rk = lehmerRank(nr[i]);
      if (seen.has(rk) && firstDupe < 0) firstDupe = i;
      seen.add(rk);
    }
    const distinct = seen.size, missed = nf - distinct;
    ok(`n=${n}: naive ${nf} rows → ${distinct}/${nf} distinct, ${missed} missed, first repeat @row ${firstDupe} (NOT a bijection — teeth)`,
       (missed > 0 || distinct < nf) && nr.length === nf, `distinct=${distinct} missed=${missed}`);
  }
  // every naive row is itself a valid permutation (the control is honest drift,
  // not garbage) — it fails by REPETITION, not by producing non-permutations.
  {
    const n = 6, nf = factorial(n);
    let allPerms = true;
    for (const r of naiveRows(n, nf, 1733)){
      const s = new Set(r);
      if (s.size !== n) { allPerms = false; break; }
      for (let v = 0; v < n; v++) if (!s.has(v)) { allPerms = false; break; }
    }
    ok('every naive row is a valid permutation (it fails by REPEATING orders, not by corruption)', allPerms);
  }
  // multiple seeds all fail (the point: EVERY seed fails the extent).
  {
    let allFail = true;
    for (const seed of [1, 42, 1733, 99999, 271828]){
      const n = 5, nf = factorial(n);
      const seen = new Set();
      for (const r of naiveRows(n, nf, seed)) seen.add(lehmerRank(r));
      if (seen.size >= nf) allFail = false;
    }
    ok('EVERY seed fails the extent (5 seeds at n=5, none reaches all 120 orders)', allFail);
  }
}

// ── 5. CLAIM 4 — DETERMINISM ─────────────────────────────────────────────────
console.log('\n— CLAIM 4: both generators are deterministic —');
{
  let sjtOk = true, naiveOk = true;
  for (const n of [3, 4, 5, 6, 7]) if (!rowsEqual(sjtRows(n), sjtRows(n))) sjtOk = false;
  for (const n of [3, 4, 5, 6]) if (!rowsEqual(naiveRows(n, 200, 1733), naiveRows(n, 200, 1733))) naiveOk = false;
  ok('sjtRows(n) byte-identical across two calls (n=3..7)', sjtOk);
  ok('naiveRows(n,c,seed) byte-identical across two calls (n=3..6)', naiveOk);
  // different seeds give different naive tours (the RNG actually varies).
  ok('naiveRows differs across seeds', !rowsEqual(naiveRows(5, 60, 1), naiveRows(5, 60, 2)));
}

// ── 6. THE CLOSURE — plain hunt ships an HONEST CYCLE ────────────────────────
console.log('\n— CLOSURE: the extent is a cycle (last row → first by one swap) —');
{
  for (const n of [3, 4, 5, 6, 7]){
    const rows = sjtRows(n);
    const sw = adjSwapBetween(rows[rows.length - 1], rows[0]);
    ok(`n=${n}: last row → first row by ONE adjacent swap (Hamiltonian cycle on the permutohedron)`,
       !!sw, sw ? `swap @${sw.pos}↔${sw.pos + 1}` : 'does not close');
  }
  // first row is rounds (the identity) — the canonical opening of a peal.
  ok('the tour opens on rounds [0,1,…,n−1] (the identity / the treble leading)',
     JSON.stringify(sjtRows(5)[0]) === '[0,1,2,3,4]');
}

// ── 7. THE RANKER IS INDEPENDENT OF THE WALKER (the source-level guard) ──────
console.log('\n— ★ ANTI-CIRCULARITY (source level): walker & ranker share no code —');
{
  // The two functions, as source, must not call each other and must not share a
  // helper that does the work. We assert lehmerRank does not mention sjt/plain
  // hunt machinery and sjtRows does not mention rank/lehmer/factorial-base.
  const lr = lehmerRank.toString(), sw = sjtRows.toString();
  const rankerClean = !/sjtRows|splice|downward|zig|weave/.test(lr);
  const walkerClean = !/lehmerRank|rank|factorial|f\[n - 1 - i\]/.test(sw);
  ok('lehmerRank source never references the walker (sjtRows/splice/zig-zag)', rankerClean);
  ok('sjtRows source never references the ranker (lehmerRank/rank/factorial-base)', walkerClean);
}

// ── 8. RE-EXTRACTION PARITY — the page core === the module, byte-for-byte ─────
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== EXTENT CORE (inlined byte-twin of core.mjs) BEGIN =====';
  const END = '// ===== EXTENT CORE END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in index.html', i >= 0 && j > i,
     i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i){
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) ★ inlined sjtRows body === imported sjtRows.toString() char-for-char.
    const pageWalker = extractFn(slice, 'sjtRows');
    ok('(parity)★ inlined sjtRows body is char-for-char the imported sjtRows.toString()',
       norm(pageWalker) === norm(sjtRows.toString()),
       norm(pageWalker) === norm(sjtRows.toString()) ? 'identical bytes — the WALKER' :
         `DRIFT:\n  page: ${JSON.stringify(norm(pageWalker).slice(0, 120))}\n  mod:  ${JSON.stringify(norm(sjtRows.toString()).slice(0, 120))}`);

    // (b) ★ inlined lehmerRank + naiveRows + runSelfTest bodies === imported.
    const pageRank = extractFn(slice, 'lehmerRank');
    ok('(parity)★ inlined lehmerRank body === imported lehmerRank.toString()',
       norm(pageRank) === norm(lehmerRank.toString()), norm(pageRank) === norm(lehmerRank.toString()) ? 'identical — the RANKER' : 'DRIFT');
    const pageNaive = extractFn(slice, 'naiveRows');
    ok('(parity)★ inlined naiveRows body === imported naiveRows.toString()',
       norm(pageNaive) === norm(naiveRows.toString()), norm(pageNaive) === norm(naiveRows.toString()) ? 'identical — the CONTROL' : 'DRIFT');
    const pageST = extractFn(slice, 'runSelfTest');
    ok('(parity)★ inlined runSelfTest body === imported runSelfTest.toString()',
       norm(pageST) === norm(runSelfTest.toString()), norm(pageST) === norm(runSelfTest.toString()) ? 'identical — the ORACLE' : 'DRIFT');

    // (c) evaluate the slice and run ITS runSelfTest → same pass-count + ok-for-ok.
    let pageRes = null, evalErr = null, PageCore = null;
    const RET = '\n;return { runSelfTest, sjtRows, lehmerRank, inversions, adjSwapBetween, naiveRows, makeRng, factorial, rowsEqual };';
    try {
      const factory = new Function(slice + RET);
      PageCore = factory();
      pageRes = PageCore.runSelfTest(7);
    } catch (e) { evalErr = e; }

    ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');

    if (pageRes){
      const modRes = runSelfTest(7);
      ok('(parity)★ inline runSelfTest pass-count == module pass-count (n=7, EXHAUSTIVE 5040)',
         pageRes.pass === modRes.pass && pageRes.total === modRes.total,
         `in-page ${pageRes.pass}/${pageRes.total}  ·  module ${modRes.pass}/${modRes.total}`);
      let agree = pageRes.lines.length === modRes.lines.length;
      for (let kk = 0; agree && kk < pageRes.lines.length; kk++){
        if (pageRes.lines[kk].ok !== modRes.lines[kk].ok || pageRes.lines[kk].name !== modRes.lines[kk].name) agree = false;
      }
      ok('(parity)★ every named claim agrees ok-for-ok AND name-for-name (page vs module)', agree,
         agree ? `all ${pageRes.lines.length} lines identical` : 'a line disagreed');

      // (d) spot: re-extracted sjtRows/lehmerRank reproduce the bijection at n=6.
      const pr = PageCore.sjtRows(6);
      const seen = new Set();
      for (const r of pr) seen.add(PageCore.lehmerRank(r));
      ok('(parity)★ re-extracted sjtRows∘lehmerRank is a bijection at n=6 (720 distinct ranks)',
         pr.length === 720 && seen.size === 720, `${pr.length} rows, ${seen.size} distinct ranks`);
    }
  }
}

// extract `function NAME(...) { ... }` with brace-matching from a source string.
function extractFn(src, name){
  const re = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = re.exec(src);
  if (!m) return '';
  let i = src.indexOf('{', m.index);
  if (i < 0) return '';
  let depth = 0, k = i;
  for (; k < src.length; k++){
    if (src[k] === '{') depth++;
    else if (src[k] === '}'){ depth--; if (depth === 0){ k++; break; } }
  }
  return src.slice(m.index, k);
}

console.log(`\n${pass}/${total} ${pass === total ? '✓ ALL GREEN' : '✗ FAILURES'}`);
process.exit(pass === total ? 0 : 1);
