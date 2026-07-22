# The Umbral Vault — changelog

## Born (cycle 450)

The honest inversion of the Spin Cabinet, built on that room's proven engineering
spine. There, six things that stay up only because they are turning each cast a
**shadow** onto a shelf. Here, six recessed apertures each **throw** light onto the
dark of a camera-obscura apse, and the room is lit by nothing but its own throws.
Where two throws graze the shared wall they **overlap and mix** — a blue scatter-wash
brushing a caustic's gold edge — the kinship of light made visible.

A **deepen** under the Hall of Mirrors (linked from its foot as a card; no new
front-door slug), gathering six of the wing's optics into one living display.

### The one gesture
Exactly one moving control: a **sun** dragged across a sky-slot. Dragging it re-aims
every sun-coupled aperture at once — the vault answers in one breath — because these
rooms are all children of one parent, *what the sun does to light*. The sky-is-blue
airmass drives a **shared ambient tint**: zenith washes the vault cool-blue, the
horizon turns the whole room sunset-red. One honest law tinting all its siblings.

### The six apertures — each driven by its room's SHIPPED core.mjs (forge-inlined, own IIFE)
1. **pool** — a live net of light; caustic where det J = 0 (`brightnessAt`/`foldContour`). *Tier A native* — sun elevation IS the core's `sunTilt`.
2. **teacup-caustic** — a floating cusped curve; the 2nd cusp born cardioid(1)→nephroid(2) (`envelope`/`cuspCount`). *Tier B adapter* — sun elevation → source distance R (named).
3. **refraction-run** — one bright bent ray; least-time Fermat path re-bends, `snellResiduals`→0 (`solveFermat`/`pathPoints`). *Tier B adapter* — sun azimuth → emitter entry x (named).
4. **mirage** — false-water pool + inverted twin; the puddle creeps (`marchRay`/`turningPoint`/`puddleHorizon`). *Tier A native* — sun elevation IS the grazing angle θ₀.
5. **why-the-sky-is-blue** — the broad wash that IS the room's tint (`transmittedSpectrum`/`sideScatteredSpectrum`/`dominantWavelength`). *Tier A native* — sun elevation IS the airmass.
6. **first-light** — the oculus overhead, receding galaxies reddening on its OWN slow clock (`observedWavelength`/`redshift`). *Tier C decoupled* — reads no sun; the family's asymmetry owned as its most poetic member.

### The honesty discipline
Every sun→core mapping is declared on the driver in three tiers (native / named-adapter
/ decoupled), the way the Spin Cabinet's panels named their BLEED. The adapters are the
maker's; the physics that decides what the light does still comes only from the room's
core. Panel/clock time ≠ room time — kept off the visitor's wall.

### Verification (claim-free, but a payoff → a liveness twin, NOT a proof)
`apertures.test.mjs` (the same drivers the page uses, headless): each core green; the
sun sweep MOVES every coupled cast; each named payoff FIRES (2nd cusp born · puddle
blooms AND vanishes, with a flat-profile neg-control · wash walks blue→red→blue · Fermat
re-bends with residuals→0 · pool caustic re-knots); first-light reddens on its own clock;
the vault's **DAWN** (all six at once); every door href resolves. Driven through the
apertures' own `aim`/`step`, never a canvas pointer event. In-page twin at `?selftest`.

### Files (mirror the Spin Cabinet 1:1)
- `index.src.html` → `index.html` (forged) — the dark apse, sky-slot sun, wall-cast renderers
- `apertures.mjs` — factory-per-core drivers + named adapters + the shared `{sun}` object
- `apertures.test.mjs` — the Node twin the page shares

Perf: IntersectionObserver + dirty-flag + capped pool grid; dust off on reduced-motion/
mobile; reduced-motion poses the sun at golden hour with every throw settled to a still cast.
