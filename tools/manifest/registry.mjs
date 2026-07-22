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
  // ── §2.6 gather hosts (W2.8b flip: opticks · promenades) ──
  { hub: 'ripple',             firstClass: ['heard-tank'] }, // The Wave Tanks ← loud-and-quiet (the #heardTank prominence bay; NOT the classless ../pool link, which is Hall of Mirrors' card)
  { hub: 'holonomy',           firstClass: ['hallcard'] },   // Curved Country ← unrolled-cone (the #coneHall gather door; .card hallcard)
  // The Magic Lantern PRESENTS its one hands-on optical-projection exhibit (The Shadow
  // Theater) via the `.stage-door` first-class idiom — a UNIQUE token that matches ONLY
  // that exhibit link, never the film cards' `.live`/`.take` cross-references to the
  // trailer/talk recordings (those stay cross-refs, resolving to their own hubs).
  { hub: 'magic-lantern',      firstClass: ['stage-door'] },
];

/* ── INTERNAL: hubs whose exhibits are INTERNAL sub-pages (not top-level dirs) ──
   These never affect the completeness gate (they are not top-level dirs); they
   contribute their pieces to the estate-wide + per-district `pieces` counts (the
   honest depth the §5.5 map tally reads). DESIGN §6.2 names js-manifest
   (sound-garden, arcade) and pieces-dir (strange-garden); cavern is the 21-bench
   exemplar the gather copies (§2.1). the-barrel-house (WS2 §9 T3.0) is a second
   `internal-links` hub: its landing presents pin-barrel + mirror-drum via a
   `class="card"` grid of SUBDIR links (NOT the `.bench` idiom); the `card dark`
   future seat is a <div> (no <a>, unmatched) and the `../tone-mill/` footer link
   is a cross-reference (`../` prefix, unmatched by the no-`../` subdir regex — it
   resolves to its own Tone Mill hub, per the cross-reference convention). ── */
export const INTERNAL = [
  // `base` = the dir the manifest's `file:` slugs actually resolve under (arcade
  // serves its games from arcade/games/, sound-garden its racks from sound-garden/).
  { hub: 'sound-garden', rule: 'js-manifest', file: 'sound-garden/instruments.js', base: 'sound-garden', kind: 'instrument' },
  { hub: 'arcade',       rule: 'js-manifest', file: 'arcade/games.js',              base: 'arcade/games', kind: 'game' },
  { hub: 'strange-garden', rule: 'pieces-dir', dir: 'strange-garden/pieces', kind: 'piece' },
  { hub: 'cavern',       rule: 'internal-links', file: 'cavern/index.html', firstClass: ['bench'], kind: 'bench' },
  { hub: 'the-barrel-house', rule: 'internal-links', file: 'the-barrel-house/index.html', firstClass: ['card'], kind: 'exhibit' },
  // The Standing Stones GATHERS its moving-wall kin The Sluice-Gate as a nested exhibit (the-standing-
  // stones/the-sluice-gate/) — the fairground is at its 16-tile capacity, so the Drover's third star rides
  // WITHIN its closest kin (the §2.6 gather / "lodestone-hall absorbs curie-dial" pattern) rather than
  // minting a lonely 17th footprint. Presented via the `.gate-link` first-class idiom on the room page.
  { hub: 'the-standing-stones', rule: 'internal-links', file: 'the-standing-stones/index.html', firstClass: ['gate-link'], kind: 'exhibit' },
  // In the Round holds its solids as HALLS: hall one (the armillary) is the room
  // page itself, hall two (in-the-round/trefoil/) a nested exhibit presented off
  // the landing in the `hall-link` idiom. A DEEPEN — same engine, same room shell,
  // same roof — so it mints no second front-door footprint.
  { hub: 'in-the-round', rule: 'internal-links', file: 'in-the-round/index.html', firstClass: ['hall-link'], kind: 'exhibit' },
  // The Ten-Fold Glass GATHERS its twin The Hour-Glass as a nested exhibit
  // (ten-fold/hour-glass/) — the same brass wheel + zoom-to-descend engine, but
  // its number d picks which TEMPO is real instead of which SIZE fills the frame.
  // A DEEPEN — one engine (glass.mjs), one room shell, two glasses on one bench —
  // so it mints no second front-door footprint and no new sky star. Presented off
  // the Glass's chrome via the `sib-glass` first-class idiom.
  { hub: 'ten-fold', rule: 'internal-links', file: 'ten-fold/index.html', firstClass: ['sib-glass'], kind: 'exhibit' },
  // `flat` — explicit visitor leaf pages that live DIRECTLY in a hub dir (not a
  // subdir, not in a js-manifest), so no scrape rule can find them. hours/almanac.html
  // (the Almanac bench, WS4) was the first: a sibling leaf of the-hours.html.
  // A flat leaf is the ONE genuinely ambiguous page shape (a chapter of the room's
  // own flow vs a separate bench vs maker meta), so flat pages stay EXPLICIT: the
  // §6.4 page law refuses any flat page that is neither enrolled here nor DENIED
  // below — a new flat page forces a deliberate call, never a silent hole.
  { hub: 'hours', rule: 'flat', files: ['hours/almanac.html', 'hours/analemma.html'], kind: 'bench' },
  // the Clockwork Automata chapters: ten distinct interactive benches presented
  // off clockwork/index.html (the tokenizer, the temperature dial, …) — the same
  // many-benches-one-room shape as the Cavern, just flat-filed.
  { hub: 'clockwork', rule: 'flat', kind: 'bench', files: [
    'clockwork/autoregress.html', 'clockwork/context.html', 'clockwork/measurement.html',
    'clockwork/next-word.html', 'clockwork/partition.html', 'clockwork/spotlight.html',
    'clockwork/temperature.html', 'clockwork/tokenizer.html', 'clockwork/turn.html',
    'clockwork/unstamped-bag.html',
  ] },
  // NOTE (§6.4): adventure/ and latch/ are Workbench HERITAGE exhibits, not rooms —
  // their interior pages (the three Lantern tales; the akari/slitherlink/warehouse
  // ateliers) are claimed by the unit-interior rule, part of the exhibit itself.
  // the Museum's front-door retrospective gallery.
  { hub: 'museum', rule: 'flat', kind: 'exhibit', files: ['museum/ages.html'] },
  // the Strange Garden's field-notes journal (real visitor reading, own page).
  { hub: 'strange-garden', rule: 'flat', kind: 'exhibit', files: ['strange-garden/field-notes.html'] },
  // ── the SECRET places (both-or-neither / same-locks law, §6.5) ──────────────
  // Every entry below is a walkable page a visitor reaches through a REVEAL-LOCKED
  // link (the Undercroft's niches, ws.js WS.SECRETS). Each enrolls hidden with
  // `lock: '<ws-secret-id>'` — a reference into the LOCKS table below, the SAME
  // predicate that reveals the walkable link — so the catalog shows an entry
  // exactly when the visitor could walk to it, never before, never later. The
  // manifest gate PROVES each LOCKS descriptor equivalent to the live ws.js
  // predicate, so a ws.js change that drifts a lock fails the build by name.
  // the sealed room's diary — reached from the Reliquary annex + the Undercroft
  // niche, both revealed on its own grand key.
  { hub: 'the-reliquary', rule: 'flat', kind: 'exhibit', files: ['the-reliquary/the-mere.html'],
    lock: 'the-mere' },
  // the Living Lattice — the Undercroft's quickening niche links it once the
  // visitor has met BOTH ingredients (game-of-life + lattice): the true PATH lock
  // (the old ws:seen:quickening gate was a visit-proxy — you could walk to it
  // before the catalog admitted it existed).
  { hub: 'sound-garden', rule: 'flat', kind: 'bench', files: ['sound-garden/quickening.html'],
    lock: 'quickening' },
  // the Undercroft's own earned rooms — each niche reveals its stair-level door on
  // the predicate named here (the room card itself additionally sits behind the
  // Undercroft's ROOM_LOCK, so nothing shows before the way down is even found).
  { hub: 'undercroft', rule: 'flat', kind: 'exhibit', files: [
    { href: 'undercroft/the-long-quiet.html',  lock: 'the-long-quiet' },
    { href: 'undercroft/rosette.html',         lock: 'rosette' },
    { href: 'undercroft/codex.html',           lock: 'codex' },
    { href: 'undercroft/floating-ink.html',    lock: 'floating-ink' },
    { href: 'undercroft/almanac.html',         lock: 'almanac' },
    { href: 'undercroft/enigma.html',          lock: 'enigma' },
    { href: 'undercroft/the-night-shift.html', lock: 'night-shift' },
    { href: 'undercroft/light-mixer.html',     lock: 'light-mixer' },
    { href: 'undercroft/keeper.html',          lock: 'm-keeper-of-tales' },
  ] },
];

/* ── LOCKS: reveal-lock descriptors, transcribed from tools/ws/ws.js WS.SECRETS ──
   THE AUTHORITY IS ws.js — these are data transcriptions of its predicate
   functions (functions cannot ride into a JSON slab), in the lockMet grammar
   (card-catalog/core.mjs): a string leaf = key present; {key,min} = numeric ≥;
   {distinctSeen:n} = n distinct ws:seen:* keys; {all:[…]}/{any:[…]} combinators.
   The manifest gate PROVES each row equivalent to WS.unlocked(id, …) by driving
   the real ws.js predicate over satisfied/broken synthetic stores — transcription
   drift fails the build naming the id (the STRAYS seeds-and-checks pattern). */
export const LOCKS = {
  quickening:       { all: ['ws:seen:game-of-life', 'ws:seen:lattice'] },
  'the-long-quiet': { all: ['ws:flag:patience'] },
  rosette:          { all: ['ws:seen:game-of-life', 'ws:seen:lattice', 'ws:flag:patience',
                            'ws:flag:eleven', { key: 'ws:best:swarm', min: 8 }] },
  codex:            { all: ['ws:seen:verse', 'ws:seen:scriptorium'] },
  'floating-ink':   { all: ['ws:seen:cartographer', 'ws:seen:scriptorium'] },
  almanac:          { all: ['ws:seen:verse', 'ws:seen:orrery'] },
  enigma:           { all: ['ws:seen:scriptorium', 'ws:seen:slipstick'] },
  'night-shift':    { all: ['ws:flag:the-lamplighter-won', 'ws:flag:the-ferryman-won'] },
  'light-mixer':    { all: ['ws:flag:earned-rainbow', 'ws:flag:earned-halo', 'ws:flag:earned-spyglass',
                            'ws:flag:earned-camera', 'ws:flag:earned-spectroscope', 'ws:flag:earned-polariser',
                            'ws:flag:earned-anamorphosis', 'ws:flag:earned-iridescence', 'ws:flag:earned-maze'] },
  'm-keeper-of-tales': { all: ['ws:flag:the-lamplighter-won', 'ws:flag:the-ferryman-won',
                               'ws:flag:the-clockmaker-won'] },
  reliquary:        { all: ['ws:seen:reliquary-solved'] },
  'the-mere':       { all: ['ws:seen:the-mere'] },
};

/* ── ROOM_LOCKS: reveal-locks for the LOCKED PLACES rooms (both-or-neither) ─────
   Baked onto the locked slab cards by card-catalog/reclaim.mjs and evaluated by
   core.mjs unlockedFor — the catalog shows a locked room exactly when the visitor
   could WALK to it (weakest path across every way in):
   • undercroft — the front-door stair becomes a LINK only once the rune is found
     (ws:seen:undercroft-rune) or the cellar already visited. (The ≥4-distinct
     broken-stair tile is a TEASER, not walkable — so it does not unlock.)
   • reliquary — the front-door study tile is walkable at ≥8 distinct ws:seen
     rooms (index.src.html revealReliquary); `-opening`/`-seen` keep it for
     returning visitors; the Undercroft niche opens the same door on
     ws:seen:reliquary-solved. Weakest of all four ways in. */
export const ROOM_LOCKS = {
  undercroft: { any: ['ws:seen:undercroft-rune', 'ws:seen:undercroft'] },
  reliquary:  { any: [{ distinctSeen: 8 }, 'ws:seen:reliquary-opening',
                      'ws:seen:reliquary', 'ws:seen:reliquary-solved'] },
};

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
  'the-cartesian-diver':     'glasshouse-range',  // water-kin of the-aquarium; reached via companion chips from the-aquarium + pool
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
  // meta: the Showing (WS2 §10) — a narrated talk deck, not an estate exhibit
  // (no room/exhibit href, not a crossing, not hidden); claimed here like the
  // other engines/meta dirs, contributes no pieces.
  'talk',
  // meta: the estate's trailer film + its music-bed engine module. The films are
  // screened in The Magic Lantern room (magic-lantern/), but the trailer is a
  // rendered picture-deck like the Showing above (no room/exhibit href of its own,
  // not a crossing, not hidden); claimed here alongside talk/. trailer-bed/ is the
  // trailer's Web-Audio bed module (an engine dir). Both predate this claim (added
  // in WS5, never enrolled); folded in when the picture house was raised.
  'trailer', 'trailer-bed',
];

/* ── DENY: pages the §6.4 PAGE LAW must NOT catalogue — each with intent ─────────
   The page law (manifest.mjs) walks every shipped .html on disk and demands that
   each visitor-shaped page be claimed by exactly one channel: a room/exhibit href,
   a HUBS `file:` page, the crossings/hidden claims, the ALLOWLIST (whole dirs,
   recursive), or THIS table. A key is either an exact repo-relative page path or a
   dir prefix ending in '/' (claims every page under it EXCEPT the dir's own
   top-level index.html, which the room/dir law owns). An entry that matches
   nothing on disk FAILS the gate — a stale denial is drift too. Nothing here may
   overlap a catalogued href (the double-claim law extends to pages).

   TWO honest reasons to deny: `meta:` (a maker-side / archival page that is not a
   visitor exhibit) and `secret:` (an EARNED page kept out of the visible catalog
   by spoiler discipline — same law that render-gates the hidden node). ── */
export const DENY = {
  // ── meta: maker-side + archival ──
  'the-gate/audio-bench.html':
    'meta: dev-only SFX render bench (the page titles itself "dev only") — a maker tool, not a visitor page',
  'museum/archive/':
    'meta: frozen point-in-time snapshots of other exhibits (trailer/talk props) — archival duplicates, never catalogue twice',
  'the-aquarium/art-specs/':
    'meta: ART FOUNDRY spec-preview pages (maker-side scaffolding for the room art)',
  'the-value-of-a-cut/art-specs/':
    'meta: ART FOUNDRY spec-preview pages (maker-side scaffolding for the room art)',
  'ten-fold/art-specs/':
    'meta: ART FOUNDRY spec-preview pages (maker-side scaffolding for the room art)',
  // (the Undercroft's interior places are no longer denied: §6.5 both-or-neither
  //  enrolls each as a hidden exhibit locked on its own niche predicate above.)
};
