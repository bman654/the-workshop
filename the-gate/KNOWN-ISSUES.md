# The Gate — Known Issues

A lightweight issue log for the gate. Until Phase D there is no app to "QA" in the
behavioral sense (the build so far is static art, verified per-asset at render time by
the foundry's judge/synth pass + a `forge --check --all` gate). This file captures the
issues + risks worth *remembering* across sessions. Severity: **P1** breaks/looks-wrong ·
**P2** real but bounded · **P3** polish/nice-to-have. A full exploratory QA pass (the
`dogfood` skill) belongs to Phase D, when interaction creates behavioral bugs.

---

## Open

### AUDIO — no sound below spec
All nine procedural sounds (`Gate.sfx.rain/wind/thunderclap/thunderroll/gears/creak/windchimes/
birdsong/logotune`) met their audio-lens TARGETs on verification (self-test 12/12). The conductor
(`audio.js`) wires them in and the mute gate is proven (master→0). **No sound is below spec.**

### P3 — live AudioContext stays `suspended` under headless e2e (environment, not a defect)
In headless Chrome a synthetic `dispatchEvent('click')` is NOT a trusted user gesture, so
`ctx.resume()` does not flip the context to `running` and its scheduled gain ramps don't advance
(`currentTime` stays 0; `gain.value` reports the last *set* value, not the scheduled future one).
This is a known browser-automation limitation. The mute-gate *math* (master→0 muted, →0.9 unmuted)
was therefore proven by rendering the exact ramp through an `OfflineAudioContext` (where the clock
advances) and by reading the live master gain immediately after a clean unlock (0.9). A real visitor's
first click is a trusted gesture and resumes the context normally. No code change required.

### P3 — `?smil=` pauses ALL SMIL globally (by design, noted)
`svg.pauseAnimations()` is document-wide, so `?smil=` freezes every SMIL animation, not just the
targeted asset. Correct for single-rep render/judge today; revisit only if multiple independent
animations must be sampled at different phases at once.

### P3 — reduced-motion freeze is logic-verified, not emulation-tested
The reduced-motion fix is gated on `matchMedia('(prefers-reduced-motion: reduce)')` and reuses
the proven `pauseAnimations()` path, but it wasn't screenshot-confirmed under emulated reduced
motion. Verify on a machine with "Reduce motion" enabled (the ripple should sit still). The same
applies to the Phase-D motion (foliage sway §5.9, weather-fx clouds/rain/lightning §5.10): all share
the one `Gate.sequence.prefersReducedMotion()` gate and are logic-verified, not emulation-tested —
expected under reduce: clouds shown but static, no rain, no lightning flashing, crowns upright.

---

## Accepted / won't-fix

### Glyph-Stand fallback uses a system emoji (platform-dependent) — ACCEPTED
The Glyph Stand renders the room's `glyph` (e.g. 🗺️) as SVG `<text>`, so it uses the OS
color-emoji font (Apple Color Emoji on macOS; Segoe/Noto elsewhere) and varies per platform.
**Won't fix:** the glyph is the *fallback* for rooms that don't yet have a bespoke rep — backfilling
hand-drawn SVG glyphs would create a SECOND backlog mirroring the first (build room-reps). As rooms
earn bespoke reps, the emoji fallback naturally retires. The four bespoke reps are SVG and consistent.

---

## Resolved

### P1 — Clicking the gnomon opened the gate instead of changing time *(fixed 2026-06-23, owner playtest)*
The `#gate-hit` div (`position:absolute; inset:0`) sat ABOVE the scene SVG with default pointer-events,
so it swallowed every click — the gnomon's own SVG handler never fired, and `onGateClick`'s
"ignore the gnomon" guard could never match (its event target was always `#gate-hit`, never an SVG
element). Fix: `#gate-hit { pointer-events:none }` so clicks fall through to the scene SVG, whose
`onGateClick` (with the correct `gnomon-target`/`.chip` guard) owns the open trigger while the gnomon's
handler advances time + `stopPropagation()`s. Cursor hint moved to `#scene-host`. Verified with real
coordinate clicks (agent-browser): gnomon click advances day→dusk→night with the gate staying closed;
clicking the gate body still runs the open sequence. `the-gate.src.html` CSS.

### P1 — Gears + plaque left floating when the gate opens *(fixed 2026-06-23, owner playtest)*
The gear-train, gnomon, and plaque are mounted at the seam but were children of the assembly (not a
leaf), so when the leaves foreshortened open they hung floating in the gap. Fix: a `gate-seam` follow
group now holds gears + gnomon + plaque and rides the RIGHT leaf — `swing()` gives it the SAME
`scaleX/skewY` foreshorten, with a `transform-box:view-box` origin pinned to the right hinge so the
pivot matches the leaf regardless of bbox. The gears keep their own inner `rotate` (spin), so spin and
swing compose cleanly. Verified via `?scene=open`: ornaments compress into the right door, center opens
to reveal the manor; closed state unchanged. `scene-gate.js drawGate` + `swing`.

### P2 — Ripple Tank had front + back walls but no visible LEFT/RIGHT walls *(fixed 2026-06-23)*
The water tray's left/right water edges met the grass directly, so the water looked like it would
spill off the open sides. `drawRepRipple` now draws brass-edged SIDE RIM strips running from the back
rim to the front lip along each water edge — the visible tops of the left/right walls — so the tray
reads as a fully-enclosed vessel. Drawn back-to-front so the front lip occludes their near ends at the
corners; the outer edge tapers in perspective (∓4 back-rim overhang → box edge at the front). Verified
day + night: the basin reads as enclosed in both, brass edges catching the light. `scene.js drawRepRipple`.

### P1 — Scene scaled with "cover", clipped the sides on tall/narrow viewports *(fixed 2026-06-23)*
`scene.js` now sets `preserveAspectRatio: 'xMidYMid meet'` (contain): the whole 16:9 scene stays
visible on any viewport, never clipped. The letterbox bars are made SEAMLESS by `S.fitStageBackdrop()`
— it paints `#stage` with a backdrop that extends the scene's own sky/ground PAST the scene rect
(solid sky.top above the scene, the sky gradient down to the grass line, solid grass below), anchored
to the actual letterbox rectangle and recomputed on resize. Colors are the band-resolved `var()` dash
aliases (`--sky-top-ref`/`--sky-horizon-ref`/`--grass-ref`) the colormap already writes on `#stage`, so
a recolor reflows the bars for free. Verified at 1:2 portrait, 2.67:1 ultrawide, and 16:9 (full-bleed,
unchanged) — the bars are indistinguishable from the scene in every band. `scene.js` · `the-gate.src.html` boot.

### P3 — Ripple loop reads well at day/dusk/night *(confirmed 2026-06-23, owner)*
Owner viewed all three bands; the loop reads cleanly in each (emissive shimmer recedes by day as
designed, crest rings still read).

### P1 — Ripple SMIL ignored prefers-reduced-motion *(fixed 2026-06-23, `a784a40`)*
The ambient ripple loop ran unconditionally, violating SPEC §2.5.5. The boot now freezes ambient
SMIL at its first frame when reduced-motion is set (and no `?smil` pin), via the single source of
truth `Gate.sequence.prefersReducedMotion()`. `the-gate.src.html` boot · `sequence.js`.

### P1 — Front door fatal render crash *(fixed pre-gate, `c8b5db7`)*
Missing `drawCrate` footprint crashed the front-door render. Fixed out-of-band; logged for history.
