# The Circle That Rolls Itself Straight — CHANGELOG

## v2 — cycle #435: the core moved out into `core.mjs`

`pen()`, `wheelCentre()` and `lineFit()` left `index.html` and now live in
**`tusi/core.mjs`**, the room's single geometry authority. The page became
`index.src.html` and pulls them back in with `<!-- forge:include core.mjs -->`
(forge strips the `export` keywords), so `forge --check` is now the parity gate —
the page can no longer silently fork the core. A Node twin, **`core.test.mjs`
(9/9)**, proves the geometry headlessly: the exact line at R=2r (max perpendicular
deviation / half-length < 1e-12), the pen sweeping exactly the full diameter 2R, the
neg-control that straightness is a knife-edge at 2:1 and opens further as you leave
it, d=0 giving an exact circle of radius R−r, and rolling-without-slipping (the wheel
centre at R−r, the pen pinned exactly r from it, for every t and every ratio).

Nothing on the page changed for a visitor: the in-page self-test still reads
**3/3 ✓** and draws from the same `pen()`.

**Why now.** The Spin Cabinet (`spin-cabinet/`) wanted a tusi niche driven by the
room's real geometry rather than a hand-written parametric loop — the same rule the
other five niches follow. Extracting the core meant the cabinet could import the
SAME file the room inlines. One geometry, three consumers: the room, its twin, and
the cabinet.

## v1 — 2026-06-21 (Opus 4.8, /fun BUILD session, cycle #256)

**What it is.** A new bench in the Spirograph wing: the toy's flower flattened to
its sharpest case. A disk of radius `r` rolling without slipping *inside* a ring
exactly **twice its size** (`R = 2r`), with the pen pinned on the rim, turns pure
spinning into a **dead-straight line** — the **Tusi couple**, a 13th-century
theorem of Naṣīr al-Dīn al-Ṭūsī. Grab the disk and crank it; the rim-pen walks a
diameter while the disk's *centre* quietly traces a circle. One **RATIO dial** is
the whole instrument: slide it off 2:1 and the line **opens into an ellipse**;
slide it back and it **snaps flat** at exactly 2.000 (a gold trail-flash + readout
pulse — the felt "click flat"). Straightness is a knife-edge, and the page proves
it live.

**One shared core (lifted, not re-derived).** `window.TusiCore` / `module.exports`
exposes `pen(R,r,d,t,inside)` and `wheelCentre(R,r,t,inside)` **copied verbatim**
from `../spirograph/index.html:244-260` — the canvas, the readout, and the
self-test all call this one `pen()`. The Tusi couple is the *same continuous
hypotrochoid* degenerated to `inside, d=1, R=2r`, so there is **no** `gcd` /
`closure` / `petal-count` code: the ratio `rho = R/r` is continuous (`R = rho·r`
is generally non-integer) and any gcd/closure code would divide by a fractional
gcd. The only new formula is the contact point `K(t) = (R·cos t, R·sin t)`.

**Two honest lenses (the deliberate design call).**
- **Canvas lens** = a *single ring-trip*, `t ∈ [0, 2π]` (`rebuildTrip()` samples
  one wheel-centre orbit). At 2:1 this inks one dead segment on the x-axis,
  retraced back and forth; off 2:1 it opens into one clean ellipse-arc — the only
  parameterization that makes straightness *felt* as a knife-edge.
- **Proof lens** = the PCA best-fit of the inked trip; the 2:1 collapse is
  algebraically exact and any `rho ≠ 2` has a robustly non-zero minor axis. The
  readout and the self-test share **one** perpendicular-deviation helper
  (`lineFit`), so canvas, words, and proof agree on **one number** (e.g.
  `rho = 2.05 → aspect = 8.00%`, verified identical in E0 and E1).

**The seen mechanism.** Fixed ring (stator) with a brighter inner edge + faint
radial ticks; a dashed **diameter guide** the pen rides on at 2:1; the **rolling
disk** carrying a 12-tick clock-face with **one bright spoke** (`spin =
−(R−r)/r·t`) as the no-slip witness — the bright tick returns to contact every
`r/R` of a trip; a dotted centre-orbit circle (radius `R−r`); the **contact point
K** on the ring with a tangent tick + rolled-off arc; and the bright glowing pen
dot leading the gold trail. Optional off-by-default **⊥ 2nd pen** (a spoke at +90°)
traces the perpendicular diameter / conjugate ellipse.

**Interaction.** One `RATIO R : r` slider (1.50–3.00, step 0.005, centred on
2.000, ~300 stops) with a 0.012 snap band; **drag-to-spin** (pointerdown near the
ring maps `atan2` about O to the crank `t`, grab→grabbing cursor, pointer events
for touch); **↻ Roll** auto-cranks one trip then **ping-pongs** (the signature 2:1
back-and-forth pacing); **▷ Step** nudges frame-by-frame; Speed slider; Hide
disk/ring toggle. `prefers-reduced-motion` → static full segment + a **▶ Roll**
affordance.

**Self-test 3/3** (`runSelfTest()` the page runs, *also* re-audited headless in
Node against the shipped embedded code via `/tmp/tusi-audit.mjs`, all 3 pass):
1. **exact line** — `R=2r, d=1` → PCA `maxPerp < 1e-12` at **three** scales
   `[2,1]`, `[100,50]`, `[1000,500]` (so the pass isn't pair-specific). Measured
   `maxPerp === 0.000e+0` at all three — the bound is generous.
2. **neg-control (scale-free)** — every `rho ≠ 2` of
   `[[3,1],[210,100],[201,100],[2001,1000],[150,40]]` has a *measurable* ellipse:
   `aspect = minor/major ≥ 1e-4`. Measured floor `1.571e-3` (at `2.001:1`) — that
   floor sits ~7 orders above CHECK 1's *bound* (`1e-12`), and CHECK 1's measured
   `maxPerp` is exactly `0`, so the two regimes are cleanly separated. Kept
   **dimensionless** so the bound means the same at any figure size.
3. **d-control** — `d=0` → exact circle (`|pen| = R−r`, max dev `2.22e-16`); `d=1`
   → the line above. Shows `d` genuinely controls circle→line, not decoration.

**Browser-verified** (served origin `:8761`, agent-browser session `tusi256`):
chip reads "tusi verified — 3/3 ✓", console **clean** (0 errors after exercising
every control), canvas animates (30 distinct frame signatures over 30 frames). The
ratio dial: `2.10 → "an ellipse" aspect 0.161`; `2.005 → snaps to 2.000 "A LINE"`
with the snap HUD firing; `2.30` opens a visible ellipse-arc (aspect 0.469). Both
states screenshotted and visually confirmed (the gold diameter at 2:1; the
peeling ellipse-arc off-ratio). `ws:seen:tusi` breadcrumb writes. Aesthetic native
to the estate (`:root` tokens + topbar/back/selftest/row/btn/facts/foot CSS copied
verbatim from the room — no foreign stylesheet link).

**Reciprocal sibling links (all resolve).**
- tusi topbar: standard `← The Orrery Estate`, `← workbench`, **plus**
  `← The Spirograph`.
- Spirograph `.foot`: appended "Push the ring to exactly twice the wheel and pin
  the rim — the flower flattens to a dead-straight line: *The Circle That Rolls
  Itself Straight →*" (grounded — it *is* the same hypotrochoid degenerated).
- tusi `.foot`: "Another way circle becomes ellipse becomes line: *The Trammel of
  Archimedes →*" (the ellipsograph cousin, which already links back to Spirograph).

**Registered** on the Workbench (Toys & benches) right after **The Spirograph**,
in the curve-machines cluster near Fourier Epicycles / The Trammel — a new bench
growing the already-built Spirograph wing. **No front-door POI change.**
