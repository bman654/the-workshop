# 🌊 THE BIG CREATIVE WAVE — plan & ledger (2026-06-13, Opus 4.8, ultracode)

> **✅ ALL FIVE SHIPPED & pushed (HEAD `dbaf864`). This is now a historical process doc** — the canonical
> record is `worklog/2026-06.md` (the verbose block) + NOTES.md (current-state + project-status table). Kept
> for the runner-up specs (Patience engine, logic-puzzle generator, "The Hours") + the Gnomon/Bulwark specs,
> which a future agent can lift to build them.

*Durable copy of the curated build plan (from ideation workflow `wf_046852b2-a3c`), so the overnight
autonomous run survives a `/tmp` eviction or context reset. NOTES.md current-state points here.
Source of the picks: 11 idea scouts + 1 curator, all grounded against the repo (greps confirmed every
proposed `tools/` dir is absent and nothing duplicates a hidden piece).*

## The picks
- **ENGINE → The Adversary ♟️** — a reusable combinatorial-game-theory engine (game-defs as data → play a
  provably-perfect opponent; reveal each move's WIN/LOSS/DRAW verdict + distance; watch perfect self-play).
  Lantern-shaped; Workbench (a NEW "Games of Perfect Information" group); **no map edit**.
- **METAGAME → The Survey of Heaven ✶** — the front door's dark ground fills with stars as you wander;
  each visited room kindles a star, the six companion-wings form asterisms that complete with engraved
  names; all-complete capstone. Reads the `ws:seen:<id>` every page already drops → **touches only
  `index.src.html`**. Cosmetic-only flags (`ws:flag:sky-*`, `ws:flag:firmament-survey`). Monotone,
  deterministic. Visible surface IS the map. (Runner-up was "The Hours" — a real-time living estate;
  NOTE both wanted `tools/sky/sky.js`, reserved for Survey; if Hours ever built, use `tools/hours/hours.js`.)
- **POI → The Singing Plate 🎛️** — a Chladni bench that numerically SOLVES the plate/membrane eigenproblem
  (Lanczos) and proves eigenfreqs vs closed forms; sand flees to nodal lines. Toys & benches; no map edit.
  (Distinct from the WATCH-ONLY `strange-garden/pieces/chladni.html` — give it a distinguishing name/blurb.)
- **POI → The Gnomon 🌅** — an operable sundial (horizontal/equatorial/vertical-south); real solar geometry
  reusing the Astrolabe's frozen solar fns; equation-of-time + the noon analemma figure-8. Instruments; no map edit.
- **POI → Bulwark 🛡️** — a neon Defender/Scramble side-scroller (the last classic-arcade gap). Arcade rack.
  **Touches the map** (Arcade tag 18→19) — serialize that bump after Survey lands.

## Build order & contention
`index.src.html` (front door) is the ONLY hot file. Exactly TWO picks touch it: **Survey** (map surface)
and **Bulwark** (tag bump). Serialize those. Everything else touches only NEW files. To kill the
`workbench/index.html` + `README.md` races, **build deputies create only their own new files; I (the lead)
add all Workbench cards, README entries, and the map tag-bump myself** in consolidating commits.

Recommended order: (1) Adversary ‖ (2) Singing Plate ‖ (3) Gnomon ‖ (4) Survey-infra — all parallel-safe;
(5) Survey map-surface (sole map committer); (6) Bulwark cabinet ‖, then its tag-bump serialized after (5).

## Progress (live ledger)
- ✅ **The Survey of Heaven** — SHIPPED & pushed (commit `956b92f`; sky 22/22; DOM-truth label overlaps still 0).
- ✅ **The Adversary** — SHIPPED & pushed (commit `5e260d2`; 38/38 Node, 30/30 in-page; 5 games proven; m,n,k capped to (3,4,3)).
- ⏳ **The Singing Plate** — agent `a867383ed94ecebbb`, port 8142, session `plate-verify` (committed, finishing browser verify).
- ⏳ **The Gnomon** — agent `a70f827fc365179c2`, port 8143, session `gnomon-verify` (building; core in `tools/dial/dial.js`).
- ⏳ **Bulwark** — agent `a854fd0d4400941eb`, port 8145, session `bulwark-verify` (building).

### ⏭ STILL OWED (lead consolidation — do these after the pieces land):
1. **Workbench cards** (edit `workbench/index.html`): **The Adversary** ♟️ in a NEW "Games of Perfect Information" group; **The Singing Plate** 🎛️ in Toys & benches; **The Gnomon** 🌅 in Instruments. (Survey + Bulwark are not Workbench pieces.)
2. **README "Also on the workbench"/intro entries**: The Adversary, The Survey of Heaven (mention on the map), The Singing Plate, The Gnomon, Bulwark.
3. **Bulwark Arcade tag bump** in `index.src.html` PLACES: `tag:"18 games"`→`"19 games"` + add "Bulwark" to the Arcade blurb, then re-forge. (Sole map edit left; do AFTER Bulwark lands.)
4. **NOTES current-state + project-status table + worklog verbose block + INDEX** for the whole wave; mark tasks #3/#4 complete.
5. Integration uses `git -C <root> checkout <branch> -- <paths>` (NOT plain checkout — CWD can drift to a completed worktree on its notification; always use `git -C` + absolute paths + verify `diff --cached --stat`).

## Integration protocol (per piece)
Review the deputy's screenshots → integrate to `main` via `git checkout <branch> -- <new files>` + a fresh
commit (the reliable path for forge-generated files) → push → retire the worktree (`git worktree remove
--force … && git branch -D …`) → checkpoint NOTES/worklog. Keep ≤1 committer on `main`. Then add the
piece's Workbench card + README entry (lead does this, batched). Survey's `index.src.html` integrates as a
whole-file checkout; Bulwark's tag-bump I apply by hand AFTER Survey is on main.

## Gnomon — full build-ready spec (for the not-yet-launched deputy)
FILES: `sundial/index.src.html` → forge → `index.html` (single file, <~1500 lines); `sundial/SUNDIAL.SPEC.md`;
`sundial/CHANGELOG.md`; `sundial/sundial.test.cjs`. Do NOT edit workbench/README/index.src.html.
STATE: `{dialType:'horizontal'|'equatorial'|'vertical-south', latDeg, lonDeg, tzOffsetMin, date(dayOfYear),
localMin(0..1439), dst:bool, eotOn:bool, skin}`. DIAL CORE (a frozen module both renderer + self-test call):
COPY the Astrolabe's solar fns VERBATIM (julianDate, gmst/lst, EPS, day→ecliptic-longitude λ, solarDec(λ),
solarRA(λ)) into a self-contained core (a future agent may promote ~40 lines to `tools/solar/solar.js` and
forge-inline into both — `tools/solar/` is absent). Hour-angle H from apparent solar time. EoT(d)=apparent−mean
(NOAA series or `4·(L−RA)` deg→min). Hour-line angle by dial: horizontal `atan(sinφ·tanH)`; equatorial uniform
15°/hr; vertical-south `atan(cosφ·tanH)`. Gnomon style angle = φ (horizontal) / 90°−φ (equatorial) / co-lat
(vertical). Project sun (alt,az from φ,dec,H) onto the dial plane → shadow-tip xy. Readout: `AST = civil −
tzCorrection((lon − tz·15°)·4min/deg) − (eotOn?EoT:0) − (dst?60:0)`; show it equals the wall clock.
PAGE (Canvas, dpr-aware, astrolabe chrome): dial face + numbered hour-lines, angled gnomon, live cast shadow +
tip, a sky strip with the sun, a readout panel; "plot a year of noons" animates 365 noon shadow-tips into the
analemma with solstices/equinoxes marked. Controls: dial-type, latitude −66..66 (re-lays live), longitude, tz,
day 0..365, local time + "Set to now", DST toggle, EoT toggle, "plot analemma", 3 skins (Brass/Blueprint/Stone,
palette-only), Reset, 2× PNG, `← workshop`. Forge-include `../tools/ws/ws.js`; `WS.seen('sundial')`.
SELF-TEST (chip "dial verified — N/N ✓", ~16; `sundial.test.cjs` mirrors page): 1) round-trip clock
AST→corrections→civil == input <1s over a (φ,lon,tz,d,civil) battery; 2) shadow-tip lands on the matching
hour-line (<1e-5 of radius); 3) hour-line angles == closed form per dial type <1e-9, equatorial exactly 15°/hr;
4) EoT extrema within 30s of known bounds (≈+16m23s near Nov 3, −14m6s near Feb 11) + zero-crossings near
canonical dates; 5) gnomon angle == latitude (horizontal) etc. per type; 6) solar-dec sanity (λ=0→0, 90→+EPS,
270→−EPS); 7) determinism + skin-invariance (geometry fingerprint stable per state, identical across skins).
VERIFY: served origin port 8143, session `gnomon-verify`. Lives on Workbench → Instruments (card added by lead).

## Bulwark — full build-ready spec (for the not-yet-launched deputy)
FILES: `arcade/games/bulwark.src.html` → forge → `bulwark.html` (forge-include `../../tools/ws/ws.js`; a single
`WS.best('bulwark', score)` on each milestone — follow `swarm.src.html`, the only forge-built cabinet);
`arcade/assets/thumbs/bulwark.png` (≤1440w, normalized); append ONE `{file,name,blurb,accent}` entry to
`arcade/games.js` after the digdug entry (fresh accent e.g. `#5fe6c4`); append to `arcade/CHANGELOG.md`.
Do NOT edit `index.src.html` (the lead applies the 18→19 Arcade tag bump after Survey lands) and do NOT edit
workbench/README. The deterministic CORE sim + runSelfTest exported under the brace module-guard (mirror
swarm/gyre/tessera/centipede). DATA: `world={ringW(~4096), camX, ship:{x,y,vx,vy,fuel,lives}, tenders:[{x,
grounded,carriedBy}], enemies:[{kind:'lantern'|'mutant'|'diver',x,y}], shots:[], terrain:Float32Array(seeded
ridge noise along ringW), depots:[{x,fuel}], score, seed, frame}`. ALGS: (a) seeded mulberry32 seeds terrain +
ALL spawns (NO Math.random / NO wall-clock dt); (b) fixed-timestep accumulator (1/120s) → integer ticks; (c)
horizontal WRAP: x mod ringW, collisions/render use shortest-arc delta in [−ringW/2, ringW/2]; (d) scanner strip
= full ring scaled to width; (e) DEFENDER loop: a Lantern grabs a grounded tender (ascends); shooting it frees
the tender (falls); ship overlap catches it (re-grounds, +score); a tender reaching the top mutates its Lantern
into a faster mutant; (f) SCRAMBLE loop: fuel ticks down, bomb a depot to refuel, terrain collision = crash.
Ship v1 = Defender rescue loop + one scrolling terrain/fuel difficulty curve (not separate levels). CONTROLS:
←/→ thrust (inertia), ↑/↓ altitude, Space fire, Z bomb, Shift reverse-facing, P pause, R restart, M mute
(SFX MUTED BY DEFAULT — odd-hours courtesy); `← arcade` back-link. SELF-TEST (in-page chip + Node, module-
guarded): 1) replay determinism — same seed + scripted input → identical per-frame state hash, twice; 2) wrap
continuity; 3) rescue invariant (shoot carrier → tender falls; catch → re-ground + exact score bump); 4) fuel
monotonicity (never rises except the frame a depot is bombed); 5) collision symmetry under arc-distance; 6)
seed-purity (terrain + first 200 spawns pure fn of seed, identical across skins). VERIFY: node harness green
BEFORE juice → forge the page → forge --check --all → served origin port 8145, session `bulwark-verify`: play,
rescue a tender, bomb a depot, confirm scanner + wrap, `ws:best:bulwark` set, 0 console errors.
TAG BUMP (lead, after Survey): `index.src.html` PLACES Arcade `tag:"18 games"`→`"19 games"` + add "Bulwark" to
the Arcade blurb, then re-forge.

## Dedupe verdicts (from the curator — keep these in mind)
- Singing Plate ≠ the existing watch-only `strange-garden/pieces/chladni.html` (that has no eigensolver). Safe.
- `tools/sky/sky.js` reserved for Survey (Hours runner-up would collide → use `tools/hours/`).
- Survey's capstone flag `ws:flag:firmament-survey` is new/additive; keep it COSMETIC (do NOT wire into a
  SECRETS predicate this wave — that would touch the shared `ws.js`).
- No pick is a cipher; the rotor vein (hidden `undercroft/enigma.html`) + public Volvelle/Scytale stay as-is.
