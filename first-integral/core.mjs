// ============================================================================
//  THE FIRST INTEGRAL  —  core math (the single source of truth).
//
//  THE ONE IDEA.  Three curves the workshop already shipped —
//    • the hanging chain      (catenary,        y = a·cosh(x/a))
//    • the fastest slide      (brachistochrone, the cycloid x=r(τ−sinτ), y=r(1−cosτ))
//    • the minimal soap film  (catenoid,        r = a·cosh(z/a))
//  are each an EXTREMAL of an integral  ∫ f(y, y′) dx  whose integrand f carries
//  NO explicit x.  Whenever f has no explicit x, the Euler–Lagrange equation has
//  a FIRST INTEGRAL — a conserved quantity along the extremal (the BELTRAMI
//  IDENTITY, the 1-D Noether/energy theorem of the calculus of variations):
//
//        H  =  f  −  y′ · (∂f/∂y′)   =   const   along the whole arc.
//
//  This file takes each piece's OWN shipped curve, plugs it into ITS OWN Beltrami
//  integrand H, and lets the self-test prove H is FLAT to machine precision and
//  equal to the predicted closed form.  Plus a NEGATIVE CONTROL with teeth: feed
//  a WRONG curve into the catenary's H and watch it wave — the law only conserves
//  the true extremal.
//
//  CONVENTIONS.  Each curve is sampled as (x, y, y′) along its parameter; H is a
//  pure function of (y, y′).  We never sample an endpoint where an integrand is
//  singular (the brachistochrone's y=0 cusp): the flat-line check rides the OPEN
//  interval.  Everything here is exact closed form — no fitting, no RNG.
// ============================================================================

// ---------------------------------------------------------------------------
//  THE THREE BELTRAMI INTEGRANDS  H(y, y′)  — one per physics, derived in the
//  block comments.  Each returns the conserved quantity for a single (y, y′).
// ---------------------------------------------------------------------------

// CATENARY — minimise potential energy of a heavy chain:
//   f = y·√(1+y′²)   (height-weighted arclength; +y measured DOWNWARD here so a
//   lower chain has larger y and lower energy — but H is sign-consistent either
//   way since it is built from f and ∂f/∂y′ in the SAME frame).
//   ∂f/∂y′ = y·y′/√(1+y′²).
//   H = y·√(1+y′²) − y′·( y·y′/√(1+y′²) )
//     = y·(1+y′²)/√(1+y′²)  −  y·y′²/√(1+y′²)
//     = y/√(1+y′²)   = const   ( = the catenary parameter a ).
function hCatenary(y, yp) {
  return y / Math.sqrt(1 + yp * yp);
}

// ---------------------------------------------------------------------------
//  THE ACTION ITSELF — not the conserved H, but the integral H is conserved ALONG.
//  These three pure functions let the self-test prove the OTHER half of the story:
//  the true catenary doesn't just conserve H, it MINIMISES the action ∫f dx, so
//  ANY dragged perturbation costs MORE.  (The page's COST-BOWL is this number.)
// ---------------------------------------------------------------------------

// f for the catenary/catenoid action (energy/area): f = y·√(1+y′²)
function fCatenary(y, yp){ return y * Math.sqrt(1 + yp*yp); }

// discretised action ∫f dx — MIDPOINT rule, slope RECOMPUTED from the ACTUAL node
// positions per segment (this is load-bearing: a bumped y MUST change the slope, or
// the minimum is a fiction — verified, see below).
function action(samples, fFn){
  let total = 0;
  for (let i = 0; i < samples.length - 1; i++){
    const a = samples[i], b = samples[i+1], dx = b.x - a.x;
    total += fFn(0.5*(a.y+b.y), (b.y-a.y)/dx) * dx;
  }
  return total;
}

// move interior node by delta in y; endpoints pinned. (Single-node discrete bump —
// this is the SELF-TEST atom; the on-screen drag uses a smooth spline bump but feeds
// the SAME action() with recomputed segment slopes.)
function perturb(trueSamples, pointIndex, delta){
  const out = trueSamples.map(s => ({ x:s.x, y:s.y, yp:s.yp }));
  if (pointIndex > 0 && pointIndex < out.length - 1)
    out[pointIndex] = { ...out[pointIndex], y: out[pointIndex].y + delta };
  return out;
}

// SOAP FILM / CATENOID — minimise surface AREA of revolution:
//   f = y·√(1+y′²)   (y = the radius of the surface at this station; 2π·f dx is
//   the lateral area element).  IDENTICAL FORM to the catenary's energy integrand
//   — which is WHY the soap film's profile is also a cosh.  Same Beltrami:
//   H = y/√(1+y′²) = const = the neck radius a (the catenoid's waist).
//   Derived a SECOND, independent way (area, not energy) → same conservation law.
const hCatenoid = hCatenary;

// BRACHISTOCHRONE — minimise descent TIME (y measured downward from the start, so
//   speed v=√(2g·y) by energy conservation; take g=1):
//   f = √( (1+y′²) / (2·y) ).
//   ∂f/∂y′ = y′ / ( √(2y) · √(1+y′²) ).
//   H = √((1+y′²)/(2y)) − y′·[ y′/(√(2y)·√(1+y′²)) ]
//     = [ (1+y′²) − y′² ] / ( √(2y)·√(1+y′²) )
//     = 1 / ( √(2y)·√(1+y′²) )   = const.
//   The defining first integral is the classic  y·(1+y′²) = const  (= 1/(2H²)).
//   For the standard cycloid x=r(τ−sinτ), y=r(1−cosτ) one finds y·(1+y′²)=2r, so
//   H = 1/√(2·2r) = 1/(2√r).  SINGULAR at y=0 (the τ=0 cusp) → sample the OPEN
//   interval only.  We report BOTH forms: the raw H and the classic y·(1+y′²).
function hBrachistochrone(y, yp) {
  return 1 / (Math.sqrt(2 * y) * Math.sqrt(1 + yp * yp));
}
// the classic equivalent first integral, y·(1+y′²) = 1/(2 H²), const = 2r.
function firstIntegralBrachistochrone(y, yp) {
  return y * (1 + yp * yp);
}

// ---------------------------------------------------------------------------
//  THE THREE SHIPPED CURVES — sampled as (x, y, y′) arrays.  These reproduce the
//  exact parametrisations the source benches use.
// ---------------------------------------------------------------------------

// Catenary  y = a·cosh(x/a),  y′ = sinh(x/a).  Sample x∈[−w, w].
function sampleCatenary(a, w, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const x = -w + (2 * w) * i / n;
    const t = x / a;
    out.push({ x, y: a * Math.cosh(t), yp: Math.sinh(t) });
  }
  return out;
}

// Catenoid profile  r = a·cosh(z/a),  r′ = sinh(z/a).  (z plays the role of x,
//  r the role of y.)  Sample z∈[−h, h].  Identical algebra to the catenary, but
//  it is a DIFFERENT physical object (a surface of revolution, not a chain).
function sampleCatenoid(a, h, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const z = -h + (2 * h) * i / n;
    const t = z / a;
    out.push({ x: z, y: a * Math.cosh(t), yp: Math.sinh(t) });
  }
  return out;
}

// Cycloid  x=r(τ−sinτ),  y=r(1−cosτ).  Then
//   dx/dτ = r(1−cosτ),  dy/dτ = r·sinτ,  y′ = dy/dx = sinτ/(1−cosτ) = cot(τ/2).
// Sample τ on the OPEN interval (τ0, τ1) with τ0>0 — NEVER τ=0 (the y=0 cusp,
// where the time integrand is singular).
function sampleCycloid(r, tau0, tau1, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const tau = tau0 + (tau1 - tau0) * i / n;
    const x = r * (tau - Math.sin(tau));
    const y = r * (1 - Math.cos(tau));
    const yp = Math.sin(tau) / (1 - Math.cos(tau)); // = cot(τ/2)
    out.push({ x, y, yp });
  }
  return out;
}

// ---------------------------------------------------------------------------
//  THE NEGATIVE CONTROL — a wrong curve fed into the CATENARY's integrand.
//  The catenary bench builds the equal-length best-fit parabola through the same
//  pins (its check #7's impostor).  Here we reuse a circular ARC through the same
//  two endpoints with the same chord — a clean, parameter-free impostor — and a
//  parabola.  Feeding EITHER into hCatenary yields an H that VARIES well above
//  tolerance: the law bites, only the true extremal conserves H.
// ---------------------------------------------------------------------------

// A circular arc through (−w, y0) and (+w, y0) (the catenary's two pin heights,
// y0=a·cosh(w/a)) that sags to depth `sag` below the chord at x=0.  Symmetric, so
// the centre sits on the y-axis.  Returns (x, y, y′) samples on x∈[−w, w].
function sampleArc(w, y0, sag, n) {
  // chord at height y0 (the pins); the arc dips to y0+sag at x=0 (y is DOWN).
  // circle through (±w, y0) and (0, y0+sag): centre (0, cy), radius Rr.
  // Let d=y0−cy (pin offset), b=y0+sag−cy (bottom offset). w²+d²=b², b=d+sag.
  //   w²+d² = d²+2·d·sag+sag²  ⇒  d = (w²−sag²)/(2sag)  ⇒ cy = y0 − d.
  const d = (w * w - sag * sag) / (2 * sag);
  const cy = y0 - d;
  const Rr = Math.hypot(w, d);
  const out = [];
  for (let i = 0; i <= n; i++) {
    const x = -w + (2 * w) * i / n;
    // lower arc (y increases downward): y = cy + √(R²−x²)
    const root = Math.sqrt(Math.max(1e-300, Rr * Rr - x * x));
    const y = cy + root;
    const yp = -x / root; // d/dx (cy+√(R²−x²))
    out.push({ x, y, yp });
  }
  return out;
}

// A parabola through (±w, y0) with vertex depth `sag` below the chord at x=0.
//   y = y0 + sag·(1 − (x/w)²),  y′ = −2·sag·x/w².
function sampleParabola(w, y0, sag, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const x = -w + (2 * w) * i / n;
    const y = y0 + sag * (1 - (x / w) * (x / w));
    const yp = -2 * sag * x / (w * w);
    out.push({ x, y, yp });
  }
  return out;
}

// ---------------------------------------------------------------------------
//  FLATNESS METRIC — given samples and an integrand H(y,y′), return the conserved
//  value (mean) and the worst RELATIVE deviation max|H−H̄|/|H̄| along the arc.
// ---------------------------------------------------------------------------
function flatness(samples, hFn) {
  const hs = samples.map((s) => hFn(s.y, s.yp));
  let sum = 0;
  for (const h of hs) sum += h;
  const mean = sum / hs.length;
  let maxAbsDev = 0;
  for (const h of hs) maxAbsDev = Math.max(maxAbsDev, Math.abs(h - mean));
  const relDev = Math.abs(mean) > 0 ? maxAbsDev / Math.abs(mean) : maxAbsDev;
  return { mean, hs, maxAbsDev, relDev, min: Math.min(...hs), max: Math.max(...hs) };
}

// ---------------------------------------------------------------------------
//  THE THREE PANELS — bundle each curve with its integrand, its prediction, and
//  a human label.  This is what the page renders and the self-test asserts on.
// ---------------------------------------------------------------------------
function buildPanels() {
  // chosen so each curve is well inside its valid range and clear of singularities.
  const cat = { a: 0.85, w: 1.25 };          // catenary parameter a, half-span w
  const cn = { a: 0.62, h: 0.70 };           // catenoid neck a, half-height h
  const cy = { r: 0.55, t0: 0.45, t1: 2.55 }; // cycloid radius r, OPEN τ-window

  return [
    {
      id: 'catenary',
      title: 'The hanging chain',
      integral: 'minimise energy  ∫ y·√(1+y′²) dx',
      hLabel: 'H = y / √(1+y′²)',
      curveLabel: 'y = a·cosh(x/a)',
      samples: sampleCatenary(cat.a, cat.w, 240),
      hFn: hCatenary,
      predicted: cat.a,
      predictedLabel: 'a (the catenary parameter)',
      params: cat,
    },
    {
      id: 'brachistochrone',
      title: 'The fastest slide',
      integral: 'minimise time  ∫ √((1+y′²)/(2y)) dx',
      hLabel: 'H = 1 / (√(2y)·√(1+y′²))',
      curveLabel: 'x=r(τ−sinτ),  y=r(1−cosτ)',
      samples: sampleCycloid(cy.r, cy.t0, cy.t1, 240),
      hFn: hBrachistochrone,
      // H = 1/(2√r); the classic first integral y·(1+y′²)=2r is the headline const.
      predicted: 1 / (2 * Math.sqrt(cy.r)),
      predictedLabel: '1/(2√r)   ⟺   y·(1+y′²) = 2r',
      // a second, more legible conserved form for the readout:
      hFn2: firstIntegralBrachistochrone,
      predicted2: 2 * cy.r,
      predicted2Label: '2r',
      open: true, // rides the OPEN interval — never the cusp
      params: cy,
    },
    {
      id: 'catenoid',
      title: 'The minimal soap film',
      integral: 'minimise area  ∫ y·√(1+y′²) dx',
      hLabel: 'H = y / √(1+y′²)',
      curveLabel: 'r = a·cosh(z/a)',
      samples: sampleCatenoid(cn.a, cn.h, 240),
      hFn: hCatenoid,
      predicted: cn.a,
      predictedLabel: 'a (the neck radius / waist)',
      params: cn,
    },
  ];
}

// ============================================================================
//  THE SELF-TEST — proves the falsifiable claim EXACT.
// ============================================================================
function runSelfTest() {
  const checks = [];
  const detail = {};
  function ok(name, cond, info) { checks.push({ name, pass: !!cond, info }); }

  const panels = buildPanels();
  const TOL = 1e-9;

  // (1–3) Each shipped curve's OWN Beltrami H is FLAT along its arc to <~1e-9.
  for (const p of panels) {
    const f = flatness(p.samples, p.hFn);
    detail[p.id + 'Rel'] = f.relDev;
    detail[p.id + 'Mean'] = f.mean;
    ok(p.title + ': its own H is flat to <1e-9 relative',
       f.relDev < TOL,
       'H̄=' + f.mean.toFixed(9) + '  max|ΔH|/|H̄|=' + f.relDev.toExponential(2));
  }

  // (4–6) Each conserved const equals its predicted CLOSED FORM.
  for (const p of panels) {
    const f = flatness(p.samples, p.hFn);
    const err = Math.abs(f.mean - p.predicted);
    const rel = err / Math.abs(p.predicted);
    detail[p.id + 'PredErr'] = rel;
    ok(p.title + ': const = ' + p.predictedLabel + ' (closed form)',
       rel < 1e-9,
       'H̄=' + f.mean.toFixed(9) + '  vs  ' + p.predicted.toFixed(9) + '  rel ' + rel.toExponential(2));
  }

  // (7) The brachistochrone's classic first integral y·(1+y′²) is ALSO flat and
  //     equals exactly 2r — the cycloid's defining constant, a second witness.
  {
    const p = panels[1];
    const f2 = flatness(p.samples, p.hFn2);
    const rel = f2.relDev;
    const predErr = Math.abs(f2.mean - p.predicted2) / Math.abs(p.predicted2);
    detail.brachFI = f2.mean; detail.brachFIrel = rel; detail.brachFIpredErr = predErr;
    ok('Brachistochrone: y·(1+y′²) is flat AND equals 2r (the classic first integral)',
       rel < TOL && predErr < 1e-9,
       'y·(1+y′²)=' + f2.mean.toFixed(9) + '  vs 2r=' + p.predicted2.toFixed(9) +
       '  flat ' + rel.toExponential(2));
  }

  // (8) Catenary & catenoid share the SAME integrand form (one law, two physics):
  //     hCatenary and hCatenoid are the identical function.
  ok('Catenary & catenoid obey the IDENTICAL law (H = y/√(1+y′²))',
     hCatenary === hCatenoid &&
       Math.abs(hCatenary(2.3, 0.7) - hCatenoid(2.3, 0.7)) === 0,
     'same Beltrami integrand — energy and area minimise the same f ⇒ both are cosh');

  // (9) NEGATIVE CONTROL with teeth — feed a WRONG curve (equal-endpoint circular
  //     ARC, and a parabola) into the CATENARY's H and prove H is NOT flat.
  {
    const cat = panels[0].params;
    const y0 = cat.a * Math.cosh(cat.w / cat.a); // pin height of the true catenary
    const trueSag = y0 - cat.a;                  // depth of the true cosh below its pins
    const arc = sampleArc(cat.w, y0, trueSag, 240);
    const par = sampleParabola(cat.w, y0, trueSag, 240);
    const fArc = flatness(arc, hCatenary);
    const fPar = flatness(par, hCatenary);
    detail.arcRel = fArc.relDev; detail.parRel = fPar.relDev;
    // the impostors must WAVE: relative deviation far above the 1e-9 tolerance.
    ok('Negative control: a circular arc fed into the catenary H is NOT flat (the law bites)',
       fArc.relDev > 1e-3,
       'arc H varies by ' + (fArc.relDev * 100).toFixed(2) + '% (≫ 1e-9 ⇒ rejected)');
    ok('Negative control: an equal-endpoint parabola fed into the catenary H is NOT flat',
       fPar.relDev > 1e-3,
       'parabola H varies by ' + (fPar.relDev * 100).toFixed(2) + '% (≫ 1e-9 ⇒ rejected)');
  }

  // (10) Determinism: rebuild the panels and re-measure — byte-identical means.
  {
    const p2 = buildPanels();
    let maxDrift = 0;
    for (let i = 0; i < p2.length; i++) {
      const a = flatness(panels[i].samples, panels[i].hFn).mean;
      const b = flatness(p2[i].samples, p2[i].hFn).mean;
      maxDrift = Math.max(maxDrift, Math.abs(a - b));
    }
    detail.detDrift = maxDrift;
    ok('Deterministic — rebuild ⇒ byte-identical conserved values',
       maxDrift === 0,
       'max drift ' + maxDrift.toExponential(1));
  }

  // ==========================================================================
  //  THE ACTION-MINIMUM CLAIM (catenary) — the true curve doesn't only conserve
  //  H, it MINIMISES the action ∫f dx.  We prove it on the catenary alone (the
  //  slide & film bowls are visual / followup-proven — we do NOT self-test their
  //  minima yet).  Slopes here are RECOMPUTED from the perturbed node positions:
  //  a bumped y changes the segment slope, or the minimum is a fiction.
  // ==========================================================================
  const cat = sampleCatenary(0.85, 1.25, 240);
  const I0 = action(cat, fCatenary);
  const midN = Math.floor(cat.length / 2);

  // (11) MINIMUM: over interior nodes × deltas, action(perturbed) − action(true) ≥ 0.
  {
    let worst = Infinity;
    const deltas = [0.04, 0.03, 0.02, 0.01, 0.005, -0.005, -0.01, -0.02, -0.03, -0.04];
    for (let k = 1; k < cat.length - 1; k += 7) {
      for (const d of deltas) {
        const dI = action(perturb(cat, k, d), fCatenary) - I0;
        if (dI < worst) worst = dI;
      }
    }
    detail.actionWorst = worst;
    ok('Action minimum: every dragged perturbation has action ≥ the true action (ΔI ≥ 0)',
       worst >= 0,
       'worst ΔI over the sweep = +' + worst.toExponential(2) + ' (≥ 0 ⇒ the floor is the law)');
  }

  // (12) QUADRATIC by Richardson halving — at small d the bowl is a true parabola:
  //   R = (I(d)−I0)/(I(d/2)−I0) → 4 as d halves.  Small-delta regime (a large d
  //   bends R via the cubic tail).  This is the DISCRIMINATING quadratic-minimum
  //   test (ΔI/δ² does NOT converge for the midpoint integrator → do not use it).
  {
    const dI = (d) => action(perturb(cat, midN, d), fCatenary) - I0;
    const base = 0.004;
    const R = dI(base) / dI(base / 2);
    detail.actionR = R;
    ok('Action grows ~quadratically (a genuine minimum): Richardson R → 4 as the pull halves',
       Math.abs(R - 4) < 0.1,
       'R = (I(d)−I0)/(I(d/2)−I0) = ' + R.toFixed(3) + ' (→ 4 ⇒ ΔI ∝ d², a smooth bowl)');
  }

  // (13) H BREAKS PAST THE FLOOR — the SAME recomputed (finite-difference / segment)
  //   slopes the live strip shows.  A d=0.02 bump makes hCatenary's relDev ≫ 1e-3,
  //   vs the true curve's flat strip.  (Do NOT compare this FD relDev to the 1e-9
  //   floor — FD slopes wobble ~0.5% even on the true curve; the drag climbs above it.)
  {
    const fd = (samples) => {
      const o = samples.map((s) => ({ x: s.x, y: s.y }));
      for (let i = 0; i < o.length; i++) {
        if (i === 0) o[i].yp = (o[1].y - o[0].y) / (o[1].x - o[0].x);
        else if (i === o.length - 1) o[i].yp = (o[i].y - o[i - 1].y) / (o[i].x - o[i - 1].x);
        else o[i].yp = (o[i + 1].y - o[i - 1].y) / (o[i + 1].x - o[i - 1].x);
      }
      return o;
    };
    const trueFD = flatness(fd(cat), hCatenary).relDev;
    const bumpFD = flatness(fd(perturb(cat, midN, 0.02)), hCatenary).relDev;
    detail.hTrueFD = trueFD; detail.hBumpFD = bumpFD;
    ok('H strip buckles past the floor: a d=0.02 drag makes H waver ≫ 1e-3 (true strip stays ~flat)',
       bumpFD > 1e-3 && bumpFD > 20 * trueFD,
       'dragged H waves ' + (bumpFD * 100).toFixed(1) + '% vs true-FD ' + (trueFD * 100).toFixed(2) + '%');
  }

  // (14) DETERMINISM of the action: rebuilt twice, byte-identical (drift 0).
  {
    const a2 = action(sampleCatenary(0.85, 1.25, 240), fCatenary);
    const b2 = action(sampleCatenary(0.85, 1.25, 240), fCatenary);
    detail.actionDrift = Math.abs(a2 - b2);
    ok('Action is deterministic — rebuilt twice, byte-identical (drift 0)',
       a2 === b2,
       'drift ' + Math.abs(a2 - b2).toExponential(1));
  }

  const pass = checks.filter((c) => c.pass).length;
  return { pass, total: checks.length, checks, detail };
}

export {
  hCatenary, hCatenoid, hBrachistochrone, firstIntegralBrachistochrone,
  fCatenary, action, perturb,
  sampleCatenary, sampleCatenoid, sampleCycloid, sampleArc, sampleParabola,
  flatness, buildPanels, runSelfTest,
};
