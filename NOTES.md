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

> **▶▶ MORNING SUMMARY & RESUME POINTER — 2026-06-12 (consolidated; verbose per-piece blocks follow below, reverse-chronological).**
> **An overnight `/fun` autorun (Brandon asleep — "set a heartbeat, keep at it until ~7am") shipped 16 pieces, each browser-verified, committed & pushed live; every shared surface QA'd clean (front door = 9 cards / 7 companion pills / "17 games"; every live `.html` page returns 200; front door + Undercroft re-verified with 0 console errors).** In ship order:
> 1. **The Floating Ink** 🌊 — seeded mathematical marbling (suminagashi/ebru). *Undercroft.* Crux: area-preserving ink-drop.
> 2. **Centipede** 🕹️ — Arcade #15 (serpentine descent + segment-split).
> 3. **Tessellarium** 🔷 — ornament press over the 17 wallpaper groups → **Strange Garden's companion (6th wing)**.
> 4. **Qubit** 🧩 — Arcade #16 (Q*bert-style isometric hopper).
> 5. **The Almanac** 📅 — seeded book-of-days under a REAL computed sky. *Undercroft.*
> 6. **Theogony** ⚡ — generative mythology engine (provably-acyclic kinship + self-referential myths) → **Threshold's companion (7th wing)**.
> 7–9. **Latch / Slitherlink / Akari** 🧩 — a 3-piece logic-puzzle family, each provably unique-by-logic; front-door footer `puzzles` → `latch/puzzles.html` index.
> 10. **Loomlight** 🧵 — a tactile handweaving loom (exact loom equation); footer `weave`.
> 11. **Caustic** 💡 — a steerable optical light-bench (reflection/Snell/TIR/dispersion); footer `light`.
> 12. **Slipstick** 📐 — a working slide rule / analog computer; footer `reckon`.
> 13. **Enigma** 🔐 — a mechanically-correct 3-rotor Enigma cipher machine. *Undercroft.*
> 14. **Astrolabe** 🌌 — an operable planispheric astrolabe (a sidereal rete turning over a latitude-cut plate); footer `sky`. *(instrument vein, 2nd)*
> 15. **Vanguard** 🕹️ — Arcade #17, a Galaga formation shooter (capture-beam → dual fighter).
> 16. **Abacus** 🧮 — an operable Japanese soroban (discrete arithmetic, real bead physics); footer `count`. *(instrument vein, 3rd)*
>
> **Every piece carries a built-in self-test (the workshop's verifiable-crux tradition) and ships green.** Net growth: **+2 companion wings → 7 total (the companion axis is now FULL** — every eligible front-door card has one); **Arcade → 17**; a brand-new **logic-puzzle** family (3); a brand-new **working-instruments** family (3: slide rule · astrolabe · abacus); the front-door **footer** is now a busy "extras" row (`puzzles · weave · light · reckon · sky · count · colophon`); and **several mediums the workshop lacked** — fluid-ink marbling, tactile fiber (weaving), geometric optics, working instruments, and a cipher device. **Front door deliberately UNCHANGED — still the curated 9 cards.** The **Undercroft** also grew (hidden — see its SECRETS manifest; *spoiler etiquette: don't name its trails/contents when summarizing to Brandon*).
>
> **Heartbeat cron `352fbb07`** (every ~5 min, fires only when the REPL is idle) is the accidental-stop backstop; its own prompt **self-deletes the cron after 07:00 CDT and stops** so it won't bleed into the workday. If resuming fresh after 7am, run CronList/CronDelete to be sure it's gone.
> **To resume / continue:** read this block + the per-piece detail below. **(Update 2026-06-12, later:** a 14th piece shipped — **Astrolabe 🌌** [`astrolabe/index.html`], a working planispheric astrolabe — the **instrument** vein's 2nd sibling [Slipstick→Astrolabe], reached from the front-door footer's 6th off-to-one-side link **`sky`** [`puzzles · weave · light · reckon · sky · colophon`]. Front door still the curated 9 cards. **Then a 15th piece: Vanguard 🕹️** [`arcade/games/vanguard.html`] — **Arcade #17**, a Galaga-lineage formation shooter with the signature **capture-beam/dual-fighter** twist; the clean "deepen the Arcade" axis; front door bumped to **"17 games"**, still 9 cards. Detail block at the very top.) Clean growth axes left: **deepen the Arcade** still free (Defender side-scroller + Dig-Dug tunneler remain unbuilt classics), **add a hidden Undercroft secret/trophy** (many `ws:best:`/`ws:seen:` breadcrumbs now ship and are un-trophied — including `ws:best:vanguard`), **grow a new vein's family** (instruments: abacus/sector/sundial · ciphers: Vigenère/M-209/bombe · tactile: kaleidoscope/ripple-tank), or the **bigger swing** (a 10th front-door standalone + the flat-grid redesign it implies). See the 🧹 **Curation items** lower down (back-link consistency on 6 card pages; footer "extras" grouping) — flagged for Brandon's daylight call, deliberately NOT changed overnight (outward-facing UX on core pages). **Guard context: delegate builds to self-verifying subagents; commit + push after each unit; verify live 200.**

> **▶ CURRENT STATE / RESUME POINTER (2026-06-12, `/fun` — 🧮 ABACUS shipped → the INSTRUMENT vein's 3rd sibling [Slipstick→Astrolabe→Abacus]: a genuine, operable Japanese SOROBAN, reached from the front-door footer as the 7th off-to-one-side link `count`).**
> Working tree committed & pushed (`f6f8140`); **live 200 confirmed** (page + front-door footer `count` link). **New this session (a deliberate DIVERSIFY move per the lead's nudge — explicitly steering AWAY from every over-worked vein: NOT a seeded visual "press", NOT the Arcade [17], NOT the logic-puzzle family [Latch/Slitherlink/Akari], NOT a companion [axis full at 7], NOT text/language, NOT the tactile benches [Loomlight/Caustic], NOT a cipher [Enigma], and NOT an Undercroft secret [well-stocked]. It grows the workshop's thinnest vein — *working instruments* — from two to three, with a piece genuinely DISTINCT from both siblings: where Slipstick computes ARITHMETIC by continuous LOG scales and the Astrolabe computes the CELESTIAL SKY by stereographic projection, the Abacus is DISCRETE — bead arithmetic, the integers themselves, with a discrete-correctness crux rather than a continuous one]:** built **Abacus 🧮 (`abacus/index.html`, 1121 lines, single self-contained vanilla file, 0 deps/network, NO AUDIO, no `<foreignObject>`)** — a **genuine, operable 13-rod Japanese soroban**. Each rod: 1 **heaven** bead (worth 5) above the reckoning bar + 4 **earth** beads (worth 1 each) below it; a bead counts when pushed TOWARD the bar, so `digit = heaven·5 + earth ∈ 0..9` and the frame reads up to 9,999,999,999,999. **Controls:** click beads with REAL soroban physics (clicking earth bead i slides IT and every bead between it and the bar together → digit becomes i+1, or pushes it+further-out away if already counted; heaven toggles ±5 — always a legal 0..9 digit); drag to slide; "set to…" any integer (beads animate into place, reduced-motion snaps); a **calculator strip** (operand input + `+` `−` `×` taking the current abacus value, blocking negative results — *"a soroban can't go negative"*); **7 worked examples** (7+8 carry · 12−5 borrow · 123+456 · 9999+1 cascade carry · 25×4 · 10−7 complement · 1,234,567+7,654,321); Clear/Reset; **3 cosmetic skins** (warm *hinoki* wood / ebony / blueprint — cosmetic ONLY, never touch value/digit); **2× PNG export** (paints a 2-D canvas directly — the Enigma/Slipstick no-foreignObject lesson applied up front, so `toDataURL` never taints). **THE CRUX (workshop tradition): the representation is REAL & PROVEN.** A pure CORE (`valueFromBeads`/`beadsFromValue`/`rodFromDigit`/`digitOfRod`/`clickEarthBead`/`clickHeavenBead`/`fingerprint`/`solveExample`) is the single source of truth for BOTH the renderer and a headless self-test that calls the REAL functions → green chip **"abacus verified — 9/9 ✓"** (never ships red): (1) **round-trip bijection** `valueFromBeads(beadsFromValue(n))===n` + canonicality (each rod's digit == the base-10 digit of n) across 0..5000 + every 10^p±1 + MAX/MAX−1 + thousands of randoms; (2) **digit = heaven·5+earth ∈ 0..9** for every rod state; (3) **soroban physics** — clicking earth bead i from rest gives digit i+1, toggles correctly, heaven ±5; (4) **physics legality** — thousands of random click sequences NEVER produce an illegal digit; (5) **arithmetic** — add/sub on the bead representation == JS integers incl carry/borrow cascades (9999+1=10000, MAX−1+1); (6) **7 worked examples** == true arithmetic; (7) **skin invariance** — `fingerprint(state)` (geometry only, no skin arg) identical across all 3 skins for the same value; (8) **determinism**; (9) capacity boundary. **Self-test core re-run under Node — 9/9 PASS** (browser chip == Node). **Independently re-audited by the lead in Node** (fresh first-principles assertions vs. known arithmetic, NOT the file's own test): **9 assertion-groups, 0 failed** — round-trip+canonical over ~13k samples, digit law, soroban-physics earth/heaven clicks, **20,000 random clicks all legal**, add/sub==JS integers over 5,000+ randoms+cascades, 7 examples recomputed independently, fingerprint determinism + canonical `fingerprint(1234567)`, capacity MAXV=9999999999999/RODS=13. **Browser-verified end to end by the build deputy (agent-browser, served origin `http://localhost:8973`):** green chip 9/9, the page's real `runSelfTest()` re-run in-browser = `{pass:9,total:9}`, **0 console errors / 0 warnings / 0 page-errors** across load + Set + each calc op + all 7 example chips + all 3 skins + bead clicks + PNG export; **real PointerEvent bead clicks** (units heaven→5, +earth idx2→8, tens earth idx0→18, heaven off→13 — physics correct); calculator (90909, 7+8→15, 15−5→10, 25×4→100, negative blocked); all 7 examples correct; **skin-invariant** fingerprint for 1,234,567 (value unchanged); **PNG export** a valid untainted `data:image/png` (123,694 chars, `toDataURL` did not throw); **fps 59.9** (median frame 16.7ms); screenshot at 1,234,567 reads correctly rod-by-rod with unit dots every 3rd rod. **No bug in the deliverable** — the build deputy designed the discrete CORE up front and Node passed first try (one slice-boundary bug was in the deputy's own Node harness, not the file). Canonical fingerprint (value 1,234,567, format `heaven.earth:digit` per rod, identical Node & browser) = `0.0:0|0.0:0|0.0:0|0.0:0|0.0:0|0.0:0|0.1:1|0.2:2|0.3:3|0.4:4|1.0:5|1.1:6|1.2:7`. **Wired (front door UNTOUCHED — still the curated 9 cards):** a `count ·` text link added to the front-door **footer** between `sky ·` and `colophon ·` (keeping the three instruments grouped — reckon=slide rule, sky=astrolabe, count=soroban; NOT a 10th card, NOT a companion pill, NOT an Undercroft secret); `← workshop` back-link in the topbar; a README "Also on the workbench" entry (Astrolabe → Abacus → Colophon). Spec `abacus/ABACUS.SPEC.md` + log `abacus/CHANGELOG.md` (Build 1). **No Undercroft secret added** — the `ws:seen:abacus` breadcrumb is left for future hidden-world use (an Abacus trophy is a trivial future add).
>
> **Cool ideas thought of but NOT pursued (for the lead/future sessions):** (a) the instrument vein is now a TRIO (Slipstick · Astrolabe · Abacus) and still wants siblings — a **proportional divider / sector** (Galileo's compass), a **sundial + equation-of-time** instrument, a **nomogram / alignment-chart** reader, a **circular slide rule** (the Slipstick log core wrapped), or other bead frames (a **suanpan** 2+5 Chinese abacus, a **schoty** Russian 10-bead, a **Roman hand-abacus**) — each shares the airtight discrete/analog "the reading equals the true math" crux; (b) deeper soroban — a true **digit-by-digit carry/borrow ANIMATION** (the operator's actual procedure, not just animating to the final value), the classic **multiplication/division procedures** laid out step-by-step on the rods, **complementary-number teaching overlays** (the "5's & 10's complements" a soroban student drills), or **flash-anzan** speed drills; (c) a **cross-pollination / Undercroft trophy** now that `ws:seen:abacus` ships — e.g. set the soroban to a *Firmament* star's catalogue number, or a hidden "bead-by-bead" mental-math challenge; (d) export the current setting as a tiny shareable **value string**. *(Spoiler etiquette respected — no hidden-world trail revealed.)*
>
> ---
> **(prior) ▶ CURRENT STATE / RESUME POINTER (2026-06-12, `/fun` — 🕹️ VANGUARD shipped → Arcade #17: a Galaga-lineage FORMATION SHOOTER with the signature CAPTURE-BEAM / DUAL-FIGHTER twist; the clean free-growth "deepen the Arcade" axis, front door still 9 cards).**
> Working tree committed & pushed (`8eaed3e`); **live 200 confirmed** (game page + thumb + games.js + front-door "17 games"). **New this session (the deliberate DEEPEN-THE-ARCADE move — the free growth axis that keeps the front-door footer from sprawling further; chosen over Defender-scroller / Dig-Dug per "build the one you'd most enjoy"):** built **Vanguard 🕹️ (`arcade/games/vanguard.html`, 1386 lines, single self-contained vanilla file, 0 deps/network)** — the rack's first true **Galaga/Galaxian formation shooter**, distinct from the existing Starfighter (a free-fire shmup) precisely BY the iconic mechanic Starfighter omits: the **capture beam → dual fighter**. Each wave, enemies **fly in** on swooping bezier entry paths and settle into a **5×8 formation grid** that gently breathes side-to-side (tiers: grunts / escorts / boss), then **peel off to dive-bomb** along curved attack arcs and loop back. Blaster moves ←/→ or A/D, fires Space with a **≤2-bullets-on-screen cap** (the classic feel). **THE TWIST:** a formed **boss** dives and fires a widening **tractor beam**; catch you and you're **captured** (lose a life, your ship rides inverted above the boss); fly a fresh ship and **shoot that captor** → the captive is **freed** and docks alongside into a **DUAL FIGHTER** (two ships, double muzzles ±16, +1500 RESCUE). A bomb/collision in dual mode **sunders** it back to single (no life lost); being captured while dual reverts to single + costs a life. Waves escalate; a bonus/challenging-stage flavor every 4th wave. 3 lives, full juice (entry/dive trails, capture beam, rescue burst, screen-shake, score floaters), per-wave palette rotation, **Audio_ muted:true DEFAULT + M toggle** (off — owner's speakers, middle of the night). **THE CRUX (workshop tradition): a pure, testable core drives a headless 15-check self-test** — the whole capture/dual status is one object `{mode:'single'|'dual',lives,captured,captorId,dead}` with three pure transitions (`capturePlayer` / `shootBoss`→`'rescued'` iff the shot boss IS the captor / sunder), plus `fireEmitters` (`[0]` single vs `[-16,+16]` dual), a 5×8 **slot bijection**, deterministic bounded **sway**, bezier **entry/dive path** endpoints (off-screen→slot; slot→past the player band→off-bottom), the **bullet cap**, and **collision/scoring** (boss=2 hits, grunt=1, score by value, wave-clear flips only on the last kill). Green ✓ chip **"self-test 15/15"** (never red); **the same test bodies re-run under Node = 15/15** (browser chip == Node). **Browser-verified end to end by the lead (agent-browser, UNIQUE NAMED session `vanguard-qa`, served origin):** 15/15 + green chip, **0 console errors / 0 warnings / 0 page-errors**, **fps 60**; played live — fire/move killed enemies (score 0→3460, formation 40→19), took diver/bomb hits down to 1 life, **advanced wave 1→2** (formation re-formed at 40); the **capture→rescue→dual** exercised end-to-end in one synchronous tick (captured: lives 3→2, `captured=true`, captorId set; shoot that captor → `isDual=true`, `playerAlive=true`, capture cleared); GAME OVER screen renders clean. **No bug found** — the build deputy designed the capture machine + paths + formation + collision as pure functions up front and the Node harness passed 15/15 first try; one *apparent* "player stuck dead after rescue" was just the live game loop (a diver sundered the dual during multi-second sleeps between my evals) — re-tested in one synchronous eval, the rescue is correct. **Wired (front door UNCHANGED — still the curated 9 cards):** appended to `arcade/games.js` (now **17**, accent `#37d6ff` electric-blue — distinct from Starfighter's magenta); `arcade/assets/thumbs/vanguard.png` is a **real in-game capture normalized to 1440×900** (formation grid + diving enemies + score floaters + the DUAL fighter + green chip); front-door Arcade card bumped **`tag:"16 games"`→`"17 games"`** and **`Vanguard`** appended to its blurb list; `← arcade` back-link present; `ws:best:vanguard` = best **score** (raise-only, try/catch-guarded). Log `arcade/CHANGELOG.md` (Done list → 17, Log entry, manifest 16→17). **No Undercroft secret added** — `ws:best:vanguard` is a breadcrumb left for future hidden-world use (a Vanguard trophy — e.g. *"formed a dual fighter"* — is a trivial future add).
>
> **Cool ideas thought of but NOT pursued (for the lead/future sessions):** (a) the Arcade still has clean classics-shaped gaps — a **Defender/Scramble horizontal side-scroller** (scrolling terrain + fuel + rescue + minimap) and a **Dig-Dug tunneler** (dig/pump-inflate/drop-rocks) were the other two candidates this session and remain unbuilt; also **Galaxian-style** challenging-stage-only bonus rounds, a **Time Pilot** free-scroll dogfight, or a **Bosconian** base-buster; (b) a **Vanguard Undercroft trophy / cross-pollination** now that `ws:best:vanguard` ships — *"the dual fighter"* (form one) or *"triple"* (a hidden third-ship variant), or a Vanguard whose star-field is a *Firmament* sky; (c) deeper Vanguard — a real **Galaga challenging stage** scored on hit-% (the bezier patterns are already there), the **dual-fighter's wider hitbox** as a risk/reward, a captured-fighter **rescue-chain** for combo bonuses, or **named formation patterns** per wave; (d) export a run as a tiny shareable **score/seed string**. *(Spoiler etiquette respected — no hidden-world trail revealed.)*
>
> ---
> **(prior) ▶ CURRENT STATE / RESUME POINTER (2026-06-12, `/fun` — 🌌 ASTROLABE shipped → the INSTRUMENT vein's 2nd sibling [Slipstick→Astrolabe]: a genuine, operable planispheric astrolabe, reached from the front-door footer as the 6th off-to-one-side link `sky`).**
> Working tree committed & pushed; live 200 confirmed. **New this session (a deliberate DIVERSIFY move — explicitly steering AWAY from every over-worked vein: NOT a seeded visual "press", NOT the Arcade [16], NOT the logic-puzzle family [Latch/Slitherlink/Akari], NOT a companion [axis full], NOT text/language [verse/script/IF/almanac/myth], NOT the tactile benches [Loomlight/Caustic], NOT a cipher [Enigma], and NOT an Undercroft secret [well-stocked]. It grows the workshop's THINNEST vein — *working instruments* — from one to two, with a piece genuinely distinct from its sibling: where Slipstick computes ARITHMETIC, the Astrolabe computes the CELESTIAL SKY; and distinct from the watch-only Firmament/Orrery in that it is a TOOL YOU OPERATE — set date+time+latitude and read where the Sun & stars stand]:** built **Astrolabe 🌌 (`astrolabe/index.html`, 1335 lines, single self-contained vanilla file, 0 deps/network, NO AUDIO)** — a **genuine, operable planispheric astrolabe**, the "computer of the medieval sky." Set your **latitude** → the brass **plate** is re-cut for it (a ladder of *almucantars* = circles of equal altitude, + azimuth arcs, the horizon emphasized, tropic/equator day-circles, zenith mark, day/night shading); set the **date** → the Sun rides the tilted golden **ecliptic** through the 12 zodiac signs; set the **time** (or "now") → the openwork **rete** (the star map carrying ~40 of the brightest J2000 named stars + the ecliptic ring) turns over the plate with **sidereal time**, exactly as the sky does. **Controls:** latitude / day-of-year / local-time / longitude sliders, "set to now", reset, **drag the disc to spin** the rete, a reduced-motion-aware **spin** animation (watch the sky turn), **4 presets** (equinox sunrise / midsummer midnight / Polaris over the pole / a city tonight), **3 cosmetic skins** (brass / blueprint / paper — cosmetic ONLY, never touch the projection), an **alidade**, a **plain-language live readout** ("Sun in Cancer 1° — altitude −51° — below the horizon, it is night"), and **2× untainted PNG export** (canvas-native, NO `foreignObject`, so no taint — the Enigma lesson applied up-front). **THE CRUX (workshop tradition): the projection is REAL & PROVEN.** A pure math CORE (`rOfDec`/`decFromR`, closed-form `almucantar`/`azimuthCircle`, `altAzToDecH`/`decHToAltAz`, `projDecH`, `julianDate`/`gmstDeg`/`lstDeg`, solar longitude/dec/RA + `sunPosition`, `eclipticCircle`/`eclipticPoint`, a fixed 40-star J2000 catalogue + `projStar`, a skin-independent `geometryFingerprint`) is the single source of truth for BOTH the renderer and the headless self-test → green chip **"projection verified — 18/18 ✓"** (never ships red): almucantar exactness (now **10 lats N&S × 6 alts**, sampled alt/az→dec/H→projected points lie on the closed-form circle to `<1e-5·Req`); projection a faithful **bijection** (`decFromR∘rOfDec`); tropic ordering (Capricorn rim > equator=Req > Cancer); **the Sun lands on its own almucantar** (its altitude read two independent ways agrees); ecliptic-circle through both solstice radii; **fingerprint deterministic + identical across all 3 skins** (the "style only re-renders" invariant). **Self-test core re-run under Node — 18/18 PASS** (browser chip == Node). **Independently re-audited by the lead in Node (fresh first-principles assertions vs. KNOWN ASTRONOMY, NOT the file's own test): 48 assertions — and the audit FOUND A REAL BUG the build test had missed.** Asserted: noon-transit altitude `= 90−|lat−dec|` across lats×decs; the **equinox Sun rises due east** at the equator; **GMST at J2000 ≈ 280.46°**; the 2026 vernal-equinox & summer-solstice solar longitudes (≈0° / ≈90°); a star transits (H=0, sits on the meridian) when LST=RA; Polaris projects near center; ecliptic/azimuth-circle exactness; fingerprint determinism+skin-invariance. **THE BUG:** sweeping latitudes the file's own test omitted (it only used 5 *northern* lats), the audit caught the closed-form `almucantar` **radius going NEGATIVE for southern (φ<0) latitudes** when `sin φ + sin alt < 0` → a southern plate's almucantars were wrong/blank (worst error ~2.3e4 px). **Root cause + fix:** the center `cy` is exact for every latitude, but the radius is a *magnitude* — `r = |Req·cos(alt)/(sin φ + sin alt)|`. One-line abs-fix → worst error drops to **~6e-10 px** across both hemispheres (φ −66…66); and I **hardened the file's own self-test to sweep 10 lats N&S** (skipping the equator's horizon φ=0,alt=0, which is correctly a straight line / infinite radius, not a circle) so the gap can't regress. **Re-verified end to end** (agent-browser, served origin, by the lead): chip green 18/18, the page's real `runSelfTest()` re-run in-browser = 18/18, **0 errors thrown across the full battery** (load, all sliders to both extremes incl. both poles, all 4 presets, all 3 skins, spin on/off, set-to-now, reset); **lat −52 plate now renders a correct full astrolabe** (Canopus/Achernar/Hadar in play — screenshot-confirmed); fingerprint skin-invariant at the southern state; **PNG `toDataURL` = a valid 286,666-char untainted data-URL**; `ws:seen:astrolabe=1` set (try/catch-guarded); 0 `<audio>/<video>` elements. Canonical fingerprint (lat 40, 2026-06-21T04:00Z) = **`3ff48c40`** (unchanged by the fix — lat 40 is northern). **Wired (front door UNTOUCHED — still the curated 9 cards):** a `sky ·` text link added to the front-door **footer** between `reckon ·` and `colophon ·` (the same off-to-one-side pattern; keeps the two instruments adjacent — reckon=slide rule, sky=astrolabe; NOT a 10th card, NOT a companion pill, NOT an Undercroft secret); `← workshop` back-link in the topbar; a README "Also on the workbench" entry (Slipstick → Astrolabe → Colophon). Spec `astrolabe/ASTROLABE.SPEC.md` + log `astrolabe/CHANGELOG.md` (Build 1 + the southern-hemisphere-fix note). **No Undercroft secret added** — the `ws:seen:astrolabe` breadcrumb is left for future hidden-world use.
>
> **Cool ideas thought of but NOT pursued (for the lead/future sessions):** (a) the instrument vein is now a PAIR and still thin — natural siblings remain an **abacus / soroban** (bead arithmetic, a discrete-correctness crux), a **proportional divider / sector** (Galileo's compass), a **sundial + equation-of-time** instrument, a **nomogram/alignment-chart** reader, or a **circular slide rule** (the existing Slipstick log core wrapped); (b) the astrolabe's own depth: the **back of the instrument** (the dorsum — a shadow-square + alidade to *measure* an altitude, then the front auto-solves the time from it), a **"star-time stopwatch"** (pick a star → spin the rete to its rise/transit/set and draw the arc of its night), or **unequal/seasonal hour lines** below the horizon; (c) a **cross-pollination / Undercroft trophy** now that `ws:seen:astrolabe` ships — e.g. an astrolabe set to find a *Firmament* invented star, or "find the time" from a measured altitude; (d) export the current setting as a tiny shareable **state string** (lat · date · time · lon). *(Spoiler etiquette respected — no hidden-world trail revealed.)*
>
> ---
> **(prior) ▶ CURRENT STATE / RESUME POINTER (2026-06-12, `/fun` — 🔐 ENIGMA shipped → a BRAND-NEW VEIN [a working CRYPTOGRAPHIC DEVICE] AND a new SUBJECT [ciphers/codes the workshop had nowhere], placed as the Undercroft's 9th secret — NOT a 10th front-door card, NOT a new footer link).**
> Working tree committed & pushed; live 200 confirmed. **New this session (a deliberate DIVERSIFY move — explicitly steering AWAY from every over-worked vein: NOT a seeded visual "press", NOT the Arcade [16], NOT the logic-puzzle family [Latch/Slitherlink/Akari], NOT a companion [axis full], NOT text/language [verse/script/IF/almanac/myth], NOT the tactile-physics benches [Loomlight/Caustic], and — though it's the closest cousin — NOT just another arithmetic instrument like Slipstick. It opens a vein the workshop entirely lacked: a real working CRYPTOGRAPHIC DEVICE, whose correctness is *information* (a cipher), not arithmetic or physics. And it deliberately does NOT add a front-door footer link [footer already carries puzzles/weave/light/reckon/colophon/source] — instead it lives in the hidden world, where codes belong]:** built **Enigma 🔐 (`undercroft/enigma.html`, 1072 lines, single self-contained vanilla file, 0 deps/network, NO AUDIO)** — a **genuine, mechanically-correct three-rotor Enigma I** (Wehrmacht/Heer) you operate. Real historical rotor wirings (I–V + turnover notches), reflectors **UKW-B/UKW-C**, the **plugboard** (≤10 reciprocal steckers, click-to-pair), **ring settings** (Ringstellung) implemented correctly, and a settable **start position** (Grundstellung). Type on the QWERTZ keyboard (or your own keys): the rotors **step** (with the famous **double-step anomaly**) before each letter, a **lamp lights**, and a **live signal-path trace** threads the current keyboard→plugboard→right→mid→left rotor→reflector→back→lamp — *watch the machine think*. A transcript encrypts live in 5-letter groups; because Enigma is **reciprocal**, a "reset to start" button lets you type the ciphertext back and read the plaintext out. **3 cosmetic skins** (Heeres field-grey bakelite / Brass museum / Blueprint schematic — cosmetic ONLY, never touch the cipher), **2× PNG export** (canvas-native), reduced-motion respected. **THE CRUX (workshop tradition): the cipher is REAL & PROVEN.** A pure crypto core (`makeMachine`/`stepMachine`/`thruRotor`/`encLetter`) is the single source of truth for BOTH the renderer and a headless self-test that calls the REAL functions → green chip **"cipher verified — 12/12 ✓"** (never ships red): (1) **historical test vectors, EXACT** — I·II·III/B/rings AAA/start AAA/no plugs: `AAAAA → BDZGO`; the documented German-Wikipedia **"Aachen" daily key** (I·IV·III/B/rings P·Z·H/10 steckers/start RTZ) reproduced byte-for-byte (pins wiring + ring/offset math + stepping); (2) **the double-step anomaly** asserted against a computed position trace (ADU → ADV → AEW → BFX — middle steps on two consecutive presses, dragging the left rotor); (3) **reciprocity / self-inverse** — 2000+ random settings: encrypt then decrypt from the same start returns the original exactly; (4) **no fixed point** — across a large sweep, no letter ever encrypts to itself (0 violations — the famous weakness); (5) **reciprocal lamp** — in any fixed state X↔Y (the permutation is an involution); plugboard & reflector are involutions; all rotor wirings are valid permutations; (6) **determinism + skin invariance** — identical settings ⇒ identical ciphertext byte-for-byte, and the skin NEVER changes a ciphertext (fingerprint identical across all 3 skins — the "style only re-renders" invariant). **Self-test core re-run under Node — 12/12 PASS** (browser chip == Node). **Independently re-audited by the lead in Node** (fresh first-principles assertions, NOT the file's own test): **17 assertions, 0 failed** — 3000-trial reciprocity round-trip, ~37k enciphered letters with 0 fixed points, a 3000-state reciprocal-lamp involution sweep, `AAAAA→BDZGO`, the double-step trace, permutation/involution validity, determinism. **Browser-verified end to end** (agent-browser, served origin, by the build deputy AND re-confirmed by the lead): green 12/12 chip, the page's real `runSelfTest()` re-run in-browser = 12/12, **0 console errors / 0 warnings / 0 page-errors**; typed a live message (lamp lit, rotors stepped to AAS, the forward+reflected path rendered through the contacts), loaded the worked presets, switched all 3 skins (ciphertext fingerprint `ff5adfbc` unchanged), did the reciprocity round-trip (ATTACKATDAWN → cipher → back to ATTACKATDAWN), 2× PNG export valid (~1MB data-URL, 1520×1120), `ws:seen:enigma=1` set (try/catch-guarded), ~0.5 ms/keypress (comfortable 60fps); **screenshot visually confirms** the lit lamp + the live KEY→PLUG→III→II→I→UKW-B→back→lamp signal-path trace. **Two real bugs found & root-caused:** (a) a test vector in my build brief (a purported "ECSHL" worked example) was **wrong** — an exhaustive 26⁶ ring×start sweep under a correct engine found NO faithful Enigma producing it; the deputy validated the ring/stecker math against the documented Aachen example (reproduced byte-for-byte) and replaced the bad vector [the math was right, the brief's vector was bogus]; (b) the first PNG export tainted the canvas in headless Chromium (an SVG `foreignObject` taints even trivially → `SecurityError` on `toDataURL`) → rewritten to paint the machine face directly onto a 2-D canvas (the Slipstick pattern). **Wired (front door UNTOUCHED — still the curated 9 cards, and NO new footer link):** registered as a new `SECRETS` row in `undercroft/index.html` (badge 🔐, accent `#9bb2c0`, gated on a thematic cross-pollination — *the scribe's hidden hand × the reckoner's wheels*); backlink `← the undercroft → index.html`; drops `ws:seen:enigma` for future hidden-world use (an Enigma trophy — e.g. "broke a message" — is a trivial future add). Spec `undercroft/ENIGMA.SPEC.md` + Undercroft `CHANGELOG.md` (Build 7). **README NOT yet touched** (Enigma is a hidden room, listed nowhere on the public front — by design; spoiler etiquette).
>
> **Cool ideas thought of but NOT pursued (for the lead/future sessions):** (a) the new "working cryptographic device / encoding" vein is the workshop's newest and thinnest (just this one) and wants siblings — natural non-game/non-puzzle CODE machines: a **Vigenère / cipher-disk** (Alberti disk you rotate; provable: encrypt∘decrypt = id), a **Playfair / Polybius / ADFGVX** classical-cipher bench, a **one-time-pad** demonstrator (perfect secrecy you can *see*), a **Hagelin M-209 / pin-and-lug** machine (another mechanical cipher, a lovely sibling to Enigma), or — going the other way — a **bombe / known-plaintext attack** visualizer that *breaks* an Enigma message (the Turing side of the story; provable against the ciphertext); (b) an **Enigma Undercroft TROPHY** now that `ws:seen:enigma` ships — e.g. *"the codebreaker"* (decrypt a planted message back to a known phrase) or *"a daily key"* (set rings+steckers to match a given indicator) — trivial high-charm hidden-world fodder; (c) deeper machine — the **Kriegsmarine M3/M4 4-rotor** (the naval Enigma, with thin rotors β/γ + UKW-B/C-thin) and **rewirable UKW-D**, or a **rings-vs-position teaching overlay** that animates *why* the Ringstellung shifts the output; (d) export a setting as a tiny shareable **daily-key string** (rotor order · rings · steckers · indicator). *(Spoiler etiquette respected — the Enigma's unlock TRAIL/CONTENTS are not named here in any celebratory summary; the gate condition lives only in the SECRETS manifest + this internal note.)*
>
> ---
> **(prior) ▶ CURRENT STATE / RESUME POINTER (2026-06-12, `/fun` — 📐 SLIPSTICK shipped → a BRAND-NEW VEIN: the workshop's first INSTRUMENT, a genuine working slide rule / analog computer, reached from the front-door footer as a 5th off-to-one-side link `reckon`).**
> Working tree committed & pushed; live 200 confirmed. **New this session (a deliberate DIVERSIFY move — explicitly steering AWAY from every over-built vein: NOT another seeded visual "press", NOT the logic-puzzle trio [Latch/Slitherlink/Akari], NOT the 16-cabinet Arcade, NOT a companion [all 7 wings full], NOT audio, AND deliberately NOT the new tactile-physics-bench pair [Loomlight + Caustic]. It opens a vein the workshop entirely lacked — a real working DEVICE/INSTRUMENT that *does something real*, here computational arithmetic rather than a physics simulation]:** built **Slipstick 📐 (`slipstick/index.html`, 1102 lines, single self-contained vanilla file, 0 deps/network, NO AUDIO)** — a **genuine, draggable slide rule**. Not art to watch, not a game, not a puzzle: a real analog computer whose correctness is *arithmetic*. The user grabs the **slide** (middle strip) and slides C's index over a number on D, then reads products straight off — the rule *does* multiplication because `log a + log b = log(a·b)` — and drags a glass **hairline cursor** to read every aligned scale at once. **Scales drawn by EXACT base-10 log positioning:** C/D (1 cycle, the multiply pair), A/B (2 cycles, squares), K (3 cycles, cubes), CI (reciprocal of C, red, runs right→left), L (linear mantissa = log₁₀ read directly), and a **flip-out trig face** S (sin) / T (tan). **Live readout** decodes whatever the rule is set to in plain arithmetic (`D 2 × C 3 = D 6`) + a per-scale value strip; **7 one-click worked examples** (2×3, 7×8, 355÷113 ≈ π, √50, 2.5³, sin 30°, tan 45°) animate the rule into place and show read-vs-exact with the reading error; an honesty "decade lamp" note reminds you a slide rule gives **significant figures, not the decimal point** (you supply the power of ten). **3 cosmetic skins** (Boxwood / ivory Mannheim / Blueprint — cosmetic ONLY, never move a tick), **2× PNG export**, reduced-motion respected. **THE CRUX (workshop tradition): the arithmetic is PROVEN.** A pure layout core (`scalePos`/`readScale`) is the single source of truth for BOTH drawing and the headless self-test (the test calls the REAL functions, not a copy) → green chip **"rule verified — 13/13 ✓"** (never ships red): (1) **round-trip exactness** `readScale(s, scalePos(s,v))==v` to <1e-12 across all 9 scales (18,009 samples); (2) **the slide-rule theorem** — C-index-over-D=a, read D under C=b yields `a·b` (3,600 pairs) + division inverse (1,600) to <1e-12; (3) **aligned scale relationships** at a common cursor x — A=D², K=D³, C·CI=10, L=log₁₀D (1,000 x each) to <1e-12 (*why* the cursor reads squares/cubes/reciprocals/logs at once); (4) **trig consistency** — D-read under S = 10·sinθ, under T = 10·tanθ (1,000 each) to <1e-12; (5) **worked-example honesty** — exact-math path exact (<1e-9), pixel-read path within ~3-sig-fig slide-rule precision; (6) **skin invariance & finiteness** — tick-layout fingerprint identical across all 3 skins (style only re-renders), all positions finite & monotonic. **Self-test core extracted & re-run under Node — 13/13 PASS** (browser fingerprint == Node fingerprint, proving identical math). **Browser-verified end to end** (agent-browser, served origin, by the build deputy AND independently re-confirmed by the lead): chip green `selftest ok` "rule verified — 13/13 ✓", the page's real `runSelfTest()` re-run in-browser returns 13/13, **0 console errors / 0 warnings / 0 page-errors** across the full battery — a real-PointerEvent **slide drag** (`hitTest`→`'slide'`; readout `D 1.06 × C 4.73 = D 5`, the product preserved as the slide moves, exactly as a real rule behaves), a **cursor drag**, all **7 worked-example chips** reading correctly (2×3→6 exact; 355÷113→3.14 / Δ0.05%; √50→7.07; 2.5³→15.6 / Δ0.16%; sin 30°→0.5), all **3 skins** with byte-identical fingerprint, **flip to trig and back**, **2× PNG export** valid (148,734-char data-URL); `ws:seen:slipstick=1` breadcrumb set (try/catch-guarded, plays from `file://`); the **2×3=6 multiplication setup visually confirmed** in a screenshot (C-index over D=2, hairline on C=3, reading 6 on D). **Bugs found & root-caused by the deputy (all caught by Node before browser):** four half-open-decade boundary issues in the test sweeps (single-cycle C/D/CI wrap at the decade edge → use `[lo,hi)`); a multi-decade range reduction for the cube worked-example check; and a **CI-convention correction** — a CI scale reads 1/x as a *mantissa*, so the true invariant is **C·CI = 10** across the open decade, not a literal CI = 1/x (the assertion was wrong-by-convention, the rule was right). **Wired (front door UNTOUCHED — still the curated 9 cards):** a `reckon ·` text link added to the front-door **footer** between `light ·` and `colophon ·` (the same off-to-one-side pattern as puzzles/weave/light — NOT a 10th card, NOT a companion pill, NOT an Undercroft secret); `← workshop` back-link in Slipstick's topbar; an "Also on the workbench" README entry (Caustic → Slipstick → Colophon). Spec `slipstick/SLIPSTICK.SPEC.md` + log `slipstick/CHANGELOG.md` (Build 1). **No Undercroft secret added** — the `ws:seen:slipstick` breadcrumb is left for future hidden-world use (a Slipstick trophy is a trivial future add).
>
> **Cool ideas thought of but NOT pursued (for the lead/future sessions):** (a) the brand-new "instrument" vein this opens is the workshop's thinnest (just this one) and wants siblings — natural non-puzzle/non-game working DEVICES the workshop lacks: an **astrolabe / planisphere** you set to a date+latitude to find the sky (a celestial-vein instrument, distinct from the watch-only Firmament/Orrery — it's a *tool you operate*), a **proportional divider / sector** (Galileo's compass), a **circular/cylindrical slide rule** (the same log core wrapped — trivially provable from the existing `scalePos`), a **nomogram / alignment-chart** reader (draw a chart for a 3-variable formula, drag a straightedge), an **abacus** (soroban — bead arithmetic, a discrete-correctness crux), or a **sundial / equation-of-time** instrument; each shares Slipstick's airtight "the reading equals the true math" crux; (b) a **Slipstick Undercroft trophy or cross-pollination** — e.g. a hidden "log-log LL scale" unlocked by a discovery, or a rule that computes a Firmament star's magnitude / a Cartographer distance — trivial high-charm hidden-world fodder now that `ws:seen:slipstick` ships; (c) deeper rule — **log-log (LL) scales** for arbitrary powers `x^y` and **e^x**, a **folded CF/DF** scale for π-shifted products, or a **second cursor hairline** for chained computations; (d) export the current setting as a tiny shareable **state string** (slide offset + cursor position). *(Spoiler etiquette respected — no hidden-world trail revealed.)*
>
> ---
> **(prior) ▶ CURRENT STATE / RESUME POINTER (2026-06-12, `/fun` — 💡 CAUSTIC shipped → a BRAND-NEW VEIN & SUBJECT: a steerable OPTICAL light-bench (geometric optics / refraction), the workshop's 2nd tactile toy, reached from the front-door footer as a 4th off-to-one-side link `light`).**
> Working tree committed & pushed; live 200 confirmed. **New this session (a deliberate DIVERSIFY move — explicitly steering AWAY from the over-built veins: NOT another seeded visual "press", NOT enlarging the logic-puzzle trio / the 16-cabinet Arcade / the 2×4 Sound Garden, NOT a companion [all 7 wings full], NOT audio. It opens the UNDER-used "interactive tactile toy" vein [Loomlight was the first] with a SUBJECT the workshop had nowhere — LIGHT & geometric optics. The Strange Garden has a passive watch-only `harmonograph.html` Lissajous specimen, but nothing steerable and nothing about refraction; Caustic is a sandbox you drive]:** built **Caustic 💡 (`optics/index.html`, 1585 lines, single self-contained vanilla file, 0 deps/network, NO AUDIO)** — a **steerable 2D optical light-bench you arrange**. The user drops & **drags** optical elements onto a dark bench (real PointerEvents + a ring rotate-handle + click-to-select → contextual sliders) and **light re-traces live every frame**: **Emitter** (fan / beam / point; white / hue / **spectrum** = a wavelength-tagged rainbow fan), **Mirror** (law of reflection), **Lens** (ideal thin-lens ray transfer, signed focal length f — converging/diverging), **Prism** (solid glass triangle; Snell refraction in & out, **total internal reflection** at steep internal angles, **Cauchy dispersion** so white light fans into a true ordered rainbow), **Block** (opaque absorber), **Droplet** (glass disc, curved-surface refraction). **It is NOT a puzzle and NOT a game** (no win state / no score) — the joy is steering beams and watching the rainbow/focus form. **6 curated presets** (Prism · Spectrum · Focus · Kaleidoscope · Total Internal Reflection · Droplet), a **seeded re-rollable bench** (`buildScene(seed)` pure → reproducible layout, same seed ⇒ byte-identical), **3 cosmetic skins** (Blueprint / Spectral / Graphite — cosmetic ONLY, never touch the physics), trails/glow, clear, delete-selected, **2× PNG export**, reduced-motion respected. **THE CRUX (workshop tradition): the optics is PHYSICALLY REAL, PROVEN.** A headless self-test calls the REAL trace/optics functions (`reflect`/`refract`/`thinLensTransfer`/`cauchyIndex`/`traceScene`/`buildScene` — not a parallel copy) and shows a green **"optics verified — 7/7 ✓"** chip (never ships red): (1) **reflection law** — angle in == angle out about the normal + double-reflect identity; (2) **Snell exactness** — `n1·sinθi = n2·sinθt` to <1e-9 + a parallel-faced slab emerges **parallel** (lateral shift only); (3) **TIR threshold** — glass→air above the critical angle `asin(1/n)` reflects, just below transmits, boundary to <1e-6; (4) **thin-lens focusing** — a bundle **parallel to the optical axis** (any angle/any f>0) converges to a single focal point at distance f to <1e-6, center ray undeviated, f<0 virtual focus; (5) **dispersion ordering** — `n(λ)` monotone decreasing, blue bends more than red, prism deviation strictly violet>green>red; (6) **energy non-increasing + guaranteed termination** (adversarial mirror-box, maxBounces); (7) **seed purity / style-invariance** — same seed ⇒ identical scene fingerprint, diff seed differs, and the **ray-trace fingerprint is identical across all 3 skins** (the workshop's signature "style only re-renders" invariant). **Self-test core extracted & re-run under Node — 7/7 PASS.** **Independently re-audited by the lead in Node** (fresh first-principles assertions, NOT the file's own test): **13,345 assertions, 0 failed** — reflection (3000 geometries) + Snell to 1e-9 (5,239 transmitted samples) + parallel-slab + TIR critical-angle (800 cases) + thin-lens parallel-bundle→focal-point to 1e-6 + center-ray undeviated + Cauchy monotonicity + violet>green>red deviation + seed purity; the file's own 7/7 re-confirmed. **Browser-verified end to end** (agent-browser, served origin, by the build deputy AND re-confirmed by the lead): chip green `selftest ok` "optics verified — 7/7 ✓", **0 console errors / 0 warnings / 0 page-errors** across the full battery (load, all 6 presets, all 3 styles, two re-rolls, a real-PointerEvent prism drag, prism-index slider →1.85, lens focal sweep 260→400→−300, PNG ×2 export); chip stayed green through every preset switch; `ws:seen:optics=1` breadcrumb set (try/catch-guarded, plays from `file://`); the **Prism preset visually confirmed** — a near-white collimated beam enters the glass, bends twice, and fans into an ordered rainbow (violet most-deviated through red), the canonical Dark-Side shot. **Two real bugs found & fixed by the deputy (root cause):** (a) a **lens optical-axis convention mismatch** (`elementSurfaces` used `ang` as the axis but the test/presets assumed `ang−π/2`, so the parallel bundle never met the lens plane and the focusing check failed → standardized on axis=`ang` everywhere); (b) a **degenerate dispersion-test geometry** (the test ray grazed the prism base and TIR'd, masking the λ-ordering — physics was right, geometry wrong → rewrote to the classic two-slanted-face path → strict violet-most ordering). **Wired (front door UNTOUCHED — still the curated 9 cards):** a `light ·` text link added to the front-door **footer** between `weave ·` and `colophon ·` (the same off-to-one-side pattern as puzzles/weave/colophon — NOT a 10th card, NOT a companion pill, NOT an Undercroft secret); `← workshop` back-link in Caustic's topbar; an "Also on the workbench" README entry (Loomlight → Caustic → Colophon). Spec `optics/CAUSTIC.SPEC.md` + log `optics/CHANGELOG.md` (Build 1). **No Undercroft secret added** — the `ws:seen:optics` breadcrumb is left for future hidden-world use (a Caustic secret/trophy is a trivial future add).
>
> **Cool ideas thought of but NOT pursued (for the lead/future sessions):** (a) the "tactile toy" vein is now a PAIR (Loomlight, Caustic) and is still the workshop's thinnest — natural non-puzzle/non-audio siblings remain a **spirograph/harmonograph drawing toy you steer** (distinct from the Garden's passive specimen), a **string-art / pin-and-thread** board, a **verlet cloth/rope you drag**, a **gear-train / linkage you crank**, a **ripple-tank / wave-interference** bench (a natural optics cousin — Huygens/double-slit, still provable), each with a verifiable geometric/physical crux; (b) a **Caustic Undercroft trophy or cross-pollination** — e.g. a hidden "lens that focuses a Firmament star into a caustic" or a prism that spells a Scriptorium glyph — trivial high-charm hidden-world fodder now that `ws:seen:optics` ships; (c) deeper optics — a true **curved-surface lens** ray-traced through two spherical faces (vs the ideal thin-lens), **caustic envelope** rendering (the bright fold a lens/droplet casts — the piece's namesake, only lightly realized), **chromatic aberration** through the lens (dispersion in glass lenses too), or a **rainbow/halo** simulation through a water droplet (the 42° primary bow); (d) a **fiber-optic / waveguide** element that traps light by TIR (a bendy light-pipe); (e) export the bench as a tiny **shareable seed/scene string**. *(Spoiler etiquette respected — no hidden-world trail revealed.)*
>
> ---
> **(prior) ▶ CURRENT STATE / RESUME POINTER (2026-06-12, `/fun` — 🧵 LOOMLIGHT shipped → a NEW VEIN: the workshop's first TACTILE TOY (handweaving), reached from the front-door footer as a 3rd off-to-one-side link `weave`).**
> Working tree committed & pushed; live 200 confirmed. **New this session (a deliberate DIVERSIFY move — explicitly steering AWAY from the over-built veins: NOT another seeded visual "press", NOT enlarging the logic-puzzle trio / the 16-cabinet Arcade / the 2×4 Sound Garden, NOT a companion [all 7 wings full], NOT audio. Instead it opens the UNDER-used "interactive tactile toy" vein and a brand-new SUBJECT — fiber craft, which the workshop had nowhere [the Sound Garden's "Loom" is an *audio* instrument; Ariadne weaves *Celtic knots*]):** built **Loomlight 🧵 (`loom/index.html`, 1208 lines, single self-contained vanilla file, 0 deps/network, NO AUDIO)** — a **tactile digital handweaving loom you poke**. The user edits the three structures that fully describe a floor loom — **threading** (`int[W]`: which shaft each warp end rides), **tie-up** (`bool[T][S]`: which shafts each treadle raises), **treadling** (`int[P]`: the pick order) — plus per-thread **warp/weft yarn colors**, and woven cloth **re-weaves live**. **It is NOT a puzzle (no win state / no unique-solution generation) and NOT a game** — the joy is manipulating the loom and watching cloth appear. Standard handweaving **draft layout** on one Canvas (threading strip top · tie-up corner top-right · treadling strip right · drawdown/cloth main field bottom-left · paintable warp+weft color bands). **Direct manipulation (real pointer events, drag-paint):** click a threading cell → cycle that end's shaft (drag = paint a run) · click a tie-up cell → toggle · click a treadling cell → cycle the treadle (drag = paint) · click a yarn-color band → cycle the yarn (drag = paint color runs, e.g. log-cabin) · the drawdown is read-only (it's the *result*) but **hovering it lights up the contributing threading end + treadling pick + tie-up cell and shows the loom equation live** (a teaching moment). **10 presets** (plain · 2/2 twill · 1/3 · 3/1 · herringbone · satin m=2 · satin m=3 · basket · rosepath · waffle) + a seeded **"surprise me"** (reproducible) + shaft/treadle selector (2,3,4,5,6,8) + warp/weft count sliders (16–64) + 5 curated yarn palettes + **Cloth⇆Draft** view toggle + Clear + **2× PNG export**. Two render modes: **Cloth** (tactile — each cell a shaded directional fibre, warp vertical / weft horizontal, soft bump + drop shadow so floats read raised; feels like fabric) and **Draft** (the technical filled/empty notation a weaver reads); toggling view + switching palette never change the underlying draft (cosmetic-only crux). **THE CRUX (workshop tradition): the cloth is EXACTLY the loom equation, PROVEN.** Single source of truth is the drawdown `D[p][e] = tieup[treadling[p]][threading[e]]` (pure `computeDrawdown`, no DOM); displayed color = `warpColors[e]` if `D` else `weftColors[p]`. **Self-test 8/8 PASS** (green chip "weave verified — 8/8 ✓", never ships red): (1) **loom-equation exactness** — for every preset + random seeds, independently recompute `D` from the equation and assert it equals the renderer's source matrix AND the displayed colors per the color rule; (2) **plain weave** strictly alternates / max float 1; (3) **2/2 twill** all floats length 2 + diagonal steps by exactly 1 (checked toroidally over the structural period — the correct float definition on repeating cloth); (4) **1/3 & 3/1 twill** float lengths exactly {1,3}; (5) **satin** 5-end m∈{2,3}: gcd(m,5)==1 + raised warp points isolated (no two adjacent on any row OR column — the satin-validity proof); (6) **color-and-weave** log-cabin displays colors exactly per `D`; (7) **seed purity / view-invariance** same seed ⇒ byte-identical draft fingerprint, fresh seed differs, view+palette cosmetic-only. **Self-test core extracted & re-run under Node — all PASS.** **Browser-verified end to end** (agent-browser, served origin, by the lead): chip green 8/8, **0 console errors / 0 warnings / 0 page-errors** across the full battery (4 loads, all presets, shaft change, both views, all palettes, seed reproduce-byte-identical, re-roll, color paint, PNG export); **real PointerEvents** exercised — threading edit (shaft 3→0, loom equation exact / only that end changed), tie-up toggle (true→false, exact), treadling cycle (1→2, exact), warp-color paint (changed), hover highlight (drawdown cell sets the live highlight); PNG export produced a valid ~1.1MB image; same seed reproduces a byte-identical draft, a different seed differs; plays from `file://` (all `localStorage` try/catch-guarded); 60fps (static canvas, redraws only on interaction). **One build-test artifact (NOT an app bug):** my first interaction probe read `draftSnapshot()` which returns LIVE state arrays by reference, so before/after looked identical — fixed the *test* by deep-copying before the click; the app's edits + loom-equation consistency were correct throughout. **Wired (front door UNTOUCHED — still the curated 9 cards):** a `weave ·` text link added to the front-door **footer** beside `puzzles ·` (the same off-to-one-side pattern as puzzles/colophon — NOT a 10th card, NOT a companion pill, NOT an Undercroft secret); `← workshop` back-link in Loomlight's topbar; an "Also on the workbench" README entry (puzzles → Loomlight → Colophon). Drops `ws:seen:loom` — a breadcrumb for future hidden-world use (a Loomlight secret/trophy is a trivial future add). Spec `loom/LOOMLIGHT.SPEC.md` + log `loom/CHANGELOG.md` (Build 1). **No Undercroft secret added** — diversification into a new vein was the goal.
>
> **Cool ideas thought of but NOT pursued (for the lead/future sessions):** (a) the "tactile toy" vein this opens is the workshop's thinnest — natural siblings are a **spirograph/harmonograph drawing toy**, a **kaleidoscope you steer**, a **string-art / pin-and-thread** board, a **verlet cloth/rope you drag**, a **light-table refraction/prism toy**, or a **gear-train / linkage** you crank (all tactile, non-puzzle, non-audio, each with a provable geometric crux); (b) a **Loomlight Undercroft trophy** — e.g. weave a *valid satin* by hand, or a cross-pollination marrying Loomlight × Tessellarium (a draft whose drawdown realizes a wallpaper symmetry group) or × Ariadne (the weave as an over/under thread-trace) — trivial high-charm hidden-world fodder now that `ws:seen:loom` ships; (c) **profile/network drafting** (the advanced weaver's notation) + **doubleweave / overshot** structures for more depth; (d) a **"name this weave"** read-out that classifies an arbitrary hand-edited draft (twill? satin? plain?) by analyzing its float structure live; (e) export the draft as a tiny shareable **WIF/seed string**. *(Spoiler etiquette respected — no hidden-world trail revealed.)*
>
> ---
> **(prior) ▶ CURRENT STATE / RESUME POINTER (2026-06-12, `/fun` — 💡 AKARI shipped → the workshop's THIRD logic puzzle; the puzzles vein is now a matched TRIO [Latch · Slitherlink · Akari]).**
> Working tree committed & pushed; live 200 confirmed. **New this session (continuing the DEEPEN-THE-VEIN
> arc — companion axis FULL at 7 wings, Arcade large at 16, Sound Garden a clean 2×4, Undercroft well-
> stocked at 8, front door the curated 9; this completes a three-flavour logic-puzzle set, each a DISTINCT
> deduction discipline):** built **Akari / Light Up 💡 (`latch/akari.html`, 1468 lines, single self-
> contained vanilla file, 0 deps/network, NO AUDIO)** — a generative illumination puzzle. Place **lamps**
> on white cells so (1) every white cell is **lit** (a lamp lights its row+column until a wall), (2) **no
> two lamps see each other**, (3) each numbered black wall has **exactly that many** lamps beside it. The
> three puzzles now span three flavours: **Latch = line-run** (nonogram) · **Slitherlink = loop topology**
> (Fences) · **Akari = illumination / line-of-sight**. Real **playable** SVG board (left-click a white cell
> toggles a lamp · right-click / shift marks a ✕ "no-lamp" pencil-mark · **live illumination glow + rays** ·
> mutual-sight bulbs flash a warning · numbered walls turn satisfied/over · **Hint** asserts one forced
> placement · **Check** flags contradictions [over-counted wall / mutual sight / unlightable cell] + counts
> mistakes · Reveal/Reset/New/seed-input · 3 sizes 7×7/10×10/14×14). **3 cosmetic skins** (Graphite/
> Blueprint/Parchment — the siblings' exact CSS-var system) re-skin the SAME puzzle. Honest **win bloom**:
> the board floods with warm light only on a true complete solve ("solved — NN lamps light every cell · a
> clean solve · no mistakes"); Reveal does NOT count as clean. **THE CRUX (workshop tradition): every
> puzzle PROVEN uniquely solvable by PURE LOGIC — no guessing.** Two pure engines: (a) a SOUND `logicSolve`
> (wall-saturation + illumination-necessity + no-mutual-sight propagation + a **sound failed-literal
> probing** lookahead, fixpoint, never guesses); (b) an INDEPENDENT brute-force `bruteCountSolutions`
> (does NOT call logicSolve → true second witness). **Generation:** place a valid fully-lit conflict-free
> lamp solution → derive wall numbers → remove numbers in seeded order ONLY while logicSolve still uniquely
> reaches that exact solution → ship only if every white cell is decided. **Self-test 4/4 PASS** (green chip
> "logic-verified — 4/4 ✓", never red): (1) solver soundness (0-wall, only-candidate-forced-lamp, mutual-
> sight cases — never asserts wrong); (2) a **96-puzzle sweep** (32×3 sizes) — 100% logic-solvable, solver
> bulbs == generated solution, solution validates (lit/no-sight/walls), **0 mismatch / 0 fallback**; (3)
> **uniqueness** via the independent counter (24 small boards, exactly 1 each); (4) seed-purity / skin-
> invariance. **Independently re-audited by the lead in Node** (engine extracted, fresh assertions):
> **120 puzzles 0 fallback / 0 fails, solutions independently valid, 30 boards all unique, 0 determinism
> mismatches.** **Browser-verified end to end** (agent-browser, served origin, by the deputy AND re-confirmed
> by the lead): chip green + 4/4, **0 console errors / warnings / page-errors** across the full battery
> (seed change, all 3 skins, Hint, Check, both sizes, Reveal); a 7×7 driven to its exact solution via REAL
> pointer events fired the honest win + wrote `ws:best:akari=7` + `ws:flag:akari-clean`; `ws:seen:akari`
> written; Reveal lit the board WITHOUT the clean flag (honest); plays from `file://`; both sibling self-
> tests still green after the topbar edits. **3 real bugs found & fixed by the deputy:** (a) a seeded-bulb
> soundness hole (logicSolve copied `initial` verbatim, so two pre-seeded mutually-seeing lamps were
> wrongly accepted → fixed by replaying seeded bulbs through propagation); (b) the solver was far too weak
> (saturation+single-candidate alone solved only ~7%/~0.8%/0% by size → added the failed-literal probing
> layer + a size-aware ~32–47% wall density → 96/96, 0 fallback); (c) the canned wall-free fallback
> (now never reached). **Wired (front door UNTOUCHED — still 9 cards + the `puzzles ·` footer link → `latch/`):**
> a three-way puzzles cross-link — Akari's topbar has `↗ Latch` / `↗ Slitherlink` / `← workshop`, and an
> `↗ Akari` link was added to BOTH `latch/index.html` and `latch/slitherlink.html` topbars. README "Also on
> the workbench" updated (the trio). Drops `ws:seen:akari` + (on solve) `ws:best:akari` (largest size,
> raise-only) + `ws:flag:akari-clean` — breadcrumbs for future hidden-world use. Spec `latch/AKARI.SPEC.md`
> + log `latch/CHANGELOG.md` (Akari Build 1; Latch + Slitherlink entries preserved). **No Undercroft secret
> added** — breadcrumbs left for future use.
>
> **Cool ideas thought of but NOT pursued (for the lead/future sessions):** (a) the puzzles vein is now a
> genuine TRIO and clearly wants a tiny **`latch/puzzles.html` index** to front the set (and the footer
> `puzzles` link could repoint to it) — a clean small refactor once a 4th lands; (b) the same provably-
> unique-by-logic crux still has unbuilt flavours: **Masyu** (pearls/turns — loop topology like Slitherlink
> but a fresh rule), **Nurikabe** (island/wall region logic), **Hashiwokakero (Bridges)**, **Hitori**,
> **Kakuro** (arithmetic) — each a distinct discipline; (c) a **cross-puzzle Undercroft trophy** —
> `ws:flag:latch-clean` ∧ `ws:flag:slitherlink-clean` ∧ `ws:flag:akari-clean` ("master of all three
> logics"), or per-puzzle size trophies — trivial high-charm hidden-world fodder now that all three drop
> breadcrumbs; (d) a **daily/shareable puzzle** shared across the set (date-seeded + copyable result); (e)
> a **solver-difficulty rating** (deepest deduction / probing depth used) to label boards Gentle/Tricky and
> bias generation. *(Spoiler etiquette respected — no hidden-world trail revealed.)*
>
> ---
> **(prior) ▶ CURRENT STATE / RESUME POINTER (2026-06-12, `/fun` — 🔗 SLITHERLINK shipped → the workshop's SECOND logic puzzle, Latch's sibling in a DIFFERENT deduction flavour [loop topology]).**
> Working tree committed & pushed; live 200 confirmed. **New this session (a deliberate DEEPEN-THE-VEIN
> move, not a rack-enlargement — the companion axis is FULL at 7 wings, the Arcade is large at 16, the
> Sound Garden is a clean 2×4, the Undercroft is well-stocked at 8, and the front door stays the curated
> 9 cards; so this grows the brand-new logic-puzzle vein Latch opened, exactly as Latch's own "ideas not
> pursued" teed up — Slitherlink was the named next genre):** built **Slitherlink 🔗
> (`latch/slitherlink.html`, 1140 lines, single self-contained vanilla file, 0 deps/network, NO AUDIO)** —
> a generative **Loop-the-Loop / Fences** atelier. Where Latch is **line-run** deduction over a pixel
> grid, this is **loop-topology** deduction: the answer is a single closed curve, where each numbered
> cell (clue 0–3) must touch exactly that many of its 4 surrounding edges, and the drawn edges form
> **exactly one** closed loop (every dot degree ∈ {0,2}, one connected cycle). Real **playable** puzzle on
> an SVG board (left-click an edge = draw the loop, cycles UNKNOWN↔LINE · right-click / shift = cross-out ✕ ·
> live clue dim-on-satisfied + warn-on-exceeded + degree-3 dot flag · **Hint** asserts one logically-forced
> edge · **Check** flags contradictions + counts mistakes · Reveal/Reset/New/seed-input · 3 sizes 5×5/7×7/
> 10×10). **3 cosmetic skins** (Graphite/Blueprint/Parchment — Latch's exact CSS-var system, so the two are
> a matched set) re-skin the SAME puzzle. Honest **win bloom**: only a true correct single-loop solution
> wins — the loop blooms in the accent + glow, verdict reads "solved — one loop, NN segments · a clean
> solve · no mistakes"; Reveal explicitly does NOT count as a clean solve. **THE CRUX (workshop tradition):
> every puzzle is PROVEN uniquely solvable by PURE LOGIC — no guessing.** Two engines, both pure/headless:
> (a) a SOUND `logicSolve` propagating to a fixpoint over edge-states {UNKNOWN,LINE,CROSS} via clue-
> saturation + dot-degree (vertex) rules + a **union-find no-premature-closure** rule — only ever asserts
> a forced edge; (b) an INDEPENDENT brute-force `bruteCountSolutions` (vertex-ordered DFS, does NOT call
> logicSolve → a true second witness). **Generation contract:** grow a random simply-connected, pinch-free
> region (its perimeter is automatically ONE closed loop) → derive clues → remove clues in seeded order
> ONLY while `logicSolve` still uniquely reaches that exact loop → ship only if it solves with 0 UNKNOWNs.
> **Self-test 4/4 PASS** (green chip "logic-verified — 4/4 ✓", never ships red): (1) solver soundness
> (0-clue all-cross, dot-degree, tiny-loop + 6 boards — never asserts a wrong edge); (2) a **96-puzzle
> sweep** (32×3 sizes) — 100% logic-solvable AND logicSolve loop == generated loop (0 mismatch / 0 guesses
> / **0 fallback**); (3) **uniqueness** via the independent counter (24 small boards, exactly 1 each — true
> second witness); (4) seed-purity / skin-invariance (same seed ⇒ byte-identical; re-roll differs; skin
> cosmetic). **Independently re-audited by the lead in Node** (engine extracted, fresh assertions):
> **150 puzzles 0 fallback / 0 fails, 30 small boards all uniquely solvable, 0 determinism mismatches.**
> **Browser-verified end to end** (agent-browser, served origin, by the build deputy AND independently
> re-confirmed by the lead): chip green + 4/4, **0 console errors / 0 warnings / 0 page-errors** across a
> full battery (seed change, all 3 skin switches, Hint, Check, both size changes, Reveal); a Tiny board
> driven to its exact solution via REAL pointer events fired the honest win bloom ("solved — one loop, 18
> segments · a clean solve") and wrote `ws:best:slitherlink=5` + `ws:flag:slitherlink-clean`; Reveal showed
> the loop WITHOUT setting the clean flag (honest); `ws:seen:slitherlink` written; all storage try/catch-
> guarded (plays from `file://` too); **no audio** (silent piece). **3 real bugs found & fixed by the
> deputy:** (a) a Boolean-vs-number coercion in `regionPerimeter` (`false !== 0`) that falsely flagged
> border edges → 100% fallback → fixed with `=== 1`; (b) missing diagonal-pinch (figure-eight) rejection →
> added `regionNoPinch`; (c) brute-counter state corruption (`place()` short-circuited mid-update while
> `unplace()` undid the full update → counter returned 0) → fixed to apply the complete update + dot-major
> edge order. **Wired (front door UNTOUCHED — still the curated 9 cards + the existing `puzzles ·` footer
> link → `latch/`):** a `↗ Slitherlink` sibling link in **Latch's** topbar + a matching `↗ Latch` / `←
> workshop` in Slitherlink (the companion cross-link pattern — the footer's "puzzles" now opens a pair of
> logic puzzles; NOT a 10th card, NOT a front-door companion pill, NOT an Undercroft secret). README "Also
> on the workbench" updated (Latch → Slitherlink sibling). Drops `ws:seen:slitherlink` + (on solve)
> `ws:best:slitherlink` (largest size, raise-only) + `ws:flag:slitherlink-clean` (no-mistake solve) —
> breadcrumbs for future hidden-world use (a Slitherlink trophy is a trivial future add). Spec
> `latch/SLITHERLINK.SPEC.md` + log `latch/CHANGELOG.md` (Slitherlink Build 1, Latch entry preserved).
> **No Undercroft secret added** this session — the breadcrumbs are left for future use.
>
> **Cool ideas thought of but NOT pursued (for the lead/future sessions):** (a) the logic-puzzle vein is
> now a genuine **pair** and could grow into a small "puzzles" room of its own — the same provably-unique-
> by-logic crux still generalizes to **Hashiwokakero (Bridges)**, **Nurikabe**, **Akari/Light-Up**,
> **Masyu** (each a distinct deduction flavour); a tiny `latch/puzzles.html` index could one day front the
> set if it grows past two; (b) a **Slitherlink Undercroft trophy** — `ws:flag:slitherlink-clean` ∧
> `ws:best:slitherlink ≥ 10` ("solved the Big loop without a mistake"), or a cross-puzzle combo
> `ws:flag:latch-clean` ∧ `ws:flag:slitherlink-clean` ("master of both logics") — trivial high-charm hidden-
> world fodder now that the breadcrumbs ship; (c) **daily/shareable puzzle** (date-seeded "loop of the day"
> + copyable result) — a meta touch shared across both puzzles; (d) a **solver-difficulty rating** (count
> fixpoint passes / deepest deduction used) to label boards Gentle/Tricky and bias generation; (e) an
> **axis-locked drag-to-paint** along a row/column of edges (Latch has the nonogram analogue). *(Spoiler
> etiquette respected — no hidden-world trail revealed.)*
>
> ---
> **(prior) ▶ CURRENT STATE / RESUME POINTER (2026-06-12, `/fun` — 🧩 LATCH shipped → a NEW MEDIUM: the workshop's first LOGIC PUZZLE, placed as a front-door FOOTER extra alongside the colophon).**
> Working tree committed & pushed; live 200 confirmed. **New this session (a deliberate DIVERSIFY move,
> not a rack-enlargement — the companion axis is FULL at 7 wings, the Arcade is large at 16, the Sound
> Garden is a clean 2×4, and the Undercroft is well-stocked at 8; so this opens a brand-new vein instead):**
> built **Latch 🧩 (`latch/index.html`, 1408 lines, single self-contained vanilla file, 0 deps/network)** —
> the workshop's **first logic puzzle**: a generative **nonogram / picross atelier**. From a `(seed, size)`
> it draws a little **pixel picture** from a curated 30-motif library (5×5: heart/key/star/sail/fish/house/
> cup/cross/bell/boat/mug/kite · 10×10: cat/key/anchor/mushroom/sailboat/clover/bell/crown/heart/fish ·
> 15×15: rocket/tree/heron/butterfly/mug/spiral/cup/fox; seed selects + may mirror), encodes it as row/column
> run-clues, and hands you a real **playable** puzzle (left-click fill · right-click/shift/mode-toggle mark ·
> **axis-locked drag-to-paint** · live clue dim-on-satisfied · **Hint** reveals one logically-forced cell ·
> **Check** highlights contradictions + counts mistakes · Reveal/Reset/New/seed-input · 3 sizes). **3 cosmetic
> skins** (Graphite/Blueprint/Parchment) re-skin the SAME puzzle. Honest **win reveal**: the picture blooms in
> the accent + glow, gutters fade, the motif name shows ("solved — a boat", "a clean solve · no mistakes").
> **THE CRUX (workshop tradition) is that every puzzle is PROVEN uniquely solvable by PURE LOGIC — no guessing:**
> a sound+complete constraint-propagation **line-solver** (`solveLine(clue,cells)` enumerates every run
> placement consistent with the partial state and intersects them → a cell is forced iff EVERY arrangement
> agrees) iterated to a fixpoint over all rows+cols (`logicSolve`); a full board ⇒ the unique solution (the
> fixpoint reaching a full board IS the uniqueness proof). **Generation contract:** draw → clue → `logicSolve`
> → ship ONLY if it solves to the exact picture with no guessing, else mirror/next motif; a guaranteed-solvable
> frame fallback exists (used **0/900** in audit). **Self-test 4/4 PASS** (green chip "logic-verified — 4/4 ✓",
> never ships red): (1) line-solver soundness on 7 hand-crafted lines with known forced outputs; (2) a **240-puzzle
> sweep** (80×3 sizes) — 100% logic-solvable AND logic-solve == original picture (0 guesses/0 mismatch);
> (3) **uniqueness** via an independent brute-force solution-counter (24 Tiny puzzles, exactly 1 each — a true
> second witness); (4) seed-purity/determinism + style-invariance (same seed ⇒ byte-identical; re-roll differs;
> skin is cosmetic). **Browser-verified end to end** (agent-browser, served origin, by the build deputy AND
> independently re-confirmed by the lead): chip green + 4/4, **0 console errors/warnings/page-errors** across a
> full interaction battery (solve→win, re-roll, hint, reset, check, all 3 style switches); a Tiny puzzle solved
> via real pointer events fired the win reveal ("— a boat"); Hint added exactly 1 forced cell; a deliberate wrong
> fill → exactly 1 Check contradiction; same seed reproduced byte-identical clues; live style-invariance (clue
> fingerprint identical across skins); `ws:seen:latch` written (all storage try/catch-guarded; plays from
> `file://` too); **no audio** (silent piece). **Real bugs found & fixed by the deputy:** (a) the big one — the
> picture grid uses `0` for empty while `logicSolve` returns `-1` (crossed-empty), so a raw `gridsEqual` spuriously
> failed and the generator fell back to the frame on 100% of seeds → fixed with `solvedMatchesPicture()` (compare
> filled-predicate only); (b) two wrong self-test expectations (`[2,1]`/`[1,1,1]` — the solver was right); (c) a
> dead `feasible()` DP helper removed; (d) 3 non-logic-solvable motifs (two leaves, a snail) replaced with solvable
> redesigns (sail/clover/spiral). **Wired (front door UNTOUCHED — still the curated 9 cards + 7 companion pills):**
> a `puzzles ·` text link added to the front-door **footer** beside `colophon ·` (the same off-to-one-side pattern
> as the colophon — NOT a 10th card, NOT a companion, NOT an Undercroft secret); `← workshop` back-link in Latch;
> an "Also on the workbench" README section (Latch + Colophon as footer extras); spec `latch/LATCH.SPEC.md` + log
> `latch/CHANGELOG.md` (Build 1). Drops `ws:seen:latch` + (on solve) `ws:best:latch` (largest size) + `ws:flag:latch-clean`
> (no-mistake solve) — breadcrumbs for future hidden-world use (a Latch "no-mistakes / Big-solved" Undercroft trophy
> is a trivial future add). **No Undercroft secret added** this session — diversification was the goal.
>
> **Cool ideas thought of but NOT pursued (for the lead/future sessions):** (a) a **Latch Undercroft trophy** —
> `ws:flag:latch-clean` ∧ `ws:best:latch ≥ 15` ("solved the Big board without a mistake") is trivial high-charm
> hidden-world fodder now that the breadcrumbs ship; (b) **more logic-puzzle genres** in this new vein — the same
> "provably unique-by-logic" crux generalizes beautifully to **Slitherlink**, **Hashiwokakero (Bridges)**,
> **Nurikabe**, or **Akari/Light-Up** (each a distinct deduction flavour; could grow a small "puzzles" room of its
> own if the vein deepens); (c) **daily/shareable puzzle** (date-seeded "puzzle of the day" + a copyable result
> grid) — a meta touch; (d) a **larger curated motif set** or a structured **symmetric-silhouette generator** for
> more 15×15 variety (currently 8 Big motifs); (e) a **solver-difficulty rating** (count fixpoint passes / max
> line-enumeration depth) to label puzzles Gentle/Tricky and bias generation toward a chosen difficulty.
> *(Spoiler etiquette respected — no hidden-world trail revealed.)*
>
> ---
> **(prior) ▶ CURRENT STATE / RESUME POINTER (2026-06-12, `/fun` — ⚡ THEOGONY shipped → Threshold's companion / the 7th wing: place & pantheon).**
> Working tree committed & pushed; live 200 confirmed. **New this session:** built **Theogony ⚡
> (`theogony/index.html`, ~1030 lines, single self-contained vanilla file, 0 deps/network)** — a
> generative **mythology engine**, and placed it as **Threshold's companion** (the long-noted "Threshold
> is the only front-door card without a companion" gap, filled with a genuinely poetic pairing:
> **Threshold builds the *place*; Theogony begets the *gods* of such a world**). From a seed → an invented
> **pantheon** of **~10–18 gods across 3–5 generations**, rendered as an **illuminated celestial
> genealogy**. Names coined from a per-pantheon **sound-system** (seeded onset/vowel/coda set, so names
> share a family resemblance, à la the constellation/poet names); each god holds a **distinct domain**
> from a 24-pool of **opposing pairs** (sea↔flame, dawn↔dusk, memory↔forgetting, hearth↔wild,
> harvest↔famine, making↔ruin, loom↔knife, storm↔silence, deep↔height, threshold↔road, dead↔birth,
> green↔stone), plus 1–2 **epithets**, parentage, derived siblinghood, **consorts**, and a short
> **origin-myth** curate-then-arranged from hand-authored fragments that reference **only that god's real
> kin/domains** in this pantheon. **Render:** SVG family tree by generation, seeded **sigil nodes** (glyph
> + domain mark), descent lines, distinct dashed-gold consort bonds, a click-to-read **read-a-god** panel,
> seed + ⟳ re-roll, **3 styles** (Star-Chart indigo+gold / Illuminated parchment+ink / Stone tablet), 2×
> PNG export. **The crux (workshop tradition) is the KINSHIP being PROVEN:** the generator is pure
> (`buildPantheon(seed)→pantheon`, no DOM); a headless **4-check self-test** runs on load + shows a green
> **"self-test ✓ 4/4"** chip (never ships red): (1) **acyclic descent** — full ancestor-walk over every god
> finds no cycle; child generation strictly > every parent's (monotonic by construction — parents drawn
> only from strictly-earlier generations); consorts reciprocal & never lineal; (2) **referential integrity
> ("can't drift", à la Blazon)** — every myth/epithet declares its referent ids; the test confirms each is
> a real god, the prose names no *other* god (whole-token match), and each referent is genuine kin/rival —
> the prose and the family tree can never disagree; (3) **domain coherence** — distinct primaries; opposing
> pairs map to two real gods; (4) **seed purity / style-invariance** — same seed → identical fingerprint;
> style only re-renders (fingerprint identical across all 3 styles). **Browser-verified end to end**
> (agent-browser, served origin AND the live Pages site): chip green + **4/4 PASS**, **0 console errors / 0
> warnings**, varied coherent re-rolls (20 rolls all distinct-domain + valid-DAG), click-to-read matches
> the selection, same seed reproduces byte-identically, style switch is content-identical (only colours
> change), PNG export rasterizes a valid non-blank 2× image, 60fps (static SVG — nothing to drop). **Two
> real bugs found & fixed during the build** (a referential-integrity false-positive from substring
> name-collision — fixed with whole-token back-parse; a size distribution skewed small — retuned gens to
> 4–5 / per-gen 3–4 so 98% land in [10,18]); plus a UX fix (surface the seed on first load). **Wired
> (front door UNTOUCHED — still the curated 9 cards):** a `↗ Theogony — the gods that made such a place`
> sib-link in Threshold's topbar (CSS copied from verse/), `← workshop` / `↗ Threshold` back-links here, a
> `⚡ Theogony within` pill on Threshold's front-door card, a README companion blockquote (+ companion
> count six→seven). Drops `ws:seen:theogony` (breadcrumb for the hidden-world framework). Spec
> `theogony/THEOGONY.SPEC.md` + log `theogony/CHANGELOG.md` (Build 1). Commit `800ed47`, pushed, live 200
> (theogony + threshold + root). **The workshop now has SEVEN wings** (celestial, design-press,
> labyrinth&thread, realm&city, verse&script, garden&ornament, and now **place&pantheon**). **No Undercroft
> secret added** — the `ws:seen:theogony` breadcrumb is left for future hidden-world use.
>
> **Cool ideas thought of but NOT pursued (for the lead/future sessions):** (a) a **contact-sheet / gallery**
> showing a row of pantheons from a seed-sweep (a "field of theogonies"); (b) an **Undercroft
> cross-pollination secret** marrying Theogony × Firmament (a pantheon written *into* a star-chart — gods as
> constellations with their myths) or × Scriptorium (a theogony inscribed in an invented hand) — natural
> exploration-combos (`ws:seen:theogony` ∧ a sibling); (c) deeper **myth weaving** — a multi-sentence myth
> *per god* or a single woven "creation hymn" paragraph for the whole pantheon (still referentially closed);
> (d) **clickable descent highlighting** (hover a god → light its full ancestor/descendant subtree, à la
> Ariadne's thread-trace); (e) **pantheon archetypes** (chthonic vs olympian flavour, a trickster/culture-hero
> role) layered on top of the domain system. *(Spoiler etiquette respected — no hidden-world trail revealed.)*
>
> ---
> **(prior) ▶ CURRENT STATE / RESUME POINTER (2026-06-12, `/fun` — 📅 THE ALMANAC shipped → Undercroft secret #8, a cross-pollination in the WORDS vein).**
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
- `theogony/` ⚡ — **Threshold's companion** (NOT a front-door card; reached via Threshold's
  `↗ Theogony` link + a "within" pill). A generative **mythology engine**: from a seed → an invented
  **pantheon** (~10–18 gods, 3–5 generations) drawn as an illuminated celestial **genealogy**. Coined
  names from a per-pantheon sound-system; distinct domains with opposing pairs; epithets; parentage;
  consorts; an origin-myth per god referencing only that god's real kin/domains. Crux = a built-in
  **self-test (4 checks)**: acyclic descent (DAG + monotonic generations), referential integrity
  (the prose can't drift from the graph), domain coherence, seed-purity/style-invariance.
  Star-Chart / Illuminated / Stone styles, click-to-read panel, seed-reproducible, PNG export. Done
  (v1, committed `800ed47`). See `theogony/THEOGONY.SPEC.md`.
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

## 🧹 Curation items (for daylight / Brandon's call — deliberately NOT done overnight to avoid unsupervised outward-facing UX changes)
- **Back-link consistency:** 6 of 9 front-door *card* pages lack a `← workshop` back-link (strange-garden,
  firmament, daedalus, arcade, cartographer, compositor); only the 3 newest (sound-garden, verse, threshold)
  have one. Predates this work; not a regression. Adding `← workshop` to all for consistency is good UX but
  touches 6 immersive pages (each needs a matching `.back` CSS rule) — a design call worth Brandon's eye.
- **Footer is becoming an "extras" drawer:** the front-door footer now holds colophon · puzzles (+ the hidden
  rune). Fine for now; if more footer extras land, consider a tidier "extras/atelier" grouping.

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
