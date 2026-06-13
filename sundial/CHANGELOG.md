# The Gnomon — CHANGELOG

## v1.0 — first light

The workshop's operable sundial. The shadow shows apparent solar time; the page
reconstructs civil clock time from it and proves the two agree.

- **`tools/dial/dial.js`** — the dial + solar CORE (dual-use IIFE, `Dial`
  global / `module.exports`, DOM-free). Solar functions copied verbatim from the
  Astrolabe's CORE; adds the equation of time (`4·(L−α)`), the civil↔apparent-
  solar conversion (longitude + EoT + DST, exact inverses), the hour-angle, the
  per-type hour-line angle (`atan(sinφ·tanH)` / uniform / `atan(cosφ·tanH)`),
  the gnomon style angle, the shadow-tip projection, the analemma, and a
  skin-independent geometry fingerprint.
- **`tools/dial/dial.test.cjs`** — 21-check headless self-test against the same
  core: round-trip clock over 12,250 states, shadow-tip on the hour-line,
  hour-line angles == closed form per type (equatorial exactly 15°/hour), EoT
  extrema (+16.45 min ~Nov 3, −14.20 min ~Feb 11) & the four zero-crossings,
  gnomon angle, solar-dec sanity, noon-on-the-noon-line, determinism +
  skin-invariance. All pass, exit 0.
- **`sundial/index.src.html` → `index.html`** — the demonstrator. Canvas, dpr-
  aware, dark-drafting chrome. Sky strip with the Sun, dial face with numbered
  hour-lines, angled gnomon, live cast shadow + glowing tip, civil-clock readout
  with a match indicator. Drag the dial to scrub time. Controls: dial type,
  latitude / longitude / time zone / day / local clock, "Set to now", DST & EoT
  toggles, "Plot analemma", three palette-only skins, place presets, Reset,
  2× PNG, `← workshop`. The in-page self-test chip mirrors the Node test (21/21).
  `WS.seen('sundial')` at parse time. forge-inlines `../tools/dial/dial.js` +
  `../tools/ws/ws.js`.
