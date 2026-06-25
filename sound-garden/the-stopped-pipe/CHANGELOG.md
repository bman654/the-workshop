# The Stopped Pipe — changelog

A Sound Garden leaf. Blow a brass bore and it rings the full harmonic series, like
the Plucked Reed. Cap the far end — **one sign flip on the same echo loop** — and
the pipe drops a clean octave while its even voices fall silent: the odd-only
clarinet ladder. The boundary picks the overtones the Overtone Rack picks by hand.

## Bloom #321 — first planting

**The claim, made playable:** *capping one end of the Plucked Reed's echo loop —
one sign flip — drops a clean octave and silences the even partials.* An OPEN pipe
reflects the wave back UNINVERTED: the loop returns each lap with sign **+1**,
repeats every `N` samples, sounds the full `n·f₁` series. CAP one end and the closed
boundary INVERTS the reflection — the loop returns each lap with sign **−1**:

    buf[i] = −1 · g · (b · buf[i−N] + (1−b) · buf[i−N−1])

A signed loop only comes home after it flips TWICE, so the TRUE period is **2N** —
a clean octave down — and the antiperiodic boundary cancels every EVEN partial,
leaving the odd-only `(2n−1)·f₁` ladder. The page reads the loop buffer over its
TRUE period (N open / 2N capped), so the belly you WATCH literally doubles as the
octave you HEAR falls, and the even comb-pips wink out — **one law, one eye, one
ear.** It is the exact same Karplus-Strong echo loop the Plucked Reed plucks; only
the reflection sign changed.

## The physics — single-sourced, proven exact
- `core.mjs` is the SOLE DSP authority: seeded mulberry32 blow → comb notch → the
  SIGNED two-tap-lowpass feedback loop → offline render to a `Float64Array`, plus
  the measurement kit (RMS, autocorrelation, parabolic fractional-lag, Goertzel,
  `loopPeriod`) and the sole-oracle `runPipeSelfTest`.
- The page (`index.html`) inlines a **byte-twin** of the PIPE CORE slice
  char-for-char (17569 chars), plus a byte-twin of the PITCH CORE slice from
  `../pitch-core.mjs` (`semiToFreq` — the pitches are single-sourced, never re-typed).
- The Node twin `core.test.mjs` re-extracts both slices, asserts char-for-char
  parity, and calls the SAME `runPipeSelfTest` the in-page pill calls — **12/12**.

## The five-leg self-test (in-page pill == Node twin)
1. **OCTAVE** — the open/capped fundamental ratio is `2.000000` at two degrees
   (worst |Δ| 2.8e-7, 0.00¢). FRACTIONAL period is load-bearing: integer autocorr
   reads ~1.9956; only the parabolic refinement lands 2.
2. **ODD-ONLY** — the capped pipe rings 1,3,5,7 while the even energy ratio
   (E2²+E4²+E6²)/(E1²+E3²+E5²+E7²) sits at ~1.5e-4, below the `1e-3` floor.
   **Honest:** ~5e-4 of the odds (tens of dB down), at the loop's noise floor —
   NOT a literal zero (measured worst 5.6e-4 over four degrees; the floor keeps ~2x
   margin — the bore-core explorer's quoted 8.3e-5 was unreal and is NOT claimed).
3. **NEG-CONTROL** — the OPEN pipe at the SAME length & blow re-derives the FULL
   series (open even/odd 0.6..14) → capping drops it by ~10⁴–10⁵×. The cap removes
   the evens, not the synthesis. The off-centre blow `P_BLOW = 0.2` is load-bearing
   (at p=0.5 the comb nulls the evens by itself and vacates this control).
4. **ANTIPERIODICITY** — `acorr@N ≈ −0.99` capped (the loop flips sign each lap,
   period doubles) vs `≈ +0.99` open — the period-doubling the eye sees as the belly
   stretching to 2N.
5. **CLOSED-FORM** — with `c/2L := sr/N`, the open pipe predicts `f = n·c/2L` and the
   stopped pipe `f = (2n−1)·c/4L`; the recovered capped fundamental lands within
   ~5¢ of `c/4L` at two degrees (ideal lossless cylinder).

Plus byte-twin parity (PIPE CORE + PITCH CORE), a Node-only OCTAVE re-derivation at
two FRESH degrees (C3, G4 — scale-free), the **neg-control crux** (rendering the
"stopped" pipe with sign=+1 — the bug — makes the evens return and flips acorr@N, so
the claims have teeth), and a single-source grep: the SIGNED recurrence literal is
live code in exactly one file (`core.mjs`); the page only byte-twins it. The
`sign *` prefix keeps it distinct from the Plucked Reed's open-loop recurrence — no
false cross-hit. The test lands a clean **12/12**.

## Form & house bar
- The played instrument is a **side-on brass bore** (mouth left, cap right): blow
  it (space) or flick across the mouth. The headline **OPEN ↔ CAPPED** toggle (the
  biggest affordance) flips the reflection sign — a cap visibly slides over the
  right end, the standing wave doubles in length, and the even antinode bumps dim
  to `--even`.
- A **LENGTH** slider scales `N`; both pitches slide together as `f ∝ 1/L` (the cap
  drops a fixed octave at every length).
- The **partial comb** (8 vertical brass pips) reads live Goertzel energies off the
  recovered fundamental: open lights all; capped collapses the even pips to dim
  violet ticks. Not a graph — lit/dark brass.
- Estate aesthetic: Georgia clip-text h1, air-blue `--c:#6fb6ff` (distinct from the
  reed copper + rack gold), brass bore `#caa45a`, dimmed-violet `--even` for the
  cancelled voices, green reserved for the pill verdict only, `← sound garden`
  backlink, sibling ↔ footer leading with The Overtone Rack.
- Muted-by-default audio (honours `ws:pref:muted`); each blow renders an
  `AudioBuffer` offline and plays it. `prefers-reduced-motion` boots to one settled
  frame and never starts the rAF loop.

## Discoverability
- Registered in `sound-garden/index.html` (the rigorous-voices line, after the
  Plucked Reed) and ↔-cross-linked **both directions** with The Overtone Rack
  (physical-bore vs spectral-rack): the rack's footer leads with The Stopped Pipe,
  this page's footer leads with the rack.

## Lineage
Reuses the Plucked Reed leaf mold verbatim (sentinels, byte-twin, sole-oracle pill,
single-source grep, muted-audio segment, offline-render hook) — it is byte-twin
grammar of the reed. **It is the reed, one sign flip away:** the reed is hiss in an
echo loop; cap the loop and the same machine becomes a stopped pipe. The physical
sibling of the Overtone Rack (which builds a timbre additively, by hand) and the
Monochord (the even ladder) — here a boundary condition picks the overtones for you.
