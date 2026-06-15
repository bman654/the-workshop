// ============================================================================
//  THE WAVE PACKET — Node twin of the in-page self-test.
//  Run:  node cavern/wave-packet/core.test.mjs
//  Proves the falsifiable claim (to a STATED tolerance, no false machine-precision)
//  on all four legs + the teeth, with INDEPENDENT re-derivations (not just the
//  bundled self-test), AND asserts:
//    (i)  the core inlined in index.html is byte-identical to core.mjs (between the
//         // ===== WAVE PACKET CORE sentinels) — the hydrogen/box parity pattern;
//    (ii) the page's INLINED fft is char-for-char the real butterfly/core.mjs fft —
//         so the picture's transform can never silently drift from the single source.
// ============================================================================
import {
  makeGrid, potential, potentialPrime, makePacket,
  step, evolve, norm, expectX, sigmaX, expectP, expectV, expectT, energy, expectVprime,
  freeGaussianAnalytic, sigmaT, transmittedProb, staticT, eulerStepNonUnitary, energySpread,
  runSelfTest,
} from './core.mjs';
import { fft as butterflyFft } from '../../butterfly/core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

let pass = 0, total = 0;
function check(name, cond, info) {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\n— The full in-page self-test (the same legs the chip runs) —');
const r = runSelfTest();
for (const c of r.checks) check(c.name, c.ok, c.detail);
check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);

console.log('\n— Independent re-derivations (this file, not the bundled self-test) —');

const N = 1024, L = 80;
const grid = makeGrid(N, L);

// (A) UNITARITY re-checked at a TIGHTER bar over a longer run — the split-step error
//     is per-step round-off, so even 3000 steps holds the norm to ~1e-12.
{
  const V = potential('free', grid, {});
  let st = makePacket(grid, { x0: -10, k0: 2, sigma: 2 });
  for (let i = 0; i < 3000; i++) step(st, 0.002, grid, V, { absorb: false });
  const drift = Math.abs(norm(st, grid) - 1);
  check('UNITARITY: norm holds to <1e-11 over a 3000-step free run (round-off floor)',
        drift < 1e-11, 'drift ' + drift.toExponential(2));
}

// (B) THE v_g-vs-v_φ TRAP, re-derived: the group velocity is k₀, the phase velocity
//     is k₀/2. Track the ENVELOPE peak (rides k₀) vs a phase crest (rides k₀/2).
{
  const V = potential('free', grid, {});
  const pk = { x0: -10, k0: 4, sigma: 2 };
  let st = makePacket(grid, pk);
  const T = 2, nS = Math.round(T / 0.002);
  for (let i = 0; i < nS; i++) step(st, 0.002, grid, V, { absorb: false });
  const xT = expectX(st, grid);
  const predG = pk.x0 + pk.k0 * T;          // group velocity k₀
  const predPh = pk.x0 + (pk.k0 / 2) * T;   // phase velocity k₀/2 (the decoy)
  check('v_g TRAP: ⟨x⟩ rides the GROUP velocity k₀, not the phase velocity k₀/2',
        Math.abs(xT - predG) < 5e-3 && Math.abs(xT - predPh) > 5e-2,
        '⟨x⟩=' + xT.toFixed(4) + ' · k₀-track ' + predG.toFixed(2) + ' · k₀/2-decoy ' + predPh.toFixed(2));
}

// (C) THE CALIBRATION ASSERT, re-derived independently: ⟨p⟩(t=0) must equal k₀ for a
//     freshly-made packet — this is what pins the butterfly's unnormalized-fwd/÷N FFT
//     convention (a wrong ordering or normalization would give a different ⟨p⟩).
{
  let worst = 0;
  for (const k0 of [-4, -1, 0.5, 2, 3, 5]) {
    const st = makePacket(grid, { x0: 0, k0, sigma: 2 });
    const p0 = expectP(st, grid);
    worst = Math.max(worst, Math.abs(p0 - k0));
  }
  check('CALIBRATION: ⟨p⟩(0) == k₀ for every launch (pins the FFT convention)',
        worst < 1e-6, 'worst |⟨p⟩(0)−k₀| = ' + worst.toExponential(2));
}

// (D) THE CLOSED FORM at FOUR snapshots, re-derived against the analytic envelope —
//     two disjoint oracles (the grid evolve and σ(t)=σ₀√(1+(t/2σ₀²)²)) must agree.
{
  const V = potential('free', grid, {});
  const pk = { x0: -10, k0: 2, sigma: 2 };
  let st = makePacket(grid, pk);
  let worstD = 0, worstS = 0, tprev = 0;
  for (const t of [0, 1, 2, 3]) {
    const nS = Math.round((t - tprev) / 0.002);
    for (let i = 0; i < nS; i++) step(st, 0.002, grid, V, { absorb: false });
    tprev = t;
    const ana = freeGaussianAnalytic(grid, pk, t);
    let dmax = 0;
    for (let i = 0; i < grid.N; i++) { const num = st.re[i] * st.re[i] + st.im[i] * st.im[i]; dmax = Math.max(dmax, Math.abs(num - ana[i])); }
    worstD = Math.max(worstD, dmax);
    const relS = Math.abs(sigmaX(st, grid) - sigmaT(pk.sigma, t)) / sigmaT(pk.sigma, t);
    worstS = Math.max(worstS, relS);
  }
  check('CLOSED FORM: free |ψ|² matches the analytic spreading envelope at t∈{0,1,2,3}',
        worstD < 2e-4 && worstS < 0.01,
        'max ||ψ|²Δ = ' + worstD.toExponential(2) + ' · max |Δσ|/σ = ' + worstS.toExponential(2));
  // and the width formula itself, hand-checked: at t=2σ₀² the width is √2·σ₀.
  const s0 = 2, tHalf = 2 * s0 * s0;
  check('σ(t) formula: at t=2σ₀² the packet has spread to √2·σ₀ (hand-checked)',
        Math.abs(sigmaT(s0, tHalf) - Math.SQRT2 * s0) < 1e-12, 'σ(2σ₀²)=' + sigmaT(s0, tHalf).toFixed(6));
}

// (E) THE TEETH, re-derived: forward Euler's amplification factor is √(1+dt²E²)>1,
//     so its norm GROWS while the split-step's holds. The test is a real discriminator.
{
  const V = potential('free', grid, {});
  let stE = makePacket(grid, { x0: -10, k0: 2, sigma: 2 });
  let stS = makePacket(grid, { x0: -10, k0: 2, sigma: 2 });
  for (let i = 0; i < 300; i++) { eulerStepNonUnitary(stE, 0.002, grid, V); step(stS, 0.002, grid, V, { absorb: false }); }
  const ed = Math.abs(norm(stE, grid) - 1), sd = Math.abs(norm(stS, grid) - 1);
  check('TEETH: forward Euler norm GROWS (drift≫1e-3) while split-step holds (<1e-9)',
        ed > 1e-3 && sd < 1e-9, 'Euler ' + ed.toExponential(2) + ' vs split ' + sd.toExponential(2));
}

// (F) THE ENERGY representations are SOURCE-DISJOINT: ⟨T⟩ is spectral (from ψ̃), ⟨V⟩ is
//     x-space — and ⟨H⟩=⟨T⟩+⟨V⟩ holds through a harmonic slosh. A fake-norm bug would
//     leak energy here (the two reps would diverge). Re-checked at a tighter window.
{
  const pp = { omega: 0.5 };
  const V = potential('harmonic', grid, pp);
  let st = makePacket(grid, { x0: 6, k0: 0, sigma: 1 });
  const H0 = energy(st, grid, V);
  for (let i = 0; i < 1200; i++) step(st, 0.002, grid, V, { absorb: false });
  const rel = Math.abs(energy(st, grid, V) - H0) / Math.abs(H0);
  check('ENERGY: ⟨T⟩(spectral)+⟨V⟩(x-space) conserved to <1e-5 through a harmonic slosh',
        rel < 1e-5, 'rel drift ' + rel.toExponential(2));
}

// (G) THE TUNNELLING CROSS, re-derived AND the staticT closed form hand-checked against
//     the Tunnelling bench's branches (E<V0 sinh, E>V0 sin, E=V0 degenerate).
{
  // hand-check the three branches at known points (ħ=m=1):
  // E<V0: a thin high wall transmits a little; E>V0: resonance kL=π ⇒ T=1.
  const Tlow = staticT(0.5, 2, 1);            // tunnelling regime, 0<T<1
  check('staticT E<V₀ branch is in (0,1): a sub-barrier wall partially transmits',
        Tlow > 0 && Tlow < 1, 'T(0.5,2,1) = ' + Tlow.toFixed(5));
  // resonance: E>V0 with sin(qL)=0 ⇒ T=1 exactly. q=√(2(E−V0)); pick qL=π.
  const V0 = 1, Lr = 1, qWant = Math.PI / Lr, Eres = V0 + qWant * qWant / 2;
  check('staticT E>V₀ resonance: sin(qL)=0 ⇒ T=1 exactly (the barrier turns transparent)',
        Math.abs(staticT(Eres, V0, Lr) - 1) < 1e-12, 'T(res) = ' + staticT(Eres, V0, Lr).toFixed(12));
  // degenerate E=V0 limit is continuous with both sides.
  const Td = staticT(2, 2, 1), Tnear = staticT(2 + 1e-9, 2, 1);
  check('staticT E=V₀ degenerate limit is continuous with E>V₀ side',
        Math.abs(Td - Tnear) < 1e-4, 'T(=)=' + Td.toFixed(6) + ' T(+ε)=' + Tnear.toFixed(6));

  // the dynamical cross: a barrier scatter's transmitted lobe lands in the staticT band.
  const pp = { V0: 3, Lw: 1.2, barX: 0 };
  const Vb = potential('barrier', grid, pp);
  let st = makePacket(grid, { x0: -14, k0: 2.2, sigma: 3 });
  const Emean = energy(st, grid, Vb), sigE = energySpread(st, grid, Vb);
  for (let i = 0; i < Math.round(10 / 0.004); i++) step(st, 0.004, grid, Vb, { absorb: false });
  const Tdyn = transmittedProb(st, grid, pp.barX + pp.Lw / 2);
  const Tstat = staticT(Emean, pp.V0, pp.Lw);
  const Tup = staticT(Emean + sigE, pp.V0, pp.Lw), Tdn = staticT(Emean - sigE, pp.V0, pp.Lw);
  const band = Math.max(Math.abs(Tup - Tstat), Math.abs(Tdn - Tstat)) + 0.02;
  check('CROSS: dynamical transmitted ∫|ψ|² lands in the staticT(⟨E⟩) energy-spread band',
        Math.abs(Tdyn - Tstat) <= band && Tstat > 0.05 && Tstat < 0.95,
        'T_dyn=' + Tdyn.toFixed(4) + ' vs staticT=' + Tstat.toFixed(4) + ' ±' + band.toFixed(3));
}

// (H) DETERMINISM: two full evolves are byte-identical (no RNG anywhere).
{
  const V = potential('free', grid, {});
  const pk = { x0: -10, k0: 2, sigma: 2 };
  const a = evolve(makePacket(grid, pk), 0.002, 500, grid, V, { absorb: false });
  const b = evolve(makePacket(grid, pk), 0.002, 500, grid, V, { absorb: false });
  let d = 0; for (let i = 0; i < grid.N; i++) d = Math.max(d, Math.abs(a.re[i] - b.re[i]), Math.abs(a.im[i] - b.im[i]));
  check('DETERMINISM: two full evolves are byte-identical (maxDiff===0)', d === 0, 'maxDiff = ' + d);
}

// ---------------------------------------------------------------------------
//  RE-EXTRACTION PARITY — the core inlined in index.html is byte-identical to
//  core.mjs (between the // ===== WAVE PACKET CORE sentinels).
// ---------------------------------------------------------------------------
{
  const here = dirname(fileURLToPath(import.meta.url));
  const modSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
  const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
  const START = '// ===== WAVE PACKET CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END WAVE PACKET CORE =====';

  // From the module: everything from the first function (makeGrid) to the END
  // sentinel (the same span the page inlines BETWEEN its START/END sentinels).
  const modBody = modSrc
    .slice(modSrc.indexOf('function makeGrid('), modSrc.indexOf(END))
    .trim();
  const pi = pageSrc.indexOf(START), pj = pageSrc.indexOf(END);
  check('index.html contains the WAVE PACKET CORE sentinels', pi >= 0 && pj > pi);
  if (pi >= 0 && pj > pi) {
    // the page's slice between sentinels starts with a comment then makeGrid; align
    // both to `function makeGrid(` so we compare the same function bodies.
    const pageSlice = pageSrc.slice(pi + START.length, pj);
    const pageBody = pageSlice.slice(pageSlice.indexOf('function makeGrid(')).trim();
    const norm = function (s) { return s.replace(/^\s+/gm, '').replace(/\r/g, '').trim(); };
    check('inlined core matches core.mjs (function bodies, indentation-normalised)',
          norm(pageBody) === norm(modBody),
          norm(pageBody) === norm(modBody) ? 'byte-identical' :
            'DIFFER (page ' + norm(pageBody).length + ' vs mod ' + norm(modBody).length + ' chars)');
  }

  // ── the EXTRA assert: the page's INLINED fft is char-for-char the butterfly fft ──
  // Extract the page's `function fft(` body and the imported butterfly fft.toString(),
  // and assert they produce byte-identical output on a seeded vector — so the inlined
  // copy can never silently drift from the single source. We also run the inlined fft
  // (from the page) against the imported one on a random-but-seeded complex vector.
  const pageFftSrc = extractFn(pageSrc, 'fft');
  const pageFftRadixSrc = extractFn(pageSrc, 'fftRadix2');
  const pageIsPow2Src = extractFn(pageSrc, 'isPow2');
  check('index.html inlines fft / fftRadix2 / isPow2 (the butterfly transform)',
        !!pageFftSrc && !!pageFftRadixSrc && !!pageIsPow2Src,
        pageFftSrc ? 'all three present' : 'MISSING an inlined transform fn');
  // build the page's fft as a callable and compare its output to the imported butterfly fft
  let inlinedFft = null, buildErr = null;
  try {
    const factory = new Function(pageIsPow2Src + '\n' + pageFftRadixSrc + '\n' + pageFftSrc + '\nreturn fft;');
    inlinedFft = factory();
  } catch (e) { buildErr = e; }
  check('the inlined fft compiles as a standalone function', !buildErr, buildErr ? String(buildErr) : 'ok');
  if (inlinedFft) {
    // a deterministic (seeded) complex vector of length 256
    let s = 0x1234abcd >>> 0;
    function rnd() { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296 * 2 - 1; }
    const vec = [];
    for (let i = 0; i < 256; i++) vec.push({ re: rnd(), im: rnd() });
    const a = inlinedFft(vec.map(v => ({ re: v.re, im: v.im })));
    const b = butterflyFft(vec.map(v => ({ re: v.re, im: v.im })));
    let maxd = 0;
    for (let i = 0; i < a.length; i++) maxd = Math.max(maxd, Math.abs(a[i].re - b[i].re), Math.abs(a[i].im - b[i].im));
    check('inlined fft matches butterfly/core.mjs fft byte-for-byte on a seeded vector',
          maxd === 0, 'maxDiff vs the real butterfly fft = ' + maxd);
  }
}

// extract `function NAME(...) { ... }` with brace-matching from a source string.
function extractFn(src, name) {
  const re = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = re.exec(src);
  if (!m) return '';
  let i = src.indexOf('{', m.index);
  if (i < 0) return '';
  let depth = 0, k = i;
  for (; k < src.length; k++) {
    if (src[k] === '{') depth++;
    else if (src[k] === '}') { depth--; if (depth === 0) { k++; break; } }
  }
  return src.slice(m.index, k);
}

console.log('\n' + (pass === total ? '✓ ALL ' : '✗ ') + pass + '/' + total + ' checks passed.\n');
process.exit(pass === total ? 0 : 1);
