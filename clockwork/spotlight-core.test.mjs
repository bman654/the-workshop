// ============================================================================
//  Node-side falsifiability harness for The Spotlight Rig (the attention bench).
//  Runs the shared in-page self-test, adds deeper Node-only assertions the pill
//  can't afford — INCLUDING a cross-check of the in-hull verdict against the
//  estate's already-audited convex-hull/core.mjs (containsAll/canon/cross) on a
//  2-D fixture, so claim 2/3 ride on real geometry, not just this file's copy —
//  THEN re-extracts the inlined core from spotlight.html and proves it is
//  byte-for-byte the SAME core (parity), exactly like the sibling wing tests.
//  Run:  node spotlight-core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  KEY_WORDS, D, SQRT_D, GENESIS, SQRTD_RANGE, LANE,
  softmax, makeRng, logits, weights, blend, cross, hull, inHull, solve, clampLane,
  runSelfTest,
} from './spotlight-core.mjs';
// the REAL, already-audited geometry oracle (a different file, different author):
import { containsAll, canon, cross as chCross } from '../convex-hull/core.mjs';
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

console.log('The Spotlight Rig — spotlight-core.test.mjs\n');

// ── 1. the shared in-page self-test, at a deeper ladder ──────────────────────
console.log('— shared runSelfTest() (the same four claims the in-page pill runs) —');
const st = runSelfTest({ ladder: 96 });
for (const l of st.lines) ok('[self-test] ' + l.name, l.ok, l.detail);
ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);

// ── 2. CLAIM 1 deeper: the 1/√d sits ON the logits (FOCUS is a temperature) ───
console.log('\n— CLAIM 1 (deeper): √d FOCUS warps the weights like the Dial’s temperature —');
{
  const K = GENESIS.keys.map(e => e.k), q = 1.0;
  // small √d (sharp) → one weight dominates; large √d (blurry) → toward uniform.
  // Use the ACTUAL FOCUS travel endpoints, so the assertion reads the live dial.
  const wSharp = weights(q, K, 1 / SQRTD_RANGE.LO, { normalize: true });
  const wBlur = weights(q, K, 1 / SQRTD_RANGE.HI, { normalize: true });
  const n = K.length;
  const maxSharp = Math.max(...wSharp), maxBlur = Math.max(...wBlur);
  const unifGap = Math.max(...wBlur.map(x => Math.abs(x - 1 / n)));
  ok('A. small √d sharpens (one weight dominates), large √d flattens toward 1/|K|',
    maxSharp > 0.85 && maxBlur < 0.5 * maxSharp && unifGap < 0.15,
    `max wᵢ: sharp=${maxSharp.toFixed(4)} (√d=${SQRTD_RANGE.LO}) → blur=${maxBlur.toFixed(4)} (√d=${SQRTD_RANGE.HI}); blur gap to uniform 1/${n}=${unifGap.toFixed(4)}`);

  // monotone: as √d rises across the travel, the max weight falls (focus loosens).
  let viol = 0, prev = Infinity;
  for (let i = 0; i <= 200; i++) {
    const sqrtD = Math.pow(10, Math.log10(SQRTD_RANGE.LO) + (i / 200) * (Math.log10(SQRTD_RANGE.HI) - Math.log10(SQRTD_RANGE.LO)));
    const mx = Math.max(...weights(q, K, 1 / sqrtD, { normalize: true }));
    if (mx > prev + 1e-12) viol++;
    prev = mx;
  }
  ok('A. the max weight is MONOTONE in √d (focus loosens as √d grows — 0 violations over 201 rungs)',
    viol === 0, `${viol} monotone violations`);

  // the needle's destination: sharp → a value gem (a vertex), blur → the centroid.
  // The distance to the centroid must fall MONOTONICALLY as √d rises across the
  // travel (the gaze loosens toward the uniform blend), and end near it.
  const V = GENESIS.keys.map(e => e.v);
  const cent = { x: V.reduce((a, p) => a + p.x, 0) / n, y: V.reduce((a, p) => a + p.y, 0) / n };
  let dViol = 0, prevD = Infinity, dEnd = 0;
  for (let i = 0; i <= 200; i++) {
    const sqrtD = Math.pow(10, Math.log10(SQRTD_RANGE.LO) + (i / 200) * (Math.log10(SQRTD_RANGE.HI) - Math.log10(SQRTD_RANGE.LO)));
    const nb = blend(weights(q, K, 1 / sqrtD, { normalize: true }), V);
    const d = Math.hypot(nb.x - cent.x, nb.y - cent.y);
    if (d > prevD + 1e-12) dViol++;
    prevD = d; dEnd = d;
  }
  ok('A. as √d grows the needle drifts MONOTONICALLY toward the value centroid (the uniform blend)',
    dViol === 0 && dEnd < 0.1, `${dViol} monotone violations · |needle(√d=${SQRTD_RANGE.HI})−centroid|=${dEnd.toFixed(4)}`);
}

// ── 3. CLAIM 2 cross-checked against the REAL convex-hull/core.mjs ────────────
console.log('\n— CLAIM 2 (cross-verified): the in-hull verdict === convex-hull/core.mjs.containsAll —');
{
  // scale the 2-D values to an integer grid so the audited integer-exact
  // containsAll applies; assert my inHull(needle) agrees with containsAll over a
  // √d × q sweep — on the SAME normalized blend — with 0 disagreements.
  const V = GENESIS.keys.map(e => e.v);
  const grid = p => ({ x: Math.round(p.x * 100000), y: Math.round(p.y * 100000) });
  const Vg = V.map(grid);
  const Hg = canon(Vg);
  let tested = 0, disagree = 0, firstBad = '';
  for (let a = 0; a <= 20; a++) {
    for (let b = 0; b <= 20; b++) {
      const sqrtD = SQRTD_RANGE.LO + (a / 20) * (SQRTD_RANGE.HI - SQRTD_RANGE.LO);
      const q = -2 + (b / 20) * 4;
      const s = solve(GENESIS, 1 / sqrtD, { normalize: true, q });
      const mineIn = s.inHull;
      const ng = grid(s.needle);
      const chIn = containsAll(Hg, [...Vg, ng]).ok;   // audited oracle
      tested++;
      if (mineIn !== chIn) { disagree++; if (!firstBad) firstBad = `√d=${sqrtD.toFixed(2)} q=${q.toFixed(2)} mine=${mineIn} ch=${chIn}`; }
    }
  }
  ok('B. inHull(needle) === convex-hull/core.mjs.containsAll over a 21×21 √d×q sweep (normalized path), 0 disagreements',
    tested >= 100 && disagree === 0,
    disagree === 0 ? `${tested} (√d,q) points, my inHull ⇔ the audited containsAll, 0 disagreements` : `${disagree}/${tested} disagree (first ${firstBad})`);

  // and the orientation atom matches: my cross === the convex-hull cross on ints.
  const o = { x: 0, y: 0 }, p = { x: 7, y: 3 }, r = { x: 2, y: 11 };
  ok('B. my cross() === convex-hull/core.mjs.cross() on the integer fixture (same orientation atom)',
    cross(o, p, r) === chCross(o, p, r) && cross(o, p, r) === 71,
    `cross((0,0),(7,3),(2,11)) = ${cross(o, p, r)} (both agree)`);
}

// ── 4. CLAIM 3 deeper: the neg control bites AND the gate is non-vacuous ──────
console.log('\n— CLAIM 3 (deeper): drop the DENOMINATOR → needle flees the cage; the gate is non-vacuous —');
{
  // sweep q at a sharp √d with normalize OFF; assert AT LEAST one config has both
  // Σw≠1 AND the needle outside the hull (cross-verified by containsAll), WHILE
  // the SAME config under the normalized path is Σ=1 AND inside (non-vacuous).
  const V = GENESIS.keys.map(e => e.v);
  const grid = p => ({ x: Math.round(p.x * 100000), y: Math.round(p.y * 100000) });
  const Hg = canon(V.map(grid)), Vg = V.map(grid);
  let escapes = 0, nonVacuous = true, example = '';
  for (let b = 0; b <= 40; b++) {
    const q = -2 + (b / 40) * 4;
    const bad = solve(GENESIS, 1 / 0.30, { normalize: false, q });
    const good = solve(GENESIS, 1 / 0.30, { normalize: true, q });
    const badOutByCh = !containsAll(Hg, [...Vg, grid(bad.needle)]).ok;
    if (Math.abs(bad.sum - 1) > 1e-6 && !bad.inHull && badOutByCh) {
      escapes++;
      if (!example) example = `q=${q.toFixed(2)}: bad Σ=${bad.sum.toFixed(3)} outside; good Σ=1 inside`;
    }
    // every honest config must clear the gate it just caught the saboteur on.
    if (Math.abs(good.sum - 1) > 1e-12 || !good.inHull) nonVacuous = false;
  }
  ok('C. ≥1 dropped-denominator config has Σw≠1 AND the needle outside the hull (cross-verified by containsAll)',
    escapes >= 1, `${escapes} escaping configs over the q sweep · e.g. ${example}`);
  ok('C. NON-VACUOUS: across the WHOLE sweep the CORRECT normalized path is Σ=1 AND in-hull (the gate clears the honest computation)',
    nonVacuous, nonVacuous ? 'every normalized config passes the identical Σ=1 + in-hull gate' : 'a normalized config failed the gate!');

  // the secondary fault: √d→0 (dInv→∞) drives a logit to ±∞ → non-finite weights.
  const blown = solve(GENESIS, 1 / 1e-320, { normalize: true, q: 5 });
  ok('C. √d→0 drives the logits non-finite (the secondary FAULT, flagged)',
    !blown.finite, `weights finite=${blown.finite}`);
}

// ── 5. CLAIM 4 deeper: dropping ONLY the 1/√d is NOT the control (the COPY pin) ─
console.log('\n— CLAIM 4 (deeper): dropping ONLY 1/√d keeps Σw=1 & in-hull (it is the denominator that ejects) —');
{
  // across a q sweep, the UNSCALED-but-NORMALIZED path (dInv=1, denominator kept)
  // must ALWAYS be Σ=1 and in-hull — proving the page copy is true: removing √d
  // does NOT eject; only removing the denominator does.
  let allHome = true, worst = '';
  for (let b = 0; b <= 40; b++) {
    const q = -2 + (b / 40) * 4;
    const u = solve(GENESIS, 1, { normalize: true, q });   // 1/√d removed, denominator kept
    if (Math.abs(u.sum - 1) > 1e-12 || !u.inHull) { allHome = false; worst = `q=${q.toFixed(2)} Σ=${u.sum} in=${u.inHull}`; }
  }
  ok('D. drop-1/√d (keep the denominator): Σw=1 & needle in-hull across the q sweep — removing √d does NOT eject (only the denominator does)',
    allHome, allHome ? 'every unscaled-but-normalized config stays Σ=1 & in-hull' : `violated at ${worst}`);

  // determinism: solve is a pure function of (cfg, dInv, q, normalize).
  const a = solve(GENESIS, 1 / SQRT_D, { normalize: true, q: GENESIS.q });
  const b = solve(GENESIS, 1 / SQRT_D, { normalize: true, q: GENESIS.q });
  ok('D. solve() is deterministic — two calls byte-identical (weights + needle)',
    a.w.every((v, i) => v === b.w[i]) && a.needle.x === b.needle.x && a.needle.y === b.needle.y,
    `needle=(${a.needle.x.toFixed(6)},${a.needle.y.toFixed(6)})`);
}

// ── 6. THE GENESIS is pinned (a model edit must be loud) ──────────────────────
console.log('\n— the frozen genesis literals are pinned —');
{
  ok('E. |K|=6 keys, D=2, √d=√2, the lane + √d travel pinned',
    KEY_WORDS.length === 6 && GENESIS.keys.length === 6 && D === 2 &&
    Math.abs(SQRT_D - Math.SQRT2) < 1e-15 && LANE.LO === -1.25 && LANE.HI === 1.25 &&
    SQRTD_RANGE.LO === 0.18 && SQRTD_RANGE.HI === 6.0,
    `|K|=${KEY_WORDS.length} · D=${D} · √d=${SQRT_D.toFixed(6)} · lane[${LANE.LO},${LANE.HI}] · √d∈[${SQRTD_RANGE.LO},${SQRTD_RANGE.HI}]`);
  // the value gems form a real polygon with interior area (a cage, not a segment).
  const V = GENESIS.keys.map(e => e.v);
  const H = hull(V);
  ok('E. the value gems’ hull is a real polygon (≥3 vertices, with interior area to imprison the needle)',
    H.length >= 3, `hull is a ${H.length}-gon`);
  // clampLane keeps a dragged key on the lane.
  ok('E. clampLane pins a dragged key inside the lane',
    clampLane(99) === LANE.HI && clampLane(-99) === LANE.LO && clampLane(0) === 0,
    `clamp(99)=${clampLane(99)} clamp(-99)=${clampLane(-99)}`);
}

// ── 7. RE-EXTRACTION PARITY — the page core === the module, byte-for-byte ─────
//   Read spotlight.html, slice the inline core between the banner sentinels,
//   prove each function body is char-for-char the imported toString(), eval the
//   slice, run ITS runSelfTest → pass-count + ok-for-ok + name-for-name parity,
//   and spot-check cross-boundary values. (Same shape as the sibling tests.)
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'spotlight.html'), 'utf8');
  const BEGIN = '// ===== SPOTLIGHT CORE (inlined byte-twin of spotlight-core.mjs) BEGIN =====';
  const END = '// ===== SPOTLIGHT CORE END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in spotlight.html', i >= 0 && j > i,
    i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) every named function body is char-for-char the imported toString().
    //     Shared lineage (softmax/makeRng) + the new attention/geometry functions
    //     are ALL proven byte-identical to the .mjs.
    const fns = {
      softmax, makeRng, logits, weights, blend, cross, hull, inHull, solve, clampLane, runSelfTest,
    };
    for (const [name, fn] of Object.entries(fns)) {
      const pageSrc = extractFn(slice, name);
      ok(`(parity)★ inlined ${name}() body is char-for-char the imported ${name}.toString()`,
        norm(pageSrc) === norm(fn.toString()),
        norm(pageSrc) === norm(fn.toString()) ? 'identical bytes' :
          `DRIFT:\n  page: ${JSON.stringify(norm(pageSrc).slice(0, 120))}…\n  mod:  ${JSON.stringify(norm(fn.toString()).slice(0, 120))}…`);
    }

    // (b) the frozen GENESIS is inlined exactly (a model edit can't drift the page
    //     from the proof). Read the GENESIS literal block from the .mjs SOURCE
    //     (not a reserialization — JS would drop `-1.00`→`-1`) and prove every one
    //     of those source lines appears verbatim in the page slice.
    const moduleSrc = readFileSync(join(__dir, 'spotlight-core.mjs'), 'utf8');
    const gBeg = moduleSrc.indexOf('export const GENESIS = {');
    const gEnd = moduleSrc.indexOf('};', gBeg);
    const genesisRows = moduleSrc.slice(gBeg, gEnd)
      .split('\n').map(s => s.trim()).filter(s => s.startsWith('{ k:') || s.startsWith('q:'));
    const allRowsPresent = genesisRows.length >= 6 && genesisRows.every(row => slice.includes(row));
    ok('(parity)★ every GENESIS row (q + the 6 key/value literals) string-matches the .mjs source in the page slice',
      allRowsPresent && slice.includes("KEY_WORDS = ['the', 'cat', 'sat', 'on', 'mat', 'moon']") && slice.includes('D = 2'),
      allRowsPresent ? `all ${genesisRows.length} genesis rows + KEY_WORDS + D present verbatim` : 'a genesis row drifted');

    // (c) evaluate the slice and run ITS runSelfTest → full parity.
    let pageRes = null, evalErr = null, PageCore = null;
    const RET = '\n;return { runSelfTest, softmax, makeRng, logits, weights, blend, cross, hull, inHull, solve, clampLane, GENESIS, KEY_WORDS, D, SQRT_D, SQRTD_RANGE, LANE };';
    try {
      const factory = new Function(slice + RET);
      PageCore = factory();
      pageRes = PageCore.runSelfTest({ ladder: 48 });
    } catch (e) { evalErr = e; }
    ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');

    if (pageRes) {
      const modRes = runSelfTest({ ladder: 48 });
      ok('(parity)★ inline runSelfTest pass-count == module pass-count (same args)',
        pageRes.pass === modRes.pass && pageRes.total === modRes.total,
        `in-page ${pageRes.pass}/${pageRes.total}  ·  module ${modRes.pass}/${modRes.total}`);
      let agree = pageRes.lines.length === modRes.lines.length;
      for (let k = 0; agree && k < pageRes.lines.length; k++)
        if (pageRes.lines[k].ok !== modRes.lines[k].ok || pageRes.lines[k].name !== modRes.lines[k].name) agree = false;
      ok('(parity)★ every named claim agrees ok-for-ok AND name-for-name (page vs module)', agree,
        agree ? `all ${pageRes.lines.length} lines identical` : 'a line disagreed');

      // (d) cross-boundary spot values: solve(GENESIS) needle & weights.
      const aPage = PageCore.solve(PageCore.GENESIS, 1 / PageCore.SQRT_D, { normalize: true });
      const aMod = solve(GENESIS, 1 / SQRT_D, { normalize: true });
      ok('(parity)★ cross-boundary: solve(GENESIS).needle & weights equal the module values',
        aPage.needle.x === aMod.needle.x && aPage.needle.y === aMod.needle.y && aPage.w.every((v, k) => v === aMod.w[k]),
        `needle=(${aPage.needle.x.toFixed(6)},${aPage.needle.y.toFixed(6)})`);
    }
  }
}

// extract `function NAME(...) { ... }` with brace-matching from a source string.
// (Skip the balanced parameter parens — handles destructured/default params —
//  then brace-match the BODY. Identical technique to the sibling tests.)
function extractFn(src, name) {
  const re = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = re.exec(src);
  if (!m) return '';
  let p = src.indexOf('(', m.index), pd = 0, q = p;
  for (; q < src.length; q++) {
    if (src[q] === '(') pd++;
    else if (src[q] === ')') { pd--; if (pd === 0) { q++; break; } }
  }
  let i = src.indexOf('{', q);
  if (i < 0) return '';
  let depth = 0, k = i;
  for (; k < src.length; k++) {
    if (src[k] === '{') depth++;
    else if (src[k] === '}') { depth--; if (depth === 0) { k++; break; } }
  }
  return src.slice(m.index, k);
}

console.log(`\n${pass}/${total} ${pass === total ? '✓ ALL GREEN' : '✗ FAILURES'}`);
process.exit(pass === total ? 0 : 1);
