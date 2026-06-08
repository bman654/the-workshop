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
    blurb: "a million cells solving mazes with slime",
    accent: "#e8a24c"
  },
  {
    file: "reaction-diffusion.html",
    name: "Reaction–Diffusion",
    blurb: "two chemicals dreaming up coral and stripes",
    accent: "#5fd0c5"
  },
  {
    file: "boids.html",
    name: "Boids",
    blurb: "three simple urges become a murmuration",
    accent: "#7fb0ff"
  }
];
