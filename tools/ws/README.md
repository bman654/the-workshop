# `ws` — the Workshop's shared unlock module

One source of truth for the `ws:` localStorage breadcrumb convention (the hidden
Undercroft world). Pieces drop trivial breadcrumbs; the Undercroft reads them to
decide what's unlocked. Full convention: [`/UNLOCK.md`](../../UNLOCK.md).

This used to be copy-pasted into every page. It's now **one module, inlined via
forge** — shipped `.html` files stay self-contained, but the source lives here.

## Use it in a page (the pattern)

1. Author the page as `index.src.html`. Inside a `<script>` block (early enough
   that `WS` is defined before you call it), add **one line**:
   ```html
   <!-- forge:include ../tools/ws/ws.js -->
   ```
   (path is relative to the `.src.html`; from `verse/` or `scriptorium/` it's
   `../tools/ws/ws.js`).
2. Drop the breadcrumb synchronously at parse time:
   ```js
   WS.seen('verse');   // or WS.flag('eleven'), WS.best('swarm', wave), …
   ```
3. Build: `node tools/forge/forge.mjs verse/index.src.html` → `verse/index.html`.
   forge strips the module guard; the shipped file is self-contained.

The page does **not** need to do anything else — ws.js auto-inits on
`DOMContentLoaded` (or immediately if the DOM is ready) and fires the unlock cue.

## API surface (`WS`)

**Writers** (all wrapped — storage-off is harmless):
- `WS.seen(id)` — set `ws:seen:<id>`=now if absent; returns `true` if newly set.
- `WS.best(game, val)` — raise `ws:best:<game>` only if `val` > current.
- `WS.flag(ev)` — set `ws:flag:<ev>`=`'1'`.
- `WS.dwellAdd(id, ms[, thresh, patienceFlag])` — add dwell ms, re-sum all
  `ws:dwell:*`, set the patience flag at `thresh` (default 150000).
- `WS.startDwell(id[, {tick, thresh, patienceFlag}])` — dwell accumulator that
  ticks only while the tab is visible; returns an interval id.

**Reader:**
- `WS.store()` — snapshot `{ ok, has(k), get(k), all }` over every `ws:` key.

**Predicates:**
- `WS.SECRETS` — `[{ id, unlocked(s) }]`, **ids + predicates only** (secret
  names / blurbs / riddles stay in the Undercroft so prose never leaks into
  public page source).
- `WS.unlocked(id, store)` — `!!(secret && store.ok && secret.unlocked(store))`.

**Cue machinery** (announced-namespace `ws:ann:`):
- `WS.bootstrap()` — first ever run: silently mark `ws:ann:<id>` for every
  already-satisfied secret (no cue spam for returning visitors), then set
  `ws:ann:bootstrap`. Idempotent; runs before `checkUnlocks`.
- `WS.checkUnlocks([{ silent }])` — mark + collect every satisfied-but-unannounced
  secret; if any are fresh (and not silent, in a browser) call `renderCue`.
  Returns the fresh id list.
- `WS.renderCue(ids, store)` — inject one tasteful, **spoiler-light** candlelit
  toast (never names the secret). Respects `prefers-reduced-motion`; auto-dismisses
  after ~7s; optional whisper chime ONLY if an AudioContext is already running.

The Undercroft's "forget my discoveries" reset clears all `ws:` keys, which
includes `ws:ann:*` — so it also re-arms the cue.

## Self-test

```
node tools/ws/ws.test.cjs
```
Mocks `localStorage`, requires the module via its CommonJS export, and asserts
writers / `store()` shape / predicates / `bootstrap()` silencing / `checkUnlocks()`
fresh-once. Prints `ws self-test: N/N PASS`; exits non-zero on any failure.

## Verifying the cue

The `ws:` system shares storage by **origin**, so cross-page unlocks only work on
a served origin — never `file://`. Run `python3 -m http.server 8765` from the repo
root and browse `http://127.0.0.1:8765/…`. See `/UNLOCK.md` for the full caveat.
