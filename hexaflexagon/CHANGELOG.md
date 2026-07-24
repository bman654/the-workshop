# The Hexaflexagon — CHANGELOG

A trihexaflexagon drawn as a real creased hex-strip you pinch-and-flex on screen. Two faces you can
see — and a THIRD on neither side, that only the right flex turns up. Delight-first: it proves no
theorem. Its payoff-liveness twin (not a proof) is `window.__HEXA_LIVE()`: the flex-solver reaches all
three faces and the impossible third face renders non-empty + seam-aligned where flat paper showed two.

Lives in **the glasshouse-range** district as a *companion* (deepen, no new map dot) — sib-linked all
ways to its paper-folly kin, **The Fortune-Teller** and **Kirigami**.

---

## #485 — 2026-07-23 — In-house face art wired in (greybox → forged)

The three faces are now painted by bespoke in-house illustrations forged through the estate's art
foundry, replacing the builder's greybox placeholders.

- **`index.src.html`** — added three `forge:include` directives (`./art/day.js`, `./art/night.js`,
  `./art/eclipse.js`), each alone on its line in its own `<script>` wrapper, placed BEFORE the
  `./faces.js` include. `faces.js`'s override merge prefers `window.HexaArt.<key>` over its greybox
  stubs, so the forged art supersedes the placeholder at runtime while the stubs remain as a
  graceful-degrade fallback (and preview-harness fodder) — intended architecture, not dead code.
  (Guarded against the HTML-comment-in-`<script>` landmine: `/* */` only, directives isolated.)
- **`art/{day,night,eclipse}.js`** — the forged modules, each an `installHexaArt(key, drawFn)`
  registration. **DAY** = a warm sunlit walled garden (woodcut sun, voussoir arched gate with a path
  glowing through, stone courses, flower beds, cypress topiary). **NIGHT** = the same garden after
  dark (crescent moon in the sun's seat, a warm lantern in the arch, stars) — reads as Day's twin.
  **ECLIPSE** = a dead-centre black moon rimmed in living corona-gold on deep sky — a genuine third
  thing, the face a paper toy has no business hiding.
- **`index.html`** — re-forged; the built engine now carries the three draw modules inlined (all six
  inline scripts `node --check` clean; three `installHexaArt` registrations present).

**Verified (publisher #485, fresh-eyes on a served origin):** `__HEXA_LIVE()` green — `ok:true`,
`reachAll`, faces `[0,1,2]`, third reached only via `flexReveal`, `eclipseInk 448078`, `seamAligned`,
`maxSeamPx 0`. Real commit path fires — `__hexa.applyOp('flexReveal')` changes the rendered face.
All three `HexaArt` keys registered; `HexaArt.night` alone paints 252999 non-transparent px (a real
illustration, not a stub). Console clean; on-page pill green (`payoff live ✓`). Mobile (390px) has no
horizontal scroll. `forge --check --all` all current; `manifest --check` OK.
