# The Pinhole Race — CHANGELOG

*The Engine Room's fifth bench. Two gases at one locked temperature race out through
a single pinhole, and the light one always wins — Graham's law of effusion (1846),
made a thing you punch and watch. The first engine-room bench built on the forge/WS
flow (an `index.src.html` source inlining `tools/ws/ws.js`).*

## v1 — first build (2026-06-20, Opus 4.8 · BUILD/garden cycle #210)

**What it is.** A brass box split by a wall with one tiny **pinhole**, a 50/50 mix of
two gases at **one locked T = 300 K**. Punch the hole and they race out. The
**light** gas (○ pale, hollow, fast) reaches the door faster than the **heavy** gas
(● violet, filled, slow) at the exact ratio

```
r_light / r_heavy  =  √( m_heavy / m_light )      (Graham's law)
```

**not** because it has more energy — at one T both species share the **same** mean
kinetic energy `⟨KE⟩ = 3/2·k_B·T` (equipartition, mass-independent) — but because the
lighter molecules carry that energy in a smaller mass and so simply **move faster**:
`v̄ = √(8·k_B·T/πm)`. Effusion is a flux, `rate ∝ ¼·n·v̄·A`; at equal n, T, A the
ratio collapses to `v̄_l/v̄_h = √(m_h/m_l)`. The door never weighs the gas; it counts
how fast each kind arrives.

**The form (a box you punch, not a rate curve).**
- **The track** (the hero): two tall brass fill-gauges. A **gold prediction tick**
  (`#f0c75a` hairline + diamond) sits on each at its predicted finish — the light tick
  higher — each bracketed by a `±√N` tolerance ribbon. Punch and both gauges climb;
  the light one races ahead and the live ratio settles onto the gold √-tick.
- **The diorama**: real animated discs at one T, **speed-glowed** (firebox ember →
  white-gold) so the eye SEES light streaking bright-fast and heavy lumbering dull at
  the same temperature — equipartition made visible. The discs are cosmetic eye-candy
  that AGREES with the core; the gauges and the headline are driven by the core MC.
- **The panel**: a mass-ratio dial (1..32) with preset stops at famous pairs
  (H₂:O₂, U-235:U-238, He:air); the **⟨KE⟩ warmth lamp** (gold while energies are
  equal); the **RED "same speed, not same energy"** knife-switch; an analog ratio
  dial; and a live-numbers block (v̄, ⟨KE⟩, the closed-form √, the live sim ratio
  ±band, "landed in band ✓").

**The honesty hinge.** The headline ratio is the **exact closed form** derived from
`v̄` through `effusionRate` (`rateRatio()`), never hardcoded. The live race beside it
is a **reduced sampling model** — a flux-weighted Bernoulli thinning of N attempts
(`simulateEscapes()`, the core OWNS this label, NOT a from-first-principles cos-θ
Knudsen integral). It is asked only to land inside its stated `±√N` counting-error
band; a finite sample is never called a proof.

**The negative control (the lie).** The RED switch forces both gases to the same
speed. The ratio collapses to 1 and the gauges climb in lockstep — but each KE is then
read on that one speed basis, so `KE_l/KE_h = m_l/m_h ≠ 1`: equipartition is broken by
**exactly** the mass ratio, and the warmth lamp goes red. Equal speed cannot mean equal
energy.

**Proven correct (self-test, 6 checks, re-run live in the badge).**
1. ★ **EXACT** — `effusionRate`-derived ratio === `rateRatio` === `√(m_h/m_l)` to
   `<1e-9` over the mass dial + the preset pairs (worst rel-err `2.2e-16`).
2. ★ **FIT** — the seeded escape-ratio converges to the closed form within `±3·band`,
   `band = ratio·√(1/cl+1/ch)` (the computed √N counting error); swept over masses and
   seeds (worst `0.96σ` at N=2e6); explicitly never a proof.
3. ★ **EQUIPARTITION** — `⟨KE⟩` equal across species to `<1e-9` (`= 3/2·k_B·T`,
   mass-independent) over the sweep.
4. ★ **MONOTONE** — heavier `m_h` ⇒ larger predicted ratio; `m_l===m_h` ⇒ ratio
   `=== 1` exactly.
5. ★ **NEG-CONTROL** — `sameSpeed` ⇒ ratio `=== 1` AND `equipartition === false` AND
   `|KE_l/KE_h − m_l/m_h| < 1e-9` (the break has the exact mass-ratio magnitude).
6. **LOCKED-INVARIANT** — the ratio depends ONLY on `√(m_h/m_l)`: vary T, A and it is
   unchanged to `<1e-9` (T, A locked across the sweep).

**The 4-file pattern + parity.** `core.mjs` is the sole effusion/Graham authority
(pure, dependency-free, NO cross-wing import — the Cavern M–B link is kin prose, not a
code dep). `core.test.mjs` runs the shared suite at higher N and the re-extraction
parity harness: it slices the inline core from `index.html` between the
`PINHOLE-RACE CORE` sentinels and asserts it is **char-for-char** the export-stripped
`core.mjs` body, plus pass-count and ok-for-ok agreement. `index.html` is built by
forge from `index.src.html`; `window.__pinholeRace` exposes the live ledger as a lens
hook. Node twin: **15/15 ✓** all green.

**Kin cross-links.** Down to `cavern/maxwell-boltzmann` (the gas whose `v̄` decides the
race); reciprocal `↔` links to/from `demon` (the same gas sorted by a watcher, with a
debt) and `brownian` (the same seeded fit measured against a `±√N` band).
