# The Lattice — changelog

## Cycle #44 — the re-soul (2026-06-15)

**What changed.** The Lattice bench was re-souled IN PLACE. It used to LEAD with the
dispersion graph f(E) — a curve you read, not a thing you touch. Now it leads with a
**touchable crystal**: a row of 8 violet atoms over a real periodic-potential floor
(the δ-comb drawn as barrier humps between wells), and above them a **breathing fan** —
each single-atom level fanning open into a green allowed BAND whose height is the REAL
computed Kronig–Penney band width. **Drag the atoms together** (or the Spacing slider) and
the whole structure breathes open live; band 1 widens from a hairline toward ~2.7 eV. Then
**pour electrons** (`＋ pour` / `－ drain`, or the electrons-per-atom slider): they stack
lowest-first into 2N=16 states/band, rising like liquid with a crisp Fermi line, gold when
the top band is partly filled. The big **LAMP** flips METAL / SEMICONDUCTOR / INSULATOR live
with a one-line plain-English WHY. The dispersion f(E) plot is **demoted** to a quiet
toggleable side-gauge in the panel (default hidden).

The metal/insulator/semiconductor verdict is reachable by direct interaction (slide the
atoms, pour the electrons) and is computed ONLY by `classify()` — never a hardcoded label.

**The math — extracted to a sole authority.** The band-structure engine was extracted from
the winning explorer prototype ("The Electron Pour") into a new sentinel'd module:

- **`core.mjs`** — the SOLE band-structure authority. Between `// === CORE BEGIN ===` and
  `// === CORE END ===` it holds `kOf, fDisp, cellMatrix, halfTrace, detCell, findBands,
  energyAtQ, buildRing, ringMul, cyclicSolve, ringEigs` plus the occupancy/verdict layer
  `classify`. This exact 162-line / 7407-byte block is **inlined byte-identical** into
  `index.html` between the same sentinels. Nothing else computes bands.

- **`core.test.mjs`** — the Node twin (exit 0 iff all pass). 13 checks:
  1. f(E) == ½·tr M(E) of an independent transfer matrix, det M = 1 (to ~1e-15)
  2. band edges land exactly on |f| = 1 (q·a = nπ)
  3. the gaps between bands are truly forbidden (|f| > 1)
  4. negative control — P→0 closes the gaps toward zero
  5. P→∞ narrows band 1 onto the isolated level π²/(2a²)
  6. **anti-circularity** — an INDEPENDENT ring eigensolve gives exactly N states in band 1,
     counted from real eigenvalues, NOT read back from the 2N fill cap
  7. E(q) round-trips: f(E(qa)) = cos(qa) across band 1
  8. half-filled band ⇒ METAL (1 e⁻/atom = N of 2N states)
  9. exactly-full band + a real gap ⇒ INSULATOR/SEMICONDUCTOR (2 e⁻/atom)
  10. negative control — P=0 is one unbroken band ⇒ ALWAYS a METAL
  11. occupancy conserves electrons (Σ filled + overflow = poured), no band exceeds 2N
  12. the live lamp parity — 1/2/3/4 e⁻/atom ⇒ METAL/INSULATOR/METAL/INSULATOR
  13. **byte-twin parity** — the core block in `index.html` is byte-identical to `core.mjs`

  The in-page self-test pill runs the same 12 physics/occupancy checks (the byte-twin is a
  filesystem check, so it lives only in the Node twin).

**Why the anti-circularity check.** An earlier explorer ("The Sliding Crystal") asserted the
per-band state count by reading back the 2N cap the fill engine was handed — circular. We
refuse that: check #6 counts eigenvalues of the actual ring Hamiltonian landing in band 1.

**Reconciled scales (single-sourced).** Energy display is one constant — `K_EV = 0.30`,
`EMAX = 46` — threaded everywhere so eV numbers read consistently. The `eToY` mapping, the
band-bar geometry, the fan-line geometry and the pour-fill geometry all share one function.
The metal-vs-semiconductor gap threshold (`SEMI_GAP = 0.6`, natural units) is labelled
inline as an honest thermal-scale stand-in, NOT a theorem.

**Unchanged.** The route (`cavern/lattice/index.html`), the `ws:seen:lattice` breadcrumb, the
Quantum-Drift card on the Cavern map and its gating, the topbar / panel / self-test pill
chrome and the Quantum-drift violet (`--q #b18cff`) + conducting-green bands + barred-amber
gaps aesthetic.

**Out of scope (sown as a future spark).** Explorer C's full "Material Picker" — building and
naming Sodium / Diamond / Polyacetylene via dimerization — is a strong standalone idea kept
out of this re-soul.
