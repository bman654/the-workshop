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

   ════════════════════════════════════════════════════════════════════════════ */
'use strict';

var DOOR_MIRROR = [
  { id: 'a-sky-you-name',                    x: 723.137,     y: 310.069,     w: 215.825,     h: 55.949,    frame: 'parent' },
  { id: 'aerodrome',                         x: 273.474,     y: 81.384,      w: 385.052,     h: 55.949,    frame: 'parent' },
  { id: 'alchemy',                           x: 994,         y: 630.525,     w: 222.605,     h: 40.949,    frame: 'parent' },
  { id: 'aquarium',                          x: 374.65,      y: 503.286,     w: 256.45,      h: 55.949,    frame: 'parent' },
  { id: 'arcade',                            x: 944.466,     y: 207.195,     w: 121.069,     h: 40.949,    frame: 'child:amusements' },
  { id: 'arctic-circle',                     x: 213.242,     y: 518.204,     w: 283.516,     h: 55.949,    frame: 'parent' },
  { id: 'ball-and-disk',                     x: 723.137,     y: 354.277,     w: 439.183,     h: 55.949,    frame: 'parent' },
  { id: 'belief-beam',                       x: 572.683,     y: 645.9,       w: 317.361,     h: 55.949,    frame: 'parent' },
  { id: 'benford-mill',                      x: 348.37,      y: 633.993,     w: 330.894,     h: 40.949,    frame: 'parent' },
  { id: 'birthday',                          x: 391.97,      y: 742.308,     w: 344.427,     h: 55.949,    frame: 'parent' },
  { id: 'bootstrap-bench',                   x: 700.091,     y: 631.035,     w: 405.338,     h: 55.949,    frame: 'parent' },
  { id: 'brazil-nut-box',                    x: 1022.89,     y: 394.956,     w: 276.736,     h: 55.949,    frame: 'child:amusements' },
  { id: 'breathing-star',                    x: 323.342,     y: 237.025,     w: 297.049,     h: 55.949,    frame: 'parent' },
  { id: 'card-catalog',                      x: 575.487,     y: 443.331,     w: 269.983,     h: 40.949,    frame: 'parent' },
  { id: 'cartographer',                      x: 488.625,     y: 340.274,     w: 196.307,     h: 55.949,    frame: 'parent' },
  { id: 'cartouche',                         x: -18.339,     y: 634.956,     w: 378.272,     h: 55.949,    frame: 'parent' },
  { id: 'casting-floor',                     x: 869,         y: 734.025,     w: 621.943,     h: 55.949,    frame: 'parent' },
  { id: 'clockwork',                         x: 744.181,     y: 488.36,      w: 310.582,     h: 40.949,    frame: 'parent' },
  { id: 'collisions',                        x: 212.033,     y: 722.9,       w: 242.917,     h: 40.949,    frame: 'parent' },
  { id: 'compositor',                        x: 548.23,      y: 282.88,      w: 161.694,     h: 55.949,    frame: 'parent' },
  { id: 'conservatory',                      x: 1164.972,    y: 569.942,     w: 263.203,     h: 40.949,    frame: 'parent' },
  { id: 'construction-bench',                x: 664.551,     y: 532.857,     w: 418.897,     h: 55.949,    frame: 'parent' },
  { id: 'daedalus',                          x: 811.883,     y: 362.372,     w: 175.227,     h: 55.949,    frame: 'child:amusements' },
  { id: 'differential-gear',                 x: 741.574,     y: 253.083,     w: 364.739,     h: 55.949,    frame: 'parent' },
  { id: 'dissection',                        x: 748.129,     y: 290.788,     w: 290.296,     h: 40.949,    frame: 'parent' },
  { id: 'einstein-ring',                     x: 335.683,     y: 207.23,      w: 486.561,     h: 55.949,    frame: 'parent' },
  { id: 'engine-room',                       x: 834.033,     y: 557.018,     w: 256.45,      h: 40.949,    frame: 'parent' },
  { id: 'equal-area-sweep',                  x: 103.424,     y: 276,         w: 452.743,     h: 55.949,    frame: 'parent' },
  { id: 'firmament',                         x: 242.182,     y: 300.683,     w: 175.227,     h: 55.949,    frame: 'parent' },
  { id: 'first-light',                       x: 126.582,     y: 318.137,     w: 371.519,     h: 55.949,    frame: 'parent' },
  { id: 'gnomon',                            x: 1023.553,    y: 125.908,     w: 330.894,     h: 40.949,    frame: 'parent' },
  { id: 'hall-of-mirrors',                   x: 335.099,     y: 437.099,     w: 229.385,     h: 40.949,    frame: 'parent' },
  { id: 'hexapawn',                          x: 89.532,      y: 678.608,     w: 425.65,      h: 40.949,    frame: 'parent' },
  { id: 'holonomy',                          x: 69.397,      y: 449.616,     w: 351.207,     h: 55.949,    frame: 'parent' },
  { id: 'iron-filings',                      x: 553.541,     y: 783.484,     w: 242.917,     h: 40.949,    frame: 'parent' },
  { id: 'kirigami',                          x: 382.789,     y: 597.025,     w: 215.852,     h: 55.949,    frame: 'parent' },
  { id: 'lodestone-hall',                    x: 710.484,     y: 755.95,      w: 351.207,     h: 55.949,    frame: 'parent' },
  { id: 'loud-and-quiet',                    x: 519.457,     y: 537.04,      w: 351.207,     h: 55.949,    frame: 'parent' },
  { id: 'midway',                            x: 784.817,     y: 181.847,     w: 202.292,     h: 55.949,    frame: 'child:amusements' },
  { id: 'murmuration-meter',                 x: 1022.89,     y: 451.168,     w: 253.378,     h: 55.949,    frame: 'child:amusements' },
  { id: 'museum',                            x: 299.88,      y: 372.119,     w: 385.052,     h: 55.949,    frame: 'parent' },
  { id: 'numbers-room',                      x: 309.099,     y: 767.192,     w: 256.45,      h: 40.949,    frame: 'parent' },
  { id: 'overhang',                          x: 947.138,     y: 688.413,     w: 378.272,     h: 40.949,    frame: 'parent' },
  { id: 'parallax-baseline',                 x: -32.675,     y: 222.341,     w: 303.828,     h: 55.949,    frame: 'parent' },
  { id: 'physics-lab',                       x: 1153.571,    y: 635.479,     w: 175.227,     h: 40.949,    frame: 'parent' },
  { id: 'pick-and-wheel',                    x: 555.398,     y: 261.528,     w: 303.828,     h: 40.949,    frame: 'parent' },
  { id: 'pool',                              x: -35.239,     y: 364.286,     w: 324.141,     h: 55.949,    frame: 'parent' },
  { id: 'puzzle-pavilion',                   x: 870.008,     y: 224.954,     w: 269.983,     h: 40.949,    frame: 'child:amusements' },
  { id: 'quiet-room',                        x: 301.38,      y: 811.808,     w: 324.141,     h: 55.949,    frame: 'parent' },
  { id: 'rattleback',                        x: -131.382,    y: 756.709,     w: 337.674,     h: 40.949,    frame: 'parent' },
  { id: 'reckoning',                         x: 360.791,     y: 290.788,     w: 324.141,     h: 40.949,    frame: 'parent' },
  { id: 'recombination',                     x: -56.881,     y: 293.846,     w: 310.582,     h: 55.949,    frame: 'parent' },
  { id: 'refraction-run',                    x: -109.683,    y: 495.765,     w: 398.585,     h: 55.949,    frame: 'parent' },
  { id: 'relativity',                        x: 101.368,     y: 173.368,     w: 337.674,     h: 55.949,    frame: 'parent' },
  { id: 'reversing-room',                    x: 757.068,     y: 424.262,     w: 269.983,     h: 55.949,    frame: 'parent' },
  { id: 'ripple',                            x: 199.643,     y: 406.442,     w: 229.385,     h: 55.949,    frame: 'parent' },
  { id: 'sewing-room',                       x: 448.794,     y: 468.263,     w: 236.138,     h: 40.949,    frame: 'parent' },
  { id: 'sound-garden',                      x: 509.507,     y: 451.86,      w: 181.98,      h: 40.949,    frame: 'parent' },
  { id: 'spinning-chair',                    x: 1022.89,     y: 326.854,     w: 344.427,     h: 40.949,    frame: 'child:amusements' },
  { id: 'stellar-forge',                     x: 304.163,     y: 162.751,     w: 297.049,     h: 55.949,    frame: 'parent' },
  { id: 'strange-garden',                    x: 124.918,     y: 620.083,     w: 202.292,     h: 55.949,    frame: 'parent' },
  { id: 'sultans-suitors',                   x: 537.634,     y: 801.942,     w: 330.894,     h: 55.949,    frame: 'parent' },
  { id: 'the-barrel-house',                  x: 585.643,     y: 479.831,     w: 249.671,     h: 55.949,    frame: 'parent' },
  { id: 'the-cartographers-dream',           x: 550.146,     y: 390.629,     w: 351.207,     h: 55.949,    frame: 'parent' },
  { id: 'the-coin-that-lies',                x: 371.657,     y: 688.493,     w: 385.052,     h: 55.949,    frame: 'parent' },
  { id: 'the-deep-hearth',                   x: -29.517,     y: 566.025,     w: 439.183,     h: 55.949,    frame: 'parent' },
  { id: 'the-drawing-room',                  x: -92.809,     y: 803.094,     w: 452.743,     h: 55.949,    frame: 'parent' },
  { id: 'the-faithful-drum',                 x: 741.574,     y: 325.069,     w: 242.917,     h: 40.949,    frame: 'parent' },
  { id: 'the-heap',                          x: 1022.89,     y: 504.445,     w: 337.674,     h: 55.949,    frame: 'child:amusements' },
  { id: 'the-keystone-arch',                 x: 1010.138,    y: 786.638,     w: 405.338,     h: 40.949,    frame: 'parent' },
  { id: 'the-level-ride',                    x: 1022.89,     y: 288.401,     w: 351.207,     h: 55.949,    frame: 'child:amusements' },
  { id: 'the-long-chain',                    x: 638.367,     y: 698.358,     w: 263.203,     h: 55.949,    frame: 'parent' },
  { id: 'the-long-way-home',                 x: 748.296,     y: 103.755,     w: 317.361,     h: 55.949,    frame: 'parent' },
  { id: 'the-phantom-jam',                   x: 892.241,     y: 476.337,     w: 225.518,     h: 55.949,    frame: 'child:amusements' },
  { id: 'the-rolling-room',                  x: 1022.89,     y: 522.204,     w: 250.068,     h: 55.949,    frame: 'child:amusements' },
  { id: 'the-shepherd',                      x: 1022.89,     y: 338.919,     w: 236.138,     h: 40.949,    frame: 'child:amusements' },
  { id: 'the-sightline',                     x: 66.862,      y: 136.209,     w: 466.275,     h: 40.949,    frame: 'parent' },
  { id: 'the-standing-stones',               x: 1022.89,     y: 433.409,     w: 283.516,     h: 55.949,    frame: 'child:amusements' },
  { id: 'the-top',                           x: 1022.89,     y: 252.883,     w: 317.361,     h: 55.949,    frame: 'child:amusements' },
  { id: 'the-wrinkling',                     x: 1149.457,    y: 693.04,      w: 317.361,     h: 40.949,    frame: 'parent' },
  { id: 'threshold',                         x: 487.543,     y: 408.06,      w: 215.825,     h: 55.949,    frame: 'parent' },
  { id: 'tone-mill',                         x: 616.322,     y: 494.916,     w: 181.98,      h: 55.949,    frame: 'parent' },
  { id: 'transit',                           x: -253.635,    y: 192.546,     w: 601.63,      h: 55.949,    frame: 'parent' },
  { id: 'two-bulges',                        x: -223.379,    y: 346.005,     w: 506.874,     h: 55.949,    frame: 'parent' },
  { id: 'unrolled-cone',                     x: -202.088,    y: 537.693,     w: 405.338,     h: 55.949,    frame: 'parent' },
  { id: 'vantage',                           x: -186.426,    y: 237.025,     w: 398.585,     h: 55.949,    frame: 'parent' },
  { id: 'verse',                             x: 509.705,     y: 326.679,     w: 175.227,     h: 55.949,    frame: 'parent' },
  { id: 'warren',                            x: 1022.89,     y: 397.89,      w: 242.917,     h: 40.949,    frame: 'child:amusements' },
  { id: 'weather-you-can-make',              x: -185.057,    y: 690.765,     w: 520.407,     h: 55.949,    frame: 'parent' },
  { id: 'why-the-sky-is-blue',               x: -109.683,    y: 422.952,     w: 398.585,     h: 55.949,    frame: 'parent' },
  { id: 'workbench',                         x: 622,         y: 599.525,     w: 215.825,     h: 40.949,    frame: 'parent' },
];

if (typeof module !== 'undefined' && module.exports) { module.exports = DOOR_MIRROR; }
