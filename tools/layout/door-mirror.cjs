/* ════════════════════════════════════════════════════════════════════════════
   door-mirror.cjs — the RENDERED getBBox truth for the front door's SOLVED label boxes.

   This is the calibration ANCHOR for tools/layout/door.test.cjs (the door pill's Node
   twin). Each entry is one POI's SOLVED label box {x,y,w,h} in viewBox units, AS THE
   LIVE BROWSER MEASURED IT — getBBox-measured + LABEL_PAD-inflated + LabelPlacer-annealed,
   exactly the box the loupe declutter (and the door's CLAIM B/C/C′) run on. The twin MODELS
   these boxes (legibility.cjs CHAR_W box-{w,h} + LabelPlacer placement); the calibration
   guard asserts the model ≈ this mirror within a documented tolerance, AND that the door
   claims yield the SAME 17-claim verdict over the modeled boxes as over this rendered mirror
   — so the twin's red is faithfully the live pill's red. (Follows sky.test.cjs's FOOTPRINTS
   mirror idiom.)

   ── REGENERATE when the rooms / type scale change (so the mirror tracks reality) ──
   Build the page (node tools/forge/forge.mjs index.src.html), serve it, then in an
   agent-browser session run the door pill and dump SOLVED:
       SOLVED.forEach((v,id)=>out[id]={x:+v.box.x.toFixed(3),y:+v.box.y.toFixed(3),
                                       w:+v.box.w.toFixed(3),h:+v.box.h.toFixed(3)});
   and paste the sorted {id,x,y,w,h} rows below. door.test.cjs verifies the mirror covers
   exactly the placed POIs, so a stale mirror (room added/removed) fails loudly.

   Captured 2026-06-27 over the 80 placed front-door POIs.
   ════════════════════════════════════════════════════════════════════════════ */
'use strict';

var DOOR_MIRROR = [
  { id: "aerodrome", x: 273.474, y: 81.384, w: 385.052, h: 55.949 },
  { id: "alchemy", x: 643.363, y: 557.018, w: 222.605, h: 40.949 },
  { id: "aquarium", x: 382.789, y: 550.91, w: 256.45, h: 55.949 },
  { id: "arcade", x: 864.82, y: 217.578, w: 121.069, h: 40.949 },
  { id: "arctic-circle", x: 51.834, y: 621.592, w: 283.516, h: 55.949 },
  { id: "belief-beam", x: 380.319, y: 584.243, w: 317.361, h: 55.949 },
  { id: "benford-mill", x: 348.37, y: 633.993, w: 330.894, h: 40.949 },
  { id: "birthday", x: 391.97, y: 742.308, w: 344.427, h: 55.949 },
  { id: "bootstrap-bench", x: 700.091, y: 631.035, w: 405.338, h: 55.949 },
  { id: "brazil-nut-box", x: 866.632, y: 488.917, w: 276.736, h: 55.949 },
  { id: "breathing-star", x: 316.505, y: 281.505, w: 297.049, h: 55.949 },
  { id: "card-catalog", x: 411.904, y: 398.577, w: 269.983, h: 40.949 },
  { id: "cartographer", x: 486.347, y: 343.324, w: 195.539, h: 55.949 },
  { id: "cartouche", x: -31.207, y: 693.998, w: 378.272, h: 55.949 },
  { id: "casting-floor", x: 869, y: 734.025, w: 621.943, h: 55.949 },
  { id: "clockwork", x: 551.73, y: 511.485, w: 310.582, h: 40.949 },
  { id: "collisions", x: 367.175, y: 668.743, w: 242.917, h: 40.949 },
  { id: "compositor", x: 650.669, y: 378.371, w: 161.694, h: 55.949 },
  { id: "conservatory", x: 1149.457, y: 627.873, w: 263.203, h: 40.949 },
  { id: "construction-bench", x: 374.246, y: 424.025, w: 418.897, h: 55.949 },
  { id: "daedalus", x: 1032.028, y: 331.553, w: 175.227, h: 55.949 },
  { id: "differential-gear", x: 749.288, y: 257.99, w: 364.739, h: 55.949 },
  { id: "dissection", x: 749.288, y: 331.422, w: 290.296, h: 40.949 },
  { id: "einstein-ring", x: -197.561, y: 207.23, w: 486.561, h: 55.949 },
  { id: "engine-room", x: 834.033, y: 557.018, w: 256.45, h: 40.949 },
  { id: "equal-area-sweep", x: 353.137, y: 224.684, w: 452.743, h: 55.949 },
  { id: "firmament", x: 138.064, y: 293.846, w: 175.227, h: 55.949 },
  { id: "first-light", x: -75.682, y: 311.3, w: 371.519, h: 55.949 },
  { id: "gnomon", x: 1023.553, y: 125.908, w: 330.894, h: 40.949 },
  { id: "hall-of-mirrors", x: 59.517, y: 437.099, w: 229.385, h: 40.949 },
  { id: "hexapawn", x: 326.175, y: 777.058, w: 425.65, h: 40.949 },
  { id: "holonomy", x: -179.349, y: 572.025, w: 351.207, h: 55.949 },
  { id: "iron-filings", x: 700.091, y: 681.96, w: 242.917, h: 40.949 },
  { id: "kirigami", x: 119.499, y: 549.401, w: 215.852, h: 55.949 },
  { id: "lodestone-hall", x: 710.484, y: 755.95, w: 351.207, h: 55.949 },
  { id: "loud-and-quiet", x: 93.337, y: 406.178, w: 351.207, h: 55.949 },
  { id: "midway", x: 903.854, y: 174.19, w: 202.292, h: 55.949 },
  { id: "murmuration-meter", x: 1024.111, y: 345.884, w: 253.378, h: 55.949 },
  { id: "museum", x: 740.567, y: 367.572, w: 385.052, h: 55.949 },
  { id: "numbers-room", x: 461.141, y: 668.743, w: 256.45, h: 40.949 },
  { id: "overhang", x: 947.138, y: 688.413, w: 378.272, h: 40.949 },
  { id: "parallax-baseline", x: 135.744, y: 215.504, w: 303.828, h: 55.949 },
  { id: "physics-lab", x: 1007.387, y: 817.833, w: 175.227, h: 40.949 },
  { id: "pick-and-wheel", x: 732.155, y: 311.237, w: 303.828, h: 40.949 },
  { id: "pool", x: -35.239, y: 364.286, w: 324.141, h: 55.949 },
  { id: "puzzle-pavilion", x: 870.008, y: 230.134, w: 269.983, h: 40.949 },
  { id: "quiet-room", x: 115.492, y: 698.358, w: 324.141, h: 55.949 },
  { id: "rattleback", x: -131.382, y: 756.709, w: 337.674, h: 40.949 },
  { id: "reckoning", x: 544.95, y: 338.784, w: 324.141, h: 40.949 },
  { id: "recombination", x: -63.718, y: 249.367, w: 310.582, h: 55.949 },
  { id: "refraction-run", x: 112.708, y: 505.333, w: 398.585, h: 55.949 },
  { id: "relativity", x: 286.71, y: 180.205, w: 337.674, h: 55.949 },
  { id: "reversing-room", x: 732.155, y: 436.85, w: 269.983, h: 55.949 },
  { id: "ripple", x: 215.159, y: 341.011, w: 229.385, h: 55.949 },
  { id: "sewing-room", x: 752.752, y: 504.123, w: 236.138, h: 40.949 },
  { id: "sound-garden", x: 507.268, y: 461.071, w: 181.98, h: 40.949 },
  { id: "spinning-chair", x: 1032.028, y: 298.109, w: 344.427, h: 40.949 },
  { id: "stellar-forge", x: -25.895, y: 162.751, w: 297.049, h: 55.949 },
  { id: "strange-garden", x: 253.854, y: 564.319, w: 202.292, h: 55.949 },
  { id: "sultans-suitors", x: 562.817, y: 698.358, w: 330.894, h: 55.949 },
  { id: "the-coin-that-lies", x: 422.023, y: 811.808, w: 385.052, h: 55.949 },
  { id: "the-drawing-room", x: -92.809, y: 803.094, w: 452.743, h: 55.949 },
  { id: "the-heap", x: 1032.028, y: 454.387, w: 337.674, h: 55.949 },
  { id: "the-keystone-arch", x: 1010.138, y: 786.638, w: 405.338, h: 40.949 },
  { id: "the-long-way-home", x: 748.296, y: 103.755, w: 317.361, h: 55.949 },
  { id: "the-phantom-jam", x: 1024.111, y: 460.528, w: 225.518, h: 55.949 },
  { id: "the-rolling-room", x: 1024.111, y: 521.945, w: 250.068, h: 55.949 },
  { id: "the-shepherd", x: 1024.111, y: 419.584, w: 236.138, h: 40.949 },
  { id: "the-top", x: 1024.111, y: 263.995, w: 317.361, h: 55.949 },
  { id: "the-wrinkling", x: 1149.457, y: 577.178, w: 317.361, h: 40.949 },
  { id: "threshold", x: 623.603, y: 468.433, w: 215.825, h: 55.949 },
  { id: "tone-mill", x: 535.227, y: 482.597, w: 181.98, h: 55.949 },
  { id: "transit", x: 316.505, y: 128.046, w: 601.63, h: 55.949 },
  { id: "two-bulges", x: 379.2, y: 269.275, w: 506.874, h: 55.949 },
  { id: "vantage", x: 260.646, y: 313.755, w: 398.585, h: 55.949 },
  { id: "verse", x: 514.022, y: 371.009, w: 175.227, h: 55.949 },
  { id: "warren", x: 1024.111, y: 399.111, w: 242.917, h: 40.949 },
  { id: "weather-you-can-make", x: -193.196, y: 643.14, w: 520.407, h: 55.949 },
  { id: "why-the-sky-is-blue", x: -119.251, y: 474.025, w: 398.585, h: 55.949 },
  { id: "workbench", x: 605.012, y: 538.039, w: 215.825, h: 40.949 },
];

if (typeof module !== 'undefined' && module.exports) { module.exports = DOOR_MIRROR; }
