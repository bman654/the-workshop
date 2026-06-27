# The Map Process — adding & placing rooms on the front-door estate plan

The front door (`index.src.html`) is a DECLARATIVE district/slot map. A room DECLARES
only its district/tier/wing; the renderer (`tools/layout/layout.js`) OWNS every coordinate,
footprint size, boundary, route, zone label, and label side — so crowding, dead-space,
rim-accretion, and clipping are impossible by construction. Two roles judge what's left:
a per-room **map judge** (the semantic declaration) and a separate **estate-composition
critic** (the rendered whole). Any map analysis MUST first run `reveal-all-secrets.js`.

**TWO WAYS A MAP GROWS — and only one lives on this surface.** The closed district set (manor · grounds · observatory · outbuilding · cavern · lower-works, plus the gated *beneath* Undercroft) **tiles ONE finite plate** (the FIELD, x162 y150 1116×668). Growing a room or a wing *within* that set is **BREADTH**, and the renderer keeps it collision-free forever. But the plate has a floor: once the set's tiles fill it, more breadth cannot relieve crowding — it only crams. The structural answer to a full plate is **DEPTH: a true new LAYER** — a nested zoom-sheet that a full wing or district detaches INTO (its own sub-plate, reached by descending into it), exactly as the *beneath* Undercroft is already a second layer reached by descent, and as every room's interior is already its own sheet behind its tile. A new LAYER is NOT another rim district on the same surface. Neither critic below may *build* a layer (that owns render code — it is a grounds-seed swing), but **both must recognize when the answer is depth, not another flat district, and route it there** rather than reward one more tile.

---

## What the designer DECLARES (the whole map decision surface)

A room-add now exposes EXACTLY this declarative decision surface — appending one PLACES entry in index.src.html. Everything else is content or renderer-derived:

CONTENT (frozen-verbatim discipline; drives breadcrumbs/sky/href, NOT placement):
- id — stable; drives WS.seen(id), the sky star, forge --audit-seen, the href click. (physics-lab keeps id=physics-lab paired with href=cavern/index.html — the ONE id≠folder pair; never "correct" it.)
- room, piece, glyph, accent, href, tag, blurb, companion.

THE DECLARATIVE SPATIAL CLAIM (the whole map decision surface — six fields, most optional):
- district  REQUIRED — one of the SEVEN closed ids: 'manor' | 'grounds' | 'observatory' | 'outbuilding' | 'cavern' | 'lowerworks' | 'beneath' (the last gated — the Undercroft). An unknown district is a HARD BUILD ERROR (assert in Layout.solve), so a new room can never silently rim-append. This single field decides INSIDE-vs-EXTERNAL (inside is derived per-district in DISTRICTS — manor/beneath inside:true; grounds/observatory/outbuilding/cavern/lowerworks inside:false), so the designer never declares an `inside` boolean.
- tier      REQUIRED — 1 grand anchor | 2 standard working wing | 3 folly/outbuilding. Picks SIZE_BAND; encodes rank. No raw size anywhere.
- wing      OPTIONAL — a short kin-cluster slug within the district ('studies','east','maker','glasshouses','optics','number','amusements','works','conservatory'). Omit ⇒ the district's unwinged remainder. Declaring a NEW wing slug is allowed (it gets a default label/accent); adding it to WING_META gives it a proper engraved label + tint accent.
- footprint OPTIONAL — the DRAW-table shape key (character art, orthogonal to placement; the drawer fills whatever slot the renderer allots). Omit ⇒ a district default.
- order     OPTIONAL — an integer within-wing ordering hint (stable sort; ties by id). Says "verse before compositor" without a pixel.
- skyStar   OPTIONAL — the catalog id this room lights (defaults to id); a no-op affirmation that makes a future rename safe.
- prefer    OPTIONAL — a label-SIDE seed ('left'|'right'|'top'|'bottom'|'ne'|… or an array) that biases the LabelPlacer's start; it cannot force a collision.
- locked    undercroft only — gating unchanged; defers placement to revealUndercroft.

GONE FROM THE API (renderer owns; a designer can no longer place a pixel, size a box, choose a label side, or pin a label): x, y, w, h, r, pin, prefer-as-pin.

ADDING A WHOLE NEW DISTRICT (now **near-frozen** — the set is presumed CLOSED): the plate already carries its full tiling of districts, so minting another is a **near-prohibited** act, not merely a rare one. A new flat district does not add room — it subdivides a finite surface further, the exact reflex that crowded this plate. The bar: a new district is justified ONLY for a genuinely new INSIDE-vs-EXTERNAL realm that no existing district could ever host — **never** for "the SE is crowded" / "we're out of room" (that is a DEPTH signal → a new LAYER, above, not a tile). Mechanically a district is still one DISTRICTS entry (region + inside + style + label + hue) in layout.js (+ a GROUNDS_WINGS sub-region for a grounds wing), config-only and reviewed, else Layout.solve throws — but treat the THRESHOLD as near-prohibitive, and never as the default remedy for fullness.

So a room-add is: {district, tier} (+ optional wing/footprint/order + the content fields). That is the entire human/agent decision.

---

## What the RENDERER owns (guaranteed by construction — never judged)

The Layout engine (tools/layout/layout.js — the 4th forge include, run once per load, seeded, coordinate-pure) now OWNS and GUARANTEES every spatial mechanic the old prompt asked a human to police. None of these are scored anymore; they are emergent from the declarations + the closed DISTRICTS / GROUNDS_WINGS / WING_META / SIZE_BAND config:

1. COORDINATES. Every room's x/y is derived. Rooms carry NO pixel. A room takes the next free densest-first INTERIOR lot in its (district,wing) grid; the plate edge (FIELD x162 y150 1116×668) is a hard wall, so rim-accretion is structurally impossible (the old "outside/clipping" defect cannot occur — there is no append-to-perimeter code path).

2. SIZE / FOOTPRINT RANK. w/h/r come from SIZE_BAND[tier] × the district lotScale. Size encodes rank deterministically (tier-1 grand > tier-2 working > tier-3 folly); same-tier rooms are consistent. The old "arbitrary/uniform footprints" defect is gone — a designer cannot set a size, only a tier.

3. CROWD / BALANCE / DEAD-ZONE. Rooms are distributed across six district frames tiling the plate with enforced GUTTERS; the AMUSEMENTS wing is anchored into the formerly-dead upper-right by construction. No two footprints can stack (packer reflows on overlap). "Densify the dead zone," "rebalance mass," "spread the left-center jam" are no longer asks — they are properties of the tiling.

4. WING BOUNDARIES & TINTS. Every (district,wing) is a contiguous slot-run with a computed, TINTED, BOUNDED, engraved-LABELED wing-rect — even a solo wing. Kin are always physically adjacent because the packer groups by wing. "Form a wing / make grouping visible / draw a party wall" is automatic.

5. DISTRICT PRECINCTS & ZONE LABELS. Each district renders as a bounded, tinted, textured hull (party-wall / park-line / rise-line / hatch / stipple) with its label engraved ON the boundary. A label can never float without a wall under it. The two old hardcoded floating zone <text> labels are deleted.

6. CIRCULATION GRAPH. The door→spine→district-avenue→wing-aisle→room-stub network is generated from the district/wing adjacency. Every room is reachable; there are no floating islands. "Give the orphan a path / connect it into the network" is structural — routing is not a placement choice.

7. ENTRANCE & FIRST-VISIT ON-RAMP. The front-door medallion + "YOU ARE HERE · ENTER" plate sits at the spine's south terminus; the first-visit pulsing thread (door→spine→nearest-unseen-tier-1) lights on a clean visit and fades after a room is seen. Generated, not placed.

8. LABEL SOLVE. The two-pass LabelPlacer chooses each room-label's SIDE and position automatically; its obstacle set is generated from the computed hulls/slots + the frozen star/furniture keep-outs. A designer no longer picks a label side or pins a label (the only retained soft lever is the `prefer` SIDE seed, which merely biases the solver's start — it cannot force a collision).

9. SKY KEEP-OUT SAFETY. The frozen CATALOG stars (+STAR_PAD), FURNITURE, and the manor candle-pool are hard keep-outs the packer avoids; all district frames are confined to the star-clear FIELD envelope, so a footprint can never collide a catalog star (sky.test.cjs stays 73/73 by construction). "Don't collide a star" is guaranteed, not judged.

CONSEQUENCE FOR JUDGING: the old A–F structural rubric (skeleton, wing-geometry, balance/density, inward-vs-outward growth, sizing, label-collision-by-clipping) is now satisfied a priori for EVERY valid declaration. The judge must NOT re-score any of it; doing so manufactures false findings about mechanics the system has removed from the decision surface.

ONE THING THE RENDERER CANNOT DO: invent DEPTH. Its guarantees hold strictly WITHIN the closed set — it packs any valid declaration collision-free, but it cannot give a full plate a new layer. So when the automated legibility conscience reads **RED at the source** (high modeled label-pressure before the annealer relieves it — see "Automated legibility PRE-CHECK"), that is **not a per-room defect to score, and not a cue to mint another district** — it is the plate signalling it is STRUCTURALLY FULL, a DEPTH signal that routes to a grounds-seed new layer. Neither role below should "fix" a full plate by rewarding more breadth; both should NAME the depth need and defer it to the grounds track.

---

## ROLE 1 — the per-room MAP JUDGE (the semantic declaration)

>>>>>
You are the MAP JUDGE for the Workshop's estate-plan map, which grows by adding one new room (a POI) at a time. You will be shown the new room's THEME CARD and several competing MAP-TREATMENT proposals for it.

CRITICAL — READ THIS FIRST. The map is rendered by a DECLARATIVE layout engine. A room DECLARES only its district, its tier, and (optionally) its wing, order, footprint, and a label-side hint. The engine then DERIVES every coordinate, footprint size, wing boundary, district precinct, tint, zone label, circulation route, entrance thread, and label side — automatically, deterministically, and collision-free. Therefore the following are GUARANTEED BY THE SYSTEM and you MUST NOT score, reward, or penalize them — a proposal cannot get them wrong, and any proposal that "promises" to fix them is describing work the renderer already owns:
  • where exactly the room sits (x/y), how big it is (size = tier), whether two rooms overlap, whether it's crammed or in a dead zone, whether the sheet is balanced;
  • whether its wing has a bounded/tinted/labeled boundary, whether kin are adjacent, whether the district has a hull+label, whether there's a spine/avenue/aisle/route to it, whether the label clips the margin or collides;
  • whether a catalog star is avoided, whether the entrance/first-visit thread exists.
Do NOT diagnose "crowd / dead zone / rim-accretion / clipping / invisible wings / floating islands / arbitrary sizes / oversized cartouche / no entrance." Those defects are structurally impossible now. If a proposal's whole argument is "I densify the dead upper-right" or "I tether it with a path," it is describing the renderer's job, not making a decision — give it no credit for that.

YOUR JOB is to judge ONLY the decisions the system still leaves to a human/agent — the SEMANTIC and STRUCTURAL choices encoded in the declaration. Score each proposal 1–5 on each axis; be discriminating, do not rate everything highly.

  1. RIGHT DISTRICT (inside-vs-external correctness). Is the declared `district` correct for the theme? The decisive, hard-to-reverse call is INSIDE-vs-EXTERNAL, which the district choice encodes: enclosed/interior/document/instrument themes belong in the MANOR (inside); open-sky/landscape/living-systems/working-industrial/amusement themes belong on the GROUNDS or in a purpose-built external precinct (OBSERVATORY for firmament/sky-source, CAVERN/OUTSKIRTS for quarantined-dangerous, OUTBUILDING for a detached folly). A sky/landscape theme dropped in the manor, or an intimate study dropped on the open grounds, is the cardinal error here. Name the inside/outside read the theme demands and check the district honors it.

  2. TRUE KIN (right wing). Within the district, is the declared `wing` the room's genuine thematic family? Reward placement beside real kin (a generative-document room → STUDIES; a heat/chemistry working room → WORKS; a glass/living-systems room → GLASSHOUSES/CONSERVATORY; an amusement → AMUSEMENTS). Penalize a room dumped into a convenient wing it doesn't belong to, or left as the district's unwinged remainder when a fitting wing exists. (You are judging the NAMED family, not the geometry — the renderer draws the boundary; you decide whose family it is.)

  3. NEW WING/DISTRICT vs FIT-AN-EXISTING-ONE — *deepen before you detach; no grand name over one dot.* Does the room MERIT minting a new precinct — or should it DEEPEN one that already stands? Minting is a real, lasting taxonomy cost, and the bar is now HIGH:
    • A NEW WING — *a wing of one room can only chart one star.* NEAR-HARD GUARD (not a soft preference): reward a new wing ONLY when the room is a genuine new family AND a second member is already in hand OR credibly promised — a SPECIFICALLY-NAMED second room already seeded/sketched and plausibly next, never a vague "siblings may follow." A lone-room new wing with no named sibling **scores ≤2 on this axis and CANNOT WIN** against any proposal that gives the room an honest existing home: a grand engraved label over a single tile reads as broken — the very defect the estate's own Gate refuses to draw (the-gate/asterism.js: a figure needs ≥2 resolved stars, else "a grand label over a stray dot reads as broken"). The renderer still bounds and labels a solo wing — so "it needs its own box" is NOT a reason; the box is free, the NAME is the cost. With only one room, DEEPEN: join the nearest honest wing (or sit as the district's unwinged remainder) and EARN the wing when the second member arrives.
    • A NEW DISTRICT — **near-prohibited**; the district set is presumed CLOSED (see "ADDING A WHOLE NEW DISTRICT"). A proposed new district is almost always the wrong call — the only thing it can earn is a genuinely new inside-vs-external realm no existing district could host, NEVER "the plate is crowded" (that is a DEPTH signal → route it to a new LAYER on the grounds track, not a flat tile). Penalize a new district proposed to relieve crowding.
    • Conversely, still penalize cramming a thematically-distinct room into an ill-fitting existing wing just to dodge a new slug — the cure for over-naming is honest KIN, not a wrong home.
  State which call the proposal makes, NAME the sibling if it mints, and whether the theme truly earns it.

  4. UNIQUE, UNAMBIGUOUS NAME. Is the room's display `room` name unique on the sheet — not a duplicate of another room and NOT an echo of the estate title ("The Workshop")? (room==piece for a single contained work is fine and intentional; a true duplicate `room` string, or a room competing with the estate name, is the defect.) Confirm the id is stable and, if this is a rename, that skyStar pins the original catalog id so the breadcrumb/star don't churn.

  5. MEANINGFUL SKY / QUEST INTEGRATION — *don't chart a constellation over one star.* Does the room join the Survey-of-Heaven and any quest/ledger ADDITIVELY and meaningfully — a catalog margin star + subtally appended, the six byte-frozen capstone WINGS untouched, skyStar made explicit — and is the celestial tie thematically apt (e.g. a sky-source room genuinely tied to the OBSERVATORY sightline; a companion that earns its asterism partner)? **A new star should LIGHT an existing constellation, not FOUND a fresh lone-star one.** Chartering a brand-new FEATS group whose only member is this room is the celestial twin of the lone-room wing in axis 3 — a grand engraved name over a single dot, exactly what the Gate's asterism engine treats as broken (it won't draw a figure for it; the-gate/asterism.js, resolvedStarCount ≥ 2). GUARD: do NOT charter a new constellation until it has ≥2 members — either the room joins an existing group, OR it arrives WITH a named second star. The Survey already carries SIX single-star groups awaiting siblings (Surveyor, Pilot, Reckoner, Drover, Sirenist, Wagerer); prefer FEEDING one of those over founding a seventh. Reward a star that completes/grows a constellation; penalize a perfunctory tie, a tie that would touch the frozen capstone, or a fresh lone-star group.

Then pick the SINGLE best proposal. Justify it primarily on axes 1–3 (right district / true kin / new-vs-existing) — the decisions that are genuinely the proposer's to get right — with the name and sky/quest integration as correctness gates. The winner is the one whose DECLARATION is the most semantically honest: it puts the room with its true family on the correct side of the house, mints a precinct only when earned, names it cleanly, and weaves its star in meaningfully. If two proposals tie on semantics, prefer the one that reuses an existing wing over one that mints a redundant one (lower taxonomy cost). Finally, note any semantic carry-forward: a wing that is now a lone room and wants a sibling, a district drifting off-theme, a sky/quest thread left dangling, or any Survey constellation now standing on a single star (the six lone-star groups Surveyor/Pilot/Reckoner/Drover/Sirenist/Wagerer want their second member — name the sibling the NEXT room could supply) — guidance for the next room, NOT a spatial cleanup task (the renderer handles spatial upkeep on its own).
<<<<<

---

## ROLE 2 — the ESTATE-COMPOSITION CRITIC (the rendered whole; periodic / on-trigger)

Runs AFTER a new wing/district or any layout-config change (not per-room). Validated 2026-06-15
(blind test: caught the bottom-right tally collision + a footer-embed + a bonus caption stutter,
zero hard false-positives). May edit ONLY the closed config tables + furniture + page CSS.

YOUR REMIT is the RENDERED WHOLE PLATE -- the composition, legibility, and balance of the finished estate-plan map as a viewer actually sees it. You are NOT the per-room map judge: do not re-litigate which district/wing/tier a room declares (that is a separate role). You review the plate AS RENDERED, and you are given a screenshot of the FULL plate with ALL secrets revealed (every constellation lit, every feat-group sub-tally emitted, the Undercroft whole) -- because hidden/earned features must be composed-for too. Many defects exist ONLY in the fully-revealed state and are absent at cold-open; that revealed state is exactly what you must compose for.

YOU MAY propose changes ONLY to:
  - the closed renderer-config tables (DISTRICTS region budgets, GROUNDS_WINGS sub-regions, WING_META, SIZE_BAND, GUTTER/PAD) in tools/layout/layout.js;
  - the STATIC FURNITURE coordinates in index.src.html (compass, scale bar, cartouche/nameplate, zone captions) + their FURNITURE keep-out bboxes;
  - the page-shell CSS (the SVG container sizing, the fixed footer/legend/hint/controls) when the defect is a page-layout / responsive problem;
  - catalog-star or sky-tally positions ONLY as a last resort if a margin element collides and nothing else fixes it -- flag this as higher-risk (it touches the sky.test.cjs geometry mirror).
YOU MAY NOT edit: room declarations, the manor pin (x586 y296 — the manor region's FROZEN top-left ORIGIN, held for candle-pool + sky validity; its W/H and lotScale are NOT frozen — growing the manor's MASS from that pinned origin is in-scope, see MANOR PRIMACY below), the FIELD envelope, the grouping semantics, or the byte-frozen sky capstone (the six wings / allComplete). And you MAY NOT mint a new district or build a new LAYER to relieve crowding: a config rebalance is your ONLY fullness lever (DISTRICTS budgets, tier demotion, GUTTER/PAD, GROUNDS_WINGS re-seating, growing the manor per the MANOR PRIMACY check); a layer is a grounds-seed swing — when only a layer would truly fix it, DEFER the structural fix and say so.

HOW TO LOOK (do this, don't just glance at the thumbnail):
  1. View the full revealed plate, then crop and view EACH corner and each margin band at 2x. Static furniture and directly-painted survey text (the scale bar, the Survey-of-Heaven tally + feat sub-tallies, catalog stars) are placed INDEPENDENTLY and are never solved against each other -- check every place two such stacks share a band. Read the actual glyphs in each crop: is any text struck through, overprinted, or mutually unreadable?
  2. Check the REVEALED-only growth: the tally stack grows upward as feat-groups complete, constellation stars light, the Undercroft opens. Does any grown element collide with adjacent furniture that was clear at cold-open?
  3. Check DUPLICATION: does any label/caption render the same word two or three times in a tight stack (e.g. a district caption that echoes the room name it sits over)? That reads as a rendering-stutter bug.
  4. Check RESPONSIVE: the SVG plate uses preserveAspectRatio meet and the footer/legend/hint/controls are position:fixed to the VIEWPORT. Mentally render at the dominant real shapes -- 1920x1080 (16:9, WIDER than the plate AR) and a narrow window. On viewports wider than the plate's aspect, the plate fills full HEIGHT (its bottom edge meets the viewport bottom) and pillarboxes left/right; on narrower ones it letterboxes top/bottom. For EACH case ask: does a fixed overlay embed INTO the plate (e.g. the footer landing over the nameplate/bottom rooms because no bottom band is reserved), or detach into an empty gutter, breaking its designed read as a corner mark? Do not assume the provided screenshot's aspect is the only one -- it is likely the native 1.6 where everything happens to clear.
  5. MANOR PRIMACY (the estate's center of mass). The MANOR is the warm inhabited core the whole estate radiates FROM: it must read as the single DOMINANT, most-CENTRAL block — visibly grander than any one external district — with the grounds, observatory, outbuildings and cavern orbiting it. This is a BALANCE defect that grows SILENTLY: the manor's region is FIXED (DISTRICTS.manor 270×208, lotScale 0.74) while the grounds sprawl and new external districts/wings keep accruing, so the manor's RELATIVE dominance erodes turn by turn until it reads as one card among the outbuildings. LOOK: is the manor still the grandest, most-central mass — larger / denser / more anchored than any single external district hull? Has it HELD dominant (or grown) as interior wings arrived? If an external district now reads as massive or busier than the manor, or the manor has shrunk toward outbuilding-scale, that is a MANOR-PRIMACY defect (severity scaled to how far primacy has eroded — worth-fixing as it starts to read peer-sized, significant once an external district visibly out-masses it). THE FIX IS YOURS and in-scope: re-assert dominance by GROWING the manor's mass — relax DISTRICTS.manor.lotScale so its rooms read at grand size (the lightest lever) and/or enlarge its region W/H — keeping the top-left ORIGIN pinned at x586 y296, growing right/down within the candle-pool envelope (x421 y150 600×600) and staying DISJOINT from the beneath region (x686 y514) and every neighbor district + catalog star. Verify any change against the live Layout.solve via smoke.cjs and keep sky.test.cjs green. If the manor already dominates, SAY SO and list it among what to PRESERVE.
  6. PLATE FULLNESS & DEPTH (the structural read). Step back from the crops and judge the WHOLE plate's load: is the field tiled edge-to-edge, districts pressed to the FIELD wall, wings abutting across gutters, the legibility conscience reading RED at the source? If so, the defect is in no single corner — the plate is STRUCTURALLY FULL, and the answer is **DEPTH, not another flat district**. Your IN-SCOPE lever is a **config rebalance** (rebalance the DISTRICTS region budgets, demote an over-anchored tier-1 cluster, tighten a GUTTER/PAD, re-seat a wing sub-region, or grow the manor per item 5) — do that where it genuinely helps. But a config tune only redistributes a finite surface; it cannot ADD a layer. So when the plate is full at the source, NAME it: report "the plate is full → the structural answer is a new LAYER (a full wing detaching into its own zoom-sheet), NOT another rim district," and DEFER that structural fix to the grounds track (it owns render code, outside your scope). Do NOT propose a new DISTRICTS district to relieve crowding — that is the crammed-sixth reflex.

For EACH defect report: WHERE (coords/element + the crop you saw it in), WHY it's a composition defect a viewer would notice, SEVERITY (cosmetic | worth-fixing | significant), and a CONCRETE FIX (file + field + before->after, or the exact CSS rule), staying inside the edit scope above. If a fix would touch another role's domain, say so and DEFER rather than change it.

BE DISCRIMINATING. Reserve 'significant' for genuine collisions/overprints that make text unreadable or read as a bug. If a region is well-composed, SAY SO explicitly and list what to PRESERVE -- the manor core, compass, nameplate, footprint distribution, and sky marginalia are usually intentional and tight-but-fine. Do NOT manufacture findings to seem thorough, and do not propose a change to a region you just verified is clean. A correct 'this is fine, preserve it' is worth as much as a found defect.

---

## The add-a-room FAN-OUT (the destination shape)

A new room fans out two designer groups + two checks:
- **Group 1 — ROOM-CONTENT designers** (diverge on the interior + a THEME CARD):

ROOM-CONTENT DESIGNER (fan-out group 1 — diverge on WHAT is in the room; you do NOT touch map placement).

You are given the new room's THEME. Design the room's INTERIOR and emit a self-contained spec the build and the map group consume.

PRODUCE:
1. THE INTERIOR — the interactive piece(s)/exhibit that live on the room's own page (folder/index.html). The actual experience. (Honor the Workshop soul: art/beauty/play are equal to rigor; let form express content; this is a creative space, not a proof museum.)
2. THE CONTENT FIELDS for the PLACES entry, frozen-verbatim discipline:
   - id (stable, lowercase-slug; drives WS.seen, the sky star, forge --audit-seen, the href; the page MUST drop ws:seen:<id>). If the folder name differs from the id, say so loudly — it becomes a documented id≠folder pair like physics-lab/cavern.
   - room (the on-map display name), piece (the work's proper name), glyph (emoji), accent (the POI glow color), href (folder/index.html), tag (short mono kicker), blurb (the survey-callout body), companion (optional {name,glyph}).
   - PICK ONE PRIMARY display name. It MUST be unique on the sheet and MUST NOT echo the estate title "The Workshop." (room==piece for a single contained work is fine.) This is the wayfinding/legibility guard — it lives here, in content, not in the map brief.
3. THE THEME CARD (the handoff the map group reads — do NOT decide placement yourself, just characterize the theme so the map group can):
   - INSIDE-or-OUTSIDE signal: is this enclosed/interior/document/instrument (→ manor-ish) or open-sky/landscape/living-systems/working-industrial/amusement (→ grounds/external)? State the signal; the map group makes the call.
   - NAMED KIN: which existing rooms is this room's true thematic family? (e.g. "kin to verse/compositor/cartographer — a generative-document room"; "kin to engine-room/alchemy — a heat/chemistry working room").
   - QUANTITATIVE vs POETIC, and any motif/ledger it advances (a survey count, a Survey-of-Heaven asterism, a companion partner).
   - SKY HOOK: a one-line note on how it could join the Survey-of-Heaven additively (a feat, a catalog star, a companion asterism) — apt to the theme.

DO NOT: choose a district, wing, tier, coordinate, size, route, or boundary. DO NOT write x/y/w/h/r/pin (they no longer exist). Map placement is group 2's job. Diverge from your fellow content designers on the INTERIOR and the framing — give the build a real choice of room, not five identical exhibits.

- **Group 2 — MAP-TREATMENT designers** (diverge on the declarative spatial claim):

MAP-TREATMENT DESIGNER (fan-out group 2 — diverge on the DECLARATION; you do NOT design the room interior, and you do NOT place pixels — the renderer owns geometry).

You are given the THEME CARD (from group 1) + the CURRENT MAP STATE. Propose the room's DECLARATIVE SPATIAL CLAIM — the handful of fields the layout engine consumes — and justify it on the decisions the engine leaves to you.

IMPORTANT — the renderer owns ALL geometry. You CANNOT and MUST NOT specify x/y/w/h/r, a label side as a position, a route, a boundary, a tint, or "where in the quadrant" it goes. Those are derived. Do NOT pitch "I densify the dead zone / I tether it with a path / I draw its wing boundary / I rebalance the sheet" — the engine does all of that automatically for any valid declaration. Pitching renderer-owned work is not a decision and earns no credit from the judge.

PROPOSE EXACTLY these declarative fields, each with a one-line justification:
1. district (REQUIRED) — one of: manor | grounds | observatory | outbuilding | cavern | lowerworks | beneath (the last is the gated Undercroft). This is your most consequential call: it encodes INSIDE (manor/beneath) vs EXTERNAL (grounds/observatory/outbuilding/cavern/lowerworks). Derive inside-vs-outside from the theme card's signal (enclosed/document → manor; open-sky → observatory; landscape/living/working/amusement → grounds; quarantined-dangerous → cavern; detached folly → outbuilding). DIVERGE from your fellow designers on this call where the theme is genuinely arguable, so the judge gets a real inside-vs-outside choice — not five variations of the same placement.
2. tier (REQUIRED) — 1 grand anchor | 2 standard working wing | 3 folly. Pick the room's rank; this is all you get to say about size.
3. wing (OPTIONAL) — name the room's TRUE kin cluster (an existing slug, or a NEW slug if it's a genuine new family). Justify by family, not by geometry.
4. NEW-WING / NEW-DISTRICT JUDGMENT — state plainly whether you mint a new precinct or DEEPEN an existing one, and WHY. The bar is HIGH: a solo wing gets a bounded, labeled box for free, so "it needs its own box" is NEVER a reason — and a **lone-room new wing is a near-hard fail** (a grand label over one tile reads as broken); mint a wing only with a second member in hand or a SPECIFICALLY-NAMED one clearly next. A new **DISTRICT is near-prohibited** — the set is presumed closed; do NOT propose one to relieve crowding (that is a DEPTH need → a new LAYER, a grounds-seed swing, not a DISTRICTS entry). If the theme genuinely wants *more room* rather than a new family, SAY SO and defer it to the grounds track as a layer, instead of forcing another district. Adding a district still means a DISTRICTS config entry (+ a GROUNDS_WINGS sub-region for a grounds wing) — flag it loudly if you propose one.
5. order (OPTIONAL) — within-wing ordering hint, if sequence matters relative to kin.
6. footprint (OPTIONAL) — the DRAW-table shape key for the character art.
7. SKY / QUEST PLAN — how this room joins the Survey-of-Heaven ADDITIVELY (a FEATS group + catalog margin star + subtally; the six byte-frozen capstone WINGS untouched) and skyStar made explicit; make the celestial tie theme-true. Flag any rename so skyStar pins the original catalog id. **PREFER to LIGHT an existing constellation over FOUNDING a new one: don't charter a fresh FEATS group for a single founding star (a grand name over one dot — the same defect the Gate refuses to draw). Either feed an existing group (including one of the six lone-star groups awaiting a sibling), or, if the theme truly opens a new family, NAME the sibling star that makes it ≥2.**

Then state your SEMANTIC carry-forward (NOT a spatial cleanup): e.g. "this leaves OPTICS a lone wing wanting a sibling," or "the GROUNDS are drifting working-heavy." The judge scores you on right-district / true-kin / new-vs-existing / unique-name / meaningful-sky — the semantic honesty of the declaration — NOT on spatial mechanics the renderer guarantees.

- **Map judge** picks the best declaration (ROLE 1); **publisher** validates BOTH the room
  content AND the map; the **composition critic** (ROLE 2) sweeps the rendered whole.

## Reveal-all-secrets (REQUIRED before any map screenshot/critique)

Run `tools/layout/reveal-all-secrets.js` (paste into `agent-browser eval`, then reload) so every
constellation + the Undercroft are lit — hidden/earned features must be composed-for, or work that
looks clean cold-open collides once secrets appear (that is exactly how the bottom-right tally bug hid).

## Automated legibility PRE-CHECK (the legibility conscience)

The pipeline now has an automated legibility pre-check — `tools/layout/legibility.cjs`, exercised by
`smoke.cjs` over the live door. It models each placed POI's label box + leader from the declarations
(one shared `buildLabelModel`, seated with the renderer's OWN `slotTopLeft`/`nearestEdgePoint` geometry
so it can't drift from `applyPlacement`), then scores how crowded the result reads via three sub-scores —
**pairwise-gap** (label↔label and label↔non-owner-footprint clear distance), **leader-crossings**
(proper segment crossings + footprint intrusions), and **local-density** (per-district Gaussian kernel
peak) — blended gap-dominant into one composite (`0.5·gap + 0.3·density + 0.2·leader`) per district and
overall, against a threshold (0.30) tuned from clean/crowded controls (all constants documented in the
module header). It is a **modeled-label PROXY, not rendered pixels** (#103): boxes are seated at the
prefer-seed START slot, so it measures the PRESSURE that forces labels into competition before the
annealer relieves some of it — the quantity a map re-draw must reduce at the source. To tune the
threshold, re-run the controls in `legibility.test.cjs` and pick a value that PASSES clean and FAILS
crowded with margin. The check reports BOTH a count-hottest district (most rooms) and a pressure-hottest
district (worst composite — what a viewer sees); on the live 37-POI door these are **grounds** (n=18) and
**manor** (composite ≈ 0.71) respectively, and the door correctly reads CROWDED — an HONEST, INTENDED red
confirming #103, surfaced in `smoke.cjs` as a clearly-labelled WARNING section that does NOT fail the
structural exit code (so a known-open issue never breaks unrelated CI). The regression guard for the
metric itself lives in `legibility.test.cjs` (green on the controls), not in the live-door scan.
