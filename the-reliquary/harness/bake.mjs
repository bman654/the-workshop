#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   THE RELIQUARY — harness/bake.mjs  ·  the WS3 mystery-chain derivation (DESIGN §4/§8 T1)

   Derives EVERY mechanical constant of the drowned-village / keeper's-hand chain
   directly from the LIVE host cores (never hand-typed), runs every DESIGN
   acceptance gate, generates the seal glyph SVG for the winning script, and writes
     ../../.claude/reference/workshop-design/03-mystery-chain/constants.json
     ../../.claude/reference/workshop-design/03-mystery-chain/constants-report.md   (report written by the caller/agent, not here)
   plus a rendered seal .svg sample beside this script for eyeballing.

   INDEPENDENT derivation: nothing here reads the critic's pre-verified numbers;
   we derive from the cores and the caller compares to expectations. Any gate that
   cannot pass under the DESIGN rules is a STOP (process exits non-zero with the
   evidence) — never paper over, never adjust story facts.

   Run: node the-reliquary/harness/bake.mjs
   ═══════════════════════════════════════════════════════════════════════════ */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { generateLand } from '../../the-cartographers-dream/core.mjs';
import { loadVolvelleCore, loadScriptoriumCore, loadAstrolabeCore } from './extract.mjs';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..');
// The sealed design dir lives in the user's ~/.claude reference tree (out of repo).
const SEALED = resolve(homedir(), '.claude', 'reference', 'workshop-design', '03-mystery-chain');

const gates = [];
function gate(name, pass, detail) {
  gates.push({ name, pass: !!pass, detail: detail || '' });
  const mark = pass ? '✓' : '✗ FAIL';
  console.log(`  ${mark} ${name}${detail ? '  (' + detail + ')' : ''}`);
}
function stop(msg) { console.error('\nSTOP — ' + msg); process.exit(1); }

const Plate = require(resolve(REPO, 'tools', 'plate', 'plate.js'));
const Chamber = require(resolve(REPO, 'tools', 'cryptanalysis', 'cryptanalysis.js'));
const Volvelle = loadVolvelleCore();
const Astro = loadAstrolabeCore();
const Scripto = loadScriptoriumCore();

console.log('═══ WS3 mystery-chain derivation (bake.mjs) ═══\n');

/* ════════════════════ c6 — DREAM_SEED / DREAM_TITLE / VOLVELLE_KEY ═════════ */
const DREAM_SEED = 'hollowmere';
const land = generateLand(DREAM_SEED);
const DREAM_TITLE = land.title;
const titleWords = DREAM_TITLE.replace(/[^A-Za-z ]/g, '').trim().split(/\s+/);
const VOLVELLE_KEY = titleWords[titleWords.length - 1].toUpperCase();
console.log('c6 — the chart before the flood');
gate('DREAM_SEED "hollowmere" → generateLand.title is a non-empty string', typeof DREAM_TITLE === 'string' && DREAM_TITLE.length > 0, DREAM_TITLE);
gate('VOLVELLE_KEY = last word of title, uppercased, letters-only', /^[A-Z]+$/.test(VOLVELLE_KEY), VOLVELLE_KEY);
gate('VOLVELLE_KEY passes the 4–9 letter rule', VOLVELLE_KEY.length >= 4 && VOLVELLE_KEY.length <= 9, VOLVELLE_KEY.length + ' letters');

/* ════════════════════ c4 — BELL_INDEX / BELL_HZ / TOL ═════════════════════ */
console.log('\nc4 — the bell under the water');
const PLATE_PARAMS = { shape: 'circle', boundary: 'free', gridN: 46, K: 16, seed: 1234567 };
const SOL = Plate.solve(PLATE_PARAMS);
const FREQ_SCALE = 220 / Math.sqrt(2 * Math.PI * Math.PI);   // page: √λ → "Hz" (index.src.html:441)
const SILENCE_HZ = 20;                                        // page: audible floor (index.src.html:454)
const hz = (lam) => FREQ_SCALE * Math.sqrt(lam < 0 ? 0 : lam);
const eigHz = (k) => hz(SOL.eig.vals[k]);
const voiceHz = (k) => { let f = SOL.freqs[k]; if (f < 0) f = 0; return FREQ_SCALE * f; };
// singable modes = the page's rule: voiceHz(k) > SILENCE_HZ (excludes the free-boundary DC mode)
const singable = [];
for (let k = 0; k < SOL.eig.vals.length; k++) if (voiceHz(k) > SILENCE_HZ) singable.push(k);
if (singable.length < 10) stop(`only ${singable.length} singable modes (< 10) — the tenth voice is unreachable`);
const BELL_INDEX = singable[9];                               // the 10th singable (1-based)
const BELL_HZ = Math.round(eigHz(BELL_INDEX));
const gapPrev = eigHz(BELL_INDEX) - eigHz(singable[8]);
const gapNext = eigHz(singable[10]) - eigHz(BELL_INDEX);
const minGap = Math.min(gapPrev, gapNext);
const TOL_RAW = 0.5 * minGap;
const TOL = Math.floor(TOL_RAW * 10) / 10;                    // DESIGN §8 T1: rounded DOWN to one decimal
let specMaxF = 0;
for (let k = 0; k < SOL.eig.vals.length; k++) specMaxF = Math.max(specMaxF, eigHz(k));
specMaxF = specMaxF * 1.06 || 1;
gate('BELL_INDEX is the 10th singable mode for (circle,free) at pinned params', BELL_INDEX === singable[9], 'index ' + BELL_INDEX);
gate('10 ≤ singable-mode count', singable.length >= 10, singable.length + ' singable');
gate('BELL_INDEX < K', BELL_INDEX < PLATE_PARAMS.K, `${BELL_INDEX} < ${PLATE_PARAMS.K}`);
gate('eigHz(BELL_INDEX) ≤ specMaxF()', eigHz(BELL_INDEX) <= specMaxF, `${eigHz(BELL_INDEX).toFixed(2)} ≤ ${specMaxF.toFixed(1)}`);
gate('BELL_HZ = Math.round(eigHz(BELL_INDEX))', Number.isInteger(BELL_HZ), BELL_HZ + ' Hz');
gate('TOL ≤ 0.5 × min adjacent singable gap', TOL <= TOL_RAW + 1e-9, `TOL ${TOL} ≤ ${TOL_RAW.toFixed(4)} (min gap ${minGap.toFixed(2)})`);

/* ════════════════════ c5 — STAR_COUNT ═════════════════════════════════════ */
console.log('\nc5 — the stars that stood witness');
const STAR_MOMENT = { latDeg: 51, lonDeg: -3, dayOfYear: 171, minutesOfDay: 0 };  // year defaults to live 2026
const STAR_COUNT = Astro.aboveHorizonCount(STAR_MOMENT);
// knife-edge probe: minute 0 must differ from an off-minute (justifies the EXACT-minute gate)
const cntPlus1 = Astro.aboveHorizonCount(Object.assign({}, STAR_MOMENT, { minutesOfDay: 1 }));
gate('STAR_COUNT derived at exactly (51,−3,171,0) via extracted CORE readout loop', Number.isInteger(STAR_COUNT), STAR_COUNT + ' stars');
gate('the minute-0 gate is knife-edge (count moves off minute 0 → exact gate justified)', STAR_COUNT !== cntPlus1, `min0=${STAR_COUNT}, min+1=${cntPlus1}`);

/* ════════════════════ c9 — SCRIPT_SEED search (order + MARK) ═══════════════ */
console.log('\nc9 — her seal, cut in her own hand');
const RUNE_WORD = 'winifred';
const MARK_BANK = ('wheel stone mill water bell star vellum lantern ash reed sail slate fern moss iron ' +
  'oak thorn hearth anchor grain chalk brook heron alder marrow wick tallow loom spool anvil cog ' +
  'sluice weir eel otter barley rye flint clay peat bracken gorse sedge rush osier withy keel prow ' +
  'mast net creel quern gable lintel sill thatch byre fold croft dyke furrow scythe sickle flail ' +
  'winnow chaff straw hay fleece wool card spindle shuttle warp weft dye madder woad indigo ochre ' +
  'umber lamp candle ember soot smoke steam frost rime thaw spring beck burn ghyll tarn mere pool ' +
  'ford bridge arch keystone mortar lime sand gravel pebble cobble shale granite quartz mica ' +
  'felspar galena tin copper bronze brass pewter silver').split(/\s+/);

// render RUNE_WORD → ordered glyph fingerprints (base + optional mark per cluster), then readBack
function renderFingerprints(script, word) {
  const fps = [];
  for (const toks of Scripto.tokenizeWords(script, word)) {
    for (const c of Scripto.clusterWord(script, toks)) {
      if (c.base) fps.push(Scripto.glyphFingerprint(c.base));
      if (c.mark) fps.push(Scripto.glyphFingerprint(c.mark));
    }
  }
  return fps;
}
function seedFor(order, mark) {
  const A = order === 'A' ? STAR_COUNT : BELL_HZ;
  const B = order === 'A' ? BELL_HZ : STAR_COUNT;
  return `${DREAM_SEED}-${A}-${B}-${mark}`;
}
// The search's first FULL hit (normalizeInput + readBack both === RUNE_WORD) wins.
// We scan the entire bank×orders so the recorded survival rate is honest (not
// truncated by early exit); the winner is still the FIRST hit in DESIGN order.
let winner = null, trials = 0, survivors = 0;
for (const order of ['A', 'B']) {
  for (const mark of MARK_BANK) {
    trials++;
    const seed = seedFor(order, mark);
    const script = Scripto.buildScript(seed);
    if (Scripto.normalizeInput(script, RUNE_WORD) !== RUNE_WORD) continue;
    survivors++;
    const rb = Scripto.readBack(script, renderFingerprints(script, RUNE_WORD));
    if (rb === RUNE_WORD && !winner) winner = { order, mark, seed, script };
  }
}
if (!winner) stop(`SCRIPT_SEED search exhausted the ${MARK_BANK.length}-word bank over both orders with NO hit — escalate to the designer session; never improvise`);
const SCRIPT_SEED = winner.seed;
gate('SCRIPT_SEED search found a first hit (order + MARK)', !!winner, `${winner.order} / "${winner.mark}" → ${SCRIPT_SEED}`);
gate('normalizeInput(buildScript(SCRIPT_SEED), "winifred") === "winifred"', Scripto.normalizeInput(winner.script, RUNE_WORD) === RUNE_WORD, 'round-trip A');
gate('render→readBack of the rune word === "winifred"', Scripto.readBack(winner.script, renderFingerprints(winner.script, RUNE_WORD)) === RUNE_WORD, 'round-trip B');
console.log(`    (search: ${survivors}/${trials} survived normalizeInput → ${(survivors / trials * 100).toFixed(1)}% before the first full hit)`);

/* ════════════════════ c9 — C8_PLAINTEXT finalization (order-matched) ═══════ */
const MARK_UP = winner.mark.toUpperCase();
// order A: "…THEN THE STARS THEN THE BELLS VOICE…"; order B swaps STARS/BELLS-VOICE
const starsClause = 'THEN THE STARS THEN THE BELLS VOICE';
const swapClause = 'THEN THE BELLS VOICE THEN THE STARS';
const seq = winner.order === 'A' ? starsClause : swapClause;
const C8_PLAINTEXT =
  `SEED THE WRITING PRESS WITH THE HOUSES FIRST NAME ${seq} THEN MY MARK WHICH IS ${MARK_UP} ` +
  `ALL SMALL JOINED WITH HYPHENS THEN OPEN THE KEY AND READ MY SEAL`;

/* ════════════════════ c7 — NOTICE_PLAINTEXT / NOTICE_CIPHER + acceptance gate ═ */
console.log('\nc7 — the notice under the wax');
const MICHAELMAS = 'MICHAELMAS';
const SPARE_BANK = [
  'NO PERSON SHALL RETURN TO THE VALLEY AFTER THE WATERS ARE RAISED NOR REMOVE ANY STONE THEREAFTER',
  'THE COMPANY ACCEPTS NO DUTY FOR BELLS LEFT HUNG NOR FOR ANY THING THE WATER KEEPS',
];
const NOTICE_BASE =
  `TO THE OCCUPIER OF HOLLOWMERE MILL IN THE VALLEY OF ${DREAM_TITLE} NOTICE IS HEREBY GIVEN THAT ` +
  `BY ORDER OF THE WATERWORKS COMPANY AND UNDER THE POWERS CONFERRED UPON IT BY ACT OF PARLIAMENT ` +
  `THE WATERS OF THE VALLEY WILL BE RAISED AT MICHAELMAS NEXT ALL WHEELS MUST STOP ALL HEARTHS BE ` +
  `QUENCHED AND ALL SOULS QUIT THE VALLEY BY THAT DAY THE CHURCH THE MILL AND ALL DWELLINGS BENEATH ` +
  `THE SURVEYED LINE WILL BE GIVEN TO THE WATER THE COMPANY WILL PAY FOR STONE CARTED UPHILL BUT ` +
  `NOT FOR NAMES AND NO CLAIM SHALL BE ENTERTAINED AFTER THE LAST DAY OF SEPTEMBER`;

// c7 gate: breakVigenere must recover keyword AND plaintext EXACTLY. If not, append
// spare clauses in order and re-test (never shorten, never change keyword).
function tryNotice(text) {
  const pt = Volvelle.cleanText(text);
  const cipher = Volvelle.encipher(text, { mode: 'vigenere', keyword: MICHAELMAS });
  const res = Chamber.breakVigenere(cipher);
  return { text, pt, cipher, res, ok: res.keyword === MICHAELMAS && res.plaintext === pt };
}
let notice = tryNotice(NOTICE_BASE);
let appended = 0;
while (!notice.ok && appended < SPARE_BANK.length) {
  notice = tryNotice(notice.text + ' ' + SPARE_BANK[appended]);
  appended++;
}
if (!notice.ok) stop('c7 acceptance gate FAILED — breakVigenere did not recover keyword+plaintext exactly even after appending both spare-bank clauses. STOP; escalate.');
const NOTICE_PLAINTEXT = notice.text;
const NOTICE_CIPHER = notice.cipher;
gate('NOTICE letters-only length (load-bearing)', notice.pt.length > 0, notice.pt.length + ' letters' + (appended ? `, +${appended} spare clause(s)` : ', no spare clauses needed'));
gate('Chamber.breakVigenere recovers keyword MICHAELMAS exactly', notice.res.keyword === MICHAELMAS, 'keyLength ' + notice.res.keyLength);
gate('Chamber.breakVigenere recovers plaintext EXACTLY (no key given)', notice.res.plaintext === notice.pt, 'exact');

/* ════════════════════ c8 — C8_STRIP bake + negatives ══════════════════════ */
console.log('\nc8 — the last pages, in her cipher');
const C8_PT_CLEAN = Volvelle.cleanText(C8_PLAINTEXT);
const C8_STRIP = Volvelle.encipher(C8_PLAINTEXT, { mode: 'vigenere', keyword: VOLVELLE_KEY });
const c8back = Volvelle.decipher(C8_STRIP, { mode: 'vigenere', keyword: VOLVELLE_KEY });
gate('C8_STRIP = volvelle encipher(C8_PLAINTEXT, vigenère VOLVELLE_KEY)', C8_STRIP.length === C8_PT_CLEAN.length, C8_STRIP.length + ' letters');
gate('C8_STRIP deciphers to C8_PLAINTEXT under VOLVELLE_KEY', c8back === C8_PT_CLEAN, 'round-trip');
const c8negatives = {};
let c8negOk = true;
for (const k of ['MICHAELMAS', 'HOLLOWMERE', 'WINIFRED']) {
  const reads = Volvelle.decipher(C8_STRIP, { mode: 'vigenere', keyword: k }) === C8_PT_CLEAN;
  c8negatives[k] = reads;
  if (reads) c8negOk = false;
}
gate('wrong-keyword probes (MICHAELMAS/HOLLOWMERE/WINIFRED) do NOT read plain', c8negOk, JSON.stringify(c8negatives));

/* ════════════════════ THE SEAL — SVG paths for RUNE_WORD in the winning hand ═ */
console.log('\nthe seal — SVG glyph paths in the winning script');
const seal = buildSealSVG(winner.script, RUNE_WORD);
gate('seal SVG generated (per-glyph path data + advances)', seal.glyphs.length === RUNE_WORD.length, `${seal.glyphs.length} glyphs, viewBox ${seal.viewBox}`);

/* ── SVG builder: replicate the page's drawGlyph geometry (slant shear + broad-nib
   weight modulation) into static SVG <path>/<circle>, one <g> per glyph advanced
   along the baseline. Uses ONLY the extracted strokePaths/nibWeight/cubic/quad so
   the seal cannot drift from the live press. Returns compact per-glyph data + a
   ready-to-inline <svg> string sample. */
function buildSealSVG(script, word) {
  const hand = script.hand;
  const M = hand.M;
  const s = 1;                                   // unit scale (viewBox in em units)
  const slant = (M.slant || 0) * Math.PI / 180;
  const shx = Math.tan(slant);
  const TX = (x, y) => (x + (M.baseline - y) * shx) * s;
  const TY = (y) => y * s;
  const strokeW = (ang) => (M.weight * Scripto.nibWeight(ang, hand) * s);
  const R2 = (n) => Math.round(n * 100) / 100;

  // one glyph → list of SVG primitives {kind, d?/cx,cy,r?, w} in em coords (pre-advance)
  function glyphPrims(g) {
    const prims = [];
    for (const st of g.strokes) {
      for (const seg of Scripto.strokePaths(st, M)) {
        if (seg.kind === 'line') {
          const ang = Math.atan2(seg.y2 - seg.y1, seg.x2 - seg.x1);
          prims.push({ kind: 'path', d: `M ${R2(TX(seg.x1, seg.y1))} ${R2(TY(seg.y1))} L ${R2(TX(seg.x2, seg.y2))} ${R2(TY(seg.y2))}`, w: R2(strokeW(ang)) });
        } else if (seg.kind === 'path') {
          // sample the d-language exactly as drawPathSeg does (10 steps/segment),
          // emit as a polyline path with per-subsegment nib weight.
          const pts = samplePath(seg.d);
          for (let k = 1; k < pts.length; k++) {
            const a = pts[k - 1], b = pts[k];
            const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
            prims.push({ kind: 'path', d: `M ${R2(TX(a[0], a[1]))} ${R2(TY(a[1]))} L ${R2(TX(b[0], b[1]))} ${R2(TY(b[1]))}`, w: R2(strokeW(ang)) });
          }
        } else if (seg.kind === 'ring') {
          const steps = 24, poly = [];
          for (let k = 0; k <= steps; k++) { const a = k / steps * Math.PI * 2; const px = seg.cx + Math.cos(a) * seg.r, py = seg.cy + Math.sin(a) * seg.r; poly.push(`${R2(TX(px, py))} ${R2(TY(py))}`); }
          prims.push({ kind: 'path', d: 'M ' + poly.join(' L '), w: R2(M.weight * 0.85 * s) });
        } else if (seg.kind === 'dot') {
          prims.push({ kind: 'dot', cx: R2(TX(seg.cx, seg.cy)), cy: R2(TY(seg.cy)), r: R2(seg.r * s), w: 0 });
        }
      }
    }
    return prims;
  }
  function samplePath(d) {
    const toks = d.match(/[MCQqmcl]|-?\d*\.?\d+/g);
    let i = 0, cx = 0, cy = 0; const num = () => parseFloat(toks[i++]);
    const out = [];
    while (i < toks.length) {
      const cmd = toks[i++];
      if (cmd === 'M') { cx = num(); cy = num(); out.push([cx, cy]); }
      else if (cmd === 'C') { const x1 = num(), y1 = num(), x2 = num(), y2 = num(), x = num(), y = num(); for (let t = 0; t <= 1.0001; t += 1 / 10) out.push(Scripto.cubic(cx, cy, x1, y1, x2, y2, x, y, t)); cx = x; cy = y; }
      else if (cmd === 'Q') { const x1 = num(), y1 = num(), x = num(), y = num(); for (let t = 0; t <= 1.0001; t += 1 / 10) out.push(Scripto.quad(cx, cy, x1, y1, x, y, t)); cx = x; cy = y; }
      else if (cmd === 'q') { const x1 = num() + cx, y1 = num() + cy, x = num() + cx, y = num() + cy; for (let t = 0; t <= 1.0001; t += 1 / 10) out.push(Scripto.quad(cx, cy, x1, y1, x, y, t)); cx = x; cy = y; }
      else if (cmd === 'l') { const x = num() + cx, y = num() + cy; out.push([x, y]); cx = x; cy = y; }
    }
    return out;
  }

  const advance = M.em;                          // one em box per glyph (alphabet: 1 glyph/letter)
  const glyphs = [];
  for (const toks of Scripto.tokenizeWords(script, word)) {
    for (const c of Scripto.clusterWord(script, toks)) {
      const rom = script.inverse.get(Scripto.glyphFingerprint(c.base));
      glyphs.push({ rom, advance, prims: glyphPrims(c.base) });
      if (c.mark) { const m = glyphPrims(c.mark); glyphs[glyphs.length - 1].markPrims = m; }
    }
  }
  const pad = 12;
  const width = glyphs.length * advance + pad * 2;
  const top = Math.min(M.ascender, M.xtop) - pad;
  const bot = M.descender + pad;
  const height = bot - top;
  const viewBox = `0 ${R2(top)} ${R2(width)} ${R2(height)}`;

  // assemble a ready-to-inline <svg> sample (strokes stroke, dots fill)
  let body = '';
  glyphs.forEach((gl, gi) => {
    const ox = pad + gi * advance;
    body += `  <g transform="translate(${ox},0)" data-rom="${gl.rom}">\n`;
    const emit = (prims) => prims.map((p) => p.kind === 'dot'
      ? `    <circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="#e9dcc0"/>`
      : `    <path d="${p.d}" stroke="#e9dcc0" stroke-width="${p.w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('\n');
    body += emit(gl.prims);
    if (gl.markPrims) body += '\n' + emit(gl.markPrims);
    body += '\n  </g>\n';
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="the keeper's seal — winifred">\n` +
    `  <rect x="0" y="${R2(top)}" width="${R2(width)}" height="${R2(height)}" fill="#161009"/>\n` +
    body + `</svg>\n`;

  return {
    hand: { name: hand.name, type: hand.type, join: hand.join },
    metrics: { em: M.em, baseline: M.baseline, xHeight: M.xHeight, xtop: M.xtop, ascender: M.ascender, descender: M.descender, slant: M.slant, weight: R2(M.weight), contrast: R2(M.contrast), nib: R2(M.nib), grid: M.grid },
    viewBox, width: R2(width), height: R2(height), top: R2(top), advance,
    glyphs: glyphs.map((g) => ({ rom: g.rom, advance: g.advance, prims: g.prims, markPrims: g.markPrims || null })),
    svg,
  };
}

/* ════════════════════ WRITE constants.json + seal sample ══════════════════ */
const constants = {
  _meta: {
    generatedBy: 'the-reliquary/harness/bake.mjs',
    generatedAt: new Date().toISOString(),
    note: 'Every value derived from the LIVE host cores; nothing hand-typed. See constants-report.md for gates + expected-vs-derived.',
    hostParams: { plate: PLATE_PARAMS, starMoment: Object.assign({ year: 2026 }, STAR_MOMENT), dreamSeed: DREAM_SEED },
  },
  // c6
  DREAM_SEED,
  DREAM_TITLE,
  VOLVELLE_KEY,
  // c4
  BELL_INDEX,
  BELL_HZ,
  TOL,
  TOL_RAW: Math.round(TOL_RAW * 10000) / 10000,
  BELL_HZ_EXACT: Math.round(eigHz(BELL_INDEX) * 10000) / 10000,
  SINGABLE_COUNT: singable.length,
  ADJ_SINGABLE_HZ: [Math.round(eigHz(singable[8]) * 100) / 100, Math.round(eigHz(BELL_INDEX) * 100) / 100, Math.round(eigHz(singable[10]) * 100) / 100],
  SPEC_MAX_F: Math.round(specMaxF * 10) / 10,
  // c5
  STAR_COUNT,
  STAR_MOMENT: Object.assign({ year: 2026 }, STAR_MOMENT),
  // c7
  MICHAELMAS,
  NOTICE_PLAINTEXT,
  NOTICE_PLAINTEXT_LETTERS_ONLY_LEN: notice.pt.length,
  NOTICE_CIPHER,
  NOTICE_SPARE_CLAUSES_APPENDED: appended,
  // c8
  C8_PLAINTEXT,
  C8_PLAINTEXT_LETTERS_ONLY_LEN: C8_PT_CLEAN.length,
  C8_STRIP,
  C8_WRONG_KEY_NEGATIVES: c8negatives,
  // c9
  RUNE_WORD,
  SCRIPT_SEED,
  SCRIPT_ORDER: winner.order,        // 'A' (STARS before BELLS VOICE) or 'B' (swapped)
  SCRIPT_MARK: winner.mark,
  SCRIPT_SURVIVAL: { trials, survivors, rate: Math.round(survivors / trials * 1000) / 10 },
  // c10 finale bell tone
  GRAND_KEY: 'ws:seen:the-mere',
  ANNEX_BELL_HZ: BELL_HZ,
  // the seal
  SEAL: seal,
};

writeFileSync(resolve(SEALED, 'constants.json'), JSON.stringify(constants, null, 2) + '\n');
writeFileSync(resolve(HERE, 'seal.sample.svg'), seal.svg);
console.log('\n  wrote ' + resolve(SEALED, 'constants.json'));
console.log('  wrote ' + resolve(HERE, 'seal.sample.svg') + '  (eyeball sample)');

const failed = gates.filter((g) => !g.pass);
console.log(`\n═══ ${gates.length - failed.length}/${gates.length} gates passed ═══`);
if (failed.length) { console.error('FAILED: ' + failed.map((g) => g.name).join('; ')); process.exit(1); }
console.log('\nDerived summary:');
console.log(`  DREAM_TITLE="${DREAM_TITLE}"  VOLVELLE_KEY=${VOLVELLE_KEY}`);
console.log(`  BELL_INDEX=${BELL_INDEX}  BELL_HZ=${BELL_HZ}  TOL=${TOL} (raw ${TOL_RAW.toFixed(4)})`);
console.log(`  STAR_COUNT=${STAR_COUNT}`);
console.log(`  NOTICE ${notice.pt.length} letters, keyword ${MICHAELMAS} recovered exact`);
console.log(`  SCRIPT_SEED=${SCRIPT_SEED} (order ${winner.order}, mark "${winner.mark}")`);
