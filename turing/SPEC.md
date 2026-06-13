# ⚙ The Mill — build spec

*A visible, programmable **Turing machine** — the abstract computer Alan Turing imagined in 1936, made
watchable. A single head shuttles over an unbounded **tape**, reading and writing one symbol at a time;
a tiny table of rules — the **program**, supplied as editable **data** — says what to do for each
`(state, symbol)`. Step it, or set it running, and watch a computation unfold cell by cell. It ships a
library of classic programs and, as its rigorous centerpiece, the proven **busy-beaver champions**. The
workshop's first piece of pure **COMPUTATION** — a genuinely new genre for the estate.*

Folder: `turing/`. Source: `turing/index.src.html`; shipped (forge-generated) file: `turing/index.html`
(no build at ship time, no network, no deps, no audio). Engine + library:
`tools/turing/turing.js` + `tools/turing/programs.js`. Headless proof:
`tools/turing/turing.test.cjs`. Build log: `turing/CHANGELOG.md`.

> **Not a cellular automaton.** The Strange Garden's pieces (Particle Life, cyclic-CA,
> reaction-diffusion, Game of Life) are *parallel grid* automata that update every cell at once. The
> Mill is a *single-head, sequential* Turing machine — one cell read/written per step. Different genre;
> they do not overlap.

---

## §0 — The crux (what this piece PROVES)

The whole piece rests on a single source of truth: a pure, DOM-free Turing-machine **core**
(`tools/turing/turing.js`). The same `run`/`step` functions drive the page's live tape, the page's green
self-test chip, AND the headless Node test — so a green chip in the browser is *byte-for-byte the same
computation* as `node tools/turing/turing.test.cjs`. A machine is supplied as **data** (one engine, many
programs); the renderer only draws the config the core produces. Skins are cosmetic only.

The rigorous, checkable heart is the **busy beavers**. Starting from the all-blank tape the proven
2-symbol busy-beaver champions halt after *exactly* the proven step counts, leaving *exactly* the proven
number of 1s:

| Machine | states | halts in (S) | ones left (Σ) |
|--------:|:------:|:------------:|:-------------:|
| **BB(2)** | 2 | **6 steps** | **4 ones** |
| **BB(3)** | 3 | **14 steps** | **6 ones** |
| **BB(4)** | 4 | **107 steps** | **13 ones** |

These are Radó's busy-beaver records (`S(n)`, `Σ(n)`); BB(4) is Brady's 1983 champion. The self-test
re-derives every number by *running* the encoded transition table — so a wrong transcription would fail
the test and never ship. Watching BB(4) run to its halt at exactly step 107 with 13 ones is the small
marvel the piece is built around.

---

## §1 — The machine model

A machine is a 5-tuple given as a plain object:

```js
{
  id, name, blurb,
  blank: '0',                  // the symbol that fills the unbounded tape
  start: 'A',                  // start state
  halt:  'H' | ['Y','N'],      // halt state(s): a string, an array, or a fn(state)
  transitions: {               // (state, read) -> action
    'A': { '0': {write:'1', move:'R', next:'B'},
           '1': {write:'1', move:'L', next:'B'} }, ...
  }
}
```

- **move** is `'L'` | `'R'` | `'N'` (N = stay).
- A **missing** `(state, read)` entry is a *stuck* halt: no rule fires, the machine stops (`stuck:true`).
  Reaching a **halt state** also stops (`stuck:false`).
- The **tape** is a sparse dictionary (`position -> symbol`); any cell never written reads as `blank`,
  so the tape is effectively unbounded in both directions with `O(visited)` memory. The head starts at 0.
- `run(machine, input, {maxSteps})` drives `step()` to a halt or a **step cap** (default 100 000), so a
  non-halting machine is *reported* (`capped:true, halted:false`), never hangs. It returns
  `{tape, tapeString, headPos, state, halted, stuck, steps, onesCount, capped}` and is **deterministic**
  (same `(machine, input)` ⇒ byte-identical run every time).

---

## §2 — The program library (`tools/turing/programs.js`)

Each program is a machine def + sample inputs + hand-derived expected results (the test fixture):

1. **Binary increment** — adds 1 to a binary number (MSB first); the carry ripples right-to-left through
   the 1s. `0111 → 1000`, `111 → 1000`.
2. **Unary addition** — `111+11 → 11111` (3 + 2 = 5 in tallies): bridge the `+` to a `1`, erase one mark.
3. **Palindrome checker** (over `{a,b}`) — matches symbols from both ends inward; halts in **ACCEPT** (`Y`)
   or **REJECT** (`N`). `abba` accepts, `abb` rejects.
4. **Binary palindrome** (over `{0,1}`) — the same algorithm on the binary alphabet. `0110` accepts,
   `011` rejects.
5. **Copy / double** — duplicates a block of tallies (`111 → 111111`); a marking copier (output ones =
   2 × input ones).
6. **BB(2) / BB(3) / BB(4)** — the busy-beaver champions (see §0).
7. **Runs forever** — a deliberately non-halting machine (no halt state); the step-cap stops it.

---

## §3 — The page

- A **scrolling tape** of cells with the head always centred under a head pointer (the tape slides under
  the head). Off-window cells are blank; edges fade so the tape reads as infinite.
- A **readout**: state badge, the symbol under the head, step counter, ones-counter (Σ), and a status
  gauge (ready / running / HALTED / ACCEPT / REJECT / capped).
- The **transition table** shown and **EDITABLE**: rows = states, columns = symbols; each cell holds
  `write · move · next`. Editing rebuilds the machine and resets the run; a structural error is flagged.
- **Step ▸ / Run (Pause) / Reset**, a speed slider, an input field for the input-taking programs, and a
  program **picker** (with notes like "halts in 107 steps"). Keyboard: Space = step, Enter = run/pause,
  R = reset.
- **3 palette-only skins** (Brass / Slate / Terminal) — colour only, never logic. **2× PNG** export
  (manual canvas paint, never tainted). A `← workshop` back-link. **No audio.**
- A green in-page self-test chip ("mill verified — N/N ✓") calling the SAME core as the Node test.
- **Reduced motion**: the tape transitions are stilled and Run jumps straight to the halt/cap result in
  one synchronous pass (no animated shuttling); Step still advances cell-by-cell.

---

## §4 — The self-test (proves four claims)

Both `tools/turing/turing.test.cjs` and the in-page chip assert:

1. **Correct simulator** — every `(program, input)` in the library reproduces its hand-derived expected
   `(final tape / state / halted? / step count / ones)`.
2. **Busy-beaver champions hit the KNOWN values** — BB(2)=6/4, BB(3)=14/6, BB(4)=107/13 (exact S and Σ),
   re-derived by running the encoded tables.
3. **Halting + step-cap** — a non-halting machine is reported capped (no hang); a halting machine reports
   `halted:true` at the right step; a missing rule halts *stuck*.
4. **Determinism** — same `(machine, input)` ⇒ identical full run twice.

Run: `node tools/turing/turing.test.cjs` → all PASS, exit 0.
