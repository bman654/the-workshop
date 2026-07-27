# Three Feet Down — changelog

## 2026-07-27 · built

`three-feet-down/` — a walking creature on a meadow, and the polygon it stands on.
The estate's first piece with legs: 466 pieces and not one of them had a gait.

**Files**
- `core.mjs` — the whole beast, DOM-free. Body plan, gait table, foot placement,
  two-link IK, the least-squares plane through the planted feet, the anticipated
  weight shift, the convex hull, the margin, the sweep, and `predictThreshold`.
- `core.test.mjs` — the Node twin. **61 checks.** `node three-feet-down/core.test.mjs`
- `index.src.html` → `index.html` — WebGL2: sculptable heightfield, 96 k instanced
  grass blades, a shadow map, instanced tapered capsules for the animal, a ground
  overlay for the hull and the plumb line, footfall sound.

**What is claimed, and how it is checked**

Statically stable = the plumb line through the centre of mass falls inside the
convex hull of the planted feet. The room predicts, by counting feet and looking
at where they are (`predictThreshold`, no simulation in it), the lowest duty
factor at which each gait can hold that for a whole cycle. The twin bisects the
same threshold out of a fully simulated, settled beast — IK, fitted ground plane,
and a centre of mass summed from the very capsules that get drawn.

**Ten of the eleven gaits agree to four decimals**, `never` included:

| legs | gait | predicted | measured |
|---|---|---|---|
| 2 | stride | never — two sets of 1 foot | never |
| 4 | walk · lateral sequence | ½ + 1/4 = 0.7500 | 0.7962 |
| 4 | trot / pace / bound | never — two sets of 2 feet | never |
| 6 | alternating tripod | ½ | 0.5000 |
| 6 | metachronal wave | ½ + 1/6 = 0.6667 | 0.6654 |
| 6 | one side at a time | never — each set is one flank | never |
| 8 | alternating tripod | ½ | 0.5000 |
| 8 | metachronal wave | ½ + 1/8 = 0.6250 | 0.6250 |
| 8 | one side at a time | never — each set is one flank | never |

The eleventh is the four-legged walk, and the discrepancy is the best fact in the
room: at β = 3/4 a quadruped always has three feet down, two on one side and one
on the other, so the long edge of its support triangle is a **diagonal of its own
rectangle** — and that diagonal runs under the middle of the animal. Its worst
margin over the cycle is **−1.7 cm**; a hexapod tripod's is **+5.2 cm**. That gap
is why a slow-walking horse sways over its standing side and a beetle does not
have to, and it is what the **Lean** control does.

**Verified in a browser** (agent-browser + `tools/cdp/pointer.mjs`, port 8843):
60 fps at 1440×900 and at 390×844; real input-level clicks on stop / shove / lean /
gait / leg-count; a real CDP drag sculpts the hill (ground at (0,0) 0.597 → 0.906 m);
the trot topples about its diagonal and comes to rest ON the grass; **Walk on** stands
it back up; the bench sweep matches the prediction to 0.0 milliduty on the 6-leg wave;
audio measured live off the master bus — peak 0.223, RMS 0.021, no clipping.

**Two GPU landmines, both now in LANDMINES.md**
- The shadow depth texture was still bound to the `uShadow` sampler while being the
  render target. WebGL calls that a feedback loop and rejects the draw with
  INVALID_OPERATION — silently. Result: an empty shadow map and a world with no
  shadows in it, and nothing in the console.
- `R32F` + `LINEAR` filtering, fetched in a **vertex** shader, wedged the GPU
  process hard (0 rAF, screenshots time out). `NEAREST` + a hand-rolled bilinear
  from four `texelFetch`es fixed it and needs no extension.
