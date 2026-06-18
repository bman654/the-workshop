# The Parallax Baseline — changelog

## Cycle 143 — exhibit bloomed (garden `[exhibit]`, Observatory district)

**THE PARALLAX BASELINE** — distance you *measure*, not a curve you read. The one Observatory
tower where the oldest distance ladder is enacted: drag Earth across its one-AU baseline, blink
the sky between January and July, and watch a nearby star wobble against Firmament's fixed far
field while a brass machinist's micrometer reads the parallax half-angle *p* live. Throw the
RESOLVE knife-switch and the parsec *definition* turns the angle into a distance, `d = 1 / p`,
because 1 pc ≝ the distance at which 1 AU subtends 1″.

### The piece — `index.html` (self-contained, observatory aesthetic, accent #9db4ff)
- Two `<canvas>` panels stacked: `#orbit` (the PLAN view — the AU baseline ellipse with an Earth
  bead you drag; `J` jumps to Jan/Jul) and `#plate` (the WOBBLE — the near star against the fixed
  far field; `B`/`Space` blinks, hold the button to strobe at ~2 Hz). The body is the readout:
  the star MOVES, never a plotted curve.
- A brass machinist's micrometer (SVG) reads *p* live; the RESOLVE knife-switch inverts the
  parsec definition to recover `d` (`2.64 pc ≈ 8.6 ly` for the default Sirius-like star).
- The factor of two is shown, never fudged: the dialed half-angle *p* and the full Jan→Jul throw
  `2p` are both displayed (0.379″ and 0.758″ at the default).
- Two honest negative controls live under your hand: **lock the baseline** (b = 0) or **pull the
  star to infinity**, and both *p* and the throw collapse to a flat `0.000″` — no baseline or no
  finite distance means no measurable parallax.
- A clearly-labelled **sky ×N** knob magnifies only the picture (the renderer's pixels), never the
  core and never the micrometer number — because real parallax is sub-arcsecond and invisible at
  screen scale.

### The math crux — `core.mjs` + `core.test.mjs` (DOM-free, zero-dep ESM)
- `parallaxArcsec`, `apparentOffsetArcsec`, `apparentShiftArcsec`, `distancePc`, `shiftRadians`,
  and the view-layer `arcsecToX` / `xToArcsec`. Inlined byte-for-byte into the page between the
  CORE sentinels; the Node twin byte-parity-checks the page copy against `core.mjs`.
- Node twin (29 checks): reciprocal `d→p→d` exact to machine-ε over [0.5, 100] pc; the two
  zero-controls exact; the parsec definition anchored (`parallaxArcsec(1,1)===1`,
  `distancePc(1,1)===1`); small-angle honest (<1e-9 rel for p≤1″, the breakdown at p=100″
  reported, not hidden); `arcsecToX`/`xToArcsec` exact inverses over a decade of ×N zoom.

### Registered
- One PLACES entry in the front-door `index.src.html`
  (`district:"observatory", tier:1, footprint:"tower", companion: Firmament`). Re-forged.

### Publisher fresh-eyes review (cycle 143)
- **Headline interaction made vivid (real bug fixed at build):** at the shipped ×60 default the
  near star rendered ~8600px off the right edge in both blink frames — the wobble was entirely
  off-screen on load. Default magnification changed 60 → ×2 (slider value, label, and `state.exag`);
  the micrometer number is untouched (still true 0.379″ / 2p=0.758″) and byte-parity stayed
  IDENTICAL. Verified live: the near star peaks at x≈734 (Jan) and x≈150 (Jul) on the 900px plate
  — a ~588px on-canvas swing, both endpoints well inside the frame; cranking the knob still walks
  it off the frame as deliberate exploration.
- **Front-door card fixed (shared data bug):** three PLACES entries used the string companion form
  (`companion:"firmament"`/`"orrery"`); the card renderer reads `r.companion.name`/`.glyph`, so the
  cards read "↳ undefined within". Fixed all three to the documented `{name,glyph}` object form
  (parallax, stellar-forge, aerodrome) and re-forged. After: 0 cards read "undefined"; the parallax
  card reads "↳ Firmament within".

### Verified
- `node parallax-baseline/core.test.mjs` → 29/29 green, byte-parity IDENTICAL.
- `node tools/forge/forge.mjs --check --all` → all 43 files current.
- agent-browser (uniquely-named session, own http server on an uncommon port): in-page self-test
  pill green 8/8 and `runSelfTest()` → ok:true 8/8; clean console; the wobble swings ~588px on the
  plate and returns; RESOLVE reads `2.64 pc ≈ 8.6 ly` (= 1/0.379, throw stays 2p honest); both
  negative controls drop *p* and the throw to `0.000″`; the sky×N knob magnifies the picture only;
  mobile @390px is a clean single column with zero horizontal overflow.
