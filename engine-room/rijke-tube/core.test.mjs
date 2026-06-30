// ============================================================================
//  The Rijke Tube · CORE — the Node twin (falsifiability harness)
//
//  Runs the pinned starred falsifiers to machine ε, plus Node-only exhaustive
//  sweeps, plus the BYTE-TWIN PARITY grep: the slice of core.mjs between the
//  RIJKE-CORE sentinels must appear byte-identically inside the page's inlined
//  twin in index.html. If the page and the module ever drift, this fails.
//
//  Run:  node engine-room/rijke-tube/core.test.mjs
// ============================================================================
import { C_AIR, TOL, fundamentalHz, growthRate, sings, targetAmp } from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
let pass = 0, total = 0;
const log = [];
function check(name, ok, info){
  total++; if (ok) pass++;
  log.push((ok ? '  ✓ ' : '  ✗ ') + name + (info ? '  ·  ' + info : ''));
}

// deterministic xorshift PRNG so the sweep is reproducible
let _s = 0x9E3779B9 >>> 0;
const rnd = () => { _s ^= _s << 13; _s ^= _s >>> 17; _s ^= _s << 5; _s >>>= 0; return _s / 4294967296; };
const pick = (lo, hi) => lo + (hi - lo) * rnd();

// ── (1)★ LOWER HALF SINGS — γ>0 strictly for all u∈(0,½), Q>0 ───────────────
{
  let allPos = true, worst = '';
  const N = 4000;
  for (let k = 0; k < N; k++){
    const u = pick(0.001, 0.499), Q = pick(0.05, 1);
    const g = growthRate(u, Q);
    if (!(g > TOL)){ allPos = false; worst = `u=${u.toFixed(4)} Q=${Q.toFixed(3)} γ=${g.toExponential(3)}`; break; }
  }
  check(`(1)★ lower half (0<u<½), Q>0 ⇒ γ>0 strictly — the pipe sings (${N} samples)`,
    allPos, allPos ? 'every lower-half config sang' : 'FAIL ' + worst);
}

// ── (2)★ UPPER HALF SILENT — γ<0 strictly for all u∈(½,1), Q>0 ──────────────
{
  let allNeg = true, worst = '';
  const N = 4000;
  for (let k = 0; k < N; k++){
    const u = pick(0.501, 0.999), Q = pick(0.05, 1);
    const g = growthRate(u, Q);
    if (!(g < -TOL)){ allNeg = false; worst = `u=${u.toFixed(4)} γ=${g.toExponential(3)}`; break; }
  }
  check(`(2)★ upper half (½<u<1), Q>0 ⇒ γ<0 strictly — the voice dies (${N} samples)`,
    allNeg, allNeg ? 'every upper-half config was silent' : 'FAIL ' + worst);
}

// ── (3)★ THE MIDPOINT IS EXACTLY DEAD — γ(½,Q) === 0 bit-exact for ANY Q ─────
//   This is the snap's whole reason to exist: Math.sin(π) ≠ 0, so the naive
//   formula returns ~1e-16. We assert STRICT === 0, not merely |γ|≤TOL.
{
  let exact = true, worst = '', libErr = Math.sin(2 * Math.PI * 0.5);
  for (let k = 0; k < 2000; k++){
    const Q = pick(0, 1e6);                    // any finite heat, incl. huge
    const g = growthRate(0.5, Q);
    if (g !== 0){ exact = false; worst = `Q=${Q.toFixed(3)} γ=${g}`; break; }
  }
  // also pin the integer Q edge and a couple of literals
  exact = exact && growthRate(0.5, 1) === 0 && growthRate(0.5, 0.7) === 0 && growthRate(0.5, 42) === 0;
  check('(3)★ midpoint u=½ ⇒ γ === 0 EXACTLY (bit-exact) for any Q — the snap holds',
    exact, exact ? `library Math.sin(π)=${libErr.toExponential(2)}≠0, but γ(½)=0 exactly` : 'FAIL ' + worst);
}

// ── (4)★ NEGATIVE CONTROL — Q=0 ⇒ γ≤0 AND amp=0 everywhere; voice dies ───────
{
  let allZero = true, ampZero = true, anySings = false, worst = '';
  for (let k = 0; k < 3000; k++){
    const u = pick(0.001, 0.999);
    const g = growthRate(u, 0);
    if (g !== 0){ allZero = false; worst = `u=${u.toFixed(4)} γ=${g}`; }
    if (targetAmp(u, 0) !== 0){ ampZero = false; worst = `u=${u.toFixed(4)} amp≠0`; }
    if (sings(u, 0)) anySings = true;
  }
  // also a strict ≤0 sweep (every u, every regime) with Q=0
  check('(4)★ neg-control: Q=0 ⇒ γ=0 & targetAmp=0 ∀u & sings()=false — heat AND confinement required',
    allZero && ampZero && !anySings, (allZero && ampZero) ? 'no heat ⇒ no voice anywhere (the saturated amp decays to silence)' : 'FAIL ' + worst);
}

// ── (5)★ ANTISYMMETRY — γ(u) = −γ(1−u) to machine ε (upper half mirrors lower)
{
  let sym = true, worst = '', worstΔ = 0;
  const N = 4000;
  for (let k = 0; k < N; k++){
    const u = pick(0.001, 0.499), Q = pick(0.05, 1);
    const a = growthRate(u, Q), b = growthRate(1 - u, Q);
    const d = Math.abs(a + b);
    if (d > 1e-12){ sym = false; worst = `u=${u.toFixed(4)} Δ=${d.toExponential(3)}`; break; }
    if (d > worstΔ) worstΔ = d;
  }
  // and the sign flip across the midpoint: γ(½−ε)>0, γ(½+ε)<0
  const eps = 1e-4, below = growthRate(0.5 - eps, 0.6), above = growthRate(0.5 + eps, 0.6);
  const flip = below > 0 && above < 0;
  check(`(5)★ antisymmetry γ(u)=−γ(1−u) to machine ε (${N} samples) AND sign flips across ½`,
    sym && flip, (sym && flip) ? `worst |γ(u)+γ(1−u)|=${worstΔ.toExponential(2)}; γ(½−ε)>0>γ(½+ε)` : 'FAIL ' + worst);
}

// ── (6)★ f = c/2L STRICTLY DECREASING in L — a taller pipe hums lower ────────
{
  let mono = true, worst = '', prev = Infinity;
  const STEPS = 600;
  for (let i = 0; i <= STEPS; i++){
    const L = 0.40 + i * (1.5 / STEPS);        // 0.40 .. 1.90 m
    const f = fundamentalHz(L);
    if (!(f < prev)){ mono = false; worst = `L=${L.toFixed(4)} f=${f.toFixed(3)}`; break; }
    prev = f;
  }
  // pin the two design anchors the page quotes (171.5 Hz @1m, 95.3 Hz @1.8m)
  const f1 = fundamentalHz(1.0), f18 = fundamentalHz(1.8);
  const anchorsOk = Math.abs(f1 - 171.5) < 0.1 && Math.abs(f18 - 95.27) < 0.1;
  check(`(6)★ f=c/2L strictly decreasing in L over ${STEPS + 1} steps — a taller pipe hums lower`,
    mono && anchorsOk, (mono && anchorsOk) ? `f(1m)=${f1.toFixed(1)} Hz, f(1.8m)=${f18.toFixed(1)} Hz` : 'FAIL ' + worst);
}

// ── (7) targetAmp: 0 exactly off the singing zone, in (0,1] when singing ─────
{
  const aMid = targetAmp(0.5, 0.9), aUp = targetAmp(0.7, 0.9), aLow = targetAmp(0.25, 0.9), aNoQ = targetAmp(0.25, 0);
  const ok = aMid === 0 && aUp === 0 && aNoQ === 0 && aLow > 0 && aLow <= 1;
  // also: amp bounded in [0,1] over a full random sweep
  let bounded = true;
  for (let k = 0; k < 2000; k++){ const a = targetAmp(pick(0.001, 0.999), pick(0, 1)); if (!(a >= 0 && a <= 1)){ bounded = false; break; } }
  check('(7) targetAmp: 0 at midpoint/upper/no-heat, in (0,1] when singing, bounded [0,1] over sweep',
    ok && bounded, `low=${aLow.toFixed(3)}, mid=${aMid}, up=${aUp}, noQ=${aNoQ}`);
}

// ── (8) THE CREST — the loudest hold is u≈¼ at full heat (the trial's answer) ─
{
  let best = -1, bu = 0;
  for (let q = 1; q < 2000; q++){ const u = q / 2000, a = targetAmp(u, 1); if (a > best){ best = a; bu = u; } }
  check('(8) loudest hold at full heat sits at u≈¼ — the crest of sin(2πu) (the Stoker’s Trial answer)',
    Math.abs(bu - 0.25) < 0.005, `argmax targetAmp ⇒ u=${bu.toFixed(4)}, amp=${best.toFixed(3)}`);
}

// ── (9) PURITY / SOURCE-DISJOINTNESS — growthRate references no DOM/audio/pipe ─
//   The growth rate is pure math: it must not read the DOM, the AudioContext,
//   or even the pipe length. So the SAME γ feeds eye, ear & verdict.
{
  const src = growthRate.toString();
  const forbidden = ['document', 'window', 'AudioContext', 'canvas', 'localStorage', 'C_AIR', 'fundamentalHz'];
  const leaked = forbidden.filter(t => src.includes(t));
  // determinism: same (u,Q) ⇒ same γ
  const det = growthRate(0.3, 0.7) === growthRate(0.3, 0.7);
  check('(9) source purity: growthRate() references no DOM/audio/pipe symbols & is deterministic',
    leaked.length === 0 && det, leaked.length === 0 ? 'pure: only u and Q' : 'LEAKED ' + leaked.join(','));
}

// ── (10)★ BYTE-TWIN PARITY — the inline index.html slice === the module slice ─
{
  const modSrc = readFileSync(join(HERE, 'core.mjs'), 'utf8');
  const pageSrc = readFileSync(join(HERE, 'index.html'), 'utf8');
  const BEGIN = '// ===== RIJKE-CORE (byte-twin of core.mjs) BEGIN =====';
  const END   = '// ===== RIJKE-CORE (byte-twin of core.mjs) END =====';
  function slice(src){
    const a = src.indexOf(BEGIN), b = src.indexOf(END);
    if (a < 0 || b < 0) return null;
    return src.slice(a + BEGIN.length, b).trim();
  }
  const modSlice = slice(modSrc), pageSlice = slice(pageSrc);
  const ok = modSlice != null && pageSlice != null && modSlice === pageSlice;
  let info = '';
  if (!ok){
    if (modSlice == null) info = 'module sentinels not found';
    else if (pageSlice == null) info = 'page sentinels not found';
    else info = `slices differ (mod ${modSlice.length}B vs page ${pageSlice.length}B)`;
  } else info = `${modSlice.length} bytes byte-identical`;
  check('(10)★ inline index.html RIJKE-CORE slice === core.mjs slice (byte-for-byte)', ok, info);
}

// ── report ───────────────────────────────────────────────────────────────────
console.log('\n  The Rijke Tube · core — Node twin\n');
for (const line of log) console.log(line);
const green = pass === total;
console.log('\n  ' + pass + '/' + total + (green ? '  ✓ ALL GREEN' : '  ✗ FAILURES') + '\n');
process.exit(green ? 0 : 1);
