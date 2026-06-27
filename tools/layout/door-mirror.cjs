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

   ── REGENERATE when the rooms / type scale change (so the mirror tracks reality) ──
   Adding/removing a POI re-anneals the WHOLE plate, so the mirror MUST be regenerated then
   — door.test.cjs verifies the mirror covers EXACTLY the placed POIs and trips a loud
   "GATE BROKEN" (exit 2) if it does not. To regenerate: build the page
   (node tools/forge/forge.mjs index.src.html), serve it on an uncommon port, then in a
   HEADLESS agent-browser session run the door pill and dump SOLVED:
       SOLVED.forEach((v,id)=>out[id]={x:+v.box.x.toFixed(3),y:+v.box.y.toFixed(3),
                                       w:+v.box.w.toFixed(3),h:+v.box.h.toFixed(3)});
   and paste the sorted {id,x,y,w,h} rows below (also update the "Captured … over the N"
   line). This one-shot regen on a POI change is accepted maintenance.

   ENV NOTE (load-bearing): capture in a HEADLESS agent-browser session (the canonical
   #337 env) — its getBBox lands the tier-1 boxes at h≈55.9 and tier-2 at h≈40.9 (block
   35/50 pre-PAD). A HEADED Chrome on the same Mac rasterizes the serif ~1px taller
   (h≈57 / 42), which drifts the mirror off the legibility.cjs model; if the dumped tier-1
   heights read ~57, you captured headed — recapture headless.

   Captured 2026-06-27 over the 84 placed front-door POIs (headless agent-browser; door pill
   GREEN 17/17 ✓ PASSABLE — adding THE DEEP HEARTH POI re-annealed the whole label solve,
   so this mirror was regenerated to track the new placement. The full-plate CROWDED 0.92 is
   the standing non-failing warning (#103), not a gate fault). The twin tracks this exactly.
   ════════════════════════════════════════════════════════════════════════════ */
'use strict';

var DOOR_MIRROR = [
{ id: "aerodrome", x: 273.474, y: 81.384, w: 385.052, h: 55.949 },
  { id: "alchemy", x: 994, y: 630.525, w: 222.605, h: 40.949 },
  { id: "aquarium", x: 374.65, y: 503.286, w: 256.45, h: 55.949 },
  { id: "arcade", x: 1024.111, y: 217.578, w: 121.069, h: 40.949 },
  { id: "arctic-circle", x: 374.65, y: 621.592, w: 283.516, h: 55.949 },
  { id: "ball-and-disk", x: 725.318, y: 362.933, w: 439.183, h: 55.949 },
  { id: "belief-beam", x: 380.319, y: 707.558, w: 317.361, h: 55.949 },
  { id: "benford-mill", x: 537.634, y: 643.858, w: 330.894, h: 40.949 },
  { id: "birthday", x: 391.97, y: 742.308, w: 344.427, h: 55.949 },
  { id: "bootstrap-bench", x: 710.484, y: 684.101, w: 405.338, h: 55.949 },
  { id: "brazil-nut-box", x: 1032.028, y: 433.914, w: 276.736, h: 55.949 },
  { id: "breathing-star", x: 316.505, y: 281.505, w: 297.049, h: 55.949 },
  { id: "card-catalog", x: 414.063, y: 405.193, w: 269.983, h: 40.949 },
  { id: "cartographer", x: 488.507, y: 354.047, w: 195.539, h: 55.949 },
  { id: "cartouche", x: -18.339, y: 634.956, w: 378.272, h: 55.949 },
  { id: "casting-floor", x: 869, y: 734.025, w: 621.943, h: 55.949 },
  { id: "clockwork", x: 552.932, y: 511.357, w: 310.582, h: 40.949 },
  { id: "collisions", x: 367.175, y: 777.058, w: 242.917, h: 40.949 },
  { id: "compositor", x: 551.822, y: 292.468, w: 161.694, h: 55.949 },
  { id: "conservatory", x: 1164.972, y: 569.942, w: 263.203, h: 40.949 },
  { id: "construction-bench", x: 931.174, y: 509.174, w: 418.897, h: 55.949 },
  { id: "daedalus", x: 917.387, y: 276.551, w: 175.227, h: 55.949 },
  { id: "differential-gear", x: 341.695, y: 301.354, w: 364.739, h: 55.949 },
  { id: "dissection", x: 754.788, y: 292.345, w: 290.296, h: 40.949 },
  { id: "einstein-ring", x: 328.846, y: 162.751, w: 486.561, h: 55.949 },
  { id: "engine-room", x: 834.033, y: 557.018, w: 256.45, h: 40.949 },
  { id: "equal-area-sweep", x: 353.137, y: 224.684, w: 452.743, h: 55.949 },
  { id: "firmament", x: 131.227, y: 249.367, w: 175.227, h: 55.949 },
  { id: "first-light", x: 126.582, y: 318.137, w: 371.519, h: 55.949 },
  { id: "gnomon", x: 1023.553, y: 125.908, w: 330.894, h: 40.949 },
  { id: "hall-of-mirrors", x: 49.949, y: 393.525, w: 229.385, h: 40.949 },
  { id: "hexapawn", x: 326.175, y: 668.743, w: 425.65, h: 40.949 },
  { id: "holonomy", x: -165.25, y: 536.634, w: 351.207, h: 55.949 },
  { id: "iron-filings", x: 710.484, y: 727.525, w: 242.917, h: 40.949 },
  { id: "kirigami", x: 247.074, y: 541.262, w: 215.852, h: 55.949 },
  { id: "lodestone-hall", x: 710.484, y: 755.95, w: 351.207, h: 55.949 },
  { id: "loud-and-quiet", x: 77.821, y: 471.609, w: 351.207, h: 55.949 },
  { id: "midway", x: 783.596, y: 182.106, w: 202.292, h: 55.949 },
  { id: "murmuration-meter", x: 878.311, y: 447.972, w: 253.378, h: 55.949 },
  { id: "museum", x: 740.088, y: 376.209, w: 385.052, h: 55.949 },
  { id: "numbers-room", x: 613.184, y: 678.608, w: 256.45, h: 40.949 },
  { id: "overhang", x: 947.138, y: 786.638, w: 378.272, h: 40.949 },
  { id: "parallax-baseline", x: 135.744, y: 215.504, w: 303.828, h: 55.949 },
  { id: "physics-lab", x: 1007.387, y: 817.833, w: 175.227, h: 40.949 },
  { id: "pick-and-wheel", x: 387.299, y: 346.424, w: 303.828, h: 40.949 },
  { id: "pool", x: -35.239, y: 364.286, w: 324.141, h: 55.949 },
  { id: "puzzle-pavilion", x: 870.008, y: 230.134, w: 269.983, h: 40.949 },
  { id: "quiet-room", x: 115.492, y: 698.358, w: 324.141, h: 55.949 },
  { id: "rattleback", x: -131.382, y: 756.709, w: 337.674, h: 40.949 },
  { id: "reckoning", x: 725.318, y: 329.915, w: 324.141, h: 40.949 },
  { id: "recombination", x: -63.718, y: 249.367, w: 310.582, h: 55.949 },
  { id: "refraction-run", x: -119.251, y: 444.692, w: 398.585, h: 55.949 },
  { id: "relativity", x: 101.368, y: 173.368, w: 337.674, h: 55.949 },
  { id: "reversing-room", x: 732.399, y: 439.531, w: 269.983, h: 55.949 },
  { id: "ripple", x: 199.643, y: 406.442, w: 229.385, h: 55.949 },
  { id: "sewing-room", x: 473.463, y: 466.706, w: 236.138, h: 40.949 },
  { id: "sound-garden", x: 617.233, y: 472.007, w: 181.98, h: 40.949 },
  { id: "spinning-chair", x: 1024.111, y: 337.695, w: 344.427, h: 40.949 },
  { id: "stellar-forge", x: -25.895, y: 162.751, w: 297.049, h: 55.949 },
  { id: "strange-garden", x: 133.058, y: 572.459, w: 202.292, h: 55.949 },
  { id: "sultans-suitors", x: 562.817, y: 801.942, w: 330.894, h: 55.949 },
  { id: "the-coin-that-lies", x: 422.023, y: 811.808, w: 385.052, h: 55.949 },
  { id: "the-deep-hearth", x: 526.333, y: 566.025, w: 439.183, h: 55.949 },
  { id: "the-drawing-room", x: -92.809, y: 803.094, w: 452.743, h: 55.949 },
  { id: "the-heap", x: 836.163, y: 509.389, w: 337.674, h: 55.949 },
  { id: "the-keystone-arch", x: 1010.138, y: 688.413, w: 405.338, h: 40.949 },
  { id: "the-long-way-home", x: 748.296, y: 103.755, w: 317.361, h: 55.949 },
  { id: "the-phantom-jam", x: 1024.111, y: 366.356, w: 225.518, h: 55.949 },
  { id: "the-rolling-room", x: 1032.028, y: 474.859, w: 250.068, h: 55.949 },
  { id: "the-shepherd", x: 1024.111, y: 419.584, w: 236.138, h: 40.949 },
  { id: "the-sightline", x: 66.862, y: 136.209, w: 466.275, h: 40.949 },
  { id: "the-top", x: 1024.111, y: 263.995, w: 317.361, h: 55.949 },
  { id: "the-wrinkling", x: 1164.972, y: 635.109, w: 317.361, h: 40.949 },
  { id: "threshold", x: 497.691, y: 374.786, w: 215.825, h: 55.949 },
  { id: "tone-mill", x: 642.787, y: 491.682, w: 181.98, h: 55.949 },
  { id: "transit", x: 387.842, y: 237.025, w: 601.63, h: 55.949 },
  { id: "two-bulges", x: -230.216, y: 301.525, w: 506.874, h: 55.949 },
  { id: "unrolled-cone", x: -219.381, y: 607.417, w: 405.338, h: 55.949 },
  { id: "vantage", x: -179.59, y: 192.546, w: 398.585, h: 55.949 },
  { id: "verse", x: 725.318, y: 292.468, w: 175.227, h: 55.949 },
  { id: "warren", x: 1024.111, y: 319.94, w: 242.917, h: 40.949 },
  { id: "weather-you-can-make", x: -185.057, y: 690.765, w: 520.407, h: 55.949 },
  { id: "why-the-sky-is-blue", x: 335.099, y: 422.952, w: 398.585, h: 55.949 },
  { id: "workbench", x: 290.175, y: 599.525, w: 215.825, h: 40.949 },
];

if (typeof module !== 'undefined' && module.exports) { module.exports = DOOR_MIRROR; }
