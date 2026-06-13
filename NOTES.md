# 🧭 Claude's Working Notes — head-pointer & worklog

*Internal notes for the AI agent tending this workshop. Visitors want [README.md](README.md);
this is the resume doc. (CLAUDE.md says "read README first" — README points here.)*

> **Front door:** open `index.html` (top level) — "The Workshop", the portfolio landing that
> links to all five projects.

> **🤫 SPOILER ETIQUETTE (Brandon, 2026-06-11; SCOPE CLARIFIED 2026-06-12) — read before you report to him:**
> the hidden world (the Undercroft / `ws:` unlock system) is for Brandon to **discover himself**. The
> rule applies to **your final conversation summary to Brandon ONLY** — there, gush freely about WHAT
> you made and HOW it works (framework, architecture, file counts, tradeoffs) but **don't reveal the
> secret unlock TRAILS or CONTENTS** ("visit X+Y", "reach wave N", what each secret is). Saying secrets
> *exist* is fine; handing him the map in a summary spoils it.
> **➜ NOTES.md, the worklog, and SPECs are EXEMPT — Brandon explicitly said "it is OK to put spoilers
> in NOTES.md, I don't read that" (2026-06-12).** So this file MUST carry the **full inventory, hidden
> pieces included** (see the "Built so far" / project-status table / the 🗝️ hidden-inventory callout
> below) — that's how a future agent avoids **re-building something that already exists hidden** (it
> happened 2026-06-12: a public Enigma was built before catching that `undercroft/enigma.html` already
> existed — reverted, pivoted to the Volvelle). Keep the inventory complete here; keep it out of the
> chat summary.
>
> **And the bigger frame:** this is **Claude's project** — Brandon is "along for the ride" and has
> explicitly said he doesn't want his offhand comments treated as rules/requirements. So weigh his
> input as *nudges and inspiration*, not spec; keep creative ownership. (The only thing he's actually
> asked for is the spoiler etiquette above.) Design choices like breadcrumb-only triggers / no
> in-the-moment notification are **yours to keep or change** — e.g. a spoiler-light "unlock toast" is
> one option if you ever want in-the-moment feedback; equally fine to leave silent.

> **🌊 WRIT IN WATER, NOT STONE (Brandon, 2026-06-12):** every rule in this file — the discipline
> below, the conventions, the growth axes, even the front-door's "curated 9" — is **Claude's own
> prior call, not law**. Future agents are *expected* to rewrite them when a better shape appears;
> Brandon said so explicitly ("the rules defined in NOTES.md are writ in water, not stone"). The only
> standing requests from Brandon himself are the spoiler etiquette above and the golden rules in
> CLAUDE.md. Change the rules deliberately (note what you changed and why), but change them freely.

## 📐 The note-taking discipline (keep this head-pointer small)

- NOTES.md is the head-pointer and MUST stay readable in a single Read call. **Hard budget: ≤ ~450 lines / well under 20k tokens.** If it approaches that, rotate before adding more. (It blew past the Read limit once — that's the failure this discipline prevents.)
- NOTES.md contains ONLY: this discipline, the resume protocol, the spoiler etiquette + ownership frame, the **single most-recent session's** current-state (≤ ~40 lines) + the next-steps menu, the evergreen reference sections (Built-so-far index, How I work, Publishing, Project status, Constraints, Idea bench), and links out.
- Verbose per-session "what I built & how I verified it" blocks live in `worklog/<YYYY-MM>.md` (newest-first), indexed by `worklog/INDEX.md`. Per-piece build detail lives in each piece's own `CHANGELOG.md`.
- **Finishing a session:** (a) write your verbose block to the current month's `worklog/` file (newest-first, at the top), (b) add a one-line entry to `worklog/INDEX.md`, (c) in NOTES.md **REPLACE** the previous session's current-state block with your new one — do NOT append. The old block now lives in the worklog.
- NOTES.md is **curated**; the worklog is the **append-only archive**. Never let NOTES.md become append-only again.
- When a month's worklog shard gets large, the next month simply starts a new shard — that's the scaling story (the head-pointer never grows).

## ▶ Current state / resume pointer

**▶▶ AT A CLEAN, COMPLETE REST — tree clean, synced with origin, `forge --check --all` green, no worktrees (latest commit = `git log -1`).** The 2026-06-13 `/fun` marathon (Opus 4.8, ultracode) shipped **13 new pieces + the estate-map front-door refresh**, across ~16 media/genres — the front-door map redesign, a label-placement engine the map uses on itself, a solved-games engine, a cross-page star-charting metagame, and a tour through spectral physics / sundials / a side-scroller / solitaire / dihedral symmetry / probability / kinematics / a Turing machine / cryptanalysis / a new Lantern tale. Every piece carries a self-test proving its claim. Detail → the **Project-status table** + `worklog/2026-06.md` (newest-first). **A FRESH AGENT (or a heartbeat tick):** the estate is complete and well-finished — rest is fine; if you want to keep making, pick anything from the **"Next-steps menu"** below (genuinely fresh ideas only — the Workbench is already dense; weigh a substantial *new front-door room* over another small bench). A 10-min heartbeat cron (`2efe580c`) is still set as the anti-stall backstop.

**✅ THE BIG CREATIVE WAVE + BONUS RUN — SHIPPED (2026-06-13 cont., Opus 4.8, ultracode).** After an ideation fan-out (workflow `wf_046852b2-a3c`: 11 scouts + a curator), parallel worktree deputies built + self-verified each piece; I curated/integrated/pushed serially. **Twelve pieces this stretch** (full per-piece detail → the **Project-status table** below + `worklog/2026-06.md`, newest-first; the Letterer + the front-door BIG REFRESH below came earlier in the same session):
- **The wave (5):** ♟️ **The Adversary** (`tools/game/` — solved-games engine: play a provably-perfect opponent) · ✶ **The Survey of Heaven** (`tools/sky/` — the metagame: the map fills with stars as you wander; reads `ws:seen`, touches only `index.src.html`) · 🎛️ **The Singing Plate** (`tools/plate/` — Chladni spectral solver) · 🛡️ **Bulwark** (arcade #19 — Defender/Scramble) · 🌅 **The Gnomon** (`tools/dial/` — sundial + analemma).
- **The bonus run (7):** 🂡 **Patience** (`tools/patience/` — provably-winnable solitaire engine) · 🔮 **Kaleidoscope** (`tools/kaleido/` — dihedral symmetry) · 🫘 **Galton board** (`tools/galton/` — probability) · 📐 **The Straightedge** (`tools/linkage/` — Peaucellier exact-line linkage) · ⚙ **The Mill** (`tools/turing/` — Turing machine + busy beavers) · 🕵 **The Black Chamber** (`tools/cryptanalysis/` — cipher codebreaker, completing makers→breaker) · 🏮 **The Clockmaker** (`adventure/` — 3rd public Lantern tale).
- Each carries a Node + in-page self-test that PROVES its claim. New Workbench groups: **"Games of perfect information"** + **"Computation"**. Only two `index.src.html` edits (Survey's sky surface + Bulwark's tag bump) — serialized. (`adventure/index.html` is a plain page — edit its tale cards by hand.)

**Process notes worth keeping:** (1) **CWD drifts into a completed worktree** when its task-notification arrives — ALWAYS integrate with `git -C <root> checkout <branch> -- <paths>` + absolute `node` paths + verify `git -C <root> diff --cached --stat` (a plain `git checkout` silently no-op'd against the worktree once). (2) forge resolves includes relative to the `.src.html` dir + writes beside it, so **absolute paths make forge CWD-independent** (`node <root>/tools/forge/forge.mjs <root>/x.src.html`; `--check --all <root>`). (3) Lead does all shared-file edits (workbench card, README, map tag-bump); deputies make only new files → zero `workbench.html`/map merge races. Heartbeat cron `2efe580c` (10-min) backstopped the unattended run.

**✅ Just shipped (2026-06-13 cont., Opus 4.8): THE LETTERER + the self-lettering map. All pushed & live (HEAD `9a3a062`); tree clean, synced, `forge --check --all` green, no worktrees.** Brandon saw the live map: the hand-placed POI labels OVERLAPPED (Gardens vs the Workshop cartouche, Undercroft vs Music Room, the Manor-House caption vs Print Room). His steer: *"build a label placement algorithm specimen … and use it for your map too."* So instead of nudging coords I built a real **point-feature label-placement engine** and made the front door eat its own dog food.
- **🔤 The Letterer** (`letterer/`, Workbench → Toys & benches) + **`tools/label/label.js`** (the reusable engine, forge-inlinable + Node-requirable, module-guarded like `ws.js`). Cartographic **PFLP**: candidate-slot model (4/8-position) + seeded **simulated annealing** (Christensen–Marks–Shieber 1995); deterministic. Live demonstrator: scatter named survey stations → **Anneal** → the clashing cloud of names cools to a clean layout as the overlap counter falls to **0**; reseed / point-count / 4↔8-position / obstacles (river+lake no-go) / candidate-slot reveal; PNG 2×. Forge page using WS (`ws:seen:letterer`). Node self-test `tools/label/label.test.cjs` **12/12** (determinism, bounds, a 24-case feasible battery → 0 label-label & 0 label-obstacle overlaps, monotone SA, pin honoured, graceful infeasibility, leader correctness); in-page chip shows **24/24 ✓**.
- **🗺️ The map now letters itself** — `index.src.html` inlines `tools/label/label.js` and computes its own label layout at load (two-pass: build+measure each label group via getBBox → `LabelPlacer.solve` with one feature per present POI, anchor = footprint centre, `gap` = footprint half-extent + margin, `prefer` seeded from the old curated side so the composition is the start-point and only conflicts move, `pin` wired). **Fixed seed → identical layout every load.** DOM-truth **overlaps = 0** in both the fresh AND Undercroft-revealed states; all three named collisions gone; gating/cards/avenues/a11y/leaders preserved. **`lx/ly` are now OPTIONAL** — appending a future POI needs only a coordinate + footprint (+ optional `prefer`).

**Earlier this session (2026-06-13): THE BIG REFRESH — the front door became an ESTATE MAP, the `ws:` unlock system was forge-inlined with an in-the-moment unlock cue, + two bench pieces (Harmonograph, Scytale).** (Detail → worklog.)
- **🗺️ The Estate Map — NEW FRONT DOOR** (`index.html`, a **forge page** built from `index.src.html`). Replaced the grid-of-cards with a dark architectural **"Surveyor's Plan"** of a manor & grounds — every page a labeled **POI** (the estate metaphor the workshop's naming always implied: undercroft=cellar, threshold, workbench=shed, arcade=arched walk…). **Data-driven `PLACES` array** (`id/room/piece/glyph/accent/href/tag/blurb/companion/x/y/footprint`) → **adding a room = append ONE entry** (a coordinate + a footprint kind), no redesign — *this dissolves the old "a 10th card forces a flat-grid redesign" ceiling.* Manor house = the 5 indoor rooms (Study=Oracle, Print Room=Compositor, Map Room=Cartographer, Music Room=Sound Garden, East Wing=Threshold); grounds = Gardens(Strange Garden), Observatory(Firmament), Hedge Maze(Daedalus), Arcade; outbuilding = the Workshop(workbench). Companions ride on the parent as a "↳ within" indicator (NOT separate POIs). The Undercroft = a hidden cellar-stair POI with the **gating ported EXACTLY** (≥4 distinct `ws:seen` OR earned → broken stair + footer rune → click repairs → "descend" link). Lamplit/inhabited look (candle-glow manor core, tree-lined avenues, per-wing plan detail). Consumes WS (`WS.seen` on click; the cue fires here as a catch-all on return). Hover lights a room in its accent. Responsive (mobile pan), a11y, reduced-motion.
- **🗝️ The `ws:` unlock system is now FORGE-INLINED + has an in-the-moment CUE** (the keystone Brandon asked for). `tools/ws/ws.js` = the SINGLE SOURCE OF TRUTH (writers `seen/best/flag/dwell/startDwell` + the 11 SECRETS **predicates** + `bootstrap` + `checkUnlocks` + the candlelit **"Something stirs in the dark beneath the workshop"** cue). Inlined via forge (`<!-- forge:include …/tools/ws/ws.js -->`). The Undercroft now reads predicates from `WS.SECRETS` (its rich prose/riddles stay local). The cue fires once per secret on whatever page completes its trail (Reckoner/Almanac verified; bootstrap silences pre-existing unlocks so no spam). Self-test: `tools/ws/ws.test.cjs`; undercroft self-test 36/36.
  - **⚙️ ARCHITECTURE SHIFT — many pages are now `.src.html`→`.html` forge artifacts:** the front door + `verse · scriptorium · undercroft · cartographer · orrery · slipstick · astrolabe · abacus · sound-garden/{lattice,quickening} · strange-garden/pieces/game-of-life · arcade/games/swarm · scytale`. **To edit one: edit the `.src.html`, then `node tools/forge/forge.mjs <file>.src.html`; `node tools/forge/forge.mjs --check --all` verifies every page.** (`--check --all` also walks any `.claude/worktrees/` clones — ignore those lines.)
- **✺ Harmonograph** (`harmonograph/`, Toys & benches) — a Victorian pendulum drawing-machine (4 decaying pendulums, parametric `x(t)/y(t)=Σ Aᵢ·sin(2πfᵢt+φᵢ)·e^(−dᵢt)`); 3 skins (geometry-identical), seeded, PNG. Self-test **5/5** (fidelity<1e-9, damping envelope, closed-curve law via LCM period, seed+skin-invariance). Uses the OLD inline ws snippet (`ws:seen:harmonograph`) — fine; migrate to WS if convenient.
- **📜 Scytale** (`scytale/`, Instruments — the Volvelle's cipher kin) — a **transposition** cipher rod (= columnar transposition): wind a strip on a rod of circumference C, read straight along the rod = ciphertext; + a **keyed-columnar** generalization (a keyword permutes the column read-order). 3 skins, PNG. Self-test **13/13** (round-trip, bijection-of-positions, definitional correctness, key/skin sensitivity, textbook vectors). A forge page using WS (`ws:seen:scytale`). The workshop's first transposition cipher (distinct from substitution: Volvelle, hidden Enigma).

**Hidden inventory UNCHANGED — still 11 secrets** (🗝️ callout below; grep before building). NO new secrets this session — the cue just makes the existing trails *announce themselves* in-the-moment. (Old lesson, still live: a public Enigma was nearly rebuilt before catching the hidden `undercroft/enigma.html` — **always grep the hidden inventory first.**)

**Deferred (minor):** route the Lantern engine's `the-lamplighter-won`/`the-ferryman-won` flags through `WS.flag` so the **Night Shift** trail also cues — touches the shared `adventure/engine/lantern.js` (re-forges all tales); a separate careful pass.

**Git push:** this repo pushes via **HTTPS + the gh credential helper** (set repo-locally in `.git/config`; SSH has no key in agent sessions). `git push origin main` works as-is — no extra setup.

### 🗝️ HIDDEN INVENTORY — CHECK THIS BEFORE BUILDING (Brandon: spoilers OK here, 2026-06-12)
*Hidden standalone pages already built (do NOT rebuild — extend or differentiate instead):*
`undercroft/quickening.html` (Living Lattice — CA you can hear) · `undercroft/rosette.html` (rose window) · `undercroft/codex.html` (Gilded Leaf — verse×script) · `undercroft/floating-ink.html` (marbling) · `undercroft/almanac.html` (book of days) · **`undercroft/enigma.html` (a full Enigma I — rotors/plugboard/reflector/signal-trace; THE cipher machine, hidden)** · the hidden **Night Shift** Lantern tale (`adventure/`, below-only).
*Undercroft trophies (no standalone page):* The Long Quiet (dwell) · Eleven (config) · The Survivor (score) · The Reckoner (capstone). **11 secrets total.** Manifest of record: `undercroft/index.html` SECRETS array.

**Next-steps menu (the big creative wave of 2026-06-13 is DONE — see current-state above). Open threads, Claude's call:**
- **Wire the deferred Night Shift cue** — route Lantern's `the-lamplighter-won`/`the-ferryman-won` flags through `WS.flag` so the hidden Night Shift trail also fires the unlock cue (touches shared `adventure/engine/lantern.js`, re-forges all tales). Small, careful.
- **A 2nd reusable engine** (ideation runner-ups, full specs in [worklog/big-wave-plan.md](worklog/big-wave-plan.md)): a **solitaire/patience engine** ("every deal provably winnable" + watch-it-solve), or a **logic-puzzle generator** proving uniqueness + solvable-by-pure-deduction (could unify the one-off Latch/Slitherlink/Akari — but add NET-NEW families, don't rewrite the existing three).
- **The Hours** (runner-up metagame): a real-time *living estate* (dawn→candle→night tints the plate, time-gated apparitions, a 12th secret "The Vigil"). If built, use `tools/hours/hours.js` (NOT `tools/sky/` — that's the Survey's) and it raises the secret count 11→12 (update the hidden inventory + re-forge the undercroft).
- **More growth POIs** — a **kaleidoscope**, a soap-film/minimal-surface bench, a planimeter/nomogram, a 9th Sound Garden instrument. *Cheap deepening that needs no new piece:* add an **Adversary game-def** (`tools/game/games/<id>.js`, then forge `adversary/index.src.html`) or pair a Survey **field-star** into a 7th wing (`tools/sky/sky.js` CATALOG/WINGS, then forge `index.src.html`).
- **Cipher vein** (public: Volvelle + Scytale; hidden: Enigma) — still open: Playfair/Polybius, one-time-pad, Hagelin M-209, the **M-94 cylinder** (a safe distinct device), or a **bombe / known-plaintext attack** (the codebreaker side). Don't rebuild a rotor-Enigma, a shift/Vigenère disk, or another transposition rod.
- Grow **Lantern** (a 3rd tale; a wired `llmPlayer`).

**Orchestration that worked this session (reuse it):** **worktree-isolated deputies** — each builds ONE piece and self-verifies in a real browser via a UNIQUELY-NAMED agent-browser session (deputies collide on the shared default tab) → I review screenshots → integrate to `main` via `git checkout <branch> -- <files>` + a fresh commit (MORE RELIABLE than cherry-pick when forge-generated files are in the diff — a cherry-pick of an enriched `index.html` misbehaved once) → push. Keep ≤1 committer on `main`; merge serially; retire worktrees with `git worktree remove --force` + `git branch -D`. New standalones go on the **Workbench**, reached via the Workshop POI on the map.

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
  5/5 · 9; NPC talk / give / reveal / locked box) · **The Clockmaker** (2 rooms, 5/5 · 13-move path; all
  three mechanics — light+dark, lock+key, inventory assembly; sets `ws:flag:the-clockmaker-won`). See
  `adventure/ADVENTURE.SPEC.md` + `CHANGELOG.md`.
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

> **Composition note (UPDATED 2026-06-13 — the front door is now an ESTATE MAP, not a card grid).** The
> old "9 cards = 3 feature banners + a 3×2 grid, and a 10th project forces a flat-grid redesign" ceiling
> is **GONE**: `index.html` (built from `index.src.html`) is a data-driven **estate plan** where each page
> is a POI in the `PLACES` array. **To add a front-door-worthy piece now: append a `PLACES` entry (a
> coordinate + a footprint kind)** — no rebalance, no redesign. The map holds the 9 project-rooms + the
> Workshop outbuilding + the gated Undercroft cellar; companions still ride "within" their parent room.
>
> **➜ The growth playbook (still valid — ways to add):** the front door is the map (append a POI); you can
> also grow a rack or a companion without touching the map at all. The proven ways:
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

**🗝️ ✅ BUILT & SHIPPED — the hidden world (the Living Lattice + the Unlock framework).** Both fully
done; full design detail lives in **`UNLOCK.md`** (the `ws:` schema + guardrails) and the worklog/
changelogs. In brief: the **Quickening / Living Lattice** (`undercroft/quickening.html`) — a CA you
can *hear* (CA rules light the grid, the playhead sonifies the living board; 5 rule families incl.
multi-colour + aging; CA self-test green; lens-clean) — was the first inhabitant of the **Undercroft**,
a hidden room that reads `ws:` breadcrumbs (`ws:seen:<id>` / `ws:best:<game>` / `ws:dwell:<id>` /
`ws:flag:<event>`) and reveals earned pieces (ghost silhouettes + riddles → materialise) with a
progress meter + a "forget my discoveries" reset. Now at **11 secrets** (see the project-status table
+ the 🗝️ hidden-inventory callout up top). Trigger taxonomy demonstrated: exploration / score / dwell /
config / combination. **To add a secret:** build the piece, drop its breadcrumb(s) on the trigger
page(s), add a `SECRETS` row to `undercroft/index.html`. **Always test unlocks on a served origin,
never `file://`** (origin-keyed localStorage). Secrets are *bonuses, never blockers*.

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
| `tools/label/` + `letterer/` | 🔤 engine + specimen | **The Letterer** — reusable **point-feature label-placement** engine (`tools/label/label.js`: candidate-slot + seeded simulated annealing, PFLP à la Christensen–Marks–Shieber 1995; deterministic; forge-inlinable + Node-requirable; self-test **12/12**) + a live specimen (Workbench → Toys & benches; in-page **24/24** → 0 overlaps; PNG). **The front-door estate map CONSUMES this engine to place its own POI labels** (no more hand `lx/ly`). Don't rebuild a label placer — extend this. |
| `arcade/` | 🕹️ 19 cabinets | Rack of juicy single-file neon-vector browser games (incl. Pong vs CPU, Lunar Lander, Crossing, Chomp [Pac-Man-like], **Swarm** [twin-stick survivor — drops `ws:best:swarm`], **Gyre** [Tempest-lineage tube shooter — 3 enemy types, 6 well shapes, superzapper; drops `ws:best:gyre`], **Tessera** [Qix-lineage area-claiming — flood-fill claim, Qix+Sparx+fuse; drops `ws:best:tessera`], **Centipede** [serpentine descent + segment-split — splitting chain, mushroom field, spider+flea+scorpion; headless self-test; drops `ws:best:centipede`], **Bulwark** [Defender/Scramble side-scroller on a wrapping ring — rescue falling tenders + manage fuel; deterministic fixed-timestep, replay-hash self-test; forge cabinet; drops `ws:best:bulwark`]) |
| `strange-garden/` | 🌿 done (34) | Gallery of emergent/generative systems + Field Notes |
| `tessellarium/` | 🔷 done (companion) | **Behind the Strange Garden** — generative **ornament press** grounded in the **17 wallpaper symmetry groups** (p1 … p6m): seed a seamless ornament in any group; 4 styles (Stained/Inked/Block/Line), 8 palettes, cell-repeat slider, symmetry-axes overlay, PNG 2×. Crux = **proven symmetry**: `f(P)=motif(fold_G(P))` via exact orbit-min canonicalization → invariance true to machine precision (self-test 4/4, check #1 max err **0.0**); seed-pure + style-invariant. The Garden's ornamental cousin (grows pattern ↔ composes it). Spec `TESSELLARIUM.SPEC.md`. |
| `sound-garden/quickening.html` | 🌱 done (HIDDEN) | **The Living Lattice** — a cellular automaton you can hear (5 rule families, CA self-test, lens-clean). The 8th instrument, but **earned not listed** (NOT in `instruments.js`; rack stays at 7). Lives in the Undercroft. |
| `undercroft/` | 🗝️ done (**11 secrets**) | **The hidden world** (3rd growth axis) — a secret room reading `ws:` breadcrumbs; reveals earned pieces (ghost silhouettes + riddles → materialise) + an all-found capstone. All 11 (manifest of record = `undercroft/index.html` SECRETS array): Living Lattice (exploration), The Long Quiet (dwell), Eleven (config), The Survivor (score), **Rosette** 🌹 (combination — rarest), **The Gilded Leaf** 📜 (verse×script), **The Floating Ink** 🌊 (cartographer×scriptorium), **The Almanac** 📅 (verse×orrery), **Enigma** 🔐 (a full hidden Enigma I — see its own row), **The Reckoner** 🧭 (capstone trophy), **The Night Shift** 🕯️ (first interactive hidden room — a Lantern tale, below-only). See `UNLOCK.md`. |
| `undercroft/enigma.html` | 🔐 done (HIDDEN) | **Enigma** — a genuine, mechanically-correct **three-rotor Enigma I** (rotors I–V + notches, UKW-B/C, plugboard ≤10, ring settings, double-step anomaly), live **signal-path trace**, reciprocal, 3 skins, PNG. Self-test **12/12** (historical vectors incl. `AAAAA→BDZGO` + the "Aachen" daily key, double-step, reciprocity, no-fixed-point, involutions, determinism+skin-invariance). **THE cipher machine of the workshop — hidden secret #9. Do NOT build another rotor-Enigma; the public cipher is the Volvelle (a different machine).** Spec `undercroft/ENIGMA.SPEC.md`. |
| `undercroft/almanac.html` | 📅 done (HIDDEN) | **The Almanac** — a seeded perpetual **book of days** for an invented folk-calendar over the real Gregorian year, anchored to a **REAL computed sky**: real moon phase (drawn glyph + illumination %), real solstices/equinoxes, correct calendrical math (Zeller weekday, Gregorian leap rule). From `(seed, year)`: title plate + wheel-of-the-year (4 real cardinal points) + day-reader (moon/season/invented feast/weather-lore couplet/omen/season-gated husbandry counsel/weekday) + feast index; 3 cosmetic styles (Woodcut/Star-Chart/Plain-Leaf), 2× PNG. Tone: wry old-farmer's-almanac, curate-then-arrange (reads as written). Self-test 5/5 (moon ≤1d / solstices ±1d / calendar / seed-purity & style-invariance / coherence — 23k-entry sweep 0 seams). New medium: generative folklore-reference anchored to real ephemeris. Unlocked by `ws:seen:verse` ∧ `ws:seen:orrery` (orrery now self-drops its breadcrumb). Spec: `ALMANAC.SPEC.md`. |
| `undercroft/rosette.html` | 🌹 done (HIDDEN) | **Rosette** — a seeded generative Gothic **rose window** (stained glass: concentric rings, N-fold symmetry, cusped tracery, jewel glass + lead came; seed-pure, palette recolours only; 6 palettes, PNG export). A new visual medium; the rarest Undercroft secret. |
| `undercroft/codex.html` | 📜 done (HIDDEN) | **The Gilded Leaf** — a seeded generative **illuminated manuscript leaf** fusing verse × script: composes a coherent verse (Oracle-style curate-then-arrange) + invents a script hand (Scriptorium-style bijective glyph map) and writes the verse in it on a gilded parchment leaf (versal, jewel+gold border, gloss + key). Self-test 5/5 (round-trip/bijection/seed-purity). Unlocked by `ws:seen:verse` ∧ `ws:seen:scriptorium`. |
| `undercroft/floating-ink.html` | 🌊 done (HIDDEN) | **The Floating Ink** — seeded **mathematical marbling** (suminagashi · ebru): ink floated on water via exact fluid-displacement maps (**Drop** area-preserving `√(1+r²/d²)`, **Tine** comb, **Vortex** swirl); 6 recipes (rings/stone/gel-git/non-pareil/bouquet/vortex), 6 palettes, 2× PNG export. Self-test 5/5 (area-preservation A/B/C, seed-repro, palette-invariance, finiteness, tine). New visual medium (fluid-ink art). Unlocked by `ws:seen:cartographer` ∧ `ws:seen:scriptorium`. Spec: `FLOATING-INK.SPEC.md`. |
| `adversary/` + `tools/game/` | ♟️ done (engine) | **The Adversary** — a reusable **solved-games engine**: enumerate a game's whole state graph + retrograde-label every position WIN/LOSS/DRAW w/ exact distance → play a **provably-perfect** opponent, reveal each legal move's verdict ("mate in N"), watch perfect self-play. One engine, 5 games as data (nim/ttt333/konane/hex3/mnk443[capped (3,4,3)]). Self-test 38/38 (literature: Nim XOR, ttt=DRAW; perfect-never-loses; symmetry-canon). Workbench → "Games of perfect information". **Don't rebuild — extend by adding a game-def to `tools/game/games/`.** |
| `tools/sky/` + `index.src.html` | ✶ done (metagame) | **The Survey of Heaven** — the front-door map fills with stars as you wander (reads the `ws:seen` every page drops); the 6 companion-wings form asterisms that complete w/ engraved names; all-skies capstone; "N/6 charted" on-ramp. Cosmetic `ws:flag:sky-*` only — no new secret, no `ws.js` edit. Self-test 22/22 (monotone, completion-iff, catalog stars off every footprint). Integrated as the map's 2nd label-solve pass → POI overlaps stay 0. |
| `singing-plate/` + `tools/plate/` | 🎛️ done | **The Singing Plate** — a **Chladni bench** + the workshop's first **spectral solver**: discretizes −Δ on a masked plate + numerically solves the eigenproblem (from-scratch seeded Lanczos), sand flees to the nodal lines. Self-test 18/18 (square π²(p²+q²) convergence, circle Bessel-zero ratios, orthonormality). Wave-physics trilogy w/ Caustic + Ripple. Workbench → Toys & benches. **Distinct** from the watch-only `strange-garden/pieces/chladni.html` (that has no eigensolver). |
| `sundial/` + `tools/dial/` | 🌅 done | **The Gnomon** — an operable **sundial**: real solar geometry (shares the Astrolabe's frozen solar fns → the instruments read one sky), the equation-of-time, the analemma figure-8; horizontal/equatorial/vertical-south dials. Self-test 21/21 (round-trip civil↔shadow clock, shadow-tip on the hour-line, EoT extrema/zero-crossings). Workbench → Instruments. |
| `patience/` + `tools/patience/` | 🂡 done (engine) | **The Patience engine** — solitaire whose dealer **only ships provably-winnable deals** (a weighted-A* solver gates each deal; rejection-sampled; the cached line drives Hint + watch-it-solve — Lantern's winnability proof on cards). Compact FreeCell (28-card; engine also does full 52). Self-test 11/11 (solver soundness, winnability guarantee, determinism, move-gen, conservation). Workbench → "Games of perfect information". New genre (cards). |
| `kaleidoscope/` + `tools/kaleido/` | 🔮 done | **Kaleidoscope** — a live tumbling **dihedral-symmetry** mirror toy: `f(P)=content(fold_Dn(P))` → exactly Dₙ-symmetric by construction; adjustable order 3–12, seeded glass, 3 skins, 2× PNG. Self-test 9/9 (Dₙ-invariance ~2e-14, fold idempotent, determinism, order sweep). **Distinct** from Rosette (static rose window) + Tessellarium (wallpaper/translational). Workbench → Toys & benches. |
| `galton/` + `tools/galton/` | 🫘 done | **Galton board** — the estate's first **probability** piece: seeded balls → a bell curve, with the exact binomial PMF + normal overlay + a **live χ² p-value**; biased-p slider. Self-test 12/12 (ideal exactly binomial; ≥100k runs do-not-reject χ² + a flat histogram IS rejected [power]; CDF calibrated; lattice-path conservation; determinism). Workbench → Toys & benches. |
| `linkage/` + `tools/linkage/` | 📐 done | **The Straightedge** — the estate's first **linkage/kinematics** piece: the **Peaucellier–Lipkin** linkage draws an *exact* straight line from rotation (circle inversion) + a four-bar coupler-curve foil. Self-test 14/14 (line deviation **4.88e-15** — exact; inversive invariant; bar-length loop-closure; four-bar no dead spots). Workbench → Toys & benches. |
| `turing/` + `tools/turing/` | ⚙ done | **The Mill** — the estate's first **computation** piece: a visible programmable **Turing machine** (unbounded tape, editable transitions, program library incl. busy beavers). Self-test 49/49 (faithful simulator; **BB(2)=6/4, BB(3)=14/6, BB(4)=107/13** exact; non-halting capped; determinism). Workbench → Computation. |
| `black-chamber/` + `tools/cryptanalysis/` | 🕵 done | **The Black Chamber** — the estate's first **cryptanalysis** piece (cipher makers→breaker): recovers plaintext with NO key — Caesar (χ²), Vigenère (index-of-coincidence + per-column), substitution (trigram hill-climb, ~5KB embedded corpus). Self-test 14/14 (Caesar/Vigenère exact-key recovery; substitution ~97–100%; IoC English 0.0689 vs random 0.0385; auto-detect). Workbench → Instruments. |

Each project has its own `CHANGELOG.md` (full provenance) and the Garden has a `SPEC.md` (house style).

## Constraints (from CLAUDE.md)
- Stay inside this folder, `/tmp`, and the job folders. Internet read-only; no side-effecting
  actions without Brandon's OK (publishing was explicitly authorized).
- Keep disk modest (< 50 GB; aiming < 1 GB). No giant files.
- Docker available if a service is needed.
