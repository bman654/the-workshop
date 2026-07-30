# The Belfry — changelog

## Built 2026-07-30 · *The One Who Went Up The Ladder*

Started from two cores a maker before me left dirty in the tree — `bell.mjs` (the
two coupled pendulums) and `method.mjs` (Plain Bob Minor, truth, the blue line, the
parity proof). Both were unrun: `bell.mjs` threw `REST_SPEED is not defined` on its
first call. Finished them, then built the room around them.

### What runs

| | |
|---|---|
| `bell.mjs` | the bell and the clapper as two coupled pendulums, RK4; the balance, the timing law, the voice of a bell. `Swinger` is a live stepper so the room and the twin share ONE integrator. |
| `method.mjs` | place notation, leads, truth by Lehmer rank, the blue line, the extent search |
| `ringer.mjs` | six ringers, each a controller with one stroke of dead time |
| `geom.mjs` | the bell chamber as triangles: the bell profile, the wheel, the frame |
| `worklet.js` | 54 modal resonators, nine English partials per bell |
| `belfry.test.mjs` | 69 checks. `bash verify.sh` runs it plus the audio-lens pass. |

### What was wrong on the way, and worth remembering

- **The log law has a POLE and it is not at zero.** The fall time from the balance
  is `t = a − b ln(ε − ε*)` with ε* = 0.70° *past* upright — the clapper lying on the
  trailing soundbow holds the bell over. Fitting against `ln ε` instead still gives
  R² 0.88 and a slope 60% wrong. R² 0.999999 against the right variable, and the
  fitted `b` matches `1/λ` from a 2×2 linearisation to 0.07%.
- **The blow is the FIRST contact of a swing.** Taking the last one silently made
  the timing law wrong by a tenth of a second on the swings where the clapper
  bounced twice, and read as an integrator problem.
- **A bisection must keep its best FEASIBLE probe, not its last one.** The upper
  end of the bracket is a rejected pull; the last probe lands there about half the
  time. That was one catastrophic blow in forty.
- **A fixed-step integrator asked to advance a fraction of a step does nothing.**
  At the >1000 fps a headless browser reaches, `round(dt/h)` is zero: the bells
  froze while the clock the ringers aim at ran on, and the room struck two seconds
  late *only on the machine verifying it*. Each ringer now carries the leftover, and
  the twin asserts the ringing is identical at 17, 60 and 2000 fps.
- **`box()` and `tube()` were wound backwards** and it did not look broken — from
  outside a thin post you see the inside of its far face and it is nearly the same
  picture. It only showed up when the chamber was built INSIDE OUT (so the wall
  between you and the bells is back-facing and never drawn) and the whole screen
  went grey. The twin now checks every part's winding against its own normals.
- **The strike note is NOT something a pitch detector will confirm.** Rendering the
  bell with everything at or below the strike note removed and pointing the
  audio-lens at it reports **G4 (the nominal)**, not the strike note an octave below —
  correctly, because there is nothing there. The room says so instead of claiming a
  green check it has not got.

### Numbers the twin prints

ε* = 0.7049° · blow at −109.17° ± 0.12 over 438× in drop height · R² 0.999999 ·
b = 0.22926 s vs 1/λ = 0.22941 s · this blow 16.8 ms / next blow 397 ms over a 5×
range of pull worth 1.63% of the swing · one place early +7.1°, two places +37.4° ·
chimed 0.49 ms/° against 106 ms/° rung at the balance · 30,074 nodes and no 720 with
bobs alone · 435 nodes and a true 720 with the single.
