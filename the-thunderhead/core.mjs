/* ═══════════════════════════════════════════════════════════════════════════
   THE THUNDERHEAD  ·  core.mjs
   The physics of a flash and of the sound it makes.  Pure, DOM-free, no GL,
   no AudioContext.  Everything here runs identically in the page and in
   core.test.mjs (the Node twin).

   THREE THINGS LIVE IN HERE

   1. THE CHANNEL — a dielectric-breakdown model (Niemeyer, Pietronero &
      Wiesmann 1984).  Laplace's equation is relaxed on a lattice with the
      growing channel held at one potential and the sink at another; a cell
      adjacent to the channel is added with probability proportional to the
      local potential raised to a power eta.  Nobody draws a zig-zag: the
      branching, the tortuosity and the fractal dimension all fall out of
      that one rule.  Lower eta -> bushier; higher eta -> straighter.

   2. THE AIR — ISO 9613-1 atmospheric absorption, the real closed form with
      the oxygen and nitrogen relaxation frequencies.  This is why a distant
      flash is a rumble and a near one is a crack: air eats 24 dB of 4 kHz
      per kilometre and only 0.6 dB of 250 Hz.  core.test.mjs checks this
      implementation against the published table in the standard.

   3. THE SOUND — every segment of channel radiates a shock when the return
      stroke passes it.  We sum them at the listener with their TRUE travel
      times.  Because arrival time is exactly distance/c, the absorption a
      sample has suffered depends only on WHEN it arrives, so the air filter
      is applied as a time-varying, block-wise, MINIMUM-PHASE filter with the
      distance read straight off the clock.

   THE CLAIM
      Thunder is the shape of the bolt, played back in time.
        first bang   = (distance to the NEAREST piece of channel) / c
        end of roll  = (distance to the FARTHEST piece) / c  + stroke offsets
      Both are computed from geometry with no audio in them at all, and then
      MEASURED off the rendered waveform.  A flash that points at you cracks;
      the same flash turned side-on rolls for ten seconds.

   HONEST ABOUT THE MODEL (stated on the page too)
      · Each segment's own pulse is an N-wave whose period grows as r^(1/4)
        (weak-shock stretching, Few 1969).  That is a fitted law, not derived
        here.
      · Spreading is taken as 1/r.  A true weak shock decays a little slower
        than that before it linearises; across these distances the difference
        is small compared with the absorption, which is what actually shapes
        the roll.
      · The intracloud sheet is grown by the same breakdown rule on a
        horizontal lattice.  It is a plausible flash, not a claim about where
        charge sits in a real cloud.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── constants ─────────────────────────────────────────────────────────────── */
const C_SOUND = 343.0;          // m/s, dry air at 20 C
const P_REF   = 101325;         // Pa
const T_REF   = 293.15;         // K
const T01     = 273.16;         // K, triple point

/* ── seeded rng (mulberry32) ───────────────────────────────────────────────── */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   1 · THE DIELECTRIC BREAKDOWN MODEL
   ═══════════════════════════════════════════════════════════════════════════ */

/* A lattice discharge.  The channel is held at phi = 0; the sink boundary at
   phi = 1; every other outer edge is insulating (Neumann, mirrored).  One cell
   is added per step, chosen among the channel's neighbours with
   p_i proportional to phi_i^eta.

   `sink` is 'bottom' (a cloud-to-ground leader) or 'lr' (an intracloud sheet
   draining toward charge pockets off to either side).

   The object it returns is a STEPPER so a page can grow the flash over frames
   without dropping one; growAll() runs it to completion for the twin. */
function makeDischarge(opt) {
  const W = opt.W, H = opt.H, N = W * H;
  const eta = opt.eta === undefined ? 2.0 : opt.eta;
  const sink = opt.sink || 'bottom';
  const rng = opt.rng || mulberry32(1);
  const maxCells = opt.maxCells || 4000;
  const sweeps = opt.sweeps === undefined ? 6 : opt.sweeps;
  const omega = 1.85;

  const phi = new Float64Array(N);
  const chan = new Uint8Array(N);      // 1 = channel (phi pinned to 0)
  const isSink = new Uint8Array(N);    // 1 = sink boundary (phi pinned to 1)
  const isCand = new Uint8Array(N);
  const parentOf = new Int32Array(N).fill(-1);

  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (sink === 'bottom') { if (y === H - 1) isSink[i] = 1; }
    else                   { if (x === 0 || x === W - 1) isSink[i] = 1; }
  }
  // initial guess: linear ramp toward the sink, so SOR starts warm
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    phi[y * W + x] = sink === 'bottom' ? y / (H - 1)
                                      : Math.min(x, W - 1 - x) / ((W - 1) / 2);
  }

  const seedIdx = opt.seedY * W + opt.seedX;
  const nodes = [];                    // {i, x, y, parent}  parent = index into nodes
  const nodeAt = new Int32Array(N).fill(-1);
  const cands = [];                    // lattice indices

  function addCell(i, parentNode) {
    chan[i] = 1; phi[i] = 0; isCand[i] = 0;
    nodeAt[i] = nodes.length;
    nodes.push({ i: i, x: i % W, y: (i / W) | 0, parent: parentNode });
    const x = i % W, y = (i / W) | 0;
    const nb = [];
    if (x > 0) nb.push(i - 1);
    if (x < W - 1) nb.push(i + 1);
    if (y > 0) nb.push(i - W);
    if (y < H - 1) nb.push(i + W);
    for (let k = 0; k < nb.length; k++) {
      const j = nb[k];
      if (!chan[j] && !isCand[j]) { isCand[j] = 1; parentOf[j] = i; cands.push(j); }
    }
  }
  addCell(seedIdx, -1);

  let done = false, attached = -1;

  function relax(n) {
    for (let s = 0; s < n; s++) {
      for (let y = 0; y < H; y++) {
        const row = y * W;
        for (let x = 0; x < W; x++) {
          const i = row + x;
          if (chan[i] || isSink[i]) continue;
          const l = x > 0     ? phi[i - 1] : phi[i + 1];
          const r = x < W - 1 ? phi[i + 1] : phi[i - 1];
          const u = y > 0     ? phi[i - W] : phi[i + W];
          const d = y < H - 1 ? phi[i + W] : phi[i - W];
          phi[i] += omega * (0.25 * (l + r + u + d) - phi[i]);
        }
      }
    }
  }

  /* one growth step; returns false when the discharge has finished */
  function step() {
    if (done) return false;
    relax(sweeps);
    // roulette over phi^eta
    let tot = 0;
    const wts = new Float64Array(cands.length);
    for (let k = 0; k < cands.length; k++) {
      const p = phi[cands[k]];
      const w = p > 0 ? Math.pow(p, eta) : 0;
      wts[k] = w; tot += w;
    }
    if (tot <= 0 || cands.length === 0) { done = true; return false; }
    let t = rng() * tot, pick = cands.length - 1;
    for (let k = 0; k < cands.length; k++) { t -= wts[k]; if (t <= 0) { pick = k; break; } }
    const i = cands[pick];
    cands[pick] = cands[cands.length - 1]; cands.pop();
    const pIdx = nodeAt[parentOf[i]];
    addCell(i, pIdx);
    if (isSink[i]) { attached = nodes.length - 1; if (sink === 'bottom') done = true; }
    if (nodes.length >= maxCells) done = true;
    return !done;
  }

  function growAll() { let guard = maxCells + 8; while (step() && guard-- > 0); return result(); }

  function result() {
    return { W: W, H: H, nodes: nodes, chan: chan, attached: attached, eta: eta,
             seedX: opt.seedX, seedY: opt.seedY };
  }

  return { step: step, growAll: growAll, result: result,
           get count() { return nodes.length; },
           get done() { return done; } };
}

/* Box-counting dimension of the occupied lattice cells.
   N(e) ~ e^-D  =>  D = -slope of log N against log e. */
function boxDimension(chan, W, H, scales) {
  const S = scales || [1, 2, 4, 8, 16];
  const xs = [], ys = [];
  for (let s = 0; s < S.length; s++) {
    const e = S[s];
    const bw = Math.ceil(W / e), bh = Math.ceil(H / e);
    const box = new Uint8Array(bw * bh);
    let n = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!chan[y * W + x]) continue;
      const b = ((y / e) | 0) * bw + ((x / e) | 0);
      if (!box[b]) { box[b] = 1; n++; }
    }
    if (n > 0) { xs.push(Math.log(1 / e)); ys.push(Math.log(n)); }
  }
  // least squares slope
  const n = xs.length;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let k = 0; k < n; k++) { sx += xs[k]; sy += ys[k]; sxx += xs[k] * xs[k]; sxy += xs[k] * ys[k]; }
  return (n * sxy - sx * sy) / (n * sxx - sx * sx);
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · THE FLASH — lattice discharges embedded in the world, in metres
   ═══════════════════════════════════════════════════════════════════════════ */

/* subtree charge: how much channel hangs above each node.  The return stroke
   drains all of it through that node's segment, so this IS the segment's
   current, to the accuracy we are claiming. */
function subtreeCharge(nodes) {
  const q = new Float64Array(nodes.length).fill(1);
  for (let k = nodes.length - 1; k >= 1; k--) {
    const p = nodes[k].parent;
    if (p >= 0) q[p] += q[k];
  }
  return q;
}

/* The acoustics treats each segment as a COMPACT source — small compared with
   its distance — so no segment may be long.  Cut the long ones up; the pieces
   keep the parent's current, which is what a piece of a wire does. */
function subdivideSegments(segs, maxLen) {
  const out = [];
  for (let k = 0; k < segs.length; k++) {
    const s = segs[k];
    const n = Math.max(1, Math.ceil(s.len / maxLen));
    if (n === 1) { out.push(s); continue; }
    for (let i = 0; i < n; i++) {
      const u = i / n, v = (i + 1) / n;
      out.push({ ax: s.ax + (s.bx - s.ax) * u, ay: s.ay + (s.by - s.ay) * u, az: s.az + (s.bz - s.az) * u,
                 bx: s.ax + (s.bx - s.ax) * v, by: s.ay + (s.by - s.ay) * v, bz: s.az + (s.bz - s.az) * v,
                 len: s.len / n, w: s.w, main: s.main, part: s.part });
    }
  }
  return out;
}

/* Build the full flash: one cloud-to-ground leader plus one intracloud sheet,
   both grown by makeDischarge, both embedded in world metres.

   Returns { segments, meta }.  A segment is
     {ax,ay,az, bx,by,bz, len, w, main}
   with w already normalised so the trunk is 1. */
function buildFlash(opt) {
  const o = Object.assign({
    seed: 7, eta: 2.0,
    cgW: 96, cgH: 132, cgCell: 14,      // 1344 m wide, 1834 m of gap
    icW: 160, icH: 56, icCell: 34,      // a 5.4 km x 1.9 km sheet inside the cloud
    cloudBase: 1850, sheetY: 3050,
    branchTwist: true
  }, opt || {});

  const rngA = mulberry32(o.seed * 2654435761 % 2147483647);
  const rngB = mulberry32((o.seed * 40503 + 12345) % 2147483647);

  const cg = makeDischarge({ W: o.cgW, H: o.cgH, seedX: o.cgW >> 1, seedY: 0,
                             eta: o.eta, rng: rngA, sink: 'bottom',
                             maxCells: 2600, sweeps: 6 }).growAll();
  const ic = makeDischarge({ W: o.icW, H: o.icH, seedX: o.icW >> 1, seedY: o.icH >> 1,
                             eta: o.eta, rng: rngB, sink: 'lr',
                             maxCells: o.icCells || 900, sweeps: 5 }).growAll();

  const segments = [];

  /* --- the cloud-to-ground leader: a plane of lattice, but each branch is
     swung to its own azimuth about the point it left, so the flash is a real
     three-dimensional object for the sound to come off. --- */
  const cgPos = new Float64Array(cg.nodes.length * 3);
  const cgAz = new Float64Array(cg.nodes.length);
  const childCount = new Int32Array(cg.nodes.length);
  const qcg = subtreeCharge(cg.nodes);
  const totQ = qcg[0];
  for (let k = 0; k < cg.nodes.length; k++) {
    const nd = cg.nodes[k];
    if (k === 0) {
      cgPos[0] = 0; cgPos[1] = o.cloudBase; cgPos[2] = 0; cgAz[0] = 0;
      continue;
    }
    const p = nd.parent, pd = cg.nodes[p];
    const isFirst = (childCount[p]++) === 0;
    let az = cgAz[p];
    if (!isFirst && o.branchTwist) az = rngA() * Math.PI * 2;
    az += (rngA() - 0.5) * 0.10;                       // slow wander in azimuth
    cgAz[k] = az;
    const dx = (nd.x - pd.x) * o.cgCell;
    const dy = -(nd.y - pd.y) * o.cgCell;              // lattice y grows downward
    cgPos[k * 3    ] = cgPos[p * 3    ] + dx * Math.cos(az);
    cgPos[k * 3 + 1] = cgPos[p * 3 + 1] + dy;
    cgPos[k * 3 + 2] = cgPos[p * 3 + 2] + dx * Math.sin(az);
  }
  /* which nodes are the trunk (attachment back to the seed)? */
  const mainCG = new Uint8Array(cg.nodes.length);
  if (cg.attached >= 0) { let k = cg.attached; while (k >= 0) { mainCG[k] = 1; k = cg.nodes[k].parent; } }
  for (let k = 1; k < cg.nodes.length; k++) {
    const p = cg.nodes[k].parent;
    const ax = cgPos[p * 3], ay = cgPos[p * 3 + 1], az2 = cgPos[p * 3 + 2];
    const bx = cgPos[k * 3], by = cgPos[k * 3 + 1], bz = cgPos[k * 3 + 2];
    const len = Math.hypot(bx - ax, by - ay, bz - az2);
    segments.push({ ax: ax, ay: ay, az: az2, bx: bx, by: by, bz: bz,
                    len: len, w: qcg[k] / totQ, main: mainCG[k] ? 1 : 0, part: 0 });
  }

  /* --- the intracloud sheet: a horizontal lattice at sheetY, laid so its
     origin sits over the leader's top.  Branches get a vertical offset
     instead of a twist — the layer is stratified. --- */
  const icPos = new Float64Array(ic.nodes.length * 3);
  const icDY = new Float64Array(ic.nodes.length);
  const icChild = new Int32Array(ic.nodes.length);
  const qic = subtreeCharge(ic.nodes);
  const totQic = qic[0];
  const dir = o.sheetDir === undefined ? 1 : o.sheetDir;
  for (let k = 0; k < ic.nodes.length; k++) {
    const nd = ic.nodes[k];
    if (k === 0) { icPos[0] = 0; icPos[1] = o.sheetY; icPos[2] = 0; continue; }
    const p = ic.nodes[k].parent, pd = ic.nodes[p];
    const isFirst = (icChild[p]++) === 0;
    let dy = icDY[p];
    if (!isFirst) dy += (rngB() - 0.5) * 260;
    dy += (rngB() - 0.5) * 12;
    icDY[k] = dy;
    icPos[k * 3    ] = icPos[p * 3    ] + (nd.x - pd.x) * o.icCell * dir;
    icPos[k * 3 + 1] = o.sheetY + dy;
    icPos[k * 3 + 2] = icPos[p * 3 + 2] + (nd.y - pd.y) * o.icCell;
  }
  for (let k = 1; k < ic.nodes.length; k++) {
    const p = ic.nodes[k].parent;
    const ax = icPos[p * 3], ay = icPos[p * 3 + 1], az2 = icPos[p * 3 + 2];
    const bx = icPos[k * 3], by = icPos[k * 3 + 1], bz = icPos[k * 3 + 2];
    const len = Math.hypot(bx - ax, by - ay, bz - az2);
    segments.push({ ax: ax, ay: ay, az: az2, bx: bx, by: by, bz: bz,
                    len: len, w: 0.55 * qic[k] / totQic, main: 0, part: 1 });
  }

  /* the stem that joins the sheet to the top of the leader */
  segments.push({ ax: 0, ay: o.sheetY, az: 0, bx: 0, by: o.cloudBase, bz: 0,
                  len: o.sheetY - o.cloudBase, w: 1, main: 1, part: 2 });

  /* put the origin where it struck the ground, so the room can orbit that */
  const gx = cgPos[(cg.attached >= 0 ? cg.attached : 0) * 3];
  const gz = cgPos[(cg.attached >= 0 ? cg.attached : 0) * 3 + 2];
  for (let k = 0; k < segments.length; k++) {
    const s = segments[k];
    s.ax -= gx; s.bx -= gx; s.az -= gz; s.bz -= gz;
  }

  return {
    segments: subdivideSegments(segments, o.maxSegLen || 26),
    cg: cg, ic: ic,
    meta: { cloudBase: o.cloudBase, sheetY: o.sheetY, eta: o.eta, seed: o.seed,
            cgCell: o.cgCell, icCell: o.icCell,
            groundX: 0, groundZ: 0, cgOffsetX: -gx, cgOffsetZ: -gz }
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · THE AIR — ISO 9613-1 atmospheric absorption
   ═══════════════════════════════════════════════════════════════════════════ */

/* alpha in dB/m.  f Hz, T kelvin, hr relative humidity in percent,
   pa ambient pressure in Pa. */
function absorptionDbPerM(f, T, hr, pa) {
  T = T === undefined ? T_REF : T;
  hr = hr === undefined ? 70 : hr;
  pa = pa === undefined ? P_REF : pa;
  const pr = P_REF;
  // saturation vapour pressure, ISO 9613-1 Annex B
  const V = 10.79586 * (1 - T01 / T) - 5.02808 * Math.log10(T / T01)
          + 1.50474e-4 * (1 - Math.pow(10, -8.29692 * (T / T01 - 1)))
          + 0.42873e-3 * (Math.pow(10, 4.76955 * (1 - T01 / T)) - 1) - 2.2195983;
  const psat = pr * Math.pow(10, V);
  const h = hr * (psat / pa);                       // molar concentration, %
  const pRatio = pa / pr, tRatio = T / T_REF;
  const frO = pRatio * (24 + 4.04e4 * h * (0.02 + h) / (0.391 + h));
  const frN = pRatio * Math.pow(tRatio, -0.5)
            * (9 + 280 * h * Math.exp(-4.170 * (Math.pow(tRatio, -1 / 3) - 1)));
  const f2 = f * f;
  const term = 1.84e-11 / pRatio * Math.sqrt(tRatio)
    + Math.pow(tRatio, -2.5) * (
        0.01275 * Math.exp(-2239.1 / T) / (frO + f2 / frO) +
        0.10680 * Math.exp(-3352.0 / T) / (frN + f2 / frN));
  return 8.686 * f2 * term;
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · GEOMETRY -> PREDICTION.  No audio anywhere in this function.
   ═══════════════════════════════════════════════════════════════════════════ */

function segMid(s) { return [(s.ax + s.bx) / 2, (s.ay + s.by) / 2, (s.az + s.bz) / 2]; }

function distances(segments, listener) {
  const out = new Float64Array(segments.length);
  for (let k = 0; k < segments.length; k++) {
    const m = segMid(segments[k]);
    out[k] = Math.hypot(m[0] - listener[0], m[1] - listener[1], m[2] - listener[2]);
  }
  return out;
}

/* THE PULSE ONE SEGMENT MAKES.

   A channel carrying energy E per unit length blows a cylinder of air out to
   its RELAXATION RADIUS, Rc = sqrt(E_l / (pi p0)) (Few 1969) — the radius at
   which the shock has spent itself down to ambient pressure.  For the trunk of
   a return stroke, E_l ~ 1e5 J/m, so Rc is about half a metre.  The pulse
   leaves as an N-wave of period 2Rc/c, and the weak shock STRETCHES as it
   travels, as r^(1/4).

   E_l goes as the square of the current, so Rc goes as the CURRENT: a thin
   branch draining a hundredth of the charge makes a pulse a hundredth as
   long — a click at a kilohertz where the trunk booms at forty.  Worth
   knowing what that does and does NOT buy.  It is real, and it is in here,
   and when you add the energy up it turns out to be inaudible: those branches
   are also a fiftieth of the amplitude, so they land some 36 dB down and the
   sound is a low boom whatever you do.  The sharp CRACK of a strike a few
   hundred metres off is a near-field shock that has not finished relaxing —
   that is not modelled here, and the page says so rather than faking it. */
const EL_TRUNK = 1.0e5;                                  // J/m in the trunk
const RC = Math.sqrt(EL_TRUNK / (Math.PI * P_REF));      // ~0.56 m
const W_FLOOR = 0.02;                                    // thinnest modelled branch
const TORTUOSITY_SPREAD = 0.18;   // +/- fraction the pulse period is jittered by
function relaxRadius(w) { return RC * Math.max(w, W_FLOOR); }
function nwavePeriod(r, w) {
  const rc = relaxRadius(w === undefined ? 1 : w);
  return (2 * rc / C_SOUND) * Math.pow(Math.max(r, rc) / rc, 0.25);
}

/* strokes: [{t, amp}] — a flash usually restrikes two or three times. */
function strokeTrain(seed, n) {
  const rng = mulberry32((seed * 97 + 13) >>> 0);
  const k = n === undefined ? 1 + Math.floor(rng() * 3) : n;
  const out = [{ t: 0, amp: 1 }];
  let t = 0;
  for (let i = 1; i < k; i++) {
    t += 0.030 + rng() * 0.065;
    out.push({ t: t, amp: 0.42 + rng() * 0.30 });
  }
  return out;
}

function predict(segments, listener, strokes) {
  const d = distances(segments, listener);
  let dmin = Infinity, dmax = 0, imin = 0, imax = 0;
  for (let k = 0; k < d.length; k++) {
    if (d[k] < dmin) { dmin = d[k]; imin = k; }
    if (d[k] > dmax) { dmax = d[k]; imax = k; }
  }
  const st = strokes || [{ t: 0, amp: 1 }];
  const tLast = st[st.length - 1].t;
  const first = dmin / C_SOUND + st[0].t;
  const last = dmax / C_SOUND + tLast + nwavePeriod(dmax, segments[imax].w);
  return {
    dMin: dmin, dMax: dmax, iMin: imin, iMax: imax,
    firstArrival: first, lastArrival: last, roll: last - first,
    depth: dmax - dmin
  };
}

/* THE SECOND PREDICTION, AND THE BEST ONE.

   Every segment sends its pulse off at the same instant and it arrives at
   r/c.  So if you simply take the channel apart, put each piece in a bin
   according to how far away it is, and weight it by the energy that will
   reach you from it, you get a curve — with no sound synthesis anywhere in
   it — that ought to BE the shape of the thunder's loudness.  arrivalProfile
   computes that from geometry; envelopeOf measures the same curve off the
   rendered waveform; they are compared on the page and in the twin.

   Returns { t0, dt, bins } — energy per bin, and stats give the 5th/50th/95th
   energy percentiles of the roll. */
function arrivalProfile(segments, listener, opt) {
  const o = Object.assign({ dt: 0.02, strokes: [{ t: 0, amp: 1 }],
                            air: { T: T_REF, hr: 70, pa: P_REF } }, opt || {});
  const d = distances(segments, listener);
  const st = o.strokes;
  let tmin = Infinity, tmax = 0;
  for (let k = 0; k < d.length; k++) {
    const t = d[k] / C_SOUND;
    if (t < tmin) tmin = t;
    if (t > tmax) tmax = t;
  }
  const t0 = tmin + st[0].t;
  const t1 = tmax + st[st.length - 1].t + 0.25;
  const nb = Math.max(4, Math.ceil((t1 - t0) / o.dt));
  const bins = new Float64Array(nb);
  for (let k = 0; k < segments.length; k++) {
    const s = segments[k], r = d[k];
    if (r < 1) continue;
    /* energy that survives the trip: the pulse's own band, absorbed over r */
    const T = nwavePeriod(r, s.w);
    const fChar = 1 / T;                       // the pulse's characteristic tone
    const absorb = Math.pow(10, -absorptionDbPerM(fChar, o.air.T, o.air.hr, o.air.pa) * r / 10);
    const amp = s.w * s.len / r;
    const e = amp * amp * T * absorb;
    /* the pulse is not an instant: spread its energy over its own duration */
    const span = Math.max(1, T / o.dt);
    for (let si = 0; si < st.length; si++) {
      const b0 = (r / C_SOUND + st[si].t - t0) / o.dt;
      const share = e * st[si].amp * st[si].amp / span;
      const lo = Math.floor(b0), hi = Math.floor(b0 + span);
      for (let b = lo; b <= hi; b++) {
        if (b < 0 || b >= nb) continue;
        const ov = Math.min(b + 1, b0 + span) - Math.max(b, b0);
        if (ov > 0) bins[b] += share * ov;
      }
    }
  }
  return { t0: t0, dt: o.dt, bins: bins };
}

/* the same curve, measured off a waveform: energy per bin */
function envelopeOf(samples, sr, t0, dt, nb) {
  const bins = new Float64Array(nb);
  for (let b = 0; b < nb; b++) {
    const a = Math.max(0, Math.round((t0 + b * dt) * sr));
    const z = Math.min(samples.length, Math.round((t0 + (b + 1) * dt) * sr));
    let e = 0;
    for (let i = a; i < z; i++) e += samples[i] * samples[i];
    bins[b] = e;
  }
  return { t0: t0, dt: dt, bins: bins };
}

/* energy percentiles of a profile — a threshold-free way to say
   "the roll runs from here to here" */
function profileStats(p) {
  let tot = 0;
  for (let i = 0; i < p.bins.length; i++) tot += p.bins[i];
  const q = [0.05, 0.5, 0.95], out = [];
  let acc = 0, qi = 0;
  for (let i = 0; i < p.bins.length && qi < q.length; i++) {
    acc += p.bins[i];
    while (qi < q.length && acc >= q[qi] * tot) { out.push(p.t0 + (i + 0.5) * p.dt); qi++; }
  }
  while (out.length < 3) out.push(p.t0 + p.bins.length * p.dt);
  return { t05: out[0], t50: out[1], t95: out[2], d90: out[2] - out[0], total: tot };
}

/* Pearson correlation of two profiles, on the shared bins */
function profileCorrelation(a, b) {
  const n = Math.min(a.bins.length, b.bins.length);
  let sa = 0, sb = 0;
  for (let i = 0; i < n; i++) { sa += a.bins[i]; sb += b.bins[i]; }
  const ma = sa / n, mb = sb / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const u = a.bins[i] - ma, v = b.bins[i] - mb;
    num += u * v; da += u * u; db += v * v;
  }
  return da > 0 && db > 0 ? num / Math.sqrt(da * db) : 0;
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · A LITTLE FFT (radix-2, in place).  Used to design the air filters and
       to measure the spectrum of what we rendered.
   ═══════════════════════════════════════════════════════════════════════════ */
function fft(re, im, inverse) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (inverse ? 2 : -2) * Math.PI / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        const ncr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = ncr;
      }
    }
  }
  if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}

/* THE AIR AS A FILTER.

   The obvious thing — inverse-FFT the desired magnitude and window it — gives
   a LINEAR-PHASE filter, and that is wrong twice over.  It rings BEFORE the
   pulse arrives (so the first bang smears earlier than the geometry says it
   can, and the whole claim of this room goes soft), and truncating it leaves
   a stopband floor that lets kilohertz leak through a filter that is supposed
   to be 90 dB down — which is exactly the sort of quiet error that shows up
   as a measurement disagreeing with a prediction for no visible reason.

   So: build the MINIMUM-PHASE filter with the same magnitude, by folding the
   real cepstrum.  Causal, front-loaded, no pre-ring, and the truncation error
   collapses.  Air really is a minimum-phase medium, so this is also the more
   honest object. */
function minPhaseFIR(magAt, taps, N) {
  const re = new Float64Array(N), im = new Float64Array(N);
  const FLOOR = Math.log(1e-7);
  for (let k = 0; k <= N / 2; k++) {
    const v = Math.max(FLOOR, Math.log(Math.max(magAt(k), 1e-30)));
    re[k] = v; if (k > 0 && k < N / 2) re[N - k] = v;
  }
  fft(re, im, true);                       // real cepstrum
  const cr = new Float64Array(N), ci = new Float64Array(N);
  cr[0] = re[0]; cr[N / 2] = re[N / 2];
  for (let k = 1; k < N / 2; k++) cr[k] = 2 * re[k];
  fft(cr, ci, false);                      // complex log spectrum, min phase
  for (let k = 0; k < N; k++) {
    const m = Math.exp(cr[k]);
    cr[k] = m * Math.cos(ci[k]); ci[k] = m * Math.sin(ci[k]);
  }
  fft(cr, ci, true);                       // -> causal impulse response
  const h = new Float64Array(taps);
  for (let k = 0; k < taps; k++) {
    /* a gentle cosine taper over the last eighth kills the truncation step */
    const tail = taps - k, fade = taps >> 3;
    const w = tail < fade ? 0.5 - 0.5 * Math.cos(Math.PI * tail / fade) : 1;
    h[k] = cr[k] * w;
  }
  return h;
}

function airFIR(range, taps, sr, air, N) {
  N = N || 2048;
  return minPhaseFIR(function (k) {
    const f = Math.max(k * sr / N, 0.5);
    return Math.pow(10, -absorptionDbPerM(f, air.T, air.hr, air.pa) * range / 20);
  }, taps, N);
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · THE SOUND
   ═══════════════════════════════════════════════════════════════════════════ */

function synthesise(segments, listener, opt) {
  const o = Object.assign({
    sr: 44100, seed: 7, strokes: null, tail: 0.6,
    air: { T: T_REF, hr: 70, pa: P_REF }, taps: 640, fftN: 4096
  }, opt || {});
  const sr = o.sr;
  const strokes = o.strokes || [{ t: 0, amp: 1 }];
  const rng = mulberry32((o.seed * 7919 + 5) >>> 0);
  const d = distances(segments, listener);
  const pred = predict(segments, listener, strokes);
  const n = Math.ceil((pred.lastArrival + o.tail) * sr);
  const dry = new Float64Array(n);

  /* every segment, every stroke: one N-wave, delayed by its own travel time */
  for (let k = 0; k < segments.length; k++) {
    const s = segments[k], r = d[k];
    if (r < 1) continue;
    const T = nwavePeriod(r, s.w) * (1 - TORTUOSITY_SPREAD + 2 * TORTUOSITY_SPREAD * rng());
    const amp = s.w * s.len / r;
    const halfN = Math.max(2, Math.round(T * sr / 2));
    const rise = Math.max(1, Math.round(0.00006 * sr));   // 2-3 samples: tame the alias, keep 4 kHz
    for (let si = 0; si < strokes.length; si++) {
      const t0 = r / C_SOUND + strokes[si].t;
      const a = amp * strokes[si].amp;
      const base = t0 * sr;
      const i0 = Math.floor(base);
      const frac = base - i0;
      for (let j = 0; j < halfN * 2; j++) {
        /* N-wave: +1 -> -1 linearly across the period, with softened jumps */
        let v = 1 - j / halfN;
        const edge = Math.min(j, halfN * 2 - 1 - j);
        if (edge < rise) v *= edge / rise;
        const idx = i0 + j;
        if (idx >= 0 && idx + 1 < n) {
          dry[idx]     += a * v * (1 - frac);
          dry[idx + 1] += a * v * frac;
        }
      }
    }
  }

  /* THE AIR.  Arrival time IS distance/c — every sample that lands at t came
     exactly c*t metres — so the filter a block of output needs is fixed by
     the block's own reading on the clock.  Overlap-add, one FFT convolution
     per block, the filter redesigned for each block's range. */
  const FN = o.fftN;                       // convolution frame
  const taps = o.taps;
  const blk = FN - taps;                   // usable samples per frame
  const out = new Float64Array(n + FN);
  const xr = new Float64Array(FN), xi = new Float64Array(FN);
  const hr = new Float64Array(FN), hi = new Float64Array(FN);
  const nb = Math.ceil(n / blk);
  for (let b = 0; b < nb; b++) {
    const s0 = b * blk, s1 = Math.min(n, s0 + blk);
    let any = false;
    for (let i = s0; i < s1; i++) if (dry[i] !== 0) { any = true; break; }
    if (!any) continue;
    const range = Math.max(1, (s0 + s1) / 2 / sr * C_SOUND);
    const h = airFIR(range, taps, sr, o.air, FN);
    hr.fill(0); hi.fill(0);
    for (let k = 0; k < taps; k++) hr[k] = h[k];
    fft(hr, hi, false);
    xr.fill(0); xi.fill(0);
    for (let i = s0; i < s1; i++) xr[i - s0] = dry[i];
    fft(xr, xi, false);
    for (let k = 0; k < FN; k++) {
      const a = xr[k] * hr[k] - xi[k] * hi[k];
      const c2 = xr[k] * hi[k] + xi[k] * hr[k];
      xr[k] = a; xi[k] = c2;
    }
    fft(xr, xi, true);
    for (let k = 0; k < FN; k++) out[s0 + k] += xr[k];
  }
  const wet = new Float32Array(n);
  for (let i = 0; i < n; i++) wet[i] = out[i];

  let peak = 0;
  for (let i = 0; i < n; i++) { const a = Math.abs(wet[i]); if (a > peak) peak = a; }
  return { samples: wet, sr: sr, peak: peak, predicted: pred, strokes: strokes };
}

/* ── measure the rendered waveform (no geometry in here) ───────────────────── */
function measureArrivals(samples, sr, relThresh) {
  const th = (relThresh === undefined ? 3e-4 : relThresh);
  let peak = 0;
  for (let i = 0; i < samples.length; i++) { const a = Math.abs(samples[i]); if (a > peak) peak = a; }
  const cut = peak * th;
  let first = -1, last = -1;
  for (let i = 0; i < samples.length; i++) if (Math.abs(samples[i]) > cut) { first = i; break; }
  for (let i = samples.length - 1; i >= 0; i--) if (Math.abs(samples[i]) > cut) { last = i; break; }
  return { first: first / sr, last: last / sr, roll: (last - first) / sr, peak: peak };
}

/* Welch power spectrum of a stretch of samples: averaged periodograms over
   half-overlapping Hann windows, so the whole roll is weighed, not one block. */
function powerSpectrum(samples, sr, from, to, N) {
  N = N || 4096;
  const a = Math.max(0, Math.floor((from || 0) * sr));
  const b = Math.min(samples.length, Math.ceil((to === undefined ? samples.length / sr : to) * sr));
  const P = new Float64Array(N / 2);
  const re = new Float64Array(N), im = new Float64Array(N);
  const hop = N >> 1;
  let blocks = 0;
  for (let s0 = a; s0 + N <= b; s0 += hop) {
    for (let i = 0; i < N; i++) {
      const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1));
      re[i] = samples[s0 + i] * w; im[i] = 0;
    }
    fft(re, im, false);
    for (let k = 0; k < N / 2; k++) P[k] += re[k] * re[k] + im[k] * im[k];
    blocks++;
  }
  if (blocks) for (let k = 0; k < N / 2; k++) P[k] /= blocks;
  return { P: P, df: sr / N, blocks: blocks };
}

/* THIRD-OCTAVE BANDS — the acousticians' bands, and the honest way to compare
   two spectra.  A random-phase sum of a thousand pulses SPECKLES: each narrow
   bin of the rendered waveform is a Rayleigh draw around the energy the model
   predicts, so bin-by-bin the two disagree by several dB for no reason but
   luck.  Gather them into bands and the luck averages out, and what is left is
   the model. */
const BAND_CENTRES = [10, 12.5, 16, 20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160,
                      200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000,
                      2500, 3150, 4000];
const BAND_RATIO = Math.pow(2, 1 / 6);        // half a third-octave

/* band a measured Welch spectrum */
function bandsFromSpectrum(sp) {
  const out = new Float64Array(BAND_CENTRES.length);
  for (let b = 0; b < BAND_CENTRES.length; b++) {
    const lo = BAND_CENTRES[b] / BAND_RATIO, hi = BAND_CENTRES[b] * BAND_RATIO;
    let k0 = Math.max(1, Math.ceil(lo / sp.df)), k1 = Math.floor(hi / sp.df);
    let s = 0, n = 0;
    for (let k = k0; k <= k1 && k < sp.P.length; k++) { s += sp.P[k]; n++; }
    out[b] = n ? s : 0;                      // energy in the band
  }
  return out;
}
/* band the predicted continuous spectrum */
function bandsFromPredicted(pr) {
  const out = new Float64Array(BAND_CENTRES.length);
  for (let b = 0; b < BAND_CENTRES.length; b++) {
    const lo = BAND_CENTRES[b] / BAND_RATIO, hi = BAND_CENTRES[b] * BAND_RATIO;
    let s = 0;
    for (let i = 0; i < pr.f.length; i++) if (pr.f[i] >= lo && pr.f[i] < hi) s += pr.E[i] * pr.bw[i];
    out[b] = s;
  }
  return out;
}
/* centroid of a banded spectrum */
function bandCentroid(bands) {
  let num = 0, den = 0;
  for (let b = 0; b < bands.length; b++) { num += BAND_CENTRES[b] * bands[b]; den += bands[b]; }
  return den > 0 ? num / den : 0;
}
/* rms dB difference of two banded spectra, after matching their totals, over
   the bands that carry the top `dyn` dB of the predicted energy */
function bandAgreement(a, b, dyn) {
  let sa = 0, sb = 0, peak = 0;
  for (let i = 0; i < a.length; i++) { sa += a[i]; sb += b[i]; if (b[i] > peak) peak = b[i]; }
  const g = sb > 0 ? sa / sb : 1;
  const cut = peak * Math.pow(10, -(dyn === undefined ? 60 : dyn) / 10);
  let n = 0, ss = 0, worst = 0, worstF = 0;
  for (let i = 0; i < a.length; i++) {
    if (b[i] < cut || a[i] <= 0) continue;
    const d = 10 * Math.log10(a[i] / (b[i] * g));
    ss += d * d; n++;
    if (Math.abs(d) > Math.abs(worst)) { worst = d; worstF = BAND_CENTRES[i]; }
  }
  return { rmsDb: n ? Math.sqrt(ss / n) : 0, worstDb: worst, worstF: worstF, bands: n };
}

/* spectral centroid of a stretch of samples, up to fmax */
function centroid(samples, sr, from, to, fmax, N) {
  const sp = powerSpectrum(samples, sr, from, to, N || 16384);
  const top = (fmax || 8000) / sp.df;
  let num = 0, den = 0;
  for (let k = 1; k < sp.P.length && k <= top; k++) {
    const f = k * sp.df;
    num += f * sp.P[k]; den += sp.P[k];
  }
  return den > 0 ? num / den : 0;
}

/* PREDICTED centroid — computed in the frequency domain from the geometry and
   the absorption law, with no synthesised waveform anywhere in it.  This is a
   genuinely separate computation from centroid(synthesise(...)). */
function predictSpectrum(segments, listener, opt) {
  const o = Object.assign({ air: { T: T_REF, hr: 70, pa: P_REF },
                            fmin: 4, fmax: 8000, bins: 400,
                            spread: TORTUOSITY_SPREAD, nq: 5 }, opt || {});
  const d = distances(segments, listener);
  const F = new Float64Array(o.bins), E = new Float64Array(o.bins), Wd = new Float64Array(o.bins);
  const lo = Math.log(o.fmin), hi = Math.log(o.fmax);
  for (let bi = 0; bi < o.bins; bi++) {
    F[bi] = Math.exp(lo + (hi - lo) * (bi + 0.5) / o.bins);
    const a = Math.exp(lo + (hi - lo) * bi / o.bins);
    const b = Math.exp(lo + (hi - lo) * (bi + 1) / o.bins);
    Wd[bi] = b - a;
  }
  /* the same uniform spread of pulse periods the synthesis draws from,
     integrated over rather than sampled */
  const qs = [];
  for (let q = 0; q < o.nq; q++) qs.push(1 - o.spread + 2 * o.spread * (q + 0.5) / o.nq);

  for (let k = 0; k < segments.length; k++) {
    const r = d[k]; if (r < 1) continue;
    const T0 = nwavePeriod(r, segments[k].w);
    const amp = segments[k].w * segments[k].len / r;
    for (let bi = 0; bi < o.bins; bi++) {
      const f = F[bi];
      const a = Math.pow(10, -absorptionDbPerM(f, o.air.T, o.air.hr, o.air.pa) * r / 10);
      let acc = 0;
      for (let q = 0; q < qs.length; q++) {
        const T = T0 * qs[q];
        /* |N-wave spectrum|: the transform of a linear ramp +1 -> -1 of length
           T has magnitude T*(sin x / x - cos x)/x with x = pi f T */
        const x = Math.PI * f * T;
        const S = x < 1e-9 ? 0 : (Math.sin(x) / x - Math.cos(x)) / x;
        acc += S * S * T * T;
      }
      E[bi] += amp * amp * (acc / qs.length) * a;
    }
  }
  return { f: F, E: E, bw: Wd };
}

function predictCentroid(segments, listener, opt) {
  const sp = predictSpectrum(segments, listener, opt);
  let num = 0, den = 0;
  for (let i = 0; i < sp.f.length; i++) {
    const e = sp.E[i] * sp.bw[i];
    num += sp.f[i] * e; den += e;
  }
  return den > 0 ? num / den : 0;
}

export {
  C_SOUND, RC, EL_TRUNK, mulberry32,
  makeDischarge, boxDimension, subtreeCharge, buildFlash,
  absorptionDbPerM, distances, segMid, relaxRadius, nwavePeriod, strokeTrain, predict,
  arrivalProfile, envelopeOf, profileStats, profileCorrelation,
  fft, minPhaseFIR, airFIR, synthesise, measureArrivals, powerSpectrum, centroid,
  BAND_CENTRES, bandsFromSpectrum, bandsFromPredicted, bandCentroid, bandAgreement,
  predictSpectrum, predictCentroid, TORTUOSITY_SPREAD
};
