# Two Ways to π — SPEC

A **cross** exhibit (a garden piece reachable via the Workbench, no front-door map footprint). It composes
two already-built, code-disjoint cores so that **one number, π, is reached two maximally different ways** on a
single number-line, and the *agreement* is the thing you watch.

## The soul (form expresses content)

- **One central π number-line**, fixed 3.00 → 3.50, with 3.14159… inscribed along it. Both answers live on
  this ONE ruler — never as side-by-side charts.
- **THE GOLD SPELL** (exact, instant, present from frame one): a gold bar nailed at exactly π with the exact
  leading digits `3 1 4 1 5 9` lit in gold serif above it — locked, motionless. A bottom-left billiard INSET
  replays the Galperin timeline (heavy brass block + light white block + wall), the live count ticking
  3 → 31 → 314 → 3141 as the coupled mass-ratio climbs. The THING (a real clacking billiard), not its plot.
- **THE STAMMER** (probabilistic): the main field is the lifted planked-floor needle rain — matchstick-needles
  flash green on a seam-cross, grey when clean (the THING). Its running estimate is NOT a separate curve: a
  single white CARET rides the SAME π ruler, wrapped in a translucent teal CORRIDOR BAND drawn as a WIDTH on
  the line (the displayed band = the 1.96σ `corridorHalfWidth`). As N climbs the band contracts ~1/√N and the
  caret rattles inside it, walking toward the gold bar.
- **THE CLIMAX**: track the first N where the band CONTAINS π. At that instant the corridor flushes gold, the
  gold digits pulse, a soft chime-tick fires, and the banner latches *"the guess now holds the certainty · N=…"*.
  Re-armable via the ⟲ **Drop until it lands** button.
- **ONE DRIVER**: a single log-N dial (50 → 5×10⁶) + presets. N drives the Buffon side directly; the coupled
  mass-ratio 100^k spells k+1 gold digits, so the two readouts share one notion of "how precise."

## Honest framing (front and center)

- **THE SPELL — exact**: a collision count is an integer (===), never moves.
- **THE STAMMER — an estimate** with visible error; the latch is "band contains π," NEVER "caret === π."
- The asymmetry is stated plainly in the lede + the scope block + the two readout cards. A center agreement
  chip flips teal → gold at the latch.

## Architecture — single-source core

`core.mjs` has a `// === CORE BEGIN ===` / `// === CORE END ===` slab containing BOTH cores lifted VERBATIM:

- **BUFFON slab** (from `buffon/core.mjs`): `crosses, crossProbUniform, crossProbFixedAngle, piEstimate, toss,
  makeRng, runBatch, corridorHalfWidth`.
- **CLACK slab** (from `collisions/core.mjs`): `elasticBlockBlock, closedCount, naiveFloorCount, velocityCount,
  simulate, eventCount, piPrefix, isPiPrefix, PI_DIGITS, RATIOS`.
- **THE THIN ADAPTER** (the only new logic besides `runSelfTest`): `solveBoth(N, k, seed, opts)` runs
  `runBatch(makeRng(seed), N, L=0.8, t=1.0)` for `{piHat, crossings}`; `hw = corridorHalfWidth(N, 0.8, 1.0,
  1.96)` for the DISPLAYED band; `eventCount(RATIOS[k], 1)` for `exactCount` with `goldDigits = piPrefix(k+1)`;
  returns `bandContainsPi = isFinite(piHat) && (piHat-hw) <= π <= (piHat+hw)`. `opts.thetaFixed` and `opts.naive`
  pass straight through to the unchanged cores for the two neg-controls. `L=0.8, t=1.0` EVERYWHERE so the
  displayed band and the live needle floor agree.

The slab is inlined **byte-identically** into `index.html` between the same sentinels (a tool re-injects it; the
parity leg proves char-for-char identity).

## The cruxes (proven by both the in-page pill and `core.test.mjs`)

1. **STAMMER converges INTO its corridor** — seeded big-N run, `|piHat−π| ≤ corridorHalfWidth(N,.8,1,4)` at
   N=4×10⁵ (the GENEROUS 4σ gate; the page DISPLAYS the 1.96σ band — copy never conflates the two). And the
   estimate NEVER equals π.
1b. **the band shrinks ~1/√N** — meanErr decade-ratio over two decades ∈ [6,16].
2. **SPELL is exact** — for every ratio 100^k, `eventCount === closedCount === velocityCount === piPrefix(k+1)`
   EXACTLY (3, 31, 314, 3141).
3. **THE AGREEMENT is real** — at the converged N the gold bar sits inside `[piHat−hw, piHat+hw]`.
- **NEG A (Buffon)** — fixed-angle θ=π/2 throw → piHat → 2.0, `|2.0−π|>1`, band never contains π.
- **NEG B (Clack)** — `naiveFloorCount(1,1) → 4` not 3 (boundary trap), `isPiPrefix(4)=false`, the gold spell
  reads the WRONG digit.
- Both neg-controls FAIL the gate while both correct paths PASS — a vacuous "they always agree" checker would
  PASS leg 3 but FAIL both controls.
- **BYTE-TWIN PARITY** — `index.html`'s inlined CORE slab === `core.mjs` CORE char-for-char.
- **ANTI-CIRCULARITY** — the Buffon solver body never names a Clack fn and vice-versa (disjoint domains).

## Discoverability (reciprocal, footprint-free)

- ONE new Workbench `.card` (sibling to The Shape They Share's card).
- Reciprocal `.sib` cross-links: `buffon/index.html` and `collisions/index.html` each point to this exhibit; this
  page links BACK to both via `.crumbs`. (collisions is forged from `index.src.html`.)
- NO new front-door PLACES/POI node, NO `index.src.html` for the cross page — smoke + sky bijection stay green
  by construction.

## Files

`cross/two-ways-to-pi/{core.mjs, core.test.mjs, index.html, SPEC.md, CHANGELOG.md}` + edits: 1 new workbench
card, buffon sib link, collisions `index.src.html` sib link (re-forge). Zero dependencies.
