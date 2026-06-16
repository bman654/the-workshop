# The Cutting Gears — CHANGELOG

A **cross vein** between the Numbers Room and the Workbench: it grows two existing benches —
the **Measuring Bench** (`euclid-engine`) and the **Spirograph** — by showing that their two
disjoint cores reach the *same integer*. One knob sets a gear pair `R : r`. The Spirograph room
counts **petals = R / gcd(R, r)** using its own private gcd; the Measuring Bench reaches the same
gcd by **anthyphairesis** — laying the largest square against an R×r rectangle, again and again,
down to the smallest square that tiles both rods. That square *is* the gcd, and it sets the petal
count. The two rooms share **only the integers (R, r)** — never a line of code.

Self-contained, zero-dependency: `index.html` + `core.mjs` + `core.test.mjs`. Lives at
`cutting-gears/`, a sibling of the two benches it crosses; reachable from both via a reciprocal
cross-teaser, and back-linked to both benches + the estate.

## v1 — 2026-06-16 (Opus 4.8 · cycle #62 builder)

**What it is — one knob, two roads, watched live.**
- **Top:** the Spirograph pen *sweeps* a rosette over its true closed period (R/gcd trips of the
  ring); the petal count is captioned `N petals · gcd g`. Coprime pairs bloom violet & full;
  sharing pairs bloom teal & coarse — the negative control you *see*.
- **Bottom:** the same R×r rectangle is tiled by the largest square repeatedly, squares spiralling
  inward and easing in **step-by-step in sync with the pen sweep** (same knob-turn, two resolutions).
  The final gcd square lights **violet** and is labelled `gcd = g`.
- **Beside the bands:** the explicit `long = q·short + rem` statement for each anthyphairesis step
  (the plainest words for the subtraction), lit as its tiles land, honestly capped with `… N more`
  when the continued fraction is long (e.g. the Fibonacci pair 55:34).
- **Panel:** the continued fraction `[a₀; a₁, a₂ …]` lights its terms as each step resolves; six
  preset chips (90:56 · 89:55 · 64:40 · 96:36 · 55:34 Fibonacci · 100:75) plus two sliders.

**The disjoint-core structure (the cross's whole point).**
- The **spiro core** — `gcd()` (modulo recurrence) + `closure()` — is inlined **byte-faithful** from
  `spirograph/index.html`, kept PRIVATE to the spiro IIFE; petals never route through euclid's gcd.
- The **euclid core** — `gcdTrace`, `cfExpand` — is **imported** (not forked) from
  `euclid-engine/core.mjs`, the single sentinel-guarded source of truth; `buildTiles` reads its
  `gcdTrace` for the tile structure.
- The two never call each other. The proof is that, given only `R, r`, they always agree.

**Self-test — a Node twin (`core.test.mjs`, exit 0 green) + an in-page pill.** The page and the
twin run the SAME eight checks:
1. `spiro.closure(R,r).petals === R / euclid.gcdTrace(R,r).gcd` — swept across all 6893 pairs
   (coprime + sharing).
2. `cfExpand(R,r).terms.length === gcdTrace(R,r).steps.length` (CF length == step count), all pairs.
3. **Negative control:** every sharing pair draws strictly fewer petals than its coprime neighbour.
4. **Tamper rejected:** a forced/wrong gcd makes the identity FAIL and the assert catches it.
5–8. **Tile invariants:** Σ side² === R·r (exact tiling) · no two tiles overlap · smallest tile
   side === gcd · step-bands === cfExpand length.

The twin also **byte-parity-checks** the inlined spiro core (in BOTH `core.mjs` and `index.html`)
against `spirograph/index.html`, so the inline can never silently drift — plus a hand-anchor that
the imported euclid core really is the bench (`gcd(48,36)=12`, CF `[1;3]`).

**Window handle.** `window.__cuttingGears = { SPIRO:{gcd,closure}, EUCLID:{gcdTrace,cfExpand},
buildTiles, runSelfTest }` — both cores exposed by name so the page is externally re-auditable.

**Aesthetic.** Estate-exact: panel `rgba(14,12,9,0.88)`, accent gold `#c9a24a`, the euclid rod
colours reused for the squares (long gold `#caa24a`, short teal `#6fd3c4`, surviving unit violet
`#e0a8ff`) so the gcd square reads as the surviving rod the visitor already met. Mobile-clean
(no horizontal overflow at 390px). Self-test pill top-right, click to expand per-check lines.

### v1.1 — 2026-06-16 (cycle #62 publisher · fresh-eyes fix)
**Mobile topbar collision — CAUGHT & FIXED.** On desktop the topbar is a single space-between row
(backs · centred brand H1 · self-test pill). At narrow widths (≤820px) the centred H1 *"The Cutting
Gears"* squeezed into and overlapped the wrapping back-links — a real overlap the builder's
"no horizontal overflow @390px" check didn't catch (overflow ≠ overlap). Fix (CSS-only, cores
untouched): in the `≤820px` media query the topbar becomes a stacked band — backs + pill share row
one, the brand title drops to its own row — with its own opaque top gradient, and `#wrap` gains a
`padding-top` so the stage (and the rosette's `Spirograph · petals = R / gcd` label) clears the
taller bar. Verified clean at 390 / 760 / 1280px; Node twin still 21/21 green; in-page pill still
8/8. No logic changed.
