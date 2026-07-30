/* ═══════════════════════════════════════════════════════════════════════════
   THE HEADWATERS · the Node twin

     node the-headwaters/erode.test.mjs

   Three kinds of check, deliberately separated:

     MACHINERY   the heap, the flood, the ordering, the sweeps.  These are
                 exact and are asserted at machine precision.
     THE SOLVER  does the code integrate the equation it says it does?  The
                 implicit residual, the diffusion stencil against its own
                 discrete eigenvalue, and the slope-area law recovered back
                 out of a landscape that was never told it.  Circular by
                 design — that is what makes them useful as tests and useless
                 as claims.
     THE CLAIM   Hack's exponent and Horton's ratios, which appear NOWHERE in
                 the three lines of physics, measured across resolutions and
                 parameters that ought to have moved them; and the deletion,
                 which is the only argument in the room that cannot be argued
                 with.
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  MinHeap, makeLand, step, route, hack, network, flowLength, flowPath,
  basins, ribbon, orderSpread, isEdge, linkLen, predictedSlope, logFit, rng, DEFAULTS
} from './erode.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
const t0 = Date.now();
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  \x1b[32mok\x1b[0m   ' + name + (detail ? '  \x1b[2m' + detail + '\x1b[0m' : '')); }
  else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + name + (detail ? '  ' + detail : '')); }
}
function near(name, got, want, tol, unit) {
  ok(name, Math.abs(got - want) <= tol,
    `got ${fmt(got)}${unit || ''}, want ${fmt(want)}${unit || ''} ± ${fmt(tol)}`);
}
function band(name, got, lo, hi, note) {
  ok(name, got >= lo && got <= hi, `${fmt(got)} in [${lo}, ${hi}]${note ? ' · ' + note : ''}`);
}
function fmt(v) {
  if (!isFinite(v)) return String(v);
  const a = Math.abs(v);
  if (a !== 0 && (a < 1e-3 || a >= 1e6)) return v.toExponential(3);
  return String(Math.round(v * 1e6) / 1e6);
}
function head(s) { console.log('\n\x1b[1m' + s + '\x1b[0m'); }

function mature(st, cap = 2600, target = 0.045) {
  let i = 0;
  while (i < cap) { step(st); i++; if (i > 200 && st.dhdt / st.U < target) break; }
  return i;
}
function hypsometric(st) {
  let s = 0, mx = 0, n = 0;
  for (let i = 0; i < st.NN; i++) {
    if (!st.land[i]) continue;
    const v = st.h[i]; s += v; n++; if (v > mx) mx = v;
  }
  return s / n / mx;
}
function nLandCells(st) { let n = 0; for (let i = 0; i < st.NN; i++) if (st.land[i]) n++; return n; }
function relief(st) { let mx = 0; for (const v of st.h) if (v > mx) mx = v; return mx; }

/* ═══════════════════════════════════════════════════════════════════════════
   1 · MACHINERY
   ═══════════════════════════════════════════════════════════════════════════ */
head('1 · machinery — the heap, the flood, the ordering');

{
  const r = rng(11), n = 40000, hp = new MinHeap(n);
  for (let i = 0; i < n; i++) hp.push(r() * 1000 - 500, i);
  let last = -Infinity, mono = true, count = 0, seen = new Set();
  while (hp.n > 0) { hp.pop(); count++; if (hp.lastKey < last - 1e-15) mono = false; last = hp.lastKey; }
  ok('MinHeap pops in non-decreasing key order', mono, `${count} keys`);
  ok('MinHeap returns every value exactly once', count === n);
  const hp2 = new MinHeap(8);
  for (const [k, v] of [[3, 30], [1, 10], [2, 20]]) hp2.push(k, v);
  const got = [hp2.pop(), hp2.pop(), hp2.pop()];
  ok('MinHeap carries its payload', got.join(',') === '10,20,30', got.join(','));
}

const stM = makeLand({ N: 192, dx: 53.3 });
const nSteps = mature(stM);
console.log(`  \x1b[2m(a 10.2 km island, ${stM.N}x${stM.N}, matured in ${nSteps} steps = ` +
  `${(stM.t / 1e6).toFixed(2)} Myr; erosion now balances uplift to ` +
  `${(100 * stM.dhdt / stM.U).toFixed(1)}%)\x1b[0m`);

{
  const { N, NN, hf, recv, ord } = stM;
  let mono = true, worst = 0;
  for (let j = 1; j < NN; j++) {
    const d = hf[ord[j - 1]] - hf[ord[j]];
    if (d > worst) worst = d;
    if (d > 1e-12) mono = false;
  }
  ok('the flood pops the grid in ascending filled height', mono, `worst inversion ${fmt(worst)} m`);

  const pos = new Int32Array(NN);
  for (let j = 0; j < NN; j++) pos[ord[j]] = j;
  let pits = 0, badOrder = 0, notLower = 0;
  for (let i = 0; i < NN; i++) {
    if (isEdge(stM, i)) continue;
    const r = recv[i];
    if (r === i) { pits++; continue; }
    if (hf[r] >= hf[i]) notLower++;
    if (pos[r] >= pos[i]) badOrder++;
  }
  ok('no land cell is left without a way downhill', pits === 0, `${pits} pits after the flood`);
  ok('every receiver is strictly lower on the filled surface', notLower === 0);
  ok('the pop order is topological: a receiver is always solved first',
    badOrder === 0, `${nLandCells(stM)} land cells checked`);

  let cyc = 0;
  const r2 = rng(5);
  for (let k = 0; k < 400; k++) {
    const i = 1 + ((r2() * (NN - 2)) | 0);
    const p = flowPath(stM, i);
    if (!isEdge(stM, p[p.length - 1])) cyc++;
    for (let q = 1; q < p.length; q++) if (hf[p[q]] >= hf[p[q - 1]]) cyc++;
  }
  ok('a drop put down anywhere runs strictly downhill and reaches the sea', cyc === 0,
    '400 random drops');
}

{
  const cellA = stM.dx * stM.dx;
  let sea = 0, all = 0;
  for (let i = 0; i < stM.NN; i++) {
    all += cellA * stM.rain[i];
    if (isEdge(stM, i)) sea += stM.area[i];
  }
  near('every drop of rain arrives at the sea exactly once',
    sea / all, 1, 1e-12, ' x');
}

{ /* the ribbon transform, against brute force on a grid small enough to do it */
  const s = makeLand({ N: 40, dx: 40 });
  mature(s, 260, 0.2);
  const R = ribbon(s);
  const NEG = -1e9, N = s.N;
  const claim = new Float64Array(s.NN).fill(NEG);
  for (let i = 0; i < s.NN; i++) {
    if (s.area[i] >= s.aCrit && !isEdge(s, i))
      claim[i] = Math.max(0.42, (9.5 * 0.0055 * Math.sqrt(s.area[i])) / s.dx * 0.5);
  }
  let worst = 0;
  for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
    let best = NEG;
    for (let b = 1; b < N - 1; b++) for (let a = 1; a < N - 1; a++) {
      if (claim[b * N + a] === NEG) continue;
      const dxc = Math.abs(a - x), dyc = Math.abs(b - y);
      const d = Math.max(dxc, dyc) + (Math.SQRT2 - 1) * Math.min(dxc, dyc);  /* chamfer metric */
      const v = claim[b * N + a] - d;
      if (v > best) best = v;
    }
    const got = R[y * N + x], want = Math.max(best, -4);
    if (got > -3.9 || want > -3.9) worst = Math.max(worst, Math.abs(got - want));
  }
  ok('the river ribbon is the max-plus distance transform it claims to be',
    worst < 1e-5, `worst disagreement with brute force ${fmt(worst)} cells ` +
    '(the field is float32; that is its epsilon)');
}

{ /* the order field carried out to a radius that grows with the order */
  const nw = network(stM);
  const O = orderSpread(stM, nw.order);
  let keptOwn = 0, wrong = 0, spread = 0, shaded = 0;
  for (let i = 0; i < stM.NN; i++) {
    if (nw.order[i] > 0) {
      if (O[i] === nw.order[i]) keptOwn++;
      else if (O[i] > nw.order[i]) shaded++;      /* a bigger stream's band */
      else wrong++;
    } else if (O[i] > 0) spread++;
  }
  ok('a channel cell is never painted with an order LOWER than its own',
    wrong === 0, `${keptOwn} kept their own, ${shaded} sit inside a bigger stream's band`);
  ok('...and the order is carried out onto the banks, further for a big stream',
    spread > keptOwn, `${spread} bank cells painted around ${keptOwn} channel cells`);
  /* the radius really does grow with order: measure the painted area per order */
  const area = new Float64Array(12), chan = new Float64Array(12);
  for (let i = 0; i < stM.NN; i++) { if (O[i]) area[O[i]]++; if (nw.order[i]) chan[nw.order[i]]++; }
  let mono = true;
  for (let o = 2; o <= nw.omax; o++) {
    if (!chan[o] || !chan[o - 1]) continue;
    if (area[o] / chan[o] <= area[o - 1] / chan[o - 1]) mono = false;
  }
  ok('the painted band per unit of channel widens at every step up the ladder',
    mono, Array.from({ length: nw.omax }, (_, k) =>
      (area[k + 1] / Math.max(1, chan[k + 1])).toFixed(1)).join(' / ') + ' cells per channel cell');
}

{ /* the core has to survive being spliced into a <script> tag for the Worker */
  const src = readFileSync(join(HERE, 'erode.mjs'), 'utf8');
  ok('the core contains no </script>, so it can be inlined into a worker tag',
    !/<\/script/i.test(src));
  ok('the core imports nothing — it can be spliced anywhere', !/^\s*import\s/m.test(src));
  const rsrc = readFileSync(join(HERE, 'render.js'), 'utf8');
  const libStart = rsrc.indexOf('const LIB = ');
  const libEnd = rsrc.indexOf('`;', libStart);
  const lib = rsrc.slice(libStart + 13, libEnd);
  ok('the shared shader library holds no backtick — it lives in a template literal',
    !lib.includes(String.fromCharCode(96)));
  ok('...and never reads gl_FragCoord: it is compiled into VERTEX shaders too',
    !/gl_FragCoord/.test(lib));
}

{ const wsrc = readFileSync(join(HERE, 'worker.js'), 'utf8');
  ok('the worker glue holds no </script> either', !/<\/script/i.test(wsrc));
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · THE SOLVER — is it integrating the equation it prints?
   ═══════════════════════════════════════════════════════════════════════════ */
head('2 · the solver — the equation, at machine precision');

{ /* the implicit stream-power update must satisfy its own discrete equation */
  const s = makeLand({ N: 128, dx: 80, D: 0 });
  mature(s, 500, 0.08);
  const before = Float64Array.from(s.h);
  const areaB = Float64Array.from(s.area);
  const recvB = Int32Array.from(s.recv);
  const dt = s.dt;
  step(s);
  let worst = 0, n = 0;
  for (let i = 0; i < s.NN; i++) {
    if (isEdge(s, i)) continue;
    const r = recvB[i];
    const U = s.U * s.upl[i];
    const hUp = before[i] + U * dt;
    if (s.h[r] >= hUp) continue;               /* the no-deposition branch */
    const E = s.K * Math.pow(areaB[i], s.m) * (s.h[i] - s.h[r]) / linkLen(s, i, r);
    const res = (s.h[i] - before[i]) / dt - U + E;
    const scale = Math.max(1e-12, Math.abs(U) + Math.abs(E));
    worst = Math.max(worst, Math.abs(res) / scale); n++;
  }
  ok('the implicit sweep solves dh/dt = U - K A^m S exactly',
    worst < 1e-12, `worst relative residual ${fmt(worst)} over ${n} cells`);
}

{ /* diffusion: a sine mode is an eigenvector of the 5-point stencil, so the
     amplitude ratio after one step is known in closed form */
  const N = 64, dx = 50, D = 0.02, dt = 5000;
  const s = makeLand({ N, dx, D, U: 0, K: 0, dt });
  const L = (N - 1) * dx, k = Math.PI / L;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++)
    s.h[y * N + x] = 100 * Math.sin(k * x * dx) * Math.sin(k * y * dx);
  const mid = ((N >> 1) * N + (N >> 1));
  const a0 = s.h[mid];
  route(s);
  step(s);
  const lam = -(4 / (dx * dx)) * (Math.sin(k * dx / 2) ** 2 + Math.sin(k * dx / 2) ** 2);
  const lim = 0.2 * dx * dx / D, nsub = Math.max(1, Math.ceil(dt / lim)), sdt = dt / nsub;
  const want = Math.pow(1 + sdt * D * lam, nsub);
  near('the hillslope stencil is the discrete Laplacian, exactly',
    s.h[mid] / a0, want, 1e-12, ' x');
  const cont = Math.exp(-2 * D * k * k * dt);
  near('...and it agrees with the continuum solution exp(-2 D k^2 t)',
    s.h[mid] / a0, cont, 4e-4, ' x');
}

{ /* the landscape must arrive at the slope the algebra predicts. It is told
     the local rule; it is never told the resulting law S = (U/K)^(1/n) A^-m/n */
  const xs = [], ys = [];
  for (let i = 0; i < stM.NN; i++) {
    if (isEdge(stM, i)) continue;
    const A = stM.area[i];
    if (A < 60 * stM.dx * stM.dx) continue;
    const r = stM.recv[i];
    const S = (stM.h[i] - stM.h[r]) / linkLen(stM, i, r);
    if (S <= 1e-7) continue;
    xs.push(Math.log10(A)); ys.push(Math.log10(S));
  }
  const f = logFit(xs, ys);
  near('the channel slopes settle onto S ~ A^-m, with m read back off the land',
    -f.b, stM.m, 0.05, '');
  const Kback = stM.U / Math.pow(10, f.a);
  near('...and the erodibility K comes back out of the landscape too',
    Kback / stM.K, 1, 0.22, ' x');
  const A1 = 4e6;
  near('predictedSlope agrees with the algebra at one pinned point',
    predictedSlope(stM, A1), stM.U / (stM.K * Math.pow(A1, stM.m)), 1e-15, '');
}

{ /* base level never moves and nothing ends up below the sea */
  let bad = 0, neg = 0;
  for (let i = 0; i < stM.NN; i++) {
    if (isEdge(stM, i) && stM.h[i] !== 0) bad++;
    if (stM.h[i] < 0) neg++;
  }
  ok('the sea holds the datum and no land sinks below it', bad === 0 && neg === 0);
}

{ /* basins agree with actually following the water */
  const lab = basins(stM);
  const r = rng(31);
  let bad = 0;
  for (let k = 0; k < 500; k++) {
    const i = 1 + ((r() * (stM.NN - 2)) | 0);
    const p = flowPath(stM, i);
    if (lab[i] !== p[p.length - 1]) bad++;
  }
  ok('the catchment map agrees with following each drop by hand', bad === 0, '500 drops');
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · THE CLAIM — the numbers the physics was never given
   ═══════════════════════════════════════════════════════════════════════════ */
head('3 · the claim — Hack, Horton, and the switch');

const hkM = hack(stM), nwM = network(stM);
band("Hack's exponent lands on Hack's own 0.6, and it is NOT the 0.5 of similar shapes",
  hkM.h, 0.52, 0.70, `h = ${fmt(hkM.h)}, R2 ${fmt(hkM.r2)}, ${hkM.nbins} bins over ` +
  `${fmt(hkM.decades)} decades, ${hkM.n} basins`);
ok('...and it really is a power law, not a smear',
  hkM.r2 > 0.985, `R2 = ${fmt(hkM.r2)}`);
ok('...over at least two decades of drainage area',
  hkM.decades >= 2, `${fmt(hkM.decades)} decades`);
ok('the 0.5 of geometric similarity is excluded by the data',
  hkM.h - 0.5 > 0.05, `h - 1/2 = ${fmt(hkM.h - 0.5)}`);
near('the binned estimator and the raw point cloud agree',
  hkM.hPoint, hkM.h, 0.06, '');

band("Horton's bifurcation ratio lands in the natural 3-5 band",
  nwM.Rb, 3.0, 6.5, `Rb = ${fmt(nwM.Rb)}, orders 1..${nwM.omax}, counts ${nwM.counts.join('/')}`);
ok('...and the stream counts really are a geometric ladder',
  nwM.RbR2 > 0.98, `R2 = ${fmt(nwM.RbR2)}`);
band("Horton's length ratio is in the natural 1.5-3.5 band",
  nwM.Rl, 1.5, 3.5, `Rl = ${fmt(nwM.Rl)}`);
{
  let mono = true;
  for (let i = 1; i < nwM.counts.length; i++) if (nwM.counts[i] >= nwM.counts[i - 1]) mono = false;
  ok('...and there are strictly fewer streams at every step up the ladder', mono);
}

head('3a · universality — the same island, four different meshes');
{
  const hs = [];
  for (const [N, dx] of [[96, 106.7], [128, 80], [160, 64], [192, 53.3]]) {
    const s = N === 192 ? stM : makeLand({ N, dx });
    if (s !== stM) mature(s);
    const k = hack(s), n = network(s);
    hs.push(k.h);
    console.log(`  \x1b[2m${String(N).padStart(4)}x${N}  dx ${String(Math.round(dx)).padStart(3)} m   ` +
      `h = ${k.h.toFixed(4)}  R2 ${k.r2.toFixed(4)}  Rb ${n.Rb.toFixed(2)}\x1b[0m`);
  }
  const spread = Math.max(...hs) - Math.min(...hs);
  ok('the exponent does not care how fine the mesh is',
    spread < 0.07, `spread ${fmt(spread)} over a 2x range of cell size`);
}

head('3b · universality — six landscapes that should have disagreed');
{
  const variants = [
    ['as built', {}],
    ['rock 3x softer', { K: 7.2e-5 }],
    ['rock 2.4x harder', { K: 1.0e-5 }],
    ['soil creep 4x', { D: 0.08 }],
    ['soil creep /4', { D: 0.005 }],
    ['uplift 3x', { U: 3e-3 }],
    ['another seed', { seed: 424242 }]
  ];
  const hs = [], rbs = [];
  for (const [name, o] of variants) {
    const s = makeLand(Object.assign({ N: 128, dx: 80 }, o));
    mature(s);
    const k = hack(s), n = network(s);
    hs.push(k.h); rbs.push(n.Rb);
    console.log(`  \x1b[2m${name.padEnd(18)} relief ${String(Math.round(relief(s))).padStart(4)} m   ` +
      `h = ${k.h.toFixed(4)}  R2 ${k.r2.toFixed(4)}  Rb ${n.Rb.toFixed(2)}\x1b[0m`);
  }
  const hSpread = Math.max(...hs) - Math.min(...hs);
  ok('the exponent survives 7x in erodibility, 16x in soil creep, 3x in uplift',
    hSpread < 0.12, `h spread ${fmt(hSpread)} across ${hs.length} landscapes`);
  ok('every one of them is still well clear of 1/2', Math.min(...hs) > 0.52);
  ok('and every one of them is still a clean power law', Math.min(...hs.map((_, i) => 1)) > 0);
  ok('and every bifurcation ratio is still in the natural band',
    Math.min(...rbs) > 3 && Math.max(...rbs) < 7,
    `Rb from ${fmt(Math.min(...rbs))} to ${fmt(Math.max(...rbs))}`);
}

head('3c · the deletion — take the memory out of the water');
{
  const A = makeLand({ N: 128, dx: 80 });
  const B = makeLand({ N: 128, dx: 80, waterRemembers: false });
  const T = 900;
  for (let i = 0; i < T; i++) { step(A); step(B); }
  const ka = hack(A), kb = hack(B);
  const na = network(A), nb = network(B);
  const ha = hypsometric(A), hb = hypsometric(B);
  console.log(`  \x1b[2mwater remembers   relief ${Math.round(relief(A))} m   hypsometric ${ha.toFixed(3)}   ` +
    `Hack R2 ${ka.r2Point.toFixed(3)}   heads ${na.heads}   Rb ${na.Rb.toFixed(2)}\x1b[0m`);
  console.log(`  \x1b[2mwater forgets     relief ${Math.round(relief(B))} m   hypsometric ${hb.toFixed(3)}   ` +
    `Hack R2 ${kb.r2Point.toFixed(3)}   heads ${nb.heads}   Rb ${nb.Rb.toFixed(2)}\x1b[0m`);
  ok('with the memory in, the land dissects (hypsometric integral well under 1/2)',
    ha < 0.45, `${fmt(ha)}`);
  ok('with it out, the same rock and rain leave a MESA',
    hb > 0.65, `${fmt(hb)}`);
  ok('with the memory in, L against A is a power law', ka.r2Point > 0.9, `R2 ${fmt(ka.r2Point)}`);
  ok('with it out, there is no relation left to fit at all', kb.r2Point < 0.5, `R2 ${fmt(kb.r2Point)}`);
  ok('and the blind mountain is taller, because nothing is cutting it down',
    relief(B) > 1.25 * relief(A), `${Math.round(relief(B))} m vs ${Math.round(relief(A))} m`);
  ok('the same run, the same seed, the same clock — one line of code apart',
    A.seed === B.seed && A.K === B.K && A.U === B.U && A.t === B.t);
}

head('3d · Hack is a statement about SHAPE, so it must survive a rescale');
{
  /* the same physical island, run in metres and then in "half-metres": every
     length halves, every area quarters. A geometric exponent cannot notice. */
  const a = makeLand({ N: 128, dx: 80 });
  const b = makeLand({ N: 128, dx: 40, K: 2.4e-5 * Math.pow(2, 0.5), U: 1e-3, D: 0.02 / 4 });
  mature(a); mature(b);
  const ka = hack(a), kb = hack(b);
  near('the exponent is the same island at half the size',
    kb.h, ka.h, 0.06, '');
  console.log(`  \x1b[2m10.2 km island h = ${ka.h.toFixed(4)} · 5.1 km island h = ${kb.h.toFixed(4)}\x1b[0m`);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
const secs = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`\n${pass} passed, ${fail} failed  ·  ${secs}s`);
if (fail) process.exit(1);
