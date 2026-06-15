/* ============================================================================
   core.test.mjs — the Node twin of the Reaction Balancer's in-page self-test.

   Run:  node alchemy/reaction-balancer/core.test.mjs

   Proves, over a curated library of real reactions, that the SAME core.mjs the
   page inlines byte-identical:
     (a) computes the known smallest-integer coefficients,
     (b) satisfies A·c = 0 EXACTLY per element (BigInt equality — no float),
     (c) returns gcd(c) = 1 and every c > 0,
   PLUS the negative control returns null (never a fabricated answer),
   PLUS the perturbation guard (verify rejects water as [2,1,3]),
   PLUS the grafted nested-group parser (Ca(OH)2, Fe2(SO4)3).
   Exits non-zero on any failure so CI / a human sees RED.
   ============================================================================ */

import {
  solve, verify, parseFormula, buildMatrix, gcdBig, ilcm, R, rIsZero, rAdd, rMul, LIBRARY
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));

let pass = 0, fail = 0;
function ok(name, cond, info){
  if(cond){ pass++; console.log('  \x1b[32m✓\x1b[0m ' + name); }
  else { fail++; console.log('  \x1b[31m✗\x1b[0m ' + name + (info ? '  ·  ' + info : '')); }
}
function eqArr(a, b){ return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]); }

console.log('\n— THE REACTION BALANCER · core.test.mjs —\n');

// ── (1) the full library: coefficients == known smallest integers, A·c=0 exact, gcd=1, all>0 ──
console.log('reaction library (real reactions):');
for(const rx of LIBRARY){
  if(rx.negative) continue;
  const res = solve(rx.reactants, rx.products);
  const got = res.ok ? res.coef : null;

  // (a) matches the known smallest-integer coefficients
  ok(rx.id.padEnd(10) + ' coefficients == ' + JSON.stringify(rx.expect),
     got && eqArr(got, rx.expect), 'got ' + JSON.stringify(got));

  // (b) A·c = 0 EXACTLY for every element — recompute from the matrix with BigInt equality
  let exactlyZero = !!got;
  if(got){
    const { A } = buildMatrix(rx.reactants, rx.products);
    const c = got.map(v => BigInt(v));
    for(let r = 0; r < A.length; r++){
      let acc = R(0n);
      for(let j = 0; j < A[r].length; j++) acc = rAdd(acc, rMul(A[r][j], R(c[j])));
      if(!rIsZero(acc)){ exactlyZero = false; break; }
    }
  }
  ok(rx.id.padEnd(10) + ' A·c = 0 exact (every element conserved, BigInt)', exactlyZero);

  // (c) gcd(c) = 1 and all c > 0  (the verify witness)
  ok(rx.id.padEnd(10) + ' gcd(c)=1 · all c>0 (verify)', got && verify(rx.reactants, rx.products, got));
}

// ── (2) the negative control returns null, with a reason, not a fake answer ──
console.log('\nnegative control:');
{
  const neg = LIBRARY.find(r => r.negative);
  const res = solve(neg.reactants, neg.products);
  ok('H2 + O2 → H2O + Na is flagged unbalanceable (solve returns ok:false)',
     res.ok === false, res.ok ? 'got ' + JSON.stringify(res.coef) : '');
  ok('  …and carries a reason string', res.ok === false && typeof res.reason === 'string' && res.reason.length > 0);
}

// ── (3) the perturbation guard: verify rejects a WRONG vector for a real reaction ──
console.log('\nperturbation guards (verify must reject wrong vectors):');
ok('verify rejects water as [2,1,3] (O unbalanced)', verify(['H2','O2'], ['H2O'], [2,1,3]) === false);
ok('verify rejects water as [4,2,4] (not smallest, gcd=2)', verify(['H2','O2'], ['H2O'], [4,2,4]) === false);
ok('verify rejects water as [2,1,0] (a zero coefficient)', verify(['H2','O2'], ['H2O'], [2,1,0]) === false);
ok('verify ACCEPTS the true water vector [2,1,2]', verify(['H2','O2'], ['H2O'], [2,1,2]) === true);

// ── (4) the grafted nested-group parser (the Ledger's contribution) ──
console.log('\ngrafted nested-group parser:');
ok('Ca(OH)2 → {Ca:1, O:2, H:2}', JSON.stringify(parseFormula('Ca(OH)2')) === JSON.stringify({Ca:1,O:2,H:2}));
ok('Fe2(SO4)3 → {Fe:2, S:3, O:12}', JSON.stringify(parseFormula('Fe2(SO4)3')) === JSON.stringify({Fe:2,S:3,O:12}));
ok('Ca3(PO4)2 → {Ca:3, P:2, O:8} (deep group)', JSON.stringify(parseFormula('Ca3(PO4)2')) === JSON.stringify({Ca:3,P:2,O:8}));
ok('C6H12O6 → {C:6, H:12, O:6} (multi-digit, multi-letter)', JSON.stringify(parseFormula('C6H12O6')) === JSON.stringify({C:6,H:12,O:6}));
ok('parser throws on unbalanced parens "Ca(OH2"', (() => { try{ parseFormula('Ca(OH2'); return false; }catch(e){ return true; } })());

// ── (5) number-theory invariants the solve leans on (gcd / lcm exact) ──
console.log('\ninteger-arithmetic invariants:');
ok('gcdBig(48,36) = 12', gcdBig(48n, 36n) === 12n);
ok('ilcm(4,6) = 12', ilcm(4n, 6n) === 12n);
ok('R(6,4) reduces to 3/2', (() => { const r = R(6n, 4n); return r.n === 3n && r.d === 2n; })());

// ── (6) ambiguity honesty: a 2-D nullspace must be flagged, not fabricated ──
// CO + CO2 → C + O2 has a 2-dimensional nullspace; solve() must NOT invent one answer.
console.log('\nambiguity honesty:');
{
  const res = solve(['CO','CO2'], ['C','O2']);
  ok('an under-determined system returns ok:false (not a fabricated single answer)',
     res.ok === false, res.ok ? 'got ' + JSON.stringify(res.coef) : res.reason);
}

// ── (7) RE-EXTRACTION PARITY (the integration crux, the engine-room/demon precedent) ──
// Read core.mjs off disk, slice the inline core out of index.html between the
// SAME sentinels the in-page badge uses, strip each leading `export ` (a module
// exports; an inline <script> can't), and assert the two are BYTE-IDENTICAL.
// So the page's badge count can NEVER silently drift from this Node twin —
// they run the same bytes.
console.log('\nre-extraction parity (page inline core === core.mjs, byte-for-byte):');
{
  const START = '// ===== BALANCER-CORE (byte-identical to core.mjs) =====';
  const END   = '// ===== END BALANCER-CORE =====';
  let parityOk = false, info = '';
  try{
    const coreSrc = readFileSync(join(__dir, 'core.mjs'), 'utf8');
    const pageSrc = readFileSync(join(__dir, 'index.html'), 'utf8');
    const si = pageSrc.indexOf(START), ei = pageSrc.indexOf(END);
    ok('inline-core sentinels present in index.html', si >= 0 && ei > si,
       si >= 0 && ei > si ? 'slice is ' + (ei - si) + ' chars' : 'MISSING SENTINELS');
    if(si >= 0 && ei > si){
      // the inline block = everything strictly between the two sentinel lines
      // (identical normalisation to the in-page check: drop one leading newline,
      //  drop trailing blank/indent before the END sentinel line).
      const inline = pageSrc.slice(si + START.length, ei).replace(/^\n/, '').replace(/\n[ \t]*$/, '');
      // the expected block = core.mjs with each leading `export ` stripped, no trailing newline
      const expected = coreSrc.split('\n').map(l => l.replace(/^export /, '')).join('\n').replace(/\n$/, '');
      parityOk = (inline === expected);
      if(!parityOk){
        const a = inline.split('\n'), b = expected.split('\n');
        let d = -1; for(let i = 0; i < Math.max(a.length, b.length); i++){ if(a[i] !== b[i]){ d = i; break; } }
        info = 'first diff at line ' + (d + 1) + ' (inline ' + a.length + ' lines, core ' + b.length + ')';
      }
    }
  }catch(e){ info = 'parity read failed: ' + e.message; }
  ok('(parity)★ index.html inline core IS core.mjs, byte-for-byte (export-stripped)', parityOk, info);
}

const total = pass + fail;
console.log('\n' + (fail === 0 ? '\x1b[32m' : '\x1b[31m') + pass + '/' + total + (fail === 0 ? ' GREEN' : ' — ' + fail + ' FAILED') + '\x1b[0m\n');
process.exit(fail === 0 ? 0 : 1);
