// ============================================================================
//  Node-side falsifiability harness for The Times-Table Cardioid.
//  Runs the shared in-page self-test at several (m,k), PLUS deeper Node-only
//  assertions (denser tangency, numeric cusps, the full cipher handshake), THEN
//  re-extracts the inlined core from index.html and proves it is byte-for-byte
//  the SAME core (parity). Run:  node core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  CUSP_EPS,
  chordTarget, ptOnCircle, envelopePoint, envelopeVel,
  analyticCuspCount, cuspParams,
  chordTangencyResidual, degenerateChordCount,
  gcd, egcd, modInverse, isValidKey, affineEncipher, affineDecipher, imageDistinctCount,
  buildChords, sampleEnvelope,
  runSelfTest,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const TAU = Math.PI * 2;

let pass = 0, total = 0;
const ok = (name, cond, detail = '') => {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (detail ? '  ·  ' + detail : '')); }
  else { console.log('  ✗ ' + name + (detail ? '  ·  ' + detail : '')); }
};

console.log('The Times-Table Cardioid — core.test.mjs\n');

// ── 1. the shared in-page self-test, at several (m,k) ────────────────────────
console.log('— shared runSelfTest() (same claims the in-page pill runs) —');
for (const [m, k] of [[360, 2], [360, 3], [720, 5]]){
  const st = runSelfTest(m, k);
  for (const l of st.lines) ok(`[self-test m=${m},k=${k}] ` + l.name, l.ok, l.detail);
  ok(`[self-test m=${m},k=${k}] all in-page checks pass`, st.pass === st.total, `${st.pass}/${st.total}`);
}

// ── 2. CLAIM 1 — tangency, robust T1 + guarded T2 + anti-circularity ─────────
console.log('\n— CLAIM 1: every chord is tangent to the closed-form epicycloid —');
{
  // T1a/b/c: max ⊥ residual at three (k,m), each well under 1e-12.
  for (const [k, m, label] of [[2, 360, 'cardioid'], [3, 360, 'nephroid'], [5, 720, 'general']]){
    let maxPerp = 0, n = 0;
    for (let i = 0; i < m; i++){
      const r = chordTangencyResidual(i, k, m);
      if (r.degenerate) continue;
      n++; if (r.perp > maxPerp) maxPerp = r.perp;
    }
    ok(`T1 k=${k} m=${m} (${label}): max ⊥ residual ${maxPerp.toExponential(2)} < 1e-12 over ${n} chords`,
       maxPerp < 1e-12 && n > 0, `max ⊥ = ${maxPerp.toExponential(3)}`);
  }
  // T1d: the GUARDED tangentSin is < 1e-10 only where |E'| > CUSP_EPS, and is
  //      null exactly at the cusp parameters (where it is undefined).
  {
    const k = 3, m = 360;
    let maxSin = 0, guardedNull = 0, checked = 0;
    for (let i = 0; i < m; i++){
      const r = chordTangencyResidual(i, k, m);
      if (r.degenerate) continue;
      if (r.tangentSin === null){ guardedNull++; continue; }
      checked++; maxSin = Math.max(maxSin, r.tangentSin);
    }
    ok(`T1d guarded tangentSin < 1e-10 where |E'|>CUSP_EPS (null at cusps, ${guardedNull} guarded out)`,
       maxSin < 1e-10 && checked > 0, `max sin∠ = ${maxSin.toExponential(2)} over ${checked} guarded chords`);
  }
  // T1e: INDEPENDENT numeric envelope (neighbour-chord intersection, t±h) matches
  //      E(t) to < 1e-8 at 2000 samples, for k=2,3,5 — the anti-circularity guard.
  {
    const h = 1e-6, NS = 2000;
    const lp = (t, k) => [{ x: Math.cos(t), y: Math.sin(t) }, { x: Math.cos(k * t), y: Math.sin(k * t) }];
    const isect = (a1, a2, b1, b2) => {
      const d = (a1.x - a2.x) * (b1.y - b2.y) - (a1.y - a2.y) * (b1.x - b2.x);
      const c1 = a1.x * a2.y - a1.y * a2.x, c2 = b1.x * b2.y - b1.y * b2.x;
      return { x: (c1 * (b1.x - b2.x) - (a1.x - a2.x) * c2) / d, y: (c1 * (b1.y - b2.y) - (a1.y - a2.y) * c2) / d };
    };
    let worst = 0, worstK = 0;
    for (const k of [2, 3, 5]){
      let maxErr = 0;
      for (let s = 0; s < NS; s++){
        const t = TAU * (s + 0.5) / NS;
        const [a1, a2] = lp(t - h, k), [b1, b2] = lp(t + h, k);
        const X = isect(a1, a2, b1, b2), E = envelopePoint(t, k);
        maxErr = Math.max(maxErr, Math.hypot(X.x - E.x, X.y - E.y));
      }
      if (maxErr > worst){ worst = maxErr; worstK = k; }
    }
    ok('T1e ANTI-CIRCULARITY: independent numeric envelope matches E(t) < 1e-8 (k=2,3,5)',
       worst < 1e-8, `worst |intersection − E| = ${worst.toExponential(2)} (k=${worstK})`);
  }
}

// ── 3. CLAIM 2 — cusp count == k−1 ───────────────────────────────────────────
console.log('\n— CLAIM 2: the envelope has exactly k−1 cusps —');
{
  // T2a: analyticCuspCount k=2,3,5 → 1,2,4 and k=1 → 0.
  ok('T2a analyticCuspCount: k=2→1, k=3→2, k=5→4, k=1→0',
     analyticCuspCount(2) === 1 && analyticCuspCount(3) === 2 && analyticCuspCount(5) === 4 && analyticCuspCount(1) === 0,
     `${analyticCuspCount(2)},${analyticCuspCount(3)},${analyticCuspCount(5)},${analyticCuspCount(1)}`);
  // T2b: numeric local-minima of |E'|<CUSP_EPS over 20000 samples === analytic.
  {
    let okAll = true, detail = [];
    for (const k of [1, 2, 3, 5]){
      const NS = 20000;
      const speed = (s) => { const V = envelopeVel(TAU * s / NS, k); return Math.hypot(V.x, V.y); };
      let minima = 0, prev = speed(0), cur = speed(1);
      for (let s = 2; s <= NS; s++){
        const nx = speed(s);
        if (cur < prev && cur < nx && cur < CUSP_EPS) minima++;
        prev = cur; cur = nx;
      }
      if (minima !== analyticCuspCount(k)) okAll = false;
      detail.push(`k${k}:${minima}`);
    }
    ok('T2b numeric local-minima of |E\'|<CUSP_EPS (20000 samples) === analytic count', okAll, detail.join(' '));
  }
  // T2c: cuspParams length k−1, each a genuine |E'|<1e-9 zero.
  {
    let okAll = true, maxV = 0;
    for (const k of [2, 3, 5]){
      const ps = cuspParams(k);
      if (ps.length !== k - 1) okAll = false;
      for (const t of ps){ const V = envelopeVel(t, k); maxV = Math.max(maxV, Math.hypot(V.x, V.y)); }
    }
    ok('T2c cuspParams length === k−1 and each is a genuine |E\'|<1e-9 zero', okAll && maxV < 1e-9,
       `max |E'| at any cusp param = ${maxV.toExponential(2)}`);
  }
}

// ── 4. CLAIM 3 — the cipher handshake ────────────────────────────────────────
console.log('\n— CLAIM 3: the same map is an invertible affine cipher iff coprime —');
{
  // T3a: coprime keys — valid, invertible, full image.
  {
    let okAll = true, detail = [];
    for (const [k, m] of [[7, 26], [2, 361], [11, 720]]){
      const ki = modInverse(k, m);
      const good = isValidKey(k, m) && ki !== null && (k * ki) % m === 1 && imageDistinctCount(k, m) === m;
      if (!good) okAll = false;
      detail.push(`(${k},${m})→k⁻¹=${ki}`);
    }
    ok('T3a coprime (7,26),(2,361),(11,720): valid key, k·k⁻¹≡1, image === m', okAll, detail.join(' '));
  }
  // T3b: roundtrip for ALL P, incl. nonzero b.
  {
    let okAll = true, fb = '';
    for (const [k, m, b] of [[7, 26, 0], [7, 26, 3], [11, 720, 17], [2, 361, 5]]){
      for (let P = 0; P < m; P++){
        if (affineDecipher(affineEncipher(P, k, m, b), k, m, b) !== P){ okAll = false; fb = `(${k},${m},b=${b}),P=${P}`; break; }
      }
      if (!okAll) break;
    }
    ok('T3b roundtrip affineDecipher(affineEncipher(P)) === P for ALL P (incl. nonzero b)', okAll, okAll ? 'all residues round-trip' : `fails at ${fb}`);
  }
  // T3c: TEETH — non-coprime keys collapse to EXACTLY m/gcd.
  {
    let okAll = true, detail = [];
    for (const [k, m, expect] of [[6, 26, 13], [2, 360, 180], [4, 360, 90], [10, 720, 72]]){
      const img = imageDistinctCount(k, m), g = gcd(k, m);
      const good = !isValidKey(k, m) && modInverse(k, m) === null && img === m / g && img === expect;
      if (!good) okAll = false;
      detail.push(`(${k},${m})→${img}`);
    }
    ok('T3c TEETH non-coprime (6,26),(2,360),(4,360),(10,720): no key, no inverse, image === m/gcd (13,180,90,72)',
       okAll, detail.join(' '));
  }
  // T3d: degenerateChordCount === gcd(k−1,m) and buildChords has exactly that many.
  {
    let okAll = true, detail = [];
    for (const [k, m] of [[2, 360], [3, 360], [5, 720], [7, 360]]){
      const formula = degenerateChordCount(k, m);
      const expect = gcd(((k - 1) % m + m) % m, m);
      const built = buildChords(m, k).filter(c => c.degenerate).length;
      if (formula !== expect || built !== formula) okAll = false;
      detail.push(`(${k},${m})→${built}`);
    }
    ok('T3d degenerateChordCount === gcd(k−1,m) === count in buildChords', okAll, detail.join(' '));
  }
}

// ── 5. CLAIM 4 — k=1 trivial negative control ────────────────────────────────
console.log('\n— CLAIM 4: k=1 draws nothing, yet is a valid identity key —');
{
  const m = 360;
  // T4a: chordTarget(i,1,m)===i, all chords degenerate, image === m.
  {
    let selfMap = true;
    for (let i = 0; i < m; i++) if (chordTarget(i, 1, m) !== i){ selfMap = false; break; }
    const allDeg = buildChords(m, 1).every(c => c.degenerate);
    ok('T4a chordTarget(i,1,m)===i, buildChords all degenerate, imageDistinctCount(1,m)===m',
       selfMap && allDeg && imageDistinctCount(1, m) === m, `${m} self-maps, image ${imageDistinctCount(1, m)}`);
  }
  // T4b: 0 cusps, envelope === unit circle.
  {
    const noCusps = analyticCuspCount(1) === 0 && cuspParams(1).length === 0;
    let onCircle = true, maxErr = 0;
    for (const p of sampleEnvelope(1, 720)){ const e = Math.abs(Math.hypot(p.x, p.y) - 1); maxErr = Math.max(maxErr, e); if (e > 1e-12) onCircle = false; }
    ok('T4b analyticCuspCount(1)=0 and sampleEnvelope(1) is the unit circle', noCusps && onCircle,
       `0 cusps; max |r−1| = ${maxErr.toExponential(2)}`);
  }
  // T4c: HONESTY GUARD — both predicates true, labelled distinct.
  {
    const drawsNothing = buildChords(m, 1).every(c => c.degenerate) && analyticCuspCount(1) === 0;
    const validKey = isValidKey(1, m) === true && modInverse(1, m) === 1;
    ok('T4c HONESTY GUARD: PREDICATE A "k=1 draws nothing (no envelope)" AND PREDICATE B "k=1 is a valid identity cipher key" — both true, distinct, non-contradictory',
       drawsNothing && validKey,
       `A draws-nothing=${drawsNothing} (separate predicate) · B isValidKey(1,${m})=${isValidKey(1, m)}, 1⁻¹=${modInverse(1, m)}`);
  }
}

// ── 6. THE WORKED LETTER EXAMPLE (generated from code, never hardcoded) ───────
console.log('\n— the worked m=26 affine example (the Volvelle handshake) —');
{
  const enc = (w, k, b = 0) => [...w].map(ch => String.fromCharCode(affineEncipher(ch.charCodeAt(0) - 65, k, 26, b) + 65)).join('');
  const dec = (w, k, b = 0) => [...w].map(ch => String.fromCharCode(affineDecipher(ch.charCodeAt(0) - 65, k, 26, b) + 65)).join('');
  const e5 = enc('MATH', 5), d5 = dec(e5, 5);
  ok('MATH --(a=5)--> IARJ --(a=5⁻¹)--> MATH (generated, not hardcoded)', e5 === 'IARJ' && d5 === 'MATH', `${'MATH'}→${e5}→${d5}`);
  const e13 = enc('MATH', 13);
  ok('bad-key foil a=13 (gcd 13) collapses, no inverse', modInverse(13, 26) === null && new Set([...e13]).size < 4,
     `MATH→${e13}, modInverse(13,26)=${modInverse(13, 26)} (distinct letters ${new Set([...e13]).size}/4)`);
}

// ── 7. RE-EXTRACTION PARITY — the page core === the module, byte-for-byte ─────
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== CARDIOID CORE (inlined byte-twin of core.mjs) BEGIN =====';
  const END = '// ===== CARDIOID CORE (inlined byte-twin of core.mjs) END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in index.html', i >= 0 && j > i,
     i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i){
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) ★ inlined chordTarget body === imported chordTarget.toString() char-for-char.
    const pageCT = extractFn(slice, 'chordTarget');
    ok('(parity)★ inlined chordTarget body is char-for-char the imported chordTarget.toString()',
       norm(pageCT) === norm(chordTarget.toString()),
       norm(pageCT) === norm(chordTarget.toString()) ? 'identical bytes — the ONE map' :
         `DRIFT:\n  page: ${JSON.stringify(norm(pageCT))}\n  mod:  ${JSON.stringify(norm(chordTarget.toString()))}`);

    // (b) ★ inlined envelopePoint + modInverse bodies === imported.
    const pageEP = extractFn(slice, 'envelopePoint');
    ok('(parity)★ inlined envelopePoint body === imported envelopePoint.toString()',
       norm(pageEP) === norm(envelopePoint.toString()), norm(pageEP) === norm(envelopePoint.toString()) ? 'identical' : 'DRIFT');
    const pageMI = extractFn(slice, 'modInverse');
    ok('(parity)★ inlined modInverse body === imported modInverse.toString()',
       norm(pageMI) === norm(modInverse.toString()), norm(pageMI) === norm(modInverse.toString()) ? 'identical' : 'DRIFT');

    // (c) evaluate the slice and run ITS runSelfTest → same pass-count + ok-for-ok.
    let pageRes = null, evalErr = null, PageCore = null;
    const RET = '\n;return { runSelfTest, chordTarget, envelopePoint, envelopeVel, chordTangencyResidual, affineEncipher, affineDecipher, modInverse, imageDistinctCount, buildChords, sampleEnvelope, cuspParams, analyticCuspCount, degenerateChordCount, isValidKey, gcd };';
    try {
      const factory = new Function(slice + RET);
      PageCore = factory();
      pageRes = PageCore.runSelfTest(360, 2);
    } catch (e) { evalErr = e; }

    ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');

    if (pageRes){
      const modRes = runSelfTest(360, 2);
      ok('(parity)★ inline runSelfTest pass-count == module pass-count (m=360,k=2)',
         pageRes.pass === modRes.pass && pageRes.total === modRes.total,
         `in-page ${pageRes.pass}/${pageRes.total}  ·  module ${modRes.pass}/${modRes.total}`);
      let agree = pageRes.lines.length === modRes.lines.length;
      for (let kk = 0; agree && kk < pageRes.lines.length; kk++){
        if (pageRes.lines[kk].ok !== modRes.lines[kk].ok || pageRes.lines[kk].name !== modRes.lines[kk].name) agree = false;
      }
      ok('(parity)★ every named claim agrees ok-for-ok AND name-for-name (page vs module)', agree,
         agree ? `all ${pageRes.lines.length} lines identical` : 'a line disagreed');

      // (d) spot: chordTangencyResidual + affineDecipher∘affineEncipher reproduce in page core.
      const pr = PageCore.chordTangencyResidual(17, 5, 720), mr = chordTangencyResidual(17, 5, 720);
      ok('(parity)★ re-extracted chordTangencyResidual(17,5,720).perp === module (< 1e-12)',
         Math.abs(pr.perp - mr.perp) < 1e-18 && pr.perp < 1e-12, `page ⊥=${pr.perp.toExponential(2)} == module ⊥=${mr.perp.toExponential(2)}`);
      let rt = true;
      for (let P = 0; P < 26; P++) if (PageCore.affineDecipher(PageCore.affineEncipher(P, 7, 26, 3), 7, 26, 3) !== P){ rt = false; break; }
      ok('(parity)★ re-extracted affineDecipher∘affineEncipher === identity on ℤ/26ℤ (b=3)', rt, rt ? 'all 26 round-trip in page core' : 'page cipher drifted');
    }
  }
}

// extract `function NAME(...) { ... }` with brace-matching from a source string.
function extractFn(src, name){
  const re = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = re.exec(src);
  if (!m) return '';
  let i = src.indexOf('{', m.index);
  if (i < 0) return '';
  let depth = 0, k = i;
  for (; k < src.length; k++){
    if (src[k] === '{') depth++;
    else if (src[k] === '}'){ depth--; if (depth === 0){ k++; break; } }
  }
  return src.slice(m.index, k);
}

console.log(`\n${pass}/${total} ${pass === total ? '✓ ALL GREEN' : '✗ FAILURES'}`);
process.exit(pass === total ? 0 : 1);
