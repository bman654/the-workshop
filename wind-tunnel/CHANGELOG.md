# The Glass Wind Tunnel — changelog

## Cycle 148 — sown (a bench in the flow vein)

THE GLASS WIND TUNNEL · *Lift is a shape you see* — tilt a wing on dark glass and watch the
air's ribbons over the curved top squeeze thin and run gold-hot while the ribbons beneath fan
wide and cool blue; the whole stack bulges up and over the foil. A garden bench seated in the
flow vein beside The Soap Film / The Catenary / The Shape They Share (no new front-door POI).

**What it is.** ~9 horizontal STREAMTUBES of air enter evenly up the left inlet and flow
left→right past a foil suspended mid-tunnel. Each tube is the band between two equal-Δψ
streamlines, RK4-traced and filled as one SVG ribbon. Because equal-Δψ bands carry equal mass
flux, **width · speed = Δψ = const ⇒ WIDTH ∝ 1/SPEED** — this is the soul, not a metaphor.
Drag the foil's trailing-edge handle (or the brass tilt dial; keyboard ←/→ nudge 0.5°) to
raise the angle of attack: the top tubes squeeze thin and run ember-hot (narrow = fast = low
pressure = suction = lift); the bottom tubes fan wide and cool blue; the whole stack visibly
bulges UP. That up-asymmetry IS the lift, seen directly. Each ribbon is coloured by
**Cp = 1 − (|v|/U)²** on a diverging cool-blue (Cp>0) → neutral → ember (Cp<0 suction) ramp.
Bright cyan TRACER DOTS advect along the tubes, tinted by local speed. A brass **lift-needle**
on the wall deflects with Cl — explicitly the ECHO of the geometry, not the primary readout —
with a gilt Γ readout and a faint ghost arc marking α_crit (the on-ramp for the hidden drama).

**The field math (the foil truly IS the mapped circle).** The foil is the Joukowski image
z = ζ + b²/ζ of a circle |ζ|=R. In the circle plane the complex potential is
w(ζ) = U(ζe^{−iα} + R²e^{iα}/ζ) − iΓ/(2π)·ln ζ, ψ = Im w; velocity dw/dζ = U(e^{−iα} −
R²e^{iα}/ζ²) − iΓ/(2πζ). Γ is pinned by the **Kutta condition** (rear stagnation at the TE
pre-image ζ=R): **Γ = −4πUR·sinα** (lift-up sign), mapping to thin-airfoil **Cl = 2π·sinα**.
Physical velocity = (dw/dζ)/(dz/dζ), dz/dζ = 1 − b²/ζ²; division taken last; points inside |ζ|<R
are skipped (the map's singularity). With b = R the circle maps to a flat plate of chord 4R —
the thin-airfoil limit where Cl = 2π·sinα is EXACT to machine precision. The streamtube trace is
cached per (α, Kutta) so dragging stays ~60fps.

**The stall (one clear event, a DEPICTED regime — NOT a claimed law).** Below α_crit (14°) all
tubes trace normally. Crossing α_crit the TOP tube's attachment releases near the leading edge:
it lifts off along a fixed separation streamline and a stippled grey DEAD-AIR pocket opens
behind the foil (short jittering segments from a SEEDED xorshift PRNG that lives ONLY in
index.html — never Math.random, never the core). The tear eases over ~150ms and the VISUAL
detachment LEADS the needle crash by ~150ms (the flow renders at an eased `visualAlpha` that lags
the dial) — you feel the air give up before the needle falls, while your hand is still on the
dial. The page lede states plainly: *attached flow below α_crit is the exact thin-airfoil law the
self-test proves; the stall above it is a modeled visual regime, not a claimed law.*

**The load-bearing negative control (PLAYABLE).** A "release Kutta" toggle lets the rear
stagnation float free → net Γ ≡ 0 → Cl ≡ 0 at EVERY α. Watch all lift vanish to 0, the stack go
symmetric, the needle flatline. A wing flies ONLY because its sharp trailing edge forces the air
to circulate; a vacuous always-lift renderer FAILS this.

**Self-test (DOM-free `core.mjs` + Node twin `core.test.mjs`, ALL GREEN — exact claim scoped to
ATTACHED pre-stall only).**
- **LEG A** — Cl(α) = 2π·sinα to <1e-12 across α∈{−10,−5,0,3,7,11,13}° (re-derived as 2Γ/(Uc),
  NOT hard-typed); slope dCl/dα → 2π/rad at α=0.
- **LEG B** (load-bearing neg-control) — clNoKutta ≡ 0 at every α, AND |Cl−clNoKutta|@11° ≥
  2π·sin3°. Lift exists only because Kutta forces circulation.
- **LEG C** (continuity / mass conservation) — ψ holds along each traced tube (<1e-4 drift), and
  the perpendicular width·speed = Δψ to <1%; an explicit constant-width fake VIOLATES it.
- **LEG D** (sign / symmetry) — Cl(0)=0, Cl(−α)=−Cl(α) to the bit, Γ<0 for α>0 (lift up), and at
  α>0 the top of the foil runs faster than the bottom (Cp_top<0).
- **LEG E** (structural neg-control) — both fields are divergence-free (net flux ≈0 at a ring of
  probes), but the Kutta field carries ∮v·dl = Γ ≠ 0 while the no-Kutta field carries 0 — they
  are genuinely different flows, not a relabel.

**Files.** `core.mjs` (zero-dep ESM, pure), `core.test.mjs` (Node twin — runs the page's
runSelfTest green, independent A–E re-derivations, asserts the B/C neg-controls provably FAIL,
byte-parity of the inlined core vs core.mjs, zero-import + no-DOM + anti-circularity greps),
`index.html` (inlines core.mjs byte-for-byte between `// ===== WIND-TUNNEL CORE =====` sentinels;
SVG ribbons + tracer dots + needle; .selftest pill runs runSelfTest() live). 26/26 checks green;
byte-parity IDENTICAL.

**Discoverability.** One card on `workbench/index.html`, seated in the flow vein beside soap-film
/ catenary / The Shape They Share. Breadcrumb `ws:seen:wind-tunnel`. Glyph 🪶.

**Publisher fresh-eyes (cycle 148) — one discoverability fix.** The bench links UP to the Aerodrome
wing (`THE AERODROME ↑` → `../aerodrome/index.html`) and is the Aerodrome's only aerodynamics bench
(its siblings Slingshot/Transfer are orbital), but the Aerodrome's `.sib` topbar row did NOT link
back DOWN — a visitor browsing the wing could never reach the wind tunnel. Added `↗ Glass Wind Tunnel`
as the first `.sib` in the Aerodrome topbar. `aerodrome/index.html` is a forge artifact, so the edit
was made in `aerodrome/index.src.html` and re-forged (`forge --check --all` → all 44 current). The
hot foil-handle throw (a ~90px drag spans to the 24° clamp) was reviewed and KEPT as-is: the 1:1
mapping is a faithful direct-manipulation affordance (the handle IS the trailing edge, `dy≈2R·sinα`);
the 4×-geared dial and the range slider cover fine control. No core/page bytes changed; twin still
26/26, byte-parity IDENTICAL, page pill 5/5 green.
