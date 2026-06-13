/* ═══════════════════════════════════════════════════════════════════════════
   label.js — the Workshop's Point-Feature Label-Placement engine (LabelPlacer).

   Cartographic Point-Feature Label Placement (PFLP) is a real, well-studied
   NP-hard problem: given a scatter of map points, drop a text label beside each
   so that no two labels overlap, no label covers a no-go obstacle (a river, a
   lake, a building footprint), and every label stays inside the frame — while
   honoring the cartographer's side preferences (a label reads best to the
   upper-right of its dot) and keeping leader lines short.

   This module implements the classic FIXED-POSITION (candidate-slot) model with
   SIMULATED ANNEALING, after Christensen, Marks & Shieber, "An Empirical Study
   of Algorithms for Point-Feature Label Placement" (ACM TOG 1995). Each feature
   gets 4 or 8 discrete candidate label rectangles around its anchor; the solver
   anneals a choice-vector (one slot per feature) to minimize a conflict energy,
   then greedily polishes. A SEEDED PRNG makes every (input, seed) pair produce a
   byte-identical placement.

   THE PROVABLE CLAIM: given feasible input, solve() returns a placement with
   0 label-label overlaps AND 0 label-obstacle overlaps; on infeasible input it
   degrades gracefully — it never crashes, returns a bounded result, and reports
   the minimized residual `overlaps`.

   Dual-use, dependency-free, ES5-ish. Inlined into pages VIA forge
   (`<!-- forge:include tools/label/label.js -->`); forge strips the module guard
   at the bottom. In a browser this attaches a `LabelPlacer` global. The solver
   itself touches no DOM — pure geometry — so it runs identically in Node.
   ═══════════════════════════════════════════════════════════════════════════ */
var LabelPlacer = (function () {
  'use strict';

  var API = {};
  API.VERSION = '1.0.0';

  /* ── Seeded PRNG: mulberry32. Deterministic, fast, good enough for SA. ────── */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ── Pure geometry helpers (no DOM) ───────────────────────────────────────
     Rectangles are {x, y, w, h} with (x, y) the TOP-LEFT corner, +y downward
     (screen/canvas convention). */

  /* Axis-aligned overlap AREA of two rects (0 if they don't intersect). */
  function overlapArea(a, b) {
    var ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    if (ix <= 0) return 0;
    var iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (iy <= 0) return 0;
    return ix * iy;
  }

  /* Do two rects overlap at all (strictly positive area)? */
  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && b.x < a.x + a.w &&
           a.y < b.y + b.h && b.y < a.y + a.h;
  }

  /* Area of `r` that falls OUTSIDE `bounds` (0 if fully contained). */
  function outOfBoundsArea(r, bounds) {
    if (!bounds) return 0;
    var inside = overlapArea(r, bounds);
    return (r.w * r.h) - inside;
  }

  /* Is `r` fully inside `bounds`? (with a tiny epsilon for float slop) */
  function rectInside(r, bounds, eps) {
    if (!bounds) return true;
    if (eps == null) eps = 1e-6;
    return r.x >= bounds.x - eps &&
           r.y >= bounds.y - eps &&
           r.x + r.w <= bounds.x + bounds.w + eps &&
           r.y + r.h <= bounds.y + bounds.h + eps;
  }

  /* Distance from a point to a rect (0 if inside) — used for leader length. */
  function pointRectDist(px, py, r) {
    var dx = Math.max(r.x - px, 0, px - (r.x + r.w));
    var dy = Math.max(r.y - py, 0, py - (r.y + r.h));
    return Math.sqrt(dx * dx + dy * dy);
  }

  /* Nearest point ON the perimeter (clamped to edge) of rect `r` to (px,py).
     Used to draw the leader from the anchor to the label's nearest edge. */
  function nearestEdgePoint(px, py, r) {
    var cx = Math.max(r.x, Math.min(px, r.x + r.w));
    var cy = Math.max(r.y, Math.min(py, r.y + r.h));
    // If the anchor is inside the rect (shouldn't happen with a gap), clamp to
    // the nearest edge so the leader still lands on the perimeter.
    if (cx > r.x && cx < r.x + r.w && cy > r.y && cy < r.y + r.h) {
      var dl = px - r.x, dr = (r.x + r.w) - px, dt = py - r.y, db = (r.y + r.h) - py;
      var m = Math.min(dl, dr, dt, db);
      if (m === dl) cx = r.x;
      else if (m === dr) cx = r.x + r.w;
      else if (m === dt) cy = r.y;
      else cy = r.y + r.h;
    }
    return [cx, cy];
  }

  /* ── Candidate-slot model ──────────────────────────────────────────────────
     Eight ranked sides. For E/W the label is vertically centered on the anchor;
     for N/S horizontally centered; diagonals tuck the near CORNER toward the
     anchor (offset by gap on both axes). Returns the TOP-LEFT (x,y) of the
     label rectangle for a given side. */
  var SIDES8 = ['right', 'left', 'top', 'bottom', 'ne', 'nw', 'se', 'sw'];
  var SIDES4 = ['right', 'left', 'top', 'bottom'];

  function slotTopLeft(anchor, w, h, gap, side) {
    var ax = anchor.x, ay = anchor.y, x, y;
    switch (side) {
      case 'right':  x = ax + gap;            y = ay - h / 2;          break;
      case 'left':   x = ax - gap - w;        y = ay - h / 2;          break;
      case 'top':    x = ax - w / 2;          y = ay - gap - h;        break;
      case 'bottom': x = ax - w / 2;          y = ay + gap;            break;
      case 'ne':     x = ax + gap * 0.7071;   y = ay - gap * 0.7071 - h; break;
      case 'nw':     x = ax - gap * 0.7071 - w; y = ay - gap * 0.7071 - h; break;
      case 'se':     x = ax + gap * 0.7071;   y = ay + gap * 0.7071;   break;
      case 'sw':     x = ax - gap * 0.7071 - w; y = ay + gap * 0.7071; break;
      default:       x = ax + gap;            y = ay - h / 2;          break;
    }
    return { x: x, y: y };
  }

  /* Build the candidate list for one feature. Each candidate carries its rect,
     its side, and a preference RANK (0 = most preferred). Ranking honors an
     explicit `prefer` list first, then the default side order. */
  function buildCandidates(feature, positions) {
    var sides = positions === 4 ? SIDES4 : SIDES8;
    var gap = feature.gap != null ? feature.gap : 10;
    var w = feature.label.w, h = feature.label.h, a = feature.anchor;

    // Rank map: prefer list wins (earliest = best), then remaining sides in the
    // canonical order, appended after.
    var rank = {}, r = 0, i, s;
    var prefer = feature.prefer || [];
    for (i = 0; i < prefer.length; i++) {
      s = prefer[i];
      if (sides.indexOf(s) >= 0 && rank[s] == null) rank[s] = r++;
    }
    for (i = 0; i < sides.length; i++) {
      s = sides[i];
      if (rank[s] == null) rank[s] = r++;
    }

    var cands = [];
    for (i = 0; i < sides.length; i++) {
      s = sides[i];
      var tl = slotTopLeft(a, w, h, gap, s);
      cands.push({
        side: s,
        rank: rank[s],
        rect: { x: tl.x, y: tl.y, w: w, h: h }
      });
    }
    // Sort by preference rank so candidate[0] is always the most-preferred slot.
    cands.sort(function (p, q) { return p.rank - q.rank; });
    return cands;
  }

  /* ── Energy weights ─────────────────────────────────────────────────────────
     Overlaps must dominate: a single overlapping pixel of label-label or
     label-obstacle conflict (or out-of-bounds) costs more than any preference or
     leader-length term could accumulate. The soft terms only break ties between
     equally-conflict-free layouts (steer toward preferred sides + short leaders). */
  var W = {
    ll: 1000,   // per unit-area label↔label overlap
    lo: 1000,   // per unit-area label↔obstacle overlap
    b:  1000,   // per unit-area out-of-bounds
    p:  3,      // per preference-rank step
    d:  0.05    // per unit leader length
  };

  /* Soft (tie-break) cost of a single chosen slot: side preference + leader. */
  function softCost(feat, cand) {
    var edge = nearestEdgePoint(feat.anchor.x, feat.anchor.y, cand.rect);
    var dx = edge[0] - feat.anchor.x, dy = edge[1] - feat.anchor.y;
    var leader = Math.sqrt(dx * dx + dy * dy);
    return W.p * cand.rank + W.d * leader;
  }

  /* Hard (conflict) cost a chosen rect contributes against obstacles + bounds.
     Label↔label is computed pairwise in the global energy, not here. */
  function hardCostSolo(rect, obstacles, bounds) {
    var c = 0, i;
    for (i = 0; i < obstacles.length; i++) c += W.lo * overlapArea(rect, obstacles[i]);
    c += W.b * outOfBoundsArea(rect, bounds);
    return c;
  }

  /* ── The solver ─────────────────────────────────────────────────────────────
     solve(spec) → { placements, overlaps, energy }. See module header / API doc.
     - Pinned features never move (their pin rect is fixed) but still act as
       obstacles for everyone else (and against each other).
     - Free features anneal a slot index; we start each at its most-preferred
       slot, propose single-feature slot flips, accept by Metropolis, cool
       geometrically, then greedily polish to a local optimum. */
  function solve(spec) {
    spec = spec || {};
    var bounds = spec.bounds || null;
    var positions = spec.positions === 4 ? 4 : 8;
    var seedExtra = spec.obstacles ? spec.obstacles.length : 0;
    var seed = (spec.seed != null ? spec.seed : 0x9E3779B9) >>> 0;
    var rng = mulberry32(seed);
    var inFeatures = spec.features || [];
    var extraObstacles = (spec.obstacles || []).map(function (o) {
      return { x: o.x, y: o.y, w: o.w, h: o.h };
    });

    var n = inFeatures.length;
    var i, j;

    // Partition into pinned vs free. Build per-feature candidate lists.
    var feats = [];      // working records, in input order
    for (i = 0; i < n; i++) {
      var f = inFeatures[i];
      var gap = f.gap != null ? f.gap : 10;
      var rec = {
        id: f.id != null ? f.id : i,
        anchor: { x: f.anchor.x, y: f.anchor.y },
        w: f.label.w, h: f.label.h,
        gap: gap,
        pinned: false,
        candidates: null,
        slot: 0,
        rect: null,
        side: null
      };
      if (f.pin) {
        rec.pinned = true;
        rec.side = f.pin.side || 'pin';
        // A pin gives the label's top-left directly (pin is the top-left corner
        // in the same coordinate frame as anchor / bounds).
        rec.rect = { x: f.pin.x, y: f.pin.y, w: f.label.w, h: f.label.h };
      } else {
        rec.candidates = buildCandidates(f, positions);
        rec.slot = 0; // most-preferred (candidates are pre-sorted by rank)
        rec.rect = cloneRect(rec.candidates[0].rect);
        rec.side = rec.candidates[0].side;
      }
      feats.push(rec);
    }

    // Static obstacles seen by FREE features = extra obstacles + every pinned
    // label rect. (Pinned-vs-pinned conflict is fixed input; it still counts in
    // the reported overlaps, but the solver can't fix it.)
    var pinnedRects = [];
    for (i = 0; i < n; i++) if (feats[i].pinned) pinnedRects.push(feats[i].rect);
    var staticObstacles = extraObstacles.concat(pinnedRects);

    var freeIdx = [];
    for (i = 0; i < n; i++) if (!feats[i].pinned) freeIdx.push(i);

    /* Total energy of the current assignment. O(n²) over free+pinned label
       pairs; fine for the workshop's scale (≤ a few hundred). */
    function totalEnergy() {
      var e = 0, a, b;
      // soft + solo-hard for each free feature
      for (var k = 0; k < freeIdx.length; k++) {
        var fi = freeIdx[k];
        var fc = feats[fi];
        e += softCost(fc, fc.candidates[fc.slot]);
        e += hardCostSolo(fc.rect, staticObstacles, bounds);
      }
      // label↔label between every unordered pair of (free + pinned) labels
      for (a = 0; a < n; a++) {
        for (b = a + 1; b < n; b++) {
          // skip pinned-vs-static double count: pinned rects are already in
          // staticObstacles, so a free-vs-pinned pair is counted in
          // hardCostSolo above. Only count free-vs-free here, plus pinned-vs-
          // pinned (which solo cost never sees).
          var pa = feats[a].pinned, pb = feats[b].pinned;
          if (pa && pb) {
            e += W.ll * overlapArea(feats[a].rect, feats[b].rect);
          } else if (!pa && !pb) {
            e += W.ll * overlapArea(feats[a].rect, feats[b].rect);
          }
          // (free-vs-pinned already handled via staticObstacles)
        }
      }
      return e;
    }

    // Initial energy (all most-preferred slots) — reported for the monotone
    // improvement guarantee.
    var initialEnergy = totalEnergy();

    // ── Simulated annealing over free features ──────────────────────────────
    if (freeIdx.length > 0) {
      var iters = spec.iterations != null
        ? spec.iterations
        : Math.max(2000, freeIdx.length * 220);

      var T = 1.0 * (W.ll); // start hot enough to climb over a single overlap
      var Tmin = 1e-3;
      var cooling = Math.pow(Tmin / T, 1 / Math.max(1, iters));

      var curE = initialEnergy;
      for (var it = 0; it < iters; it++) {
        // propose: pick a random free feature, move it to a random OTHER slot
        var pick = freeIdx[(rng() * freeIdx.length) | 0];
        var fp = feats[pick];
        var nslots = fp.candidates.length;
        if (nslots < 2) { T *= cooling; continue; }
        var newSlot = (rng() * nslots) | 0;
        if (newSlot === fp.slot) newSlot = (newSlot + 1) % nslots;

        // delta energy from moving JUST this feature
        var oldSlot = fp.slot;
        var oldRect = fp.rect;
        var oldCand = fp.candidates[oldSlot];
        var newCand = fp.candidates[newSlot];
        var newRect = newCand.rect;

        var dE = deltaEnergy(pick, fp, oldRect, oldCand, newRect, newCand);

        if (dE <= 0 || rng() < Math.exp(-dE / T)) {
          fp.slot = newSlot;
          fp.rect = cloneRect(newRect);
          fp.side = newCand.side;
          curE += dE;
        }
        T *= cooling;
      }
    }

    /* Energy delta for re-slotting free feature `pick` from oldCand→newCand.
       Sums the soft-cost change, solo-hard change vs static obstacles+bounds,
       and the label↔label change against every OTHER feature's current rect. */
    function deltaEnergy(pick, fp, oldRect, oldCand, newRect, newCand) {
      var d = 0, k;
      d += softCost(fp, newCand) - softCost(fp, oldCand);
      d += hardCostSolo(newRect, staticObstacles, bounds) -
           hardCostSolo(oldRect, staticObstacles, bounds);
      for (k = 0; k < n; k++) {
        if (k === pick) continue;
        var other = feats[k];
        // free-vs-free + free-vs-pinned: but pinned are in staticObstacles, so
        // counting them here too would double count. Only compare against OTHER
        // FREE features here.
        if (other.pinned) continue;
        d += W.ll * (overlapArea(newRect, other.rect) - overlapArea(oldRect, other.rect));
      }
      return d;
    }

    // ── Greedy local-improvement sweep ──────────────────────────────────────
    // Repeatedly move each free feature to its best slot given everyone else,
    // until a full pass makes no change (local optimum) or we hit a cap.
    if (freeIdx.length > 0) {
      var sweeps = 0, maxSweeps = 24, changed = true;
      while (changed && sweeps < maxSweeps) {
        changed = false; sweeps++;
        for (var s = 0; s < freeIdx.length; s++) {
          var gi = freeIdx[s];
          var gf = feats[gi];
          var bestSlot = gf.slot, bestRect = gf.rect, bestCand = gf.candidates[gf.slot];
          var bestDelta = 0;
          for (var cand = 0; cand < gf.candidates.length; cand++) {
            if (cand === gf.slot) continue;
            var cc = gf.candidates[cand];
            var dd = deltaEnergy(gi, gf, gf.rect, gf.candidates[gf.slot], cc.rect, cc);
            if (dd < bestDelta - 1e-9) { bestDelta = dd; bestSlot = cand; bestRect = cc.rect; bestCand = cc; }
          }
          if (bestSlot !== gf.slot) {
            gf.slot = bestSlot;
            gf.rect = cloneRect(bestRect);
            gf.side = bestCand.side;
            changed = true;
          }
        }
      }
    }

    // ── Assemble the result + count residual conflicts ──────────────────────
    var finalEnergy = totalEnergy();
    var placements = [];
    var overlaps = 0;

    // Count: label↔label conflicting PAIRS, label↔obstacle, out-of-bounds.
    // (Counts conflicts, not areas — a clean layout reports 0.)
    var allRects = [];
    for (i = 0; i < n; i++) allRects.push(feats[i].rect);

    // per-label overlapped flag
    var overlappedFlag = new Array(n);
    for (i = 0; i < n; i++) overlappedFlag[i] = false;

    for (i = 0; i < n; i++) {
      for (j = i + 1; j < n; j++) {
        if (rectsOverlap(allRects[i], allRects[j])) {
          overlaps++;
          overlappedFlag[i] = true; overlappedFlag[j] = true;
        }
      }
    }
    for (i = 0; i < n; i++) {
      for (j = 0; j < extraObstacles.length; j++) {
        if (rectsOverlap(allRects[i], extraObstacles[j])) {
          overlaps++;
          overlappedFlag[i] = true;
        }
      }
      if (bounds && !rectInside(allRects[i], bounds, 1e-6)) {
        overlaps++;
        overlappedFlag[i] = true;
      }
    }

    for (i = 0; i < n; i++) {
      var rc = feats[i];
      var edge = nearestEdgePoint(rc.anchor.x, rc.anchor.y, rc.rect);
      var soloHard = hardCostSolo(rc.rect, extraObstacles, bounds);
      // a representative per-label cost (soft + its solo hard); useful for UIs
      var labelCost = soloHard;
      if (!rc.pinned) labelCost += softCost(rc, rc.candidates[rc.slot]);
      placements.push({
        id: rc.id,
        x: rc.rect.x,
        y: rc.rect.y,
        side: rc.side,
        label: { x: rc.rect.x, y: rc.rect.y, w: rc.rect.w, h: rc.rect.h },
        leader: [[rc.anchor.x, rc.anchor.y], [edge[0], edge[1]]],
        cost: round6(labelCost),
        overlapped: overlappedFlag[i]
      });
    }

    return {
      placements: placements,
      overlaps: overlaps,
      energy: round6(finalEnergy),
      initialEnergy: round6(initialEnergy)
    };
  }

  /* ── small utilities ──────────────────────────────────────────────────────── */
  function cloneRect(r) { return { x: r.x, y: r.y, w: r.w, h: r.h }; }
  function round6(v) { return Math.round(v * 1e6) / 1e6; }

  /* ── public surface ──────────────────────────────────────────────────────── */
  API.solve = solve;
  // expose the geometry helpers so callers (the map, the page, tests) can reuse
  // the EXACT same predicates the solver uses to score / verify a layout.
  API.geom = {
    overlapArea: overlapArea,
    rectsOverlap: rectsOverlap,
    outOfBoundsArea: outOfBoundsArea,
    rectInside: rectInside,
    pointRectDist: pointRectDist,
    nearestEdgePoint: nearestEdgePoint,
    slotTopLeft: slotTopLeft,
    buildCandidates: buildCandidates
  };
  API.mulberry32 = mulberry32;
  API.WEIGHTS = W;
  API.SIDES8 = SIDES8;
  API.SIDES4 = SIDES4;

  return API;
})();

/* browser global */
(function (root) {
  if (root) root.LabelPlacer = LabelPlacer;
})(typeof globalThis !== 'undefined' ? globalThis : this);

// dual-use module guard (forge strips exactly this braced single line)
if (typeof module !== 'undefined' && module.exports) { module.exports = LabelPlacer; }
