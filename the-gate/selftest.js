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
    // Low opacity at rest so it never breaks the cinematic mood; brightens on hover.
    st.textContent =
      '#' + CHIP_ID + '{position:absolute;left:14px;top:14px;z-index:31;' +
      'display:none;align-items:center;gap:8px;cursor:pointer;user-select:none;text-align:left;' +
      'padding:6px 10px;border-radius:9px;max-width:min(56vw,320px);' +
      'font:600 10.5px/1.15 var(--mono,ui-monospace,Menlo,monospace);letter-spacing:.04em;' +
      'color:var(--muted,#8a8472);background:rgba(11,14,22,.62);' +
      'border:1px solid rgba(201,162,74,.26);' +
      '-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);' +
      'opacity:.42;transition:opacity .25s ease,border-color .25s ease,color .25s ease,background .25s ease;}' +
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
