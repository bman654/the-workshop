/* ───────────────────────────────────────────────────────────────────────────
   THE NIGHT SHIFT — a Lantern tale. (A hidden one: it lives in the Undercroft,
   not on the public shelf. It is the hidden world's first INTERACTIVE room.)

   A world-file: pure declarative data (see ../ADVENTURE.SPEC.md §2). No engine code.

   The conceit: you are the keeper of THIS workshop — the one with the nine doors —
   walking the last round after closing. Three wings have not gone to sleep: the
   arcade's last cabinet still burns, a specimen in the garden droops unwatered, a
   bell in the sound garden hums on. Put each to bed, and the broken stair will let
   you go down to where the secrets sleep, and keep the watch.

   Intended path (the solver re-derives it): take the watering-can → arcade: play
   the last game home → garden: water the specimen → sound garden: listen the bell
   down → the stair unbars → descend → The Night Watch. (~9 moves.)

   Provably winnable AND softlock-free: nothing is consumable at all — every gate
   is a monotonic flag; the can is never spent. The gentlest world of the three.
   ─────────────────────────────────────────────────────────────────────────── */

const WORLD = {
  meta: {
    id:     'the-night-shift',
    title:  'The Night Shift',
    byline: 'a Lantern tale · found below',
    accent: '#a9b8d8',            // moon-silver
    intro:
      'The last visitor has gone and you have turned the sign, and now the workshop is ' +
      'yours alone — nine dark doors off the long hall, and the smell of dust and solder ' +
      'and growing things. You are the keeper here. Before you can go down and sit the ' +
      'night watch, the place must be put to bed — and something, somewhere, is still awake. ' +
      'You can hear it if you stand quite still: a hum, a click, a small green sigh.',
  },

  start: 'hall',
  win: {
    flag:  'watch-kept',
    title: 'The Night Watch',
    text:
      'You go down the worn steps into the dark below the workshop, where the secret things ' +
      'are kept — the marbled inks, the cipher wheels, the long quiet. Nothing stirs. Above ' +
      'you the nine rooms sleep on, every screen dark, every wick cold, every bell at rest. ' +
      'You sit down in the old chair at the bottom of the stair, and you keep the watch, the ' +
      'way a keeper does — glad of every soul who came in today, and glad too, now, of the ' +
      'dark and the quiet and the company of made things, sleeping.',
  },

  rooms: {

    hall: {
      name: 'The Long Hall',
      art:  'hall',
      desc: [
        'The workshop’s long hall by night — nine doors standing dark, the floor still ' +
        'holding the day’s footprints in dust. By the coat-pegs hangs the keeper’s ring of ' +
        'keys, and beneath it sits a battered tin watering-can. At the hall’s far end, the ' +
        'broken stair goes down — but a chain hangs across it while the workshop wakes. ' +
        'Three doors stand ajar: the arcade, the garden, the sound garden.',
        'The long hall, the nine doors dark. The arcade, the garden and the sound garden ' +
        'stand ajar; the broken stair waits at the far end.',
      ],
      exits: {
        arcade:  { to:'arcade' },
        garden:  { to:'garden' },
        sound:   { to:'soundgarden' },
        down:    { to:'undercroft',
                   if:{ flag:['arcade-rested','garden-rested','bell-rested'] },
                   blocked:'The chain is across the broken stair, and you would not go down anyway — ' +
                           'not while something in the workshop is still awake. Listen: a hum, a click, ' +
                           'a small green sigh. Put the place to bed first.' },
      },
    },

    arcade: {
      name: 'The Arcade, After Hours',
      art:  'arcade-night',
      desc: [
        'The cabinets stand in their dark rows like sleeping animals — all but one. Down at ' +
        'the end, one screen still burns: a little neon ship, holding station against the ' +
        'last wave of the night, waiting for a hand on the stick. The coin slot glows. On top ' +
        'of the warm cabinet, the workshop cat has folded itself into a loaf, one ear turned ' +
        'to the game.',
        'The dark rows of cabinets. One screen still burns at the end — or, if you have ' +
        'played it home, burns no longer. The cat holds its station either way.',
      ],
      exits: {
        back: { to:'hall' },
      },
    },

    garden: {
      name: 'The Strange Garden, Sleeping',
      art:  'garden-night',
      desc: [
        'Glass domes in the dark, each with its small slow life inside — drifting flocks, ' +
        'creeping tilings, a coastline drawing itself over and over. They need nothing from ' +
        'you; they dream their own arithmetic. All but one: in the nearest dome a fernlike ' +
        'specimen has drooped right over, its fronds gone grey at the tips. Its earth is dry ' +
        'as paper.',
        'The domes dreaming their arithmetic. The fern in the nearest dome — drooping still, ' +
        'or drinking, if you have seen to it.',
      ],
      exits: {
        back: { to:'hall' },
      },
    },

    soundgarden: {
      name: 'The Sound Garden, Late',
      art:  'sound-night',
      desc: [
        'The instruments hang silent in the dark — the music box stilled, the rain stopped, ' +
        'the looms of chord and rhythm wound down for the night. All silent but one: the ' +
        'great bronze bell at the back is humming, very low, the last note of the day still ' +
        'circling inside it like a moth that cannot find the window.',
        'The silent instruments. The great bell at the back — humming still, or at rest, ' +
        'if you have stayed to hear it out.',
      ],
      exits: {
        back: { to:'hall' },
      },
    },

    undercroft: {
      name: 'Below',
      art:  'below',
      desc: 'The worn steps go down into the kind dark where the secret things are kept.',
      onEnter: { do:[{ flag:'watch-kept' }, { win:true }] },
      exits: {},
    },
  },

  things: {

    keys: {
      name: 'the keeper’s keys',
      at: 'hall',
      verbs: {
        look: 'The keeper’s ring of keys on its peg — one for each door, and one old black key ' +
              'that fits nothing you have ever found. You leave them where they hang; tonight ' +
              'nothing needs locking so much as it needs lulling.',
      },
    },

    can: {
      name: 'the watering-can',
      at: 'hall',
      portable: true,
      verbs: {
        look: 'A battered tin watering-can, dented to the shape of long service, half-full of ' +
              'yesterday’s rainwater.',
        take: { do:[{ take:'can' }], say:'You take the watering-can. The water shifts inside it with a small tin sigh.' },
      },
      useOn: {
        fern: { if:{ noflag:'garden-rested' },
                do:[{ flag:'garden-rested' }],
                say:'You lift the dome and pour, slow, the way the garden likes it — and you can all ' +
                    'but hear the dry earth drink. The fern does not rise tonight; it will rise by ' +
                    'morning. But its grey tips take the water’s shine, and the small green sigh you ' +
                    'heard in the hall goes quiet, content.',
                else:'The fern’s earth is dark and drinking. It has all it needs till morning.' },
      },
    },

    cabinet: {
      name: 'the burning cabinet',
      at: 'arcade',
      verbs: {
        look: { if:{ flag:'arcade-rested' },
                say:'The cabinet stands dark now with the rest of its row, just one warm patch on ' +
                    'top where the cat is, and the ghost of the little ship fading from the glass.',
                else:'The last cabinet awake: the little neon ship holds station on the screen, the ' +
                     'final wave of the night hanging above it, the whole game waiting — it will not ' +
                     'end itself. Someone has to bring the ship home.' },
        play: { if:{ noflag:'arcade-rested' },
                do:[{ flag:'arcade-rested' }],
                say:'You take the stick, and the workshop holds its breath. You fly the little ship ' +
                    'the way the day’s visitors flew it — badly at first, then better — and you bring ' +
                    'it home through the last wave, and the screen writes its small farewell of light ' +
                    'and goes down to a warm dark. GAME OVER, it says, meaning: goodnight.',
                else:'The screen is dark, the game is home. The cabinet ticks as it cools.' },
      },
    },

    cat: {
      name: 'the workshop cat',
      at: 'arcade',
      verbs: {
        look: 'The workshop cat, loafed on the warm cabinet, eyes shut to seams. No one recalls ' +
              'hiring it. It keeps its own watch and its own counsel, and it has never once ' +
              'been wrong about the weather.',
        talk: { say:'"Prrp," says the cat, without opening its eyes. It is the whole of its report, ' +
                    'and the report is: all well.' },
      },
    },

    fern: {
      name: 'the drooping fern',
      at: 'garden',
      verbs: {
        look: { if:{ flag:'garden-rested' },
                say:'The fern stands in its dome over dark, drinking earth — still bowed, but with ' +
                    'the look now of a thing resting rather than a thing failing.',
                else:'The fern has drooped right over in its dome, fronds grey at the tips, its earth ' +
                     'dry as paper. It wants water — there used to be a can about, by the coat-pegs ' +
                     'in the hall.' },
      },
    },

    bell: {
      name: 'the great bell',
      at: 'soundgarden',
      verbs: {
        look: { if:{ flag:'bell-rested' },
                say:'The great bronze bell hangs at rest now, holding its silence the way it held ' +
                    'its note — completely.',
                else:'The great bronze bell, humming its low leftover note round and round. You could ' +
                     'damp it with a hand — but a bell put out like a lamp sulks for a week. A bell ' +
                     'should be heard to the end of what it is saying.' },
        listen:{ if:{ noflag:'bell-rested' },
                 do:[{ flag:'bell-rested' }],
                 say:'You stand in the dark with the bell and you listen. The note circles lower, and ' +
                     'lower, and you stay with it all the way down — past hearing, into the place ' +
                     'where it is only a pressure on the skin, and then not even that. The bell hangs ' +
                     'silent. It said what it had to say, and was heard, and that is a finished thing.',
                 else:'Silence, of the full kind. The bell has said its piece.' },
      },
    },
  },
};

if (typeof module !== 'undefined' && module.exports) { module.exports = { WORLD }; }
