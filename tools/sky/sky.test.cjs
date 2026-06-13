#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   sky.test.cjs — Node self-test for tools/sky/sky.js (the workshop's "a self-test
   proves it" promise). Run:  node tools/sky/sky.test.cjs

   No deps. Requires the UNSTRIPPED module headlessly (it exports `Sky` via the
   CommonJS guard) and asserts the five load-bearing properties of the pure core:

     (1) DETERMINISM + ORDER-INDEPENDENCE — state() of the same visit-set is byte
         stable, and is identical no matter the order the ids were visited.
     (2) MONOTONICITY — a SUPERSET of visits ⇒ a SUPERSET of lit stars / line
         points / completed asterisms (a feature, once on, is never removed).
     (3) COMPLETION-IFF — for every asterism, complete === members.every(visited),
         swept over a battery including each member-minus-one (NO false completion)
         and the full set; allComplete <=> the capstone condition.
     (4) CATALOG INTEGRITY — every star position lies INSIDE the 1440×900 viewBox
         AND OUTSIDE every footprint bbox, the plan furniture, and the manor pool.
     (5) BIJECTION — every front-door PLACES id maps to exactly one catalog star;
         every wing member is a unique catalog id belonging to exactly one wing
         (no orphan, no dupe).

   Prints "sky self-test: N/N PASS"; exits non-zero on any failure.
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const Sky = require('./sky.js');
const CATALOG = Sky.CATALOG;
const WINGS = Sky.WINGS;

/* ── tiny assert harness ──────────────────────────────────────────────────── */
let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.error('  ✗ FAIL: ' + label); }
}
function eq(a, b, label) {
  ok(a === b, label + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')');
}

/* ── geometry: the front-door footprint bboxes + plan furniture + manor pool ──
   Mirrors index.src.html's PLACES footprints (footBBox) and FURNITURE, plus the
   manor candle-pool rect. A star must lie inside the viewBox and outside all. */
const VIEWBOX = { x: 0, y: 0, w: 1440, h: 900 };
const FOOTPRINTS = [
  { id: 'verse',          x: 600,  y: 312, w: 112, h: 84 },
  { id: 'compositor',     x: 730,  y: 312, w: 112, h: 84 },
  { id: 'cartographer',   x: 600,  y: 408, w: 112, h: 84 },
  { id: 'sound-garden',   x: 730,  y: 408, w: 112, h: 84 },
  { id: 'threshold',      x: 856,  y: 332, w: 74,  h: 136 },
  { id: 'strange-garden', x: 266,  y: 560, w: 188, h: 118 },
  { id: 'firmament',      x: 224,  y: 162, w: 152, h: 152 }, // tower r=76 → bbox
  { id: 'daedalus',       x: 1044, y: 542, w: 178, h: 152 },
  { id: 'arcade',         x: 1018, y: 244, w: 224, h: 88 },
  { id: 'workbench',      x: 540,  y: 602, w: 156, h: 100 },
  { id: 'undercroft',     x: 702,  y: 524, w: 38,  h: 50 }
];
const FURNITURE = [
  { id: 'compass',      x: 74,   y: 82,  w: 92,  h: 92 },
  { id: 'scalebar',     x: 1086, y: 798, w: 212, h: 52 },
  { id: 'cartouche',    x: 100,  y: 686, w: 384, h: 148 },
  { id: 'zone-manor',   x: 631,  y: 252, w: 180, h: 18 },
  { id: 'zone-grounds', x: 1057, y: 140, w: 124, h: 18 }
];
const MANOR_POOL = { id: 'manor-pool', x: 421, y: 150, w: 600, h: 600 };
/* a star is drawn as a tiny disc; we clear every obstacle by this half-extent so
   a kindled star never touches a footprint/furniture edge. */
const STAR_PAD = 12;

/* the front-door PLACES ids (the visible POIs + the gated cellar stair) — must
   each map to exactly one catalog star (the BIJECTION half that ties to the map). */
const PLACES_IDS = [
  'verse', 'compositor', 'cartographer', 'sound-garden', 'threshold',
  'strange-garden', 'firmament', 'daedalus', 'arcade', 'workbench', 'undercroft'
];

function boxHit(s, b) {
  return s.x + STAR_PAD > b.x && s.x - STAR_PAD < b.x + b.w &&
         s.y + STAR_PAD > b.y && s.y - STAR_PAD < b.y + b.h;
}
function inViewBox(s) {
  return s.x - STAR_PAD >= VIEWBOX.x && s.y - STAR_PAD >= VIEWBOX.y &&
         s.x + STAR_PAD <= VIEWBOX.x + VIEWBOX.w && s.y + STAR_PAD <= VIEWBOX.y + VIEWBOX.h;
}

/* ── (1) DETERMINISM + ORDER-INDEPENDENCE ─────────────────────────────────── */
(function () {
  const A = ['verse', 'scriptorium', 'firmament', 'daedalus'];
  const B = A.slice().reverse();                 // same set, opposite order
  const sA = Sky.state(A, CATALOG, WINGS);
  const sB = Sky.state(B, CATALOG, WINGS);
  eq(JSON.stringify(sA), JSON.stringify(sB), 'state() is order-independent for the same set');
  // a Set and an array of the same ids give the same result
  const sSet = Sky.state(new Set(A), CATALOG, WINGS);
  eq(JSON.stringify(sA), JSON.stringify(sSet), 'state() treats a Set and an array identically');
  // determinism: repeated calls byte-stable
  eq(JSON.stringify(Sky.state(A, CATALOG, WINGS)), JSON.stringify(sA), 'state() is deterministic across calls');
})();

/* ── (2) MONOTONICITY — superset of visits ⇒ superset of every feature ──────── */
(function () {
  const allIds = Object.keys(CATALOG);
  // a chain of growing subsets
  const chain = [
    [],
    ['firmament'],
    ['firmament', 'orrery'],
    ['firmament', 'orrery', 'verse'],
    ['firmament', 'orrery', 'verse', 'scriptorium'],
    ['firmament', 'orrery', 'verse', 'scriptorium', 'daedalus', 'ariadne'],
    allIds.slice()
  ];
  let monoOK = true, compMonoOK = true, ptMonoOK = true;
  for (let k = 1; k < chain.length; k++) {
    const prev = Sky.state(chain[k - 1], CATALOG, WINGS);
    const cur = Sky.state(chain[k], CATALOG, WINGS);
    // lit stars: every star lit before stays lit
    const curStarIds = new Set(cur.stars.map(s => s.id));
    prev.stars.forEach(s => { if (!curStarIds.has(s.id)) monoOK = false; });
    // completed asterisms: every wing complete before stays complete
    const curComplete = new Set(cur.asterisms.filter(a => a.complete).map(a => a.id));
    prev.asterisms.filter(a => a.complete).forEach(a => { if (!curComplete.has(a.id)) compMonoOK = false; });
    // line points: each wing's drawn point-count never decreases
    const ptCount = (st) => { const m = {}; st.lines.forEach(l => { m[l.wing] = l.points.length; }); return m; };
    const pp = ptCount(prev), cp = ptCount(cur);
    for (const wid in pp) { if ((cp[wid] || 0) < pp[wid]) ptMonoOK = false; }
  }
  ok(monoOK, 'MONOTONICITY: a superset of visits never removes a lit star');
  ok(compMonoOK, 'MONOTONICITY: a superset of visits never un-completes an asterism');
  ok(ptMonoOK, 'MONOTONICITY: a superset of visits never shrinks a wing line');
})();

/* ── (3) COMPLETION-IFF — complete === members.every(visited); battery sweep ── */
(function () {
  // full set: every asterism complete, allComplete true (capstone)
  const full = Object.keys(CATALOG);
  const sFull = Sky.state(full, CATALOG, WINGS);
  let allComp = true;
  sFull.asterisms.forEach(a => { if (!a.complete) allComp = false; });
  ok(allComp, 'COMPLETION: full visit-set completes every asterism');
  eq(sFull.allComplete, true, 'COMPLETION: allComplete true on the full set (capstone)');

  // empty set: nothing complete, allComplete false
  const sEmpty = Sky.state([], CATALOG, WINGS);
  ok(sEmpty.asterisms.every(a => !a.complete), 'COMPLETION: empty set completes nothing');
  eq(sEmpty.allComplete, false, 'COMPLETION: allComplete false on the empty set');

  // member-minus-one: for EACH wing, drop ONE member from the full set → that
  // wing (and only that wing) must be incomplete; allComplete must be false.
  let iffOK = true, noFalseComplete = true;
  for (const wing of WINGS) {
    for (const drop of wing.members) {
      const visited = full.filter(id => id !== drop);
      const st = Sky.state(visited, CATALOG, WINGS);
      const target = st.asterisms.find(a => a.id === wing.id);
      if (target.complete) noFalseComplete = false;     // missing a member ⇒ must NOT complete
      if (st.allComplete) iffOK = false;                 // a hole ⇒ capstone must NOT fire
      // and the IFF must hold for every asterism in this state
      st.asterisms.forEach(a => {
        const w = WINGS.find(x => x.id === a.id);
        const everVisited = w.members.every(m => visited.indexOf(m) >= 0);
        if (a.complete !== everVisited) iffOK = false;
      });
    }
  }
  ok(noFalseComplete, 'COMPLETION-IFF: dropping any one member un-completes that wing (no false completion)');
  ok(iffOK, 'COMPLETION-IFF: complete === members.every(visited) across the member-minus-one battery');
  eq(sFull.allComplete, WINGS.every(w => w.members.every(m => full.indexOf(m) >= 0)),
     'COMPLETION-IFF: allComplete <=> every wing complete');
})();

/* ── (4) CATALOG INTEGRITY — every star inside the viewBox & outside obstacles ── */
(function () {
  let inOK = true, clearOK = true;
  for (const id in CATALOG) {
    const c = CATALOG[id];
    const s = { x: c.x, y: c.y };
    if (!inViewBox(s)) { inOK = false; console.error('    · ' + id + ' out of bounds at (' + c.x + ',' + c.y + ')'); }
    for (const f of FOOTPRINTS) if (boxHit(s, f)) { clearOK = false; console.error('    · ' + id + ' over footprint ' + f.id); }
    for (const f of FURNITURE) if (boxHit(s, f)) { clearOK = false; console.error('    · ' + id + ' over furniture ' + f.id); }
    if (boxHit(s, MANOR_POOL)) { clearOK = false; console.error('    · ' + id + ' inside the manor candle-pool'); }
    // a magnitude is present and sane
    if (!(c.mag >= 1 && c.mag <= 3)) clearOK = false;
  }
  ok(inOK, 'CATALOG INTEGRITY: every star lies inside the 1440×900 viewBox');
  ok(clearOK, 'CATALOG INTEGRITY: every star clears every footprint, furniture box, and the manor pool');
})();

/* ── (5) BIJECTION — PLACES↔catalog + wing membership exactly-once ──────────── */
(function () {
  const catIds = Object.keys(CATALOG);
  // catalog has no duplicate keys by construction; verify count == distinct
  eq(catIds.length, new Set(catIds).size, 'BIJECTION: catalog ids are unique (no dupe star)');

  // every front-door PLACES id maps to exactly one catalog star
  let placesOK = true;
  for (const pid of PLACES_IDS) {
    if (!CATALOG[pid]) { placesOK = false; console.error('    · PLACES id "' + pid + '" has NO catalog star'); }
  }
  ok(placesOK, 'BIJECTION: every front-door PLACES id maps to exactly one catalog star');

  // every wing member is a valid catalog id (no orphan) and belongs to exactly one wing (no dupe)
  const memberWing = {};
  let orphanOK = true, oneWingOK = true;
  for (const wing of WINGS) {
    for (const m of wing.members) {
      if (!CATALOG[m]) { orphanOK = false; console.error('    · wing "' + wing.id + '" member "' + m + '" is not a catalog id'); }
      if (memberWing[m] != null) { oneWingOK = false; console.error('    · "' + m + '" is in two wings: ' + memberWing[m] + ' & ' + wing.id); }
      memberWing[m] = wing.id;
    }
  }
  ok(orphanOK, 'BIJECTION: every wing member is a valid catalog id (no orphan)');
  ok(oneWingOK, 'BIJECTION: every wing member belongs to exactly one wing (no dupe)');

  // every wing-member PLACES id is in exactly one wing (the tie that makes the
  // map↔asterism mapping unambiguous for the rooms that DO belong to a wing)
  let placesWingOK = true;
  for (const pid of PLACES_IDS) {
    if (CATALOG[pid] && WINGS.some(w => w.members.indexOf(pid) >= 0)) {
      const wingsWith = WINGS.filter(w => w.members.indexOf(pid) >= 0);
      if (wingsWith.length !== 1) { placesWingOK = false; console.error('    · PLACES wing-member "' + pid + '" is in ' + wingsWith.length + ' wings'); }
    }
  }
  ok(placesWingOK, 'BIJECTION: every wing-member front-door id belongs to exactly one wing');

  // exactly six wings, each a pair (the companion-pair structure the mission fixes)
  eq(WINGS.length, 6, 'BIJECTION: there are exactly six wings');
  ok(WINGS.every(w => w.members.length === 2), 'BIJECTION: every wing is a companion-pair (2 members)');
})();

/* ── report ─────────────────────────────────────────────────────────────────── */
const total = pass + fail;
if (fail) {
  console.error('\nsky self-test: ' + pass + '/' + total + ' PASS — ' + fail + ' FAILED');
  process.exit(1);
}
console.log('sky self-test: ' + pass + '/' + total + ' PASS');
process.exit(0);
