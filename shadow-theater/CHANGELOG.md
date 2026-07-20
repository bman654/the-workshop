# The Shadow Theater — build log

## v1.0 — the real cutouts wired in (art forged in-house)

The greybox art is replaced by the FINAL in-house cutouts, and the piece ships. The
three art modules are the real work now (`__forged: true`), each authored in-house to
the contract its `art-specs/*.md` set — never foraged, never a stock silhouette. (The
relay's K-take art-foundry pass did not run before this builder; rather than gamble the
bounded relay's terminal pass on it re-running, the three assets were hand-forged in
this pass against the same specs and API, so the call sites are byte-faithful.)

### Forged assets (provenance — each is CODE against a frozen API)
- **`puppets.js` → `window.Puppets`** — the six paper-cut silhouettes, recut from blocky
  greybox to clean, iconic contours: a long-necked **crane** (one flowing body→neck→
  beak outline + a shoulder-hinged wing that sweeps overhead in flight), a seated **fox**
  (a single non-self-intersecting outline — nose, tall ears, brush-tail lobe, rump, paws
  — with an even-odd pierced eye that reads as a lit glint, and a `look` head-tilt), a
  **reed** cattail cluster (sausage heads on swaying stalks + two long arcing blades), the
  aperture **moon** (a wavy cloud band with an even-odd pierced disc → the silk blooms
  through it), a weeping **willow** (a lumpy crown bough + long fronds that cascade
  outward and taper to a point, drifting on `sway`), and the far **vee** (three tiny
  gull-bodied cranes whose wings flap on the global clock — the depth showcase, small +
  crisp). Holed figures are cut as one outline + hole so nothing self-subtracts; holeless
  figures stay non-zero and union freely. Spec: `art-specs/puppets.md`.
- **`proscenium.js` → `window.Proscenium`** — warm mulberry-grain woven silk (deterministic,
  never flat), a lamp bloom that widens/brightens as the lamp dollies in, and a carved
  walnut arch whose spandrels sink into soft corner shadow so the frame reads carved, not
  merely edged. Spec: `art-specs/proscenium.md`.
- **`sound-hush.js` → `window.HushBed` + `Gate.sfx['hush-bed']`** — the breathing lantern
  hush (dual-use live/offline): a lowpassed brown room-tone under a faint bandpassed
  lamp-hiss, its amplitude on a slow random-walk so the lamp seems to breathe. Muted by
  default; the piece sings its own air and wears no estate air chip. Spec: `art-specs/hush-bed.md`.

### Verified (session `st420`, real art)
- **Payoff-liveness twin** `window.__SHADOW_TEST` GREEN driving the real entries — overlap
  changes the cast (union 3767→2846), the overlap is a TRUE union (2846 < sumAreas 3771,
  merges not additive), halving the lamp distance changes projected scale (11778→15170) —
  green at desktop 960 and mobile 375. **Visual smoke** `window.__SHADOW_SMOKE` GREEN
  (crane wing articulates, moon yields an even-odd pierced contour, all three modules
  present + `__forged:true`).
- **Silhouettes read** — posed the default night-by-water cast and a crane-takes-flight-
  over-the-moon scene; every figure is iconic at a glance, overlapping cutouts merge to
  solid black, the moon disc stays lit, near-lamp puppets loom huge + soft while the far
  vee stays small + crisp.
- **Hush bed** — offline `Gate.sfx['hush-bed']` audio-lensed (22.05 kHz / 4 s): no clip
  (peak −9.8 dBFS, 0%), dark warm centroid ≈111 Hz, quiet RMS ≈−22.6 dBFS, a 1.4 s
  fade-in from silence then a gentle breathing wobble on the sustain (not machine-gunning).
- **Structure** — `node --check` clean on all 5 extracted inline scripts (guards the
  HTML-comment-in-`<script>` landmine — `/* */` inside `<script>`, never `<!-- -->`).
- **Zero console errors**; mobile 375×812 no horizontal overflow; `forge --check --all`
  current, `manifest --check` OK.

## v0.9 — the engine + placeholder art (greybox, art-foundry pending)

A lamp-lit silk stage you perform a wordless night-by-water on (`index.html`, forged
from `index.src.html` via `tools/forge/forge.mjs`; vanilla JS + Canvas2D, zero deps /
no network). You drag paper puppets and dolly the lamp; **overlapping paper merges
into TRUE solid black, and paper near the lamp looms huge and soft.** PURE DELIGHT,
claim-free: the shadow itself is the payoff. The correct projective/occlusion geometry
is a QUIET layer — no HUD, no proof chip.

### Built (the system, verified GREEN with placeholder art)
- **The render engine** — each frame, every puppet's contour is rasterized to an
  opaque white-on-black scratch, **scaled about the lamp by m** (baked into the
  coordinate map so the blur is exact device px), blurred by the penumbra, and
  **MIN-unioned into a reduced-res accumulator via `globalCompositeOperation:'darken'`**
  — exact boolean union (solid black on overlapping cores, min-coverage soft edges,
  never additive over-darkening). The compositor multiplies that accumulator onto the
  amber silk, so shadows read deep-brown-black and the silk bleeds warmth at the
  penumbra.
- **The unified coordinate + depth contract** — silk at z=0, lamp behind at Z_L,
  puppet at gap g = depth·G_MAX; magnification m = Z_L/(Z_L−g); penumbra w = R_L·(m−1).
  Scale and softness are LOCKED to one variable, so a lamp-near puppet is inescapably
  both huge AND feathered. The lamp dolly lowers Z_L → m grows for all puppets at once.
  The pierced **moon aperture** stays lit automatically (an even-odd hole in a
  darken-pass cloud-bar); the crane wing sweeping over it min-unions to solid black —
  the hero merge.
- **The `Stage` seam** — `puppets`, `hitTest`, `movePuppet` / `setPuppetDepth` /
  `setLampDistance` / `articulate`, `getState` / `setState({animate})`,
  `snapshotThumbnail`, and `measureCast()` (reads the accumulator: unionArea, sumAreas,
  castScale) — the render, hands, and keep facets all bind through it.
- **Hands** — three grab-kinds via a z-ordered hitTest: BODY drag slides in-plane,
  control-ROD vertical drag sets DEPTH (up → loom), the LAMP glow drag dollies. A
  single hinge (the crane wing / fox look) is a grabbable artic. Pointer sets a TARGET;
  a critically-damped spring eases the real value (mass + settle — pushing a stick, not
  scrubbing a slider). Wheel accelerators; REDUCED_MOTION snaps. Only chrome = cursors
  + a faint rod glint while grabbed.
- **Keep shelf** — an unobtrusive leaf freezes the current cast to a small silhouette
  thumbnail on a filmstrip shelf below the stage (`ws:shadow:shelf`, bounded ring of
  12, try/catch for private-mode); clicking a frame calls `setState(state,{animate})`
  and the puppets GLIDE home.
- **One shared rAF loop** — Hands.tick first, mark shadow-dirty on movement, render the
  shadow union only when dirty (idle-skip), composite the cached silk + tracking bloom
  every frame. Adaptive `SB_SCALE` (0.55 desktop → 0.40 mobile) governs the accumulator.

### Placeholder art (to be replaced by the art foundry — same API)
Three in-house asset modules ship as honest PLACEHOLDERS so the whole system is
testable now; the art foundry (K takes → judge → synth) replaces the CODE, and a fresh
wiring builder re-inlines each, byte-faithful:
- `puppets.js` → `window.Puppets` — the six paper-cut silhouettes (crane w/ hinged
  wing, fox w/ pierced eye, reeds, pierced-disc moon, willow, far flapping vee). Spec:
  `art-specs/puppets.md`. Preview harness: `art-specs/preview-harness.sh`.
- `proscenium.js` → `window.Proscenium` — the woven amber silk, walnut arch, dollying
  lamp bloom. Spec: `art-specs/proscenium.md`.
- `sound-hush.js` → `window.HushBed` + `Gate.sfx['hush-bed']` — the breathing lantern
  hush (dual-use live/offline). Spec: `art-specs/hush-bed.md`.

### Verified (session `sthdr`, placeholder art)
- **Payoff-liveness twin** (`window.__SHADOW_TEST`) GREEN, headless, driving the real
  entries: moving a puppet to overlap another CHANGES the cast (union 3767→2846);
  the overlap is a TRUE union (2846 < sumAreas 3771 — merges, not additive); halving
  the lamp distance CHANGES the projected scale (castScale 11777→15170). Green on
  desktop (960px) and mobile (375px).
- **Visual smoke** (`window.__SHADOW_SMOKE`) GREEN: the crane wing articulates
  (silhouette({wing:0})≠({wing:1})); the moon yields a pierced (even-odd) contour;
  all three art modules present.
- **Audio** — after a real gesture the hush bed runs (`ctx.state:'running'`, analyser
  peak ≈0.15 / rms ≈0.057, not clipping); shared mute honoured. Offline bench
  (`Gate.sfx['hush-bed']`) audio-lens: no clip, dark centroid ~169 Hz, ~5 breath
  onsets over 4 s (the slow wobble).
- **Structure** — `node --check` clean on all 5 extracted inline scripts (guards the
  HTML-comment-in-script landmine — `/* */` inside `<script>`, never `<!-- -->`).
- **Responsive** — mobile 375×812 no horizontal overflow (scrollWidth === clientWidth
  === 375); `SB_SCALE` auto-drops to 0.40.
- **Gates** — `forge --check --all` all 164 current; `manifest --check` OK (430 pieces,
  unclaimed 0).

### Placement (DEEPEN — no new front door)
GATHERED into **The Magic Lantern** (`magic-lantern/`) as its first hands-on exhibit:
the lantern projects a slide's image through light; the shadow theater projects a
cutout's silhouette through light — exact optical-projection kin. A thin single-purpose
room now pairs its projected-slide films with a projected-cutout stage (cures the flat
single-room; honours "no grand name over one dot"). Registered as a room-exhibit under
`magic-lantern` in the manifest (`registry.mjs` HUBS: the `.stage-door` first-class
idiom), a card added to the room page, cross-linked to the optical-play siblings
(Hall of Mirrors) and the hands-on tactile siblings (The Maker's Shed), and to the
keep-shelf kin (The Spin They Keep). Front-door tallies bumped.

### Deliverables
`index.html` (forged), `index.src.html`, `puppets.js`, `proscenium.js`,
`sound-hush.js`, `art-specs/` (three specs + `preview-harness.sh`), this `CHANGELOG.md`.
