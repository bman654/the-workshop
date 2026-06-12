// Manifest for the Arcade gallery. Loaded via <script src> so it works over file://
// without fetch/CORS. Append an entry when you add a game. thumb is derived from `file`
// (basename + .png in assets/thumbs/) unless overridden.
window.GAMES = [
  {
    file: "asteroids.html",
    name: "Asteroids",
    blurb: "neon vector survival — split rocks, dodge saucers",
    accent: "#37f7e0"
  },
  {
    file: "breakout.html",
    name: "Breakout",
    blurb: "smash neon bricks, chain combos, catch power-ups",
    accent: "#ff3ea5"
  },
  {
    file: "snake.html",
    name: "Snake",
    blurb: "glide a glowing neon serpent, grow, survive",
    accent: "#39ff9e"
  },
  {
    file: "starfighter.html",
    name: "Starfighter",
    blurb: "neon shmup — blast waves, grab power-ups, kill bosses",
    accent: "#ff2e88"
  },
  {
    file: "tetris.html",
    name: "Tetris",
    blurb: "stack neon blocks, clear lines, chase the tetris",
    accent: "#37d6ff"
  },
  {
    file: "2048.html",
    name: "2048",
    blurb: "slide neon tiles, merge twins, chase 2048",
    accent: "#ffb13d"
  },
  {
    file: "missile-command.html",
    name: "Missile Command",
    blurb: "aim, intercept, defend your neon cities",
    accent: "#ff6a3d"
  },
  {
    file: "pong.html",
    name: "Pong",
    blurb: "neon table tennis — out-angle the cpu, first to eleven",
    accent: "#c6ff4d"
  },
  {
    file: "lunar-lander.html",
    name: "Lunar Lander",
    blurb: "thrust against gravity, land soft on the neon flats",
    accent: "#8fbaff"
  },
  {
    file: "crossing.html",
    name: "Crossing",
    blurb: "thread the neon traffic, ride the river home",
    accent: "#39ff14"
  },
  {
    file: "chomp.html",
    name: "Chomp",
    blurb: "neon maze muncher — clear the pellets, flee the ghosts, gobble the chasers",
    accent: "#ffd23d"
  },
  {
    file: "swarm.html",
    name: "Swarm",
    blurb: "twin-stick survivor — outrun the neon horde, grab XP, level up",
    accent: "#b06bff"
  },
  {
    file: "gyre.html",
    name: "Gyre",
    blurb: "neon tube shooter — hold the rim, fire down the well, dive deeper",
    accent: "#37f7e0"
  },
  {
    file: "tessera.html",
    name: "Tessera",
    blurb: "neon area-claiming — carve the dark, fence off the Qix, take the field",
    accent: "#ff2e88"
  },
  {
    file: "centipede.html",
    name: "Centipede",
    blurb: "neon serpentine descent — split the chain, mind the spider, hold the garden",
    accent: "#39ff9e"
  },
  {
    file: "qubit.html",
    name: "Qubit",
    blurb: "neon iso cube-hopper — flip every face, dodge the balls, lure Coily off the edge",
    accent: "#ffd23d"
  }
];
