// ============================================================================
//  Node-side falsifiability harness for The Unstamped Bag (the order-blindness
//  bench). Runs the shared in-page self-test at a deeper ladder, adds deeper
//  Node-only assertions the pill can't afford (an EXHAUSTIVE permutation sweep of
//  the hero bag; the equivariance vs a hand-checked oracle), THEN re-extracts the
//  inlined core from unstamped-bag.html and proves it is byte-for-byte the SAME
//  core (parity) — exactly like the sibling wing tests.
//  Run:  node unstamped-bag-core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  GENESIS, HERO_DBM, HERO_MBD,
  softmax, makeRng, mv, dot, posEnc, inputs, attend, meanpoolSlot, gistCanon,
  nextWordDie, permute, randPerm, invPerm, solve, tvDist, maxAbsDiffRows,
  runSelfTest,
} from './unstamped-bag-core.mjs';
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

console.log('The Unstamped Bag — unstamped-bag-core.test.mjs\n');

// ── 1. the shared in-page self-test, at a deeper ladder ──────────────────────
console.log('— shared runSelfTest() (the same five claims the in-page pill runs) —');
const st = runSelfTest({ ladder: 160 });
for (const l of st.lines) ok('[self-test] ' + l.name, l.ok, l.detail);
ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);

// ── 2. CLAIM 1 deeper: equivariance over EVERY permutation of a 5-token bag ───
console.log('\n— CLAIM 1 (deeper): equivariance over ALL 120 permutations of a 5-token bag —');
{
  const bag = [0, 1, 2, 4, 5];                 // five distinct tokens
  const perms = allPerms([0, 1, 2, 3, 4]);
  const out0 = attend(inputs(bag, { stamp: false })).OUT;
  let worst = 0, tested = 0;
  for (const pi of perms) {
    const lhs = permute(out0, pi);                                   // P_π · attend(X)
    const rhs = attend(inputs(permute(bag, pi), { stamp: false })).OUT;  // attend(P_π·X)
    worst = Math.max(worst, maxAbsDiffRows(lhs, rhs));
    tested++;
  }
  ok('A. ‖P_π·attend(X) − attend(P_π·X)‖∞ < 1e-12 over ALL 120 permutations (exact in ℝ, float dust only)',
    tested === 120 && worst < 1e-12, `${tested} permutations · worst ‖·‖∞ = ${worst.toExponential(2)}`);
}

// ── 3. CLAIM 2 deeper: the gist is byte-identical over ALL hero permutations ──
console.log('\n— CLAIM 2 (deeper): the canonical gist is one byte-string over all orders —');
{
  const perms = allPerms([0, 1, 2]);
  const g0 = gistCanon(HERO_DBM, { stamp: false });
  let ulp = 0, dieUlp = 0;
  const die0 = nextWordDie(g0);
  for (const pi of perms) {
    const ord = permute(HERO_DBM, pi);
    const g = gistCanon(ord, { stamp: false });
    for (let k = 0; k < g.length; k++) if (g[k] !== g0[k]) ulp++;
    const d = nextWordDie(g);
    for (let k = 0; k < d.length; k++) if (d[k] !== die0[k]) dieUlp++;
  }
  ok('B. gistCanon AND the next-word die are byte-identical (0 ULP) over all 6 orders of dog·bites·man',
    ulp === 0 && dieUlp === 0, `gist ULP-drift=${ulp} · die ULP-drift=${dieUlp} over ${perms.length} orders`);

  // honest framing: the canonical readout equals the honest slot-order pool (<1e-12).
  let maxHonest = 0;
  for (const pi of perms) {
    const ord = permute(HERO_DBM, pi);
    const honest = meanpoolSlot(attend(inputs(ord, { stamp: false })).OUT);
    for (let k = 0; k < honest.length; k++) maxHonest = Math.max(maxHonest, Math.abs(honest[k] - g0[k]));
  }
  ok('B. the canonical readout equals the honest slot-order pool to <1e-12 (byte-identity is honest, not a sort trick)',
    maxHonest < 1e-12, `max|canonical − honest slot pool| = ${maxHonest.toExponential(2)}`);
}

// ── 4. CLAIM 3 deeper: the stamp is the SOLE symmetry-breaker (non-vacuous) ───
console.log('\n— CLAIM 3 (deeper): the position stamp breaks it; the honest path still clears —');
{
  const pi = [2, 1, 0];   // the unique reversal dog·bites·man → man·bites·dog
  // stamp ON: equivariance is broken by O(1) and the die genuinely moves.
  const onBreak = maxAbsDiffRows(permute(attend(inputs(HERO_DBM, { stamp: true })).OUT, pi), attend(inputs(HERO_MBD, { stamp: true })).OUT);
  const tvOn = tvDist(nextWordDie(gistCanon(HERO_DBM, { stamp: true })), nextWordDie(gistCanon(HERO_MBD, { stamp: true })));
  // stamp OFF: the IDENTICAL config still clears claims 1+2.
  const offBreak = maxAbsDiffRows(permute(attend(inputs(HERO_DBM, { stamp: false })).OUT, pi), attend(inputs(HERO_MBD, { stamp: false })).OUT);
  const tvOff = tvDist(nextWordDie(gistCanon(HERO_DBM, { stamp: false })), nextWordDie(gistCanon(HERO_MBD, { stamp: false })));
  ok('C. stamp ON: the SAME reversal changes per-token output O(1) (max|Δ|>0.1) AND moves the die (TV>0.02)',
    onBreak > 0.1 && tvOn > 0.02, `max|Δout|=${onBreak.toFixed(4)} · die TV=${tvOn.toFixed(4)}`);
  ok('C. NON-VACUOUS: stamp OFF the IDENTICAL config is equivariant (<1e-12) and the die is byte-identical (TV=0)',
    offBreak < 1e-12 && tvOff === 0, `stamp-off max|Δout|=${offBreak.toExponential(2)} · die TV=${tvOff}`);
  // the WV projection is non-symmetric → order WOULD matter once stamped (sanity).
  ok('C. the head is genuinely order-sensitive once stamped — the argmax next-word flips dog·bites·man ⇄ man·bites·dog',
    argmaxWord(nextWordDie(gistCanon(HERO_DBM, { stamp: true }))) !== argmaxWord(nextWordDie(gistCanon(HERO_MBD, { stamp: true }))),
    `stamped: dbm→${argmaxWord(nextWordDie(gistCanon(HERO_DBM, { stamp: true })))} · mbd→${argmaxWord(nextWordDie(gistCanon(HERO_MBD, { stamp: true })))}`);
}

// ── 5. CLAIM 4 deeper: a constant stamp keeps the symmetry; the sinusoid breaks it ─
console.log('\n— CLAIM 4 (deeper): position-DEPENDENCE breaks it, not "adding anything" —');
{
  const perms = allPerms([0, 1, 2]);
  let constEq = 0, constUlp = 0, sinEq = 0;
  for (const pi of perms) {
    const ord = permute(HERO_DBM, pi);
    // constant stamp: still equivariant + gist byte-identical
    constEq = Math.max(constEq, maxAbsDiffRows(permute(attend(inputs(HERO_DBM, { constStamp: true })).OUT, pi), attend(inputs(ord, { constStamp: true })).OUT));
    const g = gistCanon(ord, { constStamp: true }), g0 = gistCanon(HERO_DBM, { constStamp: true });
    for (let k = 0; k < g.length; k++) if (g[k] !== g0[k]) constUlp++;
    // sinusoidal stamp: broken
    sinEq = Math.max(sinEq, maxAbsDiffRows(permute(attend(inputs(HERO_DBM, { stamp: true })).OUT, pi), attend(inputs(ord, { stamp: true })).OUT));
  }
  ok('D. a CONSTANT (position-independent) stamp keeps equivariance (<1e-12) AND the gist byte-identical (0 ULP) over all 6 orders',
    constEq < 1e-12 && constUlp === 0, `const-stamp worst ‖·‖∞=${constEq.toExponential(2)} · gist ULP=${constUlp}`);
  ok('D. the SINUSOIDAL stamp on the same orders breaks equivariance by O(1) — so it is the position-DEPENDENCE that bites',
    sinEq > 0.1, `sinusoid worst ‖·‖∞=${sinEq.toFixed(4)} (≫ const ${constEq.toExponential(2)})`);
}

// ── 6. THE GENESIS is pinned (a model edit must be loud) ──────────────────────
console.log('\n— the frozen genesis literals are pinned —');
{
  ok('E. |V|=6, d=2, ω=0.9, the head + die matrices the right shape',
    GENESIS.VOCAB.length === 6 && GENESIS.D === 2 && Math.abs(GENESIS.OMEGA - 0.9) < 1e-15 &&
    GENESIS.EMB.length === 6 && GENESIS.WQ.length === 2 && GENESIS.WQ[0].length === 2 &&
    GENESIS.Wout.length === 6 && GENESIS.CONST.length === 2,
    `|V|=${GENESIS.VOCAB.length} · d=${GENESIS.D} · ω=${GENESIS.OMEGA} · EMB ${GENESIS.EMB.length}×${GENESIS.EMB[0].length} · Wout ${GENESIS.Wout.length}×${GENESIS.Wout[0].length}`);
  ok('E. the hero bags are the unique reversal of three distinct tokens (dog·bites·man ⇄ man·bites·dog)',
    HERO_DBM.join() === '0,1,2' && HERO_MBD.join() === '2,1,0' &&
    GENESIS.VOCAB[0] === 'dog' && GENESIS.VOCAB[1] === 'bites' && GENESIS.VOCAB[2] === 'man',
    `dbm=[${HERO_DBM}] mbd=[${HERO_MBD}] (${HERO_DBM.map(t => GENESIS.VOCAB[t]).join(' ')})`);
  // WV must be non-symmetric (so order WOULD matter once stamped).
  ok('E. WV is NON-symmetric (off-diagonals differ) — order would matter once a stamp is added',
    GENESIS.WV[0][1] !== GENESIS.WV[1][0], `WV=[[${GENESIS.WV[0]}],[${GENESIS.WV[1]}]]`);
}

// ── 7. determinism + die-law spot checks ─────────────────────────────────────
console.log('\n— determinism + die law —');
{
  const a = solve(HERO_DBM, { stamp: false }), b = solve(HERO_DBM, { stamp: false });
  ok('F. solve() is deterministic — two calls byte-identical (gist + die)',
    a.gist.every((v, i) => v === b.gist[i]) && a.die.every((v, i) => v === b.die[i]),
    `gist=(${a.gist.map(x => x.toFixed(6)).join(', ')})`);
  const lawDie = softmax(GENESIS.Wout.map(r => dot(r, a.gist)), 1);
  const sum = a.die.reduce((x, y) => x + y, 0);
  ok('F. die === softmax(Wout·pool) to machine-ε and Σdie=1',
    a.die.every((v, i) => v === lawDie[i]) && Math.abs(sum - 1) <= 1e-12, `Σdie=${sum.toFixed(12)}`);
  ok('F. invPerm(perm) inverts a permutation; permute∘invPerm = identity',
    (() => { const p = randPerm(6, makeRng(7)); const ip = invPerm(p); const id = permute(permute([0, 1, 2, 3, 4, 5], p), ip); return id.join() === '0,1,2,3,4,5'; })(),
    'permute(permute(x,π),π⁻¹) === x');
}

// ── 8. RE-EXTRACTION PARITY — the page core === the module, byte-for-byte ─────
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'unstamped-bag.html'), 'utf8');
  const BEGIN = '// ===== UNSTAMPED-BAG CORE (inlined byte-twin of unstamped-bag-core.mjs) BEGIN =====';
  const END = '// ===== UNSTAMPED-BAG CORE END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in unstamped-bag.html', i >= 0 && j > i,
    i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) every named function body is char-for-char the imported toString().
    const fns = { softmax, makeRng, mv, dot, posEnc, inputs, attend, meanpoolSlot, gistCanon, nextWordDie, permute, randPerm, invPerm, solve, tvDist, maxAbsDiffRows, runSelfTest };
    for (const [name, fn] of Object.entries(fns)) {
      const pageSrc = extractFn(slice, name);
      ok(`(parity)★ inlined ${name}() body is char-for-char the imported ${name}.toString()`,
        norm(pageSrc) === norm(fn.toString()),
        norm(pageSrc) === norm(fn.toString()) ? 'identical bytes' :
          `DRIFT:\n  page: ${JSON.stringify(norm(pageSrc).slice(0, 140))}…\n  mod:  ${JSON.stringify(norm(fn.toString()).slice(0, 140))}…`);
    }

    // (b) the frozen GENESIS + hero literals are inlined verbatim (read from the
    //     .mjs SOURCE so a reserialization can't hide `-1.00`→`-1` drift).
    const moduleSrc = readFileSync(join(__dir, 'unstamped-bag-core.mjs'), 'utf8');
    const gBeg = moduleSrc.indexOf('export const GENESIS = {');
    const gEnd = moduleSrc.indexOf('};', gBeg);
    const genesisRows = moduleSrc.slice(gBeg, gEnd).split('\n').map(s => s.trim())
      .filter(s => /^[A-Za-z]+:\s/.test(s) || s.startsWith('[')); // field lines + matrix/emb rows
    const allRowsPresent = genesisRows.length >= 10 && genesisRows.every(row => slice.includes(row));
    ok('(parity)★ every GENESIS field/data row string-matches the .mjs source in the page slice',
      allRowsPresent &&
      slice.includes("VOCAB: ['dog', 'bites', 'man', 'the', 'cat', 'sat']") &&
      slice.includes('OMEGA: 0.9') &&
      slice.includes('HERO_DBM = [0, 1, 2]') && slice.includes('HERO_MBD = [2, 1, 0]'),
      allRowsPresent ? `all ${genesisRows.length} genesis rows + VOCAB + ω + heroes present verbatim` : 'a genesis row drifted');

    // (c) evaluate the slice and run ITS runSelfTest → full parity.
    let pageRes = null, evalErr = null, PageCore = null;
    const RET = '\n;return { runSelfTest, softmax, makeRng, mv, dot, posEnc, inputs, attend, meanpoolSlot, gistCanon, nextWordDie, permute, randPerm, invPerm, solve, tvDist, maxAbsDiffRows, GENESIS, HERO_DBM, HERO_MBD };';
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

      // (d) cross-boundary spot values: solve(HERO_DBM).gist & die equal the module.
      const aPage = PageCore.solve(PageCore.HERO_DBM, { stamp: false });
      const aMod = solve(HERO_DBM, { stamp: false });
      ok('(parity)★ cross-boundary: solve(dog·bites·man).gist & die equal the module values',
        aPage.gist.every((v, k) => v === aMod.gist[k]) && aPage.die.every((v, k) => v === aMod.die[k]),
        `gist=(${aPage.gist.map(x => x.toFixed(6)).join(', ')})`);
    }
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────
function argmaxWord(d) { let am = 0; for (let i = 1; i < d.length; i++) if (d[i] > d[am]) am = i; return GENESIS.VOCAB[am]; }
function allPerms(arr) {
  if (arr.length <= 1) return [arr.slice()];
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = arr.slice(0, i).concat(arr.slice(i + 1));
    for (const p of allPerms(rest)) out.push([arr[i]].concat(p));
  }
  return out;
}
// extract `function NAME(...) { ... }` with brace-matching from a source string.
// (Skip the balanced parameter parens, then brace-match the BODY. Identical
//  technique to the sibling tests.)
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
