/* ============================================================================
 *  THE AVIARY -- score.js
 *
 *  The plane itself, drawn.  Horizontal is alpha, the pressure the bird pushes
 *  with; vertical is beta, how tight it holds the labia -- labelled in hertz,
 *  because f = gamma*sqrt(beta)/(2 pi) and that is the whole point.
 *
 *  Everything shaded here comes from core.mjs's algebra and nothing from a
 *  measurement.  The measurements get drawn ON TOP, which is the argument.
 * ========================================================================== */

/* The VERTICAL axis is sqrt(beta), not beta -- which makes it linear in HERTZ,
   because f = gamma*sqrt(beta)/2pi.  So the ruling is an even pitch ruling, a
   drawn straight line is a straight glissando, and the fold (all of which lives
   under beta = 1/4) gets a third of the height instead of a ninth. */
export function makeView(w, h, o) {
  const pad = o.pad || { l: 46, r: 54, t: 14, b: 26 };
  const aMin = o.aMin, aMax = o.aMax, bMin = o.bMin, bMax = o.bMax;
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const r0 = Math.sqrt(Math.max(0, bMin)), r1 = Math.sqrt(Math.max(1e-9, bMax));
  return {
    w: w, h: h, pad: pad, aMin: aMin, aMax: aMax, bMin: bMin, bMax: bMax,
    gamma: o.gamma || 23500,
    x: (a) => pad.l + (a - aMin) / (aMax - aMin) * iw,
    y: (b) => pad.t + ih - (Math.sqrt(Math.max(0, b)) - r0) / (r1 - r0) * ih,
    ia: (px) => aMin + (px - pad.l) / iw * (aMax - aMin),
    ib: (py) => { const r = r0 + (pad.t + ih - py) / ih * (r1 - r0); return Math.max(0, r * r); },
    inside: (px, py) => px >= pad.l && px <= pad.l + iw && py >= pad.t && py <= pad.t + ih,
  };
}

const TAU = Math.PI * 2;
const hz = (b, g) => g * Math.sqrt(Math.max(b, 0)) / TAU;
const beta = (f, g) => { const w = TAU * f / g; return w * w; };

/* The plane: the two shaded regions and the two boundaries. `sn` is the
   saddle-node function handed in from the core, so this file owns no algebra. */
export function drawPlane(ctx, v, sn, o) {
  o = o || {};
  const P = v.pad, iw = v.w - P.l - P.r, ih = v.h - P.t - P.b;
  ctx.save();
  ctx.clearRect(0, 0, v.w, v.h);

  /* the field */
  ctx.beginPath(); ctx.rect(P.l, P.t, iw, ih); ctx.clip();
  const g = ctx.createLinearGradient(0, P.t, 0, P.t + ih);
  g.addColorStop(0, 'rgba(30,26,44,0.92)'); g.addColorStop(1, 'rgba(16,14,22,0.94)');
  ctx.fillStyle = g; ctx.fillRect(P.l, P.t, iw, ih);

  /* SILENT: everything at or left of the Hopf line */
  ctx.fillStyle = 'rgba(8,9,16,0.80)';
  ctx.fillRect(P.l, P.t, Math.max(0, v.x(0) - P.l), ih);

  /* the region where a quiet state still exists: under the fold */
  ctx.beginPath();
  ctx.moveTo(v.x(0), v.y(0.25));
  for (let i = 0; i <= 80; i++) {
    const b = 0.25 * (1 - i / 80);
    const a = sn(b);
    ctx.lineTo(v.x(a === null ? 0 : a), v.y(b));
  }
  ctx.lineTo(v.x(0), v.y(v.bMin));
  ctx.closePath();
  ctx.fillStyle = 'rgba(10,11,19,0.62)';
  ctx.fill();

  /* the sounding field gets a warm wash toward the top right */
  const g2 = ctx.createLinearGradient(v.x(0), 0, P.l + iw, 0);
  g2.addColorStop(0, 'rgba(232,158,72,0.00)');
  g2.addColorStop(1, 'rgba(232,158,72,0.13)');
  ctx.fillStyle = g2;
  ctx.fillRect(v.x(0), P.t, P.l + iw - v.x(0), ih);
  ctx.restore();

  /* ── grid: hertz across, pressure down ────────────────────────────────── */
  ctx.save();
  ctx.beginPath(); ctx.rect(P.l, P.t, iw, ih); ctx.clip();
  ctx.strokeStyle = 'rgba(224,196,150,0.10)'; ctx.lineWidth = 1;
  ctx.font = '9px ui-monospace,SFMono-Regular,Menlo,monospace';
  ctx.fillStyle = 'rgba(224,196,150,0.42)';
  const marks = o.hzMarks || [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 7000];
  const labels = [];
  for (const f of marks) {
    const b = beta(f, v.gamma);
    if (b < v.bMin || b > v.bMax) continue;
    const y = v.y(b);
    ctx.beginPath(); ctx.moveTo(P.l, y); ctx.lineTo(P.l + iw, y); ctx.stroke();
    labels.push([f, y]);
  }
  ctx.strokeStyle = 'rgba(224,196,150,0.07)';
  for (let a = 0; a <= v.aMax; a += o.aStep || 0.1) {
    if (a < v.aMin) continue;
    const x = v.x(a);
    ctx.beginPath(); ctx.moveTo(x, P.t); ctx.lineTo(x, P.t + ih); ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.font = '9px ui-monospace,SFMono-Regular,Menlo,monospace';
  ctx.fillStyle = 'rgba(224,196,150,0.46)';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (const [f, y] of labels) ctx.fillText((f / 1000).toFixed(f % 1000 ? 1 : 0) + 'k', P.l + iw + 6, y);
  ctx.restore();

  /* ── the two boundaries, drawn from the algebra ───────────────────────── */
  ctx.save();
  ctx.beginPath(); ctx.rect(P.l - 1, P.t - 1, iw + 2, ih + 2); ctx.clip();
  /* Hopf */
  ctx.strokeStyle = 'rgba(150,196,255,0.85)'; ctx.lineWidth = 1.6;
  ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(v.x(0), P.t); ctx.lineTo(v.x(0), P.t + ih); ctx.stroke();
  /* fold */
  ctx.strokeStyle = 'rgba(255,176,120,0.92)'; ctx.lineWidth = 1.8;
  ctx.beginPath();
  let started = false;
  for (let i = 0; i <= 120; i++) {
    const b = 0.25 * i / 120;
    const a = sn(b); if (a === null) continue;
    const X = v.x(a), Y = v.y(b);
    if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
  }
  ctx.stroke();
  /* the roof, if it is in view at all */
  if (v.aMax > 2) {
    ctx.strokeStyle = 'rgba(150,196,255,0.55)'; ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(v.x(v.bMin + 2), v.y(v.bMin));
    ctx.lineTo(v.x(v.bMax + 2), v.y(v.bMax));
    ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.restore();

  /* ── frame + labels ───────────────────────────────────────────────────── */
  ctx.strokeStyle = 'rgba(224,196,150,0.26)'; ctx.lineWidth = 1;
  ctx.strokeRect(P.l + 0.5, P.t + 0.5, iw - 1, ih - 1);
  ctx.font = '9px ui-monospace,SFMono-Regular,Menlo,monospace';
  ctx.fillStyle = 'rgba(224,196,150,0.55)';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('PRESSURE  α  →', P.l + iw * 0.5, P.t + ih + 8);
  ctx.save();
  ctx.translate(12, P.t + ih * 0.5); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('TENSION  √β  ∝  PITCH  →', 0, 0);
  ctx.restore();
  if (o.legend !== false) {
    ctx.save();
    ctx.font = '9px ui-monospace,SFMono-Regular,Menlo,monospace';
    /* alongside the Hopf line, reading up it */
    ctx.translate(v.x(0) - 4, P.t + ih - 8);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(150,196,255,0.72)';
    ctx.fillText('α = 0 · SILENT LEFT OF HERE', 0, 0);
    ctx.restore();
    /* and by the fold, where there is room */
    const fa = sn(0.06);
    if (fa !== null) {
      ctx.save();
      ctx.font = '9px ui-monospace,SFMono-Regular,Menlo,monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,176,120,0.78)';
      ctx.fillText('the fold', Math.min(v.x(fa) + 7, P.l + iw - 54), v.y(0.06));
      ctx.restore();
    }
  }
}

export function drawPath(ctx, v, pts, style) {
  if (!pts || pts.length < 2) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(v.pad.l, v.pad.t, v.w - v.pad.l - v.pad.r, v.h - v.pad.t - v.pad.b);
  ctx.clip();
  ctx.strokeStyle = style.color; ctx.lineWidth = style.width || 1.6;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (style.dash) ctx.setLineDash(style.dash);
  const brk = style.breakBelow;
  ctx.beginPath();
  let open = false;
  for (let i = 0; i < pts.length; i++) {
    if (brk != null && pts[i][1] < brk) { open = false; continue; }
    const X = v.x(pts[i][1]), Y = v.y(pts[i][2]);
    if (!open) { ctx.moveTo(X, Y); open = true; } else ctx.lineTo(X, Y);
  }
  ctx.stroke();
  ctx.restore();
}

/* the live head: where the syrinx is RIGHT NOW, with a fading tail */
export function drawComet(ctx, v, hist, colour) {
  if (!hist || !hist.length) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(v.pad.l, v.pad.t, v.w - v.pad.l - v.pad.r, v.h - v.pad.t - v.pad.b);
  ctx.clip();
  for (let i = 1; i < hist.length; i++) {
    if (hist[i][0] < 0.004 || hist[i - 1][0] < 0.004) continue;
    const t = i / hist.length;
    ctx.strokeStyle = colour.replace('ALPHA', (t * t * 0.85).toFixed(3));
    ctx.lineWidth = 0.8 + 2.4 * t * hist[i][2];
    ctx.beginPath();
    ctx.moveTo(v.x(hist[i - 1][0]), v.y(hist[i - 1][1]));
    ctx.lineTo(v.x(hist[i][0]), v.y(hist[i][1]));
    ctx.stroke();
  }
  const h = hist[hist.length - 1];
  if (h[0] < 0.004) { ctx.restore(); return; }
  const r = 2.2 + 7 * Math.min(1, h[2] * 3);
  const gg = ctx.createRadialGradient(v.x(h[0]), v.y(h[1]), 0, v.x(h[0]), v.y(h[1]), r * 2.4);
  gg.addColorStop(0, colour.replace('ALPHA', '0.95'));
  gg.addColorStop(1, colour.replace('ALPHA', '0'));
  ctx.fillStyle = gg;
  ctx.beginPath(); ctx.arc(v.x(h[0]), v.y(h[1]), r * 2.4, 0, TAU); ctx.fill();
  ctx.restore();
}

export function hzAt(b, gamma) { return hz(b, gamma); }
export function betaAt(f, gamma) { return beta(f, gamma); }
