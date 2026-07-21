/* ═══════════════════════════════════════════════════════════════════════════
   orbit.js — The Green Corridor's geometry CORE. DOM-free, dual-use.

   TWO MIRRORS AND A CANDLE, seen from straight above.

   The candle sits on the bisector at perpendicular distance `h` from each
   mirror; the mirrors meet at a vertex V with angle `theta` between them.
   Everything else follows:

       R = h / sin(theta/2)        distance from the vertex to the candle
       images sit on the circle of radius R about V, at angles +-k*theta
       arc spacing = R*theta       (which is why the corridor never crowds)

   There is exactly ONE generator here, and it works in Cartesian coordinates
   by literally reflecting the candle in mirror A, then B, then A... one chain
   each way. That is not a stylistic choice: it is what makes theta = 0 (the
   parallel mirrors, the D-infinity ladder) fall out with no special case at
   all, and it is what lets the closed-form ladder be a TEST ORACLE rather
   than a second implementation to keep in sync.

   ── THE TWO SOFT EDGES (the whole anti-pop argument) ───────────────────────

   A corridor that gains and loses flames as you tilt the mirrors will POP,
   and a pop is the one thing that would break the spell. Two places can pop,
   and both are dissolved the same way — with a C^2 weight that carries
   energy, never a hard test:

   1. THE BIRTH, at the far antipode. Images only exist while the chain has
      not swept past 180 degrees from the candle — beyond that they are behind
      you. As theta narrows, a new pair is born there. Instead of switching it
      on, we fade it in over a band whose width is set by the flame's own draw
      radius, so it reaches full weight exactly as the ring closes.

   2. THE MERGE, when the two chains nearly coincide. Two candidates separated
      by s, with eps the flame draw radius:
          w = smoother(0, eps, s)
      draw them as two images at weight w PLUS one merged image at weight
      1-w carrying the summed energy. Energy is conserved identically at
      every w, and w is C^2 in theta, so sweeping through a detent changes
      count and brightness continuously. No stacking flare, no jump of many.

   Vanilla, ES5-ish, zero-dependency. Attaches an `Orbit` global in the
   browser; exports the same object under Node for the twin.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Orbit = {};
  var DEG = Math.PI / 180;
  Orbit.DEG = DEG;

  function clamp01(x) { return x < 0 ? 0 : (x > 1 ? 1 : x); }
  function smoother(a, b, x) {
    if (a === b) return x < a ? 0 : 1;
    var t = clamp01((x - a) / (b - a));
    return t * t * t * (t * (6 * t - 15) + 10);
  }
  Orbit.smoother = smoother;
  Orbit.clamp01 = clamp01;

  /* A FIXED constant. Never a function of geometry — if the cap moved with
     the mirrors, the corridor's depth would depend on the gesture, and the
     one honest promise of this room ("pulling the mirrors apart buys you no
     more infinity") would be a lie. */
  Orbit.K_MAX = 160;

  /* The widest angle the instrument opens to. Past this there is no corridor
     left to speak of, only a candle between two walls. */
  Orbit.THETA_MAX = 179.5;

  /* ───────────────────────────────────────────────────────────────────────
     THE MIRRORS, as lines. Both at perpendicular distance h from the candle,
     which sits at the origin. Mirror A carries the +y side, mirror B the -y.
     At theta = 0 these are exactly y = +h and y = -h — parallel, candle
     midway — with no branch anywhere.
     ─────────────────────────────────────────────────────────────────────── */
  Orbit.mirrors = function (thetaDeg, h) {
    var half = thetaDeg * DEG / 2;
    var s = Math.sin(half), c = Math.cos(half);
    return {
      A: { nx: -s, ny: c, d: h },
      B: { nx: -s, ny: -c, d: h },
      /* the vertex, where the two lines cross; at theta = 0 it is at
         infinity and R below is Infinity, which every consumer handles */
      R: (s === 0 ? Infinity : h / s),
      vx: (s === 0 ? -Infinity : -h / s),
      vy: 0
    };
  };

  function reflect(px, py, m) {
    var t = 2 * (px * m.nx + py * m.ny - m.d);
    return [px - t * m.nx, py - t * m.ny];
  }
  Orbit.reflect = reflect;

  /* The arc spacing between neighbouring flames, = R * theta. Its ratio to h
     lives in [2, pi] and rises monotonically with theta: the corridor NEVER
     crowds, however hard you close the mirrors. (At theta -> 0 the arc
     becomes the chord and the spacing is exactly 2h.) */
  Orbit.spacing = function (thetaDeg, h) {
    var half = thetaDeg * DEG / 2;
    if (half === 0) return 2 * h;
    return h * (thetaDeg * DEG) / Math.sin(half);
  };

  /* ───────────────────────────────────────────────────────────────────────
     THE ORBIT.

     orbit(thetaDeg, h, opts) -> array of image records, with a few facts
     about the ring attached to the array itself.

     Each record: { x, y, k, nA, nB, parity, weight, merge }
       k       bounce count (0 is the candle itself)
       nA,nB   how many times the ray met each mirror  (nA + nB === k)
       parity  +1 if this image has the candle's handedness, -1 if mirrored
       weight  in [0,1] — energy carried, NOT opacity. Soft-merge and birth
               weights live here, and the sum over the family is conserved.
       merge   null, or {of:[recA, recB]} when this record is a merged pair

     opts: { KMAX, eps, mirrorA, mirrorB }
       eps     the flame draw radius in world units; sets both soft edges.
     ─────────────────────────────────────────────────────────────────────── */
  Orbit.orbit = function (thetaDeg, h, opts) {
    opts = opts || {};
    var KMAX = opts.KMAX || Orbit.K_MAX;
    var eps = (opts.eps === undefined) ? 0.34 * h : opts.eps;
    var hasA = opts.mirrorA !== false;
    var hasB = opts.mirrorB !== false;

    var out = [];
    var candle = { x: 0, y: 0, k: 0, nA: 0, nB: 0, chain: 0, parity: 1, weight: 1, merge: null };
    out.push(candle);

    var M = Orbit.mirrors(thetaDeg, h);

    /* ── Neither mirror: a candle on a dish in the dark. ── */
    if (!hasA && !hasB) { return finish(out, thetaDeg, h, Infinity, 0); }

    /* ── One mirror: exactly ONE image. One reflection — which is what a
       mirror IS, before it is a kaleidoscope. There is nothing for the light
       to bounce back off, so the chain stops at its first step. ── */
    if (!hasA || !hasB) {
      var m = hasA ? M.A : M.B;
      var p = reflect(0, 0, m);
      out.push({
        x: p[0], y: p[1], k: 1,
        nA: hasA ? 1 : 0, nB: hasA ? 0 : 1, chain: hasA ? 1 : -1,
        parity: -1, weight: 1, merge: null
      });
      return finish(out, thetaDeg, h, Infinity, 0);
    }

    /* ── Both mirrors: two chains, alternating, one each way. ──────────────

       The chain terminates at the far antipode: an image whose ray path has
       swept more than 180 degrees around the vertex lies behind you and is
       not a thing you can see. Rather than cutting there, we fade over a band
       whose width is set by eps, so the newly-born pair reaches full weight
       exactly when the ring closes. At theta = 0 the swept angle is always
       zero, the gate never fires, and the ladder simply runs to KMAX — the
       D-infinity corridor, no special case. */
    var thr = thetaDeg * DEG;
    var R = M.R;
    /* THE BIRTH BAND, in swept radians — a soft horizon rather than a wall.

       Its width is set as a fraction of ONE SPACING (0.5 * theta of sweep),
       not as a fixed angle, because the swept angle of the last image is
       ~180deg however narrow theta is: a band fixed in swept angle would be
       crossed in 0.02deg of tilt at theta=7, which is faster than any hand
       can move and therefore reads as a pop even though the maths is
       continuous. Tying it to theta makes the fade take about the same
       amount of GESTURE at every angle, which is the thing a person
       actually experiences. Capped so it never runs past the antipode by
       more than a hair at wide angles. */
    var band = isFinite(R) ? Math.min(0.06, 0.5 * (thetaDeg * DEG)) : 0;
    var PHI_MAX = Math.PI + band;

    var chainP = [], chainM = [];
    var i;
    for (i = 0; i < 2; i++) {
      var first = i === 0 ? M.A : M.B;
      var second = i === 0 ? M.B : M.A;
      var chain = i === 0 ? chainP : chainM;
      var x = 0, y = 0;
      for (var k = 1; k <= KMAX; k++) {
        var phi = k * thr;
        if (phi > PHI_MAX) break;
        var mm = (k % 2 === 1) ? first : second;
        var q = reflect(x, y, mm);
        x = q[0]; y = q[1];
        var aFirst = (i === 0);
        var nA = aFirst ? Math.ceil(k / 2) : Math.floor(k / 2);
        var nB = k - nA;
        /* birth weight: 1 well inside the antipode, easing to 0 just past it */
        var b = (band > 0) ? smoother(PHI_MAX, Math.PI, phi) : 1;
        chain.push({
          x: x, y: y, k: k, nA: nA, nB: nB, chain: (i === 0 ? 1 : -1),
          parity: (k % 2 === 0) ? 1 : -1,
          weight: b, merge: null, phi: phi
        });
      }
    }

    /* ── THE SOFT MERGE ──────────────────────────────────────────────────
       Only the two chains' TAILS can approach each other (they sweep toward
       the same antipode from opposite sides), so we walk inward from both
       ends and pair up whatever is within a flame radius. Two candidates at
       separation s become: both at weight w, plus one merged image at weight
       1-w carrying the summed energy. Total energy is identical at every w. */
    var usedP = {}, usedM = {};
    var merged = [];
    var nP = chainP.length, nM = chainM.length;
    for (var ip = nP - 1; ip >= 0; ip--) {
      var a = chainP[ip];
      var best = -1, bestS = Infinity;
      for (var im = nM - 1; im >= 0; im--) {
        if (usedM[im]) continue;
        var bq = chainM[im];
        var dx = a.x - bq.x, dy = a.y - bq.y;
        var s = Math.sqrt(dx * dx + dy * dy);
        if (s < bestS) { bestS = s; best = im; }
      }
      if (best < 0 || bestS >= eps) continue;
      var bR = chainM[best];
      usedP[ip] = true; usedM[best] = true;
      var w = smoother(0, eps, bestS);
      /* The merged record must inherit the pair's BIRTH weight too. Without
         this it springs into being at full energy the instant the pair is
         born at the antipode — a bright flash exactly where the room had
         promised there would never be one. (This was a real bug, caught by
         sweeping theta and watching total energy.) */
      var born = 0.5 * (a.weight + bR.weight);
      a.weight *= w;
      bR.weight *= w;
      merged.push({
        x: 0.5 * (a.x + bR.x), y: 0.5 * (a.y + bR.y),
        k: Math.min(a.k, bR.k),
        nA: a.nA, nB: a.nB, chain: 0,
        parity: a.parity,
        weight: born * (1 - w),
        merge: { of: [a, bR] },
        phi: Math.PI
      });
      /* one pair is all a corridor can have: the chains meet exactly once */
      break;
    }

    for (i = 0; i < nP; i++) out.push(chainP[i]);
    for (i = 0; i < nM; i++) out.push(chainM[i]);
    for (i = 0; i < merged.length; i++) out.push(merged[i]);

    /* Drop the weightless: a record at weight 0 carries no light and is not
       an image. (It leaves continuously — its weight reached 0 smoothly.) */
    var kept = [];
    for (i = 0; i < out.length; i++) if (out[i].weight > 1e-9) kept.push(out[i]);

    /* THE SEAM — the ring's ONE UNEQUAL ARC.

       Not "the gap at the back": a ring of five flames has a gap at the back
       too, and it is exactly one flame wide, which is what closure LOOKS
       like. The seam is the EXCESS — the largest gap between angularly
       adjacent flames, less the one spacing every gap is entitled to. It is
       0 exactly when the ring closes (odd N and even N alike) and positive
       otherwise, which is the resting state of this instrument and not an
       error. */
    var seam = seamOf(kept, thetaDeg, R);

    return finish(kept, thetaDeg, h, R, seam);
  };

  /* The largest angular gap around the vertex, less one nominal spacing.
     theta = 0 is its own closure — the parallel corridor has no back at all,
     so it has no unequal arc either. */
  function seamOf(images, thetaDeg, R) {
    if (thetaDeg <= 0 || !isFinite(R)) return 0;
    var ang = [];
    for (var i = 0; i < images.length; i++) {
      if (images[i].weight <= 1e-6) continue;
      /* angle about the vertex, which sits at (-R, 0) */
      ang.push(Math.atan2(images[i].y, images[i].x + R));
    }
    if (ang.length < 2) return 360;
    ang.sort(function (a, b) { return a - b; });
    var wrap = 2 * Math.PI - (ang[ang.length - 1] - ang[0]);
    var maxGap = wrap, minGap = wrap;
    for (var j = 1; j < ang.length; j++) {
      var g = ang[j] - ang[j - 1];
      if (g > maxGap) maxGap = g;
      if (g < minGap) minGap = g;
    }
    /* A closed ring has every gap the same. The seam is the ONE arc that is
       not like the others — and it can be short as easily as long, so the
       measure is the spread, not the excess over a nominal spacing. */
    return (maxGap - minGap) / DEG;
  }

  function finish(arr, thetaDeg, h, R, seam) {
    arr.seamAngle = seam;
    arr.theta = thetaDeg;
    arr.h = h;
    arr.R = R;
    arr.N = thetaDeg > 0 ? 360 / thetaDeg : Infinity;
    return arr;
  }

  /* ───────────────────────────────────────────────────────────────────────
     HOW MANY FLAMES — and why it is not a count of records.

     When a merged image splits, one record becomes three (two halves plus
     the fading merge) for exactly as long as the split is in progress. That
     is the right way to carry ENERGY through the transition, but it is the
     wrong thing to call "how many flames are there": the eye sees one light
     stretch and become two, never three.

     So the count is the sum of WEIGHTS. It is exactly N at a detent, walks
     continuously to N+2 as the ring opens, and never jumps. flameCount is
     every light in the family; drawnCount is the ones bright enough to be
     drawn at all, which is the number this room actually promises is stable
     when you drag the mirrors apart.
     ─────────────────────────────────────────────────────────────────────── */
  Orbit.flameCount = function (images) {
    var n = 0;
    for (var i = 0; i < images.length; i++) n += images[i].weight;
    return n;
  };

  Orbit.drawnCount = function (images, T, sigA, sigB) {
    var n = 0;
    for (var i = 0; i < images.length; i++) {
      var im = images[i];
      n += im.weight * T.visibility(im.k, null, sigA, sigB, im.nA, im.nB);
    }
    return n;
  };

  /* Total light in the family, in linear RGB. The soft merge must never
     change this — that is what makes it soft rather than a fudge. */
  Orbit.energy = function (images, T, sigA, sigB) {
    var e = [0, 0, 0];
    for (var i = 0; i < images.length; i++) {
      var im = images[i];
      var c = T.tint(im.k, sigA, sigB, im.nA, im.nB);
      if (im.merge) {
        var p = im.merge.of[0], q = im.merge.of[1];
        c = [0, 0, 0];
        var cp = T.tint(p.k, sigA, sigB, p.nA, p.nB);
        var cq = T.tint(q.k, sigA, sigB, q.nA, q.nB);
        c[0] = cp[0] + cq[0]; c[1] = cp[1] + cq[1]; c[2] = cp[2] + cq[2];
      }
      e[0] += im.weight * c[0];
      e[1] += im.weight * c[1];
      e[2] += im.weight * c[2];
    }
    return e;
  };

  /* The colour a record actually carries (merged records sum their pair). */
  Orbit.colourOf = function (im, T, sigA, sigB) {
    if (im.merge) {
      var p = im.merge.of[0], q = im.merge.of[1];
      var cp = T.tint(p.k, sigA, sigB, p.nA, p.nB);
      var cq = T.tint(q.k, sigA, sigB, q.nA, q.nB);
      return [cp[0] + cq[0], cp[1] + cq[1], cp[2] + cq[2]];
    }
    return T.tint(im.k, sigA, sigB, im.nA, im.nB);
  };

  /* ───────────────────────────────────────────────────────────────────────
     THE CLOSED-FORM ORACLE — parallel mirrors, theta = 0.

     With the candle midway between mirrors 2h apart, the ladder is exactly
         y_k = (-1)^(k+1) * 2 * k * h        (chain that meets mirror A first)
     This is NOT a second implementation the renderer uses; it exists only so
     the twin can hold the generator to a number that was derived on paper.
     ─────────────────────────────────────────────────────────────────────── */
  Orbit.ladderClosedForm = function (k, h, aFirst) {
    var sgn = (k % 2 === 1) ? 1 : -1;
    if (!aFirst) sgn = -sgn;
    return sgn * 2 * k * h;
  };

  /* ───────────────────────────────────────────────────────────────────────
     DETENTS — the angles at which the ring closes. Engraved at N = 3..12,
     plus theta = 0, which is its own kind of closure: the corridor with no
     far end, only an end of light. The stroke runs CONTINUOUSLY past them
     both ways; a detent is a place the instrument likes to rest, not a stop.
     ─────────────────────────────────────────────────────────────────────── */
  Orbit.N_LO = 3;
  Orbit.N_HI = 12;

  Orbit.detents = function () {
    var d = [];
    for (var N = Orbit.N_HI; N >= Orbit.N_LO; N--) d.push({ N: N, theta: 360 / N });
    d.push({ N: Infinity, theta: 0 });
    d.sort(function (a, b) { return a.theta - b.theta; });
    return d;
  };

  /* Each detent's bands scale with its LOCAL spacing, so N=11->12 (2.7 deg
     apart) behaves like N=3->4 (30 deg apart) instead of swallowing it. The
     0.42 / 0.12 coefficients guarantee neighbouring approach bands can never
     touch: 0.42g + 0.42g < g. */
  Orbit.bands = function () {
    var d = Orbit.detents();
    for (var i = 0; i < d.length; i++) {
      var lo = i > 0 ? d[i].theta - d[i - 1].theta : Infinity;
      var hi = i < d.length - 1 ? d[i + 1].theta - d[i].theta : Infinity;
      var gap = Math.min(lo, hi);
      if (!isFinite(gap)) gap = 30;
      d[i].gap = gap;
      d[i].approach = Math.min(2.2, 0.42 * gap);
      d[i].capture = Math.min(0.55, 0.12 * gap);
    }
    return d;
  };

  /* Which detent (if any) the instrument is currently in the pull of. */
  Orbit.nearestDetent = function (thetaDeg, bands) {
    bands = bands || Orbit.bands();
    var best = null, bestD = Infinity;
    for (var i = 0; i < bands.length; i++) {
      var dd = Math.abs(thetaDeg - bands[i].theta);
      if (dd < bestD) { bestD = dd; best = bands[i]; }
    }
    return { detent: best, dist: bestD };
  };

  /* The stage of the beat, from the angle alone. */
  Orbit.beatStateFor = function (thetaDeg, bands) {
    var n = Orbit.nearestDetent(thetaDeg, bands);
    if (!n.detent) return 'open';
    if (n.dist <= n.detent.capture) return 'capture';
    if (n.dist <= n.detent.approach) return 'approach';
    return 'open';
  };

  /* Pointer viscosity: the instrument gets heavier as it nears a detent, so
     the closure is something you FEEL arriving rather than something that
     happens to you. 1.0 out in the open, 0.35 at the lip. */
  Orbit.viscosity = function (thetaDeg, bands) {
    var n = Orbit.nearestDetent(thetaDeg, bands);
    if (!n.detent) return 1;
    var t = smoother(n.detent.capture, n.detent.approach, n.dist);
    return 0.35 + 0.65 * t;
  };

  /* ───────────────────────────────────────────────────────────────────────
     THE SPRING — critically damped, and CLAMPED so it can never sail past
     the target. Overshoot in LIGHT reads as a breath; overshoot in GEOMETRY
     reads as a bug, so the geometry is not allowed any.
     ─────────────────────────────────────────────────────────────────────── */
  Orbit.SPRING_W = 28;

  Orbit.springStep = function (x, v, target, dt, w) {
    w = w || Orbit.SPRING_W;
    if (dt > 0.05) dt = 0.05;
    var a = -w * w * (x - target) - 2 * w * v;
    var v2 = v + a * dt;
    var x2 = x + v2 * dt;
    /* never cross the target */
    if ((x - target) * (x2 - target) < 0) { x2 = target; v2 = 0; }
    return [x2, v2];
  };

  /* browser global */
  if (root && root.document) root.Orbit = Orbit;
  root.Orbit = Orbit;

  /* dual-use module guard (forge strips exactly this braced single line) */
  if (typeof module !== 'undefined' && module.exports) { module.exports = Orbit; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
