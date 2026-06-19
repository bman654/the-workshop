// The Rotation Bench — logic core (the curve that won't fall).
//
// THE WHOLE POINT: spin a spiral galaxy and ask how fast a star orbits at radius r.
// Newton answers in one line: a circular orbit balances gravity, so the speed is set
// ENTIRELY by the mass enclosed inside that radius —
//      v(r) = √( G · M(<r) / r ).
// Past the bright edge of a galaxy the VISIBLE mass stops growing (the stars run out),
// so M(<r) saturates and v(r) → √(M/r) ∝ 1/√r: a KEPLERIAN fall, the same √(1/r) droop
// the planets obey past the Sun. Every honest accounting of the stars and gas you can
// SEE predicts that fall. The galaxies refuse: their rotation curves go FLAT — v nearly
// constant out to the last measured point. A flat v means v²·r = G·M(<r) keeps GROWING
// linearly: M(<r) ∝ r. There is mass out there that emits no light, piling up faster than
// the stars do. That is the dynamical fingerprint of dark matter, enacted as a curve you
// trim until it stops falling.
//
// THE CATCH, AS A THEOREM (why "just more stars" cannot save it): you cannot rescue the
// flat tail by cranking up the disk's mass-to-light ratio. The visible disk's mass is
// BOUNDED (an exponential disk encloses at most Mdisk total), so the visible-only curve
// is √(1/r) past saturation NO MATTER how heavy you make the stars — scaling Mdisk lifts
// the whole curve but never bends the outer SHAPE off Kepler. Only mass that keeps
// growing with r — an isothermal halo, ρ ∝ 1/r² ⇒ M(<r) ∝ r ⇒ v flat — can flatten it.
// The self-test proves this exhaustively: sweep Mdisk over its whole band with ρ0≡0 and
// the outer residual NEVER drops within σ. Flatness must be EARNED by enclosed mass that
// grows, not asserted by a heavier disk.
//
// THE NEGATIVE CONTROL: ρ0 = 0 kills the halo. Then vTotal === vVisible EXACTLY (not to a
// tolerance — identically), the Keplerian −½ tail returns, and resolved() can never be
// true: the latch is dead. A second guard (fakeFlatByHand) clamps v to a constant and is
// caught by the v²·r === G·M(<r) identity — its IMPLIED enclosed mass ≠ the real M(<r), so
// hand-painted flatness fails the very law that defines a circular orbit.
//
// THE WINDING BOUND (the animation IS the proof): a star at radius r sweeps angle at rate
// ω(r) = v(r)/r. With visible mass only, ω falls off STEEPLY (Keplerian ω ∝ r^−3/2), so the
// outer arms lag the inner and the spiral winds up and smears into a fuzzy disk over a few
// turns — the classic winding problem. A flat curve has ω ∝ 1/r, a gentler fall, so the
// outer arms keep pace and the pattern lives longer. The bound the page draws and the test
// certifies: ω_vis(r_out)/ω_vis(r_in) < ω_halo(r_out)/ω_halo(r_in) — the visible-only disk
// shears HARDER, so the smearing you SEE is the certified quantity, not decoration.
//
// UNITS: G ≡ 1; r in disk scale-lengths Rd (Rd ≡ 1); M in scaled mass units; v in √(G·M/Rd).
// Every claim below is a dimensionless SHAPE or SCALING law (a −½ log-log slope, M∝r, a
// ratio of ω's) — not a catalogue number. The amber "M/L unphysical" flag the page raises
// is likewise about this bench's SCALED units, never a real M/L figure.
//
// SOURCING (anti-drift, encoded in core.test.mjs): index.html inlines the block between the
// ROTATION-CURVE CORE sentinels byte-for-byte; the twin byte-parity-checks the inlined copy
// so it can never silently drift. Zero-dep ESM. No randomness in the math, no wall-clock —
// every exported function is a pure total function (the LCG is for the decorative star field
// only and lives in the view layer, never in a claim).

// ===== ROTATION-CURVE CORE (byte-identical to core.mjs) =====
"use strict";

const G = 1;            // gravitational constant, set to 1 (scaled units)
const RD = 1;           // disk scale length, the unit of radius

// ── enclosed visible mass: an exponential disk + a saturating bulge ──────────────────────
// An exponential surface density Σ(r) = Σ0·e^(−r/Rd) encloses (treated as a spherical proxy
// for the dynamical mass interior to r — the standard pedagogical closed form):
//      Mdisk_enc(r) = Mdisk · [ 1 − (1 + r/Rd)·e^(−r/Rd) ].
// As r → ∞ this → Mdisk: the visible mass is BOUNDED. That bound is the whole catch.
// The bulge is a Hernquist-style saturating core, Mbulge·r²/(r+ab)², adding mass only at
// small r (it too saturates, so it cannot flatten the far tail either).
function MdiskEnc(r, p){
  const x = r / RD;
  return p.Mdisk * (1 - (1 + x) * Math.exp(-x));
}
function MbulgeEnc(r, p){
  const ab = p.ab > 0 ? p.ab : 1e-9;
  return p.Mbulge * (r * r) / ((r + ab) * (r + ab));
}
function MvisEnc(r, p){
  return MdiskEnc(r, p) + MbulgeEnc(r, p);
}

// ── enclosed halo mass: a (pseudo-)isothermal sphere, ρ(r) = ρ0 / (1 + (r/rc)²) ──────────
//      Mhalo_enc(r) = 4π·ρ0·rc³·( r/rc − atan(r/rc) ).
// Far out (r ≫ rc) the atan → π/2 (a constant), so Mhalo_enc(r) → 4π·ρ0·rc²·r: mass grows
// LINEARLY with r forever ⇒ v → √(4π·ρ0·rc²) = constant. ρ ∝ 1/r² is exactly the density
// law whose enclosed mass is ∝ r, which is exactly the law that makes v flat. ρ0 = 0 ⇒ 0.
function MhaloEnc(r, p){
  if (p.rho0 === 0) return 0;
  const rc = p.rc > 0 ? p.rc : 1e-9;
  return 4 * Math.PI * p.rho0 * rc * rc * rc * (r / rc - Math.atan(r / rc));
}

// ── the circular-orbit law (THE claim) — one function, used by the visual AND the proof ──
// v = √(G · Menc / r). Guard: r ≤ 0 has no circular orbit (return 0, never NaN/Infinity).
function vCirc(Menc, r){
  if (r <= 0) return 0;
  return Math.sqrt(G * Menc / r);
}

// the visible-only curve (stars + gas you can SEE) and the total curve (+ dark halo).
function vVisible(r, p){ return vCirc(MvisEnc(r, p), r); }
function vTotal(r, p){ return vCirc(MvisEnc(r, p) + MhaloEnc(r, p), r); }

// the DISK-ALONE curve. The exponential disk is the cleanest carrier of the Keplerian-tail
// claim: MdiskEnc(r) → Mdisk EXACTLY (the (1+x)e^−x term underflows to 0 by r≈50Rd), so the
// disk-only curve is √(Mdisk/r) ∝ r^−½ to machine precision — an EXACT −½ log-log slope. The
// bulge is also bounded (and also Keplerian asymptotically) but its mass approaches its total
// only as O(1/r), so it pollutes a 1e-9 slope claim; the strict-tail legs therefore certify
// the disk-only curve, while the full vVisible droops to Kepler more gently (tested loosely).
function vDisk(r, p){ return vCirc(MdiskEnc(r, p), r); }

// angular speed of a star on a circular orbit at radius r: ω = v / r (radians per unit time).
// This is the SOLE driver of both the spinning galaxy and the winding beat — the visual IS ω.
function omega(r, vfn, p){
  if (r <= 0) return 0;
  return vfn(r, p) / r;
}
function omegaVis(r, p){ return omega(r, vVisible, p); }
function omegaTotal(r, p){ return omega(r, vTotal, p); }
function omegaDisk(r, p){ return omega(r, vDisk, p); }

// ── the 8 observed pins (the data the curve must reach) ───────────────────────────────────
// r in Rd; vObs in scaled v; sigma is the ±1σ whisker. SINGLE-SOURCED here: the renderer's
// pins, the witness fit, and the test's residual sweep all read THIS table. The inner pins
// rise with the disk; the OUTER pins are deliberately FLAT (≈ constant v) — that flatness is
// what the visible-only Keplerian tail can never reach and the halo can.
function observedPins(){
  return [
    { r: 0.5,  vObs: 0.92, sigma: 0.06 },
    { r: 1.0,  vObs: 1.30, sigma: 0.06 },
    { r: 1.8,  vObs: 1.54, sigma: 0.06 },
    { r: 3.0,  vObs: 1.66, sigma: 0.06 },
    { r: 5.0,  vObs: 1.70, sigma: 0.06 },
    { r: 8.0,  vObs: 1.71, sigma: 0.06 },
    { r: 12.0, vObs: 1.71, sigma: 0.06 },
    { r: 18.0, vObs: 1.70, sigma: 0.06 },
  ];
}

// ── the WITNESS: a physical parameter set that fits all 8 pins within σ (legs 4 + the page
// "RESOLVED" default). Mdisk is in the bench's physical band (≤ MDISK_MAX). ρ0, rc wind in a
// halo whose flat asymptote √(4π·ρ0·rc²) matches the outer pins. ──
const MDISK_MAX = 6.0;   // the luminous knob's ceiling — the heaviest physical disk this bench allows
const RHO0_MAX  = 0.20;  // the dark-halo crank's ceiling
function witness(){
  return { Mdisk: 4.0, Rd: RD, Mbulge: 0.1, ab: 0.8, rho0: 0.17, rc: 1.2 };
}
// the visible-only parameters (halo killed) — the negative control the page's toggle throws.
function killHalo(p){ return Object.assign({}, p, { rho0: 0 }); }

// ── resolved(params): the SINGLE fit predicate, called by BOTH the page's latch and the test.
// TRUE iff every observed pin is matched within its 1σ whisker, i.e. the worst standardized
// residual max_i |vTotal(r_i) − vObs_i| / σ_i is < 1. This is the latch condition; nothing
// else throws the solenoid bar. ──
function maxResidual(p){
  let worst = 0;
  for (const pin of observedPins()){
    const res = Math.abs(vTotal(pin.r, p) - pin.vObs) / pin.sigma;
    if (res > worst) worst = res;
  }
  return worst;
}
function resolved(p){
  return maxResidual(p) < 1;
}

// the NEGATIVE-CONTROL theorem helper: the best the luminous knob can do ALONE (ρ0 ≡ 0) at the
// outer pins. Sweeps Mdisk across its whole physical band and returns the smallest achievable
// worst-OUTER standardized residual. If this stays ≥ 1 the disk can NEVER reach the flat tail.
function bestVisibleOnlyOuterResidual(pBase, steps = 600){
  const pins = observedPins().filter(pin => pin.r >= 5.0);   // the outer, flat pins
  let best = Infinity;
  for (let i = 0; i <= steps; i++){
    const Mdisk = (MDISK_MAX) * (i / steps);
    const p = Object.assign({}, pBase, { Mdisk, rho0: 0 });
    let worst = 0;
    for (const pin of pins){
      const res = Math.abs(vVisible(pin.r, p) - pin.vObs) / pin.sigma;
      if (res > worst) worst = res;
    }
    if (worst < best) best = worst;
  }
  return best;
}

// fakeFlatByHand: the SECOND neg-control. A furnace of dishonesty — it just CLAMPS v to a
// constant, asserting flatness instead of earning it. The v²·r === G·M(<r) identity catches
// it: its implied enclosed mass (vFlat²·r/G) is a straight line through the origin, which is
// NOT the real M(<r). Hand-painted flatness disagrees with the law that defines a circular orbit.
function fakeFlatByHand(r, vFlat){ return vFlat; }
function impliedMassFromV(v, r){ return v * v * r / G; }   // invert v=√(GM/r): M = v²r/G

// ── the self-test: the bench proves its own claims numerically ────────────────────────────
function runSelfTest(){
  const checks = [];
  const ck = (name, pass, info) => checks.push({ name, pass, info });
  const p = witness();
  const pVis = killHalo(p);

  // 1 · DEFINITION: vCirc(r)²·r === G·Menc(<r) to <1e-12, swept across r (the orbit law itself).
  {
    let maxAbs = 0;
    for (let i = 1; i <= 200; i++){
      const r = i * 0.25;                       // r ∈ (0, 50]
      const Menc = MvisEnc(r, p) + MhaloEnc(r, p);
      const v = vCirc(Menc, r);
      maxAbs = Math.max(maxAbs, Math.abs(v * v * r - G * Menc));
    }
    ck('1 · circular-orbit law: vCirc(r)²·r === G·M(<r) for all r  (the definition)',
       maxAbs < 1e-12, 'max|v²r − GM| = ' + maxAbs.toExponential(2));
  }

  // 2 · KEPLERIAN TAIL: once the disk mass has saturated, the disk-only curve is √(1/r) — its
  // log-log slope is EXACTLY −½ and v·√r is constant to machine ε. (The exponential disk's
  // residual mass (1+x)e^−x underflows to 0 by r≈50Rd, so MdiskEnc is constant there; this is
  // the cleanest carrier of the claim. The full vVisible droops to Kepler too, but its bulge's
  // O(1/r) approach is reported separately and loosely.) Proven on two ever-farther decades.
  {
    function diskSlope(rA, rB){
      const vA = vDisk(rA, pVis), vB = vDisk(rB, pVis);
      return (Math.log(vB) - Math.log(vA)) / (Math.log(rB) - Math.log(rA));
    }
    const s1 = diskSlope(50, 500);              // [50Rd, 500Rd] — disk fully saturated
    const s2 = diskSlope(100, 1000);            // [100Rd, 1000Rd] — deeper still
    // v·√r constant once saturated (disk-only):
    let maxRel = 0;
    const ref = vDisk(200, pVis) * Math.sqrt(200);
    for (const r of [100, 200, 400, 700, 1000]){
      const c = vDisk(r, pVis) * Math.sqrt(r);
      maxRel = Math.max(maxRel, Math.abs(c - ref) / ref);
    }
    // the FULL visible curve (disk+bulge) also droops toward Kepler (looser — bulge's 1/r tail):
    const sFull = (Math.log(vVisible(200, pVis)) - Math.log(vVisible(20, pVis))) / (Math.log(200) - Math.log(20));
    ck('2 · KEPLERIAN tail: disk-only log-log slope === −½ and v·√r constant once saturated',
       Math.abs(s1 + 0.5) < 1e-9 && Math.abs(s2 + 0.5) < 1e-9 && maxRel < 1e-9 && sFull < -0.45,
       'disk slope[50,500]=' + s1.toFixed(12) + ' [100,1k]=' + s2.toFixed(12) + ' v√r relΔ=' + maxRel.toExponential(2) + ' · full vVisible slope≈' + sFull.toFixed(3));
  }

  // 3 · HALO FLAT: the isothermal halo ALONE → v constant over a far decade (to <1e-3) AND its
  // enclosed mass M(<r)/r → 4π·ρ0·rc² (M ∝ r ⟺ v flat, proven in BOTH directions).
  {
    const pHalo = { rho0: p.rho0, rc: p.rc, Mdisk: 0, Rd: RD, Mbulge: 0, ab: 1 };
    const vAsym = Math.sqrt(4 * Math.PI * p.rho0 * p.rc * p.rc);   // the flat asymptote
    // the isothermal flat asymptote is approached as O(1/r) (the atan correction), so a <1e-3
    // claim genuinely needs r ≫ rc — sample a far decade, [3000Rd, 30000Rd].
    let maxVrel = 0;
    for (const r of [3000, 6000, 12000, 24000, 30000]){
      const v = vCirc(MhaloEnc(r, pHalo), r);
      maxVrel = Math.max(maxVrel, Math.abs(v - vAsym) / vAsym);
    }
    const Mover_r_asym = 4 * Math.PI * p.rho0 * p.rc * p.rc;       // M(<r)/r → this constant
    let maxMrel = 0;
    for (const r of [3000, 12000, 30000]){
      const Mr = MhaloEnc(r, pHalo) / r;
      maxMrel = Math.max(maxMrel, Math.abs(Mr - Mover_r_asym) / Mover_r_asym);
    }
    ck('3 · HALO flat: isothermal halo alone → v const (M ∝ r ⟺ flat, both directions)',
       maxVrel < 1e-3 && maxMrel < 1e-3,
       'v relΔ=' + maxVrel.toExponential(2) + ' (vAsym=' + vAsym.toFixed(4) + ') · M/r relΔ=' + maxMrel.toExponential(2));
  }

  // 4 · DATA REACHABLE: the shipped witness fits all 8 pins within σ ⇒ resolved() === true.
  {
    const worst = maxResidual(p);
    let allWithin = true;
    for (const pin of observedPins()) if (Math.abs(vTotal(pin.r, p) - pin.vObs) >= pin.sigma) allWithin = false;
    ck('4 · DATA reachable: the witness (ρ0,rc,Mdisk) fits all 8 pins within σ ⇒ resolved()===true',
       allWithin && resolved(p) === true,
       'worst standardized residual = ' + worst.toFixed(3) + 'σ  (Mdisk=' + p.Mdisk + ', ρ0=' + p.rho0 + ', rc=' + p.rc + ')');
  }

  // 5 · THE KNOB ALONE CANNOT (the catch as theorem): exhaustively sweep Mdisk over its FULL
  // band with ρ0 ≡ 0; the smallest achievable worst-OUTER residual stays > σ at EVERY setting.
  // (Verified against the SAME pin table as leg 4 — legs 4 and 5 are mutually consistent.)
  {
    const best = bestVisibleOnlyOuterResidual(p, 800);
    ck('5 · the knob ALONE cannot: ∀Mdisk with ρ0≡0, best worst-outer residual > σ (Kepler can\'t reach the flat tail)',
       best > 1, 'min over full Mdisk band of worst-outer residual = ' + best.toFixed(3) + 'σ  (> 1 ⇒ unreachable)');
  }

  // 6 · NEG-CONTROL: ρ0=0 ⇒ vTotal === vVisible EXACTLY ⇒ Kepler tail returns ⇒ resolved()===false
  // ⇒ the latch can never throw. PLUS the fakeFlatByHand guard: a clamp-to-constant FAILS the
  // leg-1 identity (its implied Menc ≠ G·Menc) and DISAGREES with the real curve at the outer pins.
  {
    let exact = true;
    for (let i = 1; i <= 120; i++){
      const r = i * 0.4;
      if (vTotal(r, pVis) !== vVisible(r, pVis)) exact = false;   // === , not <ε
    }
    const latchDead = resolved(pVis) === false;
    // fakeFlatByHand: clamp v to the flat asymptote; its implied mass is a LINE, not the real M(<r).
    const vFlat = 1.71;
    let handCaught = false, disagrees = false;
    for (const r of [8, 12, 18]){
      const implied = impliedMassFromV(fakeFlatByHand(r, vFlat), r);   // = vFlat²·r
      const real = MvisEnc(r, pVis);                                   // the honest enclosed mass
      if (Math.abs(implied - real) > 1e-6) handCaught = true;          // identity broken ⇒ caught
      if (Math.abs(fakeFlatByHand(r, vFlat) - vVisible(r, pVis)) > 1e-6) disagrees = true;
    }
    ck('6 · NEG-CONTROL: ρ0=0 ⇒ vTotal===vVisible exactly ⇒ resolved()===false; hand-flatness fails v²r=GM',
       exact && latchDead && handCaught && disagrees,
       'exact=' + exact + ' latchDead=' + latchDead + ' hand-painted flatness caught by v²r=GM=' + handCaught);
  }

  // 7 · WINDING BOUND: ω_vis(r_out)/ω_vis(r_in) < ω_halo(r_out)/ω_halo(r_in) — the visible-only
  // disk shears HARDER, so the smearing the animation shows is the certified quantity. (ω_halo
  // here is the TOTAL flat-curve ω with the halo wound in.)
  {
    const rIn = 2.0, rOut = 12.0;
    const visRatio  = omegaVis(rOut, pVis)   / omegaVis(rIn, pVis);     // steeper fall (smaller)
    const haloRatio = omegaTotal(rOut, p)    / omegaTotal(rIn, p);      // gentler fall (larger)
    ck('7 · WINDING bound: ω_vis(out)/ω_vis(in) < ω_halo(out)/ω_halo(in) (visible disk shears harder)',
       visRatio < haloRatio,
       'ω_vis ratio=' + visRatio.toFixed(4) + ' < ω_halo ratio=' + haloRatio.toFixed(4));
  }

  const passed = checks.filter(c => c.pass).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}

// ===== END ROTATION-CURVE CORE =====

export {
  G, RD, MDISK_MAX, RHO0_MAX,
  MdiskEnc, MbulgeEnc, MvisEnc, MhaloEnc,
  vCirc, vVisible, vTotal, vDisk, omega, omegaVis, omegaTotal, omegaDisk,
  observedPins, witness, killHalo, maxResidual, resolved,
  bestVisibleOnlyOuterResidual, fakeFlatByHand, impliedMassFromV,
  runSelfTest,
};
