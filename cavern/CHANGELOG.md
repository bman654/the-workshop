# The Cavern — changelog

*The estate's physics laboratory, quarried into the hillside and kept underground "for safety."
A front-door **wing** (the grand "Physics Lab" seed begun). Two drifts off a central shaft — a warm
Newtonian one and a cold Einsteinian one — and now a third, the **Quantum Drift**, which opens once a
visitor has walked both. Every bench is one self-contained vanilla HTML file that proves its own physics exact.*

---

## 2026-06-13 — the Quantum Drift opens (the Double Slit ships)

*The "deferred" back-passage from the wing-opening entry below is no longer deferred. The sealed shaft
now opens — in-page, spatially — and its first bench is live. Built this session as a lead/deputy split
(the lead wired the reveal in the main tree; a per-bench deputy built the bench in a `bench-double-slit`
worktree), then integrated and re-verified end-to-end in a served browser.*

**The unlock — a spatial, in-page reveal** (`cavern/index.html`). The barred quantum shaft opens once
the cave "remembers those who walk both drifts": at least one **Newtonian** bench seen AND at least one
**Einsteinian** bench seen, read from the `ws:seen:<id>` breadcrumbs the benches drop. The predicate is
pure and self-contained — `walkedBothDrifts(store)` over a `{has(k)}` store (`NEWTONIAN_IDS =
['cradle','brachistochrone']`, `EINSTEINIAN_IDS = ['light-clock','precession']`); storage-off stays
harmlessly locked. When earned, the sealed `#vault` swaps out (`body.quantum-open #vault{display:none}`)
and the `#quantumDrift` section reveals — a cold electric-violet drift, distinct from the Undercroft's
cellar machinery (this reveal is spatial and stays inside the cave). The Cavern landing's self-test grew
**8/8 → 17/17**: the 7 original structural checks plus the predicate proved exact over synthetic stores
(empty→locked, only-Newtonian→locked, only-Einsteinian→locked, one-of-each→OPEN, brachistochrone counts
as Newtonian, a non-drift breadcrumb→locked, storage-off→locked) and a "rendered reveal matches the live
predicate" check (no drift between logic and DOM; Double-Slit link present iff unlocked, and relative).

**The Double Slit** (`cavern/double-slit/index.html`, **917 lines**) 🎯 — the experiment Feynman called
"the whole mystery of quantum mechanics." Fire particles one at a time at a pair of slits; each lands as a
single dot, yet the dots pile into bright/dark fringes. Close a slit — or merely **watch** which one each
particle takes — and the fringes wash out. Self-test **8/8**: **fringe spacing measured = λL/d** by
root-finding the dark fringes from `dI/dy=0` (no reference to the closed form) → Δy = 5.000000000 mm vs
λL/d = 5.000000000 mm, **rel err 1.73e-16**; maxima at `d·sinθ=mλ`, minima at `(m+½)λ` (dark orders
`I/I₀ = 1.76e-30`, exact zeros); **interference == the cross term** `2Re(ψ₁ψ₂*)` proved equal to
`4·sinc²(α)·cos²(β)` (max |Δ| = 8.88e-16 over 4000 pts); close-slit → envelope only (visibility
1.0000 → 0.0238); **which-path detector → fringes wash out** (incoherent sum, cross term destroyed);
**Born rule** — 300k seeded particles, 40 bins, reduced χ² = **1.029**; **falsifiable control** — the same
counts reject a flat target at reduced χ² = **8399**; deterministic seed + exact λ,d,L scaling (×2→2.0,
d×2→0.5, worst dev 0). Pure/deterministic core, validated byte-identical in Node and in the page. Honest
far-field/Fraunhofer small-angle convention (stated in the readout), schematic barrier mask (µm slits are
invisible at cm-fringe scale, commented as such). Fully self-contained — zero external URLs/CDN/deps.

**Integration & QA (served origin, real browser):** the Cavern landing self-test holds **17/17** in both
states; **locked** shows the sealed vault with the Quantum Drift hidden; dropping one Newtonian +
one Einsteinian breadcrumb and reloading flips it **open** (vault `display:none`, drift revealed, the
`double-slit/index.html` link present and relative); clicking through loads the bench, whose own self-test
reads **8/8**. Zero console errors throughout. The `bench-double-slit` worktree was retired after the one
new file was lifted into the main tree (nothing else touched).

---

## 2026-06-13 — fix: Newton's Cradle drag direction

**Bug (post-ship, reported by Brandon).** Grabbing a ball to drag it aside clamped to the *wrong* half —
the left ball could only be pulled *inward* (up to the right, through the row) and the right ball only up
to the left. **Fix** (`cradle/index.html`, `pointerDown`): the outward `dragSign` was inverted — the left
group should swing to −θ (left) and the right group to +θ (right). One-line flip. The 6/6 self-test is
unaffected (it doesn't exercise dragging); the corrected clamp was re-verified in Node and with a real
in-browser drag (left ball now lifts outward to the left).

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

**Deferred (a future session):** the rest of the **Quantum Drift** — Particle-in-a-Box / Tunnelling, per
`worklog/physics-lab-plan.md` §3. *(The Double Slit and the "walked both drifts" `ws:` unlock predicate
shipped 2026-06-13 — see the top entry. The drift now exists, so new quantum benches just slot in beside
the Double Slit behind the same unlock.)*
Also deferred (a consideration, not a mandate): a Survey-of-Heaven "Experimenter" constellation for the
cave — best wired once the wing has filled out and the Quantum unlock gives a reason to reward exploring it.
