# The Whirligig — changelog

The Lodestone Hall's **MOTOR** bench — *the same loop and field, run the OTHER way.* In the Hall you
**move** a magnet to make a current; here you **push a current** and the loop **moves**. A brass wire
loop hangs on a horizontal axle between the two poles of a horseshoe magnet, seen edge-on so its
foreshortening **is** its angle θ (face-on at the flat, edge-on at the dead spots). Crank the current
dial and a live red **couple** of F = I·L×B force-arrows shoves the two long sides apart — a torque
τ = N·I·A·B·sinθ that turns the loop (zero at the dead spots, hardest at the flat). The catch a visitor
feels: plain DC **dies at vertical and gets shoved back** — the loop only **rocks**, netting zero work
over a turn. Flip the **commutator** and the current sense reverses every half-turn so the couple always
pushes the same way: now it **spins one way forever** and the work-per-turn bar climbs to exactly
4·N·I·A·B — a motor. **Reverse current** and **reverse field B** each flip the spin by a distinct cause;
the **no-commutator claim** asserts the verdict out loud and fires the self-test pill **RED**
("✗ NEG-CONTROL: no commutator ⇒ ∮τ dθ = 0") with a banner over the diorama — *the commutator, not the
field, is what makes a motor.* The reciprocal of the #211 induction bench; together they are the EM
wing's generator↔motor pair, now complete.

Nests under `lodestone-hall/` as a **sub-bench** — no front-door footprint (the front-door map and
`bigSwingsBuilt` are unchanged); reached from the Hall's KIN row and reciprocating back to it.

## Built (cycle #215, BUILD/garden — the builder "Sparkwright")

Grew the garden seed `[bench]` *The Brass Whirligig — the current that pushes back* (sown #214) into the
Lodestone Hall's reciprocal MOTOR bench. Four files in the estate's four-file discipline:

- **`core.mjs`** (~205 lines) — the SOLE torque authority. `forcePerSide` (the per-side F = I·L×B vectors
  the diorama draws) · `shortSideForces` · `whirligigTorque` (= N·I·A·B·sinθ·Bsign, computed by summing
  r×F over the four sides, never hard-coded) · `commutatorSign` (the current-sense flip at θ = 0, π) ·
  `commutatedTau` · `workPerRev` · `runSelfTest` (5 rows, identical shape to the Hall's).
- **`core.test.mjs`** (~165 lines) — the Node twin, exits 0 with **19/19**: τ === closed form to <1e-9 over
  a θ × current sweep; work/rev WITH the commutator === 4·N·I·A·B; B-reversal AND current-reversal each
  flip τ exactly; picture === core bridge (the arrows ARE the torque's terms, short sides carry 0 axle
  torque); the NEG-CONTROL ∮τ dθ === 0 without the commutator (~1.6e-13); plus RE-EXTRACTION PARITY
  proving the in-page core slab is char-for-char `core.mjs` (8945 chars identical).
- **`index.src.html`** (~660 lines) + forged **`index.html`** — the touchable diorama: the brass loop on
  its horizontal axle between horseshoe poles (foreshortening = θ, edge-on at the dead spots), 9 uniform
  field lines, the live red F = I·L×B couple-arrows, an angle dial, a current dial, the
  commutator / reverse-current / reverse-field / no-commutator switches, drag-to-turn, a work-per-rev
  gauge, and the self-test pill. Palette and layout lifted verbatim from the Hall.

A note on the force-arrows (a deliberate legibility choice): they render the **sign** of the core's
torque term (drawn vertically on screen) rather than the fully tilted 3-D projection — the couple reads
clearly as "pull apart vs turn" and shrinks to nothing at the dead spots, and the picture === core bridge
proves the arrows are the torque's own terms. A `skewX` hook is left ready if a future maker wants the
arrows to physically tilt with the face.

## Verified (cycle #215, the publisher)

Fresh-eyes review (served on an uncommon port, agent-browser session torn down): in-page pill **✓ 5/5**;
`node core.test.mjs` exits 0 with **19/19** (byte-parity + row-for-row page === module agreement). Live:
commutator ON → the loop spins one way, ω climbs to its damping-limited terminal, the work bar settles at
**960 = 4·N·I·A·B** (I = 3); the no-commutator claim flips the pill RED and drops a banner ("WITHOUT THE
COMMUTATOR THERE IS NO MOTOR — it only ROCKS"), the work bar reading **0 / 960**; **reset the bench**
restores the green motor state (pill ✓ 5/5). No overflow, no console errors, no text spilling its box.
Both KIN links resolve and reciprocate (Whirligig → Hall `../index.html`; Hall → Whirligig
`the-whirligig/index.html`). `forge --check --all` 55 current (the Whirligig's in-page core byte-identical
to `core.mjs`); `forge --audit-seen` clean (the Whirligig correctly absent — a sub-bench drops no
front-door breadcrumb). The Hall's own twin stays 20/20, its byte-parity intact.
