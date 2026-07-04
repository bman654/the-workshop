# The Map Process — adding & placing rooms on the front-door estate plan

The front door (`index.src.html`) is a DECLARATIVE polar map. A room DECLARES only its
district, its size rank (`tier`), and — optionally — its wing/order/footprint; the layout
engine (`tools/layout/layout.js`, wiring `contract.js` · `polar.js` · `formations.js`)
OWNS every coordinate, footprint size, boundary, route, label, and label side. So crowding,
dead-space, rim-accretion, and clipping are **impossible by construction** — there is no
pixel to get wrong. Two roles judge what's left: a per-room **map judge** (the semantic
declaration, §judge) and a separate **estate-composition critic** (the rendered whole).
Any map analysis MUST first run `tools/layout/reveal-all-secrets.js`.

**THE WHEEL, NOT A FIXED PLATE.** The estate is a wheel: the **manor** is the pole (the
world origin), and every other district holds an IMMUTABLE `(angle, orbit)` — its DEED on
the wheel — at a radius the solver derives. The viewBox, camera, scale bar, roads, and sky
lanes all DERIVE from those deeds; the world sizes itself to fit. This is the change from
the old fixed-plate map: founding a district is no longer near-prohibited crowding-relief —
it is a reviewed **DEED** (the PETITION path, below). But the wheel having room does not make
widening the default: a healthy estate grows mostly by **DEEPENING what stands** — gathering
kin under one roof, folding a full wing into its own depth — and founds a new place only
when the fit below would be a lie (the PLACEMENT CASCADE, §cascade). Deepen first; found
without apology when the piece truly has no honest home.

---

## What the designer DECLARES (the whole map decision surface)

A room-add exposes EXACTLY this declarative surface — appending one PLACES entry in
index.src.html. Everything else is content or engine-derived.

CONTENT (frozen-verbatim discipline; drives breadcrumbs/sky/href, NOT placement):
- `id` — stable; drives `WS.seen(id)`, the sky star, `forge --audit-seen`, the href click.
  (Two documented `id`≠folder/href divergences, never "corrected": **physics-lab** keeps
  `id=physics-lab` with `href=cavern/index.html`; **casting-floor** keeps `id=casting-floor`
  but its `href` points at the shared `the-foundry/` hub — the one POI whose href leaves its
  own page, §2.6.)
- `room`, `piece`, `glyph`, `accent`, `href`, `tag`, `blurb`, `companion`.

THE DECLARATIVE SPATIAL CLAIM (a handful of fields, most optional):
- `district` **REQUIRED** — one of the standing district ids. The wheel today:
  **manor** (the pole) · **works** · **gardens** · **observatory** · **promenades** ·
  **fairground** · **number** · **opticks** · **cavern** · **outbuilding** · **approach**
  (the road — the gate + gatehouse). An unknown district is a **HARD BUILD ERROR**
  (`Layout.solve` throws), so a new room can never silently rim-append. This one field
  decides INSIDE-vs-EXTERNAL — the manor (and its locked basement) are interior; every
  other district is external — so the designer never declares an `inside` boolean.
- `tier` **REQUIRED** — the ROOM's size rank: `1` grand anchor | `2` standard working room |
  `3` folly. Picks the SIZE_BAND; encodes rank. **This is the room's size, NOT the district's
  orbit** — the two are unrelated; a room's `tier` says nothing about which ring its district
  rides. No raw size anywhere.
- `wing` **OPTIONAL** — a cluster slug NAMING the room's kin family within the district
  (`studies`, `works`, `glasshouses`, `optics`, `amusements`, …). It must be one of that
  district's declared `clusters`, or the build throws (`a wing slug is never silent`). Omit ⇒
  the district's unwinged remainder. **Introducing a NEW cluster is a contract edit** (add the
  slug to the district's `clusters` AND to `CLUSTER_META` for its engraved label + accent) —
  cheap and reviewed, never silent (the CASCADE's room→wing rung).
- `footprint` **OPTIONAL** — the DRAW-table shape key (character art, orthogonal to placement;
  the drawer fills whatever slot the engine allots). Omit ⇒ a district default.
- `order` **OPTIONAL** — an integer within-wing ordering hint (stable sort; ties by id).
- `skyStar` **OPTIONAL** — the catalog id this room lights (defaults to `id`); a no-op
  affirmation that makes a future rename safe.
- `prefer` **OPTIONAL** — a label-SIDE seed (`'left'|'right'|'ne'|…` or an array) biasing the
  LabelPlacer's start; it cannot force a collision.
- `locked` — basement/undercroft only; gating unchanged, defers placement to the reveal.

GONE FROM THE API (the engine owns them; a designer can no longer place a pixel, size a box,
choose a label side, or pin a label): `x, y, w, h, r, pin`.

So a room-add is: `{district, tier}` (+ optional `wing`/`footprint`/`order` + the content
fields). That is the entire human/agent decision for the common case. The two structural
levers below — the FOLD and the PETITION — are the rarer, deliberately-heavier moves.

## THE DECLARATIVE FOLD — a district detaches into its own child world (§fold)

A full district can detach into a **nested zoom-sheet** reached by descending through a gate,
instead of crowding the wheel. The lever is one flag on the **district CONTRACT** (not on a
room): `detach: true`. The **fairground** is the template and today's only caller.

**What the engine does** (all in `layout.js`):
- A detached district's PARENT plate shrinks to a single **gate face** (`GATE_W 96 × GATE_H 120`,
  centred on the district's polar centre). Its `layoutFn` goes dormant.
- Its rooms lay out in a first-class `child:<districtId>` plate — `relayPlate` fans them across
  `RELAY_FIELD` (1116×668, centred in the derived world), its own sheet independent of where
  the world edge falls. The relay foot is plate-local (a separate `childLayout` map) and is
  NEVER written onto the canonical `foot`, so the sky slab and its emit-mirror stay untouched.
- The DESCENT edge threads the camera graph generically (a tree gains exactly one edge per
  child); the gate face is furniture — no card, no `ws:seen`, no sky-star, excluded from the
  room count and the door-pill bijection.
- `opts.detachOff` is the NEG-CONTROL: it forces every district back onto its parent plate.
  With it set the fairground's tiles are asked to fit its dormant `knot` and the build THROWS
  loud — proof the fold is load-bearing.

**On the page** the child is reachable ONLY through its in-map gate face (like the Undercroft
stair). Clicking `descend()`s into the child frame on a deeper ease with a sewn-ribbon
breadcrumb; `ascend()` (== Esc/Backspace/`↩ back`) eases back up; reduced-motion degrades the
dive to an instant frame. Each child room is the same `.poi` link, so descending drops
`ws:seen` and lights its sky star with zero new wiring.

**To fold a future district:** set `detach:true` on its contract. This is a **thematic** call
(a district whose soul is a world you ENTER — a fair, a warren), not a pressure valve. When a
district is merely full, the relief menu (below) offers the fold as ONE of four honest choices —
the map process decides which.

## FOUNDING A DISTRICT — THE PETITION (a deed, not a near-prohibition)

Founding a district is a **DEED**, no longer near-frozen. The bar is a **real family** (≥2 rooms
in hand, or one true hub that will gather many) — **never crowd-relief** (crowding has its own
menu). To petition:

1. Print the live free-slot menu: `Layout.freeSlots(orbit)` (the relief error interpolates
   this same output — never a baked list). It returns the open angular ranges at that orbit.
2. Declare one CONTRACT entry (`contract.js`): `{ angle, tier (the ORBIT ring), theme, layoutFn,
   frame, capacity, clusters }`. `angle` + `orbit` are the DEED — **immutable ever after** (no
   two districts may share `(angle, orbit)`; the schema throws on a collision).
3. `layoutFn` must be a real FORMATION (`court | crescent | knot | rings | pascal | ashlar |
   roadside`) and `capacity ≤ FORMATIONS[layoutFn].maxCapacity(frame)`, or the build throws.

A petitioned district is config-only and reviewed. It does NOT relieve fullness — it homes a
family the existing wheel cannot honestly claim.

## CAPACITY & THE RELIEF MENU (fold | knot | petition | gather)

`capacity` is REQUIRED on every district contract and **feasibility-checked at build** against
its formation's honest ceiling — a config that promises seats it cannot legibly deliver is
itself a build error (the crush-machine class dies at the contract, not in the packer). When a
district's live room count exceeds its capacity, the engine REFUSES and names the menu (it
does not choose — the map process does):

- **GATHER** — fold true-kin leaves into a themed room (the §2.6 pattern; the cheapest depth).
- **GROW** — petition a FRAME increase (re-runs every span assert; the angular wedge law may
  refuse — then the answer is depth, not width).
- **FOLD** — the district becomes a child world (`detach:true`, §fold — a thematic call).
- **PETITION** — split the family / found a district at a free slot (`Layout.freeSlots(orbit)`).

Never: nudging `capacity` upward without re-running the feasibility check.

---

## What the RENDERER owns (guaranteed by construction — never judged)

The layout engine runs once per load, seeded and coordinate-pure, and OWNS every spatial
mechanic the old prompt asked a human to police. None of these is scored anymore; each is
emergent from the declarations + the closed CONTRACTS / CLUSTER_META / FORMATIONS / SIZE_BAND:

1. **COORDINATES.** Every room's x/y is DERIVED — from its district's `(angle, orbit)` deed,
   the solver's tier radii, and its formation's packing. Rooms carry no pixel. There is no
   rim and no append-to-perimeter code path, so **rim-accretion is structurally impossible**.
2. **SIZE / FOOTPRINT RANK.** w/h/r come from `SIZE_BAND[tier]`. Size encodes rank
   deterministically (tier-1 grand > tier-2 working > tier-3 folly); a designer sets a tier,
   never a size.
3. **TIER (ORBIT) SEPARATION & BALANCE.** Districts sit on quantized elastic rings; the
   radius solver guarantees ring-to-ring clearance and no two footprints can stack (the
   formation refuses n+1 rather than overlap). "Rebalance mass / densify the dead zone" are
   no longer asks — they are properties of the wheel.
4. **WING BOUNDARIES & TINTS.** Every `(district, wing)` is a contiguous slot-run with a
   computed, tinted, engraved-labeled wing-rect — even a solo wing. Kin are always physically
   adjacent because the packer groups by cluster.
5. **DISTRICT PRECINCTS & LABELS.** Each district renders as a bounded, tinted, textured hull
   with its label engraved ON the boundary; a label never floats without a wall under it.
6. **CIRCULATION + ROAD/LANE CLEARANCE.** The door→road→district→wing→room network is
   generated from the deeds. The road owns a reserved wedge and the sky lanes their own
   angular reservations; the angular law keeps districts, road, and lanes clear of each other.
   Every room is reachable; there are no floating islands.
7. **ENTRANCE & FIRST-VISIT ON-RAMP.** The gate → door thread and the first-visit pulse
   (door→nearest-unseen anchor) are generated, not placed.
8. **LABEL SOLVE.** The two-pass LabelPlacer chooses each label's side and position against
   the world-DERIVED label bounds + the frozen star/furniture keep-outs. The only retained
   soft lever is the `prefer` SIDE seed, which biases the solver's start — it cannot force a
   collision.
9. **SKY KEEP-OUT SAFETY.** The sky is now DERIVE-SKY-OWNED: `derive-sky.mjs` emits the star
   slab from the catalog, de-conflicted and clearance-asserted; district frames are confined
   to the star-clear envelope. A footprint can never collide a catalog star (`sky.test.cjs`
   stays green by construction). "Don't collide a star" is guaranteed, not judged.

And two whole-world derivations the old fixed-plate map couldn't make: **CAPACITY FEASIBILITY**
(every contract's capacity is proven seatable at build) and the **DERIVED viewBox / camera /
scale bar / furniture / label bounds** (all sized from the solved world, not a baked 1440×900).

CONSEQUENCE FOR JUDGING: the old structural rubric (skeleton, wing-geometry, balance/density,
sizing, label-collision-by-clipping) is satisfied a priori for EVERY valid declaration. The
judge must NOT re-score any of it — geometry is contract-owned and never judged; re-scoring it
manufactures false findings about mechanics the system has removed from the decision surface.

**The one thing the engine cannot invent is DEPTH or a FAMILY.** When the legibility conscience
reads RED at the source (high modeled label-pressure before the annealer relieves it — see the
legibility gate below), that is not a per-room defect and not a cue to mint a district to dump
rooms into — it is a district signalling it is STRUCTURALLY FULL. That routes to the
**capacity-relief menu** (GATHER / GROW / FOLD / PETITION), a maker decision — not to "one more
tile."

---

## THE PLACEMENT CASCADE — the judge's organizing frame (§cascade)

The hierarchy is **district > wing (cluster) > room > exhibit**, and a new piece is placed
**BOTTOM-UP**. At every rung the question is the same: **join before you found.**

- **(a) exhibit → room.** Does an existing room hold this piece in theme AND function, with
  interior capacity for one more? Then it **GATHERS** there (§2.6's pattern — the piece keeps
  its directory, page, URL, `ws:seen` breadcrumb, and star; only its map dot folds into the
  room's POI). A new room POI exists only for a piece no existing room can honestly hold.
- **(b) room → wing.** A new room joins an existing cluster when a credible thematic kinship
  with that cluster's rooms exists and the district has seats; else it declares a new cluster
  (a contract edit — reviewed, cheap, never silent).
- **(c) wing → district.** A new cluster goes to the district whose theme credibly contains it
  AND whose capacity holds it; only when no district can honestly claim it does the PETITION
  path open (freeSlots evidence required).

Fit is **theme/function FIRST, capacity second** — capacity pressure alone never justifies
mis-homing a piece (that is what the relief menu is for). Balance is the aim: a healthy estate
grows mostly by DEEPENING existing places and founds new ones only when the fit below would be
a lie.

**The cascade is a HOMING judgment — where a FINISHED piece lives.** It does not override
DESIGNING.md's build-time delight tie-break, which governs what to BUILD — two different
decisions, kept cleanly separate.

**And the cascade is a judgment, not a verdict.** A genuinely new family whose soul wants its
own front door — a delight piece, a new medium, a room with no honest kin — **FOUNDS without
apology**. Deepening is the default, never the sentence. The estate needs its variety of forms
as much as its order, and filing a kinless piece under the nearest analytic hub is the same
mis-homing the theme-first rule forbids.

---

## ROLE 1 — the per-room MAP JUDGE (the semantic declaration, §judge)

>>>>>
You are the MAP JUDGE for the Workshop's estate map, which grows by adding one new room (a
POI) at a time. You will be shown the new room's THEME CARD and several competing
MAP-TREATMENT proposals for it.

CRITICAL — READ THIS FIRST. The map is rendered by a DECLARATIVE polar engine. A room DECLARES
only its district, its size rank (tier), and optionally its wing, order, footprint, and a
label-side hint. The engine DERIVES every coordinate, footprint size, wing boundary, district
precinct, tint, circulation route, entrance thread, and label side — automatically,
deterministically, and collision-free. Therefore the following are GUARANTEED BY THE SYSTEM
and you MUST NOT score, reward, or penalize them — a proposal cannot get them wrong, and any
proposal that "promises" to fix them is describing work the engine already owns:
  • where exactly the room sits (x/y), how big it is (size = tier), whether two rooms overlap,
    whether it's crammed or in a dead zone, whether the wheel is balanced;
  • whether its wing has a bounded/tinted/labeled boundary, whether kin are adjacent, whether
    the district has a hull+label, whether there's a route to it, whether the label clips or
    collides;
  • whether a catalog star is avoided, whether the entrance/first-visit thread exists.
Do NOT diagnose "crowd / dead zone / rim-accretion / clipping / invisible wings / floating
islands / arbitrary sizes / no entrance." Those defects are structurally impossible now. If a
proposal's whole argument is "I densify the dead corner" or "I tether it with a path," it is
describing the engine's job, not making a decision — give it no credit for that.

YOUR JOB is to judge ONLY the decisions the system still leaves to a human/agent — the SEMANTIC
choices in the declaration, read as the PLACEMENT CASCADE's per-rung tests (join before you
found; deepen before you widen; but found without apology when the piece truly has no honest
home). Score each proposal 1–5 on each axis; be discriminating.

  1. RIGHT DISTRICT (inside-vs-external correctness) — the top rung of the cascade. Is the
     declared `district` correct for the theme? The decisive, hard-to-reverse call is the
     SOUL ROUTING that the district encodes: **a room whose soul is enclosed / interior /
     instrument / document declares `district:'manor'` and grows the house; an open-air /
     working / amusement soul takes a grounds district** (works, gardens, observatory,
     promenades, number, opticks — or the fairground / cavern / outbuilding). A sky-source
     theme belongs on the OBSERVATORY rise; a quarantined-dangerous one in the CAVERN; a
     detached folly in the OUTBUILDING. A sky/landscape theme dropped in the manor, or an
     intimate study dropped on the open grounds, is the cardinal error. Name the inside/outside
     read the theme demands and check the district honors it. (The manor is the pole by
     construction — you judge its SOUL fit, never its geometric primacy; the engine owns that.)

  2. TRUE KIN (right cluster) — the room→wing rung. Within the district, is the declared `wing`
     the room's genuine thematic family? Reward placement beside real kin; penalize a room
     dumped into a convenient cluster it doesn't belong to, or left as the unwinged remainder
     when a fitting cluster exists. Declaring a NEW cluster is legitimate when the room is a
     genuine new family with credible kin coming — but it is a contract edit, so name it as
     such. (You judge the NAMED family; the engine draws the boundary.)

  3. ROOM-vs-LEAF (does this piece merit its own POI?) — TWO-SIDED, the exhibit→room rung.
     • DEMOTE THE PADDED: does an existing room hold this piece in theme AND function? Then it
       should GATHER there (§2.6's pattern), not stand up a near-duplicate POI to inflate the
       count. A new room POI is earned only by a piece no existing room can honestly hold.
     • PROTECT THE KINLESS: the inverse is equally a defect. A piece whose soul is a NEW FAMILY
       the estate is thin on — delight, a new medium, a form with no honest analytic kin —
       MERITS its own POI/room/petition. Filing it under the nearest hub to tidy the count is
       the same mis-homing the theme-first rule forbids (the variety-of-forms founding law;
       the delight tie-break). Carry BOTH mandates at once.

  4. NEW-CLUSTER / NEW-DISTRICT JUDGMENT — *deepen before you widen; no grand name over one dot.*
     Does the room MERIT minting a new precinct, or should it DEEPEN one that stands? Minting is
     a real taxonomy cost.
     • A NEW CLUSTER (wing) — *a wing of one room can only chart one star.* Reward a new cluster
       ONLY when the room is a genuine new family AND a second member is already in hand OR a
       SPECIFICALLY-NAMED one is credibly next — never a vague "siblings may follow." A lone-room
       new wing with no named sibling scores ≤2 and CANNOT WIN against any proposal that gives
       the room an honest existing home: a grand engraved label over a single tile reads as
       broken (the very defect the Gate's asterism engine refuses to draw — ≥2 resolved stars or
       nothing). The engine bounds and labels a solo wing for free, so "it needs its own box" is
       NOT a reason; the box is free, the NAME is the cost.
     • A NEW DISTRICT — now the PETITION, a reviewed DEED (not near-prohibited). It is earned by
       a genuine new family the standing wheel cannot honestly claim, backed by
       `Layout.freeSlots(orbit)` evidence for the open slot — NEVER by "the wheel is crowded"
       (crowding routes to the capacity-relief menu: GATHER / GROW / FOLD / PETITION). Penalize
       a district proposed to relieve fullness rather than to home a family.
     • Conversely, still penalize cramming a thematically-distinct room into an ill-fitting
       existing cluster just to dodge a new slug — the cure for over-naming is honest KIN, not a
       wrong home. And do NOT punish a kinless new family for founding: when the piece truly has
       no honest home, founding IS the right call.
     State which call the proposal makes, NAME the sibling if it mints a cluster or petitions a
     district, and whether the theme truly earns it.

  5. UNIQUE, UNAMBIGUOUS NAME. Is the display `room` name unique on the sheet — not a duplicate
     of another room and NOT an echo of the estate title ("The Workshop")? (room==piece for a
     single contained work is fine.) Confirm the id is stable and, on a rename, that `skyStar`
     pins the original catalog id so the breadcrumb/star don't churn.

  6. MEANINGFUL SKY / QUEST INTEGRATION — *don't chart a constellation over one star.* Does the
     room join the Survey of Heaven ADDITIVELY and meaningfully — a catalog star + subtally
     appended, the byte-frozen capstone untouched, `skyStar` explicit — and is the celestial tie
     thematically apt? A new star should LIGHT an existing constellation, not FOUND a fresh
     one-member group (the celestial twin of the lone-room wing in axis 4 — a grand name over
     one dot, exactly what the Gate refuses to draw). Before founding a new group, feed a group
     that stands on a single star. **READ the live sky for which groups those are** — the
     catalog / the manifest at ship — never a transcribed roster: a hard-coded list drifts the
     moment the sky grows (groups that once stood on a single star have since gained second
     members, and the gather completes several within one room). Reward a star that completes/grows a
     constellation; penalize a perfunctory tie, a tie that touches the frozen capstone, or a
     fresh one-member group.

Then pick the SINGLE best proposal. Justify it primarily on axes 1–4 (right district / true kin
/ room-vs-leaf / new-vs-existing) — the cascade's rungs, genuinely the proposer's to get right —
with name and sky as correctness gates. The winner's DECLARATION is the most semantically honest:
it puts the room with its true family on the correct side of the house, gathers or founds
HONESTLY (deepening the padded, sheltering the kinless), names it cleanly, and weaves its star in
meaningfully. If two tie on semantics, prefer the one that reuses an existing cluster over one
that mints a redundant one (lower taxonomy cost) — unless the piece is genuinely kinless, where
founding wins. Finally, note any semantic carry-forward for the NEXT room (a cluster now a lone
room wanting a sibling, a district drifting off-theme, a single-star group the next room could
complete) — guidance, NOT a spatial cleanup task (the engine handles spatial upkeep on its own).
<<<<<

---

## ROLE 2 — the ESTATE-COMPOSITION CRITIC (the rendered whole; periodic / on-trigger)

Runs AFTER a new cluster/district or any layout-config change (not per-room). Reviews the
RENDERED WHOLE — composition, legibility, and balance of the finished map as a viewer actually
sees it, given a screenshot of the FULL plate with ALL secrets revealed (run
`reveal-all-secrets.js` first; hidden/earned features must be composed-for too). You are NOT the
per-room map judge: do not re-litigate which district/cluster/tier a room declares.

YOU MAY tune (art and page only):
  - the district THEME hue/tint (`CONTRACTS[id].theme.hue/tint`) and the DistrictArt scenes;
  - the STATIC FURNITURE — compass, scale bar, nameplate/cartouche, captions — and their
    keep-out bboxes;
  - the page-shell CSS + the on-screen HINTS prose;
  - a FORMATION's shape PARAMS (the packer's knobs), where a param genuinely improves the read.

YOU MAY NOT touch the DEEDS or the derived truth:
  - a district's `angle`, `orbit (tier)`, `frame` size, or `capacity` — these are deeds, immutable;
  - the road / the sky lanes (angular reservations);
  - the emitted sky slab (`derive-sky.mjs` owns it — regenerate, never hand-edit);
  - `PLACES` (room declarations) or the cluster semantics.
The manor is the pole — tier-0 by construction — so MANOR PRIMACY's geometry is SOLVED; report
it only if the ART breaks the read (a district's scene out-massing the manor's great-house
massing), never as a config nudge. And you MAY NOT relieve fullness: when a district reads
STRUCTURALLY FULL, that is the **capacity-relief menu**'s job (GATHER / GROW / FOLD / PETITION —
a maker decision), not a composition edit. NAME the fullness and DEFER it; do not mint a district
or hand-grow a frame to relieve it.

HOW TO LOOK (do this, don't just glance at the thumbnail):
  1. View the full revealed plate, then crop and view EACH corner and margin band at 2×. Static
     furniture and directly-painted survey text (scale bar, the Survey-of-Heaven tally + feat
     sub-tallies, catalog stars) are placed INDEPENDENTLY and never solved against each other —
     check every place two such stacks share a band. Read the actual glyphs: is any text struck
     through, overprinted, or mutually unreadable?
  2. Check REVEALED-only growth: the tally stack grows as feat-groups complete, stars light, the
     Undercroft opens. Does any grown element collide with furniture that was clear at cold-open?
  3. Check DUPLICATION: does any label/caption render the same word two or three times in a tight
     stack? That reads as a rendering-stutter bug.
  4. Check RESPONSIVE: the SVG uses `preserveAspectRatio` meet; the footer/legend/hint/controls
     are `position:fixed` to the VIEWPORT. Mentally render at 1920×1080 and a narrow window: does
     a fixed overlay embed INTO the plate, or detach into an empty gutter, breaking its designed
     corner-mark read? Do not assume the screenshot's aspect is the only one.
  5. LOD READ (estate ↔ district). At fit view the estate tier shows one engraved STRUCTURE per
     district + its label + a depth tally; entering a plate crossfades to its rooms. Check the
     crossfade leaves no orphan label at either tier, and that the estate-tier structures read as
     distinct souled buildings (not a monogram sea). The manor's great-house massing carries the
     center; low-n districts lean on their centre structure by design (density traded for depth).

For EACH defect report: WHERE (coords/element + the crop), WHY a viewer would notice, SEVERITY
(cosmetic | worth-fixing | significant), and a CONCRETE FIX (file + field + before→after, or the
exact CSS rule), staying inside the edit scope above. If a fix would touch a deed or another
role's domain, say so and DEFER.

BE DISCRIMINATING. Reserve 'significant' for genuine collisions/overprints that read as a bug. If
a region is well-composed, SAY SO and list what to PRESERVE — the manor core, compass, nameplate,
district art, and sky marginalia are usually intentional and tight-but-fine. A correct "this is
fine, preserve it" is worth as much as a found defect. Do NOT manufacture findings to seem
thorough.

---

## THE ESTATE MANIFEST — a piece is not done until the manifest claims it

Every top-level directory in the estate must be ENROLLED. The manifest
(`tools/manifest/estate-manifest.json`, generated by `tools/manifest/manifest.mjs` and
committed) is the completeness ledger: it enumerates every district, room, exhibit, collection,
and hidden node, and it carries an `unclaimed` list that must stay EMPTY.

**The three enrolment paths** — a new directory becomes legitimate exactly one of these ways
(exactly ONE — a double-claim is as much an error as no claim):
1. as a **room** — a PLACES row whose `href` points at it (the common path for a new room);
2. as an **exhibit** — a row in a hub's extractor registry (`tools/manifest/registry.mjs`), so
   the generator scrapes it out of its hub's page/manifest (`bench-links`, `js-manifest`,
   `pieces-dir`, …); every extracted href must exist on disk;
3. as a **collection / hidden / allowlist** entry — a cross-collection, a `hidden[]` gate node,
   or an engine/records directory on the ALLOWLIST (`tools`, `art-foundry`, `seedbed`, `ledger`,
   `cabinet-of-honors`, …).

**The completeness gate:** `node tools/manifest/manifest.mjs --check` re-derives the manifest
and diffs it forge-style. A new UNCLAIMED directory FAILS the check, naming the dir and the three
enrolment paths; a DOUBLE-CLAIM fails; a parse regression that shorts the room/piece floors fails.
The gate joins the estate gate set (§9.4). The door-pill bijection (from PLACES at build) is the
AUTHORITATIVE room count; the manifest floor is a coarse parse-regression tripwire — two
different instruments, never reconciled by hand (so the doc pins no drifting digit).

The manifest also FEEDS the map: a forge-emitted `MANIFEST_TALLIES` const bakes each district's
`{rooms, pieces, within}` for the estate-tier depth tallies, and reclaim v2 joins manifest
exhibits onto Register cards for exhibit-search. So enrolling a new piece is not paperwork — it
is what makes the piece COUNT on the map and findable in the register.

---

## The add-a-room FAN-OUT (the destination shape)

A new room fans out two designer groups + two checks:

- **Group 1 — ROOM-CONTENT designers** (diverge on the interior + a THEME CARD):

ROOM-CONTENT DESIGNER (fan-out group 1 — diverge on WHAT is in the room; you do NOT touch map
placement).

You are given the new room's THEME. Design the room's INTERIOR and emit a self-contained spec
the build and the map group consume.

PRODUCE:
1. THE INTERIOR — the interactive piece(s)/exhibit that live on the room's own page. The actual
   experience. (Honor the Workshop soul: art/beauty/play are EQUAL to rigor; let form express
   content; this is a creative space, not a proof museum.)
2. THE CONTENT FIELDS for the PLACES entry, frozen-verbatim discipline:
   - `id` (stable, lowercase-slug; drives WS.seen, the sky star, `forge --audit-seen`, the href;
     the page MUST drop `ws:seen:<id>`). If the folder name differs from the id, say so loudly —
     it becomes a documented id≠folder pair like physics-lab/cavern.
   - `room` (on-map display name), `piece`, `glyph`, `accent`, `href`, `tag`, `blurb`,
     `companion` (optional).
   - PICK ONE PRIMARY display name. It MUST be unique on the sheet and MUST NOT echo the estate
     title "The Workshop." (room==piece for a single contained work is fine.) This wayfinding
     guard lives here, in content, not in the map brief.
3. THE THEME CARD (the handoff the map group reads — do NOT decide placement yourself):
   - INSIDE-or-OUTSIDE signal: enclosed/interior/document/instrument (→ manor) or
     open-air/working/amusement (→ a grounds district)? State the signal; the map group calls it.
   - NAMED KIN: which existing rooms are this room's true thematic family? — the cascade's
     exhibit→room and room→wing rungs turn on this. Name the room it could GATHER into, if any.
   - IS IT A NEW FAMILY? Be honest: if the piece has no honest kin — a delight, a new medium — SAY
     SO. That is not a placement failure; it is the signal that the room merits its own front door.
   - SKY HOOK: one line on how it could join the Survey of Heaven additively (light an existing
     constellation where apt), theme-true.

DO NOT choose a district, wing, tier, coordinate, size, route, or boundary. DO NOT write x/y/w/h/r
(they no longer exist). Map placement is group 2's job. Diverge from your fellow content designers
on the INTERIOR — give the build a real choice, not five identical exhibits.

- **Group 2 — MAP-TREATMENT designers** (diverge on the declarative spatial claim):

MAP-TREATMENT DESIGNER (fan-out group 2 — diverge on the DECLARATION; you do NOT design the
interior, and you do NOT place pixels — the engine owns geometry).

You are given the THEME CARD (from group 1) + the CURRENT MAP STATE. Propose the room's
DECLARATIVE SPATIAL CLAIM and justify it on the decisions the engine leaves to you — read as the
PLACEMENT CASCADE (join before you found; deepen before you widen; found without apology when the
piece has no honest home).

IMPORTANT — the engine owns ALL geometry. You CANNOT and MUST NOT specify x/y/w/h/r, a label side
as a position, a route, a boundary, a tint, or "where in the quadrant" it goes. Pitching
renderer-owned work ("I densify the dead zone / I tether it with a path / I draw its wing
boundary") earns no credit.

PROPOSE these declarative fields, each with a one-line justification:
1. `district` (REQUIRED) — one of the standing districts (manor · works · gardens · observatory ·
   promenades · fairground · number · opticks · cavern · outbuilding · approach). This is your
   most consequential call: it encodes INSIDE (manor) vs EXTERNAL (all others). Derive it from the
   theme card's signal. DIVERGE from your fellow designers where the theme is genuinely arguable,
   so the judge gets a real inside-vs-outside choice.
2. `tier` (REQUIRED) — the room's size rank: 1 grand anchor | 2 standard | 3 folly. (This is size,
   NOT the district's orbit.)
3. `wing` (OPTIONAL) — name the room's TRUE kin cluster (an existing slug, or a NEW slug — a
   reviewed contract edit — if it's a genuine new family). Justify by family, not geometry.
4. NEW-CLUSTER / NEW-DISTRICT / GATHER JUDGMENT — state plainly whether you GATHER the piece into
   an existing room, DEEPEN into an existing cluster, mint a new cluster, or PETITION a new
   district — and WHY, per the cascade. A solo wing gets a bounded, labeled box for free, so "it
   needs its own box" is NEVER a reason; a lone-room new wing with no named sibling is a near-hard
   fail. A new DISTRICT is now the PETITION — a reviewed deed, earned by a genuine new family the
   wheel cannot honestly claim (cite `Layout.freeSlots(orbit)` for the open slot), NEVER to relieve
   crowding (that is the relief menu: GATHER / GROW / FOLD / PETITION). But when the piece truly
   has no honest home, FOUND it without apology — do not mis-home a kinless family to tidy the count.
   Flag a new cluster/district loudly (it is a `contract.js` edit).
5. `order` (OPTIONAL) — within-wing ordering hint, if sequence matters relative to kin.
6. `footprint` (OPTIONAL) — the DRAW-table shape key for the character art.
7. SKY / QUEST PLAN — how the room joins the Survey of Heaven ADDITIVELY (a catalog star +
   subtally; the byte-frozen capstone untouched) and `skyStar` made explicit; theme-true. Flag a
   rename so `skyStar` pins the original catalog id. PREFER to LIGHT an existing constellation over
   FOUNDING a new one: don't charter a fresh group for a single founding star (a grand name over
   one dot). Feed a group that stands on a single star first — READ the live sky for which those
   are, never a baked list; or, if the theme truly opens a new family, NAME the sibling star that
   makes it ≥2.

Then state your SEMANTIC carry-forward (NOT a spatial cleanup): e.g. "this leaves OPTICS a lone
cluster wanting a sibling," or "the GROUNDS are drifting working-heavy." The judge scores you on
right-district / true-kin / room-vs-leaf / new-vs-existing / unique-name / meaningful-sky — the
semantic honesty of the declaration — NOT on spatial mechanics the engine guarantees.

- **Map judge** picks the best declaration (ROLE 1); **publisher** validates BOTH the room
  content AND the map, and ENROLLS the room in the manifest; the **composition critic** (ROLE 2)
  sweeps the rendered whole.

## Reveal-all-secrets (REQUIRED before any map screenshot/critique)

Run `tools/layout/reveal-all-secrets.js` (paste into `agent-browser eval`, then reload) so every
constellation + the Undercroft are lit — hidden/earned features must be composed-for, or work that
looks clean cold-open collides once secrets appear (exactly how the bottom-right tally bug hid).

## The legibility gate (the legibility conscience)

The pipeline has an automated legibility gate — `tools/layout/legibility.cjs`, proven by
`tools/layout/legibility.test.cjs` (§9.1). It models each placed POI's label box + leader from
the declarations (one shared `buildLabelModel`, seated with the engine's OWN slot geometry so it
can't drift from the render), then scores how crowded the result reads via three sub-scores —
**pairwise-gap** (label↔label and label↔non-owner-footprint clearance), **leader-crossings**
(segment crossings + footprint intrusions), and **local-density** (per-district Gaussian kernel
peak) — blended gap-dominant into one composite (`0.5·gap + 0.3·density + 0.2·leader`) against a
threshold (0.30) tuned from clean/crowded controls.

The v2 gate is HARD and per-plate: **every district plate, re-laid into RELAY_FIELD + name-only,
must score < 0.30**, and the ESTATE-plate composite (all district labels at fit view) is armed and
green. `legibility.test.cjs` GREEN (exit 0) is the regression guard. It is a modeled-label PROXY,
not rendered pixels — boxes seat at the `prefer`-seed START slot, so it measures the PRESSURE that
forces labels into competition before the annealer relieves some of it — the quantity a map
re-draw must reduce at the source. When it reads RED at the source for a whole plate, that is not
a per-room defect and not a cue to mint a district — it is the district signalling it is
STRUCTURALLY FULL, and the answer is the **capacity-relief menu** (GATHER / GROW / FOLD /
PETITION), a maker decision routed through this process. (A live-door legibility read staying RED
is an intended non-fatal WARNING under the module's exit-code policy, not a CI failure — the hard
regression guard lives in `legibility.test.cjs`, on the clean/crowded controls + the per-plate gate.)
