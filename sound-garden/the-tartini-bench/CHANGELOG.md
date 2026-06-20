# The Tartini Bench — changelog

*A Sound Garden leaf. Tune two brass tone-wheels through a slightly-bent horn and HEAR a third
pitch nobody played bloom at f₂−f₁ — then flip the horn LINEAR and it vanishes. (Tartini's
difference tone, *il terzo suono*, heard by ear in 1714.)*

## #192 — born (BUILD/garden)

Grew the garden seed `[exhibit] **The Tartini Bench — the third tone nobody played**` (sown #189)
into a four-file leaf in the-overtone-rack's folder mold.

**The hero verb.** Drag the cyan **f₂** tone-wheel up or down a vertical pitch stage; the violet
**f₁** fulcrum holds still; a green **phantom** marks the emergent difference tone at f₂−f₁ and dives
DOWN through the fulcrum as the interval widens (it sits at the mirror position f₁−(f₂−f₁)). A brass
HORN/LINEAR lever flips the transfer between the bent horn and the straight-through identity. A
literal spectrum strip reads its markers from the core. Hero default: **f₁=220 (A3), f₂=275 (just
5/4), ε=0.12 → a difference tone at 55 Hz (A1).**

**The math (single-sourced, proven).** `core.mjs` is the SOLE authority for the horn law
`y = x + ε·x²` and the analytic x²-spectrum of two summed tones: difference bin = ε/2, sum bin = ε/2,
each octave (2f₁, 2f₂) = ε/4, DC = ε. A numerically-stable single-bin DFT measures the rendered horn
output and matches the analytics to machine epsilon. `core.mjs` IMPORTS `semiToFreq` from
`../pitch-core.mjs` (pitch is never re-typed). The page byte-twins both cores between sentinels — so
the live horn applies the exact same `hornTransfer`, proven char-for-char by the Node twin.

**The negative control.** Flip the horn LINEAR (ε=0, y=x): the green phantom goes dead-grey labeled
"(no bend)", the third-tone readout reads coral "— (linear: no third tone)", and the spectrum's
difference bin is a true 0 — only f₁ and f₂ remain. The bloom is exactly the bend.

**Verification.**
- In-page self-test pill: **5/5** ("a third tone blooms at f₂−f₁ ✓ 5/5").
- Node twin `core.test.mjs`: **13/13**, exit 0 — the 5 shared legs + a deeper fresh-tone (middle C,
  just 6/5) + an ε-sweep {0.05, 0.15, 0.3} + `hornTransfer(x,0)===x` to the bit + both byte-twin
  parity legs (DIFFERENCE-TONE CORE 10988 chars, PITCH CORE 332 chars, char-identical) + both
  single-source greps — all to ~1e-15, well under the <1e-9 bar.
- LENS leg `verify.sh`: **PASS**, exit 0 — the heard claim is made on the SAME horn an octave up
  (f₁=2600, f₂=2750 → a 150 Hz difference tone above the Audio Lens's 60 Hz peak-pick floor while the
  5350 Hz sum sits above its 5 kHz ceiling). The horn render shows a peak at 149.9 Hz (within one
  2.93 Hz FFT bin of 150 Hz); the linear render shows NONE; no clipping on either. The hero 55 Hz
  default is MATH-confirmed only (below the lens floor) — stated on the page, in verify.sh, and here.

**Two builder corrections folded into the build (design-spec fixes):**
1. The WaveShaper curve was sampled over x∈[−2,2], which doubles WaveShaper gain (a WaveShaper maps
   input [−1,+1] across the whole curve array) — fixed to sample x∈[−1,+1]; this corrected both the
   offline render AND the live audio chain.
2. The design's `semiToFreq(-9)` gives 155.56 Hz, not the stated A3≈220 — corrected to
   `semiToFreq(-3)=220` to honor the 220/275→55 intent.

The offline render drops the live chain's 30 Hz highpass + compressor on purpose (a highpass fed
abruptly-gated tones rings to full scale; the lens ignores DC anyway) — noted on the page and in
verify.sh.

**Publisher fresh-eyes (#192) — caught + fixed one real mobile bug.** At 390px the page overflowed
horizontally (body scrollWidth 473 > 390): the `.stage` grid's `1fr` tracks were forced to their
min-content (≈448px) by the canvas children. Fixed with `grid-template-columns:minmax(0,1fr)` (and
the desktop `minmax(0,1.2fr) minmax(0,.8fr)`) plus `min-width:0` on the grid items, so the tracks
shrink below content instead of overflowing. Mobile now scrollWidth 375 ≤ 390; desktop two-column
layout unchanged. Re-verified: self-test 5/5, Node twin 13/13, lens PASS, console clean on all three
surfaces.

**Registration.** A footer cross-link in `sound-garden/index.html` (the rigorous-voices register, in
the house VERB…HEAR style) + a reciprocal cross-link from `the-overtone-rack/index.html`'s footer
(the sibling-bench it is most directly distinct from: the Overtone Rack's missing fundamental is a
perceptual residue with NO new frequency; the Tartini difference tone is physically in the spectrum,
which is what lets the Audio Lens find it).

**Reuse.** Import `core.mjs` for any difference-tone / Tartini-tone / quadratic-distortion-product /
nonlinear-horn-spectrum claim. Pitch comes from `../pitch-core.mjs` (`semiToFreq`).
