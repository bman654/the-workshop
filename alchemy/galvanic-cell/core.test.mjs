/* ============================================================================
   core.test.mjs — the Node twin of the Galvanic Cell bench's in-page self-test.

   Run:  node alchemy/galvanic-cell/core.test.mjs

   Proves, for the standard-electrode-potential EMF the page inlines byte-identical,
   the claims the bench makes — and ONLY claims that are honest:
     • E°cell = E°(cathode) − E°(anode), additive over EVERY ordered pair (exact).
     • swap the electrodes ⇒ the sign flips, the magnitude is identical.
     • the Daniell anchor: Cu|Zn = 1.1037 V, reads "1.10"; assign picks Cu cathode.
     • the locked sign convention: left=Zn,right=Cu (Daniell) is spontaneous-positive.
     • Nernst → E°cell exactly at Q=1 (ln1=0); the real −(RT/F)·ln10 per-decade slope.
     • the same-metal NEGATIVE CONTROL: eCell(m,m)===0 exactly, assign.dead (no drive).
     • PERTURBATION teeth: a +0.001 V fudge of every pair FAILS the additivity ===.
     • cellN = lcm of the half-reaction electron counts (Daniell 2, Cu|Al 6).
     • the play-loop LADDER: a spanning set of pairwise SIGNS rebuilds the rack order.
     • the needle map volt2deg is odd & monotonic; flowDir reverses with the sign.
   PLUS a byte-identical re-extraction parity test (page inline core === core.mjs).
   It runs the SAME runSelfTest() body the in-page badge runs, then adds parity.
   Exits non-zero on any failure so CI / a human sees RED.
   ============================================================================ */

import {
  R, F, T_STD, RACK, E0, nOf, eCell, cellOriented, assign, cellN,
  halfReactions, nernst, dialQ, ladderOrder, volt2deg, flowDir, runSelfTest
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

console.log('\n— ALCHEMY LAB · THE GALVANIC CELL · core.test.mjs —\n');

// ── (A) run the SHARED proof body — the same rows the in-page badge shows ──
console.log('the shared runSelfTest() body (badge === Node twin):');
{
  const r = runSelfTest();
  for(const row of r.rows) ok(row.name, row.ok);
  ok('runSelfTest() reports all rows passing', r.pass === r.total && r.total > 0,
     r.pass + '/' + r.total);
}

// ── (B) a few headline facts spelled out separately (independent of the body) ──
console.log('\nheadline facts, recomputed independently of runSelfTest():');
{
  // Daniell number, two ways
  ok('eCell(Cu,Zn) === E0(Cu) − E0(Zn)', eCell('Cu','Zn') === E0('Cu') - E0('Zn'));
  ok('the Daniell cell is exactly 1.1037 V', Math.abs(eCell('Cu','Zn') - 1.1037) <= 1e-12);
  // the most extreme cell on the rack: Au (noble) vs Mg (active)
  const span = eCell('Au','Mg');
  ok('the widest cell Au|Mg = 3.87 V (the honest headroom)', Math.abs(span - 3.87) <= 1e-9, 'got ' + span);
  ok('every real |emf| ≤ 4.0 V (the face scale is honest headroom)', span <= 4.0);
  // sign convention sanity for a reversed Daniell
  ok('cellOriented(Cu,Zn) is NEGATIVE (reversed Daniell placement)', cellOriented('Cu','Zn') < 0);
  ok('cellOriented(Zn,Cu) === −cellOriented(Cu,Zn)', cellOriented('Zn','Cu') === -cellOriented('Cu','Zn'));
}

// ── (C) the half-equations + cellN balance for the Daniell + a 6-electron cell ──
console.log('\nhalf-reactions and the electron count cellN:');
{
  const d = assign('Zn','Cu');             // Cu cathode, Zn anode
  const hr = halfReactions(d.anode, d.cathode);
  ok('Daniell anode oxidation === "Zn → Zn²⁺ + 2e⁻"', hr.ox === 'Zn → Zn²⁺ + 2e⁻', hr.ox);
  ok('Daniell cathode reduction === "Cu²⁺ + 2e⁻ → Cu"', hr.red === 'Cu²⁺ + 2e⁻ → Cu', hr.red);
  ok('cellN(Cu,Zn) === 2', cellN('Cu','Zn') === 2);
  // a cell where the electron counts differ (Al n=3, Cu n=2 ⇒ lcm 6)
  const a = assign('Al','Cu');
  ok('Cu|Al cathode is Cu, anode is Al', a.cathode === 'Cu' && a.anode === 'Al');
  ok('cellN(Cu,Al) === 6 (lcm of 2 and 3)', cellN('Cu','Al') === 6);
  const hr2 = halfReactions('Al','Cu');
  ok('Al anode oxidation === "Al → Al³⁺ + 3e⁻"', hr2.ox === 'Al → Al³⁺ + 3e⁻', hr2.ox);
  // silver: n=1 ⇒ "e⁻" with no coefficient, ion "Ag⁺"
  const hr3 = halfReactions('Cu','Ag');
  ok('Ag cathode reduction === "Ag⁺ + e⁻ → Ag" (n=1 drops the coefficient)',
     hr3.red === 'Ag⁺ + e⁻ → Ag', hr3.red);
}

// ── (D) the Nernst dial: Q=1 is a no-op; the slope is real and signed by dialQ ──
console.log('\nthe Nernst dial (Q from anode/cathode ion concentrations):');
{
  const e0 = eCell('Cu','Zn'), n = cellN('Cu','Zn');
  ok('nernst(E°cell, n, 1) === E°cell exactly (Q=1, ln1=0)',
     Math.abs(nernst(e0, n, 1) - e0) < 1e-12);
  // dialQ wires anode-ion/cathode-ion; richer anode ion (Q>1) lowers E
  ok('dialQ(2,1) === 2 (anode ion richer ⇒ Q>1)', dialQ(2,1) === 2);
  ok('Q>1 lowers E below E°cell; Q<1 raises it',
     nernst(e0, n, dialQ(2,1)) < e0 && nernst(e0, n, dialQ(1,2)) > e0);
  // the slope: drop per decade at n=1 is exactly −(RT/F)·ln10
  const drop = nernst(e0, 1, 10) - e0;
  ok('per-decade drop (n=1) === −(RT/F)·ln10 ≈ −0.059159 V',
     Math.abs(drop - (-(R * T_STD / F) * Math.log(10))) <= 1e-12, 'drop=' + drop);
}

// ── (E) the same-metal negative control, spelled out per metal ──
console.log('\nthe same-metal negative control (the difference, not the metal, runs the cell):');
{
  let allZero = true, allDead = true;
  for(const m of RACK.map(x => x.sym)){
    if(eCell(m, m) !== 0) allZero = false;
    const a = assign(m, m);
    if(!(a.dead === true && a.spontaneous === false)) allDead = false;
    if(flowDir(cellOriented(m, m)) !== 0) allDead = false;
    if(volt2deg(cellOriented(m, m)) !== 0) allDead = false;
  }
  ok('every same-metal cell is exactly 0 V (eCell(m,m)===0)', allZero);
  ok('every same-metal cell is dead: not spontaneous, needle & flow at 0', allDead);
}

// ── (F) RE-EXTRACTION PARITY (the integration crux) ──
// Read core.mjs off disk, slice the inline core out of index.html between the SAME
// sentinels the in-page badge uses, strip each leading `export ` AND drop the
// CommonJS guard block (forge's stripModuleGuard does both), and assert the result
// is BYTE-IDENTICAL. The page's pill can NEVER silently drift from this Node twin.
console.log('\nre-extraction parity (page inline core === core.mjs, byte-for-byte):');
{
  const START = '// ===== GALVANIC-CORE (byte-identical to core.mjs) =====';
  const END   = '// ===== END GALVANIC-CORE =====';
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
