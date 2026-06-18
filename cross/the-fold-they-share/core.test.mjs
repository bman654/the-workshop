// Node twin for The Fold They Share core. Zero-dep. Run: `node cross/the-fold-they-share/core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html, so the page's gold self-test
// pill and this twin can never drift. It re-proves the legs the in-page pill proves, PLUS the byte-twin
// parity leg (index.html CORE region === core.mjs CORE char-for-char), an anti-circularity check, and —
// the load-bearing single-source guarantee for a cross — PARENT PARITY: each lifted block is byte-for-byte
// identical to the source of the function it was lifted from in its freshly-read parent core file.
//
//   1.  SHARED FOLD (the latch) — across a dense sweep inside the fundamental band, |apparentRate(spokeRate,
//       strobe)| === reciprocalBeat(spokeRate, strobe) < 1e-9 (worst ~7e-15). One difference of reciprocals,
//       read once in TIME (the strobed wheel) and once in SPACE (the two gratings).
//   2.  SIGNED PHANTOM — apparentRate < 0 just below the strobe (the wheel runs BACKWARD), > 0 just above,
//       EXACTLY 0 at coincidence; the magnitude still matches the beat. The wagon-wheel reversal is real.
//   3.  NEG-CONTROL (COINCIDENCE, load-bearing) — at spokeRate===strobe (p₁===p₂) apparentRate === 0 EXACTLY
//       AND spacingTwoPitch === Infinity: both halves hit the no-beat limit, so an "always beats" classifier
//       provably FAILS, while every off-coincidence in-band point DOES beat (the classifier is not vacuous).
//   4.  ANTI-CIRCULARITY — the TIME block never names a moiré fn (spacingTwoPitch) and the SPACE block never
//       names a sampling fn (apparentRate/foldedFreq/STROBE): two code-disjoint domains, one fold.
//   5.  BYTE-TWIN PARITY — index.html's inlined CORE region === core.mjs CORE char-for-char.
//   6.  PARENT PARITY — the SAMPLING-CORE block contains foldedFreq + apparentRate byte-for-byte from
//       sampling-theorem/sampling-core.mjs, and the MOIRE-CORE block contains spacingTwoPitch byte-for-byte
//       from moire-bench/moire-core.mjs (each function lifted verbatim, no re-typed math).
//   7.  PARITY with the shared runSelfTest (the function the page inlines as its pill).
// process.exit(pass === total ? 0 : 1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  foldedFreq, apparentRate, spacingTwoPitch,
  reciprocalBeat, apparentRateOf, inFundamentalBand, sharedFold,
  STROBE_REF, SPOKE_MIN, SPOKE_MAX, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0; const fails = [];
function ck(name, ok, info) {
  if (ok) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { fail++; fails.push(name); console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');

console.log('\nThe Fold They Share — Node twin (a strobed wheel and a moiré fringe share one fold)\n');

// ── LEG 1: SHARED FOLD — the latch (|apparentRate| === reciprocalBeat across the fundamental band) ─────
console.log('— Leg 1: the wheel apparent rate and the moiré reciprocal-beat are the SAME number <1e-9 —');
{
  const strobe = STROBE_REF;
  let worst = 0, worstAt = null, n = 0;
  for (let i = 0; i <= 2000; i++) {
    const spokeRate = SPOKE_MIN + (SPOKE_MAX - SPOKE_MIN) * i / 2000;
    if (!inFundamentalBand(spokeRate, strobe)) continue;
    const d = Math.abs(Math.abs(apparentRateOf(spokeRate, strobe)) - reciprocalBeat(spokeRate, strobe));
    if (d > worst) { worst = d; worstAt = spokeRate; }
    n++;
  }
  ck('worst | |apparentRate| − reciprocalBeat | over the fundamental band < 1e-9', worst < 1e-9,
    'worst=' + worst.toExponential(2) + ' at spokeRate=' + worstAt.toFixed(4) + ' over ' + n + ' pts');
  // spot-check a few via sharedFold (the hero readout the page reads)
  for (const s of [13, 18, 24.0001, 30, 35]) {
    const f = sharedFold(s, strobe);
    ck('spokeRate=' + s + ': sharedFold latches (|apparent|=' + f.apparentMag.toFixed(6) + ', beat=' + f.reciprocalBeat.toFixed(6) + ', ' + f.direction + ')',
      f.latched, '|Δ|=' + Math.abs(f.apparentMag - f.reciprocalBeat).toExponential(2));
  }
}

// ── LEG 2: SIGNED PHANTOM — the wheel reverses below the strobe, freezes at it, runs forward above ─────
console.log('\n— Leg 2: the signed wagon-wheel phantom (backward / frozen / forward) —');
{
  const strobe = STROBE_REF;
  const sweep = [
    [strobe - 6, 'backward'], [strobe - 2, 'backward'], [strobe - 0.5, 'backward'],
    [strobe, 'frozen'],
    [strobe + 0.5, 'forward'], [strobe + 2, 'forward'], [strobe + 6, 'forward'],
  ];
  let allDir = true, allMag = true;
  for (const [s, want] of sweep) {
    const f = sharedFold(s, strobe);
    if (f.direction !== want) allDir = false;
    if (s !== strobe && Math.abs(f.apparentMag - f.reciprocalBeat) >= 1e-9) allMag = false;
  }
  ck('the wheel crawls BACKWARD below the strobe, FREEZES at it, runs FORWARD above (sign carries the regime)', allDir);
  ck('at coincidence apparentRate === 0 EXACTLY (frozen, not <ε)', apparentRate(strobe, strobe) === 0);
  ck('the signed magnitude still equals the unsigned reciprocal-beat off coincidence (< 1e-9)', allMag);
}

// ── LEG 3: NEG-CONTROL — the COINCIDENCE leg drives BOTH halves to the no-beat limit ──────────────────
console.log('\n— Leg 3 (load-bearing): coincidence ⇒ wheel dead still AND field flat (no beat is correct) —');
{
  let allZero = true, allInf = true, noNaN = true;
  for (const s of [12, 18, 24, 30, 36, 48]) {
    const ap = apparentRate(s, s);
    const sp = spacingTwoPitch(1 / s, 1 / s);
    if (ap !== 0) allZero = false;
    if (sp !== Infinity) allInf = false;
    if (Number.isNaN(ap) || Number.isNaN(sp)) noNaN = false;
    ck('strobe===spokeRate=' + s + ': apparentRate === 0 AND spacing === Infinity (flat both sides)',
      ap === 0 && sp === Infinity, 'apparent=' + ap + ' spacing=' + (sp === Infinity ? '∞' : sp));
  }
  ck('every coincidence point: apparentRate EXACTLY 0, spacing EXACTLY Infinity, no NaN', allZero && allInf && noNaN);
  // the classifier bites: an OFF-coincidence in-band point DOES beat (apparent ≠ 0, spacing finite),
  // so "always beats" is not vacuously true — exactly the coincidence point falsifies it.
  const apOff = apparentRate(20, 24), spOff = spacingTwoPitch(1 / 20, 1 / 24);
  ck('off-coincidence (20 vs 24) DOES beat — apparent ≠ 0 (=' + apOff + ') and spacing finite — so the neg-control is not vacuous',
    apOff !== 0 && Number.isFinite(spOff));
}

// ── LEG 4: ANTI-CIRCULARITY — the two lifted blocks are code-disjoint (neither names the other) ───────
console.log('\n— Leg 4: anti-circularity — the SAMPLING and MOIRE blocks are code-disjoint —');
{
  const src = readFileSync(join(here, 'core.mjs'), 'utf8');
  const timeBody = src.slice(src.indexOf('SAMPLING-CORE BEGIN'), src.indexOf('SAMPLING-CORE END'));
  const spaceBody = src.slice(src.indexOf('MOIRE-CORE BEGIN'), src.indexOf('MOIRE-CORE END'));
  ck('the SAMPLING (TIME) block never names a moiré fn (spacingTwoPitch/reciprocalBeat/spacingUnified)',
    !/spacingTwoPitch|reciprocalBeat|spacingUnified|diffMag/.test(timeBody));
  ck('the MOIRE (SPACE) block never names a sampling fn (apparentRate/foldedFreq/STROBE/sampleTone)',
    !/apparentRate|foldedFreq|STROBE|sampleTone|nyquist/.test(spaceBody));
}

// ── LEG 5: BYTE-TWIN PARITY — the inlined slab IS the module, byte-for-byte ───────────────────────────
console.log('\n— Leg 5: byte-twin parity (index.html CORE slab === core.mjs CORE char-for-char) —');
{
  const BEGIN = '// === CORE BEGIN ===', END = '// === CORE END ===';
  const region = (text) => { const i = text.indexOf(BEGIN), j = text.indexOf(END); return (i < 0 || j < 0 || j < i) ? null : text.slice(i, j + END.length); };
  const coreReg = region(readFileSync(join(here, 'core.mjs'), 'utf8'));
  const pageReg = region(readFileSync(join(here, 'index.html'), 'utf8'));
  ck('byte-twin: core.mjs CORE region present', !!coreReg);
  ck('byte-twin: index.html CORE region present', !!pageReg);
  ck('byte-twin PARITY: index.html CORE === core.mjs CORE (byte-identical)',
    !!coreReg && !!pageReg && coreReg === pageReg,
    coreReg == null ? 'core sentinels MISSING' : pageReg == null ? 'page sentinels MISSING' :
      (coreReg === pageReg ? 'slice ' + coreReg.length + ' chars identical' : 'DRIFT (core ' + coreReg.length + ' vs page ' + pageReg.length + ')'));
}

// ── LEG 6: PARENT PARITY — each lifted block === the byte-for-byte source in its freshly-read parent ──
console.log('\n— Leg 6: parent parity (each block lifted byte-for-byte from its freshly-read parent core) —');
{
  // Extract a named top-level `function NAME(...) { ... }` (or one-line form) by brace-matching from a
  // freshly-read parent source. Returns the exact substring of the function definition (incl. its body).
  function extractFn(src, name) {
    const sig = 'function ' + name + '(';
    const start = src.indexOf(sig);
    if (start < 0) return null;
    // find the first '{' after the signature
    let i = src.indexOf('{', start);
    if (i < 0) return null;
    let depth = 0;
    for (; i < src.length; i++) {
      const c = src[i];
      if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) { return src.slice(start, i + 1); } }
    }
    return null;
  }

  const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
  const samplingSrc = readFileSync(join(repoRoot, 'sampling-theorem', 'sampling-core.mjs'), 'utf8');
  const moireSrc = readFileSync(join(repoRoot, 'moire-bench', 'moire-core.mjs'), 'utf8');

  const timeBody = coreSrc.slice(coreSrc.indexOf('SAMPLING-CORE BEGIN'), coreSrc.indexOf('SAMPLING-CORE END'));
  const spaceBody = coreSrc.slice(coreSrc.indexOf('MOIRE-CORE BEGIN'), coreSrc.indexOf('MOIRE-CORE END'));

  for (const fn of ['foldedFreq', 'apparentRate']) {
    const parent = extractFn(samplingSrc, fn);
    const mine = extractFn(timeBody, fn);
    ck('TIME block: ' + fn + '() === sampling-core.mjs source byte-for-byte', !!parent && !!mine && parent === mine,
      !parent ? 'parent missing' : !mine ? 'mine missing' : parent === mine ? parent.length + ' chars identical' : 'DRIFT (' + parent.length + ' vs ' + mine.length + ')');
  }
  {
    const parent = extractFn(moireSrc, 'spacingTwoPitch');
    const mine = extractFn(spaceBody, 'spacingTwoPitch');
    ck('SPACE block: spacingTwoPitch() === moire-core.mjs source byte-for-byte', !!parent && !!mine && parent === mine,
      !parent ? 'parent missing' : !mine ? 'mine missing' : parent === mine ? parent.length + ' chars identical' : 'DRIFT (' + parent.length + ' vs ' + mine.length + ')');
  }
}

// ── LEG 7: PARITY with the shared runSelfTest (the function the page inlines as its pill) ─────────────
console.log('\n— Leg 7: the shared runSelfTest (the page pill) agrees —');
{
  const r = runSelfTest();
  ck('core.mjs runSelfTest passes all legs', r.ok,
    r.passed + '/' + r.total + (r.ok ? '' : ' · ' + r.checks.filter(c => !c.pass).map(c => c.name).join(',')));
}

console.log('\n—— The Fold They Share Node twin: ' + pass + '/' + (pass + fail) + ' ——');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
console.log('  ALL GREEN ✓\n');
process.exit(0);
