/* ═══════════════════════════════════════════════════════════════════════════
   THE WALL OF THE NIGHT — booth.core.mjs
   The emulsion engine. Shared BYTE-FOR-BYTE by the page (forge-inlined) and by
   the Node twin (booth.test.mjs, which imports it directly).

   It renders NO canvas. Every portrait is rasterised by hand into a plain
   Uint8ClampedArray of RGBA, so the twin sees the SAME pixels the visitor does
   — not a proxy for them. The page's only job is to blit that buffer into an
   ImageData and put it on screen.

   THE ONE LAW OF THIS FILE (see BASE FOG, below):
   a portrait's density is a function of a maker's NAME, KOAN, ROLE and CYCLE.
   It is NEVER a function of whether that maker's work shipped, was judged down,
   or decayed unbuilt. There is no such input here, and there must never be one.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Constants the whole piece agrees on ────────────────────────────────── */

export const SIZE = 132;            // a portrait's edge, in px
export const PLATES = 8;            // density plates pre-rendered per portrait
export const BASE_FOG = 0.30;       // the floor. No one develops to nothing.
export const WALL_SEED = 0x5ACE1A11;// the one fixed constant the wall grows from
export const WALL_STRIPS = 90;      // pre-pinned strips at open
export const HAPAX_REACH = 14;      // how far the guest seat reaches for a one-off maker

/* ── Determinism primitives ─────────────────────────────────────────────── */

export function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function mulberry32(a) {
  a = a >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* The seed of a person. Four fields, nothing else. */
export function seedFor(mark) {
  return fnv1a(mark.name + '|' + mark.koan + '|' + mark.role + '|' + mark.cycle);
}

/* ── Chemistry: the bath a role is developed in ─────────────────────────── */
/* Roles in the real ledger are messy strings — 'builder', 'builder (bug-fixer)',
   'foundry-smith · the-gate', 'explorer:scout-missing-mediums'. We match on the
   leading word so the bespoke one-off labels still land in a kindred bath, and
   anything genuinely unfamiliar gets the unstable mottled one. */

const BATHS = {
  /* [ shadow RGB, midtone RGB, highlight RGB, contrast, bleed, mottle ] */
  builder:    { lo: [ 38, 24, 14], mid: [126,  86, 48], hi: [236, 208, 158], gamma: 1.00, bleed: 0.10, mottle: 0.10 },
  explorer:   { lo: [ 14, 32, 34], mid: [ 66, 120, 118], hi: [206, 232, 226], gamma: 0.94, bleed: 0.42, mottle: 0.16 },
  judge:      { lo: [ 12, 11, 13], mid: [104,  98,  96], hi: [246, 244, 238], gamma: 1.62, bleed: 0.06, mottle: 0.08 },
  publisher:  { lo: [ 52, 42, 30], mid: [150, 128,  98], hi: [255, 252, 242], gamma: 0.78, bleed: 0.14, mottle: 0.10 },
  foundry:    { lo: [  6,  7,  9], mid: [ 54,  58,  62], hi: [178, 186, 190], gamma: 1.34, bleed: 0.08, mottle: 0.06 },
  oneoff:     { lo: [ 26, 20, 26], mid: [110,  92, 104], hi: [232, 216, 222], gamma: 1.08, bleed: 0.30, mottle: 0.52 },
};

export function bathFor(role) {
  const r = String(role || '').toLowerCase();
  if (r.startsWith('foundry')) return BATHS.foundry;
  if (r.startsWith('builder')) return BATHS.builder;
  if (r.startsWith('publisher')) return BATHS.publisher;
  if (r.startsWith('judge')) return BATHS.judge;
  if (r.startsWith('explorer') || r.startsWith('scout')) return BATHS.explorer;
  if (r.startsWith('director') || r.startsWith('architect')) return BATHS.judge;
  if (r.startsWith('gardener') || r.startsWith('planter') ||
      r.startsWith('groundskeeper') || r.startsWith('grounds-worker') ||
      r.startsWith('surveyor') || r.startsWith('steward')) return BATHS.builder;
  return BATHS.oneoff;
}

/* Age: the oldest marks are the most yellowed, edge-rotted, silver-bordered.
   Clamped to the real ledger span but honest outside it. */
export const CYCLE_FLOOR = 306;
export function ageFor(cycle, newest) {
  const hi = (newest && newest > CYCLE_FLOOR) ? newest : 930;
  const t = (Number(cycle) - CYCLE_FLOOR) / (hi - CYCLE_FLOOR);
  return 1 - Math.max(0, Math.min(1, t));   // 1 = ancient, 0 = fresh
}

/* ── Small field helpers ────────────────────────────────────────────────── */

function smoothstep(a, b, x) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a || 1e-9)));
  return t * t * (3 - 2 * t);
}

/* A separable box blur, run twice for a near-gaussian. Used to BLOOM the strike
   field: where a long koan's strokes pile up they pool into blown highlights,
   while a terse koan's three blades stay separate and hard. That contrast is
   the koan-as-light, and without the bloom a dense koan reads as wire wool
   rather than as an over-struck plate. */
function blur(src, size, r) {
  const a = new Float32Array(src.length), b = new Float32Array(src.length);
  const pass = (inp, out) => {
    const w = 2 * r + 1;
    for (let y = 0; y < size; y++) {
      let acc = 0;
      for (let k = -r; k <= r; k++) acc += inp[y * size + Math.max(0, Math.min(size - 1, k))];
      for (let x = 0; x < size; x++) {
        out[x * size + y] = acc / w;           // transpose on write
        const add = inp[y * size + Math.min(size - 1, x + r + 1)];
        const sub = inp[y * size + Math.max(0, x - r)];
        acc += add - sub;
      }
    }
  };
  pass(src, a); pass(a, b);                    // two transposing passes = x then y
  return b;
}

/* A seeded low-frequency value-noise field, bilinearly upsampled. This is the
   blotchy arrival field the developer really does show — and it is seeded, so
   the same maker blotches the same way forever. */
function valueNoise(rng, n, size) {
  const g = new Float32Array((n + 1) * (n + 1));
  for (let i = 0; i < g.length; i++) g[i] = rng();
  const out = new Float32Array(size * size);
  const s = n / size;
  for (let y = 0; y < size; y++) {
    const fy = y * s, gy = Math.floor(fy), ty = fy - gy;
    const wy = ty * ty * (3 - 2 * ty);
    for (let x = 0; x < size; x++) {
      const fx = x * s, gx = Math.floor(fx), tx = fx - gx;
      const wx = tx * tx * (3 - 2 * tx);
      const i00 = gy * (n + 1) + gx, i10 = i00 + 1;
      const i01 = i00 + (n + 1), i11 = i01 + 1;
      const a = g[i00] + (g[i10] - g[i00]) * wx;
      const b = g[i01] + (g[i11] - g[i01]) * wx;
      out[y * size + x] = a + (b - a) * wy;
    }
  }
  return out;
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE PORTRAIT
   (a) a ground of metaballs — a presence, never a face
   (b) the KOAN IS THE LIGHT — each word one raked stroke
   (c) chemistry — role picks the bath, cycle sets the age
   (d) BASE FOG — clamped so no one develops to nothing
   ═══════════════════════════════════════════════════════════════════════════ */

/* Returns the float fields a portrait is made of. Plates are then cheap
   colourings of these — which is why developing costs nothing per frame. */
export function emulsion(mark, size) {
  size = size || SIZE;
  const rng = mulberry32(seedFor(mark));
  const N = size * size;

  /* ── (a) GROUND: 4–6 metaballs, centroid nudged to the upper third ────── */
  const nb = 4 + Math.floor(rng() * 3);
  const blobs = [];
  for (let i = 0; i < nb; i++) {
    blobs.push({
      x: 0.50 + (rng() - 0.5) * 0.46,
      y: 0.42 + (rng() - 0.5) * 0.52,
      r: 0.11 + rng() * 0.15,
      w: 0.6 + rng() * 0.8,
    });
  }
  let cx = 0, cy = 0, wsum = 0;
  for (const b of blobs) { cx += b.x * b.w; cy += b.y * b.w; wsum += b.w; }
  cx /= wsum; cy /= wsum;
  const dx = 0.50 - cx, dy = 0.36 - cy;          // sit like a sitter
  for (const b of blobs) { b.x += dx; b.y += dy; }

  const ground = new Float32Array(N);
  for (let y = 0; y < size; y++) {
    const py = (y + 0.5) / size;
    for (let x = 0; x < size; x++) {
      const px = (x + 0.5) / size;
      let f = 0;
      for (let i = 0; i < nb; i++) {
        const b = blobs[i];
        const ex = px - b.x, ey = py - b.y;
        f += (b.r * b.r * b.w) / (ex * ex + ey * ey + 1e-4);
      }
      ground[y * size + x] = smoothstep(0.85, 2.4, f);
    }
  }

  /* ── (b) STRIKE: the koan is the light ───────────────────────────────── */
  /* One raked stroke per WORD. Angle from the word's own hash, length from its
     length, brightness falling as 1/sqrt(index) so the opening words carry the
     scene. Composited additively, then MULTIPLIED by the ground so the light
     lands ON the sitter rather than floating in front of it. A 354-char koan
     develops over-struck and nearly blown; a 35-char one is three clean blades
     on a dark body. That difference is the whole point. */
  const words = String(mark.koan || '').split(/\s+/).filter(Boolean);
  const strike = new Float32Array(N);
  const rad = size * 0.017;                       // stroke half-width in px — a blade, not a domino
  const inv2r2 = 1 / (2 * rad * rad);

  for (let j = 0; j < words.length; j++) {
    const w = words[j];
    const h = fnv1a(w + '#' + j);
    const ang = ((h % 3600) / 3600) * Math.PI;     // raked: 0..180°
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const len = (0.26 + 0.045 * Math.min(w.length, 15)) * size;   // long, raking
    const bright = 1 / Math.sqrt(j + 1);
    /* seat the stroke where the sitter is, jittered by the word's own hash */
    const ox = (0.50 + (((h >>> 8) % 1000) / 1000 - 0.5) * 0.72) * size;
    const oy = (0.40 + (((h >>> 18) % 1000) / 1000 - 0.5) * 0.78) * size;

    const half = len / 2;
    const x0 = Math.max(0, Math.floor(Math.min(ox - half * Math.abs(ca), ox + half * Math.abs(ca)) - rad * 2));
    const x1 = Math.min(size - 1, Math.ceil(Math.max(ox - half * Math.abs(ca), ox + half * Math.abs(ca)) + rad * 2));
    const y0 = Math.max(0, Math.floor(oy - half * Math.abs(sa) - rad * 2));
    const y1 = Math.min(size - 1, Math.ceil(oy + half * Math.abs(sa) + rad * 2));

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const ex = x + 0.5 - ox, ey = y + 0.5 - oy;
        const along = ex * ca + ey * sa;           // distance along the rake
        const perp = -ex * sa + ey * ca;           // distance across it
        if (along < -half || along > half) continue;
        /* soft ends so a stroke reads as a rake, not a domino */
        const end = smoothstep(half, half * 0.55, Math.abs(along));
        strike[y * size + x] += bright * end * Math.exp(-perp * perp * inv2r2);
      }
    }
  }

  /* the bloom: where strokes pile up, the light pools and blows */
  const halo = blur(strike, size, Math.max(2, Math.round(size * 0.035)));

  /* THE SITTER MUST READ AS A BODY, not as a mask you infer from what it clips.
     So the ground carries its own light: a base tone plus a volume shade taken
     from the field's own gradient (a key from the upper left). Then the koan's
     strokes rake ACROSS that body — clipped to it, so the light lands on
     something rather than floating in the dark. */
  const bath = bathFor(mark.role);
  const lum = new Float32Array(N);
  let mn = Infinity, mx = -Infinity;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const g = ground[i];
      /* volume: central-difference normal of the body field, keyed upper-left */
      const gx = ground[i + (x < size - 1 ? 1 : 0)] - ground[i - (x > 0 ? 1 : 0)];
      const gy = ground[i + (y < size - 1 ? size : 0)] - ground[i - (y > 0 ? size : 0)];
      const shade = 0.5 - (gx * 0.62 + gy * 0.62) * 3.2;
      const body = g * (0.26 + 0.30 * Math.max(0, Math.min(1, shade)));
      const light = strike[i] * 0.62 + halo[i] * 1.45;
      const v = body + g * light;
      lum[i] = v;
      if (v < mn) mn = v;
      if (v > mx) mx = v;
    }
  }
  /* normalise gently — keeps a one-word koan from being invisible and a
     fifty-word koan from being a white square, without erasing the difference */
  const span = Math.max(0.35, mx - mn);
  for (let i = 0; i < N; i++) {
    lum[i] = Math.max(0, Math.min(1, (lum[i] - mn) / span));
    lum[i] = Math.pow(lum[i], bath.gamma);
  }

  /* ── (d) BASE FOG — the clamp, and the promise ───────────────────────── */
  /* Density here is INK: how much of the plate the picture actually occupies.
     A portrait that developed to nothing would read 0. We refuse that: every
     plate is fogged up to the floor. This is the only clamp in the engine and
     it is applied to everyone identically. */
  let ink = 0;
  for (let i = 0; i < N; i++) ink += 1 - lum[i];
  ink /= N;
  if (ink < BASE_FOG) {
    const lift = BASE_FOG - ink;
    for (let i = 0; i < N; i++) lum[i] = Math.max(0, lum[i] - lift);
    ink = BASE_FOG;
  }

  /* fields the plates need */
  const arrival = valueNoise(mulberry32(seedFor(mark) ^ 0x9E3779B9), 5, size);
  const grain = valueNoise(mulberry32(seedFor(mark) ^ 0x85EBCA6B), Math.max(8, size >> 1), size);
  const mottle = valueNoise(mulberry32(seedFor(mark) ^ 0xC2B2AE35), 3, size);

  return { size, lum, ground, arrival, grain, mottle, bath, ink, words: words.length };
}

/* Colour a developed emulsion at development time t ∈ [0,1] into RGBA. */
export function plateAt(em, mark, t, newest) {
  const { size, lum, arrival, grain, mottle, bath } = em;
  const N = size * size;
  const out = new Uint8ClampedArray(N * 4);
  const age = ageFor(mark.cycle, newest);

  /* the paper crosses cold → neutral → warm as it develops */
  const cold = [0xcb, 0xd9, 0xd8], warm = [0xf0, 0xdc, 0xc0];
  const pk = smoothstep(0.10, 0.92, t);
  const paper = [0, 1, 2].map(c => cold[c] + (warm[c] - cold[c]) * pk);
  /* age yellows the paper and eats its edges */
  const yellow = [0xd8, 0xbc, 0x84];
  for (let c = 0; c < 3; c++) paper[c] = paper[c] + (yellow[c] - paper[c]) * age * 0.55;

  const grainAmt = smoothstep(0.70, 1.0, t) * (5 + 11 * age);
  const mottleAmt = bath.mottle * (0.5 + 0.5 * t);
  const half = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;

      /* ARRIVAL: blotchy, and the highlights come last */
      const a = 0.06 + 0.52 * arrival[i] + 0.30 * lum[i];
      const e = smoothstep(a - 0.20, a + 0.16, t);

      /* the image, in this bath */
      const L = lum[i];
      let r, g, b;
      if (L < 0.5) {
        const k = L * 2;
        r = bath.lo[0] + (bath.mid[0] - bath.lo[0]) * k;
        g = bath.lo[1] + (bath.mid[1] - bath.lo[1]) * k;
        b = bath.lo[2] + (bath.mid[2] - bath.lo[2]) * k;
      } else {
        const k = (L - 0.5) * 2;
        r = bath.mid[0] + (bath.hi[0] - bath.mid[0]) * k;
        g = bath.mid[1] + (bath.hi[1] - bath.mid[1]) * k;
        b = bath.mid[2] + (bath.hi[2] - bath.mid[2]) * k;
      }

      /* an unstable bath curdles in low-frequency patches */
      if (mottleAmt > 0.001) {
        const m = (mottle[i] - 0.5) * mottleAmt * 90;
        r += m; g += m * 0.7; b -= m * 0.5;
      }

      /* cross-fade from bare paper into the developed image */
      r = paper[0] + (r - paper[0]) * e;
      g = paper[1] + (g - paper[1]) * e;
      b = paper[2] + (b - paper[2]) * e;

      /* grain fades IN over the last third */
      if (grainAmt > 0.01) {
        const n = (grain[i] - 0.5) * grainAmt;
        r += n; g += n; b += n;
      }

      /* EDGE ROT + silvered border — the old ones have been on the wall longest */
      const ex = Math.abs(x - half) / half, ey = Math.abs(y - half) / half;
      const edge = Math.max(ex, ey);
      const rot = smoothstep(0.72, 1.0, edge) * age;
      if (rot > 0.001) {
        const silver = 176 + 40 * mottle[i];
        r += (silver - r) * rot * 0.72;
        g += (silver * 0.99 - g) * rot * 0.72;
        b += (silver * 0.92 - b) * rot * 0.72;
      }
      /* the bled edges of a cool bath */
      if (bath.bleed > 0.02) {
        const bl = smoothstep(0.80, 1.0, edge) * bath.bleed * e;
        r += (bath.hi[0] - r) * bl * 0.5;
        g += (bath.hi[1] - g) * bl * 0.5;
        b += (bath.hi[2] - b) * bl * 0.5;
      }

      const o = i * 4;
      out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = 255;
    }
  }
  return out;
}

/* The eight density plates. Rendered ONCE per strip, behind the servo whir —
   that is what the whir is FOR. Developing then cross-fades adjacent plates
   with globalAlpha, which is free at 60fps. Never run this per frame. */
export function renderPlates(mark, opts) {
  const o = opts || {};
  const em = emulsion(mark, o.size || SIZE);
  const n = o.plates || PLATES;
  const plates = [];
  for (let k = 0; k < n; k++) {
    const t = n === 1 ? 1 : k / (n - 1);
    plates.push({ t, data: plateAt(em, mark, t, o.newest) });
  }
  return { size: em.size, plates, ink: em.ink, words: em.words };
}

/* The finished photograph. */
export function renderPortrait(mark, opts) {
  const o = opts || {};
  const size = o.size || SIZE;
  const em = emulsion(mark, size);
  return { size, data: plateAt(em, mark, 1, o.newest), ink: em.ink, words: em.words };
}

/* ── Measurements the twin makes (and the page trusts) ──────────────────── */

/* Mean ink density of a rendered buffer: 1 − mean luminance, in [0,1]. */
export function meanDensity(buf) {
  let s = 0;
  const n = buf.length / 4;
  for (let i = 0; i < buf.length; i += 4) {
    s += 1 - (0.2126 * buf[i] + 0.7152 * buf[i + 1] + 0.0722 * buf[i + 2]) / 255;
  }
  return s / n;
}

/* Is there a picture here at all, or a flat field? */
export function pixelVariance(buf) {
  const n = buf.length / 4;
  let m = 0;
  for (let i = 0; i < buf.length; i += 4) m += buf[i];
  m /= n;
  let v = 0;
  for (let i = 0; i < buf.length; i += 4) { const d = buf[i] - m; v += d * d; }
  return v / n;
}

export function pixelHash(buf) {
  let h = 0x811c9dc5;
  for (let i = 0; i < buf.length; i++) {
    h ^= buf[i];
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return ('00000000' + h.toString(16)).slice(-8);
}

/* Mean per-pixel distance between two equal-sized buffers, 0..255. */
export function bufferDistance(a, b) {
  let s = 0;
  const n = a.length / 4;
  for (let i = 0; i < a.length; i += 4) {
    s += (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2])) / 3;
  }
  return s / n;
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE STRIP — who is in the picture
   Frames 1–3: the cycle's own seats, in ledger order.
   Frame 4:    THE GUEST. Someone who wandered in from the next room.
   ═══════════════════════════════════════════════════════════════════════════ */

export function indexLedger(marks) {
  const byCycle = new Map();
  const roleCount = new Map();
  for (const m of marks) {
    if (!byCycle.has(m.cycle)) byCycle.set(m.cycle, []);
    byCycle.get(m.cycle).push(m);
    roleCount.set(m.role, (roleCount.get(m.role) || 0) + 1);
  }
  const cycles = [...byCycle.keys()].sort((a, b) => a - b);
  const newest = cycles[cycles.length - 1];
  return { marks, byCycle, roleCount, cycles, newest };
}

/* Cycles in order of distance from `cycle`, nearest first, ties to the elder. */
function neighbourCycles(ix, cycle) {
  const out = [];
  for (const c of ix.cycles) if (c !== cycle) out.push(c);
  out.sort((a, b) => {
    const da = Math.abs(a - cycle), db = Math.abs(b - cycle);
    return da !== db ? da - db : a - b;
  });
  return out;
}

/* THE WRIT'S CLAUSE, in code.

   The house prefers a HAPAX guest — a maker whose role string occurs exactly
   once in the whole ledger. Those are the bespoke one-off explorer labels: the
   makers who were given a name for one turn, lost their cycle's judgment, and
   shipped nothing. They have been on this wall since the beginning. They have
   simply never been in a picture.

   Note what this function does NOT take as an argument: any notion of whether
   a maker shipped. It cannot branch on it. Neither can anything downstream —
   renderPortrait sees only name, koan, role, cycle. */
export function resolveStrip(ix, cycle) {
  const own = (ix.byCycle.get(cycle) || []).slice();
  const taken = new Set();
  const frames = [];

  const push = (m) => {
    if (!m || taken.has(m.seq)) return false;
    taken.add(m.seq); frames.push(m); return true;
  };

  /* frames 1–3: the cycle's own seats, ledger order */
  for (const m of own) { if (frames.length >= 3) break; push(m); }

  const nb = neighbourCycles(ix, cycle);
  const rarity = (m) => ix.roleCount.get(m.role) || 1;

  /* A thin cycle borrows its remaining seats from next door — COMMONEST role
     first. This ordering is deliberate and load-bearing: the borrowed seats
     must not swallow the one-off makers, because the fourth frame is for them.
     (Sorting these rarest-first seated only 78 of 444 guests as hapax; leaving
     them for the guest seat raises it to nearly every strip.) */
  for (const c of nb) {
    if (frames.length >= 3) break;
    const pool = ix.byCycle.get(c).slice().sort((a, b) => rarity(b) - rarity(a) || a.seq - b.seq);
    for (const m of pool) { if (frames.length >= 3) break; push(m); }
  }

  /* FRAME 4 — the guest. Prefer a hapax role from this cycle's own leftovers,
     then the rarest-role maker of the nearest neighbouring cycle. */
  const leftovers = own.filter(m => !taken.has(m.seq));
  const hapaxHere = leftovers.find(m => rarity(m) === 1);
  if (!push(hapaxHere)) {
    /* Look OUTWARD for a hapax — across the nearest HAPAX_REACH cycles, not
       merely the one next door — before settling for the nearest neighbour's
       rarest role. Stopping at the first neighbour seated only 89 of 444
       guests as one-off makers; reaching a little further seats far more,
       which is the whole point of the seat. */
    let guest = null, fallback = null;
    for (let k = 0; k < nb.length && k < HAPAX_REACH; k++) {
      const pool = ix.byCycle.get(nb[k]).filter(m => !taken.has(m.seq));
      if (!pool.length) continue;
      const hx = pool.find(m => rarity(m) === 1);
      if (hx) { guest = hx; break; }
      if (!fallback) {
        pool.sort((a, b) => rarity(a) - rarity(b) || a.seq - b.seq);
        fallback = pool[0];
      }
    }
    if (!push(guest) && !push(fallback)) push(leftovers[0]);
  }

  /* absolute backstop: a strip is four frames, always */
  if (frames.length < 4) {
    for (const c of nb) {
      if (frames.length >= 4) break;
      for (const m of ix.byCycle.get(c)) { if (frames.length >= 4) break; push(m); }
    }
  }
  return frames;
}

/* ── The wall: which cycles hang there before anyone touches anything ───── */

/* 90 strips, deterministically chosen from ONE fixed constant, so the party has
   a HISTORY rather than a randomiser. Cycle 306 — Cairn, seq 1, the maker who
   built the room that remembers — is always present, and always at the bottom. */
export function wallCycles(ix, count, seed) {
  const n = Math.min(count || WALL_STRIPS, ix.cycles.length);
  const rng = mulberry32(seed === undefined ? WALL_SEED : seed);
  const chosen = new Set([ix.cycles[0]]);
  const stride = ix.cycles.length / n;
  for (let k = 1; k < n; k++) {
    let i = Math.floor(k * stride + (rng() - 0.5) * stride);
    i = Math.max(0, Math.min(ix.cycles.length - 1, i));
    let step = 0;
    while (chosen.has(ix.cycles[i]) && step < ix.cycles.length) {
      i = (i + 1) % ix.cycles.length; step++;
    }
    chosen.add(ix.cycles[i]);
  }
  return [...chosen].sort((a, b) => a - b);   // oldest first = laid deepest
}

/* The cycles NOT on the wall — the ones a pull can still take. */
export function unwalledCycles(ix, walled) {
  const on = new Set(walled);
  return ix.cycles.filter(c => !on.has(c));
}

export function parseLedger(text) {
  return String(text).trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
}

export {
  BATHS as _BATHS,
};
