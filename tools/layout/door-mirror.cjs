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

   Captured 2026-06-30 over the 87 placed front-door POIs (headless agent-browser; tier-1
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

   ════════════════════════════════════════════════════════════════════════════ */
'use strict';

var DOOR_MIRROR = [
  { id: 'aerodrome',                    x: 273.48,       y: 82.31,        w: 385.041,      h: 55.024,     frame: 'parent' },
  { id: 'alchemy',                      x: 972.033,      y: 556.608,      w: 222.592,      h: 41.359,     frame: 'parent' },
  { id: 'aquarium',                     x: 382.789,      y: 551.373,      w: 256.434,      h: 55.024,     frame: 'parent' },
  { id: 'arcade',                       x: 944.467,      y: 206.786,      w: 121.066,      h: 41.359,     frame: 'child:amusements' },
  { id: 'arctic-circle',                x: 51.835,       y: 527.269,      w: 283.515,      h: 55.024,     frame: 'parent' },
  { id: 'ball-and-disk',                x: 245.749,      y: 310.94,       w: 439.183,      h: 55.024,     frame: 'parent' },
  { id: 'belief-beam',                  x: 562.817,      y: 595.034,      w: 317.357,      h: 55.024,     frame: 'parent' },
  { id: 'benford-mill',                 x: 537.634,      y: 643.449,      w: 330.898,      h: 41.359,     frame: 'parent' },
  { id: 'birthday',                     x: 391.964,      y: 742.308,      w: 344.439,      h: 55.024,     frame: 'parent' },
  { id: 'bootstrap-bench',              x: 710.484,      y: 684.564,      w: 405.342,      h: 55.024,     frame: 'parent' },
  { id: 'brazil-nut-box',               x: 1022.89,      y: 486.686,      w: 276.734,      h: 55.024,     frame: 'child:amusements' },
  { id: 'breathing-star',               x: 316.505,      y: 281.505,      w: 297.056,      h: 55.024,     frame: 'parent' },
  { id: 'card-catalog',                 x: 414.958,      y: 397.105,      w: 269.974,      h: 41.359,     frame: 'parent' },
  { id: 'cartographer',                 x: 488.337,      y: 340.736,      w: 196.595,      h: 55.024,     frame: 'parent' },
  { id: 'cartouche',                    x: -18.347,      y: 753.039,      w: 378.281,      h: 55.024,     frame: 'parent' },
  { id: 'casting-floor',                x: 850.547,      y: 662.429,      w: 621.933,      h: 55.024,     frame: 'parent' },
  { id: 'clockwork',                    x: 744.181,      y: 488.36,       w: 310.597,      h: 41.359,     frame: 'parent' },
  { id: 'collisions',                   x: 367.177,      y: 777.058,      w: 242.913,      h: 41.359,     frame: 'parent' },
  { id: 'compositor',                   x: 548.235,      y: 283.805,      w: 161.689,      h: 55.024,     frame: 'parent' },
  { id: 'conservatory',                 x: 1164.972,     y: 569.737,      w: 263.214,      h: 41.359,     frame: 'parent' },
  { id: 'construction-bench',           x: 374.26,       y: 424.488,      w: 418.883,      h: 55.024,     frame: 'parent' },
  { id: 'daedalus',                     x: 917.385,      y: 369.783,      w: 175.23,       h: 55.024,     frame: 'child:amusements' },
  { id: 'differential-gear',            x: 741.574,      y: 254.009,      w: 364.74,       h: 55.024,     frame: 'parent' },
  { id: 'dissection',                   x: 580.611,      y: 247.524,      w: 290.275,      h: 41.359,     frame: 'parent' },
  { id: 'einstein-ring',                x: 69.058,       y: 156.84,       w: 486.566,      h: 55.024,     frame: 'parent' },
  { id: 'engine-room',                  x: 856,          y: 630.32,       w: 256.434,      h: 41.359,     frame: 'parent' },
  { id: 'equal-area-sweep',             x: 346.3,        y: 181.13,       w: 452.724,      h: 55.024,     frame: 'parent' },
  { id: 'firmament',                    x: 131.224,      y: 249.83,       w: 175.23,       h: 55.024,     frame: 'parent' },
  { id: 'first-light',                  x: -82.5,        y: 267.283,      w: 371.5,        h: 55.024,     frame: 'parent' },
  { id: 'gnomon',                       x: 1023.551,     y: 125.498,      w: 330.898,      h: 41.359,     frame: 'parent' },
  { id: 'hall-of-mirrors',              x: 197.314,      y: 446.667,      w: 229.373,      h: 41.359,     frame: 'parent' },
  { id: 'hexapawn',                     x: 326.168,      y: 668.333,      w: 425.663,      h: 41.359,     frame: 'parent' },
  { id: 'holonomy',                     x: -147.949,     y: 467.835,      w: 351.199,      h: 55.024,     frame: 'parent' },
  { id: 'iron-filings',                 x: 710.484,      y: 727.32,       w: 242.913,      h: 41.359,     frame: 'parent' },
  { id: 'kirigami',                     x: 111.358,      y: 597.488,      w: 215.853,      h: 55.024,     frame: 'parent' },
  { id: 'lodestone-hall',               x: 710.484,      y: 756.413,      w: 351.199,      h: 55.024,     frame: 'parent' },
  { id: 'loud-and-quiet',               x: 519.457,      y: 537.04,       w: 351.199,      h: 55.024,     frame: 'parent' },
  { id: 'midway',                       x: 784.819,      y: 182.773,      w: 202.291,      h: 55.024,     frame: 'child:amusements' },
  { id: 'murmuration-meter',            x: 1022.89,      y: 451.168,      w: 253.366,      h: 55.024,     frame: 'child:amusements' },
  { id: 'museum',                       x: 299.891,      y: 372.581,      w: 385.041,      h: 55.024,     frame: 'parent' },
  { id: 'numbers-room',                 x: 299.25,       y: 722.695,      w: 256.434,      h: 41.359,     frame: 'parent' },
  { id: 'overhang',                     x: 947.138,      y: 786.638,      w: 378.281,      h: 41.359,     frame: 'parent' },
  { id: 'parallax-baseline',            x: 135.75,       y: 318.137,      w: 303.816,      h: 55.024,     frame: 'parent' },
  { id: 'physics-lab',                  x: 1177.833,     y: 714.32,       w: 175.23,       h: 41.359,     frame: 'parent' },
  { id: 'pick-and-wheel',               x: 729.693,      y: 304.178,      w: 303.816,      h: 41.359,     frame: 'parent' },
  { id: 'pool',                         x: -35.216,      y: 365.211,      w: 324.117,      h: 55.024,     frame: 'parent' },
  { id: 'puzzle-pavilion',              x: 870.013,      y: 224.545,      w: 269.974,      h: 41.359,     frame: 'child:amusements' },
  { id: 'quiet-room',                   x: 301.392,      y: 811.808,      w: 324.117,      h: 55.024,     frame: 'parent' },
  { id: 'rattleback',                   x: -149.886,     y: 691.32,       w: 337.658,      h: 41.359,     frame: 'parent' },
  { id: 'reckoning',                    x: 723.137,      y: 327.088,      w: 324.117,      h: 41.359,     frame: 'parent' },
  { id: 'recombination',                x: -56.897,      y: 293.846,      w: 310.597,      h: 55.024,     frame: 'parent' },
  { id: 'refraction-run',               x: 112.709,      y: 505.333,      w: 398.582,      h: 55.024,     frame: 'parent' },
  { id: 'relativity',                   x: -90.795,      y: 225.147,      w: 337.658,      h: 55.024,     frame: 'parent' },
  { id: 'reversing-room',               x: 757.068,      y: 424.725,      w: 269.974,      h: 55.024,     frame: 'parent' },
  { id: 'ripple',                       x: 215.171,      y: 471.873,      w: 229.373,      h: 55.024,     frame: 'parent' },
  { id: 'sewing-room',                  x: 455.355,      y: 504.562,      w: 236.133,      h: 41.359,     frame: 'parent' },
  { id: 'sound-garden',                 x: 723.137,      y: 378.851,      w: 181.99,       h: 41.359,     frame: 'parent' },
  { id: 'spinning-chair',               x: 1022.89,      y: 249.714,      w: 344.439,      h: 41.359,     frame: 'child:amusements' },
  { id: 'stellar-forge',                x: -25.903,      y: 163.676,      w: 297.056,      h: 55.024,     frame: 'parent' },
  { id: 'strange-garden',               x: 382.789,      y: 620.546,      w: 202.291,      h: 55.024,     frame: 'parent' },
  { id: 'sultans-suitors',              x: 537.634,      y: 801.942,      w: 330.898,      h: 55.024,     frame: 'parent' },
  { id: 'the-barrel-house',             x: 585.641,      y: 479.831,      w: 249.673,      h: 55.024,     frame: 'parent' },
  { id: 'the-cartographers-dream',      x: 741.574,      y: 297.4,        w: 351.199,      h: 55.024,     frame: 'parent' },
  { id: 'the-coin-that-lies',           x: 588,          y: 801.942,      w: 385.041,      h: 55.024,     frame: 'parent' },
  { id: 'the-deep-hearth',              x: -29.517,      y: 566.488,      w: 439.183,      h: 55.024,     frame: 'parent' },
  { id: 'the-drawing-room',             x: -92.791,      y: 803.094,      w: 452.724,      h: 55.024,     frame: 'parent' },
  { id: 'the-faithful-drum',            x: 723.137,      y: 397.668,      w: 242.913,      h: 41.359,     frame: 'parent' },
  { id: 'the-heap',                     x: 1022.89,      y: 504.445,      w: 337.658,      h: 55.024,     frame: 'child:amusements' },
  { id: 'the-keystone-arch',            x: 1022,         y: 737.32,       w: 405.342,      h: 41.359,     frame: 'parent' },
  { id: 'the-level-ride',               x: 1022.89,      y: 289.327,      w: 351.199,      h: 55.024,     frame: 'child:amusements' },
  { id: 'the-long-chain',               x: 482.942,      y: 689.418,      w: 263.214,      h: 55.024,     frame: 'parent' },
  { id: 'the-long-way-home',            x: 748.296,      y: 104.68,       w: 317.357,      h: 55.024,     frame: 'parent' },
  { id: 'the-phantom-jam',              x: 1030.301,     y: 423.524,      w: 225.513,      h: 55.024,     frame: 'child:amusements' },
  { id: 'the-rolling-room',             x: 879.965,      y: 529.614,      w: 250.07,       h: 55.024,     frame: 'child:amusements' },
  { id: 'the-shepherd',                 x: 1030.301,     y: 377.08,       w: 236.133,      h: 41.359,     frame: 'child:amusements' },
  { id: 'the-sightline',                x: 316.505,      y: 142.636,      w: 466.265,      h: 41.359,     frame: 'parent' },
  { id: 'the-standing-stones',          x: 1022.89,      y: 342.604,      w: 283.515,      h: 55.024,     frame: 'child:amusements' },
  { id: 'the-top',                      x: 669.752,      y: 344.613,      w: 317.357,      h: 55.024,     frame: 'child:amusements' },
  { id: 'the-wrinkling',                x: 1164.972,     y: 634.904,      w: 317.357,      h: 41.359,     frame: 'parent' },
  { id: 'threshold',                    x: 494.092,      y: 451.86,       w: 215.832,      h: 55.024,     frame: 'parent' },
  { id: 'tone-mill',                    x: 723.137,      y: 488.36,       w: 181.99,       h: 55.024,     frame: 'parent' },
  { id: 'transit',                      x: -253.637,     y: 193.471,      w: 601.632,      h: 55.024,     frame: 'parent' },
  { id: 'two-bulges',                   x: -223.372,     y: 346.005,      w: 506.867,      h: 55.024,     frame: 'parent' },
  { id: 'unrolled-cone',                x: 42.329,       y: 694.435,      w: 405.342,      h: 55.024,     frame: 'parent' },
  { id: 'vantage',                      x: 258.842,      y: 237.488,      w: 398.582,      h: 55.024,     frame: 'parent' },
  { id: 'verse',                        x: 619.697,      y: 377.034,      w: 175.23,       h: 55.024,     frame: 'parent' },
  { id: 'warren',                       x: 1022.89,      y: 397.89,       w: 242.913,      h: 41.359,     frame: 'child:amusements' },
  { id: 'weather-you-can-make',         x: -193.197,     y: 643.603,      w: 520.408,      h: 55.024,     frame: 'parent' },
  { id: 'why-the-sky-is-blue',          x: -109.68,      y: 423.878,      w: 398.582,      h: 55.024,     frame: 'parent' },
  { id: 'workbench',                    x: 290.168,      y: 599.32,       w: 215.832,      h: 41.359,     frame: 'parent' },
];

if (typeof module !== 'undefined' && module.exports) { module.exports = DOOR_MIRROR; }
