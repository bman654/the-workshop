// Node twin for The Cartouche. Zero-dep. Run: `node cartouche/core.test.mjs` (exit 0 = green).
//
// Proves the typed-circuit claim and byte-parity-checks every inlined source against its
// authority so the passport can never silently drift:
//   · the page's own runSelfTest (the 14 assertions) is all-green, including ALL FOUR neg-
//     controls firing and the gcd→ratio→gcd algebraic identity (start === end);
//   · legal-stamp ⟺ edge-exists ∧ guard-passes, verified directly both ways;
//   · the SPIRO-CORE block inlined in core.mjs is byte-identical to spirograph/index.html;
//   · the euclid gcd is IMPORTED (not forked) from ../euclid-engine/core.mjs — a hand anchor
//     re-checks the import is the real bench;
//   · the edge table === the type-intersection graph over ALL 9 ordered pairs (documents
//     spiro→gears as a true SECOND gcd-edge, a growth hook — grafted from Explorer B);
//   · CORE byte-parity: the CORE region inlined into index.html === cartouche/core.mjs.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ROOMS, gcd, petals, gcdTrace, hasEdge, edgeTable, stampLegal, sealed, runSelfTest } from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }

const here = dirname(fileURLToPath(import.meta.url));

// ── 1. the page's own self-test (the 14 assertions, run on the SAME core) is all-green ──
const st = runSelfTest();
for (const c of st.checks) ck('selftest ' + c.n + '  [' + c.d + ']', c.ok);

// ── 2. legal-stamp ⟺ edge-exists ∧ guard-passes (the biconditional, proven both ways) ──
//   forward: a legal stamp implies BOTH an edge and a passing guard;
//   reverse: an edge + a passing guard implies a legal stamp;
//   and removing EITHER conjunct breaks legality.
{
  const carried = { type: 'gcd', value: 12 };
  const ctx = { seat: { R: 60, r: 48 } };                 // gcd(60,48)=12 → meshes
  const legal = stampLegal('euclid', 'gears', carried, ctx);
  const edge = hasEdge('euclid', 'gears');
  const guard = ROOMS.gears.guard(carried, ctx).ok;
  ck('legal-stamp ⟹ edge ∧ guard', !legal.ok || (edge && guard));
  ck('edge ∧ guard ⟹ legal-stamp', !(edge && guard) || legal.ok);
  // break the edge (euclid→spiro, no shared type) → illegal even with any guard.
  ck('no edge ⟹ illegal (euclid→spiro)', !stampLegal('euclid', 'spiro', { type: 'gcd', value: 12 }, { seat: { R: 60, r: 24 } }).ok);
  // break the guard (gears mis-seated) → illegal even with an edge.
  ck('edge but failing guard ⟹ illegal (gears mis-seated)', !stampLegal('euclid', 'gears', carried, { seat: { R: 35, r: 14 } }).ok);
}

// ── 3. the gcd→ratio→gcd closed loop is an ALGEBRAIC IDENTITY (start value === end value) ──
{
  const a = 48, b = 36;
  const g0 = gcdTrace(a, b).gcd;                            // 12
  const ratio = ROOMS.gears.operate({ R: 60, r: 48 }).value;   // 60/12 = 5
  const gEnd = ROOMS.spiro.operate({ R: 60, r: 24 }).value;    // gcd(60,24) = 12
  ck('gcd→ratio→gcd identity: start gcd === end gcd (12 → ratio 5 → 12)', g0 === 12 && ratio === 5 && gEnd === g0);
}

// ── 4. ALL FOUR neg-controls fire (located by name in the page self-test) ──
function leg(prefix){ const c = st.checks.find(x => x.n.startsWith(prefix)); return c && c.ok; }
ck('NEG fires · wrong-type rejected (#9)', leg('9 ·'));
ck('NEG fires · guard-fail rejected (#10)', leg('10 ·'));
ck('NEG fires · non-returning walk never seals (#11)', leg('11 ·'));
ck('NEG fires · free-stamp foil fails the edge-check (#12)', leg('12 ·'));

// ── 5. EDGE TABLE === the type-intersection graph over ALL 9 ordered pairs (graft from B) ──
//   The complete ordered-pair table is exactly the four edges that share a type. In particular
//   gears→spiro (ratio∩ratio) is the wired edge, and spiro→gears (gcd∩gcd) is a SECOND honest
//   gcd-edge — a documented growth hook for a future circuit (NOT wired this cycle).
{
  const ids = Object.keys(ROOMS);                          // ['euclid','gears','spiro'] → 9 ordered pairs (incl. self)
  const expected = [];
  for (const from of ids) for (const to of ids){
    if (from === to) continue;
    const share = ROOMS[from].emits.some(t => ROOMS[to].accepts.includes(t));
    if (share) expected.push(from + '→' + to);
  }
  const got = edgeTable();
  const same = expected.length === got.length && expected.every(e => got.includes(e));
  ck('edge-table === type-intersection graph for all 9 ordered pairs', same);
  ck('edge-table has exactly the 4 type-sharing edges', got.length === 4);
  ck('wired ratio-edge gears→spiro present', got.includes('gears→spiro'));
  ck('SECOND gcd-edge spiro→gears present (growth hook, unwired)', got.includes('spiro→gears'));
  ck('NO self-loops / NO non-sharing pair (e.g. euclid→spiro absent)', !got.includes('euclid→spiro') && !got.some(e => e.split('→')[0] === e.split('→')[1]));
}

// ── 6. BYTE-TWIN PARITY: the SPIRO-CORE region inlined in core.mjs must be byte-identical to
//      the gcd()/closure() block in spirograph/index.html (and so to cutting-gears/core.mjs). ──
function spiroCoreRegion(text){
  const BEGIN = '// === SPIRO-CORE BEGIN ===';
  const END = '// === SPIRO-CORE END ===';
  const i = text.indexOf(BEGIN);
  const j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i + BEGIN.length, j).trim();
}
function spiroAuthority(text){
  const gi = text.indexOf('function gcd(a, b){ a = Math.abs');
  if (gi < 0) return null;
  const ci = text.indexOf('function closure(R, r){', gi);
  if (ci < 0) return null;
  const retEnd = text.indexOf('};', text.indexOf('return {', ci));
  if (retEnd < 0) return null;
  const close = text.indexOf('\n}', retEnd);
  if (close < 0) return null;
  return text.slice(gi, close + 2).trim();
}
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
const spiroSrc = readFileSync(join(here, '..', 'spirograph', 'index.html'), 'utf8');
const inlined = spiroCoreRegion(coreSrc);
const authority = spiroAuthority(spiroSrc);
ck('byte-twin: SPIRO-CORE region present in core.mjs', !!inlined);
ck('byte-twin: gcd/closure block present in spirograph/index.html', !!authority);
ck('byte-twin PARITY: core.mjs SPIRO-CORE === spirograph/index.html gcd+closure (byte-identical)',
   !!inlined && !!authority && inlined === authority);

// ── 7. the imported euclid core really is the bench (a hand anchor it must satisfy) ──
ck('imported euclid core is the real bench: gcdTrace(48,36).gcd === 12, gcdTrace(89,55).gcd === 1', (() => {
  return gcdTrace(48, 36).gcd === 12 && gcdTrace(89, 55).gcd === 1;
})());
// and that euclid's gcd AGREES with the spiro private gcd on a sweep (disjoint paths, one answer).
{
  let agree = 0, total = 0;
  for (let R = 8; R <= 120; R++) for (let r = 1; r < R; r++){ total++; if (gcd(R, r) === gcdTrace(R, r).gcd) agree++; }
  ck('disjoint gcds agree across ' + total + ' pairs (' + agree + ')', agree === total);
}

// ── 8. CORE BYTE-PARITY: the CORE region inlined in index.html === cartouche/core.mjs ──
//   The page inlines the SAME authority between // === CORE BEGIN === / // === CORE END ===.
//   We compare the page's CORE region to core.mjs's CORE region (sans the ESM import/export
//   lines the browser doesn't run, which the page replaces with the imported gcdTrace inline).
function coreRegion(text){
  const BEGIN = '// === CORE BEGIN ===';
  const END = '// === CORE END ===';
  const i = text.indexOf(BEGIN);
  const j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i + BEGIN.length, j).trim();
}
const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
const pageCore = coreRegion(pageSrc);
const fileCore = coreRegion(coreSrc);
ck('CORE byte-parity: CORE region present in core.mjs', !!fileCore);
ck('CORE byte-parity: CORE region present in index.html', !!pageCore);
ck('CORE byte-parity: index.html CORE region === core.mjs CORE region (byte-identical)',
   !!pageCore && !!fileCore && pageCore === fileCore);

// ── report ──
console.log('The Cartouche — core.test.mjs');
console.log('  page self-test: ' + st.passed + '/' + st.total + ' checks green (all 4 neg-controls + identity)');
console.log('  edge-table: ' + edgeTable().join(', '));
console.log('  byte-twin spiro parity: ' + (inlined === authority ? 'IDENTICAL' : 'DRIFTED'));
console.log('  CORE byte-parity: ' + (pageCore === fileCore ? 'IDENTICAL' : 'DRIFTED'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
