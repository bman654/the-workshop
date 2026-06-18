// ============================================================================
//  Node-side falsifiability harness for The Cat's-Cradle Weaver — the string-figure
//  MOVE-GRAMMAR bench. Runs the shared in-page self-test runSelfTest() (the SAME
//  twelve claims the page pill runs), PLUS deeper Node-only assertions (the canonical
//  Opening→Manger walk is forced, illegal pickups leave the string byte-unchanged,
//  the LOAD-BEARING neg-control proves a vacuous renderer that accepts ANY pickup
//  would FAIL the grammar's reject set, loop-equality is rotation+direction
//  invariant), THEN re-extracts the inlined core from index.html between the
//  sentinels and proves it is byte-for-byte the SAME core (parity — the estate
//  standard, mirroring knot-tabulator/knot-core.test.mjs).
//  Run:  node cradle-core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  PEGS, canonLoop, canonState, pegsOf, loopsOn,
  opening, CATALOGUE, CATALOGUE_BY_ID, figureKey, FIG_KEYS, FIG_TITLE,
  legalMoves, isLegal, applyMove, vacuousApply, CANON_PATH, runSelfTest,
} from './cradle-core.mjs';
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

console.log("The Cat's-Cradle Weaver — cradle-core.test.mjs\n");

// ── 1. THE SHARED IN-PAGE SELF-TEST (the same twelve claims the pill runs) ─────
console.log('— shared runSelfTest() (the SAME claims the in-page chip runs) —');
{
  const st = runSelfTest();
  for (const c of st.checks) ok('[self-test] ' + c.name, c.ok);
  ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);
  ok('[self-test] the chip reports exactly 12 checks (the published claim)', st.total === 12, `${st.total}`);
}

// ── 2. THE CANONICAL WALK is a FORCED chain of legal moves Opening→Manger. ─────
console.log('\n— the canonical walk is forced: one legal pickup per figure —');
{
  let s = opening();
  ok('the Opening names "opening"', figureKey(s) === 'opening');
  const formed = [];
  let allForced = true;
  for (const id of CANON_PATH) {
    const legal = legalMoves(s).map(m => m.id);
    if (!(legal.length === 1 && legal[0] === id)) allForced = false;
    const r = applyMove(s, id);
    s = r.state;
    formed.push(figureKey(s));
  }
  ok('exactly one legal pickup at every figure (the path is forced, not a choice)', allForced,
     'each figure offers a single next move');
  ok('the walk forms Cradle → Soldier\'s Bed → Candles → Manger in order',
     formed.join(',') === 'cradle,soldiersbed,candles,manger', formed.join(' → '));
  ok('the Manger is terminal — no legal pickup remains', legalMoves(s).length === 0);
}

// ── 3. ILLEGAL pickups are REJECTED and leave the string BYTE-UNCHANGED. ───────
console.log('\n— illegal pickups are rejected; the string does not move —');
{
  const s = opening();
  const before = canonState(s);
  // every move except the one legal 'cradle' must be rejected from the Opening.
  const illegal = CATALOGUE.map(m => m.id).filter(id => id !== 'cradle');
  let allRejected = true, allUnchanged = true;
  for (const id of illegal) {
    const r = applyMove(s, id);
    if (r.ok) allRejected = false;
    if (canonState(r.state) !== before) allUnchanged = false;
  }
  ok('every illegal pickup from the Opening is rejected (ok:false)', allRejected, illegal.join(', '));
  ok('a rejected pickup returns the string canonically UNCHANGED', allUnchanged);
  // you cannot skip ahead: Manger is illegal until Candles is reached.
  const afterCradle = applyMove(opening(), 'cradle').state;
  ok('you cannot skip ahead — Manger is illegal before Candles',
     !isLegal(opening(), 'manger') && !isLegal(afterCradle, 'manger'));
}

// ── 4. THE LOAD-BEARING NEG-CONTROL — a vacuous renderer that accepts ANY pickup
//      DISAGREES with the real grammar on the reject set (the teeth bite). If a
//      do-nothing grammar accepted everything, this would FAIL — so the suite
//      cannot pass vacuously. We prove it OVER THE WHOLE reject set, not one case. ─
console.log('\n— NEG-CONTROL (the teeth): a vacuous renderer fails the grammar —');
{
  // gather every (state, illegalId) pair along the canonical walk.
  const pairs = [];
  let s = opening();
  const all = CATALOGUE.map(m => m.id);
  for (let i = 0; i <= CANON_PATH.length; i++) {
    for (const id of all) if (!isLegal(s, id)) pairs.push([s, id]);
    if (i < CANON_PATH.length) s = applyMove(s, CANON_PATH[i]).state;
  }
  let realRejects = 0, vacAccepts = 0, disagree = 0;
  for (const [st, id] of pairs) {
    const real = applyMove(st, id);
    const vac = vacuousApply(st, id);
    if (!real.ok) realRejects++;
    if (vac.ok) vacAccepts++;
    if (real.ok !== vac.ok) disagree++;
  }
  ok('there are real illegal pickups to test (non-vacuous reject set)', pairs.length > 0, `${pairs.length} (state,id) pairs`);
  ok('the real grammar REJECTS every one of them', realRejects === pairs.length, `${realRejects}/${pairs.length} rejected`);
  ok('the vacuous renderer ACCEPTS every one of them (it never checks the precondition)',
     vacAccepts === pairs.length, `${vacAccepts}/${pairs.length} accepted`);
  ok('★ the teeth bite: real grammar and vacuous renderer DISAGREE on the entire reject set',
     disagree === pairs.length && pairs.length > 0, `${disagree}/${pairs.length} disagree — a do-nothing grammar would fail here`);
}

// ── 5. LOOP EQUALITY is rotation + direction invariant (a loop has no start). ──
console.log('\n— canonical loop equality: rotation + direction invariant —');
{
  const a = ['LT','RT','RM','LM'];
  ok('rotation-invariant: starting the loop anywhere is the same loop',
     canonLoop(a) === canonLoop(['RM','LM','LT','RT']));
  ok('direction-invariant: tracing the loop either way is the same loop',
     canonLoop(a) === canonLoop(['LM','RM','RT','LT']));
  ok('a DIFFERENT loop canonicalises differently (non-vacuous equality)',
     canonLoop(a) !== canonLoop(['LT','RT','RI','LI']));
  // every figure on the path has a distinct loop-set (the dictionary is sound).
  let s = opening(); const keys = new Set([canonState(s)]); let distinct = true;
  for (const id of CANON_PATH) { s = applyMove(s, id).state; const k = canonState(s); if (keys.has(k)) distinct = false; keys.add(k); }
  ok('every figure on the canonical path has a DISTINCT loop-set', distinct, `${keys.size} distinct states`);
}

// ── 6. THE CATALOGUE / FIGURE-KEY round-trips: each figure names itself. ───────
console.log('\n— figureKey round-trips: each catalogued state names itself —');
{
  let s = opening();
  let allNamed = figureKey(s) === 'opening';
  for (const id of CANON_PATH) { s = applyMove(s, id).state; if (figureKey(s) !== id) allNamed = false; }
  ok('every state on the walk names exactly its own figure id', allNamed);
  // an unrecognised loop-set is honestly 'unknown' (no false naming).
  ok('an unrecognised loop-set names "unknown" (no false positive)',
     figureKey({ loops: [{ pegs: ['LT','RT'], tag: 'x' }] }) === 'unknown');
  ok('FIG_TITLE covers every catalogued figure + opening + unknown',
     ['opening', ...CANON_PATH, 'unknown'].every(k => typeof FIG_TITLE[k] === 'string'));
}

// ── 7. RE-EXTRACTION PARITY — the page core === the module, byte-for-byte. ────
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== CRADLE CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== CRADLE CORE (inlined byte-twin) END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in index.html', i >= 0 && j > i,
     i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) ★ each inlined function body === imported fn.toString() char-for-char.
    const fnPairs = [
      ['canonLoop', canonLoop], ['canonState', canonState], ['pegsOf', pegsOf], ['loopsOn', loopsOn],
      ['opening', opening], ['figureKey', figureKey], ['legalMoves', legalMoves], ['isLegal', isLegal],
      ['applyMove', applyMove], ['vacuousApply', vacuousApply], ['runSelfTest', runSelfTest],
    ];
    let fdrift = '';
    for (const [name, fn] of fnPairs) {
      const pageBody = extractFn(slice, name);
      if (norm(pageBody) !== norm(fn.toString())) { fdrift = name; break; }
    }
    ok('(parity)★ every inlined FUNCTION body is char-for-char the imported core (grammar/legality/oracle/neg-control)',
       fdrift === '', fdrift === '' ? `all ${fnPairs.length} functions byte-identical` : `DRIFT in ${fdrift}`);

    // (b) ★ the load-bearing CONST tables (PEGS, CATALOGUE, CANON_PATH, FIG_TITLE)
    //     are present verbatim in the inlined slice — the grammar's data is twinned too.
    const constSnippets = [
      ['PEGS', "const PEGS = Object.freeze(['LT','LI','LM','LR','LP','RP','RR','RM','RI','RT']);"],
      ['CANON_PATH', "const CANON_PATH = ['cradle','soldiersbed','candles','manger'];"],
      ["CATALOGUE first id", "id:'cradle', label:'Form the Cradle', seq:1,"],
      ["CATALOGUE last id", "id:'manger', label:'The Manger (Diamonds)', seq:4,"],
    ];
    let cdrift = '';
    for (const [name, snip] of constSnippets) { if (slice.indexOf(snip) < 0) { cdrift = name; break; } }
    ok('(parity)★ the inlined CONST tables (PEGS · CANON_PATH · CATALOGUE) are present verbatim',
       cdrift === '', cdrift === '' ? 'all const tables twinned' : `MISSING ${cdrift}`);

    // (c) evaluate the slice and run ITS runSelfTest → same pass-count + ok-for-ok.
    let pageRes = null, evalErr = null;
    const RET = '\n;return { runSelfTest };';
    try {
      const factory = new Function(slice + RET);
      const PageCore = factory();
      pageRes = PageCore.runSelfTest();
    } catch (e) { evalErr = e; }
    ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');

    if (pageRes) {
      const modRes = runSelfTest();
      ok('(parity)★ inline runSelfTest pass-count == module pass-count (the chip count == the Node count)',
         pageRes.pass === modRes.pass && pageRes.total === modRes.total,
         `in-page ${pageRes.pass}/${pageRes.total}  ·  module ${modRes.pass}/${modRes.total}`);
      let agree = pageRes.checks.length === modRes.checks.length;
      for (let k = 0; agree && k < pageRes.checks.length; k++) {
        if (pageRes.checks[k].ok !== modRes.checks[k].ok || pageRes.checks[k].name !== modRes.checks[k].name) agree = false;
      }
      ok('(parity)★ every named claim agrees ok-for-ok AND name-for-name (page vs module)', agree,
         agree ? `all ${pageRes.checks.length} lines identical` : 'a line disagreed');
    }
  }
}

// extract `function NAME(...) { ... }` with brace-matching from a source string.
// Skips the PARAMETER LIST first (matching its parentheses) so a destructuring
// parameter doesn't fool the body-brace finder. (Same extractor as knot-core.test.)
function extractFn(src, name) {
  const re = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = re.exec(src);
  if (!m) return '';
  let p = src.indexOf('(', m.index);
  let pd = 0, k = p;
  for (; k < src.length; k++) {
    if (src[k] === '(') pd++;
    else if (src[k] === ')') { pd--; if (pd === 0) { k++; break; } }
  }
  let i = src.indexOf('{', k);
  if (i < 0) return '';
  let depth = 0, b = i;
  for (; b < src.length; b++) {
    if (src[b] === '{') depth++;
    else if (src[b] === '}') { depth--; if (depth === 0) { b++; break; } }
  }
  return src.slice(m.index, b);
}

console.log(`\n${pass}/${total} ${pass === total ? '✓ ALL GREEN' : '✗ FAILURES'}`);
process.exit(pass === total ? 0 : 1);
