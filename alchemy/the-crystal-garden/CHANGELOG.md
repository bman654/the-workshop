# The Crystal Garden — changelog

A silent bench of the Alchemy Lab. A jar of water glass in which chosen metal-salt
grains grow hollow, coloured mineral tubes that climb and branch over the visit.
Claim-free (a delight, not a proof) — but it carries a PAYOFF, so it ships a
headless-drivable **liveness twin** proving the payoff fires.

## Cycle 446 — planted

- **`core.mjs`** — the pure, DOM-free growth model. A garden is plain serialisable
  data; `step(g)` advances it one tick using the garden's OWN seeded mulberry32
  stream (state on the object), so a garden is reproducible AND resumable.
  - **GRAFT 1 — per-salt habits.** Each of the five salts carries its own habit row
    (rise, jitter, sway, branch threshold, fork probability, taper, tip width) so
    the silhouettes read distinct: cobalt spindly & tall, iron gnarled, copper
    bushy & low, nickel balanced, manganese delicate. Colours are the real
    crack-colours (cobalt blue / iron rust / copper green / nickel jade / manganese pink).
  - **GRAFT 2 — deterministic resume.** `serialize(g)` = JSON (RNG state travels in
    it); `restore(json)` rebuilds; the view saves to `localStorage` under
    `ws:crystal-garden:v1` and a returning visitor resumes at exactly the grown jar,
    which keeps growing bit-for-bit identically.
  - **GRAFT 3 — the degenerate case.** A grain nucleated in the meniscus dead band
    has no water column above it (`colFactor→0`), so rise gates to exactly 0 and it
    stays a flat, unbranched stub. WHERE you drop the grain is a real mechanic.
  - Monotonicity is true BY CONSTRUCTION: rise ≥ 0 always ⇒ climbed height (a running
    max) is non-decreasing; branchCount is increment-only.
- **`core.test.mjs`** — the Node twin. Runs the shared `runLiveness()` (all 5 salts ×
  seeds monotone + payoff-fires, the degenerate stub, byte-identical resume) plus
  independent property checks (distinct silhouettes, exact-flat dead-band, deep-grow
  resume, MAX_TIPS bound) and a byte-identical re-extraction parity test. **20/20 GREEN.**
- **`index.src.html` → `index.html`** (forged, inline core byte-identical). Fixed
  logical jar space scaled to the container, so resize + reload never perturb the
  deterministic sim. In-page pill runs the SAME liveness suite + a LIVE-path probe
  (plant through the real click entry, tick, assert it climbed). Reads **liveness 8/8 ✓**.
- **Art modules** (`tube-material.js`, `jar-frame.js`) — hollow refractive tube +
  candle-warm jar frame, behind frozen APIs. The **art-foundry pass has LANDED**
  (see `art-specs/`): `tube-material.js` is the lampwork-capillary hollow refractive
  mineral tube (lit near wall / dark lumen / dim far wall / travelling sparkle /
  membrane-bulb tips) and `jar-frame.js` is the candle-warm water-glass jar (teal
  silicate body, warm bloom, bright shoulder arc, meniscus, lit-crowned sediment,
  warm floor caustic). No placeholders remain; the winners were installed in-place
  under the same frozen APIs and re-forged into `index.html`.
- Registered as a `living` card on `alchemy/index.html` (a claim-free delight bench —
  a link, but not counted among the nine proof benches). Manifest reconciled.
- Verified live (agent-browser, true input-level clicks): pick-salt → click-floor →
  tube climbs & branches; distinct salts look distinct; reload resumes the grown jar;
  clean console.
