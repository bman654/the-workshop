// ============================================================================
//  THE CONSERVATORY · UPHILL WITH THEIR EYES CLOSED  —  bacterial chemotaxis
//  by run-and-tumble.  A blind swarm floods toward warm nectar-scent it cannot
//  see, and the whole migration is caused by ONE local rule and nothing else.
//
//  THE ONE RULE.  Each spore is genuinely BLIND: it never reads the spatial
//  gradient, only its OWN scent one step ago.  Sample the concentration c where
//  it sits; compare to last step; if things are getting SWEETER (dc/dt > 0) it
//  tumbles LESS (runs on); if getting SOURER it tumbles MORE (casts about).  A
//  tumble picks a UNIFORM new heading — never biased toward "up".  Summed over
//  hundreds of the blind, biased ONLY in run LENGTH, that is a bloom that floods
//  uphill:
//
//        c      = sampleC(field, x, y)
//        dcdt   = (c − cPrev) / dt            // is it getting better?
//        rate   = clamp(R0·(1 − GAIN·dcdt), R_MIN, R_MAX)   // climb → tumble less
//        if rng < rate·dt : theta = UNIFORM new heading      // BLIND reorient
//        x += cos(theta)·V·dt ;  y += sin(theta)·V·dt
//        reflect at the circular dish rim (speed conserved)
//
//  THE NEG-CONTROL is byte-for-byte the SAME code path with GAIN = 0: the rate
//  collapses to a constant R0, the run-and-tumble becomes an unbiased random
//  walk, and the swarm spreads into aimless fuzz that never finds the food.  The
//  live "Blind them" toggle IS this — flip GAIN to 0 on the same swarm, same
//  field, and the bloom dissolves.  No cell ever aims; the migration was the one
//  rule all along.
//
//  WHAT IS VERIFIED (a DELIGHT piece, so we prove the PAYOFF, not a theorem).
//  The payoff-liveness twin asserts the migration FIRES: with a painted bump the
//  chemotactic swarm's mean scent climbs and its centre-of-mass closes on the
//  peak, while the GAIN=0 control stays flat — chemotactic climb ≫ control drift.
//  Plus honesty guards: the reorientation is uncorrelated with up-gradient
//  (blindness invariant), climbing lowers the tumble rate (mechanism), a cell on
//  flat scent reverts to baseline R0 (adaptation ⇒ the peak shimmer), and the
//  seeded run is deterministic.  These are ILLUSTRATIVE teaching parameters — a
//  clean dish, NOT a claim about real E. coli speeds.
//
//  Everything here is pure: a seeded mulberry32 RNG lives INSIDE the core so the
//  twin is reproducible; no DOM, no network.  The live page inlines this whole
//  block verbatim between the SIM-CORE sentinels so preview and bench can never
//  drift, and drives the same `step` through a fixed-dt accumulator.
// ============================================================================

// ===== SIM-CORE (byte-identical to core.mjs) =====
// THE DISH GEOMETRY — a single fixed grid + circular dish, shared by the field,
// the swarm, and the rim reflection so nothing can drift.  World coordinates ARE
// grid coordinates: a spore at (x,y) lives in [0,GW-1]×[0,GH-1]; the dish is the
// inscribed circle of radius RDISH about (CX,CY).
const GW = 160, GH = 120;                 // the coarse scent grid (bilinear-sampled)
const CX = (GW - 1) / 2, CY = (GH - 1) / 2;
const RDISH = 54;                          // the circular dish rim (grid units)
const TAU = Math.PI * 2;

// the ILLUSTRATIVE run-and-tumble parameters (a clean teaching dish).
const DEFAULT = {
  V: 22,        // run speed (grid units / second)
  R0: 2.0,      // baseline tumble rate (tumbles / second) on flat scent
  GAIN: 4.0,    // how hard a rising dc/dt suppresses tumbling (0 = the neg-control)
  R_MIN: 0.4,   // a hard-climbing cell still tumbles at least this often
  R_MAX: 8.0,   // a plunging cell casts about at most this often
};

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

// mulberry32 — a tiny seeded PRNG so the swarm + twin are reproducible.
function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// THE SCENT FIELD — a coarse grid of concentration c(x,y).  `tmp` is a scratch
// buffer reused by diffuseDecay so no allocation churns per frame.
function makeField() {
  return { gw: GW, gh: GH, c: new Float32Array(GW * GH), tmp: new Float32Array(GW * GH) };
}

// wipe the dish to bare soil.
function wipe(f) { f.c.fill(0); }

// lay a soft radial bump of nectar-scent (additive) centred at grid (gx,gy).  A
// TAP is one bump; a DRAG lays a train of them — the painted light IS the field.
function paintBump(f, gx, gy, A, sigma) {
  const twoSig2 = 2 * sigma * sigma;
  const rad = Math.ceil(sigma * 3);
  const x0 = Math.max(0, Math.floor(gx - rad)), x1 = Math.min(GW - 1, Math.ceil(gx + rad));
  const y0 = Math.max(0, Math.floor(gy - rad)), y1 = Math.min(GH - 1, Math.ceil(gy + rad));
  const c = f.c;
  for (let y = y0; y <= y1; y++) {
    const ddy = y - gy;
    for (let x = x0; x <= x1; x++) {
      const ddx = x - gx;
      c[y * GW + x] += A * Math.exp(-(ddx * ddx + ddy * ddy) / twoSig2);
    }
  }
}

// the nutrient plume DIFFUSES + DECAYS a little each frame (a real plume
// dissipating): a sown spot spreads a halo and eventually fades, so re-planting
// makes old rivers wither and new ones grow.  Deterministic — no RNG.
function diffuseDecay(f, diffuse, decay) {
  const c = f.c, tmp = f.tmp;
  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const i = y * GW + x;
      const l = x > 0 ? c[i - 1] : c[i];
      const r = x < GW - 1 ? c[i + 1] : c[i];
      const u = y > 0 ? c[i - GW] : c[i];
      const d = y < GH - 1 ? c[i + GW] : c[i];
      const v = decay * (c[i] + diffuse * (l + r + u + d - 4 * c[i]));
      tmp[i] = v > 0 ? v : 0;
    }
  }
  c.set(tmp);
}

// bilinear sample of the scent at world/grid coords (x,y), clamped to the grid.
function sampleC(f, x, y) {
  if (x < 0) x = 0; else if (x > GW - 1) x = GW - 1;
  if (y < 0) y = 0; else if (y > GH - 1) y = GH - 1;
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = x0 + 1 < GW ? x0 + 1 : x0, y1 = y0 + 1 < GH ? y0 + 1 : y0;
  const fx = x - x0, fy = y - y0;
  const c = f.c;
  const c00 = c[y0 * GW + x0], c10 = c[y0 * GW + x1];
  const c01 = c[y1 * GW + x0], c11 = c[y1 * GW + x1];
  const a = c00 + (c10 - c00) * fx, b = c01 + (c11 - c01) * fx;
  return a + (b - a) * fy;
}

// a UNIFORM new heading — the bias lives ENTIRELY in run LENGTH, never in aim.
// (Keeping this its own fn makes the blindness auditable: it takes only rng.)
function uniformReorient(rng) { return rng() * TAU; }

// the tumble rate for a given dc/dt — climbing (dc/dt>0) lowers it, plunging
// raises it, flat scent gives baseline R0.  Exposed so the twin can prove the
// mechanism + adaptation directly.
function tumbleRate(dcdt, p = DEFAULT) {
  return clamp(p.R0 * (1 - p.GAIN * dcdt), p.R_MIN, p.R_MAX);
}

// make a swarm of n blind spores, clustered in a disk of radius spawnR about the
// dish centre.  Each carries its OWN seeded rng so a run is reproducible.  cPrev
// starts NaN so the FIRST step primes it (dc/dt=0) instead of spiking.
function makeSwarm(seed, n, spawnR) {
  const rng = mulberry32(seed);
  const cells = [];
  for (let i = 0; i < n; i++) {
    const r = spawnR * Math.sqrt(rng());
    const a = rng() * TAU;
    cells.push({
      x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r,
      theta: rng() * TAU, cPrev: NaN, dcdt: 0, run: 0, tumbled: 0,
    });
  }
  return { cells, rng, t: 0, seed, n };
}

// reflect a cell off the circular rim, conserving speed (mirror the heading
// about the inward normal and fold the position back inside).
function reflectAtRim(cell) {
  const dx = cell.x - CX, dy = cell.y - CY;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d <= RDISH || d === 0) return;
  const nx = dx / d, ny = dy / d;
  const over = d - RDISH;
  cell.x = CX + nx * (RDISH - over);
  cell.y = CY + ny * (RDISH - over);
  const vx = Math.cos(cell.theta), vy = Math.sin(cell.theta);
  const dot = vx * nx + vy * ny;
  cell.theta = Math.atan2(vy - 2 * dot * ny, vx - 2 * dot * nx);
}

// ONE run-and-tumble step of the whole swarm.  This is the SOLE mutation of a
// cell's state; the live page and the twin both advance the swarm ONLY here, so
// they cannot diverge.  GAIN=0 makes `rate` constant ⇒ an unbiased random walk.
function step(swarm, field, dt, p = DEFAULT) {
  const rng = swarm.rng, cells = swarm.cells;
  const V = p.V, R0 = p.R0, GAIN = p.GAIN, RMIN = p.R_MIN, RMAX = p.R_MAX;
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const c = sampleC(field, cell.x, cell.y);
    let dcdt;
    if (cell.cPrev !== cell.cPrev) { dcdt = 0; }   // NaN prime step: no spike
    else { dcdt = (c - cell.cPrev) / dt; }
    cell.cPrev = c;
    cell.dcdt = dcdt;
    const rate = clamp(R0 * (1 - GAIN * dcdt), RMIN, RMAX);
    if (rng() < rate * dt) { cell.theta = uniformReorient(rng); cell.run = 0; cell.tumbled = 1; }
    else { cell.run += dt; cell.tumbled = 0; }
    cell.x += Math.cos(cell.theta) * V * dt;
    cell.y += Math.sin(cell.theta) * V * dt;
    reflectAtRim(cell);
  }
  swarm.t += dt;
  return swarm;
}

// the swarm's centre of mass.
function centerOfMass(swarm) {
  let sx = 0, sy = 0; const cells = swarm.cells, n = cells.length;
  for (let i = 0; i < n; i++) { sx += cells[i].x; sy += cells[i].y; }
  return { x: sx / n, y: sy / n };
}

// the mean scent the swarm is currently sitting in (the "are they finding it?").
function meanConcAtCells(swarm, field) {
  let s = 0; const cells = swarm.cells, n = cells.length;
  for (let i = 0; i < n; i++) s += sampleC(field, cells[i].x, cells[i].y);
  return s / n;
}

// distance from the swarm's centre of mass to a peak {x,y}.
function distCOMtoPeak(swarm, peak) {
  const com = centerOfMass(swarm);
  return Math.hypot(com.x - peak.x, com.y - peak.y);
}

// ============================================================================
//  THE PAYOFF-LIVENESS SELF-TEST — the SOLE authority for the in-page pill and
//  core.test.mjs.  It proves the MIGRATION fires (not a theorem): the swarm
//  floods uphill, the GAIN=0 control does not, and the honesty guards hold.
// ============================================================================
function runSelfTest() {
  const checks = [];
  const detail = {};
  function ok(name, cond, info) { checks.push({ name, pass: !!cond, info }); }

  // a shared scenario: a static nectar bump offset from a centred swarm.  Static
  // (no diffuseDecay) so the run-and-tumble mechanism is isolated and clean.
  const PEAK = { x: CX + 26, y: CY };
  function freshField() { const f = makeField(); paintBump(f, PEAK.x, PEAK.y, 1.0, 16); return f; }
  const N = 300, SPAWN = 14, T = 900, DT = 1 / 60;

  function run(gain, seed) {
    const f = freshField();
    const sw = makeSwarm(seed, N, SPAWN);
    step(sw, f, DT, { ...DEFAULT, GAIN: gain });        // one prime step
    const conc0 = meanConcAtCells(sw, f), dist0 = distCOMtoPeak(sw, PEAK);
    for (let i = 0; i < T; i++) step(sw, f, DT, { ...DEFAULT, GAIN: gain });
    const conc1 = meanConcAtCells(sw, f), dist1 = distCOMtoPeak(sw, PEAK);
    return { sw, f, conc0, conc1, dist0, dist1, climb: conc1 - conc0, close: dist0 - dist1 };
  }

  const chemo = run(DEFAULT.GAIN, 0xC0FFEE);
  const ctrl = run(0, 0xC0FFEE);                         // IDENTICAL seed/field, GAIN=0
  detail.chemoClimb = chemo.climb; detail.ctrlClimb = ctrl.climb;
  detail.chemoClose = chemo.close; detail.ctrlClose = ctrl.close;
  detail.chemoDist1 = chemo.dist1; detail.ctrlDist1 = ctrl.dist1;

  // (1) PAYOFF FIRES — the chemotactic swarm's mean scent CLIMBS by a real margin
  //     and its COM closes on the peak.
  ok('PAYOFF FIRES: chemotactic mean-scent climbs ≥ 0.20 and the COM closes ≥ 12 grid-units on the peak',
     chemo.climb >= 0.20 && chemo.close >= 12,
     'climb=' + chemo.climb.toFixed(3) + '  close=' + chemo.close.toFixed(2) + ' units  ·  dist→peak ' +
       chemo.dist0.toFixed(1) + '→' + chemo.dist1.toFixed(1));

  // (2) NEG-CONTROL DIFFUSES — GAIN=0 (same seed/field): an aimless random walk
  //     that never finds the food.  Its scent does NOT rise (in fact it spreads
  //     off the sown spot and drops), and its COM does NOT approach the peak.
  ok('NEG-CONTROL DIFFUSES: with GAIN=0 the mean-scent does not rise (climb < 0.06) and the COM does not close on the peak (< 4 units)',
     ctrl.climb < 0.06 && ctrl.close < 4,
     'climb=' + ctrl.climb.toFixed(3) + '  close=' + ctrl.close.toFixed(2) + ' units  ·  distⁿᶜ ' +
       ctrl.dist0.toFixed(1) + '→' + ctrl.dist1.toFixed(1));

  // (3) THE DISCRIMINATING GAP — the payoff is isolated to the one rule: the
  //     chemotactic swarm ends ≥ 3× CLOSER to the peak than the identical control
  //     (a sign-clean, unambiguous separation — same seed, same field, GAIN alone).
  const gap = ctrl.dist1 / Math.max(1e-6, chemo.dist1);
  detail.gap = gap;
  ok('DISCRIMINATING GAP: the chemotactic COM ends ≥ 3× closer to the peak than the GAIN=0 control (payoff caused by the rule alone)',
     ctrl.dist1 >= 3 * chemo.dist1,
     'chemo ' + chemo.dist1.toFixed(1) + ' vs ctrl ' + ctrl.dist1.toFixed(1) + ' units  ·  ≈ ' +
       (isFinite(gap) ? gap.toFixed(1) : '∞') + '× closer');

  // (4) BLINDNESS INVARIANT — over many tumbles the NEW heading is uncorrelated
  //     with the direction toward the peak: mean cos(θ_new − θ_toward_peak) ≈ 0.
  //     Drift cannot be sneaking in via aiming; it lives only in run length.
  {
    const f = freshField();
    const sw = makeSwarm(0xBADF00D, 500, SPAWN);
    let sum = 0, cnt = 0;
    for (let i = 0; i < 1200; i++) {
      step(sw, f, DT, DEFAULT);
      for (let k = 0; k < sw.cells.length; k++) {
        const cell = sw.cells[k];
        if (cell.tumbled) {
          const toPeak = Math.atan2(PEAK.y - cell.y, PEAK.x - cell.x);
          sum += Math.cos(cell.theta - toPeak); cnt++;
        }
      }
    }
    const meanCos = sum / Math.max(1, cnt);
    detail.blindMeanCos = meanCos; detail.blindTumbles = cnt;
    ok('BLINDNESS INVARIANT: mean cos(θ_new − θ_toward_peak) ≈ 0 over ' + cnt +
       ' tumbles (|mean| < 0.03) — reorientations never aim up-gradient',
       Math.abs(meanCos) < 0.03, 'mean cos = ' + meanCos.toFixed(4));
  }

  // (5) MECHANISM SANITY — a cell heading UP-gradient (dc/dt>0) has a strictly
  //     lower tumble rate than one heading DOWN-gradient (dc/dt<0).
  {
    const up = tumbleRate(0.5, DEFAULT), flat = tumbleRate(0, DEFAULT), down = tumbleRate(-0.5, DEFAULT);
    detail.rateUp = up; detail.rateFlat = flat; detail.rateDown = down;
    ok('MECHANISM: tumbleRate(up-gradient) < tumbleRate(flat) < tumbleRate(down-gradient)',
       up < flat && flat < down, 'up=' + up.toFixed(3) + ' < flat=' + flat.toFixed(3) + ' < down=' + down.toFixed(3));
  }

  // (6) ADAPTATION — a cell held on FLAT scent has dc/dt→0 and reverts to the
  //     baseline rate R0.  (This is why the peak SHIMMERS: cells on a flat summit
  //     revert to baseline tumbling and jitter in place.)
  {
    const f = makeField();
    paintBump(f, CX, CY, 1.0, 40);                       // a broad, locally-flat top at centre
    const sw = makeSwarm(1, 1, 0);                        // one cell exactly at centre (a flat max)
    step(sw, f, DT, DEFAULT); step(sw, f, DT, DEFAULT);
    const cell = sw.cells[0];
    detail.adaptDcdt = cell.dcdt;
    ok('ADAPTATION: a cell on flat scent has dc/dt ≈ 0 ⇒ tumbleRate reverts to baseline R0 (the peak shimmer)',
       Math.abs(cell.dcdt) < 0.05 && Math.abs(tumbleRate(cell.dcdt) - DEFAULT.R0) < 0.2,
       'dc/dt=' + cell.dcdt.toFixed(4) + '  rate=' + tumbleRate(cell.dcdt).toFixed(3) + ' vs R0=' + DEFAULT.R0);
  }

  // (7) DETERMINISM — two seeded runs are byte-identical.
  {
    const a = JSON.stringify(run(DEFAULT.GAIN, 42).sw.cells);
    const b = JSON.stringify(run(DEFAULT.GAIN, 42).sw.cells);
    detail.deterministic = a === b;
    ok('DETERMINISM: two seeded chemotactic runs are byte-identical', a === b, a === b ? 'identical' : 'DIFFER');
  }

  // (8) INVARIANTS — every cell stays inside the dish (reflecting rim) and the run
  //     speed is constant (a free interior step advances exactly V·dt).
  {
    let allIn = true, maxD = 0;
    for (const cell of chemo.sw.cells) { const d = Math.hypot(cell.x - CX, cell.y - CY); if (d > maxD) maxD = d; if (d > RDISH + 1e-6) allIn = false; }
    // free-step speed: a lone interior cell, no reflection, moves exactly V·dt.
    const one = makeSwarm(9, 1, 0); one.cells[0].x = CX; one.cells[0].y = CY; one.cells[0].theta = 0.3;
    const bx = one.cells[0].x, by = one.cells[0].y;
    const f = makeField();
    step(one, f, DT, DEFAULT);
    const moved = Math.hypot(one.cells[0].x - bx, one.cells[0].y - by);
    const speedOk = Math.abs(moved - DEFAULT.V * DT) < 1e-9;
    detail.maxD = maxD; detail.freeStep = moved;
    ok('INVARIANTS: all cells inside the dish (max r=' + maxD.toFixed(2) + ' ≤ ' + RDISH +
       ') and a free interior step is exactly V·dt',
       allIn && speedOk, 'maxR=' + maxD.toFixed(3) + '  freeStep=' + moved.toFixed(5) + ' vs V·dt=' + (DEFAULT.V * DT).toFixed(5));
  }

  const pass = checks.filter((c) => c.pass).length;
  return { pass, total: checks.length, checks, detail };
}
// ===== END SIM-CORE =====

export {
  GW, GH, CX, CY, RDISH, DEFAULT,
  mulberry32, makeField, wipe, paintBump, diffuseDecay, sampleC,
  uniformReorient, tumbleRate, makeSwarm, reflectAtRim, step,
  centerOfMass, meanConcAtCells, distCOMtoPeak, runSelfTest,
};
