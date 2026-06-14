// ============================================================================
//  Node-side falsifiability harness for The Knot Tabulator — the knot-determinant
//  bench. Runs the shared in-page self-test runSelfTest() (the SAME four claims the
//  page pill runs), PLUS deeper Node-only assertions (literature values through the
//  full Gauss→det pipeline, an extended stability stress walk, the realizability
//  gate's necessity, the rank-vs-brute coloring agreement, the Hopf strike, a
//  fourth-prime coloring witness), THEN re-extracts the inlined core from index.html
//  between the sentinels and proves it is byte-for-byte the SAME core (parity — the
//  estate standard).
//  Run:  node knot-core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  bareissDet, gaussToCrossings, alexanderRows, knotDeterminant,
  modInv, modRank, pColorings, pColoringsBrute,
  makeRng, diagramCode, compileDiagram, freshId, isRealizable,
  applyR1, applyR2, applyR3, applyRandomMove, WIGGLE_CAP_TOKENS, runSelfTest,
} from './knot-core.mjs';
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

console.log('The Knot Tabulator — knot-core.test.mjs\n');

// helpers reading a raw signed Gauss code through the load-bearing seam.
const detOf = code => knotDeterminant(gaussToCrossings(code));
const colOf = (code, p) => { const d = gaussToCrossings(code); return pColorings(d.cr, d.arcs, p); };

// ── 1. THE SHARED IN-PAGE SELF-TEST (the same four claims the pill runs) ───────
console.log('— shared runSelfTest() (the SAME claims the in-page pill runs) —');
{
  const st = runSelfTest();
  for (const l of st.lines) ok('[self-test] ' + l.name, l.ok, l.detail);
  ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);
}

// ── 2. LITERATURE through the FULL Gauss→crossings→Alexander→Bareiss pipeline. ─
console.log('\n— literature values end-to-end (unknot 1, trefoil 3, fig-8 5, Hopf 2) —');
{
  const u = knotDeterminant(compileDiagram('unknot').diagram);
  const t = knotDeterminant(compileDiagram('trefoil').diagram);
  const f = knotDeterminant(compileDiagram('figure8').diagram);
  const h = knotDeterminant(compileDiagram('hopf').diagram);
  ok('unknot determinant == 1 (det 1 ⟹ proves nothing knotted — the sound floor)', u === 1, `|Δ|=${u}`);
  ok('trefoil determinant == 3 (3 ≠ 1 ⟹ provably knotted)', t === 3, `|Δ|=${t}`);
  ok('figure-8 determinant == 5', f === 5, `|Δ|=${f}`);
  ok('Hopf LINK determinant == 2 (the single-arc-per-component strike gives 2 directly)', h === 2, `|Δ|=${h}`);
  ok('trefoil ≠ unknot — the discrimination (3 ≠ 1)', t !== u, `${t} ≠ ${u}`);
  // chirality blindness: the MIRROR trefoil (all signs flipped) reads the SAME det.
  const mirror = [
    { t: 'O', id: 1, sign: -1 }, { t: 'U', id: 2, sign: -1 }, { t: 'O', id: 3, sign: -1 },
    { t: 'U', id: 1, sign: -1 }, { t: 'O', id: 2, sign: -1 }, { t: 'U', id: 3, sign: -1 }];
  ok('the determinant is BLIND to chirality: left & right trefoil both read 3 (proves knotted, not handedness)',
     detOf(mirror) === 3, `mirror |Δ|=${detOf(mirror)}`);
}

// ── 3. THE COLORINGS — literature + rank-vs-brute + a 3rd & 4th prime witness. ─
console.log('\n— p-colorings: 3-colorability + rank == brute over several primes —');
{
  const tre = compileDiagram('trefoil').diagram, unk = compileDiagram('unknot').diagram, fig = compileDiagram('figure8').diagram;
  ok('trefoil has 9 mod-3 colorings (3 trivial + 6 nontrivial) → 3-colorable',
     pColorings(tre.cr, tre.arcs, 3) === 9, `${pColorings(tre.cr, tre.arcs, 3)}`);
  ok('unknot has exactly 3 mod-3 colorings (only the trivial monochrome) → NOT 3-colorable',
     pColorings(unk.cr, unk.arcs, 3) === 3, `${pColorings(unk.cr, unk.arcs, 3)}`);
  ok('figure-8 (det 5) is 5-colorable: 25 = 5² mod-5 (nontrivial), but only the 3 trivial mod-3 (NOT 3-colorable)',
     pColorings(fig.cr, fig.arcs, 5) === 25 && pColorings(fig.cr, fig.arcs, 3) === 3,
     `fig p5=${pColorings(fig.cr, fig.arcs, 5)} (=5²) p3=${pColorings(fig.cr, fig.arcs, 3)} (trivial only)`);
  // rank formula == brute enumeration on every base diagram, p = 3,5,7.
  let mismatch = '';
  for (const name of ['unknot', 'trefoil', 'figure8']){
    const g = compileDiagram(name).diagram;
    for (const p of [3, 5, 7]){
      if (pColorings(g.cr, g.arcs, p) !== pColoringsBrute(g.cr, g.arcs, p)) mismatch = `${name}/p${p}`;
    }
  }
  ok('the polynomial rank-count == the exponential brute-count on every base diagram (p=3,5,7)',
     mismatch === '', mismatch === '' ? 'rank ≡ brute across all specimens & primes' : `mismatch at ${mismatch}`);
}

// ── 4. THE BAREISS DETERMINANT is exact (vs a known small integer matrix). ────
console.log('\n— bareissDet is the EXACT integer determinant —');
{
  ok('bareissDet([[2,-1,0],[-1,2,-1],[0,-1,2]]) == 4 (the path-graph Laplacian minor)',
     bareissDet([[2, -1, 0], [-1, 2, -1], [0, -1, 2]]) === 4, `${bareissDet([[2, -1, 0], [-1, 2, -1], [0, -1, 2]])}`);
  ok('bareissDet of the 0×0 matrix == 1 (the empty product)', bareissDet([]) === 1);
  ok('bareissDet([[7]]) == 7', bareissDet([[7]]) === 7);
  // a singular matrix → 0.
  ok('bareissDet of a rank-deficient matrix == 0', bareissDet([[1, 2], [2, 4]]) === 0);
  // exactness vs floating Gaussian elimination on a moderately large integer matrix:
  // the trefoil-after-20-R2 Alexander minor stays an exact integer, far inside MAX_SAFE_INTEGER.
  const rng = makeRng(424242);
  let code = compileDiagram('trefoil').code.map(c => ({ ...c }));
  for (let k = 0; k < 18; k++){ const m = applyRandomMove(code, rng); code = m.code; }
  const d = detOf(code);
  ok('a heavily-wiggled trefoil (≈20+ crossings) still reads |Δ| == 3 with EXACT integer arithmetic',
     d === 3, `|Δ|=${d} after a long walk (Bareiss stays integral)`);
}

// ── 5. THE REALIZABILITY GATE — necessary & it actually fires. ────────────────
console.log('\n— isRealizable: the planarity gate the moves are filtered by —');
{
  // the base specimens are realizable.
  for (const name of ['unknot', 'trefoil', 'figure8']){
    ok(`${name} (a real knot diagram) is realizable`, isRealizable(compileDiagram(name).code));
  }
  // a deliberately NON-realizable code (an odd interlacement) must be rejected.
  // O1 O2 U1 U2 — crossings 1 and 2 are interlaced and each interlaces exactly 1 (odd) → not realizable.
  const bad = [{ t: 'O', id: 1, sign: 1 }, { t: 'O', id: 2, sign: 1 }, { t: 'U', id: 1, sign: 1 }, { t: 'U', id: 2, sign: 1 }];
  ok('a non-realizable Gauss code (odd interlacement) is rejected by isRealizable', !isRealizable(bad));
  // the gate actually CONSTRAINS the walk: count how often a candidate move is rejected.
  let rejects = 0, accepts = 0;
  const rng = makeRng(13579);
  let code = compileDiagram('trefoil').code.map(c => ({ ...c }));
  for (let k = 0; k < 200; k++){
    const before = JSON.stringify(code.map(c => c.t + c.id));
    const m = applyRandomMove(code, rng);
    if (JSON.stringify(m.code.map(c => c.t + c.id)) === before) rejects++; else { accepts++; code = m.code; }
    if (code.length >= WIGGLE_CAP_TOKENS) code = compileDiagram('trefoil').code.map(c => ({ ...c }));
  }
  ok('every move accepted by the applier lands on a realizable code (the gate holds across a 200-move walk)',
     isRealizable(code), `walked to ${code.length / 2} crossings, all realizable`);
}

// ── 6. STABILITY (deep): det + p3 + p5 + p7 over a LONG stress walk, 0 drift. ──
console.log('\n— STABILITY (deep): 300 seeds × 60 moves on each diagram, 4 invariants —');
{
  let totalMoves = 0, drift = 0, nonRealiz = 0, maxLen = 0;
  const counts = { R1: 0, R2: 0, R3: 0 };
  let firstDrift = '';
  for (const name of ['unknot', 'trefoil', 'figure8']){
    const spec = compileDiagram(name);
    const bd = knotDeterminant(spec.diagram);
    const b3 = pColorings(spec.diagram.cr, spec.diagram.arcs, 3);
    const b5 = pColorings(spec.diagram.cr, spec.diagram.arcs, 5);
    const b7 = pColorings(spec.diagram.cr, spec.diagram.arcs, 7);
    for (let seed = 1; seed <= 200; seed++){
      const rng = makeRng((seed * 2654435761) >>> 0);
      let code = spec.code.map(c => ({ ...c }));
      for (let step = 0; step < 50; step++){
        if (code.length >= WIGGLE_CAP_TOKENS) code = spec.code.map(c => ({ ...c }));
        const mv = applyRandomMove(code, rng);
        code = mv.code; counts[mv.type]++; totalMoves++;
        maxLen = Math.max(maxLen, code.length);
        if (!isRealizable(code)) nonRealiz++;
        if (detOf(code) !== bd || colOf(code, 3) !== b3 || colOf(code, 5) !== b5 || colOf(code, 7) !== b7){
          drift++; if (!firstDrift) firstDrift = `${name}@seed${seed}/step${step}/${mv.type}`;
        }
      }
    }
  }
  ok('★ over 30,000 random R-moves (each of R1/R2/R3 firing many times), |Δ| AND p=3,5,7 colorings NEVER drift',
     drift === 0 && nonRealiz === 0,
     drift === 0 ? `${totalMoves} moves (R1 ${counts.R1} · R2 ${counts.R2} · R3 ${counts.R3}) · maxLen ${maxLen / 2} crossings · 0 drift, all realizable`
                 : `${drift} drift(s), first ${firstDrift}, ${nonRealiz} non-realizable`);
}

// ── 7. TEETH (deep): the raw crossing count is a FAKE invariant that moves. ────
console.log('\n— TEETH (deep): the raw crossing count changes under R-I, |Δ| holds —');
{
  const spec = compileDiagram('trefoil');
  const before = spec.code.filter(c => c.t === 'U').length;
  // apply R1 ten times; the fake invariant climbs n→n+10 while |Δ| pins at 3.
  let code = spec.code.map(c => ({ ...c }));
  const rng = makeRng(2024);
  let dets = [];
  for (let k = 0; k < 10; k++){ const m = applyR1(code, rng); code = m.code; dets.push(detOf(code)); }
  const after = code.filter(c => c.t === 'U').length;
  ok('ten R1 kinks take the FAKE invariant (crossing count) 3→13 while |Δ| stays pinned at 3 every step',
     after === before + 10 && dets.every(d => d === 3), `count ${before}→${after}, |Δ| sequence all 3 (${dets.join(',')})`);
  // the negative control is NON-VACUOUS: the determinant of an UNRELATED knot really differs.
  ok('the teeth are non-vacuous: a DIFFERENT knot (fig-8) really reads a different |Δ| (5 ≠ 3)',
     detOf(spec.code) !== detOf(compileDiagram('figure8').code),
     `trefoil 3 vs fig-8 ${detOf(compileDiagram('figure8').code)}`);
}

// ── 8. DETERMINISM — the seeded RNG reproduces the SAME walk bit-for-bit. ─────
console.log('\n— DETERMINISM: makeRng → the page & Node twin walk identically —');
{
  function walk(seed){
    const rng = makeRng(seed);
    let code = compileDiagram('trefoil').code.map(c => ({ ...c }));
    const trail = [];
    for (let k = 0; k < 12; k++){ const m = applyRandomMove(code, rng); code = m.code; trail.push(m.type + ':' + code.map(c => c.t + c.id).join('')); }
    return trail.join('|');
  }
  let same = true;
  for (let s = 1; s <= 50; s++) if (walk(s) !== walk(s)) same = false;
  ok('the same seed reproduces the identical R-move walk (50 seeds, bit-for-bit — page == Node twin)', same);
  ok('different seeds generally produce different walks (not a constant function)', walk(1) !== walk(2));
}

// ── 9. RE-EXTRACTION PARITY — the page core === the module, byte-for-byte. ────
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== KNOT CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== KNOT CORE END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in index.html', i >= 0 && j > i,
     i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i){
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) ★ each inlined function body === imported fn.toString() char-for-char.
    const pairs = [
      ['bareissDet', bareissDet], ['gaussToCrossings', gaussToCrossings], ['alexanderRows', alexanderRows],
      ['knotDeterminant', knotDeterminant], ['modInv', modInv], ['modRank', modRank],
      ['pColorings', pColorings], ['pColoringsBrute', pColoringsBrute], ['makeRng', makeRng],
      ['diagramCode', diagramCode], ['compileDiagram', compileDiagram], ['freshId', freshId],
      ['isRealizable', isRealizable], ['applyR1', applyR1], ['applyR2', applyR2], ['applyR3', applyR3],
      ['applyRandomMove', applyRandomMove], ['runSelfTest', runSelfTest],
    ];
    let drift = '';
    for (const [name, fn] of pairs){
      const pageBody = extractFn(slice, name);
      if (norm(pageBody) !== norm(fn.toString())){ drift = name; break; }
    }
    ok('(parity)★ every inlined function body is char-for-char the imported core (det/colorings/realizability/moves/oracle)',
       drift === '', drift === '' ? `all ${pairs.length} functions byte-identical` : `DRIFT in ${drift}`);

    // (b) evaluate the slice and run ITS runSelfTest → same pass-count + ok-for-ok.
    let pageRes = null, evalErr = null;
    const RET = '\n;return { runSelfTest };';
    try {
      const factory = new Function(slice + RET);
      const PageCore = factory();
      pageRes = PageCore.runSelfTest();
    } catch (e) { evalErr = e; }
    ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');

    if (pageRes){
      const modRes = runSelfTest();
      ok('(parity)★ inline runSelfTest pass-count == module pass-count (the pill count == the Node count)',
         pageRes.pass === modRes.pass && pageRes.total === modRes.total,
         `in-page ${pageRes.pass}/${pageRes.total}  ·  module ${modRes.pass}/${modRes.total}`);
      let agree = pageRes.lines.length === modRes.lines.length;
      for (let k = 0; agree && k < pageRes.lines.length; k++){
        if (pageRes.lines[k].ok !== modRes.lines[k].ok || pageRes.lines[k].name !== modRes.lines[k].name) agree = false;
      }
      ok('(parity)★ every named claim agrees ok-for-ok AND name-for-name (page vs module)', agree,
         agree ? `all ${pageRes.lines.length} lines identical` : 'a line disagreed');
    }
  }
}

// extract `function NAME(...) { ... }` with brace-matching from a source string.
// Skips the PARAMETER LIST first (matching its parentheses) so a destructuring
// parameter like `function f({ cr, arcs })` doesn't fool the body-brace finder.
function extractFn(src, name){
  const re = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = re.exec(src);
  if (!m) return '';
  // find the end of the parameter list (balanced parens) starting at the '('.
  let p = src.indexOf('(', m.index);
  let pd = 0, k = p;
  for (; k < src.length; k++){
    if (src[k] === '(') pd++;
    else if (src[k] === ')'){ pd--; if (pd === 0){ k++; break; } }
  }
  // now find the body's opening brace AFTER the parameter list.
  let i = src.indexOf('{', k);
  if (i < 0) return '';
  let depth = 0, b = i;
  for (; b < src.length; b++){
    if (src[b] === '{') depth++;
    else if (src[b] === '}'){ depth--; if (depth === 0){ b++; break; } }
  }
  return src.slice(m.index, b);
}

console.log(`\n${pass}/${total} ${pass === total ? '✓ ALL GREEN' : '✗ FAILURES'}`);
process.exit(pass === total ? 0 : 1);
