# The Aufbau Staircase — CHANGELOG

A wall-bench of the Alchemy Lab: the periodic table you CLIMB. The table is not
drawn here — it is BORN, one electron at a time, from a single combinatorial rule
(fill subshells by increasing n + ℓ, ties by n). The 5th lit bench in the wing; it
blooms the long-standing "The Periodic Table" planter (SHELF[4]) and leaves the
wing with no empty cradle for the first time.

## Cycle #187 — planted (BUILD/garden)

The Periodic Table planter, dashed and empty since the wing was raised, becomes a
lit card titled **The Aufbau Staircase**. It follows the wing mold exactly — a
self-contained `core.mjs` byte-identical-inlined between sentinels, a Node twin, a
local in-page self-test pill, the topbar / ws:seen / cross-bridge furniture — but
in a register chosen for honesty.

### The register: HONESTLY EXACT integer ordering (no float, no tolerance)
The claim is combinatorial — which (n,ℓ) subshell the Zth electron lands in — so the
honest register is integers and a STABLE SORT on integer keys. (n,ℓ) are integers;
capacities CAP(ℓ)=4ℓ+2 are integers; Z is spent by integer subtraction; the fill
order is `subshells.sort((a,b) => (n+ℓ key) || (n tiebreak))`. There is no float
and no tolerance anywhere. A tolerance would be a lie — the answer is an integer
fact. (Contrast the sibling Equilibrium bench, whose root is transcendental and so
is honestly float+tolerance.)

### The chassis: a triptych reading ONE state {Z, rule}
Three views, all driven by a single index into the ordered subshell list from
`core.mjs`. Nothing on the page re-derives order or boundaries — every view reads
them from the core (single source of truth).

- **(1) The Staircase** (spine, left) — the Madelung diagonals as climbable brass
  landings, one per (n,ℓ), each with 2(2ℓ+1) sockets. The faint NW→SE diagonal
  arrows are etched behind. A reagent-cyan filling-head token stands on the active
  landing (from `placeElectron`); filled sockets glow in their block alloy. At
  Ar→K the order visibly puts **4s before 3d** and a gold "↰ jog" marker calls it
  out.
- **(2) The Table** (centre) — an empty brass grid; each cell lights the instant
  its last electron lands, in real Z-order, in its block alloy (s=gold, p=reagent,
  d=ember, f=violet placeholder — honest that no f cell lights within Z≤36).
  Noble-gas cells FLARE on closure (white-gold ring-pulse + "ARGON — period 3
  sealed"). Hover any lit cell to write its full configuration; Cr/Cu show the
  honest anomaly footnote ("the rule predicts X; nature does Y").
- **(3) The Shell Glyph** (right) — a deliberately schoolbook Bohr diagram of the
  current atom: concentric n-rings gaining a pip per electron. A bridge card points
  next door to the Cavern's Hydrogen atom, where the real orbital each pip lives in
  is shown.

### The neg-control (load-bearing)
A brass toggle: **Aufbau order (n + ℓ)** ⇄ **Naïve order (n only)**. The naïve rule
fills 3d before 4s, so the table physically BREAKS: period 3 swells from 8 to 18
cells and the 3rd closure drifts off Argon (Z=18) to **Z=28** — both COMPUTED from
`boundaries(N_ONLY)`, never hand-faked. A faded red wash marks the overshoot cells
(19–28); a dashed cyan GHOST holds the TRUE Argon boundary so you watch the lit
front overshoot it. Toggling heals/breaks the table in real time, isolating (n+ℓ)
as the sole cause of the table's silhouette.

### The two declared anomalies
Cr (Z=24) and Cu (Z=29) do not obey the bare rule — nature half-/fully-fills the
d-shell at the cost of a 4s electron. They are DECLARED in `ANOMALIES`;
`groundConfig` returns the rule's prediction but flags `.anomaly=true` and carries
nature's real config. The bench never claims the bare rule nails them: the staircase
shows the rule's prediction, the cell hover shows nature's truth, both honest.

### Proof (Node twin `core.test.mjs` + in-page pill, the SAME proofs)
1. `madelungOrder()` reproduces the canonical Aufbau sequence through 4p.
2. For Z=1..36, `groundConfig(Z, Madelung)` matches a hardcoded reference; the
   declared anomaly set is EXACTLY {24, 29} (has teeth, can't grow silently).
3. `boundaries(Madelung) === {2,10,18,36}` exactly (integer equality).
4. Neg-control teeth: `boundaries(n-only) !== {2,10,18,36}`; period-3 length === 18
   and the 3rd closure === 28.
5. Conservation: Σ occupancy === Z for every Z, both orders.
6. CAP law: every occupancy ≤ CAP(ℓ); only the last filled subshell may be partial.
7. Perturbation guard: a 4s/3d-swapped order FAILS the boundary check (not vacuous).
8. Re-extraction parity: the page's inline core between the sentinels === `core.mjs`
   export-stripped, byte-for-byte.

Node twin: **14/14 green**. In-page pill: **13/13 ✓** (the same 8 core proofs minus
the test-only 2d/4d split, plus two DOM grounded-gate checks — lit-cell count === Z
and shell-pip count === Z — plus the fetch-based parity check).

### Landing edit (same commit)
`alchemy/index.html`: SHELF[4] flips from planter to live bench; a 5th proof block
`periodicProof()` dynamically imports the new core and re-runs proofs (1)-(7), wired
into `benchMathProof()`; `runSelfTest()` now asserts 5 bench cards / 0 planters and
checks the periodic-table link; the pill reads **"5 benches · 100/100 ✓"**. The hero
lede and footer copy updated (five balances, no cradle waiting), and the Cavern
bridge note now mentions the 1s¹ first drop.
