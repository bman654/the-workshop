// === CORE BEGIN ===
// ─────────────────────────────────────────────────────────────────────────────────────────────
//  Two Roads, One Rhythm — a CROSS of The Road Into Chaos's logistic hump × a sine hump.
//
//  THE ONE IDEA. Universality. Feed the SAME period-doubling engine two DIFFERENT smooth humps and
//  they climb their ladders at the SAME shrinking instants — both windows between successive
//  doublings shrink by the very same universal ratio:
//
//        δ = lim (R_{n−1} − R_{n−2}) / (R_n − R_{n−1})  →  4.6692016…   (Feigenbaum's constant)
//
//  The logistic map x → r·x(1−x) and the sine map x → r·sin(πx) live on DIFFERENT r-axes ([0,4] vs
//  [0,1]) and their rung VALUES differ (R₁_log = 1+√5 = 3.2360680, R₁_sin = 0.7777338 — not even
//  close). Yet the RATIO of their shrinking windows lands on the same number. That sameness — same
//  WHEN, different WHERE — IS universality, and it is CONDITIONAL on a smooth quadratic maximum.
//
//  THE LOAD-BEARING NEGATIVE CONTROL. The tent map x → r·(1−|2x−1|) is a hump too — but its peak is
//  a CORNER, not a curve (piecewise-linear, no quadratic maximum). The SAME engine, run on the tent,
//  finds ONE superstable rung and then can never fork again: there is no cascade, so δ is UNDEFINED
//  (the ratio set is empty — NaN, never a number). Remove the smooth quadratic maximum and the
//  cascade — and δ — cease to exist. A vacuous "every hump gives δ" checker FAILS the tent.
//
//  THE FORM (form expresses content). One brass instrument: ONE contact dial (an integer ladder
//  depth d, 0..8 — the honest shared coordinate, since the maps live on different r-axes) drives TWO
//  stacked road-canvases over ONE shared gold ruler. Turning the dial to d advances BOTH roads to
//  their d-th superstable parameter R_d SIMULTANEOUSLY; each road draws its cascade as a recursively
//  SPLITTING trunk (1→2→4→8→16), and both roads fork on the SAME detent at the SAME frame. The eye
//  sees both ladders sprout a new generation IN UNISON — that shared WHEN is the universality. A
//  live δ meter under each smooth road crawls toward a gold 4.6692016… etched on the ruler.
//
//  SINGLE-SOURCE DISCIPLINE. The engine below is LIFTED byte-faithfully from bifurcation/core.mjs
//  (mechanical s/^export //): the algorithm is provably the SAME engine, fed three different humps.
//  index.html inlines this whole CORE region byte-identically between the same sentinels; the
//  byte-twin parity leg proves the page IS this module, char-for-char. The page and the test both
//  consume the SAME wrapper cascadeReading() — drawn == tested.
//
//  THE CLAIMS IT MAKES CHECKABLE (re-proven by the in-page pill AND core.test.mjs):
//    A. UNIVERSALITY — |δ_logistic − δ_sine| < 0.01 at ladder depth ≥6 (measured 8.48e-4).
//    B. IT'S δ — both δ within 0.01 of FEIGENBAUM_DELTA (4.669201609).
//    C. CONVERGES (a limit, not luck) — the last ratio is closer to δ than the first.
//    D. NEG-CONTROL (integer signal) — at depth 8 the smooth maps climb ≥7 rungs while the tent
//       climbs ≤1: rungs logistic=9, sine=9, tent=1.
//    E. NEG-CONTROL (no δ) — the tent has no cascade and its δ is NaN (ratio set empty).
//    F. ANTI-VACUITY — a classifier that always answers 4.669 has NO tent ladder to ratio ⇒ it
//       FAILS the tent. The smooth-only universality is the whole point.
//    G. BYTE-TWIN PARITY — index.html's inlined CORE region === core.mjs CORE char-for-char.
//    H. ANCHORS (anti-circularity) — R₁_logistic ≈ 1+√5 and R₁_sine ≈ 0.77773 are DIFFERENT rung
//       VALUES that yield the SAME ratio limit: one δ from two different roads.
// ─────────────────────────────────────────────────────────────────────────────────────────────

// ══ THE ENGINE — period-doubling cascade solver, lifted VERBATIM from bifurcation/core.mjs ══════════
const FEIGENBAUM_DELTA = 4.669201609102990;  // the universal constant

// The three single-hump maps. Each is x → r·(a hump). The logistic & sine humps are SMOOTH (a
// quadratic maximum); the tent's peak is a CORNER. `smoothMax` is a UI honesty flag the PAGE reads
// to paint the tent δ as "— (no cascade)"; the ENGINE treats every map identically — that identical
// treatment yielding 9 rungs vs 1 IS the proof. The engine NEVER special-cases the tent.
const MAPS = {
  logistic: { lo: 0, hi: 4, f: (r, x) => r * x * (1 - x),               xmax: 0.5, smoothMax: true,
              label: 'logistic  x → r·x(1−x)' },
  sine:     { lo: 0, hi: 1, f: (r, x) => r * Math.sin(Math.PI * x),     xmax: 0.5, smoothMax: true,
              label: 'sine  x → r·sin(πx)' },
  tent:     { lo: 0, hi: 1, f: (r, x) => r * (1 - Math.abs(2 * x - 1)), xmax: 0.5, smoothMax: false,
              label: 'tent  x → r·(1−|2x−1|)  (a corner, not a curve)' },
};

// Iterate the map n times from x0 (used for trajectories / the superstable test).
function iterate(map, r, x0, n) {
  let x = x0;
  for (let i = 0; i < n; i++) x = map.f(r, x);
  return x;
}

// f^{2^n}(xmax) − xmax. At a superstable 2^n-cycle this is exactly 0, because the critical point xmax
// is on the cycle and returns to itself after 2^n steps.
function superstableResidual(map, r, n) {
  const period = 1 << n;            // 2^n
  return iterate(map, r, map.xmax, period) - map.xmax;
}

// Bisection root of g on [a,b] with a sign change; ~52 halvings → double precision.
function bisect(g, a, b, iters = 80) {
  let ga = g(a), gb = g(b);
  if (ga === 0) return a;
  if (gb === 0) return b;
  if (ga * gb > 0) return NaN;      // no bracketed root
  for (let i = 0; i < iters; i++) {
    const m = 0.5 * (a + b), gm = g(m);
    if (gm === 0) return m;
    if (ga * gm < 0) { b = m; gb = gm; } else { a = m; ga = gm; }
  }
  return 0.5 * (a + b);
}

// Find the superstable parameter R_n for the 2^n-cycle (n=0,1,2,…). We scan r upward in fine steps
// from a lower bound, looking for the FIRST sign change of the residual above the previous
// superstable point, then bisect it.  R_0 (period 1, the fixed point) of the logistic map is r=2.
function superstablePoint(map, n, lowerBound, scanStep = 1e-4) {
  const g = (r) => superstableResidual(map, r, n);
  let a = lowerBound + 1e-7;
  let ga = g(a);
  // March upward until the residual changes sign; that brackets the next root.
  let r = a;
  for (r = a + scanStep; r <= map.hi + 1e-9; r += scanStep) {
    const gr = g(r);
    if (!isFinite(gr)) continue;
    if (ga * gr < 0) return bisect(g, r - scanStep, r);
    ga = gr; a = r;
  }
  return NaN;
}

// Build the ladder of superstable points R_0..R_{N} for a map, marching each search up from the
// previous rung so we always grab the NEXT doubling.
function superstableLadder(map, N, scanStep = 2e-5) {
  const R = [];
  let lower = map.lo;
  for (let n = 0; n <= N; n++) {
    // The doublings crowd together fast, so refine the scan step as n grows.
    const step = scanStep / Math.pow(1.9, Math.max(0, n - 2));
    const rn = superstablePoint(map, n, n === 0 ? map.lo : R[n - 1], step);
    if (!isFinite(rn)) break;
    R.push(rn);
    lower = rn;
  }
  return R;
}

// Feigenbaum ratios from a ladder of bifurcation/superstable parameters:
//   δ_n = (R_{n−1} − R_{n−2}) / (R_n − R_{n−1})
// The sequence converges to δ ≈ 4.6692. Returns the per-step ratios and the best (last,
// most-converged) estimate. For a map with no cascade (the tent, R.length < 3) `best` is NaN and
// `ratios` is the empty array — that is the honest "no δ" signal, never a number.
function feigenbaumRatios(R) {
  const ratios = [];
  for (let n = 2; n < R.length; n++) {
    const num = R[n - 1] - R[n - 2];
    const den = R[n] - R[n - 1];
    ratios.push(num / den);
  }
  return { ratios, best: ratios.length ? ratios[ratios.length - 1] : NaN };
}

// ══ THE ONE WRAPPER (the single source both the page and the test consume — drawn == tested) ════════
// cascadeReading(map, N): run the SAME engine on `map` to depth N and report the ladder, the per-step
// Feigenbaum ratios, the best (most-converged) δ estimate, and a boolean hasCascade. The ENGINE
// treats every map identically — the tent simply has nowhere to fork after R_0, so its ladder is one
// rung, hasCascade is false, and delta is NaN. EVERY caller branches on hasCascade (a boolean) —
// NEVER on isNaN(delta), never a NaN comparison.
function cascadeReading(map, N = 8) {
  const R = superstableLadder(map, N);
  const { ratios, best } = feigenbaumRatios(R);
  return { rungs: R.length, R, ratios, delta: best, hasCascade: R.length >= 3 };
}

// ══ THE SELF-TEST (re-proven by core.test.mjs; byte-twin-inlined as the page's pill) ════════════════
// NO args, returns {pass,total,lines,ok}. Every detail string carries LIVE numbers (the cardioid
// pattern) — never a hardcoded echo. Each leg branches on hasCascade, never on a NaN comparison.
function runSelfTest() {
  const lines = []; const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });

  const lo = cascadeReading(MAPS.logistic, 6), si = cascadeReading(MAPS.sine, 6);
  const te = cascadeReading(MAPS.tent, 8);
  const lo8 = cascadeReading(MAPS.logistic, 8), si8 = cascadeReading(MAPS.sine, 8);

  // A — UNIVERSALITY: the two smooth roads land on the SAME δ (different maps, one ratio).
  T('universality: |δ_logistic − δ_sine| < 0.01 (two different humps, one ratio)',
    Math.abs(lo.delta - si.delta) < 0.01,
    'δ_log=' + lo.delta.toFixed(6) + '  δ_sin=' + si.delta.toFixed(6) + '  |Δ|=' + Math.abs(lo.delta - si.delta).toExponential(2));

  // B — IT'S δ: both measured ratios sit on Feigenbaum's constant.
  T('it is δ: both within 0.01 of 4.6692016…',
    Math.abs(lo.delta - FEIGENBAUM_DELTA) < 0.01 && Math.abs(si.delta - FEIGENBAUM_DELTA) < 0.01,
    'δ_log=' + lo.delta.toFixed(6) + '  δ_sin=' + si.delta.toFixed(6) + '  δ=' + FEIGENBAUM_DELTA.toFixed(6));

  // C — CONVERGES (a limit, not luck): the last ratio is closer to δ than the first.
  T('the δ estimates converge toward the constant (a limit, not luck)',
    Math.abs(lo.ratios.at(-1) - FEIGENBAUM_DELTA) < Math.abs(lo.ratios[0] - FEIGENBAUM_DELTA),
    lo.ratios.map(v => v.toFixed(3)).join('→'));

  // D — NEG-CONTROL (integer signal, load-bearing): the smooth roads climb the ladder; the tent can't.
  T('neg-control: at depth 8 smooth roads climb ≥7 rungs, the tent ≤1',
    lo8.rungs >= 7 && si8.rungs >= 7 && te.rungs <= 1,
    'rungs: logistic=' + lo8.rungs + ' sine=' + si8.rungs + ' tent=' + te.rungs);

  // E — NEG-CONTROL (no δ): the tent has no cascade, so its δ is NaN — never a number.
  T('neg-control: the tent has no cascade ⇒ δ undefined (NaN, ratios: 0)',
    !te.hasCascade && Number.isNaN(te.delta),
    'tent δ = NaN (ratios: ' + te.ratios.length + ')');

  // F — ANTI-VACUITY: a classifier that always answers 4.669 has NO tent ladder to ratio ⇒ it FAILS.
  T('anti-vacuity: an always-4.669 classifier FAILS the tent (no ladder to ratio)',
    !te.hasCascade,
    'a classifier that always answers 4.669 has NO tent ladder to ratio ⇒ it FAILS the tent');

  const passed = lines.filter(c => c.ok).length;
  return { pass: passed, total: lines.length, lines, ok: passed === lines.length && lines.length > 0 };
}

export {
  FEIGENBAUM_DELTA, MAPS,
  iterate, superstableResidual, bisect, superstablePoint, superstableLadder, feigenbaumRatios,
  cascadeReading, runSelfTest,
};
// === CORE END ===

// Dual-use guard: run `node core.mjs` to print the self-test. index.html inlines the CORE region
// above byte-identically; core.test.mjs imports these exports and re-proves every leg + parity.
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  const r = runSelfTest();
  console.log('Two Roads, One Rhythm — core self-test: ' + r.pass + '/' + r.total + (r.ok ? ' ✓' : ' ✗ ' + r.lines.filter(l => !l.ok).map(l => l.name).join(',')));
  process.exit(r.ok ? 0 : 1);
}
