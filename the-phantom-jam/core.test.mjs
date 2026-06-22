// ============================================================================
//  THE PHANTOM JAM — Node twin of the in-page self-test.
//  Run:  node the-phantom-jam/core.test.mjs
//
//  Re-proves the SAME cruxes the in-page pill proves (via the shared
//  runPhantomJamSelfTest imported from ./core.mjs), splits each claim into its
//  OWN check carrying its tolerance, then:
//    • DEEPER Node-only re-derivations at a SECOND seed / a DIFFERENT ring length
//      L — re-measuring the backward wave, re-scanning the grow/decay boundary,
//      re-confirming the bloom at a different interior N — to show the law is
//      scale/seed-free, not tuned to one fixture.
//    • BYTE-TWIN parity — index.html's inlined PHANTOM-JAM CORE slice === ./core.mjs's
//      PHANTOM-JAM CORE slice, char-for-char (the page's runPhantomJamSelfTest IS
//      the module's; the live ring integrates the same step()).
//    • SINGLE-SOURCE — the OV-relax update fragment lives as live .mjs/.js code in
//      EXACTLY ONE file: ./core.mjs. The page holds it only inside the byte-twinned
//      slice (proven identical above).
//  process.exit(pass === total ? 0 : 1).
//
//  We NEVER pin a precise critical density: near the band's lower root the linear
//  growth rate → 0, so a finite tap over a finite run may not bloom even where
//  linear theory says unstable — the boundary there is SOFT and run-length-
//  dependent. Only the robust interior + the sharp upper edge are claimed.
//
//  Depth note: this is a TOP-LEVEL exhibit (peer of the murmuration-meter), so
//  repoRoot is .. (the-phantom-jam → repo root).
// ============================================================================
import {
  runPhantomJamSelfTest, makeRing, step, brake, spacingVariance, maxMinGap,
  minHeadwayCell, instabilityMargin, unstableBand, growDecay, waveSpeed, settle,
  V, V_prime, meanVel, SEED, L_DEFAULT, WAVE_REF, TOL_GROW, TOL_DECAY, TOL_WAVE, GUARD, HC,
} from './core.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dir, '..');           // the-phantom-jam → repo root
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

// ── 1. THE FULL SHARED SELF-TEST (the four cruxes, identical to the pill). ────
console.log('\n— The full in-page self-test (the shared runPhantomJamSelfTest cruxes) —');
{
  const r = runPhantomJamSelfTest();
  for (const l of r.lines) check(l.name, l.ok, l.detail);
  check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);
}

console.log('\n— Each crux split into its own check (with its tolerance) —');

// ── 2. CRUX-1 its own check: deep interior N=22, smooth ring machine-flat, one
//      tap blooms (varEnd > TOL_GROW, gap > 1.0). ──
{
  const st = settle(22, L_DEFAULT, SEED, 50);
  const varStart = spacingVariance(st);
  const gd = growDecay(22, L_DEFAULT, SEED, { settle: 50, run: 4000 });
  check('grow: the smooth N=22 ring is a machine-flat fixed point (varStart < 1e-12) and ONE brake tap blooms a stop-and-go jam (varEnd > TOL_GROW, gap > 1.0) — a jam with no cause but a single tap',
        varStart < 1e-12 && gd.varEnd > TOL_GROW && gd.gap > 1.0,
        `varStart ${varStart.toExponential(2)} · varEnd ${gd.varEnd.toFixed(3)} (tol ${TOL_GROW}) · gap ${gd.gap.toFixed(3)}`);
}

// ── 3. CRUX-2 its own check: the two-sided neg-control — sparse N=14 AND packed
//      N=46 both decay under the same tap. ──
{
  const sparse = growDecay(14, L_DEFAULT, SEED, { settle: 50, run: 4000 });
  const packed = growDecay(46, L_DEFAULT, SEED, { settle: 50, run: 4000 });
  check('neg-control (two-sided): the same tap decays when too SPARSE (N=14) AND when packed too TIGHT (N=46) — the jam band is a two-sided window (both varEnd < TOL_DECAY), the ring re-heals at both ends',
        sparse.varEnd < TOL_DECAY && packed.varEnd < TOL_DECAY,
        `sparse ${sparse.varEnd.toExponential(2)} · packed ${packed.varEnd.toExponential(2)} (tol ${TOL_DECAY})`);
}

// ── 4. CRUX-3 its own check: the backward wave speed is negative AND constant. ──
{
  const s1 = waveSpeed(22, L_DEFAULT, SEED);
  const s2 = waveSpeed(24, L_DEFAULT, SEED + 1);
  check('backward wave constant: at two jam-prone densities the wave speed is NEGATIVE (the jam crawls against the cars) and within TOL_WAVE of WAVE_REF = −0.58 cells/time — the load-bearing backward sign, and a constant',
        s1 < 0 && s2 < 0 && Math.abs(s1 - WAVE_REF) < TOL_WAVE && Math.abs(s2 - WAVE_REF) < TOL_WAVE,
        `s1 ${s1.toFixed(4)} · s2 ${s2.toFixed(4)} · WAVE_REF ${WAVE_REF} (tol ${TOL_WAVE})`);
}

// ── 5. CRUX-4 its own check: derived prediction === observed boundary across the
//      scan, no mismatches, the sharp upper edge flips N=17→N=18. ──
{
  let checked = 0, mismatches = 0;
  for (let N = 14; N <= 48; N++){
    const m = instabilityMargin(N, L_DEFAULT);
    let predUnstable;
    if (m > GUARD) predUnstable = true; else if (m < -GUARD) predUnstable = false; else continue;
    const obsGrew = growDecay(N, L_DEFAULT, SEED, { settle: 50, run: 8000 }).varEnd > 1e-2;
    checked++;
    if (predUnstable !== obsGrew) mismatches++;
  }
  const grew17 = growDecay(17, L_DEFAULT, SEED, { settle: 50, run: 8000 }).varEnd > 1e-2;
  const grew18 = growDecay(18, L_DEFAULT, SEED, { settle: 50, run: 8000 }).varEnd > 1e-2;
  check('derived threshold agrees with observed boundary: 2·V′(L/N) − A predicts grow/decay with ZERO mismatches over 22 classified densities (GUARD=0.3 skips the soft fringe), and the sharp upper edge flips exactly N=17(decay)→N=18(grow)',
        checked >= 20 && mismatches === 0 && !grew17 && grew18,
        `${checked} classified · ${mismatches} mismatches · edge N=17 ${grew17 ? 'GREW' : 'decayed'} → N=18 ${grew18 ? 'GREW' : 'decayed'}`);
}

console.log('\n— Deeper Node-only re-derivations (a SECOND seed / a DIFFERENT ring length: scale & seed freedom) —');

// ── 6a. THE BACKWARD WAVE RE-MEASURED at a THIRD ring length L=40 (density rescaled
//      to keep h* in the interior). The wave is still negative — the backward
//      crawl is not tuned to L=50. ──
{
  // L=40, N chosen so h* ≈ 2.0 (interior): N = round(40/2.0) = 20.
  const L = 40, N = 20;
  const m = instabilityMargin(N, L);
  const s = waveSpeed(N, L, SEED + 7);
  check('backward wave at a DIFFERENT ring (L=40, N=20, h*=2.0, interior): the wave speed is still NEGATIVE — the jam crawls backward regardless of the ring length, not a fixture of L=50',
        m > 0 && s < 0,
        `margin ${m.toFixed(3)} (interior) · wave ${s.toFixed(4)} cells/time (negative)`);
}

// ── 6b. THE GROW/DECAY BOUNDARY RE-SCANNED at a SECOND seed: the derived
//      prediction still has zero mismatches across the classified densities. ──
{
  const seed2 = SEED + 101;
  let checked = 0, mismatches = 0;
  for (let N = 14; N <= 48; N++){
    const m = instabilityMargin(N, L_DEFAULT);
    let predUnstable;
    if (m > GUARD) predUnstable = true; else if (m < -GUARD) predUnstable = false; else continue;
    const obsGrew = growDecay(N, L_DEFAULT, seed2, { settle: 50, run: 8000 }).varEnd > 1e-2;
    checked++;
    if (predUnstable !== obsGrew) mismatches++;
  }
  check('boundary re-scanned at a SECOND seed (0x9A11+101): the derived threshold still predicts grow/decay with ZERO mismatches across the classified densities — the agreement is not tuned to one seed',
        checked >= 20 && mismatches === 0,
        `${checked} classified · ${mismatches} mismatches`);
}

// ── 6c. BLOOM RE-CONFIRMED at a DIFFERENT interior N=26 and a THIRD seed: still
//      grows from one tap (the instability is robust across the interior). ──
{
  const gd = growDecay(26, L_DEFAULT, SEED + 202, { settle: 50, run: 4000 });
  const m = instabilityMargin(26, L_DEFAULT);
  check('bloom at a DIFFERENT interior density (N=26, margin > 0, third seed): one tap still blooms a jam (varEnd > TOL_GROW) — the instability fills the whole interior, not just N=22',
        m > 0 && gd.varEnd > TOL_GROW,
        `margin ${m.toFixed(3)} · varEnd ${gd.varEnd.toFixed(3)} (tol ${TOL_GROW})`);
}

// ── 7. THE BAND MATCHES ITS CLOSED FORM: unstableBand() endpoints are exactly
//      where instabilityMargin crosses zero (2·V′ = A), an internal consistency
//      check of the derived spine. ──
{
  const [hLo, hHi] = unstableBand();
  const mLo = 2 * V_prime(hLo) - 1, mHi = 2 * V_prime(hHi) - 1;
  const symmetric = Math.abs((hLo + hHi) / 2 - HC) < 1e-12;     // centred on HC
  check('the unstable band is exactly the zero-set of the margin: 2·V′(h±) − A = 0 at both endpoints and the band is centred on the comfortable headway HC=2 — the closed form and the margin agree to machine precision',
        Math.abs(mLo) < 1e-12 && Math.abs(mHi) < 1e-12 && symmetric,
        `band [${hLo.toFixed(4)}, ${hHi.toFixed(4)}] · margin@ends ${mLo.toExponential(1)}, ${mHi.toExponential(1)}`);
}

// ── 8. FLUX IS CONSERVED: a smooth ring is a true fixed point — meanVel stays
//      put at V(L/N) and variance stays machine-flat under many steps (no tap). ──
{
  const N = 22, L = L_DEFAULT;
  const st = makeRing(N, L, SEED);
  const v0 = meanVel(st);
  for (let t = 0; t < 3000; t++) step(st);
  check('the smooth ring is a genuine fixed point: with NO tap, mean speed holds at V(L/N) and spacing variance stays machine-flat over 3000 steps — nothing blooms without a disturbance, so the jam truly has no cause but the tap',
        Math.abs(meanVel(st) - v0) < 1e-9 && spacingVariance(st) < 1e-12,
        `Δv ${Math.abs(meanVel(st) - v0).toExponential(2)} · var ${spacingVariance(st).toExponential(2)}`);
}

console.log('\n— Single-source discipline (the proofs the integrator is not re-typed) —');

// ── 9. BYTE-TWIN PARITY: index.html's PHANTOM-JAM CORE === ./core.mjs's. ──────
{
  const BEGIN = '// ===== PHANTOM-JAM CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== PHANTOM-JAM CORE END =====';
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const modSlice = sliceBetween(mod, BEGIN, END);
  const pageSlice = sliceBetween(page, BEGIN, END);
  check('byte-twin parity (PHANTOM-JAM CORE): index.html\'s inlined core block is char-for-char ./core.mjs (between sentinels) — the page\'s runPhantomJamSelfTest IS the module\'s, and the live ring integrates the same step()',
        modSlice != null && pageSlice != null && modSlice === pageSlice,
        modSlice == null ? 'module sentinels MISSING' : pageSlice == null ? 'page sentinels MISSING' :
          (modSlice === pageSlice ? `slice ${modSlice.length} chars identical` : `DRIFT (mod ${modSlice.length} vs page ${pageSlice.length})`));
}

// ── 10. SINGLE-SOURCE GREP: the OV-relax fragment — the speed-relaxation update
//     v += DT·A·(V(h) − v) — lives as live .mjs/.js CODE in EXACTLY ONE file:
//     ./core.mjs. The page holds it inside the byte-twin slice (html, proven
//     identical above). Built here from parts so this test file is NOT itself a
//     hit. ──
{
  // the OV-relax fragment, as core.mjs writes it, assembled from parts so this
  // test file does not contain it verbatim (else the grep would flag the test).
  const FRAG = 'DT * A * ' + '(V(h[i]) ' + '- v[i])';
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
  const ok = codeHits.length === 1 && codeHits[0] === 'the-phantom-jam/core.mjs';
  check('single-source: the Bando OV-relax update literal is live code in EXACTLY ONE file: the-phantom-jam/core.mjs; the page only byte-twins it (html, proven identical above)',
        ok, `code-literal files: [${codeHits.join(', ')}] · all text mentions: [${allHits.join(', ')}]`);
}

console.log(`\n—— The Phantom Jam Node twin: ${pass}/${total} ——\n`);
process.exit(pass === total ? 0 : 1);
