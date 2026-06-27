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

   ENV NOTE (load-bearing): capture in a HEADLESS agent-browser session (the canonical
   #337 env) — its getBBox lands the tier-1 boxes at h≈55.9 and tier-2 at h≈40.9 (block
   35/50 pre-PAD). A HEADED Chrome on the same Mac rasterizes the serif ~1px taller
   (h≈57 / 42), which drifts the mirror off the legibility.cjs model; if the dumped tier-1
   heights read ~57, you captured headed — recapture headless.

   Captured 2026-06-27 over the 81 placed front-door POIs (headless agent-browser, door pill green 17/17).
   ════════════════════════════════════════════════════════════════════════════ */
'use strict';

var DOOR_MIRROR = [
  { id: "aerodrome", x: 273.48, y: 81.468, w: 385.041, h: 55.865 },
  { id: "alchemy", x: 643.376, y: 557.102, w: 222.591, h: 40.865 },
  { id: "aquarium", x: 78.908, y: 503.37, w: 256.442, h: 55.865 },
  { id: "arcade", x: 1024.111, y: 217.662, w: 121.063, h: 40.865 },
  { id: "arctic-circle", x: 43.698, y: 574.01, w: 283.513, h: 55.865 },
  { id: "belief-beam", x: 380.318, y: 584.326, w: 317.363, h: 55.865 },
  { id: "benford-mill", x: 547.5, y: 688.192, w: 330.899, h: 40.865 },
  { id: "birthday", x: 391.966, y: 742.308, w: 344.434, h: 55.865 },
  { id: "bootstrap-bench", x: 700.091, y: 631.119, w: 405.356, h: 55.865 },
  { id: "brazil-nut-box", x: 1032.028, y: 433.956, w: 276.733, h: 55.865 },
  { id: "breathing-star", x: 323.342, y: 237.067, w: 297.048, h: 55.865 },
  { id: "card-catalog", x: 411.909, y: 398.619, w: 269.977, h: 40.865 },
  { id: "cartographer", x: 486.366, y: 343.366, w: 195.52, h: 55.865 },
  { id: "cartouche", x: 422.067, y: 635.04, w: 378.285, h: 55.865 },
  { id: "casting-floor", x: 850.547, y: 661.587, w: 621.947, h: 55.865 },
  { id: "clockwork", x: 551.729, y: 511.485, w: 310.584, h: 40.865 },
  { id: "collisions", x: 221.91, y: 767.192, w: 242.906, h: 40.865 },
  { id: "compositor", x: 650.669, y: 378.371, w: 161.694, h: 55.865 },
  { id: "conservatory", x: 1149.457, y: 627.873, w: 263.222, h: 40.865 },
  { id: "construction-bench", x: 931.174, y: 509.174, w: 418.891, h: 55.865 },
  { id: "daedalus", x: 1032.028, y: 331.595, w: 175.229, h: 55.865 },
  { id: "differential-gear", x: 749.288, y: 258.074, w: 364.749, h: 55.865 },
  { id: "dissection", x: 586.369, y: 338.784, w: 290.292, h: 40.865 },
  { id: "einstein-ring", x: -190.732, y: 162.835, w: 486.569, h: 55.865 },
  { id: "engine-room", x: 834.033, y: 557.102, w: 256.442, h: 40.865 },
  { id: "equal-area-sweep", x: 346.3, y: 180.288, w: 452.718, h: 55.865 },
  { id: "firmament", x: 242.181, y: 300.683, w: 175.229, h: 55.865 },
  { id: "first-light", x: -75.668, y: 222.425, w: 371.505, h: 55.865 },
  { id: "gnomon", x: 1023.551, y: 125.992, w: 330.899, h: 40.865 },
  { id: "hall-of-mirrors", x: 335.099, y: 437.099, w: 229.371, h: 40.865 },
  { id: "hexapawn", x: 79.67, y: 722.942, w: 425.647, h: 40.865 },
  { id: "holonomy", x: 69.405, y: 470.992, w: 351.19, h: 55.865 },
  { id: "iron-filings", x: 407.003, y: 682.044, w: 242.906, h: 40.865 },
  { id: "kirigami", x: 247.034, y: 652.789, w: 215.931, h: 55.865 },
  { id: "lodestone-hall", x: 710.484, y: 755.992, w: 351.19, h: 55.865 },
  { id: "loud-and-quiet", x: 306.405, y: 552.556, w: 351.19, h: 55.865 },
  { id: "midway", x: 783.589, y: 182.19, w: 202.3, h: 55.865 },
  { id: "murmuration-meter", x: 878.264, y: 447.972, w: 253.471, h: 55.865 },
  { id: "museum", x: 296.846, y: 367.614, w: 385.041, h: 55.865 },
  { id: "numbers-room", x: 461.145, y: 777.058, w: 256.442, h: 40.865 },
  { id: "overhang", x: 947.138, y: 786.638, w: 378.285, h: 40.865 },
  { id: "parallax-baseline", x: 135.744, y: 318.137, w: 303.828, h: 55.865 },
  { id: "physics-lab", x: 1177.833, y: 714.567, w: 175.229, h: 40.865 },
  { id: "pick-and-wheel", x: 378.059, y: 311.279, w: 303.828, h: 40.865 },
  { id: "pool", x: -44.786, y: 415.401, w: 324.119, h: 55.865 },
  { id: "puzzle-pavilion", x: 715.911, y: 238.134, w: 269.977, h: 40.865 },
  { id: "quiet-room", x: 301.391, y: 811.808, w: 324.119, h: 55.865 },
  { id: "rattleback", x: -149.883, y: 691.567, w: 337.655, h: 40.865 },
  { id: "reckoning", x: 724.793, y: 331.422, w: 324.119, h: 40.865 },
  { id: "recombination", x: -56.884, y: 293.846, w: 310.584, h: 55.865 },
  { id: "refraction-run", x: -109.675, y: 393.703, w: 398.576, h: 55.865 },
  { id: "relativity", x: 101.378, y: 173.452, w: 337.655, h: 55.865 },
  { id: "reversing-room", x: 732.155, y: 436.892, w: 269.977, h: 55.865 },
  { id: "ripple", x: 367.315, y: 487.389, w: 229.371, h: 55.865 },
  { id: "sewing-room", x: 473.719, y: 465.918, w: 236.127, h: 40.865 },
  { id: "sound-garden", x: 616.028, y: 468.433, w: 181.985, h: 40.865 },
  { id: "spinning-chair", x: 1024.111, y: 258.607, w: 344.434, h: 40.865 },
  { id: "stellar-forge", x: 139.134, y: 258.546, w: 297.048, h: 55.865 },
  { id: "strange-garden", x: 124.911, y: 620.125, w: 202.3, h: 55.865 },
  { id: "sultans-suitors", x: 562.817, y: 801.942, w: 330.899, h: 55.865 },
  { id: "the-coin-that-lies", x: 638.367, y: 698.442, w: 385.041, h: 55.865 },
  { id: "the-drawing-room", x: -92.785, y: 803.094, w: 452.718, h: 55.865 },
  { id: "the-heap", x: 1024.111, y: 407.384, w: 337.655, h: 55.865 },
  { id: "the-keystone-arch", x: 1022, y: 737.567, w: 405.356, h: 40.865 },
  { id: "the-long-way-home", x: 748.296, y: 103.839, w: 317.363, h: 55.865 },
  { id: "the-phantom-jam", x: 892.195, y: 358.523, w: 225.61, h: 55.865 },
  { id: "the-rolling-room", x: 1032.028, y: 474.901, w: 250.165, h: 55.865 },
  { id: "the-shepherd", x: 1032.028, y: 380.04, w: 236.127, h: 40.865 },
  { id: "the-sightline", x: 316.505, y: 143.13, w: 466.253, h: 40.865 },
  { id: "the-top", x: 1032.028, y: 311.123, w: 317.363, h: 55.865 },
  { id: "the-wrinkling", x: 1149.457, y: 577.261, w: 317.363, h: 40.865 },
  { id: "threshold", x: 490.546, y: 415.366, w: 215.836, h: 55.865 },
  { id: "tone-mill", x: 752.752, y: 482.597, w: 181.985, h: 55.865 },
  { id: "transit", x: 381.005, y: 281.505, w: 601.632, h: 55.865 },
  { id: "two-bulges", x: -223.389, y: 346.005, w: 506.884, h: 55.865 },
  { id: "vantage", x: -186.418, y: 237.067, w: 398.576, h: 55.865 },
  { id: "verse", x: 724.793, y: 371.009, w: 175.229, h: 55.865 },
  { id: "warren", x: 883.547, y: 407.028, w: 242.906, h: 40.865 },
  { id: "weather-you-can-make", x: -193.208, y: 643.182, w: 520.419, h: 55.865 },
  { id: "why-the-sky-is-blue", x: -109.675, y: 525.099, w: 398.576, h: 55.865 },
  { id: "workbench", x: 307.153, y: 538.123, w: 215.836, h: 40.865 },
];

if (typeof module !== 'undefined' && module.exports) { module.exports = DOOR_MIRROR; }
