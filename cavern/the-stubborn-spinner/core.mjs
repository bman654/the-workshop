// ============================================================================
//  THE CAVERN · THE STUBBORN SPINNER — the RIGID-ROTOR LADDER CORE
//  (the SOLE authority for the quantum rotor's energies, gaps, audio map, and
//   the ℓ(ℓ+1)-vs-ℓ² verdict).
//
//  Pure, dependency-free, headless — no Web Audio, no DOM. The page (index.html)
//  inlines the slice between the // === CORE BEGIN/END === sentinels
//  BYTE-IDENTICAL; the Node twin (core.test.mjs) re-extracts BOTH slices and
//  asserts char-for-char parity. Recompute NOTHING in the UI/audio layers — they
//  consume these exports.
//
//  UNITS: ℏ²/2I = 1, so a rigid rotor's energy is the integer-exact
//      E_ℓ = ℏ²ℓ(ℓ+1)/2I  →  E_ℓ = ℓ(ℓ+1)  =  0, 2, 6, 12, 20, 30, 42, …
//  Gaps E_{ℓ+1}−E_ℓ = 2(ℓ+1) = 2,4,6,8,…  (an EVEN comb). Each level carries
//  degeneracy 2ℓ+1 (the m = −ℓ…+ℓ orientations).
//
//  HONESTY HEADER (read this): This ladder is closed-form integer-exact; the
//  <1e-12 headline is met with ZERO residual — there is no numerical drama in the
//  precision. The INTERESTING claim is the NEG-CONTROL SEPARATION (the successive-
//  gap RATIO), NOT headline precision. A naive curvature test (gaps-of-gaps) is a
//  TRAP: it equals 2 for the ℓ² cheat too. Only the RATIO of successive gaps
//  tells the true ℓ(ℓ+1) rotor apart from the ℓ² impostor (= the box's n² comb).
//
//  THE AUDIO MAP is deliberately LINEAR (Hz ∝ gap), NOT the harmonic voicing of
//  the Hear-the-Ladder bench: equal ENERGY gaps map to equal Hz gaps, so the
//  audible SECOND DIFFERENCE of the transition tones is a literal constant
//  (= 2·TONE_PER_UNIT). That is the rotor's even comb made hearable.
// ============================================================================

// === CORE BEGIN ===
  // ── THE TWO LADDERS ────────────────────────────────────────────────────────
  // The TRUE rigid rotor (ℏ²/2I = 1): E_ℓ = ℓ(ℓ+1) — integer-exact, no rung-0 lift
  // (ℓ=0 is genuinely STILL, E=0). degeneracy(ℓ)=2ℓ+1 is the count of m-orientations.
  function Erot(l){ return l * (l + 1); }
  // The ℓ² CHEAT — a real competing system, NOT a strawman: ℓ²'s gaps are the odd
  // comb {1,3,5,7…}, which is EXACTLY the box's n² spectrum. The whole point of the
  // neg-control is that a curvature test cannot tell it from the rotor.
  function Echeat(l){ return l * l; }
  function degeneracy(l){ return 2 * l + 1; }

  // ── GAPS, CURVATURE (the TRAP), AND THE RATIO (the DISCRIMINATOR) ───────────
  // gap = first difference E(ℓ+1)−E(ℓ). For the rotor this is 2(ℓ+1)=2,4,6,8,…
  function gap(E, l){ return E(l + 1) - E(l); }
  // gap2 = the second difference (gaps-of-gaps). THIS IS THE TRAP: gap2 ≡ 2 for the
  // rotor AND for the ℓ² cheat (both gap combs {2,4,6,8} and {1,3,5,7} have constant
  // second difference 2). A curvature test gives a FALSE GREEN — do NOT verdict on it.
  function gap2(E, l){ return gap(E, l + 1) - gap(E, l); }
  // gapRatio = successive-gap RATIO — the genuine discriminator. For the rotor it is
  //   (ℓ+2)/(ℓ+1)  (=2 at ℓ=0); for the cheat it is (2ℓ+3)/(2ℓ+1) (=3 at ℓ=0). These
  // DIVERGE at the very first rung and NEVER coincide for any ℓ≥0 — that separation,
  // not the curvature, is what the verdict is keyed to.
  function gapRatio(E, l){ return gap(E, l + 1) / gap(E, l); }
  // The spectral LINE at the ℓ→ℓ+1 transition is the gap itself (ΔE on absorption).
  function lineFreq(E, l){ return gap(E, l); }

  // ── THE RATE-SPACE SHELVES (the dial's allowed perches) ─────────────────────
  // The dial drives an angular RATE ω; the rotor only allows ω_ℓ = √(ℓ(ℓ+1)) (the
  // classical rate whose energy ½Iω² matches the quantum rung in these units). ω_0=0,
  // so ℓ=0 is genuinely STILL. These widen with ℓ — the shelves the knob snaps to.
  function shelves(lMax){
    var s = [];
    for (var l = 0; l <= lMax; l++) s.push(Math.sqrt(Erot(l)));
    return s;
  }
  // Given a raw drive rate, the index ℓ of the NEAREST shelf (where the rotor catches).
  function nearestShelf(drive, shelves){
    var best = 0, bestD = Infinity;
    for (var i = 0; i < shelves.length; i++){
      var d = Math.abs(drive - shelves[i]);
      if (d < bestD){ bestD = d; best = i; }
    }
    return best;
  }
  // The RETURN FORCE the dial fights, in [0,1]: 0 exactly on a shelf, → 1 mid-gap,
  // and weighted by the ENERGY step ΔE so resistance is HEAVIER up the ladder (the
  // dial drives rate ≈evenly, but the spring you fight is keyed to ΔE — the one real
  // design insight). l is the shelf the drive is being pulled toward.
  function strain(drive, l, shelves, E){
    var here = shelves[l];
    // local half-width to the neighbouring shelf, in rate units
    var lo = (l > 0) ? shelves[l - 1] : here;
    var hi = (l < shelves.length - 1) ? shelves[l + 1] : here;
    var span = Math.max(here - lo, hi - here, 1e-9);
    var frac = Math.min(1, Math.abs(drive - here) / span);   // 0 at shelf → 1 toward next
    // weight by ΔE of the rung you'd climb to, normalised so the top of the shown
    // ladder reads ~1; heavier springs higher up.
    var dE = (l < shelves.length - 1) ? gap(E, l) : gap(E, Math.max(0, shelves.length - 2));
    var dEref = gap(E, Math.max(0, shelves.length - 2)) || 1;
    return Math.min(1, frac * (0.45 + 0.55 * dE / dEref));
  }

  // ── THE AUDIO MAP (LINEAR: Hz ∝ gap; see header) ────────────────────────────
  // A transition tone is the line ΔE mapped to pitch by a LINEAR rule, so equal
  // energy gaps → equal Hz gaps and the audible second difference is a constant.
  var TONE_BASE_HZ = 196;     // ℓ=0→1 (gap 2) lands here — G3
  var TONE_PER_UNIT = 49;     // Hz per unit of ΔE; gap 2 → base, gap 4 → +98, …
  function gapToHz(g){ return TONE_BASE_HZ + (g - 2) * TONE_PER_UNIT; }
  function transitionHz(l){ return gapToHz(gap(Erot, l)); }       // rotor line ℓ→ℓ+1
  function transitionHzCheat(l){ return gapToHz(gap(Echeat, l)); } // cheat line ℓ→ℓ+1
  function spectrumHz(lmax){
    var a = []; for (var l = 0; l <= lmax; l++) a.push(transitionHz(l)); return a;
  }
  function spectrumHzCheat(lmax){
    var a = []; for (var l = 0; l <= lmax; l++) a.push(transitionHzCheat(l)); return a;
  }

  // ── THE VERDICT (drives the neg-control lamp) ───────────────────────────────
  // E is whichever ladder is wired in (Erot or Echeat). The verdict is driven by
  // ratioMatchesRotor — gapRatio(E,ℓ) === (ℓ+2)/(ℓ+1) within 1e-12 at every rung —
  // NEVER by secondDiffConst (which is true for the cheat too). secondDiffConst is
  // REPORTED so the lamp can teach "the curvature looks identical; the ratio differs."
  function evaluateSpectrum(E, lMax){
    var secondDiffConst = true, ratioMatchesRotor = true;
    for (var l = 0; l + 2 <= lMax; l++){
      if (Math.abs(gap2(E, l) - 2) > 1e-12) secondDiffConst = false;
    }
    for (var k = 0; k + 1 <= lMax; k++){
      var rotorRatio = (k + 2) / (k + 1);
      if (Math.abs(gapRatio(E, k) - rotorRatio) > 1e-12) ratioMatchesRotor = false;
    }
    return {
      secondDiffConst: secondDiffConst,
      ratioMatchesRotor: ratioMatchesRotor,
      lowestGap: gap(E, 0),
      verdict: ratioMatchesRotor ? 'ROTOR' : 'CHEAT'
    };
  }

  // ── THE BUNDLED SELF-TEST (the in-page pill AND the Node twin both run this) ─
  function runSelfTest(){
    var checks = [];
    function ck(name, ok, detail){ checks.push({ name: name, ok: !!ok, detail: detail || '' }); }

    // (1) E_ℓ = ℏ²ℓ(ℓ+1)/2I (units ℏ²/2I=1) integer-exact over ℓ=0..20
    var eOk = true, eWorst = 0;
    for (var l = 0; l <= 20; l++){
      var want = l * (l + 1);
      eWorst = Math.max(eWorst, Math.abs(Erot(l) - want));
      if (Erot(l) !== want) eOk = false;
    }
    ck('E_ℓ = ℏ²ℓ(ℓ+1)/2I exact (ℓ=0..20, ℏ²/2I=1)', eOk && eWorst < 1e-12,
       'E = 0,2,6,12,20,… · max |Δ| = ' + eWorst.toExponential(2));

    // (2) gaps ∝ 2(ℓ+1) = 2,4,6,8 (the EVEN comb), exact over ℓ=0..18
    var gOk = true, gWorst = 0;
    for (var g = 0; g <= 18; g++){
      var gw = 2 * (g + 1);
      gWorst = Math.max(gWorst, Math.abs(gap(Erot, g) - gw));
      if (gap(Erot, g) !== gw) gOk = false;
    }
    ck('gaps ∝ 2(ℓ+1) — the even comb 2,4,6,8 (ℓ=0..18)', gOk && gWorst < 1e-12,
       'max |Δ| = ' + gWorst.toExponential(2));

    // (3) second difference is a constant 2 over ℓ=0..18 — TRUE FOR BOTH LADDERS
    var sdOk = true, sdWorst = 0;
    for (var s = 0; s + 2 <= 18; s++){
      sdWorst = Math.max(sdWorst, Math.abs(gap2(Erot, s) - 2));
      if (gap2(Erot, s) !== 2) sdOk = false;
    }
    ck('second difference constant === 2 (ℓ=0..18)', sdOk && sdWorst < 1e-12,
       'max |gap2−2| = ' + sdWorst.toExponential(2));

    // (4) degeneracy 2ℓ+1 and Σ_{0..n}(2ℓ+1) = (n+1)²
    var dOk = true, sum = 0, sumOk = true;
    for (var d = 0; d <= 8; d++){
      if (degeneracy(d) !== 2 * d + 1) dOk = false;
      sum += degeneracy(d);
      if (sum !== (d + 1) * (d + 1)) sumOk = false;
    }
    ck('degeneracy 2ℓ+1 = 1,3,5,7,… and Σ = (n+1)²', dOk && sumOk,
       '2ℓ+1 orientations per level · running sum is a perfect square');

    // (5) THE TRAP, TAUGHT: gap2(rotor) === gap2(cheat) === 2 — so curvature CANNOT
    //     separate them; the RATIO must.
    var trapOk = (gap2(Erot, 0) === 2) && (gap2(Echeat, 0) === 2) &&
                 (gap2(Erot, 3) === 2) && (gap2(Echeat, 3) === 2);
    ck('the trap: gap2(rotor)===gap2(cheat)===2 — why the RATIO, not the curvature, is the discriminator',
       trapOk, 'cheat gaps 1,3,5,7 ALSO have second difference 2 — a curvature test green-lights the impostor');

    // (6) THE DISCRIMINATOR: gapRatio(rotor,ℓ)=(ℓ+2)/(ℓ+1) ≠ gapRatio(cheat,ℓ) for
    //     every ℓ; verdict is ROTOR for Erot, CHEAT for Echeat.
    var ratioSeparates = true, minSep = Infinity;
    for (var r = 0; r <= 10; r++){
      var rr = gapRatio(Erot, r), cc = gapRatio(Echeat, r);
      var want2 = (r + 2) / (r + 1);
      if (Math.abs(rr - want2) > 1e-12) ratioSeparates = false;
      minSep = Math.min(minSep, Math.abs(rr - cc));
      if (Math.abs(rr - cc) < 1e-12) ratioSeparates = false;   // they must NEVER coincide
    }
    var verdictOk = evaluateSpectrum(Erot, 12).verdict === 'ROTOR' &&
                    evaluateSpectrum(Echeat, 12).verdict === 'CHEAT';
    ck('the ratio separates: (ℓ+2)/(ℓ+1) vs (2ℓ+3)/(2ℓ+1) never coincide · lamp = ROTOR vs CHEAT',
       ratioSeparates && verdictOk, 'min |Δratio| over ℓ=0..10 = ' + minSep.toFixed(4) + ' (sharpest at ℓ=0: 2 vs 3)');

    // (7) AUDIO (LINEAR MAP): the rotor's energy gaps are themselves arithmetic
    //     (2,4,6,8 — constant second difference 2), so the LINEAR Hz map makes the
    //     transition tones arithmetic too: each successive line is exactly
    //     2·TONE_PER_UNIT Hz higher than the last (the audible "widening steps"),
    //     so the tone FIRST-difference is the constant, and the tone SECOND-
    //     difference is exactly 0. ℓ=0→1 lands on TONE_BASE_HZ; rotor≠cheat at ℓ≥1.
    var rising = true, hzStep = true, hzCurve = true, baseOk = transitionHz(0) === TONE_BASE_HZ, differ = true;
    for (var h = 0; h <= 6; h++){
      if (transitionHz(h + 1) <= transitionHz(h)) rising = false;
      if (h + 1 <= 6 && transitionHz(h + 1) - transitionHz(h) !== 2 * TONE_PER_UNIT) hzStep = false;
      if (h + 2 <= 6){
        var sd = (transitionHz(h + 2) - transitionHz(h + 1)) - (transitionHz(h + 1) - transitionHz(h));
        if (sd !== 0) hzCurve = false;
      }
      if (h >= 1 && Math.abs(transitionHz(h) - transitionHzCheat(h)) < 1e-9) differ = false;
    }
    ck('audio map: tones rise by a constant 2·TONE_PER_UNIT (=' + (2 * TONE_PER_UNIT) + ' Hz), ℓ=0→1 === ' + TONE_BASE_HZ + ' Hz, rotor≠cheat (ℓ≥1)',
       rising && hzStep && hzCurve && baseOk && differ, 'equal energy gaps → equal Hz gaps (linear, deliberate); tone 2nd-diff exactly 0');

    var pass = 0; for (var p = 0; p < checks.length; p++) if (checks[p].ok) pass++;
    return { checks: checks, pass: pass, total: checks.length, ok: pass === checks.length };
  }
// === CORE END ===

export {
  Erot, Echeat, degeneracy, gap, gap2, gapRatio, lineFreq,
  shelves, nearestShelf, strain,
  TONE_BASE_HZ, TONE_PER_UNIT, gapToHz, transitionHz, transitionHzCheat, spectrumHz, spectrumHzCheat,
  evaluateSpectrum, runSelfTest,
};
