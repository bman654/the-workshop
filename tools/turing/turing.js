/* ═══════════════════════════════════════════════════════════════════════════
   turing.js — The Mill's pure, DOM-free TURING-MACHINE CORE.

   The workshop's first piece of pure COMPUTATION: a single-head, single-tape
   deterministic Turing machine you can watch think. This file is the one source
   of truth — the same engine drives the page's live tape, the page's green
   self-test chip, AND the headless Node test (`turing.test.cjs`). One engine,
   many programs (the Lantern parallel): a MACHINE is supplied as DATA; this
   module just steps it.

   THE MODEL. A machine is a 5-tuple given as a plain object:

     {
       id, name,                       // identity (cosmetic)
       blank: '0',                     // the blank symbol that fills the unbounded tape
       start: 'A',                     // the start state
       halt:  'H' | ['H','Z'],         // halt state(s): a string, an array, or a fn(state)
       transitions: {                  // (state, read) -> action
         'A': { '0': {write:'1', move:'R', next:'B'},
                '1': {write:'1', move:'L', next:'B'} },
         ...
       }
     }

   move is 'L' | 'R' | 'N' (N = stay). A missing (state,read) entry is a STUCK
   transition: the machine halts (no rule fires). Reaching a halt state also stops.

   THE TAPE is a SPARSE dictionary (position int -> symbol). Any cell never
   written reads as `blank`, so the tape is effectively unbounded in both
   directions with O(visited) memory. The head starts at position 0.

   run(machine, input, opts) drives step() to completion or a step cap, returning
   the final tape, head position, state, halted?, step count, and ONES-COUNT
   (the count of non-blank cells — the busy-beaver Σ). It is DETERMINISTIC: the
   same (machine, input) yields a byte-identical run every time.

   Vanilla, ES5-ish, zero-dependency. No DOM, no skin, no render.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Turing = {};

  /* ── halting predicate ──────────────────────────────────────────────────
     machine.halt may be a string, an array of strings, or a function(state).
     Normalize to a predicate isHalt(state). */
  function makeIsHalt(halt) {
    if (typeof halt === 'function') return halt;
    if (Array.isArray(halt)) {
      var set = {};
      for (var i = 0; i < halt.length; i++) set[halt[i]] = true;
      return function (s) { return set[s] === true; };
    }
    if (halt == null) return function () { return false; };
    var only = String(halt);
    return function (s) { return s === only; };
  }

  /* ── tape helpers (sparse dictionary: position -> symbol) ─────────────────
     A Tape is { cells:{}, blank:'0', min:0, max:0 } where min/max track the
     written extent (for rendering / bounds). read() of an unwritten cell
     returns blank; write() stores it (even if == blank, so an explicitly
     written blank still counts as a "visited" cell for extent). */
  function newTape(blank) {
    return { cells: {}, blank: blank, min: 0, max: 0, hasAny: false };
  }

  /* Build a tape from an input string: input[i] -> position i. Symbols are the
     individual characters of the string (so an alphabet of single chars). A
     blank/empty input yields an all-blank tape. */
  function tapeFromInput(input, blank) {
    var t = newTape(blank);
    var s = input == null ? '' : String(input);
    for (var i = 0; i < s.length; i++) {
      t.cells[i] = s.charAt(i);
      if (!t.hasAny) { t.min = i; t.max = i; t.hasAny = true; }
      else { if (i < t.min) t.min = i; if (i > t.max) t.max = i; }
    }
    return t;
  }

  function tapeRead(t, pos) {
    var v = t.cells[pos];
    return v === undefined ? t.blank : v;
  }

  function tapeWrite(t, pos, sym) {
    t.cells[pos] = sym;
    if (!t.hasAny) { t.min = pos; t.max = pos; t.hasAny = true; }
    else { if (pos < t.min) t.min = pos; if (pos > t.max) t.max = pos; }
  }

  /* Count of non-blank cells on the tape — the busy-beaver Σ (number of 1s). */
  function onesCount(t) {
    var n = 0;
    for (var k in t.cells) {
      if (Object.prototype.hasOwnProperty.call(t.cells, k) && t.cells[k] !== t.blank) n++;
    }
    return n;
  }

  /* Render the written extent [fromPos..toPos] as a plain string of symbols.
     Defaults to the tape's recorded extent. Cells outside the dict read blank. */
  function tapeToString(t, fromPos, toPos) {
    var lo = fromPos == null ? t.min : fromPos;
    var hi = toPos == null ? t.max : toPos;
    if (!t.hasAny && fromPos == null) return '';
    var out = '';
    for (var p = lo; p <= hi; p++) out += tapeRead(t, p);
    return out;
  }

  /* Trimmed string: the tape from its first to its last non-blank cell (the
     "meaningful" content). Empty string if all-blank. */
  function tapeTrimmed(t) {
    var lo = null, hi = null;
    for (var k in t.cells) {
      if (!Object.prototype.hasOwnProperty.call(t.cells, k)) continue;
      if (t.cells[k] === t.blank) continue;
      var p = +k;
      if (lo === null || p < lo) lo = p;
      if (hi === null || p > hi) hi = p;
    }
    if (lo === null) return '';
    var out = '';
    for (var i = lo; i <= hi; i++) out += tapeRead(t, i);
    return out;
  }

  /* ── a CONFIG is the full instantaneous description ───────────────────────
       { tape, head, state, steps, halted, stuck, isHalt }
     newConfig builds the start config for (machine, input). */
  function newConfig(machine, input) {
    var isHalt = makeIsHalt(machine.halt);
    var tape = tapeFromInput(input, machine.blank);
    return {
      tape: tape,
      head: 0,
      state: machine.start,
      steps: 0,
      halted: isHalt(machine.start),   // a machine starting in a halt state is already done
      stuck: false,
      isHalt: isHalt,
      lastAction: null                 // {read, write, move, from, to} of the most recent step
    };
  }

  /* ── step ─────────────────────────────────────────────────────────────────
     Advance the config by exactly ONE transition (mutating it in place AND
     returning it, for convenience). If already halted/stuck, it is a no-op.

     The single step:
       1. read the symbol under the head;
       2. look up transitions[state][read]; if absent → STUCK halt (no rule);
       3. write the rule's symbol, move the head L/R/N, enter the next state;
       4. increment the step counter;
       5. if the next state is a halt state, mark halted.
     The action taken is recorded on config.lastAction for the renderer. */
  function step(machine, config) {
    if (config.halted || config.stuck) return config;

    var read = tapeRead(config.tape, config.head);
    var row = machine.transitions[config.state];
    var rule = row ? row[read] : undefined;

    if (!rule) {
      // No rule for (state, read): the machine halts, stuck. (A deliberate,
      // well-defined halting condition — distinct from reaching a halt state.)
      config.stuck = true;
      config.halted = true;
      config.lastAction = { read: read, write: read, move: 'N', from: config.state, to: config.state, stuck: true };
      return config;
    }

    var move = rule.move == null ? 'N' : rule.move;
    var write = rule.write == null ? read : rule.write;
    var next = rule.next == null ? config.state : rule.next;

    tapeWrite(config.tape, config.head, write);
    if (move === 'L') config.head -= 1;
    else if (move === 'R') config.head += 1;
    // 'N' (or anything else) → stay

    config.lastAction = { read: read, write: write, move: move, from: config.state, to: next, stuck: false };
    config.state = next;
    config.steps += 1;

    if (config.isHalt(next)) config.halted = true;
    return config;
  }

  /* ── run ────────────────────────────────────────────────────────────────
     Drive step() from the start config to halt or a step cap. Returns:
       {
         tape,            // the final Tape object
         tapeString,      // trimmed final tape (first..last non-blank), '' if blank
         headPos,         // final head position
         state,           // final state
         halted,          // true iff the machine stopped (halt state OR stuck)
         stuck,           // true iff it stopped because no rule fired
         steps,           // number of transitions executed
         onesCount,       // count of non-blank cells (busy-beaver Σ)
         capped           // true iff we stopped at maxSteps without halting
       }
     opts.maxSteps caps the run (default 100000) so a non-halting machine is
     reported, never hangs. */
  function run(machine, input, opts) {
    opts = opts || {};
    var maxSteps = opts.maxSteps == null ? 100000 : opts.maxSteps;
    var config = newConfig(machine, input);

    while (!config.halted && config.steps < maxSteps) {
      step(machine, config);
    }

    var capped = !config.halted && config.steps >= maxSteps;

    return {
      tape: config.tape,
      tapeString: tapeTrimmed(config.tape),
      headPos: config.head,
      state: config.state,
      halted: config.halted,
      stuck: config.stuck,
      steps: config.steps,
      onesCount: onesCount(config.tape),
      capped: capped
    };
  }

  /* ── acceptance helper ────────────────────────────────────────────────────
     Many decision machines (palindrome, etc.) signal accept/reject by the halt
     STATE they end in. accepts(machine, input, acceptStates, opts) runs and
     returns true iff the final state is in acceptStates (an array or string). */
  function accepts(machine, input, acceptStates, opts) {
    var r = run(machine, input, opts);
    if (!r.halted) return false;
    if (typeof acceptStates === 'string') return r.state === acceptStates;
    if (Array.isArray(acceptStates)) {
      for (var i = 0; i < acceptStates.length; i++) if (r.state === acceptStates[i]) return true;
      return false;
    }
    return false;
  }

  /* ── validate ─────────────────────────────────────────────────────────────
     Light structural check of a machine def: every transition target is a
     known state-or-halt, moves are L/R/N, written symbols are strings. Returns
     { ok, errors:[...] }. Used by the page's editor to flag a bad rule. */
  function validate(machine) {
    var errors = [];
    if (!machine || typeof machine !== 'object') return { ok: false, errors: ['machine is not an object'] };
    if (machine.blank == null) errors.push('missing blank symbol');
    if (machine.start == null) errors.push('missing start state');
    var isHalt = makeIsHalt(machine.halt);
    var states = machine.transitions || {};
    var known = {};
    for (var s in states) if (Object.prototype.hasOwnProperty.call(states, s)) known[s] = true;
    for (var st in states) {
      if (!Object.prototype.hasOwnProperty.call(states, st)) continue;
      var row = states[st];
      for (var rd in row) {
        if (!Object.prototype.hasOwnProperty.call(row, rd)) continue;
        var rule = row[rd];
        if (!rule || typeof rule !== 'object') { errors.push(st + '/' + rd + ': rule is not an object'); continue; }
        var mv = rule.move == null ? 'N' : rule.move;
        if (mv !== 'L' && mv !== 'R' && mv !== 'N') errors.push(st + '/' + rd + ': bad move "' + mv + '"');
        var nx = rule.next == null ? st : rule.next;
        if (!known[nx] && !isHalt(nx)) errors.push(st + '/' + rd + ': next state "' + nx + '" is neither a defined state nor a halt state');
      }
    }
    return { ok: errors.length === 0, errors: errors };
  }

  /* ── alphabet / state inventory (for the editor + renderer) ───────────────
     Collect every state name and every symbol that appears in the machine def
     (states, reads, writes), plus the blank. Returns { states:[...], symbols:[...] }
     in stable, sorted order (blank first among symbols). */
  function inventory(machine) {
    var stSet = {}, sySet = {};
    var trans = machine.transitions || {};
    if (machine.start != null) stSet[machine.start] = true;
    // halt states
    if (typeof machine.halt === 'string') stSet[machine.halt] = true;
    else if (Array.isArray(machine.halt)) { for (var h = 0; h < machine.halt.length; h++) stSet[machine.halt[h]] = true; }
    if (machine.blank != null) sySet[machine.blank] = true;
    for (var s in trans) {
      if (!Object.prototype.hasOwnProperty.call(trans, s)) continue;
      stSet[s] = true;
      var row = trans[s];
      for (var rd in row) {
        if (!Object.prototype.hasOwnProperty.call(row, rd)) continue;
        sySet[rd] = true;
        var rule = row[rd];
        if (rule && rule.write != null) sySet[rule.write] = true;
        if (rule && rule.next != null) stSet[rule.next] = true;
      }
    }
    var states = Object.keys(stSet).sort();
    var symbols = Object.keys(sySet).sort(function (a, b) {
      // blank first, then natural order
      if (a === machine.blank) return -1;
      if (b === machine.blank) return 1;
      return a < b ? -1 : a > b ? 1 : 0;
    });
    return { states: states, symbols: symbols };
  }

  Turing.makeIsHalt = makeIsHalt;
  Turing.newTape = newTape;
  Turing.tapeFromInput = tapeFromInput;
  Turing.tapeRead = tapeRead;
  Turing.tapeWrite = tapeWrite;
  Turing.tapeToString = tapeToString;
  Turing.tapeTrimmed = tapeTrimmed;
  Turing.onesCount = onesCount;
  Turing.newConfig = newConfig;
  Turing.step = step;
  Turing.run = run;
  Turing.accepts = accepts;
  Turing.validate = validate;
  Turing.inventory = inventory;

  // browser global
  if (root) root.Turing = Turing;

  // dual-use module guard (forge strips exactly this braced single line)
  if (typeof module !== 'undefined' && module.exports) { module.exports = Turing; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
