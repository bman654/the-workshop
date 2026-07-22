/* ═══════════════════════════════════════════════════════════════════════════
   THE UMBRAL VAULT — the six aperture drivers.

   The honest inversion of the Spin Cabinet. There, six objects each cast a
   SHADOW onto a shelf; here, six recessed apertures each THROW light onto the
   dark of the apse, and the room is lit by nothing but its own throws. Where two
   throws graze the shared wall they OVERLAP and MIX — the kinship of light made
   visible — and one dragged SUN re-aims every sun-coupled aperture at once,
   because these rooms are all children of one parent: what the sun does to light.

   ── ONE SOURCE OF TRUTH, TWO CONSUMERS ─────────────────────────────────────
   Each aperture is a FACTORY that takes its room's SHIPPED core module:

     Node   →  makePool(await import('../pool/core.mjs'))
     Page   →  makePool(CORE.pool)          // the same file, forge-inlined

   so apertures.test.mjs drives EXACTLY the physics the wall renders. No aperture
   hand-rolls a fake optic: every number that decides what the light DOES comes
   out of its room's own core (the caustic's fold, the cusp count, the Fermat
   path, the turning ray, the airmass spectrum, the redshift).

   ── THE HONESTY DISCIPLINE (the sun → core mapping, named in three tiers) ───
   Every sun→core mapping is DECLARED on the aperture as `tier` + `adapterNote`,
   the way the Spin Cabinet's panels named their BLEED:

     TIER A · native   — the sun IS the core's honest input (pool illumination
                         angle, mirage grazing angle, sky airmass).
     TIER B · adapter  — a NAMED staging map the maker owns (teacup sun-elevation
                         → source-distance; refraction sun-position → entry x).
                         The adapter is mine; the physics that decides what the
                         light does still comes only from the room's core.
     TIER C · decoupled— honestly NOT sun-coupled (first-light runs its own clock).

   PANEL/CLOCK TIME IS NOT ROOM TIME. The mappings and the coast rates are the
   maker's, named here and kept OFF the visitor's wall. Read the physics in the
   room; read the family bond here.

   ── WHAT AN APERTURE IS ────────────────────────────────────────────────────
     { id, label, href, hint, character, tier, adapterNote,
       pos,                    // {x,y,r} normalized apse-wall placement + throw reach
       st,                     // the live state (the twin diffs castState())
       aim(sun),               // re-aim from the shared sun {azimuth,elevation}
       step(dt, sun),          // advance by dt wall-seconds, reading the sun each step
       alive(),                // is this throw actively animating?
       settle(sun),            // pose a STILL cast frame (reduced motion / golden hour)
       castState(),            // a small snapshot of the cast (the twin asserts it MOVES)
       payoff(),               // has this aperture's named payoff FIRED?
       tint(),                 // sky ONLY: the room's shared ambient light {r,g,b} | null
       drawThrow(g, geom, tint),// canvas: the light thrown on the wall (never in Node)
       drawRecess(g, geom) }   // canvas: the aperture opening        (never in Node)
   ═══════════════════════════════════════════════════════════════════════════ */

const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

/* ─── THE SUN, AS THE VAULT READS IT ─────────────────────────────────────────
   The one gesture: a sun dragged along a sky-slot. Its slot position is a
   time-of-day t ∈ [0,1] → { azimuth ∈ [-1,1], elevation ∈ [0,1] }. Noon (t=½)
   stands the sun at the zenith (elevation 1); the two ends are the horizons
   (elevation 0). dawn → noon → dusk in one sweep. */
export function sunFromT(t) {
  t = clamp(t, 0, 1);
  return { t, azimuth: 2 * t - 1, elevation: Math.sin(Math.PI * t) };
}
export const GOLDEN_T = 0.155;          // the posed golden-hour sun (low, warm)

/* ─── WAVELENGTH → LINEAR RGB (shared) ───────────────────────────────────────
   A compact CIE-ish visible-spectrum map, 380–700 nm → [r,g,b] in 0..1. Used to
   colour the sky wash, the redshifting galaxies, and to warm every throw. It is
   a RENDER helper (no claim rides on the exact hue), documented as illustrative. */
export function nmToRGB(nm) {
  let r = 0, g = 0, b = 0;
  if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else if (nm <= 700) { r = 1; }
  else { r = 1; }
  if (nm < 380) { r = 0.30; b = 0.35; }
  // a gentle gamma so mid-band greens don't blow out on the dark wall
  const f = 0.85;
  return [Math.pow(clamp(r, 0, 1), f), Math.pow(clamp(g, 0, 1), f), Math.pow(clamp(b, 0, 1), f)];
}
const rgbStr = (c, a = 1) =>
  `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;
// tint two lights together (the throw's own colour warmed by the room's ambient)
const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

/* a soft radial falloff mask, reused by every throw so the light fades into the
   dark instead of ending at a hard disc edge. */
function throwGrad(g, cx, cy, R, stops) {
  const gr = g.createRadialGradient(cx, cy, R * 0.04, cx, cy, R);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  return gr;
}

/* ═══ 1. THE POOL — a live NET of light on the wall ═══════════════════════════
   Core: ../pool/core.mjs. The sun's dapple net cast through a rippling surface:
   brightnessAt = 1/|det J| of the room's landing map, and the caustic filaments
   are the fold set det J = 0 (foldContour). TIER A — the sun's illumination angle
   IS the core's own `sunTilt` (its honest input). STAGING (mine): the idle
   shimmer keeps the surface breathing; the brightness grid is CAPPED for perf. */
export function makePool(POOL) {
  const GRID = 22;                    // capped brightness grid (perf) — MINE
  const surf = POOL.makeSurface({ L: 1, seed: 0x51a7c3d1, idleAmp: 0.05, shimmerCount: 3 });
  let p = POOL.makeParams(surf, { sunTilt: 0, jacEps: 2e-4 });
  return {
    id: 'pool', label: 'The Pool That Dances', href: '../pool/index.html',
    tier: 'A · native',
    adapterNote: 'sun elevation → surface illumination angle (the core\'s own sunTilt); NATIVE',
    hint: 'the sun\'s net, refracted',
    character: 'the sun, folded through moving water — its net knots into bright caustic seams',
    pos: { x: 0.11, y: 0.50, r: 0.14 },
    st: { tilt: 0, tPool: 0, field: null, fieldMax: 1, causticN: 0, sawCaustic: false, sawChange: false, lastSum: -1 },
    aim(sun) {
      const s = this.st;
      const tilt = (1 - sun.elevation) * 0.52;  // zenith → straight down; low sun → grazing
      // a live ripple only when the sun really moved, so a drag doesn't spam wavelets
      if (Math.abs(tilt - s.tilt) > 0.02) surf.add('ripple', { cx: sun.azimuth * 0.4, cy: -0.1, sigma: 0.32, Astar: 0.10, omega: 5.5 });
      s.tilt = tilt; p.sunTilt = tilt;
      this._recompute();
    },
    _recompute() {
      const s = this.st, N = GRID, fld = new Float32Array(N * N);
      let mx = 1e-6, sum = 0;
      for (let iy = 0; iy < N; iy++) {
        const y = -1 + (iy + 0.5) * (2 / N);
        for (let ix = 0; ix < N; ix++) {
          const x = -1 + (ix + 0.5) * (2 / N);
          const b = POOL.brightnessAt(x, y, p);         // ← 1/|det J|, the room's optic
          fld[iy * N + ix] = b; if (b > mx) mx = b; sum += b;
        }
      }
      s.field = fld; s.fieldMax = mx; s.fieldMean = sum / (N * N);
    },
    step(dt) {
      const s = this.st;
      surf.step(dt); s.tPool = surf.time;
      this._recompute();                                 // the net breathes with the shimmer
      const sum = s.fieldMax;
      if (s.lastSum >= 0 && Math.abs(sum - s.lastSum) > 1e-4) s.sawChange = true;
      s.lastSum = sum;
      if (s.fieldMax > 6) s.sawCaustic = true;           // a real focus formed (compression ≫ 1)
    },
    alive() { return true; },                            // the shimmer never sleeps
    settle(sun) { this.aim(sun); const c = POOL.foldContour(p, 40); this.st.causticN = c.length; },
    // THE PAYOFF: the net really KNOTS into a caustic (the fold set det J=0 is
    // non-empty — a bright focus with compression well above 1) and it re-knots
    // as the surface and the sun move.
    payoff() { return this.st.sawCaustic && this.st.sawChange; },
    causticCount() { return POOL.foldContour(p, 40).length; },
    tint() { return null; },
    castState() { const s = this.st; return { tilt: +s.tilt.toFixed(4), max: +s.fieldMax.toFixed(3), t: +s.tPool.toFixed(3) }; },
    drawThrow(g, geom, tint) {
      const s = this.st; if (!s.field) this._recompute();
      const { cx, cy, R } = geom, N = GRID, fld = s.field;
      // normalise against a TYPICAL brightness (≈3× the mean), not the single hottest
      // cell, so the whole net stays legible while the caustic seams still flare — a
      // grazing sun that focuses one cell must not black out the rest of the dapple.
      const ref = Math.max(1e-6, (s.fieldMean || 1) * 3);
      const cell = (2 * R) / N;
      const base = mix([0.62, 0.80, 1.0], tint, 0.5);    // a cool water-blue, warmed by the room
      g.save();
      // the soft ambient glow of the opening
      g.fillStyle = throwGrad(g, cx, cy, R * 1.45, [[0, rgbStr(base, 0.13)], [1, 'rgba(0,0,0,0)']]);
      g.beginPath(); g.arc(cx, cy, R * 1.45, 0, TAU); g.fill();
      // the net itself: brighter cells are the caustic seams. Clip to a soft disc.
      g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip();
      for (let iy = 0; iy < N; iy++) for (let ix = 0; ix < N; ix++) {
        const v = clamp(fld[iy * N + ix] / ref, 0, 1.4); // ~1 at typical, >1 at the seams
        if (v < 0.06) continue;
        const a = Math.min(1, Math.pow(v, 0.7));
        const gx = cx - R + (ix + 0.5) * cell, gy = cy - R + (iy + 0.5) * cell;
        const seam = v > 0.9;
        const col = seam ? mix(base, [1, 0.95, 0.72], 0.7) : base;   // caustic seams flare gold-white
        g.fillStyle = rgbStr(col, 0.62 * a);
        g.fillRect(gx - cell * 0.62, gy - cell * 0.62, cell * 1.24, cell * 1.24);
      }
      g.restore();
    },
    drawRecess(g, geom) { drawArch(g, geom, [0.55, 0.72, 0.95]); },
  };
}

/* ═══ 2. THE TEACUP CAUSTIC — a floating cusped curve ═════════════════════════
   Core: ../teacup-caustic/core.mjs. The bright cusped curve a point source throws
   inside a ring — cardioid at the rim (1 cusp), nephroid off it (2 cusps). The
   room's own envelope() traces the curve; cuspCount()/cuspParams() find the cusps.
   TIER B — a NAMED adapter maps sun elevation → the source distance R; the number
   of cusps is still decided only by the core. */
export function makeTeacup(TC) {
  return {
    id: 'teacup-caustic', label: 'The Teacup Caustic', href: '../teacup-caustic/index.html',
    tier: 'B · adapter',
    adapterNote: 'ADAPTER (mine): sun elevation → source distance R (1 at zenith → 2.2 at horizon). ' +
                 'The CUSP COUNT is the core\'s: cuspCount(R), cardioid(1)→nephroid(2)',
    hint: 'a cup of light',
    character: 'a point of light in a ring throws a cusped seam — and a second cusp is born as the source draws away',
    pos: { x: 0.695, y: 0.50, r: 0.125 },
    st: { R: 1, cusps: [], nCusp: 1, sawOne: false, sawTwo: false },
    aim(sun) {
      const s = this.st;
      s.R = 1 + (1 - sun.elevation) * 1.2;               // adapter: zenith R=1, horizon R=2.2
      s.nCusp = TC.cuspCount(s.R, 900);                  // ← the room's own cusp law
      s.cusps = TC.cuspParams(s.R, 500);
      if (s.nCusp <= 1) s.sawOne = true; else if (s.nCusp >= 2) s.sawTwo = true;
    },
    step() { /* the curve is static between sun moves; nothing to advance */ },
    alive() { return false; },
    settle(sun) { this.aim(sun); },
    // THE PAYOFF: the second cusp is BORN — across the sun's sweep the cusp count
    // moves off 1 (cardioid) and reaches 2 (nephroid), the room's own bifurcation.
    payoff() { return this.st.sawOne && this.st.sawTwo; },
    tint() { return null; },
    castState() { const s = this.st; return { R: +s.R.toFixed(4), n: s.nCusp }; },
    drawThrow(g, geom, tint) {
      const s = this.st, { cx, cy, R } = geom;
      const scale = R * 0.42;                             // curve units → pixels
      const gold = mix([1.0, 0.86, 0.55], tint, 0.4);
      g.save();
      g.fillStyle = throwGrad(g, cx, cy, R * 1.4, [[0, rgbStr(gold, 0.11)], [1, 'rgba(0,0,0,0)']]);
      g.beginPath(); g.arc(cx, cy, R * 1.4, 0, TAU); g.fill();
      // the envelope curve E(t,R), the room's own caustic
      g.translate(cx, cy);
      g.beginPath();
      let started = false;
      for (let i = 0; i <= 260; i++) {
        const t = TAU * i / 260, e = TC.envelope(t, s.R);
        if (!e) { started = false; continue; }
        const px = e.x * scale, py = -e.y * scale;
        if (!started) { g.moveTo(px, py); started = true; } else g.lineTo(px, py);
      }
      g.strokeStyle = rgbStr(gold, 0.85); g.lineWidth = 1.6;
      g.shadowColor = rgbStr(gold, 0.9); g.shadowBlur = 8; g.stroke();
      g.shadowBlur = 0;
      // the source point + a faint ring hint
      g.strokeStyle = rgbStr(mix(gold, [1, 1, 1], 0.4), 0.18); g.lineWidth = 1;
      g.beginPath(); g.arc(0, 0, scale, 0, TAU); g.stroke();
      g.fillStyle = rgbStr([1, 0.95, 0.8], 0.9);
      g.beginPath(); g.arc(s.R * scale, 0, 2.4, 0, TAU); g.fill();
      // tick each cusp — the birth of the second is the whole point
      for (const tc of s.cusps) {
        const e = TC.envelope(tc, s.R); if (!e) continue;
        g.fillStyle = rgbStr([1, 1, 0.92], 0.95);
        g.beginPath(); g.arc(e.x * scale, -e.y * scale, 3, 0, TAU); g.fill();
      }
      g.restore();
    },
    drawRecess(g, geom) { drawArch(g, geom, [0.95, 0.78, 0.42]); },
  };
}

/* ═══ 3. THE REFRACTION RUN — one bright bent ray ═════════════════════════════
   Core: ../refraction-run/core.mjs. The least-time path a ray takes through a
   stack of media (air→water→flint): solveFermat() minimises ∫n·ds, and the
   Snell defect snellResiduals()→0 confirms the ray really is the Fermat path.
   TIER B — a NAMED adapter maps the sun's azimuth → the emitter entry x; the ray
   RE-BENDS by the core's own solver, never by an eased tween. */
export function makeRefraction(RR) {
  const base = RR.buildRound(2);                         // air→water→flint, two interfaces
  return {
    id: 'refraction-run', label: 'The Photon\'s Errand', href: '../refraction-run/index.html',
    tier: 'B · adapter',
    adapterNote: 'ADAPTER (mine): sun azimuth → emitter entry x. The PATH is the core\'s: ' +
                 'solveFermat() least-time, snellResiduals → 0',
    hint: 'least time, always',
    character: 'move the source and the ray re-breaks itself along the one path that takes least time',
    pos: { x: 0.305, y: 0.50, r: 0.135 },
    st: { p: base, X: base.Xstar.slice(), res: 0, sx: base.src[0], lastX: null, sawReBend: false, sawZero: false },
    aim(sun) {
      const s = this.st;
      const sx = -2.4 + sun.azimuth * 1.4;               // adapter: azimuth → entry x
      const p = Object.assign({}, base, { src: [sx, base.src[1]] });
      const sol = RR.solveFermat(p);                     // ← the room's own least-time solver
      s.p = p; s.X = sol.X.slice(); s.sx = sx;
      const res = RR.snellResiduals(p, sol.X);
      s.res = res.reduce((m, v) => Math.max(m, v), 0);
      if (s.res < 1e-6) s.sawZero = true;
      if (s.lastX && Math.abs(s.X[0] - s.lastX[0]) > 1e-4) s.sawReBend = true;
      s.lastX = s.X.slice();
    },
    step() { /* static between sun moves */ },
    alive() { return false; },
    settle(sun) { this.aim(sun); },
    // THE PAYOFF: as the source moves the path RE-BENDS, and the re-bent path is
    // genuinely the Fermat path — every interface's Snell residual is machine-zero.
    payoff() { return this.st.sawReBend && this.st.sawZero; },
    tint() { return null; },
    castState() { const s = this.st; return { sx: +s.sx.toFixed(4), x0: +s.X[0].toFixed(4), res: +s.res.toExponential(2) }; },
    drawThrow(g, geom, tint) {
      const s = this.st, { cx, cy, R } = geom;
      const pts = RR.pathPoints(s.p, s.X);               // ← src, crossings…, tgt
      // map tank coords (x∈[-3,3], y∈[-3.5,3.7]) into the throw disc
      const sc = R / 3.4, mapx = x => cx + x * sc, mapy = y => cy + (y - 0.1) * sc * 0.9;
      const beam = mix([1.0, 0.93, 0.72], tint, 0.35);
      g.save();
      g.beginPath(); g.arc(cx, cy, R * 1.05, 0, TAU); g.clip();
      // faint layer bands (air/water/flint) so the bending reads
      const bands = [[-3.5, s.p.ys[0], 0.03], [s.p.ys[0], s.p.ys[1], 0.07], [s.p.ys[1], 3.7, 0.12]];
      for (const [y0, y1, al] of bands) {
        g.fillStyle = rgbStr(mix([0.4, 0.6, 0.95], tint, 0.5), al);
        g.fillRect(cx - R, mapy(y0), R * 2, mapy(y1) - mapy(y0));
      }
      // the bent ray
      g.beginPath();
      pts.forEach((pt, i) => { const X = mapx(pt[0]), Y = mapy(pt[1]); i ? g.lineTo(X, Y) : g.moveTo(X, Y); });
      g.strokeStyle = rgbStr(beam, 0.9); g.lineWidth = 2;
      g.shadowColor = rgbStr(beam, 0.95); g.shadowBlur = 9; g.stroke();
      g.shadowBlur = 0;
      // the kink markers at each interface + source/focus
      for (let i = 1; i < pts.length - 1; i++) {
        g.fillStyle = rgbStr([1, 1, 0.9], 0.8);
        g.beginPath(); g.arc(mapx(pts[i][0]), mapy(pts[i][1]), 2, 0, TAU); g.fill();
      }
      g.fillStyle = rgbStr([1, 0.95, 0.7], 1);
      g.beginPath(); g.arc(mapx(pts[0][0]), mapy(pts[0][1]), 3, 0, TAU); g.fill();
      g.fillStyle = rgbStr([0.8, 0.95, 1], 1);
      g.beginPath(); g.arc(mapx(pts[pts.length - 1][0]), mapy(pts[pts.length - 1][1]), 3, 0, TAU); g.fill();
      g.restore();
    },
    drawRecess(g, geom) { drawArch(g, geom, [0.98, 0.9, 0.6]); },
  };
}

/* ═══ 4. THE MIRAGE — a shimmering false-water pool + its inverted twin ═══════
   Core: ../mirage/core.mjs. A ray grazing the hot road bends up off the low warm
   air and turns (marchRay/turningPoint), so a patch of sky pools on the ground as
   false water; puddleHorizon() is its near edge. TIER A — the sun's elevation IS
   the grazing angle θ₀ (the ray's honest launch angle). As the sun drops the ray
   grazes shallower, turns, and the puddle blooms; high, it dives in and vanishes. */
export function makeMirage(MI) {
  const hot = Object.assign(MI.witness(), { dndyScale: 9e-3, H: 1.6, eyeY: 1.6 });
  return {
    id: 'mirage', label: 'The Mirage', href: '../mirage/index.html',
    tier: 'A · native',
    adapterNote: 'sun elevation → grazing angle θ₀ (the ray\'s own launch angle); NATIVE. ' +
                 'The turn is the core\'s: marchRay/turningPoint/puddleHorizon',
    hint: 'water that isn\'t there',
    character: 'a grazing ray lifts off the warm road and turns — and a pool of sky lies on the ground where no water is',
    pos: { x: 0.89, y: 0.50, r: 0.14 },
    st: { theta0: 0, ray: null, turned: false, xStar: null, shimmer: 0, sawBloom: false, sawVanish: false },
    aim(sun) {
      const s = this.st;
      const thC = MI.criticalAngle(hot) || 0.02;
      s.theta0 = (0.35 + 1.5 * sun.elevation) * thC;     // native: elevation sets the grazing angle
      const r = MI.marchRay(s.theta0, hot);              // ← the room's own ray march
      s.ray = r; s.turned = r.turned; s.xStar = r.xStar;
      if (r.turned && r.xStar != null) s.sawBloom = true; else s.sawVanish = true;
    },
    step(dt) { this.st.shimmer += dt; },
    alive() { return true; },                            // the false water always shivers
    settle(sun) { this.aim(sun); },
    // THE PAYOFF: across the sweep the false water BLOOMS (a grazing ray turns and
    // puts a puddle on the wall) AND VANISHES (a steeper ray dives into the road,
    // no turn) — the room's own turning-point deciding, not a timer.
    payoff() { return this.st.sawBloom && this.st.sawVanish; },
    // the neg-control the twin corroborates: a FLAT profile has no false water.
    horizonFlat() { return MI.puddleHorizon(Object.assign({}, hot, { dndyScale: 0 })); },
    tint() { return null; },
    castState() { const s = this.st; return { th: +s.theta0.toFixed(5), turned: s.turned, x: s.xStar == null ? -1 : +s.xStar.toFixed(3) }; },
    drawThrow(g, geom, tint) {
      const s = this.st, { cx, cy, R } = geom;
      const sky = mix([0.55, 0.78, 1.0], tint, 0.5);
      const horizonY = cy - R * 0.05, roadY = cy + R * 0.5;
      g.save();
      g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip();
      // the warm road band + the sky above
      g.fillStyle = rgbStr(mix([0.9, 0.5, 0.3], tint, 0.4), 0.07);
      g.fillRect(cx - R, roadY, R * 2, R);
      if (s.turned && s.xStar != null) {
        // the FALSE WATER: a pooled reflection of the sky low on the wall, from the
        // near edge (the ray's turning x) toward the horizon — it creeps with θ₀.
        const march = clamp(1 - s.xStar / 320, 0.05, 0.95);   // nearer turn → wider puddle
        const puddleTop = roadY - (roadY - horizonY) * march;
        const shim = Math.sin(s.shimmer * 3) * 2;
        const grd = g.createLinearGradient(0, puddleTop, 0, roadY);
        grd.addColorStop(0, rgbStr(sky, 0.05));
        grd.addColorStop(0.5, rgbStr(sky, 0.42 + 0.06 * Math.sin(s.shimmer * 5)));
        grd.addColorStop(1, rgbStr(mix(sky, [1, 0.9, 0.7], 0.3), 0.12));
        g.fillStyle = grd;
        g.beginPath();
        g.moveTo(cx - R, puddleTop + shim);
        g.lineTo(cx + R, puddleTop - shim);
        g.lineTo(cx + R, roadY); g.lineTo(cx - R, roadY); g.closePath(); g.fill();
        // the INVERTED TWIN: a flipped ghost of a distant object shimmering in it
        g.globalAlpha = 0.5;
        for (let k = -1; k <= 1; k++) {
          const bx = cx + k * R * 0.4;
          g.fillStyle = rgbStr(mix(sky, [1, 1, 1], 0.5), 0.5);
          g.beginPath();
          g.moveTo(bx, puddleTop + 2);
          g.quadraticCurveTo(bx + shim, (puddleTop + roadY) / 2, bx, roadY - 4);
          g.lineWidth = 2; g.strokeStyle = rgbStr(sky, 0.4); g.stroke();
        }
        g.globalAlpha = 1;
      }
      // the grazing ray itself, bending up off the road (drawn from the march)
      if (s.ray && s.ray.pts.length > 1) {
        const pts = s.ray.pts, sc = R / 260;
        const mapx = x => cx - R * 0.9 + x * sc, mapy = y => roadY - y * (R * 0.35) / hot.eyeY;
        g.beginPath();
        pts.forEach((pt, i) => { const X = mapx(pt.x), Y = mapy(pt.y); i ? g.lineTo(X, Y) : g.moveTo(X, Y); });
        g.strokeStyle = rgbStr(mix([1, 0.95, 0.8], tint, 0.3), 0.5); g.lineWidth = 1.4; g.stroke();
      }
      g.restore();
    },
    drawRecess(g, geom) { drawArch(g, geom, [0.55, 0.78, 1.0]); },
  };
}

/* ═══ 5. WHY THE SKY IS BLUE — the broad colour wash that IS the room's tint ══
   Core: ../why-the-sky-is-blue/core.mjs. Rayleigh scattering: the blue is stolen
   out sideways (sideScatteredSpectrum, centroid ~478 nm), the survivor reddens
   with air-mass (transmittedSpectrum → dominantWavelength). TIER A — the sun's
   elevation IS the air-mass (zenith angle → airmass()). This aperture ALSO drives
   the vault's SHARED ambient tint: one honest law tinting all its siblings. */
export function makeSky(SK) {
  return {
    id: 'why-the-sky-is-blue', label: 'Why the Sky is Blue', href: '../why-the-sky-is-blue/index.html',
    tier: 'A · native',
    adapterNote: 'sun elevation → air-mass (zenith angle → airmass()); NATIVE. ' +
                 'DRIVES the vault\'s shared ambient tint = dominantWavelength(transmittedSpectrum(airmass))',
    hint: 'the whole vault\'s colour',
    character: 'the blue is scattered out; what survives the long slant reddens — and the whole room takes that colour',
    pos: { x: 0.50, y: 0.50, r: 0.155 },
    st: { L: 1, dom: 478, survivorDom: 560, blueDom: 478, sawBlue: false, sawRed: false },
    aim(sun) {
      const s = this.st;
      const zen = (1 - sun.elevation) * (Math.PI / 2 - 0.02);
      s.L = SK.airmass(zen);                             // ← the room's own air-mass
      s.survivorDom = SK.dominantWavelength(SK.transmittedSpectrum(s.L, 1)); // ← the direct beam's centroid
      s.blueDom = SK.dominantWavelength(SK.sideScatteredSpectrum());   // the stolen sky-blue (~478, fixed)
      // the ROOM WASH is the light that fills the vault: the blue sky-dome dominates
      // near the zenith (thin air), the reddened direct beam near the horizon (long
      // slant) — blended by the core's own air-mass. Blue → red as the sun sinks.
      const w = clamp((s.L - 1) / 39, 0, 1);            // air-mass fraction: 0 zenith → 1 horizon
      s.dom = s.blueDom + (s.survivorDom - s.blueDom) * w;
      if (s.dom < 500) s.sawBlue = true;
      if (s.dom > 560) s.sawRed = true;
    },
    step() {},
    alive() { return false; },
    settle(sun) { this.aim(sun); },
    // THE PAYOFF: the wash WALKS blue → red → blue as the sun crosses the sky —
    // the survivor's dominant wavelength both dips into the blue (near zenith) and
    // climbs into the red (near the horizon), the room's own reddening law.
    payoff() { return this.st.sawBlue && this.st.sawRed; },
    // THE SHARED AMBIENT TINT — the family bond you can see. The whole vault takes
    // the colour of what survives the sun's slant through the air.
    tint() {
      const survivor = nmToRGB(this.st.dom);
      // keep it a WASH, not a full paint: pull toward a neutral so throws stay legible
      return mix([0.7, 0.75, 0.85], survivor, 0.6);
    },
    castState() { const s = this.st; return { L: +s.L.toFixed(3), dom: +s.dom.toFixed(2) }; },
    drawThrow(g, geom, tint) {
      const s = this.st, { cx, cy, R } = geom;
      const wash = nmToRGB(s.dom), survivor = nmToRGB(s.survivorDom), blue = nmToRGB(s.blueDom);
      g.save();
      // the broad soft wash — the room's own colour, dimming as the slant lengthens
      const dim = clamp(1 - (s.L - 1) / 55, 0.32, 1);
      // a BROAD wash that spills across the shared wall onto its neighbours — so the
      // blue sky brushes the teacup's gold cusp and the pool's gold net, the kinship
      // of light made visible (this aperture is the family's ambient breath).
      g.fillStyle = throwGrad(g, cx, cy, R * 1.75,
        [[0, rgbStr(wash, 0.32 * dim)], [0.45, rgbStr(mix(wash, blue, 0.25), 0.15 * dim)], [1, 'rgba(0,0,0,0)']]);
      g.beginPath(); g.arc(cx, cy, R * 1.75, 0, TAU); g.fill();
      // the stolen blue glow off to the side of the beam (always there — it is the sky)
      g.fillStyle = throwGrad(g, cx - R * 0.55, cy - R * 0.35, R * 0.85,
        [[0, rgbStr(blue, 0.20)], [1, 'rgba(0,0,0,0)']]);
      g.beginPath(); g.arc(cx - R * 0.55, cy - R * 0.35, R * 0.85, 0, TAU); g.fill();
      // the sun disc, reddening as it sinks (the DIRECT beam, not the wash)
      g.fillStyle = rgbStr(survivor, 0.95 * dim);
      g.shadowColor = rgbStr(survivor, 0.9); g.shadowBlur = 26 * dim;
      g.beginPath(); g.arc(cx, cy, R * 0.17, 0, TAU); g.fill();
      g.shadowBlur = 0;
      g.restore();
    },
    drawRecess(g, geom) { drawArch(g, geom, [0.6, 0.78, 1.0]); },
  };
}

/* ═══ 6. FIRST LIGHT — THE OCULUS the sun cannot reach ════════════════════════
   Core: ../first-light/core.mjs. Overhead, a field of galaxies receding and
   reddening as the universe expands: scaleField(gals, a) carries them out,
   observedWavelength(λ₀, a₀, a) = λ₀·(a/a₀) stretches their light. TIER C —
   honestly DECOUPLED: it runs its OWN slow cosmic clock, deaf to the sun. The
   family's asymmetry, owned as its most poetic member. */
export function makeFirstLight(FL) {
  const gals = FL.makeTestField(120);
  const A0 = 1;
  return {
    id: 'first-light', label: 'First Light', href: '../first-light/index.html',
    tier: 'C · decoupled',
    adapterNote: 'DECOUPLED (honest): reads no sun. Its own slow cosmic clock a(t); ' +
                 'observedWavelength = λ₀·(a/a₀), the room\'s redshift law',
    hint: 'the light the sun can\'t reach',
    character: 'older light, stretched by the swelling of space itself — reddening on a clock that is not the sun\'s',
    pos: { x: 0.50, y: 0.235, r: 0.115 },                // overhead: the oculus
    st: { a: 1.0, lam: 1.0, z: 0, sawRed: false },
    aim() { /* deaf to the sun, by design */ },
    step(dt) {
      const s = this.st;
      s.a += dt * 0.06;                                   // the slow cosmic clock (MINE) — never the sun's
      if (s.a > 3.2) s.a = 1.0;                           // loop the expansion gently
      s.lam = FL.observedWavelength(1, A0, s.a);          // ← λ_obs = λ₀·(a/a₀)
      s.z = FL.redshift(A0, s.a);                         // ← z = a/a₀ − 1
      if (s.z > 0.05) s.sawRed = true;
    },
    alive() { return true; },
    settle() { const s = this.st; s.a = 1.6; s.lam = FL.observedWavelength(1, A0, s.a); s.z = FL.redshift(A0, s.a); },
    // THE PAYOFF: the light REDDENS on its own clock — observedWavelength grows as
    // a grows, with no sun involved (z climbs above 0). Neg-control: a=1 ⇒ z=0.
    payoff() { return this.st.sawRed && this.st.z > 0; },
    tint() { return null; },
    castState() { const s = this.st; return { a: +s.a.toFixed(3), z: +s.z.toFixed(3) }; },
    drawThrow(g, geom) {
      const s = this.st, { cx, cy, R } = geom;
      const pos = FL.scaleField(gals, s.a);              // ← the comoving field carried out to proper positions
      // rest blue (λ=1) → observed red as λ grows: map λ∈[1,3.2] onto ~460..660 nm
      const nm = clamp(460 + (s.lam - 1) * 90, 440, 680);
      const col = nmToRGB(nm);
      g.save();
      g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip();
      // the deep of the oculus
      g.fillStyle = 'rgba(4,6,14,0.9)'; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
      const sc = R / (5 * s.a);                           // keep the field framed as it swells
      for (const gp of pos) {
        const X = cx + gp.x * sc, Y = cy + gp.y * sc;
        const d = Math.hypot(gp.x, gp.y);
        if (d < 0.02) continue;
        const twinkle = 0.6 + 0.4 * Math.sin(s.a * 3 + d * 4);
        const sz = clamp(2.4 - d * 0.16, 0.5, 2.4);
        g.fillStyle = rgbStr(col, 0.85 * twinkle);
        g.beginPath(); g.arc(X, Y, sz, 0, TAU); g.fill();
      }
      // the faint glow of the aperture rim
      g.fillStyle = throwGrad(g, cx, cy, R, [[0.7, 'rgba(0,0,0,0)'], [1, rgbStr(col, 0.10)]]);
      g.fillRect(cx - R, cy - R, R * 2, R * 2);
      g.restore();
    },
    drawRecess(g, geom) { drawArch(g, geom, [0.6, 0.55, 0.85], true); },
  };
}

/* ─── the recessed arched opening every aperture is set into (canvas) ─────────
   A dark bevelled arch with a faint bright rim in the aperture's own hue, so the
   opening reads as sunk into the plaster even before its throw lights it. */
function drawArch(g, geom, hue, round) {
  const { cx, cy, R } = geom, w = R * 0.9, h = R * 1.05;
  g.save();
  g.beginPath();
  if (round) { g.arc(cx, cy, w * 0.85, 0, TAU); }
  else {
    const x0 = cx - w * 0.5, x1 = cx + w * 0.5, yb = cy + h * 0.5, yt = cy - h * 0.5;
    g.moveTo(x0, yb); g.lineTo(x0, yt + w * 0.5);
    g.quadraticCurveTo(x0, yt, cx, yt); g.quadraticCurveTo(x1, yt, x1, yt + w * 0.5);
    g.lineTo(x1, yb); g.closePath();
  }
  const gr = g.createRadialGradient(cx, cy - h * 0.15, R * 0.05, cx, cy, R * 0.9);
  gr.addColorStop(0, 'rgba(10,12,10,0.96)'); gr.addColorStop(1, 'rgba(2,3,2,0.98)');
  g.fillStyle = gr; g.fill();
  g.lineWidth = 1.2; g.strokeStyle = rgbStr(hue, 0.16); g.stroke();
  g.restore();
}

/* ═══ THE VAULT, IN ORDER ══════════════════════════════════════════════════════
   Six apertures. `cores` maps each room id to its core module — the page passes
   the forge-inlined IIFE exports, Node passes real import()s. The sky-coupled
   five are the sun's children; first-light is the oculus that keeps its own time.
   Order matters for the wall seams: pool(gold) · sky(blue) between the gold-casters
   so a blue scatter-wash brushes a caustic's gold edge, the kinship made visible. */
export const ROOM_IDS = ['pool', 'refraction-run', 'why-the-sky-is-blue', 'teacup-caustic', 'mirage', 'first-light'];

export function makeApertures(cores) {
  return [
    makePool(cores['pool']),
    makeRefraction(cores['refraction-run']),
    makeSky(cores['why-the-sky-is-blue']),
    makeTeacup(cores['teacup-caustic']),
    makeMirage(cores['mirage']),
    makeFirstLight(cores['first-light']),
  ];
}
