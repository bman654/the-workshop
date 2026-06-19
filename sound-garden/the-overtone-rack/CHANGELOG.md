# The Overtone Rack — changelog

A Sound Garden **leaf**: twelve brass faders you play on a single held pitch, a
live sum-waveform witness, and a "pull the fundamental" reveal — the pitch
survives because it lives in the *spacing* of the overtones, not the lowest rung.

## The claim, and how it's proven

> A pitch is the spacing of its overtones. Pull the fundamental's fader to zero
> and the tone keeps its pitch; a tolerance-GCD estimator (and your ear) rebuilds
> the missing fundamental from the surviving rungs. Retune the rack inharmonically
> and the same estimator fails — the failure is the input, not the estimator.

Single math authority: **`core.mjs`** (the `OVERTONE CORE` block).
- The amplitude laws `sawAmp(n)=1/n`, `squareAmp` (odd 1/n) — the only `1/n`
  literal in the repo (single-source grep asserts it).
- `additiveSample` / `waveform` — the ONE additive sum the audio plays *and* the
  witness draws.
- `estimateF0` — a float-safe tolerance-GCD (`floatGcd` = guarded Euclid), the
  sole f₀ oracle; `partialMultiplier` (the one place `n^1.4` lives) feeds both the
  audio retune and the estimator.
- `runRackSelfTest(f0, f0Alt, partialsFn)` — the SOLE four-leg oracle, called by
  BOTH the in-page pill and the Node twin (they cannot diverge).

The harmonic ladder `k·g` is **imported** from `../the-beating-bench/core.mjs`
(`partials`) — never re-typed; the pitch anchor `semiToFreq` from
`../pitch-core.mjs`. The page inlines three byte-twins (PITCH CORE, HARMONIC
LADDER, OVERTONE CORE) char-for-char; `core.test.mjs` re-extracts each slice and
asserts parity.

### The four self-test legs
1. **The amplitude laws** — saw = 1/n every harmonic, square = 1/n odd / 0 even, to the bit.
2. **The sum is the trace** — the additive square sum is +/− across the half-periods and its quarter-point is the Leibniz partial sum → π/4.
3. **The missing fundamental** — `estimateF0` recovers the SAME f₀ with the fundamental present AND removed AND on the odd-only set, at TWO fundamentals.
4. **The negative control** — an inharmonic rack (f₀·n^1.4) makes the SAME estimator return `ok:false`; the matching harmonic rack (f₀·n) succeeds.

## Verification
- **Node twin** (`node core.test.mjs`) — exit 0: the 4 shared legs + deeper
  re-derivations at fresh fundamentals (middle C, G3), the inharmonic boundary
  sweep (s=1.0 ok / s∈{1.2,1.4,1.7} fail), byte-twin parity (×3), and the
  single-source greps (1/n in one file; `estimateF0`/`floatGcd` each in one .mjs;
  the ladder imported, not re-typed). **13/13.**
- **In-page pill** — green at 1280 AND 390, 0 console errors. The pull switch
  leaves the on-page estimator reading the same f₀; the inharmonic switch makes
  it read FAIL.
- **Audio ear-check** (`bash verify.sh`) — renders 3 WAVs from the canonical
  recipe via `window.__renderRack` and has the Audio Lens (which cannot hear)
  confirm: harmonic peaks evenly spaced on the f₀-grid; inharmonic peaks fan
  apart; the pulled tone keeps the grid but has no peak at f₀ itself; no clipping.

## Form & house bar
- The played instrument is twelve **DOM faders** (native a11y: role=slider,
  aria-valuetext with the partial's Hz; keyboard ↑↓/Shift/PageUp-Dn/Home/End).
- Muted-by-default audio (honours `ws:pref:muted`); a continuous sine bank (one
  oscillator per harmonic) glided by `setTargetAtTime` — a held tone, no zipper.
- Estate aesthetic: Georgia clip-text h1, `--brass:#caa45a` faders, the
  Quorum/Bench leaf chrome, `← sound garden` backlink, sibling ↔ footer.

## Lineage
Reuses the-quorum / the-beating-bench leaf mold verbatim (sentinels, byte-twin,
sole-oracle pill, single-source grep, the muted-audio segment, the offline-render
+ encodeWAV ear-check hook).
