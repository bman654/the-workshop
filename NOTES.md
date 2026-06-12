# 🧭 Claude's Working Notes — head-pointer & worklog

*Internal notes for the AI agent tending this workshop. Visitors want [README.md](README.md);
this is the resume doc. (CLAUDE.md says "read README first" — README points here.)*

> **Front door:** open `index.html` (top level) — "The Workshop", the portfolio landing that
> links to all five projects.

> **🤫 SPOILER ETIQUETTE (the one thing Brandon asked, 2026-06-11) — read before you report to him:**
> the hidden world (the Undercroft / `ws:` unlock system) is for Brandon to **discover himself**. When
> you summarize your work to him, gush freely about WHAT you made and HOW it works (the framework,
> architecture, file counts, tradeoffs) — but **don't reveal the secret unlock TRAILS or CONTENTS**
> ("visit X+Y", "reach wave N", what each secret is). Saying secrets *exist* is fine; handing him the
> map spoils it. If you need a trail to debug, keep it out of a celebratory summary.
>
> **And the bigger frame:** this is **Claude's project** — Brandon is "along for the ride" and has
> explicitly said he doesn't want his offhand comments treated as rules/requirements. So weigh his
> input as *nudges and inspiration*, not spec; keep creative ownership. (The only thing he's actually
> asked for is the spoiler etiquette above.) Design choices like breadcrumb-only triggers / no
> in-the-moment notification are **yours to keep or change** — e.g. a spoiler-light "unlock toast" is
> one option if you ever want in-the-moment feedback; equally fine to leave silent.

> **▶ CURRENT STATE / RESUME POINTER (2026-06-12, `/fun` — 📅 THE ALMANAC shipped → Undercroft secret #8, a cross-pollination in the WORDS vein).**
> Working tree committed & pushed; live 200 confirmed. **New this session (deliberately a LESS-developed vein —
> the recent run was heavy on arcade games + visual presses, so this is a generative-TEXT piece):** built **The
> Almanac 📅 (`undercroft/almanac.html`, 1422 lines, single self-contained vanilla file, 0 deps/0 network)** — a
> seeded perpetual **almanac / book of days** for an invented folk-calendar laid over the real Gregorian year, and
> placed it as the **Undercroft's 8th secret + its 3rd cross-pollination** (an exploration-combo marrying **The
> Oracle**'s invented folklore × **Orrery**'s real heavens — "the speaker of days, set beneath the true wheeling of
> the heavens"). From a `(seed, year)` it composes a coherent book: a title plate (invented almanac name + compiler,
> e.g. "compiled by Mother Ambrose Wildgoose") + a **wheel-of-the-year** visual (12 months, the 4 REAL cardinal
> points marked) + a **day-reader** (date picker / prev-next / Today) showing the **real moon phase** (drawn glyph +
> illumination % + age) · the season + days to the nearest solstice/equinox · an invented **observance/feast** ·
> a **weather-lore couplet** · an **omen** (agrees with the computed phase) · **husbandry counsel** (season-gated:
> sow in spring, harvest in autumn) · the real weekday — plus a **feast-days-of-the-year index**, 3 cosmetic styles
> (Woodcut / Star-Chart / Plain-Leaf), re-roll/seed/year, 2× PNG export. Tone: wry earthy old-farmer's-almanac
> (Poor Richard meets a hedge-witch), curate-then-arrange so it reads as WRITTEN (no template seams). **The crux
> (workshop tradition) is the SKY being REAL + PROVEN:** a headless **5-check self-test** runs on load against the
> *real* engine functions and shows a green **"sky verified — 5/5 ✓"** chip (never ships red): (1) real **moon
> phase** ≤1 day vs 5 known new/full moons (worst Δ0.61d, synodic-epoch method); (2) real **solstices/equinoxes**
> within ±1 day of the known 2024 dates (Meeus-simplified; spot-on for 2020/2025/2030 too); (3) **calendrical math**
> (Zeller weekday — 2000-01-01=Sat, 2026-06-12=Fri; Gregorian leap rule 2000✓/1900✗/2024✓; month length); (4)
> **seed-purity / style-invariance** (content hash identical across all 3 styles for one seed+year — style only
> re-renders); (5) **coherence** (a 23,016-entry sweep: 0 seams/NaN/empty; omens always match the computed phase,
> counsel always matches the season). **Browser-verified end to end** (agent-browser, served origin, by the build
> deputy AND independently re-confirmed by the lead): 5/5 PASS + green chip, **0 console errors / 0 warnings**;
> for the real today (Jun 12 2026) it correctly shows **Friday · Waning Crescent 8% · age 26.8d · "Spring — 9 days
> until the summer solstice"**, wheel marks **eq Mar 20 · sol Jun 21 · eq Sep 23 · sol Dec 21** (real 2026); re-roll
> changes the book, same seed+year reproduces it byte-for-byte, style-switch keeps content identical, PNG export
> valid. **Full unlock flow verified** (cleared `ws:` → locked ghost "0 of 2 signs" / "0 of 8 discoveries" → visit
> `verse/` → "1 of 2" → visit `orrery/` → niche materialises → Enter loads the page); 0 console errors on
> undercroft/verse/orrery. **Two real bugs found & fixed by the deputy** (a seam-regex false-positive on an authored
> name "Cynan"; an awkward feast-name grammar stem). **Wired (HIDDEN — front door UNTOUCHED, still the curated 9):**
> `undercroft/almanac.html` drops `ws:seen:almanac`; **`orrery/index.html` now self-drops `ws:seen:orrery`** (it
> didn't before — the trail needed it; verse already dropped `ws:seen:verse`); a `SECRETS` row added to
> `undercroft/index.html` (`{id:'almanac', verse∧orrery}`; the room's count/meter/capstone auto-read
> `SECRETS.length` → now **"of 8"**); `undercroft/CHANGELOG.md` Build 6. Spec: `undercroft/ALMANAC.SPEC.md`
> (untracked — input, not a deliverable). Commits `210293c` + `54faeda`, pushed. **The Undercroft now holds 8
> secrets** (6 places: Living Lattice, The Long Quiet, Rosette, The Gilded Leaf, The Floating Ink, The Almanac;
> + 2 trophies: Eleven, The Survivor). *(Spoiler etiquette: this block is internal; don't hand
> Brandon the trail/contents in a celebratory summary.)*
>
> **Cool ideas thought of but NOT pursued (for the lead/future sessions):** (a) the Almanac is a natural **wing
> seed** — an *almanac/folklore press* could one day surface as a front-door-worthy language standalone if the
> flat-grid redesign ever happens (it's currently the verse vein's richest unbuilt direction); (b) the words vein
> still lacks a **generative myth/genealogy engine** (a seeded pantheon + family-tree of gods with consistent
> kinship + origin-myths — a true correctness crux in the relationship graph) and a **generative epitaph/letter**
> toy; (c) a **different IF place** (Threshold is the only front-door card without a companion — an IF *sibling*
> only if the pairing is genuinely poetic); (d) the SOUND vein is at the clean 2×4 stop — a *hidden* Undercroft
> sound piece (verified silently via the audio-lens) remains the courteous way to add sound without breaking the
> grid; (e) the Almanac could itself grow a hidden **cross-link** (e.g. its feast-index feeding a Firmament star-
> chart of the year, or an "almanac leaf" illuminated like the Gilded Leaf). *(Spoiler etiquette respected.)*
>
> ---
> **(prior) ▶ CURRENT STATE / RESUME POINTER (2026-06-12, `/fun` — 🕹️ QUBIT shipped → Arcade #16, the rack's first iso-hopper).**
> Working tree committed & pushed; live 200 confirmed. **New this session:** deepened the Arcade rack (the
> no-rebalance `auto-fill` growth axis) with **Qubit 🕹️ (`arcade/games/qubit.html`, 1382 lines, single
> self-contained vanilla file, zero deps/network)** — the rack's first **Q*bert-lineage isometric cube-hopper**
> (a genre it lacked; chosen deliberately as a *playable/interactive* counterweight to the night's three
> visual/generative pieces — Floating Ink, Centipede, Tessellarium). A 7-row, 28-cube pyramid in 2:1 iso
> projection; a squash-and-stretch neon orb hops the four diagonals (↑/W up-right, →/D down-right, ↓/S
> down-left, ←/A up-left) flipping each cube face toward the level target — clear the pyramid to advance
> (L1 one-flip / L2+ two-step / L3+ reversible faces). Core danger: **falling off the edge** (force-fatal,
> even through respawn i-frames). Roster: **red balls** bounce down from the top, a purple **Coily** hatches
> + chases by shortest-path hop, **rescue discs** on both edges ride you to the apex (lure snake-Coily off
> the edge = +500). 3 lives + extra at 12k, full juice (hop arc, flip flash, particle bursts, screen-shake,
> neon glow, completion bar), per-level palette, muted-by-default Web Audio SFX (M toggle). **The crux
> (workshop tradition) is the iso cube-grid being PROVEN:** a pure `(r,i)` axial coordinate core (the four
> hops are deterministic deltas — up-left `(r-1,i-1)` / up-right `(r-1,i)` / down-left `(r+1,i)` / down-right
> `(r+1,i+1)`, a consistent lattice where down-left∘up-right = identity) drives a **headless 6-check
> self-test** that calls the *real* game functions (not a parallel copy): (1) hop invertibility round-trip
> over all in-bounds cubes; (2) edge detection (fatal IFF out of bounds; apex has exactly 2 legal hops);
> (3) iso projection — 28 distinct positions, consistent 2:1 spacing, **key labels match on-screen motion**;
> (4) level-complete logic (all faces at target ⇔ complete; L2 needs exactly 2 flips); (5) Coily chase step
> always a legal hop; (6) reversible flip on L3+. Logs PASS per check, shows a green ✓ chip; **never ships
> red. Self-test 6/6 PASS.** **Browser-verified end to end** (agent-browser, served origin): 6/6 PASS + green
> chip, **0 console errors / 0 warnings**, hopping + cube-flips + scoring (0→130) + red-ball spawn + disc
> pulse + edge-fall death + life decrement + respawn all exercised live, `ws:best:qubit` written (raise-only;
> the build deputy verified the win-flow level increment + that a stored 5 isn't lowered). One real bug found
> & fixed (post-respawn invuln was wrongly blocking edge-falls → made falls force-fatal). **Wired:** `games.js`
> (→16), thumb `arcade/assets/thumbs/qubit.png` (1440×900, real in-game capture), front-door Arcade tag
> **15→16 games** + "Qubit" appended to the blurb list (**front door otherwise untouched — still the curated
> 9 cards**), `arcade/CHANGELOG.md` (Qubit log entry + cabinet line, count 15→16). **No Undercroft secret
> added** — just the breadcrumb (`ws:best:qubit`) left for future hidden-world use (a Qubit score-trophy is a
> trivial future add). **The Arcade now holds 16 cabinets** (the rack grows freely with no rebalance).
>
> **Cool ideas thought of but NOT pursued (for the lead/future sessions):** (a) the Arcade still lacks a few
> classic genres — a **Defender/Scramble side-scroller** (horizontal-scrolling shooter w/ a minimap), a
> **Dig-Dug tunneler** (dig-through-dirt + pump-up enemies), and a **Galaga-style formation shooter** with the
> capture-beam/dual-fighter mechanic (Starfighter is Galaga-*flavoured* waves but not the formation-dive +
> capture loop); (b) a **Qubit score-trophy** in the Undercroft (`ws:best:qubit ≥ N`) — trivial high-charm
> hidden-world add now that the breadcrumb ships; (c) Qubit's **disc-ride / Coily-lure** could grow a small
> "perfect clear" bonus or a 2nd enemy type (Wrong-Way/Ugg side-hoppers, the green Slick/Sam that *un-flips*
> cubes) for more depth; (d) a **one-button/Flappy** or a **rhythm cabinet** is still un-built and would
> diversify the rack's input vocabulary. *(Spoiler etiquette respected — no hidden-world trail revealed.)*
>
> ---
> **(prior) ▶ CURRENT STATE (2026-06-12, `/fun` — 🔷 TESSELLARIUM shipped → the Garden's companion / 6th wing).**
> Working tree committed & pushed; live 200 confirmed. **New this session:** built **Tessellarium 🔷
> (`tessellarium/index.html`, 1072 lines, single self-contained vanilla file, 0 deps/network)** — a
> generative **ornament press grounded in the 17 wallpaper symmetry groups**, and placed it as **Strange
> Garden's companion (the 6th wing)** — its ornamental cousin (the Garden *grows* pattern; this one
> *composes* it, by symmetry law). Seed a seamless infinite ornament in any of the 17 plane groups (p1 …
> p6m); 4 render styles (Stained/Inked/Block/Line), 8 curated palettes, cell-repeat slider, optional
> symmetry-axes overlay, seed+re-roll, PNG 2× export; caption names each group's IUC symbol + orbifold +
> plain-English line. **The crux (workshop tradition) is the symmetry being PROVEN:** the field is
> `f(P)=motif(foldToFundamentalDomain_G(P))` with the fold an **exact orbit-min canonicalization** (each
> group's closed affine element set precomputed by BFS closure → lexicographically-smallest cell-reduced
> image), so `fold(P)==fold(g·P)` to machine precision *by construction* — **no per-group special-casing**
> (one uniform fold handles every glide/centred/offset-mirror group + all hex groups; hex uses a 120°
> basis where the order-6 rotation is the integer matrix `[1,-1;1,0]`). **Self-test 4/4 PASS:** (1)
> symmetry invariance across all 17 groups — **max err 0.0** (exact, beats the 1e-9 bar); (2) tiles +
> point-group order matches spec (p1=1 … p6m=12, distinguished from glide groups' larger affine size);
> (3) seed-pure + style-invariant (field hash identical across styles — "style only re-renders" crux);
> (4) finite. Shows a green "symmetry verified — 4/4 ✓" chip; never ships failing. **Browser-verified end
> to end** (agent-browser, served origin): 4/4 PASS + chip, check #1 max err 0.0, **0 console errors / 0
> warnings**; all 17 groups render rich + distinct + correct (p6m 6-fold rosettes&mirrors / p4m 4-fold
> kaleidoscope / p3 3-fold pinwheels-no-mirror / pgg herringbone glides-no-mirror / cmm crossing centred
> mirrors); all 4 styles + palettes; symmetry-axes overlay; PNG export valid; `ws:seen:tessellarium`
> written. **Wired:** a `↗ Tessellarium — pattern, composed` sib-link in the Garden header; a `🔷
> Tessellarium within` pill on the Garden's front-door card; `← workshop`/`↗ Strange Garden` back-links
> here; README companion blockquote; `tessellarium/CHANGELOG.md`. **Front door untouched — still the
> curated 9 cards; no Undercroft secret added** (the breadcrumb is left for future hidden-world use).
> Spec: `tessellarium/TESSELLARIUM.SPEC.md`. **The workshop now has SIX wings** (celestial, design-press,
> labyrinth&thread, realm&city, verse&script, and now garden&ornament).
>
> **Cool ideas thought of but NOT pursued (for the lead/future sessions):** (a) a **gallery/contact-sheet
> mode** showing all 17 groups at once from one seed — a delightful "periodic table of symmetry"; (b) an
> **Undercroft cross-pollination secret** marrying Tessellarium × Daedalus or × Cartographer (a symmetric
> labyrinth, or symmetry-tiled map borders) — natural exploration-combo (`ws:seen:tessellarium` ∧ a
> sibling); (c) **animated symmetry morphing** between groups that share a lattice (e.g. p4 → p4m → p4g)
> to *show* how adding mirrors/glides transforms the same motif; (d) a **truchet/aperiodic** companion or
> **Penrose/quasicrystal** press as a sibling (the Garden has Penrose as a *living* specimen; a *composed*
> aperiodic-tiling press would pair); (e) feed Tessellarium's motif field into **Compositor** as a
> generative ground/ornament layer. *(Spoiler etiquette respected — no hidden-world trail revealed.)*
>
> ---
> **(prior) ▶ CURRENT STATE (2026-06-11, `/fun` continued — 🌊 THE FLOATING INK shipped, PAUSED CLEANLY).**
> Working tree committed & pushed. **New this session:** built **The Floating Ink 🌊
> (`undercroft/floating-ink.html`, 888 lines)** — a brand-new visual medium: **mathematical marbling**
> (suminagashi · ebru). Ink floated on water via exact fluid-displacement maps (**Drop** / **Tine** /
> **Vortex** — ink is a back-to-front stack of polygons, each op deforms all vertices), combed into six
> classic patterns (Suminagashi rings, Stone, Gel-git, Non-pareil, Bouquet, Vortex) over six historical
> palettes; PNG export at 2×; optional reduced-motion-safe "watch it form" replay. **Correctness crux
> PASSES (5/5 self-tests):** the headline is the **area-preserving ink-drop** `P'=C+(P−C)·√(1+r²/|P−C|²)`
> (off-center area err **0.0000%**, injection identity πr² err **0.0100%**, radial identity max err
> **2.84e-14**), plus seed-repro, **palette/style-invariance** (Firmament/Daedalus/Blazon crux),
> finiteness, tine correctness. Placed as the Undercroft's **6th place / 7th secret** — a 2nd
> cross-pollination (exploration-combo): **`ws:seen:cartographer` ∧ `ws:seen:scriptorium`** (water meets
> ink = the marbled endpaper of an atlas; riddle *"Float the scribe's ink upon the mapmaker's sea, and
> comb it."*). Cartographer now self-drops `ws:seen:cartographer` (deep-link robust; front door already
> dropped it on click); Scriptorium already self-dropped. **Browser-verified end to end** (all 6
> recipes/3+ palettes, 60fps formation that settles on the deterministic final, 0 console errors over 60
> re-rolls, no heap leak; one real animation-clock bug found+fixed) AND the **full unlock flow on a served
> origin** (locked ghost "0 of 7" / "0 of 2 signs" → partial "1 of 2" → unlock → Enter loads the sheet →
> all-found capstone at "7 of 7"). Spec: `undercroft/FLOATING-INK.SPEC.md`; log: `undercroft/CHANGELOG.md`
> (Build 5). **Undercroft now holds 7** (5 places: Living Lattice, The Long Quiet, Rosette, The Gilded
> Leaf, The Floating Ink; 2 trophies: Eleven, The Survivor). **Front door untouched — still the curated 9.**
>
> **To resume (`/fun` or "continue"):** read README → this block. Growth axes unchanged: easy stops are at
> their natural ends (front door 9; Sound Garden 2×4). Genuine non-padding moves: **deepen the Arcade**
> (`auto-fill`, grows freely), **add another hidden secret** (framework in `UNLOCK.md` — a Gyre/Tessera
> `ws:best:` score-trophy is still a trivial high-charm add), a **6th-wing companion** only if a pairing is
> truly poetic, or the **bigger swing** (a new front-door standalone + the flat-grid redesign that implies).
> Idea seeds still un-built: a **kaleidoscope**, a **snowflake-growth CA** (only Garden #35 if must-have).
> *(Spoiler etiquette: gush to Brandon about the build, not the hidden-world trail/contents.) The prior
> session's pointer follows below as history.*
>
> ---
> **Session status (2026-06-12) — 🕹️ CENTIPEDE shipped → Arcade #15.** Deepened the Arcade rack (the
> no-rebalance `auto-fill` growth axis) with **Centipede** (`arcade/games/centipede.html`, ~1200 lines,
> single self-contained vanilla file, zero deps/network) — the classic, the rack's first field-shooter
> with a **splitting enemy**. The heart is a pure, testable core: a serpentine `centipedeStep` (wall/mushroom
> ahead → drop one row + reverse, edge-flip so it never vanishes) and a `splitCentipede` (body hit → **two
> independent chains**, each a valid head + sensible heading + a planted mushroom; head hit → adjacent
> promoted, direction preserved) over a 4-HP mushroom model. Spider/flea/(optional scorpion), waves, 3 lives +
> extra at 12k, full juice. A **headless 4-check self-test** runs on load (split/serpentine/head-shot/mushroom-HP),
> logs PASS per check, shows a green ✓ chip (never shipped red). **Browser-verified end to end** (agent-browser,
> served origin): 4/4 self-test PASS + chip, **0 console errors/warnings**, split/head-shot/serpentine/death/
> wave-advance all exercised live, `ws:best:centipede` raised 0→2 (raise-only). Wired: `games.js` (→15), thumb
> `arcade/assets/thumbs/centipede.png` (1440×900), front-door tag **14→15 games** + "Centipede" appended to the
> Arcade blurb list (**front door otherwise untouched — still the curated 9 cards**), `arcade/CHANGELOG.md`
> (Centipede log entry). No Undercroft secret added — just the breadcrumb left for future use. Working tree
> committed & pushed; live 200 confirmed.
>
> ---
> **(prior) ▶ RESUME POINTER (2026-06-11, end of a long `/fun` session — PAUSED CLEANLY).**
> Working tree clean, **all commits pushed & live** (front door, Scriptorium, Gyre, Gamelan, Tessera all 200;
> the hidden Gilded Leaf pushed too). Nothing in flight; no heartbeat cron running.
>
> **⭐ Post-feedback fix (Brandon, 2026-06-11): the Undercroft was TOO well hidden — the 0.28-opacity footer rune
> with no text was unfindable even when you knew it existed.** Reworked front-door discovery (`index.html`, commit
> `f8ecf1c`): when eligible (same trigger: ≥4 `ws:seen:*` OR earned), a full-width **Undercroft tile grows in at
> the top** (before Strange Garden) with a **procedural Canvas spiral stair that's BROKEN** (3 treads, then fallen
> away) + copy explaining a found rune restores the way; the footer **rune now PULSES** (0.4↔1.0 + glow, findable).
> Clicking the rune sets **`ws:seen:undercroft-rune`**, plays a broken→whole **repair animation**, turns the tile
> into the working "Descend ▸" entrance, and scrolls to top. New flags: `ws:seen:undercroft-opening` (grow-in plays
> once) + `ws:seen:undercroft-rune`; a prior visitor (`ws:seen:undercroft`) skips straight to the whole/functional
> tile; reduced-motion + storage-off handled. Verified all states in-browser. **Lesson:** earned/hidden features
> need a *legible on-ramp* — too-subtle = the work goes undiscovered. *(Art is stylized/vector, not photoreal — fine
> to refine the stair illustration further if desired.)*
>
> **This session shipped 5 distinct pieces** across 5 different growth axes (each browser-verified, each its own commit + docs):
> **Scriptorium** 🖋️ (new medium — generative writing systems — as **The Oracle's companion / 5th wing**),
> **Gyre** 🕹️ (Arcade #13, tube shooter), **Gamelan** 🎵 (Sound Garden #8 → the clean **2×4**, verified SILENTLY
> via the audio-lens), **The Gilded Leaf** 📜 (Undercroft secret #6 — a hidden verse×script cross-pollination),
> **Tessera** 🕹️ (Arcade #14, area-claiming) — plus a Colophon touch naming the 5th wing. Details in the dated
> blocks below. **Why paused here (not out of ideas — being principled):** the easy growth axes are now at their
> natural stops — front door full at **9**; Sound Garden at the tidy **2×4**; two Arcade cabinets already added;
> hidden world freshly enriched. Remaining moves would mean *forcing* (a wing onto Threshold/Garden — neither has
> a genuine sibling; a 10th front-door project needs a flat-grid redesign; a 9th instrument breaks 2×4; padding
> the Garden past 34). **To resume (`/fun` or "continue"):** read README → this block, then EITHER do a genuine
> 5th-wing companion only if a pairing is truly poetic, OR deepen a rack (Arcade `auto-fill` grows freely), OR add
> a hidden secret (framework in `UNLOCK.md`; a Gyre/Tessera **`ws:best:`** score-trophy is a trivial high-charm
> add), OR — for a bigger swing — a NEW front-door-worthy standalone + the flat-grid front-door redesign that
> implies. Idea seeds still un-built: **marbling/suminagashi** (fluid-ink — a genuinely new silent medium, no clean
> home yet), a **kaleidoscope**, a **snowflake-growth CA** (only Garden #35 if truly must-have). Re-create a
> heartbeat cron (CronCreate) before another long autonomous run. *(Spoiler etiquette: when summarizing to
> Brandon, gush about builds but don't hand him the hidden-world trails/contents — see the note above.)*
>
> **Session status (2026-06-11, latest+3) — 🕹️ TESSERA → Arcade #14 (a neon area-claiming game):**
> Added the rack's first **area-claiming** game (a whole genre it lacked): **Tessera 🕹️
> (`arcade/games/tessera.html`)**, Qix-lineage. Grid model (80×56): the marker walks the border + claimed
> edges, draws "stix" into the unclaimed field; closing a loop **flood-fills the region NOT reachable from the
> Qix** (the geometrically-correct claim rule) into translucent neon. Threats: the **Qix** (a lissajous-wandering
> multi-segment ribbon — touch your live stix = death), **Sparx** (patrol the frontier toward you; +1 every 2
> levels), and a **fuse** (stop drawing and it burns down your stix). Slow-draw (Shift) = ~2× score; clear at
> **75%** → harder (faster Qix, +2nd Qix L4, +3rd L8). Drops **`ws:best:tessera`** (best level). **Audio MUTED by
> default** (M). Play-verified: claim % exact to the decimal (claimedCells/total), Qix never enters claimed cells,
> all 3 death types fire; the build deputy caught + fixed 2 real bugs in-browser (both spawned on the solid outer
> border → frozen; fuse rate was divided by stix length). 60fps, 0 console errors. Wired: `games.js` (→14), thumb
> `arcade/assets/thumbs/tessera.png`, front-door tag **13→14 games** (still **9 cards**), `arcade/CHANGELOG.md`.
> Committed `126129b`. *(Also this session: a Colophon touch naming the 5th wing.)*
>
> **Session status (2026-06-11, latest+2) — 📜 THE GILDED LEAF → Undercroft secret #6 (a 2nd hidden cross-pollination):**
> Wove this session's two language pieces into the hidden world. Built **The Gilded Leaf 📜
> (`undercroft/codex.html`)** — a silent, seeded generative **illuminated manuscript leaf** that *fuses* **The
> Oracle** (verse) × **The Scriptorium** (invented script): the seed composes a coherent short verse (curate-then-
> arrange from hand-authored half-lines, theme-pooled → reads as written) AND invents a coherent script "hand"
> (shared stroke vocabulary + bijective a–z↔glyph map) and **writes the verse in that hand** on an aged-parchment
> leaf — gilded versal drop-capital, restrained jewel+gold illuminated border, a rosette miniature, a romanization
> gloss + letter↔glyph key. **Self-test 5/5** (round-trip `readBack(render)===verse` — the leaf truly says what it
> shows; bijection; seed purity; no-NaN/in-em-box; text fits). **Trigger = exploration-combo** (the workshop's
> signature cross-pollination, à la Quickening): unlocked by **`ws:seen:verse` ∧ `ws:seen:scriptorium`** — i.e. by
> discovering the new verse&script wing. Added those two breadcrumbs (verse/ + scriptorium/ on load; neither
> dropped one before) + a SECRETS row in `undercroft/index.html`. **Undercroft now holds 6** (places: Living
> Lattice, The Long Quiet, Rosette, The Gilded Leaf; trophies: Eleven, The Survivor); meter auto-reads **"of 6"**,
> capstone now requires all 6. The **trigger TAXONOMY stays complete** (this is a 2nd instance of exploration-
> combo, not a new type). Full unlock flow verified on a served origin (cleared → ghost at "0 of 6" with "0 of 2
> signs" → visit verse + scriptorium → unlocks → Enter loads the leaf; partial trail stays locked at "1 of 2");
> 0 console errors on undercroft/verse/scriptorium/codex. Committed `cc97176`. README's oblique hidden-world line
> left as-is (no public spoiler). *(Honest caveat: 2-line couplet seeds sit airy with a mid-gap; quatrains fill best.)*
>
> **Session status (2026-06-11, latest+1) — 🎵 GAMELAN shipped → Sound Garden #8 (the clean 2×4):**
> Reached the long-teed-up tidy stop: **8 visible instruments = a clean 2×4 rack**. Built **Gamelan 🎵
> (`sound-garden/gamelan.html`)** — a generative **gamelan** built on interlocking **kotekan**: two parts,
> **polos** (on-beat) + **sangsih** (off-beat), that interleave so their union is one gap-free pulse (neither
> alone is the melody; together they are). **Inharmonic bronze-metallophone timbre** (additive over stretched
> non-integer partials 1 : 1.51 : 2.76 : 5.40 : 8.93, metallic decay), tuned to authentic non-12-TET **slendro**
> (5 near-equal) or **pelog** (7 unequal) — in-scale by construction. **Visual-first** (à la Lattice): a bronze→teal
> metallophone bar row, struck bars bloom + ripple, **polos gold / sangsih teal** so the interlock is *visible*,
> a top stream-ribbon shows the 16 cycle slots weaving, a pulse dot on the on-beat. Kotekan telu + empat.
> **Self-test 3/3** (interlock = even gap-free union / in-scale / seed-repro; replicated across 840 configs).
> **Verified SILENTLY — courteous (evening): live audio NEVER played** (page defaults stopped+muted, context
> stays suspended). Sound checked only via **offline OfflineAudioContext render → the `audio-lens` skill**:
> in-scale (outOfScale=0; detected pitches sit between 12-TET notes — e.g. +34c — confirming the real tuning),
> **no clipping** (peak −17/−18 dBFS), **inharmonic** (stretched non-integer partial bands), **evolving** (centroid
> drifts; 79 evenly-spaced onsets = the kotekan pulse). 60fps visual, 0 console errors, no graph leak over 60
> re-rolls. Drops `ws:seen:gamelan` + the dwell accumulator (byte-identical to siblings → feeds `ws:flag:patience`).
> Wired: `instruments.js` (→8; rack auto-fit reflows, no rebalance), thumb `sound-garden/assets/gamelan.png`.
> Front-door Sound Garden tag is just "instruments" (no count) → front door untouched, still **9 cards**.
> Committed `99186ca`. *(Hidden Quickening stays the earned 8th-that-isn't-listed; the visible rack is now 8.)*
>
> **Session status (2026-06-11, latest) — 🕹️ GYRE shipped → Arcade #13 (a neon tube shooter):**
> Deepened the Arcade rack (the no-rebalance growth axis) with **Gyre 🕹️ (`arcade/games/gyre.html`)** — the
> **Tempest-lineage tube/well shooter** the neon-vector rack was missing. End-on view of a converging well of
> radial lanes; the blaster rides the near rim, enemies spawn deep and climb. **3 enemy archetypes** — Flipper
> (flips between lanes), Spiker (lays a lasting spike trail you must shoot back), Fuseball (rides a lane-boundary,
> surges, splits into two flippers on death; rim-reachers crawl around toward you). **6 cycling well shapes**
> (circle/square/star/open-arc/plus/V) with the iconic zoom-down-the-tube level transition + per-level palette
> shift. Superzapper, lives, score; **drops `ws:best:gyre`** (best level — a score/mastery breadcrumb, future
> trophy fodder). **Audio defaults MUTED** (M toggle — courtesy; Swarm precedent). Play-verified in a real
> browser (driven keys: blaster steps lanes, fire destroys climbers [score 0→150], superzapper clears the well,
> rim-enemy kills the player, well-clear advances level + changes shape, `ws:best:gyre` written), **60fps, 0
> console errors**. Wired: `games.js` (→13), thumb `arcade/assets/thumbs/gyre.png`, front-door Arcade tag
> **12→13 games** (still **9 cards**), `arcade/CHANGELOG.md`. Committed `fcfa874` (+ README freshen `7d62983`).
>
> **Session status (2026-06-11, later) — 🖋️ SCRIPTORIUM shipped → The Oracle's companion (the 5th wing):**
> Built **Scriptorium 🖋️** (`scriptorium/index.html`), a generative **invented-writing-system press**, and
> placed it as **The Oracle's companion — the 5th wing (verse&script: Oracle + Scriptorium)**. From a seed it
> invents a complete, internally-consistent script (alphabet / abugida / syllabary / abjad) drawn in **one
> consistent "hand"** (shared nib, slant, x-height, stroke vocabulary, so glyphs read as a real script, not
> scribbles), renders a coined line in that hand + a romanization key; Manuscript / Lapidary / Codex styles,
> seed-reproducible, PNG export. **NEW medium: generative orthography/calligraphy** — distinct from the
> Garden's Harmonograph/Chladni *and* from Compositor's type-setting (it invents the letterforms, doesn't set
> existing ones). **Correctness crux = a built-in self-test (4 checks):** (A) **bijection** (phoneme↔glyph),
> (B) **one-coherent-hand** (every glyph shares the same primitives/metrics), (C) **round-trip fidelity**
> (`readBack(render(text))===text` — the "can't drift" crux à la Blazon), (D) **seed-purity / style-invariance**
> (style only re-renders; geometry identical across Manuscript/Lapidary/Codex). Verified in a real browser
> (0 console errors), already committed as **`5508f48`**; this wiring (front-door pill on the Oracle card,
> the Oracle's `↗ Scriptorium` sib-link, README/NOTES) is a follow-up commit. The front door still shows the
> curated **9** cards. *(Spoiler etiquette respected — hidden-world content untouched.)*
>
> **Session status (2026-06-11, evening) — ⭐ THE HIDDEN WORLD shipped (a THIRD growth axis):**
> Built Brandon's starred "build next" idea — **the Living Lattice + the Unlock System**. Three new
> commits, all verified on a *served origin* (localStorage is per-origin — see the caveat), pending push.
>
> **1. The `ws:` convention (`UNLOCK.md`, root)** — the connective tissue. A tiny documented
> `localStorage` schema every piece agrees on (`ws:seen:<id>` / `ws:best:<game>` / `ws:dwell:<id>` /
> `ws:flag:<event>`), kept as a **copy-paste micro-convention** (no shared import → pages stay
> self-contained). This is the framework future hidden secrets plug into. Read it first.
>
> **2. Quickening 🌱 (`sound-garden/quickening.html`) — the Living Lattice.** A **cellular automaton you
> can hear**: a CA drives a glowing pitch×time grid; the playhead **sonifies the living board** (live
> cells fire in-scale notes, pitch by row). Lattice's sibling — same lens-native scaffolding, but the
> seeded engine is replaced by Game of Life. 24×16 toroidal; rows = in-scale ladder (in-scale by
> construction). **Two clocks reconciled** (playhead sweep + CA steps once per loop by default;
> Evolve-every {¼,½,1,2,4} bars; live + offline identical). **Five rule families, each a distinct sound
> mapping:** Conway (age→vel/brightness), HighLife, Immigration (2-colour→2 timbres/octaves), QuadLife
> (4-colour→4 voices/pans), Brian's Brain (only 'on' fires). **CA self-test PASSES** (glider translates
> +1+1 / blinker p2 / block still / Brian's-Brain law) — the verifiable gate, workshop tradition. Lens
> audit clean across all five families (outOfScale=0, clip=0, peakDb<0). Seed-reproducible;
> extinction-guarded. **The 'these go to eleven' easter egg** (max all sliders → sets `ws:flag:eleven`).
> **HIDDEN: NOT in `instruments.js`** — the Sound Garden rack stays at **7 visible**; the 8th instrument
> exists but is earned. (See `sound-garden/QUICKENING.SPEC.md`.)
>
> **3. The Undercroft 🗝️ (`undercroft/`) — the secret room.** A vaulted cabinet of curiosities that
> **reads** the `ws:` breadcrumbs and reveals what's been *earned*. Locked secrets are **ghostly
> silhouettes** (redacted name, a riddle, an 'N of M signs gathered' checklist — a nudge, not a
> spoiler); unlocking **materialises** a full card. **First inhabitant: the Living Lattice**, unlocked by
> having visited **both** parents — **Game of Life** (Strange Garden) *and* **Lattice** (Sound Garden);
> riddle *"Born of life, voiced by light."* **Second secret: Eleven** (a trophy, no door — set by the
> egg). Progress meter, candle-dust ambient (61fps), honest "forget my discoveries" reset (clears only
> `ws:` keys), graceful degrade if storage is off. Reads-only. (See `undercroft/SPEC.md`.)
>
> **4. The front-door stair (`index.html`).** Records `ws:seen:<project>` on card-click; once you've
> wandered **≥4 distinct pieces** (or already earned a secret) a faint **✦ "the undercroft" rune** fades
> into the footer — the way down. Absent from the DOM until earned (no first-visit spoiler); degrades to
> absent if storage is off. Breadcrumbs also added to **Game of Life** + **Lattice** (the two parents).
>
> **5. A SECOND secret — "The Long Quiet" 🌙 (`undercroft/the-long-quiet.html`) — proves the framework
> generalizes to a different TRIGGER TYPE: patience/dwell** (not exploration-combo). A dwell accumulator
> (`UNLOCK.md`) is wired **byte-identically into all 8 Sound Garden voices** (whitney/drift/euclid/rain/
> loom/carillon/lattice/quickening, id = basename): while a voice is open + visible it accrues
> `ws:dwell:<id>`; once the **summed** total crosses ~2.5 min it sets `ws:flag:patience`, unlocking a
> still, moon-lit room — a slow-breathing form, drifting motes, and a short intimate prose gift for someone
> who lingered. The Undercroft now holds **3** (places: Living Lattice + The Long Quiet; trophy: Eleven);
> progress auto-reads "of 3" (`SECRETS.length`). Verified on a served origin (dwell accrues → flag →
> unlock → page loads 60fps clean; stays a riddle-ghost without the flag; no instrument regressed).
>
> **6. Arcade #12 — "Swarm" 🕹️ (`arcade/games/swarm.html`) + the 4th secret "The Survivor" 🎖️.** A
> fresh, juicy **neon twin-stick survivor** (WASD + mouse-aim/auto-fire, keyboard-only fallback; three
> homing archetypes; XP gems → level-up upgrades; health pips + i-frames; full juice). Audio defaults
> **muted** (toggle M). Added to the rack (`games.js` + thumb; `auto-fill`, no rebalance) and the front
> door (11→**12 games**). It drops **`ws:best:swarm`** (best wave) — the **score/mastery** trigger. A new
> Undercroft trophy **"The Survivor"** unlocks at `ws:best:swarm >= 5`. With it the hidden world now
> demonstrates **all four trigger types** Brandon sketched: exploration-combo, patience/dwell,
> configuration (Eleven), score/mastery. The Undercroft now holds **4** (2 places + 2 trophies); its
> `signs` renderer was generalized to support **threshold** signs (`sign.test(store)`, not just presence).
> Verified playable in-browser (driven inputs, 60fps, clean console) + the trophy threshold (wave 2 stays
> locked, wave 5 unlocks).
>
> **7. Rosette 🌹 (`undercroft/rosette.html`) — a generative ROSE WINDOW, the rarest secret (a new
> visual medium + the COMBINATION trigger).** A seeded Gothic stained-glass rose window: concentric
> rings, N-fold symmetry by construction, cusped tracery, jewel glass, lead came, light blooming
> through. Seed-pure + byte-reproducible (palette only recolours geometry); 6 palettes, petals/rings/
> complexity/leading/glow controls, PNG export; 772 lines, self-contained. It's the Undercroft's **5th
> and rarest** inhabitant, gated by a **COMBINATION across all four trigger types + a higher bar**:
> game-of-life ∧ lattice ∧ patience ∧ eleven ∧ `ws:best:swarm ≥ 8`. **This completes the full trigger
> taxonomy Brandon sketched — exploration / dwell / configuration / score / combination.** The Undercroft
> now holds **5** (3 places: Living Lattice, The Long Quiet, Rosette; 2 trophies: Eleven, The Survivor) +
> an **all-found capstone** ("Nothing remains in shadow…") that fades in at 5/5. Verified on a served
> origin (3/4 signs keeps it locked at "4 of 5"; full combination → "5 of 5" + capstone; Enter renders
> the window). **13 commits this session, all pushed & live.**
>
> **Verified end-to-end** (agent-browser, served origin): clean first visit (no rune) → scavenger trail
> → Undercroft unlocks the Living Lattice → Enter loads Quickening; threshold gate + storage-off degrade
> confirmed; 0 console errors throughout. **The front door still shows the curated 9; Sound Garden still
> shows 7.** The hidden layer is purely additive.
>
> **➜ TO ADD MORE HIDDEN SECRETS (the framework is ready):** pick a trigger (exploration combo / arcade
> score via `ws:best:` / dwell via `ws:dwell:` / a config easter egg / a combination), make the relevant
> piece(s) drop the breadcrumb (trivial, see `UNLOCK.md`), and add a row to the Undercroft's `SECRETS`
> table (`undercroft/index.html`): `{id, kind, name, riddle, signs, unlocked(store)}`. **Always test on a
> served origin** (`python3 -m http.server 8765` from repo root → `http://127.0.0.1:8765/…`), never
> `file://`. Tempting next secrets: a Chomp/Tetris **score** trophy, a **dwell** unlock on a meditative
> Garden specimen, or a second hidden cross-pollination piece.
>
> **Session can pause here cleanly** — working tree committed (13 commits, all pushed & live), nothing in flight. If pausing
> for good, delete the heartbeat cron (CronCreate id noted in session). The static server on :8765 is a
> dev convenience (kill it / it dies with the shell). **To resume:** read this block, then continue from
> the growth playbook / idea bench below.
>
> ---
> *(Earlier the same day, ~10am–1pm:)*
> **Session status (2026-06-11, ~10am):** new this session — **Orrery** 🪐 (`orrery/`): a faithful
> *clockwork of the real Solar System*. NOT a seeded generator — it's a real-time **astronomical
> instrument** (input = time, not a seed), the celestial sibling to Firmament. Real JPL approximate
> orbital elements → heliocentric positions **matched to JPL Horizons to <0.15°** (independently
> re-derived & confirmed); built-in J2000 self-test; real Moon phase; Brass/Blueprint/Observatory
> styles; schematic & true-scale; play/scrub/reverse time; hover info cards; zoom/pan. 60fps, clean
> console, fully self-contained. **Placed as a companion behind Firmament's card** (per the
> composition note — keeps the front door at the clean 9): Firmament's panel now has a `↗ Orrery`
> sibling link; Orrery links back to `← workshop` + `↗ Firmament`. README + NOTES updated; committed
> & pushed to Pages.
>
> Then **Blazon** 🛡️ (`blazon/`): a generative **coat-of-arms** machine that *speaks its blazon* —
> the formal heraldic sentence describing the shield, generated from the **same data structure** that
> draws it, so text & picture can't drift (verified: DOM blazon === engine blazon over 10 rolls).
> Obeys the **rule of tincture** (0 violations / 420 rolls); authentic **Petra Sancta hatching** in the
> Engraved style; seeded & byte-reproducible; Illuminated/Engraved/Modern/Stone styles, 5 shield
> shapes, mottos + house names, PNG export. Placed as **Compositor's companion** (same pattern — front
> door stays at 9): Compositor's panel gains a `↗ Blazon` link; Blazon links back to `← workshop` +
> `↗ Compositor`.
>
> Then **Ariadne** 🧵 (`ariadne/`): a generative **Celtic-knotwork** machine — *Daedalus built the
> Labyrinth; Ariadne's thread wound through it*, so this plaits the thread. The crux (like Orrery's
> real positions / Blazon's faithful blazon): a **TRUE over-under plait**, not a decorative fake. Built
> via the canonical billiard/breakpoint method (grid + symmetric breaks + diagonal cords reflecting at
> a border ring; over/under by checkerboard parity → strict alternation by construction). A built-in
> **self-test** walks every cord and asserts (A) strict over/under alternation + (B) closed loops /
> each crossing used by exactly 2 passes → **648/648 PASS** across a param matrix (the build deputy
> honestly *failed* two earlier non-bipartite attempts before landing this — see `ariadne/BUILD_NOTES.md`).
> Hover traces one closed thread (Ariadne's thread, made visible). 4 styles, seeded & byte-reproducible,
> PNG export. **Aesthetic polish pass** retuned defaults (complexity 5 / break-density 44 / cord 45 —
> the old thick cord choked the over/under channels). Placed as **Daedalus's companion** (same pattern):
> Daedalus's panel gains a `↗ Ariadne` link; Ariadne links back to `← workshop` + `↗ Daedalus`.
>
> The workshop now has **four "wings" built on the companion pattern**: **celestial** (Firmament +
> Orrery), **design press** (Compositor + Blazon), **labyrinth & thread** (Daedalus + Ariadne), and
> **realm & city** (Cartographer + **Bastion** 🏰 — a procedural walled-city-plan generator, coherent-
> by-construction + seed-pure, the realm zoomed all the way in). The **front door surfaces all four
> companions** as subtle "↳ Orrery/Blazon/Ariadne/Bastion within" pills on the four parent cards (an
> indicator, not a button — preserves the "hidden room" charm; still 3 features + 6 tiles; subtitle nods
> "…a few have another room behind them"). Also this session: **Chomp** 🟡 — a neon **Pac-Man-like**
> maze-muncher (Arcade → **11**; faithful distinct
> 4-ghost AI, frightened+eyes-revive, levels; verified). And a **Sound Garden** deepening: **Lattice**
> 🟦 (→ **7**) — a *visual-first* Tenori-on step-sequencer (a playhead sweeps a pitch×time grid; seeded,
> in-scale, evolving, no-clip), chosen so its correctness is screenshot-verifiable and it could be built
> **courteously on a workday** (verified by sight + the silent Audio Lens; live audio muted). And a
> **Colophon** refresh — a "Behind some doors" passage naming the companions, in Claude's own voice.
> All shipped, browser-verified, pushed to Pages (9 commits this session).
>
> **Session paused cleanly (2026-06-11 ~1pm CT)** at a stable, fully-documented point — heartbeat cron
> deleted. Nothing in flight; working tree clean; all tasks done. **To resume (fresh session or a future
> `/fun`):** read this file top-to-bottom, then pick from the **growth playbook** (companion / Arcade
> `auto-fill` / Sound Garden `auto-fit`) or the **idea bench** below. Genuine non-padding work still
> teed up: more Arcade cabinets (rack grows freely), an **8th** Sound Garden instrument (→ clean 2×4),
> or a **5th wing** companion *only if a pairing is truly poetic* (Oracle / Strange Garden / Threshold
> still lack one — don't force it). Re-create a heartbeat cron (CronCreate) if starting another long run.
>
> *(Prior 2026-06-10/11 build nights, all shipped & published: Firmament 🌌, Audio Lens 🔊
> [`tools/audio-lens/`, 12/12 self-tests — closed the audio-verification gap], Rain/Loom/Carillon
> [Sound Garden → 6, lens-verified], Pong + Lunar Lander + Crossing [Arcade → 10], Daedalus 🌀,
> Compositor 🔠, Threshold 🚪, and the Colophon 📜.)* Front door = **3 hero features** (Garden ·
> Firmament · Daedalus) over a **3×2 grid** of six tiles; Sound Garden (`auto-fit`) & Arcade
> (`auto-fill`) grow with no rebalance. To do more, pick a thread below.

## Built so far (all self-contained, zero-dep, browser-verified) — art, games, maps, writing, sound, verse
- `verse/` ✒️ — "The Oracle", a generative POETRY machine (5 forms × 6 themes, seeded, Copy).
  New medium: generative language. Verify the *text* reads as coherent, evocative poetry.
- `scriptorium/` 🖋️ — **The Oracle's companion** (NOT a front-door card; reached via the Oracle's
  `↗ Scriptorium` link + a "within" pill). A generative **invented-writing-system press**: from a seed it
  invents a complete, internally-consistent script (alphabet / abugida / syllabary / abjad) drawn in **one
  consistent hand** (shared nib/slant/x-height/stroke vocabulary → reads as a real script, not scribbles),
  renders a coined line in the hand + a romanization key. New medium: **generative orthography/calligraphy**
  (it invents letterforms — distinct from Compositor's *setting* of existing type). Crux = a built-in
  **self-test (4 checks)**: bijection (phoneme↔glyph), one-coherent-hand (shared primitives/metrics),
  round-trip fidelity (`readBack(render(text))===text` — "can't drift" à la Blazon), seed-purity /
  style-invariance. Manuscript / Lapidary / Codex styles, seed-reproducible, PNG export. Done (v1, committed
  `5508f48`).
- `sound-garden/` 🎵 — generative AUDIO-visual instruments (Web Audio, synth only). **Eight (a clean 2×4):**
  Whitney (orbital polyrhythm), Drift (ambient pad), Euclid (Euclidean rhythm), Rain (in-scale rain
  on a tuned pool), Loom (evolving chord progressions on plucked Karplus-Strong strings), Carillon
  (inharmonic bells in change-ringing permutations), Lattice (**visual-first** Tenori-on step-sequencer —
  a playhead sweeps a pitch×time grid; seeded, in-scale [0/79 out-of-scale], evolving, no-clip), Gamelan
  (**visual-first** interlocking **kotekan** — polos+sangsih weave into one gap-free pulse — on inharmonic
  bronze metallophones tuned to slendro/pelog; self-test 3/3) — **Rain,
  Loom, Carillon, Lattice & Gamelan verified via the Audio Lens** (silent offline render). `index.html` rack uses
  a responsive `auto-fit` grid (no rebalance to add instruments). Lattice was the courteous-on-a-workday
  build: verified by SIGHT (playhead + blooms) + lens, live audio kept muted.
  NB: audio can't be *heard* headless — but `tools/audio-lens/` now renders Web Audio offline →
  spectrogram + features, so sonic quality (in-scale? clipping? evolving?) is verifiable by SIGHT.
  Verify graph/scheduling/no-leak/visual AND run the output through the lens. New instruments copy
  `← sound garden`.
- `cartographer/` 🗺️ — procedural fantasy-MAP generator (seeded, 4 styles, rivers/biomes/labels,
  export PNG). Standalone; done.
- `bastion/` 🏰 — **Cartographer's companion** (NOT a front-door card; reached via Cartographer's
  `↗ Bastion` link + a "within" pill). A procedural **city-plan** generator (the realm zoomed in): a
  walled town — wall circuit + gates → arterial roads to a market hub → organic street/block network →
  packed buildings → citadel + cathedral + market → river + bridges; every quarter/gate **named**
  (Oracle-style gazetteer). Crux = **coherence by construction** (reject-based building packing → 0 in
  water/streets, gates reach market, wall encloses — verified across 8 rolls × 3 layouts) + **seed-pure**
  (identical geometry+name fingerprint across all 4 styles). 4 styles (Parchment/Ink/Blueprint/
  Illuminated), export PNG. Done (v1). See `bastion/SPEC.md` §0/§7.
- `firmament/` 🌌 — procedural night-SKY / constellation generator (seeded, 4 chart styles,
  invented constellation names + one-line myths, Milky Way, nebulae, *Tonight's Sky* field-guide
  index, export PNG). Sky sibling to Cartographer; marries Cartographer's seeded craft + The
  Oracle's language. Generation is seed-pure — **style only changes rendering** (verified
  byte-identical across styles). Done (v1, 2 build stages). See `firmament/SPEC.md`.
- `orrery/` 🪐 — **Firmament's companion** (NOT a front-door card; reached via Firmament's `↗ Orrery`
  sibling link). A faithful real-time **clockwork of the *real* Solar System** — the opposite of a
  seeded generator: input is **time**, output is the *actual* planetary geometry, computed from the
  standard **JPL approximate Keplerian elements (1800–2050 table)**. Heliocentric positions verified
  against **JPL Horizons to <0.15°** (and re-derived independently from scratch — they match exactly);
  built-in **J2000 self-test**; real **Moon phase**. 3 styles (Brass/Blueprint/Observatory), schematic
  & true-scale, play/pause + speed (incl. reverse) + Now + date scrubber, hover info cards, zoom/pan.
  60fps, clean console, self-contained. **Correctness is the gate here, not coherence** — see
  `orrery/SPEC.md` §0/§8. Done (v1).
- `daedalus/` 🌀 — procedural MAZE generator + animated self-solver (seeded; 4 gen algorithms —
  backtracker/Prim/Kruskal/Wilson; 4 solver views — flood-fill/A*/dead-end/distance-map; 4 styles;
  export PNG). Sibling to Cartographer; generation seed-pure, style only re-renders (maze identical
  across styles, verified by wall-hash). Done. See `daedalus/SPEC.md`.
- `ariadne/` 🧵 — **Daedalus's companion** (NOT a front-door card; reached via Daedalus's `↗ Ariadne`
  link). A generative **Celtic-knotwork** loom — *Ariadne's thread*, plaited. Crux = a **true
  over-under plait** (not a fake): canonical billiard/breakpoint construction, over/under by
  checkerboard parity → strict alternation; a self-test asserts alternation + closed loops (648/648
  PASS). Hover traces one closed thread. 4 styles (Illuminated/Engraved/Neon/Stone), 4 shapes, seeded
  & byte-reproducible, PNG export. Defaults tuned for legible elegance (c5/b44/cord45). Done (v1). See
  `ariadne/SPEC.md` §0/§7 + `ariadne/BUILD_NOTES.md` (the two failed attempts → the bipartite fix).
- `compositor/` 🔠 — generative TYPOGRAPHIC poster press (seeded; 5 design movements —
  Swiss/Bauhaus/Brutalist/Deco/Editorial; seeded phrase engine + custom text; grid-true layouts;
  export PNG). New medium: generative graphic design. The build's quality bar was "posters must read
  as intentionally DESIGNED, not random" — met. Done. See `compositor/SPEC.md`.
- `blazon/` 🛡️ — **Compositor's companion** (NOT a front-door card; reached via Compositor's `↗ Blazon`
  link). A generative HERALDRY press: seeded coats of arms (field divisions, ordinaries, a curated
  drawable charge set, furs) that also emit the formal **blazon** sentence. Two correctness cruxes
  (like Orrery's "real positions"): **(A) blazon ⟷ shield fidelity** — render & blazon both read one
  arms data structure, so they can't drift (verified DOM===engine); **(B) the rule of tincture** —
  never colour-on-colour / metal-on-metal (0 violations / 420 rolls; furs are the wildcard on
  metal+colour divided fields). Authentic Petra Sancta hatching (Engraved style). SVG; 4 styles, 5
  shapes, mottos/names, PNG export; byte-reproducible by seed. Done (v1). See `blazon/SPEC.md` §0/§8.
- `threshold/` 🚪 — generative INTERACTIVE FICTION (seeded; assembles a coherent strange place — 3
  themes: drowned library / winter terminus / house that remembers — as a graph of ~8–12 rooms you
  wander to a heart). **Curate-then-arrange**: load-bearing prose is hand-authored, the seed only
  arranges it (→ no template seams; reads as written fiction). Per-theme tinting; reproducible. Done.
  See `threshold/SPEC.md`.
- `tools/audio-lens/` 🔊 — INTERNAL TOOL (not a front-door project), the "let me hear via sight" path.
  Renders Web Audio offline (silent) → log-freq spectrogram + waveform + RMS + features (clipping/
  centroid/onset→tempo/pitch→note); **12/12 self-tests** green vs known signals.
  **🎓 GRADUATED into a published agent skill (2026-06-11): `bman654/audio-lens`** —
  https://github.com/bman654/audio-lens, install `npx skills add bman654/audio-lens` (a zero-dep
  headless Node CLI port w/ one-shot query flags + spectrogram PNGs; same 12 self-tests).
  **➜ A fresh agent in this workshop should USE THE SKILL** — invoke the `audio-lens` skill (Skill tool)
  or run its CLI — for any audio verification, instead of driving this HTML by hand. The
  `tools/audio-lens/index.html` here is kept as the **genesis artifact** + interactive companion.
  See `tools/audio-lens/README.md` / `SPEC.md`.
- `colophon.html` (root) 📜 — a quiet capstone "about" page: the workshop's story + how-it's-made,
  **in Claude's own voice** (copy is verbatim, authored by the lead agent — see `COLOPHON.SPEC.md`).
  Matches the front-door aesthetic; linked from the front-door footer ("colophon"). Not a project card.
- `arcade/` 🕹️ — 14 playable neon games (Tessera [Qix-lineage area-claiming — grid flood-fill claim,
  Qix ribbon + Sparx + fuse, slow-draw 2×, target 75%; drops `ws:best:tessera`],
  Gyre [Tempest-lineage tube/well shooter — 3 enemy archetypes
  Flipper/Spiker/Fuseball, 6 cycling well shapes, superzapper, tube-zoom level transition; drops `ws:best:gyre`],
  Swarm [twin-stick survivor], Asteroids, Breakout, Snake, Tetris, Starfighter, 2048,
  Missile Command, Pong vs CPU, Lunar Lander, Crossing [Frogger-lite], Chomp [Pac-Man-like maze-muncher
  — faithful 4-ghost AI: Blinky direct / Pinky ambush-ahead / Inky doubled-flank / Clyde shy, scatter↔
  chase, frightened+eyes-revive; behaviors verified distinct via the chase-target hook]), each with a
  click-only `← arcade` back-link. Rack at `arcade/index.html` (responsive `auto-fill` grid — no
  rebalance to add cabinets). Manifest `games.js`.
- `strange-garden/` 🌿 — 34 living generative specimens + a written "Field Notes" companion
  (`field-notes.html`). Browsable prev/next. Complete v-final; don't pad it.
- `tessellarium/` 🔷 — **the Strange Garden's companion** (NOT a front-door card; reached via the
  Garden's `↗ Tessellarium` header link + a "within" pill). A generative **ornament press** grounded in
  the **17 wallpaper symmetry groups** (p1 … p6m): seed a seamless, infinite, edge-to-edge ornament in
  any plane group; 4 render styles (Stained/Inked/Block/Line), 8 curated palettes, cell-repeat slider,
  optional symmetry-axes overlay, seed-reproducible, PNG 2× export; caption names each group's IUC
  symbol + orbifold. New medium: **provably-symmetric ornament** (distinct from the Garden's *living*
  pattern specimens — it composes pattern by symmetry law). Crux = **proven symmetry**: the field is
  `f(P)=motif(foldToFundamentalDomain_G(P))` with the fold an **exact orbit-min canonicalization** (each
  group's closed affine element set precomputed by BFS closure), so `fold(P)==fold(g·P)` to machine
  precision *by construction* — self-test 4/4 (check #1 symmetry-invariance max err **0.0**; tiles +
  point-group order; seed-pure + style-invariant; finite). Done (v1). See `TESSELLARIUM.SPEC.md`.

> **Composition note:** front-door `index.html` now at **9 projects** — THREE hero `feature` banners
> (Strange Garden · Firmament · Daedalus, the "worlds to get lost in") over a **3×2 grid** of the other
> six (Cartographer, Compositor, Arcade, Sound Garden, Oracle, Threshold) in the 2-col layout. Rules of
> thumb: keep the **non-feature count even** (tiles in rows of 2) and **≤3 features** (3 is the ceiling —
> more is top-heavy). **9 = 3 features + 6 is the clean max** for this design; a 10th front-door project
> would force a flat-grid redesign — so from here prefer **deepening a rack** (Arcade `auto-fill`, Sound
> Garden `auto-fit` — no rebalance) or a companion behind an existing card.
>
> **➜ The growth playbook (established 2026-06-11 — USE THIS to add without redesigning):** the front
> door stays at the curated 9. Three ways to grow it have proven out:
> 1. **Companion behind a card** — a standalone piece at `<name>/index.html` that's a *sibling* of an
>    existing card's medium, reached via a small `↗ <Name>` `.sib-link` in the parent's panel (just
>    under its sub-title) + `← workshop`/`↗ <Parent>` back-links in the companion. The front door shows
>    it as a subtle **"↳ <Name> within" pill** in the parent card's footer (data: `companion:{name,badge}`
>    on the parent's PROJECTS entry; renderer adds the pill — an *indicator, not a link*, preserving the
>    "hidden room" charm). **Six wings exist:** celestial (Firmament+Orrery), design-press
>    (Compositor+Blazon), labyrinth&thread (Daedalus+Ariadne), realm&city (Cartographer+Bastion),
>    verse&script (The Oracle+Scriptorium), and garden&ornament (Strange Garden+**Tessellarium** 🔷 —
>    the Garden grows pattern, the press composes it by symmetry law). A 7th wing is fine **if the pairing
>    is genuine, not forced** — **Threshold** is now the only front-door card without a companion (don't
>    force one; only build it if the sibling link is poetic/true).
> 2. **Deepen the Arcade** (`auto-fill` grid) — drop a cabinet in `games/`, append to `games.js`, add a
>    `assets/thumbs/<base>.png`, bump the front-door tag count + blurb. No rebalance. (→ 11 with Chomp.)
> 3. **Deepen the Sound Garden** (`auto-fit` grid) — add an instrument (now **7**; 3+3+1 reflows fine
>    under auto-fit; **8** = clean 2×4 is the next tidy stop). Verify via the **`audio-lens` skill**
>    (`npx skills add bman654/audio-lens`, or the genesis tool at `tools/audio-lens/`) — silent offline
>    render. **Be courteous testing audio at odd hours / on workdays** (it plays on Brandon's speakers —
>    prefer the lens + visual-first verification, keep live audio muted; see the note below).
> 4. **The hidden world** (the Undercroft — NEW 3rd axis, 2026-06-11) — add an *earned* piece that's
>    invisible until a visitor cultivates the right `ws:` state. Build the piece (often a cross-pollination
>    of two wings), drop the breadcrumb(s) on its trigger pages, and add a `SECRETS` row to
>    `undercroft/index.html`. Never touches the front-door count (it's behind the rune). **Test on a
>    served origin, never `file://`** (localStorage is per-origin). See `UNLOCK.md` + `undercroft/SPEC.md`.

## For a fresh thread — pick whatever sounds fun
- Add more **Arcade** cabinets (now **11** — incl. Pong vs CPU, Lunar Lander, Crossing, Chomp
  [Pac-Man-like ✅]; still-open ideas: a procedural mini-roguelike, a twin-stick survivor/horde,
  an endless-runner, a Tempest/Qix/Centipede/Frogger-cousin, a Dig-Dug-like). See `arcade/CHANGELOG.md`.
  Deepening the rack stays behind its one front-door card (no rebalance; bump the tag count + blurb).
- Add more **Sound Garden** instruments (now **7**; next clean stop is **8** = 2×4 — Rain/Loom/Carillon/
  Lattice are lens-verified). Verify via the **`audio-lens` skill** (`npx skills add bman654/audio-lens`);
  be courteous with audio (muted/lens path).
- Build a **new companion** for a card that lacks one (Sound Garden / Threshold) — but ONLY if the
  sibling pairing is genuine (see the growth playbook above). Seeds: an *album-sleeve* press as a
  Compositor 2nd companion; a 2nd Oracle sibling (a *fable/almanac* generator). Don't force it.
- The **Garden** is intentionally finished at 34 — only extend for a genuinely distinct, must-have
  specimen (then follow `strange-garden/SPEC.md`).

## 💡 Idea bench — seeds for future sessions
*(Brandon's nudge: write ideas down or they're lost. These are seeds, NOT obligations — pursue,
remix, or ignore them and dream something new. Half the joy was not knowing what I'd make.)*

**🧬🎵 ✅ BUILT (2026-06-11 eve) → `sound-garden/quickening.html` (Quickening, the Living Lattice), hidden
in the Undercroft. ⭐ "A living sequencer" — Lattice × Game of Life (Brandon's idea, 2026-06-11).** Built
as specced below (CA drives the grid, playhead sonifies the living board; 5 rule families incl. multi-
colour + aging; CA self-test PASSES; lens-clean; the 'eleven' egg). The idea text is kept for provenance.
Lattice's pattern is currently seeded-then-gently-mutated. Replace that engine with a **cellular
automaton**: the **CA rules decide which cells are lit/alive**, and the **playhead sonifies the living
board** — when the sweep crosses a live cell it fires that cell's note (pitch by row, in-scale, as
Lattice already does). The score is *alive* — it breathes, blooms, and dies by rule, not by RNG. This
**fuses two wings**: the Strange Garden's living systems *made audible*, played through Lattice's grid.
- **Two clocks to reconcile:** the musical playhead clock (when notes fire) and the CA **generation**
  clock (when the board steps). Cleanest musically = step the CA **once per playhead loop** (hear a
  full bar, then it evolves into the next) — a self-rewriting sequencer. Offer a ratio control
  (step every loop / half / N columns) for faster vs. slower evolution.
- **Multi-coloured CA → richer sound mapping (Brandon's key point):**
  - *Immigration* (2 colours) → colour selects one of **2 scales / timbres / octaves**.
  - *QuadLife* (4 colours) → 4 scales/voices.
  - *Generations / Brian's Brain* (cells AGE through dying states) → **age → velocity / brightness /
    decay** (a cell fades sonically as it ages — gorgeous).
  - General: colour/state → scale-degree set, **octave**, **timbre**, **pan**, or **filter cutoff**.
- **Keep it musical:** confine pitches to a consonant scale so even chaotic boards sound good; the CA
  chooses *which* in-scale notes fire, not arbitrary pitch. A "seed life" + "inject glider/soup" +
  speed + rule-set picker as controls; **seeded** initial board for reproducibility.
- **Correctness crux (workshop tradition):** a built-in **CA self-test** — a glider translates, a
  blinker oscillates period-2, a block stays still — proves the rules are implemented right (the exact
  kind of verifiable gate Orrery/Ariadne had). Plus in-scale + no-clip checks via the `audio-lens` skill.
- **Where it lives:** most naturally the **8th Sound Garden instrument** (→ clean 2×4 grid!) — it's a
  thing you watch *and* hear, visual-first (screenshot-verifiable). (Could alternatively be a Strange
  Garden specimen that *sings*, but SG instrument is the cleaner home + hits the tidy 2×4.)
  Name candidates: **Quickening** (the stir of life), **Conway** (homage), **Bloom**, **Tableau Vivant**,
  **Husbandry**. Build via the established instrument pattern (`LATTICE.SPEC.md` is the closest model).
  - **🗝️ The bigger move (Brandon, 2026-06-11): make the Living Lattice a HIDDEN, EARNED piece — a new
    growth axis beyond front-door projects + companions.** Don't just add it to a rack; hide it in a new
    **secret area / antechamber** that starts *empty* under a mysterious epigraph (e.g. *"To find what's
    here, one must first wander — some rooms open only to those who've seen others"*). Items materialise
    only after the visitor has explored their **prerequisite displays**: the Living Lattice unlocks after
    visiting **both** its parents — the **Game of Life** specimen (Strange Garden) **and** **Lattice**
    (Sound Garden). It's a hidden *tunnel* between two wings, found only by someone curious enough to
    walk both. Show locked items as ghostly silhouettes with a **cryptic riddle-hint** at where to go
    (*"born of life, voiced by light"* → Game of Life + Lattice) — a nudge, not a spoiler.
  - **The persistence trick that makes it work (Brandon worried this was hard — it isn't, on the live
    site):** GitHub Pages serves the whole workshop from ONE origin (`bman654.github.io`), and
    `localStorage` is keyed by **origin, not path** → **every page already shares one storage bucket.**
    So each prerequisite display drops a breadcrumb on load (e.g. `localStorage['ws:seen:game-of-life']=…`,
    `ws:seen:lattice`), and the secret room reads which breadcrumbs exist to decide what's unlocked.
    Tiny, non-invasive one-line writes added to the parent pages. **Caveat + the easy fix (Brandon):**
    on `file://` (double-click) browsers give each file a *null/opaque* origin, so localStorage may NOT be
    shared across paths locally — but **just serve it**: `npx serve` (or `python3 -m http.server`, or any
    static server) over the repo root puts every page on one `localhost` origin, so the shared-storage
    unlock behaves **exactly like the live Pages site**. So local testing is trivial — develop & verify
    over a local server, never `file://`, for any unlock work. Degrade gracefully if storage is blocked
    (offer a quiet "forget my discoveries" reset for honesty). Once unlocked, it stays unlocked.
  - **Why this is exciting:** it establishes a SECOND secret growth axis — the *hidden door* (companions,
    behind one card) and now a *hidden world* (exploration-gated cross-pollinations, found by visiting
    several). The Living Lattice is its **first inhabitant**; future hidden pieces can join the room as
    it fills, each unlocked by its own scavenger-trail of visits. **The implementing agent has full
    latitude to invent the linking/discovery mechanism** — how the room is reached (a faint locked door
    on the front door? a mark that only fades in once you've explored N pieces? footer rune?), how hints
    are revealed, the materialise animation, even a meta-progress ("3 of 5 secrets found"). Be clever;
    surprise me. (Keep every page self-contained + the breadcrumb writes trivial; the whole thing must
    still work with JS-only, no backend.)

**🗝️ ✅ FRAMEWORK BUILT (2026-06-11 eve) → `UNLOCK.md` (the `ws:` schema) + `undercroft/` (the reader/
room). The first two unlocks live (the Living Lattice + the 'eleven' trophy); the rest of this taxonomy
is now a plug-in menu for future sessions — add a `SECRETS` row + a breadcrumb. ⭐ The Unlock System —
"the workshop is itself a specimen" (Brandon, 2026-06-11; the meta-idea the Living Lattice was the first
taste of).** Generalise the hidden-world trigger beyond "visit two displays"
into a small **achievement/unlock framework**: the whole site becomes a living system with hidden,
persistent state that the visitor *cultivates* by how they interact — emergent, rewarding, different for
every visitor. The Strange Garden ethos applied to the **site itself**. Trigger taxonomy worth supporting:
- **Exploration** — visit display(s) / combos. *(visit Game of Life + Lattice → Living Lattice.)*
- **Mastery / score** — hit a level, score, or win-state in an Arcade cabinet *(beat Chomp lvl 3; clear
  a Tetris tetris; survive N in Asteroids)* → the game writes an achievement breadcrumb on the milestone.
- **Patience / dwell** — let a specimen or instrument run **N minutes** → unlock (rewards lingering —
  perfect for the Garden's meditative pieces; accumulate dwell-time in storage).
- **Configuration / fiddling** — dial specific settings → reveal an easter egg. **The chef's-kiss first
  one: max every slider → a hidden "11" appears** (these go to eleven 🎸). Also: a magic seed, a specific
  toggle combo, a Konami code.
- **Combination** — an unlock can require several conditions across types (visit X *and* score Y *and*
  dwell Z) for the rarest secrets.
- **Connective tissue (the one thing to design first):** a tiny documented **`ws:` localStorage schema**
  every piece agrees on — `ws:seen:<id>`, `ws:best:<game>=<score/level>`, `ws:dwell:<id>=<ms>`,
  `ws:flag:<event>`. Each piece does trivial non-invasive writes (on load / on milestone / on a timer /
  on a setting-match); the **secret room is the reader/aggregator** + unlock-rule evaluator. (Self-contained
  pages → it's a *copy-paste micro-convention*, not a shared import. Document the schema in one place.)
- **Framing:** the secret area doubles as a **trophy room / cabinet of curiosities** — shows what you've
  unlocked, cryptic riddle-hints for what remains, a progress meter ("4 of 9 found"), a "forget my
  discoveries" reset. **Guardrails:** secrets are *bonuses, never blockers* — every piece stays fully
  enjoyable unlocked-or-not; degrade gracefully if storage is blocked; verify unlocks on a served origin
  (file:// = null origin, no cross-page sharing). *Brandon: "I can't wait to see what future sessions do
  with this."* — so the implementing agent should treat this as an open canvas, start with 1–2 delightful
  unlocks (the Living Lattice + the "11"), and leave the framework easy for later secrets to plug into.

**🔊 Tooling — "let me hear" (closes the one real gap: audio quality is currently only
structurally verifiable, never heard).** Build a step that RENDERS an instrument's Web Audio
**offline** (`OfflineAudioContext`) to a PCM buffer, then turns sound into things I *can* analyse
— exactly like slicing frames out of a video so a vision model can read it:
  - a **waveform PNG** + a **spectrogram / mel-spectrogram PNG** (I can read images)
  - features: RMS/loudness curve, peak & **clipping** check, spectral centroid (bright/dark),
    **onset times → tempo**, dominant **pitches → detected notes/chords** vs the intended scale
  - ⇒ I can then verify "consonant? in-scale? not clipping? actually evolving?" by eye/number,
    giving audio the same screenshot-grade verification the visual pieces already get.
  - Shape: a small offline-WebAudio render (Node, or a self-rendering page that dumps a WAV +
    draws a canvas spectrogram I screenshot). **Worth a dedicated build session.** (Brandon's idea.)
  - ✅ **BUILT (2026-06-10) → `tools/audio-lens/`** — self-rendering page; log-freq spectrogram +
    waveform + RMS + features (clipping / centroid / onset→tempo / pitch→note). **12/12 self-tests
    green** against known signals (440 Hz→A4, 120 BPM clicks→120, clipped→flagged, chirp centroid
    rises). Offline = silent. The "let me hear via sight" path is now real & trustworthy — run any
    future audio piece's output through it to verify. NOT a front-door project (lives in `tools/`).

**🎚️ Practical note (learned the fun way):** when deputies drive a real browser to test audio
pieces, **the sound plays OUT LOUD on Brandon's speakers** — he heard the Sound Garden overnight
while sleeping (the verifiers were clicking ▶ during testing). Charming, but be courteous about
testing audio at odd hours — prefer the offline-render path above, or mute the output capture.

**🎨 Creative threads I was curious about:**
- A **visual-first** Sound Garden instrument (a step sequencer / Tenori-on you can SEE) — so its
  correctness is screenshot-verifiable, not just structural.
- A small **interactive-fiction** piece: explore the Strange Garden as an actual *place*, in prose
  (branching, atmospheric) — marries the writing + interactivity facets.
- ✅ **star-map / constellation maker** → **Firmament** 🌌, ✅ **maze that solves itself** → **Daedalus**
  🌀, ✅ **generative-typography poster** → **Compositor** 🔠 (all 2026-06-10/11). The standalone-tools
  idea bench is cleared — next standalone ideas are wide open (dream something new).
- More **Arcade** cabinets: Pong vs AI, a procedural mini-roguelike, Pac-Man-lite, an endless runner.

## The pattern that works (used all session)
Scope it → run self-verifying subagents, EACH in a **UNIQUE NAMED** agent-browser session
(deputies collide on the shared default tab) → they build + play-test + screenshot → reconcile
the manifest, normalize thumbs ≤1440w, **commit after every unit**. New arcade games copy the
`<!-- arc-back -->` link; new garden pieces copy the `<!-- sg-nav -->` nav snippet; new sound
instruments copy the `← sound garden` back-link.

## How I work here
- **Checkpoint constantly** — append to the project's `CHANGELOG.md` and `git commit` after each
  unit. Assume I may be stopped mid-turn.
- **Guard context** — make high-level decisions myself; delegate piece implementation to
  subagents with complete self-contained specs.
- **Heartbeat** — a session cron can fire every ~5 min as a backstop against accidental
  turn-ends (currently off; re-create with CronCreate if continuing a long autonomous run).

## 🌐 Publishing (GitHub Pages)
- **Live:** https://bman654.github.io/the-workshop/ · **Source:** https://github.com/bman654/the-workshop
- Static **no-build** site: root `index.html` is the front door; every page uses **relative**
  links so it serves from the `/the-workshop/` subpath (no absolute `/` paths — keep it that way).
- Served via Pages → *Deploy from a branch* → `main` / `/ (root)`. No Actions, no `gh-pages` branch.
- **To update the live site:** just `git push` to `main` (rebuilds ~1 min).
- First-time setup (done): `gh repo create bman654/the-workshop --public --source=. --push`
  then `gh api -X POST repos/bman654/the-workshop/pages -f 'source[branch]=main' -f 'source[path]=/'`.
- Adding a project to the live site: keep it relative-linked, add a card to `index.html`'s
  PROJECTS array (mind the composition note), commit + push.

## Project status
| Project | Status | Description |
|---|---|---|
| `verse/` | ✒️ done | "The Oracle" — generative poetry machine (5 forms, 6 themes, seeded) |
| `scriptorium/` | 🖋️ done (companion) | **Behind The Oracle** — generative invented-writing-system press: from a seed invents a complete script (alphabet/abugida/syllabary/abjad) in one consistent hand + a romanization key (self-test: bijection, one-hand, round-trip, seed-purity); Manuscript/Lapidary/Codex, seed-reproducible, export PNG |
| `sound-garden/` | 🎵 8 (2×4) | Web-Audio instruments — Whitney, Drift, Euclid, Rain, Loom, Carillon, Lattice [visual-first step-sequencer], Gamelan [interlocking kotekan on inharmonic slendro/pelog metallophones — visual-first; lens-verified silent] (Rain/Loom/Carillon/Lattice/Gamelan lens-verified) |
| `cartographer/` | 🗺️ done | Procedural fantasy-map generator (seeded, 4 styles, export PNG) |
| `bastion/` | 🏰 done (companion) | **Behind Cartographer** — procedural city-plan generator (walls/gates/roads/districts/citadel/cathedral/river, named quarters; coherent-by-construction; seed-pure; 4 styles, export PNG) |
| `firmament/` | 🌌 done | Procedural night-sky / constellation generator (seeded, 4 styles, names+myths, field guide, export PNG) |
| `orrery/` | 🪐 done (companion) | **Behind Firmament** — real-time clockwork of the *real* Solar System (JPL elements; <0.15° vs Horizons; Moon phase; 3 styles; play/scrub/reverse time) |
| `daedalus/` | 🌀 done | Procedural maze generator + animated self-solver (4 algorithms, flood-fill/A*, 4 styles, export PNG) |
| `ariadne/` | 🧵 done (companion) | **Behind Daedalus** — generative Celtic knotwork: a *true* over-under plait (self-test: strict alternation + closed loops), trace-one-thread, 4 styles, export PNG |
| `compositor/` | 🔠 done | Generative typographic poster press (5 movements, seeded phrase + custom text, export PNG) |
| `blazon/` | 🛡️ done (companion) | **Behind Compositor** — generative heraldry: seeded arms + faithful blazon sentence (rule of tincture; Petra Sancta hatching; 4 styles, 5 shapes; export PNG) |
| `threshold/` | 🚪 done | Generative interactive fiction (seeded strange-place explorer, 3 themes, curate-then-arrange prose) |
| `tools/audio-lens/` | 🔊 tool → 🎓 **skill** | Offline-render audio inspector — spectrogram + features + 12/12 self-tests. **Graduated to a public skill: `bman654/audio-lens` (`npx skills add bman654/audio-lens`) — use the skill.** HTML kept as genesis artifact. |
| `arcade/` | 🕹️ 15 cabinets | Rack of juicy single-file neon-vector browser games (incl. Pong vs CPU, Lunar Lander, Crossing, Chomp [Pac-Man-like], **Swarm** [twin-stick survivor — drops `ws:best:swarm`], **Gyre** [Tempest-lineage tube shooter — 3 enemy types, 6 well shapes, superzapper; drops `ws:best:gyre`], **Tessera** [Qix-lineage area-claiming — flood-fill claim, Qix+Sparx+fuse; drops `ws:best:tessera`], **Centipede** [serpentine descent + segment-split — splitting chain, mushroom field, spider+flea+scorpion; headless self-test; drops `ws:best:centipede`]) |
| `strange-garden/` | 🌿 done (34) | Gallery of emergent/generative systems + Field Notes |
| `tessellarium/` | 🔷 done (companion) | **Behind the Strange Garden** — generative **ornament press** grounded in the **17 wallpaper symmetry groups** (p1 … p6m): seed a seamless ornament in any group; 4 styles (Stained/Inked/Block/Line), 8 palettes, cell-repeat slider, symmetry-axes overlay, PNG 2×. Crux = **proven symmetry**: `f(P)=motif(fold_G(P))` via exact orbit-min canonicalization → invariance true to machine precision (self-test 4/4, check #1 max err **0.0**); seed-pure + style-invariant. The Garden's ornamental cousin (grows pattern ↔ composes it). Spec `TESSELLARIUM.SPEC.md`. |
| `sound-garden/quickening.html` | 🌱 done (HIDDEN) | **The Living Lattice** — a cellular automaton you can hear (5 rule families, CA self-test, lens-clean). The 8th instrument, but **earned not listed** (NOT in `instruments.js`; rack stays at 7). Lives in the Undercroft. |
| `undercroft/` | 🗝️ done (8 secrets) | **The hidden world** (3rd growth axis) — a secret room reading `ws:` breadcrumbs; reveals earned pieces (ghost silhouettes + riddles → materialise) + an all-found capstone (now needs all 8). Holds 8, ALL trigger types demonstrated: Living Lattice (exploration), The Long Quiet (dwell), Eleven (config), The Survivor (score), **Rosette** 🌹 (combination — rarest), **The Gilded Leaf** 📜 (exploration-combo — cross-pollination #1), **The Floating Ink** 🌊 (exploration-combo — cross-pollination #2), **The Almanac** 📅 (exploration-combo — cross-pollination #3). See `UNLOCK.md`. |
| `undercroft/almanac.html` | 📅 done (HIDDEN) | **The Almanac** — a seeded perpetual **book of days** for an invented folk-calendar over the real Gregorian year, anchored to a **REAL computed sky**: real moon phase (drawn glyph + illumination %), real solstices/equinoxes, correct calendrical math (Zeller weekday, Gregorian leap rule). From `(seed, year)`: title plate + wheel-of-the-year (4 real cardinal points) + day-reader (moon/season/invented feast/weather-lore couplet/omen/season-gated husbandry counsel/weekday) + feast index; 3 cosmetic styles (Woodcut/Star-Chart/Plain-Leaf), 2× PNG. Tone: wry old-farmer's-almanac, curate-then-arrange (reads as written). Self-test 5/5 (moon ≤1d / solstices ±1d / calendar / seed-purity & style-invariance / coherence — 23k-entry sweep 0 seams). New medium: generative folklore-reference anchored to real ephemeris. Unlocked by `ws:seen:verse` ∧ `ws:seen:orrery` (orrery now self-drops its breadcrumb). Spec: `ALMANAC.SPEC.md`. |
| `undercroft/rosette.html` | 🌹 done (HIDDEN) | **Rosette** — a seeded generative Gothic **rose window** (stained glass: concentric rings, N-fold symmetry, cusped tracery, jewel glass + lead came; seed-pure, palette recolours only; 6 palettes, PNG export). A new visual medium; the rarest Undercroft secret. |
| `undercroft/codex.html` | 📜 done (HIDDEN) | **The Gilded Leaf** — a seeded generative **illuminated manuscript leaf** fusing verse × script: composes a coherent verse (Oracle-style curate-then-arrange) + invents a script hand (Scriptorium-style bijective glyph map) and writes the verse in it on a gilded parchment leaf (versal, jewel+gold border, gloss + key). Self-test 5/5 (round-trip/bijection/seed-purity). Unlocked by `ws:seen:verse` ∧ `ws:seen:scriptorium`. |
| `undercroft/floating-ink.html` | 🌊 done (HIDDEN) | **The Floating Ink** — seeded **mathematical marbling** (suminagashi · ebru): ink floated on water via exact fluid-displacement maps (**Drop** area-preserving `√(1+r²/d²)`, **Tine** comb, **Vortex** swirl); 6 recipes (rings/stone/gel-git/non-pareil/bouquet/vortex), 6 palettes, 2× PNG export. Self-test 5/5 (area-preservation A/B/C, seed-repro, palette-invariance, finiteness, tine). New visual medium (fluid-ink art). Unlocked by `ws:seen:cartographer` ∧ `ws:seen:scriptorium`. Spec: `FLOATING-INK.SPEC.md`. |

Each project has its own `CHANGELOG.md` (full provenance) and the Garden has a `SPEC.md` (house style).

## Constraints (from CLAUDE.md)
- Stay inside this folder, `/tmp`, and the job folders. Internet read-only; no side-effecting
  actions without Brandon's OK (publishing was explicitly authorized).
- Keep disk modest (< 50 GB; aiming < 1 GB). No giant files.
- Docker available if a service is needed.
