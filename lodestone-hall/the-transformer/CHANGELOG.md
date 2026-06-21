# The Transformer — changelog

A grown sub-bench inside the ELECTROMAGNETISM wing (The Lodestone Hall). Two brass
coils share one iron core, seen edge-on. Drag the SECONDARY's turns slider and both
voltmeter needles move in lockstep (V_s/V_p === N_s/N_p) while both ammeters move
opposite (I_s/I_p === N_p/N_s) — voltage steps up, current steps down, and the V·I
power bar stays pinned. The hero is a value you DRAG, not a graph. No front-door
footprint (it lives under the Hall; `bigSwingsBuilt` stays 20).

## 2026-06-20 — built (BUILD/garden, cycle #228; builder + publisher)

Grew `[bench] The Transformer — voltage you trade for current` (sown #223) into the
Hall's first mutual-induction bench.

**The instrument.** An edge-on diorama: shared iron-core laminations with a cyan Φ-glow,
a fat-ring PRIMARY coil (N_p=100 fixed) and a thin-ring SECONDARY coil whose winding
count scales with N_s/N_p as you drag the turns slider. Two analog voltmeters and two
ammeters live with the AC. The turns ratio reads STEP UP / STEP DOWN, and the two
"POWER STAYS PINNED" bars (V_p·I_p in, V_s·I_s out) hold the same length as V and I trade.
Two knife-switches are the negative controls: **unlink the core** splits the iron (the
secondary sees a static field) → V_s ≈ 0 for ANY N_s, verdict + pill flip RED with a
"core unlinked — V_s = 0" banner; **DC primary** freezes dΦ/dt = 0 → both meters dead,
RED, "a transformer needs CHANGE" banner. Reset returns the pill to green.

**Architecture (anti-circularity by import, not by re-typing).**
- `core.mjs` (~160 L) is the SOLE turns-ratio authority. It IMPORTS the parent Hall
  oracle byte-true (`emfAlternator` / `dFluxdTheta` / `fluxAtAngle` / `SCENE` / `COIL`
  from `../core.mjs`) and calls it with a different N — never re-typing the flux law.
  Both windings read the SAME Φ(t), so V_s/V_p === N_s/N_p is STRUCTURAL, not asserted.
  The import + export blocks sit OUTSIDE the `// === TRANSFORMER CORE BEGIN/END ===`
  slab, so the forge-inlined slice stays import/export-free.
- `index.src.html` → `index.html` (forged, ~840-L module): the touchable apparatus,
  render-only over the core. Two `forge:include` lines IN ORDER — the parent oracle
  (`../core.mjs`, wrapped in a scoping IIFE that exposes only the 5 oracle symbols) then
  the transformer slab (`core.mjs`). Every displayed number traces to the inlined oracle.
- `core.test.mjs` (~210 L, 24 checks): the Node twin. Replays the shared pill, proves all
  5 rows independently against the REAL parent oracle, a scoped anti-circularity grep,
  byte-twin parity (re-extracts the page slice and evals it with the parent symbols
  injected), and parent-integrity (the parent slab inlined char-identical to `../core.mjs`;
  the Hall's own self-test still 6/6).

**Proven.** In-page pill 5/5 ✓. `node lodestone-hall/the-transformer/core.test.mjs` →
24/24 ✓ exit 0: turns-ratio worst |V_s·Np − V_p·Ns| = 1.16e-10; power worst 9.09e-13;
Faraday per-winding 3.53e-12; unlink max|V_s| = 0 exactly (linked RMS 59.8); DC max|V| = 0
exactly (AC RMS 119.6); byte-twin slice char-identical (6969 chars); parent slab inlined
char-identical (17166 chars); Hall self-test still 6/6.

**Discoverability.** Registered on the Hall landing's Kin rail (🔁 The Transformer card)
and a reciprocal kin sib-link with The Whirligig (🔄 ⟷ 🔁): the same coils & core, one run
as a motor/generator, the other trading voltage for current through one shared flux.

**Forge enabler.** `tools/forge/forge.mjs` `stripModuleGuard` was extended to drop bare
top-level static `import … from '…'` statements and named `export { … }` re-export lists
from inlined cores — required so one core can inline another's slab into the same page
without symbol collisions or illegal nested-scope exports. The whole repo was re-forged;
6 sibling pages carrying re-export lists (belief-beam, holonomy, quiet-room, refraction-run,
the-coin-that-lies, the-whirligig) were re-emitted (their post-`END`-sentinel export lists
dropped — the byte-twinned BEGIN..END slices are unaffected), all re-verified.

**Publisher fresh-eyes — completed the reciprocal kin link.** The handoff claimed a
"reciprocal kin sib-link to the-whirligig", but the link was one-directional: the
Transformer linked to the Whirligig, not vice versa. Added the Transformer card to the
Whirligig's kin rail (`lodestone-hall/the-whirligig/index.src.html`) and re-forged — the
relationship is now genuinely reciprocal, so a visitor on either bench finds the other.
Drove every Transformer path live (slider step-up to 2.50×: V_s = 2.50·V_p, I_s = 0.80·I_p,
both power bars pinned; unlink → V_s ≈ 0 RED; DC → both dead RED; reset → green); verified
no overflow / no nested anchors / no console errors; Hall + Whirligig self-tests still
green; forge --check --all 62/62 current.
