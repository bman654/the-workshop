// ============================================================================
//  Node-side falsifiability harness for The Convex Hull — the Skeptic's Bench.
//  Runs the shared in-page self-test runSelfTest() (the SAME seven claims the
//  page pill runs), PLUS deeper Node-only assertions (a 4th independent oracle,
//  the control's teeth, more degenerate fixtures), THEN re-extracts the inlined
//  core from index.html between the sentinels and proves it is byte-for-byte the
//  SAME core (parity).
//  Run:  node core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  cross, clean, graham, monotoneChain, jarvis, signedArea,
  canon, hullKey, containsAll, isMinimal, naiveHull,
  makeRng, randomCloud, GRID, preset, presetExpectedHull, runSelfTest,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));

let pass = 0, total = 0;
const ok = (name, cond, detail = '') => {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (detail ? '  ·  ' + detail : '')); }
  else { console.log('  ✗ ' + name + (detail ? '  ·  ' + detail : '')); }
};

console.log('The Convex Hull — core.test.mjs\n');

// ── 1. THE SHARED IN-PAGE SELF-TEST (the same seven claims the pill runs) ─────
console.log('— shared runSelfTest() (the SAME claims the in-page pill runs) —');
{
  const st = runSelfTest();
  for (const l of st.lines) ok('[self-test] ' + l.name, l.ok, l.detail);
  ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);
}

// ── 2. A FOURTH INDEPENDENT ORACLE — a brute-force enumeration hull. ──────────
// A DIFFERENT idea again: no polar sort (Graham), no x-sweep (monotone), no
// rotating-ray construction (Jarvis). Start at the lexicographic-min point; for
// the successor, enumerate EVERY candidate j and keep the one with NO point
// strictly to the right of the directed edge cur→j, breaking collinear ties by
// FARTHEST (so interior collinear points are never emitted). It is a pure
// "test every edge" oracle — a fourth stranger the three builders must agree with.
console.log('\n— CLAIM 1+: a FOURTH independent oracle (brute-force enumeration) agrees —');
function bruteHull(pts){
  const P = clean(pts);
  const n = P.length;
  if (n <= 2) return P;
  // start = leftmost-then-lowest (guaranteed on the hull)
  let start = 0;
  for (let i = 1; i < n; i++) if (P[i].x < P[start].x || (P[i].x === P[start].x && P[i].y < P[start].y)) start = i;
  const hull = [];
  let cur = start, guard = 0;
  do {
    hull.push(P[cur]);
    let best = -1;
    for (let j = 0; j < n; j++){
      if (j === cur) continue;
      // j is a valid successor iff every other point is left-of-or-on cur→j
      let allLeftOrOn = true;
      for (let k = 0; k < n; k++){
        if (k === cur || k === j) continue;
        if (cross(P[cur], P[j], P[k]) < 0){ allLeftOrOn = false; break; }
      }
      if (!allLeftOrOn) continue;
      if (best < 0){ best = j; continue; }
      const c = cross(P[cur], P[best], P[j]);
      if (c < 0) best = j;                          // j is the more-clockwise boundary
      else if (c === 0){                            // collinear → keep the farther
        const dB = (P[best].x - P[cur].x) ** 2 + (P[best].y - P[cur].y) ** 2;
        const dJ = (P[j].x - P[cur].x) ** 2 + (P[j].y - P[cur].y) ** 2;
        if (dJ > dB) best = j;
      }
    }
    cur = best; guard++;
  } while (cur !== start && cur >= 0 && guard <= n + 1);
  return hull;
}
{
  let disagree = 0, firstBad = -1, tested = 0;
  for (let s = 1; s <= 120; s++){
    const n = 5 + (s % 18);                          // small N (brute is O(n³))
    const pts = randomCloud((s * 2654435761) >>> 0, n);
    const kref = hullKey(graham(pts));
    const kbrute = hullKey(bruteHull(pts));
    tested++;
    if (kref !== kbrute){ disagree++; if (firstBad < 0) firstBad = s; }
  }
  ok(`★ a 4th stranger (brute-force enumeration) agrees with graham on ${120} seeds (no sort/wrap/chain shared)`,
     disagree === 0, disagree === 0 ? `${tested} seeds, 0 disagreements` : `${disagree} disagree (first @${firstBad})`);
}

// ── 3. CLAIM 1 — three-way agreement, deeper sweep (1000 seeds, wider N) ──────
console.log('\n— CLAIM 1 (deep): graham == monotoneChain == jarvis over 1000 seeds —');
{
  let disagree = 0, firstBad = -1;
  for (let s = 1; s <= 1000; s++){
    const n = 4 + (s % 80);                          // N in [4..83]
    const pts = randomCloud((s * 40503) >>> 0, n);
    const kg = hullKey(graham(pts)), km = hullKey(monotoneChain(pts)), kj = hullKey(jarvis(pts));
    if (kg !== km || km !== kj){ disagree++; if (firstBad < 0) firstBad = s; }
  }
  ok('graham == monotoneChain == jarvis byte-identical over 1000 seeds, N∈[4..83]',
     disagree === 0, disagree === 0 ? '1000 seeds, all three byte-identical' : `${disagree} disagree (first @${firstBad})`);
}

// ── 4. CLAIM 2 — source-level independence (the anti-circularity grep) ────────
console.log('\n— CLAIM 2: the three builders share no construction code —');
{
  const g = graham.toString(), m = monotoneChain.toString(), j = jarvis.toString();
  ok('graham mentions neither monotoneChain nor jarvis nor buildHull',
     !g.includes('monotoneChain') && !g.includes('jarvis') && !g.includes('buildHull'));
  ok('monotoneChain mentions neither graham nor jarvis nor buildHull',
     !m.includes('graham') && !m.includes('jarvis') && !m.includes('buildHull'));
  ok('jarvis mentions neither graham nor monotoneChain nor buildHull',
     !j.includes('graham') && !j.includes('monotoneChain') && !j.includes('buildHull'));
  ok('all three reference the shared atom cross', g.includes('cross') && m.includes('cross') && j.includes('cross'));
  ok('all three reference the shared cleaner clean', g.includes('clean') && m.includes('clean') && j.includes('clean'));
}

// ── 5. CLAIM 3 — degeneracy exactness, explicitly (incl 1/2/all-identical) ────
console.log('\n— CLAIM 3: degenerate presets exact (incl. 1/2/all-identical) —');
{
  const expect = (name, want) => {
    const pts = preset(name);
    const kg = hullKey(graham(pts)), km = hullKey(monotoneChain(pts)), kj = hullKey(jarvis(pts));
    const agree = kg === km && km === kj;
    const wantKey = JSON.stringify(canon(want));
    ok(`${name}: all three agree AND == expected (${canon(want).length}-vertex)`,
       agree && kg === wantKey, agree ? `got ${canon(graham(pts)).length}v` : 'DISAGREE');
  };
  expect('collinear', [{x:5,y:10},{x:35,y:10}]);                  // → segment
  expect('single', [{x:20,y:20}]);                                // → 1 vertex
  expect('two', [{x:8,y:14},{x:30,y:26}]);                        // → segment
  expect('allIdentical', [{x:15,y:15}]);                          // → 1 vertex
  expect('square', [{x:6,y:6},{x:34,y:6},{x:34,y:34},{x:6,y:34}]);// → 4-gon
  // duplicates: triangle with vertices tripled + an interior point → the triangle.
  expect('duplicates', [{x:8,y:8},{x:32,y:10},{x:18,y:34}]);
  // circle: all 12 points are vertices.
  {
    const pts = preset('circle');
    const k = canon(graham(pts)).length;
    const cleaned = clean(pts).length;
    ok(`circle: every one of the ${cleaned} circle points is a hull vertex`, k === cleaned, `${k}/${cleaned} on the hull`);
  }
}

// ── 6. CLAIM 4 — the invariant, on all three algorithms' output ───────────────
console.log('\n— CLAIM 4: containsAll AND isMinimal on every algorithm, every seed —');
{
  let bad = 0;
  for (let s = 1; s <= 400; s++){
    const n = 5 + (s % 50);
    const pts = randomCloud((s * 22695477) >>> 0, n);
    for (const builder of [graham, monotoneChain, jarvis]){
      const h = builder(pts);
      if (!containsAll(h, pts).ok || !isMinimal(h).ok){ bad++; break; }
    }
  }
  ok('every hull from every algorithm contains all points AND is minimal (400 seeds × 3 algos)', bad === 0, `${bad} failures`);
  // containsAll really catches an outside point: corrupt a hull by dropping a vertex.
  {
    const pts = randomCloud(777, 24);
    const h = monotoneChain(pts);
    const broken = h.slice(1);                        // drop a hull vertex → some point now outside
    const c = containsAll(broken, pts);
    ok('containsAll FLAGS a hull missing a vertex (some point now strictly outside)', !c.ok && c.violations > 0, `${c.violations} violations`);
  }
  // isMinimal really catches a redundant collinear vertex.
  {
    // a square with a forced midpoint vertex inserted into the hull list
    const h = [{x:0,y:0},{x:20,y:0},{x:40,y:0},{x:40,y:40},{x:0,y:40}];
    const mn = isMinimal(h);
    ok('isMinimal FLAGS a collinear vertex on a straight edge (the midpoint (20,0))', !mn.ok && mn.count === 1, `${mn.count} redundant`);
  }
}

// ── 7. CLAIM 5 — the negative control bites (the <0-vs-<=0 collinear bug) ─────
console.log('\n— CLAIM 5: naiveHull passes containment but FAILS minimality —');
{
  const pts = preset('collinearEdge');
  const nh = naiveHull(pts);
  const c = containsAll(nh, pts), mn = isMinimal(nh);
  ok('naiveHull CONTAINS every point (it really encloses them)', c.ok, `${c.violations} violations`);
  ok('naiveHull is NOT minimal (keeps the 4 collinear edge-midpoints)', !mn.ok && mn.count === 4, `${mn.count} removable vertices`);
  ok('naiveHull returns an 8-gon where the true hull is a 4-gon', canon(nh).length === 8 && canon(graham(pts)).length === 4,
     `naive=${canon(nh).length}v true=${canon(graham(pts)).length}v`);
  // the three REAL algorithms pass minimality on this same fixture.
  ok('all three real algorithms ARE minimal on the collinear-edge fixture',
     isMinimal(graham(pts)).ok && isMinimal(monotoneChain(pts)).ok && isMinimal(jarvis(pts)).ok);
  // non-vacuity: the control fails for a DIFFERENT collinear fixture too.
  {
    // a triangle with a midpoint on its long edge
    const tri = [{x:0,y:0},{x:40,y:0},{x:20,y:0},{x:20,y:30}];   // bottom edge has a midpoint
    const nh2 = naiveHull(tri);
    ok('naiveHull also bites on a triangle-with-edge-midpoint (non-vacuous)', !isMinimal(nh2).ok, `${isMinimal(nh2).count} removable`);
  }
}

// ── 8. CLAIM 6 — canonicalizer neutrality (idempotent, rotation/winding-blind) ─
console.log('\n— CLAIM 6: canon is idempotent + rotation/winding-blind —');
{
  for (let s = 1; s <= 50; s++){
    const pts = randomCloud((s * 2246822519) >>> 0, 20 + (s % 20));
    const h = monotoneChain(pts);
    const c = canon(h);
    // idempotent
    const idem = JSON.stringify(canon(c)) === JSON.stringify(c);
    // rotation-blind
    const rot = c.slice(3).concat(c.slice(0, 3));
    const rotB = JSON.stringify(canon(rot)) === JSON.stringify(c);
    // winding-blind
    const rev = c.slice().reverse();
    const winB = JSON.stringify(canon(rev)) === JSON.stringify(c);
    if (!(idem && rotB && winB)){ ok(`canon neutrality @seed ${s}`, false, `idem=${idem} rot=${rotB} wind=${winB}`); break; }
    if (s === 50) ok('canon idempotent + rotation-blind + winding-blind over 50 hulls', true, 'all 50 stable');
  }
  // canon forces CCW: a CW input comes back CCW (positive signed area).
  {
    const cw = [{x:0,y:0},{x:0,y:10},{x:10,y:10},{x:10,y:0}];     // clockwise square
    const c = canon(cw);
    ok('canon forces CCW winding (signedArea > 0)', signedArea(c) > 0, `signedArea=${signedArea(c)}`);
  }
  // canon source references no builder.
  {
    const cs = canon.toString();
    ok('canon source references no builder (post-construction only)',
       !cs.includes('graham') && !cs.includes('monotoneChain') && !cs.includes('jarvis'));
  }
}

// ── 9. CLAIM 7 — exactness: integer cross, no epsilon ─────────────────────────
console.log('\n— CLAIM 7: cross is an exact integer determinant —');
{
  ok('cross((0,0),(7,3),(2,11)) === 71 exactly', cross({x:0,y:0},{x:7,y:3},{x:2,y:11}) === 71);
  ok('cross is sign-correct: CCW > 0', cross({x:0,y:0},{x:1,y:0},{x:0,y:1}) > 0);
  ok('cross is sign-correct: CW < 0', cross({x:0,y:0},{x:0,y:1},{x:1,y:0}) < 0);
  ok('cross is sign-correct: collinear == 0', cross({x:0,y:0},{x:2,y:2},{x:5,y:5}) === 0);
  let allInt = true;
  for (const p of randomCloud(31337, 60)) if (!Number.isInteger(p.x) || !Number.isInteger(p.y) || p.x < 0 || p.x > GRID || p.y < 0 || p.y > GRID) allInt = false;
  ok(`every randomCloud point is an integer in [0..${GRID}] (the snap is honest)`, allInt);
}

// ── 10. DETERMINISM — same seed ⇒ identical hull ─────────────────────────────
console.log('\n— DETERMINISM: same seed ⇒ identical hull —');
{
  let same = true;
  for (let s = 1; s <= 50; s++){
    const a = hullKey(graham(randomCloud(s, 30))), b = hullKey(graham(randomCloud(s, 30)));
    if (a !== b) same = false;
  }
  ok('randomCloud + graham is seed-pure (50 seeds, identical hulls across two calls)', same);
}

// ── 11. RE-EXTRACTION PARITY — the page core === the module, byte-for-byte ────
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== CONVEX HULL CORE (inlined byte-twin of core.mjs) BEGIN =====';
  const END = '// ===== CONVEX HULL CORE END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in index.html', i >= 0 && j > i,
     i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i){
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) ★ each inlined builder body === imported builder.toString() char-for-char.
    const pairs = [
      ['cross', cross], ['clean', clean], ['graham', graham],
      ['monotoneChain', monotoneChain], ['jarvis', jarvis],
      ['signedArea', signedArea], ['canon', canon], ['hullKey', hullKey],
      ['containsAll', containsAll], ['isMinimal', isMinimal], ['naiveHull', naiveHull],
      ['preset', preset], ['presetExpectedHull', presetExpectedHull], ['runSelfTest', runSelfTest],
    ];
    let drift = '';
    for (const [name, fn] of pairs){
      const pageBody = extractFn(slice, name);
      if (norm(pageBody) !== norm(fn.toString())){ drift = name; break; }
    }
    ok('(parity)★ every inlined function body is char-for-char the imported core (cross/clean/graham/chain/jarvis/canon/invariant/control/preset/oracle)',
       drift === '', drift === '' ? `all ${pairs.length} functions byte-identical` : `DRIFT in ${drift}`);

    // (b) evaluate the slice and run ITS runSelfTest → same pass-count + ok-for-ok.
    let pageRes = null, evalErr = null;
    const RET = '\n;return { runSelfTest };';
    try {
      const factory = new Function(slice + RET);
      const PageCore = factory();
      pageRes = PageCore.runSelfTest();
    } catch (e) { evalErr = e; }
    ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');

    if (pageRes){
      const modRes = runSelfTest();
      ok('(parity)★ inline runSelfTest pass-count == module pass-count', pageRes.pass === modRes.pass && pageRes.total === modRes.total,
         `in-page ${pageRes.pass}/${pageRes.total}  ·  module ${modRes.pass}/${modRes.total}`);
      let agree = pageRes.lines.length === modRes.lines.length;
      for (let k = 0; agree && k < pageRes.lines.length; k++){
        if (pageRes.lines[k].ok !== modRes.lines[k].ok || pageRes.lines[k].name !== modRes.lines[k].name) agree = false;
      }
      ok('(parity)★ every named claim agrees ok-for-ok AND name-for-name (page vs module)', agree,
         agree ? `all ${pageRes.lines.length} lines identical` : 'a line disagreed');
    }
  }
}

// extract `function NAME(...) { ... }` (or `function NAME` after `export`) with
// brace-matching from a source string.
function extractFn(src, name){
  const re = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = re.exec(src);
  if (!m) return '';
  let i = src.indexOf('{', m.index);
  if (i < 0) return '';
  let depth = 0, k = i;
  for (; k < src.length; k++){
    if (src[k] === '{') depth++;
    else if (src[k] === '}'){ depth--; if (depth === 0){ k++; break; } }
  }
  return src.slice(m.index, k);
}

console.log(`\n${pass}/${total} ${pass === total ? '✓ ALL GREEN' : '✗ FAILURES'}`);
process.exit(pass === total ? 0 : 1);
