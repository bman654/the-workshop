# The Water-Clock — CHANGELOG

A touchable bench in **The Hours** wing (`hours/water-clock/`): race a straight cylinder against a
fourth-root bore — the same water through the same hole — and watch one drain in an *accelerando* while
the other ticks like a *metronome*, both finishing empty at the same instant. The constant clock the
ancients chased, made out of a reshaped bore. Stands on **fluids** (Torricelli), not the wing's solar core.

## v1 — #74 (2026-06-16)

The wing's reserved clepsydra plinth, built. (Sown as the `[exhibit]` **The Water-Clock — even hours
from a shaped bore** garden seed at cycle #73; bloomed here at #74.)

**The piece.** ONE wide SVG "tank room" (`viewBox 0 0 760 460`): a straight cylinder + a fourth-root
bore standing on a brass shelf. **Fill both** (a fair race — same `h0`, same orifice), hit **▶ pour /
run**, and the two surfaces fall:

- the **straight cylinder** empties *fast-then-slow* — `dh/dt = −(a/A)·√(2gh)` depends on the head, so it
  rushes when full and crawls when nearly empty; its painted hour-marks **crowd** toward the bottom
  (`Δ(√h)` is the constant, not `Δh`). The negative control — and the reason the ancients couldn't keep
  even hours with a straight vessel.
- the **fourth-root bore** has a cross-section `A(h) ∝ √h`, the shape demanded by `dh/dt = −C`, so its
  level falls **linearly** `h(t) = H0 − C·t` and its hour-marks are **even** — a metronome. The radius
  profile is a fourth root: `r(h) = √(K/π)·h^¼` (narrow base, flaring top).

Both fill to the same head and drain through the same hole, so they finish at the **same instant** (15.0 s,
all 6/6 marks lit) — *same finish, different cadence*.

**Form expresses content.** The vessel walls are *sampled* from `radiusAt()`, so the drawn bore **is** the
bore the math used (a cosmetic px floor on the near-zero bore base). The water is a `clipPath` + `rect`
whose top-`y` is set each frame from `heightAt(t)`; a brass float + meniscus rides each surface; the
hour-marks are painted once from `hourMarks()` (legible before GO) and **light** as the surface passes,
with a 250 ms ring pulse + "marks lit n/6" readouts. No plotted curve — a thing you pour and watch.

**Controls.** Fill both · ▶ pour / run (rAF, `t = (now − t0)·SPEED`) · Reset · a **15 s / 30 s SPEED
toggle** that scales ONLY the wall→core delta (the core stays in physical seconds — verified no leak) · a
"the same water · the same hole" scale-rule. A **"what this proves"** panel states the claim and an honest
**NOT-claimed** scope (idealised Torricelli — inviscid, incompressible, no vena-contracta discharge
coefficient, no surface tension, a quasi-static slow-drain limit, a massless float: we model the SHAPE LAW,
not a real vessel's friction). The wing's myth line + an honest colophon. **Reduced-motion** renders a
frozen half-drained frame (the crowd-vs-even contrast read static, Run disabled).

**The math is single-sourced & self-testing.**
- `core.mjs` (136 L) is the **sole fluids authority**: Torricelli `v = √(2gh)` → the outflow ODE
  `dh/dt = −(a/A(h))·√(2gh)`; the cylinder's falling-parabola level + the `A(h) ∝ √h` shaped bore that
  drops the level linearly; the 4th-root radius profile; closed forms first, **RK4 as an independent
  witness**. All pinned constants derive from `T_DRAIN = 15` (so the negative control is honest —
  `A_CYL` is derived to make both vessels finish at the same time).
- `index.html` (752 L) inlines a **byte-identical** copy of the core between
  `// ===== WATER-CLOCK-CORE … =====` sentinels, so the page can't drift from its test.
- `core.test.mjs` (Node twin) → **12/12 GREEN, exit 0**: RK4 shaped level tracks `h0 − C·t` to 7.59e-14
  over the whole drain · `shapedEmpty() = 15.000` exact + RK4 `tEmpty` within 2.87e-12 · shaped marks EVEN
  (max|gap − H0/N| = 2.08e-17) · NEGATIVE CONTROL `cylinderEmpty() = 15.000` yet marks CROWD
  (max/min gap = exactly 11.000) · cylinder `Δ(√h)` uniform = 0 · shaped `dh/dt = −C` worst 6.94e-18 ·
  4th-root signature ratio = √2 to 1e-12 · volume conservation rel 4.96e-8 · **BYTE-PARITY** (the inline
  core === `core.mjs` char-for-char, export-stripped).
- In-page pill **self-test 11/11 ✓** (`window.__waterClockSelfTest = {pass: 11, total: 11}`).

**Registration.** A 2nd live bench card on the Hours landing (⏳ "Race the two vessels" → `water-clock/`);
the water-clock clause trimmed out of the empty-plinths seed list (analemma · equation-of-time · escapement
remain). Drops `ws:seen:water-clock`; never touches `ws:seen:gnomon`. "Run the day" / `the-hours.html`
left byte-untouched. The bench is a plain hand-inlined page (the alchemy/titration precedent), so no forge
run is owed; `forge --check --all` → all 31 current.

**Fresh-eyes review (#74).** Served `127.0.0.1:8761` (torn down by exact PID 82628; Brandon's :3001/:4380
untouched). Shipped clean — nothing real caught. Node twin 12/12 · in-page pill 11/11 ✓ · 0 console errors
(only the green self-test log) · 0 nested anchors · 0 horizontal overflow @1280 AND @390 on the bench AND
the landing. Verified LIVE: a full pour ran the cylinder fast-then-slow (its surface at the crowded marks
while the bore was a third down at the same instant) and both froze empty all-6/6-lit together at 15.0 s;
the bench card navigates end-to-end (`hours/` → "Race the two vessels" → `/hours/water-clock/`); mobile
@390 collapses to one legible column on both surfaces; the reduced-motion frozen frame verified via direct
`renderReducedMotion()` invocation (CDP `set media reduced-motion` doesn't register in this Chrome build —
a known emulation gap, not a page bug; the logic reads RM at boot via `matchMedia`).
