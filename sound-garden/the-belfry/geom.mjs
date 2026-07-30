/* ============================================================================
 *  THE BELFRY — geom.mjs   ·   what a bell chamber is made of
 *
 *  Zero-dependency, DOM-free ESM.  Builds indexed triangle meshes as plain
 *  typed arrays; it never touches WebGL and can be run and measured in Node.
 *
 *  Every part is built in the BELL'S OWN FRAME, with the origin ON THE GUDGEON
 *  AXIS and that axis along +Z, so that swinging the whole assembly is one
 *  rotation about Z and nothing has to be re-authored.  Mouth-down is -Y.
 *
 *  The local Z of every vertex is carried through to the shader as its own
 *  attribute: that is what makes the CUTAWAY possible.  A bell turns about Z,
 *  so the half-space z > 0 is a fixed wedge in the bell's own frame AND a fixed
 *  side of the picture — cut it away and you can watch the clapper for the
 *  whole revolution instead of losing it every time the bell turns over.
 *  ========================================================================= */

export class Mesh {
  constructor() {
    this.pos = []; this.nrm = []; this.col = []; this.idx = [];
    this.n = 0;
  }
  vert(x, y, z, nx, ny, nz, r, g, b) {
    this.pos.push(x, y, z); this.nrm.push(nx, ny, nz); this.col.push(r, g, b);
    return this.n++;
  }
  tri(a, b, c) { this.idx.push(a, b, c); }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  get counts() { return { verts: this.n, tris: this.idx.length / 3 }; }
  arrays() {
    return {
      pos: Float32Array.from(this.pos), nrm: Float32Array.from(this.nrm),
      col: Float32Array.from(this.col), idx: Uint32Array.from(this.idx),
      nTri: this.idx.length / 3, nVert: this.n,
    };
  }
  /* every triangle's vertices, so a Node twin can check winding and normals */
  faceNormal(t) {
    const [i, j, k] = [this.idx[3 * t], this.idx[3 * t + 1], this.idx[3 * t + 2]];
    const P = (m) => [this.pos[3 * m], this.pos[3 * m + 1], this.pos[3 * m + 2]];
    const a = P(i), b = P(j), c = P(k);
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const nx = u[1] * v[2] - u[2] * v[1], ny = u[2] * v[0] - u[0] * v[2], nz = u[0] * v[1] - u[1] * v[0];
    const L = Math.hypot(nx, ny, nz) || 1;
    return [nx / L, ny / L, nz / L];
  }
}

/* ── A SURFACE OF REVOLUTION ────────────────────────────────────────────────
 * profile: array of [radius, y] from top to bottom.  The axis is Y (in the
 * bell's own frame, before it is hung), and the caller maps it into place.
 * Normals come from the profile's own tangent, so a bell's shoulder is smooth
 * and its lip is not.
 */
export function revolve(mesh, profile, seg, opts = {}) {
  const col = opts.col || [0.55, 0.42, 0.20];
  const flip = opts.flip ? -1 : 1;            /* -1 for an inner surface */
  const yOff = opts.yOff || 0;
  const rows = [];
  const N = profile.length;
  for (let i = 0; i < N; i++) {
    /* profile tangent by central difference; the normal is the tangent turned */
    const a = profile[Math.max(0, i - 1)], b = profile[Math.min(N - 1, i + 1)];
    let tr = b[0] - a[0], ty = b[1] - a[1];
    const L = Math.hypot(tr, ty) || 1; tr /= L; ty /= L;
    const nr = ty * flip, ny = -tr * flip;
    const row = [];
    for (let s = 0; s <= seg; s++) {
      const th = (s / seg) * Math.PI * 2;
      const c = Math.cos(th), sn = Math.sin(th);
      row.push(mesh.vert(profile[i][0] * c, profile[i][1] + yOff, profile[i][0] * sn,
                         nr * c, ny, nr * sn, col[0], col[1], col[2]));
    }
    rows.push(row);
  }
  for (let i = 0; i < N - 1; i++) {
    for (let s = 0; s < seg; s++) {
      if (opts.flip) mesh.quad(rows[i][s], rows[i][s + 1], rows[i + 1][s + 1], rows[i + 1][s]);
      else mesh.quad(rows[i][s], rows[i + 1][s], rows[i + 1][s + 1], rows[i][s + 1]);
    }
  }
  return rows;
}

/* ── THE PROFILE OF AN ENGLISH BELL ─────────────────────────────────────────
 * Outer radius against depth, both as fractions of the MOUTH DIAMETER, read off
 * the classic shape: a flat crown, a shoulder, a long waist that swells into
 * the SOUNDBOW — the thick ring the clapper hits, which is where nearly all the
 * metal is — and then the flare to the lip.  Depth is 0.80 of the diameter,
 * which is what a bell founder's rule of thumb says.
 */
export const BELL_PROFILE_OUTER = [
  [0.075, 0.000], [0.150, 0.006], [0.200, 0.020], [0.232, 0.052],
  [0.252, 0.100], [0.266, 0.160], [0.279, 0.230], [0.294, 0.310],
  [0.313, 0.395], [0.337, 0.480], [0.367, 0.560], [0.404, 0.630],
  [0.443, 0.686], [0.472, 0.727], [0.489, 0.760], [0.497, 0.782],
  [0.500, 0.800],
];
/* wall thickness, same units: thin at the shoulder, thickest at the soundbow */
export const BELL_THICK = [
  0.022, 0.022, 0.021, 0.019, 0.017, 0.015, 0.014, 0.014,
  0.015, 0.018, 0.024, 0.033, 0.044, 0.052, 0.050, 0.040, 0.030,
];

export function bellProfileInner() {
  const out = [];
  for (let i = 0; i < BELL_PROFILE_OUTER.length; i++) {
    const [r, y] = BELL_PROFILE_OUTER[i];
    const t = BELL_THICK[i];
    /* offset along the inward profile normal */
    const a = BELL_PROFILE_OUTER[Math.max(0, i - 1)], b = BELL_PROFILE_OUTER[Math.min(BELL_PROFILE_OUTER.length - 1, i + 1)];
    let tr = b[0] - a[0], ty = b[1] - a[1];
    const L = Math.hypot(tr, ty) || 1; tr /= L; ty /= L;
    out.push([Math.max(0.004, r - ty * t), y + tr * t]);
  }
  return out;
}

/* ── ONE BELL, HUNG ─────────────────────────────────────────────────────────
 * diameter: mouth diameter in metres.  The gudgeon axis is the origin and the
 * crown sits `crownGap` below it (a bell is bolted to a headstock, so its crown
 * is a little under the axis — which is exactly what makes the whole thing a
 * pendulum that can be balanced mouth-up).
 */
export function bellMesh(diameter, opts = {}) {
  const m = opts.mesh || new Mesh();
  const seg = opts.seg || 44;
  const crownGap = opts.crownGap === undefined ? 0.10 * diameter : opts.crownGap;
  const bronze = opts.col || [0.52, 0.375, 0.175];
  const dark = [bronze[0] * 0.66, bronze[1] * 0.62, bronze[2] * 0.58];
  const S = diameter;
  const map = (p) => [p[0] * S, -(crownGap + p[1] * S)];
  const outer = BELL_PROFILE_OUTER.map(map);
  const inner = bellProfileInner().map(map);
  revolve(m, outer, seg, { col: bronze });
  revolve(m, inner, seg, { col: dark, flip: true });
  /* the lip: a ring joining the two, wound so it faces down */
  const o = outer[outer.length - 1], i2 = inner[inner.length - 1];
  const ro = [], ri = [];
  for (let s = 0; s <= seg; s++) {
    const th = (s / seg) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
    ro.push(m.vert(o[0] * c, o[1], o[0] * sn, 0, -1, 0, bronze[0], bronze[1], bronze[2]));
    ri.push(m.vert(i2[0] * c, i2[1], i2[0] * sn, 0, -1, 0, dark[0], dark[1], dark[2]));
  }
  for (let s = 0; s < seg; s++) m.quad(ro[s], ro[s + 1], ri[s + 1], ri[s]);
  /* the crown: a flat disc closing the top */
  const cTop = outer[0];
  const cc = m.vert(0, cTop[1], 0, 0, 1, 0, bronze[0] * 0.8, bronze[1] * 0.8, bronze[2] * 0.8);
  const rim = [];
  for (let s = 0; s <= seg; s++) {
    const th = (s / seg) * Math.PI * 2;
    rim.push(m.vert(cTop[0] * Math.cos(th), cTop[1], cTop[0] * Math.sin(th), 0, 1, 0,
                    bronze[0] * 0.8, bronze[1] * 0.8, bronze[2] * 0.8));
  }
  for (let s = 0; s < seg; s++) m.tri(cc, rim[s + 1], rim[s]);
  return m;
}

/* ── A BOX, axis-aligned, with sharp normals ────────────────────────────── */
export function box(m, cx, cy, cz, hx, hy, hz, col, inv) {
  const F = [
    [[1, 0, 0], [[1, 1, 1], [1, 1, -1], [1, -1, -1], [1, -1, 1]]],
    [[-1, 0, 0], [[-1, 1, -1], [-1, 1, 1], [-1, -1, 1], [-1, -1, -1]]],
    [[0, 1, 0], [[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]]],
    [[0, -1, 0], [[-1, -1, 1], [1, -1, 1], [1, -1, -1], [-1, -1, -1]]],
    [[0, 0, 1], [[-1, 1, 1], [1, 1, 1], [1, -1, 1], [-1, -1, 1]]],
    [[0, 0, -1], [[1, 1, -1], [-1, 1, -1], [-1, -1, -1], [1, -1, -1]]],
  ];
  /* `inv` turns the box inside out — normals in, winding reversed.  That is how
   * the chamber is built: with back-face culling on, an inverted room shows its
   * walls from the inside AND lets the camera stand outside and look in, because
   * the near walls are then back-facing and simply are not drawn.  Building the
   * room the obvious way instead gives you a beautiful view of the outside of a
   * grey box, which is what this room looked like for its first render. */
  const s = inv ? -1 : 1;
  for (const [n, vs] of F) {
    const ix = vs.map((v) => m.vert(cx + v[0] * hx, cy + v[1] * hy, cz + v[2] * hz,
                                    n[0] * s, n[1] * s, n[2] * s, col[0], col[1], col[2]));
    if (inv) m.quad(ix[0], ix[1], ix[2], ix[3]); else m.quad(ix[0], ix[3], ix[2], ix[1]);
  }
  return m;
}

/* ── A CYLINDER between two points ──────────────────────────────────────── */
export function tube(m, p0, p1, r0, r1, col, seg = 12, cap = true) {
  const d = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
  const L = Math.hypot(d[0], d[1], d[2]) || 1;
  const ax = [d[0] / L, d[1] / L, d[2] / L];
  let up = Math.abs(ax[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const u = norm(cross(up, ax)), v = cross(ax, u);
  const A = [], Bv = [];
  for (let s = 0; s <= seg; s++) {
    const th = (s / seg) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
    const nx = u[0] * c + v[0] * sn, ny = u[1] * c + v[1] * sn, nz = u[2] * c + v[2] * sn;
    A.push(m.vert(p0[0] + nx * r0, p0[1] + ny * r0, p0[2] + nz * r0, nx, ny, nz, col[0], col[1], col[2]));
    Bv.push(m.vert(p1[0] + nx * r1, p1[1] + ny * r1, p1[2] + nz * r1, nx, ny, nz, col[0], col[1], col[2]));
  }
  for (let s = 0; s < seg; s++) m.quad(A[s], A[s + 1], Bv[s + 1], Bv[s]);
  if (cap) {
    for (const [p, r, n, rev] of [[p0, r0, [-ax[0], -ax[1], -ax[2]], true], [p1, r1, ax, false]]) {
      const c0 = m.vert(p[0], p[1], p[2], n[0], n[1], n[2], col[0], col[1], col[2]);
      const ring = [];
      for (let s = 0; s <= seg; s++) {
        const th = (s / seg) * Math.PI * 2, cc = Math.cos(th), sn = Math.sin(th);
        const nx = u[0] * cc + v[0] * sn, ny = u[1] * cc + v[1] * sn, nz = u[2] * cc + v[2] * sn;
        ring.push(m.vert(p[0] + nx * r, p[1] + ny * r, p[2] + nz * r, n[0], n[1], n[2], col[0], col[1], col[2]));
      }
      for (let s = 0; s < seg; s++) { if (rev) m.tri(c0, ring[s + 1], ring[s]); else m.tri(c0, ring[s], ring[s + 1]); }
    }
  }
  return m;
}

export function sphere(m, c, r, col, seg = 16) {
  const rings = [];
  for (let i = 0; i <= seg / 2; i++) {
    const ph = (i / (seg / 2)) * Math.PI;
    const row = [];
    for (let s = 0; s <= seg; s++) {
      const th = (s / seg) * Math.PI * 2;
      const nx = Math.sin(ph) * Math.cos(th), ny = Math.cos(ph), nz = Math.sin(ph) * Math.sin(th);
      row.push(m.vert(c[0] + nx * r, c[1] + ny * r, c[2] + nz * r, nx, ny, nz, col[0], col[1], col[2]));
    }
    rings.push(row);
  }
  for (let i = 0; i < rings.length - 1; i++)
    for (let s = 0; s < seg; s++) m.quad(rings[i][s], rings[i][s + 1], rings[i + 1][s + 1], rings[i + 1][s]);
  return m;
}

/* ── THE WHEEL, THE HEADSTOCK, THE STAY ─────────────────────────────────────
 * The wheel is what makes full-circle ringing possible at all: the rope leaves
 * it on a tangent and stays on it through most of a revolution, so the ringer
 * can put force in at the bottom of the swing AND take the bell up to the
 * balance at the top.  A chiming lever cannot do either.
 */
export function wheelMesh(m, R, halfWidth, z, opts = {}) {
  const oak = opts.col || [0.205, 0.126, 0.062];
  const seg = opts.seg || 40;
  /* rim: an annulus of small depth, with the shroud (the outer wall the rope
   * runs against) standing proud on one side */
  const inner = R * 0.90;
  for (const zz of [z - halfWidth, z + halfWidth]) {
    const sgn = zz > z ? 1 : -1;
    const o = [], i2 = [];
    for (let s = 0; s <= seg; s++) {
      const th = (s / seg) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
      o.push(m.vert(R * c, R * sn, zz, 0, 0, sgn, oak[0], oak[1], oak[2]));
      i2.push(m.vert(inner * c, inner * sn, zz, 0, 0, sgn, oak[0], oak[1], oak[2]));
    }
    for (let s = 0; s < seg; s++) {
      if (sgn > 0) m.quad(o[s], o[s + 1], i2[s + 1], i2[s]);
      else m.quad(o[s], i2[s], i2[s + 1], o[s + 1]);
    }
  }
  /* the outer band (the sole) */
  const a = [], b = [];
  for (let s = 0; s <= seg; s++) {
    const th = (s / seg) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
    a.push(m.vert(R * c, R * sn, z - halfWidth, c, sn, 0, oak[0] * 1.15, oak[1] * 1.15, oak[2] * 1.15));
    b.push(m.vert(R * c, R * sn, z + halfWidth, c, sn, 0, oak[0] * 1.15, oak[1] * 1.15, oak[2] * 1.15));
  }
  for (let s = 0; s < seg; s++) m.quad(a[s], a[s + 1], b[s + 1], b[s]);
  /* spokes */
  const nSp = opts.spokes || 8;
  for (let k = 0; k < nSp; k++) {
    const th = (k / nSp) * Math.PI * 2 + 0.19;
    const c = Math.cos(th), sn = Math.sin(th);
    tube(m, [c * R * 0.14, sn * R * 0.14, z], [c * inner, sn * inner, z], R * 0.028, R * 0.024, oak, 6);
  }
  return m;
}

/* ── THE WHOLE HUNG BELL, in its own frame ─────────────────────────────────
 * Returns TWO meshes, because they move differently: `bell` (bell + headstock +
 * wheel + stay, all one rigid body turning by theta) and `clapper` (turning by
 * phi about a pivot d below the axis).
 */
export function hungBell(spec) {
  const D = spec.diameter;
  const bell = new Mesh();
  bellMesh(D, { mesh: bell, seg: spec.seg || 44, col: spec.bronze });
  /* headstock: a beam across the crown, and the two gudgeon stubs */
  const oak = [0.175, 0.104, 0.053];
  box(bell, 0, 0.012 * D, 0, 0.30 * D, 0.075 * D, 0.115 * D, oak);
  const steel = [0.30, 0.31, 0.335];
  tube(bell, [0, 0, -0.175 * D], [0, 0, 0.175 * D], 0.030 * D, 0.030 * D, steel, 10);
  /* the stay: an ash bar standing up from the headstock.  In a real tower it
   * runs into a sliding bar on the frame and is the only thing between a bell
   * at the balance and a bell over the top. */
  box(bell, 0, 0.36 * D, 0.155 * D, 0.030 * D, 0.29 * D, 0.030 * D, [0.46, 0.38, 0.24]);
  /* the wheel, on the far side */
  wheelMesh(bell, 0.74 * D, 0.035 * D, -0.30 * D, { spokes: 8 });
  /* the clapper, in ITS own frame: pivot at the origin, hanging down -Y */
  const clap = new Mesh();
  const iron = [0.20, 0.195, 0.20];
  tube(clap, [0, 0, 0], [0, -spec.lc * 0.86, 0], 0.026 * D, 0.020 * D, iron, 10);
  sphere(clap, [0, -spec.lc, 0], spec.ballR, [0.30, 0.285, 0.275], 18);
  tube(clap, [0, -spec.lc - spec.ballR * 0.6, 0], [0, -spec.lc - spec.ballR * 3.1, 0],
       0.016 * D, 0.010 * D, iron, 8);
  return { bell: bell.arrays(), clapper: clap.arrays() };
}
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function norm(a) { const L = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / L, a[1] / L, a[2] / L]; }
