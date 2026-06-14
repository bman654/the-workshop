# 🫘 Galton Board — build spec

*A live **bean machine** (quincunx): balls cascade down a triangular array of pegs, bouncing
left/right at each row, and pile into bins that grow into a **bell curve**. Overlaid on the running
tally is the **exact theoretical binomial PMF** — the bars rise to meet it as balls accumulate. Adjust
the number of rows (4–16), the **left-probability `p`** (a biased board → a skewed binomial), the drop
speed, reseed, toggle a normal-approximation overlay, switch palette-only skins, pause, clear, and
export a 2× PNG. The workshop's signature: a built-in self-test that **proves** the ideal is exactly
binomial and that a large seeded run is statistically consistent with it.*

Folder: `galton/`. Forge page: `galton/index.src.html` → `galton/index.html` (no network, no deps).
DOM-free core: `tools/galton/galton.js`. Node self-test: `tools/galton/galton.test.cjs`.
Build log: `galton/CHANGELOG.md`.

> **Audio (added 2026-06-13, the Sound Garden crossing).** A `♪ Listen` toggle voices the pour —
> each landing ball plucks a note whose **pitch is its bin** (`binToPitch`, a strictly-monotonic
> **bijection** bin↔Hz over a minor-pentatonic), each peg bounce a soft tick (`pegClickHz`). Because
> the map is a bijection, the histogram of the pitches you *hear* IS the bin histogram → the
> note-density across pitch is the binomial PMF: **the bell curve, heard**, thickening at the centre
> where most balls land. The mapping is pure CORE (`binToPitch` / `pegClickHz` / `voiceGainFor` /
> `pitchProfile`), re-audited headless by the self-test (now **9 checks**, four of them audio); the
> page only renders it through Web Audio (lazy graph in a user gesture, compressor + headroom-safe
> master gain → no clip, polyphony cap, honors the shared `ws:pref:muted` estate key). The
> instant-tally path stays **silent** (you can't hear 10k instant balls — the animated drops are the
> audible ones). See §1 (the SONIFICATION block) and the CHANGELOG.

> **A new genre for the estate.** The workshop had nothing on probability/statistics. The Strange
> Garden's emergent specimens (Game of Life, Kuramoto, L-systems) are *deterministic dynamical
> systems*; the Galton board is the opposite — it *samples a probability distribution* and shows the
> Law of Large Numbers turning randomness into a precise, predictable shape. Different mathematics,
> different claim.

---

## §0 — The crux (the load-bearing claim)

A Galton board drops a ball through `rows` rows of pegs. At each row the ball goes **left** with
probability `p` and **right** with probability `q = 1 − p`, independently. The ball's final **bin** is
**exactly its number of right-bounces**. A sum of `rows` independent Bernoulli(`q`) trials *is*, by
definition, a **Binomial(`rows`, `q`)** random variable:

```
P(bin = k) = C(rows, k) · q^k · p^(rows−k),   k = 0 … rows
```

So the claim splits cleanly into an **exact identity** and a **statistical convergence** — and we are
honest about which is which:

**1. The IDEAL is exactly binomial (an exact identity).** `binomialPMF(rows, p)` returns that closed
form, built from **log-factorials / log-binomials** (a Lanczos log-gamma) so the coefficients never
overflow for the full row range. It is exact to floating point:
- it **sums to 1** (error ≤ ~1e-12, in practice ~1e-15);
- its **mean is `rows·q`** and its **variance is `rows·p·q`** (error ≤ ~1e-9, in practice ~1e-13);
- the symmetric small case `rows=4, p=0.5` is **Pascal's row `1, 4, 6, 4, 1` over 16**, matched to
  1e-15; `choose(n,k)` reproduces Pascal's triangle integer-exactly for the board range.

**2. The SIMULATION converges to it (a statistical claim — stated as such).** `simulate(seed, rows,
p, n)` runs `n` balls through a **seeded mulberry32** stream (no `Math.random`, no wall-clock) and
builds an empirical histogram. We measure agreement with a **χ² goodness-of-fit** statistic against
the exact PMF, with degrees of freedom = (number of testable bins) − 1 (no fitted parameters — `rows`
and `p` are given, not estimated). A large run (≥ 100k balls) **does not reject** the binomial at a
stated significance: the χ² statistic falls below the critical value, i.e. the p-value is not tiny.
This is verified at `p = 0.5` **and** at biased `p`. This is *not* an exact identity — a finite run
fluctuates — so we phrase it as "consistent with the binomial," never "equal to."

That the χ² test has *teeth* is part of the proof: the Node test feeds it a deliberately-wrong (flat)
histogram and confirms it **is** rejected, and calibrates the χ² CDF against published table quantiles
(e.g. χ²₀.₉₅ at df=10 is 18.307) to ≤ 0.02.

**3. Every path is valid (an exact identity).** Each ball makes **exactly `rows`** ±1 steps; its bin
== its count of `+1` (right) steps and lands in **one** bin ∈ `[0, rows]`; the histogram conserves
every ball (`Σ hist == N`).

**4. Determinism.** The same `(seed, rows, p, N)` produces an **identical per-ball path sequence and
identical histogram** across runs; distinct seeds (almost surely) differ.

**5. Empirical moments track the theory, tightening with N.** The run's mean and variance approach
`rows·q` and `rows·p·q`, and a 200k run's error is no worse than a 2k run's — the Law of Large
Numbers, made measurable.

The in-page green chip (`galton verified — N/N ✓`) runs the **identical** `Galton.runSelfTest()`
battery the Node test runs, so the browser proof and the headless proof are the same code path.

---

## §1 — The core (`tools/galton/galton.js`, DOM-free, dual-use)

| Export | What it is |
| --- | --- |
| `ROWS_MIN`, `ROWS_MAX`, `clampRows`, `clampP` | the UI row range (4–16) and input guards |
| `makeRng(seed)` | xmur3 → mulberry32 seeded `[0,1)` stream (no `Math.random`/`Date`) |
| `logFactorial`, `logChoose`, `choose` | log-space factorials/binomials (Lanczos log-gamma); exact small `choose` |
| `binomialPMF(rows, p)` | **the exact PMF** `[P(0)…P(rows)]`, `P(k)=C(rows,k) q^k p^(rows−k)`, `q=1−p` |
| `binomialMean`, `binomialVar` | `rows·q`, `rows·p·q` |
| `normalPDF`, `normalApprox(rows,p)` | the continuous `N(μ=rows·q, σ²=rows·p·q)` overlay (not a discrete PMF) |
| `dropBall(rng, rows, p)` | one ball → `{ bin, steps }` (`steps` are ±1; `bin` = #rights) |
| `simulate(seed, rows, p, n[, opts])` | a seeded run → `{ hist, n, rows, p, mean, variance, paths? }` |
| `chiSquare(hist, pmf)` | `{ stat, df, n }` goodness-of-fit (drops theoretical-zero cells) |
| `gammaP`, `chiSquareCDF`, `chiSquarePValue`, `chiSquareCritical` | the χ² distribution (regularized incomplete gamma) |
| `binToPitch`, `pegClickHz`, `voiceGainFor`, `pitchProfile`, `PENTATONIC`, `AUDIO_ROOT_HZ`, `pentatonicSemitone` | **SONIFICATION** — bin→Hz bijection, peg-tick pitch, headroom-safe master gain, expected note-density profile (DOM-free, Web-Audio-free) |
| `runSelfTest()` | the **9-check** battery the in-page chip runs (5 probability + 4 audio; mirrored by the Node test) |

Conventions: a ball goes **left** with `p` (the slider's "left-probability"), **right** with `q=1−p`;
**bin = right-count**, so the distribution is `Binomial(rows, q)`. Raising `p` skews the pile toward
**bin 0** (the left), and the amber overlay follows exactly. Dual-use IIFE: attaches a `Galton` global
and ends with the byte-identical module guard (`if (typeof module !== 'undefined' && module.exports) {
module.exports = Galton; }`) so the same file inlines into the page (forge strips the guard) and
`require()`s into the Node test.

---

## §2 — The page (`galton/index.src.html` → `index.html`)

Dark-aesthetic, single-file, zero-dependency. A canvas board: a hopper, a triangular peg field, and a
row of bins below. Balls (pulled from the same seeded stream the core uses) animate down the polyline
of pegs and drop into bins; bars grow as fractions and share a y-scale with the **binomial PMF**
overlay (amber) and an optional **normal** overlay (violet). Reduced-motion and large drops (`>2000`)
tally instantly from the stream (order-identical to the animated path) so the result is unchanged.

Controls: **rows** (4–16), **left-probability `p`** (0.05–0.95), **drop speed**, **seed + reseed
die**, **+100 / +1,000 / +10,000 balls**, **show-normal toggle**, **3 palette-only skins** (slate ·
ember · moss — geometry-identical), **pause**, **clear**, **2× PNG export**, and a `← workshop`
back-link. A live stats line shows count, empirical mean & σ (with the theory in parentheses), and the
**χ²(df)** statistic + a verdict driven by its **p-value**. A `♪ Listen` toggle (top bar, beside the chip)
voices the pour through Web Audio — see the audio callout above. Forge-includes
`../tools/galton/galton.js` + `../tools/ws/ws.js`; drops `ws:seen:galton`.

---

## §3 — Verification

- `node tools/galton/galton.test.cjs` → **16/16 PASS**, exit 0 (9 shared-core checks [5 probability + 4 audio] + 7 hardening),
  including the χ² evidence table (four ≥100k runs, fair + biased, all do-not-reject at α=0.01) and a
  power check (a wrong/flat histogram **is** rejected). Runtime ~0.25 s.
- `node tools/forge/forge.mjs galton/index.src.html` clean; `node tools/forge/forge.mjs --check --all`
  green.
- Real-browser pass on a live origin (see CHANGELOG / commit): chip matches the Node count; balls
  pile into a bell curve that meets the binomial overlay; the `p` slider skews the distribution and
  the overlay follows; more rows → smoother curve; reseed changes the run; `ws:seen:galton` set;
  reduced-motion stills the animation while still tallying; 0 console errors.
