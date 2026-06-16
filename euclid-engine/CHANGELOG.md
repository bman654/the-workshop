# The Measuring Bench — CHANGELOG

The **sixth bench of the Numbers Room** (after The Best Rational ⅗, The Ulam Spiral ✦,
The Collatz Bench 🌳, The Times-Table Cardioid ♥ and The Latin Square ▦) — the Euclidean
algorithm enacted as **anthyphairesis**: lay the short rod on the long, cut off its length,
and the last whole rod standing **is** the GCD. A self-contained, zero-dependency exhibit:
`index.html` + `core.mjs` + `core.test.mjs`. Lives at the repo root (`euclid-engine/`), a
sibling of the other benches; the Numbers Room landing links it as `../euclid-engine/index.html`.

## v1 — 2026-06-15 (Opus 4.8 · cycle #55 builder, reviewed & published by the cycle-#55 publisher)

**What it is.** Two notched rods on a graduated rail — a gold long rod (a) and a teal short
rod (b, "drag me →"). Cover the dashed cut line with the short rod and release: it cuts off
its own length from the long extent, again and again, racing down to where one rod measures
the other **exactly**. That final whole rod **is** gcd(a, b), and the violet unit-rod then
**tiles both originals with no gap** ("48 = 4×12 · 36 = 3×12"). The greatest common divisor
is not a chart of remainders — it is a thing your hands do.

**Number theory as a thing you cut, not a chart.** The GCD picture is the oldest algorithm
still in daily use (Euclid wrote it ~300 BCE). The bench shows the *picture* Euclid drew —
subtraction of lengths — not its plotted remainder sequence:
- Each cut-count is a term of the **continued fraction** of a/b — the CF assembles itself as
  you cut (48/36 → [1; 3] → 4/3).
- **Bézout** (a·x + b·y = gcd) falls out of the **same trace** — read straight off, never a
  second computation (1071·(−3) + 462·7 = 21).
- The tiling reveals the **factorization** of both originals by the common measure.

### The core (`core.mjs` — the single source of truth, 104 lines)
- `mulberry32(seed)` — deterministic seed-pure generation for the random-pair button.
- `gcdTrace(a, b)` — the full subtraction/division trace (steps, quotients, remainders, gcd).
- `cfExpand(a, b)` — the continued-fraction terms (the quotients of the trace).
- `extendedFromTrace(...)` — extended Euclid: x, y with a·x + b·y = gcd, off the same trace.
- `gcdRef(a, b)` — an **independent second oracle** (plain Euclid) the test cross-checks against.
- `par(a, b)` = `gcdTrace(a, b).steps.length` — the structural step count (the test invariant).

The core is inlined **byte-identical** into `index.html` between `// === CORE BEGIN/END ===`
sentinels; the page reads gcd / CF / Bézout / tiling from core, never recomputing.

### Verification
- **Node twin** `core.test.mjs` → **14/14 GREEN exit 0** over 2500 random pairs: g divides
  both a, b AND every common divisor divides g (brute force, both directions) AND
  `trace.gcd === gcdRef(a,b)` AND a third brute-force oracle; CF terms === trace quotients and
  reconstruct (a/g)/(b/g) exactly; a·x + b·y === g off the same trace; `par()` === trace step
  count; **negative control** — every coprime pair (1555/1555) ends at unit rod 1; hand anchors
  48/36→12, 1071/462→21, 240/46→2; and **byte-twin parity** — the inlined CORE region of
  `index.html` === `core.mjs` char-for-char.
- **In-page pill** — `self-test 10/10 ✓` (`window.__euclidSelfTest`) at @1280 and @390.
- **Score spine** — the on-page **par = sum of quotients** (fewest cuts); ★★★ when the cut
  count equals par; per-pair best kept in localStorage. (`par()` in CORE is the step count, the
  structural invariant asserted by the test; the on-page par is the game-honest fewest-cuts.)
- **Reduced motion** — on boot a `prefers-reduced-motion` reader resolves the hand and renders
  ONE correct static won frame (full trace, CF, gcd, Bézout, completed tiling) with no rAF.
- **Hard mode** — hides the CF/trace numbers; you measure by eye.

### Registered
- The Numbers Room landing (`numbers-room/index.html`) gained the 6th card (⊥ glyph,
  `href="../euclid-engine/index.html"`), grid bumped to `repeat(3, 1fr)` for a clean 3×2,
  hero/footer updated to "Six benches… Five prove a theorem exactly", landing self-test 13→14.
- The front-door estate map (`index.src.html` → forged `index.html`) blurb for the Numbers Room
  updated from "Three benches… Two prove a theorem exactly" to "Six benches… Five exact"
  (it had lagged behind Latin Square #38 and the Cardioid too).

Provenance: this CHANGELOG + the cycle #55 worklog (`worklog/2026-06.md`).
