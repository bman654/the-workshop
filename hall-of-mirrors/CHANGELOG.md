# Hall of Mirrors — hub CHANGELOG

*The wing's index/landing page. Each bench keeps its own `CHANGELOG.md` in its own dir.*

## 2026-06-13 — Redesign: "The Dispersion — A Prism's Throw"
The first BUILD under the workshop's new gardener/builder system (see `../DESIGNING.md`), and a
deliberate fix of the room DESIGNING.md names as its *cautionary tale*: the Hall had a strong native
metaphor (optics) but shipped as a plain vertical card-list, identical in form to every other room.

Redesigned so the **form expresses the content**, without sacrificing legibility (it's still a
directory of 11 benches a visitor must compare):
- **Dispersion spine** — an inline-SVG **entrance prism** by the title throws a dispersed fan; a left
  **rail** runs white (at the prism) → the six wash colours (`#ff8f8f,#ffd27a,#f4f0c0,#9fe6b4,#8ecbff,#b6a8ff`)
  top→bottom. The 11 benches read **red→violet, ordered by how each treats light**; each card has a
  spectral hue-edge bar at its band position.
- **Bands, not headings** — the 4 physics groups (Rays·lenses·mirrors / Colour·spectrum / The wave
  nature / A puzzle of light) became labelled spectral bands on the rail.
- **Live per-physics vignettes (the soul)** — each card carries a ~40px inline-SVG miniature of its own
  phenomenon that animates on hover/focus only (`.hot` class; transform/opacity/stroke-dashoffset; idle
  CPU zero): Caustic's rays converge, the Spyglass bends rays to a focus, the camera-obscura arrow flips
  through the pinhole, the kaleidoscope rosette spins, the anamorphic smear resolves, the rainbow arc
  draws red→violet, the halo ring/sundogs flare, the spectroscope prism fans the spectrum, the Newton's
  rings shimmer, the polariser's analyser counter-rotates to extinction, the maze beam routes to its gem.
- **Caustic as origin** — seated first, the prism appears to throw the spectrum from it.

Preserved verbatim: the `:root` palette, `.card`/`.feat` base styles, the spectral `<h1>`, and the
entire **Feats-of-Light** IIFE (reads `ws:flag:earned-<id>` for the 9 feats; n/9; lights earned; 9/9
hint). Self-contained (no forge, no assets, no network). **577 lines.**

**Process:** designed with a divergence Workflow (6 designers, each locked to a distinct optical lens:
spectrum / live-ray / corridor / lit-gallery / light-tree / schematic → a curator-judge), then a lead
curatorial call (the judge's legible winner + the gallery concept's live-vignette soul grafted on),
then a build deputy that browser-verified it: all 11 links + Ripple kin + back-link present; Feats
0/3/9 contract intact; 380px reflow clean; console clean; 62fps; contrast unchanged (no tinted text);
`prefers-reduced-motion` honored.

## 2026-06-13 — Created
The wing's landing page, born with the Hall of Mirrors optics wing (11 benches: Caustic, Spyglass,
Camera Obscura, Kaleidoscope, Anamorphic Mirror, Rainbow, Halo, Spectroscope, Iridescence, Polariser,
Mirror Maze), plus the Feats-of-Light ribbon and the Ripple wave-kin pointer. Original form: a grouped
vertical card-list.
