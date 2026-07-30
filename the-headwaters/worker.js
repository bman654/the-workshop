/* ═══════════════════════════════════════════════════════════════════════════
   THE HEADWATERS · worker.js
   The geology runs off the main thread, so the camera never stutters while a
   million years goes by. This file is spliced into a <script> tag alongside
   erode.mjs and handed to a Worker as a blob; nothing is fetched.

   Buffers are recycled: the page hands each snapshot's arrays back when it has
   uploaded them, so a landscape running at fifty steps a second is not also
   allocating a megabyte of garbage every frame.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  let st = null;
  let opts = { N: 256, dx: 40 };
  let running = true;
  let stepsPerSec = 1e9;                 /* the clock; 0 = paused */
  let carry = 0;
  let lastTick = 0, lastPost = 0, lastStats = 0;
  const pool = [];
  let ordBuf = null, wetBuf = null, spreadBuf = null;
  let ab = null;                          /* the deletion demo, when running */

  function take(NN) {
    for (let i = 0; i < pool.length; i++) {
      const p = pool[i];
      if (p.h.length === NN) { pool.splice(i, 1); return p; }
    }
    return { h: new Float32Array(NN), w: new Float32Array(NN), o: new Uint8Array(NN) };
  }

  function build(o) {
    opts = Object.assign({}, opts, o || {});
    st = makeLand(opts);
    ordBuf = new Int32Array(st.NN);
    wetBuf = new Float32Array(st.NN);
    spreadBuf = new Uint8Array(st.NN);
    carry = 0;
    postMessage({
      type: 'grid', N: st.N, dx: st.dx, aCrit: st.aCrit,
      cellsAcross: st.N, seed: st.seed
    });
    postFrame(true);
    postStats();
  }

  function relief() { let mx = 0; for (let i = 0; i < st.NN; i++) if (st.h[i] > mx) mx = st.h[i]; return mx; }
  function landCells(s) { let n = 0; for (let i = 0; i < s.NN; i++) if (s.land[i]) n++; return n; }

  function postFrame(force) {
    const NN = st.NN;
    const buf = take(NN);
    ribbon(st, wetBuf);
    const nw = network(st, { order: ordBuf });
    orderSpread(st, ordBuf, spreadBuf);
    for (let i = 0; i < NN; i++) {
      buf.h[i] = st.land[i] ? st.h[i] : st.bed[i];
      buf.w[i] = wetBuf[i];
      buf.o[i] = Math.min(255, spreadBuf[i] * 30);   /* order, 30 per step */
    }
    postMessage({
      type: 'frame', h: buf.h, w: buf.w, o: buf.o,
      t: st.t, steps: st.steps, maxH: relief(), dhdt: st.dhdt, U: st.U,
      heads: nw.heads, omax: nw.omax
    }, [buf.h.buffer, buf.w.buffer, buf.o.buffer]);
  }

  function postStats() {
    const hk = hack(st);
    const nw = network(st, { order: ordBuf });
    let vol = 0;
    for (let i = 0; i < st.NN; i++) if (st.land[i]) vol += st.h[i];
    postMessage({
      type: 'stats',
      t: st.t, steps: st.steps, maxH: relief(), dhdt: st.dhdt, U: st.U,
      balance: st.dhdt / st.U,
      meanH: vol / Math.max(1, landCells(st)),
      hack: {
        h: hk.h, r2: hk.r2, hPoint: hk.hPoint, n: hk.n, nbins: hk.nbins,
        decades: hk.decades, bins: hk.bins, aMin: hk.aMin, aMax: hk.aMax
      },
      horton: {
        Rb: nw.Rb, RbR2: nw.RbR2, Rl: nw.Rl, omax: nw.omax,
        counts: nw.counts, meanLen: nw.meanLen, heads: nw.heads,
        density: nw.density, totalLen: nw.totalLen
      },
      K: st.K, U: st.U, D: st.D, m: st.m, dx: st.dx, N: st.N, seed: st.seed
    });
  }

  /* ── the deletion: the same seed, the same rock, the same clock ───────── */
  function abStart(msg) {
    const N = msg.N || 128;
    const dx = st.dx * st.N / N;
    const base = {
      N, dx, K: st.K, U: st.U, D: st.D, m: st.m, dt: st.dt,
      seed: st.seed, aCritCells: 20
    };
    ab = {
      A: makeLand(Object.assign({}, base)),
      B: makeLand(Object.assign({}, base, { waterRemembers: false })),
      target: msg.steps || 1100, done: 0, lastPost: 0
    };
    postMessage({ type: 'ab-begin', N, dx, target: ab.target });
  }
  function abTick(msMax) {
    const t0 = performance.now();
    while (ab.done < ab.target && performance.now() - t0 < msMax) {
      step(ab.A); step(ab.B); ab.done++;
    }
    const now = performance.now();
    const finished = ab.done >= ab.target;
    if (finished || now - ab.lastPost > 140) {
      ab.lastPost = now;
      const NN = ab.A.NN;
      const a = new Float32Array(NN), b = new Float32Array(NN);
      for (let i = 0; i < NN; i++) {
        a[i] = ab.A.land[i] ? ab.A.h[i] : -9999;
        b[i] = ab.B.land[i] ? ab.B.h[i] : -9999;
      }
      const msg = {
        type: finished ? 'ab-done' : 'ab-frame',
        a, b, done: ab.done, target: ab.target,
        t: ab.A.t, N: ab.A.N, dx: ab.A.dx
      };
      if (finished) {
        const ka = hack(ab.A), kb = hack(ab.B);
        const na = network(ab.A), nb = network(ab.B);
        msg.stats = {
          A: { r2: ka.r2Point, h: ka.h, heads: na.heads, Rb: na.Rb, omax: na.omax, hyp: hyps(ab.A), relief: rel(ab.A) },
          B: { r2: kb.r2Point, h: kb.h, heads: nb.heads, Rb: nb.Rb, omax: nb.omax, hyp: hyps(ab.B), relief: rel(ab.B) }
        };
      }
      postMessage(msg, [a.buffer, b.buffer]);
    }
    if (finished) ab = null;
  }
  function hyps(s) {
    let sum = 0, mx = 0, n = 0;
    for (let i = 0; i < s.NN; i++) if (s.land[i]) { sum += s.h[i]; n++; if (s.h[i] > mx) mx = s.h[i]; }
    return sum / Math.max(1, n) / Math.max(1e-9, mx);
  }
  function rel(s) { let mx = 0; for (let i = 0; i < s.NN; i++) if (s.h[i] > mx) mx = s.h[i]; return mx; }

  /* ── the loop ─────────────────────────────────────────────────────────── */
  function tick() {
    const now = performance.now();
    const dtReal = Math.min(0.25, (now - lastTick) / 1000 || 0);
    lastTick = now;

    if (ab) {
      abTick(13);
    } else if (st && running && stepsPerSec > 0) {
      let want;
      if (stepsPerSec >= 1e8) want = 1e9;
      else { carry += stepsPerSec * dtReal; want = Math.floor(carry); carry -= want; }
      const t0 = performance.now();
      let n = 0;
      while (n < want && performance.now() - t0 < 13) { step(st); n++; }
    }
    if (st && now - lastPost > 42) { lastPost = now; postFrame(); }
    if (st && now - lastStats > 700) { lastStats = now; postStats(); }
    setTimeout(tick, 0);
  }

  onmessage = function (e) {
    const d = e.data;
    switch (d.type) {
      case 'init': build(d.opts); lastTick = performance.now(); tick(); break;
      case 'reset': build(Object.assign({}, opts, d.opts || {})); break;
      case 'recycle':
        if (pool.length < 4) pool.push({ h: d.h, w: d.w, o: d.o });
        break;
      case 'params': {
        if (!st) break;
        if (d.K !== undefined) st.K = d.K;
        if (d.U !== undefined) st.U = d.U;
        if (d.D !== undefined) st.D = d.D;
        if (d.waterRemembers !== undefined) st.waterRemembers = d.waterRemembers;
        if (d.running !== undefined) running = d.running;
        if (d.stepsPerSec !== undefined) stepsPerSec = d.stepsPerSec;
        postStats();
        break;
      }
      case 'drop': {
        if (!st) break;
        const p = flowPath(st, d.cell);
        const L = flowLength(st);
        const nw = network(st, { order: ordBuf });
        let len = 0;
        for (let i = 1; i < p.length; i++) len += linkLen(st, p[i - 1], p[i]);
        const mouth = p[Math.max(0, p.length - 2)];
        postMessage({
          type: 'path', cells: Int32Array.from(p), id: d.id, length: len,
          area: st.area[d.cell], mouthArea: st.area[mouth],
          order: ordBuf[mouth] || 0, upstream: L[d.cell]
        }, []);
        break;
      }
      case 'rain': {
        if (!st) break;
        /* every drop on the island at once: n paths, packed flat */
        const n = d.n || 300;
        const r = rng((d.seed || 1) >>> 0);
        const heads = [], counts = [];
        let total = 0;
        /* start every drop where rain actually starts a journey — on a
           hillslope with a long way to run — so the whole tree lights up
           rather than four hundred puddles beside the beach. */
        for (let k = 0; k < n * 40 && heads.length < n; k++) {
          const i = (r() * st.NN) | 0;
          if (!st.land[i] || st.area[i] > 6 * st.dx * st.dx) continue;
          const p2 = flowPath(st, i);
          if (p2.length < 40) continue;
          heads.push(p2); counts.push(p2.length); total += p2.length;
        }
        const cells = new Int32Array(total);
        let w = 0;
        for (const p2 of heads) for (let j = 0; j < p2.length; j++) cells[w++] = p2[j];
        postMessage({ type: 'rain', cells, counts: Int32Array.from(counts) },
          [cells.buffer]);
        break;
      }
      case 'ab': abStart(d); break;
      case 'ab-cancel': ab = null; break;
      case 'stats': postStats(); break;
    }
  };
})();
