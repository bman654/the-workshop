# The Gate — Known Issues

A lightweight issue log for the gate. Until Phase D there is no app to "QA" in the
behavioral sense (the build so far is static art, verified per-asset at render time by
the foundry's judge/synth pass + a `forge --check --all` gate). This file captures the
issues + risks worth *remembering* across sessions. Severity: **P1** breaks/looks-wrong ·
**P2** real but bounded · **P3** polish/nice-to-have. A full exploratory QA pass (the
`dogfood` skill) belongs to Phase D, when interaction creates behavioral bugs.

---

## Open

### P2 — Glyph-Stand fallback glyph is a system emoji (platform-dependent)
The Glyph Stand renders the room's `glyph` (e.g. The Map Room's 🗺️) as an SVG `<text>`
node, so it falls back to the OS color-emoji font (Apple Color Emoji on macOS; Segoe/Noto
elsewhere) — it looks different per platform and won't match the hand-drawn estate idiom.
The four **bespoke** reps (Cairn, Cavern, Ripple, Music Room) are SVG and render identically
everywhere; only the fallback glyph varies. *Fix if consistency matters:* swap the emoji
`<text>` for a small hand-drawn SVG icon per glyph (a mini icon foundry). Deliberate scope
choice for now — the fallback is meant to be the cheap universal path.
`scene.js drawGlyphStand` · `rooms.js` glyph from the GATE-ROOMS slab.

### P3 — Ripple animation visually confirmed at NIGHT only
The emanating SMIL was eyeballed at `t=night`. By design the emissive shimmer (`rep.glow1`)
recedes by day, but the crest rings (`rep.swatch2`) should still read. Confirm the loop
reads cleanly at `t=day` / `t=dusk` (render `?room=ripple&t=day&smil=0|1.2|2.4`).

### P3 — `?smil=` pauses ALL SMIL globally (by design, noted)
`svg.pauseAnimations()` is document-wide, so `?smil=` freezes every SMIL animation in the
scene, not just the targeted asset. Correct for single-rep render/judge today; revisit only
if multiple independent animations need to be sampled at different phases simultaneously.

### P3 — reduced-motion freeze is logic-verified, not emulation-tested
The fix below is gated on `matchMedia('(prefers-reduced-motion: reduce)')` and reuses the
proven `pauseAnimations()` path, but I could not emulate the OS reduced-motion setting
headlessly to screenshot-confirm it. Verify on a machine with "Reduce motion" enabled (the
ripple should sit still) before Phase D ships.

---

## Resolved

### P1 — Ripple SMIL ignored prefers-reduced-motion *(fixed 2026-06-23)*
The new ambient ripple loop ran unconditionally, violating SPEC §2.5.5 (animations MUST
degrade under reduced-motion). Fixed: the boot now freezes ambient SMIL at its first frame
when `prefers-reduced-motion: reduce` is set (and no explicit `?smil` pin). One source of
truth via `Gate.sequence.prefersReducedMotion()`. `the-gate.src.html` boot · `sequence.js`.

### P1 — Front door fatal render crash *(fixed pre-gate, `c8b5db7`)*
Missing `drawCrate` footprint crashed the front-door render. Fixed out-of-band before the
gate work. (Logged here for history; not a gate-branch issue.)
