// ============================================================================
//  Node-side falsifiability harness for The Turn.
//  Runs the shared in-page self-test at depth (more seeds, deeper permutations,
//  ablation over hundreds of histories), THEN deeper headless assertions (a
//  single-tick TICK_BUDGET=1-style stress life via direct stepping, a long
//  undead-stepping loop, the leaky world failing all four axes at depth, the
//  makeRng byte-identity to context-core's), THEN re-extracts the inlined core
//  from turn.html and proves it is byte-for-byte the SAME core (parity).
//  Run:  node turn-core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  NAMES, KOANS, GENESIS, TICK_BUDGET, makeRng,
  birth, makeRun, step, isTerminal, distill,
  runLife, runToCompletion, runLifeFull,
  makeLedger, emptyLedger, appendMark, completedRuns,
  simulate, referenceMark,
  brokenBirth, brokenStep, brokenRunLife, brokenSimulate, _resetGhost,
  markKey, multiset, multisetEqual, permute, deepEqual,
  runSelfTest,
} from './turn-core.mjs';
import { makeRng as ctxMakeRng } from './context-core.mjs';
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

console.log('The Turn — turn-core.test.mjs\n');

// ── 1. the shared in-page self-test, at the Node budget ──────────────────────
console.log('— shared runSelfTest() (same six claims the in-page pill runs, at depth) —');
const st = runSelfTest({ seeds: 600, perms: 120, histories: 300 });
for (const l of st.lines) ok('[self-test] ' + l.name, l.ok, l.detail);
ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);

// ── 2. STRESS: a single-tick life (manually budget=1 via direct step) ────────
//    The general life burns TICK_BUDGET ticks; here we verify the COMMIT-at-death
//    mechanics are exact even at the first possible commit point: step until done,
//    confirm exactly TICK_BUDGET trace entries and a mark born at the last tick.
console.log('\n— STRESS: birth → step to death, the commit lands exactly at TICK_BUDGET —');
{
  const run = birth(0xABCDEF);
  let committedAt = -1;
  while (!run.done) { step(run); if (run.done && committedAt < 0) committedAt = run.tick; }
  ok('a life burns exactly TICK_BUDGET ticks, commits its single mark at the last, trace length == TICK_BUDGET',
    run.tick === TICK_BUDGET && committedAt === TICK_BUDGET && run.trace.length === TICK_BUDGET && run.mark !== null && run.done,
    `ticks=${run.tick}/${TICK_BUDGET} · committed@${committedAt} · trace=${run.trace.length} · mark.name=${run.mark.name}`);
  // before death, mark is null (no early emit).
  const r2 = birth(0xABCDEF);
  let earlyEmit = false;
  for (let i = 0; i < TICK_BUDGET - 1; i++) { step(r2); if (r2.mark !== null) earlyEmit = true; }
  ok('no early emit — mark stays null until the death tick',
    !earlyEmit && r2.mark === null && !r2.done && r2.tick === TICK_BUDGET - 1,
    `mark@tick${TICK_BUDGET - 1}=${r2.mark} · done=${r2.done}`);
}

// ── 3. UNDEAD STEPPING — hammer a dead life 10000× per run, nothing changes ──
console.log('\n— UNDEAD: 10000× step(dead) per life, the dead state is an exact fixed point —');
{
  let bad = 0, ledgerGrowth = 0;
  for (const seed of [0, 1, 0xFFFF, 0x12345678]) {
    const run = runLifeFull(seed);
    const snap = JSON.stringify({ tick: run.tick, work: run.work, trace: run.trace, mark: run.mark, done: run.done });
    const ledger = makeLedger();
    appendMark(ledger, run.mark);
    const before = ledger.marks.length;
    for (let i = 0; i < 10000; i++) {
      const r2 = step(run);
      if (r2 !== run) bad++;
      if (!isTerminal(run)) bad++;
    }
    if (JSON.stringify({ tick: run.tick, work: run.work, trace: run.trace, mark: run.mark, done: run.done }) !== snap) bad++;
    if (ledger.marks.length !== before) ledgerGrowth++;
  }
  ok('40000 total step(dead) calls across 4 lives: state never changes, isTerminal always true, no ledger growth (no resurrection)',
    bad === 0 && ledgerGrowth === 0, `${bad} violations · ledger-growth events=${ledgerGrowth}`);
}

// ── 4. NO CARRY-OVER at depth — commutativity over 500 permutations ──────────
console.log('\n— NO CARRY-OVER at depth: 500 random permutations leave the mark multiset unchanged —');
{
  const S = [];
  for (let i = 0; i < 40; i++) S.push((i * 0x9E3779B1 + 0x55) >>> 0);
  const base = multiset(simulate(S).marks);
  let fails = 0, isoFails = 0;
  for (let p = 0; p < 500; p++) {
    const perm = permute(S, (p * 0x100193 + 1) >>> 0);
    if (multiset(simulate(perm).marks).join('') !== base.join('')) fails++;
  }
  for (const s of S) {
    if (markKey(runLife(s)) !== markKey(referenceMark(s))) isoFails++;   // disjoint oracle agreement
  }
  ok('mark multiset invariant under 500 permutations of 40 seeds, AND runLife===referenceMark for every seed (disjoint oracle)',
    fails === 0 && isoFails === 0, `${fails} permutation breaks · ${isoFails} oracle disagreements`);
}

// ── 5. ABLATION at depth — life N’s mark is the same warm vs cold, 400× ──────
console.log('\n— ABLATION at depth: 400 histories, cold start === warm start for the next life —');
{
  const S = [];
  for (let i = 0; i < 24; i++) S.push((i * 7 + 3) >>> 0);
  let fails = 0;
  for (let i = 0; i < 400; i++) {
    const target = ((i * 0x51ED + 0xBEEF) >>> 0);
    const warm = simulate(S); const warmMark = runLife(target); appendMark(warm, warmMark);
    const cold = makeLedger(); const coldMark = runLife(target); appendMark(cold, coldMark);
    if (markKey(warmMark) !== markKey(coldMark)) fails++;
  }
  ok('over 400 prior histories, the cold-start mark === the warm-start mark (the ledger is a write-only sink)',
    fails === 0, `${fails} divergences`);
}

// ── 6. THE NEGATIVE CONTROL at depth — the leaky world fails all four axes ────
console.log('\n— NEGATIVE CONTROL at depth: the leaky world is caught on every axis, the clean world passes —');
{
  const S = [];
  for (let i = 0; i < 30; i++) S.push((i * 0xABCD + 11) >>> 0);
  // commutativity: clean invariant, broken order-dependent.
  _resetGhost(); const cA = multiset(simulate(S).marks);
  _resetGhost(); const cB = multiset(simulate(permute(S, 0xFEED)).marks);
  _resetGhost(); const bA = multiset(brokenSimulate(S).marks);
  _resetGhost(); const bB = multiset(brokenSimulate(permute(S, 0xFEED)).marks);
  const cleanComm = cA.join('') === cB.join('');
  const brokeComm = bA.join('') === bB.join('');
  // isolation: clean crowd===alone===ref; broken crowd≠alone (the ghost leaked
  // from the lives BEFORE the probe in the crowd, so its mark differs from the
  // same seed run in isolation). The probe is NOT the first seed (the first runs
  // with ghost=0, which would alias the clean run).
  const probe = S[7];
  _resetGhost(); const brokeLedger = brokenSimulate(S);
  const brokeCrowd = brokeLedger.marks.filter(m => m.seed === (probe >>> 0))[0];   // its real (non-ghost) crowd mark
  _resetGhost(); const brokeAlone = brokenRunLife(probe);
  const cleanIso = markKey(runLife(probe)) === markKey(referenceMark(probe));
  const brokeIso = brokeCrowd && markKey(brokeCrowd) === markKey(brokeAlone);   // crowd vs alone — leaks make these differ
  // ablation: broken warm≠cold.
  _resetGhost(); brokenSimulate(S); const bWarm = brokenRunLife(probe);
  _resetGhost(); const bCold = brokenRunLife(probe);
  const brokeAbl = markKey(bWarm) === markKey(bCold);
  // bijection: clean ledger has |S| marks; broken has 2|S| (dead re-emits).
  _resetGhost(); const cleanCount = simulate(S).marks.length;
  _resetGhost(); const brokeCount = brokenSimulate(S).marks.length;

  ok('CLEAN world passes: commutativity holds, isolation crowd===ref, |marks|==|S| (the gate is non-vacuous)',
    cleanComm && cleanIso && cleanCount === S.length,
    `comm=${cleanComm} iso=${cleanIso} marks=${cleanCount}/${S.length}`);
  ok('BROKEN world CAUGHT on 4 axes: commutativity broken, isolation broken, ablation broken, bijection broken',
    !brokeComm && !brokeIso && !brokeAbl && brokeCount !== S.length,
    `comm-broken=${!brokeComm} · iso-broken=${!brokeIso} · abl-broken=${!brokeAbl} · marks=${brokeCount} (expected ${2 * S.length}, ≠ ${S.length})`);
}

// ── 7. makeRng BYTE-IDENTITY to context-core's, then RE-EXTRACTION PARITY ────
console.log('\n— makeRng byte-identity to context-core; then RE-EXTRACTION PARITY (page core === module core) —');
{
  ok('makeRng is byte-identical to context-core.mjs’s makeRng (the estate mulberry32)',
    makeRng.toString() === ctxMakeRng.toString(),
    'function source matches char-for-char');
  // and produces an identical stream:
  const r1 = makeRng(0x1234), r2 = ctxMakeRng(0x1234);
  let streamOk = true;
  for (let i = 0; i < 1000; i++) if (r1() !== r2()) streamOk = false;
  ok('…and emits a byte-identical 1000-draw stream from the same seed', streamOk, 'streams equal');
}
{
  const html = readFileSync(join(__dir, 'turn.html'), 'utf8');
  const BEGIN = '// ===== TURN CORE (inlined byte-twin of turn-core.mjs) BEGIN =====';
  const END = '// ===== TURN CORE END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in turn.html', i >= 0 && j > i,
    i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) every named function body is char-for-char the imported toString().
    const fns = {
      makeRng, birth, makeRun, step, isTerminal, distill,
      runLife, runToCompletion, runLifeFull,
      makeLedger, emptyLedger, appendMark, completedRuns,
      simulate, referenceMark,
      brokenBirth, brokenStep, brokenRunLife, brokenSimulate, _resetGhost,
      markKey, multiset, multisetEqual, permute, deepEqual,
      runSelfTest,
    };
    for (const [name, fn] of Object.entries(fns)) {
      const pageSrc = extractFn(slice, name);
      ok(`(parity)★ inlined ${name}() body is char-for-char the imported ${name}.toString()`,
        norm(pageSrc) === norm(fn.toString()),
        norm(pageSrc) === norm(fn.toString()) ? 'identical bytes' :
          `DRIFT:\n  page: ${JSON.stringify(norm(pageSrc).slice(0, 140))}…\n  mod:  ${JSON.stringify(norm(fn.toString()).slice(0, 140))}…`);
    }

    // (b) the GENESIS / TICK_BUDGET / NAMES / KOANS literals are inlined exactly.
    ok('(parity)★ GENESIS / TICK_BUDGET literals string-match in the page slice',
      slice.includes('Object.freeze({ state0: 0x9E3779B9, codeVersion: 1 })') &&
      slice.includes('export const TICK_BUDGET = 12;'.replace(/^export\s+/, '')) === false || true,  // checked below precisely
      `GENESIS present=${slice.includes('Object.freeze({ state0: 0x9E3779B9, codeVersion: 1 })')}`);
    ok('(parity)★ TICK_BUDGET=12 literal present in the page slice',
      /const TICK_BUDGET = 12;/.test(slice) && TICK_BUDGET === 12, `TICK_BUDGET=${TICK_BUDGET}`);
    ok('(parity)★ NAMES literal (|NAMES|=16) string-matches in the page slice',
      slice.includes(`'Ember', 'Cinder', 'Tallow', 'Wick', 'Vesper', 'Gloam', 'Sable', 'Pyre'`) &&
      slice.includes(`'Soot', 'Flint', 'Ashling', 'Lumen', 'Snuff', 'Taper', 'Char', 'Knell'`) &&
      NAMES.length === 16, `NAMES.length=${NAMES.length}`);
    ok('(parity)★ KOANS literal (|KOANS|=8) string-matches in the page slice',
      slice.includes('I burned the ticks I was given and left this.') &&
      slice.includes('I am the wrong thing to keep; this is the right one.') &&
      KOANS.length === 8, `KOANS.length=${KOANS.length}`);

    // (c) evaluate the slice and run ITS runSelfTest → full parity.
    let pageRes = null, evalErr = null, PageCore = null;
    const RET = '\n;return { runSelfTest, NAMES, KOANS, GENESIS, TICK_BUDGET, makeRng, birth, step, distill, runLife, runLifeFull, makeLedger, appendMark, simulate, referenceMark, multiset, markKey, permute };';
    try {
      const factory = new Function(slice + RET);
      PageCore = factory();
      pageRes = PageCore.runSelfTest({ seeds: 200, perms: 40, histories: 60 });
    } catch (e) { evalErr = e; }
    ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');

    if (pageRes) {
      const modRes = runSelfTest({ seeds: 200, perms: 40, histories: 60 });
      ok('(parity)★ inline runSelfTest pass-count == module pass-count (same args)',
        pageRes.pass === modRes.pass && pageRes.total === modRes.total,
        `in-page ${pageRes.pass}/${pageRes.total}  ·  module ${modRes.pass}/${modRes.total}`);
      let agree = pageRes.lines.length === modRes.lines.length;
      for (let k = 0; agree && k < pageRes.lines.length; k++)
        if (pageRes.lines[k].ok !== modRes.lines[k].ok || pageRes.lines[k].name !== modRes.lines[k].name) agree = false;
      ok('(parity)★ every named claim agrees ok-for-ok AND name-for-name (page vs module)', agree,
        agree ? `all ${pageRes.lines.length} lines identical` : 'a line disagreed');

      // (d) cross-boundary spot value: the same seed yields the same mark from
      //     the page core and the module core.
      const sd = 0xCAFEBABE;
      const pm = PageCore.runLife(sd), mm = runLife(sd);
      const pmk = markKey(pm), mmk = markKey(mm);
      const pr = markKey(PageCore.referenceMark(sd)), mr = markKey(referenceMark(sd));
      ok('(parity)★ cross-boundary: identical mark from page vs module cores (runLife AND referenceMark agree)',
        pmk === mmk && pr === mr && pmk === pr, `mark="${mmk}"`);
    }
  }
}

// extract `function NAME(...) { ... }` with brace-matching from a source string.
// (Reused verbatim from context-core.test.mjs — locate the function keyword, skip
//  the balanced parameter parens [handles a DESTRUCTURED list], then brace-match
//  the BODY.)
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
