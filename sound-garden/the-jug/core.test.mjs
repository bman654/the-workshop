// ============================================================================
//  THE JUG — Node twin of the in-page self-test.
//  Run:  node sound-garden/the-jug/core.test.mjs
//
//  Re-proves the SAME five legs the in-page pill proves (via the shared
//  runJugSelfTest imported from ./core.mjs — itself built on pitch-core's
//  semiToFreq/noteName), then asserts the discipline:
//    • DEEPER re-derivations — the lumped identity (2π·f_H)² === k/m and the three
//      lever ratios hold on 200 FRESH geometries; and they hold under a SECOND
//      (c, ρ) pair (the physics is not tuned to one air); the single-mode negative
//      control has TEETH (a harmonic-ladder probe lights 2f,3f to ~0.36 — the
//      measurement is NOT blind) while the jug stays single-mode (<1e-3); and an 8×
//      drive gives a bit-identical waveform (the ODE is linear — louder, never higher).
//    • BYTE-TWIN parity — index.html's inlined JUG CORE slice === ./core.mjs's, and
//      the borrowed PITCH CORE slice === ../pitch-core.mjs's, char-for-char.
//    • SINGLE-SOURCE — the Helmholtz law body is live .mjs CODE in EXACTLY ONE file
//      (./core.mjs); renderResonator is defined in exactly one .mjs; and core.mjs
//      IMPORTS semiToFreq/noteName rather than re-typing them.
//  process.exit(pass === total ? 0 : 1).
//
//  Depth note: the leaf lives one level deeper than the garden, so repoRoot is
//  ../.. (the-jug → sound-garden → repo root), like the-comb.
// ============================================================================
import {
  runJugSelfTest, helmholtzFreq, springConstant, slugMass, omegaFromLumped,
  centsRatio, renderResonator, goertzel, makeRng,
  A0, V0, LEFF0, C_AIR, RHO_AIR, semiToFreq, noteName,
} from './core.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dir, '..', '..');     // the-jug → sound-garden → repo root
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

// ── 1. THE FULL SHARED SELF-TEST (the five legs, identical to the pill). ──────
console.log('\n— The full in-page self-test (the shared runJugSelfTest legs) —');
{
  const r = runJugSelfTest(A0, V0, LEFF0);
  for (const l of r.lines) check(l.name, l.ok, l.detail);
  check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);
  // the home pitch reads A3 from the borrowed pitch anchor (the pip's note label).
  const fH = helmholtzFreq({ A: A0, V: V0, Leff: LEFF0 });
  const semi = Math.round(12 * Math.log2(fH / semiToFreq(0)));
  check('the home geometry rings A3 (the borrowed pitch anchor names the pip): f_H ≈ 220 Hz ⇒ noteName === A3',
        noteName(semi) === 'A3', `f_H = ${fH.toFixed(2)} Hz → ${noteName(semi)}`);
}

console.log('\n— Deeper Node-only re-derivations (200 fresh geometries, a 2nd air, the neg-control teeth) —');

// ── 2a. THE LUMPED IDENTITY + LEVER RATIOS ON 200 FRESH GEOMETRIES: (2π·f_H)² === k/m
//   to <1e-12 relative, and halve-V / double-A / quad-L give √2, √2, ½ exactly — at
//   200 random geometries DISJOINT from the pill's sweep. Scale-free, not one tuning.
{
  let ok = true, worstId = 0, worstHalf = 0, worstDbl = 0, worstQuad = 0;
  const rng = makeRng(99991);
  for (let i = 0; i < 200; i++){
    const A = A0 * (0.25 + 3.0 * (rng() * 0.5 + 0.5));
    const V = V0 * (0.25 + 3.0 * (rng() * 0.5 + 0.5));
    const L = LEFF0 * (0.25 + 4.5 * (rng() * 0.5 + 0.5));
    const omega = 2 * Math.PI * helmholtzFreq({ A, V, Leff: L });
    const omLump = omegaFromLumped(springConstant(A, V), slugMass(A, L));
    worstId = Math.max(worstId, Math.abs(omega - omLump) / omLump);
    const base = helmholtzFreq({ A, V, Leff: L });
    worstHalf = Math.max(worstHalf, Math.abs(helmholtzFreq({ A, V: V / 2, Leff: L }) / base - Math.SQRT2) / Math.SQRT2);
    worstDbl  = Math.max(worstDbl,  Math.abs(helmholtzFreq({ A: 2 * A, V, Leff: L }) / base - Math.SQRT2) / Math.SQRT2);
    worstQuad = Math.max(worstQuad, Math.abs(helmholtzFreq({ A, V, Leff: 4 * L }) / base - 0.5) / 0.5);
    if (worstId >= 1e-12 || worstHalf >= 1e-12 || worstDbl >= 1e-12 || worstQuad >= 1e-12) ok = false;
  }
  check('200 fresh geometries: (2π·f_H)² === k/m to <1e-12, and halve-V → √2, double-A → √2, quad-L → ½ all exact — the lumped identity and the three interval levers are scale-free, not tuned to one jug',
        ok, `identity worst rel Δ ${worstId.toExponential(2)} · halve-V Δ ${worstHalf.toExponential(2)} · double-A Δ ${worstDbl.toExponential(2)} · quad-L Δ ${worstQuad.toExponential(2)}`);
}

// ── 2b. A SECOND (c, ρ) PAIR: the lumped identity holds for a DIFFERENT air (cooler
//   room, c=340, ρ=1.0), and the lever ratios are independent of (c, ρ) — they are
//   pure geometry. So the proof is the physics, not the one constant we picked.
{
  const c2 = 340, rho2 = 1.0;
  let ok = true, worstId = 0;
  const rng = makeRng(31337);
  for (let i = 0; i < 100; i++){
    const A = A0 * (0.3 + 2.4 * (rng() * 0.5 + 0.5));
    const V = V0 * (0.3 + 2.4 * (rng() * 0.5 + 0.5));
    const L = LEFF0 * (0.3 + 4.0 * (rng() * 0.5 + 0.5));
    const omega = 2 * Math.PI * helmholtzFreq({ A, V, Leff: L, c: c2 });
    const omLump = omegaFromLumped(springConstant(A, V, rho2, c2), slugMass(A, L, rho2));
    worstId = Math.max(worstId, Math.abs(omega - omLump) / omLump);
    if (worstId >= 1e-12) ok = false;
  }
  // the ratios are c/ρ-independent: halving V at c=340 still gives √2 (= at c=343)
  const base340 = helmholtzFreq({ A: A0, V: V0, Leff: LEFF0, c: c2 });
  const half340 = helmholtzFreq({ A: A0, V: V0 / 2, Leff: LEFF0, c: c2 }) / base340;
  const ratioCIndep = Math.abs(half340 - Math.SQRT2) / Math.SQRT2 < 1e-12;
  check('a SECOND air (c=340 m/s, ρ=1.0 kg/m³): the lumped identity (2π·f_H)² === k/m still holds to <1e-12, and halve-V still gives exactly √2 — the levers are pure geometry, independent of (c, ρ); the proof is the physics, not the air we chose',
        ok && ratioCIndep, `identity worst rel Δ ${worstId.toExponential(2)} · halve-V at c=340 → ${centsRatio(half340).toFixed(3)}¢ (=600¢)`);
}

// ── 2c. THE NEGATIVE CONTROL HAS TEETH (not blind): at a FRESH geometry with a FRESH
//   Q & seed, a harmonic-LADDER probe lights 2f,3f to ~0.36 (the measurement CAN see
//   partials), while the jug single mode stays at the far-skirt floor (<1e-3) — a
//   >100× gap; and an 8× drive reproduces the waveform bit-for-bit ×8 (the ODE is
//   linear, so the pitch cannot move with loudness).
{
  const A = 1.4 * A0, V = 0.7 * V0, L = 1.3 * LEFF0;       // a fresh geometry (not the baseline)
  const fH = helmholtzFreq({ A, V, Leff: L }), sr = 44100, secs = 1.0, Qp = 20, seedp = 7;
  const jug = renderResonator([{ freq: fH, weight: 1 }], { Q: Qp, seed: seedp, sr, seconds: secs });
  const ladder = renderResonator(
    [{ freq: fH, weight: 1 }, { freq: 2 * fH, weight: 2.23 }, { freq: 3 * fH, weight: 7.57 }],
    { Q: Qp, seed: seedp, sr, seconds: secs });
  const m = Math.floor(0.1 * sr), e = jug.length;
  const Ej = n => goertzel(jug, m, e, n * fH, sr), El = n => goertzel(ladder, m, e, n * fH, sr);
  const jugRatio = (Ej(2) ** 2 + Ej(3) ** 2) / (Ej(1) ** 2);
  const ladRatio = (El(2) ** 2 + El(3) ** 2) / (El(1) ** 2);
  const drop = ladRatio / jugRatio;
  const jug8 = renderResonator([{ freq: fH, weight: 1 }], { Q: Qp, seed: seedp, sr, seconds: secs, gain: 8 });
  let worstLin = 0, maxAbs = 0;
  for (let i = 0; i < jug.length; i++){ const ref = 8 * jug[i]; maxAbs = Math.max(maxAbs, Math.abs(ref)); worstLin = Math.max(worstLin, Math.abs(jug8[i] - ref)); }
  const linRel = maxAbs > 0 ? worstLin / maxAbs : 0;
  check('the neg-control has TEETH (fresh geometry, Q=20, seed=7): a harmonic-ladder probe lights 2f,3f to ~0.36 (the lens CAN see partials — its silence on the jug is a claim, not a blind spot), while the jug single mode stays <1e-3 — a >100× gap; and an 8× drive gives a bit-identical waveform ×8 (linear ⇒ louder, never higher)',
        ladRatio > 0.1 && jugRatio < 1e-3 && drop > 100 && linRel < 1e-12,
        `ladder ${ladRatio.toFixed(3)} (>0.1, teeth) · jug ${jugRatio.toExponential(2)} (<1e-3, single mode) · ${Math.round(drop)}× gap · gain×8 rel Δ ${linRel.toExponential(1)}`);
}

console.log('\n— Byte-twin parity (the page IS the module) —');

// ── 3a. BYTE-TWIN PARITY (JUG CORE): index.html's inlined slice === ./core.mjs's,
//   char-for-char — the page's runJugSelfTest IS the module's, and the live pitch is
//   helmholtzFreq from the same law.
{
  const BEGIN = '// ===== JUG CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== JUG CORE END =====';
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const ms = sliceBetween(mod, BEGIN, END), ps = sliceBetween(page, BEGIN, END);
  check('byte-twin parity (JUG CORE): index.html\'s inlined CORE block is char-for-char ./core.mjs (between sentinels) — the page\'s runJugSelfTest IS the module\'s, and the live pitch is the same helmholtzFreq',
        ms != null && ps != null && ms === ps,
        ms == null ? 'module sentinels MISSING' : ps == null ? 'page sentinels MISSING' :
          (ms === ps ? `slice ${ms.length} chars identical` : `DRIFT (mod ${ms.length} vs page ${ps.length})`));
}

// ── 3b. BYTE-TWIN PARITY (borrowed PITCH CORE): the page inlines pitch-core's PITCH
//   CORE slice (semiToFreq + noteName, so the pip's note label is single-sourced).
{
  const BEGIN = '// ===== PITCH CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== PITCH CORE END =====';
  const mod = readFileSync(join(__dir, '..', 'pitch-core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const ms = sliceBetween(mod, BEGIN, END), ps = sliceBetween(page, BEGIN, END);
  check('byte-twin parity (PITCH CORE): index.html\'s inlined PITCH CORE block is char-for-char ../pitch-core.mjs — semiToFreq + noteName (so the pip\'s "A3" label) are single-sourced, not re-typed',
        ms != null && ps != null && ms === ps,
        ms == null ? 'module sentinels MISSING' : ps == null ? 'page sentinels MISSING' :
          (ms === ps ? `slice ${ms.length} chars identical` : `DRIFT (mod ${ms.length} vs page ${ps.length})`));
}

console.log('\n— Single-source discipline (the Helmholtz law is not re-typed) —');

// ── 4. SINGLE-SOURCE GREP: the Helmholtz law body lives as live .mjs/.js CODE in
//   EXACTLY ONE file — ./core.mjs. The page holds it only inside the byte-twin slice
//   (proven identical above — html, not a second source). The fragment is assembled
//   from parts so this test file is NOT itself a hit.
{
  const FRAG = '(c / (2 * Math.PI)) * Math.sqrt(A / (V * ' + 'Leff))';
  const skipDirs = new Set(['.git', 'node_modules', 'assets', 'parallax-baseline']);
  const codeHits = [], allHits = [];
  function walk(dir){
    for (const ent of readdirSync(dir, { withFileTypes: true })){
      const p = join(dir, ent.name);
      if (ent.isDirectory()){ if (!skipDirs.has(ent.name)) walk(p); continue; }
      if (!/\.(mjs|js|html)$/.test(ent.name)) continue;
      let src; try { src = readFileSync(p, 'utf8'); } catch { continue; }
      const rel = p.slice(repoRoot.length + 1);
      if (src.includes(FRAG)){ allHits.push(rel); if (rel.endsWith('.mjs') || rel.endsWith('.js')) codeHits.push(rel); }
    }
  }
  walk(repoRoot);
  const ok = codeHits.length === 1 && codeHits[0] === 'sound-garden/the-jug/core.mjs';
  check('single-source: the Helmholtz law body (c/2π)·√(A/(V·L_eff)) is live code in EXACTLY ONE file — sound-garden/the-jug/core.mjs; the page only byte-twins it (html, proven identical above)',
        ok, `code-literal files: [${codeHits.join(', ')}] · all text mentions: [${allHits.join(', ')}]`);
}

// ── 5. SINGLE-SOURCE: the ODE render renderResonator is defined in exactly one .mjs,
//   and core.mjs IMPORTS semiToFreq/noteName (does not re-type them). ────────────
{
  const coreSrc = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const importsPitch = /import \{ semiToFreq, noteName \} from '\.\.\/pitch-core\.mjs'/.test(coreSrc);
  const noReTypedPitch = !/function semiToFreq\(/.test(coreSrc) && !/function noteName\(/.test(coreSrc);
  const DEF = 'function ' + 'renderResonator(modes, opts';
  const skipDirs = new Set(['.git', 'node_modules', 'assets', 'parallax-baseline']);
  const defs = [];
  function walk(dir){
    for (const ent of readdirSync(dir, { withFileTypes: true })){
      const p = join(dir, ent.name);
      if (ent.isDirectory()){ if (!skipDirs.has(ent.name)) walk(p); continue; }
      if (!/\.mjs$/.test(ent.name)) continue;
      let src; try { src = readFileSync(p, 'utf8'); } catch { continue; }
      const rel = p.slice(repoRoot.length + 1);
      if (src.includes(DEF)) defs.push(rel);
    }
  }
  walk(repoRoot);
  const here = 'sound-garden/the-jug/core.mjs';
  const defOK = defs.length === 1 && defs[0] === here;
  check('single-source (pitch + ODE render): core.mjs IMPORTS semiToFreq/noteName (does not re-type them), and the matrix-exp render renderResonator is defined in EXACTLY ONE .mjs (core.mjs)',
        importsPitch && noReTypedPitch && defOK,
        `imports pitch=${importsPitch} · re-types pitch=${!noReTypedPitch} · renderResonator defined in [${defs.join(', ')}]`);
}

console.log(`\n—— The Jug Node twin: ${pass}/${total} ——\n`);
process.exit(pass === total ? 0 : 1);
