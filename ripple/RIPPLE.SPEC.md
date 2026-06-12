# 🌊 Ripple — build spec

*A steerable **wave-interference tank** — the wave-physics sibling to **Caustic** (geometric optics)
in the workshop's "toys & benches" wing. Drop point sources on a dark tank and **drag them around**;
circular waves spread and **interfere** live — bright antinodal lines where crests meet crests, dark
nodal lines where crest meets trough — by the *exact* physics of linear superposition. Curated
presets (two-source interference · double-slit · a line array · a single drop), 3 skins, PNG export.
The workshop's signature: a built-in self-test that **proves** the field is physically exact — the
rendered field equals the analytic superposition to machine precision, and the interference maxima/
minima fall exactly where the path-difference math demands.*

Folder: `ripple/`. One self-contained file: `ripple/index.html` (no build, no network, no deps,
**NO audio**). Build log: `ripple/CHANGELOG.md`.

> Distinct from **Caustic** (which traces light *rays* by reflection/refraction) — Ripple is *waves*:
> superposition, interference, diffraction. And distinct from the Strange Garden's *watch-only*
> specimens — this is a **tank you operate** (drag sources, dial λ, watch fringes move). Not a puzzle,
> not a game — a sandbox of waves you steer.

---

## §0 — The physics (analytic superposition — NOT a PDE solver)

Model the water surface displacement as the **linear superposition of circular waves** from N point
sources — closed-form, evaluated per pixel per frame (no finite-difference grid, no stability issues,
trivially correct and provable). For a source `i` at `(xi, yi)` with amplitude `Ai`, wavenumber
`k = 2π/λ`, angular frequency `ω = 2πf`, phase `φi`, and a point `(x,y)` at distance `ri = hypot(x−xi, y−yi)`:

```
contribution_i(x,y,t) = Ai · falloff(ri) · cos(k·ri − ω·t + φi)
field(x,y,t)          = Σ_i contribution_i(x,y,t)
```

- **`falloff(r)`** models energy spreading. Offer a toggle: **none** (`1`, the idealised clean
  textbook case — use this for the self-test) and **realistic** (`1/√(1 + r/λ)` or similar gentle
  decay, default for looks). The self-test asserts against whatever falloff is active, but the
  interference-loci proofs use `none` so the math is exact.
- The wave is the **same `k`, `ω` for all sources** (one frequency tank — the classic ripple-tank
  demo). Per-source amplitude/phase/position vary.
- Render the field to a `<canvas>` as a height map: map `field` ∈ [−Σ|Ai|, +Σ|Ai|] to colour — crests
  bright, troughs dark, zero mid-tone (a smooth diverging ramp in the skin's palette). Animate `t`
  with `requestAnimationFrame` (play/pause). Optionally overlay faint **nodal lines** (loci where the
  time-averaged amplitude ≈ 0) as a toggle — they're the "frozen" dark hyperbolae that make
  interference legible.

**Resultant amplitude (the key analytic fact the self-test uses).** For two equal sources (A each,
same f, phases φ1,φ2), the steady-state amplitude at a point is
`R(x,y) = 2A·|cos( (k·(r1−r2) + (φ1−φ2)) / 2 )|`.
So with equal in-phase sources: `R = 2A` (full constructive) where the path difference
`Δ = |r1−r2| = n·λ`, and `R = 0` (full destructive / a node) where `Δ = (n+½)·λ`. These are the
loci the self-test verifies.

---

## §1 — The correctness crux (the workshop promise)

A pure `CORE` (no DOM, no skin, no render): `field(sources, k, ω, t, falloff, x, y)`, the per-source
contribution, and a `resultantAmplitude(sources, k, x, y)` (closed form for the equal-frequency case,
or sampled-max over one period). The renderer and a headless `runSelfTest()` call the SAME CORE. Prove:

1. **The render equals the analytic field.** The value the renderer paints at any pixel `(x,y,t)` is
   exactly `Σ_i contribution_i(x,y,t)` (i.e. the renderer derives colour from `field()`, never a
   separate copy). Assert `field()` equals a hand-rolled reference sum over many random
   sources/points/times to ~1e-9.

2. **Superposition linearity.** `field({A,B}) == field({A}) + field({B})` for all points/times — the
   defining property of a linear wave model. Assert over random configs.

3. **Interference loci are exact (the physics gate).** For two equal in-phase sources with falloff
   `none`:
   - On the **perpendicular bisector** (r1 = r2, Δ = 0): the resultant amplitude `R = 2A` (constructive)
     — sample several bisector points, assert `max_t field ≈ 2A` to tolerance.
   - At points where `Δ = |r1−r2| = (n+½)λ` (n=0,1,2): `R ≈ 0` (a node) — construct such points
     explicitly and assert `max_t |field| ≈ 0` to tolerance.
   - At points where `Δ = n·λ` (n=1,2): `R ≈ 2A` (antinode) — assert.
   - Cross-check: `resultantAmplitude` (closed form `2A|cos(kΔ/2)|`) matches the sampled `max_t field`
     over many random points to tolerance.

4. **Double-slit fringe spacing (if the preset ships).** Two narrow in-phase slits (modelled as two
   point sources, or two short Huygens arrays) a distance `d` apart: on a far screen line at distance
   `L ≫ d`, bright fringes are spaced `≈ λL/d`. Assert the detected antinode spacing on that line
   matches `λL/d` to a few %. (If a Huygens-array slit can't be made to match cleanly, ship the
   two-point-source version and note it.)

5. **Determinism & skin-invariance.** The field depends only on `(sources, k, ω, t, falloff)` — never
   on the skin. Same inputs → identical field across all 3 skins (CORE is skin-blind by construction;
   assert a `fieldFingerprint` is identical across skins).

`runSelfTest()` runs on load → topbar badge `ripple verified — N/N ✓` (green) / red on any failure.
`console.log` the result. **Checks #1 and #3 are the non-negotiable gates.**

---

## §2 — What the user can do (controls & behaviour)

A tank you **operate**, mesmerising to watch:
- **Drag sources** around the tank (pointer events; sources are small glowing discs). The field
  re-interferes live as you drag. **Add / remove** sources (click empty water to add; a small ✕ or
  right-click/long-press to remove). Start with **2** sources.
- **Wavelength λ** slider (sets `k`) — short λ = fine dense fringes, long λ = broad ones; watch the
  interference pattern breathe as you drag it.
- **Frequency / speed** slider (sets `ω`, the animation rate) and **Play/Pause** (freeze the pattern
  to study it). **Amplitude** slider. **Phase** control (per-source, or a "flip phase" on a selected
  source — antiphase sources invert the pattern: nodes↔antinodes).
- **Falloff toggle** (idealised `none` ↔ realistic decay) and a **nodal-lines overlay** toggle (draw
  the frozen dark interference hyperbolae).
- **Presets** (buttons): **"Two-source"** (the classic), **"Double-slit"** (two close in-phase
  sources / slits showing far-field fringes), **"Line array"** (4–6 in-phase sources in a row — a
  steered wavefront / beam), **"Single drop"** (one source — clean circular waves), **"Clear"**.
- **Skins** (§4), **Export 2× PNG** (§5).

Fully usable in every state; nothing depends on optional extras. Respect `prefers-reduced-motion`
(slow or pause the animation; still fully interactive).

---

## §3 — Layout & visual design

Read as a dark, elegant physics bench in the workshop's aesthetic (match Caustic/Abacus: serif
headings, mono labels, frosted control panel, radial-lit dark background, system fonts). Fixed-
viewport, no scroll:

```
┌───────────────────────────────────────────────────────────────────────┐
│ ← workshop          Ripple · a wave-interference tank   [verified ✓]    │  topbar (fixed)
├──────────────────────────────────────────────┬────────────────────────┤
│                                                │  CONTROLS (sidebar)     │
│        ◉            the TANK (canvas):          │  ▶/⏸  Play              │
│              interference field, live           │  Wavelength λ ◀──●──▶   │
│        ◉      crests bright / troughs dark      │  Frequency    ◀──●──▶   │
│            (drag the ◉ sources around)          │  Amplitude    ◀──●──▶   │
│                                                │  Falloff [none][real]   │
│                                                │  ☐ nodal lines          │
│                                                │  + add source  (N: 2)   │
│                                                │  selected ◉: flip phase │
│                                                │  Presets: Two-source /  │
│                                                │   Double-slit / Line /  │
│                                                │   Single / Clear        │
│                                                │  Skin [.][.][.]         │
│                                                │  [ Export 2× PNG ]      │
│                                                │  hint…                  │
└──────────────────────────────────────────────┴────────────────────────┘
```

**The tank** is a `<canvas>`. Render the field efficiently — evaluating `Σ cos()` per pixel per frame
is heavy at full res, so: render the field into a **smaller offscreen buffer** (e.g. tank/2 or a fixed
~360×260 ImageData) and `drawImage`-upscale it (smooth) to the display canvas; or step pixels by 2.
Target a smooth ~30–60fps even with several sources. (A precomputed `cos` LUT and caching per-source
`ri` only when a source moves are good optimisations, but correctness first.) Sources drawn as glowing
discs on top (DOM or canvas), draggable, the selected one ringed.

Use canvas for the field; HTML for controls. PNG export must come from the canvas (no `foreignObject`).

---

## §4 — Skins (cosmetic only — 3)

Three skins via CSS custom properties on `:root`, switched by a `data-skin` segment (the Abacus
pattern). **Skins change only the colour ramp / chrome — never the physics.** CORE is skin-blind;
the self-test asserts field-invariance across skins (§1.5). Three fitting palettes:
- **`tank`** (default) — classic ripple-tank: deep teal water, white-hot crests, ink troughs (the lab
  look under a lamp).
- **`schlieren`** — monochrome grey diverging ramp (the scientific Schlieren-photo look: pure light/
  dark interference, no hue).
- **`blueprint`** — the workshop house blueprint skin (cyan-on-navy) for bench consistency.

---

## §5 — Conventions (match the bench — read `caustic/index.html` + `abacus/index.html`)

- **Self-contained:** one `ripple/index.html`, inline `<style>`+`<script>`, no network/libs, NO audio.
  System font stacks (serif headings, mono labels, sans body) — copy from Abacus.
- **Back-link** (topbar, top-left): `<a class="back" href="../index.html">&larr; workshop</a>` styled
  as the other bench pages (uppercase mono, dim→accent hover).
- **Self-test badge** (topbar, right): `<div class="selftest" id="selftest">checking…</div>`; on load
  run `runSelfTest()`, set `.ok`/`.bad` + text `ripple verified — N/N ✓`. Same CSS as Abacus.
  `console.log` the result.
- **ws: breadcrumb** (in `init()`):
  `try{ localStorage.setItem('ws:seen:ripple', String(Date.now())); }catch(_){}` (id = `ripple`).
  Test over a SERVED origin, never file://.
- **PNG export:** a primary **"Export 2× PNG"** button — draw the current tank field + the source
  discs to an offscreen canvas at 2× and download `ripple-<skin>.png`. Canvas-native (no
  `foreignObject` taint).
- **Aesthetic:** dark physics bench; frosted control panel (`backdrop-filter: blur(...)`); rounded
  frames; restrained palette from CSS vars. No persistent page footer (hint at the bottom of the
  panel).

---

## §6 — Workbench registration

Add a card to the **Toys & benches** group in `workbench/index.html` (read the file for the exact
group name + markup; it's a `<div class="group">` with a `.deck` of `<a class="card">`s — Caustic and
Loomlight live there; match the surrounding cards' whitespace/attributes). Suggested:

```html
<a class="card" href="../ripple/index.html">
  <div class="cardhead">
    <span class="glyph">🌊</span>
    <span class="name">Ripple</span>
    <span class="kind">wave-interference tank</span>
  </div>
  <p class="blurb">A steerable wave tank — drop sources on dark water and drag them, and watch
  circular ripples interfere into bright and dark fringes by the exact physics of superposition. Dial
  the wavelength, freeze the pattern, see the double-slit. <span class="open">Open ▸</span></p>
</a>
```
(🌊 glyph — pick a better single emoji if one reads more clearly as ripples; not load-bearing. Note
🌊 is also used by a hidden piece, but that's invisible on the workbench, so it's fine to reuse here.)

---

## §7 — Verification (before committing)

Test over a **served origin**, never `file://`. Use a **uniquely-named** agent-browser session.

Verify HEADLESSLY FIRST — a /tmp Node harness using the shipped CORE asserts ALL of §1 (render==field
to 1e-9; superposition linearity; the interference loci — bisector R=2A, nodes R≈0 at Δ=(n+½)λ,
antinodes R=2A at Δ=nλ; resultantAmplitude == sampled max; double-slit spacing ≈ λL/d if shipped;
determinism/skin-invariance). Only once Node is green do you wire the SAME CORE into the page's
`runSelfTest()`.

Then in a real browser confirm:
- [ ] Self-test badge green (all checks).
- [ ] Two-source preset shows a clean symmetric interference pattern; dragging a source moves the
      fringes live; the perpendicular bisector is a bright antinodal line.
- [ ] Wavelength slider visibly changes fringe density; flip-phase inverts nodes↔antinodes; play/pause
      freezes the field; nodal-lines overlay aligns with the dark hyperbolae.
- [ ] Double-slit preset shows far-field fringes; line array shows a steered wavefront.
- [ ] All 3 skins switch cleanly; field identical across skins; **zero console errors**.
- [ ] Smooth animation (~30–60fps with a few sources); reduced-motion respected.
- [ ] Export 2× PNG downloads a crisp image of the tank.
- [ ] Back-link → `../index.html`; the new workbench card opens the page; `ws:seen:ripple` set (served).

Append a build entry to `ripple/CHANGELOG.md` and `git commit` (do NOT push — the lead handles push).
Leave the working tree clean except your commit.
