# As Hangs the Chain, So Stands the Arch — changelog

## Born (cycle 470)

A companion instrument in The Works' structural vein — a **cross** with kin on both
ends: it imports the ring geometry + the proven line of thrust from
`../the-keystone-arch/core.mjs`, copies the catenary solver verbatim from
`../catenary/index.html`, and both those rooms now link to it while it links back
to both.

Robert Hooke's 1675 anagram made touchable: *"as hangs a flexible line, so, inverted,
stands the rigid arch."* A gold chain hangs from the two springers of the keystone
arch's actual nine-voussoir ring. Grab it, pay out slack (drag ⇒ solves the shape
parameter `a` in world units; release ⇒ a ~24-pass Verlet settle, then snaps to the
analytic `a·cosh`). Flip it up through the pin line and the same curve rises to
stand, the nine dry stones fading in around it, each glowing by its eccentricity
band (green ≤ t/6 · amber ≤ t/2 · red > t/2).

Two honest math layers:
- **the plain chain** — a uniform `a·cosh`; tuned to the crown (a≈1.6) its inverted
  curve threads all nine stones (max|e| = 0.3016 ≤ t/2) but rides near the edge at
  the haunches (J2/J3 amber). The beautiful intuition — never sold as the arch's own
  equilibrium line.
- **load it like the arch** — the funicular of the nine voussoir weights at the
  crown thrust `H` from `admissibleLine()`; inverted, its points EQUAL
  `core.thrustLine(H,y0).points` to machine ε (measured 0.00e+0), threading every
  joint dead-centre (max|e| = 0.1334).

The payoff: a draggable haunch load. Push it up and the working line steepens out of
the section; past t/2 the first joint hinges (J3 for a 3-unit load on J2, worst|e| =
0.757), the loaded half folds about its springer with a nonzero unbalanced gravity
moment, and the span falls.

**Self-test** (`core.test.mjs`, Node twin of the in-page pill): 21/21 — the
coincidence (funicular == core line of thrust < 1e-9), containment at a≈1.6 pinned to
0.3016, the payoff-liveness (the hinge fires, standsUp=false, |moment|>1e-6), the
band [1.4,1.8] contained while a=1.0 and a=5.5 go red, the copied catenary solver
(both pins + arc length to 1e-9), and the flip's exact reflection involution.

A **payoff-liveness twin** (`window.__hungLine.liveness()`, headless-drivable) drives
the real flip + load entry functions and asserts the ring rises and the arch hinges.

Registered as a fourth dry-stone niche in The Stoneyard's yard wall (a live mini that
flips a small chain up to stand); enrolled in the estate manifest.
