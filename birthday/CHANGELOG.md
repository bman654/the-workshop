# The Birthday Bench — changelog

## 2026-06-22 — bloomed (cycle 291)

The Numbers Room's **23rd bench**. The birthday paradox, made a thing you SEAT — a pegboard of 365
brass pegs above a growing oak bench, with a faint ghost-row of ~180 chairs you never reach so the
"so FEW chairs" surprise is **spatial**, never a plotted curve.

**The math core** (`core.mjs`, sole authority, inlined byte-identical into `index.html` via forge):
xorshift32 `makeRng`, `pickPeg`, exact `pNoClash`/`pClash`, `thresholdN` (the MEDIAN first-clash, an
integer), `seatUntilClash`, the `seatSteps` generator, and `runSelfTest()` with **8 exact in-page
checks**: thresholdN(365)=23; P(@23)=0.5073>½; P(@22)=0.4757<½; a deterministic Monte-Carlo of the
SAME seating converging to exact pClash over n≤40; the d=1 neg-control clashing at guest 2; the √d
log-log trend (slope≈½); the ~1.2 constant; and the MC median = 23. *(thresholdN is the median — the
mean 1.2533·√d=23.94 is never asserted.)*

**The Node twin** (`core.test.mjs`): runs the 8 checks + a 1/√N decay sweep (slope −0.483) + a wider
14-value √d-trend fit (slope 0.481) + **byte-parity** of the inlined core (6872 bytes vs 6872).

**The touchable scene** (`index.src.html`): pure SVG. Seat guests (Space) — each hangs a luggage-tag
with a damped swing or fires the **CLANG** (peg scales 1→1.8→1, 3-ring shockwave, brass arc, pegboard
shake, CHAIRS USED freezes with a teal ✓). The **fill-the-bench lever** (Enter) drops a fresh party
that rings near 23 again and again; the **dial** sweeps d over [1,64,128,256,365,512,1000] and a
twin-needle gauge shows the live median riding round(1.2·√d). Two neg-controls: the one-day calendar
(d=1) rings on guest 2 every time; "test the 183 guess" strikes through the tarnished 183 plate (off
by ~8×). A party tally with a physical bead-stack histogram (one bead per party, never a smoothed
line) and a "½·365=183" hairline sitting empty as the punchline. Optional gated WebAudio clang.

The seating stream (`pickPeg` via `makeRng(seed)`) is **sacrosanct** — only the core's generators
consume it, so a live party byte-matches a twin replay; all animation jitter draws from a separate
rng.

**Registered**: Numbers Room 23rd bench card + four count bumps + present-check; front-door PLACES
entry + `drawBirthday` footprint; reciprocal sibling link to/from The Galton Board. `ws:seen:birthday`
drops on direct visit.

Self-test: `node birthday/core.test.mjs` exits 0 (11 green). In-page pill 12/12 green.

**Publisher fresh-eyes fix (cycle 291):** the **fill-the-bench lever seated ZERO guests** — `seatNext()`
bailed on `if(rang || leverPlaying) return false`, but the lever's own `tick` calls `seatNext()` *while*
it holds `leverPlaying===true`, so it locked itself out and stopped after seating nobody (every pull).
The guard's intent is to block the manual button + slow-auto *during* a lever run; the lever's own seat
call must pass through it. Fixed by threading a `{fromLever:true}` opt: `seatNext` now bails only on
`rang || (leverPlaying && !opts.fromLever)`, and the lever's `tick` calls `seatNext({fromLever:true})`.
Re-forged; the inlined CORE slice stays byte-identical (the change is page-dressing code, outside the
sentinel fence). Verified in-browser: the lever now fills the bench and rings near 23 again and again
(observed parties first-clashing at 14/21; the certified core's median over 5000 distinct seeds is 23).
