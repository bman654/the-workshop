#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
   core.test.mjs — the Node twin for THE AQUARIUM's trophic web.

   Imports the SAME core.mjs the page inlines (via forge:include) and runs the SAME
   runTrophicSelfTest(), then adds direct probes that assert each claim with explicit
   numbers, so the green pill in the page means exactly what this twin proves.

   The claims under proof:
     (1) THE CASCADE reaches ≥2 levels: pull the apex (lancetfish) and, time-averaged
         over K, lanternfish (lvl1) BLOOMS above baseline and copepods (lvl2) THIN
         below it — a genuine top-down trophic cascade two links down the column.
     (2) NEG-CONTROL (a) — a GENUINELY CONNECTED, NON-CASCADING node: removing the
         copepods (fully wired into the web, so its removal DOES perturb the dynamics)
         does NOT reproduce the apex-out signature — lanternfish FALLS, never blooms.
         This is the substantive control: it runs real perturbed dynamics yet fails to
         cascade up, so the bloom is specific to pulling the APEX.
     (3) NEG-CONTROL (b) — the intact web under fixed vent nutrient is a fixed point:
         total biomass drift stays within tol across the window.
     (4) BYTE-PARITY: the locked PARAM is exactly the frozen constant the page relies
         on (a guard against a silent re-tune drifting page ≠ proof).

   Run:  node the-aquarium/core.test.mjs      (exits 0 iff every assertion passes)
   ════════════════════════════════════════════════════════════════════════════ */
import { SP, PARAM, makeWeb, stepWeb, settle, meanOverK, runTrophicSelfTest } from './core.mjs';

let pass = 0, fail = 0;
const ok = (c, m) => {
  if (c) { pass++; console.log('  \x1b[32m✓\x1b[0m ' + m); }
  else   { fail++; console.log('  \x1b[31m✗ ' + m + '\x1b[0m'); }
};
const approx = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

console.log('\n  THE AQUARIUM — trophic web Node twin\n  ' + '─'.repeat(56));

/* ── the bundled self-test (the same object the page renders) ── */
const r = runTrophicSelfTest();
console.log('  base   (intact):', [...r.base].map(x => x.toFixed(2)).join('  '));
console.log('  no-apex (i=0):  ', [...r.noApex].map(x => x.toFixed(2)).join('  '));
console.log('  no-cope (i=2):  ', [...r.noCope].map(x => x.toFixed(2)).join('  '));
console.log('  ' + '─'.repeat(56));

/* (1) the cascade reaches ≥2 levels */
ok(r.lvl1, `lvl1: lanternfish BLOOMS pulling the apex (${r.base[1].toFixed(1)} → ${r.noApex[1].toFixed(1)}, > base + ${r.tol})`);
ok(r.lvl2, `lvl2: copepods THIN pulling the apex (${r.base[2].toFixed(1)} → ${r.noApex[2].toFixed(1)}, < base − ${r.tol})`);
ok(r.lvl1 && r.lvl2, `the cascade reaches 2 levels down the column`);
// direct re-probe of the apex itself going to ~0 when removed
ok(r.noApex[0] < 0.01, `the removed apex decays to ~0 (${r.noApex[0].toFixed(4)})`);

/* (2) neg-control (a): the connected, non-cascading node */
ok(r.negA, `neg-A: removing the CONNECTED copepods does NOT bloom lanternfish`);
ok(r.negAlanternDelta < 0, `neg-A is a REAL perturbation, not inert: lanternfish moves (Δ ${r.negAlanternDelta}) — and it FALLS, not blooms`);
// the discriminating contrast: same species, opposite sign, depending on WHICH node you pull
ok((r.noApex[1] - r.base[1]) > 0 && (r.noCope[1] - r.base[1]) < 0,
   `lanternfish rises on apex-removal but falls on copepod-removal — the bloom is apex-specific`);

/* (3) neg-control (b): the conserved fixed point */
ok(r.negB, `neg-B: intact biomass drift ${r.maxDrift} ≤ 2.0 (the web is a fixed point)`);

/* (4) byte-parity: the locked PARAM is exactly the frozen constant */
ok(approx(PARAM.dt, 0.05) && approx(PARAM.rBasal, 1.2) && approx(PARAM.K, 80), `PARAM scalars frozen (dt 0.05, rBasal 1.2, K 80)`);
ok(PARAM.a.length === 3 && approx(PARAM.a[0], 0.035) && approx(PARAM.a[1], 0.02) && approx(PARAM.a[2], 0.02), `PARAM.a frozen [0.035, 0.02, 0.02]`);
ok(PARAM.e.length === 3 && approx(PARAM.e[0], 0.7) && approx(PARAM.e[1], 0.7) && approx(PARAM.e[2], 0.5), `PARAM.e frozen [0.7, 0.7, 0.5]`);
ok(PARAM.m.length === 3 && approx(PARAM.m[0], 0.05) && approx(PARAM.m[1], 0.05) && approx(PARAM.m[2], 0.08), `PARAM.m frozen [0.05, 0.05, 0.08]`);

/* sanity: the species cast is the reconciled 4-band chain */
ok(SP.length === 4 && SP[0].key === 'lance' && SP[3].key === 'shrimp', `the cast is the 4-band chain (apex lancetfish … basal vent shrimp)`);

/* the bundled pass flag agrees with our direct probes */
ok(r.pass === true, `runTrophicSelfTest().pass === true`);

/* ── determinism: re-run gives byte-identical results (no hidden RNG / clock) ── */
const r2 = runTrophicSelfTest();
let identical = r.pass === r2.pass && r.maxDrift === r2.maxDrift && r.negAlanternDelta === r2.negAlanternDelta;
for (let i = 0; i < 4; i++) identical = identical && r.base[i] === r2.base[i] && r.noApex[i] === r2.noApex[i] && r.noCope[i] === r2.noCope[i];
ok(identical, `deterministic: a second run is byte-identical (no hidden RNG/clock)`);

console.log('  ' + '─'.repeat(56));
console.log(`  ${fail === 0 ? '\x1b[32mALL GREEN' : '\x1b[31mFAILED'}\x1b[0m — ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
