/* catalog-polar.mjs — the v2 SKY SOURCE OF TRUTH (§3.1/§3.2).
   GENERATED once by the W1.4 migration from the hand-laid sky.js CATALOG:
   per-group theta = circular mean of members' CURRENT bearings in TODAY's frame
   from the manor REGION centre (662,388) [compass 0=N 90=E 180=S 270=W]; lane groups
   hang at their lane-span centre. dx,dy = each member's offset from the group centroid
   (today's frame, pixel-rigid). hang = a one-time rigid rotation (deg): the two tall
   line-figures (feats/Optician 78x310, furnace 30x288) hang TANGENTIALLY; the two lane
   groups (pilot/drover) RE-ORIENT RADIALLY into their narrow lane; all others keep
   today's orientation (hang 0). Field stars carry their own bearing + a hash-staggered
   rOff (hash01(id)*70). derive-sky.mjs consumes this + the live solve to hang every
   figure on the DERIVED ring and emit the {id:{x,y,mag}} slab. This file is the
   authoring source; derive-sky is the geometry. All numbers are 0.1-rounded (theta 1 deg).
   Every |R| >= 0.988 (no degenerate bearing). Source: sky.js @ W1.3 (65 stars).
   Plus 3 NET-NEW field stars with NO migration antecedent (T2.6d, §2.6 round 9):
   glasshouse-range, orbit-house, estate-gate — the three rooms that post-date the W1.4
   catalog migration. Each takes a HAND-AUTHORED theta at its district bearing (gardens
   217°, observatory 307°, the gate at the road's 180°) — the only star positions that are
   neither migrated nor formula-derived. glasshouse-range/orbit-house keep the field-star
   depth stagger (rOff = hash01(id)*70); the GATE star's rOff is hand-pushed to clear the
   card-catalog road-tip footprint (which is seated ALONG the road BEYOND R_sky, so the
   default 31.5 collides — §4.2's "lantern over the gate" hangs it just past the gatehouse).
   All three then ride the same §3.1 de-confliction pass + per-star clearance asserts. */

export const GROUPS = {
  "automaton": { theta: 319, rOff: 20, lane: null, hang: 0 },  // |R| 1
  "carillonneur": { theta: 253, rOff: 20, lane: null, hang: 0 },  // |R| 1
  "celestial": { theta: 277, rOff: 20, lane: null, hang: 0 },  // |R| 1
  "coilwright": { theta: 169, rOff: 20, lane: null, hang: 0 },  // |R| 1
  "design": { theta: 43, rOff: 20, lane: null, hang: 0 },  // |R| 1
  "drover": { theta: 88, rOff: -190, lane: "east-lane", hang: 88 },  // |R| 1
  "feats": { theta: 261, rOff: 20, lane: null, hang: -8.8 },  // |R| 1
  "furnace": { theta: 112, rOff: 20, lane: null, hang: 19.2 },  // |R| 1
  "garden": { theta: 186, rOff: 20, lane: null, hang: 0 },  // |R| 1
  "labyrinth": { theta: 113, rOff: 20, lane: null, hang: 0 },  // |R| 1
  "letters": { theta: 342, rOff: 20, lane: null, hang: 0 },  // |R| 1
  "pilot": { theta: 252, rOff: -210, lane: "west-lane", hang: 72 },  // |R| 1
  "realm": { theta: 250, rOff: 20, lane: null, hang: 0 },  // |R| 1
  "reckoner": { theta: 124, rOff: 20, lane: null, hang: 0 },  // |R| 1
  "sirenist": { theta: 260, rOff: 20, lane: null, hang: 0 },  // |R| 1
  "strategist": { theta: 118, rOff: 20, lane: null, hang: 0 },  // |R| 1
  "surveyor": { theta: 240, rOff: 20, lane: null, hang: 0 },  // |R| 1
  "wagerer": { theta: 115, rOff: 20, lane: null, hang: 0 },  // |R| 1
};

export const STARS = {
  "context-window": { group: "automaton", dx: 23, dy: -54, mag: 1 },
  "temperature-dial": { group: "automaton", dx: -3, dy: -10, mag: 2 },
  "the-turn": { group: "automaton", dx: 57, dy: 30, mag: 2 },
  "partition": { group: "automaton", dx: -77, dy: 34, mag: 2 },
  "pin-barrel": { group: "carillonneur", dx: -21, dy: 13.5, mag: 1 },
  "mirror-drum": { group: "carillonneur", dx: 21, dy: -13.5, mag: 2 },
  "firmament": { group: "celestial", dx: 0, dy: -75, mag: 1 },
  "orrery": { group: "celestial", dx: 0, dy: 75, mag: 2 },
  "ten-fold": { group: "celestial", dx: 72, dy: 0, mag: 2 },
  "lodestone-hall": { group: "coilwright", dx: -60, dy: -6, mag: 1 },
  "bootstrap-bench": { group: "coilwright", dx: 60, dy: 6, mag: 1 },
  "compositor": { group: "design", dx: -50, dy: -12, mag: 1 },
  "blazon": { group: "design", dx: 50, dy: 12, mag: 2 },
  "the-shepherd": { group: "drover", dx: 0, dy: -30, mag: 1 },
  "the-standing-stones": { group: "drover", dx: 0, dy: 30, mag: 2 },
  "the-sluice-gate": { group: "drover", dx: 0, dy: 90, mag: 3 },
  "feat-rainbow": { group: "feats", dx: -0.2, dy: -150, mag: 1 },
  "feat-iridescence": { group: "feats", dx: 35.8, dy: -100, mag: 2 },
  "feat-spyglass": { group: "feats", dx: 37.8, dy: -26, mag: 2 },
  "feat-spectroscope": { group: "feats", dx: 37.8, dy: 100, mag: 2 },
  "feat-maze": { group: "feats", dx: 1.8, dy: 160, mag: 1 },
  "feat-polariser": { group: "feats", dx: -34.2, dy: 92, mag: 2 },
  "feat-camera": { group: "feats", dx: -40.2, dy: -18, mag: 2 },
  "feat-halo": { group: "feats", dx: -38.2, dy: -90, mag: 2 },
  "feat-anamorphosis": { group: "feats", dx: -0.2, dy: 32, mag: 2 },
  "carnot": { group: "furnace", dx: 11, dy: -134, mag: 1 },
  "demon": { group: "furnace", dx: -15, dy: -50, mag: 2 },
  "brownian": { group: "furnace", dx: 15, dy: 30, mag: 2 },
  "stirling": { group: "furnace", dx: -11, dy: 154, mag: 2 },
  "strange-garden": { group: "garden", dx: -50, dy: -4, mag: 1 },
  "tessellarium": { group: "garden", dx: 50, dy: 4, mag: 2 },
  "daedalus": { group: "labyrinth", dx: -10, dy: -60, mag: 1 },
  "ariadne": { group: "labyrinth", dx: 10, dy: 60, mag: 2 },
  "verse": { group: "letters", dx: -45, dy: -12, mag: 1 },
  "scriptorium": { group: "letters", dx: 45, dy: 12, mag: 2 },
  "refraction-run": { group: "pilot", dx: 0, dy: -31, mag: 1 },
  "starlight-bend": { group: "pilot", dx: 0, dy: 31, mag: 2 },
  "the-bead-that-falls-like-light": { group: "pilot", dx: 0, dy: 93, mag: 3 },  // Pilot's 3rd star: the least-time bead-road IS the least-time light-road
  "cartographer": { group: "realm", dx: 34, dy: -30, mag: 1 },
  "bastion": { group: "realm", dx: -34, dy: 30, mag: 2 },
  "differential-gear": { group: "reckoner", dx: -14, dy: -48, mag: 1 },
  "ball-and-disk": { group: "reckoner", dx: 14, dy: -24, mag: 2 },
  "planimeter": { group: "reckoner", dx: -14, dy: 0, mag: 3 },
  "pick-and-wheel": { group: "reckoner", dx: 14, dy: 24, mag: 3 },
  "slipstick": { group: "reckoner", dx: -14, dy: 48, mag: 2 },
  "tone-mill": { group: "sirenist", dx: 0, dy: 25.5, mag: 1 },
  "singing-plate": { group: "sirenist", dx: 0, dy: -25.5, mag: 2 },
  "strobe-mill": { group: "sirenist", dx: 0, dy: 76.5, mag: 3 },  // Sirenist's 3rd star: the promised free stroboscope — the same strobe rate, SEEN as a freeze
  "hexapawn": { group: "strategist", dx: 10, dy: -32.5, mag: 2 },
  "the-long-chain": { group: "strategist", dx: -10, dy: 32.5, mag: 1 },
  "holonomy": { group: "surveyor", dx: 45, dy: -15, mag: 1 },
  "unrolled-cone": { group: "surveyor", dx: -45, dy: 15, mag: 2 },
  "grabbable-triangle": { group: "surveyor", dx: 0, dy: 40, mag: 3 },
  "belief-beam": { group: "wagerer", dx: 0, dy: -31, mag: 1 },
  "likelihood-sluice": { group: "wagerer", dx: 0, dy: 31, mag: 2 },
  // ── field stars (own bearing + hash-staggered depth; group: null) ──
  "aerodrome": { group: null, theta: 312, rOff: 37.5, mag: 1 },
  "arcade": { group: null, theta: 76, rOff: 21.1, mag: 1 },
  "benford-mill": { group: null, theta: 202, rOff: 18.1, mag: 2 },
  "collisions": { group: null, theta: 108, rOff: 46.5, mag: 1 },
  "estate-gate": { group: null, theta: 180, rOff: 120, mag: 1 },  // NET-NEW (T2.6d): the gate at the road's 180°; rOff hand-pushed past the card-catalog road-tip foot
  "glasshouse-range": { group: null, theta: 217, rOff: 63.8, mag: 1 },  // NET-NEW (T2.6d): gardens bearing 217°
  "gnomon": { group: null, theta: 70, rOff: 45.7, mag: 1 },
  "magic-lantern": { group: null, theta: 60, rOff: 49.4, mag: 1 },  // NET-NEW (T6.3): the archive wing's picture house, hung beside its kin the museum (67°) in the open 43°–67° gap
  "museum": { group: null, theta: 67, rOff: 49.4, mag: 1 },
  "orbit-house": { group: null, theta: 307, rOff: 34.5, mag: 1 },  // NET-NEW (T2.6d): observatory bearing 307°
  "sound-garden": { group: null, theta: 95, rOff: 49.9, mag: 2 },
  "the-barrel-house": { group: null, theta: 258, rOff: 7, mag: 1 },
  "the-drawing-room": { group: null, theta: 217, rOff: 29, mag: 1 },
  "the-heap": { group: null, theta: 223, rOff: 4.3, mag: 1 },
  "the-keystone-arch": { group: null, theta: 129, rOff: 39.3, mag: 1 },
  "the-long-way-home": { group: null, theta: 262, rOff: 7.8, mag: 1 },
  "the-rolling-room": { group: null, theta: 117, rOff: 64.2, mag: 1 },
  "the-sightline": { group: null, theta: 281, rOff: 26.6, mag: 1 },
  "theogony": { group: null, theta: 143, rOff: 16.8, mag: 2 },
  "threshold": { group: null, theta: 85, rOff: 20, mag: 1 },
  "undercroft": { group: null, theta: 155, rOff: 1.7, mag: 2 },
  "workbench": { group: null, theta: 166, rOff: 18, mag: 1 },
};

export const HINTS = {
  "automaton": "Models its own making; keeps none of it.",
  "carillonneur": "Sets the pins, then lets the turning hand be the only clock.",
  "celestial": "Invents a sky; reads the true one.",
  "coilwright": "Makes the current by moving; pays for every spark.",
  "design": "Letter and shield, one measure.",
  "drover": "Never pushes the flock; only chooses where to stand — and when to open the gate.",
  "feats": "Bends every ray to its purpose.",
  "furnace": "Turns heat to work; never quite all of it.",
  "garden": "Tends the tile till the pattern comes true.",
  "labyrinth": "Builds the turning; keeps the way back.",
  "letters": "Speaks the verse; copies it fair.",
  "pilot": "Flies the least-time road; falls into the law.",
  "realm": "Draws the coast; raises the keep.",
  "reckoner": "Reckons by measuring a shape; the mean, the area, the product — each measured, never counted.",
  "sirenist": "Spins the rate you watch into the pitch you hear.",
  "strategist": "Wins by the move that looks like a mistake.",
  "surveyor": "Walks the loop; brings home the twist no chart can hide.",
  "wagerer": "Pours belief, never spills it; lets the evidence decide the level.",
  "aerodrome": "an unvisited hall of THE OBSERVATORY RISE",
  "arcade": "an unvisited hall of THE FAIRGROUND",
  "benford-mill": "an unvisited hall of THE NUMBER GARDEN",
  "collisions": "an unvisited hall of THE NUMBER GARDEN",
  "estate-gate": "the lantern over the estate's front gate",
  "glasshouse-range": "an unvisited hall of THE GLASSHOUSE GARDENS",
  "gnomon": "an unvisited hall of THE PROMENADES",
  "magic-lantern": "an unvisited hall of THE MANOR HOUSE",
  "museum": "an unvisited hall of THE MANOR HOUSE",
  "orbit-house": "an unvisited hall of THE OBSERVATORY RISE",
  "sound-garden": "an unvisited hall of THE MANOR HOUSE",
  "the-barrel-house": "an unvisited hall of THE MANOR HOUSE",
  "the-drawing-room": "an unvisited hall of THE NUMBER GARDEN",
  "the-heap": "an unvisited hall of THE FAIRGROUND",
  "the-keystone-arch": "an unvisited hall of THE WORKS",
  "the-long-way-home": "an unvisited hall of THE PROMENADES",
  "the-rolling-room": "an unvisited hall of THE FAIRGROUND",
  "the-sightline": "an unvisited hall of THE OBSERVATORY RISE",
  "theogony": "an unlit corner of the estate — a room you have yet to enter",
  "threshold": "an unvisited hall of THE MANOR HOUSE",
  "undercroft": "an unvisited hall of THE MANOR HOUSE",
  "workbench": "an unvisited hall of THE MAKER'S SHED",
};
