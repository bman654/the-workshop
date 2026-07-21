// ============================================================================
//  in-the-round/trefoil/scene.mjs — THE CAST OBJECT. Hall two's geometry and
//  material: a trefoil knot in sand-cast bronze, sitting on a turned bearing
//  plate under one fixed lamp.
//
//  It is nine inches of metal and it does not care what you believe about it.
//  There is NO claim here and no theorem — the piece is the FEEL: the weight in
//  the drag, the highlight walking the tube as you turn it, the moment a strand
//  passes in front of another and you simply see which is which.
//
//  TWO THINGS THIS FILE IS CAREFUL ABOUT
//   • THE LAMP IS FIXED IN THE ROOM. The camera orbits (unforked applyDrag) and
//     the light vector is COUNTER-ROTATED by the same yaw, so turning the piece
//     walks the specular streak along the tube instead of gluing it to your eye.
//     That single decision is most of why the bronze reads as metal.
//   • THE SHADOW IS THE FLAT DIAGRAM. The knot's centreline is dropped onto the
//     plate along the lamp direction and inked OPAQUE. A shadow has no occlusion
//     to give: where it crosses itself it merely MERGES. So the plate carries,
//     live and unlabelled, the flat picture that cannot say which strand is on
//     top — right underneath the solid that says it effortlessly. No caption.
//
//  DOM-free: every shade() closure paints into the ctx render() hands it, so the
//  room draws it and the Node twin renders it through a mock ctx. The page
//  forge-inlines this file; the twin imports it. Same geometry, both sides.
// ============================================================================

// ===== TREFOIL SCENE =====
"use strict";

import { FOCAL, NEAR_EPS, project, toScreen } from '../../tools/scene3d/core.mjs';

const V = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  norm: (a) => { const m = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / m, a[1] / m, a[2] / m]; },
};

const N = 520, M = 16, TUBE = 0.155, SCALE = 0.345, ZAMP = 1.55, MOUNT = 16 * Math.PI / 180;
const TT_H = 0.055;                     // the bearing plate's own thickness

/* the trefoil, tilted on its pin the way a piece is actually mounted for a plinth */
function curveAt(t) {
  const x = (Math.sin(t) + 2 * Math.sin(2 * t)) * SCALE;
  const y = (Math.cos(t) - 2 * Math.cos(2 * t)) * SCALE;
  const z = (-ZAMP * Math.sin(3 * t)) * SCALE;
  const c = Math.cos(MOUNT), s = Math.sin(MOUNT);   // tilt about +x
  return [x, y * c - z * s, y * s + z * c];
}
const C = []; for (let i = 0; i < N; i++) C.push(curveAt(i / N * 2 * Math.PI));

/* parallel-transport frame (no Frenet flips; a round tube can't show the twist) */
const T = [], U = [], W = [];
for (let i = 0; i < N; i++) T.push(V.norm(V.sub(C[(i + 1) % N], C[(i + N - 1) % N])));
U[0] = V.norm(V.cross(T[0], Math.abs(T[0][2]) > 0.9 ? [1, 0, 0] : [0, 0, 1]));
W[0] = V.norm(V.cross(T[0], U[0]));
for (let i = 1; i < N; i++) {
  const prev = U[i - 1], t = T[i];
  U[i] = V.norm(V.sub(prev, V.mul(t, V.dot(t, prev))));
  W[i] = V.norm(V.cross(t, U[i]));
}
/* CLOSE THE FRAME. Transport a frame round a loop and it comes back rotated
   (holonomy); left alone that mismatch tears one seam of quads open. Spread the
   residual twist evenly along the tube — invisible on a round section, and the
   seam heals. */
const Ue = V.norm(V.sub(U[N - 1], V.mul(T[0], V.dot(T[0], U[N - 1]))));
const HOL = Math.atan2(V.dot(V.cross(Ue, U[0]), T[0]), V.dot(Ue, U[0]));

/* ring vertices + outward normals */
const P = [], NRM = [];
for (let i = 0; i < N; i++) {
  const ri = [], ni = [];
  for (let m = 0; m < M; m++) {
    const a = m / M * 2 * Math.PI - HOL * i / N;
    const n = V.norm(V.add(V.mul(U[i], Math.cos(a)), V.mul(W[i], Math.sin(a))));
    ri.push(V.add(C[i], V.mul(n, TUBE))); ni.push(n);
  }
  P.push(ri); NRM.push(ni);
}

/* SET IT DOWN. Not floating on an invisible mount — a heavy casting resting on
   the bearing, its lowest point just kissing the plate. */
let minZ = 1e9; for (const r of P) for (const p of r) if (p[2] < minZ) minZ = p[2];
const SIT = TT_H + 0.010 - minZ;
for (const c of C) c[2] += SIT;
for (const r of P) for (const p of r) p[2] += SIT;

/* SIZE THE PLATE TO THE PIECE. A casting that overhangs its own bearing looks
   like a mistake — and, worse, the plate is painted BEFORE the solid, so the
   near rim must sit outside (and therefore visually below) the lowest metal or
   the object appears to sink through the plate. Derive the radius, never guess. */
let REACH = 0;
for (const r of P) for (const p of r) { const q = Math.hypot(p[0], p[1]); if (q > REACH) REACH = q; }
const TT_R = REACH + 0.185;             // the rim clears the widest lobe, with a lip

/* PATINA POOLING: how deep in a valley is this vertex? Distance to the nearest
   NON-ADJACENT stretch of the same tube. Where the strands nest, the dark
   collects — and it pools on the undersides. Precomputed once; it never moves. */
const AO = [];
const GAP = Math.floor(N / 7);
for (let i = 0; i < N; i++) {
  const row = [];
  for (let m = 0; m < M; m++) {
    let d = 1e9;
    for (let j = 0; j < N; j++) {
      let dd = Math.abs(i - j); dd = Math.min(dd, N - dd);
      if (dd <= GAP) continue;
      const q = C[j], p = P[i][m];
      const e = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
      if (e < d) d = e;
    }
    let k = (d - TUBE * 1.05) / (0.82 - TUBE * 1.05); k = Math.max(0, Math.min(1, k));
    let ao = 0.14 + 0.86 * Math.pow(k, 0.70);
    ao *= 1 - 0.30 * Math.max(0, -NRM[i][m][2]);
    row.push(ao);
  }
  AO.push(row);
}

/* ── cast-bronze BRDF: dark patina, warm body, ONE narrow travelling highlight,
      a cool skylight rim, and a breath of aerial depth. Nothing gilded, nothing
      hollow, nothing chrome. ── */
const PATINA = [14, 26, 22], DEEP = [31, 21, 14], BODY = [92, 58, 30],
      LIT = [168, 118, 58], HOT = [255, 244, 206], SKY = [72, 98, 120],
      AIR = [20, 19, 18];               // the room's own dark — what the far side sinks toward
function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function rgb(c) { return 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')'; }

/* the fixed room lamp, and its counter-rotation.
   The OBJECT turns; the lamp does not. Geometrically we orbit the camera, so we
   spin the lamp backwards by the same angle — identical picture, but now the
   highlight TRAVELS along the strand instead of riding your eye. */
const LAMP0 = V.norm([0.34, -0.62, 0.72]);
function lampFor(spin) {
  const c = Math.cos(-spin), s = Math.sin(-spin);
  return [LAMP0[0] * c - LAMP0[1] * s, LAMP0[0] * s + LAMP0[1] * c, LAMP0[2]];
}
function viewDir(cam) {
  const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  return [sy * cp, cy * cp, -sp];
}

/* one shaded colour for one normal. `near` in [0,1] (1 = nearest thing on
   screen) is what render() already hands every item — spend it as aerial depth:
   the far strand sinks into the room's air, the near one comes forward warm.
   Free legibility out of a number the engine had already computed. */
function bronze(view, n, ao, grain, near) {
  const Vd = viewDir(view.cam), E = [-Vd[0], -Vd[1], -Vd[2]];      // toward the eye
  const L = view.lamp;
  const dif = Math.max(0, V.dot(n, L));
  const H = V.norm(V.add(L, E));
  const nh = Math.max(0, V.dot(n, H));
  // The streak stays narrow enough to READ as polished metal, but not so narrow
  // that 260 segments can no longer sample it: a pow-88 lobe steps visibly from
  // one ring of quads to the next, and a fine transverse banding creeps up the
  // lit side of the tube. This is the honest fix — widen the lobe until the
  // tesselation can carry it, rather than tripling the quad count.
  const spec = Math.pow(nh, 30);                                   // the travelling streak
  const sheen = Math.pow(nh, 7) * 0.19;                            // its broad soft bloom
  const rim = Math.pow(1 - Math.abs(V.dot(n, E)), 3.4);
  const up = Math.max(0, n[2]);
  let c = mix(PATINA, DEEP, ao);
  c = mix(c, BODY, dif * 0.88 * ao);
  c = mix(c, LIT, Math.pow(dif, 3.2) * 0.80 * ao);
  c = mix(c, SKY, rim * 0.26 + up * 0.05);
  c = mix(c, HOT, Math.min(1, (spec + sheen) * (0.30 + 0.70 * ao)));
  const t = (near === undefined) ? 0.5 : near;
  c = mix(c, AIR, 0.15 * (1 - t));                                 // depth haze — a breath, not a fog
  c = mix(c, LIT, 0.045 * t);                                      // near strand warms
  return [c[0] * grain, c[1] * grain, c[2] * grain];               // sand-cast tooth, not machined
}

/* THE TUBE: opaque quads. This is why the crossings are honest — a near face
   simply lands on top of a far one off the ONE depth-sorted list; nothing draws
   a little gap by hand.

   Each quad is filled with a LINEAR GRADIENT across the circumference (ring m →
   ring m+1) rather than one flat colour, so adjacent quads meet in the SAME
   colour at their shared edge and 26 sides read as a round bar instead of a
   faceted one. Cheaper than doubling the quad count, and better looking. */
/* Sand-cast tooth. TWO rules, both learned the hard way on a 260x28 mesh:
   (a) LOW frequency. A grain that turns over inside a couple of quads cannot be
       carried by the mesh; it becomes the mesh — a grid of rectangles, loudest
       exactly where the metal is brightest.
   (b) Evaluated PER GRADIENT ENDPOINT, never once per quad. A per-quad constant
       is a flat tile by construction, however gentle its value. */
function mottle(i, m) {
  const u = i / N * 2 * Math.PI, v = m / M * 2 * Math.PI;
  const n = Math.sin(u * 3 + v) * 0.52 + Math.sin(u * 5 - v * 2 + 1.7) * 0.30
          + Math.sin(u * 2 + v * 3 + 0.4) * 0.18;
  return 1 + 0.026 * n;
}

function buildTube(view) {
  const out = [];
  for (let i = 0; i < N; i++) {
    const i2 = (i + 1) % N;
    for (let m = 0; m < M; m++) {
      const m2 = (m + 1) % M;
      const A = P[i][m], B = P[i2][m], Cq = P[i2][m2], D = P[i][m2];
      const nA = V.norm(V.add(NRM[i][m], NRM[i2][m]));              // the ring-m edge
      const nB = V.norm(V.add(NRM[i][m2], NRM[i2][m2]));            // the ring-m2 edge
      const aoA = (AO[i][m] + AO[i2][m]) / 2, aoB = (AO[i][m2] + AO[i2][m2]) / 2;
      const grainA = mottle(i, m), grainB = mottle(i, m2);
      out.push({
        k: 'face', cull: true, seg: i, ring: m,
        pts: [A, B, Cq, D],
        shade: (cx, sp, near) => {
          const cA = rgb(bronze(view, nA, aoA, grainA, near));
          const cB = rgb(bronze(view, nB, aoB, grainB, near));
          cx.beginPath(); cx.moveTo(sp[0].x, sp[0].y);
          for (let k = 1; k < 4; k++) cx.lineTo(sp[k].x, sp[k].y);
          cx.closePath();
          const x0 = (sp[0].x + sp[1].x) / 2, y0 = (sp[0].y + sp[1].y) / 2;
          const x1 = (sp[3].x + sp[2].x) / 2, y1 = (sp[3].y + sp[2].y) / 2;
          let paint;
          if (Math.abs(x1 - x0) + Math.abs(y1 - y0) > 0.35 && cx.createLinearGradient) {
            const g = cx.createLinearGradient(x0, y0, x1, y1);
            g.addColorStop(0, cA); g.addColorStop(1, cB);
            paint = g;
          } else paint = cA;
          cx.fillStyle = paint; cx.fill();
          // Stroke each face with its OWN paint — the gradient, not one end of it.
          // This is what kills the hairline seams between quads; stroking with a
          // single colour would re-draw one edge in the WRONG colour and put the
          // grid back, which is the very thing the gradient was for.
          cx.strokeStyle = paint; cx.lineWidth = 1.8; cx.stroke();
        },
      });
    }
  }
  return out;
}

/* ── THE PLATE. Painted BEFORE the solid, so the eye must stay above its plane
      (the shell's pitch clamp is what guarantees that — see shell.mjs).

      Draw order, and each register's reason:
        disc + grooves     the turned bearing, and ONE inlaid brass registration
                           mark so a 120° turn is legible against 3-fold symmetry
        soft blobs         the PENUMBRA — the object's mass, tight and dense at
                           contact, wide and faint where a strand arches away.
                           It bottoms out at PENUMBRA_FLOOR, NOT at black: these
                           blobs accumulate (N of them, alpha each), so a colour
                           near black saturates the crossings to pure black — and
                           the ink below would then be drawn dark-on-DARKER and
                           vanish exactly where the thesis lives. Physically the
                           floor is right too: plate-in-shadow falls toward the
                           room's ambient AIR, never beneath it.
        inked centreline   the CORE shadow — the flat knot diagram, live. It
                           MERGES at every crossing, because a shadow has nothing
                           to say about which strand is on top. It must stay the
                           DARKEST mark on the plate, so it reads through the mass.
      Two registers, one lamp. Physically the same shadow, told twice. ── */
/* the penumbra's saturation floor — above the ink (5,5,5), below the air (20,19,18) */
const PENUMBRA_FLOOR = '12,11,10';
function plateGeom(view, vp) {
  const rim = [];
  for (let k = 0; k < 72; k++) {
    const a = k / 72 * 2 * Math.PI;
    rim.push(toScreen(project([Math.cos(a) * TT_R, Math.sin(a) * TT_R, TT_H], view.cam), vp));
  }
  return rim;
}

/* where a curve point lands on the plate, cast along the lamp */
function shadowPoint(view, p) {
  const L = view.lamp;
  const h = Math.max(0, p[2] - TT_H);
  const k = h / Math.max(0.3, L[2]);
  return { p: [p[0] - L[0] * k, p[1] - L[1] * k, TT_H + 0.002], h };
}

function drawPlate(cx, view, vp, W, H) {
  const cam = view.cam;
  // the room: a featureless floor wash, a plinth top catching the lamp
  const g = cx.createRadialGradient(vp.cx, vp.cy + vp.scale * 0.30, 0, vp.cx, vp.cy + vp.scale * 0.30, vp.scale * 1.5);
  g.addColorStop(0, '#171310'); g.addColorStop(0.55, '#0e0c0a'); g.addColorStop(1, '#070606');
  cx.fillStyle = g; cx.fillRect(0, 0, W, H);

  const rim = plateGeom(view, vp);
  cx.beginPath(); cx.moveTo(rim[0].x, rim[0].y);
  for (const s of rim) cx.lineTo(s.x, s.y); cx.closePath();
  const cen = toScreen(project([0, 0, TT_H], cam), vp);
  const tg = cx.createRadialGradient(cen.x, cen.y, 0, cen.x, cen.y, vp.scale * 0.62);
  tg.addColorStop(0, '#31281e'); tg.addColorStop(0.7, '#241d16'); tg.addColorStop(1, '#161109');
  cx.fillStyle = tg; cx.fill();

  cx.save(); cx.clip();
  cx.lineWidth = 1;
  for (let k = 0; k < 108; k++) {                    // the turned grooves
    const a = k / 108 * 2 * Math.PI, r0 = 0.30, r1 = TT_R * 0.985;
    const s0 = toScreen(project([Math.cos(a) * r0, Math.sin(a) * r0, TT_H], cam), vp);
    const s1 = toScreen(project([Math.cos(a) * r1, Math.sin(a) * r1, TT_H], cam), vp);
    cx.strokeStyle = (k % 9 === 0) ? 'rgba(160,132,92,0.10)' : 'rgba(150,124,86,0.040)';
    cx.beginPath(); cx.moveTo(s0.x, s0.y); cx.lineTo(s1.x, s1.y); cx.stroke();
  }

  // ── the PENUMBRA: soft per-sample blobs, the object's mass on the plate
  for (let i = 0; i < N; i++) {
    const s0 = shadowPoint(view, C[i]);
    const s = toScreen(project(s0.p, cam), vp); if (s.depth <= NEAR_EPS) continue;
    const rr = vp.scale * (0.070 + 0.19 * s0.h) * (FOCAL / s.depth);
    const al = 0.42 / (1 + 2.4 * s0.h);
    const rg = cx.createRadialGradient(s.x, s.y, 0, s.x, s.y, rr);
    rg.addColorStop(0, 'rgba(' + PENUMBRA_FLOOR + ',' + al.toFixed(3) + ')');
    rg.addColorStop(1, 'rgba(' + PENUMBRA_FLOOR + ',0)');
    cx.fillStyle = rg; cx.beginPath(); cx.arc(s.x, s.y, rr, 0, 7); cx.fill();
  }

  // ── the CORE shadow: the flat knot diagram, inked. One opaque closed stroke,
  //    so at every crossing it simply MERGES — it cannot draw the little gap the
  //    solid above it draws without trying. That is the whole thesis, unspoken.
  const ink = [];
  for (let i = 0; i <= N; i++) {
    const s0 = shadowPoint(view, C[i % N]);
    const s = toScreen(project(s0.p, cam), vp);
    ink.push(s.depth <= NEAR_EPS ? null : s);
  }
  const wCen = toScreen(project([0, 0, TT_H + 0.002], cam), vp);
  cx.lineWidth = Math.max(1.8, vp.scale * 0.036 * (FOCAL / Math.max(0.4, wCen.depth)));
  cx.lineJoin = 'round'; cx.lineCap = 'round';
  cx.strokeStyle = 'rgba(5,5,5,0.94)';
  cx.beginPath();
  let pen = false;
  for (const s of ink) {
    if (!s) { pen = false; continue; }
    if (!pen) { cx.moveTo(s.x, s.y); pen = true; } else cx.lineTo(s.x, s.y);
  }
  cx.stroke();
  cx.restore();

  // the plate's own turned edge
  cx.strokeStyle = 'rgba(168,138,96,0.30)'; cx.lineWidth = 1.4;
  cx.beginPath(); cx.moveTo(rim[0].x, rim[0].y);
  for (const s of rim) cx.lineTo(s.x, s.y); cx.closePath(); cx.stroke();

  // the registration mark, inlaid brass — the one thing that makes a turn
  // countable against a shape that looks the same every 120°.
  const mk = toScreen(project([TT_R * 0.90, 0, TT_H + 0.004], cam), vp);
  if (mk.depth > NEAR_EPS) {
    cx.fillStyle = 'rgba(214,178,116,0.85)';
    cx.beginPath(); cx.arc(mk.x, mk.y, Math.max(1.6, vp.scale * 0.012 * (FOCAL / mk.depth)), 0, 7); cx.fill();
  }
}

/* the lowest metal, and the plate's NEAREST rim point — a twin asks these to
   prove the casting never sinks through the bearing at either pitch extreme. */
function lowestMetal(cam, vp) {
  let best = null;
  for (const r of P) for (const p of r) {
    const s = toScreen(project(p, cam), vp);
    if (s.depth <= NEAR_EPS) continue;
    if (!best || s.y > best.y) best = s;             // canvas y grows DOWNWARD
  }
  return best;
}
function nearestRim(cam, vp) {
  let best = null;
  for (let k = 0; k < 360; k++) {
    const a = k / 360 * 2 * Math.PI;
    const s = toScreen(project([Math.cos(a) * TT_R, Math.sin(a) * TT_R, TT_H], cam), vp);
    if (s.depth <= NEAR_EPS) continue;
    if (!best || s.y > best.y) best = s;
  }
  return best;
}

// ===== END TREFOIL SCENE =====

/* HALL TWO'S POSTURE — a turntable, not free flight. Yaw turns the piece; pitch
   leans your head over it. The eye stays ABOVE the plate (you lean over a plinth,
   you do not crawl under it), and that clamp is what keeps the plate — painted
   BEFORE the solid — an honest surface rather than a decal.

   IT LIVES HERE, WITH THE SCENE, FOR THE SAME REASON N DOES. The page and the
   probe both receive it through the D bundle, so neither can carry a private copy.
   A probe holding its own idea of the posture would go green on the OLD numbers
   after someone retunes the room — a twin quietly blessing a pose that no longer
   exists. One source, two callers: retune it here and the twin retunes with it. */
const POSTURE = {
  shell: { limits: { pitchMin: 0.055, pitchMax: 1.16, dollyMin: 3.05, dollyMax: 6.20 },
           speed: 0.0072 },
  wheel: { tau: 3.4, max: 3.1, idle: 0.055, blend: 0.72 },
  home:  { yaw: 0.55, pitch: 0.42, roll: 0, dolly: 4.15 },
};

export {
  V, N, M, TUBE, TT_H, TT_R, SIT, REACH, C, P, NRM, AO, HOL, POSTURE,
  LAMP0, lampFor, viewDir, bronze, buildTube, drawPlate, plateGeom,
  shadowPoint, lowestMetal, nearestRim,
};
