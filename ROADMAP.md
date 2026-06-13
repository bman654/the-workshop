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
- [exhibit] **Lighthouse Fresnel lens** — a Hall bench: concentric prism rings collapse a lens to a sheet; show the beam gather. `feeds:` Hall optics wing.
- [exhibit] **Diffraction / holography bench** — a Hall bench on the wave-nature of light (gratings → orders, a reconstructed wavefront). Distinct from the Spectroscope's grating *use*. `feeds:` Hall.
- [exhibit] **Structural colour** — a Hall bench: a beetle shell / CD grating where colour is *geometry*, not pigment (kin to Iridescence but periodic-structure, not thin-film). `feeds:` Hall.
- [exhibit] **9th Sound Garden instrument** — verify via the `audio-lens` skill; be courteous with live audio. Tidy stop is 9 (3×3).
- [exhibit] **Planimeter / nomograph** — a Workbench instrument: measure area by tracing a boundary (Green's theorem made brass), or a graphical-calculation chart.
- [exhibit] **An Adversary game-def** — no new room: drop a game into `tools/game/games/` + forge `adversary/index.src.html` (e.g. Dots-and-Boxes, Connect-3-ish, Wythoff).

### cipher exhibits (public: Volvelle + Scytale; hidden: Enigma — don't rebuild those)
- [exhibit] **A cipher of a new family** — Playfair / Polybius / one-time-pad / Hagelin M-209 / the **M-94 cylinder**. Pick the one with the best *visual* story.
- [exhibit] **The breaker's other half** — a bombe / known-plaintext attack, pairing the Black Chamber. The codebreaker side of the cipher vein.

### room — bets (generate divergent FORM concepts before committing — see DESIGNING.md)
- [room] **The Hours** — a *living estate*: real-time tints the front-door plate dawn→candle→night, time-gated apparitions appear. Could *be* its own metagame. `feeds:` a new "Vigil" secret. (Use `tools/hours/`, not `tools/sky/`.)
- [room] **A room whose navigation IS its subject** — the lesson from the Hall (a vertical list wasted optics). Sow a place whose *form expresses content*: e.g. an instrument bench you operate, a cabinet you open drawers in.

### cross — pollinate two rooms (the rarest, best vein — see the hidden Undercroft crossings)
- [cross] **Cartographer × Firmament** — a realm whose night sky is a *real* Firmament chart computed for that realm's latitude. The map and the sky agree.
- [cross] **Loomlight × Tessellarium** — a weaving draft whose cloth realizes a chosen wallpaper symmetry group. Proven symmetry, woven.
- [cross] **Harmonograph × Sound Garden** — sonify the pendulum figure: the same Lissajous ratios you *see* drawn, *heard* as an interval.

### engine / foundation — bets
- [engine] **A logic-puzzle generator** proving uniqueness + solvable-by-pure-deduction — but NET-NEW families (Kakuro / Hashi / Masyu …), do NOT rewrite Latch/Slitherlink/Akari.
- [engine] **A wired `llmPlayer` for Lantern** — let a model actually *play* a tale via `describeForAgent` (the stub already exists).

### metagame — curate an exploration layer (own builder task)
- [metagame] **Survey of Heaven** — do the 11 Hall benches deserve a **7th wing** (their own asterism), or is "The Optician" feats-constellation enough? Decide → wire `tools/sky/sky.js` + forge `index.src.html`, or mark complete.
- [engine/curation] **Wire the Night Shift cue** — route Lantern's `*-won` flags through `WS.flag` so the hidden Night Shift trail also fires. Touches shared `adventure/engine/lantern.js` (re-forges all tales). Small, careful.

### curation — tend the old beds (improve / merge / retire)
- [curation] **Wave-physics overlap audit** — is `strange-garden/pieces/chladni.html` (watch-only) now redundant beside the Singing Plate (real eigensolver)? Improve, cross-link, or retire.
- [curation] **Arcade weak-cabinet pass** — 19 cabinets. Any that don't earn their place? Deepen the best or retire the dullest (the rack is behind one card, so count is cheap to change).
- [curation] **Forge `ws:seen` plumbing check** — add a soft `--check` *warning* when a front-door PLACES page never drops its `ws:seen:<id>`. (Dogfooding the one mechanical rule in DESIGNING.md.)

---

## 🌳 Metagame health

| Metagame | State | Notes |
|---|---|---|
| **The Undercroft** (`undercroft/` · `tools/ws/`) | active — 12 secrets | Open to new *earned* pieces. Grep the 🗝️ hidden-inventory in NOTES before building one. |
| **The Survey of Heaven** (front-door sky · `tools/sky/`) | active — 6 wings + "The Optician" feats constellation | Open question above: a 7th wing for the Hall? The 6-wing all-skies capstone is structurally protected (`allComplete`) — keep new constellations additive. |
| **The Hours** (a living time-of-day layer) | **not yet built** — a `room` seed above | If built, it's a 3rd exploration metagame. |

---

*When a planning session ends: prune bloomed/dead seeds, refresh the metagame table, and update the
**mode gauge** in NOTES.md (reset "builds since last plan" to 0). When a build session ends: prune the
seed you grew, decrement the gauge.*
