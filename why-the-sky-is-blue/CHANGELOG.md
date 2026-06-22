# Why the Sky Is Blue — CHANGELOG

## The Scattering Tank (founding) · cycle 270

A garden exhibit grown from the `[exhibit] Why the Sky Is Blue` seed (sown #267).
A side-on glowing tank in dark felt: a white beam fired through faintly hazy air,
a **BLUE volumetric side-glow** billowing off the beam, and a **transmitted disk**
on the far wall whose colour is **COMPUTED** (never hand-picked) from the Rayleigh-
attenuated spectrum. Registered on the front door as a grown garden exhibit in the
**optics** wing (`district:grounds, tier:1, wing:optics, footprint:tank`), neighbour
to the Hall of Mirrors, the rainbow, the halo, and refraction-run.

### The form (the soul-verb = DRAG THE SUN DOWN THE SKY)
Zero plotted curves — a thing you SEE and TOUCH. **Drag the sun down a quarter-circle
sky-arc**: the air path `L = sec(zenith)` grows, more blue is stolen from the beam,
and the disk on the far wall slides **white → amber → deep red LIVE** while the
side-glow holds **blue**. "Blue sideways, red through" is ONE law — Rayleigh's λ⁻⁴ —
seen at once.

- **Drag = sun height → air path L.** The sun rides a sky-arc pinned at the tank's
  entry; the pointer angle → zenith → `airmass()` → the ONE `L` the drag, the slider,
  and the self-test all consume. Arrow-key nudge (a11y, `tabindex=0`), a first-time
  "drag me ↓" pulse (discoverability on-ramp), and a `prefers-reduced-motion` path
  that freezes the haze drift + pulse while keeping the drag fully live.
- **A haze (turbidity) knob** multiplies κ — crank it for a far redder sunset; drop it
  and the disk stays whiter at every sun height. Setting the medium to *nothing*
  (κ=0, the self-test's neg-control) makes the disk never redden: the reddening needs
  the air.
- **The colours are the proof.** The disk = `spectrumToRGB(transmittedSpectrum(L,turb))`,
  the side-glow = `spectrumHueRGB(sideScatteredSpectrum())`, summed over the estate's
  one wavelength ramp (`tools/spectrum/wavelength.mjs`, inlined as a SIBLING include —
  colour never enters the proven core). The swatches on the live chips are the SAME
  RGB the tank fills — pixel-consistent by construction. The "why" caption's two
  clauses are live-tinted by their own glow/disk RGB.

### The physics core — λ⁻⁴ is the whole story
`core.mjs` is a DOM-free spine (`// === WHY-THE-SKY-IS-BLUE CORE BEGIN/END ===`
sentinels, byte-inlined into the page by forge, proven identical by the Node twin's
byte-parity check). Each function is its own closed-form source of truth:

- `rayleighCrossSection(lam) = (LAM_REF/lam)⁴` — the λ⁻⁴ shape, ref-normalised at 550.
- `scatterRatio(lamA,lamB) = (lamB/lamA)⁴` — **scatterRatio(400,700) === 9.37890625**,
  exact for the textbook pair AND every endpoint pair (the LAW, not one magic number).
- `transmit(I0,lam,k,L) = I0·exp(−k·λ⁻⁴·L)` — Beer–Lambert, strictly decreasing in L.
- `airmass(zenith) = 1/cos(zenith)` clamped to L_MAX — the sun→L map lives HERE.
- `sideScatteredSpectrum()` / `transmittedSpectrum(L,turb)` — the stolen blue and the
  surviving light; element key LOCKED as `{lam, I0, I}` (the scene needs I0 to render
  dimming as darkening).
- `dominantWavelength(spec) = Σλ·I / ΣI` — the intensity-weighted centroid (NOT argmax),
  which is what makes the reddening PROVABLY monotone.
- `weightedMoments(spec,k,L)` → the covariance the test reads the SIGN of.

### Self-test — four claims, exact where exact (in-page pill + Node twin)
The in-page pill reads **✓ λ⁻⁴ · 4/4 self-test** (click to expand). The headless twin
`core.test.mjs` is **17/17 green**:

- **A · λ⁻⁴ ratio EXACT** — `scatterRatio(400,700) === (700/400)⁴ === 9.37890625`,
  symmetric-inverse, equals the crossSection ratio (resolves the "9.38×" as the LAW
  for all endpoints).
- **B · transmission STRICTLY decreasing in L for every λ** over the sweep; neg-control:
  at κ=0 it is FLAT in L (worst Δ === 0 — no medium, no reddening).
- **C · transmitted centroid STRICTLY reddens in L, SIGN-CERTAIN** — two witnesses:
  the grid centroid strictly increasing, and the analytic covariance identity
  `dD/dL = −Cov_w(λ,c) < 0` (c=κλ⁻⁴ anti-monotone in λ ⇒ cov<0 always), matched to
  <1e-5 rel.
- **D · side-glow centroid in the BLUE band** — `dominantWavelength(sideScattered) =
  476.8 nm < 500`; neg-control: the UN-weighted solar centroid is greenish-white (>500),
  so the λ⁻⁴ weighting is what makes the glow blue.

The Node twin adds independent re-derivations (the (700/400)⁴, the centroid, the
Beer–Lambert values, all by hand), stronger sweeps (monotone-reddening holds for flat
/ red-tilted / blue-tilted illuminants × four turbidities × a wider L range — it is the
PHYSICS, not the chosen solar curve), the covariance identity to machine tolerance, and
the page≡module byte-parity.

### Honest scope
`K_REF` (3e10) and `L_MAX` (40) are ILLUSTRATIVE scene constants chosen for visual
punch — they defend no exact atmospheric optical depth. Every claim is scale-invariant
in κ: the λ⁻⁴ shape, the monotonicities, and the blue-band centroid hold for ANY
positive κ and ANY non-negative illuminant. The brightness map is gamma-softened with a
small floor so the deepest red is still a visible disk (the dimming is honest, just
legible) — the hue is the computed centroid throughout.

### Cross-links
Reciprocal `↗` chips to the **rainbow** and the **halo** (optics neighbours — light
sorted by wavelength, there by angle, here by which colours survive the trip) and an
upward `↗` to **last scattering** (this sky scatters sunlight today; that one scattered
the universe's first light). All resolve and reciprocate (verify.sh gate 5).

### Gates
`bash why-the-sky-is-blue/verify.sh` → ALL GATES GREEN: Node twin 17/17, front-door map
smoke clean, `forge --check --all` current (83 files), `forge --audit-seen` drops
`ws:seen:why-the-sky-is-blue`, both directions of every cross-link resolve. In-browser:
pill 4/4, clean console, 61 fps, the disk reddens live as the sun drags down while the
glow holds blue.
