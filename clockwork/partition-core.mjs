// ============================================================================
//  The Partition Function — one Z, two temperatures (CORE)
//  Pure, dependency-free EXCEPT for ONE real cross-wing import: softmax (and its
//  three companions) come straight from ./core.mjs, the Temperature Dial's core.
//  That import is the whole point — this bench does NOT re-derive the law, it
//  CALLS it. Identical code is inlined into partition.html (a byte-twin between
//  sentinels); this file is the Node-testable twin (the falsifiability harness
//  runs against it, re-extracts the inlined page slice, and proves byte-parity).
//
//  THE WING. Clockwork Automata — the wing about the maker. Its first bench, the
//  Temperature Dial, proved that picking a token is softmax over logits at a
//  temperature T. This bench proves a second, older equation is THE SAME equation.
//
//  THE IDENTITY. A language model turns logits z_i into a distribution by
//
//        p_i(T) = exp(z_i / T) / Σ_j exp(z_j / T)            (softmax)
//
//  A century earlier, statistical mechanics turned a discrete energy spectrum
//  E_n into the probability that a system in contact with a heat bath at
//  temperature kT occupies rung n:
//
//        p_n(kT) = exp(−E_n / kT) / Z,   Z = Σ_j exp(−E_j / kT)   (Gibbs)
//
//  These are the SAME function. Set the logit z_n = −E_n and softmax's
//  denominator literally BECOMES the partition function Z. One dial — here it
//  drives kT over exactly core.T_RANGE, the dial's literal travel — moves both:
//
//   • kT → 0    the distribution SPIKES to the ground state (lowest E_n) — which
//               is exactly the argmax of the logits −E_n. (The Dial's "greedy".)
//   • kT → ∞    the distribution FLATTENS to uniform over the rungs (H → log2 N).
//   • S(kT) = −Σ p ln p is the thermodynamic entropy, and it is the SAME meter
//     the Dial reads in bits: S(nats) = H(bits) · ln 2. One quantity, two names.
//
//  THE BRIDGE CARRIES THE MATH, NOT THE MECHANISM. This is an exact identity
//  between two equations on a frozen discrete spectrum. It is NOT a claim that a
//  language model is a thermodynamic system, nor that tokens are energy levels.
//  The math is identical; the physics is a separate question we do not assert.
//
//  THE FALSE FRIEND (run as a negative control). The Maxwell–Boltzmann SPEED pdf
//  f(v) ∝ √E · exp(−E/kT) looks like the Gibbs law but carries a velocity-space
//  Jacobian (the √E). It is NOT a softmax over a discrete spectrum: it fails the
//  byte-parity gate (it isn't gibbs) and the Z gate (its sum isn't Z), and the
//  √E factor does not wash out even as kT → ∞. The self-test runs it to FAIL.
//
//  THE SPECTRA. Two real ladders, borrowed char-for-char from the Cavern:
//   • boxLevels  — particle in a box,  E_n = n²·π²/2   (cavern/box, n=1..N)
//   • oscLevels  — harmonic oscillator, E_n = ω(n+½)   (cavern/oscillator, n=0..N-1)
//  The identity is spectrum-agnostic: it holds for both, and for a third
//  arbitrary spectrum the test throws in for good measure.
// ============================================================================

// ── THE REAL CROSS-WING IMPORT (the dependency this whole bench is about) ─────
//  softmax, entropyBits, maxEntropyBits, argmax come from the Temperature Dial's
//  core verbatim. We re-export them so partition.html / the page have ONE surface
//  to inline, and so a reader can see in one line that the law is borrowed, not
//  re-typed. partition-core.test.mjs asserts partitionCore.softmax === core.softmax
//  (the SAME function object) to prove this is a code dependency, not a lookalike.
import { softmax, entropyBits, maxEntropyBits, argmax } from './core.mjs';
export { softmax, entropyBits, maxEntropyBits, argmax };

// ── THE DIAL'S RANGE = the Temperature Dial's range, exactly ──────────────────
//  KT_RANGE === core.T_RANGE. The one dial drives kT over this log span, so
//  "one dial, two temperatures" is literal: the same [0.01, 100] travel.
export const KT_RANGE = { LO: 0.01, HI: 100 };   // = core.T_RANGE

// ── THE SPECTRA (borrowed char-for-char from the Cavern) ─────────────────────
//  Particle in a box: E_n = n²·π²/2, n=1..N. (cavern/box: E_closed(n)=n*n*π²/2.)
export function boxLevels(N = 6) {
  const E = [];
  for (let n = 1; n <= N; n++) E.push(n * n * Math.PI * Math.PI / 2);
  return E;
}
//  Harmonic oscillator: E_n = ω(n+½), n=0..N-1. (cavern/oscillator: ω(n+0.5).)
export function oscLevels(N = 6, omega = 1) {
  const E = [];
  for (let n = 0; n < N; n++) E.push(omega * (n + 0.5));
  return E;
}

// ── GIBBS = SOFTMAX OF THE NEGATIVE ENERGIES (it CALLS softmax, never re-derives)
//  p_n(kT) = exp(−E_n/kT) / Σ exp(−E_j/kT) = softmax(−E, kT). One line, one law.
export function gibbs(E, kT) {
  return softmax(E.map(e => -e), kT);
}

// ── THE PARTITION FUNCTION Z, TWO WAYS (they must agree) ──────────────────────
//  (1) directly, the textbook sum.
export function partitionDirect(E, kT) {
  return E.reduce((s, e) => s + Math.exp(-e / kT), 0);
}
//  (2) backed out of softmax's normalized output. softmax's INTERNAL denominator
//  is NOT Z (the stable form subtracts the max before exp, so its raw sum is
//  Z·exp(+max/kT)). But the IDENTITY p_n·Z = exp(−E_n/kT) holds rung-by-rung, so
//  Z = exp(−E_n/kT) / p_n at ANY rung. We pick the best-conditioned rung — the
//  one with the largest p (smallest E, the ground state) — to avoid dividing by a
//  tiny p. This recovers Z from the distribution to ~1e-15 (vs partitionDirect).
export function partitionFromSoftmax(E, kT) {
  const p = gibbs(E, kT);
  let bi = 0, bv = p[0];
  for (let i = 1; i < p.length; i++) if (p[i] > bv) { bv = p[i]; bi = i; }
  return Math.exp(-E[bi] / kT) / p[bi];
}

// ── ENTROPY IN NATS = the Dial's bits × ln 2 (one meter, two units) ───────────
//  S = −Σ p ln p (nats) = (−Σ p log2 p) · ln 2 = entropyBits(p) · ln 2.
export function entropyNats(p) {
  return entropyBits(p) * Math.LN2;
}

// ── THE FALSE FRIEND (a negative control, NEVER the rendered distribution) ────
//  The Maxwell–Boltzmann SPEED pdf is ∝ √E·exp(−E/kT) — the velocity-space
//  Jacobian (√E) is the forgotten factor. Un-normalized on purpose: this is not
//  a distribution and not a softmax; the test normalizes it only to show that
//  even then it ≠ gibbs, and that Σ ≠ Z. The √E does not vanish as kT → ∞.
export function mbSpeedTrap(E, kT) {
  return E.map(e => Math.sqrt(e) * Math.exp(-e / kT));
}
