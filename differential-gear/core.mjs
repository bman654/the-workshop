// The Differential Gear — logic core (the gear that ADDS two rotations).
//
// THE WHOLE POINT: a bevel-gear differential is a mechanical MEAN. Two side gears
// (the "suns") spin on one axle; a floating spider pinion meshes both. The carrier
// cage that holds the spider turns at the EXACT AVERAGE of the two side-gear speeds —
// ω_carrier = ½(ωL + ωR) — for EQUAL-tooth side gears. Crank the two rims by hand and
// the carrier needle parks at the angular midpoint, no arithmetic anywhere.
//
// WHY IT'S TRUE (Willis's epicyclic relation, the fundamental train equation):
//   For an epicyclic train the gear ratio TAKEN RELATIVE TO THE CARRIER is fixed:
//        e = (ω_R − ω_c) / (ω_L − ω_c) = −N_L / N_R
//   where N_L, N_R are the side-gear tooth counts and e is the "train value". A bevel
//   differential reverses sense through the spider, so e is NEGATIVE; with EQUAL teeth
//   (N_L = N_R) the magnitude is 1, hence:
//        e = −1   ⇒   (ω_R − ω_c) = −(ω_L − ω_c)   ⇒   ω_R + ω_L = 2·ω_c
//        ⇒   ω_c = ½(ω_L + ω_R).
//   The half-sum is therefore NOT an approximation — it is forced by e = −1, which is
//   forced by equal teeth. The spider's own spin relative to the cage is the half-
//   DIFFERENCE: φ̇_spider ∝ ½(ω_L − ω_R) — pure differential rotation, zero average.
//   Unequal teeth would change e (a weighted mean), and welding the spider to the cage
//   (the LOCK) forces e = +1 — a rigid body, ω_L = ω_R = ω_c, no longer adding.
//
// The slab between the DIFF-CORE sentinels below is the SOLE authority. It is inlined
// byte-for-byte into index.html (so the needle the visitor cranks is provably the same
// code as the proof) and re-anchored by core.test.mjs's byte-parity check. runSelfTest()
// is the SOLE oracle — the in-page pill and the Node twin both call exactly it.

// === DIFF-CORE BEGIN ===
// Train values: e is the gear ratio taken RELATIVE TO THE CARRIER (Willis). A bevel
// differential with equal-tooth side gears has e = −1 (FREE — the gear adds); welding
// the spider to the cage forces e = +1 (LOCKED — a rigid body, no longer adding).
const E_FREE = -1;
const E_LOCKED = +1;

// Willis solved for the carrier: e = (ωR − ωc)/(ωL − ωc)  ⇒  ωc = (ωR − e·ωL)/(1 − e).
// At e = −1 this is exactly ½(ωL + ωR) — the equal-tooth speed-average.
function carrierFromSuns(wL, wR, e = E_FREE) {
  return (wR - e * wL) / (1 - e);
}
// The same Willis relation solved for each sun in turn — used to cross-check the
// carrier three ways by back-substitution (no direction is privileged).
function sunRfromCarrierSunL(wc, wL, e = E_FREE) {
  return e * (wL - wc) + wc;
}
function sunLfromCarrierSunR(wc, wR, e = E_FREE) {
  return (wR - wc) / e + wc;
}
// The spider's OWN spin (relative to the cage) is the half-DIFFERENCE — pure
// differential rotation, the part with zero average. k (radius ratio) only scales
// this whir; it never touches the carrier average, which is k-independent.
function spiderSpin(wL, wR) {
  return 0.5 * (wL - wR);
}
// The plain arithmetic mean, named so the page can compare the geared answer to it.
function halfSum(wL, wR) {
  return 0.5 * (wL + wR);
}
// THE LOCK (negative control): welding the spider to the cage yokes the shafts into a
// rigid body — the ONLY consistent motion is ωL = ωR = ωc. If the two demands disagree
// there is NO rigid solution, so the model returns NaN: the math itself says "no
// solution", which is exactly why the locked machine can no longer realise the average.
function carrierLocked(wL, wR) {
  return Math.abs(wL - wR) > 1e-12 ? NaN : wL;
}
// === DIFF-CORE END ===

// The SOLE oracle. Six checks; both the in-page pill and the Node twin call THIS.
// Each check is { name, pass, info }; returns { checks, passed, total, ok }.
function runSelfTest() {
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });
  const EPS = 1e-12;

  // (1) The carrier (Willis, e=−1) equals the plain half-sum across a dense sweep.
  {
    let maxErr = 0, n = 0;
    for (let i = 0; i < 4000; i++) {
      const wL = Math.sin(i * 0.013) * 1000 + (i - 2000) * 0.7;
      const wR = Math.cos(i * 0.017) * 800 - (i - 2000) * 0.5;
      const wc = carrierFromSuns(wL, wR);
      maxErr = Math.max(maxErr, Math.abs(wc - halfSum(wL, wR)));
      n++;
    }
    log('1 · carrier(e=−1) == ½(ωL+ωR) across a 4000-pt sweep',
      maxErr < EPS, 'max|Δ|=' + maxErr.toExponential(2) + ' over ' + n + ' pts');
  }

  // (2) The three Willis directions cross-check by back-substitution round-trip.
  //     Solve carrier from the suns, then re-derive each sun from the carrier + the
  //     other sun; the recovered suns must match the originals to machine-ε.
  {
    let maxErr = 0, n = 0;
    for (let i = 0; i < 4000; i++) {
      const wL = Math.sin(i * 0.021) * 600 + 13;
      const wR = Math.cos(i * 0.009) * 540 - 7;
      const wc = carrierFromSuns(wL, wR);
      const wRback = sunRfromCarrierSunL(wc, wL);
      const wLback = sunLfromCarrierSunR(wc, wR);
      maxErr = Math.max(maxErr, Math.abs(wRback - wR), Math.abs(wLback - wL));
      n++;
    }
    log('2 · three Willis directions agree (back-substitution round-trip)',
      maxErr < EPS, 'max|Δ|=' + maxErr.toExponential(2) + ' over ' + n + ' pts');
  }

  // (3) The three felt regimes are EXACT.
  {
    const a = carrierFromSuns(5, 5);    // same way, equal rate → carrier 5
    const b = carrierFromSuns(5, -5);   // opposite, equal rate → carrier DEAD STILL (0)
    const c = carrierFromSuns(0, 8);    // hold one → exactly half (4)
    const ok = a === 5 && b === 0 && c === 4;
    log('3 · the three regimes EXACT: (5,5)→5 · (5,−5)→0 · (0,8)→4',
      ok, '(5,5)=' + a + ' (5,−5)=' + b + ' (0,8)=' + c);
  }

  // (4) The spider's own spin is the half-difference.
  {
    let maxErr = 0;
    for (let i = 0; i < 2000; i++) {
      const wL = Math.sin(i * 0.031) * 300, wR = Math.cos(i * 0.027) * 270;
      maxErr = Math.max(maxErr, Math.abs(spiderSpin(wL, wR) - 0.5 * (wL - wR)));
    }
    log('4 · spider own-spin == ½(ωL−ωR) (pure differential, zero average)',
      maxErr < EPS, 'max|Δ|=' + maxErr.toExponential(2));
  }

  // (5) NEGATIVE CONTROL — the LOCK breaks the half-sum AND jams (NaN) on every
  //     unequal demand. Equal demands pass through (rigid body still turns).
  {
    let breaks = 0, jams = 0, total = 0, equalsOk = true;
    for (let i = 0; i < 1000; i++) {
      const wL = Math.sin(i * 0.05) * 50 + 1, wR = Math.cos(i * 0.07) * 50 - 1;
      total++;
      const locked = carrierLocked(wL, wR);
      const free = carrierFromSuns(wL, wR);
      if (Number.isNaN(locked)) jams++;                 // no rigid solution
      if (Number.isNaN(locked) || Math.abs(locked - free) > EPS) breaks++; // not the half-sum
    }
    // and a genuinely equal demand still resolves to the shared rate (not jammed)
    for (const v of [0, 3.5, -12, 1000]) if (carrierLocked(v, v) !== v) equalsOk = false;
    const ok = breaks === total && jams === total && equalsOk;
    log('5 · NEG-CONTROL: lock breaks the half-sum AND jams (NaN) on every unequal demand',
      ok, 'breaks ' + breaks + '/' + total + ' · jams ' + jams + '/' + total + ' · equal-demand passes ' + equalsOk);
  }

  // (6) TAMPER — a perturbed train value e=−0.9 (as if the side teeth were unequal)
  //     diverges measurably from the equal-tooth half-sum. The law is specific to e=−1.
  {
    let maxDiff = 0, n = 0;
    for (let i = 0; i < 2000; i++) {
      const wL = Math.sin(i * 0.019) * 400 + 5, wR = Math.cos(i * 0.023) * 360 - 3;
      const tampered = carrierFromSuns(wL, wR, -0.9);
      maxDiff = Math.max(maxDiff, Math.abs(tampered - halfSum(wL, wR)));
      n++;
    }
    log('6 · TAMPER: a perturbed e=−0.9 diverges from the half-sum (law is e=−1 only)',
      maxDiff > 1e-3, 'max|Δ|=' + maxDiff.toExponential(2) + ' over ' + n + ' pts');
  }

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}

export {
  E_FREE, E_LOCKED,
  carrierFromSuns, sunRfromCarrierSunL, sunLfromCarrierSunR,
  spiderSpin, halfSum, carrierLocked,
  runSelfTest
};
