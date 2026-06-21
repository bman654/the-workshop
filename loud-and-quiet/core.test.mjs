// Node twin for "The Loud and the Quiet Walk". Zero-dep. Run: `node core.test.mjs` (EXIT 0 on pass).
//
// Imports the SAME core.mjs that is inlined byte-identical into index.html (forge-inlined; the
// forge --check gate keeps them in lockstep), so the page's in-page chip and this test can't drift.
//
// The headline cross-room claim: the loudness you HEAR is RIPPLE'S OWN field, not a re-derivation.
// (a) below PROVES that mechanically — it re-extracts the seven reused functions out of ripple's
// LIVE source (ripple/index.html) and asserts they are CHARACTER-IDENTICAL to our copy in core.mjs.
// If ripple's core ever drifts from ours, this test goes RED.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  falloff, distTo, contribution, field, resultantAmplitude, kOf, omegaOf,
  pathDiff, gainAt, twoSpeakers, hyperbolaPoint, runSelfTest
} from './core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if(ok){ pass++; } else { fail++; fails.push(name); } }

// ── helper: pull a top-level `function NAME(...) { ... }` body out of a source string by
//    brace-matching from the function keyword. Returns the exact substring (signature..closing }).
function extractFn(src, name){
  const re = new RegExp('function\\s+' + name + '\\s*\\(', 'g');
  const m = re.exec(src);
  if(!m) return null;
  const start = m.index;
  // find the first '{' after the signature, then brace-match
  let i = src.indexOf('{', re.lastIndex);
  if(i < 0) return null;
  let depth = 0;
  for(; i < src.length; i++){
    const c = src[i];
    if(c === '{') depth++;
    else if(c === '}'){ depth--; if(depth === 0){ return src.slice(start, i + 1); } }
  }
  return null;
}

// ── (a) BYTE-IDENTITY with ripple ──────────────────────────────────────────────────────────
//    Extract each reused function from ripple/index.html AND from our core.mjs; assert identical.
const REUSED = ['falloff', 'distTo', 'contribution', 'field', 'resultantAmplitude', 'kOf', 'omegaOf'];
{
  let rippleSrc = null, coreSrc = null;
  try { rippleSrc = readFileSync(join(__dirname, '..', 'ripple', 'index.html'), 'utf8'); } catch(e){ rippleSrc = null; }
  try { coreSrc = readFileSync(join(__dirname, 'core.mjs'), 'utf8'); } catch(e){ coreSrc = null; }
  ck('byte-identity: ripple/index.html readable', !!rippleSrc);
  ck('byte-identity: core.mjs readable', !!coreSrc);
  let allMatch = !!rippleSrc && !!coreSrc;
  for(const name of REUSED){
    const fromRipple = rippleSrc ? extractFn(rippleSrc, name) : null;
    const fromCore = coreSrc ? extractFn(coreSrc, name) : null;
    const match = !!fromRipple && !!fromCore && fromRipple === fromCore;
    ck('byte-identity: ' + name + '() is CHARACTER-IDENTICAL to ripple', match);
    if(!match){
      allMatch = false;
      if(fromRipple && fromCore){
        // surface the first differing position to make a drift trivial to fix
        let i = 0; for(; i < Math.min(fromRipple.length, fromCore.length); i++) if(fromRipple[i] !== fromCore[i]) break;
        fails.push('  ↳ ' + name + ' first diff at char ' + i + ': ripple=' + JSON.stringify(fromRipple.slice(i, i + 24)) + ' core=' + JSON.stringify(fromCore.slice(i, i + 24)));
      }
    }
  }
  ck('byte-identity: ALL ' + REUSED.length + ' reused functions match ripple verbatim', allMatch);
}

// ── (b) loud maxima at r1−r2 = nλ, silent minima at (n+½)λ — exact loci over a position sweep ──
{
  const lambda = 50, k = kOf(lambda), d = 240, cx = 500, ys = 300, a = d / 2;
  const srcs = twoSpeakers(cx, ys, d);
  let loudOk = true, quietOk = true, worstLoud = 0, worstQuiet = 0;
  for(const n of [0, 1, 2, 3]){
    for(const Y of [0, 25, 60, 120, 240, 480]){
      if(n * lambda < d){
        const pt = hyperbolaPoint(n * lambda, Y, cx, ys, a);
        const e = Math.abs(gainAt(srcs, k, lambda, pt.x, pt.y) - 2);
        worstLoud = Math.max(worstLoud, e); if(e > 1e-9) loudOk = false;
      }
      if((n + 0.5) * lambda < d){
        const pt = hyperbolaPoint((n + 0.5) * lambda, Y, cx, ys, a);
        const g = gainAt(srcs, k, lambda, pt.x, pt.y);
        worstQuiet = Math.max(worstQuiet, g); if(g > 1e-9) quietOk = false;
      }
    }
  }
  ck('antinodes r1−r2 = nλ are LOUD (R = 2A, worst err ' + worstLoud.toExponential(1) + ' < 1e-9)', loudOk);
  ck('nodes r1−r2 = (n+½)λ are SILENT (R = 0, worst ' + worstQuiet.toExponential(1) + ' < 1e-9)', quietOk);
}

// ── (c) the page's heard-gain field matches ripple's R(x,y) to <1e-9 (the shared closed form) ──
{
  let maxErr = 0;
  let s = 0xa5a5a5a5 >>> 0; const rnd = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  for(let t = 0; t < 5000; t++){
    const lambda = 22 + rnd() * 120, k = kOf(lambda);
    const d = 80 + rnd() * 360;
    const srcs = twoSpeakers(500, 300, d);
    const x = rnd() * 1200 - 100, y = rnd() * 800 - 100;
    const heard = gainAt(srcs, k, lambda, x, y);
    const ripple = resultantAmplitude(srcs, k, omegaOf(0.7), 'none', lambda, x, y);
    maxErr = Math.max(maxErr, Math.abs(heard - ripple));
  }
  ck('heard-gain field == ripple R(x,y) over 5000 random points (<1e-9, max ' + maxErr.toExponential(1) + ')', maxErr < 1e-9);
}

// ── (d) sliding d shifts the bands consistently: the loud-band count #{n:|nλ|<d} rises with d,
//        and every counted band is genuinely loud on its hyperbola (the exact, no-solve count) ──
{
  const lambda = 50, k = kOf(lambda), ys = 300, cx = 500;
  function bandCount(d){
    const srcs = twoSpeakers(cx, ys, d);
    let c = 0, allLoud = true;
    for(let n = -300; n <= 300; n++){
      if(Math.abs(n * lambda) < d){
        c++;
        if(n >= 0){ const pt = hyperbolaPoint(n * lambda, 120, cx, ys, d / 2); if(Math.abs(gainAt(srcs, k, lambda, pt.x, pt.y) - 2) > 1e-9) allLoud = false; }
      }
    }
    return { c, allLoud };
  }
  const a = bandCount(160), b = bandCount(280), c = bandCount(400);
  ck('wider d fans the bands: loud-band count ' + a.c + ' < ' + b.c + ' < ' + c.c + ' (rises with d, all loud)',
     c.c > b.c && b.c > a.c && a.c >= 1 && a.allLoud && b.allLoud && c.allLoud);
}

// ── (e) λ = c/f holds, and pitch is the carrier (pattern depends on λ only) ──
{
  const c = 22000, lambda1 = 50, lambda2 = 100;
  const f1 = c / lambda1, f2 = c / lambda2;
  ck('λ = c/f: c = f·λ both ways, and halving f doubles λ',
     Math.abs(c - f1 * lambda1) < 1e-9 && Math.abs(c - f2 * lambda2) < 1e-9 && Math.abs(f1 - 2 * f2) < 1e-9);
  const srcs = twoSpeakers(500, 300, 240);
  const g1 = gainAt(srcs, kOf(lambda1), lambda1, 720, 420);
  const g2 = gainAt(srcs, kOf(lambda2), lambda2, 720, 420);
  ck('pitch is the carrier: different λ ⇒ different spatial loudness', Math.abs(g1 - g2) > 1e-6);
}

// ── (f) NEG-CONTROL is RED: equal-path bisector stays maximal (no nulls); single source has none ──
{
  const lambda = 50, k = kOf(lambda), d = 240, cx = 500, ys = 300;
  const srcs = twoSpeakers(cx, ys, d);
  let minBisector = 2;
  for(let Y = -1200; Y <= 1200; Y += 1) minBisector = Math.min(minBisector, gainAt(srcs, k, lambda, cx, ys + Y));
  ck('NEG-CONTROL: equal-path centre line stays maximal (min = 2A, no nulls)', Math.abs(minBisector - 2) < 1e-9);
  // a found "node" on the bisector would be a FALSE claim → assert there is none
  let bisectorNode = false;
  for(let Y = -1200; Y <= 1200; Y += 1) if(gainAt(srcs, k, lambda, cx, ys + Y) < 1.5) bisectorNode = true;
  ck('NEG-CONTROL stays RED: NO node ever appears on the equal-path bisector', bisectorNode === false);
  const one = [ { x: cx, y: ys, A: 1, phase: 0 } ];
  let minOne = Infinity, maxOne = 0, sOne = 12345 >>> 0; const rOne = () => { sOne ^= sOne << 13; sOne ^= sOne >>> 17; sOne ^= sOne << 5; sOne >>>= 0; return sOne / 4294967296; };
  for(let i = 0; i < 2000; i++){ const x = rOne() * 1000, y = rOne() * 600; const v = resultantAmplitude(one, k, omegaOf(0.7), 'none', lambda, x, y); minOne = Math.min(minOne, v); maxOne = Math.max(maxOne, v); }
  ck('NEG-CONTROL: a single source has NO nulls (R ≡ A, never silent — min ' + minOne.toFixed(4) + ')', minOne > 0.99 && maxOne <= 1 + 1e-9);
}

// ── the page's OWN self-test (the in-page chip's source) must be green here too ──
{
  const res = runSelfTest();
  ck('in-page runSelfTest() all green (' + res.pass + '/' + res.total + ')', res.pass === res.total);
}

// ── report ──
console.log('The Loud and the Quiet Walk — core.test.mjs');
console.log('  reused (byte-identical to ripple): ' + REUSED.join(', '));
console.log('  the heard loudness IS ripple R = 2A·|cos(kΔ/2)|, Δ = r1−r2; loud at nλ, silent at (n+½)λ');
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if(fail){ console.log('  FAILING:\n   - ' + fails.join('\n   - ')); process.exit(1); }
