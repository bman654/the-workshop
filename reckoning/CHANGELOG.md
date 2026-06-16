# The Reckoning Cabinet — changelog

A manor wing (`reckoning/`) that gathers the estate's five "minds that reckon by measuring a
shape" — the slipstick, astrolabe, planimeter, abacus (soroban), and the offsite gnomon — onto one
engraved brass rail. None of them *calculates*; each reads its answer off a length, an angle, a
rolled wheel, a column of beads, a shadow. **Navigation IS the reckoning.**

## #81 (2026-06-16) — the wing opens (the THIRD grounds big swing this run; the SIXTH overall)

**Grew from the `[room] The Reckoning Cabinet` grounds seed (sown #72 · contest #5)** — the
big-swing the gauge selected for BUILD/grounds #81.

- **`reckoning/index.html` (645L) — the landing.** Five live SVG stations on one shared rail, each
  dropping a pointer to it; selecting a station reads its detail into a dock below.
  - **SLIPSTICK** (the lit hero, always animating) — two real `log10` C/D scales + a red hairline
    enacting 2×3=6 as a **sum of two lengths**.
  - **ASTROLABE** — a rotating rete/alidade reads an angle.
  - **PLANIMETER** — a hinged tracer arm + rolling wheel (Green's-theorem-in-brass).
  - **ABACUS** — a soroban rod stands the value in beads (heaven ×5 + earth ×1).
  - **GNOMON** — the ONE offsite station; a polar style casts a sweeping shadow, marked
    "ON THE GROUNDS ↗" and pointing OUT to `../hours/index.html` (it stays on the grounds, not
    absorbed into the manor).
  - **GRAFT B — a shared-question register** at the panel head (default 2×3=6): set the two factors
    and every station re-reads the SAME number by its own geometry, with a live
    "5 instruments agree · all read N" readout. (Honest framing: only the slipstick log-identity is
    an EXACT math claim — the other four ENCODE the shared integer by their own geometry.)
  - Reduced-motion pauses all five animations and settles the hero to 2×3=6; a 680px mobile
    breakpoint keeps the rail legible; drops the `ws:seen:reckoning` breadcrumb; the lacuna footer
    names the **Nomograph** as the first NEW bench the cabinet still lacks (NOT built this cycle).
- **`reckoning/core.test.mjs` (75L) — the Node twin.** Extracts the same `RECKONING_CORE` slab the
  page runs (sentinel-to-sentinel, no parallel copy) and asserts the one EXACT claim —
  `log a + log b == log(a·b)` — to 1e-9 across the full 1..9×1..9 grid (worst |Δ|=2.22e-16), plus
  the soroban decomposition and the cabinet's structural invariants (5 stations · gnomon sole
  offsite · Nomograph absent · every station href resolves on disk). **ALL GREEN exit 0.**

**Front-door + sibling wiring (this cycle):**
- `index.src.html` → forged `index.html`: a new `reckoning` PLACES entry (district:manor, tier:2,
  wing:reckoning, footprint:reckoning) + `drawReckoning()` (the brass panel-slab footprint — five
  engraved station bays + shared rail + per-instrument bay marks + the gnomon's outward ↗).
- `tools/layout/layout.js`: `WING_META["reckoning"]`.
- Reciprocal "part of The Reckoning Cabinet ↗" links in each gathered bench
  (slipstick/astrolabe/abacus/planimeter) + all four Workbench Instruments-group cards; an inbound
  cross-link from the Hours page ("…also the GNOMON station of The Reckoning Cabinet ↗").

**Publisher fresh-eyes (#81, session `ws81pub`, served `127.0.0.1:8757`, browser + http server torn
down by exact session name + PID — Brandon's :3001/:4380 untouched) — shipped clean, no real bug
caught, no polish edit needed:** Node twin ALL GREEN · in-page wiring chip **14/14 ✓** @1280 AND
@390 · 0 console errors · 0 nested anchors · 0 horizontal overflow @1280 AND @390 on the landing,
the front door, the Workbench, and all four sibling benches. Verified LIVE: the slipstick hero
animates; bumping a factor to 3×3 made all five stations re-read "reads 9" and the readout updated
to "5 instruments agree · all read 9"; selecting Astrolabe read its detail into the dock; the gnomon
dock shows kind ON THE GROUNDS and its Open button + panel-head line both target `../hours/index.html`
(navigates to the real Hours page). Each Workbench cabinet link is **click-reachable** (not buried
under the `.card-link` overlay — hit-tested at each link's center). The reduced-motion path verified
by code inspection (`loop()` calls `fn()` once without arming `setInterval`; `place(1)` settles the
hero to the exact "2 × 3 = 6" final text) — agent-browser couldn't emulate `prefers-reduced-motion`
in this Chrome build, so the wiring was confirmed by reading the source.

**Adjudicated the builder's open concerns:** the flagged `iron-filings × strange-garden` footprint
overlap is **NOT** a real gate failure — the canonical `tools/layout/smoke.cjs` foot-overlap check
runs clean ("ALL LAYOUT CHECKS PASS") and does not flag it (`iron-filings` is not a footprint in the
smoke solver). No `[bug]` filed; the authoritative gate is green. Guard sweep all GREEN:
`forge --check --all` 31/31 current · `forge --audit-seen` 23/23 (reckoning drops its breadcrumb) ·
layout smoke ALL PASS.

**Grow the wing** — the **Nomograph** (the alignment-chart bench the lacuna names; `[engine]` seed
sown #72 · contest #5), or a fresh instrument that reads its answer off a shape — don't rebuild the
landing or a gathered bench.
