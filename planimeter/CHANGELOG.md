# The Planimeter — Changelog

A working **polar (Amsler) planimeter**: the brass drafting instrument that
measures the **area** of any shape by tracing its boundary. Trace a closed curve
and the measuring wheel's **net rotation × tracer-arm length = enclosed area** —
Green's theorem realised in brass and rolling friction.

## 2026-06-13 — v1 (initial build)

### What it is
- A single self-contained `index.html` (no build, no libraries, no network,
  no external assets). Inline CSS + canvas + vanilla JS. ~1209 lines.
- Belongs on the Workbench in the **Instruments** group (slide rule, astrolabe,
  abacus, sundial, Alberti disk) — real instruments that do real math.

### The mechanism (real, not faked)
- **Linkage:** a fixed **pole** → pole-arm (length `M`) → **elbow** → tracer-arm
  (length `L`) → **tracer point**. A **measuring wheel** sits on the tracer-arm
  with its axle **along** the arm, so it rolls only on the component of the
  tracer's motion **perpendicular** to the current arm direction.
- **Forward kinematics:** the elbow is solved as the intersection of the
  pole-circle (radius `M` about the pole) and the tracer-circle (radius `L`
  about the tracer); a consistent branch is held so the linkage never flips.
- **The integral (THE INSTRUMENT):** at each tracer step the wheel advances by
  `dW = dT · perp(armDir)`, evaluated at the step midpoint (midpoint rule,
  O(1/N²) convergence). Net roll `ΔW` over a closed loop gives **Area = L · ΔW**.
- **Pole placement:** the pole is always kept **outside** the figure (controls
  clamped, pole-arm `M` derived for reachability). For a non-pole-enclosing
  curve the zero-circle term vanishes, so **Area = L · ΔW exactly** — no
  correction is ever needed and none is applied. (We chose the "place the pole
  outside" route over computing the zero-circle correction; the self-test's
  pole-independence check proves the reading is invariant to where the exterior
  pole sits, the instrument's defining property.)

### Interaction
- Pick a preset figure — **circle / square / ellipse / random polygon** — and
  press **Trace** to watch the instrument auto-trace the boundary: the linkage
  articulates, the wheel spins, and a live area readout climbs to the answer.
- Or **drag the orange tracer** by hand around the figure; close the loop and
  the running area is what the wheel read (it rolls one way out, the other way
  back — only the *net* survives).
- Controls: figure, tracer-arm `L`, figure size, pole angle, pole distance,
  Trace / Reset wheel, a wheel-axis & roll-component guide toggle, three
  cosmetic skins (brass / blueprint / boxwood), and a 2× PNG export.
- Readout: wheel turns (dial), net roll `ΔW`, computed area `L·ΔW`, the TRUE
  area, and the relative error.

### Self-test (the workshop signature — NON-circular)
The wheel-roll integral (the instrument) is compared against an **independent
ground truth computed by a different method** — closed forms `πr²` / `πab` for
conics, and the **shoelace (Gauss) formula** for polygons. The two never share
code, so agreement is a real proof, not a tautology. Identical results in the
browser and under Node (the page and a headless re-audit call the SAME core).

**7 / 7 PASS.** Actual numbers (seed-stable, identical in browser and Node):

| # | Check | Result |
|---|-------|--------|
| 1 | circle: `L·ΔW == πr²` (4 radii, 6000 samples) | max rel **1.83e-7** |
| 2 | ellipse: `L·ΔW == πab` (3 ellipses, rotated) | max rel **1.83e-7** |
| 3 | polygon: `L·ΔW == shoelace` (6 seeded polygons, 300 samples/edge) | max rel **2.03e-7** |
| 4 | **pole-independence**: 5 exterior poles agree | spread/area **5.3e-15** |
| 5 | **zero**: out-and-back (zero-area) path | area **−2.0e-16** |
| 6 | **falsifiability**: correct `L` → right area, wrong `L` (×1.05) → wrong | wrong rel **0.050** |
| 7 | determinism / skin-invariance: identical inputs → identical reading | exact |

- **Max area relative error: 2.03e-7** (worst over all fidelity checks).
- **Pole-independence spread: 5.3e-15** (machine epsilon).
- Check #6 makes it falsifiable: a wrong arm length, or dropping the
  perpendicular projection, breaks the agreement.
- Convergence is clean (`O(1/N²)`): 40 samples/edge → 1.1e-5, 120 → 1.3e-6,
  300 → 2.0e-7, 800 → 2.9e-8. The midpoint rule meets the truth as samples rise;
  corners (polygons) are the hard part, so the polygon check uses 300/edge.

### House-style compliance
- `← workshop` (`../index.html`) and `← workbench` (`../workbench/index.html`)
  back-links in the topbar; both resolve (200).
- `localStorage.setItem('ws:seen:planimeter','1')` on load (try/catch). No
  `ws:flag:*` feats.
- Responsive (no horizontal overflow at 380px; board scales to fit).
- ~60fps during auto-trace (median 16.7ms/frame, worst 16.8ms — no drops).
- Clean console (no errors/warnings).
- `prefers-reduced-motion`: skips the auto-trace animation and shows the
  completed trace + final area immediately.

### Honest caveats
- **Zero-circle / pole-enclosure:** handled by *avoidance* — the pole is always
  kept outside the figure, so the zero-circle correction term is never needed.
  This is a legitimate real-instrument operating mode (the pole-outside setup);
  the alternative (pole-inside + additive constant) is not implemented.
- **Discretisation:** the integral is a sum over sampled boundary points, so the
  reading converges to the true area as samples increase (exact in the limit).
  The on-screen trace uses ~720 samples (display error ~1e-5); the self-test
  uses 6000 / 300-per-edge for ~2e-7.
- The wheel's physical radius affects only the dial's spin rate, never the area
  (area = `L · ΔW`, the rolled *distance*, independent of wheel radius).
