# The Midway — changelog

## Cycle 400 — The Errand joins as the tenth ride (the strip's first DELIGHT-first ride)

**The Errand** — a Rube-Goldberg workbench (`the-errand/`) — is added as the tenth lit ride, and
the FIRST that owns no theorem. It gathers under the Midway roof; NO new front-door / map
footprint.

- A new `.ride.lit` card → `../the-errand/index.html` (glyph 🎯, kind line "build a little machine
  that keeps its promise · Rube-Goldberg, by honest physics"), placed after The Banked Curve.
- The card carries a **WARM GOLD `.delight` pill** ("no score · no proof · just the CLUNK-tink-DING")
  — a new pill class added beside the green `.proof` pill. Its visible difference states, without
  a word, that the Midway now holds **joy as well as instruments**: nine of the ten rides are
  honest instruments with a load-bearing proof; the tenth just wants you to grin.
- Hero copy updated "Nine rides are running" → "Ten", with a clause for building a little machine
  and pulling GO to watch a chain *keep its promise*; the stamp reads "Nine instruments · one
  delight". The footer gains an Errand paragraph (kin to the poster press and the verse oracle;
  the warm-gold delight pill where the others wear a green proof).
- Self-test bumped: `document.querySelectorAll('a.ride.lit').length === 9` → `=== 10`, plus the
  exact-href structural checks for the new card matching the existing pattern (present by exact
  href, a relative link containing index.html, carries a `.delight` pill and NOT a `.proof` pill,
  and the delight pill reads its honest promise). Green **37/37 ✓**.

## Cycle 131 — sown (a new amusements-district wing landing)

**The Midway** — a brass fairground at dusk where *every ride is a real instrument you
operate and a body you sit inside; the readout is the motion itself.* The landing page of
the estate's amusements district's new physics-you-ride strip.

- Reuses the Sewing-Room landing skeleton: a topbar `.back` to `../index.html`, a STRUCTURAL
  self-test chip, hero, ride-card grid, and footer, in the estate's brass-on-near-black voice
  (`#07080c` ground, `#c9a24a / #f4d27a` gold, teal "proven/legal" + coral "detached/illegal").
- Ride cards:
  - **THE COASTER** — LIT → `../the-coaster/index.html`, with the green proof pill
    "self-test ✓ · energy conserved <1e-9 · loop survives ⟺ h≥2.5r · sub-height car PROVABLY
    detaches".
  - **THE LOOP** (rider's-frame cockpit) — coming-soon stall, dimmed (reserved for the planned
    2nd ride).
  - **THE ROTOR** (gravitron: floor drops, you stick to the wall) — coming-soon stall, dimmed.
  - **More to come** — a dimmed "the strip keeps growing" stall.
  - A reciprocal-neighbour link → `../brachistochrone/index.html` ("next door: a fixed-curve
    descent-TIME race — same gravity, the opposite question").
- The chip proves **structural wholeness** (the one lit ride by exact href, the coming-soon
  stalls present-but-dimmed, exactly one lit card, the reciprocal neighbour link, the
  back-link, breadcrumb `ws:seen:midway` dropped) — **13/13 ✓**. Same shape as the Sewing-Room
  landing chip.

**Registration.** Joins the existing **amusements** wing (beside Maze / Arcade / Pavilion /
Warren) on the front-door map — `{district:"grounds", tier:1, wing:"amusements",
footprint:"coaster"}`. A new `drawCoaster` footprint draws a side-view coaster (hoist tower,
valley, vertical loop, run-out) as map linework. The bench `the-coaster/` is reached FROM
this landing and has no own PLACES entry (mirrors cradle-weaver reached from sewing-room).
