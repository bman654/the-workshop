# The Coin That Lies — changelog

A touchable brass two-pan balance over the classic puzzle: twelve coins, exactly one counterfeit
(light or heavy, you don't know which), found in three weighings and no fewer. The Numbers Room's
seventeenth bench. The soul is TERNARY SEARCH — a balance is one question with three answers, so
information arrives in TRITS (log₃), where The Source Dial packs symbols into BITS (log₂).

## Born (cycle 224)

The bench as shipped:

- **The math heart — `core.mjs`** (sole pure engine, DOM-free). Everything derives from N=12;
  nothing hard-codes 12, 24, or 3. A CASE = {f:fakeIdx, k:LIGHT(−1)|HEAVY(+1)}; allCases(n)=2n.
  Primitives: `weigh(left,right,fakeIdx,fakeKind)` — the ONE outcome oracle ('<' left lighter /
  '=' balance / '>' left heavier), antisymmetric (weigh(R,L)=flip(weigh(L,R))); `partition(live,
  left,right)` — the disjoint+total rack-split engine; `reach(W)=3^W`, `smallestW(K)`,
  `log3Bound(K)=⌈log₃K⌉` — the information floor (the float formula cross-checked against the
  integer def); `candidateWeighings(n)` — deterministic equal-count disjoint pans (memoized,
  canonical left[0]<right[0]); `buildSchedule(cases,depth)` — deterministic depth-limited greedy
  yielding a frozen depth-3 tree; `SCHEDULE = buildSchedule(allCases(12),3)` (24/24 leaves, every
  leaf at depth EXACTLY 3, first weighing the classic 4-vs-4); `distinguish(observe)` — walks the
  tree against a planted fake.

- **THE GATE — `solvableIn(n,W) = buildSchedule(allCases(n),W) !== null`** — a STRUCTURAL
  achievability predicate (does a real depth-W schedule exist?), NOT the loose log bound. This is
  the SOLE solvability source the seal/counter/pill read. `solvableIn(12,3)=true`,
  `solvableIn(13,3)=false` — and the twin pins the 13 verdict against an EXHAUSTIVE reference
  oracle (`solvableExhaustive`, which tries EVERY weighing at every node) so greedy-vs-exhaustive
  can never silently disagree. A displayed sanity identity (twin-checked, NOT the gate):
  `tightMax(3)=12`, 2·12=24=2N — the witness that 12 is the exact no-reference maximum.

- **`core.test.mjs`** — Node twin, exit 0, claims (A)–(F): (A) partition disjoint+total over every
  candidate weighing × all 24 cases; (B) reach(W)=3^W and log3Bound===smallestW on a sweep
  (24→3, 27→3, 28→4); (C) the preloaded schedule covers all 24 leaves at depth EXACTLY 3, a
  bijection onto the 24 cases, first weighing 4-vs-4; plus distinguish() against all 24 planted
  fakes, weigh antisymmetry over every case; (D) the gate — solvableIn(12,3)===true &&
  solvableIn(13,3)===false, BOTH against the exhaustive oracle, plus 12-unsolvable-in-2 and
  tightMax; (E) the NEG-controls fire RED and name the offender (two-way balance / the 13th coin);
  (F) byte-twin parity with index.html. **30/30 pass.**

- **The form — `index.src.html` → `index.html`** (forged byte-true). One inline `<svg>`
  apparatus, all brass-and-glass: an A-frame FULCRUM with a glass-bead pivot jewel; a BEAM rotated
  about the pivot on a critically-damped spring (K=120, ζ≈0.9, θmax≈9°) with a teal plumb pointer
  reading a graduated −/0/+ arc; two brass PANS on triple chains, each a cradle of hairline gold
  seat-rings; twelve milled brass COINS engraved 1–12 (the fake visually identical — its lie lives
  only in core); the RACK of suspects below. The weighing is a four-beat loop the body performs:
  LOAD (pointer-drag a coin, ghost follows, gold drop-halo on valid pans) → WEIGH (the brass
  RELEASE, the ONLY commit — asks core.weigh) → READ (eased beam settle + aria-live trit
  narration) → PRUNE (the rack fans into three lanes {LEFT-LIGHTER / BALANCE / LEFT-HEAVIER} =
  core.partition; the two inconsistent lanes tarnish and slide off, the survivor third reflows, a
  ●●● pip advances). Plus PLANT A FAKE (index + light/heavy, or random-hidden) and RUN THE OPTIMAL
  SCHEDULE (plays the preloaded depth-3 schedule beat-by-beat so a hands-off visitor SEES the rack
  collapse to one coin). Full keyboard parity (arrow cursor, Enter pick/drop, L/R/U send a coin
  left/right/rack, Space weighs); one aria-live region narrates each beat. Under
  prefers-reduced-motion the spring snaps and prunes are instant. The page holds ONLY presentation
  state and a survivors Set it gets BACK from core — it never decides a partition.

- **The payoff layer.** THE SEAL — a wax medallion that lights GOLD "NO FEWER WAS POSSIBLE —
  ⌈log₃24⌉ = 3" the instant the rack reaches one suspect at depth ≤ 3 (reading core.solvableIn),
  and goes RED "THREE WILL NOT REACH" naming the offender from runSelfTest in the neg-controls. THE
  PROOF PILL + PROOF CARD state both honest halves — the floor AND the construction — as four
  integer-exact claims; **36,927 live integer assertions run on load, all exact**. The
  CASES-REMAINING counter divides by ~3 each weighing (24→~8→~3→1) with a ×⅓ glyph, captioned
  ≤⌈log₃N⌉ weighings still needed. Two knife-switches break the seal red: a two-way balance (a
  bit, not a trit — ⌈log₂24⌉=5>3) and a 13th coin (best-first branch 10 > 3²=9; solvableIn(13,3)=
  false) — both reading the SAME core.runSelfTest as the twin.

- **Registration & cross-links:** the Numbers Room landing gains its bench card and bumps to
  seventeen benches (self-test 26/26). Placed on the front-door map by DECLARING {district:grounds,
  tier:2, wing:number} behind the existing number wing — in both PLACES arrays (index.src.html +
  smoke.cjs), with a `drawCoinBalance` two-pan-balance footprint (A-frame, tipped beam, hanging
  pans, a rack of coins) in the DRAW table; `node tools/layout/smoke.cjs` passes. A reciprocal
  `.sib-link` with The Source Dial (entropy): coin→entropy "↗ The Source Dial · log₂" (gold),
  entropy→coin "↗ The Coin That Lies · log₃" (cyan) — neither restates the other's bound, each
  names only its own base. `ws:seen:the-coin-that-lies` literal + `WS.seen(...)` call.
