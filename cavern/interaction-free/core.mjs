// ============================================================================
//  THE CAVERN · THE BOMB THAT TELLS ON ITSELF — the INTERACTION-FREE CORE
//  (the SOLE authority for the Mach–Zehnder amplitudes + the three outcome
//   probabilities for the no-bomb and the live-bomb configurations).
//
//  Pure, dependency-free. The page (index.html) inlines the slice between the
//  CORE BEGIN/END sentinels BYTE-IDENTICAL via forge; `forge --check` is the
//  parity gate. The Node twin (core.test.mjs) imports THIS module and asserts
//  the self-test claim to machine epsilon.
//
//  ── THE ELITZUR–VAIDMAN BOMB TESTER (interaction-free measurement) ──
//  A balanced Mach–Zehnder interferometer: one photon enters the UPPER port,
//  a 50/50 beam-splitter (BS1) splits it across two arms (UPPER, LOWER), two
//  mirrors steer the arms back together, a second 50/50 beam-splitter (BS2)
//  recombines them onto two detectors:
//      D-bright  (the LOWER output port)  — the "always" port
//      D-dark    (the UPPER output port)  — the FORBIDDEN port
//  With NOTHING in the arms the interferometer is tuned so the photon ALWAYS
//  exits D-bright; D-dark is dark by perfect DESTRUCTIVE interference.
//
//  Now drop an Elitzur–Vaidman BOMB into one arm. The bomb is a PERFECT
//  which-path detector: any photon reaching it is absorbed and the bomb
//  detonates (BOOM). That measurement DESTROYS the interference. Per single
//  photon:  P(boom)=½ (it was in the bomb arm), and of the ½ that survive the
//  bomb (it was in the empty arm) BS2 — now with no partner to interfere with —
//  sends it 50/50, so P(bright)=¼ and P(dark)=¼.
//
//  THE KEY FACT this core proves: a D-dark click is IMPOSSIBLE without a bomb
//  present (destructive interference forbids it). So a single dark click PROVES
//  the bomb is live — and the photon that proved it took the EMPTY arm and never
//  went near the bomb. False-positive rate is EXACTLY 0.
//
//  THE OPERATORS (all unitary; amplitudes are exact complex numbers):
//    BS  = (1/√2)·[[1, i],[i, 1]]   (symmetric 50/50: reflection picks up i)
//    mirror = identity on amplitude  (both arms reflect once → a common global
//             phase that cancels; it does not change any probability)
//    bomb in an arm = a projective MEASUREMENT of that arm: with probability
//             |amp_arm|² the photon is THERE → BOOM (state absorbed); else it
//             collapses onto the OTHER arm, the amplitude renormalized to unit
//             norm (the photon was provably NOT in the bomb arm).
// ============================================================================

// === CORE BEGIN ===
  // ── exact complex arithmetic on [re, im] pairs ──
  function cadd(a, b){ return [a[0] + b[0], a[1] + b[1]]; }
  function cmul(a, b){ return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; }
  function cabs2(c){ return c[0] * c[0] + c[1] * c[1]; }     // |c|² (a probability weight)
  var C_I = [0, 1];                                          // the imaginary unit i
  var C_ZERO = [0, 0];
  var C_ONE = [1, 0];
  var INV_SQRT2 = [1 / Math.SQRT2, 0];                       // 1/√2 as a complex scalar

  // ── THE 50/50 BEAM-SPLITTER, the SOLE unitary in this bench ──
  // BS·[u, l] = (1/√2)·[ u + i·l ,  i·u + l ].  Reflection picks up i; transmission
  // is unchanged. This is unitary (BS†BS = I) — the twin proves it numerically.
  function beamSplitter(state){
    var u = state[0], l = state[1];
    var top = cmul(INV_SQRT2, cadd(u, cmul(C_I, l)));
    var bot = cmul(INV_SQRT2, cadd(cmul(C_I, u), l));
    return [top, bot];
  }

  // ── THE MIRROR PAIR — a common phase on both arms; here the identity. ──
  // Both arms reflect off exactly one steering mirror, so any mirror phase is a
  // GLOBAL phase, identical on both modes, and cancels in every |amplitude|².
  // We keep it explicit (and identity) so the propagation reads like the rig.
  function mirrors(state){ return [state[0], state[1]]; }

  // ── THE BOMB AS A PROJECTIVE MEASUREMENT OF ONE ARM ──
  // The bomb sits in arm `bombArm` (0 = UPPER, 1 = LOWER). Splitting the photon's
  // mid-interferometer state into the two measurement branches:
  //   • DETONATE branch: weight |amp_bombArm|² — the photon was in the bomb arm.
  //   • SURVIVE  branch: weight |amp_otherArm|² — the photon was in the empty arm;
  //     the post-measurement state is the photon DEFINITELY in the other arm,
  //     amplitude renormalized to unit norm (phase preserved).
  // Returns { pBoom, survived } where `survived` is the (renormalized) 2-mode
  // amplitude in the no-boom branch, or null if that branch has zero weight.
  function bombMeasure(state, bombArm){
    var other = bombArm === 0 ? 1 : 0;
    var pBoom = cabs2(state[bombArm]);
    var pSurv = cabs2(state[other]);
    var survived = null;
    if (pSurv > 0){
      var norm = Math.sqrt(pSurv);
      var amp = [state[other][0] / norm, state[other][1] / norm];
      survived = bombArm === 0 ? [C_ZERO, amp] : [amp, C_ZERO];
    }
    return { pBoom: pBoom, pSurv: pSurv, survived: survived };
  }

  // ── PROPAGATE one photon through the whole rig → the three outcome probs ──
  // config = { bomb: false|true, bombArm: 0|1 }.  Enter the UPPER port |U⟩.
  // Detectors: D-bright = LOWER output port (index 1); D-dark = UPPER (index 0).
  // Returns { pBright, pDark, pBoom } summing to 1 (the twin asserts it).
  function propagate(config){
    config = config || {};
    var bombArm = config.bombArm === 1 ? 1 : 0;
    var afterBS1 = beamSplitter([C_ONE, C_ZERO]);   // BS1 splits the entering photon

    if (!config.bomb){
      // empty arms: mirrors then BS2 — perfect interference, all to D-bright.
      var out = beamSplitter(mirrors(afterBS1));
      return { pBright: cabs2(out[1]), pDark: cabs2(out[0]), pBoom: 0 };
    }

    // live bomb: it measures `bombArm` between BS1 and BS2.
    var m = bombMeasure(afterBS1, bombArm);
    var pBright = 0, pDark = 0;
    if (m.survived){
      var out2 = beamSplitter(mirrors(m.survived));   // the surviving photon hits BS2
      pBright = m.pSurv * cabs2(out2[1]);
      pDark   = m.pSurv * cabs2(out2[0]);
    }
    return { pBright: pBright, pDark: pDark, pBoom: m.pBoom };
  }

  // ── THE OUTCOME LABELS (the three fates a fired photon can meet) ──
  var FATE_BRIGHT = 'bright';   // landed at D-bright (the always-port)
  var FATE_DARK = 'dark';       // landed at D-dark (the forbidden port — proves the bomb!)
  var FATE_BOOM = 'boom';       // hit the bomb → detonation

  // ── THE HONEST PER-PHOTON SAMPLER — one fired photon, sampled from propagate ──
  // The established mulberry32 idiom (byte-twin of the spin / double-slit / cradle
  // benches), pinned by a literal-equality test so it can't drift. Returns u∈[0,1).
  function mulberry32(seed){
    var a = seed >>> 0;
    return function(){
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // Fire ONE photon: draw a fate from the EXACT probabilities propagate() gives.
  // The visible animation reads THIS fate (and the branch it took), so picture ==
  // proof: a 'dark' fate can ONLY be drawn when the bomb is present (pDark=0 else).
  // Returns { fate, tookBombArm } — tookBombArm marks which physical path the
  // single photon took (the empty arm for bright/dark; the bomb arm for boom).
  function firePhoton(config, rng){
    var p = propagate(config);
    var u = rng();
    if (u < p.pBoom) return { fate: FATE_BOOM, tookBombArm: true, p: p };
    if (u < p.pBoom + p.pBright) return { fate: FATE_BRIGHT, tookBombArm: false, p: p };
    return { fate: FATE_DARK, tookBombArm: false, p: p };
  }

  // ── THE ENSEMBLE SANITY CHECK — many fired photons converge to propagate() ──
  // Tally N seeded single-photon fates; returns the empirical fractions. The twin
  // asserts they land within a binomial band of propagate()'s exact probabilities
  // (the fates EMERGE from firing, never injected).
  function runEnsemble(config, N, seed){
    var rng = mulberry32(seed >>> 0);
    var nB = 0, nD = 0, nX = 0;
    for (var i = 0; i < N; i++){
      var f = firePhoton(config, rng).fate;
      if (f === FATE_BRIGHT) nB++;
      else if (f === FATE_DARK) nD++;
      else nX++;
    }
    return { N: N, bright: nB / N, dark: nD / N, boom: nX / N,
             countBright: nB, countDark: nD, countBoom: nX };
  }

  // ── THE IN-PAGE SELF-TEST BATTERY (the SAME legs the page pill renders) ──
  // Every leg is a hard machine-epsilon assertion on propagate(). The page pill
  // and the Node twin both run this — single source of truth for the claim.
  function runBombSelfTest(){
    var lines = [];
    function leg(name, ok, detail){ lines.push({ name: name, ok: !!ok, detail: detail }); }
    var EPS = 1e-12;

    // (1) NO BOMB ⇒ P(bright)=1, P(dark)=0 exactly (destructive interference).
    var nb = propagate({ bomb: false });
    leg('no bomb ⇒ P(bright)=1 to machine ε',
        Math.abs(nb.pBright - 1) < EPS, 'P(bright)=' + nb.pBright.toFixed(15));
    leg('no bomb ⇒ P(dark)=0 to machine ε (the forbidden port stays dark)',
        Math.abs(nb.pDark) < EPS, 'P(dark)=' + nb.pDark.toExponential(2));

    // (2) LIVE BOMB ⇒ P(boom)=½ ∧ P(bright)=¼ ∧ P(dark)=¼.
    var lb = propagate({ bomb: true, bombArm: 0 });
    leg('live bomb ⇒ P(boom)=½ to machine ε', Math.abs(lb.pBoom - 0.5) < EPS,
        'P(boom)=' + lb.pBoom.toFixed(15));
    leg('live bomb ⇒ P(bright)=¼ to machine ε', Math.abs(lb.pBright - 0.25) < EPS,
        'P(bright)=' + lb.pBright.toFixed(15));
    leg('live bomb ⇒ P(dark)=¼ to machine ε', Math.abs(lb.pDark - 0.25) < EPS,
        'P(dark)=' + lb.pDark.toFixed(15));

    // (3) THE PROOF: P(dark) > 0 IFF a bomb is present (false-positive rate 0).
    var darkNoBomb = propagate({ bomb: false }).pDark;
    var darkBombU = propagate({ bomb: true, bombArm: 0 }).pDark;
    var darkBombL = propagate({ bomb: true, bombArm: 1 }).pDark;
    leg('P(dark)>0 IFF a bomb is present — a dark click PROVES the bomb (FP rate 0)',
        darkNoBomb < EPS && darkBombU > EPS && darkBombL > EPS,
        'dark: no-bomb=' + darkNoBomb.toExponential(1) + ' · bomb=' + darkBombU.toFixed(3));

    // (4) PROBABILITIES SUM TO 1 at every config (no amplitude leaks).
    var sumNB = nb.pBright + nb.pDark + nb.pBoom;
    var sumLB = lb.pBright + lb.pDark + lb.pBoom;
    leg('probabilities sum to 1 (no-bomb & live-bomb) to machine ε',
        Math.abs(sumNB - 1) < EPS && Math.abs(sumLB - 1) < EPS,
        'Σ=' + sumNB.toFixed(15) + ' / ' + sumLB.toFixed(15));

    // (5) ARM-SYMMETRIC: a bomb in EITHER arm gives the identical ¼/¼/½ split.
    leg('bomb in either arm ⇒ identical ½/¼/¼ (no preferred arm)',
        Math.abs(propagate({ bomb: true, bombArm: 0 }).pBright - propagate({ bomb: true, bombArm: 1 }).pBright) < EPS &&
        Math.abs(propagate({ bomb: true, bombArm: 0 }).pDark - propagate({ bomb: true, bombArm: 1 }).pDark) < EPS,
        'upper vs lower arm match');

    var pass = lines.filter(function(l){ return l.ok; }).length;
    var fails = lines.filter(function(l){ return !l.ok; }).map(function(l){ return l.name; });
    return { lines: lines, pass: pass, total: lines.length, fails: fails };
  }
// === CORE END ===

export {
  cadd, cmul, cabs2, C_I, C_ZERO, C_ONE, INV_SQRT2,
  beamSplitter, mirrors, bombMeasure, propagate,
  FATE_BRIGHT, FATE_DARK, FATE_BOOM,
  mulberry32, firePhoton, runEnsemble, runBombSelfTest,
};
