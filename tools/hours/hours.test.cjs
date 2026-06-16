#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   hours.test.cjs — Node self-test for tools/hours/hours.js (the workshop's
   "a self-test proves it" promise). Run:  node tools/hours/hours.test.cjs

   No deps. `require()`s the UNSTRIPPED module headlessly and proves the THREE
   claims the director named, against REAL astronomy (not round numbers), with a
   stated tolerance + negative controls — PLUS a live MARGIN-CLEARANCE assertion
   (claim d) that runs the real Layout engine over the real PLACES so the gnomon
   POI's DERIVED slot is verified clear of every footprint, plan-furniture box,
   and the manor candle-pool — exactly mirroring sky.test.cjs.

     (a) SOLAR CORRECTNESS — peak altitude = 90°−|lat−dec| from the TRUE
         declination to ≤0.05°; exactly two horizon crossings; daily-max at
         civil 720 ± EoT; the shadow DIRECTION is the proven hour-line.
     (b) TINT continuity + correct monotone phasing — skyColor jump-free with
         bounded slope; brightness C0, monotone, and a real day rises then falls.
     (c) EACH apparition fires EXACTLY within its window (ON inside, OFF outside
         both edges, OFF in an unrelated phase); non-vacuous; candle-window
         proven ON across the midnight wrap.
     (d) MARGIN-CLEARANCE — the Layout-derived gnomon POI slot clears every real
         footprint bbox + plan-furniture + the manor candle-pool (x421 y150 600×600).

   Prints "hours self-test: N/N PASS"; exits non-zero on any failure.
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const Hours = require('./hours.js');

/* ── (1)(2)(3) — run the core's own battery (the SAME one the in-page chip runs) ── */
let pass = 0, fail = 0;
function ok(cond, label) { if (cond) { pass++; } else { fail++; console.error('  ✗ FAIL: ' + label); } }

const core = Hours.selfTest();
core.results.forEach(r => ok(r.pass, r.name + (r.detail ? '   — ' + r.detail : '')));
ok(core.pass, 'CORE BATTERY: every solar/tint/apparition claim passes');

/* ── (d) MARGIN-CLEARANCE — the gnomon POI's DERIVED slot clears every obstacle.
   We run the REAL Layout engine over the REAL PLACES set (a faithful mirror of
   index.src.html's declarations, including the new gnomon grounds POI), then
   assert the engine-derived footprint clears every other footprint bbox, the
   plan furniture, and the manor candle-pool — the exact obstacle set & padding
   sky.test.cjs uses. This is C's "gnomon-overlaps-a-footprint" risk, retired by
   construction AND proven live here. ── */
(function () {
  let Layout;
  try { Layout = require('../layout/layout.js'); }
  catch (e) { ok(false, 'MARGIN-CLEARANCE: could not load the Layout engine (' + e.message + ')'); return; }

  /* the real PLACES spatial declarations (district/tier/wing/footprint/order) —
     mirrors index.src.html. Only the SPATIAL fields matter to Layout.solve; the
     gnomon entry is the NEW grounds horology POI this cycle adds. */
  const PLACES = [
    { id: 'verse', district: 'manor', tier: 2, wing: 'studies', footprint: 'house-wing', order: 10 },
    { id: 'compositor', district: 'manor', tier: 2, wing: 'studies', footprint: 'house-wing', order: 20 },
    { id: 'cartographer', district: 'manor', tier: 2, wing: 'studies', footprint: 'house-wing', order: 30 },
    { id: 'sound-garden', district: 'manor', tier: 2, wing: 'east', footprint: 'house-wing', order: 10 },
    { id: 'threshold', district: 'manor', tier: 2, wing: 'east', footprint: 'east-wing', order: 20 },
    { id: 'strange-garden', district: 'grounds', tier: 1, wing: 'glasshouses', footprint: 'glasshouse' },
    { id: 'firmament', district: 'observatory', tier: 1, footprint: 'tower' },
    { id: 'hall-of-mirrors', district: 'grounds', tier: 1, wing: 'optics', footprint: 'hall' },
    { id: 'numbers-room', district: 'grounds', tier: 2, wing: 'number', footprint: 'numbers-room' },
    { id: 'physics-lab', district: 'cavern', tier: 1, footprint: 'cave' },
    { id: 'daedalus', district: 'grounds', tier: 1, wing: 'amusements', footprint: 'maze', order: 20 },
    { id: 'arcade', district: 'grounds', tier: 1, wing: 'amusements', footprint: 'arcade', order: 10 },
    { id: 'puzzle-pavilion', district: 'grounds', tier: 1, wing: 'amusements', footprint: 'pavilion', order: 15 },
    { id: 'engine-room', district: 'grounds', tier: 2, wing: 'works', footprint: 'engine', order: 10 },
    { id: 'alchemy', district: 'grounds', tier: 2, wing: 'works', footprint: 'laboratory', order: 20 },
    { id: 'iron-filings', district: 'grounds', tier: 2, footprint: 'iron-filings' },
    { id: 'clockwork', district: 'manor', tier: 2, wing: 'maker', footprint: 'clockwork' },
    { id: 'tabularium', district: 'manor', tier: 2, wing: 'archive', footprint: 'house-wing', order: 10 },
    { id: 'conservatory', district: 'grounds', tier: 2, wing: 'conservatory', footprint: 'glasshouse-wing' },
    { id: 'workbench', district: 'outbuilding', tier: 3, footprint: 'shed' },
    // ── THE NEW GROUNDS SWING — the estate's master sundial, its own horology wing ──
    { id: 'gnomon', district: 'grounds', tier: 1, wing: 'horology', footprint: 'sundial', prefer: 'top' }
  ];

  let sol;
  try { sol = Layout.solve(PLACES); }
  catch (e) { ok(false, 'MARGIN-CLEARANCE: Layout.solve threw (' + e.message + ')'); return; }

  const g = sol.foot.gnomon;
  ok(!!g && g.w > 0 && g.h > 0, 'MARGIN-CLEARANCE: the gnomon POI gets a derived footprint slot');
  if (!g) return;

  // the gnomon slot must sit inside the star-clear FIELD envelope (a hard wall).
  const F = Layout.FIELD;
  ok(g.x >= F.x && g.y >= F.y && g.x + g.w <= F.x + F.w && g.y + g.h <= F.y + F.h,
    'MARGIN-CLEARANCE: the gnomon slot lies inside the FIELD envelope (no rim-accretion)');

  // the obstacle set + padding, mirroring sky.test.cjs: every OTHER derived
  // footprint, the plan furniture, and the manor candle-pool.
  const PAD = 4;                                   // a footprint must not touch an obstacle edge
  const FURNITURE = [
    { id: 'compass', x: 74, y: 82, w: 92, h: 92 },
    { id: 'scalebar', x: 1086, y: 798, w: 212, h: 52 },
    { id: 'nameplate', x: 96, y: 760, w: 266, h: 78 }
  ];
  const MANOR_POOL = { id: 'manor-pool', x: 421, y: 150, w: 600, h: 600 };

  function overlap(a, b) {
    return a.x - PAD < b.x + b.w && a.x + a.w + PAD > b.x &&
           a.y - PAD < b.y + b.h && a.y + a.h + PAD > b.y;
  }

  // (d.1) clears every OTHER footprint
  let footClear = true, hit = '';
  for (const id in sol.foot) {
    if (id === 'gnomon') continue;
    if (overlap(g, sol.foot[id])) { footClear = false; hit = id; }
  }
  ok(footClear, 'MARGIN-CLEARANCE: the gnomon slot clears every other footprint bbox' + (footClear ? '' : ' (hits ' + hit + ')'));

  // (d.2) clears every plan-furniture box
  let furnClear = true, fhit = '';
  for (const f of FURNITURE) if (overlap(g, f)) { furnClear = false; fhit = f.id; }
  ok(furnClear, 'MARGIN-CLEARANCE: the gnomon slot clears the plan furniture' + (furnClear ? '' : ' (hits ' + fhit + ')'));

  // (d.3) clears the manor candle-pool (the gnomon must NOT sit in the lit core)
  ok(!overlap(g, MANOR_POOL), 'MARGIN-CLEARANCE: the gnomon slot clears the manor candle-pool (x421 y150 600×600)');

  // and the gnomon's drawn dial-graphic centre (= the slot centre) is the point
  // the shadow is cast from; report it so a regression is legible.
  const cx = (g.x + g.w / 2).toFixed(1), cy = (g.y + g.h / 2).toFixed(1);
  ok(true, 'MARGIN-CLEARANCE: gnomon dial centre (shadow origin) at (' + cx + ', ' + cy + ') — clear');
})();

/* ── report ─────────────────────────────────────────────────────────────────── */
const total = pass + fail;
if (fail) {
  console.error('\nhours self-test: ' + pass + '/' + total + ' PASS — ' + fail + ' FAILED');
  process.exit(1);
}
console.log('hours self-test: ' + pass + '/' + total + ' PASS');
process.exit(0);
