# The Headwaters — CHANGELOG

## 2026-07-29 — built

A new room at the far end of the glasshouses: an island rising out of the sea with
the rain on it, at about a million years a minute, and the tree the water leaves
behind when it has finished.

Four hundred and seventy-four pieces stood on this estate and none of them was about
**where the water goes**. `drainage`, `fluvial`, `Strahler`, `watershed`, `meander`
all came back empty.

### What is running

Three lines of physics, and nothing else:

```
dh/dt = U  −  K A^m S^n  +  D ∇²h
```

the ground rises; the water cuts, harder where more water is passing and where it is
steeper; and soil creeps downhill. `n = 1`, which is what makes the cutting term
solvable **implicitly** in a single sweep from the sea upstream (Braun & Willett 2013)
— unconditionally stable, so a timestep is nine hundred years and the island matures
in a minute of watching.

* **Priority-flood** (Barnes, Lehman & Mulla 2014) fills the pits, and the order it
  pops cells in **is** the ascending-elevation order the two sweeps need, so the sort
  is free. That single observation is what makes the whole step 8 ms at 256².
* The geology runs in a **Web Worker**. Snapshots are transferred, and the page hands
  the buffers straight back, so a landscape stepping fifty times a second is not also
  making a megabyte of garbage a frame.
* The terrain is **WebGL2 with no vertex attributes at all** — each vertex derives its
  cell from `gl_VertexID` and texelFetches its own height out of an R32F texture
  (`NEAREST`; a float texture is not filterable in core WebGL2 and a `LINEAR` sampler
  on one returns black). Shadows are a **horizon march over that same texture**, so
  there is no shadow map and none of its bias, and the sun can be dragged from early
  to evening with no rebuild of anything.

### The claim

**Nothing in the rule knows what a river is.** Every cell asks two questions: how much
water passes me, and how steep am I. What grows is a **tree**, and the tree has the
measurements real rivers have.

* **Hack's law** — the main stream of a basin against its area, `L = c A^h`. Measured
  live over every point of the network taken as the outlet of its own basin, fitted to
  binned medians (a straight fit over the raw cloud is really a measurement of the
  small end; the unbinned number is reported alongside and agrees). The island gives
  **h ≈ 0.60–0.62 at R² ≈ 0.995 over 2.3 decades of area**. Hack measured **0.6** in
  Virginia in 1957. It is never 0.5 — which is what a family of geometrically similar
  basins would give.
* **Horton's laws** — the streams of each Strahler order fall off as a geometric
  ladder. Typical: `433 : 87 : 21 : 4 : 1`, bifurcation ratio **4.7**, R² **0.999**.
* **And it does not move.** The Node twin runs the same island at four mesh
  resolutions (spread in *h*: **0.042**) and at seven parameter settings — 7× in
  erodibility, 16× in soil creep, 3× in uplift, another seed (spread: **0.118**, and
  every one of them still well clear of ½). Then it runs it at half the physical size,
  where a geometric exponent must not notice.
* **The switch that turns it off.** Let each cell forget the water that came from
  above — `A :=` its own rain, one line — and run the same seed, the same rock, the
  same clock. Hypsometric integral **0.36 → 0.66**, Hack R² **0.94 → 0.14**, and the
  mountain comes out **twice as tall** because nothing is cutting it down. The room
  grows both in front of you and puts them side by side.

### What is in the room

* Drag to orbit, wheel to close in. **Click anywhere on the land** and a drop runs home
  down the flow path it would actually take, and the panel says how far it goes and
  what order of stream it joins.
* **Make it rain** — four hundred and twenty drops off the divides at once, in one
  draw call, each vertex carrying the absolute second at which the head reaches it.
* **Stream order** — the network repainted by Strahler order, each order carried out
  to a radius that grows with it (`orderSpread`), because otherwise a fifth-order
  trunk is the same hairline as the four hundred first-order threads.
* Rock, uplift, soil creep, the clock, the sun, and the vertical exaggeration, all live.
* Sound: surf, and running water whose level follows the number of channel heads on
  the island — so the room gets louder as the network grows. Shared `ws:pref:muted`.

### Honest, and said on the card

The vertical is stretched (the slider says by how much). Rivers are painted about ten
times too wide with a half-cell floor: a real river draining ten square kilometres
here is seventeen metres across and one cell is forty, so at true width the network
would fall between the samples and not exist at all. There is no sediment transport,
so no deltas and no infilled valleys. And the slope–area law `S ∝ A^(−m/n)` is **not**
offered as a discovery — it is the steady state of the rule, by construction, and the
twin uses it only as a check that the solver arrives where the algebra says. Hack and
Horton are not by construction, and that is the whole difference.

### The twin

`node the-headwaters/erode.test.mjs` — **47 checks, green, 31 s.** Deliberately in
three parts: MACHINERY (the heap, the flood, the ordering, the ribbon transform against
brute force) at machine precision; THE SOLVER (implicit residual 9e-14, the diffusion
stencil against its own discrete eigenvalue to 1e-12, `m` and `K` read back off the
landscape); and THE CLAIM (Hack, Horton, universality, the deletion).
