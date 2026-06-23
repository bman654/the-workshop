# The Gate — Changelog

## Phase A · scaffold + greybox  (2026-06)

The machinery, end-to-end; rough-but-correctly-composed scene; the lighting system
built for real. Final art comes later via the asset foundry (Phase C). Built in the
`the-gate` worktree, add-only under `the-gate/`.

### Files created
- `the-gate.src.html` — forge template: house tokens (verbatim), the stage (SVG
  host + FX canvas + UI chrome + overlay + welcome card), GATE-ROOMS slab sentinels,
  the forge:include block (ws/sky/hours + gate modules), and the THIN boot
  dispatcher (calls `Gate.scene.*`, `Gate.colormap.*`, etc. — asset agents never
  edit this file).
- `the-gate.html` — forged, self-contained output.
- `colormap.js` — the PALETTE-SWAP lighting model: 3 hand-authored palettes
  (DAY/DUSK/NIGHT), a palette-immune emissive GLOW set, the brightness ladder
  `B = bandBase × weatherFactor` (flash→1.0), per-role luminance scaling in HSL,
  and a JS-driven crossfade (we do NOT rely on CSS custom-prop transitions).
- `timeofday.js` — local-clock → day/dusk/night via `Hours.solarAltitudeDeg`
  (≥6 day / −6..6 dusk / <−6 night) + a manual override state machine (gnomon tap
  cycles day→dusk→night).
- `weather.js` — seeded-random weather (mulberry32, seedable via `?seed=`), NO
  network / NO geolocation; the brass tri-toggle flips Clear/Cloudy/Storm.
- `gnomon.js` — binds the brass gnomon tap → `timeofday.advance()` (keyboard-
  accessible); a `shadowFor()` hook for the Phase-D real cast shadow.
- `asterism.js` — a neutral PLACEHOLDER labeled brass asterism (NOT the eagle —
  earned-only). Clear TODO for the Phase-D Survey-of-Heaven runtime pick.
- `rooms.js` — reads the GATE-ROOMS slab; Phase A only the Cairn rep. TODOs for the
  3 essence-survey reps + the Glyph Stand.
- `scene.js` — the SVG layer skeleton (sky → sky-objects → clouds → far-scenery →
  midground → furniture → gate), the sky gradient + starfield, moon/sun, asterism,
  grounds/road/lamps, trees, the Cairn rep, the undercroft hatch (live predicate),
  and the colormap plumbing (dotted vars + dash `-ref` aliases for SVG attrs).
- `scene-buildings.js` — rough FRONT-ELEVATIONS (not the estate's top-down helpers):
  observatory-on-a-hill (L), manor + clock tower + lit windows (C), greenhouse (R).
- `scene-gate.js` — the brass double gate: two leaves (hinge-pivoted for the swing),
  vertical bars + finials, piers, a clockwork gear cluster, the gnomon, the engraved
  plaque ("The Orrery Estate" / "click to enter"). Exposes `swing()` + `spinGears()`.
- `sequence.js` — the click-through state machine (black → fade-in 2s → idle → click
  → gears 2.5s → swing 2.5s → fade-black 2s → welcome 3s → navigate to ../index.html)
  + the DEV URL OVERRIDE (`?dev`/`?scene=idle|open`, `?t=`, `?moon=`, `?wx=`,
  `?seed=`) + prefers-reduced-motion collapse (still navigates) + `WS.seen('the-gate')`.
- `audio.js` — STUBBED engine (inert no-ops) with the REAL mute chip wired to the
  shared estate flag (`WS.muted()` / `WS.setMuted()` / `WS.onMuteChange()`).
- `reclaim.mjs` — re-pins the GATE-ROOMS slab from the live front-door PLACES
  (imports `loadPlaces` from card-catalog; projects {id,room,glyph,accent,district,
  href,locked}; skips locked; idempotent; REFUSES on a short parse). Enrolls in
  `collate.sh` with ZERO edits (repo-root child).
- `SPEC.md` — the Phase-B-locked asset spec skeleton.

### Systems real this pass
- Lighting model (palette-swap + emissive + brightness ladder + JS crossfade).
- Time-of-day classifier + gnomon tap-to-cycle.
- Seeded weather + tri-toggle (offline).
- Dev URL override (boots straight to idle, pins band/moon/weather/seed).
- The click-through sequence + reduced-motion path.
- Mute chip ↔ shared WS flag.
- One perpetual rAF loop (dt-clamped, hidden-gated, DPR-capped, fps gauge).

### Deferred (later phases)
- `sky-core.mjs` real moon math + J2000 Node twin (PLAN §6) — owned by another agent.
- `weather-fx.js` canvas (rain/lightning/clouds/birds/sway).
- Audio engine sources (gears/creak/ambient).
- Earned asterism runtime pick; 3 essence-survey room-reps + the Glyph Stand.
- Final art via the asset foundry (Phase C), against the Phase-B-locked spec.
