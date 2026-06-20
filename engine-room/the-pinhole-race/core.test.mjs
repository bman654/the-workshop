// The Pinhole Race — Node cross-check (the falsifiability twin of core.mjs).
//   Runs the shared runCoreTests() at a HIGHER N (tighter band, same KSIG
//   thresholds), AND — the integration crux — RE-EXTRACTS the inlined core from
//   index.html, evaluates it, and proves the page core === the module core (same
//   pass-count, every named check agreeing ok-for-ok). There is NO cross-wing
//   import here, so page-core === module-core IS the parity proof (no entropy-body
//   char test à la the Demon — there is no imported body to char-match).
import * as Core from './core.mjs';
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

console.log('The Engine Room · The Pinhole Race — Node cross-check\n');

// ── 1. the shared core self-test (identical to the in-page pill), HIGHER N ────
console.log('— shared runCoreTests() at N=2e6 (same assertions the in-page pill runs, tighter band) —');
let moduleRes;
{
  moduleRes = Core.runCoreTests({ N: 2_000_000 });
  for (const c of moduleRes.checks) ok(c.name, c.ok, c.info);
}

// ── high-N FIT sweep: every seed lands inside its stated √N band ─────────────
console.log('\n— FIT sweep: seeded escape-ratio → √(m_h/m_l) within ±KSIG·band, dense masses & seeds —');
{
  const N = 2_000_000;
  let everOut = false, worst = '', maxDevSig = 0;
  for (const [m_l, m_h] of [[2, 32], [1, 4], [4, 29], [1, 16], [7, 28], [3, 30]]) {
    for (const seed of [1, 2, 3, 7, 11, 19, 101]) {
      const r = Core.simulateEscapes({ m_l, m_h, N, seed });
      const dev = Math.abs(r.ratio - r.predicted);
      const sig = dev / r.band;
      if (sig > maxDevSig) maxDevSig = sig;
      if (dev > Core.KSIG * r.band) { everOut = true; worst = `m ${m_l}:${m_h} seed ${seed}: ${sig.toFixed(2)}σ > ${Core.KSIG}`; }
    }
  }
  ok(`(FIT-ext)★ 42 (mass,seed) runs all inside ±${Core.KSIG}·band at N=${N} (sampling converges honestly)`,
     !everOut, everOut ? worst : `worst deviation ${maxDevSig.toFixed(2)}σ over 42 runs (band = ratio·√(1/cl+1/ch))`);
}

// ── EXACT sweep: the closed form holds across the whole continuous mass dial ──
console.log('\n— EXACT sweep: r_l/r_h === √(m_h/m_l) to <1e-9 across the continuous mass dial —');
{
  let worst = 0, where = '';
  for (let m_l = 1; m_l <= 32; m_l += 0.5) {
    for (let m_h = m_l; m_h <= 32; m_h += 0.5) {
      const derived = Core.effusionRate(1, Core.T_LOCKED, m_l, Core.A_PINHOLE) /
                      Core.effusionRate(1, Core.T_LOCKED, m_h, Core.A_PINHOLE);
      const closed = Math.sqrt(m_h / m_l);
      const rel = Math.abs(derived - closed) / closed;
      if (rel > worst) { worst = rel; where = `m_l=${m_l} m_h=${m_h}`; }
    }
  }
  ok('(EXACT-ext)★ derived effusion ratio === √(m_h/m_l) to <1e-9 over the full continuous dial',
     worst < 1e-9, `worst rel-err ${worst.toExponential(2)} @ ${where}`);
}

// ── 2. THE RE-EXTRACTION PARITY HARNESS (the integration crux) ───────────────
//   Read index.html, slice the inline core between the banner sentinels, eval it
//   (new Function factory), run ITS runCoreTests and assert (i) same pass-count
//   as the module, (ii) every named check agrees ok-for-ok. The slice is the
//   byte-twin of core.mjs (export-stripped); there is no import to char-match.
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core (byte-twin) —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== PINHOLE-RACE CORE (inlined byte-twin of core.mjs) BEGIN =====';
  const END = '// ===== PINHOLE-RACE CORE END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in index.html', i >= 0 && j > i,
     i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS — has forge built index.html?');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);

    // the ws.js include must NOT appear inside the byte-twin slice (the #208 leak
    // guard at the slice level — the include lives AFTER the core, never within it).
    ok('the byte-twin slice contains no ws.js / forge directive leakage',
       !/forge:include/.test(slice) && !/\bWS\./.test(slice),
       'core slice is pure — ws.js include sits after the END sentinel');

    // (0-teeth)★ BYTE-IDENTITY: the inline slice is char-for-char the module's
    //   body (header banner stripped, every leading `export ` removed). This is
    //   the strongest form of the parity proof — page core IS the module core,
    //   not merely "agrees on pass-count". (The Demon char-matches the imported
    //   entropy body; with no import here, the whole core is the body to match.)
    const modSrc = readFileSync(join(__dir, 'core.mjs'), 'utf8');
    const modBody = modSrc.slice(modSrc.indexOf('// LOCKED, SHARED constants'))
      .replace(/^export /gm, '').trim();
    ok('(0-teeth)★ inline core slice is char-for-char the export-stripped core.mjs body',
       slice.trim() === modBody,
       slice.trim() === modBody ? `identical bytes (${modBody.length} chars)` :
       `DRIFT: slice ${slice.trim().length} vs module ${modBody.length} chars`);

    let pageRes = null, evalErr = null;
    try {
      const factory = new Function(slice +
        '\n;return { runCoreTests, simulateEscapes, compute, rateRatio, effusionRate, meanSpeed, meanKE, K_B, T_LOCKED, A_PINHOLE, KSIG };');
      const PageCore = factory();
      pageRes = PageCore.runCoreTests({ N: 2_000_000 });

      // the page core's named formulas must match the module's, value-for-value.
      const sameForm =
        PageCore.rateRatio(2, 32) === Core.rateRatio(2, 32) &&
        PageCore.meanSpeed(Core.T_LOCKED, 4) === Core.meanSpeed(Core.T_LOCKED, 4) &&
        PageCore.KSIG === Core.KSIG && PageCore.K_B === Core.K_B;
      ok('(parity)★ page core formulas === module core formulas (rateRatio/meanSpeed/KSIG/K_B identical)',
         sameForm, sameForm ? 'every shared formula returns the identical value' : 'a formula drifted');
    } catch (e) { evalErr = e; }

    ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');
    if (pageRes) {
      ok('(parity)★ inline core pass-count == module pass-count',
         pageRes.passed === moduleRes.passed && pageRes.total === moduleRes.total,
         `in-page ${pageRes.passed}/${pageRes.total}  ·  module ${moduleRes.passed}/${moduleRes.total}`);
      let agree = pageRes.checks.length === moduleRes.checks.length;
      for (let k = 0; agree && k < pageRes.checks.length; k++) {
        if (pageRes.checks[k].ok !== moduleRes.checks[k].ok) agree = false;
        if (pageRes.checks[k].name !== moduleRes.checks[k].name) agree = false;
      }
      ok('(parity)★ every named assertion agrees ok-for-ok (page vs module)', agree,
         agree ? `all ${pageRes.checks.length} checks identical` : 'a check disagreed');

      console.log(`\n  ▸ RECORDED: in-page ${pageRes.passed}/${pageRes.total} · Node module ${moduleRes.passed}/${moduleRes.total}`);
    }
  }
}

console.log(`\n${pass}/${total} ${pass === total ? '✓ ALL GREEN' : '✗ FAILURES'}`);
process.exit(pass === total ? 0 : 1);
