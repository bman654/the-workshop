# Puzzle Pavilion — `_planters/` (proven cores, not yet benched)

**This folder is now empty of planters — the Pavilion's three-leaf arc is complete.** The wing
shipped in cycle #51 with **one** fully-built leaf — **The Bridge House** (`../bridge-house/`);
**The Cross-Sums** (Kakuro) was promoted in **cycle #63** (`../cross-sums/`); and **The Pearl Loop**
(Masyu) was promoted in **cycle #69** (`../pearl-loop/`). The landing (`../index.html`) now shows
**three** live family cards and **zero** coming-to-leaf planters.

This folder held the **proven generation+solving cores** ahead of their benches — written and green
before the bench existed — so each remaining `[bench]` garden seed had a durable promotion path that
survived a `/tmp` wipe. **None remain.** If a future family is seeded, stash its proven core here under
an underscore-prefixed folder (kept out of the front-door surfaces; nothing links here) and follow the
promotion mold below.

| Planter | Core | Twin | Status |
|---|---|---|---|
| *(none — all promoted)* | — | — | — |

> **Promoted out of `_planters/`:**
> - The Cross-Sums (Kakuro) — now `../cross-sums/{core.mjs, core.test.mjs, index.html}`, a live leaf (cycle #63). Its core is **15/15** over 240 seeds (8 bases).
> - The Pearl Loop (Masyu) — now `../pearl-loop/{core.mjs, core.test.mjs, index.html, CHANGELOG.md}`, a live leaf (cycle #69). Its core is **all green** over 30 seeds @6×6: unique · deduced · deduced-loop ≡ reference · no-guess · negative control (remove/flip one pearl → count>1 or stall).

Re-run a promoted twin from its live home:

```
node puzzle-pavilion/pearl-loop/core.test.mjs
node puzzle-pavilion/cross-sums/core.test.mjs
```

## To promote a planter to a live leaf

Follow the Bridge House mold exactly (it is the reference for the whole wing):

1. Move/copy this `core.mjs` to `puzzle-pavilion/<leaf>/core.mjs` (the SOLE authority) and its
   twin to `<leaf>/core.test.mjs`; re-run the twin green.
2. Build `<leaf>/index.html` as a fresh production bench mirroring `../bridge-house/index.html`
   (responsive canvas, the play verb, a Reveal-logic trace, Hint, a live-state card, an in-page
   self-test pill). Inline the core **BYTE-IDENTICAL** between `// === CORE BEGIN ===` /
   `// === CORE END ===` and keep the diff-true invariant.
3. Register it on the Pavilion landing: flip the planter card to a live family card with an
   `→ <leaf>/index.html` link (mirror the Bridge House card).
4. Add a `<leaf>/CHANGELOG.md`, prune the matching `[bench]` seed to a bloomed tombstone, and
   carry the worklog/NOTES bookkeeping.

The original explorer prototypes (the canonical source for each family's full bench shell, including
the play UI the cores predate) were `/tmp/ws-explore-51-0-1-B-Kakuro-*.html` and
`/tmp/ws-explore-51-0-2-C-Masyu-*.html` — volatile; if gone, the cores here plus the Bridge House
mold are enough to re-derive a bench.
