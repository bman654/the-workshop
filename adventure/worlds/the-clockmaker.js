/* ───────────────────────────────────────────────────────────────────────────
   THE CLOCKMAKER — a Lantern tale.
   A world-file: pure declarative data (see ../ADVENTURE.SPEC.md §2). No engine
   code. The engine interprets this; the solver proves it winnable & softlock-free.

   The third public tale, written to its own shape — a vertical puzzle, not a
   journey. Where the Lamplighter walks a round of lamps and the Ferryman pays a
   toll, this is a clockmaker's shop at the dead midnight: the great regulator —
   the master clock the whole town keeps time by — has stopped, and you must
   gather its three scattered parts and set it beating again. It leans on the
   things neither earlier tale did all at once: a LIGHT-AND-DARK gate (the
   mechanism pit is pitch black; you must relight the dead workbench lantern from
   the stove before you can work down there), a LOCK-AND-KEY drawer (the
   winding-key sleeps behind a locked drawer whose own key hangs on a hook), and
   a three-part assembly that all converges on one final winding.

   Intended path (the solver re-derives it — it doesn't trust this):
     workshop: read the regulator's note (the order of the work) → take the matches
       from the bench → take the lantern → light the lantern at the stove
       → take the brass hook-key from the nail → use the hook-key on the drawer
       → take the winding-key from the drawer → take the oil-can
       → down into the pit (now the lantern lights the way) → take the fallen
       pendulum-bob → use the oil-can on the escapement → up
       → hang the pendulum-bob on the regulator → use the winding-key on the
       regulator → the clock takes its first breath, and the hour comes back.

   Provably winnable AND softlock-free: the only consumable is the oil (spent
   once into the escapement, never needed again); the matches are not consumed
   (a box of them — lighting the lantern just sets a monotonic flag); every other
   change is a monotonic flag or a one-time move/reveal; nothing can be put
   anywhere it cannot be retrieved from; the lantern, once lit, stays lit. The
   solver confirms the win is reachable from every reachable state.
   ─────────────────────────────────────────────────────────────────────────── */

const WORLD = {
  meta: {
    id:     'the-clockmaker',
    title:  'The Clockmaker',
    byline: 'a Lantern tale',
    accent: '#c9a24b',            // old brass and lamplit oak
    intro:
      'It is midnight, or it should be — but the town has gone quiet in the wrong way, ' +
      'the way a room goes quiet when a clock that has always ticked stops ticking. You ' +
      'come down into the shop in your nightshirt and you know it before you see it: the ' +
      'great regulator, the master clock the whole town sets its hours by, has stopped. Its ' +
      'pendulum hangs dead. Until it beats again the morning bells will not ring, the ' +
      'markets will not open, the hours will not turn. Your father kept this clock, and his ' +
      'father. Tonight it is yours to start.',
  },

  start: 'workshop',
  win: {
    flag:  'started',
    title: 'The Hour Returns',
    text:
      'You fit the winding-key and turn, and turn, and the spring takes the strain with a ' +
      'long iron sigh. Then you reach up and start the pendulum with one finger — a small ' +
      'push, the push your father showed you — and let it go. For one breath nothing. Then ' +
      'the escapement catches: tick. And, after a heartbeat that lasts a year — tock. The ' +
      'great clock has taken its first breath in the dark. Somewhere above the rooftops the ' +
      'midnight bell, late but unhurried, begins to count. The hours have come back to the ' +
      'town, and you sit down on the workbench stool to listen to time start again.',
  },

  rooms: {

    workshop: {
      name: 'The Clockmaker’s Shop',
      art:  'workshop',
      desc: [
        'The shop floor by the one low light of the stove. Workbenches run along the walls ' +
        'under a hundred stilled clocks, and at the far end stands the great regulator in its ' +
        'tall oak case, the master of them all — and dead, its long pendulum hanging without a ' +
        'swing. On the nearest bench: a box of matches, the workbench lantern (cold), and an ' +
        'oil-can. A small drawer in the bench is shut, and a brass hook-key hangs on a nail ' +
        'beside it. A note in your father’s hand is pinned above the bench. A hatch in the ' +
        'floor goes down to the mechanism pit beneath the regulator.',
        'The shop, lit by the stove. The great regulator stilled at the far end; the bench with ' +
        'its matches, lantern, oil-can, locked drawer and hook-key; the note above it; the hatch down to the pit.',
      ],
      exits: {
        down: { to:'pit', if:{ flag:'lantern-lit', has:'lantern' },
                blocked:'The hatch is open, but the pit below is pitch black — the regulator’s case ' +
                        'shuts out the stove’s light entirely. You would only break your hands down there blind. You need a light in your hand first.' },
      },
    },

    pit: {
      name: 'The Mechanism Pit',
      art:  'pit',
      desc: [
        'You climb down the short ladder into the pit beneath the regulator, the lantern ' +
        'throwing your shadow huge on the brick. Here is the underside of the great clock — a ' +
        'forest of brass wheels and the long dead escapement, the part that should be ticking ' +
        'and is not. On the floor, where it has rolled into a corner, lies the heavy pendulum-' +
        'bob, fallen clean off its rod. The escapement’s pivots are dry as chalk and want oil.',
        'The pit, lit by your lantern. The dry escapement overhead; the fallen pendulum-bob in the corner; the ladder back up to the shop.',
      ],
      exits: {
        up: { to:'workshop' },
      },
    },
  },

  things: {

    note: {
      name: 'the clockmaker’s note',
      at: 'workshop',
      verbs: {
        look: 'A note pinned above the bench, in your father’s small upright hand, left for the ' +
              'night this would come.',
        read: 'You read it by the stove-light, in your father’s hand:\n' +
              '  “If she stops, do it in order, boy, or you’ll do it twice:\n' +
              '   First a light — the lantern, off the stove — for the pit is black as pitch.\n' +
              '   Then the winding-key from the drawer (the hook-key’s on its nail).\n' +
              '   Below: oil the escapement, and fetch back the fallen bob.\n' +
              '   Then hang the bob, wind her full, and start the pendulum with your finger.\n' +
              '   She only ever wanted tending. So tend her.”',
      },
    },

    matches: {
      name: 'the box of matches',
      at: 'workshop',
      portable: true,
      verbs: {
        look: 'A fat box of strike-anywhere matches, the kind that never quite runs out. More than enough to wake a lantern.',
        take: { do:[{ take:'matches' }], say:'You pocket the box of matches. They rattle, reassuring.' },
      },
    },

    lantern: {
      name: 'the workbench lantern',
      at: 'workshop',
      portable: true,
      verbs: {
        look: { if:{ flag:'lantern-lit' },
                say:'The workbench lantern, lit and steady, a clean gold flame behind its sooted glass.',
                else:'The old workbench lantern, cold and dark, its wick trimmed and ready. It only wants a flame — there is the stove, and a box of matches on the bench.' },
        take: { do:[{ take:'lantern' }], say:'You take up the workbench lantern by its wire handle.' },
        light:{ if:{ has:['lantern','matches'], at:'workshop' },
                do:[{ flag:'lantern-lit' }],
                say:'You strike a match against the box, lift the lantern’s glass, and touch the flame ' +
                    'to the wick at the stove’s open door. It catches and steadies into a clean gold ' +
                    'light. The dark of the shop draws back. Now you could go down into the pit.',
                else:'Nothing to light it with — you’d want the lantern in your hand and the matches too, here by the stove.' },
      },
    },

    stove: {
      name: 'the stove',
      at: 'workshop',
      verbs: {
        look: 'A small iron stove banked low for the night, one red eye of fire showing through its grate. ' +
              'Enough flame in it to wake a lantern, if you had the lantern and a match.',
      },
    },

    'hook-key': {
      name: 'the brass hook-key',
      at: 'workshop',
      portable: true,
      verbs: {
        look: 'A little brass key shaped like a hook, hanging on a nail by the bench drawer. It plainly ' +
              'fits the drawer’s small lock.',
        take: { do:[{ take:'hook-key' }], say:'You lift the brass hook-key off its nail.' },
      },
      useOn: {
        drawer: { if:{ noflag:'drawer-open' },
                  do:[{ flag:'drawer-open' }, { move:['winding-key','workshop'] }],
                  say:'The hook-key turns easily in the drawer’s small lock, and the drawer slides open. ' +
                      'Inside, on a square of green baize, lies the regulator’s winding-key.',
                  else:'The drawer is already open.' },
      },
    },

    drawer: {
      name: 'the bench drawer',
      at: 'workshop',
      verbs: {
        look: { if:{ flag:'drawer-open' },
                say:'The bench drawer stands open, its green baize bare now where the winding-key lay.',
                else:'A small locked drawer set into the workbench. It does not give to a pull. Its key — the ' +
                     'little brass hook — hangs on the nail right beside it.' },
        open: { if:{ flag:'drawer-open' }, say:'The drawer is already open.',
                else:'Locked. A small neat lock. The brass hook-key on the nail beside it would fit.' },
        pull: { if:{ flag:'drawer-open' }, say:'It is already open.',
                else:'It will not pull. The little lock holds it fast. There is a hook-key on the nail beside it.' },
      },
    },

    'winding-key': {
      name: 'the winding-key',
      at: '_gone',                 // revealed inside the drawer (moved into `workshop`)
      portable: true,
      verbs: {
        look: 'The regulator’s winding-key — a heavy cranked key of blued steel, worn bright on its ' +
              'haft by two generations of winding. This is the one that fits the great clock.',
        take: { do:[{ take:'winding-key' }], say:'You take the heavy winding-key. It sits in the hand like a tool that knows its work.' },
      },
      useOn: {
        regulator: { if:{ flag:['bob-hung','escapement-oiled'], noflag:'started' },
                     do:[{ flag:'started' }, { win:true }],
                     say:'With the bob hung and the escapement oiled, you fit the winding-key to the ' +
                         'great clock at last.',
                     else:'Not yet. A dry escapement will only seize, and a bare rod keeps no time — oil ' +
                          'the escapement down in the pit and hang the bob on its rod before you wind her.' },
      },
    },

    'oil-can': {
      name: 'the oil-can',
      at: 'workshop',
      portable: true,
      verbs: {
        look: 'A long-spouted oil-can of fine clock-oil, near full. Made for getting one bright drop ' +
              'exactly where a dry pivot wants it.',
        take: { do:[{ take:'oil-can' }], say:'You take up the long-spouted oil-can.' },
      },
      useOn: {
        escapement: { if:{ at:'pit', noflag:'escapement-oiled' },
                      do:[{ flag:'escapement-oiled' }, { gone:'oil-can' }],
                      say:'You set a single bright bead of oil to each dry pivot of the escapement, the ' +
                          'way you were taught — no more, no less. The brass drinks it in. The pawls move ' +
                          'free again under your finger. It will tick now, when there is something to tick for.',
                      else:'The escapement is only down in the pit — and it wants oiling but once.' },
      },
    },

    escapement: {
      name: 'the escapement',
      at: 'pit',
      verbs: {
        look: { if:{ flag:'escapement-oiled' },
                say:'The escapement’s pivots gleam now with fresh oil, the pawls swinging free. It is ready to keep time.',
                else:'The heart of the going-train — the escapement, the part that parcels out each second. ' +
                     'Its pivots are dry as chalk; it will never tick like this. It wants oil, and you have an oil-can.' },
      },
    },

    bob: {
      name: 'the pendulum-bob',
      at: 'pit',
      portable: true,
      verbs: {
        look: 'A heavy brass lens — the pendulum-bob — fallen clean off its rod and rolled into the ' +
              'corner of the pit. Without it the regulator’s pendulum is only a bare rod, and a bare ' +
              'rod keeps no time. It belongs up on the great clock.',
        take: { do:[{ take:'bob' }], say:'You gather up the heavy pendulum-bob. It is dense and cold and full of purpose.' },
      },
      useOn: {
        regulator: { if:{ noflag:'bob-hung' },
                     do:[{ flag:'bob-hung' }, { gone:'bob' }],
                     say:'You carry the bob up to the great clock and thread it back onto the foot of the ' +
                         'pendulum-rod, where it settles with a small sure weight. The pendulum hangs true ' +
                         'again now — only stopped, no longer broken.',
                     else:'The bob is already hung back on the regulator.' },
      },
    },

    regulator: {
      name: 'the great regulator',
      at: 'workshop',
      verbs: {
        look: { if:{ flag:'started' },
                say:'The great regulator, ticking again, its pendulum swinging its slow gold arc, the ' +
                    'master of every clock in the room and the town beyond.',
                else:'The great regulator in its tall oak case — the master clock. Its pendulum hangs ' +
                     'dead: the heavy bob has fallen clean off the rod, down into the pit below. It will ' +
                     'keep no time until the bob is hung again and the spring is wound with its own key.' },
        wind: { if:{ has:'winding-key', flag:['bob-hung','escapement-oiled'], noflag:'started' },
                do:[{ flag:'started' }, { win:true }],
                say:'With the bob hung and the escapement oiled, you fit the winding-key to the great clock at last.',
                else:'You cannot wind it like this. It wants its own winding-key in hand, the escapement ' +
                     'oiled below, and the pendulum-bob hung back on the rod — or you wind it slack and wind it twice.' },
        // the canonical win route is winding-key.useOn.regulator; `wind` is the same act, offered on the clock itself.
      },
    },
  },
};

/* Dual-use: a global for inline <script> in a shipped tale; a module export for Node solving. */
if (typeof module !== 'undefined' && module.exports) { module.exports = { WORLD }; }
