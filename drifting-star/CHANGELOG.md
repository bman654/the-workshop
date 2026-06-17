# The Drifting Star — changelog

A living Doppler scene seated in the Hall of Mirrors' "Colour & spectrum" group, right after
The Spectroscope. A star drifts along the line of sight and its whole hydrogen Balmer comb slides
*rigid* — redshift reddens it right, blueshift blues it left — because every line shifts by the
same fraction Δλ/λ = v/c. Drag a velocity handle to feel it (the always-live sandbox), or play the
round-game: a hidden star, drag a crosshair to where rest-Hα would sit, lock, and the comb glides
to its true offset while your guess is scored.

## #94 — PLANTED (BLOOMED, garden track)

**Seed:** ROADMAP `[exhibit] Read the Star's Speed — the Doppler line-shift you chase` (sown #82) —
the relativistic-Doppler vein the passing-siren tombstone explicitly invited (the siren is
acoustic-only; spectral line-shift was unbuilt). BLOOMED #94.

**Form (the hero is a living scene, three layers off ONE state var `state.v`):**
- **Sky layer** — a star disc on a black starfield with a draggable velocity handle on a sightline
  rail toward the observer. Pull toward you (right) = approaching → the disc swells + cools blue;
  push away (left) = receding → it shrinks + warms red. A "let it orbit" toggle swings v smoothly
  +→0→− so the comb breathes hands-off (verified in-browser: it crosses v=0).
- **Plate layer (THE hero)** — a spectrograph band painted column-by-column with the REAL CIE
  colour. `cie1931`/`wavelengthToRGB`/`visibleIntensity` are **byte-copied verbatim from
  spectroscope/index.html** (they are NOT exported from spectroscope-core.mjs, so they live as the
  bench's own helpers — never imported); the continuum is cached to an offscreen bitmap, only the
  comb/crosshair/wash redraw per frame (the spectroscope idiom). A faint dotted **ghost comb** at
  REST wavelengths (labelled Hα/β/γ/δ) + the bright **live comb** at λ_obs; the gap ghost-Hα →
  live-Hα *is* Δλ, drawn with an arrow. A warm/cool band-tint wash crossfades as a **MOOD cue, NOT
  a claim** — the line positions carry the physics.
- **Readout rail** — live Δλ(Hα), derived v in km/s (redshift = +v), and v/c.

**Game (B's round-loop grafted onto C's sandbox):** "deal a hidden star" → hidden v uniform in
[−0.05c, +0.05c], with an occasional (~16%) **STATIONARY star (v=0)** — the negative control made
playable. Drag a crosshair to rest-Hα, quantized to a 0.02nm grid (a real measurement) with A's
**tactile detent** — a soft magnetic snap (closes 22% of the gap within 0.9nm, never auto-solves)
+ a ≤60ms WebAudio tick (muted by default). LOCK → score |v_guess − v_true|, then reveal: the true
rest-crosshair snaps in and the comb animates SLIDING to its true offset (reduced-motion = jump).
Verdict bands BULLSEYE / GOOD / TRY AGAIN, thresholds as a FRACTION of c (0.0015c / 0.006c) with a
β-floor so v=0 is winnable. Streak counter (best persists in localStorage). First BULLSEYE drops
`ws:flag:earned-drifting-star` (the new Hall feat; verified earned in-browser).

**The math claim — settled C's way (load-bearing, stated on the page):** SOLE AUTHORITY = the
classical low-v Doppler, because that is the seed's literal crux (v === c·Δλ/λ) and the clean
exactly-invertible form. `core.mjs`: `C_KMS=299792.458`; `shiftedNm(rest,v)=rest·(1+v/c)` [forward];
`recoverVKms(rest,obs)=c·(obs−rest)/rest` [exact inverse]; `shiftedNmRel(rest,β)=rest·√((1+β)/(1−β))`
shown beside the classical headline in the "how do we know" panel (shown, not claimed). The pixel
map (`wavelengthToX`/`xToWavelength`, one affine map over [380,750]) + `quantizeNm` + `scoreGuess`
+ `SCORE` thresholds all live in core. **Honest scope ±0.05c** stated on the page: (a) keeps the
whole comb (Hδ 410→~390, Hα 656→~689) inside the visible band so the plate never loses a line;
(b) at 0.05c classical/relativistic agree to ~1.4%, so the classical headline is faithful.
Rework path noted: swap render to `shiftedNmRel`, pin THAT in the test — one line.

**Files:** `core.mjs` (252L, sole authority, single-source imports `balmerWavelengthAirNm` from
`../spectroscope/spectroscope-core.mjs`) · `core.test.mjs` (Node twin) · `index.html` (the bench;
the core inlined BYTE-IDENTICAL between `// ===== DRIFTING-STAR CORE … END DRIFTING-STAR CORE =====`
sentinels, plus the byte-copied spectroscope plate-paint helpers). Plain hand-authored HTML like
its siblings (spectroscope/passing-siren) — NOT forge-managed.

**Self-test — Node twin GREEN exit 0 (26/26), in-page pill 6/6 ✓:**
- (a) MATH ROUND-TRIP, TIGHT: v→shiftedNm→recoverVKms < 1e-9 relative over hundreds of random v in
  ±0.05c for all 4 Balmer lines, AND recovered v IDENTICAL across the comb (the rigid-slide proof,
  spread < 1e-6 km/s); + an independent algebraic-inverse check.
- (a′) FULL PIXEL CHAIN, separately-asserted LOOSER tolerance: v→obsNm→wavelengthToX→quantize→
  xToWavelength→recoverVKms within the grid resolution (the measurement floor — the eye does NOT
  read v to ppm; the page's pixel chain does, the human reads to the grid).
- (b) NEGATIVE CONTROL: v=0 ⇒ shiftedNm === restNm EXACTLY (===, not <ε) for all 4 lines;
  recoverVKms(rest,rest) === 0; washStrength(0) === 0. (Visible page trigger: the orbit's v=0
  crossing, and a dealt stationary star.)
- (c) SIGN: shiftedNm strictly ↑ in v; colour-sign === position-sign (red=recede/right/warm,
  blue=approach/left/cool); + in-band scope check (whole comb stays in [380,750] at ±0.05c) +
  classical-vs-relativistic <1.5% at |β|=0.05.
- (d) SINGLE-SOURCE PARITY (anti-circularity): rest comb === imported balmerWavelengthAirNm(3..6)
  to <1e-9; core.mjs live code contains no re-typed Balmer literal.
- (e) BYTE-TWIN: index.html inlined core === core.mjs body (indentation-normalised) — IDENTICAL.
- (f) SCORING HONESTY: revealed true v === the v fed to the forward map that drew the plate; score
  is a pure function of |v_guess − v_true|; thresholds live in the core; stationary winnable.

**Registration (no new front-door footprint — grows the Hall):** Hall of Mirrors gains ONE card
after the Spectroscope (🌠, "doppler · a star's comb in motion", hue #e8a07a, comb-sliding vignette)
+ a 10th feat `{id:'drifting-star'}`; both "/ 9 earned" → "/ 10 earned"; "Nine feats of light" →
"Ten feats of light". RECIPROCAL cross-links: drifting-star → spectroscope / rydberg / passing-siren,
and an additive back-link FROM each (their cores/pills UNTOUCHED and re-verified: spectroscope 8/8 ✓,
rydberg 15/15, passing-siren 14/14 + 3/3 in-page). passing-siren got its first such companion line
(it had no cross panel). `ws:seen:drifting-star` drops on direct visit.

**Gates GREEN (builder, verified):** forge --check --all 33/33 current · layout smoke PASS · sky
73/73 · drifting-star core.test.mjs 26/26 GREEN exit 0 · 0 console errors · 0 horizontal overflow
@1280 (1265) AND @390 (375) · 0 nested anchors · pill 6/6 ✓ with the stationary-star negative
control flipping then restoring · siblings re-verified undisturbed.
