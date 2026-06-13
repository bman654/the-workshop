#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   turing.test.cjs — the headless self-test for The Mill (the Turing machine).

   Requires the SAME core + program library forge inlines into the page, runs the
   SAME assertions the page's green chip runs, and exits non-zero on any failure.
   A green chip in the browser is byte-for-byte the same computation as this file.

   PROVES the build spec's four claims:
     1. Correct simulator — every (program, input) in the library reproduces its
        hand-derived expected (final tape / state / halted? / step count).
     2. Busy-beaver champions hit their KNOWN values — BB(2)=6 steps/4 ones,
        BB(3)=14 steps/6 ones, BB(4)=107 steps/13 ones (exact S and Σ).
     3. Halting + step-cap — a non-halting machine is reported capped (no hang);
        a halting machine reports halted:true at the right step.
     4. Determinism — same (machine,input) → identical full run twice.

   Run:  node tools/turing/turing.test.cjs
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const path = require('path');
const Turing = require(path.join(__dirname, 'turing.js'));
const Programs = require(path.join(__dirname, 'programs.js'));

const GREEN = '\x1b[32m', RED = '\x1b[31m', DIM = '\x1b[2m', RST = '\x1b[0m';

let pass = 0, fail = 0;
const checks = [];
function check(name, cond, detail) {
  checks.push({ name, pass: !!cond, detail });
  if (cond) pass++; else fail++;
}

/* compare a run result against an expected object (only the keys present). */
function matchExpect(r, expect) {
  for (const k in expect) {
    if (!Object.prototype.hasOwnProperty.call(expect, k)) continue;
    if (r[k] !== expect[k]) return { ok: false, key: k, got: r[k], want: expect[k] };
  }
  return { ok: true };
}

/* ── 1 + 2. Run every program's tests against the live core ─────────────── */
for (const prog of Programs.PROGRAMS) {
  for (const tc of prog.tests || []) {
    if (tc.skip) continue;
    const cap = tc.cap != null ? tc.cap : (prog.maxSteps != null ? prog.maxSteps : 100000);
    const r = Turing.run(prog, tc.input, { maxSteps: cap });
    const m = matchExpect(r, tc.expect);
    const label = prog.id + ' on "' + (tc.input || '∅') + '"';
    const want = JSON.stringify(tc.expect);
    check(
      label + ' → ' + want,
      m.ok,
      m.ok ? ('steps=' + r.steps + ' tape="' + r.tapeString + '" state=' + r.state + ' ones=' + r.onesCount)
           : ('MISMATCH ' + m.key + ': got ' + JSON.stringify(m.got) + ' want ' + JSON.stringify(m.want))
    );
  }
}

/* ── 2 (headline). Busy-beaver champions hit EXACT proven (S, Σ). ─────────── */
const BB_EXPECT = { bb2: { steps: 6, ones: 4 }, bb3: { steps: 14, ones: 6 }, bb4: { steps: 107, ones: 13 } };
for (const id of ['bb2', 'bb3', 'bb4']) {
  const prog = Programs.byId(id);
  const r = Turing.run(prog, '', { maxSteps: 100000 });
  const want = BB_EXPECT[id];
  const ok = r.halted && !r.stuck && r.steps === want.steps && r.onesCount === want.ones;
  check(
    'BUSY BEAVER ' + id.toUpperCase() + ' from blank tape → halts in ' + want.steps + ' steps with ' + want.ones + ' ones',
    ok,
    'halted=' + r.halted + ' stuck=' + r.stuck + ' steps=' + r.steps + ' ones=' + r.onesCount
  );
}

/* ── 3. Halting + step-cap: the non-halting machine is reported, never hangs. */
{
  const forever = Programs.byId('forever');
  const r = Turing.run(forever, '', { maxSteps: 500 });
  check('non-halting machine reported (capped at 500, not halted, no hang)',
        r.capped === true && r.halted === false && r.steps === 500,
        'capped=' + r.capped + ' halted=' + r.halted + ' steps=' + r.steps);
  // a halting machine stops BEFORE the cap and reports halted at the right step
  const r2 = Turing.run(Programs.byId('bb4'), '', { maxSteps: 100000 });
  check('halting machine (bb4) stops at its step before the cap (halted:true at 107)',
        r2.halted === true && r2.steps === 107 && r2.capped === false,
        'halted=' + r2.halted + ' steps=' + r2.steps + ' capped=' + r2.capped);
  // STUCK halting: bininc on a valid input halts via stuck:false (uses an H state),
  // but a machine with no rule for the current symbol halts stuck. Verify the
  // distinction with a tiny ad-hoc machine: state A reads '0' → no rule.
  const stuckM = { blank: '0', start: 'A', halt: 'H', transitions: { A: { '1': Programs.t('1', 'R', 'H') } } };
  const rs = Turing.run(stuckM, '', { maxSteps: 100 });
  check('stuck halt: a missing rule halts the machine (stuck:true, halted:true)',
        rs.halted === true && rs.stuck === true && rs.steps === 0,
        'halted=' + rs.halted + ' stuck=' + rs.stuck + ' steps=' + rs.steps);
}

/* ── 4. Determinism: two identical runs are byte-identical. ───────────────── */
{
  function fingerprint(r) {
    return [r.steps, r.onesCount, r.headPos, r.state, r.halted, r.stuck, r.capped, r.tapeString].join('|');
  }
  let allMatch = true;
  const probes = ['bb2', 'bb3', 'bb4', 'bininc', 'palindrome', 'binpalindrome', 'double', 'unaryadd', 'forever'];
  const inputs = { bininc: '1011', palindrome: 'abba', binpalindrome: '0110', double: '111', unaryadd: '111+11' };
  for (const id of probes) {
    const prog = Programs.byId(id);
    const inp = inputs[id] != null ? inputs[id] : '';
    const cap = prog.maxSteps != null ? prog.maxSteps : 100000;
    const a = Turing.run(prog, inp, { maxSteps: cap });
    const b = Turing.run(prog, inp, { maxSteps: cap });
    if (fingerprint(a) !== fingerprint(b)) allMatch = false;
  }
  check('determinism: every probe machine produces an identical run twice', allMatch);
}

/* ── extra: validate() catches a malformed machine; inventory() collects names. */
{
  const good = Programs.byId('bb2');
  const v = Turing.validate(good);
  check('validate: a library machine validates ok', v.ok, v.errors.join('; '));
  const bad = { blank: '0', start: 'A', halt: 'H', transitions: { A: { '0': { write: '1', move: 'X', next: 'Z' } } } };
  const vb = Turing.validate(bad);
  check('validate: a bad move + unknown next state are flagged', !vb.ok && vb.errors.length >= 2, vb.errors.join('; '));
  const inv = Turing.inventory(good);
  check('inventory: bb2 reports states [A,B,H] and symbols [0,1]',
        inv.states.join(',') === 'A,B,H' && inv.symbols.join(',') === '0,1',
        'states=' + inv.states.join(',') + ' symbols=' + inv.symbols.join(','));
}

/* ── step-by-step vs run() agreement: stepping by hand reaches the same end. */
{
  const prog = Programs.byId('bb3');
  const cfg = Turing.newConfig(prog, '');
  let n = 0;
  while (!cfg.halted && n < 1000) { Turing.step(prog, cfg); n++; }
  const r = Turing.run(prog, '', { maxSteps: 1000 });
  check('step() driven by hand matches run() (bb3: same steps, state, ones)',
        cfg.steps === r.steps && cfg.state === r.state && Turing.onesCount(cfg.tape) === r.onesCount,
        'byhand steps=' + cfg.steps + ' run steps=' + r.steps);
}

/* ── print ────────────────────────────────────────────────────────────────── */
for (const c of checks) {
  const mark = c.pass ? GREEN + '  ✓' + RST : RED + '  ✗ FAIL' + RST;
  console.log(mark + ' ' + c.name + (c.detail ? '  ' + DIM + '— ' + c.detail + RST : ''));
}
console.log('\nThe Mill self-test: ' + pass + '/' + (pass + fail) + ' passed.');
process.exit(fail === 0 ? 0 : 1);
