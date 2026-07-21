# The Cento Press — SPEC

*A working print shop.* Not a poem generator you visit: **a press you operate**, whose reward is the
ROOM at the end of the session — a rope strung wall to wall, hung with broadsides swaying, ink still
darkening on the newest, that you walk along and read across at once.

You never write a word here, because **the case holds no letters — only standing type**: whole lines
the makers of this house already set and locked up after the job. You can only choose, and arrange.

A companion within **The Print Room**, reached through it. `compositor/the-cento-press/index.html`
plus its committed `corpus.json` and the `harvest.mjs` that fills it. Vanilla JS + Canvas + SVG,
**zero deps, no network/CDN/web-fonts** (system stacks only), relative paths, `"use strict"`.

## The claim: NONE

This piece proves no theorem and states no mathematical fact. What it owes instead is a
**payoff-liveness twin** (below) — an assertion that the experience actually FIRES.

## The four mechanics

1. **THE GALLEY + SPILL.** A lit standing galley on its stand beside the press holds the forme's
   4–8 slugs, right-reading. Beside it, a compact strip of the case's seam-boxes with live sort
   counts. Each slug hovers to reveal **✕ spill**: the slug tips out (`translateX(-38px)
   rotate(-11deg)`, lead-on-lead clatter), its line returns to its box, and **a new line from the
   same box rises into the same slot**. Same seam, better line, one click. That is the curation
   loop, and it is what makes the forme *yours* before you crank. `SET NEW FORME` re-rolls wholesale.

2. **THE MIRROR.** The forme in the chase stands `scaleX(-1)` — grey un-inked, oxblood on ink. The
   galley shows it right-reading, the bed shows it backwards, and the sheet that comes off the
   cylinder reads at last.

3. **WEIGHT IN THE CRANK.** The crank is 1:1 with your hand — *stall your hand and the sheet stalls
   half-printed*, which is the whole difference between a machine and a button. Past a contact angle
   it gains resistance:

   ```
   strain = (turn − CONTACT) / (1 − CONTACT)        CONTACT = 0.44
   give   = 0.34 + 0.66 / (1 + strain² · 11)        1.0 → ≈0.40
   ```

   so the last third of the revolution is a genuine haul (≈1.6 hand revolutions per sheet). With it:
   a strain-and-velocity-tracked band-passed **creak**, one low **platen kiss** at contact, and a
   ±`strain·2.2px` frame shudder. `PULL` remains the auto-crank path for keyboards and reduced-motion.

4. **VARIANCE, UNGRADED.** Per-pull `inkLoad` / `impression` / skew, destination-out starved
   patches, a double-impression deboss, a feathered deckle. Crank smoothness modulates them *modestly*
   — an even, unhurried revolution biases toward a cleaner impression — but there is **no verdict,
   no grade, no letter printed on the sheet**. Every sheet is keepable. Pull the same forme twice,
   hang them side by side, and they are visibly different objects (≈6% of pixels) with byte-identical
   text. That discovery is the argument for paper and it must never read as a score.

## The broadside — held to `compositor/SPEC.md`'s bar

**Exactly three type sizes, big contrast.** An opening line at ~21px/700 serif in the one accent ink
(oxblood `#8e2f26`); body at ~16px, one size, flush left, generous rag, the turn in italic; foot at
9px mono, letter-spaced. Warm cream stock (520×780) with laid lines, foxing, hairline rules top and
bottom, a kicker (`A CENTO IN 6 LINES`), an italic display numeral (`№ VII`), and a large intentional
foot margin. Base ink `#2a1a16`; the accent appears in exactly one place, so it means something.

The colophon carries the provenance, with the hands **elided to whatever measurably fits** (the
seven-maker wrap is what used to break the negative space):

```
A CENTO SET FROM THE HOUSE'S OWN STANDING TYPE
FROM THE HANDS OF KINDLER · WEDGE · CULLWRIGHT and three other hands
NO. C79D  ·  6 LINES SET  ·  2 SPILLED  ·  OXBLOOD INK
every line verbatim, nothing invented
```

**Verified by eye across many re-rolls.** If a pull reads as a poem in a box, tighten the rules and
re-roll until the set looks curated.

## The seed grammar

```
quire-5110          the forme as first set
quire-5110|s:2,5,2  …then slot 2 spilled, slot 5 spilled, slot 2 again
```

Every spill is recorded IN the seed. That is what lets a broadside be reproducible from its seed
alone no matter how much you curated it — and why the rack can store `{seed, pull}` and nothing else.

## The composer

`n = 4..8` lines. Slots have JOBS, which is why a cento reads as a poem and not a heap:

| slot | box |
|---|---|
| 0 | `openings` |
| `round(n·0.62)` | `turns` (the volta) |
| `n−1` | `closes` |
| 1–2 middles | `rooms` — ballast, never first, never last |
| ≤1 middle | `the long measure` |
| the rest | `confessions` / `openings` / `turns` / `closes` |

Standing rules: no line twice; **never two lines from one hand in a row**; an anti-echo pass on
6+-character non-stop keywords (relaxed on a second pass, then a third that only forbids repeats);
rooms lines barred from the edges.

## The corpus — in-house, checked in

`harvest.mjs` (committed, re-runnable as the estate grows) harvests `ledger/ledger.jsonl` koans and
the front door's PLACES blurbs (via `card-catalog/reclaim.mjs`'s proven parser) into a committed
`corpus.json` — the **FULL** harvest, ~1717 sorts, because the anti-echo and same-hand rules need the
room. **No foraged text of any kind.**

Sorts are distributed into **seven boxes, a partition** (a sort lives in exactly one compartment, the
way a real sort does — which is what makes "spill from the same box" honest):

`openings · turns · confessions · closes · the rooms · the long measure · ?`

Filters that matter:
- Koans must be a whole thought (24–190 chars, terminal punctuation).
- **The rooms filter is tight**: a blurb sentence must carry a **finite verb**, must not **name two
  rooms**, and must not speak in **the catalogue voice** (a blocklist of the estate's machinery
  vocabulary — pills, node twins, exports, seeds, wings, exhibits, re-rolls). Only sentences spoken
  from *inside* a room may be cast.
- The **pivot allowlist** is a real turning word at a word boundary (`but · yet · until · unless ·
  though · although · instead · rather · whereas · except · only · never · still · nor`). An em-dash
  alone is not a turn — that was the old bug that made half the case look like a volta.
- The `?` box takes the sorts that cannot stand upright (opening on a bracket, quote or dash, or a
  bare shout of capitals). Authentically near-empty, as it is in a real case.

## The payoff-liveness twin

`window.__CENTO_SELFTEST()` — six checks, all driven through the page's **own real entry functions**
(`compose`, `advance`, `spill`, `keep`, `renderBroadside`), never a synthetic pointer event on a
canvas, so it is fully headless-drivable:

| | check |
|---|---|
| **a** | 200 seeded pulls → every cento is 4–8 lines and **every line is an exact substring of its source koan/blurb in `corpus.json`** — zero invented text |
| **b** | the same seed ⇒ a byte-identical cento text (including its spill tail) |
| **c** | `keep()` files a broadside to the rack and the racked entry **re-renders the same poem from its stored seed**, verified through the `{seed, pull}`-only `localStorage` round-trip |
| **d** | `advance(1.0)` from a **cold start** reaches a finished, hung sheet — no stall, no empty stick |
| **e** | `spill()` replaces **in place**: line count unchanged, counter incremented, replacement from the same box, every other slot held |
| **f** | the same forme, pulls N vs N+1 ⇒ different pixels, and the same pull reproduces — the property that dies silently if anyone caches the render |

The chip in the topbar runs it and reports `6/6`.

## The room

- **Left third** — the shop: the standing galley on its stand, the case strip, the press. Never
  overlaps the hanging sheets.
- **Middle** — the drying line, its own clipped stage that pans (drag, or scroll), with a visible pan
  rail. **Two sheets are pre-hung from the house's own seeds** (`the-house-hand`, `standing-forme`)
  so a first visitor arrives to a shop that has been working, and sees what a broadside is before
  they earn one. The line caps at **12 sheets**; the thirteenth retires to a **back-of-the-shop**
  stack (re-printable from its seed) and the survivors slide back down the rope so the near end never
  goes blank.
- **Right** — the rack, its own gutter, scrolls.
- The wet look is a **narrow travelling highlight band**, not a full-sheet screen wash (which read
  washed-out grey). It pans across the sheet as it dries, then goes.

## Sound

In-house WebAudio, **MUTED BY DEFAULT**, honouring the estate's ONE shared mute (`ws:pref:muted`) —
a fresh visitor gets silence; a visitor who has already unmuted the estate gets the press. Unlocked
on a genuine user gesture (crank pointerdown, or any button). Seven voices, five of them forged:
crank ratchet, platen kiss, strain creak, the spill's lead clatter, paper rustle — plus the two
hand-drawn clicks, peg and clip. The estate's air chip is declined — the press already sings.

## House rules

One self-contained page + `corpus.json`; zero deps; no network/CDN/web-fonts; system font stacks
only; relative paths; `"use strict"`. `node tools/forge/forge.mjs --check` and
`node tools/manifest/manifest.mjs --check` clean.

## Placement — a DEEPEN

Reached **through The Print Room**: the front-door ROOMS `companion` slot for `compositor` now names
The Cento Press, and `compositor/index.html` carries the in-page door. Blazon keeps its own in-page
link. **No new front-door card, no new wing slug, no new front-door ROOMS entry.** Cross-linked in
prose to `verse/` (the Oracle *writes* the verse — this one only *sets* it), `letterer/`, and
`scriptorium/`.

## The art — forged in-house, seven modules

Nothing in this room is hand-waved and nothing is foraged. Seven assets came off the estate's art
foundry and each loads as its own module before the page's script:

| module | what it is |
|---|---|
| `press-body.js` | `CentoArt.press.draw(svg,{w,h,turn,strain,inked})` — the whole machine: iron frame, oak case, brass journals, the packed cylinder. It emits an empty `<g id="chase">`; the page injects the mirrored forme into it. |
| `paper-stock.js` | `CentoArt.paper.stock(ctx,o)` lays the mould-made rag sheet; `.deckle(ctx,o)` feathers the edge, `destination-out`, removing only. Deterministic from `o.rnd` alone — check (f) depends on it. |
| `cento-ratchet.js` · `cento-kiss.js` · `cento-creak.js` · `cento-rustle.js` · `cento-clatter.js` | the five voices, as `Gate.sfx[key]({ctx,dest,dur,when,seed,…})` builders. |

Each carries its contract in `art-specs/<key>.md`.

**The sheet's `age`.** `renderBroadside(cento, pull, q, age)` takes an optional `age` (0..1) and hands
it to the stock. Left unset it comes from the sheet's own seeded stream, so a sheet re-printed from
its seed alone comes back on the same paper; the two house sheets that greet a first visitor are
pinned older, because they have been hanging here a while.

**Still hand-drawn:** `peg()` and `clip()` — two short clicks — remain on the crude `burst()`/`tone()`
helpers. They were never worth a forge.
