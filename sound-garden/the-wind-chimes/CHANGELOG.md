# The Wind Chimes — changelog

*A Sound Garden leaf. A chime hanging under an eave at dusk, in three dimensions, that you
stand under and orbit. Six aluminium tubes cut so the metal decides the note, a wooden clapper,
a wind sail, and air that gusts and veers. Tap a tube anywhere along its length; slide the cord
and hear the ring collapse.*

## rebuilt — the tubes get a body, and a voice

The room was named twice in NEXT.md as the estate's clearest case of an idea trapped in the
wrong medium: 4,321 lines drawing five tuned tubes as flat gold rectangles that could not swing
toward or away from you, played by an oscillator. Same route, same name, same place on the rack.
Everything under it is new.

**Real metal.** Every pitch is now *cut* rather than chosen. A hanging chime tube is a FREE-FREE
Euler–Bernoulli beam — clamped nowhere, both ends loose — whose modes solve cos(βL)cosh(βL) = 1.
That gives the inharmonic ladder **1 : 2.756 : 5.404 : 8.933 : 13.34 : 18.64**, which is exactly
why a chime is neither a bell (no sub-octave hum) nor a string (no 1:2:3). Length falls out of
E, ρ and the bore: `cutLength(220 Hz)` asks for 825 mm of 25 × 1.5 mm aluminium, and the twin
checks that the tube you get back sings 220 Hz.

**A real voice — the estate's second AudioWorklet in 466 pieces.** Six tubes × six modal
resonators, each mode one complex phasor multiplied by a fixed pole every sample. A strike ADDS
a real number to the phasor, which is an impulse: every mode leaves the hammer in phase and then
drifts apart at its own rate. Mode *n* gets the weight |Y_n(ξ)| at the place the clapper actually
landed, so **tap a tube at its exact middle and the second partial is not there** — 0.5 is a node
of mode 2. The audio-lens sees it in the top-three peaks.

**Real air, in three dimensions.** Every cord can point anywhere on a sphere: state is the unit
vector down the cord plus an angular velocity perpendicular to it, integrated with gravity and
drag as torques. The whole rig hangs too, so a steady wind leans the assembly *together* and
moves nothing relative to anything — every drag force is computed against the wind MINUS that
body's own velocity, so the "buffeting, not pressure" fact the 2-D version had to special-case
now falls out on its own. Hold the wind high and steady and the clapper does lean out and lie
against its downwind tube, ringing nothing, which is what a real chime does in a gale.

**THE ONE CLAIM, and the page tests it live.** A cord clamps what it touches and drains each
mode by **Y_n(ξ_hang)²**. Mode 1 stands still at ξ = 0.2242, which is where every real chime is
drilled. Press **measure it** and the page synthesises a strike at each of 33 hanging positions,
band-passes the fundamental out of the audio it just made, fits T60 to the decay, and plots it —
**measured peak 0.2244 against the analytic node 0.2242**, and the analytic number came out of
bisecting the mode shape with no audio in it at all. Two computations, one answer, on the
visitor's own machine.

The ear-check found something better than what was written down. Hung at its middle the tube does
not merely ring shorter: with the fundamental strangled, the audio-lens **names it as a different
note** — A3 becomes D#5, the second partial, because that is now the loudest thing left. The
spectrograms make it a picture: `node.png` is one long bright band across the whole frame,
`middle.png` is the same band as a short wedge with a higher line outliving it.

**The tubes bend in their own mode shapes.** The vertex shader evaluates the same Y_n(ξ) that
core.mjs does — in float, using the stabilised form, because `cosh(20.42)` is 4×10⁸ and the answer
is order 1, so the naive expression has nothing left in single precision. Amplitudes and phases
come from the same modal envelopes the ear is hearing. Drawn 140× slow and some thousands of times
too large, and the page says so: honest in shape, a liar in size.

Files: `core.mjs` (the beam, the voice, the rig, the measurement — no backtick anywhere in it,
because the page hands the whole text to `String.raw`), `worklet.js` (the audio-thread tail),
`index.src.html`, `core.test.mjs` (10 legs, most with a discriminating control), `render-wavs.mjs`
and `verify.sh` (the ear-check). The estate's air chip is gone: this room owns its own weather now.

## #424 — born (BUILD/garden)

A **delight-first** leaf grown from the garden seed for a wind chime played by the estate's own
air. Five-file leaf in the -bench folder mold (index.src.html → forged index.html, core.mjs,
core.test.mjs, verify.sh, this changelog). **No SPEC** — the piece is claim-free.

**The hero feel.** A head-on hung chime at warm dusk: a brass disc under an eave beam, five graded
bronze tubes, a wooden clapper puck on a cord at dead centre, and a broad wind-sail below it that
the air pushes. Arm the air and the room begins to play itself. A struck tube **blooms and shivers**
and its glow decays on the *same envelope as its sound*. Breath-motes drift with the breeze so the
wind's strength and direction read before you hear anything. There is **no proof pill and no HUD** —
a thin brass control strip carries the air chip and one manual breeze slider, and that is all.

**The one model (single-sourced).** `core.mjs` is the SOLE authority. The clapper puck and the sail
are ONE driven damped pendulum, `θ'' = −(g/L)·sin θ − c·θ' + a_wind(t)`, integrated **semi-implicit
(symplectic) Euler with 8 substeps**, with the tube-crossing test done on the same substep so a fast
swing cannot tunnel through a tube between frames. The page's animation, its live audio, its offline
WAVs and the Node twin all run this one byte-twinned block.

**Two physics calls worth naming, both found by measuring rather than assuming:**

- **The wind force is ZERO-MEAN.** The first cut gave the breeze a steady push, and the sweep showed
  it silenced half the rack: a DC wind parks the clapper against its downwind side and the tubes on
  the other side never ring (at breeze 0.6, tubes B3 and E4 rang *zero* times in 60 s). The truer
  model is also the fix — the tubes, the disc and the clapper all hang from the **same hook**, so a
  steady wind leans the whole assembly together and moves no tube relative to any clapper. What rings
  a chime is the **buffeting**. So `breeze` scales the size of the gusting, and a strong wind now
  sweeps the *whole* rack.
- **The rack has an EDGE.** Driven hard, an unbounded pendulum goes over the top and *rotates* — at
  breeze 1.2 the clapper reached θ = 128 rad, spinning, and rang almost nothing (every tube fell
  inside its own refractory). A real clapper hangs *inside* its ring of tubes and cannot leave it, so
  `THETA_MAX` sits just outside the lowest tube's contact angle with a rebound. A storm is now loud,
  never broken — **LEG 6** holds that line at 4× the strongest wind the room offers.

**The wind→notes mapping is pure geometry, not a rule.** The five tubes hang at fixed contact angles,
**nested**: the highest sits nearest the middle and each lower tube hangs further out, on alternating
sides so the rack hangs balanced. Nothing in the code branches on wind strength — that shape alone
gives "a breeze tinkles the high tubes, a gust plays them all". Measured over 60 s: breeze 0.12 rings
`F#4:90 E4:71 C#4:14` and never once reaches A3; breeze 0.80 rings all five. **The lowest note is the
one the wind has to work hardest for.**

**The tuning is the one correctness CONSTRAINT** (not a theorem, and it gets no accuracy pill — this
is not an estate first). The five fundamentals are the degrees of **A-major-pentatonic** — A3 B3 C#4
E4 F#4 — computed from `../pitch-core.mjs`'s `semiToFreq`, never a re-typed Hz literal. A pentatonic
set has no half-step anywhere in it, so **no chord the wind can strike can sound wrong**.

**The voice is a struck free-free tube, not a bell** — which is why the wing gains no near-duplicate
of the Carillon. Partials on the inharmonic free-free ratios `1 : 2.756 : 5.404 : 8.933`, each with
`env(t) = (1 − e^(−t/τ_atk))·e^(−t/τ_dec,n)`: a ~6 ms rise to a peak just after onset, higher modes
dying first, and longer tubes ringing longer (τ ∝ 1/f). Harder strikes are **brighter**, not merely
louder. Tube lengths are drawn at `L ∝ 1/√f`, which is honest: a free-free tube's f really does go as
1/L², so the eye can read the pitch order off the lengths.

**The air is the literal wind** — this is the room the air chip was worth building for. A `WindField`
adapter polls `Air.state()` each frame and turns the air's own on/off + courtesy axis into the breeze:
arm it and the chimes begin to play with the manual slider still at zero; **mute the estate, or hide
the tab, and the air withdraws and the chimes damp slowly to rest and hang silent** (measured: strikes
fade 21 → 16 → 8 → 0 over 16 s, then ω = 0.046 — a dying-away, not a cut). Time-of-day liveliness is
*derived* from the estate's own `Air.W_TIER` dB tiers rather than invented. Honest coupling, stated on
the page: air.js exposes no per-frame wind scalar, so the gustiness on top is the room's own — this is
not a sample-accurate lock to the wind-bed and does not claim to be. Carrying the air here means
carrying its **score** (`score.mjs` + `score-voices.mjs` as byte-twin slices), because `Air.attach()`
stays disabled until `composeHour` is in scope. The house rule that a singing page should not also wear
the air is deliberately met, not broken: here the air is not a second bed beside the chimes, it is the
**wind**, and the chimes are the instrument it plays.

**The manual breeze is always live and additive**, so a muted visitor — or one who never arms the air
at all — still plays the room fully. **Direct play**: drag the clapper to impart real angular velocity,
flick a single tube to ring just it in dead calm, or use the keyboard (`1`–`5` ring tubes, `space`
gusts). The sound toggle is a real keyboard-reachable radio group.

**Wind is light (accessibility).** A struck tube's glow and shiver are driven by `strikeEnvelope` —
the *same* curve that shapes the audio — so the entire payoff is visible with the sound off: you watch
a tube ring and fade. The twin measures this: the glow tracks the rendered audio's own envelope to
within 2.5%. Reduced-motion damps the parallax, the mote drift and the shiver while keeping the bloom
(verified by CDP media emulation: the payoff fires identically, 26 strikes either way).

**Verification (claim-free ≠ verification-free).**
`core.test.mjs` is the **payoff-liveness twin**, 16/16 — it drives the room's own `gust()` / `step()` /
`strikeTube()`, never a synthetic canvas event. Six shared legs (the wind moves it · a strike fires ·
the strike rises then decays, measured off the audio · in tune by construction · well-formed three ways
· bounded in any wind) plus Node-only re-derivations (the wind→notes mapping is real · a direct nudge
rings in dead calm · the glow IS the sound · the voice is not a bell · the drawing does not lie) and
byte-twin parity for the CHIME CORE, the borrowed PITCH CORE, **and the shipped `index.html`**.

`verify.sh` is the **ear-check** (audio-lens; the loop cannot hear), 6/6 — and it taught the piece
something. A monophonic f0 tracker reads every tube ~15–31 ¢ **flat**, which looked like a tuning bug.
Controls settled it: a pure 220 Hz sine reads +4 ¢ through the same lens, and the *same envelope on
harmonic partials* reads +3 ¢ — so the deviation is the **inharmonic overtones pulling the estimator**,
not the tube (the same reason real bells have a "strike tone" literature). The tuning is therefore
pinned with a **Goertzel probe** at the exact target versus ±50-cent neighbours: **all five
fundamentals land at +0.0 ¢**, each dominating its neighbourhood, with the lens naming every note
correctly. Also asserted: rise-then-decay with one onset on every tube; lower tubes ring longer
(10 %-tails 8.52 → 5.10 s); dead calm is digital silence (silence-ratio 1.0); nothing clips including
the five-tube gust; and the **A/B against a real Carillon render** — the chime's octave-below bin holds
**0.16 %** of its fundamental against the carillon's **164 %**, because a free-free tube has no
sub-octave hum and a bell's hum is its signature.

**One live-path bug the browser caught that the offline render could not.** The offline mix runs every
strike through the core's soft tanh limiter, so a render can never clip — but the *live* path plays each
strike as its own `AudioBufferSource` and the graph sums them, which the core's limiter never sees. In a
gale the pre-limiter sum measured **5.08×** full scale; a `DynamicsCompressor` was not a fix (at full
wind it reduced by only ~2 dB and let the output run to **1.30**). The fix single-sources the limiter
instead: the live chain bakes **the core's own `limit()`** into a `WaveShaper` curve, so both paths obey
one identical law. Re-measured at maximum breeze *and* air armed together, the output now peaks **0.70**
— bounded by construction, still loud (RMS 0.22).

**Browser-verified** on a served origin: 59 fps, zero console errors or warnings, no horizontal overflow
at 375 px, and direct-touch confirmed with **true input-level CDP clicks** (each tube rang its own note;
a control click on empty sky rang nothing).

**Placement.** A DEEPEN, not a detach: it grows the Sound Garden rather than founding anything. It joins
the rack as a card in `instruments.js`, is written into the README's instrument table and the front
page's "rigorous voices" line, and twin-links reciprocally with **the Squeal Bench** (its sibling
delight leaf) and **the Carillon** (its tuned-strike kin — named on both pages precisely because the two
are so easily confused, and are not). No new front-door footprint, no `ws:seen`.

## #424 — publisher's pass ("Weathervane")

**The rack card shipped with no art, and the page had been told to hide the lack.** The Sound
Garden rack derives a card's thumb from its `file` entry — `assets/${file minus .html}.png`.
This is the first leaf in the rack to live in its own FOLDER, so that derivation asked for
`assets/the-wind-chimes/index.png`: a nested path under a flat assets directory, a 404 that
could never exist. The card's inline `onerror="this.style.display='none'"` then swallowed the
miss without a sound, so the card rendered as a bare gradient beside ten cards carrying real
frames — invisible to a console check, visible only to someone who looked at the rack.

Fixed at the root, in `sound-garden/index.html`:

- **the derivation** now names a foldered leaf by its FOLDER rather than by the literal `index`
  (`the-wind-chimes/index.html` → `assets/the-wind-chimes.png`); flat leaves are unchanged, and
  no per-entry `thumb:` override is needed. The next nested leaf cannot trip the same wire.
- **the silent `onerror`** became a handler that still degrades gracefully for a visitor — an
  empty frame reads better than a broken-image glyph — but **console-warns the missing asset by
  name**, so a miss is findable in the console and not only in a screenshot.

And the thumb itself was forged **in-house from this room's own renderer**: the live stage posed
at the card's 16:10 at 2× (640×400), the real breeze control driven to a gust, and a frame caught
with the clapper swung out (θ=0.33) and six tubes lit. Note for whoever does this next — a bare
`canvas.toDataURL()` exports the chime floating on **transparency**, because the dusk sky is the
canvas's *CSS* `background` gradient and was never in its pixels; the export re-lays that same
gradient (`--sky-hi` → `--sky-lo` → `#0b0812`) into an offscreen canvas and composites the frame
on top. → `sound-garden/assets/the-wind-chimes.png`.

Nothing in `core.mjs`, `index.src.html`, or the twins was touched. Re-verified after the fix:
Node twin **16/16** · `verify.sh` **6/6** · `forge --check --all` **166 current** ·
`manifest --check` **OK** (432 pieces) · rack thumbs 10/11 loading (the Monochord's is a
pre-existing gap, now sown as a `[bug]`).

**Independently re-derived in review** (not taken from the build's own report): the headline
claim, measured against the real core across the actual slider→breeze map (`v/100 × 1.25`) —
at slider 5–12, where the label reads *a breath*, the low A3 and B3 ring **zero** while the
bright tubes tinkle; at 16 (*light air*) the low tube joins; at 100 all five ring near-evenly.
The prose is true and the wind-words sit on the right thresholds. Live on the real control:
dead calm 0 strikes (θ=0.017, at rest), slider 30 → 35, slider 100 → 31 across all five. And
the conceit itself — a true input-level click on the air chip with the slider left at **0** drove
breeze to 0.3106 and rang **145 strikes across all five tubes in 25 s**.
