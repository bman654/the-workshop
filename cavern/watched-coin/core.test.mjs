// ============================================================================
//  THE CAVERN · THE WATCHED COIN — Node twin of the Quantum Zeno core.
//  Run:  node cavern/watched-coin/core.test.mjs
//
//  Proves the Zeno survival law headless. The closed form cos^{2N}(π/2N) is
//  cross-checked against an INDEPENDENT product of N single-peek projectors
//  borrowed from the spin bench (no forked Born math), the limits + neg-control
//  are pinned, the TEETH control is flat-zero, the large-N scaling lands on
//  π²/(4N), and two Node-only guards run on the BUILT page: the BORROWED-CORE
//  parity (the inlined spin slab === ../spin/core.mjs char-for-char) and the
//  anti-circularity grep (no second Born projector outside the two core slabs).
//  process.exit(pass === total ? 0 : 1).
// ============================================================================
import {
  ZAXIS, survivalClosed, survivalSim, flipProb, perPeekSurvival,
  peekAngle, survivalNoCollapse, flipAsymptote, blochVec, pUp,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
let pass = 0, total = 0;
function check(name, cond, info){
  total++;
  if (cond){ pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}
function sliceBetween(text, begin, end){
  const i = text.indexOf(begin), j = text.indexOf(end);
  if (i < 0 || j < 0 || j <= i) return null;
  return text.slice(i + begin.length, j);
}

console.log('\n— Rung (1): TWO ROUTES AGREE — closed cos^{2N}(π/2N) === ∏ pUp(n̂(π/N), ẑ) —');
{
  let worst = 0, worstN = 0;
  for (let N = 1; N <= 200; N++){
    const d = Math.abs(survivalClosed(N) - survivalSim(N));
    if (d > worst){ worst = d; worstN = N; }
  }
  check('|survivalClosed − survivalSim| < 1e-9 over N=1..200 (a cos+pow vs a product of N dot-derived factors)',
        worst < 1e-9, 'max |Δ| = ' + worst.toExponential(2) + ' @N=' + worstN);
}

console.log('\n— Rung (2): THE LIMITS — N=1 full flip, N=2 exactly ¼, monotone up toward 1 —');
{
  // N=1: a single peek taken AFTER the full π turn, still finds it flipped → survive 0,
  // flip 1. (closed survival is 3.7e-33, not literally 0 — assert flipProb by tolerance.)
  check('N=1 → flipProb ≈ 1 within 1e-9 (one peek after a full turn still finds |1⟩)',
        Math.abs(flipProb(1) - 1) < 1e-9, 'flipProb(1) = ' + flipProb(1));
  check('N=2 → survival within 1e-12 of ¼ (sim is exactly 0.25)',
        Math.abs(survivalSim(2) - 0.25) < 1e-12, 'survivalSim(2) = ' + survivalSim(2));
  let inc = true, prev = survivalSim(2);
  for (let N = 3; N <= 200; N++){ const s = survivalSim(N); if (!(s > prev)) inc = false; prev = s; }
  check('survival strictly increasing over N=2..200 (peek more often ⇒ freeze harder)', inc);
  check('large N → survival > 0.99 (N=1000)', survivalSim(1000) > 0.99,
        'survivalSim(1000) = ' + survivalSim(1000).toFixed(6));
}

console.log('\n— Rung (3): NEG-CONTROL — N=0 (stop watching) ⇒ survival 0 exactly, both routes —');
{
  check('survivalClosed(0) === 0 (Object.is)', Object.is(survivalClosed(0), 0));
  check('survivalSim(0) === 0 (Object.is)', Object.is(survivalSim(0), 0));
}

console.log('\n— Rung (4): THE TEETH — same drive + chops, watching removed ⇒ survival flat 0 —');
{
  let teeth = true, simRises = true, prev = -1;
  const Ns = [1, 2, 3, 5, 10, 50, 200];
  for (const N of Ns){
    if (!(survivalNoCollapse(N) < 1e-9)) teeth = false;
    const s = survivalSim(N); if (!(s > prev)) simRises = false; prev = s;
  }
  check('survivalNoCollapse(N) < 1e-9 for N∈{1,2,3,5,10,50,200} (it boils for every N)', teeth,
        'max = ' + Math.max(...Ns.map(survivalNoCollapse)).toExponential(2));
  check('…while survivalSim rises over the same N (the WATCHING, not the chopping, froze it)', simRises);
}

console.log('\n— Rung (5): ASYMPTOTE — the residual flip scales as π²/(4N) —');
{
  const got = flipProb(1000) * 1000, want = (Math.PI * Math.PI) / 4;
  check('|flipProb(1000)·1000 − π²/4| < 0.01', Math.abs(got - want) < 0.01,
        'got ' + got.toFixed(4) + ' vs π²/4 = ' + want.toFixed(4));
}

console.log('\n— Rung (6): ANTI-CIRCULARITY — the page computes the Born ratio ONLY in the two core slabs —');
{
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const CB = '// === CORE BEGIN ===', CE = '// === CORE END ===';
  const ZB = '// === ZENO CORE BEGIN ===', ZE = '// === ZENO CORE END ===';
  const iCB = page.indexOf(CB), iCE = page.indexOf(CE);
  const iZB = page.indexOf(ZB), iZE = page.indexOf(ZE);
  const slabsFound = iCB >= 0 && iCE > iCB && iZB > iCE && iZE > iZB;
  // strip BOTH sentinel regions; what remains is render + the in-page pill only.
  const outsideRaw = slabsFound
    ? page.slice(0, iCB) + page.slice(iCE + CE.length, iZB) + page.slice(iZE + ZE.length)
    : page;
  // Anti-circularity is about EXECUTABLE code, not prose — strip comments first so a
  // borrowed core's HEADER COMMENT (forge inlines spin's whole file, whose doc comment
  // legitimately writes "(1+cosΘ)/2") can't trip the grep. Skips :// so URLs survive.
  const outside = outsideRaw
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  // Forbid a SECOND Born projector in the remaining code. Tuned so it does NOT trip on
  // the hero's render trig (single-power Math.cos/sin for screen projection) or the
  // yank ease (t*t*(3-2*t)): only the cos(…)** / pow(cos(…)) closed forms and any
  // (1+…)/2 half-angle ratio or re-DEFINITION of the borrowed projectors are banned.
  const banned = [
    /Math\.cos\s*\([^;\n]*\)\s*\*\*/,                      // cos(…) ** … closed form
    /Math\.pow\s*\(\s*Math\.cos\s*\(/,                     // pow(cos(…), …) closed form
    /\(\s*1\s*\+[^()]*\)\s*\/\s*2/,                        // a (1 + …)/2 half-angle ratio
    /function\s+pUp\b/, /function\s+blochVec\b/,           // re-defining the borrowed projector
    /function\s+survivalSim\b/, /function\s+survivalClosed\b/,
  ];
  const hit = banned.find((re) => re.test(outside));
  check('the page COMPUTES the Zeno/Born ratio only inside the CORE + ZENO CORE slabs',
        slabsFound && !hit,
        slabsFound ? (hit ? 'LEAK: ' + hit : 'no second projector outside the slabs')
                   : 'slabs not found in built page (run forge)');
}

console.log('\n— Rung (7): BORROWED-CORE PARITY — the inlined spin slab === ../spin/core.mjs —');
{
  const CB = '// === CORE BEGIN ===', CE = '// === CORE END ===';
  const spin = readFileSync(join(__dir, '..', 'spin', 'core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const spinSlice = sliceBetween(spin, CB, CE);
  const pageSlice = sliceBetween(page, CB, CE);
  check("the page's borrowed SPIN CORE === cavern/spin/core.mjs, char-for-char",
        spinSlice != null && pageSlice != null && spinSlice === pageSlice,
        spinSlice === pageSlice ? 'slice ' + (pageSlice ? pageSlice.length : 0) + ' chars identical'
          : 'DRIFT (spin ' + (spinSlice && spinSlice.length) + ' vs page ' + (pageSlice && pageSlice.length) + ')');
}

console.log('\n—— The Cavern · The Watched Coin · Node twin: ' + pass + '/' + total + ' ——\n');
process.exit(pass === total ? 0 : 1);
