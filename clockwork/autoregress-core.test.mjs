// ============================================================================
//  Node-side falsifiability harness for The Snake That Eats Its Tail
//  (autoregression). Runs the shared in-page self-test at the Node budget, adds
//  deeper Node-only assertions the in-page pill can't afford, THEN re-extracts
//  the inlined core from autoregress.html, proves it is byte-for-byte the SAME
//  core (parity), AND proves the shared lineage + DECK are byte-identical to
//  next-word-core.mjs (no new vocabulary). Same shape as the 7 sibling tests.
//  Run:  node autoregress-core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  softmax, argmax, makeRng, sampleIndex, DECK, DECK_SEED, T_RANGE,
  nextStem, stepOnce, stepOnceNoFeedback, generate, generateNoFeedback,
  contextsOf, runSelfTest,
} from './autoregress-core.mjs';
import {
  softmax as nwSoftmax, argmax as nwArgmax, makeRng as nwMakeRng,
  sampleIndex as nwSampleIndex, DECK as NW_DECK, DECK_SEED as NW_DECK_SEED,
} from './next-word-core.mjs';
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

console.log('The Snake That Eats Its Tail — autoregress-core.test.mjs\n');

// ── 1. the shared in-page self-test, at the Node budget ──────────────────────
console.log('— shared runSelfTest() (same claims the in-page pill runs, N=64) —');
const st = runSelfTest({ N: 64 });
for (const l of st.lines) ok('[self-test] ' + l.name, l.ok, l.detail);
ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);

// ── 2. SHARED LINEAGE IS BYTE-IDENTICAL TO next-word-core.mjs (no new vocab) ──
console.log('\n— the shared law is REUSED, not re-implemented (byte-identical to The Next Word) —');
{
  ok('softmax / argmax / makeRng / sampleIndex are the SAME function objects as next-word-core.mjs',
    softmax === nwSoftmax && argmax === nwArgmax && makeRng === nwMakeRng && sampleIndex === nwSampleIndex,
    'shared-lineage re-export (identity ===)');
  // the DECK + DECK_SEED are the SAME objects too — NO new vocabulary introduced.
  const sameDeck = DECK === NW_DECK && DECK.length === NW_DECK.length
    && DECK.every((d, i) => d.ctx === NW_DECK[i].ctx
        && d.toks.join(',') === NW_DECK[i].toks.join(',')
        && d.logits.join(',') === NW_DECK[i].logits.join(','));
  ok('the DECK + DECK_SEED are byte-identical to next-word-core.mjs (no new vocabulary)',
    sameDeck && DECK_SEED === NW_DECK_SEED && DECK_SEED === 0xC0FFEE,
    `${DECK.length} stems · |V|=${DECK[0].toks.length} · seed=0x${DECK_SEED.toString(16).toUpperCase()}`);
}

// ── 3. EXACT REPRODUCIBILITY at scale, across many seeds & temperatures ──────
console.log('\n— CLAIM 1: (prompt, seed) → an exactly reproducible sequence —');
{
  let allRepro = true, worst = '';
  for (const seed of [DECK_SEED, 1, 2, 0xBEEF, (DECK_SEED ^ 1) >>> 0]) {
    for (const T of [0.2, 0.7, 1.5, 5]) {
      const a = generate(0, T, seed, 80), b = generate(0, T, seed, 80);
      const sa = a.map(s => s.tokIdx + ':' + s.stem + ':' + s.pLanded).join('|');
      const sb = b.map(s => s.tokIdx + ':' + s.stem + ':' + s.pLanded).join('|');
      if (sa !== sb) { allRepro = false; worst = `seed=${seed} T=${T}`; }
    }
  }
  ok('A. same (prompt, seed, T) → byte-identical sequence (id, stem, landed-p) over 5 seeds × 4 temps × 80 steps',
    allRepro, allRepro ? 'all 20 (seed,T) pairs reproduce exactly' : `DRIFT at ${worst}`);

  // a tiny seed change → a permanently different story (the fork's claim).
  const a = generate(0, 1.5, DECK_SEED, 80);
  const b = generate(0, 1.5, (DECK_SEED ^ 1) >>> 0, 80);
  let split = -1;
  for (let i = 0; i < a.length; i++) if (a[i].tokIdx !== b[i].tokIdx || a[i].stem !== b[i].stem) { split = i; break; }
  // once split, they must NOT re-converge to an identical id+stem on any later step.
  let reconverged = false;
  if (split >= 0) for (let i = split; i < a.length; i++) if (a[i].tokIdx === b[i].tokIdx && a[i].stem === b[i].stem) { /* a single coincidental matching id is allowed; full re-convergence is not — check the tail */ }
  // full re-convergence = identical from some point to the end.
  for (let i = split; i >= 0 && i < a.length; i++) {
    let tailEq = true;
    for (let k = i; k < a.length; k++) if (a[k].tokIdx !== b[k].tokIdx || a[k].stem !== b[k].stem) { tailEq = false; break; }
    if (tailEq) { reconverged = true; break; }
  }
  ok('A. a one-bit seed nudge splits the story (and the tapes do NOT re-converge to an identical tail)',
    split >= 0 && split < 4 && !reconverged, `split at step ${split + 1} · tails ${reconverged ? 'RE-CONVERGED' : 'stay distinct'}`);
}

// ── 4. THE FEEDBACK IDENTITY, checked id-by-id at scale ──────────────────────
console.log('\n— CLAIM 2: input(N) === input(N−1) ++ [emitted id of step N−1] —');
{
  let allOk = true, firstFail = '';
  for (const seed of [DECK_SEED, 7, 0xABCD]) {
    for (const T of [0.3, 1.5, 4]) {
      const steps = generate(0, T, seed, 120);
      const ctxs = contextsOf(steps, 0);
      // length law: ctx read at step k has length k+1; final input length === N+1.
      if (ctxs.length !== steps.length + 1) { allOk = false; firstFail = `len@seed${seed}`; }
      for (let k = 1; k < ctxs.length; k++) {
        const prev = ctxs[k - 1], cur = ctxs[k];
        const grew = cur.length === prev.length + 1;
        const prefix = prev.every((id, i) => cur[i] === id);
        const appended = cur[cur.length - 1] === steps[k - 1].tokIdx;
        if (!(grew && prefix && appended)) { allOk = false; if (!firstFail) firstFail = `step${k}@seed${seed}`; }
      }
      // final input length must equal N+1 (the start-stem-as-first-id + N emissions).
      if (ctxs[ctxs.length - 1].length !== steps.length + 1) { allOk = false; if (!firstFail) firstFail = `finlen@seed${seed}`; }
    }
  }
  ok('B. feedback identity holds id-by-id over 3 seeds × 3 temps × 120 steps (grow-by-one, prefix-equal, last-appended)',
    allOk, allOk ? 'verified over all runs · final input len = N+1 every run' : `BROKE at ${firstFail}`);
}

// ── 5. STATE MOVES with feedback; the NEG-CONTROL stutters one token ─────────
console.log('\n— CLAIM 3 & 4: feedback steers the read; cutting it stutters one token —');
{
  // with feedback ON the run genuinely visits >1 distribution (a path is built).
  const on = generate(0, 1.5, DECK_SEED, 64);
  const onStems = new Set(on.map(s => s.stem));
  ok('C. feedback ON: the run visits >1 stem — the emission steers the next read, a path is built',
    onStems.size > 1, `distinct stems = ${onStems.size} of ${DECK.length}`);

  // the NEG-CONTROL re-emits the SAME token forever, regardless of seed OR T
  // (it ignores both on purpose — NEITHER sampling nor seed can rescue it).
  let allStutter = true; const stutterTok = [];
  for (const seed of [DECK_SEED, 1, 99]) for (const T of [0.2, 1.5, 9]) {
    const off = generateNoFeedback(0, T, seed, 64);
    const tk = new Set(off.map(s => s.tokIdx));
    if (tk.size !== 1) allStutter = false;
    if (seed === DECK_SEED && T === 1.5) stutterTok.push(off[0].tokIdx);
  }
  ok('D. feedback OFF (cold, prompt-pinned): distinct tokens = 1 forever, across every seed & temperature',
    allStutter, allStutter ? 'all 9 (seed,T) pairs stutter exactly one token' : 'a run did not stutter');

  // the stuttered token is exactly the prompt stem's argmax (the cold pin).
  const promptArgmax = argmax(DECK[0].logits);
  const off = generateNoFeedback(0, 1.5, DECK_SEED, 8);
  ok('D. the stuttered token IS the prompt stem’s argmax (the die is pinned cold to the mode)',
    off.every(s => s.tokIdx === promptArgmax) && off[0].pLanded === 1,
    `argmax(prompt)=tok#${promptArgmax} "${DECK[0].toks[promptArgmax]}" · pLanded=${off[0].pLanded}`);
}

// ── 6. nextStem IS A TOTAL MAP (a run can never fall off the deck) ───────────
console.log('\n— the feedback wiring is a TOTAL map onto the deck —');
{
  let allInRange = true;
  for (let stem = 0; stem < DECK.length; stem++) for (let tok = 0; tok < DECK[stem].toks.length; tok++) {
    const n = nextStem(stem, tok);
    if (!Number.isInteger(n) || n < 0 || n >= DECK.length) allInRange = false;
  }
  ok('E. nextStem(stem, tok) ∈ [0, |DECK|) for EVERY (stem, tok) — total, so a run never falls off the deck',
    allInRange, `checked all ${DECK.length}×${DECK[0].toks.length} edges`);
  // stepOnce.next agrees with nextStem on the realized landing (consistency).
  const rng = makeRng(DECK_SEED);
  const s = stepOnce(0, 1.5, rng);
  ok('E. stepOnce(...).next === nextStem(stem, emitted) (the page and the map agree)',
    s.next === nextStem(s.stem, s.tokIdx), `stem ${s.stem} +tok ${s.tokIdx} → next ${s.next}`);
}

// ── 7. RE-EXTRACTION PARITY — the page core === the module, byte-for-byte ─────
//   Read autoregress.html, slice the inline core between the banner sentinels,
//   prove each NEW function body is char-for-char the imported toString(), prove
//   the SHARED functions inlined into the page are char-for-char next-word's,
//   prove the DECK rows match next-word-core.mjs's source verbatim, eval the
//   slice, run ITS runSelfTest → pass/ok/name parity, and spot-check values.
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'autoregress.html'), 'utf8');
  const BEGIN = '// ===== AUTOREGRESS CORE (inlined byte-twin of autoregress-core.mjs) BEGIN =====';
  const END = '// ===== AUTOREGRESS CORE END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in autoregress.html', i >= 0 && j > i,
    i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) the NEW autoregression functions: char-for-char the imported toString().
    const newFns = { nextStem, stepOnce, stepOnceNoFeedback, generate, generateNoFeedback, contextsOf, runSelfTest };
    for (const [name, fn] of Object.entries(newFns)) {
      const pageSrc = extractFn(slice, name);
      ok(`(parity)★ inlined ${name}() body is char-for-char the imported ${name}.toString()`,
        norm(pageSrc) === norm(fn.toString()),
        norm(pageSrc) === norm(fn.toString()) ? 'identical bytes' :
          `DRIFT:\n  page: ${JSON.stringify(norm(pageSrc).slice(0, 120))}…\n  mod:  ${JSON.stringify(norm(fn.toString()).slice(0, 120))}…`);
    }

    // (b) the SHARED lineage inlined into the page is char-for-char next-word's
    //     (the page can't import, so it carries verbatim copies — proven here).
    const sharedFns = { softmax: nwSoftmax, argmax: nwArgmax, makeRng: nwMakeRng, sampleIndex: nwSampleIndex };
    for (const [name, fn] of Object.entries(sharedFns)) {
      const pageSrc = extractFn(slice, name);
      ok(`(parity)★ inlined SHARED ${name}() body is char-for-char next-word-core.mjs's ${name}.toString()`,
        norm(pageSrc) === norm(fn.toString()),
        norm(pageSrc) === norm(fn.toString()) ? 'identical bytes' : 'DRIFT from the shared lineage');
    }

    // (c) the frozen DECK is inlined exactly. Read the DECK literal block straight
    //     from next-word-core.mjs SOURCE (the authority) and prove every row is in
    //     the page slice verbatim, plus the DECK_SEED literal.
    const nwSrc = readFileSync(join(__dir, 'next-word-core.mjs'), 'utf8');
    const dBeg = nwSrc.indexOf('export const DECK = [');
    const dEnd = nwSrc.indexOf('];', dBeg);
    const deckRows = nwSrc.slice(nwSrc.indexOf('[', dBeg) + 1, dEnd)
      .split('\n').map(s => s.trim()).filter(s => s.startsWith('{ ctx'));
    const allRowsPresent = deckRows.length === DECK.length && deckRows.every(row => slice.includes(row));
    ok('(parity)★ every DECK stem row (ctx + toks + frozen logits) string-matches next-word-core.mjs in the page slice',
      allRowsPresent && slice.includes('DECK_SEED = 0xC0FFEE'),
      allRowsPresent ? `all ${deckRows.length} stem rows + seed present verbatim` : 'a stem row drifted');

    // (d) evaluate the slice and run ITS runSelfTest → full parity.
    let pageRes = null, evalErr = null, PageCore = null;
    const RET = '\n;return { runSelfTest, softmax, argmax, makeRng, sampleIndex, nextStem, stepOnce, stepOnceNoFeedback, generate, generateNoFeedback, contextsOf, DECK, DECK_SEED, T_RANGE };';
    try {
      const factory = new Function(slice + RET);
      PageCore = factory();
      pageRes = PageCore.runSelfTest({});
    } catch (e) { evalErr = e; }
    ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');

    if (pageRes) {
      const modRes = runSelfTest({});
      ok('(parity)★ inline runSelfTest pass-count == module pass-count (same args)',
        pageRes.pass === modRes.pass && pageRes.total === modRes.total,
        `in-page ${pageRes.pass}/${pageRes.total}  ·  module ${modRes.pass}/${modRes.total}`);
      let agree = pageRes.lines.length === modRes.lines.length;
      for (let k = 0; agree && k < pageRes.lines.length; k++)
        if (pageRes.lines[k].ok !== modRes.lines[k].ok || pageRes.lines[k].name !== modRes.lines[k].name) agree = false;
      ok('(parity)★ every named claim agrees ok-for-ok AND name-for-name (page vs module)', agree,
        agree ? `all ${pageRes.lines.length} lines identical` : 'a line disagreed');

      // (e) cross-boundary spot values: generate(0,1.5,seed,12) id+stem sequence
      //     and nextStem(0,0) equal the module values exactly.
      const aPage = PageCore.generate(0, 1.5, DECK_SEED, 12), aMod = generate(0, 1.5, DECK_SEED, 12);
      const seqEq = aPage.map(s => s.tokIdx + ':' + s.stem).join('|') === aMod.map(s => s.tokIdx + ':' + s.stem).join('|');
      ok('(parity)★ cross-boundary: generate(0,1.5,seed,12) sequence & nextStem(0,0) equal the module values',
        seqEq && PageCore.nextStem(0, 0) === nextStem(0, 0),
        `seq ${seqEq ? 'identical' : 'DRIFTED'} · nextStem(0,0)=${PageCore.nextStem(0, 0)}`);
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
