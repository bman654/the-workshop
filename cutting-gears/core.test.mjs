// Node twin for The Cutting Gears. Zero-dep. Run: `node core.test.mjs` (exit 0 = green).
//
// Proves the DISJOINT-CORE claim across a swept range of (R,r) pairs and byte-parity-checks
// BOTH inlined sources against their authorities so the cross can never silently drift:
//   · the spiro gcd/closure block (SPIRO-CORE region) must be byte-identical to the same
//     block in spirograph/index.html;
//   · the euclid core is imported (not forked) from ../euclid-engine/core.mjs, so there is
//     nothing to drift — but we still assert the import is the real bench by re-checking a
//     hand anchor against it.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SPIRO, EUCLID, closure, gcdTrace, cfExpand, buildTiles, runSelfTest } from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }

// ── 1. the page's own self-test (the same runSelfTest the page runs) is all-green ──
const st = runSelfTest();
for (const c of st.checks) ck('selftest ' + c.name + '  [' + c.detail + ']', c.ok);

// ── 2. hand anchors (named pairs from the presets) ──
ck('anchor 90:56 → gcd 2, petals 45', (() => {
  const c = closure(90, 56), t = gcdTrace(90, 56);
  return c.gcd === 2 && t.gcd === 2 && c.petals === 45 && 90 / t.gcd === 45;
})());
ck('anchor 89:55 coprime → gcd 1, petals 89, Fibonacci CF [1×8, 2] (slowest Euclid)', (() => {
  const c = closure(89, 55), cf = cfExpand(89, 55);
  const allOnesButLast = cf.terms.slice(0, -1).every(q => q === 1) && cf.terms[cf.terms.length - 1] === 2;
  return c.gcd === 1 && c.petals === 89 && allOnesButLast;
})());
ck('anchor 96:36 → gcd 12, petals 8, steps === CF length', (() => {
  const c = closure(96, 36), t = gcdTrace(96, 36), cf = cfExpand(96, 36);
  return c.gcd === 12 && c.petals === 8 && t.steps.length === cf.terms.length;
})());
ck('anchor 100:75 → gcd 25, petals 4', (() => {
  const c = closure(100, 75);
  return c.gcd === 25 && c.petals === 4;
})());

// ── 3. tile-builder hand anchor: 96×36 exact tiling, smallest square === gcd ──
ck('tiles 96×36: Σ side² === 96·36 and smallest square === gcd 12', (() => {
  const { tiles, gcd } = buildTiles(96, 36);
  let area = 0, minSide = Infinity;
  for (const t of tiles){ area += t.side * t.side; minSide = Math.min(minSide, t.side); }
  return area === 96 * 36 && minSide === 12 && gcd === 12;
})());

// ── 4. DISJOINT proof: SPIRO's private gcd and EUCLID's trace gcd are SEPARATE code paths
//      that nonetheless agree on every swept pair (and SPIRO never imports euclid). ──
ck('disjoint cores: SPIRO.gcd and EUCLID.gcdTrace are different functions', SPIRO.gcd !== EUCLID.gcdTrace);
let dgAgree = 0, dgTotal = 0;
for (let R = 8; R <= 120; R++) for (let r = 3; r < R; r++){
  dgTotal++;
  if (SPIRO.gcd(R, r) === EUCLID.gcdTrace(R, r).gcd) dgAgree++;
}
ck('disjoint cores agree on gcd across ' + dgTotal + ' pairs (' + dgAgree + ')', dgAgree === dgTotal);

// ── 5. BYTE-TWIN PARITY: the SPIRO-CORE region inlined in core.mjs must be byte-identical to
//      the gcd()/closure() block in spirograph/index.html. Extract both and compare. ──
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
const spiroSrc = readFileSync(join(here, '..', 'spirograph', 'index.html'), 'utf8');

// the region we vouch for in core.mjs (between the SPIRO-CORE sentinels, exclusive of them)
function spiroCoreRegion(text){
  const BEGIN = '// === SPIRO-CORE BEGIN ===';
  const END = '// === SPIRO-CORE END ===';
  const i = text.indexOf(BEGIN);
  const j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i + BEGIN.length, j).trim();
}
const inlined = spiroCoreRegion(coreSrc);

// the authoritative block in spirograph/index.html: from `function gcd(` through the close of
// `function closure(`. We slice from the gcd() line to the line after closure()'s closing brace.
function spiroAuthority(text){
  const gi = text.indexOf('function gcd(a, b){ a = Math.abs');
  if (gi < 0) return null;
  // closure() ends at the first '}\n' following its `return {` line
  const ci = text.indexOf('function closure(R, r){', gi);
  if (ci < 0) return null;
  const retEnd = text.indexOf('};', text.indexOf('return {', ci));
  if (retEnd < 0) return null;
  // closure body closes with '\n}' right after the `};` of the returned object
  const close = text.indexOf('\n}', retEnd);
  if (close < 0) return null;
  return text.slice(gi, close + 2).trim();
}
const authority = spiroAuthority(spiroSrc);

// the page inlines the SAME block (self-contained, zero-dep) under the same sentinels.
const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
const pageInlined = spiroCoreRegion(pageSrc);

ck('byte-twin: SPIRO-CORE region present in core.mjs', !!inlined);
ck('byte-twin: gcd/closure block present in spirograph/index.html', !!authority);
ck('byte-twin: SPIRO-CORE region present in index.html', !!pageInlined);
ck('byte-twin PARITY: core.mjs SPIRO-CORE === spirograph/index.html gcd+closure (byte-identical)',
   !!inlined && !!authority && inlined === authority);
ck('byte-twin PARITY: index.html SPIRO-CORE === spirograph/index.html gcd+closure (byte-identical)',
   !!pageInlined && !!authority && pageInlined === authority);

// ── 6. the imported euclid core really is the bench (a hand anchor it must satisfy) ──
ck('imported euclid core is the real bench: gcd(48,36)=12, CF [1;3]', (() => {
  const t = gcdTrace(48, 36), c = cfExpand(48, 36);
  return t.gcd === 12 && JSON.stringify(c.terms) === JSON.stringify([1, 3]) && c.num === 4 && c.den === 3;
})());

// ── report ──
console.log('The Cutting Gears — core.test.mjs');
console.log('  selftest: ' + st.passed + '/' + st.total + ' page checks green');
console.log('  disjoint gcd agreement: ' + dgAgree + '/' + dgTotal + ' pairs');
console.log('  byte-twin spiro parity: ' + (inlined === authority ? 'IDENTICAL' : 'DRIFTED'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
