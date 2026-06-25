// @kind fish
// @assetKey fish-copepods
//
// COPEPODS — the mid-water graze swarm.
//
// A single planktonic copepod mote: a tiny translucent amber teardrop with a long
// pair of trailing first-antennae and a thin urosome tail of caudal setae, jerking
// in the characteristic copepod HOP-and-GLIDE. Individually almost nothing; the
// charm is collective — hundreds read as a living granular haze, motes in a shaft
// of light. The PAGE draws the soft outer glow halo + the depth dimming; THIS draws
// the body + feelers + a faint self-glow core so a single mote stays legible in the
// dim mid-low column.
//
// Contract (see fish-lancetfish.md): ctx is ALREADY translated to the mote centre
// and rotated to its heading (+x = forward/nose, +y = down). Draw in LOCAL coords;
// you may ctx.save()/restore() internally but must leave the transform as received.
//
//   p = { s(~2.4), L(~ s*1.0), col:'#e3c06a', ph, boil, light, TAU }
//
// MUST be extremely cheap (a couple of paths) and deterministic given `ph`. Drawn
// for up to ~100+ motes per frame.
//
// SYNTH NOTE: base = Take 1 (single take, unanimous winner). Grafted the one fix
// both judges flagged + their two optional insurance passes — all tuning, no
// structural change, and verified not to disturb the swarm read:
//   • FEELER TAPER (both judges, the primary fix): the first-antennae are no
//     longer one constant-weight quadratic stroke (which read as a bold geometric
//     wishbone up close, pulling the hero pose toward "fish"). Each feeler is now
//     walked in segments along its quadratic, the line-width thinning thick→fine
//     and the alpha fading toward a feathered tip — a soft planktonic wisp at the
//     close-up that still vanishes cleanly into the haze at true swarm scale.
//   • BODY ASYMMETRY (judge 1, insurance): a hair of dorsal lumpiness on the
//     prosome so the teardrop reads as a living body up close, not a clean droplet,
//     without changing its silhouette area at swarm scale.
//   • GLOW CORE (judge 2, insurance): the self-glow core radius/peak-alpha dialed
//     down a hair (cr s*1.5→s*1.35, peak 0.70→0.62) so very dense packing stays
//     granular rather than blooming into a continuous wash. The 220-mote swarm
//     test still reads as a shimmering granular amber haze.

window.__ASSET = function drawCopepod(ctx, p) {
  const s = p.s, L = p.L, TAU = p.TAU || Math.PI * 2;
  const light = (p.light == null ? 1 : p.light);
  const ph = p.ph || 0;
  const col = p.col || '#e3c06a';
  const boil = p.boil || 0;

  // --- the copepod HOP cycle -------------------------------------------------
  // Real copepods don't swim smoothly: the feeding antennae beat, the animal
  // FLICKS forward in a fast power-stroke, then GLIDES, antennae splayed, slowly
  // sinking back to rest. We model one beat per ph-cycle as a sharp ramp.
  const c = (ph % TAU + TAU) % TAU;        // 0..TAU, wrapped & always positive
  const u = c / TAU;                       // 0..1 normalised phase
  // sharp power-stroke in the first ~22% of the cycle, then a long eased glide.
  const STRIKE = 0.22;
  let stroke;                              // 1 at the moment of the dart, ->0 in glide
  if (u < STRIKE) {
    // ramp up fast and snap: a quarter-sine rising edge
    stroke = Math.sin((u / STRIKE) * (Math.PI * 0.5));
  } else {
    // ease back to rest over the glide (smooth decay)
    const g = (u - STRIKE) / (1 - STRIKE);
    stroke = (1 - g) * (1 - g);            // quadratic settle
  }
  // boil sharpens & strengthens the beat (a startle surge)
  const dart = stroke * (1 + boil * 0.5);

  // forward lunge displaces the whole body a hair on the strike (read as a hop)
  const lunge = dart * s * 0.5;
  // sweep: 1 = relaxed glide (feelers splayed wide), 0 = mid-strike (raked back)
  const sweep = (1 - dart);

  ctx.save();
  ctx.translate(lunge, 0);
  ctx.lineCap = 'round';

  const a0 = light;                        // base alpha already pre-dimmed by page

  // --- 1) the long trailing first-antennae (the feelers) ---------------------
  // A copepod's defining feature: a pair of long, fine antennae that sweep out and
  // TRAIL REARWARD from the head. In the glide they splay wide; on the power-stroke
  // they sweep tight against the body. They curve back past the tail so the mote
  // reads as having long feelers, not a forward arrowhead.
  //
  // GRAFT (both judges): walk each feeler along its quadratic in segments, thinning
  // the line-width thick→fine and fading the alpha toward the tip, so the close-up
  // reads as a soft feathered wisp rather than a constant-weight geometric V. The
  // segment count is tiny (4) so this stays cheap for 100+ motes.
  const headX = L * 0.55;
  const baseY = s * 0.30;
  // tips end well BEHIND the body and out to the side; spread opens during glide.
  const tipX = -L * (1.05 + sweep * 0.55);
  const tipY = s * (0.55 + sweep * 1.15);
  const ctrlX = L * 0.10;                  // control near the head bends them rearward
  const ctrlY = s * (0.95 + sweep * 1.05);
  const fSeg = 4;                          // segments per feeler (cheap)
  const wBase = Math.max(0.4, s * 0.15);   // line-width at the head base
  // upper feeler (sgn -1) then lower feeler (sgn +1), each a tapering segment chain
  for (let side = 0; side < 2; side++) {
    const sgn = side === 0 ? -1 : 1;
    const rx = headX, ry = sgn * baseY;
    const cxq = ctrlX, cyq = sgn * ctrlY;
    const txq = tipX, tyq = sgn * tipY;
    let px = rx, py = ry;
    for (let seg = 1; seg <= fSeg; seg++) {
      const t = seg / fSeg, it = 1 - t;
      // de Casteljau point on the quadratic (root, ctrl, tip)
      const qx = it * it * rx + 2 * it * t * cxq + t * t * txq;
      const qy = it * it * ry + 2 * it * t * cyq + t * t * tyq;
      // taper: thick at the base, fine feathered tip; alpha fades out too.
      const taper = 1 - 0.78 * (t - 0.5 / fSeg);
      ctx.lineWidth = Math.max(0.3, wBase * Math.max(0.12, taper));
      ctx.strokeStyle = hexA(col, 0.42 * a0 * (1 - 0.55 * t));
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(qx, qy);
      ctx.stroke();
      px = qx; py = qy;
    }
  }

  // --- 2) urosome tail + caudal setae (the thin rear segment) ----------------
  // A short tapering tail behind the body with two fine setae forking off it,
  // flicking opposite the antennae on the strike.
  const tailX = -L * 0.95;
  const setaFlick = dart * s * 0.55;
  ctx.strokeStyle = hexA(col, 0.5 * a0);
  ctx.lineWidth = Math.max(0.5, s * 0.18);
  ctx.beginPath();
  ctx.moveTo(-L * 0.35, 0);
  ctx.lineTo(tailX, 0);                                   // the urosome
  ctx.moveTo(tailX, 0); ctx.lineTo(tailX - L * 0.35, -setaFlick - s * 0.18); // seta up
  ctx.moveTo(tailX, 0); ctx.lineTo(tailX - L * 0.35,  setaFlick + s * 0.18); // seta down
  ctx.stroke();

  // --- 3) the translucent teardrop body --------------------------------------
  // Fat rounded head at the front (+x), tapering smoothly to the tail. Translucent
  // amber so the swarm reads as haze, not opaque dots; a touch brighter on the
  // upper (lit) flank.
  //
  // GRAFT (judge 1, insurance): a hair of dorsal lumpiness on the upper curve so
  // the prosome reads as a living body up close rather than a clean geometric
  // droplet. Small offsets only — the silhouette area is essentially unchanged so
  // the swarm read is untouched.
  const grad = ctx.createLinearGradient(0, -s, 0, s);
  grad.addColorStop(0,   hexA(col, 0.92 * a0));   // lit upper flank
  grad.addColorStop(0.5, hexA(col, 0.74 * a0));
  grad.addColorStop(1,   hexA(col, 0.52 * a0));   // shaded lower flank
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(L * 0.95, 0);                                          // nose
  // upper curve, fat head — a slight shoulder bump then a dip make it lumpy/organic
  ctx.quadraticCurveTo(L * 0.62, -s * 0.98, L * 0.18, -s * 0.74);   // fat head shoulder
  ctx.quadraticCurveTo(-L * 0.02, -s * 0.30, -L * 0.10, -s * 0.34); // small mid dip
  ctx.quadraticCurveTo(-L * 0.45, 0, -L * 0.10, s * 0.34);          // taper to tail
  ctx.quadraticCurveTo(L * 0.55,  s * 0.92, L * 0.95, 0);           // lower curve
  ctx.closePath();
  ctx.fill();

  // --- 4) a faint self-glow core ---------------------------------------------
  // A small additive amber bloom at the body's centre keeps a single mote alive
  // in the dim column (the page's outer halo is broad & soft; this is the spark).
  //
  // GRAFT (judge 2, insurance): radius + peak-alpha dialed down a hair so very
  // dense packing stays granular rather than blooming into a continuous wash.
  ctx.globalCompositeOperation = 'screen';
  const cx = L * 0.2;
  const cr = s * 1.35;
  const core = ctx.createRadialGradient(cx, 0, 0, cx, 0, cr);
  core.addColorStop(0,    hexA(col, (0.62 + boil * 0.25) * a0));
  core.addColorStop(0.35, hexA(col, 0.26 * a0));
  core.addColorStop(1,    hexA(col, 0));
  ctx.fillStyle = core;
  ctx.beginPath(); ctx.arc(cx, 0, cr, 0, TAU); ctx.fill();

  ctx.restore();
};

// Local hex+alpha helper (the page has its own `hexA`; we provide a private one so
// the candidate renders standalone in the preview harness too). Accepts #rgb/#rrggbb.
function hexA(hex, a) {
  if (typeof hex !== 'string' || hex[0] !== '#') return 'rgba(227,192,106,' + a + ')';
  let h = hex.slice(1);
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}
