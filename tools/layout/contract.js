/* ════════════════════════════════════════════════════════════════════════════
   contract.js — THE POLAR DEEDS (layout engine v2, WS1 §1.2 / §1.5)

   The closed `DISTRICTS` table of layout v1 is retired. Under the polar contract
   every district holds an IMMUTABLE (angle, tier) — its deed on the wheel — plus a
   named FORMATION, a size-budget FRAME, a feasibility-checked CAPACITY, and the set
   of `wing` slugs (CLUSTERS) legal inside it. Tier radii, spans, the sky ring, the
   viewBox — all DERIVE from these deeds (see polar.js); nothing is hand-budgeted.

   This file owns the DATA + the SCHEMA validation only. The geometry solve lives in
   polar.js (radius/angle/viewBox/freeSlots); the packing lives in formations.js; the
   facade that wires them is layout.js. Kept pure + coordinate-free so it runs
   identically in Node (tests) and the browser (forge-inlined, 3rd-from-new include).

   PROVENANCE: every angle/tier/frame/capacity below is the BINDING §2.1 table, verified
   by research/geometry-check.mjs (ALL CHECKS PASS 2026-07-03). Re-run the oracle after
   ANY change to an angle, a frame, or a reservation. theme.{hue,tint,style} are lifted
   from the echoed v1 regions (DISTRICTS/WING_META) or the nearest kin; theme.{label,blurb}
   are the BINDING §2.1 visitor copy. The render wave refines the visuals; the deeds do not move.
   ════════════════════════════════════════════════════════════════════════════ */

var Contract = (function () {
  'use strict';

  /* ── §1.5 immutable angular reservations (the road wedge + the two sky lanes).
     polar.js keeps a matching default set; the SINGLE SOURCE OF TRUTH is here —
     the twin test (polar.test.cjs) asserts polar's defaults equal these so a future
     edit cannot silently drift the two apart. ── */
  var ROAD = { theta: 180, halfWidth: 12 };                 // wedge [168°, 192°]
  var LANES = [
    { id: 'east-lane', span: [82, 94], startTier: 1 },
    { id: 'west-lane', span: [246, 258], startTier: 1 }      // shifted +4 (gardens needs the shoulder)
  ];

  /* ── §1.2 THE DISTRICT CONTRACTS (post-gather room counts, §2.6).
     angle = compass deg (0=N, 90=E, 180=S, 270=W), integer, IMMUTABLE.
     tier  = the district's ORBIT (its ring on the wheel), integer ≥ 1 (manor = 0, the pole).
             UNRELATED to a room's PLACES tier (SIZE_BAND rank) — say "orbit" for this one.
     frame = the physical size budget: {w,h} box, or {r} disc (rings). ρ derives from it.
     layoutFn = a key of FORMATIONS (formations.js). NO default — a missing/unknown one throws.
     capacity = max rooms, feasibility-checked (§1.8) against FORMATIONS[layoutFn].maxCapacity.
     clusters = the legal `wing` slugs inside this district (empty = the district needs none). ── */
  var CONTRACTS = {
    manor: {
      // the tier-0 pole — the world origin; no orbit angle (it IS the centre).
      tier: 0,
      theme: { label: 'THE MANOR HOUSE', hue: '#c9a24a', tint: 0.045, style: 'party-wall',
               blurb: 'the inhabited heart — studies, archives, music, and the machines of reckoning, under one roof' },
      layoutFn: 'greathouse',
      frame: { w: 280, h: 200 },
      capacity: 23,          // 21 area-scaled greathouse seats + 2 locked basement-band slots
      clusters: ['studies', 'east', 'maker', 'archive', 'reckoning', 'sewing', 'arrow',
                 'barrel-house', 'kinetics-sound', 'basement']
    },
    works: {
      tier: 1, angle: 125,
      theme: { label: 'THE WORKS', hue: '#d9a441', tint: 0.04, style: 'park-line',
               blurb: 'the industrial quarter — heat, chymistry, current, casting, and stone' },
      layoutFn: 'court',
      frame: { w: 300, h: 220 },
      capacity: 12,
      clusters: ['works', 'induction', 'foundry', 'the-deep-hearth', 'statics']
    },
    gardens: {
      tier: 1, angle: 217,   // the tight fit: 1.8°/5.8° road+lane margins
      theme: { label: 'THE GLASSHOUSE GARDENS', hue: '#7fd1c7', tint: 0.03, style: 'park-line',
               blurb: 'glass and living things — gardens that grow, freeze, mist, and remember' },
      layoutFn: 'court',
      frame: { w: 240, h: 180 },
      capacity: 12,          // ≤ court-max 13 — the single-seat district (§2.1 double-squeeze)
      clusters: ['glasshouses', 'conservatory']
    },
    observatory: {
      tier: 1, angle: 307,
      theme: { label: 'THE OBSERVATORY RISE', hue: '#9db4ff', tint: 0.035, style: 'rise-line',
               blurb: 'the rise that reads the sky — orbits, tides, distances, and first light' },
      layoutFn: 'rings',
      frame: { r: 140 },     // a concentric-contour disc, not a w×h box
      capacity: 18,          // a chosen budget below the ring ceiling of 21
      clusters: ['stellar', 'celestial-mechanics', 'exoplanets', 'vantages',
                 'moving-frame', 'cosmology', 'aerospace']
    },
    promenades: {
      tier: 2, angle: 0,
      theme: { label: 'THE PROMENADES', hue: '#c9a24a', tint: 0.03, style: 'park-line',
               blurb: "the estate's walks — a journey with a shape, curvature you carry home, and the shadow that tells the hours" },
      layoutFn: 'crescent',
      frame: { w: 280, h: 130 },   // crescent reads frame.w as the arc DIAMETER (§1.3)
      capacity: 7,
      clusters: ['processions', 'curved-country', 'horology']
    },
    fairground: {
      tier: 2, angle: 72,
      detach: true,          // the lever lives on the CONTRACT now (the room-level flag is dropped)
      theme: { label: 'THE FAIRGROUND', hue: '#37f7e0', tint: 0.035, style: 'park-line',
               blurb: 'a fair you enter — rides, games, and crowds that behave like weather' },
      layoutFn: 'knot',      // dormant while detached; the child lays out via relayPlate
      frame: { w: 96, h: 120 },    // the parent GATE FACE — the whole parent-plate extent
      capacity: 16,          // the CHILD tile budget (relay-checked, §1.8), not a knot count
      clusters: ['amusements']
    },
    number: {
      tier: 2, angle: 208,
      theme: { label: 'THE NUMBER GARDEN', hue: '#6f9fc0', tint: 0.035, style: 'park-line',
               blurb: 'the garden where number grows — benches of proof, chance, and machines that learn' },
      layoutFn: 'pascal',
      frame: { w: 240, h: 170 },
      capacity: 15,
      clusters: ['number', 'figures-you-construct', 'drawing-engines']
    },
    opticks: {
      tier: 2, angle: 270,
      theme: { label: 'THE OPTICKS COURT', hue: '#8fd9ff', tint: 0.035, style: 'park-line',
               blurb: 'light, and the waves that behave like it — refraction, colour, ripples, and interference you can hear' },
      layoutFn: 'court',
      frame: { w: 220, h: 150 },
      capacity: 10,
      clusters: ['optics', 'waves']
    },
    cavern: {
      tier: 3, angle: 140,
      theme: { label: 'THE CAVERN', hue: '#7fd4c0', tint: 0.04, style: 'hatch',
               blurb: 'the physics laboratory, quarried into the hillside and kept underground for safety' },
      layoutFn: 'knot',
      frame: { w: 150, h: 110 },
      capacity: 4,
      clusters: []
    },
    outbuilding: {
      tier: 3, angle: 225,
      theme: { label: "THE MAKER'S SHED", hue: '#c9a24a', tint: 0.03, style: 'shed-line',
               blurb: "the original workshop — the maker's first instruments, kept as they were" },
      layoutFn: 'knot',
      frame: { w: 140, h: 100 },
      capacity: 2,
      clusters: []
    },
    approach: {
      // special-cased for tier math ONLY: no orbit angle — it OWNS the road wedge (§1.2).
      // roadside IGNORES its frame (rooms seat at ROADSIDE_STOPS); the nominal frame below
      // exists only to satisfy the schema. Road geometry is derived in §4 / the render wave.
      road: { theta: 180 },
      theme: { label: 'THE SOUTH APPROACH', hue: '#c9a24a', tint: 0.03, style: 'park-line',
               blurb: 'the way in — the gate, the road, and the register of everything' },
      layoutFn: 'roadside',
      frame: { w: 120, h: 120 },   // nominal — roadside ignores it (the stops table is the budget)
      capacity: 2,           // ROADSIDE_STOPS.length (gate t=0, gatehouse t=0.18)
      clusters: []
    }
  };

  /* ── CLUSTER_META — the surviving WING_META (label + accent), lifted whole, plus the
     three new observatory/basement slugs the §2.6 gather introduces. `WING_META` stays
     as a compat alias (§1.2). A `wing` slug not present here is an unknown-cluster build
     error (thrown at room-placement in the facade). ── */
  var CLUSTER_META = {
    studies:                 { label: 'THE STUDIES',            accent: '#cba15a' },
    east:                    { label: 'THE EAST WING',          accent: '#74b0a6' },
    maker:                   { label: "THE MAKER'S WING",       accent: '#7ad0c4' },
    archive:                 { label: 'THE ARCHIVE',            accent: '#c9a44e' },
    reckoning:               { label: 'THE RECKONING CABINET',  accent: '#c9a24a' },
    glasshouses:             { label: 'THE GLASSHOUSES',        accent: '#7fd1c7' },
    optics:                  { label: 'OPTICS',                 accent: '#8fd9ff' },
    number:                  { label: 'THE NUMBER WING',        accent: '#c9a24a' },
    amusements:              { label: 'AMUSEMENTS',             accent: '#37f7e0' },
    works:                   { label: 'THE WORKS',              accent: '#d9a441' },
    conservatory:            { label: 'LIVING-SYSTEMS WING',    accent: '#86d39a' },
    horology:                { label: 'HOROLOGY',               accent: '#e6bd6f' },
    aerospace:               { label: 'THE AERODROME',          accent: '#cdd6e0' },
    sewing:                  { label: 'THE SEWING ROOM',        accent: '#d9b873' },
    stellar:                 { label: 'THE STELLAR WING',       accent: '#9db4ff' },
    vantages:                { label: 'SCENES YOU WALK INTO',   accent: '#9db4ff' },
    'moving-frame':          { label: 'THE MOVING FRAME',       accent: '#9db4ff' },
    cosmology:               { label: 'COSMOLOGY',              accent: '#9db4ff' },
    arrow:                   { label: 'THE ARROW WING',         accent: '#c9a24a' },
    'curved-country':        { label: 'CURVED COUNTRY',         accent: '#caa15a' },
    induction:               { label: 'ELECTROMAGNETISM',       accent: '#7fd4ff' },
    foundry:                 { label: 'THE FOUNDRY',            accent: '#e6a13a' },
    'drawing-engines':       { label: 'DRAWING ENGINES',        accent: '#c9a24a' },
    'figures-you-construct': { label: 'FIGURES YOU CONSTRUCT',  accent: '#6f9fc0' },
    'kinetics-sound':        { label: 'KINETICS & SOUND',       accent: '#d8a94a' },
    'barrel-house':          { label: 'THE BARREL HOUSE',       accent: '#c9a24a' },
    waves:                   { label: 'WAVES',                  accent: '#54d6d0' },
    processions:             { label: 'THE PROCESSIONAL GROUND', accent: '#c9a24a' },
    statics:                 { label: 'STATICS',                accent: '#c9974c' },
    'the-deep-hearth':       { label: 'THE DEEP HEARTH',        accent: '#e24a2a' },
    // NEW (§2.6 gather) — kept in the observatory's / manor's own idiom:
    'celestial-mechanics':   { label: 'CELESTIAL MECHANICS',    accent: '#9db4ff' },
    exoplanets:              { label: 'EXOPLANETS',             accent: '#9db4ff' },
    basement:                { label: 'THE BASEMENT',           accent: '#c9a24a' }
  };

  /* ── §1.3 the gated-failure template (verbatim) — thrown when a contract declares no
     layoutFn (or, once formations.js exists, an unknown one). ── */
  function noLayoutFnError(id, declared) {
    return 'Layout: district "' + id + '" declares no layoutFn' +
      (declared ? ' (unknown "' + declared + '")' : '') + '. There is no default packer —\n' +
      'the generic grid is retired (it is the crush machine that built #275/#328/#335/#410).\n' +
      'Choose a FORMATION: court | crescent | knot | rings | pascal | ashlar | roadside\n' +
      '(see formations.js), and declare a capacity ≤ FORMATIONS[fn].maxCapacity(frame, params).';
  }

  /* ── SCHEMA VALIDATION (§1.2). Geometry-independent, run once at solve time.
       - required: theme.label, layoutFn, frame ({w,h} or {r}), capacity (integer ≥ 0).
       - manor: orbit 0, no angle. approach: a `road`, no orbit angle/tier.
       - every other district: integer orbit ≥ 1 + integer compass angle 0..359.
       - clusters: each must be a known CLUSTER_META slug.
       - uniqueness: no two districts share (angle, orbit) — the deed is unique.
     The formation-EXISTENCE + §1.8 capacity FEASIBILITY checks need formations.js and run
     in the facade (T0.3): pass `knownFormations` (a set/array of FORMATION names) to also
     validate layoutFn membership here. Districts iterate SORTED (determinism, §1.6). ── */
  function validate(contracts, knownFormations) {
    var known = knownFormations
      ? (Array.isArray(knownFormations) ? knownFormations : Object.keys(knownFormations))
      : null;
    var ids = Object.keys(contracts).sort();
    var deeds = {};
    ids.forEach(function (id) {
      var c = contracts[id];
      if (!c || typeof c !== 'object') throw new Error('Layout: contract "' + id + '" is not an object.');
      if (!c.theme || !c.theme.label) throw new Error('Layout: contract "' + id + '" has no theme.label.');
      if (!c.layoutFn) throw new Error(noLayoutFnError(id, null));
      if (known && known.indexOf(c.layoutFn) === -1) throw new Error(noLayoutFnError(id, c.layoutFn));
      if (!c.frame || (c.frame.r == null && (c.frame.w == null || c.frame.h == null)))
        throw new Error('Layout: contract "' + id + '" needs a frame {w,h} or {r} (its size budget).');
      if (!(typeof c.capacity === 'number' && c.capacity >= 0 && c.capacity === Math.floor(c.capacity)))
        throw new Error('Layout: contract "' + id + '" needs an integer capacity ≥ 0.');
      var clusters = c.clusters || [];
      if (!Array.isArray(clusters)) throw new Error('Layout: contract "' + id + '" clusters must be an array.');
      clusters.slice().sort().forEach(function (cl) {
        if (!CLUSTER_META[cl]) throw new Error('Layout: district "' + id + '" declares unknown cluster "' + cl +
          '". Add it to CLUSTER_META or remove it (a wing slug is never silent).');
      });
      // deed shape + uniqueness
      if (id === 'manor') {
        if (c.tier !== 0) throw new Error('Layout: the manor must be orbit 0 (the pole).');
        if (c.angle != null) throw new Error('Layout: the manor has no orbit angle — it IS the centre.');
      } else if (c.road) {
        // approach: road-special; no orbit deed.
        if (c.tier != null || c.angle != null)
          throw new Error('Layout: the approach owns the road wedge, not an orbit deed — drop its tier/angle.');
      } else {
        if (!(typeof c.tier === 'number' && c.tier >= 1 && c.tier === Math.floor(c.tier)))
          throw new Error('Layout: district "' + id + '" needs an integer orbit (tier) ≥ 1.');
        if (!(typeof c.angle === 'number' && c.angle >= 0 && c.angle < 360 && c.angle === Math.floor(c.angle)))
          throw new Error('Layout: district "' + id + '" needs an integer compass angle in [0,360).');
        var key = c.tier + '|' + c.angle;
        if (deeds[key]) throw new Error('Layout: districts "' + deeds[key] + '" and "' + id +
          '" share the polar deed (angle ' + c.angle + '°, orbit ' + c.tier + '). Each deed is unique — nudge one angle.');
        deeds[key] = id;
      }
    });
    return true;
  }

  return {
    CONTRACTS: CONTRACTS,
    CLUSTER_META: CLUSTER_META,
    WING_META: CLUSTER_META,     // compat alias (§1.2)
    ROAD: ROAD,
    LANES: LANES,
    validate: validate,
    noLayoutFnError: noLayoutFnError
  };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = Contract; }
