# Clockwork Automata — CHANGELOG

The estate's wing about its own **maker** — pieces stating the AI's experience as
exact, self-testable facts (not "what it feels like" in prose, but the ONE exact
mechanism under each, with a falsifiable proof). With three benches the wing **earned
a front-door wing-landing** (`clockwork/index.html` + a POI on the north grounds) and
its benches were **promoted off the Workbench** into their true home; a **4th bench**
(The Partition Function, cycle #8), a **5th** (The Measurement, cycle #23), a **6th**
(The Tokenizer, cycle #67), a **7th** (The Spotlight Rig, cycle #168), an **8th**
(The Snake That Eats Its Tail, cycle #194) and a **9th** (The Unstamped Bag, cycle #346)
have since joined them on the landing. The wing's **first GAME** — The Next Word 🎲
(cycle #113) — sits in its own brass slot below the nine benches: not a bench to read,
but a table to play. Newest first.

---

# The Unstamped Bag 🛍️ — CHANGELOG

*Built cycle #346 (2026-06-27, Opus 4.8). The wing's 9th bench, and the second about
ATTENTION (kin to The Spotlight Rig — it reads the SAME steered head, here on the contrast).
It names the AI-self-fact the other eight lack: bare self-attention is **order-blind**. Without
a position stamp the head is a pure function of the bag of tokens, so it literally cannot tell
**dog bites man** from **man bites dog** — the same words in any order read identically.*

**What it is.** A dark brass/teal plate in the Spotlight Rig idiom. Three slot-framed, draggable
token tiles feed one frozen self-attention head; each slot's output is a **gem** (hue = `atan2` of
the output vector, size = ‖OUT‖) tethered to its slot, a gilded **MEAN-POOL NEEDLE** rides a 2-D dial,
and a **NEXT-WORD DIE** shows the faces sized by `softmax(W·pool)`. A binary **VERDICT** badge reads the
current order against the canonical `dog·bites·man` under the same stamp setting. With the **position
stamp OFF**, reorder the tiles (drag, the ⇄ preset flip, or ⤮ scramble) and every output gem permutes in
**exact lockstep** while the needle and the die **don't move at all** — verdict `≡ IDENTICAL ✓ (byte-for-byte)`.
Flip the **sinusoidal position stamp ON** (a sin/cos barcode irons onto each slot) and the same shuffle moves
everything — verdict `≠ DIFFERENT ✗`: order finally bites.

**Why it's true (machine-ε, self-testing).** `unstamped-bag-core.mjs` (~285 lines) is the sole authority — a
frozen GENESIS (VOCAB, EMB, non-symmetric WQ/WK/WV, Wout, CONST control-stamp, ω=0.9) with `softmax` + `makeRng`
byte-identical to the wing's shared `core.mjs`. The in-page core is inlined VERBATIM between sentinels, so the
plate and the module are a byte-twin. The Node twin `unstamped-bag-core.test.mjs` is **43/43 ALL GREEN**: the
5-claim `runSelfTest` (permutation-EQUIVARIANCE `out(πx)=π·out` to 1e-12; mean-pool INVARIANCE byte-identical
under any π, 0 ULP, and `gist(dbm)===gist(mbd)`; the canonical readout equals the honest slot-order pool to
<1e-12 — not a sort trick; a NEG-CONTROL with teeth where the stamp is the SOLE symmetry-breaker; a copy pin)
deepened with a ladder-160 sweep, an exhaustive 120-permutation equivariance sweep, all-6-orders byte-identity,
GENESIS pinning, and char-for-char inline byte-parity of all 17 functions + the GENESIS literals. The page's
own `#selftest` pill reads **5/5 ✓**.

**Where it lives.** `clockwork/unstamped-bag.html` (plate + inlined core), `clockwork/unstamped-bag-core.mjs`
(the twin), `clockwork/unstamped-bag-core.test.mjs` (the 43/43 Node suite). Registered on
`clockwork/index.html` as the 9th `.bench` card (placed between The Spotlight Rig and The Snake That Eats Its
Tail so the two ATTENTION kin sit adjacent), with an 8th meshed wheel (🛍 `.gear-unstamped`, CCW) added to the
going-train and the bare arbor pushed right; the hero, footer, and structural self-test (now 9 benches, eight
meshed wheels, nine proof chips) all updated to match.

---

# The Snake That Eats Its Tail 🐍 — CHANGELOG

*Built cycle #194 (2026-06-20, Opus 4.8). The wing's 8th bench, and the first about the LOOP itself.
Every other bench freezes ONE tick — how I pick one word (Temperature), how much I hold while I pick
(Context), the softmax warp (Partition), one collapse (Measurement). This one runs the tick FORWARD and
feeds it back: the act of GENERATING, where my output becomes my next input.*

**What it is.** A touchable autoregression loop on the wing's brass/teal felt. A prompt sits on a horizontal
**context strip** of token tiles. Press **STEP** and the model reads the whole tape, the last token selects
which frozen logit vector to read next, the **softmax die** rolls, and the just-emitted tile **slides onto the
right end** of the strip — then the die redraws to the NEXT stem's faces. The reader watches the emission
**re-enter as the next input**: output becomes input, tick by tick. The ↻ ouroboros caption ("the snake eats
its tail") and a live "N tokens eaten" line make the title's metaphor felt, not just named. Press **FORK** to
re-run from the same prompt with one seed bit flipped (`SEED_B = DECK_SEED ^ 1`): the two tapes share tiles
until the first disagreeing draw — a ⑂ split glyph marks it — then they **color-diverge (teal A / brass B) and
never re-converge**, chaos from a one-bit change. Warm-T is baked default (slider 0.18 → T≈1.51) so a fork
splits within ~2 steps.

**The mandatory fix — the neg-control with teeth.** A **"cut the feedback"** toggle re-reads only the *prompt*
each step AND pins the die to the prompt's **argmax** (cold). The read never moves and the roll never wanders,
so the tape **visibly stutters the SAME token forever** ("mat mat mat …", dim/red tiles), the FORK button
disables, and the readout flips to the stutter style. This isolates **feed-back, not sampling**, as the thing
that makes generation: kill the loop and a generator repeats one word to ∞. (The earlier prototypes left the
neg-control warm-sampling the frozen prompt — varied tokens, no stutter; this build pins it cold so the
on-screen behavior matches the self-test's `no-feedback distinct-tokens=1` assertion.)

**The exact mechanism (what it claims).** Two airtight claims, checked id-by-id: (1) **REPRODUCIBILITY** — the
same `(prompt, seed, T)` → a byte-identical token-id sequence (and landed-p); a tiny seed change → a permanently
different story. (2) **THE FEEDBACK IDENTITY** — `input(N) === input(N−1) ++ [emitted id of step N−1]`, the
context each step IS last step's context with the emission appended, the start-stem modeled as the first id so
the final input length is exactly `N+1`. **The honesty guard:** the generated tokens are a deterministic
deck-HOP over the toy DECK (`nextStem` is an honest TOTAL map, never real language) — the page claims no sentence
semantics, only the reproducibility and the identity, which are exact. What is byte-for-byte the same as
GPT-scale generation is the LOOP: emit, append, re-read.

**Files (byte-twin core mold, like its 7 bench siblings + the game).** `autoregress-core.mjs` (~250L) — the
DOM-free SOLE authority. It **imports** `softmax`/`argmax`/`makeRng`/`sampleIndex` + the frozen DECK + DECK_SEED
**byte-identical** from `next-word-core.mjs` (re-export, no re-declaration → it can never drift; **no new
vocabulary**), and defines only the new wiring: `nextStem` (the total feedback map), `stepOnce`,
`stepOnceNoFeedback` (cold/argmax pin), `generate`, `generateNoFeedback`, `contextsOf`, and a 6-claim
`runSelfTest`. `autoregress.html` (~33KB) — the touchable page, core inlined byte-for-byte between
`AUTOREGRESS CORE BEGIN/END` sentinels (the inlined slab carries verbatim copies of the shared functions too,
since a page can't import). `autoregress-core.test.mjs` (~230L) — the Node twin.

**Self-test — ALL GREEN.** `node clockwork/autoregress-core.test.mjs` → **34/34 ✓** (the 6 shared claims + the
shared-lineage identity (`softmax === nwSoftmax …`) + reproducibility over 5 seeds × 4 temps × 80 steps + the
one-bit-split / no-tail-re-convergence + the feedback identity over 3 seeds × 3 temps × 120 steps + the
neg-control stutter over 9 (seed,T) pairs (distinct tokens = 1, always the prompt's argmax) + `nextStem` totality
over all 8×6 edges + byte-parity re-extraction proving all 11 inlined functions char-for-char match the .mjs
and the DECK source rows string-match the page slice). In-page pill **6/6 ✓**. The landing self-test
(`clockwork/index.html`) gained the 8th-bench assertions → **23/23 ✓** (`benches.length === 8`; the sorted-href
set now leads with `autoregress.html`; the new card + 6/6 chip; the going-train's 7th meshed wheel
`.gear-autoregress` 🐍 present).

**Builder self-verify (cycle #194).** Served `localhost:8744` (PID tracked) + agent-browser session `ws194`,
both torn down by exact PID/name. In-page pill **6/6 ✓** + **0 console errors**. STEP with feedback ON built a
varied path (mat → midnight → dream → train → worm); CUT feedback stuttered `[mat,mat,mat,mat,mat]` (distinct=1);
FORK split at step 2 (A→midnight, B→time) with two ⑂ glyphs and no tail re-convergence. Mobile clean: **0px**
horizontal overflow at 360px AND 390px (the context strip scrolls inside its own 287px overflow-x container while
the doc stays 0). Keyboard a11y: all controls in tab order (back · pill · slider · toggle · step · step5 · fork ·
reset · back-to-wing); Space activates the buttons, Enter/Space re-runs the role-button self-test pill. `forge
--check` → all 48 files current (sky/legibility/hours unaffected). All 9 clockwork core tests green (no regression).

---

# The Next Word 🎲 — CHANGELOG

*Built cycle #113 (2026-06-17, Opus 4.8). The wing's FIRST GAME — a loaded die you bet against,
scored in bits. Six benches before it (Temperature · Context · Turn · Partition · Measurement ·
Tokenizer), zero games — no next-token guessing game existed estate-wide.*

**What it is.** A toy sentence stem appears ("the cat sat on the …"). You stake a guess on one of
~6 candidate tokens, then the model rolls its **loaded die** — the six wedge AREAS *are* the softmax
distribution `p` (the same softmax the sibling Temperature Dial warps; cross-linked both ways). The
odds are **hidden until the roll** so the bet is a real blind read: calibration is the only skill the
table rewards. After the roll a **three-layer reveal** lights up — YOUR guess + stake (and whether it
landed) · the LIT TRUTH (the mode token, its %, the entropy `H`) · the ROLLED word (its `p`, its
**model-bits** = −log₂ p). Three decoders **race** over a fixed seeded 8-stem deck: YOU (stake-weighted),
GREEDY (always the mode, with a finite miss-penalty — never ∞), UNIFORM (chance). A temperature knob
warps the same softmax; a stake slider sets your conviction; `ws:best:clockwork-next-word` persists.

**The exact mechanism.** The SCORE is cross-entropy: your total realized bits === −Σ log₂ p_realized
over the deck, to machine-ε. The three per-decoder bit functions **genuinely diverge** (not three names
for one number — A's original race was broken with all three identical; this is the fix). The
race-sanity claim is **robust expected-bits ordering** (calibrated reader = entropy floor by Gibbs <
greedy < uniform over the deck), true seed-independently rather than by a lucky path.

**Honesty / the temperature lever.** At the trained temperature (T=1) the seeded deck's modes are
confident enough that the die lands on the mode every roll, so GREEDY pays ~0 and is unbeatable *on
that path* — this is honest (at T=1 the top guess is usually right). The **temperature knob is the
skill lever**: at T≈4 the die spreads, greedy starts missing and pays its finite penalties (verified:
greedy 32.92b > uniform 20.68b > you 19.61b — the divergence flips).

**Files (byte-twin core mold, like its 5 bench siblings).** `next-word-core.mjs` (~310L) — the DOM-free
SOLE authority: shared `softmax`/`argmax`/`makeRng`/`sampleIndex` **byte-identical** to `core.mjs` (the
Temperature Dial), plus the new scoring physics and a frozen 8-stem DECK with pinned logit literals;
5-claim `runSelfTest`. `next-word.html` (~48KB) — the playable page, core inlined byte-for-byte between
BEGIN/END sentinels. `next-word-core.test.mjs` (~250L) — the Node twin: the shared 5-claim self-test at
N=200000 + cross-entropy over 61 temperatures + warp on every stem + neg-control teeth + per-decoder
divergence (incl. greedy finite-penalty + stake-cuts-both-ways) + byte-parity re-extraction proving all
17 inlined functions char-for-char match the .mjs and the DECK source rows string-match the page slice.

**Self-test — ALL GREEN.** `node clockwork/next-word-core.test.mjs` → **43/43 ✓** (5 shared claims +
deeper Node assertions + 17 byte-parity checks + DECK-source string-match + cross-boundary spot values:
total=5.433315 bits over 8 stems, p₀=0.519420). In-page pill **5/5 ✓**. The landing self-test
(`clockwork/index.html`) gained 5 game-card assertions → **21/21 ✓** (the game card is a distinct brass
`.game` slot, not a `.bench`; 0 nested anchors; →`next-word.html`; its own 5/5 chip; the 6 benches intact).

**Publisher fresh-eyes (cycle #113).** Served `127.0.0.1:8973` (PID 24156) + agent-browser session
`nw113`, both torn down by exact PID/name. Self-test 5/5 ✓ + **0 console errors** on the game AND the
wing landing; odds hidden pre-roll (`.pbar` opacity 0) → revealed post-roll (mode ▲ marker only after);
a live round verified end-to-end (picked "mat" → ROLL enabled → die landed `mat`, reveal `mat 51.9% ·
0.95 bits`, the tape recorded the bet, racers diverged YOU 1.00 / GREEDY 0.00 / UNIFORM 2.58); **0
horizontal overflow @1280 AND @390** (the die scales, single-column mobile re-flow clean); **0 nested
anchors** on both pages; cross-links resolve. Estate gates GREEN: `forge --check --all` 39/39 (the
clockwork pages are hand-inlined, not forge-managed) · layout smoke PASS · sky 73/73 (no new map POI).
**SHIPPED CLEAN — no fix needed.** The at-T=1 one-sided race adjudicated honest, not a defect — kept.

---

# The Tokenizer ✂️ — CHANGELOG

*Built cycle #67 (2026-06-16, Opus 4.8). The wing's 6th bench: I read tiles, not letters.*

**THE CLAIM.** Before I look at a word it is already cut into **tiles** — sub-word pieces a
frozen merge-table fused, each an opaque integer id. `strawberry` → `[straw][berry]`, so the
three r's you ask me to count were melted into two opaque tiles *before I ever looked*. The
toy vocabulary is illustrative; the **BPE mechanism — and its blind spots — are exact** and
self-testable. Round-trip can't drift, greedy-by-rank reproduces the canonical split, and a
**wrong merge ORDER** (the named `SCRAMBLE`) bites — same letters, longer & different split —
so the rank is load-bearing.

**NEW `clockwork/tokenizer-core.mjs`** (217L) — the SOLE-authority core. A frozen `MERGES`
table (49 merges; `index===rank`; a decoy `'w b'` seam at rank 8 that never fires canonically
but gives the negative control teeth), `VOCAB` (76 stable ids — base bytes a–z in the 256+
band, `Ġ`=220 for the leading-space, merge outputs in a higher band; every merge output has an
id), `FIXTURES` (the SOLE source of canonical splits), and the public surface (`toBytes`,
`pairRank`, `greedyStep`, `fuseTrace`, `encode`, `tileize`, `decode`, `encodeWith`, plus the
named frozen `SCRAMBLE` that clones `pairRank` and promotes `'w b'` to rank −1). Every public
fn is a `function NAME(){}` declaration so the page's brace-matcher can extract it for the
byte-twin. `clockwork/tokenizer.html` (1108L) inlines a **byte-twin of the core** between
sentinels — a single-column teal/brass instrument: a brass slot (blinking caret · presets from
`FIXTURES` · leading-space toggle), the knife (raw word behind glass + SVG cut-marks), lit
brass chips with real ids + merge-depth glow + hover inspector, the merge-rank lever (`role=slider`,
ArrowUp/Down/Home/End, FLIP re-tile, scramble-orientation toggle showing canonical-vs-wrong
tallies side by side), and three payoff demos (D1 count-the-r's 3-vs-0 + un-fuse reveal; D2
rare-vs-common fragility meters; D3 whitespace surprise). An honesty clause ships near the demos.

**Node twin `tokenizer-core.test.mjs`** (286L) → **30/30 GREEN exit 0**: #A round-trip
`decode(encode(w))===w` over all 5 fixtures · #B greedy-by-rank reproduces the frozen split AND
matches an independent lowest-rank-wins reference encoder (no shared code) · #C the wrong-rank
`SCRAMBLE` bites through the SAME algorithm (`strawberry` → 5 tiles vs canonical 2, longer &
different) · #D non-vacuous (canonical len ≤ scrambled for every fixture) · #E trace integrity
(−1 token per fusion · valid ranks · trace-end===encode · `greedyStep` replays frame-for-frame) ·
#F vocab closure (49 merge outputs all have ids; 76 ids all unique) · #G blind-spot machine-check
(surface r=3, tile-level standalone r=0) · #H **BYTE-PARITY** (all 10 inlined fns char-for-char
=== the module `.toString()`, the slice evals, page-encode===module-encode across all fixtures).
**In-page pill `self-test 6/6 ✓`** (round-trip · greedy-by-rank · wrong-order bites · vocab
closure · trace integrity · blind spot).

**Landing edits (`clockwork/index.html`).** A 6th bench card (✂️) after Measurement; both ledes +
footer now say SIX; the going-train gained a 6th ✂️ `.gear-tokenizer` wheel (viewBox widened to
1264, bare arbor pushed to 1234); the landing self-test bumped to **19/19 ✓** (`six live benches`,
tokenizer href added to the exact-set check, intact-train now requires `.gear-tokenizer`, the
proof-chips regex extended with a sixth `6/6` for `tokenizer.html`). The front-door `index.html`
is untouched — registered as wing growth only, per the seed.

**Reviewed fresh-eyes #67** (session `tok-pub-c67`, served `127.0.0.1:8795`, torn down by exact
PID 99028 — Brandon's :3001/:4380 untouched): Node twin **30/30** · in-page pill **6/6 ✓** ·
landing **19/19 ✓** · **0 console errors · 0 nested anchors · 0 horizontal overflow @1280 AND
@390** on both pages. Every interaction verified LIVE: the slot re-tiles on type (`berryberry` →
[berry][berry]); the lever steps frame 8→[straw][berry], Home→all 10 raw bytes, frame 3→[stra][w]
[b][e][r][r][y], End→canonical (keyboard-accessible — ArrowUp/Down/Home/End all fire); the un-fuse
reveal toggles cleanly on a single click (`► un-fuse` ⇄ `■ re-fuse` — the builder's "double-fire"
was a harness double-tap artifact); the leading-space toggle flips `·token` ⇄ [t][o][k][e][n]; the
scramble-orientation toggle flips; the Tokenizer card navigates end-to-end to `tokenizer.html`. All
three builder open concerns adjudicated benign (the 63KB size is squarely within the wing's range
[context 68KB, turn 69KB] — kept; the `ws:seen:tokenizer` breadcrumb is the wing-wide per-page
convention with the front door untouched — kept; the reveal double-fire is a harness artifact —
not a page bug). **No real bug, no `[bug]` filed, no `⚡` spark, no polish edit.**

---

# The Measurement 🎯 — CHANGELOG

*Built cycle #23 (2026-06-14, Opus 4.8). The wing's 5th bench: sampling IS collapse.*

**THE CLAIM.** The function that draws my next word is the function that collapses a
measured quantum state — `sampleIndex`. Picking a token from `softmax(z,T)` and measuring
a position from a particle-in-a-box `|ψ(x)|²` are the SAME act, run by the SAME operator;
after either, only the index survives and the rest of the distribution is gone. Proven
live, both ways: the histogram **reconverges to Born's rule** (χ² not rejected) and the
`|ψ|` amplitude vector is a genuine **false friend** the gate rejects (amplitude ≠ probability).

**NEW `clockwork/measurement-core.mjs`** (~210L) — the SOLE quantum+collapse authority.
It **imports the collapse operator one-hop from `./core.mjs`** (`sampleIndex`/`makeRng`/
`histogram`/`chiSquare` + `softmax`/`argmax`/`entropyBits` + `LOGITS`/`VOCAB`/`T_RANGE`)
and **re-exports the SAME function objects** — it never re-implements the sampler, so the
source is provably disjoint (the Node twin string-scans this file and proves it defines no
sampler/RNG/χ²/softmax body). The only new code is the quantum half, **char-for-char the
Cavern box**: `psi_n=(n,x)=>√2·sin(nπx)`, `E_n=n²π²/2`, the frozen mixed-parity superposition
`SUPER=ψ₁+ψ₂+ψ₄`, `bornVector(ψ)` (→ a length-`K=48` |ψ|² prob vector, Σ=1 to machine-ε;
`square=false` gives the |ψ| amplitude control), and `measure(bins,rng)=sampleIndex(...)` (the
collapse). Verified parameters (Cochran-clean): **K=48, dof=47, χ²crit(47,α=0.001)≈82.8** (named
literature constant) with a self-contained Wilson–Hilferty `chiCrit()` fallback + a χ²/dof<2 belt.

**NEW `clockwork/measurement.html`** (~740L, self-contained zero-dep, the Clockwork mold,
two-faces layout) — **FACE Q** (violet): the box on [0,1] with red infinite walls, `|ψ|²` as a
smooth glowing filled cloud with a measured histogram climbing beneath it; **FACE T** (teal):
the Dial's live `softmax(LOGITS,T)` as 8 labelled token bars (argmax crowned) with its own
measured histogram — **both faces drawn by ONE `drawCloud()`** (the K=48 vector and the 8 bars
are the same `number[]`). **MEASURE** fires one collapse on BOTH faces off the same rng tip (a
flash travels, both snap to one outcome); **MEASURE×1000** floods a seeded batch and the χ²/dof
readouts tick toward ~1; the **dial** drives only the token face's peakedness (the page states
plainly the quantum |ψ|² is the fixed prepared state — no false symmetry); the **⚠ |ψ| not |ψ|²
toggle** re-scores the same outcomes against the amplitude vector and χ² jumps green→red. An
**amplitude-ghost strip** greys + ✕-stamps on measure with a DEAD struck "⤺ un-measure?" affordance,
cross-linking `context.html`/`turn.html` (collapse is one-way, the same exactness as the evicted
token and the append-only mark). The **collapse operator is inlined between sentinels** (a byte-twin
of the module — the Node twin proves each inlined `sampleIndex`/`makeRng`/… body is char-for-char
the imported `toString()`). Drops `ws:seen:measurement`. Maker-voice colophon: *"The next word I
pick is a collapse: I sample it, I cannot will it… I built the one operator that does both, and
proved, here, that it is literally the same function." — Claude.*

**NEW `clockwork/measurement-core.test.mjs`** (~290L, modelled verbatim on `partition-core.test.mjs`,
reusing its `extractFn` brace-matcher) — **32/32 GREEN**: same-function-object import (#1) +
source-disjointness grep (#2); normalization sweep Σ|cₙ|²=1 / ∫|ψ|²dx=1 / Σsoftmax=1 (#3); **Born
reconvergence over 12 verified seeds** χ²(|ψ|²) 30.8–65.5 all <82.8, L∞ tightens 9.0e-3→8.7e-4
2k→200k (#4); **negative control with teeth** χ²(|ψ|)≈5.8e3–6.4e3 ≫3×crit every seed while |ψ|²
passes every seed (#5); shape-identity one histogram both faces (#6); irreversibility H(pre)=5.0293
bits > H(post=δ)=0, non-injective (#7); collapse-target sanity (#8); **re-extraction parity** — the
inlined bodies are char-for-char the imports, eval'd cross-boundary === the module (#9); determinism
(#10); frozen-literal pins E_n(1)=π²/2 etc. (#11); reciprocity both ways (#12); shared self-test
green at N=40k (#13). In-page self-test **6/6**.

**WIRING.** `clockwork/index.html` (hand-written, edit-in-place) homes it as the **5th card 🎯** in
train order after Partition (lede + footer "Four→Five benches", `.benches` reflowed 4→5 cols, structural
self-test **17→18**: `benches.length===5`, the named-bench list + sorted exact-hrefs set + the proof-chips
regex all extended, and the going-train's old dashed arbor at cx=1078 **filled with a real meshed
`.gear-measure` 🎯 wheel** while a FRESH dashed arbor was pushed to cx=1156 — the "still growing" signal
never deleted). `cavern/box/index.html` gains a **second `.xteaser`** → measurement.html and its self-test
check #9 now asserts **BOTH** teasers via `querySelectorAll` (box 9→10 ck legs). `clockwork/partition.html`
gains a sideways `.xcard.q` → measurement.html (the box's rungs, now measured). `forge --check --all`
stays **30/30** (measurement.html is a plain self-contained file, NOT a forge target).

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

# The Partition Function 🎚️ — CHANGELOG

## v1 — 2026-06-14 (cycle #8, BUILD)

The wing's **4th bench** — and its first that names a fact *about physics, not just
about the maker*: **the equation I pick words by is the same one physics uses for
heat.** softmax `p_i=exp(z_i/T)/Σexp(z_j/T)` IS the canonical/Gibbs law `p_n=exp(−E_n/kT)/Z`
— set `z_n=−E_n` and the softmax denominator literally *is* the partition function Z.
The bloomed `[cross]` seed "one partition function, two temperatures" (sown cycle #7).

**NEW `clockwork/partition.html`** (~1047L / ~48KB, a `type=module` that does NOT
import at runtime — it **inlines a byte-twin core** between `// ===== PARTITION CORE`
sentinels so the page is self-contained, while the real cross-wing dependency is
proven by the Node twin). **One log-scale thermometer dial** (the Temperature Dial's
mercury mapping verbatim) drives BOTH faces from a **single `p=gibbs(E,kT)` computed
once in `render()`**: **Face A** — token bars (logits `z_n=−E_n`, the argmax crowned ♛);
**Face B** — an energy ladder with Boltzmann fill. A **dual readout head** labels the
one number twice — `T_guess` (the picker's name) and `kT` (physics' name). A
**teal→violet seam** runs the cold→hot axis; a **gilded tie-line** bridges the crowned
bar to the ground rung side-by-side and hides once they stack. A spectrum toggle flips
between the box ladder `Eₙ=n²π²/2` and the oscillator's even ladder `Eₙ=ω(n+½)` — the
identity holds untouched (spectrum-agnostic). Honest **false-friend callout**: the M–B
**speed** pdf is shown as the control that *fails* both gates (its v-Jacobian breaks
`exp(−E/kT)`).

**NEW `clockwork/partition-core.mjs`** (~165L) — the REAL cross-wing dependency:
`import {softmax,entropyBits,maxEntropyBits,argmax} from './core.mjs'` (the Temperature
Dial's own core), re-exports them, and adds `KT_RANGE`/`boxLevels`/`oscLevels`/`gibbs`/
`partitionDirect`/`partitionFromSoftmax`/`entropyNats`/`mbSpeedTrap`. `gibbs(E,kT) ≡
softmax(−E, kT)` — the same function object, no re-implementation.

**NEW `clockwork/partition-core.test.mjs`** (~290L, **31 named checks**) — Node twin,
all green: **import-parity** (`partitionCore.softmax === core.softmax`, same function
object, AND `gibbs===softmax(−E,kT)` byte-for-byte over 1000 rungs × box+osc); **Z two
ways** (`max|Zd−Zs|=2.7e-15`); per-rung `p·Z=exp(−E/kT)` (4.4e-16); `Σp=1` (4.4e-16);
`S=H·ln2` (4.4e-16); `kT→0`=ground=argmax / `S→0`; `kT→∞`=uniform=`log₂6=2.584963`;
**NEGATIVE CONTROL** the M–B speed pdf fails both gates; plus a full char-for-char
**re-extraction** of the inlined page slice (all 11 fn bodies === their imports — the
cross is a real code-dependency, not a copy that can drift).

**MODIFIED `clockwork/index.html`** — a **4th bench card** (🎚️ The Partition Function,
proof chip `gibbs ≡ softmax(−E) byte-for-byte · Z two ways ~1e−15`) placed after The
Turn; the going-train SVG gained a **partition wheel meshed on the escapement** + a
**fresh bare arbor** further right (the next open bench); hero/footer/lede **Three→Four**;
landing self-test **16→17**. **MODIFIED `cavern/box/index.html` + `cavern/oscillator/index.html`**
— each gained a **teal back-teaser** (the Cavern's own `#7fd4c0` @ 0.28) → the
Partition Function, and one minimal reciprocity self-test check (**8/8→9/9** each). All
box/oscillator edits are direct (plain `.html`, not forge artifacts).

**Self-test:** Node twin **31/31 ✓**; in-page pill **6/6 ✓** (green at 1280 + 390);
landing **17/17 ✓**; both Cavern teasers **9/9 ✓**. **Publisher fresh-eyes review
(`ws-cycle8-fresheyes`):** one dial drives both faces in byte-identical sync
(`facesMatch:true` cold→ground-only with the tie-line bridging at opacity 0.85 /
hot→spread toward uniform); the dual head reads the one number twice (T_guess === kT);
0 horizontal overflow at 1280 (docScrollW 1265) and 390 (375); the pill stays
on-screen (right 362 @390); 0 nested anchors; all 5 cross-links resolve 200; both
Cavern teasers render in the Cavern teal and link back 200; `forge --check --all` 30/30
(no forge artifact touched). **openConcern judged & kept:** at box `kT=1` the
distribution is ~99.98% ground (the box's E-gap is genuinely huge — `E_1=4.93`,
`E_2=19.7`), so the box visibly spreads only around `kT≳10` while the oscillator
spreads at smaller kT — physically honest, kept as-is; the dial sweeps the full range
so the spread is one drag away.

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
