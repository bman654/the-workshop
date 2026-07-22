// ============================================================================
//  THE STROBE MILL — the wagon-wheel effect made TOUCHABLE. The VISUAL twin of
//  the Tone Mill's stillness-you-HEAR: the SAME strobe-sample rate arithmetic, a
//  new sense. A hand-cranked marked disc spins at angular rate Ω under a tunable
//  strobe lamp flashing f times a second. When the flash catches the disc at the
//  same place every time (f a submultiple of the spin, or a spoke-multiple of it)
//  the wheel visually FREEZES — dead still though you can feel it still turning.
//  Detune f a hair and the frozen pattern crawls slowly BACKWARD (f above) or
//  FORWARD (f below); the classic reversed-wagon-wheel illusion falls right out.
//
//  This module does NOT fork a second Hz authority. The strobe-sample arithmetic
//  IS the Tone Mill's — apparentDriftHz / isFrozen / revPerSec / toothPassHz — so
//  this file IMPORTS them from ../tone-mill/core.mjs and adds only the WAGON-WHEEL
//  ANGULAR LAYER on top (tooth-widths/sec → radians/sec, freeze-rate families,
//  the single-pip ghost count). A disc of M spokes aliases against the strobe
//  exactly as a siren of N=M teeth does (the tooth-pass rate M·revPerSec is what
//  beats against f), so the whole layer is the Tone Mill's siren rate viewed with
//  the eye instead of the ear — borrowing f = N·Ω/2π, never forking it.
//
//  Pure, dependency-free (DOM-free). Ω is in rad/s throughout. The Strobe Mill
//  page (strobe-mill/index.html) is forged from index.src.html: it inlines the
//  Tone Mill's rate core WHOLE via `<!-- forge:include ../tone-mill/core.mjs -->`
//  (so revPerSec/toothPassHz/apparentDriftHz/isFrozen are page-scoped — the same
//  bytes the Tone Mill page runs, its literal twin brain) and then this module via
//  `<!-- forge:include core.mjs -->` (forge strips the leading `export ` and the
//  top-level `import`, so the STROBE-MILL CORE slice below is page-scoped and
//  import-free). The Node twin (core.test.mjs) imports THIS module (which imports
//  the real Tone Mill core), re-extracts the inlined STROBE-MILL CORE slice from
//  index.html and asserts it is char-for-char this module's slice (after forge's
//  `export`-strip), and runs runStrobeSelfTest — the PAYOFF-LIVENESS oracle the
//  in-page pill also calls, so "the freeze fires" cannot drift between them.
//
//  Cycle #467 — a sibling within the MANOR's Kinetics & Sound wing, the visual
//  twin of The Tone Mill and the wing's promised "free stroboscope" (the third
//  star of The Sirenist). CLAIM-FREE / DELIGHT-FIRST: no theorem, no neg-control
//  — the rate math is the Tone Mill's, already proven exact there; here it is a
//  quiet layer under a thing you crank and watch freeze.
// ============================================================================

import { toothPassHz, revPerSec, apparentDriftHz, isFrozen } from '../tone-mill/core.mjs';

// ===== STROBE-MILL CORE BEGIN =====
// The WAGON-WHEEL ANGULAR LAYER. Every rate fact below stands on the Tone Mill's
// rate core (revPerSec / toothPassHz / apparentDriftHz / isFrozen), inlined above
// this slice on the page and imported above it in the module — so no Hz law is
// re-typed here. Each declaration carries a leading `export ` that forge strips on
// inline; the byte-parity test strips the same prefix so the slice matches the
// page char-for-char.

// THE APPARENT ANGULAR VELOCITY of an M-fold marked disc under a strobe. The disc
// turns at Ω (rad/s); the strobe SAMPLES it f times a second. Its M spokes pass a
// fixed point M·revPerSec(Ω) times a second — EXACTLY the Tone Mill's siren rate
// with N=M teeth — so the residual crawl (folded to the nearest whole spoke) is
// apparentDriftHz(M,Ω,f), in tooth-widths (= spoke-gaps) per second. One spoke-gap
// is 2π/M radians, so the apparent spin is that residual × 2π/M. SIGNED: > 0 turns
// the visible pattern forward, < 0 turns it BACKWARD (the reversed wagon wheel).
export function apparentSpinRadPerSec(M, omega, strobeHz){
  return apparentDriftHz(M, omega, strobeHz) * (2 * Math.PI) / M;
}
// The same apparent spin in rev/s (the watched-crawl readout).
export function apparentSpinRevPerSec(M, omega, strobeHz){
  return apparentDriftHz(M, omega, strobeHz) / M;
}

// The M-fold spoke pattern STANDS STILL when the residual crawl is within tol
// tooth-widths/sec of zero — the Tone Mill's isFrozen, read through the M spokes.
export function spokesFrozen(M, omega, strobeHz, tol){
  return isFrozen(M, omega, strobeHz, tol == null ? 0.04 : tol);
}

// THE FREEZE FLASH-RATES for an M-spoke disc at spin Ω: f = M·revPerSec/m for
// m = 1..mMax. Every one of these freezes the SPOKE pattern (the flash lands on a
// whole number of spoke-gaps between catches). The m = M entry, f = revPerSec, is
// the ONE TRUE freeze — the single rim pip stands still there too; at every OTHER
// m the spokes freeze but the pip still hops (it reveals the disc is turning).
export function freezeStrobeRates(M, omega, mMax){
  const base = M * revPerSec(omega);          // the tooth-pass rate = the top freeze
  const out = [];
  const top = (mMax == null) ? 8 : mMax;
  for (let m = 1; m <= top; m++){ const f = base / m; if (f > 1e-9) out.push(f); }
  return out;
}
// The nearest freeze flash-rate to a dialled strobe (for "snap to freeze").
export function nearestFreezeRate(M, omega, strobeHz){
  const base = M * revPerSec(omega);
  if (base <= 1e-9 || strobeHz <= 1e-9) return strobeHz;
  const m = Math.max(1, Math.round(base / strobeHz));
  return base / m;
}

// HOW MANY FROZEN GHOST IMAGES of the single rim PIP appear at a flash rate: the
// pip is caught round(f / revPerSec) times per revolution. At f = revPerSec → 1
// (the true single freeze); at f = 2·revPerSec → 2 (the two-pip ghost); at 3× → 3.
// (Meaningful at/near a pip freeze — elsewhere the pip crawls rather than ghosts.)
export function pipImageCount(omega, strobeHz){
  const rev = revPerSec(omega);
  if (rev <= 1e-9 || strobeHz <= 1e-9) return 1;
  return Math.max(1, Math.round(strobeHz / rev));
}

// FOLD a per-flash advance (in revolutions) into the smallest signed rotation an
// M-fold pattern is consistent with — (−1/(2M), 1/(2M)] revs. The page's LIVE
// apparent-velocity lens folds its measured sampled-frame deltas the SAME way, so
// the number the eye reads matches apparentSpinRevPerSec by construction.
export function foldToSpoke(deltaRev, M){
  const w = 1 / M;
  return deltaRev - Math.round(deltaRev / w) * w;
}

// ── runStrobeSelfTest() — the PAYOFF-LIVENESS oracle: { pass, total, lines }. This
// is a DELIGHT piece: it makes no theorem and owes no proof (the rate math is the
// Tone Mill's, proven exact there). What it verifies is that the PAYOFF FIRES — the
// wheel actually freezes when the flash matches the spin, and the crawl carries the
// right sign and size when you detune. The in-page pill and the Node twin both call
// THIS, so they cannot disagree. Every detail carries LIVE numbers.
export function runStrobeSelfTest(){
  const lines = [];
  const T = (name, ok, detail='') => lines.push({ name, ok: !!ok, detail });
  const EPS = 1e-9;
  const TWO_PI = 2 * Math.PI;

  // LEG (1) — THE FREEZE FIRES. For a sweep of spoke counts M, spins Ω and orders
  // m, dial the flash to f = M·revPerSec/m and the apparent angular velocity is 0:
  // the wheel stands still when the flash rate matches the spin (m=1) AND at every
  // integer submultiple (m>1). This is the whole payoff — stillness you SEE.
  {
    let maxSpin = 0, allFrozen = true, n = 0;
    for (const M of [1, 2, 3, 4, 6, 8]){
      for (const rev of [1.7, 3.0, 5.25, 8.4]){
        const omega = rev * TWO_PI;
        for (const f of freezeStrobeRates(M, omega, 4)){
          const spin = Math.abs(apparentSpinRadPerSec(M, omega, f));
          maxSpin = Math.max(maxSpin, spin);
          if (!spokesFrozen(M, omega, f, EPS)) allFrozen = false;
          n++;
        }
      }
    }
    T('(1) the freeze fires — at every flash rate f = M·revPerSec/m the apparent angular velocity is 0: the wheel stands still when the flash matches the spin (and at each submultiple)',
      allFrozen && maxSpin < EPS, `${n} freeze rates swept · max |apparent spin| = ${maxSpin.toExponential(2)} rad/s`);
  }

  // LEG (2) — THE CRAWL REVERSES, AND BY THE RIGHT AMOUNT. Detune the flash a hair
  // ABOVE the m=1 freeze (f = revPerSec) and the frozen pattern crawls BACKWARD; a
  // hair BELOW and it crawls FORWARD. The apparent rev/s equals exactly −(flash −
  // spin): sign and size both. (M=1, the single rim pip — the cleanest reading.)
  {
    let signOk = true, maxErr = 0;
    for (const rev of [2.0, 4.0, 6.5]){
      const omega = rev * TWO_PI, fFreeze = revPerSec(omega);   // the m=1 freeze
      for (const delta of [0.05, 0.2, 0.5]){
        const above = apparentSpinRevPerSec(1, omega, fFreeze + delta);   // detune UP
        const below = apparentSpinRevPerSec(1, omega, fFreeze - delta);   // detune DOWN
        if (!(above < 0 && below > 0)) signOk = false;                    // up=back, down=fwd
        maxErr = Math.max(maxErr, Math.abs(above - (-(delta))), Math.abs(below - (delta)));
      }
    }
    T('(2) the crawl reverses — detune the flash above the freeze and the pattern crawls BACKWARD, below and it crawls FORWARD; the apparent rate is exactly −(flash − spin)',
      signOk && maxErr < 1e-9, `up⇒back, down⇒fwd for every detune · apparent === −(Δflash) to ${maxErr.toExponential(2)} rev/s`);
  }

  // LEG (3) — THE TWO-PIP GHOST. Flash the strobe at 2× the spin and the single rim
  // pip is caught at two opposite places every revolution: a frozen TWO-pip ghost.
  // At 1× it is one pip (the true freeze); at 3× it is three. The classic reversed-
  // wagon-wheel doubling, falling straight out of the sampling.
  {
    let ok = true; const seen = [];
    for (const rev of [2.5, 5.0, 7.0]){
      const omega = rev * TWO_PI, base = revPerSec(omega);
      const c1 = pipImageCount(omega, base), c2 = pipImageCount(omega, 2*base), c3 = pipImageCount(omega, 3*base);
      seen.push(`${c1}/${c2}/${c3}`);
      if (!(c1 === 1 && c2 === 2 && c3 === 3)) ok = false;
    }
    T('(3) the two-pip ghost — flash at 2× the spin and one rim pip becomes two frozen ghosts (1× → 1, 3× → 3): the classic reversed-wagon-wheel doubling',
      ok, `pip images at 1×/2×/3× spin = ${seen.join(', ')}`);
  }

  // LEG (4) — THE ANGULAR LAYER SITS EXACTLY ON THE TONE MILL'S RATE CORE. The
  // apparent spin is the Tone Mill's siren-rate residual apparentDriftHz(M,Ω,f)
  // (tooth-widths/sec) turned into radians by the spoke-gap 2π/M — nothing re-typed.
  // Assert the identity across a sweep so the reuse can't silently drift into a fork.
  {
    let maxDev = 0, n = 0;
    for (const M of [1, 2, 3, 5, 8]){
      for (const rev of [1.3, 3.7, 6.1]){
        const omega = rev * TWO_PI;
        for (const f of [7.0, 12.5, 19.0, 31.5, 44.0]){
          const got = apparentSpinRadPerSec(M, omega, f);
          const viaCore = apparentDriftHz(M, omega, f) * (2 * Math.PI) / M;
          maxDev = Math.max(maxDev, Math.abs(got - viaCore));
          n++;
        }
      }
    }
    T('(4) borrowed, not forked — the apparent angular spin === apparentDriftHz(M,Ω,f)·2π/M (the Tone Mill\'s siren rate, viewed with the eye) across the whole sweep',
      maxDev < EPS, `${n} points · max |Δ| = ${maxDev.toExponential(2)} rad/s`);
  }

  let pass = 0; for (const l of lines) if (l.ok) pass++;
  return { pass, total: lines.length, lines };
}
// ===== STROBE-MILL CORE END =====

// Re-export the borrowed Tone Mill primitives the page and twin also name directly,
// so a consumer importing THIS module gets the whole rate vocabulary from one place
// (the page gets them from the sibling forge:include; this is for the Node twin and
// any future kin). These are NOT redeclarations — they are the Tone Mill's own
// functions, passed through. (Kept OUTSIDE the CORE slice so the byte-twin parity
// check compares only the wagon-wheel layer.)
export { toothPassHz, revPerSec, apparentDriftHz, isFrozen };
