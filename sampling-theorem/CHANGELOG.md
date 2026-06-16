# The Sampling Theorem — CHANGELOG

A Workbench → Computation bench. **Below the Nyquist line f_s/2 a sampled signal is
carried *exactly*; above it, a masquerade** — an undersampled tone and its fold give
byte-for-byte identical samples, so the reconstruction provably rebuilds the *alias*,
never the source. Imports the Butterfly's radix-2 FFT to watch the line fold to the
wrong bin.

## v2 (cycle #84, 2026-06-16, Opus 4.8) — RE-SOULED IN PLACE (the wagon wheel is the hero)

A `[rework]` re-soul (audit-marked #82): the v1 bench was polished + correct but LED with a
single 1-D waveform plot, demoting the most viscerally touchable phenomenon in sampling — the
**wagon-wheel illusion** — to a mere preset on that flat chart. Re-grown IN PLACE (same route,
same ws-less breadcrumb): a **strobed spinning wheel is now the hero you feel in your gut**,
single-sourced from the proven core; the old 1-D time/freq plots demoted to a quiet side-rail
("the curve is the shadow"). Form expresses content — a wheel you watch freeze and run backward,
not its plotted curve.

### The core math (added inside the byte-twin sentinels, char-identical in BOTH copies)
- **`apparentRate(f, fs)`** — the SIGNED stroboscopic alias `frac·fs` (`frac = f/fs − round(f/fs)
  ∈ (−½,½]`). `|apparentRate| === foldedFreq`; the SIGN is the regime: **+ true/forward**,
  **− the backward phantom**. Below Nyquist `apparent === f` (no fold); AT Nyquist the antipodal
  **freeze** (read it off `|apparent|·2 === fs`, NOT `apparent === 0`). `foldedFreq`'s body
  untouched (anti-drift + B3 safe); no `dft`/`fft` token added (anti-circularity grep stays green).
- **Self-test leg F** (the phantom IS the math): the wheel's apparent rate === the signed fold;
  the drawn spoke-X IS `core.sampleTone` (drift 0); a continuous-light neg-control reads
  `apparent === true` to ε. In-page pill **7/7 → 8/8**.
- **`sampling-core.test.mjs`** gained the **SIGN-FLIP SWEEP (#4b)** across `f ∈ (fs/2, 5·fs]`
  (2747 steps, worst |·|−fold Δ=0, wrong-sign count=0). Node twin **14/14 → 16/16** exit 0.
- `apparentRate` appended to the module export list (OUTSIDE the sentinels). The byte-twin slice
  grew `13734 → 16406` chars (exactly the added `apparentRate` fn + leg F); both copies re-extract
  char-identical (the load-bearing parity invariant stays green).

### The page (hero wheel + side-rail)
- `drawWheel()` leads the draw spine; spokes (even=6 default) hub→rim, ONE gold marked spoke (teal
  under continuous light), a teal rim ring (the truth), a flash-glow keyed to the flash index, a red
  ghost-trail of the eye's marked spoke over the last ~6 flashes. Apparent rate read ONLY from
  `core.apparentRate` (never re-derived in the page); continuous-light renders the LITERAL true rate
  so the phantom provably vanishes. `t0/phi0` rebased in the slider handlers so the eye's phase stays
  continuous across f/fs changes.
- **Reduced-motion gate FIRST** in the spine: one static FROZEN-at-Nyquist frame (antipodal spoke +
  faint prior-flash ghost + a baked caption), no rAF armed (`animating` excludes `wheelLive` under
  `REDUCED`).
- `#stage` reflowed into `#wheelHost` (flex 62%, the hero) + `#sideRail` (the OLD time + freq canvases
  shrunk side-by-side). A hero **regime badge** + the status pill BOTH key off the signed fold
  (true / freeze / backward). ON-RAMP: loads mid-motion in a slow BACKWARD phantom (wagon preset
  retuned `f=4.6 @ fs=8 → apparent −3.40`) with a baked "drag f_s up to make it spin true →" hint.
  Negative-control "continuous light" toggle + a 5/6-spokes chip added to `#togs`. ResizeObserver
  now observes `#wheelHost`.

### Preserved (the honesty guardrails carry over intact)
- Both `.xteaser` blocks (incl. the Voice **leakage ≠ aliasing** honesty-cross), both back-links
  (Butterfly "↔ the ceiling" + the Voice "why the teeth bite →"), the muted-by-default audio pair.
  The leakage≠aliasing distinction is load-bearing — protect it (see the v1 guardrail below).

### Registration (no new front-door footprint — a re-soul of an existing bench)
- `workbench/index.html` (+1/−1): the Sampling card kind gains `· the wagon wheel`; the blurb is
  re-led with the wheel/strobe. Same route, glyph 📶, slot. No front-door entry, no `ws:seen`.

### Verification (publisher fresh-eyes, cycle #84 — shipped clean, no bug caught)
- Served `127.0.0.1:8749` (session `st84pub`), browser closed by exact session name + http server
  killed by exact PID 12433, port confirmed free — Brandon's :3001/:4380 untouched.
- In-page pill **8/8** ✓ · Node twin **16/16** exit 0 · byte-twin parity GREEN (16406 chars identical).
- Regimes verified LIVE on the real `fs` slider (with rAF settle): `fs=8` → "BACKWARD phantom,
  apparent −3.40"; `fs=20` → "spinning TRUE, apparent 4.60"; `fs=9.2 (=2·f)` → "FROZEN, fs=2·f=9.20";
  continuous-light toggle → "CONTINUOUS · TRUE, no strobe, 4.60" (phantom vanishes), off restores the
  backward phantom. The wheel canvas changes frame-to-frame (genuinely spinning, 180ms hash differs).
- **0 console errors** after exercising every control · **0 nested anchors** on the bench AND the
  Workbench · **0 horizontal overflow @1280 AND @390** · mobile @390 collapses to one legible column
  (wheel hero full-width, controls stack). All four cross-targets resolve 200 (Butterfly back-link,
  Voice xteaser + honesty-cross, Workbench card, the Voice/Butterfly forward crosses). `forge --check`
  stays current at 31/31 (no `.src.html` touched).
- The reduced-motion path verified by code inspection (this Chrome build won't report
  `prefers-reduced-motion` to matchMedia; the builder used a shim probe at build time): the gate is
  first in the spine, renders one static frozen frame, arms no rAF.
- **No real bug found, no polish edit, no `[bug]`, no `⚡` spark.** The toggles are non-focusable
  `<div class="tog">` — but that is v1's established pattern (confirmed via git: `tog kern`/`tog
  ghost`/`tog win` were already plain divs), followed consistently for the two new toggles; not a
  regression and out of scope for this re-soul (the presets + sliders are keyboard-operable).

## v1 (cycle #27, 2026-06-14, Opus 4.8) — SHIPPED

### The claim, proven exact (in-page pill 7/7 · Node twin 14/14)
- **THE ONE LOCKED DECISION:** the source signal and the tone-sampler are
  **ZERO-PHASE COSINES** `a·cos(2πf·t)`. This is load-bearing, not cosmetic — cosine
  is EVEN, so `cos(2π(fs−f)·n/fs) = cos(2πf·n/fs)` at every integer n, making a tone
  and its alias sample **byte-exact (worst diff exactly 0)**. A SINE basis sign-flips
  the alias (worst diff 2) and breaks Claim B. Stated in the core's header.
- **A1 PERFECT RECONSTRUCTION** (the proof authority): a band-limited cosine sum,
  reconstructed by the **periodic Dirichlet kernel** at 503 dense off-grid t, matches
  the source to **5.06e-14**. The plain finite-window Whittaker–Shannon caps at ~1.46e0
  (the truncation); the Dirichlet (periodic-sinc) kernel removes it — that's WHY
  `reconstructPeriodic` is load-bearing for Leg A, not plain `reconstruct`. (Kernel
  is the EVEN-M form `sin(Mθ/2)/(M·tan(θ/2))` — the `tan` denominator, not `sin`.)
- **B1 ALIASING BYTE-EXACT** (strict `===`): cos@bin 200 and cos@bin 56 (=N−c) on an
  N=256 window sample STRICTLY equal — every `v===`, maxAbsDiff **exactly 0** (not
  ~1e-14), via the integer-cycle folded-cosine LUT (`half[k]=cos(2πk/N)`, fold the
  phase index). The strongest "indistinguishable."
- **B2 THE LIE IN FREQUENCY** (the imported fft): `spectrum(xTrue)` peaks at the
  FOLDED bin 56, NOT c=200 — the line at the WRONG frequency. The required
  imported-transform leg.
- **B3 foldedFreq names the alias**: `foldedFreq(f,fs) === (N−c)·fs/N` to 0.00e+0.
- **C POSITIVE CONTROL**: below Nyquist every spectral line at its true bin, ~0
  energy above the top line, reconstruction 3.95e-14. "The picture does not lie."
- **D NEGATIVE CONTROL (honest)**: the reconstruction of the undersampled tone
  DIFFERS from the true source (1.99) but reproduces the ALIAS source (2.29e-13) — it
  provably rebuilds the GHOST. Green = "the masquerade is exact," NOT "recon works."
- **E SINGLE-SOURCE / RADIX-2 CONTRACT**: fft/toComplex/isPow2 are IMPORTED from
  `../butterfly/core.mjs`; a length-100 (non-pow-2) fft THROWS the power-of-two error.
- **VISUAL leg** (in-page console): render-vs-core drift **0.00e+0** (the drawn
  reconstruction IS `core.reconstruct`), ghost-through-teeth **1.19e-14** (the ghost
  passes through every comb tooth — the visible coincidence is real).

### Architecture — single source / anti-circularity
- `sampling-core.mjs` is the **SOLE math authority** (sinc / foldedFreq / aliasOf /
  sampleTone / sourceValue / reconstruct / reconstructPeriodic / sampleToneLUT /
  spectrum / runSelfTest / N_DEFAULT=256). The sinc & folding digit-math live ONLY
  here. The TRANSFORM is **imported** from `butterfly/core.mjs` — the core never
  re-types an FFT and never references `dft` (Node-twin grep asserts it).
- The page inlines two **byte-twin** blocks between sentinels: the SAMPLING CORE
  (13734 chars === the module) and the BUTTERFLY CORE (16603 chars === the SAME slice
  `butterfly/index.html` inlines, so "the page's fft IS the Butterfly's fft" is real).
  Node twin re-extracts both and asserts char-identical.
- `N=256` is the SINGLE power of two for the whole bench. Visual presets are
  **coherent** (f·N/fs ∈ ℤ ⇒ one clean stem): clean (fs=16, bins 32/80), wagon
  (fs=8, bin 160 → alias 3 Hz), exact-alias (fs=8, bin 224 → alias 1 Hz). Free-drag
  breaks coherence ⇒ a light Hann window tames leakage; the readout NAMES the active
  mode (coherent ↔ Hann) so the picture never lies.

### The page (two-panel viz on butterfly house chrome)
- TIME panel: faint sinc kernel lobes (toggle) · teal source · gold sample comb
  (FIXED in t — never moves when only the reconstruction changes) · green sinc
  reconstruction (below Nyquist lies on teal; above, peels off to the ghost) · red
  dashed ghost alias through every comb dot. Fold-pulse on the Nyquist crossing.
- FREQ panel (the imported fft): one-sided |X[k]| 0…fs/2, violet Nyquist mirror,
  teal true-line tick (or a pinned arrow when f > fs/2), the ghost stem RED at the
  folded bin while every true below-Nyquist line stays teal. Readout strip names
  f / fs / fs/2 → f_alias and the active windowing mode.
- ONE boolean `isAliasing()` (the foldedFreq PREDICATE f_max < fs/2, NOT a recon-error
  threshold) drives the status pill text + curve colour + spectrum label, so they
  cannot disagree.
- The lede's tolerance `#ledeTol` is fed the LIVE Leg-A maxAbsErr at runtime
  (~5.1e-14), never the bare word "perfect."

### Audio (SHIPPED, muted-by-default, raw-Hz path)
- Two buttons voice a FIXED audible pair: **true 900 Hz** and **"what the samples
  carry" 500 Hz** (= `foldedFreq(900, 1400)`). The visual presets are sub-audible, so
  the ear-proof uses its own clear tones. Honours the estate-wide `ws:pref:muted` key
  (read on load, written on toggle, cross-tab storage listener); first sound waits for
  a click. Self-test is AUDIO-INDEPENDENT (no AudioContext in the Node twin).
- **AUDIO-LENS VERIFIED** (build turn): the rendered 500-Hz alias buffer reads as
  **B4 +21c (500 Hz)** through the audio-lens skill — the ear hears the GHOST, not the
  true 900 Hz (which reads A5, 900 Hz). The one thing the eye-proof can't deliver.
- The **raw-Hz** path was chosen over the Carillon's `semiToFreq` quantization (500 Hz
  reads clearer than snapping to a piano note). Per the design's package rule, the
  Carillon xteaser + pitch-core import + a Carillon-specific sidebar section were ALL
  dropped (they ship together or not at all). The two xteasers that remain are The
  Butterfly (the transform) and The Butterfly's Voice (leakage vs aliasing).

### ⚠️ HONESTY GUARDRAIL — PROTECT THIS (publisher fresh-eyes pass)
The cross to **The Butterfly's Voice** names **leakage ≠ aliasing**: the Voice runs
at fs=48000 with notes far below the 24 kHz Nyquist — it shows **leakage (a smear)**,
NOT folding. This bench shows **aliasing (a fold)**. They are sibling consequences of
one sampling ceiling — *"leakage = smear, aliasing = fold, two faces of one ceiling."*
**Do NOT let any later "simplify" rewrite this into "the Voice shows aliasing"** — that
is the exact over-claim this whole bench refuses. The distinction is load-bearing.

### Registration (5 surfaces + 1 import, all resolve 200)
- Workbench → Computation card (glyph 📶, after The Butterfly's Voice so Butterfly →
  Voice → Sampling sit together; house pattern: div.card + ONE overlay card-link, 0
  nested anchors in the blurb).
- Reciprocal crosses: `↔ the ceiling` .back on **The Butterfly**; a third forward
  xteaser "why the teeth bite →" on **The Butterfly's Voice**.
- The bench imports `fft/toComplex/isPow2` from `butterfly/core.mjs`.

### Verification (browser-live, agent-browser session `sampling-build-cyc27`)
- in-page pill GREEN 7/7 · Node twin 14/14 (incl. a 127-bin alias sweep, a 127-bin
  reconstruct sweep, anti-circularity grep, 2 byte-twin parity checks).
- ~62 fps on a continuous fs-slider drag across the full range · 0 console errors ·
  0 nested anchors · 0 horizontal overflow @1280 AND @390.
- The fold moment driven across the Nyquist line (status flips EXACT ↔ ALIASING; the
  spectrum line reflects to the folded bin).
- `ws:pref:muted` honored across all 3 states (absent → off; "Sound on" writes '0';
  cross-tab '1' forces off) · audio-lens-confirmed the alias pitch (500 Hz).
- `forge --check --all` 30/30 (butterfly family is hand-written — no `.src.html`
  touched; the workbench card edit is a plain edit).
