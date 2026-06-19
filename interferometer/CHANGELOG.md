# The Micrometer Interferometer — changelog

A touchable **Michelson** for the Hall of Mirrors optics wing. Split one beam in two,
bounce each off a mirror, recombine into live concentric **bullseye fringes**, then turn
a brass micrometer knob on the moving arm and watch the rings get born and swallowed at
the center while a counter ticks. The instrument **is** the readout — no plotted curve.

Single self-contained `index.html` (vanilla HTML/CSS/JS, zero deps, file://-safe). Hall
warm-gold optics palette: bench `#05060a`, brass `#8a6d28`, parchment `#f3e7c4`, coherent
beam `--beam`→`--beam-hot`. A DOM-free logic core (`core.mjs`) is inlined byte-for-byte;
a Node twin (`core.test.mjs`) byte-parity-checks the inlined copy so the two can't drift.

## 2026-06-18 — new piece

### Form (a thing you operate, not a graph)

- One responsive SVG bench (`viewBox 0 0 900 520`) drawing the real Michelson topology:
  **source** → **beamsplitter** (45° half-silvered plate) → a **fixed arm** (M1) and a
  **moving arm** (M2 on a sliding carriage) → **recombination** → a dark-glass **screen**.
  Beam segments glow (feGaussianBlur); the moving-arm + recombined beams pulse with the
  on-axis intensity at the center.
- **Hero = a draggable brass micrometer knob** (concentric circles + radial knurl grooves),
  with a second smaller knob + a paired `<input type=range>` in the panel for keyboard/a11y.
  Drag is **pointer events only** (pointerdown/move/up/cancel + setPointerCapture, unwrapped
  angle accumulator so a hand-spin racks many fringes); arrow keys nudge; all of them write
  the SAME state Δd.
- **Live bullseye** = a `<canvas>` overlaid on the SVG screen disc, re-measured via
  ResizeObserver so the rings never drift off. Per-frame per-pixel paint calls the core's
  `ringIntensity(rNorm, Δd, λ)` → warm-gold tint × I. As Δd grows, rings are swallowed at
  center; as it shrinks they bloom outward.
- **Readout:** rings counted N (from the core's CONTINUOUS order — alias-proof, not
  brightness flicker), Δd in nm, recovered λ = `recoverLambda(Δd, N)` shown next to the
  true source λ; a wavelength picker (HeNe 632.8 / green 532 / violet 405) recolours the
  beam; a "zero the micrometer" button; the counter glints when an order crosses an integer.

### The claim (self-tested, GREEN)

Each ring swallowed at the center is **half a wavelength** of travel, because light down the
moving arm travels it **twice**: Δd = N·λ/2, hence **λ = 2·Δd/N**. The page pill calls the
inlined core's `runSelfTest()` directly (never re-derives). `node core.test.mjs` exits 0:

- **λ = 2·Δd/N** to < 1e-9 across λ ∈ {400,500,532,633,700} nm (worst error 0 ULP), plus an
  independent Node re-derivation for n = 1..16 across several λ.
- **NEG-CONTROL (load-bearing):** the naïve law (forgetting the round trip, ROUND_TRIP→1)
  recovers exactly λ/2 — λ/naïve === 2 to the bit — so it's wrong by ×2 and leg A rejects it.
- **NEG-CONTROL:** a dead screen (zero coherence) reports N = 0 for any Δd and disagrees with
  the live fringe count — a flat detector can't fake a wavelength.
- on-axis I ≡ (I0/2)(1+cos 2πδ/λ) to < 1e-12; bright/dark anchors land.
- ring geometry: the center order is the innermost (smallest θ), rings grow outward toward
  lower orders, and vanish past cosθ > 1.

### Discipline

- The inlined core block in `index.html` is **byte-identical** to `core.mjs` (sentinel region,
  indentation-normalized), verified by `core.test.mjs`.
- zero-import grep on the core body; the `recoverLambda` definition lives in exactly one `.mjs`;
  the core never references `document`/`window`.

### Registered

- A card on the Hall of Mirrors landing in the **wave-nature-of-light** band, adjacent to
  the Diffraction Grating and the Moiré Bench (glyph `⊚`, `--hue:#7fc4ff`).
- Back-links: `← The Orrery Estate` and `hall of mirrors ↑`; footer to both.
- Breadcrumb `ws:seen:interferometer` set on first direct visit.

### Publisher fresh-eyes fix (2026-06-18)

- **Screen disc fell off the bottom of the bench.** The disc was `cx=380 cy=490 r=92` in a
  `viewBox 0 0 900 520` — its bottom edge (582) sat ~62 units below the viewBox, so the
  bottom ~12% of the bullseye and its absolutely-positioned canvas overlay (rect bottom 575px
  vs bench frame bottom 524px) were clipped by the SVG's root overflow. Raised + shrank the
  disc to `cy=408 r=84` (bottom ~494, well inside 520), re-pointed the recombined beam
  `bScr y2: 440→324` to the new disc top, and nudged the `screen` label to `x=478 y=412`. The
  canvas auto-follows (it measures the disc via `getBoundingClientRect`), so no JS changed —
  byte-parity of the inlined core stayed IDENTICAL and the self-test held 5/5. Full bullseye
  now sits inside the frame at 1280 and 390 widths.
