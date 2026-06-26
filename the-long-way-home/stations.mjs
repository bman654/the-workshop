/* ═══════════════════════════════════════════════════════════════════════════
   stations.mjs — THE SINGLE SOURCE OF TRUTH for "The Long Way Home".

   The twelve stations of the monomyth (Campbell's hero's journey), each carrying
   the SAME beat read in three flesh: Odysseus' homeward voyage, Inanna's descent
   to the Great Below, and the parable of the Prodigal Son. One skeleton, three
   bodies — and where a body strains the skeleton, its ribbon runs THIN. That
   visible asymmetry is the lesson, never a forced parallel.

   The PAGE renders from this array; a tiny Node check (stations.test.mjs) asserts
   SHAPE / COMPLETENESS only — 12 canonical stations in order, all 3 myths present
   and non-empty for every one (36/36), every tautness in [0,1], and exactly two
   gate boundaries at the canonical horizon-crossings. It is NOT a math proof; the
   room carries no numeric claim. It is a fidelity check: no holes, names canonical.

   FIELDS per station:
     n        1..12 ordinal
     numeral  roman numeral (display)
     name     CANONICAL stage name (the test pins these, verbatim, in order)
     beat     the one-line archetypal beat (the leaf's header)
     keyword  the illuminated convergence word the three ribbons pass through
     el       elevation: horizon = 0, up = lit Day, down = star-dark Night
     arc      'day' | 'night'  (membership; drives palette + drone)
     gateAfter (optional) 'descent' (after #5, into the dark) | 'dawn' (after #11, up to light)
     weave    one woven sentence naming all three heroes at this beat (rubricated in the page)
     myths    { odysseus, inanna, prodigal } — each { hero, text, tautness }
              tautness ∈ [0,1] = how snugly THIS myth fits the beat (1 blazes, low strains).

   The thread colours (the page owns the exact tokens):
     odysseus — sea-blue            inanna — lapis-and-carnelian        prodigal — olive-and-russet
   ═══════════════════════════════════════════════════════════════════════════ */

export const STATIONS = [
  {
    n: 1, numeral: 'I', name: 'Ordinary World', el: 0.3, arc: 'day',
    beat: 'The roof before the road — the settled life, not yet broken open.',
    keyword: 'HOME',
    weave: 'Before any road there is a roof: ODYSSEUS a king on rocky Ithaca, INANNA crowned Queen of Heaven and Earth, the YOUNGER SON safe and provided-for at his father’s table.',
    myths: {
      odysseus: { hero: 'Odysseus', tautness: 0.90,
        text: 'On Ithaca he is husband, father, king — the whole still world he will spend twenty years clawing back toward.' },
      inanna: { hero: 'Inanna', tautness: 0.90,
        text: 'Queen of Heaven and Earth, decked in the seven me, she holds every power the bright world can give.' },
      prodigal: { hero: 'the younger son', tautness: 0.95,
        text: 'A son in his father’s house, fed and kept, owning nothing yet wanting for nothing — the home he cannot yet see.' }
    }
  },
  {
    n: 2, numeral: 'II', name: 'Call to Adventure', el: 0.2, arc: 'day',
    beat: 'A summons disturbs the still water — the world asks to be left.',
    keyword: 'SUMMONS',
    weave: 'The still water stirs: ODYSSEUS is called by the oath he swore, INANNA opens her ear to the Great Below, the YOUNGER SON asks for his portion and his leave.',
    myths: {
      odysseus: { hero: 'Odysseus', tautness: 0.85,
        text: 'The muster for Troy reaches Ithaca; the oath of Tyndareus comes due, and the wide war calls him off his island.' },
      inanna: { hero: 'Inanna', tautness: 0.82,
        text: '“She opened her ear to the Great Below” — of her own will she sets her heart on the kur, the land of no return.' },
      prodigal: { hero: 'the younger son', tautness: 0.90,
        text: '“Father, give me the portion of goods that falleth to me” — the call here is his own restless asking.' }
    }
  },
  {
    n: 3, numeral: 'III', name: 'Refusal of the Call', el: 0.5, arc: 'day',
    beat: 'The recoil — a flinch back toward safety. (Here the bodies diverge most.)',
    keyword: 'NO',
    weave: 'The recoil shows what each truly is: ODYSSEUS feigns madness to dodge the war, INANNA does not flinch at all, and the YOUNGER SON refuses not the road but HOME.',
    myths: {
      odysseus: { hero: 'Odysseus', tautness: 0.95,
        text: 'He yokes an ox and an ass and sows salt, playing the madman to escape the levy — until they lay the infant Telemachus before the plough and he swerves, unmasked.' },
      inanna: { hero: 'Inanna', tautness: 0.15,
        text: 'There is no refusal in her. She descends willing, eyes open — the skeleton has a bone the bright goddess simply does not fill.' },
      prodigal: { hero: 'the younger son', tautness: 0.50,
        text: 'His refusal is inverted: he does not shrink from the journey — he turns his back on the father and takes the far road gladly.' }
    }
  },
  {
    n: 4, numeral: 'IV', name: 'Meeting the Mentor', el: 0.15, arc: 'day',
    beat: 'A guide, a gift, a word for the dark ahead — for those given one.',
    keyword: 'GUIDE',
    weave: 'A guide is given, or withheld: grey-eyed Athena walks beside ODYSSEUS, INANNA arms her own servant Ninshubur, and the YOUNGER SON sets out with no guide at all.',
    myths: {
      odysseus: { hero: 'Odysseus', tautness: 0.95,
        text: 'Grey-eyed Athena, his patron, stands at his shoulder through every disguise — the very archetype of the mentor.' },
      inanna: { hero: 'Inanna', tautness: 0.45,
        text: 'There is no one above her to counsel her; instead SHE arms Ninshubur — “if I do not return, set up a lament, and go to the gods” — the gift flows the wrong way.' },
      prodigal: { hero: 'the younger son', tautness: 0.10,
        text: 'No mentor meets him. He journeys into the far country alone, ungoverned, with no word saved up for the dark — the ribbon runs nearly to nothing.' }
    }
  },
  {
    n: 5, numeral: 'V', name: 'Crossing the First Threshold', el: 0.0, arc: 'day', gateAfter: 'descent',
    beat: 'The point of no return — the known world’s edge is stepped across.',
    keyword: 'THRESHOLD',
    weave: 'Each steps over the world’s rim: ODYSSEUS puts out on the wine-dark sea, INANNA passes the outer gate where Neti waits, the YOUNGER SON crosses into the far country with all he owns.',
    myths: {
      odysseus: { hero: 'Odysseus', tautness: 0.85,
        text: 'He leaves the last friendly shore and commits to the open, monster-haunted sea — no road now but forward.' },
      inanna: { hero: 'Inanna', tautness: 0.90,
        text: 'At the outer gate the keeper Neti bolts the world behind her; she crosses into the realm from which none return unmarked.' },
      prodigal: { hero: 'the younger son', tautness: 0.85,
        text: '“He gathered all together and took his journey into a far country” — the threshold is the road out of the father’s reach.' }
    }
  },
  {
    n: 6, numeral: 'VI', name: 'Belly of the Whale', el: -0.6, arc: 'night',
    beat: 'Swallowed by the dark — inside the monster, inside the gates, inside want.',
    keyword: 'SWALLOWED',
    weave: 'The dark takes them in: ODYSSEUS into the Cyclops’ cave, INANNA through the seven swallowing gates, the YOUNGER SON into famine and want.',
    myths: {
      odysseus: { hero: 'Odysseus', tautness: 0.95,
        text: 'Shut in Polyphemus’ cave behind a stone no man can move, watching his comrades eaten — the literal belly of the beast, escaped only as “Nobody.”' },
      inanna: { hero: 'Inanna', tautness: 0.85,
        text: 'Through gate after gate she is taken in, the seven mouths of the underworld closing one by one behind the descending queen.' },
      prodigal: { hero: 'the younger son', tautness: 0.80,
        text: 'He wastes his substance in riotous living; then a mighty famine rises in that land, and he begins to be in want — hunger swallows him whole.' }
    }
  },
  {
    n: 7, numeral: 'VII', name: 'Road of Trials', el: -1.1, arc: 'night',
    beat: 'The long ordeal-road — test after test wearing the traveller down.',
    keyword: 'ORDEALS',
    weave: 'The road tests them past bearing: ODYSSEUS through Circe and the Sirens and the strait, INANNA stripped at each of the seven gates, the YOUNGER SON sent down to feed swine.',
    myths: {
      odysseus: { hero: 'Odysseus', tautness: 0.95,
        text: 'Aeolus’ squandered winds, Circe’s wand, the Sirens’ song, Scylla’s six mouths and Charybdis’ throat — the archetypal road of trials, paid for crewman by crewman.' },
      inanna: { hero: 'Inanna', tautness: 0.70,
        text: 'At each gate a power is stripped from her — crown, rod, beads, breastplate, ring, necklace, robe — and to every protest: “Be silent, Inanna; the ways of the underworld are perfect.”' },
      prodigal: { hero: 'the younger son', tautness: 0.75,
        text: 'He hires himself to a citizen of that country and is sent into the fields to feed the pigs — for a son of his house, the lowest unclean rung there is.' }
    }
  },
  {
    n: 8, numeral: 'VIII', name: 'The Ordeal', el: -1.5, arc: 'night',
    beat: 'The nadir — the death from which there is no obvious back.',
    keyword: 'DEATH',
    weave: 'At the bottom is a kind of death: ODYSSEUS among the shades of the dead, INANNA a corpse on the wall, the YOUNGER SON starving and alone among the husks.',
    myths: {
      odysseus: { hero: 'Odysseus', tautness: 0.85,
        text: 'He sails to the edge of the world and pours blood for the dead, walking among the shades — his mother’s ghost slipping through his arms three times.' },
      inanna: { hero: 'Inanna', tautness: 1.0,
        text: 'Naked and bowed before Ereshkigal and the seven judges, the eye of death is fastened on her; she is struck a corpse and hung on a hook on the wall. The absolute floor.' },
      prodigal: { hero: 'the younger son', tautness: 0.80,
        text: 'He would have filled his belly with the husks the swine ate, “and no man gave unto him” — hunger, filth, and a final aloneness.' }
    }
  },
  {
    n: 9, numeral: 'IX', name: 'The Reward', el: -1.2, arc: 'night',
    beat: 'A glint in the deep — the thing seized at the bottom of the dark.',
    keyword: 'GIFT',
    weave: 'A gift kindles in the deep: ODYSSEUS the prophecy of his way home, INANNA the water and food of life, the YOUNGER SON the moment he comes to himself.',
    myths: {
      odysseus: { hero: 'Odysseus', tautness: 0.70,
        text: 'Blind Tiresias rises and gives him the one thing the dark holds for him — the road home, and the shape of his own fate. The reward is knowledge, not gold.' },
      inanna: { hero: 'Inanna', tautness: 0.85,
        text: 'Two sexless creatures Enki shaped from the dirt of his nail slip in, mourn with Ereshkigal’s labour-pangs, and are given the corpse; the food and water of life are sprinkled, and she stirs.' },
      prodigal: { hero: 'the younger son', tautness: 0.80,
        text: '“And when he came to himself” — the gift is a returning mind: “How many of my father’s servants have bread enough, and I perish here.”' }
    }
  },
  {
    n: 10, numeral: 'X', name: 'The Road Back', el: -0.7, arc: 'night',
    beat: 'The turn for home — the long climb begun, but not yet free.',
    keyword: 'RETURN',
    weave: 'The climb for home begins: ODYSSEUS set sleeping on his own shore, INANNA rising but trailed by demons, the YOUNGER SON arising to go to his father.',
    myths: {
      odysseus: { hero: 'Odysseus', tautness: 0.80,
        text: 'The Phaeacians give him passage; he is carried home asleep and laid, still dreaming, on the coast of Ithaca itself.' },
      inanna: { hero: 'Inanna', tautness: 0.70,
        text: 'She ascends — but “no one rises from the underworld unmarked”; the galla demons climb at her heels to claim a life for her life.' },
      prodigal: { hero: 'the younger son', tautness: 0.85,
        text: '“And he arose, and came to his father,” rehearsing as he walks: “Make me as one of thy hired servants.”' }
    }
  },
  {
    n: 11, numeral: 'XI', name: 'Resurrection', el: -0.2, arc: 'night', gateAfter: 'dawn',
    beat: 'The last threshold up — the old self dies, the true self stands.',
    keyword: 'RISEN',
    weave: 'At the last gate the self is remade: ODYSSEUS bends the great bow, INANNA rises reclothed through the seven gates, and the father runs to the YOUNGER SON before a word is spoken.',
    myths: {
      odysseus: { hero: 'Odysseus', tautness: 0.85,
        text: 'The ragged beggar strings the bow no suitor could bend and rises in the hall as the king — the old disguise dies, the true man stands.' },
      inanna: { hero: 'Inanna', tautness: 0.60,
        text: 'She climbs back through the seven gates, each power returned to her — restored, but with the demons still at her side, the rising not yet clean.' },
      prodigal: { hero: 'the younger son', tautness: 0.95,
        text: '“When he was yet a great way off, his father saw him, and ran, and fell on his neck” — “this my son was dead, and is alive again.”' }
    }
  },
  {
    n: 12, numeral: 'XII', name: 'Return with the Elixir', el: 0.3, arc: 'day',
    beat: 'Home broken open new — back where it began, and changed, at dawn.',
    keyword: 'ELIXIR',
    weave: 'They come home changed: ODYSSEUS to Penelope and the rooted bed, INANNA bearing death’s price, the YOUNGER SON to the ring, the robe, and the feast.',
    myths: {
      odysseus: { hero: 'Odysseus', tautness: 0.90,
        text: 'He proves himself by the secret of their bed, rooted in a living tree, and is made whole again — husband, father, king. The elixir is the self restored.' },
      inanna: { hero: 'Inanna', tautness: 0.45,
        text: 'She returns to the Great Above — but the demands the dark made are paid in Dumuzi, taken in her place. Her elixir is darker: the knowledge of death’s price, and the turning of the year.' },
      prodigal: { hero: 'the younger son', tautness: 0.95,
        text: 'The best robe, the ring, the fatted calf, music and dancing: “he was lost, and is found.” The elixir is grace — a welcome he could never have earned.' }
    }
  }
];

/* The canonical names + order, kept beside the data so the test and the page read
   from one place (the test asserts STATIONS matches this, verbatim, in sequence). */
export const CANONICAL_NAMES = [
  'Ordinary World', 'Call to Adventure', 'Refusal of the Call', 'Meeting the Mentor',
  'Crossing the First Threshold', 'Belly of the Whale', 'Road of Trials', 'The Ordeal',
  'The Reward', 'The Road Back', 'Resurrection', 'Return with the Elixir'
];

/* The three myth keys, in their woven order. */
export const MYTH_KEYS = ['odysseus', 'inanna', 'prodigal'];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { STATIONS, CANONICAL_NAMES, MYTH_KEYS };
}
