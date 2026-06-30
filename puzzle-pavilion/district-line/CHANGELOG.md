# The District Line — CHANGELOG

A redistricting bench. A **frozen** electorate — a 5×5 grid of single-vote red/blue tiles, 13 RED ·
12 BLUE — that you **carve** into K=5 equal-population, orthogonally-contiguous districts with a
surveyor's pen. The split never changes; only the lines move. The instant a valid map closes, every
seat-**buying** vote blooms full and every **wasted** vote drains to a hollow grey pip — so the
imbalance of drained pips you scan *is* the efficiency gap, before a single dial moves.

The Pavilion's **fifth** bench and its first **civic** puzzle — and the estate's first **carve** verb.
The four siblings are generated *deduction* puzzles (connect · fill · draw · rotate); this one turns the
verb outward: you draw the lines, and the bench proves the gerrymander exact.

## v1 — cycle #365 (built, benched)

1. **The math core** (`core.mjs`) is the SOLE DOM-free authority, **integers only in the law**, wrapped
   between `// === CORE BEGIN ===` / `// === CORE END ===` and inlined **BYTE-IDENTICAL** into
   `index.html` (verified char-for-char at build + by the in-page byte-twin parity check):
   - `isValid(board, assign)` — a partition is valid **iff** every district is one orthogonally
     (4-neighbour) **contiguous** blob (a BFS flood == its size) **and** equal-population within the
     apportionment remainder: base = ⌊N/K⌋, the +1 cells to the **lowest** district ids. Returns
     `{valid, perDistrictPop, reason}`.
   - `wasted(board, assign)` — per district winner = majority (**tie → RED**, stated + printed),
     threshold T = ⌊pop/2⌋+1; a winner wastes votes above T, a loser wastes all of its. Returns
     `{wastedRed, wastedBlue, perCell}` — `perCell[i]===1` iff tile i's vote was wasted. **`perCell` is
     the single contract the drained-pip overlay AND the EG fraction both read**, so the map and the
     number can never drift.
   - `efficiencyGap(board, assign)` — num = wastedRed − wastedBlue, den = N, **gcd-reduced**; the
     favoured party is the one that wasted fewer votes. Any decimal is a separately-labelled `≈` gloss,
     never the proven value.
   - `enumeratePartitions / countPartitions / analyzeElectorate / searchCertificate` — **exact canonical
     enumeration** of valid partitions by connected-subset growth (seed the next district at the lowest
     unassigned cell, grow a connected subset of exactly its quota, recurse), deduped by the
     **forbidden-set** method (every added cell index > seed AND a per-level forbidden set). From the full
     enumeration the page reads PACK (max BLUE seats), CRACK (a distinct BLUE=3 map), and COMPACT =
     **argmin |EG|** (the gap-minimizer — always well-defined). `searchCertificate` answers a card's claim
     with a witness (reachable) or an exhaustive no-solution proof (impossible, count shown).
2. **The page** (`index.html`) clones the Pavilion mold on a slate-and-brass surveyor's table: deep-sea
   ground, teal accent, estate gold, serif hero, the topbar + self-test pill + back-link, a responsive
   560-baseline board canvas (0 overflow @1280 and @375). Drag the **surveyor's pen** to paint tiles into
   the active district (a translucent district wash under the disc + a **2px gold marching boundary**
   between differently-districted tiles); a palette chip picks the district, the eraser frees a tile.
   Painting is **permissive** — over-quota / non-contiguous districts wear a soft red hatch and read
   *invalid* live, never hard-blocked. The **load-bearing render**: on a complete valid map, every wasted
   vote tweens to a hollow grey-rimmed pip; a per-district drain animates over ~220ms. The **brass
   instrument** beside the board is the receipt — a half-circle dial reading BLUE's seat-share, a frozen
   grey **VOTES** needle, a live brass **SEATS** needle, and a colored **divergence wedge** filling the
   arc swept between them (teal when BLUE is over-represented, amber when under) — **no bar chart
   anywhere**. Below: EG as a gcd-reduced fraction with the running drained tally echoing the visible
   pips (`drained: 4R · 6B → R−B = −2 = EG numerator`).
3. **The spine — one frozen electorate, opposite seats.** **PACK** loads the max-BLUE-seats map (RED
   crammed into one throwaway district → BLUE 4 of 5, EG +2/5); **CRACK** loads a distinct BLUE=3 map (RED
   cracked thin → EG +4/25) — two abuses, the same theft; **COMPACT** loads the argmin-|EG| map on the
   IDENTICAL voters (RED 3 / BLUE 2, EG −2/25 — the gap collapses to its proven minimum). A freeze-frame
   button cycles PACK → CRACK → COMPACT on the same votes. Caption: *"Same voters. Honest lines. The gap
   was the drawing."*
4. **The challenge deck** — four hand-authored cards, each carrying a **precomputed certificate** the page
   AND the Node twin both re-derive from scratch (never trusting a stored witness): *Carve so BLUE wins ≥3
   of 5* (REACHED), *≥4 of 5* (REACHED — only 8 of 4006 maps), *all 5* (**IMPOSSIBLE** — a 12-vote minority
   cannot sweep; 0 of 4006), *RED ≥4 of 5* (REACHED — the abuse runs both ways). Tap a reachable card to
   load its witness map.
5. Drops `ws:seen:district-line`. Boots on the COMPACT (honest) map so the bench opens alive.

### The math claim, self-tested (pill ≡ twin)
The in-page pill runs the **same eight numbered claims** as `core.test.mjs`, in the same order, on the
same inlined core + shared deck — so the pill's check-count ≡ the twin's:
1. **validity sound** — every shipped map re-floods contiguous + on-quota; a torn map is rejected (named
   reason).
2. **wasted exact + conserved** — integer identity `wastedRed + wastedBlue === total − ΣT_d` per board;
   COMPACT wRed=4, wBlue=6 (worked example).
3. **EG reduced + the FORM↔CLAIM tie** — `(drainedRed − drainedBlue)` pips **===** the EG numerator on
   every map (the map IS the number), the fraction gcd-reduced; COMPACT −2/25 (RED), CRACK +4/25 (BLUE).
4. **the enacted theorem** — PACK/CRACK/COMPACT are all valid partitions of the SAME vote array yet seats
   differ by ≥1 (COMPACT RED 3/5 vs PACK BLUE 4/5).
5. **certificate honest** — every deck card re-derived from scratch (witness valid + hits target /
   exhaustively impossible, searched === full count).
6. **neg-control real** — COMPACT |EG| ≤ **every** valid map's |EG| (the twin enumerates all 4006 and
   confirms COMPACT is the proven gap-minimizer).
7. **partition-count dedupe gate** (the one landmine) — blank-electorate valid-partition counts hit the
   hand-checked truths: 3×3/K3 = **10**, 4×4/K4 = **117**, 4×5/K5 = **454**, 5×5/K5 = **4006**. (A wrong
   `>last`-shortcut dedupe gives 6 instead of 10.)
8. **byte-twin parity** — the inlined core (between the sentinels) === `core.mjs` char-for-char (degrades
   to skipped-OK on `file://`, enforced by the Node twin regardless).

### Verified live (cycle #365)
- `node core.test.mjs` → **OK 8/8** (hero 4006 valid maps · 4 deck cards · all eight claims green).
- In-page `runSelfTest()` → `{ ok:true, 8/8 }`; byte-twin parity **byte-identical** over HTTP.
- Fresh-eyes browse: the COMPACT/PACK/CRACK spine drives the SEATS needle + divergence wedge visibly;
  PACK drains the packed RED block to grey while BLUE takes 4 of 5; COMPACT collapses the wedge to a
  sliver; the EG fraction is correct, reduced, and equals the drained-pip imbalance; a deliberately torn
  district wears the red hatch and reads invalid live; the IMPOSSIBLE card reports *0 of 4006*. Clean
  console; no audio.
- @1280 and @375: zero horizontal overflow. Strategy clicks < 0.5 ms (analysis cached after first build).

### Art
Greybox-but-alive in-house visuals: the brass two-needle dial + divergence wedge as one slate instrument
face (canvas arcs), the surveyor's-pen crosshair cursor + engraved 2px gold boundary, and the 2-frame
disc→hollow-grey-pip drain tween. No foraged assets. Audio omitted (the bench is fully alive silent); a
future foundry pass could forge a richer instrument face + a parcel "REACHED/IMPOSSIBLE" stamp.
