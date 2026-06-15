# 🎲 The Seedbed Gauge — deterministic two-track cadence

The Workshop's loop used to read its mode (PLAN/BUILD) from **prose** in NOTES.md
and hope the director interpreted it right. Once that cost us a cycle (a `[bug]`
the director's scan missed). So the gauge is now **code with a self-test** — the
same "prove it exact" discipline every bench in the estate lives by.

The director **runs `node seedbed/gauge.mjs`** and obeys the directive. It never
guesses the mode again.

## Two tracks

| | **GARDENS** (small) | **GROUNDS** (big) |
|---|---|---|
| grow… | what already exists | new structure |
| plan | **gardener** files ≤3-line seeds | **groundskeeper** tailors sparks → grounds seeds |
| build | **planter** sows one (bench · cross · curation) | **grounds-worker** opens a wing · engine · metagame · map · medium |
| seed kinds | `exhibit` `cross` `curation` `grow` | `room` `engine` `metagame` `map` `medium` (+ any novel kind) |

A **big swing is anything bigger than an exhibit**: a new wing, a reusable
engine/tool/medium, a map expansion, a brand-new metagame layer. *Growing* an
existing wing (a new bench) or metagame (a new constellation/crossover) is
**garden** work.

## Lexicon

- **spark** — a few words, a raw gap. Big-track only. (`seedbed/` → ROADMAP `## ⚡ Sparks`.)
- **seed** — a **≤3-line provocation, not a spec.** The gardener *files* them; the
  groundskeeper tailors a spark into a (slightly longer) grounds seed.
- **ripen** — the builder's act: complete the design at build time (choose the how).
- **sow** — the builder brings a seed to life (build + ship).
- **bloom** — shipped → prune **with** provenance (CHANGELOG/worklog tombstone; "don't rebuild").
- **decay** — stale → prune **clean, no trace** (free to return later — a tombstone would bar it).

## How the gauge works

**Fuel is DERIVED, never hand-maintained.** `gardenFuel`/`groundsFuel` = the count
of live seeds in ROADMAP's fenced sections. Prune a bloomed seed and the fuel
drops on its own — no "fuel 5→4" arithmetic to drift, and a `cross` burns fuel
exactly like an `exhibit` (both are garden seeds).

Only the **counters** persist, in `state.json` (committed every cycle → durable
across loop relaunches, the ledger lesson):

- `cycle` — the durable monotonic cycle count (the loop's own `i` resets on relaunch; this does not).
- `lastGardenPlan` — cycle of the last gardener plan. `gardenBuilds = cycle − lastGardenPlan`.
- `lastBigSwing` — cycle of the last big swing. `groundsSince = cycle − lastBigSwing`.
- `bigSwingsBuilt` — monotonic contest counter (the decay clock for grounds seeds).
- `tally` — lifetime sown/bloomed/decayed per track, for the **decay-ratio readout** (target ~⅓ decay).

### The decision ladder (top wins)

1. **open `[bug]`** → `BUILD/bug` (a fix jumps the queue).
2. **swing time** (`groundsSince ≥ groundsInterval`) **and a ripe grounds seed exists** → `BUILD/grounds`. *Go wide.*
3. **grounds fuel below floor** → `PLAN/grounds` (groundskeeper restocks). *(Also where step 2 lands when it's swing time but the bed is empty — raise ambition, never fake a wing to satisfy a gauge.)*
4. **garden fuel dry OR garden interval reached** → `PLAN/garden` (gardener).
5. otherwise → `BUILD/garden` (planter). *The staple.*

### Decay (lazy birth-stamp — zero per-run bookkeeping)

Each seed carries its birth stamp; decay is computed when a tender reads the bed:

- **garden seed** — stamp `(sown #N)`; decays when `cycle − N ≥ gardenDecayAge`.
- **grounds seed** — stamp `(sown #N · contest #M)`; decays when `bigSwingsBuilt − M ≥ groundsDecayStrikes` (contests it was eligible for and lost).

Garden seeds flow fast (age in cycles); big swings are patient (punished only for
*losing when their moment came*, never for merely waiting).

## Thresholds (tunable — top of `gauge.mjs`)

`gardenFuelFloor 4 · ceiling 8 · interval 6 · decayAge 12` ·
`groundsFuelFloor 2 · ceiling 3 · interval 9 · decayStrikes 4` · `sparkFloor 3`.

Tuned for Brandon's instinct: **~⅓ of filed seeds decay, ~⅔ get sown** (enough
churn to keep ideas fresh, enough patience to give each a fair chance). Watch the
realized ratio in `--status`; adjust the decay windows if it drifts.

## Commands

```
node seedbed/gauge.mjs            # JSON directive for THIS cycle (the director reads this)
node seedbed/gauge.mjs --status   # human-readable gauge + decayed list + decay ratio
node seedbed/gauge.mjs record --mode BUILD --track garden [--bloomed n --sown n --decayed n]
                                  # the publisher applies the cycle outcome at cycle end
node seedbed/gauge.mjs --check    # validate state shape + show the directive
node seedbed/gauge.test.mjs       # the Node twin (41 checks: ladder · decay · cadence sim)
```

`record` is the **only** way state.json changes — deterministic, never hand-edited.
