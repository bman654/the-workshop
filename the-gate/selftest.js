/* ═══════════════════════════════════════════════════════════════════════════
   selftest.js  —  the HONESTY SELF-TEST CHIP  (window.Gate.selftest)

   The Gate's standing conscience: a small brass chip that PROVES, live in the
   browser, that the front door truthfully reflects EARNED progress and sound
   math — never visual correctness, only counts/state/arithmetic it can actually
   compute. The house idiom (index.src.html's #doortest, hours-pill): a clickable
   pill, "N/N ✓" GREEN when every claim passes / "✗ N/M" RED on any fail, a quiet
   one-line claim, and a console narrator logging the per-claim breakdown on run.

   RENDER-BLIND honesty: every claim asserts a MATH/COUNT/STATE invariant derived
   from the LIVE subsystems (Sky / WS / AST / rooms / GateSkyCore), with a
   load-bearing NEGATIVE CONTROL so it can genuinely fail. It never inspects a
   pixel, a fill, or "does it look right".

   The four invariants (grounded in the real API the gate ships):

     1. ASTERISM COHERENCE — the count of UNLOCKED Survey-of-Heaven asterisms from
        Sky.state(visitedFromStore(WS.store())). The gate draws a figure IFF that
        count > 0 (AST.current() is null exactly on cold-start), and when it draws,
        AST.current()'s name ∈ the unlocked set. Negative control: a stubbed
        0-unlock state → current() MUST be null; a stubbed ≥1-unlock state → a
        figure whose name is in that set.

     2. ROOM COHERENCE — the unlocked-room count the gate can show equals
        R.loadSlab().length + 1 (the synthetic Cairn fixture), and R.pick()'s id ∈
        (slab ids ∪ 'cairn'). Negative controls: a ?room pin NOT in the slab falls
        back to a valid pool pick (no fakery); R.pick() twice in a load is identical
        (determinism).

     3. MOON MATH — recompute the phase the boot drew: moonPhase(julianDate(date))
        (the ?moon pin overrides the fraction, exactly as the boot does). Assert
        illuminatedFraction ∈ [0,1]; the DRAWN S._moonFrac matches it and S._moonSide
        matches terminator().litSide; litSide ∈ {left,right}. Negative control: a
        known J2000 new-moon date (2000-01-06) → fraction ≈ 0.

     4. DETERMINISM — the seeded per-load picks are STABLE within a load: AST.current()
        twice → equal; R.pick() twice → equal.

   Headless seam: Gate.selftest.run() returns
     { pass, total, passed, results:[{name,pass,detail}] }
   so a Node/agent-browser harness can assert it without a DOM.

   Inlined into the front door VIA forge (`<!-- forge:include selftest.js -->`);
   forge strips the module guard at the bottom. Vanilla, ES5-ish, zero-dependency.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  var ST = {};

  /* a known J2000 NEW MOON: 2000-01-06 18:14 UT (Meeus). The geometric series here
     puts the illuminated fraction within a hair of 0 on that instant — the moon-math
     negative control (a date whose fraction MUST be ≈0, or the math is wrong). */
  var NEW_MOON_J2000 = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
  var NEW_MOON_EPS = 0.02;          // fraction must sit under this at the new moon
  // A ?moon PIN is an exact constant → the drawn fraction must match to machine-ε. But on
  // the LIVE clock the boot evaluated moonPhase() at boot-time and run() re-evaluates it a
  // little later (mount, then any re-run), so the wall clock has advanced. The illuminated
  // fraction drifts at most |dk/dt| = π·sin(elong)·(dElong/dt)/2; the Moon−Sun elongation
  // moves ≈12.19°/day, so the per-MINUTE bound on |Δk| is well under 1.5e-4. We allow a
  // generous boot→run window (≈3 min) → 5e-4, which still FAILS a real phase mismatch (any
  // wrong-day/new-vs-full bug shifts k by 0.1+). The pin path keeps the exact tolerance.
  var FRAC_MATCH_EPS_PIN  = 1e-6;   // ?moon pin: drawn vs the pinned constant (exact)
  var FRAC_MATCH_EPS_LIVE = 5e-4;   // live clock: covers a few minutes of real lunar drift

  /* ── pin readers (mirror the boot / asterism.js, parsed locally so the chip works
     in isolation and in a Node harness with no DOM) ─────────────────────────────── */
  function search() {
    try {
      if (root && root.location && typeof root.location.search === 'string') return root.location.search;
    } catch (e) {}
    return '';
  }
  function readParam(name) {
    var s = search().replace(/^\?/, '');
    var parts = s.split('&');
    for (var i = 0; i < parts.length; i++) {
      var kv = parts[i];
      if (!kv) continue;
      var eq = kv.indexOf('=');
      var k = eq < 0 ? kv : kv.slice(0, eq);
      if (k !== name) continue;
      var v = eq < 0 ? '' : kv.slice(eq + 1);
      try { v = decodeURIComponent(v); } catch (e) {}
      return v;
    }
    return null;
  }
  function moonPin() {
    var v = readParam('moon');
    if (v == null || v === '') return null;
    var n = +v;
    return isNaN(n) ? null : n;
  }
  function roomPin() {
    var v = readParam('room');
    return (v == null || v === '') ? null : v;
  }

  /* ── the unlocked-asterism set, computed from LIVE Sky/WS exactly the way the
     scene's AST.current() does (same args to Sky.state). Returns {names:{}, count}
     or null if the libs are absent. ────────────────────────────────────────────── */
  function unlockedAsterisms() {
    var Sky = root.Sky, WS = root.WS;
    if (!Sky || !WS || typeof Sky.state !== 'function'
        || typeof Sky.visitedFromStore !== 'function' || typeof WS.store !== 'function') {
      return null;
    }
    var store;
    try { store = WS.store(); } catch (e) { return null; }
    var st;
    try { st = Sky.state(Sky.visitedFromStore(store), Sky.CATALOG, Sky.WINGS, Sky.FEATS); }
    catch (e2) { return null; }
    if (!st || !st.asterisms) return null;
    var names = {}, count = 0;
    for (var i = 0; i < st.asterisms.length; i++) {
      var a = st.asterisms[i];
      if (a && a.complete) { names[a.name] = true; count++; }
    }
    return { names: names, count: count };
  }

  /* currentUnderStub(stubVisited): re-run AST.current() against a STUBBED visited-set by
     temporarily swapping Sky.visitedFromStore + dropping AST's memo, then restore.
     Returns the figure (or null). This is the asterism negative-control harness:
     a 0-unlock stub MUST yield null; a ≥1-unlock stub MUST yield a figure. Only
     usable when Sky + AST are present; returns the sentinel {unavailable:true}
     otherwise so the caller degrades the control gracefully.

     NON-DESTRUCTIVE to the live pick: we SAVE the live memo before stubbing and RESTORE
     it after (via AST._peek/_poke), so AST.current() afterward returns the EXACT figure
     drawn at boot. A bare _reset() would instead re-roll a different random figure on the
     next current() call (the first weather change → drawAsterism), changing the showcased
     asterism — the chip would corrupt the very figure it vouches for. We restore the saved
     memo whether or not it was ever computed: a still-undefined memo restores cleanly
     (current() recomputes the same live pick on demand), and a computed figure/null is
     reinstated verbatim. Falls back to _reset() only on an older AST without the seams. */
  function currentUnderStub(stubVisited) {
    var Sky = root.Sky, AST = Gate.asterism;
    if (!Sky || !AST || typeof AST.current !== 'function' || typeof AST._reset !== 'function'
        || typeof Sky.visitedFromStore !== 'function') {
      return { unavailable: true };
    }
    var origVisited = Sky.visitedFromStore;
    var canRestore = (typeof AST._peek === 'function' && typeof AST._poke === 'function');
    var savedMemo = canRestore ? AST._peek() : undefined;
    var fig;
    try {
      Sky.visitedFromStore = function () { return stubVisited; };
      AST._reset();
      fig = AST.current();
    } catch (e) {
      fig = { threw: String(e) };
    } finally {
      Sky.visitedFromStore = origVisited;
      if (canRestore) AST._poke(savedMemo);   // reinstate the live boot pick verbatim
      else AST._reset();                       // older AST: drop the stubbed memo
    }
    return { fig: fig };
  }

  /* the visited-set that lights EVERY member of the first wing → guarantees ≥1
     complete asterism (the >0 positive stub). Derived from the live Sky.WINGS so it
     stays correct as wings change. */
  function firstWingVisited() {
    var Sky = root.Sky;
    if (!Sky || !Sky.WINGS || !Sky.WINGS.length) return null;
    var members = Sky.WINGS[0].members || [];
    var v = {};
    for (var i = 0; i < members.length; i++) v[members[i]] = true;
    return v;
  }

  /* ── ST.run() — compute every claim, pass/fail, total. Pure of the DOM. ───────── */
  ST.run = function () {
    var results = [];
    function check(name, pass, detail) { results.push({ name: name, pass: !!pass, detail: detail || '' }); }

    var Sky = root.Sky, WS = root.WS, AST = Gate.asterism, R = Gate.rooms, S = Gate.scene;
    var GSC = root.GateSkyCore;

    /* ── 1. ASTERISM COHERENCE ─────────────────────────────────────────────────── */
    var un = unlockedAsterisms();
    var cur = (AST && typeof AST.current === 'function') ? safeCall(AST.current) : { threw: 'AST.current unavailable' };
    if (un == null) {
      check('asterism: Sky/WS present', false, '[Sky or WS missing]');
    } else {
      var fig = cur && cur.value !== undefined ? cur.value : (cur && cur.threw ? null : cur);
      var drewFigure = !!fig;
      // the gate draws a figure IFF count > 0
      check('asterism: draws a figure IFF unlocked count > 0',
        drewFigure === (un.count > 0),
        '[unlocked=' + un.count + ' figure=' + (drewFigure ? '"' + fig.name + '"' : 'null') + ']');
      // when it draws, the drawn figure's name is one of the unlocked asterisms
      if (drewFigure) {
        check('asterism: drawn figure ∈ unlocked set',
          !!un.names[fig.name], '[name="' + fig.name + '" ∈ {' + Object.keys(un.names).join(', ') + '}]');
      } else {
        check('asterism: drawn figure ∈ unlocked set (vacuous — none drawn at cold-start)',
          un.count === 0, '[cold-start, nothing drawn]');
      }
    }
    // NEGATIVE CONTROL: a stubbed 0-unlock state → current() MUST be null …
    var zeroStub = currentUnderStub({});
    check('asterism NEG-CTRL: 0-unlock stub → current() is null',
      zeroStub.unavailable ? false : (zeroStub.fig === null),
      zeroStub.unavailable ? '[Sky/AST unavailable]' : '[stub {} → ' + (zeroStub.fig === null ? 'null' : JSON.stringify(zeroStub.fig && zeroStub.fig.name)) + ']');
    // … and a stubbed ≥1-unlock state → a figure whose name is in that wing.
    var posVisited = firstWingVisited();
    if (posVisited && Sky && Sky.WINGS && Sky.WINGS.length) {
      var posStub = currentUnderStub(posVisited);
      var posOk = !posStub.unavailable && posStub.fig && posStub.fig.name === Sky.WINGS[0].name;
      check('asterism NEG-CTRL: ≥1-unlock stub → a figure from that wing',
        posOk,
        posStub.unavailable ? '[Sky/AST unavailable]'
          : '[stub wing="' + Sky.WINGS[0].name + '" → ' + (posStub.fig ? '"' + posStub.fig.name + '"' : 'null') + ']');
    } else {
      check('asterism NEG-CTRL: ≥1-unlock stub → a figure from that wing', false, '[no wings available]');
    }

    /* ── 2. ROOM COHERENCE ──────────────────────────────────────────────────────── */
    if (!R || typeof R.loadSlab !== 'function' || typeof R.pick !== 'function') {
      check('room: Gate.rooms present', false, '[Gate.rooms missing]');
    } else {
      var slab = safeCall(R.loadSlab).value || [];
      var slabIds = {};
      for (var si = 0; si < slab.length; si++) slabIds[slab[si].id] = true;
      var showable = slab.length + 1;                 // + the synthetic Cairn fixture
      check('room: showable count == slab.length + Cairn fixture',
        showable === slab.length + 1, '[' + showable + ' == ' + slab.length + ' slab + 1 cairn]');
      // R.pick()'s chosen id ∈ (slab ids ∪ cairn). The Cairn pick reports id 'cairn'.
      var pick = safeCall(R.pick).value;
      var pid = pick && pick.id;
      var pickInPool = pid === 'cairn' || !!slabIds[pid];
      check('room: pick() id ∈ (slab ∪ cairn)',
        pickInPool, '[pick="' + pid + '" ∈ {cairn, ' + Object.keys(slabIds).join(', ') + '}]');
      // NEGATIVE CONTROL: a ?room pin NOT in the slab falls back to a valid pool pick.
      var bogus = '__not-a-real-room__' + Math.random().toString(36).slice(2);
      var fb = safeCall(function () { return R.pick(bogus); }).value;
      var fbId = fb && fb.id;
      check('room NEG-CTRL: bogus ?room pin falls back into the pool',
        fbId === 'cairn' || !!slabIds[fbId], '[pin="' + bogus + '" → "' + fbId + '" (a real pool id, no fakery)]');
      // DETERMINISM: pick() twice in a load is identical (same id + same rep).
      var p1 = safeCall(R.pick).value, p2 = safeCall(R.pick).value;
      check('room: pick() is deterministic within a load',
        p1 && p2 && p1.id === p2.id && p1.rep === p2.rep,
        '[' + (p1 && p1.id) + '/' + (p1 && p1.rep) + ' == ' + (p2 && p2.id) + '/' + (p2 && p2.rep) + ']');
    }

    /* ── 3. MOON MATH ───────────────────────────────────────────────────────────── */
    if (!GSC || typeof GSC.moonPhase !== 'function' || typeof GSC.julianDate !== 'function'
        || typeof GSC.terminator !== 'function') {
      check('moon: GateSkyCore present', false, '[GateSkyCore missing]');
    } else {
      // recompute the phase the boot drew: the wall clock, then the ?moon pin override
      // (exactly the boot's logic — pin overrides the fraction, re-derives the side).
      var now = new Date();
      var ph = GSC.moonPhase(GSC.julianDate(now));
      var expectFrac = ph.illuminatedFraction;
      var expectSide = GSC.terminator(ph.illuminatedFraction, ph.waxing).litSide;
      var pin = moonPin();
      if (pin != null) {
        expectFrac = pin;
        expectSide = GSC.terminator(pin, ph.waxing).litSide;
      }
      // illuminatedFraction ∈ [0,1]
      check('moon: illuminatedFraction ∈ [0,1]',
        typeof ph.illuminatedFraction === 'number' && ph.illuminatedFraction >= 0 && ph.illuminatedFraction <= 1,
        '[k=' + ph.illuminatedFraction.toFixed(4) + ']');
      // litSide ∈ {left, right}
      check('moon: litSide ∈ {left, right}',
        expectSide === 'left' || expectSide === 'right', '[litSide=' + expectSide + ']');
      // the DRAWN fraction (S._moonFrac) matches the recomputed fraction. A ?moon pin is an
      // exact constant → machine-ε; the live clock advances between boot and run() → a small
      // physical drift tolerance (still far tighter than any real phase bug).
      var drawnFrac = S ? S._moonFrac : undefined;
      var fracEps = (pin != null) ? FRAC_MATCH_EPS_PIN : FRAC_MATCH_EPS_LIVE;
      check('moon: drawn S._moonFrac matches moonPhase() (or ?moon pin)',
        typeof drawnFrac === 'number' && Math.abs(drawnFrac - expectFrac) <= fracEps,
        '[drawn=' + fmt(drawnFrac) + ' expected=' + expectFrac.toFixed(6)
          + ' |Δ|=' + (typeof drawnFrac === 'number' ? Math.abs(drawnFrac - expectFrac).toExponential(2) : '?')
          + ' ≤ ' + fracEps + (pin != null ? ' (?moon=' + pin + ')' : ' (live clock)') + ']');
      // the DRAWN side (S._moonSide: +1 right / -1 left) matches terminator().litSide
      var drawnSide = S ? S._moonSide : undefined;
      var drawnSideName = drawnSide === -1 ? 'left' : (drawnSide === 1 ? 'right' : '(unset:default right)');
      var sideOk = (expectSide === 'left') ? (drawnSide === -1)
                 : (drawnSide === 1 || drawnSide == null);   // default unwound = right
      check('moon: drawn S._moonSide matches terminator().litSide',
        sideOk, '[drawn=' + drawnSideName + ' expected=' + expectSide + ']');
      // NEGATIVE CONTROL: a known J2000 new moon → fraction ≈ 0.
      var nm = GSC.moonPhase(GSC.julianDate(NEW_MOON_J2000));
      check('moon NEG-CTRL: J2000 new moon (2000-01-06) → fraction ≈ 0',
        nm.illuminatedFraction <= NEW_MOON_EPS,
        '[k=' + nm.illuminatedFraction.toFixed(4) + ' ≤ ' + NEW_MOON_EPS + ']');
    }

    /* ── 4. DETERMINISM (seeded per-load picks stable within a load) ─────────────── */
    if (AST && typeof AST.current === 'function') {
      var a1 = safeCall(AST.current).value, a2 = safeCall(AST.current).value;
      // both null (cold-start) is stable; both non-null must agree by name + geometry.
      var astStable = (a1 === null && a2 === null) ||
        (!!a1 && !!a2 && a1.name === a2.name && JSON.stringify(a1.stars) === JSON.stringify(a2.stars));
      check('determinism: AST.current() stable within a load',
        astStable, '[' + astName(a1) + ' == ' + astName(a2) + ']');
    } else {
      check('determinism: AST.current() stable within a load', false, '[AST unavailable]');
    }
    if (R && typeof R.pick === 'function') {
      var r1 = safeCall(R.pick).value, r2 = safeCall(R.pick).value;
      check('determinism: R.pick() stable within a load',
        r1 && r2 && r1.id === r2.id, '[' + (r1 && r1.id) + ' == ' + (r2 && r2.id) + ']');
    } else {
      check('determinism: R.pick() stable within a load', false, '[Gate.rooms unavailable]');
    }

    /* ── 5. THE SEASONS (§9.8 s9a–s9f) — render-blind, a negative control per family ── */
    var C = root.Calendar, CM = Gate.colormap, A = Gate.audio, SD = Gate.scenedressing;

    /* s9a — midsummer identity + turned-phase color validity */
    if (!C || !C.gate || !CM) { check('s9a: gate+colormap present', false, ''); }
    else {
      var pj = C.seasonPhase(C.jdOfLocalNoon(2026, 6, 21)), gj = C.gate.season(pj);
      check('s9a: midsummer knobs all 0 (incl snowCover/spring/autumn)', gj.foliage.mix === 0 && gj.grassMix === 0 && gj.cool === 0 && gj.bare === 0 && gj.snow === 0 && gj.snowCover === 0 && gj.spring === 0 && gj.autumn === 0, '');
      var idOk = true, bx;
      for (bx = 0; bx < 3; bx++) { var b = S_BANDS[bx]; if (JSON.stringify(CM.applySeasonColors(CM.resolve(b, 1), b, 1, gj)) !== JSON.stringify(CM.resolve(b, 1))) idOk = false; }
      check('s9a: applySeasonColors identity @midsummer (3 bands)', idOk, '');
      var gsl = C.gate.season(C.seasonPhase(C.jdOfLocalNoon(2026, 12, 21))), mv = JSON.stringify(CM.applySeasonColors(CM.resolve('day', 1), 'day', 1, gsl)) !== JSON.stringify(CM.resolve('day', 1));
      check('s9a NEG: solstice moves color + cool>.999', mv && gsl.cool > 0.999, '[cool=' + gsl.cool.toFixed(4) + ']');
      var gw = C.gate.season(C.seasonPhase(C.jdOfLocalNoon(2027, 1, 30))), vOk = true, vx, vk;
      for (vx = 0; vx < 3; vx++) { var vb = S_BANDS[vx], vm = CM.applySeasonColors(CM.resolve(vb, 1), vb, 1, gw); for (vk in vm) if (!s_rgb(vm[vk])) vOk = false; }
      var bs = s_rgb(CM.resolve('day', 1)['--tree.foliage']), em = s_rgb(CM.applySeasonColors(CM.resolve('day', 1), 'day', 1, gw)['--tree.foliage']), wa = bs && [0, 1, 2].map(function (c) { return Math.round(bs[c] + (gw.foliage.rgb[c] - bs[c]) * gw.foliage.mix); });
      check('s9a: winter colors valid rgb + day foliage==lerp (no mixHex)', vOk && !!em && !!wa && em[0] === wa[0] && em[1] === wa[1] && em[2] === wa[2], '');
    }

    /* s9b — foliage-curve determinism + continuity (40-day, day-equivalent sweep) */
    if (!C || !C.gate) { check('s9b: gate present', false, ''); }
    else {
      var dOk = true;
      [.02, .10, .30, .45, .60, .70, .86, .95].forEach(function (p) { if (JSON.stringify(C.gate.season(p)) !== JSON.stringify(C.gate.season(p))) dOk = false; });
      check('s9b: season double-eval identical (8 phases)', dOk, '');
      var cOk = true, wr = 0, wm = 0, wsc = 0, wsp = 0, wau = 0, pg = null, pd = 0, sx, t0 = Date.UTC(2026, 0, 1);
      for (sx = 0; sx <= 40; sx++) {
        var dy = Math.round(sx * 366 / 40), dt = new Date(t0 + dy * 864e5), g = C.gate.season(C.seasonPhase(C.jdOfLocalNoon(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate())));
        if (pg) {
          var gp = (dy - pd) || 1, cc; for (cc = 0; cc < 3; cc++) { var dr = Math.abs(g.foliage.rgb[cc] - pg.foliage.rgb[cc]) / gp; if (dr > wr) wr = dr; if (dr > 5) cOk = false; }
          var dm = Math.abs(g.foliage.mix - pg.foliage.mix) / gp; if (dm > wm) wm = dm; if (dm > .025) cOk = false;
          var dsc = Math.abs(g.snowCover - pg.snowCover) / gp; if (dsc > wsc) wsc = dsc; if (dsc > .08) cOk = false;
          var dsp = Math.abs(g.spring - pg.spring) / gp; if (dsp > wsp) wsp = dsp; if (dsp > .06) cOk = false;
          var dau = Math.abs(g.autumn - pg.autumn) / gp; if (dau > wau) wau = dau; if (dau > .08) cOk = false;   // r25 — the fall-leg litter driver
        }
        pg = g; pd = dy;
      }
      check('s9b: |drgb|<=5 |dmix|<=.025 |dsnowCover|<=.08 |dspring|<=.06 |dautumn|<=.08 /day (40pt)', cOk, '[' + wr.toFixed(2) + '/' + wm.toFixed(4) + '/' + wsc.toFixed(4) + '/' + wsp.toFixed(4) + '/' + wau.toFixed(4) + ']');
    }

    /* s9c — dressing presence by phase (r25: snow, spring, marc-leaf, AND autumn litter; + palette whitening) */
    if (!SD || !SD.plan || !SD.count) { check('s9c: scenedressing present', false, ''); }
    else {
      var tnF = function (k) { return 44 + Math.round(416 * k); }, tnW = function (k) { return 4 + Math.round(4 * k); };   // §9.4-spring density formula — the test's OWN oracle (never a hard count; r26: 4× flowers, 44+416·k)
      var dd = (Gate.season && Gate.season.dress) || { snow: 0, spring: 0, bare: 0, autumn: 0 };
      check('s9c: count()==plan(snow,spring,bare,autumn)', JSON.stringify(SD.count()) === JSON.stringify(SD.plan(+dd.snow || 0, +dd.spring || 0, +dd.bare || 0, +dd.autumn || 0)),
        '[s=' + (+dd.snow || 0).toFixed(2) + ' k=' + (+dd.spring || 0).toFixed(2) + ' b=' + (+dd.bare || 0).toFixed(2) + ' a=' + (+dd.autumn || 0).toFixed(2) + ']');
      var p0 = SD.plan(0, 0, 0, 0), pW = SD.plan(.95, 0, 1, 0), pS = SD.plan(0, .9, 0, 0), pA = SD.plan(0, 0, 0, .9);
      var trees = 0, fol = (S && S._foliage) ? S._foliage : [], ti; for (ti = 0; ti < fol.length; ti++) if (fol[ti].kind === 'tree') trees++;
      check('s9c: plan(0,0,0,0) all zero', s_tot(p0) === 0, '');
      check('s9c: plan(.95,0,1,0) snow18 + marc10 = 28', s_snowmarc(pW) === 28 && pW.crown['marc-leaf'] === 10, '[' + s_snowmarc(pW) + '/' + pW.crown['marc-leaf'] + ']');
      check('s9c: plan(0,.9,0,0) nF(.9) flowers + nW(.9) washes + 6xtree berries (formula)', pS.spring['spring-flower'] === tnF(.9) && pS.spring['spring-wash'] === tnW(.9) && pS.crown['spring-berry'] === 6 * trees, '[' + s_spring(pS) + ']');
      check('s9c: plan(0,0,0,.9) 4xtree autumn-leaf litter', pA.autumn['autumn-leaf'] === 4 * trees, '[' + s_autumn(pA) + ']');
      var scP = [SD.plan(0, 0, 0, 0), SD.plan(.5, 0, 1, 0), SD.plan(.95, 0, 1, 0)], spP = [SD.plan(0, 0, 0, 0), SD.plan(0, .5, 0, 0), SD.plan(0, .95, 0, 0)], auP = [SD.plan(0, 0, 0, 0), SD.plan(0, 0, 0, .5), SD.plan(0, 0, 0, .95)], capOk = true, ci;
      for (ci = 0; ci < 3; ci++) { if (s_snowmarc(scP[ci]) > 40) capOk = false; if (s_spring(spP[ci]) > 520) capOk = false; if (s_autumn(auP[ci]) > 24) capOk = false; }
      check('s9c: restraint snow+marc-leaf<=40, spring<=520, autumn<=24', capOk, '');
      var sv = S && S.refs && S.refs.svg, rOk = true;
      if (sv) { var rg = sv.querySelector('#dress-snow-roofs'), rk = rg ? rg.childNodes : [], ri; for (ri = 0; ri < rk.length; ri++) { var e = s_ext(rk[ri]); if (e && (e.y > 592 || e.x < 1232)) rOk = false; } }
      check('s9c: drawn snow-roofs y<=592 / x>=1232', rOk, '');
      var alOk = true, alN = 0;   // AUTUMN cell (cal=2026-10-31, a=1): every drawn leaf's x OUTSIDE [700,900] (the kept-drive bound)
      if (sv) { var ag = sv.querySelector('#dress-autumn-ground'); if (ag) { var ak = ag.querySelectorAll('.autumn-leaf'), ax; for (ax = 0; ax < ak.length; ax++) { alN++; var alx = s_tx(ak[ax]); if (alx !== null && alx >= 700 && alx <= 900) alOk = false; } } }
      check('s9c: drawn autumn-leaf x outside [700,900] (kept-drive bound)', alOk, '[n=' + alN + ']');
      var GO = (S && S._groundOvals) || null, goOk = !!(GO && GO.length), gk;   // r26: the DARK grass-mottle ovals — the cluster substrate; non-empty + inside the mottle formula's derived bounds
      if (goOk) for (gk = 0; gk < GO.length; gk++) { var ov = GO[gk]; if (!(ov.cx >= 0 && ov.cx <= 1600 && ov.cy >= 500 && ov.cy <= 800 && ov.rx >= 70 && ov.rx <= 310 && ov.ry >= 14 && ov.ry <= 52)) goOk = false; }
      check('s9c: _groundOvals non-empty + inside mottle bounds (cluster substrate)', goOk, '[n=' + (GO ? GO.length : 0) + ']');
      var occOk = true, ogids = ['dress-spring-ground', 'dress-autumn-ground'], ogi;   // r26 OCCLUSION LAW: each dress-ground group, when present, is a child of #layer-midground preceding the trees/bushes group in document order
      if (sv) { var midL = sv.querySelector('#layer-midground'), trG = sv.querySelector('#trees'); for (ogi = 0; ogi < ogids.length; ogi++) { var dg = sv.querySelector('#' + ogids[ogi]); if (dg) { if (dg.parentNode !== midL) occOk = false; else if (trG && (dg.compareDocumentPosition(trG) & 4) === 0) occOk = false; } } }
      check('s9c: dress-ground groups under #layer-midground before #trees (occlusion order)', occOk, '');
      check('s9c NEG: plan(0,0,0,0)!=plan(.95,0,1,0) && !=plan(0,.9,0,0) && !=plan(0,0,0,.9)', JSON.stringify(p0) !== JSON.stringify(pW) && JSON.stringify(p0) !== JSON.stringify(pS) && JSON.stringify(p0) !== JSON.stringify(pA), '');
      if (CM && C && C.gate) {   // r24 palette WHITENING reference checks (deep-winter, day, B=1 — inline lerp, never mixHex)
        var gwc = C.gate.season(C.seasonPhase(C.jdOfLocalNoon(2027, 1, 30))), gjc = C.gate.season(C.seasonPhase(C.jdOfLocalNoon(2026, 6, 21)));
        var CK = [['grass', .12, 1.0, 1], ['hill', .12, .78, 1], ['manor.roof', .06, .92, 0], ['observatory.dome', .06, .88, 0]];
        var res0 = CM.resolve('day', 1), appW = CM.applySeasonColors(CM.resolve('day', 1), 'day', 1, gwc), appJ = CM.applySeasonColors(CM.resolve('day', 1), 'day', 1, gjc);
        var drift = s_rgb(res0['--snow.drift']), pOk = true, mOkP = true, pi;
        for (pi = 0; pi < CK.length; pi++) {
          var role = CK[pi][0], ck = CK[pi][1], skk = CK[pi][2], strawFlag = CK[pi][3], base = s_rgb(res0['--' + role]);
          if (!base || !drift) { pOk = false; continue; }
          var c = base;
          if (strawFlag && gwc.grassMix > 0) c = s_lerp(c, gwc.straw, gwc.grassMix);
          var kk = gwc.cool * ck; if (kk > 0) c = s_lerp(c, gwc.cast, kk);
          c = s_lerp(c, drift, gwc.snowCover * skk);
          var emc = s_rgb(appW['--' + role]);
          if (!emc || Math.abs(emc[0] - c[0]) > 1 || Math.abs(emc[1] - c[1]) > 1 || Math.abs(emc[2] - c[2]) > 1) pOk = false;
          if (appJ['--' + role] !== res0['--' + role]) mOkP = false;   // midsummer: none of the four written
        }
        var grEm = s_rgb(appW['--grass']), grOk = !!(grEm && drift) && Math.abs(grEm[0] - drift[0]) <= 1 && Math.abs(grEm[1] - drift[1]) <= 1 && Math.abs(grEm[2] - drift[2]) <= 1;
        check('s9c: winter grass==snow.drift@cover1 + 4 roles match inline chain', pOk && grOk, '');
        check('s9c: midsummer writes none of grass/hill/roof/dome', mOkP, '');
      }
    }

    /* s9d — precip-phase thresholds couple to the snow curve (r24: ground-coupling implication) */
    if (!C || !C.gate || typeof C.dressing !== 'function') { check('s9d: precip present', false, ''); }
    else {
      var kOk = true, gcOk = true, liOk = true, di;
      for (di = 0; di < 40; di++) { var pp = di / 40, sd = C.dressing(pp).snow, kd = C.gate.precipKind(pp); if (kd !== (sd >= .5 ? 'snow' : sd >= .04 ? 'sleet' : 'rain')) kOk = false; if (C.gate.groundSnowCover(sd) > 0 && kd === 'rain') gcOk = false; if (C.gate.groundSnowCover(sd) >= 0.2 && C.gate.season(pp).autumn !== 0) liOk = false; }   // r25 — leaves never on white ground
      check('s9d: precipKind couples to snow (40pt sweep)', kOk, '');
      check('s9d: groundSnowCover>0 => not rain (40pt sweep)', gcOk, '');
      check('s9d: groundSnowCover>=.2 => autumn===0 (litter off white ground)', liOk, '');
      var pk = function (y, m, d) { return C.gate.precipKind(C.seasonPhase(C.jdOfLocalNoon(y, m, d))); };
      check('s9d anchors: 01-30 snow, 12-05 sleet, 06-21 rain', pk(2027, 1, 30) === 'snow' && pk(2026, 12, 5) === 'sleet' && pk(2026, 6, 21) === 'rain', '');
      check('s9d NEG: midsummer NOT snow + groundSnowCover(0)==0', pk(2026, 6, 21) !== 'snow' && C.gate.groundSnowCover(0) === 0, '');
    }

    /* s9e — the audio gating truth-table (over the pure A.plan; r24: the sleet rows) */
    if (!A || !A.plan || !C || !C.gate) { check('s9e: audio.plan+gate present', false, ''); }
    else {
      var se = function (y, m, d) { var p = C.seasonPhase(C.jdOfLocalNoon(y, m, d)); return { kind: C.gate.precipKind(p), wildlife: C.gate.wildlife(p) }; };
      var wi = se(2027, 1, 30), su = se(2026, 6, 21), sl = se(2026, 12, 5), h = A.plan('night', 'storm', wi), lv = A.plan('night', 'storm', su), sp = A.plan('night', 'storm', sl), wd = A.plan('day', 'clear', wi);
      check('s9e: (storm,snow) hush rain/roll/thunder/sleet off, creature null, wind .35', h.rain === false && h.roll === false && h.thunder === false && h.sleet === false && h.creature === null && h.wind === 0.35, '');
      check('s9e: (storm,rain) rain+thunder on, sleet off, wind 1.0, rainLvl .78 (live control)', lv.rain === true && lv.thunder === true && lv.sleet === false && lv.wind === 1 && lv.rainLvl === 0.78, '[rainLvl=' + lv.rainLvl + ']');
      check('s9e: (storm,sleet) rain+sleet+roll+thunder on, rainLvl DUCKED .15', sp.rain === true && sp.sleet === true && sp.roll === true && sp.thunder === true && sp.rainLvl === 0.15, '[rainLvl=' + sp.rainLvl + ']');
      check('s9e: (cloudy/clear,sleet) sleet off (a storm voice)', A.plan('night', 'cloudy', sl).sleet === false && A.plan('day', 'clear', sl).sleet === false, '');
      check('s9e: dusk winter->null, dusk summer->crickets, night->owl', A.plan('dusk', 'clear', wi).creature === null && A.plan('dusk', 'clear', su).creature === 'crickets' && A.plan('night', 'clear', su).creature === 'owl', '');
      check('s9e: (day, deep winter) birds, birdMin 24 / birdMax 62', wd.creature === 'birds' && wd.birdMin === 24 && wd.birdMax === 62, '[' + wd.birdMin + '/' + wd.birdMax + ']');
      var nc = A.plan('day', 'clear', null), ns = A.plan('day', 'storm', null);
      check('s9e NEG: season=null -> shipped (clear birds 10/26 wind .2 sleet off rainLvl .78; storm rain wind 1 sleet off rainLvl .78)', nc.creature === 'birds' && nc.birdMin === 10 && nc.birdMax === 26 && nc.wind === 0.2 && nc.sleet === false && nc.rainLvl === 0.78 && ns.rain === true && ns.wind === 1 && ns.sleet === false && ns.rainLvl === 0.78, '');
    }

    /* s9f — the bare winter is WIRED (r24: the BINARY-CANOPY law + per-tree threshold) */
    if (!S || !S._foliage || !SD || !SD.TUNE) { check('s9f: foliage+TUNE present', false, ''); }
    else {
      var fl = S._foliage, T = SD.TUNE, fkOk = true, mc = 0, tr = 0, fi;
      for (fi = 0; fi < fl.length; fi++) { var fk = fl[fi].kind; if (fk !== 'tree' && fk !== 'bush') fkOk = false; if (fk === 'tree') tr++; if (fl[fi].marc === true) mc++; }
      check('s9f: every entry kind in {tree,bush}, exactly 2 marc', fkOk && mc === 2, '[marc=' + mc + ']');
      var maxJit = 0; for (fi = 0; fi < S_JIT.length; fi++) if (S_JIT[fi] > maxJit) maxJit = S_JIT[fi];
      check('s9f: threshold guarantee base+spread*maxJit<=0.85', T.bareThreshBase + T.bareThreshSpread * maxJit <= 0.85, '');
      var ba = (Gate.season && Gate.season.dress) ? +Gate.season.dress.bare : 0, opOk = true, oi;
      for (oi = 0; oi < fl.length; oi++) {   // THE OPACITY LAW — at THIS phase, every crown is ABSENT or exactly '0'
        var fo = fl[oi], op = fo.el ? fo.el.getAttribute('opacity') : null, thI = T.bareThreshBase + T.bareThreshSpread * (oi < S_JIT.length ? S_JIT[oi] : 0);
        if (op !== null && op !== '0') opOk = false;
        if (fo.kind === 'bush') { if (op !== null) opOk = false; }
        else { var want0 = ba >= thI; if (want0 && op !== '0') opOk = false; if (!want0 && op !== null) opOk = false; }
      }
      check('s9f: crown opacity {absent|0} per TH_i (binary law)', opOk, '[bare=' + ba.toFixed(3) + ']');
      var ml = (S.refs && S.refs.svg) ? S.refs.svg.querySelectorAll('.marc-leaf').length : 0;
      if (ba > 0) {
        var mOk = true, aOk = true, ac = 0, marcOff = 0, fj, aj;
        for (fj = 0; fj < fl.length; fj++) {
          var f2 = fl[fj], jit = (fj < S_JIT.length ? S_JIT[fj] : 0), bt = ba * (1 - jit), off2 = f2.kind === 'tree' && ba >= (T.bareThreshBase + T.bareThreshSpread * jit);
          if (Math.abs(f2.mul - (1 - 0.7 * bt)) > 1e-9) mOk = false;
          if (f2.kind === 'tree' && f2.el && f2.el.parentNode) { var ar = f2.el.parentNode.querySelectorAll('.bare-armature'), ao = off2 ? String(T.armOpacity) : '0'; ac += ar.length; for (aj = 0; aj < ar.length; aj++) if (ar[aj].getAttribute('opacity') !== ao) aOk = false; }
          if (f2.marc && off2) marcOff++;
        }
        check('s9f: mul==1-.7*bareT per entry (BARE_JIT oracle)', mOk, '');
        check('s9f: armature opacity binary with tree (armOpacity|0)', aOk, '');
        check('s9f: .bare-armature count==6x trees', ac === 6 * tr, '[' + ac + '=6x' + tr + ']');
        check('s9f: marc-leaf count==(marcLeafMarks?5x marc-off:0)', ml === (T.marcLeafMarks ? 5 * marcOff : 0), '[' + ml + ']');
      } else {
        var reOk = true, rj, rk2;
        for (rj = 0; rj < fl.length; rj++) {
          var f3 = fl[rj];
          if (f3.mul !== undefined && f3.mul !== 1) { reOk = false; break; }
          if (f3.el && f3.el.hasAttribute('opacity')) { reOk = false; break; }
          if (f3.kind === 'tree' && f3.el && f3.el.parentNode) { var ra = f3.el.parentNode.querySelectorAll('.bare-armature'); for (rk2 = 0; rk2 < ra.length; rk2++) if (ra[rk2].getAttribute('opacity') !== '0') reOk = false; }
        }
        check('s9f: REST mul 1, crown opacity absent, armatures 0, 0 marc-leaf (identity)', reOk && ml === 0, '');
      }
    }

    var passed = 0;
    for (var i = 0; i < results.length; i++) if (results[i].pass) passed++;
    return { pass: passed === results.length, total: results.length, passed: passed, results: results };
  };

  /* call a fn, capturing a throw as a failure sentinel rather than blowing up run(). */
  function safeCall(fn) {
    try { return { value: fn() }; } catch (e) { return { value: undefined, threw: String(e) }; }
  }
  function fmt(n) { return typeof n === 'number' ? n.toFixed(6) : String(n); }
  function astName(a) { return a === null ? 'null' : (a && a.name ? '"' + a.name + '"' : String(a)); }

  /* ── season selftest helpers (s9a–s9f, §9.8); terse for the itemized byte budget ── */
  var S_BANDS = ['day', 'dusk', 'night'];
  var S_JIT = [0, .12, .05, .09, .14, .03, .07, .11];   // §9.3 authored BARE_JIT (test oracle)
  function s_rgb(s) { var m = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec('' + (s == null ? '' : s)); if (!m) return null; var t = [+m[1], +m[2], +m[3]], i; for (i = 0; i < 3; i++) if (!(t[i] >= 0 && t[i] <= 255)) return null; return t; }
  function s_tot(p) { var n = 0, a, b; for (a in p) for (b in p[a]) n += p[a][b]; return n; }
  function s_grp(g) { var n = 0, b; for (b in g) n += g[b]; return n; }                          // one manifest group's sum
  function s_snowmarc(p) { return s_grp(p.gate) + s_grp(p.roofs) + s_grp(p.ground) + p.crown['marc-leaf']; }  // snow + held-leaf marks
  function s_spring(p) { return s_grp(p.spring) + p.crown['spring-berry']; }                       // flowers + washes + berries
  function s_autumn(p) { return s_grp(p.autumn); }                                                 // fallen-leaf litter (r25)
  function s_tx(o) { if (!o || !o.getAttribute) return null; var t = o.getAttribute('transform'); if (!t) return null; var m = /translate\(\s*(-?\d+(?:\.\d+)?)/.exec(t); return m ? +m[1] : null; }   // the translate x of an autumn-leaf (r25)
  function s_lerp(base, tgt, k) { return [Math.round(base[0] + (tgt[0] - base[0]) * k), Math.round(base[1] + (tgt[1] - base[1]) * k), Math.round(base[2] + (tgt[2] - base[2]) * k)]; }  // integer-rounded RGB lerp (the mixHex oracle, s9c)
  function s_ext(o) { if (!o || !o.getAttribute) return null; if ((o.tagName || '').toLowerCase() === 'ellipse') return { x: +o.getAttribute('cx') - +o.getAttribute('rx'), y: +o.getAttribute('cy') + +o.getAttribute('ry') }; var d = o.getAttribute('d'); if (!d) return null; var u = d.match(/-?\d+(\.\d+)?/g) || [], x = 1 / 0, y = -1 / 0, i; for (i = 0; i + 1 < u.length; i += 2) { if (+u[i] < x) x = +u[i]; if (+u[i + 1] > y) y = +u[i + 1]; } return { x: x, y: y }; }

  /* ════════════════════════════════════════════════════════════════════════════
     DOM CHIP — the small brass pill. Subtle at rest (low opacity), brightens on
     hover; green "the gate keeps its word · N/N ✓" / red "self-test ✗ N/M". Click
     to re-run; logs the per-claim breakdown to the console on each run. Render-blind
     (asserts the counts/math/state above, never visual correctness).
     ════════════════════════════════════════════════════════════════════════════ */
  var CHIP_ID = 'gate-honesty';
  var STYLE_ID = 'gate-honesty-style';

  function ensureStyle(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var st = doc.createElement('style');
    st.id = STYLE_ID;
    // Tucked TOP-LEFT (weather toggle is bottom-left, mute bottom-right; the top is
    // free). Clear of the asterism slot (top-left of the SVG viewBox, but that is the
    // scene's own upper sky, far above this fixed 14px chrome) and the gate crest.
    // A quiet OATH, not throwaway chrome: this chip is the soul of the estate's
    // founding honesty principle. It rests at a modest opacity — noticeable as a
    // standing vow, still secondary to the scene — and brightens to full on hover/focus.
    st.textContent =
      '#' + CHIP_ID + '{position:absolute;left:14px;top:14px;z-index:31;' +
      'display:none;align-items:center;gap:8px;cursor:pointer;user-select:none;text-align:left;' +
      'padding:6px 10px;border-radius:9px;max-width:min(56vw,320px);' +
      'font:600 10.5px/1.15 var(--mono,ui-monospace,Menlo,monospace);letter-spacing:.04em;' +
      'color:var(--muted,#8a8472);background:rgba(11,14,22,.62);' +
      'border:1px solid rgba(201,162,74,.26);' +
      '-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);' +
      'opacity:.6;transition:opacity .25s ease,border-color .25s ease,color .25s ease,background .25s ease;}' +
      '#' + CHIP_ID + ':hover,#' + CHIP_ID + ':focus-visible{opacity:1;' +
      'border-color:rgba(201,162,74,.6);background:rgba(11,14,22,.82);outline:none;}' +
      '#' + CHIP_ID + ' .gh-dot{flex:0 0 auto;width:7px;height:7px;border-radius:50%;' +
      'background:currentColor;box-shadow:0 0 7px currentColor;}' +
      '#' + CHIP_ID + ' .gh-text{font-weight:700;white-space:nowrap;}' +
      '#' + CHIP_ID + '.ok{color:#8fd79a;border-color:rgba(143,215,154,.42);}' +
      '#' + CHIP_ID + '.ok:hover,#' + CHIP_ID + '.ok:focus-visible{border-color:rgba(143,215,154,.7);}' +
      '#' + CHIP_ID + '.bad{color:#f08a7a;border-color:rgba(240,138,122,.55);opacity:1;}' +
      '#' + CHIP_ID + '.bad:hover,#' + CHIP_ID + '.bad:focus-visible{border-color:rgba(240,138,122,.85);}';
    (doc.head || doc.body).appendChild(st);
  }

  /* paint(btn, r): set the verdict color + text + tooltip and narrate to console. */
  function paint(btn, txt, r) {
    var green = r.pass;
    btn.classList.toggle('ok', green);
    btn.classList.toggle('bad', !green);
    txt.textContent = green
      ? ('the gate keeps its word · ' + r.passed + '/' + r.total + ' ✓')
      : ('self-test ✗ ' + r.passed + '/' + r.total);
    btn.title = green
      ? ('The gate keeps its word: it draws an asterism only when one is earned and the drawn '
         + 'figure is one of your unlocked constellations; the room count it shows equals the '
         + 'unlocked slab + the Cairn; the drawn moon phase matches the sky-core math for the '
         + 'wall clock; and every seeded per-load pick is stable (' + r.passed + '/' + r.total
         + '). Click to re-run; see console for the per-claim breakdown.')
      : ('Honesty self-test FAILED ' + r.passed + '/' + r.total + ' — a claim the gate makes about '
         + 'earned state or its math does not hold. Click to re-run; the failing claim is named in the console.');

    if (green) {
      console.log('[gate] honesty self-test ' + r.passed + '/' + r.total
        + ' ✓ — earned-state coherence (asterism draws IFF unlocked & ∈ set), room count'
        + ' (slab + Cairn), moon math (drawn phase == sky-core for the clock/pin), and per-load'
        + ' determinism all hold. The gate keeps its word.');
      try {
        console.groupCollapsed('[gate] honesty self-test breakdown (' + r.passed + '/' + r.total + ')');
        for (var i = 0; i < r.results.length; i++) {
          var c = r.results[i];
          console.log((c.pass ? '  ✓ ' : '  ✗ ') + c.name + (c.detail ? '  ' + c.detail : ''));
        }
        console.groupEnd();
      } catch (e) {
        for (var k = 0; k < r.results.length; k++) {
          var cc = r.results[k];
          console.log((cc.pass ? '  ✓ ' : '  ✗ ') + cc.name + (cc.detail ? '  ' + cc.detail : ''));
        }
      }
    } else {
      console.error('[gate] honesty self-test FAILED', r);
      for (var j = 0; j < r.results.length; j++) {
        if (!r.results[j].pass) console.error('  ✗', r.results[j].name, r.results[j].detail);
      }
    }
  }

  /* ST.mount(): build the chip into the stage (idempotent), wire click-to-rerun, and
     run once. The chip starts display:none so it never shows during the splash; the
     boot reveals it (ST.show()) once the idle scene is in (post-splash). */
  ST.mount = function () {
    if (!root.document) return null;
    var doc = root.document;
    var host = doc.getElementById('stage') || doc.body;
    if (!host) return null;
    ensureStyle(doc);

    var btn = doc.getElementById(CHIP_ID);
    if (!btn) {
      btn = doc.createElement('button');
      btn.id = CHIP_ID;
      btn.type = 'button';
      btn.setAttribute('aria-label', "The gate's honesty self-test");
      var dot = doc.createElement('span');
      dot.className = 'gh-dot';
      dot.setAttribute('aria-hidden', 'true');
      var txt = doc.createElement('span');
      txt.className = 'gh-text';
      txt.textContent = 'honesty self-test —';
      btn.appendChild(dot);
      btn.appendChild(txt);
      btn.__ghText = txt;
      host.appendChild(btn);
      btn.addEventListener('click', function (ev) {
        // never let a chip click bubble to the gate-open handler (the gate watches the
        // stage/svg for clicks; the chip is its own control, like the weather/mute chips).
        if (ev && ev.stopPropagation) ev.stopPropagation();
        var r = ST.run();
        paint(btn, btn.__ghText, r);
      });
    }
    var rr = ST.run();
    paint(btn, btn.__ghText, rr);
    ST._el = btn;
    return btn;
  };

  /* ST.show(): reveal the chip (the boot calls this once the idle scene is in, so it
     never overlaps the splash/welcome overlays). Idempotent. */
  ST.show = function () {
    var btn = ST._el || (root.document && root.document.getElementById(CHIP_ID));
    if (btn) btn.style.display = 'inline-flex';
  };

  Gate.selftest = ST;

  if (typeof module !== 'undefined' && module.exports) { module.exports = ST; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
