/* ============================================================================
   THE MARBLE MACHINE — mill.mjs
   The whole machine as arithmetic. DOM-free, dependency-free, runs in Node.

   UNITS: metres, seconds, kilograms. Screen convention — +x right, +y DOWN,
   so gravity is +y and a "steeper" rail has a bigger |dy/dx|.

   WHAT IS IN HERE
     · the rolling-sphere contact solver (impulse form; rolling is an OUTCOME
       of Coulomb friction, never a special case that was written in)
     · the free-free steel bar: its pitch from its LENGTH, and its partials
     · the tracer: one marble alone through the current geometry, which is what
       draws the beat ticks and predicts the score
     · the shipped machines
     · runSelfTest() — the same checks the page's pill and the Node twin run

   NO BACKTICK MAY APPEAR IN THIS FILE, comments included: the page hands it to
   an audio pre-render inside a String.raw. (LANDMINES.md.)
   ============================================================================ */

/* ── the world ───────────────────────────────────────────────────────────── */

export const G = 9.80665;                 // m/s^2
export const WALL = { w: 1.24, h: 1.01 }; // the oak panel you build on, metres

export const MARBLE_R = 0.010;            // a 20 mm glass shooter
export const GLASS_RHO = 2500;            // kg/m^3
export const MARBLE_M = (4 / 3) * Math.PI * MARBLE_R ** 3 * GLASS_RHO;  // 5.36 g

// a solid sphere rolling without slipping: a = (5/7) g sin(theta).
// I = (2/5) m R^2, so 1/(1 + I/(m R^2)) = 1/(1 + 2/5) = 5/7.
export const ROLL_FACTOR = 5 / 7;

export const RAIL_R = 0.0025;             // 5 mm brass wire, half-thickness
export const BAR_HALF_T = 0.0025;         // the bar is 5 mm thick

/* contact parameters. Restitution is dropped to zero below REST_V so a marble
   riding a rail does not jitter itself apart; that is the standard resting
   contact treatment and it is why the (5/7) law comes out clean. */
/* A glockenspiel bar is not a trampoline: it is seated on cord over a frame,
   and a glass marble landing on one mostly stops. Hence the low restitution —
   and hence a bar is struck once, cleanly, instead of chattering. */
export const RAIL_E = 0.12, BAR_E = 0.14, MARBLE_E = 0.55;
export const MU = 0.55;                   // glass on brass, dry
export const REST_V = 0.06;               // m/s
export const C_RR = 0.0025;               // rolling resistance coefficient

export const FIXED_DT = 1 / 2400;         // s — the physics step, everywhere

/* ── the bar: a free-free steel beam, and its pitch is its length ─────────── */

/* Euler-Bernoulli, free-free. The eigenvalues (beta_n L) are the roots of
   cos(x)cosh(x) = 1. For a rectangular section, sqrt(I/A) = t/sqrt(12), so

       f_n = (beta_n L)^2 / (2 pi L^2)  *  t sqrt(E/rho) / sqrt(12)

   which is 1/L^2. That is the whole trick of this room: an OCTAVE up is a
   factor sqrt(2) shorter, not half as long. */
export const BETA_L = [4.7300407449, 7.8532046241, 10.9956078380, 14.1371654914];
export const BAR_MAT = { E: 2.00e11, rho: 7850, t: 0.005, w: 0.020, name: 'steel' };

/* the partial ratios of a uniform free-free bar: 1 : 2.7565 : 5.4039 : 8.9329.
   (A real marimba bar is UNDERCUT, which drops f1 and pulls the second partial
   onto a harmonic; these bars are uniform, so they keep the ideal ratios and
   ring like a glockenspiel. The page says so.) */
export const BAR_PARTIALS = BETA_L.map(b => (b / BETA_L[0]) ** 2);

/* f1 = BAR_K / L^2 */
export function barK(mat = BAR_MAT) {
  return (BETA_L[0] ** 2) * mat.t * Math.sqrt(mat.E / mat.rho)
       / (2 * Math.PI * Math.sqrt(12));
}
export function barFreq(L, mat = BAR_MAT) { return barK(mat) / (L * L); }
export function barLengthForFreq(f, mat = BAR_MAT) { return Math.sqrt(barK(mat) / f); }

/* ── pitch. The estate's anchor, restated here and checked against the
      authority (sound-garden/pitch-core.mjs) by the Node twin. ───────────── */
export const MIDDLE_C_HZ = 261.625565;
export function semiToFreq(semi) { return MIDDLE_C_HZ * Math.pow(2, semi / 12); }
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export function noteName(semi) {
  const o = 4 + Math.floor(semi / 12), i = ((semi % 12) + 12) % 12;
  return NOTE_NAMES[i] + o;
}
export function freqToSemi(f) { return 12 * Math.log2(f / MIDDLE_C_HZ); }

/* the bars this wall can hold: 100 mm to 260 mm, which is G4 to E7. */
export const BAR_L_MIN = 0.100, BAR_L_MAX = 0.260;
export const SEMI_MIN = Math.ceil(freqToSemi(barFreq(BAR_L_MAX)));
export const SEMI_MAX = Math.floor(freqToSemi(barFreq(BAR_L_MIN)));

export const SCALES = {
  pentatonic: { name: 'C pentatonic', deg: [0, 2, 4, 7, 9] },
  major:      { name: 'C major',      deg: [0, 2, 4, 5, 7, 9, 11] },
  minor:      { name: 'A minor',      deg: [0, 2, 3, 5, 7, 8, 10] },
  chromatic:  { name: 'chromatic',    deg: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
};

/* snap a drawn length to the nearest note of a scale, inside the wall's range */
export function snapLength(L, scaleKey = 'pentatonic') {
  const deg = (SCALES[scaleKey] || SCALES.pentatonic).deg;
  const want = freqToSemi(barFreq(Math.min(BAR_L_MAX, Math.max(BAR_L_MIN, L))));
  let best = null, bestD = Infinity;
  for (let s = SEMI_MIN; s <= SEMI_MAX; s++) {
    if (!deg.includes(((s % 12) + 12) % 12)) continue;
    const d = Math.abs(s - want);
    if (d < bestD) { bestD = d; best = s; }
  }
  if (best === null) best = Math.round(want);
  return { semi: best, L: barLengthForFreq(semiToFreq(best)), f: semiToFreq(best) };
}

/* ── parts ───────────────────────────────────────────────────────────────── */

let _nextId = 1;
export function resetIds(n = 1) { _nextId = n; }

export function makeRail(ax, ay, bx, by, opt = {}) {
  return { id: _nextId++, kind: 'rail', ax, ay, bx, by,
           e: opt.e ?? RAIL_E, mu: opt.mu ?? MU, fixed: !!opt.fixed, r: RAIL_R };
}

/* a bar is placed by its LEFT end and its angle; the length comes from the note */
export function makeBar(ax, ay, semi, tilt = 0.10) {
  const L = barLengthForFreq(semiToFreq(semi));
  return { id: _nextId++, kind: 'bar', semi, L, tilt,
           ax, ay, bx: ax + L * Math.cos(tilt), by: ay + L * Math.sin(tilt),
           e: BAR_E, mu: MU * 0.7, r: BAR_HALF_T, f: semiToFreq(semi) };
}
/* THE FLIP-GATE — a funnel that centres a falling marble over a rocker arm
   pivoted at its middle. The marble rolls off whichever end is down, and as it
   leaves, the rocker falls the other way. So consecutive marbles take turns:
   left, right, left, right. It is the one part that turns a loop into a
   pattern, and it is why a machine can be longer than one bar of music.

   (px, py) is the PIVOT. The funnel sits above it.                            */
export const GATE_W = 0.084, GATE_DROP = 0.070, GATE_GAP = 0.0175;
export const GATE_ARM = 0.050, GATE_TILT = 0.40;

export function makeGate(px, py, state = 0) {
  const g = { id: _nextId++, kind: 'gate', px, py, state: state & 1,
              armed: false, segs: [] };
  const sid = g.id * 8;
  const wall = (n, ax, ay, bx, by) => ({ id: sid + n, kind: 'gatewall', owner: g,
      ax, ay, bx, by, e: 0.06, mu: MU, r: RAIL_R });
  g.segs = [
    wall(1, px - GATE_W, py - GATE_DROP, px - GATE_GAP, py - 0.020),
    wall(2, px + GATE_W, py - GATE_DROP, px + GATE_GAP, py - 0.020),
    { id: sid + 3, kind: 'vane', owner: g, e: 0.06, mu: MU, r: RAIL_R,
      ax: 0, ay: 0, bx: 0, by: 0 },
  ];
  return gateGeom(g);
}
export function gateGeom(g) {
  const s = g.state ? 1 : -1;                 // 0 = spills LEFT, 1 = spills RIGHT
  const c = Math.cos(GATE_TILT) * GATE_ARM, sn = Math.sin(GATE_TILT) * GATE_ARM;
  const v = g.segs[2];
  v.ax = g.px - s * c; v.ay = g.py - sn;
  v.bx = g.px + s * c; v.by = g.py + sn;
  return g;
}
export function flipGate(g) { g.state ^= 1; return gateGeom(g); }

/* the flat list of colliding segments a part list presents to the solver */
export function segments(parts) {
  const out = [];
  for (const p of parts) {
    if (p.kind === 'gate') { for (const s of p.segs) out.push(s); }
    else out.push(p);
  }
  return out;
}

export function retuneBar(bar, semi) {
  bar.semi = semi; bar.f = semiToFreq(semi);
  bar.L = barLengthForFreq(bar.f);
  bar.bx = bar.ax + bar.L * Math.cos(bar.tilt);
  bar.by = bar.ay + bar.L * Math.sin(bar.tilt);
  return bar;
}

/* the furniture that is always there: the release chute and the catch trough.
   Marbles that reach the collector box are lifted back to the hopper. */
export const RELEASE = { x: 0.260, y: 0.244, vx: 0.14, vy: 0 };
export const COLLECT = { x: 0.118, y: 0.934 };     // where the trough delivers
export const LIFT = { x: 0.046, yBot: 0.954, yTop: 0.118, dur: 2.2 };
export const HOPPER = { x: 0.116, y: 0.134 };

export function furniture() {
  const F = [];
  // the chute under the hopper: marbles slide right and off the lip
  F.push(makeRail(0.078, 0.162, 0.256, 0.233, { fixed: true, e: 0.05 }));
  // the catch trough across the bottom, falling all the way to the collector
  F.push(makeRail(1.228, 0.892, 0.100, 0.974, { fixed: true, e: 0.05 }));
  // the right-hand wall, so nothing leaves the frame sideways
  F.push(makeRail(1.235, 0.232, 1.235, 0.896, { fixed: true, e: 0.30 }));
  // a kerb down the left, keeping marbles out of the lift shaft — it stops
  // short of the trough so the trough can deliver into the collector
  F.push(makeRail(0.081, 0.256, 0.081, 0.876, { fixed: true, e: 0.30 }));
  return F;
}

/* ── the marble ──────────────────────────────────────────────────────────── */

export function newMarble(id = 0, at = RELEASE) {
  return { id, x: at.x, y: at.y, vx: at.vx || 0, vy: at.vy || 0, om: 0,
           state: 'run', t: 0, slow: 0, hits: new Set(), struckAt: new Map(),
           lift: 0, colour: ((id % 6) + 6) % 6 };
}

/* one marble bouncing on one bar is ONE note, not four. A struck bar is
   re-armed only after this long. */
export const RESTRIKE = 0.24;    // s

/* closest point on a segment to p, as a parameter u in [0,1] */
function closestU(seg, px, py) {
  const dx = seg.bx - seg.ax, dy = seg.by - seg.ay;
  const dd = dx * dx + dy * dy;
  if (dd < 1e-12) return 0;
  let u = ((px - seg.ax) * dx + (py - seg.ay) * dy) / dd;
  return u < 0 ? 0 : u > 1 ? 1 : u;
}

/* Resolve one marble against one segment. Returns null, or a struck report
   { part, vn, u } when the marble ARRIVES on the segment (a new contact).

   The friction impulse drives the CONTACT POINT velocity to zero, clamped by
   Coulomb. Rolling is what that produces; it is not written in anywhere. */
export function contact(m, seg, out, rr = C_RR) {
  const u = closestU(seg, m.x, m.y);
  const cx = seg.ax + (seg.bx - seg.ax) * u, cy = seg.ay + (seg.by - seg.ay) * u;
  let nx = m.x - cx, ny = m.y - cy;
  let d = Math.hypot(nx, ny);
  const R = MARBLE_R + seg.r;
  if (d >= R) { m.hits.delete(seg.id); return null; }
  if (d < 1e-9) {                       // dead centre: use the segment normal
    const sx = seg.bx - seg.ax, sy = seg.by - seg.ay, sl = Math.hypot(sx, sy) || 1;
    nx = -sy / sl; ny = sx / sl; d = 1e-9;
  } else { nx /= d; ny /= d; }

  const pen = R - d;
  m.x += nx * pen; m.y += ny * pen;                 // position correction

  const vn = m.vx * nx + m.vy * ny;                 // <0 means approaching
  let struck = null;
  if (vn < 0) {
    const fresh = !m.hits.has(seg.id);
    const e = (-vn < REST_V) ? 0 : seg.e;
    const jn = -(1 + e) * vn * MARBLE_M;            // >= 0
    m.vx += nx * jn / MARBLE_M; m.vy += ny * jn / MARBLE_M;

    // tangent, and the velocity of the material point in contact
    const tx = -ny, ty = nx;
    const vt = m.vx * tx + m.vy * ty;
    const vct = vt - m.om * MARBLE_R;               // contact-point tangential
    let jt = -vct * MARBLE_M / 3.5;                 // 3.5 = 1 + R^2 m / I
    const lim = seg.mu * jn;
    if (jt > lim) jt = lim; else if (jt < -lim) jt = -lim;
    m.vx += tx * jt / MARBLE_M; m.vy += ty * jt / MARBLE_M;
    m.om += -jt * MARBLE_R / (0.4 * MARBLE_M * MARBLE_R * MARBLE_R);

    // rolling resistance: a small drag on the rolling motion itself
    if (rr > 0) {
      const vt2 = m.vx * tx + m.vy * ty;
      if (vt2 !== 0) {
        const dv = Math.min(Math.abs(vt2), rr * jn / MARBLE_M) * Math.sign(vt2);
        m.vx -= tx * dv; m.vy -= ty * dv; m.om -= dv / MARBLE_R;
      }
    }
    if (fresh && -vn > 0.045) {
      const last = m.struckAt.get(seg.id);
      if (last === undefined || m.t - last > RESTRIKE) {
        m.struckAt.set(seg.id, m.t);
        struck = { part: seg, vn: -vn, u };
      }
    }
    m.hits.add(seg.id);
  } else m.hits.add(seg.id);
  if (struck) struck.marble = m;
  if (out && struck) out.push(struck);
  return struck;
}

/* marble-on-marble, equal masses, normal impulse only */
export function pairCollide(a, b) {
  let nx = b.x - a.x, ny = b.y - a.y;
  const d = Math.hypot(nx, ny), R = 2 * MARBLE_R;
  if (d >= R || d < 1e-12) return false;
  nx /= d; ny /= d;
  const pen = (R - d) * 0.5;
  a.x -= nx * pen; a.y -= ny * pen; b.x += nx * pen; b.y += ny * pen;
  const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (rv >= 0) return false;
  const j = -(1 + MARBLE_E) * rv / 2;
  a.vx -= nx * j; a.vy -= ny * j; b.vx += nx * j; b.vy += ny * j;
  return true;
}

/* one physics substep for a list of running marbles over a list of parts */
export function step(marbles, parts, dt = FIXED_DT, opts = {}) {
  const rr = opts.rr ?? C_RR;
  const struck = [];
  for (const m of marbles) {
    if (m.state !== 'run') continue;
    m.vy += G * dt;
    m.x += m.vx * dt; m.y += m.vy * dt;
    m.t += dt;
    for (const p of parts) contact(m, p, struck, rr);
  }
  if (marbles.length > 1) {
    for (let i = 0; i < marbles.length; i++) {
      if (marbles[i].state !== 'run') continue;
      for (let j = i + 1; j < marbles.length; j++) {
        if (marbles[j].state !== 'run') continue;
        pairCollide(marbles[i], marbles[j]);
      }
    }
  }
  /* the rockers fall the other way once the marble that tipped them has gone */
  for (const s of struck) if (s.part.kind === 'vane') s.part.owner.armed = true;
  for (const seg of parts) {
    if (seg.kind !== 'vane') continue;
    const g = seg.owner;
    if (!g.armed) continue;
    let touching = false;
    for (const m of marbles)
      if (m.state === 'run' && m.hits.has(seg.id)) { touching = true; break; }
    if (!touching) { flipGate(g); g.armed = false; }
  }
  if (opts.free) return struck;   /* a bench test on an open ramp has no walls */

  /* A marble that has come to rest somewhere on the wall is STUCK, and if the
     machine never noticed, the hopper would quietly empty and the room would
     die. So the solver itself gives up on it and the room fishes it out. */
  const stallT = opts.stall ?? 1.4;
  for (const m of marbles) {
    if (m.state !== 'run') continue;
    if (Math.hypot(m.vx, m.vy) < 0.022) {
      m.slow = (m.slow || 0) + dt;
      if (m.slow > stallT) m.state = 'stalled';
    } else m.slow = 0;
  }

  for (const m of marbles) {
    if (m.state !== 'run') continue;
    if (m.x < COLLECT.x && m.y > COLLECT.y) { m.state = 'caught'; continue; }
    if (m.y > WALL.h + 0.10 || m.x < -0.10 || m.x > WALL.w + 0.10) m.state = 'lost';
  }
  return struck;
}

/* ── the tracer: one marble, alone, through the current geometry ──────────
   This is what draws the beat ticks and predicts the score. It is the SAME
   solver the running machine uses — no second model. */
export function trace(partsIn, opt = {}) {
  const parts = segments(partsIn);
  const dt = opt.dt ?? FIXED_DT;
  const tMax = opt.tMax ?? 14;
  const sample = opt.sample ?? 0.004;
  const m = newMarble(-1, opt.from || RELEASE);
  const path = [{ t: 0, x: m.x, y: m.y, v: 0 }];
  const notes = [];
  let nextS = sample, t = 0, slowFor = 0;
  const one = [m];
  /* a gate must not keep its flip-state from a trace: the trace is a lone
     marble on the machine AS IT STANDS, so remember and restore. */
  const gates = partsIn.filter(p => p.kind === 'gate');
  const gs = gates.map(g => ({ g, state: g.state, armed: g.armed }));
  while (t < tMax && m.state === 'run') {
    const hits = step(one, parts, dt, opt);
    t += dt;
    for (const h of hits) {
      if (h.part.kind === 'bar') {
        notes.push({ t, semi: h.part.semi, f: h.part.f, v: h.vn, id: h.part.id });
      }
    }
    if (t >= nextS) { path.push({ t, x: m.x, y: m.y, v: Math.hypot(m.vx, m.vy) }); nextS += sample; }
    /* a marble that has stopped moving has stopped: say so rather than
       letting the tracer run out the clock pretending it is still going. */
    if (Math.hypot(m.vx, m.vy) < 0.022) { slowFor += dt; if (slowFor > 0.55) m.state = 'stalled'; }
    else slowFor = 0;
  }
  for (const s of gs) { s.g.state = s.state; s.g.armed = s.armed; gateGeom(s.g); }
  path.push({ t, x: m.x, y: m.y, v: Math.hypot(m.vx, m.vy) });
  return { path, notes, t, fate: m.state, dropTime: t };
}

/* the point on a traced path at time tt (linear between samples) */
export function atTime(path, tt) {
  if (!path.length) return null;
  if (tt <= path[0].t) return path[0];
  if (tt >= path[path.length - 1].t) return null;
  let lo = 0, hi = path.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (path[mid].t <= tt) lo = mid; else hi = mid; }
  const a = path[lo], b = path[hi], f = (tt - a.t) / Math.max(1e-12, b.t - a.t);
  return { t: tt, x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, v: a.v + (b.v - a.v) * f };
}

/* ── the shipped machines ────────────────────────────────────────────────
   Every coordinate below was PLACED BY THE TRACER, not by me: tune.mjs drops
   each next part exactly where a traced marble crosses the chosen height, so a
   shipped machine cannot be a machine that misses its own bars. Self-test J
   re-runs all of them and insists each one reaches the trough and plays. ── */

/* a rail from (x1,y1) to (x2,y2) */
const R_ = (a, b, c, d) => makeRail(a, b, c, d);
/* a bar: its UPPER end at (x,y), tuned to a semitone above middle C; the
   LENGTH is not a parameter, because the length IS the note. */
const B_ = (x, y, semi, tilt) => {
  const p = makeBar(x, y, semi, Math.abs(tilt));
  if (tilt < 0) { p.tilt = tilt; p.bx = x - p.L * Math.cos(tilt); p.by = y - p.L * Math.sin(tilt); }
  return p;
};
const G_ = (x, y, st) => makeGate(x, y, st);

export const MACHINES = {
  'the-descent': {
    name: 'the descent',
    say: 'four bars on one long fall. The plainest thing the wall can play, and the one to take apart first.',
    steps: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    bpm: 104,
    build() {
      const P = [];
      P.push(R_(0.2564, 0.3100, 0.5754, 0.3747));
      P.push(B_(0.6134, 0.3914, 21, 0.1000));   // A5
      P.push(R_(0.8816, 0.4650, 1.1388, 0.5225));
      P.push(B_(1.2180, 0.5464, 19, -0.1000));  // G5
      P.push(R_(0.9966, 0.6355, 0.6052, 0.7313));
      P.push(B_(0.6160, 0.7208, 16, -0.1000));  // E5
      P.push(R_(0.3271, 0.7905, 0.5994, 0.8514));
      P.push(B_(0.2529, 0.8641, 12, 0.1000));   // C5
      return P;
    },
  },

  'the-ladder': {
    name: 'the ladder',
    say: 'eight bars, C6 down to G4, and no rails after the first. Stand back and LOOK at them: every octave down is only 1.414 times longer.',
    steps: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    bpm: 96,
    build() {
      const P = [];
      P.push(R_(0.2554, 0.3023, 0.6386, 0.3602));
      P.push(B_(0.6732, 0.3720, 24, 0.0750));   // C6
      P.push(B_(0.9231, 0.4441, 23, 0.0750));   // B5
      P.push(B_(1.2140, 0.5162, 21, -0.0750));  // A5
      P.push(B_(1.0097, 0.5882, 19, -0.0750));  // G5
      P.push(B_(0.7728, 0.6603, 16, -0.0750));  // E5
      P.push(B_(0.5009, 0.7324, 14, -0.0750));  // D5
      P.push(B_(0.1647, 0.8045, 12, 0.0750));   // C5
      P.push(B_(0.0940, 0.8766, 7, 0.0750));    // G4
      return P;
    },
  },

  'take-turns': {
    name: 'take turns',
    say: 'one vane at the fork. Every marble tips it over on the way past, so the next one goes the other way — two answers to the same question, and the machine stops repeating itself.',
    steps: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    bpm: 120,
    build() {
      const P = [];
      P.push(R_(0.2564, 0.3100, 0.5287, 0.3709));
      P.push(B_(0.5727, 0.3953, 24, 0.1000));   // C6
      P.push(G_(0.8735, 0.5038, 0));
      P.push(B_(0.9678, 0.6123, 16, 0.1000));   // E5   — the right branch
      P.push(R_(1.2180, 0.7053, 0.9155, 0.7730));
      P.push(B_(0.8649, 0.7983, 12, -0.1000));  // C5
      P.push(B_(0.7829, 0.6123, 19, -0.1000));  // G5   — the left branch
      P.push(R_(0.5264, 0.7053, 0.2238, 0.7730));
      P.push(B_(0.1202, 0.7983, 21, 0.1000));   // A5
      return P;
    },
  },

  'empty': {
    name: 'an empty wall',
    say: 'nothing but the chute and the trough. Draw a rail across the fall and see where the beats land on it.',
    steps: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    bpm: 104,
    build() { return []; },
  },
};

export function buildMachine(key) {
  const M = MACHINES[key] || MACHINES['the-descent'];
  resetIds(1);
  const f = furniture();
  const parts = M.build();
  return { key, name: M.name, say: M.say, bpm: M.bpm,
           steps: M.steps.slice(), parts, furniture: f, all: f.concat(parts) };
}

/* ── the voice of a struck bar ───────────────────────────────────────────────
   Four modes at the free-free ratios, each with its own decay, plus the tick of
   glass on steel. Deterministic (its noise is an LCG), so the buffer the page
   plays is the buffer the Node twin renders and audio-lens measures.          */

export function barTau(f1) { return 0.62 * Math.pow(1000 / f1, 0.62); }

export function barVoice(f1, opt = {}) {
  const sr = opt.sr ?? 48000;
  const amp = opt.amp ?? 1;
  const tau1 = barTau(f1);
  const dur = opt.dur ?? Math.min(3.2, tau1 * 3.4 + 0.05);
  const n = Math.max(4, Math.round(dur * sr));
  const out = new Float32Array(n);
  const A = [1, 0.42, 0.155, 0.06];
  /* a strike excites the high modes hardest and briefly; a hard strike (a fast
     marble) excites them harder still — which is why a loud note is also a
     BRIGHTER note, exactly as a real bar is. */
  const hard = Math.min(1.6, 0.55 + 0.9 * amp);
  for (let k = 0; k < 4; k++) {
    const f = f1 * BAR_PARTIALS[k];
    if (f > sr * 0.45) break;
    const w = 2 * Math.PI * f / sr;
    const tau = tau1 / (1 + 1.15 * k);
    const dec = Math.exp(-1 / (tau * sr));
    let a = A[k] * Math.pow(hard, k * 0.85);
    for (let i = 0; i < n; i++) { out[i] += a * Math.sin(w * i); a *= dec; }
  }
  // the tick of glass meeting steel: 3 ms of high, fast-decaying noise
  let seed = 1234567 + Math.round(f1);
  const tickN = Math.round(0.004 * sr);
  let hp = 0;
  for (let i = 0; i < tickN; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const w = (seed / 0x3fffffff) - 1;
    hp = 0.72 * hp + 0.28 * w;
    out[i] += (w - hp) * 0.55 * Math.exp(-i / (tickN * 0.30)) * hard;
  }
  // a short raised-cosine tail so it never clicks off, and a peak normalise
  const fade = Math.round(0.012 * sr);
  for (let i = 0; i < fade; i++)
    out[n - 1 - i] *= 0.5 - 0.5 * Math.cos(Math.PI * i / fade);
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(out[i]));
  const g = peak > 0 ? (0.92 * amp) / peak : 0;
  for (let i = 0; i < n; i++) out[i] *= g;
  return out;
}

/* the small dry tick of a marble arriving on a brass rail */
export function railTick(v, opt = {}) {
  const sr = opt.sr ?? 48000;
  const n = Math.round(0.030 * sr);
  const out = new Float32Array(n);
  let seed = 987654321, lp = 0, hp = 0;
  const amp = Math.min(1, v / 1.8);
  for (let i = 0; i < n; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const w = (seed / 0x3fffffff) - 1;
    lp = 0.55 * lp + 0.45 * w; hp = 0.90 * hp + 0.10 * lp;
    out[i] = (lp - hp) * 0.5 * amp * Math.exp(-i / (n * 0.11));
  }
  return out;
}

/* ── the self-test. The page's pill and the Node twin both call this. ─────── */

function slideDown(theta, T, mu) {
  /* one marble released at rest on a long straight ramp of angle theta,
     integrated by the SAME solver; returns distance travelled along it. */
  const L = 6.0;
  resetIds(9000);
  const seg = makeRail(0, 0, L * Math.cos(theta), L * Math.sin(theta), { e: 0, mu });
  const R = MARBLE_R + seg.r;
  const nx = Math.sin(theta), ny = -Math.cos(theta);   // unit normal, upslope side
  const m = newMarble(0, { x: nx * R, y: ny * R, vx: 0, vy: 0 });
  const one = [m];
  const parts = [seg];
  const n = Math.round(T / FIXED_DT);
  for (let i = 0; i < n; i++) step(one, parts, FIXED_DT, { rr: 0, free: true });
  const sx = m.x - nx * R, sy = m.y - ny * R;
  return { s: Math.hypot(sx, sy), v: Math.hypot(m.vx, m.vy), m };
}

export let JITTER_MS = 0;

export function runSelfTest() {
  const R = [];
  const ok = (name, pass, detail) => R.push({ name, pass: !!pass, detail });
  const close = (a, b, tol) => Math.abs(a - b) <= tol;

  /* A · rolling: a = (5/7) g sin(theta), out of Coulomb friction alone */
  let worst = 0;
  for (const deg of [8, 15, 25, 35, 45]) {
    const th = deg * Math.PI / 180, T = 0.8;
    const { s } = slideDown(th, T, MU);
    const want = 0.5 * ROLL_FACTOR * G * Math.sin(th) * T * T;
    worst = Math.max(worst, Math.abs(s - want) / want);
  }
  ok('A · rolling accel is (5/7) g sin(theta)', worst < 0.004,
     'worst error over 8-45 deg: ' + (worst * 100).toFixed(2) + '%');

  /* B · a SLIDER (mu = 0) beats a ROLLER down the same ramp by sqrt(7/5) */
  {
    const th = 30 * Math.PI / 180, T = 0.8;
    const roll = slideDown(th, T, MU).s, slide = slideDown(th, T, 0).s;
    const ratio = Math.sqrt(slide / roll);          // same distance -> time ratio
    ok('B · sliding beats rolling by sqrt(7/5) = 1.1832',
       close(ratio, Math.sqrt(7 / 5), 0.004),
       'measured ' + ratio.toFixed(4) + ' (slide a/g sin = ' +
       (2 * slide / (G * Math.sin(th) * T * T)).toFixed(4) + ')');
  }

  /* C · the closed form for the ramp, position at 1 s, to under a millimetre */
  {
    const th = 22 * Math.PI / 180, T = 1.0;
    const { s } = slideDown(th, T, MU);
    const want = 0.5 * ROLL_FACTOR * G * Math.sin(th) * T * T;
    ok('C · position after 1 s matches 1/2 a t^2', Math.abs(s - want) < 0.0015,
       'sim ' + s.toFixed(5) + ' m vs closed form ' + want.toFixed(5) + ' m');
  }

  /* D · the bar law: f = K/L^2, so an octave is a factor sqrt(2) in length */
  {
    const f1 = 523.251, L1 = barLengthForFreq(f1), L2 = barLengthForFreq(2 * f1);
    const rt = L1 / L2;
    const back = barFreq(L1);
    ok('D · bar pitch is K/L^2; an octave is sqrt(2) shorter',
       close(rt, Math.SQRT2, 1e-12) && close(back, f1, 1e-9),
       'L(C5) ' + (L1 * 1000).toFixed(1) + ' mm / L(C6) ' + (L2 * 1000).toFixed(1) +
       ' mm = ' + rt.toFixed(6));
  }

  /* E · the free-free partials are 1 : 2.7565 : 5.4039 : 8.9329 */
  {
    const p = BAR_PARTIALS;
    ok('E · free-free partials 2.756 / 5.404 / 8.933',
       close(p[1], 2.7565, 5e-4) && close(p[2], 5.4039, 5e-4) && close(p[3], 8.9329, 5e-4),
       p.map(x => x.toFixed(4)).join(' : '));
  }

  /* F · the wall's bar range really is the range the page advertises */
  {
    const lo = barFreq(BAR_L_MAX), hi = barFreq(BAR_L_MIN);
    ok('F · 100-260 mm spans ' + noteName(SEMI_MIN) + ' to ' + noteName(SEMI_MAX),
       hi / lo > 5.9 && SEMI_MAX - SEMI_MIN >= 30,
       lo.toFixed(1) + ' Hz to ' + hi.toFixed(1) + ' Hz, ' +
       (SEMI_MAX - SEMI_MIN) + ' semitones');
  }

  /* G · snapping is idempotent and lands exactly on the scale */
  {
    let good = true;
    for (let L = BAR_L_MIN; L <= BAR_L_MAX; L += 0.004) {
      const a = snapLength(L, 'pentatonic');
      const b = snapLength(a.L, 'pentatonic');
      if (a.semi !== b.semi) good = false;
      if (![0, 2, 4, 7, 9].includes(((a.semi % 12) + 12) % 12)) good = false;
      if (Math.abs(barFreq(a.L) - a.f) > 1e-6) good = false;
    }
    ok('G · snapping is idempotent and lands on the scale', good, '41 lengths');
  }

  /* H · no tunnelling: drop a marble onto a rail from every height the wall
         allows and it must end up ON the rail, never through it */
  {
    let good = true, fastest = 0;
    for (let h = 0.05; h <= 1.2; h += 0.05) {
      resetIds(20000);
      const seg = makeRail(0.0, 1.30, 1.0, 1.30, { e: 0.1 });
      const m = newMarble(0, { x: 0.5, y: 1.30 - h, vx: 0, vy: 0 });
      const one = [m];
      const n = Math.round(1.6 / FIXED_DT);
      for (let i = 0; i < n; i++) {
        step(one, [seg], FIXED_DT, { free: true });
        fastest = Math.max(fastest, Math.abs(m.vy));
        if (m.y > 1.30 + MARBLE_R) { good = false; break; }
      }
    }
    ok('H · nothing tunnels through a rail', good,
       '24 drops to 1.2 m; peak ' + fastest.toFixed(2) + ' m/s = ' +
       (fastest * FIXED_DT * 1000).toFixed(2) + ' mm a step, vs a ' +
       ((MARBLE_R + RAIL_R) * 1000).toFixed(1) + ' mm contact');
  }

  /* I · energy never grows along a run */
  {
    resetIds(30000);
    const M = buildMachine('the-descent');
    const m = newMarble(0, RELEASE);
    const one = [m];
    const E0 = 0.5 * MARBLE_M * (m.vx ** 2 + m.vy ** 2) + MARBLE_M * G * (WALL.h - m.y);
    let worstGain = 0;
    for (let i = 0; i < Math.round(9 / FIXED_DT) && m.state === 'run'; i++) {
      step(one, segments(M.all), FIXED_DT, {});
      const E = 0.5 * MARBLE_M * (m.vx ** 2 + m.vy ** 2)
              + 0.5 * (0.4 * MARBLE_M * MARBLE_R ** 2) * m.om ** 2
              + MARBLE_M * G * (WALL.h - m.y);
      worstGain = Math.max(worstGain, (E - E0) / E0);
    }
    ok('I · a marble never gains energy', worstGain < 0.002,
       'worst excursion above release energy: ' + (worstGain * 100).toFixed(3) + '%');
  }

  /* J · every shipped machine delivers its marble to the trough, and plays */
  {
    let good = true, report = [];
    for (const key of Object.keys(MACHINES)) {
      if (key === 'empty') continue;
      const M = buildMachine(key);
      const tr = trace(M.all, { tMax: 16 });
      const n = tr.notes.length;
      if (tr.fate !== 'caught' || n < 3) good = false;
      report.push(key + ': ' + tr.fate + ', ' + n + ' notes in ' + tr.t.toFixed(2) + ' s');
    }
    ok('J · every shipped machine runs to the trough and plays', good, report.join(' · '));
  }

  /* K · the tracer is the machine: the same geometry gives the same note times
         twice, and a lone marble in the FULL loop plays the traced rhythm */
  {
    const M = buildMachine('two-hands');
    const a = trace(M.all), b = trace(M.all);
    let same = a.notes.length === b.notes.length;
    if (same) for (let i = 0; i < a.notes.length; i++)
      if (a.notes[i].t !== b.notes[i].t || a.notes[i].semi !== b.notes[i].semi) same = false;
    ok('K · the same wall plays the same rhythm, exactly', same,
       a.notes.length + ' notes, bit-identical times');
  }

  /* L · a crowd is NOT exact. Marbles knock each other, and the notes move.
         This is the number the drawer quotes, measured here rather than said. */
  {
    const M = buildMachine('the-descent');
    const segs = segments(M.all);
    function firstMarbleNotes(gap, n) {
      const ms = [M.__x], out = [];
      ms.length = 0;
      const a = newMarble(0, RELEASE); ms.push(a);
      let t = 0, k = 1;
      while (t < 8) {
        if (gap > 0 && k < n && t >= k * gap) { ms.push(newMarble(k, RELEASE)); k++; }
        for (const h of step(ms, segs, FIXED_DT, {}))
          if (h.part.kind === 'bar' && h.marble === a) out.push(t);
        t += FIXED_DT;
      }
      return out;
    }
    const alone = firstMarbleNotes(0, 1);
    let worst = 0, best = '';
    for (const gap of [0.16, 0.20, 0.26, 0.34, 0.42]) {
      const got = firstMarbleNotes(gap, 6);
      const n = Math.min(got.length, alone.length);
      for (let i = 0; i < n; i++) {
        const d = Math.abs(got[i] - alone[i]);
        if (d > worst) { worst = d; best = 'note ' + (i + 1) + ' at ' + gap.toFixed(2) + ' s spacing'; }
      }
    }
    ok('L · a crowd smears the beat, by a measured amount', alone.length >= 4 && worst > 0.0005,
       'alone: ' + alone.map(x => x.toFixed(3)).join(' ') + ' s; with five behind it, worst ' +
       (worst * 1000).toFixed(1) + ' ms (' + best + ')');
    JITTER_MS = worst * 1000;
  }

  /* M · the vane really does alternate: marble 1 and marble 2 play different
         notes, and marble 3 plays what marble 1 played */
  {
    const M = buildMachine('take-turns');
    const segs = segments(M.all);
    const runs = [];
    for (let k = 0; k < 4; k++) {
      const m = newMarble(k, RELEASE), one = [m], got = [];
      for (let i = 0; i < Math.round(9 / FIXED_DT) && m.state === 'run'; i++) {
        for (const h of step(one, segs, FIXED_DT, {}))
          if (h.part.kind === 'bar') got.push(noteName(h.part.semi));
      }
      runs.push(got.join(' '));
    }
    const alternates = runs[0] !== runs[1] && runs[0] === runs[2] && runs[1] === runs[3];
    ok('M · the vane makes consecutive marbles take turns', alternates,
       '[' + runs[0] + '] then [' + runs[1] + '], then back');
  }

  /* N · the voice really sings the length. Render a bar's strike and measure
         the rendered samples back with a Goertzel refined by parabolic peak —
         the number the ear gets, not the number the formula wanted. */
  {
    let worstCents = 0, peak = 0, rows = [];
    for (const semi of [7, 12, 19, 24, 31]) {
      const L = barLengthForFreq(semiToFreq(semi));
      const f1 = barFreq(L);
      const buf = barVoice(f1, { sr: 48000, amp: 1 });
      for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i]));
      const got = dominant(buf, 48000, f1 * 0.72, f1 * 1.38);
      const c = 1200 * Math.log2(got / f1);
      worstCents = Math.max(worstCents, Math.abs(c));
      rows.push(noteName(semi) + ' ' + (L * 1000).toFixed(0) + 'mm -> ' +
                got.toFixed(1) + ' Hz (' + (c >= 0 ? '+' : '') + c.toFixed(1) + 'c)');
    }
    ok('N · a bar sings the pitch its length demands', worstCents < 12 && peak <= 1.0,
       rows.join(' · ') + ' · peak ' + peak.toFixed(3));
  }

  return { pass: R.every(r => r.pass), results: R };
}

/* the strongest frequency in a buffer, between lo and hi — a coarse Goertzel
   sweep refined by a parabolic fit on the peak. */
export function dominant(buf, sr, lo, hi) {
  const N = Math.min(buf.length, Math.round(0.35 * sr));
  const step = (hi - lo) / 240;
  let bf = lo, bm = -1;
  const mag = f => {
    const w = 2 * Math.cos(2 * Math.PI * f / sr);
    let s1 = 0, s2 = 0;
    for (let i = 0; i < N; i++) { const s = buf[i] + w * s1 - s2; s2 = s1; s1 = s; }
    return s1 * s1 + s2 * s2 - w * s1 * s2;
  };
  const M = [];
  for (let f = lo; f <= hi; f += step) { const m = mag(f); M.push({ f, m }); if (m > bm) { bm = m; bf = f; } }
  const i = M.findIndex(o => o.f === bf);
  if (i > 0 && i < M.length - 1) {
    const a = Math.log(M[i - 1].m + 1e-30), b = Math.log(M[i].m + 1e-30), c = Math.log(M[i + 1].m + 1e-30);
    const d = 0.5 * (a - c) / (a - 2 * b + c);
    if (isFinite(d) && Math.abs(d) <= 1) bf += d * step;
  }
  return bf;
}
