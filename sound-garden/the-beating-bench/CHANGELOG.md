# The Beating Bench — changelog

A Sound Garden leaf. **Consonance is not a number you read off a chart — it is the
place where the beating stops.** A steady drone sounds; you DRAG one tone across it
by hand. The two voices beat; drag toward a just ratio and the throb slows to a dead
stop. The silent islands turn out to be the consonances themselves.

## The idea, made touchable (not a plotted curve)

- A **drone** at f₀ rings harmonic partials at k·f₀; the **dragged tone** rings k·f₀·r.
  You hand-drag the gold tone across one octave on the bench (or the rail, or with ← →).
- Two glowing **sliding traces** show the nearest pair of partials (one from each voice);
  the **sum trace** below is the throb you HEAR, with a dashed beat-envelope swelling at
  the beat rate, and a pulsing dot whose flash period IS the beat period.
- A **rail of lit islands** lays the just intervals across the octave by cents. The
  islands that fall SILENT glow green; the just ratios that never still are dim gold ticks.
- A live **needle / readout** reads the beat rate, the nearest island's name, and the
  cents off it. Slide onto a green island and the beat falls to 0 Hz — glassy still.

## The math claim, proven EXACT (core.mjs + Node twin core.test.mjs)

The beat physics lives in `core.mjs` (DOM-free), byte-twinned into the page between the
BEAT CORE sentinels. The tuning lattice (JUST_SET / cents / foldToOctave) is imported
from `../pitch-core.mjs` and byte-twinned in (COMMA CORE + OUT OF TUNE CORE slices). The
in-page pill and the Node twin call the SAME `runBeatSelfTest`:

1. **needle = |Δf|** — the beat rate === |f_hi − f_lo| of the nearest partial pair, to
   the bit, across the whole octave. What you HEAR is the number the two traces SHOW.
2. **islands of stillness ARE the consonances** — the just ratios that beat EXACTLY 0
   are precisely {unison · m3 · M3 · P4 · P5 · m6 · M6 · octave} (a simple ratio p/q
   reaches a dead stop only when drone-partial p coincides with dragged-partial q
   within the N partials we hear), and EVERY complex just ratio (m2, M2, the tritone,
   m7, M7) keeps a residual throb — **dissonance is the throb that won't die.**
3. **named islands** — at each in-octave just ratio the lit island's name === the
   index-aligned `JUST_NAME` member, single-sourced to pitch-core, never re-typed.
4. **negative control (load-bearing)** — the syntonic-comma-detuned ditone (just M3 ×
   81/80 = 81/64) is NOT a just-set member, so its partials do not coincide: it STILL
   THROBS (≈13.75 Hz at f₀=220). "In tune" cannot be faked by snapping to the nearest
   semitone or by visual proximity — only the true 5/4 reaches silence.
5. **a true dead-stop** — the beat is 0 at the P5 and grows STRICTLY on both sides as
   you drag away; the silence is a real minimum you slow into, not a flat plateau.

## Single-source discipline (do-not-re-type)

- The tuning ratios live as code literals in EXACTLY one file: `sound-garden/pitch-core.mjs`.
- `core.mjs` IMPORTS them; the page only byte-twins three slices (COMMA CORE + OUT OF
  TUNE CORE from pitch-core.mjs, BEAT CORE from core.mjs).
- `core.test.mjs` asserts char-for-char parity of all three slices and that the JUST_SET
  literal appears as code in pitch-core.mjs alone (it builds the comparison string from
  integer parts so the test is not itself a hit).

## Ear-check (audio-lens)

Offline-rendered WAVs (drone + tone, N partials each) at the just P5 vs the comma-detuned
81/64, analyzed with the audio-lens skill: the just P5 reads as a STEADY tone (envelope
modulation depth ≈ 0.16, partials form a clean coinciding stack), while 81/64 reads with
a substantially deeper amplitude swell (≈ 0.31, ~2× the modulation) — an audible beat.
The visual stillness is corroborated by the actual sound.

## Self-test

`node sound-garden/the-beating-bench/core.test.mjs` → **14/14**, exit 0.
In-page pill → green **5/5** ("the throb dies only at true ratios ✓").

## Files

- `core.mjs` — DOM-free BEAT CORE: beatRate / nearestPair / silentZoneIndices /
  nearestStillZone / stillZones + the syntonic-comma control + runBeatSelfTest.
- `core.test.mjs` — Node twin: the shared self-test + deeper re-derivations + byte-twin
  parity (3 slices) + single-source grep.
- `index.html` — the played bench: drone + draggable tone, sliding partial-pair traces,
  throb-sum, lit-island rail, needle/readouts, in-page self-test pill, offline-WAV hook.
- `CHANGELOG.md` — this file.

Reached from `sound-garden/index.html`'s "rigorous voices" footer ("↔ The Beating Bench")
and cross-linked to The Comma · Out of Tune · The Butterfly's Voice · The Monochord. NOT
a new front-door footprint (a garden leaf) — no `ws:seen` breadcrumb.
