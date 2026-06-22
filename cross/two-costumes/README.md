# Two Costumes, One Sine

A cross of **The LC Tank** (`lodestone-hall/the-lc-tank/`, a pendulum made of electricity) ×
**The Swing-Ship** (`swing-ship/`, a pumped pendulum — here, its FREE fixed-length leg). One free
harmonic law, `x″ + ω²x = 0`, worn by two literal bodies hung from one brass control-bar.

## The one idea

There is exactly ONE free, undriven, undamped oscillator law, `x″ + ω²x = 0`, and it does not care
what `x` is made of. Boot it from rest at an extremum and it is a pure cosine forever. We hang it from
two literal puppets:

- the **LC tank** — `q″ + q/(LC) = 0` (charge `q` is the position, current `i = q̇` the velocity),
  `ω = 1/√(LC)`. Charge pours between two plates; the coil flares by `|i|`.
- a **pendulum** on a fixed rod — `θ″ + (g/L)θ = 0` (small angle), `ω₀ = √(g/L)`. The arc IS the readout.

Drag **one slider** — the pendulum's effective length — and tune the two ω's into one motion. Set
`L_pend = g·L_lc·C` and the `g` cancels EXACTLY:

```
ω₀ = √( g / (g·L_lc·C) ) = √( 1/(L_lc·C) ) = 1/√(L_lc·C) = ω_LC
```

At the match the strings rise and fall in eerie lockstep: the charge hits its top plate on the SAME
tick the bob hits the end of its arc; the coil flares on the SAME tick the bob whips through
bottom-dead-centre. Both are the same cosine of time.

## The form

A brass twin-marionette stage. A horizontal control-bar holds two puppets on strings, both driven every
frame by the certified core state (never an independent animation):

- **LEFT** — the LC tank stood upright: two capacitor plates (top bright at `q=+Q0`, bottom at `q=−Q0`),
  a depicted glowing charge substance that pours between them, and a coil that flares by `|i|`.
- **RIGHT** — a real pendulum: brass shaft + bob on a fixed rod; the arc is the readout.
- A faint shared **timeline ribbon** below draws both normalized `x(t)` as one stroke (secondary
  confirmation only — the puppets carry the point). Tuned ⇒ ONE neutral-ink stroke; detuned ⇒ two beating.

## The hand verbs

- **Tuning slider** `L_pend` — drag toward the match. A magnetic detent eases the value toward exact
  within `|Δω|<0.06`; it SNAPS with a 1-frame brass flash at `|Δω|<1e-3` and the lock plate drops.
- **Damp lever** `β` (neg-control) — bleed ONE twin. Its arc winds down, its amplitude each cycle = `√(E/E0)`
  read from the certified energy oracle (never a cosmetic decay); its free twin swings undying. The
  conserved-energy classifier badge flips from `free pair ✓` to `✗ this one bleeds`.
- **Snap to match** — set `L_pend = g·L_lc·C` exactly and clear the damping.
- **Sound** (optional, mutable, NOT load-bearing) — each leg rings a soft sine at its own ω; out of tune
  you hear the beat at `|Δω|`, tuned you hear one unison. Degrades to a silent toggle if WebAudio is unavailable.

## The math, and the honesty

The two parent cores are imported byte-untouched (`core.mjs` imports `LC.*` and `SW.omega0`/`SW.G` only —
NOT swing-ship's Mathieu/nonlinear stepper). A fresh, **code-disjoint** linear θ-stepper is typed in the
cross core. The equivalence is asserted; the aesthetic constants are not.

`node cross/two-costumes/core.test.mjs` (exit 0) re-proves, with the same `runSelfTest()` the in-page pill calls:

1. **Same ω** — `|LC.omega(L,C) − SW.omega0(G·L·C)| < 1e-9` over an L×C sweep (measured 4.4e-16).
2. **Same function of time** (headline) — boot both at rest-at-extremum, integrate a full period with each
   core's own RK4, normalize (`q̂=q/Q0`, `î=i/(ωQ0)`; `θ̂=θ/θ0`, `θ̇̂=θ̇/(ωθ0)`); the two states agree `< 1e-9`
   (measured ~4.9e-15).
3. **Convention honesty** (`===`) — `pendOmega === SW.omega0`, `L_pend === G·L·C`, energy uses `G` verbatim
   (no smuggled 2π/½).
4. **Neg-control divergence + energy** — a damped leg diverges from its free twin `> 1e-4` AND its energy is
   strictly monotone-down; the free twin stays flat `< 1e-9`.
5. **Classifier bites both ways** — `free ✓` for both free legs AND `✗` for the damped legs (a vacuous
   always-pass fails).
6. **Byte-twin parity + disjointness** — `index.html` CORE === `core.mjs` CORE char-for-char; the θ-adapter
   names no LC fn, the LC-adapter no SW integrator; both parents imported at the same two `../` hops.

## Files

- `core.mjs` — the SOLE math authority (CORE-fenced; imports the two parents above the fence).
- `core.test.mjs` — the Node twin (re-extracts + re-proves; exit 0 on green).
- `index.src.html` — the forge template (inlines `core.mjs` via `forge:include`).
- `index.html` — the forged, self-contained page (the byte-twin of `core.mjs`).

Rebuild after editing the template or core: `node tools/forge/forge.mjs cross/two-costumes/index.src.html`.
