// Node twin for The Belief Beam math core. Zero-dep. Run: `node core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html (asserted by
// the BYTE-TWIN PARITY block at the bottom), so the page's self-test pill and this test
// can't drift. Asserts the three exact claims (A) Σ=1, (B) additive + order-free log-odds,
// (C) equal-likelihood no-op, BOTH negative controls fire RED, and byte-true re-extraction.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  URNS, HYP, COL, T, EQ_MODEL, EQ_T,
  likelihood, likelihoodIn, informative, informativeIn, prior,
  emptyState, update, posterior, posteriorIn, posteriorFrom,
  logOdds, logOddsIn, logLikRatioStep,
  makeSource, replay, replayLogOdds,
  skipRenorm, correlatedOverShoot, runSelfTest
} from './core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOL = 1e-12;

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok) { if (ok) pass++; else { fail++; fails.push(name); } }

// permutations of a small list (for the structural order-freedom claim).
function perms(a) {
  if (a.length <= 1) return [a.slice()];
  const out = [];
  a.forEach((x, i) => { for (const p of perms(a.slice(0, i).concat(a.slice(i + 1)))) out.push([x, ...p]); });
  return out;
}

// ── model sanity: every urn shares the total T; likelihood rows sum to 1 per urn. ──
{
  ck('every urn shares the same total T', URNS.every(r => r.reduce((a, b) => a + b, 0) === T));
  ck('likelihood rows sum to 1 per urn', URNS.every((_, i) => Math.abs(URNS[i].reduce((s, _v, c) => s + likelihood(i, c), 0) - 1) < TOL));
  ck('HYP, COL, T derive from URNS (no hard-coded 3/12)', HYP === URNS.length && COL === URNS[0].length && T === URNS[0].reduce((a, b) => a + b, 0));
  ck('EQ_MODEL adds a 4th equal-in-all-urns colour; not informative', !informativeIn(EQ_MODEL, 3) && EQ_T === EQ_MODEL[0].reduce((a, b) => a + b, 0));
}

// ── (A) Σ posterior === 1 within 1e-12 at EVERY step of a long run. ──
{
  let maxSig = 0; let st = emptyState();
  const run = [0, 2, 1, 0, 0, 2, 1, 0, 2, 1, 2, 0, 1, 0, 2, 2, 0, 1, 0, 0];
  for (const c of run) { st = update(st, c); const p = posterior(st); maxSig = Math.max(maxSig, Math.abs(p.reduce((a, b) => a + b, 0) - 1)); }
  ck('(A) Σ posterior = 1 within 1e-12 at every step of a 20-draw run', maxSig < TOL);
  // a probability vector: every entry in [0,1]
  let inRange = true; st = emptyState();
  for (const c of run) { st = update(st, c); if (!posterior(st).every(x => x >= 0 && x <= 1)) inRange = false; }
  ck('(A) every posterior entry lies in [0,1]', inRange);
}

// ── (B-i) log-odds is ADDITIVE: each draw shifts A:B by exactly ln(L-ratio) (<1e-12). ──
{
  let maxStep = 0; let st = emptyState();
  const run = [0, 2, 1, 0, 0, 2, 1, 0, 2, 1];
  for (const c of run) {
    const before = logOdds(st, 0, 1);
    st = update(st, c);
    const after = logOdds(st, 0, 1);
    maxStep = Math.max(maxStep, Math.abs((after - before) - logLikRatioStep(c, 0, 1)));
  }
  ck('(B) additive: per-draw A:B log-odds shift === ln(L-ratio) to <1e-12', maxStep < TOL);
  // the equal-likelihood step is exactly 0 (in the augmented model the Gray colour)
  ck('(B) an equal-likelihood colour contributes a 0 log-odds step',
     Math.log(likelihoodIn(EQ_MODEL, EQ_T, 0, 3) / likelihoodIn(EQ_MODEL, EQ_T, 1, 3)) === 0);
}

// ── (B-ii) ORDER-FREEDOM, STRUCTURAL: all 120 perms of a length-5 list land BIT-IDENTICAL. ──
{
  const base = [0, 2, 1, 0, 0];
  const refP = replay(prior(), base);
  const refLO = replayLogOdds(base, 0, 1);
  let allBitId = true, allLOId = true;
  const all = perms(base);
  for (const pm of all) {
    const p = replay(prior(), pm);
    if (!p.every((x, i) => x === refP[i])) allBitId = false;   // STRICT === (bit-identical)
    if (replayLogOdds(pm, 0, 1) !== refLO) allLOId = false;
  }
  ck('(B) order-free: all ' + all.length + ' perms → BIT-IDENTICAL posterior (strict ===)', allBitId && all.length === 120);
  ck('(B) order-free: all 120 perms → bit-identical log-odds (strict ===)', allLOId);
  // THE TRAP: naive iterated-float multiplication is NOT bit-identical under reorder.
  function iter(draws) {
    let p = prior();
    for (const c of draws) {
      if (!informative(c)) continue;
      const w = p.map((pi, i) => pi * likelihood(i, c));
      const Z = w.reduce((a, b) => a + b, 0);
      p = w.map(x => x / Z);
    }
    return p;
  }
  const refI = iter(base);
  let iterBitId = true;
  for (const pm of all) { const p = iter(pm); if (!p.every((x, i) => x === refI[i])) iterBitId = false; }
  ck('(B) the trap is real: naive iterated-float reorder is NOT bit-identical (so the tally form is necessary)', iterBitId === false);
}

// ── posteriorFrom === posterior after each draw (two independent derivations agree). ──
{
  let st = emptyState(); let pcur = prior(); let agree = true;
  const run = [0, 2, 1, 0, 0, 2, 1, 0, 2, 1];
  for (const c of run) {
    st = update(st, c);
    const lk = URNS.map((_, i) => likelihood(i, c));
    pcur = posteriorFrom(pcur, lk);
    const canon = posterior(st);
    if (Math.max.apply(null, pcur.map((x, i) => Math.abs(x - canon[i]))) > 1e-9) agree = false;
  }
  ck('posteriorFrom (∝prior×lk) === posterior (tally) to 1e-9 after each draw', agree);
}

// ── (C) EQUAL-LIKELIHOOD draw is a BIT-IDENTICAL identity: Gray ×1 vs ×5 strict ===. ──
{
  const g1 = posteriorIn(EQ_MODEL, EQ_T, [1, 1, 1, 1]);
  const g5 = posteriorIn(EQ_MODEL, EQ_T, [1, 1, 1, 5]);
  ck('(C) EQ_MODEL Gray ×1 vs ×5 → strict-=== identical posterior', g1.every((x, i) => x === g5[i]));
  const loBase = logOddsIn(EQ_MODEL, EQ_T, [1, 1, 1, 0], 0, 1);
  const loGray = logOddsIn(EQ_MODEL, EQ_T, [1, 1, 1, 7], 0, 1);
  ck('(C) logOdds(base) === logOdds(+grays) — strict === (the gray is inert)', loBase === loGray);
}

// ── makeSource: deterministic replay; the hidden urn never escapes. ──
{
  const a = makeSource({ urn: 0, seed: 42 });
  const b = makeSource({ urn: 0, seed: 42 });
  let sameRun = true;
  for (let k = 0; k < 30; k++) { const da = a.draw(), db = b.draw(); if (da.color !== db.color || da.post.some((x, i) => x !== db.post[i])) sameRun = false; }
  ck('makeSource replays bit-identically under the same seed (deterministic)', sameRun);
  // the record exposes color/post/dL/step/tally/n — but NOT the source urn index
  const rec = makeSource({ urn: 1, seed: 7 }).draw();
  ck('a draw record exposes color/post/dL/step but NEVER the hidden urn', !('urn' in rec) && !('srcUrn' in rec) && 'post' in rec && Math.abs(rec.post.reduce((a, b) => a + b, 0) - 1) < TOL);
  // belief converges toward the TRUE urn over a long run from the true source
  const c = makeSource({ urn: 2, seed: 123 });   // mostly-blue source
  let last; for (let k = 0; k < 200; k++) last = c.draw().post;
  ck('belief converges to the true source urn over a long run', last[2] > 0.99);
}

// ── BOTH negative controls fire RED + name the offender. ──
{
  const norm = runSelfTest({ mode: 'normal' });
  ck('runSelfTest("normal") passes (all three claims hold)', norm.pass === true && norm.offender === null);
  ck('normal mode emits the honest claim lines, all green', norm.lines.length >= 4 && norm.lines.every(l => l.ok));

  const sr = runSelfTest({ mode: 'skipRenorm' });
  ck('NEG skipRenorm fires RED and names the offender', sr.pass === true && /renormalizer/i.test(sr.offender));
  // the leak is real: Σ of the unnormalized vector drifts off 1
  const w = skipRenorm([0, 2, 1, 0, 0, 2, 1, 0, 2, 1]);
  ck('NEG skipRenorm: Σ of unnormalized weights drifts off 1', Math.abs(w.reduce((a, b) => a + b, 0) - 1) > 1e-6);

  const co = runSelfTest({ mode: 'correlated' });
  ck('NEG correlated fires RED and names the offender', co.pass === true && /correlated/i.test(co.offender));
  const r = correlatedOverShoot([0], 0, 1);
  ck('NEG correlated: overshoot === 2× the true log-odds (double-counted)', Math.abs(r.overshoot - 2 * r.trueLO) < TOL && Math.abs(r.overshoot) > Math.abs(r.trueLO));
}

// ── (F) BYTE-TWIN PARITY — coreRegion(core.mjs) === coreRegion(index.html), char-identical. ──
function coreRegion(path) {
  const src = readFileSync(path, 'utf8');
  const a = src.indexOf('// === CORE BEGIN ===');
  const b = src.indexOf('// === CORE END ===');
  if (a < 0 || b < 0) return null;
  return src.slice(a, b + '// === CORE END ==='.length);
}
const fromCore = coreRegion(join(__dirname, 'core.mjs'));
let fromPage = null;
try { fromPage = coreRegion(join(__dirname, 'index.html')); } catch (e) { fromPage = null; }
ck('(F) byte-twin: CORE BEGIN..END found in core.mjs', !!fromCore);
ck('(F) byte-twin: CORE BEGIN..END found in index.html', !!fromPage);
ck('(F) byte-twin: inlined core is CHARACTER-IDENTICAL to core.mjs', !!fromCore && fromCore === fromPage);

// ── report ──
console.log('The Belief Beam — core.test.mjs');
console.log('  HYP=' + HYP + ' urns · COL=' + COL + ' colours · T=' + T + ' beads/urn · EQ_T=' + EQ_T);
{
  const s = makeSource({ urn: 0, seed: 1 }); let p; for (let k = 0; k < 50; k++) p = s.draw().post;
  console.log('  50 draws from urn A → posterior ≈ [' + p.map(x => x.toFixed(4)).join(', ') + '] (Σ=' + p.reduce((a, b) => a + b, 0).toFixed(12) + ')');
}
console.log('  order-free over all 120 perms of a length-5 list: bit-identical');
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
