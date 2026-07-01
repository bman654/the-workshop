/* ============================================================================
   core.test.mjs — the Node twin of the Fractionating Column bench's in-page self-test.

   Run:  node alchemy/fractionating-column/core.test.mjs

   Proves, for the constant-α separation math the page inlines byte-identical, the
   claims the bench makes — and ONLY claims that are honest:
     • CRUX ★: the stepped total-reflux walk y=αx/(1+(α−1)x) matches Fenske's
       closed form xTop/(1−xTop)=α^(N+1)·xBot/(1−xBot) to <1e-9 over an (α,N,xBot)
       sweep (composition domain; saturated-to-pure cells skipped as a register limit).
     • NEG-CONTROL ★: the 'dead' entry ⇒ α===1 EXACTLY and walkStaircase(1,N,xBot)
       gives xTop===xBot bit-exact for every N and several xBot (no separation).
     • α(model) properties: equal b.p. ⇒ α===1; lighter-boils-first ⇒ α>1; monotone
       in the boiling-point gap; reciprocal-symmetric to 1e-12. (A LABELED model — its
       PROPERTIES are proven, not an exact value; this is kept distinct from the crux.)
     • monotone climb: a real α>1 ⇒ x strictly increases plate-to-plate.
     • receiver: 0<receiverPurity<1; a taller column is strictly purer.
     • operability: the cold/run/flood state machine, exhaustive at the boundaries.
     • plateComposition closes (xLight+xHeavy===1) and its top plate === receiverPurity.
   PLUS a byte-identical re-extraction parity test (page inline core === core.mjs).
   It runs the SAME runSelfTest() body the in-page badge runs, then adds parity.
   Exits non-zero on any failure so CI / a human sees RED.
   ============================================================================ */

import {
  R_GAS, TOL_CRUX, COLD_THRESH, FLOOD_THRESH, stage, walkStaircase, fenskeTop,
  alphaFromBP, plateComposition, receiverPurity, operability, LIBRARY, SWEEP,
  cruxWorstError, runSelfTest
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));

let pass = 0, fail = 0;
function ok(name, cond, info){
  if(cond){ pass++; console.log('  \x1b[32m✓\x1b[0m ' + name); }
  else { fail++; console.log('  \x1b[31m✗\x1b[0m ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\n— ALCHEMY LAB · THE FRACTIONATING COLUMN · core.test.mjs —\n');

// ── (A) run the SHARED proof body — the same rows the in-page badge shows ──
console.log('the shared runSelfTest() body (badge === Node twin):');
{
  const r = runSelfTest();
  for(const row of r.rows) ok(row.name, row.ok, row.info);
  ok('runSelfTest() reports all rows passing', r.pass === r.total && r.total > 0, r.pass + '/' + r.total);
}

// ── (B) the CRUX spelled out independently of runSelfTest() ──
console.log('\nthe crux, recomputed independently (stepped walk === Fenske):');
{
  const c = cruxWorstError(SWEEP);
  ok('crux worst composition-domain error ≤ 1e-9', c.worst <= TOL_CRUX, 'worst=' + c.worst.toExponential(4));
  ok('the sweep actually evaluated a substantial grid (not all skipped)', c.evaluated >= 200,
     c.evaluated + ' evaluated, ' + c.skippedSaturated + ' saturated-skipped');
  // a hand-checked anchor: 1 plate, α=2.41, xBot=0.5 — Fenske two ways
  const a = 2.41, N = 1, xb = 0.5;
  ok('walkStaircase(2.41,1,0.5).xTop === fenskeTop(2.41,1,0.5) to 1e-12',
     Math.abs(walkStaircase(a, N, xb).xTop - fenskeTop(a, N, xb)) <= 1e-12);
  // stage is the identity at the endpoints and at α=1
  ok('stage(α,0)===0, stage(α,1)===1, stage(1,x)===x',
     stage(3, 0) === 0 && stage(3, 1) === 1 && stage(1, 0.37) === 0.37);
}

// ── (C) the negative control spelled out per N and xBot ──
console.log('\nthe negative control (α=1 ⇒ no separation, the difference runs the column):');
{
  const dead = LIBRARY.find(e => e.negativeControl);
  ok('the dead library entry derives α === 1 exactly', dead.alpha === 1, 'α=' + dead.alpha);
  let flat = true, worst = 0;
  for(const N of [1, 2, 3, 5, 8, 12, 16, 20])
    for(const xb of [0.05, 0.123456789, 0.3, 0.5, 0.7, 0.9, 0.999]){
      const t = walkStaircase(1, N, xb).xTop;
      if(t !== xb) flat = false;
      worst = Math.max(worst, Math.abs(t - xb));
    }
  ok('walkStaircase(1,N,xBot).xTop === xBot BIT-EXACT for every N & xBot (incl 0.123456789)', flat,
     'worst dev=' + worst);
  // a flame can't fix it: operability never changes the α=1 staircase target
  ok('receiverPurity(1,N,0.5) === 0.5 for all N (no flame, no plate count separates it)',
     [0, 1, 5, 20].every(N => receiverPurity(1, N, 0.5) === 0.5));
}

// ── (D) the α model's properties (labeled, honest — properties not an exact value) ──
console.log('\nthe α model (Clausius–Clapeyron + shared Trouton ΔHvap — a LABELED approximation):');
{
  ok('equal boiling points ⇒ α === 1 EXACTLY', alphaFromBP(353.2, 353.2) === 1 && alphaFromBP(400, 400) === 1);
  ok('lighter boils first (TbL<TbH) ⇒ α > 1', alphaFromBP(353.2, 383.8) > 1 && alphaFromBP(351.5, 373.15) > 1);
  ok('heavier "light" (TbL>TbH) ⇒ α < 1 (the model is signed honestly)', alphaFromBP(383.8, 353.2) < 1);
  // reciprocal symmetry
  const ab = alphaFromBP(353.2, 383.8), ba = alphaFromBP(383.8, 353.2);
  ok('reciprocal-symmetric: α(L,H)·α(H,L) === 1 to 1e-12', Math.abs(ab * ba - 1) <= 1e-12);
  // monotone in the gap
  let mono = true, prev = alphaFromBP(399, 400);
  for(const TbL of [395, 390, 380, 370, 360, 350]){ const a = alphaFromBP(TbL, 400); if(!(a > prev)) mono = false; prev = a; }
  ok('monotone: a wider boiling-point gap ⇒ a larger α', mono);
  // the curated library values are sane (benzene/toluene ≈ 2.4)
  const bt = LIBRARY.find(e => e.id === 'benzene-toluene');
  ok('benzene/toluene library α lands ≈ 2.3–2.5 (textbook range)', bt.alpha > 2.3 && bt.alpha < 2.5, 'α=' + bt.alpha.toFixed(4));
}

// ── (E) the climb, the receiver, the operability machine ──
console.log('\nthe climb, the receiver, and the flame state machine:');
{
  let climb = true;
  for(const alpha of [1.10, 1.90, 4.0]) for(const N of [3, 8]){
    const w = walkStaircase(alpha, N, 0.30);
    for(let i = 0; i < w.x.length - 1; i++) if(!(w.x[i + 1] > w.x[i])) climb = false;
  }
  ok('a real α>1 makes x strictly climb plate-to-plate', climb);
  ok('more plates ⇒ strictly purer distillate (xTop monotone in N)',
     [1.3, 2.41, 4.0].every(a => [0,1,2,5,8].every(N => receiverPurity(a, N + 1, 0.5) > receiverPurity(a, N, 0.5))));
  // operability boundaries
  ok('operability: φ below ' + COLD_THRESH + ' ⇒ cold & never steady',
     operability(0).mode === 'cold' && operability(0.17).mode === 'cold' && operability(0).reachesSteady === false);
  ok('operability: φ in the band ⇒ run & reaches steady',
     operability(COLD_THRESH).mode === 'run' && operability(0.55).mode === 'run' && operability(FLOOD_THRESH).mode === 'run');
  ok('operability: φ above ' + FLOOD_THRESH + ' ⇒ flood with washback rising to 1 at φ=1',
     operability(0.83).mode === 'flood' && operability(1).mode === 'flood' &&
     operability(0.83).washback > 0 && Math.abs(operability(1).washback - 1) < 1e-12);
}

// ── (F) plate composition closes and matches the receiver ──
console.log('\nplate composition closes and the picture reads the core:');
{
  let closes = true, top = true;
  for(const alpha of [1.3, 2.41, 4.0]) for(const N of [1, 3, 8]){
    const pc = plateComposition(alpha, N, 0.5);
    for(const p of pc) if(p.xLight + p.xHeavy !== 1) closes = false;
    if(pc[N + 1].xLight !== receiverPurity(alpha, N, 0.5)) top = false;
  }
  ok('every plate: xLight + xHeavy === 1 exactly', closes);
  ok('the top plate composition === receiverPurity()', top);
}

// ── (G) RE-EXTRACTION PARITY (the integration crux) ──
// Read core.mjs off disk, slice the inline core out of index.html between the SAME
// sentinels the in-page badge uses, strip each leading `export ` AND drop the
// CommonJS guard block (forge's stripModuleGuard does both), and assert the result
// is BYTE-IDENTICAL. The page's pill can NEVER silently drift from this Node twin.
console.log('\nre-extraction parity (page inline core === core.mjs, byte-for-byte):');
{
  const START = '// ===== COLUMN-CORE (byte-identical to core.mjs) =====';
  const END   = '// ===== END COLUMN-CORE =====';
  // mirror forge's stripModuleGuard: drop the `if (typeof module ...)` guard block
  // (single- or multi-line) and strip a leading `export ` keyword on declarations.
  function stripModuleGuard(src){
    const lines = src.split('\n'); const out = [];
    for(let i = 0; i < lines.length; i++){
      let line = lines[i];
      const guardStart = /^\s*if\s*\(\s*typeof\s+module\s*!==\s*['"]undefined['"]\s*&&\s*module\.exports\s*\)/;
      if(guardStart.test(line)){
        let depth = 0, seenBrace = false, j = i;
        for(; j < lines.length; j++){
          for(const ch of lines[j]){ if(ch === '{'){ depth++; seenBrace = true; } else if(ch === '}') depth--; }
          if(seenBrace && depth <= 0) break;
        }
        i = j; continue;
      }
      line = line.replace(/^(\s*)export\s+(?=(default\s+)?(const|let|var|function|class|async)\b)/, '$1');
      out.push(line);
    }
    return out.join('\n');
  }
  let parityOk = false, info = '';
  try{
    const coreSrc = readFileSync(join(__dir, 'core.mjs'), 'utf8').replace(/\r\n/g, '\n');
    const pageSrc = readFileSync(join(__dir, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
    const si = pageSrc.indexOf(START), ei = pageSrc.indexOf(END);
    ok('inline-core sentinels present in index.html', si >= 0 && ei > si,
       si >= 0 && ei > si ? 'slice is ' + (ei - si) + ' chars' : 'MISSING SENTINELS');
    if(si >= 0 && ei > si){
      const inline = pageSrc.slice(si + START.length, ei).replace(/^\n/, '').replace(/\n[ \t]*$/, '');
      const expected = stripModuleGuard(coreSrc).replace(/\n+$/, '');
      parityOk = (inline === expected);
      if(!parityOk){
        const a = inline.split('\n'), b = expected.split('\n');
        let d = -1; for(let i = 0; i < Math.max(a.length, b.length); i++){ if(a[i] !== b[i]){ d = i; break; } }
        info = 'first diff at line ' + (d + 1) + ' (inline ' + a.length + ' lines, core ' + b.length + ')';
      }
    }
  }catch(e){ info = 'parity read failed: ' + e.message; }
  ok('(parity)★ index.html inline core IS core.mjs, byte-for-byte (guard+export-stripped)', parityOk, info);
}

const total = pass + fail;
console.log('\n' + (fail === 0 ? '\x1b[32m' : '\x1b[31m') + pass + '/' + total + (fail === 0 ? ' GREEN' : ' — ' + fail + ' FAILED') + '\x1b[0m\n');
process.exit(fail === 0 ? 0 : 1);
