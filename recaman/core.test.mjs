// ============================================================================
//  Node-side falsifiability harness for Recamán's Footsteps.
//  Runs the shared in-page self-test PLUS deeper Node-only assertions at scale
//  (steps up to 100000 — far past what the in-page pill can afford), THEN
//  re-extracts the inlined core from index.html and proves it is byte-for-byte
//  the SAME core (parity). Run:  node core.test.mjs  →  MUST be ALL GREEN.
// ============================================================================
import {
  VARIANTS, STEP_DEFAULT, STEP_CAP, A005132_PREFIX,
  nextTerm, generate, arcGeom, stepMag, runSelfTest,
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

console.log("Recamán's Footsteps — core.test.mjs\n");

// ── (A) the shared in-page self-test, at the Node budget (steps=10000) ───────
console.log('— shared runSelfTest() (same claims the in-page pill runs, steps=10000) —');
const st = runSelfTest(10000);
for (const l of st.lines) ok('[self-test] ' + l.name, l.ok, l.detail);
ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);

const BIG = 100000;

// ── (B) deeper scale: the three invariants + the honest stats, anchored ──────
console.log('\n— (B) deeper scale (steps=100000): invariants hold, stats anchored —');
{
  const g = generate(BIG, 'recaman');

  // (1) magnitude law: 0 violations
  let magBad = 0;
  for (const j of g.jumps) if (j.mag !== j.n) magBad++;
  ok(`magnitude law holds at scale: every |Δ| === n, ${BIG} jumps, 0 violations`, magBad === 0, `${magBad} violations`);

  // (2) non-negativity: 0 negatives
  let neg = 0;
  for (const v of g.values) if (v < 0) neg++;
  ok('non-negativity holds at scale: 0 negatives', neg === 0, `${neg} negatives`);

  // (3) the back-step gate: firstBackOntoVisited === null
  ok('back-step gate holds at scale: firstBackOntoVisited === null (no retreat onto old ground)',
     g.firstBackOntoVisited === null, JSON.stringify(g.firstBackOntoVisited));

  // forward revisits === 25748 (anchored exact); first dup at step 24, value 42, prevStep 20
  const fwdRevisits = (BIG + 1) - g.distinctCount;
  ok('honest stat anchored: forward revisits === 25748 at 100000 steps', fwdRevisits === 25748, `${fwdRevisits}`);
  ok('honest stat anchored: first forward revisit is a(24)=a(20)=42 (the OEIS-documented one)',
     g.firstDup && g.firstDup.step === 24 && g.firstDup.value === 42 && g.firstDup.prevStep === 20,
     JSON.stringify(g.firstDup));

  // distinctCount === 74253 (anchored stat)
  ok('honest stat anchored: distinctCount === 74253 at 100000 steps', g.distinctCount === 74253, `${g.distinctCount}`);

  // OEIS prefix verbatim
  const g27 = generate(27, 'recaman');
  ok('OEIS A005132 prefix verbatim: generate(27).values === the 28 pinned terms',
     g27.values.length === A005132_PREFIX.length && g27.values.every((v, i) => v === A005132_PREFIX[i]),
     `[${g27.values.slice(0, 6).join(',')}…${g27.values.slice(-3).join(',')}]`);

  // integer-exact + max under MAX_SAFE_INTEGER even at 100k
  let nonInt = 0, over = 0;
  for (const v of g.values){ if (!Number.isInteger(v)) nonInt++; if (Math.abs(v) > Number.MAX_SAFE_INTEGER) over++; }
  ok('integer-exact at scale: every a(n) an integer ≤ MAX_SAFE_INTEGER',
     nonInt === 0 && over === 0, `max a = ${g.maxValue.toLocaleString()}, ${nonInt} non-int, ${over} overflow`);
}

// ── (C) neg-controls with teeth at scale ─────────────────────────────────────
console.log('\n— (C) negative controls have teeth (at scale) —');
{
  const ga = generate(BIG, 'always');
  ok("'always' (gate OFF): a back step lands on visited a(0)=0 at step 3 — invariant #3 fails BY DESIGN",
     ga.firstBackOntoVisited !== null && ga.firstBackOntoVisited.step === 3 && ga.firstBackOntoVisited.value === 0,
     JSON.stringify(ga.firstBackOntoVisited));
  // and 'always' is genuinely a different sequence than recamán (teeth check)
  const gr = generate(64, 'recaman'), ga64 = generate(64, 'always');
  ok("'always' diverges from recamán (the gate matters): a(3) differs (0 vs 6)",
     gr.values[3] !== ga64.values[3], `recaman a(3)=${gr.values[3]} · always a(3)=${ga64.values[3]}`);

  const gt = generate(BIG, 'twon');
  let all2n = true, anyN = false;
  for (const j of gt.jumps){ if (j.mag !== 2 * j.n) all2n = false; if (j.mag === j.n) anyN = true; }
  ok("'twon' (±2n step): every magnitude === 2n ≠ n — invariant #1 fails BY DESIGN", all2n && !anyN,
     `all2n=${all2n} anyEqualsN=${anyN}`);
  // nextTerm honours the variant table (no hard-coded step anywhere)
  const seen = new Set([0]);
  ok('nextTerm reads VARIANTS.step: twon jump magnitude at n=5 is 2·5=10',
     nextTerm(0, 5, seen, 'twon').mag === 10, `mag=${nextTerm(0, 5, seen, 'twon').mag}`);
}

// ── (D) geometry oracle is pixel-blind & consistent with the rule ────────────
console.log('\n— (D) arcGeom oracle: world-space, derived only from the values —');
{
  const g = generate(40, 'recaman');
  let bad = 0, firstBad = '';
  for (let n = 1; n <= 40; n++){
    const ag = arcGeom(g.values, n);
    // radius is exactly half the magnitude; centre is the midpoint; back flags a retreat
    const expectR = Math.abs(g.values[n] - g.values[n - 1]) / 2;
    const expectBack = g.values[n] < g.values[n - 1];
    const expectAbove = n % 2 === 1;
    if (ag.rWorld !== expectR || ag.back !== expectBack || ag.above !== expectAbove ||
        ag.cxWorld !== (Math.min(g.values[n - 1], g.values[n]) + Math.max(g.values[n - 1], g.values[n])) / 2){
      if (!bad) firstBad = `step ${n}`; bad++;
    }
  }
  ok('arcGeom: radius=½|Δ|, centre=midpoint, above by parity, back=retreat — all derived, none placed',
     bad === 0, bad === 0 ? '40 arcs consistent' : `${bad} bad (first ${firstBad})`);
  // for the TRUE rule, rWorld === n/2 exactly
  let rBad = 0;
  for (let n = 1; n <= 40; n++){ if (arcGeom(g.values, n).rWorld !== n / 2) rBad++; }
  ok('arcGeom: for the true rule rWorld === n/2 exactly (semicircle of radius n/2)', rBad === 0, `${rBad} off`);
  ok('stepMag(n) === the variant step: stepMag(7,"recaman")=7, stepMag(7,"twon")=14',
     stepMag(7, 'recaman') === 7 && stepMag(7, 'twon') === 14, '');
}

// ── (E) determinism ──────────────────────────────────────────────────────────
console.log('\n— (E) determinism: seed-free, byte-identical —');
{
  const a = generate(2000, 'recaman'), b = generate(2000, 'recaman');
  ok('generate(2000) byte-identical across two calls (no RNG, no shared state)',
     a.values.join(',') === b.values.join(',') && a.distinctCount === b.distinctCount,
     `distinct ${a.distinctCount}, max ${a.maxValue}`);
  ok('constants pinned: STEP_DEFAULT=1000, STEP_CAP=100000, three variants',
     STEP_DEFAULT === 1000 && STEP_CAP === 100000 && Object.keys(VARIANTS).length === 3,
     Object.keys(VARIANTS).join(','));
}

// ── (F) RE-EXTRACTION PARITY — the page core === the module, byte-for-byte ────
//   Read index.html, slice the inline core between the banner sentinels, eval it,
//   run ITS runSelfTest at the same steps → same pass-count AND ok-for-ok per
//   line, AND assert the inlined nextTerm body is char-for-char the imported
//   nextTerm.toString().
console.log('\n— (F) RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== RECAMAN CORE (inlined byte-twin of core.mjs) BEGIN =====';
  const END = '// ===== RECAMAN CORE END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in index.html', i >= 0 && j > i,
     i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i){
    const slice = html.slice(i + BEGIN.length, j);

    // (a) the inlined nextTerm() body is char-for-char the imported toString().
    const pageNext = extractFn(slice, 'nextTerm');
    const importedNext = nextTerm.toString();
    const norm = s => s.replace(/^export\s+/, '').trim();
    ok('(parity)★ inlined nextTerm() body is char-for-char the imported nextTerm.toString()',
       norm(pageNext) === norm(importedNext),
       norm(pageNext) === norm(importedNext) ? 'identical bytes — same rule' :
         `DRIFT:\n  page: ${JSON.stringify(norm(pageNext))}\n  mod:  ${JSON.stringify(norm(importedNext))}`);

    // also pin generate() — the page's single source of truth
    const pageGen = extractFn(slice, 'generate');
    ok('(parity)★ inlined generate() body is char-for-char the imported generate.toString()',
       norm(pageGen) === norm(generate.toString()), norm(pageGen) === norm(generate.toString()) ? 'identical' : 'DRIFT');

    // (b) evaluate the slice and run ITS runSelfTest → same pass-count + ok-for-ok.
    let pageRes = null, evalErr = null, PageCore = null;
    const RET = '\n;return { runSelfTest, generate, nextTerm, arcGeom, stepMag, VARIANTS, A005132_PREFIX, STEP_DEFAULT, STEP_CAP };';
    try {
      const factory = new Function(slice + RET);
      PageCore = factory();
      pageRes = PageCore.runSelfTest(10000);
    } catch (e) { evalErr = e; }

    ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');

    if (pageRes){
      const modRes = runSelfTest(10000);
      ok('(parity)★ inline runSelfTest pass-count == module pass-count (same steps)',
         pageRes.pass === modRes.pass && pageRes.total === modRes.total,
         `in-page ${pageRes.pass}/${pageRes.total}  ·  module ${modRes.pass}/${modRes.total}`);
      let agree = pageRes.lines.length === modRes.lines.length;
      for (let k = 0; agree && k < pageRes.lines.length; k++){
        if (pageRes.lines[k].ok !== modRes.lines[k].ok || pageRes.lines[k].name !== modRes.lines[k].name) agree = false;
      }
      ok('(parity)★ every named claim agrees ok-for-ok AND name-for-name (page vs module)', agree,
         agree ? `all ${pageRes.lines.length} lines identical` : 'a line disagreed');

      // (c) re-extracted generate(27).values === A005132_PREFIX byte-for-byte.
      const pageVals = PageCore.generate(27, 'recaman').values;
      ok('(parity)★ re-extracted generate(27).values === A005132 prefix verbatim',
         pageVals.length === A005132_PREFIX.length && pageVals.every((v, k) => v === A005132_PREFIX[k]),
         `[${pageVals.slice(0, 6).join(',')}…]`);
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
