/* ═══════════════════════════════════════════════════════════════════════════
   THE ESTATE MANIFEST — registry.mjs  (DESIGN §6.2, §7.1)

   The EXPLICIT extractor registry — "explicit, not magic": one row per hub
   naming its extraction rule. The manifest generator (manifest.mjs) reads the
   front-door PLACES for the rooms and THIS registry for how each hub's exhibits
   are scraped, then computes the sole-hub set mechanically and diffs it against
   the R3 stray table (DESIGN §7.3: the transcription seeds, the derivation
   checks). Seeded from research/orphans.md's verified 140-dir inventory and
   RE-VERIFIED against the live repo's reverse-link index (repo wins where the
   two disagree — see the notes below).

   FOUR claim channels partition all 233 top-level dirs (DESIGN §6.2 completeness
   law — every dir claimed by EXACTLY one of):
     1. a ROOM href           — from PLACES (94 rooms this wave, pre-gather)
     2. an EXHIBIT href       — scraped per HUBS below, + the R3 STRAYS, +
                                COMPANIONS + WITHINS + the internal INTERNAL rows
     3. a COLLECTION          — the CROSS crossings collection claims `cross/`
        / HIDDEN                the HIDDEN node claims `starlight-bend/`
     4. the ALLOWLIST         — engines / meta / records (present-or-future)

   Nothing here mutates a page. The R3 STRAYS and COMPANIONS/WITHINS are enrolled
   as manifest rows now (so `unclaimed: []` holds at W2.1a); the matching on-PAGE
   links land in W2.3 (DESIGN §10 W2.3). Every extracted/declared href must exist
   on disk — manifest.mjs hard-errors otherwise.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── HUBS: rooms that PRESENT top-level-dir exhibits in a first-class idiom ────
   `firstClass` = the class token(s) that mark THIS hub's own exhibit idiom
   (the mechanical predicate, DESIGN §7.1 R1 round-11 — a link in the hub's
   first-class exhibit idiom is a HUB PRESENTATION; a `.back`/`.sib`/prose link is
   a CROSS-REFERENCE). The token set is PER-HUB because the same class means
   different things on different pages (repo-verified): cartographer/daedalus/
   tone-mill present exhibits via `.sib-link`, aerodrome via `.sib`, while
   reckoning/hours/cartouche/… list theirs as plain (class-less) links — for those
   the sentinel `_NONE` matches a class-less <a>. A hub is listed ONLY if it OWNS
   at least one primary piece; rooms that merely cross-reference a piece
   (hexapawn→adversary, differential-gear→slipstick, first-light→last-scattering,
   …) are deliberately absent, so those pieces resolve to their true first-class
   hub (or the Shed) — never to an incidental linker. ── */
export const NONE = '_NONE';   // sentinel: matches a class-less <a>

export const HUBS = [
  { hub: 'numbers-room',       firstClass: ['bench'] },
  { hub: 'hall-of-mirrors',    firstClass: ['card'] },
  { hub: 'workbench',          firstClass: ['card-link'] },
  { hub: 'midway',             firstClass: ['ride'] },
  { hub: 'sewing-room',        firstClass: ['bench'] },
  { hub: 'the-drawing-room',   firstClass: ['chip'] },
  { hub: 'museum',             firstClass: ['card'] },
  { hub: 'cartographer',       firstClass: ['sib-link'] },
  { hub: 'daedalus',           firstClass: ['sib-link'] },
  { hub: 'tone-mill',          firstClass: ['sib-link'] },
  { hub: 'aerodrome',          firstClass: ['sib'] },
  { hub: 'why-the-sky-is-blue',firstClass: ['chip'] },
  { hub: 'conservatory',       firstClass: [NONE, 'bed'] },  // 'bed' = the-wrinkling gather bay (§2.6 gardens flip)
  { hub: 'reckoning',          firstClass: ['open-btn', NONE] },
  { hub: 'hours',              firstClass: [NONE], file: 'hours/the-hours.html' },
  { hub: 'cartouche',          firstClass: [NONE] },
  { hub: 'construction-bench', firstClass: [NONE] },
  { hub: 'the-keystone-arch',  firstClass: [NONE] },
  { hub: 'clockwork',          firstClass: [NONE, 'xcard'] },
  { hub: 'sound-garden',       firstClass: [NONE] },
  { hub: 'cavern',             firstClass: ['bench'] },   // presents brachistochrone as a lab bench (../ link)
  // ── §2.6 gather hosts (W2.8a flip): each now PRESENTS its gathered pieces in
  //    its own first-class idiom (the retired PLACES rows become these exhibits) ──
  { hub: 'glasshouse-range',   firstClass: ['bay'] },     // 4 glass bays → arctic-circle · weather-you-can-make · kirigami · the-aquarium
  { hub: 'orbit-house',        firstClass: ['alcove'] },  // 3 alcoves → equal-area-sweep · two-bulges · einstein-ring (the .orrery-pit is a doorway, NOT gathered)
  { hub: 'stellar-forge',      firstClass: ['card'] },    // breathing-star · parallax-baseline
  { hub: 'first-light',        firstClass: ['baydoor'] }, // recombination (the .baydoor bay; NOT .chip, which also cross-links last-scattering/transit/stellar-forge)
  { hub: 'vantage',            firstClass: ['lit'] },      // the-sightline (the "scenes you walk into" genre index; .xlink is a cross-reference)
  { hub: 'lodestone-hall',     firstClass: [NONE] },       // iron-filings · bootstrap-bench (classless menu links); also absorbs the curie-dial stray as a real exhibit
];

/* ── INTERNAL: hubs whose exhibits are INTERNAL sub-pages (not top-level dirs) ──
   These never affect the completeness gate (they are not top-level dirs); they
   contribute their pieces to the estate-wide + per-district `pieces` counts (the
   honest depth the §5.5 map tally reads). DESIGN §6.2 names js-manifest
   (sound-garden, arcade) and pieces-dir (strange-garden); cavern is the 21-bench
   exemplar the gather copies (§2.1). ── */
export const INTERNAL = [
  // `base` = the dir the manifest's `file:` slugs actually resolve under (arcade
  // serves its games from arcade/games/, sound-garden its racks from sound-garden/).
  { hub: 'sound-garden', rule: 'js-manifest', file: 'sound-garden/instruments.js', base: 'sound-garden', kind: 'instrument' },
  { hub: 'arcade',       rule: 'js-manifest', file: 'arcade/games.js',              base: 'arcade/games', kind: 'game' },
  { hub: 'strange-garden', rule: 'pieces-dir', dir: 'strange-garden/pieces', kind: 'piece' },
  { hub: 'cavern',       rule: 'internal-links', file: 'cavern/index.html', firstClass: ['bench'], kind: 'bench' },
];

/* ── STRAYS: the R3 re-homing table (DESIGN §7.1 R3) ──────────────────────────
   Post-epoch Workbench-only pieces given honest kin hubs. The generator computes
   the sole-hub (first-class-only-on-Workbench) set MECHANICALLY; for each such
   piece this table BINDS its new primary hub (else it defaults to the Shed + a
   log line, §7.3). Verbatim from R3. Repo note (repo-wins flag): the live pages
   already carry an INCIDENTAL class-less link to curie-dial (iron-filings) and
   elementary-garden (the-wrinkling); those linkers are NOT hubs, so the pieces
   are still sole-hub-Workbench and the R3 binding (lodestone-hall / strange-
   garden — the deliberate thematic home) governs. W2.3 lands the kin-hub link. */
export const STRAYS = {
  bifurcation:        'conservatory',
  buffon:             'numbers-room',
  butterfly:          'sound-garden',
  'curie-dial':       'lodestone-hall',
  'elementary-garden':'strange-garden',
  'aperiodic-patch':  'strange-garden',
  'fractal-dimension':'cartographer',
  'giant-component':  'numbers-room',
  pathfinder:         'daedalus',
  plumbline:          'reckoning',
  resonance:          'sound-garden',
  rydberg:            'cavern',
  'sampling-theorem': 'sound-garden',
  'the-trading-bench':'sound-garden',
  'the-unstirring':   'engine-room',
  tusi:               'the-drawing-room',
};

/* ── HERITAGE: the R2 Maker's-Shed heritage set (DESIGN §7.1 R2) ──────────────
   Pre-epoch, Workbench-only first instruments that STAY Workbench-homed and are
   the Shed's advertised "20+ first instruments". These are not re-homed — they
   simply resolve to the Workbench (outbuilding) as their sole first-class hub.
   Listed here for the advertisement copy + a cross-check (the generator asserts
   its computed sole-Workbench set ⊇ HERITAGE − {abacus,astrolabe,slipstick},
   which are R1 elsewhere). */
export const HERITAGE = [
  'abacus', 'adventure', 'adversary', 'black-chamber', 'scytale', 'epicycles',
  'galton', 'harmonograph', 'latch', 'letterer', 'loom', 'patience', 'turing',
  'volvelle',
];

/* ── COMPANIONS: R5 companion pairings (DESIGN §7.1 R5) ───────────────────────
   Enrolled as kind:'companion' exhibit rows under the parent room. `orrery` is a
   multi-room companion (firmament + 6 more) — its PRIMARY parent is firmament
   (R:orphans). Three of these are ALSO WITHINs (below); WITHIN takes claim
   priority (a piece is claimed once), the companion tie is recorded as an
   annotation, never a second claim. */
export const COMPANIONS = {
  blazon:                    'compositor',
  orrery:                    'firmament',
  scriptorium:               'verse',
  theogony:                  'threshold',
  tessellarium:              'strange-garden',
  'the-homicidal-chauffeur': 'warren',       // also WITHIN
  'the-rewind-shelf':        'reversing-room',// also WITHIN
  'tippe-top':               'the-top',       // also WITHIN
};

/* ── WITHINS: the four formalized WITHIN nominations (DESIGN §7.2) ────────────
   kind:'within' rows carry the parent room + the ws gate key (the discovery beat
   is BUILT in W2.4; the gate key here is the conventional `ws:seen:<id>` the
   builder wires — refined in W2.4 if a room uses a bespoke key). soap-film is a
   within of the-wrinkling AND keeps its casting-floor companion tie (§7.2). */
export const WITHINS = {
  'tippe-top':               { parent: 'the-top',        gate: 'ws:seen:tippe-top' },
  'the-homicidal-chauffeur': { parent: 'warren',         gate: 'ws:seen:the-homicidal-chauffeur' },
  'soap-film':               { parent: 'the-wrinkling',  gate: 'ws:seen:soap-film' },
  'the-rewind-shelf':        { parent: 'reversing-room', gate: 'ws:seen:the-rewind-shelf' },
};

/* ── CROSS: the R4 Crossings collection (DESIGN §7.1 R4) ──────────────────────
   The 14 `cross/*` two-parent pieces become a Register-searchable collection.
   The collection claims the single top-level `cross/` dir; the 14 sub-pieces are
   its content (each an estate-wide piece; NOT nested under any district — §6.1).
   The per-parent double-links land in W2.3. `pieces` is derived from the on-disk
   cross subdirs by the generator (this list is the expected roster, asserted
   equal so a drift fails loud). */
export const CROSS = {
  id: 'crossings',
  label: 'The Crossings',
  dir: 'cross',
  roster: [
    'felt-gravity-curve', 'one-falling-two-ways', 'one-velocity-two-shifts',
    'the-fold-they-share', 'the-same-beat', 'the-same-heat',
    'the-same-hump-two-clocks', 'the-same-sinc', 'the-same-threshold',
    'the-shape-they-share', 'two-costumes', 'two-roads-one-rhythm',
    'two-ways-to-pi', 'weightless-at-the-top',
  ],
};

/* ── HIDDEN: the R7 sky-gated secret (DESIGN §7.1 R7) ─────────────────────────
   starlight-bend is reachable only via the sky-star/constellation mechanic;
   the Register indexes it only once `ws:seen:starlight-bend` exists (lock-parity,
   asserted in W6). It claims the starlight-bend/ dir and counts estate-wide only. */
export const HIDDEN = [
  { id: 'starlight-bend', gate: 'sky', ws: 'ws:seen:starlight-bend', href: 'starlight-bend/index.html' },
];

/* ── ALLOWLIST: engines / meta / records (DESIGN §6.2) ────────────────────────
   Dirs claimed by presence in this list rather than a room/exhibit link. An
   allowlist entry gates presence, it does NOT require it — `cabinet-of-honors`
   lands at W3.5 (§10 note). `the-gate` is NOT here (the estate-gate room href
   claims it); `cross` is NOT here (the crossings collection claims it) — listing
   either in two places would be the very double-claim the law forbids (§6.2). */
export const ALLOWLIST = [
  'tools', 'the-fairground-gate', 'art-foundry', 'gate-foundry', 'seedbed',
  'ledger', 'worklog', 'colophon', 'assets', 'voices', 'regalia',
  'cabinet-of-honors',
];
