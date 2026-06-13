# The Polariser — changelog

A polarization bench for the Hall of Mirrors optics wing. Demonstrates that light
is a transverse wave and that intensity through rotated linear polarisers follows
**Malus's law**, I = I₀·cos²θ — culminating in the **three-polariser paradox**.

Single self-contained `index.html`: vanilla HTML/CSS/JS, zero dependencies, no
build, no network. Dark "estate" look with the warm gilt accent `#c9a24a`, serif
gilt `<h1>`, mono small-caps labels — matches `linkage/`, `optics/`, `kaleidoscope/`.

## What it does

- **Two filters · Malus.** A source of unpolarised light (random E-field spokes)
  → fixed polariser **P1** at 0° → a rotatable **analyser** at θ → a screen. As θ
  rotates, the transmitted intensity follows `I₀·cos²θ`: full at 0°, pitch-dark at
  90°. The screen's brightness *is* the computed intensity. A cosθ-projection
  diagram shows the polarised vector dropping onto the analyser axis. Live detector
  bar + numeric readout track cos²θ.
- **Three · paradox.** P1 at 0°, P3 at 90° (crossed → dark). Insert **P2** at θ
  between them and light reappears: transmitted fraction (rel. post-P1) is
  `cos²θ·sin²θ = ¼·sin²(2θ)`, peaking at **θ=45°** at exactly **¼** (= ⅛ of the
  incident unpolarised intensity). Slide P2 from 0° (dark) → 45° (peak) → 90° (dark).
- **Drag** the dashed dial on the active filter to rotate it, or use the slider.
- **Sweep** button animates a smooth full rotation (60fps rAF; reduced-motion safe).
- Cosmetic recolour-only **skins** (Brass / Cyan / Rose) — never read by the physics.
- **PNG ×2** export of the current bench.

## The proof (self-test)

The physics lives in a DOM-free core (`malus`, `firstPolariser`, `stackTransmission`,
`paradoxFraction`, `paradoxClosed`). The topbar `.selftest` chip calls the SAME core
the headless test does and shows `N/N verified` (green) + a full `console.log` summary.
9 checks, every computed value asserted against closed-form ground truth to ≤1e-9:

1. Malus: `malus(I0,θ) == I0·cos²θ` over 0..180° step 0.25° — max err **0** (float-exact).
2. Crossed analyser θ=90° → exactly 0 (3.7e-33).
3. Aligned θ=0° → exactly I₀ = 1.
4. First polariser on unpolarised input → exactly ½.
5. Crossed pair (0°,90°) on unpolarised → 0.
6. 3-polariser chain `== ¼·sin²(2θ)` over a fine sweep, and 0 at 0°/90° — max err **1.67e-16**.
7. Paradox peak: exhaustive scan finds argmax at **θ=45°**, value exactly **¼**.
8. 3-polariser absolute throughput from unpolarised → exactly **⅛** at 45°.
9. General stack `[0°,θ]` on unpolarised `== ½·cos²θ` over a sweep — max err **0**.

## How it was verified

- Headless: sliced the pure core out of the HTML and ran `runSelfTest()` under Node → **9/9 PASS**.
- Browser (`agent-browser`, session `hom-polariser`, http.server :8104):
  - Self-test chip **green "9/9 verified"**; console shows the 9 PASS lines and **zero errors/warnings**.
  - `ws:seen:polariser` breadcrumb confirmed set in localStorage.
  - Visually confirmed: Malus screen full-bright at θ=0° (1.000), pitch-dark at θ=90° (0.000);
    paradox screen dark at θ=0° (0.000) and glowing at θ=45° (0.250) — light reappears through the crossed pair.
  - `↗ HALL OF MIRRORS` link wired (target wing not built yet) + `← WORKSHOP` back link.
