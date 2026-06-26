# The Long Way Home — CHANGELOG

A new top-level GROUNDS room (the Processional Ground, north of the manor): the twelve
stations of the hero's journey, WALKED as a tilted ring that sinks below one horizon into a
frozen star sky and climbs back to a new dawn — each beat braided across three myths.

## Cycle #329 — founded (BUILD / grounds, a big swing)

The opening swing. Built whole in one pass:

- **Form.** Hand-rolled pseudo-3D (no Three.js): the 12-station ring tipped near edge-on, a
  thin luminous band crossing ONE horizon — a short lit Day arc (I–V), a long dark Night arc
  (VI–XI), the textured descent-and-return profile (III's recoil bump, IX's deep glint). The
  whole sky + camera vertical centre TRANSLATE so the active station frames at reading
  height; descending into The Ordeal sinks the firmament overhead, the Return raises it into
  dawn-gold. Stars anchored to the horizon as a fixed frozen field.
- **Two felt gates, passed through.** Gate A — Inanna's seven-fold lapis underworld lintel
  (descent; warm→cold, drone dims). Gate B — the pale Gate of Horn (dawn; cold→gold, drone
  swells). Reversible.
- **The leaf & the braid.** On arrival an illuminated leaf unfolds: gold drop-initial, the
  canonical name + numeral, the beat, the keyword, a woven rubricated sentence, and three
  tautness-weighted myth strands (Odysseus sea-blue · Inanna lapis-and-carnelian · the
  Prodigal olive-and-russet) with a left-margin SVG braid. The honesty device: where a myth
  strains (Inanna's absent Refusal; the Prodigal's absent Mentor + inverted Refusal) its
  ribbon runs THIN — the asymmetry IS the lesson.
- **Content.** All 12 stations × 3 myths written at illuminated-manuscript density in a single
  source-of-truth table `stations.mjs`, with per-cell tautness encoding the strain.
- **Sound.** In-house Web Audio: a warm Day drone, a sparse cold Night pad, a fuller Dawn
  chord (gain-lerped on arc, dimmed at Gate A, swelled at Gate B); mote-glide, page-chime,
  stone thud. One shared bus; honours the estate mute; unlocked on the begin-curtain click.
- **Content-fidelity check.** `stations.test.mjs` → 165/165 PASS (12 stations, 36/36 myth
  cells whole, names canonical, two gate boundaries, the honesty device present in the data).
  The room carries no numeric claim, so this stands in for a self-test.
- **Integration.** New GROUNDS wing `processions` ("THE PROCESSIONAL GROUND") seated in the
  open upper-central court north of the manor (GROUNDS_WINGS + WING_META in layout.js); one
  PLACES entry (tier 1) with a bespoke `procession-band` footprint; catalog star at (215,448)
  beside its companion the Orrery. Forge clean (`--check --all` current); smoke / sky-test /
  audit-seen all green; the FOOTPRINTS mirror refreshed.
- **Fresh-eyes (real browser).** Walked the full ring; both gates crossed; the sink reads as
  a true DESCENT (not scrolling); dusk→star-cold→dawn-gold confirmed; leaves open with the
  three-myth braid woven (rubricated names + tautness-weighted ribbons, the thin Inanna-
  Refusal ribbon verified); 0 console errors; audio ctx running; no horizontal overflow at
  1440 and 390 widths.
