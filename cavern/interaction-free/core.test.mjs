#!/usr/bin/env node
// ============================================================================
//  THE CAVERN · THE BOMB THAT TELLS ON ITSELF — Node twin of the bomb-tester core.
//  Run:  node cavern/interaction-free/core.test.mjs
//
//  Proves interaction-free measurement headless, to machine epsilon:
//   layer 1 — the SAME in-page battery runBombSelfTest() the page pill renders
//             (no-bomb ⇒ P(bright)=1 ∧ P(dark)=0; live-bomb ⇒ ½/¼/¼; P(dark)>0
//             IFF a bomb; Σp=1; arm-symmetric).
//   layer 2 — node-only deep cross-checks: BS unitarity (BS†BS=I), the ¼/¼/½
//             split derived a SECOND way from raw amplitudes, an ENSEMBLE of
//             fired photons converging within a binomial band, determinism, the
//             mulberry32 literal pin, and the single-source grep (the page
//             COMPUTES propagate/beamSplitter only inside the sentinels).
//
//  HONESTY: every probability claim is an EXACT equality to machine ε on
//  propagate() (a unitary computation, not an RNG count). The ensemble leg is the
//  ONLY statistical leg and is a binomial BAND, never a per-draw equality;
//  determinism is the one equality asserted on the seeded sampler.
//  Byte-parity of the inlined core is the forge's job (`forge --check` is the gate,
//  arctic-circle / brazil-nut-box convention) — no manual byte-slice leg here.
//  process.exit(pass === total ? 0 : 1).
// ============================================================================
import {
  cadd, cmul, cabs2, C_I, C_ZERO, C_ONE,
  beamSplitter, mirrors, bombMeasure, propagate,
  FATE_BRIGHT, FATE_DARK, FATE_BOOM,
  mulberry32, firePhoton, runEnsemble, runBombSelfTest,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
let pass = 0, total = 0;
function check(name, cond, info){
  total++;
  if (cond){ pass++; console.log('  \x1b[32m✓\x1b[0m ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  \x1b[31m✗\x1b[0m ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\n  The Bomb That Tells On Itself — core.test.mjs\n  ' + '─'.repeat(62));

// ── Layer 1: the SAME battery the page pill renders (single source of truth) ──
console.log('\n  layer 1 · the in-page self-test battery (verbatim):');
const battery = runBombSelfTest();
for (const l of battery.lines) check(l.name, l.ok, l.detail);
check('battery reports ' + battery.pass + '/' + battery.total + ' green (≥7 legs)',
      battery.fails.length === 0 && battery.total >= 7, battery.pass + '/' + battery.total);

// ── Layer 2: node-only deep cross-checks ──
console.log('\n  layer 2 · node-only deep cross-checks:');
const EPS = 1e-12;

// (A) BS is UNITARY: BS†BS = I. Feeding the two basis inputs and reading the
//     output columns gives the BS matrix; its columns must be orthonormal.
{
  const colU = beamSplitter([C_ONE, C_ZERO]);   // BS|U⟩ = column 0
  const colL = beamSplitter([C_ZERO, C_ONE]);   // BS|L⟩ = column 1
  const normU = cabs2(colU[0]) + cabs2(colU[1]);
  const normL = cabs2(colL[0]) + cabs2(colL[1]);
  // ⟨colU|colL⟩ = conj(colU)·colL  (real + imag parts both ~0)
  const ipRe = colU[0][0]*colL[0][0] + colU[0][1]*colL[0][1] + colU[1][0]*colL[1][0] + colU[1][1]*colL[1][1];
  const ipIm = colU[0][0]*colL[0][1] - colU[0][1]*colL[0][0] + colU[1][0]*colL[1][1] - colU[1][1]*colL[1][0];
  check('beam-splitter is UNITARY: columns orthonormal (BS†BS = I) to machine ε',
        Math.abs(normU - 1) < EPS && Math.abs(normL - 1) < EPS && Math.abs(ipRe) < EPS && Math.abs(ipIm) < EPS,
        '‖col‖²=' + normU.toFixed(15) + '/' + normL.toFixed(15) + ' · ⟨U|L⟩=' + ipRe.toExponential(1));
}

// (B) The ¼/¼/½ split derived a SECOND way, straight from the mid-rig amplitudes
//     (NOT via propagate's branching path) — the live-bomb numbers are no fluke.
{
  const afterBS1 = beamSplitter([C_ONE, C_ZERO]);     // [1/√2, i/√2]
  const pBoom = cabs2(afterBS1[0]);                    // amp in the bomb (upper) arm
  const m = bombMeasure(afterBS1, 0);
  const out = beamSplitter(mirrors(m.survived));       // surviving photon → BS2
  const pBright = m.pSurv * cabs2(out[1]);
  const pDark = m.pSurv * cabs2(out[0]);
  check('SECOND derivation from raw amplitudes ⇒ boom=½, bright=¼, dark=¼ to machine ε',
        Math.abs(pBoom - 0.5) < EPS && Math.abs(pBright - 0.25) < EPS && Math.abs(pDark - 0.25) < EPS,
        'boom=' + pBoom.toFixed(12) + ' bright=' + pBright.toFixed(12) + ' dark=' + pDark.toFixed(12));
}

// (C) STAGE-WISE conservation: |amplitude|² sums to 1 after BS1, after the bomb
//     measurement (boom + survive weights), and after BS2 — no leaks at any stage.
{
  const afterBS1 = beamSplitter([C_ONE, C_ZERO]);
  const sumBS1 = cabs2(afterBS1[0]) + cabs2(afterBS1[1]);
  const m = bombMeasure(afterBS1, 0);
  const sumMeasure = m.pBoom + m.pSurv;
  const afterBS2 = beamSplitter(mirrors(m.survived));
  const sumBS2 = cabs2(afterBS2[0]) + cabs2(afterBS2[1]);     // conditional norm = 1
  check('Σ|amp|² = 1 at EVERY stage: BS1 split · bomb collapse · BS2 recombine',
        Math.abs(sumBS1 - 1) < EPS && Math.abs(sumMeasure - 1) < EPS && Math.abs(sumBS2 - 1) < EPS,
        'BS1=' + sumBS1.toFixed(15) + ' collapse=' + sumMeasure.toFixed(15) + ' BS2=' + sumBS2.toFixed(15));
}

// (D) ENSEMBLE of fired photons converges to propagate() within a binomial band.
//     The fates EMERGE from firing; tallies must track the exact probabilities.
{
  const N = 400000, SEED = 0x4E1A0001;
  const cfgs = [
    { label: 'no bomb', cfg: { bomb: false } },
    { label: 'bomb upper', cfg: { bomb: true, bombArm: 0 } },
    { label: 'bomb lower', cfg: { bomb: true, bombArm: 1 } },
  ];
  let allInBand = true, worstZ = 0;
  for (const { label, cfg } of cfgs){
    const e = runEnsemble(cfg, N, SEED);
    const p = propagate(cfg);
    for (const [emp, exact] of [[e.bright, p.pBright], [e.dark, p.pDark], [e.boom, p.pBoom]]){
      if (exact === 0 || exact === 1){
        if (Math.abs(emp - exact) > 0.001) allInBand = false;     // a hard-zero/one channel
      } else {
        const sigma = Math.sqrt(exact * (1 - exact) / N);
        const z = Math.abs(emp - exact) / sigma;
        if (z > 4.5) allInBand = false;
        worstZ = Math.max(worstZ, z);
      }
    }
  }
  check('ensemble (' + N.toLocaleString() + ' fired) converges to propagate() within ±4.5σ across 3 configs',
        allInBand, 'worst |emp−exact|/σ = ' + worstZ.toFixed(2) + 'σ');
}

// (E) DETERMINISM: same seed → byte-identical tallies twice.
{
  const cfg = { bomb: true, bombArm: 0 }, N = 60000, SEED = 0x4E1A0042;
  const a = runEnsemble(cfg, N, SEED), b = runEnsemble(cfg, N, SEED);
  check('same seed → byte-identical tallies (determinism)',
        a.countBright === b.countBright && a.countDark === b.countDark && a.countBoom === b.countBoom,
        'bright/dark/boom = ' + a.countBright + '/' + a.countDark + '/' + a.countBoom + ' both runs');
}

// (F) THE NO-BOMB DARK PORT NEVER FIRES — across a huge ensemble, zero dark clicks
//     (the false-positive rate is 0 in PRACTICE, not just in the closed form).
{
  const e = runEnsemble({ bomb: false }, 1000000, 0x4E1A0777);
  check('no-bomb: ZERO dark clicks over 1,000,000 fired photons (FP rate 0 in practice)',
        e.countDark === 0 && e.countBoom === 0 && e.countBright === 1000000,
        'dark=' + e.countDark + ' boom=' + e.countBoom + ' bright=' + e.countBright);
}

// (G) mulberry32 literal pin — the PRNG (the byte-twin idiom) can't drift.
{
  const firstDraw = mulberry32(0x4E1A0001)();
  check('mulberry32(0x4E1A0001) first draw is the pinned literal (PRNG can’t drift)',
        Object.is(firstDraw, 0.05391924059949815), 'first draw = ' + firstDraw);
}

// (H) SINGLE-SOURCE GREP — the page COMPUTES the physics only inside the sentinels.
//     (Byte-parity is forge's job; this forbids a SECOND beamSplitter/propagate
//      outside the sentinels that could silently diverge from the proven core.)
{
  const BEGIN = '// === CORE BEGIN ===';
  const END = '// === CORE END ===';
  let page;
  try { page = readFileSync(join(__dir, 'index.html'), 'utf8'); }
  catch { page = null; }
  if (page == null){
    check('single-source grep — index.html present', false, 'index.html not found (forge it first)');
  } else {
    const i = page.indexOf(BEGIN), j = page.indexOf(END);
    const outside = i >= 0 && j >= 0 ? page.slice(0, i) + page.slice(j) : page;
    const forbid = [
      [/function\s+beamSplitter\b/, 'a second beamSplitter()'],
      [/function\s+propagate\b/, 'a second propagate()'],
      [/function\s+bombMeasure\b/, 'a second bombMeasure()'],
    ];
    const hits = forbid.filter(f => f[0].test(outside)).map(f => f[1]);
    check('outside the sentinels: NO second derivation of the physics (page may DISPLAY, never re-COMPUTE)',
          i >= 0 && j >= 0 && hits.length === 0,
          hits.length ? 'FOUND: ' + hits.join(' · ') : 'clean — the core is the sole authority');
  }
}

console.log('\n  —— The Cavern · The Bomb That Tells On Itself · Node twin: ' + pass + '/' + total + ' ——\n');
process.exit(pass === total ? 0 : 1);
