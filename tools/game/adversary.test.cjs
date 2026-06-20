#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   adversary.test.cjs — the headless self-test for the solved-games engine.

   Requires the UNSTRIPPED engine + all five game-defs (the same modules forge
   inlines into the page), runs the SAME runSelfTest() core the page's green chip
   calls, and exits non-zero on any failure. This is the proof that ships: a green
   chip in the browser is byte-for-byte the same computation as `node … .cjs`.

   Run:  node tools/game/adversary.test.cjs
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const path = require('path');
const Adversary = require(path.join(__dirname, 'adversary.js'));

const DEF_NAMES = ['nim', 'wythoff', 'ttt333', 'konane', 'hex3', 'mnk443', 'hexapawn', 'chomp'];
const defs = DEF_NAMES.map((n) => require(path.join(__dirname, 'games', n + '.js')));

function main() {
  const t0 = Date.now();
  const res = Adversary.runSelfTest(defs);
  const ms = Date.now() - t0;

  // group by def for readable output
  let lastDef = null;
  for (const c of res.checks) {
    const tag = c.name.split(':')[0];
    if (tag !== lastDef) { console.log('\n── ' + tag + ' ──'); lastDef = tag; }
    const mark = c.pass ? '  \x1b[32m✓\x1b[0m' : '  \x1b[31m✗ FAIL\x1b[0m';
    console.log(mark + ' ' + c.name.replace(tag + ': ', '') + (c.detail ? '  \x1b[2m— ' + c.detail + '\x1b[0m' : ''));
  }

  // ── a few extra cross-cutting assertions beyond runSelfTest's per-def battery ──
  const extra = [];
  // determinism: solving the same def twice yields the same root verdict + node count.
  for (const def of defs) {
    const a = Adversary.solve(def), b = Adversary.solve(def);
    extra.push({
      name: def.id + ': deterministic solve (value+dist+nodeCount stable)',
      pass: a.value === b.value && a.dist === b.dist && a.nodeCount === b.nodeCount,
      detail: a.value + '/' + a.dist + '/' + a.nodeCount + ' twice'
    });
  }
  // randomPlayer determinism: same seed → same first move from the root.
  {
    const def = defs[0];
    const r1 = Adversary.randomPlayer(99), r2 = Adversary.randomPlayer(99);
    const s = def.initState(), mv = def.legalMoves(s);
    const sol = Adversary.solve(def);
    const m1 = r1(s, mv, def, sol), m2 = r2(s, mv, def, sol);
    extra.push({
      name: 'randomPlayer: same seed → same choice (deterministic PRNG)',
      pass: JSON.stringify(m1) === JSON.stringify(m2),
      detail: JSON.stringify(m1)
    });
  }
  // describeForAgent returns a non-empty digest mentioning side-to-move.
  {
    const def = defs[1];
    const txt = Adversary.describeForAgent(def.initState(), def);
    extra.push({
      name: 'describeForAgent: produces a position digest',
      pass: typeof txt === 'string' && /Side to move/.test(txt) && /Legal moves/.test(txt),
      detail: txt.split('\n')[1]
    });
  }
  // llmPlayer is a documented stub (throws if invoked unwired).
  {
    let threw = false;
    try { Adversary.llmPlayer()(null, [], defs[0], null); } catch (e) { threw = /documented stub/.test(e.message); }
    extra.push({ name: 'llmPlayer: documented stub throws when unwired', pass: threw, detail: threw ? 'throws as documented' : 'did NOT throw' });
  }

  if (extra.length) {
    console.log('\n── cross-cutting ──');
    for (const c of extra) {
      const mark = c.pass ? '  \x1b[32m✓\x1b[0m' : '  \x1b[31m✗ FAIL\x1b[0m';
      console.log(mark + ' ' + c.name + (c.detail ? '  \x1b[2m— ' + c.detail + '\x1b[0m' : ''));
    }
  }

  const allChecks = res.checks.concat(extra);
  let pass = 0;
  for (const c of allChecks) if (c.pass) pass++;
  const total = allChecks.length;

  console.log('\n' + (pass === total
    ? '\x1b[32m═══ ' + pass + '/' + total + ' checks PASS ═══\x1b[0m  (' + ms + 'ms)'
    : '\x1b[31m═══ ' + pass + '/' + total + ' — ' + (total - pass) + ' FAILED ═══\x1b[0m  (' + ms + 'ms)'));

  // a compact per-game verdict line
  console.log('\nProven verdicts:');
  for (const def of defs) {
    const sol = res.byDef[def.id];
    if (sol && sol.ok) {
      const dist = sol.dist === Infinity ? '—' : ('mate in ' + sol.dist);
      console.log('  ' + def.id.padEnd(8) + sol.value.padEnd(5) + '  ' + dist.padEnd(11) + '  ' + sol.nodeCount + ' nodes');
    } else {
      console.log('  ' + def.id.padEnd(8) + 'SOLVE FAILED: ' + (sol && sol.error));
    }
  }

  process.exit(pass === total ? 0 : 1);
}

main();
