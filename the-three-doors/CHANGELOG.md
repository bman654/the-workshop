# The Three Doors — bench log

The Monty Hall problem, made **countable**. Pick a brass door; an *informed* host swings open a
goat. Switch or stay — and the proof is not a chart but **area you can count**: the lit 3×3 grid of
all nine equally-likely worlds (where the car sits × which door you first picked). The six
off-diagonal worlds glow teal — switching wins, because a goat-pick *forces* the host's reveal — so
switching wins **6/9 = ⅔** as area, while a second derivation by **Bayes** lands the same ⅔ from the
host's likelihood (½ free when your pick is the car, 1 forced when it is a goat). The Numbers Room's
conditional-probability bench, kin to **The Belief Beam** next door: there belief pours between glass
vials as a posterior that sums to one; here that same Bayes step is a door you open with your hand.

The climax is the **neg-control**: flip the toggle to a *careless* host — a blind flick that
sometimes spills the car, **voiding** the round — and the SAME grid reshuffles *in place* to
**3/6 = ½**. The advantage vanishes. It was bought entirely by what the host *knew*, not by the wood.

## The 4-file house pattern (belief-beam / the-coin-that-lies discipline)

- **core.mjs** — the SOLE math authority. DOM-free, between `// === CORE BEGIN ===` /
  `// === CORE END ===` sentinels, exports outside the END. Nothing hard-codes 2/3: everything
  derives from `N = 3` doors via exhaustive enumeration of the sample space. `runSelfTest()` lives
  INSIDE the core so the page pill and the Node twin run the IDENTICAL checks (no drift).
- **index.src.html** — the forged page. `<!-- forge:include ./core.mjs -->` inlines the core
  byte-true; `<!-- forge:include ./door-art.js -->` inlines the door sprite module; the WS shared
  unlock module is inlined at the foot. The page holds ONLY presentation state (the played `tally`,
  the `visited` set, the door swing flags) and NEVER decides a win probability — every number comes
  from the core (`analyze`, `playRound`) over ONE shared tally.
- **index.html** — forged output (`node tools/forge/forge.mjs the-three-doors/index.src.html`).
- **core.test.mjs** — the Node twin. Imports the SAME core.mjs; includes the verbatim
  `coreRegion(path)` byte-twin block asserting char-identity with the inlined region.

## The API contract (page, twin, core all share it — STRING policy, never a boolean)

- `analyze(policy, n=3)` — `policy` is the STRING `'informed'` | `'ignorant'`. Returns
  `{ pSwitch, pStay, validMass, cells:[{car,pick,legal,branches,verdict,cellSwitchW,cellStayW,cellVoidW}] }`.
- `bayesPosteriorOnSwitch(n=3)` — the independent Bayes derivation (informed host) → `{ pStay, pSwitch }`.
- `playRound(policy, rng, n=3)` — one live/seeded round; `rng()→[0,1)`. Returns the played world or
  `{ voided:true, ... }` for an ignorant car-reveal.
- `monteCarlo(policy, trials, seed, n=3)` — seeded mulberry32 tally → `{ pSwitch, pStay, valid, voided, sw, st }`.
- `worlds`, `informedLegalOpens`, `ignorantLegalOpens`, `switchTarget` — the sample-space primitives.

(NOTE: the policy is a STRING throughout. A boolean would silently always-take the ignorant branch.)

## The four exact claims (twin + in-page pill, the SAME runSelfTest)

1. **INFORMED host P(win|switch)=2/3 and P(win|stay)=1/3**, derived BOTH by exhaustive enumeration
   over 3 car × 3 pick × host-choice (validMass=1, 6 of 9 cells win-switch, 3 win-stay) AND by Bayes
   (likelihood ½ when pick=car vs 1 when pick=goat) — each asserted EXACT (`±1e-12`), and the two
   agreeing to the bit.
2. **Seeded Monte-Carlo** (mulberry32) approaches 2/3 & 1/3 within `±0.01` — the SAME play the on-page
   gauges show; deterministic per seed.
3. **NEG-CONTROL — ignorant uniform host**, conditioned on goat-revealed rounds ONLY (car-revealed
   rounds voided/excluded), gives P(win|switch)=P(win|stay)=1/2 EXACT; `validMass = 2/3` (the off-diagonal
   void mass sums to exactly 1/3; the diagonal never voids). MC voided fraction ≈ 1/3.
4. **BYTE-PARITY** — the core region inlined into `index.html` is character-identical to `core.mjs`.

Twin: **35/35 checks pass**. In-page pill: **self-test ✓**.

## The form (why explorer-2's prototype won)

- **HERO (left):** three brass A/B/C doors — pick, the host swings open a goat (a *knowing* weighted
  paused arc for the informed host vs a *blind* fast flick for the careless one — the host's knowledge
  felt in the animation itself), then SWITCH or STAY by hand; all doors reveal car/goat; the played
  door flares teal(win)/red(lose). Two climbing play-gauges (switch vs stay) read the shared tally and
  converge on the dashed ⅔/⅓ marks. "Play 30 fast" montage + "Clear tally".
- **THE WORLDS (right):** the lit 3×3 grid — the exhaustive equally-likely sample space — fills as
  visited; 6 off-diagonal cells glow teal `switch✓`, 3 diagonal glow red `stay✓`; the AREA bar beneath
  climbs to exactly 67%/33%. Under the careless host the off-diagonal cells restripe to hatched
  `switch / ½ void` and the area bar collapses to 50%/50% — the reshuffle is the proof.
- **Grid mini-door icon** shows only the first legal host-open for compactness; the cell's verdict math
  (which aggregates BOTH host branches) stays the source of truth, not the single drawn icon.

## Art (in-house, forged — never foraged)

- **door-art.js** — the door sprite module (`THREEDOORS_ART.drawDoor(state)` → SVG face for
  `closed`/`goat`/`car`; `glyph(kind)` for the mini-grid). Shipped here as a strong hand-drawn brass
  placeholder (gold-on-ink-violet paneled door, teal roadster car, slate horned goat) so the proof
  reads even in greybox; the API is held stable for a foundry forge of a richer sprite set.

## Audio

- Gated behind a real user gesture (the first pick / toggle / mute click `unlock()`s the AudioContext);
  reads/writes the ONE shared estate mute via `WS.muted()` / `WS.setMuted()`. A soft brass latch on the
  host's swing (the knowing latch lands a touch later + softer than the careless clack), a teal chime on
  a switch-win, a dull tick on a stay-win or a void. Respects `prefers-reduced-motion`.

## Provenance

- Cycle #363 (garden / planter). Lifted from explorer-2's prototype
  (`/tmp/ws-explore-363-0-2-the-three-worlds.html`, "the-three-worlds") — the strongest WHOLE because
  the proof is COUNTABLE AREA, not a chart, and the neg-control is a dramatic in-place grid reshuffle.
  Folded in explorer-0's one genuinely-better idea: the host's *deliberate knowing* swing, distinct
  from the careless host's blind flick. Registered as a DEEPEN under the Numbers Room (a card added
  beside Belief Beam & The Coin That Lies; the landing's bench count bumped 27 → 28); front-door
  footprint unchanged (a bench under the standing roof, not a new structure).
