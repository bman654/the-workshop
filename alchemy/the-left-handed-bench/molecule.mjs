// ============================================================================
//  alchemy/the-left-handed-bench/molecule.mjs — THE RENDER GEOMETRY. Ball-and-
//  stick for the molecule you tumble, and its mirror twin as a pale living-gold
//  socket it lives in. The analog of in-the-round/trefoil's scene.mjs: it supplies
//  PRIMITIVES (opaque 'face' quads), never pixels, so the estate's scene3d core
//  projects, sorts far→near and inter-occludes the two molecules from ONE list.
//
//  THE TWO INDEPENDENT DEGREES OF FREEDOM that ARE the delight:
//   • Rmol — the OBJECT tumble. The live molecule's atom centres are pre-rotated
//     by Rmol before project(); the ghost stays at Rghost = I. (A ball-and-stick
//     sphere is radially symmetric, so only its CENTRE moves under a turn — the
//     shading normal stays the world-radial direction, which is exactly right.)
//   • the camera — the ROOM orbit (scene3d applyDrag, via the shared shell).
//   Grab the molecule → you tumble IT; grab the void/ghost → you orbit the room.
//
//  DOM-free: every shade() closure paints into the ctx render() hands it, so the
//  page draws it and the Node twin renders it through a mock ctx — same geometry,
//  both sides. The page forge-inlines this file; the twins import it.
// ============================================================================

// ===== MOLECULE SCENE =====
"use strict";

import { matVec, v_sub, v_add, v_dot } from './core.mjs';

/* molecule Å coords → scene units (a comfortable unit box under the room camera) */
const MSCALE = 0.62;
/* bond stick radius (scene units) and its two-segment split so each half wears its
   own atom's colour, the ball-and-stick convention */
const BOND_R = 0.075;

/* the palette — atom colours rhyme with the Crystal Garden's metal salts, never
   the proving-bench teal. r = display radius (scene units, ball-and-stick, well
   under space-filling so the sticks read). */
const ELEM = {
  C:  { r: 0.285, col: [64, 64, 72],   name: 'carbon (the chiral centre)' },  // graphite
  H:  { r: 0.190, col: [226, 221, 205], name: 'hydrogen' },                    // bone
  F:  { r: 0.250, col: [96, 205, 178], name: 'fluorine' },                     // nickel-jade
  Cl: { r: 0.340, col: [92, 172, 108], name: 'chlorine' },                     // copper-green
  Br: { r: 0.415, col: [176, 78, 54],  name: 'bromine' },                      // rust-red
};
const GHOST_COL = [222, 182, 112];   // pale living-gold glass — the socket

/* the fixed room lamp (world space): high, over the left shoulder */
const LAMP = (() => { const v = [-0.42, -0.36, 0.83]; const m = Math.hypot(v[0], v[1], v[2]); return [v[0] / m, v[1] / m, v[2] / m]; })();

function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function rgb(c) { return 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')'; }

/* the camera view direction — matches scene3d's project() basis exactly */
function viewDir(cam) {
  const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  return [sy * cp, cy * cp, -sp];
}
/* the camera's right/up axes (world space) — the trackball tumbles about THESE */
function camBasis(cam) {
  const f = viewDir(cam);
  let r = [f[1], -f[0], 0];            // cross(f, worldUp=[0,0,1])
  const rl = Math.hypot(r[0], r[1], r[2]) || 1; r = [r[0] / rl, r[1] / rl, r[2] / rl];
  // up = cross(r, f)
  const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
  const ul = Math.hypot(u[0], u[1], u[2]) || 1;
  return { right: r, up: [u[0] / ul, u[1] / ul, u[2] / ul], fwd: f };
}
/* axis-angle → rotation matrix (Rodrigues), row-major 3×3 */
function axisAngle(ax, ang) {
  const l = Math.hypot(ax[0], ax[1], ax[2]) || 1; const x = ax[0] / l, y = ax[1] / l, z = ax[2] / l;
  const c = Math.cos(ang), s = Math.sin(ang), t = 1 - c;
  return [
    [t * x * x + c,     t * x * y - s * z, t * x * z + s * y],
    [t * x * y + s * z, t * y * y + c,     t * y * z - s * x],
    [t * x * z - s * y, t * y * z + s * x, t * z * z + c],
  ];
}
function mm(A, B) { const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { let s = 0; for (let k = 0; k < 3; k++) s += A[i][k] * B[k][j]; C[i][j] = s; } return C; }

/* THE TRACKBALL. A pointer delta on the molecule turns it in the CAMERA's frame:
   dx about the camera up-axis, dy about the camera right-axis. Pre-multiplied so
   the turn happens in world/eye space, not the object's own drifting frame. The
   handler and the payoff-liveness probe both come through here. */
function tumbleStep(Rmol, cam, dx, dy, speed) {
  const s = speed == null ? 0.008 : speed;
  const b = camBasis(cam);
  const Ry = axisAngle(b.up, dx * s);
  const Rx = axisAngle(b.right, dy * s);
  return mm(Ry, mm(Rx, Rmol));
}

/* ── the unit UV-sphere template, built once. verts are unit directions (== the
      shading normals); faces index them. A live atom just translates this by its
      (tumbled) centre and scales by its radius — no per-frame trig. ── */
function unitSphere(stacks, slices) {
  const verts = [], faces = [];
  for (let i = 0; i <= stacks; i++) {
    const phi = Math.PI * i / stacks, sp = Math.sin(phi), cpp = Math.cos(phi);
    for (let j = 0; j < slices; j++) {
      const th = 2 * Math.PI * j / slices;
      verts.push([sp * Math.cos(th), sp * Math.sin(th), cpp]);
    }
  }
  for (let i = 0; i < stacks; i++) for (let j = 0; j < slices; j++) {
    const a = i * slices + j, b = i * slices + (j + 1) % slices;
    const c = (i + 1) * slices + (j + 1) % slices, d = (i + 1) * slices + j;
    faces.push([a, b, c, d]);
  }
  return { verts, faces };
}
const SPH = unitSphere(11, 17);

/* shade one lit surface. `glass` → pale gold, translucent, with an additive rim so
   the socket reads as a shell you can see through. */
function shadeSurface(cx, sp, near, opt) {
  const n = opt.n, base = opt.base;
  const E = opt.eye;                       // unit vector toward the eye
  const dif = Math.max(0, v_dot(n, LAMP));
  const H = (() => { const h = [LAMP[0] + E[0], LAMP[1] + E[1], LAMP[2] + E[2]]; const m = Math.hypot(h[0], h[1], h[2]) || 1; return [h[0] / m, h[1] / m, h[2] / m]; })();
  const spec = Math.pow(Math.max(0, v_dot(n, H)), 42);
  const rim = Math.pow(1 - Math.max(0, v_dot(n, E)), 2.6);
  cx.beginPath(); cx.moveTo(sp[0].x, sp[0].y);
  for (let k = 1; k < sp.length; k++) cx.lineTo(sp[k].x, sp[k].y);
  cx.closePath();
  if (opt.glass) {
    let c = mix([26, 22, 15], base, 0.35 + 0.45 * dif);
    c = mix(c, [255, 244, 214], 0.5 * rim);            // additive-ish gold rim
    cx.globalAlpha = 0.13 + 0.16 * rim;
    cx.fillStyle = rgb(c); cx.fill();
    cx.globalAlpha = 1;
  } else {
    let c = mix([9, 9, 12], base, 0.22 + 0.78 * dif);   // ambient floor → lit body
    c = mix(c, mix(base, [255, 255, 255], 0.6), Math.pow(dif, 2.2) * 0.5);
    c = mix(c, [120, 150, 175], rim * 0.14);            // cool skylight rim
    c = mix(c, [255, 250, 235], Math.min(1, spec * 0.9));
    const t = near == null ? 0.5 : near;
    c = mix(c, [16, 15, 18], 0.16 * (1 - t));            // aerial depth
    cx.globalAlpha = 1;
    cx.fillStyle = rgb(c); cx.fill();
    cx.strokeStyle = cx.fillStyle; cx.lineWidth = 0.9; cx.stroke();  // seal hairline seams
  }
}

/* push one atom's sphere (translated + scaled template) as opaque or glass faces */
function pushSphere(out, center, radius, base, cam, glass, tag, atomIndex) {
  const E0 = viewDir(cam); const eye = [-E0[0], -E0[1], -E0[2]];
  const wv = SPH.verts.map((v) => [center[0] + v[0] * radius, center[1] + v[1] * radius, center[2] + v[2] * radius]);
  for (const f of SPH.faces) {
    const pts = [wv[f[0]], wv[f[1]], wv[f[2]], wv[f[3]]];
    const n = SPH.verts[f[0]];                 // radial normal (one corner is plenty at this tesselation)
    const nn = [(SPH.verts[f[0]][0] + SPH.verts[f[2]][0]) / 2, (SPH.verts[f[0]][1] + SPH.verts[f[2]][1]) / 2, (SPH.verts[f[0]][2] + SPH.verts[f[2]][2]) / 2];
    const nl = Math.hypot(nn[0], nn[1], nn[2]) || 1; const nrm = [nn[0] / nl, nn[1] / nl, nn[2] / nl];
    out.push({ k: 'face', cull: true, mol: tag, atom: atomIndex,
      pts, shade: (cx, s, near) => shadeSurface(cx, s, near, { n: nrm, base, eye, glass }) });
  }
}

/* push one bond (a two-segment cylinder, each half its atom's colour) */
function pushBond(out, a, b, colA, colB, cam, glass, tag) {
  const axis = v_sub(b, a); const len = Math.hypot(axis[0], axis[1], axis[2]) || 1;
  const u = [axis[0] / len, axis[1] / len, axis[2] / len];
  let ref = Math.abs(u[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1];
  let p1 = [u[1] * ref[2] - u[2] * ref[1], u[2] * ref[0] - u[0] * ref[2], u[0] * ref[1] - u[1] * ref[0]];
  const p1l = Math.hypot(p1[0], p1[1], p1[2]) || 1; p1 = [p1[0] / p1l, p1[1] / p1l, p1[2] / p1l];
  const p2 = [u[1] * p1[2] - u[2] * p1[1], u[2] * p1[0] - u[0] * p1[2], u[0] * p1[1] - u[1] * p1[0]];
  const E0 = viewDir(cam); const eye = [-E0[0], -E0[1], -E0[2]];
  const SEG = 12, STK = [0, 0.5, 1];
  const ring = (t) => {
    const c = v_add(a, [u[0] * len * t, u[1] * len * t, u[2] * len * t]);
    const r = [];
    for (let j = 0; j < SEG; j++) {
      const th = 2 * Math.PI * j / SEG, cx = Math.cos(th), sy = Math.sin(th);
      const off = [(p1[0] * cx + p2[0] * sy) * BOND_R, (p1[1] * cx + p2[1] * sy) * BOND_R, (p1[2] * cx + p2[2] * sy) * BOND_R];
      r.push({ p: v_add(c, off), n: [(p1[0] * cx + p2[0] * sy), (p1[1] * cx + p2[1] * sy), (p1[2] * cx + p2[2] * sy)] });
    }
    return r;
  };
  const rings = STK.map(ring);
  for (let s = 0; s < STK.length - 1; s++) {
    const col = s === 0 ? colA : colB;
    for (let j = 0; j < SEG; j++) {
      const j2 = (j + 1) % SEG;
      const A = rings[s][j], B = rings[s][j2], C = rings[s + 1][j2], D = rings[s + 1][j];
      const nrm = A.n;
      out.push({ k: 'face', cull: true, mol: tag, bond: true,
        pts: [A.p, B.p, C.p, D.p],
        shade: (cx, sp, near) => shadeSurface(cx, sp, near, { n: nrm, base: col, eye, glass }) });
    }
  }
}

/* world position of an atom: live atoms are tumbled by Rmol; the ghost stays at I.
   Both are scaled by MSCALE. The scene NEVER re-centres — coords come centred from
   core.mjs, so what you turn is what the math measured. */
function worldPos(atom, Rmol) {
  const p = [atom.p[0] * MSCALE, atom.p[1] * MSCALE, atom.p[2] * MSCALE];
  return Rmol ? matVec(Rmol, p) : p;
}

/* ── buildScene(cfg) → ONE flat scene array (live opaque + ghost glass). Rebuilt
      each frame because Rmol changes. cfg = { live, ghost, bonds, Rmol, cam }. ── */
function buildScene(cfg) {
  const out = [];
  const liveC = cfg.live.map((a) => worldPos(a, cfg.Rmol));
  const ghostC = cfg.ghost.map((a) => worldPos(a, null));
  // ghost FIRST (mostly behind), but the painter's sort is what actually orders them.
  for (let i = 0; i < cfg.ghost.length; i++)
    pushSphere(out, ghostC[i], (ELEM[cfg.ghost[i].el].r) * 1.02, GHOST_COL, cfg.cam, true, 'ghost', i);
  for (const [a, b] of cfg.bonds)
    pushBond(out, ghostC[a], ghostC[b], GHOST_COL, GHOST_COL, cfg.cam, true, 'ghost');
  for (let i = 0; i < cfg.live.length; i++)
    pushSphere(out, liveC[i], ELEM[cfg.live[i].el].r, ELEM[cfg.live[i].el].col, cfg.cam, false, 'live', i);
  for (const [a, b] of cfg.bonds)
    pushBond(out, liveC[a], liveC[b], ELEM[cfg.live[a].el].col, ELEM[cfg.live[b].el].col, cfg.cam, false, 'live');
  return out;
}

/* live/ghost atom world centres — the driver's overlays (star, tethers) and the
   probe's hit-test both read these, so nobody keeps a private copy of the pose. */
function liveCenters(cfg) { return cfg.live.map((a) => worldPos(a, cfg.Rmol)); }
function ghostCenters(cfg) { return cfg.ghost.map((a) => worldPos(a, null)); }

// ===== END MOLECULE SCENE =====

/* THE ROOM POSTURE — a molecule floating in a dark round (no bearing plate, so the
   eye may swing the fuller pitch of a free orbit). Lives here, with the geometry,
   for the reason the trefoil's does: the page and the probe both receive it, so
   neither can carry a stale copy — retune here and the twin retunes with it. */
const POSTURE = {
  shell: { limits: { pitchMin: -1.28, pitchMax: 1.28, dollyMin: 2.9, dollyMax: 7.5 }, speed: 0.008 },
  wheel: { tau: 3.2, max: 3.0, idle: 0.05, blend: 0.72 },
  home:  { yaw: 0.62, pitch: 0.30, roll: 0, dolly: 4.7 },
};

export {
  MSCALE, BOND_R, ELEM, GHOST_COL, LAMP, POSTURE,
  buildScene, liveCenters, ghostCenters, worldPos,
  tumbleStep, axisAngle, camBasis, viewDir, mm,
};
