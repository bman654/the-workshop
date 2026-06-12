/* ───────────────────────────────────────────────────────────────────────────
   THE LAMPLIGHTER — a Lantern tale.
   A world-file: pure declarative data (see ../ADVENTURE.SPEC.md §2). No engine
   code. The engine interprets this; the solver proves it winnable & softlock-free.

   Shape of the tale (the intended path — the solver re-derives it, doesn't trust it):
     take lantern → (back) shed: take pry-bar → (out) lodge: use pry-bar on hatch
       → (down) cellar: take oil → (up) lodge: use oil on lantern, light lantern at hearth
       → (out) lane: light the lane's lamp → (on) square: light the square's lamp
       → (up) hill: light the last lamp → the dawn answers. ~13 moves.

   Verifiable promise: provably winnable AND provably softlock-free (the only
   consumable — the oil — is spent only into the lantern, after which it is never
   needed again; every gate is a monotonic flag; the lantern, once lit, stays lit).
   ─────────────────────────────────────────────────────────────────────────── */

const WORLD = {
  meta: {
    id:     'the-lamplighter',
    title:  'The Lamplighter',
    byline: 'a Lantern tale',
    accent: '#f3b94d',            // lamp-flame amber
    intro:
      'Dusk has come down over the town, and not one lamp is lit. That has never ' +
      'happened in all your forty years on the round — the dark arriving with no answer. ' +
      'They say the morning waits on the lamps now; that until the round is walked and the ' +
      'last wick lit, the dawn will not come. You wake in the lodge with the cold in your ' +
      'knees and the long habit in your hands.',
  },

  start: 'lodge',
  win: {
    flag:  'dawn',
    title: 'Dawn',
    text:
      'You touch the flame to the last wick and step back. For a moment nothing — only ' +
      'your small light and the great dark leaning on it. Then, far off past the river, a ' +
      'paleness. The first lamp of morning, answering yours. The round is walked. You sit ' +
      'down on the cold hill to watch the day come up, the way a lamplighter does, having ' +
      'made the dark give way one more time.',
  },

  rooms: {

    lodge: {
      name: 'The Lamplighter’s Lodge',
      art:  'lodge',
      desc: [
        'A low room, all hearth and habit. The fire is down to its last red coal but it ' +
        'still throws a little light. Your coat hangs on its nail; the round-ledger lies ' +
        'open on the table where you left it. A square hatch in the floor goes down to the ' +
        'cellar. The door gives out onto the lane; a second door at the back leads to the shed.',
        'The hearth-coal still glows. The ledger waits on the table. The hatch is in the floor; ' +
        'the lane is out the front, the shed out the back.',
      ],
      exits: {
        out:  { to:'lane',  if:{ flag:'lantern-lit', has:'lantern' },
                blocked:'Past the doorstep the dark is total — you would only stumble and fall. Not without a lit lantern in your hand.' },
        back: { to:'shed' },
        down: { to:'cellar', if:{ flag:'cellar-open' },
                blocked:'The hatch is swollen shut. You can’t lift it by hand.' },
      },
    },

    shed: {
      name: 'The Back Shed',
      art:  'shed',
      desc: [
        'Cold and close and smelling of oil and iron. Tools hang in rows, most of them ' +
        'rusted to their hooks. A short iron pry-bar leans in the corner where it always does.',
        'The shed. The pry-bar in its corner; the lodge back through the door.',
      ],
      exits: {
        out: { to:'lodge' },
      },
    },

    cellar: {
      name: 'The Cellar',
      art:  'cellar',
      desc: [
        'You climb down into the dark and the damp. It is a small stone cellar, mostly empty ' +
        'now. A crate sits against the wall, and on a shelf above it — the thing you came down ' +
        'for — a tin of lamp-oil, heavy and full.',
        'The cellar. The oil-tin on its shelf; the ladder back up to the lodge.',
      ],
      exits: {
        up: { to:'lodge' },
      },
    },

    lane: {
      name: 'The Lane',
      art:  'lane',
      desc: [
        'Out into the lane, your lantern throwing a coin of light onto the cobbles and the ' +
        'shut faces of the houses. The first of the round’s lamps stands here on its post, ' +
        'dark and patient, waiting to be lit. Past it the lane runs on toward the square, but ' +
        'the dark there is a wall.',
        'The lane. The lamp on its post; the lodge behind you, the square on ahead.',
      ],
      exits: {
        back: { to:'lodge' },
        on:   { to:'square', if:{ flag:'lit-lane' },
                blocked:'Beyond the lamp the lane is pitch dark. Light the lamp here first, and let it light your way on.' },
      },
    },

    square: {
      name: 'The Market Square',
      art:  'square',
      desc: [
        'The square opens out, wide and empty, the market stalls folded away for the night. ' +
        'A dry fountain stands at the centre, and beside it the square’s great lamp, taller ' +
        'than the rest. A notice is pinned to the fountain’s rim. The hill road climbs away ' +
        'to the north, into the dark above the rooftops.',
        'The square. The tall lamp by the dry fountain; the lane behind, the hill road climbing north.',
      ],
      exits: {
        back: { to:'lane' },
        up:   { to:'hill', if:{ flag:'lit-square' },
                blocked:'The hill road runs up into the dark. Light the square first, so you can find the way up.' },
      },
    },

    hill: {
      name: 'The Hill Above the Town',
      art:  'hill',
      desc: [
        'The road brings you out onto the bare hill above the town, where the wind is, and the ' +
        'whole dark country lies below. Here stands the last lamp of the round — the beacon, the ' +
        'highest one, the one the rest are walked toward. Below you the lane and the square burn ' +
        'small and warm. Only this one left, and then the morning.',
        'The hill. The beacon waiting; the town below, two small fires in the dark.',
      ],
      exits: {
        down: { to:'square' },
      },
    },
  },

  things: {

    lantern: {
      name: 'the brass lantern',
      at: 'lodge',
      portable: true,
      verbs: {
        look: 'Your lantern — brass gone soft-gold with handling, the glass smoked, the wick ' +
              'dry as a bone. It wants oil, and then a flame.',
        take: { do:[{ take:'lantern' }],
                say:'You take down the lantern. It has been yours for forty years and it knows your hand.' },
        light:{ if:{ flag:'wick-oiled', at:'lodge' },
                do:[{ flag:'lantern-lit' }],
                say:'You tip the lantern to the hearth’s last coal. The oiled wick catches — a small ' +
                    'tongue of flame, then a steady gold. The room leans back from the light. You are ready to walk.',
                else:'The wick is dry, or there’s no flame to hand. The hearth here in the lodge still has a coal in it.' },
      },
    },

    oil: {
      name: 'the tin of lamp-oil',
      at: 'cellar',
      portable: true,
      verbs: {
        look: 'A heavy tin of clear lamp-oil, near full. Enough to wet a wick and more.',
        take: { do:[{ take:'oil' }], say:'You lift the oil-tin off the shelf. It’s satisfyingly heavy.' },
      },
      useOn: {
        lantern: { do:[{ flag:'wick-oiled' }, { gone:'oil' }],
                   say:'You unstop the tin and tip it carefully into the lantern’s font. The dry wick ' +
                       'drinks it dark and glistening. Now it only wants a flame.' },
      },
    },

    'pry-bar': {
      name: 'the iron pry-bar',
      at: 'shed',
      portable: true,
      verbs: {
        look: 'A short, honest iron bar, one end flattened to a wedge. Made for stuck things.',
        take: { do:[{ take:'pry-bar' }], say:'You take the pry-bar. Cold and certain in the hand.' },
      },
      useOn: {
        hatch: { if:{ noflag:'cellar-open' },
                 do:[{ flag:'cellar-open' }],
                 say:'You work the wedge under the lip of the hatch and lean your weight on it. ' +
                     'For a moment nothing; then, with a groan of old wood, the hatch gives and lifts. ' +
                     'Cold cellar-air comes up out of the dark.',
                 else:'The hatch is already open.' },
      },
    },

    hatch: {
      name: 'the cellar hatch',
      at: 'lodge',
      verbs: {
        look: { if:{ flag:'cellar-open' }, say:'The hatch stands open; the ladder goes down into the dark.',
                else:'A square hatch set in the floorboards, swollen tight in its frame. The damp has ' +
                     'sealed it shut. You’d need to lever it.' },
        open: { if:{ flag:'cellar-open' }, say:'It’s already open.',
                else:'Swollen fast in its frame. You can’t shift it with your hands — you’d need something to lever it.' },
        pull: { if:{ flag:'cellar-open' }, say:'It’s already open.',
                else:'It doesn’t budge. The wood has swollen tight. You’d need something to lever it with.' },
      },
    },

    ledger: {
      name: 'the round-ledger',
      at: 'lodge',
      verbs: {
        read: 'The round-ledger, in your own square hand, the same lines walked every night for ' +
              'forty years:\n  “Oil from the cellar, flame from the hearth.\n   Then lamp by lamp, and ' +
              'lowest first:\n   the lane, the square, and last the hill.\n   Walk them in order and the morning comes.”',
        look: 'Your ledger, open to tonight’s round. The hand is yours; the round is the round.',
      },
    },

    coat: {
      name: 'the lamplighter’s coat',
      at: 'lodge',
      verbs: {
        look: 'Your long coat on its nail, worn to the shape of you, smelling of cold air and lamp-oil. ' +
              'You won’t be long enough away to need it. The lamps won’t wait.',
      },
    },

    crate: {
      name: 'the crate',
      at: 'cellar',
      verbs: {
        look: 'An old crate, empty but for cobwebs and the ghost of a smell of apples. Nothing in it now.',
      },
    },

    fountain: {
      name: 'the dry fountain',
      at: 'square',
      verbs: {
        look: 'The square’s fountain, its basin dry and full of last autumn’s leaves. In summer it ' +
              'runs; tonight it only holds the dark and a pinned notice.',
      },
    },

    notice: {
      name: 'the notice',
      at: 'square',
      verbs: {
        read: 'A weathered notice, pinned and re-pinned for years:\n  “BY OLD ORDER OF THE TOWN — the ' +
              'lamps of the round shall be lit at dusk, lowest to highest, that the morning be not kept ' +
              'waiting. Let no lamp stand dark while another above it burns.”',
        look: 'A town notice, pinned to the fountain’s rim, the ink half-gone with weather.',
      },
    },

    lampLane: {
      name: 'the lane lamp',
      at: 'lane',
      verbs: {
        look: { if:{ flag:'lit-lane' }, say:'The lane lamp burns steady on its post, throwing a warm ring on the cobbles.',
                else:'The first lamp of the round, dark on its iron post, the wick clean and waiting. The lowest of the three.' },
        light:{ if:{ flag:'lantern-lit', has:'lantern' },
                do:[{ flag:'lit-lane' }],
                say:'You reach up with the lit lantern and touch its flame to the lamp’s wick. It takes, ' +
                    'and a warm ring of light spreads out over the cobbles. Ahead, the lane gives up a little of its dark.',
                else:'You’ve nothing to light it with. You’d need your own lantern, lit, in your hand.' },
      },
    },

    lampSquare: {
      name: 'the square lamp',
      at: 'square',
      verbs: {
        look: { if:{ flag:'lit-square' }, say:'The tall square lamp burns over the empty market, gold on the cobbles.',
                else:'The square’s lamp, taller than the rest, dark over the dry fountain. The second of the round.' },
        light:{ if:{ flag:'lantern-lit', has:'lantern' },
                do:[{ flag:'lit-square' }],
                say:'You raise the lantern to the tall lamp and it catches, flooding the whole square with ' +
                    'a soft gold. The hill road, that was a wall of dark, shows itself now, climbing away north.',
                else:'You’ve nothing to light it with — only your own lantern, lit, would do it.' },
      },
    },

    lampHill: {
      name: 'the beacon',
      at: 'hill',
      verbs: {
        look: 'The last lamp — the beacon on the hill, the highest of the round, the one the others are ' +
              'walked toward. Below it the lane and the square burn small and warm in the dark.',
        light:{ if:{ flag:'lantern-lit', has:'lantern' },
                do:[{ flag:'dawn' }, { win:true }],
                say:'You climb the beacon’s little stair and touch your flame to the last wick of the round.',
                else:'You’ve nothing to light it with. Only your own lantern, lit, in your hand.' },
      },
    },
  },
};

/* Dual-use: a global for inline <script> in a shipped tale; a module export for Node solving. */
if (typeof module !== 'undefined' && module.exports) { module.exports = { WORLD }; }
