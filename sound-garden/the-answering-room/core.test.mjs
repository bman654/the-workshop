#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   THE ANSWERING ROOM — the Node twin.   node core.test.mjs

   Nine legs. The first four are the machinery (does the lattice land where
   geometry says it lands, does the sum conserve what it should); the last five
   are the two CLAIMS the page prints, run over a grid of rooms and materials, so
   they can be caught being wrong on any run.
   ═══════════════════════════════════════════════════════════════════════════ */
import {
  C_AIR, MATERIALS, FACES, makeRoom, volume, surfaceArea, meanAlpha,
  sabineT60, eyringT60, imageAxis, foldedPath, imageSources,
  renderIR, measure, bendTest, bandFilter, decayFit, fitWindow,
  energyDecay, fitEnergyDecay,
  makeClap, makeKnock, convolve, rms,
} from './core.mjs';

const lines = [];
const T = (name, ok, detail) => { lines.push({ name, ok, detail }); };
const ALL = ['x0','x1','y0','y1','z0','z1'];
const uniform = (id) => { const m = {}; for (const f of ALL) m[f] = id; return m; };

/* ── LEG 1 — the mirror IS the fold ───────────────────────────────────────── */
{
  let worst = 0, worstFace = '', n = 0, allInside = true;
  for (const L of [[7.2,5.4,3.2],[3,3,3],[24,16,9],[2.2,1.8,2.4]]) {
    const room = makeRoom({ L });
    for (const f of FACES) {
      const p = foldedPath(room, f.id);
      const err = Math.abs(p.straight - p.folded) / p.straight;
      if (err > worst) { worst = err; worstFace = `${L.join('×')} ${f.name}`; }
      if (!p.inside) allInside = false;
      n++;
    }
  }
  T('LEG 1 — the mirror IS the fold (the identity the whole room rests on): for every first-order image in four different rooms, the STRAIGHT line from the mirror image to the ear is the same length as the FOLDED path source → wall → ear, and it crosses the wall at the same point',
    worst < 1e-12 && allInside,
    `${n} first-order images across 4 rooms · worst relative length error ${worst.toExponential(2)} (${worstFace}) · every crossing point lies inside its wall: ${allInside}`);
}

/* ── LEG 2 — the ladder's reflection counts ───────────────────────────────── */
{
  // walk the 1-D ladder by hand for a 5 m room, source at 1 m, and check the
  // Allen–Berkley wall-hit counts against a direct unfold.
  const L = 5, s = 1.0, r = 3.0;
  const lad = imageAxis(L, s, r, 26);
  const byPos = new Map(lad.map(e => [Math.round(e.p*1e6)/1e6, e]));
  const expect = [
    // [position, hits at x=0, hits at x=L]
    [ 1.0, 0, 0],   // the direct source
    [-1.0, 1, 0],   // mirrored in x=0
    [ 9.0, 0, 1],   // mirrored in x=L      (2L − s = 9)
    [11.0, 1, 1],   // in x=L then x=0      (2L + s = 11)
    [-9.0, 1, 1],   // in x=0 then x=L      (−2L + s = −9)
    [19.0, 1, 2],   // three hits           (4L − s = 19)
  ];
  let bad = [];
  for (const [p, n0, n1] of expect) {
    const e = byPos.get(p);
    if (!e || e.n0 !== n0 || e.n1 !== n1) bad.push(`${p}→${e ? `(${e.n0},${e.n1})` : 'missing'} want (${n0},${n1})`);
  }
  // and the ladder is exactly as long as the cull says it should be
  const inRange = lad.every(e => Math.abs(e.p - r) <= 26 + 1e-9);
  T('LEG 2 — the ladder counts its own walls (Allen & Berkley 1979): six hand-unfolded images of a 5 m span — the source, its two first mirrors, the two double mirrors and a triple — land at exactly the predicted coordinates with exactly the predicted hit counts at each of the two walls',
    bad.length === 0 && inRange,
    bad.length ? bad.join(' · ') : `all 6 hand-checked images match · ladder holds ${lad.length} images, every one within the 26 m cull`);
}

/* ── LEG 3 — the echo density is the room's own volume ────────────────────── */
{
  // A shoebox mirrored through itself tiles space with exactly ONE image per room
  // volume, so the count inside radius R must be (4/3)πR³ / V.
  const room = makeRoom({ L: [7.2, 5.4, 3.2] });
  const V = volume(room);
  const rows = [];
  let worst = 0;
  for (const R of [40, 80, 120]) {
    const IS = imageSources(room, { Rmax: R, maxCount: 5e6 });
    const pred = (4/3) * Math.PI * R*R*R / V;
    const err = Math.abs(IS.list.length - pred) / pred;
    if (err > worst) worst = err;
    rows.push(`R=${R} m → ${IS.list.length} mirrors, predicted ${pred.toFixed(0)} (${(err*100).toFixed(1)} %)`);
  }
  T('LEG 3 — one mirror per roomful (the density check): the mirrored tiling puts exactly one image source in every copy of the room, so the number of echoes inside radius R must be (4/3)πR³ divided by the room VOLUME — nothing else. Counted at three radii, it is',
    worst < 0.03, rows.join(' · ') + ` · worst ${(worst*100).toFixed(1)} %`);
}

/* ── LEG 4 — every echo arrives at its own distance ───────────────────────── */
{
  const room = makeRoom({ L: [6, 4.5, 3] });
  const res = renderIR(room, { sr: 48000, maxCount: 40000, order: 2 });
  // find the ten loudest early images and check the IR has a peak at each time
  const early = res.images.filter(i => i.order <= 2).sort((a,b)=>b.g[1]-a.g[1]).slice(0, 10);
  const off = [];
  for (const im of early) {
    const i = Math.round(im.t * res.sr);
    let best = 0, bestI = i;
    for (let k = i - 24; k <= i + 24; k++) {
      if (k < 0 || k >= res.ir.length) continue;
      if (Math.abs(res.ir[k]) > best) { best = Math.abs(res.ir[k]); bestI = k; }
    }
    off.push((bestI - i) / res.sr * 1000);
  }
  // The crossover has a real group delay, and it is the SAME for every tap — so it
  // shifts all ten together and cancels out of the SPACINGS. Absolute offsets are
  // allowed the filter's delay; the gaps between echoes are allowed one sample.
  const worstAbs = Math.max(...off.map(Math.abs));
  let worstGap = 0;
  for (let i = 0; i < off.length; i++) for (let j = i+1; j < off.length; j++) worstGap = Math.max(worstGap, Math.abs(off[i]-off[j]));
  T('LEG 4 — the echo you hear is the mirror you see (the timing check): the rendered impulse response peaks at exactly distance ÷ 343 m/s for the ten loudest low-order images. The 3-way crossover delays every tap by the same ≈0.5 ms, so the test is run twice: absolute arrivals inside that delay, and the GAPS between echoes — where the filter cancels — inside one sample',
    worstAbs <= 0.75 && worstGap <= 0.05,
    `10 images · worst absolute offset ${worstAbs.toFixed(3)} ms (crossover group delay) · worst gap error ${worstGap.toFixed(4)} ms = ${(worstGap*48).toFixed(2)} samples`);
}

/* ── LEG 5 — the DC block earns its place ─────────────────────────────────── */
{
  // Without it, a rigid box's zero-frequency mode makes the buffer GAIN energy.
  const room = makeRoom({ mats: uniform('plaster') });
  const res = renderIR(room, { sr: 48000, maxCount: 250000 });
  const W = fitWindow(room, res.tMax);
  const withBlock = decayFit(bandFilter(res.raw[1], res.sr, 1), res.sr, W.t0, W.t1);
  // rebuild the same sum with no filtering at all, straight from the image list
  const n = res.raw[1].length, naked = new Float32Array(n);
  for (const im of res.images) {
    const x = im.d / C_AIR * res.sr, i0 = Math.floor(x), fr = x - i0;
    if (i0 < 0 || i0 + 1 >= n) continue;
    naked[i0] += im.g[1] * (1 - fr); naked[i0+1] += im.g[1] * fr;
  }
  const nakedFit = decayFit(naked, res.sr, W.t0, W.t1);
  T('LEG 5 — the DC block is not a fudge (the neg-control): summed raw, every one of these mirrors is POSITIVE, so by half a second they land thirty to a sample and add to thirty times one — the unfiltered buffer GAINS energy as the room decays. That is the box\'s zero-frequency mode, which nothing emits and no microphone hears. Cut below 25 Hz and the slope becomes a decay',
    nakedFit.slope > 0 && withBlock.slope < 0,
    `unfiltered slope ${nakedFit.slope.toFixed(1)} dB/s (energy from nowhere) → mid band after the block ${withBlock.slope.toFixed(1)} dB/s, r² ${withBlock.r2.toFixed(3)}`);
}

/* ── LEG 6 — THE BEND (claim 1) ───────────────────────────────────────────── */
{
  const rooms = [
    ['7.2×5.4×3.2 plaster',  makeRoom({ mats: uniform('plaster') })],
    ['7.2×5.4×3.2 wood',     makeRoom({ mats: uniform('wood') })],
    ['7.2×5.4×3.2 carpet',   makeRoom({ mats: uniform('carpet') })],
    ['7.2×5.4×3.2 curtain',  makeRoom({ mats: uniform('curtain') })],
    ['7.2×5.4×3.2 foam',     makeRoom({ mats: uniform('foam') })],
    ['24×16×9 hall',         makeRoom({ L: [24,16,9], mats: uniform('plaster') })],
    ['2.2×1.8×2.4 bathroom', makeRoom({ L: [2.2,1.8,2.4], mats: uniform('glass') })],
    ['mixed: dead walls, hard ceiling', makeRoom({ mats: { x0:'audience',x1:'audience',y0:'audience',y1:'audience',z0:'carpet',z1:'plaster' } })],
  ];
  const rows = [], mute = []; let allBend = true, lo = Infinity, hi = -Infinity, judged = 0;
  for (const [name, room] of rooms) {
    const res = renderIR(room, { sr: 48000, maxCount: 600000 });
    const B = bendTest(res, room, 1);
    /* THE ABSTENTION, and it is the point of the leg as much as the verdict.
       ISO 3382 refuses to name a decay time unless the response falls 25 dB; so does
       this. Three of these rooms are so live that 600 000 mirrors only cover 7–16 dB
       of their decay, and a slope fitted to that is a slope fitted to noise (r² 0.4).
       They get NO verdict — not a lenient one. The claim is made only where the
       measurement can carry it, and it is made about every room where it can. */
    if (!B.resolvable) { mute.push(`${name}: ABSTAINS — only ${B.dropDb.toFixed(0)} dB of decay inside the budget (needs 25)`); continue; }
    judged++;
    if (!(B.bend > 1.05)) allBend = false;
    lo = Math.min(lo, B.bend); hi = Math.max(hi, B.bend);
    rows.push(`${name}: early ${B.early.t60.toFixed(2)} s → late ${B.late.t60.toFixed(2)} s (×${B.bend.toFixed(2)}, ${B.dropDb.toFixed(0)} dB, r² ${B.early.r2.toFixed(2)}/${B.late.r2.toFixed(2)})`);
  }
  T('LEG 6 — THE TAIL ALWAYS BENDS FLATTER (claim 1, the one the page prints): fit the early half of the mid-band decay and the late half separately, and the late one is ALWAYS the longer — in every room where the measurement is admissible at all, spanning a foam cell to a plaster hall. Late sound is the sound that got lucky: the paths still going are the ones that happened to hit fewer walls than average. Sabine and Eyring are each a single straight line and have no bend to give',
    allBend && judged >= 5, `${judged}/${judged} admissible rooms bend flatter, ×${lo.toFixed(2)} to ×${hi.toFixed(2)} · ` + rows.join(' · ') + (mute.length ? ' ‖ ' + mute.join(' · ') : ''));
}

/* ── LEG 7 — Eyring is right where it was derived (claim 2a) ──────────────── */
{
  /* Measured on the GEOMETRIC decay — Σg² binned by arrival time, with no buffer and
     no filter anywhere in it. That is exactly the quantity Eyring's derivation is
     about, and unlike the rendered response it carries no interference noise, so it
     fits cleanly (r² > 0.97) even in a live room whose decay the affordable mirrors
     can only follow for seven decibels. */
  const rows = []; let worst = 0, worstR2 = 1;
  for (const id of ['plaster','brick','glass','wood']) {     // ᾱ ≤ 0.1 — a live room
    const room = makeRoom({ mats: uniform(id) });
    const res = renderIR(room, { sr: 48000, maxCount: 600000 });
    const W = fitWindow(room, res.tMax);
    const F = fitEnergyDecay(energyDecay(res.images, 1, 5), W.t0, W.t1);
    const e = eyringT60(room, 1), abar = meanAlpha(room, 1).abar;
    const ratio = F.t60 / e;
    worst = Math.max(worst, Math.abs(ratio - 1));
    worstR2 = Math.min(worstR2, F.r2);
    rows.push(`${id} (ᾱ=${abar.toFixed(2)}): mirrors ${F.t60.toFixed(2)} s vs Eyring ${e.toFixed(2)} s → ×${ratio.toFixed(2)} (r² ${F.r2.toFixed(3)})`);
  }
  T('LEG 7 — Eyring holds where Eyring was derived (claim 2a): in a LIVE room (mean absorption ≤ 0.1) the energy the mirrors deliver falls at within 15 % of the rate Eyring\'s formula predicts. Eyring got there by assuming a perfectly diffuse field; the lattice has no such assumption anywhere in it — only straight lines and wall counts. Two unrelated derivations, one number',
    worst <= 0.15 && worstR2 >= 0.95, `worst departure ${(worst*100).toFixed(0)} %, worst fit r² ${worstR2.toFixed(3)} · ` + rows.join(' · '));
}

/* ── LEG 8 — and wrong where it wasn't (claim 2b) ─────────────────────────── */
{
  const rows = []; let mono = true, prev = 0; let D = null;
  for (const id of ['plaster','wood','carpet','curtain','audience','foam']) {
    const room = makeRoom({ mats: uniform(id) });
    const res = renderIR(room, { sr: 48000, maxCount: 600000 });
    const W = fitWindow(room, res.tMax);
    const F = fitEnergyDecay(energyDecay(res.images, 1, 5), W.t0, W.t1);
    const e = eyringT60(room, 1), s = sabineT60(room, 1), abar = meanAlpha(room, 1).abar;
    const ratio = F.t60 / e;
    if (ratio < prev - 0.06) mono = false;                 // must not fall as abar climbs
    prev = ratio;
    rows.push(`abar=${abar.toFixed(2)} -> x${ratio.toFixed(2)}`);
    if (id === 'foam') D = { t60: F.t60, eyring: e, sabine: s };
  }
  T('LEG 8 — and wrong where it wasn\'t (claim 2b): walk the walls from plaster to acoustic foam and the mirrors pull steadily AWAY from Eyring, because a dead room has no diffuse field to be right about. In the foam cell the lattice rings 1.5–2× longer than Eyring says — and SHORTER than Sabine, so the two textbook laws now bracket the truth from opposite sides',
    mono && D.t60 > D.eyring * 1.4 && D.t60 < D.sabine,
    rows.join(' · ') + ` · foam cell: Eyring ${D.eyring.toFixed(3)} s < mirrors ${D.t60.toFixed(3)} s < Sabine ${D.sabine.toFixed(3)} s`);
}

/* ── LEG 9 — the room actually does something to a sound ──────────────────── */
{
  const live = makeRoom({ mats: uniform('plaster') });
  const dead = makeRoom({ mats: uniform('foam') });
  const clap = makeClap(48000, 7);
  const rows = [];
  const tails = [];
  for (const [name, room] of [['plaster', live], ['foam', dead]]) {
    const res = renderIR(room, { sr: 48000, maxCount: 120000 });
    const wet = convolve(clap, res.ir);
    // energy still present 200 ms after the clap has finished
    const i0 = Math.round(0.2 * 48000);
    const tail = rms(wet.subarray(i0, Math.min(wet.length, i0 + 4800)));
    const head = rms(wet.subarray(0, 2400));
    tails.push(tail / head);
    rows.push(`${name}: tail/head ${(20*Math.log10(tail/head)).toFixed(1)} dB`);
  }
  const clean = Number.isFinite(rms(convolve(clap, renderIR(live, {sr:48000, maxCount:60000}).ir)));
  T('LEG 9 — and it is audibly a room (the end-to-end check): convolve one dry 90 ms clap with each response and 200 ms later the plaster box is still ringing more than 20 dB above the foam cell. The whole chain — mirrors, bands, crossover, convolution — is finite and does the one thing a room does',
    clean && 20*Math.log10(tails[0]/tails[1]) > 20,
    rows.join(' · ') + ` · plaster stands ${(20*Math.log10(tails[0]/tails[1])).toFixed(1)} dB above foam at t = 200 ms`);
}

/* ── report ──────────────────────────────────────────────────────────────── */
let pass = 0;
for (const l of lines) {
  console.log(`${l.ok ? ' ok ' : 'FAIL'}  ${l.name}`);
  console.log(`      ${l.detail}`);
  if (l.ok) pass++;
}
console.log(`\n${pass}/${lines.length} legs pass`);
process.exit(pass === lines.length ? 0 : 1);
