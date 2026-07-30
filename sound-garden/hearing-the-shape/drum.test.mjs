#!/usr/bin/env node
/* ============================================================================
 *  HEARING THE SHAPE OF A DRUM — the Node twin.
 *      node hear-the-shape/drum.test.mjs          (fast: ~10 s)
 *      node hear-the-shape/drum.test.mjs --full   (adds the k=6 benchmark leg)
 *
 *  Nothing here trusts a number that is written down anywhere in the room.
 *  The shapes are re-enumerated, the pair is re-found, the solver is checked
 *  against two spectra known in closed form and against a published 12-digit
 *  benchmark it was never given, and the ONE claim — that the two drums have
 *  the same spectrum — is measured at four different mesh resolutions.
 *  ========================================================================= */
import {
  TWIN_A, TWIN_B, IMPOSTOR, LAMBDA1_REFERENCE,
  voice, strikeAmps, searchAll, weylCount, describe, nodalDomains, nodalLines,
  enumerate, fromCanonical, perimeter, area, corners, cornerAngles, solve,
} from './drum.mjs';
import { canonical, triVerts, boundaryEdges, normalise } from './polyabolo.mjs';
import { ModalBank } from '../../tools/modal/core.mjs';

const FULL = process.argv.includes('--full');
let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log('  ok   ' + name + (detail ? '   ' + detail : '')); }
  else { fail++; console.log('  FAIL ' + name + '   ' + detail); }
};
const P2 = Math.PI * Math.PI;
const A = fromCanonical(TWIN_A), B = fromCanonical(TWIN_B), I = fromCanonical(IMPOSTOR);

console.log('\nHearing the Shape of a Drum — the twin\n');

/* ════ 1 · THE SHAPES ══════════════════════════════════════════════════════
 *  Before believing anything about spectra, believe the enumeration.  The
 *  number of polyaboloes with n half-squares is a published sequence
 *  (OEIS A006074) and nothing in this repo was fitted to it. */
console.log('1 · the shapes  (a drum is a REGION, not a way of cutting one)');
{
  const EXPECT = [1, 3, 4, 14, 30, 107, 318];
  const got = [];
  for (let n = 1; n <= 7; n++) got.push(enumerate(n).length);
  ok('polyabolo counts reproduce OEIS A006074', got.join(',') === EXPECT.join(','),
    got.join(', ') + '  (expected ' + EXPECT.join(', ') + ')');

  /* the same region cut along the other diagonal must not be a second shape */
  const sqA = [[0, 0, 0], [0, 0, 2]], sqB = [[0, 0, 1], [0, 0, 3]];
  ok('a unit square is one drum, not two', canonical(sqA) === canonical(sqB),
    canonical(sqA) + ' == ' + canonical(sqB));
}

/* ════ 2 · THE SOLVER, against spectra known in closed form ════════════════ */
console.log('\n2 · the solver  (checked where the answer is known exactly)');
{
  const exact = [];
  for (let m = 1; m <= 8; m++) for (let n = 1; n <= 8; n++) exact.push(P2 * (m * m + n * n));
  exact.sort((a, b) => a - b);
  const errs = [];
  for (const k of [4, 5, 6]) {
    const v = solve([[0, 0, 0], [0, 0, 2]], { k, modes: 1 }).values[0];
    errs.push(Math.abs(v - exact[0]) / exact[0]);
  }
  ok('unit square lambda_1 -> 2 pi^2', errs[2] < 3e-4,
    errs.map((e) => e.toExponential(2)).join(' -> ') + '  (exact ' + exact[0].toFixed(6) + ')');
  ok('and the error falls like h^2 on a smooth domain',
    Math.abs(errs[0] / errs[1] - 4) < 0.35 && Math.abs(errs[1] / errs[2] - 4) < 0.35,
    'ratios ' + (errs[0] / errs[1]).toFixed(3) + ', ' + (errs[1] / errs[2]).toFixed(3));

  /* the half-square: lambda = pi^2 (m^2+n^2) with m > n >= 1 — the odd modes
   * of the square, and a completely different domain to get right */
  const exH = [];
  for (let m = 2; m <= 9; m++) for (let n = 1; n < m; n++) exH.push(P2 * (m * m + n * n));
  exH.sort((a, b) => a - b);
  const w5 = solve([[0, 0, 0]], { k: 5, modes: 5 }).values.map((v, i) => Math.abs(v - exH[i]) / exH[i]);
  const w6 = solve([[0, 0, 0]], { k: 6, modes: 5 }).values.map((v, i) => Math.abs(v - exH[i]) / exH[i]);
  ok('half-square: five modes vs pi^2(m^2+n^2), m>n', Math.max(...w6) < 5e-3,
    w6.map((e) => e.toExponential(1)).join(' '));
  const rat = w5.map((e, i) => e / w6[i]);
  ok('and h^2 there too, on all five', Math.min(...rat) > 3.6 && Math.max(...rat) < 4.4,
    'ratios ' + rat.map((r) => r.toFixed(2)).join(' '));
}

/* ════ 3 · THE SEARCH — find the pair, do not be told it ═══════════════════ */
console.log('\n3 · the search  (every shape, every pair, no shortcuts)');
{
  const t0 = Date.now();
  const r = searchAll({ n: 7, k: 2, modes: 8, tol: 1e-9 });
  const ms = Date.now() - t0;
  ok('318 shapes, 50403 pairs compared', r.list.length === 318 && r.comparisons === 50403,
    r.comparisons + ' pairs in ' + ms + ' ms');
  ok('exactly ONE isospectral pair exists', r.pairs.length === 1,
    r.pairs.length + ' found');
  const found = r.pairs[0];
  const isTwins = (found.a === TWIN_A && found.b === TWIN_B) || (found.a === TWIN_B && found.b === TWIN_A);
  ok('and it is the pair the room is built around', isTwins, found.a + '  ||  ' + found.b);
  ok('the pair agrees 12 orders of magnitude better than the runner-up',
    found.d < 1e-12 && r.runnerUp > 1e-3,
    'pair ' + found.d.toExponential(2) + '  vs runner-up ' + r.runnerUp.toExponential(3));
}

/* ════ 4 · THE ONE CLAIM, at four resolutions ══════════════════════════════ */
console.log('\n4 · the claim  (the same spectrum, whatever mesh you ask on)');
{
  const rows = [];
  let worst = 0;
  for (const k of [2, 3, 4, 5]) {
    const va = solve(A, { k, modes: 12 }).values;
    const vb = solve(B, { k, modes: 12 }).values;
    let d = 0;
    for (let i = 0; i < 12; i++) d = Math.max(d, Math.abs(va[i] - vb[i]) / va[i]);
    worst = Math.max(worst, d);
    rows.push('k=' + k + ':' + d.toExponential(1));
  }
  ok('12 eigenvalues equal to machine precision at every mesh', worst < 1e-12, rows.join('  '));

  /* and it is not because they are the same shape */
  const dist = (s) => {
    const pts = cornerAngles(s).filter((c) => c.deg !== 180).map((c) => c.at);
    const out = [];
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      out.push(Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]).toFixed(9));
    }
    return out.sort().join(' ');
  };
  ok('the two drums are NOT congruent', canonical(A) !== canonical(B) && dist(A) !== dist(B),
    'their 8 corners have different distance multisets, so no isometry carries one onto the other');
  ok('yet they share an area and a perimeter',
    area(A) === area(B) && Math.abs(perimeter(A) - perimeter(B)) < 1e-12,
    'area ' + area(A) + ', perimeter ' + perimeter(A).toFixed(6) + ' = 6 + 3 sqrt2');
  ok('and the same corner angles, reentrant ones included',
    JSON.stringify(cornerAngles(A).map((c) => c.deg)) === JSON.stringify(cornerAngles(B).map((c) => c.deg)),
    cornerAngles(A).map((c) => c.deg).join(' '));
}

/* ════ 5 · AGAINST A PUBLISHED NUMBER THE CODE WAS NEVER GIVEN ═════════════ */
console.log('\n5 · the benchmark  (Driscoll 1997, twelve digits, independent)');
{
  const ks = FULL ? [4, 5, 6, 7] : [4, 5, 6];
  const errs = [];
  for (const k of ks) {
    const v = solve(A, { k, modes: 1, krylov: 22 }).values[0];
    errs.push(Math.abs(v - LAMBDA1_REFERENCE) / LAMBDA1_REFERENCE);
  }
  ok('lambda_1 closes on 4 x 2.537943999798', errs[errs.length - 1] < 1e-3,
    errs.map((e) => e.toExponential(3)).join(' -> '));
  /* two 270-degree corners put an r^(2/3) singularity in every eigenfunction,
   * which caps the convergence at h^(4/3): a ratio of 2^(4/3) = 2.52, not 4. */
  const ratios = [];
  for (let i = 1; i < errs.length; i++) ratios.push(errs[i - 1] / errs[i]);
  const last = ratios[ratios.length - 1];
  ok('at the h^(4/3) rate two reentrant corners dictate', last > 1.9 && last < 2.9,
    'ratios ' + ratios.map((r) => r.toFixed(3)).join(', ') + '  (h^2 would be 4.0, h^(4/3) is 2.52)');
}

/* ════ 6 · WEYL CANNOT SEE IT EITHER ═══════════════════════════════════════ */
console.log('\n6 · Weyl  (even the asymptotic note-count is blind here)');
{
  const va = solve(A, { k: 5, modes: 40 }).values;
  const L = va[39];
  ok('the two-term Weyl counts are identical', Math.abs(weylCount(L, A) - weylCount(L, B)) < 1e-12,
    'N(' + L.toFixed(2) + ') ~ ' + weylCount(L, A).toFixed(3) + ' for both');
  ok('and it does predict the real count', Math.abs(weylCount(L, A) - 40) < 4,
    'Weyl says ' + weylCount(L, A).toFixed(2) + ', the solver found 40 below that pitch');
}

/* ════ 7 · WHAT DOES SEPARATE THEM ═════════════════════════════════════════ */
console.log('\n7 · what a spectrum leaves out');
{
  const va = voice(A, { k: 4, modes: 12 }), vb = voice(B, { k: 4, modes: 12 });
  const na = va.sol.vectors.map((u) => nodalDomains(va.sol.mesh, u));
  const nb = vb.sol.vectors.map((u) => nodalDomains(vb.sol.mesh, u));
  ok('both first modes are one piece (they must be)', na[0] === 1 && nb[0] === 1);
  ok('nodal-domain counts DO tell the drums apart', na.join(',') !== nb.join(','),
    'A ' + na.join(' ') + '\n                                             B ' + nb.join(' '));
  const first = na.findIndex((v, i) => v !== nb[i]);
  ok('they part company at mode ' + (first + 1), first >= 0 && first < 6,
    'the notes are the same for ever; the pictures differ from the ' + (first + 1) + 'th');
  ok('nodal lines exist and are drawable', nodalLines(va.sol.mesh, va.sol.vectors[3]).length > 20,
    nodalLines(va.sol.mesh, va.sol.vectors[3]).length / 2 + ' segments in mode 4 of A');
}

/* ════ 8 · THE IMPOSTOR ════════════════════════════════════════════════════ */
console.log('\n8 · the impostor  (the best liar among the other 316)');
{
  const va = voice(A, { k: 4, modes: 14 });
  const vi = voice(I, { k: 4, modes: 14, reference: va.lambda[0], f1: 110 });
  ok('same area, same perimeter, same eight corners',
    area(I) === area(A) && Math.abs(perimeter(I) - perimeter(A)) < 1e-12 && corners(I) === corners(A),
    'area 3.5, perimeter ' + perimeter(I).toFixed(6) + ', ' + corners(I) + ' corners');
  const cents = va.freqs.map((f, i) => 1200 * Math.log2(vi.freqs[i] / f));
  const early = Math.max(...cents.slice(0, 6).map(Math.abs));
  const late = Math.max(...cents.map(Math.abs));
  ok('its first six notes are inside 1.5 cents of the twins', early < 1.5,
    cents.slice(0, 6).map((c) => c.toFixed(2)).join(' ') + ' cents');
  ok('and one of its later notes is out by a sixth of a semitone', late > 25,
    'worst ' + late.toFixed(1) + ' cents at mode ' + (cents.findIndex((c) => Math.abs(c) === late) + 1));
  const beats = va.freqs.map((f, i) => Math.abs(vi.freqs[i] - f));
  ok('so struck together the twins do not beat and the impostor does',
    Math.max(...beats.slice(0, 3)) < 0.05 && Math.max(...beats) > 2,
    'slowest beat ' + Math.min(...beats).toExponential(1) + ' Hz, fastest ' + Math.max(...beats).toFixed(2) + ' Hz');
}

/* ════ 9 · THE STICK ═══════════════════════════════════════════════════════ */
console.log('\n9 · the stick');
{
  const va = voice(A, { k: 4, modes: 12 });
  /* walk the mode-2 nodal line and check mode 2 does not wake there */
  /* Take the nodal line off the COARSE mesh and ask a mesh four times finer
   * what mode 2 is worth there.  On the same mesh the answer would be exactly
   * zero by construction — the nodal line IS the zero set of that interpolant —
   * which would prove nothing at all. */
  const fine = voice(A, { k: 6, modes: 3 });
  const peak = Math.max(...fine.sol.vectors[1].map(Math.abs));
  const seg = nodalLines(va.sol.mesh, va.sol.vectors[1]);
  let worst = 0;
  for (let i = 0; i < seg.length; i += 8) worst = Math.max(worst, Math.abs(strikeAmps(fine, seg[i][0], seg[i][1])[1]));
  ok('a blow on a nodal line does not wake that mode', worst < peak * 0.02,
    'worst |amp| along the whole line ' + worst.toExponential(2) + ', mode peak ' + peak.toFixed(3));
  let best = 0, where = null;
  for (const nd of va.sol.mesh.nodes) {
    const a = Math.abs(strikeAmps(fine, nd[0], nd[1])[1]);
    if (a > best) { best = a; where = nd; }
  }
  ok('and a blow at its antinode wakes it fully', best > peak * 0.9,
    'best |amp| ' + best.toFixed(3) + ' at (' + where[0].toFixed(3) + ', ' + where[1].toFixed(3) + ')');
}

/* ════ 10 · THE BANK AGREES WITH THE CLOSED FORM ═══════════════════════════
 *  The page renders SOUND with tools/modal's resonator bank and renders the
 *  PICTURE with the closed-form damped sinusoid, on the main thread.  Those had
 *  better be the same physics, or the drum you watch is not the drum you hear. */
console.log('\n10 · the picture and the sound are one object');
{
  const FS = 48000, F = [110, 175.8, 240.9], T60 = [2.4, 2.1, 1.9], AM = [1, -0.6, 0.35];
  const bank = new ModalBank(FS, 8);
  for (let i = 0; i < 3; i++) bank.setMode(i, F[i], T60[i], 1);
  bank.setCount(3);
  const n = Math.round(FS * 0.5);
  const out = new Float64Array(n);
  bank.strike(AM, 1 / FS);
  for (let s = 0; s < n; s += 128) bank.render(out.subarray(s, Math.min(n, s + 128)), Math.min(128, n - s));
  let worst = 0, mag = 0;
  for (let s = 1; s < n; s++) {
    let closed = 0;
    for (let i = 0; i < 3; i++) {
      const tau = T60[i] / Math.log(1000);
      closed += AM[i] * Math.exp(-s / (FS * tau)) * Math.sin(2 * Math.PI * F[i] * (s + 1) / FS);
    }
    worst = Math.max(worst, Math.abs(closed - out[s]));
    mag = Math.max(mag, Math.abs(closed));
  }
  ok('the resonator bank IS sum a_n e^(-t/tau) sin(omega t)', worst / mag < 1e-4,
    'max difference ' + (worst / mag).toExponential(2) + ' of peak, over half a second');
}

console.log('\n' + (fail ? 'FAILED ' + fail + ' of ' + (pass + fail) : 'all ' + pass + ' green') + '\n');
process.exit(fail ? 1 : 0);
