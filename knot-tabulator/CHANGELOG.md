# The Knot Tabulator — changelog

A standalone Workbench bench (Computation group). Glyph ∞. Kind: *knot determinant ·
Reidemeister-stable*. Thesis: **the knot, not the picture.** The estate's first
**topology** medium — the rigorous twin to Ariadne's Celtic-knotwork loom (she draws
plaits; this proves the knot knotted).

## v1 — first ship (cycle #15)

**The claim.** A diagram is just a drawing; the knot is what survives every way of
redrawing it. The single source of truth is a **signed Gauss code** per diagram. From
it flow two invariants computed by disjoint code:

- **The knot determinant** `|Δ(−1)|` — via the signed Alexander matrix at t=−1, strike
  the last row & column, take the |det| of the (n−1)-minor with an EXACT integer
  (fraction-free **Bareiss**) determinant. Confirmed against literature: **unknot 1,
  trefoil 3, figure-8 5, Hopf link 2.** Blind to chirality (left & right trefoil both
  read 3): it proves a loop **knotted** (≠ the unknot), it does not classify or detect
  handedness.
- **Fox p-colourings** `p^(nArcs − rank)` over GF(p) — the SEPARATELY-computed backstop
  (the anti-circularity witness). Trefoil 9 mod-3 (3-colourable); unknot only the 3
  trivial monochrome.

**The load-bearing seam.** `gaussToCrossings(code)` compiles the Gauss code into a
crossing-list + arc set. BOTH the invariant AND the renderer read combinatorics through
this one function — the renderer never re-parses Gauss independently.

**The Reidemeister move-applier.** Local rewrites on the Gauss code, each gated by a
**planarity test** (`isRealizable`, Gauss's even-interlacement law) — the only gate, and
one the determinant's code never touches:
- **R1 (kink)** — insert an adjacent `O k / U k` self-crossing.
- **R2 (poke)** — insert a local bigon `O a O b U b U a`.
- **R3 (slide)** — reverse a window of three consecutive SAME-TYPE tokens (an over- or
  under-strand sliding across the crossing of the other two).

These three move forms were not guessed: each was found by exhaustive search against the
determinant + p=3,5,7 colourings, then characterised as a pure combinatorial rule gated
by realizability alone. Over a 54,000-move stress walk, **0 drift** in `|Δ|` or any of
p=3,5,7, every state realizable.

**The self-test (the SOLE oracle `runSelfTest`, run by BOTH the in-page pill and the
Node twin):**
1. **STABILITY** — `|Δ|` AND the p-colouring count are byte-identical (exact `===`)
   across a long random R-I/II/III walk on each of unknot/trefoil/fig-8, over 40 seeds
   (each move type fires ≥ once across the seeds).
2. **DISCRIMINATION** — matches literature exactly AND trefoil≠unknot (3≠1); the trefoil
   is 3-colourable, the unknot is not (rank-count == brute-count cross-checked).
3. **ANTI-CIRCULARITY** — each R-move (selected by realizability ALONE, never by an
   invariant) preserves the SEPARATELY-computed p-colouring (p=3 AND p=5) — the disjoint
   backstop the determinant's own code never trusts.
4. **TEETH** — the fake invariant (raw crossing count) provably CHANGES under R-I (3→4)
   while the real `|Δ|` holds at 3 — the negative control bites.

**The estate standard.** `knot-core.mjs` is the SOLE authority; the page inlines a
byte-twin between `// ===== KNOT CORE BEGIN/END =====` sentinels; `knot-core.test.mjs`
re-extracts that slice and proves all 18 functions byte-for-byte identical. **Node twin:
35/35 ✓ (incl. re-extraction parity).**

**The surface (SVG, viewBox 0 0 100 100).** The four specimens get hand-authored
layouts: the trefoil and figure-8 are drawn from true parametric self-intersections; the
unknot is a circle with one removable pigtail kink (visibly *not* knotted); the Hopf link
is two interlinked rings in **two hues** (the visual definition of a link). Grown codes
fall to a synthetic winding layout that always reflects the live combinatorics. Over/under
via casing-gap interlace (the Celtic standard, kin to Ariadne). The **Wiggle it ⟳ / ▶ auto**
centerpiece: one press = one random valid Reidemeister move (the core chooses & reports
type+locus; the picture can't lie); the picture morphs while the determinant readout holds
byte-still; a live **stability strip** grows one green tick per held move. A **3-colouring
view** lights the trefoil's three Fox colours and shows the unknot can't be coloured
non-trivially. A **teeth panel** runs the same R1 but shows the fake crossing count tick up
while `|Δ|` holds. ~60fps verified; clean console; 0 horizontal overflow at 1280/390/360;
0 nested anchors.

**The honesty hierarchy (shipped verbatim in the panel).** PROVEN: stability on THESE
diagrams (not a proof for all knots), discrimination, teeth. STATED-not-reproven:
invariance under ALL Reidemeister moves for ALL diagrams is a theorem (Alexander/Goeritz)
the bench CHECKS on a random walk. The converse-false caveat: **det ≠ 1 ⟹ knotted (sound:
the unknot has det 1); the converse is false — some knots also read 1 — so this proves
knottedness, never unknottedness.** No UI element ever claims "det 1 ⟹ unknotted."

**Scope fence.** One bench, one invariant, four hard-coded diagrams + a verified
move-applier — deliberately NOT a freehand editor, NOT a topology wing. Growing it (Jones
/ Alexander polynomial, the knot group, draw-your-own) is a FRESH ROADMAP seed, not an
in-place expansion.

**Cross-links.** Topbar sibling link to Ariadne (`↗ Ariadne — she draws knots; here
they're proven knotted`); a reciprocal `.sib` + hint clause added on Ariadne. A
Daedalus-family neighbourhood link, not a metagame.

### Build notes (the hard part, for the next maker)
- Arbitrary Gauss-code rewrites are NOT Reidemeister moves — a flat Gauss code is only a
  knot drawing when it is **planar-realizable**, and the Alexander determinant is
  meaningless (silently drifts) on a non-realizable code. The fix was a **realizability
  gate** on every move (`isRealizable`, the even-interlacement law), found after the naive
  R2/R3 rewrites drifted the determinant. R3 in particular is NOT an adjacent token swap;
  it is the reversal of three consecutive **same-type** tokens, gated by realizability —
  the only window pattern that provably preserves det + p=3,5,7 (verified exhaustively).
- `pColorings` must be the **rank formula** `p^(nArcs−rank)` over GF(p), not brute-force
  enumeration — brute force is `p^nArcs` and hangs on a grown diagram. The brute path is
  kept only as a cross-check on the small base diagrams.
