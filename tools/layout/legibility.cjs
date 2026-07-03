/* ════════════════════════════════════════════════════════════════════════════
   legibility.cjs — the Workshop estate-plan's automated LEGIBILITY CONSCIENCE.

   The Layout engine GUARANTEES the structural mechanics (no footprint stacks, no
   star collision, every room reachable). What it does NOT guarantee is that the
   LABELS — the room names + sub-lines + leaders that a human actually reads — stay
   legible once a district fills up. This module is the conscience for that: it
   MODELS each placed POI's label box + leader from the declarations, then scores
   how crowded the result reads, BEFORE a human ever screenshots the plate.

   ── WHAT IT MEASURES — THREE SUB-SCORES OVER ONE SHARED LABEL MODEL ──
     1. gapSubScore     — pairwise gap between every label box and every other
                          label box / non-owner footprint (the most direct signal).
     2. leaderClutter   — leader-line CROSSINGS + footprint INTRUSIONS (corroborating
                          structural clutter the pairwise gap can't see).
     3. densitySubScore — per-district Gaussian kernel density over claim centroids
                          (the regional "this corner is packed" signal).
   A weighted blend (gap dominant) → ONE composite per district + overall, against a
   single threshold DERIVED from clean/crowded controls (see THRESHOLD below).

   ── HONEST BOUND: A MODELED-LABEL PROXY, NOT RENDERED PIXELS (#103) ──
   We model each label from the prefer-seed START slot, not the annealed render —
   a crowding PROXY (#103); it measures the PRESSURE that forces labels into
   competition, not pixel-exact overlap. The annealer then relieves some of that
   pressure by flipping sides; the proxy deliberately reads the pre-anneal demand,
   which is the quantity a [map] re-draw must reduce at the source (region budgets,
   wing sub-anchors, room counts) — annealing can only paper over so much.

   ── CALIBRATED TUNABLES ("writ in water" — re-measure if the type scale changes) ──
   CHAR_W_NAME 8.4  px/char of the roomname  (16.5px serif .roomname — measured getBBox)
   CHAR_W_SUB  6.8  px/char of the sub-line   (9px mono .roomsub    — measured getBBox)
   In 35/36 placed POIs the UPPERCASE sub-line ("PIECE · tag") is the WIDER line and
   therefore drives boxW; the roomname drives it only for the few very short subs.
   BOX_H_BASE 35 / BOX_H_COMPANION 50  the typeset block height (name+rule+sub, +the
   "↳ companion within" line when present), pre-PAD. PAD = LABEL_PAD = 3 (the dark
   backing-stroke halo index.src.html inflates by on every side).

   ── COMPOSITE WEIGHTS + THRESHOLD DERIVATION ──
   composite = 0.5*gap + 0.3*density + 0.2*leader.
     gap is dominant — it is the most direct legibility signal (can I read this label
       without it touching that one?).
     density is regional corroboration (is this whole corner packed?).
     leader is structural corroboration (do the leaders cross / stab footprints?).
   The THRESHOLD is derived AFTER the weights are fixed, from the shared control
   corpus: the clean-positive control (6 rooms, 1/district, spread) composites to ~0,
   and the crowded-negative control (12 rooms in one wing) composites high. THRESHOLD
   = 0.30 sits with margin between them (clean << 0.30 << crowded). The test asserts
   this derivation: clean PASSES and crowded FAILS with the controls' actual numbers.

   ── EXIT-CODE POLICY (why smoke.cjs reports legibility as a WARNING, not exit-1) ──
   The LIVE 37-POI front door is EXPECTED to FAIL the legibility threshold — that red
   is the HONEST, INTENDED confirmation of #103 in code, the very pressure a pending
   [map] re-draw must relieve. If it tripped smoke.cjs's structural exit code, every
   unrelated cycle's CI would break on a known-open issue. So smoke.cjs prints the
   legibility verdict + heat-map as its OWN clearly-labelled WARNING section and
   leaves the structural exit code untouched. The legibility regression guard lives
   in legibility.test.cjs (exit 0 on the controls), not in smoke's door scan.

   Node-pure, zero external deps. The ONE thing it `require`s is the repo's own
   engines — layout.js (FIELD, the solve) and label/label.js (the renderer's EXACT
   slotTopLeft + nearestEdgePoint geometry) — so the modeled box+leader provably
   cannot drift from index.src.html's applyPlacement (index.src.html:2033-2052).
   ════════════════════════════════════════════════════════════════════════════ */
'use strict';

/* ── DUAL-USE WIRING (Node require · forge-inlined browser global) ───────────
   In Node this module `require`s the repo's own engines. When forge inlines it
   into index.html, `require`/`module` are absent — but layout.js + label/label.js
   are inlined ABOVE this block and have already attached the `Layout` /
   `LabelPlacer` globals, so we resolve from those instead. The IIFE returns the
   exports object; the `globalThis` block attaches it as the `Legibility` global
   for the page; the strippable guard at the very bottom keeps Node's
   `require('./legibility.cjs')` working (forge drops exactly that braced line). */
var Legibility = (function () {
'use strict';
// Browser default: read the globals the inlined layout.js / label.js attached above.
var Layout = (typeof globalThis !== 'undefined') ? globalThis.Layout : null;
var LabelPlacer = (typeof globalThis !== 'undefined') ? globalThis.LabelPlacer : null;
// Node override (forge strips exactly this braced single line from the browser inline):
if (typeof module !== 'undefined' && module.exports) { Layout = require('./layout.js'); LabelPlacer = require('../label/label.js'); }
var geom = LabelPlacer.geom;

/* ── calibrated tunables (see header) ─────────────────────────────────────── */
const CHAR_W_NAME = 8.4;   // px/char, 16.5px serif .roomname  (measured getBBox)
const CHAR_W_SUB = 6.8;    // px/char, 9px mono .roomsub        (measured getBBox)
const BOX_H_BASE = 35;     // name + kicker rule + sub-line block height (pre-PAD)
const BOX_H_COMPANION = 50;// + the "↳ companion within" line
const BOX_H_NAME = 18;     // NAME-ONLY block height (just the 16.5px serif name line, no sub)
const PAD = 3;             // LABEL_PAD — the backing-stroke halo (index.src.html:2004)
const LABEL_GAP = 14;      // LABEL_GAP (index.src.html:2000) — leader breathing room
// §1.7 — DERIVED from the solved world (viewBox inset 46/52), read from Layout so the
// conscience and the page share one source of truth. Fallback = the old frozen bounds
// (only if Layout hasn't attached its world yet — never in Node or the forged page).
const LABEL_BOUNDS = (Layout && Layout.LABEL_BOUNDS) || { x: 46, y: 52, w: 1348, h: 790 };
const LABEL_SEED = 0x5EED; // LABEL_SEED (index.src.html:3504) — the placeLabels solver seed

/* composite weights + derived threshold (see header) */
const WEIGHTS = { gap: 0.5, density: 0.3, leader: 0.2 };
const THRESHOLD = 0.30;

/* density kernel params (the PROVEN facet-3 backbone — preserve exactly) */
const DENSITY_H = 64;      // Gaussian bandwidth in viewBox units (~3 label heights)
const DENSITY_K = 3.0;     // saturating scale: peak~3 (a 4-clump) → sub~0.5

/* leader-clutter scale */
const LEADER_K = 4.0;      // raw clutter → sub via 1-exp(-raw/K)
const LEADER_EPS = 1.5;    // footprint inset for intrusion test (avoid edge-grazes)

/* ── geometry helpers ─────────────────────────────────────────────────────── */
function footBBox(f) {
  // mirror index.src.html footBBox: a tower carries {x,y,r}; a room {x,y,w,h}.
  return f.r != null ? { x: f.x - f.r, y: f.y - f.r, w: f.r * 2, h: f.r * 2 }
                     : { x: f.x, y: f.y, w: f.w, h: f.h };
}
function footCentre(f) {
  // mirror index.src.html footCentre: tower → its centre; room → its mid.
  return f.r != null ? { x: f.x, y: f.y } : { x: f.x + f.w / 2, y: f.y + f.h / 2 };
}
/* gap (clear distance) between two AABBs; 0 if they touch/overlap. */
function rectGap(a, b) {
  const dx = Math.max(0, Math.max(a.x - (b.x + b.w), b.x - (a.x + a.w)));
  const dy = Math.max(0, Math.max(a.y - (b.y + b.h), b.y - (a.y + a.h)));
  if (dx === 0 && dy === 0) return 0; // overlapping or edge-touching
  return Math.sqrt(dx * dx + dy * dy);
}
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}
/* clamp a box into LABEL_BOUNDS the same way the FIELD-clamp pattern does. */
function clampToBounds(box) {
  const B = LABEL_BOUNDS;
  return {
    x: Math.max(B.x, Math.min(box.x, B.x + B.w - box.w)),
    y: Math.max(B.y, Math.min(box.y, B.y + B.h - box.h)),
    w: box.w, h: box.h
  };
}

/* ════════════════════════════════════════════════════════════════════════════
   1. THE ONE SHARED LABEL MODEL — every facet consumes THIS, never its own.
   buildLabelModel(places, solution) → { boxes:[...], footMeta:{id→{district}} }
   Each box: { id, district, box:{x,y,w,h}, side, anchor:{x,y}, foot, leader:{...} }
   ════════════════════════════════════════════════════════════════════════════ */
function preferSide(r) {
  const p = r.prefer;
  if (Array.isArray(p)) return p[0] || 'right';
  return p || 'right';
}
function subLen(r) {
  // the sub-line is the UPPERCASE "PIECE · tag" (index.src.html:1701). It drives
  // width in 35/36 placed POIs. Fall back to the id for synthetic controls.
  const piece = (r.piece || r.room || r.id || '').toUpperCase();
  const tag = r.tag || '';
  return tag ? (piece + ' · ' + tag).length : piece.length;
}
function nameLen(r) { return (r.room || r.id || '').length; }

/* ── THE LABEL BOX-{w,h} MODEL (single source) ────────────────────────────────
   The modeled width/height of a POI's rendered label group, from the calibrated
   CHAR_W type scale (header). This is the ONE place the box dims are derived; both
   buildLabelModel (the conscience) AND tools/layout/door.test.cjs (the door pill's
   Node twin, which models the SOLVED boxes the loupe declutter runs on) call it, so
   the modeled box can never drift between the two. The model is calibrated against
   the live getBBox truth — see door.test.cjs's checked-in MIRROR + its calibration
   guard (modeled ≈ rendered within a documented tolerance). opts.nameOnly drops the
   UPPERCASE "PIECE · tag" sub-line (the plate-view name-only model, #262). */
function labelBoxWH(r, opts) {
  opts = opts || {};
  const nameOnly = !!opts.nameOnly;
  const w = nameOnly
    ? nameLen(r) * CHAR_W_NAME + 2 * PAD
    : Math.max(nameLen(r) * CHAR_W_NAME, subLen(r) * CHAR_W_SUB) + 2 * PAD;
  const h = nameOnly
    ? BOX_H_NAME + 2 * PAD
    : (r.companion ? BOX_H_COMPANION : BOX_H_BASE) + 2 * PAD;
  return { w, h };
}

/* ── THE MODELED SOLVED-BOX MAP (single source — the door pill's CLAIM C′ + the twins) ──
   modelSolvedBoxes(places, layout) → Map(id → {x,y,w,h}) : the DETERMINISTIC, browserless
   model of the front door's SOLVED label boxes. It reproduces index.src.html placeLabels()
   PASS 1 EXACTLY — the SAME footprints + FURNITURE + gnomon-HUD furniture + engraved zone-
   caption obstacles, the SAME LabelPlacer.solve over the SAME seed with the positions:8→4
   fallback — but feeds the solver the calibrated CHAR_W box dims (labelBoxWH) INSTEAD of the
   browser's live getBBox text widths. So unlike the page's runtime SOLVED map (whose box
   {w,h} come from getBBox font rasterization, and whose annealed POSITIONS therefore wobble
   by viewport/DPI), this map is a pure function of the DECLARATIONS + the layout — IDENTICAL
   at every viewport. It is the box-source the door pill's CLAIM C′ non-triviality invariant
   scores against (a layout property, not a render artifact), and the SAME map tools/layout/
   door.test.cjs + fold.test.cjs build, so the live pill and the node twins agree by
   construction. (CLAIM B + the rest/full composites + CLAIM C's overlap sweep still read the
   LIVE getBBox boxes — they measure rendered reality; only C′'s invariant reads this model.)

   `places` carries the canonical solved footprints (x/y/w/h|r), exactly as placeLabels reads
   them after copying layout.foot onto PLACES. `opts.furniture` is the page's static FURNITURE
   obstacle list (the door pill + the twins pass index.src.html's FURNITURE) — the gnomon HUD +
   the engraved zone captions are derived deterministically inside, so the model never depends on
   a runtime-populated array. Pure; no DOM; same output in Node + browser. */
function modelSolvedBoxes(places, layout, opts) {
  opts = opts || {};
  const placed = places.filter(p => !p.locked && layout.foot && layout.foot[p.id]);
  // obstacles = footprints + the static FURNITURE + the gnomon HUD furniture + the engraved
  // zone-caption boxes — reproduced from the page's OWN derivation (placeLabels + the gnomon
  // HUD push). The page seeds FURNITURE/HUD/zone identically; we rebuild HUD + zone here
  // deterministically so the model never depends on a runtime-populated array.
  const footObstacles = placed.map(p => footBBox(p));
  const FURNITURE = opts.furniture || [];
  const HOURS_FURNITURE = [];
  const gnomon = places.find(p => p.id === 'gnomon');
  if (gnomon && layout.foot && layout.foot.gnomon) {
    const GX = gnomon.x + gnomon.w / 2, GY = gnomon.y + gnomon.h / 2, DIAL_R = 30;
    const hudY = GY - (DIAL_R + 18);
    HOURS_FURNITURE.push({ x: GX - 170, y: hudY - 13, w: 340, h: 30 });        // clock+phase
    HOURS_FURNITURE.push({ x: GX - 95, y: GY + DIAL_R + 30, w: 190, h: 14 });  // self-test pill
  }
  const zoneObstacles = (layout.districtRects || []).map(d => {
    const labelW = d.label.length * 6.4;
    return { x: d.x + d.w / 2 - labelW / 2, y: d.y - 17, w: labelW, h: 15 };
  });
  const obstacles = footObstacles.concat(FURNITURE).concat(HOURS_FURNITURE).concat(zoneObstacles);

  const features = placed.map(r => {
    const wh = labelBoxWH(r);
    const f = { id: r.id, anchor: footCentre(r), label: { w: wh.w, h: wh.h }, gap: labelGapOf(r) };
    const pref = preferSideList(r); if (pref) f.prefer = pref;
    if (r.pin) f.pin = r.pin;
    return f;
  });
  const spec = { bounds: LABEL_BOUNDS, features, obstacles, seed: LABEL_SEED };
  let res = LabelPlacer.solve(Object.assign({ positions: 8 }, spec));
  if (res.overlaps > 0) {
    const alt = LabelPlacer.solve(Object.assign({ positions: 4 }, spec));
    if (alt.overlaps < res.overlaps) res = alt;
  }
  const solved = new Map();
  res.placements.forEach(p => solved.set(p.id, { x: p.label.x, y: p.label.y, w: p.label.w, h: p.label.h }));
  return solved;
}
/* the per-feature gap + prefer-list helpers placeLabels uses (labelGap / preferList). The seat
   side is irrelevant — the solver picks the slot; we only need the gap + prefer hints to match. */
function labelGapOf(r) { const b = footBBox(r); return Math.max(b.w, b.h) / 2 + LABEL_GAP; }
function preferSideList(r) { return r.prefer ? (Array.isArray(r.prefer) ? r.prefer.slice() : [r.prefer]) : undefined; }

function buildLabelModel(places, solution, opts) {
  opts = opts || {};
  // NAME-ONLY mode (the PLATE self-test): drop the UPPERCASE "PIECE · tag" sub-line
  // and model only the room NAME line. The sub-line is the reward-on-arrival shown
  // under the loupe/blurb, never at-a-glance in the plate view — so the plate's
  // at-a-glance legibility is scored against name-only label boxes (#262).
  const nameOnly = !!opts.nameOnly;
  const boxes = [];
  const footMeta = {};
  // index places by id so a box can recover its declaration (companion, prefer).
  const byId = {};
  for (const r of places) byId[r.id] = r;

  for (const r of places) {
    const f = solution.foot[r.id];
    if (!f) continue; // locked/undercroft (not in sol.foot) and any unplaced id
    footMeta[r.id] = { district: r.district };

    // ── box dims from the MEASURED model (header), via the single-source helper ──
    const wh = labelBoxWH(r, { nameOnly });
    const boxW = wh.w, boxH = wh.h;

    // ── seat the box with the RENDERER'S OWN geometry ──
    // a relayed plate may carry a deterministic per-room `relaySide` (the L/R fan the
    // re-lay assigns so name-only labels never collide); else the prefer-seed start.
    const side = r.relaySide || preferSide(r);          // the solver's START slot
    const anchor = footCentre(f);
    const fb = footBBox(f);
    const gap = Math.max(fb.w, fb.h) / 2 + LABEL_GAP;   // labelGap(r), index.src.html:2073
    const tl = geom.slotTopLeft(anchor, boxW, boxH, gap, side);
    const box = clampToBounds({ x: tl.x, y: tl.y, w: boxW, h: boxH });
    box.id = r.id; box.district = r.district;

    // ── leader segment, mirroring applyPlacement EXACTLY (index.src.html:2047-2048) ──
    const lend = geom.nearestEdgePoint(anchor.x, anchor.y, box);     // on the label
    const fstart = geom.nearestEdgePoint(lend[0], lend[1], fb);       // on the footprint
    const leader = { x0: fstart[0], y0: fstart[1], x1: lend[0], y1: lend[1] };

    boxes.push({ id: r.id, district: r.district, box, side, anchor, foot: fb, leader });
  }
  return { boxes, footMeta, byId };
}

/* ════════════════════════════════════════════════════════════════════════════
   2a. FACET 1 — gapSubScore: pairwise label↔label + label↔non-owner-footprint.
   Quadratic penalty pinned 1 on overlap; folded by worst-K soft-max.
   ════════════════════════════════════════════════════════════════════════════ */
function gapSubScore(boxes, MARGIN) {
  const pen = g => (g >= MARGIN ? 0 : Math.pow(1 - g / MARGIN, 2));
  const penalties = [];
  let minGap = Infinity;
  const offenders = [];

  for (let i = 0; i < boxes.length; i++) {
    const A = boxes[i];
    // label ↔ every OTHER label
    for (let j = i + 1; j < boxes.length; j++) {
      const B = boxes[j];
      const g = rectsOverlap(A.box, B.box) ? 0 : rectGap(A.box, B.box);
      if (g < minGap) minGap = g;
      const p = rectsOverlap(A.box, B.box) ? 1 : pen(g);
      if (p > 0) {
        penalties.push(p);
        if (p > 0.25) offenders.push({ a: A.id, b: B.id, gap: +g.toFixed(1), kind: 'label-label' });
      }
    }
    // label ↔ non-owner footprint (exclude A's OWN footprint via owner id)
    for (let k = 0; k < boxes.length; k++) {
      if (k === i) continue;            // skip own footprint
      const fb = boxes[k].foot;
      const g = rectsOverlap(A.box, fb) ? 0 : rectGap(A.box, fb);
      const p = rectsOverlap(A.box, fb) ? 1 : pen(g);
      if (p > 0) {
        penalties.push(p);
        if (p > 0.25) offenders.push({ a: A.id, b: boxes[k].id, gap: +g.toFixed(1), kind: 'label-foot' });
      }
    }
  }

  if (!penalties.length) return { score: 0, minGap: isFinite(minGap) ? +minGap.toFixed(1) : null, offenders: [] };
  penalties.sort((p, q) => q - p); // descending
  const K = Math.max(4, Math.ceil(boxes.length * 0.15));
  const top = penalties.slice(0, K);
  const score = top.reduce((s, p) => s + p, 0) / top.length;
  offenders.sort((p, q) => p.gap - q.gap);
  return { score, minGap: isFinite(minGap) ? +minGap.toFixed(1) : null, offenders: offenders.slice(0, 8) };
}

/* ════════════════════════════════════════════════════════════════════════════
   2b. FACET 2 — leaderClutter: proper segment crossings + footprint intrusions.
   The exact-integer crossing counter is this facet's falsifiable crux.
   ════════════════════════════════════════════════════════════════════════════ */
/* Proper crossing of segments p1→p2 and p3→p4: strict interior intersection
   (0<t<1 AND 0<u<1). Segments that share an endpoint do NOT count (sibling stubs
   that fan out from one wing centre are expected, not clutter). */
function segmentsCross(p1, p2, p3, p4) {
  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
  if (Math.abs(d) < 1e-12) return false;            // parallel / collinear
  const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
  const u = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;
  const EPS = 1e-9;
  return t > EPS && t < 1 - EPS && u > EPS && u < 1 - EPS;
}
function sharesEndpoint(s1, s2) {
  const eq = (ax, ay, bx, by) => Math.abs(ax - bx) < 1e-6 && Math.abs(ay - by) < 1e-6;
  return eq(s1.x0, s1.y0, s2.x0, s2.y0) || eq(s1.x0, s1.y0, s2.x1, s2.y1) ||
         eq(s1.x1, s1.y1, s2.x0, s2.y0) || eq(s1.x1, s1.y1, s2.x1, s2.y1);
}
/* count proper crossings among a list of segments (excluding shared-endpoint pairs). */
function countCrossings(segs) {
  let n = 0;
  for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) {
    const a = segs[i], b = segs[j];
    if (sharesEndpoint(a, b)) continue;
    if (segmentsCross({ x: a.x0, y: a.y0 }, { x: a.x1, y: a.y1 },
                      { x: b.x0, y: b.y0 }, { x: b.x1, y: b.y1 })) n++;
  }
  return n;
}
/* Liang-Barsky: does segment (x0,y0)-(x1,y1) clip the inset rect? (interior hit) */
function segIntersectsRect(x0, y0, x1, y1, rect, eps) {
  eps = eps || 0;
  const xmin = rect.x + eps, xmax = rect.x + rect.w - eps;
  const ymin = rect.y + eps, ymax = rect.y + rect.h - eps;
  if (xmax <= xmin || ymax <= ymin) return false; // rect smaller than 2*eps
  let t0 = 0, t1 = 1;
  const dx = x1 - x0, dy = y1 - y0;
  const p = [-dx, dx, -dy, dy];
  const q = [x0 - xmin, xmax - x0, y0 - ymin, ymax - y0];
  for (let i = 0; i < 4; i++) {
    if (Math.abs(p[i]) < 1e-12) { if (q[i] < 0) return false; }
    else {
      const r = q[i] / p[i];
      if (p[i] < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
      else { if (r < t0) return false; if (r < t1) t1 = r; }
    }
  }
  return t0 < t1;
}
function leaderClutter(model, solution) {
  const segs = model.boxes.map(b => b.leader);
  // add graph stubs + aisles (exclude spine / avenues — those are the main roads).
  if (solution && solution.graph) {
    for (const s of (solution.graph.stubs || [])) segs.push({ x0: s.x0, y0: s.y0, x1: s.x1, y1: s.y1 });
    for (const a of (solution.graph.aisles || [])) segs.push({ x0: a.x0, y0: a.y0, x1: a.x1, y1: a.y1 });
  }
  const crossings = countCrossings(segs);

  // intrusions: each LEADER vs every NON-owner footprint (a leader stabbing a
  // building it doesn't belong to reads as clutter).
  let intrusions = 0;
  const byDistrict = {};
  const offenders = [];
  for (const lb of model.boxes) {
    byDistrict[lb.district] = byDistrict[lb.district] || { crossings: 0, intrusions: 0 };
    for (const other of model.boxes) {
      if (other.id === lb.id) continue;          // exclude OWN footprint
      if (segIntersectsRect(lb.leader.x0, lb.leader.y0, lb.leader.x1, lb.leader.y1, other.foot, LEADER_EPS)) {
        intrusions++;
        byDistrict[lb.district].intrusions++;
        offenders.push({ leader: lb.id, stabs: other.id, kind: 'intrusion' });
      }
    }
  }
  const raw = 1.0 * crossings + 0.6 * intrusions;
  const score = 1 - Math.exp(-raw / LEADER_K);
  return { score, crossings, intrusions, byDistrict, offenders: offenders.slice(0, 8) };
}

/* ════════════════════════════════════════════════════════════════════════════
   2c. FACET 3 — densitySubScore: per-district Gaussian kernel peak (PROVEN).
   This is the only facet with a verified prototype — preserve the exact math.
   ════════════════════════════════════════════════════════════════════════════ */
function claimCentroid(b) {
  // the label box is what collides; weight the claim to the label centre.
  return { id: b.id, x: b.box.x + b.box.w / 2, y: b.box.y + b.box.h / 2 };
}
function districtDensity(boxes) {
  // boxes are all the placed labels of ONE district.
  if (boxes.length < 2) return { peak: 0, sub: 0, hottest: null };
  const cs = boxes.map(claimCentroid);
  let peak = 0, hottest = null;
  for (const a of cs) {
    let pressure = 0;
    for (const b of cs) {
      if (a.id === b.id) continue;
      const dx = a.x - b.x, dy = a.y - b.y;
      pressure += Math.exp(-(dx * dx + dy * dy) / (DENSITY_H * DENSITY_H));
    }
    if (pressure > peak) { peak = pressure; hottest = a.id; }
  }
  const sub = 1 - Math.exp(-peak / DENSITY_K);
  return { peak: +peak.toFixed(2), sub, hottest };
}
function densitySubScore(boxes) {
  // group boxes by district, score each, roll up = MAX over districts.
  const byD = {};
  for (const b of boxes) (byD[b.district] = byD[b.district] || []).push(b);
  const districts = [];
  for (const d of Object.keys(byD)) {
    const dd = districtDensity(byD[d]);
    districts.push({ district: d, n: byD[d].length, peak: dd.peak, sub: dd.sub, hottest: dd.hottest });
  }
  let max = 0;
  for (const d of districts) if (d.sub > max) max = d.sub;
  districts.sort((a, b) => b.sub - a.sub);
  return { score: max, districts };
}

/* ════════════════════════════════════════════════════════════════════════════
   3. THE COMPOSITE + THRESHOLD — integrator-owned.
   score(solution, places) → report
   ════════════════════════════════════════════════════════════════════════════ */
function compositeOf(gap, density, leader) {
  return WEIGHTS.gap * gap + WEIGHTS.density * density + WEIGHTS.leader * leader;
}

/* downsample the real claim centroids into a COLS×ROWS Gaussian-density grid over
   the FIELD, so renderAscii(report) can shade WHERE the crowding is and still be a
   PURE function of the report (the grid travels in report.plate). Shade level is
   the kernel-density peak at each cell, normalized to the grid's own max so contrast
   always reads — the hottest corner is darkest, open ground is blank. */
function buildPlate(model, COLS, ROWS) {
  // §1.7 — the density-grid ASCII shades over the whole solved plate (the world IS the
  // field now; the old star-clear FIELD envelope retired). Display-only: never scores.
  const F = Layout.FIELD || (Layout.world ? { x: 0, y: 0, w: Layout.world.W, h: Layout.world.H } : { x: 0, y: 0, w: 1440, h: 900 });
  const cs = model.boxes.map(b => ({ x: b.box.x + b.box.w / 2, y: b.box.y + b.box.h / 2 }));
  const grid = [];
  let gmax = 0;
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const px = F.x + (c + 0.5) / COLS * F.w;
      const py = F.y + (r + 0.5) / ROWS * F.h;
      let v = 0;
      for (const cen of cs) {
        const dx = px - cen.x, dy = py - cen.y;
        v += Math.exp(-(dx * dx + dy * dy) / (DENSITY_H * DENSITY_H));
      }
      row.push(v);
      if (v > gmax) gmax = v;
    }
    grid.push(row);
  }
  // normalize to the grid's own peak (contrast); if empty, leave flat.
  if (gmax > 0) for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) grid[r][c] /= gmax;
  return { cols: COLS, rows: ROWS, cells: grid };
}

function score(solution, places, opts) {
  const scale = 1; // viewBox units (the FIELD is in the same units as LABEL_GAP)
  const MARGIN = Math.round(scale * LABEL_GAP * 0.9); // 13px
  const model = buildLabelModel(places, solution, opts);

  const gapR = gapSubScore(model.boxes, MARGIN);
  const leaderR = leaderClutter(model, solution);
  const densR = densitySubScore(model.boxes);

  // ── per-district composite ──
  // gap + leader are global signals; attribute them per district by re-scoring
  // each district's own label subset so a district composite is self-contained.
  const byD = {};
  for (const b of model.boxes) (byD[b.district] = byD[b.district] || []).push(b);
  const dDens = {};
  for (const d of densR.districts) dDens[d.district] = d;

  const districts = [];
  for (const d of Object.keys(byD)) {
    const subset = byD[d];
    const g = gapSubScore(subset, MARGIN).score;
    const l = leaderClutter({ boxes: subset, footMeta: model.footMeta }, null).score;
    const dn = (dDens[d] || {}).sub || 0;
    districts.push({
      district: d, n: subset.length,
      gap: +g.toFixed(3), density: +dn.toFixed(3), leader: +l.toFixed(3),
      composite: +compositeOf(g, dn, l).toFixed(3)
    });
  }
  districts.sort((a, b) => b.composite - a.composite);

  // ── overall composite (whole-plate sub-scores, gap dominant) ──
  const composite = +compositeOf(gapR.score, densR.score, leaderR.score).toFixed(3);
  const pass = composite < THRESHOLD;

  // ── hotspot reconciliation: COUNT-hottest vs PRESSURE-hottest ──
  let countHottest = null, maxN = -1;
  for (const d of densR.districts) if (d.n > maxN) { maxN = d.n; countHottest = { district: d.district, n: d.n }; }
  const pressureHottest = districts.length
    ? { district: districts[0].district, composite: districts[0].composite }
    : null;

  const header = 'modeled labels from the prefer-seed start slot, not the annealed ' +
    'render — a crowding PROXY (#103); measures the pressure that forces labels into ' +
    'competition, not pixel-exact overlap.';

  return {
    header,
    threshold: THRESHOLD,
    weights: WEIGHTS,
    plate: buildPlate(model, 48, 18),
    overall: {
      composite,
      verdict: pass ? 'LEGIBLE' : 'CROWDED',
      gap: +gapR.score.toFixed(3),
      density: +densR.score.toFixed(3),
      leader: +leaderR.score.toFixed(3),
      crossings: leaderR.crossings,
      intrusions: leaderR.intrusions,
      minGap: gapR.minGap,
      pressureHottest, countHottest
    },
    districts,
    densityDistricts: densR.districts,
    offenders: {
      gap: gapR.offenders,
      leader: leaderR.offenders
    },
    pass
  };
}

/* ════════════════════════════════════════════════════════════════════════════
   5. renderAscii(report) — the terminal estate-plan heat-map (PURE, testable).
   Shades report.plate (the FIELD downsampled to a kernel-density grid over the
   real claim centroids), then a footer = districts sorted by composite + the
   verdict + the proxy-honesty header. Takes ONLY the report — no solution, no
   Layout call — so it is a pure function and trivially unit-tested.
   ════════════════════════════════════════════════════════════════════════════ */
function renderAscii(report) {
  const SHADE = ' ·:+*#@';
  const plate = report.plate || { cols: 48, rows: 18, cells: [] };
  const COLS = plate.cols, ROWS = plate.rows;
  const lines = [];
  const sky = '═'.repeat(COLS);
  lines.push('┌' + sky + '┐');
  for (let r = 0; r < ROWS; r++) {
    let row = '│';
    const cells = plate.cells[r] || [];
    for (let c = 0; c < COLS; c++) {
      const v = cells[c] || 0; // normalized 0..1 (peak = 1)
      const idx = Math.max(0, Math.min(SHADE.length - 1, Math.round(v * (SHADE.length - 1))));
      row += SHADE[idx];
    }
    row += '│';
    lines.push(row);
  }
  lines.push('└' + sky + '┘');

  // footer: districts sorted by composite + the verdict line + the proxy header.
  const ds = report.districts.slice().sort((a, b) => b.composite - a.composite);
  const ph = (report.overall.pressureHottest || {}).district;
  const ch = (report.overall.countHottest || {}).district;
  lines.push('');
  lines.push('  DISTRICT      n    gap   dens  lead  COMPOSITE');
  for (const d of ds) {
    let flag = '';
    if (d.district === ph) flag += ' ◆ pressure-hottest';
    if (d.district === ch) flag += (flag ? ' +' : ' ') + 'count-hottest';
    lines.push('  ' + d.district.padEnd(12) +
      String(d.n).padStart(3) + '  ' +
      d.gap.toFixed(3) + ' ' + d.density.toFixed(3) + ' ' + d.leader.toFixed(3) + '   ' +
      d.composite.toFixed(3) + flag);
  }
  lines.push('');
  const o = report.overall;
  const chL = o.countHottest ? (o.countHottest.district + ' (n=' + o.countHottest.n + ')') : '—';
  const phL = o.pressureHottest ? (o.pressureHottest.district + ' (composite=' + o.pressureHottest.composite + ')') : '—';
  lines.push('  count-hottest:    ' + chL + '   (worst by raw room count)');
  lines.push('  pressure-hottest: ' + phL + '   (worst by what a viewer sees)');
  lines.push('  OVERALL composite ' + o.composite.toFixed(3) +
    '  vs threshold ' + report.threshold +
    '  →  ' + o.verdict + (report.pass ? '  ✓' : '  ✗'));
  lines.push('  (' + report.header + ')');
  return lines.join('\n');
}

return {
  score,
  buildLabelModel,
  labelBoxWH,          // the single-source box-{w,h} model (the door twin calibrates against it)
  modelSolvedBoxes,    // the single-source DETERMINISTIC modeled SOLVED-box map (CLAIM C′ invariant)
  gapSubScore,
  leaderClutter,
  densitySubScore,
  renderAscii,
  // geometry crux exposed for the falsifiable unit tests:
  segmentsCross,
  sharesEndpoint,
  countCrossings,
  segIntersectsRect,
  rectGap,
  // tunables (so tests can assert the threshold derivation):
  WEIGHTS, THRESHOLD, LABEL_GAP, LABEL_BOUNDS, LABEL_SEED,
  CHAR_W_NAME, CHAR_W_SUB, PAD, DENSITY_H, DENSITY_K, BOX_H_NAME, BOX_H_BASE, BOX_H_COMPANION
};
})();

/* browser global (forge-inlined): attach the conscience as `Legibility`. */
(function (root) {
  if (root) root.Legibility = Legibility;
})(typeof globalThis !== 'undefined' ? globalThis : this);

// dual-use module guard (forge strips exactly this braced single line)
if (typeof module !== 'undefined' && module.exports) { module.exports = Legibility; }
