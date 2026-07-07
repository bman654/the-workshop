/* ═══════════════════════════════════════════════════════════════════════════
   THE STRATA — diagram.mjs   (the Loop's evolving shape, as data)

   The mechanical heart of the estate made visible: the fun-forever creative
   cycle's node/edge SHAPE at each stratum S2…S8 (S1 has no loop), plus the
   worker→orchestrator scaffold-exec engine that takes over when the loop parks.
   This module is DATA + PURE validators only. Imported by BOTH:
     • strata/diagram.test.mjs — the Node twin (validates every state resolves,
                                 the roster/seed evolution matches the fact-pack,
                                 and the two engines never touch).
     • strata/index.html       — inlined verbatim at forge time (forge strips the
                                 `export ` keyword). The page reads NODES/EDGES/
                                 resolveState() to draw and morph the diagram in
                                 the reading panel; every node/edge it draws comes
                                 from here — the picture can never disagree with
                                 the data.

   DOM-free, ZERO-import, no randomness, no wall-clock NOW (invariant 7). Facts
   ride as SHA cites (7-char provenance, never a verbatim commit subject, so no
   quotation-covenant obligation and never a bare gauge #N). Prose blurbs are the
   page's engineer-plain voice (T8.2 prose pack §2), not Cairn's and not quotes.

   ── Source of record ────────────────────────────────────────────────────────
   research/10-feedback-facts.md Part (a) — the loop-evolution table S2→S8 (the
   delta-morph JSON) — and research/T8.2-prose-pack.md §2 (node blurbs + footers).
   Both out-of-band. This module is the in-repo transcription; the twin's
   EXPECTED_* tables are an INDEPENDENT re-transcription, so a copy error reddens.

   ── The two engines are visually + structurally DISTINCT (attribution guard) ──
   engine 'ff' = the fun-forever creative cycle (a warm ring: director → explore
   → judge → build → publish, iterating). engine 'sx' = the worker→orchestrator
   scaffold-exec loop over a ledger (a distinct steel form). NO EDGE crosses
   engines (the twin enforces it): the deep-planning fan-out and the
   overseer/orchestrator belong ONLY to 'sx' — never drawn as fun-forever
   features (Brandon's binding correction; fact-pack Part (d)).

   ── Park semantics ──────────────────────────────────────────────────────────
   At S7/S8 (parked) the whole 'ff' apparatus freezes (rendered as a dimmed,
   shrunk ghost) and the 'sx' engine takes the stage. The ff nodes do not vanish
   — they PARK. The roster + seed taxonomy, cumulative S2→S6, RESET at S7 to the
   scaffold engine's two seats; seeds go frozen (ledger tasks, not roadmap seeds).
   ═══════════════════════════════════════════════════════════════════════════ */

/* The diagram's coordinate space (the reading-panel SVG viewBox). */
export const VIEW = { w: 300, h: 300 };

/* The vocabulary of edge kinds. The first eight are the fact-pack's own set
   (Part (a) JSON `note`); 'cycle' (the ff next-cycle return) and 'produces'
   (the S8 telling) are page-added for loop legibility and documented as such. */
export const EDGE_KINDS = [
  'pipeline', 'rework-loop', 'reads', 'dispatch', 'child', 'self-loop',
  'replan', 'stop', 'cycle', 'produces',
];

/* ── NODES ───────────────────────────────────────────────────────────────────
   id → { engine, at, x, y, label, full, blurb, kind?, morph? }
     engine : 'ff' | 'sx'      at : stratum first introduced (2…8)
     x,y    : center in VIEW space (0…300)
     label  : the short pill caption   full : the tooltip title
     blurb  : the engineer-plain hover/pin text (prose pack §2)
     kind   : optional visual shape hint ('seat' default | 'feed' | 'store' |
              'keeper' | 'foundry' | 'sx' | 'stop' | 'ledger' | 'voice')
     morph  : optional per-stratum overrides, e.g. { 6: { label, badge } }.
   ff seats sit on a pentagon (center 150,116 · r 64). */
export const NODES = {
  /* ── the five seats (the ring), S2 ── */
  director: { engine: 'ff', at: 2, x: 150, y: 52, kind: 'seat',
    label: 'director', full: 'director',
    blurb: 'Reads the estate’s state and dispatches the cycle’s work. From S3 it runs the gauge and obeys its directive — dispatch is mode × track, not judgment; per track it wakes as gardener, groundskeeper, or bug-fixer.' },
  explore: { engine: 'ff', at: 2, x: 211, y: 96, kind: 'seat',
    label: 'explore ×K', full: 'explore (K parallel)',
    blurb: 'K explorers diverge in parallel on the chosen seed, blind to each other; divergence is the point.' },
  judge: { engine: 'ff', at: 2, x: 188, y: 168, kind: 'seat',
    label: 'judge', full: 'judge',
    blurb: 'Selects or synthesizes one take from K. May reject all and buy exactly one refined re-round — the loop-back edge. From S6 its house bar weighs untestable delight equal to rigor.' },
  build: { engine: 'ff', at: 2, x: 112, y: 168, kind: 'seat',
    label: 'build', full: 'build',
    blurb: 'Ships the piece and self-verifies it in the same cycle. Specializes per track — planter, grounds-worker, bug-fixer. From S5 it hangs the foundry sub-pipeline and carries the baton self-loop (a swing too big for one turn passes, mid-work, to a fresh builder — bounded at three handoffs, the last must finish).' },
  publish: { engine: 'ff', at: 2, x: 89, y: 96, kind: 'seat',
    label: 'publish', full: 'publish',
    blurb: 'Fresh eyes on the shipped work: review, sow or prune, one summary line. From S6 the whole tail — record, collate, commit, push — is one atomic seal; a death mid-publish can no longer strand a half-published cycle.',
    morph: { 6: { label: 'publish + seal' } } },

  /* ── the gauge, S3 (cadence became code) ── */
  gauge: { engine: 'ff', at: 3, x: 150, y: 15, kind: 'feed',
    label: 'gauge', full: 'gauge (deterministic cadence)',
    blurb: 'Deterministic cadence: a Node script the director runs and obeys. Fuel is DERIVED — a live count of seeds in the roadmap’s fenced sections — and recording a cycle validates or refuses. The last judgment call, removed from the clock.' },

  /* ── the external prompt store + keeper channels, S4 (seats go thin) ── */
  'prompt-store': { engine: 'ff', at: 4, x: 150, y: 116, kind: 'store',
    label: 'prompt store', full: 'prompt store (8 cards)',
    blurb: 'Eight Markdown cards holding every seat’s instructions. The seats are thin readers; editing a card between cycles re-tunes the LIVE loop, no relaunch.' },
  writ: { engine: 'ff', at: 4, x: 33, y: 28, kind: 'keeper',
    label: 'writ', full: 'writ (the keeper’s channel)',
    blurb: 'The keeper’s channel: a writ outranks every seed; a steward carries it out.' },
  'sow-bed': { engine: 'ff', at: 4, x: 30, y: 62, kind: 'keeper',
    label: 'sow / bed', full: 'sow / bed consoles',
    blurb: 'The roadmap is mutated only by code — seeds, bugs, and writs enter through a console, never a hand-edit.' },

  /* ── the foundry sub-graph hung off build, S5 (reach past one agent) ── */
  'foundry-prep': { engine: 'ff', at: 5, x: 55, y: 206, kind: 'foundry',
    label: 'prep', full: 'foundry · prep',
    blurb: 'Scaffolds the wiring before the takes fan out.' },
  'foundry-takes': { engine: 'ff', at: 5, x: 92, y: 246, kind: 'foundry',
    label: 'takes ×K', full: 'foundry · takes (K parallel)',
    blurb: 'K takes forged in parallel — better than one agent’s one try.' },
  'foundry-judges': { engine: 'ff', at: 5, x: 162, y: 250, kind: 'foundry',
    label: 'judges', full: 'foundry · judges (K, blind)',
    blurb: 'Blind judging; for sound, judged by numbers — the judge cannot hear, the analysis is the ear. From S6 a three-agent semaphore caps the whole sub-graph — a rate cap, not a spend cap.',
    morph: { 6: { badge: 'sem ×3' } } },
  'foundry-synth': { engine: 'ff', at: 5, x: 216, y: 220, kind: 'foundry',
    label: 'synth', full: 'foundry · synth',
    blurb: 'One synthesis ships from K takes.' },

  /* ── the scaffold-exec engine, S7 (the loop parks; a distinct shape) ── */
  worker: { engine: 'sx', at: 7, x: 84, y: 132, kind: 'sx',
    label: 'worker', full: 'worker',
    blurb: 'Fresh context, exactly one ledger task, then a SMALL structured return — metadata and pointers, never a payload.' },
  orchestrator: { engine: 'sx', at: 7, x: 216, y: 132, kind: 'sx',
    label: 'orchestrator', full: 'orchestrator (the overseer)',
    blurb: 'This engine’s overseer: verifies independently (re-runs gates, reads the real diff), is the ledger’s only writer, replans after every step. Two hatches: a deep-planning fan-out at a design fork and exit-for-discussion at a genuinely human decision.' },
  ledger: { engine: 'sx', at: 7, x: 150, y: 210, kind: 'ledger',
    label: 'ledger', full: 'the ledger (single source of truth)',
    blurb: 'The single source of truth — every task’s type, status, deps, and acceptance. Only the orchestrator writes it; a dead run resumes from it.' },
  'explore(k)': { engine: 'sx', at: 7, x: 252, y: 58, kind: 'sx',
    label: 'explore ×k', full: 'deep-planning (explore k)',
    blurb: 'The deep-planning hatch: at a design fork, k explorers fan out, a judge synthesizes, new tasks splice into the plan — no human woken.' },
  STOP: { engine: 'sx', at: 7, x: 150, y: 40, kind: 'stop',
    label: 'STOP', full: 'exit-for-discussion',
    blurb: 'exit-for-discussion: the loop STOPS only for what a human genuinely must decide. Don’t lower the bar, or the loop turns into a chat.' },

  /* ── the voice pipeline, S8 (the telling of the history) ── */
  'voice-pipeline': { engine: 'sx', at: 8, x: 150, y: 262, kind: 'voice',
    label: 'voice', full: 'voice pipeline',
    blurb: 'The telling itself: cloned voice, word-timed caption sidecars, every clip verified by reading its spectrogram — the maker cannot hear.' },
};

/* ── EDGES ───────────────────────────────────────────────────────────────────
   { from, to, kind, engine, at, morphAt?, curve?, label? }
     at     : stratum the edge first appears
     curve  : optional bend (+/- perpendicular offset px) so parallel edges read
     label  : optional tiny caption riding the edge (e.g. the baton bound)
   Every endpoint is a NODES id; the twin proves from.engine === to.engine for
   every edge (the two engines never touch). */
export const EDGES = [
  /* ff — the ring pipeline + the rework loop-back + the next-cycle return */
  { from: 'director', to: 'explore', kind: 'pipeline', engine: 'ff', at: 2 },
  { from: 'explore', to: 'judge', kind: 'pipeline', engine: 'ff', at: 2 },
  { from: 'judge', to: 'build', kind: 'pipeline', engine: 'ff', at: 2 },
  { from: 'build', to: 'publish', kind: 'pipeline', engine: 'ff', at: 2 },
  { from: 'judge', to: 'explore', kind: 'rework-loop', engine: 'ff', at: 2, curve: 26,
    label: 'reject all → one re-round' },
  { from: 'publish', to: 'director', kind: 'cycle', engine: 'ff', at: 2, curve: 30,
    label: 'next cycle · fresh hand' },

  /* ff — the gauge dispatches the director (S3) */
  { from: 'gauge', to: 'director', kind: 'dispatch', engine: 'ff', at: 3 },

  /* ff — the thin seats read the external store; the writ dispatches (S4) */
  { from: 'director', to: 'prompt-store', kind: 'reads', engine: 'ff', at: 4 },
  { from: 'explore', to: 'prompt-store', kind: 'reads', engine: 'ff', at: 4 },
  { from: 'judge', to: 'prompt-store', kind: 'reads', engine: 'ff', at: 4 },
  { from: 'build', to: 'prompt-store', kind: 'reads', engine: 'ff', at: 4 },
  { from: 'publish', to: 'prompt-store', kind: 'reads', engine: 'ff', at: 4 },
  { from: 'writ', to: 'director', kind: 'dispatch', engine: 'ff', at: 4 },

  /* ff — the foundry sub-graph hangs off build; baton self-loop (S5) */
  { from: 'build', to: 'foundry-prep', kind: 'child', engine: 'ff', at: 5 },
  { from: 'foundry-prep', to: 'foundry-takes', kind: 'pipeline', engine: 'ff', at: 5 },
  { from: 'foundry-takes', to: 'foundry-judges', kind: 'pipeline', engine: 'ff', at: 5 },
  { from: 'foundry-judges', to: 'foundry-synth', kind: 'pipeline', engine: 'ff', at: 5 },
  { from: 'build', to: 'build', kind: 'self-loop', engine: 'ff', at: 5, label: 'baton ≤3' },

  /* sx — the worker→orchestrator review loop over the ledger (S7) */
  { from: 'worker', to: 'orchestrator', kind: 'pipeline', engine: 'sx', at: 7,
    label: 'one task → STOP' },
  { from: 'orchestrator', to: 'worker', kind: 'replan', engine: 'sx', at: 7, curve: 34,
    label: 'next task' },
  { from: 'orchestrator', to: 'explore(k)', kind: 'replan', engine: 'sx', at: 7,
    label: 'design fork' },
  { from: 'orchestrator', to: 'STOP', kind: 'stop', engine: 'sx', at: 7 },
  { from: 'worker', to: 'ledger', kind: 'reads', engine: 'sx', at: 7 },
  { from: 'orchestrator', to: 'ledger', kind: 'reads', engine: 'sx', at: 7,
    label: 'sole writer' },

  /* sx — the loop produces the telling (S8) */
  { from: 'orchestrator', to: 'voice-pipeline', kind: 'produces', engine: 'sx', at: 8 },
];

/* ── Per-stratum roster + seed adds (fact-pack Part (a)) ──────────────────────
   Cumulative S2→S6; at S7 the roster RESETS to the scaffold engine's two seats
   (the creative-cycle roles are dormant) and seeds go frozen (ledger tasks). */
export const ROSTER_ADDS = {
  2: ['director', 'explorer', 'judge', 'builder', 'publisher', 'writer'],
  3: ['gardener', 'planter', 'groundskeeper', 'grounds-worker', 'bug-fixer'],
  4: ['steward'],
  5: ['foundry-prep', 'foundry-smith', 'foundry-judge', 'foundry-synth'],
  6: [],
  /* 7/8 handled by the reset below */
};
export const ROSTER_RESET = ['worker', 'orchestrator'];   /* S7/S8 */

export const SEED_ADDS = {
  2: ['exhibit', 'room', 'metagame', 'engine', 'curation', 'cross'],
  3: ['spark', 'rework'],
  4: ['writ'],
  5: ['rep', 'gate'],
  6: [],
  /* 7/8 frozen */
};

/* ── Per-stratum display meta: the "what changed" footer, the cadence chip, and
   the SHA cites (7-char provenance, from the fact-pack `cites`). ── */
export const STRATUM_META = {
  2: { cadence: 'prose', footer: 'The loop flares in: one phase grows into five seats the same rush; the agent is disposable now, the workflow persists.',
    cites: ['61a58bd', '56d117d', '8c7b5a6', 'a63ce06'] },
  3: { cadence: 'code', footer: 'Shape same, inputs changed: the cadence is code, the fuel is derived, the tracks dispatch the director.',
    cites: ['53fc21d', '435b5af', '2b32d19', '929219d', '0bbde43', '716cfb8'] },
  4: { cadence: 'code', footer: 'Seats go thin: the loop’s behavior becomes content in an external store.',
    cites: ['8baf9cb', '00549ef', '62488ce', '1c71fee'] },
  5: { cadence: 'code', footer: 'Reach: better than one agent (parallel takes), bigger than one turn (the baton).',
    cites: ['6192668', '9262f0d', '128d060', '0f9e1e6', '8f936d1', 'f67bbfc', '12dc3f8'] },
  6: { cadence: 'code', footer: 'Shape same, armor added: the atomic seal, the foundry semaphore, delight ranked first-order, the makers’ voice.',
    cites: ['1fcf669', '8ab10f5', '1ef76f0', 'a1f7280', 'e94fe1c', 'ba3a5d8'] },
  7: { cadence: 'parked', footer: 'The loop parks (temporarily); a worker → orchestrator engine over a ledger repairs the map and the hierarchy.',
    cites: ['f274ca7', '45909cb', '6d99133', '0ab6cb0'] },
  8: { cadence: 'parked', footer: 'The same engine builds the telling of the history that built it.',
    cites: ['305f815', '87b89e4', '6df8a99', '2f6ee4e', 'bcfe5d9'] },
};

/* ── cumulative roster / seed helpers (pure) ── */
export function rosterAt(k) {
  k = Math.round(Number(k) || 0);
  if (k >= 7) return ROSTER_RESET.slice();
  const out = [];
  for (let s = 2; s <= k; s++) for (const r of (ROSTER_ADDS[s] || [])) out.push(r);
  return out;
}
export function seedsAt(k) {
  k = Math.round(Number(k) || 0);
  if (k >= 7) return { kinds: [], frozen: true };
  const out = [];
  for (let s = 2; s <= k; s++) for (const r of (SEED_ADDS[s] || [])) out.push(r);
  return { kinds: out, frozen: false };
}

/* ── resolveState: the stratum k → the full diagram state (pure) ──────────────
   S1 (or any k<2) → null (no loop yet). Otherwise returns the visible nodes and
   edges (each tagged phase 'active'|'parked'), the cumulative roster + seed
   taxonomy, the parked flag, the cites, footer, and cadence. Deterministic:
   same k → identical state (the page morphs BETWEEN these; the twin validates
   each one). */
export function resolveState(k) {
  k = Math.round(Number(k) || 0);
  if (k < 2) return null;
  if (k > 8) k = 8;
  const parked = k >= 7;

  const nodes = [];
  for (const id in NODES) {
    const n = NODES[id];
    if (n.at > k) continue;
    if (n.engine === 'sx' && !parked) continue;
    const phase = (n.engine === 'ff' && parked) ? 'parked' : 'active';
    nodes.push({ id, phase });
  }

  const edges = [];
  for (const e of EDGES) {
    if (e.at > k) continue;
    if (e.engine === 'sx' && !parked) continue;
    const phase = (e.engine === 'ff' && parked) ? 'parked' : 'active';
    edges.push({ from: e.from, to: e.to, kind: e.kind, phase, at: e.at });
  }

  const meta = STRATUM_META[k] || { footer: '', cites: [], cadence: '' };
  return {
    stratum: k, parked,
    nodes, edges,
    roster: rosterAt(k),
    seeds: seedsAt(k),
    cites: (meta.cites || []).slice(),
    footer: meta.footer || '',
    cadence: meta.cadence || '',
  };
}

/* ── nodeLabel: the label for a node at stratum k (applies a morph override) ── */
export function nodeLabel(id, k) {
  const n = NODES[id]; if (!n) return '';
  if (n.morph) {
    for (let s = Math.round(Number(k) || 0); s >= 2; s--) {
      if (n.morph[s] && n.morph[s].label != null) return n.morph[s].label;
    }
  }
  return n.label;
}
/* ── nodeBadge: an active badge for a node at stratum k (e.g. the semaphore) ── */
export function nodeBadge(id, k) {
  const n = NODES[id]; if (!n || !n.morph) return '';
  for (let s = Math.round(Number(k) || 0); s >= 2; s--) {
    if (n.morph[s] && n.morph[s].badge != null) return n.morph[s].badge;
  }
  return '';
}

/* ── validateStates: the pure self-consistency battery (page + twin share it) ──
   Returns { ok, problems:[...] }. Checks, across S1…S8:
     V1 S1 resolves to null (no loop).
     V2 every edge endpoint is a declared node id, present in that state.
     V3 every edge kind ∈ EDGE_KINDS.
     V4 NO edge crosses engines (from.engine === to.engine) — the attribution
        guard, made structural.
     V5 node identities persist: the node set is monotone non-shrinking S2→S6 and
        again S7→S8 (nothing an era introduced disappears within its engine's run).
     V6 the parked flag is false for k≤6, true for k≥7; ff nodes are 'parked'
        exactly when k≥7.
     V7 every SHA cite is well-formed (7-char lowercase hex).
     V8 the fact-pack core nodes resolve: S2 has the five seats; S7 has worker +
        orchestrator + the two edge-endpoint hatches (explore(k), STOP). */
export function validateStates() {
  const problems = [];
  const P = (m) => problems.push(m);

  const s1 = resolveState(1);
  if (s1 !== null) P('V1 S1 should resolve to null (no loop), got a state');

  const HEX7 = /^[0-9a-f]{7}$/;
  let prevFf = new Set(), prevSx = new Set();

  for (let k = 2; k <= 8; k++) {
    const st = resolveState(k);
    if (!st) { P('V* S' + k + ' resolved null unexpectedly'); continue; }
    const ids = new Set(st.nodes.map((n) => n.id));

    for (const e of st.edges) {
      if (!ids.has(e.from)) P('V2 S' + k + ' edge from unknown/absent node ' + e.from);
      if (!ids.has(e.to)) P('V2 S' + k + ' edge to unknown/absent node ' + e.to);
      if (EDGE_KINDS.indexOf(e.kind) < 0) P('V3 S' + k + ' unknown edge kind ' + e.kind);
      const ef = NODES[e.from], et = NODES[e.to];
      if (ef && et && ef.engine !== et.engine) P('V4 S' + k + ' edge crosses engines: ' + e.from + '(' + ef.engine + ')→' + e.to + '(' + et.engine + ')');
    }

    // V6 parked semantics
    if (st.parked !== (k >= 7)) P('V6 S' + k + ' parked flag wrong');
    for (const n of st.nodes) {
      const eng = NODES[n.id].engine;
      const want = (eng === 'ff' && k >= 7) ? 'parked' : 'active';
      if (n.phase !== want) P('V6 S' + k + ' node ' + n.id + ' phase ' + n.phase + ' want ' + want);
    }

    // V5 persistence within each engine's run
    const ff = new Set(st.nodes.filter((n) => NODES[n.id].engine === 'ff').map((n) => n.id));
    const sx = new Set(st.nodes.filter((n) => NODES[n.id].engine === 'sx').map((n) => n.id));
    for (const id of prevFf) if (!ff.has(id)) P('V5 S' + k + ' dropped ff node ' + id);
    if (k >= 8) for (const id of prevSx) if (!sx.has(id)) P('V5 S' + k + ' dropped sx node ' + id);
    prevFf = ff; prevSx = sx;

    // V7 cites well-formed
    for (const c of st.cites) if (!HEX7.test(c)) P('V7 S' + k + ' malformed cite ' + c);
  }

  // V8 fact-pack anchors
  const S2 = new Set(resolveState(2).nodes.map((n) => n.id));
  for (const seat of ['director', 'explore', 'judge', 'build', 'publish'])
    if (!S2.has(seat)) P('V8 S2 missing seat ' + seat);
  const S7 = new Set(resolveState(7).nodes.map((n) => n.id));
  for (const req of ['worker', 'orchestrator', 'explore(k)', 'STOP'])
    if (!S7.has(req)) P('V8 S7 missing scaffold node ' + req);

  return { ok: problems.length === 0, problems };
}
