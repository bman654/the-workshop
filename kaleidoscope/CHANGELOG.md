# Kaleidoscope — changelog

## 2026-07-21 — The Green Corridor (the room's second body)

Added `kaleidoscope/the-green-corridor/` — a **companion**, gathered under this room's
roof rather than detached: no PLACES entry, no map slot, no `ws:seen:` breadcrumb.
Upstairs you look through the small end and the secret keeps itself; here the lid is
off — the **same two mirrors, seen from above**, with one candle between them and the
corridor of images compounding away into bottle-green.

**A delight piece, and it claims nothing.** The parent proves an exact theorem; this
does not, on purpose. `RHO` was chosen because the corridor looks right, and the page
says so out loud. No self-test chip; the shipped page is grepped for claim creep.

### What I built
- `tools/corridor/orbit.js` — ONE generator (reflect in A, then B, alternating, one
  chain each way) so θ = 0, the parallel D∞ ladder, needs no special case. Soft merge
  + soft birth, both C² and energy-carrying, so nothing pops. `K_MAX = 160`, a fixed
  constant.
- `tools/corridor/tint.js` — the colour ladder, powers in LINEAR light with a
  half-LSB ordered dither, **shared with the parent page's door**.
- `tools/corridor/flame.js` — the living candle, on smooth value noise.
- `tools/corridor/corridor.test.cjs` — the payoff-liveness twin, 48/48.
- The page: top-down orthographic plan, a real instrument (ears tilt, bar faces widen
  the throat, latch pins take a mirror away), the five-stage snap beat, and a keyboard
  that is an equal citizen (`[` `]` play the full close).
- A **lit peephole** on the parent page — a live miniature of the destination.

### Two things the build got wrong first, kept in the notes
- The flicker began as five incommensurable sines. A finite sum of sines is *almost
  periodic*: the twin caught the candle recurring at 21.9 s with autocorrelation 0.99.
  Rebuilt on value noise, whose autocorrelation decays and never revives.
- `render()` threw on the exact frame the ring closed — a stale reference into the
  rebuilt flame core. The room froze mid-beat and the frame rate still read 60, because
  the average had nothing new to average. Only the first-hand walk found it; the loop
  now names its first failure loudly.

### Honesty correction
One mirror removed leaves the candle **plus one image = two lights, one reflection**.
"Exactly one flame" is true only with both mirrors gone, and the copy says *one
reflection*.

### What the fresh-eyes review changed (same day)
- **The honesty correction had missed one line.** The plaque's exit line still read
  *"With one mirror, one flame."* while the caption six inches away said *one
  reflection* — so the page contradicted itself, and contradicted the two flames on
  screen. Corrected, and the twin now **greps the shipped page** for the phrase: the
  maths tests assert geometry, not prose, which is exactly how it survived.
- **"Take one away" was a one-way door.** A latch pin rides on its own mirror bar, so
  once the mirror is gone the pin travels with the ghost — under the plaque at wide
  angles, off the frame below ~10°. The toggle was correct in code; it was simply
  **unreachable**, so a console-clean, 60 fps, all-green room still stranded you at a
  reload. Added the way back: a brass **↺ pill** in the caption's lane (the one strip
  nothing else occupies) and the **`0`** key, offered only when there is something to
  undo, and covered by the in-page twin. See SPEC §5.4b.
- **Verified rather than reasoned:** reduced motion (the frame goes still — flicker
  spread falls to 0.2% of its live value) and the flicker's *character* over a
  sustained watch (lag-1 autocorrelation 0.989, median frame step 0.28%, total swing
  14.6% — a breath, not a twitch), both of which the build had left to judgement.

## 2026-06-13 — Initial build (tumbling Dₙ mirror toy)

Built `kaleidoscope/` — a live, tumbling N-fold kaleidoscope with **provable
dihedral (Dₙ) symmetry**. A circular eyepiece onto a chamber of seeded
translucent glass shards; the image is exactly `Dₙ`-symmetric (`n` rotations ×
`n` reflections) by construction and tumbles live. The workshop's first
**point-dihedral** symmetry toy — distinct from the static Rosette and from the
Tessellarium's translational wallpaper groups.

### What I built
- **Pure DOM-free core** (`tools/kaleido/kaleido.js`) — the single source of truth:
  - `foldDn(n, x, y)` — the load-bearing fold: maps any `P` and every `g·P`
    (`g ∈ Dₙ`) to one canonical point in the fundamental wedge `φ ∈ [0, π/n]`
    (rotation-fold mod `2π/n`, then mirror-fold the back half).
  - `groupElements(n)` — the `2n` elements of `Dₙ` as 2×2 linear parts.
  - `makeRng` (xmur3 → mulberry32) seeded contents.
  - `buildScene` / `sceneAt` — deterministic shard scatter inside the wedge +
    the tumble (shards kept in-wedge by wall-reflection; re-folded each frame).
  - `content` / `sampleAt` = `content(foldDn(P))` (the field the page paints).
  - `SKINS` (glass · stained · ink) + `mixSlots` — palette-only; geometry never
    reads them; coverage-driven alpha is skin-invariant.
  - `geometryFingerprint` — colour-free hash proving skin-invariance.
  - `runSelfTest()` — the exact battery the in-page chip runs.
- **Node self-test** (`tools/kaleido/kaleido.test.cjs`) — runs the shared core
  battery (4 checks) **plus** 5 hardened Node assertions → **9/9 PASS**, exit 0.
  Max Dₙ-invariance error ~`2e-14` (machine precision).
- **Forge page** (`kaleidoscope/index.src.html` → `index.html`) — dark-aesthetic
  brass eyepiece, live raster of `sampleRGBAAt` per pixel + upscale, controls
  (order 3–12, seed + reseed die, tumble speed, skin, pause, 2× circular PNG),
  `← workshop` back-link, collapsible panel, reduced-motion safe. Green chip
  reports `4/4` (the core checks) and logs to the console like the Node test.
  Forge-includes `../tools/kaleido/kaleido.js` + `../tools/ws/ws.js`; drops
  `ws:seen:kaleidoscope`.

### The crux it proves
The rendered field is **exactly Dₙ-symmetric** — `content(fold(P)) == content(fold(g·P))`
for every `g` in `Dₙ` (all `n` rotations + all `n` reflections), to machine
precision. The seams are a true mirror, not a fake rotate. Holds across the full
order range `n=3..12` and every frame of the tumble.

### Verified
- `node tools/kaleido/kaleido.test.cjs` → 9/9 PASS, exit 0.
- `node tools/forge/forge.mjs --check --all` → all current, exit 0.
- Real-browser pass on a live origin (see commit message): chip `4/4`, visibly
  n-fold, live re-symmetrize on `n`, reseed, tumble, skin-identical geometry,
  `ws:seen:kaleidoscope` set, reduced-motion pause, 0 console errors.
