/* ============================================================================
 *  THE ORB WEAVER  ·  weave.mjs  —  the GEOMETRY of an orb web, and the order
 *  in which one is actually built.
 *
 *  Zero-dependency, DOM-free ESM. Runs in Node and in the browser (forge-inlined).
 *  No backtick may appear anywhere in this file, comments included: it is
 *  re-included inside a String.raw for the page's worker/worklet paths.
 *  (LANDMINES.md — a backtick in a comment ends the template and the page dies
 *  on a SyntaxError pointing at a line of prose.)
 *
 *  WHAT IS MODELLED
 *  ----------------
 *  An Araneus diadematus orb, built in the sequence every orb weaver uses:
 *
 *    1  BRIDGE       a filament let go on the breeze until it snags; she walks it
 *    2  Y            a line dropped from the bridge's middle; the fork IS the hub
 *    3  FRAME        a closed polygon on the anchors, which is what the radii pull on
 *    4  RADII        laid one at a time, HUB -> frame -> HUB, alternating sides
 *    5  HUB SPIRAL   a tight strengthening coil where she will sit
 *    6  AUXILIARY    a wide temporary spiral, laid OUTWARD.  Scaffolding.
 *    7  CAPTURE      the sticky spiral, laid INWARD, using the auxiliary as a
 *                    ruler -- and EATING it as she passes.  The scaffolding is
 *                    removed by being consumed; none of it is in the finished web.
 *
 *  TWO RULES DO ALL THE MEASURING, and neither of them is a coordinate:
 *
 *    - She sets a radius by standing near the hub and reaching the previous one
 *      with a leg. Equal chord at a fixed small radius IS equal angle, so the
 *      radii come out evenly spaced in ANGLE even though she never measures one.
 *    - She sets each turn of the capture spiral by holding the auxiliary with one
 *      leg and the last sticky turn with another. That is a constant RADIAL gap,
 *      so the capture spiral is an ARCHIMEDEAN spiral -- constant pitch, not
 *      constant angle -- everywhere the frame is not in the way.
 *
 *  The web is NOT centred on itself. The hub sits above the middle, because she
 *  hangs head-down and falls faster than she climbs; the lower half of an orb is
 *  the bigger half. Nothing here sets that except where the hub is.
 *
 *  Lengths are METRES. The plane is the web's own plane, y up. Out-of-plane
 *  motion (z) belongs to strings.mjs, which builds the tension network from what
 *  this file returns.
 * ========================================================================== */

/* ── seeded RNG (mulberry32) so every web in this room is reproducible ─────── */
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── the dimensions of one garden orb, in metres ───────────────────────────── */
export const GEO = {
  /* the twigs she found. These are the only FIXED points in the whole web. */
  anchors: [
    [-0.150,  0.145],   /* 0  A  top left      */
    [ 0.158,  0.136],   /* 1  B  top right     */
    [ 0.175, -0.026],   /* 2  F  right         */
    [ 0.082, -0.175],   /* 3  E  bottom right  */
    [-0.100, -0.170],   /* 4  D  bottom left   */
    [-0.172, -0.018],   /* 5  C  left          */
  ],
  hub:      [0.002, 0.026],   /* above the middle, on purpose */
  nRadii:   32,
  jitter:   0.030,            /* fraction of a gap; her leg is not a protractor */
  seed:     7,

  freeR:    0.0215,           /* free zone: no capture spiral inside this */
  hubR0:    0.0045,           /* strengthening coil, inner radius */
  hubR1:    0.0170,           /*                     outer radius */
  hubTurns: 3.5,

  auxStart: 0.0300,
  auxPitch: 0.0125,           /* the temporary spiral is WIDE */
  auxOuter: 0.90,             /* fraction of the frame distance it runs out to */

  capOuter: 0.945,            /* fraction of the frame distance the sticky spiral starts at */
  capPitch: 0.00465,          /* one leg-span. Constant, and the room measures it. */

  /* she does not attach to the very tip of a radius; the outermost sticky turn
     stands off the frame by this much, which is why an orb has a clear margin */
  capMargin: 0.006,
};

/* ── vector scraps ─────────────────────────────────────────────────────────── */
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len2 = a => Math.hypot(a[0], a[1]);
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/* Distance from 'o' along direction (ux,uy) to the frame polygon. Returns the
   smallest positive hit; the polygon is closed and o is inside it. */
function rayToPolygon(o, ux, uy, poly) {
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const ex = q[0] - p[0], ey = q[1] - p[1];
    const den = ux * ey - uy * ex;
    if (Math.abs(den) < 1e-14) continue;
    const wx = p[0] - o[0], wy = p[1] - o[1];
    const t = (wx * ey - wy * ex) / den;      /* along the ray   */
    const s = (wx * uy - wy * ux) / den;      /* along the edge  */
    if (t > 1e-9 && s >= -1e-9 && s <= 1 + 1e-9 && t < best) best = t;
  }
  return best;
}

/* ============================================================================
 *  buildWeb(opts) -> the finished plan
 *
 *  Returns EVERY thread she will ever lay, each stamped with the time it is
 *  laid (birth) and the time it is eaten (death, Infinity for the ones that
 *  stay). Nothing is deleted; the animation is a query on time.
 * ========================================================================== */
export function buildWeb(opts = {}) {
  const G = Object.assign({}, GEO, opts);
  const rnd = mulberry32(G.seed);
  const H = G.hub.slice();
  const A = G.anchors;

  /* ---- 1. the frame polygon ---------------------------------------------- */
  /* order the anchors by angle about the hub so the polygon is simple whatever
     order they were listed in. */
  const poly = A.slice().sort((p, q) =>
    Math.atan2(p[1] - H[1], p[0] - H[0]) - Math.atan2(q[1] - H[1], q[0] - H[0]));

  /* ---- 2. the radii ------------------------------------------------------- */
  /* equal angles (the leg-span rule), plus a little jitter, plus the fact that
     the frame is not a circle -- which is where all of an orb's asymmetry
     comes from. */
  const N = G.nRadii;
  const radii = [];
  for (let k = 0; k < N; k++) {
    const base = (k / N) * Math.PI * 2 + Math.PI / 2;   /* start pointing up */
    const th = base + (rnd() - 0.5) * G.jitter * (Math.PI * 2 / N);
    const ux = Math.cos(th), uy = Math.sin(th);
    const L = rayToPolygon(H, ux, uy, poly);
    radii.push({ k, th, ux, uy, L, tip: [H[0] + ux * L, H[1] + uy * L] });
  }

  /* the order she lays them in: never two in a row on the same side, so the
     half-built web never pulls itself lopsided. Real spiders do this; the
     usual description is "roughly alternating, with a gap left and filled". */
  const order = [];
  { const half = N >> 1;
    for (let i = 0; i < half; i++) { order.push(i); order.push((i + half) % N); }
    /* stagger so successive picks are not adjacent either */
    for (let i = 1; i < order.length; i += 2) {
      const j = (i + 2 * ((i * 7) % 5)) % order.length;
      const t = order[i]; order[i] = order[j]; order[j] = t;
    }
    const seen = new Set(); const clean = [];
    for (const k of order) if (!seen.has(k)) { seen.add(k); clean.push(k); }
    for (let k = 0; k < N; k++) if (!seen.has(k)) clean.push(k);
    order.length = 0; order.push(...clean);
  }

  /* ---- 3. the three spirals ---------------------------------------------- */
  /* A spiral is a walk over radius indices; at step j it stands on radius
     (j mod N) at radial distance r_j. Chords join consecutive stations. */

  /* hub spiral: tight, a fixed number of turns, laid outward */
  const hubSp = [];
  { const steps = Math.round(G.hubTurns * N);
    for (let j = 0; j <= steps; j++) {
      const f = j / steps;
      hubSp.push({ k: j % N, r: G.hubR0 + (G.hubR1 - G.hubR0) * f });
    } }

  /* auxiliary spiral: wide, laid outward, from just past the free zone to
     near the frame. This one is scaffolding and does not survive. */
  const auxSp = [];
  { let j = 0;
    for (;;) {
      const k = j % N;
      const r = G.auxStart + G.auxPitch * (j / N);
      const cap = radii[k].L * G.auxOuter;
      if (r > cap) break;
      auxSp.push({ k, r });
      j++;
      if (j > 4000) break;
    } }

  /* capture spiral: laid INWARD from the outside, constant radial pitch.
     Where the frame is closer than the ideal spiral, she is forced in -- which
     is why the outer turns of a real orb follow the frame and the inner ones
     are perfect circles. */
  const capSp = [];
  { const R0 = Math.max(...radii.map(r => r.L)) * G.capOuter;
    let j = 0;
    for (;;) {
      const k = j % N;
      const ideal = R0 - G.capPitch * (j / N);
      const ceil = radii[k].L * G.capOuter - G.capMargin;
      const r = Math.min(ideal, ceil);
      if (ideal < G.freeR + G.capPitch * 0.5) break;
      capSp.push({ k, r, clamped: ceil < ideal });
      j++;
      if (j > 6000) break;
    } }

  /* ---- 4. the build script ------------------------------------------------ */
  /* Every thread, with the time it appears and the time it goes -- and, laid down
     in the SAME pass, the walk she takes to place it. They are built together on
     purpose: a spider is only ever standing on silk that already exists, so the
     path and the schedule are one object, not two that have to be kept in step.
     Each stage may claim a LEAD -- the time at the front of it she spends getting
     to where the work is, on threads already there. The twin checks the result
     ("she is never standing on air") and it is a check that has caught this.

     Times are in "weaving seconds": a real Araneus takes twenty minutes to an
     hour, and this is the same order of work at about forty times the speed. */
  const T = [];        /* threads */
  const stages = [];   /* named spans, for the caption and the scrubber */
  const legs = [];     /* her walk: {t0,t1,pts,note} */
  let t = 0;
  const push = (a, b, kind, t0, t1, extra) =>
    T.push(Object.assign({ a, b, kind, birth: t0, laid: t1, death: Infinity }, extra || {}));
  const walk = (t0, t1, pts, note) => { if (t1 > t0 + 1e-9) legs.push({ t0, t1, pts, note }); };
  const stage = (name, label, dur, lead, fn) => {
    const t0 = t, s0 = t0 + lead; t += dur;
    stages.push({ name, label, t0, t1: t, s0 });
    fn(t0, s0, t);
    return { t0, s0, t1: t };
  };
  /* lay a chain of points as threads, evenly in time, walking it as she goes */
  const layChain = (pts, kind, s0, t1, note, extra) => {
    const per = (t1 - s0) / Math.max(1, pts.length - 1);
    for (let i = 0; i + 1 < pts.length; i++) {
      push(pts[i], pts[i + 1], kind, s0 + i * per, s0 + (i + 1) * per,
        typeof extra === 'function' ? extra(i) : extra);
      walk(s0 + i * per, s0 + (i + 1) * per, [pts[i], pts[i + 1]], note);
    }
  };

  /* --- the bridge. The one thread she does not walk out to place: she stands
     still, lets go of a filament, and the air carries it until it snags. --- */
  const bridgeA = poly.reduce((m, p) => (p[1] > m[1] ? p : m), poly[0]);
  const bridgeB = poly.filter(p => p !== bridgeA).reduce((m, p) => (p[1] > m[1] ? p : m));
  stage('bridge', 'the bridge line  ·  she lets go of a filament and the air takes it', 5.0, 0,
    (t0, s0, t1) => {
      push(bridgeA, bridgeB, 'frame', t0 + 3.0, t1, { bridge: true });
      walk(t0, t0 + 3.0, [bridgeA, bridgeA], 'paying out on the breeze');
      walk(t0 + 3.0, t1, [bridgeA, bridgeB], 'crossing her own bridge');
    });

  const mid = lerp2(bridgeA, bridgeB, 0.5);
  const low = poly.reduce((m, p) => (p[1] < m[1] ? p : m), poly[0]);
  stage('y', 'the Y  ·  a line dropped from the middle. The fork IS the hub.', 4.5, 0.8,
    (t0, s0, t1) => {
      walk(t0, s0, [bridgeB, mid], 'back to the middle');
      const h = (t1 - s0) / 3;
      push(mid, H, 'frame', s0, s0 + h, { yline: true });
      walk(s0, s0 + h, [mid, H], 'dropping the Y');
      push(H, low, 'frame', s0 + h, s0 + 2 * h, { yline: true });
      walk(s0 + h, s0 + 2 * h, [H, low], 'and anchoring it below');
      walk(s0 + 2 * h, t1, [low, H], 'back up');
    });

  /* --- the frame. Cut the polygon at the bridge and what is left is one path
     from bridgeA the long way round to bridgeB; she lays each edge by walking
     it. --- */
  const frameChain = [];
  { const i0 = poly.indexOf(bridgeB);
    for (let s2 = 0; s2 < poly.length; s2++) frameChain.push(poly[(i0 + s2) % poly.length]);
    frameChain.reverse(); }                        /* bridgeA -> ... -> bridgeB */
  stage('frame', 'the frame  ·  the polygon every radius will pull against', 7.5, 1.6,
    (t0, s0, t1) => {
      walk(t0, t0 + (s0 - t0) * 0.45, [H, mid], 'up the Y');
      walk(t0 + (s0 - t0) * 0.45, s0, [mid, bridgeA], 'along the bridge');
      layChain(frameChain, 'frame', s0, t1, 'laying the frame');
    });

  stage('radii', 'the radii  ·  out and back, out and back, never twice on one side', 15.0, 1.6,
    (t0, s0, t1) => {
      walk(t0, t0 + (s0 - t0) * 0.5, [bridgeB, mid], 'home along the bridge');
      walk(t0 + (s0 - t0) * 0.5, s0, [mid, H], 'and down the Y');
      const per = (t1 - s0) / N;
      order.forEach((k, i) => {
        push(H, radii[k].tip, 'radius', s0 + i * per, s0 + (i + 0.55) * per, { rk: k });
        walk(s0 + i * per, s0 + (i + 0.55) * per, [H, radii[k].tip], 'out');
        walk(s0 + (i + 0.55) * per, s0 + (i + 1) * per, [radii[k].tip, H], 'and back');
      });
    });

  /* --- the three spirals. Between phases she returns to the HUB and goes out
     again: there is no other route along silk from the end of one spiral to the
     start of the next. --- */
  let where = H;
  const spiralStage = (name, label, dur, lead, stns, kind, extra) =>
    stage(name, label, dur, lead, (t0, s0, t1) => {
      const pts = stns.map(st => stationXY(st, radii, H));
      walk(t0, t0 + (s0 - t0) * 0.5, [where, H], 'in to the hub');
      walk(t0 + (s0 - t0) * 0.5, s0, [H, pts[0]], 'out again');
      layChain(pts, kind, s0, t1, label, extra);
      where = pts[pts.length - 1];
    });

  spiralStage('hub', 'the hub  ·  a tight coil to sit on', 4.0, 0.8, hubSp, 'hub');
  spiralStage('aux', 'the auxiliary spiral  ·  scaffolding. Wide, and laid OUTWARD.', 6.0, 1.0,
    auxSp, 'aux', i => ({ auxIdx: i }));

  const capStage = spiralStage('capture',
    'the capture spiral  ·  sticky, laid INWARD  —  and she eats the scaffolding as she goes',
    21.0, 1.0, capSp, 'capture', i => ({ capIdx: i }));

  /* the auxiliary dies as the sticky spiral overtakes it: an auxiliary chord at
     radius r_a goes the moment the capture spiral's own radius passes it on the
     way in. Nothing deletes it -- it is given a death time, and the animation is
     a query on time. */
  { const per = (capStage.t1 - capStage.s0) / Math.max(1, capSp.length - 1);
    const R0 = Math.max(...radii.map(r => r.L)) * G.capOuter;
    for (const th of T) {
      if (th.kind !== 'aux') continue;
      const ra = 0.5 * (dist(th.a, H) + dist(th.b, H));
      const j = Math.max(0, Math.min(capSp.length - 1, (R0 - ra) / G.capPitch * N));
      th.death = Math.max(th.laid + 1e-6, capStage.s0 + j * per);
    }
  }

  stage('rest', 'and she turns head-down at the hub, and waits', 3.5, 0, (t0, s0, t1) => {
    walk(t0, t0 + 1.8, [where, H], 'home');
    walk(t0 + 1.8, t1, [H, H], 'waiting');
  });

  const duration = t;

  /* ---- 5. arc length along each leg, so she walks at a steady speed -------- */
  legs.sort((a, b) => a.t0 - b.t0);
  for (const L of legs) {
    const cum = [0];
    for (let i = 1; i < L.pts.length; i++) cum.push(cum[i - 1] + dist(L.pts[i - 1], L.pts[i]));
    L.cum = cum; L.total = cum[cum.length - 1];
  }

  return {
    G, H, poly, radii, order, hubSp, auxSp, capSp, threads: T, stages, duration,
    path: legs, frameChain, mid, low,
    bridge: [bridgeA, bridgeB],
    /* threads alive at time t (the finished web is t = duration) */
    alive(tq) { return T.filter(x => x.birth <= tq && x.death > tq); },
  };
}

/* a spiral station (radius index k, radial distance r) as a point */
export function stationXY(st, radii, H) {
  const R = radii[st.k];
  return [H[0] + R.ux * st.r, H[1] + R.uy * st.r];
}

/* ============================================================================
 *  THE WALK.  Where she is at weaving-time t. The legs were built alongside the
 *  threads in buildWeb(); this only interpolates by arc length inside one.
 * ========================================================================== */

/* Where she is at weaving-time t: {x, y, ang, note}. ang points the way she is
   walking; at rest she hangs head-down. */
export function spiderAt(web, tq) {
  const legs = web.path;
  let L = null;
  for (const g of legs) { if (tq >= g.t0 && tq <= g.t1) { L = g; break; } }
  if (!L) {
    if (tq < legs[0].t0) L = legs[0];
    else L = legs[legs.length - 1];
    const p = tq < legs[0].t0 ? L.pts[0] : L.pts[L.pts.length - 1];
    return { x: p[0], y: p[1], ang: -Math.PI / 2, note: 'waiting', speed: 0 };
  }
  const f = L.total > 0 ? (tq - L.t0) / Math.max(1e-9, L.t1 - L.t0) : 0;
  const s = f * L.total;
  let i = 1;
  while (i < L.cum.length - 1 && L.cum[i] < s) i++;
  const seg = Math.max(1e-12, L.cum[i] - L.cum[i - 1]);
  const u = Math.min(1, Math.max(0, (s - L.cum[i - 1]) / seg));
  const p = lerp2(L.pts[i - 1], L.pts[i], u);
  const d = sub(L.pts[i], L.pts[i - 1]);
  const ang = len2(d) > 1e-12 ? Math.atan2(d[1], d[0]) : -Math.PI / 2;
  const speed = L.total / Math.max(1e-9, L.t1 - L.t0);
  return { x: p[0], y: p[1], ang, note: L.note || '', speed };
}

/* ============================================================================
 *  MEASUREMENTS ON THE FINISHED PLAN  (what the room prints, and the twin checks)
 * ========================================================================== */

/* the angular gaps between neighbouring radii */
export function radialGaps(web) {
  const th = web.radii.map(r => r.th).slice().sort((a, b) => a - b);
  const g = [];
  for (let i = 0; i < th.length; i++) {
    let d = th[(i + 1) % th.length] - th[i];
    if (d < 0) d += Math.PI * 2;
    g.push(d);
  }
  return g;
}

/* the radial gap between successive TURNS of the capture spiral, measured
   along each radius -- her leg-span, as built. Returns every measurement. */
export function capturePitches(web) {
  const N = web.G.nRadii;
  const per = new Map();
  web.capSp.forEach((st, j) => {
    if (!per.has(st.k)) per.set(st.k, []);
    per.get(st.k).push({ j, r: st.r, clamped: st.clamped });
  });
  const out = [];
  for (const [k, list] of per) {
    for (let i = 0; i + 1 < list.length; i++) {
      /* skip any pair where the frame forced her in -- that gap is the frame's,
         not her leg's, and the room says so */
      if (list[i].clamped || list[i + 1].clamped) continue;
      out.push({ k, gap: list[i].r - list[i + 1].r });
    }
  }
  return out;
}

/* total length of silk in the finished web, by kind */
export function silkLengths(web, tq) {
  const t = tq === undefined ? web.duration : tq;
  const by = {};
  for (const th of web.threads) {
    if (th.birth > t || th.death <= t) continue;
    by[th.kind] = (by[th.kind] || 0) + dist(th.a, th.b);
  }
  by.total = Object.values(by).reduce((a, b) => a + b, 0);
  return by;
}

/* how much silk she pays out over the whole build, including the auxiliary
   she later eats -- the scaffolding is spun and then recovered */
export function silkSpun(web) {
  let all = 0, eaten = 0;
  for (const th of web.threads) {
    const L = dist(th.a, th.b);
    all += L;
    if (th.death < Infinity) eaten += L;
  }
  return { all, eaten, kept: all - eaten };
}
