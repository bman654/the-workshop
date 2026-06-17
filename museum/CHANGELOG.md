# The Museum — CHANGELOG

The estate's archive wing. The Tabularium is re-homed here as the first exhibit; the
Centennial Jubilee — *The River of Days* — is the hero.

---

## #101 — The Centennial Jubilee · The River of Days (grounds big swing, the EIGHTH)

**What opened.** A new front-door manor wing — THE ARCHIVE — celebrating the 100th cycle
since cycles were counted, by re-laying those first hundred cycles on the **true wall-clock**
so you can feel the difference between the ruler (the tidy "100") and the river (10 days that
fell in storms and silences).

**The hero — *The River of Days*.** 450 commit-stones plotted on a real SVG wall-clock axis
(1100×440), alternating vellum day-bands engraved with dates + per-day counts, stones coloured
by track (garden moss / grounds brass / bug iron). The 58.6-hour silent gap is drawn as a
literal **dark dry channel** with a crescent-moon glyph and a computed label "the estate slept ·
2d 10h 34m 48s". A draggable brass **playhead** + ▶ auto-play that physically accelerates
through busy days and crawls the gap; a hero **LEVER** snapping the x-axis BY REAL TIME ↔ BY
MILESTONE with a 600ms tween (`prefers-reduced-motion` honored); a live HUD (commit N/450 ·
real date/time · +Δ since last); the manor silhouette **raising all 20 wings** at their real
birth epoch; ←/→ step, Home/End, Space play; two chips jump to the storm (commit 182, JUN 13)
and the silent night (commit 61, the gap's exact seq-61 endpoint). Form expresses content — a
century you scrub on the clock you can climb, not a plotted curve.

**The math is a quiet self-test layer.** The River is a pure function of the committed git
record. `core.mjs` (the sole authority, dual-use Node + inlined byte-identical into the page
between CORE-BEGIN/END) provides parseCycles / recomputeAggregates / longestGap / busiestDay /
perDay / timeScale / indexScale / formatSpan / selfTest / tamper / verdict. `cycles.json` is
the carrier: one record per commit `{seq, sha, epoch, iso, subject, track, cycleNum|null}`,
seq = git commit-DEPTH (the cycle==depth rule), generated deterministically by `gen-cycles.mjs`
walking `git log --reverse`.

**Self-test — 14/14 GREEN** (`node museum/core.test.mjs` exit 0) + the four required claims:
(a) every epoch ≥ prior, seq contiguous 1…450; (b) count===450, firstEpoch===1780893385,
lastEpoch===1781700001, elapsed===806616 (9d 8h 3m 36s), 10 distinct local days; (c)
longestGap===210888 (2d 10h 34m 48s, seq 61↔62), busiestDay===2026-06-13/118 commits,
meanGap===1796s, Jun-9 a zero-commit day swallowed by the gap; (d) a tampered carrier FAILS
(13/14, breaks epoch monotonicity). In-page pill GREEN; the "⚠ Forge a fake timestamp" button
flips it RED ("TAMPERED self-test 13/14 ✗") then auto-restores after 2.8s.

**Re-homed.** The Tabularium becomes the Museum's first exhibit (a lit card on the landing); a
reciprocal "part of The Museum ↗" chip was added to the Tabularium (additive CSS + one eyebrow
link; `tabularium/core.mjs` byte-unchanged). Two dashed planters reserve the next exhibits:
*The Front Door Through The Ages* and *The Strata*.

**Registration (additive).** Front-door PLACES entry `{district:manor, tier:1, wing:archive,
footprint:colonnade, order:5}` + a new `drawColonnade()` footprint (stepped stylobate + column-
dot colonnade + pedimented portico); a `museum` field-star in the archive band; emit-mirror now
reads the real PLACES from `index.src.html` (removes mirror drift) and checks the museum star.

**Files.** `museum/index.src.html` (forged → `index.html`) · `core.mjs` · `core.test.mjs` ·
`gen-cycles.mjs` · `cycles.json`.

**Publisher fresh-eyes (#101) — CAUGHT & FIXED one real mobile bug.** Reviewed the piece + both
registration surfaces (front-door map, re-homed Tabularium). Node twin re-run 14/14 + claims;
in-page pill green; tamper negative control verified live (flip RED 13/14 → auto-restore). Every
hero interaction verified live (storm chip→182, silent-night→61, End→450, Home→1, ArrowRight→2,
lever re-lays the stones). 0 console errors · 0 nested anchors · all cross-links 200 ·
museum↔tabularium↔estate resolve · tabularium core.mjs byte-unchanged. CLI gates: forge --check
all 35 current, layout smoke PASS, sky 73/73, emit-mirror all 13 footprints star-clear. **The
bug:** at ≤390px the self-test pill (width 408px, `white-space:nowrap`) spilled off the right
edge of the topbar — 218px of it, including "round-trip the git record", clipped unreadable on a
phone. The document scrollWidth stayed clean (body clipped it) so it slipped past the overflow
check. **Fix:** a `@media (max-width:560px)` block caps the pill (`max-width:62vw`, `min-width:0`,
`text-overflow:ellipsis`) so it ellipsizes cleanly inside the topbar while the green ✓ + "self-
test passed" signal stays visible (full text in the title tooltip + the colophon); the back-link
keeps its space. Desktop byte-unaffected (the rule only applies <560px; full sentence re-verified
@1280). Re-forged `index.src.html → index.html`; forge --check all 35 current.

Provenance: the #101 worklog.
