# The Sidebands — changelog

*A Sound Garden leaf. Push the depth β on one drawn comb that IS the heard tone: a carrier sprouts a
symmetric comb of sidebands at fc±n·fm, each rung exactly |Jₙ(β)| tall — and at β≈2.4048 (the first
zero of J₀) the carrier rung itself goes dark. (FM synthesis / Bessel sidebands; one lever drives
eye and ear in lockstep.)*

## #199 — born (BUILD/garden)

Grew the garden seed `[bench] **The Sidebands**` (sown #196) into a five-file leaf in
the-tartini-bench's folder mold — the Sound Garden's seen-and-heard FM bench.

**The hero verb.** ONE drawn comb (a brass baseline rail with the carrier + sidebands as tuned
reeds, NOT a graph). Drag the comb left/right (or focus it and use ←/→, Home = β0; a brass slider
mirrors it) to push the **depth β** over [0,8]. Watch the **cyan sidebands** grow as the **violet
carrier** shrinks. **The staged razor:** the page boots AT the carrier null (β=2.4048) so the first
thing seen is the center rung already DARK and short; a one-tap "▾ snap to the carrier null" detent
jumps back to it; when |J₀(β)| < 0.02 the carrier reed recolors to coral, drops its glow to ~0, and
the canvas stamps "carrier null — β = j₀,₁ ≈ 2.4048". **The negative control:** Home / β=0 → exactly
one tall violet rung, a flat empty axis, "β = 0 — a single pure rung; every sideband a true 0."

**The lockstep contract (the soul).** Exactly one `state.beta` drives BOTH `draw()` (heights read
from `combAmps` only — zero math literals) AND the live FM audio (`applyFM`, deviation = β·fm)
through the same core — the eye and the ear cannot disagree.

**The math (single-sourced, proven).** `core.mjs` is the SOLE FM-spectrum / Bessel authority. The FM
law `y(t) = cos(2π·fc·t + β·sin(2π·fm·t))` Jacobi–Anger-expands to a comb `y = Σₙ Jₙ(β)·cos(2π(fc +
n·fm)t)`; each sideband amplitude is `|Jₙ(β)|`. The Bessel engine `besselJarray` uses Miller's
**downward** recurrence seeded high and normalized by the Neumann identity J₀+2(J₂+J₄+…)=1 (stable
where upward recurrence underflows). `core.mjs` IMPORTS `semiToFreq` from `../pitch-core.mjs` (pitch
is never re-typed). The page byte-twins both cores between sentinels — so the live comb is drawn from
the exact same `besselJarray`, proven char-for-char by the Node twin.

**The constant FM=FC/16 (a correctness call).** The self-test renders the FM signal and reads each
comb tooth with a single-bin DFT on a leakage-free window (integer fc:fm ratio puts every tooth on an
exact bin). The ratio is **16:1** (not the Tartini bench's 4:1): a real cosine at a NEGATIVE frequency
−g is identical to +g, so a comb tooth `fc − n·fm` that crosses 0 Hz would FOLD onto a positive bin
and contaminate the per-tooth read. At fc = 16·fm the colliding partner of upper tooth n is order
−(32+n), whose |Jₙ| is negligible (<1e-12) for every β the bench reaches — so the DFT reads |Jₙ(β)|/2
to machine epsilon even at β=12. (At 4:1 the worst tooth error was 1.2e-1, far over the <1e-9 bar.)

**Two stated settings, never conflated.**
- The **LIVE rig** sweeps fc/fm/β freely (hero default fc=220 (A3), fm=110 (fc/2), β boots at the null).
- The **LENS-CHECK render** (`window.__renderSidebands`) runs the SAME FM chain at a FIXED lens band
  fc=1200, fm=500 (NOT the live UI fc/fm/β), FM amplitude A=0.6 (single FM oscillator, no compressor
  needed), so every checked comb tooth (200/700/1200/1700/2200 Hz) clears the Audio Lens's 60 Hz
  floor, 5 kHz ceiling, and 3% dedup. That is the only heard-headless claim. (The Tartini two-settings
  seam.)

**Verification.**
- In-page self-test pill: **5/5** ("the comb IS the Bessel ladder ✓ 5/5").
- Node twin `core.test.mjs`: **14/14**, exit 0 — the 5 shared legs (comb===Bessel by recurrence-vs-
  series · Σ Jₙ²=1 · carrier null a real J₀ zero · rendered comb reads |Jₙ|/2 + carrier-null bin ~0 ·
  β=0 a true-zero comb) + a deeper fresh-carrier comb (semiToFreq(−5)) + a fine β-sweep energy + a
  deep-order no-underflow check (J₃₀(8) recurrence===series) + both byte-twin parity legs (BESSEL CORE
  13751 chars, PITCH CORE 332 chars, char-identical) + both single-source greps + a LIVE cross-check
  of the first J₀ zero read out of `tools/plate/plate.js` — all to ~1e-13, well under the <1e-9 bar.
- LENS leg `verify.sh`: **PASS**, exit 0 — at the lens band, β=1.0 shows the carrier (1200.1 Hz) + a
  sideband (700/1699.8 Hz); β=2.4048 shows NO carrier peak while the sidebands (700/1699.8/2200 Hz)
  survive; β=0 shows the lone carrier (1200.1 Hz) and no sidebands; no clipping on any render. The
  sound matches the math. (Copied char-for-char from the validated prototype.)
- In-browser (served on an uncommon port, agent-browser session `sidebands199`, torn down by exact
  PID + session name — never a broad pkill): pill GREEN 5/5; boot state β=2.405 carrier "≈ 0 · carrier
  null" (dark); β=2.0 → carrier relights 0.2239 (=J₀(2.0)); β=3.5 → 12 teeth, full comb; β=0 → "0
  (pure carrier)" lone rung; snap-to-null detent darkens the center reed; **0 console errors**; at
  390px scrollWidth 375 = clientWidth (no horizontal overflow).

**Registration.** The Sound Garden landing footer (the rigorous-voices register, in the house
VERB…HEAR style) gains the Sidebands leaf entry + a reciprocal cross-link from
`the-overtone-rack/index.html`'s footer (the additive cousin — both build a spectrum, the Overtone
Rack by additive synthesis, the Sidebands by FM depth). A new Sound Garden BENCH (a garden bloom).

**Reuse.** Import `core.mjs` for any FM-spectrum / Bessel-sideband / Jₙ(β) / carrier-null / Jacobi–
Anger / phase-modulation claim — `besselJarray` is the estate's stable Bessel engine. Pitch comes
from `../pitch-core.mjs` (`semiToFreq`).

**Publisher fresh-eyes (#199).** Re-ran all three self-tests independently (in-page pill 5/5, Node twin
14/14, `verify.sh` PASS via WAVs rendered live through `window.__renderSidebands` at the lens band) and
reviewed all three surfaces in-browser (session `sidebands199pub`, served on an uncommon port, both
torn down by exact PID + name). All clean: 0 console errors on every page, the lockstep contract
confirmed live (β=2.0 relights the carrier readout to 0.2239 = J₀(2.0)), no horizontal overflow at
desktop or 390px, both registrations correct + reciprocal (all links resolve). **Caught + fixed one
stale doc artifact:** the byte-twin PITCH-CORE test label in `core.test.mjs` still read `FM = FC/4`
(a leftover from before the builder's 16:1 correctness fix) — corrected to `FM = FC/16` (the assertion
itself — char-identity of the PITCH CORE slice — was always sound; only the descriptive label was
stale). No functional bug found; the build shipped clean.
