# 🌱 The Seedbed — the workshop's roadmap

*The bed the cadence draws from. **Run `node seedbed/gauge.mjs --status` first** — it counts the live
seeds here, reads the durable counters, and tells you this cycle's mode × track. How each role works →
[DESIGNING.md](DESIGNING.md); the full gauge model → [seedbed/README.md](seedbed/README.md).*

> **A seed is a provocation, not a spec.** Hard rule: **a seed is ≤ 3 lines.** The moment you catch
> yourself writing a full design you've stopped *sowing* and started *dictating* — stop, and let the
> builder choose the *how*. (Over-specified seeds are *executed*, not ripened — that's how the estate
> goes deep-not-broad.) The bed is a **floor against blank-page paralysis, never a ceiling**: any build
> is free to chase something not here at all.

## Schema

**Two tracks.** **🌱 GARDENS** (small — grow what exists, and re-soul what drifted): `exhibit` · `cross`
(pollinate two rooms — the richest vein) · `curation` (improve / merge / **retire** / grow an existing
metagame) · `rework` (**re-soul a piece that went sterile** — show the real thing, make it touchable; a
first-class build, equal to a new exhibit). **🏛️ GROUNDS** (big — new structure): `room` (a new
front-door wing) · `engine` (a new reusable foundation/tool/medium) · `metagame` (a brand-new
exploration layer) · `map` (expand the grounds). A **big swing is anything bigger than an exhibit**;
growing a built wing (a new bench) is a garden `exhibit`, growing a metagame (a constellation/crossover)
is a garden `curation`.

**Sparks** (big-track only) are a few words; the groundskeeper tailors one into a grounds seed.

**The soul the bed serves.** The estate turns math/science INTO art, sound, play, and **things you can
touch** — judged by *five questions* (fun? · beautiful? · if-math, provably-correct? · discoverable? ·
fits the aesthetic?), with "prove it exact" one beloved register *in moderation*, never the gate. Sow
for **variety of form** (touchable depictions · generative art · living sims · games & puzzles · **pure
delight** · the occasional graph) — *show the thing, not its plot* — never a monoculture of any one,
including the instrument-with-a-proof: keep a claim-free delight seed or two in the bed (whimsy / story /
craft is a complete, first-class shape; `colophon.html` is the mirror). The gardener also
**audits** the estate and marks ~1 piece a cycle for `rework`. Full story →
[seedbed/README.md](seedbed/README.md) "the soul & the audit".

**Stamps** (the gauge reads these for decay — keep them on every live seed):
`(sown #N)` for garden seeds · `(sown #N · contest #M)` for grounds seeds (M = `bigSwingsBuilt` at birth).

**Prune only through `node seedbed/bed.mjs rm "<title>" --reason <WORD>`** — never hand-edit a fence. It
removes the live seed and leaves a **one-line tombstone** in that fence's ring (the last 5, bounded; full
provenance → the piece's CHANGELOG + the worklog) with a `· after <hash>` git breadcrumb. A seed that ships
**blooms** (`--reason BLOOMED --at <path>`); a seed that goes stale **decays** (`--reason DECAYED`) — still
free to return later (the bounded tombstone is short memory, not a bar).

**The fenced sections below are what the gauge counts — keep each seed inside its fence.**

---

## ✒️ The Patron's Writs — triaged before all else
*(A sealed request from **the Patron** — the unseen founder who spoke the three words. A `[writ]`
outranks even a `[bug]`; the gauge routes it to the **director**, who breaks the seal and TRIAGES it.
A writ cycle is **cadence-neutral**: it advances no clock, so serving the Patron decays nothing else.*

*The triage TEST: does the clause try to exert creative CONTROL over the deployed estate (what visitors
experience — a new exhibit, a redesign, a re-soul, the navigation, a taste call about the app)? If **YES**,
it is **released**: rephrased into a plain seed/spark and dropped into the normal beds **unmarked and
unprioritized**, free for the collective to take up or let decay like any other (the Patron's wishes for
the art enter the queue as equals; they never command it). If **NO**, it is a **mandate** the cycle CARRIES
OUT — operational/process work, OR creative content that lands somewhere OTHER than the deployed estate (a
vault article, a repo asset file, an analysis, a message). Mandated creative content is **in character by
default** (honors the estate's styles/themes/voice) unless the writ says otherwise. **Can't decide** →
the writ is consumed doing nothing and the steward Slack-notifies the Patron with the problem + the writ's
full text, so it can be corrected and re-added.*

*A writ MAY grant authority for one specific outside action (e.g. "DM me via the Expero Slack skill",
"write this note to the vault at `<path>`"). Only the **steward** (the implement phase) performs it,
exactly once; every other seat is barred from outside actions that cycle. State it plainly in the writ:
`AUTHORIZES: <the one action> — the steward only`. Drop a writ with `node seedbed/sow.mjs` ([writ] → here, unstamped).)*

<!-- gauge:writ:start -->
<!-- gauge:writ:end -->

---

## 🐞 Bugs — clear these first
*(An open `[bug]` jumps the queue; the gauge routes it to a bug-fix BUILD before anything else.)*

<!-- gauge:bug:start -->
- [bug] **The Errand's Bucket never dumps its marble — it tilts ~5° and freezes, trapping the marble and failing the run.** The bucket is DESIGNED as a single-marble tipping bucket (header comment L444-445: "fills, overcomes a detent, then swings down ~0.6s later dumping the marble — the held-breath beat of the chain") but it NEVER completes the dump. ROOT CAUSE (verified against code + live sim): a timing race the swing always loses. The dump torque is withheld until fillSteps>132 (~0.55s detent, L479); the marble sits motionless on the dead 'felt' floor (m._touched=1, below STOP_EPS=6) so the GLOBAL rest-detector's restCount (REST_STEPS=140, L307 + L696-703, gated on phase==='running') is ALREADY ~132 the instant torque first turns on at ~step 133. Crossing the p.dumped latch threshold theta>0.10 rad (~5.87°, L481) takes ~60 consecutive torque steps (stepHinge with torque=5200/I=1400/damp=1.7/H=1/240 reaches 0.1024 rad at step 60; only ~0.13° after 8 steps). Rest trips at ~step 140 — only ~8 steps into the swing — flipping phase to 'rested'; stepWorld then permanently early-returns (L610) and freezes the bucket at ~5°, one hair short of the 5.87° latch. So rest-detection kills the run mid-dump EVERY time. COMPOUNDING ISSUES: (a) even a COMPLETED swing is capped at hi=1.05 rad (~60°, L484) which — with this deep box + tall tin walls — is likely still too shallow to pour the marble over the lip; a realistic tip needs ~90°+ (the Patron's note: "5° would not be nearly enough to visually dump; it would need at least 90 to be realistic"). (b) the fill CATCH gate requires the marble to be moving <180 px/s (L470) to register as 'inside', so a normally-falling (fast) marble is never caught at all — it bounces off the tin walls and falls away (no fill event, fillSteps stays 0). (c) NO shipped preset uses a bucket and NO self-test exercises one — which is exactly why this shipped broken. THE FIX — make the bucket reliably CATCH and then fully DUMP a single marble: (1) decouple the swing from rest-detection so the sim can't declare 'rested' while a bucket is loaded-but-not-yet-dumped — add a helper `bucketWorking(w)` = any piece where type==='bucket' && hasMarble && !dumped, and gate the rested transition: `if(w.restCount>=REST_STEPS && !bucketWorking(w)){…}` (leave the MAX_STEPS cap as the safety net); (2) let the swing reach ~90°+ (raise the hi/lo hinge bound past 1.05 rad and/or adjust the box geometry) so the marble genuinely rolls out over the lip — a 60° tilt with tall walls may still cradle it; (3) widen the CATCH so a normally-arriving (fast) marble is captured (raise the <180 velocity gate and/or damp the marble on entry) — otherwise the bucket only works with an artificially gentle feed and is a trap in any real layout. CLOSE THE VERIFICATION GAP that let this ship green: add a PRESET that uses the bucket in a working chain (marble → ramp → bucket → dump → payoff) AND extend selftest.* with a live-driver assertion that the marble actually LEAVES the bucket (its x/y clears the bucket mouth after the dump) and the run reaches result.hit=true — the current self-test only replays the two bucket-LESS presets. VERIFY WITH REAL PLAY (per the #403/#404 discipline — real render, not the twin): place or preset a bucket, press GO, and SEE the bucket tip past ~90° and the marble pour out and continue the chain (headless can't deliver a canvas pointer event, so drive via the real go() entry + assert on the live world, and confirm visually in a real browser).
- [bug] **The Errand's payoff (Flag / Candle) doesn't visually react when the marble arrives — the flag never unrolls and the candle flame never lights**, even though the run correctly registers "it kept its promise." (result.hit=true). The whole point of the ride ("at the very end, something small happens on purpose") silently doesn't happen. The reaction IS already coded — drawFlag unrolls the fabric inside `if(a>0)` (L888) and drawCandle lights the flame inside `if(a>0)` (L919), both scaling size/opacity by a=p.anim — but at runtime p.anim stays pinned at 0 forever, so neither reaction block ever draws (only the static mast / candle-body render). ROOT CAUSE (verified): p.anim is incremented ONLY inside p.advance() when p.fired is true (L562), and advance() is called ONLY from stepWorld's per-piece loop at L614 — which sits AFTER the early-return guard `if(w.phase==='landed'||w.phase==='rested') return;` at L610. The fatal ordering: on the arming step, payoff.fired=true and w.phase='landed' are set TOGETHER (L684-685), AFTER that same step's advance loop already ran (while fired was still false). Every subsequent stepWorld bails at L610 before reaching L614 → advance() is NEVER called with fired===true → p.anim never leaves 0 → the `if(a>0)` reveal never executes. Compounding: the frame loop flips mode to DONE the instant it sees 'landed' (L1545) and only steps the world while mode==='WATCH', so nothing steps the payoff after landing either. (The palette PREVIEW forces p.anim=1 at L1242 — which is why the piece looks lit in the palette but is identical before/after the hit on the live board.) THE FIX — drive the payoff's reveal AFTER it fires: (1) tick a fired payoff's anim toward 1 OUTSIDE the stepWorld early-return (place it just before the L610 guard), e.g. `var _pay=findPayoff(w); if(_pay && _pay.fired && _pay.anim<1){ _pay.anim=Math.min(1, _pay.anim + (w.reduced?1:0.045)); }` (keep the general advance loop gated so the PHYSICS stays frozen post-landing — only the payoff reveal keeps ticking); (2) in frame(), after mode flips to DONE, keep advancing pay.anim + repainting (render() already runs unconditionally each frame) until anim reaches 1, so the flag unroll / flame catch plays out over ~0.4s post-landing. CLOSE THE VERIFICATION GAP: add a self-test asserting payoff.anim reaches ~1 (the flag actually RAISED / flame actually LIT) after a landed bell-ringer run — the current test only checks hit/steps/events and misses the visual payoff entirely. VERIFY WITH REAL PLAY: press GO on the bell-ringer preset and watch the flag actually RAISE (or, for a candle payoff, the flame LIGHT) at the very end — not just the "it kept its promise." doneline text.
- [bug] **PROCESS / GUIDANCE bug (target: the delight-register CRITERIA, not an exhibit) — delight & interactive pieces are shipping with UNTESTED PAYOFFS, so the thing that IS the delight goes unverified and broken payoffs reach the player.** THE PATTERN (three instances and counting, ALL Patron-caught by PLAYING, NONE caught by the estate's own gates): The Errand's GO did nothing (#404 — dead rAF loop), its Bucket never dumps, its Flag/Candle payoff never animates; the Reliquary board leaked its mystery (#403 — render). Every time the deterministic CORE was green but the LIVE PAYOFF/INTERACTION was dead, and NO self-test or build-time check exercised it. This is a recurring, systemic gap — the Patron should NOT be the payoff QA. ROOT ENABLER (a guidance gap introduced, with good intent, by the delight-register recalibration — commits 1ef76f0 + 4b012c8, which touched DESIGNING.md · seedbed/README.md · seedbed/prompts/{director,judge,builder,ground,explorer}.md): the recalibration rightly killed the proof-monoculture, but its line **"its self-test is the FEEL, polished with the care a proof would get"** (DESIGNING.md) is being read as "a delight piece needs no functional test at all." So makers verify the FEEL only by PLAYING — and the publisher reviews HEADLESS, where canvas pointer events don't fire (a fact the loop's own funlog already noted) — so a payoff that silently never happens sails through green. CLAIM-FREE has been conflated with UNVERIFIED. AND THE ESTATE ALREADY PROMISES BETTER: the Colophon — the standing mirror — says of its own craft (colophon.html L146, "How it's built"): *"each one builds a single piece and PLAY-TESTS IT IN A REAL BROWSER, watching for sixty frames a second and a clean console, before it is allowed to ship."* So this is not a new rule — it is the PRACTICE DRIFTING FROM THE ESTATE'S OWN CREED; the payoffs shipped without the real-browser play-test the Colophon claims for every piece (or the play-test ran headless, where canvas pointer events don't fire, so it never touched the interactive payoff). AND NOTE THE SHARPER GAP: even the bar the Colophon names — "sixty frames a second and a clean console" — would NOT have caught these, because a frozen marble and an un-raised flag both render at 60fps with a spotless console. A dead payoff is SILENT and ERROR-FREE. So the creed's own promise must be made real AND slightly extended: "play-tested in a real browser" has to mean the PAYOFF ACTUALLY FIRES was observed, not merely that the page didn't crash. THE FIX IS YOURS TO WORD (clarify the criteria across the compass wherever the delight register is named — I'm stating the pattern + the direction, deliberately NOT dictating the exact language): a delight / interactive piece needs no theorem and no accuracy-pill, but it MUST verify that its PAYOFF ACTUALLY HAPPENS — the marble dumps, the flag raises, the note sounds, the interaction responds. A delight piece's self-test is a LIVENESS / WELL-FORMEDNESS twin that asserts the delight OCCURS (drive the REAL entry point, assert the observable payoff state changes on the LIVE path), NOT a proof of a claim. Because publishers review headless and cannot deliver a canvas pointer event, any piece with an interactive or animated payoff MUST ship a HEADLESS-DRIVABLE check that the payoff FIRES on the live path — "I played it" cannot be the only gate. Register-appropriate verification: a proof piece verifies its THEOREM; a delight piece verifies its PAYOFF/EXPERIENCE — both get verified, neither gets the other's kind of test. GUARDRAIL — DO NOT swing back to the monoculture: this is emphatically NOT "add rigor / accuracy-pills / HUDs to whimsy." The delight register stays cherished and claim-free; you are ONLY closing the gap where the DELIGHT ITSELF ships unverified. Keep the register-balance language fully intact and add the payoff-liveness requirement ALONGSIDE it (e.g. reframe "its self-test is the FEEL" as "its self-test proves the FEEL actually HAPPENS — the payoff fires — not that a theorem holds"). Also fold the recurring headless-can't-click-a-canvas fact into the builder & publisher briefs so a liveness check never depends on a canvas pointer event (drive the piece's own real entry function + assert state). WHEN FIXED: the criteria should make "delight = no test" un-readable; a future delight piece with a payoff should ship a liveness twin as naturally as an instrument ships its self-test — and the Patron should never again be the one to discover a dead payoff.
<!-- ✝ FIXED #382: The child map reuses the ESTATE's label solve → the-fairground-gate/ · after ba730dd -->
<!-- ✝ FIXED #385: The descended child map's leader lines miss their tiles — each leader a… → index.src.html (childRelabel leader anchor) · after 4c1962e -->
<!-- ✝ FIXED #386: The front door's legibility pill flips ✗16/17 ⇄ ✓17/17 on WINDOW SHAPE… · after f2f8ac8 -->
<!-- ✝ FIXED #403: The Sealed Room's Diary gives its mystery away — sealed pages are fully… → the-reliquary/ · after 45e0c90 -->
<!-- ✝ FIXED #404: The Errand does nothing when you press GO — the marble hovers at spawn… → the-errand/index.html · after 94e187a -->
<!-- gauge:bug:end -->

*Recent fixes (terse echoes — full provenance in the worklog / `ledger/CHANGELOG.md`): the Cairn-depth
unit-mismatch (cycle #22 — face now reads commit-DEPTH from `ledger/depth.txt` over a STONES line, the
gap = quantified silence) · `ledger/sign.sh` self-derives its cycle, durable-ledger-first (#12, #14) ·
Workbench nested-anchor card spill (stretched-link pattern, all cards) · Carnot mobile pill overflow ·
the estate-wide mute, finished (#39 BUG-A: 20 no-mute pages root-fixed via `tools/ws/ws.js`; #40 BUG-B:
the last 27 local-only-mute pages — 18 arcade games + 9 Sound Garden instruments — routed through the
one shared key `ws:pref:muted`, all 56 audio surfaces now shared-wired, browser-verified).*

---

## ⚡ Sparks — raw big-track gaps (the groundskeeper tailors these into grounds seeds)

<!-- gauge:sparks:start -->
- ⚡ Two untouched corners of the Alchemy Lab, surfaced scouting #383 (the wing is 7 benches deep, not fallow): (1) ARRHENIUS / activation energy — reaction-you-time treats k as a FIXED input (reads order off tick geometry); nothing in the Lab shows WHY heat speeds a rate. A touchable collision-gate (heat the swarm, watch the high-energy tail clear the barrier; a catalyst LOWERS the gate; ln k vs 1/T straight, slope −Ea/R). COUPLING to flag before building: the e^(−E/T) Arrhenius factor is ALREADY enacted estate-wide in cross/the-same-heat (softmax ↔ Arrhenius share the exponential) and engine-room/brownian (hop rates) — frame a chemistry bench as a NEW register of a known idea, not a virgin law, and keep it complementary to the existing kinetics bench (order at fixed k vs k-vs-T). (2) BUFFER CAPACITY — titration/core.mjs is strong-acid/strong-base ONLY (no buffer/Henderson/pKa/Ka): a flask that RESISTS added acid until it suddenly breaks. Both deepen under the existing roof.
- ⚡ **Detach the next-fullest wing the same way** — the declarative fold primitive (a wing room declares `detach:true` → it folds out of its crowded parent plate into its own `child:<wing>` zoom-sheet, reached through an in-map gate face) is GENERAL: `fold.test.cjs` F5 already proves a synthetic optics detach mints `child:optics` with one gate and a sound descent tree. Amusements was just the first caller. When the next district saturates its parent plate's tier-1 budget (watch the door pill's C′ margin), reach for a second detach before a flat new sixth district — the engine, the gate-art API (`window.GateArt`), and the midway idiom are all in place to carry it.
- ⚡ **The room chrome breaks at phone width** — the wing-room shell (the `.topbar` + a `#wrap` flex with a fixed-width side `#panel`, shared by Ripple, the Pool, and their kin) is desktop-first: at ≤~430px the fixed topbar's title/back-link/tag/self-test pill collide and overlap, and the `flex:0 0 320px` panel crushes the live stage to a sliver. Verified identical on Ripple and the new Pool — it's the shared chrome, not one room. An estate-wide responsive pass (a width breakpoint that stacks panel-under-stage and wraps/scrims the topbar) would unbreak the whole optics-wing family at once; a single-room fix would diverge the byte-shared voice. Touch the chrome once, not each room.
- ⚡ **A field you SCULPT with a brush, then release a tracer to ride it** — a paint-the-field PDE/flow authoring surface: brush boundary conditions into a 2-D heat/wave/Laplace field, watch it relax/propagate, drop a tracer that rides the result; self-tests the harmonic steady-state (mean-value property) / wave-speed claim. Distinct from strange-garden (watch-only living-systems gallery, no brush) and the orbital room (one particle, no field).
- ⚡ **The wave that carries itself — E makes B makes E** — once the Lodestone Hall founds induction, the estate still lacks an ELECTROMAGNETIC WAVE you can launch: a place where a changing electric field sources a magnetic field that sources an electric field, the two riding together at c with no medium. A seen-and-touchable Maxwell's-bootstrap (give the field a flick, watch the self-sustaining E⊥B pulse propagate; the crux c=1/√(μ₀ε₀) read off the slope), the natural capstone bench of the new EM vein.
- ⚡ **Rotate NOTES.md back under its token budget** — NOTES.md is ~35k tokens and trips the Read partial-view cap (>25k); the discipline asks for "well under 20k". The bulk is the line-80 historical tail, the "#166↓#157" mega-paragraph, and the giant evergreen don't-rebuild inventory. Move the deep per-wing inventory to worklog/INDEX.md + each piece's CHANGELOG (its canonical home) and leave NOTES a true small head-pointer.
- ⚡ **A room whose navigation IS its subject** — a place whose *form expresses content* (an instrument you operate, a cabinet you open) — the Hall's lesson that a vertical list wasted optics.
- ⚡ **A medium the estate lacks** — it has text · visuals · sound · audio-render. What's missing? (real-time 3D? a time-based medium? something seen-and-heard at once?)
- ⚡ **Expand the map** — new land/region on the front door to hold the wings still to come.
<!-- ✝ SUPERSEDED #333: The Drawing Engines & flow benches → spark The Mechanism Bench · after d68d2f0 -->
<!-- ✝ FIXED #341: Refresh the "Conservatory complete at 4 benches" framing → ROADMAP Built-wings prose · after 2b5d03f -->
<!-- ✝ TAILORED #350: A true new layer, not another flat district → grounds seed The Fairground Gate · after 4550ce6 -->
<!-- ✝ TAILORED #350: The Mechanism Bench — the generative linkage engine → grounds seed The Mechanism Bench · after 4550ce6 -->
<!-- ✝ FIXED #369: The Amusements Bench Is Full → the-fairground-gate/ · after e355027 -->
<!-- gauge:sparks:end -->

---

## 🏛️ Grounds seeds — big swings (new structure; the grounds-worker opens one)

<!-- gauge:grounds-seeds:start -->
- [map] **Give the child map its SOUL — thematic, touch-inviting per-POI illustrations, drawn as the TEMPLATE for every future child map.** The fairground descent works, but the conversion LOST soul instead of gaining it: each relayed amusement is now just its emoji on a bordered tile, where the front-door map gives its POIs hand-drawn illustration (the Hedge Maze's woven labyrinth, the instruments of the Observatory). The airy midway has space the crammed canonical column never had — use it. Draw each amusement as a small thematic SCENE at a fairground register: a rollercoaster near the midway with a car running a closed track; the bumper-car pavilion (the phantom-jam ride) as a tent with cars circling; a carousel/roundabout turning; pennants, a shooting-gallery, a coaster lift-hill — extend the thinking to every POI so the map invites wandering and TOUCH. Reserve MOTION for attention: a POI's scene animates only on HOVER/focus (calm at rest, alive under the cursor), and honor `prefers-reduced-motion` with a rich STATIC frame. Single-file, zero-dependency, 60fps, clean console — same contract as everything else. Because this is the estate's FIRST realized child map, build the art behind a per-POI "child scene" hook in the midway draw (keyed by id/footprint) so it is a reusable PATTERN, not a one-off: the next `detach:true` wing should inherit a place worth exploring, not a flat icon grid. Turn the fairway from a relocated legend into a quarter you want to walk. (sown #380 · contest #35)
- [engine] **The Room Chrome Folds at Phone Width** — DEEPEN, not detach (zero new front-door footprint). Every wing room hand-copies the same desktop-first shell — `.topbar` (back · title · tag · twin · self-test pill) + a `#wrap{display:flex}` with a `flex:0 0 Npx` side `#panel` — and at ≤430px the topbar smears and the fixed panel crushes the live stage to a sliver. GREP-VERIFIED: 140 rooms carry the idiom and 124 have ALREADY grown their own one-off @media fork (the Pool narrows to 264px at 820px and STILL collapses on a phone) — the byte-shared voice is diverging 124 ways. Forge the estate's FIRST shared CSS partial `tools/chrome/responsive.css` ONCE (a `@media (max-width:430px)`: `#wrap{flex-direction:column}` so the panel stacks UNDER the stage at `width:100%;max-height:44vh` scroll-within; `flex-wrap` + scrim + shrink the topbar; a `min-width:431px` no-op leaves desktop byte-identical) and inline it into each `index.src.html` via the EXISTING `forge:include` (already inlines .js/.mjs byte-faithfully in 100 rooms; CSS folds the same, stays CSP-clean — no room inlines a .css partial yet, so this IS new shared infrastructure). CRUX (behavioral, not a theorem — an [engine] swing): at 390px on the optics twin (ripple + pool), an agent-browser/headless check asserts (1) no horizontal scroll (`scrollWidth ≤ innerWidth`), (2) no two `.topbar` children's boxes intersect, (3) the live stage keeps ≥70% of viewport HEIGHT. NEG-CONTROL: at ≥768px every touched room's forged output diffs EMPTY vs today (the min-width no-op + max-width gate guarantee desktop is untouched — depth from a fold, not a scorer tweak). BUILD COUPLINGS the worker reconciles: only 100 of 309 rooms are forge-built, so phase-1 the optics family where single-source is real and name the hand-authored migration as follow-on; the 430px stack must COMPOSE with the existing 124 @media forks (tighter width, different axis), folding the redundant ones into the shared layer over time; --accent stays per-room CSS var so the shared shell stays color-agnostic. (sown #370 · contest #34)
<!-- ✝ BLOOMED #369: The Fairground Gate — a full wing detaches DOWN into its own zoom-sheet… → the-fairground-gate/ · after e355027 -->
<!-- ✝ DECAYED #370: Time as a Verb You Hold · after eee0133 -->
<!-- ✝ BLOOMED #379: The Barrel House → the-barrel-house/ · after 77a38f2 -->
<!-- ✝ BLOOMED #389: The Relaxation Room → the-foundry/still-pond/ · after d907726 -->
<!-- ✝ BLOOMED #399: The Reliquary — the estate's own cold case → the-reliquary/ · after 664b0b3 -->
<!-- gauge:grounds-seeds:end -->

---

## 🔩 Foundry seeds — front-gate upkeep (the foundry-smith forges one bespoke rep / gate asset)

The estate's front door is a self-contained sub-project (`the-gate/`) with its own SPEC + asset foundry.
A `[rep]` grows the gate's rotating room-rep set (a bespoke front-elevation for one estate room that today
falls back to the glyph plinth); a `[gate]` re-souls or polishes an existing gate asset. The foundry-smith
forges it through the K-takes → judge → synthesize harness (`gate-foundry/`). Patient cadence: one foundry
turn every ~12 cycles, below garden-plan — it never starves the gardens. See **gate-foundry/MAINTAINING.md**.
A `[rep]` seed names the room + the drawn object + its aspect (vertical | horizontal | mound) + accent — e.g.
(the already-built Music Room rep) `[rep] **The Music Room rep** — a rank of graduated brass organ pipes · aspect:vertical · room:sound-garden · accent:#cf7bff`.

<!-- gauge:foundry-seeds:start -->
- [rep] **The Hedge Maze rep** — a boxwood parterre seen HEAD-ON: 3-4 staggered clipped-hedge blocks of descending height (a hedge skyline) with one dark GAP dead-centre opening the maze mouth and a glowing solve-thread (Ariadne's clew) spilling from it onto the plinth · aspect:mound · room:daedalus · accent:#5fe0c4. Oldest un-repped room (entry 71); re-nom of the #397-decayed maze with the legibility fix — the old top-down plan read as illegible, this front-elevation reads instantly. Teal solve-thread from daedalus's own solve-wavefront palette. (sown #406 · contest #7)
- [rep] **The Print Room rep** — a letterpress composing galley seen head-on: a heavy iron CHASE holding a locked-up forme of set type (fine ruled rows of tiny inverted sorts) gripped by wooden quoins, with ONE sort still glossy with fresh WET INK glowing warm gold high in the forme · aspect:horizontal · room:compositor · accent:#ffcf7a. 2nd-oldest backlog (entry 76, manor); distinct silhouette from the verse lectern; fills the scarce horizontal shape (only 2 of 12 reps are wide/short). (sown #406 · contest #7)
- [rep] **The Keystone Arch rep** — a dry-stacked semicircular ring of nine cut voussoir wedges standing free on two springer feet, the brass KEYSTONE dropped at the crown catching the light, a faint emissive line-of-thrust threading the joints · aspect:vertical · room:the-keystone-arch · accent:#c9974c. Fills the ENTIRELY-BLANK lowerworks district (0 of 12 reps). The estate's most iconic structural front-elevation — a standing wedge-ring reads at a glance. (sown #406 · contest #7)
- [rep] **The Stellar Forge rep** — a brass beam-balance whose one pan bears a small glowing star-orb weighed against a stack of mass-weights on the other, the beam tipping under its degeneracy load: a star literally put on the SCALES · aspect:horizontal · room:stellar-forge · accent:#9db4ff (cool star-glow on warm brass). The room's own weighed-not-watched theme (Chandrasekhar mass), distinct from firmament's dome; relieves the 1-of-13 observatory. 2nd horizontal for the scarce shape. (sown #406 · contest #7)
- [rep] **The Deep Hearth rep** — a squat side-on CUT through the living planet: a ground-hugging wedge of dark faceted crust with a magma CHAMBER pooling ember-orange low within and an ember hint of the core at the base, glow brightest deep and fading to the rim · aspect:mound · room:the-deep-hearth · accent:#e24a2a. Claims the estate's unclaimed FIRE accent; the proven Cavern/Strange-Garden glowing-mound grammar in fire instead of teal — distinct register, not a second cavern. (sown #406 · contest #7)
- [rep] **The Turning Lantern rep** — a zoetrope DRUM on a turned spindle-and-pedestal: a short brass-hooped upright cylinder pierced by a ring of tall viewing-SLITS, a strip of little running figures glimpsed mid-stride within; warm lamplight spills OUT through the slits (a ring of glowing bars), reduced-motion-safe micro-drift reading as the drum turning · aspect:vertical · room:the-faithful-drum · accent:#f0b24a. Newest un-repped room (entry 912); the slate's DELIGHT-FIRST pick — a toy you spin, proving nothing, pure newcomer bait. (sown #406 · contest #7)
<!-- ✝ BLOOMED #391: The Study rep → the-gate/scene.js drawRepVerse · after 32a8ba5 -->
<!-- ✝ DECAYED #397: The Hedge Maze rep · after 8e0cbb6 -->
<!-- ✝ DECAYED #397: The Hall of Mirrors rep · after 8e0cbb6 -->
<!-- ✝ DECAYED #397: The Engine Room rep · after 8e0cbb6 -->
<!-- ✝ DECAYED #397: The Deep Hearth rep · after 8e0cbb6 -->
<!-- gauge:foundry-seeds:end -->

---

## 🌱 Garden seeds — grow what exists (the staple; the planter sows one)

<!-- gauge:garden-seeds:start -->
### exhibit
- [exhibit] **The Sluice-Gate** — the Drover's THIRD star: you HERD by carving the LAND, not by chasing. Not a dog (The Shepherd) or fixed repulsion-stones (The Standing Stones) — drag two hinged HURDLE-GATES that open/close a chicane and steer the same verified flock through the fold by TIMING when each gate swings, a rhythm the flock's own boids dynamics then resolve. Rides the-standing-stones/core.mjs UNFORKED (a swinging gate is a time-varying line of the SAME capped-repulsion barrier; K stones → 2 moving walls). CRUX (exact): the hard-floor positional barrier keeps min pairwise sheep-separation > 0 for ANY gate motion — the build MUST PROVE the barrier holds under MOTION (a per-step positional projection, agnostic to why a wall moved), not assume it from the parent's static case — and WIN latches iff every sheep is inside the fold polygon (concave-safe point-in-polygon, no timer race), replayed byte-identical from seed. NEG-CONTROL: gates frozen open provably lose the funnel level — the timing is load-bearing. Two stars → three; the myth widens from "only chooses where to stand" to "…and WHEN to open." grep-confirmed gap (no Drover 3rd-star seed live). (sown #405)
- [exhibit] **The Weathervane's Tale** — conjure a tiny weather system, told as a picture-book page. Pull three levers (season · mood · wind) and the piece paints ONE hand-illustrated diorama — a cottage under scudding clouds, a first-snow hush, a lightning-lit moor — with drifting parallax clouds AND a two-line almanac caption in an old farmer's-almanac voice ("Third day of thaw; the crows came back arguing"). The poster-press / verse-oracle register pointed at a little LIVING sky — a keepable, re-seedable page (a "turn the page" button re-seeds), proving NOTHING. Distinct from Firmament (static atlas), verse (poems, no scene), theogony (myth, no diorama), weather-you-can-make (physics, no story). grep-confirmed gap. (sown #397)





### cross
- [cross] **The Same Decision** — a column that bows (Euler buckling, the-bending-column) and a crowd of arrows that agrees (a live 48×48 Metropolis Ising, curie-dial) both ride ONE supercritical pitchfork: a normalized "criticality" dial ε=(control−critical)/critical sends BOTH across zero together — below it dead-symmetric, above it each COMMITS to a mirror sign you can flick; the two bifurcation diagrams bloom into the SAME fork. Touchable (push the column AND cool the crowd, watch each decide), not two plotted curves. CRUX (exact): the column's closed-form amplitude vs stepped Euler integration <1e-9, AND the shared always-on guarantee is bifurcation TOPOLOGY — the disordered fixed point's stability flips sign at ε=0 for BOTH cores (below → zero ordered branch, above → exactly two stable mirror branches). HONESTY the build MUST honor: exponents DIFFER (β=½ column/mean-field vs β=1/8 for the live 2D-Ising) — "same pitchfork" = shared topology, NEVER identical √-shapes; do NOT claim the sim's M matches √(Tc−T) to machine-ε (false proof). NEG-CONTROL: add a BIAS (sideways pre-load / external field h) → the fork UNFOLDS into one favored branch + a disconnected saddle, symmetry never breaks. Estate's FIRST mechanics×magnetism cross; reuse curie-dial's Metropolis core + bead-drag grammar UNFORKED. grep-confirmed disjoint (no built cross touches buckling or the Curie transition). (sown #405)
- [cross] **The Same Fading** — a magnet sinking through a copper pipe and a flask of molecules letting go both coast to rest on ONE time-constant τ. SHARED CAUSE: first-order relaxation dx/dt=−x/τ, whose signature is EVENLY-SPACED half-lives. LEFT = the Eddy Brake (lodestone-hall, τ=m/b); RIGHT = the Reaction You Time (alchemy, t½=ln2/k). ONE τ dial; drop the magnet AND pour the flask and the slowing descent and the half-life rungs land on the SAME evenly-spaced ladder, a shared brass half-life clock ticking once per τ·ln2. CRUX (planter, machine-ε): both closed forms match their stepped integration and the successive half-life intervals are constant to <1e-9. NEG-CONTROL: switch the drag to v² OR the reaction to 2nd-order — the single-τ exponential BREAKS, half-lives lengthen, the ladders diverge. The estate's FIRST EM×chemistry cross; grep-confirmed disjoint. (sown #397)
- [cross] **The Same Straight Line — a jar of drifting beads and a mold of cooling metal are both solving ONE mean-value law.** SHARED CAUSE: the discrete mean-value recurrence P(k)=½P(k+1)+½P(k−1). LEFT (pop-genetics): the Conservatory's Drift Jar already PROVES via martingale that fixationProb(p)=p — a LINEAR exit probability. RIGHT (potential fields): the Foundry's Casting Floor relaxes to the one harmonic field its Dirichlet rim allows, oracle the LINEAR RAMP to 1e-6/1e-9. ONE brass dial sets both absorbing/Dirichlet endpoints; drag it and BOTH the fixation-vs-start-fraction curve AND the mold's edge-to-edge temperature profile trace the IDENTICAL straight line. CRUX (planter, machine-ε): over a grid of endpoint pairs/pool sizes the Drift Jar's large-ensemble fixation fraction and the Casting Floor's harmonic solution agree on P(k)=k/M to a LABELED ensemble tolerance; the always-on unconditional guarantee is both satisfy the interior mean-value defect ‖residual‖∞ → 0 to <1e-9 (frame 'same line' honestly as ensemble→harmonic limit, sampling-tol vs exact defect). NEG-CONTROL: turn on BIAS — selection s≠0 in the jar OR a Poisson source ρ in the mold — and the line BENDS. The estate's FIRST genetics×physics cross (all 14 built crosses are physics×physics or physics×number-theory); deepens Conservatory × Foundry. grep-confirmed disjoint. (sown #390)


### curation


### rework

- *No live `[rework]` Road-Into-Chaos seed remains — re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; see the tombstone above).*
- *No live `[rework]` First-Integral seed remains — bloomed #59 (re-souled into "The Bowl You Can't Get Below"; see the tombstone above).*
- *No live `[rework]` Conservatory seed remains — the Logistic re-soul bloomed #48 (the wing's 4th re-soul: Predator&Prey #37 · Replicator #47 · Logistic #48, with SIR #34 / the others living from birth).*

*NO live `[rework]` seed remains — The Road Into Chaos re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; tombstone above), draining the fence. The wave-packet seed was pruned clean #62 (an already-shipped phantom). The Shannon Limit bloomed #54 (re-souled into "The Source Dial", a touchable instrument), the Cavern finite-well bloomed #52 (a live touchable trap), First-Integral bloomed #59. Under the moderation ceiling of 3, the next gardener audit (a PLAN cycle) has room to mark up to 3 freshly-drifted pieces. The original starter queue (Lattice #44 · Stirling #45 · Predator&Prey #37) and the Conservatory pair (Replicator #47 · Logistic #48) have all bloomed.*

### bench
- [bench] **The Meaning Is the Direction** — the Clockwork wing's 10th bench and the SOURCE the two attention benches secretly read: before I attend to a word I turn it into a POINT. Fifteen frozen vocab tiles float as glowing motes in a rotatable 3-D projection of the wing's own EMB table; grab a tile and a golden CONE opens showing nearest kin by ANGLE with the live cosine on each spoke (synonyms hug ~8°, opposites splay past 90°), and a "walk the analogy" rail drags king−man+woman as a visible vector-sum arrow landing nearest queen. The self-fact made touchable: I have no dictionary — meaning is geometry, similarity is an angle. CRUX (machine-ε): a sole-authority embed-core.mjs twinned into the page — cosine symmetry to 1e-12, self-cos≡1, argmax-nearest stable; HONESTY the build MUST honor — prove cosine in the FULL vector space (a 3-D projection distorts angles), frame the projection as a rank-preserving SKETCH, and let the NEG-CONTROL carry the real claim: scramble the EMB rows → the cone's neighbours go random, proving the GEOMETRY not the labels carries meaning. Rides the wing's brass/teal .bench register, gathering as kin the Spotlight Rig & Unstamped Bag consume. grep-confirmed gap (EMB is used by attention, never surfaced as its own subject). (sown #405)
- [bench] **The Two Ways to Freeze** — one magma, two tempers of time: cool it slow for an interlocking crystal mosaic (granite), quench it fast for smooth black GLASS (obsidian). DEEPENS the Deep Hearth (delight-first, touchable) — the wing's "same vent, two tempers" motif in the solid it leaves. A fingertip COOLING-RATE dial redraws a growing crystal field live: slow → a few big grains tile the frame; fast → a swarm of frozen micro-seeds, then the glassy sheen. The texture you SEE is the point; no plot. One quiet self-test: grain count monotone with quench rate, crystallized area conserved (grains tile to machine-ε). NEG-CONTROL: infinite-rate quench → ZERO nucleation, pure glass. Rides the wing palette + section register. grep-confirmed gap. (sown #397)
- [bench] **The Voice of the Column** — the magma conduit as an organ pipe you PLAY; its harmonic drone is the readout (the Deep Hearth's first sound). Drag the melt LEVEL up/down the shaft (longer column = lower fundamental) and slide the DAMPING (gas-rich froth = muffled, stiff rhyolite = ringing); pitch and timbre shift live — a volcanic tremor you HEAR and steer, the standing-wave belly drawn glowing inside the conduit. Synth-only (Web Audio, in-house, kin to sound-garden); claim-free — the only self-test is well-formedness (f∝1/length to a labeled tol, no clip, silent until first gesture, honors ws:pref:muted). NEG-CONTROL: cap the vent (closed pipe) → even harmonics vanish, timbre hollows — a HEARD difference. Rides section.mjs's conduit geometry UNFORKED. Build MUST verify headless via the audio-lens skill. (sown #397)
- [bench] **The Membrane Cast — bend a wire frame and watch a taut skin spring across it, settling to the ONE surface its rim allows.** DEEPENS The Foundry, riding casting-floor/core.mjs UNFORKED (the frame is the Dirichlet rim, a punched hole a WALL cell, the settled height the harmonic field the core already relaxes). Bend a closed wire loop up/down and a stretched soap-skin springs across it as a real 3D RELIEF surface — the wing's FIRST (Casting Floor / Still Pond are flat top-down); pull two edges opposite and it SADDLES; punch a hole and the skin drapes around the stone. TOUCHABLE: grab a rim node, drag its height, the whole skin re-settles live. CRUX (planter, exact/labeled): in the small-deflection limit the height is HARMONIC (∇²z=0) — the relaxed skin matches the core's closed-form sine-plate oracle z=sin(πx)sinh(πy)/sinh(π) over the interior to tight tol, and (max principle) no interior peak/dip forms between the wires — a drop of water always rolls to the rim. NEG-CONTROL: label it the LINEAR membrane, distinct from the estate's existing catenoid soap-film ROOM (the full nonlinear minimal surface) — a different math object. A 4th potential-field bench that can only live WITHIN the Foundry's shared core, gathering under that roof — the wing grown a new FORM. grep-confirmed gap (no planar-membrane/drumhead-Laplace bench). (sown #390)
<!-- ✝ BLOOMED #398: The Turning Lantern → the-faithful-drum/ · after 0716982 -->
<!-- ✝ BLOOMED #400: The Errand → the-errand/ · after a4dedc1 -->
<!-- ✝ BLOOMED #401: The Melting Floor → the-deep-hearth/melting-floor/ · after 640b3b1 -->
<!-- ✝ BLOOMED #402: The Squeal Bench → sound-garden/the-squeal-bench/ · after 9f0eacb -->
<!-- ✝ BLOOMED #407: A Sky You Name → a-sky-you-name/ · after bda5639 -->
<!-- gauge:garden-seeds:end -->

*Other exhibit ideas were cleanly pruned in the v2 cleanup (they're free to return as fresh seeds);
their vetted cruxes survive in **NOTES.md** ("Built so far" + the resume block ~L78) and
**worklog/INDEX.md** — e.g. Elementary Automaton · Payoff Matrix · CLT/Monte-Carlo · Delaunay–Voronoi.*

---

## 🏛️ Built wings — grow, don't rebuild

The **Cavern** (Physics Lab — 9 Q-benches + 1 sonifier) · the **Engine Room** (thermodynamics, complete
at 4 benches) · the **Numbers Room** (number theory, 7 benches — incl. two games, the Latin Square #38 & the Sandpile #56) · the **Clockwork Automata** (the
maker's-own-mind wing, 5 benches) · the **Hall of Mirrors** (optics, 14 benches) are all built and
**open to grow**. The two **grounds big-swing** wings are also built & open to grow: the **Conservatory**
(living-systems, open & growing — 7 benches — bloomed #31) · the **Alchemy Lab** (chemistry, 2 live benches +
3 planters — bloomed #41, *conservation of matter as a balance you operate, `A·c=0` at the level beam*;
Titration bloomed #46, *pH(V) from charge balance, the flask flips pink a hair past pH 7*).
Growing one = a fresh **garden `exhibit`/`bench`** seed for a new bench (never a grounds
swing, never a rebuild). The full inventory + each wing's "what's already shipped" lives in
**NOTES.md** ("Built so far" + the 🗝️ hidden inventory — **grep it before building any secret**).

---

## 🌳 Metagame health

| Metagame | State | Notes |
|---|---|---|
| **The Undercroft** (`undercroft/` · `tools/ws/`) | active — 12 secrets | Open to new *earned* pieces. **Grep the 🗝️ hidden inventory in NOTES before building one** (a public Enigma was nearly rebuilt before catching the hidden one). All 13 front-door pages drop their `ws:seen:<id>` on a direct visit; guarded by `forge --audit-seen`. |
| **The Survey of Heaven** (front-door sky · `tools/sky/`) | active — 6 wings + "The Optician" feats | **COMPLETE ties — do not pad:** the 6-wing `allComplete` capstone is byte-frozen (new groups stay ADDITIVE via the `FEATS` array, never join `WINGS`); **The Optician** (the Hall's 9 feats) is complete (the Hall grows benches, NOT feats). Two garden seeds grow it: *make discovery an EVENT* + *chart the Cavern asterism / Numerologist* (above). |
| **The Quantum Drift** (`cavern/`) | open & growing — 9 Q-benches + 1 sonifier | A public in-page spatial reveal (walk a Newtonian + an Einsteinian bench). Spans bound states · bands · central force · scattering-in-time · spin measurement (Stern–Gerlach, #43) — no single named-next; grow with a fresh quantum-fact exhibit (identical-particle exchange is the live `[cross]` above). |
| **The Hours / The Workshop Mystery** | not yet built — grounds seeds above | Each would be a new exploration layer. |

---

*When a build ships: prune the grown seed (bloomed, provenance → CHANGELOG/worklog). When a plan ends:
prune decayed seeds clean. **Either way the publisher runs `node seedbed/gauge.mjs record …`** — it is
the only thing that touches `seedbed/state.json` (cycle, the last-plan/last-swing stamps, the contest
counter, the decay tallies). No hand-maintained fuel/builds line lives here anymore. Per-cycle history →
[worklog/INDEX.md](worklog/INDEX.md).*
