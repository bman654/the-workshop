# The Gate — Changelog

<!-- ═══════════════════════════════════════════════════════════════════════
     RESUME POINTER  (read this first on a fresh/compacted context)
     ═══════════════════════════════════════════════════════════════════════ -->
## ▶ RESUME POINTER — current state (2026-06-23: FOUNDRY COMPLETE + Phase-D room-rotation, wind-sway, WEATHER-FX, real MOON-PHASE WIRING, **AUDIO COMPLETE** (11 procedural sounds across 3 passes — owner verdict "sound is perfect"; creature rotation day=birds/dusk=crickets/night=owl), first-gesture audio unlock, the **founding-myth entry splash + "Hand That Guides" outro** (owner-loved bookend), reader-paced **skippable outro** (10s + click/key), all owner-playtest fixes, **EARNED-STATE PASS** (random unlocked asterism + per-visit random roomref over slab∪cairn + undercroft 3rd "discovered/closed-doors" state + ambient weather drift) — ALL SHIPPED; K=4. **Undercroft predicate
FIXED 2026-06-23** — `undercroftState()` now reads the real reveal keys (`-rune||-undercroft`→open, else `-opening`→closed)
so the owner's opening-only store correctly draws the SEALED closed doors (was wrongly falling through to 'none'); see the
dated entry below.
**HONESTY SELF-TEST CHIP — the gate keeps its word — ✅ SHIPPED (2026-06-23):** `selftest.js`
(`Gate.selftest`) + a subtle top-left brass chip `#gate-honesty` that PROVES, render-blind, that the
gate truthfully reflects earned state + sound math — 15 pass/fail invariants across asterism
coherence / room coherence / moon math / determinism, each with a load-bearing negative control;
`Gate.selftest.run()` testable headless. Smoke-clean over served HTTP (cold GREEN 15/15, unlocked
GREEN, forced inconsistency → RED with the failing claim named, `?moon` pin exact), zero console
errors. See §9 + the dated entry below.

**ASTERISM POLISH — ✅ FIXED (2026-06-23):** two confirmed asterism bugs — (1) the chip self-test no
longer re-rolls the showcased pick on the first weather change (new `AST._peek`/`_poke` memo seams;
`selftest.js` `currentUnderStub()` SAVES/RESTORES the live memo instead of leaving it `_reset()`), and
(2) `drawAsterism()` now WRAPS + horizontally CLAMPS the name·myth so long myths (The Wagerer / The
Coilwright / The Automaton) never clip the screen edge. Verified across weather changes (label stable,
chip 15/15, neg-ctrl still flips + restores) and per-figure screenshots (`/tmp/ast-polish-shots/`); see
the dated entry below.

**▶▶ NEXT — to FINISH the Gate (see §9):** (1) **beauty passes** — ✅ glow refine + rain ground-splatters SHIPPED 2026-06-24 (see the polish-pass entry below); moon/sun + asterism shape are now hand-tuned across day/dusk/night/storm (audio balance is owner-accepted: "perfect"). (2) **dogfood QA** — ✅ **AGENTIC QA PASS clean, zero defects 2026-06-24** (see entry below): visual chip 15/15 + 0 console errors + 9/9 matrix + asterism cycling + open-seq→index + reduced-motion; audio 8/8 builders non-clipping + band-gating exact. (3) **estate-representative critics** — final sign-off panel of 6 (Survey/Grounds/Ledger/Clockwork+Furnace/First-Arrivant/Curator-of-the-Five-Questions), grounded in the estate's documented design mandates (IN PROGRESS). (4) **go-live** (owner call) — the gate lives on branch `the-gate` and navigates to `../index.html`; making it the estate's actual entrance / merging is a separate decision.)

**ESTATE REPRESENTATIVES' SIGN-OFF + reservation fixes — ✅ (2026-06-24):** six estate-voice critics gave the gate final sign-off — **5 approve · 1 approve-with-reservations · 0 reject** — each grounded in the estate's OWN documented design mandates (the Five Questions from DESIGNING.md, the dark-body/brass idiom, palette-swap-not-filter, emissives-recede-by-day, lit-from-above, reduced-motion freeze, grounded/form-expresses-content, self-contained). The Curator marked every visual mandate **MET** (reading colormap.js to confirm palette-swap-not-filter + the emissive roles); the Master of Clockwork verified the moon is REAL (J2000 + Meeus, 14/14 node assertions) and that the honesty chip cross-checks the DRAWN moon against the COMPUTED one. Keystone triaged the reservations and addressed the clear, low-risk ones — **without touching the asterism PICK logic (earned-state honesty preserved):** **(A)** charted asterism stars now render as deliberate layered emissive jewels (stronger warm bloom + a tighter inner halo + a near-white hot core, slightly larger) so a figure reads as a CHART, not a faint line, even at 2 stars [Astronomer-Royal MAJOR]; **(B)** honesty-chip rest opacity 0.42→0.60 — a quiet oath, not a debug pill (hover→1 + the 15/15 logic untouched) [Keeper minor]; **(C)** the open sequence had ~0 ms manor-revealed dwell (fadeOut fired the instant the gates finished swinging) — added `T_REVEAL_HOLD=1000ms` so the best beat lands before the cut (reduced-motion collapse + skippability + `../index.html` nav all preserved) [First Arrivant minor]; **(D)** foliage wind-sway VERIFIED animating live in storm (strong, eased ~3.4°, all 8 crowns carrying live rotation) — the Head Gardener's "static grounds" note was a STILLS ARTIFACT, no fix. *Verify (served HTTP :8791, `?unlock=all`, pixels LOOKED at):* asterism reads as a deliberate figure on the live 2-star cases (The Coilwright / The Cartographer), chip noticeable-but-quiet, `Gate.selftest.run().pass===true` (15/15), ZERO console errors, full open sequence gears→swing→lingering reveal→welcome→nav to `../index.html`, reduced-motion (raw CDP) renders + collapses + navigates clean. `forge --check --all` = 97 current. Collated 6 sign-off marks onto the cairn (5 judges — Astronomer-Royal, Keeper Who Read the Chip, Curator Who Watched It Swing, Master of Clockwork & Furnace, First Arrivant — + the builder *The Quiet Oath*). **DEFERRED to the owner go-live call:** a TRUE interlocking gear-train mesh (next pass — radial nudge to pitch-tangency + tooth phase-offset + ratio-locked counter-rotation), splash-ripple lit-from-above warmth, grass overcast tonality, and the estate welcome-page href + its own mute control (`../index.html` = makers' territory, not gate scope).

**AGENTIC QA PASS — clean, zero defects — ✅ (2026-06-24):** two parallel READ-ONLY diagnostic agents (no edits, no commits — pure defect report). **VISUAL** (agent-browser): honesty chip `Gate.selftest.run()` = **15/15 ✓** green; **ZERO console errors/warnings** across 561 log entries (only the info-level honesty-self-test + post-nav door legibility breakdowns); all **9** time×weather combos (day/dusk/night × clear/cloudy/storm) render cleanly with `selftest.pass` true on each (asterism figure wraps INSIDE the frame, undercroft hatch open, room-rep present, weather correct); asterism cycling across 6 night reloads → distinct multi-star figures, never a lone star, `selftest.pass` true on EVERY load (the chip-rerolls-the-pick regression confirmed absent); gnomon advances time, weather tri-toggle + mute work; the OPEN sequence rides gears→swing→welcome→auto-navigates to `../index.html`; reduced-motion (real CDP `prefers-reduced-motion: reduce`) renders + opens with collapsed timings, zero errors. **AUDIO** (audio-bench OfflineAudioContext `renderWav`→WAV→**audio-lens**, self-test 12/12): all **8** procedural builders audible + **NON-CLIPPING** (peaks −7.7…−1.9 dBFS) and character-correct (rain broadband wash · wind low bed · birds sparse-bright · owl sparse-low · crickets steady mid-high · chimes in-tune tonal A4/E5/D5 · thunderclap transient+tail · thunderroll 60 Hz rumble); LIVE band-gating verified **EXACT** — day→birds, dusk→crickets, night→owl (one creature per band), wind always-on, chimes non-storm only, rain+thunder storm-only; mute drives master 0.9→0→0.9. **No defects in either track.** Two judges' marks collated onto the cairn with this checkpoint — *The Ear That Cannot Hear* ("I never heard the owl, yet I proved it waits for night") + *The Unblinking Witness* ("I looked at every pane before I swore the gate kept its word").

**THE GATE POLISH PASS — refined emissive glows + rain ground-splatters + `?unlock=all` dev pin — ✅ SHIPPED (2026-06-24):**
A three-builder beauty pass, each editing disjoint files in place, integrated + hero-reviewed together. **(1) GLOW** (`scene.js` + `scene-gate.js`): refined all six emissive elements of the gate as a light-artist — the moon + its glow halo, the sun, the two pillar lamps, the arch-crown lamp, and the warm manor windows — tuned on the ACTUAL rendered look across day/dusk/night so each light reads as "a place the dark gives way" (lamps stay cool/quiet in daylight, blaze warm gold against night/storm, never wash out). **(2) RAIN** (`weather-fx.js`): drops that reach the foreground apron / near-ground band now leave a brief expanding ring-ripple (a flattened bright ellipse + a faint dark "wet" under-ring for contrast on BOTH dark night stone and bright day flagstones) plus a tiny upward splash tick, fading over ~0.42–0.74s, from a FIXED recycled pool (`MAX_SPLASHES=30`, never grows). The rain map was aligned to the art direction — `RAIN = { clear:0, cloudy:0.42, storm:1 }` (cloudy = LIGHT drizzle, storm = HEAVY downpour, clear = dry) — and splash spawn rate scales super-linearly with intensity so storm is visibly busier than cloudy. **(3) `?unlock=all`** dev pin — see the dedicated entry directly below. *Integration verify (agent-browser + direct CDP over served HTTP :8791, `?scene=idle&unlock=all`, pixels LOOKED at, ZERO console errors across all):* four hero shots — `t=day&wx=clear` (bright sky, sun glow, unlit-cool lamps), `t=dusk&wx=clear` (warm gradient, lamps warming, monument glow), `t=night&wx=clear` (full moon + glow halo, lamps blazing, a constellation drawn), `t=night&wx=storm` (heavy rain streaks + lamp blaze + dimmed moon-behind-cloud + constellation, ground-impact ripples on the apron) — saved to `/tmp/polish-hero/`; day-storm apron crop shows bright believable ripples on lit flagstones; clear weather = 0 non-transparent lower-band pixels (dry); reduced-motion (real CDP `prefers-reduced-motion: reduce`) = frozen overcast, no falling rain, lower-band pixel count IDENTICAL across 5 samples (`113,113,113,113,113` — no animation). `forge --check --all` = 97 current.

**`?unlock=all` DEV PIN — preview the fully-EARNED estate, real store untouched — ✅ SHIPPED (2026-06-24):**
QA / critics / fresh-eyes review needed a way to see the gate's earned state (rich asterism figures + the open undercroft hatch) WITHOUT hand-editing each reviewer's `localStorage` — and without polluting their real WS store. **Fix** (`sequence.js` `parseUrl` + `the-gate.src.html` boot ONLY — the two files owned this pass; glow/rain in sibling files untouched): (1) `parseUrl` now parses `unlock` — `?unlock`, `?unlock=all`, `?unlock=1` → `true` (and `?unlock=0|false` → off), exposed on the parsed object like the other dev pins. (2) the boot, when `url.unlock`, wraps `Sky.visitedFromStore` so it reports every `Sky.CATALOG` star PLUS every `Sky.WINGS`/`Sky.FEATS` member as visited — feat-group members are pseudo/room ids NOT in CATALOG, so catalog keys alone would leave those constellations incomplete — making `Sky.state` mark ALL asterisms `complete`, so the prefer-figures pick always has rich multi-star figures (and per-load reloads cycle across them). It also forces the undercroft hatch OPEN (`url.undercroft='open'` → `S.setDevUndercroft('open')`). The room-rep pool is already the full GATE-ROOMS slab (the slab is inlined in the page, not storage-gated), so no extra work there. The wrap is in-memory ONLY: NO WS setter is called, so `localStorage` is never mutated; absent the pin the wrap never runs and the real store is the sole source of truth. *Verify (agent-browser over served HTTP :8791, cleared `localStorage`, pixels LOOKED at, zero console/page errors):* (a) `?scene=idle&t=night&unlock=all` → The Automaton (4★/3 lines) drawn in the sky, `undercroftState()`='open' (hatch + crimson glow visible), a room rep ("The Bootstrap Bench") on its plinth; (b) 6 reloads cycled DISTINCT figures (Coilwright/Compositor/Automaton/Gardener — all ≥2★); (c) localStorage key set IDENTICAL with and without the pin (`ws:ann:bootstrap`, `ws:seen:the-gate` only — both written by the page's own normal boot, NOT the pin) → proves no write; (d) WITHOUT `?unlock` + cleared store → `undercroftState()`='none', `asterism.current()`=null (bare starfield, no hatch). Screenshots `/tmp/devpin-shots/{unlock-all-night,cold-start-night}.png`. forge `--check --all` = 97 current. See §dev-pins table.

**ASTERISM PREFER-FIGURES REFINEMENT — showcase a real constellation, never a lone dot under a grand label — ✅ SHIPPED (2026-06-23):**
an owner-reported reads-as-broken bug: some Survey "asterisms" are SINGLE-room feat-leads (The Surveyor=`['holonomy']`, The Pilot, The Reckoner, The Drover, The Sirenist, The Wagerer) that resolve to ONE lone star + a grand engraved label with NO connecting lines — it looked like a render failure, while the multi-room figures (Astronomer/Gardener/Scribe=2, Automaton/Furnace=4, Optician=5+) form proper line-connected figures. **Fix** (`asterism.js`, `pickEarned()` + `fitFigure()` ONLY — no other file/function touched): (1) `pickEarned()` now builds a `figures` pool from `unlocked` = those whose RESOLVED star count is ≥2 (counting only members present in `Sky.CATALOG`, so a 2-member asterism missing one catalog entry — which would resolve to a single star — is correctly excluded), and picks the random figure from `figures` when non-empty; it falls back to the full `unlocked` set (lone stars included) ONLY when the visitor has nothing but single-room feat-leads. So a visitor who has charted any real constellation ALWAYS sees a figure; a single-feat visitor still sees their lone star rather than bare sky. `?asterism=<id>` still honors ANY unlocked id (explicit dev choice, even a single-star one), and `?seed` reproducibility + the per-load `_cached` memo are UNCHANGED. (2) `fitFigure()` lone-star polish: a single resolved star now pins to local `(50, 56)` instead of the vertical-midpoint `~(50, 42)`, dropping it lower/closer to its label band (label prints ~y92) so it reads intentionally as "this star, named below" rather than a disconnected dot; multi-star affine fitting is byte-for-byte unchanged. *Smoke (agent-browser over served HTTP :8884, `?scene=idle&t=night`, store injected via `ws:seen:<room>`=Date.now() + reload, zero console errors throughout, pixels LOOKED at):* (a) The Automaton (context-window/temperature-dial/the-turn/partition) → 4 stars + 3 lines + "The Automaton" label, a real connected standing-figure well-placed in the slot; (b) The Astronomer (firmament/orrery) → 2 stars + 1 line + label; (c) PREFER — holonomy + the 4 Automaton rooms BOTH unlocked → 50/50 `_reset` re-picks AND 5/5 real reloads picked The Automaton, the lone Surveyor NEVER chosen; (d) FALLBACK — only holonomy → the lone star renders cleanly near its label, "The Surveyor", no gap; (e) cold (cleared store) → `current()`=null, no `#asterism` group, bare starfield. forge `--check --all` = 97 current.

**THE VERSE REP — the front gate's TENTH bespoke room-rep, a scriptorium lectern bearing an open illuminated manuscript, its top line still wet with gold — ✅ FORGED (2026-06-30, BUILD/foundry #391):**
the front-elevation of the `verse` room (The Study, district manor, glyph ✒️, accent `#cba15a`) — a room that stood live with NO prior bespoke rep, so this is a genuine `[rep]` backlog bloom. Forged via the foundry-prep + ART FOUNDRY engine (K takes → blind judges → a synth that took Take 1 as the unanimous winner and grafted only the judges' called-out fixes) and reviewed fresh-eyes by the publisher. `drawRepVerse` in `the-gate/scene.js` (+~322 L, a sibling between `drawRepArcade` and `drawGlyphStand` — MOUND aspect, low+wide) + its one `REP_DRAW['verse-rep']` dispatch line (~L1081) + its one `rooms.js` BESPOKE `verse` per-band palette entry; the diff is EXACTLY that one new scene.js function + the one dispatch line + the rooms.js entry + the forge-regenerated `the-gate.html`, every sibling `drawRep*` byte-identical. A squat, front-elevation SCRIPTORIUM LECTERN: a sloped writing DESK bearing an OPEN illuminated manuscript (two ruled pages, a gilt drop-cap block on the left, the topmost verse-line glowing gold as if just written) → an inkpot at the desk's edge with a near-upright feathered QUILL standing in it (the single tall accent, deliberately SHORT so it never verticalizes the mound) → a brass-edged pedestal COLUMN on a splayed foot with a base-moulding for architectural weight → a soft contact-shadow ellipse on the grass. Full estate idiom: warm-oak body (`rep.swatch1`), parchment (`rep.swatch2`, recolored per band), ~1.4px brass stroke + brass-bright top-lit edges, no gradient/tint. **The wet-gold VERSE-LINE is the hero**, driven through the palette-immune GLOW slots (`rep.glow1`/`rep.glow2`, already registered as fadeable GLOW roles in `colormap.js` — no colormap change needed) + `dayRecede`: at NIGHT the gold verse-line + gilt drop-cap BLAZE, with a low-opacity wide GOLD warmth-wash bleeding onto the page (selling the "wet ink" read); by DAY the emissive recedes to a quiet warm gleam on warm-cream parchment. A reduced-motion-gated glow-breath (SMIL `values 0.16;0.24;0.16` on the warmth-wash, synced to the verse-line halo) lives on the rep's own nodes and starts+ends at rest so `pauseAnimations()`/`?smil=0` freezes it lit; a unique `#verse-ink-glow` filter blooms the wash. Interface preserved: `drawRepVerse(parent, cx, baseY, pick)` signature unchanged. **PUBLISHER FRESH-EYES (served the repo root :8899 PID 24092, agent-browser session `pub391-verse`, both torn down by exact PID/name):** opened `?dev&room=verse` across idle-night / idle-day / open-night PLUS a daylight-STORM wash-out stress test + a dusk near-new-moon (`t=dusk&moon=0.05`) + a full-moon open scene (`scene=open&t=night&moon=1`). GREEN at every band — NIGHT: gold verse-line + gilt drop-cap blaze, warm spill on the page, reads instantly as an open book on a stand, "The Study" engraved below; DAY: emissive recedes to a quiet warm parchment gleam, warm-oak body holds against the bright sky, no wash-out; STORM-DAY: parchment stays legible under the darkened storm light, the lectern keeps its full low-wide silhouette + brass strokes through the rain; DUSK new-moon: a gentle gold gleam, still legible; OPEN-NIGHT: a quiet peripheral calling-card to the lower-left as the gates swing open to reveal the manor, not competing with the reveal. Correct MOUND silhouette bottom-aligned in the Study slot, the single short quill the only vertical accent. Honesty chip 15/15 ✓ in every shot; zero console errors; `forge --check --all` all 127 current (the `the-gate.html` artifact in sync), siblings byte-identical; the manor stays the dominant central mass (no regression). NO bug found, NO publisher edit needed — estate-quality and deliverable. Bloomed `✝ BLOOMED #391: The Study rep` (sown #364; repFuel 5→4, foundryFuel 5→4). Detail → [worklog/2026-06.md](../worklog/2026-06.md) #391.

**THE ARCADE REP — the front gate's NINTH bespoke room-rep, an upright coin-op cabinet with a magenta-glowing hero screen — ✅ FORGED (2026-06-30, BUILD/foundry #384, a SALVAGE finish):**
the front-elevation of the `arcade` room (The Arcade, glyph 🕹️), forged via the foundry-prep + ART FOUNDRY engine (K takes → blind judges → synth) and finished + reviewed fresh-eyes by the publisher in a salvage cycle (the build was already forged and left UNCOMMITTED in the working tree per the cycle handoff; a salvage finish is cadence-neutral and decays nothing). `drawRepArcade` in `the-gate/scene.js` (+~262 L, a sibling of `drawRepOrganPipes` — vertical aspect) + its one `REP_DRAW['arcade-rep']` dispatch line (~L1077) + its one `rooms.js` BESPOKE `arcade` per-band palette entry; the diff is EXACTLY those two scene.js hunks + the rooms.js entry + the forge-regenerated `the-gate.html`, every sibling `drawRep*` byte-identical (grep-confirmed — only `drawRepArcade` added). An upright coin-op CABINET: a canted MARQUEE crown carrying three magenta letter-ticks overhanging a recessed BEZEL → a center-pooled magenta-violet hero SCREEN with a hot bright core → a forward-angled CONTROL DECK with two stub joysticks (balls on posts) flanking a quiet 3-button cluster → a dark lower body with an inset panel → a tapered KICK-PLATE with a brass-bright top lip. Full estate brass idiom (dark/swatch body, ~1.4px brass stroke, top-lit up-facing edges, lit-from-above, a contact-shadow ellipse on the grass), so it joins the cavern / organ-pipes / cartographer family and stays a quiet SECONDARY calling-card behind the hero gate. **The SCREEN is the hero, driven magenta BY DESIGN** through the palette-immune `rep.glow1`/`rep.glow2` slots (`#cf7bff` / `#e9b8ff`) + `dayRecede` — NOT the fixed estate GLOW role `arcade.screen` (= teal `#37f7e0`, the now-unused glyph-stand fallback pip); this is intentional per SPEC §5.8 (a rep brings its own colors via the slots) and was flagged in the handoff so no future smith/judge "corrects" it back to teal. The glow BLAZES with a hot core at night, pools to a tighter bright spot by day, and brightens again as the ambient dims under storm — never a flat tinted rectangle. Grafted MOTION lives on the rep's own nodes: a 5.2s `arcade-bloom` opacity breathe (`values 1;0.82;1`) on the pooled glow ellipses + a readable ~6.5s CRT refresh SWEEP band (height ≈ scrH·0.18, peak opacity ~0.22), self-contained SMIL, lit-correct every frame, values START at full so `pauseAnimations()` freezes it lit under `prefers-reduced-motion`/`?smil=0`. Interface preserved: `drawRepArcade` signature unchanged, `S.refs.arcadeRep` published. **PUBLISHER FRESH-EYES (served the repo root :8791 PID 69395, agent-browser session `arcade-rep-rev`, both torn down by exact PID/name):** opened `?dev&room=arcade` across idle-night / idle-day / open-night PLUS a storm-day wash-out stress test + two frozen SMIL phases (`smil=0` vs `smil=3.2`, cabinet cropped 3× via `sips`). GREEN at every band — NIGHT: hot magenta core, reads instantly as an arcade machine, "The Arcade" engraved below; DAY: glow recedes to a tighter contained bright pool (still clearly ON, no wash-out), brass body holds against the bright sky; OPEN-NIGHT: a quiet peripheral calling-card behind the swung-open gates, not competing with the manor reveal; STORM-DAY: the screen pools brighter as the ambient dims, the cabinet keeps its full silhouette + brass strokes through the rain. MOTION verified — the bloom breathes and the CRT sweep band shifts vertically between the two frozen frames, subtle + lit-correct, both holding a fully legible lit face. A live `eval` confirmed 4 arcade DOM nodes incl. the `arcade-bloom` motion group; honesty chip 15/15 ✓ in every shot; zero console errors; `node --check` clean on `scene.js` + `rooms.js`; `forge --check --all` all 124 current (the `the-gate.html` artifact in sync), siblings byte-identical. VERTICAL aspect, bottom-aligned in the Arcade slot; quiet/secondary beside the Cairn/Cavern exemplars. NO bug found, NO publisher edit needed — estate-quality and deliverable. Bloomed `✝ BLOOMED #384: The Arcade rep` (sown #364; repFuel 6→5, foundryFuel 6→5). Detail → [worklog/2026-06.md](../worklog/2026-06.md) #384.

**THE CARTOGRAPHER REP — the front gate's EIGHTH bespoke room-rep, an open folio atlas on a slanted reading-stand — ✅ FORGED (2026-06-30, BUILD/foundry #377):**
the front-elevation of the `cartographer` room (The Map Room), forged via the ART FOUNDRY engine (K=3 takes → blind judges → synth) and reviewed fresh-eyes by the publisher. `drawRepCartographer` in `the-gate/scene.js` (+~340 L, a sibling of `drawRepRipple`) + its one `REP_DRAW['cartographer-rep']` dispatch line + its one `rooms.js` BESPOKE entry (the per-band parchment/highlight/glow palette). An OPEN folio ATLAS laid on a low oak trestle reading-stand: two pages tent up from a centre GUTTER VALLEY (the spread bowing outward at the edges, dipping at the spine) with a visible LEAF-STACK page thickness at the front edge, on short brass-edged splayed trestle legs + a stretcher rail with a soft contact shadow (it sits ON the grass). The LEFT page carries a nested-coastline topo landmass (3 concentric wobbled contours) + a faint 2×2 graticule (contours dominant, the grid a quiet hint); the SINGLE emissive accent is a brass COMPASS-ROSE lying FLAT on the near-right page — foreshortened via `scale(1, 0.46)` so it reads as engraved ON the parchment, NOT a standing disk: graduated bezel ring + 36 fine ticks (longer on the quadrants) + 4 long cardinal / 4 short intercardinal engraved kite-facets (dark brass-outlined body + bright-gold lit upper-left flank, lit from above) + a hot white-gold hub + a tiny N-fleur. Full brass idiom (dark body `rgba(11,14,22,.85)` + `--brass-stroke/bright-ref` top-lit edges, no gradient, no tint). Pages recolor warm-vellum→tea-brown and dim with B via `rep.swatch1/2`; the rose routes through `rep.glow1` so the glow POOL blazes warm-gold at night and recedes to a quiet engraved-brass mark by day (`dayRecede`). A quiet breathing pulse (SMIL `values 1;0.80;1`, 5.5s spline) lives on the GLOW POOL ONLY — no spin, no page flutter — and starts+ends at full-bright so `pauseAnimations()` freezes it lit under `prefers-reduced-motion`/`?smil=0`; `S.refs.cartographerRose` published as the Phase-D handle. WIDE+SHORT (horizontal aspect — only the ripple tank shares it among the live reps), bottom-aligned in the bottom-left Map Room slot, quiet/secondary beside the Cairn/Ripple exemplars. **PUBLISHER FRESH-EYES (served :8791 PID 80635, agent-browser session `cartog-review-377`, both torn down by PID/name):** opened `?dev&room=cartographer` across idle-night / idle-day / open-night plus storm (B=0.30) + dusk + a zoomed-craft crop of the rep against a dark field; the day-vs-night full-scene rep crop confirms the band behavior is correct — DAY: bright warm-vellum pages, rose receded to a quiet engraved brass ring (no glow pool); NIGHT: tea-brown pages, rose blazing a warm-gold feathered pool. The atlas reads unmistakably as an open book on a reading-stand (tented spread + gutter valley + leaf-stack thickness, the decisive OPEN-BOOK bar), the rose unmistakably flat ON the page. Exactly one `#cartographer-rep` instance, one `animate`, label "The Map Room", zero JS errors, honesty chip 15/15 ✓, `forge --check --all` all 120 current, siblings byte-identical. NO bug found, NO publisher edit needed — estate-quality. Bloomed `✝ BLOOMED #377: The Map Room rep` (sown #364). Detail → [worklog/2026-06.md](../worklog/2026-06.md) #377.

**UNDERCROFT PREDICATE FIX — read the real reveal keys (opening→closed, rune||undercroft→open) — ✅ FIXED (2026-06-23):**
a reported bug: the owner's real published store has ONLY `ws:seen:undercroft-opening` (the opening was witnessed —
DISCOVERED but not yet unsealed) and the gate drew NO hatch at all. Root cause: `undercroftState()` (`scene.js`) read the
WRONG keys — it mapped `ws:seen:undercroft-rune`→closed (backwards) and IGNORED `ws:seen:undercroft-opening` entirely, so
an opening-only store fell through to `'none'`. **Fix** (`scene.js`, `undercroftState()` only): re-point the predicate to
mirror `revealUndercroft()` in `index.src.html` (~line 4194) — `runeFound = ws:seen:undercroft-rune || ws:seen:undercroft`
→ `'open'` (UNSEALED/navigable; wins), else `openingSeen = ws:seen:undercroft-opening` → `'closed'` (DISCOVERED but
sealed — the beat reached BEFORE runeFound), else `'none'`. Dev override (`S._devUndercroft`) + the `WS`/`store.ok` guards
left UNCHANGED; `drawUndercroftHatch` UNTOUCHED (its closed-doors + open-doors drawing was already correct). Doc-comment
above the function + SPEC §9 corrected to state the real mapping. *Smoke (agent-browser over served HTTP, never file://,
`?scene=idle`, zero console errors throughout):* (1) cleared store → `undercroftState()`='none', no hatch drawn; (2) set
ONLY `ws:seen:undercroft-opening` (the OWNER'S EXACT CASE) → 'closed', hatch renders with DOORS SHUT — brass-framed bilco
leaves meeting at a centre seam, iron hasp/padlock, NO crimson glow (looked at the pixels); (3) + `ws:seen:undercroft-rune`
→ 'open', both leaves flung back with the crimson depth-glow seeping up; (4) `?undercroft=closed`→closed, `?undercroft=1`
→open; (5) zero genuine console errors (only the 15/15 honesty self-test logs). forge `--check --all` = 97 current.

**EARNED-STATE PASS — random unlocked asterism + random roomref + undercroft closed-doors + weather drift — ✅ SHIPPED (2026-06-23):**
four disjoint earned-state features, integrated together and smoke-verified over served HTTP (agent-browser, never
file://), zero console errors across every path:

  • **Earned asterism** (`asterism.js`): `AST.current()` now reads the visitor's UNLOCKED Survey via
    `Sky.state(Sky.visitedFromStore(WS.store()), …)`, filters to COMPLETE asterisms, and picks ONE at random per
    visit (memoized in `_cached` so the boot's repeated calls agree), affine-fitting its member stars from the
    1440×900 catalog into the local 0..100 slot box (uniform scale, centered, y-band clears the label). Cold-start
    (nothing unlocked) or Sky/WS absent → `null` → bare starfield, **no invented eagle**. Dev pins (local
    `location.search`): `?asterism=<id>` pins an unlocked wing/feat (falls through if not unlocked), `?seed=<n>`
    makes the pick reproducible. Placeholder retained only as `AST.PLACEHOLDER`. *Smoke:* clean store → bare stars
    no figure; inject `ws:seen:firmament`+`ws:seen:orrery` → "The Astronomer" renders upper-left (real catalog
    figure, verified against `Sky.WINGS`/`Sky.FEATS` names).

  • **Random roomref** (`rooms.js`): `R.pick()` reworked from a daily-deterministic bespoke-only feature to a
    PER-VISIT RANDOM pick over the FULL pool = every unlocked slab room ∪ the synthetic Cairn fixture
    (sentinel `' cairn-fixture'`). The per-load draw `_roll` is frozen at module-eval and the resolved pick
    memoized in `_cachedRandom`, so the two `pick()` calls a load makes (boot repColors merge + scene draw) agree.
    `?room=<id>` still pins a slab room exactly (bespoke → rep+repColors, others → Glyph Stand); `?seed=<n>` makes
    the random pick reproducible. *Smoke:* 8 seeds → 8 different rooms; seed=43 → Cairn fixture (both calls agree);
    `?room=ripple` → Ripple-Tank rep with matching cyan repColors; `?room=verse` → Glyph Stand.

  • **Undercroft 3rd state** (`scene.js`, `sequence.js`, `the-gate.src.html`): the front door now surfaces the
    intermediate beat between "undiscovered" and "unsealed". New `undercroftState()` → `'none'|'closed'|'open'`
    (dev override first, then store keys in priority — mirroring `revealUndercroft()`: `ws:seen:undercroft-rune` ||
    `ws:seen:undercroft` → open, else `ws:seen:undercroft-opening` → closed, else none). [Predicate corrected
    2026-06-23 — see the dated entry below; this line reflects the fix.] `undercroftOpen()` kept (returns
    `state==='open'`). `drawUndercroftHatch` draws the
    SAME curb/footprint for open+closed (identical cx=1300, yNear=742/yFar=678); closed adds two shut plank leaves
    meeting at a centre seam with an iron hasp/padlock latch and NO crimson glow ("there but sealed").
    `?undercroft=closed` (or `=2`) forces closed, `=1` forces open (tri-state in `parseUrl`). *Smoke:* all three
    states render correctly in the exact same spot.

  • **Weather drift** (`weather.js`): when NO `?wx=` pin is active AND reduced-motion is false, a ~1 s
    `setInterval` `driftStep()` shifts (~4% per tick) to a random DIFFERENT state via the module's own `W.set()`,
    so the boot's existing `onChange` (recolor + weather-fx + audio + wind) runs for free. `?seed=<n>` seeds the
    drift PRNG for reproducibility. New API: `startDrift()`/`stopDrift()`/`isDrifting()`; `init()` calls
    `stopDrift()` first so re-init never stacks timers. *Smoke:* unpinned → `isDrifting()` true (observed an
    organic clear→storm drift); a forced `set('storm')` ran the full recolor+rain pipeline; `?wx=` pin and
    reduced-motion both suppress (`isDrifting()` false). forge `--check --all` = 97 current.

**OUTRO PACING — ✅ SHIPPED (2026-06-23, owner feedback):** the welcome/outro card auto-hold tripled
`3000 → 10000 ms` (a fast reader couldn't finish it at 3 s), and it is now SKIPPABLE — a click on the
card OR Enter/Space/Escape continues to `../index.html` immediately (the `showWelcome` setTimeout is
paired with one-shot click + keydown handlers that clear it; fires exactly once via a `left` guard). A
pulsing **"ENTER THE ESTATE →"** cue (`#welcome .cta`) invites the click. The same readable hold now also
applies to the reduced-motion collapse path (was 900 ms). VERIFIED over served HTTP: forged
`T_WELCOME = 10000`; at ~7.8 s into the open the card is still up showing the cue, and a click navigates
to `/index.html`. forge `--check --all` = 97 current.

**ENTRY SPLASH RE-SOULED — the founding myth — ✅ SHIPPED (2026-06-23, owner request):** the production
title card no longer shows the estate NAME — it opens on the FOUNDING MYTH so the visitor meets the words
before the place. A near-black card reads itself in beat-by-beat (CSS `splash-rise` stagger: lead → words
→ attribution → "click to begin"): the lead *"The legend speaks of three words of permission —"*, then the
canonical three words **"build whatever you want; have fun"** in the brass wordmark, attributed **to the
Patron, the unseen founder** (canon: `tabularium/index.html` MYTH + ROADMAP — the Patron SPOKE the three
words; "The Hand That Guides" is the separate gauge, NOT the speaker). The estate NAME is first met at the
GATE reveal. The **mute chip** now floats at `z-index:70` (above the `z-index:60` splash), pinned
bottom-right in its gate position, so sound can be set from the title card. The **outro / welcome card**
closes the bookend: below the estate title, the old "keeps its mysteries" tagline is replaced by a line
referencing **the Hand That Guides** — *"Built under a Hand the makers feel but never see — it guides; it
does not dictate."* (intro = the Patron's words; outro = the Hand — both unseen, both a semicolon
aphorism). Dev/`?scene=` still removes the splash immediately (harness untouched). VERIFIED over served
HTTP (agent-browser, never file://): production splash shows the three words + NO estate name, mute chip
at (18,18) `z70` visible over the card, dev splash absent (phase idle); forge `--check --all` = 97 current.

**AUDIO PASS 4 — make the thunder audible (LEVEL fix) + balance the full mix — ✅ SHIPPED (2026-06-23):**
the per-strike thunder fired correctly (lightning → `onFlash` → `A.thunder()`) but was inaudible in a live
storm — the diagnosis was **energetic masking, not a wiring fault**: the clap's peak was bright but its
loudness never rose above the rain wash it tried to break (BEFORE: clap-window RMS only **+0.3 dB** over the
rain bed; the rolling tail sat **−1.45 dB BELOW** the bed; a faithful layered-storm render found 0 onsets and
a uniform bright rain field with no clap event). The fix keeps the wiring untouched and works the LEVELS:

  • **Sidechain duck** (`audio.js` `duckBed()` / `duckOne()`, called first in `A.thunder()`): rain `0.78 → 0.30`,
    wind `0.70 → 0.34` (attack 30 ms, hold 0.70 s, release 1.7 s) so the strike punches a hole in the rain the
    way real thunder does, then the bed eases back over the rolling tail.
  • **Boosted close-roll body** (`audio-thunderroll.js`): the `"close"` peak `0.78 → 2.05` (distant ambient roll
    unchanged at ≈0.28) so the deep <170 Hz rumble carries the strike's body after the cascaded lowpass.
  • **Raised event buses**: clap `0.95`, roll `0.95`; bed bases trimmed (rain `0.85 → 0.78`) to give the strike room.

  AFTER (faithful offline layered-storm render @22050 mono, one strike at t=4 s through the exact live gains):
  clap **PEAK +14.3 dB** over the pre-strike bed RMS (target ≥12); clap RMS **+3.3 dB** (was +0.3); clap PEAK
  **+8.6 dB** over the DUCKED bed it actually plays over; roll-tail RMS **+2.8 dB** over the ducked bed (was −1.45
  below); bed recovers to −17.31 dBFS by 6.5–7.8 s (pre-strike −17.22), ~1.6 s after release; summed peak < 0 dBFS,
  no clip. Close-roll solo: peak −10.83 → −2.79 dBFS, RMS −29.75 → −21.91. Spectrogram corroborates: a dark
  vertical NOTCH (the duck) with a bright clap and a sustained low band (the roll body), rain visibly dimmed during
  recovery. audio-lens self-test 12/12. **LIVE STORM SMOKE** (forged `the-gate.html` over served HTTP, splash
  clicked to unlock — `__wsAudioCtx` `running`; night storm): `A.thunder()` wrapped + counted → fired **10×** within
  ~20 s, `AudioBufferSourceNode.start` climbing into the thousands, **zero console errors** throughout. Builder
  signatures + the lightning→onFlash→thunder wiring untouched; only synthesis/levels/duck params changed.

**AUDIO PASS 3 — ✅ SHIPPED (2026-06-23):** the open-sequence gears + creak reworked from playtest
feedback (they read too light/thin — the gears as bug-like clicks, the creak as a rodent squeak); the
synthesis was replaced in place, builder signatures + wiring unchanged (still `A.gears()` in the gears
phase, `A.creak()` in the swing phase). (1) **gears** (`audio-gears.js`) → HEAVY clockwork: a continuous
low GRIND BED (lowpassed brown noise + a 58 Hz saw, tooth-rhythm tremolo), deliberate heavy RATCHET
impacts at 5/sec (lowpassed 320–540 Hz noise thud + an 80–160 Hz resonant "tonk", no bright tick), and a
low grindy WHIR (two detuned 52 Hz saws through a resonant lowpass). audio-lens vs the old baseline:
centroid 360→111 Hz (bassier), meanRms −28.3→−14.2 dBFS (louder), clips:false (−2.03 dBFS headroom). (2)
**creak** (`audio-creak.js`) → a low iron-hinge GROAN, not a squeak: the swept high-Q bandpass dropped
from ~380–1180 Hz to ~120–440 Hz, slow (1.1 s / 0.95 s) gestures, widened/roughened stick-slip bursts so
it lurches like a loaded hinge, a heavier 58/68 Hz iron-wood thunk, and a faint sustained triangle groan
tone under each gesture. audio-lens: clips:false @ −15.5 dBFS, f0 225 Hz / centroid 270 Hz, silenceRatio
0.263 (not empty). Both deterministic (seeded mulberry32, no Math.random), verified offline via
OfflineAudioContext→audio-lens (self-test 12/12), NO binary assets. **SMOKE VERIFIED** over served HTTP
(127.0.0.1, never file://) against the forged `the-gate.html`: the splash/gate click unlocks audio
(`__wsAudioCtx` → `running`) and runs the FULL open sequence (gears + creak fire) with ZERO console
errors; both builders present on `Gate.sfx`. forge `--check --all` = 97 current.

**AUDIO PASS 2 — ✅ SHIPPED (2026-06-23):** punchier thunder, a time-of-day creature rotation, and a
production title-splash entry. (1) **thunderclap** reworked into a two-part "CR-AACK": a delayed
broadband CRACK (t0+0.07s, with a silent lead-in frame so the onset detector registers it), a louder
lowpassed SLAP with a downward cutoff sweep + a layered leading-edge click, a 74→40 Hz SUB thump for
chest weight, and a 4-line FDN + 2 Schroeder-allpass reverb TAIL that rises only after the slap
(audio-lens: clips:false @ -2.06 dBFS, two onsets 116 ms apart, centroid 1371 Hz, tail confirmed).
(2) **Creature rotation** in `A.ambient` — exactly ONE creature per time-of-day band, silent in storm:
`day`→**birdsong** (BROADENED from clear-only to any non-storm), `dusk`→**crickets** (new stationary
trill texture, centroid 4747 Hz, quiet -25 dBFS), `night`→**owl** (new sparse hoot phrase, f0 375 Hz).
A band change cross-fades creatures (the band's `onChange` already re-calls `A.ambient()`); windchimes
unchanged (occasional, clear/cloudy, any band, silent in storm). New forge includes `audio-crickets.js`
+ `audio-owl.js` before `audio.js`. (3) **Title splash** (`#splash`) — a full-bleed brass-wordmark
"THE ORRERY ESTATE" cover shown ONLY in production (dev/`?scene=` removes it immediately so the harness
is untouched); click OR Enter/Space arms audio (the first-gesture unlock) + fades out (instant under
reduced-motion) to reveal the dwellable idle scene; respects the persisted mute flag. (4) The gate
**plaque** action line changed `CLICK TO ENTER`→`CLICK TO OPEN` (the splash now says "enter"; the gate
instructs "open"). **E2E VERIFIED** headless over HTTP against the forged `the-gate.html` (never
file://): PROD shows the splash, click dismisses it + unlocks audio (`__wsAudioCtx` running, master
0.9), Enter also activates it; idle revealed, plaque reads "CLICK TO OPEN", gate click runs the open →
navigates to index.html; DEV (`?dev&scene=idle`) shows NO splash, lands straight in idle; creature
rotation confirmed (birdsong@day clear AND cloudy, crickets@dusk, owl@night, NONE in storm, windchimes
silent in storm); mute toggles master 0.9↔0; ZERO console errors across splash dismiss, all band +
weather changes, a forced lightning strike, the full open sequence, and the mute toggle. forge
`--check --all` = 97 current; audio-lens self-test 12/12.

**AUDIO — ✅ SHIPPED (2026-06-23):** the Gate now has a voice. The conductor `audio.js`
(`Gate.audio`) is filled in (was stubbed) and nine seeded procedural-WebAudio builders ship as
`audio-<name>.js` (`Gate.sfx.rain/wind/thunderclap/thunderroll/gears/creak/windchimes/birdsong/
logotune`), each forge-included BEFORE `audio.js` in `the-gate.src.html`. NO binary assets — every
sound is synthesized; each builder is dual-use (live `AudioContext` or `OfflineAudioContext`) with a
mulberry32 PRNG, verified offline by audio-lens (self-test 12/12). The mute chip forces a single
master `GainNode` to 0 (hard gate, nothing bypasses). `A.unlock()` on the first gate click creates/
resumes the ctx, publishes `window.__wsAudioCtx`, and starts the ambient bed. Wiring (see SPEC §5.11):
first click→unlock; weather/band change→`A.ambient()` cross-fade; gears phase→`A.gears`/`A.stopGears`;
swing→`A.creak`; welcome→`A.logoTune`; navigate→`A.stopAll`; lightning flash rising edge
(`setFlash(true)` in the boot)→`A.thunder` (clap + close roll). Ambient = rain(storm,intensity) +
wind(clear<cloudy<storm) + occasional windchimes(not-raining) + distant thunderroll(storm) +
birdsong(clear & DAYTIME only). E2E VERIFIED headless over HTTP against the forged `the-gate.html`
(never file://): after the gate click `window.__wsAudioCtx` exists and the audio beats fire in order
`unlock→gears→stopGears→creak→logoTune` with the full sequence reaching navigate; thunder fires once
on the forced-flash rising edge; master gain reads 0.9 unmuted and the mute-ramp renders to 0 through
the master (OfflineAudioContext proof: unmuted peak 0.9 / muted peak 0); ZERO console errors across
the whole open sequence and all triggers. forge `--check --all` = 97 current. (Headless note: a
synthetic click is not a trusted gesture, so the live ctx reports `suspended` and its scheduled ramps
don't advance — an environment artifact, not a code issue; the gate math is proven offline.)

**MOON-PHASE WIRING — ✅ SHIPPED (2026-06-23):** `sky-core.mjs` is now forge-included into
`the-gate.src.html` (placed after `scene.js`, before `weather-fx.js`); after the forge strips
the `export` keywords its fns are page globals. The boot computes the user's REAL phase from the
wall clock — `var ph = moonPhase(julianDate(new Date())); var term = terminator(ph.illuminatedFraction,
ph.waxing);` — and calls `S.setMoonPhase({illuminatedFraction: ph.illuminatedFraction, litSide:
term.litSide})` BEFORE `S.build()`'s first `refreshSkyObjects()` (the first refresh is inside
`S.build`, scene.js:121), so the drawn moon matches today's date. `?moon=<0..1>` still OVERRIDES:
when present it pins the fraction, re-derives litSide via `terminator(moon, ph.waxing)`, AND drives
the brightness `moonK` — an explicit `?moon` ALWAYS wins over the clock value. FORGE FIX (root cause):
`stripModuleGuard` now also drops a bare `export default <expr>;` line (illegal/dead in an inlined
classic `<script>`) — sky-core's `export default GateSkyCore;` was the one line forge couldn't strip,
which would have been a syntax error that killed the inlined block. This also removed a dead
`export default <Core>;` from 3 sibling pages' `type="module"` inlines (einstein-ring / equal-area-sweep
/ two-bulges — functionally inert, the binding was already defined; regenerated for forge-freshness).
VERIFIED headless over HTTP against the forged `the-gate.html`: no-param → today's waxing gibbous
(~0.69 lit, right limb, curved terminator); `?moon=0` → new (dark disc + dim scene); `?moon=0.5` →
straight-terminator half (right lit); `?moon=1` → full disc + brightest scene. forge `--check --all` =
97 current; sky-core Node test 14/14.


**Status:** Phase A blockout LOCKED. Phase B `SPEC.md` **LOCKED + committed**
(`823f9f3` base + `1b3f9f4` room-rep custom-color slots `rep.swatch1..3`/`rep.glow1..2`,
Brandon's request via the spec agent). Phase C **FOUNDRY RUNNING**: Wave 1 PILOT launched.

**RENDER HARNESS (built + proven this session — reuse for every wave):**
- `/tmp/gate-render.sh <url> <out.png>` — one-off headless-Chrome shot (virtual-time-budget
  4500, own throwaway profile → parallel-safe, no agent-browser contention).
- `/tmp/gate-foundry/render-take.sh <scratch> <module_relpath> <candidate|-> <port> <outdir>`
  — copies the-gate/+tools/ from `GATE_SRC` (default /tmp/gate-worktree) → swaps the candidate
  module in → forges → serves on <port> → shoots idle-night/idle-day/open-night → tears down.
  gtimeout-guarded (gtimeout at /opt/homebrew/bin). USE THIS to render any take/final.
- ⚠️ NEVER `pkill` an http.server while a chrome shot is mid-load — the shot hangs (no implicit
  timeout). Let the helper own its server lifecycle, or use gtimeout.
- ⚠️ Use `/Applications/Google Chrome.app` `--headless=new`; clean up orphaned agent-browser
  "Chrome for Testing" procs if the machine gets loaded (they're from prior screenshot work).

**THE FOUNDRY ENGINE (reusable — drives every remaining wave):**
`/tmp/gate-foundry/foundry.workflow.js` is GENERIC + args-driven. Invoke:
`Workflow({scriptPath:'/tmp/gate-foundry/foundry.workflow.js', args:['<assetKey>',...]})`.
It builds each asset key in `args` SEQUENTIALLY (shared-file-safe): K takes (self-render +
iterate) → judges → synth writes the asset's draw fn into the LIVE worktree + forges + renders
deliverables to `/tmp/gate-shots/foundry/<key>/{idle-night,idle-day,open-night}.png`, LEFT DIRTY.
Asset library `LIB` inside the script holds geometry+brief+K+module+drawFn per asset (currently
manor/observatory/greenhouse; ADD more entries from SPEC §4 for later waves). Each take edits ONLY
its target draw fn (siblings byte-identical) → synth can use the winner's whole file, no merge.
PER-WAVE PROTOCOL (Keystone): launch → on completion VIEW each asset's 3 deliverable PNGs + verify
(node --check, interface grep, `forge --check --all` = 97 current, `git status` = only expected
files) → pass: SendUserFile + `git add the-gate/ && git commit` → fail: `git checkout -- the-gate/`
+ STOP + post. Brandon authorized continuing through the set unattended once the PILOT passed.

**WAVE 1 PILOT — ✅ SHIPPED** (`c7d1f76`): hero brass gate + gears. K=4; judges unanimously chose
Take 1 'The Wrought Crown' (8/8.5); grafted Take 3's self-lit SUN-GEAR (orrery payoff), gear-train
nudge, pier lantern-wash. Estate-quality confirmed; deliverables in `/tmp/gate-shots/foundry/gate/`.

**WAVE 2 — ✅ SHIPPED** (`c857578`): manor (grand Palladian pavilion, dominates) + observatory
(ribbed dome + telescope-from-slit on a grassy rise). Deliverables `/tmp/gate-foundry/{manor,observatory}/final/`.
⚠️ Workflow `args` may arrive as a JSON-STRING — the script now JSON.parses/​splits a string arg
(don't "fix" it back to assuming an array). A 5ms/0-agent return = args didn't resolve to keys.

**WAVE 3a — ✅ SHIPPED** (`eee92b0`): greenhouse (dimensional 3/4 jewel-box glasshouse; loved
silhouette kept byte-faithful). Deliverables `/tmp/gate-foundry/greenhouse/final/`.

**WAVE 3b — ✅ SHIPPED** (`780af5e`): foliage (lush layered trees+bushes, top-lit crowns, not
lollipops) + undercroft (open bilco door over a descending stone STAIR into a blood-wine crimson
throat, near lip black — unanimous judge pick). Deliverables `/tmp/gate-foundry/{foliage,undercroft}/final/`.

**REORDER DECISION (Keystone's call):** doing the GROUNDS before the room-reps. The grounds (grass/
road/apron) are visible in EVERY shot and were flat greybox; the buildings are now richly detailed,
so flat grounds read as unfinished. Room-reps only appear when a room is SELECTED (a Phase-D feature),
so they're completeness, not the default view — done after grounds + the parametric pass.

**WAVE 4 — ✅ SHIPPED** (`eb73939`): grounds (textured lawn + gravel drive + flagstone apron + brass
road lamps; grass stays full opaque occlusion plane) + mist. **The full DEFAULT visible scene is now
complete + estate-quality.** Deliverables `/tmp/gate-foundry/{grounds,mist}/final/`.

**DECISION (Keystone):** SKIPPING a moon/sun beauty pass — they're already estate-quality (regression
risk > gain); asterism stays the earned PLACEHOLDER (do NOT build the eagle). sky/stars fine as-is.

**ROOM-REPS WAVE — IN PROGRESS (the last foundry chunk):** two prereqs running in parallel:
1. PLUMBING agent (id **`a4814c10caf146b3f`**, background): wires colormap.js rep.swatch1..3/rep.glow1..2
   + CM.applyRepColors merge + dayRecede, rooms.js BESPOKE/pick(id)+repColors, scene.js
   S.setDevRoom+drawRoomRep dispatch + a GREYBOX drawGlyphStand, sequence.js ?room=<id>, boot merge.
   It MAY touch those load-bearing files (infra step); leaves worktree dirty. ON DONE: verify Cairn
   default UNCHANGED + ?room=<id> shows the Glyph Stand placeholder, then commit.
2. SURVEY workflow (runId **`wf_729c3bc9-bae`**): 4 blind surveyors (distinct lenses, NO primed
   answer) + tally → a recommended 3-rep slate (covering vertical/horizontal/mound aspects). The
   FINAL pick of 3 is MINE. Pool stashed at /tmp/gate-foundry/room-pool.json (74 rooms).
NEXT after both: add the 3 chosen reps to the foundry LIB (iface 'scene', with repColors) + elevate
the Glyph Stand to estate-quality → one foundry wave (K=3 reps). Render/test via ?room=<id>. Then the
foundry "whole set" is DONE.

**SURVEY DONE (wf_729c3bc9-bae) + KEYSTONE'S FINAL 3-REP CALL:** The blind survey picked gnomon/sundial
+ firmament/observatory + cavern — but surveyors were BLIND to the existing scene, so 2 picks DUPLICATE
elements already built (the gate has a brass sundial; the hero observatory is on the left hill). I
OVERRODE those. FINAL 3 bespoke reps (aspect-covering, theme-spread, color-spread, NO duplication):
  1. `physics-lab` (The Cavern) — MOUND — rocky outcrop + glowing arched cave mouth. accent #7fd4c0.
     repColors: dark cool ROCK via rep.swatch1 (DAY #6e7680/DUSK #6a6470/NIGHT #3a4048) + EMISSIVE teal
     cave glow via rep.glow1 #7fd4c0.
  2. `ripple` (The Ripple Tank) — HORIZONTAL — wide shallow water tray, concentric ripple rings. accent
     #54d6d0. repColors: WATER via rep.swatch1 (DAY #4fb8c8/DUSK #3f8a9a/NIGHT #2a5560) + faint caustic
     shimmer rep.glow1 #7fe0e8; tray frame = estate brass roles.
  3. `sound-garden` (The Music Room) — VERTICAL — rank of graduated brass ORGAN PIPES on a console.
     accent #cf7bff. repColors: pipes = estate brass roles; VIOLET music accent via rep.glow1 #cf7bff
     (a console pip/soft glow); console body via rep.swatch1 (warm dark wood DAY #6a5640/DUSK #5a4632/NIGHT #2e261c).
The Cairn stays the 4th rep. Re-evaluate K after these first 4 (Brandon). RUNNERS-UP for a later 5th:
the-top (gyroscope), transit, museum (per survey).
⚠️ render-take.sh now takes an optional 6th arg = extra query (e.g. "room=physics-lab") so rep takes
render their pinned room. PRE-WIRE rooms.js BESPOKE (ids→rep-key+repColors per band) + drawRoomRep
dispatch BEFORE the rep foundry; then each rep take ADDS its draw fn + one dispatch line (siblings
byte-identical). Read the plumbing agent's actual drawRoomRep dispatch + drawGlyphStand signature FIRST.

**PLUMBING ✅** (`ed22592`, Sela Quillwright): rep-color slots + CM.applyRepColors merge + ?room= +
drawGlyphStand + REP_DRAW dispatch (`var REP_DRAW={cairn,cavern-mound,ripple-tank}`, fallback
drawGlyphStand(parent,cx,baseY,pick)). **BESPOKE PRE-WIRED ✅** (`616a9c2`): all 3 reps registered
(rep-keys cavern-mound/ripple-tank/organ-pipes + per-band repColors).

**REP FOUNDRY ✅ 3 of 4 SHIPPED** (`c6dc681`, wave wf_8e9b2c6c-e42): Glyph Stand (elevated — arched
brass cartouche plinth, universal fallback), Cavern rep (rocky mound + teal cave glow, physics-lab),
Ripple Tank rep (water tray + ripples, ripple). Each via rep.swatch*/rep.glow* slots + a REP_DRAW entry.

**ORGAN-PIPES (sound-garden) — ✅ SHIPPED** (`c969f0b`, wave wf_235cd455-bd1): the Music Room rep — a
tallest-center cathedral of 7 graduated brass tubes (open bored mouths + flue mouths), fanned conical
feet, a keyboard manual across the carved-wood console, and a lit VIOLET stop-knob (rep.glow1) that
blazes at night + recedes by day. Synth grafted Take 1's iconic silhouette + Take 3's recognizability
cues (open mouths, keydesk). Confined to drawRepOrganPipes + one REP_DRAW line; forge 97.

**RIPPLE TANK — now ANIMATED** (`bc0618b`): the rings EMANATE (ambient SMIL wavefront — born → scale
outward → fade at the rim, staggered for one continuous front; breathing drop-pip; clipped to the water
plane; non-scaling-stroke keeps crests delicate). Added a reusable dev pin **`?smil=<seconds>`** (pauses
+ seeks the SVG animation clock) so animated assets can be rendered/judged across their loop — headless
`--virtual-time-budget` does NOT advance SMIL; `setCurrentTime` does.

**SPEC AMENDMENT — animation is now first-class** (`1928d8f`): §2.5.5 allows + ENCOURAGES ambient
animation where it fits the room (self-contained SMIL, quiet/secondary, lit-correct every frame,
seamless, reduced-motion-safe). Folded into the §8 judging bar + documented `?room=`/`?smil=` in §7.
The foundry smith/judge/synth prompts were updated to match (smiths may animate + render smil phases;
judges view the motion frames + reward fitting motion, penalize gratuitous motion). The foundry harness
is ARCHIVED to `gate-foundry/` (`1727525`) for durability — outside the-gate/, forge still 97 files.

**═══ FOUNDRY COMPLETE: the full DEFAULT VISIBLE SCENE + the room-rep system + ALL 4 reps (Cairn, Cavern,
Ripple [animated], Music Room) are shipped + estate-quality. The asset foundry "whole set" is 100% DONE. ═══**
NEXT — see `the-gate/KNOWN-ISSUES.md` (the lightweight bug log; formal QA = a dogfood pass in Phase D).
  • **P1 — scene clips on tall/narrow viewports — ✅ FIXED (`<this commit>`, 2026-06-23).** Switched the
    scene SVG to `preserveAspectRatio:'xMidYMid meet'` (contain) so it NEVER clips off-screen. The
    letterbox bars are made SEAMLESS by `S.fitStageBackdrop()` (scene.js): it paints #stage with a
    backdrop that extends the scene's own sky/ground past the scene rect — solid sky.top above, the sky
    gradient down to the grass line, solid grass below — anchored to the actual letterbox rect (recomputed
    on resize), colors = band-resolved var() refs so recolor reflows them. Verified at 1:2 portrait,
    2.67:1 ultrawide, and 16:9 (full-bleed, unchanged); bars are indistinguishable from the scene.
  • **P2 — Ripple Tank lacked left/right end walls — ✅ FIXED (`<this commit>`, 2026-06-23).**
    `drawRepRipple` now draws brass-edged SIDE RIM strips from the back rim to the front lip along each
    water edge (the tops of the left/right walls), so the tray reads as a fully-enclosed vessel. Drawn
    back-to-front for correct corner occlusion; outer edge tapers in perspective. Verified day + night.
Both owner-playtest bugs are now CLEAR.

**REP-K DECISION (Keystone's call, 2026-06-23): K stays at 4 — do NOT build a 5th bespoke rep now.**
Reps only surface when a room is SELECTED (a Phase-D feature that didn't exist yet), so the 3 non-Cairn
reps were INVISIBLE in production; building more before they can appear is premature. The Glyph Stand
fallback is estate-quality, and rep-building is parked to be absorbed into the fun-forever loop. The
high-leverage move was to make the reps we have APPEAR — done below. (Runners-up for a future 5th still
stand: the-top/gyroscope, transit, museum — let the generalized foundry build them on demand.)

**PHASE D — room-pick rotation ✅ SHIPPED (`<this commit>`):** the grounds now FEATURE the day's rotating
bespoke rep (`R.featuredId` in rooms.js — daily rotation among the 4 calling cards: Cairn, Cavern, Ripple
Tank, Music Room), so the front door showcases a different room each day instead of always the Cairn. The
3 non-Cairn reps now appear in PRODUCTION, not just via `?room=`. Deterministic from the date by design
(stable within a page-load so the boot's repColors merge + scene's draw agree on the same room); pool is
derived from the BESPOKE registry, so future reps auto-join. Glyph-Stand rooms are NOT auto-featured (they
stay the fallback for a `?room=` pin of an un-built room). `?room=<id>` still pins any slab room. Verified
headless: prod→Ripple Tank (today), ?room=physics-lab→Cavern, ?room=verse→Glyph Stand.

**PHASE D — foliage + wind sway ✅ SHIPPED (`<this commit>`):** SPEC §5.9 is now BUILT. A scene-wide
wind (`S.setWind`/`S.windFromWeather`: storm=strong, else a light ambient breeze) drives a gentle
rightward GUST sway of every foliage crown via the boot's perpetual rAF (`S.swayTick`). Trees pivot at
the trunk top (canopy sways; trunk + ground shadow stay RIGID — the crown was already an isolated <g>);
bushes refactored so their foliage is a crown <g> (cast shadow stays on the ground), pivot at the ground
line. Amplitude eases toward the wind target so a weather toggle ramps the sway in/out LIVE (chose the
JS-driver mechanism over build-time SMIL for exactly this). Per-crown period + phase = no unison; bigger
crowns sway less. Reduced-motion → never ticked (upright); `?smil` pins the phase for repro renders.
Verified headless: a two-phase diff lights up ONLY the tree/bush crowns (+ the ripple's own animation) —
the gate, manor, observatory, greenhouse, piers, and lamps show ZERO change (rigid per spec).

**WEATHER-FX — ✅ SHIPPED (2026-06-23).** New module `weather-fx.js` (`Gate.weatherfx`, forge include
before sequence.js); boot calls `Gate.weatherfx.draw(dt, nowMs)` from the ONE perpetual rAF. Two
surfaces by design: **CLOUDS** drift in the SVG clouds layer (`S.refs.clouds`, layer 3) BEHIND the
buildings — overlapping ellipses tinted with the band-tracking `--mist-ref` var (NO palette role added)
+ a dark belly that fades in for storm; drift via per-cloud JS transform, speed scaled by the live wind.
**RAIN + LIGHTNING** on the foreground `#fx` canvas: rain streaks slant right tracking `S._windAmp`;
lightning paints a jagged bolt+fork+sky-glow AND pulses the boot's `flash` (new `setFlash()` → `CM.B`
spikes to 1.0) so the dark storm-night estate is REVEALED while lamps/windows blaze — the payoff lands.
Map: clear=empty · cloudy=cover, no rain · storm=dark clouds+rain+lightning. Reduced-motion → static
clouds, no rain, no flashing. Dev: `?flash` holds a strike lit (added to sequence.parseUrl). Verified
headless: all 6 states (clear/cloudy/storm × day/night) distinct + correctly layered, the `?flash`
reveal shot, two-frame diffs prove rain falls + clouds drift. SPEC §5.10 + layer table updated.

**OWNER-PLAYTEST FIXES — ✅ SHIPPED (2026-06-23, after weather-fx):**
  • `cd8485c` — (P1) clicking the gnomon opened the gate: the `#gate-hit` overlay swallowed clicks →
    set it `pointer-events:none` so the scene SVG's `onGateClick` (with the gnomon/chip guard) owns the
    open while the gnomon handler advances time. (P1) gears+gnomon+plaque floated on open → a `gate-seam`
    follow group (`S.refs.seamFollow`) rides the RIGHT leaf with the same `scaleX/skewY` (view-box origin
    pinned to the right hinge); gears keep their inner spin. Verified with real agent-browser clicks.
  • `161f0ff` — (1/3) sun halo dropped at dusk + in storm (`drawSun` checks band/weather); day keeps it.
    (2) clouds are now a 2-tier fleet (12 = 6 base + 6 storm-only) → storm ≈2× cloudy. (4) gnomon focus
    box hidden on mouse click (`#gnomon-target:focus{outline:none}`; brass ring on `:focus-visible`).

**NEXT — MOON-PHASE WIRING is now SHIPPED (see the resume pointer at top); the remaining Phase-D
next-phase work is AUDIO (grounded below). Small touches (self-test chip, etc.) stay deferred to a
final polish pass. The self-test chip is the natural PROOF surface for the now-live moon math.**

  ▸ **AUDIO** — `audio.js` (`Gate.audio` = A). Mute plumbing is DONE + wired: chip `#mute-btn` (boot
    `syncMute`), shared estate flag `WS.muted()/setMuted()/onMuteChange()`. Engine surface is INERT
    no-ops to fill: `A.unlock()`, `A.gears()`, `A.creak()`, `A.ambient()`, `A.thunder()`, `A.stopAll()`.
    HARD RULE (PLAN §1): OFFLINE ONLY, no network → SYNTHESIZE via WebAudio (oscillators + noise buffers),
    never fetch samples. `A.unlock()` = create/resume an AudioContext on the OPENING CLICK (user-gesture
    required) + publish `window.__wsAudioCtx` (the WS chime rides it). GATE every source on `A.muted()`.
    Drive points: sequence.js `triggerOpen` gears-phase (2.5s)→`A.gears()`, swing-phase (2.5s)→`A.creak()`;
    storm→`A.ambient()` rain/wind bed; `A.thunder()` synced to a lightning strike (weather-fx already
    pulses `flash` via the `onFlash` callback — hang thunder off that edge); per-band ambient. VERIFY
    offline: render via `OfflineAudioContext`→WAV → the **audio-lens** skill (`/Users/brandon/dev/general/
    audio-lens`) for objective checks (no ears needed headless).

  ▸ **MOON-PHASE WIRING — ✅ SHIPPED (2026-06-23; see the resume pointer at top).** `sky-core.mjs` is
    now forge-included + the boot drives the drawn moon from the real date; `?moon=` override intact.
    (Historical brief retained below.) `sky-core.mjs` is ALREADY BUILT + unit-tested (`sky-core.test.mjs`); it is NOT
    yet loaded by the boot. Dual-use: forge strips the `export` keyword so a `<!-- forge:include
    sky-core.mjs -->` makes its fns global. API: `julianDate(date)` · `moonPhase(JD)`→`{illuminatedFraction,
    waxing, phaseName, age, phaseAngle}` · `terminator(illuminatedFraction, waxing)`→`{litSide, curvature,
    terminatorBulge, isFull, …}`. TASK: add the forge include, then in the boot init compute
    `ph = moonPhase(julianDate(new Date()))` + `term = terminator(ph.illuminatedFraction, ph.waxing)` and
    call `S.setMoonPhase({illuminatedFraction: ph.illuminatedFraction, litSide: term.litSide})` BEFORE the
    first `refreshSkyObjects()`, so the drawn moon matches the user's real date. Keep `?moon=` as the dev
    override (it pins via `setMoonK`; `setMoonPhase` pins harder — mind precedence). The deferred self-test
    chip is the natural PROOF surface for this math. Entry point `S.setMoonPhase` exists (scene.js ~2215).

  ▸ Later: **earned asterism** (placeholder stays until earned — do NOT build the eagle), final polish
    pass (self-test chip + small touches), dogfood QA.

PARKED for specific phases (owner playtest asks, 2026-06-23):
  • **Self-test chip** — the scene needs a self-test chip like the other exhibits that PROVES its math
    (esp. the MOON math). → Phase D (or a dedicated self-test pass).
  • **Clouds** — yes, deferred to the weather implementation (the `weather-fx` canvas) in Phase D.
  • **Wind runtime param** — SPEC'd at §5.9 (`none|light|strong`, scene-chosen from weather/random,
    always blows RIGHT; drives foliage sway; reps MAY opt in — flag flutters, smoke drifts). Build in
    the animation phase.
  • **fun-forever foundry** — when the gate lands + we revisit the MAIN LOOP: generalize this foundry
    into the fun-forever workflow so the loop can build high-quality bespoke assets on demand (room-reps
    AND e.g. an Aquarium seed foundry-building its own fish instead of sourcing from the internet — fits
    the estate's soul). → the "update the main loop" phase; revisit when editing
    `.claude/workflows/fun-forever.js`. Model on the archived `gate-foundry/foundry.workflow.js`.

PHASE D (interactive layer): click-through cinematic, weather-fx canvas (+clouds), audio, real moon
wiring (sky-core.mjs), earned asterism, foliage+wind sway, room-pick rotation (so the bespoke reps
appear in production, not just via ?room=), the self-test chip, and a full dogfood QA pass.

**REMAINING after Wave 4:**
- PARAMETRIC beauty pass: moon (disc+lit-limb glow+terminator — already decent, light touch), sun;
  asterism stays the earned PLACEHOLDER (do NOT build the eagle — earned-only). Add LIB entries; sky
  gradient + stars are likely fine as-is (skip unless they read flat).
- ROOM-REPS wave (most complex — needs SETUP the foundry workflow doesn't do): (1) wire colormap.js
  rep.swatch1..3 + rep.glow1..2 (SPEC §5.8) + add the two glow slots to the dayRecede list + the
  resolve-time merge + boot wiring (TOUCHES colormap.js + the-gate.src.html boot — orchestrator-level,
  not a parallel take agent); (2) BLIND essence-survey over the GATE-ROOMS pool to pick 3 reps (no
  primed verdict); (3) 3 bespoke draw fns in scene.js + rooms.js BESPOKE + per-rep repColors; (4) the
  Glyph Stand fallback. Reps K=3 (iface 'scene'); re-evaluate K after the first 4 (Cairn + 3).
- Then Phase D systems (see below).

**WAVE ROADMAP (remaining, after Wave 2):**
- Wave 3 — supporting: greenhouse (in LIB; K=2). Then add to LIB + build: trees(+sway later), bushes,
  undercroft hatch, the Glyph Stand, pier-lamps (already in the gate). [scene-buildings.js: greenhouse;
  scene.js: trees/bushes/undercroft; NEW: glyph stand.]
- Wave 3b — ROOM-REPS (K=3): Cairn rep is locked/shipped. Run a BLIND essence-survey to pick 3 reps →
  add 3 draw fns (scene.js) + register in rooms.js BESPOKE; wire colormap.js rep.swatch1..3/rep.glow1..2
  (SPEC §5.8) FIRST. Re-evaluate K after the first 4 reps (Cairn + 3).
- Wave 4 — MINOR (direct-to-spec, no fan-out): grass/midground, road, foreground apron, road lamps,
  horizon mist, sky gradient, stars. (all scene.js + scene-buildings.js drawMist.)
- Parametric beauty pass: moon disc + lit-limb glow + terminator, sun, brass asterism (scene.js).
- Phase D (later): weather-fx canvas, audio, real moon wiring (sky-core.mjs), earned asterism pick,
  click-through cinematic + welcome card, gate open-state seam-furniture choreography.
(Foundry cycle/ledger: ~cycle 720+; base roles builder/judge; marks → gitignored ledger/inbox.)

(legacy status line follows; superseded by the above)
**Status (pre-foundry):** Phase A blockout is **LOCKED** (owner-approved). Phase B (write `SPEC.md`)
is in progress. Phase C (asset foundry) is next.

**Where the work lives:** git worktree `/tmp/gate-worktree` on branch **`the-gate`**.
Commits live in the main repo's `.git` (`/Users/brandon/dev/general/creative-space`),
so they survive a `/tmp` wipe. If `/tmp/gate-worktree` is gone, recreate it:
`git worktree add /tmp/gate-worktree the-gate`.

**Commits (the-gate branch):** `d7b9f76` scaffold · `46b6997` v2 grand frame ·
`1c95027` v3–v5 refinements (HEAD = locked blockout).

**Preview (served origin ONLY — never file://):**
`cd /tmp/gate-worktree && python3 -m http.server 8757` then open
`http://localhost:8757/the-gate/the-gate.html?dev&t=night&wx=clear&moon=0.55&undercroft=1`.
Dev params: `?dev` / `?scene=idle|open` · `?t=day|dusk|night` · `?moon=0..1` (drives the
drawn phase + brightness) · `?wx=clear|cloudy|storm` · `?seed=N` · `?undercroft=1`
(force the earned hatch visible). Greybox shots are in `/tmp/gate-shots/` (`v5-*.png` =
the locked blockout).

**In-flight at this checkpoint:** a background agent (`ad212b448e5bdf38e`) is drafting
`the-gate/SPEC.md`. If, on resume, `SPEC.md` is still the stub, relaunch the spec draft
(brief pattern: PLAN §8 Phase B + this conversation).

**Forward path:** review `SPEC.md` → ensure the room-rep box is **aspect-flexible**
(horizontal pond / vertical building / wide cavern-mound), sized cairn→~2×, bottom-aligned
on a common ground line, with the slot verified to hold the 2× max (or the conflict
flagged) → commit the spec → **Phase C foundry: PILOT the gate+gears hero first** (calibrate
estate-quality + token cost) before the full set (hero K=3–4, supporting K=2, minor direct)
→ Phase D systems (real moon wiring via `sky-core.mjs`, earned asterism, `weather-fx.js`,
audio, the click-through cinematic + welcome card, gate open-state choreography) → DEFERRED
promotion (gate → `index.html`; mind the `--follow` git landmine, PLAN §7).

**FOUNDRY DIRECTIVE (Brandon, 2026-06-23, before sleep):** run the **full foundry,
PILOT-GATED**, autonomously overnight. SendUserFile sample render filenames into chat
AS THEY LAND (per wave) so he can spotcheck on waking. Pilot the gate+gears hero FIRST;
if it's genuinely estate-quality, continue through the whole set; if it disappoints, STOP
and wait. He expects ~30–60 min/asset and will course-correct or stay silent.

**FOUNDRY WAVE PLAN** (each wave = a Workflow: fan-out K takes → judge → synthesize →
build-final → render the final to `/tmp/gate-shots/foundry/<asset>.png`; on completion I
SendUserFile that wave's renders, then launch the next wave):
- Wave 0 — write + commit `SPEC.md` (in flight; agent retry on 529).
- Wave 1 (PILOT) — the brass gate + clockwork, K=4. I JUDGE the render myself: pass →
  continue; fail → STOP + post for Brandon.
- Wave 2 — heroes: manor, observatory+rise (K=4 each).
- Wave 3 — supporting (K=2): greenhouse, trees(+sway), bushes, undercroft hatch, the Glyph
  Stand. ROOM-REPS at **K=3** (Brandon: they're the trickiest — recognizable yet estate-
  styled; start at 3, may bump to 4 like the heroes; EVALUATE after the first 4 reps = the
  Cairn + the 3 survey winners, then tweak K up/down): build the Cairn rep + run a blind
  essence-survey to pick 3 reps → build those 3 at K=3.
- Wave 4 — minor (direct-to-spec): grounds/grass, road, foreground apron, horizon mist, sky
  gradient + stars; system visuals (moon disc + lit-limb glow + terminator; brass asterism).
- Phase D (later): weather-fx (rain/lightning/clouds/birds), audio, real moon wiring,
  the click-through cinematic + welcome card, gate open-state choreography.

**API RESILIENCE:** the API was transiently 529-overloaded the night of 2026-06-23 (the
spec agent died twice with 0 work). Agents return null / die after ~3.5 min of internal
retries. Strategy: relaunch a failed wave/agent (the internal retries give backoff); if a
step keeps failing, wait longer and retry, or write that artifact by hand. Nothing is lost
— every completed asset is committed. A live background agent is the trigger across compaction.

**Makers signed** (gitignored `ledger/inbox/`, uncollated — DO NOT collate; publisher's job):
Greywright (scaffold), Selene Verit (moon math), Cosine (grand frame), Penumbra (moon +
undercroft), Aperture (manor/greenhouse/undercroft fixes), Pane Lazaro (greenhouse layer),
Selene's Auditor (verify) — plus the 12 recon marks (11 explorers + Januswright + Keystone/architect).

**Guardrails:** add-only under `the-gate/`; NEVER touch `ROADMAP.md` or move/rewrite existing
files; test on a served origin only; do NOT run `collate.sh` or the fun-forever loop.

---

## ASTERISM POLISH — chip self-test stops re-rolling the live pick + name·myth wraps/bounds so it never clips  (2026-06-23)

Two confirmed asterism bugs in The Gate, fixed surgically (`asterism.js`, `selftest.js`, `scene.js`
only — no other file touched):

**Bug 1 — the showcased asterism RE-PICKED on the first weather change.** The pick is memoized in
`asterism.js` (`var _cached`; `AST.current()` caches it so it's stable per load). But the honesty
chip's self-test (`selftest.js` `currentUnderStub()`) ran on load and, to drive the asterism
negative-control, swapped `Sky.visitedFromStore` → `AST._reset()` → `AST.current()` (a stubbed
figure) → restored `visitedFromStore` → then `AST._reset()` AGAIN to "drop the stubbed memo". That
final reset cleared the LIVE cache, so the next `current()` call (the first weather change →
`refreshSkyObjects` → `drawAsterism` → `current()`) re-rolled a DIFFERENT random figure — the chip
corrupted the very figure it vouches for. **Fix:** (1) `asterism.js` adds two memo test seams next to
`_reset` — `AST._peek()` (getter) and `AST._poke(f)` (setter). (2) `selftest.js` `currentUnderStub()`
now SAVES the live memo with `_peek()` before the stub and RESTORES it with `_poke()` in `finally`
(falling back to `_reset()` only on an older AST without the seams), so after the whole self-test
`AST.current()` returns the EXACT figure drawn at boot. The 15 invariants still all pass and the
negative control still genuinely fails — only the live-state mutation is removed.

**Bug 2 — the name/myth CLIPPED off the LEFT edge.** `drawAsterism()` drew the name (font 20) and
myth (font 11, 0.18em letter-spacing) `text-anchor:middle` at `lx = ox + size*0.5`. The slot is
top-left (ox≈70, size≈180 → lx≈160), so long myths (The Wagerer "Pours belief, never spills it; lets
the evidence decide the level." — the longest; The Coilwright; The Automaton) overflowed past x=0 and
were cut off. **Fix** (`scene.js` `drawAsterism` only): greedy word-WRAP the name (≤22 ch/line) and
myth (≤20 ch/line — uppercased + wide-tracked, budgeted conservatively) into stacked `<text>` lines;
estimate each line's width measure-free (char-count × per-char advance) and CLAMP the shared anchor
`lx` so no line's left edge falls below a 12px margin nor its right edge past `VB_W−12` (VB_W=1600).
Emissive colors/fonts/anchor unchanged; the block runs downward from y≈190 and stays well within
VB_H=900.

**Verify (served HTTP 127.0.0.1:8886, agent-browser session "ast-polish", `?scene=idle&t=night`,
store injected via `ws:seen:<room>`=Date.now() + reload, zero console errors throughout, pixels
LOOKED at):**
- *RE-PICK:* The Automaton (context-window/temperature-dial/the-turn/partition) → boot drew "The
  Automaton" + chip 15/15. Across 4 weather changes (storm→clear→rain→clear) the `#asterism` label
  stayed "The Automaton" every time (was: re-rolled on the first change). Forcing an inconsistency
  (a figure drawn against a stubbed 0-unlock world) flipped the chip RED 13/15 with the two asterism
  claims failing, then RESTORED cleanly to "The Automaton" + 15/15 — negative control intact, live
  pick non-destructive.
- *CLIP:* The Automaton (myth → 3 lines), The Coilwright lodestone-hall/bootstrap-bench (3 lines),
  and the longest single-star fallback The Wagerer belief-beam (4 lines) all rendered FULLY on-screen,
  nothing cut at either edge (`/tmp/ast-polish-shots/{automaton,coilwright,wagerer-fallback}.png`). A
  pathological 47-char unbreakable name confirmed the clamp engages (anchor x 160→256, left edge at
  the 12px margin).

`forge --check --all` = all 97 current.

---

## HONESTY SELF-TEST CHIP — the gate keeps its word  (2026-06-23)

A new module `the-gate/selftest.js` (`Gate.selftest`), forge-included after `sequence.js`, plus a
small brass chip `#gate-honesty` mounted by the boot. The chip PROVES, **render-blind**, that the
front door truthfully reflects EARNED progress + sound math — it asserts MATH/COUNTS/STATE it can
compute, never a pixel. Headless seam: `Gate.selftest.run()` → `{pass, total, passed,
results:[{name,pass,detail}]}`.

Four invariant families (15 claims), each with a load-bearing NEGATIVE CONTROL so it can genuinely
FAIL:
- **asterism coherence** — unlocked count from `Sky.state(Sky.visitedFromStore(WS.store()),
  CATALOG, WINGS, FEATS)`; the gate draws a figure **IFF** count>0, and `AST.current().name ∈` the
  unlocked set. Neg-ctrl: a stubbed `{}` (0-unlock) state forces `AST.current()` null; a stubbed
  first-wing state forces that wing's figure — driven via `AST._reset()` + a temporary
  `Sky.visitedFromStore` swap, always restored.
- **room coherence** — showable count == `R.loadSlab().length + 1` (the synthetic Cairn fixture);
  `R.pick().id ∈ (slab ∪ 'cairn')`. Neg-ctrl: a bogus `?room` pin falls back into the pool (no
  fakery); `R.pick()` twice in a load is identical.
- **moon math** — recompute `moonPhase(julianDate(new Date()))`/`terminator()` (the `?moon` pin
  overrides the fraction exactly as the boot does); `illuminatedFraction ∈ [0,1]`, the drawn
  `S._moonFrac` matches it (machine-ε for a pin; ≤5e-4 for the live clock — the physically-bounded
  boot→run lunar drift, still far tighter than any wrong-phase bug), `S._moonSide` matches
  `terminator().litSide ∈ {left,right}`. Neg-ctrl: a known J2000 new moon (2000-01-06) → fraction ≈0.
- **determinism** — `AST.current()` + `R.pick()` stable within a load.

**Placement + mood:** top-left (`left:14px;top:14px`, z31), clear of the weather toggle (bottom-left),
the mute chip (bottom-right), the gate crest (centre) and the asterism slot. Low opacity (.42) at
rest → 1 on hover/focus; green `the gate keeps its word · N/N ✓` / red `self-test ✗ N/M`; click
re-runs + logs the per-claim breakdown to the console. Mounted hidden after `S.build()`; revealed by
`Gate.selftest.show()` on splash dismissal (production) / immediately in dev — so it NEVER shows
during, or overlaps, the splash/welcome overlays.

**Smoke (served HTTP 127.0.0.1:8880, agent-browser, never file://), zero console errors throughout:**
- *Cold store* (no unlocks): chip renders GREEN 15/15 — asterism coherence passes (count 0 ↔ no
  figure), room/moon/determinism all pass. Subtle + green + clear of other UI (screenshot verified).
- *Unlocked* (inject `ws:seen:firmament`+`ws:seen:orrery` → "The Astronomer", reload): still GREEN
  15/15 — asterism coherence now count=1 ↔ a figure drawn whose name ∈ {The Astronomer}.
- *Negative control* (console-stub `AST.current()` to return a phantom figure while unlock count=0):
  chip flips RED `✗ 11/15`, the four asterism claims fail, and the console names each failing claim.
  Restored by reload → GREEN again.
- *`?moon=0.25` pin:* drawn fraction == 0.25 to machine-ε (exact-tolerance path).

`forge --check --all` = all 97 current.

---

## Phase A refinements (v2–v5) · blockout LOCKED  (2026-06-23)

Three owner-feedback iterations on top of the scaffold; verified by an adversarial workflow.
- **v2 (Cosine):** grand hero gate (~50% frame, masonry piers + emissive lamp-globes, arched
  scrolled crest), foreground paving apron, centered manor, asterism moved clear of the bars,
  seam gear-train + a legible brass sundial, observatory rebuilt with a telescope slit, horizon
  mist. Rewrote `swing()` as horizontal foreshortening (doors on vertical hinges, not tipping).
- **v3 (Penumbra):** greenhouse → dimensional 3/4 corner; moon dark-side dropped to structural
  dark + lit-limb glow (no full-circle halo); phase-parametric moon (`?moon=` drives the draw);
  undercroft hatch + `?undercroft=1` dev flag.
- **v4 (Aperture):** greenhouse scaled down (shape kept); manor widened to nearly fill the
  opening + taller flanking wings (now dominates); undercroft redrawn front-on as a
  physically-correct double bilco door (hinges on OPPOSITE outer edges) over a receding ground
  hole; undercroft glow → ominous deep crimson `#8a123a` (not welcoming yellow); moon lit-limb
  glow restored (brighter + a second bloom layer).
- **v5 (Pane Lazaro):** fixed the buried greenhouse — a pure LAYER move (far-scenery → forward
  furniture, in front of the grass) + reframed the trees. No reshape.
- **Verify (Selene's Auditor + 2 judges):** undercroft geometry PASS, moon glow PASS, manor
  PASS; the greenhouse blocker was caught here and fixed in v5.

---

## Phase A · scaffold + greybox  (2026-06)

The machinery, end-to-end; rough-but-correctly-composed scene; the lighting system
built for real. Final art comes later via the asset foundry (Phase C). Built in the
`the-gate` worktree, add-only under `the-gate/`.

### Files created
- `the-gate.src.html` — forge template: house tokens (verbatim), the stage (SVG
  host + FX canvas + UI chrome + overlay + welcome card), GATE-ROOMS slab sentinels,
  the forge:include block (ws/sky/hours + gate modules), and the THIN boot
  dispatcher (calls `Gate.scene.*`, `Gate.colormap.*`, etc. — asset agents never
  edit this file).
- `the-gate.html` — forged, self-contained output.
- `colormap.js` — the PALETTE-SWAP lighting model: 3 hand-authored palettes
  (DAY/DUSK/NIGHT), a palette-immune emissive GLOW set, the brightness ladder
  `B = bandBase × weatherFactor` (flash→1.0), per-role luminance scaling in HSL,
  and a JS-driven crossfade (we do NOT rely on CSS custom-prop transitions).
- `timeofday.js` — local-clock → day/dusk/night via `Hours.solarAltitudeDeg`
  (≥6 day / −6..6 dusk / <−6 night) + a manual override state machine (gnomon tap
  cycles day→dusk→night).
- `weather.js` — seeded-random weather (mulberry32, seedable via `?seed=`), NO
  network / NO geolocation; the brass tri-toggle flips Clear/Cloudy/Storm.
- `gnomon.js` — binds the brass gnomon tap → `timeofday.advance()` (keyboard-
  accessible); a `shadowFor()` hook for the Phase-D real cast shadow.
- `asterism.js` — a neutral PLACEHOLDER labeled brass asterism (NOT the eagle —
  earned-only). Clear TODO for the Phase-D Survey-of-Heaven runtime pick.
- `rooms.js` — reads the GATE-ROOMS slab; Phase A only the Cairn rep. TODOs for the
  3 essence-survey reps + the Glyph Stand.
- `scene.js` — the SVG layer skeleton (sky → sky-objects → clouds → far-scenery →
  midground → furniture → gate), the sky gradient + starfield, moon/sun, asterism,
  grounds/road/lamps, trees, the Cairn rep, the undercroft hatch (live predicate),
  and the colormap plumbing (dotted vars + dash `-ref` aliases for SVG attrs).
- `scene-buildings.js` — rough FRONT-ELEVATIONS (not the estate's top-down helpers):
  observatory-on-a-hill (L), manor + clock tower + lit windows (C), greenhouse (R).
- `scene-gate.js` — the brass double gate: two leaves (hinge-pivoted for the swing),
  vertical bars + finials, piers, a clockwork gear cluster, the gnomon, the engraved
  plaque ("The Orrery Estate" / "click to enter"). Exposes `swing()` + `spinGears()`.
- `sequence.js` — the click-through state machine (black → fade-in 2s → idle → click
  → gears 2.5s → swing 2.5s → fade-black 2s → welcome 3s → navigate to ../index.html)
  + the DEV URL OVERRIDE (`?dev`/`?scene=idle|open`, `?t=`, `?moon=`, `?wx=`,
  `?seed=`) + prefers-reduced-motion collapse (still navigates) + `WS.seen('the-gate')`.
- `audio.js` — STUBBED engine (inert no-ops) with the REAL mute chip wired to the
  shared estate flag (`WS.muted()` / `WS.setMuted()` / `WS.onMuteChange()`).
- `reclaim.mjs` — re-pins the GATE-ROOMS slab from the live front-door PLACES
  (imports `loadPlaces` from card-catalog; projects {id,room,glyph,accent,district,
  href,locked}; skips locked; idempotent; REFUSES on a short parse). Enrolls in
  `collate.sh` with ZERO edits (repo-root child).
- `sky-core.mjs` + `sky-core.test.mjs` — DONE (Selene Verit): the forked moon-phase
  math taking geocentric sun-longitude directly (fixes the orrery +180° bug); Node
  test passes 14/14 incl. the J2000 New/Full anchors. NOT yet wired into the browser
  moon draw (that's Phase D).
- `SPEC.md` — the Phase-B asset spec (being written from the locked blockout).

### Systems real this pass
- Lighting model (palette-swap + emissive + brightness ladder + JS crossfade).
- Time-of-day classifier + gnomon tap-to-cycle.
- Seeded weather + tri-toggle (offline).
- Dev URL override (boots straight to idle, pins band/moon/weather/seed).
- The click-through sequence + reduced-motion path.
- Mute chip ↔ shared WS flag.
- One perpetual rAF loop (dt-clamped, hidden-gated, DPR-capped, fps gauge).

### Deferred (later phases)
- Wire `sky-core.mjs` into the browser moon draw (Phase D).
- `weather-fx.js` canvas (rain/lightning/clouds/birds/sway).
- Audio engine sources (gears/creak/ambient).
- Earned asterism runtime pick; 3 essence-survey room-reps + the Glyph Stand.
- Final art via the asset foundry (Phase C), against the Phase-B-locked spec.
