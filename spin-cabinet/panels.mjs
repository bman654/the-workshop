/* ═══════════════════════════════════════════════════════════════════════════
   THE SPIN CABINET — the six panel drivers.

   ONE SOURCE OF TRUTH, TWO CONSUMERS. Each panel is a FACTORY that takes its
   room's shipped core module as an argument:

     Node   →  makeRattlebackPanel(await import('../rattleback/core.mjs'))
     Page   →  makeRattlebackPanel(CORE.rattle)   // the same file, forge-inlined

   so panels.test.mjs drives exactly the physics the cabinet renders. No panel
   hand-rolls a fake loop: every number that decides what an object DOES comes
   out of its room's core.

   ── A NOTE ON STAGING (the maker's honesty, kept OFF the visitor's page) ────
   The cores model the FLOW — precession, inversion, the ε-channel, ω(r), the
   pin condition, the rolling constraint. None of them models SPIN BLEED: a
   real object on a real shelf coasts down because of bearing drag and contact
   friction, and no core here carries that term. So each panel adds ONE staging
   constant of my own — a coast-down rate — plus a TIMESCALE that maps physics
   seconds onto wall seconds so a payoff that takes 0.3 s or 12 s in the room
   plays out at the pace of a glance in a niche. Those constants are MINE, not
   the rooms'. Everything else — the parameters, the step size, the integrator,
   the predicates — is lifted from the room's own source and named where it is
   borrowed. PANEL TIME IS NOT ROOM TIME. Read the physics in the room; read
   the character here.

   ── WHAT A PANEL IS ────────────────────────────────────────────────────────
     { id, label, href, hint, character, room, wantsHold,
       st,                       // the live state (the twin diffs this)
       poke(kind, dx, dy, down), // 'flick' | 'down' | 'up' — the REAL entry point
       step(dt),                 // advance by dt wall-seconds
       alive(),                  // is this niche awake? (drives the lamp)
       settle(),                 // a posed, motionless still frame (reduced motion)
       payoff(),                 // has this panel done its trick? (the liveness gate)
       draw(g, w, h) }           // canvas only — never touched in Node
   ═══════════════════════════════════════════════════════════════════════════ */

const TAU = Math.PI * 2;

/* ═══ SHARED STAGE GEOMETRY ═══════════════════════════════════════════════════
   An oblique projection: world (x, y, z) → stage pixels, y running back INTO
   the niche, z up. One unit ≈ one stage radius. Depth is purely VERTICAL (no
   x-shear) so a horizontal circle projects to a horizontal ellipse of exactly
   the plinth's own 0.34 squash — the objects and the turned stage they stand on
   are then drawn in the same perspective, which a shear quietly breaks. */
export const DEPTH = 0.34;
export const proj = (x, y, z, s) => [x * s, (-z + y * DEPTH) * s];

/* The stage the object stands on. Returns the stage centre + the world scale S.
   S is sized off BOTH axes so each object FILLS its niche instead of floating in
   a brown field (the prototype's ~25%-of-niche problem). */
export function stage(g, w, h) {
  const cx = w / 2, fy = h * 0.775;
  const S = Math.min(w * 0.415, h * 0.475);
  // the niche's back wall, warm at the top where the lamp hits it
  g.save();
  g.globalAlpha = 0.55;
  const back = g.createLinearGradient(0, 0, 0, h);
  back.addColorStop(0, 'rgba(96,64,36,.55)'); back.addColorStop(1, 'rgba(20,11,5,0)');
  g.fillStyle = back; g.fillRect(0, 0, w, h);
  g.restore();
  // the turned plinth
  g.save();
  g.translate(cx, fy); g.scale(1, 0.34);
  const r = S * 1.02;
  const gr = g.createRadialGradient(0, -r * 0.2, r * 0.1, 0, 0, r);
  gr.addColorStop(0, '#6b4c2c'); gr.addColorStop(0.7, '#412a17'); gr.addColorStop(1, '#241509');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,214,160,.22)'; g.lineWidth = 1.2; g.stroke();
  g.restore();
  return { cx, fy, s: S };
}

/* THE SHADOW IS THE INSTRUMENT — the object's own points, flattened to the
   stage floor. Nothing here is invented: the caller passes the SAME world points
   it drew, so the shadow rocks when the stone rocks and swings when the axle
   precesses. */
export function shadow(g, cx, fy, s, pts, alpha = 0.5) {
  if (!pts.length) return;
  g.save(); g.translate(cx, fy); g.scale(1, 0.34);
  g.fillStyle = `rgba(0,0,0,${alpha})`; g.filter = 'blur(2.5px)';
  g.beginPath();
  pts.forEach(([x, y], i) => {
    const px = x * s, py = y * s;
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  });
  g.closePath(); g.fill(); g.filter = 'none'; g.restore();
}

/* the niche lamp's falloff, painted OVER the object so it sits IN the light */
export function lampShade(g, w, h) {
  const gr = g.createRadialGradient(w / 2, -h * 0.08, h * 0.1, w / 2, h * 0.1, h * 1.1);
  gr.addColorStop(0, 'rgba(255,206,142,.16)'); gr.addColorStop(1, 'rgba(0,0,0,.34)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}

/* ═══ 1. THE TOP ══════════════════════════════════════════════════════════════
   Core: ../the-top/core.mjs. Borrowed verbatim: I, M, G, R, OMEGA0 and the axle
   basis (axleHat/cross/mag) — the room's own wheel. The precession heading comes
   from precessRate() (Ω = mgr/Iω, the room's law); the fall comes from topples()
   (the room's own neg-control flag), never from a timer.
   STAGING (mine): BLEED — how fast the pin's bearing drags the spin down. */
export function makeTopPanel(TOP) {
  const BLEED = 0.55;              // s⁻¹, MINE: the bearing's drag, not in the core
  const WCRIT = Math.sqrt((TOP.M * TOP.G * TOP.R) / TOP.I);   // the room's topple crossover
  return {
    id: 'the-top', label: 'The Top', href: '../the-top/index.html',
    room: '../the-top/core.mjs',
    hint: 'flick to spin it',
    character: 'a wheel hung sideways from one point: spinning, it will not fall — it walks the fall around in a circle',
    st: { om: 0, phi: 0.95, theta: Math.PI / 2, sag: 0, dir: 1, fell: false, maxSag: 0 },
    poke(kind, dx = 0) {
      if (kind !== 'flick') return;
      const s = this.st;
      s.om = TOP.OMEGA0; s.theta = Math.PI / 2; s.sag = 0; s.fell = false; s.maxSag = 0;
      // start the axle where the wheel presents its face; a precessing wheel then
      // breathes honestly between a full circle and edge-on as φ sweeps.
      s.phi = 0.95;
      s.dir = dx < 0 ? -1 : 1;
    },
    step(dt) {
      const s = this.st;
      if (s.om <= 0) return;
      s.om *= Math.exp(-dt * BLEED);
      if (TOP.topples(TOP.I, s.om)) {          // ← the room's own neg-control predicate
        s.sag = Math.min(1, s.sag + dt * 0.9);
        s.maxSag = Math.max(s.maxSag, s.sag);
        // the axle sags from horizontal toward the pin, with a dying nutation wobble
        s.theta = Math.PI / 2 - s.sag * (Math.PI / 2 - 0.22) + Math.sin(s.sag * 22) * 0.06 * (1 - s.sag);
        if (s.sag >= 1) { s.om = 0; s.fell = true; }
      } else {
        const Om = TOP.precessRate(TOP.M, TOP.G, TOP.R, TOP.I, s.om);   // ← Ω = mgr/Iω
        s.phi += s.dir * Om * dt;
      }
    },
    alive() { return this.st.om > 0; },
    // a posed still frame: the wheel out on its axle, horizontal, spokes crisp
    // (ω = 0 makes step() inert, so nothing drifts under prefers-reduced-motion)
    settle() { const s = this.st; s.om = 0; s.theta = Math.PI / 2; s.phi = 0.95; s.sag = 0; s.fell = false; s.dir = 1; },
    // THE PAYOFF: the spin decayed past the room's own critical spin, the axle
    // tilted away from horizontal, and it finally fell.
    payoff() { return this.st.fell && this.st.maxSag > 0.5; },
    wcrit: WCRIT,
    draw(g, w, h) {
      const s = this.st; const { cx, fy, s: S } = stage(g, w, h);
      const n = TOP.axleHat(s.theta, s.phi);           // ← the room's axle unit vector
      const L = 0.80, PIN = 0.62;
      const hub = [n[0] * L, n[1] * L, n[2] * L + PIN];
      const [px, py] = proj(0, 0, 0, S), [sx, sy] = proj(0, 0, PIN, S);
      const [hx, hy] = proj(hub[0], hub[1], hub[2], S);
      // an orthonormal basis in the plane ⊥ n̂, built with the core's own vector ops
      const up = Math.abs(n[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1];
      let e1 = TOP.cross(n, up); const m1 = TOP.mag(e1); e1 = e1.map((v) => v / m1);
      const e2 = TOP.cross(n, e1);
      const R = 0.56, rim = [], flat = [];
      for (let i = 0; i <= 48; i++) {
        const a = i / 48 * TAU, c = Math.cos(a), sn = Math.sin(a);
        const wx = hub[0] + R * (c * e1[0] + sn * e2[0]);
        const wy = hub[1] + R * (c * e1[1] + sn * e2[1]);
        const wz = hub[2] + R * (c * e1[2] + sn * e2[2]);
        rim.push(proj(wx, wy, wz, S)); flat.push([wx, wy]);
      }
      shadow(g, cx, fy, S, flat, 0.42);                // ← the rim's true flattened shadow
      g.save(); g.translate(cx, fy);
      // the stand
      g.strokeStyle = 'rgba(210,170,110,.8)'; g.lineWidth = 2.8; g.lineCap = 'round';
      g.beginPath(); g.moveTo(px, py); g.lineTo(sx, sy); g.stroke();
      // the axle
      g.strokeStyle = 'rgba(232,198,140,.92)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(sx, sy); g.lineTo(hx, hy); g.stroke();
      // the rim
      g.beginPath(); rim.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.closePath();
      const rg = g.createLinearGradient(hx - S * 0.6, hy - S * 0.6, hx + S * 0.6, hy + S * 0.6);
      rg.addColorStop(0, 'rgba(255,226,178,.95)'); rg.addColorStop(1, 'rgba(158,116,64,.85)');
      g.strokeStyle = rg; g.lineWidth = 4; g.stroke();
      // the spokes blur into a disc as ω rises — the honest "it is spinning" cue
      const blur = Math.min(1, s.om / 60), spokes = 6;
      g.globalAlpha = 0.55 * (1 - blur * 0.75);
      for (let k = 0; k < spokes; k++) {
        const a = k / spokes * TAU + s.om * 0.02;
        const c = Math.cos(a), sn = Math.sin(a);
        const [ax, ay] = proj(hub[0] + R * (c * e1[0] + sn * e2[0]),
                              hub[1] + R * (c * e1[1] + sn * e2[1]),
                              hub[2] + R * (c * e1[2] + sn * e2[2]), S);
        g.strokeStyle = 'rgba(255,220,170,.8)'; g.lineWidth = 1.1;
        g.beginPath(); g.moveTo(hx, hy); g.lineTo(ax, ay); g.stroke();
      }
      g.globalAlpha = 1;
      g.restore(); lampShade(g, w, h);
    },
  };
}

/* ═══ 2. THE TIPPE-TOP ════════════════════════════════════════════════════════
   Core: ../tippe-top/core.mjs. Borrowed verbatim: defaults() (the room's own R,
   a, M, C, A, μ), H_SIM as the step, omegaCrit() as the bifurcation, and
   integrate() on the reduced flow [θ, P, φ]. A HARD flick clears ω_crit and the
   thing walks up onto its stem; a soft one never does — same gesture, two fates.
   STAGING (mine): TSCALE — the room's flip takes ~0.3–0.7 physics-seconds; a
   niche wants it slow enough to WATCH. */
export function makeTippeTopPanel(TT) {
  const TSCALE = 0.34;             // physics-seconds per wall-second — MINE
  const MAXSUB = 40;               // substep cap per frame (perf)
  return {
    id: 'tippe-top', label: 'Tippe-Top', href: '../tippe-top/index.html',
    room: '../tippe-top/core.mjs',
    hint: 'flick — hard, or soft',
    character: 'flick it hard enough and it climbs up onto its own stem and spins there, upside down',
    st: { v: null, p: null, spin: 0, live: false, t: 0, n0: 0, theta0: 0, maxTheta: 0, flipped: false },
    poke(kind, dx = 0, dy = 0) {
      if (kind !== 'flick') return;
      const p = TT.defaults();
      const mag = Math.min(1, (Math.abs(dx) + Math.abs(dy)) / 70);
      const n0 = TT.omegaCrit(p) * (0.55 + 1.75 * mag);   // ← the room's bifurcation
      const s = this.st;
      s.p = p; s.v = TT.startState(0.05, n0, p);          // ← the room's start state
      s.live = true; s.t = 0; s.n0 = n0; s.theta0 = 0.05; s.maxTheta = 0.05; s.flipped = false;
    },
    step(dt) {
      const s = this.st;
      if (!s.live) return;
      s.t += dt;
      const want = Math.round(dt * TSCALE / TT.H_SIM);
      s.v = TT.integrate(s.v, TT.H_SIM, Math.min(MAXSUB, Math.max(1, want)), s.p);  // ← the real flow
      s.spin += TT.nFromP(s.v[0], s.v[1], s.p) * dt * 0.05;
      if (s.v[0] > s.maxTheta) s.maxTheta = s.v[0];
      if (s.v[0] > Math.PI / 2) s.flipped = true;
      if (s.t > 16) s.live = false;
    },
    alive() { return this.st.live; },
    settle() { const p = TT.defaults(); this.st.p = p; this.st.v = [2.55, TT.startState(2.55, 40, p)[1], 0.7]; this.st.live = false; },
    // THE PAYOFF: θ crossed π/2 — the stem came up. That is the inversion.
    payoff() { return this.st.flipped; },
    draw(g, w, h) {
      const { cx, fy, s: S } = stage(g, w, h); const s = this.st;
      const th = s.v ? s.v[0] : 0.05, phi = s.v ? s.v[2] : 0;
      const Rr = 0.58, stemL = 0.72;
      const ax = [Math.sin(th) * Math.cos(phi), Math.sin(th) * Math.sin(phi), Math.cos(th)];
      // the body RIDES on whatever is lowest — the sphere while it is upright, the
      // STEM TIP once it has walked over. That lift is the whole point of the trick:
      // an inverted tippe-top stands taller than it started, which is why the room's
      // energy ledger has the CoM rising. Placing it by its own lowest point makes
      // the rise happen for free, and keeps the stem out of the plinth.
      const tipZ = ax[2] * (Rr + stemL);
      const cz = -Math.min(-Rr, tipZ);
      const flat = [];
      for (let i = 0; i <= 32; i++) { const a = i / 32 * TAU; flat.push([Math.cos(a) * Rr * 0.95, Math.sin(a) * Rr * 0.95]); }
      shadow(g, cx, fy, S, flat, 0.45);
      g.save(); g.translate(cx, fy);
      const [bx, by] = proj(0, 0, cz, S);
      const bg = g.createRadialGradient(bx - S * 0.20, by - S * 0.25, S * 0.05, bx, by, S * Rr * 1.05);
      bg.addColorStop(0, '#ffe3b4'); bg.addColorStop(0.55, '#c98f47'); bg.addColorStop(1, '#4d2f12');
      g.fillStyle = bg; g.beginPath(); g.arc(bx, by, S * Rr, 0, TAU); g.fill();
      // painted meridians, so the axial spin is visible on a featureless sphere
      g.save(); g.beginPath(); g.arc(bx, by, S * Rr, 0, TAU); g.clip();
      g.strokeStyle = 'rgba(60,32,10,.55)'; g.lineWidth = 2.4;
      for (let k = 0; k < 3; k++) {
        const a = s.spin + k * TAU / 3, e = Math.cos(a);
        g.beginPath(); g.ellipse(bx, by, Math.abs(e) * S * Rr, S * Rr, 0, 0, TAU); g.stroke();
      }
      g.restore();
      // the stem
      const [ex, ey] = proj(ax[0] * (Rr + stemL), ax[1] * (Rr + stemL), cz + ax[2] * (Rr + stemL), S);
      g.strokeStyle = 'rgba(245,216,168,.95)'; g.lineWidth = 4.4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(bx, by); g.lineTo(ex, ey); g.stroke();
      g.fillStyle = 'rgba(255,232,190,.95)'; g.beginPath(); g.arc(ex, ey, 3.2, 0, TAU); g.fill();
      g.restore(); lampShade(g, w, h);
    },
  };
}

/* ═══ 3. THE RATTLEBACK ═══════════════════════════════════════════════════════
   Core: ../rattleback/core.mjs. Parameters and step size borrowed from the room
   itself (rattleback/index.src.html:211,216) — { eps: epsOfSkewDeg(δ), wp:1.0,
   wq:1.7, mu:0.05 } at H_DT = 1/240 — because invented stiffness or damping
   damps the rock out before the ε-channel can drive n through zero, and the
   refusal never happens. A panel that borrows a core borrows its constants.
   The panel opens δ to 20° (the room's dial runs continuously; 20° reverses
   briskly enough for a niche). STAGING (mine): TSCALE, the physics-seconds per
   wall-second, so the reversal plays out in about three. */
export function makeRattlebackPanel(RB) {
  const SKEW_DEG = 20;                  // the visible mass-axis skew δ (room dial: continuous)
  const H_DT = 1 / 240;                 // ← the ROOM's physics sub-dt (index.src.html:216)
  const TSCALE = 5.5;                   // physics-seconds per wall-second — MINE
  const MAXSUB = 60;
  const P = { eps: RB.epsOfSkewDeg(SKEW_DEG), wp: 1.0, wq: 1.7, mu: 0.05 };  // ← the ROOM's params
  const FAV = RB.favoredSign(P.eps);    // ← the room's own favored-sign law
  return {
    id: 'rattleback', label: 'Rattleback', href: '../rattleback/index.html',
    room: '../rattleback/core.mjs',
    hint: 'flick it either way',
    character: 'spin it the wrong way and the stone argues: it rattles, stops, and comes back around the other way',
    fav: FAV,
    st: { v: null, ang: 0, live: false, t: 0, launch: 0, reversed: false },
    poke(kind, dx = 0) {
      if (kind !== 'flick') return;
      const sign = dx < 0 ? -1 : 1;
      const s = this.st;
      s.v = [sign * 1.0, 0, 0, 0.06, 0.005];      // ← the room's launch shape (index.src.html:471)
      s.live = true; s.t = 0; s.ang = 0; s.launch = sign; s.reversed = false;
    },
    step(dt) {
      const s = this.st;
      if (!s.live) return;
      s.t += dt;
      const want = Math.round(dt * TSCALE / H_DT);
      const N = Math.min(MAXSUB, Math.max(1, want));
      for (let i = 0; i < N; i++) s.v = RB.rk4Step(s.v, H_DT, P);       // ← the real RK4
      s.ang += s.v[0] * dt * 2.2;
      if (!s.reversed && s.launch !== 0 && Math.sign(s.v[0]) === -s.launch && Math.abs(s.v[0]) > 0.04) {
        s.reversed = true;                                              // emergent, never timed
      }
      if (s.t > 22) s.live = false;
    },
    alive() { return this.st.live; },
    settle() { const s = this.st; s.v = [0.9, 0, 0, 0.02, 0.004]; s.ang = 0.7; s.live = false; s.launch = 1; },
    // THE PAYOFF: launched at the DISFAVORED sign, the spin crossed zero on its
    // own and settled at the favored one. Nobody animated the refusal.
    payoff() { const s = this.st; return s.launch === -FAV && s.reversed && Math.sign(s.v[0]) === FAV; },
    draw(g, w, h) {
      const { cx, fy, s: S } = stage(g, w, h); const s = this.st;
      const v = s.v || [0, 0, 0, 0, 0];
      const sA = v[3], sB = v[4];
      const a = s.ang, ca = Math.cos(a), sa = Math.sin(a);
      const zAt = (rx, ry) => rx * sA * 0.62 + ry * sB * 0.62;   // ← the ROCK is the state
      const hull = [], keel = [], flat = [];
      for (let i = 0; i <= 44; i++) {
        const t = i / 44 * TAU;
        const x = Math.cos(t) * 1.06, y = Math.sin(t) * 0.38;
        const rx = x * ca - y * sa, ry = x * sa + y * ca;
        hull.push(proj(rx, ry, 0.34 + zAt(rx, ry), S)); flat.push([rx, ry]);
      }
      for (let i = 0; i <= 44; i++) {
        const t = i / 44 * TAU;
        const x = Math.cos(t) * 0.98, y = Math.sin(t) * 0.34;
        const rx = x * ca - y * sa, ry = x * sa + y * ca;
        keel.push(proj(rx, ry, 0.11 + zAt(rx, ry) * 1.25, S));
      }
      shadow(g, cx, fy, S, flat, 0.46);            // the shadow rocks — the tell
      g.save(); g.translate(cx, fy);
      g.beginPath(); keel.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
      g.fillStyle = 'rgba(38,22,9,.95)'; g.fill();
      g.beginPath(); hull.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
      const hg = g.createLinearGradient(-S, -S * 0.4, S, S * 0.4);
      hg.addColorStop(0, '#ffe0ab'); hg.addColorStop(0.5, '#b8823c'); hg.addColorStop(1, '#3d2410');
      g.fillStyle = hg; g.fill();
      g.strokeStyle = 'rgba(255,232,190,.55)'; g.lineWidth = 1.3; g.stroke();
      // the skewed mass axis — the whole secret, drawn at the honest angle δ
      const d = SKEW_DEG * Math.PI / 180;
      const kx = Math.cos(a + d) * 0.9, ky = Math.sin(a + d) * 0.9;
      const p1 = proj(kx, ky, 0.37, S), p2 = proj(-kx, -ky, 0.37, S);
      g.strokeStyle = 'rgba(60,32,10,.55)'; g.lineWidth = 1.8; g.setLineDash([4, 3]);
      g.beginPath(); g.moveTo(p1[0], p1[1]); g.lineTo(p2[0], p2[1]); g.stroke(); g.setLineDash([]);
      g.restore(); lampShade(g, w, h);
    },
  };
}

/* ═══ 4. THE SPINNING CHAIR ═══════════════════════════════════════════════════
   Core: ../spinning-chair/core.mjs. ω is NEVER a free knob here: the arms' radius
   r is the only thing the visitor moves, and omegaAt(r) = L₀/I(r) FORCES the
   spin. Press and hold to pull them in; she speeds up because she must.
   STAGING (mine): PULL (how fast the arms travel) and BLEED (the stool's
   bearing). Conservation is the core's; friction is the shelf's. */
export function makeChairPanel(CH) {
  const PULL = 3.2;                // arm-travel rate, s⁻¹ — MINE
  const BLEED = 0.030;             // stool drag, s⁻¹ — MINE
  return {
    id: 'spinning-chair', label: 'The Chair', href: '../spinning-chair/index.html',
    room: '../spinning-chair/core.mjs',
    hint: 'flick, then press &amp; hold',
    character: 'she pulls her arms in and speeds up — nothing pushed her; the spin had nowhere else to go',
    wantsHold: true,
    st: { r: CH.A, pulling: false, ang: 0, spun: false, decay: 1, omMin: Infinity, omMax: 0 },
    poke(kind) {
      const s = this.st;
      if (kind === 'down') { s.pulling = true; if (!s.spun) { s.spun = true; s.decay = 1; s.omMin = Infinity; s.omMax = 0; } }
      else if (kind === 'up') { s.pulling = false; }
      else if (kind === 'flick') { if (!s.spun) { s.spun = true; s.decay = 1; s.omMin = Infinity; s.omMax = 0; } }
    },
    step(dt) {
      const s = this.st;
      if (!s.spun) return;
      const tgt = s.pulling ? CH.B : CH.A;                     // ← the room's own two radii
      s.r += (tgt - s.r) * Math.min(1, dt * PULL);
      s.decay = Math.max(0, s.decay - dt * BLEED);
      const om = CH.omegaAt(s.r);                              // ← ω(r) = L₀/I(r), FORCED
      s.omMin = Math.min(s.omMin, om); s.omMax = Math.max(s.omMax, om);
      s.ang += om * dt * s.decay;
      if (s.decay <= 0) s.spun = false;
    },
    alive() { return this.st.spun; },
    settle() { const s = this.st; s.spun = false; s.r = CH.A * 0.62; s.ang = 0.5; },
    // THE PAYOFF: pulling the arms in raised ω, by the core's own law — the fast
    // reading is at least 2× the slow one (I(A)/I(B) ≈ 4.3 for the room's numbers).
    payoff() { return this.st.omMax >= this.st.omMin * 2; },
    draw(g, w, h) {
      const { cx, fy, s: S } = stage(g, w, h); const s = this.st;
      const a = s.ang, r = s.r / CH.A * 1.02;                  // arms, in stage units
      shadow(g, cx, fy, S, [
        [Math.cos(a) * r, Math.sin(a) * r], [Math.cos(a + 2.6) * 0.36, Math.sin(a + 2.6) * 0.36],
        [-Math.cos(a) * r, -Math.sin(a) * r], [Math.cos(a - 2.6) * 0.36, Math.sin(a - 2.6) * 0.36],
      ], 0.44);
      g.save(); g.translate(cx, fy);
      // the stool
      const [stx, sty] = proj(0, 0, 0.12, S);
      g.fillStyle = 'rgba(70,46,24,.9)';
      g.save(); g.translate(stx, sty); g.scale(1, 0.34);
      g.beginPath(); g.arc(0, 0, S * 0.40, 0, TAU); g.fill(); g.restore();
      // the body
      const [bx, by] = proj(0, 0, 0.84, S);
      const bg = g.createLinearGradient(bx, by - S * 0.46, bx, by + S * 0.24);
      bg.addColorStop(0, '#ffdca8'); bg.addColorStop(1, '#8a5f2e');
      g.fillStyle = bg; g.beginPath(); g.ellipse(bx, by, S * 0.23, S * 0.37, 0, 0, TAU); g.fill();
      // the head
      const [hdx, hdy] = proj(0, 0, 1.30, S);
      g.fillStyle = '#ffe9c4'; g.beginPath(); g.arc(hdx, hdy, S * 0.14, 0, TAU); g.fill();
      // the two arms + hand weights — the VISIBLE r
      for (const sgn of [1, -1]) {
        const [hx2, hy2] = proj(Math.cos(a) * r * sgn, Math.sin(a) * r * sgn, 0.84, S);
        g.strokeStyle = 'rgba(250,222,178,.9)'; g.lineWidth = 3.4; g.lineCap = 'round';
        g.beginPath(); g.moveTo(bx, by); g.lineTo(hx2, hy2); g.stroke();
        g.fillStyle = '#e8c079'; g.beginPath(); g.arc(hx2, hy2, S * 0.10, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(80,50,20,.7)'; g.lineWidth = 1; g.stroke();
      }
      g.restore(); lampShade(g, w, h);
    },
  };
}

/* ═══ 5. THE ROTOR ════════════════════════════════════════════════════════════
   Core: ../rotor/core.mjs. riderState(m, ω, t) decides, every frame, whether the
   wall still holds her; omegaC() is where it stops. Restaged from the prototype:
   the drum is CUT AWAY at the front so the eye is INSIDE it — two stacked
   ellipses seen from outside never read as a wall-of-death.
   STAGING (mine): SPIN0 and BLEED — how fast the drum is wound up and how fast
   the motor gives up. The pin condition is the core's. */
export function makeRotorPanel(RO) {
  const SPIN0 = 7.4;               // rad/s the flick winds the drum to — MINE
  const BLEED = 1.05;              // rad/s², the motor letting go — MINE
  const MASS = 70;                 // kg. drop01 is mass-FREE; this only sets N.
  const WC = RO.omegaC();          // ← the room's threshold spin
  return {
    id: 'rotor', label: 'The Rotor', href: '../rotor/index.html',
    room: '../rotor/core.mjs',
    hint: 'flick to wind the drum',
    character: 'the floor drops away and she stays up — until the drum slows past its threshold, and friction runs out',
    wc: WC,
    st: { om: 0, ang: -Math.PI / 2, tSlip: 0, drop: 0, live: false, slipped: false, heldAbove: false },
    poke(kind) {
      if (kind !== 'flick') return;
      const s = this.st;
      s.om = SPIN0; s.tSlip = 0; s.drop = 0; s.live = true; s.slipped = false; s.heldAbove = false;
      s.ang = -Math.PI / 2;                 // start her against the BACK wall, in full view
    },
    step(dt) {
      const s = this.st;
      if (!s.live) return;
      s.om = Math.max(0, s.om - dt * BLEED);
      s.ang += s.om * dt;
      const rs = RO.riderState(MASS, s.om, s.tSlip);       // ← the room's own fate
      if (rs.pinned) { s.heldAbove = true; s.tSlip = 0; s.drop = Math.max(0, s.drop - dt * 0.25); }
      else { s.tSlip += dt; s.drop = rs.drop01; if (s.drop > 0) s.slipped = true; }
      if (s.om <= 0 && s.drop >= 1) s.live = false;
    },
    alive() { return this.st.live && (this.st.om > 0.05 || this.st.drop < 1); },
    settle() { const s = this.st; s.om = 0; s.ang = -Math.PI / 2 + 0.35; s.drop = 0; s.live = false; },
    // THE PAYOFF: she was PINNED while ω was above the room's ω_c, and began to
    // sink only after the drum fell below it. The threshold did the deciding.
    payoff() { const s = this.st; return s.heldAbove && s.slipped && s.om < WC; },
    draw(g, w, h) {
      const { cx, fy, s: S } = stage(g, w, h); const s = this.st;
      // a TALL, narrow barrel — a wide shallow tub reads as two stacked ellipses,
      // which is exactly the thing that did not land in the prototype.
      const R = 0.70, TOPZ = 1.52, FLOOR = 0.06;
      g.save(); g.translate(cx, fy);
      // ── THE CUTAWAY DRUM. We keep only the FAR half of the wall (the arc the
      //    eye looks at, y ≥ 0 in world terms) plus two cut stubs at the sides;
      //    the near wall is sawn off, so you are looking INTO the barrel. ──
      const arc = (z, from, to, n = 40) => {
        const pts = [];
        for (let i = 0; i <= n; i++) { const t = from + (to - from) * i / n; pts.push(proj(Math.cos(t) * R, Math.sin(t) * R, z, S)); }
        return pts;
      };
      // the FAR half is y < 0 (the projection sends +y toward the viewer, down-left),
      // so we keep t ∈ (π, 2π) and saw the near half away at t = 0 and t = π.
      const farTop = arc(TOPZ, Math.PI, TAU), farBot = arc(FLOOR, Math.PI, TAU);
      g.beginPath();
      farTop.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      for (let i = farBot.length - 1; i >= 0; i--) g.lineTo(farBot[i][0], farBot[i][1]);
      g.closePath();
      const wall = g.createLinearGradient(0, -S * TOPZ, 0, S * 0.4);
      wall.addColorStop(0, 'rgba(158,108,56,1)'); wall.addColorStop(0.55, 'rgba(96,61,29,1)');
      wall.addColorStop(1, 'rgba(40,22,9,1)');
      g.fillStyle = wall; g.fill();
      // vertical staves, so the drum's SPIN is legible on a plain wall
      g.save(); g.beginPath();
      farTop.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      for (let i = farBot.length - 1; i >= 0; i--) g.lineTo(farBot[i][0], farBot[i][1]);
      g.closePath(); g.clip();
      for (let k = 0; k < 16; k++) {
        const t = s.ang + k * TAU / 16;
        const [x0, y0] = proj(Math.cos(t) * R, Math.sin(t) * R, TOPZ, S);
        const [x1, y1] = proj(Math.cos(t) * R, Math.sin(t) * R, FLOOR, S);
        g.strokeStyle = 'rgba(255,206,142,.20)'; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      }
      g.restore();
      // the sawn edges: two bright cut faces where the near wall was taken away
      for (const t of [0, Math.PI]) {
        const [ax, ay] = proj(Math.cos(t) * R, Math.sin(t) * R, TOPZ, S);
        const [bx, by] = proj(Math.cos(t) * R, Math.sin(t) * R, FLOOR, S);
        g.strokeStyle = 'rgba(255,222,175,.55)'; g.lineWidth = 2.4;
        g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
      }
      // the rim, bright on the far arc and ghosted where the wall is gone
      const rim = (z, alpha, lw, dash) => {
        g.setLineDash(dash || []);
        g.beginPath();
        for (let i = 0; i <= 56; i++) { const t = i / 56 * TAU; const [x, y] = proj(Math.cos(t) * R, Math.sin(t) * R, z, S); i ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.closePath(); g.strokeStyle = `rgba(228,190,138,${alpha})`; g.lineWidth = lw; g.stroke();
        g.setLineDash([]);
      };
      rim(TOPZ, 0.85, 2.4);
      rim(FLOOR, 0.30, 1.4, [4, 5]);          // the floor that has dropped away
      // ── the rider, pinned to the FAR wall, sinking by the core's own drop01 ──
      const t = ((s.ang % TAU) + TAU) % TAU;
      // she rides the wall all the way round; with the near half sawn off she is
      // never hidden — she just comes CLOSER (bigger, brighter) on the near swing
      // and recedes against the far wall on the back swing.
      const near = (Math.sin(t) + 1) / 2;     // 0 = far wall, 1 = right at the cut
      const rz = 0.72 - s.drop * 0.62;
      const [rx, ry] = proj(Math.cos(t) * R * 0.97, Math.sin(t) * R * 0.97, rz, S);
      const dep = 0.82 + 0.34 * near;
      const bodyH = S * 0.22 * dep, bodyW = S * 0.105 * dep;
      // her shadow ON THE WALL — the cabinet's instrument, here cast sideways.
      // It rides down with her, so the sink is legible even at a glance.
      g.globalAlpha = 0.42;
      g.fillStyle = '#000';
      g.save(); g.filter = 'blur(3px)';
      g.beginPath(); g.ellipse(rx + bodyW * 1.1, ry + bodyH * 0.18, bodyW * 1.25, bodyH * 1.05, 0, 0, TAU); g.fill();
      g.restore();
      g.globalAlpha = 0.62 + 0.38 * near;
      g.fillStyle = '#ffd79a'; g.beginPath(); g.ellipse(rx, ry, bodyW, bodyH, 0, 0, TAU); g.fill();
      g.fillStyle = '#ffeccb'; g.beginPath(); g.arc(rx, ry - bodyH * 1.15, S * 0.075 * dep, 0, TAU); g.fill();
      // arms flung out against the wall
      g.strokeStyle = 'rgba(255,215,154,.9)'; g.lineWidth = 2.6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(rx - bodyW * 2.2, ry - bodyH * 0.5); g.lineTo(rx + bodyW * 2.2, ry - bodyH * 0.5); g.stroke();
      g.globalAlpha = 1;
      g.restore(); lampShade(g, w, h);
    },
  };
}

/* ═══ 6. THE TUSI COUPLE ══════════════════════════════════════════════════════
   Core: ../tusi/core.mjs — lifted out of tusi/index.html in this same cycle so
   the room and this niche share ONE geometry. pen(R, r, 1, t, true) at R = 2r
   puts the marked point on a dead-straight diameter; wheelCentre() places the
   rolling disk. Nothing here is eased or faked: the dot's position IS pen().
   STAGING (mine): BLEED — the coast-down of a rolled wheel. */
export function makeTusiPanel(TU) {
  const BLEED = 0.10;              // s⁻¹ — MINE
  const RING = 0.96, WHEEL = 0.48; // R = 2r exactly: the couple's own condition
  return {
    id: 'tusi', label: 'Tusi Couple', href: '../tusi/index.html',
    room: '../tusi/core.mjs',
    hint: 'flick to roll it',
    character: 'a wheel rolling inside a wheel twice its size — and one point of it runs dead straight',
    R: RING, r: WHEEL,
    st: { th: 0, om: 0, maxPerp: 0, span: 0, rolled: 0 },
    poke(kind, dx = 0) {
      if (kind !== 'flick') return;
      const s = this.st;
      s.om = (dx < 0 ? -1 : 1) * 2.7; s.maxPerp = 0; s.span = 0; s.rolled = 0;
    },
    step(dt) {
      const s = this.st;
      if (!s.om) return;
      const th0 = s.th;
      s.th += s.om * dt;
      s.rolled += Math.abs(s.th - th0);
      const p = TU.pen(RING, WHEEL, 1, s.th, true);          // ← the room's own pen()
      s.maxPerp = Math.max(s.maxPerp, Math.abs(p.y));        // the rail it never leaves
      s.span = Math.max(s.span, Math.abs(p.x));
      s.om *= Math.exp(-dt * BLEED);
      if (Math.abs(s.om) < 0.02) s.om = 0;
    },
    alive() { return Math.abs(this.st.om) > 0.02; },
    settle() { const s = this.st; s.om = 0; s.th = 0.9; },
    // THE PAYOFF: after rolling a full lap the marked point has swept most of the
    // diameter and NEVER left it — straightness out of nothing but rolling.
    payoff() { const s = this.st; return s.rolled > TAU * 0.9 && s.span > RING * 0.9 && s.maxPerp < 1e-9; },
    draw(g, w, h) {
      const { cx, fy, s: S } = stage(g, w, h); const s = this.st; const th = s.th;
      const c = TU.wheelCentre(RING, WHEEL, th, true);       // ← the room's own centre
      const p = TU.pen(RING, WHEEL, 1, th, true);            // ← the room's own pen
      const flat = [];
      for (let i = 0; i <= 28; i++) { const t = i / 28 * TAU; flat.push([c.x + Math.cos(t) * WHEEL, c.y + Math.sin(t) * WHEEL]); }
      shadow(g, cx, fy, S, flat, 0.34);
      g.save(); g.translate(cx, fy);
      const LIFT = 0.18;
      const ring = (pts, st, lw, dash) => {
        g.setLineDash(dash || []); g.beginPath();
        pts.forEach(([x, y], i) => { const [a, b] = proj(x, y, LIFT, S); i ? g.lineTo(a, b) : g.moveTo(a, b); });
        g.closePath(); g.strokeStyle = st; g.lineWidth = lw; g.stroke(); g.setLineDash([]);
      };
      const big = [], small = [];
      for (let i = 0; i <= 72; i++) { const t = i / 72 * TAU; big.push([Math.cos(t) * RING, Math.sin(t) * RING]); }
      for (let i = 0; i <= 56; i++) { const t = i / 56 * TAU; small.push([c.x + Math.cos(t) * WHEEL, c.y + Math.sin(t) * WHEEL]); }
      ring(big, 'rgba(212,172,116,.55)', 2);
      ring(small, 'rgba(255,226,178,.92)', 2.4);
      // the disk's own spoke, so the rolling (not sliding) is visible
      const [scx, scy] = proj(c.x, c.y, LIFT, S);
      const [mpx, mpy] = proj(p.x, p.y, LIFT, S);
      g.strokeStyle = 'rgba(255,226,178,.5)'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(scx, scy); g.lineTo(mpx, mpy); g.stroke();
      // the rail the marked point never leaves
      const [ax, ay] = proj(-RING, 0, LIFT, S), [bx2, by2] = proj(RING, 0, LIFT, S);
      g.setLineDash([3, 4]); g.strokeStyle = 'rgba(255,214,160,.30)'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx2, by2); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#ffe9c4'; g.beginPath(); g.arc(mpx, mpy, 4.2, 0, TAU); g.fill();
      g.restore(); lampShade(g, w, h);
    },
  };
}

/* ═══ THE CASE, IN ORDER ══════════════════════════════════════════════════════
   2×3 niches. `cores` maps each room id to its core module — the page passes the
   forge-inlined IIFE exports, Node passes real `import()`s. Same six panels. */
export const ROOM_IDS = ['the-top', 'tippe-top', 'rattleback', 'spinning-chair', 'rotor', 'tusi'];

export function makePanels(cores) {
  return [
    makeTopPanel(cores['the-top']),
    makeTippeTopPanel(cores['tippe-top']),
    makeRattlebackPanel(cores['rattleback']),
    makeChairPanel(cores['spinning-chair']),
    makeRotorPanel(cores.rotor),
    makeTusiPanel(cores.tusi),
  ];
}
