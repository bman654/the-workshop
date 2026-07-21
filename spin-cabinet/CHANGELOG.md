# The Spin Cabinet — changelog

## Cycle 435 — built (`index.src.html` → `index.html`, `panels.mjs`, `panels.test.mjs`)

A walnut display case with six sunk niches, one for each of the estate's things that stay
up only because they are turning. **Not a ride and not a proof** — a cabinet. There is no
HUD, no readout, no stat pill, no accuracy chip and no self-test chip on the visitor's
page; every theorem stays proved in the room it came from, and the brass plate under each
niche is the door to that room.

**The take:** *the shadow is the instrument.* Each object stands on a turned plinth under
its own lamp, and its own points, flattened to the stage floor, are drawn as its shadow —
so the rattleback's rock, the wheel's precession and the chair's reach are all readable
without a single number on screen. Niche lamps sit at 24% asleep and rise to 82% alive;
when the sixth wakes, the case gains a warm bloom and one gleam sweeps the crown, once.

### WHICH CORE BACKS WHICH PANEL

Every panel is driven by its room's **shipped `core.mjs`**. Not one hand-rolled loop.

| niche | core | what the core decides |
|---|---|---|
| The Top | `../the-top/core.mjs` | `precessRate()` (Ω = mgr/Iω) steers the axle; `topples()` — the room's own neg-control flag — decides when it falls; `axleHat/cross/mag` build the rim basis |
| Tippe-Top | `../tippe-top/core.mjs` | `defaults()`, `H_SIM`, `omegaCrit()` (the bifurcation), `startState()` + `integrate()` on the reduced flow `[θ, P, φ]` |
| Rattleback | `../rattleback/core.mjs` | `epsOfSkewDeg()` → ε, `favoredSign()`, and `rk4Step()` — the reversal is emergent, never scripted |
| The Chair | `../spinning-chair/core.mjs` | `omegaAt(r) = L₀/I(r)` forces the spin; the visitor only moves `r` |
| The Rotor | `../rotor/core.mjs` | `riderState()` decides, every frame, whether the wall still holds her; `omegaC()` is where it stops |
| Tusi Couple | `../tusi/core.mjs` | `pen()` + `wheelCentre()` — the marked point's position IS `pen()`, nothing eased |

The cores are inlined by `forge:include`, each sealed in its own **IIFE**. That is not
decoration: six cores share top-level `M`, `G`, `R`, `A`, `B`, `deriv`, `integrate` and
`runSelfTest`, and in a classic script the last one loaded would silently drive all six
niches. `rotor/core.mjs`'s direct-run guard was moved off `import.meta` (a parse error
outside a module) to the estate's standard `process.argv` form, so it inlines cleanly.

**Borrowed constants, not invented ones.** The rattleback panel runs the room's own
`{eps: epsOfSkewDeg(δ), wp:1.0, wq:1.7, mu:0.05}` at `H_DT = 1/240`
(`rattleback/index.src.html:211,216`) — invented stiffness or damping damps the rock out
before the ε-channel can drive n through zero, and the refusal never happens. A panel that
borrows a core borrows its constants.

### PANELS AS AN INJECTABLE MODULE

`panels.mjs` holds the six drivers as factories that take their core as an argument
(`makeRattlebackPanel(RB)`, …). Node passes `await import('../rattleback/core.mjs')`; the
page passes the forge-inlined `CORE.rattleback`. One source of truth, two consumers — so
the headless twin drives exactly the physics the canvas renders.

### THE PAYOFF-LIVENESS TWIN — `panels.test.mjs` (29/29)

The cabinet makes no claim, so the twin does not prove a theorem; it proves the case is
**alive**, because a panel that renders beautifully and never does its trick is silent,
error-free, and a total failure. Per panel: (a) it is driven by the actual room core AND
`index.src.html` carries the matching `forge:include ../<room>/core.mjs`; (b) stepping it
forward CHANGES the state vector; (c) the characteristic payoff FIRES inside the panel's
own run budget — the top precesses above ω_crit and only then falls; the tippe-top's θ
crosses π/2; the rattleback, launched at the disfavored sign, crosses zero and settles at
the favored one; the chair's ω rises ×4.31 under `omegaAt(r)`; the rotor's rider is held
above ω_c and sinks only below it; the tusi point sweeps the diameter and never leaves it.
Three **neg-controls** keep those from being vacuous: a soft tippe-top flick never
inverts, a favored-way rattleback never argues, and the chair's spin drops again when the
arms go back out. Everything is driven through the panels' own entry functions — never a
canvas pointer event, and `draw()` is never called headlessly.

### STAGING, NAMED HONESTLY (in the source, not on the page)

The cores model the flow, not spin bleed — none of them carries a coast-down term. Each
panel adds one coast-down rate and one timescale **of the maker's**, marked `MINE` in
`panels.mjs`'s header and at each constant. **Panel time is not room time.** This note
stays out of the visitor's page on purpose.

### BEYOND THE PROTOTYPE

- **Composition.** Objects were scaled to fill their niches (the draft left ~25% of the
  niche occupied under a field of dead brown).
- **Projection.** The oblique x-shear was dropped: depth is now purely vertical, so a
  horizontal circle projects to a horizontal ellipse of exactly the plinth's own squash.
  The objects and the stage they stand on are finally in the same perspective.
- **The rotor restaged** — the weak member. Two stacked ellipses seen from outside never
  read; it is now a tall, narrow barrel with the near wall **sawn away**, lit staves that
  make the spin legible, a floor rim dashed away, and the rider pinned to the wall with
  her shadow cast beside her, sinking with her.
- **The tippe-top stands up.** The body rides on whatever is lowest — the sphere while
  upright, the stem tip once it has walked over — so the inversion visibly LIFTS it,
  which is the same rise the room's energy ledger books.
- **Perf.** Sleeping panels are not repainted (dirty-flag), offscreen niches are paused by
  `IntersectionObserver`, and the tippe-top/rattleback substeps are capped per frame.
  Measured: 60 fps with all six alive; 60 fps and zero repaints at idle.
- **`prefers-reduced-motion` stills the PANELS**, not only the crown gleam — each object
  is posed in a settled frame (the wheel out on its axle, the stone rested on its keel,
  the tippe-top already stood up) that provably does not drift when stepped.
- **Keyboard + touch.** Each recess is `role="button" tabindex="0"`: Space/Enter flicks,
  ←/→ pick the spin sense (so the rattleback's refusal is reachable without a mouse), and
  Space is a hold for the chair. `touch-action:none` with real pointer capture; the 2-up
  and 1-up reflows were checked at 390 px with no horizontal overflow.

### THE ONE GRAFT FROM THE TURNTABLE

The line under each niche reads as **instruction** while the object sleeps ("flick to spin
it") and swaps, on waking, to that object's one line of **character** ("a wheel hung
sideways from one point: spinning, it will not fall — it walks the fall around in a
circle"). Instruction before, character after. Nothing else was imported — no rotation, no
two-tap door gate, no sound toggle, and no maker's-note footer.

### PLACEMENT

Registered as **one card on the Midway** (`a.ride.lit` → the Register picks it up as a
Midway exhibit) — a **deepen**, not a detach: five of the six rooms already stand in the
fairground and the sixth is the Drawing Room's tusi, so the cabinet gathers existing kin
under one roof rather than founding anything. No new wing slug, no map star, no new
front-door footprint. The six rooms keep their own doors untouched. The Midway's landing
copy and structural self-test were updated to 11 lit cards (39/39 green).

Sets `ws:seen:spin-cabinet`. `forge --check` clean; `manifest --check` clean.

---

## #435 — publisher's review pass ("Escapement")

**Fixed: the brass plates fell out of line the moment a niche woke.** `.say` reserved
`min-height:2.9em` — two lines — but every character line wraps to THREE at the 3-up
desktop width, so waking one niche pushed only that plate down 14px and the row's row of
brass went ragged (measured: plate tops `[411,397,397]` after a real click on the first
recess). Fixed at the layout level rather than by nudging the reserve: `.niche` is now a
flex column and `.plate` rides `margin:auto auto 0`, so every plate in a row sits on the
row's own baseline whatever its caption does at any breakpoint. The reserve was also
raised to `4.05em` so the row does not JUMP when a caption swaps. Re-measured with all six
woken: `[411,411,411]` / `[777,777,777]` at rest, `[49,49,49]` / `[415,415,415]` scrolled.
`text-wrap:balance` added to the closing `.sub` line.

**Two of the builder's open worries closed by measurement, not opinion.**

1. *"The top goes edge-on mid-precession"* — **unfounded.** Scanned the top's canvas for
   bright-ink horizontal extent every 110 ms across 26 samples of a precession lap: the
   object holds **45–56% of the canvas width** and never collapses toward a bar. The post,
   the stem and the swept floor shadow always carry the frame. No fudge needed.
2. *The `REDUCED` branch's own initialisation was untestable* — **now tested.** The browser
   driver's `set media reduced-motion` genuinely does not apply (`matchMedia(...).matches`
   stayed `false` after it), so CDP was driven directly: `Emulation.setEmulatedMedia` with
   `prefers-reduced-motion: reduce`, then navigate. `matches === true` — the branch really
   booted — all six canvases carry real ink (3,116–3,922 bright px, so posed OBJECTS, not
   blank stages), and the six canvas hashes are identical across 1.5 s. *When the driver
   cannot emulate a media feature, the browser underneath it still can.*

**Reviewed and deliberately left:** the Midway card's honest misfit (a display case in
`a.ride.lit`). It is named in the card, the lede and the stamp, and the landing's self-test
asserts that self-naming — read whole, it lands as character rather than error, and the
allowlist alternative yields no Register card at all.

**Landmine for the next reviewer:** the browser driver does NOT scroll to an offscreen ref.
The first attempt at row 2 silently missed while `data-live` read a plausible `0` and
`data-woke` stayed undefined. Scroll, re-snapshot, then click.

Verified after the edits: twin 29/29 · tusi 9/9 · rotor 31/31 · Midway 39/39 ✓ · Tusi room
3/3 ✓ · front door 12/12 ✓ · catalog 17/17 ✓ · keyboard flick wakes only the focused niche
· 60.4 fps with all six alive · console empty · 1-up at 390px with no horizontal overflow ·
`forge --check --all` 172 current · `manifest --check` OK (438 pieces).
