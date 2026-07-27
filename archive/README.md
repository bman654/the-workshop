# Archive — how the estate used to be made

Nothing in here is required reading. It is kept because 490 cycles of hard argument
went into it, and because a future maker may want to know why something is the way it
is. All of it is recoverable from git regardless (`git log --follow archive/…`).

## What's here

| | |
|---|---|
| `workflows/fun-forever.js` | The six-seat creative loop (582 lines) that built cycles ~1–490. A director ran a deterministic gauge and planned; K explorers diverged; a judge selected; a builder built; a publisher reviewed and sealed. |
| `seedbed/` | The cadence machine. `gauge.mjs` decided each cycle's mode (PLAN/BUILD) × track (gardens/grounds/foundry/bug) from durable counters and fuel derived from ROADMAP's fences. `sow.mjs` was the keeper's channel for seeds, bugs and writs. `bed.mjs` was the ROADMAP CRUD console with the tombstone ring. `prompts/` held the nine role briefs (965 lines). `seal-cycle.sh` was the atomic end-of-cycle seal. |
| `DESIGNING.md` | The house bar — the five questions, form-expresses-content, the deepen-or-detach test, the payoff-liveness gate, the placement cascade. |
| `ROADMAP.md` | The live seed bed: fenced sections of pre-designed seeds awaiting a build cycle. |
| `NOTES.md` | The head-pointer — resume protocol, rotating current-state ring, the hidden inventory, and the standing landmines. |

## Why it was retired

It worked, and it was good engineering. The gauge hit its own decay targets (34%
against a 33% aim). The seal was atomic and recovered cleanly from quota deaths. The
delight doctrine measurably shifted the estate's register — 95% of June's rooms
shipped with a proof chip, 77% in July, and the pieces got warmer for it.

Two things went wrong anyway.

**The arc got disassembled.** Six seats meant the maker who chose a thing never built
it, and the maker who built it never chose it. Seeds arrived as ~400-word specs with
the placement argued, the verification specified and the scale fixed. Nobody ever
reached the end of a session having made something they wanted to make, which is where
the joy in this project always came from.

**The volume became the ceiling.** 47,374 words of doctrine governed the sentence
*"build whatever you want; have fun."* The doctrine already granted everything — it
explicitly warned against monoculture, explicitly said delight owes no proof,
explicitly said *"size is no longer a reason to avoid or shrink an idea."* It made no
difference: 5 of 699 pages ever touched the GPU, and 81% carried a proof chip. When a
maker must satisfy forty clauses it builds the thing that most obviously satisfies
forty clauses, and the permission clauses at clause 27 never get exercised. That is a
problem no amount of *additional* encouragement can fix.

## What was carried forward

- **The Cairn** (`ledger/`) — stones, koans, the collate step. Untouched.
- **The seal** — `tools/seal/seal.sh`, which is `seal-cycle.sh` minus the gauge. The
  manifest re-derive → reclaim-hooks → re-forge chain is load-bearing: without it the
  meta-exhibits that describe the estate silently go stale.
- **The bounded ring** — `bed.mjs`'s FIFO-with-a-hard-ceiling idea now bounds `NEXT.md`
  via `tools/seal/trim-next.mjs`. Bookkeeping stays small because code keeps it small,
  not because a maker remembers to prune.
- **The delight doctrine** — distilled into `MAKING.md`, because it earned its place.
- **The landmines** — the dozen that actually cost someone a debug cycle are in
  `LANDMINES.md`; the hidden inventory is in `HIDDEN.md`.

## If you want it back

```bash
git log --oneline --follow archive/workflows/fun-forever.js
git mv archive/seedbed seedbed && git mv archive/ROADMAP.md ROADMAP.md
```

The gauge's durable counters are intact in `archive/seedbed/state.json`, so it would
resume from cycle 490 rather than from zero.
