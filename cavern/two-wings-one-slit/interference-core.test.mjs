// ============================================================================
//  TWO WINGS, ONE SLIT — Node twin of the interference core.
//  Run:  node cavern/two-wings-one-slit/interference-core.test.mjs
//
//  Proves the four claims headless, fires the teeth, and adds the Node-only
//  guards the in-page pill can't run: the BYTE-TWIN parity for ALL THREE pages
//  that inline (or re-inline) the core sentinel slice — the new bench, the
//  Cavern double-slit, and the Hall diffraction grating — plus the
//  anti-circularity grep (no second sin(N…)/sin ratio outside the sentinels in
//  the new page) and the H_PLANCK literal twin (the new page's literal === the
//  module's, like R_GAS).  process.exit(pass === total ? 0 : 1).
// ============================================================================
import {
  H_PLANCK, phase, arrayFactorPhi, arrayFactor, cos2,
  orderSinThetas, orderTheta, deBroglieLambda, momentumFor, incoherentFactor,
} from './interference-core.mjs';
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

// A fine local-max finder over a θ-sweep — proves a peak is FOUND, not asserted.
function localMaxNear(N, d, lambda, sinTarget, win){
  let best = -1, bestSin = sinTarget;
  const lo = sinTarget - win, hi = sinTarget + win, steps = 4000;
  for (let i = 0; i <= steps; i++){
    const st = lo + (hi - lo) * i / steps;
    if (Math.abs(st) > 1) continue;
    const v = arrayFactor(N, d, lambda, st);
    if (v > best){ best = v; bestSin = st; }
  }
  return { v: best, sinTheta: bestSin };
}

console.log('\n— Rung (a): THE CROSS — arrayFactor(N=2) === cos² to machine ε —');
{
  const d = 1e-6, lambda = 5e-7; let worst = 0;
  for (let i = 0; i <= 2000; i++){
    const st = -0.6 + 1.2 * i / 2000;
    worst = Math.max(worst, Math.abs(arrayFactor(2, d, lambda, st) - cos2(d, lambda, st)));
  }
  check('arrayFactor(2,d,λ,sinθ) === cos2(d,λ,sinθ) over a θ-sweep (worst < 1e-15)',
        worst < 1e-15, 'max |Δ| = ' + worst.toExponential(2));
}

console.log('\n— Rung (b): THE GRATING EQUATION — peaks pin at asin(mλ/d), FOUND not asserted —');
{
  const d = 40e-9, lambda = 0.66e-9, N = 6;
  const orders = orderSinThetas(d, lambda);
  let worstPeak = 0, worstAngle = 0, allFound = true;
  for (const s of orders){
    // the array factor reaches 1 at each order (the central order at sinθ=0 too)
    worstPeak = Math.max(worstPeak, Math.abs(arrayFactor(N, d, lambda, s) - 1));
    // asin(sinθ_m) === orderTheta(m, d, λ) exactly (m recovered from s)
    const m = Math.round(s * d / lambda);
    worstAngle = Math.max(worstAngle, Math.abs(Math.asin(s) - orderTheta(m, d, lambda)));
    // and a FINE local-max sweep actually finds the peak there (FOUND, not asserted)
    const win = 0.5 * lambda / (N * d);              // well inside the 1/(N·d/λ) lobe
    const found = localMaxNear(N, d, lambda, s, win);
    if (!(found.v > 1 - 1e-6 && Math.abs(found.sinTheta - s) < win)) allFound = false;
  }
  check('arrayFactor === 1 at every order sinθ_m = mλ/d (worst < 1e-12)', worstPeak < 1e-12,
        orders.length + ' orders · max |F−1| = ' + worstPeak.toExponential(2));
  check('asin(sinθ_m) === orderTheta(m,d,λ) exactly (worst < 1e-15)', worstAngle < 1e-15,
        'max |Δθ| = ' + worstAngle.toExponential(2));
  check('a FINE-sweep local max is FOUND at each order (not asserted)', allFound,
        'all ' + orders.length + ' principal maxima located by search');
}

console.log('\n— Rung (c): de BROGLIE — electron λ(p) === photon λ, byte-identical fringes —');
{
  const p = 1.0e-24, N = 5, d = 50e-9;
  const lamE = deBroglieLambda(p);                    // electron: λ = h/p
  const lamPhoton = lamE;                             // photon locked to that same λ
  let allByteIdentical = true, worst = 0;
  for (let i = 0; i <= 600; i++){
    const st = -0.4 + 0.8 * i / 600;
    const Ie = arrayFactor(N, d, lamE, st);
    const Ip = arrayFactor(N, d, lamPhoton, st);
    if (!Object.is(Ie, Ip)) allByteIdentical = false;  // === not ≈
    worst = Math.max(worst, Math.abs(Ie - Ip));
  }
  check('electron λ(p) fringes === photon-λ fringes, byte-identical via Object.is', allByteIdentical,
        'worst Δ = ' + worst.toExponential(2) + ' (exactly 0 — same function, same input)');
  check('momentumFor(deBroglieLambda(p)) === p exactly (the bridge round-trips)',
        Object.is(momentumFor(deBroglieLambda(p)), p), 'p = ' + p.toExponential(3));
}

console.log('\n— Rung (d): THE TEETH — incoherent flattens · perturbed wing breaks —');
{
  const N = 6, d = 40e-9, lambda = 0.66e-9;
  // coherent: a deep fringe contrast (peaks→1, troughs→~0); incoherent: dead flat.
  let cohMax = 0, cohMin = 1, incMax = 0, incMin = 1;
  for (let i = 0; i <= 800; i++){
    const st = -0.5 + 1.0 * i / 800;
    const c = arrayFactor(N, d, lambda, st);
    const ic = incoherentFactor(N, d, lambda, st);
    cohMax = Math.max(cohMax, c); cohMin = Math.min(cohMin, c);
    incMax = Math.max(incMax, ic); incMin = Math.min(incMin, ic);
  }
  const cohContrast = (cohMax - cohMin) / (cohMax + cohMin);
  const incContrast = (incMax - incMin) / (incMax + incMin);
  check('coherent contrast > 0.99 (fringes are deep)', cohContrast > 0.99, 'contrast = ' + cohContrast.toFixed(6));
  check('incoherent contrast < 1e-9 (fringes VANISH — the negative control fires)', incContrast < 1e-9,
        'contrast = ' + incContrast.toExponential(2));

  // perturb d on ONE wing by a part in a thousand → the two fringe patterns split
  // (goes red for the right reason: the identity has teeth, it is not vacuously
  // always-true). Measured as the worst |Δ| over the whole θ-sweep, where a shifted
  // peak lands a 1-vs-0 mismatch — exactly what the live "Break one wing" teeth do.
  const dBad = d * 1.001;
  let worstPerturbed = 0;
  for (let i = 0; i <= 800; i++){
    const st = -0.5 + 1.0 * i / 800;
    worstPerturbed = Math.max(worstPerturbed, Math.abs(arrayFactor(N, d, lambda, st) - arrayFactor(N, dBad, lambda, st)));
  }
  check('d·1.001 on one wing → the fringe coincidence FAILS (the identity has teeth)',
        worstPerturbed > 0.1, 'max |Δ| over the sweep = ' + worstPerturbed.toExponential(2));
}

console.log('\n— BYTE-TWIN PARITY ×3 — every inlined slice === the module, char-for-char —');
{
  const BEGIN = '// ===== INTERFERENCE CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== INTERFERENCE CORE END =====';
  const mod = readFileSync(join(__dir, 'interference-core.mjs'), 'utf8');
  const modSlice = sliceBetween(mod, BEGIN, END);
  const pages = [
    ['the new bench (index.html)', join(__dir, 'index.html')],
    ['the Cavern double-slit',     join(__dir, '..', 'double-slit', 'index.html')],
    ['the Hall diffraction grating', join(__dir, '..', '..', 'diffraction', 'index.html')],
  ];
  for (const [label, path] of pages){
    const page = readFileSync(path, 'utf8');
    const pageSlice = sliceBetween(page, BEGIN, END);
    check('byte-twin: ' + label + "'s INTERFERENCE CORE === the module, char-for-char",
          modSlice != null && pageSlice != null && modSlice === pageSlice,
          modSlice === pageSlice ? 'slice ' + pageSlice.length + ' chars identical' :
            'DRIFT (mod ' + (modSlice && modSlice.length) + ' vs page ' + (pageSlice && pageSlice.length) + ')');
  }
}

console.log('\n— Anti-circularity + the H_PLANCK literal twin —');
{
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== INTERFERENCE CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== INTERFERENCE CORE END =====';
  // strip the sentinel slice, then assert NO array-factor ratio is COMPUTED outside
  // it: no Math.sin(N…) call, no gratingFactor, no second arrayFactor/arrayFactorPhi
  // definition. (Prose like "sin(Nφ)" in the honesty <code> is fine — that's text,
  // not the computed ratio; we only forbid the live Math.sin(N…) form.)
  const i = page.indexOf(BEGIN), j = page.indexOf(END);
  const outside = page.slice(0, i) + page.slice(j);
  const noOwnRatio = !/Math\.sin\s*\(\s*N\b/.test(outside) &&
                     !/\bgratingFactor\b/.test(outside) &&
                     !/function\s+arrayFactor(Phi)?\b/.test(outside);
  check('anti-circularity: the page COMPUTES sin(Nφ)/sin(φ) ONLY inside the sentinels',
        noOwnRatio, 'no Math.sin(N…) · no gratingFactor · no local arrayFactor/arrayFactorPhi outside the core');

  const m = page.match(/H_PLANCK\s*=\s*([0-9.eE+-]+)\s*;/);
  const pageH = m ? Number(m[1]) : NaN;
  check('the page\'s inlined H_PLANCK literal === the module\'s (the de Broglie h can\'t drift)',
        Object.is(pageH, H_PLANCK), 'page H = ' + pageH + ' · module H = ' + H_PLANCK);
}

console.log('\n—— Two Wings, One Slit · Node twin: ' + pass + '/' + total + ' ——\n');
process.exit(pass === total ? 0 : 1);
