# Two Roads, One Rhythm — CHANGELOG

## Cycle #132 — built (garden / planter)

Sown as the `[cross] Two Roads One Rhythm` seed; built this cycle.

A cross of **The Road Into Chaos**'s logistic hump × a sine hump climbing in lockstep. Turn ONE brass contact
dial — the ladder depth d (an integer 0..8) — and both roads fork 1→2→4→8→16 at the SAME shrinking instants on
one gold ruler. Their rung *values* differ (logistic R₁ = 1+√5 = 3.2360680, sine R₁ = 0.7777338 — they live on
different r-axes), yet both report a live-measured Feigenbaum δ → 4.6692016… The two roads share ONE lifted
engine fed two different humps — that sharing IS universality.

- **The engine** (`core.mjs`) is lifted VERBATIM from `bifurcation/core.mjs` (the superstable-ladder solver),
  inlined byte-identical into `index.html` (parity asserted by `core.test.mjs` Leg 7).
- **The hero verb**: one dial → both staircases fork in unison; live δ meters crawl to 4.6692.
- **The neg-control** is a touchable dial state: flip the second road to the **tent** (piecewise-linear, a
  corner not a curve) — it climbs one rung then refuses to fork, shattering into a no-rhythm ember band; δ
  reads "— (no cascade)", never a number, never NaN. Rungs at depth 8 read 9 / 9 / 1.

### Verification
- `node cross/two-roads-one-rhythm/core.test.mjs` → 15/15 ALL GREEN (incl. byte-twin parity, anchors,
  determinism, anti-vacuity).
- In-page pill ✓ 6/6; `window.__tworoads.runSelfTest()` reproduces it in-browser.
- `node bifurcation/core.test.mjs` still 30/30 (the reciprocal crumb edit didn't disturb it).
- `node tools/forge/forge.mjs --check --all` → 42 files current (no `.src.html` in this tree).
- Live: hero verb works; tent toggle is a reachable on-page state; reciprocal sib-links resolve both ways +
  the Workbench card opens it; 0 horizontal overflow @1280 and @390; prefers-reduced-motion jumps to a
  fully-readable static end-state.

Registered as a garden bloom (no new front-door footprint): a Workbench card (glyph ⇈) + a reciprocal crumb
from `bifurcation/index.html`.
