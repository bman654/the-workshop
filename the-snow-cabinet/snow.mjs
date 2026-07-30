/* ═══════════════════════════════════════════════════════════════════════════
   THE SNOW CABINET — snow.mjs
   The whole growth model. Pure, DOM-free, deterministic given a seed.
   Inlined into index.src.html by the forge; imported by snow.test.mjs.

   ── WHAT THE MODEL IS ──────────────────────────────────────────────────────

   A snow crystal is a hexagonal prism. It has two kinds of face — the two flat
   BASAL caps (perpendicular to the c-axis) and the six PRISM walls around the
   rim — and its whole shape is decided by which of the two grows faster. That
   ratio flips twice as the air gets colder, which is the entire content of
   Nakaya's 1954 morphology diagram: plates near -2, needles near -5, plates and
   dendrites near -15, columns below -25.

   So the room carries exactly two hand-authored curves, ALPHA_PRISM(T) and
   ALPHA_BASAL(T) — the attachment coefficients of the two faces, read off that
   diagram. Everything else derives:

     * the RIM  (the outline you see face-on) grows by the Gravner-Griffeath
       cellular automaton on a hexagonal lattice: vapour diffuses, freezes onto
       the boundary, and a boundary site with one or two attached neighbours
       must accumulate `beta` before it may join. `beta` is 1/ALPHA_PRISM: a
       face that molecules stick to easily is a face with a low threshold.

     * the THICKNESS h(x) grows from a second, separate vapour field `dz` that
       flows OVER the plate and is eaten by it at rate ALPHA_BASAL. Deep inside
       a wide plate that field is starved, so the middle stops thickening while
       the rim keeps going — which is why a plate is a plate.

   There is NO branching rule anywhere in `step`. Read it. Branches are the
   diffusion field's doing: a bump reaches further into un-depleted vapour than
   the flat face beside it, so it eats more, so it grows, so it reaches further.
   Set `uniform:true` (vapour never depletes) and the very same rule makes only
   faceted hexagons, at any supersaturation, for ever. That is the one claim
   this room makes, and `snow.test.mjs` runs it.

   Reference: Gravner & Griffeath, "Modeling snow crystal growth II", Physica D
   237 (2008). Nakaya, "Snow Crystals: Natural and Artificial" (1954).
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── hex lattice ─────────────────────────────────────────────────────────────
   Axial coordinates (q, r). Cartesian x = q + r/2, y = r*sqrt(3)/2, so the six
   neighbours below are the six directions of a triangular lattice. Stored in a
   square array of side N with the origin at the middle; the corners of that
   square are outside the disc we ever use. */

export const NB = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

/** Hex (axial) distance from the origin — the number of steps to walk there. */
export function hexDist(q, r) {
  return (Math.abs(q) + Math.abs(q + r) + Math.abs(r)) / 2;
}

/** Axial -> Cartesian, in units of one cell spacing. */
export function hexToXY(q, r) { return [q + r * 0.5, r * 0.8660254037844386]; }

/** Rotate an axial coordinate by 60 degrees (one sixth of a turn). */
export function rot60(q, r) { return [-r, q + r]; }

/* ── the two curves that ARE the Nakaya diagram ──────────────────────────────
   Attachment coefficients, dimensionless, as a function of temperature in C —
   the fraction of the water molecules that strike a face and stay on it. They
   are written on a LOG scale because that is how they behave: a real face runs
   from about 0.005 to about 1, two and a half decades, and it is the ratio of
   the two that decides everything.

   Each is a floor plus two Gaussian windows. Positioned so that prism/basal
   crosses 1 at about -3.5, -9.5 and -22 C — the three habit reversals every
   ice physicist knows, and the only thing about snow that is typed into this
   file by hand. Nothing else here knows what a "plate" is. */

export function alphaPrism(T) {
  return 10 ** (-2.10
    + 1.90 * Math.exp(-(((T + 2.0) / 2.6) ** 2))     // the warm plate window
    + 2.10 * Math.exp(-(((T + 15.0) / 5.6) ** 2)));  // the great dendrite window
}

export function alphaBasal(T) {
  return 10 ** (-1.90
    + 1.55 * Math.exp(-(((T + 5.5) / 2.5) ** 2))     // needles and hollow columns
    + 1.35 * Math.exp(-(((T + 31.0) / 9.5) ** 2)));  // the cold column window
}

/** Which way the prism is running, as a signed number: >0 plate, <0 column. */
export function habitIndex(T) { return Math.log10(alphaPrism(T) / alphaBasal(T)); }

/** A short English name for the habit at (T, supersaturation). Display only. */
export function habitName(T, ss) {
  const k = habitIndex(T);
  if (k > 0.15) {
    if (ss > 0.19 && T < -10.5 && T > -19) return 'stellar dendrite';
    if (ss > 0.13 && T < -10.5 && T > -20) return 'sectored plate';
    if (ss > 0.16 && T > -4.5) return 'plate with branches';
    return T < -9 ? 'hexagonal plate' : 'thin plate';
  }
  if (k < -0.15) {
    if (ss > 0.15 && T > -8) return 'needle';
    if (T > -8.5) return 'hollow column';
    return ss > 0.14 ? 'capped column' : 'solid column';
  }
  return 'short prism';
}

/* ── (temperature, supersaturation) -> the automaton's parameters ────────────
   The only mapping in the file. Two lines carry all the content:
     beta  ~ 1 / alphaPrism   — a sticky face has a low threshold, so it runs
     basal ~     alphaBasal   — the cap eats the field over it at its own rate
   The rest (kappa, mu, gamma, theta) sit at the Gravner-Griffeath paper's own
   values, lightly scaled, and do not depend on where you are in the diagram. */
export function envAt(T, ss, opts = {}) {
  const ap = alphaPrism(T), ab = alphaBasal(T);
  const rho = 0.335 + 1.95 * ss;                   // far-field vapour density
  const beta = Math.max(1.15, Math.min(6.5, 1.05 + 0.75 / ap ** 0.55));
  return {
    T, ss, rho,
    beta,
    alpha: 0.02 + 0.30 * ap,      // 3-neighbour attachment: fills concavities
    theta: 0.020 + 0.055 * ap,    // ... only where the vapour is already thin
    kappa: 0.0045,                // fraction of arriving vapour that freezes hard
    mu: 0.008,                    // boundary mass that evaporates back
    gamma: 0.00006,               // crystal mass that evaporates back
    sigma: opts.sigma == null ? 3e-5 : opts.sigma,  // per-cell vapour noise
    basal: 0.150 * ab,            // c-axis growth rate off the `dz` field
    uniform: !!opts.uniform,      // TRUE = vapour never depletes (the control)
    /* SIX CLOUDS: a multiplier on the far-field vapour, per sixty-degree
       sector. Null (the default, and the truth) means one cloud: every arm is
       fed the same air, which is the only reason a snowflake is a snowflake. */
    sectors: opts.sectors || null,
  };
}

/* ── the crystal ─────────────────────────────────────────────────────────── */

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A fresh lattice with one frozen cell at the middle.
 * @param {number} N  side of the square store; must be odd. 401 is the room's.
 * @param {number} seed  RNG seed; the same seed regrows the same crystal.
 * @param {number} rho0  the vapour the chamber starts full of.
 */
export function makeCrystal(N = 401, seed = 1, rho0 = 0.6) {
  if (N % 2 === 0) N += 1;
  const H = (N - 1) >> 1, n = N * N;
  const s = {
    N, H, seed,
    att: new Uint8Array(n),
    b: new Float32Array(n),
    c: new Float32Array(n),
    d: new Float32Array(n).fill(rho0),
    dz: new Float32Array(n).fill(rho0),
    h: new Float32Array(n),
    born: new Int32Array(n).fill(-1),
    dist: new Int16Array(n),        // hex distance from the middle, precomputed
    sect: new Uint8Array(n),        // which sixty-degree sector a cell is in
    live: new Uint8Array(n),        // 1 = inside the disc we simulate
    steps: 0, rmax: 0, mass: 1, rand: mulberry32(seed),
    /* The reservoir is a RING that follows the crystal out: the cloud beyond the
       diffusion boundary layer, held at the current supersaturation. Without it
       the box is a sealed jar and changing the air outside it does nothing. */
    LBC: 30,
    Rlive: H - 2,
    path: [],                        // [{T, ss, step}] — the fall, for the record
  };
  for (let r = -H; r <= H; r++) for (let q = -H; q <= H; q++) {
    const i = (r + H) * N + (q + H), dd = hexDist(q, r);
    s.dist[i] = dd;
    if (dd <= s.Rlive) s.live[i] = 1;
    const xy = hexToXY(q, r);
    const a = Math.atan2(xy[1], xy[0]);
    s.sect[i] = Math.min(5, Math.floor(((a + 2 * Math.PI) % (2 * Math.PI)) / (Math.PI / 3)));
  }
  const mid = H * N + H;
  s.att[mid] = 1; s.c[mid] = 1; s.d[mid] = 0; s.h[mid] = 0.35; s.born[mid] = 0;
  return s;
}

/* Scratch buffers, grown on demand and shared between steps. */
let SCRATCH = null;
function scratch(n) {
  if (!SCRATCH || SCRATCH.nd.length < n) SCRATCH = { nd: new Float32Array(n), nz: new Float32Array(n) };
  return SCRATCH;
}

/**
 * One time step of the model. Everything that decides where ice goes is here.
 * There is no branching rule in it.
 */
export function step(s, env) {
  const { N, H, att, b, c, d, dz, h, dist, sect, live, born } = s;
  const { rho, beta, alpha, theta, kappa, mu, gamma, sigma, basal, uniform } = env;
  const SEC = env.sectors;
  const { nd, nz } = scratch(N * N);
  const rand = s.rand;

  // Only walk the part of the lattice the crystal can reach this step.
  const Rres = Math.min(s.Rlive, s.rmax + s.LBC);   // the reservoir ring
  const R = Math.min(s.Rlive, Rres + 1);
  const lo = H - R, hi = H + R;

  /* 1 — DIFFUSION.  Vapour random-walks. An attached neighbour is a wall: the
     cell sees its own value there instead, so no vapour crosses into ice.
     `uniform` is the control: the reservoir is everywhere, nothing depletes. */
  for (let ry = lo; ry <= hi; ry++) {
    const row = ry * N, r = ry - H;
    for (let qx = lo; qx <= hi; qx++) {
      const i = row + qx;
      if (!live[i] || att[i]) { nd[i] = 0; continue; }
      if (dist[i] >= Rres || uniform) { nd[i] = SEC ? rho * SEC[sect[i]] : rho; continue; }
      const q = qx - H;
      let sum = d[i];
      for (let k = 0; k < 6; k++) {
        const j = (r + NB[k][1] + H) * N + (q + NB[k][0] + H);
        sum += (att[j] || !live[j]) ? d[i] : d[j];
      }
      nd[i] = sum * 0.14285714285714285;
    }
  }

  /* 1b — the SECOND field: the vapour arriving on the flat CAPS, from directly
     above and below the plate. It is fed from out of the plane (the `+ lam *
     (rho - dz)` term, the boundary layer overhead) and eaten a little by the
     ice under it, so the deep middle of a broad plate is mildly starved while
     a lone tip sits in fresh air. */
  const lam = 0.006, eat = 0.020 * basal;
  for (let ry = lo; ry <= hi; ry++) {
    const row = ry * N, r = ry - H;
    for (let qx = lo; qx <= hi; qx++) {
      const i = row + qx;
      if (!live[i]) { nz[i] = 0; continue; }
      if (dist[i] >= Rres) { nz[i] = SEC ? rho * SEC[sect[i]] : rho; continue; }
      const q = qx - H;
      let sum = dz[i];
      for (let k = 0; k < 6; k++) {
        const j = (r + NB[k][1] + H) * N + (q + NB[k][0] + H);
        sum += live[j] ? dz[j] : dz[i];
      }
      let z = sum * 0.14285714285714285;
      z += lam * ((SEC ? rho * SEC[sect[i]] : rho) - z);
      if (att[i]) z -= eat * z;
      nz[i] = z;
    }
  }

  /* The update is SYNCHRONOUS. Cells that qualify this step go on `pending` and
     are frozen only after every cell has been judged — otherwise a cell would
     count a neighbour that attached earlier in the same scan, the rule would
     depend on the order the array happens to be walked, and the six arms would
     come out different for no physical reason at all. (They did. It cost an
     hour, and `snow.test.mjs` now pins the lattice's six-fold equivariance.) */
  const pending = s.pending || (s.pending = []);
  pending.length = 0;

  let rmax = s.rmax, mass = 0;
  for (let ry = lo; ry <= hi; ry++) {
    const row = ry * N, r = ry - H;
    for (let qx = lo; qx <= hi; qx++) {
      const i = row + qx;
      if (!live[i]) continue;
      const q = qx - H;
      let di = nd[i];
      const zi = nz[i];
      dz[i] = zi;

      if (att[i]) { d[i] = 0; mass += c[i]; continue; }

      // how many neighbours are already ice, how much vapour is around, and how
      // TALL the ice next door is — a new patch of prism wall is created at the
      // full height of the wall it grew out of, less a little for the lag
      let nAtt = 0, nSum = di, hNb = 0;
      for (let k = 0; k < 6; k++) {
        const j = (r + NB[k][1] + H) * N + (q + NB[k][0] + H);
        if (att[j]) { nAtt++; if (h[j] > hNb) hNb = h[j]; } else nSum += nd[j];
      }

      if (nAtt === 0) {
        /* 4b — NOISE. Vapour is not smooth; this is the only randomness. */
        if (sigma > 0) di *= (1 + (rand() < 0.5 ? -sigma : sigma));
        d[i] = di;
        continue;
      }

      /* 2 — FREEZING. A boundary cell takes everything that reached it: a
         little of it hardens into crystal, the rest waits as quasi-liquid. */
      let bi = b[i] + (1 - kappa) * di;
      let ci = c[i] + kappa * di;
      di = 0;

      /* 3 — ATTACHMENT. The only place a cell becomes ice.
             1 or 2 neighbours  — a face or an edge: needs `beta`.
             3 neighbours       — a notch: needs `alpha`, and only where the
                                  vapour has already thinned below `theta`.
             4 or more          — a hole: fills unconditionally. */
      let joins = false;
      if (nAtt >= 4) joins = true;
      else if (nAtt === 3) joins = (bi >= 1) || (nSum < theta && bi >= alpha);
      else joins = (bi >= beta);

      if (joins) {
        pending.push(i, ci + bi, H_INHERIT * hNb + 0.02);
        b[i] = 0; d[i] = 0;
      } else {
        /* 4 — MELTING. Some of what is stuck comes back off. */
        d[i] = di + mu * bi + gamma * ci;
        b[i] = (1 - mu) * bi;
        c[i] = (1 - gamma) * ci;
      }
    }
  }

  for (let k = 0; k < pending.length; k += 3) {
    const i = pending[k];
    att[i] = 1; c[i] = pending[k + 1]; h[i] = pending[k + 2]; born[i] = s.steps;
    const dd = dist[i]; if (dd > rmax) rmax = dd;
    mass += c[i];
  }

  /* c-AXIS GROWTH, in its own pass. The two flat caps advance at the basal
     attachment rate for as long as the crystal lives, so the oldest ice is the
     thickest. This CANNOT share the pass above: the attachment rule reads its
     neighbours' heights, and a height already bumped earlier in the same scan
     makes the rule depend on the order the array is walked. (It did. The six
     arms came out 0.007 apart and the twin caught it.) */
  for (let ry = lo; ry <= hi; ry++) {
    const row = ry * N;
    for (let qx = lo; qx <= hi; qx++) {
      const i = row + qx;
      if (att[i] && live[i]) h[i] += basal * dz[i];
    }
  }
  s.rmax = rmax; s.mass = mass; s.steps++;
  return s;
}

/** Run many steps at one fixed point of the diagram. */
export function grow(s, steps, T, ss, opts = {}) {
  const env = envAt(T, ss, opts);
  for (let i = 0; i < steps; i++) {
    if (s.rmax >= s.Rlive - s.LBC - 2) break;
    step(s, env);
  }
  s.path.push({ T, ss, step: s.steps });
  return s;
}

/** Run a fall: a polyline through the diagram, walked at a constant rate. */
export function fall(s, pts, steps, opts = {}) {
  if (!pts.length) return s;
  for (let i = 0; i < steps; i++) {
    if (s.rmax >= s.Rlive - s.LBC - 2) break;
    const u = pts.length === 1 ? 0 : (i / Math.max(1, steps - 1)) * (pts.length - 1);
    const k = Math.min(pts.length - 2, Math.floor(u)), f = pts.length === 1 ? 0 : u - k;
    const a = pts[k], bb = pts[Math.min(pts.length - 1, k + 1)];
    const T = a.T + (bb.T - a.T) * f, ss = a.ss + (bb.ss - a.ss) * f;
    step(s, envAt(T, ss, opts));
    if (i % 40 === 0) s.path.push({ T, ss, step: s.steps });
  }
  return s;
}

/* ── measures ────────────────────────────────────────────────────────────────
   Everything the room prints about a crystal is computed here, from the
   lattice, after the fact. None of it feeds back into the growth. */

/** Attached cells, boundary cells, and the ruggedness of the outline.
    A filled hexagon of the same area scores exactly 1; arms push it up. */
export function outline(s) {
  const { N, H, att, live } = s;
  let A = 0, P = 0;
  const R = Math.min(s.Rlive, s.rmax + 2), lo = H - R, hi = H + R;
  for (let ry = lo; ry <= hi; ry++) {
    const row = ry * N, r = ry - H;
    for (let qx = lo; qx <= hi; qx++) {
      const i = row + qx; if (!live[i]) continue;
      if (att[i]) { A++; continue; }
      const q = qx - H;
      for (let k = 0; k < 6; k++) {
        if (att[(r + NB[k][1] + H) * N + (q + NB[k][0] + H)]) { P++; break; }
      }
    }
  }
  // a filled hex of area A has radius R with A = 3R^2+3R+1, perimeter 6(R+1)
  const Rh = (-3 + Math.sqrt(9 - 12 * (1 - A))) / 6;
  const Ph = 6 * (Rh + 1);
  return { area: A, perim: P, ruggedness: A > 7 ? P / Ph : 1 };
}

/** Pearson correlation of the mass field against itself turned by 60 degrees.
    Nothing in `step` imposes this; it is measured after the fact. */
export function sixfold(s) {
  const { N, H, c, live } = s;
  const R = Math.min(s.Rlive - 1, s.rmax + 1);
  const a = [], bq = [];
  for (let r = -R; r <= R; r++) for (let q = -R; q <= R; q++) {
    if (hexDist(q, r) > R) continue;
    const [q2, r2] = rot60(q, r);
    const i = (r + H) * N + (q + H), j = (r2 + H) * N + (q2 + H);
    if (!live[i] || !live[j]) continue;
    a.push(c[i]); bq.push(c[j]);
  }
  return pearson(a, bq);
}

function pearson(a, b) {
  const n = a.length; if (n < 2) return 1;
  let ma = 0, mb = 0;
  for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
  ma /= n; mb /= n;
  let saa = 0, sbb = 0, sab = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - ma, y = b[i] - mb; saa += x * x; sbb += y * y; sab += x * y;
  }
  return (saa <= 0 || sbb <= 0) ? 1 : sab / Math.sqrt(saa * sbb);
}

/** Vapour reaching the far boundary sites versus the sheltered ones.
    This ratio IS the branching instability: a tip eats better than a notch. */
export function vaporReach(s) {
  const { N, H, att, d, live } = s;
  const R = Math.min(s.Rlive, s.rmax + 2), lo = H - R, hi = H + R;
  const rows = [];
  for (let ry = lo; ry <= hi; ry++) {
    const row = ry * N, r = ry - H;
    for (let qx = lo; qx <= hi; qx++) {
      const i = row + qx; if (!live[i] || att[i]) continue;
      const q = qx - H;
      let touch = false;
      for (let k = 0; k < 6; k++) if (att[(r + NB[k][1] + H) * N + (q + NB[k][0] + H)]) { touch = true; break; }
      if (touch) rows.push([hexDist(q, r), d[i]]);
    }
  }
  if (rows.length < 12) return { tip: 0, notch: 0, ratio: 1, n: rows.length };
  rows.sort((p, q) => p[0] - q[0]);
  const kq = Math.max(1, Math.floor(rows.length * 0.15));
  let tip = 0, notch = 0;
  for (let i = 0; i < kq; i++) { notch += rows[i][1]; tip += rows[rows.length - 1 - i][1]; }
  tip /= kq; notch /= kq;
  return { tip, notch, ratio: notch > 1e-9 ? tip / notch : Infinity, n: rows.length };
}

/** Plate or column? Mean half-thickness against the rim radius, both in cells. */
export function aspect(s) {
  const { N, H, att, h, live } = s;
  const R = Math.min(s.Rlive, s.rmax + 1), lo = H - R, hi = H + R;
  let sum = 0, n = 0, hmax = 0;
  for (let ry = lo; ry <= hi; ry++) {
    const row = ry * N;
    for (let qx = lo; qx <= hi; qx++) {
      const i = row + qx; if (!live[i] || !att[i]) continue;
      sum += h[i]; n++; if (h[i] > hmax) hmax = h[i];
    }
  }
  const meanH = n ? sum / n : 0;
  return { meanH, maxH: hmax, radius: s.rmax, ratio: s.rmax > 0 ? (2 * hmax) / (2 * s.rmax) : 0 };
}

/** Mean half-thickness at the hub against the mean out at the rim.
    A dendrite, whose tips race away from the caps, comes out tapered; a column,
    whose rim barely moves, comes out straight-sided. Both from one constant. */
export function taper(s) {
  const { N, H, att, h, dist } = s;
  const R = s.rmax; if (R < 6) return { hub: 0, rim: 0, ratio: 1 };
  let hub = 0, hn = 0, rim = 0, rn = 0;
  for (let ry = H - R; ry <= H + R; ry++) {
    const row = ry * N;
    for (let qx = H - R; qx <= H + R; qx++) {
      const i = row + qx; if (!att[i]) continue;
      const d = dist[i]; if (d > R) continue;
      if (d < R * 0.25) { hub += h[i]; hn++; }
      else if (d > R * 0.80) { rim += h[i]; rn++; }
    }
  }
  const a = hn ? hub / hn : 0, b = rn ? rim / rn : 0;
  return { hub: a, rim: b, ratio: b > 1e-9 ? a / b : 1 };
}

/** The thickness field as a plain w*w image, for a thumbnail or a texture. */
export function thicknessTile(s, w = 64) {
  const { N, H, h, att, live } = s;
  const R = Math.max(6, Math.min(s.Rlive, Math.ceil(s.rmax * 1.06)));
  const out = new Float32Array(w * w);
  const sc = (2 * R) / w;
  for (let py = 0; py < w; py++) for (let px = 0; px < w; px++) {
    const x = (px + 0.5 - w / 2) * sc, y = (py + 0.5 - w / 2) * sc;
    const r = Math.round(y / 0.8660254037844386), q = Math.round(x - r * 0.5);
    if (hexDist(q, r) > s.Rlive) continue;
    const i = (r + H) * N + (q + H);
    if (live[i] && att[i]) out[py * w + px] = h[i];
  }
  return out;
}

/** Pack (thickness, mass) into an RGBA byte texture for the page's shader.
    16 bits of thickness across R+G — an 8-bit height field bands its normals. */
export function packTexture(s, size, hScale) {
  const { N, H, att, h, c, live } = s;
  const R = Math.max(8, Math.min(s.Rlive, Math.ceil(s.rmax * 1.08)));
  const out = new Uint8Array(size * size * 4);
  const sc = (2 * R) / size;
  for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
    const x = (px + 0.5 - size / 2) * sc, y = (py + 0.5 - size / 2) * sc;
    const r = Math.round(y / 0.8660254037844386), q = Math.round(x - r * 0.5);
    const o = (py * size + px) * 4;
    if (hexDist(q, r) > s.Rlive) continue;
    const i = (r + H) * N + (q + H);
    if (!live[i] || !att[i]) continue;
    const v = Math.max(0, Math.min(1, h[i] / hScale));
    const u = Math.round(v * 65535);
    out[o] = u >> 8; out[o + 1] = u & 255;
    out[o + 2] = Math.max(0, Math.min(255, Math.round(c[i] * 120)));
    out[o + 3] = 255;
  }
  return { data: out, R, sc };
}

/* ── the recipe ──────────────────────────────────────────────────────────────
   What gets kept when a visitor keeps a crystal: the fall and the seed, not the
   picture. Thirty-odd bytes that regrow the same crystal, cell for cell. */

export function recipe(s, pts, steps, opts = {}) {
  return {
    v: 1, seed: s.seed, N: s.N, steps,
    pts: pts.map(p => [Math.round(p.T * 10) / 10, Math.round(p.ss * 1000) / 1000]),
    sigma: opts.sigma == null ? null : opts.sigma,
  };
}

export function regrow(rec) {
  const s = makeCrystal(rec.N, rec.seed);
  fall(s, rec.pts.map(p => ({ T: p[0], ss: p[1] })), rec.steps,
    rec.sigma == null ? {} : { sigma: rec.sigma });
  return s;
}

/* HOLD is the number of lattice steps one recorded sample of the fall governs.
   The live room uses exactly this: it reads the puck, rounds it, writes it down,
   and then holds the chamber at that air for HOLD steps. `replay` does the same
   arithmetic in the same order, which is why a kept crystal comes back cell for
   cell rather than merely similar. Change it in one place or in neither. */
export const HOLD = 30;

/* How much of its neighbour's height a new patch of prism wall is born with.
   This one number decides plate-versus-column FOR FREE, and it is worth the
   paragraph. A wall that grows outward extends over the whole height of the
   wall beside it, so the honest value is 1 — but a tip is genuinely rounded,
   so a sliver is lost. Losing a sliver per cell does NOT compound the way it
   looks like it would: a new cell then keeps growing at the cap rate, so the
   height a tip settles at is (f/(1-f)) x (cap speed / rim speed). A needle,
   whose rim barely moves, inherits essentially everything and comes out a
   straight-sided hexagonal column with flat ends; a dendrite, whose tips race,
   settles at a couple of cells and comes out a wafer with a thicker hub. One
   constant, both habits, no branching on which one we are in. */
export const H_INHERIT = 0.985;

/** The record a kept crystal is stored as: a seed and the air it fell through. */
export function logbook(seed, N, samples, opts = {}) {
  return {
    v: 2, seed, N, hold: HOLD,
    pts: samples.map(p => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 1000) / 1000]),
    sigma: opts.sigma == null ? null : opts.sigma,
  };
}

/** Regrow a kept crystal from its logbook, exactly. */
export function replay(rec, onStep) {
  const s = makeCrystal(rec.N, rec.seed);
  const opts = rec.sigma == null ? {} : { sigma: rec.sigma };
  const cap = s.Rlive - s.LBC - 2;
  for (let p = 0; p < rec.pts.length; p++) {
    const env = envAt(rec.pts[p][0], rec.pts[p][1], opts);
    for (let k = 0; k < (rec.hold || HOLD); k++) {
      if (s.rmax >= cap) return s;
      step(s, env);
    }
    if (onStep) onStep(s, p);
  }
  return s;
}

/* ── the falls the cabinet ships with ────────────────────────────────────── */
export const FALLS = [
  { id: 'fern', name: 'The stellar dendrite', note: 'a long fall at fifteen below, through wet air',
    pts: [{ T: -13.6, ss: 0.185 }, { T: -15.3, ss: 0.215 }] },
  { id: 'plate', name: 'The plain plate', note: 'the same cold, a third of the vapour',
    pts: [{ T: -12.4, ss: 0.052 }, { T: -13.2, ss: 0.060 }] },
  { id: 'needle', name: 'The needle', note: 'five below, where the caps win',
    pts: [{ T: -5.2, ss: 0.20 }, { T: -5.6, ss: 0.235 }] },
  { id: 'capped', name: 'The capped column', note: 'a column that fell into the plate band',
    pts: [{ T: -6.0, ss: 0.17 }, { T: -6.2, ss: 0.18 }, { T: -14.6, ss: 0.215 }] },
  { id: 'sectored', name: 'The sectored plate', note: 'cold and dry, then suddenly wet',
    pts: [{ T: -14.9, ss: 0.085 }, { T: -14.6, ss: 0.125 }, { T: -14.8, ss: 0.235 }] },
  { id: 'warm', name: 'The warm plate', note: 'just below freezing, barely growing',
    pts: [{ T: -1.9, ss: 0.135 }, { T: -2.4, ss: 0.175 }] },
];
