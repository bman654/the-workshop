#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   THE RELIQUARY — selftest.mjs  ·  the COMPLETABILITY solver (the ONLY claim)

   "The Sealed Room's Diary" proves no theorem. Its single claim — the delight
   register's fair-play analog of the Lantern's winnable-and-softlock-free solver —
   is that the mystery is SOLVABLE end to end: a player can walk the 3-clue chain
   from the empty start to the confession, every clue reachable, no clue gated on a
   ws: key nothing sets, the Gate reward reachable. This headless Node twin proves
   exactly that, and NOTHING more.

   It also carries the ANTI-DRIFT battery (Graft 2): it RE-DERIVES the chain's two
   magic numbers from the HOST code so they can never drift from the instruments —
     • the storm's commit count from museum/core.mjs busiestDay (→ 118),
     • the circumference from the STATED reduction (digit sum → 10),
     • the seeded ciphertext from the REAL scytale decipher (extracted from
       scytale/index.html), asserting it reads the C3-pointing plaintext ONLY on
       the derived rod (a wrong rod → gibberish),
     • the C3 search term resolving to the Reliquary's own card via card-catalog's
       real search + filterUnlocked (the "entry with no room", visible once entered).

   Run: node the-reliquary/selftest.mjs   (exit 0 iff every check passes)
   The in-page colophon pill runs the compact DAG half of this same battery.
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const checks = [];
function check(label, pass, detail) { checks.push({ label, pass: !!pass, detail: detail || '' }); }

/* ── load the chain (the SOLE authority for the DAG + numbers) ── */
const Chain = require(resolve(HERE, 'chain.js'));

/* ── load the host cores ──
   museum + card-catalog are ESM cores (import); scytale's core is an IIFE inside its
   index.html (no module) — extract + eval its exact bytes so we test the REAL cipher. */
const Museum = await import('file://' + resolve(ROOT, 'museum/core.mjs'));
const Catalog = await import('file://' + resolve(ROOT, 'card-catalog/core.mjs'));

function loadScytaleCore() {
  const src = readFileSync(resolve(ROOT, 'scytale/index.html'), 'utf8').split('\n');
  const s = src.findIndex((l) => l.indexOf('var CORE = (function () {') >= 0);
  if (s < 0) throw new Error('scytale CORE start not found');
  let e = -1;
  for (let i = s; i < src.length; i++) { if (src[i].trim() === '})();') { e = i; break; } }
  if (e < 0) throw new Error('scytale CORE end not found');
  const block = src.slice(s, e + 1).join('\n');
  // eval the exact IIFE bytes → the real decipher/encipher/clampC/cleanText
  return eval('(function(){ ' + block + ' return CORE; })()');
}
const Scytale = loadScytaleCore();

/* ════════════════════ PART A — THE DAG IS SOLVABLE ════════════════════════
   Model each node as a predicate over an abstract ws:key-set. Play the only legal
   action order (respecting `needs`), gathering each witness. Prove: every clue
   reached, the payoff reached, no dead key, carry types line up. */
{
  const N = Chain.NODES;
  const have = {};            // the abstract ws:key-set the player has gathered
  const minted = {};          // carry-types minted so far
  const order = [];
  let progress = true, guard = 0;
  while (order.length < N.length && progress && guard++ < 50) {
    progress = false;
    for (const n of N) {
      if (have[n.witness]) continue;
      const ready = n.needs.every((id) => { const d = Chain.node(id); return d && have[d.witness]; });
      if (ready) { have[n.witness] = true; order.push(n.id); if (n.carry) minted[n.carry.type] = true; progress = true; }
    }
  }
  check('every clue is reachable from the empty start by a legal action order',
    order.length === N.length, order.join(' → '));
  check('the payoff (all three witnesses) is reachable',
    have['ws:flag:dossier:saw-the-storm'] && have['ws:flag:dossier:read-the-strip'] && have['ws:flag:dossier:found-the-phantom'], '');

  // no clue gated on a ws: key no witness ever sets (no dead key / no softlock)
  const settable = new Set(N.map((n) => n.witness));
  let deadKey = null;
  for (const n of N) for (const id of n.needs) {
    const d = Chain.node(id);
    if (!d) deadKey = `${n.id} needs unknown ${id}`;
    else if (!settable.has(d.witness)) deadKey = `${n.id} needs unsettable ${d.witness}`;
  }
  check('no clue depends on a ws: key no witness sets (softlock-free)', deadKey === null, deadKey || 'clean');

  // the daisy-chain is a real chain: c1 → c2 → c3 (each needs exactly its predecessor)
  check('the chain is linear c1→c2→c3 (each clue needs its predecessor)',
    Chain.node('c1').needs.length === 0 &&
    Chain.node('c2').needs.length === 1 && Chain.node('c2').needs[0] === 'c1' &&
    Chain.node('c3').needs.length === 1 && Chain.node('c3').needs[0] === 'c2', '');

  // carry types line up: C1 mints the reliquary-key BEFORE C2 (which the key unlocks)
  const c1 = Chain.node('c1');
  check('C1 mints a reliquary-key before it is needed downstream',
    !!(c1.carry && c1.carry.type === 'reliquary-key' && minted['reliquary-key']), '');

  // the payoff key the final solve sets is the one the Gate + trophy read
  check('the payoff key is ws:seen:reliquary-solved', Chain.SOLVED_KEY === 'ws:seen:reliquary-solved', Chain.SOLVED_KEY);
}

/* ════════════════ PART B — THE NUMBERS RE-DERIVE FROM THE HOSTS ════════════
   The chain must not drift from the instruments it points at. Re-derive every
   magic number from the host code and assert the chain agrees. */
let stormCount, circumference;
{
  // (1) the storm's commit count, from the Museum's own busiestDay over cycles.json
  const raw = readFileSync(resolve(ROOT, 'museum/cycles.json'), 'utf8');
  const parsed = Museum.parseCycles(raw);
  const busy = Museum.busiestDay(parsed.events);
  stormCount = busy.count;
  check('the Museum still renders a storm day-band (busiestDay resolves)', !!busy && busy.count > 0, busy.day + ' · ' + busy.count);

  // (2) the circumference = the STATED reduction of that count (digit sum), the SAME
  //     arithmetic the chain + the museum witness perform
  circumference = Chain.circumferenceFor(stormCount);
  const wds = String(stormCount).split('').reduce((a, d) => a + (+d), 0);
  check('the circumference is the digit-sum of the storm count', circumference === wds, `digitSum(${stormCount})=${circumference}`);

  // (3) it is a LEGAL scytale rod (2..12) — and the RAW count clamps to a DIFFERENT
  //     (wrong) rod, so the reduction is load-bearing, not decoration
  check('the derived circumference is a legal scytale rod (2..12)',
    Scytale.clampC(circumference) === circumference && circumference >= 2 && circumference <= 12, 'C=' + circumference);
  check('the RAW storm count clamps to a DIFFERENT rod (so the reduction is required)',
    Scytale.clampC(stormCount) !== circumference, `clampC(${stormCount})=${Scytale.clampC(stormCount)} ≠ ${circumference}`);
}

/* ════════════ PART C — THE SEEDED STRIP DECODES ONLY ON THE RIGHT ROD ══════
   Re-derive the ciphertext from the plaintext via the REAL scytale core, assert the
   page's baked strip matches, and that it reads the C3-pointing plaintext ONLY on the
   derived rod (a wrong rod → not the plaintext). */
{
  const plain = Scytale.cleanText(Chain.C3_PLAINTEXT);
  const cipher = Scytale.encipher(plain, { mode: 'scytale', C: circumference });

  // the strip the page bakes (extract the SEEDED_CIPHERTEXT constant from the built page)
  const pageSrc = readFileSync(resolve(HERE, 'index.html'), 'utf8');
  const m = pageSrc.match(/SEEDED_CIPHERTEXT\s*=\s*'([A-Z]+)'/);
  const bakedStrip = m ? m[1] : null;
  check('the page bakes a seeded ciphertext strip', !!bakedStrip, bakedStrip ? bakedStrip.slice(0, 20) + '…' : 'MISSING');
  check('the baked strip == the plaintext enciphered on the derived rod (no drift)',
    bakedStrip === cipher, bakedStrip === cipher ? 'match' : 'DRIFT: baked≠derived');

  // the scytale strip chip loads the SAME bytes (host parity)
  const scy = readFileSync(resolve(ROOT, 'scytale/index.html'), 'utf8');
  check('the Scytale room bakes the identical strip (RELIQUARY_STRIP)',
    scy.indexOf(cipher) >= 0, scy.indexOf(cipher) >= 0 ? 'match' : 'DRIFT: scytale strip ≠ derived');

  // decodes to the C3-pointing plaintext on the RIGHT rod
  const readRight = Scytale.decipher(cipher, { mode: 'scytale', C: circumference });
  check('the strip reads plain on the derived rod', readRight === plain, '');
  check('the plaintext names the forgotten name (points at C3)',
    readRight.indexOf(Chain.FORGOTTEN_NAME.toUpperCase()) >= 0, Chain.FORGOTTEN_NAME);

  // a WRONG rod → gibberish (the decode is earned). Try every other legal rod.
  let anyWrongMatched = false;
  for (let c = 2; c <= 12; c++) {
    if (c === circumference) continue;
    if (Scytale.decipher(cipher, { mode: 'scytale', C: c }) === plain) anyWrongMatched = true;
  }
  check('NO wrong rod reads the strip plain (the decode is earned)', !anyWrongMatched, '');
}

/* ════════ PART D — C3 RESOLVES IN THE REGISTER (the entry with no room) ════
   The forgotten name resolves to the Reliquary's OWN catalog card — but only once
   the study is entered (ws:seen:reliquary), the fair-play gate. Use card-catalog's
   REAL search + filterUnlocked over the shipped slab. */
{
  const src = readFileSync(resolve(ROOT, 'card-catalog/index.src.html'), 'utf8');
  const B = '<!-- CATALOG-DATA BEGIN -->', E = '<!-- CATALOG-DATA END -->';
  const slab = JSON.parse(src.slice(src.indexOf(B) + B.length, src.indexOf(E)).trim());
  const term = Chain.FORGOTTEN_NAME;

  const storeOf = (keys) => { const map = {}; for (const k of keys) map[k] = '1'; return { ok: true, has: (k) => k in map, get: (k) => map[k], all: map }; };
  const sealed = storeOf([]);                          // never entered the study
  const entered = storeOf(['ws:seen:reliquary']);      // entered → the card is visible

  const hitsSealed = Catalog.search(Catalog.filterUnlocked(slab, sealed), term);
  const hitsEntered = Catalog.search(Catalog.filterUnlocked(slab, entered), term);

  check('the forgotten name is a real catalogued term (the Reliquary card carries it)',
    slab.some((r) => r.id === 'reliquary' && Catalog.searchText(r).toLowerCase().includes(term.toLowerCase())), term);
  check('C3 search resolves EXACTLY the Reliquary card once the study is entered',
    hitsEntered.length === 1 && hitsEntered[0].id === 'reliquary', hitsEntered.map((r) => r.id).join(','));
  check('C3 search resolves NOTHING before the study is entered (fair-play gate)',
    hitsSealed.length === 0, hitsSealed.map((r) => r.id).join(','));
}

/* ════════════════════════════ VERDICT ══════════════════════════════════════ */
const passN = checks.filter((c) => c.pass).length;
const all = passN === checks.length;
console.log('\n  THE RELIQUARY — completability + anti-drift self-test\n');
for (const c of checks) console.log('  ' + (c.pass ? '✓' : '✗') + ' ' + c.label + (c.detail ? '  — ' + c.detail : ''));
console.log('\n  ' + (all ? '✓ SOLVABLE — the diary can be read start → confession (' + passN + '/' + checks.length + ')'
                            : '✗ ' + passN + '/' + checks.length + ' — SEE FAILURES ABOVE') + '\n');
process.exit(all ? 0 : 1);
