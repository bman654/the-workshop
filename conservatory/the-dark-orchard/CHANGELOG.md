# The Dark Orchard — CHANGELOG

## 2026-07-30 — built

A moonless orchard, a bat, and a moth. The estate had eighty-nine pieces about
waves and not one about the animal that uses them to see. This is that.

**What it is.** A first-person room with **no light in it**. One WebGL2 fragment
shader sphere-traces a distance field; because the eye is the bat's mouth, the
marched distance *is* the one-way path, so `2t/c` is the echo delay. Nothing on
the screen is drawn until its echo has had time to come home, and when it is
drawn, its colour is the **pitch that came back** — the air is a low-pass filter
whose corner comes towards you, so near things read cold silver and far things
read ember. Then nothing.

### The two arguments the room is built on

**1 · The moth hears you first.** Your shout spreads once on the way out; the
echo spreads again on the way back. So the moth listens on a 20 dB/decade law
and you listen on 40, and the asymmetry decides the hunt. At a full 110 dB
(priced at the sweep's own 60 kHz midpoint) the moth hears you at **8.4 m** and
you hear the moth at **4.0 m**. It gets about a second — exactly enough to fold
its wings and fall into the grass, which the room lets it do, and then it is
gone. Turn yourself down: 20 dB costs a one-way listener a factor of ten in
range and a two-way listener only three, so the gap closes from underneath and
at **SL = 2L_moth − L_bat + TS + 20 = 80.0 dB** it reverses. Below that you find
the moth before the moth finds you. That is the barbastelle's whole trick, it is
two lines of algebra out of two spreading laws, and **it is also the game**: at
full voice you cannot catch anything.

**2 · Two shouts, one theorem.** The FM sweep (82→38 kHz, 3 ms) has 44 kHz of
bandwidth, so matched-filtered it compresses to `c/2B` = **3.9 mm** and its
time–bandwidth product is **132** — a metre of pulse resolved to four
millimetres of answer. The CF tone (82 kHz flat, 60 ms) has `1/T` = 17 Hz of
bandwidth, so its range profile is **10.3 m thick**: press it and the orchard
stops having edges, the two fence posts merge, and the colour goes flat because
one pitch cannot tell you a range. But 60 ms holds **2.7 wingbeats**, so a
fluttering moth modulates a single echo and you hear the flutter directly — while
an FM bat calling ten times a second can only *sample* that 45 Hz wing and
aliases it to 5 Hz.

### The sound is the same computation as the picture

82 kHz is four octaves above the top of human hearing, so the room does what a
**time-expansion bat detector** does: it plays the whole acoustic scene at 1/N
speed, which divides every frequency by N exactly and leaves every delay and
ratio alone. The *same* N slows the picture — so the echo lands in your ear at
the instant the tree lights up. At ×1 the call really is 82 kHz and the room is
**silent and says so** rather than aliasing a lie into the audible band.

The echo train is built by casting a few hundred rays through the same distance
field, and the frequency-dependent absorption is applied **along the pulse**
rather than as a scalar: in a linear sweep the instantaneous frequency is a
function of time within the pulse, so "the air eats the top of the sweep first"
is exact here.

### Verified

* `orchard.test.mjs` — **92 checks, green**. ISO 9613-1 against its published
  table; J1 against tables; every tap delay exactly 2d/c; range resolution
  *measured* by matched-filtering the room's own synthesised echoes (FM resolves
  15.6 mm and fails at 1.3 mm; CF fails at 40 cm and at 2 m); the wingbeat read
  back as 43.9 Hz inside one CF call and aliased to 5 Hz by a 10 Hz sampler; the
  crossover level closed-form and by bisection, both 80.0 dB; time expansion is
  frequency division.
* **The GPU's distance field against the twin's, live** — the SDF and the march
  loop are *generated* by `orchard.mjs` from the same constants the twin reads,
  and the page marches 16 rays a second on both and prints the worst
  disagreement. It reads 0.0 mm.
* Rendered WAVs through `tools/audio-lens`: the bare CF call's spectral centroid
  is **5125 Hz** at ×16, which is 82000/16 to the hertz. Nothing clips
  (scene peak −4.15 dBFS). *(The pitch tracker calls that same tone G#6 — a
  clean subharmonic pick at exactly f/3. Two estimators disagreeing means quote
  neither without a third; the centroid and the twin's zero-crossing count agree,
  so those are what the page quotes.)*
* Real browser, real pointer: gate → chirp → fly → steer → the moth turns away
  at 8.4 m, dives at ~3.4 m, reaches the grass and is gone; dropped to 76 dB it
  never hears the approach and is taken. 60 fps at 0.92 render scale.

### Honest and not exact, on the page as well as here

Geometric acoustics (one ray per path, fair while 8.6 mm is small against what
it hits — which is why the moth is *not* a ray but a point target of stated
strength). One bounce, no reverberation. The reveal is computed from where you
are now rather than where you were when the call left (0.3 m at 10 m, at
5 m/s). Reflectivities are a table. The afterglow is a decision, not physics.
The piston's exact nulls are floored at −17 dB because a real mouth is not a
perfect circle, and the ears are one broad cardioid rather than a second mouth.
The display gain rides your voice back up by 80% of what a whisper costs,
because otherwise whisper mode is a black screen — the numbers never do.

### Engines

`tools/ws/ws.js` (mute + breadcrumb) · `./orchard.mjs` (air, beam, orchard,
echo, moth — Node twin `orchard.test.mjs`) · `./render.js` (the march, the
bloom, the composite). The Conservatory's planter-light preview imports
`orchard.mjs` too, so the depth of the world in the thumbnail is the depth of
the world in the room.
