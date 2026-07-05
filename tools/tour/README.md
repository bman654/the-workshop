# The Grand Tour — maker contract

The **Grand Tour** is the estate's docent system: a visitor picks a *thread* and is
walked through a handful of real pages in order, each with an engraved caption card that
narrates the stop, waits a beat, and walks on. The tours are **silent forever** (the only
voiced surface is the Showing — see `talk/README.md`); a tour is a guided *reading* of the
live estate, not a slideshow — every stop is the real, running page.

This file is the contract for a maker adding or editing a tour. It covers the data schema,
the page-side beats API, the de-quantified-surface rule, hold-stop guidance, and the
add-a-stop / add-a-thread checklists. The design rationale lives in
`~/.claude/reference/workshop-design/02-grand-tour/DESIGN.md` (§ references below); **where
this README and the code disagree, the code wins** — read the source and fix the doc.

---

## What ships, and how it ships

Two hand-authored, zero-dependency files, forge-included **into every stop page and the
front door**:

- **`tools/tour/tours.js`** — the thread *data* (authored, never generated). Defines the
  browser globals `TOURS`, `EXTRA_STOPS`, `DOCENT_SENTINEL`. Dual-use (the ws.js idiom): in
  a browser it attaches those globals; under Node it `module.exports`es them so
  `tour-check.mjs` can `require` it. `forge` strips the trailing export guard on inline.
- **`tools/tour/tour.js`** — the docent *engine*: the state machine, the engraved card
  chrome, the beats runtime, the start plaque, the front-door adapter's public seam. Also
  dual-use (pure logic exported for the Node twin `tour.test.mjs`; `window.GrandTour` in the
  browser).

**The include block** (verbatim; `tours.js` FIRST so its globals exist when the engine
reads them lazily) sits at the end of `<body>`:

```html
<script>
/* ════════════════════════════════════════════════════════════════════════════
   THE GRAND TOUR DOCENT (WS2, inlined at build time by forge). tours.js FIRST
   (it defines the TOURS / EXTRA_STOPS / DOCENT_SENTINEL browser globals the engine
   reads lazily), then tour.js (the docent engine). This page is a TOUR STOP: with
   ?tour=<id>&stop=n params the engine mounts the docent card, runs this stop's
   beats, and walks on to the next; with no tour params the page is untouched. Use
   block-comment form only inside a forge-included script — a multi-line HTML comment
   lands inside the inlined script and silently kills it. See tools/tour/README.md +
   DESIGN §6. */
<!-- forge:include ../tools/tour/tours.js -->
<!-- forge:include ../tools/tour/tour.js -->
</script>
```

The `../` prefix is **relative to the page's own directory**: depth-0 pages
(`colophon.html`) use `tools/tour/…`, depth-1 (`rainbow/index.html`) use `../tools/tour/…`,
depth-2 (`cavern/double-slit/index.html`) use `../../tools/tour/…`.

> **⚠ THE FORGE LANDMINE (learned the hard way).** Inside a forge-included `<script>` use
> the **block-comment form `/* … */` only**. A multi-line HTML comment (`<!-- … -->`) placed
> between or around `forge:include` directives lands *inside* the inlined script at build
> time and **silently kills the whole script** — no console error, no gate failure from
> `forge --check` alone. A `/* */` block comment must also contain **no `*/`** (even inside
> `(/* */)`) and no HTML-comment tokens. Never hand-edit shipped `.html` — edit the
> `.src.html` and re-forge (see the checklist).

**No tour params → the page is untouched.** The engine reads `?tour=<id>&stop=<n>`; with no
tour params (or an unknown id / out-of-range stop) it renders no chrome, logs one
`console.info`, and leaves the page exactly as it was. A stale bookmark decays to a plain
visit. The include is wrapped in the estate's `try/catch` shell — a thrown docent leaves the
page usable.

---

## The tours data — `tools/tour/tours.js` (DESIGN §2)

```js
const TOURS = [
  { id: 'light',                            // URL token — [a-z-]+, STABLE FOREVER (bookmarks)
    title: "The Thread of Light",           // visitor-facing; house voice
    tagline: "from a blue sky to a fringe of doubt — what light does, walked in order",
    minutes: 6,                             // honest estimate shown on the plaque/drawer
    start: 'index.html',                    // the page that carries the begin-plaque / drawer
    stops: [
      { href: 'index.html', at: 'opticks',  // FRONT-DOOR WAYPOINT stop (§6): draws the lit
        caption: '…' },                     //   thread + flies the camera to a district
      { href: 'rainbow/index.html',
        room: 'hall-of-mirrors',            // EXHIBIT stop: parent room id (manifest-verified)
        title: "The Rainbow",
        caption: '…',                       // the docent's engraved prose — INSTALLED VERBATIM
        dwell: 22000 },                     //   from Appendix A; NEVER worker-authored (§9)
      { href: 'pool/index.html', room: 'hall-of-mirrors',
        hold: true, caption: '…' },         // WATCH-FOREVER stop: no countdown (see below)
      { href: 'cavern/double-slit/index.html', room: 'physics-lab',
        beats: 'act', caption: '…' },       // ACT stop: page runs its window.__tourAct
    ] },
  // …four more threads…
]
```

**Field rules:**

| field | where | rule |
| --- | --- | --- |
| `id` | thread | `[a-z-]+`, unique, **stable forever** (it lives in visitors' URLs). |
| `title` / `tagline` | thread | non-empty; house voice; visitor-facing. |
| `minutes` | thread | integer; an honest estimate, shown on the plaque and in the drawer. |
| `start` | thread | a page that exists; the plaque/drawer live here. Front-door-started threads (`index.html`) show no plaque — the map's `⟲ tours` drawer is their affordance. |
| `href` | stop | **repo-relative**, resolves to a manifest room/exhibit, or `index.html`, or an `EXTRA_STOPS` entry. May carry its own `?query#hash`; the engine merges its two params on nav and strips them on leave. No absolute hrefs. No duplicate href within a thread. Never a `hidden[]` page or a `locked:true` room. |
| `room` | **exhibit** stop | the parent room id; **must equal** the manifest's parent for that href (a wrong/missing `room` is a build failure). |
| `at` | **waypoint** stop | a **top-level** district id — the front-door overlay draws the lit thread and flies the camera there. Restricted to top-level districts (the fairground child layer is out of waypoint reach; ordinary child-page hrefs are still fine). |
| `anchor` | `EXTRA_STOPS` stop | supplied by the `EXTRA_STOPS` entry, not the stop — a top-level district the lit path pins to. |
| `caption` | stop | the engraved prose. **Register-critical: authored by the maker in Appendix A and installed verbatim** — an executor never writes or edits caption prose (§9). |
| `title` | stop | the stop's heading on the card (exhibit/act stops). |
| `dwell` | stop | ms override of the default (`18000`). Ignored on a `hold` stop. |
| `beats` | stop | `'act'` marks a stop whose page runs a bespoke `window.__tourAct` (see below). |
| `hold` | stop | `true` = a watch-forever stop (no countdown — see below). |

Every **exhibit** stop carries `room:`; every **waypoint** carries `at:`; an `EXTRA_STOPS`
stop needs neither (it gets its `anchor` from the allow-list). Each is pre-verified by
`tour-check`.

### `EXTRA_STOPS` — the non-manifest allow-list

Two estate front-matter pages live *outside* the manifest and may still be stops, via an
explicit allow-list (keeps the manifest rule honest instead of loosening it):

```js
const EXTRA_STOPS = {
  'colophon.html':    { anchor: 'manor',       justification: '…' },
  'ledger/face.html': { anchor: 'outbuilding', justification: '…' },
};
```

Each entry names a top-level `anchor` district (the lit-path structure the stop pins to) and
a one-line `justification`, and **must exist on disk** (tour-check enforces both). Add here
*only* a genuine front-matter page with no manifest room — don't use it to sneak past a
wrong `room:`.

---

## The de-quantified surface (BINDING — DESIGN §3)

The docent card is a **place on a walk, not a progress bar**. This is a hard rule, enforced
by taste and reviewed at every commit:

- **No "Stop N of M"** anywhere a visitor reads or hears. The card shows a quiet row of
  place-markers (one per stop, the current one emphasized — a "you are here", *not* a
  fill-as-you-go meter; nothing counts, nothing fills).
- The aria announcement is the **place**: `"{stop title} — on {tour title}"` (e.g. *"The
  Hall of Mirrors — on the Thread of Light"*), via a polite live region. The dwell dial is
  `aria-hidden` (the announcement carries the state).
- Resume affordances say **"resume where you left off"** — never a number. The high-water
  stop lives only in storage (`ws:best:tour:<id>`), never on the surface.
- The front-door lit-path roundels carry **no numerals** (a stop-count bead `×n` on a
  multi-stop anchor is the one allowed count, and it's about *places*, not progress).
- **House voice throughout:** no engine vocabulary — *tier / orbit / manifest / POI / act /
  anchor / waypoint* — ever reaches a visitor string.

---

## Hold stops (`hold: true`) — DESIGN §1

A **watch-forever** stop: a page whose whole point is to be *watched* (a caustic pool, the
orrery turning, the Game of Life breathing). On a hold stop the card **replaces the
countdown dial with a plain line** (`"walking on"` under reduced motion becomes a static
text) and **never auto-advances** — the visitor walks on themselves with `⏭` / `→`. Use it
for any stop where a fixed dwell would cut the moment short. `dwell` is ignored on a hold
stop. (A hold stop and an `act` stop are independent: an act can also hold.)

---

## The beats API — the page-side contract (DESIGN §4)

When the docent arrives at a stop it runs a **beats runtime**. Three layers, lowest wins by
absence:

1. **`window.__tourAct = async (ctx) => { … }`** — a bespoke performance for a marquee stop.
   The engine `await`s it, with a hard cap (`ACT_CAP = 45000` ms) after which it proceeds to
   the dwell.
2. **`[data-tour-spot="1..k"]` declarative walk** — with no act: elements carrying
   `data-tour-spot` are visited in numeric order (scroll into view + an engraved halo,
   `SPOT_DWELL = 4000` ms each, pause-aware).
3. **Do-nothing default** — the page simply *is*: ARRIVE → DWELL. Most stops take this
   (the house ships no blank pages; a still page reads as a complete image, an animated one
   plays on its own).

**`ctx` — the whole surface handed to an act (keep it small):**

```js
{ tourId, stopIndex, reduced,   // reduced = prefers-reduced-motion
  signal,                       // AbortSignal — fires on leave / advance
  beat(ms),                     // pause-aware sleep; REJECTS on abort
  spotlight(el, ms?),           // the same engraved halo the declarative walk uses
  softPause(),                  // "the visitor took over" — suspend the dwell
  done() }                      // optional early "my performance is over"
```

**Rules for an act (all enforced by the headless gates):**

- **Re-entrant-safe.** A back/forward arrival (bfcache `pageshow`) may run the act again —
  it must not double-fire, corrupt state, or leak timers/rAF. Guard against a stale prior
  run.
- **Degrade under `reduced`.** Skip flourishes, keep the substance. (Under reduced motion the
  card appears without a slide, the dial becomes text, spotlights become static outlines.)
- **Silent.** Tours never play audio (a sound page keeps its *own* gesture affordance
  untouched — the act doesn't touch it).
- **Call the page's REAL entry functions — never synthesize canvas pointer events.** This is
  the estate's payoff-liveness rule (DESIGNING.md): an act pokes `fire()` / `crankOnce()` /
  `startRound()` — the same functions the page's own UI calls — so the act is drivable and
  assertable by the headless gates and can never diverge from real behavior. Never reset or
  destroy the visitor's data (advance a counter, don't clear the board).
- **Never reach into a page's private closure.** The front door is an actor too
  (`index.src.html` implements the same page contract via `window.__tourAct`); it drives the
  map only through public seams (`window.__panCamera.frameTo`, the `Layout.plates(...)`
  data), never the platewalk's internals — coupling runs page→engine only.

**The acts shipped in WS2** (the only stops that need one): `cavern/double-slit` (fire a
particle volley), `benford-mill` (turn the crank), `the-three-doors` (play one demonstrated
round, then reset to the visitor's turn), `the-coin-that-lies` (pull the release),
`the-rewind-shelf` (scrub forward and back once), `the-barrel-house/pin-barrel` (a half-turn
of the crank, then hold), plus the front-door overture. Every other stop takes the
do-nothing default (verified animated-on-load or a complete still).

### `window.__tourHooks` vs `window.__tourAct` — one include, two surfaces

`window.__tourHooks = { verb: fn, … }` is a **second, finer** page seam: named one-shot pokes
(`fire`, `crank`, `go`, `mapFrame`, …) used by **the Showing's** cue sheet (`talk/`, DESIGN
§10) — added only where interaction itself is the point. **Tours never call hooks; the
Showing never calls `__tourAct`.** One forge-include serves both surfaces. If you add a hook
for the Showing, keep it idempotent for a STATE verb (camera, crank-to-position) and one-shot
for an IMPULSE verb (fire, go). See `talk/README.md`.

---

## Add a stop to a thread (the checklist)

1. **Pick the page and confirm it can be a stop.** It must be a manifest room/exhibit (or
   `index.html`, or an `EXTRA_STOPS` page), **not** `hidden[]`, **not** inside a
   `locked:true` room. Hub pages aren't stops (one blessed exception: `workbench/` opens the
   Founding Walk — the room *is* the story).
2. **Give the page the docent include if it lacks it.**
   - If the page already has a `.src.html`: add the two-line include block (above) at the end
     of `<body>`, at the correct `../` depth. **Check the sentinel isn't already present** —
     re-adding it runs a *second* engine (a duplicate-docent bug). `grep grand-tour-docent`
     the shipped html first.
   - If the page is **shipped-only** (`.html` with no `.src.html` — ~122 estate pages are):
     **mint a `.src.html`** = the current shipped html **verbatim** + the include block. Do
     *not* hand-paste the engine into shipped html; once the `.src.html` exists, `forge` owns
     the page and `--check` governs it. This is the established path for giving a page shared
     code.
3. **Add the stop object** to the thread's `stops[]` in `tours.js`, with the right anchor
   field: `room:` (exhibit, matching the manifest parent) / `at:` (front-door waypoint) /
   an `EXTRA_STOPS` entry. **Paste the caption verbatim from Appendix A** — never author it.
4. **Re-forge** every page you touched:
   ```
   node tools/forge/forge.mjs <page>.src.html      # or --all
   ```
5. **Run the gate** (below). It must exit 0.
6. **Real-input walk** (agent-browser, true CDP clicks — never `dispatchEvent`): begin the
   thread, watch one auto-advance, pause/resume, back (and browser-Back — assert the bfcache
   `pageshow` re-init), leave (params stripped), resume from the plaque, reach the FINALE.
   Run a **caption-truth** check: every factual claim in a caption must match the live page —
   **fix the caption, not the page** (but captions are Appendix A's; a mismatch is escalated,
   not silently rewritten).

## Add a whole thread

Same as above for each stop, plus: a unique stable `id`, non-empty `title`/`tagline`,
honest `minutes`, and a `start` page that exists. Front-door-started threads get their
overture as stop 0 (an `index.html` waypoint with `at:`); exhibit-started threads get a
begin-plaque on their `start` page automatically. The captions/titles/taglines are Appendix
A's — installed verbatim.

---

## Validation — `tools/tour/tour-check.mjs` (DESIGN §8)

Runs as an estate gate:

```
node tools/tour/tour-check.mjs      # exits 0 when every thread is well-formed
```

It asserts, for every thread and stop: the `href` resolves into the manifest (room /
exhibit / `index.html` / `EXTRA_STOPS`) and is not `hidden[]` and not in a `locked:true`
room; every exhibit stop's `room:` matches the manifest parent; no absolute hrefs; **every
hop** (stop *n*→*n+1* plus every engine-emitted link) statically resolves to a real file
from the source page's own directory (the `rel()` check); ≥2 stops per thread; unique stable
ids; non-empty title/tagline/captions/minutes; every `start` page exists; **every stop's
shipped `.html` contains the `DOCENT_SENTINEL` string `grand-tour-docent`** (the
forgotten-include gate); no duplicate hrefs in a thread. Built-in negative controls (a bad
href / hidden stop / locked-room stop / wrong `room:` / absolute href / duplicate waypoint)
each demonstrably fail.

The other gates that must stay green same-commit when you touch tours: `node
tools/tour/tour.test.mjs` (pure-logic twin), `node tools/tour/acts.test.mjs` (the six acts +
the front-door/Showing hooks), `node tools/forge/forge.mjs --check --all`, `node
tools/manifest/manifest.mjs --check`, and the real-input `node tools/layout/gate-dom.test.mjs`.

### Determinism

No `Math.random` / `Date.*` in any tour or cue **logic** path (UI pacing timers are fine).
The silent tour clock is rAF-driven; the Showing's clock is `audio.currentTime`. A stop
page's own physics may use randomness — an act just drives its real entry functions.

---

## The five threads at ship (reference)

| id | title | minutes | start |
| --- | --- | --- | --- |
| `light` | The Thread of Light | 6 | `index.html` (front-door overture) |
| `hours` | The Thread of Hours | 6 | `index.html` |
| `chance` | The Thread of Chance | 5 | `index.html` |
| `maker` | The Maker's Thread | 5 | `colophon.html` (plaque) |
| `founding` | The Founding Walk | 5 | `workbench/index.html` (plaque) |

The schema supports more; five is the ship set (DESIGN §9). See
`~/.claude/reference/workshop-design/02-grand-tour/APPENDIX-A-threads.md` for the verbatim
caption source.
