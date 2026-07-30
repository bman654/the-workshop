/* ══════════════════════════════════════════════════════════════════════════
   shape.mjs — the cochlea's two and a half turns, and how to unroll them.
   DOM-free, no backtick.

   The membrane is a ribbon 35 mm long and a third of a millimetre wide, wound
   two and a half times round a cone.  A visitor needs to see it BOTH ways: as
   the snail shell it is (which is why it is called one), and as the straight
   ruler it behaves like (which is the only way an octave looks like a
   distance).  So the room unrolls it.

   The unrolling is not a lerp between two sets of points — that collapses the
   coil towards the line through its middle and looks like a spring being
   crushed.  It is an unrolling: the curve is stored as its own CURVATURE, in
   a twist-free (rotation-minimising) frame, and the whole curvature is scaled
   towards zero.  Arc length is exactly preserved at every stage, so the
   membrane is never stretched, and at u = 1 the curvature is zero everywhere
   and the ribbon is a straight rule of exactly the same length.

   The frame carried along the ribbon obeys

        dT/ds =  a U + b V
        dU/ds = -a T     + c V
        dV/ds = -b T - c U

   — three numbers per station, and they are the entire shape.  Scale all
   three by (1 - u), integrate again, and you have the unrolled family for
   free: at u = 1 the ribbon is straight AND untwisted.

   The third number matters.  A twist-FREE (parallel-transported) frame is the
   tidy choice and it is the wrong one here: the basilar membrane lies flat
   across each turn, pointing away from the axis, and a parallel frame does not
   — over two and a half turns it precesses far enough to stand the membrane on
   its edge, and the shell comes out as a coiled WALL instead of a coiled ramp.
   So the frame is pinned to the horizontal radial direction and the twist that
   costs is measured and stored, exactly like the curvature.
   ══════════════════════════════════════════════════════════════════════════ */

export const COIL = Object.freeze({
  turns:   2.55,     /* how many times round                                  */
  rBase:   1.00,     /* radius at the stapes, in units of the coil's own base */
  rApex:   0.26,     /* radius at the helicotrema                             */
  rise:    0.62,     /* how far the apex sits above the base                  */
  risePow: 1.35      /* the cone is not a cylinder: it climbs faster late     */
});

/** the raw coil, before arc-length reparameterisation. t in [0,1] */
function rawCoil(t, C = COIL) {
  const th = 2 * Math.PI * C.turns * t;
  const r = C.rBase * Math.pow(C.rApex / C.rBase, t);
  return [r * Math.cos(th), C.rise * Math.pow(t, C.risePow), r * Math.sin(th)];
}

function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function mul(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function len(a) { return Math.hypot(a[0], a[1], a[2]); }
function norm(a) { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/**
 * Build the curvature record of the coil: n+1 stations equally spaced in ARC
 * LENGTH, each carrying the two curvature components (a, b) in the
 * rotation-minimising frame.  Everything downstream reads only this.
 */
export function coilCurvature(n = 512, C = COIL) {
  /* 1. dense sample, cumulative arc length */
  const D = 8000;
  const pts = new Array(D + 1), cum = new Float64Array(D + 1);
  for (let i = 0; i <= D; i++) pts[i] = rawCoil(i / D, C);
  for (let i = 1; i <= D; i++) cum[i] = cum[i - 1] + len(sub(pts[i], pts[i - 1]));
  const total = cum[D];

  /* 2. resample at equal arc length */
  const P = new Array(n + 1);
  let j = 0;
  for (let i = 0; i <= n; i++) {
    const target = total * i / n;
    while (j < D && cum[j + 1] < target) j++;
    const seg = cum[j + 1] - cum[j] || 1;
    const f = Math.min(1, Math.max(0, (target - cum[j]) / seg));
    P[i] = add(pts[j], mul(sub(pts[Math.min(D, j + 1)], pts[j]), f));
  }
  const ds = total / n;

  /* 3. tangents first (central differences), THEN the curvature vector — the
     two are one station apart and mixing the spans halves every curvature,
     which unrolls a two-and-a-half-turn shell into a turn and a quarter. */
  const Tg = new Array(n + 1);
  for (let i = 0; i <= n; i++) {
    const i0 = Math.max(0, i - 1), i1 = Math.min(n, i + 1);
    Tg[i] = norm(sub(P[i1], P[i0]));
  }
  /* 4. pin the frame to the horizontal radial direction and record (a,b,c) */
  const A = new Float64Array(n + 1), B = new Float64Array(n + 1), Cw = new Float64Array(n + 1);
  const Uf = new Array(n + 1), Vf = new Array(n + 1);
  for (let i = 0; i <= n; i++) {
    const T = Tg[i];
    let rad = [P[i][0], 0, P[i][2]];
    if (len(rad) < 1e-9) rad = [1, 0, 0];
    let U = sub(norm(rad), mul(T, dot(norm(rad), T)));
    if (len(U) < 1e-9) U = norm(cross([0, 1, 0], T));
    U = norm(U);
    Uf[i] = U; Vf[i] = norm(cross(T, U));
  }
  for (let i = 0; i <= n; i++) {
    const i0 = Math.max(0, i - 1), i1 = Math.min(n, i + 1), span = (i1 - i0) * ds;
    const dT = mul(sub(Tg[i1], Tg[i0]), 1 / span);
    const dU = mul(sub(Uf[i1], Uf[i0]), 1 / span);
    A[i] = dot(dT, Uf[i]); B[i] = dot(dT, Vf[i]); Cw[i] = dot(dU, Vf[i]);
  }
  /* keep the coil's own starting pose, so u = 0 rebuilds the shell in the
     orientation it was designed in (apex up) instead of some arbitrary rigid
     image of it, and u = 1 unrolls FROM the base along the base's tangent. */
  return { n, ds, total, A, B, Cw, C, P0: P[0], T0: Tg[0], U0: Uf[0], V0: Vf[0] };
}

/**
 * Integrate the curvature record with everything scaled by (1 - u).
 * u = 0 is the coil; u = 1 is a straight rule of identical length.
 * Returns flat Float32Arrays: pos, tangent, width axis (U), face normal (V).
 */
export function buildCurve(rec, u, out) {
  const n = rec.n, ds = rec.ds, k = 1 - u;
  const N = n + 1;
  const pos = (out && out.pos) || new Float32Array(N * 3);
  const tan = (out && out.tan) || new Float32Array(N * 3);
  const wid = (out && out.wid) || new Float32Array(N * 3);
  const nrm = (out && out.nrm) || new Float32Array(N * 3);

  let p = rec.P0 ? rec.P0.slice() : [0, 0, 0];
  let T = rec.T0 ? rec.T0.slice() : [0, 0, 1];
  let U = rec.U0 ? rec.U0.slice() : [1, 0, 0];
  let V = rec.V0 ? rec.V0.slice() : cross(T, U);
  /* sub-steps keep the integration honest where the coil is tightest */
  const SUB = 4, h = ds / SUB;
  for (let i = 0; i <= n; i++) {
    pos[i * 3] = p[0]; pos[i * 3 + 1] = p[1]; pos[i * 3 + 2] = p[2];
    tan[i * 3] = T[0]; tan[i * 3 + 1] = T[1]; tan[i * 3 + 2] = T[2];
    wid[i * 3] = U[0]; wid[i * 3 + 1] = U[1]; wid[i * 3 + 2] = U[2];
    nrm[i * 3] = V[0]; nrm[i * 3 + 1] = V[1]; nrm[i * 3 + 2] = V[2];
    if (i === n) break;
    for (let q = 0; q < SUB; q++) {
      const f = (q + 0.5) / SUB;
      const a = k * (rec.A[i] * (1 - f) + rec.A[i + 1] * f);
      const b = k * (rec.B[i] * (1 - f) + rec.B[i + 1] * f);
      const c = k * (rec.Cw[i] * (1 - f) + rec.Cw[i + 1] * f);
      const Tn = norm(add(T, mul(add(mul(U, a), mul(V, b)), h)));
      const Un = add(add(U, mul(T, -a * h)), mul(V, c * h));
      const Vn = add(add(V, mul(T, -b * h)), mul(U, -c * h));
      p = add(p, mul(T, h));
      T = Tn;
      U = norm(sub(Un, mul(T, dot(Un, T))));
      V = norm(cross(T, U));
      if (dot(V, Vn) < 0) { U = mul(U, -1); V = mul(V, -1); }
    }
  }
  return { pos, tan, wid, nrm, N };
}

/** the membrane widens towards the apex — real, and the reason it softens */
export function widthAt(t, wBase, wApex) { return wBase + (wApex - wBase) * t; }
