# The Taking-Apart Table — changelog

A lamp-lit square of green baize beside the Reckoning Cabinet. Any of four instruments
may be lifted apart on it, part by named part, in the only order the metal allows —
and settled home again, exactly as it began.

**Register: pure delight.** No theorem, no accuracy pill, no physics claim. The almucantar
arcs on the astrolabe's tympan, the pendulum sway, the stiction, and the felt's roll are
ORNAMENT, tuned by eye and ear. The one thing verified is that the PAYOFFS FIRE.

---

## 2026-07-21 — built (cycle #433)

### The shape of it

- **The gesture is a strain-drag.** Take hold of a part and pull: strain accumulates
  (`accum += drag·axis`, clamped ≥ 0), the part CREEPS up to 4.5 px, and at 17 px of
  accumulated strain the metal lets go. Let go before the break and it slides back into
  its seat, having moved nothing. A plain *tap* (no motion at all) is read as a decisive
  quick pull. The same gesture on a pinned part builds the same strain and then **refuses**.
- **A real partial order, not a chain.** Every part names what holds it (`held`). Two or
  three parts are free at the start; taking one opens others. Nothing is greyed out —
  refusal is a THUD, a slide-back, and brass pin-lines drawn from the part to each thing
  still on top of it, captioned *"still held by A, B and C"*.
- **The felt rolls toward you** as parts come off (`tilt = TILT_MAX·easeOutCubic(off/n)`).
  Seated parts foreshorten by `cos(tilt)` and fan apart along the pin axis — which is what
  makes the volvelle's near-concentric wheels separable, and the whole reason the tilt is
  here. The fan is the brief's `sin(tilt)·R·1.92` across the stack, **clamped by the cloth**:
  `computeSep()` takes each part's exact rotated bbox and picks the largest gap that lifts
  nothing off the top of the felt.
- **The shelf is a depth gauge.** Each part flies a three-phase arc — unseat straight up
  the pin axis, a bezier flight with its own pendulum (ω₀ 4.15–7.05, so nothing sways in
  unison), then a dock overshoot — and writes its copperplate name as it lands, the rule
  drawing itself out under it like a nib finishing a stroke.
- **The felt remembers.** Every part leaves a dashed copperplate ghost where it sat, drawn
  ABOVE what remains (so a mid-bloom volvelle shows its ghosts on the wheel beneath). Strip
  an instrument entirely and the table is a complete phantom of it.
- **The SETTLE lever** rebuilds in strict reverse, each part re-inserted into the felt's
  true z-order, ghost wiped, and **snapped to its exact origin literals**.
- **Cast shadows carry the weight**: a shadow that drifts, scales `1 + h·0.0013` and fades
  `0.52·e^(−h/300)` with height, clipped to the cloth. A seated part sits slightly proud of
  the baize (`lift0`) so it throws a contact shadow even at rest.
- **Sound**, in-house WebAudio, five cues × three material voices (brass rings, paper
  breathes, steel bites). Unlocked on the first real gesture; honours `ws:pref:muted`.

### Verification — the payoff-liveness twin (`__table.runTwin()`, 68/68)

There is no theorem here, so none is proved. `runTwin()` drives `grab` / `strain` /
`release` / `settleAll` — the SAME functions the pointer handlers call — with the clock in
hand (`CLOCK.virtual` + `advance(ms)`), so all four instruments run headlessly and instantly.
Per instrument (17 assertions × 4):

1. **Reachability audit** — the silent failure here is a part that is DRAWN but not
   GRABBABLE. Hit resolution walks the seated parts front-to-back, so a hit shape is the
   part's full silhouette; the audit grids the whole felt at 5 px and requires every part to
   win cells. (This is the fix for a real dead zone in the prototype.)
2. Starts with ≥2 free parts and ≥1 pinned part.
3. A pinned part **refuses** and stays seated; a free part **accepts** and reaches the shelf.
4. An abandoned short pull **slides back** and takes nothing.
5. **Fully exploded** — every part off, every part labelled, every label carrying its name,
   a ghost for every seat, the felt rolled.
6. **Ten consecutive bloom→settle rounds land BIT-EQUAL to the origin** (JSON of every
   pose, sway, strain and the tilt). Bit-equality is reached by ASSIGNMENT from frozen
   origin literals, never by exponential decay — decay leaves ~1e-16 residue and makes
   "back where it began" a lie.
7. **An INTERRUPTED bloom settles bit-equal too** — the lever thrown while a third part is
   still in the air.
8. **A tap on the lever settles** — `setPointerCapture` retargets the following `click`, so
   the lever is handled as "a drag that never crossed threshold".

Also verified first-hand in-browser: real input-level CDP mouse events drive lift · dock ·
refusal · settle to `4/4` (a synthetic `dispatchEvent` would not have proved it); median
60 fps / p10 60 fps during a bloom; clean console; `AudioContext` absent on load and
`running` after the first gesture; the shared mute round-trips through `ws:pref:muted`.

**The sound was measured, not written blind.** `__table.renderCueWav(material, cue)` renders
any cue offline into a real WAV; every cue was read with `audio-lens` and retuned twice from
the numbers. Final: nothing clips, nothing silent, levels in a −22 to −35 dBFS band, and the
three voices genuinely separate by spectral centroid — dock brass 809 Hz · paper 556 Hz ·
steel 1907 Hz; thud ~100–112 Hz on all three. The first pass had the paper voice sizzling at
4–5 kHz and the strain cue 30 dB below everything else; both were audible only as numbers.

### Placement

A **companion**, not a new place. `astrolabe/` and `planimeter/` already live in The
Reckoning Cabinet; `volvelle` sits with the workbench/scytale kin; `orrery` holds its own
front door. The Table gathers four things already standing, so it registers under existing
instrument kin — **no new PLACES entry, no new wing slug**. Doored from all four rooms
("take it apart"), and the shelf's instrument plate doors back to its home room. Claimed in
the catalog through the Reckoning Cabinet's own first-class link idiom.

### Files

- `index.src.html` — the engine (clock, tweens, hit resolution, stiction, lift/refuse/settle,
  the felt's roll, sound, the twin). Forge-inlines `ws.js` + `instruments.js`.
- `instruments.js` — the parts registry. **Adding a fifth instrument is appending one
  object**: id/title/material/R/cx/cy/cap + `parts[]` (id, name, sub, held, lay, home, hit,
  draw) + `z`. Nothing in the engine knows any instrument by name.

### Known limits

- One pull at a time — a second grab is refused while a part is in flight. Deliberate; it
  reads as care rather than lag, but a parallel model would feel looser.
- The felt's keystone is a cheap two-parameter suggestion of the roll, not a projection.
  It is ornament and should stay ornament.

---

## Publisher's pass — cycle #433 ("Baize")

Fresh-eyes review at 1500×900 and 430×900, with the payoff driven by **real input-level CDP
mouse events** (not `dispatchEvent`, and not the twin's own entry points).

**Portrait was the weak surface, exactly as the builder flagged — two real defects there:**

1. **The lever collided with the shelf.** In `TALL` the throw-lever's centre (`ly: 744`) sat
   *on* the shelf card's top edge — the card frame is drawn at `stop - 56` = 744 — so the
   brass pill overlapped the card's border by 21 units. Fixed by opening a clean lane
   between the cloth and the card: felt bottom `700 → 654`, lever `744 → 700`. The lever now
   sits with ~24 units of air above it and ~22 below.

2. **`caption: false` suppressed the page's only instruction.** Portrait dropped all four
   caption lines — including *"Take hold and pull it up off its seat"* — so a phone visitor
   met an astrolabe and a numbered shelf with nothing telling them the thing comes apart.
   That is a discoverability failure, not a space saving. The caption is laid out below the
   shelf (`SHELF_TOP + n·SLOT_H + 42`), which at nine parts lands at user-y 1337 — past the
   old 1340 viewBox. Fixed by giving `TALL` the room it needed: **vb `760×1340 → 760×1420`.**
   This costs nothing: `TALL` is width-bound at every portrait viewport (760/1420 is taller
   than any phone's aspect), so the render scale is unchanged and the taller scene still
   fits — 1420 × 0.566 = 803 px inside a 900 px viewport. `caption: true`.

Also fixed, in the Reckoning Cabinet: the new companion paragraph's link rendered in
**default browser blue with an underline** — `.lacuna` had never contained an anchor, so no
`.lacuna a` rule existed. Added one in the page's own idiom (brass, no underline, a faint
rule that warms on hover).

**Verification after the fixes:** twin **68/68** at both 1500×900 and 430×900 · real CDP
drags in *both* layouts (lift → dock, refusal, and a lever tap settling; all four liveness
flags fired, chip green 4/4) · `AudioContext` `null` → `running` on the first real gesture ·
console clean on all four instruments and on all six registration surfaces · no horizontal
overflow at 430 (`scrollWidth == clientWidth`) · `forge --check --all` 170 current ·
`manifest --check` OK, 437 pieces, unclaimed 0 · `forge --audit-seen` all 64 pages ✓ ·
Reckoning Cabinet's own 26/26 still green.

**Reviewed and left alone.** The planimeter fills less of the wide felt than its three
siblings — but a planimeter *is* a spindly linkage on a big table, the lamp still pools
warmly around it, and it composes well in portrait. Honest, not defective. Likewise the
builder's two declared tradeoffs (one pull at a time; the ghost layer above the parts so a
lifted volvelle wheel reveals the printed wheel beneath) are both the right calls.
