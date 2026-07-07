/* diagram.test.mjs — the Node twin of THE STRATA's Loop diagram (diagram.mjs).

   Validates the diagram-state data the page draws from: every state resolves,
   every edge endpoint is a real node present in that state, the two engines
   never touch (the attribution guard, made structural), the roster + seed-type
   evolution matches an INDEPENDENT re-transcription of the T8.1 fact-pack, node
   identities persist, and the SHA cites are well-formed. No framework: one
   PASS/FAIL line per leg; exits non-zero on any red. Pure — no git, no DOM, no
   clock (so it never crashes the estate suite and survives a merge).

   Run:  node strata/diagram.test.mjs

   The EXPECTED_* tables below are transcribed FRESH from
   research/10-feedback-facts.md Part (a) — deliberately NOT re-imported from the
   module — so a copy error in diagram.mjs reddens a leg here. */
import {
  resolveState, validateStates, rosterAt, seedsAt, NODES, EDGES, EDGE_KINDS, VIEW,
} from './diagram.mjs';

let fails = 0;
const ok = (label, pass, detail = '') => {
  console.log((pass ? '  PASS  ' : '  FAIL  ') + label + (detail ? '  — ' + detail : ''));
  if (!pass) fails++;
};
const setEq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/* ── INDEPENDENT re-transcription of the fact-pack (Part a) — cumulative ─────── */
const EXPECTED_ROSTER = {
  2: ['director', 'explorer', 'judge', 'builder', 'publisher', 'writer'],
  3: ['director', 'explorer', 'judge', 'builder', 'publisher', 'writer',
    'gardener', 'planter', 'groundskeeper', 'grounds-worker', 'bug-fixer'],
  4: ['director', 'explorer', 'judge', 'builder', 'publisher', 'writer',
    'gardener', 'planter', 'groundskeeper', 'grounds-worker', 'bug-fixer', 'steward'],
  5: ['director', 'explorer', 'judge', 'builder', 'publisher', 'writer',
    'gardener', 'planter', 'groundskeeper', 'grounds-worker', 'bug-fixer', 'steward',
    'foundry-prep', 'foundry-smith', 'foundry-judge', 'foundry-synth'],
  6: ['director', 'explorer', 'judge', 'builder', 'publisher', 'writer',
    'gardener', 'planter', 'groundskeeper', 'grounds-worker', 'bug-fixer', 'steward',
    'foundry-prep', 'foundry-smith', 'foundry-judge', 'foundry-synth'],
  7: ['worker', 'orchestrator'],
  8: ['worker', 'orchestrator'],
};
const EXPECTED_SEEDS = {
  2: ['exhibit', 'room', 'metagame', 'engine', 'curation', 'cross'],
  3: ['exhibit', 'room', 'metagame', 'engine', 'curation', 'cross', 'spark', 'rework'],
  4: ['exhibit', 'room', 'metagame', 'engine', 'curation', 'cross', 'spark', 'rework', 'writ'],
  5: ['exhibit', 'room', 'metagame', 'engine', 'curation', 'cross', 'spark', 'rework', 'writ', 'rep', 'gate'],
  6: ['exhibit', 'room', 'metagame', 'engine', 'curation', 'cross', 'spark', 'rework', 'writ', 'rep', 'gate'],
  7: [],   // frozen
  8: [],   // frozen
};

/* ── Section A — the pure self-consistency battery (page + twin share it) ────── */
console.log('— diagram self-consistency battery (validateStates) —');
const v = validateStates();
if (v.problems.length) for (const p of v.problems) console.log('     · ' + p);
ok('validateStates: all states resolve, edges refs valid, engines disjoint, cites well-formed',
  v.ok, v.ok ? 'no problems' : v.problems.length + ' problem(s)');

/* ── Section B — per-state legs (8 entries: S1 null, S2…S8 structural) ───────── */
console.log('\n— per-state legs (S1 null, S2…S8) —');

// S1 — no loop
ok('S1 resolves to null (no loop yet)', resolveState(1) === null, 'S1 diagram = null');

for (let k = 2; k <= 8; k++) {
  const st = resolveState(k);
  const ids = new Set(st.nodes.map((n) => n.id));
  const problems = [];
  // edge refs resolve + kinds known + engines disjoint per edge
  for (const e of st.edges) {
    if (!ids.has(e.from) || !ids.has(e.to)) problems.push('edge ' + e.from + '→' + e.to + ' unresolved');
    if (EDGE_KINDS.indexOf(e.kind) < 0) problems.push('bad kind ' + e.kind);
    if (NODES[e.from].engine !== NODES[e.to].engine) problems.push('cross-engine ' + e.from + '→' + e.to);
  }
  // roster + seeds match the independent fact-pack transcription
  const rOK = setEq(st.roster, EXPECTED_ROSTER[k]);
  const sOK = setEq(st.seeds.kinds, EXPECTED_SEEDS[k]) && (k >= 7 ? st.seeds.frozen : !st.seeds.frozen);
  if (!rOK) problems.push('roster ≠ fact-pack (' + st.roster.length + ' vs ' + EXPECTED_ROSTER[k].length + ')');
  if (!sOK) problems.push('seeds ≠ fact-pack');
  // parked flag
  if (st.parked !== (k >= 7)) problems.push('parked flag wrong');
  ok('S' + k + ' — ' + st.nodes.length + ' nodes / ' + st.edges.length + ' edges · roster ' +
    st.roster.length + ' · seeds ' + (st.seeds.frozen ? 'frozen' : st.seeds.kinds.length) +
    (st.parked ? ' · PARKED' : ''), problems.length === 0, problems.join('; '));
}

/* ── Section C — global invariants ──────────────────────────────────────────── */
console.log('\n— global invariants —');

// C1 — node ids unique + engine ∈ {ff,sx} + positions in VIEW + at ∈ 2..8
let nodeWF = true, nwWhy = '';
for (const id in NODES) {
  const n = NODES[id];
  if (n.engine !== 'ff' && n.engine !== 'sx') { nodeWF = false; nwWhy = 'bad engine @' + id; break; }
  if (!(n.at >= 2 && n.at <= 8)) { nodeWF = false; nwWhy = 'bad at @' + id; break; }
  if (!(n.x >= 0 && n.x <= VIEW.w && n.y >= 0 && n.y <= VIEW.h)) { nodeWF = false; nwWhy = 'off-canvas @' + id; break; }
  if (!(n.label && n.full && n.blurb)) { nodeWF = false; nwWhy = 'missing text @' + id; break; }
}
ok('every node well-formed (engine, at 2…8, on-canvas, labelled + blurbed)', nodeWF, nwWhy || Object.keys(NODES).length + ' nodes');

// C2 — the two engines are disjoint node sets
const ffN = Object.keys(NODES).filter((id) => NODES[id].engine === 'ff');
const sxN = Object.keys(NODES).filter((id) => NODES[id].engine === 'sx');
const overlap = ffN.filter((id) => sxN.indexOf(id) >= 0);
ok('the ff and sx engines are disjoint node sets (attribution guard)', overlap.length === 0,
  ffN.length + ' ff · ' + sxN.length + ' sx');

// C3 — EVERY edge in the catalog is same-engine (structural attribution guard)
let sameEng = true, seWhy = '';
for (const e of EDGES) {
  if (NODES[e.from].engine !== NODES[e.to].engine) { sameEng = false; seWhy = e.from + '→' + e.to; break; }
}
ok('no edge in the catalog crosses engines', sameEng, seWhy || EDGES.length + ' edges');

// C4 — roster monotone S2→S6, seeds monotone S2→S6 (nothing an era added vanishes)
let mono = true, mWhy = '';
for (let k = 3; k <= 6; k++) {
  const prev = rosterAt(k - 1), cur = rosterAt(k);
  if (!prev.every((r) => cur.indexOf(r) >= 0)) { mono = false; mWhy = 'roster shrank at S' + k; break; }
  const ps = seedsAt(k - 1).kinds, cs = seedsAt(k).kinds;
  if (!ps.every((s) => cs.indexOf(s) >= 0)) { mono = false; mWhy = 'seeds shrank at S' + k; break; }
}
ok('roster + seed taxonomy grow monotonically S2→S6', mono, mWhy || 'monotone');

// C5 — the S7 reset: roster + seeds change identity (creative roles dormant, seeds frozen)
const r6 = rosterAt(6), r7 = rosterAt(7);
ok('S7 resets the roster to the scaffold seats (creative roles dormant)',
  setEq(r7, ['worker', 'orchestrator']) && !r7.some((r) => r6.indexOf(r) >= 0),
  r7.join(' + '));
ok('S7 freezes the seed taxonomy (ledger tasks, not roadmap seeds)', seedsAt(7).frozen && seedsAt(7).kinds.length === 0, 'frozen');

console.log('\n' + (fails === 0 ? 'ALL GREEN' : fails + ' RED'));
process.exit(fails === 0 ? 0 : 1);
