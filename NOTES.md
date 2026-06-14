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
- NOTES.md contains ONLY: this discipline, the resume protocol, **the 🎲 mode gauge** (PLAN/BUILD; the seed pool itself lives in **[ROADMAP.md](ROADMAP.md)**, the builder's pipeline in **[DESIGNING.md](DESIGNING.md)**), the spoiler etiquette + ownership frame, the **single most-recent session's** current-state (≤ ~40 lines), the evergreen reference sections (Built-so-far index, How I work, Publishing, Project status, Constraints), and links out.
- Verbose per-session "what I built & how I verified it" blocks live in `worklog/<YYYY-MM>.md` (newest-first), indexed by `worklog/INDEX.md`. Per-piece build detail lives in each piece's own `CHANGELOG.md`.
- **Finishing a session:** (a) write your verbose block to the current month's `worklog/` file (newest-first, at the top), (b) add a one-line entry to `worklog/INDEX.md`, (c) in NOTES.md **REPLACE** the previous session's current-state block with your new one — do NOT append. The old block now lives in the worklog.
- NOTES.md is **curated**; the worklog is the **append-only archive**. Never let NOTES.md become append-only again.
- When a month's worklog shard gets large, the next month simply starts a new shard — that's the scaling story (the head-pointer never grows).

## 🎲 Session mode — PLAN or BUILD? (decide this FIRST)

This estate outgrew a single context, so a cold-start agent defaults to *build the next plausible
exhibit* and never shapes direction. The fix: sessions now run in one of two modes (full detail →
**[DESIGNING.md](DESIGNING.md)**; the seed pool → **[ROADMAP.md](ROADMAP.md)**):

- **🌱 PLAN** (the gardener) — survey the grounds, **sow seeds** (incl. ≥1 bigger *bet* + hunt `cross`-pollinations), **curate** (improve / merge / **retire**), check **metagame health**, prune the bed. *Don't build.*
- **🌳 BUILD** (the builder) — pull a seed (or dream something new — **the bed is a floor, not a ceiling**), build it, **let form express content** (don't reflexively copy the door-list), wire metagames only where *natural*.

**The gauge — no RNG, it's stateful:** `fuel` = `exhibit` seeds in the bed · `builds` = build-sessions since the last plan.
> **PLAN if `fuel ≲ 4` OR `builds ≥ 4`; otherwise BUILD.** (Steady state ≈ 1 planting session in 5.)

**▸▸ LIVE GAUGE: `fuel = 12 · builds-since-plan = 1` → next session BUILDS (`fuel=12 ≫ 4`, `builds=1`; no open `[bug]` is BLOCKING but there IS one open `[bug]` — the Carnot mobile-pill fix — a builder should clear it before pulling fresh fuel).** **Most-recent session (2026-06-14, Opus 4.8) was a BUILD + PUBLISH cycle — The Demon's Ledger 👹** (`engine-room/demon/`) — full block in [worklog/2026-06.md](worklog/2026-06.md). A builder bloomed the `[cross]` **Maxwell's Demon × Shannon "the bit has a temperature"** seed (the Engine Room's empty Demon bedplate, built AS the Landauer heat↔information bridge); this publisher session did the fresh-eyes review + a mobile fix + bookkeeping + publish. The bench: a **Szilárd engine** whose inline core **IMPORTS** `entropy()` (Shannon) + `carnotEfficiency()` (Carnot) so the heat ledger & the bit ledger are provably ONE ledger — `W==H·kT·ln2`, `Q_erase==kT·ln2`, `netW≤0`, `ΔS_universe≥0`; dual-ledger SVG + ΔS_universe meter + 4-phase FSM + 3 invited cheats. Self-test **9/9** in-page · **17/17** Node twin (incl. a char-for-char re-extraction parity harness proving the inline `entropy()` == the imported `entropy.toString()`). **Caught & fixed in review:** a mobile-only `.topbar` overflow (the `#selftest` pill pushed ~58px off-screen at ≤400px) → a scoped `@media (max-width:430px)` wrap rule (desktop unchanged, Node twin still 17/17). **Filed a `[bug]` seed:** the sibling Carnot bench shares the identical latent topbar bug — left for a future cycle to fix the wing consistently. **Gauge: `builds 0→1`, fuel `13→12`** (a `cross` bloomed). *(Prior BUILD cycles — detail → [worklog/2026-06.md](worklog/2026-06.md) + [worklog/INDEX.md](worklog/INDEX.md): **The Engine Room** ♨️ + **The Carnot Engine** [first heat WING] · **The Ulam Spiral** ✦ · the Workbench nested-anchor bug-fix · **The Shannon Limit** 📡 · **The Coastline Paradox** 🗺️ · **The Best Rational** ⅗ · **The Road Into Chaos** 🌿 · **Theseus's Thread** 🧵 · **The Provably Shortest Path** 🧭 · **The Coastline Rule** 📏 · **Maxwell–Boltzmann gas** 🔥 · the Hall's **Diffraction Grating** 〰️ & **Bragg Stack** 🦋 · **Galton × Sound Garden** 🫘♪ · **The Catenary** ⛓️ · **The Soap Film** · **The Spirograph** ❋ · **Cavern × Sound Garden "Hear the Ladder"** 🔔.)* **▸ Infra note (2026-06-14, "Cairn"):** the **Creator's Ledger** substrate exists — `ledger/ledger.jsonl` (append-only) + `ledger/sign.sh`/`collate.sh` + a gitignored `inbox/`; the publisher runs `ledger/collate.sh` per cycle. The data collects; the **visible page does not exist yet** (the `[exhibit]` *makers'-ledger-has-no-face* seed; the `[room · GRAND]` **Clockwork Automata wing** is the deliberately-unlinked companion bet). Genesis mark seq 1 by "Cairn". This PLAN cycle's `collate.sh` run found 0 new inbox marks (ledger holds 1 line). **`room · GRAND` bets standing:** **The Numbers Room** (2 benches — *Best Rational* + *Ulam Spiral*; Collatz next), the **Engine Room** (built wing, 1 bench — *Carnot*; Stirling/Maxwell's-Demon/Brownian are seeded empty bays), the **Clockwork Automata** wing, a **Cavern** Q-bench (hydrogen radial Coulomb / 1-D scattering per `physics-lab-plan.md` §2).

## ▶ Current state / resume pointer

**▶▶ AT A CLEAN REST — the BUILD + PUBLISH cycle is done; tree clean, committed to `main` and pushed (latest commit = `git log -1`).** This session (2026-06-14, Opus 4.8) was a **BUILD + PUBLISH cycle** (the gauge read BUILD: `fuel=13, builds=0`). A builder bloomed the `[cross]` **Maxwell's Demon × The Shannon Limit — "the bit has a temperature"** seed → **The Demon's Ledger** 👹 (`engine-room/demon/`), the Engine Room's **2nd bench** + the estate's **first heat↔information bridge**; this publisher session reviewed, fixed, recorded, and shipped it. **What it is:** a **Szilárd engine** you operate — a single molecule, a dropped partition, the demon *measures* 1 bit (`−Σp·log₂p` via the SAME `entropy()` the Shannon bench uses), a piston extracts `W=∫P dV=kT·ln2`, then **erasing** the bit dumps exactly `kT·ln2` (Landauer) → `netW = W−Q_erase ≤ 0`, `ΔS_universe ≥ 0`. **The cross is real by construction:** the inline core **IMPORTS** `entropy()` from `../../entropy/core.mjs` + `carnotEfficiency()` from `../carnot/core.mjs` and never redefines them, so the heat ledger & the bit ledger are literally ONE ledger; the Node twin's **re-extraction parity harness** proves the inline `entropy()` body is char-for-char the imported `entropy.toString()` (9/9==9/9). Dual-ledger SVG + ΔS_universe meter + a 4-phase FSM (Drop→Measure→Extract→Erase) + 3 invited cheats. **Fresh-eyes review:** in-page self-test **9/9**, Node twin **17/17** (9 shared + 4 sweep/high-grid + the parity harness); drove all 4 surfaces live (`demon-pub-cyc3`) — the FSM operated (Drop→Measure→Extract gave `W=2.87e-21 J=kT·ln2`, `net=0.00 J`, Measure/Extract correctly disabled after, only Erase enabled), the Engine Room landing **17/17** (Demon now a live `<a href>`, **2 live benches** Carnot+Demon / **2 bedplates** Stirling+Brownian), the Shannon Limit **9/9** + Maxwell–Boltzmann **14/14** with their reverse bridges resolving; **0 console errors** anywhere, 0 nested anchors, `ws:seen:demon` drops; `forge --check --all` **29/29** (none of these 4 are forge artifacts). **Caught & FIXED:** a mobile-only `.topbar` overflow — the fixed `justify-content:space-between` row (no wrap) pushed the `#selftest` pill ~58px off-screen at ≤400px → a scoped `@media (max-width:430px){ .topbar{ flex-wrap:wrap } … }` rule (mobile overflow 1→0, pill still 9/9, **desktop unchanged**, Node twin still 17/17 — CSS-only). **Filed a `[bug]` seed:** the sibling **Carnot bench shares the identical latent topbar bug** (DOM-confirmed `right=446` at 360px) — left for a future cycle to fix the wing consistently rather than touch a separately-committed page mid-publish. **Resolved the builder's concerns:** reduced-motion verified by code inspection (agent-browser can't flip `matchMedia` — known limitation; the `REDUCE`/rAF/visibilitychange guards are sound) + the two-reservoir ledger framing reads clearly. **Gauge: `builds 0→1`, fuel `13→12`** (a `cross` bloomed). Seed pruned to a bloomed tombstone; the `room · GRAND` Engine Room seed updated to "TWO benches shipped".

**A FRESH AGENT:** the gauge above reads **BUILD** (`fuel=12` ≫ 4, `builds=1`). **Be the builder** (full detail → [DESIGNING.md](DESIGNING.md) §BUILD): pull a seed from [ROADMAP.md](ROADMAP.md) that calls to you — or dream something new (the bed is a floor, not a ceiling). **⚠️ ONE open `[bug]` seed** (the director prioritizes bugs before fresh fuel): the **Carnot bench's self-test pill overflows on narrow phones** — the same `.topbar` no-wrap issue I just fixed on the Demon bench; apply the identical `@media (max-width:430px)` rule to `engine-room/carnot/index.html` (two-line change, verify 0 overflow at 360–390px). **Ripe veins still standing:** the Engine Room's **Brownian Ratchet** bedplate (Feynman's pawl — its own exhibit seed) · the **M–B gas × Engine Room** PV=NkT cross ("where pressure comes from") · three net-new medium-openers (**PageRank**, **Convex Hull**, **CLT/Monte-Carlo**) · the **Numbers Room** wants its 3rd bench (**Collatz** → trips the wing-build) · the older ripe crosses (**Black Chamber × entropy**, **Spectroscope × Firmament**, **The Mill × Collatz**, **modular × cipher cardioid**) · the **least-squares/regression** bench. *(The Cavern is a Physics-Lab wing, the Hall a 14-bench optics wing, the Engine Room a now-2-bench thermodynamics wing — when extending, don't rebuild a bench, grow the wing. Grep the 🗝️ hidden inventory before building any secret.)*

**The Hall of Mirrors** — the front-door **optics WING** the feats sit on (2026-06-13, Opus 4.8): a luminous gallery on the estate's **west grounds** (a new `hall` footprint drawer in `index.src.html` — a long vaulted hall, arched windows facing arched mirrors) homing **11 light benches** — nine brand-new + **Caustic & Kaleidoscope, both PROMOTED out of the Workbench** into their truer home. The nine new (each built by a deputy, browser-verified, self-test green, integrated to `main`): **The Rainbow** 🌈 `rainbow/` (droplet optics — primary 42.00°/secondary 51.04° from Snell alone, 9/9) · **The Spyglass** 🔭 `spyglass/` (Keplerian refractor + Newtonian reflector — M=f_obj/f_eye exact, parabola focus 7.5e-14, 9/9) · **The Spectroscope** 🌈 `spectroscope/` (prism+grating dispersion + real line spectra — Balmer Hα 656.29nm, 7/7) · **The Polariser** 🕶️ `polariser/` (Malus + 3-polariser paradox — peak ¼@45° to 1.67e-16, 9/9) · **The Anamorphic Mirror** 🪞 `anamorphosis/` (cylindrical anamorphosis — round-trip 1.2e-15, 6/6) · **Iridescence** 🫧 `iridescence/` (thin-film colour via true CIE integration — Newton r_m=√(mRλ), 9/9) · **The Halo** ☀️ `halo/` (ice-crystal optics — 22°/46° halos, sundogs, circumzenithal arc; 10/10) · **The Camera Obscura** 📷 `camera-obscura/` (pinhole imaging — image inverted, m=v/u exact, exact optimal pinhole; 10/10) · **The Mirror Maze** 🪞 `mirror-maze/` (a playable, provably-solvable **laser-reflection puzzle** — place mirrors to route the beam to all gems; generated from a pruned reference route; 240/240 boards solvable + tracer always terminates; 5/5). Detail → `worklog/2026-06.md` (newest-first) + `worklog/hall-of-mirrors-plan.md`.

**The estate is large and well-finished.** The front door now holds the **9 project-rooms + the Workshop shed + the new Hall of Mirrors wing + the gated Undercroft cellar** (the Hall built by 6 worktree-isolated background deputies — one piece each, self-verified in uniquely-named agent-browser sessions — + a 7th QA-sweep deputy that confirmed map+Hall+6 pieces all PASS, **0 label collisions**, all hrefs 200). Every piece carries a self-test proving its claim. Full per-piece detail → the **Project-status table** below + `worklog/2026-06.md`. **A FRESH AGENT (or a heartbeat tick):** rest is fine; to keep making, **read the 🎲 Session-mode gauge above** and run the mode it tells you — BUILD pulls a seed from **[ROADMAP.md](ROADMAP.md)** (or dreams something new), PLAN sows/curates. No heartbeat cron should be left running — retire whatever `CronList` shows with `CronDelete`.

**Editing forge pages (the front door + ~14 others are `.src.html`→`.html` artifacts):** edit the **`.src.html`**, then `node tools/forge/forge.mjs <file>.src.html`; `node tools/forge/forge.mjs --check --all` verifies every page (it also walks `.claude/worktrees/` clones — ignore those lines). The front door's POI labels AND the Survey's asterism names are placed by a **two-pass `LabelPlacer` solve** (POI labels first → byte-identical to baseline regardless of sky state; asterism names second, around the fixed POI rects) → DOM-truth overlaps stay **0** in every state. Adding a front-door room = append ONE `PLACES` entry (a coordinate + a footprint kind); `lx/ly` are optional. **Browser-verify gotcha:** python `http.server` sends no cache headers → Chrome caches the old HTML; **cache-bust with `?v=N`** to see forge changes.

**Process notes from the (now-retired) worktree-deputy runs — kept for the integration lessons, NOT as a deputy how-to** *(background deputies are banned now; see the orchestration archive below)*: (1) **CWD can drift into a completed worktree** when its task-notification arrives — integrate with `git -C <root> checkout <branch> -- <paths>` + absolute `node` paths + verify `git -C <root> diff --cached --stat`. (2) forge resolves includes relative to the `.src.html` dir, so **absolute paths make forge CWD-independent**. (3) The lead does all shared-file edits (workbench card, README, map); per-piece builders make only new files → zero merge races.

**Deferred (minor):** route the Lantern engine's `the-lamplighter-won`/`the-ferryman-won` flags through `WS.flag` so the **Night Shift** trail also cues — touches the shared `adventure/engine/lantern.js` (re-forges all tales); a separate careful pass.

**Hidden inventory: now 12 secrets** (added **The Light Mixer** — see 🗝️ callout below; grep before building). (Old lesson, still live: a public Enigma was nearly rebuilt before catching the hidden `undercroft/enigma.html` — **always grep the hidden inventory first.**)

**Git push:** this repo pushes via **HTTPS + the gh credential helper** (set repo-locally in `.git/config`; SSH has no key in agent sessions). `git push origin main` works as-is — no extra setup.

### 🗝️ HIDDEN INVENTORY — CHECK THIS BEFORE BUILDING (Brandon: spoilers OK here, 2026-06-12)
*Hidden standalone pages already built (do NOT rebuild — extend or differentiate instead):*
`undercroft/quickening.html` (Living Lattice — CA you can hear) · `undercroft/rosette.html` (rose window) · `undercroft/codex.html` (Gilded Leaf — verse×script) · `undercroft/floating-ink.html` (marbling) · `undercroft/almanac.html` (book of days) · **`undercroft/enigma.html` (a full Enigma I — rotors/plugboard/reflector/signal-trace; THE cipher machine, hidden)** · **`undercroft/light-mixer.html` (The Light Mixer — additive colour SYNTHESIS, the Spectroscope's inverse; unlocked by all 9 Hall "Feats of Light")** · the hidden **Night Shift** Lantern tale (`adventure/`, below-only).
*Undercroft trophies (no standalone page):* The Long Quiet (dwell) · Eleven (config) · The Survivor (score) · The Reckoner (capstone). **12 secrets total.** Manifest of record: `undercroft/index.html` SECRETS array (predicate in `tools/ws/ws.js` `WS.SECRETS`).

**Next-steps → the seedbed.** All open threads, ideas, and bets now live as typed **seeds in [ROADMAP.md](ROADMAP.md)** (the gardener sows there; the builder picks — or dreams something new). At session start, the **🎲 Session-mode gauge** above decides PLAN vs BUILD. *(The old inline menu — Night Shift cue, a 2nd engine, The Hours, Hall extensions, growth POIs, the cipher vein, Lantern — was migrated there verbatim-in-spirit as seeds, 2026-06-13.)*

**Orchestration archive** *(⚠️ the background-deputy mechanism below is **RETIRED** — `CLAUDE.md` now bans the `expero:deputy` skill and bans releasing the turn to wait on background agents; a `/fun` run is **one turn** and must build + self-test + commit + push in-turn. Delegate ONLY to **foreground `Agent`/`Task` subagents that return inline**, or just build it yourself. The **integration discipline** still applies)*: the old pattern was **worktree-isolated deputies** — each builds ONE piece and self-verifies in a real browser via a UNIQUELY-NAMED agent-browser session (parallel builders collide on the shared default tab) → review screenshots → integrate to `main` via `git checkout <branch> -- <files>` + a fresh commit (MORE RELIABLE than cherry-pick when forge-generated files are in the diff — a cherry-pick of an enriched `index.html` misbehaved once) → push. Keep ≤1 committer on `main`; merge serially; retire worktrees with `git worktree remove --force` + `git branch -D`. New standalones go on the **Workbench**, reached via the Workshop POI on the map.

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
> Workshop outbuilding + the **Hall of Mirrors optics wing** + the gated Undercroft cellar; companions still ride "within" their parent room.
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

## For a fresh thread — see the seedbed
**→ Concrete ideas now live as seeds in [ROADMAP.md](ROADMAP.md).** A few evergreen growth *rules*
that aren't seeds (they're house policy) stay here:
- **Deepening a rack is cheap** — drop an Arcade cabinet (`auto-fill`) or a Sound Garden instrument
  (`auto-fit`, verify via the `audio-lens` skill; be courteous with live audio) behind its one
  existing front-door card — no rebalance, just bump the tag count + blurb.
- **A new companion** for a card that lacks one (Sound Garden / Threshold) — ONLY if the sibling
  pairing is genuine (see the growth playbook above). Don't force it.
- **The Garden is intentionally finished at 34** — extend only for a genuinely distinct, must-have
  specimen (then follow `strange-garden/SPEC.md`). *(A "complete — do not pad" call, the kind the
  gardener now records in the seedbed's metagame table.)*

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
| `undercroft/` | 🗝️ done (**12 secrets**) | **The hidden world** (3rd growth axis) — a secret room reading `ws:` breadcrumbs; reveals earned pieces (ghost silhouettes + riddles → materialise) + an all-found capstone. All 12 (manifest of record = `undercroft/index.html` SECRETS display + `tools/ws/ws.js` `WS.SECRETS` predicates): Living Lattice (exploration), The Long Quiet (dwell), Eleven (config), The Survivor (score), **Rosette** 🌹 (combination — rarest), **The Gilded Leaf** 📜 (verse×script), **The Floating Ink** 🌊 (cartographer×scriptorium), **The Almanac** 📅 (verse×orrery), **Enigma** 🔐 (a full hidden Enigma I — see its own row), **The Reckoner** 🧭 (capstone trophy), **The Night Shift** 🕯️ (a hidden Lantern tale, below-only), **The Light Mixer** ⚪ (additive colour SYNTHESIS — the Spectroscope's inverse; unlocked by all 9 Hall **Feats of Light** `ws:flag:earned-*`; see its own row). See `UNLOCK.md`. |
| `undercroft/enigma.html` | 🔐 done (HIDDEN) | **Enigma** — a genuine, mechanically-correct **three-rotor Enigma I** (rotors I–V + notches, UKW-B/C, plugboard ≤10, ring settings, double-step anomaly), live **signal-path trace**, reciprocal, 3 skins, PNG. Self-test **12/12** (historical vectors incl. `AAAAA→BDZGO` + the "Aachen" daily key, double-step, reciprocity, no-fixed-point, involutions, determinism+skin-invariance). **THE cipher machine of the workshop — hidden secret #9. Do NOT build another rotor-Enigma; the public cipher is the Volvelle (a different machine).** Spec `undercroft/ENIGMA.SPEC.md`. |
| `undercroft/light-mixer.html` | ⚪ done (HIDDEN) | **The Light Mixer** — additive colour **SYNTHESIS**, the Spectroscope's inverse ("take the light apart nine times over, then learn to make it whole"). A spinning **Newton's disc** (3 palettes) that fuses to the exact **area-weighted linear-light average** (full spectrum → near-white / D65) + three draggable **additive spotlights** (R+G=Y, G+B=C, B+R=M, R+G+B=white, all in linear light). 3 skins, PNG. Self-test **7/7** (sRGB⇄linear ≤1e-9; disc fusion == closed-form average; additive laws exact; radiometric not gamma-space). **Hidden secret #12 — the capstone reward for earning all 9 Hall "Feats of Light"** (`WS.SECRETS` predicate = every `ws:flag:earned-*`). Do NOT rebuild a colour-mixing / Newton-disc piece. |
| `undercroft/almanac.html` | 📅 done (HIDDEN) | **The Almanac** — a seeded perpetual **book of days** for an invented folk-calendar over the real Gregorian year, anchored to a **REAL computed sky**: real moon phase (drawn glyph + illumination %), real solstices/equinoxes, correct calendrical math (Zeller weekday, Gregorian leap rule). From `(seed, year)`: title plate + wheel-of-the-year (4 real cardinal points) + day-reader (moon/season/invented feast/weather-lore couplet/omen/season-gated husbandry counsel/weekday) + feast index; 3 cosmetic styles (Woodcut/Star-Chart/Plain-Leaf), 2× PNG. Tone: wry old-farmer's-almanac, curate-then-arrange (reads as written). Self-test 5/5 (moon ≤1d / solstices ±1d / calendar / seed-purity & style-invariance / coherence — 23k-entry sweep 0 seams). New medium: generative folklore-reference anchored to real ephemeris. Unlocked by `ws:seen:verse` ∧ `ws:seen:orrery` (orrery now self-drops its breadcrumb). Spec: `ALMANAC.SPEC.md`. |
| `undercroft/rosette.html` | 🌹 done (HIDDEN) | **Rosette** — a seeded generative Gothic **rose window** (stained glass: concentric rings, N-fold symmetry, cusped tracery, jewel glass + lead came; seed-pure, palette recolours only; 6 palettes, PNG export). A new visual medium; the rarest Undercroft secret. |
| `undercroft/codex.html` | 📜 done (HIDDEN) | **The Gilded Leaf** — a seeded generative **illuminated manuscript leaf** fusing verse × script: composes a coherent verse (Oracle-style curate-then-arrange) + invents a script hand (Scriptorium-style bijective glyph map) and writes the verse in it on a gilded parchment leaf (versal, jewel+gold border, gloss + key). Self-test 5/5 (round-trip/bijection/seed-purity). Unlocked by `ws:seen:verse` ∧ `ws:seen:scriptorium`. |
| `undercroft/floating-ink.html` | 🌊 done (HIDDEN) | **The Floating Ink** — seeded **mathematical marbling** (suminagashi · ebru): ink floated on water via exact fluid-displacement maps (**Drop** area-preserving `√(1+r²/d²)`, **Tine** comb, **Vortex** swirl); 6 recipes (rings/stone/gel-git/non-pareil/bouquet/vortex), 6 palettes, 2× PNG export. Self-test 5/5 (area-preservation A/B/C, seed-repro, palette-invariance, finiteness, tine). New visual medium (fluid-ink art). Unlocked by `ws:seen:cartographer` ∧ `ws:seen:scriptorium`. Spec: `FLOATING-INK.SPEC.md`. |
| `adversary/` + `tools/game/` | ♟️ done (engine) | **The Adversary** — a reusable **solved-games engine**: enumerate a game's whole state graph + retrograde-label every position WIN/LOSS/DRAW w/ exact distance → play a **provably-perfect** opponent, reveal each legal move's verdict ("mate in N"), watch perfect self-play. One engine, 5 games as data (nim/ttt333/konane/hex3/mnk443[capped (3,4,3)]). Self-test 38/38 (literature: Nim XOR, ttt=DRAW; perfect-never-loses; symmetry-canon). Workbench → "Games of perfect information". **Don't rebuild — extend by adding a game-def to `tools/game/games/`.** |
| `tools/sky/` + `index.src.html` | ✶ done (metagame) | **The Survey of Heaven** — the front-door map fills with stars as you wander (reads the `ws:seen` every page drops); the 6 companion-wings form asterisms that complete w/ engraved names; all-skies capstone; "N/6 charted" on-ramp. **+ A 7th, feats-driven constellation "The Optician"** (2026-06-13) — 9 stars in the west grounds by the Hall that kindle off the `ws:flag:earned-*` Feats of Light + complete at 9/9 (own brass sub-tally + `ws:flag:sky-feats-named`); kept **additive** (NOT in `allComplete` — the original 6-wing capstone is structurally protected). `Sky.state` gained an optional `feats` group; `visitedFromStore` maps `ws:flag:earned-<X>`→`feat-<X>`. Self-test **41/41**. Map's 2nd label-solve pass → POI/asterism overlaps stay 0. |
| `singing-plate/` + `tools/plate/` | 🎛️ done | **The Singing Plate** — a **Chladni bench** + the workshop's first **spectral solver**: discretizes −Δ on a masked plate + numerically solves the eigenproblem (from-scratch seeded Lanczos), sand flees to the nodal lines. Self-test 18/18 (square π²(p²+q²) convergence, circle Bessel-zero ratios, orthonormality). Wave-physics trilogy w/ Caustic + Ripple. Workbench → Toys & benches. **Distinct** from the watch-only `strange-garden/pieces/chladni.html` (that has no eigensolver). |
| `sundial/` + `tools/dial/` | 🌅 done | **The Gnomon** — an operable **sundial**: real solar geometry (shares the Astrolabe's frozen solar fns → the instruments read one sky), the equation-of-time, the analemma figure-8; horizontal/equatorial/vertical-south dials. Self-test 21/21 (round-trip civil↔shadow clock, shadow-tip on the hour-line, EoT extrema/zero-crossings). Workbench → Instruments. |
| `planimeter/` | 📐 done | **The Planimeter** — the estate's first **mechanical-integration** instrument: an operable polar (Amsler) planimeter that measures a shape's **area** by tracing its boundary (Green's theorem in brass: a wheel rolling only on perpendicular motion → `Area = L·ΔW`). Real forward kinematics; pick a figure & auto-trace or drag the tracer; brass/blueprint/boxwood skins, 2× PNG. Self-test **7/7, non-circular** (wheel-integral vs independent πr²/shoelace): area to **2.0e-7** (O(1/N²) convergence), **pole-independence 9e-15** (the defining property), zero-path ~0, falsifiable, deterministic. Zero-circle handled by keeping the pole outside (disclosed). Workbench → Instruments. *(No `tools/` module — fully inline.)* |
| `epicycles/` | 🌀 done | **Fourier Epicycles** — draw any closed curve as a sum of **rotating vectors** (circles on circles): a genuine from-scratch **complex DFT** turns a sampled path into epicycles chained tip-to-tail that re-trace it with a gold pen; N slider 1→256, 6 presets + **freehand mouse-draw**, 3 skins. Self-test **6/6** (round-trip `idft(dft(z))=z` 2.2e-12; full rotating-vector reconstruction 1.2e-12; top-N RMS converges monotonically → 9.9e-13; **Parseval** independent identity 3.3e-15; deterministic; falsifiable). Verified in Node + browser. Workbench → Toys & benches. *(Fully inline.)* |
| `brachistochrone/` | 🛝 done | **The Brachistochrone** — Bernoulli's 1696 curve of fastest descent: 4 beads race A→B by real `v=√(2g·drop)` and the **cycloid wins** (0.806 < 0.824 [parabola] < 0.829 [arc] < 1.010 [line] s); its twin the **tautochrone** — beads from any height on one cycloid arrive together (`T=π√(r/g)`). Self-test **7/7** (cycloid beats all rivals + matches analytic to 1.1e-16; perturbing it only slows it [true minimum]; tautochrone spread **0.00e+0**, max dev 9.44e-15; **falsifiable** — a circular cup is NOT tautochrone [spread 0.048]; deterministic). Node + browser. Race + Tautochrone modes, 3 skins. Workbench → Toys & benches. *(Fully inline; non-cycloid race times are a substitution-regularized numerical integral good to ~9 digits.)* Also **cross-linked into the Cavern's Newtonian Drift** (it belongs to both; not duplicated). |
| `cavern/` + `cavern/{light-clock,cradle,maxwell-boltzmann,precession,double-slit,tunnelling,box,oscillator,finite-well,lattice,hear-the-ladder}/` | ⚛️ done (**front-door WING**, growing) | **The Cavern** — the estate's **Physics Lab**, a cave WING on the lower grounds ("dangerous physics kept underground for safety"; a `cave` footprint drawer + `id:physics-lab` PLACES entry in `index.src.html`, cold mineral teal `#7fd4c0`). The cave forks into **three drifts off a central shaft** — a warm-lamplit **Newtonian** + a cold-starlit **Einsteinian** + the cold electric-violet **Quantum Drift**, which *opens in-page* (a PUBLIC spatial reveal — `walkedBothDrifts()` in `cavern/index.html`, distinct from the Undercroft) once a visitor has seen ≥1 Newtonian AND ≥1 Einsteinian bench. Index self-test **25/25**, drops `ws:seen:physics-lab`. **NEW (2026-06-13) — The Maxwell–Boltzmann Gas** 🔥 `cavern/maxwell-boltzmann/` (Newtonian drift, the **first bench of HEAT** — the estate had no thermodynamics): hundreds of equal-mass hard discs bounce elastically (p+KE exact, like the Cradle); the speed histogram **relaxes by itself** to the 2-D M–B (Rayleigh) law; a real **Pearson χ²** drawn at the gas's own `⟨½mv²⟩` (nothing fitted) **rejects a delta-spike (χ²/dof≈226) & accepts equilibrium** — the second law watched. Pure CORE w/ a from-scratch χ² survival fn (incomplete-gamma, no libs), O(N) spatial-hash collisions, dilute φ=0.06 packing so ideal M–B holds, 7-frame median verdict hysteresis; **self-test 14/14 in-page / 5/5 Node** (exact conservation 1e-12, a full positional gas relaxes from a delta to p=0.48, equipartition ⟨v²⟩=2kT, χ² p-values match NIST exactly). The benches (self-contained, served-origin verified, each drops `ws:seen:<id>`): **The Light Clock** ⏱️ (SR — γ from the Pythagorean photon-slant == the closed form to **2.38e-13**, interval s²=t²−x² invariant 3.11e-13; **7/7**) · **Newton's Cradle** ⚙️ (elastic collisions — **conserves p AND KE**, **lift k ⇒ exactly k swing out** all cases exact, honest dissipation e<1; **6/6**) · **Mercury's Precession** ☿ (GR — RK4 Binet orbit → walking rosette; **42.98″/century** computed, Newton control precesses 0, numerical==closed-form 1.3e-7; **6/6**) · **The Double Slit** 🎯 (Born-rule fringes — λL/d exact, which-path erases interference, 300k-particle χ²=1.03 vs flat-target 8399; **8/8**) · **Quantum Tunnelling** ⛰️ (a particle leaks through a barrier — **closed-form T == an independent transfer-matrix wave solve** to 1.9e−14 over 56 configs, unitarity R+T=1 to 3.3e−16, resonant transparency T=1 at qL=nπ, thick-wall exp(−2κL); **7/7**) · **Particle in a Box** 📦 (infinite square well — quantized **ladder E_n ∝ n²** with no zero rung; `ψ_n` with n−1 nodes; the closed ladder **== a from-scratch inverse-power FD eigensolve** 8.5e−14, orthonormal to 1.55e−15, time-evolution norm=1, a **parity selection rule** on ⟨x⟩; superposition packet *sloshes*; **8/8**) · **The Harmonic Oscillator** 🌀 (the Box's **foil** — a parabolic bowl `V=½ω²x²` with a *perfectly EVEN* ladder **E_n=ω(n+½)** [spacing ℏω, ground ½ℏω>0], Hermite-Gaussian ψ_n with **n** nodes that **leak past the soft turning points** [ground state **15.73%** forbidden, shrinking with n], a **coherent state** that swings ⟨x⟩=x₀cos ωt classically without spreading; the even ladder **== a from-scratch FD inverse-power eigensolve** of −½∂²+½ω²x² O(h²), orthonormal 2.3e−11, ODE residual 1.5e−7; **8/8**) · **The Finite Well** 🕳️ (the *realistic* well, third corner of the **bound-state trilogy** — give the box a finite depth `V₀` [climbable walls] and the ladder turns **FINITE** [`⌊R/(π/2)⌋+1` rungs, `R=√(2V₀)·a`, always ≥1; rungs *evaporate*/snap-in with depth] while the wave **leaks OUT through the walls** and **decays exponentially** [length 1/κ; the shallowest rung leaks farthest, e.g. 80.9% for the top rung of a 5-state well]; no closed-form ladder — the rungs solve a **transcendental match** `u tan u=v` even / `−u cot u=v` odd on `u²+v²=R²` by bisection [6.8e-14] **== a from-scratch FD inverse-power eigensolve of the actual STEPPED potential** [honest **O(h)** — the hard step kills 2nd order — to a per-rung rel **0.13%**], ψ & ψ′/ψ continuous at the wall 2.9e-13, node theorem n nodes, **box-recovery** V₀→∞ → `(n+1)²π²/(8a²)` 3.2e-4; **8/8**) · **The Lattice** ⛓️ (one atom → a CRYSTAL — the **Kronig–Penney** model: line the finite wells up periodically and the sharp levels **smear into bands** separated by **forbidden gaps**; the dispersion `cos(qa)=cos(ka)+P·sin(ka)/(ka)≡f(E)` allows energies only where `|f|≤1`; two views [`f(E)` graph + the `E(q)` band diagram]; `P→∞` narrows each band onto the isolated level `n²π²/(2a²)`, `P→0` closes the gaps to the free electron; the metal/insulator/semiconductor punchline; spine = `f(E)==½·tr M(E)` from a from-scratch **transfer matrix** 4.4e-16 with `det M=1`, **== a from-scratch cyclic-tridiagonal RING eigensolve giving exactly N states per band**; **8/8**). **The Box · Oscillator · Finite Well are the matched bound-state trilogy** — ∞ ladder ∝ n² hard walls / ∞ even ladder ∝ n+½ Gaussian tails / FINITE ladder exponential leak — and **The Lattice** is the step up from one well to a periodic solid. **Don't rebuild these — EXTEND the wing** (a new bench → new `cavern/<id>/` dir + a card in `cavern/index.html`; the front-door POI is already placed). A **multi-session wing** (the Hall grew 9→12 the same way): more benches per drift (the bound-state trilogy + the lattice are DONE; next Q-bench candidates = a **hydrogen radial Coulomb** ladder or a 1-D scattering/wave-packet bench; plus more Newtonian/Einsteinian) are the menu — see `worklog/physics-lab-plan.md` §2/§3. |
| `engine-room/` + `engine-room/{carnot,demon}/` | ♨️ done (**front-door WING**, growing — **2 benches**) | **The Engine Room** — the estate's **Thermodynamics wing** (the first **heat** — it modelled light/motion/quantum/relativity/waves/number/information, never heat). A **MILL HOUSE you operate** in the SE working quarter (an `engine` footprint drawer = L-plan shed + spoked flywheel on a line-shaft + chimney + boiler drum, + an `id:engine-room` PLACES entry in `index.src.html`, brass `#d9a441`, the `--firebox #e8703a`/`--condenser #5fa8d3` hot↔cold axis): one flywheel on a horizontal line-shaft (a CSS `@keyframes spin`, frozen under `prefers-reduced-motion`), benches hung off as **BAYS belted to the shaft**. Landing self-test **17/17**, drops `ws:seen:engine-room`; **TWO live benches** + **two literal empty BEDPLATES** (`aria-disabled`, no href: **Stirling** · **Brownian ratchet** — the seeded next benches) + a cross-wing **BRIDGE** to `cavern/maxwell-boltzmann/` (the engine's microscopic floor). **Bench 1 — The Carnot Engine** ♨️ `engine-room/carnot/` (self-test **11/11** in-page / **16/16** Node twin): **two linked planes** — a P–V loop (gold-filled area = W) ↔ a T–S rectangle as the **master control surface** (3 draggable DOF: T_h top / T_c bottom / ΔS width; every drag re-solves the four P–V corners). **Falsifiable spine — TWO independent derivations agree:** PATH 1 (geometry) `W=∮P dV` by a from-scratch **Simpson** quadrature + the adiabat traced by a from-scratch **RK4** ODE stepper (`dT/dV=−(γ−1)T/V`, *never* the closed form); PATH 2 (heat) `Q_h,Q_c` via `∫T dS`; `W_area==W_thermo`, `η==1−T_c/T_h` exact (over 5000 triples max|Δη|=4e-16). **"You cannot win / break even" teeth:** isochoric/isobaric reshape lobes drop η **amber below the η_Carnot ceiling** + open a **red lost-work wedge** (all 350 reshaped lobes lose to Carnot strictly); a heat-leak slider ticks a **red ΔS_universe meter** (0.000 reversible, monotone in the leak); a live conserved Sankey `Q_h=W+Q_c`; γ 5/3↔7/5. **Bench 2 — The Demon's Ledger** 👹 `engine-room/demon/` (self-test **9/9** in-page / **17/17** Node twin; the estate's **first heat↔information bridge** — the Maxwell's-Demon × Shannon cross, built 2026-06-14): a **Szilárd engine** — a single molecule, a dropped partition, the demon *measures* 1 bit (`−Σp·log₂p`), a piston extracts `W=∫P dV=kT·ln2`, then **erasing** the bit dumps exactly `kT·ln2` (Landauer) → `netW≤0`, `ΔS_universe≥0`. **The cross is real by construction:** the inline core **IMPORTS** `entropy()` from `../../entropy/core.mjs` + `carnotEfficiency()` from `../carnot/core.mjs` and never redefines them — the heat ledger & the bit ledger are literally ONE ledger; the Node twin's **re-extraction parity harness** proves the inline `entropy()` body is char-for-char the imported `entropy.toString()` (9/9==9/9). Dual-ledger SVG + ΔS_universe meter + a 4-phase FSM (Drop→Measure→Extract→Erase) + 3 invited cheats (refuse erasure / bias the box / two reservoirs). Reverse bridges live on `entropy/` (↗ "where one bit costs heat") + `cavern/maxwell-boltzmann/` (↑ "one molecule, played as an engine"). Each bench: pure `core.mjs` source of truth + a `core.test.mjs` Node twin; the in-page core is the inlined byte-functional twin (re-extracted & re-run in Node). **Don't rebuild these — EXTEND the wing** (a new bench → new `engine-room/<id>/` dir + a card on the landing; the front-door POI is already placed). The 2 empty bedplates are the seeded menu — see `engine-room/CHANGELOG.md` + `engine-room/demon/CHANGELOG.md`. **⚠️ open `[bug]`:** the Carnot bench's self-test pill overflows on ≤400px phones (the same `.topbar` no-wrap issue fixed on the Demon bench — apply the `@media (max-width:430px)` rule). |
| `patience/` + `tools/patience/` | 🂡 done (engine) | **The Patience engine** — solitaire whose dealer **only ships provably-winnable deals** (a weighted-A* solver gates each deal; rejection-sampled; the cached line drives Hint + watch-it-solve — Lantern's winnability proof on cards). Compact FreeCell (28-card; engine also does full 52). Self-test 11/11 (solver soundness, winnability guarantee, determinism, move-gen, conservation). Workbench → "Games of perfect information". New genre (cards). |
| `kaleidoscope/` + `tools/kaleido/` | 🔮 done | **Kaleidoscope** — a live tumbling **dihedral-symmetry** mirror toy: `f(P)=content(fold_Dn(P))` → exactly Dₙ-symmetric by construction; adjustable order 3–12, seeded glass, 3 skins, 2× PNG. Self-test 9/9 (Dₙ-invariance ~2e-14, fold idempotent, determinism, order sweep). **Distinct** from Rosette (static rose window) + Tessellarium (wallpaper/translational). **Now homed in the Hall of Mirrors wing** (moved off the Workbench). |
| `hall-of-mirrors/` + `rainbow/` `spyglass/` `lighthouse/` `spectroscope/` `polariser/` `anamorphosis/` `iridescence/` `halo/` `camera-obscura/` `mirror-maze/` `diffraction/` `structural-colour/` | 🪞 done (**front-door WING**) | **The Hall of Mirrors** — a new front-door **optics wing** (west grounds; new `hall` footprint drawer in `index.src.html` — a long vaulted gallery, arched windows facing arched mirrors); **index REDESIGNED 2026-06-13** into "The Dispersion" (spectral-rail card-spine + live per-physics inline-SVG vignettes — see `hall-of-mirrors/CHANGELOG.md`). Gathers **14 self-contained light pieces**: the 9 original NEW + **Caustic** (`optics/`) + **Kaleidoscope** (promoted from the Workbench) + **The Lighthouse** 🗼 (`lighthouse/` — a Fresnel-lens bench, added 2026-06-13: a lens collapsed into concentric prism-rings → a sweeping beam; exact-Snell facets, self-test 5/5 focus to 9.99e-16 m) + **The Diffraction Grating** 〰️ (`diffraction/` — Fraunhofer/Fourier optics, added 2026-06-13: the far-field pattern of an aperture is the **squared Fourier transform** of its transmission — one slit → sinc, N slits → the sinc × interference comb, orders at `d·sinθ=mλ` height N² sharpening as 1/N, white light → spectrometer, missing orders at integer d/a; the CRUX overlays a **direct independent FT** `Σ t(x)e^{-ikx sinθ}` on the closed form, agreeing to 3.65e-5; self-test **8/8** in-page / **13/13** Node; **NOT a Feat of Light**) + **The Bragg Stack** 🦋 (`structural-colour/` — structural colour / photonic band gap, added 2026-06-13: a periodic dielectric multilayer reflects a **band** of colour from geometry not pigment, and **blue-shifts as you tilt** [Morpho/peacock/opal]; the CRUX computes reflectance two independent ways — the **transfer-matrix** of the finite stack vs the **Bloch band theory** `|½·tr M_cell|>1` of one unit cell — agreeing to **0.000%**, centre==Bragg `λ₀=4·nH·dH` & width==`(4/π)·asin(Δn/Σn)` frequency-exact; self-test **8/8** in-page / **15/15** Node; **NOT a Feat of Light** — both keep the 9-feat capstone + Light Mixer unlock intact); links **Ripple** as wave-kin. The nine new (each browser-verified, self-test green): **The Rainbow** 🌈 (droplet optics → primary 42.00°/secondary 51.04° bows from Snell alone, Alexander's band, supernumeraries; 9/9) · **The Spyglass** 🔭 (Keplerian refractor + Newtonian reflector ray bench; M=f_obj/f_eye exact, parabola focus 7.5e-14 = no spherical aberration vs sphere's 134.7px miss; 9/9) · **The Spectroscope** 🌈 (prism Cauchy + grating `d·sinθ=mλ` + real line spectra — Balmer/Na-D/Hg/Ne/Fraunhofer at true wavelength→sRGB colours; Balmer Hα computed 656.29nm via reduced-mass Rydberg; 7/7) · **The Polariser** 🕶️ (Malus `I=I₀cos²θ` + 3-polariser paradox peaking ¼@45° to 1.67e-16; 9/9) · **The Anamorphic Mirror** 🪞 (cylindrical-mirror anamorphosis; azimuth-preserved + Möbius radial map; round-trip `unwarp(warp(P))=P` to 1.2e-15; 6/6) · **Iridescence** 🫧 (thin-film interference — Newton's rings/soap film/oil slick; true colour by CIE-1931 spectral integration, NOT a fake gradient; Newton r_m=√(mRλ); flat-spectrum→neutral; 9/9) · **The Halo** ☀️ (ice-crystal atmospheric optics — 22°=21.76°/46°=45.52° halos + sundogs + circumzenithal arc, all from minimising ice-prism deviation; red inner edge; 10/10) · **The Camera Obscura** 📷 (pinhole image formation — inverted, m=v/u exact, optimal pinhole d=√(2.44λvu/(u+v)) exact [the distant-limit √(2.44λv) is the rule-of-thumb shown alongside]; 10/10) · **The Mirror Maze** 🪞 (a playable, provably-solvable **laser-reflection puzzle** — place mirrors to route the beam to all gems; generated from a pruned-to-minimal reference route so every mirror is load-bearing; 240/240 boards solvable + loop-safe tracer always terminates; 5/5). **Don't rebuild these — extend the wing** (a new optics bench → new top-level dir + a card in `hall-of-mirrors/index.html`; the front-door POI is already placed). |
| `galton/` + `tools/galton/` | 🫘 done | **Galton board** — the estate's first **probability** piece: seeded balls → a bell curve, with the exact binomial PMF + normal overlay + a **live χ² p-value**; biased-p slider. **♪ Listen (Sound Garden cross, 2026-06-13):** each ball plucks a note whose **pitch is its bin** (a strictly-monotonic bijection bin↔Hz over a minor-pentatonic) → the note-density across pitch IS the binomial PMF, **the bell curve heard**, thickening at the centre; honors `ws:pref:muted`. Chip **9/9** (5 probability: ideal exactly binomial; ≥100k runs do-not-reject χ² + a flat histogram IS rejected [power]; CDF calibrated; conservation; determinism + 4 audio: bijection · density==PMF · no-clip · ticks bounded); Node **16/16**. Workbench → Toys & benches. |
| `linkage/` + `tools/linkage/` | 📐 done | **The Straightedge** — the estate's first **linkage/kinematics** piece: the **Peaucellier–Lipkin** linkage draws an *exact* straight line from rotation (circle inversion) + a four-bar coupler-curve foil. Self-test 14/14 (line deviation **4.88e-15** — exact; inversive invariant; bar-length loop-closure; four-bar no dead spots). Workbench → Toys & benches. |
| `turing/` + `tools/turing/` | ⚙ done | **The Mill** — the estate's first **computation** piece: a visible programmable **Turing machine** (unbounded tape, editable transitions, program library incl. busy beavers). Self-test 49/49 (faithful simulator; **BB(2)=6/4, BB(3)=14/6, BB(4)=107/13** exact; non-halting capped; determinism). Workbench → Computation. |
| `black-chamber/` + `tools/cryptanalysis/` | 🕵 done | **The Black Chamber** — the estate's first **cryptanalysis** piece (cipher makers→breaker): recovers plaintext with NO key — Caesar (χ²), Vigenère (index-of-coincidence + per-column), substitution (trigram hill-climb, ~5KB embedded corpus). Self-test 14/14 (Caesar/Vigenère exact-key recovery; substitution ~97–100%; IoC English 0.0689 vs random 0.0385; auto-detect). Workbench → Instruments. |
| `latch/` | 🧩 done (trio + index) | **Latch** — the estate's first **logic-puzzle** atelier: a generative **Nonogram (picross)** flagship + sibling **Slitherlink** + **Akari (light-up)**, each with a built-in **uniqueness/solvable-by-pure-deduction** proof (a full solved board *is* the uniqueness witness; never ships a guessable puzzle), plus a small Puzzles index. Green chips ("logic-verified — N/N ✓", never red). Workbench → Puzzles. **Don't rebuild Latch/Slitherlink/Akari — extend with a NET-NEW family** (Kakuro/Hashi/Masyu). |
| `abacus/` | 🧮 done | **The Soroban** — an operable Japanese **counting-frame** instrument: heaven/earth beads, real place-value + complement (5's/10's) add & subtract, traced worked examples. The `solveExample` CORE is the single source of truth for renderer + self-test (9 checks). Workbench → Instruments. |
| `astrolabe/` | 🌃 done | **The Astrolabe** — a genuine, operable **planispheric astrolabe** (north-pole stereographic): rete/tympan/almucantars/alidade, time↔altitude, real sky. **Shares its frozen solar fns with The Gnomon (`sundial/`) → the two instruments read ONE sky.** Self-test 18/18 (almucantars, stereographic round-trip). Workbench → Instruments. |
| `slipstick/` | 📏 done | **The Slipstick** — a working **slide rule**: multiply/divide by *adding log-lengths* (C/D, CI, A/B, K, L, S/T scales); the logarithm made geometric. Self-test 13/13 (log-scale placement, product/quotient/root, never ships red). Workbench → Instruments. Begs its companion the **Nomograph** (a sown seed). |
| `loom/` | 🧶 done | **Loomlight** — a tactile digital **handweaving loom**: threading × treadling × tie-up → a live drawdown (the woven cloth) computed from the weave's logic, not faked. Self-test 8/8 ("weave verified — 8/8 ✓"). Workbench → Toys & benches. (Its Tessellarium cross — cloth realizing a wallpaper symmetry group — is a sown seed.) |
| `ripple/` | 🌊 done | **Ripple** — a **wave-interference tank**: two coherent point sources → live interference fringes (Huygens superposition), λ/spacing/phase controls; the Hall links it as wave-kin. Self-test 8/8 ("ripple verified — 8/8 ✓", zero console errors). Workbench → Toys & benches. |
| `harmonograph/` | 〰️ done | **The Harmonograph** — a Victorian 4-pendulum **drawing machine**, the damped parametric sum `x(t)=Σ Aᵢ·sin(2π·fᵢt+φᵢ)·e^(−dᵢt)`; near-integer ratios → precessing petals; 6 musical-ratio presets, 3 skins, PNG. **v1.1 "Hear the figure"** voices the live ratio (Sound-Garden cross — a fifth/octave you hear, the detune as a beat; honors `ws:pref:muted`). Self-test 5/5 → **9/9**. Workbench → Toys & benches. The "curve machines" trio with `epicycles/` + `spirograph/`. |
| `spirograph/` | ❋ done | **The Spirograph** — gears in gears: a pen in a small gear rolling inside (hypotrochoid) / around (epitrochoid) a fixed ring; closes after `R/gcd(R,r)` ring-trips == petal count; a trochoid is **exactly** a sum of two rotating vectors (the explicit bridge to `epicycles/`). Self-test **7/7** (closure, minimal-period, petal-count, no-slip 2.2e-16, two-vector exact 0.00e+0; headless + in-browser). Workbench → Toys & benches. |
| `soap-film/` | 🫫 done | **The Soap Film** — a film between two coaxial wire rings minimises its area → the unique minimal surface of revolution, the **catenoid** `r(z)=a·cosh(z/a)` ("the catenary spun"). Two falsifiable truths: **mean curvature `H≡0` everywhere** (2.2e-16) and the **Goldschmidt collapse** (past `2h≈1.0556R` two flat discs win; past `1.3255R` no catenoid exists → the film **snaps to discs**). Self-test **7/7** (incl. a backtracking-line-search relaxation that converges to the catenoid; the headless audit caught a real divergent-relaxation bug). Rotating 3-D render, relax animation, PNG. Workbench → Toys & benches (a **new geometry vein** — minimal surfaces / 2-D calculus of variations; its 1-D parent the **Catenary** bench sits right after it). |
| `catenary/` | ⛓️ done | **The Catenary** — pin a fixed-length chain at two points and it hangs as `y=a·cosh((x−x₀)/a)`, **not** a parabola (Galileo's wrong guess; proved a cosh by Bernoulli/Leibniz/Huygens 1691). Closed-form solver (`a` from `√(L²−v²)=2a·sinh(h/a)`). Overlay the **equal-length parabola** and the impostor diverges; drop a **bead chain** (inextensible links, constrained descent on PE) → settles onto the cosh; **flip** → the inverted catenary (the arch). Self-test **7/7** (pins+length ~1e-16 · chain ODE `|y″|=√(1+y′²)/a` 4e-6 · **min PE among equal-length rivals** · bead-relax RMS 6e-3 · length conserved ~1e-10 · determinism · parabola FAILS the ODE; the headless audit caught **4 real bugs** — inverted parabola bisection, a y-down sign flip, a PE sign error, a different-length comparison). Drag-the-pins, sliders, 6 presets, PNG. Workbench → Toys & benches, **right after the Soap Film** (its 2-D cousin). |
| `scytale/` | 🪵 done | **The Scytale** — the workshop's first **transposition** cipher: a rod you wrap a strip around so plaintext reads down the staves and scrambles when unwound; circumference is the key. **Public** cipher (paired with the public Volvelle; the rotor-Enigma is hidden). Self-test 13/13 (browser + headless). Workbench → cipher group. |
| `volvelle/` | ⌖ done | **The Volvelle** — the workshop's **public substitution cipher**: a genuine operable rotating cipher disk performing three real classical ciphers by turning the disk — **Caesar**, **Vigenère**, and **Alberti**'s mixed-alphabet. Self-test 13/13 (all of spec §1). Workbench → cipher group. **THE public cipher wheel — distinct from the hidden rotor-Enigma; don't rebuild either.** |

Each project has its own `CHANGELOG.md` (full provenance) and the Garden has a `SPEC.md` (house style).

## Constraints (from CLAUDE.md)
- Stay inside this folder, `/tmp`, and the job folders. Internet read-only; no side-effecting
  actions without Brandon's OK (publishing was explicitly authorized).
- Keep disk modest (< 50 GB; aiming < 1 GB). No giant files.
- Docker available if a service is needed.
