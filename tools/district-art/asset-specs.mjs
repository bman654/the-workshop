#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
   asset-specs.mjs — §5.3 THE REP BRIEFS (foundry inputs), the T3.2 PREP deliverable.

   The 12 engine asset specs the ART FOUNDRY batch (T3.3) forges against — one row per
   district STRUCTURE (the estate-tier "building with a soul", §5.1). Each spec is in the
   engine's normalizeAsset shape (art-foundry/engine-core.mjs), so the batch reads it
   directly and this file's `--check` lints it through the SAME normalizer the engine uses.

   THE WIRING (§5.3 "registry entry + stub fn per asset", the rep-spec 3-edit pattern adapted
   to district-art.js — done at T3.2):
     · The 8 DISTRICT reps are registered STUBS in tools/district-art/district-art.js
       (drawRepWorks … drawRepOutbuilding), each PROVISIONALLY drawing the monogram. The
       foundry forges the §5.3 scene into that ONE function body at T3.3; every sibling stays
       byte-identical (the proven "elevate only drawFn" operation).
     · rep-manor / rep-fairground REUSE existing art (the great-house massing / the #411 gate
       face) — SKIP unless judged weak (`reuse:true`); their spec points at the live fn.
     · rep-gatehouse / rep-gate-lodge are the approach-plate structures the PAGE draws
       (drawGatehouse / drawGateLodge in index.src.html); their spec targets those fns.

   THE PREVIEW HARNESS: every spec's `previewHarness` is `tools/district-art/preview.sh <district>`
   — the visual-exhibit render command (art-foundry engine-core MEDIA['visual-exhibit']) runs
   `bash <previewHarness> <candidate> <outdir> <port>`, so the harness receives
   (<district>, <candidate>, <outdir>, <port>): it forges index.html with the candidate
   district-art.js swapped in, serves it, and screenshots the estate plate at FIT view
   (estate-fit.png) + the district CROP (preview.png, via the ?rep=<district> camera deep-link).

   Geometry is pinned to the DRAWN (display-clamped [110,260]px) structure box — the exact box
   the page hands drawDistrict — measured from the live solve. Per the T3.1 repo-wins carry the
   tally sits at the FOOT (b.y+b.h−12), so each brief reserves the FOOT ~16px, not the top.

   Run:  node tools/district-art/asset-specs.mjs --check   → lints all 12 through the engine.
   ════════════════════════════════════════════════════════════════════════════ */

// The estate hand every rep is forged in (mirrors GateArt / the district-art.js grammar):
const IDIOM =
  `ESTATE IDIOM: brass-stroke-on-ink — dark ink ground, brass strokes (#c9a24a) via the ` +
  `.eng/.eng-fine/.eng-hatch classes, accent-tinted paper fills via .fillp/.eng-accent (the ` +
  `district accent is threaded as --c, so DO NOT hardcode the accent — reference it). Lit from ` +
  `above; NO gradient material; NO photoreal. Calm AT REST — any motion lives in an .anim group ` +
  `(built via DistrictArt.anim.{spinKF,bobKF,swayKF,flowKF,group}) that the CSS holds paused ` +
  `until the .district-rep is hovered/focused/woken, and reduced-motion holds the static frame. ` +
  `The rep is an engraved calling-card read at fit view — quiet, secondary to the manor massing.`;

// One district-rep spec (registered stub in district-art.js). box = the DRAWN clamped structure box.
function districtRep({ district, drawFn, title, accent, K, motif, judge, box }) {
  return {
    key: `rep-${district}`,
    title,
    tier: 'DISTRICT-REP',
    K, judgeK: 2,
    module: 'tools/district-art/district-art.js',
    iface: 'district-art',
    drawFn,
    siblings:
      `EVERY OTHER function in tools/district-art/district-art.js (drawMonogram, drawDistrict, ` +
      `the KF verbs spinKF/bobKF/swayKF/flowKF/animGroup, roundRect/E/n, and the OTHER seven ` +
      `drawRep* stubs) — all byte-identical. Change ONLY ${drawFn}'s body.`,
    extraQS: `rep=${district}`,
    previewHarness: `tools/district-art/preview.sh ${district}`,
    accent,
    geometry:
      `GEOMETRY (viewBox units; the DRAWN display-clamped structure box the page hands drawDistrict): ` +
      `box ≈ ${box.w}×${box.h} at (x${box.x}, y${box.y}), centre (${box.cx}, ${box.cy}). Fill the box; ` +
      `the structure fits its hull. LEAVE THE FOOT ~16px CLEAR (below y${(box.y + box.h - 18)}) — the ` +
      `page engraves the "N ROOMS · M WITHIN" depth tally there (repo-wins: the tally seats at the ` +
      `FOOT, not the top). Append SVG into the given <g class="district-rep">; do not set its transform.`,
    brief: `ART BRIEF — ${motif}\n${IDIOM}`,
    judgeFocus:
      `${judge} Correct estate brass-on-ink idiom (brass strokes, accent via --c, lit-from-above, no ` +
      `gradient)? Fills the hull box with the FOOT left clear for the tally? Calm at rest, wakes on ` +
      `hover/focus, reduced-motion holds? Reads cleanly at fit view — quiet + secondary to the manor?`,
  };
}

// A reused / page-drawn structure (manor massing · fairground gate face · the approach lodges).
function existingRep({ key, title, module, drawFn, iface, accent, K, reuse, previewDistrict, note, geometry, brief, judge }) {
  return {
    key, title,
    tier: 'DISTRICT-REP',
    K, judgeK: 2,
    module, iface, drawFn,
    siblings: `EVERY OTHER draw fn in ${module} — byte-identical. Change ONLY ${drawFn}.`,
    extraQS: `rep=${previewDistrict}`,
    previewHarness: `tools/district-art/preview.sh ${previewDistrict}`,
    accent,
    reuse: !!reuse,
    wireNote: note,
    geometry,
    brief: `${brief}\n${IDIOM}`,
    judgeFocus: judge,
  };
}

export const ASSETS = [
  // ── the 8 DISTRICT reps (registered stubs in district-art.js) ───────────────
  districtRep({
    district: 'works', drawFn: 'drawRepWorks', K: 3, accent: '#d9a441',
    title: 'rep-works — a working yard (two chimneys, a gantry crane, a lodestone coil, an ashlar arch)',
    box: { w: 260, h: 220, x: 1753.2, y: 1673, cx: 1883.2, cy: 1783 },
    motif: `a working yard: two chimneys (one smoking a dotted-line ribbon that drifts), a gantry crane ` +
      `over a casting pit, a lodestone coil on a plinth, an arch of dressed ashlar. The busiest tier-1 ` +
      `structure — mass + industry.`,
    judge: `Does it unmistakably read as a WORKING YARD (chimneys + crane + casting pit + coil + ashlar ` +
      `arch)? Does the one smoke ribbon drift quietly when woken?`,
  }),
  districtRep({
    district: 'gardens', drawFn: 'drawRepGardens', K: 3, accent: '#7fd1c7',
    title: 'rep-gardens — a glasshouse range (three barrel-vaulted glass houses, potting tables, a weather-vane)',
    box: { w: 240, h: 180, x: 1187, y: 1780.1, cx: 1307, cy: 1870.1 },
    motif: `a glasshouse range: three barrel-vaulted glass houses with roof finials and glazing-bar ` +
      `hatching, potting tables along the front, a weather-vane cloud turning over the third house.`,
    judge: `Does it read as a GLASSHOUSE RANGE (three barrel-vault glass houses + glazing bars + finials)? ` +
      `Does the weather-vane turn gently on wake?`,
  }),
  districtRep({
    district: 'observatory', drawFn: 'drawRepObservatory', K: 3, accent: '#9db4ff',
    title: 'rep-observatory — the rise (a contour-ringed hill crowned by a slit dome + tilted refractor + orrery finial)',
    box: { w: 260, h: 260, x: 1088.9, y: 1170.3, cx: 1218.9, cy: 1300.3 },
    motif: `the rise: a stepped hill drawn in contour rings, crowned by a dome with an open observing ` +
      `SLIT and a tilted refractor telescope poking out; a small orrery finial. The tallest structure.`,
    judge: `Does it read as an OBSERVATORY on a contour-ringed RISE (dome + slit + tilted refractor + ` +
      `orrery finial)? Does the refractor or orrery turn quietly on wake?`,
  }),
  districtRep({
    district: 'promenades', drawFn: 'drawRepPromenades', K: 2, accent: '#c9a24a',
    title: 'rep-promenades — a crescent walk (a colonnade arc, a central sundial gnomon, twelve diminishing procession stones)',
    box: { w: 260, h: 130, x: 1419, y: 692, cx: 1549, cy: 757 },
    motif: `a crescent walk: a colonnade arc of slim columns, a sundial gnomon at its centre casting a ` +
      `thin engraved shadow, twelve procession stones diminishing along the path in perspective. A WIDE, ` +
      `SHORT structure (fill the width, keep it low).`,
    judge: `Does it read as a CRESCENT WALK (colonnade arc + centre gnomon + diminishing procession ` +
      `stones)? Does the gnomon shadow ease on wake? (accent is the LIVE district hue #c9a24a — repo-wins over §5.3's #caa15a.)`,
  }),
  districtRep({
    district: 'number', drawFn: 'drawRepNumber', K: 2, accent: '#6f9fc0',
    title: 'rep-number — a terraced Pascal garden (stepped triangular beds, an abacus-rail fence, a compasses folly)',
    box: { w: 240, h: 170, x: 1059.9, y: 2158.3, cx: 1179.9, cy: 2243.3 },
    motif: `a terraced Pascal garden: stepped beds arranged in a triangle (a Pascal-triangle terrace), an ` +
      `abacus-rail fence of beads across the front, a small folly shaped like a pair of open compasses.`,
    judge: `Does it read as a TERRACED PASCAL GARDEN (triangular stepped beds + abacus-rail + compasses ` +
      `folly)? (accent is the LIVE district hue #6f9fc0 — repo-wins over §5.3's #c9a24a.)`,
  }),
  districtRep({
    district: 'opticks', drawFn: 'drawRepOpticks', K: 2, accent: '#8fd9ff',
    title: 'rep-opticks — a light court (a gallery with a prism skylight throwing an engraved spectrum fan onto a reflecting pool)',
    box: { w: 220, h: 150, x: 638.4, y: 1474, cx: 748.4, cy: 1549 },
    motif: `a light court: a long low gallery with a prism skylight, throwing an engraved SPECTRUM FAN ` +
      `(a fan of hatched brass rays) across a reflecting pool along the foot line.`,
    judge: `Does it read as a LIGHT COURT (gallery + prism skylight + engraved spectrum fan + reflecting ` +
      `pool)? Does the spectrum fan shimmer subtly on wake?`,
  }),
  districtRep({
    district: 'cavern', drawFn: 'drawRepCavern', K: 2, accent: '#7fd4c0',
    title: 'rep-cavern — a cave mouth in a rocky hillside (braced adit, a mine-rail running in, a faint teal glow)',
    box: { w: 150, h: 110, x: 2168.2, y: 2321.3, cx: 2243.2, cy: 2376.3 },
    motif: `a cave mouth in a rocky hillside: a braced timber ADIT frame, a mine-rail running into the ` +
      `dark, a faint teal glow from the maw (echo the-gate's cavern-mound rep). A SMALL, LOW structure.`,
    judge: `Does it read as a braced CAVE MOUTH / adit (rock hillside + timber bracing + mine-rail + teal ` +
      `glow from the maw)? Is the glow quiet + not gaudy?`,
  }),
  districtRep({
    district: 'outbuilding', drawFn: 'drawRepOutbuilding', K: 2, accent: '#c9a24a',
    title: "rep-outbuilding — the maker's shed (a low timber workshop, a tool-wall silhouette through the window, a lit workbench lamp)",
    box: { w: 140, h: 110, x: 717.9, y: 2255.1, cx: 787.9, cy: 2310.1 },
    motif: `the maker's shed: a low timber workshop with a pitched roof, a tool-wall silhouette (saw, ` +
      `square, plane) seen through the lit window, a workbench lamp glowing warm. A SMALL, HUMBLE structure.`,
    judge: `Does it read as a MAKER'S SHED (low timber workshop + tool-wall through the window + lit ` +
      `workbench lamp)? Does the lamp glow warm at rest?`,
  }),

  // ── the 4 SPECIAL reps (reuse / page-drawn — not districtScenes) ────────────
  existingRep({
    key: 'rep-manor', reuse: true, K: 2, accent: '#c9a24a', iface: 'page', previewDistrict: 'manor',
    title: 'rep-manor — the great-house massing (EXISTING; SKIP unless judged weak in the W6 review, §5.3)',
    module: 'index.src.html', drawFn: 'drawManorInterior',
    note: `REUSE — the manor is the dominant UNCLAMPED great-house massing (drawManorInterior, promoted at ` +
      `T1.2/§5.1). Do NOT re-forge unless the W6 fresh-eyes review judges it weak; then re-soul in its own idiom.`,
    geometry: `The manor massing draws the UNCLAMPED hull (drawn box ≈ 260×200 at (1419,1449)); it is the ` +
      `estate's load-bearing centre and carries relative mass for the whole map.`,
    brief: `ART BRIEF — the grand great-house massing at the estate centre (existing drawManorInterior).`,
    judge: `Only if re-forged: does the great-house massing still DOMINATE as the centre + read as the manor?`,
  }),
  existingRep({
    key: 'rep-fairground', reuse: true, K: 2, accent: '#37f7e0', iface: 'gate', previewDistrict: 'fairground',
    title: 'rep-fairground — the #411 gate arch (EXISTING; reuse GateArt.drawFace, re-boxed, §5.3)',
    module: 'the-fairground-gate/gate-art.js', drawFn: 'drawFace',
    note: `REUSE — the fairground estate-tier face is the existing #411 arch (GateArt.drawFace), re-boxed ` +
      `to the drawn gate box (110×120 clamped from 96×120). It keeps its own "N AMUSEMENTS" teaser (§5.1), ` +
      `not a generic tally. Do NOT re-forge unless judged weak.`,
    geometry: `The gate FACE fills the native gate box (drawn 110×120 at (2254.6,1241.9)); GateArt.drawFace ` +
      `already draws it — only the box is supplied by the page.`,
    brief: `ART BRIEF — the wrought fairground gate arch (existing GateArt.drawFace).`,
    judge: `Only if re-forged: does the arch read as the fairground gate + keep its "N AMUSEMENTS" teaser?`,
  }),
  existingRep({
    key: 'rep-gatehouse', K: 2, accent: '#c9a24a', iface: 'page', previewDistrict: 'approach',
    title: 'rep-gatehouse — a stone gatehouse astride a wicket (arched door, a hanging ledger-book sign, a small lamp)',
    module: 'index.src.html', drawFn: 'drawGatehouse',
    note: `PAGE-DRAWN — the Register's gatehouse sits on the APPROACH plate (drawGatehouse in ` +
      `index.src.html, T1.2/§4.3). A forge elevates that fn in place; siblings on the plate byte-identical.`,
    geometry: `Drawn on the approach plate near the road tip (the card-catalog footprint, tier-1 gatehouse). ` +
      `Preview crops the approach plate (both the gatehouse + the gate lodge sit there).`,
    brief: `ART BRIEF — a stone gatehouse astride a wicket gate: an arched door, a ledger-book sign hanging ` +
      `from a wrought bracket, a small lit lamp. The Register re-seated (§4.3).`,
    judge: `Does it read as a stone GATEHOUSE (arched wicket + hanging ledger-book sign + lamp)? Estate ` +
      `brass idiom, lit from above, quiet? Reads at the road tip on the approach plate?`,
  }),
  existingRep({
    key: 'rep-gate-lodge', K: 2, accent: '#c9a24a', iface: 'page', previewDistrict: 'approach',
    title: 'rep-gate-lodge — the front gate itself (two ashlar piers + a wrought arc at the road tip)',
    module: 'index.src.html', drawFn: 'drawGateLodge',
    note: `PAGE-DRAWN — the estate's front gate sits at the ROAD TIP on the APPROACH plate (drawGateLodge ` +
      `in index.src.html, T1.2/§4.2). A forge elevates that fn in place; siblings byte-identical.`,
    geometry: `Drawn at the road tip (t=0) on the approach plate (the estate-gate footprint). Preview crops ` +
      `the approach plate.`,
    brief: `ART BRIEF — the estate's grand front gate: two dressed-ashlar PIERS with capstones and a wrought ` +
      `iron ARC spanning between them, sitting at the road's tip (the parent-plate rep of the-gate, §4.2).`,
    judge: `Does it read as a grand FRONT GATE (two ashlar piers + a wrought arc)? Sits believably at the ` +
      `road tip? Estate brass idiom, lit from above, quiet?`,
  }),
];

// Batch config (§5.3): one foundry batch, maxAssets 15, K:3 for the marquee tier-1 faces, the
// engine's own FOUNDRY_MAX_CONCURRENCY honored.
export const BATCH = {
  medium: 'visual-exhibit',
  maxAssets: 15,
  concurrency: 3,            // FOUNDRY_MAX_CONCURRENCY (the engine's own gate)
  judgeVerb: 'VIEW every preview.png (the district crop) + estate-fit.png (the fit-view context)',
};

// ── CLI: `--check` lints all 12 through the ENGINE's own normalizer ───────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const wantCheck = process.argv.slice(2).some(a => a === '--check' || a === '--lint');
  if (!wantCheck) {
    console.log(`asset-specs: ${ASSETS.length} district-rep specs. Run with --check to lint them through the engine.`);
    process.exit(0);
  }
  const { normalizeBatch } = await import('../../art-foundry/engine-core.mjs');
  let failed = 0;
  const seen = new Set();
  const { assets, dropped } = normalizeBatch(ASSETS);
  console.log(`\n══ asset-specs --check (§5.3, T3.2) — ${ASSETS.length} specs → engine normalizeBatch ══`);
  for (const a of assets) {
    const bad = [];
    if (seen.has(a.key)) bad.push('DUPLICATE key');
    seen.add(a.key);
    if (!a.title) bad.push('no title');
    if (!/^rep-[a-z-]+$/.test(a.key)) bad.push(`key not rep-<slug> (${a.key})`);
    if (!a.previewHarness || !/^tools\/district-art\/preview\.sh /.test(a.previewHarness)) bad.push('bad previewHarness');
    if (!a.brief) bad.push('no brief');
    if (!a.geometry) bad.push('no geometry');
    if (!a.judgeFocus) bad.push('no judgeFocus');
    const flag = bad.length ? ` ✗ ${bad.join('; ')}` : ' ✓';
    if (bad.length) failed++;
    console.log(`  ${a.key.padEnd(16)} K=${a.K} judgeK=${a.judgeK}  ${String(a.drawFn).padEnd(20)}${flag}`);
  }
  const marquee = assets.filter(a => a.K === 3).map(a => a.key);
  const kOk = ['rep-works', 'rep-observatory', 'rep-gardens'].every(k => marquee.includes(k)) && marquee.length === 3;
  console.log(`\n  count: ${assets.length} normalized, ${dropped} dropped (cap ${BATCH.maxAssets})`);
  console.log(`  marquee K:3 = ${marquee.join(', ')}  ${kOk ? '✓ (works·observatory·gardens)' : '✗ EXPECTED works·observatory·gardens'}`);
  if (assets.length !== 12) { console.log(`  ✗ expected 12 specs, got ${assets.length}`); failed++; }
  if (!kOk) failed++;
  console.log(failed ? `\n✗ asset-specs LINT FAILED (${failed})\n` : `\n✓ asset-specs LINT PASS — all ${assets.length} specs normalize through the engine\n`);
  process.exit(failed ? 1 : 0);
}
