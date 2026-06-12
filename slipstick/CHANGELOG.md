# Slipstick — Changelog

## Build 1 (2026-06-12) — a working slide rule

The workshop's first **instrument**: a genuine, draggable analog computer. Not art to watch, not a
game, not a puzzle — a real device that does real arithmetic by sliding logarithmic scales.

- **Scales** (drawn by exact base-10 logarithm positioning): C/D (1 cycle, the multiply pair),
  A/B (2 cycles, squares), K (3 cycles, cubes), CI (reciprocal of C, red, runs right-to-left),
  L (linear mantissa = log₁₀ read directly), and a flip-out trig face S (sin) / T (tan).
- **Interaction:** drag the **slide** (the middle strip) to multiply/divide; drag the glass
  **cursor** (red hairline) to read every aligned scale at once. Real PointerEvents, pointer capture.
- **Live readout** decodes whatever the rule is set to, in plain arithmetic (e.g. `D 2 × C 3 = D 6`),
  plus a per-scale value strip (D · C · CI · A · B · K · L, or trig S/T on the flip face).
- **Worked examples ("set it for me"):** 2×3, 7×8, 355÷113 (≈ π), √50, 2.5³, sin 30°, tan 45° —
  each slides the rule into position and shows the reading vs. the exact value with the reading error.
- **Honesty toggle:** a "decade lamp" note reminding you a slide rule gives significant figures, not
  the decimal point — you supply the power of ten.
- **3 cosmetic skins** — Boxwood / Mannheim (ivory) / Blueprint — cosmetic ONLY (never move a tick).
- **2× PNG export**, reduced-motion respected, plays from `file://`.

### The crux — correctness, PROVEN (self-test 13/13 ✓, never ships red)

A pure layout core (`scalePos` / `readScale`) is the single source of truth for both drawing and
self-test:

1. **Round-trip exactness** — `readScale(s, scalePos(s, v)) == v` to <1e-12 across all 9 scales
   (18,009 samples).
2. **Multiplication identity (the slide-rule theorem)** — placing C's index over D=a and reading D
   under C=b yields `a·b` (3,600 pairs); division is the inverse (1,600 pairs) — to <1e-12.
3. **Aligned scale relationships** — at a common cursor x: A = D², K = D³, C·CI = 10, L = log₁₀ D
   (1,000 x each) to <1e-12 — *why* the cursor reads squares/cubes/reciprocals/logs simultaneously.
4. **Trig consistency** — the D-reading under the S hairline is 10·sinθ, under T is 10·tanθ
   (1,000 each) to <1e-12.
5. **Worked-example accuracy** — every example's exact-math path is exact (<1e-9) and its pixel-read
   path lands within slide-rule precision (~3 sig figs) — proving the instrument is honest.
6. **Skin invariance & finiteness** — the tick-layout fingerprint is identical across all 3 skins
   (style only re-renders); all positions finite & monotonic.

Self-test core extracted and re-run under Node — 13/13 PASS (browser fingerprint == Node fingerprint).

### Verification

Browser-verified end to end on a served origin (agent-browser), by the build deputy and independently
re-confirmed by the lead: chip green `rule verified — 13/13 ✓`, the page's real `runSelfTest()`
re-run in-browser returns 13/13, **0 console errors / 0 warnings / 0 page errors** across the full
battery (slide drag with real PointerEvents — product preserved as the slide moves; cursor drag; all
7 worked-example chips reading correctly incl. 355÷113 → 3.14 / Δ0.05% and 2.5³ → 15.6 / Δ0.16%; all
3 skins with identical fingerprint; flip to trig and back; 2× PNG export valid). `ws:seen:slipstick`
breadcrumb set (try/catch-guarded).

Bugs found & root-caused during the build (all caught by the Node self-test before browser): four
half-open-decade boundary issues in the test sweeps (single-cycle scales wrap at the decade edge), a
multi-decade range reduction for the cube worked-example check, and a CI-convention correction (a CI
scale reads 1/x as a *mantissa*, so the true invariant is C·CI = 10 across the open decade, not a
literal CI = 1/x).
