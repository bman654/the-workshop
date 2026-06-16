# The Giant Component — changelog

## #60 — first bloom (2026-06-16)

**"The Giant Component: a world snaps shut."** A split-screen race where the negative control IS
the show. Two fields of ~240 scattered specks are fed the *same* edge count by one shared ⟨k⟩ knob
(0 → 3.5, with a dashed "⟨k⟩=1 critical" tick at the 1/3.5 mark):

- **LEFT — random wiring (Erdős–Rényi).** Edges land anywhere. Scrub up and the field SNAPS into a
  glowing orange continent right around average degree ⟨k⟩ ≈ 1.
- **RIGHT — lattice wiring (the negative control).** The *same* number of edges, but each is a short
  local hop on a fixed √n×√n grid. The blob merely creeps — no snap. Same edges; only the
  randomness manufactured the continent. The divergence is the proof.

**The verb is a reversible scrub.** Each field is a PURE FUNCTION of (its fixed seeded edge
ordering, k): the live graph at ⟨k⟩ is always the first m = round(k·n/2) edges of one shuffled
list, with union-find rebuilt from that prefix each frame. So scrubbing left peels exactly the same
edges back out — buttery, history-free, deterministic, re-snaps live.

**Form expresses content.** The largest component is painted live as a continent (hot orange→white
ramp with a glow halo over its territory for random; cool green for the lattice), each field has a
filling mass meter + S% readout, a criticality flash fires when you scrub the random field through
k=1, and the verdict ribbon ("the random world snapped shut") flares once random's S clears ~45%
and leads the lattice by >0.28. The famous S-vs-⟨k⟩ curve is demoted to a faint corner inset (the
predicted random knee + the live lattice trace + a cursor riding both). An "↦ ⟨k⟩=1.2" button
animates a one-click scrub for drama.

**Union-find** (path-compression + union-by-size) is the visible engine and the sole authority on
component sizes; the page recolors a dot the instant its root changes.

### Architecture
- `core.mjs` — the pure, dependency-free math core (the single source of truth) between
  `// === CORE BEGIN/END ===` sentinels, with `export { … }` after the sentinel. Contains the
  seeded PRNG, union-find DSU, the two edge generators (random ER + the lattice control),
  `buildAt`/`largest`/`components`/`giantFraction` (the reversible prefix builder), `predictedS`
  (the self-consistency root S = 1 − e^(−kS)), and an independent BFS flood oracle.
- `index.html` — a self-contained, zero-dependency, responsive single-file exhibit. The CORE is
  inlined **byte-identical** into a `type="module"` script (module mode is mandatory — a bare
  `export` in a classic script is a fatal syntax error). The page reads all sizes from the CORE and
  never recomputes the math. A byte-twin parity check confirms the inlined core === core.mjs
  char-for-char.
- `core.test.mjs` — the Node twin (exit 0 GREEN). 12 checks at full scale (n up to 8000): measured
  S tracks the predicted root within ±0.06 across a ⟨k⟩ sweep; the snap is a true O(log n) → Θ(n)
  discontinuity; the lattice control lags random by >0.18 near the threshold; union-find largest +
  component count match the independent BFS flood exactly across 60 prefixes; S=0 exactly for k≤1
  and S(2)≈0.7968; the scrub is reversible (up→down→up returns to the identical state); and the
  byte-twin file parity holds.

### Self-test
- **Node twin:** 12/12 GREEN, exit 0, byte-twin IDENTICAL.
- **In-page pill:** 7/7 ✓ green at desktop (≥1280) and mobile (≤390); runs via requestIdleCallback
  (~11 ms) so it never blocks first paint. The page profile uses a lighter scale (n≤2000, averaged)
  with bands chosen so both profiles pass.

### Mobile (≤640)
Fields stack vertically (random on top, lattice below); the header reflows so the title + subtitle
sit on their own row clear of the back-link and self-test pill; the control bar stacks the slider
above the buttons so nothing collides. Verified 0 overflow and legible (no overlapping text) at 390.

### Estate integration
Registered as one card in the workbench's "Toys & benches" group beside the Galton Board. Estate
palette verbatim (--panel-bg, --ink, --accent #7fc7e8, serif title + mono tags, glass panels, the
"‹ The Workbench" back-link); reserves --hot #ff7a3d for the random continent and --cool #66d2a0 for
the lattice. Drops the `ws:seen:giant-component` breadcrumb on visit.
