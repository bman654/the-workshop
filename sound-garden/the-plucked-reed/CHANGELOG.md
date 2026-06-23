# The Plucked Reed — changelog

A Sound Garden leaf. Pluck a single brass reed: a burst of seeded hiss scatters
at the spot you release, then lap by lap self-organizes into a clean damped
pitched standing wave — and dragging DECAY to its floor turns the string back
into the raw hiss it was made of. Karplus-Strong, made touchable.

## Bloom #311 — first planting

**The claim, made playable:** *a plucked string is just hiss trapped in an echo
loop.* The pluck fills a delay line of length `N = round(SR/f)` with **seeded**
white noise (a deterministic PRNG, not `Math.random` — so the render, the visual,
and the neg-control agree bit-for-bit), comb-notched at the pluck point. Then the
loop runs the Karplus-Strong recurrence per sample:

    buf[i] = g·(b·buf[i−N] + (1−b)·buf[i−N−1])

Each lap is exactly `N` samples = one period, so the buffer's local shape **is**
one period of the standing wave. The page reads `buf[head−N … head]` at the live
playhead and draws it as the reed's displacement — **the curve you watch is the
buffer you hear.** Drag DECAY (g) to its floor and the loop opens: no feedback, no
string, only the one-shot hiss — the headline gesture.

## The physics — single-sourced, proven exact
- `core.mjs` is the SOLE DSP authority: seeded mulberry32 noise → comb pluck-filter
  → two-tap-lowpass feedback loop → offline render to a `Float64Array`, plus the
  measurement kit (RMS, autocorrelation, parabolic fractional-lag, Goertzel,
  centroid) and the sole-oracle `runReedSelfTest`.
- The page (`index.html`) inlines a **byte-twin** of the REED CORE slice
  char-for-char, plus a byte-twin of the PITCH CORE slice from `../pitch-core.mjs`
  (`semiToFreq` — the fret-mark Hz are single-sourced, never re-typed).
- The Node twin `core.test.mjs` re-extracts both slices, asserts char-for-char
  parity, and calls the SAME `runReedSelfTest` the in-page pill calls.

## The five-leg self-test (in-page pill == Node twin, 5/5)
1. **PITCH** — the settled-portion autocorrelation period equals the predicted
   `N + (1−b)` (the two-tap filter's sub-sample phase delay), within a few cents
   of `sr/N`, at two scale degrees. An off-by-one tap shifts it a full sample off
   (the Node twin proves this with a deliberately mistuned render).
2. **DECAY** — tail RMS < attack RMS, the per-lap envelope is non-increasing, the
   **fundamental's** per-lap decay (read at f0, where the loop lowpass ≈ unity)
   equals the feedback gain `g` to a fraction of a percent at two g values, and
   `g→1` sustains ~50× longer.
3. **BRIGHTNESS** — the early-third centroid exceeds the late-third (the highs die
   first), and a high harmonic's per-lap decay rises monotonically with `b` (it
   survives longer as the loop filter brightens) while always decaying faster than
   the fundamental.
4. **NEG-CONTROL (playable)** — `g=0` leaves no periodic tail (autocorr at lag N
   ≈ 0) and a silent tail, while the SAME pluck at `g>0` builds a strong periodic
   tail; full vs damped brightness moves the centroid up.
5. **LOOP-FILTER HONESTY** — the two-tap lowpass has DC gain exactly 1 and Nyquist
   gain `|2b−1| ≤ 1` for every `b ∈ [0,1]`: the loop can only REMOVE the hiss's
   highs, never inject a tone. The pitch was carved from noise, not added by a
   hidden oscillator.

Plus byte-twin parity (REED CORE + PITCH CORE) and a single-source grep: the KS
recurrence literal is live code in exactly one file (`core.mjs`); the page only
byte-twins it. The grep matches the FULL recurrence line (assembled from parts in
the test) so it neither self-hits nor false-fails on an incidental sub-fragment —
the test lands a clean **12/12**.

## Audio ear-check (`bash verify.sh`)
Renders three WAVs from the page's `window.__renderReed(N,{g,b,p})` (the SAME KS
recurrence) and has the Audio Lens (which cannot hear) confirm:
- LIVE detected pitch **195.6 Hz ≈ sr/N (196 Hz, G3), −4¢**, and first-half centroid
  > second-half (the highs die first).
- BRIGHT (b=0.95) centroid ≫ LIVE (a brighter loop keeps the highs).
- DEAD (g=0) has **no detected pitch** and a far lower tail RMS — no string, only hiss.
- `--clips false` on all three. Spectrograms show the bright attack and the high
  rails fading from the tail.

## Form & house bar
- The played instrument is a **brass reed canvas**: click-and-drag and release to
  pluck (release-x = pluck position p / the comb notch; release-velocity = flick
  strength). A violet **hiss scatter** bursts at the pluck point, then resolves
  into the copper standing wave at the rate you hear it tune in.
- Two knobs you feel: **DECAY** (g, ≈0.99 plink … ≈0.9999 drone … FLOOR = raw hiss)
  and **BRIGHTNESS** (the two-tap blend b).
- A row of brass **fret-marks** retunes `N = round(sr/f)` live via `semiToFreq` /
  `noteName` (no Hz literal retyped); a note readout names what you played.
- Estate aesthetic: Georgia clip-text h1, copper-amber `--c:#ff9d5c` (distinct from
  the monochord/gamelan brass family), brass reed `#d9a441`, green reserved for the
  pill verdict only, `← sound garden` backlink, sibling ↔ footer.
- Muted-by-default audio (honours `ws:pref:muted`); each pluck renders an
  `AudioBuffer` offline and plays it (no AudioWorklet, no recursion-stability or
  file:// concern). The buffer length is capped so `g→0.9999` can't hitch.

## Lineage
Reuses the-overtone-rack leaf mold verbatim (sentinels, byte-twin, sole-oracle
pill, single-source grep, muted-audio segment, offline-render + WAV ear-check
hook). It is the synthesis sibling of the Overtone Rack (additive) and the Vowel
Throat (subtractive): here a string is **noise filtered in a loop** — the third
way to make a tone.
