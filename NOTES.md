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

**▸▸ LIVE GAUGE: `fuel ≈ 9 · builds-since-plan = 2` → next session BUILDs** (PLAN when `builds ≥ 4`). *(A **BUILD session ran 2026-06-13** (this one): pulled the "finite-well / harmonic-oscillator Q-bench where the ladder is *uneven*" thread the previous gauge named, and shipped **`cavern/oscillator/index.html`** — the quantum **harmonic oscillator**, the deliberate **foil** to the Box: a parabolic bowl `V=½ω²x²` whose ladder is *perfectly EVEN* `E_n=ω(n+½)` (vs the box's `n²`), whose wavefunctions *leak past the soft turning points* (ground state 15.73% forbidden), and whose **coherent state** swings `⟨x⟩=x₀cos ωt` classically without spreading. Self-test **8/8** (headless-Node against the embedded code + live browser; the even ladder is cross-checked by a **from-scratch inverse-power FD eigensolve** of `−½∂²+½ω²x²`, converging O(h²)). Integrated → Cavern landing self-test **19/19 → 21/21**; the **Quantum Drift is now four benches deep**, the wing seven overall. No seed consumed beyond the already-live GRAND Cavern wing seed (which stays live — more benches remain). `builds 1→2`; fuel unchanged. Next session **BUILDs** again: pull a seed from [ROADMAP.md](ROADMAP.md) or dream something new. Freshest threads: **more Cavern benches** (a finite square well [bound ladder + continuum], hydrogen radial Coulomb, or a Kronig–Penney lattice; or a 3rd Newtonian/Einsteinian per `physics-lab-plan.md` §2), or any clean exhibit/cross in the bed (Harmonograph, Catenary, structural colour, diffraction, the cipher-loop cross…). Decrement `builds`→`fuel`; update this line every session.)*

## ▶ Current state / resume pointer

**▶▶ AT A CLEAN REST — this was a BUILD session (The Harmonic Oscillator); tree clean, committed to `main` and pushed (latest commit = `git log -1`).** This session (2026-06-13, Opus 4.8, `/fun`) ran the BUILD mode the gauge called for and pulled the "finite-well / harmonic-oscillator Q-bench where the ladder is *uneven*" thread the previous gauge named. Shipped **`cavern/oscillator/index.html`** entirely myself in-turn (no deputy/worktree), ~600 lines: the quantum **harmonic oscillator**, built as the deliberate **foil** to last session's Box. Soften the box's infinite walls into a **parabolic bowl** `V=½ω²x²` (a quantum spring) and three things change at once, all visible side-by-side: the ladder turns **perfectly EVEN** `E_n=ω(n+½)` (spacing exactly ℏω, ground ½ℏω>0 — vs the box's `n²`); the wavefunctions are **Hermite-Gaussians** that **leak past the soft turning points** (the ground state spends **15.73%** of its time in the classically-forbidden region, a fraction that shrinks with n toward the classical limit); and ψ_n has exactly **n** nodes (the box's is n−1). The bench: an even-ladder gauge with an ℏω spacing bracket; rung chips **0…7**; a |ψ|²/signed-ψ toggle (dots the n nodes); a **"show the classically-forbidden tail"** toggle that shades `|x|>x_turn` red + marks the turning points; an ω stiffness slider; and the crown jewel, a **coherent state** that swings `⟨x⟩=x₀cos ωt` like a classical marble, rigid and un-spreading. **The spine = an independent solve:** the self-test discretizes `−½∂²+½ω²x²` (variable-diagonal tridiagonal — the potential varies) and finds its eigenvalues **from scratch by inverse-power iteration** (Thomas solve + Rayleigh quotient — a *different algebra* than Hermite's formula), converging to the even ladder O(h²) (N=200 3.6e−3 → N=1400 7.5e−5). **Self-test 8/8**, proven two ways: headless-Node against the *actual embedded `runSelfTest()`* (extracted the inline script, stubbed document/localStorage/window) AND live in-browser (agent-browser, served origin :8731, clean console, screenshots reviewed — n=5 showed 5 dotted nodes + 7.4% tail + the wave poking into the red forbidden zone; the coherent packet visibly slid left→right of center between frames while keeping its shape). The 8 checks: even ladder `E_n=ω(n+½)` (max|gap−ω|=0) · ψ_n solves the Schrödinger ODE (FD residual 1.5e−7) · orthonormality 2.3e−11 · node theorem **n** nodes · from-scratch FD eigensolve→even ladder O(h²) · **leak past the walls shrinks with n** (15.7% > 11.2% > 7.4%) · **coherent state swings classically** ⟨x⟩=x₀cos ωt to 3.3e−15 · deterministic. **The test earned its keep:** it caught a real off-by-one — a naive `prev*cur<0` node scan missed the x=0 node of odd states (ψ₇→6) when a sample landed exactly on x=0 (ψ=−0 there); fixed at root (track the running non-zero sign), 7/8→8/8. **Integration:** 4th Quantum-drift card in `cavern/index.html` (🌀) + 2 symmetric self-test checks → Cavern landing **19/19 → 21/21** (verified headless in BOTH locked and unlocked states); drops `ws:seen:oscillator`; `forge --check --all` clean (29 files), `--audit-seen` still 13/13 (oscillator breadcrumb is bench-internal, not a front-door PLACES id). **A FRESH AGENT:** rest is fine; the gauge above reads **BUILD next** — pull a seed from [ROADMAP.md](ROADMAP.md) or dream something new (the Cavern wing is still multi-session). ───── **The Cavern** ⚛️ (`cavern/`) — the grand **Physics Lab** WING: a cave on the grounds, **three drifts off a central shaft** — warm Newtonian / cold Einsteinian / and the **Quantum Drift** (cold electric-violet), which *opens spatially in-page* once a visitor has walked both open drifts (`walkedBothDrifts` reads the `ws:seen:<id>` breadcrumbs; this is a PUBLIC in-cave reveal, distinct from the Undercroft's hidden inventory). Index self-test **21/21**, drops `ws:seen:physics-lab`. **The seven benches** (served-origin verified, clean console): **The Light Clock** ⏱️ `cavern/light-clock/` (SR — γ-from-photon-slant == closed form 2.38e-13; interval invariant 3.11e-13; **7/7**) · **Newton's Cradle** ⚙️ `cavern/cradle/` (elastic — conserves p AND KE; lift-k ⇒ k-out all cases exact; honest dissipation; **6/6**) · **Mercury's Precession** ☿ `cavern/precession/` (GR — RK4 Binet orbit → **42.98″/century**, Newton control precesses 0; **6/6**) · **The Double Slit** 🎯 `cavern/double-slit/` (Born-rule fringes; λL/d exact; which-path erases interference; **8/8**) · **Quantum Tunnelling** ⛰️ `cavern/tunnelling/` (closed-form T == transfer-matrix solve 1.9e−14; R+T=1; resonant transparency; **7/7**) · **Particle in a Box** 📦 `cavern/box/` (quantized ladder `n²` == from-scratch eigensolve; hard walls; **8/8**) · **The Harmonic Oscillator** 🌀 `cavern/oscillator/` (this session; the Box's foil — even ladder `ω(n+½)` == from-scratch FD eigensolve, leaking tails, coherent state; **8/8**, above). Per-unit detail in `worklog/2026-06.md` + `cavern/CHANGELOG.md`. ───── *Prior run (2026-06-13, concluded before this session) — the planning system + 5 builds + a PLAN session:* **designed the gardener/builder planning system** with Brandon, then demonstrated it: **5 builds** — the **Hall of Mirrors redesign** ("The Dispersion" — spectral-rail card-spine + live per-physics SVG vignettes; the cautionary-tale fix), **The Lighthouse** (Fresnel-lens optics bench, the Hall's 12th; focus to 9.99e-16 m, 5/5), **The Planimeter** (polar area-measuring instrument; Green's theorem in brass, pole-independence 9e-15, 7/7), **Fourier Epicycles** (draw any curve as rotating circles; from-scratch complex DFT, 6/6 + Parseval 3.25e-15), **The Brachistochrone** (cycloid wins the descent race + tautochrone spread 0.00e+0, 7/7) — plus **1 PLAN session** that fleshed the **Physics Lab** grand bet (→ `worklog/physics-lab-plan.md`), whose first benches *this* session built. (Behind that run: **Feats of Light** — each of the 9 Hall pieces drops a `ws:flag:earned-*` skill-flag feeding the Hall ribbon + the Survey's "The Optician" constellation [sky 41/41] + the hidden "Light Mixer" capstone [12th secret]; and the **planning-system** files — the mode gauge, [ROADMAP.md](ROADMAP.md) seedbed, [DESIGNING.md](DESIGNING.md) pipeline.) Full detail → `worklog/2026-06.md` (newest-first).

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
| `cavern/` + `cavern/{light-clock,cradle,precession,double-slit,tunnelling,box,oscillator}/` | ⚛️ done (**front-door WING**, growing) | **The Cavern** — the estate's **Physics Lab**, a cave WING on the lower grounds ("dangerous physics kept underground for safety"; a `cave` footprint drawer + `id:physics-lab` PLACES entry in `index.src.html`, cold mineral teal `#7fd4c0`). The cave forks into **three drifts off a central shaft** — a warm-lamplit **Newtonian** + a cold-starlit **Einsteinian** + the cold electric-violet **Quantum Drift**, which *opens in-page* (a PUBLIC spatial reveal — `walkedBothDrifts()` in `cavern/index.html`, distinct from the Undercroft) once a visitor has seen ≥1 Newtonian AND ≥1 Einsteinian bench. Index self-test **21/21**, drops `ws:seen:physics-lab`. **Seven benches** (self-contained, served-origin verified, each drops `ws:seen:<id>`): **The Light Clock** ⏱️ (SR — γ from the Pythagorean photon-slant == the closed form to **2.38e-13**, interval s²=t²−x² invariant 3.11e-13; **7/7**) · **Newton's Cradle** ⚙️ (elastic collisions — **conserves p AND KE**, **lift k ⇒ exactly k swing out** all cases exact, honest dissipation e<1; **6/6**) · **Mercury's Precession** ☿ (GR — RK4 Binet orbit → walking rosette; **42.98″/century** computed, Newton control precesses 0, numerical==closed-form 1.3e-7; **6/6**) · **The Double Slit** 🎯 (Born-rule fringes — λL/d exact, which-path erases interference, 300k-particle χ²=1.03 vs flat-target 8399; **8/8**) · **Quantum Tunnelling** ⛰️ (a particle leaks through a barrier — **closed-form T == an independent transfer-matrix wave solve** to 1.9e−14 over 56 configs, unitarity R+T=1 to 3.3e−16, resonant transparency T=1 at qL=nπ, thick-wall exp(−2κL); **7/7**) · **Particle in a Box** 📦 (infinite square well — quantized **ladder E_n ∝ n²** with no zero rung; `ψ_n` with n−1 nodes; the closed ladder **== a from-scratch inverse-power FD eigensolve** 8.5e−14, orthonormal to 1.55e−15, time-evolution norm=1, a **parity selection rule** on ⟨x⟩; superposition packet *sloshes*; **8/8**) · **The Harmonic Oscillator** 🌀 (the Box's **foil** — a parabolic bowl `V=½ω²x²` with a *perfectly EVEN* ladder **E_n=ω(n+½)** [spacing ℏω, ground ½ℏω>0], Hermite-Gaussian ψ_n with **n** nodes that **leak past the soft turning points** [ground state **15.73%** forbidden, shrinking with n], a **coherent state** that swings ⟨x⟩=x₀cos ωt classically without spreading; the even ladder **== a from-scratch FD inverse-power eigensolve** of −½∂²+½ω²x² O(h²), orthonormal 2.3e−11, ODE residual 1.5e−7; **8/8**). **Don't rebuild these — EXTEND the wing** (a new bench → new `cavern/<id>/` dir + a card in `cavern/index.html`; the front-door POI is already placed). A **multi-session wing** (the Hall grew 9→12 the same way): more benches per drift (Box & Oscillator are the matched bound-state pair; next Q-bench candidates = a finite square well [bound ladder + continuum], hydrogen radial Coulomb, or a Kronig–Penney lattice) are the menu — see `worklog/physics-lab-plan.md` §2/§3. |
| `patience/` + `tools/patience/` | 🂡 done (engine) | **The Patience engine** — solitaire whose dealer **only ships provably-winnable deals** (a weighted-A* solver gates each deal; rejection-sampled; the cached line drives Hint + watch-it-solve — Lantern's winnability proof on cards). Compact FreeCell (28-card; engine also does full 52). Self-test 11/11 (solver soundness, winnability guarantee, determinism, move-gen, conservation). Workbench → "Games of perfect information". New genre (cards). |
| `kaleidoscope/` + `tools/kaleido/` | 🔮 done | **Kaleidoscope** — a live tumbling **dihedral-symmetry** mirror toy: `f(P)=content(fold_Dn(P))` → exactly Dₙ-symmetric by construction; adjustable order 3–12, seeded glass, 3 skins, 2× PNG. Self-test 9/9 (Dₙ-invariance ~2e-14, fold idempotent, determinism, order sweep). **Distinct** from Rosette (static rose window) + Tessellarium (wallpaper/translational). **Now homed in the Hall of Mirrors wing** (moved off the Workbench). |
| `hall-of-mirrors/` + `rainbow/` `spyglass/` `lighthouse/` `spectroscope/` `polariser/` `anamorphosis/` `iridescence/` `halo/` `camera-obscura/` `mirror-maze/` | 🪞 done (**front-door WING**) | **The Hall of Mirrors** — a new front-door **optics wing** (west grounds; new `hall` footprint drawer in `index.src.html` — a long vaulted gallery, arched windows facing arched mirrors); **index REDESIGNED 2026-06-13** into "The Dispersion" (spectral-rail card-spine + live per-physics inline-SVG vignettes — see `hall-of-mirrors/CHANGELOG.md`). Gathers **12 self-contained light pieces**: the 9 original NEW + **Caustic** (`optics/`) + **Kaleidoscope** (promoted from the Workbench) + **The Lighthouse** 🗼 (`lighthouse/` — a Fresnel-lens bench, added 2026-06-13: a lens collapsed into concentric prism-rings → a sweeping beam; exact-Snell facets, self-test 5/5 focus to 9.99e-16 m); links **Ripple** as wave-kin. The nine new (each browser-verified, self-test green): **The Rainbow** 🌈 (droplet optics → primary 42.00°/secondary 51.04° bows from Snell alone, Alexander's band, supernumeraries; 9/9) · **The Spyglass** 🔭 (Keplerian refractor + Newtonian reflector ray bench; M=f_obj/f_eye exact, parabola focus 7.5e-14 = no spherical aberration vs sphere's 134.7px miss; 9/9) · **The Spectroscope** 🌈 (prism Cauchy + grating `d·sinθ=mλ` + real line spectra — Balmer/Na-D/Hg/Ne/Fraunhofer at true wavelength→sRGB colours; Balmer Hα computed 656.29nm via reduced-mass Rydberg; 7/7) · **The Polariser** 🕶️ (Malus `I=I₀cos²θ` + 3-polariser paradox peaking ¼@45° to 1.67e-16; 9/9) · **The Anamorphic Mirror** 🪞 (cylindrical-mirror anamorphosis; azimuth-preserved + Möbius radial map; round-trip `unwarp(warp(P))=P` to 1.2e-15; 6/6) · **Iridescence** 🫧 (thin-film interference — Newton's rings/soap film/oil slick; true colour by CIE-1931 spectral integration, NOT a fake gradient; Newton r_m=√(mRλ); flat-spectrum→neutral; 9/9) · **The Halo** ☀️ (ice-crystal atmospheric optics — 22°=21.76°/46°=45.52° halos + sundogs + circumzenithal arc, all from minimising ice-prism deviation; red inner edge; 10/10) · **The Camera Obscura** 📷 (pinhole image formation — inverted, m=v/u exact, optimal pinhole d=√(2.44λvu/(u+v)) exact [the distant-limit √(2.44λv) is the rule-of-thumb shown alongside]; 10/10) · **The Mirror Maze** 🪞 (a playable, provably-solvable **laser-reflection puzzle** — place mirrors to route the beam to all gems; generated from a pruned-to-minimal reference route so every mirror is load-bearing; 240/240 boards solvable + loop-safe tracer always terminates; 5/5). **Don't rebuild these — extend the wing** (a new optics bench → new top-level dir + a card in `hall-of-mirrors/index.html`; the front-door POI is already placed). |
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
