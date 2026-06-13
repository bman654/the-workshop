# 🪞 The Hall of Mirrors — build plan (2026-06-13 `/fun`, Opus 4.8)

*A new front-door optics WING. Brandon's nudge: "Hall of Mirrors — all things pertaining to light:
prisms, mirrors, lenses, fargazers, diffusers." This is Claude's design; the nudge is inspiration.*

## The shape
A new front-door **room (POI)** on the estate map → `hall-of-mirrors/index.html` (a calm gallery room,
Workbench-styled) that HOMES all the light pieces:
- **New pieces** built this wave (below).
- **Caustic** (`optics/`) and **Kaleidoscope** (`kaleidoscope/`) — MOVED here from the Workbench's
  "Toys & benches" group (they're light pieces; the Hall is their truer home).
- A "kin elsewhere" footnote → **Ripple** (`ripple/`, the wave sibling, stays on Workbench). Do NOT
  link Rosette (it's a HIDDEN Undercroft secret — keep it secret).

## House rules for every new piece (give each deputy verbatim)
- ONE self-contained `.html` file in its own top-level dir (e.g. `rainbow/index.html`). Vanilla
  HTML/CSS/JS. **No deps, no network, no build step.** Match the estate's dark-gilt aesthetic
  (see `optics/index.html`, `kaleidoscope/index.html`, `linkage/index.html` for the look: dark
  radial-gradient stage, gilt `--accent:#c9a24a`, serif gradient `h1`, mono sub-labels).
- A built-in **self-test** chip in the topbar (`.selftest`, "checking…" → "N/N ✓" green / red),
  runs on load, also `console.log`s the result. It must **prove the physics EXACT** (assert against
  closed forms to ~1e-9 or the stated tolerance). This is THE workshop promise — non-negotiable.
- Topbar links: `← WORKSHOP` (href `../index.html`) AND `↗ HALL OF MIRRORS`
  (href `../hall-of-mirrors/index.html` — target built by lead at integration; relative link is fine).
- Drop a breadcrumb on load (forward-compat with the unlock metagame):
  `try{var k='ws:seen:<ID>';if(!localStorage.getItem(k))localStorage.setItem(k,String(Date.now()));}catch(e){}`
- 60fps where animated; **clean console** (no errors/warnings). 2× PNG export where it makes sense.
  3 cosmetic skins where it fits (recolour only — geometry identical across skins, assert it).
- **Self-verify in a real browser** before reporting: serve with `python3 -m http.server` from the
  repo root, open the page in an agent-browser session with a **UNIQUE name** (deputies collide on
  the shared default tab — use e.g. `hom-rainbow`), confirm the self-test chip is green, screenshot
  it, confirm 0 console errors. Cache-bust with `?v=N` (http.server sends no cache headers).
- Commit your new file(s) to your worktree branch with a clear message + a `CHANGELOG.md` in the dir.

## The pieces
1. **The Rainbow** — `rainbow/` id `rainbow` 🌈. Atmospheric droplet optics. Trace parallel sunlight at
   all impact parameters b∈[0,1] through a spherical water droplet: refract in (Snell), k internal
   reflections, refract out. Deviation D_k(b)=2(i−r)+k(π−2r) with sin i=b, sin r=sin i/n. The
   **rainbow ray** is the minimum-deviation (Descartes) ray → light piles into a caustic: **primary
   (k=1) at ~42°**, **secondary (k=2) at ~51°**, **Alexander's dark band** between, colours **reversed**
   in the secondary. Wavelength-dependent n(λ) (water: n≈1.331 red→1.344 violet) → red at 42.4°, violet
   40.6° (primary). Show: a magnified single droplet with the ray fan + emergent bows AND the sky view
   (full circular bow at the antisolar point, observer's anti-solar geometry). Supernumeraries (Airy)
   a bonus. **Self-test:** primary min-deviation angle = 42.0°±0.3 (per-λ red>violet ordering correct),
   secondary ≈51°, Alexander's band is the gap, all derived from Snell — assert to <0.2°.
2. **The Spyglass** — `spyglass/` id `spyglass` 🔭 (Brandon's "fargazer"). Telescope optical-diagram
   bench. **Keplerian refractor** (objective + eyepiece, both converging): objective forms a real
   inverted image at its focal plane; eyepiece relays it to a virtual image at infinity; angular
   magnification **M = f_obj/f_eye**; show exit pupil, FOV, the inverted view. **Newtonian reflector**
   (parabolic primary + flat diagonal + eyepiece). Drag focal lengths; M + rays update live. A distant
   "target" scene shown at 1× vs through the scope. **Self-test:** thin-lens trace lands the
   intermediate image exactly at f_obj; M == f_obj/f_eye to 1e-9; a parabolic mirror focuses a parallel
   bundle to a single point (no spherical aberration) to machine precision.
3. **The Spectroscope** — `spectroscope/` id `spectroscope` 🌈|. Disperse light two ways: a **prism**
   (Cauchy dispersion, deviation by Snell at minimum deviation → continuous rainbow) and a **diffraction
   grating** (d·sinθ_m = m·λ → discrete orders fanned by wavelength). Payoff: switch the SOURCE and see
   real **line spectra** at true wavelengths — H Balmer (Hα 656.3, Hβ 486.1, Hγ 434.0, Hδ 410.2 nm via
   Rydberg), Na-D (589.0/589.6), Hg, Ne; plus solar **Fraunhofer absorption** (continuum minus dark
   lines). Render each line in its **true visible colour** via a wavelength→sRGB map. **Self-test:**
   Balmer lines from Rydberg 1/λ=R(1/4−1/n²) to <0.1 nm; grating places order m at asin(mλ/d) exactly;
   prism deviation matches Snell. (Grating ≈ Brandon's "diffuser".)
4. **The Polariser** — `polariser/` id `polariser` 🕶️. Polarization bench: unpolarized → polarizer →
   analyzer; rotate the analyzer and transmitted intensity follows **Malus: I=I₀cos²θ** (live readout +
   E-field vector animation; crossed=dark, parallel=bright). Add a **third polarizer** between a crossed
   pair → light reappears (the 3-polarizer "paradox"). **Self-test:** I==I₀cos²θ to 1e-9 across θ;
   crossed == exactly 0; 3-polarizer middle at 45° gives exactly I₀/8.
5. **The Anamorphic Mirror** — `anamorphosis/` id `anamorphosis` 🪞. Cylindrical-mirror anamorphosis:
   pre-distort a picture on a flat "table" so a vertical **cylindrical mirror** at centre reflects it
   back into the correct undistorted image. Exact polar/reflection warp. Show: source ⇄ warped table-
   image ⇄ a simulated "as seen in the mirror" reconstruction. Built-in line drawings (a word, a face,
   a grid); drag mirror radius / viewing height. **Self-test:** forward∘inverse warp == identity to
   machine precision; a known straight line maps to its predicted arc; reconstruction(warp(src))==src.
6. **Iridescence** — `iridescence/` id `iridescence` 🫧 (STRETCH / wave 2 only if time). Thin-film
   interference colour: **Newton's rings** (lens on flat → dark-ring radius r_m=√(mλR)), a **soap film**
   (colour vs thickness, 2nt cosθ=mλ, black at t→0), an **oil slick**. True perceived colour by
   integrating the visible-spectrum interference over CIE colour-matching functions (not a fake
   gradient). **Self-test:** Newton dark-ring radii ∝ √(mRλ) exact; t→0 is dark; the colour at a given
   thickness matches the integrated-spectrum computation.

## Orchestration (proven pattern)
Worktree-isolated background deputies, each builds ONE piece + self-verifies in a UNIQUE-named
agent-browser session + commits to its branch + reports a SHORT summary (NOT the full file — guard
lead context). Lead integrates each new dir to `main` via `git checkout <branch> -- <dir>` + commit
(no conflicts: every piece is a disjoint new dir). Wave 1 = Rainbow, Spyglass, Spectroscope. Wave 2 =
Polariser, Anamorphosis, (+ Iridescence if smooth).

## Lead's final integration (after pieces land)
1. Build `hall-of-mirrors/index.html` (Workbench-styled gallery; cards for the new pieces + Caustic +
   Kaleidoscope; "kin elsewhere → Ripple" footnote). `← workshop` back-link.
2. Front-door POI: append a `PLACES` entry in `index.src.html` (coordinate + footprint kind) →
   `node tools/forge/forge.mjs index.src.html`; verify `node tools/forge/forge.mjs --check --all`.
   Browser-verify the map (cache-bust ?v=N): label collisions still 0, sky self-test green.
3. Edit `workbench/index.html`: remove Caustic + Kaleidoscope cards from "Toys & benches" (now homed
   in the Hall). Leave Ripple, Singing Plate, Loom, Harmonograph, Letterer, Galton, Straightedge.
4. README.md: add a Hall of Mirrors section. NOTES.md: replace current-state block; add hidden-
   inventory note (unchanged — these are PUBLIC). worklog/2026-06.md + INDEX.md entries.
5. `git push origin main`. Verify live (https://bman654.github.io/the-workshop/hall-of-mirrors/).

## Front-door POI specifics (worked out 2026-06-13 — ready to integrate)
- `index.src.html` viewBox is **1440×900**. Existing POIs leave the **west grounds open**: Observatory
  tower (x300 y238 r76, light/sky room) upper-left, Glasshouse (x266 y560) lower-left — a vertical gap
  at ~x130–260, y360–500. **Place the Hall there** (between two light rooms — thematically apt).
  Proposed entry (tune x/y after a browser look):
  ```js
  { id:"hall-of-mirrors", room:"The Hall of Mirrors", piece:"The Hall of Mirrors", glyph:"🪞",
    accent:"#8ecbff", href:"hall-of-mirrors/index.html", tag:"optics wing", companion:null,
    footprint:"hall", x:120, y:430, w:150, h:78, prefer:"left",
    blurb:"A luminous wing for all things light — how it bends and reflects, splits into colour, and what it is up close. A telescope, a spectroscope, a rainbow from one raindrop, an anamorphic mirror, a polariser, and the optical light-bench, each self-proved." },
  ```
  Note `id:"hall-of-mirrors"` drops `ws:seen:hall-of-mirrors` on click (harmless, forward-compat).
- **NEW footprint drawer `drawHall`** (register in the `DRAW` map at ~line 771): a long gallery —
  slab + a vaulted centre spine + a colonnade of round-headed **arched windows along the top wall
  facing arched MIRRORS along the bottom wall** (the mirror arches drawn with `.fp-lit` so they catch
  the light), + a west-end doorway arc. Model it on `drawArcade` (line 740) but mirror the arcade top
  AND bottom. ~15 lines. **Verify visually after forging** (it's a new shape).
- Forge: `node tools/forge/forge.mjs index.src.html` then `node tools/forge/forge.mjs --check --all`.
  Browser-verify the map (cache-bust `?v=N`): the Hall footprint reads as a gallery, its label has 0
  collisions with the other POIs, the Survey-of-Heaven sky self-test still green. (Adding a POI doesn't
  touch the sky CATALOG — the Hall is just a labelled room, not a new Survey wing.)

## ✅ CORE WING SHIPPED + LIVE (2026-06-13) — commit `7e94564`, pushed; all 7 URLs return 200.
The 6 core pieces + Caustic + Kaleidoscope are integrated, the front-door POI is placed, docs done,
worktrees retired. **BONUS ROUND in flight:** 2 more pieces to round the Hall to 10 benches — **The
Halo** ☀️ (`halo/`, deputy `ae2ea9c1`, ice-crystal optics: 22°/46° halos, sundogs, CZA — Rainbow's
twin) and **The Camera Obscura** 📷 (`camera-obscura/`, deputy `ade68bdd`, pinhole imaging + optimal
d=√(2.44λv)). Integrate each via `git -C $ROOT checkout worktree-agent-<id> -- <dir>` + commit, then:
add a Hall card for each (Halo → "Colour & spectrum" by the Rainbow; Camera Obscura → "Rays, lenses &
mirrors"), light-touch README/NOTES/worklog, push, retire worktrees. (No front-door change needed —
the Hall room already exists.)

## 🪞 11th bench in flight — The Mirror Maze (deputy `accfd73f`)
Core 10-bench wing is shipped+live (commit `3cdd5c7`). Building an 11th: **The Mirror Maze**
(`mirror-maze/`) — a playable, provably-solvable **laser-reflection puzzle** (place mirrors to route
the beam to all targets; generated from a reference route so a solution always exists; exact beam
physics + loop-safe tracer; self-test over ≥200 boards). It adds a PLAY dimension to the study-benches
and is the most literal hall-of-mirrors piece. Integrate via `git -C $ROOT checkout
worktree-agent-accfd73f… -- mirror-maze` + commit, add a Hall card (its own group, e.g. "Play" — light
you can steer), update README/NOTES/worklog counts (10→11), push, retire worktree.

## ⚠️ Integration TODO not to forget
- The `hall-of-mirrors/index.html` was written with 5 new-piece cards (Rainbow, Spyglass, Spectroscope,
  Anamorphosis, Polariser) + Caustic + Kaleidoscope. **Iridescence was promoted from stretch AFTER** —
  add its card to the "Colour & spectrum" group when it lands (🫧, href `../iridescence/index.html`).
- 6 deputies in flight (agent IDs): rainbow `ac61a96f`, spyglass `ae47f9ea`, spectroscope `a5e270e6`,
  polariser `a9d701a0`, anamorphosis `a20196646`, iridescence `a7f604dc4`. Integrate each via
  `git checkout worktree-agent-<id> -- <dir>` + commit. Heartbeat cron `7db60892` (every 5 min).

## Resume hint
If interrupted: `git worktree list` shows in-flight deputies; each branch holds one finished/partial
piece. Integrate finished dirs, relaunch unfinished. The Hall index + map POI are the LAST steps.
