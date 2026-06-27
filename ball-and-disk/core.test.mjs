// The Ball-and-Disk Integrator — the Node twin. runSelfTest() is the SOLE oracle (the page
// runs the SAME byte-identical slab). This twin (A) runs the six self-test checks and prints
// passed/total + one PASS/FAIL line each; (B) adds stronger rigour — a denser generic-u sweep
// at higher N, a randomized program battery, and the chain at independent radii; and (C)
// byte-parity-checks the INTEGRATOR-CORE slab inlined into index.html against core.mjs,
// sentinel-to-sentinel. Zero deps (node:fs + node:path only). Exit 0 = GREEN.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as core from './core.mjs';

const here = dirname(fileURLToPath(import.meta.url));
let fails = 0;
const line = (ok, msg) => { if (!ok) fails++; console.log((ok ? 'PASS' : 'FAIL') + ' ' + msg); };
const TAU = Math.PI * 2;

// ── (A) the six self-test checks (the page's in-page pill runs this exact function) ──
{
  const r = core.runSelfTest();
  console.log('selfTest oracle:', r.passed + '/' + r.total, r.ok ? 'GREEN' : 'RED');
  for (const c of r.checks) line(c.pass, c.name + '  ::  ' + c.info);
}

// ── (B) extra rigour the page need not run: denser sweeps, higher N, randomized programs ──
{
  const EPS = 1e-12;
  // B1 · the three canonical programs at a higher N and a denser u sweep (no period luck)
  let mx1 = 0;
  for (let i = 1; i <= 2000; i++) {
    const u = i / 2000 * 6 * Math.PI;
    mx1 = Math.max(mx1,
      Math.abs(core.rollOut((s) => 0.42, u, core.R) - 0.42 * u / core.R),
      Math.abs(core.rollOut((s) => 0.3 * s, u, core.R) - 0.3 * u * u / 2 / core.R),
      Math.abs(core.rollOut(Math.sin, u, core.R, 2048) - (1 - Math.cos(u)) / core.R));
  }
  line(mx1 < EPS, 'B1 · 2000-pt u∈(0,6π] sweep: 3 canonical programs match closed form  ::  max|Δ|=' + mx1.toExponential(2));

  // B2 · randomized polynomial programs (Boole exact ≤ quintic), RELATIVE tolerance
  let mt = Math.PI * 137.5, mx2 = 0;
  const rnd = () => { mt = (mt * 16807) % 2147483647; return mt / 2147483647; };
  for (let t = 0; t < 3000; t++) {
    const deg = (rnd() * 6) | 0;                       // 0..5
    const c = (rnd() - 0.5) * 4;
    const u = 0.1 + rnd() * 4 * Math.PI;
    const want = c * u ** (deg + 1) / (deg + 1) / core.R;
    mx2 = Math.max(mx2, Math.abs(core.rollOut((s) => c * s ** deg, u, core.R) - want) / (Math.abs(want) + 1));
  }
  line(mx2 < EPS, 'B2 · 3000 random polynomial programs (deg≤5) bit-exact (rel)  ::  max rel|Δ|=' + mx2.toExponential(2));

  // B3 · the chain at independent radii reproduces ∫∫ for a polynomial input (bit-exact, rel)
  let mx3 = 0;
  for (let i = 1; i <= 400; i++) {
    const u = i / 400 * 4 * Math.PI;
    const want = 0.5 * u * u / (2 * core.R1 * core.R2);   // ∫∫ const = u²/2
    mx3 = Math.max(mx3, Math.abs(core.chainOut((s) => 0.5, u, core.R1, core.R2) - want) / (Math.abs(want) + 1));
    // and the transcendental chain ∫∫sin = u − sin u (absolute, output O(1))
    mx3 = Math.max(mx3, Math.abs(core.chainOut(Math.sin, u, core.R1, core.R2, 1536) - (u - Math.sin(u)) / (core.R1 * core.R2)));
  }
  line(mx3 < EPS, 'B3 · 2-stage chain ∫∫ at independent radii: const→u²/2 · sin→u−sin u  ::  max|Δ|=' + mx3.toExponential(2));

  // B4 · NEG-CONTROL stress: x=0 across pathological spins is bit-exactly 0
  let z = true;
  for (const u of [TAU, TAU * 1e3, TAU * 1e6, TAU * 1e9, 1e-30]) if (core.rollOut((s) => 0, u, core.R, 4096) !== 0) z = false;
  line(z, 'B4 · NEG-CONTROL: x≡0 integrates to exactly 0 across 1e-30 … 1e9 turns');
}

// ── (C) BYTE-PARITY: the slab inlined into index.html === core.mjs's slab, sentinel-to-sentinel ──
{
  const START = '// === INTEGRATOR-CORE BEGIN ===';
  const END = '// === INTEGRATOR-CORE END ===';
  const slab = (text) => {
    const i = text.indexOf(START), j = text.indexOf(END);
    if (i < 0 || j < 0) return null;
    return text.slice(i, j + END.length);
  };
  const modBlock = slab(readFileSync(join(here, 'core.mjs'), 'utf8'));
  const htmlBlock = slab(readFileSync(join(here, 'index.html'), 'utf8'));
  const ok = modBlock !== null && htmlBlock !== null && modBlock === htmlBlock;
  line(ok, 'C · law slab inlined in index.html is BYTE-IDENTICAL to core.mjs  ::  ' +
    (modBlock ? modBlock.length : 'n/a') + ' bytes vs ' + (htmlBlock ? htmlBlock.length : 'n/a') + ' bytes');
}

console.log(fails === 0 ? '\nALL GREEN ✓' : '\n' + fails + ' FAILED ✗');
process.exit(fails === 0 ? 0 : 1);
