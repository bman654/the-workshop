// ============================================================================
//  THE TEN-FOLD GLASS — the coarse focus                                (CORE)
//
//  Pure, DOM-free, dependency-free, Node-importable. The identical slab between
//  the sentinels below is forge-inlined into index.html; glass.test.mjs
//  re-extracts it and proves byte-parity (the lodestone-hall / extent pattern).
//
//  WHAT THIS IS. One brass coarse-focus wheel drives ONE number: `d`, a
//  continuous decade. Every plate in the ladder is drawn on that same
//  exponential axis, at size VIEW·10^(e−d), positioned so ONE fixed world point
//  stays pinned at screen centre. Nesting is therefore a CONSEQUENCE of the
//  geometry — never a per-pair cross-fade, never a transition to be authored.
//  Turn the wheel and the plate you are standing on shrinks continuously into a
//  smudge inside its parent, which was always drawn, at its true size, all along.
//
//  NO CLAIM IS MADE HERE. This is a delight piece: there is no theorem, no
//  neg-control, no accuracy pill. What it owes — and what runSelfTest() checks —
//  is LIVENESS: that the payoff FIRES. Four facts:
//    (a) REACHABILITY — from the top of the ladder, detent impulses ALONE visit
//        every plate index on the way down and again on the way back; none
//        unreachable, none skipped.
//    (b) THE RULE NEVER LIES — the decade readout after N detents is exactly
//        the start decade minus N.
//    (c) THE NESTING HAPPENS — at a fractional decade the render plan carries at
//        least two plates with nonzero alpha, and the drawn child/parent size
//        ratio equals 10^(e_child − e_parent) to 1e-12.
//    (d) RESTORE — a stored decade (missing, corrupt, out of range) restores to
//        a sane decade inside the ladder.
//  Plus (e): under reduced motion the free step hard-zeroes momentum at source.
// ============================================================================

// ===== TEN-FOLD CORE (inlined byte-twin of glass.mjs) BEGIN =====

/* ── §1 THE LADDER ────────────────────────────────────────────────────────────
   Each plate is a square frame whose SIDE is 10^e metres. `anchor` is where its
   CHILD (the next plate inward) sits inside it, as a fraction of THIS plate's
   side, measured from this plate's centre. Nesting is literal, not asserted:
   the child is drawn at exactly 10^(e_child − e_parent) of the parent's size,
   at the parent's anchor. Every plate's art is composed AROUND its anchor — the
   region the child emerges from is drawn as a plausible smudge that the child
   resolves, so the nesting never reads as a sticker on blank paper.
   Deepest first. `key` names the art module that draws it. ─────────────────── */
const LADDER = [
  { e: -15, key: 'nucleus',   name: 'the nucleus',            anchor: [ 0,     0    ] },
  { e: -12, key: 'emptyroom', name: "the atom's empty room",  anchor: [ 0.02, -0.03 ] },
  { e: -10, key: 'atom',      name: 'the carbon atom',        anchor: [-0.04,  0.05 ] },
  { e:  -9, key: 'lattice',   name: 'the molecular lattice',  anchor: [ 0.13, -0.09 ] },
  { e:  -6, key: 'chloro',    name: 'the chloroplast',        anchor: [-0.06,  0.02 ] },
  { e:  -5, key: 'cell',      name: 'the leaf cell',          anchor: [ 0.14, -0.10 ] },
  { e:  -3, key: 'vein',      name: 'the vein at a millimetre',anchor:[-0.11, -0.14 ] },
  { e:  -2, key: 'pinnule',   name: 'the pinnule',            anchor: [-0.18,  0.12 ] },
  { e:  -1, key: 'fern',      name: 'the fern',               anchor: [ 0.10, -0.22 ] },
  { e:   0, key: 'hand',      name: 'the hand',               anchor: [-0.05,  0.14 ] },
  { e:   1, key: 'stoop',     name: 'the lit stoop',          anchor: [ 0.07,  0.19 ] },
  { e:   2, key: 'street',    name: 'the lit street',         anchor: [ 0.16,  0.06 ] },
  { e:   4, key: 'city',      name: 'the city, from the air', anchor: [-0.12, -0.09 ] },
  { e:   5, key: 'coast',     name: 'the coast at night',     anchor: [ 0.19,  0.13 ] },
  { e:   7, key: 'earth',     name: 'the blue Earth',         anchor: [-0.09, -0.16 ] },
  { e:   9, key: 'moonroad',  name: "the Moon's road",        anchor: [ 0.21, -0.08 ] },
  { e:  11, key: 'inner',     name: 'the inner planets',      anchor: [-0.15,  0.18 ] },
  { e:  12, key: 'sunfamily', name: "the Sun's family",       anchor: [ 0.08,  0.11 ] },
  { e:  14, key: 'comets',    name: 'the comet halo',         anchor: [-0.22,  0.06 ] },
  { e:  17, key: 'localstars',name: 'the local stars',        anchor: [ 0.06,  0.05 ] },
  { e:  20, key: 'arm',       name: 'the spiral arm',         anchor: [ 0.17, -0.15 ] },
  { e:  21, key: 'galaxy',    name: 'the galaxy',             anchor: [-0.19, -0.14 ] },
  { e:  23, key: 'localgroup',name: 'the Local Group',        anchor: [ 0.12, -0.07 ] },
  { e:  24, key: 'web',       name: 'the cosmic web',         anchor: [ 0.11,  0.20 ] },
  { e:  26, key: 'whole',     name: 'the whole of it',        anchor: [-0.07,  0.09 ] },
];

const E_MIN = LADDER[0].e;                    // −15, the nucleus
const E_MAX = LADDER[LADDER.length - 1].e;    // +26, the whole of it
const OVERSHOOT = 0.4;                        // the ladder runs past the ends,
const T_MIN = E_MIN - OVERSHOOT;              // elastically — so the nucleus and
const T_MAX = E_MAX + OVERSHOOT;              // the whole of it are places you STAND.

/* g[i] = where the ZOOM POINT (the nucleus' centre) lies inside plate i, as a
   fraction of plate i's side, from its centre. Accumulated OUTWARD, so only
   small numbers ever multiply and precision never degrades across 41 decades.
   (Absolute world coordinates would need 10^41 of dynamic range; this needs
   none — every term is bounded by the anchors, which are ≤ 0.5.) */
function fixPoints(ladder) {
  const g = new Array(ladder.length);
  g[0] = [0, 0];
  for (let i = 1; i < ladder.length; i++) {
    const r = Math.pow(10, ladder[i - 1].e - ladder[i].e);   // child side / this side
    g[i] = [ ladder[i].anchor[0] + g[i - 1][0] * r,
             ladder[i].anchor[1] + g[i - 1][1] * r ];
  }
  return g;
}
const GFIX = fixPoints(LADDER);

/* ── §2 THE ENGRAVED RULE ─────────────────────────────────────────────────────
   EVERY detent carries a true legend, whether or not a plate is drawn there.
   Where the ladder is genuinely empty the legend IS the right answer: the
   emptiness between the comet halo and the nearest stars is three clicks of
   nothing, and that is the honest shape of the subject. We never fabricate a
   plate to fill a gap. ─────────────────────────────────────────────────────── */
const LEGEND = {
  '-15': "a proton's width",          '-14': 'ten protons abreast',
  '-13': 'a hundred protons',         '-12': "the atom's empty room",
  '-11': 'a tenth of an atom',        '-10': 'the carbon atom',
  '-9':  'a nanometre — the lattice', '-8':  'a small virus',
  '-7':  'the width of a wave of light', '-6': 'a micrometre',
  '-5':  'the leaf cell',             '-4':  'the thickness of the leaf',
  '-3':  'a millimetre — the vein',   '-2':  'a centimetre',
  '-1':  "a hand's span",             '0':   'a metre',
  '1':   'the lit stoop',             '2':   'the lit street',
  '3':   'a kilometre',               '4':   'the city',
  '5':   'the coast',                 '6':   "a continent's arm",
  '7':   'the Earth',                 '8':   'ten Earths abreast',
  '9':   "the Moon's road",           '10':  "inside Mercury's track",
  '11':  "the Earth's orbit",         '12':  "Saturn's track",
  '13':  'past Neptune',              '14':  "the comets' road",
  '15':  'a tenth of a light-year',   '16':  'one light-year',
  '17':  'the nearest stars',         '18':  'a hundred light-years',
  '19':  "a spiral arm's thickness",  '20':  'ten thousand light-years',
  '21':  'the galaxy',                '22':  "the galaxy's neighbours",
  '23':  'the Local Group',           '24':  'the cosmic web',
  '25':  'a billion light-years',     '26':  'as far as light has come',
};

/* the interstitial bands — the void's own weather, one per stretch. A TINT on
   the shared log-space mote field, never nine separate systems. */
const BANDS = [
  { lo: -15, hi: -10, col: '168,190,232', name: 'quantum haze' },
  { lo: -10, hi:  -6, col: '214,200,168', name: 'molecular haze' },
  { lo:  -6, hi:  -2, col: '150,190,140', name: 'cell water' },
  { lo:  -2, hi:   2, col: '226,214,182', name: 'dust in the air' },
  { lo:   2, hi:   7, col: '160,180,206', name: 'haze and cloud' },
  { lo:   7, hi:  12, col: '200,208,226', name: 'dark, and a fleck of light' },
  { lo:  12, hi:  17, col: '226,222,236', name: 'the sparse stars' },
  { lo:  17, hi:  21, col: '214,206,232', name: 'interstellar dust' },
  { lo:  21, hi:  27, col: '204,196,226', name: 'the void between' },
];
function bandAt(d) {
  for (const b of BANDS) if (d >= b.lo && d < b.hi) return b;
  return d < BANDS[0].lo ? BANDS[0] : BANDS[BANDS.length - 1];
}

/* ── §3 THE DETENT WARP ───────────────────────────────────────────────────────
   Under the finger, a MONOTONE warp that DWELLS at integers and hurries across
   the crests. That dwell is the click you feel before you hear it. Monotone
   because B < 1 ⇒ warp'(u) = 1 − B·cos(2πu) > 0 everywhere: the wheel can never
   run backwards under a forward hand. Invertible for the same reason, so a
   re-grab mid-travel never snaps. ────────────────────────────────────────── */
const WARP_B = 0.55;
const warp = u => u - WARP_B * Math.sin(2 * Math.PI * u) / (2 * Math.PI);
function invWarp(target) {                 // Newton; warp' ≥ 1−B = 0.45, so it converges
  let u = target;
  for (let i = 0; i < 32; i++) {
    const f = warp(u) - target, df = 1 - WARP_B * Math.cos(2 * Math.PI * u);
    const step = f / df;
    u -= step;
    if (Math.abs(step) < 1e-14) break;
  }
  return u;
}

/* ── §4 STATE HELPERS ──────────────────────────────────────────────────────── */
const clampTravel = x => Math.max(T_MIN, Math.min(T_MAX, x));   // incl. overshoot
const clampDetent = x => Math.max(E_MIN, Math.min(E_MAX, x));   // true ladder ends

/* THE REAL DETENT ENTRY FUNCTION. Every impulse — an arrow key, a wheel notch's
   settle, a tap on the rule's shoulder — comes through here. The twin drives
   THIS, never a synthetic pointer event on a canvas, which is why headless can
   prove the travel actually fires. */
function stepDetent(d, dir, step) {
  if (!dir) return clampDetent(Math.round(d));
  const k = (step === undefined || step === null) ? 1 : Math.max(1, Math.abs(step));
  const n = Math.round(d);
  const off = Math.abs(d - n) > 1e-9;
  // Off a detent, with the nearest one lying the way we are already going? Then
  // the first press SEATS us there instead of skipping over it — the wheel never
  // swallows a plate just because you grabbed it mid-travel.
  if (off && Math.sign(n - d) === Math.sign(dir)) return clampDetent(n + (k - 1) * dir);
  return clampDetent(n + dir * k);
}

/* the decade a stored value should restore to: anything absent, non-finite or
   off the ladder lands at the hand. */
function sanitizeD(raw) {
  const v = typeof raw === 'number' ? raw : parseFloat(raw);
  if (!Number.isFinite(v)) return 0;
  if (v < E_MIN || v > E_MAX) return 0;
  return v;
}

/* ── §5 PRESENCE ──────────────────────────────────────────────────────────────
   How present is a plate at screen-scale k = S/VIEW (l = log10 k = e − d).
   It grows IN from a speck (fin, from 3.9 decades below) and DISSOLVES slowly
   as you get inside it (fout, out to 4.2 decades of blow-up). The blow-up
   window is DELIBERATELY long: across a three-decade gap the plate you have
   just left is still there overhead, magnified a thousandfold, dissolving into
   its own grain — which is what makes the emptiness feel like travel through
   something rather than a cut to black. Its alpha decays the whole way, so a
   magnified plate reads as weather, never as a fat wash over the frame. */
const L_IN = -3.9, L_IN_RAMP = 1.5, L_OUT = 4.2, L_OUT_RAMP = 2.6;
function alphaFor(k) {
  if (!(k > 0)) return 0;
  const l = Math.log10(k);
  if (l <= L_IN || l >= L_OUT) return 0;
  const fin  = Math.min(1, (l - L_IN) / L_IN_RAMP);
  const fout = Math.min(1, (L_OUT - l) / L_OUT_RAMP);
  return Math.max(0, Math.min(fin, fout));
}

/* THE RENDER PLAN — the whole scene as data, at decade d, for a frame whose
   nominal plate side is VIEW px. Outermost first (painter's order: the parent
   is laid down, then the child lands inside it). x,y are offsets from the
   pinned screen point. This function is the single source of the nesting: the
   twin samples it and checks the drawn size ratio IS 10^(Δe). */
function renderPlan(d, VIEW) {
  const out = [];
  for (let i = LADDER.length - 1; i >= 0; i--) {
    const p = LADDER[i], k = Math.pow(10, p.e - d), a = alphaFor(k);
    if (a <= 1e-4) continue;
    const S = VIEW * k;
    out.push({ i, e: p.e, key: p.key, name: p.name, alpha: a, size: S,
               x: -GFIX[i][0] * S, y: -GFIX[i][1] * S });
  }
  return out;
}

/* ── §6 THE FREE STEP — the pawl ──────────────────────────────────────────────
   Off the finger, the wheel is a detent spring plus its own friction. The pawl
   SKIMS the crests at speed and BITES when slow — what a real detent does, and
   what lets one flick coast five decades and still seat with a click.
   Beyond the true ends the ladder is ELASTIC: a spring pulls you back, so the
   nucleus and the whole of it are places you stand on rather than walls you are
   stopped at — but the wall click at the true end still tells you where you are.
   REDUCED MOTION: momentum is hard-zeroed AT THE SOURCE (not damped, not
   hidden) — the reduced room is a second design that steps one plate per press,
   and this function must never hand it a velocity. */
function stepFree(d, vel, dt, opts) {
  const reduced = !!(opts && opts.reduced);
  if (reduced) {
    return { d: clampTravel(d), vel: 0, crossed: 0, wall: false };
  }
  const h = Math.min(0.05, Math.max(0, dt));
  const fr = d - Math.round(d), av = Math.abs(vel);
  let v = vel;
  // a crest is a real but UNSTABLE balance — a real wheel always tips off it.
  if (av < 1e-4 && Math.abs(Math.abs(fr) - 0.5) < 1e-4) v += 1e-3;
  const A = 34 / (1 + Math.pow(av / 1.15, 2));
  const C = 0.80 + 8.5 / (1 + Math.pow(av / 0.85, 2));
  v += -A * Math.sin(2 * Math.PI * fr) / (2 * Math.PI) * h;
  // the elastic ends
  let wall = false;
  if (d < E_MIN) { v += (E_MIN - d) * 46 * h; wall = true; }
  if (d > E_MAX) { v -= (d - E_MAX) * 46 * h; wall = true; }
  v *= Math.exp(-C * h);
  let nd;
  if (Math.abs(v) < 0.015 && Math.abs(fr) < 0.012 && !wall) { v = 0; nd = Math.round(d); }
  else nd = clampTravel(d + v * h);
  const crossed = ridgeIndex(nd) - ridgeIndex(d);
  return { d: nd, vel: v, crossed, wall };
}
/* half-decade ridges: the knurl has a crest between every pair of detents, so
   the ear gets a tick at every half-step and a seat at every whole one. */
const ridgeIndex = x => Math.round(x * 2);

/* ── §7 THE READING ───────────────────────────────────────────────────────────
   The reading is the TRUE decade, never a rounded one: off a detent it carries
   its two decimals, because that is where you actually are. */
function readingAt(d) {
  const n = Math.round(d), atDetent = Math.abs(d - n) < 0.06;
  const plate = LADDER.find(q => q.e === n) || null;
  const exp = atDetent ? String(n) : (d < 0 ? '−' : '') + Math.abs(d).toFixed(2);
  return {
    n, atDetent, plate, exp,
    legend: LEGEND[String(n)] || '',
    title: plate ? plate.name : (LEGEND[String(n)] || ''),
    hasPlate: !!plate,
    band: bandAt(d),
  };
}

/* ── §8 THE LIVENESS TWIN ─────────────────────────────────────────────────────
   NOT a theorem. Five facts that the EXPERIENCE fires. Same code runs in Node
   (glass.test.mjs) and in the page (?selftest → the siblings' chip idiom). */
function runSelfTest() {
  const lines = [];
  const add = (name, ok, detail) => lines.push({ name, ok: !!ok, detail: detail || '' });

  // (a) REACHABILITY — detent impulses ALONE visit every plate, down and back.
  {
    let d = E_MAX, presses = 0;
    const seenDown = new Set(), seenUp = new Set();
    const mark = (set, v) => { const p = LADDER.find(q => q.e === Math.round(v)); if (p) set.add(p.key); };
    mark(seenDown, d);
    while (d > E_MIN && presses < 500) { d = stepDetent(d, -1); mark(seenDown, d); presses++; }
    const bottomed = Math.abs(d - E_MIN) < 1e-12;
    mark(seenUp, d);
    while (d < E_MAX && presses < 1000) { d = stepDetent(d, +1); mark(seenUp, d); presses++; }
    const topped = Math.abs(d - E_MAX) < 1e-12;
    const missDown = LADDER.filter(p => !seenDown.has(p.key));
    const missUp   = LADDER.filter(p => !seenUp.has(p.key));
    add('(a) the whole ladder is reachable by the detent alone — down',
        bottomed && missDown.length === 0,
        `${seenDown.size}/${LADDER.length} plates visited, bottom=10^${E_MIN}` +
        (missDown.length ? ' MISSED ' + missDown.map(p => p.key).join(',') : ''));
    add('(a) …and again on the way back up',
        topped && missUp.length === 0,
        `${seenUp.size}/${LADDER.length} plates visited, top=10^${E_MAX}` +
        (missUp.length ? ' MISSED ' + missUp.map(p => p.key).join(',') : ''));
  }

  // (b) THE RULE NEVER LIES — N detents down is exactly N decades down.
  {
    let d = E_MAX, worst = 0, ok = true;
    for (let N = 1; N <= E_MAX - E_MIN; N++) {
      d = stepDetent(d, -1);
      const want = E_MAX - N;
      worst = Math.max(worst, Math.abs(d - want));
      if (d !== want) ok = false;
      if (readingAt(d).exp !== String(want)) ok = false;
    }
    add('(b) after N detents the readout is exactly the start decade minus N',
        ok && worst === 0, `41 presses, max |error| = ${worst} decades (exact)`);
  }

  // (c) THE NESTING HAPPENS — mid-travel, two plates are drawn, and the child's
  //     drawn size really is 10^(Δe) of its parent's.
  {
    const VIEW = 720;
    let minPlates = 99, worstRatio = 0, samples = 0, N = 0;
    for (let t = 0; t <= 418; t++) {
      const d = T_MIN + t * 0.1;                       // the WHOLE travel, ends included
      N++;
      const plan = renderPlan(d, VIEW).filter(q => q.alpha > 0);
      minPlates = Math.min(minPlates, plan.length);
      for (let j = 1; j < plan.length; j++) {
        const parent = plan[j - 1], child = plan[j];   // plan is outermost-first
        const want = Math.pow(10, child.e - parent.e);
        const got = child.size / parent.size;
        worstRatio = Math.max(worstRatio, Math.abs(got - want) / want);
        samples++;
      }
    }
    add('(c) mid-travel the plan draws BOTH neighbours (the nesting is never cut)',
        minPlates >= 2, `min plates with alpha>0 over ${N} samples of the whole travel = ${minPlates}`);
    add('(c) drawn child/parent size ratio === 10^(Δe)',
        worstRatio < 1e-12, `max relative error ${worstRatio.toExponential(2)} over ${samples} pairs`);
  }

  // (d) RESTORE — a reload lands on a sane decade.
  {
    const cases = [ [undefined, 0], [null, 0], ['', 0], ['nope', 0], [NaN, 0],
                    [1e9, 0], [-1e9, 0], ['4.5', 4.5], [-15, -15], [26, 26], [0, 0] ];
    let ok = true, bad = '';
    for (const [raw, want] of cases) {
      const got = sanitizeD(raw);
      if (got !== want) { ok = false; bad += ` ${String(raw)}→${got}(want ${want})`; }
      if (got < E_MIN || got > E_MAX) ok = false;
    }
    add('(d) after a reload the room restores to a decade on the ladder',
        ok, ok ? `${cases.length} stored values, all sane` : 'BAD:' + bad);
  }

  // (e) REDUCED MOTION — momentum is zeroed at the source, not merely damped.
  {
    let ok = true, d = 3.4, v = 7.5;
    for (let i = 0; i < 240; i++) {
      const s = stepFree(d, v, 1 / 60, { reduced: true });
      if (s.vel !== 0) ok = false;
      if (s.d !== d) ok = false;          // no drift without a press
      d = s.d; v = s.vel;
    }
    add('(e) under reduced motion the wheel carries no momentum at all',
        ok, '240 frames from vel=7.5 → vel stays exactly 0, d never drifts');
  }

  // (f) the warp is monotone + invertible — a re-grab never snaps.
  {
    let mono = true, worst = 0;
    let prev = warp(-2);
    for (let u = -2; u <= 2.0001; u += 0.0005) {
      const w = warp(u);
      if (w < prev - 1e-15) mono = false;
      prev = w;
      const back = invWarp(w);
      worst = Math.max(worst, Math.abs(back - u));
    }
    add('(f) the finger warp is monotone and invertible (a re-grab never snaps)',
        mono && worst < 1e-9, `max |invWarp(warp(u)) − u| = ${worst.toExponential(2)}`);
  }

  const passed = lines.filter(l => l.ok).length;
  return { lines, passed, total: lines.length, ok: passed === lines.length };
}

// ===== TEN-FOLD CORE END =====

export {
  LADDER, LEGEND, BANDS, GFIX,
  E_MIN, E_MAX, T_MIN, T_MAX, OVERSHOOT, WARP_B,
  fixPoints, bandAt, warp, invWarp, clampTravel, clampDetent,
  stepDetent, sanitizeD, alphaFor, renderPlan, stepFree, ridgeIndex, readingAt,
  runSelfTest,
};
