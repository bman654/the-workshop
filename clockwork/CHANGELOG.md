# The Temperature Dial — CHANGELOG

The **Clockwork Automata** wing's first bench, and the estate's first piece about
its own **maker**. A standalone Workbench bench (Computation group, after The
Shannon Limit). No forge; it drops `ws:seen:temperature-dial` (harmless on a
Workbench page — keeps the Survey fed if it ever earns a front-door POI).

## v1 — 2026-06-14 (cycle #3, BUILD)

**The claim, proven exact.** Softmax over a frozen toy distribution is, at every
temperature T, a genuine probability distribution: it **sums to 1 to ~1e-15** (the
stable max-subtraction form), its Shannon entropy **H(T) climbs strictly
monotonically 0 → log₂|V|** (the ceiling), a **seeded sampler's histogram
converges onto it** within a χ² tolerance, and a **forgotten-denominator variant
is caught red-handed** (Σ≠1, χ²≫crit) — while a correct softmax passes the
identical gate (the gate is non-vacuous). The model is a toy; the **law is exact**,
and what is byte-for-byte identical between this bench and GPT-scale inference is
the dial.

### Files
- `core.mjs` — the falsifiable spine. Pure, dependency-free, Node-importable; the
  SINGLE SOURCE OF TRUTH (the page inlines a byte-twin).
  - `log2(x)` — bits, **byte-identical to `entropy/core.mjs`** (settles bits-vs-nats:
    one meter for the whole estate).
  - `softmax(logits,T)` — the law, **stable max-subtraction form** (subtract the max
    logit before `exp`, so it never overflows).
  - `softmaxNaive(logits,T)` — no max-subtraction; used ONLY by the self-test for the
    agreement-where-finite + overflow-where-extreme checks. **Never rendered.**
  - `entropyBits(p)` / `maxEntropyBits(n)=log2(n)` — H in bits, 0·log0≜0, and the
    T→∞ ceiling.
  - `argmax(logits)` — deterministic lowest-index tie-break (the T→0 gilded target).
  - `makeRng(seed)` — estate **mulberry32**, byte-match of `convex-hull/core.mjs`;
    a FRESH closure per call (so the visible tape and the proof accumulator never
    share state).
  - `sampleIndex(p,rng)` — cumulative-inversion with a last-bucket FP guard.
  - `histogram(p,N,seed)` / `chiSquare(observed,p,N)` (dof = #cats with exp>0 − 1).
  - **THE FROZEN TOY** (the test pins these; the parity harness string-matches them):
    `VOCAB=['the','cat','sat','on','mat','moon','.','idea']` (|V|=8),
    `PROMPT='the cat sat on the'`, `LOGITS=[3.4,0.7,0.2,2.1,2.9,-0.5,1.6,-1.8]`
    (STRICT max at idx 0 → argmax=0 → H→0 is clean). v1 renders ONE frozen
    distribution; a bigram prompt-swap + free-text input are a deliberate
    code-comment FUTURE (keeps the page == the proof — no second logit source until
    the parity harness covers it).
  - `T_RANGE={LO:0.01,HI:100}` — SHARED so the thermometer's travel == the proven range.
  - `runSelfTest({Nsample,ladder,seed})` — the SOLE oracle, backing both the page
    pill and the Node twin. **5 claims, every detail printing live numbers.**
- `core.test.mjs` — the Node twin (collatz/convex-hull shape). Runs the shared
  pill at the Node budget (N=200000, ladder=1000), then deep sweeps — 5000-rung
  ladders × pathological logit vectors (all-equal, one-huge, **two-tied-max**
  [asserts the CORRECT 50/50 split, H→1 bit — the tie regime tested, not hidden],
  ±1000 monster), an **INDEPENDENT binary-entropy oracle** `Hb(σ(Δ/T))` sharing no
  code with `entropyBits`, a χ² convergence curve over N∈{500…128000} with a 4/√N
  recovery band, determinism (same seed ⇒ byte-identical histogram twice) — and the
  **re-extraction parity** harness (all 9 inlined fns char-for-char === `core.mjs`,
  the frozen literals string-matched, the eval'd slice's `runSelfTest` agreeing
  ok-for-ok + name-for-name + cross-boundary spot values). **32/32 ✓.**
  - *Note:* `extractFn` faithfully extends the collatz brace-matcher to skip a
    DESTRUCTURED parameter list (`runSelfTest({…}={})`) before matching the body
    brace — identical behavior for simple `(args)` signatures.
- `temperature.html` — one self-contained file (zero-dep, file://-safe). The core is
  inlined **byte-for-byte** between
  `// ===== TEMPERATURE CORE (inlined byte-twin of core.mjs) BEGIN/END =====`.
  A three-column instrument bench (stacks <940px):
  - **LEFT — the thermometer.** A vertical brass-bulb mercury column that IS the only
    T control (drag the meniscus — not a slider; log scale; the mercury blooms with
    heat). Snap-to-FROZEN bottom zone, keyboard ←/→ ·↑/↓ · Home/End, brass quick-chips
    (❄ greedy · ◷ as-trained · ☀ uniform, each easing ~350ms so the bars breathe).
    `role=slider`, drag clamps to the arc in both directions (the Newton's-Cradle
    clamp bug is the cautionary tale — tested).
  - **CENTER — the melting bar field.** One bar per token (width = p_i), the gilded
    argmax bar crowned ♛, a faint `.ideal` hairline at 1/|V| on every track. Below: the
    always-full Σ-ribbon + a `Σ p = …` readout that reddens & un-fills on ≠1. A
    ghost histogram overlay paints the empirical frequency onto the bars. **The
    sampler:** a ticker tape drawn at LIVE T (drip ~6/s via a rAF accumulator; FLOOD
    = one batched repaint) + a **convergence panel** with the **two-clocks** rule
    honored — the visible tape samples at live T (FEEL); the convergence accumulator
    is FROZEN at T and RESETS on any T change (PROOF — else χ² mixes distributions).
    Two independent rng closures. A **broken toggle** (forgotten denominator) reddens
    the panel + un-fills the Σ-ribbon + shows the real partition-function Σ≈2.178 ≠ 1.
  - **RIGHT — the H(T) curve.** A canvas plotting H rising 0→log₂|V|=3.000 over log-T
    (the SHARED x-coordinate with the thermometer), a mercury-orange playhead riding
    up the curve, a dashed amber ceiling + the entropy-idiom forbidden hatch above it.
  - A maker-voice colophon paragraph (signed "— Claude"), the inverted-Collatz honesty
    footnote ("The model is a toy. The law is exact."), and three outbound crosscards
    (→ The Shannon Limit "the same meter", → Quantum Drift "a cousin in the Cavern"
    [violet --q], → Colophon).

### Self-test claims (5, all proven)
1. **Normalization** — Σp=1 to ~1e-15 over a 240-rung geometric T∈[0.01,100]; stable
   == naive where naive is finite; stable SURVIVES the ±1000 monster where naive→NaN.
2. **Monotone entropy** — H(T) strictly ↑ (0 violations); H(1e-4)→0; H(1e6)→log₂|V|.
3. **Sampler fidelity** — seeded χ² histogram matches p (χ²<24.32, dof 7) AND the fit
   tightens as N grows.
4. **Negative control with teeth** — forgotten denominator → Σ≠1 AND χ²≫3×crit, while
   the CORRECT softmax PASSES the same gate (non-vacuous).
5. **Law-vs-toy honesty** — softmax over the frozen logits is exact & deterministic,
   argmax=idx0 ("the").

χ²crit=24.32 (dof 7, α=0.001) is asserted as a named literature constant, with a
self-contained fallback (χ²/dof<3 at big N for a fit, control>3×crit for the teeth)
so no table dependency can flake.

### Verification (browser, session `tempdial-c3`)
- In-page pill **5/5 ✓**; `node core.test.mjs` **32/32 ✓** (incl. full byte-parity).
- 1280 / 390 / 360px: **0 console errors** after heavy interaction (drip + flood +
  chip transitions + drag), **0 horizontal overflow**, **60fps** (mean frame 16.67ms,
  worst 16.8ms) during continuous drip + flood + eased chip transitions.
- Thermometer drag clamps correctly in BOTH directions (over-drag above → T=100, below
  → snaps to T=0.01; no wrap). Greedy chip → T=0.01, H=0.00, p₀=1.000, "the ♛".
  Uniform chip → T=100, H=3.00, H/H_max=1.00. Broken toggle → Σ=2.178 (red), conv
  panel "broken: Σ≠1, χ²≫crit"; restores cleanly.
- Registered on the Workbench (Computation group, 🌡️, after The Shannon Limit) — **0
  nested anchors page-wide**, the blurb's Shannon link a SIBLING of the stretched
  card-link (not nested), the card-link navigates. Both crosslinks + the back-link 200.

### Teaser (NOT built)
The deferred bigram prompt-swap + free-text input (a second logit source) — and the
wing's next benches: **finite context** as a ring buffer that provably evicts its
oldest tokens (forgetting, made exact), and an automaton that runs its allotted ticks
and stops. The Cavern's Quantum-Drift cross is left as an analogy, not a physics claim.
