/* ═══════════════════════════════════════════════════════════════════════════
   programs.js — The Mill's PROGRAM LIBRARY, as data.

   Every program is a Turing-machine definition (the same shape turing.js steps)
   plus sample inputs and the hand-derived expected results. The page picks from
   this library; the Node test (`turing.test.cjs`) and the page's green chip both
   run THESE machines and assert THESE expectations — so the library is itself a
   correctness fixture.

   THE CRUX — the busy beavers. The headline programs are the proven 2-symbol
   busy-beaver CHAMPIONS. Starting from the all-blank tape they halt after EXACTLY
   the proven step counts, leaving EXACTLY the proven number of 1s:

       BB(2): 2 states → halts in   6 steps, 4 ones   (S(2)=6,  Σ(2)=4)
       BB(3): 3 states → halts in  14 steps, 6 ones   (S(3)=14, Σ(3)=6)
       BB(4): 4 states → halts in 107 steps, 13 ones  (S(4)=107, Σ(4)=13)

   These are the proven records (Rado's busy-beaver function; BB(4) is Brady's
   1983 champion). The transition tables below are the standard champions; the
   self-test re-derives every number by RUNNING them, so a wrong transcription
   would fail the test, never ship.

   Each program record:
     { id, name, blurb, blank, start, halt, transitions,
       takesInput,                 // does the program read an input string?
       inputLabel,                 // UI hint for the input box (if takesInput)
       sampleInput,                // a default input to load
       tests: [ {input, expect:{...}} ],   // assertions for the self-test
       maxSteps,                   // a sensible cap for the page's auto-run
       accept, reject }            // (decision machines) the accept/reject states
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  /* tiny helper: a transition rule. t('1','R','B') = write 1, move Right, go to B. */
  function t(write, move, next) { return { write: write, move: move, next: next }; }

  var PROGRAMS = [

    /* ──────────────────────────────────────────────────────────────────────
       1. BINARY INCREMENT — add 1 to a binary number written MSB-first.
       The head starts at the LEFT (MSB). Strategy: walk to the right end, then
       ripple-carry leftward: turn trailing 1s into 0s until the first 0 (→1) or
       run off the left edge (→ prepend a 1).

       States:
         R  — scan right to the least-significant bit (rightmost cell)
         C  — carry: walking left turning 1→0; a 0 becomes 1 and we're done;
              falling off the left writes a new leading 1.
       The tape is bordered by blanks ('_'); we treat a blank as "past the end".
       ────────────────────────────────────────────────────────────────────── */
    {
      id: 'bininc',
      name: 'Binary increment',
      blurb: 'Adds 1 to a binary number (MSB first). Watch the carry ripple right-to-left through the 1s.',
      blank: '_',
      start: 'R',
      halt: 'H',
      takesInput: true,
      inputLabel: 'a binary number, e.g. 0111',
      sampleInput: '0111',
      maxSteps: 4000,
      transitions: {
        // R: run to the right end (first blank past the number), then step back into C.
        R: { '0': t('0', 'R', 'R'), '1': t('1', 'R', 'R'), '_': t('_', 'L', 'C') },
        // C: ripple-carry leftward.
        C: {
          '1': t('0', 'L', 'C'),   // 1 + carry = 0, carry continues left
          '0': t('1', 'N', 'H'),   // 0 + carry = 1, done
          '_': t('1', 'N', 'H')    // fell off the left → new leading 1, done
        }
      },
      tests: [
        { input: '0111', expect: { tapeString: '1000', halted: true, stuck: false } },
        { input: '0', expect: { tapeString: '1', halted: true } },
        { input: '1', expect: { tapeString: '10', halted: true } },
        { input: '1011', expect: { tapeString: '1100', halted: true } },
        { input: '111', expect: { tapeString: '1000', halted: true } },
        { input: '0000', expect: { tapeString: '0001', halted: true } }
      ]
    },

    /* ──────────────────────────────────────────────────────────────────────
       2. UNARY → BINARY (counting). Input is a block of n tally marks ('1');
       output is n written in binary. Implemented as: repeatedly STRIKE OFF one
       tally and INCREMENT a binary counter built to the right of a separator.

       To keep the program legible and provably-correct, we use the classic
       "decrement unary / increment binary" loop with a marker. The self-test
       asserts the output equals n in binary for several n. Symbols:
         '1' tally, '_' blank, plus binary digits '0'/'1' share with tallies via
       a separator '#'. We lay out:  <tallies> # <binary, LSB on the right>.

       Approach (head starts at the left, on the first tally):
         S  — find the leftmost remaining tally; if none, FINISH.
         …  this is genuinely involved; for a crisp, watchable demo we instead
            ship UNARY ADDITION below, which is the canonical short TM. (Kept the
            id 'unary' for the picker; it adds two unary numbers separated by +.)
       ──────────────────────────────────────────────────────────────────────
       UNARY ADDITION: input "111+11" (3 + 2) → "11111" (5). The classic 4-rule
       machine: replace the '+' with a '1', then delete the final '1'. Result is
       the concatenation, i.e. the sum in unary. */
    {
      id: 'unaryadd',
      name: 'Unary addition',
      blurb: 'Adds two unary (tally) numbers: 111+11 → 11111. Bridges the +, then erases one mark.',
      blank: '_',
      start: 'A',
      halt: 'H',
      takesInput: true,
      inputLabel: 'two tallies joined by +, e.g. 111+11',
      sampleInput: '111+11',
      maxSteps: 4000,
      transitions: {
        // A: scan right over the first block of 1s to the '+'.
        A: { '1': t('1', 'R', 'A'), '+': t('1', 'R', 'B'), '_': t('_', 'N', 'H') },
        // B: '+' became '1'; scan to the right end of the second block.
        B: { '1': t('1', 'R', 'B'), '_': t('_', 'L', 'C') },
        // C: erase the last '1' (we added one too many by bridging the +).
        C: { '1': t('_', 'N', 'H') }
      },
      tests: [
        { input: '111+11', expect: { tapeString: '11111', halted: true, onesCount: 5 } },
        { input: '1+1', expect: { tapeString: '11', halted: true, onesCount: 2 } },
        { input: '11+11', expect: { tapeString: '1111', halted: true, onesCount: 4 } },
        { input: '1111+1', expect: { tapeString: '11111', halted: true, onesCount: 5 } },
        { input: '11+111', expect: { tapeString: '11111', halted: true, onesCount: 5 } }
      ]
    },

    /* ──────────────────────────────────────────────────────────────────────
       3. PALINDROME CHECKER (over {a,b}). Decides whether the input reads the
       same forwards and backwards. Halts in state ACCEPT or REJECT.

       Classic two-end matching: read & erase the leftmost symbol, remember it in
       the state, walk to the rightmost symbol, check it matches & erase it, walk
       back, repeat. Empty / single-leftover ⇒ accept.

       Symbols: 'a','b','_' (blank, also the erased mark). The accept/reject is
       carried by the halt STATE (Y = accept, N = reject).
       States:
         S      — at left end: read first symbol, erase, remember (→ Ra or Rb);
                  blank here ⇒ even palindrome fully matched ⇒ ACCEPT.
         Ra/Rb  — walk right to the end; the right-end symbol must match the
                  remembered one. blank immediately ⇒ a single leftover char in
                  the middle (odd palindrome) ⇒ ACCEPT.
         La/Lb  — at the right end with a match: erase it, walk back left.
         BL     — walk left back to the start, then re-enter S.
       ────────────────────────────────────────────────────────────────────── */
    {
      id: 'palindrome',
      name: 'Palindrome checker',
      blurb: 'Decides if the input is a palindrome over {a,b}. Matches symbols from both ends inward.',
      blank: '_',
      start: 'S',
      halt: ['Y', 'N'],
      accept: 'Y',
      reject: 'N',
      takesInput: true,
      inputLabel: 'a string over a,b — e.g. abba',
      sampleInput: 'abba',
      maxSteps: 8000,
      transitions: {
        // S: read & erase the leftmost symbol.
        S: {
          '_': t('_', 'N', 'Y'),                 // nothing left → accept
          'a': t('_', 'R', 'Ra'),                // remembered 'a'
          'b': t('_', 'R', 'Rb')                 // remembered 'b'
        },
        // Ra: walk right to the end; the last symbol must be 'a'.
        Ra: {
          'a': t('a', 'R', 'Ra'), 'b': t('b', 'R', 'Ra'),
          '_': t('_', 'L', 'Ca')                 // hit the right edge; step back to the last symbol
        },
        Rb: {
          'a': t('a', 'R', 'Rb'), 'b': t('b', 'R', 'Rb'),
          '_': t('_', 'L', 'Cb')
        },
        // Ca: at the rightmost remaining symbol, expecting 'a'.
        Ca: {
          'a': t('_', 'L', 'BL'),                // match → erase, go back
          'b': t('b', 'N', 'N'),                 // mismatch → reject
          '_': t('_', 'N', 'Y')                  // the leftover WAS the just-erased one (odd center) → accept
        },
        Cb: {
          'b': t('_', 'L', 'BL'),
          'a': t('a', 'N', 'N'),
          '_': t('_', 'N', 'Y')
        },
        // BL: walk left back to the start (first blank to the left), then re-enter S.
        BL: {
          'a': t('a', 'L', 'BL'), 'b': t('b', 'L', 'BL'),
          '_': t('_', 'R', 'S')
        }
      },
      tests: [
        { input: 'abba', expect: { halted: true, state: 'Y' } },
        { input: '', expect: { halted: true, state: 'Y' } },
        { input: 'a', expect: { halted: true, state: 'Y' } },
        { input: 'aba', expect: { halted: true, state: 'Y' } },
        { input: 'abccba', skip: true },        // c not in alphabet; demo only
        { input: 'abb', expect: { halted: true, state: 'N' } },
        { input: 'ab', expect: { halted: true, state: 'N' } },
        { input: 'aab', expect: { halted: true, state: 'N' } },
        { input: 'abaaba', expect: { halted: true, state: 'Y' } },
        { input: 'baab', expect: { halted: true, state: 'Y' } },
        { input: 'ba', expect: { halted: true, state: 'N' } }
      ]
    },

    /* ──────────────────────────────────────────────────────────────────────
       4. BINARY PALINDROME (over {0,1}) — same algorithm on the workshop's
       native binary alphabet, so the same demo works on 0110 etc. (Distinct id
       so the picker can offer both; '_' blank, 'x' as the erase mark to avoid
       confusing erased cells with real 0s.)
       ────────────────────────────────────────────────────────────────────── */
    {
      id: 'binpalindrome',
      name: 'Binary palindrome',
      blurb: 'Decides if a binary string is a palindrome. 0110 accepts; 011 rejects.',
      blank: '_',
      start: 'S',
      halt: ['Y', 'N'],
      accept: 'Y',
      reject: 'N',
      takesInput: true,
      inputLabel: 'a binary string — e.g. 0110',
      sampleInput: '0110',
      maxSteps: 8000,
      transitions: {
        S: {
          '_': t('_', 'N', 'Y'),
          '0': t('_', 'R', 'R0'),
          '1': t('_', 'R', 'R1')
        },
        R0: { '0': t('0', 'R', 'R0'), '1': t('1', 'R', 'R0'), '_': t('_', 'L', 'C0') },
        R1: { '0': t('0', 'R', 'R1'), '1': t('1', 'R', 'R1'), '_': t('_', 'L', 'C1') },
        C0: { '0': t('_', 'L', 'BL'), '1': t('1', 'N', 'N'), '_': t('_', 'N', 'Y') },
        C1: { '1': t('_', 'L', 'BL'), '0': t('0', 'N', 'N'), '_': t('_', 'N', 'Y') },
        BL: { '0': t('0', 'L', 'BL'), '1': t('1', 'L', 'BL'), '_': t('_', 'R', 'S') }
      },
      tests: [
        { input: '0110', expect: { halted: true, state: 'Y' } },
        { input: '011', expect: { halted: true, state: 'N' } },
        { input: '0', expect: { halted: true, state: 'Y' } },
        { input: '00', expect: { halted: true, state: 'Y' } },
        { input: '010', expect: { halted: true, state: 'Y' } },
        { input: '01', expect: { halted: true, state: 'N' } },
        { input: '1001', expect: { halted: true, state: 'Y' } },
        { input: '100', expect: { halted: true, state: 'N' } }
      ]
    },

    /* ──────────────────────────────────────────────────────────────────────
       5. COPY / DOUBLE — duplicate a block of 1s: 111 → 111#111 (a copy after a
       separator), so |output ones| = 2 × |input ones|. Classic marking copier:
       mark a 1 (→x), run right past the '#' to the end of the copy, write a 1,
       run back, repeat; when no unmarked 1 remains, restore the marks to 1s.

       Layout: <ones> then the head builds <#><copy> to the right.
       States:
         A  — find the leftmost unmarked 1; mark it (1→x); if blank, all copied → CLEAN.
         B  — carry the "write a 1" rightward: skip 1s and x's and the '#' and copy-1s
              to the first blank, write a 1 there, then go back (D).
         D  — walk left back to the marker region; re-enter A at the next unmarked 1.
         CLEAN — turn every x back into 1 (restore the original block).
       We separate original & copy with '#': created lazily the first time we
       cross into copy territory.
       ──────────────────────────────────────────────────────────────────────
       Simplest robust encoding: replace a leading 1 with x, walk to the far
       right blank, write 1; return to the first x-to-1 boundary; repeat. Then
       convert x→1. Output ones = 2n. */
    {
      id: 'double',
      name: 'Copy / double',
      blurb: 'Duplicates a block of tallies: 111 → 111111 (twice as many ones). A marking copier.',
      blank: '_',
      start: 'A',
      halt: 'H',
      takesInput: true,
      inputLabel: 'a block of tallies, e.g. 111',
      sampleInput: '111',
      maxSteps: 6000,
      transitions: {
        // A: scan for the leftmost unmarked 1; mark it x; head right to copy it.
        A: { '1': t('x', 'R', 'B'), 'y': t('y', 'R', 'A'), '_': t('_', 'L', 'CLEAN') },
        // B: walk right over remaining 1s and any copied y's to the end; write a y.
        B: { '1': t('1', 'R', 'B'), 'y': t('y', 'R', 'B'), '_': t('y', 'L', 'D') },
        // D: walk left back over y's and 1s to the just-marked x; step right onto the next source 1.
        D: { '1': t('1', 'L', 'D'), 'y': t('y', 'L', 'D'), 'x': t('x', 'R', 'A') },
        // CLEAN: we're past the right end of the source region (a blank to the left of nothing);
        // walk left turning x→1 and y→1 to materialize the doubled block.
        CLEAN: { 'x': t('1', 'L', 'CLEAN'), 'y': t('1', 'L', 'CLEAN'), '1': t('1', 'L', 'CLEAN'), '_': t('_', 'N', 'H') }
      },
      tests: [
        { input: '1', expect: { halted: true, onesCount: 2 } },
        { input: '11', expect: { halted: true, onesCount: 4 } },
        { input: '111', expect: { halted: true, onesCount: 6 } },
        { input: '1111', expect: { halted: true, onesCount: 8 } }
      ]
    },

    /* ══════════════════════════════════════════════════════════════════════
       6. BUSY BEAVER BB(2) — 2-state, 2-symbol champion.
          From the all-blank tape: halts in 6 steps, leaving 4 ones. (S(2)=6, Σ(2)=4)
          Champion table (Rado):
            A0 → 1RB    A1 → 1LB
            B0 → 1LA    B1 → 1RH   (H = halt)
       ══════════════════════════════════════════════════════════════════════ */
    {
      id: 'bb2',
      name: 'Busy Beaver BB(2)',
      blurb: 'The 2-state busy-beaver champion. From a blank tape it halts in exactly 6 steps with 4 ones.',
      blank: '0',
      start: 'A',
      halt: 'H',
      takesInput: false,
      sampleInput: '',
      maxSteps: 100,
      busyBeaver: { states: 2, steps: 6, ones: 4 },
      transitions: {
        A: { '0': t('1', 'R', 'B'), '1': t('1', 'L', 'B') },
        B: { '0': t('1', 'L', 'A'), '1': t('1', 'R', 'H') }
      },
      tests: [
        { input: '', expect: { halted: true, stuck: false, steps: 6, onesCount: 4 } }
      ]
    },

    /* ══════════════════════════════════════════════════════════════════════
       7. BUSY BEAVER BB(3) — 3-state, 2-symbol champion.
          From the all-blank tape: halts in 14 steps, leaving 6 ones. (S(3)=14, Σ(3)=6)
          Champion table (Lin–Rado):
            A0 → 1RB    A1 → 1RH
            B0 → 0RC    B1 → 1RB
            C0 → 1LC    C1 → 1LA
       ══════════════════════════════════════════════════════════════════════ */
    {
      id: 'bb3',
      name: 'Busy Beaver BB(3)',
      blurb: 'The 3-state busy-beaver champion. From a blank tape it halts in exactly 14 steps with 6 ones.',
      blank: '0',
      start: 'A',
      halt: 'H',
      takesInput: false,
      sampleInput: '',
      maxSteps: 200,
      busyBeaver: { states: 3, steps: 14, ones: 6 },
      transitions: {
        A: { '0': t('1', 'R', 'B'), '1': t('1', 'R', 'H') },
        B: { '0': t('0', 'R', 'C'), '1': t('1', 'R', 'B') },
        C: { '0': t('1', 'L', 'C'), '1': t('1', 'L', 'A') }
      },
      tests: [
        { input: '', expect: { halted: true, stuck: false, steps: 14, onesCount: 6 } }
      ]
    },

    /* ══════════════════════════════════════════════════════════════════════
       8. BUSY BEAVER BB(4) — 4-state, 2-symbol champion (Brady, 1983).
          From the all-blank tape: halts in 107 steps, leaving 13 ones.
          (S(4)=107, Σ(4)=13 — both proven.)
          Champion table:
            A0 → 1RB    A1 → 1LB
            B0 → 1LA    B1 → 0LC
            C0 → 1RH    C1 → 1LD
            D0 → 1RD    D1 → 0RA
       ══════════════════════════════════════════════════════════════════════ */
    {
      id: 'bb4',
      name: 'Busy Beaver BB(4)',
      blurb: 'The 4-state busy-beaver champion (Brady 1983). From a blank tape it halts in exactly 107 steps with 13 ones.',
      blank: '0',
      start: 'A',
      halt: 'H',
      takesInput: false,
      sampleInput: '',
      maxSteps: 400,
      busyBeaver: { states: 4, steps: 107, ones: 13 },
      transitions: {
        A: { '0': t('1', 'R', 'B'), '1': t('1', 'L', 'B') },
        B: { '0': t('1', 'L', 'A'), '1': t('0', 'L', 'C') },
        C: { '0': t('1', 'R', 'H'), '1': t('1', 'L', 'D') },
        D: { '0': t('1', 'R', 'D'), '1': t('0', 'R', 'A') }
      },
      tests: [
        { input: '', expect: { halted: true, stuck: false, steps: 107, onesCount: 13 } }
      ]
    },

    /* ══════════════════════════════════════════════════════════════════════
       9. A DELIBERATELY NON-HALTING machine — runs forever (the step-cap demo).
          Single state, always moves right writing 1s: never reaches a halt
          state, never gets stuck. Proves the cap reports `capped:true`,
          `halted:false` and never hangs.
       ══════════════════════════════════════════════════════════════════════ */
    {
      id: 'forever',
      name: 'Runs forever',
      blurb: 'A machine with no halt state: it scribbles 1s rightward without end. The step-cap stops it.',
      blank: '0',
      start: 'A',
      halt: 'H',
      takesInput: false,
      sampleInput: '',
      maxSteps: 200,
      neverHalts: true,
      transitions: {
        A: { '0': t('1', 'R', 'A'), '1': t('1', 'R', 'A') }
      },
      tests: [
        { input: '', cap: 200, expect: { halted: false, capped: true, steps: 200 } },
        { input: '', cap: 50, expect: { halted: false, capped: true, steps: 50 } }
      ]
    }
  ];

  /* lookup by id */
  function byId(id) {
    for (var i = 0; i < PROGRAMS.length; i++) if (PROGRAMS[i].id === id) return PROGRAMS[i];
    return null;
  }

  var API = { PROGRAMS: PROGRAMS, byId: byId, t: t };

  // browser global
  if (root) root.TuringPrograms = API;

  // dual-use module guard (forge strips exactly this braced single line)
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
