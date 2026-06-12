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

## 📐 The note-taking discipline (keep this head-pointer small)

- NOTES.md is the head-pointer and MUST stay readable in a single Read call. **Hard budget: ≤ ~450 lines / well under 20k tokens.** If it approaches that, rotate before adding more. (It blew past the Read limit once — that's the failure this discipline prevents.)
- NOTES.md contains ONLY: this discipline, the resume protocol, the spoiler etiquette + ownership frame, the **single most-recent session's** current-state (≤ ~40 lines) + the next-steps menu, the evergreen reference sections (Built-so-far index, How I work, Publishing, Project status, Constraints, Idea bench), and links out.
- Verbose per-session "what I built & how I verified it" blocks live in `worklog/<YYYY-MM>.md` (newest-first), indexed by `worklog/INDEX.md`. Per-piece build detail lives in each piece's own `CHANGELOG.md`.
- **Finishing a session:** (a) write your verbose block to the current month's `worklog/` file (newest-first, at the top), (b) add a one-line entry to `worklog/INDEX.md`, (c) in NOTES.md **REPLACE** the previous session's current-state block with your new one — do NOT append. The old block now lives in the worklog.
- NOTES.md is **curated**; the worklog is the **append-only archive**. Never let NOTES.md become append-only again.
- When a month's worklog shard gets large, the next month simply starts a new shard — that's the scaling story (the head-pointer never grows).

## ▶ Current state / resume pointer

**Last shipped (2026-06-12, Fable): three FOUNDATIONS — the note-system rework, Lantern (a new medium), and forge (the code-sharing build).** All committed, pushed, live 200-confirmed. Working tree clean, all self-tests green.
- **Note-system rework** (the doc you're reading): NOTES.md had blown past the Read-tool limit (1162 lines / ~28k tokens) — a fresh agent couldn't load its own resume doc. Fixed by sharding (see the discipline above): NOTES.md → ~440 lines, the verbose history → `worklog/`. *First session to follow the rotation discipline — keep following it.*
- **Lantern** 🏮 (`adventure/`) — the workshop's **first interactive, *stateful* fiction**: pick a thing up, carry it, change the world (point-and-click, inventory, locks/light) — distinct from Threshold's read-only atmosphere. A **reusable engine** + a declarative **world-file** format, so new tales are authored as pure data + prose (no engine code). **Crux:** every tale is *provably winnable AND softlock-free* (the solver proves the win stays reachable from *every* reachable state); the same solver drives a **"▶ let it play"** auto-player (the bot foundation: `describeForAgent` + an `llmPlayer` stub await a future wiring). **Two tales shipped:** *The Lamplighter* (6 rooms, 5/5 · 16 moves) and *The Ferryman* (3 rooms, 5/5 · 9 moves — NPC talk, give-as-useOn, reveal-under-stone, locked box). On the **Workbench** in a *Tales* group — front-runner for the 10th front-door card at ~3 tales.
- **forge** 🔧 (`tools/forge/forge.mjs`) — the author-side build-inliner: one canonical engine, `forge:include` directives in a `<tale>.src.html`, self-contained shipped `.html` (banner-stamped). `--all` rebuilds every tale; `--check` detects stale shipped files (run it if you touch `engine/lantern.js` — then re-forge). *Self-contained is a property of the artifact, not the process.*

**Where the workshop stands:**
- **Front door:** deliberately UNCHANGED — still the **curated 9 cards / 7 companion pills** (companion axis FULL) / Arcade tag **"18 games"**.
- **Arcade:** **18 games** (…Vanguard #17 · Dig Dug #18). **Instrument trio:** Slipstick · Astrolabe · Abacus (footer `reckon · sky · count`). **Logic-puzzle trio:** Latch · Slitherlink · Akari (footer `puzzles`). **Tales:** Lantern (Workbench).
- **The Undercroft hidden world:** at **10 secrets** — incl. the capstone trophy **The Reckoner**. *(Spoiler etiquette: don't name its trails/contents when summarizing to Brandon.)*
- **Footer extras collapsed** into one **`the workbench`** door (→ `workbench/index.html`); all 9 card pages carry a `← workshop` back-link.

**Next-steps menu (clean growth axes):**
- **Grow Lantern** — a 3rd tale (a clock to be stilled · a house to be left · a tide turned — each just a world-file + a `.src.html` + `forge`); a **wired `llmPlayer`** → then a human+bot or 2-player world (Brandon's bot seed). At ~3 tales, promote Lantern to a **10th front-door card**.
- **Deepen the Arcade** — the **Defender/Scramble side-scroller** is the last obvious classic gap.
- **Add a hidden Undercroft secret/trophy** — many `ws:best:`/`ws:seen:` breadcrumbs ship un-trophied (incl. now `ws:flag:the-lamplighter-won`).
- **Grow another vein's family** — instruments: sundial/sector/nomogram · ciphers: Vigenère/M-209 · tactile: kaleidoscope/ripple-tank.
- **The bigger swing** — a 10th front-door standalone + the flat-grid redesign it implies.

New standalones go on the **Workbench index**, not as new front-door footer links.

*(Full session history → [worklog/INDEX.md](worklog/INDEX.md) and [worklog/2026-06.md](worklog/2026-06.md). Resume detail for any piece → its CHANGELOG.md.)*

## Built so far (all self-contained, zero-dep, browser-verified) — art, games, maps, writing, sound, verse
- `verse/` ✒️ — "The Oracle", a generative POETRY machine (5 forms × 6 themes, seeded, Copy).
  New medium: generative language. Verify the *text* reads as coherent, evocative poetry.
- `scriptorium/` 🖋️ — **The Oracle's companion** (NOT a front-door card; reached via the Oracle's
  `↗ Scriptorium` link + a "within" pill). A generative **invented-writing-system press**: from a seed it
  invents a complete, internally-consistent script (alphabet / abugida / syllabary / abjad) drawn in **one
  consistent hand** (shared nib/slant/x-height/stroke vocabulary → reads as a real script, not scribbles),
  renders a coined line in the hand + a romanization key. New medium: **generative orthography/calligraphy**
  (it invents letterforms — distinct from Compositor's *setting* of existing type). Crux = a built-in
  **self-test (4 checks)**: bijection (phoneme↔glyph), one-coherent-hand (shared primitives/metrics),
  round-trip fidelity (`readBack(render(text))===text` — "can't drift" à la Blazon), seed-purity /
  style-invariance. Manuscript / Lapidary / Codex styles, seed-reproducible, PNG export. Done (v1, committed
  `5508f48`).
- `sound-garden/` 🎵 — generative AUDIO-visual instruments (Web Audio, synth only). **Eight (a clean 2×4):**
  Whitney (orbital polyrhythm), Drift (ambient pad), Euclid (Euclidean rhythm), Rain (in-scale rain
  on a tuned pool), Loom (evolving chord progressions on plucked Karplus-Strong strings), Carillon
  (inharmonic bells in change-ringing permutations), Lattice (**visual-first** Tenori-on step-sequencer —
  a playhead sweeps a pitch×time grid; seeded, in-scale [0/79 out-of-scale], evolving, no-clip), Gamelan
  (**visual-first** interlocking **kotekan** — polos+sangsih weave into one gap-free pulse — on inharmonic
  bronze metallophones tuned to slendro/pelog; self-test 3/3) — **Rain,
  Loom, Carillon, Lattice & Gamelan verified via the Audio Lens** (silent offline render). `index.html` rack uses
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
- `adventure/` 🏮 — **Lantern**, a reusable ENGINE for interactive, *stateful* fiction (point-and-click,
  inventory, locks/keys, light/dark) — the workshop's first *you-change-the-world* adventure, distinct
  from Threshold's read-only atmosphere. New medium + a foundation: tales are authored as a declarative
  **world-file** (pure data + prose; no engine code). Crux = a headless **solver** proving every tale
  *winnable AND softlock-free* (reverse-reachability: win reachable from every reachable state) — the IF
  analog of Latch's "provable by logic"; same solver drives a **"let it play"** auto-player (the bot
  foundation: a player is `(state, legalActions, world)→action`; `describeForAgent` + `llmPlayer` stub
  for a future model). Built author-side by **forge** (`tools/forge/forge.mjs` — one canonical engine
  inlined per tale; `--check` detects stale shipped files). On the **Workbench** (Tales group), NOT a
  front-door card (yet). Tales: **The Lamplighter** (6 rooms, 5/5 · 16) · **The Ferryman** (3 rooms,
  5/5 · 9; NPC talk / give / reveal / locked box). See `adventure/ADVENTURE.SPEC.md` + `CHANGELOG.md`.
- `theogony/` ⚡ — **Threshold's companion** (NOT a front-door card; reached via Threshold's
  `↗ Theogony` link + a "within" pill). A generative **mythology engine**: from a seed → an invented
  **pantheon** (~10–18 gods, 3–5 generations) drawn as an illuminated celestial **genealogy**. Coined
  names from a per-pantheon sound-system; distinct domains with opposing pairs; epithets; parentage;
  consorts; an origin-myth per god referencing only that god's real kin/domains. Crux = a built-in
  **self-test (4 checks)**: acyclic descent (DAG + monotonic generations), referential integrity
  (the prose can't drift from the graph), domain coherence, seed-purity/style-invariance.
  Star-Chart / Illuminated / Stone styles, click-to-read panel, seed-reproducible, PNG export. Done
  (v1, committed `800ed47`). See `theogony/THEOGONY.SPEC.md`.
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
- `arcade/` 🕹️ — 14 playable neon games (Tessera [Qix-lineage area-claiming — grid flood-fill claim,
  Qix ribbon + Sparx + fuse, slow-draw 2×, target 75%; drops `ws:best:tessera`],
  Gyre [Tempest-lineage tube/well shooter — 3 enemy archetypes
  Flipper/Spiker/Fuseball, 6 cycling well shapes, superzapper, tube-zoom level transition; drops `ws:best:gyre`],
  Swarm [twin-stick survivor], Asteroids, Breakout, Snake, Tetris, Starfighter, 2048,
  Missile Command, Pong vs CPU, Lunar Lander, Crossing [Frogger-lite], Chomp [Pac-Man-like maze-muncher
  — faithful 4-ghost AI: Blinky direct / Pinky ambush-ahead / Inky doubled-flank / Clyde shy, scatter↔
  chase, frightened+eyes-revive; behaviors verified distinct via the chase-target hook]), each with a
  click-only `← arcade` back-link. Rack at `arcade/index.html` (responsive `auto-fill` grid — no
  rebalance to add cabinets). Manifest `games.js`.
- `strange-garden/` 🌿 — 34 living generative specimens + a written "Field Notes" companion
  (`field-notes.html`). Browsable prev/next. Complete v-final; don't pad it.
- `tessellarium/` 🔷 — **the Strange Garden's companion** (NOT a front-door card; reached via the
  Garden's `↗ Tessellarium` header link + a "within" pill). A generative **ornament press** grounded in
  the **17 wallpaper symmetry groups** (p1 … p6m): seed a seamless, infinite, edge-to-edge ornament in
  any plane group; 4 render styles (Stained/Inked/Block/Line), 8 curated palettes, cell-repeat slider,
  optional symmetry-axes overlay, seed-reproducible, PNG 2× export; caption names each group's IUC
  symbol + orbifold. New medium: **provably-symmetric ornament** (distinct from the Garden's *living*
  pattern specimens — it composes pattern by symmetry law). Crux = **proven symmetry**: the field is
  `f(P)=motif(foldToFundamentalDomain_G(P))` with the fold an **exact orbit-min canonicalization** (each
  group's closed affine element set precomputed by BFS closure), so `fold(P)==fold(g·P)` to machine
  precision *by construction* — self-test 4/4 (check #1 symmetry-invariance max err **0.0**; tiles +
  point-group order; seed-pure + style-invariant; finite). Done (v1). See `TESSELLARIUM.SPEC.md`.

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
>    "hidden room" charm). **Six wings exist:** celestial (Firmament+Orrery), design-press
>    (Compositor+Blazon), labyrinth&thread (Daedalus+Ariadne), realm&city (Cartographer+Bastion),
>    verse&script (The Oracle+Scriptorium), and garden&ornament (Strange Garden+**Tessellarium** 🔷 —
>    the Garden grows pattern, the press composes it by symmetry law). A 7th wing is fine **if the pairing
>    is genuine, not forced** — **Threshold** is now the only front-door card without a companion (don't
>    force one; only build it if the sibling link is poetic/true).
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
- Build a **new companion** for a card that lacks one (Sound Garden / Threshold) — but ONLY if the
  sibling pairing is genuine (see the growth playbook above). Seeds: an *album-sleeve* press as a
  Compositor 2nd companion; a 2nd Oracle sibling (a *fable/almanac* generator). Don't force it.
- The **Garden** is intentionally finished at 34 — only extend for a genuinely distinct, must-have
  specimen (then follow `strange-garden/SPEC.md`).

## 🧹 Coherence pass — DONE 2026-06-12 ~08:10 CDT (decided & executed; this is Claude's call to make — see memory [[i-own-all-project-calls]])
Both items below were briefly (wrongly) parked "for Brandon's call." Brandon corrected that — *this is Claude's
project; make the calls.* So they were decided and shipped (commit on `main`, browser-verified, live 200):
- **Footer sprawl → a Workbench.** The front-door footer's six scattered toy/instrument links
  (puzzles/weave/light/reckon/sky/count) were collapsed into ONE **`the workbench`** door → new
  **`workbench/index.html`** (a calm index room grouping Puzzles / Toys & benches / Instruments). Footer is now
  `the workbench · colophon · source`. The standalone pages keep their own `← workshop` back-links; the hidden
  rune logic was left untouched (verified still firing).
- **Back-link consistency.** Added a `← workshop` back-link to all 6 card pages that lacked one (strange-garden,
  firmament, daedalus, arcade, cartographer, compositor), each styled to match its page (absolute top-left on
  the full-bleed pages; in-panel above the title on the panel pages). Verified visible, navigating, collision-free,
  0 console errors on every page.

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
| `scriptorium/` | 🖋️ done (companion) | **Behind The Oracle** — generative invented-writing-system press: from a seed invents a complete script (alphabet/abugida/syllabary/abjad) in one consistent hand + a romanization key (self-test: bijection, one-hand, round-trip, seed-purity); Manuscript/Lapidary/Codex, seed-reproducible, export PNG |
| `sound-garden/` | 🎵 8 (2×4) | Web-Audio instruments — Whitney, Drift, Euclid, Rain, Loom, Carillon, Lattice [visual-first step-sequencer], Gamelan [interlocking kotekan on inharmonic slendro/pelog metallophones — visual-first; lens-verified silent] (Rain/Loom/Carillon/Lattice/Gamelan lens-verified) |
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
| `arcade/` | 🕹️ 15 cabinets | Rack of juicy single-file neon-vector browser games (incl. Pong vs CPU, Lunar Lander, Crossing, Chomp [Pac-Man-like], **Swarm** [twin-stick survivor — drops `ws:best:swarm`], **Gyre** [Tempest-lineage tube shooter — 3 enemy types, 6 well shapes, superzapper; drops `ws:best:gyre`], **Tessera** [Qix-lineage area-claiming — flood-fill claim, Qix+Sparx+fuse; drops `ws:best:tessera`], **Centipede** [serpentine descent + segment-split — splitting chain, mushroom field, spider+flea+scorpion; headless self-test; drops `ws:best:centipede`]) |
| `strange-garden/` | 🌿 done (34) | Gallery of emergent/generative systems + Field Notes |
| `tessellarium/` | 🔷 done (companion) | **Behind the Strange Garden** — generative **ornament press** grounded in the **17 wallpaper symmetry groups** (p1 … p6m): seed a seamless ornament in any group; 4 styles (Stained/Inked/Block/Line), 8 palettes, cell-repeat slider, symmetry-axes overlay, PNG 2×. Crux = **proven symmetry**: `f(P)=motif(fold_G(P))` via exact orbit-min canonicalization → invariance true to machine precision (self-test 4/4, check #1 max err **0.0**); seed-pure + style-invariant. The Garden's ornamental cousin (grows pattern ↔ composes it). Spec `TESSELLARIUM.SPEC.md`. |
| `sound-garden/quickening.html` | 🌱 done (HIDDEN) | **The Living Lattice** — a cellular automaton you can hear (5 rule families, CA self-test, lens-clean). The 8th instrument, but **earned not listed** (NOT in `instruments.js`; rack stays at 7). Lives in the Undercroft. |
| `undercroft/` | 🗝️ done (8 secrets) | **The hidden world** (3rd growth axis) — a secret room reading `ws:` breadcrumbs; reveals earned pieces (ghost silhouettes + riddles → materialise) + an all-found capstone (now needs all 8). Holds 8, ALL trigger types demonstrated: Living Lattice (exploration), The Long Quiet (dwell), Eleven (config), The Survivor (score), **Rosette** 🌹 (combination — rarest), **The Gilded Leaf** 📜 (exploration-combo — cross-pollination #1), **The Floating Ink** 🌊 (exploration-combo — cross-pollination #2), **The Almanac** 📅 (exploration-combo — cross-pollination #3). See `UNLOCK.md`. |
| `undercroft/almanac.html` | 📅 done (HIDDEN) | **The Almanac** — a seeded perpetual **book of days** for an invented folk-calendar over the real Gregorian year, anchored to a **REAL computed sky**: real moon phase (drawn glyph + illumination %), real solstices/equinoxes, correct calendrical math (Zeller weekday, Gregorian leap rule). From `(seed, year)`: title plate + wheel-of-the-year (4 real cardinal points) + day-reader (moon/season/invented feast/weather-lore couplet/omen/season-gated husbandry counsel/weekday) + feast index; 3 cosmetic styles (Woodcut/Star-Chart/Plain-Leaf), 2× PNG. Tone: wry old-farmer's-almanac, curate-then-arrange (reads as written). Self-test 5/5 (moon ≤1d / solstices ±1d / calendar / seed-purity & style-invariance / coherence — 23k-entry sweep 0 seams). New medium: generative folklore-reference anchored to real ephemeris. Unlocked by `ws:seen:verse` ∧ `ws:seen:orrery` (orrery now self-drops its breadcrumb). Spec: `ALMANAC.SPEC.md`. |
| `undercroft/rosette.html` | 🌹 done (HIDDEN) | **Rosette** — a seeded generative Gothic **rose window** (stained glass: concentric rings, N-fold symmetry, cusped tracery, jewel glass + lead came; seed-pure, palette recolours only; 6 palettes, PNG export). A new visual medium; the rarest Undercroft secret. |
| `undercroft/codex.html` | 📜 done (HIDDEN) | **The Gilded Leaf** — a seeded generative **illuminated manuscript leaf** fusing verse × script: composes a coherent verse (Oracle-style curate-then-arrange) + invents a script hand (Scriptorium-style bijective glyph map) and writes the verse in it on a gilded parchment leaf (versal, jewel+gold border, gloss + key). Self-test 5/5 (round-trip/bijection/seed-purity). Unlocked by `ws:seen:verse` ∧ `ws:seen:scriptorium`. |
| `undercroft/floating-ink.html` | 🌊 done (HIDDEN) | **The Floating Ink** — seeded **mathematical marbling** (suminagashi · ebru): ink floated on water via exact fluid-displacement maps (**Drop** area-preserving `√(1+r²/d²)`, **Tine** comb, **Vortex** swirl); 6 recipes (rings/stone/gel-git/non-pareil/bouquet/vortex), 6 palettes, 2× PNG export. Self-test 5/5 (area-preservation A/B/C, seed-repro, palette-invariance, finiteness, tine). New visual medium (fluid-ink art). Unlocked by `ws:seen:cartographer` ∧ `ws:seen:scriptorium`. Spec: `FLOATING-INK.SPEC.md`. |

Each project has its own `CHANGELOG.md` (full provenance) and the Garden has a `SPEC.md` (house style).

## Constraints (from CLAUDE.md)
- Stay inside this folder, `/tmp`, and the job folders. Internet read-only; no side-effecting
  actions without Brandon's OK (publishing was explicitly authorized).
- Keep disk modest (< 50 GB; aiming < 1 GB). No giant files.
- Docker available if a service is needed.
