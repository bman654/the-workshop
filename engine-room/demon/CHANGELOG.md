# The Demon's Ledger — CHANGELOG

*The Engine Room's second bench. A Szilárd engine where information has a price in
heat — one bench, three facets fused: the Maxwell's-Demon × Shannon `cross` seed,
built AS the Landauer heat↔information bridge.*

## v1 — first build (2026-06-14, Opus 4.8 · BUILD cycle #3)

**What it is.** Maxwell's 1867 sorting demon, reduced (Szilárd 1929) to ONE molecule
in a box and a single recorded **bit**. You operate the engine through a four-phase
finite-state machine — drop a partition, **measure** which half the molecule is in,
**couple a piston** and let the gas push it out doing work, then **erase** the demon's
memory to run again. The catch (Landauer 1961, Bennett 1982): erasing the bit dumps
exactly `kT·ln2` of heat — precisely the work you won. **One ledger, two units; you
cannot win, and you cannot break even.**

**The one ledger (the literal cross-wing integration).** `core.mjs` IMPORTS, not
redefines:
- `entropy` from `../../entropy/core.mjs` — the demon's bit is counted by the **very
  same** `entropy()` the Shannon Limit bench uses. `bitInfo(p) = entropy([{p},{p:1−p}])`.
  H(½)=1 bit, H(0.8)=0.72193.
- `carnotEfficiency` from `../carnot/core.mjs` — the two-reservoir variant's work is
  bounded by the **same** Carnot ceiling `1−T_c/T_h` the Carnot bench proves.

**The model contract.** `compute(state)` returns ONE object every facet reads (the box
canvas, the P–V canvas, the dual-ledger SVG, the ΔS_universe meter, the live numbers) —
they provably cannot drift because there is nothing to drift between. Per-MOLECULE
constant `k_B` (never `R_GAS` — the scale trap); `kT·ln2 @ 300 K = 2.87×10⁻²¹ J`.

**The three invited cheats (each given a real chance to fail).**
- **Refuse erasure** (the free lunch): the gas+work subsystem's entropy goes *negative*
  — it looks like the Second Law broke — but the demon's finite 8-cell memory tape fills
  with unerased bits, and `ΔS_memory = +H·k·ln2` per cell covers the deficit so
  `ΔS_universe ≥ 0` at every step **by construction**. When the tape is full, the demon is
  dead (cannot measure without erasing).
- **Bias p** (0.02–0.98): H < 1 → `W = H·kT·ln2 < kT·ln2`; H predicts the shortfall
  exactly; p→0/1 ⇒ H→0 ⇒ W→0.
- **Speed** (quasistatic→fast): harvested work < kT·ln2 while erasure stays full →
  `netW < 0` strictly; the simple irreversibility factor `clamp(1−k_irr·(speed−1),0,1)`
  is owned by the core (no full Gouy–Stodola).

**The spine that makes cheating impossible.** A headless FSM
`EMPTY→PARTITIONED→MEASURED→EXPANDED→(erase→EMPTY)`. Each phase lights ONLY its legal
buttons (disabled + aria-disabled + cursor:not-allowed). **After EXTRACT, Drop is gated
until ERASE** — you literally cannot start a clean cycle without paying the bill.

### Files (all new)
- `core.mjs` (~310 lines) — the single source of truth: cross-wing imports, `bitInfo`,
  from-scratch `workIsotherm` (midpoint Riemann of P=kT/V), `compute`, the FSM
  (`makeMachine`/`can`/`transition`), `freeLunchRun`, and `runCoreTests`.
- `core.test.mjs` (~150 lines) — the Node twin. Runs the shared `runCoreTests`, adds
  high-grid/sweep extensions, AND **the re-extraction parity harness**.
- `index.html` (~870 lines) — one self-contained, zero-dep page. The inline core is the
  byte-twin of `core.mjs` under the `// ===== DEMON CORE … BEGIN/END =====` sentinels,
  with `entropy()`/`carnotEfficiency()` pasted VERBATIM (the page can't ES-import).
- `CHANGELOG.md` — this file.

### The self-test (the falsifiable claim, EXACT)
9 in-page assertions (`runCoreTests`), ★ = falsifier:
0. ★ the bit is counted by the SHARED `entropy()` — `bitInfo ≡ entropy([{p},{p:1−p}])`.
1. ★ `W(∫P dV one-molecule isotherm V→2V) == kT·ln2` — derived from scratch, not hardcoded.
2. ★ `W_extracted == H·kT·ln2` (H via the same `entropy()`); == 1 bit for the fair box.
3. ★ `Q_erase == W` → `netW == 0` (reversible) and `< 0` strictly (faster).
4. ★ `ΔS_thermo == ΔS_shannon × k·ln2` → 1 bit × k·ln2 = 9.5699×10⁻²⁴ J/K.
5. ★ biased box: `W = H·kT·ln2 < kT·ln2` (H predicts the shortfall); p→0/1 ⇒ W→0.
6. two-reservoir extraction ≤ Carnot ceiling `carnotEfficiency(T_h,T_c)·Q_h` (shared fn).
7. ★ free-lunch: `ΔS_(gas+work) < 0` BUT `ΔS_memory` covers it → `ΔS_universe ≥ 0`, every step.
8. FSM legality: only LEGAL (phase,action) pairs advance; cannot re-cycle without erasing.

### Self-test counts (recorded)
- **In-page: 9/9 ✓** (the pill, live, grid 4000).
- **Node twin: 17/17 ✓** — the 9 shared checks + 4 extensions (∫P dV → kT·ln2 to ~1e-9 at
  grid 2e5; free-lunch ΔS≥0 across the full tape for every bias; harvested ≤ Carnot ceiling
  over a dense (T_h,T_c,speed) grid) + **the RE-EXTRACTION PARITY harness**: reads
  `index.html`, slices the inline core between the banner sentinels, evaluates it, and
  asserts (i) the inline `entropy()` body is **char-for-char** identical to the imported
  `entropy.toString()`, (ii) the page core's pass-count == the module's (9/9 == 9/9), and
  (iii) every named assertion agrees ok-for-ok. This **proves the page core == the module
  == the shared sibling functions** — exceeding the de-facto Carnot/entropy precedent
  (which only imports the module; neither actually re-extracts today).

### Browser-verified (agent-browser, session `demon-qa-cyc3`, cache-busted)
- self-test pill **9/9 green**, `ws:seen:demon` breadcrumb dropped on direct visit.
- the FSM cycles through all four phases; buttons gate correctly (only legal actions
  enabled); **Drop is blocked in EXPANDED until Erase** (the spine holds).
- free-lunch: the 8-cell tape fills (rendered SVG matches the machine), the demon dies
  when full, `ΔS_universe` never goes below 0 (min observed = 0).
- biased p=0.8 → H=0.722 bit, W=2.07×10⁻²¹ J (the predicted shortfall).
- two-reservoir mode: sliders swap (T_h/T_c), the Carnot ceiling marker appears on the
  W bar, harvested ≤ ceiling.
- **0 console errors.**
- reduced-motion guards present (disc static frame, snap transitions, no rAF in boot);
  `visibilitychange` cancels the rAF when the tab hides (laptop-cooling) and resumes when
  visible — both verified live.

### Landing + bridge integration
- `engine-room/index.html`: the 👹 Maxwell's-Demon bedplate is **un-disabled** and promoted
  into the live "Heat Engines" bay as `The Demon's Ledger` (a live `.bench` link with a
  `self-test 9/9 ✓ · one ledger, two units · cheating impossible` proof pill). The Shop
  Floor now holds Stirling + Brownian. Landing self-test corrected to assert **2 live
  benches / 2 empty bedplates** + a new `Demon bench is live` check → **17/17 green**.
  Footer: "Two benches running, two bedplates waiting." (`node tools/forge/forge.mjs
  --check --all` still **29/29** — this bench is hand-authored, not a forge artifact.)
- bidirectional bridges: demon→entropy + demon→cavern/maxwell-boltzmann (footer bridge
  cards); reverse links into `entropy/index.html` ("↗ where one bit costs heat") and
  `cavern/maxwell-boltzmann/index.html` ("↑ one molecule, played as an engine"). Both
  sibling pages' self-tests stay green (entropy 9/9, MB 14/14).
