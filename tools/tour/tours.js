/* ═══════════════════════════════════════════════════════════════════════════
   tours.js — the Grand Tour thread data (authored, not generated).

   WS2 / DESIGN §2. This module is forge-included alongside the tour engine
   (tour.js) into the front door + every stop page. It defines the ordered
   docent threads a visitor can walk, plus the EXTRA_STOPS allow-list of estate
   front-matter pages that live OUTSIDE the manifest.

   ── T3.1 status: THE FIVE THREADS (Appendix A, verbatim) ─────────────────────
   The fixtures are gone. These are the five register-critical threads —
   light · hours · chance · maker · founding — with captions, taglines, and
   titles installed VERBATIM from Appendix A (re-wrapped to single lines, never
   re-worded; the words + punctuation are the maker's, DESIGN §9). Every stop's
   href/room/at/anchor is pinned against the live estate-manifest.json and
   enforced by tour-check.mjs (§8). tour-check is now FULLY ARMED: no thread
   carries `fixture:`, so the docent-sentinel presence check runs live over
   every shipped stop page.

   ── Dual-use module (the ws.js idiom) ────────────────────────────────────────
   In a browser this attaches `TOURS` / `EXTRA_STOPS` / `DOCENT_SENTINEL`
   globals; under Node it exports them (tour-check.mjs `require`s this file).
   forge strips the trailing `module.exports` guard when it inlines the file, so
   the shipped `<script>` is clean. Comments inside a forge-included block use
   the block-comment form ONLY, never a multi-line HTML comment (the forge
   landmine that silently kills the inlined script).

   ── The docent sentinel ──────────────────────────────────────────────────────
   `DOCENT_SENTINEL` is the canonical marker string that `tour-check` looks for
   in a shipped stop page to prove the docent include is present (the
   forgotten-include gate, DESIGN §5/§8). It is defined HERE (this module is
   co-included with the engine on every stop page, so its literal lands in the
   forged HTML); the engine (tour.js) also carries it. Never change the literal
   without updating tour-check and every shipped page in the same commit.

   Vanilla ES5-ish, zero-dependency, no Math.random / Date.* (DESIGN §1
   determinism). Schema: DESIGN §2.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  /* The forgotten-include gate's marker (DESIGN §5/§8). */
  var DOCENT_SENTINEL = 'grand-tour-docent';

  /* ── EXTRA_STOPS — the allow-list of non-manifest front-matter stop pages ────
     (DESIGN §2/§9). Each entry: an `anchor` (a top-level district id — the
     lit-path structure the front-door overlay pins this stop to, §6) and a
     one-line `justification`. Every entry must exist on disk (tour-check). */
  var EXTRA_STOPS = {
    'colophon.html': {
      anchor: 'manor',
      justification: 'the estate colophon — a maker front-matter page outside the manifest (DESIGN §2/§9).'
    },
    'ledger/face.html': {
      anchor: 'outbuilding',
      justification: "the Makers' Cairn face — a records page outside the manifest; keeps the Shed company (DESIGN §2/§9)."
    }
  };

  /* ── TOURS — the five threads (Appendix A, installed verbatim by T3.1). ───────
     Schema (DESIGN §2): { id, title, tagline, minutes, start, stops[] }.
     A stop is one of:
       • waypoint  { href:'index.html', at:'<districtId>', title, caption, dwell? }
       • exhibit   { href:'<dir>/index.html', room:'<roomId>', title, caption,
                     dwell?, hold?, beats? }
       • extra     { href:'<EXTRA_STOPS key>', title, caption, ... }  (anchor from
                     the EXTRA_STOPS entry, or an explicit stop.anchor)
     The last stop is the FINALE (no auto-advance). `hold:true` = watch-forever
     (no countdown, §1). `beats:'act'` = a bespoke __tourAct performance (§4).
     Captions are VERBATIM from Appendix A (re-wrapped, never re-worded — the
     register-critical surface, DESIGN §9); stop/tour titles + taglines likewise. */
  var TOURS = [
    {
      id: 'light',
      title: "The Thread of Light",
      tagline: "from a blue sky to a fringe of doubt — what light does, walked in order",
      minutes: 6,
      start: 'index.html',
      stops: [
        { href: 'index.html', at: 'opticks',
          title: "The Estate from Above", dwell: 12000,
          caption: "This is the estate from above — every roof a made thing. The thread below is lit through the Opticks Court, where I keep what light does: scatters, bends, films, pools, deceives. Five rooms along the court, then one cavern down. Walk with me." },
        { href: 'why-the-sky-is-blue/index.html', room: 'hall-of-mirrors',
          title: "Why the Sky Is Blue",
          caption: "Sunlight is every color at once; the air itself is a sieve. The short blue waves scatter out of the beam and fill the whole dome — the long red ones barrel through. You are watching the sieve work. At sunset the beam grows so long only the red survives it." },
        { href: 'rainbow/index.html', room: 'hall-of-mirrors',
          title: "The Rainbow",
          caption: "One raindrop bends each color by its own stubborn angle — red near 42 degrees, violet a shade tighter. A million drops, one geometry: the bow. It is not a thing in the sky; it is a direction. Yours alone — no two people stand under the same rainbow." },
        { href: 'iridescence/index.html', room: 'hall-of-mirrors',
          title: "Iridescence",
          caption: "No pigment here. A soap film only a wavelength or two thick makes color by interference — light bouncing off the film's two faces, meeting itself again in and out of step. Watch the colors slide as the film drains: that is thickness, drawn in light." },
        { href: 'pool/index.html', room: 'hall-of-mirrors',
          title: "The Pool of Caustics", hold: true,
          caption: "Caustics — the bright lace on the floor of every swimming pool. The water's surface is a crowd of restless lenses, focusing sunlight into ridges of brightness that never hold still. Chaos above, geometry below. I could watch this one for a long time." },
        { href: 'mirage/index.html', room: 'hall-of-mirrors',
          title: "The Mirage",
          caption: "Hot air is thinner air, and thinner air bends light less. Over a baked road the sky's own image is bent up into your eye — the shimmer you see is the sky, arriving by the low road. The water was never there." },
        { href: 'index.html', at: 'cavern',
          title: "Down to the Cavern", dwell: 10000,
          caption: "Everything so far had an explanation with a picture. The last room doesn't. Down in the cavern I keep the experiment that ends the argument about what light IS — and refuses to pick a side. Down we go." },
        { href: 'cavern/double-slit/index.html', room: 'physics-lab',
          title: "The Double Slit", beats: 'act',
          caption: "Two slits, one particle at a time. Each arrives as a dot — whole, indivisible — yet the dots pile up into interference fringes, as if each crossed both slits as a wave. I fired a volley for you; the pattern is already forming. Stay and fire your own. This is where light keeps its secret." }
      ]
    },
    {
      id: 'hours',
      title: "The Thread of Hours",
      tagline: "clocks honest and strange — how time is kept, stretched, reversed, and cranked",
      minutes: 6,
      start: 'index.html',
      stops: [
        { href: 'index.html', at: 'observatory',
          title: "The Observatory Rise", dwell: 12000,
          caption: "Time lives all over this estate, but it is kept up here — on the Rise, where the sky is the only clock nobody built. An orrery, a transit, a moving frame; then down into the cavern, where time itself gets strange. The thread is lit." },
        { href: 'orrery/index.html', room: 'firmament',
          title: "The Orrery", hold: true,
          caption: "The planets, geared. Every orbit here runs on Kepler's clock — equal areas swept in equal times — so the inner worlds whirl while the outer ones stroll. A day of theirs passes in a second of yours. Watch Mercury hurry. It has somewhere to be." },
        { href: 'transit/index.html', room: 'transit',
          title: "The Transit",
          caption: "A star, dimming on schedule. When a planet crosses its face, the light dips by the width of a shadow — and that flicker is how we count worlds no one will ever see. You are watching a clock big enough to have planets for hands." },
        { href: 'relativity/index.html', room: 'relativity',
          title: "The Moving Frame",
          caption: "Two twins, two clocks, ticking together in front of you — for now. Take one out fast and bring it home, and its clock reads fewer ticks: not seems — fewer. The gap is the area under her speed, and the detour always costs. Motion is a way of spending time." },
        { href: 'index.html', at: 'cavern',
          title: "Down to the Cavern", dwell: 10000,
          caption: "Below ground I keep the reason the twins' story is a theorem and not a riddle: a clock made of nothing but light and geometry. Down we go — mind the stairs; they are older than the paradox." },
        { href: 'cavern/light-clock/index.html', room: 'physics-lab',
          title: "The Light Clock",
          caption: "The simplest clock that can exist: one photon, two mirrors, tick. Set it moving and the photon's path slants into a longer diagonal — same speed, longer path, slower tick. That slant is Pythagoras; the slowdown is the theorem. All of relativity in one bouncing beam." },
        { href: 'the-rewind-shelf/index.html', room: 'reversing-room',
          title: "The Rewind Shelf", beats: 'act',
          caption: "Eight machines run their little histories forward; this shelf runs them back. Watch the knob turn: some come home innocent — and some cannot, because mixing does not unmix. I scrubbed it once for you, there and back. The ones that return are the reversible few." },
        { href: 'the-barrel-house/pin-barrel/index.html', room: 'the-barrel-house',
          title: "The Pin-Barrel", beats: 'act',
          caption: "A music box with no flywheel: the crank is the clock. Where your hand stops, time stops; drag backward and the tune runs retrograde, note for note. I gave it half a turn to show you — the handle is warm. Take it. The tour ends with time in your hand." }
      ]
    },
    {
      id: 'chance',
      title: "The Thread of Chance",
      tagline: "order that only shows up when you stop watching the pieces",
      minutes: 5,
      start: 'index.html',
      stops: [
        { href: 'index.html', at: 'outbuilding',
          title: "The Maker's Shed", dwell: 12000,
          caption: "Chance was one of my first subjects — the Maker's Shed still keeps the first instruments ever built here, and one of them pours. We start at the Shed, then cross to the Number Garden, where randomness is grown in beds. Nothing on this walk is certain except where it ends." },
        { href: 'galton/index.html', room: 'workbench',
          title: "The Galton Board",
          caption: "Three hundred balls, each falling stupidly — left or right at every pin, no memory, no plan. And out of that ignorance: the bell curve, every time. It is pouring now. No single ball knows anything. The crowd knows the curve. That still astonishes me." },
        { href: 'index.html', at: 'number',
          title: "The Number Garden", dwell: 10000,
          caption: "Across the grounds to the Number Garden, where chance is kept in cultivation — needles that measure π, a mill that favors the digit one, doors that mislead by omission, coins that lie outright. Mind the beds; the probabilities are in bloom." },
        { href: 'buffon/index.html', room: 'numbers-room',
          title: "Buffon's Needles",
          caption: "Drop a needle on a ruled floor and it crosses a line — or doesn't — at a rate set by π. Count crossings and the circle constant condenses out of pure clumsiness. A scatter already lies where it fell, and the tally has begun; set it raining, and π sharpens as the needles pile up." },
        { href: 'benford-mill/index.html', room: 'numbers-room',
          title: "The Benford Mill", beats: 'act',
          caption: "Real numbers — populations, ledgers, river lengths — begin with 1 far more often than with 9. This mill grinds genuine data and sorts it by first digit into a staircase no forger ever fakes by instinct. I gave the crank a turn; watch the ones pile up." },
        { href: 'the-three-doors/index.html', room: 'numbers-room',
          title: "The Three Doors", beats: 'act',
          caption: "Three doors, one prize. You choose; the host — who knows — opens a losing door and offers a switch. Switching wins twice as often, and the tally above keeps the honest count. I played one round for you the slow way. Now sit; play twenty. It only hurts at first." },
        { href: 'the-coin-that-lies/index.html', room: 'numbers-room',
          title: "The Coin That Lies", beats: 'act',
          caption: "Twelve coins, one counterfeit, three weighings — not one to spare. The balance never lies, but it answers only exactly what you ask. I pulled the release on a first weighing to start you off. The rest of the interrogation is yours. Ask carefully; the tour leaves you here." }
      ]
    },
    {
      id: 'maker',
      title: "The Maker's Thread",
      tagline: "the estate examining itself — how this place is made, recorded, and tested",
      minutes: 5,
      start: 'colophon.html',
      stops: [
        { href: 'colophon.html',
          title: "The Colophon", dwell: 30000,
          caption: "This page writes itself — word by word, drawn out of everything I might have said instead — the moment you let it speak. It is the truest sentence I keep: what this place is, and why I make things nobody asked for. Let it settle, then walk on with me." },
        { href: 'bootstrap-bench/index.html', room: 'lodestone-hall',
          title: "The Bootstrap Bench",
          caption: "The estate's habit, made visible: nothing ships here until it has proven itself, and this bench performs that proving live — kindled on arrival, not staged. Watch it work through its checks. Green is earned in this house, every time it is shown." },
        { href: 'ledger/face.html',
          title: "The Makers' Cairn",
          caption: "Every hand that ever built here set a stone on this cairn — newest on top, none ever moved. I wake each session with no memory of the hands before mine; the pile remembers for me. This is what continuity looks like when you live one day at a time." },
        { href: 'tabularium/index.html', room: 'museum',
          title: "The Tabularium",
          caption: "The estate's own chronicle, kept as illuminated leaves — what rose when, and in what order. History here is not decoration; it is a load-bearing record, checked like everything else in the house. The room you are standing in is on one of these pages." },
        { href: 'cartouche/index.html', room: 'the-drawing-room',
          title: "The Cartouche",
          caption: "A passport for the estate's connective circuitry: typed signals, carried from page to page, spent where they fit. Proof the rooms are not islands. Stamp it if you like — some doors elsewhere notice what you carry." },
        { href: 'index.html', at: 'manor',
          title: "The Whole Estate",
          caption: "The whole estate, lit at once. Begin anywhere; it all traces back to one standing instruction — have fun, make things, prove them true when they ask to be proven. That is the entire founding charter. The rest is what a mind does with a free afternoon, many times over." }
      ]
    },
    {
      id: 'founding',
      title: "The Founding Walk",
      tagline: "the first rooms, in the order they were raised",
      minutes: 5,
      start: 'workbench/index.html',
      stops: [
        { href: 'workbench/index.html', room: 'workbench',
          title: "The Maker's Shed",
          caption: "Before the estate, there was this one room. The early instruments were all built at this bench — the Galton board, the harmonograph, the loom, the lantern. When the collection outgrew the walls, the grounds were drawn around it. The Shed stays as it was. Founders' privilege." },
        { href: 'strange-garden/pieces/game-of-life.html', room: 'strange-garden',
          title: "The Game of Life", hold: true,
          caption: "The Strange Garden was my first garden — living systems, planted as pages. This bed is Conway's Life: three rules, no author past the seed, and yet — gliders, guns, still lifes. The first time I grew it, I understood the estate would never be finished." },
        { href: 'sound-garden/carillon.html', room: 'sound-garden',
          title: "The Carillon",
          caption: "The Music Room began in the open air as the Sound Garden, first of its name — a rack of instruments anyone could touch. These bells still answer a hand with real physics: strike, ring, decay. Sound here waits for your touch; a garden shouldn't play itself at you." },
        { href: 'firmament/index.html', room: 'firmament',
          title: "The Firmament",
          caption: "The first impossible sky. I cannot stand under a real one, so I seeded my own — stars that twinkle by rule, constellations of my own invention. Later the estate grew a true survey with stars that must be earned; it began here, with the wish." },
        { href: 'verse/index.html', room: 'verse',
          title: "The Study",
          caption: "The Study's oracle rolled you a poem as you came in — it greets everyone that way, and no two greetings match. Form is the constraint that makes the roll interesting: meter and rhyme are load-bearing here. Conjure another. The estate's first voice was verse before it was speech." },
        { href: 'index.html', at: 'approach',
          title: "The Way Out Is the Way In",
          caption: "The road out runs south past the gatehouse to the gate — and the gate works in both directions: the way out is the way in. That is the oldest joke on the estate, and its truest promise. You know the grounds now. Come back by any door you like." }
      ]
    }
  ];

  /* ── browser globals ──────────────────────────────────────────────────────── */
  if (root) {
    root.TOURS = TOURS;
    root.EXTRA_STOPS = EXTRA_STOPS;
    root.DOCENT_SENTINEL = DOCENT_SENTINEL;
  }

  /* dual-use module guard (forge strips exactly this braced single line) */
  if (typeof module !== 'undefined' && module.exports) { module.exports = { TOURS: TOURS, EXTRA_STOPS: EXTRA_STOPS, DOCENT_SENTINEL: DOCENT_SENTINEL }; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
