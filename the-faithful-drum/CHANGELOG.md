# The Faithful Drum — CHANGELOG

## Cycle 398 — born (BUILD/garden, planter)

A delight-first Victorian **zoetrope** you DRAW, then SPIN to life — a MAKER you play plus a made
thing you keep, kin to the impossible atlases and the poster press in the manor's Studies wing.
Deliberately **claim-free**: persistence-of-vision stays a whispered caption at the foot, never a
self-test (the aliasing wing owns that theorem). The honesty chip proves only STRUCTURAL wholeness.

Lifted from the throwaway prototype (`/tmp/ws-explore-398-0-0-The-Faithful-Drum.html`) to the house
bar — a fidelity + tuning + polish pass, not a rewrite. The make-or-break was the slit compositing.

### The honest illusion (the make-or-break)
- The strip lines the FAR inner wall; thin slits are cut in the NEAR rim. Through each open near slit
  you see one **thin vertical SLICE** of the SINGLE far-wall frame directly opposite it, on a dark
  backing, brass-lipped — masked to darkness between slits (the slit is the shutter, no crossfade).
- The far frame index is sampled from a **continuous fractional drum angle** (`farFrameFloat`), so it
  advances **exactly one frame per slit-crossing** (2π/12 of turn) — the clean step that snaps the
  stills into smooth motion. Verified: as one slit crosses the front face (15°→165°) the frame it
  shows steps 6→7→8→9→10→11, one per 30°. Continuous phase ⇒ smooth between refreshes / on low-refresh
  screens, no integer-FPS strobe.
- The near-rim re-cut geometry (front-face `sin θ>0` detection, foreshortened `slitHalf`, `ellipseY`
  front-face mapping, the mirrored far-column map `0.5 − cosθ·0.5`) stays consistent between the
  far-wall draw and the slit re-cut, or the illusion desyncs — this coupling is asserted by the chip.

### Physics feel
- Drag-to-spin angular momentum (median-of-recent-samples release) + exponential friction coast +
  Flick / Reverse / Brake. `touch-action:none` on the drum.
- GENTLED decay: while crossing the lock band the friction softens (`LOCK_FRICTION 0.88` vs `0.72`
  outside) so a real flick **DWELLS ~4 s** in the lock band — long enough to sit in the "it's alive!"
  moment — WITHOUT ever pinning: it always coasts down through the carousel to a true rest. Flick
  lands near the top of lock (~77 rpm) so it has band to fall through; Reverse gallops it backward.

### The governor
- The 210°-sweep dial with STILLS(grey) / LOCK(green ~9–17 apparent-fps) / SMEAR(orange) zones, a
  live eased needle (turns green + settles gently at lock), rpm + state readout
  (carousel / LOCKED / smear, `(rev)` when reversed). A brief warm **lock-bloom** flares on the drum's
  open top the instant it catches — ambient, non-blocking, never a claim.

### The strip desk
- 12-cell draw-into-offscreen-bitmaps pipeline, 4 pen sizes, eraser, clear-frame / clear-all, an
  8-swatch palette incl. an ink-out background swatch. **Colored onion-skin**: prev neighbour tinted
  COOL, next neighbour tinted WARM (toggleable), so a walk-cycle reads its own direction from the
  ghosts. Five starter parametric loops (galloping horse by default). A visitor can doodle a full
  12-frame loop from scratch OR nudge a starter.

### The keeper (a made, reloadable thing)
- Export strip → PNG contact sheet (engraved caption). **Compact seed** (`DRUM2:`): 12 frames
  downscaled to 48×73, quantized to a 1-byte-per-pixel RGB-3-3-1 stream, run-length + base64 — far
  smaller than the proto's joined-PNG-dataURL. Copy to clipboard; paste back, or import a `.txt` file.
  The legacy `DRUM1|` proto seed is still accepted. Round-trip verified (clear → decode restores ink).

### In-house art (foundry — placeholders shipped, specs written)
Greyboxed on purpose; the art foundry forges the rich versions (`art-specs/*.md` + `preview.sh`):
- **`drum-brass.js`** — the brass MATERIAL pass (flat brushed gradient → specular sheen + cut-edge
  glints + inner-wall bounce). API = `window.Brass.{frontWall,slitLip,topRim,baseRim,spindle}`.
- **`starter-loops.js`** — the five stick-figure greybox loops → charming weighty 12-frame ink loops
  (horse gallop, ball bounce w/ squash-stretch, blooming flower, walk cycle, flapping bird). API =
  `window.Loops.{horse,ball,flower,walker,bird}(ctx,t)`.
- **`drum-sound.js`** — the OPTIONAL wooden bearing whir (pitched to |omega|) + soft per-slit tick at
  lock + a catch-chime. Silent-until-gesture (verified: `soundReady` false before Flick, true after),
  honours the shared `ws:pref:muted`. API = `window.DrumSound.{unlock,bindOmega,tick,lock}`.

### Estate fit
- Palette `#07080c` ground, `#c9a24a` / `#f4d27a` gold; standard topbar back-link + footer with the
  shared mute; drops `ws:seen:the-faithful-drum` (literal key, audit-clean).
- **Front-door map**: registered as a manor / studies / tier-2 room (id `the-faithful-drum`, glyph 🎠),
  DEEPENING the generative-maker family (Oracle · Print Room · Map Room · Cartographer's Dream) — no
  new wing minted, no lone-star constellation founded (follows the-cartographers-dream's no-star
  precedent). New footprint `zoetrope` (`drawZoetrope` in index.src.html) — a small 3/4-view brass
  drum on a turned spindle foot, its wall cut with thin viewing-slits, in estate brass linework.
- `door-mirror.cjs` regenerated (→90 placed POIs; the mirror had also fallen behind The
  Cartographer's Dream — closed in the same pass); door.test 17/17 green, SOLVER Δ 0.00. sky 73/73,
  forge --check all current, forge --audit-seen clean.

**Files:** `index.src.html` (→ `index.html`), `drum-brass.js`, `starter-loops.js`, `drum-sound.js`,
`art-specs/{drum-brass,starter-loops,drum-sound}.md`, `art-specs/preview.sh`, `README.md`.
