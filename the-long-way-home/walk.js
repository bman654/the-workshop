/* ═══════════════════════════════════════════════════════════════════════════
   walk.js — the engine for "The Long Way Home".

   The twelve stations are a real ring tipped near edge-on: a thin luminous band
   that descends below ONE horizon into a frozen star sky and climbs back to a new
   dawn. You are a glowing mote that walks it. The whole sky + the camera's vertical
   centre TRANSLATE so the active station frames at reading height — so descending
   into the Ordeal you feel the entire firmament SINK overhead, and climbing to the
   Return you feel it rise into gold.

   Hand-rolled pseudo-3D (no Three.js): horizontal & depth from each station's ring
   angle; vertical from its authored ELEVATION (the textured descent-and-return).
   The frozen starfield is the Orrery's pinned deterministic snapshot, baked once.

   Reads: STATIONS (stations.mjs), LWHAudio (audio.js), WS (ws.js). All inlined.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var cv = document.getElementById('stage');
  var ctx = cv.getContext('2d');
  var DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  var W = 0, H = 0;
  var reduce = false;
  try { reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ── the pinned frozen starfield — the Orrery's canonical snapshot, baked ONCE.
       s = 987654321 ; LCG s = (s*1103515245 + 12345) & 0x7fffffff ; 260 stars ;
       mag = r()^2.2. Never re-derived. u,v ∈ [0,1] are the frozen positions; the
       map to the live viewport scales each frame, but the snapshot is immutable. ── */
  var STARS = (function () {
    var out = [], s = 987654321;
    var r = function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    for (var i = 0; i < 260; i++) out.push({ u: r(), v: r(), m: Math.pow(r(), 2.2) });
    return out;
  })();
  /* a handful of brighter named ANCHORS — fixed structure stars (hand-placed in the
     frozen field, not re-derived from any ephemeris). u,v in [0,1] of the field. */
  var ANCHORS = [
    { u: 0.18, v: 0.62, m: 1.0 }, { u: 0.50, v: 0.80, m: 1.0 }, { u: 0.78, v: 0.58, m: 1.0 },
    { u: 0.34, v: 0.90, m: 0.9 }, { u: 0.66, v: 0.94, m: 0.9 }, { u: 0.88, v: 0.82, m: 0.85 }
  ];

  /* ── authored ring geometry: each station's angle around the loop (degrees,
       clockwise from the top). 1 & 12 sit adjacent at the top; the right side
       descends 1→5 to GATE A; the bottom holds the deep (8 = nadir); the left
       climbs 9→11 to GATE B; 12 returns beside 1. ── */
  var ANG = { 1: 17, 2: 49, 3: 76, 4: 102, 5: 124, 6: 150, 7: 167, 8: 180, 9: 199, 10: 224, 11: 249, 12: 343 };
  var EL_MIN = -1.5, EL_MAX = 0.5;
  var GATE_A_IDX = 4.5;   // between station 5 (idx4) and 6 (idx5)
  var GATE_B_IDX = 10.45; // between station 11 (idx10, el-0.2) and 12 (idx11, el+0.3): horizon crossing

  /* ── palette: three mood stops crossfaded by `mood` ∈ [0,2]
       0 = DUSK-warm (Day) · 1 = STAR-COLD indigo (the deep) · 2 = DAWN-gold (Return) */
  function hex(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rgba(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a == null ? 1 : a) + ')'; }
  var PAL = {
    dusk: { skyTop: hex('#241f3a'), skyHorizon: hex('#9a5f2c'), below: hex('#0e1020'), deep: hex('#05060d'),
            line: hex('#e7b864'), band: hex('#f0d489'), star: hex('#cfd6ee') },
    night: { skyTop: hex('#0a1024'), skyHorizon: hex('#1a2740'), below: hex('#070d18'), deep: hex('#02030a'),
             line: hex('#9db4ff'), band: hex('#aebfe6'), star: hex('#dfe6ff') },
    dawn: { skyTop: hex('#1f3a64'), skyHorizon: hex('#f0c060'), below: hex('#101526'), deep: hex('#060a16'),
            line: hex('#f7dd9a'), band: hex('#f7e4ad'), star: hex('#eef0ff') }
  };
  function palAt(mood) {
    var k = ['skyTop', 'skyHorizon', 'below', 'deep', 'line', 'band', 'star'], o = {}, i;
    var A, B, t;
    if (mood <= 1) { A = PAL.dusk; B = PAL.night; t = mood; }
    else { A = PAL.night; B = PAL.dawn; t = mood - 1; }
    for (i = 0; i < k.length; i++) o[k[i]] = mix(A[k[i]], B[k[i]], t);
    return o;
  }

  /* ── live camera + walk state ── */
  var horizonY = 0, horizonTarget = 0;   // screen-y of the el=0 horizon line
  var mood = 0, moodTarget = 0;
  var pos = 0, posTarget = 0;             // continuous ring index (0..11), wraps
  var current = 0;                        // last-arrived station index
  var trail = [];                         // recent mote screen points
  var BANDHALF = 300, VSCALE = 200, TARGETY = 0;
  var leafOpenFor = -1;
  var lastGateCrossPos = 0;
  var started = false;

  function layout() {
    var rect = cv.getBoundingClientRect();
    W = Math.max(320, rect.width); H = Math.max(360, rect.height);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    BANDHALF = Math.min(W * 0.40, 380);
    VSCALE = Math.min(H * 0.27, 250);
    TARGETY = H * 0.60;
  }

  function elOf(i) { return STATIONS[((i % 12) + 12) % 12].el; }
  function angOf(i) { return ANG[(((i % 12) + 12) % 12) + 1]; }
  function depthOf(el) { return (el - EL_MIN) / (EL_MAX - EL_MIN); } // 0 deep/far .. 1 high/near

  /* screen point of integer station i, given the current horizonY */
  function stationScreen(i) {
    var el = elOf(i), a = angOf(i) * Math.PI / 180;
    var d = depthOf(el);
    var sc = 0.60 + 0.55 * d;
    var x = W / 2 + Math.sin(a) * BANDHALF * sc;
    var y = horizonY - el * VSCALE;
    return { x: x, y: y, el: el, d: d };
  }

  /* Catmull-Rom on the closed ring of 12 station points → smooth band + mote path */
  function ringPoint(t) {
    var n = 12;
    var k = Math.floor(t), f = t - k;
    var p0 = stationScreen(k - 1), p1 = stationScreen(k), p2 = stationScreen(k + 1), p3 = stationScreen(k + 2);
    var f2 = f * f, f3 = f2 * f;
    function cr(a, b, c, d) { return 0.5 * ((2 * b) + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f2 + (-a + 3 * b - 3 * c + d) * f3); }
    return {
      x: cr(p0.x, p1.x, p2.x, p3.x),
      y: cr(p0.y, p1.y, p2.y, p3.y),
      el: p1.el + (p2.el - p1.el) * f,
      d: p1.d + (p2.d - p1.d) * f
    };
  }

  /* ── the camera/mood/walk update (one tick) ── */
  function lerp(a, b, t) { return a + (b - a) * t; }
  function shortestDelta(from, to) {
    var d = to - from;
    while (d > 6) d -= 12; while (d <= -6) d += 12;
    return d;
  }
  function smoothstep(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  function update() {
    // camera follows the station the mote is gliding TOWARD (so the sky leads us down)
    var followEl = ringPoint(pos).el;
    horizonTarget = TARGETY + followEl * VSCALE;

    if (reduce) { horizonY = horizonTarget; mood = moodTarget; }
    else {
      horizonY = lerp(horizonY, horizonTarget, 0.09);
      mood = lerp(mood, moodTarget, 0.06);
    }

    // walk the mote along the SHORTER arc toward posTarget
    var prevPos = pos;
    var dd = shortestDelta(pos, posTarget);
    if (Math.abs(dd) < 0.0015) { pos = posTarget % 12; }
    else if (reduce) { pos = posTarget % 12; }
    else { pos = pos + dd * 0.12; }
    pos = ((pos % 12) + 12) % 12;

    // gate crossings → stone thud + (in motion) the felt transition is the mood lerp
    detectGateCross(prevPos, pos);

    // arrival → open the leaf + chime
    var arrivedIdx = Math.round(pos) % 12;
    if (Math.abs(shortestDelta(pos, posTarget)) < 0.01 && arrivedIdx === ((posTarget % 12 + 12) % 12) && leafOpenFor !== arrivedIdx) {
      openLeaf(arrivedIdx);
    }

    // trail
    var mp = ringPoint(pos);
    trail.push({ x: mp.x, y: mp.y });
    if (trail.length > 26) trail.shift();

    LWHAudio.setMood(mood);
  }

  function detectGateCross(a, b) {
    // handle wrap by checking the small interval actually travelled
    var d = shortestDelta(a, b);
    if (Math.abs(d) < 0.0005) return;
    var path = [a, a + d];
    [GATE_A_IDX, GATE_B_IDX].forEach(function (g, gi) {
      var lo = Math.min(path[0], path[1]), hi = Math.max(path[0], path[1]);
      // test the gate and its +12 / -12 ghosts for wrap safety
      [g, g + 12, g - 12].forEach(function (gg) {
        if (gg > lo && gg <= hi) LWHAudio.thud(gi === 1);
      });
    });
  }

  /* ── render ── */
  function draw() {
    var p = palAt(mood);
    // sky: gradient above the horizon, deep star-dark below
    var gTop = ctx.createLinearGradient(0, 0, 0, Math.max(1, horizonY));
    gTop.addColorStop(0, rgba(p.skyTop, 1)); gTop.addColorStop(1, rgba(p.skyHorizon, 1));
    ctx.fillStyle = gTop; ctx.fillRect(0, 0, W, Math.max(0, horizonY));
    var gBot = ctx.createLinearGradient(0, Math.max(0, horizonY), 0, H);
    gBot.addColorStop(0, rgba(p.below, 1)); gBot.addColorStop(1, rgba(p.deep, 1));
    ctx.fillStyle = gBot; ctx.fillRect(0, Math.max(0, horizonY), W, H);

    drawStars(p);
    drawHorizon(p);
    drawBand(p);
    drawGate(GATE_A_IDX, 'descent', p);
    drawGate(GATE_B_IDX, 'dawn', p);
    drawStations(p);
    drawMote(p);
  }

  function drawStars(p) {
    var i, st, sx, sy, list = STARS.concat(ANCHORS);
    ctx.save();
    for (i = 0; i < list.length; i++) {
      st = list[i];
      sx = st.u * W;
      sy = horizonY + (st.v - 0.46) * (H * 1.85);   // anchored to the horizon → fixed firmament
      if (sy < -4 || sy > H + 4) continue;
      var below = sy > horizonY;
      var a = (0.10 + st.m * 0.6) * (below ? 1 : 0.28);   // stars fade in the lit sky
      if (a < 0.02) continue;
      ctx.fillStyle = rgba(p.star, a);
      var rad = 0.4 + st.m * 1.5;
      ctx.beginPath(); ctx.arc(sx, sy, rad, 0, Math.PI * 2); ctx.fill();
      if (st.m > 0.86) { // brighter anchors get a faint cross-glow
        ctx.globalAlpha = a * 0.5;
        ctx.fillRect(sx - rad * 2.4, sy - 0.4, rad * 4.8, 0.8);
        ctx.fillRect(sx - 0.4, sy - rad * 2.4, 0.8, rad * 4.8);
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }

  function drawHorizon(p) {
    ctx.save();
    var g = ctx.createLinearGradient(0, horizonY - 6, 0, horizonY + 6);
    g.addColorStop(0, rgba(p.line, 0));
    g.addColorStop(0.5, rgba(p.line, 0.55));
    g.addColorStop(1, rgba(p.line, 0));
    ctx.fillStyle = g; ctx.fillRect(0, horizonY - 6, W, 12);
    ctx.strokeStyle = rgba(p.line, 0.7); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, horizonY + 0.5); ctx.lineTo(W, horizonY + 0.5); ctx.stroke();
    ctx.restore();
  }

  function drawBand(p) {
    var warm = hex('#f0d489'), cool = mix(hex('#7f93c8'), p.band, 0.5);
    // sample the closed spline densely; colour by lit (above horizon) vs deep
    var N = 12 * 18, i, t, a, b;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // a soft underglow pass
    for (var pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      for (i = 0; i <= N; i++) {
        t = (i / N) * 12;
        var q = ringPoint(t);
        if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
      }
      ctx.strokeStyle = pass === 0 ? rgba(warm, 0.06) : rgba(cool, 0.05);
      ctx.lineWidth = pass === 0 ? 26 : 18;
      ctx.shadowColor = pass === 0 ? rgba(warm, 0.4) : rgba(cool, 0.4);
      ctx.shadowBlur = 18; ctx.stroke();
    }
    ctx.shadowBlur = 0;
    // the lit ribbon: per-segment colour + width by depth & lit-ness
    for (i = 0; i < N; i++) {
      t = (i / N) * 12; var t2 = ((i + 1) / N) * 12;
      a = ringPoint(t); b = ringPoint(t2);
      var lit = smoothstep(horizonY + 8, horizonY - 8, (a.y + b.y) / 2); // 1 above horizon, 0 below
      var col = mix(cool, warm, lit);
      var w = (1.4 + a.d * 3.0) * (0.7 + lit * 0.6);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = rgba(col, 0.35 + 0.5 * (0.4 + 0.6 * lit));
      ctx.lineWidth = w; ctx.stroke();
    }
    ctx.restore();
  }

  function drawGate(idx, kind, p) {
    var c = ringPoint(idx);
    var d = c.d;
    var sc = 0.7 + 0.5 * d;
    var halfW = 30 * sc, pierH = 78 * sc, lintel = 13 * sc, thick = 9 * sc;
    var x = c.x, y = c.y;           // sits on the band, ≈ horizon crossing
    ctx.save();
    if (kind === 'descent') {
      // GATE A — Inanna's seven-fold lapis underworld lintel
      var lapis = '#274a9a', lapisD = '#16306e', carn = '#b8482a';
      // two piers
      ctx.fillStyle = lapisD;
      ctx.fillRect(x - halfW - thick, y - pierH, thick, pierH);
      ctx.fillRect(x + halfW, y - pierH, thick, pierH);
      ctx.fillStyle = lapis;
      ctx.fillRect(x - halfW - thick + 1.5, y - pierH, thick - 3, pierH);
      ctx.fillRect(x + halfW + 1.5, y - pierH, thick - 3, pierH);
      // SEVEN stacked lintels rising over the opening
      for (var s = 0; s < 7; s++) {
        var ly = y - pierH - s * (lintel * 0.62);
        var lw = halfW + thick + 6 * sc - s * 1.0 * sc;
        ctx.fillStyle = (s % 2 === 0) ? lapis : lapisD;
        ctx.fillRect(x - lw, ly - lintel * 0.6, lw * 2, lintel * 0.6);
        // carnelian fleck on each course
        ctx.fillStyle = rgba(hex(carn), 0.9);
        ctx.fillRect(x - 2 * sc, ly - lintel * 0.55, 4 * sc, lintel * 0.45);
      }
      // a cold inner glow under the arch
      var gg = ctx.createRadialGradient(x, y - pierH * 0.55, 2, x, y - pierH * 0.55, halfW * 1.4);
      gg.addColorStop(0, 'rgba(120,150,255,0.18)'); gg.addColorStop(1, 'rgba(120,150,255,0)');
      ctx.fillStyle = gg; ctx.fillRect(x - halfW * 1.5, y - pierH - lintel * 5, halfW * 3, pierH + lintel * 6);
    } else {
      // GATE B — the pale Gate of Horn, rising into dawn
      var horn = '#e9e0c4', hornD = '#c9bd97', glow = '#f4dd9c';
      ctx.fillStyle = hornD;
      ctx.fillRect(x - halfW - thick, y - pierH, thick, pierH);
      ctx.fillRect(x + halfW, y - pierH, thick, pierH);
      ctx.fillStyle = horn;
      ctx.fillRect(x - halfW - thick + 1.5, y - pierH, thick - 3, pierH);
      ctx.fillRect(x + halfW + 1.5, y - pierH, thick - 3, pierH);
      // a smooth round arch (the horn curve)
      ctx.strokeStyle = horn; ctx.lineWidth = thick;
      ctx.beginPath(); ctx.arc(x, y - pierH, halfW + thick / 2, Math.PI, 0); ctx.stroke();
      ctx.strokeStyle = hornD; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y - pierH, halfW + thick / 2, Math.PI, 0); ctx.stroke();
      // dawn glow through the gate
      var dg = ctx.createRadialGradient(x, y - pierH * 0.5, 2, x, y - pierH * 0.5, halfW * 1.8);
      var lit = Math.max(0, mood - 1);
      dg.addColorStop(0, rgba(hex(glow), 0.10 + 0.28 * lit)); dg.addColorStop(1, rgba(hex(glow), 0));
      ctx.fillStyle = dg; ctx.fillRect(x - halfW * 2, y - pierH - halfW * 2, halfW * 4, pierH + halfW * 2.5);
    }
    ctx.restore();
  }

  function drawStations(p) {
    for (var i = 0; i < 12; i++) {
      var s = stationScreen(i), st = STATIONS[i];
      var r = (7 + s.d * 8);
      var lit = s.y < horizonY;
      var rim = lit ? '#f0d489' : '#aebfe6';
      var glow = (i === current) ? 1 : 0.5;
      ctx.save();
      // halo for the active station
      if (i === current) {
        var hg = ctx.createRadialGradient(s.x, s.y, 1, s.x, s.y, r * 3.2);
        hg.addColorStop(0, rgba(hex(rim), 0.5)); hg.addColorStop(1, rgba(hex(rim), 0));
        ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(s.x, s.y, r * 3.2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = rgba(hex('#0a0c14'), 0.85);
      ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = (i === current) ? 2.4 : 1.4;
      ctx.strokeStyle = rgba(hex(rim), 0.55 + glow * 0.4);
      ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.stroke();
      // roman numeral
      ctx.fillStyle = rgba(hex(rim), lit ? 0.95 : 0.8);
      ctx.font = 'italic ' + Math.round(r * 1.05) + 'px Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(st.numeral, s.x, s.y + 0.5);
      ctx.restore();
      st._sx = s.x; st._sy = s.y; st._sr = r; // for hit-testing
    }
  }

  function drawMote(p) {
    var i;
    // trail
    ctx.save();
    for (i = 0; i < trail.length; i++) {
      var a = i / trail.length;
      ctx.fillStyle = rgba(hex('#f0d489'), a * 0.35);
      ctx.beginPath(); ctx.arc(trail[i].x, trail[i].y, 1 + a * 2.2, 0, Math.PI * 2); ctx.fill();
    }
    var mp = ringPoint(pos);
    var g = ctx.createRadialGradient(mp.x, mp.y, 0, mp.x, mp.y, 16);
    g.addColorStop(0, 'rgba(255,244,214,0.95)'); g.addColorStop(0.4, 'rgba(240,212,137,0.6)'); g.addColorStop(1, 'rgba(240,212,137,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mp.x, mp.y, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8e6'; ctx.beginPath(); ctx.arc(mp.x, mp.y, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /* ── navigation ── */
  function goTo(idx, opts) {
    idx = ((idx % 12) + 12) % 12;
    posTarget = idx;
    moodTarget = (STATIONS[idx].n === 12) ? 2 : (STATIONS[idx].arc === 'night' ? 1 : 0);
    current = idx;
    if (!started) return;
    LWHAudio.glide();
    if (reduce) { pos = idx; openLeaf(idx); }
  }
  function step(delta) { goTo(((Math.round(pos) + delta) % 12 + 12) % 12); }

  cv.addEventListener('click', function (ev) {
    var rect = cv.getBoundingClientRect();
    var mx = ev.clientX - rect.left, my = ev.clientY - rect.top;
    var best = -1, bestD = 1e9;
    for (var i = 0; i < 12; i++) {
      var st = STATIONS[i];
      if (st._sx == null) continue;
      var d = Math.hypot(mx - st._sx, my - st._sy);
      if (d < (st._sr + 12) && d < bestD) { bestD = d; best = i; }
    }
    if (best >= 0) goTo(best);
  });

  window.addEventListener('keydown', function (ev) {
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') { step(1); ev.preventDefault(); }
    else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') { step(-1); ev.preventDefault(); }
    else if (ev.key === ' ' || ev.key === 'Spacebar') { goTo((Math.round(pos) + 1) % 12); ev.preventDefault(); }
    else if (ev.key === 'Escape') { closeLeaf(); }
  });

  /* ── the illuminated LEAF (DOM overlay) + the braid ── */
  var leafEl = document.getElementById('leaf');
  var THREADS = {
    odysseus: { name: 'Odysseus', cls: 'th-ody' },
    inanna: { name: 'Inanna', cls: 'th-inanna' },
    prodigal: { name: 'the Prodigal son', cls: 'th-prod' }
  };
  function rubricate(text) {
    // colour the three hero tokens in running prose; absorb the article so the
    // prodigal's canonical name ("the younger son") never doubles its leading "the"
    return text
      .replace(/(the )?YOUNGER SON/g, '<span class="th-prod">the younger son</span>')
      .replace(/ODYSSEUS/g, '<span class="th-ody">Odysseus</span>')
      .replace(/INANNA/g, '<span class="th-inanna">Inanna</span>');
  }
  function braidSVG(st) {
    var keys = ['odysseus', 'inanna', 'prodigal'];
    var cols = { odysseus: '#5aa9e6', inanna: '#3f6fd6', prodigal: '#b07a3a' };
    var Hh = 250, Ww = 44, cx = Ww / 2, parts = '';
    for (var ki = 0; ki < 3; ki++) {
      var key = keys[ki], taut = st.myths[key].tautness;
      var phase = ki * (Math.PI * 2 / 3);
      var w = 1.5 + taut * 7, op = 0.28 + taut * 0.72;
      var dd = 'M ' + cx + ' 0';
      for (var y = 0; y <= Hh; y += 8) {
        var conv = 1 - 0.7 * Math.exp(-Math.pow((y - Hh * 0.5) / 26, 2)); // pinch toward the keyword row
        var x = cx + Math.sin(y / 22 + phase) * 13 * conv;
        dd += ' L ' + x.toFixed(1) + ' ' + y;
      }
      parts += '<path d="' + dd + '" fill="none" stroke="' + cols[key] + '" stroke-width="' + w.toFixed(1) +
        '" stroke-linecap="round" opacity="' + op.toFixed(2) + '"/>';
    }
    // the convergence bead at the keyword row
    parts += '<circle cx="' + cx + '" cy="' + (Hh * 0.5) + '" r="4.5" fill="#f0d489"/>';
    parts += '<circle cx="' + cx + '" cy="' + (Hh * 0.5) + '" r="9" fill="none" stroke="#c9a24a" stroke-width="1" opacity="0.7"/>';
    return '<svg class="braid" viewBox="0 0 ' + Ww + ' ' + Hh + '" preserveAspectRatio="none" aria-hidden="true">' + parts + '</svg>';
  }
  function strandRow(st, key) {
    var m = st.myths[key], taut = m.tautness;
    var th = THREADS[key];
    var rw = (6 + taut * 64).toFixed(0);   // ribbon swatch width %
    var thin = taut < 0.2 ? ' strand-thin' : '';
    return '<div class="strand ' + th.cls + 'b' + thin + '">' +
      '<div class="ribbon-wrap"><span class="ribbon ' + th.cls + 'bg" style="width:' + rw + '%;opacity:' + (0.35 + taut * 0.65).toFixed(2) + '"></span>' +
      '<span class="taut-n">' + Math.round(taut * 100) + '</span></div>' +
      '<div class="strand-line"><span class="hero ' + th.cls + '">' + m.hero + '</span> ' +
      '<span class="strand-text">' + m.text + '</span></div></div>';
  }
  function openLeaf(idx) {
    var st = STATIONS[idx];
    leafOpenFor = idx; current = idx;
    var dc = st.name.charAt(0);
    var html = braidSVG(st) +
      '<div class="leaf-body">' +
        '<div class="leaf-head"><span class="dropcap">' + dc + '</span>' +
          '<div class="leaf-title">' +
            '<div class="leaf-numeral">STATION ' + st.numeral + (st.n === 12 ? ' · the dawn' : (st.arc === 'night' ? ' · the deep' : ' · the day')) + '</div>' +
            '<h2 class="leaf-name"><span class="ln-cap">' + dc + '</span>' + st.name.slice(1) + '</h2>' +
            '<div class="leaf-beat">' + st.beat + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="leaf-keyword"><span>' + st.keyword + '</span></div>' +
        '<p class="leaf-weave">' + rubricate(st.weave) + '</p>' +
        '<div class="strands">' +
          strandRow(st, 'odysseus') + strandRow(st, 'inanna') + strandRow(st, 'prodigal') +
        '</div>' +
        '<div class="leaf-foot">one skeleton · three flesh — where a myth strains, its ribbon runs thin</div>' +
      '</div>';
    leafEl.innerHTML = html;
    leafEl.classList.remove('hidden');
    // re-trigger the unfold animation
    leafEl.classList.remove('unfold'); void leafEl.offsetWidth; leafEl.classList.add('unfold');
    if (started) LWHAudio.chime();
  }
  function closeLeaf() { leafEl.classList.add('hidden'); leafOpenFor = -1; }

  /* ── the begin-curtain unlocks audio on the first real gesture ── */
  var curtain = document.getElementById('curtain');
  function begin() {
    if (started) return;
    started = true;
    LWHAudio.start();
    LWHAudio.setMuted(WS && WS.muted ? WS.muted() : false);
    curtain.classList.add('gone');
    setTimeout(function () { if (curtain.parentNode) curtain.parentNode.removeChild(curtain); }, 900);
    goTo(0);
    openLeaf(0);
  }
  curtain.addEventListener('click', begin);
  curtain.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') begin(); });

  /* ── mute button (shared estate key) ── */
  var muteBtn = document.getElementById('mute');
  function syncMute() {
    var m = WS && WS.muted ? WS.muted() : false;
    muteBtn.textContent = m ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-label', m ? 'unmute the estate' : 'mute the estate');
  }
  muteBtn.addEventListener('click', function () {
    if (!WS || !WS.setMuted) return;
    var nm = !WS.muted(); WS.setMuted(nm); LWHAudio.setMuted(nm); syncMute();
  });
  if (WS && WS.onMuteChange) WS.onMuteChange(function () { syncMute(); LWHAudio.setMuted(WS.muted()); });
  syncMute();

  /* ── boot ── */
  function frame() { update(); draw(); requestAnimationFrame(frame); }
  window.addEventListener('resize', layout);
  layout();
  // initialise the camera & mote at the Ordinary World so the first paint is composed
  pos = 0; posTarget = 0; current = 0;
  moodTarget = 0; mood = 0;
  horizonY = TARGETY + STATIONS[0].el * VSCALE; horizonTarget = horizonY;
  frame();

  // drop the front-door breadcrumb (also called inline in the page head)
  try { if (WS && WS.seen) WS.seen('the-long-way-home'); } catch (e) {}
})();
