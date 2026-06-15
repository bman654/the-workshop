// ============================================================================
//  THE MAXWELL–BOLTZMANN GAS — Node twin of the collision core.
//  Run:  node cavern/maxwell-boltzmann/mb-core.test.mjs
//
//  M–B shipped with no Node test (its proofs lived only in the in-page pill).
//  This file is that guard: it (1) re-proves the core's exact claims headless
//  (the equal-mass exchange conserves momentum & energy to 1e-12; kT_from is
//  ⟨½v²⟩; the M–B CDF and inverse-CDF sampler are mutually consistent), and
//  (2) asserts the BYTE-TWIN: the slice mb-core.mjs exports (between sentinels)
//  is char-for-char the slice index.html inlines (with `export` stripped) — so
//  the page's collision engine IS this module, not a drifted copy.
//  process.exit(pass === total ? 0 : 1).
// ============================================================================
import {
  rng, collideEqual, momentum, kinetic, speeds, kT_from, mbCdf, sampleMB,
} from './mb-core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
let pass = 0, total = 0;
function check(name, cond, info){
  total++;
  if (cond){ pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}
function sliceBetween(text, begin, end){
  const i = text.indexOf(begin), j = text.indexOf(end);
  if (i < 0 || j < 0 || j <= i) return null;
  return text.slice(i + begin.length, j);
}

console.log('\n— The collision core, re-proven headless —');

// ── 1. The equal-mass elastic exchange conserves momentum AND energy exactly. ──
{
  const rand = rng(7);
  let worstP = 0, worstK = 0;
  for (let t = 0; t < 5000; t++){
    const v1 = [rand()*4-2, rand()*4-2], v2 = [rand()*4-2, rand()*4-2];
    const ang = rand()*2*Math.PI; let nx = Math.cos(ang), ny = Math.sin(ang);
    if ((v1[0]-v2[0])*nx + (v1[1]-v2[1])*ny >= 0){ nx = -nx; ny = -ny; }   // force a closing hit
    const p0 = [v1[0]+v2[0], v1[1]+v2[1]];
    const k0 = 0.5*(v1[0]*v1[0]+v1[1]*v1[1]+v2[0]*v2[0]+v2[1]*v2[1]);
    collideEqual(v1, v2, nx, ny);
    const p1 = [v1[0]+v2[0], v1[1]+v2[1]];
    const k1 = 0.5*(v1[0]*v1[0]+v1[1]*v1[1]+v2[0]*v2[0]+v2[1]*v2[1]);
    worstP = Math.max(worstP, Math.abs(p1[0]-p0[0]), Math.abs(p1[1]-p0[1]));
    worstK = Math.max(worstK, Math.abs(k1-k0));
  }
  check('collideEqual conserves momentum to 1e-12 over 5000 hits', worstP < 1e-12, 'max |Δp| = ' + worstP.toExponential(2));
  check('collideEqual conserves kinetic energy to 1e-12', worstK < 1e-12, 'max |ΔKE| = ' + worstK.toExponential(2));
}

// ── 2. A long random-pair chain still conserves both (the ledgers agree). ──
{
  const rand = rng(42), n = 200, vels = [];
  for (let i = 0; i < n; i++) vels.push([rand()*2-1, rand()*2-1]);
  const p0 = momentum(vels), k0 = kinetic(vels);
  for (let t = 0; t < 5000; t++){
    const a = Math.floor(rand()*n), b = Math.floor(rand()*n); if (a === b) continue;
    const ang = rand()*2*Math.PI;
    collideEqual(vels[a], vels[b], Math.cos(ang), Math.sin(ang));
  }
  const p1 = momentum(vels), k1 = kinetic(vels);
  const dp = Math.max(Math.abs(p1[0]-p0[0]), Math.abs(p1[1]-p0[1])), dk = Math.abs(k1-k0);
  check('5000-collision chain conserves momentum', dp < 1e-9, '|Δp| = ' + dp.toExponential(2));
  check('5000-collision chain conserves energy', dk < 1e-9, '|ΔKE| = ' + dk.toExponential(2));
}

// ── 3. kT_from is ⟨½v²⟩, and a thermal sample recovers its own kT (equipartition). ──
{
  const rand = rng(123), kT = 1.7, n = 40000;
  const vels = sampleMB(n, kT, rand);
  const meas = kT_from(vels);
  // direct ⟨½v²⟩ from the speed list — kT_from must equal it exactly
  const spd = speeds(vels);
  let half = 0; for (let i = 0; i < n; i++) half += 0.5*spd[i]*spd[i]; half /= n;
  check('kT_from(vels) === ⟨½v²⟩ exactly', Math.abs(meas - half) < 1e-12, 'kT_from=' + meas.toFixed(6) + '  ⟨½v²⟩=' + half.toFixed(6));
  check('sampleMB at kT=1.7 recovers kT (within sampling noise)', Math.abs(meas - kT) < 0.05, 'measured ' + meas.toFixed(4));
}

// ── 4. The CDF and the inverse-CDF sampler are mutually consistent. ──
{
  const kT = 2.3, rand = rng(9), n = 80000;
  const vels = sampleMB(n, kT, rand), spd = speeds(vels).sort((a,b)=>a-b);
  // empirical CDF at three quantiles must match the closed-form mbCdf
  let worst = 0;
  for (const q of [0.25, 0.5, 0.75]){
    const v = spd[Math.floor(q*n)];
    worst = Math.max(worst, Math.abs(mbCdf(v, kT) - q));
  }
  check('sampleMB draws match mbCdf at the quartiles (<2e-2)', worst < 2e-2, 'worst |F_emp − F| = ' + worst.toFixed(4));
  check('mbCdf is a proper CDF: F(0)=0, F(∞)→1', mbCdf(0, kT) === 0 && Math.abs(mbCdf(1e6, kT) - 1) < 1e-12, 'F(0)=' + mbCdf(0,kT) + '  F(big)=' + mbCdf(1e6,kT).toFixed(6));
}

console.log('\n— Byte-twin parity (the inlined page core === this module, char-for-char) —');

// ── 5. BYTE-TWIN: the page's MB-CORE slice === the module's MB-CORE slice. ──
{
  const BEGIN = '// ===== MB CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== MB CORE END =====';
  const mod = readFileSync(join(__dir, 'mb-core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  // strip `export ` from the module slice — the page inlines the same bytes minus that keyword
  const modSlice = sliceBetween(mod, BEGIN, END).replace(/^(\s*)export function /gm, '$1function ');
  const pageSlice = sliceBetween(page, BEGIN, END);
  check('MB-CORE byte-twin: index.html core block === mb-core.mjs (export-stripped), char-for-char',
        modSlice != null && pageSlice != null && modSlice === pageSlice,
        modSlice == null ? 'module sentinels MISSING' : pageSlice == null ? 'page sentinels MISSING' :
          (modSlice === pageSlice ? 'slice ' + modSlice.length + ' chars identical' : 'DRIFT (mod ' + modSlice.length + ' vs page ' + pageSlice.length + ')'));
}

console.log('\n—— The Maxwell–Boltzmann core Node twin: ' + pass + '/' + total + ' ——\n');
process.exit(pass === total ? 0 : 1);
