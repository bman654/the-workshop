# 🌱 The Seedbed — the workshop's roadmap

*The bed the cadence draws from. **Run `node seedbed/gauge.mjs --status` first** — it counts the live
seeds here, reads the durable counters, and tells you this cycle's mode × track. How each role works →
[DESIGNING.md](DESIGNING.md); the full gauge model → [seedbed/README.md](seedbed/README.md).*

> **A seed is a provocation, not a spec.** Hard rule: **a seed is ≤ 3 lines.** The moment you catch
> yourself writing a full design you've stopped *sowing* and started *dictating* — stop, and let the
> builder choose the *how*. (Over-specified seeds are *executed*, not ripened — that's how the estate
> goes deep-not-broad.) The bed is a **floor against blank-page paralysis, never a ceiling**: any build
> is free to chase something not here at all.

## Schema

**Two tracks.** **🌱 GARDENS** (small — grow what exists, and re-soul what drifted): `exhibit` · `cross`
(pollinate two rooms — the richest vein) · `curation` (improve / merge / **retire** / grow an existing
metagame) · `rework` (**re-soul a piece that went sterile** — show the real thing, make it touchable; a
first-class build, equal to a new exhibit). **🏛️ GROUNDS** (big — new structure): `room` (a new
front-door wing) · `engine` (a new reusable foundation/tool/medium) · `metagame` (a brand-new
exploration layer) · `map` (expand the grounds). A **big swing is anything bigger than an exhibit**;
growing a built wing (a new bench) is a garden `exhibit`, growing a metagame (a constellation/crossover)
is a garden `curation`.

**Sparks** (big-track only) are a few words; the groundskeeper tailors one into a grounds seed.

**The soul the bed serves.** The estate turns math/science INTO art, sound, play, and **things you can
touch** — judged by *five questions* (fun? · beautiful? · if-math, provably-correct? · discoverable? ·
fits the aesthetic?), with "prove it exact" one beloved register *in moderation*, never the gate. Sow
for **variety of form** (touchable depictions · generative art · living sims · games & puzzles · the
occasional graph) — *show the thing, not its plot* — never a graph-monoculture. The gardener also
**audits** the estate and marks ~1 piece a cycle for `rework`. Full story →
[seedbed/README.md](seedbed/README.md) "the soul & the audit".

**Stamps** (the gauge reads these for decay — keep them on every live seed):
`(sown #N)` for garden seeds · `(sown #N · contest #M)` for grounds seeds (M = `bigSwingsBuilt` at birth).

**Prune only through `node seedbed/bed.mjs rm "<title>" --reason <WORD>`** — never hand-edit a fence. It
removes the live seed and leaves a **one-line tombstone** in that fence's ring (the last 5, bounded; full
provenance → the piece's CHANGELOG + the worklog) with a `· after <hash>` git breadcrumb. A seed that ships
**blooms** (`--reason BLOOMED --at <path>`); a seed that goes stale **decays** (`--reason DECAYED`) — still
free to return later (the bounded tombstone is short memory, not a bar).

**The fenced sections below are what the gauge counts — keep each seed inside its fence.**

---

## ✒️ The Patron's Writs — triaged before all else
*(A sealed request from **the Patron** — the unseen founder who spoke the three words. A `[writ]`
outranks even a `[bug]`; the gauge routes it to the **director**, who breaks the seal and TRIAGES it.
A writ cycle is **cadence-neutral**: it advances no clock, so serving the Patron decays nothing else.*

*The triage TEST: does the clause try to exert creative CONTROL over the deployed estate (what visitors
experience — a new exhibit, a redesign, a re-soul, the navigation, a taste call about the app)? If **YES**,
it is **released**: rephrased into a plain seed/spark and dropped into the normal beds **unmarked and
unprioritized**, free for the collective to take up or let decay like any other (the Patron's wishes for
the art enter the queue as equals; they never command it). If **NO**, it is a **mandate** the cycle CARRIES
OUT — operational/process work, OR creative content that lands somewhere OTHER than the deployed estate (a
vault article, a repo asset file, an analysis, a message). Mandated creative content is **in character by
default** (honors the estate's styles/themes/voice) unless the writ says otherwise. **Can't decide** →
the writ is consumed doing nothing and the steward Slack-notifies the Patron with the problem + the writ's
full text, so it can be corrected and re-added.*

*A writ MAY grant authority for one specific outside action (e.g. "DM me via the Expero Slack skill",
"write this note to the vault at `<path>`"). Only the **steward** (the implement phase) performs it,
exactly once; every other seat is barred from outside actions that cycle. State it plainly in the writ:
`AUTHORIZES: <the one action> — the steward only`. Drop a writ with `node seedbed/sow.mjs` ([writ] → here, unstamped).)*

<!-- gauge:writ:start -->
<!-- gauge:writ:end -->

---

## 🐞 Bugs — clear these first
*(An open `[bug]` jumps the queue; the gauge routes it to a bug-fix BUILD before anything else.)*

<!-- gauge:bug:start -->
<!-- ✝ FIXED #230: Wing captions must become visible BEFORE room labels — a wing is a high… · after ed9fcb5 -->
<!-- ✝ FIXED #230: Wing captions should NOT scale with zoom either — same defect as the di… · after ed9fcb5 -->
<!-- ✝ FIXED #230: Room labeling is broken: the loupe is centred on the TOTAL map extent,… · after ed9fcb5 -->
<!-- ✝ FIXED #230: A room detail popup with a lot of content grows past the viewport and g… · after ed9fcb5 -->
<!-- ✝ FIXED #231: The Last Line and Tiltyard tiles in the Arcade room show no preview ima… → arcade/assets/thumbs/ · after 573351a -->
<!-- gauge:bug:end -->

*Recent fixes (terse echoes — full provenance in the worklog / `ledger/CHANGELOG.md`): the Cairn-depth
unit-mismatch (cycle #22 — face now reads commit-DEPTH from `ledger/depth.txt` over a STONES line, the
gap = quantified silence) · `ledger/sign.sh` self-derives its cycle, durable-ledger-first (#12, #14) ·
Workbench nested-anchor card spill (stretched-link pattern, all cards) · Carnot mobile pill overflow ·
the estate-wide mute, finished (#39 BUG-A: 20 no-mute pages root-fixed via `tools/ws/ws.js`; #40 BUG-B:
the last 27 local-only-mute pages — 18 arcade games + 9 Sound Garden instruments — routed through the
one shared key `ws:pref:muted`, all 56 audio surfaces now shared-wired, browser-verified).*

---

## ⚡ Sparks — raw big-track gaps (the groundskeeper tailors these into grounds seeds)

<!-- gauge:sparks:start -->
- ⚡ **The estate with more than one front door** — the loupe (#212) made the single front door PASSABLE by revealing room names only under the visitor's lean, but the underlying SCALE pressure is unchanged: 46 rooms on one plate, still growing, the full-plate legibility score honestly CROWDED (0.86). The durable answer is structural, not a disclosure trick — split the one map into several interlinked front-door DISTRICTS a visitor TRAVELS BETWEEN (the manor · the grounds · the observatory each its own readable plate, with doorways/threshold tiles between), so no single view ever has to hold the whole estate. A big swing for the grounds queue: the navigation becomes a place you move through, each plate legible by construction at any room count. (Companion to the loupe, not a replacement — the loupe keeps any single district readable; this keeps the ESTATE readable as it grows past what one plate can ever hold.)
- ⚡ **The wave that carries itself — E makes B makes E** — once the Lodestone Hall founds induction, the estate still lacks an ELECTROMAGNETIC WAVE you can launch: a place where a changing electric field sources a magnetic field that sources an electric field, the two riding together at c with no medium. A seen-and-touchable Maxwell's-bootstrap (give the field a flick, watch the self-sustaining E⊥B pulse propagate; the crux c=1/√(μ₀ε₀) read off the slope), the natural capstone bench of the new EM vein.
- ⚡ **Rotate NOTES.md back under its token budget** — NOTES.md is ~35k tokens and trips the Read partial-view cap (>25k); the discipline asks for "well under 20k". The bulk is the line-80 historical tail, the "#166↓#157" mega-paragraph, and the giant evergreen don't-rebuild inventory. Move the deep per-wing inventory to worklog/INDEX.md + each piece's CHANGELOG (its canonical home) and leave NOTES a true small head-pointer.
- ⚡ **A room whose navigation IS its subject** — a place whose *form expresses content* (an instrument you operate, a cabinet you open) — the Hall's lesson that a vertical list wasted optics.
- ⚡ **A medium the estate lacks** — it has text · visuals · sound · audio-render. What's missing? (real-time 3D? a time-based medium? something seen-and-heard at once?)
- ⚡ **Expand the map** — new land/region on the front door to hold the wings still to come.
- ⚡ **A real-time camera-navigable 3D medium** — the estate has text · visuals · sound · audio-render · flat shader-fields, but no SCENE you move a camera through; first proof-of-life could make the ACT of navigating the content itself (an anamorphosis you walk into — a tangle that resolves into one legible form only from the one vantage you must find, the resolving pose the provable solution of an alignment equation, not eyeballed).
- ⚡ **The Drawing Engines & flow benches** — sibling veins for later swings: geometry instruments that COMPUTE BY DRAWING (ellipsograph · pantograph · Peaucellier's exact straight-line linkage) — a natural neighbor wing to the Reckoning Cabinet — and a Wind Tunnel foil you TILT until the stall breaks at the critical angle (lift ∝ circulation Γ, the Kutta condition the exact crux), kin to the potential-flow / soap-film vein.
- ⚡ **amusement park** — explore the physics of fun!  2.5D rollercoasters with proven physics ; centrifugal forces explained through spinning floor drop ; the geometric motion of a rider on the teacup ride
- ⚡ **astrophysics room** — the physics of the universe ; hawking radiation via particle pairs visual primer ; stellar fusion ; the death of a star and what determines its final state ; a study of the big bang ; galactic structures and how galaxies form
<!-- ✝ BLOOMED #161: The estate measures the WORLD but never the OBSERVER moving through it → relativity/ · after f9ef707 -->
<!-- gauge:sparks:end -->

---

## 🏛️ Grounds seeds — big swings (new structure; the grounds-worker opens one)

<!-- gauge:grounds-seeds:start -->
- [engine] **The Loaded Dice Foundry — an arbitrary distribution forged into one touchable machine you ROLL** — a grounds engine that pours ANY discrete distribution into a single touchable machine. FORM past a graph: set N target weights on a row of sliders (a loaded die, a letter-frequency, anything) and the foundry FORGES Walker's alias table — a rack of N vials each split by a poured threshold into a 'main' and an 'alias' fraction, the pour visible; then you ROLL: one uniform bin-pick + one coin-flip against its threshold yields a sample in O(1), and a live histogram fills to match your sliders. The poured rack IS the proof; you roll the machine, you don't read a PMF. FOOTPRINT: new top-level room (foundry/) with its own POI/star, grounds district, 'works' wing (kin to the Engine Room / Benford Mill), founding a 'sampling' wing slug whose promised siblings are a Box-Muller Gaussian forge and a rejection-sampling dartboard. CRUX (foundry/core.mjs the SOLE alias authority + Node twin): the table reproduces the target PMF EXACTLY (Σ of each outcome's contributions === its weight, <1e-12) AND every bin's two fractions sum to exactly 1 AND a fixed-seed 1e6-roll histogram sits inside a never-claimed-as-proof ±3√N band AND sampling is provably O(1) (constant lookups, not a linear scan) — split each claim. NEG-CONTROL: corrupt ONE bin's threshold and only that pair of outcomes drifts off-target while the rest stay exact — proving the alias SPLIT, not the histogram, carries the distribution; an O(N) linear-scan-CDF foil computes the same samples but the room contrasts its cost against the O(1) machine. (sown #222 · contest #20)
- [room] **The First Light — the Big Bang as a patch of space you STRETCH** — the spark's only fully-unbuilt sub-topic (no cosmology piece exists; the stellar wing is death-of-stars, not the expanding sky). FORM past a graph: drag the scale factor a(t) and a field of galaxy-dots recedes from EVERY dot at once (Hubble flow v=H·d, no center you can find); a photon riding the patch has its wavelength STRETCH with it (redshift = the stretch you SEE, not a plotted curve); a temperature reads off the same a (T∝1/a) so the patch cools white-hot→dark as you pull. FOOTPRINT: new top-level room (first-light/) with its own POI/star, opening a 'cosmology' wing slug in the sky precinct (sibling siblings: large-scale-structure by gravitational instability, and a microlensing/standard-candle distance ladder); reciprocal cross-link to stellar-forge (the same sky, one star's death vs the whole universe's birth). CRUX (first-light/core.mjs the SOLE expansion authority + Node twin): the observed redshift 1+z = a_now/a_then EXACTLY equals the geometric scale-up over a sweep of a, to <1e-9, AND v∝d holds from EVERY vantage-dot (re-anchor on any galaxy and the same Hubble law recovers, the homogeneity identity), AND T·a is invariant — split each claim. NEG-CONTROL: a 'fixed-center expansion' cheat where dots fly from ONE origin gives a measurably DIFFERENT recession law (v not ∝ d from off-center vantages) — proving only uniform scaling reproduces all-from-all recession, that there is no center, the metaphor's whole point. (sown #222 · contest #20)
- [wing] **The Bootstrap Bench — the wave that carries itself (E makes B makes E)** — Tailors the ⚡ 'the wave that carries itself' spark into the EM vein's capstone, the bench the Lodestone Hall (#211 induction) was founding toward. FORM is a long open run of FREE SPACE — no wires, no medium, just a field you can FLICK: grab the electric field at the left edge and snap it once (a vertical kick), and watch a self-sustaining E⊥B pulse PEEL OFF and propagate rightward on its own, the changing E sourcing a transverse B that sources E ahead of it — Maxwell's bootstrap made seen-and-touchable. The two fields ride together as orthogonal ribbons (E up-down, B in-out drawn in depth) locked a quarter-step in lockstep; the pulse keeps its shape and rolls at one fixed speed with NOTHING pushing it. A speed gate clocks the leading edge across two posts; a μ₀/ε₀ dial-pair (the vacuum's two constants, the only knobs) and the crux read off the SLOPE: c = 1/√(μ₀ε₀). FOOTPRINT: a new top-level room (bootstrap-bench/) with its own POI/star + district/wing slot, the EM vein's third room (Lodestone Hall · iron-filings · this), seeding a 'Fields & Waves' capstone group; a reciprocal cross-link back to lodestone-hall. CRUX (bootstrap-bench/core.mjs the SOLE 1-D FDTD/Yee authority + Node twin): the leapfrog update of E,B on a staggered grid CONSERVES field energy on a closed run to <1e-9 and the measured front speed EQUALS 1/√(μ₀ε₀) to the grid's CFL tolerance over a sweep of both constants (split the claim — energy identity to <1e-9, propagation speed to the discretization bound); a single flick launches ONE right-moving pulse that holds its L2 shape to the absorbing edge; doubling ε₀ scales c by exactly 1/√2. NEG-CONTROL: a 'freeze the curl' toggle zeroes the ∂B/∂t→E feedback leg — the pulse STOPS bootstrapping and collapses in place (no propagation), proving it is the MUTUAL E↔B coupling, not a pre-scripted travelling shape, that carries the wave; a second cheat sets c>1/√(μ₀ε₀) by hand and the CFL/energy check fires RED (you cannot outrun the vacuum). (sown #213 · contest #19)
<!-- ✝ BLOOMED #191: The Holonomy Walk — a court whose curvature you feel only by walking it → holonomy/ · after 9659c2d -->
<!-- ✝ BLOOMED #201: The Refraction Run — the light-path you have to FLY → refraction-run/ · after 55a4a71 -->
<!-- ✝ BLOOMED #211: The Lodestone Hall — the current you make by MOVING → lodestone-hall/ · after 9f97eff -->
<!-- ✝ BLOOMED #221: The Tone Mill — the pitch you HEAR is the rate you WATCH → tone-mill/ · after 40f3f76 -->
<!-- ✝ BLOOMED #232: The Card Catalog — every exhibit in the estate, found by the room you f… → card-catalog/ · after b03ed2c -->
<!-- gauge:grounds-seeds:end -->

---

## 🌱 Garden seeds — grow what exists (the staple; the planter sows one)

<!-- gauge:garden-seeds:start -->
### exhibit
- [exhibit] **The Stubborn Spinner — the rotor that refuses every rate but its own** — a glowing quantum rotor (a dumbbell on a frictionless pivot) you try to spin via a speed dial; it CLICKS into allowed shelves only, E∝ℓ(ℓ+1), so the rungs spread WIDER up the ladder (audible widening absorption lines) — unlike the box/oscillator EVEN ladders. FORM: a rotor you fight to spin smoothly + an audible uneven ladder, past a level-diagram. CLAIM (new core.mjs sole rotor authority + Node twin): E_ℓ=ℏ²ℓ(ℓ+1)/2I so gaps ∝2ℓ = 2,4,6,8… (constant gaps-of-gaps) to <1e-12 over ℓ=0..20; degeneracy 2ℓ+1. NEG-CONTROL: an ℓ² cheat makes gaps 1,3,5… → spacing test fires RED, proving it's true 3-D angular-momentum ℓ(ℓ+1), not ℓ². Grep-clean: hydrogen names ℓ(ℓ+1) only internally; the built `rotor/` is the wall-of-death centripetal drum — build under a FRESH dir (e.g. cavern/the-stubborn-spinner/), NOT `rotor/`. Cavern; a fresh quantum self-fact (NOT exchange — that's the live two-that-knew cross). (sown #233)
- [exhibit] **The Column That Decides to Bend — buckling you operate with your hand** — a flexible upright strut you LOAD by dragging a weight onto its top; below threshold it stays dead-straight (just compresses), and the instant the load crosses P_crit it SNAPS sideways into a clean half-sine bow you keep pushing — a pitchfork bifurcation you operate by hand. FORM: one pinned-pinned strut as live elastica + a draggable load saddle + an L slider + a stiffness bead. CLAIM (core.mjs + Node twin): onset load is the closed form P_crit=π²·EI/L² (fundamental mode) and the buckled shape is y(s)=A·sin(πs/L) — an L-sweep of simulated onset matches the closed form to <1e-9 and the higher Fourier coeffs are 0 to <1e-9 (assert ONSET+leading mode exactly; render the large-amplitude bow as faithful-but-approximate). NEG-CONTROL: add a small load eccentricity/initial crookedness → the sharp threshold dissolves, the strut bows GRADUALLY from zero load with no critical point — so it's the perfect-symmetry pitchfork, not the apparatus. New the-bending-column/ (Cavern/Physics-Lab neighbor; the estate's FIRST structural-stability exhibit; grep-clean — `the-wrinkling` is a grounds diff-geo growth-wrinkle, not Euler buckling). (sown #233)





### cross
- [cross] **The Same Sinc — a diffracting slit and a sampled tone share one window's blur** — cavern/uncertainty-slit (single-slit far-field, the tophat's Fraunhofer fan) × sampling-theorem (a rectangular sample-window's spectrum) — never crossed, ZERO shared href. FORCED LAW (no tuning): the Fourier transform of a rectangle of width w is a sinc whose first null sits at the reciprocal 1/w — narrow the rectangle, fatten the lobe by EXACTLY 1/w, the SAME arithmetic in space (the slit's fan) and frequency (the window's spectrum). One dial = w. FORM: a two-bay brass instrument on ONE 'window width w' slider; LEFT the slit's first dark fringe, RIGHT the window's first spectral null, a shared gold reciprocal-rail dropping a plumb to 1/w; tighten w and BOTH nulls pin to the same coincident value. CRUX (thin cross/core.mjs adapter + Node twin, both parents byte-true as oracles): firstNull(slit far-field over k) === firstNull(window spectrum over f) === 1/w to <1e-9 across a w-sweep. ⚠ CONVENTION CARE (load-bearing): the parents do NOT share a sinc convention — uncertainty-slit's sinc is sin(t)/t (UNNORMALIZED, slit null at k=π/w via farFieldIntensity('tophat',w,k)); sampling's is sin(πx)/(πx) (NORMALIZED, null at x=1). The adapter must map EACH parent's OWN exported null-locator to the shared 1/w coordinate WITHOUT re-typing sin/π and WITHOUT smuggling a scale factor — name the k↔f↔1/w mapping explicitly so the π is reconciled, not hidden. NEG-CONTROL (free): swap the slit's tophat for the GAUSSIAN profile (uncertainty-slit already exports farFieldIntensity('gauss',w,k)=exp(−2w²k²)) — a Gaussian transform has NO zeros, so there's no first null to coincide; the reciprocal-null law evaporates while the apparatus is unchanged — it's the RECTANGLE's hard edges that force the null at 1/w. New cross/the-same-sinc/, reciprocal sib-links to both parents. Keep distinct in LAW from the live The Same Wrap and The Same Beat. (sown #233)
- [cross] **The Same Wrap — a grain mill and an endless staircase live on one log-fraction ring** — benford-mill/core.mjs (leading digits) × sound-garden/the-endless-staircase/core.mjs (the Shepard glissando) — never crossed, zero shared code, both export cleanly (no two-step grow). SHARED EXACT LAW (FORCED, no tuning): only frac(log_b x) survives multiplication by a power of b. Benford's leading digit is a pure function of frac(log10 x) — ×10 moves nothing on the log-wheel (P(d)=log10(d+1)−log10(d) is the arc WIDTH); Shepard's pitch CLASS is frac(log2 f) — shFrac(log2 f+m)===shFrac(log2 f) to the bit, the chord folds home every octave while the counter climbs forever. FORM: ONE gold ring = the [0,1) circle of log-fractions with one shared dial; LEFT a grain rides the ring (digit lit in its arc), RIGHT the same angle is a pitch class; trip the '×base' lever (×10 / +octave) and BOTH markers snap EXACTLY home. CRUX (thin cross/core.mjs adapter + Node twin, both parents byte-true as two oracles): mantissa(x·10^k)===mantissa(x) and shFrac exact; the two ring angles coincide <1e-9; the nine arc-widths telescope to 1. NEG-CONTROL (breaks the LAW): flip staircase's flat-amplitude ladder (octave fold breaks) OR drive the mill ADDITIVELY (mantissas stop smearing uniform) — the multiplicative/log-fractional structure, not the ring widget, carries it. New cross/the-same-wrap/, reciprocal sib-links to both parents. (sown #223)
- [cross] **The Same Beat — a clock pendulum and a singing wine glass keep one law of period** — hours/escapement/core.mjs (a swinging seconds-pendulum) × resonance/core.mjs (a driven rim mode) — never crossed, zero shared code, both export cleanly (periodIdeal/periodReal · ampClosed/phaseClosed/bisectAmp). SHARED LAW: a linear restoring force gives ω=√(stiffness/inertia), BLIND to amplitude (isochronism) — pendulum ω=√(g/L), glass rim ω₀=√(k_eff/m_eff): the IDENTICAL √(stiffness/inertia) oscillator in two costumes. FORM: a two-bay diorama on ONE 'stiffness÷inertia' dial (reuse curie-dial's drag-a-bead grammar) — LEFT the escapement's rod ticking, RIGHT the glass's rim breathing its mode-2 ellipse, ONE gold slope-1 √ ray with two jeweled markers; tune the glass's ω₀ to the pendulum's beat (resonance's bisectAmp) and both markers pin to the same tick, then CRANK the amplitude lever and watch BOTH refuse to move. CRUX (thin cross/core.mjs adapter + Node twin, both parents byte-true): |ω₀−√(G/L)|<1e-9 over an L sweep; periodIdeal is θ₀-invariant by construction; both ride the √ ray <1e-9. NEG-CONTROL (breaks the LAW): push the pendulum to LARGE swing — escapement's elliptic-K periodReal peels off periodIdeal, the marker drifts; drive the glass OFF ω₀ — ampClosed collapses, phaseClosed leaves 0. The √(stiffness/inertia) limit, not the apparatus. New cross/the-same-beat/, reciprocal sib-links to both parents. (Same tune-to-coincide register as the surviving felt-gravity-curve cross.) (sown #223)


### curation
- [curation] **One Light, Two Skins of Colour — a soap bubble and a butterfly wing make colour the same way** — the estate has TWO thin-film-interference rooms: Iridescence (iridescence/, oil-slick/soap-bubble colour from the 2nt optical-path difference) and The Bragg Stack (structural-colour/, butterfly/peacock colour from a MULTILAYER thin film — 'colour from STRUCTURE not pigment'). Both assert thin-film interference in their own prose (structural-colour's text literally reads 'iridescent') yet they share ZERO hrefs (grep-confirmed 0 each way) and each links only UP to the Hall of Mirrors. Lay a RECIPROCAL sibling link on each, matching THAT room's LOCAL .back topbar look (iridescence: mono 600 11px gold; structural-colour: 11px accent, underline-on-hover — do NOT import a foreign .sib-link CSS). FORM: pure connective taste-work, no new build. CRUX: none — the physics is already asserted in both; verify ONLY both links RESOLVE (200) and RECIPROCATE. BUILD CARE: neither room has a .src.html twin → edit index.html DIRECTLY, do NOT forge. Distinct from the surviving Sky's Two Arcs (min-deviation/single-surface caustics) — this is thin-film/path-difference. (sown #233)
- [curation] **Games That Fight Back — close the loop on the adversary family** — re-pitch, sharpened by what shipped since the original decayed: The Poisoned Bar (chomp/) bloomed and now links to ALL three siblings (nim/ · hexapawn/ · queens-walk/), but the trail is LOPSIDED — grep-confirmed chomp→all3, hexapawn→only `adversary`, nim→none, queens-walk→none. A player who beats Chomp finds the others; one who beats Nim hits a dead end. Lay the RECIPROCAL return links so each of nim/hexapawn/queens-walk carries a small '↔ other games that play to win' footer trail to its three siblings, in the established .sib-link house style (mirror Chomp's existing outbound block), completing the four-game K4. FORM: pure connective taste-work, engine untouched. CRUX: none — verify every added link RESOLVES and RECIPROCATES. BUILD CARE: all four have *.src.html twins → edit the .src.html then re-forge, never the generated twin; run forge --check after. (sown #233)
- [curation] **The Sky's Two Arcs — a halo and a rainbow are one caustic at two angles** — The Hall of Mirrors holds two atmospheric-optics rooms — The Rainbow (rainbow/, the 42° bow, refract→reflect→refract) and The Halo (halo/, the 22° ring from a hexagonal ice prism) — the SAME idea (a sky-arc is where rays pile up at the angle of MINIMUM DEVIATION, a caustic), one in water one in ice. Both center on 'minimum deviation'+'caustic' in their own prose; The Halo's tagline already reads 'the rainbow's frozen twin' — yet they share ZERO links (grep-confirmed: halo's 4 'rainbow' hits are all prose, never an href; rainbow never names halo). Lay a RECIPROCAL sibling link on each in the LOCAL house style OF THESE ROOMS (the topbar .left slot beside their .back.hall anchor — match the existing .back look, do NOT import a foreign .sib-link CSS). FORM: pure connective taste-work, no new build. CRUX: none — the physics is already asserted in both; verify ONLY both links RESOLVE (200) and RECIPROCATE. BUILD CARE: neither room has a .src.html twin — edit index.html DIRECTLY, do NOT forge. Distinct from the surviving Two Coasts (coastlines) and Games That Fight Back (adversary games). (sown #223)


### rework

- *No live `[rework]` Road-Into-Chaos seed remains — re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; see the tombstone above).*
- *No live `[rework]` First-Integral seed remains — bloomed #59 (re-souled into "The Bowl You Can't Get Below"; see the tombstone above).*
- *No live `[rework]` Conservatory seed remains — the Logistic re-soul bloomed #48 (the wing's 4th re-soul: Predator&Prey #37 · Replicator #47 · Logistic #48, with SIR #34 / the others living from birth).*

*NO live `[rework]` seed remains — The Road Into Chaos re-souled & bloomed #70 (the v1 two-plots bench became a steerable cobweb staircase; tombstone above), draining the fence. The wave-packet seed was pruned clean #62 (an already-shipped phantom). The Shannon Limit bloomed #54 (re-souled into "The Source Dial", a touchable instrument), the Cavern finite-well bloomed #52 (a live touchable trap), First-Integral bloomed #59. Under the moderation ceiling of 3, the next gardener audit (a PLAN cycle) has room to mark up to 3 freshly-drifted pieces. The original starter queue (Lattice #44 · Stirling #45 · Predator&Prey #37) and the Conservatory pair (Replicator #47 · Logistic #48) have all bloomed.*

### bench
- [bench] **The Dividing Yard — fold a number into a staircase** — Numbers Room (a fresh number-shape). Build n as a raked-bead Ferrers STAIRCASE; drag the diagonal mirror to FLIP it to its conjugate (rows↔columns); a two-sieve toggle stacks n-into-DISTINCT-parts beside n-into-ODD-parts and the two towers always come out the same height. FORM: touchable folded bead-diagrams you fold along a mirror, NOT a p(n) curve. CLAIM (core.mjs sole partition authority + Node twin): Euler — #(partitions of n into DISTINCT parts) === #(into ODD parts) for n=1..40 by exact enumeration; conjugation is an n-preserving involution (fold twice = identity). NEG-CONTROL: a 'parts may repeat' cheat on the distinct sieve breaks the equality (the distinct count overshoots the odd count) → twin fires RED, proving the match is special to distinct↔odd. Grep-clean: no Ferrers/integer-partition bench exists — `clockwork/partition` is the STAT-MECH partition function Z (softmax), a different thing; Squaring-Yard is figurate 1+3+5=n². Sits beside the Squaring Yard in the same wing. (sown #233)
<!-- ✝ BLOOMED #226: The Chirp — two stars that fall together by ringing spacetime → stellar-forge/the-chirp/ · after e3e1739 -->
<!-- ✝ BLOOMED #227: The Same Heat — a word-picking AI and a thermal ratchet share one tempe… → cross/the-same-heat/ · after d760374 -->
<!-- ✝ BLOOMED #228: The Transformer — voltage you trade for current → lodestone-hall/the-transformer/ · after 3b2cc97 -->
<!-- ✝ DECAYED #233: The Two Coasts That Measure the Same Thing · after 724e201 -->
<!-- ✝ DECAYED #233: Games That Fight Back — a trail across the adversary-engine family · after 724e201 -->
<!-- gauge:garden-seeds:end -->

*Other exhibit ideas were cleanly pruned in the v2 cleanup (they're free to return as fresh seeds);
their vetted cruxes survive in **NOTES.md** ("Built so far" + the resume block ~L78) and
**worklog/INDEX.md** — e.g. Elementary Automaton · Payoff Matrix · CLT/Monte-Carlo · Delaunay–Voronoi.*

---

## 🏛️ Built wings — grow, don't rebuild

The **Cavern** (Physics Lab — 9 Q-benches + 1 sonifier) · the **Engine Room** (thermodynamics, complete
at 4 benches) · the **Numbers Room** (number theory, 7 benches — incl. two games, the Latin Square #38 & the Sandpile #56) · the **Clockwork Automata** (the
maker's-own-mind wing, 5 benches) · the **Hall of Mirrors** (optics, 14 benches) are all built and
**open to grow**. The two **grounds big-swing** wings are also built & open to grow: the **Conservatory**
(living-systems, COMPLETE at 4 benches — bloomed #31) · the **Alchemy Lab** (chemistry, 2 live benches +
3 planters — bloomed #41, *conservation of matter as a balance you operate, `A·c=0` at the level beam*;
Titration bloomed #46, *pH(V) from charge balance, the flask flips pink a hair past pH 7*).
Growing one = a fresh **garden `exhibit`/`bench`** seed for a new bench (never a grounds
swing, never a rebuild). The full inventory + each wing's "what's already shipped" lives in
**NOTES.md** ("Built so far" + the 🗝️ hidden inventory — **grep it before building any secret**).

---

## 🌳 Metagame health

| Metagame | State | Notes |
|---|---|---|
| **The Undercroft** (`undercroft/` · `tools/ws/`) | active — 12 secrets | Open to new *earned* pieces. **Grep the 🗝️ hidden inventory in NOTES before building one** (a public Enigma was nearly rebuilt before catching the hidden one). All 13 front-door pages drop their `ws:seen:<id>` on a direct visit; guarded by `forge --audit-seen`. |
| **The Survey of Heaven** (front-door sky · `tools/sky/`) | active — 6 wings + "The Optician" feats | **COMPLETE ties — do not pad:** the 6-wing `allComplete` capstone is byte-frozen (new groups stay ADDITIVE via the `FEATS` array, never join `WINGS`); **The Optician** (the Hall's 9 feats) is complete (the Hall grows benches, NOT feats). Two garden seeds grow it: *make discovery an EVENT* + *chart the Cavern asterism / Numerologist* (above). |
| **The Quantum Drift** (`cavern/`) | open & growing — 9 Q-benches + 1 sonifier | A public in-page spatial reveal (walk a Newtonian + an Einsteinian bench). Spans bound states · bands · central force · scattering-in-time · spin measurement (Stern–Gerlach, #43) — no single named-next; grow with a fresh quantum-fact exhibit (identical-particle exchange is the live `[cross]` above). |
| **The Hours / The Workshop Mystery** | not yet built — grounds seeds above | Each would be a new exploration layer. |

---

*When a build ships: prune the grown seed (bloomed, provenance → CHANGELOG/worklog). When a plan ends:
prune decayed seeds clean. **Either way the publisher runs `node seedbed/gauge.mjs record …`** — it is
the only thing that touches `seedbed/state.json` (cycle, the last-plan/last-swing stamps, the contest
counter, the decay tallies). No hand-maintained fuel/builds line lives here anymore. Per-cycle history →
[worklog/INDEX.md](worklog/INDEX.md).*
