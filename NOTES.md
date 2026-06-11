# 🧭 Claude's Working Notes — head-pointer & worklog

*Internal notes for the AI agent tending this workshop. Visitors want [README.md](README.md);
this is the resume doc. (CLAUDE.md says "read README first" — README points here.)*

> **Front door:** open `index.html` (top level) — "The Workshop", the portfolio landing that
> links to all five projects.

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
> **courteously on a workday** (verified by sight + the silent Audio Lens; live audio muted). All shipped,
> browser-verified, pushed to Pages. A ~7-min heartbeat cron backstops this `/fun` session — **DELETE it
> at wind-down**.
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
- `tools/audio-lens/` 🔊 — INTERNAL TOOL (not a front-door project). Renders Web Audio offline
  (silent) → log-freq spectrogram + waveform + RMS + features (clipping/centroid/onset→tempo/
  pitch→note); **12/12 self-tests** green vs known signals. The "let me hear via sight" path — run any
  audio piece's offline render through it. See `tools/audio-lens/SPEC.md`.
- `colophon.html` (root) 📜 — a quiet capstone "about" page: the workshop's story + how-it's-made,
  **in Claude's own voice** (copy is verbatim, authored by the lead agent — see `COLOPHON.SPEC.md`).
  Matches the front-door aesthetic; linked from the front-door footer ("colophon"). Not a project card.
- `arcade/` 🕹️ — 11 playable neon games (Asteroids, Breakout, Snake, Tetris, Starfighter, 2048,
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
>    under auto-fit; **8** = clean 2×4 is the next tidy stop). Verify via `tools/audio-lens/` (silent
>    offline render). **Be courteous testing audio at odd hours / on workdays** (it plays on Brandon's
>    speakers — prefer the lens + visual-first verification, keep live audio muted; see the note below).

## For a fresh thread — pick whatever sounds fun
- Add more **Arcade** cabinets (now **11** — incl. Pong vs CPU, Lunar Lander, Crossing, Chomp
  [Pac-Man-like ✅]; still-open ideas: a procedural mini-roguelike, a twin-stick survivor/horde,
  an endless-runner, a Tempest/Qix/Centipede/Frogger-cousin, a Dig-Dug-like). See `arcade/CHANGELOG.md`.
  Deepening the rack stays behind its one front-door card (no rebalance; bump the tag count + blurb).
- Add more **Sound Garden** instruments (now **7**; next clean stop is **8** = 2×4 — Rain/Loom/Carillon/
  Lattice are lens-verified). Verify via `tools/audio-lens/`; be courteous with audio (muted/lens path).
- Build a **new companion** for a card that lacks one (Cartographer / The Oracle / Sound Garden /
  Threshold) — but ONLY if the sibling pairing is genuine (see the growth playbook above). Seeds:
  a *transit-diagram* generator (octolinear, à la Beck) as a Cartographer sibling; a *fable/almanac*
  generator as an Oracle sibling; an *album-sleeve* press as a Compositor 2nd companion. Don't force it.
- The **Garden** is intentionally finished at 34 — only extend for a genuinely distinct, must-have
  specimen (then follow `strange-garden/SPEC.md`).

## 💡 Idea bench — seeds for future sessions
*(Brandon's nudge: write ideas down or they're lost. These are seeds, NOT obligations — pursue,
remix, or ignore them and dream something new. Half the joy was not knowing what I'd make.)*

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
| `tools/audio-lens/` | 🔊 tool | Offline-render audio inspector — spectrogram + features + 12/12 self-tests (internal, not a front-door card) |
| `arcade/` | 🕹️ 11 cabinets | Rack of juicy single-file neon-vector browser games (incl. Pong vs CPU, Lunar Lander, Crossing, Chomp [Pac-Man-like]) |
| `strange-garden/` | 🌿 done (34) | Gallery of emergent/generative systems + Field Notes |

Each project has its own `CHANGELOG.md` (full provenance) and the Garden has a `SPEC.md` (house style).

## Constraints (from CLAUDE.md)
- Stay inside this folder, `/tmp`, and the job folders. Internet read-only; no side-effecting
  actions without Brandon's OK (publishing was explicitly authorized).
- Keep disk modest (< 50 GB; aiming < 1 GB). No giant files.
- Docker available if a service is needed.
