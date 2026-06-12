# Slipstick — a working slide rule (the workshop's first *instrument*)

**File:** `slipstick/index.html` — single self-contained vanilla HTML/CSS/JS, **0 deps, 0 network, NO AUDIO.**

## What it is

A genuine, **working analog computer**: a draggable slide rule. Not art to watch, not a game, not a
puzzle — a *real instrument that does real arithmetic* by the physical act of sliding logarithmic
scales past one another. This opens a brand-new vein the workshop lacks (the named spark: "a
generative working instrument/device that does something real"). It is explicitly NOT a
tactile-physics bench (no forces/optics/weave simulation) — it is a **computational device** whose
correctness is *arithmetic*, which makes for a beautiful, airtight workshop-tradition crux.

The joy: grab the slide, slide it so the **C scale's 1 (left index)** sits over a number on the **D
scale**, then read products straight off — the slide rule "does" multiplication because
`log(a) + log(b) = log(a·b)`. Move the **hairline cursor** to read off any aligned scale at once
(squares on A, cubes on K, reciprocals on CI, mantissas on L, sines on S, tangents on T). A live
**readout panel** decodes whatever the rule is currently set to, in plain arithmetic, so a modern
visitor immediately *gets* what the antique is computing.

## Layout (one body, a sliding slide, a sliding cursor)

A classic Mannheim-style rule, drawn on Canvas (crisp at devicePixelRatio):

- **Stator (fixed body):** top half carries **A** (upper) and the top of the well; bottom half
  carries **D** (and **K**, **L** as selectable extra stator scales). Actually follow the standard
  layout:
  - **Top stator edge:** `K` (cubes, 3 log cycles) and `A` (squares, 2 log cycles).
  - **Slide (the moving strip in the middle):** `B` (matches A, 2 cycles), `CI` (reciprocal of C,
    runs right-to-left, red), `C` (1 cycle). Trig scales **S** (sin) and **T** (tan) live on the
    slide too (toggle a "trig face" — flip the slide — to expose S/T/ST instead of B/CI without
    cluttering; OR show them on the slide underside via a "flip" control).
  - **Bottom stator edge:** `D` (1 cycle, the main scale, matches C) and `L` (the *linear* mantissa
    scale, evenly spaced 0..1 → it reads log10 directly).
- **Cursor:** a transparent glass runner with a single red **hairline** spanning all scales, draggable
  independently.
- Keep it readable: 1 cycle ≈ a wide span; major ticks at 1,2,…,9 with the classic non-uniform minor
  subdivision (finer near 1, coarser near 9 — exactly because spacing is logarithmic). Label primary
  digits. Scales are drawn by **exact `log10` positioning** — this is the whole point and the crux.

## Interaction (real PointerEvents)

- **Drag the slide** left/right (pointer capture; smooth, inertia-free, snappable). Drag the **cursor**
  left/right. Both clamp sensibly; the slide can extend past the body on either side (as real ones do).
- **Click a scale tick / number** to snap the cursor (or slide index) precisely to it — optional nicety.
- **Readout panel** (always visible) shows, live: cursor position as a value on each scale
  (`D`, `C`, `CI`, `A`, `B`, `K`, `L`, and if trig active `S`/`T`), and the current *computation*
  the rule expresses: e.g. when C/1 is over D=2 and the cursor is on C=3, it reads
  `D = C·(slide offset) → 2 × 3 = 6` (with the read value 6.00 highlighted on D). Decode the common
  operations the rule is set up for: **× , ÷ , x², √x , x³, ∛x, 1/x, log₁₀x, sin, tan**.
- **Worked examples / "set it for me" chips:** a few one-click setups — `2 × 3`, `7 × 8`, `355 ÷ 113`
  (≈ π!), `√50`, `2.5³`, `sin 30°`, `tan 45°` — that animate the slide + cursor into position and show
  the reading vs. the true value with the **reading error** (e.g. "read 6.00, exact 6, slide-rule
  precision ~3 sig figs"). This *teaches* the instrument and *demonstrates* it computes correctly.
- **Decade lamp / order-of-magnitude helper:** a small toggle that reminds the user a slide rule gives
  *significant figures*, not the decimal point — show "you supply the magnitude" with a worked
  power-of-ten note. (Honest about what the instrument does.)
- Controls: **Reset** (slide index to D-left, cursor to 1), **Flip slide** (B/CI ⇄ S/T trig face),
  **3 cosmetic skins** (see below), **2× PNG export**, reduced-motion respected (chips snap instead
  of animate).

## Cosmetic skins (cosmetic ONLY — never change the math/positions)

3 curated faces, switching colors/material only (the workshop "style only re-renders" invariant):
- **Boxwood** — classic varnished wood + celluloid white scale faces, black engraving, red CI/reciprocal.
- **Mannheim** (ivory/cream engraved, the antique laboratory look).
- **Blueprint** — dark cyan engineering negative (the workshop's signature dark skin).
Switching skin must NOT move a single tick or change any readout — proven by the fingerprint test.

## THE CRUX — correctness, PROVEN (headless self-test, green chip "rule verified — N/N ✓", never ships red)

A pure layout/optics-free core, callable headless (extracted & re-run under Node too):

- `scalePos(scale, value) → x in [0,1]` — the fractional position of `value` on a named scale,
  defined ONLY by `log10`. e.g. C/D: `frac(log10(v))`; A/B: `log10(v)/2`; K: `log10(v)/3`;
  CI: `1 - frac(log10(v))`; L: `v` (linear, since L *is* the mantissa); S: `log10(10·sin θ)`;
  T: `log10(10·tan θ)`. (Use the standard slide-rule conventions; document each.)
- `readScale(scale, x) → value` — exact inverse of `scalePos`.

**Self-test checks (call the REAL functions, not copies):**
1. **Round-trip exactness** — for thousands of values across each scale's domain,
   `readScale(s, scalePos(s, v)) == v` to < 1e-12. (The scales are exact logarithms.)
2. **Multiplication identity (the slide-rule theorem)** — for many `(a,b)`, placing C's left index
   over D=a and reading D under C=b yields `a·b`: i.e.
   `readScale('D', scalePos('D',a) + scalePos('C',b)) == a·b` (mod decade) to < 1e-12. The
   instrument's whole reason to exist, proven from the positions. Division is the inverse.
3. **Scale relationships** — A reads C²: `readScale('A', scalePos('C', v)*?)`… concretely assert the
   *aligned* relationships at a common cursor x: `readScale('A',x) == readScale('D',x)²`,
   `readScale('K',x) == readScale('D',x)³`, `readScale('CI',x) == 1/readScale('C',x)`,
   `readScale('L',x) == log10(readScale('D',x))` (mod 1), all to < 1e-12, for a sweep of x. (This is
   *why* the cursor reads squares/cubes/reciprocals/logs simultaneously.)
4. **Trig consistency** — `S`: `readScale('D', scalePos('S',θ)) == 10·sin θ` (the D-reading under the
   S hairline is 10·sinθ, the standard relation), `T` likewise `10·tanθ`, across the scales'
   documented angular domains, to < 1e-12.
5. **Reading-accuracy demonstration** — every "set it for me" worked example, evaluated through the
   SAME `scalePos`/`readScale` used to draw the rule, lands within slide-rule precision of the true
   value (assert the *exact-math* path is exact to 1e-12; the *pixel-read* path within ~0.2% — i.e.
   prove the instrument is honest about being a ~3-sig-fig tool).
6. **Seed/skin invariance & finiteness** — the rendered tick layout fingerprint (the full list of
   `(scale, value, x)` ticks) is **identical across all 3 skins** (style only re-renders), and all
   positions are finite & monotonic within each scale.

Show a green chip; **never ship red.** Mirror the sibling chip CSS (`.selftest.ok/.bad`).

## Wiring (front door UNTOUCHED — still the curated 9 cards)

- Add a footer text link in `/index.html` between `light ·` and `colophon ·`:
  `<a href="slipstick/index.html" …>reckon</a> ·` (the same off-to-one-side pattern as
  puzzles/weave/light — NOT a 10th card, NOT a companion pill, NOT an Undercroft secret).
- `← workshop` back-link in Slipstick's topbar (copy the sibling topbar CSS).
- Add an "Also on the workbench" README bullet (after Caustic, before Colophon).
- Drop `ws:seen:slipstick` breadcrumb (try/catch-guarded; must play from `file://`). No Undercroft
  secret this session — breadcrumb left for future hidden-world use.
- `slipstick/CHANGELOG.md` (Build 1).

## Quality bar

Single file < ~1600 lines. 60fps (static canvas; redraw only on drag/skin). 0 console errors/warnings.
All localStorage try/catch-guarded (plays from `file://`). Verify in a real browser on a served origin
(agent-browser): chip green, exercise drag-slide, drag-cursor, every worked-example chip, all 3 skins
(fingerprint identical), flip-to-trig, PNG export. Reduced-motion respected.
