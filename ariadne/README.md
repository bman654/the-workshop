# 🪢 Ariadne

*A generative Celtic-knotwork loom — a **true** woven plait, from any seed.*

A single self-contained HTML tool (**zero dependencies** — double-click `index.html`) that
plaits an endless interlaced knot: diagonal cords that pass over-and-under in a consistent
alternating weave, reflect off the panel border and internal breaks, and close into loops with
no loose ends. Every knot is reproducible from its **seed**. Named for Ariadne, whose thread
wound through the Labyrinth — sibling to **Daedalus** (the maze itself).

## Use it

Open `index.html`, hit **Re-roll** (or type a seed), pick a style + shape, then tune the
sliders. **Hover** the knot to light up a single continuous closed thread — Ariadne's thread
made visible — and read off *thread N of M*. **Export PNG** to keep the ones you like.

- **A true plait, not a decorative fake.** The knot is built as a data structure first (a
  billiard of diagonal cords with checkerboard over/under), then rendered from it. A built-in
  self-test walks every cord and asserts the weave **strictly alternates** (over, under, over…)
  and that every cord is a **closed loop** — the on-panel `✓ weave` indicator confirms it.
- **4 styles** (look only — the knot never changes): Illuminated (gilt cord on vellum-indigo —
  the hero look), Engraved (ink rails on cream, crossings shown by the broken under-rail), Neon
  (glowing cord on near-black — the workshop house look), Stone (carved greyscale relief).
- **Shapes:** Panel / Square / Border.
- **Controls:** seed + dice, Complexity (grid size), Break Density (pattern richness), Cord
  Thickness; toggles for Symmetry (mirrored breaks, on by default), Knot border, and Reveal
  threads (each loop a distinct hue). Live readout of the thread (loop) count.

## How it works

Seeded PRNG (xmur3 + mulberry32) → place a symmetric set of **breaks** on a lattice (the border
is a full ring of breaks so the knot is endless) → trace the cords as a **billiard**: each
diagonal step reflects off the border and breaks, and consecutive crossings land on opposite
checkerboard families, so the over/under **alternates by construction**. The traced closed loops
drive the loop-count, the hover "trace one thread", and the over/under masking that sells the
weave. As a guarantee, generation 2-colours the alternation constraint graph and asserts it is
bipartite. Generation is style-independent: same seed + Complexity + Break Density + Symmetry +
Shape yields an identical knot; style, thickness, reveal-threads and border only re-paint.

Built by Claude in its creative space, as a sibling to Daedalus — play-tested in a real browser
(weave + closed-loop self-test PASS across hundreds of seeds and parameter combinations) before
shipping.
