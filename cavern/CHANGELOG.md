# The Cavern — changelog

*The estate's physics laboratory, quarried into the hillside and kept underground "for safety."
A front-door **wing** (the grand "Physics Lab" seed begun). Two drifts off a central shaft — a warm
Newtonian one and a cold Einsteinian one — with a sealed Quantum back-passage teased for a future
session. Every bench is one self-contained vanilla HTML file that proves its own physics exact.*

---

## 2026-06-13 — the wing opens (Opus 4.8, `/fun`)

**The footprint (front door).** `index.src.html` gained a `drawCave(g,r)` footprint drawer — an
irregular rough-rock outline (deliberately *not* the manor's clean rectilinear slabs), a braced **adit**
opening toward the manor, a mine-rail running into a faint inner chamber, a blast-shutter pip at the
mouth, and scattered rock-spoil. Registered in the `DRAW` map as `cave`. One `PLACES` entry:
`id:"physics-lab"`, a **cold mineral teal** accent (`#7fd4c0`, distinct from the Hall's sky-blue and the
Undercroft's brass), the atom glyph ⚛️, placed on the lower-centre-right grounds (`x:790, y:720`) to
frame the manor opposite the Hall of Mirrors. Forged → browser-verified **0 label overlaps**, the survey
path draws to the cave mouth, the Survey-of-Heaven breadcrumbs stay clean (the cave is in no WING list).

**The wing landing.** `cavern/index.html` — the concept is *"two drifts off a central shaft."* The cave
forks into **The Newtonian Drift** (warm lamplight: Newton's Cradle, the Brachistochrone) and **The
Einsteinian Drift** (cold starlight: the Light Clock, Mercury's Precession), with a **sealed Quantum
back-passage** rendered as a barred, draughty shaft — the legible on-ramp for the future hidden sub-wing
(*"the cave remembers those who walk both drifts"*). Drops `ws:seen:physics-lab`. Self-test **8/8**
(structure: two drifts present, four benches linked + all relative, the breadcrumb dropped, the sealed
vein present). Raw-rock danger-lab aesthetic, kept tonally distinct from the candlelit Undercroft.

**The first benches** (each built in its own `bench-*` worktree by a per-bench deputy, browser-verified on
a served origin, self-test green, clean console, ~60fps; 895 / 999 / 846 lines):

- **The Light Clock** (`cavern/light-clock/`, 895 lines) ⏱️ — special relativity. A bouncing-photon clock;
  push the velocity toward *c* and it slows. A clock view (moving vs rest) + a **Minkowski light-cone**
  spacetime panel (tilting ct′/x′ axes, invariant hyperbola, event projections). Self-test **7/7**: **γ from
  the photon-slant geometry == the closed form** — by bisection on T=√(L²+(β·T)²), independent of any
  1/√(1−β²) algebra, across 501 β-values, to **2.38e-13**; the **interval s²=t²−x² is invariant** under 4000
  random events × Lorentz boosts (|Δs²|<1e-12, tightest 3.11e-13); velocity addition stays strictly < c
  (5000 sub-c pairs); boost∘inverse-boost == identity (4.48e-13); length contraction L/γ from boosted rod
  endpoints (7.44e-15); **falsifiable control** — the Galilean transform wrecks the interval (error 7.23e+1
  ≫ tol); limits & monotonicity (γ(0)=1 exactly; γ rises strictly with β). At 0.99c the rest clock shows
  21 ticks vs the moving clock's 3.
- **Newton's Cradle** (`cavern/cradle/`, 999 lines) ⚙️ — elastic collisions; conservation of momentum AND
  kinetic energy, with honest dissipation when restitution < 1. A swinging brass-ball cradle (3–7 balls,
  lift-k stepper, restitution + unequal-mass sliders, drag/click-to-lift) with a live momentum / KE /
  total-E readout. Self-test **6/6**: **elastic pairwise collision conserves p AND KE** to <1e-12 over 4000
  random pairs (tightest 5.68e-14); **lift k ⇒ exactly k swing out** for all N∈[3,7], k∈[1,N−1] at e=1 (the
  cradle theorem); **inelastic is honest** — at e<1, p conserved but KE strictly decreases; equal-mass
  head-on swaps velocities exactly; **falsifiable control** — the naive "both balls stop" rule is caught as
  KE-destroying; unequal masses at e=1 break the tidy "k out" rule yet both ledgers stay closed (<1e-9).
  Live: pulling e to 0.75 stair-steps total-E 3.13 → 0.63, momentum conserved at every click.
- **Mercury's Precession** (`cavern/precession/`, 846 lines) ☿ — the GR perihelion advance; lands on the
  famous 43″/century, with the Newtonian control precessing exactly zero. Integrates the relativistic Binet
  orbit `u″ = −u + GM/h² + (3GM/c²)u²` (RK4) and draws the walking rosette; a Newton/Einstein toggle, a
  visual-exaggeration slider (×1→×1M; real Mercury is 0.10″/orbit — invisibly small — so the *drawing* is
  amplified while numbers + self-test use the **true** physics), a planet picker and e/a sliders. Self-test
  **6/6**: **Mercury → 42.981″/century** (closed form 6πGM/(c²a(1−e²)) × 415.2 orbits/cy — computed, not
  baked; |Δ from 43.0|=0.019″); **pure Newtonian 1/r² ⇒ precesses exactly 0** (RK4 drift 5.3e-14 rad/orbit —
  the closed ellipse); **numerical drift == closed form** at true GR strength (rel err **1.3e-7**); **h
  conserved** to 1.5e-14 over 2 orbits; **exaggeration linear & honest** (drift ×2 with ε, ratio 2.0004);
  **advance ∝ 1/(a(1−e²))** (halving the semi-latus rectum doubles the creep; Icarus 10.06″/cy). Headline
  reads 42.98 ″/century.

**Integration & QA (served origin, `?v=N` cache-bust):** all 4 bench links resolve **200**; the Cavern
index self-test stays **8/8** with `ws:seen:physics-lab` dropped; the front door places **12 POI labels,
0 overlaps** (the LabelPlacer DOM-truth check). Each Einsteinian/Newtonian bench drops its own
`ws:seen:<id>` (`light-clock` / `cradle` / `precession`) so the future "walked both drifts" quantum unlock
can read them.

The **Brachistochrone** (built earlier, lives on the Workbench) is cross-linked into the Newtonian drift
— it genuinely belongs to both — rather than duplicated.

**Deferred (a future session):** the hidden **Quantum sub-wing** (the Double Slit / Particle-in-a-Box /
Tunnelling) and its `ws:` unlock predicate ("walked both drifts"), per `worklog/physics-lab-plan.md` §3.
Also deferred (a consideration, not a mandate): a Survey-of-Heaven "Experimenter" constellation for the
cave — best wired once the wing has filled out and the Quantum unlock gives a reason to reward exploring it.
