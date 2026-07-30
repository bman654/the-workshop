/* ============================================================================
 *  THE BELFRY — method.mjs   ·   the mathematics of a change
 *
 *  Zero-dependency, DOM-free ESM.  A Node twin (belfry.test.mjs) runs every
 *  claim in here from the command line.
 *
 *  DO NOT PUT A BACKTICK OR A DOLLAR-BRACE IN THIS FILE, comments included —
 *  it is spliced into a String.raw template for the worklet's sibling and the
 *  estate has lost a debug cycle to exactly that once already.
 *
 *  ── WHAT A CHANGE IS ───────────────────────────────────────────────────────
 *  A ROW is an order of the bells: 123456.  A CHANGE takes one row to the next
 *  by swapping DISJOINT ADJACENT PAIRS.  A bell that swaps nothing is said to
 *  MAKE ITS PLACE, and the places made are how a change is written down:
 *
 *      x     — everybody swaps            (12)(34)(56)
 *      16    — 1st and 6th stand still,   (23)(45)
 *      12    — 1st and 2nd stand still,   (34)(56)
 *      14    — 1st and 4th stand still,   (23)(56)
 *      1234  — four stand still,          (56)
 *
 *  PLAIN BOB MINOR is twelve of these, over and over:
 *
 *      x 16 x 16 x 16 x 16 x 16 x 12
 *
 *  Eleven changes of plain hunting, then one that is different — a 12 instead
 *  of the 16 the hunt wanted — and that single substitution is what turns a
 *  twelve-row loop into a sixty-row course.  A BOB puts 14 there instead; a
 *  SINGLE puts 1234.  Nothing else in the method ever changes.
 *
 *  ── THE THREE THINGS THIS FILE PROVES ──────────────────────────────────────
 *  1. THE PLAIN COURSE is 60 rows, all different, and ends where it began.
 *  2. THE BLUE LINE.  The five working bells do not merely ring similar paths;
 *     they ring THE SAME path, each entering it twelve rows later than the one
 *     before.  Exactly, as sequences of integers.
 *  3. THE SINGLE IS NOT A CONVENTION, IT IS A PARITY FIX.  A plain lead and a
 *     bob lead are both EVEN permutations of the five working bells, so no
 *     amount of calling bobs can leave A5 — you reach 60 of the 120 lead heads,
 *     which is 30 of the 60 leads, which is half the extent.  A 720 with bobs
 *     alone does not exist and the search says so exhaustively (30,074 nodes,
 *     finished, not abandoned).  Allow the single — the one ODD call — and a
 *     true 720 falls out at once.
 *  ========================================================================= */

export const STAGE = 6;                        /* minor: six bells */

/* Place notation.  A change is the SET of places that stand still; everything
 * else swaps in adjacent pairs, left to right. */
export const CROSS = [];                       /* x     */
export const P16 = [1, 6];
export const P12 = [1, 2];
export const P14 = [1, 4];
export const P1234 = [1, 2, 3, 4];

/* The eleven changes of a Plain Bob lead before the lead-end change. */
export const BODY = [CROSS, P16, CROSS, P16, CROSS, P16, CROSS, P16, CROSS, P16, CROSS];

/* The three calls.  'p' plain, 'b' bob, 's' single — the ONLY difference
 * between them is which places are made at the lead end. */
export const CALLS = { p: P12, b: P14, s: P1234 };
export const CALL_NAMES = { p: 'plain', b: 'bob', s: 'single' };

export const ROUNDS = Object.freeze([1, 2, 3, 4, 5, 6]);
/* Queens: odds up then evens.  Backrounds: reversed.  Both are famous rows. */
export const QUEENS = Object.freeze([1, 3, 5, 2, 4, 6]);
export const BACKROUNDS = Object.freeze([6, 5, 4, 3, 2, 1]);
export const TITTUMS = Object.freeze([1, 4, 2, 5, 3, 6]);

/* Apply one change to a row.  Places in 'made' stand; the rest swap in pairs. */
export function change(row, places) {
  const r = row.slice();
  let i = 1;
  while (i <= STAGE) {
    if (places.indexOf(i) >= 0) { i++; continue; }
    if (i + 1 > STAGE) break;                  /* a lone bell at the back stands */
    if (places.indexOf(i + 1) >= 0) { i++; continue; }
    const t = r[i - 1]; r[i - 1] = r[i]; r[i] = t;
    i += 2;
  }
  return r;
}

/* One LEAD: the eleven body changes then the lead-end change named by 'call'.
 * Returns the twelve rows produced (NOT including the row you started on) and
 * the lead head you arrive at. */
export function lead(row, call = 'p') {
  const rows = [];
  let r = row;
  for (const pn of BODY) { r = change(r, pn); rows.push(r); }
  r = change(r, CALLS[call]);
  rows.push(r);
  return { rows, head: r };
}

/* Plain hunt: the same body, with a 16 at the lead end so nothing is disturbed.
 * Twelve rows and you are home. */
export function huntLead(row) {
  const rows = [];
  let r = row;
  for (const pn of BODY) { r = change(r, pn); rows.push(r); }
  r = change(r, P16);
  rows.push(r);
  return { rows, head: r };
}

export const rowKey = (r) => r.join('');

/* ── RANKING A ROW ──────────────────────────────────────────────────────────
 * Lehmer code: a bijection from the 720 rows onto 0..719, so truth is a bitset
 * and not a set of strings. */
const FACT = [1, 1, 2, 6, 24, 120, 720];
export function rank(row) {
  let r = 0;
  for (let i = 0; i < STAGE; i++) {
    let c = 0;
    for (let j = i + 1; j < STAGE; j++) if (row[j] < row[i]) c++;
    r += c * FACT[STAGE - 1 - i];
  }
  return r;
}
export function unrank(idx) {
  const avail = [1, 2, 3, 4, 5, 6];
  const out = [];
  let n = idx;
  for (let i = 0; i < STAGE; i++) {
    const f = FACT[STAGE - 1 - i];
    const k = Math.floor(n / f); n -= k * f;
    out.push(avail.splice(k, 1)[0]);
  }
  return out;
}

/* Parity of a row read as a permutation (inversion count). */
export function parity(row) {
  let inv = 0;
  for (let i = 0; i < row.length; i++) for (let j = i + 1; j < row.length; j++) if (row[i] > row[j]) inv++;
  return inv & 1;
}

/* ── A TOUCH ────────────────────────────────────────────────────────────────
 * A calling is a string of p/b/s, one per lead.  ringTouch walks it and hands
 * back every row, plus which lead each row belongs to and whether the touch
 * came round. */
export function ringTouch(calling, from = ROUNDS) {
  const rows = [from.slice()];
  const leadOf = [0];
  let r = from.slice();
  for (let i = 0; i < calling.length; i++) {
    const L = lead(r, calling[i]);
    for (const x of L.rows) { rows.push(x); leadOf.push(i); }
    r = L.head;
  }
  rows.pop(); leadOf.pop();                    /* the final lead head IS the start row again */
  return { rows, leadOf, home: rowKey(r) === rowKey(from), end: r };
}

/* The plain course: keep calling plain until you are home. */
export function plainCourse(from = ROUNDS) {
  let calling = '';
  let r = from.slice();
  for (let i = 0; i < 40; i++) {
    calling += 'p';
    r = lead(r, 'p').head;
    if (rowKey(r) === rowKey(from)) break;
  }
  return { calling, ...ringTouch(calling, from) };
}

/* Truth: does this set of rows contain no row twice? */
export function isTrue(rows) {
  const seen = new Uint8Array(720);
  for (const r of rows) { const i = rank(r); if (seen[i]) return false; seen[i] = 1; }
  return true;
}
export function coverage(rows) {
  const seen = new Uint8Array(720);
  let n = 0;
  for (const r of rows) { const i = rank(r); if (!seen[i]) { seen[i] = 1; n++; } }
  return n;
}

/* ── THE BLUE LINE ──────────────────────────────────────────────────────────
 * The path of one bell through a block of rows: which place it occupies in
 * each row (1-based). */
export function pathOf(rows, bell) {
  return rows.map((r) => r.indexOf(bell) + 1);
}

/* Are two integer sequences cyclic rotations of one another, and by how much? */
export function rotationOffset(a, b) {
  const n = a.length;
  if (b.length !== n) return -1;
  outer: for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) if (a[(i + k) % n] !== b[i]) continue outer;
    return k;
  }
  return -1;
}

/* THE CLAIM, as a function: in the plain course of Plain Bob Minor the five
 * working bells ring ONE path, entered twelve rows apart.  Returns the offsets
 * (which must be 0, 12, 24, 36, 48 in coursing order) or null if it fails. */
export function blueLineCheck(rows = plainCourse().rows) {
  const treble = pathOf(rows, 1);
  const base = pathOf(rows, 2);
  const offsets = [];
  for (let b = 2; b <= STAGE; b++) {
    const k = rotationOffset(base, pathOf(rows, b));
    if (k < 0) return null;
    offsets.push({ bell: b, offset: k });
  }
  return { offsets, treble, base, n: rows.length };
}

/* ── THE LEAD-HEAD GRAPH ────────────────────────────────────────────────────
 * A lead is twelve rows; the extent is 720 rows; so an extent is sixty leads.
 * Two lead heads name the same twelve rows exactly when one is the other with
 * a 16 applied (the treble leads at handstroke and at backstroke), so the 120
 * treble-leading rows pair up into the 60 leads an extent must contain.
 */
export function leadId(head) {
  const a = rowKey(head), b = rowKey(change(head, P16));
  return a < b ? a + '|' + b : b + '|' + a;
}

/* Which lead heads can you REACH from rounds with a given set of calls? */
export function reachable(calls) {
  const seen = new Map([[rowKey(ROUNDS), ROUNDS.slice()]]);
  const stack = [ROUNDS.slice()];
  while (stack.length) {
    const r = stack.pop();
    for (const c of calls) {
      const h = lead(r, c).head;
      const k = rowKey(h);
      if (!seen.has(k)) { seen.set(k, h); stack.push(h); }
    }
  }
  const heads = [...seen.values()];
  const leads = new Set(heads.map(leadId));
  return { heads, nHeads: heads.length, nLeads: leads.size };
}

/* The permutation a whole lead applies, expressed as its effect on the five
 * WORKING bells (the treble comes back to the front every lead, so it is not
 * part of the story).  Its parity is the whole of claim 3. */
export function leadPermutation(call) {
  const h = lead(ROUNDS, call).head;
  /* strip the treble: read off the working bells in their new order */
  const working = h.filter((b) => b !== 1);
  return working;
}
export function workingParity(call) {
  const w = leadPermutation(call);
  /* rank the five working bells 2..6 as 0..4 and count inversions */
  return parity(w);
}

/* ── THE EXTENT SEARCH ──────────────────────────────────────────────────────
 * Depth-first over callings, pruning the instant a lead repeats a row.  With
 * 'calls' = ['p','b'] it runs to exhaustion and finds nothing; with the single
 * allowed it finds a true 720.  Returns the node count either way, because the
 * node count IS the proof: the search finished.
 */
export function searchExtent(calls, opts = {}) {
  return searchTouch(opts.leads || 60, calls, opts.maxNodes || 4e6);
}

/* ONE search, used for both the 720 and the short touches.  A touch of n leads
 * is TRUE when no row repeats — with the single exception of rounds itself,
 * which is where the touch starts and where its last change must bring it back.
 * Bookkeeping rule that matters: only un-mark on the way out what THIS node
 * marked on the way in, or a leaked flag prunes branches that were fine and a
 * search that reports "no such thing" is reporting its own bug. */
export function searchTouch(nLeads, calls, maxNodes = 4e6) {
  const RND = rank(ROUNDS);
  const used = new Uint8Array(720);
  const path = [];
  let nodes = 0, aborted = false;
  used[RND] = 1;
  function dfs(row, depth) {
    if (++nodes > maxNodes) { aborted = true; return false; }
    if (depth === nLeads) return rowKey(row) === rowKey(ROUNDS);
    const last = depth === nLeads - 1;
    for (const c of calls) {
      const L = lead(row, c);
      const mine = [];
      let ok = true;
      for (let i = 0; i < 12; i++) {
        const k = rank(L.rows[i]);
        if (used[k]) {
          /* the very last row of the very last lead is rounds coming home */
          if (last && i === 11 && k === RND) continue;
          ok = false; break;
        }
        used[k] = 1; mine.push(k);
      }
      if (ok) {
        path.push(c);
        if (dfs(L.head, depth + 1)) return true;
        path.pop();
      }
      for (const k of mine) used[k] = 0;
      if (aborted) return false;
    }
    return false;
  }
  const found = dfs(ROUNDS.slice(), 0);
  return { found, nodes, aborted, calling: found ? path.join('') : null };
}

/* A short touch: the smallest calling of bobs that comes round, for a visitor
 * who does not want to stand for 720 rows.  A bob at the end of every other
 * lead gives a 120 (ten leads). */
export function findTouch(nLeads, calls = ['p', 'b']) {
  const r = searchTouch(nLeads, calls, 400000);
  return r.found ? r.calling : null;
}

/* ── WHAT TO RING ───────────────────────────────────────────────────────────
 * The pieces a visitor can call for.  Each hands back a flat list of rows.
 * 'rounds' and 'queens' simply repeat a row — call changes are what the
 * conductor shouts, not something the bells do on their own. */
export function repertoire() {
  return [
    { id: 'rounds', name: 'Rounds', blurb: 'the bells in order, over and over — where every touch begins and ends' },
    { id: 'queens', name: 'Queens', blurb: 'odds then evens: 135246, a row famous enough to have a name' },
    { id: 'hunt', name: 'Plain Hunt', blurb: 'every bell walks to the back and walks home — twelve rows, no calls' },
    { id: 'bob', name: 'Plain Bob Minor', blurb: 'the plain course: sixty rows, five leads, one blue line' },
    { id: 'touch', name: 'A Touch of Bob Minor', blurb: 'bobs called: a hundred and twenty rows that still come round' },
    { id: 'extent', name: 'The Extent — 720', blurb: 'every one of the 720 orders six bells can stand in, once each' },
  ];
}

export function rowsFor(id, cache = {}) {
  if (id === 'rounds') return { rows: [ROUNDS.slice()], loop: true, calling: '' };
  if (id === 'queens') return { rows: [QUEENS.slice()], loop: true, calling: '' };
  if (id === 'hunt') {
    const rows = [ROUNDS.slice()];
    let r = ROUNDS.slice();
    for (let i = 0; i < 11; i++) { r = change(r, BODY[i]); rows.push(r); }
    return { rows, loop: true, calling: '' };
  }
  if (id === 'bob') { const pc = plainCourse(); return { rows: pc.rows, loop: true, calling: pc.calling }; }
  if (id === 'touch') {
    const calling = cache.touch || (cache.touch = findTouch(10) || 'pppbpppbpp');
    return { rows: ringTouch(calling).rows, loop: true, calling };
  }
  if (id === 'extent') {
    const calling = cache.extent || (cache.extent = searchExtent(['p', 'b', 's']).calling);
    return { rows: ringTouch(calling).rows, loop: true, calling };
  }
  return { rows: [ROUNDS.slice()], loop: true, calling: '' };
}
