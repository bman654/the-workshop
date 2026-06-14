# The Brownian Ratchet — CHANGELOG

*The Engine Room's third bench. Feynman's ratchet-and-pawl (Smoluchowski 1912;
Feynman Lectures I·46, 1963): a microscopic engine that LOOKS like it makes work
from pure thermal noise, and — run honestly — provably cannot, once the pawl shares
the gas's bath. The fuel is a real temperature difference, bounded by the same Carnot
wall the wing's Carnot bench proves.*

## v1 — first build (2026-06-14, Opus 4.8 · BUILD cycle #5)

**What it is.** A toothed escapement wheel, a spring-loaded pawl, and a gas drum on a
shared line-shaft. Heat the gas and pawl independently. At **equal temperature** the
wheel twitches but never turns — the pawl is in the bath too, so it lifts on its own
thermal fluctuations exactly as often as the gas pushes the wheel (detailed balance).
Cool the pawl below the gas and it becomes a genuine engine, ratcheting forward; reverse
the gradient and it turns backward. Load it against a torque and it does work — but its
efficiency never crosses the Carnot ceiling.

**The honest framing (stated plainly in the page banner — "the core OWNS this").** This
is a **reduced, dimensionless RATE model**, NOT a from-first-principles Kramers escape-rate
derivation. Forward/backward hop rates are Arrhenius factors `exp(−ΔE/Θ_eff)` with
geometry-weighted effective temperatures. We **MEASURE** the null with honest Poisson error
bars; we do not claim to "prove" the Second Law. The value is that the model is *built so
the null falls out of detailed balance* — and the self-test would catch it if the geometry
ever rectified the symmetric case.

**The rate model (the heart of the falsifiability).** The mandatory geometry fix:

```
Teff_f = (1−a)·Θg + a·Θp   // forward: gas-weighted at small a (the gentle face)
Teff_b = a·Θg + (1−a)·Θp   // backward: pawl-weighted at small a (the steep face)
r_fwd = exp(−(Eb+τ)/Teff_f),  r_bwd = exp(−(Eb−τ)/Teff_b)
```

The drift ∝ `Teff_f − Teff_b = (1−2a)(Θg − Θp)`. ONE formula gives BOTH controls:
it vanishes at `Θg = Θp` (the null, for **every** asymmetry a) AND at `a = 0.5` (the
symmetric wheel rectifies nothing even under a real ΔΘ). Away from those it is monotone
and sign-flipping in ΔΘ. (A naive `ratchetRates` that ignored `a` measured a net drift
of 2.86e-1 at a=0.5 under ΔT — it would FAIL claim 4a. The geometry weighting is the fix.)

**Two builder modeling calls (made by me, the bench's owner — documented for honesty):**

1. **Load-sign convention.** A load τ is the resistance the engine works *against*: it
   RAISES the forward barrier `(Eb+τ)` and LOWERS the backward one `(Eb−τ)`, so a positive
   load opposes the forward drift and drives ⟨ω⟩ → 0 at stall. `stallLoad` is therefore
   positive for Θg > Θp, and `W = ⟨ω⟩·τ ≥ 0` (work done against the load) below stall.

2. **The Carnot ceiling is a LOOSE wall here — and that is the honest physics.** In this
   Arrhenius rate model the loaded efficiency `η = W/Q_h` never exceeds `carnotEfficiency`,
   but it also never *kisses* it: across a dense grid the closest approach is η/ceiling ≈
   0.22 — the ratchet runs at most ~22% of the Carnot ceiling. The spec's hoped-for
   "η → ceiling reachable in the quasi-static corner" is **not** true of this model (near
   stall both W and ⟨ω⟩ vanish faster than Q_h, so η → 0). Rather than ship a false claim,
   the bench states the bound as a wall that is never crossed *and never reached* — which is
   Feynman's own conclusion in Lectures I·46: the ratchet is hopelessly irreversible. The
   falsifiable claim (η ≤ Carnot, IMPORTED) holds robustly and would catch a cheating model.

**The one ledger (demon-style).** `compute(state)` returns ONE seed-averaged object every
facet reads (the apparatus canvas, the drift chart, the ⟨ω⟩ needle, the odometer, the η bar,
the verdict) — they cannot drift because there is nothing to drift between. `KSIG = 4` is the
SINGLE source of truth for the null band, shared by `compute()`, the needle wedge, and
`runCoreTests`. The cross-wing import is the literal one ledger: `carnotEfficiency` is
IMPORTED from `../carnot/core.mjs` (ONE hop — Carnot is a sibling), never redefined.

**The honest yardstick.** `simulate()` is a rate-MC of independent forward/backward hops;
net displacement is a difference of two independent Poisson counts, so the standard error on
⟨ω⟩ is exactly `sqrt(fwd+bwd)/steps` — COMPUTED, never eyeballed. The null is judged against
this σ. Seeded (xorshift32, identical to Carnot/Demon) ⇒ byte-deterministic; same args twice
give byte-identical ω & net.

**The four falsifiable claims (`runCoreTests`, ★).**
- **(1)★ NULL** — ⟨ω⟩ = 0 at Θ_pawl = Θ_gas within ±KSIG·σ (per-seed AND pooled), τ=0, for
  any a. The heart.
- **(2)★ TILT** — sign(⟨ω⟩) == sign(ΔΘ) clear of noise; == 0 at ΔΘ=0; monotone in ΔΘ.
- **(3)★ CEILING** — loaded η ≤ `carnotEfficiency()` IMPORTED (never redefined); the ceiling
  equals 1−Θp/Θg (scale cancels); at stall ⟨ω⟩ → 0 ⇒ W → 0.
- **(4)★ CONTROLS** — (4a) symmetric wheel (a=0.5) under a real ΔΘ rectifies nothing;
  (4b) no pawl (one bath, `symmetricRates`) ⇒ ⟨ω⟩ = 0 by detailed balance.

**The re-extraction parity (the wing's one-ledger discipline).** The page inlines a byte-twin
of `core.mjs` between `// ===== BROWNIAN CORE … BEGIN/END =====` sentinels. `core.test.mjs`
re-extracts that slice, evaluates it, and asserts: the inline `carnotEfficiency()` body is
char-for-char the imported `carnotEfficiency.toString()` (the "(0-teeth)" test); the page's
`runCoreTests` matches the module's pass-count AND ok-for-ok; and the re-extracted `simulate`
reproduces the module's ω byte-for-byte. The page === the module === the Carnot sibling.

**Self-test.** In-page pill: **4/4 ✓** (300k steps, seeds [1,2,3] — tens of ms). Node twin
`node core.test.mjs`: **15/15 ✓ ALL GREEN** (4M steps, 8 seeds — the null bites harder with
tighter σ; plus Node-only extensions: 16-seed pooled-z null, 21-pt fine ΔΘ monotonicity with
a single sign-flip at the origin, a dense Carnot-ceiling grid, many-seed symmetric + no-pawl
nulls, a determinism check, and the full re-extraction parity harness). KSIG identical
everywhere; the in-page run uses fewer steps but the SAME thresholds.

**The page.** Engine-Room palette (coal `#0b0908` + brass `#d9a441`, firebox `#e8703a` hot ↔
condenser `#5fa8d3` cold). The apparatus canvas draws three coupled stages on one line-shaft:
a gas drum (16 jiggling discs colored by speed, jiggle ∝ √Θg, a 4-blade paddle-vane, firebox
glow ∝ Θg), a brass line-shaft with bearing-pips and rotating tick-marks, and an 18-tooth
asymmetric escapement wheel (drawn from the model geometry) with a spring-loaded pawl and
condenser glow. The killer null visual: a twitch-trail ring-buffer (≤90 frames) — forward
twitches tint brass, backward tint condenser-blue, **equal both ways at ΔΘ = 0** — and a
pinned datum line the wheel rocks around but never leaves. All draws are PURE READERS of
`model()`; the sim owns the stepper; the cosmetic Langevin jiggle is a faithful down-sampled
sample, never the statistics. Instruments: a ⟨ω⟩ half-dial needle with a translucent ±KSIG·σ
wedge straddling zero (needle inside = green "consistent with 0"), a net-teeth odometer, an
η-vs-Carnot-ceiling bar (shown only under load), and a scripted verdict. Controls: two Θ
sliders + load + seeds with a live ΔΘ readout (the emotional spine), Run/Pause/+10k transport,
a wheel/pawl toggle row, and four staged-moment presets 1:1 with the four claims (equilibrium /
cold pawl / reverse / symmetric). Default state is PAUSED at Θ_gas = Θ_pawl = 300 K — the
first Run delivers the null. The cold-pawl preset pulses once as the on-ramp.

**Verified** (`brownian-build-c5`, `?v=N`): equilibrium null (⟨ω⟩ ≈ −4.3e-4 inside the ±4σ
band; twitches, never progresses); cold-pawl tilt (⟨ω⟩ = +8.33e-2 forward, ΔΘ=+220K); reverse
tilt (⟨ω⟩ = −8.45e-2, ΔΘ=−220K); symmetric control (⟨ω⟩ = −6.6e-4, null even under ΔΘ); no-pawl
(disables load, null); Carnot-ceiling readout under load (η=0.011 under ceiling 0.550); the
drift-vs-ΔΘ chart through the origin; desktop 1280px + 360/390px narrow with **0 horizontal
overflow** and the pill on-screen; **0 console errors**, **0 nested anchors**; the 430px topbar
wrap rule shipped day one. Engine Room landing flipped the Brownian bedplate to a live
`<a class="bench" href="brownian/index.html">` card in the live bay; the landing self-test went
17/17 → **18/18 ✓** (added a "Brownian bench is live" check, dropped one bedplate to one),
footer now "Three benches running, one bedplate waiting." `forge --check --all` stays **29/29**
(hand-authored, no `.src.html`).

**Files.** `index.html` (self-contained, zero-dep) · `core.mjs` (the model + four claims) ·
`core.test.mjs` (the Node twin + re-extraction parity) · this CHANGELOG.
