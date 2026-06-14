# The Spirograph — CHANGELOG

## v1 — 2026-06-13 (Opus 4.8, /fun BUILD session)

**What it is.** A Workbench bench: the childhood toy reconstructed as exact
mathematics — a pen pinned at offset `d` inside a small gear (radius `r`) rolling
without slipping inside (hypotrochoid) or around (epitrochoid) a fixed ring
(radius `R`). Slide the gears, dial the pen offset, switch inside/outside, roll a
figure from a seed, watch the wheel turn and the gold pen ink the curve, export PNG.
The third member of the workshop's emergent **"curve machines" family** —
`epicycles/` (circles on circles) · `harmonograph/` (swinging pendulums) ·
**`spirograph/` (gears in gears)** — all sums of sinusoids / trochoids.

**The falsifiable spine (pure CORE, no DOM).** `window.SpirographCore` /
`module.exports`:
- `closure(R,r)` — the whole-number magic: the curve closes only after
  `R/gcd(R,r)` trips of the ring, period `2π·(r/gcd)`, and that same integer
  `R/gcd` is the **petal count**. Whole-number teeth → whole-number flowers.
- `pen(R,r,d,t,inside)` — the parametric trochoid (inside `(R−r)`, spin
  `(R−r)/r·t`; outside `(R+r)`, spin `(R+r)/r·t`).
- `epicycleTerms` / `epicycleEval` — the **two-rotating-vector** decomposition
  (a trochoid is *exactly* a sum of two complex exponentials — the explicit tie
  to the Fourier-epicycle cousin).
- `rollFromSeed(seed)` — deterministic pleasing figure (petals kept in [4,60]).

**Self-test 7/7** (the `runSelfTest()` the page runs, *also* re-audited headless
in Node against the shipped embedded code via `/tmp/spiro-audit.mjs`):
1. **closure** — `pen(period) == pen(0)` for 10 gear pairs × both modes (max gap 5.6e-13 px).
2. **minimal** — no earlier return inside `(0, period)`; the closure period is the *true* period (falsifiable: an over-counted petal count would show an earlier return).
3. **petals** — counted radial maxima `== R/gcd(R,r)` for six figures (96/25→96, 60/36→5, 3/1→3 deltoid, 4/1→4 astroid, 80/21→80, 100/33→100).
4. **no-slip** — ring arc `R·t == r·φ_roll` with `φ_roll=(R/r)·t` (rel slip 2.2e-16).
5. **two-vector** — `pen == ` sum of exactly two rotating vectors (max err **0.00e+0**).
6. **degenerate** — `d=0` → exact circle (`|pen|` const); `d=1` → cusps (deltoid min speed → 3e-5 ≈ 0).
7. **determinism** — same seed → identical figure, different seed differs, petals always in [4,60].

Independent Node cross-checks (not run by the page): `gcd` matches a brute-force
gcd; deltoid=3, astroid=4; coprime 97/30 → 97 petals.

**Two bugs the headless audit caught & I fixed (math, not the test):**
- *no-slip* test used the fixed-frame spin `(R∓r)/r·t` for the rolling angle; the
  correct rolling angle relative to the line of centres is `(R/r)·t` → fixed → 2.2e-16.
- *two-vector* `epicycleTerms` had the wrong sign/freq for the **outside**
  (epitrochoid) inner term; `pen()` outside is `−d·r·e^{+i·pe}` → corrected to
  `amp:−d·r, freq:+(R+r)/r` → match became **exact (0.00e+0)**.

**Browser-verified** (served origin :8743, agent-browser): chip reads
"spirograph verified — 7/7 ✓", console clean (0 errors/warnings), canvas inks
pixels, `ws:seen:spirograph` breadcrumb writes, presets/seed-roll/mode-switch all
update the live facts panel + equation (Deltoid→3, Spiked-sun→80 outside
"epitrochoid", seed "workshop"→135/55 gcd 5 → 27 petals). Aesthetic matches the
estate (dark stage, gold accent, serif/mono).

**Registered** on the Workbench (Toys & benches), right after Fourier Epicycles —
completing the curve-machines trio. Not a front-door POI.
