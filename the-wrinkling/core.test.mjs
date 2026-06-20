// The Wrinkling — Node twin. Steps the SAME engine that index.html inlines, over many iterations,
// and asserts the one honest invariant (a simple closed polygon stays simple) plus the structural
// promises (cap holds; arc-length grows while the room is fixed; the accelerated checker has no
// blind spots vs a brute reference; the geometry export is sane; the inlined CORE is byte-identical
// to core.mjs). This is generative art — it makes no math claim, so there is no "proof"; the
// invariant is a conscience, and a SILENTLY-GREEN checker would be the real failure, so check #2/#3
// are deliberately discriminating negative controls.
//
// Run:  node core.test.mjs
import {
  mulberry32, makeState, makeHash, hashCell, rebuildHash, step,
  isSimple, firstIntersection, segInt,
  geometry, arcLength, stats, _orient,
  DEFAULTS,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
function ck(name, cond){ if (cond){ pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name); } }

// ─────────────────────────────────────────────────────────────────────────────────────────────
// helpers
function freshLoop(opts){
  return makeState(Object.assign({ cx: 450, cy: 450, R: 9, startRadius: 60, seedNodes: 64, cap: 1200 }, opts || {}));
}
// a brute O(n^2) reference: the first non-adjacent crossing pair, or null. The ground truth.
function bruteFirstIntersection(st){
  const n = st.n, px = st.px, py = st.py;
  for (let i = 0; i < n; i++){
    const j = (i + 1) % n;
    for (let e = i + 1; e < n; e++){
      const f = (e + 1) % n;
      if (e === j) continue;
      if (f === i) continue;             // adjacent (shares the i endpoint)
      if (segInt(px[i], py[i], px[j], py[j], px[e], py[e], px[f], py[f])) return { a: i, b: e };
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// 1. INVARIANT HOLDS: from a clean circle, step many frames at HIGH crowding, isSimple true on ALL
//    frames; repeat across a few mulberry32 seeds and a couple of canvas sizes.
console.log('\n1. invariant holds over a long high-crowding run (multi-seed, multi-size)');
{
  let allSimple = true, everCrossed = false, framesRun = 0;
  const sizes = [ { R: 9, cx: 450, cy: 450, startRadius: 60 }, { R: 6, cx: 300, cy: 300, startRadius: 42 } ];
  for (const sz of sizes){
    for (const seed of [1, 7, 42]){
      const st = freshLoop(Object.assign({ seedNodes: 64, cap: 900 }, sz));
      const H = makeHash(hashCell(st.R));
      const rng = mulberry32(seed);
      const params = { crowding: 1.0, obstacles: [], obK: 0, dt: 1/60 };
      for (let f = 0; f < 2000; f++){
        step(st, H, params, rng);
        framesRun++;
        if (!st.simple){ allSimple = false; }
        // also independently re-check (don't just trust state.simple)
        if (firstIntersection(st, H) !== null) everCrossed = true;
      }
    }
  }
  ck('isSimple stayed true on every frame across seeds+sizes (' + framesRun + ' frames)', allSimple);
  ck('independent firstIntersection never fired during the clean runs', !everCrossed);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// 2. DISCRIMINATING NEGATIVE CONTROL: build an explicit self-crossing loop, assert isSimple===false
//    AND firstIntersection returns the correct (brute-confirmed) pair. A checker that can't see a
//    bowtie is worthless.
console.log('\n2. negative control — an explicit self-crossing loop is DETECTED');
{
  // a clean square (simple)
  const sq = makeState({ cx: 0, cy: 0, R: 9, startRadius: 0, seedNodes: 0, cap: 16 });
  function setLoop(pts){
    sq.n = 0;
    for (const [x, y] of pts){ sq.px[sq.n] = x; sq.py[sq.n] = y; sq.age[sq.n] = 99; sq.n++; }
  }
  setLoop([[0,0],[100,0],[100,100],[0,100]]);
  const Hs = makeHash(40); rebuildHash(Hs, sq);
  ck('a clean square is simple', isSimple(sq, Hs));

  // a bowtie: swap two distant corners so the figure crosses itself
  setLoop([[0,0],[100,100],[100,0],[0,100]]);
  rebuildHash(Hs, sq);
  const got = firstIntersection(sq, Hs);
  const brute = bruteFirstIntersection(sq);
  ck('bowtie reports NOT simple', !isSimple(sq, Hs));
  ck('bowtie firstIntersection returns a pair', got !== null);
  ck('bowtie pair matches the brute ground truth',
     got && brute && got.a === brute.a && got.b === brute.b);

  // a second control: a long loop with two DISTANT nodes swapped (a real fold-over)
  const big = freshLoop({ seedNodes: 80, cap: 200 });
  const Hb = makeHash(big.R); rebuildHash(Hb, big);
  ck('the seed ring (before any swap) is simple', isSimple(big, Hb));
  const i1 = 10, i2 = 50;                      // distant indices
  const tx = big.px[i1], ty = big.py[i1];
  big.px[i1] = big.px[i2]; big.py[i1] = big.py[i2];
  big.px[i2] = tx; big.py[i2] = ty;
  rebuildHash(Hb, big);
  const gotBig = firstIntersection(big, Hb);
  const bruteBig = bruteFirstIntersection(big);
  ck('distant-swap fold-over is detected (NOT simple)', !isSimple(big, Hb));
  ck('distant-swap: hash and brute agree on existence', (gotBig !== null) === (bruteBig !== null));
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// 3. HASH==BRUTE PARITY: on small loops the hash-accelerated firstIntersection agrees with brute
//    O(n^2) across many random AND many deliberately-crossed loops (the acceleration has no blind
//    spots). We compare EXISTENCE (both find a crossing or both find none) over a large sample.
console.log('\n3. hash firstIntersection === brute reference (existence parity, many loops)');
{
  let agree = 0, total = 0, sawCrossed = 0, sawClean = 0;
  // (a) physically-grown loops (always clean) — these exercise the realistic geometry
  for (let seed = 1; seed <= 12; seed++){
    const st = freshLoop({ seedNodes: 40, cap: 200, R: 9 });
    const H = makeHash(hashCell(st.R));
    const rng = mulberry32(seed);
    const params = { crowding: 0.9, obstacles: [], obK: 0, dt: 1/60 };
    for (let f = 0; f < 120; f++) step(st, H, params, rng);
    rebuildHash(H, st);
    const a = (firstIntersection(st, H) !== null), b = (bruteFirstIntersection(st) !== null);
    total++; if (a === b) agree++; if (b) sawCrossed++; else sawClean++;
  }
  // (b) deliberately-scrambled loops (Knuth shuffle of a ring) — usually crossed
  for (let seed = 100; seed < 160; seed++){
    const st = freshLoop({ seedNodes: 30, cap: 60, R: 9, startRadius: 50 });
    const rng = mulberry32(seed);
    // Fisher–Yates on the node order
    for (let i = st.n - 1; i > 0; i--){
      const j = (rng() * (i + 1)) | 0;
      let t = st.px[i]; st.px[i] = st.px[j]; st.px[j] = t;
      t = st.py[i]; st.py[i] = st.py[j]; st.py[j] = t;
    }
    const H = makeHash(hashCell(st.R)); rebuildHash(H, st);
    const a = (firstIntersection(st, H) !== null), b = (bruteFirstIntersection(st) !== null);
    total++; if (a === b) agree++; if (b) sawCrossed++; else sawClean++;
  }
  ck('hash and brute agree on EVERY sampled loop (' + agree + '/' + total + ')', agree === total);
  ck('the sample actually contained crossed loops (control is exercised, n=' + sawCrossed + ')', sawCrossed > 0);
  ck('the sample actually contained clean loops (n=' + sawClean + ')', sawClean > 0);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// 4. CAP / TERMINATION: insertion stops at cap (n never exceeds cap); after cap, arcLength stays
//    bounded; AND arcLength GROWS while the bounding area stays fixed BEFORE cap (the room's promise).
console.log('\n4. cap holds; arc-length grows in a fixed room, then bounds at cap');
{
  const CAP = 600;
  const st = freshLoop({ seedNodes: 48, cap: CAP, R: 9 });
  const H = makeHash(hashCell(st.R));
  const rng = mulberry32(3);
  // keep the loop inside a fixed room so "fixed room" is literally enforced
  const ROOM = { x0: 100, y0: 100, x1: 800, y1: 800 };
  const room = { perimeter: 2 * ((ROOM.x1 - ROOM.x0) + (ROOM.y1 - ROOM.y0)) };
  const params = {
    crowding: 1.0, obstacles: [], obK: 0, dt: 1/60,
    projectOut: (x, y) => [ Math.max(ROOM.x0, Math.min(ROOM.x1, x)), Math.max(ROOM.y0, Math.min(ROOM.y1, y)) ],
  };
  function bboxArea(){
    let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
    for (let i = 0; i < st.n; i++){
      if (st.px[i] < xmin) xmin = st.px[i]; if (st.px[i] > xmax) xmax = st.px[i];
      if (st.py[i] < ymin) ymin = st.py[i]; if (st.py[i] > ymax) ymax = st.py[i];
    }
    return (xmax - xmin) * (ymax - ymin);
  }
  let nOverCap = false;
  const L0 = arcLength(st);
  // run to cap
  let cappedFrame = -1;
  let Lbeforecap = L0, areaBeforecap = bboxArea();
  for (let f = 0; f < 6000; f++){
    step(st, H, params, rng);
    if (st.n > st.cap) nOverCap = true;
    if (cappedFrame < 0 && st.capped){ cappedFrame = f; Lbeforecap = arcLength(st); areaBeforecap = bboxArea(); }
  }
  const Lend = arcLength(st);
  ck('node count NEVER exceeded cap', !nOverCap);
  ck('insertion reached the cap', st.n === st.cap && st.capped);
  ck('arc-length GREW substantially before cap (room outrun: ' + L0.toFixed(0) + ' → ' + Lbeforecap.toFixed(0) + ')',
     Lbeforecap > L0 * 1.8);
  // the room is fixed: bbox area never blew past the projected room area (with a small margin)
  const roomArea = (ROOM.x1 - ROOM.x0) * (ROOM.y1 - ROOM.y0);
  ck('bounding area stayed inside the fixed room (' + bboxArea().toFixed(0) + ' ≤ room ' + roomArea + ')',
     bboxArea() <= roomArea * 1.01);
  // after cap, arc-length stays bounded (no runaway) — it relaxes, doesn't grow without limit
  ck('after cap, arc-length stays bounded (' + Lend.toFixed(0) + ' ≤ a sane ceiling)',
     Lend < room.perimeter * 8);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// 5. KAPPA/DENSITY SANITY: geometry() returns one record per live node; kappa of a regular polygon
//    ≈ 2π/n per vertex; density ≥ 0.
console.log('\n5. geometry() kappa/density sanity');
{
  // a clean regular polygon: every turn should be ≈ 2π/n
  const N = 24;
  const poly = makeState({ cx: 0, cy: 0, R: 9, startRadius: 100, seedNodes: N, cap: N });
  const Hp = makeHash(poly.R); rebuildHash(Hp, poly);
  const g = geometry(poly, Hp);
  ck('geometry returns one record per live node', g.length === poly.n);
  const want = 2 * Math.PI / N;
  let maxErr = 0; for (const r of g) maxErr = Math.max(maxErr, Math.abs(r.kappa - want));
  ck('regular-polygon kappa ≈ 2π/n at every vertex (max err ' + maxErr.toExponential(2) + ')', maxErr < 1e-6);
  let densOk = true; for (const r of g) if (!(r.density >= 0) || !isFinite(r.density)) densOk = false;
  ck('density is finite and ≥ 0 at every node', densOk);
  // on a grown crowded loop, kappa should have meaningful spread (folds = some sharp turns)
  const st = freshLoop({ seedNodes: 48, cap: 400, R: 9 });
  const H = makeHash(hashCell(st.R)); const rng = mulberry32(9);
  for (let f = 0; f < 400; f++) step(st, H, { crowding: 1.0, obstacles: [], obK: 0, dt: 1/60 }, rng);
  rebuildHash(H, st);
  const g2 = geometry(st, H);
  let kmax = 0, dmax = 0; for (const r of g2){ kmax = Math.max(kmax, Math.abs(r.kappa)); dmax = Math.max(dmax, r.density); }
  ck('a grown loop develops real curvature (max |kappa| ' + kmax.toFixed(2) + ' > 0.2)', kmax > 0.2);
  ck('a grown crowded loop develops real density (max density ' + dmax.toFixed(2) + ' > 0)', dmax > 0);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// 6. BYTE-TWIN PARITY: the CORE region in index.html === core.mjs CORE region (anti-drift).
console.log('\n6. byte-twin parity — index.html CORE === core.mjs CORE');
{
  const BEGIN = '// === CORE BEGIN ===';
  const END = '// === CORE END ===';
  function region(src){
    const a = src.indexOf(BEGIN), b = src.indexOf(END);
    if (a < 0 || b < 0) return null;
    return src.slice(a, b + END.length);
  }
  const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
  const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
  const coreRegion = region(coreSrc);
  const pageRegion = region(pageSrc);
  ck('CORE region present in core.mjs', !!coreRegion);
  ck('CORE region present in index.html', !!pageRegion);
  ck('byte-twin PARITY: index.html CORE === core.mjs CORE (byte-identical)',
     !!coreRegion && coreRegion === pageRegion);
  if (coreRegion && pageRegion && coreRegion !== pageRegion){
    console.log('    (regions differ: core=' + coreRegion.length + 'B, page=' + pageRegion.length + 'B)');
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
console.log('\n' + (fail === 0 ? '✅' : '❌') + '  The Wrinkling core: ' + pass + '/' + (pass + fail) + ' checks passed');
if (fail > 0) process.exit(1);
