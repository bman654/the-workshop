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
  }
];
