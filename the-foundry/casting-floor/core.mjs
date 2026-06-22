// ============================================================================
//  THE FOUNDRY · The Casting Floor — the estate's ONE potential-field core.
//
//  Zero-dependency, DOM-free ESM. Runs in the browser AND in Node. This module
//  is the SOLE SOURCE OF TRUTH for every temperature / potential / residual /
//  bead-path number the room shows. The page inlines the slab between the
//  CASTING-FLOOR CORE BEGIN / END sentinels byte-for-byte; core.test.mjs proves
//  the inlined copy is identical (indentation-normalised) to this file, so the
//  page, the in-page self-test pill, and the Node twin all run the SAME math.
//
//  ── THE ONE CLAIM, made falsifiable ──────────────────────────────────────────
//  A pinned rim (Dirichlet boundary) determines a UNIQUE interior field, and the
//  field the mold SETTLES to under relaxation is the harmonic one: every interior
//  cell equals the average of its four neighbours (the discrete Laplace equation
//  ∇²T = 0). It does NOT depend on the molten chaos you poured in — that initial
//  guess is forgotten. Relaxation (red-black SOR) drives the mean-value defect
//  ‖∇²T‖∞ → 0; at convergence the field is the one the rim allows, and a bead of
//  solder released onto it rides −∇T strictly downhill to a cold rim cell and can
//  NEVER stall in the interior (the maximum principle: a harmonic field has no
//  interior extremum to trap it).
//
//  The core is written GENERIC (a scalar field on a masked grid with Dirichlet
//  fixed values and an optional Poisson source ρ) so future wave-front /
//  streamline-ψ / Poisson benches can import it unforked: Laplace is just the
//  source===0 case. A single `source` term turns ∇²T = 0 into ∇²T = −ρ.
// ============================================================================

// === CASTING-FLOOR CORE BEGIN ===
// ── cell-mask kinds. FREE cells relax; DIRICHLET cells are clamped (rim + cores).
const FREE = 0;
const DIRICHLET = 1;

// ── grid factory: an N×N scalar field with a mask, fixed-value array, and source.
//    field[i] is the live value; mask[i] in {FREE,DIRICHLET}; fixed[i] is the
//    clamped value for DIRICHLET cells; source[i] is ρ (0 ⇒ Laplace, else Poisson
//    ∇²T = −ρ). Stored row-major, index = y*N + x.
function makeGrid(N) {
  return {
    N,
    field: new Float64Array(N * N),
    mask: new Uint8Array(N * N),       // FREE everywhere by default
    fixed: new Float64Array(N * N),
    source: new Float64Array(N * N),   // ρ; defaults to 0 ⇒ pure Laplace
  };
}

// ── clamp the whole rim (the iron mold edge) to a value FROM a function f(x,y),
//    where x,y are normalised in [0,1] across the grid. Used to seat the canonical
//    boundary conditions (linear ramp, one hot edge, hot corner) exactly.
function clampRim(g, f) {
  const N = g.N;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (x === 0 || y === 0 || x === N - 1 || y === N - 1) {
        const i = y * N + x;
        const v = f(x / (N - 1), y / (N - 1));
        g.mask[i] = DIRICHLET;
        g.fixed[i] = v;
        g.field[i] = v;            // a clamped cell holds its value immediately
      }
    }
  }
}

// ── drop an interior obstacle core (a chill-block / riser): one cell pinned to a
//    fixed value. Interior Dirichlet — the bead treats it as a cold/hot gate too.
function setFixed(g, x, y, value) {
  const i = y * g.N + x;
  g.mask[i] = DIRICHLET;
  g.fixed[i] = value;
  g.field[i] = value;
}

// ── seat a Poisson source ρ at one cell (the "riser/spring" core). With ρ≠0 the
//    converged mean-value defect at THAT cell is exactly ρ, not 0 — the break is
//    the source strength. One flag, not a fork.
function setSource(g, x, y, rho) {
  g.source[y * g.N + x] = rho;
}

// ── re-seat every DIRICHLET cell's live value to its clamp (call before relax so
//    the rim/cores hold no leftover pour). FREE cells keep whatever guess they hold.
function applyFixed(g) {
  const n = g.N * g.N;
  for (let i = 0; i < n; i++) if (g.mask[i] === DIRICHLET) g.field[i] = g.fixed[i];
}

// ── the optimal SOR over-relaxation factor for an N×N Dirichlet grid. Derived,
//    NOT hardcoded — recomputed from the ACTUAL N so it stays correct if N changes.
//    ω* = 2 / (1 + sin(π/N)) is the classical optimum for the model problem; it is
//    in (1,2), and ω→2 from above sends the iteration unstable (the dial's far end).
function optimalOmega(N) {
  return 2 / (1 + Math.sin(Math.PI / N));
}

// ── ONE red-black SOR sweep. Each colour's update reads ONLY the other colour's
//    cells, so within a colour the order does not matter (Gauss–Seidel done in two
//    deterministic half-sweeps). The 4-neighbour Laplacian average, pulled toward
//    by ω. The Poisson source enters as the discrete +¼·h²·ρ term; on the unit
//    grid (h ≡ 1 in cell units) that is +¼·source. Returns nothing; mutates field.
//
//    Boundary handling: a FREE cell is, by construction, never on the rim (the rim
//    is all DIRICHLET), so its four neighbours always exist. A neighbour that is
//    DIRICHLET contributes its clamped value — that is how the boundary enters.
function sweepColor(g, color, omega) {
  const N = g.N, f = g.field, m = g.mask, src = g.source;
  for (let y = 1; y < N - 1; y++) {
    for (let x = 1; x < N - 1; x++) {
      if (((x + y) & 1) !== color) continue;     // skip the other colour
      const i = y * N + x;
      if (m[i] !== FREE) continue;               // clamped cells never move
      const avg = 0.25 * (f[i - 1] + f[i + 1] + f[i - N] + f[i + N] + src[i]);
      f[i] += omega * (avg - f[i]);              // SOR: over-relax toward the average
    }
  }
}

// ── one full red-black sweep (red then black).
function sweepRedBlack(g, omega) {
  sweepColor(g, 0, omega);   // red:  (x+y) even
  sweepColor(g, 1, omega);   // black: (x+y) odd
}

// ── the discrete-Laplacian residual = the MEAN-VALUE DEFECT, read HONESTLY as the
//    max over FREE cells of |T − ¼(Σ4 neighbours + source)|. This is what drives
//    the pyrometer/settling gauge — the actual max, never a timer. At convergence
//    it is < tol everywhere; with a Poisson source ρ at a cell it pins to ρ there.
function residualInf(g) {
  const N = g.N, f = g.field, m = g.mask, src = g.source;
  let worst = 0;
  for (let y = 1; y < N - 1; y++) {
    for (let x = 1; x < N - 1; x++) {
      const i = y * N + x;
      if (m[i] !== FREE) continue;
      const avg = 0.25 * (f[i - 1] + f[i + 1] + f[i - N] + f[i + N] + src[i]);
      const d = Math.abs(f[i] - avg);
      if (d > worst) worst = d;
    }
  }
  return worst;
}

// ── the signed FULL residual defect AT one cell (includes the source term, no
//    abs). This is what relax/residualInf drive to 0; at convergence it is ~0
//    everywhere — even at a Poisson cell — because the source is built into the
//    update. Use it to confirm the solver actually converged the Poisson problem.
function defectAt(g, x, y) {
  const N = g.N, f = g.field, i = y * N + x;
  const avg = 0.25 * (f[i - 1] + f[i + 1] + f[i - N] + f[i + N] + g.source[i]);
  return f[i] - avg;
}

// ── the signed PURE MEAN-VALUE defect AT one cell: T − ¼·Σ4neighbours, with NO
//    source term. This is the LAPLACE / harmonic test — "does this cell equal the
//    average of its four neighbours?". On a converged Laplace field it is ~0
//    everywhere; on a converged POISSON field it equals exactly +¼ρ at the source
//    cell (the source is exactly the amount by which the mean-value property is
//    broken). This is what the loupe shows and what the NEG-A control reddens.
function meanValueDefectAt(g, x, y) {
  const N = g.N, f = g.field, i = y * N + x;
  const avg = 0.25 * (f[i - 1] + f[i + 1] + f[i - N] + f[i + N]);
  return f[i] - avg;
}

// ── relax until residualInf < tol or maxSweeps. Re-seats the clamped cells first
//    (so the rim never carries leftover pour), then sweeps. Returns {sweeps,residual}.
function relax(g, { tol = 1e-8, maxSweeps = 20000, omega } = {}) {
  applyFixed(g);
  const w = (omega == null) ? optimalOmega(g.N) : omega;
  let r = residualInf(g);
  let s = 0;
  while (r >= tol && s < maxSweeps) {
    sweepRedBlack(g, w);
    s++;
    r = residualInf(g);
  }
  return { sweeps: s, residual: r };
}

// ── SUB-CELL BILINEAR gradient of the field at a continuous point (gx,gy) in cell
//    coordinates. Central differences on the four corner cells of the containing
//    unit square, bilinearly blended. Reads the SAME field the relax produced.
//    Returns [∂T/∂x, ∂T/∂y]. Used by the bead to ride −∇T smoothly between cells.
function gradientAt(g, gx, gy) {
  const N = g.N;
  // clamp the sample to the interior so central differences have neighbours
  gx = Math.max(1, Math.min(N - 2, gx));
  gy = Math.max(1, Math.min(N - 2, gy));
  const x0 = Math.floor(gx), y0 = Math.floor(gy);
  const tx = gx - x0, ty = gy - y0;
  const dT = (cx, cy) => {
    cx = Math.max(1, Math.min(N - 2, cx));
    cy = Math.max(1, Math.min(N - 2, cy));
    const i = cy * N + cx;
    return [0.5 * (g.field[i + 1] - g.field[i - 1]),
            0.5 * (g.field[i + N] - g.field[i - N])];
  };
  const g00 = dT(x0, y0), g10 = dT(x0 + 1, y0),
        g01 = dT(x0, y0 + 1), g11 = dT(x0 + 1, y0 + 1);
  const bl = (a, b, c, d) =>
    a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + d * tx * ty;
  return [bl(g00[0], g10[0], g01[0], g11[0]), bl(g00[1], g10[1], g01[1], g11[1])];
}

// ── which integer cell does a continuous point sit in (nearest cell centre).
function cellOf(gx, gy) { return [Math.round(gx), Math.round(gy)]; }

// ── descend −∇T from a start point. A bead of solder rides downhill toward the
//    coldest reachable rim cell. Steps a small distance along −∇T each tick,
//    using the bilinear gradient; terminates ONLY when it reaches a DIRICHLET cell
//    (a rim or obstacle "gate") or runs out of steps. Returns {path, landingCell,
//    stalled}. On a CONVERGED field it always lands on a DIRICHLET cell — never
//    stalls interior — because a harmonic field has no interior minimum.
function descendGradient(g, sx, sy, { step = 0.18, maxSteps = 6000, minGrad = 1e-7 } = {}) {
  const N = g.N;
  let x = sx, y = sy;
  const path = [[x, y]];
  let landingCell = null, stalled = false;
  for (let k = 0; k < maxSteps; k++) {
    const [cx, cy] = cellOf(x, y);
    const ci = cy * N + cx;
    if (g.mask[ci] === DIRICHLET) { landingCell = [cx, cy]; break; }   // reached a gate
    const [dx, dy] = gradientAt(g, x, y);
    const mag = Math.hypot(dx, dy);
    if (mag < minGrad) { stalled = true; break; }   // no slope (should not happen if converged)
    x -= step * dx / mag;       // move downhill: against the gradient, unit-speed
    y -= step * dy / mag;
    x = Math.max(0, Math.min(N - 1, x));
    y = Math.max(0, Math.min(N - 1, y));
    path.push([x, y]);
  }
  if (!landingCell) { const [cx, cy] = cellOf(x, y); landingCell = [cx, cy]; }
  return { path, landingCell, stalled };
}

// ── max pointwise distance between two bead paths (sampled at matched fractional
//    positions). Used to assert the early-stop path DIVERGES from the honest path.
function pathDivergence(pa, pb) {
  const n = Math.min(pa.length, pb.length);
  let worst = 0;
  for (let k = 0; k < n; k++) {
    const d = Math.hypot(pa[k][0] - pb[k][0], pa[k][1] - pb[k][1]);
    if (d > worst) worst = d;
  }
  return worst;
}

// ── CLOSED-FORM ORACLE 1: the linear ramp T = a·x + b·y is EXACTLY harmonic
//    (∇²(ax+by) = 0), and on the discrete grid the 4-neighbour mean reproduces it
//    exactly, so the relaxed interior must equal a·x_norm + b·y_norm to tol. An
//    oracle independent of any sweep.
function linearRampOracle(a, b, N, x, y) {
  return a * (x / (N - 1)) + b * (y / (N - 1));
}

// ── CLOSED-FORM ORACLE 2: the one-hot-edge Fourier-sine series. Three rim edges
//    held at 0, the top edge (y = H) held at T0; the analytic harmonic solution on
//    the unit square [0,L]×[0,H] is
//        T(x,y) = Σ_{n odd} (4·T0/(n·π)) · sin(nπx/L) · sinh(nπy/L) / sinh(nπH/L).
//    A genuinely different math object than the linear ramp — a real infinite sum,
//    summed to `terms` odd n. With L=H=1 (the unit square), x,y normalised in [0,1].
function oneHotEdgeOracle(T0, x, y, terms = 200) {
  let s = 0;
  for (let k = 0; k < terms; k++) {
    const n = 2 * k + 1;
    const denom = Math.sinh(n * Math.PI);          // sinh(nπH/L), H=L=1
    if (!isFinite(denom) || denom === 0) break;    // terms beyond float range add ~0
    s += (4 * T0 / (n * Math.PI)) * Math.sin(n * Math.PI * x) *
         Math.sinh(n * Math.PI * y) / denom;
  }
  return s;
}

// ── THE SELF-TEST: the SAME assertion runner the in-page pill and the Node twin
//    both call. Proves the one claim TWO independent ways, never both through the
//    same relaxer, plus the neg-controls. Returns {checks,passed,total,ok}.
function runCoreTests() {
  const checks = [];
  const ok = (name, pass, info = '') => checks.push({ name, pass, info });

  // CRUX-1 — MEAN-VALUE EVERYWHERE: after relax, the residual (mean-value defect)
  //   is < tol at EVERY interior FREE cell (the whole grid, not a sample).
  {
    const N = 32, tol = 1e-8;
    const g = makeGrid(N);
    clampRim(g, (x, y) => Math.sin(2.3 * x + 1.1) + 0.7 * Math.cos(1.7 * y));
    for (const i of g.field.keys()) if (g.mask[i] === FREE) g.field[i] = 9.0; // molten chaos
    const r = relax(g, { tol });
    ok('CRUX-1 mean-value everywhere: ‖∇²T‖∞ < tol at every interior cell after relax',
       r.residual < tol, 'residual ' + r.residual.toExponential(2) + ' in ' + r.sweeps + ' sweeps');
  }

  // CRUX-2 — LINEAR RAMP (anti-circular): clamp rim to T=a·x+b·y; the relaxed
  //   interior reproduces a·x+b·y to a TIGHT tol. Oracle is closed-form, no sweep.
  {
    const N = 32, a = 2.4, b = -1.3, tol = 1e-6;
    const g = makeGrid(N);
    clampRim(g, (x, y) => a * x + b * y);
    for (const i of g.field.keys()) if (g.mask[i] === FREE) g.field[i] = -4.0;
    relax(g, { tol: 1e-12 });
    let worst = 0;
    for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
      const want = linearRampOracle(a, b, N, x, y);
      const d = Math.abs(g.field[y * N + x] - want);
      if (d > worst) worst = d;
    }
    ok('CRUX-2 linear ramp T=ax+by reproduced exactly (closed-form oracle, anti-circular)',
       worst < tol, 'worst |relaxed − (ax+by)| = ' + worst.toExponential(2));
  }

  // CRUX-3 — ONE-HOT-EDGE (Fourier-sine): 3 rim edges at 0, top edge at T0; the
  //   relaxed interior matches the analytic Σ-series to a LOOSER tol, sampled away
  //   from the hot-edge corners (Gibbs). A different math object than CRUX-2.
  {
    const N = 32, T0 = 1.0, tol = 5e-3;
    const g = makeGrid(N);
    clampRim(g, (x, y) => (y >= 1 - 1e-9 ? T0 : 0));   // only the top edge (y=1) hot
    relax(g, { tol: 1e-11 });
    let worst = 0, where = '';
    for (let y = 4; y < N - 4; y++) for (let x = 4; x < N - 4; x++) {
      const want = oneHotEdgeOracle(T0, x / (N - 1), y / (N - 1), 300);
      const d = Math.abs(g.field[y * N + x] - want);
      if (d > worst) { worst = d; where = `(${x},${y})`; }
    }
    ok('CRUX-3 one-hot-edge matches Fourier-sine Σ (≥300 terms, corner-avoiding)',
       worst < tol, 'worst |relaxed − Fourier| = ' + worst.toExponential(2) + ' @ ' + where);
  }

  // NEG-A (RED) — POISSON SOURCE: inject ρ at one cell. The mean-value DEFECT at
  //   that cell === ρ (NOT 0) while every OTHER interior cell stays < tol. The
  //   break is exactly the source strength.
  {
    const N = 32, tol = 1e-7, rho = 3.5, cx = 16, cy = 16;
    const g = makeGrid(N);
    clampRim(g, () => 0);
    setSource(g, cx, cy, rho);
    relax(g, { tol: 1e-11 });
    // discrete Poisson here is T = ¼(Σ4) + ¼ρ ⇒ the PURE mean-value defect
    //   (T − ¼Σ4, no source) = ¼ρ at the source cell, and ~0 everywhere else.
    const mvAtSource = meanValueDefectAt(g, cx, cy);
    const expected = 0.25 * rho;
    let worstOther = 0;
    for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
      if (x === cx && y === cy) continue;
      const d = Math.abs(meanValueDefectAt(g, x, y));
      if (d > worstOther) worstOther = d;
    }
    ok('NEG-A Poisson source: mean-value defect at the source cell === ¼ρ (the break = the source)',
       Math.abs(mvAtSource - expected) < tol, 'mean-value defect ' + mvAtSource.toFixed(6) + ' vs ¼ρ ' + expected.toFixed(6));
    ok('NEG-A every OTHER interior cell stays harmonic (mean-value defect < tol)',
       worstOther < tol, 'worst other defect ' + worstOther.toExponential(2));
    // and the FULL Poisson residual (with source) DID converge to ~0 (solver is honest)
    ok('NEG-A the Poisson problem itself converged (full residual < tol everywhere)',
       residualInf(g) < tol, 'full residual ' + residualInf(g).toExponential(2));
  }

  // NEG-B (RED) — EARLY-STOP CHIP: drop the bead on a half-cooled field vs the
  //   converged one. A structured molten POUR (a hot blob off to one side) leaves
  //   a leftover bump in the half-cooled field that shoves the bead the wrong way;
  //   by convergence that bump has dissolved. Assert BOTH the landing cell differs
  //   AND the path diverges beyond tol — the reading is only honest once SET.
  {
    const N = 32;
    const bc = (x, y) => 0.4 * x - 0.3 * y;       // a gentle ramp — converged bead heads one way
    const pour = (i) => {                          // a hot molten blob in the lower-left
      const x = i % N, y = (i / N) | 0;
      const dx = (x - 8) / 6, dy = (y - 8) / 6;
      return 6.0 * Math.exp(-(dx * dx + dy * dy));
    };
    // converged field — the pour is fully forgotten
    const gc = makeGrid(N);
    clampRim(gc, bc);
    for (const i of gc.field.keys()) if (gc.mask[i] === FREE) gc.field[i] = pour(i);
    relax(gc, { tol: 1e-10 });
    const honest = descendGradient(gc, 16, 16);
    // half-cooled field — same molten pour, only partway relaxed (leftover bump)
    const ge = makeGrid(N);
    clampRim(ge, bc);
    for (const i of ge.field.keys()) if (ge.mask[i] === FREE) ge.field[i] = pour(i);
    applyFixed(ge);
    const w = optimalOmega(N);
    for (let s = 0; s < 18; s++) sweepRedBlack(ge, w);   // EARLY stop (≪ ~100 to converge)
    const early = descendGradient(ge, 16, 16);
    const landDiff = honest.landingCell[0] !== early.landingCell[0] ||
                     honest.landingCell[1] !== early.landingCell[1];
    const div = pathDivergence(honest.path, early.path);
    ok('NEG-B early-stop bead beaches at a DIFFERENT rim cell than the converged bead',
       landDiff, 'honest gate (' + honest.landingCell + ') vs early (' + early.landingCell + ')');
    ok('NEG-B early-stop path diverges > 1 cell from the converged path',
       div > 1.0, 'max path divergence ' + div.toFixed(2) + ' cells');
  }

  // OVER-RELAXATION is a TESTED claim: optimal ω converges in FEWER sweeps than
  //   Gauss–Seidel (ω=1) on a fixed grid.
  {
    const N = 32, tol = 1e-8;
    const mk = () => { const g = makeGrid(N); clampRim(g, (x, y) => Math.sin(2 * x) + y);
      for (const i of g.field.keys()) if (g.mask[i] === FREE) g.field[i] = 3.0; return g; };
    const sor = relax(mk(), { tol });
    const gs = relax(mk(), { tol, omega: 1.0 });
    ok('over-relaxation: optimal ω converges in FEWER sweeps than Gauss–Seidel (ω=1)',
       sor.sweeps < gs.sweeps, 'optimal ω ' + sor.sweeps + ' sweeps vs GS ' + gs.sweeps + ' sweeps');
  }

  // MAXIMUM PRINCIPLE in the suite: on a converged field a bead from ANY interior
  //   start ALWAYS terminates on a DIRICHLET cell — never stalls in the interior.
  {
    const N = 32;
    const g = makeGrid(N);
    clampRim(g, (x, y) => Math.sin(2.5 * x + 0.3) + Math.cos(1.9 * y));
    relax(g, { tol: 1e-10 });
    let everStalled = false, worstStart = '';
    for (let sy = 4; sy < N - 4; sy += 5) for (let sx = 4; sx < N - 4; sx += 5) {
      const res = descendGradient(g, sx, sy);
      const [lx, ly] = res.landingCell;
      const onDir = g.mask[ly * N + lx] === DIRICHLET;
      if (res.stalled || !onDir) { everStalled = true; worstStart = `(${sx},${sy})`; }
    }
    ok('maximum principle: a bead always reaches a DIRICHLET gate, never stalls interior',
       !everStalled, everStalled ? 'STALLED from ' + worstStart : 'all starts reached a gate');
  }

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// === CASTING-FLOOR CORE END ===

export {
  FREE, DIRICHLET,
  makeGrid, clampRim, setFixed, setSource, applyFixed,
  optimalOmega, sweepColor, sweepRedBlack, residualInf, defectAt, meanValueDefectAt,
  relax, gradientAt, cellOf, descendGradient, pathDivergence,
  linearRampOracle, oneHotEdgeOracle, runCoreTests,
};
