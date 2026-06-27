// The Homicidal Chauffeur — the Node twin. runSelfTest() is the SOLE oracle the in-page pill
// runs; this twin runs that SAME function (the four headline claims) and then piles on the heavy
// rigour the page need not carry: a 3000-config Dubins sweep, an INDEPENDENT Newton-shooting
// oracle (no closed-form algebra), an ODE-faithfulness convergence study (RK4 of the raw unicycle
// ODE vs the exact arc), the deterministic pursuit sims, and a BYTE-PARITY check that the
// CHAUFFEUR-CORE region inlined into index.html is byte-identical to core.mjs. Zero deps. Exit 0 = GREEN.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as core from './core.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const { advance, follow, dubins, flee, makeJink, sim, SCRIPTED, runSelfTest, angWrap, TAU } = core;
let fails = 0;
const line = (ok, msg) => { if (!ok) fails++; console.log((ok ? 'PASS' : 'FAIL') + '  ' + msg); };
const rng = (() => { let s = 99991; return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; })();

console.log('THE HOMICIDAL CHAUFFEUR — Node twin\n');

// ── (A) the four headline claims — the EXACT function the in-page pill paints ──
{
  const r = runSelfTest();
  console.log('in-page oracle runSelfTest():', r.passed + '/' + r.total, r.ok ? 'GREEN' : 'RED');
  for (const c of r.checks) line(c.pass, 'pill[' + c.name.slice(0, 1) + '] ' + c.name + '  ::  ' + c.info);
  console.log('');
}

// ── (B) heavy rigour the page need not run ──

// [1] 3000-config Dubins: every shortest word integrates ONTO the goal and len === integrated len.
{
  let worst = 0, n = 0, hit = true;
  for (let i = 0; i < 3000; i++) {
    const A = { x: rng() * 4 - 2, y: rng() * 4 - 2, h: rng() * TAU }, B = { x: rng() * 4 - 2, y: rng() * 4 - 2, h: rng() * TAU }, R = 0.3 + rng() * 1.5;
    const b = dubins(A, B, R); if (!b) { hit = false; continue; }
    const { end, len } = follow(A, b.segs, R);
    worst = Math.max(worst, Math.hypot(end.x - B.x, end.y - B.y), Math.abs(angWrap(end.h - B.h)), Math.abs(len - b.len)); n++;
  }
  line(hit && worst < 1e-9, '[1]  3000 configs: closed-form Dubins lands on goal & len===integrated  ::  worst |Δ| = ' + worst.toExponential(2) + ' (n=' + n + ')');
}

// [1b] INDEPENDENT ORACLE — per-type Newton shooting on the integrator (no closed-form algebra).
//      Solves F(seg lengths)=0 for each of the six word types from a grid of seeds, takes the min
//      feasible; must agree with the closed-form shortest to machine epsilon. (code-disjoint)
function shoot(start, goal, R) {
  const types = [['L', 'S', 'L'], ['R', 'S', 'R'], ['L', 'S', 'R'], ['R', 'S', 'L'], ['R', 'L', 'R'], ['L', 'R', 'L']];
  const D = Math.hypot(goal.x - start.x, goal.y - start.y) / R;
  let best = Infinity, bt = null;
  const seeds = []; for (const s1 of [0.3, 2.5, 5.0]) for (const s2 of [0.2, D + 0.5, 3.0]) for (const s3 of [0.3, 2.5, 5.0]) seeds.push([s1, s2, s3]);
  for (const type of types) {
    const Fv = p => { const { end } = follow(start, [[type[0], p[0]], [type[1], p[1]], [type[2], p[2]]], R); return [end.x - goal.x, end.y - goal.y, angWrap(end.h - goal.h)]; };
    for (const seed of seeds) {
      let p = seed.slice(), ok = true;
      for (let it = 0; it < 60; it++) {
        const f = Fv(p); if (Math.hypot(f[0], f[1], f[2]) < 1e-13) break;
        const J = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], hh = 1e-7;
        for (let c = 0; c < 3; c++) { const q = p.slice(); q[c] += hh; const fq = Fv(q); for (let r = 0; r < 3; r++) J[r][c] = (fq[r] - f[r]) / hh; }
        const A = J, det = A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
        if (Math.abs(det) < 1e-14) { ok = false; break; }
        const I = [[(A[1][1] * A[2][2] - A[1][2] * A[2][1]), -(A[0][1] * A[2][2] - A[0][2] * A[2][1]), (A[0][1] * A[1][2] - A[0][2] * A[1][1])], [-(A[1][0] * A[2][2] - A[1][2] * A[2][0]), (A[0][0] * A[2][2] - A[0][2] * A[2][0]), -(A[0][0] * A[1][2] - A[0][2] * A[1][0])], [(A[1][0] * A[2][1] - A[1][1] * A[2][0]), -(A[0][0] * A[2][1] - A[0][1] * A[2][0]), (A[0][0] * A[1][1] - A[0][1] * A[1][0])]].map(r => r.map(v => v / det));
        const dp = [0, 0, 0]; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) dp[r] -= I[r][c] * f[c]; for (let c = 0; c < 3; c++) p[c] += dp[c];
      }
      const f = Fv(p); if (ok && Math.hypot(f[0], f[1], f[2]) < 1e-9) { const isArc = [type[0] !== 'S', type[1] !== 'S', type[2] !== 'S']; const pp = p.map((v, i) => isArc[i] ? ((v % TAU) + TAU) % TAU : v); if (pp.every(v => v >= -1e-7)) { const len = (pp[0] + pp[1] + pp[2]) * R; if (len < best) { best = len; bt = type.join(''); } } }
    }
  }
  return { best, bt };
}
{
  let worst = 0, bad = 0, n = 0;
  for (let i = 0; i < 320; i++) {
    const A = { x: 0, y: 0, h: rng() * TAU }, B = { x: rng() * 4 - 2, y: rng() * 4 - 2, h: rng() * TAU }, R = 0.4 + rng() * 1.4;
    const cf = dubins(A, B, R); if (!cf) continue; n++;
    const sh = shoot(A, B, R); const g = Math.abs(cf.len - sh.best); worst = Math.max(worst, g); if (g > 1e-6) bad++;
  }
  line(bad === 0, '[1b] ' + n + ' configs: closed-form === INDEPENDENT Newton-shooting oracle  ::  worst gap = ' + worst.toExponential(2) + ' (disagreements=' + bad + ')');
}

// [ODE] FAITHFULNESS — RK4 of the raw unicycle ODE (x'=cos h, y'=sin h, h'=κ) converges to the
//       exact-arc advance() as the step shrinks. The closed-form arc is the true integral curve;
//       a 4th-order scheme must approach it at ~4th order. (code-disjoint integrator)
function rk4seg(s, kappa, L, N) {
  let st = { ...s }; const h = L / N;
  for (let i = 0; i < N; i++) {
    const f = q => [Math.cos(q.h), Math.sin(q.h), kappa];
    const k1 = f(st);
    const k2 = f({ x: st.x + h / 2 * k1[0], y: st.y + h / 2 * k1[1], h: st.h + h / 2 * k1[2] });
    const k3 = f({ x: st.x + h / 2 * k2[0], y: st.y + h / 2 * k2[1], h: st.h + h / 2 * k2[2] });
    const k4 = f({ x: st.x + h * k3[0], y: st.y + h * k3[1], h: st.h + h * k3[2] });
    st = { x: st.x + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), y: st.y + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]), h: st.h + h / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]) };
  }
  return st;
}
{
  const s0 = { x: 0.3, y: -0.4, h: 1.1 }, R = 1.3, L = 2.7;
  const ex = advance(s0, 1 / R, L);
  const errs = [4, 16, 64, 256].map(N => { const rk = rk4seg(s0, 1 / R, L, N); return Math.hypot(ex.x - rk.x, ex.y - rk.y, angWrap(ex.h - rk.h)); });
  // converges, and the order ≈ 4 (each ×4 refinement cuts the error by ~×256)
  const order = Math.log2(errs[0] / errs[3]) / 3;  // 3 quartiles of refinement
  const converges = errs[3] < 1e-7 && errs[3] < errs[0] && order > 3.5;
  line(converges, '[ODE] RK4 of the raw unicycle ODE → exact arc  ::  err ' + errs.map(e => e.toExponential(1)).join(' → ') + ' (order ≈ ' + order.toFixed(1) + ')');
}

// [2] deterministic radial-flee CAPTURE in bounded time (the proof's locked scenario).
{
  const sc = { ...SCRIPTED, e0: { x: 3, y: 0, h: 0 }, evader: () => (e, p, s) => flee(e, p, s.ve) };
  const r = sim(sc);
  const bound = Math.PI * sc.R / sc.vp + (3 + sc.ell) / (sc.vp - sc.ve);
  line(r.cap && r.capT < bound, '[2]  scripted radial flee caught: capT = ' + r.capT.toFixed(2) + ' < analytic bound ' + bound.toFixed(2));
}

// [3]/[4b] DISCRIMINATION — the SAME optimal jink survives at the real R but is caught at R→0.
{
  const real = sim({ ...SCRIPTED, e0: { x: 4, y: 0, h: 0 }, evader: makeJink });
  const tiny = sim({ ...SCRIPTED, e0: { x: 4, y: 0, h: 0 }, R: 1e-3, evader: makeJink });
  line(!real.cap && real.minSep > 1.4 * SCRIPTED.ell && tiny.cap && tiny.capT < SCRIPTED.T,
    '[3]  jink SURVIVES at R=' + SCRIPTED.R + ' (minSep ' + real.minSep.toFixed(3) + ' = ' + (real.minSep / SCRIPTED.ell).toFixed(2) + '×ell) but CAUGHT at R→0 (t=' + tiny.capT.toFixed(2) + ')');
}

// [4a] NEG-CONTROL — Dubins length collapses monotonically to the straight-line distance as R→0.
{
  const A = { x: 0, y: 0, h: 2.0 }, B = { x: 3, y: 1, h: -1.3 }, D = Math.hypot(3, 1);
  const L = [1, 0.1, 0.01, 0.001, 0.0001].map(R => dubins(A, B, R).len);
  line(L.every((l, i) => i === 0 || l <= L[i - 1] + 1e-9) && Math.abs(L[4] - D) < 1e-3,
    '[4a] R→0: Dubins length → D=' + D.toFixed(4) + ' monotonically  ::  ' + L.map(x => x.toFixed(4)).join(' → ') + '  (|L−D|=' + Math.abs(L[4] - D).toExponential(1) + ')');
}

// ── (C) BYTE-PARITY: the CHAUFFEUR-CORE region inlined into index.html === core.mjs, sentinel-to-sentinel ──
{
  const START = '// === CHAUFFEUR-CORE BEGIN ===';
  const END = '// === CHAUFFEUR-CORE END ===';
  const slab = text => { const i = text.indexOf(START), j = text.indexOf(END); return (i < 0 || j < 0) ? null : text.slice(i, j + END.length); };
  const modBlock = slab(readFileSync(join(here, 'core.mjs'), 'utf8'));
  const htmlBlock = slab(readFileSync(join(here, 'index.html'), 'utf8'));
  const ok = modBlock !== null && htmlBlock !== null && modBlock === htmlBlock;
  line(ok, '[BYTE] CHAUFFEUR-CORE inlined in index.html is byte-identical to core.mjs  ::  ' + (modBlock ? modBlock.length : 'n/a') + ' vs ' + (htmlBlock ? htmlBlock.length : 'n/a') + ' bytes');
}

console.log('\n' + '-'.repeat(72));
console.log(fails === 0 ? 'ALL GREEN ✓' : fails + ' FAILED ✗');
process.exit(fails === 0 ? 0 : 1);
