# The Aperiodic Patch — changelog

## Bloom (cycle #98) — the estate's first hand-placement tiling puzzle

A tile-laying puzzle you place BY HAND, the touch half of the Penrose pair (the Strange Garden's
`penrose.html` is the auto-deflating watch half — reciprocally cross-linked). Seat Penrose P3 rhombs
on a pre-seeded board: click a glowing frontier edge and the tray fans out ONLY the (tile,orientation)
candidates that legally seat there (Conway arrow markings must meet head-to-tail AND no overlap). You
cannot make an illegal move — the constraint teaches by what it withholds. Fill a five-fold **Sun**
(the shipped challenge) and a soft confetti-of-light blooms. An always-on, debounced repeat-hunter
keeps reporting **no translational repeat**; the load-bearing beat is the **periodic-control toggle**
— swap the tray for a plain square grid and the SAME hunter flips to **REPEAT FOUND · overlap 1.00 ·
v=(1,0)**, lighting one fundamental cell. One toggle from permit to forbid; the visitor feels it.

### The three proven legs (`node aperiodic-patch/core.test.mjs` → 16/16 GREEN, exit 0; in-page pill 5/5)
1. **Matching enforced exactly** — every legal seat the engine offers actually passes `edgesMatch` and
   does not overlap; a reversed-arrow edge and a wrong-kind edge are each REJECTED (the rule has
   teeth, no vacuous accept); a built cluster's every shared edge matches and no tiles overlap.
2. **Aperiodicity made checkable** — a deflated Penrose patch (n=60) yields ZERO translation vectors
   above THRESHOLD (best overlap 0.40 < 0.9).
3. **Negative control is load-bearing** — the SAME `repeatHunt` on the periodic square grid RETURNS a
   repeating vector (overlap 1.00, v=[1,0]); a vacuous always-empty detector would pass leg 2 but FAIL
   this leg loudly.
Plus a **byte-twin parity** row: index.html's inlined CORE slab === core.mjs CORE char-for-char
(18395 chars identical).

### Geometry (quiet-correct, reused)
PHI / INVPHI / seed / deflate lifted VERBATIM from the strange-garden Penrose (the proven Robinson-
triangle φ subdivision). P3 rhombs built from `rhombFromAcute` (thick acute 72°, thin acute 36°);
the standard Penrose arrow matching (single / double Conway markings) hand-encoded in `makeTileLocal`;
`edgesMatch` requires same kind + same world arrow direction; convex-polygon SAT `tilesOverlap`;
`frontierEdges` / `seatOnEdge` / `legalSeats` drive the legal-only onramp; `grownPatch` deflates the
sun for the aperiodicity leg; `periodicControl` is the negative control; `repeatHunt` is the
prototype's interior-only `bestOverlap` with the single exported `THRESHOLD` shared by page + test.

### Honest scope (stated on the page)
Filling this finite patch demonstrates LOCAL non-periodicity in exactly what you build, alongside a
control set that DOES repeat under the same test. It is NOT a from-scratch proof that P3 admits no
periodic tiling at all (Penrose / de Bruijn's theorem is deeper).

### Files
- `core.mjs` (350L, `// === CORE BEGIN/END ===` sentinels) — geometry · matching · repeat-hunter
- `core.test.mjs` (131L) — the Node twin, 3 legs + byte-twin parity, `process.exit(pass===total?0:1)`
- `index.html` (964L, single file, no deps, SVG) — CORE inlined byte-identical + the gold self-test pill

### Discoverability
- Workbench → Puzzles deck: a 4th card (✦ The Aperiodic Patch), after Akari.
- Reciprocal cross-links: piece → `strange-garden/pieces/penrose.html` ("watch it deflate →") and
  penrose.html → piece ("the puzzle — seat the tiles yourself →").
- `ws:seen:aperiodic-patch` breadcrumb drops on direct visit.

### Aesthetic
Estate house style: dual radial wash on #0a0b0f, serif gradient H1, mono eyebrow. Gold (#c9a24a/
#e8c879) reserved for the correctness layer (seated snaps, the pill, named vertices, the win bloom);
lilac (#c79be8, kin to penrose.html) so the two Penroses read as siblings; teal for the control
lattice; red for refusal. SVG render (crisp at any zoom). Snap sound muted by default (estate audio
etiquette).
