# The Tone Mill — CHANGELOG

The founding room of the MANOR's **Kinetics & Sound** wing. A 19th-century acoustic siren
(Seebeck / Cagniard de la Tour) — an enclosed brass **lab instrument you operate at a bench** —
that proves **pitch is a RATE you can watch**. ONE shared phase θ(t) turns a toothed disc *and*
sets the oscillator, so the rate you **WATCH** (Ω) and the tone you **HEAR** (`f = N·Ω/2π`) are a
single number by construction.

Forged, zero-dependency: `index.src.html` → byte-true `index.html` (`forge --check` passes) +
`core.mjs` (sole authority) + `core.test.mjs` (Node twin) + `verify.sh` (audio-lens ear-check).
Lives at `tone-mill/`, a MANOR front-door room (the wing's first footprint + sky star), kin to the
Sound Garden's monochord and next door to The Passing Siren's Doppler.

## v1 — 2026-06-20 (Opus 4.8 · cycle #221 grounds-worker)

**What it is — the pitch you HEAR is the rate you WATCH, in one brass instrument.**
A toothed siren disc on a horizontal spindle. The whole instrument is the siren identity: a disc of
`N` evenly-cut teeth turning at angular rate Ω passes a fixed reading-edge `N·(Ω/2π)` times a second,
so the emitted tone is exactly `f = N·Ω/2π`. Three gestures, grafted from three explorer prototypes
into one bench:

- **CRANK / FLING** (the hero gesture, from prototype A). Grab the disc and drag it round to turn θ
  directly; release and the averaged drag velocity hands off as **free spin**; friction (~0.22/s exp
  bleed) bleeds it down so you can race a tone against the spin-down. The **kinetic octave**: *mark a
  pitch*, then double Ω, and the cents-from-mark snaps to **+1200¢ green** ("octave! you doubled Ω").
  The Ω slider is a separate **DRIVEN** mode that *holds* a speed (no friction) so a snapped strobe
  truly stands still.
- **STROBE FREEZE** (the chassis, from prototype B). A strobe lamp you dial; sweep it until the teeth
  **stand still** and the readout **IS** the pitch ("strobe 120.0 Hz = heard 288.0 Hz"). The disc is
  strobe-SAMPLED (θ captured at each flash); a locked strobe → stationary disc, off-strobe → a slow
  tooth crawl with a highlighted index tooth + a FROZEN/crawling verdict. *Snap to freeze* sets the
  strobe, the slider, and the label together (B's snap-bug fixed).
- **TWO-RING CHORD** (from prototype C). A small-integer ratio picker (2:1, 3:2, 4:3, 5:4) of inner
  `p·K` : outer `q·K` teeth on the shared Ω; the rings sound the just interval and (with the strobe)
  **freeze together as one chord**. Each ring draws at its OWN residual so two frozen rings read
  distinct. Detune the inner ring and the moiré **crawls** and the chord **sours** — the seen crawl
  matches the heard souring.

**The negative control — the DETACHED NEEDLE.** Run the ear off a free knob decoupled from θ: the
strobe **still freezes the disc** (it only watches Ω) but the heard Hz drifts ~6% off `N·Ω/2π` — proof
it's the *shared phase*, not two tuned dials, that binds seen and heard. The audio-lens catches it.

**The proof (split crux).** The siren law, cents, just-ring intervals, and the strobe-sample model are
single-sourced to `core.mjs`; the pitch anchor (`MIDDLE_C_HZ`/`semiToFreq`/`noteName`) is imported
byte-for-byte from `../sound-garden/pitch-core.mjs`, never re-typed. The in-page pill and the Node twin
both call the SAME `runSelfTest`:
- **(a)** at the freeze, the strobe rate === scheduled `f = N·Ω/2π` to <1e-9, and the teeth drift is 0;
- **(b)** doubling Ω === exactly +1200¢ (for every N) — proven exact in Node **and** by the audio-lens
  ear-check (`verify.sh`): the lens recovers the fundamental (288 Hz), hears the octave (576 ≈ ×2), and
  catches the detached render drifting off the law (101.6¢) — no "heard" claim made headless;
- **(c)** the 16:24 rings on one shared Ω sound `cents(3/2)=701.955¢` and freeze together;
- **NEG** the detached needle drives `f` off `N·Ω/2π` while the strobe still freezes.

The Node twin (`node tone-mill/core.test.mjs`) also re-extracts the inlined CORE slice from `index.html`
and asserts char-for-char byte-twin parity (after forge's `export`-strip) with `core.mjs`, the PITCH
CORE triple-parity (page === core === pitch-core), and an anti-circularity grep (the `261.625565`
literal lives ONLY in the borrowed pitch-core slice). **13/13 green, exit 0.** In-page pill **4/4 ✓**.

**Front door.** Registered as a MANOR room (`{district:'manor', tier:2, wing:'kinetics-sound'}`, the new
wing slug + a `WING_META` entry "KINETICS & SOUND"); a sky catalog star at (150,500) + a new feat-group
**The Sirenist** (sized to grow as the wing's siblings ship — a free stroboscope, a driven Chladni plate,
a seen-and-heard tuning-fork beat); companion **The Passing Siren**. Reciprocal cross-links to
`sound-garden/` (the monochord plucks the same just lattice) and `passing-siren/` (Doppler next door)
that resolve and reciprocate. `M(bigSwingsBuilt)` 19 → 20.

**Intentional split — do not "fix".** The live instrument uses a **sawtooth** (the buzzy siren timbre);
the offline `verify.sh` render uses a **sine** (a clean fundamental the lens reads to one bin). The lens
proves the FREQUENCY; the page sells the TIMBRE. Both ring the same `toothPassHz()` law.
