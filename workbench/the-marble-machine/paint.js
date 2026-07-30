/* ============================================================================
   THE MARBLE MACHINE — paint.js
   Everything the wall looks like. Takes a 2-D context and the machine state;
   knows nothing about events, audio or the DOM beyond the context it is given.

   The wall is drawn in WORLD metres through view {ox, oy, s}: screen = world*s
   + offset. Every size below is therefore in metres and the whole thing scales.
   ============================================================================ */

export const PAL = {
  night:  '#120d0a',
  oak0:   '#4a3524', oak1: '#33241a', oakLine: 'rgba(20,12,7,.55)',
  brass:  '#d8b070', brassHi: '#ffe6b4', brassLo: '#7a5c30',
  steel:  '#cfd8de', steelHi: '#ffffff', steelLo: '#5d6a74',
  chalk:  'rgba(214,232,240,.62)',
  ember:  '#ffcf84',
};
/* the marble colours, as a plain list (six glass tints) */
export const MARBLE_COLS = [
  ['#9fdcf2', '#2a7c9c'], ['#ffb6c8', '#a03e5c'], ['#ffdf9a', '#a87a20'],
  ['#b2ecc0', '#357a49'], ['#cbb6f6', '#5a3fa0'], ['#ffc39a', '#a85a2a'],
];

/* ── the wall texture, drawn once into an offscreen canvas ───────────────── */
export function makeWall(W, H, wallW, wallH) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const px = W / wallW;                        // pixels per metre

  const base = g.createLinearGradient(0, 0, W * 0.30, H);
  base.addColorStop(0, '#3b2a1c'); base.addColorStop(0.5, '#291c12');
  base.addColorStop(1, '#150e09');
  g.fillStyle = base; g.fillRect(0, 0, W, H);

  // planks, vertical, each its own tone
  let seed = 20260730;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const plank = 0.212 * px;
  for (let x = -plank * 0.4; x < W + plank; x += plank) {
    const w = plank * (0.88 + rnd() * 0.24);
    g.fillStyle = (rnd() < 0.5 ? 'rgba(255,206,146,' : 'rgba(0,0,0,')
                + (0.018 + rnd() * 0.045).toFixed(3) + ')';
    g.fillRect(x, 0, w, H);
    // the shadowed groove between boards, and the lit edge of the next
    g.fillStyle = 'rgba(12,7,3,.60)'; g.fillRect(x - 1.4, 0, 2.4, H);
    g.fillStyle = 'rgba(255,214,158,.055)'; g.fillRect(x + 1.0, 0, 1.4, H);
    // grain: long shallow arcs, the way quartersawn oak reads
    for (let k = 0; k < 22; k++) {
      const gy = rnd() * H * 1.1 - H * 0.05, amp = (3 + rnd() * 14);
      g.strokeStyle = 'rgba(18,10,4,' + (0.07 + rnd() * 0.13).toFixed(3) + ')';
      g.lineWidth = 0.5 + rnd() * 1.4;
      g.beginPath();
      for (let i = 0; i <= 12; i++) {
        const t = i / 12, xx = x + t * w;
        const yy = gy + Math.sin(t * 3.1 + k * 1.7) * amp;
        i ? g.lineTo(xx, yy) : g.moveTo(xx, yy);
      }
      g.stroke();
    }
    // an occasional knot
    if (rnd() < 0.28) {
      const kx = x + w * (0.25 + rnd() * 0.5), ky = rnd() * H;
      for (let r = 1; r < 7; r++) {
        g.strokeStyle = 'rgba(16,9,4,' + (0.30 - r * 0.035).toFixed(3) + ')';
        g.lineWidth = 1.1;
        g.beginPath();
        g.ellipse(kx, ky, r * 2.1 * (1 + rnd() * 0.2), r * 3.6, 0.2, 0, 7);
        g.stroke();
      }
    }
  }
  // the lamp, up and to the left — warm, and not very wide
  const lamp = g.createRadialGradient(W * 0.20, -H * 0.05, 0, W * 0.20, -H * 0.05, H * 1.05);
  lamp.addColorStop(0, 'rgba(255,206,138,.26)');
  lamp.addColorStop(0.40, 'rgba(255,178,104,.075)');
  lamp.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = lamp; g.fillRect(0, 0, W, H);
  // deep shade into the corners
  const vig = g.createRadialGradient(W * 0.36, H * 0.34, H * 0.10, W * 0.5, H * 0.52, H * 1.0);
  vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(0.55, 'rgba(0,0,0,.28)');
  vig.addColorStop(1, 'rgba(0,0,0,.80)');
  g.fillStyle = vig; g.fillRect(0, 0, W, H);
  return c;
}

/* ── little helpers ───────────────────────────────────────────────────────── */
function shadowed(g, fn, dx, dy, blur, col) {
  g.save();
  g.shadowOffsetX = dx; g.shadowOffsetY = dy; g.shadowBlur = blur;
  g.shadowColor = col || 'rgba(0,0,0,.55)';
  fn();
  g.restore();
}

/* ── a rail: brass wire, lit from the upper left ─────────────────────────── */
export function drawRail(g, V, p, hot) {
  const ax = V.X(p.ax), ay = V.Y(p.ay), bx = V.X(p.bx), by = V.Y(p.by);
  const w = Math.max(2.4, V.s * 0.0058);
  shadowed(g, () => {
    g.strokeStyle = p.fixed ? '#6b6055' : PAL.brassLo;
    g.lineWidth = w * 1.25; g.lineCap = 'round';
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
  }, w * 0.5, w * 0.9, w * 1.6);
  const gr = g.createLinearGradient(ax, ay - w, ax, ay + w);
  if (p.fixed) { gr.addColorStop(0, '#a99c8b'); gr.addColorStop(0.45, '#8b7d6c'); gr.addColorStop(1, '#544a3e'); }
  else { gr.addColorStop(0, PAL.brassHi); gr.addColorStop(0.4, PAL.brass); gr.addColorStop(1, PAL.brassLo); }
  g.strokeStyle = hot ? '#fff3d8' : gr;
  g.lineWidth = w; g.lineCap = 'round';
  g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.30)'; g.lineWidth = Math.max(0.8, w * 0.22);
  g.beginPath(); g.moveTo(ax, ay - w * 0.28); g.lineTo(bx, by - w * 0.28); g.stroke();
}

/* ── a bar: steel, on two cords at its own nodal points ──────────────────── */
export const NODE_FRAC = 0.2242;   // where a free-free bar does not move

export function drawBar(g, V, p, glow, showName, nameSize) {
  const ax = V.X(p.ax), ay = V.Y(p.ay), bx = V.X(p.bx), by = V.Y(p.by);
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const w = Math.max(4.5, V.s * 0.0135);        // the bar's drawn depth

  // the two cords it rests on
  g.strokeStyle = 'rgba(226,206,170,.45)'; g.lineWidth = Math.max(1, V.s * 0.0016);
  for (const f of [NODE_FRAC, 1 - NODE_FRAC]) {
    const cx = ax + dx * f, cy = ay + dy * f;
    g.beginPath();
    g.moveTo(cx - nx * w * 1.5, cy - ny * w * 1.5);
    g.lineTo(cx + nx * w * 1.5, cy + ny * w * 1.5);
    g.stroke();
  }

  const quad = (o) => {
    g.beginPath();
    g.moveTo(ax + nx * o, ay + ny * o); g.lineTo(bx + nx * o, by + ny * o);
    g.lineTo(bx - nx * o, by - ny * o); g.lineTo(ax - nx * o, ay - ny * o);
    g.closePath();
  };
  shadowed(g, () => { g.fillStyle = '#20272c'; quad(w * 0.5); g.fill(); },
           w * 0.4, w * 0.85, w * 1.5);

  const gr = g.createLinearGradient(ax - nx * w * 0.5, ay - ny * w * 0.5,
                                    ax + nx * w * 0.5, ay + ny * w * 0.5);
  gr.addColorStop(0, '#f2f7fa'); gr.addColorStop(0.22, PAL.steel);
  gr.addColorStop(0.62, '#98a5ae'); gr.addColorStop(1, PAL.steelLo);
  g.fillStyle = gr; quad(w * 0.5); g.fill();

  if (glow > 0.001) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.shadowBlur = w * (2 + 10 * glow); g.shadowColor = 'rgba(255,214,150,.95)';
    g.fillStyle = 'rgba(255,226,178,' + (0.55 * glow).toFixed(3) + ')';
    quad(w * 0.5); g.fill();
    g.restore();
  }
  g.strokeStyle = 'rgba(255,255,255,.42)'; g.lineWidth = Math.max(0.8, w * 0.13);
  g.beginPath();
  g.moveTo(ax + nx * w * 0.34, ay + ny * w * 0.34);
  g.lineTo(bx + nx * w * 0.34, by + ny * w * 0.34);
  g.stroke();

  if (showName) {
    g.save();
    g.translate((ax + bx) / 2, (ay + by) / 2);
    let a = Math.atan2(dy, dx);
    if (a > Math.PI / 2 || a < -Math.PI / 2) a += Math.PI;   // never upside down
    g.rotate(a);
    const fs = nameSize || 11;
    g.font = '600 ' + fs.toFixed(1) + 'px ui-monospace,Menlo,monospace';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(10,7,4,.55)';
    g.fillText(showName, 0.6, -w * 0.98 + 0.6);
    g.fillStyle = glow > 0.05 ? '#fff0cc' : 'rgba(232,222,206,.80)';
    g.fillText(showName, 0, -w * 0.98);
    g.restore();
  }
}

/* ── the flip-gate: a funnel and a rocker ────────────────────────────────── */
export function drawGate(g, V, gt, hot) {
  const w = Math.max(2.2, V.s * 0.0050);
  for (let i = 0; i < 2; i++) {
    const s = gt.segs[i];
    shadowed(g, () => {
      g.strokeStyle = '#6a5a44'; g.lineWidth = w * 1.3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(V.X(s.ax), V.Y(s.ay)); g.lineTo(V.X(s.bx), V.Y(s.by)); g.stroke();
    }, w * 0.4, w * 0.8, w * 1.4);
    g.strokeStyle = hot ? '#fff3d8' : '#b79a68'; g.lineWidth = w; g.lineCap = 'round';
    g.beginPath(); g.moveTo(V.X(s.ax), V.Y(s.ay)); g.lineTo(V.X(s.bx), V.Y(s.by)); g.stroke();
  }
  const v = gt.segs[2];
  const vw = Math.max(3.5, V.s * 0.0085);
  shadowed(g, () => {
    g.strokeStyle = '#3a2f22'; g.lineWidth = vw * 1.25; g.lineCap = 'round';
    g.beginPath(); g.moveTo(V.X(v.ax), V.Y(v.ay)); g.lineTo(V.X(v.bx), V.Y(v.by)); g.stroke();
  }, vw * 0.4, vw * 0.8, vw * 1.5);
  const gr = g.createLinearGradient(V.X(v.ax), V.Y(v.ay), V.X(v.bx), V.Y(v.by));
  gr.addColorStop(0, hot ? '#fff' : '#e6cf9a'); gr.addColorStop(1, hot ? '#ffe' : '#9c8250');
  g.strokeStyle = gr; g.lineWidth = vw; g.lineCap = 'round';
  g.beginPath(); g.moveTo(V.X(v.ax), V.Y(v.ay)); g.lineTo(V.X(v.bx), V.Y(v.by)); g.stroke();
  // the pivot
  const px = V.X(gt.px), py = V.Y(gt.py), r = Math.max(2.5, V.s * 0.0055);
  g.fillStyle = '#2a2118'; g.beginPath(); g.arc(px, py, r * 1.5, 0, 7); g.fill();
  g.fillStyle = PAL.brass; g.beginPath(); g.arc(px, py, r, 0, 7); g.fill();
}

/* ── a marble: glass, with a specular and a caught highlight ─────────────── */
export function drawMarble(g, V, m, alpha) {
  const x = V.X(m.x), y = V.Y(m.y), r = V.s * 0.008;
  const [lit, dark] = MARBLE_COLS[m.colour % MARBLE_COLS.length];
  g.save();
  if (alpha !== undefined) g.globalAlpha = alpha;
  // the streak, when it is moving fast
  const sp = Math.hypot(m.vx || 0, m.vy || 0);
  if (sp > 1.1) {
    const k = Math.min(1, (sp - 1.1) / 3.2) * r * 2.6;
    g.strokeStyle = 'rgba(255,255,255,.10)'; g.lineWidth = r * 1.7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y);
    g.lineTo(x - (m.vx / sp) * k, y - (m.vy / sp) * k); g.stroke();
  }
  g.shadowOffsetX = r * 0.45; g.shadowOffsetY = r * 0.85; g.shadowBlur = r * 1.5;
  g.shadowColor = 'rgba(0,0,0,.62)';
  const gr = g.createRadialGradient(x - r * 0.36, y - r * 0.40, r * 0.06, x, y, r);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.20, lit);
  gr.addColorStop(0.72, dark); gr.addColorStop(1, '#141a1e');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.shadowColor = 'transparent';
  g.fillStyle = 'rgba(255,255,255,.85)';
  g.beginPath(); g.ellipse(x - r * 0.34, y - r * 0.40, r * 0.24, r * 0.17,
                           -0.6, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,.20)';
  g.beginPath(); g.ellipse(x + r * 0.28, y + r * 0.34, r * 0.30, r * 0.14, -0.5, 0, 7); g.fill();
  g.restore();
}

/* ── the traced path, painted with WHEN the marble is there ──────────────── */
export function drawTrace(g, V, tr, beat, tNow) {
  if (!tr || tr.path.length < 3) return;
  g.save();
  g.setLineDash([V.s * 0.010, V.s * 0.011]);
  g.strokeStyle = PAL.chalk; g.lineWidth = Math.max(1, V.s * 0.0018);
  g.beginPath();
  for (let i = 0; i < tr.path.length; i++) {
    const q = tr.path[i];
    i ? g.lineTo(V.X(q.x), V.Y(q.y)) : g.moveTo(V.X(q.x), V.Y(q.y));
  }
  g.stroke();
  g.setLineDash([]);

  // a tick where the marble is at each half-beat; numbered on the beat
  const last = tr.path[tr.path.length - 1].t;
  const half = beat / 2;
  for (let k = 1; k * half < last; k++) {
    const t = k * half, whole = (k % 2 === 0);
    const p = at(tr.path, t); if (!p) break;
    const q = at(tr.path, t + 0.012) || p;
    const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1;
    const nx = -dy / d, ny = dx / d;
    const X = V.X(p.x), Y = V.Y(p.y), L = V.s * (whole ? 0.020 : 0.0105);
    g.strokeStyle = whole ? 'rgba(255,222,164,.95)' : 'rgba(206,232,244,.50)';
    g.lineWidth = Math.max(1.2, V.s * (whole ? 0.0030 : 0.0018));
    g.beginPath();
    g.moveTo(X - nx * L, Y - ny * L); g.lineTo(X + nx * L, Y + ny * L); g.stroke();
    if (whole) {
      const fs = Math.max(10, V.s * 0.0145);
      g.fillStyle = 'rgba(255,222,164,.95)';
      g.font = '600 ' + fs.toFixed(0) + 'px ui-monospace,Menlo,monospace';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      const lx = X + nx * L * 1.85, ly = Y + ny * L * 1.85;
      g.fillStyle = 'rgba(12,8,5,.72)';
      g.beginPath(); g.arc(lx, ly, fs * 0.72, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,222,164,.95)';
      g.fillText(String(k / 2), lx, ly + 0.5);
    }
  }
  if (tNow !== undefined && tNow !== null) {
    const p = at(tr.path, tNow);
    if (p) {
      g.fillStyle = 'rgba(255,240,210,.55)';
      g.beginPath(); g.arc(V.X(p.x), V.Y(p.y), V.s * 0.0055, 0, 7); g.fill();
    }
  }
  g.restore();
}
function at(path, tt) {
  if (tt <= path[0].t) return path[0];
  if (tt >= path[path.length - 1].t) return null;
  let lo = 0, hi = path.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (path[m].t <= tt) lo = m; else hi = m; }
  const a = path[lo], b = path[hi], f = (tt - a.t) / Math.max(1e-12, b.t - a.t);
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}

/* ── the programming wheel ───────────────────────────────────────────────── */
export function drawWheel(g, V, cx, cy, R, steps, phase, active) {
  const X = V.X(cx), Y = V.Y(cy), r = R * V.s;
  shadowed(g, () => {
    g.fillStyle = '#2c2318'; g.beginPath(); g.arc(X, Y, r * 1.02, 0, 7); g.fill();
  }, r * 0.08, r * 0.16, r * 0.30);
  const gr = g.createLinearGradient(X - r, Y - r, X + r * 0.6, Y + r);
  gr.addColorStop(0, '#e8c68c'); gr.addColorStop(0.42, '#b8945c');
  gr.addColorStop(0.75, '#8a6c3e'); gr.addColorStop(1, '#c8a468');
  g.fillStyle = gr; g.beginPath(); g.arc(X, Y, r, 0, 7); g.fill();
  g.strokeStyle = 'rgba(255,236,196,.35)'; g.lineWidth = Math.max(1, r * 0.02);
  g.beginPath(); g.arc(X, Y, r * 0.965, 0, 7); g.stroke();
  g.strokeStyle = 'rgba(60,42,20,.55)'; g.lineWidth = Math.max(1, r * 0.014);
  g.beginPath(); g.arc(X, Y, r * 0.50, 0, 7); g.stroke();

  const pr = r * 0.775, pegR = r * 0.098;
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI / 2 + (i - phase) * (Math.PI * 2 / 16);
    const px = X + Math.cos(a) * pr, py = Y + Math.sin(a) * pr;
    g.fillStyle = 'rgba(40,26,12,.75)';
    g.beginPath(); g.arc(px, py, pegR * 1.18, 0, 7); g.fill();
    if (steps[i]) {
      const on = (i === active);
      g.shadowBlur = on ? pegR * 3.2 : 0;
      g.shadowColor = 'rgba(255,206,140,.9)';
      g.fillStyle = on ? '#fff0cc' : '#f0d49a';
      g.beginPath(); g.arc(px, py, pegR, 0, 7); g.fill();
      g.shadowBlur = 0;
      g.fillStyle = 'rgba(255,255,255,.55)';
      g.beginPath(); g.arc(px - pegR * 0.28, py - pegR * 0.3, pegR * 0.3, 0, 7); g.fill();
    } else {
      g.fillStyle = '#5a4830';
      g.beginPath(); g.arc(px, py, pegR * 0.62, 0, 7); g.fill();
    }
  }
  // the hub, and the follower that reads the top of the wheel
  g.fillStyle = '#3a2c1c'; g.beginPath(); g.arc(X, Y, r * 0.17, 0, 7); g.fill();
  g.fillStyle = PAL.brass; g.beginPath(); g.arc(X, Y, r * 0.10, 0, 7); g.fill();
  g.strokeStyle = 'rgba(255,236,196,.75)'; g.lineWidth = Math.max(1.2, r * 0.030);
  g.beginPath(); g.moveTo(X, Y - r * 1.20); g.lineTo(X, Y - r * 0.90); g.stroke();
}

/* ── the return lift: a belt of little buckets ───────────────────────────── */
export function drawLift(g, V, LIFT, phase, riders) {
  const X = V.X(LIFT.x), yb = V.Y(LIFT.yBot), yt = V.Y(LIFT.yTop);
  const wid = V.s * 0.030, pr = V.s * 0.026;
  shadowed(g, () => {
    g.fillStyle = '#241a12';
    g.fillRect(X - wid, yt - pr, wid * 2, yb - yt + pr * 2);
  }, V.s * 0.004, V.s * 0.007, V.s * 0.012);
  g.strokeStyle = 'rgba(120,100,72,.85)'; g.lineWidth = Math.max(1.2, V.s * 0.0022);
  g.beginPath(); g.moveTo(X - wid * 0.62, yt); g.lineTo(X - wid * 0.62, yb);
  g.moveTo(X + wid * 0.62, yt); g.lineTo(X + wid * 0.62, yb); g.stroke();
  for (const yy of [yt, yb]) {
    g.fillStyle = '#4c3c26'; g.beginPath(); g.arc(X, yy, pr, 0, 7); g.fill();
    g.fillStyle = PAL.brass; g.beginPath(); g.arc(X, yy, pr * 0.42, 0, 7); g.fill();
  }
  const span = yb - yt, n = 9;
  for (let i = 0; i < n; i++) {
    const u = ((i / n) + phase) % 1;
    const yy = yb - u * span;
    g.fillStyle = '#7a6242';
    g.beginPath();
    g.moveTo(X - wid * 0.62, yy);
    g.lineTo(X - wid * 0.62 + V.s * 0.019, yy);
    g.lineTo(X - wid * 0.62 + V.s * 0.015, yy - V.s * 0.013);
    g.closePath(); g.fill();
  }
  for (const m of riders) {
    const yy = yb - m.lift * span;
    drawMarble(g, V, { x: LIFT.x - 0.006, y: V.iY(yy), vx: 0, vy: 0, colour: m.colour }, 1);
  }
}

/* ── the spark where a marble met a bar ──────────────────────────────────── */
export function drawSpark(g, V, sp) {
  const x = V.X(sp.x), y = V.Y(sp.y), k = sp.life;
  g.save();
  g.globalCompositeOperation = 'lighter';
  const r = V.s * 0.012 * (1 + (1 - k) * 2.6);
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, 'rgba(255,240,210,' + (0.85 * k).toFixed(3) + ')');
  gr.addColorStop(0.4, 'rgba(255,206,140,' + (0.34 * k).toFixed(3) + ')');
  gr.addColorStop(1, 'rgba(255,180,90,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.strokeStyle = 'rgba(255,238,200,' + (0.55 * k * k).toFixed(3) + ')';
  g.lineWidth = Math.max(1, V.s * 0.0016);
  for (let i = 0; i < 5; i++) {
    const a = sp.a + i * 1.2566, L = r * (0.7 + 0.5 * ((i * 7) % 3));
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
  }
  g.restore();
}
