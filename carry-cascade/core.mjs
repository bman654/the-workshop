/* ═══════════════════════════════════════════════════════════════════════════
   carry-cascade/core.mjs — the SOLE arithmetic authority for THE CARRY CASCADE
   (a touchable adder where you watch a carry topple left, column by column,
   and feel the avalanche LIVE or DIE the instant a column says "no pass").

   It is inlined BYTE-IDENTICAL (between the CARRY-CASCADE CORE BEGIN / CORE END
   sentinels) into carry-cascade/index.html; a Node twin (core.test.mjs) proves
   the inlined copy is identical (indentation-normalised) to this file, so page,
   in-page pill, and twin can never silently drift.

   ── THE ONE IDEA — ADDITION IS A CHAIN OF PERMISSIONS. ─────────────────────
   Add two numbers column by column, right to left. Each column either:
     • GENERATES a carry on its own (a+b ≥ base, regardless of what came in), or
     • PROPAGATES one (a+b == base−1: it passes through any carry it receives), or
     • KILLS it (a+b < base−1: stops any carry dead).
   A carry travels left exactly as far as an unbroken chain of PROPAGATE columns
   reaches back to a GENERATE. That chain is the slow part of the avalanche —
   the longest unbroken run is the ripple DEPTH, and the worst case (all base−1,
   then +1) sweeps the WHOLE row. That is the O(n) ripple-carry adder in every
   CPU's slow path, and the reason real hardware computes every column's g/p flag
   in PARALLEL and resolves all carries in one shot: carry-lookahead.

   ── DIGIT ORDER — LITTLE-ENDIAN. ──────────────────────────────────────────
   Every digit array in this core is LITTLE-ENDIAN: index 0 is the RIGHTMOST
   (units) digit. Carries flow from low index to high index. The renderer flips
   for display; the math never does.

   ── PICTURE == PROOF. ──────────────────────────────────────────────────────
   The animator is a pure CONSUMER of rippleAdd(): the digit it stamps in a
   column is literally that column's `digit`; whether the cascade topples on is
   literally that column's `carryOut`; the look-ahead carries it lights come from
   lookaheadCarries().cin. If this core were wrong the visible wave would be wrong
   in the SAME place. runSelfTest() #5 + the twin's byte-parity assert this crux.

   ── HONEST SCOPE. ───────────────────────────────────────────────────────────
   This is integer addition of two non-negative addends in a fixed base
   (2, 10, or 16 in the scene; the core is general for base ≥ 2). The
   "lookahead is O(1) depth" claim is a DEPTH claim — two logic layers
   (compute-flags, resolve) regardless of n — bought at O(n) gate/wire COST. We
   say so; the speedup is in steps, not free.
   ═══════════════════════════════════════════════════════════════════════════ */

/* CARRY-CASCADE CORE BEGIN — inlined byte-identical into index.html between the
   CARRY-CASCADE CORE BEGIN / CORE END sentinels; core.test.mjs proves parity. */
var CascadeCore = (function () {
  "use strict";

  // ── digit helpers (LITTLE-ENDIAN: index 0 = rightmost) ──────────────────────
  // toDigits(57, 10) -> [7, 5];  toDigits(0, 10) -> [0];  toDigits(255,16) -> [15,15]
  function toDigits(x, base) {
    if (base < 2 || (base | 0) !== base) throw new Error("base must be an integer >= 2");
    x = Math.trunc(x);
    if (x < 0) throw new Error("addends must be non-negative");
    if (x === 0) return [0];
    var out = [];
    while (x > 0) { out.push(x % base); x = Math.floor(x / base); }
    return out;
  }

  // toBigInt(digits, base): the LOSSLESS ground truth (any base, any width).
  // Reads a little-endian digit array back into an exact BigInt value.
  function toBigInt(digits, base) {
    var B = BigInt(base), acc = 0n, pow = 1n;
    for (var i = 0; i < digits.length; i++) {
      acc += BigInt(digits[i]) * pow;
      pow *= B;
    }
    return acc;
  }

  // flags(ai, bi, base): the per-column carry behaviour, INDEPENDENT of carry-in.
  //   generate  ⟺ ai + bi >= base            (makes a carry on its own)
  //   propagate ⟺ ai + bi === base − 1        (passes a carry through, makes none)
  //   (neither) ⟹ kills any incoming carry.
  // generate and propagate are mutually exclusive by construction.
  function flags(ai, bi, base) {
    var s = ai + bi;
    return { generate: s >= base, propagate: s === base - 1 };
  }

  // rippleAdd(a, b, base): THE object both animations step through. The carry
  // ripples right→left (low index→high). Every visible thing is read off here.
  //   columns[i] = { i, ai, bi, carryIn, colSum, digit, carryOut, generate, propagate }
  //   digits     = the little-endian sum (final carry appended if it overflows top)
  //   depth      = the longest unbroken run of consecutive carryOut===1 columns
  //                (the topple count — how far the avalanche actually travels)
  //   events     = ordered [{type:'add'|'topple'|'settle', col}] the scene plays
  //   finalCarry = the carry out of the most-significant column (0 or 1)
  function rippleAdd(a, b, base) {
    var da = toDigits(a, base), db = toDigits(b, base);
    var n = Math.max(da.length, db.length);
    var columns = [], digits = [], events = [];
    var carry = 0;
    var run = 0, depth = 0;            // current unbroken carry-run length, and its max
    for (var i = 0; i < n; i++) {
      var ai = i < da.length ? da[i] : 0;
      var bi = i < db.length ? db[i] : 0;
      var fl = flags(ai, bi, base);
      var carryIn = carry;
      var colSum = ai + bi + carryIn;
      var digit = colSum % base;
      var carryOut = colSum >= base ? 1 : 0;
      columns.push({
        i: i, ai: ai, bi: bi, carryIn: carryIn, colSum: colSum,
        digit: digit, carryOut: carryOut,
        generate: fl.generate, propagate: fl.propagate
      });
      digits.push(digit);
      events.push({ type: "add", col: i });
      if (carryOut === 1) {
        events.push({ type: "topple", col: i });   // a token is born and rides left
        run += 1; if (run > depth) depth = run;
      } else {
        events.push({ type: "settle", col: i });    // the column settles; run breaks
        run = 0;
      }
      carry = carryOut;
    }
    var finalCarry = carry;
    if (finalCarry === 1) {
      digits.push(1);                                // the avalanche spills a new top digit
      events.push({ type: "settle", col: n });       // it lands and settles
    }
    return {
      columns: columns, digits: digits, depth: depth,
      events: events, finalCarry: finalCarry, base: base, n: n
    };
  }

  // rippleDepth(a, b, base): the longest unbroken carry run — the topple count.
  // The single shared definition the WORST-CASE button and the depth test agree on.
  function rippleDepth(a, b, base) {
    return rippleAdd(a, b, base).depth;
  }

  // lookaheadCarries(a, b, base): carry-LOOKAHEAD — every column's g/p flag is
  // computed in PARALLEL (they do NOT depend on carry-in — that is the trick),
  // then carries resolve in one shot by the recurrence
  //     cin[0]   = 0
  //     cin[i+1] = g[i] OR (p[i] AND cin[i]).
  // Returns g, p (length n), cin (length n+1; cin[n] is the carry out of the top),
  // and the SAME little-endian digits rippleAdd produces (asserted digit-for-digit).
  function lookaheadCarries(a, b, base) {
    var da = toDigits(a, base), db = toDigits(b, base);
    var n = Math.max(da.length, db.length);
    var g = new Array(n), p = new Array(n), cin = new Array(n + 1);
    var i, ai, bi, fl;
    for (i = 0; i < n; i++) {
      ai = i < da.length ? da[i] : 0;
      bi = i < db.length ? db[i] : 0;
      fl = flags(ai, bi, base);
      g[i] = fl.generate; p[i] = fl.propagate;
    }
    cin[0] = 0;
    for (i = 0; i < n; i++) {
      cin[i + 1] = (g[i] || (p[i] && !!cin[i])) ? 1 : 0;
    }
    var digits = new Array(n);
    for (i = 0; i < n; i++) {
      ai = i < da.length ? da[i] : 0;
      bi = i < db.length ? db[i] : 0;
      digits[i] = (ai + bi + cin[i]) % base;
    }
    if (cin[n] === 1) digits.push(1);
    return { g: g, p: p, cin: cin, digits: digits, base: base, n: n };
  }

  // lookaheadClosedForm(a, b, base, k): the carry INTO column k, by the closed-form
  //   cin[k] = OR over j<k of ( g[j] AND ( AND over j<i<k of p[i] ) )
  // i.e. "some earlier column j generated, and every column between j and k passed
  // it through". Equivalent to the recurrence above; we assert they agree.
  function lookaheadClosedForm(a, b, base, k) {
    if (k <= 0) return 0;
    var da = toDigits(a, base), db = toDigits(b, base);
    var n = Math.max(da.length, db.length);
    if (k > n) k = n;
    var g = new Array(n), p = new Array(n), i, ai, bi, fl;
    for (i = 0; i < n; i++) {
      ai = i < da.length ? da[i] : 0;
      bi = i < db.length ? db[i] : 0;
      fl = flags(ai, bi, base);
      g[i] = fl.generate; p[i] = fl.propagate;
    }
    // walk j from k−1 down to 0: the run of propagates between j and k must be unbroken
    for (var j = k - 1; j >= 0; j--) {
      if (g[j]) return 1;            // generate here, and every column j<i<k propagated
      if (!p[j]) return 0;           // a kill breaks the chain — no carry reaches k
    }
    return 0;
  }

  // worstCase(n, base): the addend pair that makes the carry sweep the WHOLE row —
  // (base−1 repeated n times) + 1. The ripple depth is then exactly n. The SINGLE
  // shared source the WORST-CASE button and the depth test both read.
  function worstCase(n, base) {
    var B = BigInt(base), big = 0n, pow = 1n;
    for (var i = 0; i < n; i++) { big += BigInt(base - 1) * pow; pow *= B; }
    // a, b are returned as Numbers when safe; for the small n the scene uses they are.
    var aNum = Number(big);
    return { a: aNum, b: 1, base: base, n: n };
  }

  // ── the self-test battery (the page runs the SAME one — the cheap 5 checks) ──
  function runSelfTest() {
    var lines = [];
    function ck(name, ok, detail) { lines.push({ name: name, ok: !!ok, detail: detail || "" }); }

    // (1) base-10, every 2-digit pair (a,b in 0..99): rippleAdd digits === a+b, and
    //     lookahead digits === ripple digits, digit-for-digit. (cheap: 10 000 pairs)
    {
      var ok = true, ff = "";
      for (var a = 0; a <= 99 && ok; a++) {
        for (var b = 0; b <= 99; b++) {
          var r = rippleAdd(a, b, 10);
          var got = Number(toBigInt(r.digits, 10));
          if (got !== a + b) { ok = false; ff = a + "+" + b + " = " + got + " ≠ " + (a + b); break; }
          var la = lookaheadCarries(a, b, 10);
          if (la.digits.length !== r.digits.length) { ok = false; ff = a + "+" + b + ": len " + la.digits.length + " ≠ " + r.digits.length; break; }
          for (var d = 0; d < r.digits.length; d++) {
            if (la.digits[d] !== r.digits[d]) { ok = false; ff = a + "+" + b + ": digit " + d + " la " + la.digits[d] + " ≠ ripple " + r.digits[d]; break; }
          }
          if (!ok) break;
        }
      }
      ck("base-10 every 2-digit pair: ripple digits === a+b AND lookahead === ripple", ok, ff || "all 10 000 pairs agree");
    }

    // (2) closed form === recurrence: for a sample of pairs across bases, the carry
    //     INTO every column from lookaheadClosedForm matches lookaheadCarries().cin.
    {
      var ok2 = true, ff2 = "";
      var bases = [2, 10, 16];
      var samples = [[0, 0], [5, 5], [9, 1], [49, 51], [255, 1], [123, 877], [4095, 1], [7, 8], [88, 12]];
      for (var bi = 0; bi < bases.length && ok2; bi++) {
        var base = bases[bi];
        for (var si = 0; si < samples.length; si++) {
          var aa = samples[si][0], bb = samples[si][1];
          var laC = lookaheadCarries(aa, bb, base);
          for (var k = 0; k <= laC.n; k++) {
            var cf = lookaheadClosedForm(aa, bb, base, k);
            if (cf !== laC.cin[k]) { ok2 = false; ff2 = "base " + base + " " + aa + "+" + bb + " col " + k + ": closed " + cf + " ≠ recurrence " + laC.cin[k]; break; }
          }
          if (!ok2) break;
        }
      }
      ck("closed-form carry === recurrence cin, every column, bases {2,10,16}", ok2, ff2 || "the closed form and the recurrence agree everywhere");
    }

    // (3) worst case: worstCase(n, base) ripples a depth of EXACTLY n (the carry
    //     sweeps the whole row), bases 2/10/16, n=1..6.
    {
      var ok3 = true, ff3 = "";
      var bs = [2, 10, 16];
      for (var x = 0; x < bs.length && ok3; x++) {
        for (var n = 1; n <= 6; n++) {
          var w = worstCase(n, bs[x]);
          var dep = rippleDepth(w.a, w.b, bs[x]);
          if (dep !== n) { ok3 = false; ff3 = "base " + bs[x] + " n=" + n + ": depth " + dep + " ≠ " + n; break; }
        }
      }
      ck("worst case (all base−1, +1) ripple depth === n, bases {2,10,16}, n=1..6", ok3, ff3 || "every worst case sweeps the whole row");
    }

    // (4) neg-control: a lone generate with no propagate chain topples ONE column
    //     then dies — depth 1. base-10 5+5 (units generate, no carry beyond).
    {
      var d10 = rippleDepth(5, 5, 10);
      var d2 = rippleDepth(1, 1, 2);     // base-2: 1+1 = 10, units generate, depth 1
      ck("neg-control: lone generate, no propagate chain → depth 1 (10:5+5, 2:1+1)", d10 === 1 && d2 === 1, "10:" + d10 + " 2:" + d2);
    }

    // (5) PICTURE == PROOF: the digit each event LANDS is literally column.digit, and
    //     the cascade topples iff column.carryOut===1 — verified by reconstructing the
    //     sum row straight from the events/columns the animator consumes (no re-add).
    {
      var ok5 = true, ff5 = "";
      var trios = [[3, 3, 10], [49, 51, 10], [255, 1, 16], [7, 7, 2], [4095, 1, 2], [123, 877, 10]];
      for (var t = 0; t < trios.length && ok5; t++) {
        var aa2 = trios[t][0], bb2 = trios[t][1], base2 = trios[t][2];
        var rr = rippleAdd(aa2, bb2, base2);
        // rebuild the displayed sum purely from what the scene reads: per-column digit,
        // plus the spilled top digit iff finalCarry===1.
        var shown = [];
        for (var c = 0; c < rr.columns.length; c++) shown.push(rr.columns[c].digit);
        if (rr.finalCarry === 1) shown.push(1);
        var val = Number(toBigInt(shown, base2));
        if (val !== aa2 + bb2) { ok5 = false; ff5 = base2 + ": " + aa2 + "+" + bb2 + " rendered " + val; break; }
        // and the topple decisions match the carry chain exactly
        for (var c2 = 0; c2 < rr.columns.length; c2++) {
          var nextIn = c2 + 1 < rr.columns.length ? rr.columns[c2 + 1].carryIn : rr.finalCarry;
          if (rr.columns[c2].carryOut !== nextIn) { ok5 = false; ff5 = base2 + " col " + c2 + ": carryOut ≠ next carryIn"; break; }
        }
      }
      ck("picture == proof: rendered digits (column.digit) reconstruct a+b; topple === carry chain", ok5, ff5 || "what the scene draws IS the trace");
    }

    var pass = lines.filter(function (l) { return l.ok; }).length;
    var total = lines.length;
    var fails = lines.filter(function (l) { return !l.ok; }).map(function (l) { return l.name + (l.detail ? " — " + l.detail : ""); });
    return { pass: pass, total: total, fails: fails, lines: lines };
  }

  return {
    toDigits: toDigits, toBigInt: toBigInt, flags: flags,
    rippleAdd: rippleAdd, rippleDepth: rippleDepth,
    lookaheadCarries: lookaheadCarries, lookaheadClosedForm: lookaheadClosedForm,
    worstCase: worstCase, runSelfTest: runSelfTest
  };
})();
/* CORE END */

export const {
  toDigits, toBigInt, flags,
  rippleAdd, rippleDepth,
  lookaheadCarries, lookaheadClosedForm,
  worstCase, runSelfTest
} = CascadeCore;
export default CascadeCore;
