// ============================================================================
//  Node-side falsifiability harness for THE LEVEL RIDE — shapes of constant width.
//  Runs the shared in-page self-test runSelfTest() (the SAME claims the page pill
//  runs), PLUS deeper Node-only assertions (the support height ≡ w to machine-ε over
//  a dense preset×7200-direction grid; plankHeight ≡ w over a rolling-α sweep; Barbier
//  perimeter ≡ π·w exact; the ellipse amplitude matching the analytic 2(a−b) across a
//  ladder of (a,b); Δwidth monotone in the break δ; the circle degeneracy), THEN
//  re-extracts the inlined core from index.html between the sentinels and proves it is
//  byte-for-byte the SAME core (parity — the estate standard, mirroring The Top's
//  core.test.mjs).
//  Run:  node core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  THRESH, W0, PRESET_NS,
  reuleaux, ellipse, dot2, uHat, reuleauxVerts, reuleauxArcs, angleInFan,
  support, supportHeight, widthRange, isConstantWidth, plankHeight, perimeter,
  pose, ellipseAmplitude, brokenReuleaux, runSelfTest,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));

let pass = 0, total = 0;
const ok = (name, cond, detail = '') => {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (detail ? '  ·  ' + detail : '')); }
  else { console.log('  ✗ ' + name + (detail ? '  ·  ' + detail : '')); }
};

console.log('THE LEVEL RIDE — core.test.mjs\n');

// ── 1. THE SHARED IN-PAGE SELF-TEST (the same claims the pill runs) ────────────
console.log('— shared runSelfTest() (the SAME claims the in-page chip runs) —');
{
  const st = runSelfTest();
  for (const c of st.checks) ok('[self-test] ' + c.name, c.ok);
  ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);
}

// ── 2. EXACT CONSTANT WIDTH over a DENSE preset × 7200-direction grid, to <1e-12. ─
console.log('\n— EXACT CONSTANT WIDTH: supportHeight(θ) ≡ w to machine-ε over a dense preset grid (closed form, NOT sampled) —');
{
  let worst = 0, n = 0;
  for (const N of [3, 5, 7, 9, 11]) {              // canonical + a couple extra odd orders
    for (const w of [0.5, 1.0, 2.3]) {
      const sh = reuleaux(N, w);
      for (let k = 0; k < 7200; k++) {
        worst = Math.max(worst, Math.abs(supportHeight(sh, k * Math.PI / 7200) - w));
        n++;
      }
    }
  }
  ok('supportHeight(θ) === w for every (odd order, width, θ) — the width never changes direction', worst < 1e-12, `${n} dirs · max|Δ| = ${worst.toExponential(2)}`);
}

// ── 3. PLANK RIDES LEVEL — plankHeight(φ) ≡ w over a full rolling-α sweep, NO tick. ─
console.log('\n— PLANK RIDES LEVEL: plankHeight(φ) ≡ w over a rolling sweep (C0-continuous through the cusp — no corner-pivot tick) —');
{
  let worst = 0, maxStep = 0, n = 0, prev = null;
  const sh = reuleaux(3, 1.0);                      // the cusp-iest preset (sharp corners)
  for (let k = 0; k < 12000; k++) {
    const phi = k * 2 * Math.PI / 12000;
    const ph = plankHeight(sh, phi);
    worst = Math.max(worst, Math.abs(ph - 1.0));
    if (prev !== null) maxStep = Math.max(maxStep, Math.abs(ph - prev));   // adjacent-φ jump (a tick would spike this)
    prev = ph; n++;
  }
  ok('plankHeight(φ) === w over a full rolling sweep on the sharp-cornered n=3 preset', worst < 1e-12, `${n} φ · max|Δ| = ${worst.toExponential(2)}`);
  ok('★ NO CORNER-PIVOT TICK: the largest adjacent-φ jump in plankHeight is itself < 1e-12 (continuous through every cusp)', maxStep < 1e-12, `max step = ${maxStep.toExponential(2)}`);
}

// ── 4. BARBIER — perimeter EXACTLY π·w on every constant-width preset. ───────────
console.log('\n— BARBIER: perimeter === π·w exactly on every constant-width Reuleaux preset —');
{
  let worst = 0, n = 0;
  for (const N of [3, 5, 7, 9, 11]) {
    for (const w of [0.5, 1.0, 2.3]) {
      worst = Math.max(worst, Math.abs(perimeter(reuleaux(N, w)) - Math.PI * w));
      n++;
    }
  }
  ok('perimeter(reuleaux) === π·w for every (odd order, width) — Barbier, the circle (πd) is just one case', worst < 1e-12, `${n} shapes · max|Δ| = ${worst.toExponential(2)}`);
}

// ── 5. NEG-CONTROL ELLIPSE — its amplitude is the analytic 2(a−b), across a ladder. ─
console.log('\n— NEG-CONTROL ELLIPSE: width amplitude === 2(a−b) across a ladder of (a,b); a circle (a=b) is the level limit —');
{
  let worstAmp = 0, allBob = true, circleFlat = true, n = 0;
  for (const a of [1.0, 1.4, 2.0]) {
    for (const b of [0.5, 0.8, 1.0]) {
      const el = ellipse(a, b);
      const measured = widthRange(el, 4000).delta;          // 4000 even ⇒ θ=0 and θ=π/2 are grid points
      const analytic = ellipseAmplitude(a, b);
      worstAmp = Math.max(worstAmp, Math.abs(measured - analytic));
      if (a !== b) { if (!(measured > THRESH && !isConstantWidth(el))) allBob = false; }
      else { if (!(measured < 1e-12)) circleFlat = false; }
      n++;
    }
  }
  ok('measured ellipse width-amplitude === 2(a−b) to <1e-12 across the ladder — the bob is REAL computed extent', worstAmp < 1e-12, `${n} ellipses · max|Δ| = ${worstAmp.toExponential(2)}`);
  ok('★ every stretched ellipse (a≠b) bobs > THRESH AND !isConstantWidth — round + smooth does NOT save it', allBob);
  ok('★ a CIRCLE (a=b) has amplitude < 1e-12 — the level limit, pinning the failure on STRETCH not roundness', circleFlat);
}

// ── 6. Δwidth IS A CONTINUOUS DIAL — monotone in the break δ; 0 at δ=0. ──────────
console.log('\n— Δwidth IS A DIAL: monotone increasing in the perturbation δ; exactly 0 at δ=0 —');
{
  let monotoneAll = true, zeroAt0 = true, n = 0;
  for (const N of [3, 5, 7]) {
    const d0 = widthRange(reuleaux(N, W0)).delta;
    let prev = d0;
    if (!(d0 < 1e-12)) zeroAt0 = false;
    for (const delta of [0.05, 0.1, 0.2, 0.3, 0.4]) {
      const d = widthRange(brokenReuleaux(N, W0, delta)).delta;
      if (!(d > prev)) monotoneAll = false;
      prev = d; n++;
    }
  }
  ok('Δwidth(δ) strictly increases with the break δ on every preset (the honest live readout is a dial)', monotoneAll, `${n} steps`);
  ok('★ Δwidth(δ=0) === 0 to <1e-12 (the unperturbed preset is exactly constant width)', zeroAt0);
}

// ── 7. SUPPORT-FUNCTION SANITY — closed form vs a coarse boundary check; the trap. ─
console.log('\n— SUPPORT FUNCTION: the closed form beats boundary-sampling by orders of magnitude (the verified trap) —');
{
  // a boundary-sampled support: walk the arc boundary, take max projection. This is the
  // NAIVE approach the core deliberately avoids; show it caps far worse than the closed form.
  const sh = reuleaux(5, 1.0);
  const arcs = reuleauxArcs(sh);
  const sampledSupport = (u, M) => {
    let best = -Infinity;
    for (const arc of arcs) {
      // walk this arc's normal fan, projecting boundary points
      const norm = a => { let x = a % (2 * Math.PI); if (x > Math.PI) x -= 2 * Math.PI; if (x <= -Math.PI) x += 2 * Math.PI; return x; };
      const sweep = norm(arc.phiB - arc.phiA);
      for (let s = 0; s <= M; s++) {
        const phi = arc.phiA + sweep * (s / M);
        const p = [arc.c[0] + arc.r * Math.cos(phi), arc.c[1] + arc.r * Math.sin(phi)];
        const proj = p[0] * u[0] + p[1] * u[1];
        if (proj > best) best = proj;
      }
    }
    return best;
  };
  let worstClosed = 0, worstSampled = 0;
  for (let k = 0; k < 360; k++) {
    const th = k * Math.PI / 360, u = uHat(th), un = [-u[0], -u[1]];
    const closed = support(sh, u) + support(sh, un);
    const sampled = sampledSupport(u, 200) + sampledSupport(un, 200);
    worstClosed = Math.max(worstClosed, Math.abs(closed - 1.0));
    worstSampled = Math.max(worstSampled, Math.abs(sampled - 1.0));
  }
  ok('the CLOSED-FORM support height hits < 1e-12 (the authority the page uses)', worstClosed < 1e-12, `closed max|Δ| = ${worstClosed.toExponential(2)}`);
  ok('★ a 200-pt BOUNDARY-SAMPLED support caps orders of magnitude worse — the trap the closed form avoids', worstSampled > worstClosed * 1e3, `sampled max|Δ| = ${worstSampled.toExponential(2)} ≫ closed`);
}

// ── 8. POSE — the centroid BOBS for the ellipse while the plank stays level. ────────
console.log('\n— POSE: the contact-height (centroid) BOBS while plankHeight stays level — the gap that IS the exhibit —');
{
  const reu = reuleaux(5, 1.0);
  let reuPlankFlat = true, reuCentroidMoves = false;
  let cyMin = Infinity, cyMax = -Infinity;
  for (let k = 0; k < 720; k++) {
    const phi = k * 2 * Math.PI / 720;
    const p = pose(reu, phi);
    if (Math.abs(p.plankY - 1.0) > 1e-12) reuPlankFlat = false;
    cyMin = Math.min(cyMin, p.cy); cyMax = Math.max(cyMax, p.cy);
  }
  if (cyMax - cyMin > 1e-6) reuCentroidMoves = true;     // the centroid wanders even for constant width
  ok('the Reuleaux plankY stays === w over a full roll (the plank is dead level)', reuPlankFlat);
  ok('★ yet the Reuleaux CONTACT-HEIGHT (centroid) WANDERS over the roll — level plank over a wandering centre IS the exhibit', reuCentroidMoves, `centroid range = ${(cyMax - cyMin).toExponential(2)}`);
  // pose reports both ARC and VERTEX contact modes over a roll (the contact does hand off).
  let sawArc = false, sawVertex = false;
  const tri = reuleaux(3, 1.0);
  for (let k = 0; k < 720; k++) {
    const m = pose(tri, k * 2 * Math.PI / 720).contactMode;
    if (m === 'ARC') sawArc = true; if (m === 'VERTEX') sawVertex = true;
  }
  ok('pose() reports BOTH ARC and VERTEX contact modes over a roll of the n=3 preset (the contact genuinely hands off)', sawArc && sawVertex);
}

// ── 9. RE-EXTRACTION PARITY — the page core === the module, byte-for-byte. ──────
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== THE-LEVEL-RIDE CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== THE-LEVEL-RIDE CORE (inlined byte-twin) END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in index.html', i >= 0 && j > i,
    i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) ★ each inlined function body === imported fn.toString() char-for-char.
    const fnPairs = [
      ['reuleaux', reuleaux], ['ellipse', ellipse], ['dot2', dot2], ['uHat', uHat],
      ['reuleauxVerts', reuleauxVerts], ['reuleauxArcs', reuleauxArcs], ['angleInFan', angleInFan],
      ['support', support], ['supportHeight', supportHeight], ['widthRange', widthRange],
      ['isConstantWidth', isConstantWidth], ['plankHeight', plankHeight], ['perimeter', perimeter],
      ['pose', pose], ['ellipseAmplitude', ellipseAmplitude], ['brokenReuleaux', brokenReuleaux],
      ['runSelfTest', runSelfTest],
    ];
    let fdrift = '';
    for (const [name, fn] of fnPairs) {
      const pageBody = extractFn(slice, name);
      if (norm(pageBody) !== norm(fn.toString())) { fdrift = name; break; }
    }
    ok('(parity)★ every inlined FUNCTION body is char-for-char the imported core (support/supportHeight/widthRange/plankHeight/perimeter/pose/…)',
      fdrift === '', fdrift === '' ? `all ${fnPairs.length} functions byte-identical` : `DRIFT in ${fdrift}`);

    // (b) the load-bearing constants are present verbatim.
    ok('(parity)★ the inlined constants THRESH, W0, PRESET_NS are present verbatim',
      slice.indexOf('const THRESH = 1e-3;') >= 0 && slice.indexOf('const W0 = 1;') >= 0 &&
      slice.indexOf('const PRESET_NS = [3, 5, 7];') >= 0);

    // (c) evaluate the slice and run ITS runSelfTest → same pass-count + ok-for-ok.
    let pageRes = null, evalErr = null;
    const RET = '\n;return { runSelfTest };';
    try {
      const factory = new Function(slice + RET);
      pageRes = factory().runSelfTest();
    } catch (e) { evalErr = e; }
    ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');

    if (pageRes) {
      const modRes = runSelfTest();
      ok('(parity)★ inline runSelfTest pass-count == module pass-count (the chip count == the Node count)',
        pageRes.pass === modRes.pass && pageRes.total === modRes.total,
        `in-page ${pageRes.pass}/${pageRes.total}  ·  module ${modRes.pass}/${modRes.total}`);
      let agree = pageRes.checks.length === modRes.checks.length;
      for (let k = 0; agree && k < pageRes.checks.length; k++) {
        if (pageRes.checks[k].ok !== modRes.checks[k].ok || pageRes.checks[k].name !== modRes.checks[k].name) agree = false;
      }
      ok('(parity)★ every named claim agrees ok-for-ok AND name-for-name (page vs module)', agree,
        agree ? `all ${pageRes.checks.length} lines identical` : 'a line disagreed');
    }
  }
}

// extract `function NAME(...) { ... }` with brace-matching from a source string.
// Skips the PARAMETER LIST first (matching its parentheses) so a default-value
// parameter doesn't fool the body-brace finder. (Same extractor as the siblings.)
function extractFn(src, name) {
  const re = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = re.exec(src);
  if (!m) return '';
  let p = src.indexOf('(', m.index);
  let pd = 0, k = p;
  for (; k < src.length; k++) {
    if (src[k] === '(') pd++;
    else if (src[k] === ')') { pd--; if (pd === 0) { k++; break; } }
  }
  let i = src.indexOf('{', k);
  if (i < 0) return '';
  let depth = 0, b = i;
  for (; b < src.length; b++) {
    if (src[b] === '{') depth++;
    else if (src[b] === '}') { depth--; if (depth === 0) { b++; break; } }
  }
  return src.slice(m.index, b);
}

console.log(`\n${pass}/${total} ${pass === total ? '✓ ALL GREEN' : '✗ FAILURES'}`);
process.exit(pass === total ? 0 : 1);
