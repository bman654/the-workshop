# Soroban — changelog

## Build 1 (2026-06-12)

First build. A genuine, operable Japanese soroban — the workshop's 3rd
instrument (instrument vein, after Slipstick and the astrolabe).

- 13-rod soroban (0 … 9,999,999,999,999); 1 heaven bead (5) + 4 earth beads (1)
  per rod; reckoning bar; unit dots every 3rd rod.
- PURE CORE (`valueFromBeads`, `beadsFromValue`, `digitOfRod`, `rodFromDigit`,
  `clickEarthBead`, `clickHeavenBead`, `add/sub/mul`, `fingerprint`, `EXAMPLES`,
  `solveExample`) — single source of truth for the renderer and the self-test.
- SVG renderer (no `<foreignObject>`); CSS-transition bead slides honouring
  `prefers-reduced-motion`. Real PointerEvents: click a bead for true soroban
  physics (beads between it and the bar move together); drag slides earth beads
  on a rod.
- Big live readout (thousands separators) + per-rod digit strip.
- Controls: "Set to…" any non-negative integer; calculator (+ − ×) operating on
  the current value with a stepwise carry/borrow animation; Clear; Reset.
- 7 worked-example chips (7+8 carry, 12−5 borrow, 123+456, 9999+1 cascade,
  25×4, 10−7 complement, 1,234,567+7,654,321).
- 3 cosmetic skins (Hinoki warm wood / Ebony dark / Blueprint schematic) —
  style-only re-renders; never change value or bead positions.
- 2× PNG export by painting directly onto a 2D canvas (untainted; toDataURL
  verified headless).
- `runSelfTest()` (9 checks) → green topbar chip. Same CORE re-run under Node;
  browser chip count == Node count.
