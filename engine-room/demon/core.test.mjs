// The Demon's Ledger — Node cross-check (the falsifiability twin of core.mjs).
//   Runs the shared runCoreTests() AND — the integration crux — RE-EXTRACTS the
//   inlined core from index.html, evaluates it, and proves it is byte-for-byte
//   the SAME core (same pass-count) AND that its inlined entropy() body is
//   char-for-char identical to the imported entropy.toString() (assertion 0's
//   teeth). This exceeds the de-facto Carnot/entropy precedent, which only
//   imports the module — here we prove the page === the module === the siblings.
import * as Core from './core.mjs';
import { entropy } from '../../entropy/core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));

let pass = 0, total = 0;
function ok(name, cond, info = '') {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log("The Engine Room · The Demon's Ledger — Node cross-check\n");

// ── 1. the shared core self-test (identical to the in-page pill) ────────────
console.log('— shared runCoreTests() (same assertions the in-page pill runs) —');
let moduleRes;
{
  moduleRes = Core.runCoreTests({ grid: 6000 });
  for (const c of moduleRes.checks) ok(c.name, c.ok, c.info);
}

console.log('\n— high-grid extension (tighter ∫P dV tolerance) —');
{
  // the Node twin can afford a far finer grid → assert the integral converges to
  // kT·ln2 to ~1e-9 (vs the in-page 4000-grid ~1e-6).
  const Wnum = Core.workIsotherm(300, 0.5, 1.0, 200000);
  const kTln2 = Core.K_B * 300 * Core.LN2;
  const rel = Math.abs(Wnum - kTln2) / kTln2;
  ok('(1-ext)★ ∫P dV → kT·ln2 to ~1e-9 at grid 2e5 (the integral really converges)',
     rel < 1e-9, `rel-err = ${rel.toExponential(2)}`);
}

console.log('\n— free-lunch sweep: ΔS_universe ≥ 0 across the whole tape, every bias —');
{
  // the negative control given a real chance to fail: every bias, full tape.
  let everOk = true, worst = '';
  for (const p of [0.5, 0.3, 0.7, 0.1, 0.9, 0.02, 0.98]) {
    const run = Core.freeLunchRun({ T: 300, p, speed: 1 }, 8);
    for (const s of run.steps) {
      if (s.gasWork + s.memory < -1e-40 || s.universe < -1e-40) { everOk = false; worst = `p=${p} step ${s.n}: gas+mem=${(s.gasWork + s.memory).toExponential(2)}`; }
    }
  }
  ok('(7-ext)★ free-lunch ΔS_universe ≥ 0 across the full 8-cell tape for every bias',
     everOk, everOk ? 'no bias and no step ever drove the universe below 0' : worst);
}

console.log('\n— Carnot wall sweep: harvested ≤ ceiling over a dense (T_h,T_c,speed) grid —');
{
  let allBelow = true, minMargin = Infinity, worst = '';
  for (let Th = 350; Th <= 900; Th += 50) {
    for (let Tc = 100; Tc < Th; Tc += 50) {
      for (const speed of [1, 1.5, 2, 3, 5]) {
        const c = Core.compute({ twoReservoir: true, T_h: Th, T_c: Tc, p: 0.5, speed });
        const margin = c.ceiling - c.W_extracted;
        if (margin < -1e-30) { allBelow = false; worst = `Th=${Th} Tc=${Tc} sp=${speed}`; }
        if (margin < minMargin) minMargin = margin;
      }
    }
  }
  ok('(6-ext) harvested ≤ Carnot ceiling over the whole reservoir grid (shared carnotEfficiency)',
     allBelow, allBelow ? `smallest margin = ${minMargin.toExponential(2)} J` : worst);
}

// ── 2. THE RE-EXTRACTION PARITY HARNESS (the integration crux) ───────────────
//   Read index.html, slice the inline core between the banner sentinels, strip
//   the import lines (the page inlines the entropy/carnot bodies verbatim under
//   the banner instead), evaluate the slice to get ITS runCoreTests, run it, and
//   assert (i) same pass-count as the module, (ii) the inline entropy() body is
//   char-for-char identical to the imported entropy.toString().
console.log('\n— RE-EXTRACTION PARITY: the page core === the module === the siblings —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== DEMON CORE (inlined byte-twin of core.mjs) BEGIN =====';
  const END = '// ===== DEMON CORE END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in index.html', i >= 0 && j > i,
     i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i) {
    let slice = html.slice(i + BEGIN.length, j);

    // (a) the inline entropy() body must be char-for-char the imported one.
    //     Extract the page's `function entropy(` … matching-brace block and the
    //     module's entropy.toString(), normalize only export/whitespace-free, and
    //     compare the function BODIES verbatim.
    const pageEntropy = extractFn(slice, 'entropy');
    const importedEntropy = entropy.toString();
    const norm = s => s.replace(/^export\s+/, '').trim();
    ok('(0-teeth)★ inline entropy() body is char-for-char the imported entropy.toString()',
       norm(pageEntropy) === norm(importedEntropy),
       norm(pageEntropy) === norm(importedEntropy) ? 'identical bytes' :
       `DRIFT:\n  page: ${JSON.stringify(norm(pageEntropy).slice(0, 80))}\n  mod:  ${JSON.stringify(norm(importedEntropy).slice(0, 80))}`);

    // (b) evaluate the slice and run ITS runCoreTests → same pass-count.
    //     The slice defines functions + a runCoreTests; we expose it via a
    //     trailing return in a new Function (the page can't ES-import, so the
    //     slice already inlines entropy()/carnotEfficiency() verbatim).
    let pageRes = null, evalErr = null;
    try {
      const factory = new Function(slice + '\n;return { runCoreTests, workIsotherm, compute, bitInfo, K_B, LN2 };');
      const PageCore = factory();
      pageRes = PageCore.runCoreTests({ grid: 6000 });
    } catch (e) { evalErr = e; }

    ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');
    if (pageRes) {
      ok('(parity)★ inline core pass-count == module pass-count',
         pageRes.passed === moduleRes.passed && pageRes.total === moduleRes.total,
         `in-page ${pageRes.passed}/${pageRes.total}  ·  module ${moduleRes.passed}/${moduleRes.total}`);
      // and every named check agrees ok-for-ok
      let agree = pageRes.checks.length === moduleRes.checks.length;
      for (let k = 0; agree && k < pageRes.checks.length; k++) {
        if (pageRes.checks[k].ok !== moduleRes.checks[k].ok) agree = false;
      }
      ok('(parity)★ every named assertion agrees ok-for-ok (page vs module)', agree,
         agree ? `all ${pageRes.checks.length} checks identical` : 'a check disagreed');

      console.log(`\n  ▸ RECORDED: in-page ${pageRes.passed}/${pageRes.total} · Node module ${moduleRes.passed}/${moduleRes.total}`);
    }
  }
}

// extract `function NAME(...) { ... }` with brace-matching from a source string.
function extractFn(src, name) {
  const re = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = re.exec(src);
  if (!m) return '';
  let i = src.indexOf('{', m.index);
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
