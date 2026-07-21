# The Cento Press — CHANGELOG

## Cycle 428 — the shop opens

Built from the *Drying Line* prototype's spine (the room, the rope, the crank, the wet ink, the
variance engine, the composer), grafted with the four mechanics the final design called for and held
to `compositor/SPEC.md`'s typographic bar.

**Grafted in**
- **The standing galley** — the floating "IN THE COMPOSING STICK" readout promoted to a lit object in
  the room, on its own stand beside the press, with the case's seam-boxes and their live sort counts
  strung beside it.
- **SPILL** — the curation loop. A slug tips out, its line goes back to its box, a new line from the
  same box rises into the slot. Recorded in the seed (`base|s:2,5,2`) so a curated forme stays
  reproducible from its seed alone.
- **The mirror** — the forme stands `scaleX(-1)` in the chase, grey un-inked, oxblood on ink.
- **Weight in the crank** — the lag-based give model `give = 0.34 + 0.66/(1+strain²·11)` past a
  contact angle at 0.44, so the last third is a genuine haul (≈1.6 hand revolutions per sheet), plus
  a strain-tracked creak, a platen kiss at contact, and a frame shudder.
- **Variance, ungraded** — crank smoothness biases the inking modestly; no verdict, no grade, nothing
  printed on the sheet.

**Cut from the prototypes** — the picas measure slider (a third mechanic that needs the stick to be
the stage; here the stage is the room) and the un-enforced lock/ink/pull ceremony.

**The broadside, rebuilt to the bar** — exactly three type sizes; the opening line at 21px/700 in the
one accent ink; body at one size, flush left, the turn in italic; a 9px mono foot; hairline rules, a
kicker, an italic display numeral, a large intentional foot margin. The colophon's hands are now
**elided to whatever measurably fits the measure** — the seven-maker wrap is what used to break the
negative space. Verified by eye across many re-rolls.

**The five layout faults, fixed**
1. The galley lives in the room's left third with the press and the case, on its own stand; it can
   never overlap the hanging sheets (the drying line is its own clipped stage).
2. The rack got a real gutter and scrolls.
3. Two sheets are pre-hung from the house's own seeds, so a first visitor arrives to a shop that has
   been working rather than an empty brown wall.
4. The line caps at 12 sheets, retiring the oldest to a back-of-the-shop stack (re-printable from its
   seed), and the backing canvas dropped 620×930 → **520×780** (~30MB → ~19MB at a full line).
5. The wet gloss narrowed from a full-sheet screen wash (which read washed-out grey) to a travelling
   highlight band, and the line got a visible pan rail and hint.

**The corpus** — `harvest.mjs`, committed and re-runnable, harvests the ledger's koans and the front
door's PLACES blurbs into a committed `corpus.json` (the FULL harvest, 1717 sorts). Distributed into
seven boxes as a **partition**, so "spill from the same box" is honest. The rooms filter was
tightened three ways — a finite verb, no line naming two rooms, and a **catalogue-voice blocklist** —
which cut the room lines from 105 catalogue-ish fragments to 49 that speak from inside a room. A
pivot-word allowlist replaced the old "an em-dash counts as a turn" rule, so the volta at ~62%
actually turns. No foraged text of any kind.

**The liveness twin** — `window.__CENTO_SELFTEST()` extended from 5 checks to the design's six
(a–f), each driving the page's own real entry functions, never a synthetic canvas pointer event.

### Bugs found and fixed during the build

- **The sheets came off the press blank.** The ink plate was coloured with
  `globalCompositeOperation="source-in"` for the base ink and then *kept* on `source-in` to lay the
  accent — so filling a few small accent rects composited against the whole plate and erased every
  letter outside them. The accent pass is now `source-atop`, which paints only where ink already
  stands. (Caught by eye on the first render; a pixel census confirmed 0 dark pixels before, 3835
  after.)
- **The line went blank at the near end once sheets started retiring.** `retireOverflow` removed the
  oldest sheet but left the survivors at their old coordinates, so after five retirements the
  leftmost sheet sat at x≈1590 and panning home showed an empty rope. The survivors now slide back
  down the rope to the start, with `panTarget`/`panX` shifted by the same amount so the view holds
  perfectly still.
- **The rope stopped sagging as the shop grew.** The single global catenary flattened to a straight
  line once `hallW` ran to thousands of pixels. Replaced with a shallow repeating span (918px) plus
  two slow beats, so it reads as a sagging line at any length.
- **The colophon overflowed the measure.** The hands were elided at a fixed count of five; names like
  `THE DEEP HEARTH` blew past the right edge anyway. Now measured and elided to fit.
- **The same forme's two impressions were barely distinguishable** (≈6% of pixels, but almost all of
  it below the eye's threshold). The ink-alpha ranges were so narrow they clamped — widened the
  ink-load and impression bands and the starved-patch strength until the difference is plainly
  visible without ever reading as damage.

### Verification

- `window.__CENTO_SELFTEST()` → **6/6**, `PASS: true`.
- The crank verified on a **true input path** — a CDP-dispatched pointer drag around the handle (not
  `dispatchEvent`, not `.click()`) hung a sheet and registered a crank quality of 0.8. *(Note for the
  next hand: `agent-browser mouse down` does not deliver a `pointerdown` — it emits the move but not
  the press — so the crank looks dead under it. Drive `Input.dispatchMouseEvent` over CDP with
  `buttons:1` and `clickCount:1` instead.)*
- Spill verified through the real `.spill` button click: seed `quire-5110` → `quire-5110|s:2`, line 2
  replaced from the same box, line count held.
- 12 sheets hung: **60.1 fps**, cap holding, 5 retired to the back of the shop, clean console.
- `forge --check` all 168 current · `manifest --check` OK (unreachable 0).

### Placement

A **DEEPEN**, not a detach. This is not its own place: it is the Print Room's back shop — the same
craft, the same trade, one door further in — and it would be a lone dot under a grand name anywhere
else. So it took no front-door card, no wing slug, and no front-door ROOMS entry. The `compositor`
companion slot now names it (Blazon keeps its in-page link), and `compositor/index.html` carries the
door. Cross-linked in prose to `verse/`, `letterer/`, and `scriptorium/`.

---

## Cycle 428 (wiring) — the forged art goes in, the greybox comes out

The art foundry forged the seven assets this room was built with placeholders for. All seven are now
the live path; every placeholder is gone.

**Wired**
- **`press-body.js`** — `drawPress()` is now one call to `CentoArt.press.draw()`. The press stopped
  being flat SVG greybox: iron, oak, brass and oxblood each read as their own material, the drum
  reads as a packed cylinder, and the chase is honestly a recess the type lies *in*. It emits the
  empty `<g id="chase">` the page injects the mirrored forme into, so the mirror graft is untouched.
- **`paper-stock.js`** — the `/* the stock */` gradient-plus-noise block and the `/* the deckle */`
  per-5px `destination-out` chatter are replaced by `CentoArt.paper.stock()` / `.deckle()`. The sheet
  now has real pulp and an edge whose fibres *run out* instead of chipping off. The dead
  `STOCK_A/B/C` constants went with them.
- **Five sounds** — `SFX.ratchet` · `kiss` · `creak(strain,vel)` · `rustle` · `clatter` all re-point
  at their forged `Gate.sfx` builders. The crude `burst()`/`tone()` helpers stay only because `peg()`
  and `clip()` — never forged — still use them.

**The sheet gained an age.** `renderBroadside()` takes an optional fourth argument, `age` (0..1), and
hands it to the stock. Left unset it is drawn from the sheet's *own* seeded stream, so a sheet
re-printed from its seed alone — off the rack, or off the back-of-the-shop stack — comes back on the
same paper. The two house sheets that greet a first visitor are pinned older (0.62 / 0.78): they have
been hanging here a while and the stock says so.

The deckle now runs on its own seeded stream (`seed|deckle<pull>`) rather than sharing the render's,
so the edge does not shift when the type above it happens to draw a different number of randoms.

### Two bugs in the liveness twin, found and fixed

Both were in the twin's *restore*, which claimed to put the visitor's shop back exactly and did not:

1. **The twin left the room panned away from the sheets.** Check (d) hangs a real sheet, and hanging a
   sheet pans the line to follow it. The restore never walked the view back, so a visitor who clicked
   SELF-TEST was returned to an empty stretch of rope — the two pre-hung broadsides, which exist
   precisely so the first impression is a working shop, were left off-screen to the left. `panX` /
   `panTarget` are now saved and restored with the rest.
2. **Every run of the twin burned an impression number.** The restore set `pullNo` back and *then*
   called `loadForme()` — but `loadForme()` runs `updateEmerge()` → `ensurePending()`, which takes
   `pullNo++` on its way out. So the next sheet came off numbered one higher for every run. The
   assignment now happens *before* `loadForme()`, one below where the visitor was, and lands exactly
   on their number.

The twin is now genuinely idempotent: three runs back-to-back leave `pullNo`, the pan, the hung
sheets, the rack and `localStorage` all exactly as found.

### Verification

- `window.__CENTO_SELFTEST()` → **6/6**, `PASS: true`, three runs in a row, state identical after each.
- **The forged sounds are not silent.** All five rendered through an `OfflineAudioContext` on the
  served page: peaks −5.5 to −8.9 dBFS, no clipping, no non-finite samples, every one with real
  audible content.
- **The whole sequence fires on the live path.** Unmuted with a true click (`ctx.state === "running"`,
  48 kHz), a real `PULL` produced 13 ratchet ticks through the revolution, one platen kiss at contact,
  four creaks through the strained stretch, then peg + rustle as the sheet hung — zero errors.
- **The hand crank still drives the forged press.** A CDP `Input.dispatchMouseEvent` drag around the
  wheel (not `dispatchEvent`) took `turn` to 1.0 and hung a sheet, redrawing the forged press body
  every frame with no errors.
- **The paper is order-independent**, the property check (f) would otherwise fail intermittently on:
  a sheet rendered alone and the same sheet rendered after three foreign sheets are byte-identical,
  with and without an explicit `age`. `age` genuinely changes the sheet.
- Judged by eye at all three sizes the sheet is seen at — 124 px in the rack, 262 px on the line,
  76 vh in the reading view. It holds at the smallest and does not go bare at the largest.
- No `Math.random` / `Date` / `performance.now` anywhere in the seven forged modules; `node --check`
  passes on each. No network, no web fonts, no absolute paths.
- 60.8 fps, clean console. `forge --check` all 168 current · `manifest --check` OK (unreachable 0).
- The door still resolves end-to-end: front door → The Print Room → The Cento Press.

---

## Cycle 428 (publish) — the fresh-eyes pass

Publisher review by **"Quoin"**. Served the repo root on :8853, `agent-browser` session `pub428`,
both torn down by exact PID / name.

### Two layout defects caught and fixed

Both were invisible to the self-test and to a clean console — neither is a *state* bug, so no twin
check could have seen them. They only show up when you look at the page at a size the builder didn't.

**1. The galley collapsed to one clipped slug in a short window.** `#shop` is a flex column in which
`#pressWrap` is `flex:0 0 auto` at a fixed 296 px (250 px under the 1240 px width breakpoint) while
`#galleyWrap` is `flex:0 1 auto` — so **every pixel of vertical shortfall lands on the galley**, and
only on the galley. Measured: at a 577 px viewport `#slugs` got **32 px of clientHeight against 441 px
of content** — one slug, cut through its second line, of seven. The standing galley *is* the piece's
thesis ("you cannot write here. you can only choose, and arrange"), so it is the last thing that
should be squeezed to nothing. Added a `@media (max-height:700px)` band that shrinks the press
(`scale(.72)`, `#pressWrap` 214 px) and floors `#slugs` at 74 px. At 620 px the galley now shows
three readable slugs on a scroller instead of one clipped one; the press never overflows the viewport
(bottom at 612 of 620).

**2. Both press captions shrank out of legibility with the press.** `#crankHint` is a child of
`#press`, not of `#pressWrap` — so the `transform: scale()` shrinks **its type along with the art**,
down to 7.6 px at the existing `.84` width breakpoint and 6.5 px at the new `.72` one. (`#chaseCap`
is a child of `#pressWrap` and does *not* scale, which is why it needed a `bottom` nudge instead.)
Counter-scaled the font in both bands — `10.7px` at `.84`, `12.5px` at `.72` — so the label renders
at a constant 9 px on screen at every size. Verified: `hintOnScreenH` is 14 px at 1440×900, 1280×720
and 1200×640 alike.

*A false trail worth recording:* the first fix attempt repositioned `#crankHint` with `left`/`bottom`
overrides, on the assumption it was anchored to the unscaled wrapper. It is not — those coordinates
are in **unscaled press space and get multiplied by the transform**, so every "correction" moved it
somewhere new and wrong. The overlap with the press base bar that prompted the repositioning turned
out to be **proportionally identical to the one at scale 1** — i.e. not a defect at all. Measure the
parent before you move a child inside a transform.

### Also fixed, in The Print Room

`#panel .sib-link` was `display:inline-block` with `margin:… 12px`. Vertical margins on an
inline-level box do not affect line-box height, so with **one** sibling link the rule was inert and
nobody noticed; adding **The Cento Press** as a second made the two links stack nearly touching.
Now `display:block; width:fit-content`, which makes the intended 8 px separation real.

### Verified after the fixes

- `window.__CENTO_SELFTEST()` **6/6 `PASS:true`** at 1440×900, 1280×720 and 1200×640.
- Twin idempotency re-confirmed independently of the builder: hung sheets / rack / `localStorage`
  identical before and after a run.
- **The payoff fires on a real input-level click** — `agent-browser click` on `PULL` (not
  `dispatchEvent`) hung a third sheet, the line panned to follow it, the counter went `3 hung · 1 wet`
  and the sheet entered its 10 s drying. The printed cento is visibly composed of the exact slugs
  standing in the galley above it.
- All four About-card cross-links (Print Room, Oracle, Letterer, Scriptorium) resolve **200**.
- `forge --check --all` **all 168 current** · `manifest --check` **OK — 435 pieces, unclaimed 0,
  unreachable 0**.

### Left as the builder left them

The room's lower-right dark expanse is **room, not a hole** — the floorboard grid reads as shop floor,
and the back-of-shop stack fills it as sheets retire. The ink slab and the press's left-heavy
composition are the foundry's honest residues; the forme injection hard-codes the bed's coordinates,
so re-centring is a spec change, not a polish pass.
