// The Gene Jar — Node cross-check (the falsifiability twin of core.mjs).
//   Runs the shared runSelfTest() at a HIGHER N (tighter band, same KSIG
//   thresholds), adds independent re-derivations NOT routed through the page,
//   AND — the integration crux — RE-EXTRACTS the inlined core from index.html,
//   evaluates it, and proves the page core === the module core (byte-twin). There
//   is NO cross-wing import here, so page-core === module-core IS the parity proof.
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

console.log('The Conservatory · The Gene Jar — Node cross-check\n');

// ── 1. the shared core self-test (identical to the in-page pill), HIGHER N ────
console.log('— shared runSelfTest() at N=2e6 (same assertions the in-page pill runs, tighter band) —');
let moduleRes;
{
  moduleRes = Core.runSelfTest({ N: 2_000_000 });
  for (const c of moduleRes.checks) ok(c.name, c.pass, c.info);
}

// ── 2. INDEPENDENT re-derivations (NOT via the page) ─────────────────────────
console.log('\n— independent re-derivations (hand-expanded, NOT routed through core) —');

// (p+q)² hand-expanded at a dense grid === 1, AND equals AA+Aa+aa from hardyWeinberg.
{
  let worst = 0, where = '';
  for (let i = 0; i <= 200; i++) {
    const p = i / 200, qv = 1 - p;
    const expanded = p * p + 2 * p * qv + qv * qv;        // hand-expanded (p+q)²
    const g = Core.hardyWeinberg(p);
    const e = Math.max(Math.abs(expanded - 1), Math.abs((g.AA + g.Aa + g.aa) - 1));
    if (e > worst) { worst = e; where = 'p=' + p.toFixed(3); }
  }
  ok('(re-derive)★ hand-expanded (p+q)²===1 and AA+Aa+aa===1 over a dense grid',
     worst < 1e-12, 'worst |Σ−1| ' + worst.toExponential(2) + ' @ ' + where);
}

// p(p+q)=p matched to alleleFraction(hardyWeinberg(p)) — the fixed point, re-derived.
{
  let worst = 0, where = '';
  for (let i = 0; i <= 200; i++) {
    const p = i / 200, qv = 1 - p;
    const handP = p * (p + qv);                            // p(p+q) = p, by hand
    const viaCore = Core.alleleFraction(Core.hardyWeinberg(p));
    const e = Math.max(Math.abs(handP - p), Math.abs(viaCore - p));
    if (e > worst) { worst = e; where = 'p=' + p.toFixed(3); }
  }
  ok('(re-derive)★ p(p+q)=p matches alleleFraction(hardyWeinberg(p)) over the grid',
     worst < 1e-12, 'worst |p′−p| ' + worst.toExponential(2) + ' @ ' + where);
}

// 42-run high-N FIT sweep: every (p,seed) scoop's three counts land inside ±KSIG·band.
{
  const N = 2_000_000;
  let everOut = false, worst = '', maxDevSig = 0, runs = 0;
  for (const p of [0.1, 0.25, 0.4, 0.5, 0.6, 0.8]) {
    for (const seed of [1, 2, 3, 7, 11, 19, 101]) {
      runs++;
      const r = Core.scoop({ p, N, seed });
      for (const k of ['AA', 'Aa', 'aa']) {
        const expected = N * r.pred[k];
        const dev = Math.abs(r.counts[k] - expected);
        const sig = r.band[k] > 0 ? dev / r.band[k] : 0;
        if (sig > maxDevSig) maxDevSig = sig;
        if (dev > Core.KSIG * r.band[k]) { everOut = true; worst = 'p=' + p + ' seed=' + seed + ' ' + k + ': ' + sig.toFixed(2) + 'σ'; }
      }
    }
  }
  ok('(FIT-ext)★ ' + runs + ' (p,seed) scoops all inside ±' + Core.KSIG + '·√N at N=' + N + ' (sampling converges honestly)',
     !everOut, everOut ? worst : 'worst deviation ' + maxDevSig.toFixed(2) + 'σ over ' + runs + ' runs (band=√(N·π(1−π)))');
}

// assortative DRAIN re-measured directly from compute(): Aa → ½·Aa each of 3 rounds,
// p frozen, Σ=1 held, hwIdentity RED — independent of the core's own falsifier 5.
{
  let allGood = true, worst = '';
  for (const p of [0.15, 0.3, 0.5, 0.62, 0.8]) {
    const hw = Core.hardyWeinberg(p);
    let prevAa = hw.Aa, drainOK = true;
    for (let rounds = 1; rounds <= 3; rounds++) {
      const c = Core.compute({ p, assortativeRounds: rounds });
      if (Math.abs(c.g.Aa - 0.5 * prevAa) > 1e-12) drainOK = false;    // halves each round
      prevAa = c.g.Aa;
      if (!c.pInvariant || !c.sigmaOne || c.hwIdentity) drainOK = false; // p,Σ hold; identity RED
    }
    const final = Core.compute({ p, assortativeRounds: 3 });
    if (!(drainOK && Math.abs(final.g.Aa - hw.Aa / 8) < 1e-12)) { allGood = false; worst = 'p=' + p + ' finalAa=' + final.g.Aa; }
  }
  ok('(neg-ext)★ assortative drains Aa→½·Aa/round (→Aa/8 over 3); p frozen, Σ=1, hwIdentity RED',
     allGood, allGood ? 'measured across p grid: geometric ½-drain, p & Σ held, identity broken' : worst);
}

// determinism: same args ⇒ byte-identical counts AND pairsToDraw across two scoops.
{
  const a = Core.scoop({ p: 0.37, N: 100000, seed: 98765 });
  const b = Core.scoop({ p: 0.37, N: 100000, seed: 98765 });
  const same = JSON.stringify(a.counts) === JSON.stringify(b.counts) &&
               JSON.stringify(a.pairsToDraw) === JSON.stringify(b.pairsToDraw);
  ok('(determinism)★ identical scoop args ⇒ byte-identical counts AND pairsToDraw', same,
     same ? 'two scoops byte-identical' : 'DIFFER');
}

// ── 3. THE RE-EXTRACTION PARITY HARNESS (the integration crux) ───────────────
//   Read index.html, slice the inline core between the GENE-JAR CORE sentinels,
//   assert it is char-for-char the export-stripped module body (from the first
//   locked-const marker to the END sentinel), then eval it (new Function factory),
//   run ITS runSelfTest and assert pass-count and every named check agree.
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core (byte-twin) —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== GENE-JAR CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END GENE-JAR CORE =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core sentinels present in index.html', i >= 0 && j > i,
     i >= 0 && j > i ? 'slice is ' + (j - i) + ' chars' : 'MISSING SENTINELS — has forge built index.html?');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);

    // the ws.js include must NOT appear inside the byte-twin slice (the #208 leak
    // guard at the slice level — the include lives AFTER the END sentinel, never within).
    ok('the byte-twin slice contains no ws.js / forge directive leakage',
       !/forge:include/.test(slice) && !/\bWS\./.test(slice),
       'core slice is pure — ws.js include sits after the END sentinel');

    // (0-teeth)★ BYTE-IDENTITY: the inline slice is char-for-char the module's body
    //   (from the first locked-const marker to the END sentinel, every leading
    //   `export ` removed). page core IS the module core, not merely "same pass-count".
    const modSrc = readFileSync(join(__dir, 'core.mjs'), 'utf8');
    const KMARK = '// KSIG — the SINGLE source of truth';
    const k = modSrc.indexOf(KMARK), me = modSrc.indexOf(END);
    const modBody = modSrc.slice(k, me).replace(/^export /gm, '').trim();
    ok('(0-teeth)★ inline core slice is char-for-char the export-stripped core.mjs body',
       slice.trim() === modBody,
       slice.trim() === modBody ? 'identical bytes (' + modBody.length + ' chars)' :
       'DRIFT: slice ' + slice.trim().length + ' vs module ' + modBody.length + ' chars');

    let pageRes = null, evalErr = null;
    try {
      const factory = new Function(slice +
        '\n;return { runSelfTest, scoop, compute, hardyWeinberg, alleleFraction, mate, assortativeRound, makeRng, KSIG, P };');
      const PageCore = factory();
      pageRes = PageCore.runSelfTest({ N: 2_000_000 });

      // the page core's shared formulas must match the module's, value-for-value.
      const hwSame = JSON.stringify(PageCore.hardyWeinberg(0.3)) === JSON.stringify(Core.hardyWeinberg(0.3));
      const rngSame = PageCore.makeRng(1)() === Core.makeRng(1)();
      const ksigSame = PageCore.KSIG === Core.KSIG;
      ok('(parity)★ page core formulas === module core formulas (hardyWeinberg(0.3)/makeRng(1)/KSIG identical)',
         hwSame && rngSame && ksigSame, hwSame && rngSame && ksigSame ? 'every shared formula returns the identical value' : 'a formula drifted');
    } catch (e) { evalErr = e; }

    ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');
    if (pageRes) {
      ok('(parity)★ inline core pass-count == module pass-count',
         pageRes.pass === moduleRes.pass && pageRes.total === moduleRes.total,
         'in-page ' + pageRes.pass + '/' + pageRes.total + '  ·  module ' + moduleRes.pass + '/' + moduleRes.total);
      let agree = pageRes.checks.length === moduleRes.checks.length;
      for (let m = 0; agree && m < pageRes.checks.length; m++) {
        if (pageRes.checks[m].pass !== moduleRes.checks[m].pass) agree = false;
        if (pageRes.checks[m].name !== moduleRes.checks[m].name) agree = false;
      }
      ok('(parity)★ every named assertion agrees ok-for-ok (page vs module)', agree,
         agree ? 'all ' + pageRes.checks.length + ' checks identical' : 'a check disagreed');

      console.log('\n  ▸ RECORDED: in-page ' + pageRes.pass + '/' + pageRes.total + ' · Node module ' + moduleRes.pass + '/' + moduleRes.total);
    }
  }
}

console.log('\n' + pass + '/' + total + ' ' + (pass === total ? '✓ ALL GREEN' : '✗ FAILURES'));
process.exit(pass === total ? 0 : 1);
