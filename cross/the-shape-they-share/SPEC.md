# The Shape They Share — SPEC

## One line
Two physics that never met — a hanging chain (minimise gravitational PE) and a soap film between two
rings (minimise area) — shown to be the SAME curve `a·cosh(s/a)`: pull one brass dial and both report
the same shape parameter `a`, lit in gold down the middle — until the film's existence constraint runs
out and it snaps to two flat discs while the chain hangs on.

## The soul (the five questions)
- **Fun:** one brass dial on a quarter-arc track is the whole instrument; pull it and two worlds reshape
  in lockstep, then the film visibly *gives up* and the gold thread severs. A ⟲ Watch-the-snap button
  ramps it hands-free; three preset tags jump to the fat waist, the brink, and just past the cliff.
- **Beautiful:** a full-bleed dark stage; a real hanging chain of ~38 discrete brass links on the left,
  a translucent teal catenoid slowly auto-spinning on the right (meridian ribs, two gold wire rings),
  and one glowing gold thread between them whose number is the shared `a`. Chain warm, film cool, `a` gold.
- **Correct (math claim):** yes — proved EXACT by a Node twin + an in-page pill (the legs below).
- **Discoverable:** a Workbench card in the curve family + reciprocal cross-links from both parents
  (catenary & soap-film footers, beside the existing First-Integral link).
- **Fits the estate:** mirrors `reciprocal-twins` exactly (core.mjs + core.test.mjs + inlined-byte-twin
  index.html + CHANGELOG + SPEC, zero deps); the estate palette; the gold self-test pill.

## Form expresses content
Show the THINGS: a real chain of discrete links hanging under gravity (link centres placed on the
lifted `catY`/`catLen`), a real revolved soap-film surface whose necked WAIST radius *is* the shared
`a`, and a real brass knob you drag. The shared number rides a literal gold thread between the stages.
Each stage ALSO shows its own raw physical quantity (the chain's sag & span; the film's neck & ring
radius) so the visitor watches two different worlds collapse onto one ruler — never two abstract charts.

## The honest scope (non-negotiable)
The claim is NOT "a chain IS a soap film." It is: BOTH problems are the curve `a·cosh(s/a)`, and from
the same rings/pins both report the SAME `a` to machine precision — until the film's existence
constraint runs out. Stated in the page lede AND in a core.mjs header comment.

## The handle
ONE dial sets the dimensionless slenderness `s = 2h/R` with R FIXED = 1, so `h = s/2`. From that single
`s` we build TWO INDEPENDENT setups, each solved by its OWN unchanged core:
- **FILM:** rings `(R=1, h=s/2)` → `solveCatenoidA(1, s/2)` → `a_film`.
- **CHAIN:** symmetric drop `v=0`, half-span `h=s/2`, matched slack `L = 2·a_film·sinh(h/a_film)` →
  `solveCatenary(h, 0, L)` → `a_chain`.
Both invert the same constraint `R = a·cosh(h/a)` from the same `(R,h)`, so `a_chain ≡ a_film` to
machine-ε. The crucial property of THIS handle: `R/h = 2/s` DECREASES as you pull, crossing GMIN at
`s* = 2/GMIN ≈ 1.32549`, where `solveCatenoidA` returns null — the negative control is real here.

## Two disjoint cores (lifted VERBATIM, never call each other)
- **CORE A (gravity):** `solveCatenary` / `catY` / `catLen` / `catVertexX`, lifted byte-faithfully from
  `catenary/index.html`. Inverts `√(L²−v²)=2a·sinh(h/a)` by bisecting `sinh(u)/u` (monotone ⇒ unique).
- **CORE B (surface tension):** `USTAR`, `GMIN`, `coshArea_a`, `solveCatenoidA`, `meanCurvatureCatenoid`,
  `profileArea`, `discArea`, `catenoidArea`, `filmState`, lifted from `soap-film/index.html`. Inverts
  `R=a·cosh(h/a)` by bisecting `cosh(u)/u` on the stable branch `u∈(0,u*]`.
- An anti-circularity grep asserts neither solver references the other.

## The snap — two honest beats, both shown
As `s` rises, `R/h = 2/s` shrinks:
1. **AREA-snap (Goldschmidt)** at `2h/R ≈ 1.056` (`s ≈ 1.055`): the catenoid still EXISTS but two discs
   now cost less area, so a physical film already prefers to snap. `filmState` reports
   `reason:'goldschmidt'`. Marked on the dial with an amber tick "film gives up (area)". The visible
   film snap fires here (the honest "where a film lets go").
2. **EXISTENCE wall** at `s* = 2/GMIN ≈ 1.325` (`R/h = GMIN`; `solveCatenoidA → null`): a harder tick
   "no catenoid at all". Past it the BVP has NO solution.
Either way the gold thread SEVERS (~350ms eased, radial shimmer), the banner flips, and the chain does
NOT flinch — it keeps its last shape, with a faint dashed teal GHOST of where the film's `a` would have
been. Past the wall the right stage shows two slowly-spinning discs (teal→amber); the chain still hangs.
Pull the dial back below and the discs re-merge into the catenoid, the thread RE-KNITS with a gold flash.
Reversible, re-watchable.

## Self-test (Node twin GREEN exit 0 + in-page pill ✓)
1. **Agreement below the snap:** sweep `s∈[0.20,1.27)` in 0.005 steps; `a_film` and `a_chain` agree to
   `< 1e-9` (measured ~6.8e-14) — two disjoint cores, one `a`.
2. **Threshold === the analytic Goldschmidt argmin:** `|U*·tanh(U*)−1| < 1e-7`, `GMIN===cosh(U*)/U*`,
   the existence wall `s*===2/GMIN`, AND the area-crossover at `2h/R≈1.056`. The dial reads its tick
   positions FROM these computed thresholds so the UI can't drift.
3. **Negative control (load-bearing):** past the wall `solveCatenoidA===null` (two discs) WHILE
   `solveCatenary` returns a finite valid `a` (the chain hangs where the film cannot). A vacuous "they
   always agree" checker passes leg 1 and fails this.
4. **Catenoid area** closed-form === numeric ∫ (`< 1e-6` rel) AND `|H|≈0` everywhere — the lifted film
   core is sound.
5. **Catenary** hits both pins + arc length to `1e-9` — the lifted chain core is sound.
6. **Determinism:** same `s` ⇒ byte-identical `(a_film, a_chain)`.
7. **Byte-twin parity:** the inlined CORE slab === core.mjs CORE char-for-char.

## Controls
- **Brass dial** (drag on the stage, `s = 2h/R ∈ [0.30, 1.40]`): the single shared cause.
- **⟲ Watch the snap:** ramps `s` 1.20 → 1.36 → 1.20 hands-free.
- **Presets:** "Fat waist" (s=0.5) · "About to snap" (s=1.27) · "Just past the cliff" (s=1.36).

## Files
`core.mjs` · `core.test.mjs` · `index.html` (CORE inlined byte-identical between
`// === CORE BEGIN/END ===`) · `CHANGELOG.md` · `SPEC.md`. Zero dependencies.

## Discoverability note
Like every cross (catenary, soap-film, first-integral, reciprocal-twins), this registers as a WORKBENCH
CARD, NOT a front-door PLACES node. No `index.src.html` change, no map footprint change — so the map/sky
bijection + smoke check stay green by construction.
