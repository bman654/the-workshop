// Manifest for the Strange Garden gallery. Loaded via <script src> so it works
// over file:// without fetch/CORS issues. Append an entry when you add a piece.
// thumb is derived from `file` (basename + .png in assets/thumbs/) unless overridden.
window.PIECES = [
  {
    file: "particle-life.html",
    name: "Particle Life",
    blurb: "colours that attract and repel into living cells",
    accent: "#f6a45c"
  },
  {
    file: "physarum.html",
    name: "Physarum",
    blurb: "a million appetites remember the shape of the world",
    accent: "#f5a623"
  },
  {
    file: "reaction-diffusion.html",
    name: "Reaction–Diffusion",
    blurb: "two chemicals quarrel into coral and restless spots",
    accent: "#4fd6c2"
  },
  {
    file: "boids.html",
    name: "Boids",
    blurb: "three rules, and a murmuration breathes itself alive",
    accent: "#8fb7ff"
  }
];
