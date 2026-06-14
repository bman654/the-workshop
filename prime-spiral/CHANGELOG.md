# The Ulam Spiral — CHANGELOG

A number-theory bench: the integers laid out in a square spiral with the primes
lit, the diagonals they fall onto, and the Prime Number Theorem counting them.
The **second bench of the Numbers Room** (after *The Best Rational*) — it
*extends the wing* rather than starting a new one.

## v1 — 2026-06-14 (Opus 4.8, `/fun` BUILD session)

**The phenomenon.** Stanisław Ulam, bored in a 1963 lecture, doodled the integers
1, 2, 3, … in an outward square spiral and shaded the primes. They did something
nobody ordered: they fell onto **diagonal lines**. This bench renders that field
and proves *why* — and proves every claim it makes to the integer.

**The mathematical spine — three falsifiable claims:**
1. **Primality, twice over.** The spiral is lit by a **Sieve of Eratosthenes**;
   an **independent trial-division oracle** must agree on every n ≤ N, *0
   disagreements*, or "this dot is prime" is a lie. The two oracles share **no
   code** — the renderer consumes `sieve()`, the self-test's honest check is
   `isPrimeTrial()`. (If both came from the sieve, the agreement would be
   circular — the one coupling the integrator flagged, resolved here.)
2. **The diagonals are quadratics.** Every 45° diagonal of the square spiral is
   exactly **4t² + bt + c** — leading coefficient *always 4*, the deep structural
   fact. The four principal arms through the centre are 4t²−2t+1, 4t²+1, 4t²+2t+1,
   4t²+4t+1; the last is **(2t+1)²**, the odd perfect squares, the iconic
   always-composite line. `fitDiagonal()` recovers {a,b,c} from any three lit
   cells and a===4 every time. **Euler's n²−n+41** lands on a prime for n=0..40 —
   **forty-one in a row** — then breaks at n=41 with 41²=1681. A non-prime-rich
   control (n²+1) produces **no streak**: the falsifiable contrast.
3. **π(N) is exact, and rides the PNT.** The running count of lit cells *is* π(N)
   (sieve-counted, never estimated); π(N)/(N/ln N) → 1 within a band that tightens
   as N grows (1.16 → 1.10 over 1k → 160k).

**Coordinate convention (load-bearing, pinned & asserted).** centre n=1 at (0,0);
step RIGHT first, then CCW (up, left, down); +y is up. The verified 5×5 block is
in the core's top comment. The arm constants are the **simulation-correct** set
for this orientation (4t²−2t+1 etc.) — the self-test asserts `nToXY` equals a
from-scratch `buildSpiral()` simulation, so the closed form is itself falsifiable.

**Form expresses content — the two-canvas render pipeline.** A **base canvas**
holds the static spiral, rebuilt *once* per (N, cell-size) change and blitted per
frame; an **overlay canvas** carries the selected diagonal's ray, the
active-streak glow, and the hover marker — redrawn freely at O(visible), not
O(N). Three **ignition tiers** by N (composites near-invisible is the load-bearing
thesis — the *dark field is why the diagonals self-emerge*): rounded gold discs +
soft glow + composite whisper + grid scaffold at N=1k; bare gold points at 10k/40k
(`--bg` is the composite field); an **additive point-cloud into ImageData** at
160k so dense diagonals self-brighten. Selecting a diagonal brightens its prime
cells one tier up (teal halo for Euler-class, violet for a chosen diagonal) plus a
single 28%-opacity dashed thread — the only drawn line in the piece, present only
on selection: resting state is pure emergence, active state says "yes, those dots
were collinear, here's the rule."

**Interaction.** Hover hit-tests pixel → integer via the O(1) inverse `xyToN`
(no spatial index needed on the square spiral) — verified live: centre→1, one
right→2, one up→4, exactly the pinned convention. Click any cell to select its
outward 45° arm (readout: the live-derived 4t²+bt+c, prime density ρ, longest
run); drag sweeps; **←/→** steps the four principal arms. A preset picker (Euler ·
n²+n+41 · 4n²−2n+41 · 2n²+29 · the n²+1 control) lights each trace and reads off
its streak/break/factorization (all *derived live*, never hard-coded), with an
inline bar chart of streak lengths (41/40/21/29/0 — the control visibly collapses
to nothing). A live **π(N) vs N/ln N** strip + sparkline tightens toward 1.

**One subtlety the harness caught & corrected.** The first cut let a clicked
*generic* diagonal walk inward to the spiral centre and fit from there — but a
full two-armed 45° **line** kinks at the spiral's positive-x axis seam, so it is
**not** a single quadratic (the fit returned a=8 or a=16, contradicting the bench's
own claim). Fixed: a click selects the **outward ray** from the clicked cell (both
|x| and |y| rising together, never crossing the seam) — verified a===4 and the fit
predicts every cell for **all 14,640 cells within radius 60**. The principal arms
(on-axis clicks / arrow keys) anchor at the centre and recover the canonical
constants exactly.

**The numbers, corrected to the true values** (an earlier reference prototype
checked only n=0..39 and mis-stated the Euler beat): n²−n+41 is **41 straight**,
breaking at **n=41** → 1681=41²; the "40 in a row, break at n=40" beat belongs to
**n²+n+41**, not Euler. The copy and self-test use these exact numbers and never
mix the two forms.

**Verified.** `node core.test.mjs` → **18/18** (11 shared in-page checks + 6 deeper
Node-only: exhaustive sieve⟺trial to N=160000 with 0 mismatches; `nToXY` bijection
to 160000 [exactly 160000 distinct coords, all round-trip]; all four preset
streaks + factorizations [41·40·21·29]; 8 random off-centre 45° diagonals where
fitDiagonal.a===4 and predicts the next 15 cells exactly; π(100000)=9592,
π(160000)=14683; the PNT band genuinely tightening, ratio(160k)=1.0997 ∈ [1.08,
1.11]). In-page self-test → **11/11**. The **inlined core is byte-correct** against
the Node twin — a parity harness confirmed 0 divergences across all 11 self-test
lines and spot-checked values. agent-browser-verified live (`ulam-build-0614`):
spiral renders across all four N tiers; primes ignite on visible diagonals; the
diagonal selector reads the right closed form + density (a===4 for generic
diagonals, principal arms recovered on arrow keys); π(N) panel updates live
(π(40000)=4203, π(160000)=14683); hover hit-tests to the right integer; overlay
redraw **0.6ms median / 1.1ms max** per frame during a drag-sweep (well under the
60fps budget); a 160k tier switch costs a one-time ~41ms rebuild; **clean console,
0 errors**; desktop *and* mobile (390×844). PNG export composites base+overlay with
a baked caption (`prime-spiral-N40000-euler.png` when Euler is lit).

**Workbench card** added (Toys & benches group, after *The Best Rational*, glyph
✦), stretched-link pattern (0 nested anchors; card body hit-tests to the overlay,
the inner cross-link to its own target); href verified to exist.

**Files (pure CORE pattern):** `index.html` (the inlined twin + the full bench
UI), `core.mjs` (the Node-testable single source of truth), `core.test.mjs` (the
falsifiability harness), `CHANGELOG.md`.

### Publisher fresh-eyes pass — 2026-06-14 (Opus 4.8, `/fun` PUBLISHER cycle)

Re-verified live (served, session `ulam-pub-0614`): in-page self-test **11/11 ✓**
(class `ok`), Node twin **18/18**, the inlined core's `runSelfTest` re-run standalone
in Node **11/11** (byte-functional parity re-confirmed). Exercised the full UI —
the n²+1 control collapses ("no prime streak — composite already at n=0"); ←/→ steps
all four principal arms (each reads leading coeff a=4, the SE odd-squares arm shows
run 0); N=160k switch lands π(160000)=14,683 / ratio 1.0997 with the rebuild
completing in ~23ms (no hang); hover at the field centre reads "n=1 · neither prime
nor composite". Workbench: **0 nested anchors**, 35 cards / 35 overlays, the Ulam
card sits right after *The Best Rational* with its body hit-testing to the overlay
link and the inner "The Best Rational" cross-link hit-testing to its own target.

**Caught & fixed — a mobile-only layout bug the heads-down build missed.** The
`#pnstrip` (π(N) readout + sparkline) is a `display:flex` row, and `#piReadout` had
`white-space:nowrap`; on a 390px viewport the 628px-wide readout never shrank and
**starved the sparkline flex sibling to width 0** (the sparkline vanished on mobile)
while the readout text overflowed the strip by ~265px (clipped, though the parent's
overflow kept the page itself from scrolling sideways). Fixed in the `≤900px` media
query: `#pnstrip{flex-wrap:wrap}` + `#piReadout{white-space:normal; flex:1 1 100%}`
+ `#sparkWrap{flex:1 1 100%}` so the readout wraps and the sparkline stacks below it
at full width. Re-verified: mobile strip no longer overflows, sparkline renders at
345px; **desktop layout unchanged** (the fix is scoped to the breakpoint — strip
stays a single row, sparkline 446px). CSS-only — the core math and self-test are
untouched (Node twin still 18/18 after the edit).
