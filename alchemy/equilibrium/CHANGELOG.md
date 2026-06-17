# Le Chatelier's Vise — CHANGELOG

A wall-bench of the Alchemy Lab: a reversible gas-phase reaction sealed in a glass
cylinder you SHOVE (piston → volume) and HEAT (flame → temperature), watching the
species re-settle toward the side the stress favours until Q(ξ) re-equals K. The
4th lit bench in the wing; it blooms the #82 "Equilibrium · Le Chatelier" planter.

## Cycle #92 — planted (BUILD/garden)

The Equilibrium planter, dashed and empty since the wing was raised, becomes a lit
card. A faithful mirror of the Limiting-Reagent sibling (#87) — same self-contained
`core.mjs`, byte-identical inline between sentinels, a Node twin, a local in-page
self-test pill, the same topbar / ws:seen / lawnote furniture — but in a DIFFERENT
register, chosen for honesty.

### The register: float + tolerance, NOT exact BigInt rational
Equilibrium is a TRANSCENDENTAL root: ξ* solves a polynomial-of-ratios equation
whose root is generally irrational, and K(T) carries an `exp()`. A "fake-exact"
rational answer here would be a lie. So this core is honest:
- ξ* is found by **bracketed bisection** on f(ξ) = Q(ξ) − K. Q is strictly monotone
  in ξ across the feasible window (every product factor grows, every reactant factor
  in the denominator shrinks), so there is exactly one sign change ⇒ bisection
  converges unconditionally, no Newton seed.
- Every claim is asserted to a single **public tolerance `TOL_SETTLE = 1e-9`** — the
  contract the bench caption and the landing's wing-proof both read. Nothing invents
  a tighter one.

### The two hero verbs (the FEEL)
- **The piston** — drag the rod (or the volume slider) to set V. Shoving down drops V,
  raises P, and the gas re-settles toward the side with fewer gas molecules. On Haber
  (Δn_gas = −2) the two reactant bands shrink and the ammonia band swells.
- **The flame** — drag the wick (or the temperature slider) to set T. Each change
  re-runs `reSettle` at the new `Keq(rx,T)` (van't Hoff). On the EXOthermic Haber
  forward reaction, turning up the flame makes the ammonia band BACK OFF.

### The negative control (what makes the proof real)
A reaction toggle hot-swaps among 3 curated reactions; dnGas is re-derived from the
core (`nuOf` reduce), never hardcoded. On **H₂+I₂⇌2HI (Δn_gas = 0)** a squeeze shifts
NOTHING — the bands hold — proof the shift is real physics, not a cosmetic trick.

### The earned relief caption
Fires only in the post-settle branch (phase === 1), and reads the proof's OWN
before→after extent + Q + K, so the named direction is what ACTUALLY happened:
- a shove → "shifted forward, toward fewer molecules until Q re-equalled K";
- a heat on an exo → "shifted back, toward more molecules";
- the Δn=0 control → "the squeeze does nothing. The bands hold. This is the control."
It cannot lie: Q and K are printed straight from `S.settled`, aligned to TOL_SETTLE.

### The demoted Q→K side-rail
A faint `.shadow` panel (the wing's existing register, mirroring Stirling's
"the loop is the engine's shadow"): a dim Q(ξ) curve, K as a horizontal guide, a
bright bead at the settled ξ. "The hero is the cylinder; the curve is its shadow."

### The math core (`core.mjs`, the SOLE authority)
`R_GAS`, `TOL_SETTLE`, `nuOf`, `Keq` (van't Hoff), `feasibleRange`,
`reactionQuotient`, `settle` (bisection), `reSettle` (the one camera call — returns
`{xi,K,Q,moles,species,nu,dnGas,V,T,P}`, pure, self-consistent P from settled moles),
`toNum`, `LIBRARY` (haber · no2 · hi-control). Inlined byte-identical into the page
between `// ===== EQUILIBRIUM-CORE … =====` sentinels; the page's re-extraction
parity check fails if the inline ever drifts.

### Self-test (the done-bar)
- **Node twin** `core.test.mjs`: **31/31 GREEN** — 9 groups (Q≡K over a V,T grid;
  ξ* in the feasible box; the squeeze direction; the Δn=0 neg-control no-shift;
  van't Hoff sign + an endothermic tooth; monotonicity; fixed-point teeth; idempotent
  re-settle) + the byte-parity block.
- **In-page pill**: **11/11 ✓** — groups 1–8 against the inlined core + two
  grounded-gate DOM checks (rendered band fractions match `reSettle().moles`; the
  relief caption reads Q = K) + the fetch-based parity check (degrades on file://).
- **Landing** `alchemy/index.html`: pill now reads **"4 benches · 91/91 ✓"** — the
  card flipped to live, the structural counts updated (4 benches / 1 planter), the
  Equilibrium bench-link assertion added, and `equilibriumProof()` folded into the
  wing-level math attestation (Q≡K at rest · squeeze shift · neg-control no-shift ·
  van't Hoff sign · a hand-broken-ξ perturbation tooth).

### Cross-file touches this cycle
- `alchemy/index.html` — the landing flip (card · counts · prose · wing-proof).
- `index.src.html` → re-forged to `index.html` — the front-door blurb no longer calls
  live benches "empty planters"; it names the Limiting Reagent + this Vise as lit and
  leaves "the periodic table" as the one remaining planter. `forge --check --all` GREEN.

### A quiet teaser (no reciprocal edit this cycle)
The topbar carries a one-way cross-link "↔ where the pressure comes from" →
`cavern/pressure`: the piston you shove here raises P = nRT/V; in the Cavern that
pressure is counted off wall collisions, the floor under this vise.
**FUTURE RECIPROCAL:** add a return link from `cavern/pressure/index.html` back to
this bench so the bridge is two-way.
