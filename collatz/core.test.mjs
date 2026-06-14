// ============================================================================
//  Node-side falsifiability harness for The Collatz Bench.
//  Runs the shared in-page self-test PLUS deeper Node-only assertions at scale
//  (N up to 200000 — far past what the in-page pill can afford), THEN re-extracts
//  the inlined core from index.html and proves it is byte-for-byte the SAME core
//  (parity). Run:  node core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  STEP_CAP, next, nextAlt,
  stoppingTimeRaw, stoppingTimesMemo, trajectory,
  RECORDS_A006877, RECORDS_A006884, recordSetters,
  invChildren, inverseTree,
  reachesOneAlt, altCycle,
  buildTree, pathOf,
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

console.log('The Collatz Bench — core.test.mjs\n');

// ── 1. the shared in-page self-test, at the Node budget (N=20000) ────────────
console.log('— shared runSelfTest() (same claims the in-page pill runs, N=20000) —');
const st = runSelfTest(20000);
for (const l of st.lines) ok('[self-test] ' + l.name, l.ok, l.detail);
ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);

const BIG = 200000;

// ── 2. CLAIM 1 — exhaustive memo === raw, 0 disagreements, all terminate ─────
console.log('\n— CLAIM 1: two independent constructions agree exhaustively —');
{
  const memo = stoppingTimesMemo(BIG);
  let bad = 0, firstBad = '', nonTerm = 0;
  for (let n = 2; n <= BIG; n++){
    const raw = stoppingTimeRaw(n);
    if (raw < 0){ nonTerm++; continue; }
    if (memo[n] !== raw){ if (!bad) firstBad = `n=${n}: memo ${memo[n]} ≠ raw ${raw}`; bad++; }
  }
  ok(`A. memoized st[n] === clean re-walk for all n∈[2..${BIG}], 0 disagreements, all terminate`,
     bad === 0 && nonTerm === 0,
     bad === 0 && nonTerm === 0 ? `${BIG - 1} starts checked, every one reaches 1` :
       (bad ? `${bad} disagree (first ${firstBad})` : `${nonTerm} non-terminating`));
}

// ── 3. CLAIM 2 — records EXACT against literature + the 5 spot checks ────────
console.log('\n— CLAIM 2: records reproduce the literature live —');
{
  const { steps, peaks } = recordSetters(BIG);
  const stepOk = steps.n.slice(0, RECORDS_A006877.n.length).join(',') === RECORDS_A006877.n.join(',') &&
                 steps.steps.slice(0, RECORDS_A006877.steps.length).join(',') === RECORDS_A006877.steps.join(',');
  const peakOk = peaks.n.slice(0, RECORDS_A006884.n.length).join(',') === RECORDS_A006884.n.join(',') &&
                 peaks.peak.slice(0, RECORDS_A006884.peak.length).join(',') === RECORDS_A006884.peak.join(',');
  ok('B. step-record prefix === A006877 (n & steps) and peak ladder === A006884/A025586',
     stepOk && peakOk,
     stepOk && peakOk ? `${steps.n.length} step-records, ${peaks.n.length} peak-records ≤${BIG}` :
       `step:${stepOk} peak:${peakOk}`);

  const spots = [[27, 111, 9232], [97, 118, 9232], [871, 178, 190996], [6171, 261, 975400], [77031, 350, 21933016]];
  let spotOk = true, sd = '';
  for (const [n, s, p] of spots){
    const t = trajectory(n);
    if (t.steps !== s || t.peak !== p){ spotOk = false; sd = `${n}: got {${t.steps},${t.peak}}`; break; }
  }
  ok('B. spot checks exact: 27→{111,9232}, 97→{118,9232}, 871→{178,190996}, 6171→{261,975400}, 77031→{350,21933016}',
     spotOk, spotOk ? 'all five reproduce' : sd);
}

// ── 4. CLAIM 3 — backward tree depth === forward stopping time everywhere ────
console.log('\n— CLAIM 3: forward & backward constructions agree on the tree —');
{
  const maxDepth = 200;
  const tree = inverseTree(5000, maxDepth);
  let bad = 0, firstBad = '';
  for (const [n, d] of tree){
    const fwd = stoppingTimeRaw(n);
    if (fwd !== d){ if (!bad) firstBad = `n=${n}: tree ${d} ≠ fwd ${fwd}`; bad++; }
  }
  ok(`C. inverseTree depth === forward stoppingTimeRaw on all ${tree.size} reached nodes (5000, depth ${maxDepth})`,
     bad === 0,
     bad === 0 ? `${tree.size} of 5000 reached, 0 disagreements (HONEST: coverage is a stat — the tree does NOT cover [1..N])` :
       `${bad} disagree (first ${firstBad})`);

  // operational: every n∈[1..N] terminates and only the 4→2→1 loop is reached
  let allTerm = true, badT = '';
  for (let n = 1; n <= 5000; n++){
    if (stoppingTimeRaw(n) < 0){ allTerm = false; badT = `n=${n}`; break; }
  }
  ok('C. every n∈[1..5000] terminates at 1 (only the 4→2→1 loop is reached)',
     allTerm, allTerm ? '5000/5000 reach 1' : `${badT} did not`);

  // the canonical inverse rule sanity: invChildren(1)=[2]; invChildren(16) has odd predecessor 5
  const c1 = invChildren(1), c16 = invChildren(16);
  ok('C. canonical inverse rule pinned: invChildren(1)=[2], invChildren(16)=[32,5]',
     c1.join(',') === '2' && c16.join(',') === '32,5',
     `invChildren(1)=[${c1}] · invChildren(16)=[${c16}]`);
}

// ── 5. CLAIM 4 — negative control with TEETH ─────────────────────────────────
console.log('\n— CLAIM 4: the 3n−1 control fails, with teeth —');
{
  let fail = 0;
  const failed = [];
  for (let n = 1; n <= 60; n++) if (!reachesOneAlt(n)){ fail++; failed.push(n); }
  const c5 = altCycle(5).join(',');
  const c17 = altCycle(17).join(',');
  const C5 = '5,7,10,14,20';
  const C17 = '17,25,34,37,41,50,55,61,68,74,82,91,110,122,136,164,182,272';
  ok('D. ≥30 of [1..60] FAIL to reach 1 under 3n−1 (the teeth)', fail >= 30, `${fail}/60 fail`);
  ok('D. altCycle(5) === [5,7,10,14,20]', c5 === C5, c5);
  ok('D. altCycle(17) === the 18-element cycle exactly', c17 === C17, `${altCycle(17).length} elements`);
  // the teeth proper: next and nextAlt must DIFFER on odds (if they ever coincide, this flips)
  ok('D. next ≢ nextAlt on every odd in [1..99] (the map is genuinely different)',
     (() => { for (let n = 1; n <= 99; n += 2) if (next(n) === nextAlt(n)) return false; return true; })(),
     'every odd kick differs (3n+1 vs 3n−1)');
}

// ── 6. OVERFLOW GUARD — no in-range value exceeds MAX_SAFE_INTEGER ───────────
console.log('\n— OVERFLOW GUARD: plain Number is exact in range —');
{
  let maxPeak = 0, argmax = 0, over = 0;
  for (let n = 1; n <= 100000; n++){
    const p = trajectory(n).peak;
    if (p > maxPeak){ maxPeak = p; argmax = n; }
    if (p > Number.MAX_SAFE_INTEGER) over++;
  }
  ok('E. max trajectory peak (n≤1e5) = 1,570,824,736 ≪ MAX_SAFE_INTEGER (2^53−1); 0 overflow',
     over === 0 && maxPeak === 1570824736 && argmax === 77671,
     `max peak ${maxPeak.toLocaleString()} at n=${argmax}; cap ${Number.MAX_SAFE_INTEGER.toLocaleString()}`);

  // longest trajectory in range is 350 steps (n=77031) ≪ STEP_CAP
  let maxSteps = 0, argS = 0;
  for (let n = 1; n <= 100000; n++){ const s = trajectory(n).steps; if (s > maxSteps){ maxSteps = s; argS = n; } }
  ok('E. longest in-range trajectory = 350 steps (n=77031) ≪ STEP_CAP', maxSteps === 350 && argS === 77031 && STEP_CAP > 350,
     `longest ${maxSteps} steps at n=${argS}, STEP_CAP=${STEP_CAP}`);
}

// ── 7. DETERMINISM — trajectory(27) byte-identical twice ─────────────────────
console.log('\n— DETERMINISM: seed-free, byte-identical —');
{
  const a = trajectory(27), b = trajectory(27);
  ok('F. trajectory(27) is byte-identical across two calls → {111, 9232}',
     a.steps === b.steps && a.peak === b.peak && a.path.join(',') === b.path.join(','),
     `27 → 1 in ${a.steps} steps, peak ${a.peak.toLocaleString()} (×2 identical)`);
  // buildTree is deterministic too (PNG reproducibility)
  const t1 = buildTree(12), t2 = buildTree(12);
  let same = t1.nodes.size === t2.nodes.size;
  if (same) for (const [n, nd] of t1.nodes){ const o = t2.nodes.get(n); if (!o || o.angle !== nd.angle || o.x !== nd.x){ same = false; break; } }
  ok('F. buildTree(12) is byte-deterministic (same node set, same angles/coords)',
     same, `${t1.nodes.size} nodes, layout reproducible`);
  // pathOf === trajectory.path (the single path computer)
  ok('F. pathOf(n) === trajectory(n).path (one path computer, no second walker)',
     pathOf(871).join(',') === trajectory(871).path.join(','), `pathOf(871) length ${pathOf(871).length}`);
}

// ── 8. RE-EXTRACTION PARITY — the page core === the module, byte-for-byte ─────
//   Read index.html, slice the inline core between the banner sentinels, eval it,
//   run ITS runSelfTest at the same N → same pass-count AND ok-for-ok per line,
//   AND assert the inlined next() body is char-for-char the imported next.toString().
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== COLLATZ CORE (inlined byte-twin of core.mjs) BEGIN =====';
  const END = '// ===== COLLATZ CORE END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in index.html', i >= 0 && j > i,
     i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i){
    const slice = html.slice(i + BEGIN.length, j);

    // (a) the inlined next() body is char-for-char the imported next.toString().
    const pageNext = extractFn(slice, 'next');
    const importedNext = next.toString();
    const norm = s => s.replace(/^export\s+/, '').trim();
    ok('(parity)★ inlined next() body is char-for-char the imported next.toString()',
       norm(pageNext) === norm(importedNext),
       norm(pageNext) === norm(importedNext) ? 'identical bytes — same map' :
         `DRIFT:\n  page: ${JSON.stringify(norm(pageNext))}\n  mod:  ${JSON.stringify(norm(importedNext))}`);

    // also pin nextAlt (the control's map must match too)
    const pageAlt = extractFn(slice, 'nextAlt');
    ok('(parity)★ inlined nextAlt() body is char-for-char the imported nextAlt.toString()',
       norm(pageAlt) === norm(nextAlt.toString()), norm(pageAlt) === norm(nextAlt.toString()) ? 'identical' : 'DRIFT');

    // (b) evaluate the slice and run ITS runSelfTest → same pass-count + ok-for-ok.
    let pageRes = null, evalErr = null, PageCore = null;
    const RET = '\n;return { runSelfTest, trajectory, stoppingTimesMemo, stoppingTimeRaw, recordSetters, inverseTree, reachesOneAlt, altCycle, buildTree, pathOf, next, nextAlt, invChildren };';
    try {
      const factory = new Function(slice + RET);
      PageCore = factory();
      pageRes = PageCore.runSelfTest(20000);
    } catch (e) { evalErr = e; }

    ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');

    if (pageRes){
      const modRes = runSelfTest(20000);
      ok('(parity)★ inline runSelfTest pass-count == module pass-count (same N)',
         pageRes.pass === modRes.pass && pageRes.total === modRes.total,
         `in-page ${pageRes.pass}/${pageRes.total}  ·  module ${modRes.pass}/${modRes.total}`);
      let agree = pageRes.lines.length === modRes.lines.length;
      for (let k = 0; agree && k < pageRes.lines.length; k++){
        if (pageRes.lines[k].ok !== modRes.lines[k].ok || pageRes.lines[k].name !== modRes.lines[k].name) agree = false;
      }
      ok('(parity)★ every named claim agrees ok-for-ok AND name-for-name (page vs module)', agree,
         agree ? `all ${pageRes.lines.length} lines identical` : 'a line disagreed');

      // (c) re-extracted trajectory(27) reproduces {111, 9232} byte-for-byte.
      const pageT = PageCore.trajectory(27), modT = trajectory(27);
      ok('(parity)★ re-extracted trajectory(27) reproduces {111, 9232} byte-for-byte',
         pageT.steps === modT.steps && pageT.peak === modT.peak && pageT.path.join(',') === modT.path.join(','),
         `page 27→${pageT.steps}/${pageT.peak} == module 27→${modT.steps}/${modT.peak}`);
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
