# The Gate — Changelog

<!-- ═══════════════════════════════════════════════════════════════════════
     RESUME POINTER  (read this first on a fresh/compacted context)
     ═══════════════════════════════════════════════════════════════════════ -->
## ▶ RESUME POINTER — current state (2026-06-23, FOUNDRY COMPLETE + P1 contain-fix shipped; NEXT = P2 ripple walls)

**Status:** Phase A blockout LOCKED. Phase B `SPEC.md` **LOCKED + committed**
(`823f9f3` base + `1b3f9f4` room-rep custom-color slots `rep.swatch1..3`/`rep.glow1..2`,
Brandon's request via the spec agent). Phase C **FOUNDRY RUNNING**: Wave 1 PILOT launched.

**RENDER HARNESS (built + proven this session — reuse for every wave):**
- `/tmp/gate-render.sh <url> <out.png>` — one-off headless-Chrome shot (virtual-time-budget
  4500, own throwaway profile → parallel-safe, no agent-browser contention).
- `/tmp/gate-foundry/render-take.sh <scratch> <module_relpath> <candidate|-> <port> <outdir>`
  — copies the-gate/+tools/ from `GATE_SRC` (default /tmp/gate-worktree) → swaps the candidate
  module in → forges → serves on <port> → shoots idle-night/idle-day/open-night → tears down.
  gtimeout-guarded (gtimeout at /opt/homebrew/bin). USE THIS to render any take/final.
- ⚠️ NEVER `pkill` an http.server while a chrome shot is mid-load — the shot hangs (no implicit
  timeout). Let the helper own its server lifecycle, or use gtimeout.
- ⚠️ Use `/Applications/Google Chrome.app` `--headless=new`; clean up orphaned agent-browser
  "Chrome for Testing" procs if the machine gets loaded (they're from prior screenshot work).

**THE FOUNDRY ENGINE (reusable — drives every remaining wave):**
`/tmp/gate-foundry/foundry.workflow.js` is GENERIC + args-driven. Invoke:
`Workflow({scriptPath:'/tmp/gate-foundry/foundry.workflow.js', args:['<assetKey>',...]})`.
It builds each asset key in `args` SEQUENTIALLY (shared-file-safe): K takes (self-render +
iterate) → judges → synth writes the asset's draw fn into the LIVE worktree + forges + renders
deliverables to `/tmp/gate-shots/foundry/<key>/{idle-night,idle-day,open-night}.png`, LEFT DIRTY.
Asset library `LIB` inside the script holds geometry+brief+K+module+drawFn per asset (currently
manor/observatory/greenhouse; ADD more entries from SPEC §4 for later waves). Each take edits ONLY
its target draw fn (siblings byte-identical) → synth can use the winner's whole file, no merge.
PER-WAVE PROTOCOL (Keystone): launch → on completion VIEW each asset's 3 deliverable PNGs + verify
(node --check, interface grep, `forge --check --all` = 97 current, `git status` = only expected
files) → pass: SendUserFile + `git add the-gate/ && git commit` → fail: `git checkout -- the-gate/`
+ STOP + post. Brandon authorized continuing through the set unattended once the PILOT passed.

**WAVE 1 PILOT — ✅ SHIPPED** (`c7d1f76`): hero brass gate + gears. K=4; judges unanimously chose
Take 1 'The Wrought Crown' (8/8.5); grafted Take 3's self-lit SUN-GEAR (orrery payoff), gear-train
nudge, pier lantern-wash. Estate-quality confirmed; deliverables in `/tmp/gate-shots/foundry/gate/`.

**WAVE 2 — ✅ SHIPPED** (`c857578`): manor (grand Palladian pavilion, dominates) + observatory
(ribbed dome + telescope-from-slit on a grassy rise). Deliverables `/tmp/gate-foundry/{manor,observatory}/final/`.
⚠️ Workflow `args` may arrive as a JSON-STRING — the script now JSON.parses/​splits a string arg
(don't "fix" it back to assuming an array). A 5ms/0-agent return = args didn't resolve to keys.

**WAVE 3a — ✅ SHIPPED** (`eee92b0`): greenhouse (dimensional 3/4 jewel-box glasshouse; loved
silhouette kept byte-faithful). Deliverables `/tmp/gate-foundry/greenhouse/final/`.

**WAVE 3b — ✅ SHIPPED** (`780af5e`): foliage (lush layered trees+bushes, top-lit crowns, not
lollipops) + undercroft (open bilco door over a descending stone STAIR into a blood-wine crimson
throat, near lip black — unanimous judge pick). Deliverables `/tmp/gate-foundry/{foliage,undercroft}/final/`.

**REORDER DECISION (Keystone's call):** doing the GROUNDS before the room-reps. The grounds (grass/
road/apron) are visible in EVERY shot and were flat greybox; the buildings are now richly detailed,
so flat grounds read as unfinished. Room-reps only appear when a room is SELECTED (a Phase-D feature),
so they're completeness, not the default view — done after grounds + the parametric pass.

**WAVE 4 — ✅ SHIPPED** (`eb73939`): grounds (textured lawn + gravel drive + flagstone apron + brass
road lamps; grass stays full opaque occlusion plane) + mist. **The full DEFAULT visible scene is now
complete + estate-quality.** Deliverables `/tmp/gate-foundry/{grounds,mist}/final/`.

**DECISION (Keystone):** SKIPPING a moon/sun beauty pass — they're already estate-quality (regression
risk > gain); asterism stays the earned PLACEHOLDER (do NOT build the eagle). sky/stars fine as-is.

**ROOM-REPS WAVE — IN PROGRESS (the last foundry chunk):** two prereqs running in parallel:
1. PLUMBING agent (id **`a4814c10caf146b3f`**, background): wires colormap.js rep.swatch1..3/rep.glow1..2
   + CM.applyRepColors merge + dayRecede, rooms.js BESPOKE/pick(id)+repColors, scene.js
   S.setDevRoom+drawRoomRep dispatch + a GREYBOX drawGlyphStand, sequence.js ?room=<id>, boot merge.
   It MAY touch those load-bearing files (infra step); leaves worktree dirty. ON DONE: verify Cairn
   default UNCHANGED + ?room=<id> shows the Glyph Stand placeholder, then commit.
2. SURVEY workflow (runId **`wf_729c3bc9-bae`**): 4 blind surveyors (distinct lenses, NO primed
   answer) + tally → a recommended 3-rep slate (covering vertical/horizontal/mound aspects). The
   FINAL pick of 3 is MINE. Pool stashed at /tmp/gate-foundry/room-pool.json (74 rooms).
NEXT after both: add the 3 chosen reps to the foundry LIB (iface 'scene', with repColors) + elevate
the Glyph Stand to estate-quality → one foundry wave (K=3 reps). Render/test via ?room=<id>. Then the
foundry "whole set" is DONE.

**SURVEY DONE (wf_729c3bc9-bae) + KEYSTONE'S FINAL 3-REP CALL:** The blind survey picked gnomon/sundial
+ firmament/observatory + cavern — but surveyors were BLIND to the existing scene, so 2 picks DUPLICATE
elements already built (the gate has a brass sundial; the hero observatory is on the left hill). I
OVERRODE those. FINAL 3 bespoke reps (aspect-covering, theme-spread, color-spread, NO duplication):
  1. `physics-lab` (The Cavern) — MOUND — rocky outcrop + glowing arched cave mouth. accent #7fd4c0.
     repColors: dark cool ROCK via rep.swatch1 (DAY #6e7680/DUSK #6a6470/NIGHT #3a4048) + EMISSIVE teal
     cave glow via rep.glow1 #7fd4c0.
  2. `ripple` (The Ripple Tank) — HORIZONTAL — wide shallow water tray, concentric ripple rings. accent
     #54d6d0. repColors: WATER via rep.swatch1 (DAY #4fb8c8/DUSK #3f8a9a/NIGHT #2a5560) + faint caustic
     shimmer rep.glow1 #7fe0e8; tray frame = estate brass roles.
  3. `sound-garden` (The Music Room) — VERTICAL — rank of graduated brass ORGAN PIPES on a console.
     accent #cf7bff. repColors: pipes = estate brass roles; VIOLET music accent via rep.glow1 #cf7bff
     (a console pip/soft glow); console body via rep.swatch1 (warm dark wood DAY #6a5640/DUSK #5a4632/NIGHT #2e261c).
The Cairn stays the 4th rep. Re-evaluate K after these first 4 (Brandon). RUNNERS-UP for a later 5th:
the-top (gyroscope), transit, museum (per survey).
⚠️ render-take.sh now takes an optional 6th arg = extra query (e.g. "room=physics-lab") so rep takes
render their pinned room. PRE-WIRE rooms.js BESPOKE (ids→rep-key+repColors per band) + drawRoomRep
dispatch BEFORE the rep foundry; then each rep take ADDS its draw fn + one dispatch line (siblings
byte-identical). Read the plumbing agent's actual drawRoomRep dispatch + drawGlyphStand signature FIRST.

**PLUMBING ✅** (`ed22592`, Sela Quillwright): rep-color slots + CM.applyRepColors merge + ?room= +
drawGlyphStand + REP_DRAW dispatch (`var REP_DRAW={cairn,cavern-mound,ripple-tank}`, fallback
drawGlyphStand(parent,cx,baseY,pick)). **BESPOKE PRE-WIRED ✅** (`616a9c2`): all 3 reps registered
(rep-keys cavern-mound/ripple-tank/organ-pipes + per-band repColors).

**REP FOUNDRY ✅ 3 of 4 SHIPPED** (`c6dc681`, wave wf_8e9b2c6c-e42): Glyph Stand (elevated — arched
brass cartouche plinth, universal fallback), Cavern rep (rocky mound + teal cave glow, physics-lab),
Ripple Tank rep (water tray + ripples, ripple). Each via rep.swatch*/rep.glow* slots + a REP_DRAW entry.

**ORGAN-PIPES (sound-garden) — ✅ SHIPPED** (`c969f0b`, wave wf_235cd455-bd1): the Music Room rep — a
tallest-center cathedral of 7 graduated brass tubes (open bored mouths + flue mouths), fanned conical
feet, a keyboard manual across the carved-wood console, and a lit VIOLET stop-knob (rep.glow1) that
blazes at night + recedes by day. Synth grafted Take 1's iconic silhouette + Take 3's recognizability
cues (open mouths, keydesk). Confined to drawRepOrganPipes + one REP_DRAW line; forge 97.

**RIPPLE TANK — now ANIMATED** (`bc0618b`): the rings EMANATE (ambient SMIL wavefront — born → scale
outward → fade at the rim, staggered for one continuous front; breathing drop-pip; clipped to the water
plane; non-scaling-stroke keeps crests delicate). Added a reusable dev pin **`?smil=<seconds>`** (pauses
+ seeks the SVG animation clock) so animated assets can be rendered/judged across their loop — headless
`--virtual-time-budget` does NOT advance SMIL; `setCurrentTime` does.

**SPEC AMENDMENT — animation is now first-class** (`1928d8f`): §2.5.5 allows + ENCOURAGES ambient
animation where it fits the room (self-contained SMIL, quiet/secondary, lit-correct every frame,
seamless, reduced-motion-safe). Folded into the §8 judging bar + documented `?room=`/`?smil=` in §7.
The foundry smith/judge/synth prompts were updated to match (smiths may animate + render smil phases;
judges view the motion frames + reward fitting motion, penalize gratuitous motion). The foundry harness
is ARCHIVED to `gate-foundry/` (`1727525`) for durability — outside the-gate/, forge still 97 files.

**═══ FOUNDRY COMPLETE: the full DEFAULT VISIBLE SCENE + the room-rep system + ALL 4 reps (Cairn, Cavern,
Ripple [animated], Music Room) are shipped + estate-quality. The asset foundry "whole set" is 100% DONE. ═══**
NEXT — see `the-gate/KNOWN-ISSUES.md` (the lightweight bug log; formal QA = a dogfood pass in Phase D).
  • **P1 — scene clips on tall/narrow viewports — ✅ FIXED (`<this commit>`, 2026-06-23).** Switched the
    scene SVG to `preserveAspectRatio:'xMidYMid meet'` (contain) so it NEVER clips off-screen. The
    letterbox bars are made SEAMLESS by `S.fitStageBackdrop()` (scene.js): it paints #stage with a
    backdrop that extends the scene's own sky/ground past the scene rect — solid sky.top above, the sky
    gradient down to the grass line, solid grass below — anchored to the actual letterbox rect (recomputed
    on resize), colors = band-resolved var() refs so recolor reflows them. Verified at 1:2 portrait,
    2.67:1 ultrawide, and 16:9 (full-bleed, unchanged); bars are indistinguishable from the scene.
  • **P2 — Ripple Tank lacks left/right end walls** (water "leaks" — add slim brass end caps).
    **← now the priority pickup.** `scene.js drawRepRipple`.
Then re-evaluate rep K (Brandon's standing request), then PHASE D (interactive layer — see below).

PARKED for specific phases (owner playtest asks, 2026-06-23):
  • **Self-test chip** — the scene needs a self-test chip like the other exhibits that PROVES its math
    (esp. the MOON math). → Phase D (or a dedicated self-test pass).
  • **Clouds** — yes, deferred to the weather implementation (the `weather-fx` canvas) in Phase D.
  • **Wind runtime param** — SPEC'd at §5.9 (`none|light|strong`, scene-chosen from weather/random,
    always blows RIGHT; drives foliage sway; reps MAY opt in — flag flutters, smoke drifts). Build in
    the animation phase.
  • **fun-forever foundry** — when the gate lands + we revisit the MAIN LOOP: generalize this foundry
    into the fun-forever workflow so the loop can build high-quality bespoke assets on demand (room-reps
    AND e.g. an Aquarium seed foundry-building its own fish instead of sourcing from the internet — fits
    the estate's soul). → the "update the main loop" phase; revisit when editing
    `.claude/workflows/fun-forever.js`. Model on the archived `gate-foundry/foundry.workflow.js`.

PHASE D (interactive layer): click-through cinematic, weather-fx canvas (+clouds), audio, real moon
wiring (sky-core.mjs), earned asterism, foliage+wind sway, room-pick rotation (so the bespoke reps
appear in production, not just via ?room=), the self-test chip, and a full dogfood QA pass.

**REMAINING after Wave 4:**
- PARAMETRIC beauty pass: moon (disc+lit-limb glow+terminator — already decent, light touch), sun;
  asterism stays the earned PLACEHOLDER (do NOT build the eagle — earned-only). Add LIB entries; sky
  gradient + stars are likely fine as-is (skip unless they read flat).
- ROOM-REPS wave (most complex — needs SETUP the foundry workflow doesn't do): (1) wire colormap.js
  rep.swatch1..3 + rep.glow1..2 (SPEC §5.8) + add the two glow slots to the dayRecede list + the
  resolve-time merge + boot wiring (TOUCHES colormap.js + the-gate.src.html boot — orchestrator-level,
  not a parallel take agent); (2) BLIND essence-survey over the GATE-ROOMS pool to pick 3 reps (no
  primed verdict); (3) 3 bespoke draw fns in scene.js + rooms.js BESPOKE + per-rep repColors; (4) the
  Glyph Stand fallback. Reps K=3 (iface 'scene'); re-evaluate K after the first 4 (Cairn + 3).
- Then Phase D systems (see below).

**WAVE ROADMAP (remaining, after Wave 2):**
- Wave 3 — supporting: greenhouse (in LIB; K=2). Then add to LIB + build: trees(+sway later), bushes,
  undercroft hatch, the Glyph Stand, pier-lamps (already in the gate). [scene-buildings.js: greenhouse;
  scene.js: trees/bushes/undercroft; NEW: glyph stand.]
- Wave 3b — ROOM-REPS (K=3): Cairn rep is locked/shipped. Run a BLIND essence-survey to pick 3 reps →
  add 3 draw fns (scene.js) + register in rooms.js BESPOKE; wire colormap.js rep.swatch1..3/rep.glow1..2
  (SPEC §5.8) FIRST. Re-evaluate K after the first 4 reps (Cairn + 3).
- Wave 4 — MINOR (direct-to-spec, no fan-out): grass/midground, road, foreground apron, road lamps,
  horizon mist, sky gradient, stars. (all scene.js + scene-buildings.js drawMist.)
- Parametric beauty pass: moon disc + lit-limb glow + terminator, sun, brass asterism (scene.js).
- Phase D (later): weather-fx canvas, audio, real moon wiring (sky-core.mjs), earned asterism pick,
  click-through cinematic + welcome card, gate open-state seam-furniture choreography.
(Foundry cycle/ledger: ~cycle 720+; base roles builder/judge; marks → gitignored ledger/inbox.)

(legacy status line follows; superseded by the above)
**Status (pre-foundry):** Phase A blockout is **LOCKED** (owner-approved). Phase B (write `SPEC.md`)
is in progress. Phase C (asset foundry) is next.

**Where the work lives:** git worktree `/tmp/gate-worktree` on branch **`the-gate`**.
Commits live in the main repo's `.git` (`/Users/brandon/dev/general/creative-space`),
so they survive a `/tmp` wipe. If `/tmp/gate-worktree` is gone, recreate it:
`git worktree add /tmp/gate-worktree the-gate`.

**Commits (the-gate branch):** `d7b9f76` scaffold · `46b6997` v2 grand frame ·
`1c95027` v3–v5 refinements (HEAD = locked blockout).

**Preview (served origin ONLY — never file://):**
`cd /tmp/gate-worktree && python3 -m http.server 8757` then open
`http://localhost:8757/the-gate/the-gate.html?dev&t=night&wx=clear&moon=0.55&undercroft=1`.
Dev params: `?dev` / `?scene=idle|open` · `?t=day|dusk|night` · `?moon=0..1` (drives the
drawn phase + brightness) · `?wx=clear|cloudy|storm` · `?seed=N` · `?undercroft=1`
(force the earned hatch visible). Greybox shots are in `/tmp/gate-shots/` (`v5-*.png` =
the locked blockout).

**In-flight at this checkpoint:** a background agent (`ad212b448e5bdf38e`) is drafting
`the-gate/SPEC.md`. If, on resume, `SPEC.md` is still the stub, relaunch the spec draft
(brief pattern: PLAN §8 Phase B + this conversation).

**Forward path:** review `SPEC.md` → ensure the room-rep box is **aspect-flexible**
(horizontal pond / vertical building / wide cavern-mound), sized cairn→~2×, bottom-aligned
on a common ground line, with the slot verified to hold the 2× max (or the conflict
flagged) → commit the spec → **Phase C foundry: PILOT the gate+gears hero first** (calibrate
estate-quality + token cost) before the full set (hero K=3–4, supporting K=2, minor direct)
→ Phase D systems (real moon wiring via `sky-core.mjs`, earned asterism, `weather-fx.js`,
audio, the click-through cinematic + welcome card, gate open-state choreography) → DEFERRED
promotion (gate → `index.html`; mind the `--follow` git landmine, PLAN §7).

**FOUNDRY DIRECTIVE (Brandon, 2026-06-23, before sleep):** run the **full foundry,
PILOT-GATED**, autonomously overnight. SendUserFile sample render filenames into chat
AS THEY LAND (per wave) so he can spotcheck on waking. Pilot the gate+gears hero FIRST;
if it's genuinely estate-quality, continue through the whole set; if it disappoints, STOP
and wait. He expects ~30–60 min/asset and will course-correct or stay silent.

**FOUNDRY WAVE PLAN** (each wave = a Workflow: fan-out K takes → judge → synthesize →
build-final → render the final to `/tmp/gate-shots/foundry/<asset>.png`; on completion I
SendUserFile that wave's renders, then launch the next wave):
- Wave 0 — write + commit `SPEC.md` (in flight; agent retry on 529).
- Wave 1 (PILOT) — the brass gate + clockwork, K=4. I JUDGE the render myself: pass →
  continue; fail → STOP + post for Brandon.
- Wave 2 — heroes: manor, observatory+rise (K=4 each).
- Wave 3 — supporting (K=2): greenhouse, trees(+sway), bushes, undercroft hatch, the Glyph
  Stand. ROOM-REPS at **K=3** (Brandon: they're the trickiest — recognizable yet estate-
  styled; start at 3, may bump to 4 like the heroes; EVALUATE after the first 4 reps = the
  Cairn + the 3 survey winners, then tweak K up/down): build the Cairn rep + run a blind
  essence-survey to pick 3 reps → build those 3 at K=3.
- Wave 4 — minor (direct-to-spec): grounds/grass, road, foreground apron, horizon mist, sky
  gradient + stars; system visuals (moon disc + lit-limb glow + terminator; brass asterism).
- Phase D (later): weather-fx (rain/lightning/clouds/birds), audio, real moon wiring,
  the click-through cinematic + welcome card, gate open-state choreography.

**API RESILIENCE:** the API was transiently 529-overloaded the night of 2026-06-23 (the
spec agent died twice with 0 work). Agents return null / die after ~3.5 min of internal
retries. Strategy: relaunch a failed wave/agent (the internal retries give backoff); if a
step keeps failing, wait longer and retry, or write that artifact by hand. Nothing is lost
— every completed asset is committed. A live background agent is the trigger across compaction.

**Makers signed** (gitignored `ledger/inbox/`, uncollated — DO NOT collate; publisher's job):
Greywright (scaffold), Selene Verit (moon math), Cosine (grand frame), Penumbra (moon +
undercroft), Aperture (manor/greenhouse/undercroft fixes), Pane Lazaro (greenhouse layer),
Selene's Auditor (verify) — plus the 12 recon marks (11 explorers + Januswright + Keystone/architect).

**Guardrails:** add-only under `the-gate/`; NEVER touch `ROADMAP.md` or move/rewrite existing
files; test on a served origin only; do NOT run `collate.sh` or the fun-forever loop.

---

## Phase A refinements (v2–v5) · blockout LOCKED  (2026-06-23)

Three owner-feedback iterations on top of the scaffold; verified by an adversarial workflow.
- **v2 (Cosine):** grand hero gate (~50% frame, masonry piers + emissive lamp-globes, arched
  scrolled crest), foreground paving apron, centered manor, asterism moved clear of the bars,
  seam gear-train + a legible brass sundial, observatory rebuilt with a telescope slit, horizon
  mist. Rewrote `swing()` as horizontal foreshortening (doors on vertical hinges, not tipping).
- **v3 (Penumbra):** greenhouse → dimensional 3/4 corner; moon dark-side dropped to structural
  dark + lit-limb glow (no full-circle halo); phase-parametric moon (`?moon=` drives the draw);
  undercroft hatch + `?undercroft=1` dev flag.
- **v4 (Aperture):** greenhouse scaled down (shape kept); manor widened to nearly fill the
  opening + taller flanking wings (now dominates); undercroft redrawn front-on as a
  physically-correct double bilco door (hinges on OPPOSITE outer edges) over a receding ground
  hole; undercroft glow → ominous deep crimson `#8a123a` (not welcoming yellow); moon lit-limb
  glow restored (brighter + a second bloom layer).
- **v5 (Pane Lazaro):** fixed the buried greenhouse — a pure LAYER move (far-scenery → forward
  furniture, in front of the grass) + reframed the trees. No reshape.
- **Verify (Selene's Auditor + 2 judges):** undercroft geometry PASS, moon glow PASS, manor
  PASS; the greenhouse blocker was caught here and fixed in v5.

---

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
- `sky-core.mjs` + `sky-core.test.mjs` — DONE (Selene Verit): the forked moon-phase
  math taking geocentric sun-longitude directly (fixes the orrery +180° bug); Node
  test passes 14/14 incl. the J2000 New/Full anchors. NOT yet wired into the browser
  moon draw (that's Phase D).
- `SPEC.md` — the Phase-B asset spec (being written from the locked blockout).

### Systems real this pass
- Lighting model (palette-swap + emissive + brightness ladder + JS crossfade).
- Time-of-day classifier + gnomon tap-to-cycle.
- Seeded weather + tri-toggle (offline).
- Dev URL override (boots straight to idle, pins band/moon/weather/seed).
- The click-through sequence + reduced-motion path.
- Mute chip ↔ shared WS flag.
- One perpetual rAF loop (dt-clamped, hidden-gated, DPR-capped, fps gauge).

### Deferred (later phases)
- Wire `sky-core.mjs` into the browser moon draw (Phase D).
- `weather-fx.js` canvas (rain/lightning/clouds/birds/sway).
- Audio engine sources (gears/creak/ambient).
- Earned asterism runtime pick; 3 essence-survey room-reps + the Glyph Stand.
- Final art via the asset foundry (Phase C), against the Phase-B-locked spec.
