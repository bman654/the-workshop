# The Split-Flap Board — build log

## v1.0 — initial build

Single-page Solari departure board you TYPE into (`index.html`, forged from `index.src.html` via
`tools/forge/forge.mjs`; vanilla JS + DOM tiles, zero deps / no network). A walnut-and-brass cabinet
of split-flap tiles that riffle down and clack home on your words — each tile stepping the SHORTEST
way round its 43-glyph ring (A→Z is one reverse flip, not twenty-five). PURE DELIGHT, claim-free: the
mechanical flip and the dry clatter ARE the payoff, not the text. Kin to The Letterer and the
Compositor — a riffling fall, not a pressed impression.

### Built
- **The board** — rows of split-flap tiles; type in the box or click the board and type direct;
  `space` blanks a tile, `Shuffle` spins every tile one-to-three full revolutions then re-lands
  EXACTLY on the word (spectacle with no cheat). Quick light riffle-steps overshoot and tick; the
  final leaf lands with a weighty snap, a warm hit-pulse, and a teal cursor accent.
- **Shortest-way ring stepping** — each tile queues the minimum steps round its glyph ring, so a full
  board resolves as a clatter rather than a machine-gun sweep.
- **In-house forged voices** — `sound-clack.js` (the "modal wood" hero land clack, 4-variant
  round-robin so a full board resolves as a clatter, not a machine-gun) and `sound-riffle.js` (the
  "leaf-brush" light riffle tick), both forged by the estate's art foundry (K takes → judge → synth),
  never foraged. The `Sound` orchestrator conducts them through a master gain + compressor; audio is
  gesture-gated. The board sings its own sound, so it deliberately does NOT wear the estate air chip.

### Verified (session `spf419`)
- **Payoff-liveness twin** (`window.__SPLITFLAP_TEST`) GREEN: each tile steps the shortest way, every
  planned path lands on its target, and the settled board === the input char-for-char.
- **Self-test chip** GREEN: "landed · shortest-way ✓ · clack ready"; zero console errors.
- **Forged voices produce real audio** — analyser tap: hero clack peak ≈0.46, riffle tick ≈0.017,
  neither clipping (foundry offline analysis: clack −4.93 dBFS / dark centroid ~857 Hz / no metallic
  ring; riffle −30.66 dBFS / no buzz).
- **Structure** — `node --check` clean on all 4 extracted inline scripts (guards the
  HTML-comment-in-script landmine).
- **Responsive** — mobile 375×812 no horizontal overflow (scrollWidth === clientWidth === 360);
  controls wrap, tiles scale.
- **Gates** — `forge --check --all` all current; `manifest --check` OK.

### Placement
A DEEPEN in The Workbench (Toys & benches), beside its named sibling The Letterer and cross-linked to
the Compositor. No new front door, no new wing.

### Deliverables
`index.html` (forged), `index.src.html`, `sound-clack.js`, `sound-riffle.js`, `art-specs/`, this
`CHANGELOG.md`.
