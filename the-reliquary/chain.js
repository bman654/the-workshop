/* ═══════════════════════════════════════════════════════════════════════════
   THE RELIQUARY — chain.mjs  ·  the 3-clue DAG, as data (the SOLE authority)

   "The Sealed Room's Diary": a found diary walled up behind the Register. The
   mystery is whose diary it is and what this house forgot it once was. THREE
   oblique clues, each naming ONE standing exhibit + ONE action, daisy-chained so
   each clue is decoded by the instrument the PRIOR clue's key unlocks:

     C1  THE MUSEUM · River of Days   — engage BY REAL TIME + dwell the playhead in
                                        the storm day-band. Mints a courier key =
                                        the digit-sum of the storm's commit count.
     C2  THE SCYTALE · the Spartan rod — wind the enciphered diary page on a rod of
                                        THAT circumference; the plaintext names C3.
     C3  THE CARD CATALOG · the Register — pull the manicule and search the prose
                                        for the house's forgotten first name. The
                                        entry that "has no room" is the sealed study
                                        itself; finding it un-walls the confession.

   This module is DOM-free, zero-import, dual-use (browser global RELIQUARY_CHAIN +
   Node import). It is forge-inlined into the-reliquary/index.html (between the
   CHAIN sentinels) so the page's board + colophon read the IDENTICAL data the
   headless completability solver (selftest.mjs) proves solvable. Nothing about the
   chain is typed twice.

   THE ANTI-DRIFT NUMBERS. The storm is not hand-pinned here: the museum derives it
   (busiestDay → 118 commits on 2026-06-13). The circumference is a STATED reduction
   of that count — the digit sum, 1+1+8 = 10 — chosen because (a) it is genuinely
   derivable from the in-world hint ("the key is the number of stones in the storm")
   and (b) it lands inside the Scytale's legal rod range [2,12]. The raw 118 clamps
   to 12 (a WRONG rod → gibberish), so the reduction is load-bearing, not decoration.
   selftest.mjs RE-DERIVES both from the host code (museum/core.mjs busiestDay +
   scytale's real decipher) so the number can never drift from the instruments.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  /* the reduction the hint asks the player to perform: sum the digits of the storm
     commit-count. digitSum(118) = 10. Pure + total over non-negative integers. */
  function digitSum(n) {
    n = Math.abs(n | 0);
    var s = 0;
    while (n > 0) { s += n % 10; n = (n / 10) | 0; }
    return s;
  }

  /* the plaintext bound into the enciphered diary page (C2 → C3). Letters only
     (the scytale keeps A–Z); read off the correct rod it names C3's action + the
     house's forgotten first name. Kept here as the SINGLE source; the seeded
     ciphertext the board pins is derived from it at build/verify time by the REAL
     scytale core (never hand-typed), so the strip can't drift from the plaintext. */
  var C3_PLAINTEXT =
    'THELASTPAGEISBOUNDINTOTHEREGISTERFINDTHEENTRYWITHNOROOMITSNAMEISHOLLOWMERE';

  /* the house's forgotten first name — the search term that resolves C3 in the
     Register (case-insensitive). It appears in the Reliquary's own catalog card,
     which becomes visible only once the study is entered (ws:seen:reliquary), so
     the name is a payoff, not a front-door spoiler. */
  var FORGOTTEN_NAME = 'Hollowmere';

  /* THE DAG. Each node is a clue: an id, its human face (title + the oblique diary
     line + the host it points at + the un-smudged page revealed on solve), the
     ws:flag witness that a thin host breadcrumb sets, and `needs` — the ids that
     must be solved BEFORE this clue's witness can legally fire (the daisy-chain).
     `carry` (C1 only) names the courier payload the solve mints for the next hop.

     A clue is SOLVED in the live board iff its witness flag is present. The solver
     proves: from the empty start, following `needs` in order, every witness is
     reachable by a legal host action, no witness depends on a ws: key nothing sets,
     and the payoff (all three) is reachable. */
  var NODES = [
    {
      id: 'c1',
      witness: 'ws:flag:dossier:saw-the-storm',
      needs: [],
      host: 'museum', hostName: 'The Museum · River of Days', hostHref: '../museum/index.html',
      title: 'The hand that never tires',
      // the oblique diary line (what the pinned card shows while smudged)
      diary: 'I set the counter to true time and let the river run. It does not keep the metronome I keep. There was a day it broke its banks — count the stones that fell that day; their tally, folded to a single figure, is the key I hid.',
      // the un-smudged page (shown on solve)
      page: 'So I stood in the storm-day and watched the hand that never tires lay a hundred and eighteen stones between dusk and dusk. One-one-eight. Fold it: one and one and eight. Ten. Remember ten.',
      carry: { type: 'reliquary-key', valueFrom: 'digitSum(stormCount)', fromRoom: 'museum' }
    },
    {
      id: 'c2',
      witness: 'ws:flag:dossier:read-the-strip',
      needs: ['c1'],
      host: 'scytale', hostName: 'The Scytale · the Spartan rod', hostHref: '../scytale/index.html',
      title: 'Wind me on the rod',
      diary: 'This page is scrambled on purpose. Wind the strip helically upon the Spartan rod — but only the right rod re-aligns it. The key is the number of stones in the storm, folded as the last page taught you.',
      page: 'On the rod of ten the letters closed like a shutter and I could read it plain: THE LAST PAGE IS BOUND INTO THE REGISTER — FIND THE ENTRY WITH NO ROOM — ITS NAME IS HOLLOWMERE.'
    },
    {
      id: 'c3',
      witness: 'ws:flag:dossier:found-the-phantom',
      needs: ['c2'],
      host: 'card-catalog', hostName: 'The Card Catalog · the Register', hostHref: '../card-catalog/index.html',
      title: 'The entry with no room',
      diary: 'The last page was never a page. They bound it into the Register itself — an entry for a room that was walled up before it was ever built. Pull the manicule. Search the prose for the name the house wore first.',
      page: 'And there it was, catalogued in a hand not mine: Hollowmere — the mill on the drowned mere, the house’s christened name, sealed behind the shelving the day it chose to become a workshop instead.'
    }
  ];

  /* the payoff key set on final solve (the Gate + the Undercroft trophy read it). */
  var SOLVED_KEY = 'ws:seen:reliquary-solved';

  var Chain = {
    NODES: NODES,
    SOLVED_KEY: SOLVED_KEY,
    C3_PLAINTEXT: C3_PLAINTEXT,
    FORGOTTEN_NAME: FORGOTTEN_NAME,
    digitSum: digitSum,
    /* the circumference the player must dial, given the storm's commit count.
       STATED reduction = digit sum. The single arithmetic the whole chain turns on. */
    circumferenceFor: function (stormCount) { return digitSum(stormCount); },
    node: function (id) { for (var i = 0; i < NODES.length; i++) if (NODES[i].id === id) return NODES[i]; return null; }
  };

  if (root && root.document) root.RELIQUARY_CHAIN = Chain;
  if (typeof module !== 'undefined' && module.exports) { module.exports = Chain; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
