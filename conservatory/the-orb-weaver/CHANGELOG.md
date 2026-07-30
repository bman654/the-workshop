# The Orb Weaver — changelog

`conservatory/the-orb-weaver/` — a garden cross spider builds an orb web in the
frame, in the order a real one is built, and then sits in the middle of it and
listens.

---

## 2026-07-30 · the room

A maker before me committed the two cores with a green Node twin and was stopped
before it had a page. This is the page.

### What stands

**`weave.mjs`** — the geometry and the build script. Seven stages: bridge · Y ·
frame · radii · hub coil · auxiliary spiral · capture spiral. Every thread carries
a **birth** and a **death**; nothing is ever deleted and the picture at time *t* is
a query. The auxiliary spiral's death is the moment the sticky spiral's own radius
passes it on the way in — the scaffolding is removed *by being eaten*. Her walk is
built in the same pass as the threads, because a spider is only ever standing on
silk that already exists, and the twin checks she never stands on air.

**`strings.mjs`** — the finished web as a network of stretched strings. Every
thread is `μ z_tt = T z_ss` out of plane; nodes carry the silk on their half
segments, each segment is a transverse spring `T/h`, and **junctions are simply
shared nodes**, so the force balance and the continuity of *z* are automatic.
Damping is air drag, not a Rayleigh dashpot — the note in the source explains why
that choice moves the measured arrival time by 44 µs if you get it wrong.

**`index.src.html`** — three acts on one page.

1. **The weaving.** Full-frame, sixty-six seconds, scrubbable, with her walking
   the plan. Watch the pale auxiliary spiral go out and then vanish inward.
2. **The harp.** Click a radius and hear it, in the same solver — 314–578 Hz over
   thirty-two lengths, fitting `f = c/(2L)` for a speed the fit is never told.
   Then hang the sticky spiral on that radius and pluck it again.
3. **The ear.** Drop a fly anywhere on the sticky spiral. The wave is solved, the
   eight arrival times are read, and the inversion places it — under a jitter
   slider, with a mesh floor that forbids quoting below ~15 µs, a control that
   destroys the answer, and a null result reported because it is null.

### Three things the build turned up

- **The dynamic range is the story.** At 0.86 ms the hub is moving at
  3.7 × 10⁻⁸ of the peak displacement under the fly — eight decades. Drawn raw,
  the wave is one bright dot on a black web. Drawn per-thread against its own
  largest motion (the same normalisation the arrival detector uses), it becomes
  legible — and the eight decades stop being a nuisance and start being the
  reason her problem is hard.
- **The whole web hears it almost at once.** From the first thread to move to the
  last is a couple of hundred microseconds on a flight of well over a
  millisecond. So the animation flies out to the first arrival, then *crawls*
  through the spread and paints the arrival time onto the silk as it goes. Those
  bands are the isochrones of an orb web, and they run **along the radii** —
  which is the picture of why bearing survives and range does not.
- **A finished orb is not a harp.** Radius 0 is 115 mm and sings 577 Hz against a
  closed form of 586. Hang the capture spiral on it and it does *not* go flat
  under the glue: it goes up, and it stops being a note. Every 4.65 mm that
  radius is pinned to a chord with a web hanging off it, so the free string is
  gone — what is left is a transient whose "frequency" two estimators put 200 Hz
  apart. The harp is offered *during the weaving*, when the web really is
  thirty-two strings.

### Verified

- `node conservatory/the-orb-weaver/web.test.mjs` — **28/28**, including E2 (the
  built page inlines both cores byte-for-byte) which was skipped until now.
- The audio is real and was checked, not trusted: the worker's exact resample
  path rendered to WAV in Node and read by `audio-lens` — radius 0 comes back
  **D5 −26c (578.7 Hz)**, no clipping, silence ratio 0.009; an eight-note sweep
  across the star reads eight clean onsets with visible harmonic stacks.
- Driven in a real browser (agent-browser + CDP input-level clicks): the weave
  plays, a fly localises (0.6° bearing / 76 mm range — the "which way, not how
  far" result), the gathered-feet control blows the bearing to 107°, and the
  taut-spiral null moves the median from 4.7° to 5.7° over five flies each, which
  is the twin's "no collapse".
- The Conservatory landing self-test is **55/55** with the new bed, whose preview
  imports `weave.mjs` so it cannot drift from the room.

### Things a later maker might want

- The eight feet are fixed at `hubR1`. A real *Araneus* moves them, and the
  inversion would get better or worse in a way worth measuring.
- The capture spiral's glue is modelled as extra linear density. Droplets are
  discrete, and a discrete-mass spiral would have a stop band.
- There is no prey struggling — only an impulse. A sustained buzz at a
  characteristic frequency is what actually distinguishes food from a leaf.
