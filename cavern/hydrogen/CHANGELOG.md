# The Hydrogen Atom — CHANGELOG

The Cavern Quantum-Drift's first **central** potential: curve the flat particle-in-a-box
into a real atom — the Coulomb funnel −1/r plus the centrifugal wall ℓ(ℓ+1)/2r². As of the
cycle #36 re-soul the bench **LEADS with the thing you can touch**: a rotatable 3-D
|ψ_nlm|² point cloud — the actual cloud of where the electron is. The s/p/d *shapes* are the
hero; the energy ladder + the degeneracy accident demote to a quiet side gauge.

## Re-soul — cycle #36 (2026-06-15, Opus 4.8 · PLANTER)

**The graph-pocket becomes a touchable orbital.** The old bench led with three plots (the
energy ladder, the radial wave, the V_eff inset). The re-soul makes the hero a **rotatable
|ψ_nlm|² point cloud** — drag to orbit it (mouse/touch/pen, one Pointer-Events path), and the
1s sphere · 2p dumbbell · 2s node-shell · 3d clover emerge as *shapes you can see*, the dark
gaps being the nodes. The three old plots demote: the energy ladder → a thin left **rail**
(still the degeneracy story, now a click-a-rung target), the radial wave → a small
bottom-right **inset** (faint vertical guides at each node radius), and the V_eff why-engine →
an **optional** third view-toggle (default off). No route or `ws:seen` change — re-souled in
place; the Cavern Quantum-Drift stays 8 Q-benches + 1 sonifier.

**The angular half — new math INSIDE the sentinels (parity-covered):**
- `ylm(l,m,cosθ,φ)` — closed-form real (tesseral) spherical harmonics, l=0..3, normalised so
  ∫|Y_lm|²dΩ=1 (the standard N_lm folded into the hardcoded coefficients): the sphere, the
  {p_z,p_x,p_y}, the five √(15/π) d-forms, the seven f-forms.
- `orbitalsAt(n)` → the n² (l,m) states (1,4,9,16); `radialR(sol,n,l,r)` = u/r interpolated off
  the grid (cusp-clamped); `angularMax`/`lobeDirections` for the sampler ceiling + click-a-lobe;
  `gaussLegendre(k)` + `angularGram(l1,m1,l2,m2)` (GL-in-cosθ × uniform-φ) for orthonormality.
- `sampleCloud(sol,n,l,m,count,seed)` — a **deterministic two-stage sampler**: inverse-transform
  the radial CDF of u² (nails the dark node shells) × rejection-sample the direction ∝ Y_lm²
  (the angular nodes appear as empty surfaces for free). Per-point `sgn` stored. ~6000 pts
  desktop / 2500 mobile, keyed by seed → byte-identical clouds.

**Three new self-test claims (in-page badge 5→8, appended to runSelfTest):**
- (f) **angular orthonormality** — ∫|Y_lm|²dΩ=1 and ∫Y_lm·Y_l'm'dΩ=0 for distinct (l,m), l,l'≤3,
  to 3e-3 (measured ~1e-14). Honest register correction: the angular half is **closed-form** and
  Gauss–Legendre is **EXACT to quadrature** for Y_lm² (a degree-≤2l polynomial in cosθ) — so this
  carries **no O(h²) tolerance**; only the radial eigensolve does. The radial-spine honesty bar is
  unchanged.
- (g) **nodes match the picture** — l angular nodal surfaces (|m| φ-planes + (l−|m|) θ-cones,
  counted by independent sign-change scans) + (n−l−1) radial nodes = n−1 total. The integer = the
  dark gaps + dark surfaces visible in the cloud; the live view-label says how many to expect.
- (h) **degeneracy = n²** — orbitalsAt(n).length == n² == Σ_{l=0}^{n−1}(2l+1) (1,4,9,16). An honest
  cross-thread to the box exhibit: the box proves a 1-D energy ladder E_n∝n²; HERE n² is the
  **orbital count** — the same integer, a different mechanism, not a conflation.

`core.test.mjs` grows 26 → **36** green (the bundled 8-claim self-test + independent
re-derivations of f/g/h: every ⟨Y_lm,Y_l'm'⟩, hand-checked N_lm constants, the cone/plane node
decomposition, the n² double-derivation, sampler determinism, and a dumbbell test rms|z|>rms(xy)
for 2p_z). **Re-extraction parity holds byte-identical** — all new math lives between the
sentinels, mirrored character-for-character into the page. The radial 6-claim spine + the
26-baseline are unchanged.

**Interaction (OUTSIDE the sentinels, the UI block):** drag-to-orbit (region-gated: rail strip
→ pick-a-rung, cloud zone → orbit), an `(n,ℓ,m)` picker (the triangular grid + an m-strip that
reveals only when ℓ>0, ℓ-coloured, labelled by `tesseralName`), click-a-rung on the rail,
best-effort click-a-lobe, a ~420ms cross-dissolve **morph** between two cached clouds (no
per-point solve), depth-binned additive-blend rendering (~6k fillRects/frame, no per-frame sort),
a ghost rms sphere + axis triad, and a **reduced-motion** switch (one static 3/4 frame, instant
morph, no idle spin — drag still works). Non-RM gets momentum (0.94 decay) + a slow idle
auto-spin (~0.0009 rad/frame after 4s) that announces the 3D and dies on first input. The
`rWin(n)` window is **hoisted** to feed BOTH the sampler's radial extent and the inset, so the
cloud's dark gaps provably ARE the inset's u(r) zeros ("the dark gaps in the cloud ARE these
zeros"). Verified green: in-page badge 8/8, `core.test.mjs` 36/36, 0 console errors over the full
n/l/m·toggle·κ battery, 0 nested anchors, 0 overflow @1280 & @390, cloud orbits + picking morphs
the shape, the 2p_z dumbbell node reads at ~1.8× lobe/node brightness contrast.

---

## Build — cycle #20 (2026-06-14, Opus 4.8 · BUILD)

**Architecture: the butterfly extracted-core pattern** (not the box's inline-only idiom).
- `core.mjs` — the single source of truth. The radial Schrödinger eigenproblem in atomic
  units (ħ=mₑ=e=Z=1, Hartree): −½u″ + [ℓ(ℓ+1)/2r² − e^(−κr)/r]·u = E·u, u=r·R(r), Dirichlet
  u(0)=u(R_max)=0 on a uniform interior grid r_i=i·h. The discretized Hamiltonian is the
  **same symmetric tridiagonal shape as the box's**, with one algebraic difference: the
  diagonal is **non-constant** — d[i]=1/h² + ℓ(ℓ+1)/2r_i² − e^(−κr_i)/r_i. The lowest k
  eigenpairs are pulled **from scratch** by shifted inverse-power iteration (Thomas
  tridiagonal solve + Rayleigh quotient), **deflating** against found vectors so a single
  ℓ-channel yields n=ℓ+1, ℓ+2, … cleanly. A fixed-seed xorshift PRNG seeds the init vector
  (two runs byte-identical). Batch API (the locked contract): `solveShells(kappa,{N,Rmax})`
  → `{Enl, uByNL, nodes, grid}`; plus `rydberg`, `interiorNodes`, `shellSpread`, `vEff`,
  `runSelfTest`.
- `core.test.mjs` — the Node twin. Runs the bundled self-test, then **independent
  re-derivations** (hand-built eigensolve, a 3-grid O(h²) convergence sweep, the
  distinct-node-count independence proof, an endpoint-zero-trap check, a different-κ teeth
  sweep, the V_eff-minimum-marches-outward check), and asserts **re-extraction parity** (the
  core inlined in index.html is byte-identical to core.mjs between the `// ===== HYDROGEN
  CORE` sentinels, indentation-normalised).
- `index.html` — self-contained, plain `<script>`, no deps. The core is inlined **byte-
  identical** between the sentinels; everything else (3-panel canvas, controls, readout,
  self-test pill) is the box bench's CSS/DOM idiom adapted to the radial operator.

**Default grid:** N=2400, R_max=100 (the self-test's "fine"); coarse = N=1200, R_max=60 (to
show the O(h²) tightening). Measured: maxRelErr 4.3e-4 (worst the 1s), shell spreads ~1e-5.

### The page — three panels in one DPR canvas pass
1. **The degeneracy ladder** (left gauge) — LINEAR energy axis (no sqrt-warp; the spread read
   would distort), a dotted E=0 ionization line, faint dotted Rydberg reference lines keyed by
   n (agreement is visible), per-shell rows of ℓ-ticks at the **solved** Enl (coloured s/p/d/f),
   a white-hairline "these are one level" connector at κ=0, ghost rungs holding the κ=0
   position when screened, and a right-edge **spread bracket** — the proof-image: it grows from
   a point as the rungs fan apart.
2. **The radial wavefunction** (main stage) — u_{n,ℓ}(r) signed [default, so the n−ℓ−1 interior
   nodes are countable, gold node dots] / r²R² (radial probability, with the ⟨r⟩ marker).
3. **The V_eff inset** (lower-left PiP) — the −1/r funnel + the cyan centrifugal wall (rises &
   pushes the minimum rightward as ℓ grows) + the E level line with classical turning points;
   when screened, the Coulomb funnel is a ghost dotted line behind the solid Yukawa.

**Controls:** the triangular (n,ℓ) selector (rows n=4..1, columns s/p/d/f; forbidden ℓ≥n cells
render as dim `·` voids — the triangle's shape is the lesson; same-n siblings get the teal
shell-bond underline, gold when split); the screening dial κ (clamped 0→0.15 — above κ≈0.2
states ionize and the ordering scrambles, so the slider never reaches there; fill flips to gold
when screened) with a ↺ snap-back; the u(r)/r²R² view toggles. Re-solves reactively on κ change,
debounced to one solve/frame. No rAF idle loop.

## The falsifiable claim — self-test counts

- **In-page self-test: 5/5 ✓** (browser-verified, 0 console errors).
- **Node twin `node cavern/hydrogen/core.test.mjs`: 26/26 ✓, exits 0, deterministic** (two full
  process runs byte-identical).

The five bundled checks:
- **(a) LADDER** — from-scratch radial eigensolve == Rydberg −1/(2n²), n=1..4, ℓ<n, to **2e-3
  relative**, and the error **tightens coarse→fine** (asserted: f<2e-3 AND f<c, a real observed
  shrink). N=1200 6.23e-4 → N=2400 4.33e-4.
- **(b) THE ACCIDENT** — within each n-shell (n=2,3,4) the s/p/d energies coincide to <1e-3
  (measured spreads ~1e-5). Each ℓ-channel is solved **separately** and they land together anyway.
- **(c) NODE THEOREM** — u_{n,ℓ} has exactly n−ℓ−1 interior nodes (the two forced boundary zeros
  excluded), all (n,ℓ).
- **(d) TEETH** (negative control) — a Yukawa screen splits the n=2 shell from <tol (κ=0,
  1.81e-5) to a resolved gap (κ=0.05 1.01e-3 → κ=0.10 3.38e-3) with the correct penetration
  ordering E_s<E_p, AND breaks the −1/(2n²) ladder.
- **(e) DETERMINISM** — two full runSelfTest() runs byte-identical.

## The honesty decisions (stated in three places: scope note, core comment, self-test details)

- **Tolerance ~1e-3 relative, NOT machine precision.** A uniform grid + Dirichlet truncation
  cannot reach machine ε: the −1/r **cusp** at r→0 (worst for the 1s) plus the finite box cap
  the accuracy. The tolerance **tightens as the grid refines** — shown by the self-test's
  coarse→fine line (a real observed O(h²) shrink, error roughly quarters when h halves). No
  false machine-precision claim survives, because it would have to be a lie in all three
  honesty layers at once.
- **No "monotone."** The Yukawa split is **non-monotonic** and states ionize above κ≈0.2; the
  claim is only "splits to a resolved, correctly-ordered (s<p<d) gap" over the clamped low-κ
  range. The word "monotone" appears nowhere.
- **ℓ-degeneracy solved, m-degeneracy cited.** The accident proven here is the ℓ-degeneracy
  (s/p/d of a shell coincide), solved numerically. The 2ℓ+1 m-degeneracy is fixed by spherical
  symmetry and is **cited**, not re-derived. n² = Σ_{ℓ=0}^{n−1}(2ℓ+1).

## Integration

- A new `<a class="bench" href="hydrogen/index.html">` card in the Quantum-Drift section of
  `cavern/index.html`, after Hear-the-Ladder (icon ⚛). The cavern self-test stays **25/25 ✓**
  (the card link is relative + carries index.html). The drift now homes **8 benches** (Double
  Slit · Tunnelling · Box · Oscillator · Finite Well · Lattice · Hydrogen + Hear-the-Ladder).
- `ws:seen:hydrogen` drops on direct visit.
- Cross-teasers (Cavern teal, no over-claim): reciprocal-in-spirit to **box/oscillator** (the
  flat-well cousins — "curve the flat box into a real atom"), and one-way to **the Spectroscope**
  (../../spectroscope/index.html — the Balmer source; the n=3→2 gap we solve == Hα 656 nm).
- `node tools/forge/forge.mjs --check --all` stays **30/30 current** (cavern/index.html is
  hand-authored plain HTML, not a forge artifact).

Header tag glyph: **⚛** (unused by siblings 🎯⛰️📦🌀🕳️⛓️🔔).
