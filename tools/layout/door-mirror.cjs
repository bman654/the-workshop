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

   Captured 2026-06-29 over the 85 placed front-door POIs (headless agent-browser; tier-1
   boxes at h=55.949 / tier-2 at h=40.949 — the canonical #337 headless serif). Adding THE
   STANDING STONES POI (#358) re-annealed the WHOLE label solve, so this mirror was regenerated
   to track the new placement (#360). The live door pill reads ✗16/17 — CLAIM C′ crowding,
   the standing #103 hierarchy pressure, faithfully reported, NOT a regression in this gate;
   the full-plate CROWDED 0.93 is the same non-failing warning. The twin tracks this exactly:
   it goes red iff the live pill is red, claim-for-claim, and exits 1 (a FAITHFUL red), not 2.
   ════════════════════════════════════════════════════════════════════════════ */
'use strict';

var DOOR_MIRROR = [
{ id: "aerodrome", x: 273.474, y: 81.384, w: 385.052, h: 55.949 },
  { id: "alchemy", x: 643.363, y: 557.018, w: 222.605, h: 40.949 },
  { id: "aquarium", x: 70.761, y: 550.91, w: 256.45, h: 55.949 },
  { id: "arcade", x: 944.466, y: 208.341, w: 121.069, h: 40.949 },
  { id: "arctic-circle", x: 43.695, y: 573.968, w: 283.516, h: 55.949 },
  { id: "ball-and-disk", x: 732.399, y: 317.863, w: 439.183, h: 55.949 },
  { id: "belief-beam", x: 572.683, y: 645.9, w: 317.361, h: 55.949 },
  { id: "benford-mill", x: 348.37, y: 633.993, w: 330.894, h: 40.949 },
  { id: "birthday", x: 391.97, y: 742.308, w: 344.427, h: 55.949 },
  { id: "bootstrap-bench", x: 710.484, y: 684.101, w: 405.338, h: 55.949 },
  { id: "brazil-nut-box", x: 866.632, y: 491.69, w: 276.736, h: 55.949 },
  { id: "breathing-star", x: 316.505, y: 281.505, w: 297.049, h: 55.949 },
  { id: "card-catalog", x: 414.063, y: 405.193, w: 269.983, h: 40.949 },
  { id: "cartographer", x: 488.507, y: 354.047, w: 195.539, h: 55.949 },
  { id: "cartouche", x: -18.339, y: 753.039, w: 378.272, h: 55.949 },
  { id: "casting-floor", x: 850.547, y: 661.504, w: 621.943, h: 55.949 },
  { id: "clockwork", x: 552.932, y: 511.357, w: 310.582, h: 40.949 },
  { id: "collisions", x: 212.033, y: 722.9, w: 242.917, h: 40.949 },
  { id: "compositor", x: 551.822, y: 292.468, w: 161.694, h: 55.949 },
  { id: "conservatory", x: 1149.457, y: 627.873, w: 263.203, h: 40.949 },
  { id: "construction-bench", x: 931.174, y: 509.174, w: 418.897, h: 55.949 },
  { id: "daedalus", x: 803.67, y: 323.496, w: 175.227, h: 55.949 },
  { id: "differential-gear", x: 747.707, y: 256.284, w: 364.739, h: 55.949 },
  { id: "dissection", x: 423.22, y: 329.915, w: 290.296, h: 40.949 },
  { id: "einstein-ring", x: 328.846, y: 162.751, w: 486.561, h: 55.949 },
  { id: "engine-room", x: 834.033, y: 557.018, w: 256.45, h: 40.949 },
  { id: "equal-area-sweep", x: 353.137, y: 224.684, w: 452.743, h: 55.949 },
  { id: "firmament", x: 346.3, y: 293.846, w: 175.227, h: 55.949 },
  { id: "first-light", x: -75.682, y: 311.3, w: 371.519, h: 55.949 },
  { id: "gnomon", x: 1023.553, y: 125.908, w: 330.894, h: 40.949 },
  { id: "hall-of-mirrors", x: 197.308, y: 446.667, w: 229.385, h: 40.949 },
  { id: "hexapawn", x: 326.175, y: 777.058, w: 425.65, h: 40.949 },
  { id: "holonomy", x: -165.25, y: 536.634, w: 351.207, h: 55.949 },
  { id: "iron-filings", x: 710.484, y: 727.525, w: 242.917, h: 40.949 },
  { id: "kirigami", x: 247.074, y: 652.789, w: 215.852, h: 55.949 },
  { id: "lodestone-hall", x: 710.484, y: 755.95, w: 351.207, h: 55.949 },
  { id: "loud-and-quiet", x: 93.337, y: 406.178, w: 351.207, h: 55.949 },
  { id: "midway", x: 784.25, y: 181.967, w: 202.292, h: 55.949 },
  { id: "murmuration-meter", x: 1023.458, y: 446.006, w: 253.378, h: 55.949 },
  { id: "museum", x: 740.088, y: 376.209, w: 385.052, h: 55.949 },
  { id: "numbers-room", x: 461.141, y: 668.743, w: 256.45, h: 40.949 },
  { id: "overhang", x: 947.138, y: 786.638, w: 378.272, h: 40.949 },
  { id: "parallax-baseline", x: 135.744, y: 215.504, w: 303.828, h: 55.949 },
  { id: "physics-lab", x: 1007.387, y: 611.218, w: 175.227, h: 40.949 },
  { id: "pick-and-wheel", x: 387.299, y: 271.284, w: 303.828, h: 40.949 },
  { id: "pool", x: -35.239, y: 466.432, w: 324.141, h: 55.949 },
  { id: "puzzle-pavilion", x: 870.008, y: 227.361, w: 269.983, h: 40.949 },
  { id: "quiet-room", x: 301.38, y: 688.493, w: 324.141, h: 55.949 },
  { id: "rattleback", x: -149.902, y: 691.525, w: 337.674, h: 40.949 },
  { id: "reckoning", x: 725.318, y: 254.775, w: 324.141, h: 40.949 },
  { id: "recombination", x: -63.718, y: 249.367, w: 310.582, h: 55.949 },
  { id: "refraction-run", x: -109.683, y: 393.619, w: 398.585, h: 55.949 },
  { id: "relativity", x: 101.368, y: 173.368, w: 337.674, h: 55.949 },
  { id: "reversing-room", x: 732.399, y: 439.531, w: 269.983, h: 55.949 },
  { id: "ripple", x: 215.159, y: 341.011, w: 229.385, h: 55.949 },
  { id: "sewing-room", x: 480.544, y: 429.136, w: 236.138, h: 40.949 },
  { id: "sound-garden", x: 509.147, y: 464.926, w: 181.98, h: 40.949 },
  { id: "spinning-chair", x: 1031.103, y: 292.958, w: 344.427, h: 40.949 },
  { id: "stellar-forge", x: -25.895, y: 162.751, w: 297.049, h: 55.949 },
  { id: "strange-garden", x: 124.918, y: 620.083, w: 202.292, h: 55.949 },
  { id: "sultans-suitors", x: 184.289, y: 801.942, w: 330.894, h: 55.949 },
  { id: "the-coin-that-lies", x: 422.023, y: 811.808, w: 385.052, h: 55.949 },
  { id: "the-deep-hearth", x: -12.431, y: 496.803, w: 439.183, h: 55.949 },
  { id: "the-drawing-room", x: -92.809, y: 685.012, w: 452.743, h: 55.949 },
  { id: "the-heap", x: 1031.103, y: 456.632, w: 337.674, h: 55.949 },
  { id: "the-keystone-arch", x: 1022, y: 737.525, w: 405.338, h: 40.949 },
  { id: "the-long-way-home", x: 748.296, y: 103.755, w: 317.361, h: 55.949 },
  { id: "the-phantom-jam", x: 761.024, y: 465.025, w: 225.518, h: 55.949 },
  { id: "the-rolling-room", x: 736.475, y: 522.083, w: 250.068, h: 55.949 },
  { id: "the-shepherd", x: 1023.458, y: 407.967, w: 236.138, h: 40.949 },
  { id: "the-sightline", x: 66.862, y: 136.209, w: 466.275, h: 40.949 },
  { id: "the-standing-stones", x: 1023.458, y: 334.122, w: 283.516, h: 55.949 },
  { id: "the-top", x: 1023.458, y: 258.045, w: 317.361, h: 55.949 },
  { id: "the-wrinkling", x: 1149.457, y: 577.178, w: 317.361, h: 40.949 },
  { id: "threshold", x: 622.699, y: 367.705, w: 215.825, h: 55.949 },
  { id: "tone-mill", x: 534.702, y: 484.601, w: 181.98, h: 55.949 },
  { id: "transit", x: -253.635, y: 281.505, w: 601.63, h: 55.949 },
  { id: "two-bulges", x: 46.563, y: 352.842, w: 506.874, h: 55.949 },
  { id: "unrolled-cone", x: -219.381, y: 607.417, w: 405.338, h: 55.949 },
  { id: "vantage", x: -179.59, y: 192.546, w: 398.585, h: 55.949 },
  { id: "verse", x: 725.318, y: 292.468, w: 175.227, h: 55.949 },
  { id: "warren", x: 1023.458, y: 388.948, w: 242.917, h: 40.949 },
  { id: "weather-you-can-make", x: 374.65, y: 595.516, w: 520.407, h: 55.949 },
  { id: "why-the-sky-is-blue", x: 335.099, y: 525.099, w: 398.585, h: 55.949 },
  { id: "workbench", x: 290.175, y: 599.525, w: 215.825, h: 40.949 },
];

if (typeof module !== 'undefined' && module.exports) { module.exports = DOOR_MIRROR; }
