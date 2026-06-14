# Galton Board — changelog

## 2026-06-13 — "Hear the bell curve" (the Sound Garden crossing) — audio added

Wired the long-sown `cross` seed **Galton × Sound Garden — "hear the bell curve."**
A new **♪ Listen** toggle (top bar, beside the self-test chip) voices the pour:
every landing ball sounds a soft **pluck** whose **pitch is its bin**, and each peg
bounce ticks a quiet pitched click. Because a bin is Binomial, more balls land in
the centre → more notes there → the audible texture **thickens at the centre**
exactly where the curve peaks. **Probability, made audible** — the χ² fit you can
*hear* settle. Honors the shared estate-wide `ws:pref:muted` key (one mute governs
the whole estate; syncs across tabs via the `storage` event).

### What I built
- **Extended the pure CORE** (`tools/galton/galton.js`) with a DOM-free,
  Web-Audio-FREE sonification mapping (so the self-test re-audits it headless):
  - `binToPitch(bin, rows)` — bin `k` is the k-th rung up a **minor-pentatonic**
    scale from a 220 Hz (A3) root → a **strictly-monotonic bijection** bin↔Hz, so
    the histogram of the *pitches you hear* is identical to the bin histogram (the
    sound can't drift from the distribution). `PENTATONIC` / `AUDIO_ROOT_HZ` /
    `pentatonicSemitone` exposed.
  - `pegClickHz(row, rows)` — the soft tick pitch, rising ~1 octave top→bottom,
    bounded in `[200, 6000]` Hz (a shimmer, never shrill / sub-audible).
  - `voiceGainFor(activeVoices, perVoiceAmp, ceiling)` — a headroom-safe master
    gain that keeps a dense burst of simultaneous plucks under a hard 0.9 ceiling
    (no clip; mirrors the Harmonograph's `masterGainFor`).
  - `pitchProfile(rows, p)` — `[{hz, prob}]`, the expected note-density across
    pitch; because the map is a bijection, this profile's shape over pitch **IS the
    binomial PMF** (the bell curve, sounded).
- **`runSelfTest()` grew 5 → 9 checks** — four new AUDIO checks: (#6) pitch is a
  strictly-monotonic bijection of bin across rows 4..16; (#7) note-density across
  pitch **== the binomial PMF** (peaks at the centre pitch, Σ=1, rises-then-falls —
  the bell curve, heard); (#8) the master gain keeps a ≤64-voice burst under 0.9
  (no clip, a single voice never gated silent); (#9) peg-ticks bounded in
  `[200,6000]` Hz and rising with depth. The in-page chip now reads **9/9**.
- **Node self-test** (`tools/galton/galton.test.cjs`) → **16/16 PASS** (9 shared
  core + 7 hardening), exit 0.
- **Page** (`galton/index.src.html` → `index.html`) — added a Web-Audio layer that
  renders the CORE: lazy graph built only inside a user gesture (autoplay-safe),
  master gain + compressor, two sub-buses (plucks loud-ish, ticks quiet), a
  polyphony cap (MAX_POLY=14) so a burst can't spawn thousands of nodes, and a
  tick throttle (~55/s). `stepBalls` voices a pluck on each ball's bin arrival and
  a tick on peg-row crossings; the **instant-tally path stays silent** (you can't
  hear 10k instant balls — the visible thickening is that path's story; the
  animated +100 is the audible one). A live "sounding" read-out shows the bin→Hz
  mapping. Same `ws:pref:muted` pattern as the Harmonograph cross.

### Verified
- `node tools/galton/galton.test.cjs` → **16/16 PASS**, exit 0.
- `node tools/forge/forge.mjs galton/index.src.html` clean; `--check --all` green
  (29 files current).
- **Audio-lens (the silent offline render)** — rendered a deterministic 220-ball
  pour through the REAL `binToPitch` + pluck envelope to a WAV; lens self-test
  12/12; the render is **not clipping** (0%, peak −11.2 dB) and **not silent**
  (silenceRatio 0.08); its top spectral peaks cluster at the **centre pitches**
  (D5 585 Hz, C5 522 Hz, A4 436 Hz) — the energy concentrates in the central
  register where most balls land, i.e. **the bell curve, heard**; the spectrogram
  shows a dense band of note-lines in the centre with sparse high lines (the rare
  edge bins) and discrete onset streaks.
- **Real-browser pass** (served origin :8752, agent-browser, cache-busted): chip
  **9/9**, `ws:seen:galton` written; Listen flips to "Listening" and a real click
  **resumes the AudioContext to `running`** (autoplay-safe); an animated +100 pour
  ran with the master gain ramped to 1, the pluck-bus at the headroom-safe 0.352,
  live voices capped at 12; the χ² verdict settled to "consistent with binomial";
  **0 console errors**; the shared-mute `storage` sync flips the engine to
  "🔇 Muted" and ramps the master to 0.

### Notes
- `binToPitch` is **strictly increasing** in bin, so the heard-pitch histogram ==
  the bin histogram **exactly** — that bijection is what makes "note-density across
  pitch == the binomial PMF" an exact identity (check #7), not a hand-wave.
- The mapping is musical by construction (a pentatonic; adjacent bins are always a
  pleasant step apart) so a pour reads as music, not noise.

## 2026-06-13 — Initial build (bean machine; a proven bell curve)

Built `galton/` — a live **Galton board** (bean machine / quincunx): balls cascade
down a triangular peg array, bouncing left/right at each row, and pile into bins
that grow into a **bell curve**, with the **exact theoretical binomial PMF**
overlaid so the bars visibly rise to meet it. The workshop's first
**probability/statistics** piece — a genuinely new genre for the estate (the
Strange Garden's emergent specimens are deterministic dynamical systems; this one
*samples a distribution* and shows the Law of Large Numbers at work).

### What I built
- **Pure DOM-free core** (`tools/galton/galton.js`) — the single source of truth:
  - `binomialPMF(rows, p)` — the **exact** PMF `P(k)=C(rows,k) q^k p^(rows−k)`
    (q=1−p), built from **log-factorials / Lanczos log-gamma** for numerical
    stability across the full row range.
  - `binomialMean`/`binomialVar` (`rows·q`, `rows·p·q`); `normalApprox` overlay.
  - `makeRng` (xmur3 → mulberry32) — **seeded**, no `Math.random`, no wall-clock.
  - `dropBall` / `simulate(seed,rows,p,n)` — a deterministic run; each ball's bin
    = its count of right-bounces; histogram conserves every ball.
  - `chiSquare` + `gammaP` / `chiSquareCDF` / `chiSquarePValue` /
    `chiSquareCritical` — a goodness-of-fit statistic of the empirical histogram
    vs the exact PMF, with its p-value and critical value.
  - `runSelfTest()` — the 5-check battery the in-page chip runs.
- **Node self-test** (`tools/galton/galton.test.cjs`) — runs the shared core (5
  checks) **plus** 7 hardening assertions → **12/12 PASS**, exit 0, ~0.25 s.
- **Forge page** (`galton/index.src.html` → `index.html`) — dark-aesthetic canvas:
  hopper, triangular peg field, bins; seeded balls animate down the pegs into
  bins; bars grow as fractions sharing a y-scale with the amber **binomial PMF**
  overlay (+ optional violet **normal**). Controls: rows (4–16), left-probability
  `p` (0.05–0.95), drop speed, seed + reseed, +100/+1k/+10k balls, normal toggle,
  3 palette-only skins (slate · ember · moss), pause, clear, 2× PNG, `← workshop`.
  Live stats: count, empirical mean & σ (theory in parens), χ²(df) + a p-value
  verdict. Reduced-motion / large drops tally instantly (order-identical to the
  animated path). Forge-includes `../tools/galton/galton.js` + `../tools/ws/ws.js`;
  drops `ws:seen:galton`. **No audio.**

### The crux it proves
1. **The ideal IS exactly binomial** (exact identity): the PMF sums to 1 (≤1e-12,
   in practice ~1e-15), mean = `rows·q`, variance = `rows·p·q` (≤1e-9), and
   `rows=4,p=.5` is Pascal's `1,4,6,4,1`/16 to 1e-15.
2. **The simulation converges** (a **statistical** claim, stated as such): a
   ≥100k seeded run's **χ² does NOT reject** the binomial at α=0.01, at p=0.5 AND
   biased p. The Node test also (a) calibrates the χ² CDF to published table
   quantiles (≤0.02) and (b) confirms a deliberately-wrong **flat** histogram IS
   rejected — the test has teeth.
3. **Every path is valid**: exactly `rows` ±1 steps; bin == right-bounces ∈
   `[0,rows]`; Σhist == N.
4. **Determinism**: same (seed,rows,p,N) ⇒ identical paths + histogram; distinct
   seeds differ.
5. **Empirical mean/variance** track `rows·q` & `rows·p·q`, tightening with N.

### Verified
- `node tools/galton/galton.test.cjs` → **12/12 PASS**, exit 0. χ² evidence table:

      seed=estate-fair  rows=12 p=0.50 N=100000: χ²=14.06 df=12 crit=26.22 p=0.297 → do-not-reject
      seed=estate-fair2 rows=16 p=0.50 N=150000: χ²=14.01 df=16 crit=32.00 p=0.598 → do-not-reject
      seed=estate-bias  rows=12 p=0.30 N=120000: χ²= 4.84 df=12 crit=26.22 p=0.963 → do-not-reject
      seed=estate-bias2 rows=10 p=0.72 N=120000: χ²=13.72 df=10 crit=23.21 p=0.186 → do-not-reject

- `node tools/forge/forge.mjs galton/index.src.html` clean; `--check --all` green
  (25 files current).
- **Real-browser pass** on a live origin (`python3 -m http.server 8148`, session
  `galton-verify`, 1440×900 + 390×844 mobile):
  - Green chip **5/5** — matches the Node core's 5 shared checks; 0 console errors.
  - p=0.5, 12 rows, n=20,300: mean 6.010 (μ=6.00), σ 1.730 (1.73), χ²(12)=11.6 →
    **consistent with binomial (p=0.481)**. Bars meet the amber overlay.
  - Normal overlay toggles on (violet, near-coincident with the binomial for a
    symmetric board); legend updates.
  - Biased **p=0.28** → distribution skews right, mean 8.638 (μ=8.64), σ 1.558
    (1.56), χ²(12)=3.8, p=0.986 — and the overlay follows the skew exactly.
  - **16 rows** → a smoother, finer bell (17 bins); mean 8.011 (μ=8.00), σ 2.021
    (2.00), χ²(16)=20.5, p=0.197. Ember skin recolours only (geometry identical).
  - Reseed changes the run; `ws:seen:galton` set.
  - Reduced-motion code path verified directly: the instant-tally branch fills the
    histogram with **0 active / 0 pending animation** (animation stilled) while
    still converging — identical to what `prefers-reduced-motion` triggers.
  - Mobile (390×844): panel docks to the bottom; board + curve render; chip 5/5.

### Caveats
- The convergence claim (#2) is **statistical**, not an exact identity — a finite
  run fluctuates; the SPEC and stats line phrase it as "consistent with the
  binomial," driven by the χ² p-value, never "equal to."
- On mobile, the top-positioned stats line slightly overlaps the board title at
  narrow widths — cosmetic, fully readable; collapsing the panel gives a clean view.
- agent-browser's `set media … reduced-motion` did not propagate `matchMedia` in
  this Chrome build, so reduced motion was verified via the identical instant-tally
  code branch rather than the emulated media query.
