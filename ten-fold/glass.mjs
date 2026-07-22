// ============================================================================
//  THE TEN-FOLD ENGINE — the coarse focus, now a WORLD FACTORY             (CORE)
//
//  Pure, DOM-free, dependency-free, Node-importable. The identical slab between
//  the sentinels below is forge-inlined into BOTH ten-fold/index.html (the
//  SPACE glass) and ten-fold/hour-glass/index.html (the TIME glass);
//  glass.test.mjs re-extracts it and proves byte-parity for the SPACE page
//  (the lodestone-hall / extent pattern), and hour-glass.test.mjs proves it for
//  the TIME page.
//
//  WHAT THIS IS. One brass coarse-focus wheel drives ONE number: `d`, a
//  continuous decade. `makeAxis(cfg)` builds a WORLD around a ladder — the
//  render plan, the reading, the detent, the free step, the liveness twin — all
//  closed over THAT ladder. The SPACE glass builds makeAxis(SPACE_LADDER) and
//  behaves byte-identically to the room that shipped before this refactor. The
//  TIME glass builds makeAxis(TIME_LADDER, {tempo:true}) — the SAME geometry,
//  but the number `d` now picks which TEMPO is real-time instead of which SIZE
//  fills the frame. The two are reciprocal: renderPlan returns each frame's
//  spatial scale k = 10^(e−d); the temporal RATE of a span is exactly 1/k.
//
//  THE ONE NEW LAW (all the time physics): spanRate(e,d) = 10^(d−e). The gazed
//  span (e=d) runs at rate 1 — watchable — and every other span runs at its TRUE
//  relative rate, exactly 10:1 per decade. Shrink-away and speed-up are ONE
//  gesture. Honesty: only the 10:1 RATIOS are literally true; the absolute tempo
//  is gauge-centred on your gaze, a viewing convenience — the same register in
//  which the Glass owns its VIEW-scaling.
//
//  NO CLAIM IS MADE HERE. These are delight pieces: no theorem, no accuracy pill.
//  What they owe — and what runSelfTest()/runTimeTest() check — is LIVENESS: that
//  the payoff FIRES. The geometry checks (a)–(f) ride every world; the time
//  checks add: ticking fires, ten-per-one is exact, the gaze is always
//  watchable, the fast pole is honest, and reduced motion is a real second
//  design.
// ============================================================================

// ===== TEN-FOLD CORE (inlined byte-twin of glass.mjs) BEGIN =====

/* ── §0 THE FINGER WARP — axis-independent ────────────────────────────────────
   Under the finger, a MONOTONE warp that DWELLS at integers and hurries across
   the crests. That dwell is the click you feel before you hear it. Monotone
   because B < 1 ⇒ warp'(u) = 1 − B·cos(2πu) > 0 everywhere: the wheel can never
   run backwards under a forward hand. Invertible for the same reason, so a
   re-grab mid-travel never snaps. Shared by every world — a finger is a finger. */
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

/* ── §1 THE TIME PHYSICS — pure functions of (e, d) ───────────────────────────
   spanRate is gauge-centred: the gazed span runs at 1. TAU_P is the flicker-
   fusion period (≈60 Hz). BASE_PERIOD is the real seconds the gazed span takes
   to loop once — a chosen viewing convenience (the honesty seam). A span's real
   frequency is spanRate/BASE_PERIOD Hz; its persistence glow is the steady phos-
   phor residual 1−exp(−f·TAU_P), strictly rising with f, so strictly FALLING
   with e — white-hot at the fast pole, dark at the slow. At the fusion period
   (f = 1/TAU_P) the glow is pinned to 1−1/e. */
const TAU_P = 0.017;
const BASE_PERIOD = 2.4;
const spanRate = (e, d) => Math.pow(10, d - e);          // gauge-centred: gaze === 1
const spanHz   = (e, d) => spanRate(e, d) / BASE_PERIOD; // real cycles per second
const glowOf   = (e, d) => 1 - Math.exp(-spanHz(e, d) * TAU_P);
/* the ONE split point: a span whose period is shorter than a frame cannot be
   animated (it would alias — the rig.js Nyquist lesson), so it is drawn as its
   closed-form steady glow instead of looping millions of times per frame. */
const spanIsFast = (e, d, dt) => spanHz(e, d) * dt >= 1;
/* advance one span's phase by one frame. Frame-rate independent; reduced motion
   holds it; a fast span holds too (its steady glow carries the motion). Returns
   a phase in [0,1). */
function stepPhase(ph, e, d, dt, reduced) {
  if (reduced) return ph;                       // never autonomously advances
  if (spanIsFast(e, d, dt)) return ph;          // steady glow carries it, no loop
  let p = ph + spanHz(e, d) * dt;
  p -= Math.floor(p);
  return p;
}

/* ── §2 makeAxis — the world factory ──────────────────────────────────────────
   Everything that used to close over module-level LADDER/LEGEND/GFIX now closes
   over the ladder handed in here. Same math, byte-identical output for the space
   ladder. cfg = { ladder, legend, bands, overshoot?, tempo? }. */
function makeAxis(cfg) {
  const ladder = cfg.ladder;
  const legend = cfg.legend;
  const bands  = cfg.bands;
  const tempo  = !!cfg.tempo;
  const E_MIN = ladder[0].e;                     // deepest / fastest
  const E_MAX = ladder[ladder.length - 1].e;     // outermost / slowest
  const OVERSHOOT = (cfg.overshoot == null) ? 0.4 : cfg.overshoot;
  const T_MIN = E_MIN - OVERSHOOT;               // the ladder runs past the ends,
  const T_MAX = E_MAX + OVERSHOOT;               // elastically — places you STAND.

  /* g[i] = where the ZOOM POINT (the deepest span's centre) lies inside span i,
     as a fraction of span i's side, from its centre. Accumulated OUTWARD, so
     only small numbers ever multiply and precision never degrades across the
     whole ladder. */
  function fixPoints(ld) {
    const g = new Array(ld.length);
    g[0] = [0, 0];
    for (let i = 1; i < ld.length; i++) {
      const r = Math.pow(10, ld[i - 1].e - ld[i].e);   // child side / this side
      g[i] = [ ld[i].anchor[0] + g[i - 1][0] * r,
               ld[i].anchor[1] + g[i - 1][1] * r ];
    }
    return g;
  }
  const gfix = fixPoints(ladder);

  /* the interstitial bands — the void's own weather, one per stretch. A TINT on
     the shared log-space field, never many separate systems. */
  function bandAt(d) {
    for (const b of bands) if (d >= b.lo && d < b.hi) return b;
    return d < bands[0].lo ? bands[0] : bands[bands.length - 1];
  }

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
    if (off && Math.sign(n - d) === Math.sign(dir)) return clampDetent(n + (k - 1) * dir);
    return clampDetent(n + dir * k);
  }

  /* the decade a stored value should restore to: anything absent, non-finite or
     off the ladder lands at the anchor (0). */
  function sanitizeD(raw) {
    const v = typeof raw === 'number' ? raw : parseFloat(raw);
    if (!Number.isFinite(v)) return 0;
    if (v < E_MIN || v > E_MAX) return 0;
    return v;
  }

  /* PRESENCE — how present a span is at screen-scale k (l = log10 k = e − d). It
     grows IN from a speck and DISSOLVES slowly as you get inside it. The blow-up
     window is DELIBERATELY long so the emptiness feels like travel through
     something rather than a cut to black. */
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
     nominal span side is VIEW px. Outermost first (painter's order). x,y are
     offsets from the pinned screen point. Single source of the nesting: the twin
     samples it and checks the drawn size ratio IS 10^(Δe) — and, for time, the
     rate ratio is its reciprocal. */
  function renderPlan(d, VIEW) {
    const out = [];
    for (let i = ladder.length - 1; i >= 0; i--) {
      const p = ladder[i], k = Math.pow(10, p.e - d), a = alphaFor(k);
      if (a <= 1e-4) continue;
      const S = VIEW * k;
      out.push({ i, e: p.e, key: p.key, name: p.name, alpha: a, size: S,
                 x: -gfix[i][0] * S, y: -gfix[i][1] * S,
                 rate: spanRate(p.e, d) });
    }
    return out;
  }

  /* THE FREE STEP — the pawl. Off the finger, the wheel is a detent spring plus
     its own friction. Beyond the true ends the ladder is ELASTIC. REDUCED MOTION:
     momentum is hard-zeroed AT THE SOURCE. */
  const ridgeIndex = x => Math.round(x * 2);
  function stepFree(d, vel, dt, opts) {
    const reduced = !!(opts && opts.reduced);
    if (reduced) {
      return { d: clampTravel(d), vel: 0, crossed: 0, wall: false };
    }
    const h = Math.min(0.05, Math.max(0, dt));
    const fr = d - Math.round(d), av = Math.abs(vel);
    let v = vel;
    if (av < 1e-4 && Math.abs(Math.abs(fr) - 0.5) < 1e-4) v += 1e-3;
    const A = 34 / (1 + Math.pow(av / 1.15, 2));
    const C = 0.80 + 8.5 / (1 + Math.pow(av / 0.85, 2));
    v += -A * Math.sin(2 * Math.PI * fr) / (2 * Math.PI) * h;
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

  /* THE READING — the TRUE decade, never a rounded one. For time, `dur` carries a
     human phrase for the gazed span's real period. */
  function readingAt(d) {
    const n = Math.round(d), atDetent = Math.abs(d - n) < 0.06;
    const span = ladder.find(q => q.e === n) || null;
    const exp = atDetent ? String(n) : (d < 0 ? '−' : '') + Math.abs(d).toFixed(2);
    return {
      n, atDetent, plate: span, span, exp,
      legend: legend[String(n)] || '',
      title: span ? span.name : (legend[String(n)] || ''),
      hasPlate: !!span, hasSpan: !!span,
      band: bandAt(d),
    };
  }

  /* THE GEOMETRY LIVENESS — the six facts that ride EVERY world. Same code in
     Node and in the page ?selftest chip. */
  function runSelfTest() {
    const lines = [];
    const add = (name, ok, detail) => lines.push({ name, ok: !!ok, detail: detail || '' });

    // (a) REACHABILITY — detent impulses ALONE visit every span, down and back.
    {
      let d = E_MAX, presses = 0;
      const seenDown = new Set(), seenUp = new Set();
      const mark = (set, v) => { const p = ladder.find(q => q.e === Math.round(v)); if (p) set.add(p.key); };
      mark(seenDown, d);
      while (d > E_MIN && presses < 900) { d = stepDetent(d, -1); mark(seenDown, d); presses++; }
      const bottomed = Math.abs(d - E_MIN) < 1e-12;
      mark(seenUp, d);
      while (d < E_MAX && presses < 1800) { d = stepDetent(d, +1); mark(seenUp, d); presses++; }
      const topped = Math.abs(d - E_MAX) < 1e-12;
      const missDown = ladder.filter(p => !seenDown.has(p.key));
      const missUp   = ladder.filter(p => !seenUp.has(p.key));
      add('(a) the whole ladder is reachable by the detent alone — down',
          bottomed && missDown.length === 0,
          `${seenDown.size}/${ladder.length} spans visited, bottom=10^${E_MIN}` +
          (missDown.length ? ' MISSED ' + missDown.map(p => p.key).join(',') : ''));
      add('(a) …and again on the way back up',
          topped && missUp.length === 0,
          `${seenUp.size}/${ladder.length} spans visited, top=10^${E_MAX}` +
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
          ok && worst === 0, `${E_MAX - E_MIN} presses, max |error| = ${worst} decades (exact)`);
    }

    // (c) THE NESTING HAPPENS — mid-travel two spans are drawn and the child's
    //     drawn size really is 10^(Δe) of its parent's.
    {
      const VIEW = 720;
      let minPlates = 99, worstRatio = 0, samples = 0, N = 0;
      const steps = Math.round((T_MAX - T_MIN) * 10);
      for (let t = 0; t <= steps; t++) {
        const d = T_MIN + t * 0.1;
        N++;
        const plan = renderPlan(d, VIEW).filter(q => q.alpha > 0);
        minPlates = Math.min(minPlates, plan.length);
        for (let j = 1; j < plan.length; j++) {
          const parent = plan[j - 1], child = plan[j];
          const want = Math.pow(10, child.e - parent.e);
          const got = child.size / parent.size;
          worstRatio = Math.max(worstRatio, Math.abs(got - want) / want);
          samples++;
        }
      }
      add('(c) mid-travel the plan draws BOTH neighbours (the nesting is never cut)',
          minPlates >= 2, `min spans with alpha>0 over ${N} samples of the whole travel = ${minPlates}`);
      add('(c) drawn child/parent size ratio === 10^(Δe)',
          worstRatio < 1e-12, `max relative error ${worstRatio.toExponential(2)} over ${samples} pairs`);
    }

    // (d) RESTORE — a reload lands on a sane decade.
    {
      const cases = [ [undefined, 0], [null, 0], ['', 0], ['nope', 0], [NaN, 0],
                      [1e9, 0], [-1e9, 0], ['3.5', 3.5], [E_MIN, E_MIN], [E_MAX, E_MAX], [0, 0] ];
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
      let ok = true, d = Math.min(3.4, E_MAX - 1), v = 7.5;
      for (let i = 0; i < 240; i++) {
        const s = stepFree(d, v, 1 / 60, { reduced: true });
        if (s.vel !== 0) ok = false;
        if (s.d !== d) ok = false;
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

  return {
    ladder, legend, bands, gfix, tempo,
    E_MIN, E_MAX, T_MIN, T_MAX, OVERSHOOT,
    fixPoints, bandAt, clampTravel, clampDetent, stepDetent, sanitizeD,
    alphaFor, renderPlan, stepFree, ridgeIndex, readingAt, runSelfTest,
  };
}

/* ── §3 THE SPACE LADDER — the world the Ten-Fold Glass shows ─────────────────
   Each span is a square frame whose SIDE is 10^e metres. `anchor` is where its
   CHILD (the next span inward) sits inside it, as a fraction of THIS frame's
   side, from its centre. Deepest first. `key` names the art module that draws it. */
const SPACE_LADDER = [
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

const SPACE_LEGEND = {
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

const SPACE_BANDS = [
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

const SPACE = makeAxis({ ladder: SPACE_LADDER, legend: SPACE_LEGEND, bands: SPACE_BANDS });

/* the old free names, bound to the SPACE world, so the Glass page and
   glass.test.mjs read exactly as before — byte-identical behaviour. */
const LADDER = SPACE.ladder, LEGEND = SPACE.legend, BANDS = SPACE.bands, GFIX = SPACE.gfix;
const E_MIN = SPACE.E_MIN, E_MAX = SPACE.E_MAX, T_MIN = SPACE.T_MIN, T_MAX = SPACE.T_MAX;
const OVERSHOOT = SPACE.OVERSHOOT;
const fixPoints  = SPACE.fixPoints;
const bandAt     = SPACE.bandAt;
const clampTravel = SPACE.clampTravel;
const clampDetent = SPACE.clampDetent;
const stepDetent = SPACE.stepDetent;
const sanitizeD  = SPACE.sanitizeD;
const alphaFor   = SPACE.alphaFor;
const renderPlan = SPACE.renderPlan;
const stepFree   = SPACE.stepFree;
const ridgeIndex = SPACE.ridgeIndex;
const readingAt  = SPACE.readingAt;
const runSelfTest = SPACE.runSelfTest;

/* ── §4 THE TIME LADDER — the world the Hour-Glass shows ──────────────────────
   Each span is a DURATION whose length is 10^e seconds. Deepest/fastest first.
   `anchor` twins the space anchors — where the child span nests. The gaze at e=d
   runs at spanRate 1 (watchable); everything deeper runs faster, everything
   slower runs slower, exactly 10:1 per decade. ~21 drawn over 33 decades, honest
   legend-only gaps between (never a fabricated beat to fill geologic quiet). */
const TIME_LADDER = [
  { e: -15, key: 'wave',      name: 'a wave of light',        anchor: [ 0,     0    ] },
  { e: -12, key: 'bond',      name: 'a bond, trembling',      anchor: [ 0.03, -0.02 ] },
  { e:  -9, key: 'spark',     name: 'a nerve spark',          anchor: [-0.05,  0.04 ] },
  { e:  -6, key: 'flash',     name: 'a camera flash',         anchor: [ 0.11, -0.08 ] },
  { e:  -3, key: 'wing',      name: "a fly's wingbeat",       anchor: [-0.10, -0.13 ] },
  { e:  -1, key: 'blink',     name: 'a blink',                anchor: [ 0.09, -0.20 ] },
  { e:   0, key: 'heart',     name: 'a heartbeat',            anchor: [-0.05,  0.14 ] },
  { e:   1, key: 'swell',     name: 'a slow breath',          anchor: [ 0.07,  0.18 ] },
  { e:   2, key: 'sand',      name: 'a minute of sand',       anchor: [ 0.15,  0.05 ] },
  { e:   3, key: 'tide',      name: 'the turning hour',       anchor: [-0.12, -0.08 ] },
  { e:   5, key: 'day',       name: 'a day and a night',      anchor: [ 0.18,  0.12 ] },
  { e:   6, key: 'moon',      name: 'a month of the moon',    anchor: [-0.09, -0.15 ] },
  { e:   7, key: 'season',    name: 'the turning year',       anchor: [ 0.20, -0.07 ] },
  { e:   9, key: 'face',      name: 'a life, in a face',      anchor: [-0.14,  0.17 ] },
  { e:  10, key: 'writing',   name: 'since the first writing',anchor: [ 0.08,  0.10 ] },
  { e:  11, key: 'city',      name: 'the age of a city',      anchor: [-0.20,  0.06 ] },
  { e:  13, key: 'ice',       name: 'the ice, advancing',     anchor: [ 0.06,  0.05 ] },
  { e:  14, key: 'mountain',  name: 'a mountain, rising',     anchor: [ 0.16, -0.14 ] },
  { e:  15, key: 'drift',     name: 'the continents adrift',  anchor: [-0.18, -0.13 ] },
  { e:  17, key: 'earthlife', name: 'the whole of life',      anchor: [ 0.11, -0.06 ] },
  { e:  18, key: 'cosmos',    name: 'longer than the stars',  anchor: [-0.07,  0.09 ] },
];

const TIME_LEGEND = {
  '-15': 'a wave of light passing',   '-14': 'ten waves of light',
  '-13': 'a hundred waves',           '-12': 'an atom, trembling',
  '-11': 'a bond, ringing',           '-10': 'a molecule turning over',
  '-9':  'a nerve’s spark',      '-8':  'a transistor switching',
  '-7':  'a fast shutter',            '-6':  'a camera flash',
  '-5':  'a hummingbird’s wing', '-4':  'the flick of an eye',
  '-3':  "a fly's wingbeat",          '-2':  'a struck string',
  '-1':  'a blink',                   '0':   'a heartbeat',
  '1':   'a slow breath',             '2':   'a minute of sand',
  '3':   'the turning hour',          '4':   'a working morning',
  '5':   'a day and a night',         '6':   'a month of the moon',
  '7':   'the turning year',          '8':   'a human generation',
  '9':   'a long life',               '10':  'since the first writing',
  '11':  'the age of a city',         '12':  'since the last ice',
  '13':  'the ice, advancing',        '14':  'a mountain range rising',
  '15':  'the continents adrift',     '16':  'since the first life',
  '17':  'the whole of life on Earth','18':  'longer than the stars have shone',
  '19':  'past the age of the Sun',   '20':  'when the last stars gutter',
};

const TIME_BANDS = [
  { lo: -15, hi: -10, col: '180,196,236', name: 'the flicker no eye can hold' },
  { lo: -10, hi:  -6, col: '210,192,236', name: 'faster than thought' },
  { lo:  -6, hi:  -2, col: '236,206,176', name: 'the quick of things' },
  { lo:  -2, hi:   2, col: '236,220,180', name: 'the body’s own time' },
  { lo:   2, hi:   5, col: '224,210,168', name: 'the hours of a room' },
  { lo:   5, hi:   8, col: '200,214,206', name: 'the wheel of sky' },
  { lo:   8, hi:  11, col: '206,216,224', name: 'a life, and its memory' },
  { lo:  11, hi:  15, col: '210,206,226', name: 'deep time, patient' },
  { lo:  15, hi:  21, col: '198,196,224', name: 'longer than any witness' },
];

const TIME = makeAxis({ ladder: TIME_LADDER, legend: TIME_LEGEND, bands: TIME_BANDS, tempo: true });

/* ── §5 THE TIME LIVENESS — the payoff FIRES (ticking · ten-per-one · gaze ·
   fast pole · reduced motion). Claim-free: NO theorem. Same code in Node
   (hour-glass.test.mjs) and in the page ?selftest chip. Inherits the six
   geometry facts from world.runSelfTest(). */
function runTimeTest(world) {
  const W = world || TIME;
  const lines = [];
  const add = (name, ok, detail) => lines.push({ name, ok: !!ok, detail: detail || '' });

  // inherit the geometry liveness (reachability, rule, nesting, restore, reduced,
  // warp) — same six facts the Glass proves, on the seconds ladder.
  for (const l of W.runSelfTest().lines) lines.push(l);

  const DT = 1 / 60;

  // (a) TICKING FIRES — at a fixed gaze, every non-fast drawn span's phase
  //     strictly advances over M frames and wraps in [0,1); none frozen.
  {
    const d = 5;                          // gaze at 'a day and a night'
    const plan = W.renderPlan(d, 720);
    let frozen = 0, outOfRange = 0, advanced = 0, wrapped = 0, tested = 0;
    for (const q of plan) {
      if (spanIsFast(q.e, d, DT)) continue;        // fast pole → steady glow, not ticks
      tested++;
      let ph = 0.0, sawAdvance = false, sawWrap = false, prev = ph;
      for (let f = 0; f < 200; f++) {
        ph = stepPhase(ph, q.e, d, DT, false);
        if (ph < 0 || ph >= 1) outOfRange++;
        if (ph !== prev) sawAdvance = true;
        if (ph < prev) sawWrap = true;             // wrapped past 1
        prev = ph;
      }
      if (sawAdvance) advanced++; else frozen++;
      if (sawWrap) wrapped++;
    }
    add('(g) every non-fast span TICKS — its phase advances and wraps, none frozen',
        tested > 0 && frozen === 0 && outOfRange === 0 && advanced === tested,
        `${advanced}/${tested} ticking, ${wrapped} wrapped, ${frozen} frozen, ${outOfRange} out of [0,1)`);
  }

  // (b) TEN-PER-ONE IS EXACT — for every adjacent render-plan pair the child's
  //     rate is 10^(Δe) of its parent's, to 1e-12 (the temporal twin of the
  //     drawn-size-ratio test; the "ten child-cycles per parent frame" proof).
  {
    let worst = 0, samples = 0;
    const steps = Math.round((W.T_MAX - W.T_MIN) * 10);
    for (let t = 0; t <= steps; t++) {
      const d = W.T_MIN + t * 0.1;
      const plan = W.renderPlan(d, 720).filter(q => q.alpha > 0);
      for (let j = 1; j < plan.length; j++) {
        const parent = plan[j - 1], child = plan[j];
        const want = Math.pow(10, parent.e - child.e);      // child is faster
        const got = child.rate / parent.rate;
        worst = Math.max(worst, Math.abs(got - want) / want);
        samples++;
      }
    }
    add('(h) child rate / parent rate === 10^(Δe) — ten child-cycles per parent frame',
        worst < 1e-12, `max relative error ${worst.toExponential(2)} over ${samples} adjacent pairs`);
  }

  // (c) THE GAZE IS ALWAYS WATCHABLE — spanRate(d,d) === 1 across the travel.
  {
    let worst = 0, n = 0;
    const steps = Math.round((W.T_MAX - W.T_MIN) * 20);
    for (let t = 0; t <= steps; t++) {
      const d = W.T_MIN + t * 0.05;
      worst = Math.max(worst, Math.abs(spanRate(d, d) - 1));
      n++;
    }
    add('(i) the gazed span always runs at rate 1 — watchable everywhere',
        worst < 1e-12, `max |spanRate(d,d) − 1| = ${worst.toExponential(2)} over ${n} gazes`);
  }

  // (d) FAST-POLE HONEST — glowOf strictly decreasing in e; = 1−1/e within 1e-9
  //     at the fusion period; and the animate/steady seam is continuous.
  {
    const d = 0;
    let mono = true, prev = Infinity;
    for (let e = W.E_MIN; e <= W.E_MAX; e++) {
      const g = glowOf(e, d);
      if (g > prev + 1e-15) mono = false;          // must fall as e rises
      prev = g;
    }
    // at the fusion period the real frequency is exactly 1/TAU_P: pick the e that
    // puts spanHz == 1/TAU_P for gaze d, i.e. spanRate = BASE_PERIOD/TAU_P.
    const eFuse = d - Math.log10(BASE_PERIOD / TAU_P);
    const gFuse = glowOf(eFuse, d);
    const pinned = Math.abs(gFuse - (1 - 1 / Math.E)) < 1e-9;
    // the seam: glow is one continuous function across the animate/steady split.
    const eSeam = d - Math.log10(BASE_PERIOD / DT);   // where spanHz·dt == 1
    const gLo = glowOf(eSeam + 1e-6, d), gHi = glowOf(eSeam - 1e-6, d);
    const seamless = Math.abs(gHi - gLo) < 1e-4;
    add('(j) the fast-pole glow falls monotonically with e (white-hot deep, dark slow)',
        mono, `${W.E_MIN}..${W.E_MAX}, strictly non-increasing`);
    add('(j) the glow is pinned to 1−1/e at the flicker-fusion period',
        pinned, `glow(fusion) = ${gFuse.toFixed(9)} vs 1−1/e = ${(1 - 1 / Math.E).toFixed(9)}`);
    add('(j) the animate→steady seam is continuous (no brightness pop at T=dt)',
        seamless, `|Δglow| across the split = ${Math.abs(gHi - gLo).toExponential(2)}`);
  }

  // (e) REDUCED MOTION — phase never autonomously advances; one press == exactly
  //     one beat advance; the child comb tiles exactly ten sub-beats per parent.
  {
    let held = true, ph = 0.4;
    for (let f = 0; f < 240; f++) { const p = stepPhase(ph, 0, 0, DT, true); if (p !== ph) held = false; ph = p; }
    // one press advances the pinned span by exactly one decade
    const before = 5, after = W.stepDetent(before, -1);
    const oneBeat = (after === before - 1);
    // the child comb: a span one decade deeper tiles 10 sub-beats per parent beat
    const comb = Math.round(spanRate(after - 1, after) / spanRate(after, after));
    add('(k) reduced motion holds the phase — nothing free-runs',
        held, '240 frames, phase never advances without a press');
    add('(k) one press == exactly one beat, and the child comb tiles exactly ten',
        oneBeat && comb === 10, `press ${before}→${after} (one decade); comb = ${comb} sub-beats`);
  }

  const passed = lines.filter(l => l.ok).length;
  return { lines, passed, total: lines.length, ok: passed === lines.length };
}

// ===== TEN-FOLD CORE END =====

export {
  // the factory + both worlds
  makeAxis, SPACE, TIME,
  SPACE_LADDER, SPACE_LEGEND, SPACE_BANDS,
  TIME_LADDER, TIME_LEGEND, TIME_BANDS,
  // the time physics
  spanRate, spanHz, glowOf, spanIsFast, stepPhase, TAU_P, BASE_PERIOD,
  runTimeTest,
  // the SPACE free names (byte-twin of the room that shipped before)
  LADDER, LEGEND, BANDS, GFIX,
  E_MIN, E_MAX, T_MIN, T_MAX, OVERSHOOT, WARP_B,
  fixPoints, bandAt, warp, invWarp, clampTravel, clampDetent,
  stepDetent, sanitizeD, alphaFor, renderPlan, stepFree, ridgeIndex, readingAt,
  runSelfTest,
};
