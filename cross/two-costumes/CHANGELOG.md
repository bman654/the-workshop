# Two Costumes, One Sine — CHANGELOG

A cross of **The LC Tank** (`lodestone-hall/the-lc-tank/`, a pendulum made of electricity) ×
**The Swing-Ship** (`swing-ship/`, here its FREE fixed-length leg). One free harmonic law,
`x″ + ω²x = 0`, worn by two literal bodies hung from one brass control-bar.

## #292 — bloomed (the first build)

**The one idea.** There is exactly ONE free, undriven, undamped oscillator law, `x″ + ω²x = 0`, and it
does not care what `x` is made of. An LC tank rings at `ω = 1/√(LC)` (charge `q` is the position, current
`i` the velocity); a fixed-length pendulum swings at `ω₀ = √(g/L)`. Set `L_pend = g·L_lc·C` and the `g`
cancels EXACTLY — `ω₀ = ω_LC`. Boot both at rest at an extremum and both are the SAME cosine of time.

**The form (form expresses content).** A brass twin-marionette stage, not a phase plot. A horizontal
control-bar holds two puppets on strings, both driven every frame by the certified core cosine:
- LEFT — the LC tank stood upright: two capacitor plates (top bright at `q=+Q0`, bottom at `q=−Q0`), a
  depicted glowing charge substance that pours between them, and a coil flaring by `|i|`.
- RIGHT — a real pendulum: brass shaft + bob on a FIXED rod; the arc IS the readout.
- A faint shared timeline ribbon below draws both normalized `x(t)` as one stroke (secondary). Tuned ⇒
  ONE neutral stroke; detuned ⇒ two beating strokes.

**The hand verbs.** A tuning slider (`L_pend`) with a MAGNETIC DETENT toward the match (eases within
`|Δω|<0.06`, SNAPS with a 1-frame brass flash at `|Δω|<1e-3` and the lock plate drops); a DAMP LEVER
(`β`, the neg-control) that bleeds one twin — its arc winds down by `√(E/E0)` from the certified oracle
while its free twin swings undying; a snap-to-match button; and an optional, mutable, non-load-bearing
sound toggle (each leg rings a sine at its own ω — beat out of tune, unison tuned).

**The phase map (pinned, not eyeballed).** Both boot as pure cosines from rest, so `q↔θ` (both peak
together — bob at arc end) and `i = q̇ ↔ θ̇` (both zero-cross together — coil flare = bob through BDC).
Normalize and the two states are the SAME function of time. The ribbon is a literal single stroke.

**The negative control (the equivalence is genuine, not a fudge).** Throw the damp lever and the bob's
energy is strictly monotone-down (read from the SAME oracle the badge reads — never a cosmetic decay):
`E/E0 ≈ 3e-11` after 24 cycles, and its arc diverges from its free twin by ~0.22 rad. The conserved-energy
classifier returns `free ✓` for both free legs and `✗` for the bled one — a vacuous always-pass fails.

**The math (asserted exact; the aesthetic is not).** `core.mjs` is the SOLE authority; the two parents are
imported byte-untouched at two `../` hops (`LC.*` and `SW.omega0`/`SW.G` ONLY — never swing-ship's Mathieu
pump or nonlinear sinθ). A fresh, code-disjoint linear θ-stepper is typed here. `index.html` inlines the
CORE region byte-for-byte via forge; the Node twin re-extracts and re-proves, the in-page pill calls the
same `runSelfTest()`. Self-test (`node core.test.mjs`, exit 0):
1. same ω: `|ω_LC − ω₀_pend(G·L·C)| < 1e-9` over an L×C sweep (measured 4.4e-16).
2. same function of time: normalized states agree over a full period `< 1e-9` (measured ~4.9e-15).
3. convention honesty (`===`): `pendOmega === SW.omega0`, `L_pend === G·L·C`, energy uses `G` verbatim.
4. neg-control divergence + energy: damped diverges `> 1e-4` AND monotone-down; free twin flat `< 1e-9`.
5. classifier bites both ways: `free ✓` for both free legs AND `✗` for the damped legs.
6. byte-twin parity + adapter disjointness; both parents at the same two `../` hops.

**Registered + reciprocated.** A Workbench cross-gallery card (after The Same Beat). Reciprocal `↗` backs
added to The LC Tank, The Swing-Ship, and The Singing Glass (the driven cousin) — each matching that
page's existing topbar convention; resonance also gets an inline `↔` hint (the FREE undamped cousin of the
driven rim). The page drops its own `ws:seen:cross-two-costumes` breadcrumb on a direct visit.

**Verified.** `node core.test.mjs` 21/21 exit 0; `forge --check --all` green (89 files); `--audit-seen`
clean. Fresh-eyes browser: pill `✓ 5/5`, 0 console errors across load + tuning-lock to FUSION + detune to
two-needles + damp lever to the classifier flip + the sound toggle; no overflow at 1280×800 or 390px mobile.
