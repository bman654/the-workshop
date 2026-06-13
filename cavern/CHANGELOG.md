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

**The first benches** (built directly by the lead, each browser-verified on a served origin, self-test
green, clean console, ~60fps):

- **The Light Clock** (`cavern/light-clock/`) ⏱️ — special relativity. A bouncing-photon clock; push the
  velocity toward *c* and it slows. Two views (the clock side-by-side with a rest clock; a Spacetime panel).
  Self-test **7/7**: **γ derived from the Pythagorean slant matches 1/√(1−β²)** to **0.00e+0** (the central
  claim); the **interval s²=t²−x² is invariant** under boosts to **1.3e-13**; velocity addition stays ≤ c
  (and c⊕v = c); tick = γ·t₀ and the photon's proper time = the rest tick (8.9e-16); length contraction
  L′=L/γ reciprocal of dilation (1.1e-16); deterministic; falsifiable (a non-dilating clock ≠ geometry).
- **Newton's Cradle** (`cavern/cradle/`) ⚙️ — elastic collisions; conservation of momentum AND kinetic
  energy, with honest dissipation when restitution < 1. A swinging steel-ball cradle (3–7 balls, lift k,
  restitution slider) with a live momentum / KE / total-E readout. Self-test **6/6**: **elastic (e=1)
  conserves p AND KE** (1.8e-15 / 5.3e-15); equal masses swap velocities (4.4e-16); **lift k ⇒ exactly k
  swing out** (all 8 (n,k) cases exact — the cradle theorem); **e<1: p still conserved, KE strictly drops,
  (Δv_out)=e·(Δv_in)** (4.4e-16); falsifiable (e=0 sticks & loses KE, p held); deterministic. Live: total
  energy drift over an 8-s elastic run stays **−0.13%** (bounded, no secular blow-up).
- **Mercury's Precession** (`cavern/precession/`) ☿ — the GR perihelion advance; lands on the famous
  43″/century, with the Newtonian control precessing exactly zero. Integrates the relativistic Binet orbit
  equation `u″ = −u + GM/h² + (3GM/c²)u²` (RK4) and draws the walking rosette; a Newton/Einstein toggle, a
  visual-exaggeration slider (real Mercury is 0.10″/orbit — invisibly small — so the *drawing* is amplified
  while numbers + self-test use the **true** physics), eccentricity & semi-major-axis sliders, a Mercury
  preset. Self-test **7/7**: **Mercury → 42.997″/century** (closed form, not baked); **pure Newtonian 1/r²
  ⇒ zero precession** (integrated −6.9e-11 rad — the closed ellipse); the integrated GR advance matches
  6πGM/(c²a(1−e²)) to **4.4e-4** rel (honest first-order); advance ∝ 1/(a(1−e²)) exact; Kepler III T²∝a³
  honest; falsifiable (GR ≫ Newtonian by ~7000×); deterministic.

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
