# The Jug — changelog

*A Sound Garden leaf. Fill a brass jug and blow across its mouth and it hums ONE low note — with no
overtone ladder at all. The plug of air in the neck is a MASS bobbing on the cavity's air-SPRING: a
single lumped Helmholtz resonance. The gold air-slug bobs on the spring while the ear hears the note
that motion makes — slug-deepest-in ⇔ spring-most-compressed ⇔ cavity-brightest, all on one cos(phase).
Pour water in to halve the air and the hum jumps a tritone (×√2); quadruple the neck and it drops a
clean octave. The LUMPED foil to The Stopped Pipe's DISTRIBUTED odd-harmonic series — there is nothing
at 2f to draw.*

## #338 — born (BUILD/garden)

Grew the garden seed `[exhibit] **The Jug**` into a five-file leaf in the the-comb folder mold — the
Sound Garden's 13th nested bench, and its first Helmholtz-resonator / lumped-resonance piece
(grep-confirmed zero before this). NO new top-level dir, NO front-door sky star, NO gate re-forge
(deepen-before-detach: the sound-garden POI already has its star + organ-pipes gate rep; The Comb #326
set the no-star precedent).

**The one form move (the soul).** ONE drawn object: a bronze-and-verdigris jug with a gold heart. A
luminous **gold air-slug** (the neck's mass) bobs in the neck bore while the cavity below brightens as
it is compressed — `slug-deepest-in ⇔ spring-most-compressed ⇔ cavity-brightest`, all on one
`cos(phase)`. The eye watches the air-slug bob on the air-spring; the ear hears the note that motion
makes. The single lumped resonance is the anti-ladder foil to The Stopped Pipe: there is **nothing at
2f** to draw — no second mode, no overtone series.

**The hero verbs.** Three bronze drag-handles each move one SI lever and you SEE + HEAR the pitch slide
(the pip on the right rail tracks `f_H`): raise the **water** (less air → higher), widen the **throat**
(→ higher, √A), lengthen the **neck** (→ lower, 1/√L_eff). **Click the mouth** to flick the jug (one
note that rings and fades); **press & hold** to blow a steady hum; blow **harder** (drag up while held)
and it gets louder — never higher (the pip doesn't move: the felt negative control). Three brass
**consequence-detents** tween the handles to an exact interval: *pour to halve the air* `V→V/2` ⇒ +√2
(a tritone, A3→E♭4); *widen the throat* `A→2A` ⇒ the same +√2 by a different lever; *stretch the neck*
`L_eff→4·L_eff` ⇒ −an octave (A3→A2). The detents glide the live bandpass so you hear the interval slide.

**The lockstep contract (the soul).** Exactly one state geometry `{A,V,L_eff}` drives BOTH the drawn
jug (the bob rate `phase += 2π·f_H·SLOW·dt` with `SLOW=1/72`, so halving the air visibly speeds the bob
by √2 in lockstep with the pip + the heard pitch) AND the live audio: ONE Web-Audio **BiquadFilter**
`type='bandpass'` whose `frequency` IS `f_H = helmholtzFreq(state)`, `Q=22`, driven by looping **white
breath-noise** → amp env → master → compressor. **NO oscillator anywhere** (a parked tone would void
the proof-by-ear — the bandpass IS the resonator). SEEN == HEARD == PROVEN from one number.

**The math (single-sourced, proven).** `core.mjs` is the SOLE Helmholtz authority. The neck air is a
mass `m = ρ·A·L_eff`; the cavity air is a spring `k = ρc²A²/V`; a mass on a spring rings at
`f_H = (1/2π)√(k/m) = (c/2π)√(A/(V·L_eff))` — the **ρ cancels**. The page byte-twins the `JUG CORE`
slice char-for-char and the `PITCH CORE` slice from `../pitch-core.mjs` (semiToFreq + noteName, for the
pip's "A3" label); the Node twin `core.test.mjs` re-extracts both and asserts parity. The Helmholtz law
body and the matrix-exp ODE render each live in exactly one `.mjs` (grep-checked). Defaults retuned to
the validated **A3 baseline**: A0=7.069e-4 m² (r=15 mm), V0=5.44e-4 m³ (~0.54 L), L_eff0=0.08 m →
f_H = 220.0 Hz.

**The three-layer proof (non-redundant).**
- **(L1 MATH) `core.test.mjs` Node twin — 14/14.** The shared `runJugSelfTest` 5 legs: LEG1 the lumped
  identity `(2π·f_H)² === k/m` to <1e-12 relative over a 400-geometry sweep, ρ-independent; LEG2 halve V
  ⇒ ×√2 (+600.000¢); LEG3 double A ⇒ ×√2 (+600.000¢) by a different lever; LEG4 quadruple L_eff ⇒ ×½
  (−1200.000¢); LEG5 the single-mode negative control via the matrix-exp ODE render (Q=32/seed=3) — the
  jug leaves only f_H alive (`(E₂²+E₃²)/E₁² = 6.9e-5`, far-skirt floor) while a harmonic LADDER lights
  2f,3f (ratio 0.362), a 5257× gap, and an 8× drive reproduces the waveform bit-for-bit (linear ⇒
  louder, never higher). Plus deeper re-derivations on 200 fresh geometries, a 2nd `(c,ρ)` air, the
  neg-control teeth, byte-twin parity (both slices), and the single-source greps.
- **(L2 PILL)** the SAME `runJugSelfTest` shown green in-page (5/5).
- **(L3 EAR) `verify.sh` — PASS (7/7).** audio-lens on `window.__renderJug` OfflineAudioContext bandpass
  renders (the SAME bandpass the browser plays), PING-TRAIN excitation (8 ms white bursts every 0.4 s =
  the flick repeated). Five pinned named geometries: HERO→221.2 Hz (A3, no peak at 440); HALVE-V→313.7
  (E♭4, +604.8¢ ≈ tritone); QUAD-L→110.5 (A2, −1201.6¢ octave, clears the 60 Hz floor); DOUBLE-A→311.3
  (E♭4, +591.5¢, same √2 via a different lever); NEG-2f→peaks at BOTH 220 AND 440 (we built a 2f partial
  and the lens heard it — so its absence in HERO is a claim, not a blind spot). All within ±15¢; --clips
  false on all five; spectrograms for base vs neg-2f.

**The stated seam (honesty, shipped in copy).** The slug is shown at 1/72 speed (the ear hears it 72×
faster). The drawn jug is a 2D depiction; V is a clean calibrated volume and the claim is f_H given
(A,V,L_eff), not the jug's true 3D shape. L_eff folds in the neck end-correction (the page's
`leffFromLR(L,r)=L+1.7·r` reconciles to the core's `END_CORR`; the home drawn length is chosen so
L_eff=0.08). The audible ring is `f_d = f_H√(1−1/4Q²)`, ≤0.3¢ below the f_H the pip reads — the same
note. The LIVE rig sweeps freely; the heard-headless claim is made only by `verify.sh` on the SAME
bandpass at the five pinned geometries.

**Discoverability.** One index card appended to `sound-garden/index.html` after The Comb (verdigris
accent). THE headline pairing: reciprocal cross-link with **The Stopped Pipe** (lumped vs distributed —
one mode, not a ladder) in both directions, plus The Plucked Reed · The Comb · ← Sound Garden ·
← The Orrery Estate. A leaf — copies "← sound garden", drops NO `ws:seen` breadcrumb.

**Files.** `core.mjs` (the Helmholtz + lumped-spring/mass + matrix-exp ODE authority + runJugSelfTest) ·
`core.test.mjs` (the Node twin, 14/14) · `index.html` (the bench, byte-twinning both slices) ·
`verify.sh` (the audio-lens ear-check, 7/7) · `CHANGELOG.md`. Self-verified: in-page pill green 5/5,
Node twin 14/14, verify.sh PASS, ~62 fps, live bandpass confirmed running (ctx running, output present),
forge --check clean at 106 files.
