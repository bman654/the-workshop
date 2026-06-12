# 📅 The Almanac — build spec (HIDDEN Undercroft cross-pollination)

*A seeded perpetual **almanac / book of days**, anchored to **real astronomy**. The Undercroft's
8th secret and its **3rd cross-pollination**: it weds **The Oracle** (verse / invented folklore)
with **Orrery** (the real clockwork of the solar system) — "a book of days written beneath a true
sky." This is the workshop's signature exploration-combo trigger, in the under-developed
**words / generative-text** vein.*

## 0. The crux (workshop tradition — a PROVEN correctness gate)

Every workshop piece has a verifiable gate. The Almanac's headline crux is that its folklore is
**anchored to a REAL sky** — the astronomy is not decorative, it is computed and **self-tested**:

1. **Real Moon phase.** Compute the Moon's age/phase for any date with a standard algorithm
   (Conway's "Doomsday"-adjacent or the conventional synodic-month epoch method). Self-test it
   against **known reference new/full moons** (e.g. a known new moon 2000-01-06 ~18:14 UTC, synodic
   period 29.530588853 d) — the computed phase fraction must land within tolerance (≤ ~1 day of
   phase age) on a handful of independently-known dates across decades.
2. **Real solstices & equinoxes.** Compute the four cardinal points of the year (approximate
   algorithm — Meeus's simplified solstice/equinox formulae are ideal and short). Self-test against
   **known dates** (e.g. 2024 has Mar equinox ~Mar 20, Jun solstice ~Jun 20, Sep equinox ~Sep 22,
   Dec solstice ~Dec 21 UTC) within ≤ ~1 day.
3. **Correct calendrical math.** Weekday via a known method (Zeller's congruence or
   `Date`-cross-check), correct **leap-year** handling (Gregorian rule), correct days-per-month,
   day-of-year. Self-test: a few known weekdays (2000-01-01 = Saturday; 2026-06-12 = Friday), leap
   years (2000 leap, 1900 not, 2024 leap), Feb length.
4. **Seed purity / style-invariance.** The generated folklore for `(seed, year)` is **identical**
   regardless of the render *style* — style only re-renders, never changes content (the
   Blazon/Tessellarium crux). Self-test: hash the generated day-records; assert identical across all
   styles for the same `(seed, year)`.
5. **Coherence (no template seams).** Curate-then-arrange like The Oracle / Threshold: load-bearing
   phrases are hand-authored fragments selected & lightly arranged by the seed, so each entry reads
   as *written*, not mad-libbed. (This one is judged by eye in the browser, but the engine must
   never emit a raw placeholder, a double-space, " a apple", "1 days", etc. — include a light
   grammar/agreement pass and assert no `undefined`/`NaN`/empty fields in the self-test.)

**Ship the self-test visibly:** run a headless N-check self-test on load that calls the *real*
engine functions (not a parallel copy); log `PASS`/`FAIL` per check to the console; show a small
green **"sky verified — N/N ✓"** chip in the UI. **Never ship red.** (Match the established pattern
in Tessellarium / Centipede / Qubit.)

## 1. What it is (the experience)

From a **seed** + a **year**, the Almanac composes a coherent **book of days** for an invented
folk-calendar laid over the real Gregorian year. The page presents:

- A **title plate**: an invented almanac name ("The ▢▢▢ Almanack for the Year of ▢▢▢"), a
  compiler's name (Oracle-style invented name), a one-line epigraph, the year.
- **The wheel of the year** (a compact visual): the 12 months as a ring or column, the **four real
  solstice/equinox dates marked**, the season tint shifting around it. Small, tasteful — a
  woodcut/engraving feel, drawn in Canvas or SVG. It should feel like the frontispiece astronomy of
  a real almanac.
- **A "Day" reader**: pick any date (a date input + prev/next-day + a "today" button defaulting to
  the real current date). For the chosen day it shows a coherent entry:
  - the **real Moon phase** (name + a tiny drawn moon glyph + illumination %),
  - the **season** and how many days since/until the nearest cardinal point,
  - an invented **feast / observance** for that day (folk-calendar — name + one sentence of what it
    marks), seeded & stable per (seed, year, date),
  - a **weather-lore couplet** (curate-then-arrange rhyming folk-saying, e.g. "Red at night… "),
    tinted to the season,
  - an **omen / sign** (one line — astrological/folk, anchored to the moon phase or season),
  - a line of **husbandry / counsel** ("a good day to…", "let the ▢ rest", "sow ▢ before the ▢"),
    seasonally appropriate (sowing in spring, harvest in autumn, etc. — the season MUST gate which
    counsel pool is drawn from, so it reads true),
  - the **weekday** + an invented day-name (optional flavor).
- A **"feast days of the year" index** (a curated list view): the handful of generated high feasts
  for the year with their dates — the almanac's table of moveable + fixed feasts.
- **Re-roll seed**, **seed input** (stable/shareable), **year input**, and **2–3 render styles**
  (e.g. *Woodcut* = warm cream paper + heavy serif + engraving rules; *Star-Chart* = the
  Orrery/Firmament dark indigo + gold; *Plain Leaf* = quiet). Style is cosmetic only (crux #4).
- **PNG export** of the current day-leaf (2×), like the other presses.

**Tone:** wry, earthy, faintly mystical — a real old farmer's-almanac voice (Poor Richard meets a
hedge-witch), NOT purple. Keep it coherent and short. The folklore is invented but should feel
*plausible and consistent* (the same feast appears on the same date every time for a seed; omens
agree with the moon phase the engine actually computed).

## 2. The cross-pollination (why it belongs in the hidden world)

It marries two existing wings:
- **The Oracle** (`verse/`) — the workshop's voice of invented language/folklore (curate-then-
  arrange). The Almanac speaks in that lineage.
- **Orrery** (`orrery/`) — the *real* clockwork of the solar system (real JPL-element positions,
  real Moon phase). The Almanac borrows the **real sky** as its anchor — the moon phase and the
  solstices are *true*, not decorative.

So the riddle is: *the speaker of days, set beneath the true wheeling of the heavens.*

## 3. Placement & wiring (HIDDEN — front door untouched)

- **Lives at:** `undercroft/almanac.html` (single self-contained vanilla file, zero deps, zero
  network, relative links only — it serves from the `/the-workshop/` subpath).
- **Trigger (exploration-combo):** `ws:seen:verse` **∧** `ws:seen:orrery`.
  - `verse/index.html` **already drops `ws:seen:verse`** on load — leave it.
  - `orrery/index.html` does **NOT** yet drop a breadcrumb. **Add the standard breadcrumb snippet to
    `orrery/index.html`** (id `orrery`) so the trail is reachable. (Mirrors how Cartographer was made
    to self-drop for The Floating Ink — deep-link robust.)
- **Almanac drops its own breadcrumb** `ws:seen:almanac` on load (additive, try/catch).
- **Add a SECRETS row to `undercroft/index.html`** (the data-driven table). Use this exact shape
  (match the existing rows' fields — `id, kind:'place', name, sub, badge, accent, blurb, href,
  riddle, signs[], unlocked(store)`):

  ```js
  {
    id:'almanac', kind:'place', name:'The Almanac', sub:'a book of days, under a true sky', badge:'📅',
    accent:'#cba15a',
    blurb:'A seeded perpetual almanac — invented feasts, weather-lore and omens, written beneath the REAL moon and the true solstices. The speaker of days, set under the wheeling heavens.',
    href:'almanac.html',
    riddle:'Set the speaker of days beneath the true wheeling of the heavens, and read what the year foretells.',
    signs:[
      { label:'the voice that speaks the days', key:'ws:seen:verse' },
      { label:'the true clockwork of the heavens', key:'ws:seen:orrery' },
    ],
    unlocked: s => s.has('ws:seen:verse') && s.has('ws:seen:orrery'),
  },
  ```
  The Undercroft's count/meter/capstone auto-read `SECRETS.length` — no other edit needed there.
  (After this, the Undercroft holds **8** secrets; the capstone needs all 8.)

- **DO NOT touch the front-door `index.html` PROJECTS array or counts** — this is a hidden piece.
- **DO NOT add a front-door pill or a verse sib-link to a front-door card** (the Almanac is found by
  earning it in the Undercroft; that's the whole charm). The only public-side change is the
  one-line breadcrumb added to `orrery/index.html`.

## 4. House style / back-links

- Match the workshop's warm-parchment language aesthetic (steal CSS vars/feel from `verse/` and the
  Undercroft pieces — gold-on-dark `--gold:#cba15a`, serif body `Iowan Old Style`/Palatino/Georgia,
  mono labels). The "Star-Chart" style can borrow Orrery's indigo+gold.
- Back-links in the page header: `← the undercroft` (to `index.html`) — the other hidden pieces
  (`rosette.html`, `codex.html`, `floating-ink.html`) use this; **copy their back-link markup
  exactly** so it's consistent. (It's reached from inside the Undercroft, so the back-link points
  there, not to the workshop root.)

## 5. Engineering constraints

- **One file** `undercroft/almanac.html`, ideally < 1200 lines, vanilla JS + Canvas/SVG, **no deps,
  no network, no fonts fetched** (system serif stack only).
- **Seeded RNG**: a small deterministic PRNG (mulberry32/xmushash from a string seed) — every other
  piece uses one; reuse the pattern. Same `(seed, year)` ⇒ same book, always.
- **60fps / 0 console errors / 0 warnings.** Respect `prefers-reduced-motion` (the wheel can be
  static). Clean up any RAF/interval on re-roll (no leaks).
- **Self-test** runs on load, calls the real functions, shows the green chip, logs PASS per check.
- **PNG export** of the day-leaf at 2× (render to an offscreen canvas or use the existing
  pattern from another press).

## 6. Verification (the deputy MUST do all of this before reporting done)

1. **Self-test green** in the console + the visible chip (N/N PASS). Never red.
2. **Served origin** (`python3 -m http.server` from repo root; browse `http://127.0.0.1:PORT/...`)
   — verify via **agent-browser in a UNIQUE NAMED session**:
   - the Almanac page itself loads 60fps, **0 console errors/warnings**, self-test PASS chip shown;
   - moon phase / season / feast / lore / omen / counsel all render coherently for several dates;
     re-roll changes the book; the SAME seed+year reproduces the SAME book; style switch keeps
     content identical (only looks change); PNG export downloads a valid image;
   - **the full unlock flow**: clear `ws:` keys → the Undercroft shows the Almanac as a locked ghost
     ("0 of 2 signs"); visit `verse/` (drops `ws:seen:verse`) → "1 of 2"; visit `orrery/` (now drops
     `ws:seen:orrery`) → unlock → the Almanac niche materialises → **Enter ▸ loads the page**;
   - confirm the rest of the Undercroft still renders (count now "of 8"), 0 console errors on
     `undercroft/index.html`, `verse/`, `orrery/`.
3. Capture 1–2 screenshots as evidence.

## 7. Deliverables / checkpoints (commit after each is fine)

- `undercroft/almanac.html` (the piece).
- `orrery/index.html` (+ the one breadcrumb snippet, id `orrery`).
- `undercroft/index.html` (+ the SECRETS row above).
- `undercroft/CHANGELOG.md` (a new "Build N — The Almanac" entry, matching the file's style).
- Report back: file + one-liner, how verified (self-test counts, the unlock-flow result, console
  cleanliness), and anything notable (bugs found+fixed). Respect spoiler etiquette in any public
  text.
