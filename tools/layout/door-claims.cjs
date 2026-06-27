/* ════════════════════════════════════════════════════════════════════════════
   door-claims.cjs — the front door's 17-claim LEGIBILITY SELF-TEST, single-sourced.

   THE BUG IT CLOSES (#337): the front door's own 17-claim pill (runDoorSelfTest, once
   inline in index.src.html) ran ONLY in the browser, where it reads the LIVE estate and
   goes ✗16/17 (CLAIM C′). The node gates a builder runs (smoke.cjs, legibility.test.cjs)
   check a DIFFERENT thing — the conscience's self-consistency on SYNTHETIC controls — so
   they report GREEN while the rendered door is RED. The live-estate door claims had NO
   node twin, so the gate could not SEE what the door shows.

   THE FIX: this module is the ONE place the 17 claims + the loupe declutter live. Both
   callers run the SAME code over the SAME live data, differing only in ONE injected
   dependency — the BOX-SOURCE (`boxOf(id) → {x,y,w,h}|null`, the rendered label box the
   declutter runs on):
     · the PAGE  (index.src.html) wires `boxOf` = SOLVED.get(id).box — the real,
       getBBox-measured, LabelPlacer-annealed box. The live pill is byte-unchanged.
     · the TWIN  (tools/layout/door.test.cjs) wires `boxOf` = a MODELED SOLVED box
       (Layout.solve footprints + legibility.cjs's CHAR_W box-{w,h} model + LabelPlacer
       placement) over the live PLACES read out of index.src.html. A calibration guard
       ties the modeled boxes to the rendered getBBox truth (a checked-in mirror), so the
       twin's verdict equals the live pill's, claim-for-claim — the gate now SEES the red.

   WHY ONLY THE BOX-SOURCE DIFFERS: 14 of the 17 claims are already DOM-free (the
   conscience's self-consistency on synthetic controls, the resting/full-plate composites
   over the live solve). Only the 3 declutter claims (B revealed-overlap sweep, C tour
   overlaps, C′ tier-1 coverage) read the rendered SOLVED boxes — and those are exactly
   what `boxOf` injects. The loupe's OWN revealedSet/declutterIds delegate here too, so
   the live loupe and the claims share one declutter implementation (no re-implementation).

   Node-pure, zero external deps. Dual-use: `require`d by the twin; forge-inlined into the
   page (the strippable guard at the bottom keeps Node's require working; the IIFE attaches
   the `DoorClaims` global the page reads).
   ════════════════════════════════════════════════════════════════════════════ */
'use strict';

var DoorClaims = (function () {
'use strict';

/* ── footprint geometry (mirror index.src.html footCentre) ─────────────────── */
function footCentre(r) {
  if (r.footprint === 'tower') return { cx: r.x, cy: r.y };
  return { cx: r.x + r.w / 2, cy: r.y + r.h / 2 };
}
function overlapRect(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/* ── THE LOUPE DECLUTTER (single source — index.src.html's LOUPE delegates here) ──
   Two fixed SCREEN-space constants the loupe + the door claims share. */
var LOUPE_SCREEN = 300;    // the loupe radius in CSS px (screen space)
var MIN_SCREEN_GAP = 18;   // breathing room demanded between two on-screen labels (CSS px)

/* greedy screen-space admit: tier-first then nearest-focus, admit a candidate only if its
   SOLVED box inflated by `pad` clears every already-admitted box. The non-overlap of the
   admitted set is a GEOMETRIC guarantee (the property CLAIM B / CLAIM C prove). */
function greedyAdmit(cand, pad) {
  cand.sort(function (a, b) { return a.tier - b.tier || a.d2 - b.d2; });
  var admitted = [];
  for (var i = 0; i < cand.length; i++) {
    var cd = cand[i];
    var inf = { x: cd.box.x - pad, y: cd.box.y - pad, w: cd.box.w + 2 * pad, h: cd.box.h + 2 * pad };
    var ok = true;
    for (var j = 0; j < admitted.length; j++) { if (overlapRect(inf, admitted[j].box)) { ok = false; break; } }
    if (ok) admitted.push(cd);
  }
  return admitted.map(function (a) { return a.id; });
}

/* revealedSet(places, boxOf, focus, k) → [ids] — the loupe's fixed-SCREEN-radius reveal
   + greedy declutter. Candidates are the present (placed → boxOf non-null) POIs whose
   footprint centre lies within LOUPE_SCREEN/k viewBox units of the focus; the gap maps to
   MIN_SCREEN_GAP/k viewBox units. Identical to index.src.html's loupe revealedSet. */
function revealedSet(places, boxOf, focus, k) {
  if (!focus) return [];
  var loupeVB = LOUPE_SCREEN / k, loupeVB2 = loupeVB * loupeVB;
  var padVB = MIN_SCREEN_GAP / k;
  var cand = [];
  for (var i = 0; i < places.length; i++) {
    var p = places[i];
    var box = boxOf(p.id); if (!box) continue;     // only placed labels can light
    var c = footCentre(p);
    var d2 = (c.cx - focus.x) * (c.cx - focus.x) + (c.cy - focus.y) * (c.cy - focus.y);
    if (d2 > loupeVB2) continue;                    // outside the loupe
    cand.push({ id: p.id, box: box, d2: d2, tier: (p.tier || 9) });
  }
  return greedyAdmit(cand, padVB);
}

/* declutterIds(ids, places, boxOf, focus, k) → a non-overlapping subset of an EXPLICIT id
   list (the guided-tour whole-district set), the SAME greedy pass as revealedSet but seeded
   over the given ids instead of a loupe radius. Identical to index.src.html's declutterIds
   (and the door pill's inline Claim-C declutter). */
function declutterIds(ids, places, boxOf, focus, k) {
  var pad = MIN_SCREEN_GAP / Math.max(k, 0.0001);
  var byId = {};
  for (var i = 0; i < places.length; i++) byId[places[i].id] = places[i];
  var cand = [];
  for (var j = 0; j < ids.length; j++) {
    var box = boxOf(ids[j]); if (!box) continue;
    var p = byId[ids[j]];
    var c = p ? footCentre(p) : { cx: box.x, cy: box.y };
    var d2 = focus ? (c.cx - focus.x) * (c.cx - focus.x) + (c.cy - focus.y) * (c.cy - focus.y) : 0;
    cand.push({ id: ids[j], box: box, d2: d2, tier: (p && p.tier) || 9 });
  }
  return greedyAdmit(cand, pad);
}

/* ── THE SHARED CONTROL CORPUS — the conscience's clean/crowded controls. Byte-identical
   to legibility.test.cjs's controls, so the page pill + the node twin + the conscience's
   own regression test all prove the SAME threshold derivation (they cannot drift). ── */
var CLEAN = [
  { id: 'a', room: 'Alpha',   piece: 'Alpha',   tag: 'one',   district: 'manor',       tier: 2, wing: 'studies', footprint: 'house-wing' },
  { id: 'b', room: 'Beta',    piece: 'Beta',    tag: 'two',   district: 'observatory', tier: 1,                  footprint: 'tower' },
  { id: 'c', room: 'Gamma',   piece: 'Gamma',   tag: 'three', district: 'grounds',     tier: 2, wing: 'works',   footprint: 'engine' },
  { id: 'd', room: 'Delta',   piece: 'Delta',   tag: 'four',  district: 'cavern',      tier: 1,                  footprint: 'cave' },
  { id: 'e', room: 'Epsilon', piece: 'Epsilon', tag: 'five',  district: 'outbuilding', tier: 3,                  footprint: 'shed' },
  { id: 'f', room: 'Zeta',    piece: 'Zeta',    tag: 'six',   district: 'grounds',     tier: 2, wing: 'optics',  footprint: 'hall' }
];
function crowdedCorpus(n) {
  var out = [];
  for (var i = 0; i < n; i++) out.push({ id: 'x' + i, room: 'Crowded Room ' + i, piece: 'Crowded Piece ' + i, tag: 'jammed',
    district: 'grounds', tier: 1, wing: 'amusements', footprint: 'arcade', order: i });
  return out;
}

/* ════════════════════════════════════════════════════════════════════════════
   runDoorClaims({ Legibility, Layout, places, layout, boxOf }) → the 17-claim report.

   places  — the live PLACES (each with x/y/w/h|r filled from the solve, + .locked + .tier).
   layout  — Layout.solve(places) (the LAYOUT), for CLAIM A + the full-plate composite.
   boxOf   — id → {x,y,w,h}|null : the INJECTED rendered-label box source (page: real
             getBBox SOLVED boxes; twin: modeled SOLVED boxes). This is the ONLY thing that
             differs between the live pill and the node twin.

   Returns { pass, total, passed, lines:[{name,ok,detail}], restComposite, restVerdict,
             fullComposite, fullVerdict, overlaps, pairs, tourOverlaps, tourPairs,
             tourPlates, tourLit, tourRaw, tier1lit, tier1raw }. Mirrors the original
   index.src.html runDoorSelfTest exactly (same claim names, details, numbers).
   ════════════════════════════════════════════════════════════════════════════ */
function runDoorClaims(args) {
  var Legibility = args.Legibility, Layout = args.Layout;
  var places = args.places, boxOf = args.boxOf;
  var layout = args.layout || Layout.solve(places);
  var L = Legibility, lines = [];
  function check(name, cond, detail) { lines.push({ name: name, ok: !!cond, detail: detail || '' }); }

  var cleanRep   = L.score(Layout.solve(CLEAN), CLEAN);
  var crowdedRep = L.score(Layout.solve(crowdedCorpus(12)), crowdedCorpus(12));
  var TH = L.THRESHOLD;

  // CLAIM 1 + 2: the two controls straddle the threshold.
  check('clean-positive PASSES (composite < threshold)',
    cleanRep.pass && cleanRep.overall.composite < TH,
    '[' + cleanRep.overall.composite + ' < ' + TH + ']');
  check('crowded-negative FAILS (composite > threshold)',
    !crowdedRep.pass && crowdedRep.overall.composite > TH,
    '[' + crowdedRep.overall.composite + ' > ' + TH + ']');

  // CLAIM 4: the threshold derives from the controls (clean << threshold << crowded).
  check('threshold derives from controls: clean << threshold << crowded',
    cleanRep.overall.composite < TH - 0.05 && crowdedRep.overall.composite > TH + 0.05,
    '[' + cleanRep.overall.composite + ' << ' + TH + ' << ' + crowdedRep.overall.composite + ']');
  // the weights are the documented gap-dominant blend and sum to 1.
  check('weights are gap-dominant and normalized',
    L.WEIGHTS.gap === 0.5 && L.WEIGHTS.density === 0.3 && L.WEIGHTS.leader === 0.2 &&
    Math.abs(L.WEIGHTS.gap + L.WEIGHTS.density + L.WEIGHTS.leader - 1) < 1e-9,
    '[gap=' + L.WEIGHTS.gap + ' density=' + L.WEIGHTS.density + ' leader=' + L.WEIGHTS.leader + ']');

  // CLAIM 3: monotonicity — density AND composite non-decreasing across n=2..12.
  var prevD = -1, prevC = -1, densMono = true, compMono = true, EPS = 1e-9;
  for (var n = 2; n <= 12; n++) {
    var rep = L.score(Layout.solve(crowdedCorpus(n)), crowdedCorpus(n));
    if (rep.overall.density   < prevD - EPS) densMono = false;
    if (rep.overall.composite < prevC - EPS) compMono = false;
    prevD = rep.overall.density; prevC = rep.overall.composite;
  }
  check('density monotone non-decreasing (sweep n=2..12)', densMono);
  check('composite monotone non-decreasing (sweep n=2..12)', compMono);

  // FACET-2 crux: EXACT-INTEGER crossing counter + segIntersectsRect.
  check('two crossing segments → 1',
    L.countCrossings([{ x0: 0, y0: 0, x1: 10, y1: 10 }, { x0: 0, y0: 10, x1: 10, y1: 0 }]) === 1);
  check('parallel segments → 0',
    L.countCrossings([{ x0: 0, y0: 0, x1: 10, y1: 0 }, { x0: 0, y0: 5, x1: 10, y1: 5 }]) === 0);
  check('shared-endpoint (sibling stubs) → 0',
    L.countCrossings([{ x0: 5, y0: 5, x1: 0, y1: 0 }, { x0: 5, y0: 5, x1: 10, y1: 0 }]) === 0);
  check('three mutually-crossing segments → 3',
    L.countCrossings([{ x0: 0, y0: 0, x1: 10, y1: 6 }, { x0: 0, y0: 6, x1: 10, y1: 0 }, { x0: 5, y0: -2, x1: 5, y1: 8 }]) === 3);
  check('leader through rect interior → intrusion',
    L.segIntersectsRect(0, 5, 20, 5, { x: 8, y: 0, w: 4, h: 10 }, 0) === true);
  check('leader missing rect → no intrusion',
    L.segIntersectsRect(0, 50, 20, 50, { x: 8, y: 0, w: 4, h: 10 }, 0) === false);

  // ── CLAIM A: the RESTING fit-view layer (district captions only = ZERO per-room
  //    labels) is LEGIBLE. Feed the LIVE conscience the SAME solve the plate uses,
  //    with the EMPTY label set. This is the fix at the layer a visitor reads.
  var restComposite = null, restVerdict = '?';
  var fullComposite = null, fullVerdict = '?';
  try {
    var restRep = L.score(layout, []);            // the resting layer: no POI labels
    restComposite = restRep.overall.composite; restVerdict = restRep.overall.verdict;
    var fullRep = L.score(layout, places);        // the old all-at-once plate (the bug)
    fullComposite = fullRep.overall.composite; fullVerdict = fullRep.overall.verdict;
  } catch (e) { /* leave unknown */ }
  check('CLAIM A — RESTING fit-view layer is LEGIBLE (composite < threshold)',
    restVerdict === 'LEGIBLE' && restComposite != null && restComposite < TH,
    '[' + restComposite + ' < ' + TH + ']');
  // the bug is never DEFINED AWAY: the full plate, all 46 labels at once, is STILL CROWDED.
  check('the full plate (all 46 labels at once) is STILL CROWDED (#103 acknowledged)',
    fullVerdict === 'CROWDED' && fullComposite != null && fullComposite > TH,
    '[full ' + fullComposite + ' > ' + TH + ']');

  // ── CLAIM B: the REVEALED layer never re-crowds — a GEOMETRIC proof of ZERO rendered
  //    label-overlaps across a full focus×zoom sweep (every placed POI × 7 zooms), reusing
  //    the loupe's OWN revealedSet() over the injected SOLVED boxes.
  var overlaps = 0, pairs = 0, sweepRan = false;
  try {
    var ZOOMS = [1, 1.5, 2, 2.5, 3, 3.5, 4];
    for (var zi = 0; zi < ZOOMS.length; zi++) {
      for (var pi = 0; pi < places.length; pi++) {
        var pp = places[pi]; if (!boxOf(pp.id)) continue;
        var cc = footCentre(pp);
        var ids = revealedSet(places, boxOf, { x: cc.cx, y: cc.cy }, ZOOMS[zi]);
        for (var ii = 0; ii < ids.length; ii++) for (var jj = ii + 1; jj < ids.length; jj++) {
          var ba = boxOf(ids[ii]), bb = boxOf(ids[jj]); if (!ba || !bb) continue;
          pairs++; if (overlapRect(ba, bb)) overlaps++;
        }
      }
    }
    sweepRan = true;
  } catch (e) { /* sweep unavailable → claim cannot be asserted */ }
  check('CLAIM B — revealed declutter: ZERO rendered overlaps (46 focuses × 7 zooms)',
    sweepRan && overlaps === 0, '[' + overlaps + ' overlaps / ' + pairs + ' pairs]');

  // ── CLAIM C (#262 re-model): the GUIDED-TOUR district label set, as the loupe actually
  //    lights it, is declutter-clean. Partition the live places with the SAME Layout.plates()
  //    the page + twin use, declutter each plate's whole-POI set the SAME greedy way the loupe
  //    does, and assert ZERO rendered overlaps + a non-trivial tier-1 survival.
  var tourOverlaps = 0, tourPairs = 0, tourPlates = 0, tourLit = 0, tourRaw = 0, tourRan = false;
  var tier1raw = 0, tier1lit = 0;
  try {
    var liveP = places.filter(function (p) { return !p.locked; });
    var part = Layout.plates(liveP);
    var lockedId = (places.find(function (p) { return p.locked; }) || {}).id;
    var byPlate = {};
    for (var pi2 = 0; pi2 < places.length; pi2++) {
      var pp2 = places[pi2]; if (!boxOf(pp2.id)) continue;
      var pid2 = part.roomPlate[pp2.id];
      if (!pid2 && pp2.id === lockedId) pid2 = 'manor';
      if (!pid2) continue;
      (byPlate[pid2] = byPlate[pid2] || []).push(pp2.id);
    }
    for (var pk in byPlate) {
      tourPlates++;
      var ids2 = byPlate[pk], fr = part.frame[pk] || { cx: 720, cy: 450, k: 1 };
      tourRaw += ids2.length;
      var lit = declutterIds(ids2, places, boxOf, { x: fr.cx, y: fr.cy }, fr.k || 1);
      tourLit += lit.length;
      var litSet = {}; for (var li = 0; li < lit.length; li++) litSet[lit[li]] = 1;
      for (var ai = 0; ai < lit.length; ai++) for (var aj = ai + 1; aj < lit.length; aj++) {
        var ba2 = boxOf(lit[ai]), bb2 = boxOf(lit[aj]); if (!ba2 || !bb2) continue;
        tourPairs++; if (overlapRect(ba2, bb2)) tourOverlaps++;
      }
      for (var ti = 0; ti < ids2.length; ti++) {
        var tp = byPlateLookup(places, ids2[ti]);
        if (tp && tp.tier === 1) { tier1raw++; if (litSet[ids2[ti]]) tier1lit++; }
      }
    }
    tourRan = true;
    var tier1ok = tier1raw === 0 || tier1lit >= Math.ceil(tier1raw * 0.6);
    check('CLAIM C — guided-tour district label set: ZERO rendered overlaps (all ' + tourPlates + ' presets)',
      tourOverlaps === 0, '[' + tourOverlaps + ' overlaps / ' + tourPairs + ' pairs · ' + tourLit + '/' + tourRaw + ' labels lit across ' + tourPlates + ' plates]');
    check('CLAIM C′ — the tour declutter is non-trivial (keeps ≥60% of tier-1 anchors)',
      tier1ok, '[' + tier1lit + '/' + tier1raw + ' tier-1 anchors survive]');
  } catch (e) {
    check('CLAIM C — guided-tour district label set: ZERO rendered overlaps',
      false, '[sweep threw: ' + e + ']');
  }

  var passN = 0; for (var k = 0; k < lines.length; k++) if (lines[k].ok) passN++;
  return {
    pass: passN === lines.length, total: lines.length, passed: passN,
    lines: lines,
    restVerdict: restVerdict, restComposite: restComposite,
    fullVerdict: fullVerdict, fullComposite: fullComposite,
    overlaps: overlaps, pairs: pairs,
    tourOverlaps: tourOverlaps, tourPairs: tourPairs, tourPlates: tourPlates,
    tourLit: tourLit, tourRaw: tourRaw, tier1lit: tier1lit, tier1raw: tier1raw
  };
}
function byPlateLookup(places, id) {
  for (var i = 0; i < places.length; i++) if (places[i].id === id) return places[i];
  return null;
}

return {
  footCentre: footCentre,
  overlapRect: overlapRect,
  LOUPE_SCREEN: LOUPE_SCREEN,
  MIN_SCREEN_GAP: MIN_SCREEN_GAP,
  revealedSet: revealedSet,
  declutterIds: declutterIds,
  CLEAN: CLEAN,
  crowdedCorpus: crowdedCorpus,
  runDoorClaims: runDoorClaims
};
})();

/* browser global (forge-inlined): attach as `DoorClaims`. */
(function (root) {
  if (root) root.DoorClaims = DoorClaims;
})(typeof globalThis !== 'undefined' ? globalThis : this);

// dual-use module guard (forge strips exactly this braced single line)
if (typeof module !== 'undefined' && module.exports) { module.exports = DoorClaims; }
