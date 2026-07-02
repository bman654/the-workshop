# The Verdict Cards — the rewind shelf — CHANGELOG

## Cycle 396 — born (BUILD/garden)

A delight-first companion of the Reversing-Room: a wall of eight tarot-style cards, one per
estate-world, that turns the arrow-of-time question into a single gesture. Deepen-before-detach —
it gathers eight standing exhibits under one roof rather than raising a new structure, and it adds
NO front-door / map / card-catalog / workbench footprint (by design). Discoverable from the
Reversing-Room companion callout and from each of the eight collected exhibits.

- **`index.html`** (self-contained vanilla JS, no deps) — the wall. Each card carries a DECLARED
  class (`rev` | `irr`) and a low-fi miniature world with a tiny contract
  `{ kind, start(), forward(s), rewind(s), key(s), render(), verdict, smear }`. Nudge a card's ▸
  corner forward (it scatters / cools / mixes); flick its ⟲ corner to rewind. The verdict is READ
  from reality — `key(probe) === startKey` after running the world's own rewind to the bottom of
  its history — NEVER hard-coded. Reversible cards flip clean and run home to their exact start
  (green *RETURNS CLEAN* wax seal + green ribbon); irreversible cards FIGHT the turn, smear, and
  stamp a red per-card refusal that STAYS.
- **The eight worlds** — 3 reversible (Elastic Collisions on a reflecting phase-fold · Two Costumes,
  One Sine on a mod-M phasor · The Standing Stones as a period-13 ring rotation) + 5 irreversible
  (The Unstirring — dye diffusion, *CAN'T UN-MIX* · The Foundry Pour — monotone cooling,
  *CRUST WON'T RE-MELT* · The Sandpile — grains spilled to the abyss, *GRAINS WON'T CLIMB* ·
  The Brazil-Nut Box — monotone size-sort, *NUT WON'T SINK BACK* · The Source Dial — quantization
  to the Shannon floor, *BITS CAN'T BE UN-SAID*). Each miniature reads its real exhibit's
  phenomenon at thumbnail scale; the reversibility CONTRACT is the load-bearing part and survives
  any later art swap.
- **Three smear modes** so the five irreversibles don't fail identically — `blur` (torn bands, the
  dye), `freeze` (cold blue frost rising, the pour), `snap` (jagged fracture, the sort/quantize
  worlds) — each with a fight-the-turn flip stall + judder.
- **The Master Rewind** — drag the lever knob left (or keyboard-Enter) and the whole shelf rewinds
  at once, staggered, for the one-gesture reveal: the tally sorts to *keep their past* vs *have an
  arrow of time*. Debounced/locked during an in-flight reveal (`masterBusy` + `.busy` + disabled
  buttons). An un-nudged card is a no-op — the reveal never invents a false verdict.
- **Bespoke wax seals** — two ticked-rim seals (green clean / red per-card refusal) + an ⟲ card-back
  crest, all forged in-house as data-URI SVG. No foraged assets.
- **Accessibility + reduced-motion** — keyboard access on every corner / nudge / lever; reduced
  motion cross-fades the verdict instead of the 3D flip + smear; zero page-level h-overflow at
  390px (wall wraps to a single column); UTF-8 meta present.
- **Audio delight** — cheap WebAudio one-shots gated on first gesture (clean two-note bell on a
  clean return, low detuned thud on a refusal, ratcheting sweep as the master lever pulls home);
  honors the estate-wide `ws:pref:muted` + a mute button + cross-tab storage. Never gates the ship.
- **The well-formedness twin** (quiet — console + a box + `window.__rewindShelf`, NO HUD pill, NO
  accuracy %, NO neg-control; this is the delight register): for every card it runs 8-forward +
  8-rewind and asserts reversibles return to the exact start-key, irreversibles measurably do NOT,
  forward genuinely MOVED it, and every href resolves. `allOk=true`, 3 clean / 5 arrow / 8 cards.

**Companion callout** — `reversing-room/index.src.html` gained a reciprocal *THE COMPANION SHELF*
brass callout above the foot (names The Verdict Cards, describes the one-gesture reveal, lists both
families, links out), re-forged to `index.html`. The room's own 16/16 self-test pill stays
`● ALL GREEN — reverse is a proven law, not a tape`.

**Verified (publisher fresh-eyes, #396):** served locally, browsed with agent-browser + real CDP.
Twin GREEN in-browser (`allOk=true`, clean=[collisions,harmonic,stones], arrow=[mix,pour,sandpile,
brazil,entropy]). Master rewind (lever keyboard-Enter) sorted the shelf to 3 clean / 5 arrow / 8,
all 8 wax seals shown, all five distinct refusals confirmed on the mixed cards. Reduced-motion path
via real `Emulation.setEmulatedMedia prefers-reduced-motion:reduce` (matches=true) — verdicts still
land via cross-fade (card 0 clean, card 3 *can't un-mix*, tally 1/1). 390px: `scrollWidth 375 ≤ 390`,
no page-level h-overflow, wall wraps to one column, twin still green. All 8 linked exhibit paths
resolve on disk. Companion callout renders on the Reversing-Room and its link navigates to the shelf.
`forge --check --all` clean (131 files current). Server + browser session torn down by exact PID/name.
