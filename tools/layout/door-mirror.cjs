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

   Captured 2026-06-27 over the 83 placed front-door POIs (headless agent-browser; door pill
   red 16/17 on CLAIM C′ — 20/35 tier-1 anchors survive, the faithful crowding red, NOT a
   gate fault). The twin tracks this exactly.
   ════════════════════════════════════════════════════════════════════════════ */
'use strict';

var DOOR_MIRROR = [
  { id: "aerodrome", x: 273.48, y: 81.468, w: 385.041, h: 55.865 },
  { id: "alchemy", x: 643.376, y: 557.102, w: 222.591, h: 40.865 },
  { id: "aquarium", x: 78.908, y: 503.37, w: 256.442, h: 55.865 },
  { id: "arcade", x: 1024.111, y: 217.662, w: 121.063, h: 40.865 },
  { id: "arctic-circle", x: 43.698, y: 574.01, w: 283.513, h: 55.865 },
  { id: "ball-and-disk", x: 725.318, y: 272.877, w: 439.183, h: 55.865 },
  { id: "belief-beam", x: 572.683, y: 645.942, w: 317.363, h: 55.865 },
  { id: "benford-mill", x: 547.5, y: 688.192, w: 330.899, h: 40.865 },
  { id: "birthday", x: 391.966, y: 742.308, w: 344.434, h: 55.865 },
  { id: "bootstrap-bench", x: 244.553, y: 631.119, w: 405.356, h: 55.865 },
  { id: "brazil-nut-box", x: 1024.111, y: 386.912, w: 276.733, h: 55.865 },
  { id: "breathing-star", x: -13.553, y: 281.505, w: 297.048, h: 55.865 },
  { id: "card-catalog", x: 731.881, y: 364.989, w: 269.977, h: 40.865 },
  { id: "cartographer", x: 488.526, y: 354.088, w: 195.52, h: 55.865 },
  { id: "cartouche", x: -18.352, y: 753.039, w: 378.285, h: 55.865 },
  { id: "casting-floor", x: 850.547, y: 661.587, w: 621.947, h: 55.865 },
  { id: "clockwork", x: 725.318, y: 504.276, w: 310.584, h: 40.865 },
  { id: "collisions", x: 367.181, y: 777.058, w: 242.906, h: 40.865 },
  { id: "compositor", x: 551.822, y: 382.608, w: 161.694, h: 55.865 },
  { id: "conservatory", x: 1164.972, y: 569.984, w: 263.222, h: 40.865 },
  { id: "construction-bench", x: 931.174, y: 509.174, w: 418.891, h: 55.865 },
  { id: "daedalus", x: 917.385, y: 386.556, w: 175.229, h: 55.865 },
  { id: "differential-gear", x: 341.685, y: 301.396, w: 364.749, h: 55.865 },
  { id: "dissection", x: 416.142, y: 292.387, w: 290.292, h: 40.865 },
  { id: "einstein-ring", x: 328.846, y: 162.835, w: 486.569, h: 55.865 },
  { id: "engine-room", x: 834.033, y: 557.102, w: 256.442, h: 40.865 },
  { id: "equal-area-sweep", x: -139.428, y: 269.163, w: 452.718, h: 55.865 },
  { id: "firmament", x: 242.181, y: 198.135, w: 175.229, h: 55.865 },
  { id: "first-light", x: 126.589, y: 318.137, w: 371.505, h: 55.865 },
  { id: "gnomon", x: 1023.551, y: 125.992, w: 330.899, h: 40.865 },
  { id: "hall-of-mirrors", x: 197.315, y: 446.667, w: 229.371, h: 40.865 },
  { id: "hexapawn", x: 326.176, y: 668.826, w: 425.647, h: 40.865 },
  { id: "holonomy", x: -165.234, y: 536.676, w: 351.19, h: 55.865 },
  { id: "iron-filings", x: 710.484, y: 727.567, w: 242.906, h: 40.865 },
  { id: "kirigami", x: 119.419, y: 644.65, w: 215.931, h: 55.865 },
  { id: "lodestone-hall", x: 700.091, y: 809.015, w: 351.19, h: 55.865 },
  { id: "loud-and-quiet", x: 519.457, y: 537.04, w: 351.19, h: 55.865 },
  { id: "midway", x: 783.589, y: 182.19, w: 202.3, h: 55.865 },
  { id: "murmuration-meter", x: 1024.111, y: 345.968, w: 253.471, h: 55.865 },
  { id: "museum", x: 307.213, y: 423.998, w: 385.041, h: 55.865 },
  { id: "numbers-room", x: 299.241, y: 722.942, w: 256.442, h: 40.865 },
  { id: "overhang", x: 947.138, y: 786.638, w: 378.285, h: 40.865 },
  { id: "parallax-baseline", x: -32.674, y: 222.425, w: 303.828, h: 55.865 },
  { id: "physics-lab", x: 1007.385, y: 611.301, w: 175.229, h: 40.865 },
  { id: "pick-and-wheel", x: 387.299, y: 346.424, w: 303.828, h: 40.865 },
  { id: "pool", x: -44.786, y: 415.401, w: 324.119, h: 55.865 },
  { id: "puzzle-pavilion", x: 870.011, y: 230.218, w: 269.977, h: 40.865 },
  { id: "quiet-room", x: 115.514, y: 698.442, w: 324.119, h: 55.865 },
  { id: "rattleback", x: -149.883, y: 691.567, w: 337.655, h: 40.865 },
  { id: "reckoning", x: 732.399, y: 292.387, w: 324.119, h: 40.865 },
  { id: "recombination", x: 293.546, y: 249.409, w: 310.584, h: 55.865 },
  { id: "refraction-run", x: 112.712, y: 384.135, w: 398.576, h: 55.865 },
  { id: "relativity", x: 286.71, y: 180.288, w: 337.655, h: 55.865 },
  { id: "reversing-room", x: 732.399, y: 439.573, w: 269.977, h: 55.865 },
  { id: "ripple", x: 367.315, y: 487.389, w: 229.371, h: 55.865 },
  { id: "sewing-room", x: 615.714, y: 511.357, w: 236.127, h: 40.865 },
  { id: "sound-garden", x: 617.23, y: 472.007, w: 181.985, h: 40.865 },
  { id: "spinning-chair", x: 1024.111, y: 258.607, w: 344.434, h: 40.865 },
  { id: "stellar-forge", x: -25.895, y: 162.835, w: 297.048, h: 55.865 },
  { id: "strange-garden", x: 253.85, y: 564.403, w: 202.3, h: 55.865 },
  { id: "sultans-suitors", x: 572.683, y: 750.192, w: 330.899, h: 55.865 },
  { id: "the-coin-that-lies", x: 422.029, y: 811.808, w: 385.041, h: 55.865 },
  { id: "the-drawing-room", x: -92.785, y: 803.094, w: 452.718, h: 55.865 },
  { id: "the-heap", x: 1032.028, y: 454.428, w: 337.655, h: 55.865 },
  { id: "the-keystone-arch", x: 1022, y: 737.567, w: 405.356, h: 40.865 },
  { id: "the-long-way-home", x: 748.296, y: 103.839, w: 317.363, h: 55.865 },
  { id: "the-phantom-jam", x: 892.195, y: 468.444, w: 225.61, h: 55.865 },
  { id: "the-rolling-room", x: 1024.111, y: 427.857, w: 250.165, h: 55.865 },
  { id: "the-shepherd", x: 749.762, y: 340.495, w: 236.127, h: 40.865 },
  { id: "the-sightline", x: 66.873, y: 136.293, w: 466.253, h: 40.865 },
  { id: "the-top", x: 1032.028, y: 311.123, w: 317.363, h: 55.865 },
  { id: "the-wrinkling", x: 1164.972, y: 635.151, w: 317.363, h: 40.865 },
  { id: "threshold", x: 490.599, y: 419.898, w: 215.836, h: 55.865 },
  { id: "tone-mill", x: 534.697, y: 484.601, w: 181.985, h: 55.865 },
  { id: "transit", x: 387.842, y: 237.067, w: 601.632, h: 55.865 },
  { id: "two-bulges", x: -223.389, y: 346.005, w: 506.884, h: 55.865 },
  { id: "unrolled-cone", x: -219.399, y: 607.459, w: 405.356, h: 55.865 },
  { id: "vantage", x: -179.581, y: 192.63, w: 398.576, h: 55.865 },
  { id: "verse", x: 725.318, y: 382.608, w: 175.229, h: 55.865 },
  { id: "warren", x: 742.982, y: 320.023, w: 242.906, h: 40.865 },
  { id: "weather-you-can-make", x: 374.65, y: 595.6, w: 520.419, h: 55.865 },
  { id: "why-the-sky-is-blue", x: -119.243, y: 474.067, w: 398.576, h: 55.865 },
  { id: "workbench", x: 307.153, y: 538.123, w: 215.836, h: 40.865 },
];

if (typeof module !== 'undefined' && module.exports) { module.exports = DOOR_MIRROR; }
