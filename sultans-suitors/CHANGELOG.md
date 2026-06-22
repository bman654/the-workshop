# The Sultan's Suitors — changelog

A dim throne-room bench over the SECRETARY PROBLEM (optimal stopping). Veiled suitors arrive one
at a time in a random order; you lift each veil to learn only the RELATIVE verdict ("the finest
yet" / "lesser than one who has passed") and must MARRY or BANISH on the spot, with no recall.
The brass LOOK-DON'T-PICK band is the primary control and LOCKS the MARRY button until you have
looked past that many suitors. The 1/e rule is FELT, never drawn — it surfaces as a statistic of
your own repeated play. The Numbers Room's first bench of optimal stopping; kin to The Matchbox
That Learns and the other benches of decision.

## Born (cycle 282)

The bench as shipped:

- **The math heart — `core.mjs`** (sole pure secretary-problem engine, DOM-free, between the
  `CORE BEGIN`/`CORE END` sentinels). `mulberry32` seedable RNG + `randomPermutation` (Fisher–
  Yates), `runPolicy(arrival,k)` (the relative-only look-then-leap executor returning the full
  trace: chosenSeat, forced, bestSeat, won, bestSoFar[], thresholdRank), the closed form
  `pWinClosed(k,n) = (k/n)·Σ_{i=k+1..n} 1/(i−1)` with `P(0,n)=1/n`, `optimalK(n)` (argmax over k),
  `enumerateWins(n,k)` (exact brute force over all n! orderings via Heap's algorithm), and
  `simulateWins`. A Node main-guard keyed off `process.argv[1]` (never `import.meta`, which would
  be a syntax error once forge inlines the core into a non-module `<script>`) prints a one-line
  summary on `node core.mjs`.

- **`core.test.mjs`** — Node twin, exit 0, **121/121 pass**: (a) the closed form === brute-force
  enumeration EXACTLY over all n! orderings for n=3..9, every k (1e-12) — 42 (n,k) pairs; (b) the
  k=0 negative control wins EXACTLY 1/n (pure luck), by both enumeration and closed form; (c) the
  argmax sits within 1 of round(n/e) for n=6..30; (d) the optimal win-prob → 1/e from above
  (n=200 within 0.006); (e) the optimal policy STRICTLY beats k=0 luck for every n≥3; (f) the
  Monte-Carlo simulator agrees with the closed form within 0.02; (g) runPolicy invariants and (h)
  randomPermutation validity over thousands of random courts; (i) RNG determinism; (j) BYTE-TWIN
  PARITY — the `CORE BEGIN..END` region of `core.mjs` is character-identical to the one inlined
  into `index.html`, so page and test can never drift.

- **The form — `index.src.html` → `index.html`** (forged via `forge:include ./core.mjs`,
  byte-true). A dim perspective throne-room: a receding colonnade flanks a gold runner from a
  dark arched DOOR at the back to a DAIS (♔) at the front. Veiled suitors arrive one at a time;
  LIFT THE VEIL plays the reveal (veil rotateX up + fade, face-jewel glow) and shows a RELATIVE-
  ONLY banner — never a number, rank, or score. Two IRREVERSIBLE buttons: BANISH (door-bar toast,
  gone for good) or MARRY (locked until pos ≥ band; procession halts forever, door bars red, a
  full-screen VERDICT unveils whether you crowned the true best). Banish everyone → the last walks
  in by default (the ⚰ verdict). The page's bestSoFar / bestSeat come straight from the
  authoritative `runPolicy`, so the visual is a pure consequence of the proof core.

- **The 1/e payload — the persisted "Chronicle of Crowns"** (localStorage, `sultan-chronicle-v2`):
  courts-held / true-best-crowned / true-best-banished, with win-rate bars BUCKETED BY BAND into
  five canonical ranges (0–5% / 10–20% / 25–35% / 40–50% / 55%+) keyed on the band's PERCENTAGE of
  the court (k/N), so the labels stay honest. Across many courts it settles on 25–35% (~N/e), the
  peak bucket lit TEAL. The hint nudges "~37%" but NO probability curve is ever drawn — the 1/e
  rule is felt as a statistic of YOUR play.

- **N = 12** (not 20): round(12/e)=4 ⇒ a 33% optimal band, dead-centre of the 25–35% bucket. At
  N=20 the 25–35% and 40–50% buckets are within ~0.5 points (a soft, near-tied plateau); at N=12
  the peak bucket leads by ~1 point and the extremes fall to ~8% / ~22%, so the felt peak reads
  cleanly and fewer banishes accrue per court.

- **The montage — "⏩ Hold 50 courts at this band"**: clearly framed as a montage (the hand-play
  stays the heart), it runs ~50 fresh courts through the SAME `runPolicy` at the current band
  straight into the Chronicle, so the 1/e peak is reliably reachable in one sitting.

- **The self-test pill** (top-bar, clickable to expand): runs the SAME battery as `core.test.mjs`
  in the browser and is exposed at `window.__sultansSuitors`.

- **Discoverability:** a new front-door POI (`id:"sultans-suitors"`, glyph ♛, district grounds /
  tier 2 / wing number) near the games cluster (siblings hexapawn, quiet-room), a
  `drawSultanSuitors` footprint glyph (barred door → gold runner → veiled figure → dais) registered
  in the dispatch map, and the `ws:seen:sultans-suitors` breadcrumb. `forge --check --all` and
  `forge --audit-seen` both green.

### Two bugs carried in from the prototype (flagged + fixed before ship)

1. **`setBand()` must NOT touch the lock line.** `refreshButtons()` owns and rewrites the lock
   `innerHTML` (including the band count), so `setBand` only updates `#bandN`/`#bandPct` and calls
   `refreshButtons()` — never writes `#lockN` itself (it would be overwritten and could desync).
2. **The suitor banner overlapped the band readout.** The audience mark stays at `top:30%` and the
   band carries a stronger backdrop gradient + blur + higher z-index (8) so the two never collide.
