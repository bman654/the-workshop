/* ═══════════════════════════════════════════════════════════════════════════
   THE HEXAFLEXAGON — FORGED FACE: THE ECLIPSE  (foundry take 1)

   The buried third face. A total solar eclipse, corona DEAD-CENTRE, blooming
   from genuine nowhere — neither day nor night but a third thing entirely.

   Take 1's hand: a luminous hand-inked astronomical plate. The corona is not a
   single gradient ring but layers of light BUILT additively — a diffuse outer
   halo, hundreds of fine tapering streamers, a blazing limb annulus — so it
   glows the way real totality does. The detail that sells the third-thing read:
   a thin sanguine chromosphere with red prominence-flames licking off the black
   moon's limb, and a scatter of Baily's beads for the diamond-ring tease. Kept
   broadly radially symmetric so the motif reads whole however the paper turns.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  "use strict";

  function drawEclipse(ctx) {
    var HF = (root && root.HexaFaces) || {};
    var S = HF.S || 900;
    var C = S / 2;
    var R = HF.R || S * 0.47;

    // ── geometry helpers (self-contained; match the engine's sampling) ──
    function corner(i, rad) {
      var a = (-90 + 60 * i) * Math.PI / 180;
      rad = (rad == null ? R : rad);
      return [C + rad * Math.cos(a), C + rad * Math.sin(a)];
    }
    function hexPath(rad) {
      ctx.beginPath();
      for (var i = 0; i < 6; i++) { var p = corner(i, rad); if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); }
      ctx.closePath();
    }
    // deterministic PRNG (fixed seed → same plate every mount)
    var seed = 0x1eafc0de;
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }

    var rMoon = R * 0.195;            // the black lunar disc
    var TAU = Math.PI * 2;

    ctx.save();
    hexPath(); ctx.clip();

    /* ── 1. deep eclipse sky: bruised violet at the heart → near-black at the rim ── */
    var sky = ctx.createRadialGradient(C, C, R * 0.06, C, C, R * 1.18);
    sky.addColorStop(0.00, '#2a1f3c');   // bruised violet toward centre
    sky.addColorStop(0.34, '#170f24');
    sky.addColorStop(0.70, '#0a0714');
    sky.addColorStop(1.00, '#05040a');   // deep space at the corners
    ctx.fillStyle = sky; ctx.fillRect(0, 0, S, S);

    /* ── 2. dimmed stars, thinned out near the corona's glare ── */
    for (var st = 0; st < 70; st++) {
      var sx = rnd() * S, sy = rnd() * S, dd = Math.hypot(sx - C, sy - C);
      if (dd < R * 0.52) continue;                       // corona washes these out
      var fade = Math.min(1, (dd - R * 0.52) / (R * 0.35));
      var sr = rnd() * 1.5 + 0.35;
      ctx.globalAlpha = (0.18 + rnd() * 0.5) * fade;
      // faint cool-white core with a hint of the estate gold on the brighter ones
      ctx.fillStyle = rnd() > 0.82 ? '#f4e6bf' : '#d6dbf2';
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* ── 3. THE CORONA — light built additively against the dark ── */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // (a0) a very wide, faint corona bloom filling much of the hexagon, so the
    //      centre reads as the source of ALL the light — arriving from nowhere
    var bloom = ctx.createRadialGradient(C, C, rMoon, C, C, R * 0.98);
    bloom.addColorStop(0.00, 'rgba(255,240,190,0.22)');
    bloom.addColorStop(0.30, 'rgba(230,190,120,0.10)');
    bloom.addColorStop(0.65, 'rgba(201,162,74,0.035)');
    bloom.addColorStop(1.00, 'rgba(201,162,74,0.0)');
    ctx.fillStyle = bloom;
    ctx.beginPath(); ctx.arc(C, C, R * 0.98, 0, TAU); ctx.fill();

    // (a) broad diffuse outer halo — the corona's soft body
    var halo = ctx.createRadialGradient(C, C, rMoon * 0.9, C, C, R * 0.74);
    halo.addColorStop(0.00, 'rgba(255,247,208,0.62)');
    halo.addColorStop(0.14, 'rgba(250,224,148,0.40)');
    halo.addColorStop(0.42, 'rgba(214,176,92,0.17)');
    halo.addColorStop(1.00, 'rgba(201,162,74,0.0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(C, C, R * 0.74, 0, TAU); ctx.fill();

    // (b) long feathered streamers — fine tapering slivers all around the ring.
    //     Length varies gently & randomly (no hard axis) so it reads whole under
    //     any 60° turn of the paper; a handful reach dramatically far.
    var NS = 190;
    for (var s = 0; s < NS; s++) {
      var a = (s / NS) * TAU + (rnd() - 0.5) * 0.09;
      var far = rnd() < 0.14;                             // a few long dramatic rays
      var len = far ? R * (0.46 + rnd() * 0.22) : R * (0.20 + rnd() * rnd() * 0.34);
      var baseR = rMoon * 1.03;
      var tipR = baseR + len;
      var half = (0.005 + rnd() * 0.010);                // angular half-width at base
      var ca = Math.cos(a), sa = Math.sin(a);
      var cL = Math.cos(a - half), sL = Math.sin(a - half);
      var cR = Math.cos(a + half), sR = Math.sin(a + half);
      ctx.beginPath();
      ctx.moveTo(C + cL * baseR, C + sL * baseR);
      ctx.lineTo(C + cR * baseR, C + sR * baseR);
      ctx.lineTo(C + ca * tipR, C + sa * tipR);          // taper to a point
      ctx.closePath();
      var g = (far ? 0.045 : 0.055) + rnd() * 0.09;
      ctx.fillStyle = 'rgba(255,238,182,' + g.toFixed(3) + ')';
      ctx.fill();
    }

    // (c) soft inner brush — short, hot filaments hugging the limb. Heavy angular
    //     jitter + wide spread so it stays organic (never a cog of even teeth).
    var NI = 96;
    for (var k = 0; k < NI; k++) {
      var ak = rnd() * TAU;                               // fully scattered
      var l2 = rMoon * (0.14 + rnd() * 0.62);
      var b2 = rMoon * 1.0, t2 = b2 + l2;
      var h2 = 0.016 + rnd() * 0.020;
      var caK = Math.cos(ak), saK = Math.sin(ak);
      ctx.beginPath();
      ctx.moveTo(C + Math.cos(ak - h2) * b2, C + Math.sin(ak - h2) * b2);
      ctx.lineTo(C + Math.cos(ak + h2) * b2, C + Math.sin(ak + h2) * b2);
      ctx.lineTo(C + caK * t2, C + saK * t2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,248,214,' + (0.045 + rnd() * 0.07).toFixed(3) + ')';
      ctx.fill();
    }

    // (d) the blazing limb annulus — the intense ring just OUTSIDE the moon's
    //     edge. The peak is pushed further out (rMoon*1.21) so no hard bright
    //     band lands on the fold apex (kills the sub-pixel gold-crescent seam),
    //     AND the very limb (rMoon*1.0–1.07) is left dimmer so the living-red
    //     chromosphere below has a band to read in. Peak softened off pure white
    //     (0.92, warm) so the additive sum never clips to a dead-white rim.
    var ring = ctx.createRadialGradient(C, C, rMoon * 1.0, C, C, rMoon * 1.62);
    ring.addColorStop(0.00, 'rgba(255,255,244,0.0)');
    ring.addColorStop(0.11, 'rgba(255,252,234,0.30)');   // gentler rise at the very limb
    ring.addColorStop(0.34, 'rgba(255,252,236,0.92)');   // warm-white peak, well clear of limb
    ring.addColorStop(0.56, 'rgba(250,222,146,0.64)');
    ring.addColorStop(1.00, 'rgba(201,162,74,0.0)');
    ctx.fillStyle = ring;
    ctx.beginPath(); ctx.arc(C, C, rMoon * 1.62, 0, TAU); ctx.fill();

    /* ── 4. CHROMOSPHERE + PROMINENCES — the sanguine flames that make it read
           as a THIRD thing (day = gold sun, night = white moon, eclipse = a
           black disc rimmed in living red). Still additive; the black moon is
           painted AFTER so none of this glare muddies the pure lunar disc. ── */
    // thin red chromosphere GLOW just outside the limb — additive, redder and
    // stronger than take 1 so the sanguine colour survives the fold blit. (A
    // crisp source-over red RIM is laid over this after the additive block so a
    // thin living-red ring reads even where the corona is bright.)
    var chrom = ctx.createRadialGradient(C, C, rMoon * 0.98, C, C, rMoon * 1.14);
    chrom.addColorStop(0.0, 'rgba(236,64,52,0.0)');
    chrom.addColorStop(0.45, 'rgba(238,72,58,0.72)');
    chrom.addColorStop(1.0, 'rgba(198,44,44,0.0)');
    ctx.fillStyle = chrom;
    ctx.beginPath(); ctx.arc(C, C, rMoon * 1.14, 0, TAU); ctx.fill();

    // rose PROMINENCE flames licking off the limb — grafted from take 2's more
    // visible chromosphere: seated at the SIX hex stations (so the ring of red
    // re-reads whole under any 60° flex), taller and more saturated, each flare
    // varied so they never read as a mechanical stamp. This rose is the colour
    // that lives on neither day nor night — the clearest tell of the third thing.
    for (var q = 0; q < 6; q++) {
      var flare = 0.55 + rnd() * 0.95;
      var pa = (-90 + 60 * q) * Math.PI / 180 + (rnd() - 0.5) * 0.20;
      var hgt = rMoon * (0.16 + flare * 0.20);
      var wid = 0.055 + rnd() * 0.05;
      var bx = C + Math.cos(pa) * rMoon * 0.99, by = C + Math.sin(pa) * rMoon * 0.99;
      var tx = C + Math.cos(pa) * (rMoon + hgt), ty = C + Math.sin(pa) * (rMoon + hgt);
      var lx = C + Math.cos(pa - wid) * rMoon, ly = C + Math.sin(pa - wid) * rMoon;
      var rx = C + Math.cos(pa + wid) * rMoon, ry = C + Math.sin(pa + wid) * rMoon;
      var curl = (rnd() - 0.5) * hgt * 0.6;
      var mx = tx + Math.cos(pa + Math.PI / 2) * curl, my = ty + Math.sin(pa + Math.PI / 2) * curl;
      var pg = ctx.createLinearGradient(bx, by, mx, my);
      pg.addColorStop(0.0, 'rgba(255,138,138,0.92)');
      pg.addColorStop(0.45, 'rgba(246,74,96,0.70)');
      pg.addColorStop(1.0, 'rgba(214,52,80,0.0)');
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.quadraticCurveTo(bx, by - hgt * 0.1, mx, my);
      ctx.quadraticCurveTo(bx, by - hgt * 0.1, rx, ry);
      ctx.closePath(); ctx.fill();
    }

    // Baily's beads — bright drops on the ring; one plays the diamond-ring flash
    for (var bd = 0; bd < 8; bd++) {
      var ba = (bd / 8) * TAU + 0.19;
      var bead = (bd === 2) ? rMoon * 0.16 : rMoon * (0.045 + rnd() * 0.045);
      var bxr = C + Math.cos(ba) * rMoon * 1.015, byr = C + Math.sin(ba) * rMoon * 1.015;
      var bg = ctx.createRadialGradient(bxr, byr, 0, bxr, byr, bead * 3.2);
      bg.addColorStop(0, 'rgba(255,255,246,0.95)');
      bg.addColorStop(0.4, 'rgba(255,246,214,0.55)');
      bg.addColorStop(1, 'rgba(246,214,132,0.0)');
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(bxr, byr, bead * 3.2, 0, TAU); ctx.fill();
    }
    ctx.restore(); // end additive corona + chromosphere

    /* ── 4b. the CHROMOSPHERE RIM — a crisp thin living-red ring hugging the limb,
           laid in SOURCE-OVER (not additive) so the red is not washed out to
           pink-white by the bright corona summed beneath it. Its inner half is
           punched away by the black moon (drawn next), leaving a clean sanguine
           arc at the very edge — the one colour that is neither day's gold nor
           night's white. This is what survives the fold blit at true scale. ── */
    var rim = ctx.createRadialGradient(C, C, rMoon * 0.995, C, C, rMoon * 1.11);
    rim.addColorStop(0.00, 'rgba(226,58,50,0.0)');
    rim.addColorStop(0.30, 'rgba(232,60,52,0.62)');
    rim.addColorStop(0.55, 'rgba(210,44,48,0.42)');
    rim.addColorStop(1.00, 'rgba(180,38,46,0.0)');
    ctx.fillStyle = rim;
    ctx.beginPath(); ctx.arc(C, C, rMoon * 1.11, 0, TAU); ctx.fill();

    /* ── 5. THE BLACK MOON — painted last of the disc, over all the glare, so the
           lunar body is a clean silhouette punched out of the light: the ring
           opens and the corona reads as blooming from behind pure black. ── */
    var moon = ctx.createRadialGradient(C, C, rMoon * 0.1, C, C, rMoon);
    moon.addColorStop(0, '#050409');
    moon.addColorStop(1, '#040308');
    ctx.fillStyle = moon;
    ctx.beginPath(); ctx.arc(C, C, rMoon * 1.008, 0, TAU); ctx.fill();
    // firm the silhouette edge so the corona reads as blooming from BEHIND black
    ctx.strokeStyle = '#040308'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(C, C, rMoon, 0, TAU); ctx.stroke();

    /* ── 6. the faintest ghost of the garden wall along the very bottom edge —
           a whisper that this is the same place, the same sky. Subordinate. ── */
    ctx.save();
    ctx.globalAlpha = 0.5;
    var horizon = C + R * 0.74;
    var wy = horizon - R * 0.05, wh = R * 0.30;
    ctx.fillStyle = '#0b0f1c';
    ctx.fillRect(C - R * 0.9, wy, R * 1.8, wh);
    ctx.fillStyle = '#12182a';
    for (var mx2 = -0.84; mx2 < 0.84; mx2 += 0.24) {
      ctx.fillRect(C + R * mx2, wy - R * 0.045, R * 0.11, R * 0.06);   // merlon silhouettes
    }
    // a breath of corona-gold catching the top of the wall
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = 'rgba(246,214,132,1)';
    ctx.fillRect(C - R * 0.9, wy - 1.5, R * 1.8, 2);
    ctx.restore();

    ctx.restore(); // end hex clip

    /* ── 7. laid-fibre grain, very subtle over the dark sky (same paper strip) ── */
    ctx.save();
    hexPath(); ctx.clip();
    var img = ctx.getImageData(0, 0, S, S), d = img.data, gseed = 4457;
    function grnd() { gseed = (gseed * 1103515245 + 12345) & 0x7fffffff; return gseed / 0x7fffffff; }
    for (var y = 0; y < S; y++) {
      var laid = Math.sin(y * 0.9) * 1.6;
      for (var x = 0; x < S; x++) {
        var idx = (y * S + x) * 4;
        if (d[idx + 3] === 0) continue;
        var n = (grnd() - 0.5) * 9 + laid;
        d[idx] = Math.max(0, Math.min(255, d[idx] + n));
        d[idx + 1] = Math.max(0, Math.min(255, d[idx + 1] + n));
        d[idx + 2] = Math.max(0, Math.min(255, d[idx + 2] + n));
      }
    }
    ctx.putImageData(img, 0, 0);
    ctx.restore();

    /* ── 8. hexagon frame — a fine corona-gold key line at the very edge ── */
    ctx.save();
    ctx.strokeStyle = 'rgba(201,162,74,0.5)'; ctx.lineWidth = 4;
    hexPath(); ctx.stroke();
    ctx.restore();
  }

  // ── the installer contract the harness + shipped build both call ──
  root.installHexaArt = function (A) {
    A.setScene('eclipse', drawEclipse);
    return 'eclipse';
  };
  (root.HexaArt = root.HexaArt || {}).eclipse = drawEclipse;

})(typeof window !== 'undefined' ? window : globalThis);
