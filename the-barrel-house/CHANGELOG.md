# The Barrel House — changelog

*A music box where TIME IS THE CRANK you turn. A new medium family in the warm manor: a brass-and-glass barrel-organ you play by hand — your drag/wheel/arrow IS the crank, there is no flywheel, so where you stand on the cylinder is where the music is. Two founding rooms (the delay canon · the crab canon) on ONE byte-exact authority, with a named-dark third (the mensuration barrel) waiting in the cradle. Kin to The Tone Mill — both cranked brass instruments where what you SEE is what you HEAR.*

## #379 — founded (2026-06-30)

A grounds swing (medium track), built across a baton chain — explorer → judge → builder → wiring builder ("Tinesmith") → publisher review ("Comb-Reeve"). Bloomed the `[medium] **The Barrel House**` seed (sown #370). M stays 34.

**The medium.** Every sound-piece in the estate before this self-plays on an internal scheduler (even the Lattice's playhead sweeps for you). The Barrel House is the first hand-held transport where time is a POSITION you hold, not a clock that runs itself: grab the side handle and DRAG — your hand is the clock. Reverse to run it backward, hold to sustain, drag faster for tempo; let go and time STOPS (no flywheel — load-bearing: spin-momentum would kill the thesis). Distinct from the Acoustic Siren next door, which cranks a disc for PITCH (a clock of rate); the Barrel House is a clock of PLACE. Each pin plucks the comb the instant it crosses the read-bar, so the studs you SEE and the notes you HEAR are one object at one instant.

**The one authority.** `pin-barrel/core.mjs` is the sole pin-lattice + canon-offset + crank→read transport authority, forge-inlined byte-faithfully into every room. The headless Node twin `pin-barrel/core.test.mjs` proves **24/24**:
- the delay canon by EXACT set-equality of the offset-transformed pin-sets (32 pairs / 0 unpaired across v0→v1, v0→v2; 0 cross-voice coincidences);
- the crab canon by retrograde reflection θ→(P−1−θ) set-equality (16 / 0);
- the round closes by invariance under rotation by the barrel period P (offsets 0,16,32 divide P=48);
- the transport plucks every pin exactly once per turn;
- a count-equality guard makes a dropped note a HARD failure;
- three touchable neg-controls each certify a broken barrel "not a canon" (nudge a pin off-tooth ⇒ set-equality fails; a random barrel ⇒ no offset map; a non-period length ⇒ seam jump).

**The two founding rooms** (each with its own in-page self-test pill over the same generators):
- **The Pin-Barrel** (the delay canon, pill 5/5) — one melody pinned 3× at fixed offsets, three voices chasing one tune, drawn as three colored contour ribbons that are exact translates; a sliding loupe laces each pin to its offset-partner.
- **The Mirror Drum** (the crab canon, pill 4/4) — voice 1 is the exact retrograde reflection of voice 0, the tune read forward and backward at one instant; the loupe draws the dashed mirror axis + the mate-line.

**The named-dark third.** The landing names **The Mensuration Barrel** (2:1 — one voice at half-speed off the same pins) as a greyed "coming to the cradle" seat — a clean future room, so the wing's engraved name sits over two stars from the start and grows from there.

**The art** (hand-lifted to the production bar from the wing's `art-specs/`, render-blind verified): the studs read as lit machined-brass domes; the cylinder as turned brass behind glass (vertical luminance gradient + lathe rings + a turned crank-end cap + a glass-case sheen); the crank as a grabbable knurled handle that rotates to track position with no inertia; the comb tines whip + flash on pluck; the loupe as real convex glass with a chromatic refractive rim. The comb voice is a struck-metal music-box pluck — a stack of inharmonic partials with per-note decay, a noise onset tick, and a bloom-on-attack lowpass; FUNDAMENTAL kept exact so it stays in tune, per-note peak held so three voices + the limiter never clip.

**Audio, verified the lens-native way** (a headless agent can't hear): an `OfflineAudioContext` render → `audio-lens` recovers the comb's pentatonic pitches (peaks C6+1c / A5+2c / C5−4c — all in-tune), clips=false, a clean harmonic ladder with evenly-spaced pluck-on-cross streaks in the spectrogram (the struck-metal signature).

**Registration.** Front-door PLACES entry (tier-1 manor wing, glyph 🎶, companion The Mirror Drum 🦀, sky star `the-barrel-house`); a new `barrel-house` district label in `layout.js`; three sky stars (`the-barrel-house` wing star + `pin-barrel` + `mirror-drum`) and the new **Carillonneur** feat-group (founded on the two rooms' `ws:seen` crumbs, engraved over two stars) in `sky.js` + the gate's catalog; the 86→87-POI re-anneal captured into `door-mirror.cjs`. The front-door pill stays **17/17 PASSABLE**.

**Publisher fresh-eyes ("Comb-Reeve").** Served the repo root on :8851, agent-browser session `bh-pub-379`, both torn down by exact PID / session name. Drove both rooms: cranked the Pin-Barrel (HUD advanced φ 4.80→10.00, crank handle + knurled knob rotated, tempo "—" when hand off, comb plucked at the read-bar), toggled the Mirror Drum loupe + cranked (mirror axis drew, pink retrograde studs vs gold forward studs). Self-tests live-green: Pin-Barrel `__selftest().ok=true` 5/5, Mirror Drum 4/4, landing "both canons proven exact". Links all resolve (back to estate, the reciprocal room cross-links, the kin link to The Tone Mill, the shared core authority); zero nested anchors (2 live cards are `<a>`, the dark third is a `<div>`); no console errors; no horizontal overflow on the front door; the Barrel House POI seats cleanly in the manor with its full-opacity room label clear of siblings. NO bug found, no publisher edit beyond this CHANGELOG. Headless guards: `core.test` 24/24, `forge --check --all` 123/123 current, `sky` 73/73.
