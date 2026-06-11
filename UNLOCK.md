# 🗝️ The Unlock System — the `ws:` convention

*The workshop has a hidden growth axis. Beyond the **front door** (curated projects) and the
**hidden doors** (companions tucked behind a card), there is now a **hidden world**: pieces that
materialise only after a visitor has *earned* them by how they wander. The first of these is the
**Living Lattice / Quickening**, found in **The Undercroft** (`undercroft/`).*

This file is the **one canonical place** the convention lives. Each page stays fully
self-contained (no shared import, no network) — so this is a **copy-paste micro-convention**, not
a library. Every piece agrees on a tiny `localStorage` schema; pieces *write* trivial breadcrumbs,
and the Undercroft *reads* them to decide what's unlocked.

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

**`<id>` convention:** the page's basename without extension, lower-kebab
(`game-of-life`, `lattice`, `quickening`, `chomp`, `drift`, …). Front-door **project** ids use the
project folder name (`strange-garden`, `arcade`, `sound-garden`, …).

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

## The breadcrumb snippet (copy-paste into a piece)

Drop this near the end of a piece's `<script>`. It's safe, silent, and degrades gracefully if
storage is blocked (private mode / disabled). **Writing-only — a piece never *depends* on it.**

```js
/* ws: unlock breadcrumb — see /UNLOCK.md. Records first-visit; harmless if storage is off. */
(function(){
  try {
    var id = 'quickening';                         // <-- this piece's id
    var k = 'ws:seen:' + id;
    if (!localStorage.getItem(k)) localStorage.setItem(k, String(Date.now()));
  } catch (e) { /* storage blocked — secrets are a bonus, never a blocker */ }
})();
```

Other write forms (same try/catch wrapper):
```js
// milestone score (only raise it):
var bk='ws:best:chomp', prev=+(localStorage.getItem(bk)||0); if(level>prev) localStorage.setItem(bk,String(level));
// one-time flag:
localStorage.setItem('ws:flag:eleven','1');
```

Dwell accumulator (drop in a meditative piece; accrues unhurried time, sets `ws:flag:patience` at a
summed threshold across all `ws:dwell:*`). Only ticks while the tab is visible:
```js
(function(){ var id='lattice', TICK=5000, THRESH=150000;   // +5s/tick; ~2.5 min total
  setInterval(function(){ if (document.hidden) return; try{
    var k='ws:dwell:'+id; localStorage.setItem(k, String((+localStorage.getItem(k)||0)+TICK));
    var total=0; for (var i=0;i<localStorage.length;i++){ var kk=localStorage.key(i);
      if (kk && kk.indexOf('ws:dwell:')===0) total += (+localStorage.getItem(kk)||0); }
    if (total>=THRESH && !localStorage.getItem('ws:flag:patience'))
      localStorage.setItem('ws:flag:patience','1');
  }catch(e){} }, TICK);
})();
```

---

## Guardrails (non-negotiable)

1. **Secrets are bonuses, never blockers.** Every piece is fully enjoyable unlocked-or-not. The
   breadcrumb writes are additive and wrapped in `try/catch`.
2. **Degrade gracefully.** If `localStorage` throws or is empty, the Undercroft shows everything
   locked with a calm note — it never errors.
3. **Honesty.** The Undercroft offers a quiet **"forget my discoveries"** reset that clears the
   `ws:` keys (and only those).
4. **Self-contained.** No shared JS import, no network. This convention is documented here and
   pasted where needed.
5. **Once unlocked, stays unlocked** (the timestamp persists).

---

## Adding a future secret

1. Decide its **trigger** (exploration combo / score / dwell / configuration / a combination).
2. Make the relevant piece(s) drop the breadcrumb(s) above (trivial, additive).
3. Add the secret to the Undercroft's `SECRETS` table: its `id`, display, **riddle-hint**, the
   `unlocked(store)` predicate, and where it lives once revealed.
4. Test the trail **on a served origin** (see the caveat).

That's the whole framework. The Undercroft is the reader/aggregator + unlock-rule evaluator; every
piece just leaves footprints.
