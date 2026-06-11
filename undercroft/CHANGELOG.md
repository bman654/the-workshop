# The Undercroft — changelog

## Build 1 — the hidden room (2026-06-11)

**What it is.** `undercroft/index.html` is a single self-contained, zero-dependency, no-network HTML
page — the workshop's *third* growth axis. It is the reader/aggregator of the `ws:` breadcrumb
convention (see `/UNLOCK.md`): it inspects the `ws:` localStorage namespace and reveals pieces the
visitor has *earned* by how they wandered. Locked secrets appear as ghostly silhouettes (redacted
names, dimmed badges) showing a riddle-hint and a per-secret "signs" checklist so the visitor sees
how close they are without a spoiler. Unlocking a secret **materialises** it (fade + bloom-in) into a
full card: a place gets a working `Enter ▸` link, a trophy gets an `EARNED` stamp.

**Aesthetic.** Candle-lit vault beneath the workshop — Georgia serif title in a gold/parchment
gradient, ui-monospace kicks, a vaulted vignette, a gold progress meter, and a cheap calm ambient
backdrop of drifting candle-dust motes (capped at ~40 particles, DPR ≤ 2, pauses when the tab is
hidden, honours `prefers-reduced-motion`). Matches the front-door house style but darker/quieter.

**Data-driven.** A single declarative `SECRETS` array drives the whole room (launch data exactly per
spec §2): `quickening` (a *place* → `../sound-garden/quickening.html`, unlocked by
`ws:seen:game-of-life` **and** `ws:seen:lattice`) and `eleven` (a *trophy*, unlocked by
`ws:flag:eleven`). Adding a future secret is a one-object append.

**Reader, never a destructive writer.** The room never writes `ws:seen/best/dwell` of other pieces.
It does drop its own optional `ws:seen:undercroft` breadcrumb on load (explicitly allowed by the
spec). The footer "forget my discoveries" reset confirms, then removes **only** keys prefixed `ws:`.

**File:** `undercroft/index.html` — 377 lines, self-contained, relative links only.

---

### Verification (agent-browser, session `undercroft-build`, served origin)

All six states were driven over **http://127.0.0.1:8765/undercroft/** (NOT file:// — localStorage is
per-origin). `localStorage` was manipulated via JS, the page reloaded, state asserted from the DOM,
and screenshots captured. Console was clean (empty buffer) throughout every state.

| # | State | Result | Screenshot |
|---|---|---|---|
| 1 | **Fresh** (ws: cleared, reload) | Both locked; ghost silhouettes + riddles; "0 of 2 discoveries found"; tallies "0 of 2" / "0 of 1"; all signs unchecked; bar 0%. Clean console. | `screenshots/01-fresh.png` |
| 2 | **One sign** (`ws:seen:game-of-life`) | Living Lattice still locked; "1 of 2 signs gathered"; the gathered sign checked (gold ✓), the other unchecked; "0 of 2 found". | `screenshots/02-one-sign.png` |
| 3 | **Both signs** (+ `ws:seen:lattice`) | Living Lattice **materialises** → full card, `Enter ▸` link `href="../sound-garden/quickening.html"`; "1 of 2 found"; bar 50%. | `screenshots/03-both-signs.png` |
| 3b | **Enter ▸ nav** | Clicking `Enter ▸` navigated to `http://127.0.0.1:8765/sound-garden/quickening.html` (title "Quickening") and the instrument loaded. | `screenshots/03b-quickening-loaded.png` |
| 4 | **Eleven** (`ws:flag:eleven=1`) | Eleven trophy unlocks → `EARNED` stamp, **no link**; "2 of 2 found"; bar 100%. | `screenshots/04-eleven.png` |
| 5 | **Reset** | "forget my discoveries" + confirm → all `ws:` keys removed (verified `remaining_ws_keys: []`); both re-lock; "0 of 2 found"; bar 0%. | `screenshots/05-reset.png` |
| 6 | **Degrade** (storage made to throw) | `body.no-store` set; calm note shown ("…your browser isn't letting it remember right now. Everything here is a bonus; explore freely."); everything locked; **no console errors**. | `screenshots/06-degrade.png` |

**Animation:** measured **61 fps** with the ambient motes running (1280×900 viewport).

**Note on the reset test:** native `confirm()` is a blocking dialog that wedges the CDP daemon, so
the reset's *confirm gate* was exercised by stubbing `window.confirm → true` (simulating the user
pressing OK) and then triggering the real `#reset` click handler — i.e. the actual key-clearing +
re-render code path ran. The confirm dialog itself is wired with a standard `confirm()` and renders
its message; it was just auto-accepted rather than clicked by the automation.

**Spec deviations:** none functional. Screenshots are stored under `undercroft/screenshots/` for
durability (originals also in `/tmp/undercroft-shots/`).
