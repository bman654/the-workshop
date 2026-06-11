# Rosette — a generative rose window (build spec)

> A seeded **stained-glass rose window** generator — radial tracery, jewel-toned glass, dark lead
> came, light blooming through. A new visual medium for the workshop. It is the **rarest** inhabitant
> of **The Undercroft** (the hidden world) — the reward for a true wanderer who has earned every other
> secret. See `/UNLOCK.md`.

**File:** `undercroft/rosette.html` — one self-contained, zero-dependency, no-network HTML file,
relative links only. It is HIDDEN (reached only from the Undercroft once unlocked). The file being
directly URL-reachable is fine — secrets are bonuses; the gating is about *revealing* it.

**House style:** match the workshop's generative-maker pattern (a left control **panel** with seed +
sliders/selects, a full-bleed canvas, a dim HUD, a `← the undercroft` back-link top-right, an export
PNG button). Look at `sound-garden/lattice.html` or `strange-garden/pieces/game-of-life.html` for the
panel/canvas/HUD/back-link idiom and the **seedable PRNG** (xmur3 + mulberry32) — reuse that PRNG so
the window is a **pure function of the seed** (byte-reproducible).

---

## 1. What it draws (the crux: it must read as a DESIGNED rose window, not random spokes)

A circular **rose window** centred on the canvas, built from concentric **rings** of repeating
**radial segments**, like a Gothic cathedral window:

- **N-fold radial symmetry** (petal count, e.g. 8/10/12/16/20/24 — a control). Every motif is drawn
  once per sector and rotated around the centre, so the whole window is perfectly symmetric.
- **Concentric rings** from the centre out: a central **oculus/boss** (a small medallion), then 2–5
  rings of glass, then an outer band. Each ring is subdivided into the petal-count sectors (or a
  multiple). Ring radii + counts are seeded.
- **Tracery / lead came:** the dark stone/lead skeleton BETWEEN glass pieces — thick dark strokes
  (the leading) outlining every glass cell, plus **cusped/foiled arcs** (pointed-arch lobes,
  trefoils/quatrefoils) where appropriate — this is what makes it read as Gothic, not a pie chart.
  Render glass first, then stroke the leading on top.
- **Glass cells:** each cell filled with a jewel tone (see palettes) with a subtle **radial/edge
  shading** so it looks like lit glass (slightly brighter toward the centre of each cell, darker at
  the leading) — a soft inner glow, not a flat fill. A faint overall **light bloom** behind the
  window (a radial gradient) sells the "light coming through".
- Motifs to vary by seed: petal/almond (vesica) shapes, circles (roundels), lozenges, trefoils,
  quatrefoils, simple radial bars. Keep them **geometric + symmetric** — a curated motif set the seed
  arranges, so it always composes (the Compositor/Blazon "designed not random" bar).

## 2. Palettes (jewel-toned, harmonious)

Several named stained-glass palettes (a control), each a small harmonious set of saturated glass
colours + a leading colour. Suggestions: **Chartres** (cobalt blue + ruby + gold + emerald, dark lead),
**Sainte-Chapelle** (deep blues + crimson + violet), **Rose Gold** (amber/honey/rose/cream, warm),
**Forest** (emerald/teal/gold/amber), **Amethyst** (violet/magenta/indigo/rose), **Grisaille**
(pale silver-grey + faint tints, a quiet monochrome option). Glass colours must be **rich and
readable against the dark leading**; obey a loose harmony so it never looks garish.

## 3. Controls (panel)

- **Seed** (text + ⚄ dice) — the whole window is a pure function of the seed.
- **Petals / fold** (radial symmetry count): 6–24.
- **Rings** (number of concentric glass rings): e.g. 3–6.
- **Palette** (select, the named sets above).
- **Complexity / detail** (how busy the tracery + sub-foiling is): low→high.
- **Leading** (lead came thickness): thin→thick.
- (Optional) **Glow** (backlight bloom intensity), **Background** (stone/dark/parchment).
- Buttons: **Re-roll** (new seed), **Export PNG**.
- Keyboard niceties welcome (space/r re-roll, s save, h hide panel) mirroring the other makers.

## 4. Correctness / quality bars

- **Seed-pure & reproducible:** identical seed + params → byte-identical window. Style/palette changes
  must NOT change the *geometry* (palette only recolours) — verify by re-rendering and comparing a
  geometry signature across two palettes for the same seed (mirror how Daedalus/Firmament separate
  "generation" from "rendering"). Expose a `window.__rosette` introspection hook with at least:
  `{ seed, petals, rings, palette, signature() }` where `signature()` is a cheap deterministic string
  of the geometry (ring radii + cell counts + motif ids) — so reproducibility is checkable headlessly.
- **Symmetry:** the rendered window must be visually N-fold symmetric (rotating by 360/N° maps it to
  itself). Build by drawing one sector and rotating, so symmetry is by construction.
- **Reads as designed:** concentric, cusped, jewel-lit — not random spokes. This is the bar to hit.
- **Perf:** ~60fps is irrelevant (it's static after a draw) but the draw must be fast (<150ms) and
  re-roll snappy; clean console; no errors. Crisp on HiDPI (DPR-aware canvas). Resizes cleanly.
- **PNG export** produces a clean high-res image of the window.

## 5. The breadcrumb + back-link

- On load, drop the visit breadcrumb (see `/UNLOCK.md`):
  ```js
  (function(){ try{ var k='ws:seen:rosette';
    if(!localStorage.getItem(k)) localStorage.setItem(k,String(Date.now())); }catch(e){} })();
  ```
- Back-link top-right (like Lattice's): **`← the undercroft`** → `index.html`.
- Accent: a stained-glass jewel tone (e.g. a cobalt `#5b8dff` or ruby `#e0506a`) — your pick.

## 6. Acceptance gate (verify before declaring done)

A local static server is running at **http://127.0.0.1:8765** (repo root). Use **agent-browser** in a
UNIQUE NAMED session (e.g. `rosette-build`; not the default tab). Load
`http://127.0.0.1:8765/undercroft/rosette.html`. Verify with screenshots + console evals:
1. A beautiful, clearly **symmetric, concentric, jewel-toned rose window** renders; clean console.
2. **Re-roll** produces a visibly different but equally-coherent window; changing petals/rings/palette
   /complexity all visibly work; PNG export downloads a clean image.
3. **Seed reproducibility:** same seed+params → identical `__rosette.signature()`; and changing ONLY
   the palette keeps `signature()` identical (palette recolours, geometry unchanged).
4. **Variety:** capture 3 screenshots of distinct seeds/palettes to show range. Save a HERO screenshot.
5. `ws:seen:rosette` is written on load (check localStorage).
Append a build entry to a new `undercroft/CHANGELOG.md` section (or the existing one). Keep the file
tight (aim < ~900 lines). DO NOT git commit — report back with the hero + variety screenshots, the
reproducibility evidence, the final line count, and any deviations (honestly).
