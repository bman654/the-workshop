/* ═══════════════════════════════════════════════════════════════════════════
   weather-fx.js  —  drifting clouds + rain + lightning  (window.Gate.weatherfx)

   The atmosphere layer for Phase D. Driven by the boot's ONE perpetual rAF
   (boot calls Gate.weatherfx.draw(dt, nowMs) each frame); a weather toggle
   ramps it LIVE. Two surfaces, by design (see CHANGELOG resume pointer):

     • CLOUDS  → the SVG clouds layer (S.refs.clouds, behind the buildings/gate).
                 They obscure only sky + sky-objects, never the architecture.
                 Tinted with the band-tracking --mist-ref var (so a recolor reflows
                 them for free — no palette change needed), drifted via JS transform
                 (same technique as the foliage sway). Storm grows a dark belly.
     • RAIN + LIGHTNING → the FOREGROUND #fx 2D canvas (above everything). Rain
                 slants right, tracking the live wind (S._windAmp). Lightning paints
                 a jagged bolt + a sky-glow flash AND pulses the boot's `flash` (via
                 the onFlash callback) so the colormap spikes brightness to 1.0 — the
                 storm-night payoff where the whole estate is revealed for an instant.

   Weather → effect mapping (W.weather()):
     clear  : no clouds, no rain, no lightning  (empty blue sky)
     cloudy : full white cloud cover + LIGHT rain (a gentle drizzle that wets the
              ground), no lightning
     storm  : dark heavy clouds + HEAVY rain + occasional lightning

   GROUND-IMPACT (splashes): drops that reach the foreground apron / near ground
   leave a brief expanding ring-ripple + a tiny splash tick — rain hitting wet
   stone. A fixed pool is recycled (capped, never unbounded); spawn frequency scales
   with the eased rain intensity (storm ≫ cloudy ≫ none). Splashes live only on the
   lower band of the canvas (the foreground apron, IN FRONT of the gate base), never
   in the sky, to stay consistent with the scene's depth.

   Reduced motion (SPEC §2.5.5): clouds still show (overcast still reads) but do
   NOT drift; NO falling rain, and NO lightning flashing (photosensitivity); NO
   animated splashes — at most a couple of faint STATIC ripple hints so wet ground
   still reads. One source of truth = Gate.sequence.prefersReducedMotion, passed in
   at init.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  var WFX = {};

  var VB_W = 1600, VB_H = 900;
  var WIND_STRONG = 3.4;            // == scene.js WIND_AMP.strong (sway peak, deg)
  var TAU = Math.PI * 2;

  // ── per-weather cloud targets (eased toward in draw). The fleet is TWO tiers:
  //   tier 0 (base)  — shown for cloudy AND storm
  //   tier 1 (storm) — shown ONLY for storm → storm has ~2× the clouds of cloudy.
  // DARK = the dark-belly strength (storm clouds read heavy/grey). ───────────────
  var BASE_COVER  = { clear: 0.0, cloudy: 1.0, storm: 1.0 };
  var STORM_COVER = { clear: 0.0, cloudy: 0.0, storm: 1.0 };
  var DARK        = { clear: 0.0, cloudy: 0.16, storm: 0.62 };
  var BELLY_FILL = '#39414f';       // stormy slate for the cloud underside
  var N_CLOUDS = 12;                // 6 base + 6 storm-only (interleaved)

  // ── module state ────────────────────────────────────────────────────────────
  var S = null;                     // Gate.scene
  var canvas = null, ctx = null;
  var cloudsLayer = null;
  var onFlash = null;               // boot callback(bool) — toggles colormap flash
  var reduced = false;

  var clouds = [];                  // [{g, body, belly, tier, x, baseX, span, y, speed, bob, phase}]
  var baseCur = 0, baseTgt = 0;     // eased opacity of the base-tier clouds
  var stormCur = 0, stormTgt = 0;   // eased opacity of the storm-only clouds
  var darkCur = 0, darkTgt = 0;     // eased dark-belly 0..1

  var drops = [];                   // raindrop pool (CSS-px coords)
  var rainCur = 0, rainTgt = 0;     // eased rain intensity 0..1
  var MAX_DROPS = 240;

  // precipitation KIND (E4) — a pure derivation from the shared winter, set once by
  // the boot via WFX.setSeason. COERCED so it is never null. 'rain' | 'sleet' | 'snow'.
  var precip = 'rain';
  var wxT = 0;                       // wobble clock (snow-waft phase), advanced in draw()

  // per-weather rain intensity target (eased into rainCur). cloudy is a LIGHT
  // drizzle, storm a HEAVY downpour; both wet the ground (→ splashes), clear is dry.
  var RAIN = { clear: 0, cloudy: 0.42, storm: 1 };

  // ── SPLASHES (ground impact) ─────────────────────────────────────────────────
  //   A FIXED pool of ripple objects, recycled (never grows). Each frame, while
  //   rain falls, a rate-limited spawner activates free slots near the foreground
  //   apron; an active splash expands 1–2 flattened ring-arcs + a brief tick over
  //   its short life, then frees itself. Capped → cheap + bounded.
  var splashes = [];                // [{x, y, age, life, r0, active}]
  var MAX_SPLASHES = 30;            // hard ceiling on live ripples
  var spawnAcc = 0;                 // fractional spawn accumulator (drops/frame)
  var STORM_SPAWN = 34;             // splashes/sec at full storm intensity
  // splashes land on the LOWER band of the canvas (foreground apron / near ground,
  // in front of the gate base) — fractions of canvas height, never the sky.
  var BAND_TOP = 0.80, BAND_BOT = 1.0;
  var splashRng = mkRng(7777);
  var respawnRng = mkRng(24601);    // seeded off-screen respawn scatter (was Math.random)

  // lightning state machine (seconds)
  var nextStrike = 2.5;
  var env = 0;                      // current flash envelope 0..1
  var bolt = null;                  // [{x,y}...] in CSS px, rebuilt per strike
  var flashOn = false;              // edge-tracking for the onFlash callback
  var force = false;                // ?flash dev pin

  /* a tiny deterministic PRNG so a stable cloud layout renders the same every
     time (no jump between renders); seeded from a constant (no Date/Math.random). */
  function mkRng(seed) {
    var s = (seed * 2654435761) & 0x7fffffff || 1;
    return function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  }

  function svgEl(name, attrs, parent) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', name);
    if (attrs) for (var k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(e);
    return e;
  }

  /* windNorm: 0 (calm) .. 1 (strong gale), read LIVE from the scene's wind amp so
     rain slant + cloud drift intensify exactly when the sway does. */
  function windNorm() {
    var a = (S && S._windAmp) || 0;
    return Math.max(0, Math.min(1, a / WIND_STRONG));
  }

  /* ── CLOUDS ──────────────────────────────────────────────────────────────────
     Build a fixed fleet of soft, lumpy clouds into the SVG clouds layer. Each
     cloud is a cluster of overlapping ellipses: a body in --mist-ref (band-tracked,
     soft via per-ellipse alpha) and a same-shape dark belly that fades in for storm.
     Visibility is per-weather via group opacity, split by tier (base/storm) so storm
     shows ~2× the clouds of cloudy. */
  function buildClouds() {
    if (!cloudsLayer) return;
    while (cloudsLayer.firstChild) cloudsLayer.removeChild(cloudsLayer.firstChild);
    clouds = [];
    var rng = mkRng(8123);
    // spread N clouds across (and a little past) the sky width, in the upper band
    // (well above the horizon line at y≈470 so they never overlap the buildings).
    // Tiers interleave (i%2): even = base (cloudy+storm), odd = storm-only, so both
    // states stay evenly spread and storm simply fills in the gaps between cloudy's.
    var N = N_CLOUDS;
    var margin = 220;                       // off-screen lead-in/out for seamless wrap
    var span = VB_W + margin * 2;
    for (var i = 0; i < N; i++) {
      var tier = i % 2;                     // 0 = base, 1 = storm-only
      var w = 150 + rng() * 200;            // cloud half-extent-ish
      var h = 34 + rng() * 26;
      var x = -margin + (i + rng() * 0.7) * (span / N);
      var y = 36 + rng() * 190;
      var g = svgEl('g', {}, cloudsLayer);
      var body = svgEl('g', { 'class': 'cloud-body' }, g);
      var belly = svgEl('g', { 'class': 'cloud-belly' }, g);
      // lay 5–7 overlapping lobes: a flatter base row + a couple taller crowns.
      var lobes = 5 + Math.floor(rng() * 3);
      for (var j = 0; j < lobes; j++) {
        var t = lobes <= 1 ? 0.5 : j / (lobes - 1);          // 0..1 across the width
        var lx = (t - 0.5) * w * 1.7;
        var crown = (j > 0 && j < lobes - 1) ? rng() * 0.6 : 0;  // inner lobes rise
        var ly = -crown * h * 0.9;
        var rx = (0.42 + rng() * 0.4) * w * 0.62;
        var ry = h * (0.7 + rng() * 0.5) * (1 + crown * 0.5);
        // body lobe (soft mist; inner lobes a touch more opaque to build a mass)
        svgEl('ellipse', {
          cx: lx.toFixed(1), cy: ly.toFixed(1), rx: rx.toFixed(1), ry: ry.toFixed(1),
          fill: 'var(--mist-ref, #cdd7e6)', opacity: (0.55 + crown * 0.3).toFixed(2)
        }, body);
        // belly lobe (same footprint, dark slate; opacity driven by darkCur at draw)
        svgEl('ellipse', {
          cx: lx.toFixed(1), cy: (ly + ry * 0.18).toFixed(1),
          rx: (rx * 0.96).toFixed(1), ry: (ry * 0.92).toFixed(1),
          fill: BELLY_FILL, opacity: (0.5 + crown * 0.3).toFixed(2)
        }, belly);
      }
      var speed = 5 + rng() * 7;            // base drift, viewBox px/s
      g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')');
      body.style.opacity = '0';
      belly.style.opacity = '0';
      clouds.push({
        g: g, body: body, belly: belly, tier: tier,
        x: x, baseX: x, span: span,
        y: y, speed: speed, bob: 2 + rng() * 3, phase: rng() * Math.PI * 2
      });
    }
    applyCloudOpacity();
  }

  function applyCloudOpacity() {
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i];
      var cover = c.tier === 0 ? baseCur : stormCur;
      c.body.style.opacity = cover.toFixed(3);
      c.belly.style.opacity = (cover * darkCur).toFixed(3);
    }
  }

  function tickClouds(dt, nowMs) {
    if (!clouds.length) return;
    // ease each tier's cover + the belly darkness toward the weather target
    var k = Math.min(1, dt * 1.8);
    baseCur += (baseTgt - baseCur) * k;
    stormCur += (stormTgt - stormCur) * k;
    darkCur += (darkTgt - darkCur) * k;
    applyCloudOpacity();
    var drift = reduced ? 0 : (0.55 + windNorm() * 1.9);   // wind speeds the drift
    var t = (nowMs || 0) / 1000;
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i];
      if (!reduced) {
        c.x += c.speed * drift * dt;
        if (c.x - c.baseX > c.span) c.x -= c.span;          // seamless wrap
      }
      var bob = reduced ? 0 : Math.sin(t * 0.25 + c.phase) * c.bob;
      c.g.setAttribute('transform',
        'translate(' + c.x.toFixed(1) + ',' + (c.y + bob).toFixed(1) + ')');
    }
  }

  /* ── RAIN ────────────────────────────────────────────────────────────────────
     A canvas particle field. Drops fall fast, leaning right by the live wind. We
     work in CSS px (setTransform(dpr,…) each frame); count + alpha scale with the
     eased rain intensity so it ramps in/out on a weather toggle. */
  function ensureDrops(cw, ch) {
    if (drops.length) return;
    var rng = mkRng(4242);
    for (var i = 0; i < MAX_DROPS; i++) {
      drops.push({
        x: rng() * cw * 1.25 - cw * 0.12,
        y: rng() * ch,
        len: 12 + rng() * 16,
        spd: 760 + rng() * 520,
        a: 0.25 + rng() * 0.4,
        rad: 1.2 + rng() * 1.4,     // snow-disc radius (E4)
        wob: rng() * TAU,           // snow-waft phase
        wr: 0.25 + rng() * 0.35     // snow-waft rate
      });
    }
  }

  function drawRain(cw, ch, dt) {
    if (rainCur < 0.02) return;
    ensureDrops(cw, ch);
    var slant = 0.16 + windNorm() * 0.5;     // dx per unit of fall (always rightward)
    var snow = precip === 'snow', sleet = precip === 'sleet';
    // snow: fewer, larger flakes (×0.6 count); rain/sleet: the full field.
    var live = Math.floor(MAX_DROPS * rainCur * (snow ? 0.6 : 1));
    var bandA = bandRainAlpha();
    ctx.lineCap = 'round';
    for (var i = 0; i < live; i++) {
      var d = drops[i];
      // fall speed by kind: snow drifts down slow (×0.15), sleet falls hard (×1.12).
      var spd = snow ? d.spd * 0.15 : sleet ? d.spd * 1.12 : d.spd;
      d.y += spd * dt;
      if (snow) {                             // the waft: a per-flake seeded sine,
        d.x += spd * dt * slant * 0.35 +      // independent of the rightward wind lean
               Math.sin(wxT * d.wr * TAU + d.wob) * 10 * dt;
      } else {
        d.x += spd * dt * slant;
      }
      if (d.y - d.len > ch) {                 // recycle off the bottom
        d.y = -d.len - respawnRng() * 30;
        d.x = respawnRng() * cw * 1.25 - cw * 0.12;
      } else if (d.x - d.len > cw) {
        d.x = -d.len; d.y = respawnRng() * ch;
      }
      if (snow) {                             // discs, near-white
        ctx.fillStyle = 'rgba(238,244,252,' + (d.a * rainCur * bandA * 1.15).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.rad, 0, TAU);
        ctx.fill();
      } else if (sleet && i % 3 === 2) {      // every 3rd sleet drop = a small ice disc
        ctx.fillStyle = 'rgba(202,222,255,' + (d.a * rainCur * bandA).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.3, 0, TAU);
        ctx.fill();
      } else {                                // rain (and 2/3 of sleet): streaks
        var len = sleet ? d.len * 0.55 : d.len;   // sleet is shorter, harder
        ctx.strokeStyle = 'rgba(202,222,255,' + (d.a * rainCur * bandA).toFixed(3) + ')';
        ctx.lineWidth = 1.05;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - len * slant, d.y - len);
        ctx.stroke();
      }
    }
  }

  // rain reads a touch brighter against a dark night sky, softer in daylight.
  function bandRainAlpha() {
    var band = (Gate.timeofday && Gate.timeofday.band && Gate.timeofday.band()) || 'day';
    return band === 'night' ? 1.0 : band === 'dusk' ? 0.9 : 0.78;
  }

  /* ── SPLASHES ──────────────────────────────────────────────────────────────────
     spawnSplash: claim one free pool slot (scan; bounded by MAX_SPLASHES). Lands in
     the lower band, with a slight wind-ward x nudge so impacts track the rain's lean.
     Returns false when the pool is full (caller stops spawning that frame). */
  function ensureSplashes() {
    if (splashes.length) return;
    for (var i = 0; i < MAX_SPLASHES; i++) {
      splashes.push({ x: 0, y: 0, age: 0, life: 0, r0: 0, active: false });
    }
  }
  function spawnSplash(cw, ch) {
    for (var i = 0; i < splashes.length; i++) {
      var s = splashes[i];
      if (s.active) continue;
      var ty = BAND_TOP + (BAND_BOT - BAND_TOP) * splashRng();   // 0.80..1.0
      // perspective: ripples nearer the bottom (closer to the eye) read a touch
      // larger + live a touch longer than those toward the back of the apron.
      var depth = (ty - BAND_TOP) / (BAND_BOT - BAND_TOP);       // 0 back .. 1 front
      s.x = splashRng() * cw + windNorm() * 18;
      s.y = ty * ch;
      s.age = 0;
      s.life = 0.42 + 0.26 * depth + splashRng() * 0.06;          // ~0.42..0.74 s
      s.r0 = 2.0 + 2.6 * depth;                                   // starting/peak scale
      s.active = true;
      return true;
    }
    return false;                                                // pool full
  }

  /* drawSplashes: advance + render every active ripple. Each draws up to two
     concentric, FLATTENED (ground-perspective) ring-arcs that grow + fade, plus a
     tiny upward tick early in life. Intensity-scaled spawning happens here too. */
  function drawSplashes(cw, ch, dt) {
    if (rainCur < 0.02 || precip === 'snow') return;    // snow does not splash (E4)
    ensureSplashes();
    // intensity-scaled spawn rate: storm (rainCur→1) ≫ cloudy (rainCur≈0.42).
    // a touch super-linear so light rain stays sparse and storm feels busy.
    var rate = STORM_SPAWN * rainCur * rainCur;
    if (precip === 'sleet') rate *= 0.5;                // ice splatters less
    spawnAcc += rate * dt;
    while (spawnAcc >= 1) {
      spawnAcc -= 1;
      if (!spawnSplash(cw, ch)) { spawnAcc = 0; break; }          // pool full → drop
    }
    var bandA = bandRainAlpha();
    ctx.lineCap = 'round';
    for (var i = 0; i < splashes.length; i++) {
      var s = splashes[i];
      if (!s.active) continue;
      s.age += dt;
      if (s.age >= s.life) { s.active = false; continue; }
      var p = s.age / s.life;                                     // 0..1 progress
      var fade = (1 - p) * (1 - p);                               // ease-out alpha
      var rad = s.r0 * (1 + p * 4.2);                             // expanding radius
      var ry = rad * 0.34;                                        // flatten to ground
      // light rain (low rainCur) still wets visibly: hold a daylight floor so a
      // gentle drizzle reads on bright stone without making storm over-bright.
      var aBase = (0.34 + 0.32 * rainCur) * fade * bandA;
      // a faint DARK "wet" ring just under the bright one — water darkening the
      // stone. This gives the ripple contrast on LIGHT daytime flagstones too
      // (a pure light-blue glow vanishes there); the bright ring carries it on dark.
      ctx.strokeStyle = 'rgba(28,40,58,' + (aBase * 0.55).toFixed(3) + ')';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y + 0.6, rad, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      // primary (bright) ring
      ctx.strokeStyle = 'rgba(206,224,255,' + aBase.toFixed(3) + ')';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, rad, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      // trailing inner ring (a half-step behind), only past the first instant
      if (p > 0.12) {
        var rad2 = s.r0 * (1 + (p - 0.12) * 3.0);
        ctx.strokeStyle = 'rgba(206,224,255,' + (aBase * 0.6).toFixed(3) + ')';
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, rad2, rad2 * 0.34, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // brief upward splash tick at the very start (the drop rebounding)
      if (p < 0.32) {
        var tickA = aBase * 1.4 * (1 - p / 0.32);
        ctx.strokeStyle = 'rgba(224,236,255,' + tickA.toFixed(3) + ')';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + windNorm() * 2.2, s.y - (3 + s.r0));
        ctx.stroke();
      }
    }
  }

  /* drawStaticSplashHints (reduced motion): a couple of faint, NON-animated ripple
     marks so wet ground still reads under rain — drawn once-per-frame at fixed,
     seeded positions, no growth/flicker. */
  function drawStaticSplashHints(cw, ch) {
    if (rainCur < 0.02) return;
    var bandA = bandRainAlpha();
    var n = rainCur > 0.7 ? 3 : 2;                               // storm shows one more
    var rng = mkRng(515);                                        // fixed layout, stable
    ctx.lineWidth = 1.0;
    for (var i = 0; i < n; i++) {
      var x = (0.2 + rng() * 0.6) * cw;
      var y = (BAND_TOP + rng() * (BAND_BOT - BAND_TOP) * 0.9) * ch;
      var rad = 5 + rng() * 4;
      ctx.strokeStyle = 'rgba(206,224,255,' + (0.22 * rainCur * bandA).toFixed(3) + ')';
      ctx.beginPath();
      ctx.ellipse(x, y, rad, rad * 0.34, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /* drawStaticFlakeHints (reduced motion + snow): 4 fixed, seeded flake dots in the
     same apron band as the wet-ground hints, same alpha discipline — so a reduced-
     motion visitor still reads "snow-weather" rather than "dry storm" (§9.5). */
  function drawStaticFlakeHints(cw, ch) {
    if (rainCur < 0.02) return;
    var bandA = bandRainAlpha();
    var rng = mkRng(516);                                        // fixed layout, stable
    for (var i = 0; i < 4; i++) {
      var x = (0.2 + rng() * 0.6) * cw;
      var y = (BAND_TOP + rng() * (BAND_BOT - BAND_TOP) * 0.9) * ch;
      var rad = 1.2 + rng() * 1.4;
      ctx.fillStyle = 'rgba(238,244,252,' + (0.22 * rainCur * bandA).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ── LIGHTNING ─────────────────────────────────────────────────────────────── */
  function buildBolt(cw, ch, rng) {
    var pts = [];
    var x = cw * (0.22 + rng() * 0.56);
    var y = 0;
    var endY = ch * (0.38 + rng() * 0.18);
    var steps = 9;
    for (var i = 0; i <= steps; i++) {
      pts.push({ x: x, y: y });
      y += (endY / steps) * (0.7 + rng() * 0.6);
      x += (rng() - 0.42) * cw * 0.09;       // slight rightward bias with the wind
      if (y >= endY) { pts.push({ x: x, y: endY }); break; }
    }
    // one short fork off a mid joint
    var fi = 3 + Math.floor(rng() * 3);
    var fork = null;
    if (pts[fi]) {
      fork = [{ x: pts[fi].x, y: pts[fi].y }];
      var fx = pts[fi].x, fy = pts[fi].y;
      for (var k = 0; k < 4; k++) {
        fy += (endY / steps) * (0.5 + rng() * 0.5);
        fx += (rng() - 0.3) * cw * 0.06;
        fork.push({ x: fx, y: fy });
      }
    }
    return { main: pts, fork: fork };
  }

  function strokeBolt(b, alpha) {
    function path(pts, w, style) {
      ctx.strokeStyle = style; ctx.lineWidth = w;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }
    // outer glow then bright core
    path(b.main, 7, 'rgba(170,200,255,' + (alpha * 0.45).toFixed(3) + ')');
    if (b.fork) path(b.fork, 4, 'rgba(170,200,255,' + (alpha * 0.32).toFixed(3) + ')');
    path(b.main, 2.2, 'rgba(245,250,255,' + alpha.toFixed(3) + ')');
    if (b.fork) path(b.fork, 1.4, 'rgba(245,250,255,' + (alpha * 0.8).toFixed(3) + ')');
  }

  function tickLightning(cw, ch, dt) {
    var stormy = Gate.weather && Gate.weather.weather && Gate.weather.weather() === 'storm'
                 && precip !== 'snow';        // snow hushes thunder at the strike source (E4)

    if (force) {                              // ?flash dev pin: hold a strike lit (wins)
      if (!bolt) bolt = buildBolt(cw, ch, mkRng(99));
      env = 1;
      setFlash(true);
    } else if (reduced || !stormy) {
      // no flashing under reduced motion or when not storming; settle any envelope
      if (env > 0) { env = Math.max(0, env - dt * 6); }
      setFlash(false);
      if (env <= 0) { return; }
    } else {
      nextStrike -= dt;
      if (nextStrike <= 0) {
        bolt = buildBolt(cw, ch, mkRng((Math.random() * 1e6) | 0));
        env = 1;
        nextStrike = 2.6 + Math.random() * 5.4;
      }
      // decay with a brief secondary flicker partway down
      env -= dt * (5.0 + (env > 0.45 && env < 0.6 ? -3.5 : 0));
      if (env < 0) env = 0;
      setFlash(env > 0.45);
    }

    if (env > 0 && bolt) {
      // full-canvas sky-glow flash (whitens the whole foreground briefly)
      ctx.fillStyle = 'rgba(214,226,255,' + (env * 0.34).toFixed(3) + ')';
      ctx.fillRect(0, 0, cw, ch);
      strokeBolt(bolt, env);
    }
    if (env <= 0) bolt = null;
  }

  function setFlash(on) {
    if (on === flashOn) return;
    flashOn = on;
    if (onFlash) onFlash(on);
  }

  /* ── public API ──────────────────────────────────────────────────────────────
     init(opts): opts.canvas (#fx), opts.scene (Gate.scene), opts.onFlash(bool),
     opts.reduced (bool). Builds the cloud fleet and primes the canvas. */
  WFX.init = function (opts) {
    opts = opts || {};
    S = opts.scene || Gate.scene;
    canvas = opts.canvas || null;
    ctx = canvas ? canvas.getContext('2d') : null;
    cloudsLayer = (S && S.refs && S.refs.clouds) || null;
    onFlash = typeof opts.onFlash === 'function' ? opts.onFlash : null;
    reduced = !!opts.reduced;
    buildClouds();
    if (Gate.weather && Gate.weather.weather) WFX.setWeather(Gate.weather.weather());
    return WFX;
  };

  /* setWeather(w): set the per-tier cover + rain targets. Storm lights up BOTH
     tiers (≈2× cloudy's cloud count); cloudy lights only the base tier. Under
     reduced motion they SNAP (no ease) so overcast reads immediately. */
  WFX.setWeather = function (w) {
    baseTgt = BASE_COVER[w] != null ? BASE_COVER[w] : 0;
    stormTgt = STORM_COVER[w] != null ? STORM_COVER[w] : 0;
    darkTgt = DARK[w] != null ? DARK[w] : 0;
    rainTgt = RAIN[w] != null ? RAIN[w] : 0;
    if (reduced) {
      baseCur = baseTgt; stormCur = stormTgt; darkCur = darkTgt; rainCur = rainTgt;
      applyCloudOpacity();
    }
  };

  /* setSeason(kind): the calendar's derived precipitation kind (§9.5). COERCES — a
     null/undefined kind (calendar failed) can never leave precip null; anything but
     'snow'/'sleet' lands 'rain'. The boot calls it once after init. */
  WFX.setSeason = function (kind) {
    precip = (kind === 'snow' || kind === 'sleet') ? kind : 'rain';
  };

  /* setForceFlash(on): dev pin (?flash) — hold a lightning strike lit so the
     storm-night reveal payoff can be screenshotted deterministically. */
  WFX.setForceFlash = function (on) { force = !!on; if (!on) { env = 0; bolt = null; setFlash(false); } };

  /* draw(dt, nowMs): called every frame by the boot's perpetual rAF. */
  WFX.draw = function (dt, nowMs) {
    tickClouds(dt, nowMs);
    if (!ctx || !canvas) return;
    var dpr = canvas.width / Math.max(1, canvas.clientWidth);
    var cw = canvas.clientWidth || (canvas.width / (dpr || 1));
    var ch = canvas.clientHeight || (canvas.height / (dpr || 1));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    wxT += dt;                          // advance the snow-waft clock every frame
    rainCur += (rainTgt - rainCur) * Math.min(1, dt * 1.5);
    if (!reduced) {
      drawRain(cw, ch, dt);
      drawSplashes(cw, ch, dt);
    } else if (precip === 'snow') {
      drawStaticFlakeHints(cw, ch);     // static flake dots under snow (§9.5)
    } else {
      drawStaticSplashHints(cw, ch);
    }
    tickLightning(cw, ch, dt);
  };

  Gate.weatherfx = WFX;

  if (typeof module !== 'undefined' && module.exports) { module.exports = WFX; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
