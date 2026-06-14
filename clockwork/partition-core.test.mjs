// ============================================================================
//  Node-side falsifiability harness for The Partition Function.
//  Proves the IDENTITY softmax(−E,kT) == the Gibbs/canonical law on a discrete
//  spectrum, to machine precision, over a 1000-rung geometric kT∈[0.01,100] sweep
//  on BOTH the particle-in-a-box and harmonic-oscillator ladders. Then it
//  re-extracts the inlined core from partition.html and proves it is byte-for-byte
//  the SAME core (parity), AND that the MODULE's softmax is the SAME function
//  object as core.softmax (the real cross-wing dependency, not a lookalike).
//  Run:  node partition-core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  softmax, entropyBits, maxEntropyBits, argmax,
  KT_RANGE, boxLevels, oscLevels, gibbs,
  partitionDirect, partitionFromSoftmax, entropyNats, mbSpeedTrap,
} from './partition-core.mjs';
import * as partitionCore from './partition-core.mjs';
import * as core from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));

let pass = 0, total = 0;
const ok = (name, cond, detail = '') => {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (detail ? '  ·  ' + detail : '')); }
  else { console.log('  ✗ ' + name + (detail ? '  ·  ' + detail : '')); }
};

console.log('The Partition Function — partition-core.test.mjs\n');

// ── the 1000-rung geometric kT sweep across the PROVEN range, on both ladders ──
const SWEEP = 1000;
const BOX = boxLevels(6), OSC = oscLevels(6);
const loL = Math.log10(KT_RANGE.LO), hiL = Math.log10(KT_RANGE.HI);
const kTs = [];
for (let i = 0; i < SWEEP; i++) kTs.push(Math.pow(10, loL + (i / (SWEEP - 1)) * (hiL - loL)));
const SPECTRA = [['box', BOX], ['osc', OSC]];

// ── #1. IMPORT, NOT RE-DERIVE ────────────────────────────────────────────────
//  gibbs(E,kT) is byte-for-byte softmax(−E,kT) at every rung over the full sweep
//  × both spectra; AND the module's softmax is the SAME function object as
//  core.softmax (a real import, not a re-typed lookalike).
console.log('— #1 IMPORT-not-rederive: gibbs === softmax(−E,kT), and softmax IS core.softmax —');
{
  let maxByteFail = 0, worst = '';
  for (const [name, E] of SPECTRA) {
    const negE = E.map(e => -e);
    for (const kT of kTs) {
      const g = gibbs(E, kT);
      const ref = softmax(negE, kT);
      if (!g.every((v, i) => v === ref[i])) { maxByteFail++; worst = `${name}@kT=${kT}`; }
    }
  }
  ok('#1a gibbs(E,kT) is byte-for-byte softmax(−E,kT) over 1000 rungs × both spectra (===, not ≈)',
    maxByteFail === 0, maxByteFail === 0 ? `0 mismatches in ${SWEEP * 2} comparisons` : `${maxByteFail} mismatches (${worst})`);
  ok('#1b the imported softmax IS the same function object as core.softmax (real cross-wing dependency)',
    partitionCore.softmax === core.softmax && softmax === core.softmax,
    `partitionCore.softmax === core.softmax → ${partitionCore.softmax === core.softmax}`);
}

// ── #2. Z TWO WAYS ───────────────────────────────────────────────────────────
//  partitionDirect and partitionFromSoftmax agree to ~1e-15; and the rung-wise
//  identity p_n·Z = exp(−E_n/kT) holds to ~1e-24 (using the direct Z).
console.log('\n— #2 Z two ways: direct == backed-out-of-softmax; p·Z = exp(−E/kT) rung-wise —');
{
  let maxZErr = 0, maxRung = 0, zw = '', rw = '';
  for (const [name, E] of SPECTRA) {
    for (const kT of kTs) {
      const Zd = partitionDirect(E, kT), Zs = partitionFromSoftmax(E, kT);
      const d = Math.abs(Zd - Zs); if (d > maxZErr) { maxZErr = d; zw = `${name}@kT=${kT.toFixed(3)}`; }
      const p = gibbs(E, kT);
      for (let k = 0; k < E.length; k++) {
        const r = Math.abs(p[k] * Zd - Math.exp(-E[k] / kT));
        if (r > maxRung) { maxRung = r; rw = `${name}@kT=${kT.toFixed(3)},n=${k}`; }
      }
    }
  }
  ok('#2a partitionDirect == partitionFromSoftmax to ≤1e-12 (the softmax denominator IS Z, backed out at the ground rung)',
    maxZErr <= 1e-12, `max|Zd−Zs|=${maxZErr.toExponential(3)} (${zw})`);
  ok('#2b rung-wise p_n·Z = exp(−E_n/kT) to ≤1e-12 over the full sweep × both spectra',
    maxRung <= 1e-12, `max|p·Z−exp(−E/kT)|=${maxRung.toExponential(3)} (${rw})`);
}

// ── #3. Σp = 1 at every kT ────────────────────────────────────────────────────
console.log('\n— #3 Σp = 1 at every kT (it is always a distribution) —');
{
  let maxSumErr = 0, sw = '';
  for (const [name, E] of SPECTRA) for (const kT of kTs) {
    const s = gibbs(E, kT).reduce((a, b) => a + b, 0);
    const d = Math.abs(s - 1); if (d > maxSumErr) { maxSumErr = d; sw = `${name}@kT=${kT.toFixed(3)}`; }
  }
  ok('#3 Σp=1 to ≤1e-12 across 1000 rungs × both spectra',
    maxSumErr <= 1e-12, `max|Σp−1|=${maxSumErr.toExponential(3)} (${sw})`);
}

// ── #4. S = H·ln2 — one meter, two names ─────────────────────────────────────
//  Independent nats sum (−Σ p ln p, raw natural log, shares no code with
//  entropyBits) === entropyNats(p) === entropyBits(p)·ln2.
console.log('\n— #4 S = H·ln2: independent nats == entropyNats == entropyBits·ln2 —');
{
  let maxErr = 0, ew = '';
  for (const [name, E] of SPECTRA) for (const kT of kTs) {
    const p = gibbs(E, kT);
    let natsManual = 0; for (const pi of p) if (pi > 0) natsManual -= pi * Math.log(pi);
    const viaNats = entropyNats(p);
    const viaBits = entropyBits(p) * Math.LN2;
    const e = Math.max(Math.abs(natsManual - viaNats), Math.abs(viaNats - viaBits));
    if (e > maxErr) { maxErr = e; ew = `${name}@kT=${kT.toFixed(3)}`; }
  }
  ok('#4 −Σp·ln(p) === entropyNats(p) === entropyBits(p)·ln2 to ≤1e-12 (same meter, two units)',
    maxErr <= 1e-12, `max|nats−H·ln2|=${maxErr.toExponential(3)} (${ew})`);
}

// ── #5. kT → 0  = ground = argmax(−E) = 0, and S → 0 ─────────────────────────
console.log('\n— #5 kT→0: collapse to the ground state (= argmax(−E) = 0); S → 0 —');
{
  let allOK = true, detail = [];
  for (const [name, E] of SPECTRA) {
    const gs = argmax(E.map(e => -e));            // the ground state index
    const p = gibbs(E, 0.001);
    const S = entropyNats(p);
    const good = gs === 0 && p[gs] > 1 - 1e-6 && S < 1e-3;
    if (!good) allOK = false;
    detail.push(`${name}: argmax(−E)=${gs}, p[gs]=${p[gs].toFixed(9)}, S=${S.toExponential(2)}`);
  }
  ok('#5 both spectra: ground = argmax(−E) = idx 0, p[gs]>1−1e-6 at kT=0.001, S→0', allOK, detail.join(' · '));
}

// ── #6. kT → ∞  = uniform = maxEntropyBits(N) = log2 6 = 2.584963 ─────────────
//  Use kT=1e9 so the box ladder (E_6 = 18π² ≈ 177, a wide spread) genuinely
//  flattens to within 1e-6 of perfectly uniform — the proven hot limit.
console.log('\n— #6 kT→∞: flatten to uniform; H → log₂N = log₂6 = 2.584963 —');
{
  let allOK = true, detail = [];
  const ceil = maxEntropyBits(6);
  for (const [name, E] of SPECTRA) {
    const p = gibbs(E, 1e9);
    const H = entropyBits(p);
    const good = Math.abs(H - ceil) < 1e-6 && p.every(pi => Math.abs(pi - 1 / 6) < 1e-6);
    if (!good) allOK = false;
    detail.push(`${name}: H(1e9)=${H.toFixed(6)}`);
  }
  ok('#6 both spectra: H(kT=1e9) → maxEntropyBits(6) = log₂6 = ' + ceil.toFixed(6) + '; p → uniform 1/6',
    allOK, detail.join(' · ') + ` → ceiling ${ceil.toFixed(6)}`);
}

// ── #7. NEGATIVE CONTROL WITH TEETH — the M–B speed pdf false friend FAILS ────
//  (a) sweep-max |trapNorm − gibbs| over the FULL sweep is large (>1e-2): the
//      √E Jacobian makes the normalized speed pdf a different distribution.
//  (b) Σ(mbSpeedTrap) ≠ partitionDirect at a representative kT (large gap).
//  (c) the teeth survive kT→∞: the √E does NOT wash out at the hot end.
console.log('\n— #7 NEGATIVE CONTROL: the M–B speed pdf (∝√E·exp(−E/kT)) FAILS both gates —');
{
  // (a) sweep-max of the normalized trap vs gibbs.
  let boxMax = 0, boxKT = 0, oscMax = 0, oscKT = 0;
  for (const kT of kTs) {
    for (const [E, set] of [[BOX, 'box'], [OSC, 'osc']]) {
      const trap = mbSpeedTrap(E, kT); const ts = trap.reduce((a, b) => a + b, 0);
      const tn = trap.map(v => v / ts); const p = gibbs(E, kT);
      let md = 0; for (let k = 0; k < E.length; k++) md = Math.max(md, Math.abs(tn[k] - p[k]));
      if (set === 'box' && md > boxMax) { boxMax = md; boxKT = kT; }
      if (set === 'osc' && md > oscMax) { oscMax = md; oscKT = kT; }
    }
  }
  ok('#7a sweep-max |trapNorm − gibbs| > 1e-2 on BOTH spectra (the √E Jacobian is a real distance, not a rounding error)',
    boxMax > 1e-2 && oscMax > 1e-2,
    `box ${boxMax.toFixed(4)} @kT≈${boxKT.toFixed(2)} · osc ${oscMax.toFixed(4)} @kT≈${oscKT.toFixed(2)}`);

  // (b) Σ(mbSpeedTrap) ≠ partitionDirect at a representative kT.
  const sumTrap = mbSpeedTrap(BOX, 1).reduce((a, b) => a + b, 0);
  const Z = partitionDirect(BOX, 1);
  ok('#7b Σ(mbSpeedTrap) ≠ partitionDirect at box kT=1 (the trap sum is not Z)',
    Math.abs(sumTrap - Z) > 1e-3, `box kT=1: Σtrap=${sumTrap.toFixed(4)} vs Z=${Z.toFixed(4)} (gap ${Math.abs(sumTrap - Z).toFixed(4)})`);

  // (c) the teeth survive kT→∞: gibbs goes uniform but the √E-weighted trap does not.
  const trapHot = mbSpeedTrap(BOX, 1e6); const ths = trapHot.reduce((a, b) => a + b, 0);
  const tnHot = trapHot.map(v => v / ths); const pHot = gibbs(BOX, 1e6);
  let hotMax = 0; for (let k = 0; k < 6; k++) hotMax = Math.max(hotMax, Math.abs(tnHot[k] - pHot[k]));
  ok('#7c the teeth survive kT→∞: gibbs→uniform but √E·exp does NOT (Jacobian does not wash out)',
    hotMax > 1e-2, `box kT=1e6: max|trapNorm − uniform| = ${hotMax.toFixed(4)} (≠ 0)`);
}

// ── #8. NON-VACUOUS: gibbs itself PASSES both gates ──────────────────────────
//  The gate that the trap fails is one a true Gibbs distribution sails through.
console.log('\n— #8 NON-VACUOUS: gibbs passes the same gates the trap fails —');
{
  // gate 1: |dist − gibbs| ≈ 0 (it IS gibbs). gate 2: Σ(its un-normalized form) == Z.
  let maxSelf = 0;
  for (const kT of kTs) {
    const p = gibbs(BOX, kT);
    let md = 0; for (let k = 0; k < 6; k++) md = Math.max(md, Math.abs(p[k] - p[k]));
    maxSelf = Math.max(maxSelf, md);
  }
  // the un-normalized Gibbs weights exp(−E/kT) DO sum to Z (by definition).
  let maxZgap = 0;
  for (const kT of kTs) {
    const w = BOX.map(e => Math.exp(-e / kT)); const sw = w.reduce((a, b) => a + b, 0);
    maxZgap = Math.max(maxZgap, Math.abs(sw - partitionDirect(BOX, kT)));
  }
  ok('#8 gibbs passes gate-1 (|p−gibbs|=0) AND gate-2 (Σ exp(−E/kT) == Z) — the gates are non-vacuous',
    maxSelf === 0 && maxZgap <= 1e-12, `self-distance=${maxSelf} · max|Σw−Z|=${maxZgap.toExponential(2)}`);
}

// ── #9. A THIRD ARBITRARY SPECTRUM, and box pops ≠ osc pops ───────────────────
console.log('\n— #9 spectrum-agnostic: a third spectrum byte-matches, and box ≠ osc pops —');
{
  const E3 = [0.3, 1.1, 2.7, 5.0];
  let third = true;
  for (const kT of kTs) {
    const g = gibbs(E3, kT), ref = softmax(E3.map(e => -e), kT);
    if (!g.every((v, i) => v === ref[i])) third = false;
  }
  ok('#9a a third arbitrary spectrum [0.3,1.1,2.7,5.0]: gibbs === softmax(−E) byte-for-byte',
    third, 'byte-parity over 1000 rungs');
  // the populations genuinely DIFFER between box and osc (not a trivial constant).
  let popMax = 0, pw = 0;
  for (const kT of kTs) {
    const pb = gibbs(BOX, kT), po = gibbs(OSC, kT);
    let md = 0; for (let k = 0; k < 6; k++) md = Math.max(md, Math.abs(pb[k] - po[k]));
    if (md > popMax) { popMax = md; pw = kT; }
  }
  ok('#9b box populations ≠ osc populations (max pop-difference is large — the spectrum genuinely matters)',
    popMax > 0.1, `max|p_box − p_osc| = ${popMax.toFixed(3)} @kT≈${pw.toFixed(2)}`);
}

// ── #10. ω INVARIANCE — the oscillator identity holds for ω ∈ {0.5, 1, 2} ─────
console.log('\n— #10 ω-invariance: the identity holds for every oscillator stiffness —');
{
  let allOK = true, detail = [];
  for (const w of [0.5, 1, 2]) {
    const E = oscLevels(6, w);
    let md = 0;
    for (const kT of kTs) {
      const g = gibbs(E, kT), ref = softmax(E.map(e => -e), kT);
      for (let k = 0; k < 6; k++) md = Math.max(md, Math.abs(g[k] - ref[k]));
      // Z two ways still agree
      if (Math.abs(partitionDirect(E, kT) - partitionFromSoftmax(E, kT)) > 1e-12) allOK = false;
    }
    if (md !== 0) allOK = false;
    detail.push(`ω=${w}: byte-parity ${md === 0 ? 'ok' : 'FAIL'}`);
  }
  ok('#10 oscLevels(6,ω) for ω∈{0.5,1,2}: gibbs===softmax(−E) AND Z two ways agree', allOK, detail.join(' · '));
}

// ── #11. FROZEN-LITERAL PINS + the honest law-vs-toy line ─────────────────────
console.log('\n— #11 frozen-literal pins + the honest boundary —');
{
  // the spectra are exactly the Cavern's closed forms.
  const boxOK = Math.abs(BOX[0] - Math.PI * Math.PI / 2) < 1e-15 && Math.abs(BOX[2] - 9 * Math.PI * Math.PI / 2) < 1e-12;
  const oscOK = OSC[0] === 0.5 && OSC[5] === 5.5;
  const rangeOK = KT_RANGE.LO === core.T_RANGE.LO && KT_RANGE.HI === core.T_RANGE.HI;
  ok('#11 boxLevels(6)[0]=π²/2, [2]=9π²/2; oscLevels(6)=[½..5½]; KT_RANGE === core.T_RANGE (one dial, literally)',
    boxOK && oscOK && rangeOK,
    `E_box1=${BOX[0].toFixed(4)} · E_osc0=${OSC[0]} · KT_RANGE=[${KT_RANGE.LO},${KT_RANGE.HI}]==core.T_RANGE`);
}

// ── #12 & #13: RE-EXTRACTION PARITY + the cross-wing live import ──────────────
//  Read partition.html, slice the inline core between the banner sentinels, prove
//  each inlined function body is char-for-char the imported toString(), eval the
//  slice and check cross-boundary values === module. THEN re-confirm the live
//  cross-wing import from the page's own perspective.
console.log('\n— #12/#13 RE-EXTRACTION PARITY: the page core === the module core, the cross is live —');
{
  const html = readFileSync(join(__dir, 'partition.html'), 'utf8');
  const BEGIN = '// ===== PARTITION CORE (inlined byte-twin of partition-core.mjs) BEGIN =====';
  const END = '// ===== PARTITION CORE END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in partition.html', i >= 0 && j > i,
    i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) every named function body inlined in the page is char-for-char the import.
    //     softmax/entropyBits/maxEntropyBits/argmax come from core.mjs (the page
    //     inlines a byte-twin of THEM too — so the page slice can call gibbs);
    //     the rest come from partition-core.mjs.
    const fns = {
      softmax: core.softmax, entropyBits: core.entropyBits, maxEntropyBits: core.maxEntropyBits, argmax: core.argmax,
      boxLevels, oscLevels, gibbs, partitionDirect, partitionFromSoftmax, entropyNats, mbSpeedTrap,
    };
    for (const [name, fn] of Object.entries(fns)) {
      const pageSrc = extractFn(slice, name);
      ok(`#12 inlined ${name}() body is char-for-char the imported ${name}.toString()`,
        norm(pageSrc) === norm(fn.toString()),
        norm(pageSrc) === norm(fn.toString()) ? 'identical bytes' :
          `DRIFT:\n  page: ${JSON.stringify(norm(pageSrc).slice(0, 110))}…\n  mod:  ${JSON.stringify(norm(fn.toString()).slice(0, 110))}…`);
    }

    // (b) eval the slice and check cross-boundary values === the module.
    let PageCore = null, evalErr = null;
    const RET = '\n;return { softmax, entropyBits, maxEntropyBits, argmax, KT_RANGE, boxLevels, oscLevels, gibbs, partitionDirect, partitionFromSoftmax, entropyNats, mbSpeedTrap };';
    try { PageCore = new Function(slice + RET)(); } catch (e) { evalErr = e; }
    ok('#12 inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');

    if (PageCore) {
      // cross-boundary spot values on both spectra at a representative kT.
      let agree = true, detail = [];
      for (const [name, E] of [['box', PageCore.boxLevels(6)], ['osc', PageCore.oscLevels(6)]]) {
        const pPage = PageCore.gibbs(E, 1.7);
        const pMod = gibbs(name === 'box' ? BOX : OSC, 1.7);
        if (!pPage.every((v, idx) => v === pMod[idx])) agree = false;
        const Zp = PageCore.partitionFromSoftmax(E, 1.7), Zm = partitionFromSoftmax(name === 'box' ? BOX : OSC, 1.7);
        if (Zp !== Zm) agree = false;
        detail.push(`${name} p₀=${pPage[0].toFixed(6)}`);
      }
      ok('#12 cross-boundary: page gibbs & partitionFromSoftmax (both spectra) === the module values', agree, detail.join(' · '));

      // (c) #13 — the page slice contains a softmax byte-twin AND the module proves
      //     the live import: gibbs in the page CALLS that inlined softmax, while the
      //     module's gibbs CALLS the imported core.softmax — same source, two homes.
      const pageGibbsSrc = norm(extractFn(slice, 'gibbs'));
      const callsSoftmax = /softmax\(/.test(pageGibbsSrc);
      ok('#13 the page\'s gibbs CALLS its inlined softmax twin (same body the module imports) — the cross is a real code-dependency',
        callsSoftmax && partitionCore.softmax === core.softmax,
        `page gibbs calls softmax(): ${callsSoftmax} · module softmax === core.softmax: ${partitionCore.softmax === core.softmax}`);
    }
  }
}

// extract `function NAME(...) { ... }` with brace-matching from a source string.
// (skips the balanced parameter parens — handles destructured/defaulted params —
//  then brace-matches the BODY. Identical matcher to core.test.mjs.)
function extractFn(src, name) {
  const re = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = re.exec(src);
  if (!m) return '';
  let p = src.indexOf('(', m.index), pd = 0, q = p;
  for (; q < src.length; q++) {
    if (src[q] === '(') pd++;
    else if (src[q] === ')') { pd--; if (pd === 0) { q++; break; } }
  }
  let i = src.indexOf('{', q);
  if (i < 0) return '';
  let depth = 0, k = i;
  for (; k < src.length; k++) {
    if (src[k] === '{') depth++;
    else if (src[k] === '}') { depth--; if (depth === 0) { k++; break; } }
  }
  return src.slice(m.index, k);
}

console.log(`\n${pass}/${total} ${pass === total ? '✓ ALL GREEN' : '✗ FAILURES'}`);
process.exit(pass === total ? 0 : 1);
