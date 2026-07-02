// ============================================================================
//  THE DEEP HEARTH — section.mjs  ·  the SHARED geological survey-plate.
//
//  Zero-dependency ESM imported by BOTH pages of the wing:
//    • the-deep-hearth/index.html        — the LANDING (whole column in frame)
//    • the-deep-hearth/conduit/index.html — the BENCH (dollied into the conduit)
//  Because both pages import THIS one file, the cutaway + the depth ribbon are
//  BYTE-IDENTICAL across them by construction — that shared spine is the proof
//  that the landing and the bench are ONE continuous room, just two camera
//  positions on the same side-on drawing.
//
//  The whole drawing lives in WORLD coordinates (metres): worldX across, worldY
//  = DEPTH (0 at the vent lip, increasing downward to the chamber, mantle, and
//  an ember hint of the core). A camera {cx,cy,scale} maps world→screen; the
//  landing uses the establishing camera (everything in frame), the bench dollies
//  into the conduit. The static strata, chamber outline, glass conduit walls and
//  engraved labels are BAKED once per (size,camera) to an offscreen buffer; the
//  page composites the LIVE melt into the conduit cavity over that buffer.
// ============================================================================

// ── THE WORLD — the geology, as a single source both pages read. Depth in metres.
export const WORLD = {
  skyTop: -1100,          // top of the air column (the plume climbs here)
  vent: 0,                // the vent lip — depth zero
  crustBase: 220,         // base of the ash/scoria crust band
  conduitBottom: 2000,    // conduit meets the chamber roof
  chamberCY: 2760,        // magma-chamber bulb centre depth
  chamberRX: 560,         // bulb half-width
  chamberRY: 720,         // bulb half-height
  mantleTop: 3560,        // top of the mantle stratum
  coreTop: 5400,          // ember hint of the core begins
  worldBottom: 6200,
  conduitX: 0,            // conduit centre in worldX
  // conduit half-width as a function of depth: a slight flare to the vent.
  halfWidth(depth) {
    const d = Math.max(0, Math.min(this.conduitBottom, depth));
    const t = d / this.conduitBottom;           // 0 at vent, 1 at chamber roof
    return 86 - 30 * (1 - t) * (1 - t);          // ~56 m at vent, flaring to 86 m deep
  },
  // the V crater notch at the vent: half-width of the open notch at a given (negative) height
  ventNotchHalf(depth) {
    if (depth >= 0) return this.halfWidth(0);
    const up = -depth;                           // metres above the vent
    return this.halfWidth(0) + up * 0.9;         // opens upward into the crater
  },
};

// ── rock strata: graded bands, each its own engraved name + colour, denser &
//    darker downward. Boundaries are world depths.
export const STRATA = [
  { name: 'ASH · SCORIA',    top: WORLD.vent,     bot: WORLD.crustBase, c0: '#3a2e25', c1: '#2a201a' },
  { name: 'COUNTRY ROCK',    top: WORLD.crustBase, bot: 760,            c0: '#2c241f', c1: '#241c17' },
  { name: 'WALL ROCK',       top: 760,             bot: 1340,           c0: '#241b16', c1: '#1d1511' },
  { name: 'DEEP CRUST',      top: 1340,            bot: WORLD.conduitBottom, c0: '#1d1410', c1: '#15100c' },
  { name: 'CHAMBER WALL',    top: WORLD.conduitBottom, bot: WORLD.mantleTop, c0: '#1a120d', c1: '#120c09' },
  { name: 'MANTLE',          top: WORLD.mantleTop, bot: WORLD.coreTop,   c0: '#191007', c1: '#241105' },
  { name: 'OUTER CORE',      top: WORLD.coreTop,   bot: WORLD.worldBottom, c0: '#3a1206', c1: '#7a1f06' },
];

// ── CAMERAS. Each maps a world point to screen given the canvas size. `cx,cy` is
//    the world point shown at the canvas centre; `scale` is px per metre.
export function makeCamera(mode, W, H) {
  if (mode === 'conduit') {
    // dollied into the upper conduit — a thin sky sliver at the very top, the vent
    // lip just below it, and the fragmentation zone front-and-centre. The depth
    // ribbon keeps the whole-column context so this never loses the one-column read.
    const scale = H / 1500;            // ~1500 m tall window
    return { cx: WORLD.conduitX, cy: 650, scale, mode };
  }
  if (mode === 'melt') {
    // dollied DOWN to the chamber roof — deep crust above, the roof band centre-
    // frame, the chamber bulb below. This is where solid rock first becomes melt
    // when the lid comes off; the depth ribbon keeps the whole-column context.
    const scale = H / 1200;            // ~1200 m tall window (frames ~1630–2830 m)
    return { cx: WORLD.conduitX, cy: 2230, scale, mode };
  }
  // establishing: the whole column from sky to ember core in frame.
  const span = WORLD.worldBottom - WORLD.skyTop;
  const scale = Math.min(H / span, (W * 0.62) / (2 * (WORLD.chamberRX + 120)));
  return { cx: WORLD.conduitX, cy: (WORLD.skyTop + WORLD.worldBottom) / 2, scale, mode };
}
export function worldToScreen(cam, wx, wy, W, H) {
  return [W / 2 + (wx - cam.cx) * cam.scale, H / 2 + (wy - cam.cy) * cam.scale];
}
export function screenDepth(cam, sy, H) { return cam.cy + (sy - H / 2) / cam.scale; }

// ── a small deterministic value-noise for wavy strata boundaries + hatching.
function wob(x, seed) {
  const s = Math.sin(x * 0.013 + seed) * 7 + Math.sin(x * 0.041 + seed * 2.3) * 3.5;
  return s;
}

// ── BAKE the static survey plate to an offscreen canvas: sky, strata, the magma
//    chamber outline, glass conduit walls, the vent crater, engraved labels and
//    the ruler ticks. One drawImage per frame on the page; the live melt is
//    composited over the conduit cavity by the page.
export function bakeSection(W, H, cam) {
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const wy = d => H / 2 + (d - cam.cy) * cam.scale;          // world depth → screen y
  const X = x => W / 2 + (x - cam.cx) * cam.scale;            // world x → screen x

  // --- SKY (above the vent): a smoky dawn gradient ---
  const skyTopY = wy(WORLD.skyTop), ventY = wy(WORLD.vent);
  const sky = g.createLinearGradient(0, Math.min(skyTopY, 0), 0, Math.max(ventY, 0));
  sky.addColorStop(0, '#1a1622');
  sky.addColorStop(0.55, '#241a20');
  sky.addColorStop(1, '#30201c');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, Math.max(0, ventY));

  // --- STRATA bands, graded, with wavy tops + faint engraved hatch ---
  for (const st of STRATA) {
    const yTop = wy(st.top), yBot = wy(st.bot);
    if (yBot < 0 || yTop > H) continue;
    const grad = g.createLinearGradient(0, yTop, 0, yBot);
    grad.addColorStop(0, st.c0); grad.addColorStop(1, st.c1);
    g.save();
    g.beginPath();
    g.moveTo(0, yTop);
    for (let sx = 0; sx <= W; sx += 16) {
      g.lineTo(sx, yTop + wob(sx + st.top, st.top * 0.001) * Math.min(1, cam.scale * 6));
    }
    g.lineTo(W, yBot); g.lineTo(0, yBot); g.closePath();
    g.fillStyle = grad; g.fill();
    g.clip();
    // engraved hatch — sparse diagonal register lines
    g.globalAlpha = 0.05; g.strokeStyle = '#e7c79a'; g.lineWidth = 1;
    for (let d = -H; d < W + H; d += 22) {
      g.beginPath(); g.moveTo(d, 0); g.lineTo(d + H, H); g.stroke();
    }
    g.restore();
  }

  // --- the EMBER CORE glow at the very bottom ---
  const coreY = wy(WORLD.coreTop);
  if (coreY < H) {
    const cg = g.createRadialGradient(W / 2, wy(WORLD.worldBottom), 0, W / 2, wy(WORLD.worldBottom), Math.max(W, H) * 0.7);
    cg.addColorStop(0, 'rgba(255,150,60,0.55)');
    cg.addColorStop(0.4, 'rgba(200,70,30,0.25)');
    cg.addColorStop(1, 'rgba(120,30,10,0)');
    g.fillStyle = cg; g.fillRect(0, coreY, W, H - coreY);
  }

  // --- the MAGMA CHAMBER bulb outline (a feeding reservoir) ---
  {
    const cyS = wy(WORLD.chamberCY), rx = WORLD.chamberRX * cam.scale, ry = WORLD.chamberRY * cam.scale;
    g.save();
    const bg = g.createRadialGradient(W / 2, cyS, 0, W / 2, cyS, Math.max(rx, ry));
    bg.addColorStop(0, 'rgba(255,140,50,0.30)');
    bg.addColorStop(0.7, 'rgba(180,60,28,0.16)');
    bg.addColorStop(1, 'rgba(120,40,18,0)');
    g.beginPath(); g.ellipse(W / 2, cyS, rx, ry, 0, 0, Math.PI * 2);
    g.fillStyle = bg; g.fill();
    g.strokeStyle = 'rgba(230,140,70,0.34)'; g.lineWidth = 1.4; g.stroke();
    g.restore();
  }

  // --- the CONDUIT cavity: a vertical channel with engraved glass walls. We draw
  //     the WALLS here (rims); the page composites the live melt into the cavity. ---
  const conduitPath = conduitScreenPath(g, cam, W, H);
  g.save();
  g.lineWidth = 2; g.strokeStyle = 'rgba(150,170,210,0.30)';
  g.shadowColor = 'rgba(120,150,220,0.25)'; g.shadowBlur = 6;
  g.stroke(conduitPath);
  g.restore();

  // --- the VENT CRATER notch above the vent (only meaningful in establishing/up views) ---
  if (skyTopY < ventY) {
    g.save();
    g.beginPath();
    const topDepth = Math.max(WORLD.skyTop, cam.cy - (H / 2) / cam.scale);
    g.moveTo(X(-WORLD.ventNotchHalf(topDepth)), wy(topDepth));
    g.lineTo(X(-WORLD.halfWidth(0)), wy(0));
    g.lineTo(X(WORLD.halfWidth(0)), wy(0));
    g.lineTo(X(WORLD.ventNotchHalf(topDepth)), wy(topDepth));
    g.closePath();
    const vg = g.createLinearGradient(0, wy(topDepth), 0, ventY);
    vg.addColorStop(0, 'rgba(20,16,18,0)');
    vg.addColorStop(1, 'rgba(40,26,20,0.5)');
    g.fillStyle = vg; g.fill();
    g.restore();
  }

  // --- engraved STRATUM labels in the right margin (only where the band is tall) ---
  g.save();
  g.font = '600 10px "SF Mono", ui-monospace, Menlo, monospace';
  g.textBaseline = 'middle';
  for (const st of STRATA) {
    const yMid = wy((st.top + st.bot) / 2), yTop = wy(st.top), yBot = wy(st.bot);
    if (yBot - yTop < 26 || yMid < 12 || yMid > H - 12) continue;
    g.fillStyle = 'rgba(190,160,120,0.40)';
    const label = st.name;
    const tw = g.measureText(label).width;
    g.fillText(label, W - tw - 12, yMid);
  }
  g.restore();

  return cv;
}

// ── build a Path2D for the conduit cavity in SCREEN space (used by both the bake
//    for the walls AND by the page to CLIP the live melt — one geometry, no seam).
export function conduitScreenPath(g, cam, W, H) {
  const wy = d => H / 2 + (d - cam.cy) * cam.scale;
  const X = x => W / 2 + (x - cam.cx) * cam.scale;
  const p = new Path2D();
  const top = WORLD.vent, bot = WORLD.conduitBottom;
  // left wall top→bottom
  p.moveTo(X(-WORLD.halfWidth(top)), wy(top));
  for (let d = top; d <= bot; d += 40) p.lineTo(X(-WORLD.halfWidth(d)), wy(d));
  p.lineTo(X(-WORLD.halfWidth(bot)), wy(bot));
  // across the chamber-roof mouth, then up the right wall
  p.lineTo(X(WORLD.halfWidth(bot)), wy(bot));
  for (let d = bot; d >= top; d -= 40) p.lineTo(X(WORLD.halfWidth(d)), wy(d));
  p.closePath();
  return p;
}

// ── THE DEPTH RIBBON — the byte-identical left-margin component both pages share.
//    An engraved depth + pressure scale, a dimmed whole-column thumbnail of the
//    section, and a bright "you are here" window showing the current camera's
//    framing on the column. `pressureAt` is a (depth)->MPa function the page hands
//    in (from the physics core) so the ribbon's pressure ticks stay honest.
export function drawDepthRibbon(ctx, box, cam, W, H, opts = {}) {
  const { x, y, w, h } = box;
  const pressureAt = opts.pressureAt || (() => 0);
  const accent = opts.accent || '#e24a2a';
  ctx.save();
  // ribbon panel
  ctx.fillStyle = 'rgba(12,9,8,0.72)';
  roundRect(ctx, x, y, w, h, 8); ctx.fill();
  ctx.strokeStyle = 'rgba(150,120,90,0.30)'; ctx.lineWidth = 1; ctx.stroke();

  // --- engraved depth scale down the ribbon ---
  const top = WORLD.skyTop, bot = WORLD.worldBottom;
  const ry = d => y + 14 + (d - top) / (bot - top) * (h - 28);
  ctx.font = '600 9px "SF Mono", ui-monospace, Menlo, monospace';
  ctx.textBaseline = 'middle';
  for (let d = 0; d <= 6000; d += 1000) {
    const yy = ry(d);
    ctx.strokeStyle = 'rgba(180,150,110,0.34)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + 6, yy); ctx.lineTo(x + 16, yy); ctx.stroke();
    ctx.fillStyle = 'rgba(190,160,120,0.6)';
    ctx.fillText((d / 1000) + ' km', x + 19, yy);
  }
  // vent marker
  const ventY = ry(0);
  ctx.strokeStyle = accent; ctx.globalAlpha = 0.8; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(x + 4, ventY); ctx.lineTo(x + w - 4, ventY); ctx.stroke();
  ctx.globalAlpha = 1;

  // --- dimmed whole-column thumbnail strip on the ribbon's right edge ---
  const tx = x + w - 16, tw = 11;
  for (const st of STRATA) {
    const yt = ry(st.top), yb = ry(st.bot);
    const gr = ctx.createLinearGradient(0, yt, 0, yb);
    gr.addColorStop(0, st.c0); gr.addColorStop(1, st.c1);
    ctx.fillStyle = gr; ctx.fillRect(tx, yt, tw, Math.max(1, yb - yt));
  }
  // thumbnail conduit hairline + chamber dot
  ctx.strokeStyle = 'rgba(150,170,210,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(tx + tw / 2, ry(0)); ctx.lineTo(tx + tw / 2, ry(WORLD.conduitBottom)); ctx.stroke();
  ctx.fillStyle = 'rgba(255,140,60,0.5)';
  ctx.beginPath(); ctx.ellipse(tx + tw / 2, ry(WORLD.chamberCY), 4, 6, 0, 0, Math.PI * 2); ctx.fill();

  // --- the bright YOU-ARE-HERE window: the depth band the camera currently frames ---
  const topDepth = cam.cy - (H / 2) / cam.scale;
  const botDepth = cam.cy + (H / 2) / cam.scale;
  const wyt = ry(Math.max(top, topDepth)), wyb = ry(Math.min(bot, botDepth));
  ctx.strokeStyle = accent; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.95;
  roundRect(ctx, tx - 3, wyt, tw + 6, Math.max(4, wyb - wyt), 2); ctx.stroke();
  ctx.globalAlpha = 0.12; ctx.fillStyle = accent;
  ctx.fillRect(tx - 3, wyt, tw + 6, Math.max(4, wyb - wyt));
  ctx.globalAlpha = 1;

  // --- a live pressure readout at the window centre ---
  const midDepth = (Math.max(top, topDepth) + Math.min(bot, botDepth)) / 2;
  const P = pressureAt(Math.max(0, midDepth));
  ctx.fillStyle = 'rgba(200,170,130,0.7)';
  ctx.font = '600 8.5px "SF Mono", ui-monospace, Menlo, monospace';
  ctx.fillText('P≈' + P.toFixed(1) + ' MPa', x + 6, y + h - 8);

  // ribbon title
  ctx.save();
  ctx.translate(x + 9, y + 8); ctx.fillStyle = 'rgba(190,160,120,0.5)';
  ctx.font = '600 8px "SF Mono", ui-monospace, Menlo, monospace';
  ctx.fillText('DEPTH', 0, 0);
  ctx.restore();
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
