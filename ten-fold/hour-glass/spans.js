/* ════════════════════════════════════════════════════════════════════════════
   THE HOUR-GLASS — THE SPANS (the estate's own ink, in the register of TIME)

   Twins ten-fold/plates.js. Each span is a function

       SpanArt.<key> = function (g, u, a, t, anchor, state)

   drawing into `g`, whose origin is ALREADY at the span's centre. Draw in UNIT
   space: x,y ∈ [−0.5,+0.5] scaled by `u` (the span's side, in px). `a` is the
   span's presence (0..1), `t` seconds (for grain drift only), `anchor` the [x,y]
   where this span's CHILD lands, and `state` = { phase∈[0,1), P, still }:

     · phase — the span's OWN clock, advanced by the room at spanRate·dt. Every
       vignette is authored as a CLEAN LOOP: phase 1→0 wraps with no visible pop.
     · P     — the persistence-of-vision glow (0..1): near 0 for a span running at
       or below the gaze, near 1 for one running far faster (the fast pole). A
       vignette may lean into P (bloom brighter as it speeds away) but must still
       read as a PICTURE — a magnified outgoing span is a thousandfold blow-up.
     · still — reduced motion: draw the STATIC ten-tick comb instead of animating,
       so the 10:1 tiling FACT is visible at rest, drawn rather than moved.

   Same two hard rules as the plates: (1) a scale-free grain() field so a span
   magnified a thousandfold stays a picture, and (2) composed AROUND the anchor,
   the smudge the child resolves from. Nothing foraged; every mark forged here.
   ════════════════════════════════════════════════════════════════════════════ */

const SpanArt = {};

/* ── the ink kit (twins plates.js) ───────────────────────────────────────── */
function sgRng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const SG_PTS = new Map();
function sgPts(seed, n) {
  const k = seed + ':' + n;
  let P = SG_PTS.get(k);
  if (!P) {
    const r = sgRng(seed); P = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { P[i * 3] = r() - 0.5; P[i * 3 + 1] = r() - 0.5; P[i * 3 + 2] = r(); }
    SG_PTS.set(k, P);
  }
  return P;
}
/* scale-free field texture in octaves — only the octave currently landing in a
   legible pixel range is drawn, so a span blown up stays a picture. */
const SG_OCT = [[0.00040, 1100], [0.0016, 820], [0.0072, 470], [0.030, 190], [0.098, 56]];
function grain(g, u, a, seed, tint, dens) {
  g.fillStyle = tint;
  for (let o = 0; o < SG_OCT.length; o++) {
    const s = SG_OCT[o][0], n = SG_OCT[o][1], px = s * u;
    if (px < 0.34 || px > 7) continue;
    const P = sgPts(seed * 131 + o, n);
    for (let i = 0; i < n; i++) {
      const b = P[i * 3 + 2];
      g.globalAlpha = a * dens * (0.08 + 0.62 * b * b);
      g.fillRect(P[i * 3], P[i * 3 + 1], s * 1.4, s * 1.4);
    }
  }
  g.globalAlpha = 1;
}
/* the smudge the child resolves out of — every span composes one at its anchor */
function smudge(g, anchor, r, tint, a) {
  if (!anchor) return;
  const [x, y] = anchor;
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${tint},${(0.40 * a).toFixed(4)})`);
  gr.addColorStop(0.45, `rgba(${tint},${(0.14 * a).toFixed(4)})`);
  gr.addColorStop(1, `rgba(${tint},0)`);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill();
}
/* the fast-pole fuse: the same warm amber a receded plate carries, here bearing
   luminance P. Kept SPARING — the filmstrip's warm scenes stay the aesthetic;
   the glow is the persistence seam at the fast pole, not a wash over the drum. */
function fuse(g, a, P) {
  if (P < 0.02) return;
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 0.6);
  gr.addColorStop(0, `rgba(255,236,186,${(0.55 * a * P).toFixed(4)})`);
  gr.addColorStop(0.4, `rgba(245,205,120,${(0.24 * a * P).toFixed(4)})`);
  gr.addColorStop(1, 'rgba(240,199,102,0)');
  g.fillStyle = gr; g.fillRect(-0.5, -0.5, 1, 1);
}
const TAU = 6.28318530718;
/* a soft phased pulse envelope: rises fast, relaxes slow, seamless at the wrap */
function pulse(p, sharp) { const q = (p % 1 + 1) % 1; return Math.exp(-q * (sharp || 5)) + Math.exp(-(1 - q) * (sharp || 5) * 3); }
function stroke(g, c, w) { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; }

/* the reduced-motion comb: the ten sub-beats of the child, drawn as a static
   tick-row across the foot of the frame so the 10:1 tiling is visible at rest. */
function drawComb(g, a, tint) {
  stroke(g, `rgba(${tint},${(0.5 * a).toFixed(3)})`, 0.006);
  for (let i = 0; i <= 10; i++) {
    const x = -0.34 + (i / 10) * 0.68, big = (i % 10 === 0);
    g.globalAlpha = a * (big ? 0.85 : 0.5);
    g.beginPath(); g.moveTo(x, 0.40); g.lineTo(x, big ? 0.34 : 0.37); g.stroke();
  }
  g.globalAlpha = 1;
}

/* ════════════════════════ THE ANCHOR: a heartbeat (e=0) ═════════════════════
   Twins the Glass's hand. Ink-spare: a warm chamber that squeezes twice — the
   lub-dub — and throws a ring of pressure outward on each beat. */
function heartPath(g){
  g.beginPath();
  g.moveTo(0, 0.30);                                          // the bottom point
  g.bezierCurveTo(-0.10, 0.16, -0.30, 0.02, -0.30, -0.12);    // up the left side
  g.bezierCurveTo(-0.30, -0.28, -0.13, -0.30, 0, -0.14);      // over the left lobe to the cleft
  g.bezierCurveTo(0.13, -0.30, 0.30, -0.28, 0.30, -0.12);     // over the right lobe
  g.bezierCurveTo(0.30, 0.02, 0.10, 0.16, 0, 0.30);           // down the right side
  g.closePath();
}
SpanArt.heart = function (g, u, a, t, anchor, state) {
  g.save(); g.scale(u, u);
  const p = state.still ? 0.10 : state.phase;
  // the lub-dub: a sharp squeeze, then a softer second, then the long fill
  const beat = Math.min(1, Math.max(pulse(p, 30), 0.66 * pulse((p - 0.16 + 1) % 1, 30)));
  const sq = 1 - 0.09 * beat;                                 // systole: the muscle draws IN
  // the pressure it throws outward on each beat — the pulse travelling away
  if (!state.still) {
    for (let k = 0; k < 2; k++) {
      const ph = (p - k * 0.16 + 1) % 1, rr = 0.30 + ph * 0.34, fade = Math.max(0, 1 - ph) * (1 - k * 0.3);
      stroke(g, `rgba(228,120,98,${(0.16 * a * fade).toFixed(3)})`, 0.012 * (1 - ph * 0.6));
      g.beginPath(); g.arc(0, 0.02, rr, 0, TAU); g.stroke();
    }
  }
  // the warm halo the beating muscle throws on the dark
  const halo = g.createRadialGradient(0, 0.0, 0.05, 0, 0.0, 0.5);
  halo.addColorStop(0, `rgba(210,70,60,${(0.16 + 0.14 * beat) * a})`);
  halo.addColorStop(1, 'rgba(150,30,34,0)');
  g.fillStyle = halo; g.fillRect(-0.5, -0.5, 1, 1);

  g.save(); g.scale(sq, sq);
  // the body of the heart — lit warm from the upper left, deep at the base
  heartPath(g);
  const body = g.createLinearGradient(-0.22, -0.30, 0.18, 0.30);
  body.addColorStop(0.00, `rgba(224,96,84,${0.98 * a})`);
  body.addColorStop(0.40, `rgba(196,54,52,${0.98 * a})`);
  body.addColorStop(0.80, `rgba(140,26,34,${0.98 * a})`);
  body.addColorStop(1.00, `rgba(92,16,26,${0.98 * a})`);
  g.fillStyle = body; g.fill();
  // clip to the heart and lay the interior on it
  g.save(); heartPath(g); g.clip();
  // the two ventricles — hollows that darken between beats and flush on the squeeze
  for (const c of [[-0.11, -0.02], [0.10, 0.0]]) {
    const v = g.createRadialGradient(c[0], c[1], 0.01, c[0], c[1], 0.20);
    v.addColorStop(0, `rgba(74,12,20,${(0.5 - 0.34 * beat) * a})`);
    v.addColorStop(1, 'rgba(74,12,20,0)');
    g.fillStyle = v; g.beginPath(); g.arc(c[0], c[1], 0.20, 0, TAU); g.fill();
  }
  // the wet gleam over the left lobe, flaring on the beat
  const gl = g.createRadialGradient(-0.13, -0.15, 0, -0.13, -0.15, 0.16);
  gl.addColorStop(0, `rgba(255,206,184,${(0.34 + 0.34 * beat) * a})`);
  gl.addColorStop(1, 'rgba(255,206,184,0)');
  g.fillStyle = gl; g.beginPath(); g.arc(-0.13, -0.15, 0.16, 0, TAU); g.fill();
  // a couple of vessels crowning the top — where the child (a blink) resolves in
  stroke(g, `rgba(120,26,32,${0.7 * a})`, 0.02);
  g.beginPath(); g.moveTo(-0.04, -0.16); g.quadraticCurveTo(-0.06, -0.30, -0.14, -0.34); g.stroke();
  g.beginPath(); g.moveTo(0.02, -0.16); g.quadraticCurveTo(0.05, -0.30, 0.02, -0.36); g.stroke();
  grain(g, u, a, 41, 'rgba(150,40,40,1)', 0.4);
  g.restore();
  // the rim, catching the light
  heartPath(g);
  stroke(g, `rgba(255,180,160,${(0.20 + 0.16 * beat) * a})`, 0.008);
  g.stroke();
  g.restore();

  smudge(g, anchor, 0.11, '228,120,98', a);
  if (state.still) drawComb(g, a, '228,120,98');
  fuse(g, a, state.P);
  g.restore();
};

/* ════════════════════════ a blink (e=−1) ═══════════════════════════════════
   An eye: an amber iris under a lid that sweeps closed and open once per loop.
   Ten of these tile one heartbeat — the flicker cascade you feel before you see. */
SpanArt.blink = function (g, u, a, t, anchor, state) {
  g.save(); g.scale(u, u);
  const p = state.still ? 0.0 : state.phase;
  // lid closes near p≈0.5, open at the wrap → seamless
  const close = Math.pow(Math.max(0, 1 - Math.abs(((p + 0.5) % 1) - 0.5) / 0.16), 1.4);
  const open = 1 - close;
  const lidY = 0.30 * open;                       // how far the eye is open
  // the eye white / socket
  g.save();
  g.beginPath();
  g.ellipse(0, 0, 0.40, Math.max(0.012, lidY), 0, 0, TAU);
  g.clip();
  const sk = g.createRadialGradient(0, 0, 0.02, 0, 0, 0.4);
  sk.addColorStop(0, `rgba(236,224,206,${0.9 * a})`);
  sk.addColorStop(1, `rgba(150,140,124,${0.7 * a})`);
  g.fillStyle = sk; g.fillRect(-0.5, -0.5, 1, 1);
  // the iris + pupil, tracking a touch
  const ix = Math.sin(p * TAU) * 0.05;
  const ir = g.createRadialGradient(ix, 0, 0.02, ix, 0, 0.17);
  ir.addColorStop(0, `rgba(180,120,54,${0.95 * a})`);
  ir.addColorStop(0.7, `rgba(120,74,30,${0.95 * a})`);
  ir.addColorStop(1, `rgba(60,36,16,${0.95 * a})`);
  g.fillStyle = ir; g.beginPath(); g.arc(ix, 0, 0.155, 0, TAU); g.fill();
  g.fillStyle = `rgba(12,8,6,${0.95 * a})`; g.beginPath(); g.arc(ix, 0, 0.072, 0, TAU); g.fill();
  g.fillStyle = `rgba(255,250,240,${0.8 * a})`; g.beginPath(); g.arc(ix - 0.05, -0.05, 0.026, 0, TAU); g.fill();
  g.restore();
  // the lids — warm skin closing over
  stroke(g, `rgba(70,44,34,${0.9 * a})`, 0.014);
  g.beginPath(); g.ellipse(0, 0, 0.40, Math.max(0.012, lidY), 0, 0, Math.PI, true); g.stroke();
  g.beginPath(); g.ellipse(0, 0, 0.40, Math.max(0.012, lidY), 0, 0, Math.PI); g.stroke();
  if (close > 0.6) { stroke(g, `rgba(70,44,34,${(0.6 * a * (close)).toFixed(3)})`, 0.02);
    g.beginPath(); g.moveTo(-0.40, 0); g.lineTo(0.40, 0); g.stroke(); }
  grain(g, u, a, 71, 'rgba(120,90,60,1)', 0.35);
  smudge(g, anchor, 0.10, '200,150,90', a);
  if (state.still) drawComb(g, a, '200,150,90');
  fuse(g, a, state.P);
  g.restore();
};

/* ════════════════════════ a slow breath (e=1) ══════════════════════════════
   A luminous form that swells on the in-breath and settles on the out, with a
   few motes carried up and released. One breath per loop. */
SpanArt.swell = function (g, u, a, t, anchor, state) {
  g.save(); g.scale(u, u);
  const p = state.still ? 0.4 : state.phase;
  // in-breath 0→0.45, hold, out-breath — a slow sinusoid, seamless
  const br = 0.5 - 0.5 * Math.cos(((p * 0.62) % 1) * TAU + (p > 0.62 ? 0 : 0));
  const rise = 0.5 - 0.5 * Math.cos(p < 0.5 ? (p / 0.5) * Math.PI : Math.PI + ((p - 0.5) / 0.5) * Math.PI);
  const sz = 0.20 + 0.09 * rise;
  const core = g.createRadialGradient(0, 0.02, 0.01, 0, 0.02, sz + 0.14);
  core.addColorStop(0, `rgba(232,214,178,${(0.42 + 0.2 * rise) * a})`);
  core.addColorStop(0.5, `rgba(190,180,150,${0.20 * a})`);
  core.addColorStop(1, 'rgba(160,160,140,0)');
  g.fillStyle = core; g.beginPath(); g.ellipse(0, 0.02, sz + 0.05, sz, 0, 0, TAU); g.fill();
  // the carried motes rise on the exhale
  if (!state.still) {
    const r = sgPts(311, 40);
    for (let i = 0; i < 40; i++) {
      const ph = (p + r[i * 3 + 2]) % 1;
      const y = 0.14 - ph * 0.4, x = r[i * 3] * 0.5 + Math.sin(ph * 4 + i) * 0.02;
      const f = Math.sin(ph * Math.PI);
      g.globalAlpha = a * 0.5 * f;
      g.fillStyle = 'rgba(236,222,190,1)';
      g.beginPath(); g.arc(x, y, 0.004 + 0.006 * r[i * 3 + 1] + 0.006, 0, TAU); g.fill();
    }
    g.globalAlpha = 1;
  }
  grain(g, u, a, 97, 'rgba(200,190,160,1)', 0.4);
  smudge(g, anchor, 0.11, '220,206,170', a);
  if (state.still) drawComb(g, a, '220,206,170');
  fuse(g, a, state.P);
  g.restore();
};

/* ════════════════════════ a minute of sand (e=2) ═══════════════════════════
   The instrument's own emblem: a glass of sand, a steady stream falling through
   the waist, the piles shimmering. Authored as an endless fall so it loops
   without a flip. */
SpanArt.sand = function (g, u, a, t, anchor, state) {
  g.save(); g.scale(u, u);
  const p = state.phase;
  const glass = `rgba(210,224,236,${0.5 * a})`;
  // the two bulbs + waist, a hairline glass
  stroke(g, glass, 0.010);
  g.beginPath();
  g.moveTo(-0.22, -0.34); g.quadraticCurveTo(-0.24, -0.06, -0.02, 0.0);
  g.quadraticCurveTo(-0.24, 0.06, -0.22, 0.34);
  g.lineTo(0.22, 0.34);
  g.quadraticCurveTo(0.24, 0.06, 0.02, 0.0);
  g.quadraticCurveTo(0.24, -0.06, 0.22, -0.34);
  g.closePath(); g.stroke();
  // clip to the glass to hold the sand
  g.save();
  g.beginPath();
  g.moveTo(-0.21, -0.33); g.quadraticCurveTo(-0.23, -0.055, -0.012, 0.0);
  g.quadraticCurveTo(-0.23, 0.055, -0.21, 0.33);
  g.lineTo(0.21, 0.33);
  g.quadraticCurveTo(0.23, 0.055, 0.012, 0.0);
  g.quadraticCurveTo(0.23, -0.055, 0.21, -0.33);
  g.closePath(); g.clip();
  // upper mound (steady state — an endless minute) and lower pile
  const sand = `rgba(226,192,128,${0.92 * a})`;
  g.fillStyle = sand;
  g.beginPath(); g.moveTo(-0.20, -0.06); g.quadraticCurveTo(0, -0.20, 0.20, -0.06);
  g.lineTo(0.20, -0.05); g.quadraticCurveTo(0, -0.11, -0.20, -0.05); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(-0.205, 0.33); g.lineTo(0.205, 0.33);
  g.quadraticCurveTo(0, 0.14, -0.205, 0.33); g.closePath(); g.fill();
  // the falling stream — grains recycling for a clean loop
  if (!state.still) {
    const r = sgPts(53, 46);
    g.fillStyle = `rgba(236,206,146,${0.95 * a})`;
    for (let i = 0; i < 46; i++) {
      const ph = (p * 1.0 + r[i * 3 + 2]) % 1;
      const y = -0.02 + ph * 0.30;
      const x = (r[i * 3]) * 0.012 * (1 + ph);
      g.beginPath(); g.arc(x, y, 0.004 + 0.003 * r[i * 3 + 1], 0, TAU); g.fill();
    }
    // a soft dust bloom where it lands
    const bl = 0.5 + 0.5 * Math.sin(p * TAU * 4);
    g.fillStyle = `rgba(236,206,146,${(0.14 * a * bl).toFixed(3)})`;
    g.beginPath(); g.arc(0, 0.24, 0.05, 0, TAU); g.fill();
  } else {
    stroke(g, `rgba(236,206,146,${0.7 * a})`, 0.012);
    g.beginPath(); g.moveTo(0, -0.02); g.lineTo(0, 0.26); g.stroke();
    drawComb(g, a, '226,192,128');
  }
  g.restore();
  // a warm gleam on the glass
  stroke(g, `rgba(255,250,236,${0.4 * a})`, 0.006);
  g.beginPath(); g.moveTo(-0.16, -0.30); g.quadraticCurveTo(-0.19, -0.08, -0.05, 0.0); g.stroke();
  grain(g, u, a, 133, 'rgba(220,200,150,1)', 0.3);
  smudge(g, anchor, 0.09, '226,192,128', a);
  fuse(g, a, state.P);
  g.restore();
};

/* ════════════════════════ the turning hour (e=3) ═══════════════════════════
   A dark dial and one slim hand making a single revolution per loop. */
SpanArt.tide = function (g, u, a, t, anchor, state) {
  g.save(); g.scale(u, u);
  const p = state.still ? 0.0 : state.phase;
  // the dial
  const face = g.createRadialGradient(-0.04, -0.05, 0.02, 0, 0, 0.36);
  face.addColorStop(0, `rgba(38,44,54,${0.9 * a})`);
  face.addColorStop(1, `rgba(14,18,24,${0.92 * a})`);
  g.fillStyle = face; g.beginPath(); g.arc(0, 0, 0.34, 0, TAU); g.fill();
  stroke(g, `rgba(200,180,130,${0.55 * a})`, 0.010);
  g.beginPath(); g.arc(0, 0, 0.34, 0, TAU); g.stroke();
  // the twelve marks
  for (let i = 0; i < 12; i++) {
    const an = (i / 12) * TAU, big = (i % 3 === 0);
    const r0 = big ? 0.27 : 0.29, r1 = 0.32;
    stroke(g, `rgba(214,196,150,${(big ? 0.7 : 0.4) * a})`, big ? 0.010 : 0.006);
    g.beginPath(); g.moveTo(Math.cos(an) * r0, Math.sin(an) * r0);
    g.lineTo(Math.cos(an) * r1, Math.sin(an) * r1); g.stroke();
  }
  if (state.still) { drawComb(g, a, '214,196,150'); }
  // the hand — one sweep per loop, twelve o'clock at the wrap
  const an = -Math.PI / 2 + p * TAU;
  stroke(g, `rgba(240,214,150,${0.95 * a})`, 0.016);
  g.beginPath(); g.moveTo(-Math.cos(an) * 0.05, -Math.sin(an) * 0.05);
  g.lineTo(Math.cos(an) * 0.27, Math.sin(an) * 0.27); g.stroke();
  // a faint trailing arc — the hour just passed
  stroke(g, `rgba(240,214,150,${0.18 * a})`, 0.02);
  g.beginPath(); g.arc(0, 0, 0.22, -Math.PI / 2, an); g.stroke();
  g.fillStyle = `rgba(240,214,150,${0.9 * a})`; g.beginPath(); g.arc(0, 0, 0.022, 0, TAU); g.fill();
  grain(g, u, a, 151, 'rgba(120,120,130,1)', 0.3);
  smudge(g, anchor, 0.10, '214,196,150', a);
  fuse(g, a, state.P);
  g.restore();
};

/* ════════════════════════ a day and a night (e=5) — CENTREPIECE ════════════
   The sun arcs, dips below the hills; the sky darkens and the stars wheel;
   dawn returns. One turn of the Earth per loop. */
SpanArt.day = function (g, u, a, t, anchor, state) {
  g.save(); g.scale(u, u);
  const p = state.still ? 0.28 : state.phase;      // 0 = deep before dawn
  const HOR = 0.16;                                 // the horizon line, y
  // day-fraction: 0 midnight → 0.5 noon → 1 midnight, seamless
  const sun = p;                                    // sun's progress across the sky
  const alt = Math.sin((sun - 0.25) * TAU);          // + above horizon, − below
  const daylight = Math.max(0, alt);                 // 0 at night, 1 at noon
  // the sky — warm at the horizon at dawn/dusk, deep blue by night
  const sky = g.createLinearGradient(0, -0.5, 0, HOR);
  const dawnDusk = Math.max(0, 1 - Math.abs(alt) * 3.4) * (1 - daylight * 0.5);
  const zTop = mix([8, 12, 26], [96, 150, 214], daylight);
  const zHor = mix(mix([20, 26, 44], [232, 150, 78], dawnDusk), [150, 190, 226], daylight * 0.7);
  sky.addColorStop(0, rgb(zTop, a)); sky.addColorStop(1, rgb(zHor, a));
  g.fillStyle = sky; g.fillRect(-0.5, -0.5, 1, HOR + 0.5);
  // the stars, wheeling about a pole, only when it is dark
  const starA = a * Math.max(0, 1 - daylight * 4);
  if (starA > 0.01) {
    const r = sgPts(19, 90), rot = p * TAU, px = 0.22, py = -0.42;
    g.fillStyle = 'rgba(255,250,235,1)';
    for (let i = 0; i < 90; i++) {
      let sx = r[i * 3] * 1.0, sy = r[i * 3 + 1] * 0.7 - 0.16;
      const dx = sx - px, dy = sy - py, c = Math.cos(rot), s = Math.sin(rot);
      const x = px + dx * c - dy * s, y = py + dx * s + dy * c;
      if (y > HOR - 0.01) continue;
      const tw = 0.6 + 0.4 * Math.sin(t * 2 + i);
      g.globalAlpha = starA * (0.3 + 0.7 * r[i * 3 + 2]) * tw;
      g.fillRect(x, y, 0.006, 0.006);
    }
    g.globalAlpha = 1;
  }
  // the sun / moon on its arc
  const arcX = -0.4 + sun * 0.8, arcY = HOR - 0.5 * (alt + 0.05);
  if (alt > -0.12) {
    const rr = 0.05 + 0.02 * dawnDusk;
    const sg = g.createRadialGradient(arcX, arcY, 0, arcX, arcY, rr * 3);
    const sunCol = mix([255, 180, 90], [255, 246, 214], daylight);
    sg.addColorStop(0, rgb(sunCol, a));
    sg.addColorStop(0.3, `rgba(${sunCol[0]},${sunCol[1]},${sunCol[2]},${0.5 * a})`);
    sg.addColorStop(1, `rgba(255,200,120,0)`);
    g.fillStyle = sg; g.beginPath(); g.arc(arcX, arcY, rr * 3, 0, TAU); g.fill();
    g.fillStyle = rgb(sunCol, a); g.beginPath(); g.arc(arcX, arcY, rr, 0, TAU); g.fill();
  } else {
    // the moon crosses at night
    const mx = 0.4 - sun * 0.8, my = HOR - 0.5 * (-alt - 0.05);
    if (-alt > 0.05) { g.fillStyle = rgb([230, 232, 236], starA * 1.4);
      g.beginPath(); g.arc(mx, my, 0.032, 0, TAU); g.fill(); }
  }
  // the hills, a dark silhouette below the horizon
  g.fillStyle = rgb(mix([6, 8, 12], [26, 40, 30], daylight * 0.5), a);
  g.beginPath(); g.moveTo(-0.5, HOR);
  g.quadraticCurveTo(-0.24, HOR - 0.06, -0.05, HOR - 0.015);
  g.quadraticCurveTo(0.2, HOR - 0.08, 0.5, HOR - 0.02);
  g.lineTo(0.5, 0.5); g.lineTo(-0.5, 0.5); g.closePath(); g.fill();
  // a lit window in the dark, the human hour
  if (daylight < 0.2) { g.fillStyle = `rgba(255,208,120,${(0.7 * a * (1 - daylight * 5)).toFixed(3)})`;
    g.fillRect(0.10, HOR + 0.10, 0.02, 0.024); }
  grain(g, u, a, 181, 'rgba(120,130,150,1)', 0.28);
  smudge(g, anchor, 0.10, '255,208,120', a);
  if (state.still) drawComb(g, a, '200,180,120');
  fuse(g, a, state.P);
  g.restore();
};

/* ════════════════════════ a month of the moon (e=6) ════════════════════════
   The moon waxes from new to full and wanes back, its terminator sweeping. */
SpanArt.moon = function (g, u, a, t, anchor, state) {
  g.save(); g.scale(u, u);
  const p = state.still ? 0.5 : state.phase;
  // starfield behind
  const r = sgPts(23, 50);
  g.fillStyle = 'rgba(240,240,255,1)';
  for (let i = 0; i < 50; i++) { g.globalAlpha = a * 0.5 * r[i * 3 + 2];
    g.fillRect(r[i * 3], r[i * 3 + 1], 0.005, 0.005); }
  g.globalAlpha = 1;
  const R = 0.28;
  // the lit disc
  const disc = g.createRadialGradient(-0.06, -0.07, 0.02, 0, 0, R);
  disc.addColorStop(0, `rgba(238,238,232,${0.98 * a})`);
  disc.addColorStop(0.8, `rgba(198,200,206,${0.96 * a})`);
  disc.addColorStop(1, `rgba(150,152,160,${0.94 * a})`);
  g.fillStyle = disc; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill();
  // maria — a few dark seas
  const seas = [[-0.06, -0.05, 0.09], [0.08, 0.02, 0.07], [-0.02, 0.11, 0.05], [0.10, -0.10, 0.045]];
  for (const s of seas) { g.fillStyle = `rgba(120,124,134,${0.4 * a})`;
    g.beginPath(); g.arc(s[0], s[1], s[2], 0, TAU); g.fill(); }
  // the shadow: illuminated fraction f = (1 − cos(2π phase))/2, terminator sweeps
  g.save();
  g.beginPath(); g.arc(0, 0, R, 0, TAU); g.clip();
  const f = 0.5 - 0.5 * Math.cos(p * TAU);           // 0 new … 1 full … 0 new
  const waxing = (p < 0.5);
  // terminator x-offset: cos gives the ellipse width of the shadow edge
  const k = Math.cos(p * TAU);                        // +1 new → −1 full
  g.fillStyle = `rgba(10,12,20,${0.92 * a})`;
  g.beginPath();
  const side = waxing ? -1 : 1;                       // dark on left when waxing
  g.moveTo(0, -R);
  g.ellipse(0, 0, R * Math.abs(k), R, 0, -Math.PI / 2, Math.PI / 2, k < 0 ? (side < 0) : (side > 0));
  g.arc(0, 0, R, Math.PI / 2, -Math.PI / 2, side < 0);
  g.closePath();
  if (waxing) { g.beginPath(); g.rect(-R, -R, R * (1 - Math.max(0, k)), 2 * R); }
  // simpler robust shadow: draw dark half + terminator ellipse
  g.restore();
  // robust terminator (recomputed cleanly)
  g.save(); g.beginPath(); g.arc(0, 0, R, 0, TAU); g.clip();
  g.fillStyle = `rgba(9,11,18,${0.94 * a})`;
  g.beginPath();
  if (waxing) { g.moveTo(0, -R); g.arc(0, 0, R, -Math.PI / 2, Math.PI / 2, true); }
  else { g.moveTo(0, -R); g.arc(0, 0, R, -Math.PI / 2, Math.PI / 2, false); }
  g.ellipse(0, 0, R * Math.abs(k), R, 0, Math.PI / 2, -Math.PI / 2, (waxing ? (k > 0) : (k < 0)));
  g.closePath(); g.fill();
  g.restore();
  stroke(g, `rgba(210,212,220,${0.4 * a})`, 0.006);
  g.beginPath(); g.arc(0, 0, R, 0, TAU); g.stroke();
  grain(g, u, a, 211, 'rgba(180,182,190,1)', 0.3);
  smudge(g, anchor, 0.09, '210,212,220', a);
  if (state.still) drawComb(g, a, '200,202,210');
  fuse(g, a, state.P);
  g.restore();
};

/* ════════════════════════ the turning year (e=7) — CENTREPIECE ═════════════
   One branch through the seasons: bud → leaf → gold → bare → snow → bud. */
SpanArt.season = function (g, u, a, t, anchor, state) {
  g.save(); g.scale(u, u);
  const p = state.still ? 0.28 : state.phase;
  // season weights (spring, summer, autumn, winter) — smooth, seamless
  const wp = seasonW(p, 0), ws = seasonW(p, 0.28), wa = seasonW(p, 0.55), ww = seasonW(p, 0.80);
  // sky tint through the year
  const sky = rgb(mix4([150, 190, 200], [120, 180, 214], [200, 170, 120], [180, 190, 210], wp, ws, wa, ww), a * 0.5);
  g.fillStyle = sky; g.fillRect(-0.5, -0.5, 1, 1);
  // snow ground in winter
  if (ww > 0.02) { g.fillStyle = `rgba(228,232,240,${(0.7 * a * ww).toFixed(3)})`;
    g.beginPath(); g.moveTo(-0.5, 0.30); g.quadraticCurveTo(0, 0.22, 0.5, 0.30); g.lineTo(0.5, 0.5); g.lineTo(-0.5, 0.5); g.fill(); }
  // the branch / trunk
  stroke(g, `rgba(70,48,32,${0.95 * a})`, 0.022);
  g.beginPath(); g.moveTo(-0.02, 0.36);
  g.quadraticCurveTo(0.0, 0.10, 0.02, -0.06); g.stroke();
  const boughs = [[-0.20, -0.18], [0.22, -0.14], [-0.10, -0.30], [0.12, -0.28], [0.0, -0.36]];
  stroke(g, `rgba(70,48,32,${0.92 * a})`, 0.012);
  for (const b of boughs) { g.beginPath(); g.moveTo(0.02, -0.02); g.quadraticCurveTo(b[0] * 0.5, b[1] * 0.5 - 0.05, b[0], b[1]); g.stroke(); }
  // the foliage — buds, green leaves, gold leaves; bare in winter
  const r = sgPts(29, 70);
  const leaf = wp * 0.5 + ws + wa;                    // how full the canopy
  for (let i = 0; i < 70; i++) {
    const bx = boughs[i % boughs.length];
    const jx = bx[0] + (r[i * 3] * 0.30), jy = bx[1] + (r[i * 3 + 1] * 0.22) - 0.06;
    const drop = (1 - leaf);                          // leaves fall in autumn→winter
    const yy = jy + drop * (0.5 - jy) * (r[i * 3 + 2]);
    const fall = wa * r[i * 3 + 2] + ww;
    if (r[i * 3 + 2] < 0.5 * (1 - Math.min(1, leaf))) continue;   // sparse when bare
    let col;
    if (ww > 0.5) continue;
    col = mix4([150, 190, 120], [70, 150, 74], [210, 150, 56], [120, 100, 70], wp, ws, wa, ww);
    const sz = 0.010 + 0.014 * r[i * 3 + 2] + wp * 0.006 * (i % 2);
    g.globalAlpha = a * (0.6 + 0.4 * r[i * 3 + 2]) * Math.min(1, leaf + wp);
    g.fillStyle = rgb(col, 1);
    g.beginPath(); g.ellipse(jx, yy - fall * 0.1, sz, sz * 0.7, i, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  // falling leaves in autumn
  if (wa > 0.1 && !state.still) {
    for (let i = 0; i < 16; i++) { const ph = (p * 3 + r[i * 3 + 2]) % 1;
      g.globalAlpha = a * wa * (1 - ph) * 0.8; g.fillStyle = 'rgba(210,150,56,1)';
      const fx = r[i * 3] * 0.4 + Math.sin(ph * 6 + i) * 0.04, fy = -0.1 + ph * 0.45;
      g.beginPath(); g.ellipse(fx, fy, 0.012, 0.007, ph * 6, 0, TAU); g.fill(); }
    g.globalAlpha = 1;
  }
  // snow falling in winter
  if (ww > 0.1 && !state.still) {
    for (let i = 0; i < 30; i++) { const ph = (p * 2 + r[i * 3 + 2]) % 1;
      g.globalAlpha = a * ww * 0.8; g.fillStyle = 'rgba(240,244,250,1)';
      const fx = r[i * 3] + Math.sin(ph * 3 + i) * 0.03, fy = -0.5 + ((ph + r[i * 3 + 1]) % 1) * 1.0;
      g.beginPath(); g.arc(fx, fy, 0.006, 0, TAU); g.fill(); }
    g.globalAlpha = 1;
  }
  grain(g, u, a, 233, 'rgba(120,140,120,1)', 0.24);
  smudge(g, anchor, 0.10, '160,180,120', a);
  if (state.still) drawComb(g, a, '160,180,120');
  fuse(g, a, state.P);
  g.restore();
};

/* ════════════════════════ a life, in a face (e=9) — the emotional heart ════
   Ink-spare, no kitsch: a bare contour and a few lines that deepen from child to
   elder, hair going from dark to white, then softening back at the wrap. */
SpanArt.face = function (g, u, a, t, anchor, state) {
  g.save(); g.scale(u, u);
  const p = state.still ? 0.4 : state.phase;
  // age 0 (child) → 1 (elder), then eases back over the last tenth (renewal)
  const age = p < 0.9 ? p / 0.9 : 1 - (p - 0.9) / 0.1;
  // the head, a soft profile facing left
  const skin = mix([236, 214, 190], [214, 198, 178], age);
  stroke(g, rgb(mix([90, 66, 52], [70, 52, 42], age), 0.8 * a), 0.010);
  g.beginPath();
  // profile contour — brow, nose, lips, chin (child rounder, elder leaner)
  const lean = 0.02 * age;
  g.moveTo(-0.02, -0.30);
  g.quadraticCurveTo(-0.20, -0.26, -0.20, -0.06);       // forehead → brow
  g.quadraticCurveTo(-0.24 - lean, 0.0, -0.24 - lean * 2, 0.06); // nose bridge → tip
  g.quadraticCurveTo(-0.20, 0.10, -0.16, 0.12);         // under nose
  g.quadraticCurveTo(-0.20, 0.16, -0.17, 0.19);         // lips
  g.quadraticCurveTo(-0.20, 0.26, -0.10, 0.30);         // chin
  g.quadraticCurveTo(0.06, 0.34, 0.16, 0.20);           // jaw
  g.quadraticCurveTo(0.22, 0.0, 0.16, -0.20);           // back of head
  g.quadraticCurveTo(0.10, -0.32, -0.02, -0.30);
  g.closePath();
  g.fillStyle = rgb(skin, 0.9 * a); g.fill(); g.stroke();
  // the eye — a spare mark, lids heavier with age
  stroke(g, rgb([60, 44, 36], 0.85 * a), 0.008 + 0.004 * age);
  g.beginPath(); g.moveTo(-0.15, -0.02); g.quadraticCurveTo(-0.10, -0.04, -0.05, -0.02); g.stroke();
  g.fillStyle = rgb([50, 38, 30], 0.8 * a); g.beginPath(); g.arc(-0.10, -0.008, 0.010, 0, TAU); g.fill();
  // the aging lines — brow furrow, nasolabial, crow's feet — fading in with age
  const ln = rgb([120, 92, 74], (0.15 + 0.6 * age) * a);
  stroke(g, ln, 0.005);
  if (age > 0.2) { g.beginPath(); g.moveTo(-0.17, -0.10); g.quadraticCurveTo(-0.12, -0.115, -0.07, -0.10); g.stroke(); } // brow
  if (age > 0.35) { g.beginPath(); g.moveTo(-0.19, 0.07); g.quadraticCurveTo(-0.15, 0.14, -0.13, 0.20); g.stroke(); }   // nasolabial
  if (age > 0.55) { g.beginPath(); g.moveTo(-0.05, -0.02); g.lineTo(-0.02, -0.04); g.moveTo(-0.05, 0.0); g.lineTo(-0.015, 0.0); g.stroke(); } // crow's feet
  if (age > 0.7) { g.beginPath(); g.moveTo(-0.02, 0.15); g.quadraticCurveTo(0.02, 0.17, 0.05, 0.15); g.stroke(); }       // cheek
  // the hair — dark, greying, white
  const hair = mix3([40, 30, 26], [120, 110, 105], [224, 224, 228], Math.min(1, age * 1.1));
  g.fillStyle = rgb(hair, 0.85 * a);
  g.beginPath();
  g.moveTo(-0.02, -0.31); g.quadraticCurveTo(0.14, -0.36, 0.18, -0.18);
  g.quadraticCurveTo(0.24, -0.30, 0.10, -0.36);
  g.quadraticCurveTo(-0.02, -0.40, -0.10, -0.34);
  g.quadraticCurveTo(-0.16, -0.32, -0.20, -0.20);
  g.quadraticCurveTo(-0.18, -0.30, -0.02, -0.31);
  g.closePath();
  if (age < 0.85) g.fill();                              // elder thins the hair
  else { g.globalAlpha = 0.5 * a; g.fill(); g.globalAlpha = 1; }
  grain(g, u, a, 251, 'rgba(180,160,140,1)', 0.22);
  smudge(g, anchor, 0.10, '214,198,178', a);
  if (state.still) drawComb(g, a, '200,180,160');
  fuse(g, a, state.P);
  g.restore();
};

/* ════════════════════════ the ice, advancing (e=13) — CENTREPIECE ══════════
   An ice sheet grinds down across the land, then withdraws, leaving a carved
   valley. Advance to mid-loop, retreat by the wrap. */
SpanArt.ice = function (g, u, a, t, anchor, state) {
  g.save(); g.scale(u, u);
  const p = state.still ? 0.5 : state.phase;
  const adv = 0.5 - 0.5 * Math.cos(p * TAU);            // 0 → 1 → 0, seamless
  // the bedrock, carved deeper the further the ice has ever reached
  const carve = Math.max(adv, 0.35);
  g.fillStyle = rgb([54, 48, 44], 0.9 * a);
  g.beginPath(); g.moveTo(-0.5, 0.5); g.lineTo(-0.5, 0.10);
  g.quadraticCurveTo(-0.2, 0.10 + carve * 0.14, 0.0, 0.12 + carve * 0.20);   // the U-valley
  g.quadraticCurveTo(0.2, 0.10 + carve * 0.14, 0.5, 0.10);
  g.lineTo(0.5, 0.5); g.closePath(); g.fill();
  // striations the ice cut into the rock
  stroke(g, `rgba(30,28,26,${0.5 * a})`, 0.004);
  for (let i = -3; i <= 3; i++) { g.beginPath();
    g.moveTo(-0.4, 0.16 + i * 0.02 + carve * 0.02); g.quadraticCurveTo(0, 0.20 + i * 0.02 + carve * 0.16, 0.4, 0.16 + i * 0.02 + carve * 0.02); g.stroke(); }
  // the glacier itself — a pale mass sweeping in from the top
  const front = -0.5 + adv * 0.9;                       // its leading edge, x
  const ice = g.createLinearGradient(0, -0.5, 0, 0.15);
  ice.addColorStop(0, `rgba(226,236,244,${0.95 * a})`);
  ice.addColorStop(0.7, `rgba(188,212,230,${0.92 * a})`);
  ice.addColorStop(1, `rgba(150,186,214,${0.9 * a})`);
  g.fillStyle = ice;
  g.beginPath(); g.moveTo(-0.5, -0.5); g.lineTo(0.5, -0.5); g.lineTo(0.5, -0.5);
  // the snout: a lobed front edge
  g.lineTo(front + 0.14, -0.4);
  g.quadraticCurveTo(front + 0.06, -0.1, front, 0.06);
  g.quadraticCurveTo(front - 0.10, 0.10, front - 0.16, -0.02);
  g.quadraticCurveTo(front - 0.24, -0.3, front - 0.34, -0.5);
  g.closePath();
  if (adv > 0.02) g.fill();
  // crevasses
  if (adv > 0.1) { stroke(g, `rgba(150,186,214,${0.5 * a})`, 0.005);
    for (let i = 0; i < 5; i++) { const cx = -0.4 + i * 0.16 * adv; g.beginPath();
      g.moveTo(cx, -0.4); g.lineTo(cx + 0.02, -0.1 - 0.1 * adv); g.stroke(); } }
  // meltwater gleam at the snout
  if (adv > 0.15) { g.fillStyle = `rgba(180,214,236,${(0.4 * a * adv).toFixed(3)})`;
    g.beginPath(); g.ellipse(front - 0.05, 0.08, 0.05, 0.012, 0, 0, TAU); g.fill(); }
  grain(g, u, a, 271, 'rgba(200,216,228,1)', 0.24);
  smudge(g, anchor, 0.10, '200,216,228', a);
  if (state.still) drawComb(g, a, '200,216,228');
  fuse(g, a, state.P);
  g.restore();
};

/* ════════════════════════ longer than the stars (e=18) — top drawn ═════════
   A slow field of stars kindles, burns, and gutters to red embers; the terminal
   above is the blank, unexposed filmstrip. */
SpanArt.cosmos = function (g, u, a, t, anchor, state) {
  g.save(); g.scale(u, u);
  const p = state.still ? 0.4 : state.phase;
  g.fillStyle = `rgba(6,7,12,${0.6 * a})`; g.fillRect(-0.5, -0.5, 1, 1);
  // a faint galaxy drift
  const gg = g.createRadialGradient(0.06, -0.04, 0.02, 0.06, -0.04, 0.42);
  gg.addColorStop(0, `rgba(120,110,150,${0.18 * a})`);
  gg.addColorStop(1, 'rgba(60,50,90,0)');
  g.fillStyle = gg; g.save(); g.rotate(p * 0.4); g.beginPath(); g.ellipse(0.06, -0.04, 0.4, 0.16, 0.6, 0, TAU); g.fill(); g.restore();
  // the stars: each kindles, burns white, reddens, guts out — staggered
  const r = sgPts(37, 120);
  for (let i = 0; i < 120; i++) {
    const born = r[i * 3 + 2];
    const life = (p + born) % 1;                        // its own place in the cycle
    // brightness: rise, plateau, fade
    const b = Math.sin(Math.min(1, life * 1.3) * Math.PI) * (life < 0.85 ? 1 : (1 - life) / 0.15);
    if (b <= 0.01) continue;
    const red = Math.min(1, life * 1.2);               // cools to red as it ages
    const col = mix([255, 250, 240], [220, 90, 60], red * red);
    const x = r[i * 3], y = r[i * 3 + 1];
    const sz = 0.004 + 0.006 * born;
    g.globalAlpha = a * b;
    // a soft bloom for the bright ones
    if (b > 0.6 && born > 0.7) { const bl = g.createRadialGradient(x, y, 0, x, y, 0.03);
      bl.addColorStop(0, rgb(col, 0.5 * b)); bl.addColorStop(1, rgb(col, 0));
      g.fillStyle = bl; g.beginPath(); g.arc(x, y, 0.03, 0, TAU); g.fill(); }
    g.fillStyle = rgb(col, 1); g.beginPath(); g.arc(x, y, sz, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  grain(g, u, a, 291, 'rgba(120,120,160,1)', 0.3);
  smudge(g, anchor, 0.09, '200,180,220', a);
  if (state.still) drawComb(g, a, '180,170,210');
  fuse(g, a, state.P);
  g.restore();
};

/* ── colour helpers ──────────────────────────────────────────────────────── */
function mix(c0, c1, t) { t = Math.max(0, Math.min(1, t)); return [c0[0] + (c1[0] - c0[0]) * t, c0[1] + (c1[1] - c0[1]) * t, c0[2] + (c1[2] - c0[2]) * t]; }
function mix3(c0, c1, c2, t) { return t < 0.5 ? mix(c0, c1, t * 2) : mix(c1, c2, (t - 0.5) * 2); }
function mix4(a0, a1, a2, a3, w0, w1, w2, w3) { const s = w0 + w1 + w2 + w3 || 1;
  return [(a0[0] * w0 + a1[0] * w1 + a2[0] * w2 + a3[0] * w3) / s,
          (a0[1] * w0 + a1[1] * w1 + a2[1] * w2 + a3[1] * w3) / s,
          (a0[2] * w0 + a1[2] * w1 + a2[2] * w2 + a3[2] * w3) / s]; }
function rgb(c, a) { return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`; }
function seasonW(p, centre) { let d = Math.abs(((p - centre) % 1 + 1) % 1); d = Math.min(d, 1 - d);
  return Math.max(0, 1 - d / 0.28); }

/* ════════════════════════ a wave of light (e=−15) — fast pole ══════════════
   A single sinusoid crest sweeps through a field of cold light; one wavelength
   of travel per loop → seamless. At human scale it is the fuse-mote; gazed, a
   watchable ripple of blue-white. */
SpanArt.wave = function (g, u, a, t, anchor, state) {
  g.save(); g.scale(u, u);
  const p = state.still ? 0.0 : state.phase;
  g.fillStyle = `rgba(6,10,20,${(0.5 * a).toFixed(3)})`; g.fillRect(-0.5, -0.5, 1, 1);
  const K = 3, shift = p * TAU;                          // wavelengths across, 1λ travel/loop
  const wavefront = (yc, amp, alpha, w) => {
    stroke(g, `rgba(150,196,255,${(alpha * a).toFixed(3)})`, w);
    g.beginPath();
    for (let i = 0; i <= 60; i++) { const x = -0.5 + i / 60, y = yc + amp * Math.sin(x * TAU * K - shift);
      i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
  };
  wavefront(-0.15, 0.05, 0.20, 0.006);
  wavefront( 0.15, 0.05, 0.20, 0.006);
  wavefront( 0.0,  0.11, 0.55, 0.012);
  // the bright travelling packet — a gaussian envelope riding the central wave
  const pk = -0.5 + p;                                    // crest centre sweeps L→R
  for (let i = 0; i <= 40; i++) {
    const x = -0.5 + i / 40, d = x - pk, env = Math.exp(-d * d / 0.010);
    if (env < 0.05) continue;
    const y = 0.11 * Math.sin(x * TAU * K - shift);
    g.globalAlpha = a * env;
    const bl = g.createRadialGradient(x, y, 0, x, y, 0.05);
    bl.addColorStop(0, 'rgba(226,244,255,0.9)'); bl.addColorStop(1, 'rgba(150,196,255,0)');
    g.fillStyle = bl; g.beginPath(); g.arc(x, y, 0.05, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  grain(g, u, a, 401, 'rgba(150,180,240,1)', 0.3);
  smudge(g, anchor, 0.10, '186,200,240', a);
  if (state.still) drawComb(g, a, '186,200,240');
  fuse(g, a, state.P);
  g.restore();
};

/* ════════════════════════ a bond, trembling (e=−12) — fast pole ════════════
   Two atoms on a spring, breathing in and out once per loop. */
SpanArt.bond = function (g, u, a, t, anchor, state) {
  g.save(); g.scale(u, u);
  const p = state.still ? 0.25 : state.phase;
  const sep = 0.18 + 0.07 * Math.sin(p * TAU);           // bond length, seamless
  g.save(); g.rotate(-0.16);
  // the spring — a zig between the atoms, coil count fixed
  const N = 8, x0 = -sep, x1 = sep;
  stroke(g, `rgba(198,180,236,${(0.55 * a).toFixed(3)})`, 0.010);
  g.beginPath(); g.moveTo(x0, 0);
  for (let i = 1; i < N; i++) { const f = i / N, x = x0 + (x1 - x0) * f, y = (i % 2 ? 1 : -1) * 0.05;
    g.lineTo(x, y); }
  g.lineTo(x1, 0); g.stroke();
  // the two atoms
  for (const [cx, col] of [[-sep, [176, 150, 236]], [sep, [206, 160, 214]]]) {
    const r = 0.13, gr = g.createRadialGradient(cx - 0.03, -0.03, 0.01, cx, 0, r);
    gr.addColorStop(0, rgb(mix(col, [255, 255, 255], 0.5), 0.98 * a));
    gr.addColorStop(0.7, rgb(col, 0.96 * a));
    gr.addColorStop(1, rgb(mix(col, [20, 16, 40], 0.5), 0.94 * a));
    g.fillStyle = gr; g.beginPath(); g.arc(cx, 0, r, 0, TAU); g.fill();
    g.fillStyle = `rgba(255,250,255,${(0.5 * a).toFixed(3)})`;
    g.beginPath(); g.arc(cx - 0.04, -0.04, 0.02, 0, TAU); g.fill();
  }
  g.restore();
  grain(g, u, a, 421, 'rgba(200,180,236,1)', 0.3);
  smudge(g, anchor, 0.10, '206,190,236', a);
  if (state.still) drawComb(g, a, '206,190,236');
  fuse(g, a, state.P);
  g.restore();
};

/* ════════════════════════ a nerve spark (e=−9) — fast pole ═════════════════
   An action potential races down a myelinated axon, one pass per loop. */
SpanArt.spark = function (g, u, a, t, anchor, state) {
  g.save(); g.scale(u, u);
  const p = state.still ? 0.5 : state.phase;
  const axy = (x) => 0.02 + (x / 0.44) * (-0.04);        // the axon's gentle tilt
  // the axon tube + myelin sheaths
  stroke(g, `rgba(120,110,150,${(0.5 * a).toFixed(3)})`, 0.05);
  g.beginPath(); g.moveTo(-0.44, axy(-0.44)); g.lineTo(0.44, axy(0.44)); g.stroke();
  stroke(g, `rgba(198,186,224,${(0.45 * a).toFixed(3)})`, 0.055);
  for (let i = 0; i < 6; i++) { const x0 = -0.42 + i * 0.145, x1 = x0 + 0.10;
    g.beginPath(); g.moveTo(x0, axy(x0)); g.lineTo(x1, axy(x1)); g.stroke(); }
  // the depolarisation pulse — a bright bump racing along
  const pk = -0.5 + p;
  for (let i = 0; i <= 50; i++) {
    const x = -0.44 + i / 50 * 0.88, d = x - pk, env = Math.exp(-d * d / 0.006);
    if (env < 0.05) continue;
    const y = axy(x);
    g.globalAlpha = a * env;
    const bl = g.createRadialGradient(x, y, 0, x, y, 0.06);
    bl.addColorStop(0, 'rgba(236,224,255,0.95)');
    bl.addColorStop(0.5, 'rgba(190,150,236,0.6)');
    bl.addColorStop(1, 'rgba(150,110,220,0)');
    g.fillStyle = bl; g.beginPath(); g.arc(x, y, 0.06, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  grain(g, u, a, 441, 'rgba(200,186,236,1)', 0.28);
  smudge(g, anchor, 0.10, '214,196,236', a);
  if (state.still) drawComb(g, a, '214,196,236');
  fuse(g, a, state.P);
  g.restore();
};

/* ════════════════════════ a camera flash (e=−6) — fast pole ════════════════
   A bulb fires: a sharp rise, a bloom, a slow decay to dark before the wrap. */
SpanArt.flash = function (g, u, a, t, anchor, state) {
  g.save(); g.scale(u, u);
  const p = state.still ? 0.10 : state.phase;
  const q = (p % 1 + 1) % 1;
  // a fast rise, a long incandescent decay, tapered to nothing at the wrap
  const fire = Math.exp(-q * 3.0) * (1 - Math.exp(-q * 45)) * (1 - Math.pow(q, 8));
  // the reflector + bulb
  g.fillStyle = `rgba(40,44,54,${(0.7 * a).toFixed(3)})`;
  g.beginPath(); g.moveTo(-0.14, 0.20); g.lineTo(0.14, 0.20);
  g.lineTo(0.10, -0.02); g.lineTo(-0.10, -0.02); g.closePath(); g.fill();
  // the always-present standby ready-lamp, gently pulsing (the flash recharging)
  const ready = 0.4 + 0.3 * Math.sin(p * TAU * 2);
  g.fillStyle = `rgba(255,140,70,${(0.5 * a * ready * (1 - fire)).toFixed(3)})`;
  g.beginPath(); g.arc(-0.10, 0.16, 0.014, 0, TAU); g.fill();
  const bulb = 0.06 + 0.03 * fire;
  const bg = g.createRadialGradient(0, -0.02, 0, 0, -0.02, bulb);
  bg.addColorStop(0, rgb([255, 255, 255], (0.4 + 0.6 * fire) * a));
  bg.addColorStop(0.7, rgb([255, 244 - 40 * fire, 210], (0.4 + 0.5 * fire) * a));
  bg.addColorStop(1, rgb([220, 224, 236], 0.3 * a));
  g.fillStyle = bg; g.beginPath(); g.arc(0, -0.02, bulb, 0, TAU); g.fill();
  // the bloom + a spray of glints
  if (fire > 0.01) {
    const R = 0.14 + 0.5 * fire, gr = g.createRadialGradient(0, -0.02, 0, 0, -0.02, R);
    gr.addColorStop(0, `rgba(255,252,240,${(0.85 * a * fire).toFixed(3)})`);
    gr.addColorStop(0.3, `rgba(255,242,206,${(0.4 * a * fire).toFixed(3)})`);
    gr.addColorStop(1, 'rgba(255,236,186,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, -0.02, R, 0, TAU); g.fill();
    stroke(g, `rgba(255,250,235,${(0.5 * a * fire).toFixed(3)})`, 0.006);
    for (let k = 0; k < 6; k++) { const an = k / 6 * TAU + 0.3;
      g.beginPath(); g.moveTo(Math.cos(an) * 0.08, -0.02 + Math.sin(an) * 0.08);
      g.lineTo(Math.cos(an) * (0.16 + 0.3 * fire), -0.02 + Math.sin(an) * (0.16 + 0.3 * fire)); g.stroke(); }
  }
  grain(g, u, a, 461, 'rgba(230,220,200,1)', 0.26);
  smudge(g, anchor, 0.10, '240,226,196', a);
  if (state.still) drawComb(g, a, '240,226,196');
  fuse(g, a, state.P);
  g.restore();
};

/* ════════════════════════ a fly's wingbeat (e=−3) — fast pole ══════════════
   A wing sweeps up and down through its own motion-blur, one beat per loop. */
SpanArt.wing = function (g, u, a, t, anchor, state) {
  g.save(); g.scale(u, u);
  const p = state.still ? 0.3 : state.phase;
  const ang = 0.7 * Math.sin(p * TAU);                   // wing elevation, seamless
  const hinge = [-0.14, 0.06];
  // the body
  g.fillStyle = `rgba(40,38,34,${(0.85 * a).toFixed(3)})`;
  g.beginPath(); g.ellipse(-0.02, 0.10, 0.16, 0.07, 0.1, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(-0.20, 0.05, 0.06, 0.045, 0, 0, TAU); g.fill();   // head
  const wing = (an, alpha) => {
    g.save(); g.translate(hinge[0], hinge[1]); g.rotate(-an);
    const wg = g.createLinearGradient(0, 0, 0.42, -0.06);
    wg.addColorStop(0, `rgba(236,224,200,${(0.10 * alpha * a).toFixed(3)})`);
    wg.addColorStop(1, `rgba(210,224,236,${(0.34 * alpha * a).toFixed(3)})`);
    g.fillStyle = wg;
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(0.30, -0.20, 0.44, -0.05);
    g.quadraticCurveTo(0.36, 0.06, 0, 0.03); g.closePath(); g.fill();
    stroke(g, `rgba(180,190,200,${(0.3 * alpha * a).toFixed(3)})`, 0.004);
    g.beginPath(); g.moveTo(0.02, 0.0); g.quadraticCurveTo(0.26, -0.10, 0.42, -0.04); g.stroke();
    g.restore();
  };
  if (!state.still) for (let k = 4; k >= 1; k--) {
    wing(0.7 * Math.sin((p - k * 0.02) * TAU), 0.18 * (1 - k / 5)); }
  wing(ang, 1);
  grain(g, u, a, 481, 'rgba(220,210,190,1)', 0.28);
  smudge(g, anchor, 0.10, '236,210,176', a);
  if (state.still) drawComb(g, a, '236,210,176');
  fuse(g, a, state.P);
  g.restore();
};

/* ════════════════════════ since the first writing (e=10) — deep time ═══════
   Rows of ink-glyphs scroll up a parchment panel — an endless page being
   written. The scroll recycles over a full period → seamless. */
SpanArt.writing = function (g, u, a, t, anchor, state) {
  g.save(); g.scale(u, u);
  const p = state.still ? 0 : state.phase;
  const rows = 9, rh = 0.09, off = p * rows * rh;         // one full page per loop
  g.save();
  g.beginPath(); g.rect(-0.34, -0.40, 0.68, 0.80); g.clip();
  const pane = g.createLinearGradient(0, -0.4, 0, 0.4);
  pane.addColorStop(0, `rgba(214,204,182,${(0.9 * a).toFixed(3)})`);
  pane.addColorStop(1, `rgba(196,184,160,${(0.9 * a).toFixed(3)})`);
  g.fillStyle = pane; g.fillRect(-0.34, -0.40, 0.68, 0.80);
  const nGl = 11, r = sgPts(59, rows * nGl);
  stroke(g, `rgba(40,30,22,${(0.8 * a).toFixed(3)})`, 0.004);
  for (let rIdx = -2; rIdx < rows * 2 + 2; rIdx++) {
    const y = 0.36 - rIdx * rh + off;
    if (y < -0.44 || y > 0.44) continue;
    const rowSeed = ((rIdx % rows) + rows) % rows;
    for (let c = 0; c < nGl; c++) {
      const idx = rowSeed * nGl + c, s = r[idx * 3 + 2];
      if (s < 0.14) continue;                              // gaps: word breaks
      const gx = -0.30 + c * 0.055 + r[idx * 3] * 0.006;
      g.beginPath();
      g.moveTo(gx, y - 0.014); g.lineTo(gx, y + 0.014);
      g.moveTo(gx, y - 0.014); g.lineTo(gx + 0.018 * s, y - 0.008);
      g.moveTo(gx - 0.006, y + 0.010); g.lineTo(gx + 0.012, y + 0.014);
      g.stroke();
    }
  }
  g.restore();
  stroke(g, `rgba(120,100,70,${(0.4 * a).toFixed(3)})`, 0.006);
  g.strokeRect(-0.34, -0.40, 0.68, 0.80);
  grain(g, u, a, 501, 'rgba(160,148,124,1)', 0.28);
  smudge(g, anchor, 0.10, '206,214,220', a);
  if (state.still) drawComb(g, a, '206,214,220');
  fuse(g, a, state.P);
  g.restore();
};

/* ════════════════════════ the age of a city (e=11) — deep time ═════════════
   Night falls over a skyline and its windows kindle; dawn returns and they wink
   out. A crane marks the city still rising. One day–night per loop → seamless. */
SpanArt.city = function (g, u, a, t, anchor, state) {
  g.save(); g.scale(u, u);
  const p = state.still ? 0.55 : state.phase;
  const night = 0.5 - 0.5 * Math.cos(p * TAU);           // 0 day → 1 deep night → 0
  const HOR = 0.24;
  const sky = g.createLinearGradient(0, -0.5, 0, HOR);
  sky.addColorStop(0, rgb(mix([150, 180, 206], [8, 10, 26], night), a));
  sky.addColorStop(1, rgb(mix([206, 196, 176], [24, 22, 44], night), a));
  g.fillStyle = sky; g.fillRect(-0.5, -0.5, 1, HOR + 0.5);
  if (night > 0.4) { const r = sgPts(61, 40); g.fillStyle = 'rgba(240,240,255,1)';
    for (let i = 0; i < 40; i++) { g.globalAlpha = a * (night - 0.4) * 1.6 * r[i * 3 + 2];
      g.fillRect(r[i * 3], r[i * 3 + 1] * 0.6 - 0.2, 0.005, 0.005); } g.globalAlpha = 1; }
  const tw = [[-0.42, 0.10, 0.13], [-0.30, 0.16, 0.16], [-0.16, 0.11, 0.30], [-0.03, 0.14, 0.22],
              [0.12, 0.10, 0.34], [0.24, 0.13, 0.18], [0.37, 0.09, 0.26]];
  for (let b = 0; b < tw.length; b++) {
    const [x, w, h] = tw[b];
    g.fillStyle = rgb(mix([70, 74, 86], [16, 18, 30], night), a);
    g.fillRect(x - w / 2, HOR - h, w, h + 0.28);
    const cols = 3, rowsN = Math.max(2, Math.floor(h / 0.045)), r = sgPts(600 + b, cols * rowsN);
    for (let wy = 0; wy < rowsN; wy++) for (let wx = 0; wx < cols; wx++) {
      const idx = wy * cols + wx, lit = Math.max(0, Math.min(1, (night - r[idx * 3 + 2] * 0.8) * 4));
      if (lit < 0.02) continue;
      g.fillStyle = `rgba(255,214,130,${(0.8 * a * lit).toFixed(3)})`;
      g.fillRect(x - w / 2 + 0.012 + wx * (w - 0.02) / cols, HOR - h + 0.02 + wy * 0.045, 0.016, 0.02);
    }
  }
  // a construction crane atop the tallest — the city still rising
  stroke(g, rgb(mix([120, 120, 130], [60, 60, 72], night), 0.8 * a), 0.006);
  g.beginPath();
  g.moveTo(0.12, HOR - 0.34); g.lineTo(0.12, HOR - 0.46);
  g.moveTo(0.12, HOR - 0.44); g.lineTo(0.24, HOR - 0.44);
  g.moveTo(0.12, HOR - 0.44); g.lineTo(0.06, HOR - 0.45);
  g.moveTo(0.20, HOR - 0.44); g.lineTo(0.20, HOR - 0.40); g.stroke();
  g.fillStyle = rgb(mix([40, 44, 40], [10, 12, 20], night), a);
  g.fillRect(-0.5, HOR, 1, 0.5 - HOR);
  if (night > 0.3) { g.fillStyle = `rgba(255,200,120,${(0.10 * a * night).toFixed(3)})`;
    g.fillRect(-0.5, HOR, 1, 0.06); }
  grain(g, u, a, 521, 'rgba(120,120,140,1)', 0.26);
  smudge(g, anchor, 0.10, '210,206,224', a);
  if (state.still) drawComb(g, a, '210,206,224');
  fuse(g, a, state.P);
  g.restore();
};

/* ════════════════════════ a mountain, rising (e=14) — deep time ════════════
   Strata fold upward into a peak, then erosion wears it back down — one
   orogeny→erosion cycle per loop → seamless. */
SpanArt.mountain = function (g, u, a, t, anchor, state) {
  g.save(); g.scale(u, u);
  const p = state.still ? 0.55 : state.phase;
  const up = 0.5 - 0.5 * Math.cos(p * TAU);              // 0 flat → 1 peak → 0
  const base = 0.34, apex = base - up * 0.44;
  // an OPAQUE twilight sky — no parent-span bleed through the peak
  const sky = g.createLinearGradient(0, -0.5, 0, base);
  sky.addColorStop(0, rgb([26, 34, 58], a));
  sky.addColorStop(1, rgb([124, 98, 98], 0.92 * a));
  g.fillStyle = sky; g.fillRect(-0.5, -0.5, 1, base + 0.5);
  // the ridge silhouette — a sharp alpine massif with shoulders
  const ridge = () => { g.beginPath(); g.moveTo(-0.5, base);
    g.lineTo(-0.32, base - up * 0.14); g.lineTo(-0.16, base - up * 0.28);
    g.lineTo(-0.04, base - up * 0.44); g.lineTo(0.04, base - up * 0.40);
    g.lineTo(0.10, base - up * 0.30); g.lineTo(0.24, base - up * 0.16);
    g.lineTo(0.5, base); g.lineTo(0.5, 0.5); g.lineTo(-0.5, 0.5); g.closePath(); };
  g.save(); ridge(); g.clip();
  // the rock body, lit from the left
  const rock = g.createLinearGradient(-0.3, 0, 0.32, 0.2);
  rock.addColorStop(0, rgb([150, 132, 112], a));
  rock.addColorStop(0.5, rgb([110, 96, 82], a));
  rock.addColorStop(1, rgb([70, 60, 52], a));
  g.fillStyle = rock; g.fillRect(-0.5, apex - 0.05, 1, 0.6);
  // folded strata — curved bands that bow upward with the uplift
  stroke(g, `rgba(52,44,38,${(0.4 * a).toFixed(3)})`, 0.004);
  for (let i = 0; i < 8; i++) { const yy = base - i * 0.055;
    g.beginPath(); g.moveTo(-0.5, yy); g.quadraticCurveTo(0, yy - up * 0.10, 0.5, yy); g.stroke(); }
  // snow above the snowline — a horizontal band, the clip makes it cap the peaks
  if (up > 0.3) { const snow = apex + 0.15;
    g.fillStyle = rgb([234, 240, 248], a * Math.min(1, (up - 0.3) * 1.8));
    g.fillRect(-0.5, apex - 0.05, 1, snow - (apex - 0.05)); }
  g.restore();
  // rim light along the sunlit ridgeline
  stroke(g, `rgba(255,232,200,${(0.45 * a * up).toFixed(3)})`, 0.005);
  g.beginPath(); g.moveTo(-0.32, base - up * 0.14); g.lineTo(-0.16, base - up * 0.28);
  g.lineTo(-0.04, base - up * 0.44); g.stroke();
  const wear = Math.max(0, (p - 0.5) * 2);                // talus fans out as it wears
  if (wear > 0.05 && !state.still) { g.fillStyle = `rgba(90,78,66,${(0.4 * a * wear).toFixed(3)})`;
    g.beginPath(); g.moveTo(-0.22, base + 0.02); g.quadraticCurveTo(0, base - up * 0.10 * wear, 0.22, base + 0.02);
    g.lineTo(0.22, base + 0.05); g.lineTo(-0.22, base + 0.05); g.closePath(); g.fill(); }
  grain(g, u, a, 541, 'rgba(150,134,112,1)', 0.3);
  smudge(g, anchor, 0.10, '200,200,210', a);
  if (state.still) drawComb(g, a, '200,200,210');
  fuse(g, a, state.P);
  g.restore();
};

/* ════════════════════════ the continents adrift (e=15) — deep time ═════════
   Two landmasses part across an ocean globe and drift back, a mid-ocean ridge
   glowing between them at the widest. One rifting cycle per loop → seamless. */
SpanArt.drift = function (g, u, a, t, anchor, state) {
  g.save(); g.scale(u, u);
  const p = state.still ? 0.5 : state.phase;
  const part = 0.5 - 0.5 * Math.cos(p * TAU), R = 0.34, dx = part * 0.16;
  g.save(); g.beginPath(); g.arc(0, 0, R, 0, TAU); g.clip();
  const oc = g.createRadialGradient(-0.08, -0.10, 0.02, 0, 0, R);
  oc.addColorStop(0, rgb([46, 96, 140], 0.96 * a));
  oc.addColorStop(1, rgb([18, 44, 78], 0.96 * a));
  g.fillStyle = oc; g.fillRect(-R, -R, 2 * R, 2 * R);
  if (part > 0.08) {
    g.fillStyle = `rgba(255,180,90,${(0.14 * a * part).toFixed(3)})`;
    g.fillRect(-(0.02 * part + 0.01), -R, 0.02 * part + 0.02, 2 * R);
    stroke(g, `rgba(236,150,80,${(0.5 * a * part).toFixed(3)})`, 0.01 + 0.006 * part);
    g.beginPath(); g.moveTo(0, -R); g.lineTo(0, R); g.stroke();
  }
  const contour = () => { g.beginPath(); g.moveTo(0.0, -0.20);
    g.bezierCurveTo(0.20, -0.16, 0.22, 0.02, 0.13, 0.16);
    g.bezierCurveTo(0.09, 0.22, 0.03, 0.20, 0.0, 0.14);
    g.bezierCurveTo(-0.02, 0.04, -0.02, -0.08, 0.0, -0.20); g.closePath(); };
  g.save(); g.translate(dx, 0); g.fillStyle = rgb([104, 120, 70], 0.98 * a); contour(); g.fill(); g.restore();
  g.save(); g.translate(-dx, 0); g.scale(-1, 1); g.fillStyle = rgb([86, 124, 72], 0.98 * a); contour(); g.fill(); g.restore();
  g.restore();
  const sh = g.createRadialGradient(-0.1, -0.12, 0.05, 0, 0, R);
  sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(1, `rgba(0,10,30,${(0.4 * a).toFixed(3)})`);
  g.fillStyle = sh; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill();
  stroke(g, `rgba(160,190,220,${(0.4 * a).toFixed(3)})`, 0.006);
  g.beginPath(); g.arc(0, 0, R, 0, TAU); g.stroke();
  grain(g, u, a, 561, 'rgba(120,150,180,1)', 0.24);
  smudge(g, anchor, 0.10, '196,200,220', a);
  if (state.still) drawComb(g, a, '196,200,220');
  fuse(g, a, state.P);
  g.restore();
};

/* ════════════════════════ the whole of life (e=17) — deep time ═════════════
   A teeming field: fronds, medusae, and coiling shells bud, bloom, and fade,
   each on its own life-phase so the swarm stays full — endlessly proliferating. */
SpanArt.earthlife = function (g, u, a, t, anchor, state) {
  g.save(); g.scale(u, u);
  const p = state.still ? 0.4 : state.phase;
  const bg = g.createLinearGradient(0, -0.5, 0, 0.5);
  bg.addColorStop(0, `rgba(10,26,24,${(0.6 * a).toFixed(3)})`);
  bg.addColorStop(1, `rgba(16,30,18,${(0.6 * a).toFixed(3)})`);
  g.fillStyle = bg; g.fillRect(-0.5, -0.5, 1, 1);
  const r = sgPts(83, 130);
  const palette = [[110, 178, 96], [150, 196, 90], [86, 160, 120], [190, 176, 90], [130, 190, 150]];
  for (let i = 0; i < 44; i++) {
    const life = (p + r[i * 3 + 2]) % 1;                  // its own place in the cycle
    const grow = Math.sin(Math.min(1, life * 1.25) * Math.PI);  // bud → bloom → fade
    if (grow < 0.03) continue;
    const x = r[i * 3], y = r[i * 3 + 1], col = palette[i % palette.length], kind = i % 3;
    g.globalAlpha = a * grow;
    if (kind === 0) {                                     // a frond
      stroke(g, rgb(col, 1), 0.006);
      const h = 0.10 * grow;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 0.02, y - h * 0.6, x, y - h); g.stroke();
      for (let s = 1; s <= 3; s++) { const yy = y - h * s / 3.5, sp = 0.02 * grow * (1 - s / 4);
        g.beginPath(); g.moveTo(x, yy); g.lineTo(x - sp, yy - 0.01); g.moveTo(x, yy); g.lineTo(x + sp, yy - 0.01); g.stroke(); }
    } else if (kind === 1) {                              // a radial bloom / medusa
      g.fillStyle = rgb(col, 0.7); g.beginPath(); g.arc(x, y, 0.012 * grow + 0.004, 0, TAU); g.fill();
      stroke(g, rgb(col, 0.6), 0.003);
      for (let k = 0; k < 6; k++) { const an = k / 6 * TAU + life * TAU * 0.3;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(an) * 0.03 * grow, y + Math.sin(an) * 0.03 * grow); g.stroke(); }
    } else {                                              // a spiral shell / coil
      stroke(g, rgb(col, 0.85), 0.005); g.beginPath();
      for (let s = 0; s <= 16; s++) { const th = s / 16 * TAU * 1.6, rr = 0.002 + 0.020 * grow * s / 16,
        xx = x + Math.cos(th) * rr, yy = y + Math.sin(th) * rr; s ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }
      g.stroke();
    }
  }
  g.globalAlpha = 1;
  grain(g, u, a, 581, 'rgba(120,170,120,1)', 0.26);
  smudge(g, anchor, 0.10, '190,210,190', a);
  if (state.still) drawComb(g, a, '190,210,190');
  fuse(g, a, state.P);
  g.restore();
};

/* ════════════════════════ THE DEFAULT SPAN — an authored beat ══════════════
   A span with no bespoke vignette yet still TICKS honestly: a luminous form that
   breathes once per loop, tinted by its band, composed around its anchor, with
   the scale-free grain so a blow-up stays a picture. A tasteful placeholder the
   art foundry / a fresh builder replaces with the real scene — never a broken or
   empty frame. */
SpanArt._default = function (g, u, a, t, anchor, state, tint) {
  g.save(); g.scale(u, u);
  const p = state.still ? 0.3 : state.phase;
  const pl = pulse(p, 6);
  const col = tint || [210, 196, 168];
  const r = 0.16 + 0.05 * pl;
  const core = g.createRadialGradient(0, 0, 0.01, 0, 0, r + 0.16);
  core.addColorStop(0, rgb(col, (0.34 + 0.22 * pl) * a));
  core.addColorStop(0.5, rgb(col, 0.14 * a));
  core.addColorStop(1, rgb(col, 0));
  g.fillStyle = core; g.beginPath(); g.arc(0, 0, r + 0.14, 0, TAU); g.fill();
  // a faint traveller marking the beat
  if (!state.still) { const an = p * TAU - Math.PI / 2;
    g.fillStyle = rgb(col, 0.5 * a);
    g.beginPath(); g.arc(Math.cos(an) * (r + 0.02), Math.sin(an) * (r + 0.02), 0.012, 0, TAU); g.fill(); }
  else drawComb(g, a, `${col[0] | 0},${col[1] | 0},${col[2] | 0}`);
  grain(g, u, a, 313, rgb(col, 1), 0.3);
  smudge(g, anchor, 0.10, `${col[0] | 0},${col[1] | 0},${col[2] | 0}`, a);
  fuse(g, a, state.P);
  g.restore();
};

/* band tints for any span still on the authored beat — now a safety net only:
   every drawn span in TIME_LADDER has a bespoke vignette above, so this stays
   empty. A key that ever lands here still TICKS honestly, tinted by its band. */
const SG_DEFAULT_TINT = {};

/* the dispatcher a page calls: bespoke if we have it, else the authored beat */
function drawSpan(g, key, u, a, t, anchor, state) {
  const fn = SpanArt[key];
  if (fn) fn(g, u, a, t, anchor, state);
  else SpanArt._default(g, u, a, t, anchor, state, SG_DEFAULT_TINT[key]);
}
