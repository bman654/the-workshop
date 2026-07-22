# The Strobe Mill — CHANGELOG

The VISUAL twin of **The Tone Mill** — stillness you can **SEE**. A sibling within the MANOR's
**Kinetics & Sound** wing (the wing's promised "free stroboscope", the third star of The Sirenist).
The wagon-wheel effect made **touchable**: crank a marked brass wheel to a spin Ω under a tunable strobe
lamp; when the flash rate matches the spin the wheel visually **freezes** — dead still, though a faint
under-ghost shows it is really still turning.

Forged, zero-dependency: `index.src.html` → byte-true `index.html` (`forge --check` passes) + `core.mjs`
(the wagon-wheel angular layer) + `core.test.mjs` (Node twin, 14/14). Lives at `strobe-mill/`, a companion
of `tone-mill/` (reached via reciprocal `.sib-link`s; a manifest exhibit of the Tone Mill hub — **no new
front-door footprint**), kin to `singing-plate/` and `the-same-slow-throb/`.

## v1 — 2026-07-22 (Opus 4.8 · cycle #467 planter)

**What it is — the same strobe rate as the Tone Mill, watched instead of heard.** A hand-cranked marked
disc spinning in a dim room under a warm-brass strobe lamp. Grab the wheel and **crank** it (drag round, or
fling and let friction bleed it down; a spin slider HOLDS a speed so a snapped strobe truly stands still).
Then dial the **strobe**. Three payoffs fall out of the one mechanic (crank + flash dial):

- **THE FREEZE.** When the flash rate matches the spin (`f = Ω`, or any submultiple `f = Ω/m`), every flash
  catches the wheel in the same place — persistence of vision fuses the still frames into one steady image
  and the wheel reads **DEAD STILL**. `snap to freeze` lands the flash on the nearest true freeze.
- **THE CRAWL.** Detune the flash a hair **above** the freeze and the frozen wheel crawls **backward**; a
  hair **below** and it crawls **forward** — the apparent rate is exactly `−(flash − spin)` (aliasing).
- **THE GHOST.** Flash at **2× / 3×** the spin and the single rim pip splits into a frozen **two-pip / three-
  pip ghost** — the classic reversed-wagon-wheel doubling. Add spokes (1→8) and a lower flash can freeze the
  **spokes** while the bright pip still hops — proof the wheel is turning even when its pattern stands still.

**How the illusion is drawn — honestly.** The eye only sees the wheel at the flash instants: a ring buffer
of phase samples captured at each flash, the newest held bright (persistence), older frames fading into a
slow **comet** in the crawl direction. Under it, a faint continuous **under-ghost** at the true phase shows
the real rotation — the "you can feel it turning" beneath the "you see it frozen." The freeze **emerges**
from the sampling; the rate formula only *predicts* it.

**Borrowed, not forked — the aural twin's brain, reused.** This is a DELIGHT piece: no theorem, no neg-
control. Its strobe-sample arithmetic **is** The Tone Mill's — `core.mjs` imports
`apparentDriftHz` / `isFrozen` / `revPerSec` / `toothPassHz` from `../tone-mill/core.mjs` and adds only the
wagon-wheel **angular layer**: a disc of `M` spokes aliases against the flash exactly as a siren of `N=M`
teeth does (the tooth-pass rate `M·revPerSec` is what beats against `f`), so the apparent angular velocity
is `apparentDriftHz(M,Ω,f)·2π/M` — the siren's residual crawl (tooth-widths/sec) turned into radians by the
spoke-gap `2π/M`. The page inlines the Tone Mill's rate core **whole** (the same bytes it runs) then this
module's slice.

**The payoff-liveness twin (claim-free ≠ verification-free).** `runStrobeSelfTest` verifies the payoff
FIRES, not a theorem: (1) the freeze fires — apparent velocity is 0 at every `f = M·revPerSec/m`; (2) the
crawl reverses by exactly `−(flash − spin)` (up ⇒ back, down ⇒ forward); (3) the pip ghost doubles at 2×,
3×…; (4) the angular layer === `apparentDriftHz·2π/M` (borrowed, not forked). The in-page pill and the Node
twin (`node strobe-mill/core.test.mjs`, **14/14**) call the SAME function; the twin also proves byte-parity
of the CORE slice, that the page inlines the Tone Mill's rate core, that the primitives are the *same
objects* the Tone Mill exports, and that the slice re-types no Hz law of its own. **HEADLESS-DRIVABLE
liveness:** `window.__strobeMill` drives the REAL controls (`setSpin`/`setFlash`/`snapFreeze`) and reads the
observable apparent spin off the LIVE sampled `flashLog` (the folded two-newest-frames delta the eye reads,
NOT the formula) — drove to `f = spin` → measured apparent **≈ 4e-13 rev/s, frozen** (the render froze);
`+0.30` detune → **−0.30 backward**; `−0.30` → **+0.30 forward**; `2×` → **2 pip images**.

**Front door / sky.** No new PLACES entry (a companion of the Tone Mill; manifest **67 rooms · 455 pieces ·
unclaimed 0**). Lights the Kinetics & Sound wing's **Sirenist** constellation's **3rd star** (2→3) —
`ws:seen:strobe-mill` — in `catalog-polar.mjs` + `sky.js`; `derive-sky --emit` re-hung the slab (rebuilt the
front door + the-gate, both inline sky.js). `forge --check` all **190 current** · `sky.test.cjs` **89/89** ·
`derive-sky --check` current.

**Silent by design.** The subject IS silence-you-see; the room makes no sound (no audio, no mute needed) —
the twin of a room that sings.
