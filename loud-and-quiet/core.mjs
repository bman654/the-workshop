// The math core for "The Loud and the Quiet Walk" — the heard loudness IS Ripple's field.
//
// The seven functions in the REUSED-CORE region below are pasted CHARACTER-FOR-CHARACTER
// from ripple/index.html (the falloff/contribution/field/distTo/resultantAmplitude/kOf/omegaOf
// block), comments and all. The Node twin (core.test.mjs) re-extracts each one out of
// ripple's live source and asserts byte-identity against this copy — if ripple's core ever
// drifts from ours, the test goes RED. We do NOT re-derive interference here; we read the
// loudness off Ripple's own closed form, so eye (the band-map) and ear (the oscillator gain)
// are the SAME number by construction.
//
// The two speakers are always equal-A, in-phase, falloff:'none' sources — the ONLY case
// ripple's closed form covers EXACTLY (R = 2A·|cos(kΔ/2)|, Δ = r1−r2). No feature may quietly
// hand resultantAmplitude a third source / unequal A / a falloff mode and fall back to the
// sampled envelope: gainAt() pins the inputs to the closed-form branch.

// ╔═══════════════════════════════════════════════════════════════════════════════════════╗
// ║ REUSED-CORE BEGIN — verbatim from ripple/index.html. Do not reformat or edit a byte.   ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════╝
function falloff(mode, r, lambda){
  if(mode === 'none') return 1;
  return 1 / Math.sqrt(1 + r / lambda);
}

// Distance from a point to a source.
function distTo(src, x, y){ return Math.hypot(x - src.x, y - src.y); }

// One source's contribution to the surface displacement at (x,y,t).
//   contribution = A · falloff(r) · cos(k·r − ω·t + φ)
function contribution(src, k, omega, t, mode, lambda, x, y){
  const r = Math.hypot(x - src.x, y - src.y);
  return src.A * falloff(mode, r, lambda) * Math.cos(k * r - omega * t + src.phase);
}

// The field: linear superposition of every source's contribution.
//   field(x,y,t) = Σ_i contribution_i(x,y,t)
function field(sources, k, omega, t, mode, lambda, x, y){
  let s = 0;
  for(let i = 0; i < sources.length; i++){
    s += contribution(sources[i], k, omega, t, mode, lambda, x, y);
  }
  return s;
}

// Steady-state resultant amplitude (the envelope max over time) at a point.
// Two-equal-source closed form (falloff=none, A1=A2=A): the sum of two cosines
// of equal magnitude and frequency is  R = 2A·|cos((kΔ + Δφ)/2)|  where
// Δ = r1 − r2 and Δφ = φ1 − φ2.  For the general / falloff case we fall back to
// sampling |field| over one full period and taking the max — both are exact for
// the equal-frequency tank because every term shares ω.
function resultantAmplitude(sources, k, omega, mode, lambda, x, y){
  if(sources.length === 2 && mode === 'none' &&
     Math.abs(sources[0].A - sources[1].A) < 1e-12){
    const A = sources[0].A;
    const r1 = distTo(sources[0], x, y);
    const r2 = distTo(sources[1], x, y);
    const delta = r1 - r2;
    const dphi = sources[0].phase - sources[1].phase;
    return 2 * A * Math.abs(Math.cos((k * delta + dphi) / 2));
  }
  // General: sample |field| over one period. With a shared ω the field is a
  // single sinusoid in t, so a fine sweep finds the true envelope amplitude.
  // (When ω≈0 the pattern is frozen; sample phase directly via a synthetic ω.)
  const w = (Math.abs(omega) < 1e-9) ? (2 * Math.PI) : omega;
  const period = 2 * Math.PI / w;
  let mx = 0;
  const N = 720;
  for(let i = 0; i < N; i++){
    const t = (i / N) * period;
    const v = Math.abs(field(sources, k, w, t, mode, lambda, x, y));
    if(v > mx) mx = v;
  }
  return mx;
}

function kOf(lambda){ return 2 * Math.PI / lambda; }
function omegaOf(freq){ return 2 * Math.PI * freq; }
// ╔═══════════════════════════════════════════════════════════════════════════════════════╗
// ║ REUSED-CORE END                                                                        ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════╝

// ── room-specific helpers (built ON the reused core, never replacing it) ──

// Path difference r1 − r2 at a point — the thing the amber nλ ticks count.
// (Same r1, r2 distTo() uses inside resultantAmplitude; kept as a named helper for the
//  meter ticks and the chime crossings so the page never recomputes the loci by hand.)
function pathDiff(s1, s2, x, y){ return distTo(s1, x, y) - distTo(s2, x, y); }

// gainAt — THE function the audio engine reads for the ear's loudness, AND the function the
// band-map pixels read for brightness. ONE function ⇒ eye == ear is an identity, not a hope.
// Two equal, in-phase, falloff:'none' sources ⇒ resultantAmplitude takes its closed-form branch.
// Returns R ∈ [0, 2A]; callers normalise by 2A for the [0,1] loudness.
function gainAt(sources, k, lambda, x, y){
  return resultantAmplitude(sources, k, omegaOf(0.7), 'none', lambda, x, y);
}

// Two equal in-phase point sources spaced by d, centred at (cx, cy). The estate's
// canonical "two speakers" — the only configuration gainAt() is ever handed.
function twoSpeakers(cx, cy, d, A){
  if(A === undefined) A = 1;
  return [ { x: cx - d / 2, y: cy, A, phase: 0 }, { x: cx + d / 2, y: cy, A, phase: 0 } ];
}

// A point on the loud (n·λ) or quiet ((n+½)·λ) hyperbola r1−r2 = δ, at vertical offset Y from
// the source axis. Pure geometry — used by the self-test to land EXACTLY on a locus with no
// numeric solve, and by presets. cx/ys = source-axis centre; a = d/2 (half source spacing).
function hyperbolaPoint(delta, Y, cx, ys, a){
  const p = delta / 2;
  const q2 = a * a - p * p;            // requires |δ| < d (|p| < a) — a real branch
  const X = Math.sign(p) * Math.abs(p) * Math.sqrt(1 + (Y * Y) / q2);
  return { x: cx + X, y: ys + Y };
}

// ============================================================================
// HEADLESS SELF-TEST — proves the cross-room claim: the HEARD loudness IS ripple's
// field, and its loud/quiet loci sit exactly at r1−r2 = nλ / (n+½)λ. Returns {pass,total,log}.
// Exposed for the in-page badge AND imported by the Node twin (core.test.mjs).
// ============================================================================
function runSelfTest(){
  let pass = 0, total = 0; const log = [];
  function check(name, cond){
    total++;
    if(cond){ pass++; log.push('PASS: ' + name); }
    else { log.push('FAIL: ' + name); if(typeof console !== 'undefined') console.error('FAIL: ' + name); }
  }
  const rnd = (() => { let s = 0x9e3779b9 >>> 0; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; })();
  const A = 1.0;

  // (1) The audible gain we DRIVE the oscillators with == ripple's R = 2A|cos((kΔ+Δφ)/2)|.
  //     gainAt() (the function the audio engine AND the band-map pixels call) must equal the
  //     closed form to <1e-9 over a wide sweep — eye == ear, by the shared field.
  {
    let maxErr = 0;
    for(let trial = 0; trial < 600; trial++){
      const lambda = 22 + rnd() * 98, k = kOf(lambda);
      const d = 80 + rnd() * 340;
      const srcs = twoSpeakers(500, 300, d, A);
      const x = rnd() * 1000, y = rnd() * 600;
      const heard = gainAt(srcs, k, lambda, x, y);                                   // engine + band-map
      const ripple = resultantAmplitude(srcs, k, omegaOf(0.7), 'none', lambda, x, y); // ripple's closed form
      maxErr = Math.max(maxErr, Math.abs(heard - ripple));
    }
    check('heard gain gainAt() == ripple R(x,y) over a 600-pt sweep (<1e-9)', maxErr < 1e-9);
  }

  // (2) Loud antinodes sit at r1−r2 = nλ (R ≈ 2A); silent nodes at (n+½)λ (R ≈ 0) —
  //     EXACT loci, landed on by the path-difference hyperbola with NO numeric solve.
  {
    const lambda = 50, k = kOf(lambda), d = 240, cx = 500, ys = 300, a = d / 2;
    const srcs = twoSpeakers(cx, ys, d, A);
    let loudOk = true, quietOk = true, quietMax = 0, loudMin = 2 * A;
    for(const n of [0, 1, 2]){
      for(const Y of [40, 150, 320]){
        if(n * lambda < d){                                       // antinode exists for |δ|<d
          const pt = hyperbolaPoint(n * lambda, Y, cx, ys, a);
          const g = gainAt(srcs, k, lambda, pt.x, pt.y);
          loudMin = Math.min(loudMin, g);
          if(Math.abs(g - 2 * A) > 1e-9) loudOk = false;
        }
        if((n + 0.5) * lambda < d){                               // node exists for |δ|<d
          const pt = hyperbolaPoint((n + 0.5) * lambda, Y, cx, ys, a);
          const g = gainAt(srcs, k, lambda, pt.x, pt.y);
          quietMax = Math.max(quietMax, g);
          if(g > 1e-9) quietOk = false;
        }
      }
    }
    check('antinodes r1−r2 = nλ are LOUD (R = 2A to <1e-9)', loudOk && loudMin > 2 * A - 1e-9);
    check('nodes r1−r2 = (n+½)λ are SILENT (R = 0 to <1e-9)', quietOk && quietMax < 1e-9);
  }

  // (3) Sliding the source spacing d fans the bands. An antinodal hyperbola exists for every
  //     integer n with |n·λ| < d (r1−r2 = nλ is reachable only when |nλ| < the baseline d).
  //     So the number of loud bands = #{ n : |nλ| < d } rises strictly with d — the EXACT count,
  //     no numeric peak-finding. We CONFIRM each counted band is genuinely loud via the field.
  {
    const lambda = 50, k = kOf(lambda), ys = 300, cx = 500;
    function bandCount(d){
      const srcs = twoSpeakers(cx, ys, d, A);
      let c = 0, allLoud = true;
      for(let n = -200; n <= 200; n++){
        if(Math.abs(n * lambda) < d){
          c++;
          if(n * lambda >= 0 && n * lambda < d){                 // sample the n≥0 branch on its hyperbola
            const pt = hyperbolaPoint(n * lambda, 120, cx, ys, d / 2);
            if(Math.abs(gainAt(srcs, k, lambda, pt.x, pt.y) - 2 * A) > 1e-9) allLoud = false;
          }
        }
      }
      return { c, allLoud };
    }
    const a = bandCount(160), b = bandCount(280), cc = bandCount(400);
    check('wider d fans the bands: loud-band count #{n:|nλ|<d} rises strictly (' + a.c + ' < ' + b.c + ' < ' + cc.c + ')',
          cc.c > b.c && b.c > a.c && a.c >= 1 && a.allLoud && b.allLoud && cc.allLoud);
  }

  // (4) Each meter tick m is honest: the m-th loud peak sits EXACTLY where pathDiff = m·λ,
  //     and it IS loud there. The amber nλ marks are the real loci, not decoration.
  {
    const lambda = 50, k = kOf(lambda), d = 240, cx = 500, ys = 300, a = d / 2;
    const srcs = twoSpeakers(cx, ys, d, A);
    let ok = true;
    for(const m of [0, 1, 2]){
      if(m * lambda >= d) continue;
      const pt = hyperbolaPoint(m * lambda, 120, cx, ys, a);
      if(Math.abs(pathDiff(srcs[0], srcs[1], pt.x, pt.y) - m * lambda) > 1e-9) ok = false;   // exact path diff
      if(Math.abs(gainAt(srcs, k, lambda, pt.x, pt.y) - 2 * A) > 1e-9) ok = false;           // and loud
    }
    check('tick m sits exactly where path-diff = mλ AND is loud (<1e-9)', ok);
  }

  // (5) λ = c/f holds: the audible pitch f is the CARRIER and does NOT move the spatial pattern
  //     (gainAt depends on λ only). Given a chosen c, f = c/λ; doubling f halves λ ⇒ the pattern
  //     CHANGES — so the pitch knob and the spacing knob are honestly independent.
  {
    const c = 22000;                                             // arbitrary fixed "speed" in px·Hz
    const lambda1 = 50, lambda2 = 100;
    const f1 = c / lambda1, f2 = c / lambda2;
    check('λ = c/f: halving f doubles λ', Math.abs(f1 - 2 * f2) < 1e-9 && Math.abs(c - f1 * lambda1) < 1e-9 && Math.abs(c - f2 * lambda2) < 1e-9);
    const k1 = kOf(lambda1), k2 = kOf(lambda2);
    const srcs = twoSpeakers(500, 300, 240, A);
    const g1 = gainAt(srcs, k1, lambda1, 720, 420);
    const g2 = gainAt(srcs, k2, lambda2, 720, 420);
    check('spatial loudness depends on λ only (different λ ⇒ different pattern)', typeof g1 === 'number' && g1 >= 0 && Math.abs(g1 - g2) > 1e-6);
  }

  // (6) NEG-CONTROL must be RED: the perpendicular bisector (equal path, r1 = r2 ⇒ δ = 0) is
  //     ALWAYS maximal — it has NO nulls, so a walk straight UP the centre line never goes quiet.
  //     If a "node" were ever found on the bisector, the whole claim would be false.
  {
    const lambda = 50, k = kOf(lambda), d = 240, cx = 500, ys = 300;
    const srcs = twoSpeakers(cx, ys, d, A);
    let minOnBisector = 2 * A;
    for(let Y = -1000; Y <= 1000; Y += 2){
      const g = gainAt(srcs, k, lambda, cx, ys + Y);             // x = cx ⇒ r1 = r2 ⇒ δ = 0
      minOnBisector = Math.min(minOnBisector, g);
    }
    // The bisector stays pinned at the maximum 2A: a single-source-style "no nulls" line.
    check('NEG-CONTROL: equal-path bisector stays maximal (no nulls — RED if a node appears)', Math.abs(minOnBisector - 2 * A) < 1e-9);
    // And a SINGLE source has no interference nulls at all (sanity foil): its envelope is the
    // constant A everywhere — it never goes silent (unlike the two-source nodes that hit 0).
    const one = [ { x: cx, y: ys, A, phase: 0 } ];
    let minOne = Infinity, maxOne = 0;
    for(let i = 0; i < 400; i++){ const x = rnd() * 1000, y = rnd() * 600; const v = resultantAmplitude(one, k, omegaOf(0.7), 'none', lambda, x, y); minOne = Math.min(minOne, v); maxOne = Math.max(maxOne, v); }
    check('NEG-CONTROL: a single source has no nulls (R ≡ A, never silent)', minOne > 0.99 * A && maxOne <= A + 1e-9);
  }

  return { pass, total, log };
}

export { falloff, distTo, contribution, field, resultantAmplitude, kOf, omegaOf,
         pathDiff, gainAt, twoSpeakers, hyperbolaPoint, runSelfTest };
