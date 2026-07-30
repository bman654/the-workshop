// Manifest for the Sound Garden rack. Loaded via <script src> so it works over file://.
// Each instrument is a self-contained Web-Audio page. thumb derived from `file` basename
// (.png in assets/) unless overridden. Append an entry when you add an instrument.
//
// THE PIPE RACK (#455): the hub is now a wall of tuned pipes you strum. Each entry may
// carry an OPTIONAL `timbre` — one of 'bell' | 'pluck' | 'breath' | 'mallet' | 'plink' —
// the archetype voice the pipe SOUNDS like, nodding to what the room IS (a bell room
// rings, a plucked room plucks). It is only a timbre archetype; the PITCH of every pipe
// is assigned structurally by the rack (pentatonic, rising in DOM order) from the
// estate's ONE pitch anchor (pitch-core.mjs's semiToFreq), never per-note here.
window.INSTRUMENTS = [
  {
    file: "whitney.html",
    name: "Whitney Music Box",
    blurb: "concentric moons chime polyrhythms as they spiral and realign",
    accent: "#cf7bff", timbre: "plink"
  },
  {
    file: "drift.html",
    name: "Drift",
    blurb: "sustained voices breathe a slow, ever-drifting consonant chord",
    accent: "#b6a8ff", timbre: "breath"
  },
  {
    file: "euclid.html",
    name: "Euclidean Rhythms",
    blurb: "circular tracks spread their beats evenly, braiding shifting polyrhythms",
    accent: "#ffb454", timbre: "mallet"
  },
  {
    file: "rain.html",
    name: "Rain",
    blurb: "seeded rain falls on a tuned pool — each drop plinks a note in scale, rings, and ripples away",
    accent: "#6fb6ff", timbre: "plink"
  },
  {
    file: "loom.html",
    name: "Loom",
    blurb: "a seeded loom weaves evolving chord progressions into shimmering plucked arpeggios",
    accent: "#e8b765", timbre: "pluck"
  },
  {
    file: "carillon.html",
    name: "Carillon",
    blurb: "tuned bells ring slow, overlapping changes — inharmonic, resonant, ever-shifting",
    accent: "#c79a4b", timbre: "bell"
  },
  {
    file: "lattice.html",
    name: "Lattice",
    blurb: "a glowing pitch×time lattice — a playhead sweeps, lit cells chime in scale, the seeded pattern blooms and evolves",
    accent: "#5fe6c4", timbre: "plink"
  },
  {
    file: "gamelan.html",
    name: "Gamelan",
    blurb: "two interlocking parts — polos and sangsih — weave into one gap-free stream on inharmonic metallophones tuned to slendro or pelog",
    accent: "#e0a23c", timbre: "mallet"
  },
  {
    file: "monochord.html",
    name: "Monochord",
    blurb: "pluck, slide, and touch one tensioned string — its overtones are an exactly even ladder you can see and hear (fₙ/f₁=n)",
    accent: "#d9a441", timbre: "pluck"
  },
  {
    file: "hearing-the-shape/index.html",
    name: "Hearing the Shape",
    blurb: "two drumheads that are not the same shape and answer with exactly the same fourteen notes — Kac's question, and the pair found by trying all 318 ways of gluing seven half-squares together",
    accent: "#e5b95f", timbre: "mallet"
  },
  {
    file: "the-wind-chimes/index.html",
    name: "The Wind Chimes",
    blurb: "six tubes cut so the metal itself decides the note, hung in real air you can raise — tap one anywhere along its length and hear where you hit, then slide the cord and hear twelve seconds of ring fall to two",
    accent: "#c9a24a", timbre: "bell"
  },
  {
    file: "grain-mill.html",
    name: "Grain Mill",
    blurb: "tip a held cello tone into a brass hopper and it shatters into hundreds of glowing sound-grains — slide GRAIN SIZE and DENSITY to melt one note into rain, a drone, then mist",
    accent: "#7fd4b0", timbre: "breath"
  },
  {
    file: "the-answering-room/index.html",
    name: "The Answering Room",
    blurb: "stand inside the lattice of mirror-rooms a clap makes — walk around four hundred thousand echoes, then hand them to a real convolver and hear the room they describe",
    accent: "#d8a94a", timbre: "bell"
  }
];
