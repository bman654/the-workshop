# The Map Process — adding & placing rooms on the front-door estate plan

The front door (`index.src.html`) is a DECLARATIVE district/slot map. A room DECLARES
only its district/tier/wing; the renderer (`tools/layout/layout.js`) OWNS every coordinate,
footprint size, boundary, route, zone label, and label side — so crowding, dead-space,
rim-accretion, and clipping are impossible by construction. Two roles judge what's left:
a per-room **map judge** (the semantic declaration) and a separate **estate-composition
critic** (the rendered whole). Any map analysis MUST first run `reveal-all-secrets.js`.

---

## What the designer DECLARES (the whole map decision surface)

A room-add now exposes EXACTLY this declarative decision surface — appending one PLACES entry in index.src.html. Everything else is content or renderer-derived:

CONTENT (frozen-verbatim discipline; drives breadcrumbs/sky/href, NOT placement):
- id — stable; drives WS.seen(id), the sky star, forge --audit-seen, the href click. (physics-lab keeps id=physics-lab paired with href=cavern/index.html — the ONE id≠folder pair; never "correct" it.)
- room, piece, glyph, accent, href, tag, blurb, companion.

THE DECLARATIVE SPATIAL CLAIM (the whole map decision surface — six fields, most optional):
- district  REQUIRED — one of the SIX closed ids: 'manor' | 'grounds' | 'observatory' | 'outbuilding' | 'cavern' | 'beneath'. An unknown district is a HARD BUILD ERROR (assert in Layout.solve), so a new room can never silently rim-append. This single field decides INSIDE-vs-EXTERNAL (inside is derived per-district in DISTRICTS — manor/beneath inside:true; grounds/observatory/outbuilding/cavern inside:false), so the designer never declares an `inside` boolean.
- tier      REQUIRED — 1 grand anchor | 2 standard working wing | 3 folly/outbuilding. Picks SIZE_BAND; encodes rank. No raw size anywhere.
- wing      OPTIONAL — a short kin-cluster slug within the district ('studies','east','maker','glasshouses','optics','number','amusements','works','conservatory'). Omit ⇒ the district's unwinged remainder. Declaring a NEW wing slug is allowed (it gets a default label/accent); adding it to WING_META gives it a proper engraved label + tint accent.
- footprint OPTIONAL — the DRAW-table shape key (character art, orthogonal to placement; the drawer fills whatever slot the renderer allots). Omit ⇒ a district default.
- order     OPTIONAL — an integer within-wing ordering hint (stable sort; ties by id). Says "verse before compositor" without a pixel.
- skyStar   OPTIONAL — the catalog id this room lights (defaults to id); a no-op affirmation that makes a future rename safe.
- prefer    OPTIONAL — a label-SIDE seed ('left'|'right'|'top'|'bottom'|'ne'|… or an array) that biases the LabelPlacer's start; it cannot force a collision.
- locked    undercroft only — gating unchanged; defers placement to revealUndercroft.

GONE FROM THE API (renderer owns; a designer can no longer place a pixel, size a box, choose a label side, or pin a label): x, y, w, h, r, pin, prefer-as-pin.

ADDING A WHOLE NEW DISTRICT (rare, a deliberate act): add a DISTRICTS entry (region budget + inside + style + label + hue) in layout.js, else Layout.solve throws. A new GROUNDS wing also wants a GROUNDS_WINGS sub-region. This is the ONLY way to mint a new precinct — it is config, reviewed, never an accident.

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

  3. NEW WING/DISTRICT vs FIT-AN-EXISTING-ONE. Does the room MERIT minting a new wing (or, rarely, a new district) — or should it join one that exists? Minting a precinct is a real taxonomy cost: reward a new wing only when the room is a genuine new family with no honest home (and ideally a sibling soon to follow); penalize a lone-room new wing that an existing wing would have received cleanly (a solo wing the system will still bound and label — so "it needs its own box" is NOT a reason; the box is free). Conversely, penalize cramming a thematically-distinct room into an ill-fitting existing wing just to avoid a new slug. State which call the proposal makes and whether the theme earns it.

  4. UNIQUE, UNAMBIGUOUS NAME. Is the room's display `room` name unique on the sheet — not a duplicate of another room and NOT an echo of the estate title ("The Workshop")? (room==piece for a single contained work is fine and intentional; a true duplicate `room` string, or a room competing with the estate name, is the defect.) Confirm the id is stable and, if this is a rename, that skyStar pins the original catalog id so the breadcrumb/star don't churn.

  5. MEANINGFUL SKY / QUEST INTEGRATION. Does the room join the Survey-of-Heaven and any quest/ledger ADDITIVELY and meaningfully — a FEATS group + catalog margin star + subtally appended, the six byte-frozen capstone WINGS untouched, skyStar made explicit — and is the celestial tie thematically apt (e.g. a sky-source room genuinely tied to the OBSERVATORY sightline; a companion that earns its asterism partner)? Reward a real, theme-true integration; penalize a sky tie that is perfunctory or that would touch the frozen capstone.

Then pick the SINGLE best proposal. Justify it primarily on axes 1–3 (right district / true kin / new-vs-existing) — the decisions that are genuinely the proposer's to get right — with the name and sky/quest integration as correctness gates. The winner is the one whose DECLARATION is the most semantically honest: it puts the room with its true family on the correct side of the house, mints a precinct only when earned, names it cleanly, and weaves its star in meaningfully. If two proposals tie on semantics, prefer the one that reuses an existing wing over one that mints a redundant one (lower taxonomy cost). Finally, note any semantic carry-forward: a wing that is now a lone room and wants a sibling, a district drifting off-theme, or a sky/quest thread left dangling — guidance for the next room, NOT a spatial cleanup task (the renderer handles spatial upkeep on its own).
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
YOU MAY NOT edit: room declarations, the manor pin (x586 y296), the FIELD envelope, the grouping semantics, or the byte-frozen sky capstone (the six wings / allComplete).

HOW TO LOOK (do this, don't just glance at the thumbnail):
  1. View the full revealed plate, then crop and view EACH corner and each margin band at 2x. Static furniture and directly-painted survey text (the scale bar, the Survey-of-Heaven tally + feat sub-tallies, catalog stars) are placed INDEPENDENTLY and are never solved against each other -- check every place two such stacks share a band. Read the actual glyphs in each crop: is any text struck through, overprinted, or mutually unreadable?
  2. Check the REVEALED-only growth: the tally stack grows upward as feat-groups complete, constellation stars light, the Undercroft opens. Does any grown element collide with adjacent furniture that was clear at cold-open?
  3. Check DUPLICATION: does any label/caption render the same word two or three times in a tight stack (e.g. a district caption that echoes the room name it sits over)? That reads as a rendering-stutter bug.
  4. Check RESPONSIVE: the SVG plate uses preserveAspectRatio meet and the footer/legend/hint/controls are position:fixed to the VIEWPORT. Mentally render at the dominant real shapes -- 1920x1080 (16:9, WIDER than the plate AR) and a narrow window. On viewports wider than the plate's aspect, the plate fills full HEIGHT (its bottom edge meets the viewport bottom) and pillarboxes left/right; on narrower ones it letterboxes top/bottom. For EACH case ask: does a fixed overlay embed INTO the plate (e.g. the footer landing over the nameplate/bottom rooms because no bottom band is reserved), or detach into an empty gutter, breaking its designed read as a corner mark? Do not assume the provided screenshot's aspect is the only one -- it is likely the native 1.6 where everything happens to clear.

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
1. district (REQUIRED) — one of: manor | grounds | observatory | outbuilding | cavern | beneath. This is your most consequential call: it encodes INSIDE (manor/beneath) vs EXTERNAL (grounds/observatory/outbuilding/cavern). Derive inside-vs-outside from the theme card's signal (enclosed/document → manor; open-sky → observatory; landscape/living/working/amusement → grounds; quarantined-dangerous → cavern; detached folly → outbuilding). DIVERGE from your fellow designers on this call where the theme is genuinely arguable, so the judge gets a real inside-vs-outside choice — not five variations of the same placement.
2. tier (REQUIRED) — 1 grand anchor | 2 standard working wing | 3 folly. Pick the room's rank; this is all you get to say about size.
3. wing (OPTIONAL) — name the room's TRUE kin cluster (an existing slug, or a NEW slug if it's a genuine new family). Justify by family, not by geometry.
4. NEW-WING / NEW-DISTRICT JUDGMENT — explicitly state whether you are minting a new wing/district or joining an existing one, and WHY the theme earns (or doesn't earn) it. Remember a solo wing still gets a bounded, labeled box for free, so "it needs its own box" is never a reason to mint one — only a genuine new family is. Adding a new DISTRICT also requires a DISTRICTS config entry (and a GROUNDS_WINGS sub-region for a new grounds wing); flag it if you propose one.
5. order (OPTIONAL) — within-wing ordering hint, if sequence matters relative to kin.
6. footprint (OPTIONAL) — the DRAW-table shape key for the character art.
7. SKY / QUEST PLAN — how this room joins the Survey-of-Heaven ADDITIVELY (a FEATS group + catalog margin star + subtally; the six byte-frozen capstone WINGS untouched) and skyStar made explicit; make the celestial tie theme-true. Flag any rename so skyStar pins the original catalog id.

Then state your SEMANTIC carry-forward (NOT a spatial cleanup): e.g. "this leaves OPTICS a lone wing wanting a sibling," or "the GROUNDS are drifting working-heavy." The judge scores you on right-district / true-kin / new-vs-existing / unique-name / meaningful-sky — the semantic honesty of the declaration — NOT on spatial mechanics the renderer guarantees.

- **Map judge** picks the best declaration (ROLE 1); **publisher** validates BOTH the room
  content AND the map; the **composition critic** (ROLE 2) sweeps the rendered whole.

## Reveal-all-secrets (REQUIRED before any map screenshot/critique)

Run `tools/layout/reveal-all-secrets.js` (paste into `agent-browser eval`, then reload) so every
constellation + the Undercroft are lit — hidden/earned features must be composed-for, or work that
looks clean cold-open collides once secrets appear (that is exactly how the bottom-right tally bug hid).
