# 🗝️ The Unlock System — the `ws:` convention

*The workshop has a hidden growth axis. Beyond the **front door** (curated projects) and the
**hidden doors** (companions tucked behind a card), there is now a **hidden world**: pieces that
materialise only after a visitor has *earned* them by how they wander. The first of these is the
**Living Lattice / Quickening**, found in **The Undercroft** (`undercroft/`).*

This file documents the convention; the **runnable source of truth** is the shared module
[`tools/ws/ws.js`](tools/ws/ws.js). Every shipped page stays fully self-contained (no network,
works on `file://`) — but the `ws:` logic is no longer copy-pasted. It lives in **one module,
inlined into each page via forge** (`<!-- forge:include ../tools/ws/ws.js -->`): pages are now
`*.src.html` → forge → `*.html`. Every piece agrees on a tiny `localStorage` schema; pieces
*write* trivial breadcrumbs, and the Undercroft *reads* them to decide what's unlocked. The module
also fires a tasteful in-the-moment **unlock cue** when a page's action newly satisfies a secret.

---

## Why it works (the persistence trick)

GitHub Pages serves the whole workshop from **one origin** (`bman654.github.io`), and
`localStorage` is keyed by **origin, not path** → **every page already shares one storage bucket.**
So a breadcrumb dropped by `strange-garden/pieces/game-of-life.html` is readable by
`undercroft/index.html`. No backend needed.

> **⚠️ Local testing caveat (important):** on `file://` (double-click) browsers give each file a
> *null/opaque* origin, so localStorage is **not shared across paths** locally. **Always test the
> unlock flow over a served origin:** `python3 -m http.server 8765` (or `npx serve`) from the repo
> root, then browse `http://127.0.0.1:8765/…`. Then cross-page storage behaves exactly like the
> live Pages site. **Never verify unlocks on `file://`.**

---

## The schema (`ws:` namespace)

All keys are prefixed `ws:`. Values are strings (localStorage stores strings).

| Key | Meaning | Written by | Example |
|---|---|---|---|
| `ws:seen:<id>` | First-visit timestamp (ms). Presence ⇒ "this piece has been visited." | A piece, on load | `ws:seen:game-of-life` = `1749600000000` |
| `ws:best:<game>` | Best score / level reached (number as string). | A game, on a milestone | `ws:best:chomp` = `3` |
| `ws:dwell:<id>` | Accumulated dwell time in ms (rewards lingering). | A piece, on a timer / unload | `ws:dwell:drift` = `420000` |
| `ws:flag:<event>` | A one-time event flag (presence ⇒ it happened). | A piece, on the event | `ws:flag:eleven` = `1` |
| `ws:ann:<id>` | Cue bookkeeping: this secret's unlock has already been *announced* (so we never re-toast it). Also `ws:ann:bootstrap` = the feature has run once on this origin. | `ws.js`, automatically | `ws:ann:codex` = `1749…` |
| `ws:pref:air` | The ambient score's arm choice. Part of the PREF set (`ws:pref:muted` · reduced-motion · air · air-bg). | the arm/still gesture (the air chip, on any page that wears one) | `ws:pref:air` = `1` |
| `ws:pref:air-bg` | The courtesy waiver: keep the air playing while the tab sits behind another. Absent ⇒ a hidden tab stills the air. | the air chip's tooltip toggle | `ws:pref:air-bg` = `1` |

**`<id>` convention:** the page's basename without extension, lower-kebab
(`game-of-life`, `lattice`, `quickening`, `chomp`, `drift`, …). Front-door **project** ids use the
project folder name (`strange-garden`, `arcade`, `sound-garden`, …).

**The PREF namespace.** `ws:pref:air — the ambient score's arm choice ('1' armed). The PREF set is now: muted (audibility, estate-wide), reduced-motion (stillness), air (the bed's existence), air-bg (whether a hidden tab keeps it). Independent axes; honor each separately. The air never autoplays: arming is remembered, sounding still requires a gesture per page-load. Every sound pref is read and written through WS — never a raw localStorage touch — so each carries a notifying setter and a cross-tab storage listener.`

### Canonical ids in use today
- `ws:seen:game-of-life` — the Game of Life specimen (Strange Garden) — *a parent of Quickening.*
- `ws:seen:lattice` — the Lattice instrument (Sound Garden) — *the other parent of Quickening.*
- `ws:seen:quickening` — the Living Lattice itself (once found).
- `ws:flag:eleven` — the "these go to eleven" easter egg (max every slider on a piece).
- `ws:flag:patience` — set once accumulated `ws:dwell:*` across the Sound Garden voices crosses a
  threshold; unlocks **"The Long Quiet"** (`undercroft/the-long-quiet.html`) — the dwell-trigger demo.
- `ws:dwell:<id>` — unhurried time (ms) accrued while a piece is open and visible (the Sound Garden
  instruments accrue this; their summed total drives `ws:flag:patience`).
- `ws:seen:<project>` — front-door door-opens (`strange-garden`, `arcade`, …), used to reveal the
  Undercroft's entrance once enough doors have been opened.

---

## The forge-module pattern (how a piece drops a breadcrumb)

No more copy-paste. A piece is authored as `index.src.html`; inside a `<script>` block (early
enough that `WS` exists before you call it) add **one forge directive**, then write the
breadcrumb synchronously at parse time:

```html
<!-- forge:include ../tools/ws/ws.js -->
WS.seen('verse');     // <-- this piece's id
```

Then build: `node tools/forge/forge.mjs verse/index.src.html` → `verse/index.html`. forge inlines
the module and strips its dual-use guard, so the shipped `.html` is fully self-contained. The page
needs nothing else — `ws.js` auto-inits on `DOMContentLoaded` and fires the cue (see below).

The `WS` API (full reference: [`tools/ws/README.md`](tools/ws/README.md)) — all writers are wrapped,
so storage-off is always harmless:

```js
WS.seen(id)                         // set ws:seen:<id>=now if absent; true if newly set
WS.best(game, val)                  // raise ws:best:<game> only if val > current
WS.flag(ev)                         // set ws:flag:<ev>='1'
WS.dwellAdd(id, ms[, thresh, flag]) // add dwell ms, re-sum all ws:dwell:*, set patience at thresh
WS.startDwell(id[, {tick,thresh,patienceFlag}]) // visible-only dwell ticker; returns an interval id
WS.store()                          // {ok, has(k), get(k), all} snapshot over every ws: key
WS.SECRETS                          // [{id, unlocked(s)}] — ids + predicates ONLY (no prose)
WS.unlocked(id, store)              // is secret <id> unlocked? (guards store.ok)
```

Examples: a game raising a milestone — `WS.best('swarm', wave)`; a one-time event —
`WS.flag('eleven')`; a meditative piece accruing unhurried time — `WS.startDwell('lattice')`
(sets `ws:flag:patience` once the summed `ws:dwell:*` total crosses ~2.5 min).

### The unlock cue (announced-namespace `ws:ann:`)

When a breadcrumb newly satisfies a secret's predicate, `ws.js` shows a tasteful, **spoiler-light**
candlelit toast — "✦ Something stirs in the dark beneath the workshop." (a warmer line if the
visitor has already found the Undercroft). It never names the secret. One toast even if several
unlock at once; auto-dismisses (~7s); respects `prefers-reduced-motion`; an optional whisper chime
plays *only* if an AudioContext is already running (never autoplay).

Mechanics, all automatic on a converted page:
- **`WS.bootstrap()`** — on the *first ever* run on this origin it silently marks `ws:ann:<id>` for
  every already-satisfied secret (so a returning visitor who unlocked things *before* this feature
  existed gets **no cue spam**), then sets `ws:ann:bootstrap`.
- **`WS.checkUnlocks()`** — toasts each satisfied-but-unannounced secret exactly once, marking
  `ws:ann:<id>` so it never re-fires.

The Undercroft's "forget my discoveries" reset clears all `ws:` keys, which now includes
`ws:ann:*` — so forgetting also re-arms the cue.

---

## Guardrails (non-negotiable)

1. **Secrets are bonuses, never blockers.** Every piece is fully enjoyable unlocked-or-not. The
   breadcrumb writes are additive and wrapped in `try/catch`.
2. **Degrade gracefully.** If `localStorage` throws or is empty, the Undercroft shows everything
   locked with a calm note — it never errors.
3. **Honesty.** The Undercroft offers a quiet **"forget my discoveries"** reset that clears the
   `ws:` keys (and only those).
4. **Self-contained *artifact*, shared *source*.** Every shipped `.html` is fully self-contained
   (no network, works on `file://`) — but that's a property of the SHIPPED file, not the process.
   The `ws:` logic is **not** copy-pasted: it lives in the one module `tools/ws/ws.js`, inlined at
   build time via forge. Pages are `*.src.html` → forge → `*.html`; never hand-edit a generated
   `.html`. (Mild tradeoff: the unlock *predicates* now appear in each trigger page's source — that's
   acceptable. Secret *names / blurbs / riddles* stay only in the Undercroft, so no prose leaks.)
5. **Once unlocked, stays unlocked** (the timestamp persists).

---

## Adding a future secret

1. Decide its **trigger** (exploration combo / score / dwell / configuration / a combination).
2. Make the relevant piece(s) drop the breadcrumb(s) — add `WS.seen(...)` / `WS.flag(...)` /
   `WS.best(...)` to each piece's `.src.html` and re-run forge (trivial, additive).
3. Add the secret's **predicate** to `tools/ws/ws.js`'s `WS.SECRETS` (id + `unlocked(s)` only),
   add an assertion to `tools/ws/ws.test.cjs`, and add its rich **display** row (name, badge,
   blurb, riddle-hint, signs, where it lives) to the Undercroft's `SECRETS` table. The cue fires
   automatically once the predicate is in the shared table.
4. Re-run `node tools/ws/ws.test.cjs` and `node tools/forge/forge.mjs --check --all`, then test the
   trail **on a served origin** (see the caveat).

That's the whole framework. `tools/ws/ws.js` is the unlock-rule evaluator + cue; the Undercroft is
the reader/aggregator + the rich display; every piece just leaves footprints.
