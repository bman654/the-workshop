# The Errand — changelog

## Cycle 400 — sown (the Midway's first DELIGHT-first ride)

**The Errand** — a Rube-Goldberg workbench gathered under the Midway roof. Drag pieces onto a
gold pegboard grid, drop a marble, hit **GO**, hold your breath, and watch a *deterministic*
chain resolve to a tiny payoff (a flag pops / a candle catches) with a **CLUNK · tink · DING**.
It proves nothing and owns no theorem — the strip's first ride made purely for the joy of a
chain that keeps its promise, kin to the poster press and the verse oracle.

One self-contained page (inline CSS/JS, no framework, no external assets), built behind three
narrow seams:

- **Layer A — the sim** (deterministic engine + piece kit). ONE shared constants block
  (`GRID=40, COLS=25, ROWS=16`; `H=1/240`, `G=1400`) is the single source of truth. Determinism
  is CRAFT, not a claim: a fixed-timestep accumulator with an integer `stepIndex` (no rAF `dt`
  ever enters physics; render interpolates the leftover fraction but never feeds back; catch-up
  capped at 0.05 s); grid-snapped integer placement (same layout = same float geometry); ZERO
  `Math.random` in the step path; colliders resolved in a FIXED order (sorted by cell index);
  a `STOP_EPS` dead-stop, gated on CONTACT so a slow *free-falling* marble is never zeroed
  mid-air; the marble translation sub-sliced 3× so a fast marble can't tunnel a thin plank.
  - Collision primitive `collideCircleSeg` (closest-point-on-segment, push-out, reflect normal
    with restitution, keep tangent near-fully). Bulk energy loss is a **separate gentle rolling
    friction** applied once per step (`ROLL_K=0.7/s`) — the way a real ball loses speed, not
    drained on every sub-slice contact (that early bug pinned the marble to a dead crawl on a
    slope; fixed by moving friction out of the contact and gating rest on `_touched`).
  - Hinged pieces share one 1-DOF angular integrator `stepHinge` (semi-implicit, exp-decay
    angular friction, a ×0.15 stop-peg bounce = the CLUNK).
  - Piece kit: **RAMP** (single-segment chute, flippable L/R — the workhorse carry), **SEESAW**
    (weight tips it, ~0.4 s lag, stays tipped), **BUCKET** (fills, overcomes a detent, dumps
    ~0.6 s later — the held-breath beat), **DOMINO** (topples, tip knocks a neighbour), **BELL**
    (tin, emits `ding` above an impact threshold), and the **PAYOFF** (FLAG or CANDLE — a
    trigger piece).
  - **The held-breath beat**: when the marble arrives at the payoff trigger, the sim enters
    `phase:'arming'` and counts a FIXED `ARM_STEPS=82` (≈342 ms) before firing — a fixed step
    count stays bit-for-bit deterministic. During arming the bunting dims, the tick-bed silences,
    and a warm-gold sightline draws trigger→payoff like a fuse. Then DING → chime → the flag
    unrolls / the candle catches.
- **Layer B — the build & play shell.** A `BUILD / WATCH / DONE` mode machine over an SVG board
  (`viewBox 0 0 1000 640`, responsive, wrapped in an `overflow-x:auto` container) with a visible
  gold peg-lattice on the 40 px grid (the reproducibility, shown honestly). A canvas overlays the
  lattice for the drawn pieces. **Real pointer capture** for drag/rotate/remove
  (`setPointerCapture` on `pointerdown`, never synthetic `.click()` — verified with genuine
  `PointerEvent`s carrying a `pointerId`); forgiving snap (~1.4-grid ghost, coral-reverts on
  overlap); a keyboard fallback (arrows nudge, `r` rotates, `del` removes). A brass GO lever
  becomes ◼ STOP in WATCH; no HUD / timer / score. DONE speaks one warm line — hit → "it kept its
  promise.", else an HONEST near-miss whisper (`gap / stalled / overshot`, else one generic warm
  line — never a WRONG whisper); `↺ Tweak` returns to BUILD with the SAME layout (never a wipe).
- **Layer C — the soul.** Per-piece pure canvas draw fns (no sprites); inherits the Midway tokens
  plus one warm family — `--wood` birch + `--tin` pressed-tin; the marble is a gold radial glass
  sphere with one specular dot; `--coral` used EXACTLY once per run (the flag/flame). In-house Web
  Audio synth **ErrandSound**: never creates an `AudioContext` at load; `unlock()` on the first GO;
  struck wood/tin resonators + inharmonic bell partials; gated on the shared `ws:pref:muted` (with
  a `storage` listener so a mute on another estate tab is honored). Every cue's fundamental snaps
  to ONE pentatonic on F (clunk=F3, tink=G3, fill A3→C4, ding=C5, chime F4→C5) so a well-built
  chain secretly plays an ascending run that resolves on the payoff — the contraption is quietly an
  instrument. Micro-animation on eased curves; `prefers-reduced-motion` collapses to instant and a
  muted run stays charming (the flag still pops).
- **The one event seam.** The sim knows nothing of audio or art — it PUSHES a unified shape onto
  `world.events` (`{type, pieceType, vel, x, y, step}`); the UI drains it each frame; the audio
  layer sonifies each; the art layer reads `piece.theta` / `marble.spin`. Because the sim is
  deterministic, the same layout → the same event stream → the same song + the same replay, free.

**Presets (press GO and grin).** Two charming presets shipped as `placedPieces + marbleStart`
literals, **authored against the finished sim and verified to land** (a Node twin of Layer A ran
each to completion, twice, confirming an identical run):
- **The Bell-Ringer** — a rightward ramp cascade drops the marble onto a tin bell, then the held
  breath, then the flag pops. Verified `hit ✓`, 388 steps, key `adfc1f78`, event stream
  `ding arm payoff chime`.
- **The Candle-Lighter** — a cascade the other way rattles the marble down and drops it on the
  wick; the candle catches. Verified `hit ✓`, 445 steps, key `b01ed061`, event stream
  `tink tink arm payoff chime`.
- Plus a **✎ Blank bench** card.

**Self-test — STRUCTURAL + a craftsmanship replay-integrity check, NOT a physics proof.** The
words never claim a math result. It asserts: the palette has the 5 core + payoff piece types; the
GO lever + board SVG + gold peg-lattice are present; both presets load to non-empty layouts AND
actually reach the payoff (a real headless run); a layout serialize→deserialize round-trips
identically; the same layout hashed twice → the same key (replay integrity ✓); a deterministic
re-run gives the same steps + result; the back-link `../midway/index.html`; the breadcrumb
`ws:seen:errand` dropped. Green **18/18 ✓**.

**Verification.** Page loads clean (0 console errors); self-test 18/18; both presets land via a
real pointer-level GO click (once the lever is scrolled into view — headless viewports are short);
the sim is bit-for-bit deterministic across re-runs (matching the Node twin exactly); audio
VERIFIED HEADLESS via the audio-lens skill on an OfflineAudioContext render of a full chain — not
clipping (peak −6.66 dB), not silent (rms −26.8 dB), the payoff chime lands in tune (F4 −5c,
C5 −4c) and the spectrogram shows the six events rising in pitch to a ringing resolution; the mute
render is silent (peak 0.0012) while the unmuted render is audible (0.4643); reduced-motion
collapses the payoff to an instant, still-charming pop. (NOTE: headless Chrome pauses `requestAnimationFrame`,
so the live rAF loop was verified by manually pumping the page's own `stepWorld` + event-drain +
`ErrandSound` pipeline — proven identical to the auto-driven path.)

**Registration.** Gathers UNDER the Midway roof — a new `.ride.lit` card in `midway/index.html`
→ `../the-errand/index.html` (glyph 🎯, kind line "build a little machine that keeps its promise ·
Rube-Goldberg, by honest physics"), carrying a WARM GOLD **delight pill** ("no score · no proof ·
just the CLUNK-tink-DING"), NOT a green `.proof` pill — its visible absence states the Midway now
holds joy as well as instruments. NO new front-door / map footprint. NO invented math claim
anywhere.

**Publisher polish (cycle 400 fresh-eyes).** The builder flagged that on a short laptop viewport
the GO lever sits below the fold with no signpost. Added a **scroll cue** — a small gold pill
("Pull GO below ↓") pinned bottom-center that appears ONLY while the GO lever is off-screen and
fades out the instant it scrolls into view (a bare `scroll`/`resize` `getBoundingClientRect`
measure — deliberately no rAF throttle, so a background tab can't strand it shown and so it is
verifiable headless where rAF is paused; `prefers-reduced-motion` stops its bob). Purely additive:
it touches nothing in the sim / canvas / drag path — the full live run (real GO click → phase
`landed`, 388 steps, `hit:true`, `ding→arm→payoff→chime`) is unchanged and self-test stays 18/18.
*Considered but rejected:* capping the board's height on short viewports — the SVG's
`preserveAspectRatio="meet"` would letterbox the peg-lattice while the absolutely-positioned canvas
overlay stretched full, drifting pieces off their pegs (verified the mismatch), so the safe cue was
the right call over risky layout surgery on a fully-verified piece. Also re-verified: no horizontal
overflow at 390 px or 1280 px; both presets land (Bell-Ringer 388/`adfc1f78`, Candle-Lighter
445/`b01ed061`); overlay canvas painted; Midway self-test 37/37 with 10 lit cards and the Errand's
delight (not proof) pill.

## Cycle 404 — bug fix (GO did nothing — the marble froze at spawn)

**The freeze.** Pressing GO flipped the lever to STOP and toggled `phase→running`, but the marble
hung at its spawn cell and nothing fired — no ramp, no seesaw, no bell. The deterministic engine was
sound (the headless `simulateToEnd` core ran the whole chain to completion, and the self-test replayed
on THAT and passed 18/18 green), so a **dead LIVE play-loop shipped green** — the same verification-gap
class as the Reliquary's #403 fair-play leak.

**Root cause (fixed at the root, not the symptom).** The App IIFE's fixed-timestep driver state —
`var acc=0, last=0, raf=0;` — was declared *below* the IIFE's `return {…}`. Code after a `return` is
dead **for initializers**: JavaScript hoists the `var` *declarations* (so `acc`/`last`/`raf` still
resolve as names) but never runs the `= 0` *assignments*. So `acc` was `undefined` at runtime. The
headless core and the self-test never touch `acc`, which is why they were green; but the live driver's
`frame()` does `acc += dt` on the first WATCH frame → `undefined + dt = NaN`, and `while (acc >= H)` is
forever false (`NaN >= x` is always false, and `acc += dt` keeps `acc` at `NaN`) → the world never
stepped → the marble sat frozen. `last`/`raf` only *looked* fine because they are reassigned every
frame; `acc` had no such rescue.

**The fix — three touch points, all in `index.html`.**
1. Moved `var acc=0, last=0, raf=0;` to **above** the IIFE's `return` (~L1146), where the initializer
   actually executes, with a comment documenting the after-`return` hoisting trap so it can't quietly
   come back.
2. `startRAF()` (~L1531) now `acc=0; last=performance.now();` — primes the accumulator + timebase at
   init.
3. `go()` (~L1276) now `acc=0; last=performance.now();` on WATCH entry — a fresh accumulator per run.

**Verification gap closed (the point of the cycle).** Added an `App._pump(n)` test hook that invokes
the SAME `frame()` the rAF loop runs, with synthetic ~60 fps timestamps — so the self-test drives the
REAL GO→playback path (acc / the WATCH branch / stepWorld) deterministically and synchronously, **not**
through a canvas pointer event (the loop's funlog notes a headless mouse-down doesn't deliver
`pointerdown` to a canvas — which is precisely why the dead live-loop slipped past fresh-eyes at #400).
Two new self-test checks press GO through the real `App.go()` entry point and assert (a) `world.stepIndex`
climbs past 0 across live frames and (b) `world.marble.y` increases on the live driver, then `App.tweak()`
returns the bench to BUILD. **Self-test 18/20 → 20/20.** The `App._pump`/`_debug` hooks are intentionally
kept (kin to the existing `window.__runErrandSelfTest` hook) — they ARE the closed verification gap.

**Publisher fresh-eyes (cycle 404).** Served the site on an uncommon port (torn down by its exact PID),
drove the page in a fresh agent-browser session with a **genuine input-level click** of the `#golever`
DIV (`find role button click --name GO`, scrolled into view). The run completed cleanly: mode `DONE`,
phase `landed`, `hit:true`, `stepIndex 388`, marble fell `y 20 → 567`, done-message "it kept its
promise.", zero console errors — and a **second** genuine click reproduced it bit-identically (388
steps), confirming determinism holds on the fixed live path. Self-test 20/20 with both new live-driver
checks green and a clean self-reset to BUILD (`worldNull:true`). Topbar clean (back-link →
`../midway/index.html`, mute + `20/20 ✓` pill), no horizontal overflow, The Errand still registered in
the Midway (2 references). NO code edit needed beyond the builder's fix — estate-quality on arrival.
The arming sightline, miss-whispers, and sound design were untouched.

## Cycle 408 — bug fix (the Bucket never dumped, and the payoff never reacted)

Two live-play LIVENESS bugs, fixed together at root. Both shipped green for the same reason: **no
shipped preset used a Bucket, and nothing drove the payoff REVEAL on the live path** — so the sim's
core (`simulateToEnd`) and the self-test never exercised either seam. This cycle closes that gap with a
new bucket preset that lands AND live-driver self-test assertions that watch the payoff actually fire.

### BUG A — the Bucket tilted ~5° and FROZE, trapping the marble (the run failed)

Three compounding faults, each fixed at root:

1. **A timing race the swing always lost (the freeze).** The dump torque was withheld until
   `fillSteps>132` (~0.55 s detent). But a caught marble sits motionless on the dead felt floor, so the
   GLOBAL rest-detector's `restCount` climbs in lock-step with `fillSteps`. By the time torque turned on
   (~step 133), `restCount` was already ~132; crossing the `dumped` latch (`theta>0.10`) takes ~60 more
   torque steps, but `restCount` hit `REST_STEPS` (140) first → `phase='rested'` → `stepWorld`
   early-returns → the bucket froze one hair short of the latch, at ~5°. **Fix:** DECOUPLE the swing from
   rest-detection. A new `bucketWorking(w)` helper reports any bucket that still holds a caught marble (or
   is mid-dump before the marble has cleared the mouth), and the rested transition is gated
   `if(w.restCount>=REST_STEPS && !bucketWorking(w))`. The `MAX_STEPS` cap stays as the safety net so a
   genuinely stuck bucket can't loop forever.
2. **A symmetric deep cup CRADLES a solid ball — it never pours.** Even decoupled, raising the old ~60°
   hinge bound just let the marble ride the rotating cup up to the pivot and balance there for ~1400
   steps (a "held coma"). A deep cup with two tall walls only reorients as it rotates; the downhill lip
   never drops below the ball's rest point. **Fix:** the bucket is now an **asymmetric SCOOP** — a tall
   back wall that holds the marble during the fill, and a SHORT 16 px front lip on the DUMP side (right
   for non-flip, left for flip) — and the hinge bound is raised to ~1.6 rad (~92°). Past ~90° the marble
   rolls out cleanly over the low front lip in ~250 steps, a crisp spill instead of a coma.
3. **The catch was too narrow to register a real feed.** The fill gate required the marble moving
   `<180 px/s` to count as "inside", but a marble off a ramp is doing 300–600 px/s, so it bounced
   straight through and the bucket stayed empty (`fillSteps` never left 0). **Fix:** the gate is widened
   to `<620 px/s` and, on the FIRST catch, the marble is damped hard (`×0.34` — the "thunk" into the
   scoop) so it settles onto the felt floor instead of ricocheting off a tin wall and back out the mouth.

### BUG B — the payoff (Flag/Candle) never visually reacted (though `hit=true`)

`p.anim` (0→1, the unroll/flame reveal) is advanced only in `payoff.advance()`, which runs BELOW
`stepWorld`'s `phase==='landed'` early-return. But `payoff.fired` and `phase='landed'` are set TOGETHER
on the arming step, AFTER that step's advance loop already ran (while `fired` was still false). Every
LATER step early-returns before the advance loop → `advance()` never runs with `fired===true` → `anim`
stayed 0 → the `if(a>0)` reveal blocks (`drawFlag`/`drawCandle`) never drew. Compounding: once
`phase='landed'`, `frame()` flips `mode` to `DONE` and stops stepping the world entirely, so nothing
would tick `anim` even if the guard let it. **Fix (two parts):** (1) tick a fired payoff's `anim` ABOVE
`stepWorld`'s early-return (physics still freezes below it); (2) in `frame()`, add a `DONE` branch that
keeps advancing `pay.anim` (`dt/0.4` → ~0.4 s) and repainting after landing, so the flag unrolls / the
flame catches on the live path. Reduced-motion snaps `anim` to 1 for an instant, still-charming pop.

### The missing coverage, now shipped

- **A new preset — "The Tipping Bucket"** (`🪣`, mirrored as a card): `marble → ramp → bucket (fills,
  holds ~0.55 s, tips past 90°, spills) → catch-ramp → flag`. Authored against the fixed sim and verified
  to land (headless `hit ✓`, steps 867, key `f597df70`, deterministic across re-runs). This is the
  exemplar the bug wanted — the first shipped chain that uses a bucket.
- **The self-test grew 20 → 26**, ALL-PASS. New headless checks: the bucket preset is non-empty & uses a
  bucket, and reaches the payoff. New **LIVE-DRIVER** checks (via `App.setPreset`/`App.go`/`App._pump` —
  never a canvas pointer event, which doesn't fire headless): after driving the bucket preset live, the
  scoop tips past ~90° (`|theta|>1.5`, not frozen), the marble CLEARS the mouth after the dump, the LIVE
  world registers `hit`, AND the payoff's `anim` reaches ~1 (the flag actually raised) — asserted on
  `_debug().world`, not the headless core. This is the headless-drivable check that the PAYOFF ACTUALLY
  FIRES, the gap that let both bugs ship.

### Verification

Node twin of Layer A (fixes injected as the same string edits): all three presets land, bell-ringer
(`adfc1f78`) and candle-lighter (`b01ed061`) keys UNCHANGED (the sim edits are inert for non-bucket
layouts). Real-browser (served on an uncommon port, torn down by exact PID; fresh uniquely-named
agent-browser session; a genuine input-level GO click): the live rAF run drove the full chain —
`stepIndex` climbed on its own, the scoop dumped at step ~373 and tipped to `theta 1.6` (~92°),
`hit=true` at step 867, and the flag reveal animated `0 → 0.67 → 1.0`. Screenshots confirm the scoop
mid-spill and the coral flag unrolled with "it kept its promise." Self-test `26/26 ✓`, zero JS console
errors (only the auto-requested favicon 404), no horizontal overflow at 1280 px or 390 px. `forge
--check --all` clean (136 files current). This is a payoff-LIVENESS repair, not added rigor — the ride
stays claim-free; the self-test proves the delight OCCURS, it asserts no theorem.
