# The Loud and the Quiet Walk — changelog

A single walkable, AUDIBLE interference field where the spatial pattern becomes a countable
temporal rhythm. Two speakers sing one pure tone; carry a listening-ear across the floor (or
press Sweep) and the tone pulses loud–quiet–loud, each loud antinode CHIMING a tick you can
count. Twin to **Ripple** — the same wave-interference field, drawn in silence. Lives in the
estate's new WAVES wing on the west grounds, kin to OPTICS.

## Born (cycle 260)

The room as shipped:

- **The math heart — `core.mjs`** (the heard loudness IS Ripple's field, not a re-derivation).
  Its seven reused functions — `falloff`, `distTo`, `contribution`, `field`,
  `resultantAmplitude`, `kOf`, `omegaOf` — are pasted CHARACTER-FOR-CHARACTER from
  `ripple/index.html` (comments and all). The two speakers are always equal-A, in-phase,
  `falloff:'none'` sources, the ONLY case Ripple's closed form covers exactly:
  R = 2A·|cos(kΔ/2)|, Δ = r₁−r₂. A single `gainAt()` is read by BOTH the oscillator gain AND
  the band-map pixels, so **eye == ear is an identity by construction**. Room-specific helpers
  (`pathDiff`, `twoSpeakers`, `hyperbolaPoint`) only frame the loci; they never recompute the
  field by hand.

- **The proof — `core.test.mjs`** (Node twin, `node core.test.mjs`, EXIT 0; mirrored by the
  in-page chip, 9/9). It proves, to <1e-9:
  - **(a) byte-identity with Ripple** — re-extracts each of the seven reused functions out of
    `ripple/index.html`'s LIVE source by brace-matching and asserts each is character-identical
    to our copy. If Ripple's core ever drifts from ours, the test goes RED.
  - **(b) the loci** — loud maxima at r₁−r₂ = nλ (R = 2A), silent minima at (n+½)λ (R = 0),
    landed on the path-difference hyperbola with NO numeric solve.
  - **(c) field-match** — the heard gain `gainAt()` equals Ripple's `resultantAmplitude` over
    5000 random points to <1e-9.
  - **(d) d fans the bands** — the loud-band count #{n : |nλ| < d} rises strictly with d
    (7 < 11 < 15), each counted band genuinely loud on its hyperbola.
  - **(e) λ = c/f** — c = f·λ both ways; halving f doubles λ; pitch is the carrier (the pattern
    depends on λ only).
  - **(f) the NEG-CONTROL is RED** — the equal-path centre line (the perpendicular bisector,
    r₁ = r₂ ⇒ δ = 0) stays maximal and never goes quiet; a single source has no nulls.

- **The page — `index.src.html` → `index.html`** (forge-inlined; `core.mjs` included
  byte-identical, gated by `forge --check`). A brass-on-dark room: the silent band-map under
  the field (the same `gainAt()` your ear reads, drawn), two glowing speakers, a draggable
  white WALK-line with amber nλ ticks the loud peaks must land on, a bottom METER strip drawing
  the heard loudness curve in time with a live ear-cursor, and a second amber NODE-HUNT line
  you drag onto a nodal hyperbola to confirm a silent walk (peak < 18%). Presets, a d-slider
  that fans the bands, and coupled λ⇆pitch sliders (c = f·λ).

- **Audio** — two sine oscillators panned L/R to the two speakers via per-source
  `StereoPanner` (genuinely binaural in headphones); master gain honours `ws:pref:muted` + a
  Sound on/Muted toggle (muted by default), AudioContext created/resumed on first gesture; a
  triangle chime at 2f dings once per integer path-diff crossing (you count the chimes).
  Degrades gracefully when muted — the field, meter, and chime-marks still read.

- **Wiring** — registered as a front-door POI (drops `ws:seen:loud-and-quiet`); reciprocal
  cross-links with Ripple resolve 200 both ways (this room ↔ "Ripple — the same field, silent";
  Ripple's topbar gains "↗ the same figure, sung", matching its LOCAL look). Founds the WAVES
  wing on the west grounds — the first time Ripple itself appears on the front-door map.
