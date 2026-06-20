# The Speed You Can't Add — CHANGELOG

A race you watch, not a sum you trust. A translucent brass **ship** frame slides
along the lab rail at `u`; inside it a teal **deck** rail carries a cannonball
fired forward at `v` — a frame moving inside a moving frame. The ball's true lab
speed is where a guide-line drops it onto the lab rail, and it **crowds the lone
red `c`-mark but never crosses it**. Below the race a **rapidity ruler** lays the
ship's segment `φ_u` (brass) end-to-end with the deck's `φ_v` (teal); their summed
length lands *exactly* on the ball's lab φ-tick — the proof made of length.
Velocities don't add; the thing under them, **rapidity, does**. A leaf of **The
Moving Frame** wing (`relativity/`), reached in-wing only (NO new front-door
footprint). Kin to The Twin Voyage and The Starbow.

## #195 (2026-06-20) — bloom

Ripened the `[bench]` **The Speed You Can't (Quite) Add** seed (#161, sown #189)
into `relativity/speed-you-cant-add/`.

**The form (soul first).** The lab rail runs left→right with a lone pulsing red
`c`-mark fixed at β=1 on the right. Two physical throttles — **ship u** (brass)
and **deck v** (teal) — are draggable AND keyboard-operable (the focused slider's
native arrows step it; global ↑↓ nudge u and ←→ nudge v from anywhere, ⇧ for a
coarser step). The ship frame physically slides as u rises so its right inner edge
never overruns c; the cannonball is drawn at its deck home (a faint dot) with a
thin guide dropping to the bright lab marker — the **composed lab speed** — which
crowds the red `c` and stops short. The rapidity ruler stacks `φ_u` + `φ_v` and
prints the verdict **"lengths add → land on the tick ✓"**. The punchline preset
**u = v = 0.99c** reads **0.99995 c** via adaptive precision (never rounds to a
misleading "1.000"); a REST-BOTH preset zeroes both.

**The negative control (the falsifier).** A brass rocker (default **EINSTEIN**)
flips the law to **Galilean** — plain `u + v`, computed INLINE on the page
(`galileanAdd`), deliberately **not** in `core.mjs` (the core holds only true
physics). At the punchline the ball turns red and blows past c to **1.980c**, the
compose card goes red ("✗ > c"), the SUPER-LUMINAL banner shows, and the ruler
caption flips to *"ball is past c — it has no rapidity. The ruler can't reach it."*
Linear addition is visibly the wrong law.

**The math (single source of truth).** `relativity/core.mjs` — the estate's SOLE
special-relativity authority — grew INSIDE the `CORE BEGIN/END` byte-twin slab by
two exact functions (added to exports):

- `rapidity(β) = atanh(β)` — the additive coordinate of a boost
- `betaOfRapidity(φ) = tanh(φ)` — the inverse, saturating at ±1

The grown slab is inlined **byte-for-byte** into all importers (`relativity/index.html`,
`cavern/light-clock/index.html`, and this bench) — this page is a true byte-parity
importer: it `import * as CORE from '../core.mjs'`, **RUNS** the imported copy, and
its self-test asserts `import === inline`.

**The proofs.** In-page green pill, **6/6**, click for detail: (1) the hero identity
`velAdd(u,v) === tanh(atanh u + atanh v)` over ~5000 sub-c pairs (max |Δ| ≈ 1e-16);
(2) `tanh(atanh β) = β` round-trip < 1e-12; (3) the graft — N equal φ-wedges stacked
=== one β composed N times by velAdd, "lengths add" (max |Δ| ≈ 2e-16); (4) two
sub-c speeds never reach c; (5) the **strict** Galilean neg-control — `u+v > c` for
ALL u,v in **(0.5001, 0.999]** (the exact corner 0.5+0.5=c is luminal, not super-
luminal, so an inclusive ≥0.5 swath would be imprecise); (6) SINGLE SOURCE —
imported core === inlined byte-twin.

Node twin `relativity/core.test.mjs` = **26/26 EXIT 0** (was 22/22): a new block
(8R) adds the rapidity-addition identity (5041 pairs), the round-trip, the N-wedge
identity, and the strict Galilean super-luminal control (3721/3721, min sum 1.0002).
Byte-parity check group (e) stays green — the grown slab was re-inlined into both
asserted importers (`index.html` + `light-clock`).

**Registration.** Wing landing (`relativity/index.html`) Kin block bumped from
"four windows" → **"five windows"** and the bench line added; the front-door blurb
(`index.html`) count updated "three windows" → **"five windows"**; The Starbow's
Kin block gained a reciprocal link so all sub-pages cross-reference. Breadcrumbs
follow the Starbow precedent exactly (`← Observatory Rise` → `../index.html`,
`← The Orrery Estate` → `../../index.html`); the bench's own Kin links Twin Voyage
and Starbow with self highlighted.

**Verify.** Served on :8751; pill green, 0 console errors; punchline + Galilean
rocker driven live; 0px horizontal overflow at 360px & 390px; throttles + rocker
keyboard-operable; both back-links and the wing-landing Kin link resolve.
