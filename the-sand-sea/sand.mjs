/* ════════════════════════════════════════════════════════════════════════════
   sand.mjs — THE SAND SEA · the three rules, the desert they make, and the
              instruments that measure it.

   PURE + DOM-FREE.  Runs identically in Node (sand.test.mjs) and in the browser
   (forge-inlined into a Web Worker).  No dependencies.

   ── THE MODEL ─────────────────────────────────────────────────────────────
   Werner's slab model (Geology 23, 1995), which is the shortest honest desert
   anyone has written down.  Sand lives on a periodic lattice as a stack of
   SLABS.  One iteration picks a cell at random and:

     1  ERODE.   If the cell holds sand and is NOT in the shadow of something
                 upwind of it, lift one slab off it.
     2  HOP.     Carry that slab L cells downwind and try to drop it.  It sticks
                 with probability p_sand if it lands on sand, p_bare if it lands
                 on bare desert floor, and ALWAYS if it lands in a shadow.  If it
                 doesn't stick it hops another L, and again, until it does.
     3  AVALANCHE.  Wherever the pile just changed, if a neighbour is lower than
                 the angle of repose allows, slide slabs down until it isn't.

   The SHADOW is the separation bubble behind a crest: the wind detaches at the
   brink and does not touch the lee slope.  A cell is in shadow if any cell
   upwind of it rises above the 15-degree line drawn downwind from that cell's
   own top (Sauermann/Werner's standard rule).

   That is the whole physics.  NOTHING IN IT KNOWS WHAT A DUNE IS.  There is no
   crest, no slip face, no horn, no wavelength and no dune anywhere in the rules
   — and the only asymmetry in the entire model is p_sand > p_bare: SAND CATCHES
   SAND BETTER THAN BARE GROUND DOES.  Set those two equal and the desert has no
   dunes in it at all (see `equalStickiness` and the twin's PART E).

   ── WHAT IS MEASURED, AND WHY IT IS NOT CIRCULAR ──────────────────────────
   Mass conservation for a shape translating without changing (h(x,t)=h(x-ct))
   turns dh/dt + dq/dx = 0 into

        c * h(x)  =  q(x) - q0            [ q0 = the flux where h = 0 ]

   so at the crest:  c = (q_crest - q_bare) / H.  Two INDEPENDENTLY measured
   things: c comes from watching a dune's centroid move over hundreds of sweeps;
   q comes from counting slab-crossings through the cells themselves, which the
   dune-tracker never looks at.  And the corollary is the visible one — for a
   whole field sharing one wind, c*H is the SAME NUMBER for every dune, so a
   small dune is fast and a big one is slow, and the small one runs the big one
   down.  `fitCH` measures that across a population.

   ── UNITS ─────────────────────────────────────────────────────────────────
   DX      metres per cell        (the lattice spacing)
   SLAB    metres per slab        (the vertical quantum)
   time    SWEEPS  = NX*NY iterations, i.e. "one attempt per cell"
   flux q  metres^2 per sweep     (volume per unit crest-width per unit time)
   ════════════════════════════════════════════════════════════════════════════ */

export const REPOSE_DEG = 34;      // the angle of repose of dry sand
export const SHADOW_DEG = 15;      // the lee separation line behind a brink

/* ── THE CLOCK ──────────────────────────────────────────────────────────────
   A sweep is "one erosion attempt per cell", which is a number of tries, not a
   length of time.  To put a year on the wall the model has to be pinned to a
   real desert, and there is exactly one honest place to do it: its own measured
   sand flux.  A working sand sea carries of the order of 60 cubic metres of
   sand past each metre of width each year (Bagnold's Egyptian traverses, and
   every erg survey since; 20-100 is the usual spread).  The model's measured
   flux is 4.50 m^2 per sweep — PART D of the twin measures it and PART I checks
   this line against it — so one sweep is 4.50/60 of a year.  Twenty-seven days.
   Everything the room says in years comes from that one division, and if you
   think a real erg moves twice as much sand, halve the clock. */
export const ERG_FLUX_M2_PER_YEAR = 60;
export const MEASURED_Q_M2_PER_SWEEP = 4.50;
export const YEARS_PER_SWEEP = MEASURED_Q_M2_PER_SWEEP / ERG_FLUX_M2_PER_YEAR;   // 0.075 yr

/* ── deterministic RNG (mulberry32) — a seed makes a desert reproducible ── */
export function rng32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ════════════════════════════════════════════════════════════════════════════
   THE FIELD
   ════════════════════════════════════════════════════════════════════════════ */

export function makeField(o) {
  o = o || {};
  const NX = o.NX || 256, NY = o.NY || 192;
  const DX = o.DX == null ? 2.0 : o.DX;
  /* THREE SLABS TO A CELL AT REPOSE.  The vertical quantum is not a taste — it
     is chosen so the lattice's own staircase limit lands exactly on 34 degrees
     rather than a hair over it.  (At a round 0.45 m it comes out at 34.02, and
     the twin's repose assert then fails by half a thousandth, which is the
     lattice telling the truth about itself.) */
  const SLAB = o.SLAB == null ? DX * Math.tan(REPOSE_DEG * Math.PI / 180) / 3 : o.SLAB;

  const st = {
    NX, NY, N: NX * NY, DX, SLAB,
    h: new Int32Array(NX * NY),          // height, in slabs
    flux: new Int32Array(NX * NY),       // slab-crossings through each cell
    /* THE GATE.  gate[x] is the NET number of slabs that have crossed the plane
       between column x and column x+1, counting EVERY way sand moves: the
       saltation walk and the avalanche both post to it.  (An early version
       counted only the walk, and the identity below missed by up to 20x — a
       migrating dune delivers a great deal of its lee-side mass by sliding, and
       sliding is transport.)  Only meaningful when the wind is along +x, which
       is the bench condition. */
    gate: new Float64Array(NX),
    gateAt: 0,
    rnd: rng32(o.seed == null ? 12345 : o.seed),
    seed: o.seed == null ? 12345 : o.seed,

    // ── the three rules' three numbers ──
    pSand: o.pSand == null ? 0.60 : o.pSand,
    pBare: o.pBare == null ? 0.40 : o.pBare,
    hop:   o.hop   == null ? 3    : o.hop,

    // ── the wind: a unit vector the sand is carried TOWARD ──
    windDeg: o.windDeg == null ? 0 : o.windDeg,
    wx: 1, wy: 0,

    // ── derived repose thresholds, in slabs ──
    thrO: 0, thrD: 0,
    shadowN: 0, shOff: null, shRise: null,
    stepN: 1,                                    // cells advanced per walk step

    // ── the separation-bubble mask, refreshed every `maskEvery` sweeps ──
    mask: new Uint8Array(NX * NY),
    useShadow: o.useShadow === false ? false : true,   // the room's switch
    maskEvery: o.maskEvery == null ? 0.25 : o.maskEvery,
    maskAt: -1e9,
    maskBuilds: 0,

    // ── bookkeeping ──
    sweeps: 0,           // fractional sweeps elapsed
    iters: 0,            // total iterations
    moved: 0,            // slabs lifted
    hopCells: 0,         // total cells stepped through by hopping slabs
    avalanched: 0,
    free: !!o.free       // (reserved) skip guards in bench runs
  };

  const t = Math.tan(REPOSE_DEG * Math.PI / 180);
  st.thrO = Math.max(1, Math.round(t * DX / SLAB));
  st.thrD = Math.max(1, Math.round(t * DX * Math.SQRT2 / SLAB));

  setWind(st, st.windDeg);
  if (o.fill) fillFlat(st, o.fill, o.rough == null ? 1 : o.rough);
  return st;
}

/* Lay `slabs` slabs on every cell, then rough it by +/- `rough` slabs so the
   flat sheet has something to be unstable about. Mass is exact: the roughing
   moves slabs from one cell to another, it never creates them. */
export function fillFlat(st, slabs, rough) {
  const { h, N } = st;
  h.fill(slabs);
  if (!rough) return;
  for (let k = 0; k < N; k++) {
    const i = (st.rnd() * N) | 0, j = (st.rnd() * N) | 0;
    const d = 1 + ((st.rnd() * rough) | 0);
    if (h[i] >= d) { h[i] -= d; h[j] += d; }
  }
  relaxAll(st);
}

export function totalSlabs(st) {
  let s = 0;
  for (let k = 0; k < st.N; k++) s += st.h[k];
  return s;
}

/* ── the wind, and the lookup tables that depend on it ──────────────────────
   windDeg is a compass-style bearing for the direction the sand TRAVELS:
   0 = toward +x (east across the field), 90 = toward +y. */
export function setWind(st, deg) {
  st.windDeg = deg;
  const r = deg * Math.PI / 180;
  st.wx = Math.cos(r); st.wy = Math.sin(r);

  /* A walk step advances one cell along the DOMINANT axis, so every step lands
     on a new cell (a king move) and the distance it covers is 1..sqrt(2) cells. */
  st.stepN = 1 / Math.max(Math.abs(st.wx), Math.abs(st.wy));

  /* the shadow ray: march UPWIND. A cell d cells upwind shadows us if it stands
     more than d*DX*tan(15) above us.  We stop at the distance beyond which no
     plausible dune could reach — 15 cells is 30 m, which shadows a rise of 8 m. */
  const NSH = 15;
  const offs = new Int32Array(NSH * 2), rise = new Float64Array(NSH);
  const tShadow = Math.tan(SHADOW_DEG * Math.PI / 180);
  let n = 0, lastx = 0, lasty = 0;
  for (let d = 1; d <= NSH * 2 && n < NSH; d++) {
    const ox = -Math.round(d * st.wx * 0.75), oy = -Math.round(d * st.wy * 0.75);
    if (ox === lastx && oy === lasty) continue;
    if (ox === 0 && oy === 0) continue;
    lastx = ox; lasty = oy;
    offs[n * 2] = ox; offs[n * 2 + 1] = oy;
    rise[n] = Math.hypot(ox, oy) * st.DX * tShadow / st.SLAB;   // in slabs
    n++;
  }
  st.shadowN = n; st.shOff = offs; st.shRise = rise;
  st.maskAt = -1e9;                              // the mask is now stale by definition
}

/* ── the shadow test, cell by cell (the definition) ─────────────────────── */
export function inShadow(st, x, y) {
  const { h, NX, NY, shOff, shRise, shadowN } = st;
  const here = h[y * NX + x];
  for (let d = 0; d < shadowN; d++) {
    let ux = x + shOff[d * 2], uy = y + shOff[d * 2 + 1];
    ux -= Math.floor(ux / NX) * NX; uy -= Math.floor(uy / NY) * NY;
    if (h[uy * NX + ux] - here > shRise[d]) return true;
  }
  return false;
}

/* ── …and the whole-field mask the simulation actually reads ─────────────
   The separation bubble is a property of the SURFACE, not of one grain, so it
   is computed for the whole desert at once and refreshed every `maskEvery`
   sweeps.  (A wind field does not re-solve itself once per saltating grain
   either.)  `maskEvery` is a discretisation knob: the twin refines it and
   checks that the measured numbers do not move. */
export function computeShadow(st) {
  const { h, NX, NY, shOff, shRise, shadowN, mask } = st;
  if (!st.useShadow) { mask.fill(0); st.maskAt = st.sweeps; st.maskBuilds++; return mask; }
  for (let y = 0; y < NY; y++) {
    const row = y * NX;
    for (let x = 0; x < NX; x++) {
      const here = h[row + x];
      let s = 0;
      for (let d = 0; d < shadowN; d++) {
        let ux = x + shOff[d * 2], uy = y + shOff[d * 2 + 1];
        ux -= Math.floor(ux / NX) * NX; uy -= Math.floor(uy / NY) * NY;
        if (h[uy * NX + ux] - here > shRise[d]) { s = 1; break; }
      }
      mask[row + x] = s;
    }
  }
  st.maskAt = st.sweeps;
  st.maskBuilds++;
  return mask;
}

/* ════════════════════════════════════════════════════════════════════════════
   RULE 3 — THE AVALANCHE
   A cell whose neighbour lies further below it than the angle of repose allows
   sheds slabs downhill until it doesn't.  Moving k slabs closes the gap by 2k,
   so the relaxation cannot cycle.  Mass is exactly conserved.
   ════════════════════════════════════════════════════════════════════════════ */

const NB8X = [1, -1, 0, 0, 1, 1, -1, -1];
const NB8Y = [0, 0, 1, -1, 1, -1, 1, -1];

/* Post `amount` slabs crossing from column `ax` to the adjacent column `bx`
   (adjacent on the torus).  Downwind (+x) is positive. */
function postGate(st, ax, bx, amount) {
  const NX = st.NX;
  const fwd = ((bx - ax) % NX + NX) % NX === 1;
  const back = ((ax - bx) % NX + NX) % NX === 1;
  if (fwd) st.gate[ax] += amount;
  else if (back) st.gate[bx] -= amount;
}

export function relax(st, x0, y0, stack) {
  const { h, NX, NY, thrO, thrD } = st;
  stack = stack || [];
  stack.length = 0;
  stack.push(y0 * NX + x0);
  let guard = 0;
  while (stack.length) {
    if (++guard > 200000) break;                 // cannot happen; refuses to hang
    const c = stack.pop();
    const cx = c % NX, cy = (c / NX) | 0;
    for (let k = 0; k < 8; k++) {
      let nx = cx + NB8X[k], ny = cy + NB8Y[k];
      nx -= Math.floor(nx / NX) * NX; ny -= Math.floor(ny / NY) * NY;
      const nn = ny * NX + nx;
      const thr = k < 4 ? thrO : thrD;
      const d = h[c] - h[nn];
      /* BOTH directions.  Only checking "am I too high for my neighbour" leaves
         the PIT an erosion opens behind — the cell is fine and its uphill
         neighbour, which nobody looked at, is not.  That reads as a broken
         angle of repose (57 degrees where 34 was asked for) and it is really a
         missing sign. */
      if (d > thr) {
        const move = Math.ceil((d - thr) / 2);
        h[c] -= move; h[nn] += move;
        st.avalanched += move;
        if (nx !== cx) postGate(st, cx, nx, move);
        stack.push(c); stack.push(nn);
        break;                                   // re-examine this cell fresh
      } else if (-d > thr) {
        const move = Math.ceil((-d - thr) / 2);
        h[nn] -= move; h[c] += move;
        st.avalanched += move;
        if (nx !== cx) postGate(st, nx, cx, move);
        stack.push(c); stack.push(nn);
        break;
      }
    }
  }
  return st;
}

/* Relax the whole field (used once after seeding). */
export function relaxAll(st) {
  const stack = [];
  for (let pass = 0; pass < 40; pass++) {
    const before = st.avalanched;
    for (let y = 0; y < st.NY; y++) for (let x = 0; x < st.NX; x++) relax(st, x, y, stack);
    if (st.avalanched === before) break;
  }
  return st;
}

/* The steepest slope anywhere in the field, as a tangent. */
export function maxSlope(st) {
  const { h, NX, NY, DX, SLAB } = st;
  let m = 0;
  for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
    const c = h[y * NX + x];
    for (let k = 0; k < 8; k++) {
      let nx = x + NB8X[k], ny = y + NB8Y[k];
      nx -= Math.floor(nx / NX) * NX; ny -= Math.floor(ny / NY) * NY;
      const dz = (c - h[ny * NX + nx]) * SLAB;
      const dl = (k < 4 ? DX : DX * Math.SQRT2);
      if (dz / dl > m) m = dz / dl;
    }
  }
  return m;
}

/* ════════════════════════════════════════════════════════════════════════════
   RULES 1 + 2 — ERODE AND HOP.  `iterate` runs `count` attempts.
   ════════════════════════════════════════════════════════════════════════════ */

export function iterate(st, count) {
  const { h, NX, NY, flux, mask } = st;
  const stack = [];
  const wx = st.wx, wy = st.wy, stepN = st.stepN;
  const dxs = wx * stepN, dys = wy * stepN;
  const maxWalk = 8 * (NX + NY);
  let sinceMask = (st.sweeps - st.maskAt);
  for (let it = 0; it < count; it++) {
    if (sinceMask >= st.maskEvery) { computeShadow(st); sinceMask = 0; }

    const x = (st.rnd() * NX) | 0, y = (st.rnd() * NY) | 0;
    const c = y * NX + x;
    if (h[c] <= 0) { sinceMask += 1 / st.N; continue; }   // bare floor: nothing to lift
    if (mask[c]) { sinceMask += 1 / st.N; continue; }      // RULE 1: the lee is not scoured
    h[c] -= 1;
    st.moved++;
    relax(st, x, y, stack);

    /* RULE 2 — the walk.  One cell downwind at a time.  A grain that enters the
       separation bubble falls out of the flow AT ONCE — it does not sail over
       the brink and land halfway down the lee — which is exactly what builds a
       slip face: sand piles at the brink and then avalanches at repose.  Away
       from the bubble it is offered the ground every `hop` cells. */
    let px = x + 0.5, py = y + 0.5;
    let sinceRoll = 0, tc = c, steps = 0, lastX = x;
    for (;;) {
      px += dxs; py += dys;
      if (px < 0 || px >= NX) px -= Math.floor(px / NX) * NX;
      if (py < 0 || py >= NY) py -= Math.floor(py / NY) * NY;
      const tx = px | 0, ty = py | 0;
      tc = ty * NX + tx;
      if (tx !== lastX) { postGate(st, lastX, tx, 1); lastX = tx; }
      st.hopCells += stepN;
      flux[tc]++;                                  // a slab passed through here
      if (mask[tc]) break;                         // the bubble: it drops, always
      sinceRoll += stepN;
      if (sinceRoll >= st.hop) {
        sinceRoll -= st.hop;
        if (st.rnd() < (h[tc] > 0 ? st.pSand : st.pBare)) break;
      }
      if (++steps > maxWalk) break;
    }
    h[tc] += 1;
    relax(st, tc % NX, (tc / NX) | 0, stack);
    sinceMask += 1 / st.N;
  }
  st.iters += count;
  st.sweeps += count / st.N;
  return st;
}

export function sweep(st, n) { return iterate(st, Math.round((n == null ? 1 : n) * st.N)); }

export function resetFlux(st) {
  st.flux.fill(0); st.gate.fill(0);
  st.fluxSweeps = st.sweeps; st.gateAt = st.sweeps;
}

/* ── THE GATE READOUT ───────────────────────────────────────────────────────
   q[x] — the sand flux through the plane between columns x and x+1, in
   metres^2 per sweep per unit crest-width.  gate[x] slabs of volume DX*DX*SLAB
   have crossed a gate NY*DX wide. */
export function gateFlux(st) {
  const s = st.sweeps - st.gateAt;
  const k = st.DX * st.SLAB / (st.NY * (s > 0 ? s : 1));
  const q = new Float64Array(st.NX);
  for (let x = 0; x < st.NX; x++) q[x] = st.gate[x] * k;
  return q;
}

/* Mean surface height of each column, in metres — the 1-D profile the gate is
   the flux through. */
export function columnProfile(st) {
  const p = new Float64Array(st.NX);
  for (let x = 0; x < st.NX; x++) {
    let s = 0;
    for (let y = 0; y < st.NY; y++) s += st.h[y * st.NX + x];
    p[x] = s * st.SLAB / st.NY;
  }
  return p;
}

/* ── THE IDENTITY ───────────────────────────────────────────────────────────
   A shape that translates without changing satisfies  c*h(x) = q(x) - q0.
   Both sides are measured here by instruments that never speak to each other:
   the left from where the sand IS (a centroid, over time), the right from what
   crossed a gate.  Returns the two curves, plus how well they agree. */
export function identity(st, cSpeed, q0) {
  const q = gateFlux(st), p = columnProfile(st);
  if (q0 == null) {
    // the flux over ground the dune has left bare: the lowest decile of h
    const idx = Array.from(p.keys()).sort((a, b) => p[a] - p[b]);
    const take = idx.slice(0, Math.max(3, Math.round(st.NX * 0.15)));
    q0 = take.reduce((a, i) => a + q[i], 0) / take.length;
  }
  const lhs = [], rhs = [];
  for (let x = 0; x < st.NX; x++) { lhs.push(cSpeed * p[x]); rhs.push(q[x] - q0); }
  let num = 0, den = 0, ss = 0, tt = 0, m = 0;
  for (let x = 0; x < st.NX; x++) { num += lhs[x] * rhs[x]; den += rhs[x] * rhs[x]; m += lhs[x]; }
  m /= st.NX;
  for (let x = 0; x < st.NX; x++) { const d = lhs[x] - rhs[x]; ss += d * d; tt += (lhs[x] - m) * (lhs[x] - m); }
  const peak = Math.max(...lhs.map(Math.abs));
  return {
    q0, lhs, rhs, q, profile: p,
    slope: den > 0 ? num / den : NaN,       // 1.0 if the two curves coincide
    r2: tt > 0 ? 1 - ss / tt : NaN,
    rmsRel: Math.sqrt(ss / st.NX) / (peak || 1)
  };
}

/* Flux through one cell, in m^2 per sweep, since the last resetFlux.
   A crossing carries one slab (DX*DX*SLAB of sand) through a gate DX wide,
   so per unit width it is DX*SLAB. */
export function fluxAt(st, x, y, sweepsElapsed) {
  const s = sweepsElapsed || (st.sweeps - (st.fluxSweeps || 0));
  if (s <= 0) return 0;
  return st.flux[y * st.NX + x] * st.DX * st.SLAB / s;
}

/* Mean flux over a set of cells (array of indices). */
export function fluxOver(st, cells, sweepsElapsed) {
  const s = sweepsElapsed || (st.sweeps - (st.fluxSweeps || 0));
  if (s <= 0 || !cells.length) return 0;
  let t = 0;
  for (let k = 0; k < cells.length; k++) t += st.flux[cells[k]];
  return (t / cells.length) * st.DX * st.SLAB / s;
}

/* ════════════════════════════════════════════════════════════════════════════
   THE INSTRUMENTS
   ════════════════════════════════════════════════════════════════════════════ */

/* Bare-ground fraction: how much of the floor the sand has left uncovered. */
export function bareFraction(st) {
  let n = 0;
  for (let k = 0; k < st.N; k++) if (st.h[k] === 0) n++;
  return n / st.N;
}

/* ── DUNE SEGMENTATION ──────────────────────────────────────────────────────
   A dune is a connected blob of sand standing at least `minSlabs` above the
   floor.  8-connected, periodic.  Centroids are circular means (the field is a
   torus, so an ordinary average would put a dune straddling the seam in the
   middle of the desert). */
export function findDunes(st, minSlabs) {
  const { h, NX, NY, N, DX, SLAB } = st;
  const thr = minSlabs == null ? 3 : minSlabs;
  const lab = new Int32Array(N).fill(-1);
  const out = [];
  const q = new Int32Array(N);
  for (let s = 0; s < N; s++) {
    if (h[s] < thr || lab[s] >= 0) continue;
    const id = out.length;
    let qh = 0, qt = 0;
    q[qt++] = s; lab[s] = id;
    let mass = 0, hmax = 0, hmaxCell = s, cells = [];
    let sxc = 0, sxs = 0, syc = 0, sys = 0, wsum = 0;
    while (qh < qt) {
      const c = q[qh++];
      const cx = c % NX, cy = (c / NX) | 0;
      const w = h[c];
      cells.push(c);
      mass += w;
      if (w > hmax) { hmax = w; hmaxCell = c; }
      const ax = 2 * Math.PI * cx / NX, ay = 2 * Math.PI * cy / NY;
      sxc += w * Math.cos(ax); sxs += w * Math.sin(ax);
      syc += w * Math.cos(ay); sys += w * Math.sin(ay);
      wsum += w;
      for (let k = 0; k < 8; k++) {
        let nx = cx + NB8X[k], ny = cy + NB8Y[k];
        nx -= Math.floor(nx / NX) * NX; ny -= Math.floor(ny / NY) * NY;
        const nn = ny * NX + nx;
        if (h[nn] >= thr && lab[nn] < 0) { lab[nn] = id; q[qt++] = nn; }
      }
    }
    let cx = (Math.atan2(sxs, sxc) / (2 * Math.PI)) * NX;
    let cy = (Math.atan2(sys, syc) / (2 * Math.PI)) * NY;
    cx -= Math.floor(cx / NX) * NX; cy -= Math.floor(cy / NY) * NY;
    out.push({
      id, cells, n: cells.length,
      cx, cy,
      H: hmax * SLAB,
      hmax,
      crest: hmaxCell,
      V: mass * DX * DX * SLAB,
      wsum
    });
  }
  return { dunes: out, lab };
}

/* Shortest signed separation on a periodic axis. */
export function wrapDelta(a, b, n) {
  let d = a - b;
  while (d > n / 2) d -= n;
  while (d < -n / 2) d += n;
  return d;
}

/* ── MIGRATION ──────────────────────────────────────────────────────────────
   Match the dunes in `after` to the dunes in `before` (nearest centroid, with a
   volume sanity gate), and report each one's downwind speed.  `dSweeps` is the
   elapsed time.  Speed comes back in metres per sweep. */
export function trackDunes(st, before, after, dSweeps, opts) {
  opts = opts || {};
  const maxCells = opts.maxCells == null ? 24 : opts.maxCells;
  const volTol = opts.volTol == null ? 0.55 : opts.volTol;
  const { NX, NY, DX, wx, wy } = st;
  const pairs = [];
  for (const b of before) {
    let best = null, bestD = 1e9;
    for (const a of after) {
      const dx = wrapDelta(a.cx, b.cx, NX), dy = wrapDelta(a.cy, b.cy, NY);
      const d = Math.hypot(dx, dy);
      if (d < bestD) { bestD = d; best = a; }
    }
    if (!best || bestD > maxCells) continue;
    const rv = Math.abs(best.V - b.V) / Math.max(b.V, 1e-9);
    if (rv > volTol) continue;
    const dx = wrapDelta(best.cx, b.cx, NX) * DX;
    const dy = wrapDelta(best.cy, b.cy, NY) * DX;
    const along = dx * wx + dy * wy;
    pairs.push({
      from: b, to: best,
      H: 0.5 * (b.H + best.H),
      V: 0.5 * (b.V + best.V),
      c: along / dSweeps,           // metres per sweep, downwind
      drift: (dx * -wy + dy * wx) / dSweeps
    });
  }
  return pairs;
}

/* ── THE HEADLINE FIT ───────────────────────────────────────────────────────
   c against 1/H, forced through the origin.  The slope IS the flux the dunes
   are living on: c*H = q.  Returns the slope, R^2 about that one-parameter
   model, and the spread of the individual c*H products. */
export function fitCH(pairs) {
  const pts = pairs.filter(p => p.H > 0 && isFinite(p.c));
  if (pts.length < 2) return { n: pts.length, q: NaN, r2: NaN, spread: NaN };
  let sxy = 0, sxx = 0;
  for (const p of pts) { const x = 1 / p.H; sxy += x * p.c; sxx += x * x; }
  const q = sxy / sxx;
  let ss = 0, tt = 0, mean = 0;
  for (const p of pts) mean += p.c;
  mean /= pts.length;
  for (const p of pts) {
    const pred = q / p.H;
    ss += (p.c - pred) * (p.c - pred);
    tt += (p.c - mean) * (p.c - mean);
  }
  const prod = pts.map(p => p.c * p.H);
  const pm = prod.reduce((a, b) => a + b, 0) / prod.length;
  const pv = Math.sqrt(prod.reduce((a, b) => a + (b - pm) * (b - pm), 0) / prod.length);
  return { n: pts.length, q, r2: tt > 0 ? 1 - ss / tt : NaN, mean: pm, spread: pv / (pm || 1) };
}

/* ── CREST-LINE ORIENTATION ─────────────────────────────────────────────────
   The structure tensor of the height field, summed over the whole desert.  Its
   minor eigenvector points ALONG the ridges.  Returned as a bearing in degrees
   in [0,180) plus an anisotropy in [0,1] (0 = no preferred direction). */
export function crestOrientation(st) {
  const { h, NX, NY } = st;
  let Jxx = 0, Jyy = 0, Jxy = 0;
  for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
    const xp = (x + 1) % NX, xm = (x + NX - 1) % NX;
    const yp = (y + 1) % NY, ym = (y + NY - 1) % NY;
    const gx = (h[y * NX + xp] - h[y * NX + xm]) * 0.5;
    const gy = (h[yp * NX + x] - h[ym * NX + x]) * 0.5;
    Jxx += gx * gx; Jyy += gy * gy; Jxy += gx * gy;
  }
  const tr = Jxx + Jyy, det = Jxx * Jyy - Jxy * Jxy;
  const disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
  const l1 = tr / 2 + disc, l2 = tr / 2 - disc;
  // major eigenvector = the direction of steepest change = ACROSS the ridges
  let ang = 0.5 * Math.atan2(2 * Jxy, Jxx - Jyy);         // radians, major axis
  let crest = ang + Math.PI / 2;                           // along the ridges
  let deg = crest * 180 / Math.PI;
  deg = ((deg % 180) + 180) % 180;
  return { deg, anisotropy: l1 > 0 ? (l1 - l2) / (l1 + l2) : 0, l1, l2 };
}

/* ── RUBIN & HUNTER'S RULE (1987) ───────────────────────────────────────────
   Given a wind rose (a list of {deg, weight}), a dune crest orients itself to
   the bearing that maximises the GROSS BEDFORM-NORMAL TRANSPORT — the total
   sand crossing the crest, counting both sides as positive.  This function is
   pure arithmetic on the rose; it never looks at the sand.  That is what makes
   it a prediction. */
export function gbnPrediction(rose) {
  let best = 0, bestV = -1;
  for (let a = 0; a < 180; a += 0.25) {
    const n = [Math.cos((a + 90) * Math.PI / 180), Math.sin((a + 90) * Math.PI / 180)];
    let s = 0;
    for (const w of rose) {
      const v = [Math.cos(w.deg * Math.PI / 180), Math.sin(w.deg * Math.PI / 180)];
      s += (w.weight == null ? 1 : w.weight) * Math.abs(v[0] * n[0] + v[1] * n[1]);
    }
    if (s > bestV) { bestV = s; best = a; }
  }
  return { deg: best, gbnt: bestV };
}

/* Angular difference between two undirected bearings, in [0,90]. */
export function axialDiff(a, b) {
  let d = Math.abs(((a - b) % 180 + 180) % 180);
  return d > 90 ? 180 - d : d;
}

/* ── THE NEGATIVE CONTROL ───────────────────────────────────────────────────
   The ONLY asymmetry in the whole model is that sand catches sand better than
   bare ground does.  Take it away and there is nothing left to make a dune. */
export function equalStickiness(st, p) {
  st.pSand = st.pBare = (p == null ? 0.5 : p);
  return st;
}

/* Relief: the peak-to-trough range of the desert, in metres. */
export function relief(st) {
  let lo = 1e9, hi = -1e9;
  for (let k = 0; k < st.N; k++) { const v = st.h[k]; if (v < lo) lo = v; if (v > hi) hi = v; }
  return (hi - lo) * st.SLAB;
}

/* Standard deviation of the surface, in metres — the cleanest single number for
   "how much dune is there". */
export function roughness(st) {
  let m = 0;
  for (let k = 0; k < st.N; k++) m += st.h[k];
  m /= st.N;
  let v = 0;
  for (let k = 0; k < st.N; k++) { const d = st.h[k] - m; v += d * d; }
  return Math.sqrt(v / st.N) * st.SLAB;
}

/* ── THE WIND ROSE, as a schedule ───────────────────────────────────────────
   A regime is a list of {deg, weight}.  `stepRegime` runs one episode: it picks
   the next direction round-robin by weight and sweeps for `episode` sweeps, so
   that over a long run the sand sees each wind in the declared proportion.
   Real deserts change wind on a timescale short compared with dune turnover;
   that is exactly what this does. */
export function makeRegime(rose, episode) {
  const total = rose.reduce((a, w) => a + (w.weight == null ? 1 : w.weight), 0);
  return { rose, episode: episode == null ? 4 : episode, total, acc: rose.map(() => 0), i: 0 };
}

/* Which wind is furthest behind its declared share of the rose. */
export function regimeNext(reg) {
  let pick = 0, worst = -1e9;
  const served = reg.acc.reduce((a, b) => a + b, 0) || 1e-9;
  for (let k = 0; k < reg.rose.length; k++) {
    const want = (reg.rose[k].weight == null ? 1 : reg.rose[k].weight) / reg.total;
    const deficit = want - reg.acc[k] / served;
    if (deficit > worst) { worst = deficit; pick = k; }
  }
  return pick;
}

export function stepRegime(st, reg) {
  const pick = regimeNext(reg);
  setWind(st, reg.rose[pick].deg);
  sweep(st, reg.episode);
  reg.acc[pick] += reg.episode;
  return reg.rose[pick].deg;
}

/* Advance an arbitrary number of sweeps, switching direction whenever the
   current episode runs out.  The live room needs this rather than stepRegime:
   its frame budget decides how much sand moves, not the wind's schedule. */
export function regimeAdvance(st, reg, sweeps) {
  let left = sweeps;
  let guard = 0;
  while (left > 1e-9 && ++guard < 10000) {
    if (reg.cur == null || !(reg.left > 0)) {
      reg.cur = regimeNext(reg);
      reg.left = reg.episode;
      setWind(st, reg.rose[reg.cur].deg);
    }
    const take = Math.min(left, reg.left);
    sweep(st, take);
    reg.acc[reg.cur] += take;
    reg.left -= take;
    left -= take;
  }
  return reg.rose[reg.cur].deg;
}
