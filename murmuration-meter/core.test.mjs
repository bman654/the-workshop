// ============================================================================
//  THE MURMURATION METER — Node twin of the in-page self-test.
//  Run:  node murmuration-meter/core.test.mjs
//
//  Re-proves the SAME legs the in-page pill proves (via the shared
//  runMurmurationSelfTest imported from ./core.mjs), splits each claim into its
//  OWN check carrying its tolerance, then:
//    • DEEPER Node-only re-derivations at a SECOND seed / larger N — re-measuring
//      the monotone collapse + the anchors, to show the law is scale/seed-free,
//      not tuned to one fixture.
//    • BYTE-TWIN parity — index.html's inlined MURMURATION CORE slice === ./core.mjs's
//      MURMURATION CORE slice, char-for-char (the page's runMurmurationSelfTest IS
//      the module's; the live flock integrates the same step()).
//    • SINGLE-SOURCE — the Vicsek-update fragment lives as live .mjs/.js code in
//      EXACTLY ONE file: ./core.mjs. The page holds it only inside the byte-twinned
//      slice (proven identical above).
//  process.exit(pass === total ? 0 : 1).
//
//  We NEVER pin η_c anywhere: the crossover is a soft, density/N-dependent slide,
//  crossed by eye. Only "φ is rotation-blind, the two ends anchor, and order only
//  falls as noise rises" is exact.
//
//  Depth note: this is a TOP-LEVEL exhibit (peer of the-shepherd), so repoRoot is
//  .. (murmuration-meter → repo root).
// ============================================================================
import {
  runMurmurationSelfTest, steadyPhi, polarization, rotateVelocities, makeState, step,
  disorderFloor, boxFor, ETA_LADDER, N_DEFAULT, SEED, TAU,
} from './core.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dir, '..');           // murmuration-meter → repo root
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

// ── 1. THE FULL SHARED SELF-TEST (the three legs, identical to the pill). ─────
console.log('\n— The full in-page self-test (the shared runMurmurationSelfTest legs) —');
{
  const r = runMurmurationSelfTest();
  for (const l of r.lines) check(l.name, l.ok, l.detail);
  check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);
}

console.log('\n— Each claim split into its own check (with its tolerance) —');

// ── 2. ROTATION-INVARIANCE its own check: build a steady flock, rotate every
//      heading by two angles, worst |Δφ| < 1e-12. φ is blind to which way the
//      whole flock faces. ──
{
  const s = makeState({ eta: 2.5, seed: 0xC0FFEE });
  for (let t = 0; t < 200; t++) step(s);
  const p0 = polarization(s);
  const d1 = Math.abs(polarization(rotateVelocities(s, 0.7)) - p0);
  const d2 = Math.abs(polarization(rotateVelocities(s, 3.14159)) - p0);
  const worst = Math.max(d1, d2);
  check('rotation-invariance: rotating the whole flock leaves φ unchanged to the bit — order is the agreement, not the absolute heading',
        worst < 1e-12, `|Δφ| = ${worst.toExponential(2)} (tol 1e-12)`);
}

// ── 3a. ORDER ANCHOR η=0 its own check: with no noise the flock locks into one
//      mind, 1−φ < 1e-6. ──
{
  const phi0 = steadyPhi({ eta: 0 });
  check('order anchor η=0: with no noise copying wins outright and the flock locks into one perfect mind (φ→1)',
        (1 - phi0) < 1e-6, `1−φ = ${(1 - phi0).toExponential(2)} (tol 1e-6)`);
}

// ── 3b. DISORDER ANCHOR η=2π its own check: at full noise the order sits on the
//      1/√N floor — φ̄·√N = O(1) at N and 4N, via a SEEDED ENSEMBLE (E=24). The
//      floor falls as 1/√N (the LAW across two scales), never an exact number. ──
{
  const C = 1.5, E = 24;
  const rows = []; let ok = true;
  for (const N of [N_DEFAULT, 4 * N_DEFAULT]){
    let acc = 0;
    for (let s = 0; s < E; s++) acc += steadyPhi({ N, eta: TAU, seed: SEED + 1 + s });
    const phiBar = acc / E;
    const scaled = phiBar * Math.sqrt(N);
    rows.push(`N=${N}: φ̄ ${phiBar.toFixed(4)}, φ̄·√N ${scaled.toFixed(3)} < ${C}`);
    if (!(scaled < C)) ok = false;
  }
  check('disorder anchor η=2π: at full noise the order sits on the 1/√N floor — φ̄·√N = O(1) at N=300 AND N=1200 (a seeded ensemble of 24) — the floor falls as 1/√N, a law across two scales, not a single number',
        ok, `${rows.join(' · ')} (bound C=${C})`);
}

// ── 4. MONOTONICITY its own check: walk ETA_LADDER, no positive rise > 0.04 AND
//      total fall > 0.5. We do NOT pin η_c — the crossover is soft, density/N-
//      dependent, crossed by eye. ──
{
  const TOL = 0.04;
  const phis = ETA_LADDER.map(eta => steadyPhi({ eta }));
  let mono = true, worstRise = 0;
  for (let i = 1; i < phis.length; i++){
    const rise = phis[i] - phis[i - 1];
    if (rise > worstRise) worstRise = rise;
    if (rise > TOL) mono = false;
  }
  const fall = phis[0] - phis[phis.length - 1];
  check('monotonicity: steady φ over η=[0,1,2,3,4,5,2π] only ever falls (no rise > 0.04) and collapses from one mind to a milling crowd (Δφ > 0.5) — louder noise, less flock; NO η_c is pinned, the crossover is soft and crossed by eye',
        mono && fall > 0.5,
        `φ-ladder [${phis.map(x => x.toFixed(3)).join(', ')}] · falls ${fall.toFixed(3)} · worst upward blip ${worstRise.toExponential(2)} (tol ${TOL})`);
}

console.log('\n— Deeper Node-only re-derivations (a SECOND seed / larger N: scale & seed freedom) —');

// ── 5a. THE MONOTONE COLLAPSE RE-MEASURED at a SECOND seed, larger N=600. ─────
{
  const N = 600, seed = 0x5EED1;
  const phis = ETA_LADDER.map(eta => steadyPhi({ N, eta, seed }));
  let mono = true, worstRise = 0;
  for (let i = 1; i < phis.length; i++){ const d = phis[i] - phis[i-1]; if (d > worstRise) worstRise = d; if (d > 0.04) mono = false; }
  const fall = phis[0] - phis[phis.length - 1];
  check('order collapses at N=600, seed=0x5EED1: a DIFFERENT, larger flock still falls monotonically from one mind to a milling crowd (Δφ > 0.5) — the transition is not tuned to one fixture',
        mono && fall > 0.5,
        `φ-ladder [${phis.map(x => x.toFixed(3)).join(', ')}] · falls ${fall.toFixed(3)} (worst blip ${worstRise.toExponential(2)})`);
}

// ── 5b. THE 1/√N FLOOR RE-MEASURED across FOUR sizes at η=2π (the law, not a point).
{
  const C = 1.6, E = 10;
  const sizes = [100, 200, 400, 800];
  let ok = true; const rows = [];
  for (const N of sizes){
    let acc = 0;
    for (let s = 0; s < E; s++) acc += steadyPhi({ N, eta: TAU, seed: 0x77A1B + s });
    const phiBar = acc / E, scaled = phiBar * Math.sqrt(N);
    rows.push(`N=${N}: φ̄·√N ${scaled.toFixed(3)}`);
    if (!(scaled < C)) ok = false;
  }
  check('the 1/√N disorder floor across four sizes (seed 0x77A1B): at η=2π the order sits under C/√N at N=100,200,400,800 — the floor genuinely scales as 1/√N, it is a law',
        ok, `${rows.join(' · ')} (bound C=${C})`);
}

// ── 6. SELF INCLUDED at distance 0: makeState then verify the η=0 anchor needs
//      the j==i term — a flock isolated to one bird must read φ=1 at η=0 (its own
//      heading is its only neighbour). A direct re-derivation of the self-term. ──
{
  const s = makeState({ N: 1, L: 1, eta: 0, seed: 0xABC });
  for (let t = 0; t < 10; t++) step(s);
  check('self included: a lone bird (N=1) at η=0 keeps φ=1 — at distance 0 the j==i term always passes ≤r², the anchor that makes η=0 ⇒ φ=1',
        Math.abs(polarization(s) - 1) < 1e-12, `φ = ${polarization(s).toFixed(6)} (tol 1e-12)`);
}

console.log('\n— Single-source discipline (the proofs the integrator is not re-typed) —');

// ── 7. BYTE-TWIN PARITY: index.html's MURMURATION CORE === ./core.mjs's. ──────
{
  const BEGIN = '// ===== MURMURATION CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== MURMURATION CORE END =====';
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const modSlice = sliceBetween(mod, BEGIN, END);
  const pageSlice = sliceBetween(page, BEGIN, END);
  check('byte-twin parity (MURMURATION CORE): index.html\'s inlined MURMURATION CORE block is char-for-char ./core.mjs (between sentinels) — the page\'s runMurmurationSelfTest IS the module\'s, and the live flock integrates the same step()',
        modSlice != null && pageSlice != null && modSlice === pageSlice,
        modSlice == null ? 'module sentinels MISSING' : pageSlice == null ? 'page sentinels MISSING' :
          (modSlice === pageSlice ? `slice ${modSlice.length} chars identical` : `DRIFT (mod ${modSlice.length} vs page ${pageSlice.length})`));
}

// ── 8. SINGLE-SOURCE GREP: the Vicsek-update fragment — the periodic min-image
//     wrap — lives as live .mjs/.js CODE in EXACTLY ONE file: ./core.mjs. The page
//     holds it inside the byte-twin slice (html, proven identical above). Built
//     here from parts so this test file is NOT itself a hit. ──
{
  // the min-image wrap fragment, as core.mjs writes it, assembled from parts so
  // this test file does not contain it verbatim (else the grep would flag the test).
  const FRAG = 'L * ' + 'Math.round(dx ' + '/ L)';
  const skipDirs = new Set(['.git', 'node_modules', 'assets']);
  const codeHits = [], allHits = [];
  function walk(dir){
    for (const ent of readdirSync(dir, { withFileTypes: true })){
      const p = join(dir, ent.name);
      if (ent.isDirectory()){ if (!skipDirs.has(ent.name)) walk(p); continue; }
      if (!/\.(mjs|js|html)$/.test(ent.name)) continue;
      let src; try { src = readFileSync(p, 'utf8'); } catch { continue; }
      const rel = p.slice(repoRoot.length + 1);
      if (src.includes(FRAG)){
        allHits.push(rel);
        if (rel.endsWith('.mjs') || rel.endsWith('.js')) codeHits.push(rel);
      }
    }
  }
  walk(repoRoot);
  const ok = codeHits.length === 1 && codeHits[0] === 'murmuration-meter/core.mjs';
  check('single-source: the Vicsek periodic min-image wrap literal is live code in EXACTLY ONE file: murmuration-meter/core.mjs; the page only byte-twins it (html, proven identical above)',
        ok, `code-literal files: [${codeHits.join(', ')}] · all text mentions: [${allHits.join(', ')}]`);
}

console.log(`\n—— The Murmuration Meter Node twin: ${pass}/${total} ——\n`);
process.exit(pass === total ? 0 : 1);
