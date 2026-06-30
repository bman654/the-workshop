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

   ════════════════════════════════════════════════════════════════════════════ */
'use strict';

var DOOR_MIRROR = [
  { id: 'aerodrome',               x: 273.48,     y: 81.468,     w: 385.041,    h: 55.865,   frame: 'parent' },
  { id: 'alchemy',                 x: 807.704,    y: 535.135,    w: 222.591,    h: 40.865,   frame: 'parent' },
  { id: 'aquarium',                x: 78.908,     y: 598.535,    w: 256.442,    h: 55.865,   frame: 'parent' },
  { id: 'arcade',                  x: 944.468,    y: 207.279,    w: 121.063,    h: 40.865,   frame: 'child:amusements' },
  { id: 'arctic-circle',           x: 374.65,     y: 526.427,    w: 283.513,    h: 55.865,   frame: 'parent' },
  { id: 'ball-and-disk',           x: 250.81,     y: 357.354,    w: 439.183,    h: 55.865,   frame: 'parent' },
  { id: 'belief-beam',             x: 380.318,    y: 707.558,    w: 317.363,    h: 55.865,   frame: 'parent' },
  { id: 'benford-mill',            x: 348.367,    y: 634.076,    w: 330.899,    h: 40.865,   frame: 'parent' },
  { id: 'birthday',                x: 391.966,    y: 742.308,    w: 344.434,    h: 55.865,   frame: 'parent' },
  { id: 'bootstrap-bench',         x: 472.322,    y: 620.726,    w: 405.356,    h: 55.865,   frame: 'parent' },
  { id: 'brazil-nut-box',          x: 1030.301,   y: 440.862,    w: 276.733,    h: 55.865,   frame: 'child:amusements' },
  { id: 'breathing-star',          x: 316.505,    y: 192.63,     w: 297.048,    h: 55.865,   frame: 'parent' },
  { id: 'card-catalog',            x: 413.273,    y: 391.392,    w: 269.977,    h: 40.865,   frame: 'parent' },
  { id: 'cartographer',            x: 608.509,    y: 396.163,    w: 195.52,     h: 55.865,   frame: 'parent' },
  { id: 'cartouche',               x: -18.352,    y: 635.04,     w: 378.285,    h: 55.865,   frame: 'parent' },
  { id: 'casting-floor',           x: 850.547,    y: 661.587,    w: 621.947,    h: 55.865,   frame: 'parent' },
  { id: 'clockwork',               x: 573.625,    y: 493.766,    w: 310.584,    h: 40.865,   frame: 'parent' },
  { id: 'collisions',              x: 367.181,    y: 777.058,    w: 242.906,    h: 40.865,   frame: 'parent' },
  { id: 'compositor',              x: 742.387,    y: 374.79,     w: 161.694,    h: 55.865,   frame: 'parent' },
  { id: 'conservatory',            x: 1164.972,   y: 569.984,    w: 263.222,    h: 40.865,   frame: 'parent' },
  { id: 'construction-bench',      x: 664.554,    y: 532.857,    w: 418.891,    h: 55.865,   frame: 'parent' },
  { id: 'daedalus',                x: 917.385,    y: 369.783,    w: 175.229,    h: 55.865,   frame: 'child:amusements' },
  { id: 'differential-gear',       x: 742.387,    y: 254.305,    w: 364.749,    h: 55.865,   frame: 'parent' },
  { id: 'dissection',              x: 749.129,    y: 291.384,    w: 290.292,    h: 40.865,   frame: 'parent' },
  { id: 'einstein-ring',           x: 328.846,    y: 162.835,    w: 486.569,    h: 55.865,   frame: 'parent' },
  { id: 'engine-room',             x: 856,        y: 630.567,    w: 256.442,    h: 40.865,   frame: 'parent' },
  { id: 'equal-area-sweep',        x: -139.428,   y: 180.288,    w: 452.718,    h: 55.865,   frame: 'parent' },
  { id: 'firmament',               x: 242.181,    y: 300.683,    w: 175.229,    h: 55.865,   frame: 'parent' },
  { id: 'first-light',             x: -75.668,    y: 311.3,      w: 371.505,    h: 55.865,   frame: 'parent' },
  { id: 'gnomon',                  x: 1023.551,   y: 125.992,    w: 330.899,    h: 40.865,   frame: 'parent' },
  { id: 'hall-of-mirrors',         x: 59.53,      y: 350.036,    w: 229.371,    h: 40.865,   frame: 'parent' },
  { id: 'hexapawn',                x: 326.176,    y: 668.826,    w: 425.647,    h: 40.865,   frame: 'parent' },
  { id: 'holonomy',                x: -165.234,   y: 536.676,    w: 351.19,     h: 55.865,   frame: 'parent' },
  { id: 'iron-filings',            x: 553.547,    y: 783.484,    w: 242.906,    h: 40.865,   frame: 'parent' },
  { id: 'kirigami',                x: 119.419,    y: 549.485,    w: 215.931,    h: 55.865,   frame: 'parent' },
  { id: 'lodestone-hall',          x: 710.484,    y: 755.992,    w: 351.19,     h: 55.865,   frame: 'parent' },
  { id: 'loud-and-quiet',          x: 93.353,     y: 406.261,    w: 351.19,     h: 55.865,   frame: 'parent' },
  { id: 'midway',                  x: 784.809,    y: 181.931,    w: 202.3,      h: 55.865,   frame: 'child:amusements' },
  { id: 'murmuration-meter',       x: 1022.89,    y: 451.168,    w: 253.471,    h: 55.865,   frame: 'child:amusements' },
  { id: 'museum',                  x: 305.95,     y: 411.471,    w: 385.041,    h: 55.865,   frame: 'parent' },
  { id: 'numbers-room',            x: 613.184,    y: 678.692,    w: 256.442,    h: 40.865,   frame: 'parent' },
  { id: 'overhang',                x: 959,        y: 737.567,    w: 378.285,    h: 40.865,   frame: 'parent' },
  { id: 'parallax-baseline',       x: -39.511,    y: 266.862,    w: 303.828,    h: 55.865,   frame: 'parent' },
  { id: 'physics-lab',             x: 1177.833,   y: 714.567,    w: 175.229,    h: 40.865,   frame: 'parent' },
  { id: 'pick-and-wheel',          x: 379.423,    y: 306.014,    w: 303.828,    h: 40.865,   frame: 'parent' },
  { id: 'pool',                    x: -35.218,    y: 466.432,    w: 324.119,    h: 55.865,   frame: 'parent' },
  { id: 'puzzle-pavilion',         x: 870.011,    y: 225.038,    w: 269.977,    h: 40.865,   frame: 'child:amusements' },
  { id: 'quiet-room',              x: 301.391,    y: 688.576,    w: 324.119,    h: 55.865,   frame: 'parent' },
  { id: 'rattleback',              x: -149.883,   y: 691.567,    w: 337.655,    h: 40.865,   frame: 'parent' },
  { id: 'reckoning',               x: 722.546,    y: 328.093,    w: 324.119,    h: 40.865,   frame: 'parent' },
  { id: 'recombination',           x: 293.546,    y: 249.409,    w: 310.584,    h: 55.865,   frame: 'parent' },
  { id: 'refraction-run',          x: 112.712,    y: 505.333,    w: 398.576,    h: 55.865,   frame: 'parent' },
  { id: 'relativity',              x: -90.791,    y: 224.726,    w: 337.655,    h: 55.865,   frame: 'parent' },
  { id: 'reversing-room',          x: 758.749,    y: 420.969,    w: 269.977,    h: 55.865,   frame: 'parent' },
  { id: 'ripple',                  x: 215.172,    y: 471.873,    w: 229.371,    h: 55.865,   frame: 'parent' },
  { id: 'sewing-room',             x: 447.124,    y: 467.751,    w: 236.127,    h: 40.865,   frame: 'parent' },
  { id: 'sound-garden',            x: 615.277,    y: 454.484,    w: 181.985,    h: 40.865,   frame: 'parent' },
  { id: 'spinning-chair',          x: 1022.89,    y: 250.208,    w: 344.434,    h: 40.865,   frame: 'child:amusements' },
  { id: 'stellar-forge',           x: -25.895,    y: 251.71,     w: 297.048,    h: 55.865,   frame: 'parent' },
  { id: 'strange-garden',          x: 253.85,     y: 564.403,    w: 202.3,      h: 55.865,   frame: 'parent' },
  { id: 'sultans-suitors',         x: 537.634,    y: 801.942,    w: 330.899,    h: 55.865,   frame: 'parent' },
  { id: 'the-barrel-house',        x: 728.362,    y: 469.792,    w: 249.686,    h: 55.865,   frame: 'parent' },
  { id: 'the-coin-that-lies',      x: 155.325,    y: 801.942,    w: 385.041,    h: 55.865,   frame: 'parent' },
  { id: 'the-deep-hearth',         x: 526.333,    y: 566.067,    w: 439.183,    h: 55.865,   frame: 'parent' },
  { id: 'the-drawing-room',        x: -105.653,   y: 744.095,    w: 452.718,    h: 55.865,   frame: 'parent' },
  { id: 'the-heap',                x: 1022.89,    y: 504.445,    w: 337.655,    h: 55.865,   frame: 'child:amusements' },
  { id: 'the-keystone-arch',       x: 1010.138,   y: 786.638,    w: 405.356,    h: 40.865,   frame: 'parent' },
  { id: 'the-level-ride',          x: 1022.89,    y: 380.131,    w: 351.19,     h: 55.865,   frame: 'child:amusements' },
  { id: 'the-long-chain',          x: 638.367,    y: 698.442,    w: 263.222,    h: 55.865,   frame: 'parent' },
  { id: 'the-long-way-home',       x: 748.296,    y: 103.839,    w: 317.363,    h: 55.865,   frame: 'parent' },
  { id: 'the-phantom-jam',         x: 892.195,    y: 476.337,    w: 225.61,     h: 55.865,   frame: 'child:amusements' },
  { id: 'the-rolling-room',        x: 1022.89,    y: 522.204,    w: 250.165,    h: 55.865,   frame: 'child:amusements' },
  { id: 'the-shepherd',            x: 1022.89,    y: 339.003,    w: 236.127,    h: 40.865,   frame: 'child:amusements' },
  { id: 'the-sightline',           x: 66.873,     y: 136.293,    w: 466.253,    h: 40.865,   frame: 'parent' },
  { id: 'the-standing-stones',     x: 1030.301,   y: 387.585,    w: 283.513,    h: 55.865,   frame: 'child:amusements' },
  { id: 'the-top',                 x: 1030.301,   y: 298.79,     w: 317.363,    h: 55.865,   frame: 'child:amusements' },
  { id: 'the-wrinkling',           x: 1164.972,   y: 635.151,    w: 317.363,    h: 40.865,   frame: 'parent' },
  { id: 'threshold',               x: 742.387,    y: 359.324,    w: 215.836,    h: 55.865,   frame: 'parent' },
  { id: 'tone-mill',               x: 508.008,    y: 487.024,    w: 181.985,    h: 55.865,   frame: 'parent' },
  { id: 'transit',                 x: 387.842,    y: 237.067,    w: 601.632,    h: 55.865,   frame: 'parent' },
  { id: 'two-bulges',              x: 323.342,    y: 301.567,    w: 506.884,    h: 55.865,   frame: 'parent' },
  { id: 'unrolled-cone',           x: -219.399,   y: 607.459,    w: 405.356,    h: 55.865,   frame: 'parent' },
  { id: 'vantage',                 x: 36.212,     y: 185.793,    w: 398.576,    h: 55.865,   frame: 'parent' },
  { id: 'verse',                   x: 508.021,    y: 330.581,    w: 175.229,    h: 55.865,   frame: 'parent' },
  { id: 'warren',                  x: 883.547,    y: 313.833,    w: 242.906,    h: 40.865,   frame: 'child:amusements' },
  { id: 'weather-you-can-make',    x: -185.069,   y: 690.765,    w: 520.419,    h: 55.865,   frame: 'parent' },
  { id: 'why-the-sky-is-blue',     x: -109.675,   y: 423.036,    w: 398.576,    h: 55.865,   frame: 'parent' },
  { id: 'workbench',               x: 290.164,    y: 599.567,    w: 215.836,    h: 40.865,   frame: 'parent' },
];

if (typeof module !== 'undefined' && module.exports) { module.exports = DOOR_MIRROR; }
