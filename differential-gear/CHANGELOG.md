# The Differential Gear — CHANGELOG

## #203 — planted (the gear that ADDS two rotations)

A touchable brass bevel-gear differential in the Reckoning Cabinet (manor · reckoning wing). One
horizontal main axle; two sun-bevels with EQUAL teeth; a carrier cage straddling centre with a
floating spider pinion meshing both suns. **Crank the two rims by hand** (drag-to-crank, the abacus
pointer-capture idiom with the ±π unwrap so a full hand-spin accumulates) and the single gold needle
on the cage parks at the **angular midpoint** of the two — the carrier turns at the **exact average**
of the two inputs, `ω_carrier = ½(ωL + ωR)`. No number is shown for the hero pose; the needle's
position *is* the claim.

### Why it's true — Willis's epicyclic relation
The train value taken relative to the carrier is fixed: `e = (ωR − ωc)/(ωL − ωc) = −N_L/N_R`. A bevel
differential reverses sense through the spider (e negative); with **equal teeth** `|e| = 1`, so
`e = −1`, which forces `ωR + ωL = 2·ωc` ⇒ the half-sum. It is not an approximation — it is forced by
the equal-tooth assumption. The spider's own spin is the half-DIFFERENCE `½(ωL − ωR)` — pure
differential rotation with zero average; the radius ratio k scales only that whir, never the average
(the law is k-independent, which is why the side gears MUST be drawn with equal teeth).

### The three felt regimes (one core, legible by motion)
- **Together** (⇉): both rims one way, equal rate → the cage carries the spider bodily, own-spin notch
  fixed relative to the cage. *Verified: carrier tracks, spider own-spin = 0.000 t.*
- **Opposite** (⇄, the HERO): equal & opposite → carrier DEAD STILL (a faint green "rest" halo so the
  frozen carrier reads as correct stillness, not a hang) while the spider whirs — the difference made
  pure spin, zero average. *Verified: θL=+0.262, θR=−0.262 → carrier 0.000, spider 0.262 t.*
- **Hold one** (⊣): pin one rim, crank the other a quarter turn → the needle lands on the eighth-turn
  mark, exactly half. *Verified: θL=0.250, θR=0 → carrier 0.125 t.*

Three brass preset levers fling the canonical flywheel pair on tap (the on-ramp — be shown each
regime, then grab the wheels); a one-glyph legend lights the regime you're currently in. A single rAF
loop owns dt — the flywheel coast and the render share it (no double-step). ~61 fps.

### The balance-beam overlay (the why-it's-true picture)
A "show the beam" toggle overlays a faint guide rail pinned end-to-end between the two input-dial
ticks (screen px), with a green BUBBLE riding it at the geometric midpoint `(x_L+x_R)/2` — never a
printed number. Because the spider meshes both suns, its centre can only rest at the midpoint, so the
bubble is always exactly halfway; tie-lines from each input tick to the carrier tick make the parking
unmissable. Lede: *"the spider rolls until it sits at the middle — its centre can only rest at the
average."*

### The LOCK neg-control (a diegetic falsifier under the hand)
A brass LOCK lever welds the spider to the cage: a red dashed dog-clutch ring + weld bead drop into
the pinion, the spider own-spin needle greys to 0, the carrier needle turns red, and the shafts yoke
into one rigid body (cranking adds the same delta to both, preserving their frozen offset). The beam's
ghost bubble stays at `(x_L+x_R)/2` (the LAW's prediction) but the rigid needle DETACHES from it — an
explicit red gap with a live readout *"avg law predicts X · machine reads Y · GAP Z."* `carrierLocked`
returns **NaN** on unequal demand — the math itself says "no solution." *Verified: hold-one then lock
→ predicts 0.13 t · reads 0.25 t · GAP 0.13 t.* Unlock and the ghost snaps back (gap → 0).

### The proof (sole-authority core, byte-twinned)
- `core.mjs` holds the e-based Willis core between `// === DIFF-CORE BEGIN/END ===` sentinels:
  `carrierFromSuns(wL,wR,e=−1)`, the two back-substitution directions, `spiderSpin`, `halfSum`, and
  `carrierLocked`. `runSelfTest()` is the **sole oracle** — the in-page pill and the Node twin both
  call exactly it. Six checks: (1) carrier == half-sum over a 4000-pt sweep; (2) the three Willis
  directions agree by back-substitution; (3) the three regimes EXACT — (5,5)→5, (5,−5)→0, (0,8)→4;
  (4) spider own-spin == ½(ωL−ωR); (5) NEG-CONTROL — the lock breaks the half-sum AND jams (NaN) on
  every unequal demand; (6) TAMPER — a perturbed e=−0.9 diverges from the half-sum.
- The law slab is inlined **byte-for-byte** into `index.html` inside the same sentinels (the estate
  idiom: cutting-gears / buffon / dissection all inline) so the needle and the engine are provably the
  same code, and the page opens from `file://` with zero server.
- `core.test.mjs` (the Node twin, zero deps) runs (A) the six checks; (B) extra rigour — a dense 1e5
  randomized sweep incl. extremes (1e±6, tiny diffs) asserting all three directions agree, the
  carrier equals the unweighted half-sum bit-exact, PLUS the two affine identities that are the
  signature of a true mean: homogeneity `carrier(a·ωL,a·ωR)===a·carrier` and translation
  `carrier(ωL+d,ωR+d)===carrier+d` (relative tolerance, since "machine-exact" over 12 orders of
  magnitude means a few ULPs, not a fixed absolute floor); (C) BYTE-PARITY — the inlined slab is
  byte-identical to `core.mjs` (1773 = 1773). `node core.test.mjs` → ALL GREEN, exit 0.

### Honesty floor (claims ONLY the equal-tooth average law)
The exact claim sits near the pill (Willis, proven three ways, <1e−12). The load-bearing SCOPE
disclaimer — the only automotive sentence allowed: *this is the equal-tooth speed-average only; a real
car's open differential uses equal teeth too, so the same law holds for its wheel speeds, but torque
split, limited-slip, Torsen worm gearing, and unequal-tooth planetaries are another story this bench
does not claim.*

### Registration & cross-links
- Front-door: one PLACES entry in `index.src.html` — `{ id:"differential-gear", glyph:"⊕",
  district:"manor", tier:2, wing:"reckoning", footprint:"reckoning", order:13, skyStar:
  "differential-gear" }`, companion The Slipstick.
- Sky: one catalog star `differential-gear @1180,700 mag 1` (dark lower-right band, nearest existing
  star = collisions @140px) + a new ADDITIVE feat-group **The Reckoner** (founding member
  differential-gear; never feeds the wings-only all-skies capstone). `sky.test.cjs` feat-group count
  bumped 5→6 in lockstep.
- Reciprocal cross-link (two-way) with **The Slipstick** (the wing's other analog adder): the
  differential's topbar links to the slipstick ("the gear that ADDS two lengths"); the slipstick's
  topbar (`index.src.html`, re-forged) returns "the gear that adds two rates ↗".

### Verification (the DoD gate)
`node core.test.mjs` green · `node tools/forge/forge.mjs --check --all` all 50 current ·
`node tools/layout/smoke.cjs` passes (intended #103 CROWDED warning, non-failing) ·
`node tools/sky/sky.test.cjs` 73/73 · `--audit-seen` clean (42 pages) · in-page pill 6/6 green ·
zero console errors · ~61 fps.

### Files
- `index.html` — the touchable instrument (self-contained, opens from file).
- `core.mjs` — the e-based Willis kinematic core (sole authority).
- `core.test.mjs` — the Node twin (six checks + 1e5 affine sweep + byte-parity).

## #203 — fresh-eyes polish (the locked hero row stops asserting a false equation)
Publisher review caught a readout inconsistency in the LOCKED state: the "What the cage reads" hero row
carries a STATIC label `carrier θC = ½(θL+θR)`, but when locked the value shown is the RIGID carrier
(`state.thetaL`), which is NOT the half-sum (e.g. θL=0.25, θR=0 → row read "= ½(θL+θR) = 0.25" while
½(0.25+0)=0.13). The label asserted an equation its own value violated — a quiet dishonesty against the
estate's machine-exact floor, and it muddied the very point of the lock (the carrier LEFT the average).
Fix (HTML/CSS/`updatePanel` only — the inlined DIFF-CORE slab is untouched, byte-parity still 1773=1773):
when locked the hero row swaps its equation note to `(rigid — no longer the average)` and turns the value
RED (`--weld`), matching the red needle and "the lock breaks it red"; the lockbox keeps the law-vs-machine
GAP readout. Unlock fully restores `= ½(θL+θR)` and the brass colour. Verified live: locked → label
`(rigid — no longer the average)`, value 0.25 t red, lockbox `predicts 0.13 · reads 0.25 · GAP 0.13`;
unlock → equation + brass restored; pill 6/6 green; ~61 fps; narrow-viewport reflow clean. All repo gates
green (forge 50/50 · node twin ALL GREEN · sky 73/73 · audit-seen 42/42 · smoke #103 warning only).
