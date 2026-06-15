# Titration — CHANGELOG

The Alchemy Lab's **second** live bench. The Reaction Balancer next door reads
whole-number coefficients off the nullspace of a reaction; here the question is
softer and more felt: pour a base into an acid, drop by drop, and *watch the moment
they balance.* Form expresses content — you operate a buret over a flask, the
phenolphthalein flips pink a hair past neutrality, and the titration curve is
demoted to a dim shadow in the side rail. The atoms in this flask are the same ones
the Balancer puts in order.

## v1 (cycle #46 · BUILD/garden · planter) — the pH&Titration planter blooms

**The native metaphor (form expresses content).** A strong-acid/strong-base
titration is a *charge-balance* statement, and we show the THING, not its plotted
curve. The hero (~60% width) is a clamped graduated SVG **buret** (brass clamp,
reagent-cyan NaOH fill with a concave meniscus descending as volume grows, ticks
every 1 mL / numerals every 5) over a conical **Erlenmeyer flask** on a **stir
plate**. Open the draggable **stopcock** (tap = one `DROP_ML` drop; hold = a stream)
and chase the endpoint by feel. The flask's color comes from `indicatorColor(pH)`
**only**, so the picture can never disagree with the proven number. The titration
curve lives as a **dim phase-locked inset** in the side rail (the same Stirling /
Lattice re-soul register — "the curve is the engine's shadow") with a bead that
walks it in lockstep with the flask, a cyan flag at true `V_eq`, and a magenta flag
at the visible endpoint.

**The one justified new hue.** `--indicator #d6266e` — phenolphthalein magenta. The
indicator *is* the subject of this bench, so its color earns a token of its own;
everything else is lifted verbatim from the lab's `:root` (warm-black ground, brass
`--gold`, reagent `--reagent`, the brushed-soot `::before`, serif headings, mono
readouts).

**The math is single-sourced and exact.** `core.mjs` is the SOLE pH authority. From
the charge-balance neutrality condition `[Na⁺]+[H⁺] = [Cl⁻]+[OH⁻]`, with
`d = (Ca·Va − Cb·V)/(Va+V)`, the hydrogen-ion concentration is the positive root of
`h² − d·h − Kw = 0` (Kw = 1e-14, 25 °C) and `pH = −log10(h)`. No "neglect Kw", no
"the acid dominates" — the curve passes through **pH = 7.000000000** at the
equivalence volume because there `d = 0 ⇒ h = √Kw = 1e-7`. The module also exports
`hydroxideExact` (the OTHER root, `h·OH = Kw`), `Veq`, `indicatorColor` (a display
rule keyed on `INDICATOR_PH = 8.2`, computed wholly apart from any pH=7 test),
`endpointV` (invert `pH(V) = 8.2` by bisection, **independent** of `Veq`),
`backSolveCa`, the labeled `DROP_ML = 0.05`, and a 3-preset dilution `LIBRARY`. The
bench READS these; it recomputes no pH inline.

**Three interactions, grafted into one synthesis.**
- **Free pour** — open the stopcock, chase the endpoint by feel.
- **Dilution dial** — 0.1 / 0.01 / 0.001 M. At 0.1 M the visible endpoint sits a
  *fraction of one drop* past true `V_eq` (the sharp cliff feels exact); dilute to
  0.001 M and the gap opens to **more than a drop** as the curve visibly flattens.
  This lesson is self-test-backed, not asserted by hand.
- **Precision trial** — a hidden unknown `Ca`. **Lock In** arms only once the pink
  holds; **Grade** reveals the back-solved `Ĉₐ` (via `backSolveCa`) against the
  truth, with the error in mL / drops / %, a magenta flag at your endpoint and a
  cyan flag at true `V_eq` naming the gap, and Bullseye / Textbook / Flooded tiers.
  **Rinse & repeat** for a fresh aliquot of the SAME unknown; the score rewards
  **concordance** (trials agreeing within ±1 drop). New Unknown rerolls.

**Reduced motion.** `prefers-reduced-motion` renders one correct static frame — no
falling drops, no swirl — and a `+1 drop / +1 mL / −1 drop / jump-to-V` stepper
drives the SAME flask color + pH readout + inset bead + Lock-In/Grade/Repeat
identically (a render switch over an animation-free state model, not a second code
path). Verified by forcing `matchMedia` reduced-motion: pour disabled, stepper
drives color & readouts, pill stays green.

**The honest self-test (Node twin `core.test.mjs` + the in-page pill).** Every claim
is proven, and only honest claims are made:
1. `V_eq = Ca·Va/Cb = 25.000 mL` exactly (≤1e-12).
2. `pH(V_eq) = 7.000000000` (≤1e-9).
3. One drop before `V_eq` → pH < 7 (=3.9996).
4. One drop after `V_eq` → pH **> 9.9** (=9.9996, an honest ~6-unit leap — **not**
   >10, which would be false at 0.05 mL).
5. Half-equivalence identity: `pH(V_eq/2)` equals the closed-form diluted-strong-acid
   pH (both = 1.477121). Stated plainly: this is **not** a buffer plateau —
   strong/strong has no pKa line.
6. Overshoot EXACT branch: `pH(V_eq+ε) == 14 + log10(hydroxideExact)` — machine class
   (~1.6e-11) at one drop; the log-reconstruction of a tiny quantity loses a few
   digits at larger ε (≤1e-7), labeled honestly. The true 1e-12-class identity is
   the residual (8), not this.
7. Overshoot APPROX as a LESSON, not a lie: the neglect-Kw form
   `14+log10(ε·Cb/(Va+V_eq+ε))` agrees only within `[1e-9, 1e-6]` — proving the
   textbook simplification is good-but-not-exact.
8. **Machine-exact root residual:** `|h²−d·h−Kw| ≤ 5e-18` across the whole curve
   (the true 1e-12-class identity — worst 1.05e-18).
9. **Anti-circularity / negative control:** `endpointV` (pH-8.2 inversion) is
   computed independently of `Veq`; `endpointV > Veq` strictly AND `INDICATOR_PH ≠ 7`.
   **Perturbation teeth:** setting the threshold to 7 collapses the gap (the invariant
   depends on 8.2 ≠ 7).
10. **Dilution lesson, self-test-backed:** at 0.1 M `(endpointV−Veq)/DROP_ML < 0.1`
    (sub-drop, =0.016); at 0.001 M it exceeds 1 (=1.58 — dilution opens the visible
    titration error).
11. **Scoring is underwritten:** `backSolveCa` at a true-Veq endpoint recovers `Ca` to
    machine precision (≤1e-12), so the grade can't lie.
12. **Re-extraction parity:** the inline core between the
    `// ===== TITRATION-CORE … =====` sentinels is BYTE-IDENTICAL to `core.mjs`
    (export-stripped), so the page's pill can never silently drift from the Node twin.

The in-page pill adds a **DOM check** that the rendered flask tint at the current pH
equals `indicatorColor(pH)` (the picture reads the core). Node twin **26/26 GREEN**
(exit 0); in-page pill **15/15 ✓**.

**Verified in a real browser** (served on 127.0.0.1:8746, torn down by exact PID):
pill 15/15 ✓ · 0 console errors across every interaction · 0 nested anchors · 0
horizontal overflow at 1280 AND 390. Opening the stopcock pours, the flask tints,
the indicator flips a hair PAST true equivalence (colorless at pH 7, pink at the
8.2 endpoint), the pH readout + inset bead move in lockstep with added volume. A
careful stop-at-endpoint earns **Bullseye** (0.49 drops, 0.09%); a flood earns
**Flooded**. Boot drops `ws:seen:alchemy` + `ws:seen:titration`.

**Registered** as the Alchemy Lab's **2nd live bench** on `alchemy/index.html` (the
pH&Titration planter promoted to a lit live bench with a bare-relative href; the
landing self-test updated to *two live benches · three empty planters*; the wing
math proof extended to import BOTH `reaction-balancer/core.mjs` AND
`titration/core.mjs`, each in its own try/catch, so the pill reads
**"2 benches · 30/30 ✓"**). No front-door map change — the wing grew 1 → 2 live
benches, 3 planters remain.
