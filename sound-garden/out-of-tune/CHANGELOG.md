# Out of Tune — changelog

A Sound Garden **leaf** (garden growth of a built wing) crossing the Sound Garden
with the **Orrery** (tuning × celestial-mechanics): a brass observatory **dial you
turn**. Concentric engraved brass orbit-rings — one per real planet, Mercury (inner)
→ Neptune (outer) — and a brass index-arm sweeps a translucent *listening window*
across them. Every ring inside the window **lights and sounds** a sustained
organ-drone at that planet's pitch. The solar system obeys **Kepler's third law**
to the decimal, yet voicing each planet's *period* as a tone lands the chord
audibly **out of tune** — and your ear is the judge.

Reached from the Sound Garden footer (a *family* link, mirroring The Comma); copies
the `← sound garden` back-link. **No front-door footprint, no `ws:seen`** — garden
work, not grounds.

## v1 — #76 (planted)

One self-contained `index.html` (vanilla JS, no deps) + the shared pitch/cents law
in `../pitch-core.mjs` + the planet data in `./data.mjs` + a Node twin
`core.test.mjs`. A genuinely **new fourth register** for the garden: sustained,
breathing **organ-drones** (vs the Carillon's struck bells, The Comma's pluck +
spiral, the Harmonograph's figure-ratios). Sustain is load-bearing — only a held
chord lets the ear catch the slow `|f1−f2|` beat of a sour interval.

### The enacted gesture (the grounded gate)
- **TURN the dial** — drag the brass arm anywhere on the wheel, scroll-wheel to
  fine-tune, or `←`/`→` detents that add/remove exactly one planet; `↑`/`↓` widen /
  narrow the listening window; click a ring (or `Enter`) to **solo**. As the window
  slides, the chord **re-voices** and you HEAR it land out of tune. **The chord IS
  the readout.** The only number-surface is a thin brass **tuning rail** along the
  lower rim (≤8 cents-ticks for the currently-sounding adjacent pairs) — a quiet
  side-rail, never the headline. No graph centrepiece.
- **Sourness made visible (one source of truth)** — between adjacent lit rings a
  thin amber **wolf-thread** stretches and **throbs at the beat rate**, the same
  throb the ear hears, driven by the SAME cents value the audio uses. Near-clean
  pairs (Earth→Mars at 5.35¢; the Concordia control) show a steady, un-throbbing
  teal thread (clean threshold < 6¢).

### Two distinct framings, both from one `foldToOctave` (kept separate in code)
- **The chord you HEAR** is voiced *period / Earth*, folded into one octave: Earth
  sits exactly on **220 Hz** (A3, home), every planet a single tone above it.
  Verified tones: Mercury 423.8 · Venus 270.7 · Earth 220.0 · Mars 413.8 ·
  Jupiter 326.2 · Saturn 405.0 · Uranus 288.8 · Neptune 283.2 Hz.
- **The detuning the readout / rail / wolf-thread / test measure** is the **adjacent
  period-ratio** folded vs nearest just (where the largest honest sourness lives).
  Real measured band: **5.35¢** (Earth→Mars off the M7) to **37.55¢** (Mercury→Venus
  off the M3, the sourest real pair); Saturn→Uranus is **24.14¢ off the tritone**.
  (The skeleton's "38–86¢" was a sparse-set artifact and is *not* used anywhere.)

### The math, single-sourced & self-tested
- **CORE A (the planet data)** — `./data.mjs` is the leaf's **sole copy** of the
  orrery's two independently-stored JPL fields per body (`a` AU, `period` yr) + the
  `col` tint, copied byte-faithfully from `orrery/index.html` `BODIES[]`. Both the
  page and the Node twin import it; the parity assertion confirms the test did not
  re-type the array. Pluto is present but **off by default**, honestly labelled a
  dwarf (mirrors the orrery; still passes Kepler at 0.0343%).
- **CORE B (the pitch authority)** — appended to `../pitch-core.mjs` as a new
  `// ===== OUT OF TUNE CORE … =====` block *after* the byte-untouched COMMA CORE /
  PITCH CORE (so the-comma and butterfly-voice keep byte-twinning their slices). It
  **reuses** `cents()` / `foldToOctave()` from the COMMA CORE — it does **not**
  re-define the pitch law. The page inlines a **byte-twin** of this slice (7795
  chars, verified identical).
- `runOutOfTuneSelfTest(planets, concordia)` is the **sole oracle**, called by both
  the in-page pill and the Node twin. Four legs:
  - **1 — Kepler** every real planet `|a^(3/2) − period| / period < 0.10%`
    (live worst **0.0616%**, Neptune → 1.6× headroom; a corrupt period fails ~190×).
  - **2 — audible detuning** every adjacent pair is **nonzero** and in **[3,60]¢**
    off the nearest just (live band 5.35–37.55¢) — the chord is provably sour.
  - **3 — control A (Concordia, fictional exact-3:2)** PASSES Kepler via the **band**
    (its `a^1.5 = 1.4999999999999998` is 1 ULP off 1.5, so `===` would false-fail)
    AND its interval snaps to **0¢ bit-exact** (`cents(1.5/(3/2)) === 0`). Its `a` is
    *derived* (`1.5^(2/3)`), never hand-typed. A pure beat-free 330 Hz fifth.
  - **4 — control B (Eris-X, corrupt test-only fixture, kept OUT of the dial)**
    `a:2.0 period:3.5` → rel **19.19% ≥ 0.10%**, asserts RED — the law-check has
    teeth (non-vacuous).
- **`core.test.mjs`** (the Node twin, **19/19, exit 0**): re-runs the four legs via
  the shared oracle, re-derives the Kepler band + the headline pairs + the chord
  tones, and asserts the single-source discipline — **OUT OF TUNE CORE byte-parity**
  (page slice === module, char-for-char), the prior **COMMA CORE** and **PITCH
  CORE** blocks **byte-untouched** (still === the-comma's / butterfly-voice's
  copies), an **anti-circularity** check (the `cents` / `foldToOctave` definitions
  live in exactly one module), and **CORE A parity** (imported `PLANETS` === the
  text of `data.mjs`).

### Audio
- Sustained organ timbre per voice: `sin(f) + 0.30·sin(2f) + 0.12·sin(3f)`,
  per-voice gain ≈ 0.16, soft 50 ms attack / 250–400 ms release (no clicks), gentle
  ±0.4¢ chorus. Eight in-phase voices peak ~1.82 worst-case, so all voices route →
  master GainNode (0.38) → DynamicsCompressor safety limiter → destination
  (**verified no clipping**).
- Muted by default, honouring the estate-wide `ws:pref:muted` key both ways; the
  AudioContext starts **suspended** and the first dial gesture both resumes it and IS
  the interaction (the mute default is the affordance — no separate unmute chrome).
- `window.__renderFullChord(s)` / `window.__renderSourPair(s)` /
  `window.__renderOffline(s, freqs)` render to a WAV `Blob` (OfflineAudioContext, no
  speakers) for Audio-Lens verification. **Verified:** full 8-voice chord peaks land
  on the predicted Hz (Earth 219.1≈220, Mars 413.6≈413.8), partials present, **clips:
  no** (peak −6.25 dBFS); sour pair 424.9≈Mercury · 271.4≈Venus · 540.7≈2×Venus.

### Accessibility + reduced-motion (both included)
- Canvas host is `role="slider"` with `aria-valuemin/max/now` (arm angle°) and an
  `aria-live="polite"` span that announces e.g. *"now sounding: Saturn, Uranus — 24¢
  off the tritone"* on each change. `←/→` detents (±1 planet), `↑/↓` window width,
  `Enter`/`Space` solo the nearest ring.
- `prefers-reduced-motion: reduce` → **no rAF loop, no throb**; renders ONE correct
  static sounding-chord frame (arm parked lighting Saturn+Uranus, both beads lit, the
  amber wolf-thread + its `+24¢` rail tick drawn statically, nameplates shown). Sound
  still starts on a user gesture. (Verified: `rafCalls === 0` under reduced-motion.)

### Cross
- Footer family link added to `sound-garden/index.html`. The Sound Garden × Orrery
  (tuning × celestial-mechanics) vein is now **crossed** — don't rebuild this leaf.
