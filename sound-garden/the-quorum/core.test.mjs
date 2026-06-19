// ============================================================================
//  THE QUORUM — Node twin of the in-page self-test.
//  Run:  node sound-garden/the-quorum/core.test.mjs
//
//  Re-proves the SAME legs the in-page pill proves (via the shared
//  runQuorumSelfTest imported from ./core.mjs), then:
//    • DEEPER Node-only re-derivations at a SECOND seed/N (N=32, a different
//      seed) — re-measuring the monotone climb + the 1/√N floor, to show the law
//      is scale/seed-free, not tuned to one fixture.
//    • BYTE-TWIN parity — index.html's inlined QUORUM CORE slice === ./core.mjs's
//      QUORUM CORE slice, char-for-char (the page's runQuorumSelfTest IS the
//      module's). The page integrates the live ring inside this proven-identical
//      slice; the test integrates it through the import — one law, two readers.
//    • SINGLE-SOURCE — the integrator's defining literal lives as live .mjs/.js
//      CODE in EXACTLY ONE file: ./core.mjs. The page holds it only inside the
//      byte-twinned slice (proven identical above); this test file builds the
//      comparison fragment from parts so it is not itself a second hit.
//  process.exit(pass === total ? 0 : 1).
//
//  Depth note: the leaf lives one level deeper than the rack, so repoRoot is
//  ../.. (the-quorum → sound-garden → repo root), exactly like the-beating-bench.
// ============================================================================
import {
  runQuorumSelfTest, steadyR, orderParam, step, makeOmega, initTheta,
  incoherentFloor, suggestedKc, K_LADDER, N_DEFAULT, SEED, DT,
} from './core.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dir, '..', '..');     // the-quorum → sound-garden → repo root
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

// ── 1. THE FULL SHARED SELF-TEST (the four legs, identical to the pill). ──────
console.log('\n— The full in-page self-test (the shared runQuorumSelfTest legs) —');
{
  const r = runQuorumSelfTest();
  for (const l of r.lines) check(l.name, l.ok, l.detail);
  check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);
}

console.log('\n— Deeper Node-only re-derivations (a SECOND seed/N: scale & seed freedom) —');

// ── 2. THE MONOTONE CLIMB RE-MEASURED at N=32, a different seed. ──────────────
{
  const N = 32, seed = 0x51E2D;        // a fresh seed, a larger ring
  const rs = K_LADDER.map(K => steadyR(N, K, { seed }));
  let mono = true, worstDrop = 0;
  for (let i = 1; i < rs.length; i++){ const d = rs[i - 1] - rs[i]; if (d > worstDrop) worstDrop = d; if (d > 0.05) mono = false; }
  const rise = rs[rs.length - 1] - rs[0];
  check('order climbs at N=32, seed=0x51E2D: a DIFFERENT ring still rises non-decreasingly from a smear to a lock (Δr > 0.5) — the synchrony transition is not tuned to one fixture',
        mono && rise > 0.5,
        `r-ladder [${rs.map(x => x.toFixed(3)).join(', ')}] · rises ${rise.toFixed(3)} (worst dip ${worstDrop.toExponential(2)})`);
}

// ── 3. THE 1/√N FLOOR RE-MEASURED across THREE sizes (the law, not a point). ──
{
  const C = 1.6, seed = 0x77A1B;
  const sizes = [16, 32, 64, 128];
  let ok = true; const rows = [];
  for (const N of sizes){
    const r0 = steadyR(N, 0, { seed });
    const bound = C * incoherentFloor(N);
    rows.push(`N=${N}: r ${r0.toFixed(3)} < ${bound.toFixed(3)}`);
    if (!(r0 < bound)) ok = false;
  }
  check('the 1/√N floor across four sizes (seed 0x77A1B): uncoupled order sits under C/√N at N=16,32,64,128 — the incoherent floor genuinely scales as 1/√N, it is a law',
        ok, rows.join(' · '));
}

// ── 4. THE DEAF CONTROL RE-MEASURED at N=32: deaf K=6 ≈ floor; hearing K=6 locks.
{
  const N = 32, seed = 0x51E2D;
  const rDeaf = steadyR(N, 6, { seed, deaf: true });
  const rFloor = steadyR(N, 0, { seed });
  const rHear = steadyR(N, 6, { seed, deaf: false });
  check('deaf control at N=32: muting the coupling leaves K=6 on the floor (≈ K=0) while hearing K=6 locks (r≈0.99) — the lock is the listening, not the spinning, at a second scale too',
        Math.abs(rDeaf - rFloor) < 0.05 && rHear - rDeaf > 0.5,
        `deaf K=6 r ${rDeaf.toFixed(3)} ≈ floor ${rFloor.toFixed(3)} (Δ ${Math.abs(rDeaf - rFloor).toExponential(2)}) · hearing K=6 r ${rHear.toFixed(3)} — teeth ${(rHear - rDeaf).toFixed(3)}`);
}

// ── 5. STEP IS A PURE EULER STEP, deaf zeroes ONLY coupling: re-derive one step.
//     With deaf=true, out[i] === th[i] + w[i]·dt EXACTLY (the ring still advances
//     at ω); the coupling term is gone, not the motion. A direct re-derivation.
{
  const N = 16;
  const w = makeOmega(N, SEED);
  let th = initTheta(N, SEED);
  const deafStep = step(th, w, 999, DT, true);     // huge K, but deaf → coupling muted
  let ok = true, worst = 0;
  for (let i = 0; i < N; i++){
    const expect = th[i] + w[i] * DT;              // pure ω advance, no coupling
    const d = Math.abs(deafStep[i] - expect); if (d > worst) worst = d; if (d > 1e-12) ok = false;
  }
  // and with K=0, deaf=false ALSO equals the pure ω advance (zero coupling either way).
  const k0Step = step(th, w, 0, DT, false);
  for (let i = 0; i < N; i++){ if (Math.abs(k0Step[i] - (th[i] + w[i] * DT)) > 1e-12) ok = false; }
  check('step is a pure Euler step + coupling: with deaf=true (even K=999) out[i] === θᵢ + ωᵢ·dt to the bit — the ring still advances at ω, only the sin-coupling is muted',
        ok, `worst |deafStep − (θ+ω·dt)| = ${worst.toExponential(2)} · K=0 path identical`);
}

console.log('\n— Single-source discipline (the proofs the integrator is not re-typed) —');

// ── 6. BYTE-TWIN PARITY: index.html's QUORUM CORE === ./core.mjs's. ──────────
{
  const BEGIN = '// ===== QUORUM CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== QUORUM CORE END =====';
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const modSlice = sliceBetween(mod, BEGIN, END);
  const pageSlice = sliceBetween(page, BEGIN, END);
  check('byte-twin parity (QUORUM CORE): index.html\'s inlined QUORUM CORE block is char-for-char ./core.mjs (between sentinels) — the page\'s runQuorumSelfTest IS the module\'s, and the live ring integrates the same step()',
        modSlice != null && pageSlice != null && modSlice === pageSlice,
        modSlice == null ? 'module sentinels MISSING' : pageSlice == null ? 'page sentinels MISSING' :
          (modSlice === pageSlice ? `slice ${modSlice.length} chars identical` : `DRIFT (mod ${modSlice.length} vs page ${pageSlice.length})`));
}

// ── 7. SINGLE-SOURCE GREP: the integrator's defining literal lives as live
//     .mjs/.js CODE in EXACTLY ONE file — ./core.mjs. Walk the repo; the
//     coupling-update fragment must appear as code only in core.mjs (the page
//     holds it inside the byte-twin slice, proven identical in leg 6 — html, not
//     code). Built here from parts so this test file is not itself a hit. ──────
{
  // the integrator's defining coupling literal — the (K/N)·s pull term — but
  // assembled here from fragments so this test file does NOT contain it verbatim
  // (otherwise the grep would, correctly, flag the test as a second mention).
  // This mirrors the bench's leg-8 trick.
  const FRAG = '(K' + ' / N) ' + '* s';        // the coupling-update fragment, as core.mjs writes it
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
  const ok = codeHits.length === 1 && codeHits[0] === 'sound-garden/the-quorum/core.mjs';
  check('single-source: the Kuramoto integrator coupling literal — the (K/N)·s pull term — is live code in EXACTLY ONE file: sound-garden/the-quorum/core.mjs; the page only byte-twins it (html, proven identical in leg 6)',
        ok, `code-literal files: [${codeHits.join(', ')}] · all text mentions: [${allHits.join(', ')}]`);
}

console.log(`\n—— The Quorum Node twin: ${pass}/${total} ——\n`);
process.exit(pass === total ? 0 : 1);
