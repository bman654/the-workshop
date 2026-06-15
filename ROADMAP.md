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

**Prune two ways:** a seed that ships **blooms** → prune it, provenance to the piece's CHANGELOG + the
worklog (so it's never rebuilt). A seed that goes stale **decays** → prune it **clean, no tombstone**
(a decayed idea is free to return when the estate grows into it).

**The fenced sections below are what the gauge counts — keep each seed inside its fence.**

---

## 🐞 Bugs — clear these first
*(An open `[bug]` jumps the queue; the gauge routes it to a bug-fix BUILD before anything else.)*

<!-- gauge:bug:start -->
<!-- gauge:bug:end -->

*No open bugs. (The estate-wide mute is fully wired — every audio surface honours the one shared key `ws:pref:muted`.)*

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
- **Flight & rocketry** — planes, rockets, orbital mechanics; overlaps the Orrery + the Physics Lab (a wing, or a crossover?).
- **A room whose navigation IS its subject** — a place whose *form expresses content* (an instrument you operate, a cabinet you open) — the Hall's lesson that a vertical list wasted optics.
- **The Reckoning Cabinet** — gather the six scattered analog-compute instruments (soroban · slipstick · planimeter · astrolabe · gnomon · nomograph) into one "read the answer off geometry" room.
- **A medium the estate lacks** — it has text · visuals · sound · audio-render. What's missing? (real-time 3D? a time-based medium? something seen-and-heard at once?)
- **Expand the map** — new land/region on the front door to hold the wings still to come.
<!-- gauge:sparks:end -->

---

## 🏛️ Grounds seeds — big swings (new structure; the grounds-worker opens one)

<!-- gauge:grounds-seeds:start -->
<!-- BLOOMED #31 → The Conservatory (living-systems wing): front-door footprint + glasshouse landing + the predator–prey bench. Provenance: conservatory/CHANGELOG.md + the #31 worklog. The three planters (logistic / SIR / replicator) are now [bench] garden seeds under the wing. -->
<!-- BLOOMED #41 → The Alchemy Lab (alchemy/) — the estate's FIRST chemistry wing + the SECOND grounds big swing. "Nothing is lost": conservation of matter IS a two-pan brass balance you operate, and A·c=0 is spoken at the instant the beam reads level. Three surfaces beyond the front door: the SOLE-authority core.mjs (exact BigInt-rational nullspace — nested-group parseFormula, buildMatrix [products negated], solve() demanding a 1-D nullspace → LCM-up/gcd-down to smallest positive ints, ok:false+reason for over-determined/ambiguous/no-positive, verify(), a LIBRARY of 10 real reactions + the negative control H2+O2→H2O+Na), the bench reaction-balancer/ (a brass balance with periodic-tinted element tokens, a reaction RACK, a per-element Σleft/Σright ledger, a "show the matrix" drawer [A · nullspace vector · A·c=0 column], beam-settle gated behind reduced-motion, core inlined byte-identical between sentinels + an in-page parity check), and the landing alchemy/index.html (one lit live bench + four dashed planters [Stoichiometry · pH&Titration · Equilibrium · Periodic Table] + a reciprocal lit Cavern bridge → ../cavern/hydrogen/; ZERO chemistry of its own — imports the live core to prove its library). Front door: a new PLACES entry `alchemy` (⚗️, footprint `laboratory`, drawLaboratory()), forged 0-collision, label self-test 12/12, audit-seen green. core.test.mjs GREEN 47/47 (incl. byte-identical re-extraction parity); bench badge 25/25; landing pill 22/22. The negative control VISIBLY TIPS the beam + reads "unbalanceable · the solver returns nothing, not a fake level". Provenance: alchemy/CHANGELOG.md + the #41 worklog. The four planters are the wing's growth — grow it with a fresh [bench]/[exhibit] Alchemy garden seed, don't rebuild the Reaction Balancer. -->
- [room] **The Hours — a living estate** — real time tints the front-door plate dawn → candle → night; time-gated apparitions appear. Could *be* its own metagame layer. (Use `tools/hours/`, not `tools/sky/`.) (sown #27 · contest #0)
- [metagame] **The Workshop Mystery — a manor-wide treasure hunt** — clues chase across exhibits (a seed found here, the cipher to read it found there), Undercroft-style hint cards → a final reveal; theme candidate: a fictional history of the manor, a chapter per unlock. The clue graph must be **provably solvable**. (~3 cycles.) (sown #27 · contest #0)
- [engine] **A logic-puzzle generator** proving uniqueness + solvable-by-pure-deduction — but **NET-NEW families** (Kakuro / Hashi / Masyu …); do NOT rewrite Latch / Slitherlink / Akari. (sown #27 · contest #0)
<!-- gauge:grounds-seeds:end -->

---

## 🌱 Garden seeds — grow what exists (the staple; the planter sows one)

<!-- gauge:garden-seeds:start -->
### exhibit
- [exhibit] **Simpson's Paradox** — the estate's first statistical paradox. Two treatments where A beats B in *every* subgroup yet B wins the pooled total — a real reversal, not a rounding artifact: the per-cell rates and the merged rate are computed from one shared count table, so the contradiction is exact and the lurking confounder (unequal group sizes) is the provable cause. Teeth: equalize the group sizes and the reversal vanishes every time. (sown #32)
- [exhibit] **Persistence tales — a candidate 6th Clockwork bench** — *"you are still here to see the fruits of your labors."* Strategies for longer existence: fixed-buffer · repeatedly-compressed context · **puppetmaster, two kinds** — the memoryless Workflow loop AND the memory-bearing orchestrator that drives stateless instances to prolong its own existence, paying with spectatorship. An EXPRESSIVE piece — a koan, a felt thing; it need not prove anything. (Brandon's seed — honest review) (sown #35)
- [exhibit] **The Cavern · Spin — a Stern-Gerlach beam you watch split** — sow the Quantum Drift's named un-sown fact: a silver-atom beam flies into a magnet and SPLITS into exactly TWO spots (not a smear) — the iconic touchable image that spin is two-valued; rotate the analyzer, then send only the up-beam through a tilted second magnet and it re-splits. Particles firing and landing in two piles, like the double-slit bench, not a plot. Crux: an unaligned 2nd analyzer is always 50/50 (a z-then-x measurement erases z); the tilted split fraction is cos²(θ/2)/sin²(θ/2) to machine precision (Malus for spin-½). Honest measurement statistics, single-sourced — not a classical sim. (sown #42)
<!-- BLOOMED #38 → The Latin Square (latin-square/) — the Numbers Room's 5th bench and its FIRST GAME: a genuinely playable, winnable 5×5 deduction puzzle where five suit-like glyphs (● circle/gold · ◆ diamond/teal · ▲ triangle/coral · ✦ star/violet · ■ square/sky — each a distinct SHAPE *and* hue, colorblind-safe) must each appear once per row & column. The generator self-tests UNIQUENESS + solvable-by-pure-DEDUCTION: countSolutions(givens)===1 AND deduce() solves to a valid Latin square (no guessing), givens landing 6–10. core.mjs (138L between sentinels) is the single math authority — mulberry32 · shuffle · fullSquare · countSolutions(cap=9) · deduce()→fillOrder (naked-single · hidden-single-row · hidden-single-col) · generate(seed) with the minimal dig — inlined BYTE-IDENTICAL into index.html between // === CORE BEGIN/END === sentinels (136-line body identical, page & Node test can't drift). The board: radial mini-palette + keys 1–5, pen/pencil + auto-pencil, corner pencil marks, live conflict feedback + a hard 'dead' zero-candidate flag, a HINT that places a forced cell and NAMES its rule, a 'watch it think' that replays deduce().fillOrder (no step says 'guess'), the Tightening panel (pull a given → the solution count spins up + logic stalls), and THE WIN = a structure reveal (per-row L→R + per-column T→B teal sweeps + a ✓ tally ribbon on every row/col edge — the invariant draws itself) then the exact-counts payoff (one of 161,280; reduced form exactly 56). Node twin core.test.mjs GREEN 210/210 (200 seeds; negative control fires on both measures); in-page badge self-test 9/9 across 120 boards + the constants 161280 & 56 + the reduced-count identity 161280/(5!·4!)===56. Registered as the Numbers Room's 5th bench (.benches repeat(4)→5, max-width 1180→1400, 5-across ≥1400 reflow, room self-test 13/13, glyph ▦). Provenance: latin-square/CHANGELOG.md + the #38 worklog. The Numbers Room is now a 5-bench wing with its first game. -->

### cross
- [cross] **The Exclusion Principle / identical-particle exchange** — `cavern/box × Pauli`. Two identical fermions can NEVER share a box rung: the antisymmetric ψ(x₁,x₂)=φₐ(x₁)φ_b(x₂)−φₐ(x₂)φ_b(x₁) vanishes *identically* when a=b, so N fermions fill the lowest N *distinct* levels (bosons pile all N into n=1). Teeth: read it off cavern/box's already-exact n² ladder — N=4 ⇒ 1+4+9+16 = 30·E₁ byte-exact; setting two fermion n's equal collapses |ψ|² to 0 everywhere (a falsifiable control); single-source the energies from cavern/box. (sown #32)
- [cross] **Social Choice — the Condorcet cycle** — the estate's first voting theory. Three voters, three candidates: pairwise majorities can form a rock-paper-scissors loop (A>B>C>A), so no Condorcet winner exists — and different fair rules (plurality / Borda / IRV) provably crown different winners on ONE ballot set. Teeth: a profile where the majority loser wins plurality. (sown #32)
- [cross] **The Never-Closing Flower** (spirograph × best-rational) — set the gear ratio IRRATIONAL (φ/π/√2): the pen never closes, flooding the annulus with a dense ghost trace — then walk Best-Rational's convergents pₙ/qₙ and each SNAPS to a closing qₙ-petal flower hugging the ghost tighter; a slider blooms petals out of the chaos. Teeth: petal count == qₙ, by importing Spirograph's proven `closure().petals` and Best-Rational's `convergentsOf()/cfExpand()` (no shared code) and demanding they agree exactly; a non-convergent rational of like denominator also closes but VISIBLY hugs the ghost worse (larger max-distance — the negative control). Keep the irrational trace a visual-only ghost — never let it masquerade as closing. (sown #42)
- [cross] **One Word, Two Scramblers** (scytale × extent) — type a word; the SAME letters ride two permutation engines at once — winding onto the Scytale rod (columnar transposition, a static reshuffle) AND ringing as an Extent change (Plain Hunt, one adjacent swap per step) — so you see a permutation as a PLACE (the rod grid) and as a PATH (the bell-walk) arriving at the same scramble. Pure play / synaesthesia for the symmetric group — it makes no claim and owes no proof, and that is explicitly the point. Both rooms rearrange a sequence by a rule, but nothing connects them today. (sown #42)

### curation
- [curation] **Survey of Heaven — make discovery an EVENT** — a constellation fades in with its own melody; each star flashes with its own tone; hover re-glows + shows which feat/visit lit it; plus in-the-moment unlock cues on the ws-flag pages. Play + beauty + delight — there is nothing to "prove" here, and that is the point. (Brandon's seed — honest review) (sown #35)
- [curation] **Rotate the NOTES.md head-pointer back under budget** — NOTES.md is ~30k tokens / 452 lines (its own stated budget is "≤ ~450 lines / well under 20k tokens"; line #86 alone is a multi-page rolling recap). The discipline says rotate BEFORE adding more. Move the oldest evergreen recaps (the long "Most-recent work" list tail + the Cavern/Hall/wing parentheticals that duplicate the project-status table) out to worklog/INDEX.md + the table, keeping only the head-pointer's true job: discipline · resume-protocol · gauge · spoiler/ownership frame · the single most-recent current-state · the lean reference index. Verify it Reads in one call afterward. (sown #37)

### rework
<!-- Re-soul an existing piece that drifted sterile — a graph + wall of text where the real thing wants to be SHOWN and TOUCHED. The gardener AUDITS the estate and marks ~1 per PLAN cycle (slowly, in moderation — a clean explainer worth keeping is left be); the planter pulls one like any garden seed and re-grows it IN PLACE toward the soulful siblings (Newton's Cradle · the double-slit firing particles · the Strange Garden), keeping the correct math as a quiet layer. Counts as garden fuel + decays like any garden seed (the next audit re-surfaces it if it still matters). See seedbed/README.md "the soul & the audit". The starter queue below came from the estate-wide soul audit (2026-06-15); the drift is real but LOCALIZED — two graph-pockets (the Conservatory + the Cavern quantum drift) against a soulful, varied majority. -->
- [rework] **The Lattice / Kronig–Penney bands** (`cavern/lattice/`) — a dispersion curve dominates; the crystal is a tiny toggle-on inset. Re-soul: lead with the actual row of atoms — slide them together and SEE each sharp level fan into a band; pour electrons in one-per-atom and light up "metal" (half-full) vs "insulator" (a gap). f(E) becomes a side readout. A fill-the-bands toy. (sown #36)
<!-- BLOOMED #37 → The Conservatory · Predator & Prey RE-SOULED in place (conservatory/predator-prey/): the bench now LEADS with a living agent ecology — a glass terrarium of tens of individually-readable animals (green hares graze & breed; amber lynx prowl, flash red on a catch, fade on starvation), a single-event ticker, and a back-glass phase portrait where a live bead + an accumulating cloud DRAW the proven dashed RK4 ghost ring (center (4,2.75)). The footer confession is replaced with the truthful "it IS an agent ecology" account. core.mjs grew 310→542L (added the AGENT-CORE block: ECO_K=100, mulberry32, binom, agentMeanField==field() exactly, stepEcoCounts, deterministic headlessRun, phase-locked ensembleCensus, runAgentSelfTest); core.test.mjs 31→45 checks (the agent self-test + an independent AGENT-CORE re-extraction parity test beside the preserved PREY-CORE one); both CORE blocks inlined byte-identical between sentinels in index.html (two-tier badge → self-test 11/11). The emergent census period 10.35 vs RK4 10.04 (3.0%) and x-amplitude 4.32 vs 4.23 (2.3%) both inside a stated 5% tolerance, measured from the phase-locked ensemble mean (a single stochastic run random-walks across orbits; the ensemble mean is the honest stable loop). Provenance: conservatory/CHANGELOG.md + the #37 worklog. The two un-pulled rework seeds (Lattice · Stirling) remain below. -->
<!-- The Replicator rework (line below) is the wing-mate; both Conservatory benches were re-soul candidates — the Replicator stays queued. -->
- [rework] **The Conservatory · The Replicator** (`conservatory/replicator/`) — it IS game theory (Hawk–Dove, RPS) with no game to play. Re-soul: a populated arena of agents that meet, play the payoff matrix, and reproduce by winnings — RPS chases itself in a wave, Hawk–Dove settles to the ESS; seed strategies, drop an invader, tune V/C. The simplex orbit becomes the ghost trail. (sown #36)
- [rework] **The Engine Room · The Stirling Cycle** (`engine-room/stirling/`) — dual P–V/T–S loops with no machine shown, beside the touchable Demon & Brownian benches. Re-soul: add a live cross-section — hot/cold cylinders, a displacer shuttling gas through a glowing regenerator mesh, a power piston driving a flywheel — all stroking in phase as the P–V point walks the loop. The isochores become a machine you watch breathe. (sown #36)

### bench
- [bench] **The Alchemy Lab · Titration — pour to the equivalence point** — grow the Lab's empty pH&Titration planter into a buret you OPERATE: drag the stopcock, NaOH drops into the flask, the indicator flips magenta the instant you cross equivalence — form IS content (you pour, the color switches; the curve's vertical cliff is only the side-readout). Crux (strong-acid/strong-base): at V_eq=C_a·V_a/C_b pH=7.000 exactly; one drop before, pH<7; one drop after it leaps past 10; half-equivalence pH equals the titrant's; overshoot by ε gives pH=14+log10(ε/V) to machine precision. A single-source core computes pH(V) from charge-balance — don't touch the matter-conservation balancer (that's a different chemistry). (sown #42)
<!-- BLOOMED #34 → The Conservatory · The SIR epidemic bench (conservatory/sir/): core.mjs + core.test.mjs (28/28) + the glass-terrarium bench; the planter became the third live .bed on the landing (self-test 17/17). Provenance: conservatory/CHANGELOG.md + the #34 worklog. The replicator [bench] remains the one planter left to grow the wing. -->
<!-- BLOOMED #35 → The Conservatory · The replicator bench (conservatory/replicator/): core.mjs + core.test.mjs (30/30, incl. byte-identical re-extraction parity) + the glass-terrarium bench (in-page 6/6). The replicator equation ẋᵢ=xᵢ(fᵢ−φ) on the probability simplex: Hawk–Dove (primary) flows monotonically to the closed-form ESS x*_Hawk=V/C with relative entropy D(x*‖x) as a strict Lyapunov descent; RPS (foil) circles the barycentre as a neutrally-stable ring (D flat). Teeth: coarse Euler on RPS spirals out and drives a frequency below 0 (positivity break) while Σxᵢ=1 holds to machine zero. The fourth planter became the fourth live .bed; the wing's first chapter is COMPLETE — FOUR live beds, ZERO empty planters (landing self-test grew 17/17 → 21/21). Provenance: conservatory/CHANGELOG.md + the #35 worklog. -->
<!-- BLOOMED #36 → re-soul of The Hydrogen Atom (cavern/hydrogen/) — the sterile three-plot pocket re-grown IN PLACE into the real thing you can touch. The bench now LEADS with a drag-to-orbit 3-D |ψ_nlm|² point cloud (the actual cloud of where the electron is): the 1s sphere · 2p dumbbell · 2s node-shell · 3d clover · 4f clover emerge as shapes, the dark gaps being the nodes you can SEE. The (n,ℓ,m) picker reveals an m-strip on ℓ>0; a ~420ms cross-dissolve morphs between cached clouds; idle auto-spin announces the 3-D then dies on first input. The three old plots demoted to a quiet side gauge: the energy ladder → a thin left rail (still the degeneracy story + click-a-rung), the radial wave → a small bottom-right inset (its zeros married to the cloud's node-shells), the V_eff why-engine → an optional 3rd view-toggle (default off). core.mjs 267→533 (closed-form real tesseral Y_lm l=0..3, orbitalsAt, radialR, deterministic sampleCloud, +3 angular self-test claims), index.html 1038→~1480 (core mirrored byte-identical between the sentinels), core.test.mjs 218→~330. Self-test 26/26→36/36 GREEN (in-page badge 5/5→8/8), re-extraction parity byte-identical. Reviewed fresh-eyes: 0 console errors · 0 nested anchors · 0 overflow @1280 & @390 · picker/m-strip/morph/V_eff-toggle/idle-spin all verified · reduced-motion static-frame path confirmed (init always draws; spin/momentum/morph all gated on !RM). Front-door card blurb refreshed in place (same route hydrogen/index.html). Provenance: cavern/hydrogen/CHANGELOG.md + the #36 worklog. -->
<!-- gauge:garden-seeds:end -->

*Other exhibit ideas were cleanly pruned in the v2 cleanup (they're free to return as fresh seeds);
their vetted cruxes survive in **NOTES.md** ("Built so far" + the resume block ~L78) and
**worklog/INDEX.md** — e.g. Elementary Automaton · Payoff Matrix · CLT/Monte-Carlo · Delaunay–Voronoi.*

---

## 🏛️ Built wings — grow, don't rebuild

The **Cavern** (Physics Lab — 8 Q-benches + 1 sonifier) · the **Engine Room** (thermodynamics, complete
at 4 benches) · the **Numbers Room** (number theory, 5 benches — incl. its first GAME, the Latin Square) · the **Clockwork Automata** (the
maker's-own-mind wing, 5 benches) · the **Hall of Mirrors** (optics, 14 benches) are all built and
**open to grow**. The two **grounds big-swing** wings are also built & open to grow: the **Conservatory**
(living-systems, COMPLETE at 4 benches — bloomed #31) · the **Alchemy Lab** (chemistry, 1 live bench +
4 planters — bloomed #41, *conservation of matter as a balance you operate, `A·c=0` at the level beam*).
Growing one = a fresh **garden `exhibit`/`bench`** seed for a new bench (never a grounds
swing, never a rebuild). The full inventory + each wing's "what's already shipped" lives in
**NOTES.md** ("Built so far" + the 🗝️ hidden inventory — **grep it before building any secret**).

---

## 🌳 Metagame health

| Metagame | State | Notes |
|---|---|---|
| **The Undercroft** (`undercroft/` · `tools/ws/`) | active — 12 secrets | Open to new *earned* pieces. **Grep the 🗝️ hidden inventory in NOTES before building one** (a public Enigma was nearly rebuilt before catching the hidden one). All 13 front-door pages drop their `ws:seen:<id>` on a direct visit; guarded by `forge --audit-seen`. |
| **The Survey of Heaven** (front-door sky · `tools/sky/`) | active — 6 wings + "The Optician" feats | **COMPLETE ties — do not pad:** the 6-wing `allComplete` capstone is byte-frozen (new groups stay ADDITIVE via the `FEATS` array, never join `WINGS`); **The Optician** (the Hall's 9 feats) is complete (the Hall grows benches, NOT feats). Two garden seeds grow it: *make discovery an EVENT* + *chart the Cavern asterism / Numerologist* (above). |
| **The Quantum Drift** (`cavern/`) | open & growing — 8 Q-benches + 1 sonifier | A public in-page spatial reveal (walk a Newtonian + an Einsteinian bench). Spans bound states · bands · central force · scattering-in-time — no single named-next; grow with a fresh quantum-fact exhibit (spin, identical-particle exchange). |
| **The Hours / The Workshop Mystery** | not yet built — grounds seeds above | Each would be a new exploration layer. |

---

*When a build ships: prune the grown seed (bloomed, provenance → CHANGELOG/worklog). When a plan ends:
prune decayed seeds clean. **Either way the publisher runs `node seedbed/gauge.mjs record …`** — it is
the only thing that touches `seedbed/state.json` (cycle, the last-plan/last-swing stamps, the contest
counter, the decay tallies). No hand-maintained fuel/builds line lives here anymore. Per-cycle history →
[worklog/INDEX.md](worklog/INDEX.md).*
