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
