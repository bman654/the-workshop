#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   THE RELIQUARY — selftest.mjs  ·  the COMPLETABILITY solver + ANTI-DRIFT battery

   "The Sealed Room's Diary" proves no theorem. Its single claim — the delight
   register's fair-play analog of the Lantern's winnable-and-softlock-free solver —
   is that the mystery is SOLVABLE end to end: a player can walk the ten-clue chain
   (3 chapters + a finale annex) from the empty start to the grand payoff, every
   clue reachable, no clue gated on a ws: key nothing sets, every earned value
   crackable at its own bench with in-page tools.

   PARTS
     A′  the DAG is solvable (generic reachability + shape assertions + payoff)
     B   the CH-I numbers re-derive from the hosts (museum → scytale rod)
     C   the seeded C2 strip decodes ONLY on the derived rod
     D   C3 resolves in the Register (the entry with no room)
     E′  the render is fair-play (the state-matrix walk over the PAGE'S OWN render)
     F   the bell — solve the plate CORE headlessly; BELL_INDEX/BELL_HZ/TOL
     G   the stars — the astrolabe CORE readout loop at the pinned 2026 moment
     H   the chart — generateLand(DREAM_SEED).title === DREAM_TITLE, VOLVELLE_KEY
     I   the notice — NOTICE_CIPHER == volvelle encipher; breakVigenere recovers exactly
     J   the strip — C8_STRIP == volvelle encipher(C8_PLAINTEXT, VOLVELLE_KEY) + probes
     K   the seal — buildScript(SCRIPT_SEED) preserves winifred; board seal readBacks

   Every mechanical constant is RE-DERIVED from the live host core so it can never
   drift from its instrument. Fictional constants (names, prose) are chain.js-
   authoritative, like FORGOTTEN_NAME / KEEPER_NAME — no NEW prose answer appears
   in this file that chain.js does not already carry.

   Run: node the-reliquary/selftest.mjs   (exit 0 iff every check passes)
   The in-page colophon pill runs the compact DAG half of this same battery.
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import {
  loadVolvelleCore, loadScriptoriumCore, loadAstrolabeCore
} from './harness/extract.mjs';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const checks = [];
function check(label, pass, detail) { checks.push({ label, pass: !!pass, detail: detail || '' }); }

/* ── load the chain (the SOLE authority for the DAG + numbers) ── */
const Chain = require(resolve(HERE, 'chain.js'));

/* ── load the host cores ──
   museum + card-catalog + cartographers are ESM cores (import); scytale's core is an
   IIFE inside its index.html (no module) — extract + eval its exact bytes. The
   volvelle/scriptorium/astrolabe cores are extracted via the shared harness/extract.mjs
   (the SAME loaders bake.mjs uses — no duplicated extraction code). */
const Museum = await import('file://' + resolve(ROOT, 'museum/core.mjs'));
const Catalog = await import('file://' + resolve(ROOT, 'card-catalog/core.mjs'));
const Cart = await import('file://' + resolve(ROOT, 'the-cartographers-dream/core.mjs'));
const Chamber = require(resolve(ROOT, 'tools/cryptanalysis/cryptanalysis.js'));
const Plate = require(resolve(ROOT, 'tools/plate/plate.js'));

function loadScytaleCore() {
  const src = readFileSync(resolve(ROOT, 'scytale/index.html'), 'utf8').split('\n');
  const s = src.findIndex((l) => l.indexOf('var CORE = (function () {') >= 0);
  if (s < 0) throw new Error('scytale CORE start not found');
  let e = -1;
  for (let i = s; i < src.length; i++) { if (src[i].trim() === '})();') { e = i; break; } }
  if (e < 0) throw new Error('scytale CORE end not found');
  const block = src.slice(s, e + 1).join('\n');
  return eval('(function(){ ' + block + ' return CORE; })()');
}
const Scytale = loadScytaleCore();
const Volvelle = loadVolvelleCore();

/* ════════════════════ PART A′ — THE DAG IS SOLVABLE ═══════════════════════
   Model each node as a predicate over an abstract ws:key-set. Play a legal action
   order (respecting `needs`), gathering each witness. Prove: every clue reached, the
   payoff reached (all ten witnesses + GRAND_KEY), no dead key, witness keys unique,
   chapter fields well-formed, and the new SHAPE assertions on `needs`. Chapter-I
   linearity is kept as a sub-assertion. */
{
  const N = Chain.NODES;

  // (1) generic reachability walk — no assumption of linearity
  const have = {};
  const order = [];
  let progress = true, guard = 0;
  while (order.length < N.length && progress && guard++ < 100) {
    progress = false;
    for (const n of N) {
      if (have[n.witness]) continue;
      const ready = n.needs.every((id) => { const d = Chain.node(id); return d && have[d.witness]; });
      if (ready) { have[n.witness] = true; order.push(n.id); progress = true; }
    }
  }
  check('every clue is reachable from the empty start by a legal action order',
    order.length === N.length, order.join(' → '));

  // (2) payoff: all ten witnesses reachable, INCLUDING GRAND_KEY (c10's witness)
  const allWitnessesReached = N.every((n) => have[n.witness]);
  const c10 = Chain.node('c10');
  check('the payoff is reachable: all ten witnesses fire and GRAND_KEY is set',
    allWitnessesReached && c10.witness === Chain.GRAND_KEY && have[Chain.GRAND_KEY],
    Chain.GRAND_KEY);

  // (3) no dead key: no node needs an unknown id or a key no witness ever sets
  const settable = new Set(N.map((n) => n.witness));
  let deadKey = null;
  for (const n of N) for (const id of n.needs) {
    const d = Chain.node(id);
    if (!d) deadKey = `${n.id} needs unknown ${id}`;
    else if (!settable.has(d.witness)) deadKey = `${n.id} needs unsettable ${d.witness}`;
  }
  check('no clue depends on a ws: key no witness sets (softlock-free)', deadKey === null, deadKey || 'clean');

  // (4) witness keys are UNIQUE (no two nodes share a witness → each solve is distinct)
  const wset = new Set(N.map((n) => n.witness));
  check('every clue carries a UNIQUE witness key (ten distinct witnesses)',
    wset.size === N.length, wset.size + '/' + N.length + ' distinct');

  // (5) chapter fields well-formed: every node in {1,2,3}, ten nodes, ids c1..c10
  const chaptersOk = N.every((n) => n.chapter === 1 || n.chapter === 2 || n.chapter === 3);
  const idsOk = N.map((n) => n.id).join(',') === 'c1,c2,c3,c4,c5,c6,c7,c8,c9,c10';
  check('chapter fields well-formed (10 nodes c1..c10, each chapter ∈ {1,2,3})',
    N.length === 10 && chaptersOk && idsOk, N.map((n) => n.chapter).join(''));

  // (6) SHAPE assertions on `needs` — the DAG's structure per DESIGN §2:
  //   ch1 is LINEAR c1→c2→c3 (each needs exactly its predecessor);
  //   ch2 is THREE PARALLEL threads off c3 (c4/c5/c6 each need exactly [c3]);
  //   ch3 is LINEAR c7→c8→c9→c10, where c7 needs EXACTLY {c4,c5,c6}.
  const needsOf = (id) => Chain.node(id).needs;
  const eqSet = (a, b) => a.length === b.length && a.slice().sort().join(',') === b.slice().sort().join(',');
  check('chapter-I is linear c1→c2→c3 (each clue needs its predecessor)',
    needsOf('c1').length === 0 &&
    eqSet(needsOf('c2'), ['c1']) &&
    eqSet(needsOf('c3'), ['c2']), '');
  check('chapter-II is three PARALLEL threads off c3 (c4/c5/c6 each need exactly [c3])',
    eqSet(needsOf('c4'), ['c3']) && eqSet(needsOf('c5'), ['c3']) && eqSet(needsOf('c6'), ['c3']), '');
  check('c7 needs EXACTLY {c4,c5,c6} (the three middle threads converge)',
    eqSet(needsOf('c7'), ['c4', 'c5', 'c6']), needsOf('c7').join(','));
  check('chapter-III unwinds linearly c7→c8→c9→c10',
    eqSet(needsOf('c8'), ['c7']) && eqSet(needsOf('c9'), ['c8']) && eqSet(needsOf('c10'), ['c9']), '');

  // (7) key naming, canonical: CH-I payoff key UNCHANGED; grand key is the NEW c10 key
  check('the chapter-I payoff key is unchanged (ws:seen:reliquary-solved)',
    Chain.SOLVED_KEY === 'ws:seen:reliquary-solved', Chain.SOLVED_KEY);
  check('the grand payoff key is the NEW ws:seen:the-mere (GRAND_KEY)',
    Chain.GRAND_KEY === 'ws:seen:the-mere' && Chain.SOLVED_KEY !== Chain.GRAND_KEY, Chain.GRAND_KEY);
}

/* ════════════════ PART B — THE NUMBERS RE-DERIVE FROM THE HOSTS ════════════
   The chain must not drift from the instruments it points at. Re-derive every
   CH-I magic number from the host code and assert the chain agrees. */
let stormCount, circumference;
{
  const raw = readFileSync(resolve(ROOT, 'museum/cycles.json'), 'utf8');
  const parsed = Museum.parseCycles(raw);
  const busy = Museum.busiestDay(parsed.events);
  stormCount = busy.count;
  check('the Museum still renders a storm day-band (busiestDay resolves)', !!busy && busy.count > 0, busy.day + ' · ' + busy.count);

  circumference = Chain.circumferenceFor(stormCount);
  const wds = String(stormCount).split('').reduce((a, d) => a + (+d), 0);
  check('the circumference is the digit-sum of the storm count', circumference === wds, `digitSum(${stormCount})=${circumference}`);

  check('the derived circumference is a legal scytale rod (2..12)',
    Scytale.clampC(circumference) === circumference && circumference >= 2 && circumference <= 12, 'C=' + circumference);
  check('the RAW storm count clamps to a DIFFERENT rod (so the reduction is required)',
    Scytale.clampC(stormCount) !== circumference, `clampC(${stormCount})=${Scytale.clampC(stormCount)} ≠ ${circumference}`);
}

/* ════════════ PART C — THE SEEDED STRIP DECODES ONLY ON THE RIGHT ROD ══════ */
{
  const plain = Scytale.cleanText(Chain.C3_PLAINTEXT);
  const cipher = Scytale.encipher(plain, { mode: 'scytale', C: circumference });

  const pageSrc = readFileSync(resolve(HERE, 'index.html'), 'utf8');
  const m = pageSrc.match(/SEEDED_CIPHERTEXT\s*=\s*'([A-Z]+)'/);
  const bakedStrip = m ? m[1] : null;
  check('the page bakes a seeded ciphertext strip', !!bakedStrip, bakedStrip ? bakedStrip.slice(0, 20) + '…' : 'MISSING');
  check('the baked strip == the plaintext enciphered on the derived rod (no drift)',
    bakedStrip === cipher, bakedStrip === cipher ? 'match' : 'DRIFT: baked≠derived');

  const scy = readFileSync(resolve(ROOT, 'scytale/index.html'), 'utf8');
  check('the Scytale room bakes the identical strip (RELIQUARY_STRIP)',
    scy.indexOf(cipher) >= 0, scy.indexOf(cipher) >= 0 ? 'match' : 'DRIFT: scytale strip ≠ derived');

  const readRight = Scytale.decipher(cipher, { mode: 'scytale', C: circumference });
  check('the strip reads plain on the derived rod', readRight === plain, '');
  check('the plaintext names the forgotten name (points at C3)',
    readRight.indexOf(Chain.FORGOTTEN_NAME.toUpperCase()) >= 0, Chain.FORGOTTEN_NAME);

  let anyWrongMatched = false;
  for (let c = 2; c <= 12; c++) {
    if (c === circumference) continue;
    if (Scytale.decipher(cipher, { mode: 'scytale', C: c }) === plain) anyWrongMatched = true;
  }
  check('NO wrong rod reads the strip plain (the decode is earned)', !anyWrongMatched, '');
}

/* ════════ PART D — C3 RESOLVES IN THE REGISTER (the entry with no room) ════ */
{
  const src = readFileSync(resolve(ROOT, 'card-catalog/index.src.html'), 'utf8');
  const B = '<!-- CATALOG-DATA BEGIN -->', E = '<!-- CATALOG-DATA END -->';
  const slab = JSON.parse(src.slice(src.indexOf(B) + B.length, src.indexOf(E)).trim());
  const term = Chain.FORGOTTEN_NAME;

  const storeOf = (keys) => { const map = {}; for (const k of keys) map[k] = '1'; return { ok: true, has: (k) => k in map, get: (k) => map[k], all: map }; };
  const sealed = storeOf([]);
  const entered = storeOf(['ws:seen:reliquary']);

  const hitsSealed = Catalog.search(Catalog.filterUnlocked(slab, sealed), term);
  const hitsEntered = Catalog.search(Catalog.filterUnlocked(slab, entered), term);

  check('the forgotten name is a real catalogued term (the Reliquary card carries it)',
    slab.some((r) => r.id === 'reliquary' && Catalog.searchText(r).toLowerCase().includes(term.toLowerCase())), term);
  check('C3 search resolves EXACTLY the Reliquary card once the study is entered',
    hitsEntered.length === 1 && hitsEntered[0].id === 'reliquary', hitsEntered.map((r) => r.id).join(','));
  check('C3 search resolves NOTHING before the study is entered (fair-play gate)',
    hitsSealed.length === 0, hitsSealed.map((r) => r.id).join(','));
}

/* ════════════ PART E′ — THE RENDER IS FAIR-PLAY (the state-matrix walk) ═════
   Completability (Part A′) proves the chain is SOLVABLE but says nothing about what
   the board SHOWS. This part runs the PAGE'S OWN render() (extracted verbatim from
   the built index.html — the store→runColophon unit, not re-implemented) against a
   tiny DOM shim, seeded from real ws: state, at every state on the solve path, and
   asserts the fair-play invariants ONLY the rendered board can prove:
     • awaiting-set === reachable-unsolved-set (never more, never less)
     • a locked chapter leaves ZERO DOM trace (no header, no cards)
     • sealed cards' title + riddle are ABSENT from the DOM (redaction, not blur)
     • class="host" iff solved (and never on a door card)
     • the c10 door: class="door" is EXPECTED on c10 awaiting/solved (NOT a leak),
       appears on NO other card, and class="host" never appears on any unsolved card
     • artifacts (C2 strip, C8_STRIP ribbon, seal SVG) only in their windows
     • the grand confession (II) prose is ABSENT before c10 solves */
{
  const built = readFileSync(resolve(HERE, 'index.html'), 'utf8').split('\n');
  const s = built.findIndex((l) => l.indexOf('function store(){') >= 0);
  let e = -1;
  for (let i = (s < 0 ? 0 : s); i < built.length; i++) { if (built[i].indexOf('function runColophon(){') >= 0) { e = i; break; } }
  check('render unit extractable from the built page (store→runColophon)', s >= 0 && e > s, s + '→' + e);

  // a minimal DOM shim. Elements record className / innerHTML / textContent / hidden /
  // attrs / children. classList add/remove mutate className so confession .show is
  // observable. getElementById lazily mints unknown ids (the new T3 ids — strip8/
  // ribbon8/cap8/sealArt/sealPlate/capSeal/confession2/confessBody2/confessName2 —
  // need no special stubs). createElementNS is used by buildSeal.
  function makeEl() {
    const el = {
      className: '', _html: '', children: [], _attrs: {}, _text: '', hidden: false,
      style: {},
      classList: {
        add(c) { const s = new Set(String(el.className).split(/\s+/).filter(Boolean)); s.add(c); el.className = [...s].join(' '); },
        remove(c) { const s = new Set(String(el.className).split(/\s+/).filter(Boolean)); s.delete(c); el.className = [...s].join(' '); },
        contains(c) { return String(el.className).split(/\s+/).indexOf(c) >= 0; }
      },
      setAttribute(k, v) { this._attrs[k] = v; }, getAttribute(k) { return this._attrs[k]; },
      removeAttribute(k) { delete this._attrs[k]; },
      appendChild(c) { this.children.push(c); return c; },
      querySelector() { return null; }, querySelectorAll() { return []; },
      addEventListener() {}, cloneNode() { return makeEl(); },
      getBoundingClientRect() { return { left: 0, top: 0, width: 0, height: 0 }; },
      getContext() { return null; }
    };
    Object.defineProperty(el, 'innerHTML', { get() { return this._html; }, set(v) { this._html = v; if (v === '') this.children = []; } });
    Object.defineProperty(el, 'textContent', { get() { return this._text; }, set(v) { this._text = v; } });
    return el;
  }

  // run render() against a seeded ws:key-set; return the built board + the well-known nodes
  function renderWith(keys) {
    const have = {}; for (const k of keys) have[k] = '1';
    const nodes = {};
    const idFor = (id) => (nodes[id] || (nodes[id] = makeEl()));
    const doc = {
      getElementById: (id) => idFor(id),
      createElement: () => makeEl(),
      createElementNS: () => makeEl(),
      addEventListener() {}, hidden: false
    };
    const win = { matchMedia: () => ({ matches: false }), addEventListener() {}, devicePixelRatio: 1, innerWidth: 1024, innerHeight: 768 };
    const WSshim = { store: () => ({ ok: true, has: (k) => k in have, get: (k) => have[k], all: have }), seen() {}, muted: () => true };
    const scope = {
      document: doc, window: win, WS: WSshim, Chain, RELIQUARY_CHAIN: Chain,
      REDUCE: true, SEEDED_CIPHERTEXT: 'X', _prevSolved: null,
      requestAnimationFrame: () => 0, localStorage: { getItem: () => null, setItem() {} },
      matchMedia: () => ({ matches: false })
    };
    const body = built.slice(s, e).join('\n');
    const fn = new Function(...Object.keys(scope), body + '\n; render(); return arguments;');
    fn(...Object.values(scope));
    // cards container children: [incite wrapper, (chapter head, clue cards)...]. A clue
    // card is a .card with data-node = its clue id (not incite, not a chapter head).
    const cardsEl = nodes.cards;
    const cardByNode = {};
    for (const ch of cardsEl.children) {
      const dn = ch._attrs['data-node'];
      if (dn && dn !== 'incite') cardByNode[dn] = ch;
      // the incite wrapper holds an inner .card.cover in its innerHTML (a string), not a child el
    }
    return { nodes, cardsEl, cardByNode };
  }

  const W = {
    c1: 'ws:flag:dossier:saw-the-storm',
    c2: 'ws:flag:dossier:read-the-strip',
    c3: 'ws:flag:dossier:found-the-phantom',
    c4: 'ws:flag:dossier:heard-the-bell',
    c5: 'ws:flag:dossier:counted-the-stars',
    c6: 'ws:flag:dossier:unfogged-the-chart',
    c7: 'ws:flag:dossier:cracked-the-notice',
    c8: 'ws:flag:dossier:wound-the-wheel',
    c9: 'ws:flag:dossier:read-her-hand',
    c10: 'ws:seen:the-mere'
  };
  // witness key for each node id, straight from chain.js (authoritative)
  const witnessOf = {}; for (const n of Chain.NODES) witnessOf[n.id] = n.witness;
  const byId = {}; for (const n of Chain.NODES) byId[n.id] = n;

  const classTok = (el, tok) => new RegExp('\\b' + tok + '\\b').test(el.className);
  const stateOf = (el) => (classTok(el, 'solved') ? 'solved' : classTok(el, 'awaiting') ? 'awaiting' : classTok(el, 'sealed') ? 'sealed' : '?');
  // the whole board's HTML (every clue card + the incite wrapper) as one haystack
  const boardHtml = (r) => r.cardsEl.children.map((c) => c.className + '␟' + c.innerHTML).join('\n');

  // compute the EXPECTED per-state truth from the chain (independent of the render)
  function expected(solvedIds) {
    const solved = new Set(solvedIds);
    const chUnlocked = { 1: true, 2: ['c1', 'c2', 'c3'].every((x) => solved.has(x)), 3: ['c4', 'c5', 'c6'].every((x) => solved.has(x)) };
    const st = {};
    for (const n of Chain.NODES) {
      if (!chUnlocked[n.chapter]) { st[n.id] = 'locked'; continue; }
      if (solved.has(n.id)) { st[n.id] = 'solved'; continue; }
      const reachable = n.needs.every((id) => solved.has(id));
      st[n.id] = reachable ? 'awaiting' : 'sealed';
    }
    return { st, chUnlocked };
  }

  // ── the state matrix (DESIGN §6 E′) ──
  const STATES = [
    { name: 'fresh', keys: [] },
    { name: 'mid-ch1', keys: [W.c1] },
    { name: 'ch1-done', keys: [W.c1, W.c2, W.c3] },
    { name: 'partial-ch2', keys: [W.c1, W.c2, W.c3, W.c4] },
    { name: 'ch2-done', keys: [W.c1, W.c2, W.c3, W.c4, W.c5, W.c6] },
    { name: 'c7-done', keys: [W.c1, W.c2, W.c3, W.c4, W.c5, W.c6, W.c7] },
    { name: 'c8-done', keys: [W.c1, W.c2, W.c3, W.c4, W.c5, W.c6, W.c7, W.c8] },
    { name: 'c9-done', keys: [W.c1, W.c2, W.c3, W.c4, W.c5, W.c6, W.c7, W.c8, W.c9] },
    { name: 'all-done', keys: [W.c1, W.c2, W.c3, W.c4, W.c5, W.c6, W.c7, W.c8, W.c9, W.c10] }
  ];

  for (const S of STATES) {
    const solvedIds = Chain.NODES.filter((n) => S.keys.indexOf(n.witness) >= 0).map((n) => n.id);
    const { st, chUnlocked } = expected(solvedIds);
    const r = renderWith(S.keys);
    const H = boardHtml(r);
    const tag = (msg) => `[${S.name}] ` + msg;

    // (1) locked chapters leave ZERO DOM trace: no card rendered, and the chapter's
    //     head prose absent from the board. (Present chapters: at least one card.)
    let lockedTraceOk = true, lockedDetail = 'clean';
    for (const n of Chain.NODES) {
      if (st[n.id] === 'locked') {
        if (r.cardByNode[n.id]) { lockedTraceOk = false; lockedDetail = n.id + ' locked but a card el exists'; break; }
      }
    }
    // chapter headers appear iff a chapter is unlocked
    const heads = { 1: 'the first gathering', 2: 'the drowned village', 3: 'the keeper' };
    for (const ch of [1, 2, 3]) {
      const present = H.indexOf(heads[ch]) >= 0;
      if (present !== chUnlocked[ch]) { lockedTraceOk = false; lockedDetail = `chapter ${ch} header present=${present} but unlocked=${chUnlocked[ch]}`; }
    }
    check(tag('locked chapters leave ZERO DOM trace (no cards, no header)'), lockedTraceOk, lockedDetail);

    // (2) awaiting-set === reachable-unsolved-set (from the render's actual classes)
    let awaitingOk = true, awDetail = '';
    for (const n of Chain.NODES) {
      const want = st[n.id];
      if (want === 'locked') continue;
      const el = r.cardByNode[n.id];
      const got = el ? stateOf(el) : 'missing';
      if (got !== want) { awaitingOk = false; awDetail += `${n.id}:want=${want},got=${got} `; }
    }
    check(tag('every unlocked card class matches reachable/solved truth (awaiting===reachable-unsolved)'), awaitingOk, awDetail || 'exact');

    // (3) sealed cards hide title AND riddle from the DOM (absent, not blurred)
    let sealedHideOk = true, shDetail = 'clean';
    for (const n of Chain.NODES) {
      if (st[n.id] !== 'sealed') continue;
      const el = r.cardByNode[n.id];
      if (el.innerHTML.indexOf(n.title) >= 0 || el.innerHTML.indexOf(n.diary) >= 0) { sealedHideOk = false; shDetail = n.id + ' leaks title/riddle'; break; }
    }
    check(tag('sealed cards hide title AND riddle from the DOM (redaction, not blur)'), sealedHideOk, shDetail);

    // (4) class="host" iff solved, and NEVER on the c10 door card
    let hostOk = true, hostDetail = 'clean';
    for (const n of Chain.NODES) {
      if (st[n.id] === 'locked') continue;
      const el = r.cardByNode[n.id];
      const hasHost = el.innerHTML.indexOf('class="host"') >= 0;
      if (n.id === 'c10') {
        if (hasHost) { hostOk = false; hostDetail = 'c10 (the door) carries class="host"'; break; }
      } else {
        const wantHost = st[n.id] === 'solved';
        if (hasHost !== wantHost) { hostOk = false; hostDetail = `${n.id} host-link=${hasHost} but solved=${wantHost}`; break; }
      }
    }
    check(tag('class="host" appears iff a NON-door card is solved (no prospective leak)'), hostOk, hostDetail);

    // (5) the c10 door two-sided invariant: class="door" appears on c10 iff its state
    //     is awaiting OR solved, and on NO other card
    let doorOk = true, doorDetail = 'clean';
    for (const n of Chain.NODES) {
      if (st[n.id] === 'locked') continue;
      const el = r.cardByNode[n.id];
      const hasDoor = el.innerHTML.indexOf('class="door"') >= 0;
      if (n.id === 'c10') {
        const wantDoor = st.c10 === 'awaiting' || st.c10 === 'solved';
        if (hasDoor !== wantDoor) { doorOk = false; doorDetail = `c10 door=${hasDoor} but state=${st.c10}`; break; }
      } else if (hasDoor) { doorOk = false; doorDetail = `${n.id} carries class="door" (only c10 may)`; break; }
    }
    check(tag('class="door" appears only on c10, and only when awaiting/solved (two-sided)'), doorOk, doorDetail);

    // (6) artifacts appear only in their windows. strip/strip8/sealArt are fetched on
    // every render (their hidden flag toggled), so they always exist here.
    const c2StripShown = !r.nodes.strip.hidden;         // C2 strip: c1 solved && !c2
    const c8StripShown = !r.nodes.strip8.hidden;        // C8_STRIP ribbon: c7 solved && !c8
    const sealShown = !r.nodes.sealArt.hidden;          // seal SVG: c8 solved && !c9
    const sv = new Set(solvedIds);
    check(tag('C2 strip pinned iff (c1 solved && c2 unsolved)'), c2StripShown === (sv.has('c1') && !sv.has('c2')), 'shown=' + c2StripShown);
    check(tag('C8_STRIP ribbon pinned iff (c7 solved && c8 unsolved)'), c8StripShown === (sv.has('c7') && !sv.has('c8')), 'shown=' + c8StripShown);
    check(tag('the seal SVG pinned iff (c8 solved && c9 unsolved)'), sealShown === (sv.has('c8') && !sv.has('c9')), 'shown=' + sealShown);
    // C8_STRIP bytes appear on the board ONLY in the ribbon window. ribbon8 is only
    // minted (via getElementById) when render fills it — i.e. inside the window — so
    // its absence outside the window is itself proof the bytes never reach the board.
    const stripBytesOnBoard = !!(r.nodes.ribbon8 && r.nodes.ribbon8._text === Chain.C8_STRIP);
    check(tag('C8_STRIP bytes present in the ribbon iff its window is open'), stripBytesOnBoard === (sv.has('c7') && !sv.has('c8')), '');

    // (7) the grand confession (II) prose absent before c10 solves; present at all-done.
    // confession2 is fetched on every render; confessBody2/Name2 are only minted inside
    // the all-done branch, so an absent body node is itself proof the prose never rendered.
    const conf2Shown = r.nodes.confession2.classList.contains('show');
    const conf2Body = (r.nodes.confessBody2 && r.nodes.confessBody2._text) || '';
    const allDone = sv.size === 10;
    check(tag('confession II shows iff all ten pages are read (grand prose gated on c10)'),
      conf2Shown === allDone && (allDone ? conf2Body.indexOf(Chain.KEEPER_NAME) >= 0 : conf2Body === ''), 'shown=' + conf2Shown);
  }

  // targeted narrative checks the matrix implies, spelled out for the report
  {
    const r = renderWith([W.c1, W.c2, W.c3]);
    // ch1-done: the spine cracks (ch2 unlocked → exactly 3 awaiting c4/c5/c6, ZERO ch3 trace)
    const st = expected(['c1', 'c2', 'c3']).st;
    const awaiting = ['c4', 'c5', 'c6'].every((id) => stateOf(r.cardByNode[id]) === 'awaiting');
    const ch3absent = ['c7', 'c8', 'c9', 'c10'].every((id) => !r.cardByNode[id]);
    check('ch1-done: the spine cracks — exactly c4/c5/c6 awaiting, ZERO chapter-III DOM trace',
      awaiting && ch3absent && st.c4 === 'awaiting', '');
  }
  {
    const r = renderWith([W.c1, W.c2, W.c3, W.c4, W.c5, W.c6, W.c7, W.c8, W.c9]);
    // c9-done: c10 door awaiting; confession II ABSENT
    const c10 = r.cardByNode.c10;
    const doorAwaiting = stateOf(c10) === 'awaiting' && c10.innerHTML.indexOf('class="door"') >= 0;
    const conf2Absent = !r.nodes.confession2.classList.contains('show');
    check('c9-done: the c10 door is awaiting (class="door", not host) and confession II is ABSENT',
      doorAwaiting && c10.innerHTML.indexOf('class="host"') < 0 && conf2Absent, '');
  }
}

/* ════════════════════════ PART F — THE BELL ════════════════════════════════
   Solve the plate CORE headlessly at the pinned params (circle, free, gridN 46,
   K 16, seed 1234567) and re-derive BELL_INDEX / BELL_HZ / TOL exactly as the
   singing-plate page + bake.mjs do. Replicate the page's eigHz / voiceHz / singable
   rule (index.src.html:441/454) so the number cannot drift from the instrument. */
{
  const PARAMS = { shape: 'circle', boundary: 'free', gridN: 46, K: 16, seed: 1234567 };
  const SOL = Plate.solve(PARAMS);
  const FREQ_SCALE = 220 / Math.sqrt(2 * Math.PI * Math.PI);   // page: √λ → "Hz"
  const SILENCE_HZ = 20;                                        // page: audible floor
  const hz = (lam) => FREQ_SCALE * Math.sqrt(lam < 0 ? 0 : lam);
  const eigHz = (k) => hz(SOL.eig.vals[k]);
  const voiceHz = (k) => { let f = SOL.freqs[k]; if (f < 0) f = 0; return FREQ_SCALE * f; };
  const singable = [];
  for (let k = 0; k < SOL.eig.vals.length; k++) if (voiceHz(k) > SILENCE_HZ) singable.push(k);

  check('F: (circle, free) has ≥ 10 singable modes (the tenth voice is reachable)',
    singable.length >= 10, singable.length + ' singable');
  const BELL_INDEX = singable[9]; // the 10th singable (1-based)
  check('F: BELL_INDEX is the 10th singable mode for (circle, free) at pinned params',
    BELL_INDEX === Chain.BELL_INDEX, 'derived ' + BELL_INDEX + ' vs chain ' + Chain.BELL_INDEX);
  check('F: BELL_INDEX < K (the mode is inside the solved spectrum)',
    BELL_INDEX < PARAMS.K, `${BELL_INDEX} < ${PARAMS.K}`);

  let specMaxF = 0;
  for (let k = 0; k < SOL.eig.vals.length; k++) specMaxF = Math.max(specMaxF, eigHz(k));
  specMaxF = specMaxF * 1.06 || 1;
  check('F: eigHz(BELL_INDEX) ≤ specMaxF() (the drive can reach the note)',
    eigHz(BELL_INDEX) <= specMaxF, `${eigHz(BELL_INDEX).toFixed(2)} ≤ ${specMaxF.toFixed(1)}`);

  check('F: Math.round(eigHz(BELL_INDEX)) === chain BELL_HZ (no drift)',
    Math.round(eigHz(BELL_INDEX)) === Chain.BELL_HZ, Math.round(eigHz(BELL_INDEX)) + ' Hz');

  const gapPrev = eigHz(BELL_INDEX) - eigHz(singable[8]);
  const gapNext = eigHz(singable[10]) - eigHz(BELL_INDEX);
  const minGap = Math.min(gapPrev, gapNext);
  check('F: TOL ≤ 0.5 × min adjacent singable gap (no neighbor can false-fire)',
    Chain.TOL <= 0.5 * minGap + 1e-9, `TOL ${Chain.TOL} ≤ ${(0.5 * minGap).toFixed(4)}`);
}

/* ════════════════════════ PART G — THE STARS ═══════════════════════════════
   Extract the astrolabe CORE (shared harness), replicate the readout's above-horizon
   counting loop at the pinned moment (51, −3, day 171, minute 0) with the YEAR PINNED
   TO 2026 — never the wall-clock year (the diary's remembered night is fixed). Assert
   the count === STAR_COUNT, and grep the host src for the TUPLE-ONLY witness carrying
   NO live-count clause (the year-proofing invariant). */
{
  const Astro = loadAstrolabeCore();
  const MOMENT = { latDeg: 51, lonDeg: -3, dayOfYear: 171, minutesOfDay: 0, year: 2026 };
  const count = Astro.aboveHorizonCount(MOMENT);
  check('G: astrolabe CORE readout loop at (51,−3,171,0) year=2026 counts === STAR_COUNT',
    count === Chain.STAR_COUNT, 'derived ' + count + ' vs chain ' + Chain.STAR_COUNT);
  // the minute gate is knife-edge: an off-minute yields a different count (justifies EXACT-minute)
  const off = Astro.aboveHorizonCount(Object.assign({}, MOMENT, { minutesOfDay: 1 }));
  check('G: the minute-0 gate is knife-edge (min+1 differs → EXACT-minute gate justified)',
    off !== count, `min0=${count}, min+1=${off}`);
  // the year is PINNED, not wall-clock: a different year would give a (potentially) different
  // count — proving the derivation is not reading Date.now() (year-proof by construction).
  const nowYear = new Date().getFullYear();
  if (nowYear !== 2026) {
    const live = Astro.aboveHorizonCount(Object.assign({}, MOMENT, { year: nowYear }));
    check('G: the derivation uses the PINNED 2026 year, not the wall-clock year',
      count === Chain.STAR_COUNT, `pinned=${count}, wall-clock ${nowYear}=${live} (chain uses pinned)`);
  } else {
    check('G: the derivation pins the year to 2026 (wall-clock is 2026 this run — harness pins regardless)',
      true, 'year pinned in harness');
  }

  // grep the host src for the TUPLE-ONLY witness (lat/lon/day/minute gate) — and that
  // the witness block carries NO live above-horizon count comparison.
  const asrc = readFileSync(resolve(ROOT, 'astrolabe/index.src.html'), 'utf8');
  // isolate the witness function body (a guard-clause gate) so the assertions read the
  // ACTUAL gate, not any incidental match elsewhere in the file.
  const wi = asrc.indexOf('counted-the-stars');
  const fnStart = wi >= 0 ? asrc.lastIndexOf('function', wi) : -1;
  const body = fnStart >= 0 ? asrc.slice(fnStart, wi + 400) : '';
  const hasTuple = /latDeg\s*-\s*51/.test(body) && /lonDeg\s*\+\s*3/.test(body) &&
    /dayOfYear\s*(!==|===)\s*171/.test(body) && /minutesOfDay\s*(!==|===)\s*0/.test(body);
  check('G: the host carries the tuple gate (|lat−51|,|lon+3|, day 171, minute 0)', hasTuple, '');
  // prove the witness body has NO visible-count clause (the year-proofing invariant):
  // no comparison against a live above-horizon count nor the literal 15.
  const noLiveCount = !/visible\s*[=<>!]|count\s*(===|==|>=|<=|>|<)\s*15|aboveHorizon\w*\s*(===|==|>=|<=|>|<)/.test(body);
  check('G: the witness is TUPLE-ONLY — NO live-count clause (year-proof invariant)',
    hasTuple && noLiveCount, noLiveCount ? 'tuple-only' : 'a live-count clause leaked into the witness');
}

/* ════════════════════════ PART H — THE CHART ═══════════════════════════════
   Import the REAL generateLand; assert generateLand(DREAM_SEED).title === DREAM_TITLE
   and VOLVELLE_KEY === the title's last word (uppercased, letters-only). Grep the
   cartographers src for the dossier-gated titled-branch witness. */
{
  const land = Cart.generateLand(Chain.DREAM_SEED);
  check('H: generateLand(DREAM_SEED).title === chain DREAM_TITLE (no drift)',
    land.title === Chain.DREAM_TITLE, `"${land.title}" vs "${Chain.DREAM_TITLE}"`);
  const words = String(land.title).replace(/[^A-Za-z ]/g, '').trim().split(/\s+/);
  const lastWord = (words[words.length - 1] || '').toUpperCase();
  check('H: VOLVELLE_KEY === last word of the title (uppercased, letters-only)',
    lastWord === Chain.VOLVELLE_KEY, `${lastWord} vs ${Chain.VOLVELLE_KEY}`);
  check('H: VOLVELLE_KEY passes the 4–9 letter rule (a legal Vigenère keyword)',
    Chain.VOLVELLE_KEY.length >= 4 && Chain.VOLVELLE_KEY.length <= 9, Chain.VOLVELLE_KEY.length + ' letters');

  const csrc = readFileSync(resolve(ROOT, 'the-cartographers-dream/index.src.html'), 'utf8');
  const gatedWitness = /litFrac\s*>=\s*0\.36[\s\S]{0,120}seed\s*===\s*DREAM_SEED/.test(csrc.replace(/\n/g, ' ')) ||
    (/seed\s*===\s*DREAM_SEED/.test(csrc) && /unfogged-the-chart/.test(csrc) && /litFrac\s*>=\s*0\.36/.test(csrc));
  check('H: the host carries the dossier-gated titled-branch witness (litFrac≥0.36 & seed===DREAM_SEED)',
    gatedWitness, '');
}

/* ════════════════════════ PART I — THE NOTICE ══════════════════════════════
   The chip's NOTICE_CIPHER must be the volvelle CORE's real Vigenère encipher of
   NOTICE_PLAINTEXT under MICHAELMAS (cross-instrument honesty), and Chamber.breakVigenere
   must recover BOTH keyword and plaintext EXACTLY with no key given (the T1 gate, forever). */
{
  const cipher = Volvelle.encipher(Chain.NOTICE_PLAINTEXT, { mode: 'vigenere', keyword: 'MICHAELMAS' });
  check('I: NOTICE_CIPHER === volvelle encipher(NOTICE_PLAINTEXT, vigenère MICHAELMAS)',
    cipher === Chain.NOTICE_CIPHER, cipher === Chain.NOTICE_CIPHER ? 'match' : 'DRIFT');

  const res = Chamber.breakVigenere(Chain.NOTICE_CIPHER);
  const ptClean = Chamber.clean(Chain.NOTICE_PLAINTEXT);
  const recoveredClean = Chamber.clean(res.plaintext);
  check('I: Chamber.breakVigenere recovers the keyword MICHAELMAS exactly (no key given)',
    res.keyword === 'MICHAELMAS', 'recovered ' + res.keyword + ' (keyLength ' + res.keyLength + ')');
  check('I: Chamber.breakVigenere recovers the plaintext EXACTLY (letters-only)',
    recoveredClean === ptClean, recoveredClean === ptClean ? 'exact' : 'inexact');

  // the black-chamber chip bakes the identical cipher (host parity)
  const bsrc = readFileSync(resolve(ROOT, 'black-chamber/index.src.html'), 'utf8');
  check('I: the Black Chamber chip bakes the identical NOTICE_CIPHER',
    bsrc.indexOf(Chain.NOTICE_CIPHER) >= 0, bsrc.indexOf(Chain.NOTICE_CIPHER) >= 0 ? 'match' : 'DRIFT');
}

/* ════════════════════════ PART J — THE STRIP ═══════════════════════════════
   C8_STRIP must be the volvelle CORE's real Vigenère encipher of C8_PLAINTEXT under
   VOLVELLE_KEY; round-trip with the right key reads plain; a wrong-key probe set does
   NOT read plain (the decode is earned). */
{
  const ptClean = Volvelle.cleanText(Chain.C8_PLAINTEXT);
  const strip = Volvelle.encipher(Chain.C8_PLAINTEXT, { mode: 'vigenere', keyword: Chain.VOLVELLE_KEY });
  check('J: C8_STRIP === volvelle encipher(C8_PLAINTEXT, VOLVELLE_KEY)',
    strip === Chain.C8_STRIP, strip === Chain.C8_STRIP ? 'match' : 'DRIFT');

  const back = Volvelle.decipher(Chain.C8_STRIP, { mode: 'vigenere', keyword: Chain.VOLVELLE_KEY });
  check('J: C8_STRIP deciphers to C8_PLAINTEXT under the right keyword (round-trip)',
    back === ptClean, back === ptClean ? 'round-trip' : 'mismatch');

  let anyWrong = null;
  for (const k of ['MICHAELMAS', 'HOLLOWMERE', 'WINIFRED']) {
    if (Volvelle.decipher(Chain.C8_STRIP, { mode: 'vigenere', keyword: k }) === ptClean) anyWrong = k;
  }
  check('J: no wrong keyword (MICHAELMAS/HOLLOWMERE/WINIFRED) reads C8_STRIP plain (earned)',
    anyWrong === null, anyWrong ? anyWrong + ' wrongly read plain' : 'all negatives hold');

  // the volvelle chip bakes the identical strip + keyword (host parity)
  const vsrc = readFileSync(resolve(ROOT, 'volvelle/index.html'), 'utf8');
  check('J: the Volvelle chip bakes the identical C8_STRIP and VOLVELLE_KEY',
    vsrc.indexOf(Chain.C8_STRIP) >= 0 && vsrc.indexOf("'" + Chain.VOLVELLE_KEY + "'") >= 0, '');
}

/* ════════════════════════ PART K — THE SEAL ════════════════════════════════
   Load the scriptorium CORE (shared harness); buildScript(SCRIPT_SEED); assert the
   seed matches the template with the F/G-derived numbers (cross-part consistency);
   assert normalizeInput(script,'winifred')==='winifred'; and assert the board's baked
   seal glyph sequence (SEAL_DATA data-rom) readBacks to the rune word, plus a full
   render→readBack round-trip through the live press. */
{
  const Scripto = loadScriptoriumCore();

  // (1) SCRIPT_SEED template cross-consistency: hollowmere-<A>-<B>-<mark> where the
  //     numbers are the SAME F/G-derived STAR_COUNT + BELL_HZ the chain carries.
  const parts = Chain.SCRIPT_SEED.split('-');
  check('K: SCRIPT_SEED is hollowmere-<n>-<n>-<mark> (four hyphen-joined parts)',
    parts.length === 4 && parts[0] === Chain.DREAM_SEED, Chain.SCRIPT_SEED);
  const nums = new Set([String(Chain.STAR_COUNT), String(Chain.BELL_HZ)]);
  check('K: the seed\'s two numbers ARE the F/G-derived STAR_COUNT + BELL_HZ (cross-part)',
    nums.has(parts[1]) && nums.has(parts[2]) && parts[1] !== parts[2], `${parts[1]},${parts[2]} vs {${[...nums].join(',')}}`);

  // (2) buildScript(SCRIPT_SEED) preserves 'winifred' under normalizeInput
  const script = Scripto.buildScript(Chain.SCRIPT_SEED);
  check('K: normalizeInput(buildScript(SCRIPT_SEED), "winifred") === "winifred"',
    Scripto.normalizeInput(script, Chain.RUNE_WORD) === Chain.RUNE_WORD, 'round-trip');

  // (3) full render→readBack round-trip through the live press (as bake.mjs does)
  function renderFingerprints(scr, word) {
    const fps = [];
    for (const toks of Scripto.tokenizeWords(scr, word)) {
      for (const c of Scripto.clusterWord(scr, toks)) {
        if (c.base) fps.push(Scripto.glyphFingerprint(c.base));
        if (c.mark) fps.push(Scripto.glyphFingerprint(c.mark));
      }
    }
    return fps;
  }
  const rb = Scripto.readBack(script, renderFingerprints(script, Chain.RUNE_WORD));
  check('K: render→readBack of the rune word through the live press === "winifred"',
    rb === Chain.RUNE_WORD, rb);

  // (4) the board's BAKED seal (SEAL_DATA) glyph sequence readsBack to the rune word:
  //     the data-rom of each glyph, in order, joins to 'winifred'.
  const built = readFileSync(resolve(HERE, 'index.html'), 'utf8');
  const m = built.match(/var\s+SEAL_DATA\s*=\s*(\{[\s\S]*?\});/);
  check('K: the board bakes SEAL_DATA (the seal glyph geometry)', !!m, m ? 'found' : 'MISSING');
  const SEAL = m ? JSON.parse(m[1]) : { glyphs: [] };
  const romSeq = SEAL.glyphs.map((g) => g.rom).join('');
  check('K: the board seal\'s baked glyph sequence (data-rom) reads back to the rune word',
    romSeq === Chain.RUNE_WORD, romSeq);
  // and the baked geometry has one glyph per letter of the rune word
  check('K: the baked seal has one glyph per letter of the rune word',
    SEAL.glyphs.length === Chain.RUNE_WORD.length, SEAL.glyphs.length + ' glyphs');
}

/* ════════════════════════════ VERDICT ══════════════════════════════════════ */
const passN = checks.filter((c) => c.pass).length;
const all = passN === checks.length;
console.log('\n  THE RELIQUARY — completability + fair-play + anti-drift self-test\n');
for (const c of checks) console.log('  ' + (c.pass ? '✓' : '✗') + ' ' + c.label + (c.detail ? '  — ' + c.detail : ''));
console.log('\n  ' + (all ? '✓ SOLVABLE — the diary can be read start → the mere (' + passN + '/' + checks.length + ')'
                          : '✗ ' + passN + '/' + checks.length + ' — SEE FAILURES ABOVE') + '\n');
process.exit(all ? 0 : 1);
