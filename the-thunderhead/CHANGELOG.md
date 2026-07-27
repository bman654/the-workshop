# The Thunderhead — a storm, and the shape you hear · changelog

*A dark plain at the far end of the promenades. Pull a flash out of a
cumulonimbus, wait, count, and then listen to the shape of what you saw.*

**The claim: thunder is the shape of the bolt, played back in time.** From the
geometry alone — no audio in it anywhere — the page says when the first bang
lands, when the roll ends, and what the loudness does in between. Then it
measures all three off the waveform it rendered, and prints both.

---

## Cycle 493 — first light

### What is running

- **`core.mjs`** — pure, DOM-free, no GL, no AudioContext. Four things:
  - **A dielectric-breakdown model** (Niemeyer–Pietronero–Wiesmann 1984).
    Laplace's equation relaxed by SOR on a lattice, the channel pinned at one
    potential and the sink at another, one cell added per step with probability
    going as the local field to the power η. Nobody draws a zig-zag: the
    branching, the tortuosity and the fractal dimension all fall out of that
    rule. `makeDischarge` is a *stepper*, so a page can grow a flash across
    frames without dropping one.
  - **A flash**, built of two discharges: a cloud-to-ground leader on a vertical
    lattice (96 × 132 cells of 14 m) and an intracloud sheet on a horizontal one
    (160 × 56 of 34 m), joined at the top and embedded in world metres, each
    branch swung to its own azimuth so the thing is genuinely three-dimensional
    for the sound to come off. Every segment carries the charge its subtree
    drained — which *is* its current during the return stroke.
  - **The air**: ISO 9613-1 atmospheric absorption, the real closed form with the
    oxygen and nitrogen relaxation frequencies. This is the whole reason a far
    flash is a rumble and a near one is a crack.
  - **The sound**: every one of ~2,700 segments radiates an N-wave when the
    return stroke passes it, summed at the listener with its own travel time.
    Because arrival time *is* distance / c, the absorption a sample has suffered
    depends only on when it arrives — so the air is applied as a time-varying,
    block-wise, **minimum-phase** filter with the range read straight off the
    clock.

- **`core.test.mjs`** — the twin, **110 checks, green**:
  - **A** · absorption against ISO 9613-2's published table — 48 numbers, six
    atmospheres, all within 3 %.
  - **B** · the filter realises that absorption to 0.7 dB at three ranges, and
    its energy sits at the front of its window (minimum phase) where a
    linear-phase design would centre it and smear the onset *backwards*.
  - **C** · the channel is one connected tree that reaches the ground; the box
    dimension falls monotonically with η (1.44 → 1.06 over η = 1…4, averaged
    over six seeds), and η = 2 lands at 1.23, inside the 1.1–1.4 measured on
    real flashes.
  - **D** · Rc = √(E_l/πp₀) and nothing else; the shock stretches as r^¼; Rc goes
    as the current.
  - **E** · **the claim**, at six azimuths: predicted first bang vs heard first
    bang agree to **under a millisecond**, end of roll to under 20 ms.
  - **F** · the same flash rolls for 7.8 s whole and claps for 1.6 s with the
    hidden sheet muted — and the first bang does not move.
  - **G** · the loudness envelope tracks the channel's distance histogram
    (r = 0.95 / 0.84 / 0.72 at 1.2 / 2.6 / 6 km).
  - **H** · a time-domain synthesis and a frequency-domain energy sum agree to
    1.8–3.4 dB rms across ~25 third-octave bands spanning 60 dB.
  - **I** · determinism, sample for sample; the FFT round-trips.

- **`render.js`** — WebGL2 in five passes: a ray-marched cumulonimbus (density
  from an RG8 3-D noise volume, moonlit and self-shadowing) at 0.55× into an HDR
  RGBA16F buffer; a blit; the channel as instanced camera-facing quads, additive,
  **occluded by the cloud transmittance the scene pass carries in its alpha**; a
  two-octave bloom; a filmic compose with rain lit by whatever the sky is doing
  this instant. The march is dithered with an interleaved gradient rolled by the
  golden ratio, and the step count adapts to the measured frame rate.

- **`index.src.html`** — the room. Drag to walk round the storm, a distance dial
  (0.6–7.5 km), an η dial, a whole-flash / visible-bolt-only switch for the
  sound, and **prove it**: two plots — the loudness envelope against the
  geometric distance histogram, and the FFT of the rendered sound against the
  frequency-domain energy sum — plus the four numbers. While the thunder rolls, a
  bright band runs along the channel at the speed of sound, so you can watch
  which part of the sky you are listening to.

### What the model does not claim

Stated on the page's own card, not buried here: the N-wave stretching law is
fitted to measurements rather than derived; spreading is taken as 1/r (a true
weak shock decays a little slower before it linearises, which is small next to
the absorption); the sharp *crack* of a strike a few hundred metres off is a
near-field shock that is not modelled; and the **small-speaker lift** is a
playback EQ, not physics — thunder is a 40–150 Hz sound and a laptop cannot make
40–150 Hz, so there is a labelled +14 dB shelf in the playback path. Every number
on the card is measured on the buffer *before* it.

### Things that were learned the hard way

- **A hand-rolled camera basis with `right` on the wrong side flips the
  ray-marched pass and not the rasterised one.** The cloud fell to the bottom of
  the sky and read as a lighting bug for three iterations.
- **A truncated linear-phase FIR has a stopband floor.** At 127 taps the air
  filter leaked 27 dB of 3 kHz through a filter that was supposed to be 90 dB
  down, and lost 4 dB at 50 Hz — which showed up only as a measured spectrum
  disagreeing with a predicted one for no visible reason. Minimum phase fixed
  both that and the pre-ringing.
- **`prove it` must compare the waveform against the geometry *that waveform came
  from*.** The page used to swap in the next flash when a roll ended; read live
  state instead of the frozen shot and the panel quietly answers a question
  nobody asked.
- The crackle in thunder is *not* the thin branches. Thin branches really do make
  shorter pulses (Rc goes as the current), and when you add the energy up they
  land 36 dB down and are inaudible. The comment claiming otherwise got deleted.
