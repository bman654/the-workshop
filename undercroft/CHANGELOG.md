# The Undercroft — changelog

## Build 6 — "The Almanac", a seeded book of days under a REAL sky (2026-06-12)

Added `undercroft/almanac.html` (≈1080 lines of code; self-contained, zero-dep, no-network) — the
Undercroft's **8th secret** and its **3rd cross-pollination**: it weds **The Oracle** (`verse/`, the
workshop's voice of invented folklore) to **Orrery** (`orrery/`, the real clockwork of the heavens).
A seeded perpetual **almanac / book of days** for an invented folk-calendar laid over the real
Gregorian year — *"a book of days written beneath a true sky."* Full brief in `ALMANAC.SPEC.md`.

- **What it composes.** From a **seed + a year** it writes a coherent book: a title plate (invented
  almanac name + a Poor-Richard-ish compiler + an epigraph), a **wheel-of-the-year** visual (12 months
  ringed, season-tinted, with the **four REAL cardinal points** marked in gold), and a **day-reader**
  (date input + prev/next-day + a Today button defaulting to the real current date) showing for any
  day: the **real Moon phase** (name + a drawn moon glyph + illumination %), the **season** and days
  since/until the nearest solstice/equinox, an invented **feast/observance**, a **weather-lore
  couplet**, an **omen** (anchored to the computed moon phase), a line of **husbandry counsel**
  (seasonally gated), and the weekday. Plus a **feast-days index** for the year, 3 cosmetic render
  styles (**Woodcut** warm cream / **Star-Chart** Orrery indigo+gold / **Plain Leaf**), and **2× PNG
  export** of the day-leaf.
- **The headline crux is that the sky is computed, not decorative** — a headless **5-check self-test**
  runs on load, calls the *real* engine functions, logs PASS per check, and shows a green
  **"sky verified — 5/5 ✓"** chip (never red):
  1. **Real Moon phase** (synodic-epoch method; new-moon epoch 2000-01-06 18:14 UTC, synodic
     29.530588853 d) verified ≤1 day of phase-age on 5 independently-known new/full moons (worst
     Δ0.61 d). A wider sweep matched 9 of 10 outside refs to ~1 day.
  2. **Real solstices & equinoxes** (Meeus ch.27 low-precision formulae + the 24-term periodic
     correction) verified within ±1 day of the known 2024 UTC dates — and spot-on across 2020/2025/2030.
  3. **Correct calendrical math** — weekday via **Zeller's congruence** (2000-01-01 = Saturday,
     2026-06-12 = Friday, Apollo-11 1969-07-20 = Sunday), Gregorian leap years (2000 yes / 1900 no /
     2024 yes), February length, day-of-year.
  4. **Seed purity / style-invariance** — `buildBook(seed,year)` takes no style argument; the content
     hash is identical across all three render styles (style only re-renders). Asserted by hashing the
     live entry across style flips.
  5. **Coherence** — a 23,016-day-entry sweep (7 seeds × 9 years, every day) found **0** template
     seams / NaN / empty fields; the omen always comes from *that day's* computed moon-phase pool and
     the counsel from *that day's* season pool (the seasonal gate is enforced, not hoped-for).
- **Folklore is curate-then-arrange** (the Oracle/Threshold idiom): hand-authored fragment pools the
  seed selects and lightly arranges through a small grammar/agreement pass, so each entry reads as
  *written* — wry, earthy, Poor-Richard-meets-a-hedge-witch — not mad-libbed. Same `(seed, year)` ⇒
  same book, always (xmur3 + mulberry32 per-field RNG streams). No RAF/interval loop at all (the wheel
  & moon are drawn once per state change), so there is nothing to leak on re-roll.
- **Trigger (exploration-combo): `ws:seen:verse` ∧ `ws:seen:orrery`.** `verse/` already self-drops its
  breadcrumb; **`orrery/index.html` now self-drops `ws:seen:orrery`** (deep-link robust). `almanac.html`
  drops `ws:seen:almanac` on load. New `SECRETS` row added (id `almanac`, accent `#cba15a`, riddle
  *"Set the speaker of days beneath the true wheeling of the heavens…"*). The room's count/meter/capstone
  auto-read `SECRETS.length` — **the Undercroft now holds 8 secrets** (6 places + 2 trophies); the
  capstone requires all 8.

### Verification (agent-browser, session `almanac-build`, served origin `http://127.0.0.1:8791`)

- **Self-test green** — console logs `5/5 checks PASS`; the panel chip reads **"sky verified — 5/5 ✓"**;
  **0 console errors/warnings** on the page (after 5 re-rolls + 10 day-steps the console held only the
  7 boot log lines).
- **Day-reader** renders coherent moon / season / feast / lore / omen / counsel across many dates
  (today defaults to the real 2026-06-12, Friday — correct weekday & a real Waning-Crescent moon).
- **Determinism & style-invariance** — re-roll changes plate/compiler/feasts while the *real* sky for
  the date stays put; re-binding a seed reproduces the same book; the entry text is **byte-identical**
  across Woodcut / Star-Chart / Plain Leaf (looks-only). **PNG export** produces a valid `image/png`
  (correct ‰PNG signature) at 2×.
- **Full unlock flow** (`ws:` cleared first) — the Undercroft shows the Almanac as a **locked ghost**
  at "0 of 2 signs" / "0 of 8 discoveries found" → visiting `verse/` → "1 of 2" → visiting `orrery/`
  → the niche **materialises** (full gold card, `Enter ▸` href `almanac.html`) and **Enter loads the
  page**. **0 console errors on `undercroft/index.html`, `verse/`, and `orrery/`.**
- **Bugs found & fixed during the build:** (1) the coherence self-test's seam regex matched `NaN`
  case-insensitively as a *substring*, falsely flagging the authored saint-name **"Cynan"** — tightened
  to match the literal error-tokens (`undefined`/`null`/`NaN`) case-sensitively as whole words; (2) the
  feast-name grammar had a dead double-assignment and conflated adjective-stems with "the X" phrases
  ("Old the Standing Corn") — replaced with a clean noun/connective stem pool so every name composes
  ("Goose the Loud Geese", "Lammas of the Last Sheaf").

## Build 5 — a new visual medium: "The Floating Ink", seeded marbling (suminagashi · ebru) (2026-06-11)

Added `undercroft/floating-ink.html` (888 lines, self-contained, zero-dep, no-network) — the
Undercroft's **6th place** and a **brand-new visual medium** for the workshop: **mathematical
marbling** (Japanese *suminagashi* / Turkish *ebru*). Floating ink on water, deformed by exact
fluid-displacement maps and combed into the classic patterns, then laid onto paper. Full engineering
brief in `FLOATING-INK.SPEC.md`.

- **What it draws.** A seeded marbled sheet via six recipes the seed/UI select — **Suminagashi** (drifting
  concentric rings), **Stone/battal** (mottled ground), **Gel-git** (wavy chevrons), **Non-pareil** (the
  iconic fine feathering), **Bouquet/çiçek** (flowers pulled with a stylus), **Vortex/girdap** (spiral
  snails) — over six historical palettes (Ottoman, Sumi, Antique endpaper, Peacock, Spanish wave,
  Nightfall). PNG export at 2×; optional "▶ watch it form" replay (reduced-motion safe).
- **The model.** Ink is a back-to-front **stack of colored polygons**; every operation transforms *all*
  existing vertices (a new drop also floats a fresh circle on top), exactly mirroring how real ink layers
  and shoves on the bath. Three operations: **Drop** (radial fluid injection), **Tine** (a comb tooth:
  drag along a line, decaying with perpendicular distance), **Vortex** (a stylus swirl). Combs are
  families of parallel tines. House idiom reused: seeded xmur3+mulberry32 PRNG, the dark glass control
  panel, `← the undercroft` back-link.
- **The correctness crux (workshop tradition — a built-in self-test, all 5 PASS).** The headline gate is
  the **ink-drop map** `P' = C + (P−C)·√(1 + r²/|P−C|²)`, which must be exactly area-preserving
  (Jacobian = 1, save the singular center where the new disk opens). Verified live:
  - (A) a region not containing the drop center keeps its area — **0.0000%** error;
  - (B) a region containing the center grows by *exactly* the injected disk πr² — **0.0100%** error;
  - (C) the radial identity `d'=√(d²+r²)` — max error **2.84e-14**.
  Plus: seed reproducibility (identical geometry fingerprint), **palette/style invariance** (same seed,
  any palette → identical geometry — the Firmament/Daedalus/Blazon crux), finiteness (14,080 vertices all
  finite), and tine correctness (on-line shift = u exactly, far shift ≈ 0).
- **Verified in a real browser** (served origin): all 6 recipes + multiple palettes render coherent
  marbled sheets, 60fps formation animation that settles on the deterministic final frame, seed-repro &
  palette-invariance confirmed, crisp 2× PNG export, 0 console errors over 60 re-rolls, no heap leak. One
  real bug found+fixed during the build: the formation animation never terminated (two clocks with
  different time-origins — fixed by reading one clock inside the frame callback).
- **Trigger (a 2nd cross-pollination secret — exploration-combo): `ws:seen:cartographer` ∧
  `ws:seen:scriptorium`** — *water (the mapmaker's sea) meets ink (the scribe's hand) = the marbled
  endpaper of an atlas.* Cartographer now self-drops its breadcrumb (deep-link robust; the front door
  already drops it on card-click); Scriptorium already self-drops. Riddle: *"Float the scribe's ink upon
  the mapmaker's sea, and comb it."* Drops `ws:seen:floating-ink` on load. Unlock flow verified on a
  served origin: locked ghost at "0 of 2 signs" / meter "0 of 7" → partial "1 of 2" → unlock (Enter ▸
  loads the sheet) → all-found capstone at "7 of 7".

> *Build 4 — "The Gilded Leaf" (`codex.html`, commit `cc97176`), an exploration-combo cross-pollination
> of verse × script — shipped without its own entry here; recorded for completeness.* The Undercroft now
> holds **7** secrets — **5 places** (Living Lattice, The Long Quiet, Rosette, The Gilded Leaf, **The
> Floating Ink**) + **2 trophies** (Eleven, The Survivor). All trigger types remain demonstrated.

## Build 3 — a new visual medium: "Rosette", a seeded Gothic rose window (2026-06-11)

Added `undercroft/rosette.html` — a single self-contained, zero-dependency, no-network HTML maker,
intended as the Undercroft's **rarest** inhabitant (a HIDDEN *place* — directly URL-reachable, but the
gating is about *revealing* it). It is a **brand-new visual medium** for the workshop: a seeded
**stained-glass rose window** — concentric rings of repeating radial sectors with **N-fold symmetry by
construction**, jewel-toned lit glass, dark lead came, cusped/foiled tracery, and a soft backlight bloom.

- **What it draws.** A central oculus/boss (a foiled rosette or quatrefoil medallion) → 3–6 rings of
  glass → an outer framing band, all centred on the canvas. Each ring is subdivided into the petal-count
  sectors (or 2× on wider/outer rings when complex); the motif for one sector is generated once and
  **rotated `count` times**, so the window is perfectly symmetric. A curated motif vocabulary the seed
  arranges so it always composes: roundels, vesica/almond petals, lozenges, trefoils, quatrefoils,
  pointed lancets, foiled fans. Glass is filled first with a radial lit-glass gradient (brighter core,
  darker at the leading), then the dark **lead came** is stroked on top of every cell.
- **House idiom.** Reuses Lattice's left control **panel** (seed text + ⚄ dice, sliders/selects), the
  full-bleed canvas, dim HUD, and the **xmur3 + mulberry32 PRNG** (`rngFor`/`hashSeed`) so the window is
  a pure function of the seed. Back-link top-right `← the undercroft` → `index.html`. Accent: cobalt
  `#5b8dff`. Controls: Seed, Palette (6 named jewel sets), Petals (6–24), Rings (3–6), Complexity,
  Leading, Glow, Background (stone/dark/parchment), Re-roll, Export PNG; keys `r` re-roll, `s` save,
  `h` hide panel; click canvas to re-roll.
- **Seed-pure, palette-invariant.** Geometry (ring radii + per-ring cell counts + motif ids) is a pure
  function of `(seed, petals, rings, complexity)`; the **palette is a separate recolour layer** applied
  only at draw time and never touches geometry. Introspection hook `window.__rosette = { seed, seedInt,
  petals, rings, palette, signature() , … }`; `signature()` is a deterministic geometry string.
- **Palettes (recolour only):** Chartres, Sainte-Chapelle, Rose Gold, Forest, Amethyst, Grisaille — each
  a harmonious set of saturated glass HSLs + a dark leading + a backlight tint.
- **Breadcrumb.** Drops `ws:seen:rosette` on load (try/catch, silent if storage is off).
- **File:** `undercroft/rosette.html` — **772 lines**, self-contained, relative links only.

### Verification (agent-browser, session `rosette-build`, served origin `http://127.0.0.1:8765`)

- **Renders as a designed rose window:** clearly symmetric, concentric, jewel-toned, cusped — not random
  spokes / a pie chart. Hero (`rosette`/Chartres, 12-fold, 4 rings) + 3 variety shots captured: Sainte-
  Chapelle 16-fold/5-ring, Rose Gold 8-fold/3-ring, Amethyst 20-fold/6-ring (max complexity). Draw time
  **~2–3 ms** (≪ 150 ms target); DPR-aware 2× export.
- **Clean console:** zero errors / zero warnings after stress-exercising every code path (all 6 palettes,
  petals 6/10/16/24, rings 3–6, complexity 0 and 1, re-seed, PNG export). Captured via injected
  `console.error`/`warn` + `error`/`unhandledrejection` listeners → `{errors:[],warns:[]}`.
- **Reproducibility:** same seed+params → identical `signature()` (switched away to another seed and back
  → byte-identical); different seeds differ; numeric seeds deterministic.
- **Palette-invariance:** the same seed under Chartres / Amethyst / Forest yields **identical**
  `signature()` (palette recolours, geometry unchanged).
- **Controls:** petals/rings/palette/complexity/leading/glow/background all visibly work; **PNG export**
  downloads a clean **2000×2000** image (verified dims + viewed — crisp leading, glowing glass).
- **Breadcrumb:** `ws:seen:rosette` present in localStorage on load (served origin, not `file://`).

> Not yet wired into the Undercroft `SECRETS` table — this build delivers the maker page itself per its
> spec (the file being URL-reachable is fine; *revealing* it is a separate, future step: decide the
> trigger, drop the relevant breadcrumb(s), append a `SECRETS` row, test the trail on a served origin).

## Build 2 — 2nd secret: "The Long Quiet" (patience/dwell trigger) (2026-06-11)

Added the **second inhabitant** of the Undercroft and the framework's **second trigger type:
patience/dwell** (Build 1's Quickening was an exploration *combo*). Lingering among the Sound Garden
voices accrues `ws:dwell:*` time; once the summed total crosses 150000 ms (~2.5 min) the voices set
`ws:flag:patience`, which unlocks a new contemplative *place*, **The Long Quiet**.

- **New SECRETS row** (inserted as the **2nd** entry, between `quickening` and `eleven` ⇒ order is
  place, place, trophy): `id:'the-long-quiet'`, `kind:'place'`, badge `🌙`, `href:'the-long-quiet.html'`,
  unlocked by `s => s.has('ws:flag:patience')`, with riddle *"Stillness is also a way of looking. Stay a
  while among the voices."* and a single sign *"unhurried time spent among the voices"* (`ws:flag:patience`).
  Added a moonlit `accent:'#9ab0c9'` to match the existing rows' `accent` field (every other row has one;
  without it the locked-card `--c` glow would be `undefined`).
- **Progress meter is automatic.** It already reads `SECRETS.length` (no hardcoded "2" anywhere), so it
  now shows **"of 3"** with zero extra wiring.
- **New reward page `the-long-quiet.html`** — a single self-contained, zero-dep, no-network page. A
  *restful* sibling of this room: dark candle-/moon-lit vault, Georgia serif, ui-monospace kick, but slow
  and unhurried — the prose breathes in, centered. Ambient visual is a single **slow-breathing luminous
  form** (~16 s breath cycle, gentle sway) with barely-drifting motes settling around it, drawn with
  `globalCompositeOperation:'lighter'`; pauses when hidden, honours `prefers-reduced-motion`, never throws.
  Drops an optional `ws:seen:the-long-quiet` breadcrumb on load. Back-link `← the undercroft` → `index.html`.
- **Verified on the served origin** (`http://127.0.0.1:8765`, never `file://`): with `ws:flag:patience=1`
  the card materialises (full card, `Enter ▸` → `the-long-quiet.html`) and progress reads **"1 of 3
  discoveries found"**; the page loads at ~60 fps (measured 60.7) with a clean console. With no flag the
  card is a locked ghost showing the riddle and "0 of 1 sign gathered", progress "0 of 3". Screenshots of
  unlocked + locked + the page captured.

## Build 1 — the hidden room (2026-06-11)

**What it is.** `undercroft/index.html` is a single self-contained, zero-dependency, no-network HTML
page — the workshop's *third* growth axis. It is the reader/aggregator of the `ws:` breadcrumb
convention (see `/UNLOCK.md`): it inspects the `ws:` localStorage namespace and reveals pieces the
visitor has *earned* by how they wandered. Locked secrets appear as ghostly silhouettes (redacted
names, dimmed badges) showing a riddle-hint and a per-secret "signs" checklist so the visitor sees
how close they are without a spoiler. Unlocking a secret **materialises** it (fade + bloom-in) into a
full card: a place gets a working `Enter ▸` link, a trophy gets an `EARNED` stamp.

**Aesthetic.** Candle-lit vault beneath the workshop — Georgia serif title in a gold/parchment
gradient, ui-monospace kicks, a vaulted vignette, a gold progress meter, and a cheap calm ambient
backdrop of drifting candle-dust motes (capped at ~40 particles, DPR ≤ 2, pauses when the tab is
hidden, honours `prefers-reduced-motion`). Matches the front-door house style but darker/quieter.

**Data-driven.** A single declarative `SECRETS` array drives the whole room (launch data exactly per
spec §2): `quickening` (a *place* → `../sound-garden/quickening.html`, unlocked by
`ws:seen:game-of-life` **and** `ws:seen:lattice`) and `eleven` (a *trophy*, unlocked by
`ws:flag:eleven`). Adding a future secret is a one-object append.

**Reader, never a destructive writer.** The room never writes `ws:seen/best/dwell` of other pieces.
It does drop its own optional `ws:seen:undercroft` breadcrumb on load (explicitly allowed by the
spec). The footer "forget my discoveries" reset confirms, then removes **only** keys prefixed `ws:`.

**File:** `undercroft/index.html` — 377 lines, self-contained, relative links only.

---

### Verification (agent-browser, session `undercroft-build`, served origin)

All six states were driven over **http://127.0.0.1:8765/undercroft/** (NOT file:// — localStorage is
per-origin). `localStorage` was manipulated via JS, the page reloaded, state asserted from the DOM,
and screenshots captured. Console was clean (empty buffer) throughout every state.

| # | State | Result | Screenshot |
|---|---|---|---|
| 1 | **Fresh** (ws: cleared, reload) | Both locked; ghost silhouettes + riddles; "0 of 2 discoveries found"; tallies "0 of 2" / "0 of 1"; all signs unchecked; bar 0%. Clean console. | `screenshots/01-fresh.png` |
| 2 | **One sign** (`ws:seen:game-of-life`) | Living Lattice still locked; "1 of 2 signs gathered"; the gathered sign checked (gold ✓), the other unchecked; "0 of 2 found". | `screenshots/02-one-sign.png` |
| 3 | **Both signs** (+ `ws:seen:lattice`) | Living Lattice **materialises** → full card, `Enter ▸` link `href="../sound-garden/quickening.html"`; "1 of 2 found"; bar 50%. | `screenshots/03-both-signs.png` |
| 3b | **Enter ▸ nav** | Clicking `Enter ▸` navigated to `http://127.0.0.1:8765/sound-garden/quickening.html` (title "Quickening") and the instrument loaded. | `screenshots/03b-quickening-loaded.png` |
| 4 | **Eleven** (`ws:flag:eleven=1`) | Eleven trophy unlocks → `EARNED` stamp, **no link**; "2 of 2 found"; bar 100%. | `screenshots/04-eleven.png` |
| 5 | **Reset** | "forget my discoveries" + confirm → all `ws:` keys removed (verified `remaining_ws_keys: []`); both re-lock; "0 of 2 found"; bar 0%. | `screenshots/05-reset.png` |
| 6 | **Degrade** (storage made to throw) | `body.no-store` set; calm note shown ("…your browser isn't letting it remember right now. Everything here is a bonus; explore freely."); everything locked; **no console errors**. | `screenshots/06-degrade.png` |

**Animation:** measured **61 fps** with the ambient motes running (1280×900 viewport).

**Note on the reset test:** native `confirm()` is a blocking dialog that wedges the CDP daemon, so
the reset's *confirm gate* was exercised by stubbing `window.confirm → true` (simulating the user
pressing OK) and then triggering the real `#reset` click handler — i.e. the actual key-clearing +
re-render code path ran. The confirm dialog itself is wired with a standard `confirm()` and renders
its message; it was just auto-accepted rather than clicked by the automation.

**Spec deviations:** none functional. Screenshots are stored under `undercroft/screenshots/` for
durability (originals also in `/tmp/undercroft-shots/`).
