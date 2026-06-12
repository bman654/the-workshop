# Loomlight — interactive weaving loom (SPEC)

*A tactile digital floor-loom. Set the threading, tie-up, and treadling and watch real woven
cloth form — by the exact loom equation. A single self-contained vanilla HTML/CSS/JS file:
no deps, no network, no audio.*

Home: `loom/index.html`, reached from the **front-door footer** as a new off-to-the-side text
link (`weave ·`) beside `puzzles · colophon · source`. **The curated 9 front-door cards are NOT
touched.** This is NOT a puzzle (it has no win state / no unique-solution crux), NOT an arcade
cabinet, NOT audio, NOT a seeded visual "press" generator — it is an **interactive tactile toy**:
the whole point is the pleasure of manipulating the loom and seeing cloth appear.

---

## Why this diversifies

The workshop is deep in: visual presses (watch/seeded), logic puzzles (solve), arcade (play),
sound garden (audio), companions (all 7 wings full), and a mythology/words family. It is THIN on
**digital toys** — things whose only point is tactile manipulation — and has **no fiber/textile
craft** at all ("Loom" in the Sound Garden is an *audio* instrument; Ariadne weaves *Celtic knots*,
a different domain). Loomlight opens the under-used "tactile toy" vein with a brand-new subject
(handweaving) and keeps the workshop's signature: a **provable correctness crux** + seeded repro.

---

## The model — the weaver's draft (the real notation)

A four-shaft (extensible to N) floor loom is fully described by three small integer structures.
Let `W` = number of warp ends (columns), `P` = number of picks/weft rows, `S` = shafts, `T` =
treadles.

- **threading**: `int[W]` — for each warp end, which shaft (0..S-1) it is heddled on.
- **tieup**: `bool[T][S]` — for each treadle, which shafts it raises (a rising-shed loom).
- **treadling**: `int[P]` — for each pick, which treadle is pressed.

**The loom equation (THE crux).** Warp end `e` floats *over* weft pick `p` (i.e. the warp/yarn
color shows on top) **iff** the shaft that end is on is raised by the treadle pressed on that pick:

```
warpOnTop(p, e)  ==  tieup[ treadling[p] ][ threading[e] ]
```

The full **drawdown** is the boolean matrix `D[p][e] = warpOnTop(p,e)`. Everything visible derives
purely from this matrix — there is exactly one source of truth.

This is the *standard* drawdown computation in handweaving software (e.g. the "tie-up draft").
It is deterministic and exact; no floating point.

### Color-and-weave

- **warpColors**: `color[W]`, **weftColors**: `color[P]`. The displayed color of cloth cell `(p,e)`
  is `warpColors[e]` if `D[p][e]` else `weftColors[p]`. (This is what makes log-cabin / houndstooth
  effects emerge from color sequences, independent of structure.)

---

## Named weave structures (presets, each with a generator + a provable invariant)

Each preset is produced by a pure function of `(S, params)` and carries a class-invariant the
self-test checks on the *resulting drawdown*:

1. **Plain weave (tabby)** — 2 shafts, threading `0,1,0,1…`, treadling `0,1,0,1…`, tie-up raises
   alternating shafts. *Invariant:* perfectly alternating — every row and every column alternates
   true/false; **max float length == 1** everywhere.
2. **2/2 Twill** — 4 shafts straight draw `0,1,2,3,…`, treadling straight, tie-up = each treadle
   raises 2 consecutive shafts (sliding window). *Invariant:* every warp & weft float is **exactly
   length 2**; the diagonal **steps by exactly 1** end per pick (twill line); period 4.
3. **1/3 & 3/1 Twill** — single-float vs three-float diagonals. *Invariant:* float lengths exactly
   {1,3} per the ratio; consistent diagonal step 1.
4. **Herringbone / point twill** — point-draw threading `0,1,2,3,2,1,0,1,2,3,…`. *Invariant:* the
   twill diagonal **reverses** at the turning points (zig-zag); locally valid twill floats away from
   the points.
5. **Satin (5-end)** — 5 shafts, a satin **move number `m` coprime to 5** (m=2 or 3). *Invariant:*
   the single raised point per pick is **isolated** — no two warp floats adjacent on any row OR
   column (the defining property of satin); the move number is coprime to the cycle.
6. **Basket / Panama** — doubled plain weave (2/2 basket). *Invariant:* floats exactly length 2 in
   a checkerboard of 2×2 blocks.
7. **Rosepath** — a classic point-threading motif treadled as twill; mainly an aesthetic preset
   (validated only against the loom equation, no special class invariant).
8. **Waffle weave** — concentric-float diamond on 4–5 shafts (aesthetic preset; loom-equation only).

A **"Surprise me" (seeded)** button generates a random *coherent* draft: pick a structure family +
random palette from `seed`; reproducible (`?seed=` / shown seed / re-roll).

---

## Interaction (the tactile heart)

The screen shows the **draft** in proper weaving layout:

```
                 [ THREADING ]  ← top strip, one cell per warp end, rows = shafts
[ DRAWDOWN ]  ............................  [ TIE-UP ]   ← right block, treadles × shafts
   (the cloth)                              [ TREADLING ] ← right strip, one cell per pick
```

(Standard handweaving "computer draft" arrangement: threading across the top, treadling down the
right, tie-up in the top-right corner, drawdown filling the main field.)

**Direct manipulation — every part is clickable/draggable:**
- Click a **threading** cell → cycle that end to the next shaft (or drag up/down to set shaft);
  drag horizontally to paint a run. Cloth re-weaves live.
- Click a **tie-up** cell → toggle that shaft on that treadle.
- Click a **treadling** cell → cycle that pick to the next treadle; drag to paint a run.
- Click a **warp color** swatch (a thin strip above threading) / **weft color** swatch (beside
  treadling) → cycle the yarn color from the active palette; drag to paint color runs (this is how
  you "thread the loom" for log-cabin etc.).
- The **drawdown is read-only** (it's the *result*) but hovering highlights the contributing
  threading end + treadling pick + tie-up cell (shows the loom equation live — a teaching moment).

**Controls:** structure preset menu · shafts/treadles selector (2,3,4,5,6,8) · warp/weft count
sliders (e.g. 16–64) · palette menu (curated yarn palettes) · **Surprise me (seed)** + seed box +
re-roll · **view toggle: Cloth ⇆ Draft** · **Clear** · **PNG export (2×)**.

**Two render modes:**
- **Cloth view** (default, tactile): render the drawdown as fabric — each cell a little shaded
  thread segment (warp = vertical fibre, weft = horizontal fibre) with a soft round-bump highlight
  and a subtle drop so floats read as raised; gives a real woven-cloth feel. Optional faint warp
  tension lines. This is the "toy" view.
- **Draft view**: the technical notation — filled/empty squares for threading, tie-up, treadling,
  and the boolean drawdown — what a weaver actually reads/writes. Toggling between them must NOT
  change the underlying draft (cosmetic only — a self-test check).

Aesthetic: warm workshop palette consistent with the rest of the workshop (dark ground, accent
glow), the cloth tile feeling soft and physical. Smooth 60fps; the re-weave is O(P·W) and trivial.

---

## Self-test (the workshop's quality bar) — runs headless on load, green chip, never ships red

A pure core (`computeDrawdown(threading, tieup, treadling) -> bool[P][W]`, no DOM) drives a
**headless multi-check self-test** that calls the REAL functions (not a parallel copy), logs PASS
per check to console, and shows a small green **"weave verified — N/N ✓"** chip (red on any fail,
but it must never ship red):

1. **Loom equation (exactness)** — for several drafts (each preset + random seeds), independently
   recompute `D[p][e]` from the loom equation and assert it equals the cloth-renderer's source
   matrix AND equals the displayed cell colors per the color rule. Exact boolean match, 100%.
2. **Plain weave invariant** — generated tabby: every row and column strictly alternates; max float
   length == 1.
3. **Twill invariants** — 2/2 twill: every warp & weft float length is exactly 2; the diagonal
   offset increments by exactly 1 (mod period) each pick. 1/3 & 3/1: float lengths exactly {1,3}.
4. **Satin invariant** — 5-end satin with move m∈{2,3}: gcd(m,5)==1, and the raised warp points are
   isolated (no two adjacent on any row OR column) — the satin-validity proof.
5. **Color-and-weave** — for a log-cabin warp/weft color sequence over plain weave, the displayed
   colors match `warpColors`/`weftColors` selection per the drawdown exactly.
6. **Seed purity / view-invariance** — same seed ⇒ byte-identical draft fingerprint
   (threading+tieup+treadling+colors); a fresh seed differs; toggling Cloth⇆Draft view and switching
   palette do NOT change the drawdown fingerprint (cosmetic-only crux, à la the rest of the workshop).

Aim for ~6 checks, all PASS. The sweep should cover all named presets across shaft counts.

---

## Acceptance / verification

- Single self-contained `loom/index.html`, vanilla HTML/CSS/JS, **0 deps, 0 network, NO AUDIO**.
- Self-test green N/N on load; **never ships red**.
- **Browser-verified end to end** (agent-browser, served origin for any localStorage):
  - chip green N/N, **0 console errors / 0 warnings / 0 page-errors** across the full battery
    (every preset, all shaft counts offered, both view modes, palette switches, Surprise-me re-rolls,
    seed reproduce-byte-identical, PNG export valid non-blank);
  - **direct manipulation exercised with REAL pointer events**: edit a threading cell → cloth changes
    correctly per the loom equation; toggle a tie-up cell → correct change; edit treadling → correct;
    paint a color run → log-cabin effect appears; hover the drawdown → the contributing
    threading/treadling/tie-up cells highlight;
  - 60fps; plays from `file://` too (all storage try/catch-guarded).
- Drops a breadcrumb `ws:seen:loom` (try/catch-guarded) for future hidden-world use. **No Undercroft
  secret added** this session — just the breadcrumb.
- Wiring: add a `weave ·` text link to the **front-door footer** (beside `puzzles ·`); a
  `← workshop` back-link in Loomlight's topbar; a short **"Also on the workbench"** README entry.
  **Do NOT add a 10th front-door card, a companion pill, or redesign the front door.**
- Docs: this SPEC + a new `loom/CHANGELOG.md` (Build 1). Update `NOTES.md` (new pointer at the very
  top; preserve the existing reverse-chronological pointers) — but do NOT write any
  "session paused/ended" wind-down (the lead's session is still running).

## Out of scope / non-goals
- No audio of any kind.
- No win/lose state, no unique-solution generation (this is a toy, not a puzzle).
- No network, no external fonts/libraries.
- Keep the file well under ~1500 lines if reasonable; correctness + tactility over feature sprawl.
```
