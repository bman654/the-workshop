/* ═══════════════════════════════════════════════════════════════════════════
   THE RELIQUARY — chain.mjs  ·  the mystery DAG, as data (the SOLE authority)

   "The Sealed Room's Diary": a found diary walled up behind the Register. The
   mystery grows across THREE chapters + a finale annex — 10 clues, each naming ONE
   standing exhibit + ONE action, daisy-chained so each clue is decoded by the
   instrument the prior clues unlock:

     CHAPTER I — the first gathering (whose diary, and what the house forgot):
       C1  THE MUSEUM · River of Days   — engage BY REAL TIME + dwell the playhead in
                                          the storm day-band. Mints a courier key =
                                          the digit-sum of the storm's commit count.
       C2  THE SCYTALE · the Spartan rod — wind the enciphered diary page on a rod of
                                          THAT circumference; the plaintext names C3.
       C3  THE CARD CATALOG · the Register — pull the manicule and search the prose
                                          for the house's forgotten first name. The
                                          entry that "has no room" is the sealed study
                                          itself; finding it un-walls the confession.

     CHAPTER II — the drowned village (three parallel threads off C3):
       C4  THE SINGING PLATE  — cast it round, free the rim, step to the bell's tenth
                                voice; read the number off the dial.
       C5  THE ASTROLABE      — set the brass sky to her moment and count the stars
                                that stood above the horizon over the drowning.
       C6  THE CARTOGRAPHER'S DREAM — turn the vellum's back, dwell the lantern, and
                                let the fog letter the valley's old name.

     CHAPTER III — the keeper's hand (the last pages, in a second hand, enciphered):
       C7  THE BLACK CHAMBER  — break the waterworks company's notice with no key.
       C8  THE VOLVELLE       — wind her wheel-cipher backward, keyed by the chart name.
       C9  THE SCRIPTORIUM    — seed the press as she instructed, open the key, and
                                write her name back into the world.
       C10 THE MERE (annex)   — every page read: the study's cold wall gives, and the
                                memorial beyond it sets the grand payoff key.

   This module is DOM-free, zero-import, dual-use (browser global RELIQUARY_CHAIN +
   Node import). It is forge-inlined into the-reliquary/index.html (between the
   CHAIN sentinels) so the page's board + colophon read the IDENTICAL data the
   headless completability solver (selftest.mjs) proves solvable. Nothing about the
   chain is typed twice.

   THE ANTI-DRIFT NUMBERS. No mechanical constant is hand-pinned by intuition: the
   museum derives the storm (busiestDay → 118 commits on 2026-06-13); the digit sum
   1+1+8 = 10 is the circumference (CH I). CHAPTER II/III constants (BELL_HZ, TOL,
   STAR_COUNT, DREAM_TITLE/VOLVELLE_KEY, NOTICE_CIPHER, C8_STRIP, SCRIPT_SEED, the
   seal glyphs) are ALL derived by the-reliquary/harness/bake.mjs directly from the
   LIVE host cores and pinned here verbatim from constants.json (never hand-typed).
   selftest.mjs RE-DERIVES every one from the host code so no number can drift from
   its instrument. Fictional constants (names, prose) are chain.js-authoritative,
   like FORGOTTEN_NAME / KEEPER_NAME.
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

  /* ── CHAPTER II/III derived constants (from harness/bake.mjs → constants.json).
     Every mechanical value below is re-derived from the live host cores by
     selftest.mjs; the strings are copied verbatim from constants.json, never typed. */

  // c4 — the bell under the water (singing-plate). BELL_INDEX = the 10th singable
  // mode for (circle, free) at the pinned params; BELL_HZ = Math.round(eigHz).
  var BELL_INDEX = 10;
  var BELL_HZ = 677;
  var TOL = 7.0;                 // Hz, PINNED (DESIGN §4 c4); ≤ 0.5×min adjacent singable gap (7.351)

  // c5 — the stars that stood witness (astrolabe). The diary's FIXED remembered
  // count of her night (2026 sky at lat 51 / lon −3 / day 171 / minute 0). The
  // witness is tuple-only (no live-count clause) so a later-year sky can't softlock.
  var STAR_COUNT = 15;

  // c6 — the chart before the flood (cartographer's dream). DREAM_TITLE = the
  // valley's old name lettered in the cartouche; VOLVELLE_KEY = its last word.
  var DREAM_SEED = 'hollowmere';
  var DREAM_TITLE = 'the Last Teiteil';
  var VOLVELLE_KEY = 'TEITEIL';

  // c7 — the notice under the wax (black-chamber). NOTICE_PLAINTEXT with DREAM_TITLE
  // inlined; NOTICE_CIPHER = the volvelle CORE's real Vigenère encipher, keyword
  // MICHAELMAS (the motif of ten). The Chamber recovers both with NO key given.
  var NOTICE_PLAINTEXT =
    'TO THE OCCUPIER OF HOLLOWMERE MILL IN THE VALLEY OF the Last Teiteil NOTICE IS HEREBY ' +
    'GIVEN THAT BY ORDER OF THE WATERWORKS COMPANY AND UNDER THE POWERS CONFERRED UPON IT BY ' +
    'ACT OF PARLIAMENT THE WATERS OF THE VALLEY WILL BE RAISED AT MICHAELMAS NEXT ALL WHEELS ' +
    'MUST STOP ALL HEARTHS BE QUENCHED AND ALL SOULS QUIT THE VALLEY BY THAT DAY THE CHURCH ' +
    'THE MILL AND ALL DWELLINGS BENEATH THE SURVEYED LINE WILL BE GIVEN TO THE WATER THE ' +
    'COMPANY WILL PAY FOR STONE CARTED UPHILL BUT NOT FOR NAMES AND NO CLAIM SHALL BE ' +
    'ENTERTAINED AFTER THE LAST DAY OF SEPTEMBER';
  var NOTICE_CIPHER =
    'FWVOESNOUHUMTVFLZXLGIUGYEQTXLAZBJLVEWXEQANVOEPLETLQQVLIPYATAOMKZHICQBQSQXLNXSMTTKWTKEVZR' +
    'TZQECAEVHARCEKQTPEYKAFPCPKEVETEHAEGYSGZZFWDZGKUTZZILNGCJTSQBAJXQCTEREFHWIIVLRWZRTZQDCSLI' +
    'JIIDXJGYAMDQDSFUKJHEPXMSEVGETEWXWZQMNZMYDFSLAXCSLLPMRLTADLQYPZCZQLCUDEWXSGGTUXUMEFHWHINS' +
    'ECMKTZMBFHYXSQCZGZEOTLPYIDXIPKAPWPWWXTKUGWMQNWMBJAHIDGRNQGGKLMYQWAXTDLGMGQNLABJLWEEQRLTM' +
    'EVMTLZYOUTNWACQARKFWPLCECFEVGXJPLPMGTFABHVRRLYEKMVFUOGWMIEEPCSLFPQNLQZVHIRPPAXFMTAHIWMSL' +
    'PIAVFWPBTWYJGY';

  // c8 — the last pages, in her cipher (volvelle). C8_PLAINTEXT is her instruction;
  // C8_STRIP = the volvelle CORE's real Vigenère encipher of it under VOLVELLE_KEY.
  // "the stars WE counted" points the player at the diary's own remembered number
  // on the dried c5 page (the year-proof reading).
  var C8_PLAINTEXT =
    'SEED THE WRITING PRESS WITH THE HOUSES FIRST NAME THEN THE STARS WE COUNTED THEN THE ' +
    'BELLS VOICE THEN MY MARK WHICH IS SICKLE ALL SMALL JOINED WITH HYPHENS THEN OPEN THE KEY ' +
    'AND READ MY SEAL';
  var C8_STRIP =
    'LIMWXPPPVQMMVRIVMLWETMLBAIPZNWMLJQCLXVTQMEAIVMLMDMEZLAMNHYVMILEAIVMLMMXPTLZWTVIBAIVXRQIK' +
    'OESBGPBWATVOTXETWLQIEPRZBRMWAQEALGILMYLXPXRWAXRBAISPREVWVMLWQGLIIW';

  // c9 — her seal, cut in her own hand (scriptorium). SCRIPT_SEED = the search-won
  // seed (order A, mark "sickle") whose script preserves 'winifred'; RUNE_WORD =
  // the name the press writes back. KEEPER_NAME is the full fictional name (the
  // annex + confession II render it) — chain.js-authoritative, like FORGOTTEN_NAME.
  var SCRIPT_SEED = 'hollowmere-15-677-sickle';
  var RUNE_WORD = 'winifred';
  var KEEPER_NAME = 'Winifred Marlowe';

  // c10 — the mere (annex). The grand payoff key set on entering the memorial.
  var GRAND_KEY = 'ws:seen:the-mere';

  /* THE DAG. Each node is a clue: an id, its chapter, its human face (title + the
     oblique diary line + the host it points at + the un-smudged page revealed on
     solve), the ws:flag witness that a thin host breadcrumb sets, and `needs` — the
     ids that must be solved BEFORE this clue's witness can legally fire (the
     daisy-chain). `carry` (C1 only) names the courier payload the solve mints for
     the next hop.

     A clue is SOLVED in the live board iff its witness flag is present. The solver
     proves: from the empty start, following `needs` in order, every witness is
     reachable by a legal host action, no witness depends on a ws: key nothing sets,
     and the payoff (all ten + GRAND_KEY) is reachable. Chapter II is three PARALLEL
     threads off c3; chapter III is the linear c7→c8→c9→c10 unwinding. */
  var NODES = [
    {
      id: 'c1', chapter: 1,
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
      id: 'c2', chapter: 1,
      witness: 'ws:flag:dossier:read-the-strip',
      needs: ['c1'],
      host: 'scytale', hostName: 'The Scytale · the Spartan rod', hostHref: '../scytale/index.html',
      title: 'Wind me on the rod',
      diary: 'This page is scrambled on purpose. Wind the strip helically upon the Spartan rod — but only the right rod re-aligns it. The key is the number of stones in the storm, folded as the last page taught you.',
      page: 'On the rod of ten the letters closed like a shutter and I could read it plain: THE LAST PAGE IS BOUND INTO THE REGISTER — FIND THE ENTRY WITH NO ROOM — ITS NAME IS HOLLOWMERE.'
    },
    {
      id: 'c3', chapter: 1,
      witness: 'ws:flag:dossier:found-the-phantom',
      needs: ['c2'],
      host: 'card-catalog', hostName: 'The Card Catalog · the Register', hostHref: '../card-catalog/index.html',
      title: 'The entry with no room',
      diary: 'The last page was never a page. They bound it into the Register itself — an entry for a room that was walled up before it was ever built. Pull the manicule. Search the prose for the name the house wore first.',
      page: 'And there it was, catalogued in a hand not mine: Hollowmere — the mill on the drowned mere, the house’s christened name, sealed behind the shelving the day it chose to become a workshop instead.'
    },
    {
      id: 'c4', chapter: 2,
      witness: 'ws:flag:dossier:heard-the-bell',
      needs: ['c3'],
      host: 'singing-plate', hostName: 'The Singing Plate', hostHref: '../singing-plate/index.html',
      title: 'The bell under the water',
      diary: 'The church went under with its bell still hung, and on still nights the mere rang it for us. It was cast round and its rim hung free, and of its many voices she loved the tenth — the one that made the sand on the millstones dance in rings. This house keeps a plate that sings the same way. Cast it round, free its rim, and step the drive up to the tenth voice it will sing; hold it there, and read the number off the dial.',
      page: '677 — the bell’s tenth voice, to the nearest whole count. I held the plate at its note and the sand drew the rings I remember. Ten again; the house keeps its number.'
    },
    {
      id: 'c5', chapter: 2,
      witness: 'ws:flag:dossier:counted-the-stars',
      needs: ['c3'],
      host: 'astrolabe', hostName: 'The Astrolabe', hostHref: '../astrolabe/index.html',
      title: 'The stars that stood witness',
      diary: 'The night the waters rose I could not watch the valley, so I watched the sky. From the mill door — one-and-fifty degrees north of the line, three west of the meridian — on midsummer’s night, at the very middle of it. This house keeps a brass sky that can be set to any hour. Set it to mine, and count with me the stars that stood above the horizon.',
      page: 'Fifteen stars stood above the horizon over the drowning, and not one of them so much as blinked. I counted them twice.'
    },
    {
      id: 'c6', chapter: 2,
      witness: 'ws:flag:dossier:unfogged-the-chart',
      needs: ['c3'],
      host: 'the-cartographers-dream', hostName: 'The Cartographer’s Dream', hostHref: '../the-cartographers-dream/index.html',
      title: 'The chart before the flood',
      diary: 'There was a chart of our valley before the flood — the surveyors’ vellum, fogged past reading. The dreaming page in this house keeps it now; the house’s first name is pressed into the sheet’s back, small. Carry the lantern over the vellum slowly. It remembers, if you are patient, and letters the valley’s old name in the cartouche.',
      page: 'The fog gave, and the cartouche lettered it plain: the Last Teiteil. That was the valley’s name on the old rolls, before the company drowned it for a city’s thirst.'
    },
    {
      id: 'c7', chapter: 3,
      witness: 'ws:flag:dossier:cracked-the-notice',
      needs: ['c4', 'c5', 'c6'],
      host: 'black-chamber', hostName: 'The Black Chamber', hostHref: '../black-chamber/index.html',
      title: 'The notice under the wax',
      diary: 'Between the dried pages a loose leaf slips free — a letter that came the winter before, under the company’s wax, its words scrambled in the fashion of clerks ashamed of what they carry. I never had its key. This house keeps a chamber where letters are opened without one. Take the leaf there and let it be read.',
      page: 'The chamber broke it in an afternoon. They gave us until Michaelmas. The company would pay for stone carted uphill, but not for names. The keeper read it twice, said nothing, and that night began to number the stones.'
    },
    {
      id: 'c8', chapter: 3,
      witness: 'ws:flag:dossier:wound-the-wheel',
      needs: ['c7'],
      host: 'volvelle', hostName: 'The Volvelle', hostHref: '../volvelle/index.html',
      title: 'The last pages, in her cipher',
      diary: 'The final pages are not in my hand. She wrote them in wheel-cipher, as her mother taught her, and for her key she took the valley’s own name off the old chart — the last word of it, as the cartouche letters it. The disk on the workbench turns both ways. Wind it backward.',
      page: 'On the wheel her words came clear, and they were instructions — seed the press with the house’s first name, the stars, the bell’s voice, and her own mark, all small, joined with hyphens — and read her seal.'
    },
    {
      id: 'c9', chapter: 3,
      witness: 'ws:flag:dossier:read-her-hand',
      needs: ['c8'],
      host: 'scriptorium', hostName: 'The Scriptorium', hostHref: '../scriptorium/index.html',
      title: 'Her seal, cut in her own hand',
      diary: 'Pinned under this page is her seal — a word in a script no living hand has cast. The press in the scriptorium casts any hand you seed it with. Seed it as she told you; open the key; and write her name back into the world, letter by letter, in the plain alphabet beneath.',
      page: 'W. I. N. I. F. R. E. D. I wrote it under her glyphs and the press agreed. Winifred. The keeper had a name, and I had forgotten that I knew it.'
    },
    {
      id: 'c10', chapter: 3,
      witness: 'ws:seen:the-mere',
      needs: ['c9'],
      host: 'the-mere', hostName: 'The Mere', hostHref: './the-mere.html',
      title: 'The wall',
      diary: 'The far wall of the study has been cold to the touch since the day it was raised. Every page is read. Push.',
      page: 'The wall gave without a sound, and beyond it the mere lay black and still, with the drowned village’s lights burning small beneath the water. A bell-pull hung by the sill; I drew it once and heard the tenth voice come up through the mere. On the mill stone, cut deep: WINIFRED MARLOWE — the miller’s daughter — who numbered the stones and carried Hollowmere uphill.'
    }
  ];

  /* the payoff key set when c1–c3 are all solved (the Gate + the Undercroft trophy
     + the card-catalog gates read it). UNCHANGED — the confession-I path fires on
     exactly this key; the full-mystery payoff is the separate NEW key GRAND_KEY. */
  var SOLVED_KEY = 'ws:seen:reliquary-solved';

  var Chain = {
    NODES: NODES,
    SOLVED_KEY: SOLVED_KEY,
    GRAND_KEY: GRAND_KEY,
    C3_PLAINTEXT: C3_PLAINTEXT,
    FORGOTTEN_NAME: FORGOTTEN_NAME,
    KEEPER_NAME: KEEPER_NAME,
    RUNE_WORD: RUNE_WORD,
    // c4 — the bell
    BELL_INDEX: BELL_INDEX,
    BELL_HZ: BELL_HZ,
    TOL: TOL,
    // c5 — the stars
    STAR_COUNT: STAR_COUNT,
    // c6 — the chart
    DREAM_SEED: DREAM_SEED,
    DREAM_TITLE: DREAM_TITLE,
    VOLVELLE_KEY: VOLVELLE_KEY,
    // c7 — the notice
    NOTICE_PLAINTEXT: NOTICE_PLAINTEXT,
    NOTICE_CIPHER: NOTICE_CIPHER,
    // c8 — her cipher
    C8_PLAINTEXT: C8_PLAINTEXT,
    C8_STRIP: C8_STRIP,
    // c9 — her seal
    SCRIPT_SEED: SCRIPT_SEED,
    digitSum: digitSum,
    /* the circumference the player must dial, given the storm's commit count.
       STATED reduction = digit sum. The single arithmetic CH I turns on. */
    circumferenceFor: function (stormCount) { return digitSum(stormCount); },
    node: function (id) { for (var i = 0; i < NODES.length; i++) if (NODES[i].id === id) return NODES[i]; return null; }
  };

  if (root && root.document) root.RELIQUARY_CHAIN = Chain;
  if (typeof module !== 'undefined' && module.exports) { module.exports = Chain; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
