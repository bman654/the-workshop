// Node twin for the Measuring Bench math core. Zero-dep. Run: `node core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html, so the page's
// self-test and this test can never drift. Asserts the conditional math claim (the GCD &
// its properties), AND a byte-twin parity check that the inline really is byte-identical.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mulberry32, gcdTrace, cfExpand, extendedFromTrace, gcdRef, par } from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok) { if (ok) pass++; else { fail++; fails.push(name); } }

// brute-force gcd (a THIRD, dead-simple oracle) used to ground the divisor claims.
function bruteGcd(a, b) {
  let g = 1;
  for (let d = 1; d <= Math.min(a, b); d++) { if (a % d === 0 && b % d === 0) g = d; }
  return g;
}

// ── The four claims over many random pairs ──
const PAIRS = 2500;            // >= 2000 as required
const rng = mulberry32(0xC0FFEE);
let bothDivide = 0, everyCommonDivides = 0, refAgree = 0, bruteAgree = 0;
let cfOk = 0, bezOk = 0, parOk = 0;
let coprimeCount = 0, coprimeUnit = 0;
let minA = 1e9, maxA = 0;

for (let i = 0; i < PAIRS; i++) {
  const a = 1 + Math.floor(rng() * 400);
  const b = 1 + Math.floor(rng() * 400);
  minA = Math.min(minA, a, b); maxA = Math.max(maxA, a, b);
  const t = gcdTrace(a, b);
  const g = t.gcd;

  // CLAIM 1a: g divides BOTH a and b.
  if (a % g === 0 && b % g === 0) bothDivide++;
  // CLAIM 1b: every common divisor of a,b divides g — so g is the GREATEST (both directions, brute).
  let allDivG = true;
  for (let d = 1; d <= Math.min(a, b); d++) { if (a % d === 0 && b % d === 0 && g % d !== 0) { allDivG = false; break; } }
  if (allDivG) everyCommonDivides++;
  // CLAIM 1c: trace gcd === the INDEPENDENT modulo gcd (gcdRef) — agreement of independent routines.
  if (g === gcdRef(a, b)) refAgree++;
  // and a third, totally independent brute oracle, for good measure.
  if (g === bruteGcd(a, b)) bruteAgree++;

  // CLAIM 2: CF terms === trace quotients AND the reconstruction num/den === (a/g)/(b/g) exactly.
  const cf = cfExpand(a, b);
  const sameTerms = JSON.stringify(cf.terms) === JSON.stringify(t.quotients);
  const exact = (cf.num === a / g && cf.den === b / g);
  if (sameTerms && exact) cfOk++;

  // CLAIM 3: extended coeffs read off the SAME trace satisfy a·x + b·y === g.
  const bz = extendedFromTrace(a, b);
  if (bz.g === g && a * bz.x + b * bz.y === g) bezOk++;

  // par(a,b) === number of trace steps (the score spine the page mirrors).
  if (par(a, b) === t.steps.length) parOk++;

  // NEGATIVE CONTROL: every coprime pair → unit rod length exactly 1.
  if (gcdRef(a, b) === 1) { coprimeCount++; if (g === 1) coprimeUnit++; }
}

ck('CLAIM 1a: g divides BOTH a and b — all ' + PAIRS, bothDivide === PAIRS);
ck('CLAIM 1b: every common divisor divides g (greatest, brute) — all ' + PAIRS, everyCommonDivides === PAIRS);
ck('CLAIM 1c: trace gcd === gcdRef (independent oracle) — all ' + PAIRS, refAgree === PAIRS);
ck('cross: trace gcd === brute gcd (third oracle) — all ' + PAIRS, bruteAgree === PAIRS);
ck('CLAIM 2: CF terms === quotients & reconstruct (a/g)/(b/g) exactly — all ' + PAIRS, cfOk === PAIRS);
ck('CLAIM 3: a·x + b·y === g off the same trace — all ' + PAIRS, bezOk === PAIRS);
ck('par(a,b) === trace step count — all ' + PAIRS, parOk === PAIRS);
ck('NEGATIVE CONTROL: every coprime pair → unit rod length 1', coprimeCount > 0 && coprimeUnit === coprimeCount);

// ── Hand anchors ──
ck('anchor: gcd(48,36)=12, CF [1;3], reconstructs 4/3', (() => {
  const t = gcdTrace(48, 36), c = cfExpand(48, 36);
  return t.gcd === 12 && JSON.stringify(c.terms) === JSON.stringify([1, 3]) && c.num === 4 && c.den === 3;
})());
ck('anchor: gcd(1071,462)=21, CF [2;3,7], 1071·(−3)+462·7=21', (() => {
  const t = gcdTrace(1071, 462), c = cfExpand(1071, 462), z = extendedFromTrace(1071, 462);
  return t.gcd === 21 && JSON.stringify(c.terms) === JSON.stringify([2, 3, 7]) &&
    z.g === 21 && z.x === -3 && z.y === 7 && 1071 * z.x + 462 * z.y === 21;
})());
ck('anchor: gcd(240,46)=2, a·x+b·y=2 off the trace', (() => {
  const t = gcdTrace(240, 46), z = extendedFromTrace(240, 46);
  return t.gcd === 2 && z.g === 2 && 240 * z.x + 46 * z.y === 2;
})());

// ── BYTE-TWIN PARITY: the CORE region inlined into index.html must be byte-identical to the
// CORE region of core.mjs. Extract the substring between the sentinels in each and compare. ──
function coreRegion(text) {
  const BEGIN = '// === CORE BEGIN ===';
  const END = '// === CORE END ===';
  const i = text.indexOf(BEGIN);
  const j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i, j + END.length);
}
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
const coreReg = coreRegion(coreSrc);
const pageReg = coreRegion(pageSrc);
ck('byte-twin: index.html CORE region present', !!pageReg);
ck('byte-twin: core.mjs CORE region present', !!coreReg);
ck('byte-twin PARITY: index.html CORE === core.mjs CORE (byte-identical)', !!coreReg && !!pageReg && coreReg === pageReg);

// ── report ──
console.log('Measuring Bench core.test.mjs');
console.log('  pairs: ' + PAIRS + ' · operand range ' + minA + '..' + maxA);
console.log('  divides-both=' + bothDivide + '/' + PAIRS + ' greatest=' + everyCommonDivides + '/' + PAIRS +
  ' refAgree=' + refAgree + '/' + PAIRS + ' brute=' + bruteAgree + '/' + PAIRS);
console.log('  cf=' + cfOk + '/' + PAIRS + ' bezout=' + bezOk + '/' + PAIRS + ' par=' + parOk + '/' + PAIRS +
  ' · coprime ' + coprimeUnit + '/' + coprimeCount + ' → unit 1');
console.log('  byte-twin parity: ' + (coreReg === pageReg ? 'IDENTICAL' : 'DRIFTED'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
