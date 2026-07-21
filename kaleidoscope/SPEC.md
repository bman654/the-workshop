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


---

# §5 — THE ROOM'S SECOND BODY: The Green Corridor

*Folder: `kaleidoscope/the-green-corridor/`. Forge page `index.src.html` → `index.html`.
Cores: `tools/corridor/orbit.js` (geometry), `tools/corridor/tint.js` (colour ladder, **shared with
the parent page's door**), `tools/corridor/flame.js` (the living candle). Twin:
`tools/corridor/corridor.test.cjs`.*

A **companion, not a new room.** It gathers under the Kaleidoscope's roof: no PLACES entry, no map
slot, no `ws:seen:` breadcrumb, no new front-door footprint. The Kaleidoscope is a kaleidoscope seen
through the small end, where the secret keeps itself; the Green Corridor takes the lid off and shows
the **same two mirrors from above**, with one candle between them.

## §5.1 — What it is, and what it does NOT claim

The upstairs toy PROVES an exact theorem (Dₙ symmetry by construction). **The Green Corridor proves
nothing, on purpose.** It is a delight piece: two mirrors, a candle, and the corridor of images that
compounds between them. `RHO = [0.72, 0.90, 0.82]` — the per-bounce survival that makes the corridor
walk gold → sage → bottle-green — was **chosen because the corridor looks right**, not measured off any
instrument, and the page says so in its own voice:

> *Nothing here is measured. The green is a feeling, honestly earned: a little less light at every
> bounce, and the warm end of it going first.*

So the room carries **no self-test chip** (a chip would imply a claim it does not make) and the shipped
page is grepped for claim creep — no spectroscopy, no reflectance, no wavelengths. What IS forced, and
what the twin holds, is that **the walk is multiplication rather than an authored gradient**: the
green-vs-red ratio is exactly `(FLAME_g/FLAME_r)·(RHO_g/RHO_r)^k`, strictly increasing in `k`.

## §5.2 — The geometry (one generator, no special cases)

Candle at the origin, both mirrors at perpendicular distance `h`, angle `θ` between them:
`R = h/sin(θ/2)`, images on the circle of radius `R` about the vertex at angles `±kθ`, arc spacing
`R·θ`. One generator reflects the candle in A, then B, alternating — **one chain each way**, in
Cartesian coordinates, so **θ = 0** (parallel mirrors, the D∞ ladder) falls out with no branch at all.
The paper closed form `y_k = (−1)^(k+1)·2kh` is kept only as a **test oracle**, never a second
implementation.

**Two soft edges carry the whole anti-pop argument**, both C² weights that carry energy rather than
hard tests:
- **the merge** — two candidates separated by `s` become both at `w = smoother(0, eps, s)` plus one
  merged image at `1−w` with the summed energy. Energy is identical at every `w`.
- **the birth**, at the far antipode. Its band is a fraction of ONE SPACING, not a fixed swept angle:
  the last image's swept angle is ~180° however narrow θ is, so a band fixed in swept angle is crossed
  in 0.02° of tilt at θ=7 and reads as a pop even though the maths is continuous.

`K_MAX = 160` is a **fixed constant, never a function of geometry** — otherwise the corridor's depth
would depend on the gesture, and the room's one honest promise would be a lie.

## §5.3 — The promise the room actually makes

There is **no image cap**. The train recedes to a visibility floor and hands what is left to a single
throat glow, so nothing is ever seen truncated. Because visibility depends only on the bounce count
`k`, **dragging the mirrors apart cannot change the visible count** — verified exactly (drift < 1e-9
over `h ∈ [0.34, 3.2]` at seven angles). Stated in the room's own words:

> *pulling the mirrors apart buys you no more infinity, only more silence between the lights.*

## §5.4 — Honesty correction (do not "fix" this back)

One mirror removed leaves the candle **plus one image = two lights, ONE reflection**. The phrase
"exactly one flame" is true only with **both** mirrors gone. The copy and the twin both say *one
reflection*. In a room whose only currency is honesty, the flattering phrasing would be a
self-inflicted wound.

## §5.4b — THE WAY BACK (do not remove: it closes a one-way door)

A latch pin rides **on its own mirror bar**, so once that mirror is away its pin travels with the
ghost. The camera deliberately does *not* keep the furniture on screen (§5.2 — that is what stops the
corridor becoming a ring diagram), so the pin can end up **under the plaque** (wide angles, mirror B)
or **off the frame entirely** (θ ≲ 10°, all four handles). Taking a mirror away was therefore a
**one-way door**: the pin that would put it back was drawn but unclickable, there was no key for it,
and the only way out was a page reload.

So the way back gets its own control, independent of the geometry: a brass pill (`#restore`) in the
**caption's lane** — the one strip of screen nothing else ever occupies — plus the **`0`** key. It
offers itself only when there is something to undo, and its label agrees with how many mirrors are
away. On narrow layouts it is positioned from the caption's **measured** bottom, because the caption
there runs to three lines and a fixed offset collides with the longest one.

The in-page twin drives `toggleMirror` → `restoreMirrors` and asserts the door swings both ways.

## §5.5 — SILENCE, deliberately (no `Air.mount`)

The room makes no sound, and this is a decision, not an omission — **do not "improve" it later**:
1. the parent SPEC says NO audio;
2. moving air and an unguarded candle contradict each other — a wind bed owes you a flame that
   responds to it, and that is a promise this piece cannot keep honestly;
3. the ending only lands in a room that was quiet: *take one mirror away and the room goes quiet.*
The snap's beat is **light, not sound**.

## §5.6 — The twin (`node tools/corridor/corridor.test.cjs` → 49/49)

Register-appropriate: a **payoff-liveness** twin, never a theorem. It drives the DOM-free cores and
the page's own entry functions — never a synthetic canvas pointer event, which headless cannot deliver
and through which a dead payoff would sail green. It holds: the train recedes and hands off (energy
conserved to 1e-9 at every angle); the colour walks green monotonically; one mirror → one reflection;
θ = 360/N closes with exactly N flames for N = 3..12 and does NOT close between; the generator matches
the paper oracle to 1e-12 relative; capture bands never overlap; the spring lands monotonically with
**no overshoot in geometry**; `spacing/h ∈ [2, π]` and monotone (it never crowds); the beat walks
`open → approach → capture → closed`; the room goes black with the flame out; and the flame **does not
loop**. It also greps the **shipped page** and fails if the copy ever says one mirror leaves *"one
flame"* — geometry tests cannot see prose, and that is exactly how the stale phrase survived the §5.4
correction in one spot (see §5.9).

**Two findings worth keeping.** (1) The flicker was first built as five incommensurable sines. A finite
sum of sines is *almost periodic* — the twin measured the candle recurring at 21.9 s with
autocorrelation 0.99. It is now smooth **value noise**, whose autocorrelation decays and never revives.
(2) `render()` once threw on the exact frame the ring closed (a stale reference into the rebuilt flame
core); the loop stopped, the room froze mid-beat, and the frame rate still read 60 because the average
had nothing new to average. The loop now names its first failure loudly.

## §5.7 — The door (DoD 4)

A **lit peephole** on `kaleidoscope/index.src.html`, not a link: a 132×52 live miniature — two mirror
edges and seven flames receding warm into green — the one warm object on a cool page. It shares
**only** `tools/corridor/tint.js` (~1 KB); the corridor's engines stay downstairs.

> **LANDMINE:** the plaque must be a **SIBLING of `#panel`**, never a child. `#panel` carries
> `backdrop-filter`, and any filter creates a containing block for `position:fixed` descendants — a
> nested plaque would silently resolve against the panel instead of the viewport, with no warning.

Return path, parent first: `↗ Kaleidoscope` → `../index.html`, `← The Orrery Estate` →
`../../index.html`. **Two dots to the parent, four to the estate** — the cheapest possible bug here.

## §5.8 — Verify

1. `node tools/corridor/corridor.test.cjs` → 49/49, exit 0.
2. `node tools/forge/forge.mjs --check --all` green; manifest gate green.
3. Served, in a real browser: `?selftest` → 7/7 in the console, no chip on the page; the corridor
   walks gold → green with depth; a **real input-level drag** on an end-cap tilts the mirrors (the
   `setPointerCapture` path — `dispatchEvent` is blind to it); `]` snaps the ring shut and the numeral
   rises; the latch pin leaves one reflection; θ = 0 gives the parallel corridor and `∞`; 60 fps;
   0 console errors; handles ≥44px and on-screen at 360px.
4. Take a mirror away and **put it back** — the pill and the `0` key both restore, from any angle and
   with the plaque open. (This is the check that catches a regression of the one-way door, §5.4b.)

## §5.9 — What the fresh-eyes review caught (cycle #438)

Kept here because both were invisible to every gate that was green at the time.

1. **The honesty correction had a straggler.** §5.4 rewrote the caption to *one reflection*, but the
   plaque's exit line still read *"With one mirror, one flame."* — so the page contradicted itself,
   and the room contradicted the page: the visitor read "one flame" while looking at two. The maths
   twin could not see it (it asserts geometry, not prose) and the claim-creep grep only hunted
   spectroscopy words. Fixed in the copy, and the grep now guards the phrase.
2. **"Take one away" was a one-way door** (§5.4b). Both the removal and the restore were correct in
   code — `toggleMirror` is a plain toggle — so the defect lived entirely in *reachability*, which is
   why a console-clean, 60 fps, 48/48-green room still had it. Found by hit-testing every handle
   against `elementsFromPoint` across a sweep of θ, which is worth doing to any room whose controls
   are DOM elements pinned to world coordinates.

**Still open, deliberately** (see the sown bug): at θ ≲ 10° the framing carries *all four* handles off
the frame, and at θ ≳ 90° the plaque covers mirror B's. The keyboard reaches everything and the way
back is now always present, so nothing is trapped — but a mouse-only visitor who drags into a narrow
angle loses the direct-manipulation affordance. The honest fix is a framing that reserves the plaque's
column and keeps the furniture in view, which is a re-tune of the §5.2 camera and wanted more room
than a review pass.
