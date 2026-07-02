# A Sky You Name — CHANGELOG

## Cycle 407 — born (BUILD/garden)

A delight-first, claim-free celestial toy: a seeded starfield you lace by hand into your own
figure, then CLOSE to catasterize — the page inks a golden asterism, letters its generated
NAME, and tells a two-line origin MYTH in the estate's theogony voice. RE-SEED scatters a fresh
sky; KEEP files the chart to a Constellarium folio you flip back through. Kin to `verse` (which
speaks the verse) and `the-cartographers-dream` next door (a land you discover by hand); it
borrows the celestial LOOK only, never the byte-frozen `tools/sky/`. No math claim, no HUD — the
only self-test is well-formedness. Registered as a NEW front-door footprint (its own slug), in
the manor's `studies` wing beside its celestial/naming kin.

Folded from three explorer prototypes: the interaction/render SPINE (Explorer 0 "The Lacing"),
the naming GENERATOR (Explorer 1 "The Star-Lore"), and the constellarium PLATE composition
(Explorer 2 "The Atlas").

### The soul — `starlore.mjs` (the words are a reading of the HAND)
A pure, versioned generator (also imported by the Node twin — one authority, two consumers).
- **`readShape(pts)`** reads PURE GEOMETRY of the laced polyline, normalized 0..1 (resolution-
  independent, frozen at the capture seam) → a trait record `{n, closed, turns, totalTurn,
  aspect, ar, reach, straightness, area, form}`. Closed = returns near the first star AND encloses
  real area (≥4 stars). `form` ∈ {ring, vessel, line, bend, tangle, spark, standing, reclining,
  squared}.
- **`nameSky(seed, pts)`** christens + narrates FROM those traits: form-keyed FIGURE banks,
  shape-LICENSED epithet banks (many/few · wide/tight · turn/calm), a DEED line keyed to FORM and
  a FATE line keyed to the salient secondary trait (closed→returns · line→never arrives · turns→
  cannot rest · wide→strays · tight→keeps close), plus a Latinish α-genitive catalogue designation.
  ONE PRNG stream keyed off `(seed + GEN_VERSION + serialized shape reading)`, so identical
  `(seed, shape)` reproduce byte-identical and different figures on one sky diverge.
- **CALIBRATION** (the two mis-reads the explorer run disclosed, now fixed + twin-guarded): the
  tangle turn-threshold lowered to `turns>=2` (a genuine 5-star zigzag now reads `tangle`, was
  `bend`); a turn-ANGLE gate on the line split (`line` requires taut AND `totalTurn` calm); and a
  hard silhouette override so a wide/reclining figure resolves to `reclining` (never a line/spear)
  and a tall/upright to `standing`. Banks widened so a long KEEP session rarely repeats in a form.
- **GEN_VERSION** guards the PRNG key: a kept chart stores `(seed, normalized points)` — never the
  rendered strings — and re-derives on re-ink, so a future bank edit can be versioned without
  silently breaking an old chart.

### The page — `index.src.html` → forged `index.html`
- **Spine (Explorer 0):** deterministic seeded starfield (house xmur3+mulberry32) — ~220 faint
  dust stars on two parallax bands (twinkle + slow lissajous drift) + ~22 bright lace-able anchors.
  Parallax is DRAW-TIME ONLY and freezes during a drag so lacing coords hold; reduced-motion
  freezes twinkle+drift. The core verb = ONE continuous held drag: grab the nearest bright star,
  glide within ~24px of an un-laced anchor to SNAP a warm gold line (brass chime one pentatonic
  step higher each snap, a dry nib scratch under it, the line interpolating grey→gold). Once ≥3
  laced the first star pulses + grows a "close here" ring and the rubber-band turns solid-gold when
  the loose end nears it. Close = auto-close on returning to the first star, belt-and-suspenders
  release-on-first-star, OR an explicit **Name it** button (the reduced-dexterity fallback).
- **Catasterize:** the figure inks gold IN PLACE (the "your gesture became a star-figure" flash),
  then composes into a framed PLATE.
- **Reveal composition (Explorer 2's structural win + the CRITICAL FIX):** the reveal + every kept
  plate use a RESERVED-BAND cartouche — the asterism scaled into a reserved figure box, the name +
  designation + two myth lines in reserved bands below, inside an aged-vellum cartouche. NEVER
  centroid-anchored text (the disclosed bug that ran text off-screen / into the rail is gone).
- **Constellarium (Explorer 2):** an always-present two-panel lectern — the sky on the left, the
  kept folio on the right — so KEEP is a legible filing act. RE-SEED scatters; KEEP (enabled only
  after a christening) files the chart then scatters fresh. Each kept plate is re-inked byte-
  identically from its stored seed (the self-test made visible), with ‹back / next› flip nav.
- **Polish/safety:** explicit UTF-8 meta; the mute is a safe inline SVG in its own corner (no ♪
  glyph — the mojibake that hit all three protos is gone). Silent until the first gesture;
  `Gate.unlock()` creates/resumes the AudioContext on ANY first interaction (guarded even if a
  page is button-clicked before any lace). Honors the shared `ws:pref:muted` via `WS`. No URL test
  flags; a reduced-motion path that lands fully finished.

### Assets — all forged IN-HOUSE (the ART FOUNDRY forged the voiced versions; now WIRED IN)
The build shipped on solid placeholders that pinned the exact API; the foundry then forged the
voiced/engraved finals against the `art-specs/` contracts, and a WIRING pass (cycle 407) installed
them, removed the placeholder framing, and re-forged `index.html`. The six installed modules are
the foundry finals.
- **SFX** (`sfx-snap.js` · `sfx-nib.js` · `sfx-settle.js` · `sfx-fwump.js`): the pitch-climbing
  brass snap-chime, the papery nib scratch (+ the ~0.5s catasterize sweep), the settle-swell +
  brass ting, and a fresh-sheet fwump. Each installs `Gate.sfx.<key>({ctx,dest,dur,when,seed,param})`.
- **Visual** (`art-star.js` · `art-cartouche.js`): the antique-atlas star-glint sprite (magnitude
  tiers + cool/warm/gild tints) and the aged-vellum/indigo cartouche frame. Each installs a
  `Gate.art.<key>(ctx,…)` draw fn. `art-specs/preview.sh` renders a candidate in the real reveal.

### Self-test — well-formedness ONLY (claim-free)
`core.test.mjs` (Node twin over the SAME `starlore.mjs`) — **36/36 green:** (A) any laced N-star
figure (gallery + arbitrary N=2..14 on several seeds) → a well-formed name + two-line myth;
(B) a kept chart re-inks byte-identical from its stored seed (sig + name + myth + geometry equal
on a fresh re-derive); (C) distinctness (8/8 gallery shapes unique on one sky; a different sky
re-christens the same shape); (D) CALIBRATION — every gallery form reads correctly, the zigzag is
a tangle, the wide reclining figure is never a line/spear, a taut-calm stroke is a line, a sharply-
kinked one is not. The in-page `selfTest()` mirrors A + B in the console. `forge --check --all`
clean.

### Verification (this cycle)
Served :8823, agent-browser session `sky407` (torn down by PID/name). Self-test `pass:true`
(allWF + allDet, gen v1); `ws:seen:a-sky-you-name` drops on direct visit; 60fps; the reveal plate
composes on-screen at desktop 1280×800 AND mobile 390×844 (no off-screen text, top chrome adapts).
Audio: on a FRESH load the AudioContext is `none` (silent), and a REAL rail-button click flips it
to `running` (`firstGesture:true`) — genuine gesture unlock; all four SFX render non-zero, non-
clipping over an OfflineAudioContext. The interaction spine was proven under GENUINE TRUSTED INPUT
(CDP `Input.dispatchMouseEvent` press-drag-release, not synthetic dispatch): a real held drag laced
5 stars via snap-to-star and auto-closed on returning to the first — closing the real-input vs
synthetic-dispatch verification gap. Front door: PLACES entry appended (manor/studies, order 37,
companion↔the-cartographers-dream), `index.html` re-forged, `door-mirror.cjs` regenerated for 91
POIs — door pill 17/17, legibility 29/29, sky 73/73, audit-seen all 93 pages.

### Verification (wiring pass, cycle 407)
The six foundry finals were installed by the synth; this pass wired them in and re-forged
`index.html` (`forge --check --all` 136/136 current). Served :8841, agent-browser session `sky407w`
(torn down by exact PID/name). `Gate.sfx` = {snap, nib, settle, fwump}, `Gate.art` = {star,
cartouche} all present; in-page self-test `pass:true` (allWF + allDet, gen v1); `ws:seen` drops on
direct visit; 60.1 fps. A GENUINE TRUSTED-INPUT held drag (CDP `Input.dispatchMouseEvent`, after
STRIPPING Explorer 0's synthetic `__sky.drive()` bridge — only an inert read-only inspector remains)
laced 5 stars and auto-closed → catasterized "The Elder Unbowed" with a well-formed two-line myth;
the forged engraved star-glints + aged-vellum cartouche render in the on-screen reveal plate; Keep
filed a byte-identical re-inked plate to the Constellarium and scattered a fresh sky. Audio unlocked
on the genuine press (`firstGesture:true`, `ctx:running`); all six SFX render non-silent + non-
clipping offline (snap C5..E6 peak ~0.24, nib ~0.05–0.14, settle ~0.56, fwump ~0.32 — no clip). The
reduced-motion path was verified LIVE via CDP `Emulation.setEmulatedMedia` (which `set media` could
not apply): the reveal lands fully finished (name + myth fully composed) in the first frame.
