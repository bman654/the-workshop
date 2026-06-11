# Ariadne — SPEC

*A generative **Celtic-knotwork** machine, and **Daedalus's companion**. Daedalus built the Labyrinth;
**Ariadne's thread** wound through it. Where Daedalus draws a maze (one path) and solves it, Ariadne
plaits the **thread** itself — a true interlaced knot, woven over-and-under, winding where the maze
wound. Re-roll endlessly from a seed; trace the single thread; keep the ones you like.*

One self-contained file: `ariadne/index.html` — vanilla HTML/CSS/JS, **canvas** (recommended — easy
band-stroking + over/under masking) or SVG. **Zero deps, no network / CDN / web-fonts**, relative
paths only (Pages subpath). Seeded & reproducible.

It is **Daedalus's sibling** (both are *path-through-a-grid* art): reached via a `↗ Ariadne` link in
Daedalus's panel (companion pattern — front door stays at the curated 9), with `← workshop` and
`↗ Daedalus` back-links here.

---

## 0. The crux: it must be a TRUE plait (a real woven knot, not a decorative fake)

Three correctness properties (the equivalent of Orrery's "real positions" / Blazon's "faithful blazon"):

**(A) Consistent alternating weave.** At every crossing, one cord passes **over** and one **under**,
and the over/under assignment must **alternate consistently** so that following any single cord it goes
over, under, over, under… (the defining property of a plain-weave plait). No two adjacent crossings on
a cord may both be "over" or both "under". Drawn correctly the knot reads as genuinely interlaced.

**(B) Closed loops, no loose ends.** Every cord is a **closed loop** (the knot is "endless"). No cord
terminates in mid-panel; all turns are accounted for (cords reflect at the panel border and at internal
breaks). The number of distinct loops is a function of the break pattern.

**(C) Determinism.** The knot is a pure function of (seed + parameters). Same inputs ⇒ identical knot.

These are **programmatically checkable** — build a self-test (§7) that asserts (A) and (B) on the
generated structure, not just "it looks woven."

## 1. The algorithm — the grid-and-breaks method (do it this way; it guarantees §0 by construction)

This is the classic Celtic-knot construction (Mercat / "knotwork from breakpoints"). Implement the
**structure** first (a data model), then render from it. Recommended formulation:

1. **Grid.** Lay out a coarse grid of cells, `W × H` (parameterised by a Complexity control). Define
   the **node lattice** at the cell corners and centres. Cords run **diagonally**, crossing at the
   centre of each "crossing site." Use the standard scheme where crossing sites sit on a checkerboard
   of the fine lattice; at each site two diagonal strand-segments cross.
2. **Over/under by parity.** Assign over/under at each crossing site from the **parity of its lattice
   coordinates** (e.g. `(i+j) even → NE-strand over; odd → over the other`). Checkerboard parity
   yields a globally consistent alternating weave automatically → satisfies §0(A).
3. **Breaks (the pattern knobs).** A **break** is a barrier placed on a lattice edge that forbids a
   crossing there; the two strands that would have crossed instead **turn and reflect** (the cord
   bounces). Two things place breaks:
   - **Border:** the entire panel boundary is a ring of breaks, so cords reflect inward → the knot is
     self-contained and endless (no strand leaves the panel) → satisfies §0(B) at the edges.
   - **Internal breaks:** a seeded subset of internal lattice edges (a "Break Density" control). Each
     internal break is typically placed **symmetrically** (mirror across the panel's axes) so the knot
     is balanced and reads as designed, not noisy. Internal breaks split/merge loops and create the
     characteristic knot motifs. Optionally support **horizontal/vertical wall** breaks and **point**
     breaks (the two common break types) — even just one type produces rich results.
4. **Trace the cords.** From the crossing/break structure, **walk** each cord: at a crossing it goes
   straight through (diagonal continues); at a break it reflects (90° turn). Following turns and
   reflections, each cord returns to its start → a **closed loop**. Collect all loops (this walk also
   *proves* §0(B) and lets you implement "trace one thread", §3).
5. **Render the bands.** For each cord, stroke a **band** (a thick rounded stroke, or two parallel
   rails with a fill between, + a thin contrasting outline) following its smoothed diagonal path
   (round the corners at reflections so the cord curves like a real plait, not a jagged zigzag —
   quadratic/Catmull-Rom smoothing through the segment midpoints works well). At each crossing, draw
   the **over**-cord segment last (or mask a gap in the **under**-cord) so the over strand visibly
   passes on top. Getting the over/under masking right is what sells the weave.

> If a different but equivalent construction is cleaner to implement, that's fine — but it MUST still
> guarantee §0 (consistent alternating weave + closed loops + determinism), and the self-test must pass.

## 2. Shapes / framing (toggle/select)
- **Panel** *(default)* — a rectangular knotwork panel.
- **Square** — `W=H`.
- **Band / border** — a long thin knotwork strip (a frame piece), optionally as a closed **rectangular
  border** framing empty centre (classic manuscript border).
- **(nice, optional) Circular / ring** — a circular knot (annular grid) — only if it stays a true
  plait; otherwise skip rather than fake it.
- Optional **knotwork border** around any panel (a thin plaited frame surrounding the main knot).

## 3. Interaction — "trace the thread" (the signature + a structural proof)
- **Hover / tap** the knot → **highlight the single closed cord under the cursor** in an accent colour,
  dimming the rest. Because cords are closed loops, this lights up exactly one continuous thread that
  returns to itself — Ariadne's thread made visible. (This both delights AND demonstrates §0(B).)
- A small readout: number of distinct **threads (loops)** in the current knot; on hover, "thread N of M".
- (optional) a **"reveal threads"** toggle that colours every loop a different hue (shows the loop
  decomposition at a glance).

## 4. Styles (segmented, 3–4) — palette/treatment driven; the KNOT never changes, only the look
Render reads a `STYLES[style]` object. Switching style must NOT change the knot structure (same seed +
params ⇒ identical knot), only how the bands are drawn.
- **Illuminated** *(default)* — gilt cord (gold gradient + sheen) with a fine dark outline on a deep
  vellum/indigo ground; a Book-of-Kells richness. Optional subtle colour-fill alternating per loop.
- **Engraved (ink)** — single-colour ink line-art knot on cream: the cord as two clean rails with an
  open channel, crossings shown by the break in the under-rail. Woodcut/manuscript feel.
- **Neon** — the workshop house look: a glowing cord on near-black, soft bloom at the bands, a single
  accent hue (with a tasteful multi-hue option). Ties to Daedalus's neon styles.
- *(optional 4th)* **Stone / carved** — greyscale bevelled relief, as if carved in a lintel.

## 5. Controls (mirror Daedalus's panel look + collapse/reopen)
Title **Ariadne**, sub *Knotwork Loom* (or *Celtic Interlace Generator*). Then:
- **Seed** row: text input + **⚄ dice** (random seed). Same knot for same seed + params.
- **Style** segmented: Illuminated / Engraved / Neon (/ Stone).
- **Shape** segmented/select: Panel / Square / Border (/ Ring).
- Sliders: **Complexity** (grid size), **Break Density** (pattern richness), **Cord Thickness**.
  Toggles: **Symmetry** (mirror breaks — on by default), **Knotwork border**, **Reveal threads**
  (multi-hue loops).
- Actions: **⟳ Re-roll** (primary) · **↓ PNG** (export — `canvas.toDataURL` (or serialize SVG→canvas),
  file `ariadne_<seed>.png`; mirror Daedalus's export).
- A small live readout: **threads (loops): N**, current seed. Hint line. Panel collapsible (`✕` /
  reopen), like Daedalus.

## 6. Generation = pure function of (seed + params)
Reuse the workshop's seeded RNG (xmur3 + mulberry32; study `daedalus/index.html` or `firmament/index.html`),
separate streams per concern (`seed+"::breaks"` etc.). Build the **knot structure** (grid, breaks,
crossings, traced loops) once from (seed + Complexity + Break Density + Symmetry + Shape); render and the
loop-count/trace all read it. Switching **style / cord thickness / reveal-threads / border** changes only
rendering, **not** the knot structure (verify: same seed ⇒ identical loop count & topology across styles).

## 7. Verification — self-verify in a UNIQUELY-NAMED agent-browser session (never the default tab)
The gate is **a true plait**, so verify the STRUCTURE programmatically AND the look visually:
1. **Weave self-test (the core gate, §0A):** in code, walk each cord through its crossings and assert
   the over/under values **strictly alternate** along every cord. Log PASS/FAIL to console (and a tiny
   on-page `✓ weave` indicator is a nice touch). Run it across many re-rolls — must always PASS.
2. **Closed-loop self-test (§0B):** assert every traced cord returns to its start (closed), every
   crossing is used by exactly two cord-passes, and no strand dangles. Report the loop count; confirm
   it's stable for a given seed and changes sensibly with Break Density.
3. **Determinism (§0C):** same seed + params ⇒ identical structure (loop count + topology) and identical
   render. Switching style/thickness/border doesn't change the structure.
4. **Visual checks:** screenshot Illuminated default — the knot reads as genuinely **woven** (over/under
   convincing at crossings), corners smooth (not jagged), border closed (no loose ends poking out).
   Switch each **style** & screenshot (look changes, knot identical). Vary **Complexity** & **Break
   Density** (richer/sparser patterns) & **Shape**. **Hover** → exactly ONE continuous closed thread
   highlights (trace it visually around a loop and confirm it closes). **Reveal threads** colours each
   loop distinctly. PNG export downloads a correct image. Console clean throughout.
5. Report: summary, weave + loop self-test results (PASS across N rolls), a couple of loop counts,
   screenshot paths, console status, line count. If the weave can't be made to alternate consistently,
   SAY SO — a fake (non-alternating) "knot" is a failure, not a pass.

## 8. Deliverables
1. `ariadne/index.html` — the loom.
2. `ariadne/README.md` — short, match `daedalus/README.md` tone/length; note it's Daedalus's sibling
   (Ariadne's thread / the labyrinth myth) and that it's a *true* plait (consistent over-under weave,
   closed loops), seeded & reproducible.
3. `ariadne/CHANGELOG.md` — build log incl. the weave/loop self-test results.
4. `ariadne/thumb.png` — 16:9 screenshot of a gorgeous **Illuminated** knot (clearly woven, smooth,
   self-contained), ≤1440px wide.

## 9. House rules
- One self-contained file; **no network/CDN/web-fonts** (system serif/sans/mono stacks only).
- Feel like a **sibling of Daedalus** (panel look, segmented controls, seed+dice, export, seeded RNG,
  the grid-path-art kinship). No animation required — it's a press, redraw on re-roll/param/resize/hover
  (a gentle one-off draw-on animation is welcome but optional; if added, it must not loop forever / leak).
- Back-links: **`← workshop`** (`../index.html`, copy Orrery/Blazon's `<a class="back">`) and a small
  sibling link to Daedalus (`../daedalus/index.html`, e.g. "↗ Daedalus — the labyrinth").
- **Do NOT edit other projects or the front-door `index.html`** — the Daedalus→Ariadne companion
  cross-link is wired separately by the lead agent (keeps the curated front door at 9).
