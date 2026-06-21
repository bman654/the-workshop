# The Same Beat — CHANGELOG

A cross of **The Escapement** (`hours/escapement/`, a seconds-pendulum's beat) × **The Singing Glass**
(`resonance/`, a driven wine-glass rim). One law, `ω = √(stiffness ÷ inertia)`, under two costumes that
never met.

## #237 — bloomed (the first build)

**The one idea.** There is exactly ONE oscillator law, `ω = √(stiffness ÷ inertia)`, worn in two costumes.
A seconds-pendulum's beat is `ω = √(G/L)` — gravity is the stiffness, the rod length `L` the inverse-stiffness
knob (long rod ⇒ soft ⇒ slow). A wine-glass rim's mode-2 breathing is `ω₀ = √(k_eff/m_eff)`. Both are the
SAME √. So ONE master dial `L` drives BOTH bays: it lengthens the rod AND sets the glass's natural frequency to
`ω₀ = √(G/L)`. Tune the glass to the rod's beat and both ride the SAME point on one gold √-ray — one frequency,
two confessions.

**The form (form expresses content).** A two-bay brass-and-glass diorama under one face, not a plotted curve:
- LEFT (the rod) — a real swinging brass seconds-rod (`E.pendulumAngle`, real elliptic mode) with an
  escape-wheel ghost flicking a tooth per beat and a `±θ₀` envelope. The THING that beats, swinging.
- RIGHT (the glass) — the wine-glass rim breathing its mode-2 ellipse `R(θ)=R₀(1+disp·cos2θ)` (form lifted
  from `resonance/index.src.html`), driven CLOSED-FORM from `R.ampClosed`/`R.phaseClosed`, with an orbiting
  drive dot and bulge markers showing the lag `δ`.
- CENTER — one gold slope-1 √-ray, screen-x linear in `ω`, carrying a WARM rod jewel + a COOL glass jewel that
  pin to one tick when tuned. ONE wall-clock `t` drives all three draws.

**The hand verbs.** A master dial `L` (one knob → both bays); snap-to-the-beat (uses `tuneToBeat`/`bisectAmp`,
the glass's OWN solver, to confirm the peak sits on the ray); crank `θ₀` (the rod neg-control); drive-`ω` (the
glass neg-control). A TAMPER pill perturbs the ray to prove the self-test reads the un-tampered core, then
auto-restores after 1.2s.

**The negative controls (the coincidence is GENUINE, not a fudge).**
- ROD — crank `θ₀` wide and the elliptic period `T(θ₀)=4√(L/G)·K(sin θ₀/2)` runs strictly slow; the warm
  marker peels DOWN off the ray. `driftRatio(80°)=1.1375`, monotone in `θ₀`, → 1 as `θ₀ → 0` (anti-vacuity).
- GLASS — drive OFF `ω₀` (at `0.4·ω₀`) and the rim collapses toward the quasi-static floor (`amp < ampAtRes/8`)
  with the lag fleeing 0; AND `phaseAtRes === π/2` EXACTLY (the resonance signature). The √-limit, not the
  apparatus, makes them one beat.

**Single-source discipline.** `core.mjs` is the SOLE cross-law authority. It IMPORTS the two parents
byte-untouched as two independent oracles, NEVER forked (both at two `../` hops since `cross/<leaf>/` is one
dir deeper than a top-level bench):
- `import * as E from '../../hours/escapement/core.mjs'` — the PERIOD authority (the pendulum)
- `import * as R from '../../resonance/core.mjs'` — the `ω₀`-as-param authority (the glass)

The imports sit ABOVE the `// === CORE BEGIN ===` sentinel, so they are NOT part of the byte-twin slab. The two
adapters are code-DISJOINT (the escapement block names no resonance fn; the glass block names no escapement fn —
a grep assertion in the Node twin). Two convention bridges keep both sides honest: the pendulum `ω` is DERIVED
from the exported PERIOD (`2π/Tideal`, never re-typed `√(G/L)`), and the glass `ω₀` is SET on the ray with no
`2π`/`½` factor smuggled in.

**The proof (Node twin `core.test.mjs` + in-page pill, 26/26 green, exit 0).** Over an `L` sweep:
1. SAME RAY — `|ω₀_glass − √(G/L)|` AND `|ω_pendulum − √(G/L)| < 1e-9` (worst 8.88e-16): both costumes ride ONE
   √-ray.
2. ISOCHRONISM — `pendulumPoint(L,θ₀).Tideal` identical across `θ₀∈[0.5°,89°]` (`periodIdeal` takes NO `θ₀` —
   variance === 0).
3. CONVENTION-HONESTY (byte-exact ===) — `glassPoint(L).w0 === √(E.G/L)` AND
   `pendulumPoint(L).omega === 2π/periodIdeal(L)`: no smuggled factor either side.
4. NEG-CONTROL ROD — `driftRatio(80°) > 1.05`, strictly increasing in `θ₀`, → 1 as `θ₀ → 0`.
5. NEG-CONTROL GLASS — off-`ω₀` `amp < ampAtRes/8` AND `phase < 0.05` (in-step collapse), AND
   `phaseAtRes === π/2` exactly.
6. BYTE-TWIN PARITY — `index.html` CORE region === `core.mjs` CORE char-for-char (8638 chars), and the two
   adapters are code-disjoint by grep; the escapement adapter never re-types `Math.sqrt`.
7. PARITY with the shared `runSelfTest` (5/5).

**Discoverability.** A Workbench card (group: crosses, glyph ⏱) after The Same Heat; reciprocal sibling
back-links edited into both parents (a `↔` footer in `hours/escapement/index.html`; the link woven into the
`#hint` prose in `resonance/index.src.html`, re-forged); the cross carries `↗`-grammar links back to both
parents.

### #237 — publisher fresh-eyes polish (same cycle)

- TAMPER cartouche: during an active tamper the center cartouche read "wide swing — the rod peels off the ray"
  (because tamper forces `onRay=false`), which was indirect at the default small `θ₀`. Added a tamper-specific
  branch so it now reads "the rod ray is TAMPERED — coincidence broken", consistent with the pill and the ray
  banner. Page-only logic below the CORE slab — byte-twin parity stayed green (26/26).
- Added this CHANGELOG (every cross sibling carries one).
