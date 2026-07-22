/* ═══════════════════════════════════════════════════════════════════════════
   core.mjs — the deterministic spine of THE POWDER SKY (the harbour firing book).

   A CLAIM-FREE delight engine: it proves no physics. Its verification (core.test.mjs)
   is a PAYOFF-LIVENESS twin — it asserts the SHOW actually fires: every scored shell
   ignites once into its named bloom + colour, the report cracks a beat AFTER the
   flash, a kept showcode replays BYTE-IDENTICALLY, and reduced-motion composes a
   single still with zero timed audio. (DESIGNING.md: the payoff-liveness gate.)

   DETERMINISTIC by construction:
     • fixed timestep — the sim only advances via step(dt); NO wall-clock inside.
     • per-shell SEEDED mulberry32 for every spark scatter (never Math.random).
     • the SHOW is data — an ordered shells[] + {bpm,beatsPerBar,bars,wind}; THAT
       list is the seed. SHOWCODE = base64(minified JSON). Decode → identical schedule.

   Virtual field: FIELD.W × FIELD.H units (renderer scales to canvas). y grows DOWN.
   Gravity pulls +y. Waterline at FIELD.water; everything below is the reflection.

   Dual-use: a plain ESM (Node twin `import`s it) AND forge:include'd into the page
   (forge strips the `export`s); the SAME core drives both, so page & twin agree.
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

/* ── mulberry32: tiny deterministic PRNG → floats in [0,1). NEVER Math.random ── */
export function mulberry32(a) {
  a = a >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const FIELD = { W: 1000, H: 660, water: 470, DT: 1 / 120 };
const TAU = Math.PI * 2;

/* ── CHEMISTRY COLOUR — grounded, claim-free, NEVER stated on the page ─────────
   Each star cools along an EMBER RAMP: white-hot → its chemistry colour → deep red
   → smoke. We store the chemistry hue (the "peak" colour); the ramp interpolates by
   the star's remaining-life fraction. Colours evoke real pyro salts; no claim made. */
export const CHEM = {
  crimson: { name: 'strontium',       peak: [255,  46,  58] },  // strontium
  green:   { name: 'barium',          peak: [ 84, 240, 120] },  // barium/copper
  azure:   { name: 'copper',          peak: [ 70, 176, 255] },  // copper-chloride
  gold:    { name: 'sodium',          peak: [255, 196,  74] },  // sodium
  white:   { name: 'magnesium',       peak: [255, 250, 235] },  // magnesium/titanium
  violet:  { name: 'potassium',       peak: [186, 120, 255] },  // potassium (extra)
};
export const CHEM_KEYS = Object.keys(CHEM);

/* ember(peak, f) — f in [0,1] = life REMAINING. Returns [r,g,b].
   f≈1 white-hot; f mid the chemistry colour; f low deep red; f→0 grey smoke. */
export function ember(peak, f) {
  f = f < 0 ? 0 : f > 1 ? 1 : f;
  const white = [255, 250, 235], red = [150, 26, 14], smoke = [64, 60, 66];
  let a, b, u;
  if (f > 0.82)      { a = peak;  b = white; u = (f - 0.82) / 0.18; }   // peak→white-hot
  else if (f > 0.34) { a = red;   b = peak;  u = (f - 0.34) / 0.48; }   // red→peak
  else               { a = smoke; b = red;   u = f / 0.34; }            // smoke→red
  return [
    Math.round(a[0] + (b[0] - a[0]) * u),
    Math.round(a[1] + (b[1] - a[1]) * u),
    Math.round(a[2] + (b[2] - a[2]) * u),
  ];
}

/* ── timing — the crack-beat is DESIGNED, never a speed-of-sound number ─────── */
export function riseDur(size)  { return 1.05 + 0.14 * size; }             // rocket flight to apogee
export function fuseDelay(size){ return 0.16 + 0.075 * size; }            // flash → report (bigger cracks LATER)
export function shiverDelay()  { return 0.30; }                          // report → the water shivers

/* ── the named blooms — each a genuinely distinct, lovingly-tuned recipe ──────
   A recipe emits an array of star specs at ignition. Each star spec:
     {x,y, vx,vy, life, size, chem, kind, drag, grav, tail, wink, split}
   kind: 'star' | 'comet' (comets carry a fatter head + can split)
   The engine (Sim) owns the actual particle objects; recipes just seed them. */

function ring(rng, n, speed, jitter) {
  // n directions around a sphere-ish ring with slight per-star speed jitter
  const out = [];
  const off = rng() * TAU;
  for (let i = 0; i < n; i++) {
    const a = off + (i / n) * TAU + (rng() - 0.5) * (TAU / n) * 0.4;
    const s = speed * (1 - jitter * rng());
    out.push([Math.cos(a) * s, Math.sin(a) * s, a]);
  }
  return out;
}

export const BLOOMS = {
  /* PEONY — equal-velocity TAILLESS sphere that decelerates then falls. */
  peony(rng, sh) {
    const n = 46 + (sh.size * 5 | 0), sp = 150 + sh.size * 16, stars = [];
    for (const [vx, vy] of ring(rng, n, sp, 0.14)) {
      stars.push({ vx, vy, life: 1.5 + rng() * 0.5, size: 2.1, chem: sh.hue,
        kind: 'star', drag: 1.35, grav: 40, tail: 0, wink: 0 });
    }
    return stars;
  },

  /* GOLD WILLOW — heavy long-burning stars rise then DROOP into hanging fronds.
     The droop IS its soul: low drag, gravity dominant, very long life, gold. */
  willow(rng, sh) {
    const n = 26 + (sh.size * 3 | 0), sp = 120 + sh.size * 12, stars = [];
    for (const [vx, vy] of ring(rng, n, sp, 0.10)) {
      stars.push({ vx, vy: vy - 30, life: 2.6 + rng() * 0.9, size: 2.4, chem: 'gold',
        kind: 'star', drag: 0.5, grav: 105, tail: 0.5, wink: 0, ember: true });
    }
    return stars;
  },

  /* CHRYSANTHEMUM — a peony whose every star drags a glitter TAIL. */
  chrysanthemum(rng, sh) {
    const n = 52 + (sh.size * 5 | 0), sp = 150 + sh.size * 15, stars = [];
    for (const [vx, vy] of ring(rng, n, sp, 0.14)) {
      stars.push({ vx, vy, life: 1.7 + rng() * 0.5, size: 2.0, chem: sh.hue,
        kind: 'star', drag: 1.15, grav: 52, tail: 1.0, wink: 0 });
    }
    return stars;
  },

  /* CROSSETTE — fat comets fly out, coast, each SPLITS into 4 sub-comets, which
     can split AGAIN. The split schedule rides on the star's own age. */
  crossette(rng, sh) {
    const n = 7 + (sh.size / 2 | 0), sp = 175 + sh.size * 10, stars = [];
    for (const [vx, vy] of ring(rng, n, sp, 0.05)) {
      stars.push({ vx, vy, life: 2.1, size: 3.4, chem: sh.hue, kind: 'comet',
        drag: 0.55, grav: 55, tail: 0.7, wink: 0, split: { at: 0.55, gen: 2 } });
    }
    return stars;
  },

  /* STROBE / CRACKLE — stars that DON'T glow steady: stochastic on/off winking. */
  strobe(rng, sh) {
    const n = 40 + (sh.size * 4 | 0), sp = 120 + sh.size * 12, stars = [];
    for (const [vx, vy] of ring(rng, n, sp, 0.30)) {
      stars.push({ vx, vy, life: 1.9 + rng() * 0.7, size: 2.3, chem: 'white',
        kind: 'star', drag: 1.1, grav: 46, tail: 0, wink: 0.5 + rng() * 0.4 });
    }
    return stars;
  },

  /* PALM — a few thick rising trunks that arc over (fewer, fatter, gold). (extra) */
  palm(rng, sh) {
    const n = 9, sp = 165 + sh.size * 10, stars = [];
    const off = rng() * TAU;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.26 + (rng() - 0.5) * 0.08 + off * 0.02;
      const s = sp * (0.9 + rng() * 0.2);
      stars.push({ vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 2.3 + rng() * 0.5,
        size: 3.2, chem: 'gold', kind: 'comet', drag: 0.6, grav: 95, tail: 1.0, wink: 0, ember: true });
    }
    return stars;
  },

  /* RING / SATURN — a flat expanding ring (a planar burst seen edge-tilted). (extra) */
  ring(rng, sh) {
    const n = 40 + (sh.size * 3 | 0), sp = 155 + sh.size * 12, stars = [];
    const tilt = 0.42; // squash vertically → reads as a ring in perspective
    for (const [vx, vy] of ring(rng, n, sp, 0.05)) {
      stars.push({ vx, vy: vy * tilt, life: 1.8 + rng() * 0.3, size: 2.2, chem: sh.hue,
        kind: 'star', drag: 1.0, grav: 40, tail: 0, wink: 0 });
    }
    return stars;
  },
};
export const BLOOM_KEYS = Object.keys(BLOOMS);

/* Human-legible catalogue for the firing book's plates (nameplate + one line). */
export const PLATE_BOOK = [
  { type: 'peony',         name: 'Peony',         line: 'a tailless sphere that opens and falls' },
  { type: 'willow',        name: 'Gold Willow',   line: 'long gold stars that droop into fronds' },
  { type: 'chrysanthemum', name: 'Chrysanthemum', line: 'a peony, every star trailing glitter' },
  { type: 'crossette',     name: 'Crossette',     line: 'comets that fly, then split, then split' },
  { type: 'strobe',        name: 'Crackle',       line: 'white stars that wink and will not hold' },
  { type: 'palm',          name: 'Palm',          line: 'thick gold trunks arcing over the water' },
  { type: 'ring',          name: 'Saturn',        line: 'a flat ring tilted across the dark' },
];

/* ── the SHOW (the score) ─────────────────────────────────────────────────────
   makeShow normalizes + clamps a raw show. shells[] each:
     { beat, x, y, type, hue, size, crack, seed } */
export function makeShow(raw) {
  raw = raw || {};
  const bpm = clampNum(raw.bpm, 40, 200, 96);
  const beatsPerBar = clampInt(raw.beatsPerBar, 2, 12, 4);
  const bars = clampInt(raw.bars, 1, 64, 8);
  const wind = clampNum(raw.wind, -1, 1, 0.18);
  const shells = (raw.shells || []).map(normShell).sort((a, b) =>
    a.beat - b.beat || a.x - b.x || a.seed - b.seed);
  return { bpm, beatsPerBar, bars, wind, shells };
}
function clampNum(v, lo, hi, d) { v = +v; if (!isFinite(v)) v = d; return v < lo ? lo : v > hi ? hi : v; }
function clampInt(v, lo, hi, d) { return clampNum(v, lo, hi, d) | 0; }
function normShell(s) {
  s = s || {};
  const type = BLOOMS[s.type] ? s.type : 'peony';
  const hue = CHEM[s.hue] ? s.hue : 'gold';
  return {
    beat: clampNum(s.beat, 0, 1024, 0),
    x: clampNum(s.x, 20, FIELD.W - 20, FIELD.W / 2),
    y: clampNum(s.y, 30, FIELD.water - 30, 180),
    type, hue,
    size: clampInt(s.size, 1, 9, 4),
    crack: !!s.crack,
    seed: (clampInt(s.seed, 0, 0x7fffffff, 1)) >>> 0,
  };
}

/* SHOWCODE — base64(minified JSON). Round-trips to a byte-identical schedule. */
export function encodeShow(show) {
  const min = {
    b: show.bpm, p: show.beatsPerBar, r: show.bars, w: round3(show.wind),
    s: show.shells.map(s => [round2(s.beat), s.x | 0, s.y | 0,
      BLOOM_KEYS.indexOf(s.type), CHEM_KEYS.indexOf(s.hue), s.size, s.crack ? 1 : 0, s.seed]),
  };
  return b64encode(JSON.stringify(min));
}
export function decodeShow(code) {
  const min = JSON.parse(b64decode(String(code).trim()));
  return makeShow({
    bpm: min.b, beatsPerBar: min.p, bars: min.r, wind: min.w,
    shells: (min.s || []).map(a => ({
      beat: a[0], x: a[1], y: a[2], type: BLOOM_KEYS[a[3]], hue: CHEM_KEYS[a[4]],
      size: a[5], crack: !!a[6], seed: a[7],
    })),
  });
}
function round2(n) { return Math.round(n * 100) / 100; }
function round3(n) { return Math.round(n * 1000) / 1000; }
/* base64 that works in the browser (btoa/atob) AND Node (Buffer) — ASCII JSON. */
function b64encode(s) {
  if (typeof btoa === 'function') return btoa(unescape(encodeURIComponent(s)));
  return Buffer.from(s, 'utf8').toString('base64');
}
function b64decode(s) {
  if (typeof atob === 'function') return decodeURIComponent(escape(atob(s)));
  return Buffer.from(s, 'base64').toString('utf8');
}

/* ── the SCHEDULE — every timed event, derived up front from the score ─────────
   Because the whole show is a pure function of the score, we can compute the
   ordered event list ONCE. step() then just fires each as sim-time crosses it,
   and the renderer arms audio ahead on the AudioContext clock from this list. */
export function buildSchedule(show) {
  const spb = 60 / show.bpm;
  const ev = [];
  show.shells.forEach((sh, i) => {
    const tLaunch = sh.beat * spb;
    const tFlash = tLaunch + riseDur(sh.size);
    const tReport = tFlash + fuseDelay(sh.size);
    const tShiver = tReport + shiverDelay();
    ev.push({ t: tLaunch, kind: 'launch', i, sh });
    ev.push({ t: tFlash, kind: 'ignite', i, sh, x: sh.x, y: sh.y, type: sh.type, hue: sh.hue });
    ev.push({ t: tReport, kind: 'report', i, sh, x: sh.x, y: sh.y, size: sh.size });
    ev.push({ t: tShiver, kind: 'shiver', i, sh, x: sh.x, y: sh.y });
  });
  ev.sort((a, b) => a.t - b.t || a.i - b.i || order(a.kind) - order(b.kind));
  return ev;
}
function order(k) { return { launch: 0, ignite: 1, report: 2, shiver: 3 }[k]; }

/* ── the SIM — pooled particles, fixed-step, the single source of truth ──────── */
export class Sim {
  constructor(show, opts) {
    opts = opts || {};
    this.show = show;
    this.reducedMotion = !!opts.reducedMotion;
    this.wind = show.wind;
    this.schedule = buildSchedule(show);
    this.duration = this.schedule.length ? this.schedule[this.schedule.length - 1].t + 4 : 4;
    this.t = 0;
    this._cursor = 0;          // next schedule index to fire
    this.events = [];          // FIRED events (the liveness log)
    this.stars = [];           // live particle pool (in-use)
    this._pool = [];           // free list
    this.rockets = [];         // rising rockets (visual)
    this.smoke = [];           // drifting smoke puffs
    this.flashes = [];         // brief sky+water flashes
    this.skyGrey = 0;          // accumulation: sky greys where many shells fired
    this._rng = mulberry32(0x9E3779B1);
    this.stillEmitted = false;
    if (this.reducedMotion) this.composeStill();
  }

  /* reduced-motion: emit ONE composed still, schedule ZERO timed audio, animate
     nothing. The still is the finale frozen at its fullest — every bloom laid at
     a mid-life snapshot, to be painted once (doubled in the water) by the renderer. */
  composeStill() {
    if (this.stillEmitted) return this.stillSnapshot;
    const blooms = this.show.shells.map(sh => {
      const rng = mulberry32(sh.seed);
      const specs = BLOOMS[sh.type](rng, sh);
      // freeze each star at ~55% of its life: expanded, colour at chemistry peak
      const frozen = specs.map(sp => {
        const age = (sp.life || 1.5) * 0.45;
        const dr = Math.exp(-(sp.drag || 1) * age);
        const px = sh.x + (sp.vx) * age * dr;
        const py = sh.y + (sp.vy) * age * dr + 0.5 * (sp.grav || 40) * age * age;
        const peak = CHEM[sp.chem === 'gold' ? 'gold' : (CHEM[sp.chem] ? sp.chem : sh.hue)].peak;
        return { x: px, y: py, r: (sp.size || 2) * 1.4, rgb: peak };
      });
      return { x: sh.x, y: sh.y, type: sh.type, stars: frozen };
    });
    this.stillSnapshot = { blooms, wind: this.wind };
    this.stillEmitted = true;
    this.events.push({ t: 0, kind: 'still', blooms: blooms.length });
    return this.stillSnapshot;
  }

  _get() { return this._pool.pop() || {}; }
  _free(p) { if (this._pool.length < 4000) this._pool.push(p); }

  /* ignite a shell → spawn its bloom's stars at (x,y), seeded by shell.seed. */
  _ignite(ev) {
    const sh = ev.sh, rng = mulberry32(sh.seed);
    const specs = BLOOMS[sh.type](rng, sh);
    for (const sp of specs) this._spawn(sh.x, sh.y, sp, rng, sh.hue);
    this.flashes.push({ x: sh.x, y: sh.y, age: 0, life: 0.55, size: sh.size, peak: true });
    this.skyGrey = Math.min(0.5, this.skyGrey + 0.012 * sh.size);
    this.events.push({ t: this.t, kind: 'ignite', i: ev.i, x: sh.x, y: sh.y, type: sh.type,
      hue: sh.hue, count: specs.length });
  }
  _spawn(x, y, sp, rng, shellHue) {
    const p = this._get();
    p.x = x; p.y = y; p.vx = sp.vx; p.vy = sp.vy;
    p.life = sp.life; p.age = 0; p.size = sp.size;
    p.chem = CHEM[sp.chem] ? sp.chem : shellHue;
    p.kind = sp.kind; p.drag = sp.drag; p.grav = sp.grav;
    p.tail = sp.tail || 0; p.wink = sp.wink || 0;
    p.winkPhase = rng() * TAU; p.bright = 1; p.dead = false; p.light = sp.tail > 0.6;
    p.split = sp.split ? { at: sp.split.at, gen: sp.split.gen } : null;
    p.ember = !!sp.ember; p.trailAcc = 0;
    this.stars.push(p);
    return p;
  }
  /* crossette / brocade splits: a comet bursts into sub-comets at its scheduled age. */
  _splitStar(p) {
    const rng = mulberry32(((p.x | 0) * 73856093 ^ (p.y | 0) * 19349663 ^ (this.t * 1000 | 0)) >>> 0);
    const n = 4, base = Math.atan2(p.vy, p.vx), sp0 = 90;
    const nextGen = p.split.gen - 1;
    for (let k = 0; k < n; k++) {
      const a = base + (k / n) * TAU + (rng() - 0.5) * 0.4;
      const s = sp0 * (0.8 + rng() * 0.4);
      this._spawn(p.x, p.y, {
        vx: p.vx * 0.28 + Math.cos(a) * s, vy: p.vy * 0.28 + Math.sin(a) * s,
        life: 0.95 + rng() * 0.3, size: p.size * 0.7, chem: p.chem, kind: 'comet',
        drag: 0.7, grav: 60, tail: 0.6, wink: 0,
        split: nextGen > 0 ? { at: 0.45, gen: nextGen } : null,
      }, rng, p.chem);
    }
  }

  step(dt) {
    if (this.reducedMotion) return;      // a still does not animate
    dt = dt || FIELD.DT;
    const t0 = this.t, t1 = this.t + dt;
    // fire every scheduled event whose time falls in (t0, t1]
    while (this._cursor < this.schedule.length && this.schedule[this._cursor].t <= t1) {
      const ev = this.schedule[this._cursor++];
      this.t = ev.t;                     // land exactly on the event time for the log
      if (ev.kind === 'launch') this._launch(ev);
      else if (ev.kind === 'ignite') this._ignite(ev);
      else if (ev.kind === 'report') this.events.push({ t: this.t, kind: 'report', i: ev.i, x: ev.x, y: ev.y, size: ev.size });
      else if (ev.kind === 'shiver') this.events.push({ t: this.t, kind: 'shiver', i: ev.i, x: ev.x, y: ev.y });
    }
    this.t = t1;
    this._integrate(dt);
  }

  _launch(ev) {
    const sh = ev.sh, spb = 60 / this.show.bpm;
    const dur = riseDur(sh.size);
    this.rockets.push({ i: ev.i, x0: sh.x + (this.wind * -18), y0: FIELD.water - 6,
      x1: sh.x, y1: sh.y, t: 0, dur, hue: sh.hue, spark: 0 });
    this.events.push({ t: this.t, kind: 'launch', i: ev.i });
  }

  _integrate(dt) {
    const w = this.wind;
    // rockets: ease-out rise so they DECELERATE and HANG at apogee
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.t += dt;
      const u = Math.min(1, r.t / r.dur);
      const e = 1 - (1 - u) * (1 - u);         // ease-out: fast off the line, slow at apogee
      r.x = r.x0 + (r.x1 - r.x0) * e;
      r.y = r.y0 + (r.y1 - r.y0) * e;
      r.spark += dt;
      if (u >= 1) this.rockets.splice(i, 1);
    }
    // stars
    const stars = this.stars;
    for (let i = stars.length - 1; i >= 0; i--) {
      const p = stars[i];
      p.age += dt;
      // split (crossette) when the comet reaches its scheduled fraction of life
      if (p.split && p.age >= p.split.at) { this._splitStar(p); p.dead = true; }
      // physics: gravity + air drag + wind drift (lighter stars drift more)
      p.vy += p.grav * dt;
      const dr = Math.exp(-p.drag * dt);
      p.vx = p.vx * dr + w * 22 * dt * (2 - p.drag);
      p.vy = p.vy * dr;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const f = 1 - p.age / p.life;             // life remaining
      // winking (strobe): stochastic on/off
      if (p.wink) {
        p.winkPhase += dt * (14 + p.wink * 22);
        p.bright = (Math.sin(p.winkPhase) + Math.sin(p.winkPhase * 1.7 + 1.3)) > 0.2 ? 1 : 0.05;
      } else {
        p.bright = f > 0.15 ? 1 : Math.max(0, f / 0.15);
      }
      if (p.dead || f <= 0) {
        // willow/palm embers leave a wisp of smoke where they die
        if ((p.ember || p.tail > 0.8) && this.smoke.length < 240 && !p.dead) {
          this.smoke.push({ x: p.x, y: p.y, r: 6, age: 0, life: 3.5 });
        }
        stars.splice(i, 1); this._free(p);
      }
    }
    // flashes decay
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const fl = this.flashes[i]; fl.age += dt;
      if (fl.age >= fl.life) this.flashes.splice(i, 1);
    }
    // smoke drifts on the wind and greys, then thins
    for (let i = this.smoke.length - 1; i >= 0; i--) {
      const s = this.smoke[i]; s.age += dt;
      s.x += w * 26 * dt; s.y -= 5 * dt; s.r += 7 * dt;
      if (s.age >= s.life) this.smoke.splice(i, 1);
    }
    if (this.skyGrey > 0) this.skyGrey = Math.max(0, this.skyGrey - 0.006 * dt);
  }

  /* PAYOFF probe: total star brightness within radius r of (x,y). The
     "it-really-blooms" assert reads this right after a scored ignite. */
  brightnessAt(x, y, r) {
    let sum = 0; const r2 = r * r;
    for (const p of this.stars) {
      const dx = p.x - x, dy = p.y - y;
      if (dx * dx + dy * dy <= r2) sum += p.bright * (p.size || 1);
    }
    return sum;
  }
  get liveCount() { return this.stars.length; }
  get done() { return this.t >= this.duration && this.stars.length === 0 && this.rockets.length === 0; }

  /* fired events of one kind, in order (used by the twin) */
  fired(kind) { return this.events.filter(e => e.kind === kind); }
}

/* ── a demo show — the piece's opening "night" (also the twin's fixture) ──────── */
export function demoShow() {
  return makeShow({
    bpm: 100, beatsPerBar: 4, bars: 8, wind: 0.20,
    shells: [
      { beat: 0,   x: 300, y: 190, type: 'peony',         hue: 'crimson', size: 4, seed: 101 },
      { beat: 2,   x: 700, y: 210, type: 'willow',        hue: 'gold',    size: 5, seed: 202 },
      { beat: 4,   x: 500, y: 150, type: 'chrysanthemum', hue: 'azure',   size: 4, seed: 303 },
      { beat: 6,   x: 220, y: 240, type: 'strobe',        hue: 'white',   size: 3, seed: 404 },
      { beat: 8,   x: 780, y: 175, type: 'crossette',     hue: 'green',   size: 5, seed: 505 },
      { beat: 10,  x: 400, y: 200, type: 'ring',          hue: 'violet',  size: 4, seed: 606 },
      { beat: 12,  x: 600, y: 230, type: 'palm',          hue: 'gold',    size: 6, seed: 707 },
      { beat: 13,  x: 500, y: 140, type: 'peony',         hue: 'azure',   size: 6, crack: true, seed: 808 },
    ],
  });
}

/* dual-use guard: attach to a global for the forge:include'd browser build. */
if (typeof window !== 'undefined') {
  window.PowderCore = { mulberry32, FIELD, CHEM, CHEM_KEYS, ember, riseDur, fuseDelay,
    shiverDelay, BLOOMS, BLOOM_KEYS, PLATE_BOOK, makeShow, encodeShow, decodeShow,
    buildSchedule, Sim, demoShow };
}
