# One Velocity, Two Shifts — changelog

## bloom (cycle 135) — a siren and a star share 1 + v/c

A cross of **The Passing Siren** × **The Drifting Star**. One brass instrument, one gold
groove — the radial speed fraction **β = v_radial/c** on |β| ≤ 0.05. Turn it (drag the
buzzing source, the groove, or the dial) and two worlds that never met shift by the
**identical** first-order factor: the siren's heard pitch rises by 1 + v/c (its bunching
rings, warm ahead / cool behind), and the star's whole hydrogen Balmer comb slides ONE
rigid block by the same λ_obs/λ_rest = 1 + v/c. When the two jewels coincide on the groove
a gold link draws and the chip latches gold — a siren's pitch-up and a star's blueshift are
one fraction.

### form (form expresses content)
- **Acoustic field** (top): a dark top-down canvas; the source emits wavefront rings at a
  ×400-badged drama gain (β is tiny — the groove always shows TRUE β) so the bunching is
  visible. Drag the source along the v_radial track; ←/→ nudge, space parks at 0, m mutes.
- **Hero gold groove** (centre): x = β; the acoustic jewel rides acousticFO(β)=1+β, the
  spectral jewel rides spectralFactor(β)=1+β read through the comb's own shiftedNm; a faint
  shadow of 1+β behind. Gold link + gold chip when they coincide (<1e-9) on-axis source-moves.
- **Balmer comb** (bottom): the drifting-star drawPlate idiom — CIE-coloured plate, dotted
  ghost rest comb (Hα Hβ Hγ Hδ) + a live comb that slides rigid (red right / blue left),
  band-tint wash, a Δλ arrow on Hα. CIE helpers are render-only copies OUTSIDE the CORE.
- **Audio**: a WebAudio sawtooth whose pitch follows the EXACT acoustic factor — you HEAR
  the true Doppler (gain ≤ 0.06, respects ws:pref:muted and prefers-reduced-motion).

### two load-bearing negative controls
- **Medium asymmetry** (who-moves toggle): sound rides a medium, so source-moves 1/(1−β) ≠
  listener-moves 1+β (a gap that grows 1.0e-6 → 1.01e-4). Light has no medium — spectralFactor
  is the same form regardless. The acoustic jewel JUMPS on flip; the spectral jewel does NOT.
- **Transverse** (θ dial): tilt the velocity to θ→90° and v_radial → 0, so the classical
  acoustic factor collapses to EXACTLY 1 (rings re-centre) while the relativistic transverse
  factor keeps the Lorentz γ = 1/√(1−β²) (residual 4.5e-4 @ β=0.03, 1.25e-3 @ 0.05). A
  "purely-radial / always-agree" classifier provably fails.

### what is exact, and what is a limit
The shared fact is exact: acousticFO(β) === spectralFactor(β) to < 1e-9 (worst 1.11e-16),
λ-independent across all four Balmer lines (< 1e-12), both equal 1 + β. It is **first-order**,
not a tautology: the siren's exact factor 1/(1−β) departs the shared 1+β as an O(β²) term —
the "teeth" — from ~9e-10 @ β=3e-5 to ~2.6e-3 at the β=0.05 edge (ratio/β² bounded ~1).

### single-source & byte-twin discipline
- The two cores are lifted **byte-for-byte** from passing-siren/core.mjs (the SIREN block) and
  drifting-star/core.mjs (the SPECTRAL block), behind SIREN-CORE / SPECTRAL-CORE sentinels, and
  NEVER call each other (anti-circularity grep-clean). A thin adapter sits on top.
- The Balmer rest wavelengths come from spectroscope-core.mjs (the estate's sole Balmer
  authority) — never a re-typed 656.28 — imported natively as a browser ES module (TWO ../ hops).
- index.html inlines the whole CORE region byte-identically (13795 chars) between the CORE
  BEGIN/END sentinels; the byte-twin parity leg proves the page IS the module, char-for-char.

### self-test
`node cross/one-velocity-two-shifts/core.test.mjs` → 31/31 ALL GREEN. The in-page pill runs
the same shared runSelfTest (4/4) and equals the Node twin. Legs: (1) shared fact <1e-9 +
λ-independence, (2) teeth O(β²), (3) medium asymmetry, (4) transverse, (5) anti-circularity,
(6) byte-twin parity, (7) single-source, (8) shared-runSelfTest parity.

### discoverability
Registered as a Workbench card (♒) in the cross-cards group, with reciprocal sib-links to
The Passing Siren and The Drifting Star (and back-links from those pages). No new front-door
map footprint — the cross mold's convention; the district/slot map is untouched.
