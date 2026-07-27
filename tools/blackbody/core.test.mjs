/* ══════════════════════════════════════════════════════════════════════════════
   BLACKBODY — the Node twin.

       node tools/blackbody/core.test.mjs

   Nothing here is asserted from a table of colours.  Wien's displacement law
   and the Stefan–Boltzmann law are MEASURED numerically out of the very
   `planck` this file's colours are integrated from — if the spectrum were
   wrong, both would miss.  The chromaticities are then checked against the
   published Planckian locus, and the gamut repair is checked to hold
   luminance exactly.
   ══════════════════════════════════════════════════════════════════════════════ */
import {
  BB_SIGMA, BB_WIEN,
  planck, planckNm, bbWienPeakNm, bbStefanBoltzmann,
  bbSpectrumToXYZ, bbXYZ, bbChromaticity, bbVisibleLuminance,
  bbLuminance, bbEncode, bbDecode,
  bbLinearSRGBRaw, bbLinearSRGB, bbGamutDistance,
  bbSwatch255, bbBandLinearSRGB, bbLUT,
} from './core.mjs';
import { cie1931 } from '../spectrum/wavelength.mjs';

let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log('  \x1b[32mok\x1b[0m   ' + name + (detail ? '  \x1b[2m' + detail + '\x1b[0m' : '')); }
  else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + name + '  ' + detail); }
};
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const H = (s) => console.log('\n\x1b[1m' + s + '\x1b[0m');

/* ── A · the spectrum is really Planck's ──────────────────────────────────────
   Two laws that follow from Planck's and from nothing else, both dug back out
   of the function by brute numerics. ── */
H('A · Wien and Stefan–Boltzmann, measured out of planck() itself');
{
  /* Wien: find the wavelength of peak spectral radiance by golden-section
     search over a decade around the expected peak — no closed form used. */
  function peakNm(T){
    let lo = bbWienPeakNm(T) * 0.2, hi = bbWienPeakNm(T) * 5;
    const gr = (Math.sqrt(5) - 1) / 2;
    let c = hi - gr * (hi - lo), d = lo + gr * (hi - lo);
    for (let i = 0; i < 220; i++){
      if (planckNm(c, T) > planckNm(d, T)) { hi = d; } else { lo = c; }
      c = hi - gr * (hi - lo); d = lo + gr * (hi - lo);
    }
    return (lo + hi) / 2;
  }
  for (const T of [800, 1500, 2700, 5772, 12000]){
    const lp = peakNm(T) * 1e-9;
    ok(`Wien at ${T} K: λ_peak·T = ${(lp * T).toExponential(6)} m·K`,
      near(lp * T, BB_WIEN, BB_WIEN * 2e-4), 'want ' + BB_WIEN.toExponential(6));
  }

  /* Stefan–Boltzmann: integrate π·B over 10 nm … 2 mm on a log grid.  The
     radiance→exitance factor is exactly π for a Lambertian emitter. */
  function exitance(T, n = 40000){
    const a = Math.log(1e-8), b = Math.log(2e-3);
    let s = 0;
    for (let i = 0; i < n; i++){
      const u0 = a + (b - a) * i / n, u1 = a + (b - a) * (i + 1) / n;
      const l0 = Math.exp(u0), l1 = Math.exp(u1);
      s += 0.5 * (planck(l0, T) + planck(l1, T)) * (l1 - l0);
    }
    return Math.PI * s;
  }
  for (const T of [300, 1200, 3000, 5772]){
    const m = exitance(T), want = bbStefanBoltzmann(T);
    ok(`Stefan–Boltzmann at ${T} K: ∫πB dλ = ${m.toExponential(6)} W/m²`,
      Math.abs(m - want) / want < 2e-4, 'want σT⁴ = ' + want.toExponential(6));
  }
  ok('σ as derived from the constants is the CODATA value',
    near(BB_SIGMA, 5.670374419e-8, 1e-16));
  const r = bbStefanBoltzmann(3000) / bbStefanBoltzmann(1500);
  ok('doubling T is sixteen times the power', near(r, 16, 1e-9), r.toFixed(9));
}

/* ── B · the observer, unforked ──────────────────────────────────────────── */
H('B · the CIE 1931 observer (tools/spectrum/wavelength.mjs — not forked)');
{
  const [X, Y, Z] = bbSpectrumToXYZ(() => 1);          // equal-energy illuminant E
  const x = X / (X + Y + Z), y = Y / (X + Y + Z);
  ok('a flat spectrum lands on illuminant E (⅓, ⅓)',
    near(x, 1 / 3, 0.006) && near(y, 1 / 3, 0.006), `x=${x.toFixed(4)} y=${y.toFixed(4)}`);
  ok('ȳ peaks at 555 nm (the eye’s luminosity peak)',
    cie1931(555)[1] > cie1931(540)[1] && cie1931(555)[1] > cie1931(570)[1]);
  ok('the observer is blind at 360 and 830 nm',
    cie1931(360)[1] < 1e-3 && cie1931(830)[1] < 1e-3);
}

/* ── C · the Planckian locus ──────────────────────────────────────────────────
   Published (x, y) of the Planckian locus, CIE 1931 2°.  The tolerance is the
   analytic CMF fit's own accuracy (~1%), not a fudge: an actual error in the
   spectrum or the integration would miss by far more than this. ── */
H('C · chromaticity traces the published Planckian locus');
{
  const LOCUS = [
    [1000, 0.6528, 0.3444], [1500, 0.5857, 0.3931], [2000, 0.5267, 0.4133],
    [2500, 0.4770, 0.4137], [3000, 0.4369, 0.4041], [4000, 0.3805, 0.3768],
    [5000, 0.3451, 0.3516], [6000, 0.3221, 0.3318], [6500, 0.3135, 0.3237],
    [10000, 0.2807, 0.2884],
  ];
  let worst = 0, worstT = 0, worstWarm = 0;
  for (const [T, px, py] of LOCUS){
    const [x, y] = bbChromaticity(T);
    const d = Math.hypot(x - px, y - py);
    if (d > worst) { worst = d; worstT = T; }
    if (T >= 1500 && d > worstWarm) worstWarm = d;
    ok(`${String(T).padStart(5)} K → (${x.toFixed(4)}, ${y.toFixed(4)})`,
      d < 0.02, `published (${px}, ${py}), off by ${d.toFixed(4)}`);
  }
  ok('worst deviation over the whole locus is inside the CMF fit’s accuracy',
    worst < 0.02, `${worst.toFixed(4)} at ${worstT} K`);
  ok('and over the fire’s own range (≥1500 K) it is three times tighter than that',
    worstWarm < 0.007, worstWarm.toFixed(4));

  let prev = 1;
  let mono = true;
  for (let T = 1000; T <= 12000; T += 250){ const x = bbChromaticity(T)[0]; if (x >= prev) mono = false; prev = x; }
  ok('x falls monotonically all the way up the locus (hot is always bluer)', mono);
}

/* ── D · the colour, and what a monitor cannot do ─────────────────────────── */
H('D · linear sRGB, luminance-preserving gamut repair');
{
  for (const T of [900, 1200, 1800, 2400, 3200, 5000, 6504, 9000]){
    const c = bbLinearSRGB(T);
    ok(`${String(T).padStart(4)} K keeps luminance exactly 1`,
      near(bbLuminance(c[0], c[1], c[2]), 1, 1e-6),
      `rgb ${c.map((v) => v.toFixed(3)).join(' ')} · gamut step ${bbGamutDistance(T).toFixed(3)}`);
    ok(`${String(T).padStart(4)} K is inside sRGB after repair`,
      c[0] >= -1e-12 && c[1] >= -1e-12 && c[2] >= -1e-12);
  }
  ok('a cool fire is out of gamut and says so', bbGamutDistance(1200) > 0.02,
    bbGamutDistance(1200).toFixed(4));
  ok('daylight is inside the triangle and needs no repair', bbGamutDistance(6504) === 0);
  ok('the repair shrinks monotonically as the colour cools toward white',
    bbGamutDistance(1000) > bbGamutDistance(1600) && bbGamutDistance(1600) > bbGamutDistance(2400));

  const hot = bbLinearSRGB(1300), warm = bbLinearSRGB(2200), day = bbLinearSRGB(6504), blue = bbLinearSRGB(12000);
  ok('1300 K is red-dominant', hot[0] > hot[1] && hot[1] > hot[2]);
  ok('2200 K is still red > green > blue but closer', warm[0] > warm[1] && warm[1] > warm[2] && warm[0] / warm[2] < hot[0] / hot[2]);
  ok('6504 K is very nearly the white point', Math.max(...day) / Math.min(...day) < 1.06,
    day.map((v) => v.toFixed(3)).join(' '));
  ok('12000 K has more blue than red', blue[2] > blue[0]);
  ok('the sRGB transfer round-trips', near(bbDecode(bbEncode(0.37)), 0.37, 1e-12));
  const sw = bbSwatch255(1800);
  ok('a swatch is a byte triple with the brightest channel at 255',
    Math.max(...sw) === 255 && sw.every((v) => v >= 0 && v <= 255), sw.join(','));
}

/* ── E · the narrow bands (the blue root of a flame is not a temperature) ─── */
H('E · chemiluminescence bands through the same observer');
{
  const ch = bbBandLinearSRGB(431.4, 8);     // CH, the blue base
  const c2 = bbBandLinearSRGB(516.5, 8);     // C₂ Swan, the green
  const na = bbBandLinearSRGB(589.3, 2);     // sodium, the orange of a salted flame
  ok('CH at 431 nm is blue', ch[2] > ch[0] && ch[2] > ch[1], ch.map((v) => v.toFixed(2)).join(' '));
  ok('C₂ at 516 nm is green', c2[1] > c2[0] && c2[1] > c2[2], c2.map((v) => v.toFixed(2)).join(' '));
  ok('Na at 589 nm is orange (red > green > blue)', na[0] > na[1] && na[1] > na[2],
    na.map((v) => v.toFixed(2)).join(' '));
  for (const c of [ch, c2, na]) ok('band colour holds luminance 1 and is in gamut',
    near(bbLuminance(c[0], c[1], c[2]), 1, 1e-6) && c.every((v) => v >= -1e-9));
}

/* ── F · the ramp the GPU actually samples ────────────────────────────────── */
H('F · the LUT is the same numbers, at texel centres');
{
  const N = 256, T0 = 500, T1 = 3000, TR = 1800;
  const lut = bbLUT(N, T0, T1, TR);
  ok('LUT is n×4 floats', lut.length === N * 4);
  const F32 = 2e-7;                       // a Float32Array cannot hold more than this
  let worst = 0;
  for (const i of [0, 1, 37, 128, 200, 255]){
    const T = T0 + (i + 0.5) * (T1 - T0) / N;
    const c = bbLinearSRGB(T);
    let d = 0;
    for (let k = 0; k < 3; k++) d = Math.max(d, Math.abs(lut[i * 4 + k] - c[k]) / Math.max(1, Math.abs(c[k])));
    worst = Math.max(worst, d);
    ok(`LUT[${i}] is bbLinearSRGB(${T.toFixed(2)} K) to float32`, d < F32, 'rel Δ ' + d.toExponential(2));
  }
  ok('no entry drifts from the function beyond float32', worst < F32, 'max rel Δ = ' + worst.toExponential(2));

  /* alpha is log10 of the visible-band luminance relative to the reference */
  const iMid = 128, TM = T0 + (iMid + 0.5) * (T1 - T0) / N;
  ok('alpha is log₁₀(visible luminance / reference)',
    near(lut[iMid * 4 + 3], Math.log10(bbVisibleLuminance(TM) / bbVisibleLuminance(TR)), 1e-6),
    lut[iMid * 4 + 3].toFixed(5));
  ok('the reference temperature reads 0 there', near(bbLUT(2, TR - 0.002, TR + 0.002, TR)[3], 0, 1e-4));
  ok('a fire’s core out-glows its dying edge by a factor of hundreds',
    bbVisibleLuminance(1600) / bbVisibleLuminance(900) > 200,
    (bbVisibleLuminance(1600) / bbVisibleLuminance(900)).toFixed(0) + '×');

  /* linear interpolation between neighbouring texels — what the sampler does —
     must not stray from the true colour, or the picture lies between samples */
  let worstHue = 0, worstLum = 0;
  for (let i = 0; i < N - 1; i++){
    const Ta = T0 + (i + 0.5) * (T1 - T0) / N, Tb = T0 + (i + 1.5) * (T1 - T0) / N;
    const mid = bbLinearSRGB((Ta + Tb) / 2);
    const mx = Math.max(mid[0], mid[1], mid[2]);
    for (let k = 0; k < 3; k++){
      const lerp = 0.5 * (lut[i * 4 + k] + lut[(i + 1) * 4 + k]);
      worstHue = Math.max(worstHue, Math.abs(lerp - mid[k]) / mx);
    }
    const lerpA = 0.5 * (lut[i * 4 + 3] + lut[(i + 1) * 4 + 3]);
    const midA = Math.log10(bbVisibleLuminance((Ta + Tb) / 2) / bbVisibleLuminance(TR));
    worstLum = Math.max(worstLum, Math.abs(lerpA - midA));
  }
  ok('bilinear sampling between texels holds hue to 0.1 %',
    worstHue < 1e-3, 'max rel Δ = ' + worstHue.toExponential(2));
  ok('…and brightness to half a percent',
    worstLum < 1.8e-3, 'max Δlog₁₀ = ' + worstLum.toExponential(2) + ' (' + ((Math.pow(10, worstLum) - 1) * 100).toFixed(2) + '%)');
}

console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
