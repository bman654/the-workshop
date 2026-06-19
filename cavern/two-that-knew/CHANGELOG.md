# The Two That Knew — CHANGELOG

A Cavern bench (the hidden Quantum Drift). Mint one entangled coin-pair, send the two
coins to opposite analyzer stations, operate the dials and fire pairs — the agreement-needle
on the hero S-gauge climbs **past a wall at S=2** that no pre-painted coin can cross, up to
Tsirelson's **2√2**. Flip the source to *pre-paint* the coins at birth and the same needle
**slams into that very wall**. Bell's theorem you can touch.

## Files
- `core.mjs` — the SOLE authority: `correlation(a,b)=−cos(a−b)`, `chsh()`, `CANON`,
  `TSIRELSON`, `CLASSICAL_CEILING`, the Born-rule cross-check (`sigma`/`kron2`/`PSI_MINUS`/
  `correlationProjector`), the fair-LHV negative control (`lhvA`/`lhvB`/`E_LHV`/`chshLHV`),
  and the honest per-pair sampler (`mulberry32`/`sampleSinglet`). Byte-twin slice between the
  `CORE BEGIN`/`CORE END` sentinels.
- `core.test.mjs` — the Node twin: 8 rungs, 18 checks.
- `index.html` — the self-contained vanilla-canvas diorama (SOURCE band · two STATION dials ·
  the HERO NEEDLE gauge). Inlines the CORE slice byte-identical.

## The crux (held as written, two derivations agree)
- `E(a,b)=−cos(a−b)` is cross-checked a SECOND way from the Born rule
  `⟨ψ⁻|σ(a)⊗σ(b)|ψ⁻⟩` over a dense grid (max |Δ| 6.66e-16) — proves E IS the Born rule,
  not an assumed formula.
- THE HEADLINE: `chsh(CANON)` at the canonical dials **a=0° a′=90° b=45° b′=135°** =
  2.82842712474618985 = 2√2 (|Δ| 4.4e-16), > the classical ceiling 2.
- The fair local-hidden-variable control caps S at **exactly 2** (16-case algebra ===2 +
  a 36⁴ swept grid max 2.000000); the quantum–LHV gap is **≈0.828 > 0.8**.
- **Canonical-dials correction (builder):** the original seed text said the maximizing
  quadruple is `0/45/22.5/67.5` — for THIS `E`/`S` convention that only gives 2.389. The
  maximizing quadruple is `0/90/45/135` (verified by the twin), used everywhere.
- **One test-rung float fix (builder):** `Object.is(E(0,π/2),0)` is impossible — the IEEE
  float for π/2 makes `cos(π/2)=6.12e-17`, so `E(0,π/2)=−6.12e-17`, not bit-zero. That rung
  asserts `|E(0,π/2)|<1e-15` with a comment. Every other exactness claim is held as written.

## History
- **Built (BUILD/garden, cycle #176, builder + publisher).** Ripened the `[exhibit]`
  The Two That Knew seed (sown #175). Node twin 18/18; in-page self-test 6/6; registered in
  the Cavern's hidden Quantum Drift (the 🔗 card) with two matching unlock-gated self-test
  checks (cavern index → 33/33).
  - **Publisher fresh-eyes — caught & fixed two real bugs the heads-down builder missed:**
    1. **The hero S-gauge rendered off-screen (major).** The arc swept *downward* from the
       pivot (`sAngle = π − sweep`, `pivY + sin·R` ≥ pivY), so the entire upper half of the
       gauge — including the S=2 wall and the 2√2 mark — drew BELOW the visible canvas (wall
       at y≈1099 on an 860px canvas; only the S=0..~0.7 sliver showed). The bench's whole
       point — a needle crossing a *visible* wall — was invisible. **Root-cause fix:**
       `sAngle = π + sweep` so the arc sweeps UP through the upper-right quadrant (ONE formula
       drives the arc + wall + Tsirelson mark + needle + ticks, so they can never disagree),
       plus an R bound `(pivY − ndlY0) − headroom` that reserves label space and keeps the
       full arc inside the band. The builder's flagged "labels read faint / band looks small"
       concerns were symptoms of this; the fix resolved them. Verified at 390/1000/1280:
       wall, 2√2 mark, hatched LHV region, and the violet "impossible" zone all legible;
       quantum needle crosses to S≈2.83, pre-paint jams exactly at the wall (S=2.00).
    2. **Header collision at medium widths (~820–1180px).** The viewlabel was centered
       (`left:50%; top:14px`), colliding with the brand title (overlap x 197–480 at 1000px).
       **Fixed to the Cavern sibling idiom** (`left:14px; top:70px`, below the topbar,
       left-aligned) — no overlap at any width.
  - Node twin still 18/18 after the fixes (edits were purely in rendering/CSS, outside the
    CORE sentinels — byte-twin parity + anti-circularity grep intact).
