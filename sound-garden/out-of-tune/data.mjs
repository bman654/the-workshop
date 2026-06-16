// ============================================================================
//  OUT OF TUNE — CORE A: the orrery's planet data, the leaf's SOLE copy.
//
//  WHY A SEPARATE MODULE.  The Orrery (../../orrery/index.html) has no importable
//  core, so this leaf copies ONLY the two INDEPENDENTLY-stored JPL fields per body
//  — the semi-major axis `a` (AU) and the sidereal `period` (years). Their
//  agreement under Kepler's third law a^(3/2) === period is REAL proof, not a
//  tautology: `a` and `period` are stored separately in the orrery and were
//  measured separately by astronomers. This ONE module is imported by BOTH the
//  page and the Node twin (out-of-tune/core.test.mjs), so the parity assertion in
//  the test confirms the test did NOT re-type the array — there is a single copy.
//
//  `col` values are the orrery's BODIES[].col, byte-for-byte, so the brass rings
//  glow in the planet's true tint. Pluto is present but OFF by default and honestly
//  labelled a dwarf (mirroring the orrery). Verified against orrery/index.html.
// ============================================================================

// Each planet: a = semi-major axis (AU), period = sidereal period (years), col = orrery tint.
export const PLANETS = [
  { name:"Mercury", a:0.38709927,  period:0.2408,  col:"#b7b0a6" },
  { name:"Venus",   a:0.72333566,  period:0.6152,  col:"#e8d6a3" },
  { name:"Earth",   a:1.00000261,  period:1.0000,  col:"#5b9bd5" },
  { name:"Mars",    a:1.52371034,  period:1.8808,  col:"#c1572f" },
  { name:"Jupiter", a:5.20288700,  period:11.862,  col:"#cda983" },
  { name:"Saturn",  a:9.53667594,  period:29.457,  col:"#e0c780" },
  { name:"Uranus",  a:19.18916464, period:84.011,  col:"#9fd4d8" },
  { name:"Neptune", a:30.06992276, period:164.79,  col:"#4a6fd8" },
];

// Pluto — a dwarf planet, OFF by default (mirrors the orrery). It still PASSES
// Kepler (rel residual 0.0343%) and, if turned into the audible chord, adds one
// honest adjacent pair (Neptune→Pluto ≈ +5.70¢ off the just fifth) that keeps the
// whole band inside the pinned 3–60¢ window.
export const PLUTO = { name:"Pluto", a:39.48211675, period:248.0, col:"#caa98c", dwarf:true };

// Concordia — a FICTIONAL negative control (NOT a real body). Its period is an
// EXACT clean 3:2 with Earth; its `a` is DERIVED from Kepler (a = period^(2/3)) so
// it sits on the law to ~1 ULP. When toggled into the chord it sings a pure,
// beat-free fifth (330 Hz exactly) beside the sour real planets — the audible
// "what clean sounds like" reference. Visually distinct (drawn as a phantom ring).
//   a = 1.5^(2/3) = 1.3103706971044482 ;  a^1.5 = 1.4999999999999998 (1 ULP off 1.5).
export const CONCORDIA = { name:"Concordia", a:Math.pow(1.5, 2/3), period:1.5, col:"#9be7c4", fictional:true };
