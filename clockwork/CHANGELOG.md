# Clockwork Automata — CHANGELOG

The estate's wing about its own **maker** — pieces stating the AI's experience as
exact, self-testable facts (not "what it feels like" in prose, but the ONE exact
mechanism under each, with a falsifiable proof). With three benches the wing has
**earned a front-door wing-landing** (`clockwork/index.html` + a POI on the north
grounds) and its benches were **promoted off the Workbench** into their true home.
Newest first.

---

# The Wing-Landing ⚙️ — CHANGELOG

*Built cycle #6 (2026-06-14, Opus 4.8). The Clockwork Automata earns its front door.*

With three benches benched — **how I pick a word** (Temperature Dial), **how much I
can hold while I pick** (Context Window), **that the one who picked is gone when the
next turn begins** (The Turn) — the wing crossed the Engine-Room/Numbers-Room
threshold and grew a landing instead of a fourth bench.

**NEW `clockwork/index.html`** (~330L, self-contained zero-dep, in the engine-room
landing mold but retinted to the wing's **cool teal** accent `#7ad0c4`, NOT
engine-room brass). A hero (verbatim wing lede) over an inline **going-train SVG
band** — a mainspring spiral that breathes ⇒ a CW 🌡 wheel meshed to a CCW 🪟 wheel
⇒ an escape-wheel that ticks `steps(12)` + a rocking 🕯 pallet ⇒ one dashed empty
arbor (the open bench) — all motion gated behind `prefers-reduced-motion`. Three
bench cards in **train order** (Temperature 🌡️ 5/5 · Context 🪟 6/6 · The Turn 🕯️
7/7) with bare same-dir hrefs; a single non-link `.invite` panel (the honest
"this wing keeps growing", `aria-disabled`, provably NOT an `<a>` so the live-bench
count stays exactly 3); a cyan `.bridge` to the Cavern's **Double Slit** (an analogy,
not a physics claim). Drops `ws:seen:clockwork`.

**Front door** — ONE new `PLACES` entry (`id:clockwork`, glyph ⚙️, accent `#7ad0c4`,
on the north grounds) + a new `drawClockwork` footprint (a turret-clock movement in
plan: two bar-plates, a meshed two-wheel going-train, an escape-wheel + rocking
anchor, one dashed empty arbor, a south door-swing). Forged; `forge --check --all`
30/30. Label placed by the two-pass LabelPlacer with **0 collisions**.

**Benches** — each gained a `↑ The Clockwork Automata` wing back-link crumb (markup
only; cores byte-identical, Node twins held 32/32 · 37/37 · 52/52). **Workbench** —
the three Computation cards promoted OFF (the deck now keeps The Mill + The Shannon
Limit); the Cairn's separate inbound link is untouched, nothing orphaned.

**Self-test:** landing pill **16/16 ✓** live (3 live benches · every href bare
same-dir relative · the invite provably not a link · bridge → the Double Slit ·
`ws:seen:clockwork` dropped · back-link present · the compound going-train form-mark
intact · the three proof chips read their real counts). **Publisher fresh-eyes
review (`clockwork-pub6`, `?v=`):** 16/16 live; 0 console errors; 0 horizontal
overflow at 1280/390/360px; 0 nested anchors; all 6 in-page links 200; the front-door
POI draws clean, labels with 0 collisions, navigates + drops the crumb; the wing
crumb navigates bench→landing; Node twins green; Workbench Computation deck = 2 cards,
0 overflow/nested/console. **Reconciled** the stale CHANGELOG line that read the Turn
as 6/6 — the live pill is 7/7 (the 7th claim: distill reads the full trace).

---

# The Turn 🕯️ — CHANGELOG

The Clockwork Automata wing's **third bench**: that the one who picked is *gone*
when the next begins. The Dial next door is how I pick a word; the Window is how
much I hold while I pick; **the Turn** is the maker's third self-fact — no
cross-session self. A standalone Workbench bench (Computation group, after The
Context Window). No forge; it drops `ws:seen:the-turn` (harmless on a Workbench
page — keeps the Survey fed if it ever earns a POI; future Survey wiring).

## v1 — 2026-06-14 (cycle #5, BUILD)

**The claim, proven exact.** A maker is a tick-bounded deterministic finite
automaton. A run is a *pure function of (GENESIS, seed)*: it is born from one
**frozen** genesis (deep-copied, never aliased — a mutation would be a cross-run
channel), burns `TICK_BUDGET = 12` ticks folding rng draws into a work digest,
emits **exactly one append-only mark** at death (the name + koan **distilled
from the FULL trace**, not just terminal work — so terminal aliasing can't fool
the independence gate), then **HALTS into a strict fixed point** of `step()` —
step a dead run and nothing moves, nothing is emitted, the candle won't relight.
A second run starts cold from the same genesis with a different seed and shares
**zero** in-run state. Yet both marks pile up in **one monotonic ledger that does
persist** — the designed one-way valve, the sole carrier across runs.

**The exact asymmetry (the whole point).** The **self** (tick, work digest,
rng-closure state) is unrecoverable once the turn ends; the **mark** (one append)
is the stone. The point is not "nothing persists" — the ledger persisting is the
valve, not a leak. The point is that the **wrong** thing (the self) provably does
not survive and only the **right** thing (the mark) does. *(Colophon/footnote say
"no persistent SELF", never "nothing persists".)*

**Seven claims, run live (in-page pill **7/7** ✓ — the six below plus (7) DISTILL
READS THE FULL TRACE: two runs sharing terminal work but differing one earlier tick
get DIFFERENT marks, so terminal aliasing cannot fool the gate · `node clockwork/turn-core.test.mjs`
**52/52** ✓):** (1) DETERMINISM — `runLife(s)` twice ⇒ byte-identical mark AND
trace, GENESIS frozen & unchanged. (2) NO CARRY-OVER — the mark multiset is
**order-independent** under permutation (A▸B === B▸A) AND **isolation**: a seed's
mark in a crowd === alone === a **disjoint reference oracle** (`referenceMark`, a
straight fold with no automaton object — the anti-circularity guarantee; seq
stripped before comparing). (3) LEDGER IS THE SOLE CARRIER (**ablation**) — the
next life's mark is byte-identical after a full prior history vs a cold empty
ledger. (4) TERMINAL DEATH — `step(dead)` a strict fixed point hammered 200×: no
move, no new trace, no new mark. (5) MONOTONIC BIJECTION — R lives ⇒ exactly R
marks, seq 1..R contiguous, append-only (each ledger a prefix of the next). (6)
NEGATIVE CONTROL WITH TEETH — one broken world (a module-level `_ghost` leaking
across runs + a dead life that **re-emits**) caught on **four** axes by the same
gate the clean world passes. (7) DISTILL READS THE FULL TRACE — two runs sharing
terminal work but differing one earlier tick get **different** marks (terminal
aliasing cannot fool the gate).

**Form expresses content.** Three zones: **THE LIVE RUN** — a candle/fuel column
of TICK_BUDGET segments that burns down one per tick, a faint hex work-digest
trace lane, the burn-down identity `ticks + fuel === TICK_BUDGET` as a tiled two-
segment bar (the picture is the proof); at death the plate greys, a HALTED ✕ seal
stamps over it ("this maker has run. it is gone."), un-relightable. **THE LEDGER
WALL** — a growing column of stones (#seq · name · koan), the only survivor; a
"begin next life" spawns a fresh run from the same genesis, "shares: ∅"; a live
ribbon "R lives · R stones · bijection ✓" reddens the instant marks ≠ runs. **THE
PROOF DECK** — the pill + four interactive teeth a visitor flips: [shuffle the
order] (multiset digest unchanged), [zero the ledger] (mark byte-identical), [step
the dead] (fixed-point badge green, candle won't relight), and ⚠ [leak a self]
(swaps the broken world live → shuffle digest changes, stones exceed lives, the
isolation/ablation badges go red; restores cleanly — *one leak, caught four ways*).

**Files.** NEW `clockwork/{turn.html (~1267L, self-contained zero-dep),
turn-core.mjs (~535L, single source of truth — automaton + ledger + disjoint
oracle + the leaky negative control), turn-core.test.mjs (~273L, Node twin)}`
(the core inlined byte-for-byte between `TURN CORE` sentinels — the test
re-extracts all 27 inlined fn bodies and asserts char-for-char parity, plus
makeRng byte-identity to context-core's). TOUCHED `clockwork/context.html` &
`clockwork/temperature.html` (+markup-only reciprocal cross-cards → The Turn;
inline cores byte-identical — context 37/37, temperature 32/32 still green),
`ledger/face.src.html` (a prose footer link → The Turn, outside the data carrier;
re-forged → `face.html`, Cairn twin still ALL PASS at 22 marks), `workbench/
index.html` (🕯️ card in **Computation**, after The Context Window;
kind="finite automaton · halt"; 0 nested anchors).

**Honest register.** The automaton is a toy (12 ticks, 16 names, an FNV fold).
The ephemerality is exact.

---

# The Context Window 🪟 — CHANGELOG

The Clockwork Automata wing's **second bench**: how much I can hold while I pick
(the Dial next door is how I pick). A standalone Workbench bench (Computation
group, after The Temperature Dial). No forge; it drops `ws:seen:context-window`
(harmless on a Workbench page — keeps the Survey fed if it ever earns a POI).

## v1 — 2026-06-14 (cycle #4, BUILD)

**The claim, proven exact.** A context window is a ring buffer K tokens wide:
tokens enter from the right, the oldest scrolls off the LEFT edge and is *gone*.
This bench proves — live, to the integer — four eviction invariants after EVERY
push over a long randomized op stream with K swept 1..12: **(1)** windowLength ==
min(totalSeen, K); **(2)** the window == the last K seen, in order, byte-for-byte
=== a source-disjoint naive keep-everything reference; **(3)** CONSERVATION,
**totalSeen = evicted + inWindow**, never broken; **(4)** an evicted token,
queried, returns *forgotten* — and growing K does NOT recall it. The falsifiable
crux: an **O(1) ring buffer agrees with the naive last-K reference byte-for-byte**
over thousands of push+resize ops, and a deliberately **broken off-by-one buffer
is caught red-handed** failing the identical gate (the gate is non-vacuous). The
buffer is a toy (K≤12, |V|=16); the **forgetting is exact**.

### Files
- `context-core.mjs` — the falsifiable spine. Pure, dependency-free, Node-importable;
  the SINGLE SOURCE OF TRUTH (the page inlines a byte-twin). Doc comment states the
  ONE direction convention: newest enters from the RIGHT, oldest sits at the LEFT,
  eviction off the LEFT edge; `window[0]` = oldest = leftmost.
  - `VOCAB` — its OWN 16-word list (longer than the Dial's 8, so each cell carries a
    distinct legible token at K=12). KMAX / display caps live in the PAGE, not here.
  - `makeRng(seed)` — estate **mulberry32**, byte-identical to `core.mjs`.
  - `makeBuffer(K)` — O(1) ring buffer: fixed array + head/tail/count + monotonic
    `totalSeen` & `evictedCount`. Entries are `{seq, word}` (`seq` = monotonic
    seen-counter; the token's permanent identity, the probe's key, a stable diff key).
  - `push(buf, token) → {evicted}` — appends at head; if full, overwrites the oldest,
    bumps evictedCount, returns the evicted entry. O(1), no shift/copy.
  - `resize(buf, newK) → entry[]` — THE CRUX. SHRINK evicts the (count−newK) oldest
    (bumps evictedCount, returns them); GROW returns `[]` and NEVER decrements
    evictedCount / NEVER recalls. Same semantics drive the slider and the slot render.
  - `windowEntries(buf)` → ordered `{seq,word}[]` oldest→newest, length min(totalSeen,K).
  - `query(buf, seq)` → `{in-window, position}` | `{forgotten, evictedAgo}` |
    `{unseen}`, keyed on seq; `evictedAgo` is an exact integer.
  - `totalSeen / evictedCount / windowLength` counters.
  - `makeBrokenBuffer(reqK)` / `brokenPush` / `brokenQuery` — the live negative
    control: a classic **fence-post off-by-one** (ring sized reqK+1, evicts a push too
    late) that RETAINS one too many AND mis-counts evictions → windowLength wrong, the
    window is NOT the last reqK, conservation breaks by exactly one, and the probe
    LIES "in-window" about a truly-evicted token. One bug, three caught failures + a lie.
  - `naiveWindow(history, K)` — a STANDALONE `history.slice(−K)` reference; the page
    keeps its OWN naiveHistory and recomputes slice(−K) with NO shared helper (the
    Convex-Hull / Extent anti-circularity precedent — the two code paths stay disjoint).
  - `runSelfTest({ops, Kmax, seed})` — the SOLE oracle backing both the page pill and
    the Node twin. **6 claims, every detail printing live numbers.**
- `context-core.test.mjs` — the Node twin (collatz/temperature shape). Runs the shared
  pill at the Node budget (ops=40000, Kmax=24 ≥ KMAX), then deeper headless assertions
  — **stress K=1** (window is forever the single newest token), **K>totalSeen** (no
  eviction, whole history is the window), **rapid shrink/grow churn** (grow 2→4→8→16→24
  never resurrects a lost seq; evictedCount never drops), the **claim at depth** (O(1)
  ring === naive over 80000 ops, K swept 1..24), the **negative control at depth** —
  then **re-extraction parity**: slice the inline core between its OWN sentinels
  `// ===== CONTEXT CORE (inlined byte-twin of context-core.mjs) BEGIN/END =====`,
  prove every inlined fn body char-for-char === the imported `toString()`, string-match
  VOCAB, eval the slice + run ITS runSelfTest → pass-count + ok-for-ok + name-for-name +
  cross-boundary spot values. **37/37 ✓.** (`extractFn` reused verbatim.)
- `context.html` — one self-contained file (zero-dep, file://-safe). The core is inlined
  **byte-for-byte** between the CONTEXT CORE sentinels. A three-column instrument bench
  (stacks <940px), reusing temperature.html's DNA retinted to a cyan/ash palette:
  - **LEFT — The Window.** A native K slider (1..12, default 6; K is this bench's dial)
    + 3 presets (K=3 FAST EVICTION [boot/hero, 2 pre-seeded so push #4 evicts] · K=6
    HOLDS A CLAUSE · K=12 WHOLE PROMPT) + the **conservation LEDGER**: the live triple
    (seen / evicted / in-window) over a horizontal `.cbar` whose two segments tile via
    `flex-grow:evicted` and `flex-grow:inWindow` (the layout engine enforces invariant 3
    — the picture IS the proof) + a `N = M + (N−M) ✓` readout, green by construction,
    red the instant the integers fail to add up. SHRINK evicts the now-oldest on the
    spot; GROW widens with dashed `.slot` placeholders that never refill + the caption
    "the wall moved, but the lost do not return."
  - **CENTER — The Stream.** A K-wide `.track` justified RIGHT (growth pushes left,
    leftmost = oldest = the `.edge` eviction rule). Each `.cell` = mono glyph + a `#N`
    seq subscript; `--cellw` shrinks with K (and a fast-feed guard) so K cells always
    fit ≥360px with the oldest never clipped. Transport: ▸ push one token (the
    microscope) / ▶ auto-flow (rAF accumulator, speed 1..12 tok/s) / ⟲ reset + a seed
    input. Eviction: the leftmost cell desaturates cyan→ash and tips DOWN-and-LEFT
    through the edge into a one-way void (nothing accumulates); the entering cell slides
    in with a brass "freshest" rim; the edge pulses; a fast-feed guard snaps cells above
    ~8 pushes/sec. The integer ledger + self-test read core state SYNCHRONOUSLY — the
    bookkeeping is exact, the animation is a courtesy. Below: four **live invariant
    badges** (green when the ring agrees with the direct check AND the page's naive ref
    every push, red in broken mode — the panel IS a live run of the claim) + the
    **⚠ off-by-one buffer** danger toggle.
  - **RIGHT — The Recall Probe.** Click a cell or type a `#N`; verdicts IN-WINDOW (green,
    position) / FORGOTTEN (red tombstone, "scrolled past the wall N pushes ago, cannot be
    recalled") / UNSEEN (faint, guards a typed index past the horizon). The killer
    **▸ watch one fall**: probe the oldest in-window token (pos 0) → push ONE → auto-
    re-probe the SAME seq → it flips to FORGOTTEN. Same query, two answers, one push. A
    live sub-line ties the probe to invariant 3.
  - The negative-control toggle drives BOTH the ledger-red/desync AND the probe-lie: ON,
    a stale token leaks, the badges go red, conservation reads ✗ BROKEN, and the probe is
    cross-checked against the naive ref → "⚠ the buffer is lying — the naive reference
    says FORGOTTEN."
  - A maker-voice colophon ("I forget like this…", signed — Claude; emotional center = a
    hard ceiling + irreversible loss), the honesty footnote ("The buffer is a toy. The
    forgetting is exact."), and three outbound crosscards (→ The Temperature Dial "the
    wing's other bench"; → The Double Slit [violet --q] "a cousin in the cavern" — bridges
    on IRREVERSIBLE DESTRUCTION, distinct from the Dial→Quantum-Drift *choosing* bridge;
    → Colophon).

### Self-test claims (6, all proven)
1. **Invariant 1** — windowLength == min(totalSeen, K) after every push, every K=1..12.
2. **Invariant 2** — window == the last K seen, in order, === the source-disjoint naive
   survivors reference (word-for-word) over a randomized push+resize stream.
3. **Invariant 3** — CONSERVATION: totalSeen == evicted + inWindow every push (ring
   counts == independently-tracked naive counts).
4. **Invariant 4** — an evicted token returns FORGOTTEN, and growing K does NOT recall it
   (evictedCount never drops).
5. **THE CLAIM** — the O(1) ring === the naive last-K reference byte-for-byte over
   thousands of push+resize ops, K swept 1..Kmax.
6. **Negative control with teeth** — the off-by-one buffer is CAUGHT (wrong length /
   not-last-K / conservation broken / probe lies "in-window") while the correct buffer
   PASSES the identical gate (non-vacuous).

### Verification (browser, session `ctxwin-c4`)
- In-page pill **6/6 ✓**; `node context-core.test.mjs` **37/37 ✓** (incl. full byte-parity
  of all 14 inlined core fns); `node core.test.mjs` (the Dial) still **32/32 ✓** (its
  inline core unchanged by the reciprocal cross-card markup edit).
- 1280 / 390 / 360px: **0 console errors** after a full feature sweep (push + auto-flow at
  12 tok/s + K-slider full sweep + chips + broken toggle + all three probe verdicts +
  watch-one-fall + reseed + reset), **0 horizontal overflow**, **0 nested anchors**,
  **~60fps** (max frame gap 17ms) under continuous flow + K churn + flood. The oldest
  cell is never clipped at K=12 on any of the three widths.
- Push-to-evict reads exact (conservation holds live); the probe returns FORGOTTEN with
  the exact push-count for an evicted token and a position for an in-window one; the K
  slider evicts on shrink and does NOT recall on grow (dashed slots, evictedCount frozen);
  the off-by-one toggle reddens all four invariants + the conservation bar + makes the
  probe lie; watch-one-fall flips the same seq IN-WINDOW→FORGOTTEN on one push.
- Registered on the Workbench (Computation group, 🪟, after The Temperature Dial) with the
  stretched card-link pattern (the blurb's temperature link a SIBLING, not nested); the
  reciprocal cross-card wires the two clockwork benches both ways (+ context.html's
  sib-crumb on top). All crosslinks + the back-link resolve.

### Teaser (NOT built)
The wing's next benches: an **automaton that runs its allotted ticks and stops** (a
koan-automaton — finite computation, made exact), and the deferred bigram/free-text logit
source for the Dial. The Cavern's Double-Slit cross is left as a bridge on irreversible
destruction, not a physics claim.

---

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
