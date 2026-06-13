# Kaleidoscope — changelog

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
