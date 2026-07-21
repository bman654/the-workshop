/* ═══════════════════════════════════════════════════════════════════════════
   seat.js — The Green Corridor's FURNITURE geometry. DOM-free, dual-use.

   Four handles hang off two mirrors: an end-cap and a pin on each bar. They
   are furniture, and furniture obeys two rules that have nothing to do with
   optics:

     (1) a handle is always INSIDE the reachable rect — the window minus the
         chrome that is actually on screen right now;
     (2) no handle sits on top of another — a 46px target wants 46px of
         clearance, and at narrow angles the two mirrors are only a dozen
         pixels apart on screen.

   Both rules used to live inside the page, which meant they were tested only
   by the in-page selftest, at the ONE viewport the browser happened to open.
   Viewport SHAPE is exactly the axis they fail on: at 740x420 — a landscape
   phone — the safe rect is a thin band, travelling along a steep bar runs out
   of rect in a few pixels, and the clamp restacks the caps into the pile the
   whole pass exists to prevent. So the geometry lives here, where the twin can
   sweep it across a grid of shapes.

   ── THE ONE SEAM ──────────────────────────────────────────────────────────
   The rect is computed from MEASURED chrome, never from classes: a panel
   mid-collapse carries its box off screen and the room opens up smoothly, and
   a display:none pill is a zero box that costs nothing. That discipline is
   load-bearing, so it survives verbatim — the page keeps only a thin harvest
   shim that maps its chrome ELEMENTS to plain boxes, and every scrap of
   geometry happens in here on plain numbers.

   Vanilla, ES5-ish, zero-dependency. Attaches a `Seat` global in the browser;
   exports the same object under Node for the twin.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Seat = {};

  var HANDLE_R = 23;          /* half a 46px target */
  var FRAME_AIR = 14;         /* and a little air beyond it */
  var CHROME_GAP = 12;
  var MIN_ROOM = 3 * HANDLE_R;
  var SEP = 46, TETHER = 1.3 * 46;

  Seat.HANDLE_R = HANDLE_R;
  Seat.FRAME_AIR = FRAME_AIR;
  Seat.CHROME_GAP = CHROME_GAP;
  Seat.MIN_ROOM = MIN_ROOM;
  Seat.SEP = SEP;
  Seat.TETHER = TETHER;

  /* Take one bite out of the rect for one piece of chrome: the bite that leaves
     the most room. (The plaque is a tall left column on desktop, so the cheapest
     cut is its right edge; the same plaque is a bottom sheet at ≤860px, so there
     the cheapest cut is its top edge. One rule, both layouts, no media query.)

     `b` is a plain box — {left, top, right, bottom, width, height} — exactly the
     shape a DOMRect already has, which is why the shim in the page is one map. */
  function subtractChrome(r, b, soft) {
    if (!b) return r;
    if (b.width < 1 || b.height < 1) return r;
    if (b.right <= r.x0 || b.left >= r.x1 || b.bottom <= r.y0 || b.top >= r.y1) return r;
    var cands = [
      { x0: Math.max(r.x0, b.right + CHROME_GAP), y0: r.y0, x1: r.x1, y1: r.y1 },
      { x0: r.x0, y0: r.y0, x1: Math.min(r.x1, b.left - CHROME_GAP), y1: r.y1 },
      { x0: r.x0, y0: Math.max(r.y0, b.bottom + CHROME_GAP), x1: r.x1, y1: r.y1 },
      { x0: r.x0, y0: r.y0, x1: r.x1, y1: Math.min(r.y1, b.top - CHROME_GAP) }
    ];
    var best = null;
    for (var i = 0; i < cands.length; i++) {
      var c = cands[i];
      var a = Math.max(0, c.x1 - c.x0) * Math.max(0, c.y1 - c.y0);
      if (!best || a > best.a) best = { a: a, c: c };
    }
    /* SOFT chrome is the read-outs — the HUD and the caption, both
       pointer-events:none, so they never actually block a grab. They get their
       way only while there is room to spare; the plaque and the pill always do. */
    if (soft && (best.c.x1 - best.c.x0 < MIN_ROOM || best.c.y1 - best.c.y0 < MIN_ROOM)) return r;
    return best.c;
  }
  Seat.subtractChrome = subtractChrome;

  /* The reachable rect: the window inset by one handle radius plus air, minus
     each chrome box IN ORDER. Order is part of the answer (each bite is taken
     from what the previous bite left), so the caller hands over an ordered
     array and this function never sorts it. Each box may carry `soft: true`. */
  Seat.safeRect = function (W, H, boxes) {
    var pad = HANDLE_R + FRAME_AIR;
    var full = { x0: pad, y0: pad, x1: W - pad, y1: H - pad };
    var r = full;
    if (boxes) {
      for (var i = 0; i < boxes.length; i++) {
        var b = boxes[i];
        if (!b) continue;
        r = subtractChrome(r, b, !!b.soft);
      }
    }
    /* Never hand back a rect with nowhere to stand. If the chrome has eaten the
       window (a very short phone with the sheet open), take the plain inset
       window back: a handle over the plaque is still grabbable — the handles
       outrank it in z — whereas a handle off the edge is gone. */
    if (r.x1 - r.x0 < MIN_ROOM || r.y1 - r.y0 < MIN_ROOM) r = full;
    return r;
  };

  /* A real parametric clip of the line p(t) = (bx0 + t·ax, by0 + t·ay) against
     the rect — Liang–Barsky. Returns [tEnter, tExit], or null when the line
     genuinely misses. The thing it replaces took max(t1,t2) per axis, which is
     the crossing in the +t direction only: correct ONLY when the base point is
     already inside. Below ten degrees the camera centres on a long corridor and
     the mirror feet sit far outside it, so the old code returned the far crossing
     of an interval that never met the window at all — and then a min-length clamp
     dressed the nonsense up as a bar. That is the whole bug. */
  Seat.clipInterval = function (bx0, by0, ax, ay, r) {
    var lo = -Infinity, hi = Infinity;
    function slab(p, q) {            /* p·t ≤ q */
      if (Math.abs(p) < 1e-12) return q >= 0;
      var t = q / p;
      if (p < 0) { if (t > lo) lo = t; } else { if (t < hi) hi = t; }
      return true;
    }
    if (!slab(-ax, bx0 - r.x0)) return null;
    if (!slab(ax, r.x1 - bx0)) return null;
    if (!slab(-ay, by0 - r.y0)) return null;
    if (!slab(ay, r.y1 - by0)) return null;
    if (lo > hi) return null;
    return [lo, hi];
  };

  function clampInto(p, r) {
    return [Math.min(Math.max(p[0], r.x0), Math.max(r.x0, r.x1)),
            Math.min(Math.max(p[1], r.y0), Math.max(r.y0, r.y1))];
  }
  Seat.clampInto = clampInto;

  function dist2d(a, b) {
    return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]));
  }
  Seat.dist2d = dist2d;

  /* ─────────────────────────────────────────────────────────────────────────
     CAN THIS RECT EVEN HOLD FOUR HANDLES?

     Honesty, not a loophole. Four points pairwise ≥ SEP apart need room: in a
     rect of w x h the best four-point packing is the four corners of the
     largest sub-rectangle, whose smallest pairwise distance is min(w, h)
     when both sides are used, so four SEP-separated points fit exactly when
     BOTH sides are ≥ SEP. (A degenerate band — say 900 x 20 — can hold four
     points 46 apart along its length, so the honest predicate is the weaker
     one below: it asks whether four points fit at all, by either arrangement.)
     Where capacity holds, mutual clearance is UNCONDITIONAL. Where it does
     not, only containment and no-worse-than-home are owed.
     ───────────────────────────────────────────────────────────────────────── */
  Seat.capacity = function (r, sep) {
    sep = (sep === undefined) ? SEP : sep;
    var w = Math.max(0, r.x1 - r.x0), h = Math.max(0, r.y1 - r.y0);
    /* four in a line along the longer side */
    if (Math.max(w, h) >= 3 * sep) return true;
    /* two-by-two in the box */
    return (w >= sep && h >= sep);
  };

  /* ─────────────────────────────────────────────────────────────────────────
     SEATING THE FOUR HANDLES.

     Two rules, and neither is decoration. (1) Every handle is inside the
     reachable rect — clamped there if the glass has slid out of the frame.
     (2) No handle sits on top of another: a 46px target needs 46px of
     clearance, and at very narrow angles the two mirrors are only a dozen
     pixels apart on screen, which used to stack all four caps into one
     unusable pile. A handle may only travel ALONG its own bar (so an end-cap
     stays an end-cap and a drag still means what it meant), never further than
     TETHER px from where the glass put it, and never outside the rect.

     G is the frame record: { rect, barA, barB }, each bar carrying `u` (the
     bar's unit direction in screen space), `capHome` and `pinHome`. Writes
     `capS` / `pinS` back onto each bar. No DOM, no canvas, no globals.
     ───────────────────────────────────────────────────────────────────────── */
  Seat.seatHandles = function (G) {
    var R = G.rect;
    var slots = [
      { b: G.barA, k: 'cap', pref: 1 },
      { b: G.barB, k: 'cap', pref: -1 },
      { b: G.barA, k: 'pin', pref: -1 },
      { b: G.barB, k: 'pin', pref: 1 }
    ];
    var i, j, s;
    for (i = 0; i < slots.length; i++) {
      s = slots[i];
      s.seat = clampInto(s.b[s.k + 'Home'], R);
      s.p = s.seat;
    }
    function travel(sl, amt, perp) {
      var u = perp ? [-sl.b.u[1], sl.b.u[0]] : sl.b.u;
      var x = sl.p[0] + amt * u[0], y = sl.p[1] + amt * u[1];
      var dx = x - sl.seat[0], dy = y - sl.seat[1], m = Math.sqrt(dx * dx + dy * dy);
      if (m > TETHER) { x = sl.seat[0] + dx / m * TETHER; y = sl.seat[1] + dy / m * TETHER; }
      return clampInto([x, y], R);
    }
    for (var it = 0; it < 12; it++) {
      var quiet = true;
      for (i = 0; i < slots.length; i++) for (j = i + 1; j < slots.length; j++) {
        var a = slots[i], b = slots[j];
        var d0 = dist2d(a.p, b.p);
        if (d0 >= SEP - 0.01) continue;
        quiet = false;
        /* Try all four sign pairs and keep the one that opens the most gap. The
           pair matters: when both bars are near-parallel, moving BOTH the same
           way along them separates nothing — only opposite moves do, which is
           why the two ears prefer opposite directions on a tie. */
        var push = (SEP - d0) * 0.6 + 0.5, best = null;
        for (var sa = -1; sa <= 1; sa += 2) for (var sb = -1; sb <= 1; sb += 2) {
          var pa = travel(a, sa * push, false), pb = travel(b, sb * push, false);
          var sc = dist2d(pa, pb)
            + 0.001 * ((sa === a.pref ? 1 : 0) + (sb === b.pref ? 1 : 0));
          if (!best || sc > best.sc) best = { sc: sc, pa: pa, pb: pb };
        }
        /* CRAMPED FRAMES — the along-bar rule is a PREFERENCE, not the invariant.
           In a short viewport (a landscape phone: 740x420 failed here) the safe
           rect is a thin band, so travelling along a steep bar runs out of rect in
           a few px and clampInto puts both handles back on the same edge — four
           46px targets restacked into the pile this whole pass exists to prevent.
           When along-bar CANNOT open the gap, a handle may step perpendicular off
           its bar instead. That is honest here and needs no new furniture: every
           handle already draws a dashed tether back to the glass whenever its seat
           differs from home, and the drag reads the POINTER's angle, never the
           handle's seat — so an off-bar cap still means exactly what it meant.
           Scored strictly against the along-bar best, so this engages ONLY where
           the preference has already failed, and the wide frames are untouched. */
        if (best.sc < SEP) {
          for (var qa = 0; qa < 2; qa++) for (var qb = 0; qb < 2; qb++) {
            if (!qa && !qb) continue;
            for (var ta = -1; ta <= 1; ta += 2) for (var tb = -1; tb <= 1; tb += 2) {
              var pa2 = travel(a, ta * push, !!qa), pb2 = travel(b, tb * push, !!qb);
              var sc2 = dist2d(pa2, pb2) - 0.002;  /* along-bar wins any tie */
              if (sc2 > best.sc) best = { sc: sc2, pa: pa2, pb: pb2 };
            }
          }
        }
        a.p = best.pa; b.p = best.pb;
      }
      if (quiet) break;
    }
    /* ── THE RESCUE, when the preference has run out of room ────────────────

       Everything above moves ONE PAIR at a time by exactly the gap it has to
       open. That is the right instrument while the shove is free: it keeps
       each handle on its own bar, close to where the glass put it, and it
       leaves roomy frames alone entirely. It is the wrong instrument once the
       rect or the tether is holding a handle still — a 1px nudge against an
       edge is no move at all, so the score never improves and the pass sits
       at 45px calling itself finished, in a frame where 65px was reachable.
       (740x420 once more: four seats clamped into an 18px cluster along the
       top edge of a 666x165 band. Fixing pair by pair, nobody can afford the
       one move that helps — dropping a single handle down into the room.)

       So when the preference leaves a pair short, relax ALL FOUR at once:
       every crowded pair pushes apart along the line between them, every
       handle is projected straight back inside its tether and the rect, and
       the best configuration seen is kept. It is a worse-behaved answer —
       handles come off their bars — so it is adopted ONLY if it strictly
       beats what the preference achieved, and it never runs otherwise. */
    var pts = [];
    for (i = 0; i < slots.length; i++) pts.push([slots[i].p[0], slots[i].p[1]]);
    if (worstPair(pts) < SEP - 0.01) {
      /* the relaxation is asked for a hair MORE than SEP, because a spring
         settling exactly on its rest length settles a whisker short of it and
         a whisker short of 46px is a failure. */
      var REST = SEP + 1.5;
      var kept = pts, keptScore = worstPair(pts);
      var cur = [];
      for (i = 0; i < pts.length; i++) cur.push([pts[i][0], pts[i][1]]);
      for (var pass = 0; pass < 240; pass++) {
        for (i = 0; i < cur.length; i++) for (j = i + 1; j < cur.length; j++) {
          var ux = cur[j][0] - cur[i][0], uy = cur[j][1] - cur[i][1];
          var dd = Math.sqrt(ux * ux + uy * uy);
          if (dd >= REST) continue;
          if (dd < 1e-6) {
            /* dead-on stacked: break the symmetry the same way every time, so
               a redraw of the same frame seats the handles identically */
            var ang = (i * 4 + j) * (Math.PI / 3);
            ux = Math.cos(ang); uy = Math.sin(ang); dd = 1;
          }
          var step = 0.55 * (REST - dd) / dd;
          cur[i] = [cur[i][0] - ux * step, cur[i][1] - uy * step];
          cur[j] = [cur[j][0] + ux * step, cur[j][1] + uy * step];
        }
        for (i = 0; i < cur.length; i++) cur[i] = leash(cur[i], slots[i].seat, R);
        var sc3 = worstPair(cur);
        if (sc3 > keptScore + 1e-9) {
          keptScore = sc3;
          kept = [];
          for (i = 0; i < cur.length; i++) kept.push([cur[i][0], cur[i][1]]);
          if (keptScore >= SEP) break;
        }
      }
      for (i = 0; i < slots.length; i++) slots[i].p = kept[i];
    }

    for (i = 0; i < slots.length; i++) slots[i].b[slots[i].k + 'S'] = slots[i].p;
    return G;
  };

  /* the tightest of the six clearances — the number the whole pass is about */
  function worstPair(pts) {
    var m = Infinity;
    for (var i = 0; i < pts.length; i++) for (var j = i + 1; j < pts.length; j++) {
      var d = dist2d(pts[i], pts[j]);
      if (d < m) m = d;
    }
    return m;
  }
  Seat.worstPair = worstPair;

  /* back inside the tether, then back inside the rect — in that order, because
     the rect is the rule you may never break and the tether is the one you may
     be pressed against. */
  function leash(p, seat, r) {
    var dx = p[0] - seat[0], dy = p[1] - seat[1], m = Math.sqrt(dx * dx + dy * dy);
    var x = p[0], y = p[1];
    if (m > TETHER) { x = seat[0] + dx / m * TETHER; y = seat[1] + dy / m * TETHER; }
    return clampInto([x, y], r);
  }

  /* browser global */
  if (root && root.document) root.Seat = Seat;
  root.Seat = Seat;

  /* dual-use module guard (forge strips exactly this braced single line) */
  if (typeof module !== 'undefined' && module.exports) { module.exports = Seat; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
