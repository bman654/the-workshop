/* ═══════════════════════════════════════════════════════════════════════════
   sky.js — "The Survey of Heaven": the front door's personal night sky.

   A cross-page metagame whose visible surface IS the estate map. The dark
   margins of the surveyor's plate are a night sky that RECORDS WHERE YOU HAVE
   BEEN. First visit to any room kindles a star over the dark band beside it;
   rooms in the same WING are joined by a faint asterism line; visiting ALL of a
   wing's members COMPLETES its asterism (lines brighten to brass; an engraved
   name + a one-line myth appear in the margin); completing every wing fires an
   all-skies capstone.

   It reads the `ws:seen:<id>` breadcrumb that EVERY page already drops, so it
   needs NO per-page instrumentation. Always-visible, MONOTONE (visiting more
   only ever ADDS — never removes a star/line/completion), never gated,
   cosmetics-only. It never confers access and touches NO existing predicate.

   The workshop's celestial vein, third register: Firmament invents skies, the
   Orrery shows the real one, the Almanac reads real ephemeris — and the Survey
   of Heaven maps YOUR visits onto a personal sky.

   Vanilla, ES5-ish, zero-dependency. A pure, DOM-free core (state/CATALOG/WINGS)
   + a thin DOM renderer (renderInto/bootstrap). Reads cross-page state from the
   SAME `ws:` bucket via the existing WS global; writes ONLY new cosmetic
   namespaced flags (`ws:flag:sky-<id>-named`, `ws:flag:sky-bootstrap`,
   `ws:flag:firmament-survey`) — additive, affecting no existing predicate.

   Inlined into the front door VIA forge (`<!-- forge:include tools/sky/sky.js
   -->`); forge strips the module guard at the bottom. In a browser this attaches
   a `Sky` global; in Node it exports the same object for the self-test.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Sky = {};

  /* ── DATA: the star catalog ────────────────────────────────────────────────
     One star per front-door-visitable id (front-door POIs + their companions).
     Positions are HAND-PLACED in the DARK MARGINS of the 1440×900 viewBox —
     outer bands & corners — AWAY from the manor candle-pool (x421 y150 600×600)
     and clear of every footprint + plan-furniture bbox (proven by the self-test).
     `mag` is a visual magnitude 1..3 (1 = brightest/biggest): wing "lead" stars
     read a touch brighter than their companions, so an asterism has structure. */
  var CATALOG = {
    // celestial — the Observatory tower sits upper-left; its stars hug that corner
    'firmament':      { x: 120,  y: 250, mag: 1 },
    'orrery':         { x: 120,  y: 400, mag: 2 },
    // The Sightline — the vantages wing's SECOND room (the figure you draw by
    // walking). A field star in the upper-left observatory band beside its
    // celestial kin (firmament 70px / orrery 100px away), NOT part of the celestial
    // asterism; lit on first visit (ws:seen:the-sightline). Verified clear of every
    // footprint/furniture box, the manor pool, the viewBox edge, and every existing
    // catalog star by sky.test.cjs CATALOG INTEGRITY.
    'the-sightline':  { x: 190,  y: 300, mag: 1 },
    // letters — the Study reads upper-left-of-centre; stars ride the top band
    'verse':          { x: 520,  y: 96,  mag: 1 },
    'scriptorium':    { x: 610,  y: 120, mag: 2 },
    // design — the Print Room upper-right-of-centre; stars ride the top band, right
    'compositor':     { x: 880,  y: 96,  mag: 1 },
    'blazon':         { x: 980,  y: 120, mag: 2 },
    // realm — the Map Room left-of-centre; stars in the left margin band, lower
    'cartographer':   { x: 130,  y: 560, mag: 1 },
    'bastion':        { x: 62,   y: 620, mag: 2 },
    // garden — the Glasshouse lower-left; stars ride the bottom band, left-of-centre
    'strange-garden': { x: 560,  y: 850, mag: 1 },
    'tessellarium':   { x: 660,  y: 858, mag: 2 },
    // labyrinth — the Hedge Maze lower-right; stars hug the lower-right corner
    'daedalus':       { x: 1300, y: 600, mag: 1 },
    'ariadne':        { x: 1320, y: 720, mag: 2 },
    // ── field stars: kindled rooms not (yet) paired into an asterism ──
    'sound-garden':   { x: 1330, y: 450, mag: 2 },
    'threshold':      { x: 1340, y: 330, mag: 1 },
    'theogony':       { x: 1000, y: 840, mag: 2 },
    'arcade':         { x: 1330, y: 220, mag: 1 },
    'workbench':      { x: 780,  y: 860, mag: 1 },
    'undercroft':     { x: 880,  y: 850, mag: 2 },
    // The Museum — the archive wing's grand hall (the Centennial Jubilee · River of
    // Days). A field star in the upper-right archive band beside its kin (gnomon
    // 1270,170); lit on first visit. Position VERIFIED clear of the archive-wing
    // colonnade footprint + every box by sky.test.cjs CATALOG INTEGRITY.
    'museum':         { x: 1150, y: 178, mag: 1 },
    // The Hours — the estate's sundial (horology wing). A field star in the dark
    // top-right margin beside its open east-park footprint; lit on first visit.
    'gnomon':         { x: 1270, y: 170, mag: 1 },
    // The Aerodrome — the upper-LEFT sky court's launch wing (kick-the-conic). A
    // field star in the dark top band above its open launch-rail footprint, the
    // craft's first apoapsis hanging over the rail; lit on first visit. Verified
    // clear of partition@318,122 / temperature-dial@392,78 / the manor pool, and
    // every footprint+furniture box (sky.test.cjs CATALOG INTEGRITY).
    'aerodrome':      { x: 360,  y: 120, mag: 1 },
    // The Clack Counter — the number wing's collisions room (heard π in 314 clacks).
    // A FEATS-flavoured field star in the dark lower band right of the manor pool,
    // near its grounds kin; lit on first visit (ws:seen:collisions). Verified clear
    // of every footprint/furniture box, the manor pool, the viewBox edge, and every
    // existing catalog star (nearest = daedalus @126px) by sky.test.cjs CATALOG INTEGRITY.
    'collisions':     { x: 1180, y: 560, mag: 1 },
    // The Miller — the number wing's Benford Mill (why a 1 leads 30% of the time). A field star
    // in the dark lower-left park band just below its number-wing footprint (x552 y677), near its
    // garden kin strange-garden (81px away); lit on first visit (ws:seen:benford-mill). Verified
    // clear of every footprint/furniture box, the manor pool, the viewBox edge, and every existing
    // catalog star by sky.test.cjs CATALOG INTEGRITY.
    'benford-mill':   { x: 490,  y: 810, mag: 2 },
    // The Matchbox That Learns — the number wing's self-teaching Hexapawn machine. A field star
    // in the dark lower band right of the manor pool, near its games kin The Clack Counter
    // (collisions @120px); lit on first visit (ws:seen:hexapawn). Verified clear of every
    // footprint/furniture box, the manor pool, the viewBox edge, and every existing catalog star
    // by sky.test.cjs CATALOG INTEGRITY (re-runnable /tmp star-placement verifier).
    'hexapawn':       { x: 1060, y: 560, mag: 2 },
    // The Long Chain — the number wing's Dots-and-Boxes room (the game greedy loses). A field star
    // a tight companion below-left of its games kin The Matchbox (hexapawn @1060,560): Δ(20,65) →
    // ≥2*STAR_PAD(12) on the y-axis (the test's both-axes rule). The SECOND member of The Strategist
    // feat-group, so its asterism reads ≥2 stars and the engraved name sits over two dots. Lit on
    // first visit (ws:seen:the-long-chain). Verified clear of every footprint/furniture box, the manor
    // pool, the viewBox edge, and every existing catalog star by sky.test.cjs CATALOG INTEGRITY.
    'the-long-chain': { x: 1040, y: 625, mag: 1 },
    // The Belief Beam — the number wing's Bayesian apparatus (belief is a conserved liquid).
    // A FEATS-flavoured field star in the dark lower-right band below the manor pool, between
    // its number-wing kin collisions (1180,560) and differential-gear (1180,700); lit on first
    // visit (ws:seen:belief-beam). The lead member of The Wagerer feat-group. Verified clear of
    // every footprint/furniture box, the manor pool, the viewBox edge, and every existing catalog
    // star by sky.test.cjs CATALOG INTEGRITY (re-runnable /tmp star-placement verifier).
    'belief-beam':    { x: 1240, y: 630, mag: 1 },
    // The Likelihood Sluice — a tight mag-2 companion 62px directly below belief-beam (1240,630),
    // the Wagerer feat-group's pre-named 2nd star (lit on first visit, ws:seen:likelihood-sluice).
    // Verified clear: nearest the-rolling-room Δ(35,32), differential-gear Δ(60,8), belief-beam
    // Δ(0,62) — all ≥ 2*STAR_PAD(24) on at least one axis (the test's both-axes rule); inside the
    // 1440×900 viewBox. Re-confirmed clear of every catalog star by sky.test.cjs CATALOG INTEGRITY.
    'likelihood-sluice': { x: 1240, y: 692, mag: 2 },
    // ── the feats constellation: nine "Feats of Light" earned in the Hall of Mirrors,
    //    laid out as a vertical LENS (a pointed oval) threading the WEST GROUNDS left
    //    margin beside the Hall footprint (x124 y430 w148 h74). These are PSEUDO-ids
    //    (no room/POI of their own); each kindles iff its `ws:flag:earned-<X>` is set.
    //    Positioned to clear every footprint/furniture box, the manor pool, and every
    //    existing catalog star (proven by the self-test). The lens RIM goes clockwise
    //    from the top apex (rainbow); anamorphosis is the lens axis/centre. mag1 = the
    //    two apices (the lens points), mag2 = the rim & axis. ──
    'feat-rainbow':      { x: 60,  y: 338, mag: 1 }, // top apex
    'feat-iridescence':  { x: 96,  y: 388, mag: 2 }, // upper-right flank
    'feat-spyglass':     { x: 98,  y: 462, mag: 2 }, // mid-right flank
    'feat-spectroscope': { x: 98,  y: 588, mag: 2 }, // lower-right flank
    'feat-maze':         { x: 62,  y: 648, mag: 1 }, // bottom apex (the focus)
    'feat-polariser':    { x: 26,  y: 580, mag: 2 }, // lower-left flank
    'feat-camera':       { x: 20,  y: 470, mag: 2 }, // mid-left flank
    'feat-halo':         { x: 22,  y: 398, mag: 2 }, // upper-left flank
    'feat-anamorphosis': { x: 60,  y: 520, mag: 2 }, // lens centre / optical axis
    // ── The Automaton — Clockwork's 4 bench crumbs, a standing-figure in the north
    //    grounds (above the Clockwork POI). These are PLAIN room ids (each kindles iff
    //    its `ws:seen:<id>` breadcrumb is set — the Clockwork benches drop them). Coords
    //    verified clear of every footprint/furniture box, the manor pool, and every
    //    other catalog star (re-runnable /tmp/place_verify.cjs). mag1 = the head apex. ──
    'context-window':   { x: 418, y: 34,  mag: 1 }, // head (top apex, brightest)
    'temperature-dial': { x: 392, y: 78,  mag: 2 }, // core
    'the-turn':         { x: 452, y: 118, mag: 2 }, // right limb
    'partition':        { x: 318, y: 122, mag: 2 }, // left limb
    // ── The Furnace — Engine-Room's 4 bench crumbs, a rising flame in the far-right
    //    margin. PLAIN room ids (`ws:seen:<id>` from the Engine-Room benches). mag1 = the
    //    apex (η = 1 − Tc/Th, the Carnot ceiling — brightest). ──
    'carnot':   { x: 1398, y: 548, mag: 1 }, // apex (eta=1-Tc/Th — brightest)
    'demon':    { x: 1372, y: 632, mag: 2 },
    'brownian': { x: 1402, y: 712, mag: 2 },
    'stirling': { x: 1376, y: 836, mag: 2 }, // base
    // The Holonomy Walk — the curved-country wing's founding room (the twist you
    // can't survey away). A FEATS-flavoured field star in the dark WEST margin, a
    // surveyor's mark below the Cartographer and above the nameplate, near its open
    // west-park footprint; lit on first visit (ws:seen:holonomy). The lead member of
    // The Surveyor feat-group (sized for the promised curved-country siblings — a
    // Gauss-Bonnet polygon, a cone's deficit angle, a curvature-cancelling torus).
    // Verified clear of every footprint/furniture box, the manor pool, the viewBox
    // edge, and every existing catalog star (nearest = feat-maze @86px) by the
    // CATALOG INTEGRITY self-test (re-runnable /tmp star-placement verifier).
    'holonomy': { x: 130,  y: 700, mag: 1 },
    // The Unrolled Cone — Curved Country's SECOND hall (a cone's deficit angle: all
    // the curvature crammed to one point). A FEATS-flavoured field star in the dark
    // SW earth-corner, west of The Holonomy Walk and above the survey nameplate, near
    // its open west-park cone footprint; lit on first visit (ws:seen:unrolled-cone).
    // The companion member of The Surveyor feat-group (so the asterism reads ≥2 stars).
    // Verified clear of every footprint/furniture box, the manor pool, the viewBox
    // edge, and every existing catalog star by the CATALOG INTEGRITY self-test.
    'unrolled-cone': { x: 40,  y: 730, mag: 2 },
    // The Long Way Home — the Processional Ground's hero's-journey ring (the descent
    // and the dawn, walked, charted over the Orrery's pinned sky). A WAYFARER'S star in
    // the dark WEST margin, set beside its declared companion the ORRERY (120,400) — the
    // firmament the room is charted on — between it and the Hall of Mirrors; lit on first
    // visit (ws:seen:the-long-way-home). Verified clear of every footprint/furniture box,
    // the manor pool, the viewBox edge, and every existing catalog star (nearest =
    // tone-mill @83px) by the CATALOG INTEGRITY self-test.
    'the-long-way-home': { x: 215, y: 448, mag: 1 },
    // The Photon's Errand — Optics' fly-through room (you ARE the photon; fall into
    // Snell by flying least-time). A FEATS-flavoured field star in the optics band
    // just right of the Hall of Mirrors footprint, near its kin; lit on first visit
    // (ws:seen:refraction-run). The lead member of The Pilot feat-group. Verified
    // clear of every footprint/furniture box (incl. the new 'tank' footprint below the
    // Hall), the manor pool, the viewBox edge, and every existing catalog star
    // (nearest = cartographer @272px) by the CATALOG INTEGRITY self-test.
    'refraction-run': { x: 392, y: 486, mag: 1 },
    // The Light That Falls Around a Star — Optics' gravitational-lens fly-through (you
    // AIM the impact parameter b and watch starlight fall around a dark mass; thread the
    // hidden star, earn the Einstein ring on-axis). A mag-2 COMPANION star a tight twin
    // 62px DIRECTLY BELOW its founder refraction-run (392,486) in the optics band; lit on
    // first visit (ws:seen:starlight-bend). The SECOND member of The Pilot feat-group, so
    // its asterism now reads ≥2 stars and the engraved name sits over two dots — the SAME
    // least-time road bent by gravity instead of glass. Verified clear of every footprint/
    // furniture box, the manor pool, the viewBox edge, and every existing catalog star
    // (nearest = refraction-run @62px) by the CATALOG INTEGRITY self-test.
    'starlight-bend': { x: 392, y: 548, mag: 2 },
    // The Differential Gear — the Reckoning Cabinet's bevel-gear adder (crank two rims;
    // the cage reads the average). A FEATS-flavoured field star in the dark lower-right
    // band below the manor pool, near its number-wing kin (collisions @1180,560); lit on
    // first visit (ws:seen:differential-gear). The lead member of The Reckoner feat-group.
    // Verified clear of every footprint/furniture box (nearest furniture = scalebar), the
    // manor pool, the viewBox edge, and every existing catalog star (nearest = collisions
    // @140px) by the CATALOG INTEGRITY self-test (re-runnable /tmp star-placement verifier).
    'differential-gear': { x: 1180, y: 700, mag: 1 },
    // The Ball-and-Disk Integrator — the Reckoning Cabinet's integrating organ (drag the radius;
    // the dial winds ∫x du). A FEATS-flavoured field star a tight twin DIRECTLY BELOW the
    // differential-gear (68px), the SECOND member of The Reckoner feat-group; lit on first visit
    // (ws:seen:ball-and-disk). Verified clear of EVERY footprint bbox (incl. physics-lab
    // 1026..1164 × 687..782, which the sky.test subset-mirror does NOT cover — smoke's full-solve
    // does), the furniture, the manor pool, the viewBox edge, and every catalog star (nearest =
    // differential-gear @68px) by both the CATALOG INTEGRITY self-test and smoke's STAR-COLLISION.
    'ball-and-disk': { x: 1180, y: 768, mag: 2 },
    // The Shepherd — the Arcade's herd-a-living-flock game (steer a dog; the sheep flee; pen them
    // all). A FEATS-flavoured field star in the dark amusements band right of the Daedalus/Arcade
    // footprints; lit on first visit (ws:seen:the-shepherd). The lead member of The Drover feat-group.
    // Verified clear of every footprint/furniture box, the manor pool, the viewBox edge, and every
    // existing catalog star (nearest = collisions @139px) by the CATALOG INTEGRITY self-test.
    'the-shepherd': { x: 1130, y: 430, mag: 1 },
    // The Standing Stones — the Arcade's place-then-release herding PUZZLE (set K fixed stones, then
    // release; the flock carries itself in). A mag-2 COMPANION star a tight twin 60px DIRECTLY BELOW
    // its kin the-shepherd (1130,430) in the dark amusements band; lit on first visit
    // (ws:seen:the-standing-stones). The SECOND member of The Drover feat-group, so its asterism
    // finally reads ≥2 stars and the engraved name sits over two dots. Verified clear of every
    // footprint/furniture box, the manor pool, the viewBox edge, and every existing catalog star
    // (nearest = the-shepherd @60px) by the CATALOG INTEGRITY self-test.
    'the-standing-stones': { x: 1130, y: 490, mag: 2 },
    // The Lodestone Hall — the induction wing's founding room (the current you make
    // by MOVING). A FEATS-flavoured field star in the dark BOTTOM margin band below
    // its lower-mid grounds footprint (x642 y706), near its grounds kin; lit on first
    // visit (ws:seen:lodestone-hall). The lead member of The Coilwright feat-group.
    // Verified clear of every footprint/furniture box, the manor pool, the viewBox
    // edge, and every existing catalog star (nearest = tessellarium @ Δx40 Δy14,
    // workbench-row above) by the CATALOG INTEGRITY self-test (live-solve probe).
    'lodestone-hall': { x: 700, y: 872, mag: 1 },
    // The Bootstrap Bench — the induction wing's CAPSTONE (the wave that carries itself,
    // E makes B makes E). A FEATS-flavoured field star in the dark BOTTOM margin band,
    // right of its founder lodestone-hall (700,872) and clear of undercroft's star —
    // the second member of The Coilwright feat-group, lit on first visit
    // (ws:seen:bootstrap-bench). Verified clear of every footprint/furniture box, the
    // manor pool, the viewBox edge, and every existing catalog star by the CATALOG
    // INTEGRITY self-test (live-solve probe).
    'bootstrap-bench': { x: 820, y: 884, mag: 1 },
    // The Tone Mill — the Kinetics & Sound wing's founding room (the pitch you HEAR
    // is the rate you WATCH). A FEATS-flavoured field star in the dark LEFT margin
    // band, away from the manor candle-pool and the optics feat-cluster; lit on
    // first visit (ws:seen:tone-mill). The lead member of The Sirenist feat-group.
    // Verified clear of every footprint/furniture box, the manor pool, the viewBox
    // edge, and every existing catalog star (nearest = refraction-run feat-stars at
    // x275+, Δx>120) by the CATALOG INTEGRITY self-test (live-solve probe).
    'tone-mill': { x: 150, y: 500, mag: 1 },
    // The Singing Plate — the Kinetics & Sound wing's Chladni eigen-bench, now given its
    // VOICE (cycle #352, "The Sirenist"): the driven plate SINGS the eigenfrequency it
    // snaps to. A mag-2 COMPANION star one band directly ABOVE its kin tone-mill (150,500),
    // in the max-margin dark LEFT band; lit on first visit (ws:seen:singing-plate). The
    // SECOND member of The Sirenist feat-group, so its asterism reads ≥2 stars. Verified
    // clear of every footprint/furniture box, the manor pool, the viewBox edge, and every
    // existing catalog star (nearest = tone-mill @51px, the-long-way-home @65px) by the
    // CATALOG INTEGRITY self-test.
    'singing-plate': { x: 150, y: 449, mag: 2 },
    // The Drawing Room — the drawing-engines wing's founding room (compute by
    // drawing; the pantograph copies your hand at a dialed scale). A FEATS-flavoured
    // field star in the dark BOTTOM margin band, LEFT of the induction pair
    // (lodestone-hall 700,872 · bootstrap-bench 820,884) and clear of its own
    // far-west footprint (x182 y574); lit on first visit (ws:seen:the-drawing-room).
    // Verified clear of every footprint/furniture box, the manor pool, the viewBox
    // edge, and every existing catalog star by the CATALOG INTEGRITY self-test.
    'the-drawing-room': { x: 300, y: 868, mag: 1 },
    // The Heap That Knows Its Own Angle — the granular/earth bench (a tray of dry
    // grain that keeps θ_r = atan(μ) however the tray is spun). A field star in the
    // dark SW earth-corner margin, below the survey nameplate and west of The Drawing
    // Room (300,868), near its grounds kin; lit on first visit (ws:seen:the-heap).
    // Verified clear of every footprint/furniture box, the manor pool, the viewBox
    // edge, and every existing catalog star by the CATALOG INTEGRITY self-test.
    'the-heap': { x: 208, y: 882, mag: 1 },
    // The Keystone Arch — the statics precinct's founding room (drop the last wedge and
    // the dry-stacked ring locks rigid). A field star in the dark lower-right grounds
    // band, near its statics kin the Infinite Overhang and the games cluster; lit on
    // first visit (ws:seen:the-keystone-arch). Verified clear of every footprint/
    // furniture box, the manor pool, the viewBox edge, and every existing catalog star
    // by the CATALOG INTEGRITY self-test.
    'the-keystone-arch': { x: 1250, y: 872, mag: 1 },
    // The Rolling Room — the Rayleigh–Bénard convection bench (cross Ra_c=27π⁴/4 and a
    // still fluid layer breaks into rolls). A field star in the dark right-grounds band
    // just RIGHT of the physics-lab footprint (x1026–1164) and below the gnomon park,
    // near its games/statics kin; lit on first visit (ws:seen:the-rolling-room). Verified
    // clear of every footprint/furniture box (physics-lab box is x1026–1164 y687–782 —
    // this star sits ABOVE it, bottom edge y672 < 687), the manor pool, the viewBox edge,
    // and every existing catalog star (nearest = belief-beam 1240,630 Δx=35 / differential-
    // gear 1180,700 Δy=40 / collisions 1180,560 Δy=100) by CATALOG INTEGRITY + the live smoke.
    'the-rolling-room': { x: 1205, y: 660, mag: 1 },
    // The Barrel House — the MANOR's new music-box wing (a clock of PLACE, not rate;
    // distinct from the Acoustic Siren next door). The FRONT-DOOR wing star, lit on
    // first visit of the landing (ws:seen:the-barrel-house). A field star in the dark
    // LEFT-CENTRAL margin pocket BELOW the-long-way-home (215,448) and ABOVE the-heap
    // (208,882) / the-drawing-room (300,868), in the open band right of holonomy
    // (130,700). Verified clear of every footprint/furniture box, the manor pool, the
    // viewBox edge, and every existing catalog star by the CATALOG INTEGRITY self-test.
    'the-barrel-house': { x: 250, y: 630, mag: 1 },
    // The Pin-Barrel — the wing's founding room (the delay canon, three voices chase one
    // tune). The lead member of The Carillonneur feat-group; lit on first visit
    // (ws:seen:pin-barrel). A field star one band below its wing star the-barrel-house
    // (250,630). Verified clear of every footprint/furniture box, the manor pool, the
    // viewBox edge, and every existing catalog star (nearest = the-barrel-house Δy=55,
    // holonomy 130,700 Δx=120) by CATALOG INTEGRITY.
    'pin-barrel': { x: 250, y: 685, mag: 1 },
    // The Mirror Drum — the wing's crab-canon room (voice 1 = retrograde reflection of
    // voice 0, read backward at one instant). The SECOND member of The Carillonneur
    // feat-group, so its asterism reads ≥2 stars; a mag-2 companion star beside its kin;
    // lit on first visit (ws:seen:mirror-drum). Verified clear of every footprint/
    // furniture box, the manor pool, the viewBox edge, and every existing catalog star
    // (nearest = the-barrel-house 250,630 Δx=42, pin-barrel 250,685 Δx=42/Δy=27) by
    // CATALOG INTEGRITY.
    'mirror-drum': { x: 292, y: 658, mag: 2 }
  };

  /* ── DATA: the six wings (companion-pairs), each an asterism ────────────────
     `members` are catalog ids; the line threads them in listed order. `name` is
     the engraved label that appears in the margin once complete; `myth` is its
     one-line Oracle-flavoured legend. Order of members is the polyline order. */
  var WINGS = [
    { id: 'celestial', name: 'The Astronomer',   members: ['firmament', 'orrery'],
      myth: 'Invents a sky; reads the true one.' },
    { id: 'design',    name: 'The Compositor',   members: ['compositor', 'blazon'],
      myth: 'Letter and shield, one measure.' },
    { id: 'labyrinth', name: 'The Maze & Thread', members: ['daedalus', 'ariadne'],
      myth: 'Builds the turning; keeps the way back.' },
    { id: 'realm',     name: 'The Cartographer', members: ['cartographer', 'bastion'],
      myth: 'Draws the coast; raises the keep.' },
    { id: 'letters',   name: 'The Scribe',       members: ['verse', 'scriptorium'],
      myth: 'Speaks the verse; copies it fair.' },
    { id: 'garden',    name: 'The Gardener',     members: ['strange-garden', 'tessellarium'],
      myth: 'Tends the tile till the pattern comes true.' }
  ];

  /* ── DATA: the feats constellation (a BONUS asterism, NOT a wing) ───────────────
     The Hall of Mirrors' nine "Feats of Light" form their OWN charted constellation,
     drawn + named by the SAME asterism machinery as the six wings — but kept SEPARATE
     so the all-skies capstone (allComplete) stays the original six companion-wings
     ONLY. Earning all nine completes this constellation (brass lines + an engraved
     name + a one-line myth) without ever gating the capstone. Each member is a
     `feat-<X>` pseudo-id, "visited" iff the store holds `ws:flag:earned-<X>`. */
  /* FEATS is an ARRAY of feat-GROUPS (each drawn + named like a wing, but ADDITIVE —
     none ever feeds the all-skies capstone). The Optician (the Hall's nine Feats of
     Light) is unchanged; two new groups reward the orphaned-wing visit trails:
       • The Automaton — Clockwork's 4 benches (plain `ws:seen:<id>` room crumbs)
       • The Furnace   — the Engine Room's 4 benches (plain room crumbs)
     Member order = polyline order; the SET is what gates completion (order-free). */
  var FEATS = [
    { id: 'feats', name: 'The Optician', myth: 'Bends every ray to its purpose.',
      members: ['feat-rainbow', 'feat-iridescence', 'feat-spyglass', 'feat-spectroscope',
                'feat-maze', 'feat-polariser', 'feat-camera', 'feat-halo', 'feat-anamorphosis'] },
    { id: 'automaton', name: 'The Automaton', myth: 'Models its own making; keeps none of it.',
      members: ['context-window', 'temperature-dial', 'the-turn', 'partition'] },
    { id: 'furnace', name: 'The Furnace', myth: 'Turns heat to work; never quite all of it.',
      members: ['carnot', 'demon', 'brownian', 'stirling'] },
    // The Surveyor — Curved Country's reward constellation. Founded with one star
    // (The Holonomy Walk, a plain `ws:seen:holonomy` room crumb); its membership
    // grows as the wing's promised siblings ship (a Gauss-Bonnet polygon, a cone's
    // deficit angle, a curvature-cancelling torus). Like every feat-group it is
    // ADDITIVE — it NEVER feeds the wings-only all-skies capstone.
    { id: 'surveyor', name: 'The Surveyor', myth: 'Walks the loop; brings home the twist no chart can hide.',
      members: ['holonomy', 'unrolled-cone'] },
    // The Strategist — the number wing's solved-games reward constellation: two rooms where you
    // learn to beat a provably perfect opponent. Founded by The Matchbox That Learns (Hexapawn, a
    // machine that teaches itself to stop losing) and grown by The Long Chain (Dots-and-Boxes, won
    // by handing boxes back). Two stars, so the engraved name never sits over a lone dot. ADDITIVE —
    // it never feeds the wings-only all-skies capstone.
    { id: 'strategist', name: 'The Strategist', myth: 'Wins by the move that looks like a mistake.',
      members: ['hexapawn', 'the-long-chain'] },
    // The Pilot — Optics' fly-through reward constellation. Founded by The Photon's Errand
    // (`ws:seen:refraction-run`, fly least-time through slow glass) and grown by The Light
    // That Falls Around a Star (`ws:seen:starlight-bend`, fly the SAME least-time road bent
    // by gravity instead of glass — thread the hidden star, earn the Einstein ring on-axis);
    // the engraved name now sits over TWO dots. Like every feat-group it is ADDITIVE — it
    // NEVER feeds the wings-only all-skies capstone. Sized to keep growing as more piloted
    // least-time scenes ship.
    { id: 'pilot', name: 'The Pilot', myth: 'Flies the least-time road; falls into the law.',
      members: ['refraction-run', 'starlight-bend'] },
    // The Reckoner — the Reckoning Cabinet's reward constellation. Founded with The Differential
    // Gear (the adder) and grown by The Ball-and-Disk Integrator (the integrating organ) — both
    // plain `ws:seen:<id>` room crumbs; the engraved name now sits over TWO stars (the two organs
    // of a differential analyzer), completion requiring both. Like every feat-group it is
    // ADDITIVE — it NEVER feeds the wings-only all-skies capstone. Sized for the cabinet's
    // analog-instrument kin as more reckon-by-measuring scenes ship.
    { id: 'reckoner', name: 'The Reckoner', myth: 'Reckons by measuring a shape; one reads the mean, one the integral.',
      members: ['differential-gear', 'ball-and-disk'] },
    // The Drover — the Arcade's herding reward constellation. Founded by The Shepherd
    // (`ws:seen:the-shepherd`, hold the stick + drive a flock live) and grown by The Standing Stones
    // (`ws:seen:the-standing-stones`, set the stick down — place fixed stones, then release), the same
    // verified flock law as a placement puzzle. The engraved name now sits over TWO dots. Like every
    // feat-group it is ADDITIVE — it NEVER feeds the wings-only all-skies capstone. Sized to keep
    // growing as the amusements' steer-the-living-system kin ship.
    { id: 'drover', name: 'The Drover', myth: 'Never pushes the flock; only chooses where to stand.',
      members: ['the-shepherd', 'the-standing-stones'] },
    // The Coilwright — the Electromagnetism wing's reward constellation. Founded with
    // The Lodestone Hall (`ws:seen:lodestone-hall`) and grown by The Bootstrap Bench
    // (`ws:seen:bootstrap-bench`), the induction vein's capstone; like every feat-group
    // it is ADDITIVE — it NEVER feeds the wings-only all-skies capstone. Sized to keep
    // growing as the vein's promised siblings (an LC tank, a transformer, an eddy brake,
    // a betatron) ship.
    { id: 'coilwright', name: 'The Coilwright', myth: 'Makes the current by moving; pays for every spark.',
      members: ['lodestone-hall', 'bootstrap-bench'] },
    // The Sirenist — the Kinetics & Sound wing's reward constellation. Founded by The Tone
    // Mill (`ws:seen:tone-mill`) and grown by The Singing Plate (`ws:seen:singing-plate`),
    // the driven Chladni plate that SINGS its eigenmode — the same rate→pitch law in a
    // second instrument. Like every feat-group it is ADDITIVE — it NEVER feeds the wings-
    // only all-skies capstone. Sized to keep growing as more of the wing's seen-and-heard
    // kin (a free stroboscope, a tuning-fork beat) ship.
    { id: 'sirenist', name: 'The Sirenist', myth: 'Spins the rate you watch into the pitch you hear.',
      members: ['tone-mill', 'singing-plate'] },
    // The Wagerer — the Belief Beam's reward constellation. Now TWO stars: The Belief Beam (the
    // founding `ws:seen:belief-beam` crumb) and The Likelihood Sluice (`ws:seen:likelihood-sluice`),
    // the same additive log-LR law given two gates so belief decides WHEN to act. Like every
    // feat-group it is ADDITIVE — it NEVER feeds the wings-only all-skies capstone; its engraved name
    // now sits over two stars, and its tally fires only when BOTH crumbs exist. Room for more
    // inference kin (a conjugate-prior dial, a credible-interval lantern) as they ship.
    { id: 'wagerer', name: 'The Wagerer', myth: 'Pours belief, never spills it; lets the evidence decide the level.',
      members: ['belief-beam', 'likelihood-sluice'] },
    // The Carillonneur — the Barrel House's reward constellation (the music-box wing where
    // TIME IS THE CRANK). Founded by The Pin-Barrel (`ws:seen:pin-barrel`, the delay canon)
    // and grown by The Mirror Drum (`ws:seen:mirror-drum`, the crab canon) — the two named
    // founding rooms, so its engraved name sits over TWO stars from the start. Like every
    // feat-group it is ADDITIVE — it NEVER feeds the wings-only all-skies capstone. Sized to
    // keep growing as the wing's named-dark third (The Mensuration Barrel, 2:1) and further
    // music-box kin ship.
    { id: 'carillonneur', name: 'The Carillonneur', myth: 'Sets the pins, then lets the turning hand be the only clock.',
      members: ['pin-barrel', 'mirror-drum'] }
  ];

  Sky.CATALOG = CATALOG;
  Sky.WINGS = WINGS;
  Sky.FEATS = FEATS;

  /* ── PURE CORE ──────────────────────────────────────────────────────────────
     Sky.state(visited, catalog, wings) — deterministic, ORDER-INDEPENDENT,
     MONOTONE. Given a set/array/map of visited ids it returns:
       stars      [ {id, x, y, mag} ]  — every lit catalog entry (visited)
       lines      [ {wing, points:[[x,y],…], complete} ] — per-wing polyline through
                  the VISITED members (partial allowed; >=2 points to draw a line)
       asterisms  [ {…wing, members, complete: members.every(visited)} ]
       allComplete  true iff every wing is complete
     Visiting more visits only ever turns features ON, never off (monotonicity is
     structural: a superset of `visited` ⊇ the prior lit stars/line points, and
     `complete` is a monotone AND over membership). */
  function toSet(visited) {
    if (!visited) return {};
    var set = {};
    if (typeof visited.has === 'function' && typeof visited.forEach === 'function'
        && typeof visited.size === 'number') {
      // a real Set
      visited.forEach(function (id) { set[id] = true; });
      return set;
    }
    if (Object.prototype.toString.call(visited) === '[object Array]') {
      for (var i = 0; i < visited.length; i++) set[visited[i]] = true;
      return set;
    }
    // a plain object map { id: truthy }
    for (var k in visited) if (Object.prototype.hasOwnProperty.call(visited, k) && visited[k]) set[k] = true;
    return set;
  }

  Sky.state = function (visited, catalog, wings, feats) {
    catalog = catalog || CATALOG;
    wings = wings || WINGS;
    // `feats` may be a single group object, an array of groups, or omitted. It draws
    // + names exactly like a wing, but is kept SEPARATE so it NEVER feeds allComplete.
    if (feats === undefined) feats = FEATS;
    var featGroups = !feats ? [] :
      (Object.prototype.toString.call(feats) === '[object Array]' ? feats : [feats]);
    var vset = toSet(visited);
    var has = function (id) { return !!vset[id]; };

    // lit stars — iterate the catalog in a STABLE key order (insertion order of a
    // plain object is preserved for string keys in every engine we target), so the
    // output is deterministic regardless of the order ids were visited.
    var stars = [];
    var id;
    for (id in catalog) {
      if (!Object.prototype.hasOwnProperty.call(catalog, id)) continue;
      if (!has(id)) continue;
      var c = catalog[id];
      stars.push({ id: id, x: c.x, y: c.y, mag: c.mag });
    }

    // compute one group's line + asterism record (shared by wings and feats)
    function group(g) {
      var members = g.members || [];
      var complete = members.length > 0;
      var pts = [];
      for (var m = 0; m < members.length; m++) {
        var mid = members[m];
        if (!has(mid)) { complete = false; continue; }
        var mc = catalog[mid];
        if (mc) pts.push([mc.x, mc.y]);
      }
      var line = (pts.length >= 2)
        ? { wing: g.id, points: pts, complete: complete } : null;
      var ast = { id: g.id, name: g.name, myth: g.myth, members: members, complete: complete };
      return { line: line, ast: ast, complete: complete };
    }

    var lines = [];
    var asterisms = [];
    // ── the six wings: these (and ONLY these) feed the all-skies capstone ──
    var allComplete = wings.length > 0;
    for (var w = 0; w < wings.length; w++) {
      var gw = group(wings[w]);
      if (!gw.complete) allComplete = false;
      if (gw.line) lines.push(gw.line);
      asterisms.push(gw.ast);
    }
    // ── the feats constellation(s): drawn + named the SAME way, but ADDITIVE — they
    //    do NOT touch allComplete, so the original capstone is unchanged. ──
    for (var f = 0; f < featGroups.length; f++) {
      var gf = group(featGroups[f]);
      if (gf.line) lines.push(gf.line);
      asterisms.push(gf.ast);
    }

    return { stars: stars, lines: lines, asterisms: asterisms, allComplete: allComplete };
  };

  /* ── helpers shared by the DOM layer ──────────────────────────────────────── */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svg(name, attrs) {
    var e = root.document.createElementNS(SVGNS, name);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    return e;
  }
  function lsGet(store, k) { return store && store.has(k) ? store.get(k) : null; }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

  /* Build the visited set from a WS store snapshot. Room stars come from the
     `ws:seen:<id>` breadcrumb every page drops; the feats constellation's `feat-<X>`
     pseudo-stars come from the raise-only `ws:flag:earned-<X>` Hall-of-Mirrors flags
     (e.g. `ws:flag:earned-rainbow` → `feat-rainbow`). Both are additive. */
  Sky.visitedFromStore = function (store) {
    var v = {};
    if (!store || !store.ok || !store.all) return v;
    var SEEN = 'ws:seen:', EARNED = 'ws:flag:earned-';
    for (var k in store.all) {
      if (!Object.prototype.hasOwnProperty.call(store.all, k)) continue;
      if (k.indexOf(SEEN) === 0) v[k.slice(SEEN.length)] = true;
      else if (k.indexOf(EARNED) === 0) v['feat-' + k.slice(EARNED.length)] = true;
    }
    return v;
  };

  /* ── Sky.bootstrap(store) ────────────────────────────────────────────────────
     On the FIRST ever run on this origin (ws:flag:sky-bootstrap absent), silently
     mark every ALREADY-complete asterism's `ws:flag:sky-<id>-named` flag — so a
     returning visitor who already completed wings before this feature existed gets
     NO retroactive name-in animation. Then set ws:flag:sky-bootstrap. Idempotent.
     Mirrors WS.bootstrap. */
  Sky.bootstrap = function (store) {
    if (!store) { try { store = root.WS && root.WS.store(); } catch (e) { store = null; } }
    if (!store || !store.ok) return;
    if (lsGet(store, 'ws:flag:sky-bootstrap') != null) return;
    var st = Sky.state(Sky.visitedFromStore(store), CATALOG, WINGS);
    for (var i = 0; i < st.asterisms.length; i++) {
      var a = st.asterisms[i];
      if (a.complete) lsSet('ws:flag:sky-' + a.id + '-named', '1');
    }
    lsSet('ws:flag:sky-bootstrap', '1');
  };

  /* ── Sky.renderInto(sheet, PLACES, store) ────────────────────────────────────
     Draw a `<g class="sky">` as the FIRST child of #sheet (stars sit "in the
     paper", behind the grid/footprints). PLACES is accepted for parity with the
     map's render signature (the sky reads from the ws: store, not PLACES). */
  Sky.renderInto = function (sheet, PLACES, store) {
    if (!root || !root.document || !sheet) return null;
    if (!store) { try { store = root.WS && root.WS.store(); } catch (e) { store = null; } }
    if (!store || !store.ok) return null;   // storage off → no sky (degrade to nothing)

    var reduce = false;
    try { reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    var st = Sky.state(Sky.visitedFromStore(store), CATALOG, WINGS);

    // remove a prior render (idempotent re-render)
    var old = sheet.querySelector('g.sky');
    if (old && old.parentNode) old.parentNode.removeChild(old);

    var g = svg('g', { 'class': 'sky', 'aria-hidden': 'true' });

    // ── asterism lines (under the stars) ──
    var i, j;
    for (i = 0; i < st.lines.length; i++) {
      var ln = st.lines[i];
      var d = '';
      for (j = 0; j < ln.points.length; j++) {
        d += (j === 0 ? 'M' : 'L') + ln.points[j][0] + ' ' + ln.points[j][1] + ' ';
      }
      var pl = svg('path', {
        'class': 'asterism-line' + (ln.complete ? ' complete' : ''),
        d: d.trim(), 'data-wing': ln.wing
      });
      g.appendChild(pl);
    }

    // member ids of every COMPLETED asterism — drawn as brighter "anchor" stars so a
    // charted constellation reads as a NAMED LINE JOINING TWO VISIBLE STARS, not a
    // hairline trailing off to faint points (the legibility fix of 2026-06-13).
    var chartedIds = {};
    for (i = 0; i < st.asterisms.length; i++) {
      if (!st.asterisms[i].complete) continue;
      var mm = st.asterisms[i].members || [];
      for (j = 0; j < mm.length; j++) chartedIds[mm[j]] = true;
    }

    // ── stars (twinkling circles; static under reduced-motion) ──
    for (i = 0; i < st.stars.length; i++) {
      var s = st.stars[i];
      var charted = !!chartedIds[s.id];
      var rad = (s.mag === 1 ? 2.6 : (s.mag === 2 ? 2.0 : 1.6)) + (charted ? 0.8 : 0);
      var star = svg('circle', {
        cx: s.x, cy: s.y, r: rad,
        'class': 'sky-star mag' + s.mag + (charted ? ' charted' : ''), 'data-id': s.id
      });
      if (!reduce) {
        // stagger the twinkle so the field shimmers rather than pulsing in unison
        star.style.animationDelay = ((s.x * 7 + s.y * 13) % 4000) / 1000 + 's';
      }
      g.appendChild(star);
    }

    // ── engraved asterism names + myths (in the margin), routed via the map's
    //    label solver upstream; here we just draw the text the caller positioned.
    //    Each complete asterism gets a name once; the FIRST time it becomes
    //    complete (its -named flag absent) we animate it in, then set the flag. ──
    var named = [];
    for (i = 0; i < st.asterisms.length; i++) {
      var a = st.asterisms[i];
      if (!a.complete) continue;
      var flagK = 'ws:flag:sky-' + a.id + '-named';
      var firstTime = lsGet(store, flagK) == null;
      named.push({ ast: a, firstTime: firstTime });
      if (firstTime) lsSet(flagK, '1');
    }

    // expose what was computed so the map's label pass can place the name boxes
    g.__skyNamed = named;
    g.__skyState = st;

    // ── the margin tally: "Survey of Heaven — N/6 skies charted". The denominator is
    //    the SIX companion-wings only; EVERY feat-group (the Optician + the Automaton +
    //    the Furnace) is a separate bonus and is excluded from the /6 count (each gets
    //    its own sub-tally below). Derive the exclude-set from the SAME FEATS array so a
    //    new feat-group can never be miscounted into the wing tally. ──
    var wingIds = {};
    for (i = 0; i < WINGS.length; i++) wingIds[WINGS[i].id] = true;
    var featGroupIds = {};
    for (i = 0; i < FEATS.length; i++) featGroupIds[FEATS[i].id] = true;
    var charted = 0, wingTotal = WINGS.length;
    for (i = 0; i < st.asterisms.length; i++) {
      var ai = st.asterisms[i];
      if (featGroupIds[ai.id]) continue;                 // a feat-group never counts toward /6
      if (wingIds[ai.id] && ai.complete) charted++;
    }
    var tally = svg('text', {
      x: 1414, y: 862, 'text-anchor': 'end', 'class': 'sky-tally'
    });
    tally.textContent = 'Survey of Heaven — ' + charted + '/' + wingTotal + ' skies charted';
    g.appendChild(tally);

    // ── the feat-group sub-tallies: each COMPLETED feat-group earns one right-anchored
    //    brass line, stacking UP from the main tally (y862) at -14px per line, tinted by
    //    its class. Data-driven off st.asterisms so adding a feat-group needs no edit
    //    here — only an entry in SUBTALLY. A line is emitted ONLY when genuinely
    //    complete (honest). Stack order follows FEATS array order:
    //      Optician  (y848) · Automaton (y834) · Furnace (y820). ──
    var SUBTALLY = {
      feats:     { text: 'Feats of Light — the Optician charted',        cls: 'sky-tally-feats' },
      automaton: { text: "The Maker's Wing — the Automaton charted",     cls: 'sky-tally-automaton' },
      furnace:   { text: 'The Engine Room — the Furnace charted',        cls: 'sky-tally-furnace' },
      surveyor:  { text: 'Curved Country — the Surveyor charted',        cls: 'sky-tally-surveyor' },
      wagerer:   { text: 'The Belief Beam — the Wagerer charted',        cls: 'sky-tally-wagerer' },
      reckoner:  { text: 'The Reckoning Cabinet — the Reckoner charted',  cls: 'sky-tally-reckoner' },
      coilwright:{ text: 'Electromagnetism — the Coilwright charted',     cls: 'sky-tally-coilwright' },
      sirenist:  { text: 'Kinetics & Sound — the Sirenist charted',       cls: 'sky-tally-sirenist' }
    };
    var subY = 848;
    for (i = 0; i < FEATS.length; i++) {
      var fg = FEATS[i];
      var meta = SUBTALLY[fg.id];
      if (!meta) continue;
      var fast = null;
      for (j = 0; j < st.asterisms.length; j++) {
        if (st.asterisms[j].id === fg.id) { fast = st.asterisms[j]; break; }
      }
      if (!fast || !fast.complete) continue;             // honest: only when truly charted
      var ftally = svg('text', {
        x: 1414, y: subY, 'text-anchor': 'end', 'class': 'sky-tally ' + meta.cls
      });
      ftally.textContent = meta.text;
      g.appendChild(ftally);
      subY -= 14;
    }

    // ── capstone: when ALL SIX WINGS are complete, set the firmament-survey flag once
    //    and add a faint all-skies glow band. This is the ORIGINAL capstone, unaffected
    //    by the feats constellation (allComplete is wings-only). ──
    if (st.allComplete) {
      if (lsGet(store, 'ws:flag:firmament-survey') == null) lsSet('ws:flag:firmament-survey', '1');
      g.classList.add('all-charted');
    }

    // insert as the FIRST child of #sheet (behind every painted layer)
    if (sheet.firstChild) sheet.insertBefore(g, sheet.firstChild);
    else sheet.appendChild(g);

    return g;
  };

  // browser global
  if (root && root.document) root.Sky = Sky;

  // dual-use module guard (forge strips exactly this braced single line)
  if (typeof module !== 'undefined' && module.exports) { module.exports = Sky; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
