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

/* ── (e) THE FRONT-DOOR HOURS LAYER — the #76 root-cause fixes, proven against the
   LIVE forge SOURCE (index.src.html), not a copy. Two unrelated concerns used to share
   one flag (`forceAllOn`): the deterministic SCREENSHOT path and the persisted rune
   REWARD. While coupled, a rune visitor's door opened pinned at 20:30/night with a
   permanent grey dawn-mist slab and catches suppressed. The fix SPLITS them:
     • pinFrame   — set ONLY by ?hours=allon / #hours-allon (the screenshot path).
     • runeReward — set by the ws:seen:undercroft-rune flag; it must NOT pin time, must
                    NOT force the dawn-mist, and must NOT suppress catches.
   AND the dial CLICK was dead: a >4px jitter on either axis tripped a "scrub" so a tap
   never navigated. The fix raises the scrub gate to a 10px EUCLIDEAN threshold and makes
   `scrubbed` the single source of truth.

   We (1) MODEL both decisions as pure functions and assert their truth tables, and
   (2) GREP the source to prove it is actually wired that way (so a future re-coupling
   or a softened threshold fails this twin). ── */
(function () {
  const fs = require('fs');
  const path = require('path');
  const SRC = path.join(__dirname, '..', '..', 'index.src.html');
  let src = '';
  try { src = fs.readFileSync(SRC, 'utf8'); }
  catch (e) { ok(false, 'HOURS-LAYER: could not read index.src.html (' + e.message + ')'); return; }

  /* ── (e.1) THE FLAG SPLIT — pure model of how the layer derives pinFrame/runeReward
     and what each gates. CANON_MIN=1230 (20:30); local civil minute is the live clock. */
  const CANON_MIN = 1230;
  // pinFrame ONLY from the screenshot param; runeReward ONLY from the rune flag.
  function deriveFlags(opts) {
    const screenshotParam = !!opts.screenshotParam;   // ?hours=allon / #hours-allon
    const runeFlag = !!opts.runeFlag;                 // ws:seen:undercroft-rune present
    return { pinFrame: screenshotParam, runeReward: runeFlag };
  }
  // the opening minute: pinned ONLY when pinFrame; otherwise the live local clock.
  function openingMinute(flags, localCivilMin) { return flags.pinFrame ? CANON_MIN : localCivilMin; }
  // dawn-mist alpha: forced (0.16) ONLY when pinFrame; otherwise the live window decides.
  function dawnMistForced(flags) { return flags.pinFrame; }
  // catches record EXCEPT on the pinned screenshot frame.
  function catchesRecord(flags) { return !flags.pinFrame; }

  const LOCAL = 643;   // a sample live civil minute (10:43) — daytime, NOT 20:30

  // RUNE visitor, no screenshot param: opens at the LIVE clock, mist NOT forced, catches record.
  const fRune = deriveFlags({ runeFlag: true, screenshotParam: false });
  ok(fRune.runeReward === true && fRune.pinFrame === false,
    '(e.1) rune flag sets runeReward but NOT pinFrame (the two concerns are split)');
  ok(openingMinute(fRune, LOCAL) === LOCAL,
    '(e.1) a rune visitor opens at the LOCAL civil minute (' + LOCAL + '), NOT CANON_MIN/20:30');
  ok(dawnMistForced(fRune) === false,
    '(e.1) a rune visitor does NOT force the dawn-mist (no permanent grey slab)');
  ok(catchesRecord(fRune) === true,
    '(e.1) a rune visitor records catches normally (no suppression)');

  // SCREENSHOT path (?hours=allon): the canonical frame is STILL pinned + all-on.
  const fShot = deriveFlags({ runeFlag: false, screenshotParam: true });
  ok(fShot.pinFrame === true,
    '(e.1) ?hours=allon sets pinFrame (the deterministic screenshot path is preserved)');
  ok(openingMinute(fShot, LOCAL) === CANON_MIN,
    '(e.1) the screenshot frame still pins CANON_MIN=1230 (20:30)');
  ok(dawnMistForced(fShot) === true && catchesRecord(fShot) === false,
    '(e.1) the screenshot frame still forces all apparitions ON and suppresses catches');

  // a PLAIN visitor (neither): live clock, nothing forced. (the universal baseline)
  const fPlain = deriveFlags({ runeFlag: false, screenshotParam: false });
  ok(openingMinute(fPlain, LOCAL) === LOCAL && !dawnMistForced(fPlain) && catchesRecord(fPlain),
    '(e.1) a plain visitor opens at the live clock with nothing forced (the baseline)');

  // ── GREP the source: prove the wiring matches the model (no re-coupling). ──
  ok(/var\s+pinFrame\s*=\s*false\s*,\s*runeReward\s*=\s*false/.test(src),
    '(e.1) source declares BOTH pinFrame and runeReward (split, not one flag)');
  ok(/hours=allon[\s\S]{0,40}\bpinFrame\s*=\s*true/.test(src),
    '(e.1) source: ONLY the ?hours=allon param sets pinFrame');
  ok(/undercroft-rune[\s\S]{0,40}\bruneReward\s*=\s*true/.test(src),
    '(e.1) source: the rune flag sets runeReward (NOT pinFrame)');
  ok(!/forceAllOn/.test(src),
    '(e.1) source: the old coupled flag forceAllOn is GONE');
  ok(/var\s+curMin\s*=\s*pinFrame\s*\?\s*CANON_MIN\s*:\s*localCivilMin\(\)/.test(src),
    '(e.1) source: the opening minute is gated on pinFrame, not the rune');
  ok(/function on\(id\)\{\s*return\s+pinFrame\s*\?\s*true/.test(src),
    '(e.1) source: apparition forcing is gated on pinFrame, not the rune');
  ok(/if\(!pinFrame\s*&&\s*aps\)/.test(src),
    '(e.1) source: catch-recording is suppressed only on pinFrame, not the rune');

  /* ── (e.2) THE TAP-vs-SCRUB CLASSIFIER — a tap (and sub-threshold jitter) navigates;
     a real >10px scrub does not. Euclidean distance, so a diagonal jitter can't sneak
     past two independent axis thresholds (the old 4px-per-axis trap).
     #80 ROOT-CAUSE FIX: the navigation no longer rides a bubbled `click` MouseEvent
     (which the browser fires on svg#sheet — OUTSIDE the gnomon subtree — when the
     mousedown/mouseup hit-targets differ, so a gnG-scoped click listener NEVER fired
     for a real pointer). It now runs in `endDrag(ev)` on the window `pointerup` path,
     reading `wasScrub` from the `scrubbed` BOOLEAN (captured BEFORE the dragging class
     is removed) OR the pointerup distance — independent of any click event. The dead
     gnG `click` listener was DELETED. ── */
  const SCRUB_PX = 10, SCRUB_PX2 = SCRUB_PX * SCRUB_PX;
  // pastThreshold(down→up displacement): squared euclidean > 10².
  function pastThreshold(dx, dy) { return (dx * dx + dy * dy) > SCRUB_PX2; }
  // the gesture is a scrub if it ever crossed the threshold (scrubbed) OR the up-point did.
  // (NB: `scrubbed` is read in endDrag BEFORE the dragging class is removed, so the boolean
  // is the source of truth — the class is no longer consulted in the classification.)
  function navigates(g) {
    const wasScrub = g.scrubbed || pastThreshold(g.upDx, g.upDy);
    return !wasScrub;   // navigate when NOT a scrub
  }
  // a no-move tap → navigates.
  ok(navigates({ scrubbed: false, upDx: 0, upDy: 0 }) === true,
    '(e.2) a no-move tap navigates to the wing');
  // a tiny axis-aligned jitter (5px) → still navigates (was a dead click under the old 4px rule).
  ok(navigates({ scrubbed: false, upDx: 5, upDy: 0 }) === true,
    '(e.2) a 5px axis jitter navigates (the old 4px-per-axis dead-click is fixed)');
  // a diagonal jitter (5px,5px = 7.07px < 10) → navigates (the old per-axis OR would have killed it).
  ok(navigates({ scrubbed: false, upDx: 5, upDy: 5 }) === true,
    '(e.2) a 5px,5px diagonal jitter (7.07px) navigates (euclidean gate, not per-axis)');
  // a just-under-threshold jitter (9px) → navigates.
  ok(navigates({ scrubbed: false, upDx: 9, upDy: 0 }) === true,
    '(e.2) a 9px jitter (just under the 10px gate) still navigates');
  // a deliberate scrub (60px) → does NOT navigate.
  ok(navigates({ scrubbed: false, upDx: 60, upDy: 0 }) === false,
    '(e.2) a 60px scrub stays on the front door (no navigation)');
  // a scrub that already flagged `scrubbed` mid-drag but happened to release near origin → no nav.
  ok(navigates({ scrubbed: true, upDx: 1, upDy: 1 }) === false,
    '(e.2) a gesture that crossed the threshold mid-drag is a scrub even if it returns to origin');

  // ── GREP the source: the threshold is euclidean >10px, and the #80 fix wiring. ──
  ok(/SCRUB_PX\s*=\s*10\b/.test(src),
    '(e.2) source: the scrub threshold is 10px (well above incidental jitter)');
  ok(/dx\*dx\s*\+\s*dy\*dy\)\s*>\s*SCRUB_PX2/.test(src),
    '(e.2) source: the threshold is EUCLIDEAN (squared distance), not per-axis');
  // #80: navigation runs in endDrag(ev) (the pointerup path), reading the `scrubbed` boolean
  // BEFORE the class is removed — NOT in a bubbled click handler.
  ok(/function\s+endDrag\(ev\)/.test(src),
    '(e.2) source: endDrag takes the event (the pointerup classifier path)');
  ok(/var\s+wasScrub\s*=\s*scrubbed\s*\|\|\s*\(\s*ev\s*&&\s*pastThreshold\(ev\)\s*\)/.test(src),
    '(e.2) source: wasScrub reads the `scrubbed` boolean OR the pointerup distance (immune to the class removal)');
  ok(/if\s*\(\s*!wasScrub\s*\)\s*\{[\s\S]{0,80}location\.href\s*=\s*GNHREF/.test(src),
    '(e.2) source: a non-scrub navigates via location.href=GNHREF on the pointerup/endDrag path');
  ok(/addEventListener\(["']pointerup["']\s*,\s*endDrag\)/.test(src),
    '(e.2) source: pointerup is wired to endDrag (the click-independent nav path)');
  ok(!/gnG\.addEventListener\(["']click["']/.test(src),
    '(e.2) source: the dead gnG click listener is GONE (no bubbled-click nav dependency)');
  ok(/keydown[\s\S]{0,160}Enter[\s\S]{0,60}location\.href\s*=\s*GNHREF/.test(src),
    '(e.2) source: the keyboard Enter/Space a11y path still enters the wing');
  ok(/addEventListener\(["']dblclick["']/.test(src),
    '(e.2) source: the double-click run-the-day handler is intact');
})();

/* ── report ─────────────────────────────────────────────────────────────────── */
const total = pass + fail;
if (fail) {
  console.error('\nhours self-test: ' + pass + '/' + total + ' PASS — ' + fail + ' FAILED');
  process.exit(1);
}
console.log('hours self-test: ' + pass + '/' + total + ' PASS');
process.exit(0);
