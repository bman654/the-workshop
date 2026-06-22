// The Pool That Dances — Node twin. Three layers (the mirage discipline):
//   (a) run the page's runSelfTest() — every check must be green;
//   (b) INDEPENDENT re-derivations at params the page never uses — a 30-poke deterministic
//       PRNG fan re-proving conservation; the analytic-tilt closed-form detJ≡1 across sun
//       angles; a fresh fold/contrast battery; the analytic-vs-FD gradient check;
//   (c) BYTE-PARITY: the slice between the POOL CORE sentinels in core.mjs and in index.html,
//       indentation-normalized, must be IDENTICAL — so the painting can't drift from this test.
// Exit 0 = all green. Run:  node pool/core.test.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  xorshift32, jacobian, landing, depositedLight, foldContour, floorHistogram,
  flatSurface, tiltSurface, frozenSurface, pokeFan, witnessSurface, makeParams, runSelfTest,
} from './core.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
const ok = (name, cond, info = '') => {
  if (cond) { pass++; console.log('  ✓ ' + name + (info ? '  [' + info + ']' : '')); }
  else { fail++; console.log('  ✗ ' + name + (info ? '  [' + info + ']' : '')); }
};

console.log('\nThe Pool That Dances — Node twin\n');

// ── (a) the page's own self-test, run here ──────────────────────────────────
console.log('(a) core runSelfTest() — the same checks the in-page pill reports:');
{
  const st = runSelfTest();
  for (const c of st.checks) ok(c.name, c.pass, c.info);
  ok('runSelfTest summary all green', st.ok, st.passed + '/' + st.total);
}

// ── (b) INDEPENDENT re-derivations at FRESH params the page never uses ───────
console.log('\n(b) independent re-derivations (fresh params, methods not in the page path):');

// (b1) ANALYTIC-VS-FD GRADIENT on a fresh 40-surface fan: hx,hy === central diff of h to <1e-9.
{
  const rng = xorshift32(0xB1A5E1);
  const fan = pokeFan(rng, 40);
  let worst = 0, n = 0;
  for (const s of fan){
    for (let t = 0; t < 12; t++){
      const x = (rng()*2-1)*0.9, y = (rng()*2-1)*0.9, e = 1e-6;
      const fdx = (s.h(x+e,y) - s.h(x-e,y))/(2*e);
      const fdy = (s.h(x,y+e) - s.h(x,y-e))/(2*e);
      worst = Math.max(worst, Math.abs(fdx - s.hx(x,y)), Math.abs(fdy - s.hy(x,y))); n++;
    }
  }
  ok('b1 · analytic hx,hy === FD(h) on a fresh 40-surface fan (<1e-9)', worst < 1e-9,
     'maxErr=' + worst.toExponential(2) + ' n=' + n);
}

// (b2) CONSERVATION on a fresh 30-poke deterministic PRNG fan: ∫floor-light = surface area
//      (2L)² to <1e-6 relative, escaped=0, cross-surface drift <1e-6. The honest CoV.
{
  const rng = xorshift32(0x305E);
  const fan = pokeFan(rng, 30);
  let worstRel = 0, anyEscape = false; const deposits = [];
  // include flat in the fan so the drift band spans flat↔curved
  const sets = [makeParams(flatSurface())].concat(fan.map(s => makeParams(s)));
  for (const p of sets){
    const r = depositedLight(p, 320);
    const rel = Math.abs(r.deposited - r.surfaceArea)/r.surfaceArea;
    worstRel = Math.max(worstRel, rel);
    if (r.escaped !== 0) anyEscape = true;
    deposits.push(r.deposited);
  }
  let drift = 0; for (const d of deposits) drift = Math.max(drift, Math.abs(d - deposits[0]));
  ok('b2 · conservation on a fresh 30-poke fan (+flat): ∫floor-light = (2L)² (<1e-6 rel), escaped=0, drift<1e-6',
     worstRel < 1e-6 && !anyEscape && drift < 1e-6,
     'maxRel=' + worstRel.toExponential(2) + ' escaped=' + anyEscape + ' drift=' + drift.toExponential(2) + ' n=' + sets.length);
}

// (b3) AFFINE ORACLE: a linear-tilt surface h = a·x + b·y makes the landing map AFFINE, so det J
//      is spatially CONSTANT (a fold-free map — no caustic — even under a tilted sun), and equals 1
//      EXACTLY only when flat (a=b=0). A ground-truth the central-diff Jacobian cannot fake.
//      Re-proved on 40 random (a,b,tilt) the page never boots.
{
  const rng = xorshift32(0x7117ED);
  let worstSpread = 0, n = 0;
  for (let i = 0; i < 40; i++){
    const a = (rng()*2-1)*0.6, b = (rng()*2-1)*0.6, tilt = (rng()*2-1)*0.5;
    const p = makeParams(tiltSurface(a, b), { sunTilt: tilt });
    const dets = [];
    for (let t = 0; t < 6; t++){
      const x = (rng()*2-1)*0.85, y = (rng()*2-1)*0.85;
      dets.push(jacobian(x, y, p).det); n++;
    }
    worstSpread = Math.max(worstSpread, Math.max(...dets) - Math.min(...dets));
  }
  // and =1 to <1e-9 when flat
  let flatErr = 0;
  for (const tilt of [0, 0.2, -0.3]){
    const pf = makeParams(tiltSurface(0, 0), { sunTilt: tilt });
    // a flat surface under a tilted sun is STILL a pure translation ⇒ detJ≡1
    for (const [x,y] of [[-0.4,0.2],[0.3,-0.5],[0.6,0.1]]) flatErr = Math.max(flatErr, Math.abs(jacobian(x,y,pf).det - 1));
  }
  ok('b3 · affine oracle: h=a·x+b·y ⇒ detJ spatially constant (no fold) across random (a,b,sunTilt) (<1e-6); =1 iff flat',
     worstSpread < 1e-6 && flatErr < 1e-9, 'maxSpread=' + worstSpread.toExponential(2) + ' flatErr=' + flatErr.toExponential(2) + ' n=' + n);
}

// (b4) FRESH FOLD/CONTRAST BATTERY: on fresh poked surfaces, where |detJ|<1e-3 the brightness
//      exceeds 200, the smooth interior stays O(1), and fold/smooth contrast tops 40×.
{
  const rng = xorshift32(0xF01D);
  const fan = pokeFan(rng, 8);
  const EPS = 1e-3, FLOOR = 200, SMOOTH = 0.3;
  let allOk = true, anyFold = false, worstContrast = Infinity;
  for (const s of fan){
    const p = makeParams(s);
    const Ng = 200, cell = 2/Ng; const smoothB = []; let foldMin = Infinity, foldMax = 0, seen = false, smoothMax = 0;
    for (let iy = 0; iy < Ng; iy++){ const y = -1 + (iy+0.5)*cell;
      for (let ix = 0; ix < Ng; ix++){ const x = -1 + (ix+0.5)*cell;
        const det = jacobian(x, y, p).det; const b = 1/Math.max(1e-12, Math.abs(det));
        if (Math.abs(det) < EPS){ seen = true; foldMin = Math.min(foldMin, b); foldMax = Math.max(foldMax, b); }
        else if (Math.abs(det) > SMOOTH){ smoothB.push(b); smoothMax = Math.max(smoothMax, b); }
      }
    }
    if (seen){ anyFold = true;
      if (foldMin <= FLOOR) allOk = false;
      smoothB.sort((a,b)=>a-b); const med = smoothB.length ? smoothB[smoothB.length>>1] : 1;
      if (!(med < 5)) allOk = false;
      const c = foldMax/med; worstContrast = Math.min(worstContrast, c); if (c <= 40) allOk = false;
    }
  }
  ok('b4 · fresh fold/contrast battery: |detJ|<1e-3⇒b>200, smooth O(1), contrast>40×',
     anyFold && allOk, 'fold=' + anyFold + ' minContrast=' + (isFinite(worstContrast)?worstContrast.toFixed(1):'∞') + '×');
}

// (b5) NEG-CONTROL re-proved on a fresh off-center grid: flat ⇒ detJ≡1, empty fold zero-set,
//      uniform floor.
{
  const p = makeParams(flatSurface());
  let maxErr = 0;
  for (let i = 0; i < 11; i++) for (let j = 0; j < 11; j++){
    const x = -0.91 + i*0.18 + 0.013, y = -0.91 + j*0.18 + 0.021;
    maxErr = Math.max(maxErr, Math.abs(jacobian(x, y, p).det - 1));
  }
  const C = foldContour(p, 400);
  const hg = floorHistogram(p, 220, 220);
  let mn = Infinity, mx = 0;
  for (let i = 0; i < hg.hist.length; i++){ const v = hg.hist[i]; if (v > 0){ mn = Math.min(mn, v); mx = Math.max(mx, v); } }
  ok('b5 · neg-control re-proved: flat ⇒ detJ≡1 off-center, empty fold zero-set, uniform floor',
     maxErr < 1e-9 && C.length === 0 && (mx - mn) < 1e-6,
     'maxErr=' + maxErr.toExponential(2) + ' foldPts=' + C.length + ' span=' + (mx-mn).toExponential(2));
}

// (b6) IMAGE COINCIDENCE on a FRESH curved surface (not the witness): the brightest 1% of floor
//      cells sit ON the caustic F(detJ=0) to a tight median/mean, with a sparse cusp-width tail.
{
  const fresh = frozenSurface([
    { kind: 'bump', cx: 0.12, cy: -0.18, sigma: 0.18, A: 0.18 },
    { kind: 'bump', cx: -0.30, cy: 0.16, sigma: 0.15, A: -0.13 },
    { kind: 'ripple', cx: 0.05, cy: 0.25, sigma: 0.24, A: 0.11, kx: 8, ky: -4, phi: 1.1 },
  ]);
  const p = makeParams(fresh);
  // map the fold to the FLOOR via F — the caustic on the floor is F(detJ=0), not the zero-set itself.
  const C = foldContour(p, 420).map(c => { const f = landing(c.x, c.y, p); return { x: f[0], y: f[1] }; });
  const hg = floorHistogram(p, 400, 300);
  const idx = [];
  for (let i = 0; i < hg.hist.length; i++) if (hg.hist[i] > 0) idx.push(i);
  idx.sort((a,b)=>hg.hist[b]-hg.hist[a]);
  const top = idx.slice(0, Math.max(1, Math.floor(idx.length*0.01)));
  const bw = hg.cell; const dists = [];
  for (const i of top){
    const bx = i % hg.bins, by = (i/hg.bins)|0;
    const fx = -1 + (bx+0.5)*bw, fy = -1 + (by+0.5)*bw;
    let dmin = Infinity; for (const c of C){ const d = Math.hypot(c.x-fx, c.y-fy); if (d < dmin) dmin = d; }
    dists.push(dmin/bw);
  }
  dists.sort((a,b)=>a-b);
  const mean = dists.reduce((a,b)=>a+b,0)/dists.length, median = dists[dists.length>>1];
  const p99 = dists[Math.floor(dists.length*0.99)];
  ok('b6 · image coincidence on a FRESH surface: brightest-1% sit on F(detJ=0) — median≤1, mean≤2 (99th-pct≤8)',
     C.length > 0 && median <= 1 && mean <= 2 && p99 <= 8,
     'median=' + median.toFixed(2) + ' mean=' + mean.toFixed(2) + ' p99=' + p99.toFixed(2) + ' |F(C)|=' + C.length);
}

// ── (c) BYTE-PARITY between core.mjs and index.html ─────────────────────────
console.log('\n(c) byte-parity: the CORE slice in index.html must match core.mjs exactly:');
{
  const START = '// ===== POOL CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END POOL CORE =====';
  const slice = (txt) => {
    const i = txt.indexOf(START), j = txt.indexOf(END);
    if (i < 0 || j < 0) return null;
    return txt.slice(i, j + END.length);
  };
  const normalize = (s) => s.split('\n').map(l => l.trim()).filter(Boolean).join('\n');
  const coreTxt = readFileSync(join(HERE, 'core.mjs'), 'utf8');
  let pageTxt = '';
  try { pageTxt = readFileSync(join(HERE, 'index.html'), 'utf8'); } catch (e) { /* page not forged yet */ }
  const a = slice(coreTxt), b = slice(pageTxt);
  if (a == null || b == null){
    ok('c · core sentinels present in both files', false, 'core=' + (a != null) + ' page=' + (b != null));
  } else {
    const same = normalize(a) === normalize(b);
    console.log('  ' + (same ? 'IDENTICAL' : 'DRIFTED'));
    ok('c · index.html CORE slice === core.mjs CORE slice (indentation-normalized)', same);
  }
}

// ── summary ─────────────────────────────────────────────────────────────────
console.log('\n' + (fail === 0 ? 'PASS' : 'FAIL') + ' — ' + pass + ' passed, ' + fail + ' failed.\n');
process.exit(fail === 0 ? 0 : 1);
