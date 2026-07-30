# The Marble Machine — CHANGELOG

## 2026-07-30 · founded

A panel of oak 1.24 m across, sixteen glass marbles, tuned steel bars, a bucket
lift that never stops, and a sixteen-peg programming wheel. You draw the track.

### The idea

A marble machine is an instrument whose **score is its geometry**. A bar's place
on the wall picks the *note*; the distance a marble has to travel to reach it
picks the *moment*. There is no sequencer and no note list anywhere in this room:
to make a note play later you move a piece of steel down the wall, and that is
the only way.

Which is unusable unless you can *see* the time. So the wall draws it. The pale
dashed line is **one marble's whole future**, traced through the machine exactly
as it stands, by the same solver that runs the marbles you can watch. The ticks
along it are half-beats of the wheel, numbered on the beat. **A bar on a tick is
a note on the beat**, and the rig prints how far each note lands from the nearest
beat, in milliseconds, green when it is inside 25. Drag a bar and every one of
those numbers moves while your finger is down.

### The two claims, and how they are tested

**One — a marble rolls, and rolling is slower than sliding.** A solid sphere that
rolls without slipping runs down a slope at `(5/7) g sin θ`, because two sevenths
of the work goes into spin. *Nothing in the solver knows that number.* A contact
is resolved with a normal impulse and a Coulomb-clamped friction impulse that
drives the **contact point** to rest; rolling is what emerges. Measured against
the closed form over 8–45°: worst error **0.09 %**. A slider (μ = 0) racing a
roller down the same ramp wins by **√(7/5) = 1.1832** — measured 1.1830.

**Two — a bar's pitch is its length, as 1/L².** A uniform free-free steel bar
sings at `(β₁L)² · t√(E/ρ) / (2π√12 · L²)` with `β₁L = 4.7300`. So a bar's length
is not a free parameter on this wall: draw one and its note is already decided,
and **an octave down is 1.414 times longer, not twice** — the opposite of a
string. The rack in the rig draws every bar to its true length and marks the
first octave pair it finds with the measured ratio; on *the ladder* you can put a
ruler on the screen. The voices carry the real free-free partials
**1 : 2.756 : 5.404 : 8.933**, which is why they ring like a glockenspiel and not
a piano, and the cords are drawn at 22.42 % in from each end, where a free-free
bar does not move.

**The honest limit.** Alone, the rhythm is exact — the same wall plays the same
times, bit for bit. A crowd is not: with five marbles released behind it at
spacings from 0.16 to 0.42 s, the first marble's notes move by up to **14.6 ms**.
That figure is measured by self-test L and *printed into the drawer from the same
variable* — it is not typed into the prose.

### Verified

- `mill.test.mjs` — **19/19 green**. The core's own 14 checks (the same
  `runSelfTest()` the page's pill runs), plus: pitch agrees exactly with the
  estate authority `sound-garden/pitch-core.mjs` over 65 semitones; `mill.mjs`
  holds no backtick; the built page inlines the core byte-for-byte; a 40 s run of
  the ladder loses no marble; the jitter figure the page prints is the measured
  one.
- **`tools/audio-lens`, on audio rendered by the same `barVoice()` the page
  plays.** One C5 bar: **522.3 Hz = C5, three cents flat**, second peak at
  1442.9 Hz = **2.764×** the fundamental against the 2.7565 a free-free bar
  demands, peak 0.92, no clipping. The whole of *the ladder*, read back cold:
  **eight onsets for eight bars**, at 0.779 / 1.056 / 1.312 / 2.069 / 2.475 /
  2.827 / 3.147 / 3.317 s against the tracer's 0.813 / 1.090 / 1.341 / 2.093 /
  2.500 / 2.853 / 3.174 / 3.342 — every one inside 34 ms, with the same lead
  each time (the detector's own 10.7 ms hop).
- **A real browser, input-level.** Every tool driven through
  `tools/cdp/pointer.mjs` (never `.click()`): a rail drawn by drag, a bar drawn
  by drag (C6, 157 mm, snapped), a vane placed, a bar *moved* — its beat offset
  went +88 ms → −19 ms and the downstream notes changed with it — a part erased,
  and a wheel peg toggled. 60.5 fps with the vane machine running. Audio context
  running, four bar voices rendered, 26 strikes played. The hub card navigates.
  Narrow layout (430 px) checked and rebuilt.

### Where the shipped machines came from

Every coordinate in `MACHINES` was **placed by the tracer, not by hand**:
`tune.mjs` (a maker's tool, kept) drops each next part exactly where a traced
marble crosses the chosen height, so a shipped machine cannot be one that misses
its own bars. Self-test J re-runs all three and insists each reaches the trough
and plays. `take turns` was built twice over, once for each state of its vane.

### The parts

- **rail** — drag; brass wire, restitution 0.12.
- **bar** — drag; the length snaps to the nearest note of C pentatonic and the
  note is then fixed by physics. Restitution 0.14, because a glockenspiel bar is
  seated on cord and a marble landing on one mostly stops (which is also why a
  bar is struck once, cleanly, instead of chattering).
- **vane** — a funnel that centres a falling marble over a rocker pivoted at its
  middle. The marble rolls off whichever end is down and the rocker falls the
  other way as it leaves, so consecutive marbles take turns. Self-test M proves
  the alternation: `[C6 E5 C5]`, then `[C6 G5 A5]`, then back.
- **the lift** — anything that reaches the trough, goes over the edge, *or gets
  stuck*, is fished out and carried back to the hopper. A marble that has come to
  rest for 1.4 s is declared stalled by the solver itself; without that, one flat
  rail would quietly empty the hopper and kill the room. (Checked live: a dead
  flat rail across the fall, fourteen seconds, no marbles lost.)

### Files

| | |
|---|---|
| `mill.mjs` | the machine as arithmetic. Contacts, the bar's pitch and voice, the tracer, the shipped machines, `runSelfTest()`. DOM-free, runs in Node, holds no backtick. |
| `paint.js` | everything the wall looks like. Takes a context and the state. |
| `mill.test.mjs` | the Node twin. `--wav` renders a run for `tools/audio-lens`. |
| `tune.mjs` | a maker's tool: builds a machine constructively from the tracer and prints literal coordinates. Use it before hand-typing a layout. |
| `index.src.html` | the room. |
