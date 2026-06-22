# The LC Tank — changelog

A pendulum made of electricity. The Lodestone Hall's free, UNDRIVEN oscillator:
one capacitor, one coil, one loop, no battery. Charge the plates, let go, and the
energy sloshes between the capacitor's electric field (½q²/C) and the coil's
magnetic field (½Li²) forever, at f = 1/(2π√(LC)), the sum dead constant.

A garden BENCH under the Lodestone Hall — no front-door footprint (bench, not swing).

---

## Cycle #264 — born

**The piece** (`lodestone-hall/the-lc-tank/`): an edge-on brass loop on a dark plate —
a capacitor (two plates, gap on centre) on the left, a coil (7 stacked ellipse rings,
the Hall's `drawCoil` idiom) on the right, top and bottom wires closing the loop. Boot
PRE-STAGED at the charge extremum (top plate fully blue, coil dark, a pulsing "▶ let go"
ring over the plates). Press **▶ let go** (or tap the plates) and the slosh begins: the
blue plate-charge empties into amber coil-current and back, a quarter cycle apart,
charge-dots streaming along the wires (emf-blue near the cap, fading copper near the
coil — charge becoming current). The **R dial** is the neg-control: turn it up and the
slosh rings down, RINGING → DAMPED.

**The witness** — a three-bar energy panel: blue ½q²/C (electric), amber ½Li² (magnetic),
and a green SUM bar pinned at the top that visibly **does not move** at R=0 (and gets the
`.diverge` red class + shrinks each cycle at R>0). A return-detector watches `sim.q` cross
back up through +Q0·0.999, flashes an amber tick on the diorama, and stamps a mark on a
period rail under a demoted q(t)/i(t) honesty-trace sparkline — the measured returns land
ON the predicted-T markers (row 1's <1e-9 made visible as "coincidence").

**The instrument rail** — three brass dials with the full aria contract (role=slider,
aria-valuemin/max/now, aria-valuetext, Home/End → rails): **L** (0.25–4), **C** (0.25–4),
**R** (0–0.6). Turning C or L up grows √(LC) and visibly SLOWS the slosh (structural: the
cosine takes longer in physical time); the `f = 1/period(L,C)` readout reads the core, never
a re-typed formula.

### The spine — `core.mjs` (the ONE idea: LC = pendulum of electricity, q↔x)

A FRESH, self-contained, zero-import closed-form spine (NOT a fork of `resonance/core.mjs`,
the honest DRIVEN cousin — same harmonic-oscillator ODE family, but ours is the UNDRIVEN free
tank, no drive term anywhere). Slab between `// === LC-TANK CORE BEGIN ===` and `// === LC-TANK
CORE END ===`; `export {…}` outside the sentinels. Canonical names + the aliases the witness reads:

- `omega(L,C) = 1/√(LC)` · `period(L,C) = 2π√(LC)` (canonical) · `periodT` alias
- `qClosed(t,L,C,Q0,φ) = Q0·cos(ωt+φ)` · `iClosed = −ωQ0·sin(ωt+φ)` (φ=0 ⇒ boot at q=+Q0, i=0)
- `energyE(q,C) = ½q²/C` · `energyM(i,L) = ½Li²` · `energyOf(q,i,L,C)` (the ONE oracle) · `energyTotal` alias
- `deriv(s,L,C,R) = [i, −(R/L)·i − q/(LC)]` (undriven; the neg-control lives in the −(R/L)·i term)
- `rk4Step` (classic RK4) · `trace(L,C,R,periods,perCycle,q0,i0) → {s,E0,eMin,eMax,eMaxPost,eEnd,monotoneDown,spread}`
- `runSelfTest() → {checks,passed,total,ok}`

### Self-test — GREEN is the sole authority

In-page pill (`window.__lcTankSelfTest`) **5/5** · `node lodestone-hall/the-lc-tank/core.test.mjs`
**26/26 EXIT 0**:

1. **PERIOD === 2π√(LC)** two ways over L,C ∈ {0.25..4}²: analytic period() vs 2π√(LC) (worst 0.00),
   AND the MEASURED zero-crossing period of the closed form (sub-step linear interp) === T (worst 3.55e-15).
2. **CLOSED FORM === INTEGRATED ODE at R=0**: rk4 from (Q0,0) vs qClosed/iClosed over 8 periods,
   worst max(|Δq|,|Δi|) = 6.07e-10 (perCycle bumped 720 → 1440 to clear 1e-9, as the design directed).
3. **ENERGY FLAT at R=0**: trace spread (eMax−eMin)/E0 = 8.83e-11 across the sweep — the flat sum line.
4. **NEG-CONTROL** (the hinge): R∈{0.02,0.1,0.5} energy STRICTLY DECAYS (monotone-down, span drains
   eEnd<E0·(1−1e-6)) while the SAME-(L,C) R=0 case holds FLAT (spread<1e-9) — the contrast is the
   assertion. (Note: at R>0 the FIRST step barely loses energy — i=0 at the release extremum — so decay
   is measured over the SPAN via eEnd, not the first sample.)
5. **QUARTER-PHASE**: |i| at every q-extremum and |q| at every i-extremum <1e-9 (worst ~6e-15); a dense
   scan confirms max |q̂·î| = 0.5 exactly (never both lit, structural via |cos·sin| ≤ ½).

Plus the twin's own sections: §6 energy-oracle consistency (split === sum, alias === oracle, boot energy
= ½Q0²/C exactly); §anti-circularity (no import, re-types its own ODE, names resonance, no drive term);
§byte-twin parity (the inlined slab is char-identical to core.mjs — 11129 chars — evaluated with NO
injection to 5/5, row-for-row agreement with the module).

### Wiring

One `<a>` added to `lodestone-hall/index.src.html`'s `.rail` right after the-transformer (glyph 🪢);
the Hall landing re-forged. A reciprocal Kin link back to the Transformer (the driven cousin) and to
`resonance/` (the Singing Glass, the honest cousin) sits in the LC Tank's own rail. NO PLACES entry,
NO map footprint, NO sky wing — `bigSwingsBuilt` STAYS 24.

**The engraved line:** *"No battery here. Charge the plates, let go — and the energy pours back and
forth between field and field forever, the only push being the one you gave it once."*
