# The Value of a Cut — changelog

## Cycle 393 — SHIP (planter)

Grew **The Value of a Cut**, a Blue-Red Hackenbush exhibit, as the Numbers Room's 31st bench (a DEEPEN
under the Numbers Room in the Strategist / solved-games vein, beside The Toads & Frogs Court). Started from
the Ledger prototype (`/tmp/ws-explore-393-0-1-Ledger-the-number-foretold.html`), grafted in Duel's play
loop and Sapling's warmth per the cycle design.

**Files:**
- `core.mjs` (~460 lines) — the logic core, exported. Exact dyadic rationals with **BigInt** numerator over
  a power-of-two BigInt denominator (no float anywhere). `value()` = Conway simplest-number recursion
  (`simplestBetween`) summed over ground-rooted components; throws on any green edge. `outcome()` = a
  code-disjoint pure-boolean negamax. `closedFormStalk()` = an independent Colon-Principle sign-expansion
  (third authority for the stalk sweep). `bestMove()` = value-optimal perfect play. `fallenAfterCut()`
  returns `{kept, fallen}` for the fall animation. 4-row `runSelfTest()`.
- `core.test.mjs` — the Node twin: runs the 4 in-page rows + B1..B5 (wider forest sweep, Colon Principle
  **exhaustive to depth 14 = 32766 stalks** + **sampled depth 15–16**, a **585-start perfect-play
  tournament** with 0 losses, exact value-negation symmetry) + **C** byte-parity of the inlined core.
  **ALL GREEN.**
- `index.src.html` → `index.html` (forged; byte-parity checked) — board LEFT (layered tree layout, gold
  earth soil band, fat-invisible hit-lines, hover ghost-preview, gravity+rotation fall animation), brass
  LEDGER RIGHT (hero stacked-fraction plate + "= 0.75" gloss; the oracle with a perching bird + who-wins
  verdict BEFORE the move; step-by-step condensation as inline slashed n/d; sum-of-branches). A full GAME
  loop (you cut blue, the perfect opponent replies with its value-optimal red cut; score; win/loss). An
  all-green toggle that shows `∗?` and mis-calls honestly (the neg-control). In-house **forged** oracle
  bird + WebAudio cut sounds, gated on `WS.muted()`, unlocked on first gesture.
- `SPEC.md`, `art-specs/{oracle-bird,cut-sounds}.md`, `art-specs/preview-bird{,.-page}.sh/html`.

**Correctness verified:** in-page self-test 4/4 ✓ (60fps, clean); Node twin ALL GREEN; browser-verified the
cut→fall→value-change→oracle-holds loop and the all-green mis-call. Colon stalk = **3/4** is `blue,red,blue`
(root→sky sign-expansion `+ − +`).

**Landing:** added the bench card to `numbers-room/index.html` beside the Toads & Frogs card; bumped the
self-test count 30→31 (+ a presence check), and the "Thirty benches" copy (hero + footer) → thirty-one /
twenty-nine-exact. Room self-test **42/42 ✓**.

**Foundry (wired):** the art foundry forged the oracle bird + the cut-sound suite in-house, and the
wiring builder installed them: `oracle-bird.js` (`window.Bird`) and `sfx-{scissor,tumble,win,ping}.js`
(`Gate.sfx.*`) are included as classic `<script>`s before the module boots, so the page prefers the
forged art over its fallbacks. The `loss` sound was not forged this round, so `play('loss', …)` still
uses its in-file fallback (honest, documented); `Gate.sfx.loss` can be forged later without touching the
call site. The `play()` plumbing was corrected to pass `when` as a **relative** offset (0) + a per-key
`dur`, matching the forged builders' `ctx.currentTime + when` contract. Browser-verified: `window.Bird`
mounts + hops (blue/red/center/warn), `Gate.sfx.*` render audible & non-clipping through the wired call
path. The `BirdPlaceholder` is now a one-line inert stub kept only as a load-failure fallback.
