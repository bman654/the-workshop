/* ════════════════════════════════════════════════════════════════════════════
   THE KEYSTONE ARCH — core.mjs · the statics authority (pure, DOM-free).

   A semicircular masonry arch of N rigid voussoirs (stone wedges), dry-stacked
   with no mortar — held up by nothing but its own weight and the SHAPE it was
   cut to. Drop the last wedge (the KEYSTONE) and the ring goes rigid: a single
   line of compression — the LINE OF THRUST — threads from springer to springer,
   and as long as that line stays inside the stone, the arch stands forever.
   Lift the keystone out and there is no such line: the haunches have nothing to
   push against, the half-arches rotate about their springers, and it falls.

   ── THE FRAME (authoritative). O at the origin; y is UP; the two springers sit
      on the x-axis (y=0); the crown is at the top (y ≈ R_mid). EVERY value this
      module returns — voussoir polygons, joints, centroids, thrust points P_j —
      is in THIS world frame. The render is the ONLY place a transform lives.

   ── THE GEOMETRY (the test-pinned constants). R_i=2, R_o=3 ⇒ thickness t=1,
      R_mid=2.5; N=9 voussoirs each subtending Δθ=π/9=20°; unit weight γ=1, so a
      voussoir's weight is its annular-sector AREA. The keystone is the middle
      wedge, index m=(N−1)/2=4, centred on the crown at 90°. There are N+1=10
      radial joints J_0..J_9 at θ_j=j·Δθ; J_0 (θ=0) and J_9 (θ=π) are the
      springer beds on the abutments.

   ── THE LINE OF THRUST (the proven object). With only gravity (vertical) loads,
      the horizontal thrust H is CONSTANT through the ring. By symmetry the crown
      thrust is horizontal, at some height y_0. Taking the right half as a free
      body and cutting at each joint, the resultant of {crown thrust H at (0,y_0)}
      and {the weights above the cut} crosses joint J_k at radius
          ρ_k = (y_0·H + Σ_above w_i x_i) / (W_k·cosθ_k + H·sinθ_k)
      (moments about O). The ECCENTRICITY e_k = ρ_k − R_mid is how far the thrust
      sits from the joint's mid-line; |e_k| ≤ t/2 means the line is INSIDE the
      stone. The denominator N_k = W_k cosθ_k + H sinθ_k is the joint's NORMAL
      (axial) force — N_k > 0 means the joint is in COMPRESSION (the stones push,
      never pull: dry masonry has no tension to give).

   ── WHICH thrust line? The single rigid arch is statically indeterminate: a WHOLE
      FAMILY of (H, y_0) gives a valid line (Heyman's safe theorem — find ONE line
      in the ring and the arch stands). We report THE MOST CENTRED line: the (H,y_0)
      that minimises the largest |e_k|. For THIS arch that line equalises at three
      joints (crown, J_2 at 40°, J_0 the springer) at |e| = 0.13342… — and that is
      LESS than t/6 = 0.1667. Inside the middle third means no part of any joint is
      in tension: a strictly stronger statement than bare containment (|e|<t/2).
      `admissibleLine` solves that equioscillation exactly (Newton) and then PROVES
      every joint obeys |e_k| ≤ E < t/6 and N_k > 0.

   ── THE NEG-CONTROL (the asserted soul). Remove the keystone and the crown is a
      FREE surface — there is nothing for the haunches to thrust against, so H = 0
      is forced. Each half-arch (voussoirs 0..m−1) is then a four-stone cantilever
      under gravity alone; its thrust line ρ_k = Σwx / (W_k cosθ_k) flies OUTSIDE
      the ring at every joint (worst |e| = 0.8799 ≫ t/2), and the half's weight
      makes a non-zero moment about its springer bed (−2.4895 ≠ 0) that nothing
      balances. `keystoneRemoved` returns allOutsideRing=true, standsUp=false. The
      self-test asserts BOTH the seated arch stands AND the broken arch cannot.

   HONESTY HEDGE. What is PROVEN is the discrete statement at the joint crossings
   P_k: a contained, compressive line exists for the seated arch and none does for
   the broken one. Any SMOOTH curve drawn through the P_k (and the sag of an
   unseated ring) is render sugar — faithful, not asserted. The exact claim is the
   statics at the joints.

   Inlined byte-faithfully into the page via forge:include; imported by
   core.test.mjs, which runs the SAME runSelfTest() the in-page pill runs.
   ════════════════════════════════════════════════════════════════════════════ */

const PI = Math.PI;

/* ── default arch parameters (the test-pinned geometry) ───────────────────── */
export const ARCH = { Ri: 2, Ro: 3, N: 9, gamma: 1 };

/* Annular-sector primitive on [θa,θb] × [Ri,Ro]: its area (= weight when γ=1) and
   its centroid. By symmetry the centroid lies on the angular bisector φ=(θa+θb)/2
   at radius  r_c = (2/3)·(Ro³−Ri³)/(Ro²−Ri²)·sin(Δθ/2)/(Δθ/2). DOM-free, exact. */
export function annularSector(ta, tb, Ri, Ro, gamma = 1) {
  const dt = tb - ta;
  const area = 0.5 * (Ro * Ro - Ri * Ri) * dt;
  const rc = (2 / 3) * (Ro ** 3 - Ri ** 3) / (Ro * Ro - Ri * Ri) * (Math.sin(dt / 2) / (dt / 2));
  const phi = (ta + tb) / 2;
  return { area, weight: gamma * area, phi, rc, cx: rc * Math.cos(phi), cy: rc * Math.sin(phi) };
}

/* ── BUILD THE ARCH ─────────────────────────────────────────────────────────
   The whole geometry in the world frame: voussoirs (each with its polygon,
   centroid, weight, keystone flag) and joints J_0..J_N (each with inner/outer/mid
   points and the radial + tangent unit vectors). This is the sole geometry source
   the render consumes. */
export function buildArch(opts = {}) {
  const Ri = opts.Ri ?? ARCH.Ri, Ro = opts.Ro ?? ARCH.Ro;
  const N = opts.N ?? ARCH.N, gamma = opts.gamma ?? ARCH.gamma;
  const dth = PI / N;
  const Rmid = (Ri + Ro) / 2, t = Ro - Ri;
  if (N % 2 === 0) throw new Error('N must be odd so a single keystone sits on the crown');
  const keystoneIndex = (N - 1) / 2;

  const voussoirs = [];
  for (let j = 0; j < N; j++) {
    const ta = j * dth, tb = (j + 1) * dth;
    const s = annularSector(ta, tb, Ri, Ro, gamma);
    voussoirs.push({
      index: j, theta0: ta, theta1: tb, phi: s.phi,
      weight: s.weight, area: s.area,
      centroid: { x: s.cx, y: s.cy },
      isKeystone: j === keystoneIndex,
      polygon: voussoirPolygon(j, opts),
    });
  }
  const joints = [];
  for (let j = 0; j <= N; j++) {
    const th = j * dth, c = Math.cos(th), s = Math.sin(th);
    joints.push({
      index: j, theta: th,
      inner: { x: Ri * c, y: Ri * s },
      outer: { x: Ro * c, y: Ro * s },
      mid: { x: Rmid * c, y: Rmid * s },
      radial: { x: c, y: s },          // unit, points outward along the joint
      tangent: { x: -s, y: c },        // unit, along the arch toward the crown
      isSpringer: j === 0 || j === N,
    });
  }
  const totalWeight = voussoirs.reduce((a, v) => a + v.weight, 0);
  return { Ri, Ro, N, gamma, dth, Rmid, t, keystoneIndex, voussoirs, joints, totalWeight };
}

/* The polygon of voussoir j: inner arc θ0→θ1 at Ri, then outer arc θ1→θ0 at Ro,
   discretised into M steps per arc. Closed ring of {x,y} world points. */
export function voussoirPolygon(j, opts = {}) {
  const Ri = opts.Ri ?? ARCH.Ri, Ro = opts.Ro ?? ARCH.Ro, N = opts.N ?? ARCH.N;
  const M = opts.arcSteps ?? 10;
  const dth = PI / N, ta = j * dth, tb = (j + 1) * dth;
  const pts = [];
  for (let i = 0; i <= M; i++) { const th = ta + (tb - ta) * i / M; pts.push({ x: Ri * Math.cos(th), y: Ri * Math.sin(th) }); }
  for (let i = 0; i <= M; i++) { const th = tb + (ta - tb) * i / M; pts.push({ x: Ro * Math.cos(th), y: Ro * Math.sin(th) }); }
  return pts;
}

/* ── THE HALF-ARCH FREE-BODY PIECES (right half, crown → springer) ──────────
   Symmetry lets us analyse the right half. Cutting at the crown (θ=π/2) splits the
   keystone; the right portion of the keystone [m·Δθ, π/2] sits above joint J_m,
   then full voussoirs m−1, m−2, … 0 sit above joints J_{m−1} … J_0. Returns, in
   crown→springer order, each piece's weight, centroid x, and its lower joint angle. */
function halfArchPieces(arch) {
  const { Ri, Ro, N, gamma, dth, keystoneIndex: m } = arch;
  const pieces = [];
  // right half of the keystone: [m·dth, π/2], above joint J_m
  const hk = annularSector(m * dth, PI / 2, Ri, Ro, gamma);
  pieces.push({ weight: hk.weight, x: hk.cx, jointIndex: m, theta: m * dth });
  for (let j = m - 1; j >= 0; j--) {
    pieces.push({ weight: arch.voussoirs[j].weight, x: arch.voussoirs[j].centroid.x, jointIndex: j, theta: j * dth });
  }
  return pieces;
}

/* ── THE LINE OF THRUST for a given crown thrust H at crown height y0 ────────
   Returns, for the RIGHT half, the thrust crossing radius ρ_k, eccentricity e_k,
   normal force N_k at each joint, plus the full symmetric polyline of world points
   (left springer → … → crown → … → right springer) for the render, and the
   global verdicts contained / allCompressive / inMiddleThird / maxAbsE. */
export function thrustLine(H, y0, arch = buildArch()) {
  const { Rmid, t, N, dth, keystoneIndex: m } = arch;
  const pieces = halfArchPieces(arch);
  let W = 0, SwX = 0;
  const right = [];   // per-joint, crown→springer
  for (const p of pieces) {
    W += p.weight; SwX += p.weight * p.x;
    const th = p.theta;
    const Nk = W * Math.cos(th) + H * Math.sin(th);
    const rho = (y0 * H + SwX) / Nk;
    right.push({ jointIndex: p.jointIndex, theta: th, rho, e: rho - Rmid, N: Nk, W });
  }
  // crown "joint": the symmetry cut at θ=π/2, mid at (0,Rmid); thrust passes at (0,y0)
  const eCrown = y0 - Rmid;
  const Ncrown = H;       // purely horizontal thrust across the crown cut

  // assemble the symmetric polyline of thrust points in world coords.
  // right[] is crown→springer at joints J_m .. J_0. world point = ρ·(cosθ,sinθ).
  const rightPts = right.map(r => ({ x: r.rho * Math.cos(r.theta), y: r.rho * Math.sin(r.theta), e: r.e, jointIndex: r.jointIndex }));
  const crownPt = { x: 0, y: y0, e: eCrown, jointIndex: 'crown' };
  // left half = mirror of right (x → −x), joints J_{m..N}
  const leftPts = right.map(r => ({ x: -r.rho * Math.cos(r.theta), y: r.rho * Math.sin(r.theta), e: r.e, jointIndex: arch.N - r.jointIndex }));
  // order: right springer (J_0) … up to crown … down to left springer (J_N)
  const points = [...rightPts.slice().reverse(), crownPt, ...leftPts];

  const allE = [eCrown, ...right.map(r => r.e)];
  const maxAbsE = Math.max(...allE.map(Math.abs));
  const contained = maxAbsE <= t / 2 + 1e-12;
  const inMiddleThird = maxAbsE <= t / 6 + 1e-12;
  const allCompressive = Ncrown > 0 && right.every(r => r.N > 0);

  return { H, y0, right, eCrown, Ncrown, points, allE, maxAbsE, contained, inMiddleThird, allCompressive };
}

/* Solve a small linear system A·x = b (Gaussian elimination with partial pivoting,
   forward elimination to upper-triangular then back-substitution). Swapping whole
   augmented rows is safe — the unknowns are columns, so their order is preserved. */
function solveLin(A, b) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let i = 0; i < n; i++) {
    let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r;
    [M[i], M[p]] = [M[p], M[i]];
    for (let r = i + 1; r < n; r++) { const f = M[r][i] / M[i][i]; for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c]; }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n]; for (let c = i + 1; c < n; c++) s -= M[i][c] * x[c];
    x[i] = s / M[i][i];
  }
  return x;
}

/* ── THE MOST-CENTRED ADMISSIBLE LINE ───────────────────────────────────────
   Among the family of valid (H,y0) lines, the one that minimises the largest |e_k|.
   For this arch the minimax is an EQUIOSCILLATION at three joints — the crown, J_2
   (40°) and J_0 (the springer) — with the crown and springer bowing the thrust
   OUTward (+e) and J_2 INward (−e). We solve that 3×3 system exactly (Newton):
       e_crown(y0) = +E,   e_{J2}(H,y0) = −E,   e_{J0}(H,y0) = +E
   then VERIFY every joint obeys |e_k| ≤ E. The binding triple was identified
   numerically once for this geometry; the verification step is what makes the
   result trustworthy regardless. */
export function admissibleLine(arch = buildArch()) {
  const { Rmid } = arch;
  const pieces = halfArchPieces(arch);
  // cumulative W, SwX, and joint θ in crown→springer order (index 0..m)
  const cum = []; { let W = 0, S = 0; for (const p of pieces) { W += p.weight; S += p.weight * p.x; cum.push({ W, S, th: p.theta, ji: p.jointIndex }); } }
  // map joint-index → cumulative entry
  const byJoint = {}; cum.forEach(c => byJoint[c.ji] = c);
  const eOfJoint = (ji, H, y0) => { const c = byJoint[ji]; return (y0 * H + c.S) / (c.W * Math.cos(c.th) + H * Math.sin(c.th)) - Rmid; };
  const eCrown = y0 => y0 - Rmid;
  // binding joints for the equioscillation (numerically identified for this arch)
  const Jin = 2, Jout = 0;   // J2 bows inward, J0 (springer) outward
  // residuals in x = [H, y0, E]
  const F = ([H, y0, E]) => [eCrown(y0) - E, eOfJoint(Jin, H, y0) + E, eOfJoint(Jout, H, y0) - E];
  let x = [1.5, Rmid + 0.13, 0.13];
  for (let it = 0; it < 100; it++) {
    const f = F(x), h = 1e-8, Jm = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let c = 0; c < 3; c++) { const xp = x.slice(); xp[c] += h; const fp = F(xp); for (let i = 0; i < 3; i++) Jm[i][c] = (fp[i] - f[i]) / h; }
    const dx = solveLin(Jm, f.map(v => -v));
    x = x.map((v, i) => v + dx[i]);
    if (Math.hypot(...dx) < 1e-14) break;
  }
  const [H, y0, E] = x;
  const line = thrustLine(H, y0, arch);
  // verify equioscillation + dominance
  const binders = [Math.abs(line.eCrown), Math.abs(eOfJoint(Jin, H, y0)), Math.abs(eOfJoint(Jout, H, y0))];
  line.E = E;
  line.equioscillates = binders.every(b => Math.abs(b - E) < 1e-7);
  line.dominates = line.allE.every(e => Math.abs(e) <= E + 1e-9);
  return line;
}

/* ── THE THRUST WINDOW ──────────────────────────────────────────────────────
   The single rigid arch is indeterminate: a RANGE of horizontal thrusts H each
   admit a valid line. For each H we minimise over y0 (golden section) the largest
   |e|; H is admissible iff that minimum ≤ t/2. The window [Hmin, Hmax] is where
   the arch can find a contained line — its geometric margin. (Reported as context;
   the exact bounds are render/explainer sugar, pinned only loosely.) */
export function thrustWindow(arch = buildArch()) {
  const { t } = arch;
  const minMaxEoverY0 = (H) => {
    let lo = arch.Rmid - t, hi = arch.Rmid + t, gr = (Math.sqrt(5) - 1) / 2;
    let c = hi - gr * (hi - lo), d = lo + gr * (hi - lo);
    const f = y0 => thrustLine(H, y0, arch).maxAbsE;
    for (let i = 0; i < 80; i++) { if (f(c) < f(d)) { hi = d; d = c; c = hi - gr * (hi - lo); } else { lo = c; c = d; d = lo + gr * (hi - lo); } }
    const y0 = (lo + hi) / 2; return { y0, m: f(y0) };
  };
  const admissible = H => minMaxEoverY0(H).m <= t / 2 + 1e-9;
  // bracket-and-bisect for Hmin and Hmax around the centred line's H
  const Hc = admissibleLine(arch).H;
  const find = (dir) => {
    let inside = Hc, outside = Hc;
    let step = 0.5;
    while (admissible(outside + dir * step) && step < 50) outside += dir * step;
    outside = outside + dir * step;        // first inadmissible
    inside = outside - dir * step;
    for (let i = 0; i < 80; i++) { const mid = (inside + outside) / 2; if (admissible(mid)) inside = mid; else outside = mid; }
    return inside;
  };
  return { Hmin: find(-1), Hmax: find(+1), Hcentred: Hc };
}

/* ── THE NEG-CONTROL: KEYSTONE REMOVED ──────────────────────────────────────
   Lift the keystone out. The crown is now a free surface — no horizontal thrust
   can be applied there, so H = 0 is forced. Each half-arch (voussoirs 0..m−1) is a
   cantilever under gravity alone. Its thrust line ρ_k = Σwx/(W_k cosθ_k) leaves
   the ring at every joint; the half's weight makes a non-zero moment about its
   springer bed; it cannot stand. Returns the witness values. */
export function keystoneRemoved(arch = buildArch()) {
  const { Ri, Ro, N, gamma, dth, Rmid, t, keystoneIndex: m } = arch;
  // pieces of the right half WITHOUT the keystone: voussoirs m−1 … 0, free top at J_m
  const pieces = [];
  for (let j = m - 1; j >= 0; j--) pieces.push({ weight: arch.voussoirs[j].weight, x: arch.voussoirs[j].centroid.x, jointIndex: j, theta: j * dth });
  let W = 0, SwX = 0; const right = [];
  for (const p of pieces) {
    W += p.weight; SwX += p.weight * p.x;
    const Nk = W * Math.cos(p.theta);           // H = 0
    const rho = SwX / Nk;
    right.push({ jointIndex: p.jointIndex, theta: p.theta, rho, e: rho - Rmid, N: Nk });
  }
  const worstAbsE = Math.max(...right.map(r => Math.abs(r.e)));
  const allOutsideRing = right.every(r => Math.abs(r.e) > t / 2);
  const contained = worstAbsE <= t / 2;
  // gravity moment of the keystone-removed half about its springer-bed centre (Rmid,0),
  // signed (CCW +): a downward weight w at (x,y) makes moment w·(x − Rmid). Non-zero ⇒
  // unbalanced ⇒ the half rotates about its springer and drops.
  let gravityMomentAboutSpring = 0, halfWeight = 0;
  for (const p of pieces) { gravityMomentAboutSpring += p.weight * (p.x - Rmid); halfWeight += p.weight; }
  // counterfactual: the minimum crown thrust the MISSING keystone would have had to
  // supply (over a free crown height) to drag the worst joint back inside the ring.
  let HminNeeded = null;
  {
    const minMaxE = (H) => {
      // best y0 for this counterfactual H
      let best = Infinity;
      for (let y0 = Rmid - t; y0 <= Rmid + t; y0 += t / 200) {
        let WW = 0, SS = 0, mx = 0;
        for (const p of pieces) { WW += p.weight; SS += p.weight * p.x; const Nk = WW * Math.cos(p.theta) + H * Math.sin(p.theta); mx = Math.max(mx, Math.abs((y0 * H + SS) / Nk - Rmid)); }
        best = Math.min(best, mx);
      }
      return best;
    };
    let lo = 0, hi = 4;
    if (minMaxE(hi) <= t / 2) { for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (minMaxE(mid) <= t / 2) hi = mid; else lo = mid; } HminNeeded = (lo + hi) / 2; }
  }
  const standsUp = contained;   // false: no contained line exists with H=0
  return { H: 0, right, worstAbsE, allOutsideRing, contained, standsUp, gravityMomentAboutSpring, halfWeight, HminNeeded };
}

/* ════════════════════════════════════════════════════════════════════════════
   THE SELF-TEST — proves the claims; the Node twin runs the SAME runSelfTest().
   ════════════════════════════════════════════════════════════════════════════ */
export function runSelfTest() {
  const log = [];
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; log.push('✗ ' + m); } };

  const arch = buildArch();
  const { t, Rmid, totalWeight } = arch;

  // (0) GEOMETRY sanity: 9 voussoirs, keystone is index 4 centred on the crown,
  //     total weight = 2.5π (= ½(Ro²−Ri²)·π with γ=1).
  ok(arch.N === 9 && arch.keystoneIndex === 4, `nine voussoirs, keystone is the middle stone (index ${arch.keystoneIndex})`);
  ok(Math.abs(arch.voussoirs[4].phi - Math.PI / 2) < 1e-12, `the keystone is centred on the crown (φ = 90°)`);
  ok(Math.abs(totalWeight - 2.5 * Math.PI) < 1e-9, `total weight = 2.5π (got ${totalWeight.toFixed(6)})`);
  ok(arch.joints.length === 10 && Math.abs(arch.joints[0].theta) < 1e-12 && Math.abs(arch.joints[9].theta - Math.PI) < 1e-12,
     `ten radial joints, springers on the x-axis (J0 at 0°, J9 at 180°)`);

  // (1) THE SEATED ARCH STANDS — a contained, compressive line of thrust exists.
  //     The most-centred line equioscillates at three joints, |e| = E, and that E
  //     is INSIDE the middle third (no tension anywhere) — strictly stronger than
  //     bare containment. Every joint is in compression (N_k > 0).
  const adm = admissibleLine(arch);
  ok(adm.contained === true, `the seated arch has a thrust line INSIDE the ring (max|e| = ${adm.maxAbsE.toFixed(8)} ≤ t/2 = 0.5)`);
  ok(adm.allCompressive === true, `every joint of the seated arch is in COMPRESSION (all normal forces N_k > 0)`);
  ok(adm.inMiddleThird === true && adm.maxAbsE < t / 6, `the centred line stays in the MIDDLE THIRD (max|e| = ${adm.maxAbsE.toFixed(6)} < t/6 = ${(t/6).toFixed(6)}) ⇒ no tension`);
  ok(adm.equioscillates === true, `the most-centred line equioscillates at three joints (crown · J2 · springer) at |e| = ${adm.E.toFixed(6)}`);
  ok(adm.dominates === true, `no other joint exceeds that |e| — it is genuinely the centred minimax`);
  // every single joint individually inside the ring
  ok(adm.allE.every(e => Math.abs(e) <= t / 2), `EVERY joint eccentricity is ≤ t/2 (the whole line threads the stone)`);

  // (2) THE THRUST WINDOW — the arch is safe over a RANGE of thrusts (indeterminacy
  //     + the safe theorem): Hmin < Hcentred < Hmax, all admitting a contained line.
  const win = thrustWindow(arch);
  ok(win.Hmin > 0 && win.Hmax > win.Hmin && win.Hcentred > win.Hmin && win.Hcentred < win.Hmax,
     `a whole window of thrusts works: H ∈ [${win.Hmin.toFixed(4)}, ${win.Hmax.toFixed(4)}], centred at ${win.Hcentred.toFixed(4)}`);

  // (3) THE NEG-CONTROL: remove the keystone and NO contained line exists. With H=0
  //     forced (free crown), the half-arch's thrust line is OUTSIDE the ring at every
  //     joint, the worst by a country mile, and gravity makes an unbalanced moment
  //     about the springer — it falls. (Asserted, the soul of the piece.)
  const neg = keystoneRemoved(arch);
  ok(neg.contained === false && neg.standsUp === false, `keystone removed ⇒ NO contained thrust line · standsUp === false`);
  ok(neg.allOutsideRing === true, `with the keystone gone the thrust line is OUTSIDE the ring at EVERY joint`);
  ok(neg.worstAbsE > t / 2, `the broken arch's worst eccentricity ${neg.worstAbsE.toFixed(6)} ≫ t/2 = 0.5`);
  ok(Math.abs(neg.gravityMomentAboutSpring) > 1e-6, `the half-arch's weight makes a NON-zero moment about its springer (${neg.gravityMomentAboutSpring.toFixed(6)}) — nothing balances it`);

  // (4) THE PINNED NUMBERS — the /tmp-validated headline values, to machine ε.
  ok(Math.abs(neg.worstAbsE - 0.879859) < 5e-6, `neg-control worst|e| = 0.879859 (got ${neg.worstAbsE.toFixed(6)})`);
  ok(Math.abs(neg.gravityMomentAboutSpring - (-2.489530)) < 5e-6, `neg-control gravity moment = −2.489530 (got ${neg.gravityMomentAboutSpring.toFixed(6)})`);
  ok(Math.abs(adm.maxAbsE - 0.13342142) < 1e-6, `centred line max|e| = 0.13342142 (got ${adm.maxAbsE.toFixed(8)})`);

  // (5) THE CONTRAST IS THE WHOLE STORY: seated stands, broken cannot.
  ok(adm.contained === true && neg.contained === false, `GREEN = the seated arch STANDS and the keystone-less arch CANNOT (the contrast is the proof)`);

  return { pass, fail, log, adm, neg, win };
}

/* ── Node bridge. forge strips this dual-use guard wholesale when it inlines this
   core into the page; in the browser `module`/`require` are undefined anyway. The
   real Node entry point is core.test.mjs, which imports this module (ESM) and runs
   the SAME runSelfTest(). `node the-keystone-arch/core.test.mjs` exits 0 iff green. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ARCH, annularSector, buildArch, voussoirPolygon, thrustLine,
    admissibleLine, thrustWindow, keystoneRemoved, runSelfTest,
  };
}
