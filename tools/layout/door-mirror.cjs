/* ════════════════════════════════════════════════════════════════════════════
   door-mirror.cjs — the RENDERED getBBox truth for the front door's SOLVED label boxes.

   This is the calibration ANCHOR for tools/layout/door.test.cjs (the door pill's Node
   twin). Each entry is one POI's SOLVED label box {x,y,w,h} in viewBox units, AS THE
   LIVE BROWSER MEASURED IT — getBBox-measured + LABEL_PAD-inflated + LabelPlacer-annealed,
   exactly the box the loupe declutter (and the door's CLAIM B/C/C′) run on. It is the
   HEADLINE source for the twin's 17-claim verdict: because this mirror IS the box-set the
   live #doortest pill computes from, the twin reads its B/C/C′ (the anneal-sensitive
   declutter claims) off this mirror and so goes red iff the live pill is red, claim-for-claim.
   The CHAR_W-modeled boxes are only a SECONDARY cross-check (see door.test.cjs). (Follows
   sky.test.cjs's FOOTPRINTS mirror idiom.)

   ── #369 THE FAIRGROUND GATE — the per-row `frame` tag ──
   The amusements wing now DETACHES into its own `child:amusements` LAYER (Layout.plates
   partitions it onto its own camera frame). Each mirror row carries a `frame` tag —
   "parent" for a room on a parent plate, "child:amusements" for a detached-wing room —
   so the GATE-BROKEN guard can assert the mirror covers EXACTLY the placed POIs across
   BOTH frames (a stale/missing child box trips exit 2). The label BOXES themselves are the
   CANONICAL solved positions — the getBBox truth the live SOLVED map holds (the page never
   overwrites SOLVED; placeLabels runs with all tiles visible). The RELAY that flips CLAIM C′
   green is NOT baked into these boxes: it is applied LIVE on top of them — both the page pill
   and door.test feed runDoorClaims a `childFoot` = DoorClaims.childFootOf(Layout.plates(live)),
   which shifts each detached child room's canonical box by relayChild's delta into the airy
   midway during the C/C′ declutter (#369). So the mirror stays the plain canonical getBBox
   anchor; the depth lives in the engine's childLayout, read fresh, never hand-baked here.

   ── REGENERATE when the rooms / type scale change (so the mirror tracks reality) ──
   Adding/removing a POI re-anneals the WHOLE plate, so the mirror MUST be regenerated then
   — door.test.cjs verifies the mirror covers EXACTLY the placed POIs and trips a loud
   "GATE BROKEN" (exit 2) if it does not. To regenerate: build the page
   (node tools/forge/forge.mjs index.src.html), serve it on an uncommon port, then in a
   HEADLESS agent-browser session dump SOLVED + each room's Layout.plates frame:
       const part=Layout.plates(PLACES.filter(p=>!p.locked));
       SOLVED.forEach((v,id)=>{ const pid=part.roomPlate[id]||'parent';
         out[id]={x:+v.box.x.toFixed(3),...,frame:pid.indexOf('child:')===0?pid:'parent'}; });
   and paste the sorted {id,x,y,w,h,frame} rows below (also update the "Captured … over the N"
   line). This one-shot regen on a POI change is accepted maintenance.

   ENV NOTE (load-bearing): capture in a HEADLESS agent-browser session (the canonical
   #337 env) — its getBBox lands the tier-1 boxes at h≈55.9 and tier-2 at h≈40.9 (block
   35/50 pre-PAD). A HEADED Chrome on the same Mac rasterizes the serif ~1px taller
   (h≈57 / 42), which drifts the mirror off the legibility.cjs model; if the dumped tier-1
   heights read ~57, you captured headed — recapture headless.

   Captured 2026-07-02 over the 91 placed front-door POIs (headless agent-browser; tier-1
   boxes at h=55.949 / tier-2 at h=40.949 — the canonical #337 headless serif). #369 THE
   FAIRGROUND GATE detached the `amusements` wing into its own child LAYER: 15 rooms left the
   parent grounds-east plate for `child:amusements` (tagged on each row), which re-annealed the
   WHOLE label solve, so this mirror was regenerated to track the new placement. The live door
   pill now reads ✓17/17 — CLAIM C′ flips GREEN because the detached amusements rooms declutter
   at their OWN airy child frame instead of crowding a single tight grounds-east column.
   RE-CAPTURED for The Barrel House (the manor's new music-box wing): the new manor POI
   re-annealed the WHOLE label solve (86→87 placed POIs), so this mirror was regenerated.
   RE-CAPTURED 2026-06-30 for The Long Chain (the number wing's Dots-and-Boxes room): the new
   grounds POI re-annealed the WHOLE label solve (87->88 placed POIs), so this mirror was
   regenerated headless to track the new placement (tier-1 boxes at h=55.865 / tier-2 at h=40.865).
   RE-CAPTURED 2026-07-02 for The Faithful Drum (the manor studies wing's new zoetrope, the-faithful-drum)
   — and, in the same pass, to close a stale gate (the mirror had also fallen behind The Cartographer's
   Dream, an earlier studies addition): the new manor POI re-annealed the WHOLE label solve (→90 placed
   POIs), so this mirror was regenerated headless. This capture's serif rasterizes tier-1 boxes at
   h=55.024 / tier-2 at h=41.359 (within door.test H_TOL=2 of the CHAR_W model); the ported solver
   reproduces every rendered slot to Δ 0.00px (SOLVER_TOL=1), door.test 17/17 green.
   RE-CAPTURED 2026-07-02 for THE GREAT HOUSE (#410): the manor stopped single-grid-packing its 20
   rooms into the pinned shell and became a WIDER + SHORTER union of three sub-lots (a taller central
   block flanked by lower wings), so every manor POI footprint MOVED — re-annealing the WHOLE label
   solve. Regenerated headless (91 placed POIs; tier-1 boxes at h=55.949 / tier-2 at h=40.949 — the
   canonical #337 headless serif); the live #doortest pill reads ✓17/17.

   ════════════════════════════════════════════════════════════════════════════ */
'use strict';

var DOOR_MIRROR = [
  { id: 'a-sky-you-name',            x: 312.367,    y: 455.168,   w: 215.834,   h: 55.862,   frame: 'parent' },
  { id: 'aerodrome',                 x: 273.477,    y: 81.472,    w: 385.045,   h: 55.862,   frame: 'parent' },
  { id: 'alchemy',                   x: 643.365,    y: 557.106,   w: 222.602,   h: 40.862,   frame: 'parent' },
  { id: 'aquarium',                  x: 374.65,     y: 598.535,   w: 256.441,   h: 55.862,   frame: 'parent' },
  { id: 'arcade',                    x: 944.466,    y: 207.283,   w: 121.069,   h: 40.862,   frame: 'child:amusements' },
  { id: 'arctic-circle',             x: 213.244,    y: 518.291,   w: 283.512,   h: 55.862,   frame: 'parent' },
  { id: 'ball-and-disk',             x: 691.5,      y: 367.069,   w: 439.188,   h: 55.862,   frame: 'parent' },
  { id: 'belief-beam',               x: 572.683,    y: 645.944,   w: 317.351,   h: 55.862,   frame: 'parent' },
  { id: 'benford-mill',              x: 348.374,    y: 634.08,    w: 330.887,   h: 40.862,   frame: 'parent' },
  { id: 'birthday',                  x: 391.964,    y: 742.308,   w: 344.439,   h: 55.862,   frame: 'parent' },
  { id: 'bootstrap-bench',           x: 700.091,    y: 631.123,   w: 405.349,   h: 55.862,   frame: 'parent' },
  { id: 'brazil-nut-box',            x: 1022.89,    y: 486.686,   w: 276.728,   h: 55.862,   frame: 'child:amusements' },
  { id: 'breathing-star',            x: 316.505,    y: 192.633,   w: 297.048,   h: 55.862,   frame: 'parent' },
  { id: 'card-catalog',              x: 385.023,    y: 408.012,   w: 269.977,   h: 40.862,   frame: 'parent' },
  { id: 'cartographer',              x: 323.399,    y: 374.7,     w: 196.601,   h: 55.862,   frame: 'parent' },
  { id: 'cartouche',                 x: -18.344,    y: 635.044,   w: 378.277,   h: 55.862,   frame: 'parent' },
  { id: 'casting-floor',             x: 869,        y: 734.069,   w: 621.934,   h: 55.862,   frame: 'parent' },
  { id: 'clockwork',                 x: 602.708,    y: 496.107,   w: 310.583,   h: 40.862,   frame: 'parent' },
  { id: 'collisions',                x: 221.911,    y: 767.192,   w: 242.905,   h: 40.862,   frame: 'parent' },
  { id: 'compositor',                x: 406.526,    y: 294.233,   w: 161.675,   h: 55.862,   frame: 'parent' },
  { id: 'conservatory',              x: 1164.972,   y: 569.986,   w: 263.209,   h: 40.862,   frame: 'parent' },
  { id: 'construction-bench',        x: 954.857,    y: 424.069,   w: 418.884,   h: 55.862,   frame: 'parent' },
  { id: 'daedalus',                  x: 917.386,    y: 263.319,   w: 175.228,   h: 55.862,   frame: 'child:amusements' },
  { id: 'differential-gear',         x: 703.652,    y: 285.543,   w: 364.742,   h: 55.862,   frame: 'parent' },
  { id: 'dissection',                x: 373.068,    y: 267.101,   w: 290.28,    h: 40.862,   frame: 'parent' },
  { id: 'einstein-ring',             x: 335.683,    y: 207.274,   w: 486.562,   h: 55.862,   frame: 'parent' },
  { id: 'engine-room',               x: 834.033,    y: 557.106,   w: 256.441,   h: 40.862,   frame: 'parent' },
  { id: 'equal-area-sweep',          x: 103.434,    y: 276,       w: 452.723,   h: 55.862,   frame: 'parent' },
  { id: 'firmament',                 x: 242.181,    y: 300.683,   w: 175.228,   h: 55.862,   frame: 'parent' },
  { id: 'first-light',               x: 328.846,    y: 311.3,     w: 371.51,    h: 55.862,   frame: 'parent' },
  { id: 'gnomon',                    x: 1023.557,   y: 125.995,   w: 330.887,   h: 40.862,   frame: 'parent' },
  { id: 'hall-of-mirrors',           x: 49.964,     y: 393.569,   w: 229.37,    h: 40.862,   frame: 'parent' },
  { id: 'hexapawn',                  x: 79.665,     y: 722.944,   w: 425.652,   h: 40.862,   frame: 'parent' },
  { id: 'holonomy',                  x: -165.25,    y: 536.678,   w: 351.206,   h: 55.862,   frame: 'parent' },
  { id: 'iron-filings',              x: 700.091,    y: 773.091,   w: 242.905,   h: 40.862,   frame: 'parent' },
  { id: 'kirigami',                  x: 374.65,     y: 549.488,   w: 215.867,   h: 55.862,   frame: 'parent' },
  { id: 'lodestone-hall',            x: 700.091,    y: 702.972,   w: 351.206,   h: 55.862,   frame: 'parent' },
  { id: 'loud-and-quiet',            x: 519.457,    y: 537.04,    w: 351.206,   h: 55.862,   frame: 'parent' },
  { id: 'midway',                    x: 784.811,    y: 181.934,   w: 202.299,   h: 55.862,   frame: 'child:amusements' },
  { id: 'murmuration-meter',         x: 1022.89,    y: 451.168,   w: 253.395,   h: 55.862,   frame: 'child:amusements' },
  { id: 'museum',                    x: 237.302,    y: 352.428,   w: 385.045,   h: 55.862,   frame: 'parent' },
  { id: 'numbers-room',              x: 309.108,    y: 678.696,   w: 256.441,   h: 40.862,   frame: 'parent' },
  { id: 'overhang',                  x: 947.138,    y: 786.638,   w: 378.277,   h: 40.862,   frame: 'parent' },
  { id: 'parallax-baseline',         x: -32.662,    y: 222.428,   w: 303.815,   h: 55.862,   frame: 'parent' },
  { id: 'physics-lab',               x: 1007.386,   y: 611.305,   w: 175.228,   h: 40.862,   frame: 'parent' },
  { id: 'pick-and-wheel',            x: 671,        y: 341.126,   w: 303.815,   h: 40.862,   frame: 'parent' },
  { id: 'pool',                      x: -35.217,    y: 466.432,   w: 324.119,   h: 55.862,   frame: 'parent' },
  { id: 'puzzle-pavilion',           x: 870.012,    y: 225.042,   w: 269.977,   h: 40.862,   frame: 'child:amusements' },
  { id: 'quiet-room',                x: 497.134,    y: 750.194,   w: 324.119,   h: 55.862,   frame: 'parent' },
  { id: 'rattleback',                x: -131.363,   y: 756.709,   w: 337.654,   h: 40.862,   frame: 'parent' },
  { id: 'reckoning',                 x: 662.652,    y: 267.101,   w: 324.119,   h: 40.862,   frame: 'parent' },
  { id: 'recombination',             x: -56.883,    y: 293.846,   w: 310.583,   h: 55.862,   frame: 'parent' },
  { id: 'refraction-run',            x: -109.679,   y: 495.765,   w: 398.581,   h: 55.862,   frame: 'parent' },
  { id: 'relativity',                x: 101.378,    y: 173.455,   w: 337.654,   h: 55.862,   frame: 'parent' },
  { id: 'reversing-room',            x: 528.012,    y: 490.385,   w: 269.977,   h: 55.862,   frame: 'parent' },
  { id: 'ripple',                    x: 199.658,    y: 406.486,   w: 229.37,    h: 55.862,   frame: 'parent' },
  { id: 'sewing-room',               x: 312.064,    y: 487.905,   w: 236.138,   h: 40.862,   frame: 'parent' },
  { id: 'sound-garden',              x: 536.206,    y: 389.692,   w: 181.995,   h: 40.862,   frame: 'parent' },
  { id: 'spinning-chair',            x: 1022.89,    y: 250.212,   w: 344.422,   h: 40.862,   frame: 'child:amusements' },
  { id: 'stellar-forge',             x: -25.894,    y: 162.838,   w: 297.048,   h: 55.862,   frame: 'parent' },
  { id: 'strange-garden',            x: 124.912,    y: 620.127,   w: 202.299,   h: 55.862,   frame: 'parent' },
  { id: 'sultans-suitors',           x: 159.113,    y: 801.942,   w: 330.887,   h: 55.862,   frame: 'parent' },
  { id: 'the-barrel-house',          x: 777.799,    y: 422.43,    w: 249.673,   h: 55.862,   frame: 'parent' },
  { id: 'the-cartographers-dream',   x: 412.397,    y: 430.631,   w: 351.206,   h: 55.862,   frame: 'parent' },
  { id: 'the-coin-that-lies',        x: 371.66,     y: 688.58,    w: 385.045,   h: 55.862,   frame: 'parent' },
  { id: 'the-deep-hearth',           x: -29.521,    y: 566.069,   w: 439.188,   h: 55.862,   frame: 'parent' },
  { id: 'the-drawing-room',          x: 422.067,    y: 803.094,   w: 452.723,   h: 55.862,   frame: 'parent' },
  { id: 'the-faithful-drum',         x: 607.799,    y: 374.708,   w: 242.905,   h: 40.862,   frame: 'parent' },
  { id: 'the-heap',                  x: 1022.89,    y: 504.445,   w: 337.654,   h: 55.862,   frame: 'child:amusements' },
  { id: 'the-keystone-arch',         x: 1010.138,   y: 688.501,   w: 405.349,   h: 40.862,   frame: 'parent' },
  { id: 'the-level-ride',            x: 1022.89,    y: 288.489,   w: 351.206,   h: 55.862,   frame: 'child:amusements' },
  { id: 'the-long-chain',            x: 482.945,    y: 811.808,   w: 263.209,   h: 55.862,   frame: 'parent' },
  { id: 'the-long-way-home',         x: 748.296,    y: 103.842,   w: 317.351,   h: 55.862,   frame: 'parent' },
  { id: 'the-phantom-jam',           x: 761.576,    y: 468.927,   w: 225.533,   h: 55.862,   frame: 'child:amusements' },
  { id: 'the-rolling-room',          x: 879.949,    y: 529.614,   w: 250.101,   h: 55.862,   frame: 'child:amusements' },
  { id: 'the-shepherd',              x: 1022.89,    y: 339.007,   w: 236.138,   h: 40.862,   frame: 'child:amusements' },
  { id: 'the-sightline',             x: 316.505,    y: 143.133,   w: 466.259,   h: 40.862,   frame: 'parent' },
  { id: 'the-standing-stones',       x: 1030.301,   y: 387.587,   w: 283.512,   h: 55.862,   frame: 'child:amusements' },
  { id: 'the-top',                   x: 1022.89,    y: 344.613,   w: 317.351,   h: 55.862,   frame: 'child:amusements' },
  { id: 'the-wrinkling',             x: 1164.972,   y: 635.152,   w: 317.351,   h: 40.862,   frame: 'parent' },
  { id: 'threshold',                 x: 806,        y: 341.963,   w: 215.834,   h: 55.862,   frame: 'parent' },
  { id: 'tone-mill',                 x: 556.206,    y: 455.168,   w: 181.995,   h: 55.862,   frame: 'parent' },
  { id: 'transit',                   x: -260.472,   y: 237.069,   w: 601.631,   h: 55.862,   frame: 'parent' },
  { id: 'two-bulges',                x: -223.37,    y: 346.005,   w: 506.865,   h: 55.862,   frame: 'parent' },
  { id: 'unrolled-cone',             x: -219.392,   y: 607.46,    w: 405.349,   h: 55.862,   frame: 'parent' },
  { id: 'vantage',                   x: -179.586,   y: 192.633,   w: 398.581,   h: 55.862,   frame: 'parent' },
  { id: 'verse',                     x: 567.799,    y: 294.233,   w: 175.228,   h: 55.862,   frame: 'parent' },
  { id: 'warren',                    x: 744.204,    y: 321.248,   w: 242.905,   h: 40.862,   frame: 'child:amusements' },
  { id: 'weather-you-can-make',      x: -185.067,   y: 690.765,   w: 520.417,   h: 55.862,   frame: 'parent' },
  { id: 'why-the-sky-is-blue',       x: -109.679,   y: 423.04,    w: 398.581,   h: 55.862,   frame: 'parent' },
  { id: 'workbench',                 x: 622,        y: 599.569,   w: 215.834,   h: 40.862,   frame: 'parent' }
];

if (typeof module !== 'undefined' && module.exports) { module.exports = DOOR_MIRROR; }
