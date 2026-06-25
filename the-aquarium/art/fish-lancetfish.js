// @kind fish
// @assetKey fish-lancetfish
// Lancetfish — the apex DART (foundry final; base = take #2, judges' grafts applied)
//
// Direction: a true knife. The whole body is a travelling sine wave whipping
// from a still head to a hard tail snap — not a rotated decal, not a flapped
// teardrop. A long needle snout, a single hard LOW dorsal ridge, a deeply
// forked lunate tail, and a cold specular sheen that rakes the upper flank like
// daylight on steel. Spare, lean, a little menacing. Lit from above.
//
// The body is rendered as a closed ribbon between a top edgeline and a bottom
// edgeline sampled along a flexing centreline, then traced as continuous
// quadratics so the silhouette has no polygon facets — the wave reads as
// muscle, not a hinge.
//
// FINAL grafts onto take #2 (judge consensus winner):
//  • smooth the body + sheen edgelines with quadratic-midpoint tracing
//    (take #1's continuous-outline craft) so there are no visible kinks;
//  • lean the mid-body a hair and ease/thicken the snout so it reads as a hard
//    predatory jaw, not an over-long thread, at small tank scale;
//  • strengthen the cold specular sheen into a thin, reliably-present raking
//    stripe high on the flank (take #1's gradient/sheen reliability);
//  • push the tail-beat amplitude a touch toward take #1's drama, boil-sharpened,
//    and rigidly anchor the caudal lobes to the last peduncle node so they never
//    float off at maximum flex.

window.__ASSET = function drawLancetfish(ctx, p) {
  const TAU = p.TAU || Math.PI * 2;
  const s = p.s, L = p.L != null ? p.L : s * 2.0;
  const ph = p.ph || 0;
  const boil = Math.max(0, Math.min(1, p.boil || 0));
  const light = Math.max(0, Math.min(1, p.light != null ? p.light : 1));
  const baseCol = p.col || '#cdd7ee';

  if (light <= 0.02) return;

  // ── palette: cold steel-blue derived from the species colour ──────────────
  const c = hexToRgb(baseCol);
  // a darker indigo belly/back-shade and a near-white cold highlight
  const shade = mix(c, { r: 30, g: 44, b: 86 }, 0.62);   // deep indigo flank shadow
  const sheen = mix(c, { r: 244, g: 248, b: 255 }, 0.7); // cold daylight specular
  const dark  = mix(c, { r: 12, g: 18, b: 38 }, 0.82);   // body outline / underside

  // depth dims everything; the apex carries no self-glow
  const A = light;

  // ── swim drive: a travelling body-wave + a crisp tail snap ───────────────
  // amplitude grows toward the tail (head is nearly rigid — that's the menace);
  // boil sharpens the snap and tightens the wavelength. GRAFT: amplitude pushed
  // a touch toward take #1's drama so the beat traverses crisply pose-to-pose.
  const amp = s * (0.74 + 0.46 * boil);     // peak lateral throw near the tail (px)
  const k   = 1.55 + 0.70 * boil;           // spatial frequency (waves along body)
  // a touch of crest sharpening on boil for the "snap", but never a hook
  const snap = 0.10 + 0.22 * boil;

  // centreline lateral offset y(x) for a head-fixed travelling wave.
  // u in [0..1] runs nose(0)→tail(1); stiffness keeps the front half still
  // (head rigid = menace), amplitude swelling smoothly to the peduncle.
  function lateral(u) {
    const stiff = smooth(0.22, 1.0, u);      // 0 at nose region, 1 at tail
    const env = stiff * stiff * stiff;       // cubic envelope — very quiet front
    // travelling wave + mild crest sharpening near full boil
    const wave = Math.sin(k * u * TAU * 0.5 - ph);
    const crest = Math.sign(wave) * Math.pow(Math.abs(wave), 1 - snap * 0.5);
    return env * amp * crest;
  }

  // body half-height profile h(x): needle snout → lean blade → pinched peduncle.
  // u: 0 nose, 1 tail-base. Deliberately SHALLOW + LONG — a knife, not a teardrop.
  // GRAFT: snout eased (thicker hard tip so it reads as a jaw, not a thread) and
  // the blade peak leaned from ~0.58·s to ~0.54·s for a slimmer knife profile.
  function halfH(u) {
    // a needle snout that starts as a hard point (not a thread) and thickens
    // through the front ~22%; the blade peaks low (~0.54·s) just behind the head,
    // then a long straight taper to a thin peduncle — the keel runs the whole length.
    if (u < 0.22) {
      const t = u / 0.22;
      return s * (0.060 + 0.42 * Math.pow(t, 0.78)); // hard needle tip → shoulder
    } else if (u < 0.34) {
      const t = (u - 0.22) / 0.12;
      return s * (0.48 + 0.06 * Math.sin(t * Math.PI * 0.5)); // shoulder, peaks ~0.54
    } else {
      const t = (u - 0.34) / 0.66;
      return s * (0.54 * (1 - t) + 0.075 * t) * (1 - 0.12 * t); // long lean taper
    }
  }

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const N = 28;                        // spine samples nose→tail (denser = smoother)
  const noseX = L * 1.12, baseX = -L * 0.82; // eased needle nose; tail-base short of −L
  const top = [], bot = [], mid = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const x = noseX + (baseX - noseX) * u;
    const yc = lateral(u);
    const h = halfH(u);
    mid.push({ x, y: yc, h, u });
  }
  // perpendicular offsets using finite-difference tangents
  for (let i = 0; i <= N; i++) {
    const a = mid[Math.max(0, i - 1)], b = mid[Math.min(N, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;       // unit normal
    const m = mid[i];
    top.push({ x: m.x + nx * m.h, y: m.y + ny * m.h });
    bot.push({ x: m.x - nx * m.h, y: m.y - ny * m.h });
  }

  // GRAFT (take #1's craft): trace a point list as continuous quadratics through
  // midpoints so the edge is a smooth curve with no polygon kinks.
  function traceSmooth(pts) {
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  }

  // build the closed body path: sharp nose, smooth top edge nose→tail, then
  // smooth bottom edge tail→nose. Reversed-copy the bottom for the return run.
  const botRev = bot.slice().reverse();
  ctx.beginPath();
  ctx.moveTo(mid[0].x, mid[0].y); // sharp nose point
  ctx.lineTo(top[0].x, top[0].y);
  traceSmooth(top);
  ctx.lineTo(botRev[0].x, botRev[0].y);
  traceSmooth(botRev);
  ctx.lineTo(mid[0].x, mid[0].y); // close back at the sharp nose
  ctx.closePath();

  // ── body fill: a vertical cold gradient (lit back, indigo belly) ──────────
  const grad = ctx.createLinearGradient(0, -s * 1.2, 0, s * 1.2);
  grad.addColorStop(0.0, rgba(sheen, 0.96 * A));
  grad.addColorStop(0.30, rgba(c, 0.97 * A));
  grad.addColorStop(0.62, rgba(c, 0.95 * A));
  grad.addColorStop(1.0, rgba(shade, 0.96 * A));
  ctx.fillStyle = grad;
  ctx.fill();

  // crisp dark keel outline (knife edge)
  ctx.lineWidth = Math.max(0.6, s * 0.075);
  ctx.strokeStyle = rgba(dark, 0.85 * A);
  ctx.stroke();

  // ── the dorsal: a long, LOW hard ridge running the mid-back (not a sail) ──
  {
    const i0 = Math.round(N * 0.30), iM = Math.round(N * 0.44), i1 = Math.round(N * 0.60);
    const root0 = top[i0], rootM = top[iM], root1 = top[i1];
    const peakH = s * (0.50 + 0.15 * boil);     // LOW ridge, not a sail
    const aBack = mid[Math.min(N, iM + 1)];
    const aFwd = mid[Math.max(0, iM - 1)];
    const dx = aBack.x - aFwd.x, dy = aBack.y - aFwd.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const peakX = rootM.x + nx * peakH - L * 0.10; // swept aft, low
    const peakY = rootM.y + ny * peakH;
    ctx.beginPath();
    ctx.moveTo(root0.x, root0.y);
    ctx.quadraticCurveTo(rootM.x, rootM.y - 0, peakX, peakY); // gentle rise
    ctx.lineTo(root1.x, root1.y);                              // sharp trailing fall
    ctx.closePath();
    ctx.fillStyle = rgba(mix(c, dark, 0.4), 0.88 * A);
    ctx.fill();
    ctx.lineWidth = Math.max(0.4, s * 0.045);
    ctx.strokeStyle = rgba(dark, 0.6 * A);
    ctx.stroke();
  }

  // ── the deeply forked lunate tail: rigidly anchored to the last peduncle ──
  // node and flexing with the wave. GRAFT (judge 2): the lobe roots and the
  // whole fork hang off mid[N] so the fin can never float off the body.
  {
    const base = mid[N];                  // peduncle point (centreline) — rigid anchor
    const aFwd = mid[N - 1];
    const dx = base.x - aFwd.x, dy = base.y - aFwd.y;
    const len = Math.hypot(dx, dy) || 1;
    const tx = dx / len, ty = dy / len;   // tail-ward tangent
    const nx = -ty, ny = tx;              // normal
    const spread = s * (1.7 + 0.30 * boil); // lobe span from centreline (tall fork)
    const reach = L * 0.42;                // how far the lobe tips extend aft
    const notch = L * 0.26;                // deep fork (lunate)
    // lobes lag the peduncle's lateral velocity → trailing whip = liveliness.
    // Kept modest so the fin trails crisply without ever detaching from the base.
    const lag = (lateral(0.999) - lateral(0.90)) * 0.7;
    // far fork axis (where the tips reach to)
    const ex = base.x + tx * reach, ey = base.y + ty * reach;
    // upper & lower lobe tips, each dragged back by the lateral lag (trailing edge)
    const upX = ex + nx * spread, upY = ey + ny * spread - lag;
    const loX = ex - nx * spread, loY = ey - ny * spread - lag;
    // the deep inner notch point (between the two lobes)
    const inX = base.x + tx * (reach - notch);
    const inY = base.y + ty * (reach - notch) - lag * 0.5;
    // peduncle roots — anchored ON the body's last node (no gap at max flex)
    const r0x = base.x + nx * base.h * 0.85, r0y = base.y + ny * base.h * 0.85;
    const r1x = base.x - nx * base.h * 0.85, r1y = base.y - ny * base.h * 0.85;
    ctx.beginPath();
    ctx.moveTo(r0x, r0y);
    // upper lobe: a stiff curved leading edge sweeping out to the tip
    ctx.quadraticCurveTo(base.x + tx * reach * 0.55 + nx * spread * 0.85,
                         base.y + ty * reach * 0.55 + ny * spread * 0.85 - lag * 0.6,
                         upX, upY);
    // upper lobe trailing edge diving into the fork notch
    ctx.quadraticCurveTo(base.x + tx * (reach - notch * 0.4) + nx * spread * 0.35,
                         base.y + ty * (reach - notch * 0.4) + ny * spread * 0.35 - lag * 0.5,
                         inX, inY);
    // lower lobe trailing edge out from the notch
    ctx.quadraticCurveTo(base.x + tx * (reach - notch * 0.4) - nx * spread * 0.35,
                         base.y + ty * (reach - notch * 0.4) - ny * spread * 0.35 - lag * 0.5,
                         loX, loY);
    // lower lobe leading edge back to the peduncle
    ctx.quadraticCurveTo(base.x + tx * reach * 0.55 - nx * spread * 0.85,
                         base.y + ty * reach * 0.55 - ny * spread * 0.85 - lag * 0.6,
                         r1x, r1y);
    ctx.closePath();
    const tg = ctx.createLinearGradient(base.x, base.y - spread, base.x, base.y + spread);
    tg.addColorStop(0, rgba(mix(c, sheen, 0.2), 0.9 * A));
    tg.addColorStop(0.5, rgba(mix(c, dark, 0.25), 0.92 * A));
    tg.addColorStop(1, rgba(shade, 0.9 * A));
    ctx.fillStyle = tg;
    ctx.fill();
    ctx.lineWidth = Math.max(0.5, s * 0.05);
    ctx.strokeStyle = rgba(dark, 0.65 * A);
    ctx.stroke();
  }

  // ── pectoral fin: a small thin swept blade laid against the lower flank ───
  {
    const i0 = Math.round(N * 0.30);
    const r = bot[i0];
    const m = mid[i0];
    ctx.beginPath();
    ctx.moveTo(r.x, r.y);
    ctx.quadraticCurveTo(m.x - L * 0.10, m.y + s * 0.62,
                         m.x - L * 0.26, m.y + s * 0.40);
    ctx.lineTo(r.x - L * 0.10, r.y);
    ctx.closePath();
    ctx.fillStyle = rgba(mix(c, dark, 0.32), 0.5 * A);
    ctx.fill();
  }

  // ── the cold specular sheen: a thin bright rake along the upper flank ─────
  // daylight catching steel — brightest near the head, fades aft, sharper on boil.
  // GRAFT (both judges): strengthened into a reliably-present raking stripe,
  // traced as a smooth curve so it follows the flex without kinks.
  {
    ctx.save();
    // clip to the body so the sheen never leaks past the silhouette
    ctx.beginPath();
    ctx.moveTo(mid[0].x, mid[0].y);
    ctx.lineTo(top[0].x, top[0].y);
    traceSmooth(top);
    ctx.lineTo(botRev[0].x, botRev[0].y);
    traceSmooth(botRev);
    ctx.lineTo(mid[0].x, mid[0].y);
    ctx.closePath();
    ctx.clip();
    ctx.globalCompositeOperation = 'screen';
    // a thin specular rake high on the flank, from just behind the head to
    // mid-body, fading aft. Traced smooth through the wave-displaced points.
    const iA = Math.round(N * 0.20), iB = Math.round(N * 0.64);
    const sp = [];
    for (let i = iA; i <= iB; i++) {
      const m = mid[i];
      sp.push({ x: m.x, y: m.y - m.h * 0.55 }); // high on the flank
    }
    ctx.beginPath();
    ctx.moveTo(sp[0].x, sp[0].y);
    for (let i = 1; i < sp.length - 1; i++) {
      const mx = (sp[i].x + sp[i + 1].x) / 2, my = (sp[i].y + sp[i + 1].y) / 2;
      ctx.quadraticCurveTo(sp[i].x, sp[i].y, mx, my);
    }
    ctx.lineTo(sp[sp.length - 1].x, sp[sp.length - 1].y);
    const sheenA = (0.46 + 0.42 * boil) * A;   // reliably present, brighter on boil
    ctx.strokeStyle = rgba(sheen, sheenA);
    ctx.lineWidth = Math.max(0.7, s * 0.13);
    ctx.stroke();
    ctx.restore();
  }

  // ── head detail: a hard cold eye + a long straight predatory gape ─────────
  {
    const ex = L * 0.70, ey = -s * 0.16;
    // eye socket (set well forward on the long head)
    ctx.beginPath();
    ctx.arc(ex, ey, s * 0.22, 0, TAU);
    ctx.fillStyle = rgba(dark, 0.95 * A);
    ctx.fill();
    // cold catchlight
    ctx.beginPath();
    ctx.arc(ex + s * 0.06, ey - s * 0.06, s * 0.08, 0, TAU);
    ctx.fillStyle = rgba(sheen, 0.85 * A);
    ctx.fill();
    // the gape: a LONG straight jaw slot running from the needle tip back past
    // the eye — slightly open, a hard menacing mouth (no smile curve).
    ctx.beginPath();
    ctx.moveTo(noseX * 0.985, s * 0.02);                 // at the needle tip
    ctx.lineTo(L * 0.82, s * 0.10);                       // jaw hinge, slightly dropped
    ctx.lineWidth = Math.max(0.4, s * 0.06);
    ctx.strokeStyle = rgba(dark, 0.62 * A);
    ctx.stroke();
    // a faint gill slash behind the head
    ctx.beginPath();
    ctx.moveTo(L * 0.50, -s * 0.42);
    ctx.quadraticCurveTo(L * 0.46, 0, L * 0.50, s * 0.42);
    ctx.lineWidth = Math.max(0.35, s * 0.045);
    ctx.strokeStyle = rgba(dark, 0.35 * A);
    ctx.stroke();
  }

  ctx.restore();
  ctx.globalAlpha = 1;

  // ── helpers ───────────────────────────────────────────────────────────────
  function smooth(a, b, x) {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }
};

// module-level helpers (kept off the global except __ASSET)
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h;
  return { r: parseInt(n.slice(0, 2), 16), g: parseInt(n.slice(2, 4), 16), b: parseInt(n.slice(4, 6), 16) };
}
function mix(a, b, t) {
  return { r: Math.round(a.r + (b.r - a.r) * t), g: Math.round(a.g + (b.g - a.g) * t), b: Math.round(a.b + (b.b - a.b) * t) };
}
function rgba(c, a) {
  return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')';
}
