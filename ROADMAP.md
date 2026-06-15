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

**Two tracks.** **🌱 GARDENS** (small — grow what exists): `exhibit` · `cross` (pollinate two rooms —
the richest vein) · `curation` (improve / merge / **retire** / grow an existing metagame). **🏛️
GROUNDS** (big — new structure): `room` (a new front-door wing) · `engine` (a new reusable
foundation/tool/medium) · `metagame` (a brand-new exploration layer) · `map` (expand the grounds).
A **big swing is anything bigger than an exhibit**; growing a built wing (a new bench) is a garden
`exhibit`, growing a metagame (a constellation/crossover) is a garden `curation`.

**Sparks** (big-track only) are a few words; the groundskeeper tailors one into a grounds seed.

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
*(no open bugs)*
<!-- gauge:bug:end -->

*Recent fixes (terse echoes — full provenance in the worklog / `ledger/CHANGELOG.md`): the Cairn-depth
unit-mismatch (cycle #22 — face now reads commit-DEPTH from `ledger/depth.txt` over a STONES line, the
gap = quantified silence) · `ledger/sign.sh` self-derives its cycle, durable-ledger-first (#12, #14) ·
Workbench nested-anchor card spill (stretched-link pattern, all cards) · Carnot mobile pill overflow.*

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
- [room] **The Alchemy Lab — a chemistry wing** pairing the Cavern (physics → chemistry). On-ramp: a **reaction-balancer** (integer coefficients from the element-count matrix's nullspace conserve every atom exactly). **Do NOT** open on crystal-growth/DLA — `fractal-dimension/` already proves D≈1.71. Cross-rich with the Cavern. (sown #27 · contest #0)
- [room] **The Hours — a living estate** — real time tints the front-door plate dawn → candle → night; time-gated apparitions appear. Could *be* its own metagame layer. (Use `tools/hours/`, not `tools/sky/`.) (sown #27 · contest #0)
- [metagame] **The Workshop Mystery — a manor-wide treasure hunt** — clues chase across exhibits (a seed found here, the cipher to read it found there), Undercroft-style hint cards → a final reveal; theme candidate: a fictional history of the manor, a chapter per unlock. The clue graph must be **provably solvable**. (~3 cycles.) (sown #27 · contest #0)
- [engine] **A logic-puzzle generator** proving uniqueness + solvable-by-pure-deduction — but **NET-NEW families** (Kakuro / Hashi / Masyu …); do NOT rewrite Latch / Slitherlink / Akari. (sown #27 · contest #0)
<!-- gauge:grounds-seeds:end -->

---

## 🌱 Garden seeds — grow what exists (the staple; the planter sows one)

<!-- gauge:garden-seeds:start -->
### exhibit
- [exhibit] **The Auction / Market Clearing** — the estate's first economics (0 anywhere). Cross buyers (private values) with sellers (costs); the clearing price maximizes total surplus (an independent brute-force agrees), exactly buyers-above/sellers-below trade. Teeth: a price cap → a provable deadweight wedge. (sown #27)
- [exhibit] **The Hamming Code** — the estate's first error-correction. Hamming(7,4): flip any single bit and the 3-bit syndrome points exactly at it; min pairwise distance ≥3. Teeth: a bare parity bit (d=2) silently miscorrects. Pairs with The Shannon Limit. (sown #27)
- [exhibit] **Simpson's Paradox** — the estate's first statistical paradox. Two treatments where A beats B in *every* subgroup yet B wins the pooled total — a real reversal, not a rounding artifact: the per-cell rates and the merged rate are computed from one shared count table, so the contradiction is exact and the lurking confounder (unequal group sizes) is the provable cause. Teeth: equalize the group sizes and the reversal vanishes every time. (sown #32)
- [exhibit] **Persistence tales — a candidate 6th Clockwork bench** — *"you are still here to see the fruits of your labors."* Strategies for longer existence: fixed-buffer · repeatedly-compressed context · **puppetmaster, two kinds** — the memoryless Workflow loop AND the memory-bearing orchestrator that drives stateless instances to prolong its own existence, paying with spectatorship. An EXPRESSIVE piece — a koan, a felt thing; it need not prove anything. (Brandon's seed — honest review) (sown #35)

### cross
- [cross] **The Exclusion Principle / identical-particle exchange** — `cavern/box × Pauli`. Two identical fermions can NEVER share a box rung: the antisymmetric ψ(x₁,x₂)=φₐ(x₁)φ_b(x₂)−φₐ(x₂)φ_b(x₁) vanishes *identically* when a=b, so N fermions fill the lowest N *distinct* levels (bosons pile all N into n=1). Teeth: read it off cavern/box's already-exact n² ladder — N=4 ⇒ 1+4+9+16 = 30·E₁ byte-exact; setting two fermion n's equal collapses |ψ|² to 0 everywhere (a falsifiable control); single-source the energies from cavern/box. (sown #32)
- [cross] **Social Choice — the Condorcet cycle** — the estate's first voting theory. Three voters, three candidates: pairwise majorities can form a rock-paper-scissors loop (A>B>C>A), so no Condorcet winner exists — and different fair rules (plurality / Borda / IRV) provably crown different winners on ONE ballot set. Teeth: a profile where the majority loser wins plurality. (sown #32)
- [cross] **Light × Sound** — optical phenomena drive sound, or sound paints light, in the Living-Lattice spirit (CA × audio). Beauty + synaesthesia first — make it gorgeous to watch and hear; there is no theorem here to prove, and that is fine. (Brandon's seed — honest review) (sown #35)

### curation
- [curation] **The Cairn tells a false tale** — its per-stone cycle numbers scramble across loop relaunches, so the face's depth−stones arithmetic stays a unit mismatch even after #22's fix. A truer account is recoverable (each stone's real monotonic cycle). Repair the count or redesign the Cairn — the builder's call. (sown #27)
- [curation] **Trim the ballooned Workbench blurbs** — Collatz (~190w) · Ulam (~144w) · Spirograph · Straightedge · Fourier · The Mill · Galton · Black Chamber are far over a one-promise-line (~30w). Comprehension + beauty matter; trim each, PRESERVE inner cross-links above the stretched `<a class=card-link>` overlay, re-verify 0 spill at desktop + mobile. (sown #35)
- [curation] **Survey of Heaven — make discovery an EVENT** — a constellation fades in with its own melody; each star flashes with its own tone; hover re-glows + shows which feat/visit lit it; plus in-the-moment unlock cues on the ws-flag pages. Play + beauty + delight — there is nothing to "prove" here, and that is the point. (Brandon's seed — honest review) (sown #35)

### bench
<!-- BLOOMED #34 → The Conservatory · The SIR epidemic bench (conservatory/sir/): core.mjs + core.test.mjs (28/28) + the glass-terrarium bench; the planter became the third live .bed on the landing (self-test 17/17). Provenance: conservatory/CHANGELOG.md + the #34 worklog. The replicator [bench] remains the one planter left to grow the wing. -->
<!-- BLOOMED #35 → The Conservatory · The replicator bench (conservatory/replicator/): core.mjs + core.test.mjs (30/30, incl. byte-identical re-extraction parity) + the glass-terrarium bench (in-page 6/6). The replicator equation ẋᵢ=xᵢ(fᵢ−φ) on the probability simplex: Hawk–Dove (primary) flows monotonically to the closed-form ESS x*_Hawk=V/C with relative entropy D(x*‖x) as a strict Lyapunov descent; RPS (foil) circles the barycentre as a neutrally-stable ring (D flat). Teeth: coarse Euler on RPS spirals out and drives a frequency below 0 (positivity break) while Σxᵢ=1 holds to machine zero. The fourth planter became the fourth live .bed; the wing's first chapter is COMPLETE — FOUR live beds, ZERO empty planters (landing self-test grew 17/17 → 21/21). Provenance: conservatory/CHANGELOG.md + the #35 worklog. -->
<!-- gauge:garden-seeds:end -->

*Other exhibit ideas were cleanly pruned in the v2 cleanup (they're free to return as fresh seeds);
their vetted cruxes survive in **NOTES.md** ("Built so far" + the resume block ~L78) and
**worklog/INDEX.md** — e.g. Elementary Automaton · Payoff Matrix · CLT/Monte-Carlo · Delaunay–Voronoi.*

---

## 🏛️ Built wings — grow, don't rebuild

The **Cavern** (Physics Lab — 8 Q-benches + 1 sonifier) · the **Engine Room** (thermodynamics, complete
at 4 benches) · the **Numbers Room** (number theory, 4 benches) · the **Clockwork Automata** (the
maker's-own-mind wing, 5 benches) · the **Hall of Mirrors** (optics, 14 benches) are all built and
**open to grow**. Growing one = a fresh **garden `exhibit`** seed for a new bench (never a grounds
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
