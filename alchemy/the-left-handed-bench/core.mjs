// ============================================================================
//  alchemy/the-left-handed-bench/core.mjs — THE RIGOR CORE. DOM-free, the sole
//  math authority for The Left-Handed Bench. Pure functions only; the page
//  forge-inlines the block between the LEFT-HANDED CORE sentinels byte-for-byte
//  and both the in-page chip and the Node twins import THIS file, so the thing
//  you turn in the round is the thing the math measures — one source of truth.
//
//  THE ONE FACT THIS BENCH RESTS ON
//   A chiral molecule cannot be laid onto its mirror image by any PROPER rotation
//   (a turn — no reflections; reflection is the move your hand cannot make). We
//   MEASURE that: best-fit RMSD, minimised over proper rotation × the atoms you
//   are allowed to relabel, lands the two enantiomers on OPPOSITE sides of ε and
//   the achiral control on ~0. That gap, brute-forced against 20k random turns,
//   is what the object refuses to close in your hands.
//
//  WHY HORN, NOT SVD. The naive 3×3-SVD Kabsch corrects handedness by flipping the
//  smallest singular vector when det<0 — and on CH2Cl2's DEGENERATE covariance
//  (two equal Cl, two equal H) that correction picks the wrong axis and reports a
//  false ~0.407 for a molecule that is genuinely superimposable. Horn's quaternion
//  method builds a 4×4 symmetric matrix whose top eigenvector IS a unit quaternion,
//  so the rotation is PROPER by construction (det=+1) and robust to degeneracy.
//  The eigenvector comes from a plain cyclic-Jacobi solver (symmetric, converges
//  to machine ε) — no SVD anywhere.
// ============================================================================

// ===== LEFT-HANDED CORE =====
"use strict";

/* ── the constants that place the two molecules on opposite sides of the line ── */
const EPS = 0.5;            // the chirality threshold (Å RMSD). enantiomer ≫ EPS, control ≪ EPS
const CONTROL_TOL = 1e-6;   // the achiral floor: CH2Cl2 seats to ~machine-ε, well under this

/* ── tiny linear algebra (row-major 3×3, plain 3-vectors) ── */
const v_sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const v_add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const v_dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const v_len = (a) => Math.sqrt(v_dot(a, a));
function matVec(R, v) {
  return [
    R[0][0] * v[0] + R[0][1] * v[1] + R[0][2] * v[2],
    R[1][0] * v[0] + R[1][1] * v[1] + R[1][2] * v[2],
    R[2][0] * v[0] + R[2][1] * v[1] + R[2][2] * v[2],
  ];
}
function matMul(A, B) {
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    let s = 0; for (let k = 0; k < 3; k++) s += A[i][k] * B[k][j];
    C[i][j] = s;
  }
  return C;
}
function det3(R) {
  return R[0][0] * (R[1][1] * R[2][2] - R[1][2] * R[2][1])
       - R[0][1] * (R[1][0] * R[2][2] - R[1][2] * R[2][0])
       + R[0][2] * (R[1][0] * R[2][1] - R[1][1] * R[2][0]);
}
const IDENT3 = () => [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

/* centroid of an atom list (unweighted mean of positions) */
function centroid(atoms) {
  const c = [0, 0, 0];
  for (const a of atoms) { c[0] += a.p[0]; c[1] += a.p[1]; c[2] += a.p[2]; }
  const n = atoms.length || 1;
  return [c[0] / n, c[1] / n, c[2] / n];
}
/* centred COPY: the math never touches the caller's data, and the scene shares
   the SAME centred coords (it never re-centres) — one source of truth. */
function centred(atoms) {
  const c = centroid(atoms);
  return atoms.map((a) => ({ el: a.el, p: v_sub(a.p, c) }));
}

/* ── a unit quaternion (w,x,y,z) → a proper rotation matrix (always det=+1) ── */
function quatToMat(q) {
  const [w, x, y, z] = q;
  return [
    [1 - 2 * (y * y + z * z), 2 * (x * y - w * z),     2 * (x * z + w * y)],
    [2 * (x * y + w * z),     1 - 2 * (x * x + z * z), 2 * (y * z - w * x)],
    [2 * (x * z - w * y),     2 * (y * z + w * x),     1 - 2 * (x * x + y * y)],
  ];
}
function matToQuat(R) {
  const t = R[0][0] + R[1][1] + R[2][2];
  let w, x, y, z;
  if (t > 0) {
    let s = Math.sqrt(t + 1) * 2;
    w = 0.25 * s;
    x = (R[2][1] - R[1][2]) / s; y = (R[0][2] - R[2][0]) / s; z = (R[1][0] - R[0][1]) / s;
  } else if (R[0][0] > R[1][1] && R[0][0] > R[2][2]) {
    let s = Math.sqrt(1 + R[0][0] - R[1][1] - R[2][2]) * 2;
    w = (R[2][1] - R[1][2]) / s; x = 0.25 * s;
    y = (R[0][1] + R[1][0]) / s; z = (R[0][2] + R[2][0]) / s;
  } else if (R[1][1] > R[2][2]) {
    let s = Math.sqrt(1 + R[1][1] - R[0][0] - R[2][2]) * 2;
    w = (R[0][2] - R[2][0]) / s; x = (R[0][1] + R[1][0]) / s;
    y = 0.25 * s; z = (R[1][2] + R[2][1]) / s;
  } else {
    let s = Math.sqrt(1 + R[2][2] - R[0][0] - R[1][1]) * 2;
    w = (R[1][0] - R[0][1]) / s; x = (R[0][2] + R[2][0]) / s;
    y = (R[1][2] + R[2][1]) / s; z = 0.25 * s;
  }
  const n = Math.hypot(w, x, y, z) || 1;
  return [w / n, x / n, y / n, z / n];
}

/* ── cyclic-Jacobi eigensolver for a symmetric matrix (here 4×4). Returns the
      eigenvector of the LARGEST eigenvalue — Horn's optimal quaternion. Converges
      to machine ε; no SVD, no det-correction, so it can never smuggle in a
      reflection. ── */
function jacobiTopEigenvector(Ain, n) {
  const A = Ain.map((r) => r.slice());
  const V = [];
  for (let i = 0; i < n; i++) { V.push(new Array(n).fill(0)); V[i][i] = 1; }
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += A[p][q] * A[p][q];
    if (off < 1e-30) break;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(A[p][q]) < 1e-300) continue;
        const app = A[p][p], aqq = A[q][q], apq = A[p][q];
        const phi = 0.5 * Math.atan2(2 * apq, aqq - app);
        const c = Math.cos(phi), s = Math.sin(phi);
        for (let k = 0; k < n; k++) {
          const akp = A[k][p], akq = A[k][q];
          A[k][p] = c * akp - s * akq;
          A[k][q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = A[p][k], aqk = A[q][k];
          A[p][k] = c * apk - s * aqk;
          A[q][k] = s * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = V[k][p], vkq = V[k][q];
          V[k][p] = c * vkp - s * vkq;
          V[k][q] = s * vkp + c * vkq;
        }
      }
    }
  }
  let best = 0;
  for (let i = 1; i < n; i++) if (A[i][i] > A[best][best]) best = i;
  const vec = [];
  for (let i = 0; i < n; i++) vec.push(V[i][best]);
  return vec;
}

/* ── HORN'S QUATERNION KABSCH. Given corresponded, centred point sets P (fixed
      target) and Q (mobile), return the PROPER rotation R minimising Σ|P_i − R Q_i|².
      Builds the correlation S_ij = Σ P_i Q_j and Horn's symmetric 4×4 N; its top
      eigenvector is the optimal unit quaternion. Robust to degenerate covariance. ── */
function hornKabsch(P, Q) {
  let Sxx = 0, Sxy = 0, Sxz = 0, Syx = 0, Syy = 0, Syz = 0, Szx = 0, Szy = 0, Szz = 0;
  // S_ij = Σ Q_i P_j — mobile (to-be-rotated) outer target. This orientation makes
  // Horn's top eigenvector the quaternion that rotates Q ONTO P (verified: a known
  // rotation is recovered to machine-ε, and the analytic min beats every sampled turn).
  for (let i = 0; i < P.length; i++) {
    const p = P[i], q = Q[i];
    Sxx += q[0] * p[0]; Sxy += q[0] * p[1]; Sxz += q[0] * p[2];
    Syx += q[1] * p[0]; Syy += q[1] * p[1]; Syz += q[1] * p[2];
    Szx += q[2] * p[0]; Szy += q[2] * p[1]; Szz += q[2] * p[2];
  }
  const N = [
    [Sxx + Syy + Szz, Syz - Szy,        Szx - Sxz,        Sxy - Syx],
    [Syz - Szy,       Sxx - Syy - Szz,  Sxy + Syx,        Szx + Sxz],
    [Szx - Sxz,       Sxy + Syx,        -Sxx + Syy - Szz, Syz + Szy],
    [Sxy - Syx,       Szx + Sxz,        Syz + Szy,        -Sxx - Syy + Szz],
  ];
  const q = jacobiTopEigenvector(N, 4);
  const nq = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  return quatToMat([q[0] / nq, q[1] / nq, q[2] / nq, q[3] / nq]);
}

/* ── the atoms you may relabel: every product of within-group permutations. A
      group is a set of interchangeable atom indices (identical element AND role).
      CHFClBr → all singletons → 1 correspondence; CH2Cl2 → the H-pair and Cl-pair
      each contribute 2! → 4. Each correspondence c maps MOBILE atom i → FIXED atom
      c[i]. ── */
function permsOf(list) {
  if (list.length <= 1) return [list.slice()];
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const rest = list.slice(0, i).concat(list.slice(i + 1));
    for (const sub of permsOf(rest)) out.push([list[i]].concat(sub));
  }
  return out;
}
function correspondences(nAtoms, groups) {
  const per = groups.map((g) => {
    const orders = permsOf(g);            // permutations of this group's fixed indices
    return orders.map((ord) => g.map((srcIdx, k) => [srcIdx, ord[k]]));  // [mobileIdx, fixedIdx]
  });
  let acc = [[]];
  for (const choices of per) {
    const next = [];
    for (const a of acc) for (const ch of choices) next.push(a.concat(ch));
    acc = next;
  }
  return acc.map((pairs) => {
    const c = new Array(nAtoms).fill(-1);
    for (const [mob, fix] of pairs) c[mob] = fix;
    return c;
  });
}

/* residuals + rmsd for a GIVEN rotation R and correspondence c:
   residual[i] = fixed[c[i]] − R·mobile[i]  (world units, in the FIXED frame). */
function residualsFor(fixedP, mobileP, R, c) {
  const res = [];
  let sum = 0;
  for (let i = 0; i < mobileP.length; i++) {
    const rq = matVec(R, mobileP[i]);
    const d = v_sub(fixedP[c[i]], rq);
    res[i] = d; sum += v_dot(d, d);
  }
  return { residual: res, rmsd: Math.sqrt(sum / mobileP.length) };
}

/* ── bestAlignment(fixed, mobile, groups) → {R, perm, rmsd, perAtomResidual}
      The chirality measure: min over (proper rotation × element-preserving
      relabelling) of best-fit RMSD. One Horn-Kabsch per correspondence; keep the
      lowest. `perm` is the winning correspondence (mobile i → fixed perm[i]);
      `perAtomResidual[i]` is the leftover gap on mobile atom i (fixed[perm[i]] −
      R·mobile[i]) — the tether the scene draws. ── */
function bestAlignment(fixed, mobile, groups) {
  const F = centred(fixed), M = centred(mobile);
  const P = F.map((a) => a.p), Qall = M.map((a) => a.p);
  const cs = correspondences(M.length, groups || M.map((_, i) => [i]));
  let best = null;
  for (const c of cs) {
    const Pc = c.map((fi) => P[fi]);                     // fixed points, in mobile order
    const R = hornKabsch(Pc, Qall);
    const { residual, rmsd } = residualsFor(P, Qall, R, c);
    if (!best || rmsd < best.rmsd) best = { R, perm: c, rmsd, perAtomResidual: residual };
  }
  return best;
}

/* ── rmsdAtRotation(fixed, mobile, R, groups) → scalar. The visitor's LIVE-pose
      readout: how far the object sits from seated at the CURRENT tumble R. Still
      minimises over relabelling (so a swap can't be blamed on the wrong pairing),
      but NOT over rotation — so it is always ≥ the bestAlignment floor. ── */
function rmsdAtRotation(fixed, mobile, R, groups) {
  const F = centred(fixed), M = centred(mobile);
  const P = F.map((a) => a.p), Q = M.map((a) => a.p);
  const cs = correspondences(M.length, groups || M.map((_, i) => [i]));
  let bestR = Infinity;
  for (const c of cs) {
    const { rmsd } = residualsFor(P, Q, R, c);
    if (rmsd < bestR) bestR = rmsd;
  }
  return bestR;
}

/* ── THE SUBJECTS. Tetrahedral C at the origin; substituents along the four
      regular-tetrahedron unit directions × real bond lengths (Å). The mirror is
      x → −x. Everything is centroid-centred here, once, so the scene and the math
      never disagree about where an atom is. ── */
const TET = 1 / Math.sqrt(3);
const DIRS = [[TET, TET, TET], [TET, -TET, -TET], [-TET, TET, -TET], [-TET, -TET, TET]];
const BOND_L = { H: 1.09, F: 1.39, Cl: 1.77, Br: 1.94 };
function tetMol(spec, mirror) {
  const s = mirror ? -1 : 1;
  const atoms = [{ el: 'C', p: [0, 0, 0] }];
  for (let i = 0; i < spec.length; i++) {
    const el = spec[i], d = DIRS[i], L = BOND_L[el];
    atoms.push({ el, p: [s * d[0] * L, d[1] * L, d[2] * L] });
  }
  return centred(atoms);
}
const BONDS = [[0, 1], [0, 2], [0, 3], [0, 4]];   // C to each substituent

const MOLECULES = {
  // CHFClBr — four distinct substituents ⇒ 1 correspondence; the enantiomers
  // sit ~1.25 Å apart and NO turn closes the gap.
  pair: {
    A: tetMol(['H', 'F', 'Cl', 'Br'], false),
    B: tetMol(['H', 'F', 'Cl', 'Br'], true),
    groups: [[0], [1], [2], [3], [4]],
    bonds: BONDS,
    name: 'CHFClBr', label: 'the chiral pair',
  },
  // CH2Cl2 — the achiral control; the H-pair and Cl-pair each relabel (2!·2!=4),
  // and a proper turn + the right swap seats it flush at ~machine-ε.
  control: {
    A: tetMol(['H', 'H', 'Cl', 'Cl'], false),
    B: tetMol(['H', 'H', 'Cl', 'Cl'], true),
    groups: [[0], [1, 2], [3, 4]],
    bonds: BONDS,
    name: 'CH2Cl2', label: 'the achiral control',
  },
};

// ===== END LEFT-HANDED CORE =====

export {
  EPS, CONTROL_TOL, MOLECULES,
  bestAlignment, rmsdAtRotation,
  hornKabsch, jacobiTopEigenvector, correspondences, residualsFor,
  centred, centroid, quatToMat, matToQuat, matVec, matMul, det3, IDENT3,
  v_sub, v_add, v_dot, v_len,
};
