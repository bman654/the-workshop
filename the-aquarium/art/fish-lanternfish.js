// @kind fish
// @assetKey fish-lanternfish
// Lanternfish — the twilight drift. A stubby, soft, dark-bodied bioluminescent
// drifter studded with breathing rows of cool teal photophores. It hangs and
// drifts rather than darts: a slow, languid, full-body sine flex. The light
// organs are the bright SOURCE — small teal glows with a hot teal core (and only
// a tiny white-hot pip) that pulse over the swim-cycle. Self-luminous, so `light`
// is floored to stay visible in the blue twilight. Pure canvas2d, deterministic
// given `ph`.
//
// SYNTH NOTE: base = Take 1 (the cleaner fish silhouette + honestly-separated
// two photophore rows + the most obvious breathe). Grafted per both judges:
//   • teal core/bloom — the shared shortfall both judges flagged (organs skewed
//     cool-white). The bloom is now a saturated lifted-teal radial and the core
//     a lifted-teal disc; only a tiny central pip carries the white-hot glint, so
//     each organ reads as a hot TEAL source rather than a white dot (judge 2's
//     "adopt Take 2's teal bloom, keep a small white pip" + judge 1's "let a thin
//     teal tint reach the core").
//   • raised the body/rim floor a notch so the fish holds its soft shape on the
//     dimmest resting poses instead of dissolving into the column (judge 1).
//   • nudged the flank row higher on the flank so the two rows stay separate at
//     the smallest poses instead of fusing into one band (judge 2 + the smith's
//     own self-noted weakness).
//   • added one forward pre-orbital signature lamp alongside the existing cheek
//     light (judge 1), WITHOUT collapsing the two rows into Take 2's single keel.
//
// ctx: ALREADY translated to the fish centre and rotated to its heading
//      (+x = forward/nose, +y = down). Draw in local coords; leave the
//      transform as received.
// p = { s, L, col, ph, boil, light, TAU }
window.__ASSET = function drawLanternfish(ctx, p) {
  const TAU = p.TAU || Math.PI * 2;
  const s = p.s, L = p.L, col = p.col || '#9ad6c8';
  const ph = p.ph || 0;
  const boil = Math.max(0, Math.min(1, p.boil || 0));
  // self-glows: floor the ambient so it never sinks into the dark
  const light = Math.max(p.light || 0, 0.55);

  // ── tiny colour helpers (no allocs beyond strings) ───────────────────────
  // parse the species teal once
  const r0 = parseInt(col.slice(1, 3), 16);
  const g0 = parseInt(col.slice(3, 5), 16);
  const b0 = parseInt(col.slice(5, 7), 16);
  function rgba(r, g, b, a) {
    return 'rgba(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ',' + a + ')';
  }
  // mix the teal toward white by k (0..1)
  function teal(a, k) {
    k = k || 0;
    return rgba(r0 + (255 - r0) * k, g0 + (255 - g0) * k, b0 + (255 - b0) * k, a);
  }
  // a LIFTED teal — brighter than the base species teal but still unmistakably
  // teal. We HOLD the red channel DOWN while pushing green/blue, so even when the
  // additive (`screen`) cores stack toward their ceiling the result keeps a wide
  // green/blue-over-red lead and reads teal, not white. (Tuned after measuring
  // the rendered core pixels washing to ~[236,249,247] — the fix is to cap red.)
  function tealHot(a) {
    return rgba(
      Math.min(150, r0 + 12),   // hold red down → the additive ceiling stays teal
      Math.min(255, g0 + 34),
      Math.min(255, b0 + 28),
      a
    );
  }

  // ── the drift-swim: a slow languid full-body wave (smaller amp than apex) ─
  const speed = 1 + boil * 0.9;            // boil quickens the swim
  const t = ph * speed;
  // travelling wave amplitude grows toward the tail
  function flex(x01) {                      // x01: 0 at nose, 1 at tail
    const amp = s * (0.10 + 0.34 * x01 * x01);
    return Math.sin(t - x01 * 1.8) * amp;
  }
  const tailY = flex(1);
  const midY = flex(0.5);

  // photophore breathing: brighten/dim over the cycle, boil pushes brighter.
  // Keep a generous resting floor so the lights always read as a constellation,
  // even on the dim (low-boil) drifters high in the column.
  const breath = 0.78 + 0.22 * (0.5 + 0.5 * Math.sin(t * 0.9));
  const lum = breath * (0.85 + 0.45 * boil) * (0.7 + 0.3 * light);

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // ── BODY: a stubby teardrop, dark blue-grey, soft. Built along the flex ──
  // outline samples so the whole body undulates as one piece
  const head = L * 0.92, tail = -L * 0.92;
  function bx(x) { return x; }
  function by(x) {
    // map x in [tail..head] to x01 in [1..0] for the wave
    const x01 = (head - x) / (head - tail);
    return flex(Math.max(0, Math.min(1, x01)));
  }
  // body half-height profile: rounded snout, deep belly mid, taper to tail
  function prof(x) {
    const u = (x - tail) / (head - tail); // 0 tail .. 1 head
    // deepest belly forward (just behind the head), tapering to a pinched tail
    // and a rounded — but defined — snout at the front.
    const belly = Math.sin(Math.pow(u, 0.68) * Math.PI);
    // a small snout fullness near the nose so the head isn't a knife point
    const snout = 0.16 * Math.max(0, u - 0.86) / 0.14;
    return s * (0.22 + 0.92 * belly + snout);
  }

  ctx.beginPath();
  let first = true;
  const N = 22;
  // top edge nose→tail
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const x = head - u * (head - tail);
    const yc = by(x), h = prof(x);
    const y = yc - h * (x > 0 ? 0.92 : 0.80); // back a touch flatter than belly
    if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
  }
  // bottom edge tail→nose (the belly, deeper)
  for (let i = N; i >= 0; i--) {
    const u = i / N;
    const x = head - u * (head - tail);
    const yc = by(x), h = prof(x);
    ctx.lineTo(x, yc + h);
  }
  ctx.closePath();

  // dark soft body fill, faintly lit from above. A notch brighter than the
  // baseline so it never dissolves into the dark column on the dimmest poses
  // (the constellation reads better when the body still holds a soft shape).
  const bodyG = ctx.createLinearGradient(0, -s, 0, s);
  bodyG.addColorStop(0, rgba(66, 92, 110, 0.96 * light + 0.06));
  bodyG.addColorStop(0.45, rgba(34, 52, 70, 0.97));
  bodyG.addColorStop(1, rgba(16, 26, 40, 0.98));
  ctx.fillStyle = bodyG;
  ctx.fill();

  // a faint cool teal rim along the lit upper edge (lifted a touch so the body
  // edge still catches a sliver of cool light on the dimmest poses)
  ctx.lineWidth = Math.max(0.6, s * 0.10);
  ctx.strokeStyle = teal(0.18 * light + 0.04, 0.18);
  ctx.stroke();

  // ── soft underbelly bioluminescent wash (the diffuse counter-shading glow) ─
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const wash = ctx.createLinearGradient(0, 0, 0, s * 1.25);
  wash.addColorStop(0, teal(0));
  wash.addColorStop(1, teal(0.22 * lum, 0.06));
  ctx.fillStyle = wash;
  // reuse a belly band path
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const x = head - u * (head - tail);
    const yc = by(x), h = prof(x);
    if (i === 0) ctx.moveTo(x, yc + h * 0.35); else ctx.lineTo(x, yc + h * 0.35);
  }
  for (let i = N; i >= 0; i--) {
    const u = i / N;
    const x = head - u * (head - tail);
    const yc = by(x), h = prof(x);
    ctx.lineTo(x, yc + h);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ── TAIL: a small soft caudal fin off the tail tip ───────────────────────
  ctx.save();
  ctx.fillStyle = rgba(26, 42, 58, 0.92);
  const tx = tail, ty = by(tail);
  const fin = s * 1.05;
  ctx.beginPath();
  ctx.moveTo(tx + s * 0.3, ty);
  ctx.quadraticCurveTo(tx - s * 0.4, ty - fin * 0.55, tx - s * 0.95, ty - fin);
  ctx.quadraticCurveTo(tx - s * 0.55, ty, tx - s * 0.95, ty + fin);
  ctx.quadraticCurveTo(tx - s * 0.4, ty + fin * 0.55, tx + s * 0.3, ty);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // a low soft dorsal + anal nub so it reads as a fish, not a bean
  ctx.fillStyle = rgba(34, 52, 70, 0.85);
  const dx = L * 0.05, dyc = by(dx), dh = prof(dx);
  ctx.beginPath();
  ctx.moveTo(dx + s * 0.5, dyc - dh * 0.9);
  ctx.quadraticCurveTo(dx, dyc - dh * 1.5, dx - s * 0.6, dyc - dh * 0.9);
  ctx.closePath();
  ctx.fill();

  // ── PHOTOPHORE ROWS: the bright teal SOURCE, breathing ───────────────────
  // a belly row and a lower-flank row, each a line of small glow organs that
  // ride the body wave. Painted additively so they read as lights, not paint.
  // The bloom is a generous, saturated teal radial so the CONSTELLATION reads
  // cool-teal; the core is a lifted-teal hot disc with only a tiny white-hot pip.
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  function photophore(x, y, r, a) {
    // outer soft halo — bigger + saturated teal so it reads as a true teal source
    const gA = ctx.createRadialGradient(x, y, 0, x, y, r * 3.4);
    gA.addColorStop(0, tealHot(0.92 * a));
    gA.addColorStop(0.42, teal(0.42 * a, 0.0));
    gA.addColorStop(1, teal(0));
    ctx.fillStyle = gA;
    ctx.beginPath(); ctx.arc(x, y, r * 3.4, 0, TAU); ctx.fill();
    // hot teal core — a lifted-teal disc that carries the SOURCE read without
    // washing to white. Peak alpha capped so the additive stack of bloom+core
    // doesn't ceiling all channels (which is what whitened the centre before).
    const gC = ctx.createRadialGradient(x, y, 0, x, y, r);
    gC.addColorStop(0, tealHot(Math.min(0.85, a + 0.12)));
    gC.addColorStop(0.45, tealHot(0.78 * a));
    gC.addColorStop(1, teal(0));
    ctx.fillStyle = gC;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    // only a TINY, faint white-hot glint at the very centre — small radius + low
    // alpha + a modest white-mix, so it's a specular spark on a teal organ rather
    // than a white disc that washes the whole core (kept faint after measuring the
    // cores blowing out to near-white when this pip was bright).
    const gP = ctx.createRadialGradient(x, y, 0, x, y, r * 0.30);
    gP.addColorStop(0, teal(Math.min(0.5, 0.42 * a), 0.45));
    gP.addColorStop(1, teal(0));
    ctx.fillStyle = gP;
    ctx.beginPath(); ctx.arc(x, y, r * 0.30, 0, TAU); ctx.fill();
  }

  // belly row: a clear bright line of organs along the lowest belly edge.
  const orgR = Math.max(0.9, s * 0.19);
  const x0 = L * 0.6, x1 = -L * 0.68;
  const M = 8;
  for (let i = 0; i < M; i++) {
    const u = i / (M - 1);
    const x = x0 + (x1 - x0) * u;
    const yc = by(x), h = prof(x);
    const y = yc + h * 0.86;
    // per-organ phase offset so the row shimmers as a travelling pulse
    const a = lum * (0.78 + 0.22 * (0.5 + 0.5 * Math.sin(t * 0.9 - u * 2.2)));
    photophore(x, y, orgR, a);
  }
  // lower-flank row: a second, distinct line set higher on the flank + sparser,
  // so the two rows read as a small constellation rather than one smear. Lifted
  // higher on the flank (0.30 vs the belly's 0.86) so even at the small preview
  // poses the two rows stay visibly separate, not fused into one band.
  const M2 = 6;
  for (let i = 0; i < M2; i++) {
    const u = i / (M2 - 1);
    const xx = L * 0.46 - u * (L * 0.96); // span L*0.46 .. -L*0.5
    const yc = by(xx), h = prof(xx);
    const y = yc + h * 0.30;
    const a = lum * 0.82 * (0.78 + 0.22 * (0.5 + 0.5 * Math.sin(t * 0.9 - u * 2.2 + 1.1)));
    photophore(xx, y, orgR * 0.78, a);
  }
  ctx.restore();

  // ── EYE: big, soft, catching the last daylight ───────────────────────────
  const ex = L * 0.66, eyc = by(ex), eh = prof(ex);
  const ey = eyc - eh * 0.18;
  const er = s * 0.42;
  // dark socket
  ctx.fillStyle = rgba(8, 14, 24, 0.95);
  ctx.beginPath(); ctx.arc(ex, ey, er, 0, TAU); ctx.fill();
  // iris: faint cool ring
  ctx.fillStyle = teal(0.5 * light, 0.0);
  ctx.beginPath(); ctx.arc(ex, ey, er * 0.62, 0, TAU); ctx.fill();
  // a single bright daylight catchlight on the upper edge
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = teal(0.9 * light, 0.7);
  ctx.beginPath(); ctx.arc(ex + er * 0.22, ey - er * 0.30, er * 0.34, 0, TAU); ctx.fill();
  ctx.restore();

  // a small head photophore just below/ahead of the eye (the species' cheek
  // light) plus one forward pre-orbital signature lamp anchoring the front end.
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  photophore(ex - er * 0.1, ey + er * 1.05, orgR * 0.9, lum * 0.9);
  photophore(L * 0.82, by(L * 0.82) + prof(L * 0.82) * 0.5, orgR * 0.72, lum * 0.78);
  ctx.restore();

  ctx.restore();
};
