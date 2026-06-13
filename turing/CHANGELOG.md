# The Mill — build log

## v1.0 — first light

A visible, programmable single-tape **Turing machine** — the workshop's first piece of pure
**COMPUTATION** (a new genre; the Strange Garden's parallel grid CAs are a different thing). Watch a
single head shuttle over an unbounded sparse tape, reading/writing one symbol per step under an editable
transition table (the program, as data). Ships a classic-program library and the proven **busy-beaver
champions** as its rigorous centerpiece.

### Engine + library + proof
- `tools/turing/turing.js` — pure, DOM-free TM core. Sparse-dictionary tape (effectively unbounded,
  `O(visited)` memory); `step` / `run(machine, input, {maxSteps})` returning
  `{tape, tapeString, headPos, state, halted, stuck, steps, onesCount, capped}`; `accepts` (decision
  machines), `validate` + `inventory` (for the editor). Deterministic. Dual-use IIFE (`Turing` global +
  module guard, byte-identical to `tools/ws/ws.js`).
- `tools/turing/programs.js` — the program library as data: binary increment, unary addition, palindrome
  checker (over `{a,b}`), binary palindrome (over `{0,1}`), copy/double, **BB(2) / BB(3) / BB(4)**, and a
  deliberately non-halting machine. Each carries sample inputs + hand-derived expected results.
- `tools/turing/turing.test.cjs` — headless self-test: **49/49 PASS, exit 0**. Proves the simulator is
  correct, the busy beavers hit **BB(2)=6 steps/4 ones, BB(3)=14 steps/6 ones, BB(4)=107 steps/13 ones**
  (exact S and Σ, re-derived by running the tables), the step-cap reports non-halting machines without
  hanging, and runs are deterministic.

### Page (`turing/index.src.html` → forge → `turing/index.html`)
- Scrolling tape with the head centred under a head pointer; readout (state / read / step / ones Σ /
  status); the **editable transition table**; Step / Run / Reset, speed slider, input field, program
  picker; 3 palette-only skins (Brass / Slate / Terminal); 2× PNG export; `← workshop` back-link; no
  audio. Green in-page self-test chip ("mill verified — 43/43 ✓") on the same core as the Node test.
- `WS.seen('turing')` breadcrumb (forge-inlined `tools/ws/ws.js`).

### Fixes during the build
- **Null-config crash on init.** `resetMachine` → `stopRun` → `updateReadout` dereferenced
  `STATE.config` before it was assigned on the very first program load — this threw during `init()`,
  leaving the config null and aborting the rest of the script (so `WS.seen` never ran). Guarded
  `renderTape` / `updateReadout` / `atCap` against a null config. Root cause fixed, not the symptom.
- **Reduced-motion auto-run.** Under `prefers-reduced-motion`, Run now jumps straight to the halt/cap
  result in one synchronous pass (no animated shuttling); the CSS stills the tape transitions; Step still
  advances cell-by-cell.
- **Mobile topbar crowding.** At narrow widths the brand subtitle overlapped the self-test chip; the
  subtitle is hidden and the brand stacks below ~880px.
- Corrected a test fixture: unary addition `1+1 = 11` (2 tallies), not `111`.

### Verification
- `node tools/turing/turing.test.cjs` → 49/49 PASS, exit 0 (incl. the exact BB step/ones numbers).
- `node tools/forge/forge.mjs turing/index.src.html` clean; `--check --all` green.
- Real browser (agent-browser, served via `python3 -m http.server 8150`): green chip 43/43 matches the
  Node count; binary-increment `0111 → 1000`; **BB(4) ran and halted at 107 steps / 13 ones** (live DOM
  readout); editing BB(4)'s A0 `next` (B→A) via the table editor broke the halt (capped); the
  "runs-forever" program driven by the real Run button stopped cleanly at the cap; `ws:seen:turing` set;
  0 console errors; handsome at 1440×900 and 390-wide mobile.
