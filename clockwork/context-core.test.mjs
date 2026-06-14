// ============================================================================
//  Node-side falsifiability harness for The Context Window.
//  Runs the shared in-page self-test at the Node budget (a long op stream, K
//  swept 1..N with N≥KMAX, more ops than the pill affords), THEN deeper headless
//  assertions (stress K=1, K>totalSeen, rapid shrink/grow churn proving grow never
//  resurrects), THEN re-extracts the inlined core from context.html and proves it
//  is byte-for-byte the SAME core (parity).
//  Run:  node context-core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  VOCAB, makeRng,
  makeBuffer, push, resize, windowEntries, query,
  totalSeen, evictedCount, windowLength,
  makeBrokenBuffer, brokenPush, brokenQuery, naiveWindow,
  runSelfTest,
} from './context-core.mjs';
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

console.log('The Context Window — context-core.test.mjs\n');

// ── 1. the shared in-page self-test, at the Node budget ──────────────────────
console.log('— shared runSelfTest() (same claims the in-page pill runs, ops=40000, Kmax=24) —');
const KMAX_NODE = 24;
const st = runSelfTest({ ops: 40000, Kmax: KMAX_NODE });
for (const l of st.lines) ok('[self-test] ' + l.name, l.ok, l.detail);
ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);

// ── 2. STRESS K=1 — the window is always exactly the newest token, nothing more ─
console.log('\n— STRESS K=1: the window is forever the single newest token —');
{
  const b = makeBuffer(1);
  let bad = 0;
  for (let t = 0; t < 500; t++) {
    push(b, VOCAB[t % VOCAB.length]);
    const w = windowEntries(b);
    if (w.length !== 1 || w[0].word !== VOCAB[t % VOCAB.length]) bad++;
    if (b.evictedCount !== t) bad++;     // every prior token evicted
  }
  ok('K=1: windowLength==1 always, holds only the newest, evictedCount==totalSeen−1',
    bad === 0 && b.totalSeen === 500 && b.evictedCount === 499 && windowLength(b) === 1,
    `len=${windowLength(b)} · totalSeen=${b.totalSeen} · evicted=${b.evictedCount}`);
}

// ── 3. K > totalSeen — nothing is ever evicted; the whole history is the window ─
console.log('\n— K > totalSeen: no eviction, the window holds the entire history —');
{
  const b = makeBuffer(100);
  for (let t = 0; t < 7; t++) push(b, VOCAB[t]);
  const w = windowEntries(b);
  ok('K=100, 7 pushes: window length 7, evictedCount 0, conservation holds',
    w.length === 7 && evictedCount(b) === 0 && totalSeen(b) === 7 &&
    totalSeen(b) === evictedCount(b) + windowLength(b) &&
    w.every((e, i) => e.word === VOCAB[i]),
    `len=${w.length} · evicted=${evictedCount(b)} · seen=${totalSeen(b)}`);
  // every seq queryable as in-window with the right position
  let posOk = true;
  for (let s = 0; s < 7; s++) { const q = query(b, s); if (q.status !== 'in-window' || q.position !== s) posOk = false; }
  ok('K=100: every seq queries in-window at its exact position; an unseen seq is flagged',
    posOk && query(b, 7).status === 'unseen' && query(b, -1).status === 'unseen',
    `query(seq6)=${JSON.stringify(query(b, 6))} · query(seq7)=${query(b, 7).status}`);
}

// ── 4. RAPID SHRINK/GROW CHURN — grow NEVER resurrects a token ────────────────
console.log('\n— RAPID shrink/grow churn: growing the wall never resurrects a lost token —');
{
  const b = makeBuffer(8);
  for (let t = 0; t < 8; t++) push(b, VOCAB[t]);             // window = seqs 0..7
  const evictedSeqs = [];
  // shrink hard to 2 → seqs 0..5 are gone forever
  const dropped = resize(b, 2);
  for (const e of dropped) evictedSeqs.push(e.seq);
  ok('shrink 8→2 evicts the 6 oldest (seqs 0..5), returns them oldest→newest, evictedCount jumps by 6',
    dropped.length === 6 && dropped.map(e => e.seq).join(',') === '0,1,2,3,4,5' && evictedCount(b) === 6 && windowLength(b) === 2,
    `dropped seqs=[${dropped.map(e => e.seq).join(',')}] · evicted=${evictedCount(b)} · len=${windowLength(b)}`);
  // now grow repeatedly 2→4→8→16→24 — NONE of the dropped seqs may return,
  // evictedCount must NEVER decrease, and no new placeholders may fill from the past.
  let resurrected = false, evDropped = false, evPrev = evictedCount(b);
  for (const newK of [4, 8, 16, 24, 6, 12]) {
    const got = resize(b, newK);
    if (newK > windowLength(b) && got.length > 0) { /* grow returns [] */ }
    const win = windowEntries(b).map(e => e.seq);
    for (const s of evictedSeqs) if (win.includes(s)) resurrected = true;
    if (evictedCount(b) < evPrev) evDropped = true;
    evPrev = evictedCount(b);
    // grow must leave the window length unchanged (no refill); only shrink past it cuts.
  }
  ok('grow 2→4→8→16→24 (and a 24→6→12 churn): no evicted seq EVER reappears; evictedCount never drops',
    !resurrected && !evDropped,
    `resurrected=${resurrected} · evictedCount monotone=${!evDropped} (final ${evictedCount(b)})`);
  // a queried evicted token stays forgotten after all that growing.
  ok('after all the growing, query(seq0) still says FORGOTTEN (irreversible)',
    query(b, 0).status === 'forgotten',
    `query(seq0)=${JSON.stringify(query(b, 0))}`);
}

// ── 5. THE CLAIM at depth — O(1) ring === naive survivors, byte-for-byte, K swept ─
console.log('\n— CLAIM at depth: O(1) ring === naive reference over 80000 push+resize ops, K swept 1..24 —');
{
  const rng = makeRng(0x1234abcd);
  const draw = () => VOCAB[Math.floor(rng() * VOCAB.length)];
  const b = makeBuffer(1 + Math.floor(rng() * KMAX_NODE));
  let survivors = [], mism = 0, resizes = 0, lo = 99, hi = 0;
  for (let t = 0; t < 80000; t++) {
    if (t > 0 && rng() < 0.1) {
      const nk = 1 + Math.floor(rng() * KMAX_NODE);
      resize(b, nk); while (survivors.length > nk) survivors.shift(); resizes++;
    }
    const tok = draw(); push(b, tok);
    survivors.push(tok); while (survivors.length > b.K) survivors.shift();
    lo = Math.min(lo, b.K); hi = Math.max(hi, b.K);
    const a = windowEntries(b).map(e => e.word);
    const ref = naiveWindow(survivors, b.K);
    if (a.length !== ref.length || a.some((w, i) => w !== ref[i])) mism++;
  }
  ok(`O(1) ring === naive reference over 80000 ops (${resizes} resizes, K∈[${lo},${hi}])`,
    mism === 0, `${mism} mismatches`);
}

// ── 6. THE NEGATIVE CONTROL at depth — the off-by-one is caught, the gate non-vacuous ─
console.log('\n— NEGATIVE CONTROL at depth: the off-by-one buffer is caught, the correct buffer passes —');
{
  const K = 6;
  const good = makeBuffer(K), bad = makeBrokenBuffer(K), history = [];
  let goodFails = 0, badLenWrong = 0, badNotLastK = 0, badConsBroken = 0;
  for (let t = 0; t < 300; t++) {
    const tok = VOCAB[(t * 7 + 3) % VOCAB.length];
    push(good, tok); brokenPush(bad, tok); history.push(tok);
    const ref = naiveWindow(history, K);
    const gw = windowEntries(good);
    if (gw.length !== Math.min(good.totalSeen, K)) goodFails++;
    if (gw.length !== ref.length || gw.some((e, i) => e.word !== ref[i])) goodFails++;
    if (good.totalSeen !== good.evictedCount + gw.length) goodFails++;
    const bw = windowEntries(bad);
    if (bw.length !== Math.min(bad.totalSeen, bad.reqK)) badLenWrong++;
    if (bw.length !== ref.length || bw.some((e, i) => e.word !== ref[i])) badNotLastK++;
    if (bad.totalSeen !== bad.evictedCount + bw.length) badConsBroken++;
  }
  ok('CORRECT buffer passes all three invariants over 300 pushes (the gate is non-vacuous)',
    goodFails === 0, `${goodFails} failures`);
  ok('BROKEN off-by-one is CAUGHT: stale length, NOT the last K, conservation broken (all flagged)',
    badLenWrong > 0 && badNotLastK > 0 && badConsBroken > 0,
    `lenWrong ${badLenWrong}× · notLastK ${badNotLastK}× · consBroken ${badConsBroken}×`);
  // the probe lie: the broken buffer's oldest leaked entry is a truly-evicted seq
  const lyingSeq = windowEntries(bad)[0].seq;
  const naiveForgotten = lyingSeq < history.length - K;
  ok('BROKEN probe LIES: claims a truly-evicted token is "in-window" — the honest probe says FORGOTTEN',
    naiveForgotten && brokenQuery(bad, lyingSeq).status === 'in-window' && query(good, lyingSeq).status === 'forgotten',
    `seq${lyingSeq}: broken says ${brokenQuery(bad, lyingSeq).status}, honest says ${query(good, lyingSeq).status}`);
}

// ── 7. RE-EXTRACTION PARITY — the page core === the module, byte-for-byte ─────
//   Read context.html, slice the inline core between its OWN banner sentinels
//   (DISTINCT from TEMPERATURE CORE), prove each function body is char-for-char
//   the imported toString(), string-match the VOCAB literal, eval the slice, run
//   ITS runSelfTest → pass-count + ok-for-ok + name-for-name parity, and spot-
//   check cross-boundary values.
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'context.html'), 'utf8');
  const BEGIN = '// ===== CONTEXT CORE (inlined byte-twin of context-core.mjs) BEGIN =====';
  const END = '// ===== CONTEXT CORE END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in context.html', i >= 0 && j > i,
    i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) every named function body is char-for-char the imported toString().
    const fns = {
      makeRng, makeBuffer, push, resize, windowEntries, query,
      totalSeen, evictedCount, windowLength,
      makeBrokenBuffer, brokenPush, brokenQuery, naiveWindow, runSelfTest,
    };
    for (const [name, fn] of Object.entries(fns)) {
      const pageSrc = extractFn(slice, name);
      ok(`(parity)★ inlined ${name}() body is char-for-char the imported ${name}.toString()`,
        norm(pageSrc) === norm(fn.toString()),
        norm(pageSrc) === norm(fn.toString()) ? 'identical bytes' :
          `DRIFT:\n  page: ${JSON.stringify(norm(pageSrc).slice(0, 120))}…\n  mod:  ${JSON.stringify(norm(fn.toString()).slice(0, 120))}…`);
    }

    // (b) the VOCAB literal is inlined exactly (an edit can't drift the page).
    ok('(parity)★ VOCAB literal (|V|=16) string-matches in the page slice',
      slice.includes(`'the', 'cat', 'sat', 'on', 'a', 'mat', 'and', 'then'`) &&
      slice.includes(`'ran', 'far', 'past', 'every', 'wall', 'into', 'dark', 'gone'`) &&
      VOCAB.length === 16,
      `VOCAB=[${VOCAB.join(',')}]`);

    // (c) evaluate the slice and run ITS runSelfTest → full parity.
    let pageRes = null, evalErr = null, PageCore = null;
    const RET = '\n;return { runSelfTest, makeBuffer, push, resize, windowEntries, query, makeBrokenBuffer, brokenPush, brokenQuery, naiveWindow, makeRng, totalSeen, evictedCount, windowLength, VOCAB };';
    try {
      const factory = new Function(slice + RET);
      PageCore = factory();
      pageRes = PageCore.runSelfTest({ ops: 4000, Kmax: 12 });
    } catch (e) { evalErr = e; }
    ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');

    if (pageRes) {
      const modRes = runSelfTest({ ops: 4000, Kmax: 12 });
      ok('(parity)★ inline runSelfTest pass-count == module pass-count (same args)',
        pageRes.pass === modRes.pass && pageRes.total === modRes.total,
        `in-page ${pageRes.pass}/${pageRes.total}  ·  module ${modRes.pass}/${modRes.total}`);
      let agree = pageRes.lines.length === modRes.lines.length;
      for (let k = 0; agree && k < pageRes.lines.length; k++)
        if (pageRes.lines[k].ok !== modRes.lines[k].ok || pageRes.lines[k].name !== modRes.lines[k].name) agree = false;
      ok('(parity)★ every named claim agrees ok-for-ok AND name-for-name (page vs module)', agree,
        agree ? `all ${pageRes.lines.length} lines identical` : 'a line disagreed');

      // (d) cross-boundary spot values: a fixed push stream + a query verdict.
      const pageBuf = PageCore.makeBuffer(3), modBuf = makeBuffer(3);
      for (let t = 0; t < 10; t++) { PageCore.push(pageBuf, PageCore.VOCAB[t % 16]); push(modBuf, VOCAB[t % 16]); }
      const pw = PageCore.windowEntries(pageBuf).map(e => e.seq + ':' + e.word).join(' ');
      const mw = windowEntries(modBuf).map(e => e.seq + ':' + e.word).join(' ');
      const pq = JSON.stringify(PageCore.query(pageBuf, 0)), mq = JSON.stringify(query(modBuf, 0));
      ok('(parity)★ cross-boundary: identical window (seq:word) & query(seq0) verdict from page vs module cores',
        pw === mw && pq === mq, `window="${mw}" · query(seq0)=${mq}`);
    }
  }
}

// extract `function NAME(...) { ... }` with brace-matching from a source string.
// (Reused verbatim from core.test.mjs / the collatz precedent: locate the function
//  keyword, skip the balanced parameter parens — handles a DESTRUCTURED list like
//  runSelfTest({…}={}) — then brace-match the BODY. Identical for `(args)` shapes.)
function extractFn(src, name) {
  const re = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = re.exec(src);
  if (!m) return '';
  // skip the balanced parameter parens (handles `{…}` destructuring inside them).
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
