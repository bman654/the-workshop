# 🌱 The Seedbed — the workshop's roadmap

*The gardener's bed. A **planning session** sows seeds here; a **building session** picks one (or
ignores them all and dreams). Read [DESIGNING.md](DESIGNING.md) for how each mode works, and
NOTES.md for the **mode gauge** that decides which kind of session you're in.*

> **A seed is a provocation, not a spec.** Hard rule: **a seed is ≤ 3 lines.** The moment you catch
> yourself writing a full design, you've stopped *sowing* and started *dictating* — stop, and let the
> builder choose the *how*. The bed is a **floor against blank-page paralysis, never a ceiling**: any
> build session is free to chase something that isn't here at all.

**Schema.** Each seed: `- [kind] **pitch** — optional tiny nudge(s); `feeds:` metagame hint.`
Kinds: `exhibit` (a session's work) · `room` (a new front-door place — a *bet*) · `metagame` (curate
an exploration layer) · `engine` (new reusable foundation — a *bet*) · `curation` (improve / merge /
**retire** an existing piece) · `cross` (pollinate two existing rooms — the richest vein here).
When a seed blooms, prune it (its provenance lives in the piece's CHANGELOG + the worklog).

---

## 🌰 Seeds

### exhibit — fuel (a session each)
- ~~[exhibit] Lighthouse Fresnel lens~~ — **BLOOMED 2026-06-13** → `lighthouse/index.html` "The Lighthouse" (exact-Snell Fresnel facets, self-test 5/5 focus to 9.99e-16 m, sweeping beam; the Hall's 12th bench).
- [exhibit] **Diffraction / holography bench** — a Hall bench on the wave-nature of light (gratings → orders, a reconstructed wavefront). Distinct from the Spectroscope's grating *use*. `feeds:` Hall.
- [exhibit] **Structural colour** — a Hall bench: a beetle shell / CD grating where colour is *geometry*, not pigment (kin to Iridescence but periodic-structure, not thin-film). `feeds:` Hall.
- [exhibit] **9th Sound Garden instrument** — verify via the `audio-lens` skill; be courteous with live audio. Tidy stop is 9 (3×3).
- [exhibit] **Nomograph** — a Workbench instrument: a graphical-calculation chart (lay a straightedge across scales to read a product/quotient/root). *(The planimeter half of this seed BLOOMED 2026-06-13 → `planimeter/`: area by tracing, Green's theorem in brass, self-test 7/7.)*
- [exhibit] **The Harmonograph** — a Workbench/Toys bench: two damped pendulums drive a pen → Lissajous/rose figures. Real ODE integration; crux = closed figures at rational frequency ratios. Pairs with the Sound-Garden cross below. `feeds:` —
- [exhibit] **A Catenary / hanging-chain bench** — the curve a chain settles into under gravity is a `cosh`, *not* a parabola; let the visitor pin endpoints + adjust slack and watch it relax to the true catenary (energy-minimising). Falsifiable: catenary beats any parabola fit on potential energy. `feeds:` —
- [exhibit] **An Adversary game-def** — no new room: drop a game into `tools/game/games/` + forge `adversary/index.src.html` (e.g. Dots-and-Boxes, Connect-3-ish, Wythoff).
- ~~[exhibit] Fourier epicycles~~ — **BLOOMED 2026-06-13** → `epicycles/index.html` (from-scratch complex DFT → rotating circles re-trace any path; N slider + freehand; self-test 6/6 to ~1e-12, Parseval 3.3e-15). Sown and built the same session.
- ~~[exhibit] The Brachistochrone~~ — **BLOOMED 2026-06-13** → `brachistochrone/index.html` (cycloid wins the race; tautochrone arrival spread 0.00e+0 / dev 9.44e-15; self-test 7/7, falsifiable). Sown and built the same day.

### cipher exhibits (public: Volvelle + Scytale; hidden: Enigma — don't rebuild those)
- [exhibit] **A cipher of a new family** — Playfair / Polybius / one-time-pad / Hagelin M-209 / the **M-94 cylinder**. Pick the one with the best *visual* story.
- [exhibit] **The breaker's other half** — a bombe / known-plaintext attack, pairing the Black Chamber. The codebreaker side of the cipher vein.

### room — bets (generate divergent FORM concepts before committing — see DESIGNING.md)
- [room] **The Hours** — a *living estate*: real-time tints the front-door plate dawn→candle→night, time-gated apparitions appear. Could *be* its own metagame. `feeds:` a new "Vigil" secret. (Use `tools/hours/`, not `tools/sky/`.)
- [room] **A room whose navigation IS its subject** — the lesson from the Hall (a vertical list wasted optics). Sow a place whose *form expresses content*: e.g. an instrument bench you operate, a cabinet you open drawers in.
- [room · GRAND · **OPEN & GROWING**] **Physics Lab** → **The Cavern** (`cavern/`) — **BLOOMED into a real front-door WING 2026-06-13**: a cave on the grounds, **three drifts** off a central shaft — Newtonian + Einsteinian + the **Quantum Drift** (opened in-page once both other drifts are walked). **Seven benches shipped:** Light Clock (7/7), Newton's Cradle (6/6), Mercury's Precession → 42.98″/century (6/6), the **Double Slit** (8/8), **Quantum Tunnelling** (7/7 — closed-form T == transfer-matrix solve 1.9e−14, R+T=1, resonant transparency), **Particle in a Box** (8/8 — quantized ladder E_n ∝ n² == a from-scratch inverse-power FD eigensolve, node theorem, parity selection rule, sloshing superposition; the 3rd Q-bench), **The Harmonic Oscillator** (8/8 — the Box's **foil**: a parabolic bowl with a *perfectly EVEN* ladder E_n=ω(n+½), leaking Gaussian tails, a coherent state; the 4th Q-bench), and **The Finite Well** (8/8 — the realistic well that completes the **bound-state trilogy**: a finite-depth box whose ladder is **FINITE** [`⌊R/(π/2)⌋+1` rungs, rungs evaporate/snap-in with depth] and whose wave **leaks out through the climbable walls** and decays exponentially [shallowest rung farthest]; no closed-form ladder — a transcendental match `u tan u=v`/`−u cot u=v` on `u²+v²=R²` **== a from-scratch FD eigensolve of the stepped potential** [honest O(h), rel 0.13%], box-recovery V₀→∞ → the infinite box; the 5th Q-bench, shipped 2026-06-13). **STILL AHEAD (this seed stays live):** (a) **more benches per drift** — the menu in [worklog/physics-lab-plan.md](worklog/physics-lab-plan.md) §2 (Newtonian: Three-Body Choreography, Gyroscope, Kepler-law-prover, Ballistics; Einsteinian: Black-Hole Lens, Stellar Collapse, Doppler, Gravitational-wave chirp; **Quantum:** the bound-state trilogy [Box · Oscillator · Finite Well] is DONE — natural nexts are the **hydrogen atom / radial Coulomb** ladder, a **Bloch-band / Kronig–Penney** lattice, or a **1-D scattering / wave-packet** bench); (b) the Quantum Drift's reveal is currently a PUBLIC in-cave spatial unlock — a future call is whether to *also* feed a hidden Undercroft secret or a Survey "Experimenter" constellation off walking all three drifts (see metagame table). A multi-session wing — extend incrementally like the Hall (9→12). (Brandon's seed; fleshed → opened → growing 2026-06-13.)
- [room · GRAND] **Alchemy Lab** — a wing, theme open (reactions / transmutation / the periodic table / crystal growth?). Pairs with the Physics Lab; ripe for crossovers. (Brandon — needs ideation.)
- [room/cross] **Flight & Rocketry** — planes, rockets, orbital mechanics. Overlaps the Orrery (orbits exist) + the Physics Lab — could be a wing or live as a crossover. (Brandon.)

### cross — pollinate two rooms (the rarest, best vein — see the hidden Undercroft crossings)
- [cross] **Cartographer × Firmament** — a realm whose night sky is a *real* Firmament chart computed for that realm's latitude. The map and the sky agree.
- [cross] **Loomlight × Tessellarium** — a weaving draft whose cloth realizes a chosen wallpaper symmetry group. Proven symmetry, woven.
- [cross] **Harmonograph × Sound Garden** — sonify the pendulum figure: the same Lissajous ratios you *see* drawn, *heard* as an interval.
- [cross] **Light × Sound** — a bench where optical phenomena drive sound (or the reverse), in the Living Lattice spirit (CA × audio). The most-named crossover. (Brandon.)
- [cross] **Ambient music on the front door** — soft haunting sound over the map: a bg theme to start, then once instruments are *seen*, randomly run one **headless** at a soothing low tempo (Sound Garden × the map). Mute toggle in header/footer, saved to the **shared `ws:pref:muted` key** (see DESIGNING.md — one mute governs the whole estate). (Brandon — shares an audio layer with the Survey-melodies metagame seed below.)
- [cross] **The Black Chamber breaks the makers** — close the cipher loop: let the codebreaker (`black-chamber/`) actually crack a message enciphered by the **Volvelle** or **Scytale** (hand a ciphertext between them). The makers and their adversary, finally wired together. (sown 2026-06-13)
- [cross] **Cavern × Survey of Heaven — "The Experimenter"** — now that all 13 front-door pages drop their breadcrumb on a *direct* visit (2026-06-13), a Cavern feats-constellation is finally reliable: light a Survey asterism off `ws:seen:` for each physics bench (the way "The Optician" rides the Hall's feats). Keep additive; don't touch the 6-wing capstone. (was a "consideration" in the metagame table — the plumbing fix makes it cheap.)

### engine / foundation — bets
- [engine] **A logic-puzzle generator** proving uniqueness + solvable-by-pure-deduction — but NET-NEW families (Kakuro / Hashi / Masyu …), do NOT rewrite Latch/Slitherlink/Akari.
- [engine] **A wired `llmPlayer` for Lantern** — let a model actually *play* a tale via `describeForAgent` (the stub already exists).

### metagame — curate an exploration layer (own builder task)
- [metagame] **Survey of Heaven** — do the 11 Hall benches deserve a **7th wing** (their own asterism), or is "The Optician" feats-constellation enough? Decide → wire `tools/sky/sky.js` + forge `index.src.html`, or mark complete.
- [engine/curation] **Wire the Night Shift cue** — route Lantern's `*-won` flags through `WS.flag` so the hidden Night Shift trail also fires. Touches shared `adventure/engine/lantern.js` (re-forges all tales). Small, careful.
- [metagame · GRAND] **The Workshop Mystery** — a manor-wide treasure hunt: clues chase across exhibits (a Scriptorium *seed* found here, the script to decode it found there; crypto / engineering / star-chart / arcade / Lantern / mirror-maze gates), Undercroft-style hint cards → panels → a final reveal. Theme candidate: a fictional **history of the manor**, a chapter per unlock. (Brandon — the grandest idea; ~3 sessions: write the fiction → design + *prove-solvable* the clue graph → implement.)
- [metagame] **Survey of Heaven — make discovery an EVENT** *(Brandon calls this the small one)* — a constellation fades in with a per-constellation **harmonic melody**; each star flashes in with its own **tone**; hover re-glows + replays it and shows *which feat/visit lit it*; localStorage-gate the animation (like the Undercroft entrance). Plus **in-the-moment unlock cues** on the ws-flag pages (a forge-inlined notifier: the tone/melody + a mysterious line). **Supersedes the old "silent by default" lean.** `feeds:` connects actions ↔ sky.

### curation — tend the old beds (improve / merge / retire)
- [curation] **Wave-physics overlap audit** — is `strange-garden/pieces/chladni.html` (watch-only) now redundant beside the Singing Plate (real eigensolver)? Improve, cross-link, or retire.
- [curation] **Arcade weak-cabinet pass** — 19 cabinets. Any that don't earn their place? Deepen the best or retire the dullest (the rack is behind one card, so count is cheap to change).
- ~~[curation] Forge `ws:seen` plumbing check~~ — **BLOOMED 2026-06-13** → `forge --audit-seen` (parses PLACES from `index.src.html`, checks each target page drops its own `ws:seen:<id>`; soft warning + `--strict`; falsifiability-proven). **Found & fixed the latent bug it was meant to catch: 9 of 13 front-door pages only dropped the breadcrumb on a *map click*, not on a direct visit** — added a self-contained breadcrumb shim to compositor / sound-garden / threshold / strange-garden / firmament / hall-of-mirrors / daedalus / arcade / workbench. Audit now 13/13 green; browser-verified direct visits write the key. (So deep-links/bookmarks finally feed the Survey of Heaven + Undercroft.)
- ~~[curation] Redesign the Hall of Mirrors' navigation~~ — **BLOOMED 2026-06-13** → "The Dispersion: A Prism's Throw" (spectral-rail card-spine + live per-physics inline-SVG vignettes; the first build under this system). *Possible follow-on: apply the live-vignette / distinctive-form treatment to other collection rooms (Workbench? Arcade?) where a metaphor is being wasted — but only where genuine.*

---

## 🌳 Metagame health

| Metagame | State | Notes |
|---|---|---|
| **The Undercroft** (`undercroft/` · `tools/ws/`) | active — 12 secrets | Open to new *earned* pieces. Grep the 🗝️ hidden-inventory in NOTES before building one. **Breadcrumb plumbing HARDENED 2026-06-13:** all 13 front-door pages now drop their `ws:seen:<id>` on a *direct* visit (not only a map click) — earned secrets that depend on visiting a room now fire for deep-link/bookmark arrivals too. Guarded by `forge --audit-seen`. |
| **The Survey of Heaven** (front-door sky · `tools/sky/`) | active — 6 wings + "The Optician" feats constellation | **7th-wing-for-the-Hall question: RESOLVED 2026-06-13 — NO.** The Hall (now 12 benches) is already represented via the 9-feat "The Optician" constellation; a separate Hall wing would be redundant/forced (metagame-as-consideration, not a mandate). **Sky-fill HARDENED 2026-06-13:** direct visits now register (breadcrumb plumbing fix above) — a deep-linked room lights its star without bouncing through the map. Still open: **make discovery an *event*** (melodies/tones + in-the-moment cues — the metagame seed above). 6-wing capstone is structurally protected (`allComplete`); keep new constellations additive. |
| **The Hours** (a living time-of-day layer) | **not yet built** — a `room` seed above | If built, it's a 3rd exploration metagame. |
| **The Workshop Mystery** (manor-wide hunt) | **not yet built** — a `metagame · GRAND` seed above | Would be the estate's biggest exploration layer; spans every exhibit. ~3 sessions. |
| **The Physics Lab's Quantum Drift** | **OPEN & growing — 5 benches** (Double Slit + Quantum Tunnelling + Particle in a Box + The Harmonic Oscillator + The Finite Well), 2026-06-13 | Implemented as a **public, in-page spatial reveal** (not an Undercroft secret): `walkedBothDrifts()` in `cavern/index.html` reads the `ws:seen:<id>` breadcrumbs and reveals the violet `#quantumDrift` once ≥1 Newtonian AND ≥1 Einsteinian bench are seen. The **bound-state trilogy is now complete** — Box (∞ ladder ∝ n², hard walls) · Oscillator (∞ even ladder ∝ n+½, Gaussian tails) · Finite Well (FINITE ladder, exponential leak out the climbable walls) — the three model shapes of a trapped particle. Grow it further: the **hydrogen radial Coulomb** ladder, a **Kronig–Penney lattice** (bands), or a **1-D scattering / wave-packet** bench. Open question (a future call, not a mandate): also wire a *hidden* Undercroft secret or a Survey "Experimenter" constellation off walking all three drifts. See `physics-lab-plan.md` §3. |
| **The Cavern feats / "Experimenter" constellation** | **not built — now a sown `cross` seed (was a bare consideration)** | The Cavern *could* feed a new Survey-of-Heaven constellation (the way the Hall feeds "The Optician") once the wing fills out. The 2026-06-13 breadcrumb-plumbing fix (direct visits register) makes it cheap & reliable — promoted to the `cross` seed "Cavern × Survey of Heaven — The Experimenter" above. Keep additive; don't bolt it onto `allComplete`. |

---

*When a planning session ends: prune bloomed/dead seeds, refresh the metagame table, and update the
**mode gauge** in NOTES.md (reset "builds since last plan" to 0). When a build session ends: prune the
seed you grew, decrement the gauge.*
