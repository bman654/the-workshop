# The Same Sinc — CHANGELOG

A cross of **The Squeeze** (`cavern/uncertainty-slit/`, a hard-edged diffracting slit) × **The Sampling
Theorem** (`sampling-theorem/`, a sampled tone's spectrum). One rectangle, one Fourier transform — a `sinc`
— and two benches that never met each find its **first zero** at the SAME reciprocal `1/w`.

## #239 — bloomed (the first build)

**The one idea.** A rectangle of half-width `w` has exactly ONE Fourier transform: a sinc. A hard-edged
SLIT fans its far field into the INTENSITY `|Ã(k)|² = sinc²(k·w)` (sinc(t)=sin(t)/t); its first DARK fringe
is where the amplitude sinc first crosses zero, at `k₁ = π/w` (radians). A sampled TONE carries the
NORMALISED-sinc amplitude envelope `|sinc(f·w)|` (sinc(x)=sin(πx)/(πx)); its first spectral NULL is at
`f₁ = 1/w` (cycles). Divide the slit's radian null by a lone, **surfaced** `÷π` and the two are the
IDENTICAL reciprocal, for EVERY `w`: `(π/w)/π = 1/w = f₁`. Same zeros, two costumes — one is light-squared,
one is the bare envelope.

**The form (form expresses content).** A single brass frame — NOT two side-by-side bays — so the overlay is
the hero:
- TOP-LEFT — the brass TOPHAT, the hero control. Its own half-width IS the dial: a top-hat profile (1
  inside `|x|<w`, 0 outside) with a DRAGGABLE pinch-handle on its right edge at `x=+w`. Drag it (or the
  mirrored slider) and the rectangle's width literally becomes `w`. The live readout reads `1/w` from
  `recipRail(w)`, never a re-typed literal: `w = 0.70 → 1/w = 1.43`.
- TOP-RIGHT — a grounding PHYSICAL inset (keeps it from collapsing into "two curves on a graph"): a tiny
  real slit-screen rendering the far-field luminance band (a strip of brightness with a dark first fringe,
  from the slit core's own `farFieldIntensity`) AND a tiny window laid over a tone.
- BELOW — the CLIMAX: ONE shared transform frame on a common horizontal axis = the reciprocal coordinate
  `u = 1/w`. Two skins of the same sinc-blur on the IDENTICAL x-mapping, at different vertical registers:
  - SKIN ONE (amber, upper) — the slit's far-field INTENSITY `|Ã(k)|² = sinc²(k·w)` as a luminous fan/fill
    (a strip of brightness with a dark first fringe). First dark fringe = amber notch.
  - SKIN TWO (teal, lower) — the window's amplitude envelope `|sinc(f·w)|` as a crisp stroke + filled lobe.
    First spectral null = teal notch.
  Both first-null notches land on the SAME gold `1/w` tick; a gold plumb drops through them. We do NOT force
  the lobe HEIGHTS to coincide — the visible side-lobe gap is the honesty. ONE wall-clock `t` drives all
  three draws.

**The π reconciliation — surfaced, never smuggled.** A visible gold `÷π` gate sits on the frame BETWEEN the
amber slit skin and the shared axis. The slit speaks in radians (null at `π/w`); the window speaks in cycles
(null at `1/w`); divide the slit's null by `π` and they are the same reciprocal. The lone `÷π` IS the whole
reconciliation, shown. And the `π` and the `1` are DISCOVERED, not asserted: `firstZeroArg` scans each
parent's OWN exported sinc for its first sign-change and returns the argument-zero — `π` for the slit's
`sin(t)/t`, `1` for the window's `sin(πx)/(πx)`. Neither is re-typed.

**The hand verbs.** Pinch the rectangle's handle (or the slider) — its half-width is `w`. A brass
knife-switch flips the slit profile tophat ↔ gauss (the neg-control). A `÷π`-gate TAMPER pill slides the
amber notch off the rail to prove the self-test reads the un-tampered core, then auto-restores after 1.2 s.

**The negative control (the coincidence is GENUINE, not a fudge).** Flip the knife-switch to GAUSS: the slit
profile becomes a smooth bell and its far field `exp(−2w²k²)` NEVER crosses zero (`slitHasNull('gauss')` ===
`false`; min intensity in the visible window stays strictly positive, the function never goes negative and
is monotone). So the amber skin has NO first null — nothing to coincide with; the plumb goes dark and the
cartouche drops to "NO NULL — a Gaussian transform never crosses zero". The teal window null stays. The
apparatus is unchanged — only the EDGES changed — proving it is the rectangle's HARD edges, not the widget,
that force `1/w`. A vacuous always-"coincident" checker FAILS this leg.

**Single-source discipline.** `core.mjs` is the SOLE cross authority. It IMPORTS the two parents
byte-untouched as two independent oracles, never forked (both at two `../` hops since `cross/<leaf>/` is one
dir deeper than a top-level bench):
- `import * as SLIT from '../../cavern/uncertainty-slit/core.mjs'` — `sinc`, `farFieldIntensity` (the slit).
- `import * as SAMP from '../../sampling-theorem/sampling-core.mjs'` — `sinc` normalised (the window).

The two adapters are **code-disjoint** (the SLIT block names no SAMP fn; the WINDOW block names no SLIT fn —
a grep assertion in the Node twin) and re-type NO `sin`/`π` inside the locators EXCEPT the one named `÷π`
that IS the surfaced reconciliation (asserted to be exactly one `Math.PI` occurrence in the slit adapter).

**CRITICAL FIX (the slit INTENSITY has a DOUBLE root).** `sinc²(k·w)` touches zero at the null WITHOUT
changing sign — bisecting the squared intensity is unsound. So the slit null-locator brackets the first
sign-change of the AMPLITUDE `SLIT.sinc(k·w)` (which DOES cross), then the visual renders intensity = that².
The window skin is the ANALYTIC envelope `SAMP.sinc(w·f)`, NOT `sampleTone`/`spectrum`/FFT (the discrete
DTFT Dirichlet kernel has a slightly different first null and an N-dependence) — the honest continuous
companion of the slit's continuous far field.

**The self-test (in-page pill + `core.test.mjs` Node twin), over `w ∈ [0.3, 2.0]`.**
1. **SAME RAIL** — `|slitNullShared(w) − 1/w|` AND `|windowNullShared(w) − 1/w|` AND
   `|slitNullShared(w) − windowNullShared(w)|` all `< 1e-9` (worst ~4.4e-16). Both first nulls ride one
   reciprocal `1/w`.
2. **π RECONCILED, NOT SMUGGLED** — `SLIT_ARG0 === π` and `SAMP_ARG0 === 1` (both to 1e-6), DISCOVERED from
   the parents' own sinc; `slitNullShared`'s only factor is exactly that `π`. (The twin also feeds
   `firstZeroArg` a foreign `sin(t/2)/(t/2)` and confirms it discovers `2π` — so `π`/`1` are read, not
   hard-coded.)
3. **NULL IS THE ORACLE'S** — each discovered argument-zero plugged back into the parent's own sinc returns
   ~0 there and `>0.1` just inside (genuinely where the parent's function vanishes).
4. **NEG-CONTROL GAUSS** — `slitHasNull('gauss') === false`; `exp(−2w²k²)` never negative, monotone, `>0`
   across the visible window ⇒ no null to coincide; a vacuous always-coincide checker FAILS.
5. **BYTE-TWIN PARITY + DISJOINTNESS** (Node twin) — `index.html` CORE region === `core.mjs` CORE slice
   char-for-char (9633 chars); the two adapters are code-disjoint by grep; the lone `÷π` is the slit
   adapter's only `Math.PI`.

In-page pill: **4/4 green** · Node twin (`core.test.mjs`): **21/21 green** · ~61 fps · clean console ·
breadcrumb `ws:seen:cross-the-same-sinc`.

**Discoverability.** A Workbench crossings card (glyph `⌇`, a sinc-lobe wavy line) appended after The Same
Beat in the Computation deck; reciprocal sib-links woven into BOTH parents in each parent's own style — a
`↔` back-link + an `.xteaser` in The Sampling Theorem, a `↔` back-link in The Squeeze.
