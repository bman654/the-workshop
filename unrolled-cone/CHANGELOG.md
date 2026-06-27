# The Unrolled Cone — changelog

Curved Country's **singular-curvature** hall: a cone is flat paper with a wedge cut
out, and that ONE cut holds **all** its curvature. The smooth twin
[The Holonomy Walk](../holonomy/index.html) spreads curvature over a dome; here the
integral ∬K dA collapses to a single Dirac spike at the apex — the angle **deficit**
δ = 2π(1 − sinα) of the removed wedge.

Joins the **CURVED COUNTRY** wing on the grounds (district `grounds`, tier 2, wing
`curved-country`) as its second hall — the wing now reads as one roof (shared accent
`#caa15a`, a two-star **Surveyor** asterism). Its cut-wedge cousin is
[Kirigami](../kirigami/index.html).

## Founding (cycle 342)

One self-contained room integrating three facets through one shared polar coordinate
(r = slant from apex, β = intrinsic angle ∈ [0, Φ]), all reading **one** math core
(`core.mjs`, forge-inlined byte-for-byte; a Node twin `core.test.mjs` proves the
claims to < 1e-12 and that the inlined slab is byte-identical).

**Facet 0 — the geometry (FOLD THE PAPER).** A brass **wedge-protractor** at the tip
is the SOLE writer of α: drag its knob and the gold KEPT arc Φ = 2π·sinα and the
hatched CUT arc δ = 2π(1−sinα) redraw live — the law on screen *as a picture*. A fold
scrubber drives a continuous isometry f ∈ [0,1] from flat sector to closed cone via
`embed(r,φ,f,α)`; `firstForm` proves the first fundamental form stays **E=1, F=0,
G=r²** at every fold — the fold never stretches the paper. A one-time intro fold
teaches "same paper".

**Facet 1 — the transport (CARRY THE ARROW).** The paper goes honestly flat and the
visitor walks a gold vector around the tip. `transportArrow` gives **dψ ≡ 0** every
step (flat paper, the felt punchline) while a slate ghost-north stays frozen; on
close the holonomy = the seam's deck rotation = the deficit. The apex flares and a
brass protractor blooms **∮ measured twist = δ**; the cartouche latches the discrete
Gauss–Bonnet law **∮κ_g ds + δ = 2π** (`geodesicTurning` measures ∮κ_g ds from the
developed shape ALONE — no δ fed in — so it independently confirms the deficit).

**Facet 2 — the negative control (MISS THE POINT).** A preset loop that misses the
tip returns the arrow unrotated; cartouche reads 0. "Miss the point — keep nothing."

### The proof (Node twin + in-page pill, < 1e-12)

1. first form E=1, F=0, G=r² at every fold (intrinsically flat — the fold is an isometry)
2. discrete Gauss–Bonnet duality H == 2π − ∮κ_g ds (7 α × 5 shapes)
3. exact anchor + shape-independence: H === δ(α)=2π(1−sinα) AND ∮κ_g ds == 2π−δ (kills circularity)
4. neg-control: a non-enclosing loop returns H == 0 exactly, ∮κ_g ds == 2π
5. flat per step: every dψ === 0 exactly
6. wedge closure: δ(α) + Φ(α) === 2π over a 200-point α sweep
7. winding-2: circle the tip twice ⇒ H === 2δ
   (+ byte-twin parity: the inlined core slab === core.mjs)

### Wiring

- Front-door card placed beside The Holonomy Walk (a bespoke `drawCone` footprint —
  a flat fan with a notched wedge).
- `tools/sky/sky.js`: The Surveyor feat-group gains `unrolled-cone` as its second
  member; a new star at (40, 730). Drops `ws:seen:unrolled-cone` on direct visit and
  first interaction.
- Reciprocal cross-links with The Holonomy Walk (topbar + a kindred line each way).
