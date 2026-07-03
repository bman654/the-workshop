/* ════════════════════════════════════════════════════════════════════════════
   estate.fixture.cjs — THE MIGRATED-PLACES FIXTURE (layout engine v2, WS1 §2.1/§2.6)

   A stand-in for the POST-MIGRATION `PLACES` table the live page carries only from W1 on
   (the flip is W1.1; the room GATHER is W2.8). W0.3's estate.test drives the v2 facade
   (layout.js) against THIS copy so the engine can be proven end-to-end BEFORE the page is
   touched — the live index.src.html still runs v1 until W1.

   It mirrors the §2.1 target census EXACTLY (the door-pill bijection the migration will
   assert): 44 parent-plate room POIs across the ten non-fairground districts + 16 fairground
   CHILD tiles + 2 locked manor basement slots = 62 PLACES entries. Every `wing` is one of its
   district's declared CLUSTERS (contract.js); the fairground is DETACHED at the contract, so
   its rooms carry NO `detach` field (the room-level lever is dropped in migration, §2.3).

   Room ids/tiers/orders are representative, not the live estate's content — the fixture proves
   GEOMETRY + PARTITION + DETERMINISM, not copy. Pure data; deterministic; no coordinates
   (a room declares zero pixels, §1.2). Content (hrefs/stars/blurbs) is out of scope here.
   ════════════════════════════════════════════════════════════════════════════ */

'use strict';

/* helper: terse row → PLACES entry. `w` = wing (cluster), omitted → no wing. */
function P(id, district, tier, order, w, extra) {
  var e = { id: id, district: district, tier: tier, order: order };
  if (w) e.wing = w;
  if (extra) for (var k in extra) e[k] = extra[k];
  return e;
}

var PLACES = [
  /* ── THE MANOR HOUSE — 15 house rooms + 2 locked basement slots (§2.1/§2.2). ── */
  P('verse',                   'manor', 1, 10, 'studies'),
  P('compositor',              'manor', 2, 11, 'studies'),
  P('cartographer',            'manor', 2, 12, 'archive'),
  P('the-cartographers-dream', 'manor', 2, 13, 'archive'),
  P('a-sky-you-name',          'manor', 2, 14, 'archive'),
  P('the-faithful-drum',       'manor', 2, 15, 'kinetics-sound'),
  P('sound-garden',            'manor', 2, 16, 'kinetics-sound'),
  P('threshold',               'manor', 2, 17, 'east'),
  P('tone-mill',               'manor', 2, 18, 'kinetics-sound'),
  P('the-barrel-house',        'manor', 2, 19, 'barrel-house'),
  P('clockwork',               'manor', 2, 20, 'maker'),
  P('sewing-room',             'manor', 2, 21, 'sewing'),
  P('museum',                  'manor', 1, 22, 'east'),
  P('reckoning',               'manor', 2, 23, 'reckoning'),
  P('reversing-room',          'manor', 3, 24, 'arrow'),
  P('undercroft',              'manor', 3, 90, 'basement', { locked: true }),
  P('reliquary',               'manor', 3, 91, 'basement', { locked: true }),

  /* ── THE WORKS — 6 rooms, `court` (§2.1). ── */
  P('engine-room',       'works', 1, 30, 'works'),
  P('alchemy',           'works', 2, 31, 'works'),
  P('lodestone-hall',    'works', 2, 32, 'induction'),
  P('casting-floor',     'works', 2, 33, 'foundry'),
  P('the-deep-hearth',   'works', 2, 34, 'the-deep-hearth'),
  P('the-keystone-arch', 'works', 2, 35, 'statics'),

  /* ── THE GLASSHOUSE GARDENS — 3 rooms, `court` (the single-seat district). ── */
  P('strange-garden',   'gardens', 1, 40, 'glasshouses'),
  P('conservatory',     'gardens', 2, 41, 'conservatory'),
  P('glasshouse-range', 'gardens', 2, 42, 'glasshouses'),

  /* ── THE OBSERVATORY RISE — 8 rooms, `rings` (§2.1). ── */
  P('firmament',    'observatory', 1, 50, 'stellar'),
  P('stellar-forge','observatory', 2, 51, 'stellar'),
  P('transit',      'observatory', 2, 52, 'celestial-mechanics'),
  P('orbit-house',  'observatory', 2, 53, 'celestial-mechanics'),
  P('first-light',  'observatory', 2, 54, 'cosmology'),
  P('vantage',      'observatory', 2, 55, 'vantages'),
  P('relativity',   'observatory', 2, 56, 'moving-frame'),
  P('aerodrome',    'observatory', 2, 57, 'aerospace'),

  /* ── THE PROMENADES — 3 rooms, `crescent` (§2.1). ── */
  P('the-long-way-home', 'promenades', 1, 60, 'processions'),
  P('holonomy',          'promenades', 2, 61, 'curved-country'),
  P('gnomon',            'promenades', 2, 62, 'horology'),

  /* ── THE FAIRGROUND — 16 CHILD tiles (contract `detach`; no room-level flag). 15
     amusements + rattleback (wingless — knot needs no cluster, §2.3). ── */
  P('carousel',          'fairground', 2, 70, 'amusements'),
  P('ferris-wheel',      'fairground', 2, 71, 'amusements'),
  P('arcade',            'fairground', 2, 72, 'amusements'),
  P('mirror-maze-ride',  'fairground', 2, 73, 'amusements'),
  P('coconut-shy',       'fairground', 2, 74, 'amusements'),
  P('helter-skelter',    'fairground', 2, 75, 'amusements'),
  P('ghost-train',       'fairground', 2, 76, 'amusements'),
  P('dodgems',           'fairground', 2, 77, 'amusements'),
  P('big-wheel',         'fairground', 2, 78, 'amusements'),
  P('waltzer',           'fairground', 2, 79, 'amusements'),
  P('test-your-strength','fairground', 2, 80, 'amusements'),
  P('fortune-teller',    'fairground', 2, 81, 'amusements'),
  P('shooting-gallery',  'fairground', 2, 82, 'amusements'),
  P('swingboats',        'fairground', 2, 83, 'amusements'),
  P('tunnel-of-love',    'fairground', 2, 84, 'amusements'),
  P('rattleback',        'fairground', 3, 85),

  /* ── THE NUMBER GARDEN — 3 rooms, `pascal` (§2.1). ── */
  P('numbers-room',       'number', 1, 100, 'number'),
  P('construction-bench', 'number', 2, 101, 'figures-you-construct'),
  P('the-drawing-room',   'number', 2, 102, 'drawing-engines'),

  /* ── THE OPTICKS COURT — 2 rooms, `court` (§2.1). ── */
  P('hall-of-mirrors', 'opticks', 1, 110, 'optics'),
  P('ripple',          'opticks', 2, 111, 'waves'),

  /* ── THE CAVERN — 1 room, `knot`, no cluster (§2.1). ── */
  P('physics-lab', 'cavern', 1, 120),

  /* ── THE MAKER'S SHED — 1 room, `knot`, no cluster (§2.1). ── */
  P('workbench', 'outbuilding', 1, 130),

  /* ── THE SOUTH APPROACH — 2 rooms, `roadside` (§2.1/§4). ── */
  P('estate-gate',  'approach', 1, 140),
  P('card-catalog', 'approach', 2, 141)
];

module.exports = { PLACES: PLACES };
