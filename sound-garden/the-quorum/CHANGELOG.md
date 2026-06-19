# The Quorum — changelog

A Sound Garden leaf. **Synchrony is not a number you read off a chart — it is the
instant a smear of clicks SNAPS into one pulse.** Sixteen clocks tick at their own
speeds, deaf to one another. Twist the one brass knob and they begin to *hear* each
other — the hailstorm pulls itself into a single heartbeat.

## The idea, made touchable & audible (not a plotted curve)

- A ring of **N=16 Kuramoto oscillators** (phase clocks). Each clock i advances at its
  OWN natural speed ωᵢ (a zero-mean Gaussian spread) PLUS a pull toward the others
  scaled by the ONE knob K: `θᵢ ← θᵢ + (ωᵢ + (K/N)·Σⱼ sin(θⱼ−θᵢ))·dt`.
- The order parameter `r = |(1/N)Σ e^{iθ}|` measures how clustered the phases are: r≈0
  is a smear round the circle (incoherent floor ≈ 1/√N), r≈1 is one locked pack.
- **You HEAR it:** every clock ticks (a soft minor-pentatonic click) when its phase
  wraps past 0. At low K the ticks are a *hailstorm*; twist K up and they collapse into
  a *single fat heartbeat* — every click landing at once. The click loudness rides r
  (`vel = 0.35 + 0.65·r`), so the lock is louder as well as tighter.
- **You TOUCH it:** grab a firefly-dot and fling its phase by hand; a "focus a clock"
  control + ←→ + Enter reach the same nudge from the keyboard. The brass **knob** is the
  one lever (drag, or ↑↓/Home/End/PgUp/PgDn). A gold **needle gauge** swings toward live
  r (its floor band drawn from `incoherentFloor(N)`, never re-typed); a green **pack-wedge**
  + **unison ring-flash** are the SEEN mirror of the audio pulse.
- **Two neg-controls you FLIP:** *the clocks are DEAF* (the coupling muted, the ring still
  spinning) — no K can lock it; and *K = 0* (Home / full-twist-down) — every clock alone,
  r parked on the floor. Each lights an inline caption.

## The math claim, proven EXACT (core.mjs + Node twin core.test.mjs)

The Kuramoto physics lives in `core.mjs` (DOM-free, self-contained — NO pitch-core
dependency in the CORE), byte-twinned into the page between the QUORUM CORE sentinels.
The in-page pill and the Node twin call the SAME `runQuorumSelfTest`:

1. **order rises with coupling** — steady-state r over the K-ladder [0,1,2,3,4,6] is
   non-decreasing (within tol 0.05) and climbs from a smear to a lock:
   **[0.268, 0.330, 0.869, 0.957, 0.977, 0.990]**, a rise of **0.722**. (No sharp Kc
   claimed — at N=16 the knee is rounded; only that lock RISES as K climbs.)
2. **the 1/√N floor** — with no coupling r sits under C/√N (C=1.6) at BOTH N=16 (0.268 <
   0.40) and N=64 (0.122 < 0.20): the incoherent floor falls as 1/√N (it halves when N
   quadruples) — a law, not a single point.
3. **negative control K=0** — with the coupling strength zero, r stays on the floor and
   r(0)=0.268 ≪ r(2)=0.869 (gap 0.601): no strength, no lock.
4. **negative control DEAF** — with the coupling muted (clocks deaf, ring still spinning)
   even K=6 leaves r=0.268 on the floor (≈ K=0, |Δ|=0); the SAME K=6 with hearing ON
   locks it (r=0.990). The TEETH: a gap of **0.722** — the lock is the listening, not the
   motion. A piece that locked even when deaf would be faking it.

`node sound-garden/the-quorum/core.test.mjs` → **11/11**, exit 0. The twin runs the four
shared legs, then re-derives the climb + floor + deaf control at a SECOND seed/N (N=32,
seed 0x51E2D; floor across N=16/32/64/128), re-derives that `step` is a pure Euler step
(deaf zeroes ONLY the coupling), and asserts the single-source discipline below.
In-page pill → green **4/4** ("the clocks lock only when they listen ✓").

## Single-source discipline (do-not-re-type)

- The Kuramoto integrator (the `(K/N)·s` coupling pull) lives as live code in EXACTLY one
  file: `sound-garden/the-quorum/core.mjs`. The page holds it only inside the byte-twinned
  QUORUM CORE slice (proven char-for-char identical by the twin); the test builds its
  comparison fragment from parts so it is not itself a hit.
- The Kmax (`3·suggestedKc(16)` ≈ 5.74), the needle floor band (`incoherentFloor(16)` =
  0.25), and the K-ladder are all READ from the CORE — never re-typed literals.
- `semiToFreq` (the per-dot click PITCH) is imported from `../pitch-core.mjs` and used ONLY
  in the page's audio block, OUTSIDE the CORE sentinels — it carries no claim.

## The playback carrier (a uniform rotation — carries no claim)

`makeOmega` is centred to exactly zero mean (so the self-test's locked cluster does not
drift). But a pack locked at the zero mean would *freeze* and never tick. So the live page
and the offline render add a common **CARRIER drift** (2.2 rad/s ≈ a 0.35 Hz heartbeat) to
every clock before integrating — a rigid rotation of the whole ring. It leaves
`r = |Σe^{iθ}|/N` exactly unchanged (verified: rEnd identical with/without it), so it
carries no claim and lives OUTSIDE the CORE; it only makes the locked pack ADVANCE so you
can hear the heartbeat instead of silence.

## Ear-check (audio-lens) — `verify.sh`

Offline-rendered WAVs (the SAME `step()` law, the SAME click voice, summed to mono) at
low K vs high K vs deaf-high-K, read back by the audio-lens skill (which cannot hear):

- **onset count** — low K = **36** scattered clicks → high K = **7** (the hailstorm
  collapses into a handful of unison heartbeats, a ~5× reduction) → deaf high-K = **36**
  again (the control: muting the coupling keeps it a hailstorm, mirroring r(deaf)≈r(0)).
- **--clips false** at high K — the DynamicsCompressor (−12/12/3ms/250ms) fattens the
  16-click unison pulse instead of clipping it.
- **spectrograms** — `spec-lo.png` is a dense mist of scattered vertical click-streaks at
  varied pitches; `spec-hi.png` is a few clean bright columns (16 clocks firing as one).

This is the AUDIBLE twin of the math's r(low) ≪ r(high). (IOI-CV is NOT used: at high K the
onsets are bursty — tight within a beat, wide between — so onset COUNT is the robust signal,
not interval regularity.) `bash verify.sh <lo.wav> <hi.wav> <de.wav>` → PASS.

## Files

- `core.mjs` — DOM-free QUORUM CORE: mulberry32 / makeOmega (zero-mean) / initTheta /
  orderParam / step (the Kuramoto integrator; deaf zeroes only coupling) / steadyR /
  incoherentFloor / suggestedKc / K_LADDER + runQuorumSelfTest.
- `core.test.mjs` — Node twin: the shared self-test + deeper re-derivations at a second
  seed/N + the pure-Euler-step re-derivation + byte-twin parity + single-source grep.
- `index.html` — the played ring: 16 touchable firefly-clocks, the brass coupling knob,
  the gold needle gauge, the two diegetic neg-controls, the per-dot click voice, the
  in-page self-test pill, and the `__renderQuorum` offline-WAV hook.
- `verify.sh` — the audio-lens ear-check recipe (onset-count collapse + no-clip + spectrograms).
- `CHANGELOG.md` — this file.

Reached from `sound-garden/index.html`'s "rigorous voices" footer ("↔ The Quorum") and
cross-linked to The Beating Bench · The Comma · Out of Tune · The Monochord. NOT a new
front-door footprint (a garden leaf) — no `ws:seen` breadcrumb.
