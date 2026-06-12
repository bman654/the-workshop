/* ───────────────────────────────────────────────────────────────────────────
   THE FERRYMAN — a Lantern tale.
   A world-file: pure declarative data (see ../ADVENTURE.SPEC.md §2). No engine code.

   The second tale, written to a DIFFERENT shape than The Lamplighter — to prove the
   format's range. Where the Lamplighter is a journey of lights (gather, then light
   lamp by lamp), this is a puzzle-box with an NPC: talk to learn the toll, read a
   clue, find the hidden key, open the offering-box, and pay the crossing. Exercises
   talk, give (useOn), a reveal-under-stone, and a locked container — none of which
   the first tale used.

   Intended path (the solver re-derives it): talk to the ferryman (the toll: one coin)
     → path → willow → shrine: read the tablet (the clue) → back → willow: turn the
     grey stone (the key) → take key → on → shrine: use key on the box (the coin)
     → take coin → back → willow → bank: give the coin to the ferryman → the crossing.

   Provably winnable AND softlock-free: nothing is consumed except the coin, and the
   coin is spent only into the winning act; every other change is a monotonic flag or
   a one-time reveal.
   ─────────────────────────────────────────────────────────────────────────── */

const WORLD = {
  meta: {
    id:     'the-ferryman',
    title:  'The Ferryman',
    byline: 'a Lantern tale',
    accent: '#79b4b0',            // river-teal, moonlit water
    intro:
      'You come down to the river in the last of the dark, the way the dream brought you — ' +
      'a wide black water with no far side that you can see, and a boat at the bank, and a ' +
      'figure in the boat who does not look round. You understand, the way you understand ' +
      'things here, that you have come to be carried across. You understand, too, that it ' +
      'will not be for nothing.',
  },

  start: 'bank',
  win: {
    flag:  'crossed',
    title: 'The Far Shore',
    text:
      'The coin leaves your hand and the ferryman closes his fist on it without a word. He ' +
      'sets his pole to the bank and the boat slides out onto the black water, and the near ' +
      'shore goes soft and grey and gone behind you. For a long while there is only the dip ' +
      'of the pole and the dark. Then, ahead, low down, a line of paler dark that is the other ' +
      'side — and you find you are not afraid of it. You were always going to be carried across. ' +
      'It only wanted the toll.',
  },

  rooms: {

    bank: {
      name: 'The River Bank',
      art:  'bank',
      desc: [
        'The near bank, all cold mud and reeds, and the great black river going by without a ' +
        'sound. The ferryman sits in his boat with his back to you, still as a heron, his pole ' +
        'across his knees. A path runs up from the water, inland, under a willow.',
        'The cold bank. The ferryman in his boat, his back to you; the willow path running up inland.',
      ],
      exits: {
        path: { to:'willow' },
      },
    },

    willow: {
      name: 'Under the Willow',
      art:  'willow',
      desc: [
        'The path climbs a little under an old willow whose strands hang down all around like a ' +
        'grey curtain, stirring though there is no wind. At its foot, half-sunk in the earth, ' +
        'lies a flat grey stone. The way runs on, inland, toward a darker shape among the trees.',
        'Under the willow, its strands stirring. The grey stone at its foot; the river behind, the dark shape on ahead.',
      ],
      exits: {
        back: { to:'bank' },
        on:   { to:'shrine' },
      },
    },

    shrine: {
      name: 'The Old Shrine',
      art:  'shrine',
      desc: [
        'A little roadside shrine, long abandoned — a broken arch of pale stone, and beneath it ' +
        'a stone offering-box, iron-bound and locked. A flat tablet is set into the arch, with ' +
        'old letters cut deep enough to read by touch. The willow path is the only way back.',
        'The broken shrine. The locked offering-box beneath the arch; the cut tablet above it; the path back to the willow.',
      ],
      exits: {
        back: { to:'willow' },
      },
    },
  },

  things: {

    ferryman: {
      name: 'the ferryman',
      at: 'bank',
      verbs: {
        look: 'He sits with his back to you, hooded, his hands folded on the pole. Patient as the ' +
              'river. He has all the time there is, and he is waiting for one particular thing.',
        talk: { if:{ has:'coin' },
                say:'The ferryman’s head turns, just a little. "You have the toll now," he says, in a ' +
                    'voice like water over stones. "Give it here, then, and I’ll carry you over."',
                else:'"Two banks, one river, and a toll between." He does not turn. "One coin, old as the ' +
                     'water, that’s the fare — no coin, no crossing, and no arguing with it. There’s an old ' +
                     'shrine up the willow path. Folk used to leave their offerings there, once. Folk used to ' +
                     'leave all sorts of things."' },
      },
      // the crossing itself is paid via coin.useOn.ferryman (see `coin`)
    },

    boat: {
      name: 'the ferryman’s boat',
      at: 'bank',
      verbs: {
        look: 'A long flat boat, black with age and river-water, riding low at the bank. It would ' +
              'carry you over easily enough — but not, you know, without the ferryman, and not without his toll.',
        enter:{ if:{ flag:'crossed' }, say:'You are already aboard, already going over.',
                else:'You make to step in. Without turning, the ferryman lifts his pole an inch and sets ' +
                     'it across the gunwale, barring you. "The toll first," he says. That is all.' },
      },
    },

    tablet: {
      name: 'the cut tablet',
      at: 'shrine',
      verbs: {
        look: 'A flat tablet set into the broken arch, the letters cut deep and worn soft.',
        read: 'You read the old cut letters with your fingers:\n  “WHAT THE RIVER TAKES, THE WILLOW KEEPS.\n' +
              '   WHAT THE WILLOW KEEPS LIES UNDER THE GREY STONE.\n   STOOP, AND BE FERRIED.”',
      },
    },

    stone: {
      name: 'the grey stone',
      at: 'willow',
      verbs: {
        look: { if:{ flag:'stone-turned' }, say:'The grey stone lies tipped aside, the bare hollow beneath it empty now.',
                else:'A flat grey stone at the willow’s foot, half-sunk and slick with damp. It looks as ' +
                     'though it has lain undisturbed a long time — but it would lift.' },
        turn: { if:{ noflag:'stone-turned' },
                do:[{ move:['key','willow'] }, { flag:'stone-turned' }],
                say:'You stoop and work your fingers under the cold lip of the stone and tip it over. In ' +
                    'the bare earth beneath, half-pressed into the dark, lies a small iron key.',
                else:'The stone is already tipped aside. Only the empty hollow remains.' },
        lift: { if:{ noflag:'stone-turned' },
                do:[{ move:['key','willow'] }, { flag:'stone-turned' }],
                say:'You lift the grey stone aside. Beneath it, pressed into the cold earth, a small iron key.',
                else:'Already lifted. The hollow beneath is empty.' },
      },
    },

    key: {
      name: 'the iron key',
      at: '_gone',                 // revealed under the stone (moved into `willow`)
      portable: true,
      verbs: {
        look: 'A small iron key, cold and rough with rust, but whole. A key for one lock, plainly.',
        take: { do:[{ take:'key' }], say:'You take the iron key. It is colder than the air.' },
      },
      useOn: {
        box: { if:{ noflag:'box-open' },
               do:[{ flag:'box-open' }, { move:['coin','shrine'] }],
               say:'The iron key bites, and turns, and the lock of the offering-box gives with a small ' +
                   'dead click. You lift the lid. Inside, on a bed of old dust, lies a single coin.',
               else:'The box is already open.' },
      },
    },

    box: {
      name: 'the offering-box',
      at: 'shrine',
      verbs: {
        look: { if:{ flag:'box-open' }, say:'The offering-box stands open, its lid tipped back.',
                else:'A stone offering-box beneath the arch, iron-bound, its lock old but sound. It does not give to the hand. It wants a key.' },
        open: { if:{ flag:'box-open' }, say:'It is already open.',
                else:'Locked. The iron lock holds. You would need its key — and the tablet above it ' +
                     'seems to want to tell you where one lies.' },
      },
    },

    coin: {
      name: 'the old coin',
      at: '_gone',                 // revealed inside the box (moved into `shrine`)
      portable: true,
      verbs: {
        look: 'An old coin, worn smooth past any face or figure, and far heavier than its size. Old ' +
              'as the water, the ferryman said. This is the toll; you do not doubt it for a moment.',
        take: { do:[{ take:'coin' }], say:'You take the old coin. It sits in your palm like a small cold weight of certainty.' },
      },
      useOn: {
        ferryman: { do:[{ flag:'crossed' }, { win:true }],
                    say:'You hold out the old coin to the ferryman.' },
      },
    },
  },
};

if (typeof module !== 'undefined' && module.exports) { module.exports = { WORLD }; }
