// ============================================================================
//  Node-side falsifiability harness for The Tangle Bench — a writhing strand & the
//  knot it earns. Runs the shared in-page self-test runSelfTest() (the SAME claims
//  the page pill runs), PLUS deeper Node-only assertions (the detector parity end-to-
//  end, the braid-closure specimens, the entropy monotonicity with disjoint Wilson,
//  the neg-control, the teeth, the clock-free replay), THEN re-extracts the inlined
//  TANGLE-CORE slice from index.html between the sentinels and proves it byte-for-byte
//  the SAME core (parity — the estate standard), AND that the page's in-page
//  runSelfTest pass-count == the module's, ok-for-ok, name-for-name.
//
//  COUPLING (the deliberate seam): tangle-core.mjs IMPORTS the shared knot math
//  (gaussToCrossings / knotDeterminant / isRealizable / diagramCode / makeRng) from
//  the sibling knot-tabulator/knot-core.mjs — the single authority, not duplicated.
//  So the in-page byte-twin inlines ONLY the detector + sim + braid harness + oracle
//  between the sentinels, while the page imports knot-core.mjs as a module for the
//  shared math. The parity test below checks (a) the slice char-for-char, (b) that the
//  shared math is the IMPORT, and (c) that the slice does NOT redefine the seam.
//  Run:  node tangle-core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  segInt, crossingSign, geomToGauss, closeArc, detLive, refPolyline,
  braidGauss, randomWord, runTrial, cohortSeeds, cohortP, wilson,
  countCrossingsFake, constantPFake, makeWorld, runSelfTest,
} from './tangle-core.mjs';
import { knotDeterminant, gaussToCrossings, isRealizable, diagramCode } from '../knot-tabulator/knot-core.mjs';
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

console.log('The Tangle Bench — tangle-core.test.mjs\n');

// ── 1. THE SHARED IN-PAGE SELF-TEST (the same claims the pill runs) ────────────
console.log('— shared runSelfTest() (the SAME claims the in-page pill runs) —');
{
  const st = runSelfTest();
  for (const l of st.lines) ok('[self-test] ' + l.name, l.ok, l.detail);
  ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);
}

// ── 2. THE DETECTOR PARITY end-to-end (the geometry road === the Tabulator). ──
console.log('\n— detector parity: detLive(reference) === knotDeterminant(diagramCode) —');
{
  for (const [name, lit] of [['unknot', 1], ['trefoil', 3], ['figure8', 5]]){
    const ref = refPolyline(name);
    const geom = detLive(ref.pts, ref.z).det;
    const comb = knotDeterminant(gaussToCrossings(diagramCode(name).code));
    ok(`${name}: geometry road |Δ|=${geom} === combinatorial authority |Δ|=${comb} === literature ${lit}`,
       geom === comb && geom === lit, `geom ${geom} · comb ${comb} · lit ${lit}`);
  }
}

// ── 3. THE BRAID-CLOSURE SPECIMENS — the harness's exact construction. ────────
console.log('\n— braid closures: σ1^3 → trefoil(3), σ1^5 → cinquefoil(5), σ1 → unknot(1) —');
{
  const det = w => { const r = braidGauss(2, w); return r.single ? knotDeterminant(gaussToCrossings(r.code)) : 'link'; };
  ok('the empty braid on 2 strands closes to the unknot (|Δ|=1)', det([]) === 1, `|Δ|=${det([])}`);
  ok('σ1 on 2 strands closes to the unknot (|Δ|=1) — one crossing, a trivial kink', det([1]) === 1, `|Δ|=${det([1])}`);
  ok('σ1^3 on 2 strands closes to the TREFOIL (|Δ|=3)', det([1, 1, 1]) === 3, `|Δ|=${det([1, 1, 1])}`);
  ok('σ1^5 on 2 strands closes to the CINQUEFOIL 5_1 (|Δ|=5)', det([1, 1, 1, 1, 1]) === 5, `|Δ|=${det([1, 1, 1, 1, 1])}`);
  const r3 = braidGauss(3, [1, 2, 1, 2]); // (σ1σ2)^2 on 3 strands → trefoil
  ok('(σ1σ2)^2 on 3 strands closes to a single-component knot with |Δ|=3', r3.single && knotDeterminant(gaussToCrossings(r3.code)) === 3,
     `single=${r3.single} |Δ|=${r3.single ? knotDeterminant(gaussToCrossings(r3.code)) : 'link'}`);
  const link = braidGauss(2, [1, 1]); // σ1^2 → Hopf link (2 components)
  ok('σ1^2 on 2 strands closes to a 2-component LINK (not a single knot) — correctly flagged not-single', !link.single, `single=${link.single}`);
}

// ── 4. ENTROPY MONOTONICITY (deep): the full n=3 P-vs-A row + disjoint Wilson. ─
console.log('\n— entropy monotonicity: n=3 P-vs-A non-decreasing, calm vs shaken Wilson disjoint —');
{
  const As = [0, 3, 8, 20, 50, 80];
  const row = As.map(A => cohortP(3, A, 200));
  let mono = true;
  for (let i = 1; i < row.length; i++) if (row[i].p < row[i - 1].p - 0.05) mono = false;
  ok('the n=3 P-vs-A row is non-decreasing (τ=0.05)', mono, `P ${row.map(r => r.p.toFixed(2)).join('→')}`);
  const lo = row[0], hi = row[row.length - 1];
  const wLo = wilson(lo.k, lo.n), wHi = wilson(hi.k, hi.n);
  ok('P(A=80) − P(A=0) ≥ 0.6 with NON-OVERLAPPING Wilson 95% intervals',
     (hi.p - lo.p) >= 0.6 && wHi[0] > wLo[1],
     `gap ${(hi.p - lo.p).toFixed(3)} · lo [${wLo[0].toFixed(3)},${wLo[1].toFixed(3)}] hi [${wHi[0].toFixed(3)},${wHi[1].toFixed(3)}]`);
}

// ── 5. NEG-CONTROL (deep): every A=0 trial is the bare unknot. ────────────────
console.log('\n— neg-control: the A=0 cohort is provably 100% the unknot —');
{
  let allUnknot = true, n = 0;
  for (const s of cohortSeeds(200)){ const r = runTrial(3, 0, s); n++; if (r.knotted || (r.single && r.det !== 1)) allUnknot = false; }
  const nc = cohortP(3, 0, 200);
  ok('A=0: P(knot)=0 and every one of 200 trials is the unknot (det≡1) — entropy needs room to act',
     nc.p === 0 && allUnknot, `P=${nc.p} · ${n} trials all det≡1=${allUnknot}`);
}

// ── 6. THE TEETH — the crossing-count fake + the constant-P fake both caught. ─
console.log('\n— the teeth: crossing-count fake on the disguise + constant-P fake on the trend —');
{
  const dis = refPolyline('disguise');
  const d = detLive(dis.pts, dis.z);
  ok('the disguised unknot has projected crossings (the fake screams) yet real |Δ|=1 — crossing-count is NO invariant',
     countCrossingsFake(d) === true && d.det === 1 && d.ncross > 0, `ncross ${d.ncross} · fake "KNOTTED" · real |Δ|=${d.det}`);
  const fakeRow = [0, 3, 8, 20, 50, 80].map(A => constantPFake(3, A));
  const flat = fakeRow.every(p => p === fakeRow[0]);
  ok('the constant-P fake is flat (gap 0) — it FAILS the monotonicity claim, so the trend is not a harness artifact',
     flat && (constantPFake(3, 80) - constantPFake(3, 0)) < 0.6, `fake row all ${fakeRow[0]} · gap 0`);
}

// ── 7. CLOCK-FREE REPLAY — the sim is byte-identical under the same seed/schedule. ─
console.log('\n— clock-free replay: same seed + schedule ⟹ byte-identical strand —');
{
  const sched = w => { for (let f = 0; f < 40; f++){ w.shake(1.5, 7); w.tick(); } w.stopShake(); for (let f = 0; f < 15; f++) w.tick(); };
  const a = makeWorld(2024, 48); sched(a); const pa = a.openPoly();
  const b = makeWorld(2024, 48); sched(b); const pb = b.openPoly();
  let same = pa.length === pb.length; for (let i = 0; same && i < pa.length; i++) if (pa[i] !== pb[i]) same = false;
  ok('makeWorld(2024,48) ticked 600× replays byte-identical — clock-free determinism', same, `${pa.length / 2} beads, every coordinate ===`);
  // the closure is a valid closed polyline the detector can read without throwing
  const cl = a.closed();
  const code = geomToGauss(cl.pts, cl.z);
  ok('the live strand closure produces a Gauss code the detector reads (realizable or a held transient)',
     Array.isArray(code), `closure → ${code.length / 2} crossings, realizable=${isRealizable(code)}`);
  // PULL-TIGHT moves the two FIXED handle beads
  const before = [a.openPoly()[0], a.openPoly()[1]];
  a.pullTight(1); a.pullTight(1); a.pullTight(1);
  const after = [a.openPoly()[0], a.openPoly()[1]];
  ok('PULL-TIGHT cinches the two fixed handle beads (indices 0 and N-1)', a.handles[0] === 0 && a.handles[1] === 47 && (before[0] !== after[0] || before[1] !== after[1]),
     `handles [${a.handles.join(',')}] · bead0 moved ${(before[0] !== after[0] || before[1] !== after[1])}`);
}

// ── 8. RE-EXTRACTION PARITY — the page tangle-core === the module, byte-for-byte,
//      AND the shared math is an IMPORT (not duplicated in the page). ───────────
console.log('\n— RE-EXTRACTION PARITY: the page tangle-core === the module core —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== TANGLE CORE BEGIN =====';
  const END = '// ===== TANGLE CORE END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline tangle-core banner sentinels present in index.html', i >= 0 && j > i,
     i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  // the shared math must be the IMPORT, not re-inlined.
  ok('the page imports the shared knot math from ../knot-tabulator/knot-core.mjs (single authority, not duplicated)',
     /import\s*\{[^}]*\}\s*from\s*['"]\.\.\/knot-tabulator\/knot-core\.mjs['"]/.test(html),
     'shared math is an import');
  const sliceForDup = i >= 0 ? html.slice(i, j) : '';
  ok('the tangle-core slice does NOT redefine the shared math (no `function knotDeterminant`/`function gaussToCrossings` in the twin)',
     !/function\s+knotDeterminant\s*\(/.test(sliceForDup) && !/function\s+gaussToCrossings\s*\(/.test(sliceForDup),
     'shared math not duplicated in the byte-twin');

  if (i >= 0 && j > i){
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) ★ each inlined function body === imported fn.toString() char-for-char.
    const pairs = [
      ['segInt', segInt], ['crossingSign', crossingSign], ['geomToGauss', geomToGauss],
      ['closeArc', closeArc], ['detLive', detLive], ['refPolyline', refPolyline],
      ['braidGauss', braidGauss], ['randomWord', randomWord], ['runTrial', runTrial],
      ['cohortSeeds', cohortSeeds], ['cohortP', cohortP], ['wilson', wilson],
      ['countCrossingsFake', countCrossingsFake], ['constantPFake', constantPFake],
      ['makeWorld', makeWorld], ['runSelfTest', runSelfTest],
    ];
    let drift = '';
    for (const [name, fn] of pairs){
      const pageBody = extractFn(slice, name);
      if (norm(pageBody) !== norm(fn.toString())){ drift = name; break; }
    }
    ok('(parity)★ every inlined tangle function body is char-for-char the imported core (detector/sim/braid harness/oracle)',
       drift === '', drift === '' ? `all ${pairs.length} functions byte-identical` : `DRIFT in ${drift}`);

    // (b) evaluate the slice (with the shared math injected, as the page provides it
    // via the import) and run ITS runSelfTest → same pass-count + ok-for-ok.
    let pageRes = null, evalErr = null;
    const HEAD =
      'const {gaussToCrossings,knotDeterminant,isRealizable,diagramCode,makeRng}=__shared__;\n';
    const RET = '\n;return { runSelfTest };';
    try {
      const shared = await import('../knot-tabulator/knot-core.mjs');
      const factory = new Function('__shared__', HEAD + slice + RET);
      const PageCore = factory(shared);
      pageRes = PageCore.runSelfTest();
    } catch (e) { evalErr = e; }
    ok('the inline tangle core evaluates with the shared math injected (mirroring the page import)', !evalErr,
       evalErr ? String(evalErr) : 'ok');

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
// Skips the PARAMETER LIST first (matching its parentheses) so a destructuring or
// defaulted parameter doesn't fool the body-brace finder.
function extractFn(src, name){
  const re = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = re.exec(src);
  if (!m) return '';
  let p = src.indexOf('(', m.index);
  let pd = 0, k = p;
  for (; k < src.length; k++){
    if (src[k] === '(') pd++;
    else if (src[k] === ')'){ pd--; if (pd === 0){ k++; break; } }
  }
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
