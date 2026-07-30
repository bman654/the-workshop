# The Washhouse — changelog

*A copper of soap left standing in the works yard, with a dry foam on it. John von
Neumann said the whole of what it is doing at a Metals Interfaces seminar in 1952, in
a page and a half: a bubble's area changes at a rate set by nothing but how many
neighbours it has.*

## 2026-07-30 — planted

**What it is.** Two hundred and sixteen bubbles pressed flat between two panes, on a
torus so there are no walls, coarsening in front of you. The room opens on a **perfect
honeycomb doing nothing** — every bubble six-sided, and a six-sided bubble cannot
change its area, so it would sit like that forever. Press the button and a few
neighbours swap; not one bubble's size changes, and the whole thing comes apart.

Click any bubble and the room follows it: its side count, its measured rate, and what
the law says. Wait for a T1 next door and watch the sign turn over the instant `n`
does. Break a film with your finger and two bubbles become one with a new side count
and a new fate.

### The model, entire

1. every film moves sideways at a speed equal to how sharply it is curved
2. a junction of three films slides downhill on total film length
3. a short film swaps its ends (T1); a tiny bubble goes (T2)

There is **no pressure in it**, no gas law, no area target, and the number six is
nowhere in the motion. Neither is the 120° at a corner — that is simply where rule 2
comes to rest, because three unit tensions can only sum to zero at 120°. The room's
corners find it on their own to about one degree, and everything else follows from
Gauss-Bonnet.

### What is exact, and what is measured

**Exact, at every instant, to machine precision.** The bubbles tile a torus, so their
areas sum to the same number forever — worst relative drift over a whole run
**1.4e-15**. And Euler's formula forces the mean side count to be **exactly six**
(3V = 2E, V − E + F = 0 ⇒ F = V/2): worst |⟨n⟩ − 6| = **0**, not small.

**Measured, with a discretisation error.** The rate per side. At the room's settings
it reads about **1.01 × π/3** with R² ≈ 0.997 over some thousands of bubble-windows.
The two errors point opposite ways — a coarse film mesh reads the junction's three
tensions off *chords* and comes out steep; a long time step lags the lengths and comes
out shallow — so refining only one of them is a cancellation study, not a convergence
study. Refining **both together**: (h, dt) = (0.20, 0.004) → 1.043, (0.10, 0.002) →
1.009, (0.05, 0.001) → 1.008, against a seed-to-seed spread of ±0.007.

**Size independence**, which is the part that surprises people: split the measured
bubbles at the median area and the two halves fit the same line (1.051 against 1.066)
across a **1130×** span of area. The drawer draws it as five dead-flat bands.

**Calibration before any foam.** The same solver is pointed at a bare closed loop with
no junctions in it, where curve-shortening flow gives dA/dt = −2π for *any* smooth
convex curve — von Neumann's law at n = 0. It returns −6.2756 for a circle and −6.2662
for an ellipse, and the error falls as the loop is refined.

### The switch that turns it off

**Hold the corners.** The junctions freeze where they stand; the films still flow by
curvature and nothing else changes. Live, the rate per side falls from **1.042 to
0.0072** and R² from **0.996 to 0.064**, the T1s and T2s stop entirely, and the foam
goes still. Everything a foam does, it does at the corners.

### Machinery

* **A junction carries no mass.** In the sharp-interface flow it is a force balance,
  not a particle. Giving it the same lumped mass as an interior node makes it lag, the
  corners sit a few degrees off, and the measured law comes out about a fifth shallow.
* **So the system is a saddle point** and no diagonal preconditioner touches it (400+
  CG iterations, and capping them wrecks the physics). The solve is done **in two
  storeys**: the nodes along one film are a *path*, so their block is tridiagonal and
  Thomas's algorithm eliminates them exactly; what is left is a small system over the
  junctions alone, nearly diagonal, and CG finishes it in about **ten** iterations.
  21 ms/step → 1.1 ms/step.
* **Mesh grading.** Node spacing along a film is crowded toward the junctions (a
  raised-cosine map), because the chord to the first node leans off the tangent by
  about κh/2 — five degrees at the natural spacing, and the single largest error in
  the whole room.
* **Cell loops are never hand-maintained.** After any topological event the faces are
  re-derived from the rotation system by the standard planar walk, and each new face
  is matched to the cell it used to be by a vote over its own films. A T1 only has to
  get four vertex-to-film lists right.
* One WebGL2 pass, instanced over as many copies of the period as the frame needs, so
  the foam has no edges.

`foam.mjs` is DOM-free. **`node the-washhouse/foam.test.mjs` — 50 checks, in three
separate parts:** the machinery at machine precision, the calibration on a loop whose
answer is known, and the claim.
