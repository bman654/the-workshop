# 🕳️ The Physics Lab — a SEED-fleshing (2026-06-13 `/fun` PLAN session, Opus 4.8)

> **STATUS: SEED FLESHED, NOT BUILT.** This is a *planting*, not a dictation. It fixes the gardener's
> load-bearing calls (a cave WING outside the manor; Newtonian + Einsteinian open sub-wings + a hidden
> Quantum one; every bench self-proves its physics exact) and lays out a **rich candidate menu** with
> exact self-tests — but the final bench *selection* and the detailed HOW are the future builder's to
> make. Pull what calls to you; the bed is a floor, not a ceiling. Nothing here is committed; no
> exhibit is built. The head-pointer remains NOTES.md.

---

## 1 · Concept + name + the form move

The estate already has one front-door WING that lets form express content: **the Hall of Mirrors**, a
luminous gallery on the *west grounds* that gathers all the light benches. The Physics Lab is its
sibling bet — but where the Hall is *bright and civilised*, this one is **dangerous**, so the
gardener's call is to put it **OUTSIDE the manor, in a cave cut into the grounds** — "for safety,"
the dangerous physics quarantined underground. That's a deliberate **form-expresses-content move at
the MAP level**: not a room inside the house, but a **new cave footprint off the estate**, reached by
a path that leaves the manor and ducks into the hillside.

**Name candidates** (builder's pick — each carries a slightly different mood):
- **The Cavern** — plainest, reads instantly as "the cave wing." Pairs with a `cavern/index.html`.
- **The Grotto** — softer, more curiosity-cabinet; a little romantic for "dangerous," but pretty.
- **The Laboratory** *(in the cave)* — leans into the *experiment* framing; loses the cave poetry in the name but the footprint still carries it. *Recommended landing: name the wing for the cave (**The Cavern** or **The Grotto**) and let the in-page subtitle say "the estate's physics laboratory, kept underground for safety."*
- Other sparks: **The Deep**, **The Undermount**, **The Quarry**, **The Powder Room** (gunpowder pun — too cute), **The Hollow**.

> A nice resonance to honor, not force: the estate *already* has a "beneath" — **the Undercroft**
> (the hidden cellar under the manor). The Cavern is a **different** underground: a cave *out on the
> grounds*, entered from outside, **not** a secret (it's a front-door WING). Keep them visually and
> tonally distinct — the Undercroft is candlelit cellar masonry; the Cavern is raw rock, bracing
> rods, blast shutters, a "danger" lantern. (And the Cavern will *contain* its own secret — the
> Quantum sub-wing — which is the thematic rhyme with the Undercroft, done right.)

### The map / footprint work (how the wing gets onto the front door)

The front door is `index.src.html` (a data-driven estate plan) → forged to `index.html`. Adding a
front-door room is **one `PLACES` entry + one footprint drawer** — no rebalance, no redesign. The
Hall did exactly this with its `hall` footprint; copy that pattern:

1. **A new footprint drawer** `drawCave(g, r)` in `index.src.html`, registered in the `DRAW` map
   (`{ …, hall:drawHall, cave:drawCave }`). It should *read as a cave on a survey plan*: an irregular
   rock outline (not the manor's clean rectilinear slabs), a mouth opening toward the manor, maybe a
   bracing-timber or rail glyph and a faint inner chamber. Use the same `drawSlab` accent-floor / lit-lip
   vocabulary so it sits in the plan's visual language, then give it its own rough-rock detailing.
2. **One `PLACES` entry** — appended to the array, e.g.:
   ```js
   { id:"physics-lab", room:"The Cavern", piece:"The Cavern", glyph:"🕳️" /* or ⚛️ / 🧲 / ⚙️ */,
     accent:"#9ad0c0" /* a cold mineral teal, distinct from the Hall's #8fd9ff sky-blue */,
     href:"cavern/index.html", tag:"physics wing", companion:null,
     footprint:"cave", x:???, y:???, w:???, h:???, prefer:"???",
     blurb:"…dangerous physics, kept in a cave on the grounds…" },
   ```
3. **Placement** — the Hall sits on the **west grounds** (`x:124, y:430`). Put the Cavern on the
   **far edge** of the *opposite* side or a *lower corner* (e.g. SE/SW grounds, off in the hillside),
   so the two outdoor wings frame the manor instead of crowding. `lx/ly` (label coords) are optional —
   the two-pass `LabelPlacer` solve places labels automatically; just verify **0 overlaps** in the
   browser (DOM-truth) after forge. A **dashed survey path** from the manor's south door already draws
   to each folly; the Cavern should get one too (it's generated from `PLACES`, so likely free).
4. **Forge + verify:** edit `index.src.html` → `node tools/forge/forge.mjs index.src.html` →
   `node tools/forge/forge.mjs --check --all`. Browser-verify on a **served origin** with `?v=N`
   cache-bust (python http.server sends no cache headers).

> See NOTES.md "Editing forge pages" + the `drawHall` / `hall` PLACES entry for the exact mechanics.

### The wing's index page (the cave interior)

Like the Hall, the wing needs a landing page (`cavern/index.html`) that HOMES the benches. The Hall
got a redesign ("The Dispersion") where **form expresses content** — a spectral rail ordering the
benches red→violet. The Cavern deserves the same care, not a plain door-list. **Concept candidates**
(builder's pick — diverge before committing, per DESIGNING.md):
- **Two galleries off a central shaft** — the cave forks: a **Newtonian** drift (warm lamplight,
  brass orreries, pendulums) and an **Einsteinian** drift (cold, deep, starlit). The hidden Quantum
  vein opens at the back once you've walked both.
- **A descent by energy/scale** — benches ordered by the regime they probe (everyday mechanics →
  cosmic gravity → the very small), the page literally descending.
- **A mine-map / survey-plan** of the cave with each bench a chamber. (Rhymes with the front-door
  map; risk = feels derivative of the manor plan — diverge if so.)
- It MUST drop `ws:seen:physics-lab` (front-door breadcrumb — the Survey's only food; the one hard
  rule). Topbar: `← WORKSHOP`. Each bench links back to the Cavern + `← WORKSHOP`.

---

## 2 · The candidate-bench menu

**The bar (non-negotiable, from DESIGNING.md + the Hall's house rules):** every bench is ONE
self-contained vanilla HTML file — no deps, no network, no build — interactive, dark-gilt aesthetic,
with a built-in **self-test chip** ("checking…" → "N/N ✓") that **proves the physics EXACT**: to
~machine precision where there's a closed form, or **honest bounded convergence / a conserved
quantity** where it's numerical. *The self-test is the soul; a bench without a crisp falsifiable proof
doesn't belong.* The "Self-test" column below is the most important one.

**Net-new guard:** all candidates are checked against what already exists (§ "Existing physics" at the
bottom). The Garden's `n-body`, `double-pendulum`, `magnetic-pendulum`, `lorenz`, `strange-attractors`
are **watch-only ambient** systems; every bench here must be **interactive + self-proving** to earn its
place beside them.

### 2a · Newtonian sub-wing (open) — aim ~4

| # | Bench (id) | Phenomenon | What the visitor does | **EXACT self-test (the soul)** |
|---|---|---|---|---|
| N1 | **Newton's Cradle** (`cradle`) ⚙️ | Elastic collision; conservation of *p* and *KE* | Lift n balls, release; watch the click-clack; vary ball count, masses, restitution | **Conserves momentum AND kinetic energy to ~1e-12** in the elastic limit (e=1); the n-ball pairwise-elastic solution reproduces the textbook "lift k, k swing out" result exactly; with e<1 KE strictly *decreases* monotonically (honest dissipation). Assert both invariants every frame. |
| N2 | **The Three-Body Choreography** (`three-body`) ♾️ | Gravitational n-body; symplectic integration | Place/drag masses & velocities, run; load famous solutions (the **figure-8**, Lagrange triangle, Euler collinear) | **Energy E and total angular momentum L conserved by a symplectic (leapfrog/Yoshida) integrator** — bounded drift over a long run, NOT secular blow-up (assert |ΔE/E| < tol over N orbits). **Reproduces the Chenciner–Montgomery figure-8** (the three masses chase one curve; period & the known initial conditions match to plotting precision). Differentiates from the Garden's watch-only `n-body` by being *steerable + invariant-proven + choreography-loading*. |
| N3 | **The Brachistochrone** (`brachistochrone`) 🛝 | Calculus of variations; the fastest descent is a cycloid | Draw any track between two points; race a bead down yours vs the cycloid vs the straight line; "find the fastest" challenge | **The cycloid beats every other curve** — numerically integrate descent time T=∫ds/v with v=√(2g·drop) along each track; the cycloid's T matches the **closed form T=π√(r/g)** to ~1e-9 and is provably ≤ all sampled alternatives. Bonus: **tautochrone** — release the bead from *any* height on the cycloid and it reaches bottom in the *same* time (assert equal T across release points). |
| N4 | **The Spinning Top / Gyroscope** (`gyroscope`) 🌀 | Rigid-body precession & nutation; Euler's equations | Spin a top, tilt it, change spin rate / mass / gravity; watch steady precession and the nutation wobble | **Steady precession rate Ω = mgr/(Iω) closed-form** matched to ~1e-9; **angular momentum L and energy conserved** under torque-free motion (the intermediate-axis "tennis-racket"/Dzhanibekov flip emerges from Euler's equations, not scripted). Honest: full nutation is numerical → assert conserved quantities + the slow-precession closed form in its valid regime. |
| N5 | **Kepler's Orrery-Bench** (`kepler`) 🪐 | The two-body laws as *laws*, not data | Drag a planet's a, e; sweep area; watch the orbit close | **Kepler's three laws proven**: equal areas in equal times (dA/dt const to ~1e-12 via the vis-viva/angular-momentum integral); the orbit is a *closed* ellipse (perihelion precession = 0 in pure 1/r²); **T²∝a³** across bodies. ⚠️ *Possible duplication risk with the Orrery* (which is the *real* solar system from JPL elements) — differentiate by making this the **abstract law-prover** (arbitrary a,e; the *why*), or DROP in favour of N2/N3. Builder's call. |
| N6 *(spark)* | **The Trebuchet / Projectile Range** (`ballistics`) 🏹 | Projectile motion; optimal launch angle | Aim & fire; with/without air drag; "hit the target" | **Vacuum range R=v²sin2θ/g closed-form** to ~1e-9; **max range at exactly 45°** found numerically lands on 45.00°; with linear drag the optimum shifts *below* 45° (assert the direction). A clean, friendly first bench but lower-wow than N1–N4. |

### 2b · Einsteinian sub-wing (open) — aim ~4

| # | Bench (id) | Phenomenon | What the visitor does | **EXACT self-test (the soul)** |
|---|---|---|---|---|
| E1 | **The Light Clock** (`light-clock`) ⏱️ | Special relativity: time dilation & length contraction | Drag a velocity slider toward *c*; watch a bouncing-photon clock slow; ladder-and-barn / twin-paradox panels | **The Lorentz factor γ=1/√(1−β²) derived from the bouncing-light-clock geometry** (Pythagoras on the photon's slanted path) matches the closed form to ~1e-12; **the spacetime interval s²=c²t²−x² is invariant** across boosts to machine precision; velocity addition stays ≤ c. The cleanest, most self-contained relativity proof — strong first-build candidate. |
| E2 | **The Black Hole Lens** (`black-hole`) ⚫ | General relativity: photon orbits & gravitational lensing | Drag mass / impact parameter; watch null geodesics bend, the photon ring form, an Einstein ring close | **Schwarzschild landmarks dead-on**: the **photon sphere at r = 1.5 r_s** (= 3GM/c²), the **ISCO at 6GM/c²**, the shadow radius **√27 · GM/c² ≈ 2.6 r_s**; light deflection in the weak field = **4GM/(c²b)** (twice the Newtonian value — assert the factor of 2). Geodesics integrated; assert the closed-form landmarks emerge to tolerance. High-wow, but the hardest to test honestly (numerical geodesics) — anchor it on the **closed-form landmark angles/radii**, not the ray paths. |
| E3 | **Mercury's Precession** (`precession`) ☿ | GR perihelion advance — the original test of GR | Dial in the GR correction term; watch the ellipse's perihelion creep; compare Newton (closed ellipse) vs GR (rosette) | **The relativistic perihelion advance = 6πGM/(c²a(1−e²)) per orbit**, which for Mercury sums to **43″/century** — assert the per-orbit closed form to ~1e-9 and that the century total lands on 43.0″. Newtonian 1/r² gives *exactly zero* precession (the control). One of the crispest GR self-tests in existence — a closed number to hit. **Strong candidate.** |
| E4 | **Stellar Collapse** (`collapse`) ✨ | Degeneracy pressure vs gravity → the fates of stars | Pick a stellar-core mass; watch it settle into a white dwarf, collapse to a neutron star, or run away to a black hole | **The Chandrasekhar limit ≈ 1.44 M☉** falls out of balancing electron-degeneracy pressure against gravity (assert the computed limit lands at 1.44 ± a stated tol from the M∝(ħc/G)^{3/2}/m_p² scaling); the **white-dwarf mass–radius relation R∝M^{−1/3}** holds (heavier ⇒ smaller — assert the sign & exponent); the TOV-ish neutron-star branch has its own max mass. ⚠️ Honest-test flag: the *full* equation of state is research-grade — scope the self-test to the **Chandrasekhar scaling + the mass–radius exponent**, not a full TOV solve. |
| E5 *(spark)* | **The Relativistic Beam / Doppler** (`doppler`) 🚦 | Relativistic Doppler & aberration ("headlight effect") | Fly toward/away from a light source; watch it blueshift/redshift and the sky bunch forward | **Relativistic Doppler f'/f = √((1+β)/(1−β)) closed-form** to ~1e-12; the **transverse Doppler** (pure time-dilation redshift at θ=90°) = 1/γ exactly; aberration angle matches the closed form. A good lighter companion to E1 if a 4th Einsteinian is wanted. |
| E6 *(spark)* | **Gravitational Waves** (`chirp`) 〰️ | Two inspiralling masses → a chirp | Set two masses inspiralling; watch the waveform chirp up in frequency & amplitude to merger | **The Newtonian-inspiral chirp: f ∝ (t_merge − t)^{−3/8}** (assert the −3/8 power law on the frequency sweep); energy radiated matches the quadrupole-formula scaling. Honest flag: full GR waveforms are hard — anchor on the **chirp power-law + the quadrupole P∝(d³Q/dt³)² scaling**, audio optional (it's a real "sound"). |

### 2c · Quantum sub-wing (HIDDEN — unlocked by exploring both open wings) — aim ~3

*These are the dangerous-physics-quarantined-deepest benches: the vein of the cave that only opens
once you've walked both the Newtonian and Einsteinian drifts. See § 3 for the unlock.*

| # | Bench (id) | Phenomenon | What the visitor does | **EXACT self-test (the soul)** |
|---|---|---|---|---|
| Q1 | **The Double Slit** (`double-slit`) 🎯 | Quantum interference; the wavefunction & Born rule | Fire particles one at a time; watch the interference pattern build dot-by-dot; close a slit and it vanishes; "which-path" detector collapses it | **Fringe spacing = λL/d closed-form** to ~1e-9 (matches Ripple's wave self-test — a deliberate cross-wing rhyme); the built histogram converges to **|ψ|² = |ψ₁+ψ₂|²** (a χ²/L² goodness check, like Galton's); closing a slit gives the single-slit envelope; which-path detection destroys the cross-term (visibility → 0). **The flagship quantum bench.** Distinct from Ripple (classical water waves, no quantization / no Born-rule particle build-up). |
| Q2 | **The Particle in a Box / Harmonic Well** (`schrodinger`) 📦 | Quantized energy levels; eigenstates of −ψ″+Vψ=Eψ | Shape a 1-D potential (box → well → double well → harmonic); watch the bound eigenstates & energies snap in; build a wavepacket from them | **Closed-form eigenvalues hit exactly**: infinite square well **Eₙ ∝ n²** (assert ratios 1:4:9:16…); harmonic oscillator **Eₙ = (n+½)ħω** (equal spacing, the ½ zero-point); the numerical eigensolver converges to these to a bounded tolerance. **This is the natural sibling of the Singing Plate** (its first spectral solver) — same eigenproblem machinery, new physics. Strongest-tested quantum bench. |
| Q3 | **Quantum Tunnelling** (`tunnelling`) 🚧 | Barrier penetration — a particle through a wall | Set barrier height & width; fire a wavepacket; watch part transmit through a classically-forbidden wall; sweep energy for resonances | **The transmission coefficient T(E) closed-form** for a rectangular barrier (the sinh²/sin² formula) matched to ~1e-9; **probability conserved: T + R = 1 exactly**; **resonant tunnelling T=1 at the well's resonance energies** (assert the unit-transmission spikes land on the closed-form resonances). Crisp and falsifiable. |
| Q4 *(spark)* | **The Bloch Sphere / Qubit** (`qubit`) 🔮 | A single qubit; superposition & unitary gates | Apply X/Y/Z/H/phase gates; watch the state vector rotate on the Bloch sphere; build & measure | **Gates are exactly unitary (U†U = I to ~1e-12); the Hadamard squares to identity (H²=I); a measured qubit collapses with Born probabilities** that converge over many shots (χ² check). Clean linear-algebra self-test, lower visual drama than Q1–Q3 — a good 4th if wanted. |
| Q5 *(spark)* | **Blackbody / The Ultraviolet Catastrophe** (`blackbody`) 🔥 | Where quantum mechanics was *born* | Heat a cavity; watch the Rayleigh–Jeans curve diverge while Planck's curve peaks & falls | **Planck's law integrates to the Stefan–Boltzmann σT⁴** (assert the integral hits σ to ~1e-6) and **peaks at Wien's λ_max·T = 2.898×10⁻³ m·K**; Rayleigh–Jeans matches Planck at long λ but diverges (the catastrophe, shown honestly). A lovely *historical* opener to the hidden wing — the moment classical physics broke. |

> **Net-new note on the hidden wing:** none of Q1–Q5 duplicate anything built. Q1 deliberately *rhymes
> with* Ripple's λL/d test but is quantum (Born-rule one-particle-at-a-time), Q2 *reuses the Singing
> Plate's eigensolver idea* on a new operator. Both are good "the estate teaching itself" crossings,
> not duplications.

---

## 3 · The hidden Quantum sub-wing — the unlock

This ties into the estate's `ws:` breadcrumb / SECRETS metagame (see UNLOCK.md + `tools/ws/ws.js`'s
`WS.SECRETS` table + the Undercroft as the reader/aggregator). The proven pattern for a "explore both
halves" unlock is already in use (e.g. `quickening` = saw Game-of-Life **and** Lattice; `codex` = saw
verse **and** scriptorium). The Quantum wing copies it.

### The breadcrumbs
Every Newtonian and Einsteinian bench drops its own `ws:seen:<id>` on load (the one hard plumbing
rule). So the store will hold `ws:seen:cradle`, `ws:seen:three-body`, …, `ws:seen:light-clock`,
`ws:seen:black-hole`, … as the visitor wanders.

### The predicate (proposed — builder finalises the exact ids once benches are chosen)
"**Walked both open drifts**" = seen **≥1 Newtonian bench AND ≥1 Einsteinian bench.** Add to
`WS.SECRETS` in `tools/ws/ws.js`:

```js
{ id: 'quantum-wing', unlocked: function (s) {
    var newtonian   = ['cradle','three-body','brachistochrone','gyroscope']; // the shipped Newtonian ids
    var einsteinian = ['light-clock','black-hole','precession','collapse'];   // the shipped Einsteinian ids
    var sawN = newtonian.some(function(id){ return s.has('ws:seen:' + id); });
    var sawE = einsteinian.some(function(id){ return s.has('ws:seen:' + id); });
    return sawN && sawE;
  } }
```

*Design choice to flag for the gardener:* **≥1 in each** (cheap, encourages crossing the cave) vs **ALL
of each** (a real grind, like `light-mixer`'s all-9-feats). Recommended: **≥1 each** — the wing is big
enough that requiring everything would gate a whole sub-wing behind a marathon. (Could also gate the
*reveal* at ≥1-each and a deeper capstone bench at all-of-each — see below.)

### How the reveal works — two options (builder's pick)
- **Option A — an in-wing locked vein (recommended).** The Quantum benches live *inside* the Cavern's
  index page as a **sealed back-passage** that's visibly *there but barred* until unlocked — a legible
  teaser (a glowing crack in the rock, a "DANGER — quantum" shutter) that the page renders locked, then
  opens once `WS.unlocked('quantum-wing', store)` is true. This keeps the wing self-contained and makes
  the unlock feel *spatial* (you earn your way deeper into the cave). **Honors the "hidden features
  need an on-ramp" lesson** (memory): the locked passage is the legible teaser; visiting both drifts is
  the findable trigger.
- **Option B — an Undercroft-style earned room.** The Quantum wing materialises as Undercroft secrets
  (rich display rows in the Undercroft's `SECRETS` table). This reuses the existing earned-room
  machinery but *scatters* the physics wing across two places (cave + cellar) — tonally muddier.
  **Prefer A** unless the builder wants the Quantum benches to be Undercroft citizens.

Either way: follow the UNLOCK.md "adding a future secret" checklist — drop the breadcrumbs, add the
predicate to `WS.SECRETS` + an assertion to `ws.test.cjs`, add the display row(s), re-run
`node tools/ws/ws.test.cjs` and `forge.mjs --all` (editing the shared `ws.js` restales every inlined
page), and **test the trail on a served origin** (localStorage is origin-keyed; never verify on
`file://`).

> **Optional deeper capstone (sow, don't dictate):** a single hidden *capstone* bench at the very back
> of the Quantum vein — e.g. **"The Measurement"** or a **Bell-inequality** bench — gated behind
> *all* Newtonian + *all* Einsteinian + *all* the open Quantum benches (the `light-mixer` "master
> everything" pattern). The Cavern would then mirror the Hall's structure (a wing whose completion
> earns one last hidden room). Leave this for a later session once the wing exists.

> **Metagame health note (for the gardener):** the estate also has the **Survey of Heaven** (the
> front-door map's constellations) and the **Feats of Light** ribbon. The Cavern *could* feed a new
> constellation ("The Experimenter"? a beaker/atom asterism near the cave) the way the Hall feeds "The
> Optician" — but that's a **consideration, not a mandate** (DESIGNING.md). Decide at build time whether
> a feats-style "do the real thing" challenge (land the figure-8, hit 43″, build the |ψ|² pattern) is
> worth wiring; don't bolt it on reflexively.

---

## 4 · Suggested BUILD ORDER

The estate's proven cadence (the Hall): a lead places the wing's footprint + index scaffold, then a
**fleet of self-verifying deputies** each build ONE bench in its own worktree, browser-verified, before
integration. A first build-session should ship the **cave footprint + a 2–3-bench seed** of the wing,
then later sessions extend it (exactly how the Hall grew from 9 → 12 benches).

**First build-session — the highest delight × cleanest self-test × least duplication:**

1. **The Light Clock** (E1) — *the* cleanest relativity proof (γ from Pythagoras; interval invariance
   to machine precision), fully self-contained, instantly legible, zero duplication. The wing's
   "wow, and it's *exact*" anchor.
2. **Newton's Cradle** (N1) — the friendliest possible Newtonian opener; everyone knows the toy, and
   "conserves p AND KE to 1e-12, dissipates honestly when e<1" is a perfect crisp self-test. Pure
   delight, trivially distinct from anything built.
3. **Mercury's Precession** (E3) **or** **The Double Slit** (Q1):
   - **E3** if you want the Einsteinian drift to land a *famous closed number* early (43″/century is one
     of the great results in physics, and the self-test is a single number to hit) — pairs beautifully
     with E1 to open the Einsteinian side.
   - **Q1** if you'd rather seed the hidden wing's flagship first (it cross-rhymes with Ripple/Galton
     and is the most visually magical), then wire the `quantum-wing` unlock in the same session so the
     metagame ships whole.
   - *Recommendation:* **E3** for build-session #1 (keeps the first ship to the two OPEN wings + a clean
     famous number; defer the hidden-wing plumbing to session #2 so it can be QA'd properly on a served
     origin). Then **Q1 + the unlock** lead build-session #2.

**Stretch / later sessions:** The Three-Body Choreography (N2 — high-wow but the integrator + figure-8
need care), The Black Hole Lens (E2 — flagship visual, but geodesics are the hardest honest test),
Stellar Collapse (E4), Particle-in-a-Box (Q2 — reuse the Singing Plate's eigensolver), Quantum
Tunnelling (Q3), then the spark-tier benches as the wing fills out.

---

## 5 · Open questions / risks (for the gardener to decide later)

1. **Wing name + glyph + accent colour.** The Cavern / The Grotto / The Laboratory? Glyph 🕳️ / ⚛️ / 🧲 /
   ⚙️? A cold mineral accent distinct from the Hall's `#8fd9ff` and the Undercroft's brass `#c9a24a`.
2. **Cave vs Undercroft distinctness.** Two undergrounds now. Keep them tonally separate (raw-rock
   danger-lab vs candlelit cellar) and make sure the front-door map reads them as *different* places
   (one a front-door cave on the grounds, one a hidden cellar stair under the manor).
3. **Footprint placement.** Where on the grounds? (SE/SW corner suggested, to frame the manor opposite
   the Hall.) Verify the `LabelPlacer` keeps **0 overlaps** after forge.
4. **Bench selection.** This menu over-supplies (6 Newtonian, 6 Einsteinian, 5 Quantum candidates) so
   the builder can choose ~4/~4/~3. Which make the cut? Which spark-tier ones get promoted?
5. **Unlock predicate strength.** ≥1-in-each (recommended) vs all-of-each for the Quantum reveal. And:
   in-wing locked vein (Option A, recommended) vs Undercroft rooms (Option B)?
6. **Honest-test flags to respect.** E2 (geodesics), E4 (stellar EOS), E6 (GR waveforms) are the
   hardest to self-test honestly — anchor each on its **closed-form landmark** (photon sphere / ISCO /
   deflection-factor-of-2; Chandrasekhar scaling; chirp −3/8 power law), not on the full numerical
   field, or drop them in favour of the closed-form-clean benches.
7. **Duplication watch — N5 (Kepler).** The Orrery already *is* the real solar system. Keep N5 only as
   the **abstract law-prover** (arbitrary a,e; the *why* behind the laws), or drop it; do NOT rebuild a
   solar system.
8. **Metagame wiring.** Feed a new Survey constellation? A feats-style challenge ribbon? Or leave the
   Cavern metagame-light? (Consideration, not mandate.)
9. **Scope discipline.** This is a GRAND, multi-session wing. Ship the footprint + 2–3 benches first;
   resist building the whole menu in one session. The Hall grew incrementally — so should this.

---

## Appendix · Existing physics already built (the net-new guard)

*Surveyed 2026-06-13. Everything in the menu above is checked distinct from these.*

**Front-door / wings & benches:**
- **`orrery/`** — the *real* Solar System computed from published JPL orbital elements (matched to
  Horizons <0.15°). The real thing; the menu's Kepler bench (N5) must stay an *abstract law-prover* or
  be dropped.
- **The wave-physics trilogy:** **`optics/`** (Caustic — geometric ray optics, Snell to 1e-9),
  **`ripple/`** (wave-interference tank — superposition exact, double-slit fringes λL/d), and
  **`singing-plate/`** (Chladni eigenmodes — the workshop's first spectral eigensolver, square π²(p²+q²)
  & circle Bessel-zero ratios).
- **The whole `hall-of-mirrors/` optics WING** (12 benches): `rainbow/` `halo/` `spyglass/`
  `lighthouse/` `spectroscope/` `polariser/` `iridescence/` `camera-obscura/` `anamorphosis/`
  `kaleidoscope/` `mirror-maze/` + Caustic. **All of light is taken** — the Physics Lab must avoid optics.
- **`galton/`** — the bean machine; binomial / normal / live χ² goodness-of-fit. (The menu reuses this
  *χ²-convergence test idea* for Q1/Q4 distributions, on new physics — not a duplication.)
- **`linkage/`** — the Peaucellier–Lipkin straight-line linkage (exact straight line to ~5e-15);
  kinematics of rigid bars. (The menu's mechanics benches are dynamics, not linkage geometry.)
- **`sundial/` + `astrolabe/`** — real solar/celestial geometry instruments (not dynamics).
- **`harmonograph/`** (Workbench) + **`turing/`** (computation) + the cipher/instrument benches —
  unrelated.

**Strange Garden specimens — WATCH-ONLY ambient systems (the key differentiator):** `n-body.html`,
`double-pendulum.html`, `magnetic-pendulum.html`, `lorenz.html`, `strange-attractors.html`,
`fourier-epicycles.html`, `kuramoto.html`, `cloth.html`, `ripple-tank.html`, `chladni.html` (watch-only,
no eigensolver — see ROADMAP's redundancy-audit seed). **These are ambient toys you watch; they do NOT
self-prove and are NOT interactive instruments.** The Physics Lab's benches are the opposite:
**interactive + self-proving**. The clearest overlaps to consciously differentiate:
- Garden `n-body` (watch a system drift) **vs** menu **N2 Three-Body Choreography** (steer it, load the
  figure-8, prove E & L conserved by a symplectic integrator).
- Garden `double-pendulum`/`magnetic-pendulum` (watch chaos) **vs** the menu's pendulum/top dynamics —
  if a chaos bench is ever wanted, it must add a *conserved-quantity / Lyapunov* self-test the Garden
  versions lack. (No pure-chaos bench is in the recommended set, to stay clear of the Garden.)

*Conclusion: the entire menu is net-new. The one live duplication risk is N5 (Kepler vs Orrery) — flagged
above with a mitigation. Optics is fully owned by the Hall and must be avoided.*
