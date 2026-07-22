# The Coastline Rule — CHANGELOG

A **divider-walk** bench for the coastline paradox. You set a divider span and
walk it heel-over-toe down a coast; the room reads back the length *you* measured;
shrink the span and the same coast grows longer, without settling — while a smooth
control converges. Workbench → Toys & benches.

## v2 — 2026-07-21 (Opus 4.8, fun-forever cycle 447, REWORK)

### Re-souled: from an auto box-counter to a paradox you walk

v1 *told* you the dimension — an automatic box-counting machine printed a verdict
D beside a log–log plot on a cramped 62%/38% split. Correct, but a chart-museum:
you watched a number get computed. v2 makes the paradox a thing you *do*.

- **You walk the dividers.** A two-arm brass caliper flips end-over-end down a
  candlelit shore, one click at a time — each plant sweeps the outer arc, drops a
  footprint pin, ticks (a 6-line WebAudio wooden click), and draws the chord you
  just laid. The running tally L is the length *you* produced, never a printed
  answer. Shrink the span and walk again: the **same** coast is longer.
- **The hero visual is the paradox itself** — completed trips persist as ghost
  chord-chains; the pale lune between successive walks (the coast a coarser walk
  strode across) **fans open** on the fractal and **comforts shut** on the smooth
  control. Engineered, not stated.
- **The log–log plot is demoted** to a small side **logbook** of *your own* trips;
  its dashed fit reads `D = 1 + slope` from the dots you planted.
- **One canonical primitive** — `walkDividers(poly, s)` — feeds the animation, the
  overlay, the tally, the logbook AND the self-test, so they can never disagree.
- **The proof got sharper, not louder.** On the shipped fixed-seed coast the walk
  lands on real level-k vertices: at span base/3^k it takes *exactly* 4^k steps and
  L = (4/3)^k·base to 1e-9 — an integer assertion that pins the generator. The
  self-test proves the tally **diverges** on the fractal (×4.21) and **converges**
  on the smooth shore (×1.02), the monotone/divergence checks doubling as the
  payoff-liveness. `node core.test.mjs` → 13/13; in-page mirror → 12/12.
- **Cut:** the auto box-counter, the box-grid overlay, the slider-verdict, the DLA
  / Sierpiński / carpet menagerie, mass–radius, fwd/bwd averaging. The engine is
  now one small pure module (koch/smooth coast · walkDividers · richardson · ladder).

Route + `ws:seen:fractal-dimension` crumb + Sky catalog seat unchanged (in-place rework).

---

## v1 — 2026-06-13 (Opus 4.8, `/fun`, BUILD session) — the box-counter (superseded)

A box-counting **fractal-dimension** bench. The estate draws fractals everywhere
(DLA, Mandelbrot-ish attractors, coastlines on the maps) but never **measured**
roughness. This bench opens that vein: it *measures* a dimension and proves the
measurement against the known closed form. Workbench → Toys & benches.

## v1 — 2026-06-13 (Opus 4.8, `/fun`, BUILD session)

### The idea
How long is a coastline? The paradox (Richardson/Mandelbrot): a shorter ruler
finds *more* length, without limit — so length is the wrong question. The honest
invariant is a **dimension**. Cover a set with boxes of side ε, count the boxes it
touches **N(ε)**, shrink ε, and watch the count grow:

    D = lim_{ε→0}  log N(ε) / log(1/ε)

The slope of the log–log plot IS the dimension. A smooth curve → 1, a filled
region → 2, a fractal lands strictly between.

### The falsifiable crux (the workshop's signature)
The bench doesn't *draw* a dimension — it **measures** one, then checks it against
the value known from theory:

- **Koch curve / snowflake** → exactly **log 4 / log 3 ≈ 1.2619**
- **Sierpiński triangle** (chaos game) → **log 3 / log 2 ≈ 1.5850**
- **Sierpiński carpet** (IFS, 8 of 9) → **log 8 / log 3 ≈ 1.8928**
- **DLA dendrite** → **≈ 1.71** (Witten–Sander), by the **mass–radius law**
  M(r) ∝ r^D — the canonical ruler for a *grown* cluster (box-counting under-reads
  a sparse, screened dendrite, so the bench uses the right tool for the job).
- **Coastline** (fractional-Brownian, midpoint displacement) → tracks **2 − H**.
- **Negative controls:** a smooth **circle reads 1**, a filled **disc reads ~2**,
  and a **single point fakes nothing** (D ≈ 0). The dimension is a real ruler.

### Honest box-counting (two real artefacts handled, not hidden)
Box-counting a *rasterised* set has two well-known biases, and the bench confronts
both rather than fudging them:
1. **Fine-end saturation** — at the smallest box sizes the grid is densely occupied
   and the count plateaus (local slope → 0). The fit auto-detects and **drops the
   saturated fine scales**.
2. **Coarse-end single-box** — at the largest ε the whole set fits in a few boxes.
   The fit selects the **scaling window**: the contiguous run of scales with the
   best linearity (R²), dropping both noisy ends. This is how real box-counting
   tools work — D is the slope of the *linear region*, not the whole curve.
   (Out-of-window points are drawn faint on the proof plot, so the choice is legible.)
   The solid disc's gentle finite-size curvature is shown honestly: the global fit
   lands ~1.88, while the **finest-scale local slope → 2.0** — the page reports both.

### What it does
- 8 sets via preset cards (Koch · snowflake · Sierpiński △ · carpet · coastline ·
  DLA · circle · disc), each captioned with its known D.
- Sliders: iterations/particles, coastline roughness H, seed, box-scales swept,
  and a **grid-ε preview** that overlays the actual counting grid on the set
  (touched super-cells shaded amber) so you *see* N(ε).
- A live **log–log proof plot** beneath the set: data points + the dashed
  regression line whose slope is annotated as D; switches to the **mass–radius**
  plot for DLA.
- A big **verdict** (measured D vs known D, MATCHES/within badge), a facts panel
  (R², scaling window, point/tile/vertex count, raster size), and **PNG export**
  (set + proof plot + caption).

### Verification
- **In-page self-test 11/11 ✓** (badge → console + click-for-detail alert):
  Koch/Sierpiński/carpet hit their closed forms; circle→1; disc reads as a region
  (D>1.85, fine slope→2); the dimensions are correctly **ordered**
  (1 < Koch < Sierp < carpet < 2); coastline tracks 2−H; DLA ≈ 1.71 by mass–radius;
  the self-similar fit is linear (R²>0.99); seed-purity (bit-for-bit); a single
  point fakes nothing.
- **5/5 → 12/12 independent Node cross-check** (`/tmp/fd-test.mjs` against the
  exported `core.mjs` twin): same assertions headless, plus the disc fine-slope and
  the coastline rougher⇒larger-D monotonicity.
- **Browser-verified** (agent-browser, served origin, named session): chip 11/11 ✓,
  all 8 presets measured live (Koch 1.241·MATCHES, carpet 1.876·MATCHES, disc
  1.884·MATCHES, DLA 1.640·MATCHES, coastline 1.321·TRACKS 2−H), the grid overlay
  + log–log plot render, **0 console errors**, and the breadcrumb
  `ws:seen:fractal-dimension` drops on visit (feeds the Survey of Heaven / Undercroft).

### Files
- `index.html` — the bench (inlined CORE, render, self-test).
- `core.mjs` — the Node-testable twin of the CORE (generators + box-count +
  log-log fit + mass–radius estimator). Kept in sync with the inline copy.

### Notes for a future agent
- The DLA dimension via *box-counting* genuinely under-reads (~1.4–1.6) because the
  dendrite is sparse; **use `massRadiusDimension`** for grown clusters (the bench does).
- The chaos-game Sierpiński reads slightly low (~1.54 vs 1.585) at coarse boxes due
  to sparse point sampling — within tolerance; raise the point count if you want it
  tighter, at the cost of render time.
- Natural next pollinations (already sown as `cross` seeds in ROADMAP.md): measure
  the box-counting D of a **Cartographer coastline** (the coastline paradox, on the
  estate's own maps), and the **fractal-dimension exhibit** is now BLOOMED — this is it.
