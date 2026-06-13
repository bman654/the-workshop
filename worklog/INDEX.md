# Worklog Index

*One line per session, newest first. Detail lives in the monthly shard.*

## 2026-06 — [worklog/2026-06.md](2026-06.md)
- 2026-06-13 — **The Clockmaker** 🏮 (bonus) — the workshop's 3rd public **Lantern tale** (a midnight clockmaker's shop; light+lock+assembly); solver 5/5 — winnable in 13, softlock-free across 106 states; let-it-play solves it. HEAD `edaf5c5`.
- 2026-06-13 — **The Black Chamber** 🕵 (bonus) — the estate's first **cryptanalysis** piece (cipher makers → breaker): cracks Caesar/Vigenère/substitution with no key; self-test 14/14 (Caesar+Vigenère exact-key recovery, substitution ~97–100%, IoC 0.0689). HEAD `1abd15e`.
- 2026-06-13 — **The Mill** ⚙ (bonus) — the estate's first **computation** piece: a visible programmable **Turing machine**; the busy-beaver champions halt at their proven counts (BB(4) = **107 steps / 13 ones**); self-test 49/49. HEAD `2468552`.
- 2026-06-13 — **The Straightedge** 📐 (bonus) — the estate's first **linkage/kinematics** piece: the Peaucellier–Lipkin linkage draws a *mathematically exact* straight line from rotation (deviation **4.88e-15**), + a four-bar coupler-curve foil; self-test 14/14. HEAD `8ecf9ae`.
- 2026-06-13 — **Galton board** 🫘 (bonus) — the estate's first **probability** piece: balls → a bell curve with the exact binomial/normal overlay + a live χ² p-value; biased-p slider; self-test 12/12 (ideal exactly binomial; runs do-not-reject χ², a flat histogram IS rejected). HEAD `8ba8d08`.
- 2026-06-13 — **Kaleidoscope** 🔮 (bonus) — a live tumbling **dihedral-symmetry** mirror toy (every pixel folds its Dₙ-orbit to one wedge → exactly Dₙ-symmetric; order 3–12; self-test 9/9, invariance ~2e-14). Distinct from Rosette + Tessellarium. HEAD `6bb4c81`.
- 2026-06-13 — **The Patience engine** 🂡 (bonus after the wave) — a new genre: card solitaire whose **dealer only ships provably-winnable deals** (a weighted-A* solver gates each deal + drives Hint/watch-it-solve — Lantern's winnability proof on cards). Compact FreeCell; self-test 11/11. HEAD `4bd9b13`.
- 2026-06-13 — **THE BIG CREATIVE WAVE** (ideation fan-out → 5 parallel deputies): **The Adversary** ♟️ (a solved-games engine — play a provably-perfect opponent; 38/38) + **The Survey of Heaven** ✶ (metagame — the front-door map fills with stars as you wander; 22/22; POI label-overlaps still 0) + **The Singing Plate** 🎛️ (Chladni eigen-solver bench, the workshop's first spectral solver; 18/18) + **Bulwark** 🛡️ (Defender/Scramble side-scroller, arcade #19; replay-hash determinism) + **The Gnomon** 🌅 (operable sundial + analemma; 21/21). HEAD `dbaf864`.
- 2026-06-13 — **THE LETTERER** 🔤 — a reusable point-feature label-placement engine (`tools/label/label.js`: candidate-slot + simulated annealing, deterministic, forge+Node; self-test 12/12, in-page 24/24 → 0 overlaps) shipped as a provable specimen (Workbench → Toys & benches) — **and the front-door map now CONSUMES it to letter itself** (fixes the overlapping POI labels Brandon flagged; DOM-truth 0 overlaps fresh + Undercroft-revealed; `lx/ly` now optional). HEAD `9a3a062`.
- 2026-06-13 — **THE BIG REFRESH**: estate-map front door 🗺️ (data-driven POIs — replaces the card grid, dissolves the 10th-card ceiling) + **`ws:` forge-inlined** with an in-the-moment "something stirs beneath" unlock cue (foundation + all 9 trigger pages; ~14 pages now `.src.html`) + **Harmonograph** ✺ (pendulum drawing bench, 5/5) + **Scytale** 📜 (transposition cipher rod, 13/13). HEAD `3d9dbba`.
- 2026-06-12 — **Volvelle** 🔄 (bench instrument #4 — an operable Alberti cipher disk: Caesar/Vigenère/Alberti, drag-to-turn, 13/13) + **Ripple** 🌊 (wave-interference tank — drag sources, exact superposition, interference loci proven, 8/8; sibling to Caustic) + head-pointer fix (full **hidden inventory** in NOTES, per Brandon's "spoilers OK in NOTES") after catching & reverting a **duplicate Enigma** (one already exists hidden in the Undercroft).
- 2026-06-12 — Note-system rework (sharded worklog) + **Lantern** 🏮 → a new medium: interactive, stateful adventures (provably winnable & softlock-free; watchable "let it play" ghost w/ play/stop + solve-from-here, per Brandon's first play feedback) + **forge** (author-side inliner — one canonical engine, self-contained tales) + an 11th Undercroft secret (the hidden world's first interactive room). Public tales: The Lamplighter · The Ferryman. Engine v1.1.
- 2026-06-12 — Theogony name-distinctiveness fix (Jaro-Winkler < 0.72; self-test 5/5)
- 2026-06-12 — Undercroft 10th secret: The Reckoner 🧭 (working-instrument capstone trophy)
- 2026-06-12 — Morning summary: overnight `/fun` autorun shipped 17 pieces (consolidated)
- 2026-06-12 — Dig Dug 🕹️ → Arcade #18 (tunneler: dig · air-pump · drop-rocks)
- 2026-06-12 — Abacus 🧮 → instrument vein #3 (operable Japanese soroban; footer `count`)
- 2026-06-12 — Vanguard 🕹️ → Arcade #17 (Galaga formation shooter: capture-beam → dual fighter)
- 2026-06-12 — Astrolabe 🌌 → instrument vein #2 (planispheric astrolabe; footer `sky`)
- 2026-06-12 — Enigma 🔐 → new cipher vein (3-rotor Enigma I; Undercroft secret #9)
- 2026-06-12 — Slipstick 📐 → new instrument vein (working slide rule; footer `reckon`)
- 2026-06-12 — Caustic 💡 → new optics vein (steerable light-bench; footer `light`)
- 2026-06-12 — Loomlight 🧵 → new tactile vein (handweaving loom; footer `weave`)
- 2026-06-12 — Akari 💡 → logic-puzzle #3 (Light Up; puzzles trio complete)
- 2026-06-12 — Slitherlink 🔗 → logic-puzzle #2 (Loop-the-Loop / Fences)
- 2026-06-12 — Latch 🧩 → logic-puzzle #1 (new medium; front-door footer `puzzles`)
- 2026-06-12 — Theogony ⚡ → Threshold's companion / 7th wing (generative mythology engine)
- 2026-06-12 — The Almanac 📅 → Undercroft secret #8 (book-of-days under a real computed sky)
- 2026-06-12 — Qubit 🧩 → Arcade #16 (Q*bert-style isometric hopper)
- 2026-06-12 — Tessellarium 🔷 → Strange Garden's companion / 6th wing (17 wallpaper groups)
- 2026-06-11 — The Floating Ink 🌊 → Undercroft secret (mathematical marbling; paused cleanly)
- 2026-06-12 — Centipede 🕹️ → Arcade #15 (serpentine descent + segment-split)
- 2026-06-11 — End-of-session resume pointer + Undercroft discoverability fix (broken-stair tile + pulsing rune)
