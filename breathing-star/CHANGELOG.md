# The Breathing Star — CHANGELOG

## #246 — first bloom: a star you squeeze that rings back to balance

**What it is.** A self-gravitating polytrope you can grab and squeeze. A star is a standoff —
gravity pulls every gram inward forever, and only pressure pushes back; where they cancel is the
rest radius. Squeeze the limb in and you over-stuff the pressure: it shoves back, overshoots, and
the whole luminous body *rings* around its rest radius until the ringing damps and it settles right
back where it started. Turn the brass fusion knob (the gas stiffness K) and it re-relaxes to a new
rest radius; cut the pressure entirely and there is no equilibrium left — the body just falls.

**The body is the readout.** One scalar `compress = (r_eq − r_now)/r_eq` drives colour, luminosity,
and haze (hotter + brighter compressed, dimmer amber swollen — Stefan-Boltzmann shown, not stated).
The interior mass shells draw as faint concentric rings, so the spring-of-shells *is* the body. A
dashed rest-radius ring at `eqRadius()` is the keystone the disc breathes around AND the trace
baselines on — one source — making overshoot, settle, the monotone fusion dial, and the no-
equilibrium collapse all legible with zero number-wall.

**The model.** A staggered Lagrangian finite-volume polytrope: N=12 mass interfaces, `M_enc(i) =
(i+1)·dm` exact, polytropic EOS `P = K·ρ^γ` with γ=5/3. The force on an interface is gravity plus
the net pressure force of the two gas cells it separates, `A·(P_below − P_above)` — a difference of
adjacent cell pressures, which is well-conditioned where a naive `dP/dr` blows up at the steep
central gradient. `relax(K)` finds hydrostatic balance by **quick-min damped descent** (the standard
MD energy-minimiser: project velocity onto force, zero it the instant the body moves uphill) — it
reaches a balance residual ~1e-13 for every K in [0.1, 2.2] from the single canonical start
`initR(1.0)`, where plain damped Euler either creeps too slowly (heavy damping) or goes unstable on
the stiff central cell (light damping). The live heartbeat uses a light-damped explicit-Euler
integrator so the body visibly rings. A no-cross guard (ordering clamp + floor) lives inside the
sentinel, so a hard squeeze piles the shells at the floor instead of crossing.

**The five self-test legs (proved EXACT, in-page pill + Node twin, two-tolerance discipline):**
1. **BALANCE** — net accel ≈ 0 at the relaxed equilibrium (residual ~1e-13, TOL_BALANCE=1e-3).
2. **STABLE-RETURN** — pluck + ring + settle returns to the SAME *cached* equilibrium relax()
   produced (not a re-relax), settle error ~5e-13, TOL_RETURN=5e-3 (kept separate + documented).
3. **MONOTONE-COLLAPSE (neg-control)** — pressure off ⇒ every shell strictly falls, ends AT THE
   FLOOR (R_FLOOR, not r=0), and never settles.
4. **MONOTONE-FUSION-DIAL** — raising K strictly grows the equilibrium radius.
5. **RINGING-ENVELOPE-DECAY** — per-period peak amplitude decays monotonically under the SAME dt the
   live page integrates with (BEAT_DT = 1/60). The window spans one full ring period so a sub-period
   window can't alias a rising half-cycle.
Determinism asserted is narrow + honest: the canonical start always yields the same eq (a fixed
deterministic function) — NOT start-independent uniqueness.

**Node twin (`core.test.mjs`, exit 0).** Runs the self-test plus independent re-derivations not
routed through it: an energy-well check (perturbing the eq up OR down raises the total energy — a
stable minimum); FD-vs-force (−dE/dr/dm === netAccel at a perturbed config); monotone-K on a finer
grid; the **R ∝ K^1** scaling law (the n=3/2 polytrope mass-radius relation, R/K constant to <1% in
the resolved band); collapse-floor; the no-cross guard under a hard squeeze; determinism (bit-
identical relax twice); and the BYTE-PARITY check of the page's inlined core against `core.mjs`.

**Honest scope (engraved in the core header AND on the page).** What is exact is the *structure* — a
stable hydrostatic balance that rings back, a monotone fuel dial, a no-equilibrium free-fall. This
is a *reduced* model: the ring period is NOT a Cepheid period, the numbers are DIMENSIONLESS (not
solar radii, not days), and the damping is a numerical convenience, not a physical κ-mechanism.

**Front-door + siblings.** Registered as a new `breathing-star` footprint in the observatory's
stellar wing (tier 2), with its own DRAW drawer (concentric photosphere shells + a CSS opacity-
pulsing core/halo + a {5/2} star limb-mark, reduced-motion safe). Reciprocal cross-link with the
Stellar Forge — death ↔ life of one star (each in its own local topbar grammar).

**Gates GREEN (`verify.sh`).** core.test.mjs 16/16 (exit 0) · smoke renders all POIs, no abort,
slot star-clear · forge --check --all current · forge --audit-seen drops ws:seen:breathing-star ·
both cross-links resolve. In-browser: self-test pill 5/5, zero console errors, squeeze→rings→settles
to the same R, fusion up swells / down deflates, neg-control collapses and never settles, both feats
earn, both cross-links navigate.

**Build.** `index.src.html` → `index.html` via `node tools/forge/forge.mjs breathing-star/index.src.html`
(the core inlined byte-for-byte by a `forge:include core.mjs` directive; never hand-edit index.html).

## #246 — publisher polish: the cut/restore toggle now SAYS which it does

Fresh-eyes review caught one UX seam: the pressure button is a toggle (its `aria-pressed` and the
lit-dot styling already flipped on cut), but its visible label always read "cut the pressure" — so
once the star was free-falling, the same "cut the pressure" button was the thing you clicked to bring
it back, which mis-reads. Fixed: the visible label (`#cutlabel`) and the `aria-label` now swap to
"restore the pressure" while cut and back to "cut the pressure" once restored, matching the state the
red-dot styling already shows. Re-forged + re-verified (verify.sh ALL GREEN, byte-parity IDENTICAL,
70/70 forge files current). Reviewed all three surfaces in-browser (the piece, the front-door stellar-
wing footprint, the Stellar Forge reverse cross-link "✶ The living star ↔"): zero console errors;
squeeze→ring→settle earns the ring feat; cut earns the cut feat and the body free-falls to near-black;
fusion End/Home swell/deflate (rest radius 4.26 / 0.19); both cross-links navigate.
