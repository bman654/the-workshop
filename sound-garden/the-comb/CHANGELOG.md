# The Comb — changelog

*A Sound Garden leaf. Drag one brass delay τ and a comb of notches slides across a glowing spectrum
strip that IS the heard timbre: the first tooth at exactly 1/(2τ), the teeth spaced 1/τ apart — and
as the delay sweeps you hear the jet-plane flange whoosh. Add a signal to a short-delayed copy of
itself and the echo cancels itself wherever it lands a half-cycle out of phase. (Feedforward comb
filter / flanger; one lever drives eye and ear in lockstep. The TIME-domain mirror of The Sidebands:
a delay NOTCHES energy OUT of a spectrum where FM SPREADS energy INTO one.)*

## #326 — born (BUILD/garden)

Grew the garden seed `[exhibit] **The Comb's Teeth**` (sown #325) into a five-file leaf in the
the-sidebands folder mold — the Sound Garden's seen-and-heard comb-filter bench, and its first
comb/flange/phaser piece (grep-confirmed zero before this).

**The hero verb.** ONE drawn object: a glowing cyan **spectrum strip** whose height is |H(f)| over the
audible band (log-f axis), dipping to **coral notch teeth** at (n+½)/τ and cresting at faint **violet
peaks** at n/τ. The strip IS the heard timbre, NOT a transfer-curve plot. Drag the strip left/right
(or focus it and use ←/→, Home = shortest τ; a brass slider mirrors it) to change the **delay τ** over
[0.2,12] ms — and watch every tooth slide. A **echo depth g** slider [0,1] deepens the notches toward
cancellation; an **LFO sweep** toggle auto-sweeps τ (0.4…7 ms at 0.18 Hz) so the teeth slide
themselves into the classic flange. A source toggle colours either broadband **pink noise** (every
tooth audible) or a held **tone**.

**The staged fact.** The page boots at τ=1.0 ms, g=1.0 — so the first thing seen is a deep comb whose
six in-band teeth cut to TRUE nulls (the reveal caption lights coral: "At g=1 the notches cut to a true
zero — total cancellation"). The "▾ collapse the delay (τ→0)" detent drives τ to the floor and draws
the genuinely-flat τ=0 spectrum: "the echo lands on the original: a flat (1+g)× gain, no teeth." **The
negative control:** τ→0 OR g=0 → a flat band, no teeth — the comb is the DELAY.

**The lockstep contract (the soul).** Exactly one `state.tau` (and `state.g`) drives BOTH `draw()`
(heights read from `combMag` only — zero math literals in the draw) AND the live audio: a literal
Web-Audio **delay-and-add** — `source → [dry gain] + [DelayNode(τ) → echo gain g] → sum` — whose
`delayTime` IS τ and whose echo gain IS g, the exact y = x + g·x(·−τ). The LFO sweeps the SAME τ for
both the drawn teeth and the heard whoosh — the eye and the ear cannot disagree.

**The math (single-sourced, proven).** `core.mjs` is the SOLE feedforward-comb authority. The transfer
`H(f) = 1 + g·e^(−j2πfτ)` gives the cosine ripple `|H(f)|² = 1 + 2g·cos(2πfτ) + g²`; it peaks where
the echo lands in phase (f = n/τ) and dips where it lands a half-cycle out (cos = −1). So the teeth sit
at **f = (n+½)/τ — the first at exactly 1/(2τ), spaced 1/τ apart, INDEPENDENT of g.** The gain sets only
the DEPTH: the notch floor is |1−g| (a true zero at g=1), the peak ceiling 1+g. `core.mjs` IMPORTS
`semiToFreq` from `../pitch-core.mjs` (pitch is never re-typed; it anchors only the optional tone). The
page byte-twins both cores between sentinels — so the live comb is drawn from the exact same `combMag`,
proven char-for-char by the Node twin.

**The self-test (machine-ε, five legs).** `runCombSelfTest(τ, g)` is the SOLE oracle, called by BOTH
the in-page pill and the Node twin so they cannot drift. LEG 1: across a τ grid the first notch ===
1/(2τ) to the bit and the tooth spacing === 1/τ to <1e-9, and |H|² at each notch === the dip floor
(1−g)². LEG 2: the closed-form |H|² === |1 + g·e^(−j2πfτ)|² from the complex parts to <1e-12 (two
disjoint computations). LEG 3: a rendered SUM of probe tones — some on notches, some on peaks — leaves
the delay-and-add scaled by combMag(f,τ,g)/2 at every tone to <1e-9; at g=1 the notch tones are
annihilated (≈0) and the peak tones double (≈1). LEG 4: as g sweeps 0→1 the notch floor |1−g| shrinks
monotonically to a true 0 and the peak ceiling 1+g grows to 2, yet the notch frequencies never move
with g (the delay places the teeth, the gain deepens them). LEG 5: the negative control — τ=0 ⇒ |H|² ≡
(1+g)² flat, g=0 ⇒ |H|² ≡ 1 flat (bit-exact). The pill boots green 5/5.

**The Node twin (`core.test.mjs`, 13/13).** Re-proves the five legs, then: the MEASURED spectral nulls
land on (n+½)/τ across a fresh τ grid (a swept render + DFT; the notch tones measure ≈0, the peak tones
≈1); the first-notch/spacing law holds over a fine τ sweep [0.2,12] ms; the notch place is
gain-invariant. BYTE-TWIN parity: the page's inlined COMB CORE slice === core.mjs's char-for-char
(14968 chars), and the borrowed PITCH CORE slice === pitch-core.mjs's. SINGLE-SOURCE: the feedforward
delay-and-add law body is live code in exactly ONE file (core.mjs); core.mjs imports semiToFreq rather
than re-typing it; the notch-ladder law notchFreq is defined in exactly one .mjs.

**The ear-check (`verify.sh`, the audio-lens twin).** Renders the SAME delay-and-add (offline, a literal
DelayNode) on a FIXED 3-tone probe — ONE tone on a comb PEAK (1000 Hz = n/τ) and TWO on comb NOTCHES
(500, 1500 Hz = (n+½)/τ) for the pinned τ=1.0 ms — then the audio-lens reads back the WAVs.
**The two stated settings (the seam):** the LIVE rig sweeps τ/g freely; the heard-headless claim is made
ONLY here, on the SAME law at the pinned probe (all three tones inside the lens's 60 Hz floor / 5 kHz
ceiling, ≥500 Hz apart — far past the 3% dedup). HERO (τ=1ms, g=1): the audio-lens top-3 = {1000 Hz}
alone — the two notch tones ANNIHILATED. NEG-τ (τ=0) and NEG-g (g=0): all three tones present again —
the comb vanished. No clipping on any render (the feedforward gain is bounded, 1+g ≤ 2). PASS.

**Five files (the Sidebands mold honored):** `core.mjs` (the physics + oracle), `core.test.mjs` (the
Node twin), `index.html` (the leaf), `verify.sh` (the ear-check), `CHANGELOG.md` (this). Registered in
the Sound Garden index's 'rigorous voices' rail beside The Sidebands with the time-vs-frequency
cross-note; reciprocal cross-links between the two leaves. NOT a new front-door footprint (no ws:seen —
reached through the Sound Garden room).
