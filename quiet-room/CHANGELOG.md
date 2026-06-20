# The Quiet Room — changelog

A 5×5 brass Lights-Out lamp panel, the Numbers Room's fifteenth bench. The lamps are a vector
space over GF(2); pressing a lamp adds (XOR) a column of the 25×25 toggle matrix A. Kin to The
Fifteen — where solvability is also a parity invariant — one dimension up.

## Born (cycle 209)

The room as shipped:

- **The math heart — `core.mjs`** (sole pure GF(2)^25 engine, DOM-free). Everything derives
  from N=5; nothing hard-codes 25 or D. Primitives: `buildA()` (plain 5×5, no wrap), pure
  `press`/`applyPresses`, `matVec`, `transpose`, `dot`, one `rrefAug` Gaussian-elimination
  routine powering `solve`/`nullspaceBasis`, `KERNEL = nullspaceBasis(transpose(A))`, computed
  `D = KERNEL.length`, `isSolvable` (⟂ kernel), `dealSolvable` (a random legal press-set →
  always in the column space, never all-dark), `dealImpossible` (a lone lit lamp that is NOT ⟂
  the kernel), the provenance state machine (`freshState`/`doPress`/`forcePaint`), and the two
  named quiet patterns `QUIET_RING` / `QUIET_COLUMNS`. `solve()` returns the **minimum-Hamming-
  weight** member of the coset {x, x+Q0, x+Q1, x+Q0+Q1} so "minimal: N" and the gold play-out
  are honest.

- **The corrected math (verified before building, overrides the seed):** a quiet pattern is
  **self-orthogonal** over GF(2) (dot(Q,Q)=0), so it PASSES the solvability test and `solve(Q)`
  returns a real press-set. The kernel's meaning is **the invisible move** (A·Q=0 ⇒ pressing
  every lamp of a quiet pattern leaves the panel byte-identical — the soul) plus **solution
  ambiguity** (every solvable board has exactly 2^D=4 solving press-sets). The genuine
  SOLVE-goes-red control is an **impossible deal** — a lone lit lamp not ⟂ the kernel; 20 of 25
  single-lamp boards are provably impossible.

- **`core.test.mjs`** — Node twin, exit 0, claims (a)–(g): SOLVE soundness (A·x===deal
  byte-exact), involution + order-independence, kernel dim DERIVED (D=2 computed, A symmetric),
  solvable IFF ⟂ kernel (single-lamp 5/20, random fraction ≈ 2^-D, the 4 quiet patterns all
  solvable, press-generated all solvable), the named patterns ARE the kernel basis (+ the quiet
  move byte-identity + 2^D-ambiguity + minimality), the provenance machine (two distinct reds),
  and byte-twin parity with index.html. **33/33 pass.**

- **The form — `index.src.html` → `index.html`** (forged). A recessed brass tray of 25 real
  `<button>` lamps; dark = cold radial, lit = warm gold glow. The tap-flip is driven off the
  authoritative `A[c]` vector (a fast double-tap can't desync the visual from the math), with a
  Chebyshev-staggered cross-ripple. A rotary **DEAL** knob only ever deals provably-solvable
  boards (REACHABLE? reads green on every dealt board). A **SOLVE** pull-lever lights the minimal
  press-set as a gold constellation then auto-plays to dark (with a `step ▸` button); on an
  impossible board it JAMS red and paints no fake gold. The right rail "The Instrument" shows
  three live readings (press count + minimal, the REACHABLE? disc, the PROVENANCE meter) and a
  kernel caption filled from the computed D. **The quiet reveal** (always-available toggle +
  earned auto-fire after the 3rd win) paints the two live-computed kernel vectors as breathing
  blue-violet ghosts, with a "press the quiet pattern" demo that ends byte-identical. Two
  negative controls fire red: **force dark** (hand-paint, latches provenance red) and **deal an
  impossible one** (SOLVE refuses). `window.__quietRoom` exposes a read/drive lens.

- **Front-door + cross-links:** registered in both PLACES arrays (index.src.html + smoke.cjs),
  a `drawQuietRoom` footprint (5×5 dot-grid + gold press-cross) in the DRAW table, `ws:seen:
  quiet-room` literal + `WS.seen('quiet-room')` call. The Numbers Room landing gains its card
  and bumps to fifteen benches; The Fifteen gains a reciprocal kin note. A true GF(2)-invariant
  companion asterism via `companion:{name:"The Fifteen"}` (capstone untouched).
