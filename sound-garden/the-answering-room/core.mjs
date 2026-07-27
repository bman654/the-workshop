// ============================================================================
//  THE ANSWERING ROOM — the ROOM CORE. Pure, DOM-free, dependency-free.
//
//  One idea, carried all the way down: a reflection in a flat wall is EXACTLY a
//  straight line from a MIRROR IMAGE of the source. So a rectangular room's echo
//  pattern is not a simulation of bouncing — it is a LATTICE. Mirror the room
//  through its own six walls, and again, and again, and the whole infinite family
//  of echoes is just the set of image sources in that tiling, each heard along a
//  straight line, each dimmed by the walls it passed through.
//
//    · imageAxis(L, s, r, Rmax)  — the 1-D image ladder along one axis, with the
//        two wall-hit counts that Allen & Berkley (1979) derived:
//              x(m,u) = (1-2u)·s + 2·m·L      u ∈ {0,1},  m ∈ ℤ
//              hits at the wall x=0   :  |m − u|
//              hits at the wall x=L   :  |m|
//    · imageSources(room, opt)   — the 3-D product of three ladders, distance-culled.
//    · renderIR(room, opt)       — sums them into a 3-BAND impulse response
//        (low <500 Hz · mid · high >2 kHz), each band with its own absorption and
//        its own air loss, then crossover-filters and adds the bands into one IR.
//    · schroeder(ir, sr)         — backward energy integration → EDC → T30.
//    · sabineT60 / eyringT60     — the two textbook formulas, for the comparison.
//
//  THE CLAIM THIS CORE EXISTS TO SETTLE. Every textbook gives a room ONE number.
//  Sabine's law (T60 = 0.161·V/ΣSα) and Eyring's (T60 = 0.161·V/−S·ln(1−ᾱ)) are
//  both a single straight line drawn through a room's decay. The mirror lattice
//  assumes no such thing — it is pure geometry, with no diffuse field anywhere in
//  its derivation — so it can be asked whether the line is straight. It is not:
//
//    · THE TAIL ALWAYS BENDS FLATTER. Fit the late half of the decay and you get a
//      longer T60 than the early half — in every room where the measurement is
//      admissible at all, by ×1.16 to ×1.64. Late sound is the sound that got
//      LUCKY: of all the paths still going at half a second, the survivors are the
//      ones that happened to hit fewer walls than average, so the mean loss per
//      second keeps falling. Both formulas take the average reflection count and
//      never its spread, so neither has a bend to give.
//    · EYRING IS RIGHT WHERE IT WAS DERIVED. In a live room (ᾱ ≤ 0.1) the mirrors'
//      energy falls within 15 % of Eyring's rate — ×1.01 at ᾱ = 0.02, with r² 0.99.
//      Push ᾱ to 0.9 — a foam-lined cell — and they ring 1.9× longer than Eyring
//      says and 0.7× as long as Sabine: the two textbook laws end up bracketing the
//      truth from opposite sides, and the room they were written for is gone.
//
//  AND THE ABSTENTION. ISO 3382 refuses to name a decay time unless the response
//  falls 25 dB, and so does this: a room too live for the mirrors you can afford
//  gets told so, not given a lenient verdict. `bendTest().resolvable` is that gate.
//
//  Both are falsifiable statements about numbers, and core.test.mjs confirms or
//  falsifies them over a grid of rooms and materials on every run.
//
//  BAND EDGES + MATERIALS. Three bands is the fewest that can say the one thing
//  every ear knows about rooms: carpet eats the top, plaster does not. The α
//  triples below are the standard published octave-band coefficients rounded to
//  the three bands (125 Hz / 1 kHz / 4 kHz representatives).
// ============================================================================

// ===== ROOM CORE BEGIN =====
"use strict";

const C_AIR = 343;                 // m/s, dry air at 20 °C — the one speed literal
const BAND_LO_HZ = 500;            // low | mid crossover
const BAND_HI_HZ = 2000;           // mid | high crossover

// air absorption, PRESSURE nepers per metre (50 % RH, 20 °C, rounded per band)
const AIR_M = [0.0002, 0.0012, 0.0090];

// The surface palette. `a` = absorption coefficient per band [low, mid, high].
const MATERIALS = [
  { id: 'plaster', name: 'Plaster',        a: [0.02, 0.02, 0.04], col: '#e2d9c6' },
  { id: 'brick',   name: 'Bare brick',     a: [0.03, 0.04, 0.07], col: '#b4705a' },
  { id: 'glass',   name: 'Glass',          a: [0.18, 0.05, 0.02], col: '#8fc7d8' },
  { id: 'wood',    name: 'Wood panelling', a: [0.15, 0.10, 0.08], col: '#c08a45' },
  { id: 'audience',name: 'A seated crowd', a: [0.35, 0.80, 0.75], col: '#9d7fae' },
  { id: 'carpet',  name: 'Thick carpet',   a: [0.08, 0.35, 0.65], col: '#a34d47' },
  { id: 'curtain', name: 'Heavy curtain',  a: [0.14, 0.55, 0.70] , col: '#6f5f9c' },
  { id: 'foam',    name: 'Acoustic foam',  a: [0.35, 0.90, 0.95], col: '#4a5b62' },
  { id: 'open',    name: 'Open to the sky',a: [1.00, 1.00, 1.00], col: '#2b3a44' },
];
const MAT = {}; for (const m of MATERIALS) MAT[m.id] = m;

// The six surfaces, in the order the room object lists them.
const FACES = [
  { id: 'x0', axis: 0, side: 0, name: 'West wall'  },
  { id: 'x1', axis: 0, side: 1, name: 'East wall'  },
  { id: 'y0', axis: 1, side: 0, name: 'North wall' },
  { id: 'y1', axis: 1, side: 1, name: 'South wall' },
  { id: 'z0', axis: 2, side: 0, name: 'Floor'      },
  { id: 'z1', axis: 2, side: 1, name: 'Ceiling'    },
];

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

/* A room: { L:[W,D,H], src:[x,y,z], rec:[x,y,z], mats:{x0,x1,y0,y1,z0,z1} }.
   makeRoom fills in sane defaults and keeps source/receiver inside the box. */
function makeRoom(o) {
  o = o || {};
  const L = (o.L || [7.2, 5.4, 3.2]).slice();
  // the room you land in: wood-panelled walls, a carpet, a plaster ceiling — live
  // enough to have a tail, dead enough that 300 000 mirrors can measure it
  const mats = Object.assign({ x0:'wood', x1:'wood', y0:'wood', y1:'wood', z0:'carpet', z1:'plaster' }, o.mats || {});
  const inside = (p) => [clamp(p[0], 0.15, L[0]-0.15), clamp(p[1], 0.15, L[1]-0.15), clamp(p[2], 0.15, L[2]-0.15)];
  return {
    L,
    src: inside(o.src || [L[0]*0.28, L[1]*0.30, 1.55]),
    rec: inside(o.rec || [L[0]*0.72, L[1]*0.74, 1.62]),
    mats,
  };
}

function volume(room) { return room.L[0]*room.L[1]*room.L[2]; }
function faceArea(room, f) {
  const L = room.L, a = f.axis;
  return a === 0 ? L[1]*L[2] : a === 1 ? L[0]*L[2] : L[0]*L[1];
}
function surfaceArea(room) { let S = 0; for (const f of FACES) S += faceArea(room, f); return S; }

/* Area-weighted mean absorption in one band — the ᾱ both textbook formulas use. */
function meanAlpha(room, band) {
  let S = 0, sa = 0;
  for (const f of FACES) {
    const A = faceArea(room, f), al = MAT[room.mats[f.id]].a[band];
    S += A; sa += A * al;
  }
  return { S, sa, abar: sa / S };
}

/* Sabine 1900:  T60 = 0.161·V / (Σ S·α + 4·m·V)   (m = energy air-absorption /m) */
function sabineT60(room, band, withAir) {
  const V = volume(room), { sa } = meanAlpha(room, band);
  const air = withAir === false ? 0 : 4 * (2*AIR_M[band]) * V;   // energy m = 2× pressure m
  const denom = sa + air;
  return denom > 1e-9 ? 0.161 * V / denom : Infinity;
}
/* Eyring 1930:  T60 = 0.161·V / (−S·ln(1−ᾱ) + 4·m·V) — the mirror lattice's own law */
function eyringT60(room, band, withAir) {
  const V = volume(room), { S, abar } = meanAlpha(room, band);
  if (abar >= 0.999999) return 0;
  const air = withAir === false ? 0 : 4 * (2*AIR_M[band]) * V;
  const denom = -S * Math.log(1 - abar) + air;
  return denom > 1e-9 ? 0.161 * V / denom : Infinity;
}

/* ── the 1-D image ladder ─────────────────────────────────────────────────────
   Every image of `s` along one axis of a room of length L, whose distance from
   the receiver coordinate `r` is ≤ Rmax. Returns {p, n0, n1} per image:
   p = image coordinate, n0/n1 = reflections off the two walls of this axis. */
function imageAxis(L, s, r, Rmax) {
  const out = [];
  // p(m,u) = (1-2u)s + 2mL ; want |p - r| ≤ Rmax  →  m within (r ± Rmax - (1-2u)s)/2L
  for (let u = 0; u <= 1; u++) {
    const base = (1 - 2*u) * s;
    const mLo = Math.ceil((r - Rmax - base) / (2*L));
    const mHi = Math.floor((r + Rmax - base) / (2*L));
    for (let m = mLo; m <= mHi; m++) {
      out.push({ p: base + 2*m*L, n0: Math.abs(m - u), n1: Math.abs(m) });
    }
  }
  out.sort((a, b) => Math.abs(a.p - r) - Math.abs(b.p - r));
  return out;
}

/* The exact geometric identity the whole room rests on: for a first-order image,
   the straight line to the image and the folded path source→wall→receiver have
   the same length, and they cross the wall at the same point. Returns the hit
   point and both lengths so a page (or a test) can hold them up side by side. */
function foldedPath(room, faceId) {
  const f = FACES.find(q => q.id === faceId);
  const a = f.axis, wall = f.side === 0 ? 0 : room.L[a];
  const s = room.src.slice(), r = room.rec.slice();
  const img = s.slice(); img[a] = 2*wall - s[a];
  // parametrise img→r; it crosses the wall plane at t where coordinate a equals `wall`
  const t = (wall - img[a]) / (r[a] - img[a]);
  const hit = [0,1,2].map(k => img[k] + t*(r[k] - img[k]));
  const d = (p, q) => Math.hypot(p[0]-q[0], p[1]-q[1], p[2]-q[2]);
  return { face: f, img, hit, straight: d(img, r), folded: d(s, hit) + d(hit, r), inside:
    hit.every((c, k) => k === a || (c >= -1e-9 && c <= room.L[k] + 1e-9)) };
}

/* ── the 3-D lattice ──────────────────────────────────────────────────────────
   Every image source within Rmax of the receiver, with its per-band pressure
   gain (wall reflections × air loss × 1/d) and its arrival time.
   opt.maxCount caps the work; opt.order caps the reflection order.
   Returns { list, Rmax, truncated } — list sorted by arrival time.        */
function imageSources(room, opt) {
  opt = opt || {};
  const L = room.L, s = room.src, r = room.rec;
  let Rmax = opt.Rmax != null ? opt.Rmax : 120;
  const maxCount = opt.maxCount || 300000;
  // density is exactly one image per room volume, so cap the radius by the budget
  const Rcap = Math.cbrt(maxCount * volume(room) * 3 / (4 * Math.PI));
  const truncated = Rmax > Rcap;
  if (truncated) Rmax = Rcap;

  const ax = [
    imageAxis(L[0], s[0], r[0], Rmax),
    imageAxis(L[1], s[1], r[1], Rmax),
    imageAxis(L[2], s[2], r[2], Rmax),
  ];
  // pressure reflection coefficients β = √(1−α), per band, per wall
  const beta = {};
  for (const f of FACES) {
    const al = MAT[room.mats[f.id]].a;
    beta[f.id] = [Math.sqrt(Math.max(0, 1-al[0])), Math.sqrt(Math.max(0, 1-al[1])), Math.sqrt(Math.max(0, 1-al[2]))];
  }
  const maxOrder = opt.order != null ? opt.order : Infinity;
  const R2 = Rmax * Rmax;
  const list = [];
  for (const ix of ax[0]) {
    const dx = ix.p - r[0], dx2 = dx*dx;
    if (dx2 > R2) continue;
    for (const iy of ax[1]) {
      const dy = iy.p - r[1], dxy2 = dx2 + dy*dy;
      if (dxy2 > R2) continue;
      const ord2 = ix.n0 + ix.n1 + iy.n0 + iy.n1;
      if (ord2 > maxOrder) continue;
      for (const iz of ax[2]) {
        const dz = iz.p - r[2], d2 = dxy2 + dz*dz;
        if (d2 > R2) continue;
        const order = ord2 + iz.n0 + iz.n1;
        if (order > maxOrder) continue;
        const d = Math.sqrt(d2);
        if (d < 1e-4) continue;
        const g = [0, 0, 0];
        for (let b = 0; b < 3; b++) {
          const w = Math.pow(beta.x0[b], ix.n0) * Math.pow(beta.x1[b], ix.n1)
                  * Math.pow(beta.y0[b], iy.n0) * Math.pow(beta.y1[b], iy.n1)
                  * Math.pow(beta.z0[b], iz.n0) * Math.pow(beta.z1[b], iz.n1);
          g[b] = w * Math.exp(-AIR_M[b] * d) / d;
        }
        if (g[0] + g[1] + g[2] < 1e-7) continue;
        list.push({ p: [ix.p, iy.p, iz.p], d, t: d / C_AIR, order, g,
                    n: [ix.n0, ix.n1, iy.n0, iy.n1, iz.n0, iz.n1] });
      }
    }
  }
  list.sort((a, b) => a.d - b.d);
  return { list, Rmax, truncated };
}

/* ── biquads (Butterworth 2nd order; cascade two for a Linkwitz–Riley 4th) ──── */
function biquadLP(fc, sr) {
  const w = 2*Math.PI*fc/sr, c = Math.cos(w), s = Math.sin(w), q = Math.SQRT1_2;
  const al = s/(2*q), a0 = 1+al;
  return [ (1-c)/2/a0, (1-c)/a0, (1-c)/2/a0, -2*c/a0, (1-al)/a0 ];
}
function biquadHP(fc, sr) {
  const w = 2*Math.PI*fc/sr, c = Math.cos(w), s = Math.sin(w), q = Math.SQRT1_2;
  const al = s/(2*q), a0 = 1+al;
  return [ (1+c)/2/a0, -(1+c)/a0, (1+c)/2/a0, -2*c/a0, (1-al)/a0 ];
}
function runBiquad(buf, c) {
  let z1 = 0, z2 = 0;
  const [b0, b1, b2, a1, a2] = c;
  for (let i = 0; i < buf.length; i++) {
    const x = buf[i], y = b0*x + z1;
    z1 = b1*x - a1*y + z2;
    z2 = b2*x - a2*y;
    buf[i] = y;
  }
  return buf;
}

/* ── the impulse response ─────────────────────────────────────────────────────
   Sum every image into three band buffers, band-filter, add. Each tap is placed
   with linear fractional-delay interpolation — an integer-rounded tap would put
   a ±11 µs error on every echo and comb the top octave to pieces.            */
function renderIR(room, opt) {
  opt = opt || {};
  const sr = opt.sr || 48000;
  const budget = opt.maxCount || 300000;
  // aim the radius at the longest thing the room could plausibly still be saying
  const tGuess = Math.max(eyringT60(room, 0), eyringT60(room, 1));
  const aim = opt.Rmax != null ? opt.Rmax : C_AIR * Math.min(2.2, tGuess * 1.25 + 0.08);
  const IS = imageSources(room, { Rmax: aim, maxCount: budget, order: opt.order });
  const nMax = Math.ceil(IS.Rmax / C_AIR * sr) + 8;

  /* ── TWO EARS, AND WHY THEY ARE HONEST ──────────────────────────────────────
     With `ears` set, the same lattice is summed twice, at two points 17 cm apart.
     Nothing is invented: each ear gets its OWN distance to every mirror, so the
     left ear hears the west wall a fraction of a millisecond before the right one
     and very slightly louder, exactly as the geometry says. That is where the
     width of a real room comes from, and it costs one extra distance per mirror.
     The MEASUREMENT always reads the first ear's bands — one point in the room,
     no averaging, nothing smoothed. */
  const ear = opt.ears || 0;
  const pts = [room.rec.slice()];               // chans[0] is ALWAYS the centre — the measured point
  if (ear > 0) {
    pts.push([room.rec[0]-ear/2, room.rec[1], room.rec[2]]);
    pts.push([room.rec[0]+ear/2, room.rec[1], room.rec[2]]);
  }
  const chans = pts.map(() => [new Float32Array(nMax), new Float32Array(nMax), new Float32Array(nMax)]);
  const bands = chans[0];
  for (const im of IS.list) {
    for (let c = 0; c < pts.length; c++) {
      let d = im.d, gsc = 1;
      if (ear > 0) {
        const p = pts[c];
        d = Math.hypot(im.p[0]-p[0], im.p[1]-p[1], im.p[2]-p[2]);
        gsc = im.d / Math.max(0.05, d);          // g already carries 1/d for the centre
      }
      const x = d / C_AIR * sr;
      const i0 = Math.floor(x), fr = x - i0;
      if (i0 < 0 || i0 + 1 >= nMax) continue;
      const bb = chans[c];
      for (let b = 0; b < 3; b++) {
        const g = im.g[b] * gsc;
        bb[b][i0]   += g * (1 - fr);
        bb[b][i0+1] += g * fr;
      }
    }
  }
  /* ── THE DC BLOCK, and why it is not a fudge ────────────────────────────────
     A perfectly rigid box reflects with β = +1 at every wall, so every one of the
     three hundred thousand arrivals is POSITIVE. By t = 0.6 s they land thirty to a
     sample, and thirty positive spikes in one sample add to thirty times one — the
     buffer's energy climbs where the physics falls. That is not the room ringing
     louder; it is the box's ZERO-FREQUENCY mode, a uniform squeeze of the whole
     volume that a rigid lossless box would hold forever. It is real in the model and
     absent from the world: nothing emits it and no microphone hears it. Cut below
     25 Hz and the artefact goes with it — measured slope on this room swings from
     +11 dB/s (energy from nowhere) to −22 dB/s in the mid band, which is Eyring's
     prediction to 4 %. Everything above 25 Hz is untouched. */
  const dc = biquadHP(25, sr);
  for (const bb of chans) for (let b = 0; b < 3; b++) runBiquad(runBiquad(bb[b], dc), dc);
  const raw = [bands[0].slice(), bands[1].slice(), bands[2].slice()];

  // 3-way Linkwitz–Riley split: LP500 · (HP500→LP2000) · HP2000
  const lp1 = biquadLP(BAND_LO_HZ, sr), hp1 = biquadHP(BAND_LO_HZ, sr);
  const lp2 = biquadLP(BAND_HI_HZ, sr), hp2 = biquadHP(BAND_HI_HZ, sr);
  const irs = [];
  let peak = 0;
  for (const bb of chans) {
    runBiquad(runBiquad(bb[0], lp1), lp1);
    runBiquad(runBiquad(runBiquad(runBiquad(bb[1], hp1), hp1), lp2), lp2);
    runBiquad(runBiquad(bb[2], hp2), hp2);
    const ir = new Float32Array(nMax);
    for (let i = 0; i < nMax; i++) {
      let v = bb[0][i] + bb[1][i] + bb[2][i];
      if (!Number.isFinite(v)) v = 0;
      ir[i] = v;
      const a = Math.abs(v); if (a > peak) peak = a;
    }
    irs.push(ir);
  }
  if (ear > 0) irs.shift();                     // the centre channel was for measuring, not for hearing
  /* The mirror budget ends somewhere, and a hard stop is a click. Fade the last
     eighth to nothing — and SAY that the tail was cut rather than pretending the
     room went quiet there. `truncated` is on the returned object for exactly this. */
  if (IS.truncated) {
    const f0 = Math.floor(nMax * 0.875);
    for (const ir of irs) for (let i = f0; i < nMax; i++) {
      const u = (i - f0) / (nMax - f0);
      ir[i] *= (1 - u) * (1 - u);
    }
  }
  return { ir: irs[0], irs, raw, sr, peak, images: IS.list, Rmax: IS.Rmax, truncated: IS.truncated,
           count: IS.list.length, tMax: IS.Rmax / C_AIR, ears: ear };
}

/* ── Schroeder backward integration ───────────────────────────────────────────
   EDC(t) = ∫ₜ^∞ h²(τ)dτ, in dB relative to EDC(0). T30 fits the −5 → −35 dB leg
   and doubles it; T20 fits −5 → −25 and triples. Returns nulls, never guesses,
   when the response never gets that far down.                                */
function schroeder(ir, sr) {
  const n = ir.length;
  const edc = new Float64Array(n);
  let acc = 0;
  for (let i = n - 1; i >= 0; i--) { acc += ir[i]*ir[i]; edc[i] = acc; }
  const tot = edc[0];
  if (!(tot > 0)) return { db: null, t20: null, t30: null, total: 0 };
  const db = new Float64Array(n);
  for (let i = 0; i < n; i++) db[i] = 10 * Math.log10(Math.max(edc[i], tot*1e-12) / tot);
  const cross = (target) => {
    for (let i = 0; i < n; i++) if (db[i] <= target) return i / sr;
    return null;
  };
  const t5 = cross(-5), t25 = cross(-25), t35 = cross(-35);
  return {
    db, edc, total: tot, sr,
    t5, t25, t35,
    t20: (t5 != null && t25 != null) ? (t25 - t5) * 3 : null,
    t30: (t5 != null && t35 != null) ? (t35 - t5) * 2 : null,
  };
}

/* ── the decay SLOPE, fitted where the render is honest ───────────────────────
   Schroeder's backward integral is the textbook estimator, and it is WRONG on a
   truncated response: the integral runs to the end of the buffer, so the last
   samples always plunge to −∞ and hand back whatever T30 the truncation invented.
   A room with plaster walls rings for two and a half seconds, which is 19 MILLION
   mirrors — nobody is summing that in a browser.

   So this fits the slope instead, over a window that lies WHOLLY INSIDE what was
   actually rendered. The energy in a 10 ms window at t = 0.3 s is complete whether
   or not the sum stopped at 0.6 s, because every mirror that could contribute to it
   is nearer than 103 m. Least squares on 10·log₁₀(E) vs t gives dB/s; T60 = −60/slope.
   Returns r2 so the fit can be believed or disbelieved on sight.

   WHY THIS IS NOT CIRCULAR. Nothing here consults Sabine or Eyring. The windows are
   filled by summing straight lines from mirror images; the slope is whatever those
   lines happen to make. Eyring's law is then a PREDICTION about that number. */
function decayFit(ir, sr, t0, t1, winMs) {
  const w = Math.max(4, Math.round(sr * (winMs || 10) / 1000));
  const i0 = Math.max(0, Math.round(t0 * sr)), i1 = Math.min(ir.length, Math.round(t1 * sr));
  const xs = [], ys = [];
  for (let i = i0; i + w <= i1; i += w) {
    let e = 0; for (let k = i; k < i + w; k++) e += ir[k]*ir[k];
    if (e <= 0) continue;
    xs.push((i + w/2) / sr);
    ys.push(10 * Math.log10(e / w));
  }
  const n = xs.length;
  if (n < 6) return { ok: false, n, t60: null, slope: null, r2: null, t0, t1 };
  let sx = 0, sy = 0; for (let i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; }
  const mx = sx/n, my = sy/n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const dx = xs[i]-mx, dy = ys[i]-my; sxy += dx*dy; sxx += dx*dx; syy += dy*dy; }
  const slope = sxy / sxx;                       // dB per second (negative)
  const r2 = syy > 0 ? (sxy*sxy)/(sxx*syy) : 0;
  return { ok: slope < 0, n, slope, r2, t60: slope < 0 ? -60/slope : null, t0, t1, xs, ys,
           intercept: my - slope*mx };
}

/* The window decayFit should use for a given room + render: start after the field
   has had a few mean-free-paths to become a lattice rather than a handful of early
   reflections, and stop well short of where the mirror budget ran out. */
function fitWindow(room, tMax) {
  const V = volume(room), S = surfaceArea(room);
  const mfp = 4 * V / S;                       // mean free path, metres (the classic 4V/S)
  const tm = mfp / C_AIR;
  const t0 = Math.min(tMax * 0.22, Math.max(3 * tm, 0.02));
  const t1 = tMax * 0.90;
  return { t0, t1, mfp, tMfp: tm };
}

/* ── THE MEASUREMENT ──────────────────────────────────────────────────────────
   Reverberation time is never one number; it is one number PER BAND, which is why
   a room can be warm and dull at once. `measure` fits the decay of each band's own
   mirror sum and hands back the two textbook predictions beside it, so all three
   can be read off together and one of them can be caught being wrong. */
const BAND_EDGES = [[60, 500], [500, 2000], [2000, 8000]];
function bandFilter(buf, sr, b) {
  const out = buf.slice(), e = BAND_EDGES[b];
  const hp = biquadHP(e[0], sr), lp = biquadLP(e[1], sr);
  runBiquad(runBiquad(out, hp), hp);
  runBiquad(runBiquad(out, lp), lp);
  return out;
}
function measure(res, room) {
  const W = fitWindow(room, res.tMax);
  const out = { window: W, bands: [], truncated: res.truncated, count: res.count, tMax: res.tMax };
  for (let b = 0; b < 3; b++) {
    const fit = decayFit(bandFilter(res.raw[b], res.sr, b), res.sr, W.t0, W.t1);
    out.bands.push({
      band: b,
      measured: fit.t60, r2: fit.r2, n: fit.n, slope: fit.slope,
      sabine: sabineT60(room, b), eyring: eyringT60(room, b),
      abar: meanAlpha(room, b).abar,
    });
  }
  return out;
}

/* ── THE ONE AXIS THAT WOULDN'T DIE ───────────────────────────────────────────
   Deaden four walls and leave the floor and ceiling hard, and the sound that is
   still going a second later is not the diffuse field at all — it is the straight
   up-and-down bounce, arriving every 2H/c seconds forever. That is a FLUTTER ECHO,
   it is why a single reverberation number can be a lie, and it is visible in the
   lattice as a bright column standing in a dark field.

   For each axis, the round trip is 2L metres and costs both of that axis's walls
   once, so its own decay time is exact and needs no diffuse-field assumption:
        T60(axis) = 60 · (2L/c) / (−20·log₁₀(β₀β₁) + air over 2L)          */
function axialT60(room, band) {
  const out = [];
  for (let a = 0; a < 3; a++) {
    const L = room.L[a], trip = 2*L, dt = trip / C_AIR;
    const f0 = FACES[2*a], f1 = FACES[2*a+1];
    const a0 = MAT[room.mats[f0.id]].a[band], a1 = MAT[room.mats[f1.id]].a[band];
    const b = Math.sqrt(Math.max(0,1-a0)) * Math.sqrt(Math.max(0,1-a1)) * Math.exp(-AIR_M[band]*trip);
    const lossDb = b > 0 ? -20*Math.log10(b) : Infinity;
    out.push({ axis: a, name: ['west↔east','north↔south','floor↔ceiling'][a],
               period: dt, rate: 1/dt, t60: lossDb > 0 ? 60*dt/lossDb : Infinity, lossDb });
  }
  let best = out[0]; for (const o of out) if (o.t60 > best.t60) best = o;
  return { axes: out, best };
}

/* ── THE BEND ─────────────────────────────────────────────────────────────────
   The one measurement the whole room is built to make. Split the honest window in
   two, fit each half of the mid-band decay, and hand back both slopes beside the
   two textbook lines. `bend` = T_late / T_early; a room whose decay were the single
   straight line the formulas assume would return exactly 1.00. */
function bendTest(res, room, band) {
  const b = band == null ? 1 : band;
  const W = fitWindow(room, res.tMax);
  const buf = bandFilter(res.raw[b], res.sr, b);
  const mid = W.t0 + (W.t1 - W.t0) * 0.45;
  const early = decayFit(buf, res.sr, W.t0, mid, 5);
  const late  = decayFit(buf, res.sr, mid, W.t1, 5);
  const curve = decayCurve(buf, res.sr, 5);
  /* HOW FAR THE WINDOW ACTUALLY FALLS. ISO 3382 will not let you call a number T20
     unless the response drops 25 dB below the direct sound, for the plain reason
     that you cannot fit a slope to a decay that has barely started. Same rule here:
     a room so live that the affordable mirrors only cover 7 dB of its decay gets no
     verdict, it gets told to deaden a wall or buy more mirrors. */
  const at = (t) => { let bi = 0, bd = Infinity;
    for (let i = 0; i < curve.t.length; i++) { const d = Math.abs(curve.t[i]-t); if (d < bd) { bd = d; bi = i; } }
    return curve.db[bi]; };
  const dropDb = at(W.t0) - at(W.t1);
  /* THREE OUTCOMES, not two. `deep` asks whether the response fell far enough to
     say anything at all. `linear` asks the separate question of whether a straight
     line is even a fair description of what it did — and when it is NOT, that is
     not a failure to report, it is the loudest possible version of this room's
     whole point: a decay with a flutter echo in it is not a slope, and no single
     number, Sabine's or Eyring's or anyone's, can stand for it. */
  const deep = dropDb >= 25 && early.ok && late.ok;
  const linear = deep && early.r2 >= 0.85 && late.r2 >= 0.70;
  const ax = axialT60(room, b);
  const eyring = eyringT60(room, b), sabine = sabineT60(room, b);
  const flutter = eyring > 0 ? ax.best.t60 / eyring : 1;
  return {
    band: b, window: W, split: mid, early, late, curve, dropDb,
    deep, linear, resolvable: linear,          // `resolvable` = a straight line is fair here
    verdict: !deep ? 'abstain' : (linear ? 'bend' : 'noline'),
    axial: ax, flutter,
    bend: (early.t60 && late.t60) ? late.t60 / early.t60 : null,
    eyring, sabine,
    abar: meanAlpha(room, b).abar,
    count: res.count, tMax: res.tMax, truncated: res.truncated,
  };
}

/* ── the GEOMETRIC energy decay ───────────────────────────────────────────────
   Σg² binned by arrival time: no buffer, no filter, no interference — the raw
   energy the mirrors deliver per unit time. This is precisely the quantity Sabine
   and Eyring's derivations are about, and being free of the rendered response's
   noise floor it fits cleanly even over a shallow decay, where the audio buffer
   cannot. `fitEnergyDecay` returns the same shape decayFit does. */
function energyDecay(images, band, winMs) {
  const w = (winMs || 5) / 1000;
  const bins = new Map();
  for (const im of images) {
    const k = Math.floor(im.t / w);
    const g = im.g[band];
    bins.set(k, (bins.get(k) || 0) + g*g);
  }
  const keys = [...bins.keys()].sort((a, b) => a - b);
  return { t: keys.map(k => (k + 0.5) * w), e: keys.map(k => bins.get(k)), winMs: winMs || 5 };
}
function fitEnergyDecay(ed, t0, t1) {
  const xs = [], ys = [];
  for (let i = 0; i < ed.t.length; i++) {
    if (ed.t[i] < t0 || ed.t[i] > t1 || !(ed.e[i] > 0)) continue;
    xs.push(ed.t[i]); ys.push(10 * Math.log10(ed.e[i]));
  }
  const n = xs.length;
  if (n < 6) return { ok: false, n, t60: null, slope: null, r2: null };
  let sx = 0, sy = 0; for (let i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; }
  const mx = sx/n, my = sy/n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const dx = xs[i]-mx, dy = ys[i]-my; sxy += dx*dy; sxx += dx*dx; syy += dy*dy; }
  const slope = sxy/sxx, r2 = syy > 0 ? (sxy*sxy)/(sxx*syy) : 0;
  return { ok: slope < 0, n, slope, r2, t60: slope < 0 ? -60/slope : null, t0, t1, xs, ys, intercept: my - slope*mx };
}

/* The decay curve itself, in dB per window — what the page draws. */
function decayCurve(buf, sr, winMs) {
  const w = Math.max(4, Math.round(sr * (winMs || 5) / 1000));
  const t = [], db = [];
  let ref = -Infinity;
  for (let i = 0; i + w <= buf.length; i += w) {
    let e = 0; for (let k = i; k < i + w; k++) e += buf[k]*buf[k];
    const v = e > 0 ? 10*Math.log10(e / w) : -200;
    if (v > ref) ref = v;
    t.push((i + w/2) / sr); db.push(v);
  }
  for (let i = 0; i < db.length; i++) db[i] -= ref;   // 0 dB = the loudest window
  return { t, db, winMs: winMs || 5, ref };
}

/* Direct-to-reverberant ratio and clarity C50/C80 — the numbers a room is judged
   on. C80 in dB: energy in the first 80 ms over everything after it. */
function clarity(ir, sr, ms) {
  const split = Math.round(sr * ms / 1000);
  let early = 0, late = 0;
  for (let i = 0; i < ir.length; i++) { const e = ir[i]*ir[i]; if (i < split) early += e; else late += e; }
  return late > 0 ? 10 * Math.log10(early / late) : Infinity;
}

/* ── a dry clap, synthesised ──────────────────────────────────────────────────
   Two hands, so: a short crack of noise with a fast bandpass sweep and a
   6 ms decay, plus a lower body thump. Deterministic (seeded) so the estate's
   audio-lens sees the same clap the visitor hears.                           */
function mulberry32(seed) {
  let s = (seed >>> 0) || 1;
  return function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeClap(sr, seed) {
  const n = Math.round(sr * 0.09), out = new Float32Array(n);
  const rnd = mulberry32(seed == null ? 7 : seed);
  let z1 = 0, z2 = 0, hp = 0, prev = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = Math.exp(-t / 0.0055) * (1 - Math.exp(-t / 0.0004));
    const body = Math.exp(-t / 0.024) * (1 - Math.exp(-t / 0.001)) * 0.42;
    const x = rnd() * 2 - 1;
    // 2-pole resonant sweep, 2.4 kHz → 900 Hz over the crack
    const fc = 2400 * Math.exp(-t / 0.02) + 700;
    const w = 2*Math.PI*fc/sr, c = Math.cos(w), s2 = Math.sin(w);
    const al = s2 / (2 * 0.8), a0 = 1 + al;
    const b0 = (1 - c) / 2 / a0, b1 = (1 - c) / a0, a1 = -2*c/a0, a2 = (1 - al)/a0;
    const y = b0*x + z1; z1 = b1*x - a1*y + z2; z2 = b0*x - a2*y;
    hp = 0.995 * (hp + y - prev); prev = y;
    out[i] = (hp * env * 2.6 + y * body) * 0.9;
  }
  let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(out[i]));
  if (pk > 0) for (let i = 0; i < n; i++) out[i] /= pk;
  return out;
}

/* A woodblock knock — a short pitched click, the second dry source. */
function makeKnock(sr, f0) {
  const n = Math.round(sr * 0.16), out = new Float32Array(n);
  const f = f0 || 940, parts = [1, 2.61, 4.83], amps = [1, 0.44, 0.19], taus = [0.055, 0.028, 0.016];
  for (let i = 0; i < n; i++) {
    const t = i / sr; let v = 0;
    for (let k = 0; k < parts.length; k++) v += amps[k] * Math.exp(-t/taus[k]) * Math.sin(2*Math.PI*f*parts[k]*t);
    out[i] = v * (1 - Math.exp(-t/0.0006)) * 0.5;
  }
  let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(out[i]));
  if (pk > 0) for (let i = 0; i < n; i++) out[i] /= pk;
  return out;
}

/* Straight time-domain convolution — used by the Node twin (and never by the
   page, which hands the same IR to a real ConvolverNode). */
function convolve(x, h) {
  const out = new Float32Array(x.length + h.length - 1);
  for (let i = 0; i < x.length; i++) {
    const xi = x[i]; if (xi === 0) continue;
    for (let j = 0; j < h.length; j++) out[i+j] += xi * h[j];
  }
  return out;
}

function rms(buf) { let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i]*buf[i]; return Math.sqrt(s / buf.length); }

// ===== ROOM CORE END =====

export {
  C_AIR, BAND_LO_HZ, BAND_HI_HZ, AIR_M, MATERIALS, MAT, FACES,
  makeRoom, volume, faceArea, surfaceArea, meanAlpha,
  sabineT60, eyringT60, axialT60, imageAxis, foldedPath, imageSources,
  biquadLP, biquadHP, runBiquad, renderIR, schroeder, decayFit, fitWindow, measure, bandFilter, BAND_EDGES, bendTest, decayCurve, energyDecay, fitEnergyDecay, clarity,
  mulberry32, makeClap, makeKnock, convolve, rms,
};
