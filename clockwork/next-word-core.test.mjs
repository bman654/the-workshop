// ============================================================================
//  Node-side falsifiability harness for The Next Word (the loaded die game).
//  Runs the shared in-page self-test at the Node budget (N up to 200000), adds
//  deeper Node-only assertions the in-page pill can't afford, THEN re-extracts
//  the inlined core from next-word.html and proves it is byte-for-byte the SAME
//  core (parity) — exactly like the 6 sibling tests in this wing.
//  Run:  node next-word-core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  DECK, DECK_SEED, T_RANGE, GREEDY_MISS_PENALTY,
  softmax, argmax, makeRng, sampleIndex,
  surprisalBits, realizedBits, youBits, greedyBits, uniformBits, playStem,
  entropyBits, maxEntropyBits, playDeck, badDist, histogramOver, chiSquare,
  runSelfTest,
} from './next-word-core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const log2 = x => Math.log(x) / Math.LN2;

let pass = 0, total = 0;
const ok = (name, cond, detail = '') => {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (detail ? '  ·  ' + detail : '')); }
  else { console.log('  ✗ ' + name + (detail ? '  ·  ' + detail : '')); }
};

console.log('The Next Word — next-word-core.test.mjs\n');

// ── 1. the shared in-page self-test, at the Node budget ──────────────────────
console.log('— shared runSelfTest() (same claims the in-page pill runs, N=200000) —');
const st = runSelfTest({ Nsample: 200000 });
for (const l of st.lines) ok('[self-test] ' + l.name, l.ok, l.detail);
ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);

const CHI2_CRIT_DOF5 = 20.515;   // χ²(dof=5, α=0.001), Pearson tables

// ── 2. SCORE = CROSS-ENTROPY, recomputed independently at scale ───────────────
console.log('\n— CLAIM 1: the realized-bit total === −Σ log₂ p_realized over the seeded deck —');
{
  // play the deck across MANY temperatures; the model-true meter must always
  // equal an independent recompute of −Σ log₂ p_landed to machine-ε.
  let worstErr = 0, worstT = 0;
  for (let i = 0; i <= 60; i++) {
    const T = Math.pow(10, -2 + i * (4 / 60));   // T ∈ [0.01, 100]
    const { path, totalBits } = playDeck(T, DECK_SEED);
    let manual = 0;
    for (const r of path) manual += -log2(r.p);
    const err = Math.abs(totalBits - manual);
    if (err > worstErr) { worstErr = err; worstT = T; }
  }
  ok('A. total realized bits === −Σ log₂ p_realized to machine-ε across 61 temperatures',
    worstErr <= 1e-12, `max|total−Σ(−log₂p)|=${worstErr.toExponential(3)} (worst at T=${worstT.toFixed(3)})`);

  // every stem's softmax is a probability distribution at every tested T.
  let maxSumErr = 0;
  for (const d of DECK) for (const T of [0.05, 0.5, 1, 2, 50]) {
    const p = softmax(d.logits, T);
    maxSumErr = Math.max(maxSumErr, Math.abs(p.reduce((a, b) => a + b, 0) - 1));
  }
  ok('A. every stem Σp=1 to ~1e-15 across the temperature range', maxSumErr <= 1e-12,
    `max|Σp−1|=${maxSumErr.toExponential(3)}`);
}

// ── 3. SHARED SOFTMAX WARP: cold→argmax, hot→uniform, monotone, over EVERY stem ─
console.log('\n— CLAIM 2: the die IS the temperature bench’s softmax (warp on every stem) —');
{
  let allColdSpike = true, allHotFlat = true, totalViol = 0;
  for (const d of DECK) {
    const n = d.toks.length;
    const am = argmax(d.logits);
    const pCold = softmax(d.logits, 1e-4), pHot = softmax(d.logits, 1e4);
    if (pCold[am] <= 0.999) allColdSpike = false;
    if (Math.max(...pHot.map(x => Math.abs(x - 1 / n))) >= 1e-3) allHotFlat = false;
    let prevMax = Infinity;
    for (let i = 0; i <= 200; i++) {
      const T = Math.pow(10, -2 + i * (4 / 200));
      const mx = Math.max(...softmax(d.logits, T));
      if (mx > prevMax + 1e-12) totalViol++;
      prevMax = mx;
    }
  }
  ok(`B. every stem: cold spikes to the argmax face (p>0.999), hot rounds to 1/|V|, max-face area monotone ↓ (0 violations over ${DECK.length}×201 rungs)`,
    allColdSpike && allHotFlat && totalViol === 0,
    `coldSpike=${allColdSpike} · hotFlat=${allHotFlat} · ${totalViol} monotone-violations`);

  // the knob's law is the SAME as the Temperature Dial bench: H(T) climbs to the
  // uniform ceiling log₂|V| as T→∞ (entropy is the shared meter).
  let maxCeilErr = 0;
  for (const d of DECK) {
    const Hhot = entropyBits(softmax(d.logits, 1e6));
    maxCeilErr = Math.max(maxCeilErr, Math.abs(Hhot - maxEntropyBits(d.toks.length)));
  }
  ok('B. H(T→∞) → log₂|V| ceiling on every stem (shared entropy meter with the Dial)',
    maxCeilErr <= 1e-6, `max|H(∞)−log₂6|=${maxCeilErr.toExponential(3)}`);
}

// ── 4. NEG CONTROL bites at scale, and the gate is non-vacuous ────────────────
console.log('\n— CLAIM 3: the forgotten-denominator control fails ≫crit; correct softmax passes —');
{
  const d = DECK[0], T = 1, N = 200000;
  const p = softmax(d.logits, T), bad = badDist(d.logits, T);
  const badSum = bad.reduce((a, b) => a + b, 0);
  const obs = histogramOver(p, N, DECK_SEED ^ 0xBAD);
  const chiBad = chiSquare(obs, bad, N);     // true draws vs the wrong expectation → explodes
  const chiGood = chiSquare(obs, p, N);      // SAME draws vs the true p → passes
  ok('C. forgotten denominator: Σ≠1 AND χ²_bad ≫ 3×20.515 (the teeth)',
    Math.abs(badSum - 1) > 1e-6 && chiBad > 3 * CHI2_CRIT_DOF5,
    `Σ_bad=${badSum.toFixed(4)} · χ²_bad=${chiBad.toExponential(3)}`);
  ok('C. NON-VACUOUS: the same draws vs the CORRECT p PASS the identical gate (χ²<20.515)',
    chiGood < CHI2_CRIT_DOF5, `χ²_good=${chiGood.toFixed(3)} < 20.515`);
  // bits divergence: the bad "p" mis-scores the realized word on every stem.
  let trueBits = 0, biasBits = 0;
  const rng = makeRng(DECK_SEED);
  for (const stem of DECK) {
    const ps = softmax(stem.logits, T), bd = badDist(stem.logits, T);
    const li = sampleIndex(ps, rng);
    trueBits += -log2(ps[li]); biasBits += -log2(bd[li]);
  }
  ok('C. bits diverge: scoring the realized path against the un-normalized dist ≠ cross-entropy',
    Math.abs(biasBits - trueBits) > 1, `|bits_bad−bits_true|=${Math.abs(biasBits - trueBits).toFixed(2)} > 1`);
}

// ── 5. DETERMINISM: the realized path is reproducible byte-for-byte ───────────
console.log('\n— CLAIM 4: a fixed deck + seeded die → the same realized path —');
{
  const a = playDeck(1, DECK_SEED), b = playDeck(1, DECK_SEED);
  const samePath = a.path.every((r, i) => r.landed === b.path[i].landed && r.p === b.path[i].p);
  ok('D. playDeck(1) byte-identical across two runs (path + per-stem p)',
    samePath && a.totalBits === b.totalBits,
    `landed=[${a.path.map(r => r.landed).join(',')}] · totals ${a.totalBits === b.totalBits ? 'equal' : 'DIFFER'}`);
}

// ── 6. THE THREE DECODERS genuinely diverge (per-decoder bit physics) ─────────
console.log('\n— CLAIM 5: the three decoders pay different bits under their own bets —');
{
  // (a) per-decoder ordering is correct in EXPECTATION over the true die (Gibbs):
  //     a calibrated reader (q=p) pays the entropy floor; greedy pays more;
  //     uniform pays the most over this deck. (The seed-free invariant.)
  let calibrated = 0, greedy = 0, uniform = 0;
  for (const stem of DECK) {
    const p = softmax(stem.logits, 1), n = p.length, mode = argmax(stem.logits);
    for (let i = 0; i < n; i++) {
      calibrated += p[i] * surprisalBits(p, i);
      greedy += p[i] * greedyBits(n, mode, i);
      uniform += p[i] * uniformBits(n);
    }
  }
  ok('E. expected per-decoder bits diverge: calibrated (=entropy floor) < greedy < uniform over the deck',
    calibrated < greedy && greedy < uniform,
    `calibrated=${calibrated.toFixed(2)} < greedy=${greedy.toFixed(2)} < uniform=${uniform.toFixed(2)} bits`);

  // (b) greedy's miss-penalty is FINITE (never ∞/NaN) and worse than uniform.
  const n = 6, mode = 0;
  const gMiss = greedyBits(n, mode, 3), gHit = greedyBits(n, mode, 0), uni = uniformBits(n);
  ok('E. greedy miss pays a BIG but FINITE penalty (> uniform, not ∞) and a hit pays ~0',
    Number.isFinite(gMiss) && gMiss > uni && gHit >= 0 && gHit < 1e-6,
    `miss=${gMiss.toFixed(3)} (= log₂6+${GREEDY_MISS_PENALTY}) > uniform=${uni.toFixed(3)} · hit=${gHit.toExponential(2)}`);

  // (c) YOU's stake-weighted bet rewards a right read and punishes a wrong one.
  const youRight = youBits(n, 2, 2, 5), youWrong = youBits(n, 2, 4, 5), youBlind = youBits(n, null, 4, 5);
  ok('E. YOU: a confident RIGHT read < blind (uniform) < a confident WRONG read (stake cuts both ways)',
    youRight < youBlind && youBlind < youWrong && Math.abs(youBlind - uni) < 1e-12,
    `right=${youRight.toFixed(3)} < blind=${youBlind.toFixed(3)} < wrong=${youWrong.toFixed(3)} bits`);

  // (d) playStem's per-decoder fields agree with the standalone decoder functions.
  const rng = makeRng(DECK_SEED);
  const r = playStem(DECK[0], 1, rng, 2, 5);
  ok('E. playStem fields == the standalone decoder functions on the same landing',
    r.youBits === youBits(r.n, 2, r.landed, 5) && r.greedyBits === greedyBits(r.n, r.mode, r.landed) && r.uniformBits === uniformBits(r.n),
    `landed=${r.landed} · you=${r.youBits.toFixed(2)} greedy=${r.greedyBits.toFixed(2)} uniform=${r.uniformBits.toFixed(2)}`);
}

// ── 7. THE DECK is pinned (a model edit must be loud) ─────────────────────────
console.log('\n— the frozen deck literals are pinned —');
{
  ok('F. the deck is 8 stems, each with exactly 6 candidate tokens & 6 logits',
    DECK.length === 8 && DECK.every(d => d.toks.length === 6 && d.logits.length === 6),
    `${DECK.length} stems · |V|=${DECK[0].toks.length}`);
  ok('F. DECK_SEED, T_RANGE, GREEDY_MISS_PENALTY pinned',
    DECK_SEED === 0xC0FFEE && T_RANGE.LO === 0.01 && T_RANGE.HI === 100 && GREEDY_MISS_PENALTY === 4,
    `seed=0x${DECK_SEED.toString(16).toUpperCase()} · T∈[${T_RANGE.LO},${T_RANGE.HI}] · penalty=${GREEDY_MISS_PENALTY}`);
}

// ── 8. RE-EXTRACTION PARITY — the page core === the module, byte-for-byte ─────
//   Read next-word.html, slice the inline core between the banner sentinels,
//   prove each function body is char-for-char the imported toString(), eval the
//   slice, run ITS runSelfTest → pass-count + ok-for-ok + name-for-name parity,
//   and spot-check cross-boundary values. (Same shape as the 6 sibling tests.)
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'next-word.html'), 'utf8');
  const BEGIN = '// ===== NEXT-WORD CORE (inlined byte-twin of next-word-core.mjs) BEGIN =====';
  const END = '// ===== NEXT-WORD CORE END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in next-word.html', i >= 0 && j > i,
    i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) every named function body is char-for-char the imported toString().
    //     Shared lineage (softmax/argmax/makeRng/sampleIndex) + the NEW score &
    //     decoder functions are ALL proven byte-identical to the .mjs.
    const fns = {
      softmax, argmax, makeRng, sampleIndex,
      surprisalBits, realizedBits, youBits, greedyBits, uniformBits, playStem,
      entropyBits, maxEntropyBits, playDeck, badDist, histogramOver, chiSquare, runSelfTest,
    };
    for (const [name, fn] of Object.entries(fns)) {
      const pageSrc = extractFn(slice, name);
      ok(`(parity)★ inlined ${name}() body is char-for-char the imported ${name}.toString()`,
        norm(pageSrc) === norm(fn.toString()),
        norm(pageSrc) === norm(fn.toString()) ? 'identical bytes' :
          `DRIFT:\n  page: ${JSON.stringify(norm(pageSrc).slice(0, 120))}…\n  mod:  ${JSON.stringify(norm(fn.toString()).slice(0, 120))}…`);
    }

    // (b) the frozen DECK is inlined exactly (a model edit can't drift the page
    //     from the proof). Read the DECK literal block straight from the .mjs
    //     SOURCE (not a reserialization — JS would drop `-1.0`→`-1`) and prove
    //     every one of those source lines appears verbatim in the page slice.
    const moduleSrc = readFileSync(join(__dir, 'next-word-core.mjs'), 'utf8');
    const dBeg = moduleSrc.indexOf('export const DECK = [');
    const dEnd = moduleSrc.indexOf('];', dBeg);
    const deckRows = moduleSrc.slice(moduleSrc.indexOf('[', dBeg) + 1, dEnd)
      .split('\n').map(s => s.trim()).filter(s => s.startsWith('{ ctx'));
    const allRowsPresent = deckRows.length === DECK.length && deckRows.every(row => slice.includes(row));
    ok('(parity)★ every DECK stem row (ctx + toks + frozen logits) string-matches the .mjs source in the page slice',
      allRowsPresent && slice.includes('DECK_SEED = 0xC0FFEE') && slice.includes('GREEDY_MISS_PENALTY = 4'),
      allRowsPresent ? `all ${deckRows.length} stem rows + seed + penalty present verbatim` : 'a stem row drifted');

    // (c) evaluate the slice and run ITS runSelfTest → full parity.
    let pageRes = null, evalErr = null, PageCore = null;
    const RET = '\n;return { runSelfTest, softmax, argmax, makeRng, sampleIndex, surprisalBits, realizedBits, youBits, greedyBits, uniformBits, playStem, entropyBits, maxEntropyBits, playDeck, badDist, histogramOver, chiSquare, DECK, DECK_SEED, T_RANGE, GREEDY_MISS_PENALTY };';
    try {
      const factory = new Function(slice + RET);
      PageCore = factory();
      pageRes = PageCore.runSelfTest({ Nsample: 20000 });
    } catch (e) { evalErr = e; }
    ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');

    if (pageRes) {
      const modRes = runSelfTest({ Nsample: 20000 });
      ok('(parity)★ inline runSelfTest pass-count == module pass-count (same args)',
        pageRes.pass === modRes.pass && pageRes.total === modRes.total,
        `in-page ${pageRes.pass}/${pageRes.total}  ·  module ${modRes.pass}/${modRes.total}`);
      let agree = pageRes.lines.length === modRes.lines.length;
      for (let k = 0; agree && k < pageRes.lines.length; k++)
        if (pageRes.lines[k].ok !== modRes.lines[k].ok || pageRes.lines[k].name !== modRes.lines[k].name) agree = false;
      ok('(parity)★ every named claim agrees ok-for-ok AND name-for-name (page vs module)', agree,
        agree ? `all ${pageRes.lines.length} lines identical` : 'a line disagreed');

      // (d) cross-boundary spot values: playDeck(1) & softmax(DECK[0].logits,1).
      const aPage = PageCore.playDeck(1), aMod = playDeck(1);
      const pPage = PageCore.softmax(PageCore.DECK[0].logits, 1), pMod = softmax(DECK[0].logits, 1);
      ok('(parity)★ cross-boundary: playDeck(1).totalBits & softmax(DECK[0],1) equal the module values',
        aPage.totalBits === aMod.totalBits && pPage.every((v, k) => v === pMod[k]),
        `totalBits=${aPage.totalBits.toFixed(6)} · p₀=${pPage[0].toFixed(6)}`);
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
