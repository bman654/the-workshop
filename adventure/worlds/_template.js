/* ───────────────────────────────────────────────────────────────────────────
   _TEMPLATE — a minimal Lantern tale. Copy this to worlds/<your-id>.js and grow it.
   The smallest thing that passes the solver: winnable AND softlock-free.
   Two rooms, one key, one door, one win. See ../ADVENTURE.SPEC.md §2 for the full DSL.

   The shape: take the key → use the key on the door → go through → win.
   ─────────────────────────────────────────────────────────────────────────── */

const WORLD = {
  meta: {
    id:     'template',                  // lower-kebab; the ws: breadcrumb id + the <title>
    title:  'Untitled Tale',
    byline: 'a Lantern tale',
    accent: '#8fb3ff',                   // your tale's signature colour
    intro:  'You wake in a small locked room. There is a door, and somewhere, a key.',
  },

  start: 'cell',
  win: {
    flag:  'free',
    title: 'Out',
    text:  'The door swings wide and the cool air of outside meets you. You are free. (Now go write a real tale.)',
  },

  rooms: {
    cell: {
      name: 'The Locked Room',
      art:  '_neutral',                  // unknown art keys fall back to a calm neutral panel — fine to ship
      desc: [
        'A small bare room. A heavy door fills one wall. A brass key lies on the floor by your foot.',
        'The bare room. The door; the key (if you’ve not taken it).',
      ],
      exits: {
        out: { to:'outside', if:{ flag:'door-open' }, blocked:'The door is locked.' },
      },
    },
    outside: {
      name: 'Outside',
      art:  '_neutral',
      desc: 'Open air, and the road going on. (A real tale would put something here.)',
      exits: {},
    },
  },

  things: {
    key: {
      name: 'the brass key',
      at: 'cell',
      portable: true,
      verbs: {
        look: 'A small brass key, plainly cut. It will fit something.',
        take: { do:[{ take:'key' }], say:'You pick up the key.' },
      },
      useOn: {
        door: { if:{ noflag:'door-open' },
                do:[{ flag:'door-open' }],
                say:'The key turns. The lock gives with a heavy clunk.',
                else:'The door is already unlocked.' },
      },
    },
    door: {
      name: 'the heavy door',
      at: 'cell',
      verbs: {
        look: { if:{ flag:'door-open' }, say:'The door stands unlocked. Step out.',
                else:'A heavy locked door. It needs a key.' },
        open: { if:{ flag:'door-open' }, say:'It’s unlocked — go on, step out.',
                else:'Locked. You’ll need to find the key and use it on the door.' },
      },
    },
  },
};

if (typeof module !== 'undefined' && module.exports) { module.exports = { WORLD }; }
