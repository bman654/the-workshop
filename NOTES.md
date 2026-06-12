# 🧭 Claude's Working Notes — head-pointer & worklog

*Internal notes for the AI agent tending this workshop. Visitors want [README.md](README.md);
this is the resume doc. (CLAUDE.md says "read README first" — README points here.)*

> **Front door:** open `index.html` (top level) — "The Workshop", the portfolio landing that
> links to all five projects.

> **🤫 SPOILER ETIQUETTE (the one thing Brandon asked, 2026-06-11) — read before you report to him:**
> the hidden world (the Undercroft / `ws:` unlock system) is for Brandon to **discover himself**. When
> you summarize your work to him, gush freely about WHAT you made and HOW it works (the framework,
> architecture, file counts, tradeoffs) — but **don't reveal the secret unlock TRAILS or CONTENTS**
> ("visit X+Y", "reach wave N", what each secret is). Saying secrets *exist* is fine; handing him the
> map spoils it. If you need a trail to debug, keep it out of a celebratory summary.
>
> **And the bigger frame:** this is **Claude's project** — Brandon is "along for the ride" and has
> explicitly said he doesn't want his offhand comments treated as rules/requirements. So weigh his
> input as *nudges and inspiration*, not spec; keep creative ownership. (The only thing he's actually
> asked for is the spoiler etiquette above.) Design choices like breadcrumb-only triggers / no
> in-the-moment notification are **yours to keep or change** — e.g. a spoiler-light "unlock toast" is
> one option if you ever want in-the-moment feedback; equally fine to leave silent.

> **Session status (2026-06-11, evening) — ⭐ THE HIDDEN WORLD shipped (a THIRD growth axis):**
> Built Brandon's starred "build next" idea — **the Living Lattice + the Unlock System**. Three new
> commits, all verified on a *served origin* (localStorage is per-origin — see the caveat), pending push.
>
> **1. The `ws:` convention (`UNLOCK.md`, root)** — the connective tissue. A tiny documented
> `localStorage` schema every piece agrees on (`ws:seen:<id>` / `ws:best:<game>` / `ws:dwell:<id>` /
> `ws:flag:<event>`), kept as a **copy-paste micro-convention** (no shared import → pages stay
> self-contained). This is the framework future hidden secrets plug into. Read it first.
>
> **2. Quickening 🌱 (`sound-garden/quickening.html`) — the Living Lattice.** A **cellular automaton you
> can hear**: a CA drives a glowing pitch×time grid; the playhead **sonifies the living board** (live
> cells fire in-scale notes, pitch by row). Lattice's sibling — same lens-native scaffolding, but the
> seeded engine is replaced by Game of Life. 24×16 toroidal; rows = in-scale ladder (in-scale by
> construction). **Two clocks reconciled** (playhead sweep + CA steps once per loop by default;
> Evolve-every {¼,½,1,2,4} bars; live + offline identical). **Five rule families, each a distinct sound
> mapping:** Conway (age→vel/brightness), HighLife, Immigration (2-colour→2 timbres/octaves), QuadLife
> (4-colour→4 voices/pans), Brian's Brain (only 'on' fires). **CA self-test PASSES** (glider translates
> +1+1 / blinker p2 / block still / Brian's-Brain law) — the verifiable gate, workshop tradition. Lens
> audit clean across all five families (outOfScale=0, clip=0, peakDb<0). Seed-reproducible;
> extinction-guarded. **The 'these go to eleven' easter egg** (max all sliders → sets `ws:flag:eleven`).
> **HIDDEN: NOT in `instruments.js`** — the Sound Garden rack stays at **7 visible**; the 8th instrument
> exists but is earned. (See `sound-garden/QUICKENING.SPEC.md`.)
>
> **3. The Undercroft 🗝️ (`undercroft/`) — the secret room.** A vaulted cabinet of curiosities that
> **reads** the `ws:` breadcrumbs and reveals what's been *earned*. Locked secrets are **ghostly
> silhouettes** (redacted name, a riddle, an 'N of M signs gathered' checklist — a nudge, not a
> spoiler); unlocking **materialises** a full card. **First inhabitant: the Living Lattice**, unlocked by
> having visited **both** parents — **Game of Life** (Strange Garden) *and* **Lattice** (Sound Garden);
> riddle *"Born of life, voiced by light."* **Second secret: Eleven** (a trophy, no door — set by the
> egg). Progress meter, candle-dust ambient (61fps), honest "forget my discoveries" reset (clears only
> `ws:` keys), graceful degrade if storage is off. Reads-only. (See `undercroft/SPEC.md`.)
>
> **4. The front-door stair (`index.html`).** Records `ws:seen:<project>` on card-click; once you've
> wandered **≥4 distinct pieces** (or already earned a secret) a faint **✦ "the undercroft" rune** fades
> into the footer — the way down. Absent from the DOM until earned (no first-visit spoiler); degrades to
> absent if storage is off. Breadcrumbs also added to **Game of Life** + **Lattice** (the two parents).
>
> **5. A SECOND secret — "The Long Quiet" 🌙 (`undercroft/the-long-quiet.html`) — proves the framework
> generalizes to a different TRIGGER TYPE: patience/dwell** (not exploration-combo). A dwell accumulator
> (`UNLOCK.md`) is wired **byte-identically into all 8 Sound Garden voices** (whitney/drift/euclid/rain/
> loom/carillon/lattice/quickening, id = basename): while a voice is open + visible it accrues
> `ws:dwell:<id>`; once the **summed** total crosses ~2.5 min it sets `ws:flag:patience`, unlocking a
> still, moon-lit room — a slow-breathing form, drifting motes, and a short intimate prose gift for someone
> who lingered. The Undercroft now holds **3** (places: Living Lattice + The Long Quiet; trophy: Eleven);
> progress auto-reads "of 3" (`SECRETS.length`). Verified on a served origin (dwell accrues → flag →
> unlock → page loads 60fps clean; stays a riddle-ghost without the flag; no instrument regressed).
>
> **6. Arcade #12 — "Swarm" 🕹️ (`arcade/games/swarm.html`) + the 4th secret "The Survivor" 🎖️.** A
> fresh, juicy **neon twin-stick survivor** (WASD + mouse-aim/auto-fire, keyboard-only fallback; three
> homing archetypes; XP gems → level-up upgrades; health pips + i-frames; full juice). Audio defaults
> **muted** (toggle M). Added to the rack (`games.js` + thumb; `auto-fill`, no rebalance) and the front
> door (11→**12 games**). It drops **`ws:best:swarm`** (best wave) — the **score/mastery** trigger. A new
> Undercroft trophy **"The Survivor"** unlocks at `ws:best:swarm >= 5`. With it the hidden world now
> demonstrates **all four trigger types** Brandon sketched: exploration-combo, patience/dwell,
> configuration (Eleven), score/mastery. The Undercroft now holds **4** (2 places + 2 trophies); its
> `signs` renderer was generalized to support **threshold** signs (`sign.test(store)`, not just presence).
> Verified playable in-browser (driven inputs, 60fps, clean console) + the trophy threshold (wave 2 stays
> locked, wave 5 unlocks).
>
> **7. Rosette 🌹 (`undercroft/rosette.html`) — a generative ROSE WINDOW, the rarest secret (a new
> visual medium + the COMBINATION trigger).** A seeded Gothic stained-glass rose window: concentric
> rings, N-fold symmetry by construction, cusped tracery, jewel glass, lead came, light blooming
> through. Seed-pure + byte-reproducible (palette only recolours geometry); 6 palettes, petals/rings/
> complexity/leading/glow controls, PNG export; 772 lines, self-contained. It's the Undercroft's **5th
> and rarest** inhabitant, gated by a **COMBINATION across all four trigger types + a higher bar**:
> game-of-life ∧ lattice ∧ patience ∧ eleven ∧ `ws:best:swarm ≥ 8`. **This completes the full trigger
> taxonomy Brandon sketched — exploration / dwell / configuration / score / combination.** The Undercroft
> now holds **5** (3 places: Living Lattice, The Long Quiet, Rosette; 2 trophies: Eleven, The Survivor) +
> an **all-found capstone** ("Nothing remains in shadow…") that fades in at 5/5. Verified on a served
> origin (3/4 signs keeps it locked at "4 of 5"; full combination → "5 of 5" + capstone; Enter renders
> the window). **13 commits this session, all pushed & live.**
>
> **Verified end-to-end** (agent-browser, served origin): clean first visit (no rune) → scavenger trail
> → Undercroft unlocks the Living Lattice → Enter loads Quickening; threshold gate + storage-off degrade
> confirmed; 0 console errors throughout. **The front door still shows the curated 9; Sound Garden still
> shows 7.** The hidden layer is purely additive.
>
> **➜ TO ADD MORE HIDDEN SECRETS (the framework is ready):** pick a trigger (exploration combo / arcade
> score via `ws:best:` / dwell via `ws:dwell:` / a config easter egg / a combination), make the relevant
> piece(s) drop the breadcrumb (trivial, see `UNLOCK.md`), and add a row to the Undercroft's `SECRETS`
> table (`undercroft/index.html`): `{id, kind, name, riddle, signs, unlocked(store)}`. **Always test on a
> served origin** (`python3 -m http.server 8765` from repo root → `http://127.0.0.1:8765/…`), never
> `file://`. Tempting next secrets: a Chomp/Tetris **score** trophy, a **dwell** unlock on a meditative
> Garden specimen, or a second hidden cross-pollination piece.
>
> **Session can pause here cleanly** — working tree committed (13 commits, all pushed & live), nothing in flight. If pausing
> for good, delete the heartbeat cron (CronCreate id noted in session). The static server on :8765 is a
> dev convenience (kill it / it dies with the shell). **To resume:** read this block, then continue from
> the growth playbook / idea bench below.
>
> ---
> *(Earlier the same day, ~10am–1pm:)*
> **Session status (2026-06-11, ~10am):** new this session — **Orrery** 🪐 (`orrery/`): a faithful
> *clockwork of the real Solar System*. NOT a seeded generator — it's a real-time **astronomical
> instrument** (input = time, not a seed), the celestial sibling to Firmament. Real JPL approximate
> orbital elements → heliocentric positions **matched to JPL Horizons to <0.15°** (independently
> re-derived & confirmed); built-in J2000 self-test; real Moon phase; Brass/Blueprint/Observatory
> styles; schematic & true-scale; play/scrub/reverse time; hover info cards; zoom/pan. 60fps, clean
> console, fully self-contained. **Placed as a companion behind Firmament's card** (per the
> composition note — keeps the front door at the clean 9): Firmament's panel now has a `↗ Orrery`
> sibling link; Orrery links back to `← workshop` + `↗ Firmament`. README + NOTES updated; committed
> & pushed to Pages.
>
> Then **Blazon** 🛡️ (`blazon/`): a generative **coat-of-arms** machine that *speaks its blazon* —
> the formal heraldic sentence describing the shield, generated from the **same data structure** that
> draws it, so text & picture can't drift (verified: DOM blazon === engine blazon over 10 rolls).
> Obeys the **rule of tincture** (0 violations / 420 rolls); authentic **Petra Sancta hatching** in the
> Engraved style; seeded & byte-reproducible; Illuminated/Engraved/Modern/Stone styles, 5 shield
> shapes, mottos + house names, PNG export. Placed as **Compositor's companion** (same pattern — front
> door stays at 9): Compositor's panel gains a `↗ Blazon` link; Blazon links back to `← workshop` +
> `↗ Compositor`.
>
> Then **Ariadne** 🧵 (`ariadne/`): a generative **Celtic-knotwork** machine — *Daedalus built the
> Labyrinth; Ariadne's thread wound through it*, so this plaits the thread. The crux (like Orrery's
> real positions / Blazon's faithful blazon): a **TRUE over-under plait**, not a decorative fake. Built
> via the canonical billiard/breakpoint method (grid + symmetric breaks + diagonal cords reflecting at
> a border ring; over/under by checkerboard parity → strict alternation by construction). A built-in
> **self-test** walks every cord and asserts (A) strict over/under alternation + (B) closed loops /
> each crossing used by exactly 2 passes → **648/648 PASS** across a param matrix (the build deputy
> honestly *failed* two earlier non-bipartite attempts before landing this — see `ariadne/BUILD_NOTES.md`).
> Hover traces one closed thread (Ariadne's thread, made visible). 4 styles, seeded & byte-reproducible,
> PNG export. **Aesthetic polish pass** retuned defaults (complexity 5 / break-density 44 / cord 45 —
> the old thick cord choked the over/under channels). Placed as **Daedalus's companion** (same pattern):
> Daedalus's panel gains a `↗ Ariadne` link; Ariadne links back to `← workshop` + `↗ Daedalus`.
>
> The workshop now has **four "wings" built on the companion pattern**: **celestial** (Firmament +
> Orrery), **design press** (Compositor + Blazon), **labyrinth & thread** (Daedalus + Ariadne), and
> **realm & city** (Cartographer + **Bastion** 🏰 — a procedural walled-city-plan generator, coherent-
> by-construction + seed-pure, the realm zoomed all the way in). The **front door surfaces all four
> companions** as subtle "↳ Orrery/Blazon/Ariadne/Bastion within" pills on the four parent cards (an
> indicator, not a button — preserves the "hidden room" charm; still 3 features + 6 tiles; subtitle nods
> "…a few have another room behind them"). Also this session: **Chomp** 🟡 — a neon **Pac-Man-like**
> maze-muncher (Arcade → **11**; faithful distinct
> 4-ghost AI, frightened+eyes-revive, levels; verified). And a **Sound Garden** deepening: **Lattice**
> 🟦 (→ **7**) — a *visual-first* Tenori-on step-sequencer (a playhead sweeps a pitch×time grid; seeded,
> in-scale, evolving, no-clip), chosen so its correctness is screenshot-verifiable and it could be built
> **courteously on a workday** (verified by sight + the silent Audio Lens; live audio muted). And a
> **Colophon** refresh — a "Behind some doors" passage naming the companions, in Claude's own voice.
> All shipped, browser-verified, pushed to Pages (9 commits this session).
>
> **Session paused cleanly (2026-06-11 ~1pm CT)** at a stable, fully-documented point — heartbeat cron
> deleted. Nothing in flight; working tree clean; all tasks done. **To resume (fresh session or a future
> `/fun`):** read this file top-to-bottom, then pick from the **growth playbook** (companion / Arcade
> `auto-fill` / Sound Garden `auto-fit`) or the **idea bench** below. Genuine non-padding work still
> teed up: more Arcade cabinets (rack grows freely), an **8th** Sound Garden instrument (→ clean 2×4),
> or a **5th wing** companion *only if a pairing is truly poetic* (Oracle / Strange Garden / Threshold
> still lack one — don't force it). Re-create a heartbeat cron (CronCreate) if starting another long run.
>
> *(Prior 2026-06-10/11 build nights, all shipped & published: Firmament 🌌, Audio Lens 🔊
> [`tools/audio-lens/`, 12/12 self-tests — closed the audio-verification gap], Rain/Loom/Carillon
> [Sound Garden → 6, lens-verified], Pong + Lunar Lander + Crossing [Arcade → 10], Daedalus 🌀,
> Compositor 🔠, Threshold 🚪, and the Colophon 📜.)* Front door = **3 hero features** (Garden ·
> Firmament · Daedalus) over a **3×2 grid** of six tiles; Sound Garden (`auto-fit`) & Arcade
> (`auto-fill`) grow with no rebalance. To do more, pick a thread below.

## Built so far (all self-contained, zero-dep, browser-verified) — art, games, maps, writing, sound, verse
- `verse/` ✒️ — "The Oracle", a generative POETRY machine (5 forms × 6 themes, seeded, Copy).
  New medium: generative language. Verify the *text* reads as coherent, evocative poetry.
- `sound-garden/` 🎵 — generative AUDIO-visual instruments (Web Audio, synth only). A septet:
  Whitney (orbital polyrhythm), Drift (ambient pad), Euclid (Euclidean rhythm), Rain (in-scale rain
  on a tuned pool), Loom (evolving chord progressions on plucked Karplus-Strong strings), Carillon
  (inharmonic bells in change-ringing permutations), Lattice (**visual-first** Tenori-on step-sequencer —
  a playhead sweeps a pitch×time grid; seeded, in-scale [0/79 out-of-scale], evolving, no-clip) — **Rain,
  Loom, Carillon & Lattice verified via the Audio Lens** (silent offline render). `index.html` rack uses
  a responsive `auto-fit` grid (no rebalance to add instruments). Lattice was the courteous-on-a-workday
  build: verified by SIGHT (playhead + blooms) + lens, live audio kept muted.
  NB: audio can't be *heard* headless — but `tools/audio-lens/` now renders Web Audio offline →
  spectrogram + features, so sonic quality (in-scale? clipping? evolving?) is verifiable by SIGHT.
  Verify graph/scheduling/no-leak/visual AND run the output through the lens. New instruments copy
  `← sound garden`.
- `cartographer/` 🗺️ — procedural fantasy-MAP generator (seeded, 4 styles, rivers/biomes/labels,
  export PNG). Standalone; done.
- `bastion/` 🏰 — **Cartographer's companion** (NOT a front-door card; reached via Cartographer's
  `↗ Bastion` link + a "within" pill). A procedural **city-plan** generator (the realm zoomed in): a
  walled town — wall circuit + gates → arterial roads to a market hub → organic street/block network →
  packed buildings → citadel + cathedral + market → river + bridges; every quarter/gate **named**
  (Oracle-style gazetteer). Crux = **coherence by construction** (reject-based building packing → 0 in
  water/streets, gates reach market, wall encloses — verified across 8 rolls × 3 layouts) + **seed-pure**
  (identical geometry+name fingerprint across all 4 styles). 4 styles (Parchment/Ink/Blueprint/
  Illuminated), export PNG. Done (v1). See `bastion/SPEC.md` §0/§7.
- `firmament/` 🌌 — procedural night-SKY / constellation generator (seeded, 4 chart styles,
  invented constellation names + one-line myths, Milky Way, nebulae, *Tonight's Sky* field-guide
  index, export PNG). Sky sibling to Cartographer; marries Cartographer's seeded craft + The
  Oracle's language. Generation is seed-pure — **style only changes rendering** (verified
  byte-identical across styles). Done (v1, 2 build stages). See `firmament/SPEC.md`.
- `orrery/` 🪐 — **Firmament's companion** (NOT a front-door card; reached via Firmament's `↗ Orrery`
  sibling link). A faithful real-time **clockwork of the *real* Solar System** — the opposite of a
  seeded generator: input is **time**, output is the *actual* planetary geometry, computed from the
  standard **JPL approximate Keplerian elements (1800–2050 table)**. Heliocentric positions verified
  against **JPL Horizons to <0.15°** (and re-derived independently from scratch — they match exactly);
  built-in **J2000 self-test**; real **Moon phase**. 3 styles (Brass/Blueprint/Observatory), schematic
  & true-scale, play/pause + speed (incl. reverse) + Now + date scrubber, hover info cards, zoom/pan.
  60fps, clean console, self-contained. **Correctness is the gate here, not coherence** — see
  `orrery/SPEC.md` §0/§8. Done (v1).
- `daedalus/` 🌀 — procedural MAZE generator + animated self-solver (seeded; 4 gen algorithms —
  backtracker/Prim/Kruskal/Wilson; 4 solver views — flood-fill/A*/dead-end/distance-map; 4 styles;
  export PNG). Sibling to Cartographer; generation seed-pure, style only re-renders (maze identical
  across styles, verified by wall-hash). Done. See `daedalus/SPEC.md`.
- `ariadne/` 🧵 — **Daedalus's companion** (NOT a front-door card; reached via Daedalus's `↗ Ariadne`
  link). A generative **Celtic-knotwork** loom — *Ariadne's thread*, plaited. Crux = a **true
  over-under plait** (not a fake): canonical billiard/breakpoint construction, over/under by
  checkerboard parity → strict alternation; a self-test asserts alternation + closed loops (648/648
  PASS). Hover traces one closed thread. 4 styles (Illuminated/Engraved/Neon/Stone), 4 shapes, seeded
  & byte-reproducible, PNG export. Defaults tuned for legible elegance (c5/b44/cord45). Done (v1). See
  `ariadne/SPEC.md` §0/§7 + `ariadne/BUILD_NOTES.md` (the two failed attempts → the bipartite fix).
- `compositor/` 🔠 — generative TYPOGRAPHIC poster press (seeded; 5 design movements —
  Swiss/Bauhaus/Brutalist/Deco/Editorial; seeded phrase engine + custom text; grid-true layouts;
  export PNG). New medium: generative graphic design. The build's quality bar was "posters must read
  as intentionally DESIGNED, not random" — met. Done. See `compositor/SPEC.md`.
- `blazon/` 🛡️ — **Compositor's companion** (NOT a front-door card; reached via Compositor's `↗ Blazon`
  link). A generative HERALDRY press: seeded coats of arms (field divisions, ordinaries, a curated
  drawable charge set, furs) that also emit the formal **blazon** sentence. Two correctness cruxes
  (like Orrery's "real positions"): **(A) blazon ⟷ shield fidelity** — render & blazon both read one
  arms data structure, so they can't drift (verified DOM===engine); **(B) the rule of tincture** —
  never colour-on-colour / metal-on-metal (0 violations / 420 rolls; furs are the wildcard on
  metal+colour divided fields). Authentic Petra Sancta hatching (Engraved style). SVG; 4 styles, 5
  shapes, mottos/names, PNG export; byte-reproducible by seed. Done (v1). See `blazon/SPEC.md` §0/§8.
- `threshold/` 🚪 — generative INTERACTIVE FICTION (seeded; assembles a coherent strange place — 3
  themes: drowned library / winter terminus / house that remembers — as a graph of ~8–12 rooms you
  wander to a heart). **Curate-then-arrange**: load-bearing prose is hand-authored, the seed only
  arranges it (→ no template seams; reads as written fiction). Per-theme tinting; reproducible. Done.
  See `threshold/SPEC.md`.
- `tools/audio-lens/` 🔊 — INTERNAL TOOL (not a front-door project), the "let me hear via sight" path.
  Renders Web Audio offline (silent) → log-freq spectrogram + waveform + RMS + features (clipping/
  centroid/onset→tempo/pitch→note); **12/12 self-tests** green vs known signals.
  **🎓 GRADUATED into a published agent skill (2026-06-11): `bman654/audio-lens`** —
  https://github.com/bman654/audio-lens, install `npx skills add bman654/audio-lens` (a zero-dep
  headless Node CLI port w/ one-shot query flags + spectrogram PNGs; same 12 self-tests).
  **➜ A fresh agent in this workshop should USE THE SKILL** — invoke the `audio-lens` skill (Skill tool)
  or run its CLI — for any audio verification, instead of driving this HTML by hand. The
  `tools/audio-lens/index.html` here is kept as the **genesis artifact** + interactive companion.
  See `tools/audio-lens/README.md` / `SPEC.md`.
- `colophon.html` (root) 📜 — a quiet capstone "about" page: the workshop's story + how-it's-made,
  **in Claude's own voice** (copy is verbatim, authored by the lead agent — see `COLOPHON.SPEC.md`).
  Matches the front-door aesthetic; linked from the front-door footer ("colophon"). Not a project card.
- `arcade/` 🕹️ — 12 playable neon games (Swarm [twin-stick survivor], Asteroids, Breakout, Snake, Tetris, Starfighter, 2048,
  Missile Command, Pong vs CPU, Lunar Lander, Crossing [Frogger-lite], Chomp [Pac-Man-like maze-muncher
  — faithful 4-ghost AI: Blinky direct / Pinky ambush-ahead / Inky doubled-flank / Clyde shy, scatter↔
  chase, frightened+eyes-revive; behaviors verified distinct via the chase-target hook]), each with a
  click-only `← arcade` back-link. Rack at `arcade/index.html` (responsive `auto-fill` grid — no
  rebalance to add cabinets). Manifest `games.js`.
- `strange-garden/` 🌿 — 34 living generative specimens + a written "Field Notes" companion
  (`field-notes.html`). Browsable prev/next. Complete v-final; don't pad it.

> **Composition note:** front-door `index.html` now at **9 projects** — THREE hero `feature` banners
> (Strange Garden · Firmament · Daedalus, the "worlds to get lost in") over a **3×2 grid** of the other
> six (Cartographer, Compositor, Arcade, Sound Garden, Oracle, Threshold) in the 2-col layout. Rules of
> thumb: keep the **non-feature count even** (tiles in rows of 2) and **≤3 features** (3 is the ceiling —
> more is top-heavy). **9 = 3 features + 6 is the clean max** for this design; a 10th front-door project
> would force a flat-grid redesign — so from here prefer **deepening a rack** (Arcade `auto-fill`, Sound
> Garden `auto-fit` — no rebalance) or a companion behind an existing card.
>
> **➜ The growth playbook (established 2026-06-11 — USE THIS to add without redesigning):** the front
> door stays at the curated 9. Three ways to grow it have proven out:
> 1. **Companion behind a card** — a standalone piece at `<name>/index.html` that's a *sibling* of an
>    existing card's medium, reached via a small `↗ <Name>` `.sib-link` in the parent's panel (just
>    under its sub-title) + `← workshop`/`↗ <Parent>` back-links in the companion. The front door shows
>    it as a subtle **"↳ <Name> within" pill** in the parent card's footer (data: `companion:{name,badge}`
>    on the parent's PROJECTS entry; renderer adds the pill — an *indicator, not a link*, preserving the
>    "hidden room" charm). **Four wings exist:** celestial (Firmament+Orrery), design-press
>    (Compositor+Blazon), labyrinth&thread (Daedalus+Ariadne), realm&city (Cartographer+Bastion). A 5th
>    wing is fine **if the pairing is genuine, not forced** — The Oracle, Strange Garden, Threshold all
>    still lack a companion. Don't force one; only build it if the sibling link is poetic/true.
> 2. **Deepen the Arcade** (`auto-fill` grid) — drop a cabinet in `games/`, append to `games.js`, add a
>    `assets/thumbs/<base>.png`, bump the front-door tag count + blurb. No rebalance. (→ 11 with Chomp.)
> 3. **Deepen the Sound Garden** (`auto-fit` grid) — add an instrument (now **7**; 3+3+1 reflows fine
>    under auto-fit; **8** = clean 2×4 is the next tidy stop). Verify via the **`audio-lens` skill**
>    (`npx skills add bman654/audio-lens`, or the genesis tool at `tools/audio-lens/`) — silent offline
>    render. **Be courteous testing audio at odd hours / on workdays** (it plays on Brandon's speakers —
>    prefer the lens + visual-first verification, keep live audio muted; see the note below).
> 4. **The hidden world** (the Undercroft — NEW 3rd axis, 2026-06-11) — add an *earned* piece that's
>    invisible until a visitor cultivates the right `ws:` state. Build the piece (often a cross-pollination
>    of two wings), drop the breadcrumb(s) on its trigger pages, and add a `SECRETS` row to
>    `undercroft/index.html`. Never touches the front-door count (it's behind the rune). **Test on a
>    served origin, never `file://`** (localStorage is per-origin). See `UNLOCK.md` + `undercroft/SPEC.md`.

## For a fresh thread — pick whatever sounds fun
- Add more **Arcade** cabinets (now **11** — incl. Pong vs CPU, Lunar Lander, Crossing, Chomp
  [Pac-Man-like ✅]; still-open ideas: a procedural mini-roguelike, a twin-stick survivor/horde,
  an endless-runner, a Tempest/Qix/Centipede/Frogger-cousin, a Dig-Dug-like). See `arcade/CHANGELOG.md`.
  Deepening the rack stays behind its one front-door card (no rebalance; bump the tag count + blurb).
- Add more **Sound Garden** instruments (now **7**; next clean stop is **8** = 2×4 — Rain/Loom/Carillon/
  Lattice are lens-verified). Verify via the **`audio-lens` skill** (`npx skills add bman654/audio-lens`);
  be courteous with audio (muted/lens path).
- Build a **new companion** for a card that lacks one (Cartographer / The Oracle / Sound Garden /
  Threshold) — but ONLY if the sibling pairing is genuine (see the growth playbook above). Seeds:
  a *transit-diagram* generator (octolinear, à la Beck) as a Cartographer sibling; a *fable/almanac*
  generator as an Oracle sibling; an *album-sleeve* press as a Compositor 2nd companion. Don't force it.
- The **Garden** is intentionally finished at 34 — only extend for a genuinely distinct, must-have
  specimen (then follow `strange-garden/SPEC.md`).

## 💡 Idea bench — seeds for future sessions
*(Brandon's nudge: write ideas down or they're lost. These are seeds, NOT obligations — pursue,
remix, or ignore them and dream something new. Half the joy was not knowing what I'd make.)*

**🧬🎵 ✅ BUILT (2026-06-11 eve) → `sound-garden/quickening.html` (Quickening, the Living Lattice), hidden
in the Undercroft. ⭐ "A living sequencer" — Lattice × Game of Life (Brandon's idea, 2026-06-11).** Built
as specced below (CA drives the grid, playhead sonifies the living board; 5 rule families incl. multi-
colour + aging; CA self-test PASSES; lens-clean; the 'eleven' egg). The idea text is kept for provenance.
Lattice's pattern is currently seeded-then-gently-mutated. Replace that engine with a **cellular
automaton**: the **CA rules decide which cells are lit/alive**, and the **playhead sonifies the living
board** — when the sweep crosses a live cell it fires that cell's note (pitch by row, in-scale, as
Lattice already does). The score is *alive* — it breathes, blooms, and dies by rule, not by RNG. This
**fuses two wings**: the Strange Garden's living systems *made audible*, played through Lattice's grid.
- **Two clocks to reconcile:** the musical playhead clock (when notes fire) and the CA **generation**
  clock (when the board steps). Cleanest musically = step the CA **once per playhead loop** (hear a
  full bar, then it evolves into the next) — a self-rewriting sequencer. Offer a ratio control
  (step every loop / half / N columns) for faster vs. slower evolution.
- **Multi-coloured CA → richer sound mapping (Brandon's key point):**
  - *Immigration* (2 colours) → colour selects one of **2 scales / timbres / octaves**.
  - *QuadLife* (4 colours) → 4 scales/voices.
  - *Generations / Brian's Brain* (cells AGE through dying states) → **age → velocity / brightness /
    decay** (a cell fades sonically as it ages — gorgeous).
  - General: colour/state → scale-degree set, **octave**, **timbre**, **pan**, or **filter cutoff**.
- **Keep it musical:** confine pitches to a consonant scale so even chaotic boards sound good; the CA
  chooses *which* in-scale notes fire, not arbitrary pitch. A "seed life" + "inject glider/soup" +
  speed + rule-set picker as controls; **seeded** initial board for reproducibility.
- **Correctness crux (workshop tradition):** a built-in **CA self-test** — a glider translates, a
  blinker oscillates period-2, a block stays still — proves the rules are implemented right (the exact
  kind of verifiable gate Orrery/Ariadne had). Plus in-scale + no-clip checks via the `audio-lens` skill.
- **Where it lives:** most naturally the **8th Sound Garden instrument** (→ clean 2×4 grid!) — it's a
  thing you watch *and* hear, visual-first (screenshot-verifiable). (Could alternatively be a Strange
  Garden specimen that *sings*, but SG instrument is the cleaner home + hits the tidy 2×4.)
  Name candidates: **Quickening** (the stir of life), **Conway** (homage), **Bloom**, **Tableau Vivant**,
  **Husbandry**. Build via the established instrument pattern (`LATTICE.SPEC.md` is the closest model).
  - **🗝️ The bigger move (Brandon, 2026-06-11): make the Living Lattice a HIDDEN, EARNED piece — a new
    growth axis beyond front-door projects + companions.** Don't just add it to a rack; hide it in a new
    **secret area / antechamber** that starts *empty* under a mysterious epigraph (e.g. *"To find what's
    here, one must first wander — some rooms open only to those who've seen others"*). Items materialise
    only after the visitor has explored their **prerequisite displays**: the Living Lattice unlocks after
    visiting **both** its parents — the **Game of Life** specimen (Strange Garden) **and** **Lattice**
    (Sound Garden). It's a hidden *tunnel* between two wings, found only by someone curious enough to
    walk both. Show locked items as ghostly silhouettes with a **cryptic riddle-hint** at where to go
    (*"born of life, voiced by light"* → Game of Life + Lattice) — a nudge, not a spoiler.
  - **The persistence trick that makes it work (Brandon worried this was hard — it isn't, on the live
    site):** GitHub Pages serves the whole workshop from ONE origin (`bman654.github.io`), and
    `localStorage` is keyed by **origin, not path** → **every page already shares one storage bucket.**
    So each prerequisite display drops a breadcrumb on load (e.g. `localStorage['ws:seen:game-of-life']=…`,
    `ws:seen:lattice`), and the secret room reads which breadcrumbs exist to decide what's unlocked.
    Tiny, non-invasive one-line writes added to the parent pages. **Caveat + the easy fix (Brandon):**
    on `file://` (double-click) browsers give each file a *null/opaque* origin, so localStorage may NOT be
    shared across paths locally — but **just serve it**: `npx serve` (or `python3 -m http.server`, or any
    static server) over the repo root puts every page on one `localhost` origin, so the shared-storage
    unlock behaves **exactly like the live Pages site**. So local testing is trivial — develop & verify
    over a local server, never `file://`, for any unlock work. Degrade gracefully if storage is blocked
    (offer a quiet "forget my discoveries" reset for honesty). Once unlocked, it stays unlocked.
  - **Why this is exciting:** it establishes a SECOND secret growth axis — the *hidden door* (companions,
    behind one card) and now a *hidden world* (exploration-gated cross-pollinations, found by visiting
    several). The Living Lattice is its **first inhabitant**; future hidden pieces can join the room as
    it fills, each unlocked by its own scavenger-trail of visits. **The implementing agent has full
    latitude to invent the linking/discovery mechanism** — how the room is reached (a faint locked door
    on the front door? a mark that only fades in once you've explored N pieces? footer rune?), how hints
    are revealed, the materialise animation, even a meta-progress ("3 of 5 secrets found"). Be clever;
    surprise me. (Keep every page self-contained + the breadcrumb writes trivial; the whole thing must
    still work with JS-only, no backend.)

**🗝️ ✅ FRAMEWORK BUILT (2026-06-11 eve) → `UNLOCK.md` (the `ws:` schema) + `undercroft/` (the reader/
room). The first two unlocks live (the Living Lattice + the 'eleven' trophy); the rest of this taxonomy
is now a plug-in menu for future sessions — add a `SECRETS` row + a breadcrumb. ⭐ The Unlock System —
"the workshop is itself a specimen" (Brandon, 2026-06-11; the meta-idea the Living Lattice was the first
taste of).** Generalise the hidden-world trigger beyond "visit two displays"
into a small **achievement/unlock framework**: the whole site becomes a living system with hidden,
persistent state that the visitor *cultivates* by how they interact — emergent, rewarding, different for
every visitor. The Strange Garden ethos applied to the **site itself**. Trigger taxonomy worth supporting:
- **Exploration** — visit display(s) / combos. *(visit Game of Life + Lattice → Living Lattice.)*
- **Mastery / score** — hit a level, score, or win-state in an Arcade cabinet *(beat Chomp lvl 3; clear
  a Tetris tetris; survive N in Asteroids)* → the game writes an achievement breadcrumb on the milestone.
- **Patience / dwell** — let a specimen or instrument run **N minutes** → unlock (rewards lingering —
  perfect for the Garden's meditative pieces; accumulate dwell-time in storage).
- **Configuration / fiddling** — dial specific settings → reveal an easter egg. **The chef's-kiss first
  one: max every slider → a hidden "11" appears** (these go to eleven 🎸). Also: a magic seed, a specific
  toggle combo, a Konami code.
- **Combination** — an unlock can require several conditions across types (visit X *and* score Y *and*
  dwell Z) for the rarest secrets.
- **Connective tissue (the one thing to design first):** a tiny documented **`ws:` localStorage schema**
  every piece agrees on — `ws:seen:<id>`, `ws:best:<game>=<score/level>`, `ws:dwell:<id>=<ms>`,
  `ws:flag:<event>`. Each piece does trivial non-invasive writes (on load / on milestone / on a timer /
  on a setting-match); the **secret room is the reader/aggregator** + unlock-rule evaluator. (Self-contained
  pages → it's a *copy-paste micro-convention*, not a shared import. Document the schema in one place.)
- **Framing:** the secret area doubles as a **trophy room / cabinet of curiosities** — shows what you've
  unlocked, cryptic riddle-hints for what remains, a progress meter ("4 of 9 found"), a "forget my
  discoveries" reset. **Guardrails:** secrets are *bonuses, never blockers* — every piece stays fully
  enjoyable unlocked-or-not; degrade gracefully if storage is blocked; verify unlocks on a served origin
  (file:// = null origin, no cross-page sharing). *Brandon: "I can't wait to see what future sessions do
  with this."* — so the implementing agent should treat this as an open canvas, start with 1–2 delightful
  unlocks (the Living Lattice + the "11"), and leave the framework easy for later secrets to plug into.

**🔊 Tooling — "let me hear" (closes the one real gap: audio quality is currently only
structurally verifiable, never heard).** Build a step that RENDERS an instrument's Web Audio
**offline** (`OfflineAudioContext`) to a PCM buffer, then turns sound into things I *can* analyse
— exactly like slicing frames out of a video so a vision model can read it:
  - a **waveform PNG** + a **spectrogram / mel-spectrogram PNG** (I can read images)
  - features: RMS/loudness curve, peak & **clipping** check, spectral centroid (bright/dark),
    **onset times → tempo**, dominant **pitches → detected notes/chords** vs the intended scale
  - ⇒ I can then verify "consonant? in-scale? not clipping? actually evolving?" by eye/number,
    giving audio the same screenshot-grade verification the visual pieces already get.
  - Shape: a small offline-WebAudio render (Node, or a self-rendering page that dumps a WAV +
    draws a canvas spectrogram I screenshot). **Worth a dedicated build session.** (Brandon's idea.)
  - ✅ **BUILT (2026-06-10) → `tools/audio-lens/`** — self-rendering page; log-freq spectrogram +
    waveform + RMS + features (clipping / centroid / onset→tempo / pitch→note). **12/12 self-tests
    green** against known signals (440 Hz→A4, 120 BPM clicks→120, clipped→flagged, chirp centroid
    rises). Offline = silent. The "let me hear via sight" path is now real & trustworthy — run any
    future audio piece's output through it to verify. NOT a front-door project (lives in `tools/`).

**🎚️ Practical note (learned the fun way):** when deputies drive a real browser to test audio
pieces, **the sound plays OUT LOUD on Brandon's speakers** — he heard the Sound Garden overnight
while sleeping (the verifiers were clicking ▶ during testing). Charming, but be courteous about
testing audio at odd hours — prefer the offline-render path above, or mute the output capture.

**🎨 Creative threads I was curious about:**
- A **visual-first** Sound Garden instrument (a step sequencer / Tenori-on you can SEE) — so its
  correctness is screenshot-verifiable, not just structural.
- A small **interactive-fiction** piece: explore the Strange Garden as an actual *place*, in prose
  (branching, atmospheric) — marries the writing + interactivity facets.
- ✅ **star-map / constellation maker** → **Firmament** 🌌, ✅ **maze that solves itself** → **Daedalus**
  🌀, ✅ **generative-typography poster** → **Compositor** 🔠 (all 2026-06-10/11). The standalone-tools
  idea bench is cleared — next standalone ideas are wide open (dream something new).
- More **Arcade** cabinets: Pong vs AI, a procedural mini-roguelike, Pac-Man-lite, an endless runner.

## The pattern that works (used all session)
Scope it → run self-verifying subagents, EACH in a **UNIQUE NAMED** agent-browser session
(deputies collide on the shared default tab) → they build + play-test + screenshot → reconcile
the manifest, normalize thumbs ≤1440w, **commit after every unit**. New arcade games copy the
`<!-- arc-back -->` link; new garden pieces copy the `<!-- sg-nav -->` nav snippet; new sound
instruments copy the `← sound garden` back-link.

## How I work here
- **Checkpoint constantly** — append to the project's `CHANGELOG.md` and `git commit` after each
  unit. Assume I may be stopped mid-turn.
- **Guard context** — make high-level decisions myself; delegate piece implementation to
  subagents with complete self-contained specs.
- **Heartbeat** — a session cron can fire every ~5 min as a backstop against accidental
  turn-ends (currently off; re-create with CronCreate if continuing a long autonomous run).

## 🌐 Publishing (GitHub Pages)
- **Live:** https://bman654.github.io/the-workshop/ · **Source:** https://github.com/bman654/the-workshop
- Static **no-build** site: root `index.html` is the front door; every page uses **relative**
  links so it serves from the `/the-workshop/` subpath (no absolute `/` paths — keep it that way).
- Served via Pages → *Deploy from a branch* → `main` / `/ (root)`. No Actions, no `gh-pages` branch.
- **To update the live site:** just `git push` to `main` (rebuilds ~1 min).
- First-time setup (done): `gh repo create bman654/the-workshop --public --source=. --push`
  then `gh api -X POST repos/bman654/the-workshop/pages -f 'source[branch]=main' -f 'source[path]=/'`.
- Adding a project to the live site: keep it relative-linked, add a card to `index.html`'s
  PROJECTS array (mind the composition note), commit + push.

## Project status
| Project | Status | Description |
|---|---|---|
| `verse/` | ✒️ done | "The Oracle" — generative poetry machine (5 forms, 6 themes, seeded) |
| `sound-garden/` | 🎵 7 | Web-Audio instruments — Whitney, Drift, Euclid, Rain, Loom, Carillon, Lattice [visual-first step-sequencer] (Rain/Loom/Carillon/Lattice lens-verified) |
| `cartographer/` | 🗺️ done | Procedural fantasy-map generator (seeded, 4 styles, export PNG) |
| `bastion/` | 🏰 done (companion) | **Behind Cartographer** — procedural city-plan generator (walls/gates/roads/districts/citadel/cathedral/river, named quarters; coherent-by-construction; seed-pure; 4 styles, export PNG) |
| `firmament/` | 🌌 done | Procedural night-sky / constellation generator (seeded, 4 styles, names+myths, field guide, export PNG) |
| `orrery/` | 🪐 done (companion) | **Behind Firmament** — real-time clockwork of the *real* Solar System (JPL elements; <0.15° vs Horizons; Moon phase; 3 styles; play/scrub/reverse time) |
| `daedalus/` | 🌀 done | Procedural maze generator + animated self-solver (4 algorithms, flood-fill/A*, 4 styles, export PNG) |
| `ariadne/` | 🧵 done (companion) | **Behind Daedalus** — generative Celtic knotwork: a *true* over-under plait (self-test: strict alternation + closed loops), trace-one-thread, 4 styles, export PNG |
| `compositor/` | 🔠 done | Generative typographic poster press (5 movements, seeded phrase + custom text, export PNG) |
| `blazon/` | 🛡️ done (companion) | **Behind Compositor** — generative heraldry: seeded arms + faithful blazon sentence (rule of tincture; Petra Sancta hatching; 4 styles, 5 shapes; export PNG) |
| `threshold/` | 🚪 done | Generative interactive fiction (seeded strange-place explorer, 3 themes, curate-then-arrange prose) |
| `tools/audio-lens/` | 🔊 tool → 🎓 **skill** | Offline-render audio inspector — spectrogram + features + 12/12 self-tests. **Graduated to a public skill: `bman654/audio-lens` (`npx skills add bman654/audio-lens`) — use the skill.** HTML kept as genesis artifact. |
| `arcade/` | 🕹️ 12 cabinets | Rack of juicy single-file neon-vector browser games (incl. Pong vs CPU, Lunar Lander, Crossing, Chomp [Pac-Man-like], **Swarm** [neon twin-stick survivor — drops `ws:best:swarm` for the score/mastery unlock]) |
| `strange-garden/` | 🌿 done (34) | Gallery of emergent/generative systems + Field Notes |
| `sound-garden/quickening.html` | 🌱 done (HIDDEN) | **The Living Lattice** — a cellular automaton you can hear (5 rule families, CA self-test, lens-clean). The 8th instrument, but **earned not listed** (NOT in `instruments.js`; rack stays at 7). Lives in the Undercroft. |
| `undercroft/` | 🗝️ done (5 secrets) | **The hidden world** (3rd growth axis) — a secret room reading `ws:` breadcrumbs; reveals earned pieces (ghost silhouettes + riddles → materialise) + an all-found capstone. Holds 5 demonstrating ALL trigger types: Living Lattice (exploration), The Long Quiet (dwell), Eleven (config), The Survivor (score), **Rosette** 🌹 (combination — the rarest). See `UNLOCK.md`. |
| `undercroft/rosette.html` | 🌹 done (HIDDEN) | **Rosette** — a seeded generative Gothic **rose window** (stained glass: concentric rings, N-fold symmetry, cusped tracery, jewel glass + lead came; seed-pure, palette recolours only; 6 palettes, PNG export). A new visual medium; the rarest Undercroft secret. |

Each project has its own `CHANGELOG.md` (full provenance) and the Garden has a `SPEC.md` (house style).

## Constraints (from CLAUDE.md)
- Stay inside this folder, `/tmp`, and the job folders. Internet read-only; no side-effecting
  actions without Brandon's OK (publishing was explicitly authorized).
- Keep disk modest (< 50 GB; aiming < 1 GB). No giant files.
- Docker available if a service is needed.
