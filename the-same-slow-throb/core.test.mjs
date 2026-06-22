// Node twin for The Same Slow Throb core. Zero-dep. Run: `node the-same-slow-throb/core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html, plus BOTH real parents at
// the same ../ hops, so the page's gold self-test pill and this twin can never drift. It re-proves the
// 4 legs the in-page pill proves over a WIDER sweep, PLUS the byte-twin parity leg (index.html CORE ===
// core.mjs CORE char-for-char) and the code-disjointness grep (the ear adapter names no tone-mill fn,
// the eye adapter names no beating-bench fn). ONE law: a slow beat = |f₁ − f₂| folded down, two senses.
//
//   1.  LOCK EQUALITY    — |earBeat(S) − |eyeCrawl(S)|| < 1e-9 over a wide slow-rate sweep.
//   2.  CONVENTION (honest) — earBeat(S) → S via the bench's OWN beatRate; |eyeCrawl(S)| → S via the
//       mill's OWN apparentDriftHz; AND both adapters re-import the real parents (anti-circularity).
//   3.  NEG-CONTROL DIVERGE — splitting Δ grows |diff| strictly, → 0 as Δ → 0; a wide Δ drives the ear
//       out of the slow-beat band into roughness.
//   4.  NYQUIST FOLD     — past strobe/2 the apparent crawl reverses and lands on a different alias.
//   5.  BYTE-TWIN PARITY + DISJOINTNESS — index.html CORE === core.mjs CORE char-for-char; the ear and
//       eye adapters are code-disjoint by grep; PLUS the shared runSelfTest (the page's pill) is green.
// process.exit(pass === total ? 0 : 1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as BENCH from '../sound-garden/the-beating-bench/core.mjs';
import * as MILL from '../tone-mill/core.mjs';
import {
  F_LO, N_TEETH, STROBE_HZ, SLOW_NYQUIST, BAND_LO, BAND_HI,
  slowSweep, earBeat, earPair, inSlowBand, eyeCrawl, eyeState,
  lockPoint, splitPoint, runSelfTest,
} from './core.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

let pass = 0, fail = 0; const fails = [];
function ck(name, ok, info) {
  if (ok) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { fail++; fails.push(name); console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\nThe Same Slow Throb — Node twin (a heard beat and a seen crawl keep one |Δf| law)\n');

// a WIDER sweep than the in-page pill walks — finer step, the whole slow band, to many slow rates.
function wideSweep(){ const xs = []; for (let S = BAND_LO; S <= BAND_HI + 1e-12; S += 0.00731) xs.push(S); return xs; }
const Ss = wideSweep();

// ── LEG 1: LOCK EQUALITY — one |Δf| in both senses ─────────────────────────────────────────────────
console.log('— Leg 1: lock equality — |earBeat(S) − |eyeCrawl(S)|| < 1e-9 over a wide slow-rate sweep —');
{
  let worst = 0, worstS = null;
  for (const S of Ss) {
    const p = lockPoint(S);
    if (p.diff > worst) { worst = p.diff; worstS = S; }
  }
  ck('|earBeat(S) − |eyeCrawl(S)|| < 1e-9 across ' + Ss.length + ' slow rates in [' + BAND_LO + ',' + BAND_HI + ']',
    worst < 1e-9, 'worst=' + worst.toExponential(2) + ' at S=' + worstS.toFixed(4));
  // every rate in the band coincides (the two costumes pin to one slow beat at every S)
  let coincident = 0;
  for (const S of Ss) if (lockPoint(S).diff < 1e-9) coincident++;
  ck('the heard throb and the |seen crawl| coincide at EVERY slow rate in the band',
    coincident === Ss.length, coincident + '/' + Ss.length + ' coincident');
}

// ── LEG 2: CONVENTION-HONESTY — each parent re-derives S through its OWN law, no smuggled factor ────
console.log('\n— Leg 2: convention honesty — earBeat→S via beatRate, |eyeCrawl|→S via apparentDriftHz —');
{
  let worstEar = 0, worstEye = 0;
  for (const S of Ss) {
    worstEar = Math.max(worstEar, Math.abs(earBeat(S) - S));
    worstEye = Math.max(worstEye, Math.abs(Math.abs(eyeCrawl(S)) - S));
  }
  ck('earBeat(S) recovers S through the bench\'s OWN beatRate < 1e-9 (target laid in as a Hz difference)',
    worstEar < 1e-9, 'worst=' + worstEar.toExponential(2));
  ck('|eyeCrawl(S)| recovers S through the mill\'s OWN apparentDriftHz < 1e-9 (target laid in as a Hz offset)',
    worstEye < 1e-9, 'worst=' + worstEye.toExponential(2));
  // ANTI-CIRCULARITY: the adapters route through the REAL parents, not a local re-implementation.
  // earBeat must equal the parent bench's beatRate of the SET fHi/F_LO; eyeCrawl the parent mill's fold.
  let okEarParent = true, okEyeParent = true;
  for (const S of Ss) {
    const fHi = F_LO + S;
    if (earBeat(S) !== BENCH.beatRate(F_LO, fHi / F_LO)) okEarParent = false;
    const fTooth = STROBE_HZ + S, omega = fTooth * 2 * Math.PI / N_TEETH;
    if (eyeCrawl(S) !== MILL.apparentDriftHz(N_TEETH, omega, STROBE_HZ)) okEyeParent = false;
  }
  ck('earBeat === the parent bench\'s beatRate of the set fHi/F_LO (byte-exact, anti-circular)', okEarParent,
    okEarParent ? 'exact at all ' + Ss.length + ' rates' : 'DIVERGED from the parent');
  ck('eyeCrawl === the parent mill\'s apparentDriftHz of the set tooth-pass offset (byte-exact, anti-circular)', okEyeParent,
    okEyeParent ? 'exact at all ' + Ss.length + ' rates' : 'DIVERGED from the parent');
  // earPair / eyeState surface the two real frequencies / spin the page renders — sanity that they agree.
  const ep = earPair(6), es = eyeState(6);
  ck('earPair(6).beat === 6 (the bench\'s nearestPair) AND |eyeState(6).crawl| === 6 (the mill\'s fold)',
    Math.abs(ep.beat - 6) < 1e-9 && Math.abs(Math.abs(es.crawl) - 6) < 1e-9,
    'earPair fLo=' + ep.fLo + ' fHi=' + ep.fHi + ' beat=' + ep.beat.toFixed(3) + ' · eyeState fTooth=' + es.fTooth.toFixed(3) + ' crawl=' + es.crawl.toFixed(3));
}

// ── LEG 3: NEG-CONTROL DIVERGE — pull the pair apart and the two rates part ─────────────────────────
console.log('\n— Leg 3 (neg-control): split Δ → |diff| grows strictly, →0 as Δ→0, wide Δ leaves the band —');
{
  const S = 6;
  const deltas = [0, 0.5, 1, 2, 3, 4];
  const diffs = deltas.map(d => splitPoint(S, d).diff);
  let monotone = true; for (let i = 1; i < diffs.length; i++) if (!(diffs[i] > diffs[i-1])) monotone = false;
  ck('|earBeat(S+Δ) − |eyeCrawl(S−Δ)|| strictly increases with Δ (the costumes diverge as you pull apart)',
    monotone, 'diffs=[' + diffs.map(d => d.toFixed(2)).join(', ') + ']');
  ck('the divergence → 0 as Δ → 0 (the equality is a real coincidence-of-LOCK, not an identity — anti-vacuity)',
    Math.abs(diffs[0]) < 1e-9, 'diff@Δ=0 = ' + diffs[0].toExponential(2));
  // a wide split drives the ear OUT of the slow-beat band → roughness (no clean throb survives)
  const wide = splitPoint(S, 8);
  ck('a wide Δ drives the heard beat out of the slow band into ROUGHNESS (ear > BAND_HI; the throb blurs)',
    !inSlowBand(wide.ear) && wide.ear > BAND_HI, 'ear@Δ=8 = ' + wide.ear.toFixed(2) + 'Hz (band ceiling ' + BAND_HI + 'Hz)');
  // and the |eye| crawl genuinely SLOWED (the seen crawl is a different, slower rate than the heard beat)
  ck('meanwhile the |seen crawl| SLOWED to a different rate than the heard beat (the two no longer match)',
    Math.abs(wide.eyeMag - wide.ear) > 1, 'eye@Δ=8 = ' + wide.eyeMag.toFixed(2) + 'Hz vs ear ' + wide.ear.toFixed(2) + 'Hz');
}

// ── LEG 4: NYQUIST FOLD — past strobe/2 the eye lies like a strobe ──────────────────────────────────
console.log('\n— Leg 4: Nyquist fold — past strobe/2 the apparent crawl reverses to a different alias —');
{
  const inBand = eyeCrawl(SLOW_NYQUIST - 1);
  const pastFold = eyeCrawl(SLOW_NYQUIST + 3);
  ck('in-band the crawl reads forward (+); past strobe/2 it reverses (−) and lands on a different rate',
    inBand > 0 && pastFold < 0 && Math.abs(Math.abs(pastFold) - Math.abs(inBand)) > 1,
    'in-band=' + inBand.toFixed(3) + 'Hz · past-fold=' + pastFold.toFixed(3) + 'Hz at Nyquist ' + SLOW_NYQUIST + 'Hz');
  // the lock target band sits strictly inside the strobe's resolving Nyquist (honest construction)
  ck('the slow-beat band [' + BAND_LO + ',' + BAND_HI + '] sits strictly inside the strobe Nyquist (' + SLOW_NYQUIST + 'Hz) — the lock is honest only where the strobe resolves',
    BAND_HI < SLOW_NYQUIST, 'BAND_HI ' + BAND_HI + ' < Nyquist ' + SLOW_NYQUIST);
}

// ── LEG 5: BYTE-TWIN PARITY + CODE-DISJOINTNESS ────────────────────────────────────────────────────
console.log('\n— Leg 5: byte-twin parity (index.html CORE === core.mjs CORE) + adapter disjointness —');
{
  const coreSrc = readFileSync(join(HERE, 'core.mjs'), 'utf8');
  const pageSrc = readFileSync(join(HERE, 'index.html'), 'utf8');
  const slice = (s) => {
    const a = s.indexOf('// === CORE BEGIN ===');
    const b = s.indexOf('// === CORE END ===');
    if (a < 0 || b < 0) return null;
    return s.slice(a, b + '// === CORE END ==='.length);
  };
  const coreSlice = slice(coreSrc);
  const pageSlice = slice(pageSrc);
  ck('index.html CORE slab is present and char-for-char identical to core.mjs CORE slab (byte-twin)',
    coreSlice != null && pageSlice != null && coreSlice === pageSlice,
    coreSlice == null ? 'core.mjs has no CORE sentinels' :
    pageSlice == null ? 'index.html has no CORE sentinels' :
    coreSlice === pageSlice ? 'identical (' + coreSlice.length + ' chars)' :
    'DIFFER (core ' + coreSlice.length + ' vs page ' + pageSlice.length + ' chars)');

  // CODE-DISJOINTNESS: the ear adapter must name NO tone-mill fn; the eye adapter NO beating-bench fn.
  const earBlock = coreSrc.slice(coreSrc.indexOf('─ EAR-ADAPTER BEGIN ─'), coreSrc.indexOf('─ EAR-ADAPTER END ─'));
  const eyeBlock = coreSrc.slice(coreSrc.indexOf('─ EYE-ADAPTER BEGIN ─'), coreSrc.indexOf('─ EYE-ADAPTER END ─'));
  const MILL_FNS = ['apparentDriftHz', 'toothPassHz'];
  const BENCH_FNS = ['beatRate', 'nearestPair'];
  const earClean = MILL_FNS.every(fn => !earBlock.includes(fn));
  const eyeClean = BENCH_FNS.every(fn => !eyeBlock.includes(fn));
  ck('the EAR adapter names no tone-mill fn AND the EYE adapter names no beating-bench fn (code-disjoint)',
    earClean && eyeClean, 'ear clean=' + earClean + ' · eye clean=' + eyeClean);

  // the shared runSelfTest (the function the page inlines as its pill) is itself green.
  const r = runSelfTest();
  ck('the shared runSelfTest (the page\'s pill) is green', r.ok, r.passed + '/' + r.total + ' legs');
}

console.log('\nThe Same Slow Throb — Node twin: ' + pass + '/' + (pass + fail) + (fail === 0 ? ' ✓ ALL GREEN' : ' ✗ ' + fail + ' FAIL'));
if (fail) { console.log('FAILED:'); for (const f of fails) console.log('  · ' + f); }
process.exit(fail === 0 ? 0 : 1);
