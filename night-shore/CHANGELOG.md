# A Message, Cast to the Tide — changelog

*The estate's first SEA. A dark night-shore at the seaward end of the promenades,
beside the harbour where the Powder Sky fires. Write a line, cast it to the tide;
come back later and the sea sends one home, weathered by the days it was away.
A DELIGHT-FIRST piece — it makes no math claim; its verification is a
payoff-liveness twin proving the message actually comes home.*

## Cycle #463 (2026-07-22) — planted

Built by the planter for garden cycle #463 (bloom of the design "A Message, Cast
to the Tide" — graft of a charged kinematic CAST onto a unified Gerstner SEA).

**The experience**
- **The sea** — a sum-of-waves height field rendered per-scanline in fake
  perspective under a low bloomed moon; the shimmering **moon-glade** is emergent
  (moonlight caught on the moving crests), rendered as a soft Blinn-Phong sheen
  plus a pass of twinkling **glitter motes** keyed to the swell phase — alias-free
  where a razor per-pixel specular tiled. Wet-sand strip mirrors the moon column;
  a foam sheet advances/retreats with the swell; a horizon buoy blinks. 60fps.
- **The cast** — write one line on a glass slip → it corks into a bottle in hand
  (wood *tock*). Pull back to wind up (a taut casting line, a filling charge glow,
  a predicted-arc ghost), then sweep forward and let go: release velocity + charge
  → power → an arc that catches the moon in glints → a splashdown that injects a
  real **ripple ring into the field** (*ploonk*), a skip for flat-fast throws.
- **The honest consequence** — launch range → drift time, geometric so a gentle
  lob is a ~3-min reply and a mighty heave a ~3-day voyage. The window is etched
  on the cork tag as it leaves the hand.
- **The return** — on any visit, if a bottle is due, ONE is already riding the
  swell in; it grounds on the wet sand and waits to be *noticed*. Uncork it: your
  own words come home, or a stranger's line from a baked **drift-pool** of 50
  fragments in the estate's voice (no repeats until exhausted). Weathering —
  barnacles, tide-stain foxing, algae, sea-glass frosting, ink-fade, an "adrift N
  days" wax seal — scales with the ABSOLUTE time at sea. Keep it on the shelf, or
  cast it back out.
- **Audio** — WebAudio only, no samples. Surf = pink/brown noise → swept bandpass
  whose gain rides the SAME swell phase as the visual crests; an inharmonic FM
  buoy bell on the blink period; cork/whoosh/strain/ploonk/tink for the cast.
  Gated behind the first gesture; prominent mute (shared `ws:pref:muted`). No Air
  chip — the room sings its own voice.

**Modules (clean seams for the twin)**
- `drift.mjs` — PURE: `plan` · `weather` · `dueBottles` · `resolveReturn` ·
  `tideStatus` (injected clock + injected corpus picker; no DOM).
- `store.mjs` — versioned `ws:night-shore` v1 with an in-memory fallback for
  private-mode/quota.
- `corpus.mjs` — the baked 50-line drift-pool + no-repeat picker.
- `index.src.html` → `index.html` — the Sea render, the Cast state machine, the
  Audio, the write flow, the return; forge-inlines the three cores (single source
  with the Node twin).

**Verification**
- `liveness.test.mjs` — the payoff-liveness twin, headless, drives the REAL
  persist→advance-clock→load path with an injected clock + backend: **107/107**.
  Covers the four DoD checks (cast persists+timestamps · advancing the clock lands
  a return whose weathering matches the elapsed · a restored session RESUMES the
  same voyage mid-drift · a graceful EMPTY-TIDE before any bottle is due) plus:
  driftMs monotonic in range, weather deterministic, corpus no-repeat, store
  round-trips incl. the in-memory fallback.
- In-page **self-test chip** runs a subset of the same twin against an isolated
  fake backend → green `self-test 6/6 ✓`.
- Browser-verified (agent-browser): 60fps, clean console, the cast persists a
  bottle with a planned drift on the REAL input path, a due bottle rides in on
  load and opens a weathered read card via a true CDP-level click.

**Placement** — a new front-door POI **The Night Shore** in the `promenades`
district, its own single honest dot beside the **Powder Sky** (its genuine kin —
open-air night-water out past the promenades). A DEEPEN of the promenades: no new
wing/district slug, no grand name over one dot. Manifest reconciled (66→67 rooms,
451→452 pieces, unclaimed 0). `ws:seen:night-shore` drops on visit.
