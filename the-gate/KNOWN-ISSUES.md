# The Gate — Known Issues

A lightweight issue log for the gate. Until Phase D there is no app to "QA" in the
behavioral sense (the build so far is static art, verified per-asset at render time by
the foundry's judge/synth pass + a `forge --check --all` gate). This file captures the
issues + risks worth *remembering* across sessions. Severity: **P1** breaks/looks-wrong ·
**P2** real but bounded · **P3** polish/nice-to-have. A full exploratory QA pass (the
`dogfood` skill) belongs to Phase D, when interaction creates behavioral bugs.

---

## Open

### P1 — Scene scales with "cover", clips the sides on tall/narrow viewports
`scene.js:61` sets `preserveAspectRatio: 'xMidYMid slice'` (cover: fills the viewport,
overflow clipped). On a ~1:2 portrait window the FIRST open shows only the gate — the manor,
observatory, greenhouse, lamps, and the room-rep slot are all clipped off-screen. **Want:
"contain"** — honor the scene's 16:9 aspect, never clip it off-screen. Fix is `slice` → `meet`.
*Consideration:* `meet` letterboxes on off-aspect viewports, exposing the page `--bg` (#080a0f)
as bars — fine against the dark sky at night, but check day (light sky vs near-black bars);
may want to extend the sky/ground fill or style the bars rather than leave raw `--bg`.
**This is the priority pickup for the next work block.**

### P2 — Ripple Tank has front + back walls but no visible LEFT/RIGHT walls
The water tray reads as containing water on the near/far faces but the sides are open — it's a
mystery why the water doesn't run out onto the grass. Add slim brass-edged left/right end walls
(or end caps) so the tray reads as a fully-enclosed vessel. `scene.js drawRepRipple`.

### P3 — `?smil=` pauses ALL SMIL globally (by design, noted)
`svg.pauseAnimations()` is document-wide, so `?smil=` freezes every SMIL animation, not just the
targeted asset. Correct for single-rep render/judge today; revisit only if multiple independent
animations must be sampled at different phases at once.

### P3 — reduced-motion freeze is logic-verified, not emulation-tested
The reduced-motion fix is gated on `matchMedia('(prefers-reduced-motion: reduce)')` and reuses
the proven `pauseAnimations()` path, but it wasn't screenshot-confirmed under emulated reduced
motion. Verify on a machine with "Reduce motion" enabled (the ripple should sit still).

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

### P3 — Ripple loop reads well at day/dusk/night *(confirmed 2026-06-23, owner)*
Owner viewed all three bands; the loop reads cleanly in each (emissive shimmer recedes by day as
designed, crest rings still read).

### P1 — Ripple SMIL ignored prefers-reduced-motion *(fixed 2026-06-23, `a784a40`)*
The ambient ripple loop ran unconditionally, violating SPEC §2.5.5. The boot now freezes ambient
SMIL at its first frame when reduced-motion is set (and no `?smil` pin), via the single source of
truth `Gate.sequence.prefersReducedMotion()`. `the-gate.src.html` boot · `sequence.js`.

### P1 — Front door fatal render crash *(fixed pre-gate, `c8b5db7`)*
Missing `drawCrate` footprint crashed the front-door render. Fixed out-of-band; logged for history.
