# Tessellarium — changelog

A generative **ornament press** grounded in the **17 wallpaper symmetry groups** — Strange Garden's
companion (its ornamental cousin: the Garden *grows* pattern; Tessellarium *composes* it, by symmetry
law). One self-contained, zero-dependency, vanilla `index.html`. Spec: `TESSELLARIUM.SPEC.md`.

## Build 1 — v1 (2026-06-12)

Shipped `index.html` (1072 lines, single file, no deps/network/build, system fonts only).

**What it is.** Seed a coherent, seamless, edge-to-edge ornament; pick any of the **17 plane
symmetry groups** (the complete set — p1, p2, pm, pg, cm, pmm, pmg, pgg, cmm, p4, p4m, p4g, p3,
p3m1, p31m, p6, p6m). A seeded motif is replicated by the chosen group's exact symmetry operations
into wallpaper in the truest sense. 4 render styles (Stained / Inked / Block / Line), 8 curated
palettes (Chartres, Sainte-Chapelle, Morris, Azulejo, Art Nouveau, Amethyst, Rose Gold, Grisaille),
cell-repeat/zoom slider, an optional symmetry-axes / lattice overlay, seed field + re-roll, PNG
export at 2×. The caption names the current group's IUC symbol + orbifold + plain-English description.

**The crux (workshop tradition — the verifiable gate).** The symmetry is *real and proven*, not
faked. The field is defined as `f(P) = motif(foldToFundamentalDomain_G(P))`, where the fold is an
**exact orbit-min canonicalization**: each group's full closed *affine* element set (point-group
linear parts + glide half-translations, precomputed by BFS closure) maps any P to the lexicographically
smallest cell-reduced image. Because the set is closed under the group, `fold(P) == fold(g·P)` for
every group element g — so invariance is true to machine precision *by construction*, with **no
per-group special-casing** (the same uniform fold handles the tricky glide/centred/offset-mirror
groups pg, pmg, pgg, cm, cmm, p4g and all hexagonal groups). Hexagonal groups use a 120° lattice
basis where the order-6 rotation is the integer matrix `[1,-1;1,0]`, so rotations are exact.

**Self-test (4 checks, headless on load; shows a green "symmetry verified — 4/4 ✓" chip; never
shipped failing):**
1. **Symmetry invariance** — `f(P) ≈ f(g(P))` for every generator of each of the 17 groups.
   **Max error 0.0** (exact, well under the 1e-9 bar).
2. **Tiles + point-group order** — both translation generators leave the field unchanged (doubly
   periodic), and each group's point-group order matches the spec (p1=1 … p6m=12), distinguished
   from the larger affine-group size for glide groups.
3. **Seed-pure + style-invariant** — same seed+group ⇒ byte-identical field hash; **style/palette
   never touch geometry** (field hash identical across all styles — the "style only re-renders" crux).
4. **Finite** — no NaN/Inf across all 17 groups × 5 seeds.

**Motif.** A seeded sum of torus-periodic Gaussian metaballs + integer-frequency sinusoidal bands,
squashed through tanh — smooth and periodic so fold seams are invisible.

**Verified end to end** on a *served* origin (`python3 -m http.server`, not file://), in a real
browser: self-test **4/4 PASS** with check #1 max error **0.0**; **0 console errors / 0 warnings**;
all 17 groups render rich, distinct, correct symmetry (p6m 6-fold rosettes & mirrors; p4m 4-fold
kaleidoscope; p3 3-fold pinwheels with no mirror; pgg herringbone glides + 2-folds, no mirror; cmm
crossing centred mirrors); all 4 styles + several palettes; symmetry-axes overlay; PNG 2× export
produces a valid image; `ws:seen:tessellarium` breadcrumb written.

**Wiring.** Companion of Strange Garden: a `↗ Tessellarium — pattern, composed` sib-link in the
Garden's header; a `🔷 Tessellarium within` pill on the Garden's front-door card. Back-links here:
`← workshop` and `↗ Strange Garden`. Front-door card count unchanged (still the curated 9).
