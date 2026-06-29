// Schelling's Tipping Town — Node cross-check (the falsifiability twin of core.mjs).
//   (a) runs the shared runSelfTest() at a HEAVIER town (bigger grids, same bands);
//   (b) adds INDEPENDENT re-derivations NOT routed through the core's own helpers:
//       the Φ ceiling E=4WH−3W−3H+2 vs a hand brute-count of Moore-8 cell-pairs over a
//       size sweep; a from-scratch brute Φ (same-colour adjacent pairs) vs potential();
//       the single-move potential identity ΔΦ===b′−a re-measured with a brute Φ before/
//       after each move (incl. adjacent u,v); and the satisfied-swap monotone climb
//       re-checked against a brute Φ stepped by hand to halt;
//   (c) the integration crux — RE-EXTRACTS the inlined core from index.html, asserts it
//       is char-for-char the export-stripped core.mjs body, evals it (new Function), runs
//       ITS runSelfTest, and asserts pass-count + every named check agree ok-for-ok.
//   There is NO cross-wing import in core.mjs, so page-core === module-core IS the parity.
import * as Core from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const { EMPTY, A, B, makeTown, stepOnce, runToHalt, potential, segregationIndex, edgeCount } = Core;

let pass = 0, total = 0;
function ok(name, cond, info = '') {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('The Conservatory · Schelling’s Tipping Town — Node cross-check\n');

// ── 1. the shared core self-test (identical assertions to the in-page pill), HEAVIER ──
console.log('— shared runSelfTest({W:56,satW:44}) (same assertions the in-page pill runs, bigger towns) —');
let moduleRes;
{
  moduleRes = Core.runSelfTest({ W: 56, satW: 44 });
  for (const c of moduleRes.checks) ok(c.name, c.pass, c.info);
}

// ── 2. INDEPENDENT re-derivations (hand-built, NOT through the core's edgeCount/potential) ──
console.log('\n— independent re-derivations (from-scratch brute counts, NOT the core helpers) —');

// an INDEPENDENT Moore-8 neighbour builder (a different loop order than buildNeighbours).
function bruteNB(W, H) {
  const NB = new Array(W * H);
  for (let idx = 0; idx < W * H; idx++) {
    const x = idx % W, y = (idx / W) | 0, list = [];
    for (let oy = y - 1; oy <= y + 1; oy++) for (let ox = x - 1; ox <= x + 1; ox++) {
      if (ox === x && oy === y) continue;
      if (ox < 0 || oy < 0 || ox >= W || oy >= H) continue;
      list.push(oy * W + ox);
    }
    NB[idx] = list;
  }
  return NB;
}

// (a) Φ CEILING E — brute count of Moore-8 unordered cell-pairs (Σ degree / 2) equals the
//     closed form 4WH−3W−3H+2 AND the core's edgeCount, over a size sweep.
{
  let formOK = true, coreOK = true, where = '';
  for (const [W, H] of [[2, 2], [3, 5], [5, 5], [7, 4], [10, 13], [30, 30], [56, 44]]) {
    const NB = bruteNB(W, H);
    let deg = 0; for (let i = 0; i < W * H; i++) deg += NB[i].length;
    const brute = deg / 2;                       // each adjacency counted from both ends
    const closed = 4 * W * H - 3 * W - 3 * H + 2;  // hand-typed formula (NOT edgeCount)
    if (brute !== closed) { formOK = false; where = W + 'x' + H + ' brute=' + brute + ' closed=' + closed; }
    if (brute !== edgeCount(W, H)) { coreOK = false; where = W + 'x' + H + ' brute=' + brute + ' edgeCount=' + edgeCount(W, H); }
  }
  ok('(re-derive)★ Φ ceiling E === brute Moore-8 pair count === edgeCount() over a size sweep',
     formOK && coreOK, formOK && coreOK ? 'closed form 4WH−3W−3H+2 matches brute & edgeCount on 7 grids' : where);
}

// a from-scratch brute Φ: total same-colour Moore-8 adjacent UNORDERED pairs (count ordered, halve).
function brutePhi(grid, NB) {
  let ord = 0;
  for (let i = 0; i < grid.length; i++) { const c = grid[i]; if (c === EMPTY) continue;
    const nb = NB[i]; for (let k = 0; k < nb.length; k++) if (grid[nb[k]] === c) ord++; }
  return ord / 2;
}

// (b) brute Φ === potential() over many random grids of varied size/mix/empties.
{
  let worst = 0, where = '';
  let s = 0x1234abcd >>> 0;
  const rng = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  for (let trial = 0; trial < 400; trial++) {
    const W = 4 + ((rng() * 14) | 0), H = 4 + ((rng() * 14) | 0), NB = bruteNB(W, H);
    const ef = 0.05 + rng() * 0.3, mix = 0.2 + rng() * 0.6;
    const g = new Int8Array(W * H);
    for (let i = 0; i < g.length; i++) g[i] = rng() < ef ? EMPTY : (rng() < mix ? A : B);
    const d = Math.abs(brutePhi(g, NB) - potential(g, NB));
    if (d > worst) { worst = d; where = W + 'x' + H; }
  }
  ok('(re-derive)★ from-scratch brute Φ === potential() over 400 random grids', worst === 0,
     worst === 0 ? 'exact to the integer (every grid)' : 'VIOLATED by ' + worst + ' @ ' + where);
}

// (c) SINGLE-MOVE IDENTITY re-measured with brute Φ — for thousands of random single
//     relocations (incl. adjacent u,v), brute(after) − brute(before) === b′ − a EXACTLY.
{
  let worst = 0, trials = 0, adj = 0, where = '';
  let s = 0x77f0c3a1 >>> 0;
  const rng = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  for (let t = 0; t < 6000; t++) {
    const W = 8 + ((rng() * 8) | 0), H = 8 + ((rng() * 8) | 0), NB = bruteNB(W, H);
    const g = new Int8Array(W * H), occ = [], emp = [];
    for (let i = 0; i < g.length; i++) { const r = rng(); g[i] = r < 0.16 ? EMPTY : (r < 0.58 ? A : B); (g[i] === EMPTY ? emp : occ).push(i); }
    if (!occ.length || !emp.length) continue;
    const u = occ[(rng() * occ.length) | 0], v = emp[(rng() * emp.length) | 0], c = g[u];
    // a = #like occupied neighbours of u; b′ = #like occupied neighbours of v ignoring u
    let a = 0; { const nb = NB[u]; for (let k = 0; k < nb.length; k++) if (g[nb[k]] === c) a++; }
    let bp = 0; { const nb = NB[v]; for (let k = 0; k < nb.length; k++) { const jn = nb[k]; if (jn === u) continue; if (g[jn] === c) bp++; } }
    const before = brutePhi(g, NB);
    g[v] = c; g[u] = EMPTY;
    const after = brutePhi(g, NB);
    const e = Math.abs((after - before) - (bp - a));
    if (NB[u].includes(v)) adj++;
    if (e > worst) { worst = e; where = W + 'x' + H; }
    trials++;
  }
  ok('(re-derive)★ single-move ΔΦ === b′−a by brute Φ over ' + trials + ' moves (' + adj + ' adjacent u,v)',
     worst === 0, worst === 0 ? 'exact to the integer (incl. adjacent u,v)' : 'VIOLATED by ' + worst + ' @ ' + where);
}

// (d) SATISFIED-SWAP monotone climb re-checked with brute Φ — step a satisfied town by
//     hand to halt and assert brute Φ never decreases AND lands ≤ E, independent of the
//     core's own strictlyIncreasing flag.
{
  let allOK = true, where = '';
  for (const seed of [11, 22, 33, 44]) {
    const town = makeTown({ W: 26, H: 26, tol: Core.P.TOL_DEFAULT, rule: 'satisfied', seed });
    let prev = brutePhi(town.grid, town.NB), guard = 0, ndrop = 0;
    while (!town.halted && guard < 400000) {
      const r = stepOnce(town); guard++;
      if (r.kind === 'halt') break;
      if (r.kind === 'move') { const now = brutePhi(town.grid, town.NB); if (now < prev) ndrop++; prev = now; }
    }
    const E = edgeCount(26, 26);
    if (ndrop !== 0 || !town.halted || prev > E) { allOK = false; where = 'seed=' + seed + ' drops=' + ndrop + ' halted=' + town.halted + ' Φ=' + prev + ' E=' + E; }
  }
  ok('(re-derive)★ satisfied-swap brute Φ non-decreasing to halt & ≤ E (independent of the core flag)',
     allOK, allOK ? 'four seeds: brute Φ never dropped, all halted, Φ ≤ E' : where);
}

// determinism, independently: two makeTown+runToHalt sequences byte-identical settle.
{
  function runOnce() {
    const town = makeTown({ W: 30, H: 30, tol: Core.P.TOL_DEFAULT, rule: 'random', seed: 24680 });
    const r = runToHalt(town, {});
    return r.moves + '|' + r.sweeps + '|' + Array.from(town.grid).join('');
  }
  ok('(determinism)★ identical {W,H,tol,seed} ⇒ byte-identical settled grid + move count',
     runOnce() === runOnce(), 'two full runs byte-identical');
}

// ── 3. THE RE-EXTRACTION PARITY HARNESS (the integration crux) ─────────────────────
//   Read index.html, slice the inline core between the SCHELLING CORE sentinels, assert
//   it is char-for-char the export-stripped module body (from the KMARK to the END
//   sentinel), eval it (new Function factory), run ITS runSelfTest and assert pass-count
//   and every named check agree.
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core (byte-twin) —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== SCHELLING CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END SCHELLING CORE =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core sentinels present in index.html', i >= 0 && j > i,
     i >= 0 && j > i ? 'slice is ' + (j - i) + ' chars' : 'MISSING SENTINELS — has forge built index.html?');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);

    // the slice must be PURE core — no ws breadcrumb / WS. / forge directive leakage.
    ok('the byte-twin slice contains no breadcrumb / WS. / forge directive leakage',
       !/ws:seen:/.test(slice) && !/\bWS\./.test(slice) && !/forge:include/.test(slice) && !/localStorage/.test(slice),
       'core slice is pure — breadcrumb + ws.js include sit outside the sentinels');

    // (0-teeth)★ BYTE-IDENTITY: the inline slice is char-for-char the module's body (from
    //   the KMARK to the END sentinel, every leading `export ` removed).
    const modSrc = readFileSync(join(__dir, 'core.mjs'), 'utf8');
    const KMARK = '// P — the SINGLE source of truth';
    const k = modSrc.indexOf(KMARK), me = modSrc.indexOf(END);
    const modBody = modSrc.slice(k, me).replace(/^export /gm, '').trim();
    ok('(0-teeth)★ inline core slice is char-for-char the export-stripped core.mjs body',
       slice.trim() === modBody,
       slice.trim() === modBody ? 'identical bytes (' + modBody.length + ' chars)' :
       'DRIFT: slice ' + slice.trim().length + ' vs module ' + modBody.length + ' chars');

    let pageRes = null, evalErr = null, PageCore = null;
    try {
      const factory = new Function(slice +
        '\n;return { runSelfTest, makeTown, stepOnce, runToHalt, metrics, segregationIndex, potential, edgeCount, likeFraction, P, EMPTY, A, B };');
      PageCore = factory();
      pageRes = PageCore.runSelfTest({ W: 56, satW: 44 });

      // the page core's shared formulas must match the module's, value-for-value.
      const eSame = PageCore.edgeCount(42, 42) === Core.edgeCount(42, 42);
      const t = makeTown({ W: 20, H: 20, tol: Core.P.TOL_DEFAULT, rule: 'random', seed: 7 });
      const pIdxSame = PageCore.segregationIndex(t.grid, t.NB) === Core.segregationIndex(t.grid, t.NB);
      const pPhiSame = PageCore.potential(t.grid, t.NB) === Core.potential(t.grid, t.NB);
      const psSame = PageCore.P.SEG_SETTLE_MIN === Core.P.SEG_SETTLE_MIN && PageCore.P.TOL_DEFAULT === Core.P.TOL_DEFAULT;
      ok('(parity)★ page core formulas === module core formulas (edgeCount/segregationIndex/potential/P)',
         eSame && pIdxSame && pPhiSame && psSame,
         eSame && pIdxSame && pPhiSame && psSame ? 'every shared formula returns the identical value' : 'a formula drifted');
    } catch (e) { evalErr = e; }

    ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');
    if (pageRes) {
      ok('(parity)★ inline core pass-count == module pass-count',
         pageRes.pass === moduleRes.pass && pageRes.total === moduleRes.total,
         'in-page ' + pageRes.pass + '/' + pageRes.total + '  ·  module ' + moduleRes.pass + '/' + moduleRes.total);
      let agree = pageRes.checks.length === moduleRes.checks.length;
      for (let m = 0; agree && m < pageRes.checks.length; m++) {
        if (pageRes.checks[m].pass !== moduleRes.checks[m].pass) agree = false;
        if (pageRes.checks[m].name !== moduleRes.checks[m].name) agree = false;
      }
      ok('(parity)★ every named assertion agrees ok-for-ok (page vs module)', agree,
         agree ? 'all ' + pageRes.checks.length + ' checks identical' : 'a check disagreed');

      console.log('\n  ▸ RECORDED: in-page ' + pageRes.pass + '/' + pageRes.total + ' · Node module ' + moduleRes.pass + '/' + moduleRes.total);
    }
  }
}

console.log('\n' + pass + '/' + total + ' ' + (pass === total ? '✓ ALL GREEN' : '✗ FAILURES'));
process.exit(pass === total ? 0 : 1);
