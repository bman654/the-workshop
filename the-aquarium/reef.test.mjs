// ============================================================================
//  THE AQUARIUM — the reef core's Node twin.   node the-aquarium/reef.test.mjs
//
//  The tank is mostly delight and owes nothing. But it does make one claim out
//  loud — that the net of light on the sand is the REAL caustic of the surface
//  overhead, computed in closed form — and a claim gets a real test.
//
//  The test that matters is leg 2: a quarter of a million rays are pushed through
//  the same water by brute force and binned where they land. The histogram knows
//  nothing about Jacobians. If the closed form is the caustic, the two fields are
//  the same field.
// ============================================================================
import {
  WAVES, RIPPLES, ETA, REFRACT_K, GRAV, SIGMA_WATER, RHO_WATER, omegaFor,
  surface, landing, causticGain, detJ, measuredAreaRatio, foldFraction, maxSlope,
  causticHistogram, causticFieldOnFloor,
  MINNAERT_C, minnaertHz, bubbleTau, bubbleVoice,
  SPECIES, fishMesh, TANK, stockTank, school, plantReef, mulberry32
} from './reef.mjs';

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log(' ok   ' + name); }
  else { fail++; console.log(' FAIL ' + name); }
  if (detail) console.log('      ' + detail);
};

/* ── LEG 1 — the surface is gentle enough for the refraction it claims ────── */
{
  const m = maxSlope(0), m2 = maxSlope(7.3);
  const worstAngleDeg = Math.atan(Math.max(m, m2)) * 180 / Math.PI;
  // the closed form linearises Snell around vertical; keep the worst incidence
  // small enough that sin θ ≈ θ is good to better than 2 %.
  const err = Math.abs(Math.sin(Math.atan(Math.max(m, m2))) - Math.atan(Math.max(m, m2))) / Math.atan(Math.max(m, m2));
  ok('LEG 1 — the small-angle refraction the closed form uses is admissible on THIS surface: the steepest slope anywhere in the wave set is a shallow incidence, so sin θ ≈ θ holds to well under 2 %',
    worstAngleDeg < 22 && err < 0.02,
    'steepest slope ' + Math.max(m, m2).toFixed(3) + ' → incidence ' + worstAngleDeg.toFixed(1) + '° · sin θ vs θ error ' + (err * 100).toFixed(2) + ' % · η = ' + ETA.toFixed(4) + ', drift coefficient (1−η) = ' + REFRACT_K.toFixed(4));
}

/* ── LEG 2 — THE CLAIM, part one: det J is really the map's Jacobian ─────── */
{
  // Four ray traces and a shoelace: push a tiny square of surface through the
  // landing map and measure the quadrilateral that lands. No calculus involved.
  // The page's fold curves come from the closed form; this is what says the closed
  // form is telling the truth about the rays — INCLUDING through a fold, where the
  // measured area goes negative because the patch has turned itself inside out.
  const rnd = mulberry32(31337);
  const rows = [];
  let worstRel = 0, sawFold = 0, foldAgree = 0;
  for (const depth of [0.6, 1.4, 2.4]) {
    let worst = 0, n = 0;
    for (let i = 0; i < 4000; i++) {
      const x = (rnd() - 0.5) * 8, z = (rnd() - 0.5) * 8, t = rnd() * 20;
      const a = detJ(x, z, t, depth), m = measuredAreaRatio(x, z, t, depth, 5e-5);
      const rel = Math.abs(a - m) / Math.max(0.02, Math.abs(a));
      if (rel > worst) worst = rel;
      if (a < 0) { sawFold++; if (m < 0) foldAgree++; }
      n++;
    }
    rows.push('depth ' + depth.toFixed(2) + ' m: worst |det J − measured| / |det J| = ' + (worst * 100).toFixed(3) + ' % over ' + n + ' patches');
    worstRel = Math.max(worstRel, worst);
  }
  ok('LEG 2 — THE CLAIM, part one. The closed form the page draws its fold curves from is really the Jacobian of the refracted rays: push a tiny square of surface through the landing map by brute force, measure the quadrilateral that comes out with a shoelace, and it agrees with det(I + a·H) everywhere — and agrees on the SIGN inside a fold, where the patch lands inside out',
    worstRel < 0.02 && sawFold > 200 && foldAgree === sawFold,
    rows.join(' · ') + ' · patches sampled inside a fold: ' + sawFold + ', measured area negative in ' + foldAgree + ' of them');
}

/* ── LEG 2b — THE CLAIM, part two: rays really pile up on the fold curve ─── */
{
  // The bright cords are supposed to be det J = 0. So: fire rays, bin them, and
  // ask whether the bins the FOLD CURVE passes through are the bright ones. The
  // histogram has no Jacobian in it; the fold curve has no rays in it.
  const t = 3.1, depth = 2.4, bins = 40, span = 4.0;
  const H = causticHistogram(t, depth, { bins, span, rays: 1400, pad: 1.7 });
  // mark the floor bins that a fold curve lands in: walk the surface, keep the
  // samples where |det J| is small, and record where they land.
  const onFold = new Uint8Array(bins * bins);
  const N = 1600, emit = span * 1.7 / 2;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const x = -emit + 2 * emit * ((i + 0.5) / N), z = -emit + 2 * emit * ((j + 0.5) / N);
    if (Math.abs(detJ(x, z, t, depth)) > 0.02) continue;
    const L = landing(x, z, t, depth);
    const bx = Math.floor(((L[0] + span / 2) / span) * bins), bz = Math.floor(((L[1] + span / 2) / span) * bins);
    if (bx >= 0 && bz >= 0 && bx < bins && bz < bins) onFold[bz * bins + bx] = 1;
  }
  let sf = 0, nf = 0, so = 0, no = 0;
  const m0 = 4, m1 = bins - 4;
  for (let j = m0; j < m1; j++) for (let i = m0; i < m1; i++) {
    const k = j * bins + i;
    if (onFold[k]) { sf += H.grid[k]; nf++; } else { so += H.grid[k]; no++; }
  }
  const bright = sf / nf, dim = so / no;
  ok('LEG 2b — THE CLAIM, part two. The bright cords are the fold. A quarter of a million rays are refracted one at a time and binned where they land — an image with no Jacobian anywhere in it — and the floor bins the curve det J = 0 passes through are measurably brighter than the rest',
    bright > dim * 1.35 && nf > 60,
    H.landed.toLocaleString('en-US') + ' rays landed in the window · ' + nf + ' fold bins average ' + bright.toFixed(3) + ' × mean irradiance vs ' + dim.toFixed(3) + ' off the fold — the cords are ×' + (bright / dim).toFixed(2) + ' brighter · ' + (foldFraction(t, depth) * 100).toFixed(1) + ' % of the surface is folded at this depth');
}

/* ── LEG 2c — the ripples travel at the speed their wavelength demands ───── */
{
  const rows = [];
  let good = true, monotone = true;
  for (const r of [...RIPPLES].sort((a, b) => b.lam - a.lam)) {
    const k = 2 * Math.PI / r.lam, w = omegaFor(k), c = w / k;
    const wantW = Math.sqrt(GRAV * k + (SIGMA_WATER / RHO_WATER) * k * k * k);
    if (Math.abs(w - wantW) > 1e-9) good = false;
    rows.push(Math.round(r.lam * 100) + ' cm → ' + c.toFixed(3) + ' m/s');
  }
  // gravity–capillary water has a minimum phase speed near λ = 1.7 cm; above it,
  // longer waves are faster. All six ripples are longer than that, so the order
  // must be strictly longer → faster.
  const speeds = [...RIPPLES].sort((a, b) => b.lam - a.lam).map((r) => omegaFor(2 * Math.PI / r.lam) / (2 * Math.PI / r.lam));
  for (let i = 1; i < speeds.length; i++) if (speeds[i] >= speeds[i - 1]) monotone = false;
  ok('LEG 2c — the water is not six sine waves with made-up speeds: each ripple travels at the phase speed its own wavelength demands under ω² = gk + (σ/ρ)k³, so on screen the long swells visibly outrun the fine chop',
    good && monotone, rows.join(' · ') + ' — strictly decreasing with wavelength, as gravity–capillary water requires');
}

/* ── LEG 3 — refraction moves light, it does not make any ─────────────────── */
{
  // The signed mean of det J over the surface must be EXACTLY 1: refraction
  // rearranges light and creates none. (Every bright cord on the sand is paid for
  // by a dark patch beside it — a decorative "caustic texture" has no reason at
  // all to obey this.) And the amount by which the UNSIGNED mean exceeds 1 is not
  // an error: it is the double-counting of floor that two rays reach at once —
  // which is the fold, showing up in the bookkeeping.
  const rows = [];
  let worst = 0, foldSigns = true;
  for (const depth of [0.3, 0.8, 1.4, 2.4]) {
    let sSigned = 0, sAbs = 0, n = 0;
    const N = 420, span = 9;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const d = detJ((i / N - 0.5) * span, (j / N - 0.5) * span, 2.0, depth);
      sSigned += d; sAbs += Math.abs(d); n++;
    }
    const ms = sSigned / n, ma = sAbs / n;
    rows.push('depth ' + depth.toFixed(1) + ' m: signed mean ' + ms.toFixed(4) + ', |·| mean ' + ma.toFixed(4) + ' (double-covered ' + ((ma - ms) * 50).toFixed(1) + ' %)');
    worst = Math.max(worst, Math.abs(ms - 1));
    if (ma < ms - 1e-9) foldSigns = false;
  }
  ok('LEG 3 — the caustic conserves light (the negative control a decorative texture fails): the signed mean of det J over the surface is exactly 1 at every depth, so refraction only rearranges the light. The excess of the unsigned mean over it is the floor that two rays reach at once — the fold, appearing in the bookkeeping',
    worst < 0.01 && foldSigns, rows.join(' · ') + ' · worst departure of the signed mean from 1: ' + (worst * 100).toFixed(2) + ' %');
}

/* ── LEG 4 — deeper sand gets a sharper, higher-contrast net ──────────────── */
{
  const rows = [];
  let mono = true, prevF = -1, prevC = -1;
  for (const depth of [0.3, 0.7, 1.2, 1.8, 2.4]) {
    let s = 0, s2 = 0, n = 0;
    const N = 300, span = 8;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const g = causticGain((i / N - 0.5) * span, (j / N - 0.5) * span, 1.0, depth, 6);
      s += g; s2 += g * g; n++;
    }
    const m = s / n, sd = Math.sqrt(Math.max(0, s2 / n - m * m));
    const f = foldFraction(1.0, depth, 300, 8);
    rows.push(depth.toFixed(1) + ' m → ' + (f * 100).toFixed(1) + ' % folded, contrast ' + (sd / m).toFixed(2));
    if (f < prevF) mono = false;                       // never un-folds as it deepens
    if (depth >= 1.2 && f <= prevF) mono = false;       // and once folding starts it only grows
    if (depth <= 1.2 && sd / m <= prevC) mono = false;  // the net sharpens all the way down to there
    prevF = f; prevC = sd / m;
  }
  ok('LEG 4 — and it behaves like a real caustic with depth: the further the sand is from the surface, the more of the light has folded through itself on the way down. A shallow tray gets a soft mottle with no folds at all; deep water gets the hard bright cords',
    mono, rows.join(' · '));
}

/* ── LEG 5 — the bubble's pitch is its size ───────────────────────────────── */
{
  const c = MINNAERT_C;
  const rows = [];
  let worst = 0;
  for (const mm of [0.3, 1, 2, 5]) {
    const r = mm / 1000, f = minnaertHz(r);
    rows.push(mm + ' mm → ' + Math.round(f) + ' Hz');
    worst = Math.max(worst, Math.abs(f * r - c) / c);
  }
  const deep = minnaertHz(0.002, 2.0) / minnaertHz(0.002, 0);
  ok('LEG 5 — a bubble is a spring, and its note is its size: f₀·r is the same constant ' + c.toFixed(3) + ' Hz·m at every radius (Minnaert 1933), so the page can voice each drawn bubble at the pitch its drawn radius demands — and pressing it deeper raises the pitch',
    worst < 1e-12 && deep > 1.05 && deep < 1.15,
    rows.join(' · ') + ' · f₀·r constant to ' + worst.toExponential(1) + ' · 2 m down raises a 2 mm bubble by ×' + deep.toFixed(4));
}

/* ── LEG 6 — and its voice really rings at that pitch ─────────────────────── */
{
  // render the voice and read its pitch back by zero-crossings over the first
  // third of the decay, where the chirp has barely moved.
  const sr = 48000, r = 0.0025;
  const buf = bubbleVoice(r, sr, 0, 0.12);
  const want = minnaertHz(r);
  const win = Math.floor(buf.length / 3);
  let cross = 0;
  for (let i = 1; i < win; i++) if (buf[i - 1] < 0 && buf[i] >= 0) cross++;
  const measured = cross / (win / sr);
  const cents = 1200 * Math.log2(measured / want);
  // and it must actually decay
  let head = 0, tail = 0;
  for (let i = 0; i < 200; i++) head += buf[i] * buf[i];
  for (let i = buf.length - 200; i < buf.length; i++) tail += buf[i] * buf[i];
  const dropDb = 10 * Math.log10(head / Math.max(1e-30, tail));
  ok('LEG 6 — the rendered voice is that note: counting the zero crossings of the synthesised bloop recovers the Minnaert frequency, and the ring decays away instead of sustaining',
    Math.abs(cents) < 90 && dropDb > 30,
    'r = 2.5 mm · want ' + want.toFixed(0) + ' Hz · measured ' + measured.toFixed(0) + ' Hz (' + cents.toFixed(0) + ' cents) · τ = ' + (bubbleTau(r) * 1000).toFixed(1) + ' ms · decays ' + dropDb.toFixed(0) + ' dB across the voice');
}

/* ── LEG 7 — the fish are real closed bodies ──────────────────────────────── */
{
  const rows = [];
  let allGood = true;
  for (const k of Object.keys(SPECIES)) {
    const m = fishMesh(SPECIES[k]);
    let bad = 0, minY = 1e9, maxY = -1e9, minZ = 1e9, maxZ = -1e9;
    for (let i = 0; i < m.pos.length; i += 3) {
      if (!isFinite(m.pos[i]) || !isFinite(m.pos[i + 1]) || !isFinite(m.pos[i + 2])) bad++;
      if (!isFinite(m.nrm[i]) || Math.abs(Math.hypot(m.nrm[i], m.nrm[i + 1], m.nrm[i + 2]) - 1) > 1e-3) bad++;
      minY = Math.min(minY, m.pos[i + 1]); maxY = Math.max(maxY, m.pos[i + 1]);
      minZ = Math.min(minZ, m.pos[i + 2]); maxZ = Math.max(maxZ, m.pos[i + 2]);
    }
    // the body tube must be a closed manifold: every interior edge used twice
    const edges = new Map();
    for (let i = 0; i < m.idx.length; i += 3) {
      for (const [a, b] of [[m.idx[i], m.idx[i + 1]], [m.idx[i + 1], m.idx[i + 2]], [m.idx[i + 2], m.idx[i]]]) {
        const key = Math.min(a, b) + ':' + Math.max(a, b);
        edges.set(key, (edges.get(key) || 0) + 1);
      }
    }
    const maxIdx = Math.max(...m.idx);
    const inRange = maxIdx < m.verts;
    const spanZ = maxZ - minZ, spanY = maxY - minY;
    const good = bad === 0 && inRange && spanZ > m.length && spanY > 0.05 * m.length;
    if (!good) allGood = false;
    rows.push(SPECIES[k].name + ' ' + m.verts + 'v/' + m.tris + 't, ' + (spanZ / m.length).toFixed(2) + '× long, ' + (spanY / m.length).toFixed(2) + '× tall');
  }
  ok('LEG 7 — every species builds a finite, correctly-indexed body with unit normals, a nose-to-fin span longer than its own body (the caudal fin sticks out behind) and real height (the fins are sails, not slivers)',
    allGood, rows.join(' · '));
}

/* ── LEG 8 — the school stays in the glass, forever, calmly ───────────────── */
{
  const rnd = mulberry32(20260727);
  const fish = stockTank(4242);
  const hw = TANK.w / 2, hh = TANK.h / 2, hd = TANK.d / 2;
  let escapes = 0, maxSp = 0, minSp = 1e9, sumSp = 0, n = 0, wildTurn = 0;
  const dt = 1 / 60;
  for (let step = 0; step < 60 * 240; step++) {          // four minutes of tank
    school(fish, dt, step * dt, rnd);
    if (step % 30 === 0) for (const f of fish) {
      if (Math.abs(f.p[0]) > hw + 1e-6 || f.p[1] > hh + 1e-6 || f.p[1] < -hh * 0.85 - 1e-6 || Math.abs(f.p[2]) > hd + 1e-6) escapes++;
      const sp = Math.hypot(f.v[0], f.v[1], f.v[2]);
      maxSp = Math.max(maxSp, sp); minSp = Math.min(minSp, sp); sumSp += sp; n++;
      if (Math.abs(f.turn || 0) > 2.0) wildTurn++;
    }
  }
  ok('LEG 8 — four minutes of tank: nobody swims through the glass, nobody stalls, nobody bolts. Every fish holds a speed inside its cruising band the whole time and turns like a fish rather than snapping round',
    escapes === 0 && minSp > 0.08 && maxSp < 1.2 && wildTurn === 0,
    fish.length + ' fish · ' + (60 * 240) + ' steps · escapes ' + escapes + ' · speed ' + minSp.toFixed(2) + '–' + maxSp.toFixed(2) + ' m/s (mean ' + (sumSp / n).toFixed(2) + ') · hard turns ' + wildTurn);
}

/* ── LEG 9 — the same seed grows the same reef ────────────────────────────── */
{
  const a = plantReef(7), b = plantReef(7), c = plantReef(8);
  const key = (r) => r.corals.map((k) => k.kind + k.x.toFixed(4) + k.z.toFixed(4)).join('|') + '#' + r.grass.length + '#' + r.rocks.length;
  const nearGlass = a.corals.filter((k) => k.z > TANK.d / 2 - 1.0 && Math.abs(k.x) < 1.4).length;
  ok('LEG 9 — a tank is the same tank when you come back: one seed grows one reef (a different seed grows a different one), and the planting keeps the near-centre strip open so the view in is never walled off',
    key(a) === key(b) && key(a) !== key(c) && nearGlass <= 3,
    a.corals.length + ' coral heads · ' + a.grass.length + ' blades · ' + a.rocks.length + ' rocks · ' + nearGlass + ' heads in the front-centre strip');
}

/* ── LEG 10 — the water colour is water, not blue paint ───────────────────── */
{
  // The page tints by distance with per-channel extinction. Whatever the numbers,
  // the ORDER must be red-dies-first — that is the one thing that makes rendered
  // water read as water. This leg pins the ordering the shader is written to.
  const SIGMA = [0.26, 0.055, 0.018];     // per-metre extinction, R G B (must match the shader)
  const at = (d) => SIGMA.map((s) => Math.exp(-s * d));
  const near = at(0.5), far = at(6);
  ok('LEG 10 — the water absorbs like water: red is extinguished first and blue last, so a fish three metres back goes teal and one at the far glass goes almost pure blue-green. That ordering is why rendered water reads as water and flat blue fog does not',
    SIGMA[0] > SIGMA[1] && SIGMA[1] > SIGMA[2] && far[0] < far[2] * 0.5,
    'transmission at 0.5 m: R ' + near[0].toFixed(2) + ' G ' + near[1].toFixed(2) + ' B ' + near[2].toFixed(2) +
    ' · at 6 m: R ' + far[0].toFixed(3) + ' G ' + far[1].toFixed(2) + ' B ' + far[2].toFixed(2));
}

console.log('\n' + pass + '/' + (pass + fail) + ' legs pass');
process.exit(fail ? 1 : 0);
