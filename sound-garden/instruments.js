// Manifest for the Sound Garden rack. Loaded via <script src> so it works over file://.
// Each instrument is a self-contained Web-Audio page. thumb derived from `file` basename
// (.png in assets/) unless overridden. Append an entry when you add an instrument.
window.INSTRUMENTS = [
  {
    file: "whitney.html",
    name: "Whitney Music Box",
    blurb: "concentric moons chime polyrhythms as they spiral and realign",
    accent: "#cf7bff"
  },
  {
    file: "drift.html",
    name: "Drift",
    blurb: "sustained voices breathe a slow, ever-drifting consonant chord",
    accent: "#b6a8ff"
  },
  {
    file: "euclid.html",
    name: "Euclidean Rhythms",
    blurb: "circular tracks spread their beats evenly, braiding shifting polyrhythms",
    accent: "#ffb454"
  },
  {
    file: "rain.html",
    name: "Rain",
    blurb: "seeded rain falls on a tuned pool — each drop plinks a note in scale, rings, and ripples away",
    accent: "#6fb6ff"
  }
];
