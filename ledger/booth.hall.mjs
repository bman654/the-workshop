/* ═══════════════════════════════════════════════════════════════════════════
   THE WALL OF THE NIGHT — booth.hall.mjs
   The hall, the wall, and the archaeology of a pile of photographs.

   The page opens on the WALL, not on the booth. Ninety strips are already
   pinned here, laid oldest-cycle-first so the party has a history rather than
   a randomiser: cycle 306 — Cairn, the first mark ever left in this house —
   is four strips down with only a corner showing.
   ═══════════════════════════════════════════════════════════════════════════ */

/* LANDMINE — keep this import on ONE LINE. forge's static-import stripper
   (tools/forge/forge.mjs, STATIC_IMPORT) is whole-line anchored, so a
   multi-line `import { … } from '…'` block survives into the forged classic
   <script>, where it is a SyntaxError that silently kills the entire inlined
   block — core, sound and hall all at once, with the page rendering an empty
   canvas and no console error worth the name. Cost one debug cycle here. */
import { SIZE, PLATES, WALL_SEED, WALL_STRIPS, mulberry32, fnv1a, renderPortrait, renderPlates, ageFor, resolveStrip, wallCycles, unwalledCycles } from './booth.core.mjs';

export const Hall = {
  cvs: null, ctx: null, W: 0, H: 0, dpr: 1,
  worldW: 0, camX: 0, camV: 0, target: 0,
  strips: [], ix: null, pool: [], poolAt: 0,
  hover: null, reading: null, t0: 0, reduced: false,
  damask: null, motes: [], upgradeQ: [], zTop: 0,
};

/* ── the paper a strip is printed on ─────────────────────────────────────── */

const PAPER = { warm: [0xf0, 0xdc, 0xc0], cool: [0xe6, 0xe2, 0xd4] };

function stripMetrics(S, withKoan) {
  const m = Math.round(S * 0.13);
  const gap = Math.round(S * 0.075);
  const foot = Math.round(S * 0.42);
  const koan = withKoan ? Math.round(S * 0.78) : 0;
  return {
    S, m, gap, foot, koan,
    w: S + m * 2,
    h: m + 4 * (S + gap) - gap + foot + koan + m * 0.4,
    frameY: (i) => m + i * (S + gap),
  };
}

/* Compose a strip's bitmap ONCE. During a pan we only ever blit these — a
   portrait is never re-rendered per frame, which is what keeps the wall free. */
export function composeStrip(strip, S, opts) {
  const o = opts || {};
  const M = stripMetrics(S, !!o.koanLine);
  const c = document.createElement('canvas');
  c.width = M.w; c.height = M.h;
  const g = c.getContext('2d');
  const age = ageFor(strip.cycle, Hall.ix.newest);

  /* paper: warm stock, yellowed with age */
  const p = [0, 1, 2].map(i => PAPER.warm[i] * (1 - age * 0.22) + PAPER.cool[i] * age * 0.22 - age * 14);
  g.fillStyle = 'rgb(' + p.map(v => Math.round(Math.max(0, v))).join(',') + ')';
  g.fillRect(0, 0, M.w, M.h);

  /* fibre: a seeded scatter of faint strokes, so the stock is stock */
  const rng = mulberry32(fnv1a('paper|' + strip.cycle + '|' + strip.pinSeed));
  g.globalAlpha = 0.055;
  for (let i = 0; i < Math.round(M.w * M.h / 900); i++) {
    g.strokeStyle = rng() < 0.5 ? '#6b5638' : '#fffaf0';
    g.lineWidth = 0.7;
    const x = rng() * M.w, y = rng() * M.h, a = rng() * Math.PI, L = 2 + rng() * 7;
    g.beginPath();
    g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L);
    g.stroke();
  }
  g.globalAlpha = 1;

  strip.canvas = c;
  strip.metrics = M;
  strip.renderedAt = S;
  strip.frameCanvases = [];
  for (let i = 0; i < 4; i++) paintFrame(strip, i, o.develop === undefined ? 1 : o.develop);
  paintChrome(strip, o);
  return c;
}

/* one frame of the strip, at development time t */
export function paintFrame(strip, i, t) {
  const M = strip.metrics, S = M.S, g = strip.canvas.getContext('2d');
  const mark = strip.frames[i];
  const y = M.frameY(i);

  let buf;
  if (t >= 1 && !strip.plates) {
    buf = renderPortrait(mark, { size: S, newest: Hall.ix.newest }).data;
  } else if (strip.plates) {
    /* cross-fade the two adjacent pre-rendered density plates. This is the
       whole performance answer: no per-pixel transfer function per frame. */
    const pl = strip.plates[i];
    const f = Math.max(0, Math.min(1, t)) * (pl.length - 1);
    const k = Math.min(pl.length - 2, Math.floor(f));
    const a = f - k;
    g.drawImage(pl[k].cvs, M.m, y, S, S);
    if (a > 0.001) {
      g.globalAlpha = a;
      g.drawImage(pl[k + 1].cvs, M.m, y, S, S);
      g.globalAlpha = 1;
    }
    frameEdge(g, M.m, y, S);
    return;
  } else {
    buf = renderPortrait(mark, { size: S, newest: Hall.ix.newest }).data;
  }
  const id = new ImageData(buf, S, S);
  const tmp = document.createElement('canvas');
  tmp.width = S; tmp.height = S;
  tmp.getContext('2d').putImageData(id, 0, 0);
  g.drawImage(tmp, M.m, y, S, S);
  frameEdge(g, M.m, y, S);
}

function frameEdge(g, x, y, S) {
  g.strokeStyle = 'rgba(40,28,16,0.30)';
  g.lineWidth = Math.max(1, S * 0.012);
  g.strokeRect(x + 0.5, y + 0.5, S - 1, S - 1);
}

/* the foot: the cycle struck in gilt, and (for the on-ramp strips) one koan */
function paintChrome(strip, o) {
  const M = strip.metrics, g = strip.canvas.getContext('2d');
  const footY = M.m + 4 * (M.S + M.gap) - M.gap;

  g.textAlign = 'center';
  g.fillStyle = 'rgba(150,112,40,0.92)';
  g.font = '600 ' + Math.round(M.S * 0.20) + 'px Georgia, serif';
  g.fillText('CYCLE ' + strip.cycle, M.w / 2, footY + M.foot * 0.62);

  if (o && o.koanLine) {
    /* THE ON-RAMP. A few strips lie under a lamp with one koan line legible at
       rest, un-lifted — so a visitor learns there are WORDS in this pile
       without being told so by a tutorial. */
    g.fillStyle = 'rgba(46,32,18,0.90)';
    const fs = Math.round(M.S * 0.155);
    g.font = 'italic ' + fs + 'px Georgia, serif';
    const words = String(o.koanLine).split(/\s+/);
    const lines = []; let cur = '', used = 0, clipped = false;
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (g.measureText(test).width > M.w - M.m * 1.4 && cur) {
        if (lines.length >= 3) { clipped = true; break; }
        lines.push(cur); cur = w;
      } else cur = test;
      used++;
    }
    if (cur && lines.length < 4) lines.push(cur);
    if (used < words.length || clipped) {
      /* never leave a koan severed mid-clause with no sign of it */
      lines[lines.length - 1] = lines[lines.length - 1].replace(/[;,:]$/, '') + '…';
    }
    lines.forEach((ln, i) => g.fillText(ln, M.w / 2, footY + M.foot + fs * (1.15 + i * 1.22)));
  }
  g.textAlign = 'start';
}

/* ── the hall itself ─────────────────────────────────────────────────────── */

/* Procedural ox-blood damask, generated ONCE to an offscreen tile and then
   tiled as a pattern. Never regenerated. */
function makeDamask() {
  /* An OGEE LATTICE with small palmettes at the crossings. An earlier version
     drew one big mirrored-leaf motif per tile and read, unmistakably, as a wall
     of beetles. Damask is a fine repeating lattice, not a row of creatures —
     and at 1 a.m. it should be barely more than a texture you sense. */
  const T = 132;
  const c = document.createElement('canvas');
  c.width = T; c.height = T;
  const g = c.getContext('2d');
  g.fillStyle = '#1b0709';
  g.fillRect(0, 0, T, T);
  const rng = mulberry32(0xDA3A5C);

  /* the ogee: two columns of mirrored S-curves that tile seamlessly */
  g.lineWidth = 1.5;
  g.strokeStyle = 'rgba(112,30,36,0.34)';
  for (const ox of [0, T / 2]) {
    for (const dir of [1, -1]) {
      g.beginPath();
      g.moveTo(ox + dir * T * 0.25, 0);
      g.bezierCurveTo(ox + dir * T * 0.06, T * 0.18, ox + dir * T * 0.06, T * 0.32, ox, T * 0.5);
      g.bezierCurveTo(ox - dir * T * 0.06, T * 0.68, ox - dir * T * 0.06, T * 0.82, ox - dir * T * 0.25, T);
      g.stroke();
    }
  }
  /* a small four-petal palmette where the curves meet */
  const petal = (cx, cy, s) => {
    g.fillStyle = 'rgba(122,34,40,0.30)';
    for (let k = 0; k < 4; k++) {
      g.save();
      g.translate(cx, cy); g.rotate(k * Math.PI / 2); g.scale(s, s);
      g.beginPath();
      g.moveTo(0, 0);
      g.bezierCurveTo(5, -3, 8, -9, 0, -13);
      g.bezierCurveTo(-8, -9, -5, -3, 0, 0);
      g.fill();
      g.restore();
    }
  };
  petal(0, T * 0.5, 1); petal(T, T * 0.5, 1);
  petal(T / 2, 0, 1); petal(T / 2, T, 1);
  petal(T / 4, T * 0.25, 0.55); petal(T * 0.75, T * 0.75, 0.55);

  /* a faint weave so it is cloth, not paint */
  g.globalAlpha = 0.08;
  for (let i = 0; i < 420; i++) {
    g.fillStyle = rng() < 0.5 ? '#000' : '#6a2226';
    g.fillRect(rng() * T, rng() * T, 1, 1);
  }
  g.globalAlpha = 1;
  return g.createPattern(c, 'repeat');
}

export function lampPools() {
  /* three tungsten pools along the wall, in WORLD coordinates */
  /* FOUR pools, evenly spaced. Three left a dead band mid-wall that no amount
     of scatter filled — the gap between two lamps is exactly where nothing
     hangs, because nothing was lit there. */
  return [
    { x: Hall.worldW * 0.13, y: Hall.H * 0.44, r: Hall.H * 0.66 },
    { x: Hall.worldW * 0.38, y: Hall.H * 0.38, r: Hall.H * 0.72 },
    { x: Hall.worldW * 0.63, y: Hall.H * 0.45, r: Hall.H * 0.68 },
    { x: Hall.worldW * 0.87, y: Hall.H * 0.39, r: Hall.H * 0.64 },
  ];
}

function drawHall(g) {
  const { W, H } = Hall;
  g.save();
  g.translate(-Hall.camX, 0);
  g.fillStyle = Hall.damask;
  g.fillRect(Hall.camX, 0, W, H);
  /* tungsten pools: warm light falling on cloth at one in the morning */
  /* The hall is DARK. The light arrives only in pools, and falls off hard —
     an evenly-lit maroon room reads as wallpaper, not as one in the morning. */
  g.globalCompositeOperation = 'lighter';
  for (const L of lampPools()) {
    const grd = g.createRadialGradient(L.x, L.y * 0.62, 0, L.x, L.y, L.r);
    grd.addColorStop(0, 'rgba(255,190,110,0.46)');
    grd.addColorStop(0.20, 'rgba(230,146,72,0.22)');
    grd.addColorStop(0.48, 'rgba(150,76,36,0.075)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(L.x - L.r, L.y - L.r, L.r * 2, L.r * 2);
  }
  g.globalCompositeOperation = 'source-over';
  g.restore();
  /* the dark of the hall closes in hard at the edges */
  const v = g.createRadialGradient(W / 2, H * 0.40, H * 0.06, W / 2, H * 0.5, H * 0.98);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(0.58, 'rgba(0,0,0,0.24)');
  v.addColorStop(1, 'rgba(0,0,0,0.93)');
  g.fillStyle = v;
  g.fillRect(0, 0, W, H);
}

function drawMotes(g, dt) {
  g.save();
  for (const m of Hall.motes) {
    m.x += m.vx * dt; m.y += m.vy * dt;
    m.ph += dt * m.sp;
    if (m.y < -10) { m.y = Hall.H + 10; m.x = Math.random() * Hall.worldW; }
    if (m.x < -10) m.x = Hall.worldW + 10;
    if (m.x > Hall.worldW + 10) m.x = -10;
    const sx = m.x - Hall.camX;
    if (sx < -20 || sx > Hall.W + 20) continue;
    g.globalAlpha = (0.16 + 0.30 * (0.5 + 0.5 * Math.sin(m.ph))) * m.a;
    g.fillStyle = '#ffd9a0';
    g.beginPath();
    g.arc(sx, m.y + Math.sin(m.ph * 0.7) * 6, m.r, 0, 6.2832);
    g.fill();
  }
  g.globalAlpha = 1;
  g.restore();
}

/* ── strips on the wall ──────────────────────────────────────────────────── */

/* Where a strip hangs. Overlap 3–6 deep in the lit centre, thinning into the
   dark edges — laid oldest first, so the deep history is genuinely buried. */
export function layoutWall(cycles) {
  const rng = mulberry32(WALL_SEED);
  const strips = [];
  const pools = lampPools();
  cycles.forEach((cycle, i) => {
    const u = i / Math.max(1, cycles.length - 1);
    /* older strips sit toward the lit centre and get buried by what came after */
    /* A strip hangs from its tack and falls DOWNWARD, so its y is the top edge:
       the band must leave room for the strip's own height or the pile spills
       off the bottom of the hall. */
    const TOP = Hall.H * 0.045, BOT = Hall.H * 0.60;
    let cx, cy;
    const pick = rng();
    if (pick < 0.86) {
      /* the lit centre: tight clusters, so the pile really is 3–6 deep */
      const L = pools[Math.floor(rng() * pools.length)];
      const a = rng() * 6.2832, rr = Math.pow(rng(), 0.62) * L.r * 0.21;
      cx = L.x + Math.cos(a) * rr;
      cy = L.y * 0.84 + Math.sin(a) * rr * 1.05;
    } else {
      /* the dark edges: thinner, more scattered */
      cx = rng() * Hall.worldW;
      cy = TOP + rng() * (BOT - TOP);
    }
    cy = Math.max(TOP, Math.min(BOT, cy));
    strips.push({
      cycle,
      x: cx, y: cy,
      rot: (rng() - 0.5) * 0.49,          /* ±14° */
      pinSeed: (rng() * 1e9) | 0,
      z: i,                                /* oldest first = deepest */
      lift: 0, swing: 0, swingV: 0,
      onRamp: false,
      scale: 1,
      u,
    });
  });

  /* NOTE: the legend and the booth are viewport-FIXED while the wall pans
     beneath them, so there is no world-space "keep clear" zone that would work
     at more than one scroll position. Their readability is a scrim problem,
     solved in CSS — not a layout problem, solved here. */
  return strips;
}

/* The four strips that carry a legible koan, set square under a lamp so a
   visitor reads one line without lifting anything. Hidden pleasures need an
   on-ramp; this is the booth's. */
export function chooseOnRamp(strips) {
  const pools = lampPools();
  const picks = [];
  pools.forEach((L, k) => {
    if (k > 2) return;
    let best = null, bd = Infinity;
    for (const s of strips) {
      if (s.onRamp) continue;
      const d = Math.hypot(s.x - L.x, (s.y - L.y) * 1.4);
      if (d < bd) { bd = d; best = s; }
    }
    if (best) picks.push(best);
  });
  /* a fourth, nearest the booth, so the eye is led toward the thing that glows */
  let best = null, bd = Infinity;
  for (const s of strips) {
    if (s.onRamp || picks.includes(s)) continue;
    const d = Math.hypot(s.x - Hall.worldW * 0.62, s.y - Hall.H * 0.52);
    if (d < bd) { bd = d; best = s; }
  }
  if (best) picks.push(best);

  picks.forEach((s, i) => {
    s.onRamp = true;
    s.rot *= 0.22;                       /* nearly square to the wall */
    s.composeS = 74;                     /* composed BIGGER, so the line is sharp
                                            rather than a scaled-up blur */
    s.z = 1e6 + i;                       /* on top: nothing buries the on-ramp */
    s.y = Math.min(s.y, Hall.H * 0.20);  /* high enough that the koan line, which
                                            hangs below four frames, stays on screen */
  });
  return picks;
}

/* ── drawing a strip ─────────────────────────────────────────────────────── */

export function drawStrip(g, s, now) {
  if (!s.canvas) return;
  const M = s.metrics;
  const sc = (s.scale || 1) * (Hall.stripScale || 1);
  const w = M.w * sc, h = M.h * sc;
  const sx = s.x - Hall.camX;
  if (sx + w < -60 || sx - w > Hall.W + 60) return;

  const lift = s.lift;
  g.save();
  g.translate(sx, s.y);
  /* the tack is at the TOP of the strip: it swings from there, not its middle */
  g.rotate(s.rot + s.swing);
  g.translate(0, lift * -6);

  /* shadow spreads as it lifts off the wall */
  g.shadowColor = 'rgba(0,0,0,' + (0.42 + 0.30 * lift) + ')';
  g.shadowBlur = 8 + 26 * lift;
  g.shadowOffsetY = 4 + 14 * lift;
  g.drawImage(s.canvas, -w / 2, 0, w, h);
  g.shadowBlur = 0; g.shadowOffsetY = 0;

  /* the corner curl, peeling as it lifts */
  const cs = Math.min(w, h) * (0.13 + 0.09 * lift);
  const cg = g.createLinearGradient(w / 2 - cs, h - cs, w / 2, h);
  cg.addColorStop(0, 'rgba(255,246,226,0.00)');
  cg.addColorStop(0.55, 'rgba(255,244,220,' + (0.30 + 0.35 * lift) + ')');
  cg.addColorStop(1, 'rgba(120,92,54,' + (0.42 + 0.22 * lift) + ')');
  g.fillStyle = cg;
  g.beginPath();
  g.moveTo(w / 2 - cs, h);
  g.quadraticCurveTo(w / 2 - cs * 0.35, h - cs * 0.35, w / 2, h - cs);
  g.lineTo(w / 2, h);
  g.closePath();
  g.fill();

  /* warm rim-light while lifted */
  if (lift > 0.01) {
    g.strokeStyle = 'rgba(255,206,140,' + (0.50 * lift) + ')';
    g.lineWidth = 1.6;
    g.strokeRect(-w / 2, 0, w, h);
  }

  /* the wet gloss of a strip that has just come out of the slot */
  if (s.gloss > 0.01) {
    const gg = g.createLinearGradient(-w / 2, 0, w / 2, h);
    gg.addColorStop(0, 'rgba(255,255,255,0)');
    gg.addColorStop(0.42, 'rgba(255,255,255,' + (0.34 * s.gloss) + ')');
    gg.addColorStop(0.60, 'rgba(210,240,255,' + (0.18 * s.gloss) + ')');
    gg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gg;
    g.fillRect(-w / 2, 0, w, h);
  }

  /* the tack */
  g.beginPath();
  g.arc(0, M.m * 0.42 * sc, Math.max(2.2, 3.4 * sc), 0, 6.2832);
  g.fillStyle = '#d9b25e';
  g.fill();
  g.strokeStyle = 'rgba(60,40,10,0.7)';
  g.lineWidth = 0.9;
  g.stroke();

  g.restore();
}

/* ── hit-testing: a strip is a real object, so we invert its transform ───── */

export function hitTest(px, py) {
  const wx = px + Hall.camX;
  let best = null;
  for (const s of Hall.strips) {
    if (!s.canvas) continue;
    const M = s.metrics;
    const sc = (s.scale || 1) * (Hall.stripScale || 1);
    const w = M.w * sc, h = M.h * sc;
    const dx = wx - s.x, dy = py - s.y + s.lift * 6;
    const a = -(s.rot + s.swing);
    const lx = dx * Math.cos(a) - dy * Math.sin(a);
    const ly = dx * Math.sin(a) + dy * Math.cos(a);
    if (lx >= -w / 2 && lx <= w / 2 && ly >= 0 && ly <= h) {
      if (!best || s.z > best.z) best = s;
    }
  }
  return best;
}

/* ── the frontier: where a freshly pinned strip flies ────────────────────── */

export function sparseSpot() {
  const cells = 9, rows = 4;
  const count = new Float64Array(cells * rows);
  for (const s of Hall.strips) {
    const cx = Math.floor((s.x / Hall.worldW) * cells);
    const cy = Math.floor((s.y / Hall.H) * rows);
    if (cx >= 0 && cx < cells && cy >= 0 && cy < rows) count[cy * cells + cx]++;
  }
  /* prefer sparse, but stay in the lit band and near where the visitor is looking */
  let best = 0, bs = Infinity;
  for (let i = 0; i < count.length; i++) {
    const cx = (i % cells + 0.5) / cells * Hall.worldW;
    const cy = (Math.floor(i / cells) + 0.5) / rows * Hall.H;
    const nearView = Math.abs(cx - (Hall.camX + Hall.W / 2)) / Hall.worldW;
    const score = count[i] + nearView * 5 + Math.abs(cy - Hall.H * 0.45) / Hall.H * 2;
    if (score < bs) { bs = score; best = i; }
  }
  const rng = mulberry32(fnv1a('spot' + Hall.strips.length));
  return {
    x: ((best % cells) + 0.2 + rng() * 0.6) / cells * Hall.worldW,
    y: ((Math.floor(best / cells)) + 0.2 + rng() * 0.6) / rows * Hall.H,
  };
}

export { drawHall, drawMotes, makeDamask, stripMetrics };
