# The Gate — Known Issues

A lightweight issue log for the gate. Until Phase D there is no app to "QA" in the
behavioral sense (the build so far is static art, verified per-asset at render time by
the foundry's judge/synth pass + a `forge --check --all` gate). This file captures the
issues + risks worth *remembering* across sessions. Severity: **P1** breaks/looks-wrong ·
**P2** real but bounded · **P3** polish/nice-to-have. A full exploratory QA pass (the
`dogfood` skill) belongs to Phase D, when interaction creates behavioral bugs.

---

## Open

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
