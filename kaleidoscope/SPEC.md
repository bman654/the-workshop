# 🔮 Kaleidoscope — build spec

*A live, tumbling **N-fold mirror toy** with **provable dihedral (Dₙ) symmetry**. A circular eyepiece
onto a chamber of seeded translucent "glass" shards; viewed through an N-fold mirror, the image is
**exactly Dₙ-symmetric** — `n` rotations × `n` reflections (order `2n`) — and it tumbles live. Adjust
the symmetry order (3–12), reseed the contents, dial the tumble speed, switch skins (glass · stained ·
ink — palette-only, geometry-identical), pause, and export a 2× PNG. The workshop's signature: a
built-in self-test that **proves** the field is exactly Dₙ-symmetric to machine precision — the seams
are a true mirror, not a fake rotate.*

Folder: `kaleidoscope/`. Forge page: `kaleidoscope/index.src.html` → `kaleidoscope/index.html`
(no network, no deps, **NO audio**). DOM-free core: `tools/kaleido/kaleido.js`. Node self-test:
`tools/kaleido/kaleido.test.cjs`. Build log: `kaleidoscope/CHANGELOG.md`.

> **Distinct from its symmetry siblings.** The **Rosette** (`undercroft/rosette.html`) is a *static*
> generative rose window — one painted image, no adjustable order, no tumble. The **Tessellarium**
> (`tessellarium/`) is *translational* symmetry — the 17 plane (wallpaper) groups across an infinite
> tiling. The Kaleidoscope is a **point-dihedral** toy: a single point-group `Dₙ` with an **adjustable
> order**, rendered **live** so the contents tumble while the symmetry holds every frame. Different
> group family, different motion, different operability.

---

## §0 — The crux (the load-bearing claim)

A kaleidoscope is an N-fold mirror. The naive build replicates one wedge `n` times by rotation and
hopes the seams meet — they don't, exactly, and a reflection is not a rotation. We make symmetry an
**identity, not a copy**: we render a field of the form

```
f(P) = content( foldDn(n, P) )
```

where `foldDn` maps any point `P` — **and every image `g·P` for `g` in `Dₙ`** (all `n` rotations and
all `n` reflections) — to the **same** canonical representative inside one fundamental wedge. Because
the fold collapses a whole `Dₙ`-orbit to a single point, `f(P) == f(g·P)` holds **by construction**,
to machine precision. That is the provable claim.

**The fundamental wedge** of `Dₙ` is the angular sector `φ ∈ [0, π/n]` (half of the `2π/n`
rotation-sector — the mirror splits each sector in two). The fold, in polar `(r, θ)`:

1. **rotation-fold** — reduce `θ` into `[0, 2π/n)` (mod the sector) — collapses the `n` rotations;
2. **mirror-fold** — if the residual exceeds the half-wedge `π/n`, reflect it: `a' = 2π/n − a` — lands
   in `[0, π/n]` and collapses the `n` reflections.

`r` is untouched: every element of `Dₙ` is an origin-fixing isometry, so it preserves radius and only
permutes/flips the angle by multiples of `2π/n`. Steps 1–2 are invariant under exactly those
operations ⇒ `foldDn(n, P) == foldDn(n, g·P)` for every `g ∈ Dₙ`.

**`content`** is the chamber's glass: a deterministic (seeded) scatter of translucent shards living
inside the wedge; `content` sums their soft anisotropic falloffs. Since `content` reads only the
**folded** wedge point, the rendered field is exactly `Dₙ`-symmetric — the lobes meet exactly at every
mirror seam.

**The tumble** advances the shard scene over time *within the wedge* (radius breathes, angle swirls,
each shard spins), and the whole field is re-folded every frame — so each frame is still exactly
`Dₙ`-symmetric. Symmetry is preserved across the entire animation, not just at rest.

---

## §1 — The core (`tools/kaleido/kaleido.js`)

DOM-free, dual-use IIFE attaching a `Kaleido` global; ends with the byte-identical module guard
(`if (typeof module !== 'undefined' && module.exports) { module.exports = Kaleido; }`) so forge strips
it for the page and Node `require`s it for the test.

- **`makeRng(seedStr)`** — `xmur3` → `mulberry32` deterministic stream (same idiom as `ws.js` /
  `tessellarium`). Same seed ⇒ identical shard layout.
- **`foldDn(n, x, y)`** → `{x, y, r, phi}` canonical wedge point — the load-bearing fold (§0).
- **`groupElements(n)`** → the `2n` elements of `Dₙ` as 2×2 linear parts (`n` rotations + `n`
  reflections) — used by the self-test to apply every `g`.
- **`buildScene(seed, n[, count])`** → deterministic shard list inside the wedge (geometry only — no
  colour resolution); **`sceneAt(scene, t)`** → the tumbled scene at time `t` (shards kept in-wedge by
  triangle-wave reflection at the walls).
- **`content` / `contentRGBA` / `sampleAt` / `sampleRGBAAt`** — `f(P) = content(foldDn(P))`, scalar and
  per-palette-slot forms.
- **`SKINS` (glass · stained · ink) + `mixSlots`** — palette-only; geometry never reads them. Alpha is
  coverage-driven, so it is identical across skins.
- **`geometryFingerprint(scene, n, t)`** — stable FNV hash of the folded scalar field on a fixed grid;
  reads geometry only ⇒ identical across all skins.
- **`runSelfTest()`** → `{pass, n, total, results}` — the exact battery the in-page chip runs.

`N_MIN = 3`, `N_MAX = 12`.

---

## §2 — The self-test (`kaleido.test.cjs` + the in-page chip)

The in-page chip and the Node test call the **same** `Kaleido.runSelfTest()` — identical math, both
report `4/4`. The Node test (`kaleido.test.cjs`) runs that core battery (4 checks) **plus** 5 hardened
Node-side assertions (B1–B5), reporting `9/9`.

Core battery (the chip):

1. **Dₙ invariance** — for a battery of random points, orders `n=3..12`, and time phases, and for
   **every** `g ∈ Dₙ` (all `n` rotations + all `n` reflections): `content(fold(P)) == content(fold(g·P))`
   to `< 1e-9` (observed max error ~`2e-14`). *The load-bearing claim.*
2. **Fold ⊂ fundamental wedge + idempotent** — `fold(P).phi ∈ [0, π/n]` always, `r` preserved, and
   `fold(fold(P)) == fold(P)`.
3. **Deterministic + skin-invariant** — same seed ⇒ identical scene + fingerprint; fingerprint and
   `mixSlots` alpha identical across all skins (geometry never reads colour); distinct seeds differ.
4. **Order sweep** — symmetry + group order (`|Dₙ| = 2n` distinct linear parts) hold across the full
   range `n=3..12`.

Node-side hardening (B1–B5): exhaustive dense invariance; `Dₙ` group structure (reflections involute,
rotation order `n`, ref∘ref is a rotation); `foldDn` purity; total skin-invariance (alpha equal, rgb
differs); finiteness (no NaN/Inf).

---

## §3 — The page (`kaleidoscope/index.src.html`)

Self-contained forge page on the workshop's dark aesthetic. A circular brass-rimmed eyepiece (`<canvas>`)
shows the live field; the field is rastered at moderate resolution (each pixel = `sampleRGBAAt`) then
upscaled (the fold is exact per sampled pixel, so upscaling can't break symmetry). Controls: symmetry
order (3–12 slider), seed + reseed die, tumble-speed slider, skin segmented control, pause/play, 2× PNG
export (circular-cropped, high-res direct raster), `← workshop` back-link, collapsible panel, HUD
toasts. Reduced-motion: starts paused with a hint. Forge-includes `../tools/kaleido/kaleido.js` and
`../tools/ws/ws.js`; calls `WS.seen('kaleidoscope')` at parse time.

---

## §4 — Verify

1. `node tools/kaleido/kaleido.test.cjs` → `9/9 PASS`, exit 0.
2. `node tools/forge/forge.mjs kaleidoscope/index.src.html` clean; `node tools/forge/forge.mjs --check --all` green.
3. Served on a real origin, driven in a real browser: green chip `4/4`, visibly n-fold symmetric (seams
   match — a true mirror), `n` re-symmetrizes live, reseed changes contents, tumble animates, skins
   geometry-identical, `ws:seen:kaleidoscope` set, reduced-motion stills the tumble, 0 console errors.
