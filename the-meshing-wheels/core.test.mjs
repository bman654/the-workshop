// Node twin for The Meshing Wheels. Zero-dep. Run: `node core.test.mjs` (exit 0 = green).
//
// Proves the bijection / period / reachability claim TWO independent ways (closed-form core
// vs brute enumeration), pins hand anchors, and byte-parity-checks the MESH-CORE region
// inlined in index.html against this authority so the page's math can never silently drift.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  gcd, lcm, mod, modInverse, residuePair, isReachable, reconstruct,
  period, reachableCount, meshOffset, runSelfTest
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }

// ── §1. the page's own self-test (the same runSelfTest the page runs) is all-green ──
const st = runSelfTest();
for (const c of st.checks) ck('selftest ' + c.name + '  [' + c.detail + ']', c.ok);

// ── §2. hand anchors (named pairs from the presets) ──
//   (3,5): recon(2,3)=8, recon(0,0)=0
ck('anchor (3,5) reconstruct(2,3) === 8', reconstruct(2, 3, 3, 5) === 8);
ck('anchor (3,5) reconstruct(0,0) === 0', reconstruct(0, 0, 3, 5) === 0);
ck('anchor (3,5) residuePair(8) === [2,3]', JSON.stringify(residuePair(8, 3, 5)) === JSON.stringify([2, 3]));
//   (4,6): recon(0,1)=null (unreachable), recon(0,2)=8, period=12
ck('anchor (4,6) reconstruct(0,1) === null (unreachable)', reconstruct(0, 1, 4, 6) === null);
ck('anchor (4,6) isReachable(0,1) === false', isReachable(0, 1, 4, 6) === false);
ck('anchor (4,6) reconstruct(0,2) === 8', reconstruct(0, 2, 4, 6) === 8);
ck('anchor (4,6) period === 12', period(4, 6) === 12);
ck('anchor (4,6) reachableCount === 12', reachableCount(4, 6) === 12);
//   Sun-Tzu's soldiers — the classic: x≡2(3), x≡3(5), x≡2(7) → 23.  Compose pairwise.
ck("anchor Sun-Tzu (2,3,2) mod (3,5,7) === 23", (() => {
  const x35 = reconstruct(2, 3, 3, 5);            // 8 (mod 15)
  const x = reconstruct(x35, 2, 15, 7);           // (mod 105)
  return x === 23;
})());
//   coprime helpers
ck('gcd(3,5)=1, lcm(3,5)=15', gcd(3, 5) === 1 && lcm(3, 5) === 15);
ck('gcd(4,6)=2, lcm(4,6)=12', gcd(4, 6) === 2 && lcm(4, 6) === 12);
ck('modInverse(3,5)=2, modInverse(2,5)=3', modInverse(3, 5) === 2 && modInverse(2, 5) === 3);
ck('modInverse(2,4)=null (no inverse)', modInverse(2, 4) === null);
ck('meshOffset(17,3,5)=2 (17 mod 15)', meshOffset(17, 3, 5) === 2);

// ── §3. INDEPENDENT brute cross-check of reconstruct across all (m,n) in [2..12]² ──
function bruteReconstruct(a, b, m, n){
  const L = lcm(m, n);
  for (let x = 0; x < L; x++) if (mod(x, m) === mod(a, m) && mod(x, n) === mod(b, n)) return x;
  return null;
}
let rcOk = 0, rcTot = 0;
for (let m = 2; m <= 12; m++) for (let n = 2; n <= 12; n++)
  for (let a = 0; a < m; a++) for (let b = 0; b < n; b++){
    rcTot++;
    if (reconstruct(a, b, m, n) === bruteReconstruct(a, b, m, n)) rcOk++;
  }
ck('reconstruct closed-form === brute over ' + rcTot + ' (m,n,a,b) tuples', rcOk === rcTot);

// ── §4. BYTE-TWIN PARITY: the MESH-CORE region in core.mjs must be byte-identical to the
//        same region inlined in index.html. Extract both and compare. ──
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');

function meshCoreRegion(text){
  const BEGIN = '// === MESH-CORE BEGIN ===';
  const END = '// === MESH-CORE END ===';
  const i = text.indexOf(BEGIN);
  const j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i + BEGIN.length, j).trim();
}
const coreRegion = meshCoreRegion(coreSrc);
const pageRegion = meshCoreRegion(pageSrc);
ck('byte-twin: MESH-CORE region present in core.mjs', !!coreRegion);
ck('byte-twin: MESH-CORE region present in index.html', !!pageRegion);
ck('byte-twin PARITY: core.mjs MESH-CORE === index.html MESH-CORE (byte-identical)',
   !!coreRegion && !!pageRegion && coreRegion === pageRegion);

// ── report ──
console.log('The Meshing Wheels — core.test.mjs');
console.log('  selftest: ' + st.passed + '/' + st.total + ' page checks green');
console.log('  reconstruct vs brute: ' + rcOk + '/' + rcTot + ' tuples');
console.log('  byte-twin MESH-CORE parity: ' + (coreRegion === pageRegion ? 'IDENTICAL' : 'DRIFTED'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
